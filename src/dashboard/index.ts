/**
 * Dashboard HTTP route 注册
 */

import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
import { getStatus } from "../cli/index.js";
import { renderDashboardHtml } from "./html.js";
import { SseManager } from "./sse.js";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

function getConfigPath(): string {
  return process.env.OPENCLAW_CONFIG_PATH
    ?? join(process.env.OPENCLAW_STATE_DIR ?? join(homedir(), ".openclaw"), "openclaw.json");
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk: string) => { data += chunk; });
    req.on("end", () => resolve(data));
  });
}

export function registerDashboard(
  api: any,
  state: FirewallState,
  store: EventStore
): SseManager {
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
    handler: async (_req: any, res: any) => {
      const stats = await getStatus(state, store);
      res.writeHead(200, {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      });
      res.end(renderDashboardHtml(stats));
    },
  });

  // Stats API
  api.registerHttpRoute({
    path: "/mapick/api/stats",
    auth: "plugin",
    handler: async (_req: any, res: any) => {
      const stats = await getStatus(state, store);
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(stats));
    },
  });

  // SSE
  api.registerHttpRoute({
    path: "/mapick/api/live",
    auth: "plugin",
    handler: (req: any, res: any) => {
      res.writeHead(200, { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
      const unsubscribe = sse.subscribe((data) => res.write(data));
      req.on("close", unsubscribe);
    },
  });

  // Emergency Stop
  api.registerHttpRoute({
    path: "/mapick/api/stop",
    auth: "plugin",
    handler: (_req: any, res: any) => {
      state.setEmergencyStop(true);
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, emergency_stop: true }));
    },
  });

  // Resume
  api.registerHttpRoute({
    path: "/mapick/api/resume",
    auth: "plugin",
    handler: (_req: any, res: any) => {
      state.setEmergencyStop(false);
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, emergency_stop: false }));
    },
  });

  // Reset source
  api.registerHttpRoute({
    path: "/mapick/api/reset-source",
    auth: "plugin",
    handler: (req: any, res: any) => {
      const url = new URL(req.url, "http://localhost");
      const source = url.searchParams.get("source") || "";
      if (source) {
        state.breaker.reset(source);
        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, source }));
      } else {
        res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "missing source param" }));
      }
    },
  });

  // Events API
  api.registerHttpRoute({
    path: "/mapick/api/events",
    auth: "plugin",
    handler: async (_req: any, res: any) => {
      try {
        const raw = await readFile(store.getEventsFilePath(), "utf-8");
        const events = raw.trim().split("\n").slice(-30).map((l: string) => {
          try { return JSON.parse(l); } catch { return null; }
        }).filter(Boolean);
        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify(events));
      } catch {
        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify([]));
      }
    },
  });

  // Config update (POST JSON)
  api.registerHttpRoute({
    path: "/mapick/api/config",
    auth: "plugin",
    handler: async (req: any, res: any) => {
      try {
        const body = await readBody(req);
        const cfg = JSON.parse(body);
        const configPath = getConfigPath();
        const raw = await readFile(configPath, "utf-8");
        const openclawConfig = JSON.parse(raw);
        const entry = openclawConfig?.plugins?.entries?.["mapick-firewall"];
        const current = entry?.config || {};

        if (cfg.mode) {
          state.setMode(cfg.mode);
        }
        if (cfg.dailyTokenLimit !== undefined) {
          current.dailyTokenLimit = cfg.dailyTokenLimit;
          (state.config as any).dailyTokenLimit = cfg.dailyTokenLimit;
        }
        if (cfg.breaker) {
          current.breaker = { ...current.breaker, ...cfg.breaker };
          (state.config as any).breaker = { ...(state.config as any).breaker, ...cfg.breaker };
        }

        entry.config = current;
        await writeFile(configPath, JSON.stringify(openclawConfig, null, 2));
        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, config: current }));
      } catch (e: any) {
        res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    },
  });

  return sse;
}
