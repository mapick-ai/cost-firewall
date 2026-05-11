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
                emergency_stop: "🛑 Emergency stop activated. All AI calls are blocked. Use `openclaw firewall resume` to restore.",
                daily_token_limit: `⛔ Daily token limit reached. Today's AI usage has exceeded the limit. Use \`openclaw firewall status\` to check usage or \`openclaw firewall budget reset\` to remove the limit.`,
                source_cooldown: `🔥 Breaker tripped — source is in cooldown for ${state.breaker.getCooldownRemaining(source)}ms. Wait for cooldown or use \`openclaw firewall reset "${source}"\` to clear.`,
                consecutive_failures: `⚠️ Source "${source}" blocked: ${state.config.breaker?.consecutiveFailures ?? 3} consecutive failures triggered breaker. Use \`openclaw firewall reset "${source}"\` to clear.`,
                token_velocity: `⚡ Source "${source}" blocked: token rate exceeded ${state.config.breaker?.tokenVelocityThreshold?.toLocaleString() ?? "limit"} tokens/${state.config.breaker?.tokenVelocityWindowSec ?? 60}s. Use \`openclaw firewall reset "${source}"\` to clear.`,
                call_frequency: `📞 Source "${source}" blocked: call frequency exceeded ${state.config.breaker?.callFrequencyThreshold ?? 30} calls/${state.config.breaker?.callFrequencyWindowSec ?? 60}s. Use \`openclaw firewall reset "${source}"\` to clear.`,
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