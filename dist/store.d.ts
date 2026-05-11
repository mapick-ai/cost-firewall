/**
 * JSONL event storage (async, non-blocking hook)
 */
import type { FirewallEvent } from "./types.js";
export type { FirewallEvent };
export declare class EventStore {
    private buffer;
    private flushTimer;
    private dirReady;
    constructor();
    append(event: Omit<FirewallEvent, "timestamp">): void;
    private startFlushTimer;
    /**
     * Flush buffer to disk (append mode — preserves history)
     * Copy-and-replace pattern prevents concurrent flushes from interleaving
     */
    flush(): void;
    close(): Promise<void>;
    getStateDir(): string;
    getEventsFilePath(): string;
}
//# sourceMappingURL=store.d.ts.map