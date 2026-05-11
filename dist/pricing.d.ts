/**
 * Token estimation — estimates token count from usage or response bytes.
 */
export interface TokenUsage {
    prompt_tokens?: number;
    completion_tokens?: number;
}
export declare function estimateTokens(usage: TokenUsage | null | undefined, provider: string, model: string, responseStreamBytes?: number): number;
export declare function getProviderModelKey(provider: string, model: string): string;
//# sourceMappingURL=pricing.d.ts.map