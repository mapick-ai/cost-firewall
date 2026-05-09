/**
 * Dashboard HTTP route 注册
 */
import { getStatus } from "../cli/index.js";
import { renderDashboardHtml } from "./html.js";
import { SseManager } from "./sse.js";
export function registerDashboard(api, state, store) {
    const sse = new SseManager();
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    // Dashboard HTML
    api.registerHttpRoute({
        path: "/mapick/dashboard",
        auth: "plugin",
        handler: async (_req, res) => {
            const stats = await getStatus(state, store);
            res.writeHead(200, { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" });
            res.end(renderDashboardHtml(stats));
        },
    });
    // Stats API
    api.registerHttpRoute({
        path: "/mapick/api/stats",
        auth: "plugin",
        handler: async (_req, res) => {
            const stats = await getStatus(state, store);
            res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify(stats));
        },
    });
    // SSE
    api.registerHttpRoute({
        path: "/mapick/api/live",
        auth: "plugin",
        handler: (req, res) => {
            res.writeHead(200, { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
            const unsubscribe = sse.subscribe((data) => res.write(data));
            req.on("close", unsubscribe);
        },
    });
    // Emergency Stop
    api.registerHttpRoute({
        path: "/mapick/api/stop",
        auth: "plugin",
        handler: (_req, res) => {
            state.setEmergencyStop(true);
            res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, emergency_stop: true }));
        },
    });
    // Resume
    api.registerHttpRoute({
        path: "/mapick/api/resume",
        auth: "plugin",
        handler: (_req, res) => {
            state.setEmergencyStop(false);
            res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true, emergency_stop: false }));
        },
    });
    return sse;
}
//# sourceMappingURL=index.js.map