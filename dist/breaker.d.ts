/**
 * 熔断逻辑
 *
 * 三条规则：
 * 1. 连续失败 (consecutiveFailures)
 * 2. Token 速率 (tokenVelocity) — 窗口内 token 消耗超过阈值
 * 3. 调用频率 (callFrequency) — 窗口内调用次数超过阈值
 */
import type { FirewallConfig, SourceKey } from "./types.js";
export declare class Breaker {
    private states;
    private config;
    constructor(config: FirewallConfig);
    private getState;
    recordFailure(source: SourceKey): void;
    recordSuccess(source: SourceKey): void;
    recordTokens(source: SourceKey, tokens: number): string | undefined;
    recordCall(source: SourceKey): string | undefined;
    isCoolingDown(source: SourceKey): boolean;
    getBlockedReason(source: SourceKey): string | undefined;
    reset(source: SourceKey): void;
    getCooldownRemaining(source: SourceKey): number;
    /** 返回所有正在冷却的 source 列表 */
    getCoolingSources(): {
        source: string;
        reason: string;
        remainingSec: number;
    }[];
}
//# sourceMappingURL=breaker.d.ts.map