/**
 * @mapick/cost-firewall — OpenClaw 插件入口
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
    version: "0.1.0",
    register(api) {
        const config = api.config?.plugins?.entries?.[PLUGIN_ID]?.config ?? {};
        const state = new FirewallState(config);
        const store = new EventStore();
        // 注册 Hook Layer
        registerHooks(api, state, store);
        // 注册 Provider Layer
        registerProvider(api, state, store);
        // 注册 CLI
        registerCli(api, state, store);
        // 注册 Agent Tools（/mapick status/stop/resume 等对话命令）
        registerTools(api, state, store);
        // 配置风险检测（fallback bypass 等）
        const warnings = detectConfigRisks(api.config);
        for (const w of warnings) {
            store.append({ type: "config_warning", reason: w.message, source: w.level });
        }
        // 注册 Dashboard
        const sse = registerDashboard(api, state, store);
        // 广播统计更新
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
//# sourceMappingURL=index.js.map