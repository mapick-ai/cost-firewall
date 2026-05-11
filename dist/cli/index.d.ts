/**
 * CLI command implementation
 *
 * Register openclaw mapick <subcommand> command group
 */
import type { FirewallState } from "../state.js";
import { EventStore } from "../store.js";
import type { FirewallEvent } from "../types.js";
/** Aggregate today's stats from JSONL */
export declare function aggregateFromJsonl(store: EventStore, memTokens: number, memBlocked: number): Promise<{
    today_tokens: number;
    today_blocked: number;
    events: FirewallEvent[];
}>;
export declare function registerCli(api: any, state: FirewallState, store: EventStore): void;
export declare function getStatus(state: FirewallState, store?: EventStore): Promise<object>;
export declare function getLog(store: EventStore, count: number): Promise<object[]>;
//# sourceMappingURL=index.d.ts.map