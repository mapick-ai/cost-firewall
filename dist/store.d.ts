/**
 * JSONL 事件落盘（异步，不阻塞 hook）
 */
import type { FirewallEvent } from "./types.js";
export type { FirewallEvent };
export declare class EventStore {
    private buffer;
    private flushTimer;
    private dirReady;
    constructor();
    private ensureDir;
    append(event: Omit<FirewallEvent, "timestamp">): void;
    private startFlushTimer;
    /**
     * Flush buffer to disk (synchronous, copy-and-replace pattern)
     * This prevents concurrent flushes from double-writing or interleaving events
     */
    flush(): void;
    close(): Promise<void>;
    getStateDir(): string;
    getEventsFilePath(): string;
}
//# sourceMappingURL=store.d.ts.map