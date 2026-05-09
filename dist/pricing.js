/**
 * 模型定价与费用估算
 */
// 定价表：$/1M tokens
const PRICING = {
    openai: {
        "gpt-4o": { input: 2.5, output: 10 },
        "gpt-4o-mini": { input: 0.15, output: 0.6 },
        "gpt-4-turbo": { input: 10, output: 30 },
        "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
    },
    anthropic: {
        "claude-sonnet-4-6": { input: 3, output: 15 },
        "claude-sonnet-4-5": { input: 3, output: 15 },
        "claude-haiku-3-5": { input: 0.8, output: 4 },
    },
    openrouter: {},
    deepseek: {
        "deepseek-chat": { input: 0.14, output: 0.28 },
        "deepseek-reasoner": { input: 0.55, output: 2.19 },
    },
    qwen: {
        "qwen3.6-plus": { input: 0.5, output: 2 },
    },
};
// 兜底：按 response bytes 估算（假设 1 token ≈ 4 bytes, $3/1M tokens）
const FALLBACK_COST_PER_BYTE = 3 / 1_000_000 / 4;
export function estimateCost(usage, provider, model, responseStreamBytes) {
    const pricing = PRICING[provider]?.[model];
    if (usage?.prompt_tokens || usage?.completion_tokens) {
        const inputCost = ((usage.prompt_tokens ?? 0) / 1_000_000) * (pricing?.input ?? 3);
        const outputCost = ((usage.completion_tokens ?? 0) / 1_000_000) * (pricing?.output ?? 15);
        return inputCost + outputCost;
    }
    if (responseStreamBytes) {
        return responseStreamBytes * FALLBACK_COST_PER_BYTE;
    }
    return 0;
}
export function getProviderModelKey(provider, model) {
    return `${provider}/${model}`;
}
//# sourceMappingURL=pricing.js.map