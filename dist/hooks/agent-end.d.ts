/**
 * agent_end hook 处理
 *
 * 职责：
 * - run 收尾统计
 * - 延迟清理 run state
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