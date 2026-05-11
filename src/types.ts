/**
 * Shared type definitions
 */

// Source key identifies call origin
export type SourceKey = string;

// Single LLM call state
export interface CallState {
  callId: string;
  provider: string;
  model: string;
  api?: string;
  transport?: string;
  startedAt: number;
  durationMs?: number;
  outcome?: "completed" | "error";
  errorCategory?: string;
  failureKind?: string;
  requestPayloadBytes?: number;
  responseStreamBytes?: number;
  estimatedCost?: number;
}

// Single run state (one agent reply)
export interface RunState {
  runId: string;
  sessionId?: string;
  sessionKey?: string;
  source: SourceKey;
  startedAt: number;
  calls: Map<string, CallState>;
  llmCallTimestamps: number[];
  cumulativeCost: number;
  promptHashCounts: Map<string, number>;
  finalizeWarningEmitted?: boolean;
  status: "healthy" | "warning" | "danger";
  reason?: string;
}

// Breaker state
export interface BreakerState {
  source: SourceKey;
  consecutiveFailures: number;
  brokenUntil?: number;
  reason?: string;
  // Sliding window tracking
  tokenHistory: { ts: number; tokens: number }[];
  callTimestamps: number[];
  // Last call info
  lastCallTs?: number;
  lastCallTokens?: number;
}

// Plugin config
export interface FirewallConfig {
  breaker?: {
    consecutiveFailures?: number;
    cooldownSec?: number;
    tokenVelocityWindowSec?: number;
    tokenVelocityThreshold?: number;
    callFrequencyWindowSec?: number;
    callFrequencyThreshold?: number;
  };
  dailyTokenLimit?: number | null;
  privacy?: {
    storePromptText?: boolean;
    enableRawConversationHooks?: boolean;
  };
}

// Global stats
export interface GlobalStats {
  emergencyStop: boolean;
  mode: "observe" | "protect";
  todayTokens: number;
  todayBlocked: number;
  todaySavedEstimate: number;
}
// Block decision
export interface BlockDecision {
  allow: boolean;
  reason?: string;
  layer: "hook" | "provider";
}

// Precheck result
export interface PrecheckResult {
  allow: boolean;
  reason?: string;
  layer: "hook" | "provider";
}

// Event record
export interface FirewallEvent {
  type: string;
  timestamp: number;
  runId?: string;
  callId?: string;
  source?: SourceKey;
  provider?: string;
  model?: string;
  outcome?: string;
  failureKind?: string;
  estimatedCost?: number;
  cumulativeTokens?: number;
  reason?: string;
  layer?: "hook" | "provider";
  runCalls?: number;
  status?: string;
}

// Plugin ID
export const PLUGIN_ID = "mapick-firewall";
export const PLUGIN_NAME = "Mapick Cost Firewall";
