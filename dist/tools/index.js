/**
 * Agent Tools 注册 — 用户通过对话控制 Cost Firewall
 *
 * 用法：
 *   /mapick status  → 查看状态
 *   /mapick stop    → 紧急熔断
 *   /mapick resume  → 恢复
 *   /mapick log     → 查看最近事件
 */
import { getStatus, getLog } from "../cli/index.js";
export function registerTools(api, state, store) {
    api.logger?.info(`[mapick-firewall] registerTools: mode=${api.registrationMode}`);
    // 使用 api.registerCommand 替代 api.registerTool 试试
    if (typeof api.registerCommand === "function") {
        api.logger?.info(`[mapick-firewall] registerCommand is available`);
        api.registerCommand({
            name: "mapick",
            description: "Mapick Cost Firewall commands",
            parameters: {
                type: "object",
                properties: {
                    action: {
                        type: "string",
                        enum: ["status", "stop", "resume", "mode", "log", "budget"],
                        description: "Action to perform"
                    }
                },
                required: ["action"]
            },
            async execute(_toolCallId, params) {
                api.logger?.info(`[mapick-firewall] command executed: ${params.action}`);
                switch (params.action) {
                    case "status": return { content: [{ type: "text", text: JSON.stringify(await getStatus(state, store), null, 2) }] };
                    case "stop":
                        state.setEmergencyStop(true);
                        return { content: [{ type: "text", text: "Emergency stop activated." }] };
                    case "resume":
                        state.setEmergencyStop(false);
                        return { content: [{ type: "text", text: "Resumed." }] };
                    case "log": return { content: [{ type: "text", text: JSON.stringify(await getLog(store, 10), null, 2) }] };
                    case "budget": return { content: [{ type: "text", text: `Daily budget: $${state.config.dailyBudgetUsd ?? "unlimited"}` }] };
                    case "mode": return { content: [{ type: "text", text: `Mode: ${state.globalStats.mode}` }] };
                    default: return { content: [{ type: "text", text: `Unknown action: ${params.action}` }] };
                }
            },
        });
        api.logger?.info(`[mapick-firewall] registerCommand done`);
    }
    else {
        api.logger?.warn(`[mapick-firewall] registerCommand NOT available, trying registerTool...`);
        api.registerTool({
            name: "mapick_status",
            description: "View Mapick Cost Firewall status: mode, today spent, blocked count, budget.",
            parameters: { type: "object", properties: {}, required: [] },
            async execute() {
                const s = await getStatus(state, store);
                return { content: [{ type: "text", text: JSON.stringify(s, null, 2) }] };
            },
        });
        api.logger?.info(`[mapick-firewall] registerTool done`);
    }
}
//# sourceMappingURL=index.js.map