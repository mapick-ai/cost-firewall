/**
 * 共享类型定义
 */

// Source key 标识调用来源
export type SourceKey = string;

// 单次 LLM call 状态
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

// 单次 run 状态（一次 agent reply）
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

// 熔断器状态
export interface BreakerState {
  source: SourceKey;
  consecutiveFailures: number;
  brokenUntil?: number;
  reason?: string;
  // 滑动窗口追踪
  tokenHistory: { ts: number; tokens: number }[];
  callTimestamps: number[];
  // 上次调用信息
  lastCallTs?: number;
  lastCallTokens?: number;
}

// 插件配置
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

// 全局统计
export interface GlobalStats {
  emergencyStop: boolean;
  mode: "observe" | "protect";
  todayTokens: number;
  todayBlocked: number;
  todaySavedEstimate: number;
}
// Block 决策
export interface BlockDecision {
  allow: boolean;
  reason?: string;
  layer: "hook" | "provider";
}

// 事件记录
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
  reason?: string;
  layer?: "hook" | "provider";
}

// Plugin ID
export const PLUGIN_ID = "mapick-firewall";
export const PLUGIN_NAME = "Mapick Cost Firewall";
