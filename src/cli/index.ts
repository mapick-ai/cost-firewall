/**
 * CLI 命令实现
 *
 * 注册 openclaw mapick <subcommand> 命令组
 */

import { readFile } from "node:fs/promises";
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
          console.log(JSON.stringify({
            mode: state.globalStats.mode,
            emergency_stop: state.globalStats.emergencyStop,
            today_tokens: agg.today_tokens,
            today_blocked: agg.today_blocked,
            daily_token_limit: state.config.dailyTokenLimit,
            cooldown: state.config.breaker?.cooldownSec,
          }, null, 2));
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
        .description("Set or reset daily budget")
        .argument("<action>", "set <amount> or reset")
        .argument("[amount]", "Budget in USD")
        .action((action: string, amount?: string) => {
          if (action === "set" && amount) {
            (state.config as any).dailyTokenLimit = parseFloat(amount);
            console.log(`Daily budget set to $${amount}`);
          } else if (action === "reset") {
            (state.config as any).dailyTokenLimit = null;
            console.log("Daily budget reset.");
          } else {
            console.error("Usage: mapick budget set <amount> | mapick budget reset");
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
  };
}

export async function getLog(store: EventStore, count: number): Promise<object[]> {
  try {
    const raw = await readFile(store.getEventsFilePath(), "utf-8");
    return raw.trim().split("\n").slice(-count).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch { return []; }
}
