/**
 * stream.ts — removed. Provider Layer uses inline createStreamFn in provider/index.ts.
 * This file was dead code with no imports.
 */
export {};


import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
import { parseMapickModelRef } from "./route.js";
import { resolveUpstreamAuth } from "./auth.js";
import { createBlockedStream } from "./synthetic.js";
import { streamOpenAi, getOpenAiBaseUrl } from "./upstream/openai.js";
import { streamAnthropic } from "./upstream/anthropic.js";
import { sourceFromProviderContext } from "../source.js";
import { estimateTokens } from "../pricing.js";

export function createStreamFn(
  state: FirewallState,
  store: EventStore,
  api: any
) {
  // Return createStreamFn matching SDK signature
  // OpenClaw calls createStreamFn(ctx), returns async generator function
  return function (ctx: any) {
    return async function* stream(model: string, context: any, options: any) {
      const route = parseMapickModelRef(model);
      if (!route) {
        throw new Error(`Invalid Mapick model reference: ${model}`);
      }

      const source = sourceFromProviderContext({ ...context, ...ctx }, route);

      // Precheck
      const result = state.precheck(source);

      if (!result.allow) {
        store.append({
          type: "blocked",
          source,
          provider: route.upstream,
          model: route.model,
          reason: result.reason!,
          layer: result.layer,
        });
        state.globalStats.todayBlocked++;
        state.globalStats.todaySavedEstimate += estimateTokens(null, route.upstream, route.model);

        yield* createBlockedStream({
          provider: route.upstream,
          model: route.model,
          reason: result.reason!,
          format: route.upstream === "anthropic" ? "anthropic" : "openai",
        });
        return;
      }

      // Get upstream auth
      const auth = await resolveUpstreamAuth(api, route.upstream, route.model);

      // Call upstream
      let inputTokens = 0;
      let outputTokens = 0;
      let responseStreamBytes = 0;

      try {
        let upstreamStream: AsyncGenerator<any>;

        if (route.upstream === "anthropic") {
          upstreamStream = streamAnthropic({
            apiKey: auth.apiKey,
            model: route.model,
            messages: context.messages ?? [],
            ...options,
          });
        } else {
          upstreamStream = streamOpenAi({
            baseUrl: getOpenAiBaseUrl(route.upstream),
            apiKey: auth.apiKey,
            model: route.model,
            messages: context.messages ?? [],
            ...options,
          });
        }

        for await (const chunk of upstreamStream) {
          responseStreamBytes += JSON.stringify(chunk).length;

          if (chunk.usage) {
            inputTokens = chunk.usage.prompt_tokens ?? inputTokens;
            outputTokens = chunk.usage.completion_tokens ?? outputTokens;
          }

          yield chunk;
        }

        const cost = estimateTokens(
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

function categorizeError(err: Error): string {
  if (err.message.includes("timeout")) return "timeout";
  if (err.message.includes("ECONNRESET")) return "connection_reset";
  if (err.message.includes("ECONNREFUSED")) return "connection_closed";
  if (err.message.includes("401")) return "auth_error";
  if (err.message.includes("429")) return "rate_limit";
  if (err.message.includes("5")) return "server_error";
  return "unknown";
}
