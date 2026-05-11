/**
 * Agent Tools registration — users control Cost Firewall via conversation
 *
 * Usage:
 *   /firewall status  → view status
 *   /firewall stop    → emergency breaker
 *   /firewall resume  → resume
 *   /firewall log     → view recent events
 */
import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
export declare function registerTools(api: any, state: FirewallState, store: EventStore): void;
//# sourceMappingURL=index.d.ts.map