/**
 * JSONL 事件落盘（异步，不阻塞 hook）
 */

import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { FirewallEvent } from "./types.js";

const FLUSH_INTERVAL_MS = 1000;
const STATE_DIR = join(homedir(), ".openclaw", "plugins", "mapick-firewall");
const EVENTS_FILE = join(STATE_DIR, "events.jsonl");

export class EventStore {
  private buffer: FirewallEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private dirReady = false;

  constructor() {
    this.startFlushTimer();
  }

  private async ensureDir(): Promise<void> {
    if (this.dirReady) return;
    await mkdir(STATE_DIR, { recursive: true });
    this.dirReady = true;
  }

  append(event: Omit<FirewallEvent, "timestamp">): void {
    const fullEvent: FirewallEvent = {
      ...event,
      timestamp: Date.now(),
    };
    this.buffer.push(fullEvent);
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(() => {});
    }, FLUSH_INTERVAL_MS);

    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    await this.ensureDir();
    const events = this.buffer.splice(0);
    const lines = events.map((e) => JSON.stringify(e)).join("\n") + "\n";
    await appendFile(EVENTS_FILE, lines, "utf-8");
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  getStateDir(): string {
    return STATE_DIR;
  }

  getEventsFilePath(): string {
    return EVENTS_FILE;
  }
}
