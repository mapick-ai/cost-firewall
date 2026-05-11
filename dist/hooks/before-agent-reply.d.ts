/**
 * before_agent_reply hook handler
 *
 * Responsibilities:
 * - Emergency Stop blocking
 * - Daily Budget blocking
 * - Source Cooldown blocking
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