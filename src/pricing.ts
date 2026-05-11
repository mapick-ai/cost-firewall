/**
 * Token estimation — estimates token count from usage or response bytes.
 */

export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
}

export function estimateTokens(
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
