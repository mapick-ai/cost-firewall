/**
 * agent_end hook handler
 *
 * Responsibilities:
 * - Run finalization stats
 * - Delayed cleanup of run state
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