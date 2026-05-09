/**
 * model_call_started / model_call_ended hook 处理
 *
 * 职责：
 * - 记录每次 LLM call 的 metadata
 * - 估算费用
 * - 更新 breaker 状态
 * - 写入事件日志
 */
import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
export interface ModelCallStartedEvent {
    runId: string;
    callId: string;
    sessionKey?: string;
    sessionId?: string;
    provider: string;
    model: string;
    api?: string;
    transport?: string;
}
export interface ModelCallEndedEvent extends ModelCallStartedEvent {
    durationMs: number;
    outcome: "completed" | "error";
    errorCategory?: string;
    failureKind?: "aborted" | "connection_closed" | "connection_reset" | "terminated" | "timeout";
    requestPayloadBytes?: number;
    responseStreamBytes?: number;
    timeToFirstByteMs?: number;
    upstreamRequestIdHash?: string;
}
export declare function createModelCallStartedHandler(state: FirewallState, store: EventStore): (event: ModelCallStartedEvent, ctx: any) => void;
export declare function createModelCallEndedHandler(state: FirewallState, store: EventStore): (event: ModelCallEndedEvent, ctx: any) => void;
//# sourceMappingURL=model-call.d.ts.map