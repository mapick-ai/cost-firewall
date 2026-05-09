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
export declare function streamOpenAi(options: OpenAiStreamOptions): AsyncGenerator<any>;
export declare function getOpenAiBaseUrl(upstream: string): string;
//# sourceMappingURL=openai.d.ts.map