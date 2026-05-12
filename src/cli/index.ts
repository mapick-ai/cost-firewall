/**
 * CLI command implementation
 *
 * Register openclaw mapick <subcommand> command group
 */

import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import http from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { FirewallState } from "../state.js";
import { EventStore } from "../store.js";
import type { FirewallEvent } from "../types.js";

const PLUGIN_VERSION = (() => {
  try {
    return JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json"), "utf-8")).version;
  } catch { return "0.0.0"; }
})();

const API_BASE = process.env.MAPICK_API_BASE || "http://127.0.0.1:18789";

type ApiResult<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: string; statusCode?: number; contentType?: string };

function apiRequestJson<T = any>(
  method: "GET" | "POST",
  path: string,
  body?: object
): Promise<ApiResult<T>> {
  return new Promise((resolve) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const url = new URL(`${API_BASE}${path}`);
    const req = http.request(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : undefined,
    }, (res: any) => {
      let raw = "";
      res.on("data", (c: string) => raw += c);
      res.on("end", () => {
        const contentType = String(res.headers["content-type"] ?? "");
        if (!contentType.includes("application/json")) {
          resolve({ ok: false, error: "plugin_api_not_mounted", statusCode: res.statusCode, contentType });
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode >= 400 || parsed.ok === false) {
            resolve({ ok: false, error: parsed.error || `http_${res.statusCode}`, statusCode: res.statusCode, contentType });
            return;
          }
          resolve({ ok: true, data: parsed as T });
        } catch {
          resolve({ ok: false, error: "invalid_json_response", statusCode: res.statusCode, contentType });
        }
      });
    });
    req.on("error", () => resolve({ ok: false, error: "network_error" }));
    if (data) req.write(data);
    req.end();
  });
}

const apiGetJson = <T = any>(path: string) => apiRequestJson<T>("GET", path);
const apiPostJson = <T = any>(path: string, body: object) => apiRequestJson<T>("POST", path, body);

function failCli(message: string): void {
  console.error(message);
  process.exitCode = 1;
}

/** Aggregate today's stats from JSONL */
export async function aggregateFromJsonl(store: EventStore, memTokens: number, memBlocked: number): Promise<{
  today_tokens: number;
  today_blocked: number;
  events: FirewallEvent[];
}> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTs = todayStart.getTime();
  const events: FirewallEvent[] = [];

  try {
    const raw = await readFile(store.getEventsFilePath(), "utf-8");
    for (const line of raw.trim().split("\n")) {
      try {
        const e: FirewallEvent = JSON.parse(line);
        if (e.timestamp >= todayTs) events.push(e);
      } catch { /* skip */ }
    }
  } catch { /* file not found */ }

  const jsonlTokens = events.filter((e) => e.type === "model_call_ended").reduce((sum, e) => sum + (e.estimatedCost ?? 0), 0);
  const jsonlBlocked = events.filter((e) => e.type === "blocked").length;
  return { today_tokens: Math.max(memTokens, jsonlTokens), today_blocked: Math.max(memBlocked, jsonlBlocked), events };
}

export function registerCli(api: any, state: FirewallState, store: EventStore): void {
  api.registerCli(
    ({ program }: any) => {
      const firewall = program.command("firewall").description("Mapick Cost Firewall commands");

      firewall.command("status")
        .description("Show firewall status")
        .action(async () => {
          const r = await apiGetJson("/mapick/api/stats");
          if (r.ok) {
            console.log(JSON.stringify(r.data, null, 2));
            return;
          }
          if (r.error === "plugin_api_not_mounted") {
            failCli(`Error: Plugin API not mounted at /mapick/api/stats (got ${r.contentType || "unknown"}).`);
            return;
          }
          failCli(`Error: ${r.error || "unknown"}`);
        });

      firewall.command("reset")
        .description("Reset a source from cooldown")
        .argument("<source>", "Source name to reset")
        .action((source: string) => {
          state.breaker.reset(source);
          console.log(`Source ${source} reset.`);
        });

      firewall.command("mode")
        .description("Switch mode (observe|protect)")
        .argument("<mode>", "observe or protect")
        .action(async (mode: string) => {
          if (mode !== "observe" && mode !== "protect") {
            console.error("Invalid mode. Use 'observe' or 'protect'.");
            return;
          }
          const r = await apiPostJson("/mapick/api/config", { mode });
          if (!r.ok) { failCli(`Failed: ${r.error}`); return; }
          state.setMode(mode);
          console.log(`Mode set to ${mode}.`);
        });

      firewall.command("stop")
        .description("Emergency stop all AI calls")
        .action(async () => {
          const r = await apiGetJson<{ ok?: boolean; emergency_stop?: boolean }>("/mapick/api/stop");
          if (!r.ok) { failCli(`Failed: ${r.error}`); return; }
          if (r.data.emergency_stop !== true) { failCli("Failed: gateway did not confirm emergency_stop=true"); return; }
          console.log("Emergency stop activated.");
        });

      firewall.command("resume")
        .description("Resume AI calls after emergency stop")
        .action(async () => {
          const r = await apiGetJson<{ ok?: boolean; emergency_stop?: boolean }>("/mapick/api/resume");
          if (!r.ok) { failCli(`Failed: ${r.error}`); return; }
          if (r.data.emergency_stop !== false) { failCli("Failed: gateway did not confirm emergency_stop=false"); return; }
          console.log("Resumed.");
        });

      firewall.command("budget")
        .description("Set or reset daily token limit")
        .argument("<action>", "set <amount> or reset")
        .argument("[amount]", "Token count")
        .action(async (action: string, amount?: string) => {
          let body: object;
          if (action === "set" && amount) {
            body = { dailyTokenLimit: parseInt(amount, 10) };
            (state.config as any).dailyTokenLimit = parseInt(amount, 10);
          } else if (action === "reset") {
            body = { dailyTokenLimit: null };
            (state.config as any).dailyTokenLimit = null;
          } else {
            console.error("Usage: firewall budget set <amount> | firewall budget reset");
            return;
          }
          const r = await apiPostJson("/mapick/api/config", body);
          if (!r.ok) { failCli(`Failed: ${r.error}`); return; }
          console.log("Saved.");
        });

      firewall.command("log")
        .description("Show recent events")
        .option("--last <count>", "Number of events", "10")
        .action(async (opts: any) => {
          const count = parseInt(opts.last, 10) || 10;
          try {
            const raw = await readFile(store.getEventsFilePath(), "utf-8");
            const lines = raw.trim().split("\n");
            const recent = lines.slice(-count).map((l) => {
              try { return JSON.parse(l); } catch { return null; }
            }).filter(Boolean);
            for (const e of recent) {
              const t = new Date(e.timestamp).toISOString().slice(11, 19);
              const cost = e.estimatedCost ? `${Math.round(e.estimatedCost ?? 0)}t` : "";
              console.log(`${t} | ${e.type.padEnd(22)} | ${(e.provider ?? "").padEnd(12)} | ${(e.model ?? "").padEnd(30)} | ${(e.outcome ?? "").padEnd(10)} | ${cost}`);
            }
          } catch {
            console.log("No events recorded yet.");
          }
        });
    },
    {
      descriptors: [
        { name: "firewall", description: "Mapick Cost Firewall commands", hasSubcommands: true },
      ],
    }
  );
}

export async function getStatus(state: FirewallState, store?: EventStore): Promise<object> {
  let spent = state.globalStats.todayTokens;
  let blocked = state.globalStats.todayBlocked;
  let coolingSources = state.breaker.getCoolingSources();
  let activeRuns = state.getActiveRuns();

  if (store) {
    const agg = await aggregateFromJsonl(store, spent, blocked);
    spent = agg.today_tokens;
    blocked = agg.today_blocked;

    // Aggregate cooling sources from events (source+reason of recent blocked events)
    const recentBlocks = agg.events
      .filter((e: any) => e.type === "blocked")
      .slice(-10);
    if (recentBlocks.length > 0 && coolingSources.length === 0) {
      coolingSources = recentBlocks.map((e: any) => ({
        source: e.source || "unknown",
        reason: e.reason || "unknown",
        remainingSec: 0,
      }));
    }

    // Aggregate active runs from events (runs without corresponding agent_end)
    const runEnded = new Set(agg.events.filter((e: any) => e.type === "agent_end").map((e: any) => e.runId));
    const activeRunMap = new Map<string, any>();
    for (const e of agg.events) {
      if (e.runId && !runEnded.has(e.runId) && (e.type === "model_call_ended" || e.type === "run_status_change")) {
        const r = activeRunMap.get(e.runId) || { runId: e.runId, source: e.source || "", calls: 0, tokens: 0, status: "healthy" };
        if (e.type === "model_call_ended") { r.calls++; r.tokens += (e.estimatedCost || 0); }
        if (e.type === "run_status_change" && e.status) { r.status = e.status; if (e.reason) r.reason = e.reason; }
        activeRunMap.set(e.runId, r);
      }
    }
    if (activeRunMap.size > 0 && activeRuns.length === 0) {
      activeRuns = Array.from(activeRunMap.values());
    }
  }

  return {
    mode: state.globalStats.mode,
    emergency_stop: state.globalStats.emergencyStop,
    today_tokens: spent,
    today_blocked: blocked,
    today_saved_estimate: state.globalStats.todaySavedEstimate,
    daily_token_limit: state.config.dailyTokenLimit,
    breaker: {
      consecutive_failures: state.config.breaker?.consecutiveFailures,
      cooldown_sec: state.config.breaker?.cooldownSec,
      token_velocity_threshold: state.config.breaker?.tokenVelocityThreshold,
      token_velocity_window_sec: state.config.breaker?.tokenVelocityWindowSec,
      call_frequency_threshold: state.config.breaker?.callFrequencyThreshold,
      call_frequency_window_sec: state.config.breaker?.callFrequencyWindowSec,
    },
    cooling_sources: coolingSources,
    active_runs: activeRuns,
    version: PLUGIN_VERSION,
  };
}

export async function getLog(store: EventStore, count: number): Promise<object[]> {
  try {
    const raw = await readFile(store.getEventsFilePath(), "utf-8");
    return raw.trim().split("\n").slice(-count).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}
