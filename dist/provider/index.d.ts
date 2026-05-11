/**
 * Provider registration entry point
 *
 * mapick/<upstream>/<model> routing
 * - catalog: declare model catalog
 * - resolveDynamicModel: dynamically accept any upstream model ID
 * - createStreamFn: precheck + upstream forwarding
 */
import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
export declare function registerProvider(api: any, state: FirewallState, store: EventStore): void;
//# sourceMappingURL=index.d.ts.map