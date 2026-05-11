/**
 * createStreamFn implementation
 *
 * Core: precheck before real upstream request is sent
 * SDK convention: createStreamFn(ctx) => async function*(model, context, options)
 */
import { parseMapickModelRef } from "./route.js";
import { resolveUpstreamAuth } from "./auth.js";
import { createBlockedStream } from "./synthetic.js";
import { streamOpenAi, getOpenAiBaseUrl } from "./upstream/openai.js";
import { streamAnthropic } from "./upstream/anthropic.js";
import { sourceFromProviderContext } from "../source.js";
import { estimateCost } from "../pricing.js";
export function createStreamFn(state, store, api) {
    // Return createStreamFn matching SDK signature
    // OpenClaw calls createStreamFn(ctx), returns async generator function
    return function (ctx) {
        return async function* stream(model, context, options) {
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
                    reason: result.reason,
                    layer: result.layer,
                });
                state.globalStats.todayBlocked++;
                state.globalStats.todaySavedEstimate += estimateCost(null, route.upstream, route.model);
                yield* createBlockedStream({
                    provider: route.upstream,
                    model: route.model,
                    reason: result.reason,
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
                let upstreamStream;
                if (route.upstream === "anthropic") {
                    upstreamStream = streamAnthropic({
                        apiKey: auth.apiKey,
                        model: route.model,
                        messages: context.messages ?? [],
                        ...options,
                    });
                }
                else {
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
                const cost = estimateCost({ prompt_tokens: inputTokens, completion_tokens: outputTokens }, route.upstream, route.model, responseStreamBytes);
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
            }
            catch (err) {
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
function categorizeError(err) {
    if (err.message.includes("timeout"))
        return "timeout";
    if (err.message.includes("ECONNRESET"))
        return "connection_reset";
    if (err.message.includes("ECONNREFUSED"))
        return "connection_closed";
    if (err.message.includes("401"))
        return "auth_error";
    if (err.message.includes("429"))
        return "rate_limit";
    if (err.message.includes("5"))
        return "server_error";
    return "unknown";
}
//# sourceMappingURL=stream.js.map