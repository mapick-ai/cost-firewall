/**
 * stream.ts — removed. Provider Layer uses inline createStreamFn in provider/index.ts.
 * This file was dead code with no imports.
 */
export {};
import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
export declare function createStreamFn(state: FirewallState, store: EventStore, api: any): (ctx: any) => (model: string, context: any, options: any) => AsyncGenerator<any, void, any>;
//# sourceMappingURL=stream.d.ts.map