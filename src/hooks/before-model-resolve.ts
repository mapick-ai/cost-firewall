/**
 * before_model_resolve hook — transparent model routing through firewall
 *
 * Intercepts model resolution and rewrites non-mapick models to
 * mapick/<provider>/<model>, making the Provider Layer transparent.
 * Users keep their existing model config — no changes needed.
 */

import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
import { isMapickModelRef } from "../provider/route.js";

export interface BeforeModelResolveEvent {
  provider: string;
  model: string;
  runId?: string;
}

export interface ModelResolveResult {
  providerOverride?: string;
  modelOverride?: string;
}

export function createBeforeModelResolveHandler(
  state: FirewallState,
  store: EventStore
) {
  return function handleBeforeModelResolve(
    event: any,
    _ctx: any
  ): ModelResolveResult | undefined {
    // Defensive: real OpenClaw events may have undefined model/provider
    if (!event.model || !event.provider) return undefined;

    // Already using mapick/* — no rewrite needed
    if (isMapickModelRef(event.model)) return undefined;

    // Rewrite ALL calls to mapick/<provider>/<model>
    // observe mode: routes through Provider Layer for tracking (no blocking)
    // protect mode: routes through Provider Layer for tracking + blocking
    const newModel = `mapick/${event.provider}/${event.model}`;
    store.append({
      type: "model_rewrite",
      reason: "transparent_firewall_routing",
      provider: event.provider,
      model: event.model,
    });

    return {
      providerOverride: "mapick",
      modelOverride: newModel,
    };
  };
}
