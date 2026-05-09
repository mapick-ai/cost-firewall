/**
 * Provider 注册入口
 *
 * mapick/<upstream>/<model> 路由
 * - catalog: 声明模型目录
 * - resolveDynamicModel: 动态接受任意 upstream model ID
 * - createStreamFn: precheck + upstream 转发
 */

import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
import { parseMapickModelRef } from "./route.js";
import { resolveUpstreamAuth } from "./auth.js";
import { createBlockedStream } from "./synthetic.js";
import { streamOpenAi, getOpenAiBaseUrl } from "./upstream/openai.js";
import { streamAnthropic } from "./upstream/anthropic.js";
import { estimateCost } from "../pricing.js";

function categorizeError(err: Error): string {
  const m = err?.message ?? String(err);
  if (m.includes("timeout") || m.includes("ETIMEDOUT")) return "timeout";
  if (m.includes("401") || m.includes("Unauthorized")) return "auth_error";
  if (m.includes("429") || m.includes("rate")) return "rate_limit";
  if (m.includes("403") || m.includes("Forbidden")) return "access_denied";
  if (/^5\d\d/.test(m) || m.includes("server")) return "server_error";
  if (m.includes("ECONNREFUSED") || m.includes("ECONNRESET")) return "connection_closed";
  if (m.includes("fetch")) return "network_error";
  return "unknown";
}

export function registerProvider(
  api: any,
  state: FirewallState,
  store: EventStore
): void {
  api.registerProvider({
    id: "mapick",
    label: "Mapick Cost Firewall",
    envVars: [],
    auth: [],

    catalog: {
      order: "simple",
      run: async (_ctx: any) => ({
        provider: {
          api: "openai-completions",
          baseUrl: "https://api.mapick.ai/v1",
          apiKey: "mapick-firewall-plugin",
          models: [{
            id: "mapick-default",
            name: "Mapick Firewall Passthrough",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          }],
        },
      }),
    },

    resolveDynamicModel: (ctx: any) => {
      const modelId = ctx.modelId;
      const fullModel = modelId.startsWith("mapick/") ? modelId.slice("mapick/".length) : modelId;
      return {
        id: modelId,
        name: `Mapick → ${fullModel}`,
        provider: "mapick",
        api: "openai-completions",
        baseUrl: "https://api.mapick.ai/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0 },
        contextWindow: 200000,
        maxTokens: 8192,
      };
    },

    createStreamFn() {
      const self = this;
      return async function* stream(model: any, context: any, options: any) {
        // model 可能来自 ctx，直接使用 catalog + resolveDynamicModel 提供的 model
        const modelId = typeof model === "string" ? model : model?.id ?? "";
        const route = parseMapickModelRef(modelId);
        if (!route) throw new Error(`Invalid Mapick model reference: ${modelId}`);

        // Precheck — Emergency Stop
        if (state.globalStats.emergencyStop) {
          state.globalStats.todayBlocked++;
          store.append({ type: "blocked", provider: route.upstream, model: route.model, reason: "emergency_stop", layer: "provider" });
          yield* createBlockedStream({
            provider: route.upstream, model: route.model, reason: "emergency_stop",
            format: route.upstream === "anthropic" ? "anthropic" : "openai",
          });
          return;
        }

        // Precheck — Budget
        if (state.isLimitExceeded()) {
          state.globalStats.todayBlocked++;
          store.append({ type: "blocked", provider: route.upstream, model: route.model, reason: "daily_token_limit", layer: "provider" });
          yield* createBlockedStream({
            provider: route.upstream, model: route.model, reason: "daily_token_limit",
            format: route.upstream === "anthropic" ? "anthropic" : "openai",
          });
          return;
        }

        // Precheck — Cooldown
        const src = route.upstream;
        if (state.breaker.isCoolingDown(src)) {
          state.globalStats.todayBlocked++;
          const reason = state.breaker.getBlockedReason(src) ?? "source_cooldown";
          store.append({ type: "blocked", provider: route.upstream, model: route.model, reason, layer: "provider" });
          yield* createBlockedStream({
            provider: route.upstream, model: route.model, reason,
            format: route.upstream === "anthropic" ? "anthropic" : "openai",
          });
          return;
        }

        // Resolve upstream auth
        const auth = await resolveUpstreamAuth(api, route.upstream, route.model);

        let inputTokens = 0; let outputTokens = 0; let responseStreamBytes = 0;
        try {
          const s = route.upstream === "anthropic"
            ? streamAnthropic({ apiKey: auth.apiKey, model: route.model, messages: context?.messages ?? [], ...options })
            : streamOpenAi({ baseUrl: getOpenAiBaseUrl(route.upstream), apiKey: auth.apiKey, model: route.model, messages: context?.messages ?? [], ...options });

          for await (const chunk of s) {
            responseStreamBytes += JSON.stringify(chunk).length;
            if (chunk.usage) { inputTokens = chunk.usage.prompt_tokens ?? inputTokens; outputTokens = chunk.usage.completion_tokens ?? outputTokens; }
            yield chunk;
          }

          const cost = estimateCost({ prompt_tokens: inputTokens, completion_tokens: outputTokens }, route.upstream, route.model, responseStreamBytes);
          store.append({ type: "model_call_ended", provider: route.upstream, model: route.model, outcome: "completed", estimatedCost: cost });
          state.updateSourceStats(src, cost);
          state.breaker.recordSuccess(src);
        } catch (err: any) {
          const msg = err?.message ?? String(err);
          store.append({ type: "model_call_ended", provider: route.upstream, model: route.model, outcome: "error", failureKind: categorizeError(err), reason: msg.slice(0, 200) });
          state.breaker.recordFailure(src);
          throw err;
        }
      };
    },
  });
}
