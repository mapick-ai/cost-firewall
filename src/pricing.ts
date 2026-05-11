/**
 * Model pricing and cost estimation
 *
 * OpenRouter: pass-through pricing (inherits upstream provider pricing)
 */

// Pricing table: $/1M tokens
const PRICING: Record<string, Record<string, { input: number; output: number }>> = {
  openai: {
    "gpt-4o": { input: 2.5, output: 10 },
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "gpt-4-turbo": { input: 10, output: 30 },
    "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  },
  anthropic: {
    "claude-sonnet-4-6": { input: 3, output: 15 },
    "claude-sonnet-4-20250514": { input: 3, output: 15 },
    "claude-sonnet-4-5": { input: 3, output: 15 },
    "claude-haiku-3-5": { input: 0.8, output: 4 },
  },
  openrouter: {}, // pass-through pricing
  deepseek: {
    "deepseek-chat": { input: 0.28, output: 0.42 },
    "deepseek-reasoner": { input: 0.55, output: 2.19 },
  },
  qwen: {
    "qwen3-plus": { input: 0.5, output: 2 },
  },
};

// Fallback: estimate by response bytes (assuming 1 token ≈ 4 bytes, $3/1M tokens)
const FALLBACK_COST_PER_BYTE = 3 / 1_000_000 / 4;

export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
}

export function estimateCost(
  usage: TokenUsage | null | undefined,
  provider: string,
  model: string,
  responseStreamBytes?: number
): number {
  if (usage?.prompt_tokens || usage?.completion_tokens) {
    return (usage.prompt_tokens ?? 0) + (usage.completion_tokens ?? 0);
  }

  if (responseStreamBytes) {
    return responseStreamBytes;
  }

  return 0;
}

export function getProviderModelKey(provider: string, model: string): string {
  return `${provider}/${model}`;
}
