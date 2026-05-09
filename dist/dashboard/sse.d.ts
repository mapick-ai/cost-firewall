/**
 * SSE 实时推送
 */
export declare class SseManager {
    private clients;
    subscribe(send: (data: string) => void): () => void;
    broadcast(data: object): void;
}
//# sourceMappingURL=sse.d.ts.map