/**
 * Global state management (in-memory)
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
    cleanupTimer = null;
    static MAX_RUNS = 100;
    static CLEANUP_INTERVAL_MS = 10_000;
    static RUN_EXPIRY_MS = 5 * 60_000; // 5 minutes
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
        this.startCleanupTimer();
    }
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.purgeOldRuns();
        }, FirewallState.CLEANUP_INTERVAL_MS);
        if (this.cleanupTimer.unref) {
            this.cleanupTimer.unref();
        }
    }
    /**
     * Purge runs older than RUN_EXPIRY_MS and enforce maxSize limit
     */
    purgeOldRuns() {
        const now = Date.now();
        // Delete runs older than 5 minutes
        for (const [runId, run] of this.runs) {
            if (now - run.startedAt > FirewallState.RUN_EXPIRY_MS) {
                this.runs.delete(runId);
            }
        }
        // Enforce maxSize limit: delete oldest runs if exceeds limit
        if (this.runs.size > FirewallState.MAX_RUNS) {
            const sortedRuns = [...this.runs.entries()]
                .sort((a, b) => a[1].startedAt - b[1].startedAt);
            const toDelete = sortedRuns.slice(0, this.runs.size - FirewallState.MAX_RUNS);
            for (const [runId] of toDelete) {
                this.runs.delete(runId);
            }
        }
    }
    /**
     * Stop cleanup timer (for graceful shutdown)
     */
    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
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
    /**
     * Mark a run for cleanup (actual deletion happens via scheduled purgeOldRuns)
     * This method is kept for compatibility with existing callers
     */
    cleanupRun(runId) {
        // No immediate deletion - scheduled cleanup will handle it
        // Optionally force delete if runs exceeds maxSize
        if (this.runs.size > FirewallState.MAX_RUNS) {
            this.runs.delete(runId);
        }
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
    /**
     * Unified precheck for hook and provider layers
     * Returns { allow: true } if all checks pass, otherwise { allow: false, reason, layer }
     */
    precheck(source) {
        if (this.globalStats.emergencyStop) {
            return { allow: false, reason: "emergency_stop", layer: "hook" };
        }
        if (this.isLimitExceeded()) {
            return { allow: false, reason: "daily_token_limit", layer: "hook" };
        }
        if (this.breaker.isCoolingDown(source)) {
            return { allow: false, reason: this.breaker.getBlockedReason(source) ?? "source_cooldown", layer: "provider" };
        }
        return { allow: true, layer: "hook" };
    }
    getTodayTokens() {
        return this.globalStats.todayTokens;
    }
    /** Active run summary */
    getActiveRuns() {
        const result = [];
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
//# sourceMappingURL=state.js.map