/**
 * Anthropic Messages API upstream transport
 */
export interface AnthropicStreamOptions {
    apiKey: string;
    model: string;
    messages: any[];
    max_tokens?: number;
    stream?: boolean;
    [key: string]: any;
}
export declare function streamAnthropic(options: AnthropicStreamOptions, timeoutMs?: number): AsyncGenerator<any>;
//# sourceMappingURL=anthropic.d.ts.map