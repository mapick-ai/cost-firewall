/**
 * Breaker logic
 *
 * Three rules:
 * 1. Consecutive failures (consecutiveFailures)
 * 2. Token velocity (tokenVelocity) — token consumption exceeds threshold within window
 * 3. Call frequency (callFrequency) — call count exceeds threshold within window
 */
import type { FirewallConfig, SourceKey } from "./types.js";
export declare class Breaker {
    private states;
    private config;
    constructor(config: FirewallConfig);
    private resolveConfig;
    /** Update thresholds from config (called when dashboard changes settings) */
    updateConfig(config: FirewallConfig): void;
    private getState;
    recordFailure(source: SourceKey): void;
    recordSuccess(source: SourceKey): void;
    recordTokens(source: SourceKey, tokens: number): string | undefined;
    recordCall(source: SourceKey): string | undefined;
    isCoolingDown(source: SourceKey): boolean;
    getBlockedReason(source: SourceKey): string | undefined;
    reset(source: SourceKey): void;
    getCooldownRemaining(source: SourceKey): number;
    /** Return list of all cooling sources */
    getCoolingSources(): {
        source: string;
        reason: string;
        remainingSec: number;
    }[];
}
//# sourceMappingURL=breaker.d.ts.map