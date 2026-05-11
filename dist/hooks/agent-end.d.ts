/**
 * agent_end hook handler
 *
 * Responsibilities:
 * - Run finalization stats
 * - Delayed cleanup of run state
 */
import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
export interface AgentEndEvent {
    runId?: string;
    agentId?: string;
    sessionId?: string;
    sessionKey?: string;
    outcome?: "success" | "error";
}
export declare function createAgentEndHandler(state: FirewallState, store: EventStore): (event: AgentEndEvent, ctx: any) => void;
//# sourceMappingURL=agent-end.d.ts.map