/**
 * createStreamFn implementation
 *
 * Core: precheck before real upstream request is sent
 * SDK convention: createStreamFn(ctx) => async function*(model, context, options)
 */
import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
export declare function createStreamFn(state: FirewallState, store: EventStore, api: any): (ctx: any) => (model: string, context: any, options: any) => AsyncGenerator<any, void, any>;
//# sourceMappingURL=stream.d.ts.map