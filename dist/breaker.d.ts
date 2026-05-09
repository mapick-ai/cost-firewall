/**
 * 熔断逻辑
 */
import type { FirewallConfig, SourceKey } from "./types.js";
export declare class Breaker {
    private states;
    private config;
    constructor(config: FirewallConfig);
    private getState;
    recordFailure(source: SourceKey): void;
    recordSuccess(source: SourceKey): void;
    isCoolingDown(source: SourceKey): boolean;
    getBlockedReason(source: SourceKey): string | undefined;
    reset(source: SourceKey): void;
    getCooldownRemaining(source: SourceKey): number;
}
//# sourceMappingURL=breaker.d.ts.map