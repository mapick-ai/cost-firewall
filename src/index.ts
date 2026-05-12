/**
 * @mapick/cost-firewall — OpenClaw plugin entry point
 */

import { PLUGIN_ID, PLUGIN_NAME } from "./types.js";
import { FirewallState } from "./state.js";
import { EventStore } from "./store.js";
import { registerHooks } from "./hooks/index.js";
import { registerCli } from "./cli/index.js";
import { registerDashboard } from "./dashboard/index.js";
import { registerProvider } from "./provider/index.js";
import { registerTools } from "./tools/index.js";
import { detectConfigRisks } from "./config-warn.js";

export default {
  id: PLUGIN_ID,
  name: PLUGIN_NAME,
  version: "0.2.4",

  register(api: any) {
    const config = api.config?.plugins?.entries?.[PLUGIN_ID]?.config ?? {};
    const state = new FirewallState(config);
    const store = new EventStore();

    // Register Hook Layer
    registerHooks(api, state, store);

    // Register Provider Layer
    registerProvider(api, state, store);

    // Register CLI
    registerCli(api, state, store);

    // Register Agent Tools (/firewall status/stop/resume conversational commands)
    registerTools(api, state, store);

    // Config risk detection (fallback bypass etc.)
    const warnings = detectConfigRisks(api.config);
    for (const w of warnings) {
      store.append({ type: "config_warning", reason: w.message, source: w.level });
    }

    // Register Dashboard
    const sse = registerDashboard(api, state, store);

    // Broadcast stats update
    const originalUpdate = state.updateSourceStats.bind(state);
    state.updateSourceStats = (source, cost) => {
      originalUpdate(source, cost);
      sse.broadcast({
        type: "stats_update",
        today_tokens: state.globalStats.todayTokens,
        today_blocked: state.globalStats.todayBlocked,
      });
    };
  },
};

export { PLUGIN_ID, PLUGIN_NAME };
