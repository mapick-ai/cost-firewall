/**
 * 全局状态管理（in-memory）
 */
import { Breaker } from "./breaker.js";
import { resolveConfig } from "./config.js";
export class FirewallState {
    config;
    breaker;
    globalStats;
    runs = new Map();
    sourceStats = new Map();
    today = new Date().toDateString();
    checkDayReset() {
        const now = new Date().toDateString();
        if (now !== this.today) {
            this.today = now;
            this.globalStats.todayTokens = 0;
            this.globalStats.todayBlocked = 0;
            this.sourceStats.clear();
        }
    }
    constructor(config = {}) {
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
    getRun(runId) {
        return this.runs.get(runId);
    }
    getOrCreateRun(runId, source, sessionId, sessionKey) {
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
        return this.runs.get(runId);
    }
    addCallToRun(runId, callId, call) {
        const run = this.runs.get(runId);
        if (run) {
            run.calls.set(callId, call);
        }
    }
    updateRunCost(runId, cost) {
        const run = this.runs.get(runId);
        if (run) {
            run.cumulativeCost += cost;
        }
    }
    updateSourceStats(source, tokens) {
        this.checkDayReset();
        if (!this.sourceStats.has(source)) {
            this.sourceStats.set(source, { todayTokens: 0 });
        }
        this.sourceStats.get(source).todayTokens += tokens;
        this.globalStats.todayTokens += tokens;
    }
    cleanupRun(runId) {
        setTimeout(() => {
            this.runs.delete(runId);
        }, 60_000);
    }
    setEmergencyStop(enabled) {
        this.globalStats.emergencyStop = enabled;
    }
    setMode(mode) {
        this.globalStats.mode = mode;
    }
    isLimitExceeded() {
        if (this.config.dailyTokenLimit == null)
            return false;
        return this.globalStats.todayTokens >= this.config.dailyTokenLimit;
    }
    getTodayTokens() {
        return this.globalStats.todayTokens;
    }
}
//# sourceMappingURL=state.js.map