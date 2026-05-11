/**
 * CLI 命令实现
 *
 * 注册 openclaw mapick <subcommand> 命令组
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
/** 从 JSONL 聚合今日统计数据 */
export async function aggregateFromJsonl(store, memTokens, memBlocked) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTs = todayStart.getTime();
    const events = [];
    try {
        const raw = await readFile(store.getEventsFilePath(), "utf-8");
        for (const line of raw.trim().split("\n")) {
            try {
                const e = JSON.parse(line);
                if (e.timestamp >= todayTs)
                    events.push(e);
            }
            catch { /* skip */ }
        }
    }
    catch { /* file not found */ }
    const jsonlTokens = events.filter((e) => e.type === "model_call_ended").reduce((sum, e) => sum + (e.estimatedCost ?? 0), 0);
    const jsonlBlocked = events.filter((e) => e.type === "blocked").length;
    return { today_tokens: Math.max(memTokens, jsonlTokens), today_blocked: Math.max(memBlocked, jsonlBlocked), events };
}
export function registerCli(api, state, store) {
    api.registerCli(({ program }) => {
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
            .action((source) => {
            state.breaker.reset(source);
            console.log(`Source ${source} reset.`);
        });
        mapick.command("mode")
            .description("Switch mode (observe|protect)")
            .argument("<mode>", "observe or protect")
            .action((mode) => {
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
            .action(async (action, amount) => {
            const configPath = process.env.OPENCLAW_CONFIG_PATH
                ?? join(process.env.OPENCLAW_STATE_DIR ?? join(homedir(), ".openclaw"), "openclaw.json");
            try {
                const raw = await readFile(configPath, "utf-8");
                const openclawConfig = JSON.parse(raw);
                const entry = openclawConfig?.plugins?.entries?.["mapick-firewall"];
                if (!entry?.config)
                    throw new Error("mapick-firewall config not found");
                if (action === "set" && amount) {
                    entry.config.dailyTokenLimit = parseInt(amount, 10);
                    state.config.dailyTokenLimit = entry.config.dailyTokenLimit;
                    await writeFile(configPath, JSON.stringify(openclawConfig, null, 2));
                    console.log(`Daily token limit set to ${amount}.`);
                }
                else if (action === "reset") {
                    entry.config.dailyTokenLimit = null;
                    state.config.dailyTokenLimit = null;
                    await writeFile(configPath, JSON.stringify(openclawConfig, null, 2));
                    console.log("Daily token limit reset. No limit.");
                }
            }
            catch (e) {
                console.error("Failed to update config:", e.message);
            }
        });
        mapick.command("log")
            .description("Show recent events")
            .option("--last <count>", "Number of events", "10")
            .action(async (opts) => {
            const count = parseInt(opts.last, 10) || 10;
            try {
                const raw = await readFile(store.getEventsFilePath(), "utf-8");
                const lines = raw.trim().split("\n");
                const recent = lines.slice(-count).map((l) => {
                    try {
                        return JSON.parse(l);
                    }
                    catch {
                        return null;
                    }
                }).filter(Boolean);
                for (const e of recent) {
                    const t = new Date(e.timestamp).toISOString().slice(11, 19);
                    const cost = e.estimatedCost ? `$${e.estimatedCost.toFixed(6)}` : "";
                    console.log(`${t} | ${e.type.padEnd(22)} | ${(e.provider ?? "").padEnd(12)} | ${(e.model ?? "").padEnd(30)} | ${(e.outcome ?? "").padEnd(10)} | ${cost}`);
                }
            }
            catch {
                console.log("No events recorded yet.");
            }
        });
    }, {
        descriptors: [
            { name: "mapick", description: "Mapick Cost Firewall commands", hasSubcommands: true },
        ],
    });
}
export async function getStatus(state, store) {
    let spent = state.globalStats.todayTokens;
    let blocked = state.globalStats.todayBlocked;
    let coolingSources = state.breaker.getCoolingSources();
    let activeRuns = state.getActiveRuns();
    if (store) {
        const agg = await aggregateFromJsonl(store, spent, blocked);
        spent = agg.today_tokens;
        blocked = agg.today_blocked;
        // 从 events 聚合 cooling sources（最近 blocked 事件的 source+reason）
        const recentBlocks = agg.events
            .filter((e) => e.type === "blocked")
            .slice(-10);
        if (recentBlocks.length > 0 && coolingSources.length === 0) {
            coolingSources = recentBlocks.map((e) => ({
                source: e.source || "unknown",
                reason: e.reason || "unknown",
                remainingSec: 0,
            }));
        }
        // 从 events 聚合 active runs（没有对应 agent_end 的 run）
        const runEnded = new Set(agg.events.filter((e) => e.type === "agent_end").map((e) => e.runId));
        const activeRunMap = new Map();
        for (const e of agg.events) {
            if (e.runId && !runEnded.has(e.runId) && (e.type === "model_call_ended" || e.type === "run_status_change")) {
                const r = activeRunMap.get(e.runId) || { runId: e.runId, source: e.source || "", calls: 0, tokens: 0, status: "healthy" };
                if (e.type === "model_call_ended") {
                    r.calls++;
                    r.tokens += (e.estimatedCost || 0);
                }
                if (e.type === "run_status_change" && e.status) {
                    r.status = e.status;
                    if (e.reason)
                        r.reason = e.reason;
                }
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
    };
}
export async function getLog(store, count) {
    try {
        const raw = await readFile(store.getEventsFilePath(), "utf-8");
        return raw.trim().split("\n").slice(-count).map((l) => { try {
            return JSON.parse(l);
        }
        catch {
            return null;
        } }).filter(Boolean);
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=index.js.map