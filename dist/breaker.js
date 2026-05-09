/**
 * 熔断逻辑
 */
export class Breaker {
    states = new Map();
    config;
    constructor(config) {
        this.config = {
            costVelocityWindowSec: config.breaker?.costVelocityWindowSec ?? 60,
            costVelocityThresholdUsd: config.breaker?.costVelocityThresholdUsd ?? 0.5,
            cumulativeCostThresholdUsd: config.breaker?.cumulativeCostThresholdUsd ?? 1.0,
            callFrequencyWindowSec: config.breaker?.callFrequencyWindowSec ?? 60,
            callFrequencyThreshold: config.breaker?.callFrequencyThreshold ?? 20,
            promptRepeatThreshold: config.breaker?.promptRepeatThreshold ?? 3,
            consecutiveFailures: config.breaker?.consecutiveFailures ?? 5,
            cooldownSec: config.breaker?.cooldownSec ?? 30,
        };
    }
    getState(source) {
        if (!this.states.has(source)) {
            this.states.set(source, {
                source,
                consecutiveFailures: 0,
            });
        }
        return this.states.get(source);
    }
    recordFailure(source) {
        const state = this.getState(source);
        state.consecutiveFailures++;
        if (state.consecutiveFailures >= this.config.consecutiveFailures) {
            state.brokenUntil = Date.now() + this.config.cooldownSec * 1000;
            state.reason = "consecutive_failures";
        }
    }
    recordSuccess(source) {
        const state = this.getState(source);
        state.consecutiveFailures = 0;
        state.brokenUntil = undefined;
        state.reason = undefined;
    }
    isCoolingDown(source) {
        const state = this.getState(source);
        if (!state.brokenUntil)
            return false;
        if (Date.now() > state.brokenUntil) {
            state.brokenUntil = undefined;
            state.reason = undefined;
            state.consecutiveFailures = 0;
            return false;
        }
        return true;
    }
    getBlockedReason(source) {
        const state = this.getState(source);
        if (this.isCoolingDown(source)) {
            return state.reason;
        }
        return undefined;
    }
    reset(source) {
        this.states.set(source, {
            source,
            consecutiveFailures: 0,
        });
    }
    getCooldownRemaining(source) {
        const state = this.getState(source);
        if (!state.brokenUntil)
            return 0;
        return Math.max(0, state.brokenUntil - Date.now());
    }
}
//# sourceMappingURL=breaker.js.map