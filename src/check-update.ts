/**
 * Version update checker
 *
 * Checks mapick-api for latest firewall version.
 * Throttled to twice per day (morning/afternoon).
 * State cached locally in JSONL store directory.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { hostname } from "node:os";
import { createHash } from "node:crypto";
import { getPluginStateDir } from "./paths.js";

/** Generate a stable, anonymous device fingerprint (no personal data) */
function deviceFingerprint(): string {
  const seed = hostname();
  return createHash("sha256").update(seed).digest("hex").slice(0, 16);
}

/** Normalize version string: strip "v" prefix, trim whitespace */
function norm(v: string): string {
  return (v || "").replace(/^v/, "").trim();
}

export function isNewerVersion(latest: string, current: string): boolean {
  const latestParts = norm(latest).split(".").map((part) => Number.parseInt(part, 10));
  const currentParts = norm(current).split(".").map((part) => Number.parseInt(part, 10));
  for (let i = 0; i < Math.max(latestParts.length, currentParts.length, 3); i++) {
    const l = Number.isFinite(latestParts[i]) ? latestParts[i] : 0;
    const c = Number.isFinite(currentParts[i]) ? currentParts[i] : 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

const STATE_DIR = getPluginStateDir();
const CHECK_FILE = join(STATE_DIR, "version-check.json");

interface CheckState {
  lastCheck: number;
  latestVersion: string;
  currentVersion: string;
}

function readState(): CheckState | null {
  try {
    if (!existsSync(CHECK_FILE)) return null;
    return JSON.parse(readFileSync(CHECK_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function writeState(state: CheckState): void {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(CHECK_FILE, JSON.stringify(state));
}

function isSameHalfDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return d1.toDateString() === d2.toDateString()
    && (d1.getHours() < 12) === (d2.getHours() < 12);
}

export interface UpdateResult {
  updateAvailable: boolean;
  current: string;
  latest: string;
  checked: boolean;
}

export async function checkForUpdate(currentVersion: string): Promise<UpdateResult> {
  const existing = readState();
  const now = Date.now();

  // Throttle: only check twice per day
  if (existing && isSameHalfDay(existing.lastCheck, now)) {
    return {
      updateAvailable: isNewerVersion(existing.latestVersion, currentVersion),
      current: currentVersion,
      latest: existing.latestVersion,
      checked: false,
    };
  }

  // Fetch latest version from mapick-api
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const fp = deviceFingerprint();
    const resp = await fetch(`https://api.mapick.ai/api/v1/firewall/latest-version?device=${fp}`, {
      signal: controller.signal,
      headers: { "Accept": "application/json" },
    });
    clearTimeout(timeout);

    if (!resp.ok) return { updateAvailable: false, current: currentVersion, latest: currentVersion, checked: false };

    const data = await resp.json() as { version?: string };
    const latest = norm(data.version || currentVersion);

    const state: CheckState = { lastCheck: now, latestVersion: latest, currentVersion };
    writeState(state);

    return { updateAvailable: isNewerVersion(latest, currentVersion), current: currentVersion, latest, checked: true };
  } catch {
    return { updateAvailable: false, current: currentVersion, latest: currentVersion, checked: false };
  }
}
