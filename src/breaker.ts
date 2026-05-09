/**
 * 熔断逻辑
 */

import type { FirewallConfig, SourceKey, BreakerState } from "./types.js";

export class Breaker {
  private states = new Map<SourceKey, BreakerState>();
  private config: Required<NonNullable<FirewallConfig["breaker"]>>;

  constructor(config: FirewallConfig) {
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

  private getState(source: SourceKey): BreakerState {
    if (!this.states.has(source)) {
      this.states.set(source, {
        source,
        consecutiveFailures: 0,
      });
    }
    return this.states.get(source)!;
  }

  recordFailure(source: SourceKey): void {
    const state = this.getState(source);
    state.consecutiveFailures++;

    if (state.consecutiveFailures >= this.config.consecutiveFailures) {
      state.brokenUntil = Date.now() + this.config.cooldownSec * 1000;
      state.reason = "consecutive_failures";
    }
  }

  recordSuccess(source: SourceKey): void {
    const state = this.getState(source);
    state.consecutiveFailures = 0;
    state.brokenUntil = undefined;
    state.reason = undefined;
  }

  isCoolingDown(source: SourceKey): boolean {
    const state = this.getState(source);
    if (!state.brokenUntil) return false;

    if (Date.now() > state.brokenUntil) {
      state.brokenUntil = undefined;
      state.reason = undefined;
      state.consecutiveFailures = 0;
      return false;
    }

    return true;
  }

  getBlockedReason(source: SourceKey): string | undefined {
    const state = this.getState(source);
    if (this.isCoolingDown(source)) {
      return state.reason;
    }
    return undefined;
  }

  reset(source: SourceKey): void {
    this.states.set(source, {
      source,
      consecutiveFailures: 0,
    });
  }

  getCooldownRemaining(source: SourceKey): number {
    const state = this.getState(source);
    if (!state.brokenUntil) return 0;
    return Math.max(0, state.brokenUntil - Date.now());
  }
}
