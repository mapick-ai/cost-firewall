/**
 * 模型定价与费用估算
 */
export interface TokenUsage {
    prompt_tokens?: number;
    completion_tokens?: number;
}
export declare function estimateCost(usage: TokenUsage | null | undefined, provider: string, model: string, responseStreamBytes?: number): number;
export declare function getProviderModelKey(provider: string, model: string): string;
//# sourceMappingURL=pricing.d.ts.map