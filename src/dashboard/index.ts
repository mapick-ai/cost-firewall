/**
 * Dashboard HTTP route 注册
 */

import type { FirewallState } from "../state.js";
import { getStatus } from "../cli/index.js";
import { renderDashboardHtml } from "./html.js";
import { SseManager } from "./sse.js";

export function registerDashboard(
  api: any,
  state: FirewallState
): SseManager {
  const sse = new SseManager();

  api.registerHttpRoute({
    path: "/mapick/dashboard",
    auth: "gateway",
    handler: (_req: any, res: any) => {
      const stats = getStatus(state);
      res.send(renderDashboardHtml(stats));
    },
  });

  api.registerHttpRoute({
    path: "/mapick/api/stats",
    auth: "gateway",
    handler: (_req: any, res: any) => {
      res.json(getStatus(state));
    },
  });

  api.registerHttpRoute({
    path: "/mapick/api/live",
    auth: "gateway",
    handler: (req: any, res: any) => {
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
    handler: (_req: any, res: any) => {
      state.setEmergencyStop(true);
      res.json({ ok: true, emergency_stop: true });
    },
  });

  api.registerHttpRoute({
    path: "/mapick/api/resume",
    auth: "gateway",
    handler: (_req: any, res: any) => {
      state.setEmergencyStop(false);
      res.json({ ok: true, emergency_stop: false });
    },
  });

  return sse;
}
