/**
 * Provider 注册入口
 */

import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";

let _state: FirewallState;
let _store: EventStore;

export function registerProvider(
  api: any,
  state: FirewallState,
  store: EventStore
): void {
  _state = state;
  _store = store;

  api.registerProvider({
    id: "mapick",
    label: "Mapick Cost Firewall",
    auth: [],

    // minimal createStreamFn for debugging
    createStreamFn(ctx: any) {
      return async function* stream(model: string, context: any, options: any) {
        const msg = `Mapick provider test: model=${model}, upstream available`;
        yield {
          id: `mapick-test-${Date.now()}`,
          object: "chat.completion.chunk",
          created: Math.floor(Date.now() / 1000),
          model: "mapick-test",
          choices: [{ index: 0, delta: { role: "assistant", content: msg }, finish_reason: "stop" }],
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        };
      };
    },
  });
}
