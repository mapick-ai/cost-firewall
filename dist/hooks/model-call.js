/**
 * model_call_started / model_call_ended hook 处理
 *
 * 职责：
 * - 记录每次 LLM call 的 metadata
 * - 估算费用
 * - 更新 breaker 状态
 * - 写入事件日志
 */
import { estimateCost } from "../pricing.js";
import { sourceFromModelCall } from "../source.js";
export function createModelCallStartedHandler(state, store) {
    return function handleModelCallStarted(event, ctx) {
        const source = sourceFromModelCall(event, ctx);
        const run = state.getOrCreateRun(event.runId, source, event.sessionId, event.sessionKey);
        state.addCallToRun(event.runId, event.callId, {
            callId: event.callId,
            provider: event.provider,
            model: event.model,
            api: event.api,
            transport: event.transport,
            startedAt: Date.now(),
        });
        run.llmCallTimestamps.push(Date.now());
    };
}
export function createModelCallEndedHandler(state, store) {
    return function handleModelCallEnded(event, ctx) {
        const source = sourceFromModelCall(event, ctx);
        const run = state.getOrCreateRun(event.runId, source, event.sessionId, event.sessionKey);
        const estimatedCost = estimateCost(null, event.provider, event.model, event.responseStreamBytes);
        const call = run.calls.get(event.callId);
        if (call) {
            call.durationMs = event.durationMs;
            call.outcome = event.outcome;
            call.errorCategory = event.errorCategory;
            call.failureKind = event.failureKind;
            call.requestPayloadBytes = event.requestPayloadBytes;
            call.responseStreamBytes = event.responseStreamBytes;
            call.estimatedCost = estimatedCost;
        }
        if (event.outcome === "error") {
            state.breaker.recordFailure(source);
        }
        else {
            state.breaker.recordSuccess(source);
        }
        state.updateRunCost(event.runId, estimatedCost);
        state.updateSourceStats(source, estimatedCost);
        store.append({
            type: "model_call_ended",
            runId: event.runId,
            callId: event.callId,
            source,
            provider: event.provider,
            model: event.model,
            outcome: event.outcome,
            failureKind: event.failureKind,
            estimatedCost,
        });
    };
}
//# sourceMappingURL=model-call.js.map