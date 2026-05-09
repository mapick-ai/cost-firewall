/**
 * createStreamFn 实现
 *
 * 核心：在真实 upstream request 发出前做 precheck
 * SDK 约定：createStreamFn(ctx) => async function*(model, context, options)
 */
import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
export declare function createStreamFn(state: FirewallState, store: EventStore, api: any): (ctx: any) => (model: string, context: any, options: any) => AsyncGenerator<any, void, any>;
//# sourceMappingURL=stream.d.ts.map