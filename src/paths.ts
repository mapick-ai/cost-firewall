import { homedir } from "node:os";
import { join } from "node:path";

export function getOpenClawStateDir(): string {
  return process.env.OPENCLAW_STATE_DIR ?? join(homedir(), ".openclaw");
}

export function getOpenClawConfigPath(): string {
  return process.env.OPENCLAW_CONFIG_PATH ?? join(getOpenClawStateDir(), "openclaw.json");
}

export function getPluginStateDir(): string {
  return join(getOpenClawStateDir(), "plugins", "mapick-firewall");
}
