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

export function createAgentEndHandler(
  state: FirewallState,
  store: EventStore
) {
  return function handleAgentEnd(
    event: AgentEndEvent,
    ctx: any
  ): void {
    const runId = event.runId ?? ctx?.runId;
    if (!runId) return;

    const run = state.getRun(runId);
    if (!run) return;

    store.append({
      type: "agent_end",
      runId,
      source: run.source,
      outcome: event.outcome,
    });

    state.cleanupRun(runId);
  };
}
