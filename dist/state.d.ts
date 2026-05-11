/**
 * 全局状态管理（in-memory）
 */
import type { RunState, CallState, GlobalStats, SourceKey, FirewallConfig, PrecheckResult } from "./types.js";
import { Breaker } from "./breaker.js";
export declare class FirewallState {
    readonly config: FirewallConfig;
    readonly breaker: Breaker;
    readonly globalStats: GlobalStats;
    private runs;
    private sourceStats;
    private today;
    private cleanupTimer;
    private static readonly MAX_RUNS;
    private static readonly CLEANUP_INTERVAL_MS;
    private static readonly RUN_EXPIRY_MS;
    private checkDayReset;
    constructor(config?: Partial<FirewallConfig>);
    private startCleanupTimer;
    /**
     * Purge runs older than RUN_EXPIRY_MS and enforce maxSize limit
     */
    private purgeOldRuns;
    /**
     * Stop cleanup timer (for graceful shutdown)
     */
    stopCleanupTimer(): void;
    getRun(runId: string): RunState | undefined;
    getOrCreateRun(runId: string, source: SourceKey, sessionId?: string, sessionKey?: string): RunState;
    addCallToRun(runId: string, callId: string, call: CallState): void;
    updateRunCost(runId: string, cost: number): void;
    updateSourceStats(source: SourceKey, tokens: number): void;
    /**
     * Mark a run for cleanup (actual deletion happens via scheduled purgeOldRuns)
     * This method is kept for compatibility with existing callers
     */
    cleanupRun(runId: string): void;
    setEmergencyStop(enabled: boolean): void;
    setMode(mode: "observe" | "protect"): void;
    isLimitExceeded(): boolean;
    /**
     * Unified precheck for hook and provider layers
     * Returns { allow: true } if all checks pass, otherwise { allow: false, reason, layer }
     */
    precheck(source: SourceKey): PrecheckResult;
    getTodayTokens(): number;
    /** 活跃 run 概要 */
    getActiveRuns(): {
        runId: string;
        source: string;
        calls: number;
        tokens: number;
        status: string;
    }[];
}
//# sourceMappingURL=state.d.ts.map