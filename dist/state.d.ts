/**
 * 全局状态管理（in-memory）
 */
import type { RunState, CallState, GlobalStats, SourceKey, FirewallConfig } from "./types.js";
import { Breaker } from "./breaker.js";
export declare class FirewallState {
    readonly config: FirewallConfig;
    readonly breaker: Breaker;
    readonly globalStats: GlobalStats;
    private runs;
    private sourceStats;
    constructor(config?: Partial<FirewallConfig>);
    getRun(runId: string): RunState | undefined;
    getOrCreateRun(runId: string, source: SourceKey, sessionId?: string, sessionKey?: string): RunState;
    addCallToRun(runId: string, callId: string, call: CallState): void;
    updateRunCost(runId: string, cost: number): void;
    updateSourceStats(source: SourceKey, tokens: number): void;
    cleanupRun(runId: string): void;
    setEmergencyStop(enabled: boolean): void;
    setMode(mode: "observe" | "protect"): void;
    isLimitExceeded(): boolean;
    getTodayTokens(): number;
}
//# sourceMappingURL=state.d.ts.map