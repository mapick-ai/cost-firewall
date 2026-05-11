/**
 * model_call_started / model_call_ended hook handler
 *
 * Responsibilities:
 * - Record metadata for each LLM call
 * - Estimate cost
 * - Update breaker state
 * - Write event log
 */

import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
import { estimateCost } from "../pricing.js";
import { sourceFromModelCall } from "../source.js";
import { testBlockRequested, clearTestBlock } from "./before-agent-reply.js";

export interface ModelCallStartedEvent {
  runId: string;
  callId: string;
  sessionKey?: string;
  sessionId?: string;
  provider: string;
  model: string;
  api?: string;
  transport?: string;
}

export interface ModelCallEndedEvent extends ModelCallStartedEvent {
  durationMs: number;
  outcome: "completed" | "error";
  errorCategory?: string;
  failureKind?: "aborted" | "connection_closed" | "connection_reset" | "terminated" | "timeout";
  requestPayloadBytes?: number;
  responseStreamBytes?: number;
  timeToFirstByteMs?: number;
  upstreamRequestIdHash?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export function createModelCallStartedHandler(
  state: FirewallState,
  store: EventStore
) {
  return function handleModelCallStarted(
    event: ModelCallStartedEvent,
    ctx: any
  ): void {
    const source = sourceFromModelCall(event, ctx);

    // Test block detection: user typed "block test" → activate emergency stop now
    if (testBlockRequested) {
      const src = testBlockRequested.source || source;
      clearTestBlock();
      store.append({ type: "blocked", source: src, reason: "test_block", layer: "hook" });
      state.globalStats.todayBlocked++;
      state.setEmergencyStop(true);
    }

    const run = state.getOrCreateRun(event.runId, source, event.sessionId, event.sessionKey);

    state.addCallToRun(event.runId, event.callId, {
      callId: event.callId,
      provider: event.provider,
      model: event.model,
      api: event.api,
      transport: event.transport,
      startedAt: Date.now(),
    });

    run.llmCallTimestamps.push(Date.now());
  };
}

export function createModelCallEndedHandler(
  state: FirewallState,
  store: EventStore
) {
  return function handleModelCallEnded(
    event: ModelCallEndedEvent,
    ctx: any
  ): void {
    const source = sourceFromModelCall(event, ctx);
    const run = state.getOrCreateRun(event.runId, source, event.sessionId, event.sessionKey);

    // Use precise usage if available from the event, otherwise fallback to bytes/4 estimation
    let estimatedTokens: number;
    if (event.usage?.prompt_tokens || event.usage?.completion_tokens) {
      // Precise token count from upstream provider
      estimatedTokens = (event.usage.prompt_tokens ?? 0) + (event.usage.completion_tokens ?? 0);
    } else {
      // Fallback: 1 token ≈ 4 bytes
      const totalBytes = (event.requestPayloadBytes ?? 0) + (event.responseStreamBytes ?? 0);
      estimatedTokens = Math.round(totalBytes / 4);
    }

    const call = run.calls.get(event.callId);
    if (call) {
      call.durationMs = event.durationMs;
      call.outcome = event.outcome;
      call.errorCategory = event.errorCategory;
      call.failureKind = event.failureKind;
      call.requestPayloadBytes = event.requestPayloadBytes;
      call.responseStreamBytes = event.responseStreamBytes;
      call.estimatedCost = estimatedTokens;
    }

    if (event.outcome === "error") {
      state.breaker.recordFailure(source);
    } else {
      state.breaker.recordSuccess(source);
    }

    state.updateRunCost(event.runId, estimatedTokens);
    state.updateSourceStats(source, estimatedTokens);

    // Token velocity + call frequency + zero output detection
    if (event.outcome === "completed") {
      state.breaker.recordTokens(source, estimatedTokens);
      // Zero output detection: spent tokens but output is zero
      if (estimatedTokens > 0 && event.responseStreamBytes && event.responseStreamBytes < 100) {
        store.append({
          type: "zero_output_warning",
          source,
          provider: event.provider,
          model: event.model,
          estimatedCost: estimatedTokens,
        });
      }
    }
    state.breaker.recordCall(source);

    // RunState status detection: cumulative tokens / call count / repeated prompts
    const runTokens = run.cumulativeCost + estimatedTokens;
    const runCalls = run.llmCallTimestamps.length;
    const prevStatus = run.status;

    if (runTokens > 500000) {
      run.status = "danger";
      run.reason = "run_tokens_exceeded";
    } else if (runCalls > 50) {
      run.status = "warning";
      run.reason = "run_calls_high";
    }

    if (run.status !== prevStatus) {
      store.append({
        type: "run_status_change",
        runId: event.runId,
        source,
        cumulativeTokens: runTokens,
        runCalls,
        status: run.status,
        reason: run.reason,
      });
    }

    // Single run cumulative token warning
    const runCumulative = run.cumulativeCost + estimatedTokens;
    if (runCumulative > 200000) {
      store.append({
        type: "run_token_warning",
        runId: event.runId,
        source,
        cumulativeTokens: runCumulative,
      });
    }

    store.append({
      type: "model_call_ended",
      runId: event.runId,
      callId: event.callId,
      source,
      provider: event.provider,
      model: event.model,
      outcome: event.outcome,
      failureKind: event.failureKind,
      estimatedCost: estimatedTokens,
    });
  };
}
