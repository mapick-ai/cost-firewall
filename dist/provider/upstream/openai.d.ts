/**
 * OpenAI-compatible upstream transport
 *
 * Supports /v1/chat/completions
 * Compatible with OpenRouter, DeepSeek, Qwen and other OpenAI-compatible providers
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