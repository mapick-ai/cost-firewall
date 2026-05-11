/**
 * JSONL 事件落盘（异步，不阻塞 hook）
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
const FLUSH_INTERVAL_MS = 1000;
const STATE_DIR = process.env.OPENCLAW_STATE_DIR
    ? join(process.env.OPENCLAW_STATE_DIR, "plugins", "mapick-firewall")
    : join(homedir(), ".openclaw", "plugins", "mapick-firewall");
const EVENTS_FILE = join(STATE_DIR, "events.jsonl");
export class EventStore {
    buffer = [];
    flushTimer = null;
    dirReady = false;
    constructor() {
        this.startFlushTimer();
    }
    ensureDir() {
        if (this.dirReady)
            return;
        mkdirSync(STATE_DIR, { recursive: true });
        this.dirReady = true;
    }
    append(event) {
        const fullEvent = {
            ...event,
            timestamp: Date.now(),
        };
        this.buffer.push(fullEvent);
    }
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            this.flush();
        }, FLUSH_INTERVAL_MS);
        if (this.flushTimer.unref) {
            this.flushTimer.unref();
        }
    }
    /**
     * Flush buffer to disk (synchronous, copy-and-replace pattern)
     * This prevents concurrent flushes from double-writing or interleaving events
     */
    flush() {
        if (this.buffer.length === 0)
            return;
        // Copy-and-replace: grab current buffer and clear it atomically
        const batch = this.buffer;
        this.buffer = [];
        this.ensureDir();
        const lines = batch.map((e) => JSON.stringify(e)).join("\n") + "\n";
        writeFileSync(EVENTS_FILE, lines, "utf-8");
    }
    async close() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        this.flush();
    }
    getStateDir() {
        return STATE_DIR;
    }
    getEventsFilePath() {
        return EVENTS_FILE;
    }
}
//# sourceMappingURL=store.js.map