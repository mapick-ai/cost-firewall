/**
 * createStreamFn 实现
 *
 * 核心：在真实 upstream request 发出前做 precheck
 */

import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
import { parseMapickModelRef } from "./route.js";
import { resolveUpstreamAuth } from "./auth.js";
import { createBlockedStream } from "./synthetic.js";
import { streamOpenAi, getOpenAiBaseUrl } from "./upstream/openai.js";
import { streamAnthropic } from "./upstream/anthropic.js";
import { sourceFromProviderContext } from "../source.js";
import { estimateCost } from "../pricing.js";

export function createStreamFn(
  state: FirewallState,
  store: EventStore,
  api: any
) {
  return function mapickStream(model: string, context: any, options: any) {
    return async function* () {
      const route = parseMapickModelRef(model);
      if (!route) {
        throw new Error(`Invalid Mapick model reference: ${model}`);
      }

      const source = sourceFromProviderContext(context, route);

      // Precheck
      const decision = precheckRequest(state, source, route.upstream, route.model);

      if (!decision.allow) {
        store.append({
          type: "blocked",
          source,
          provider: route.upstream,
          model: route.model,
          reason: decision.reason,
          layer: "provider",
        });
        state.globalStats.todayBlocked++;
        state.globalStats.todaySavedEstimate += estimateCost(null, route.upstream, route.model);

        yield* createBlockedStream({
          provider: route.upstream,
          model: route.model,
          reason: decision.reason!,
          format: route.upstream === "anthropic" ? "anthropic" : "openai",
        });
        return;
      }

      // 获取 upstream auth
      const auth = await resolveUpstreamAuth(api, route.upstream, route.model);

      // 调用 upstream
      let inputTokens = 0;
      let outputTokens = 0;
      let responseStreamBytes = 0;

      try {
        let stream: AsyncGenerator<any>;

        if (route.upstream === "anthropic") {
          stream = streamAnthropic({
            apiKey: auth.apiKey,
            model: route.model,
            messages: context.messages ?? [],
            ...options,
          });
        } else {
          stream = streamOpenAi({
            baseUrl: getOpenAiBaseUrl(route.upstream),
            apiKey: auth.apiKey,
            model: route.model,
            messages: context.messages ?? [],
            ...options,
          });
        }

        for await (const chunk of stream) {
          responseStreamBytes += JSON.stringify(chunk).length;

          if (chunk.usage) {
            inputTokens = chunk.usage.prompt_tokens ?? inputTokens;
            outputTokens = chunk.usage.completion_tokens ?? outputTokens;
          }

          yield chunk;
        }

        // 记录成功
        const cost = estimateCost(
          { prompt_tokens: inputTokens, completion_tokens: outputTokens },
          route.upstream,
          route.model,
          responseStreamBytes
        );

        store.append({
          type: "model_call_ended",
          source,
          provider: route.upstream,
          model: route.model,
          outcome: "completed",
          estimatedCost: cost,
        });

        state.updateSourceStats(source, cost);
        state.breaker.recordSuccess(source);
      } catch (err: any) {
        store.append({
          type: "model_call_ended",
          source,
          provider: route.upstream,
          model: route.model,
          outcome: "error",
          failureKind: categorizeError(err),
        });

        state.breaker.recordFailure(source);
        throw err;
      }
    };
  };
}

function precheckRequest(
  state: FirewallState,
  source: string,
  upstream: string,
  model: string
): { allow: boolean; reason?: string } {
  if (state.globalStats.emergencyStop) {
    return { allow: false, reason: "emergency_stop" };
  }

  if (state.isBudgetExceeded()) {
    return { allow: false, reason: "daily_budget_exceeded" };
  }

  if (state.breaker.isCoolingDown(source)) {
    return { allow: false, reason: state.breaker.getBlockedReason(source) };
  }

  return { allow: true };
}

function categorizeError(err: Error): string {
  if (err.message.includes("timeout")) return "timeout";
  if (err.message.includes("ECONNRESET")) return "connection_reset";
  if (err.message.includes("ECONNREFUSED")) return "connection_closed";
  if (err.message.includes("401")) return "auth_error";
  if (err.message.includes("429")) return "rate_limit";
  if (err.message.includes("5")) return "server_error";
  return "unknown";
}
