/**
 * Provider 注册入口
 */

import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
import { createStreamFn } from "./stream.js";

export function registerProvider(
  api: any,
  state: FirewallState,
  store: EventStore
): void {
  api.registerProvider({
    id: "mapick",
    label: "Mapick Cost Firewall",
    auth: [],
    createStreamFn: createStreamFn(state, store, api),
  });
}
