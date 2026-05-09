/**
 * Blocked response 生成
 *
 * 当请求被 Mapick 拦截时，返回 synthetic stream
 */
export interface BlockedStreamOptions {
    provider: string;
    model: string;
    reason: string;
    format?: "openai" | "anthropic";
}
export declare function createBlockedStream(options: BlockedStreamOptions): AsyncGenerator<any>;
//# sourceMappingURL=synthetic.d.ts.map