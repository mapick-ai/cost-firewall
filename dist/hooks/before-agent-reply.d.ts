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
export declare let testBlockRequested: {
    source?: string;
} | null;
export declare function clearTestBlock(): void;
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
/** Handle llm_input — check for test block trigger phrase */
export declare function createTestBlockDetector(store: EventStore): (event: {
    prompt?: string;
    provider?: string;
}, _ctx: any) => void;
//# sourceMappingURL=before-agent-reply.d.ts.map