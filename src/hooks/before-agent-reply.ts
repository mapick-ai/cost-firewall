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
    const source = event.agentId ?? event.sessionKey ?? "unknown";

    // Unified precheck
    const result = state.precheck(source);

    if (!result.allow) {
      store.append({
        type: "blocked",
        source,
        reason: result.reason!,
        layer: result.layer,
      });
      state.globalStats.todayBlocked++;

      const messages: Record<string, string> = {
        emergency_stop: "Mapick Cost Firewall: all AI calls are paused.",
        daily_token_limit: "Mapick Cost Firewall: today's token limit has been reached.",
        source_cooldown: "Mapick Cost Firewall: this source is cooling down.",
        consecutive_failures: "Mapick Cost Firewall: this source is cooling down due to consecutive failures.",
        token_velocity: "Mapick Cost Firewall: this source is cooling down due to high token velocity.",
        call_frequency: "Mapick Cost Firewall: this source is cooling down due to high call frequency.",
      };

      return {
        handled: true,
        reply: {
          text: messages[result.reason!] ?? "Mapick Cost Firewall: request blocked.",
          isError: true,
        },
        reason: result.reason!,
      };
    }

    return undefined;
  };
}
