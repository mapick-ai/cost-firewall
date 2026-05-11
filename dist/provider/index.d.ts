/**
 * Provider registration entry point
 *
 * mapick/<upstream>/<model> routing
 * - catalog: declare model catalog
 * - resolveDynamicModel: dynamically accept any upstream model ID
 * - createStreamFn: precheck + upstream forwarding
 *
 * @known-limitations
 * - Message format: passes context.messages directly to upstream API.
 *   Works for plain text but tool calls, system prompts, cache headers,
 *   and reasoning payloads may need format conversion for Anthropic/OpenAI.
 * - Provider contract: not yet validated against real OpenClaw gateway
 *   contract (createStreamFn invocation, synthetic stream handling, fallback
 *   routing). Works via runtime registration; end-to-end gateway test pending.
 */
import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
export declare function registerProvider(api: any, state: FirewallState, store: EventStore): void;
//# sourceMappingURL=index.d.ts.map