/**
 * 全局状态管理（in-memory）
 */

import type {
  RunState,
  CallState,
  GlobalStats,
  SourceKey,
  FirewallConfig,
} from "./types.js";
import { Breaker } from "./breaker.js";
import { resolveConfig } from "./config.js";

export class FirewallState {
  readonly config: FirewallConfig;
  readonly breaker: Breaker;
  readonly globalStats: GlobalStats;
  private runs = new Map<string, RunState>();
  private sourceStats = new Map<SourceKey, { todaySpent: number }>();

  constructor(config: Partial<FirewallConfig> = {}) {
    this.config = resolveConfig(config);
    this.breaker = new Breaker(this.config);
    this.globalStats = {
      emergencyStop: false,
      mode: "observe",
      todaySpent: 0,
      todayBlocked: 0,
      todaySavedEstimate: 0,
    };
  }

  getRun(runId: string): RunState | undefined {
    return this.runs.get(runId);
  }

  getOrCreateRun(
    runId: string,
    source: SourceKey,
    sessionId?: string,
    sessionKey?: string
  ): RunState {
    if (!this.runs.has(runId)) {
      this.runs.set(runId, {
        runId,
        sessionId,
        sessionKey,
        source,
        startedAt: Date.now(),
        calls: new Map(),
        llmCallTimestamps: [],
        cumulativeCost: 0,
        promptHashCounts: new Map(),
        status: "healthy",
      });
    }
    return this.runs.get(runId)!;
  }

  addCallToRun(runId: string, callId: string, call: CallState): void {
    const run = this.runs.get(runId);
    if (run) {
      run.calls.set(callId, call);
    }
  }

  updateRunCost(runId: string, cost: number): void {
    const run = this.runs.get(runId);
    if (run) {
      run.cumulativeCost += cost;
    }
  }

  updateSourceStats(source: SourceKey, cost: number): void {
    if (!this.sourceStats.has(source)) {
      this.sourceStats.set(source, { todaySpent: 0 });
    }
    this.sourceStats.get(source)!.todaySpent += cost;
    this.globalStats.todaySpent += cost;
  }

  cleanupRun(runId: string): void {
    setTimeout(() => {
      this.runs.delete(runId);
    }, 60_000);
  }

  setEmergencyStop(enabled: boolean): void {
    this.globalStats.emergencyStop = enabled;
  }

  setMode(mode: "observe" | "protect"): void {
    this.globalStats.mode = mode;
  }

  isBudgetExceeded(): boolean {
    if (this.config.dailyBudgetUsd == null) return false;
    return this.globalStats.todaySpent >= this.config.dailyBudgetUsd;
  }

  getTodaySpent(): number {
    return this.globalStats.todaySpent;
  }
}
