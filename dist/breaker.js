/**
 * 熔断逻辑
 *
 * 三条规则：
 * 1. 连续失败 (consecutiveFailures)
 * 2. Token 速率 (tokenVelocity) — 窗口内 token 消耗超过阈值
 * 3. 调用频率 (callFrequency) — 窗口内调用次数超过阈值
 */
const DEFAULT_BREAKER = {
    consecutiveFailures: 3,
    cooldownSec: 30,
    tokenVelocityWindowSec: 60,
    tokenVelocityThreshold: 100000,
    callFrequencyWindowSec: 60,
    callFrequencyThreshold: 30,
};
export class Breaker {
    states = new Map();
    config;
    constructor(config) {
        this.config = {
            consecutiveFailures: config.breaker?.consecutiveFailures ?? DEFAULT_BREAKER.consecutiveFailures,
            cooldownSec: config.breaker?.cooldownSec ?? DEFAULT_BREAKER.cooldownSec,
            tokenVelocityWindowSec: config.breaker?.tokenVelocityWindowSec ?? DEFAULT_BREAKER.tokenVelocityWindowSec,
            tokenVelocityThreshold: config.breaker?.tokenVelocityThreshold ?? DEFAULT_BREAKER.tokenVelocityThreshold,
            callFrequencyWindowSec: config.breaker?.callFrequencyWindowSec ?? DEFAULT_BREAKER.callFrequencyWindowSec,
            callFrequencyThreshold: config.breaker?.callFrequencyThreshold ?? DEFAULT_BREAKER.callFrequencyThreshold,
        };
    }
    getState(source) {
        if (!this.states.has(source)) {
            this.states.set(source, {
                source,
                consecutiveFailures: 0,
                tokenHistory: [],
                callTimestamps: [],
            });
        }
        return this.states.get(source);
    }
    // ----- 连续失败 -----
    recordFailure(source) {
        const state = this.getState(source);
        state.consecutiveFailures++;
        if (state.consecutiveFailures >= this.config.consecutiveFailures && this.config.consecutiveFailures > 0) {
            state.brokenUntil = Date.now() + this.config.cooldownSec * 1000;
            state.reason = "consecutive_failures";
        }
    }
    recordSuccess(source) {
        const state = this.getState(source);
        state.consecutiveFailures = 0;
    }
    // ----- Token 速率（滑动窗口）-----
    recordTokens(source, tokens) {
        const state = this.getState(source);
        const now = Date.now();
        const windowMs = this.config.tokenVelocityWindowSec * 1000;
        const threshold = this.config.tokenVelocityThreshold;
        if (threshold <= 0)
            return undefined;
        state.tokenHistory.push({ ts: now, tokens });
        // 清理过期记录
        state.tokenHistory = state.tokenHistory.filter((h) => now - h.ts < windowMs);
        const total = state.tokenHistory.reduce((sum, h) => sum + h.tokens, 0);
        if (total >= threshold) {
            state.brokenUntil = now + this.config.cooldownSec * 1000;
            state.reason = "token_velocity";
            return "token_velocity";
        }
        return undefined;
    }
    // ----- 调用频率（滑动窗口）-----
    recordCall(source) {
        const state = this.getState(source);
        const now = Date.now();
        const windowMs = this.config.callFrequencyWindowSec * 1000;
        const threshold = this.config.callFrequencyThreshold;
        if (threshold <= 0)
            return undefined;
        state.callTimestamps.push(now);
        state.callTimestamps = state.callTimestamps.filter((t) => now - t < windowMs);
        if (state.callTimestamps.length >= threshold) {
            state.brokenUntil = now + this.config.cooldownSec * 1000;
            state.reason = "call_frequency";
            return "call_frequency";
        }
        return undefined;
    }
    // ----- 通用 -----
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
        return this.isCoolingDown(source) ? this.getState(source).reason : undefined;
    }
    reset(source) {
        this.states.delete(source);
    }
    getCooldownRemaining(source) {
        const state = this.getState(source);
        if (!state.brokenUntil)
            return 0;
        return Math.max(0, state.brokenUntil - Date.now());
    }
    /** 返回所有正在冷却的 source 列表 */
    getCoolingSources() {
        const now = Date.now();
        const result = [];
        for (const [source, state] of this.states) {
            if (state.brokenUntil && now < state.brokenUntil) {
                result.push({
                    source,
                    reason: state.reason ?? "unknown",
                    remainingSec: Math.max(0, Math.round((state.brokenUntil - now) / 1000)),
                });
            }
        }
        return result;
    }
}
//# sourceMappingURL=breaker.js.map