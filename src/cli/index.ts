/**
 * CLI 命令实现
 *
 * 注册 openclaw mapick <subcommand> 命令组
 */

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import type { FirewallState } from "../state.js";
import { EventStore } from "../store.js";
import type { FirewallEvent } from "../types.js";

/** 从 JSONL 聚合今日统计数据 */
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
      const mapick = program.command("mapick").description("Mapick Cost Firewall commands");

      mapick.command("status")
        .description("Show firewall status")
        .action(async () => {
          const agg = await aggregateFromJsonl(store, state.globalStats.todayTokens, state.globalStats.todayBlocked);
          const cooling = state.breaker.getCoolingSources();
          console.log(JSON.stringify({
            mode: state.globalStats.mode,
            emergency_stop: state.globalStats.emergencyStop,
            today_tokens: agg.today_tokens,
            today_blocked: agg.today_blocked,
            daily_token_limit: state.config.dailyTokenLimit,
            cooldown_sec: state.config.breaker?.cooldownSec,
            cooling_sources: cooling,
          }, null, 2));
        });

      mapick.command("reset")
        .description("Reset a source from cooldown")
        .argument("<source>", "Source name to reset")
        .action((source: string) => {
          state.breaker.reset(source);
          console.log(`Source ${source} reset.`);
        });

      mapick.command("mode")
        .description("Switch mode (observe|protect)")
        .argument("<mode>", "observe or protect")
        .action((mode: string) => {
          if (mode !== "observe" && mode !== "protect") {
            console.error("Invalid mode. Use 'observe' or 'protect'.");
            return;
          }
          state.setMode(mode);
          console.log(`Mode set to ${mode}`);
        });

      mapick.command("stop")
        .description("Emergency stop all AI calls")
        .action(() => {
          state.setEmergencyStop(true);
          console.log("Emergency stop activated.");
        });

      mapick.command("resume")
        .description("Resume AI calls after emergency stop")
        .action(() => {
          state.setEmergencyStop(false);
          console.log("Resumed.");
        });

      mapick.command("budget")
        .description("Set or reset daily token limit")
        .argument("<action>", "set <amount> or reset")
        .argument("[amount]", "Token count")
        .action(async (action: string, amount?: string) => {
          const configPath = process.env.OPENCLAW_CONFIG_PATH
            ?? join(process.env.OPENCLAW_STATE_DIR ?? join(homedir(), ".openclaw"), "openclaw.json");
          try {
            const raw = await readFile(configPath, "utf-8");
            const openclawConfig = JSON.parse(raw);
            const entry = openclawConfig?.plugins?.entries?.["mapick-firewall"];
            if (!entry?.config) throw new Error("mapick-firewall config not found");
            if (action === "set" && amount) {
              entry.config.dailyTokenLimit = parseInt(amount, 10);
              (state.config as any).dailyTokenLimit = entry.config.dailyTokenLimit;
              await writeFile(configPath, JSON.stringify(openclawConfig, null, 2));
              console.log(`Daily token limit set to ${amount}.`);
            } else if (action === "reset") {
              entry.config.dailyTokenLimit = null;
              (state.config as any).dailyTokenLimit = null;
              await writeFile(configPath, JSON.stringify(openclawConfig, null, 2));
              console.log("Daily token limit reset. No limit.");
            }
          } catch (e: any) {
            console.error("Failed to update config:", e.message);
          }
        });

      mapick.command("log")
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
              const cost = e.estimatedCost ? `$${e.estimatedCost.toFixed(6)}` : "";
              console.log(`${t} | ${e.type.padEnd(22)} | ${(e.provider ?? "").padEnd(12)} | ${(e.model ?? "").padEnd(30)} | ${(e.outcome ?? "").padEnd(10)} | ${cost}`);
            }
          } catch {
            console.log("No events recorded yet.");
          }
        });
    },
    {
      descriptors: [
        { name: "mapick", description: "Mapick Cost Firewall commands", hasSubcommands: true },
      ],
    }
  );
}

export async function getStatus(state: FirewallState, store?: EventStore): Promise<object> {
  let spent = state.globalStats.todayTokens;
  let blocked = state.globalStats.todayBlocked;
  if (store) {
    const agg = await aggregateFromJsonl(store, spent, blocked);
    spent = agg.today_tokens;
    blocked = agg.today_blocked;
  }
  return {
    mode: state.globalStats.mode,
    emergency_stop: state.globalStats.emergencyStop,
    today_tokens: spent,
    today_blocked: blocked,
    today_saved_estimate: state.globalStats.todaySavedEstimate,
    daily_token_limit: state.config.dailyTokenLimit,
    breaker: { consecutive_failures_threshold: state.config.breaker?.consecutiveFailures, cooldown_sec: state.config.breaker?.cooldownSec },
    cooling_sources: state.breaker.getCoolingSources(),
    active_runs: state.getActiveRuns(),
  };
}

export async function getLog(store: EventStore, count: number): Promise<object[]> {
  try {
    const raw = await readFile(store.getEventsFilePath(), "utf-8");
    return raw.trim().split("\n").slice(-count).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}
