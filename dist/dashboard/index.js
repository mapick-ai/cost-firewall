/**
 * Dashboard HTTP route 注册
 */
import { getStatus } from "../cli/index.js";
import { renderDashboardHtml } from "./html.js";
import { SseManager } from "./sse.js";
export function registerDashboard(api, state, store) {
    const sse = new SseManager();
    api.registerHttpRoute({
        path: "/mapick/dashboard",
        auth: "gateway",
        handler: async (_req, res) => {
            const stats = await getStatus(state, store);
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(renderDashboardHtml(stats));
        },
    });
    api.registerHttpRoute({
        path: "/mapick/api/stats",
        auth: "gateway",
        handler: async (_req, res) => {
            const stats = await getStatus(state, store);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(stats));
        },
    });
    api.registerHttpRoute({
        path: "/mapick/api/live",
        auth: "gateway",
        handler: (req, res) => {
            res.writeHead(200, {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            });
            const unsubscribe = sse.subscribe((data) => {
                res.write(data);
            });
            req.on("close", unsubscribe);
        },
    });
    api.registerHttpRoute({
        path: "/mapick/api/stop",
        auth: "gateway",
        handler: (_req, res) => {
            state.setEmergencyStop(true);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, emergency_stop: true }));
        },
    });
    api.registerHttpRoute({
        path: "/mapick/api/resume",
        auth: "gateway",
        handler: (_req, res) => {
            state.setEmergencyStop(false);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, emergency_stop: false }));
        },
    });
    return sse;
}
//# sourceMappingURL=index.js.map