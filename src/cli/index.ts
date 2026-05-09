/**
 * CLI 命令实现
 */

import { readFile } from "node:fs/promises";
import type { FirewallState } from "../state.js";
import type { EventStore, FirewallEvent } from "../store.js";

export function registerCli(
  api: any,
  state: FirewallState,
  store: EventStore
): void {
  // CLI 功能通过 HTTP route 暴露
  // 实际实现依赖 OpenClaw 的 CLI 扩展机制
}

/** 从 JSONL 聚合今日统计数据 */
async function aggregateFromJsonl(store: EventStore, memSpent: number, memBlocked: number): Promise<{
  today_spent: number;
  today_blocked: number;
  events: FirewallEvent[];
}> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTs = todayStart.getTime();
  const events: FirewallEvent[] = [];

  try {
    const raw = await readFile(store.getEventsFilePath(), "utf-8");
    const lines = raw.trim().split("\n");
    for (const line of lines) {
      try {
        const e: FirewallEvent = JSON.parse(line);
        if (e.timestamp >= todayTs) {
          events.push(e);
        }
      } catch { /* skip */ }
    }
  } catch { /* file not found, use mem only */ }

  const jsonlSpent = events
    .filter((e) => e.type === "model_call_ended")
    .reduce((sum, e) => sum + (e.estimatedCost ?? 0), 0);
  const jsonlBlocked = events.filter((e) => e.type === "blocked").length;

  return {
    today_spent: Math.max(memSpent, jsonlSpent),
    today_blocked: Math.max(memBlocked, jsonlBlocked),
    events,
  };
}

export async function getStatus(state: FirewallState, store?: EventStore): Promise<object> {
  let spent = state.globalStats.todaySpent;
  let blocked = state.globalStats.todayBlocked;

  if (store) {
    const agg = await aggregateFromJsonl(store, spent, blocked);
    spent = agg.today_spent;
    blocked = agg.today_blocked;
  }

  return {
    mode: state.globalStats.mode,
    emergency_stop: state.globalStats.emergencyStop,
    today_spent: spent,
    today_blocked: blocked,
    today_saved_estimate: state.globalStats.todaySavedEstimate,
    daily_budget: state.config.dailyBudgetUsd,
    breaker: {
      consecutive_failures_threshold: state.config.breaker?.consecutiveFailures,
      cooldown_sec: state.config.breaker?.cooldownSec,
    },
  };
}

export function setMode(state: FirewallState, mode: "observe" | "protect"): void {
  state.setMode(mode);
}

export function stop(state: FirewallState): void {
  state.setEmergencyStop(true);
}

export function resume(state: FirewallState): void {
  state.setEmergencyStop(false);
}

export function setBudget(state: FirewallState, amount: number | null): void {
  (state.config as any).dailyBudgetUsd = amount;
}

export async function getLog(store: EventStore, count: number): Promise<object[]> {
  try {
    const raw = await readFile(store.getEventsFilePath(), "utf-8");
    const lines = raw.trim().split("\n");
    const events = lines.slice(-count).map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
    return events;
  } catch {
    return [];
  }
}
