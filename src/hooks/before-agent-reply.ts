/**
 * before_agent_reply hook 处理
 *
 * 职责：
 * - Emergency Stop 阻断
 * - Daily Budget 阻断
 * - Source Cooldown 阻断
 */

import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";

export interface BeforeAgentReplyEvent {
  agentId?: string;
  sessionId?: string;
  sessionKey?: string;
}

export interface BeforeAgentReplyCtx {
  agentId?: string;
  sessionId?: string;
}

export interface HandledReply {
  handled: true;
  reply: {
    text: string;
    isError: boolean;
  };
  reason: string;
}

export function createBeforeAgentReplyHandler(
  state: FirewallState,
  store: EventStore
) {
  return async function handleBeforeAgentReply(
    event: BeforeAgentReplyEvent,
    ctx: BeforeAgentReplyCtx
  ): Promise<HandledReply | undefined> {
    if (state.globalStats.emergencyStop) {
      const source = event.agentId ?? "unknown";
      store.append({
        type: "blocked",
        source,
        reason: "emergency_stop",
        layer: "hook",
      });
      state.globalStats.todayBlocked++;
      return {
        handled: true,
        reply: {
          text: "Mapick Cost Firewall: all AI calls are paused.",
          isError: true,
        },
        reason: "emergency_stop",
      };
    }

    if (state.isBudgetExceeded()) {
      const source = event.agentId ?? "unknown";
      store.append({
        type: "blocked",
        source,
        reason: "daily_budget_exceeded",
        layer: "hook",
      });
      state.globalStats.todayBlocked++;
      return {
        handled: true,
        reply: {
          text: "Mapick Cost Firewall: today's AI budget has been reached.",
          isError: true,
        },
        reason: "daily_budget_exceeded",
      };
    }

    const source = event.agentId ?? event.sessionKey ?? "unknown";
    if (state.breaker.isCoolingDown(source)) {
      store.append({
        type: "blocked",
        source,
        reason: state.breaker.getBlockedReason(source),
        layer: "hook",
      });
      state.globalStats.todayBlocked++;
      return {
        handled: true,
        reply: {
          text: "Mapick Cost Firewall: this source is cooling down.",
          isError: true,
        },
        reason: "source_cooldown",
      };
    }

    return undefined;
  };
}
