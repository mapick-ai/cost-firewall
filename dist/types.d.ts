/**
 * 共享类型定义
 */
export type SourceKey = string;
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
export interface BreakerState {
    source: SourceKey;
    consecutiveFailures: number;
    brokenUntil?: number;
    reason?: string;
    tokenHistory: {
        ts: number;
        tokens: number;
    }[];
    callTimestamps: number[];
    lastCallTs?: number;
    lastCallTokens?: number;
}
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
export interface GlobalStats {
    emergencyStop: boolean;
    mode: "observe" | "protect";
    todayTokens: number;
    todayBlocked: number;
    todaySavedEstimate: number;
}
export interface BlockDecision {
    allow: boolean;
    reason?: string;
    layer: "hook" | "provider";
}
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
export declare const PLUGIN_ID = "mapick-firewall";
export declare const PLUGIN_NAME = "Mapick Cost Firewall";
//# sourceMappingURL=types.d.ts.map