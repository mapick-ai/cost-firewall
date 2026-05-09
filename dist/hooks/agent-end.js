/**
 * agent_end hook 处理
 *
 * 职责：
 * - run 收尾统计
 * - 延迟清理 run state
 */
export function createAgentEndHandler(state, store) {
    return function handleAgentEnd(event, ctx) {
        const runId = event.runId ?? ctx?.runId;
        if (!runId)
            return;
        const run = state.getRun(runId);
        if (!run)
            return;
        store.append({
            type: "agent_end",
            runId,
            source: run.source,
            outcome: event.outcome,
        });
        state.cleanupRun(runId);
    };
}
//# sourceMappingURL=agent-end.js.map