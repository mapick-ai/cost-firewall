/**
 * Token estimation — estimates token count from usage or response bytes.
 */
export function estimateTokens(usage, provider, model, responseStreamBytes) {
    if (usage?.prompt_tokens || usage?.completion_tokens) {
        return (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0);
    }
    if (responseStreamBytes) {
        return responseStreamBytes;
    }
    return 0;
}
export function getProviderModelKey(provider, model) {
    return `${provider}/${model}`;
}
//# sourceMappingURL=pricing.js.map