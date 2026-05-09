/**
 * CLI 命令实现
 */

import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";

export function registerCli(
  api: any,
  state: FirewallState,
  store: EventStore
): void {
  // CLI 功能通过 HTTP route 暴露
  // 实际实现依赖 OpenClaw 的 CLI 扩展机制
}

export function getStatus(state: FirewallState): object {
  return {
    mode: state.globalStats.mode,
    emergency_stop: state.globalStats.emergencyStop,
    today_spent: state.globalStats.todaySpent,
    today_blocked: state.globalStats.todayBlocked,
    today_saved_estimate: state.globalStats.todaySavedEstimate,
    daily_budget: state.config.dailyBudgetUsd,
    breaker: {
      consecutive_failures_threshold: state.config.breaker?.consecutiveFailures,
      cooldown_sec: state.config.breaker?.cooldownSec,
    },
  };
}

export function setMode(state: FirewallState, mode: "observe" | "protect"): void {
  state.setMode(mode);
}

export function stop(state: FirewallState): void {
  state.setEmergencyStop(true);
}

export function resume(state: FirewallState): void {
  state.setEmergencyStop(false);
}

export function setBudget(state: FirewallState, amount: number | null): void {
  (state.config as any).dailyBudgetUsd = amount;
}

export function getLog(store: EventStore, count: number): object[] {
  return [];
}
