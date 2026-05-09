/**
 * @mapick/cost-firewall — OpenClaw 插件入口
 */

import { PLUGIN_ID, PLUGIN_NAME } from "./types.js";
import { FirewallState } from "./state.js";
import { EventStore } from "./store.js";
import { registerHooks } from "./hooks/index.js";
import { registerCli } from "./cli/index.js";
import { registerDashboard } from "./dashboard/index.js";

export default function definePluginEntry(api: any) {
  const state = new FirewallState(api.config?.plugins?.entries?.[PLUGIN_ID]);
  const store = new EventStore();

  // 注册 Hook Layer
  registerHooks(api, state, store);

  // 注册 CLI
  registerCli(api, state, store);

  // 注册 Dashboard
  const sse = registerDashboard(api, state);

  // 广播统计更新
  const originalUpdateStats = state.updateSourceStats.bind(state);
  state.updateSourceStats = (source, cost) => {
    originalUpdateStats(source, cost);
    sse.broadcast({
      type: "stats_update",
      today_spent: state.globalStats.todaySpent,
      today_blocked: state.globalStats.todayBlocked,
    });
  };

  return {
    id: PLUGIN_ID,
    name: PLUGIN_NAME,
    version: "0.1.0",
  };
}

export { PLUGIN_ID, PLUGIN_NAME };
