/**
 * Blocked response generation
 *
 * Return synthetic stream when request is blocked by Mapick
 */
export interface BlockedStreamOptions {
    provider: string;
    model: string;
    reason: string;
    format?: "openai" | "anthropic";
}
export declare function createBlockedStream(options: BlockedStreamOptions): AsyncGenerator<any>;
//# sourceMappingURL=synthetic.d.ts.map