/**
 * before_agent_reply hook 处理
 *
 * 职责：
 * - Emergency Stop 阻断
 * - Daily Budget 阻断
 * - Source Cooldown 阻断
 */
export function createBeforeAgentReplyHandler(state, store) {
    return async function handleBeforeAgentReply(event, ctx) {
        if (state.globalStats.emergencyStop) {
            const source = event.agentId ?? "unknown";
            store.append({
                type: "blocked",
                source,
                reason: "emergency_stop",
                layer: "hook",
            });
            state.globalStats.todayBlocked++;
            return {
                handled: true,
                reply: {
                    text: "Mapick Cost Firewall: all AI calls are paused.",
                    isError: true,
                },
                reason: "emergency_stop",
            };
        }
        if (state.isBudgetExceeded()) {
            const source = event.agentId ?? "unknown";
            store.append({
                type: "blocked",
                source,
                reason: "daily_budget_exceeded",
                layer: "hook",
            });
            state.globalStats.todayBlocked++;
            return {
                handled: true,
                reply: {
                    text: "Mapick Cost Firewall: today's AI budget has been reached.",
                    isError: true,
                },
                reason: "daily_budget_exceeded",
            };
        }
        const source = event.agentId ?? event.sessionKey ?? "unknown";
        if (state.breaker.isCoolingDown(source)) {
            store.append({
                type: "blocked",
                source,
                reason: state.breaker.getBlockedReason(source),
                layer: "hook",
            });
            state.globalStats.todayBlocked++;
            return {
                handled: true,
                reply: {
                    text: "Mapick Cost Firewall: this source is cooling down.",
                    isError: true,
                },
                reason: "source_cooldown",
            };
        }
        return undefined;
    };
}
//# sourceMappingURL=before-agent-reply.js.map