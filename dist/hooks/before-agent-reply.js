/**
 * before_agent_reply hook handler
 *
 * Responsibilities:
 * - Emergency Stop blocking
 * - Daily Budget blocking
 * - Source Cooldown blocking
 */
export function createBeforeAgentReplyHandler(state, store) {
    return async function handleBeforeAgentReply(event, ctx) {
        const source = event.agentId ?? event.sessionKey ?? "unknown";
        // Unified precheck
        const result = state.precheck(source);
        if (!result.allow) {
            store.append({
                type: "blocked",
                source,
                reason: result.reason,
                layer: result.layer,
            });
            state.globalStats.todayBlocked++;
            const messages = {
                emergency_stop: "Mapick Cost Firewall: all AI calls are paused.",
                daily_token_limit: "Mapick Cost Firewall: today's token limit has been reached.",
                source_cooldown: "Mapick Cost Firewall: this source is cooling down.",
                consecutive_failures: "Mapick Cost Firewall: this source is cooling down due to consecutive failures.",
                token_velocity: "Mapick Cost Firewall: this source is cooling down due to high token velocity.",
                call_frequency: "Mapick Cost Firewall: this source is cooling down due to high call frequency.",
            };
            return {
                handled: true,
                reply: {
                    text: messages[result.reason] ?? "Mapick Cost Firewall: request blocked.",
                    isError: true,
                },
                reason: result.reason,
            };
        }
        return undefined;
    };
}
//# sourceMappingURL=before-agent-reply.js.map