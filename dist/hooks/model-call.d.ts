/**
 * model_call_started / model_call_ended hook handler
 *
 * Responsibilities:
 * - Record metadata for each LLM call
 * - Estimate cost
 * - Update breaker state
 * - Write event log
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
    usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
    };
}
export declare function createModelCallStartedHandler(state: FirewallState, store: EventStore): (event: ModelCallStartedEvent, ctx: any) => void;
export declare function createModelCallEndedHandler(state: FirewallState, store: EventStore): (event: ModelCallEndedEvent, ctx: any) => void;
//# sourceMappingURL=model-call.d.ts.map