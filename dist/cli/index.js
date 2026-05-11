/**
 * CLI command implementation
 *
 * Register openclaw mapick <subcommand> command group
 */
import { readFile } from "node:fs/promises";
import http from "node:http";
const API_BASE = "http://127.0.0.1:18789";
function apiGet(path) {
    return new Promise((resolve) => {
        http.get(`${API_BASE}${path}`, () => resolve()).on("error", () => resolve());
    });
}
function apiPost(body) {
    return new Promise((resolve) => {
        const data = JSON.stringify(body);
        const url = new URL(`${API_BASE}/mapick/api/config`);
        const req = http.request(url, { method: "POST", headers: { "Content-Type": "application/json" } }, () => resolve());
        req.on("error", () => resolve());
        req.write(data);
        req.end();
    });
}
/** Aggregate today's stats from JSONL */
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
        const firewall = program.command("firewall").description("Mapick Cost Firewall commands");
        firewall.command("status")
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
        firewall.command("reset")
            .description("Reset a source from cooldown")
            .argument("<source>", "Source name to reset")
            .action((source) => {
            state.breaker.reset(source);
            console.log(`Source ${source} reset.`);
        });
        firewall.command("mode")
            .description("Switch mode (observe|protect)")
            .argument("<mode>", "observe or protect")
            .action(async (mode) => {
            if (mode !== "observe" && mode !== "protect") {
                console.error("Invalid mode. Use 'observe' or 'protect'.");
                return;
            }
            state.setMode(mode);
            await apiPost({ mode });
            console.log(`Mode set to ${mode}`);
        });
        firewall.command("stop")
            .description("Emergency stop all AI calls")
            .action(async () => {
            state.setEmergencyStop(true);
            await apiPost({});
            await apiGet("/mapick/api/stop");
            console.log("Emergency stop activated.");
        });
        firewall.command("resume")
            .description("Resume AI calls after emergency stop")
            .action(async () => {
            state.setEmergencyStop(false);
            await apiGet("/mapick/api/resume");
            console.log("Resumed.");
        });
        firewall.command("budget")
            .description("Set or reset daily token limit")
            .argument("<action>", "set <amount> or reset")
            .argument("[amount]", "Token count")
            .action(async (action, amount) => {
            // Update via gateway's /config API (don't write file directly to avoid breaking format)
            const http = await import("node:http");
            let body;
            if (action === "set" && amount) {
                body = JSON.stringify({ dailyTokenLimit: parseInt(amount, 10) });
                state.config.dailyTokenLimit = parseInt(amount, 10);
            }
            else if (action === "reset") {
                body = JSON.stringify({ dailyTokenLimit: null });
                state.config.dailyTokenLimit = null;
            }
            else {
                console.error("Usage: firewall budget set <amount> | firewall budget reset");
                return;
            }
            // Write to memory + notify gateway (fire-and-forget)
            const url = new URL("http://127.0.0.1:18789/mapick/api/config");
            const req = http.request(url, { method: "POST", headers: { "Content-Type": "application/json" } }, (res) => {
                let data = "";
                res.on("data", (c) => data += c);
                res.on("end", () => {
                    try {
                        const d = JSON.parse(data);
                        console.log(d.ok ? "Saved." : "Error: " + (d.error || "unknown"));
                    }
                    catch {
                        console.log("Config updated.");
                    }
                });
            });
            req.on("error", () => console.log("Config updated (gateway unreachable, memory only)."));
            req.write(body);
            req.end();
        });
        firewall.command("log")
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
                    const cost = e.estimatedCost ? `${Math.round(e.estimatedCost ?? 0)}t` : "";
                    console.log(`${t} | ${e.type.padEnd(22)} | ${(e.provider ?? "").padEnd(12)} | ${(e.model ?? "").padEnd(30)} | ${(e.outcome ?? "").padEnd(10)} | ${cost}`);
                }
            }
            catch {
                console.log("No events recorded yet.");
            }
        });
    }, {
        descriptors: [
            { name: "firewall", description: "Mapick Cost Firewall commands", hasSubcommands: true },
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
        // Aggregate cooling sources from events (source+reason of recent blocked events)
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
        // Aggregate active runs from events (runs without corresponding agent_end)
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