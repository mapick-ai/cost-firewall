/**
 * OpenAI-compatible upstream transport
 *
 * 支持 /v1/chat/completions
 * 兼容 OpenRouter, DeepSeek, Qwen 等 OpenAI-compatible providers
 */

export interface OpenAiStreamOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: any[];
  stream?: boolean;
  [key: string]: any;
}

export async function* streamOpenAi(
  options: OpenAiStreamOptions
): AsyncGenerator<any> {
  const { baseUrl, apiKey, model, messages, stream = true, ...rest } = options;

  const url = `${baseUrl}/v1/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
      ...rest,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI upstream error ${response.status}: ${errorText}`);
  }

  if (!response.body) {
    throw new Error("OpenAI upstream returned empty body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice("data: ".length);
        if (data === "[DONE]") return;

        try {
          yield JSON.parse(data);
        } catch {
          // 跳过无效 JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function getOpenAiBaseUrl(upstream: string): string {
  const baseUrls: Record<string, string> = {
    openai: "https://api.openai.com",
    openrouter: "https://openrouter.ai/api",
    deepseek: "https://api.deepseek.com",
    qwen: "https://dashscope.aliyuncs.com/compatible-mode",
  };

  return baseUrls[upstream] ?? `https://api.${upstream}.com`;
}
