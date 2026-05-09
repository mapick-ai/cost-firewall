/**
 * CLI 命令实现
 */
import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
export declare function registerCli(api: any, state: FirewallState, store: EventStore): void;
export declare function getStatus(state: FirewallState, store?: EventStore): Promise<object>;
export declare function setMode(state: FirewallState, mode: "observe" | "protect"): void;
export declare function stop(state: FirewallState): void;
export declare function resume(state: FirewallState): void;
export declare function setBudget(state: FirewallState, amount: number | null): void;
export declare function getLog(store: EventStore, count: number): Promise<object[]>;
//# sourceMappingURL=index.d.ts.map