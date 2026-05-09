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
  private sourceStats = new Map<SourceKey, { todayTokens: number }>();
  private today = new Date().toDateString();

  private checkDayReset(): void {
    const now = new Date().toDateString();
    if (now !== this.today) {
      this.today = now;
      this.globalStats.todayTokens = 0;
      this.globalStats.todayBlocked = 0;
      this.sourceStats.clear();
    }
  }

  constructor(config: Partial<FirewallConfig> = {}) {
    this.config = resolveConfig(config);
    this.breaker = new Breaker(this.config);
    this.globalStats = {
      emergencyStop: false,
      mode: "observe",
      todayTokens: 0,
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

  updateSourceStats(source: SourceKey, tokens: number): void {
    this.checkDayReset();
    if (!this.sourceStats.has(source)) {
      this.sourceStats.set(source, { todayTokens: 0 });
    }
    this.sourceStats.get(source)!.todayTokens += tokens;
    this.globalStats.todayTokens += tokens;
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

  isLimitExceeded(): boolean {
    if (this.config.dailyTokenLimit == null) return false;
    return this.globalStats.todayTokens >= this.config.dailyTokenLimit;
  }

  getTodayTokens(): number {
    return this.globalStats.todayTokens;
  }

  /** 活跃 run 概要 */
  getActiveRuns(): { runId: string; source: string; calls: number; tokens: number; status: string }[] {
    const result: any[] = [];
    for (const [id, run] of this.runs) {
      result.push({
        runId: id,
        source: run.source,
        calls: run.calls.size,
        tokens: run.cumulativeCost,
        status: run.status,
        reason: run.reason,
      });
    }
    return result;
  }
}
