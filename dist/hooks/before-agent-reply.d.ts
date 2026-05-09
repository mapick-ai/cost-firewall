/**
 * before_agent_reply hook 处理
 *
 * 职责：
 * - Emergency Stop 阻断
 * - Daily Budget 阻断
 * - Source Cooldown 阻断
 */
import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
export interface BeforeAgentReplyEvent {
    agentId?: string;
    sessionId?: string;
    sessionKey?: string;
}
export interface BeforeAgentReplyCtx {
    agentId?: string;
    sessionId?: string;
}
export interface HandledReply {
    handled: true;
    reply: {
        text: string;
        isError: boolean;
    };
    reason: string;
}
export declare function createBeforeAgentReplyHandler(state: FirewallState, store: EventStore): (event: BeforeAgentReplyEvent, ctx: BeforeAgentReplyCtx) => Promise<HandledReply | undefined>;
//# sourceMappingURL=before-agent-reply.d.ts.map