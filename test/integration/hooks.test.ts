import { describe, it, expect, beforeEach } from "vitest";
import { FirewallState } from "../../src/state.js";
import { EventStore } from "../../src/store.js";
import { createBeforeAgentReplyHandler } from "../../src/hooks/before-agent-reply.js";
import { createModelCallEndedHandler } from "../../src/hooks/model-call.js";

describe("Hook Layer 集成", () => {
  let state: FirewallState;
  let store: EventStore;

  beforeEach(() => {
    state = new FirewallState();
    store = new EventStore();
  });

  describe("observe 模式", () => {
    it("默认放行所有请求", async () => {
      const handler = createBeforeAgentReplyHandler(state, store);
      const result = await handler({ agentId: "test" }, {});
      expect(result).toBeUndefined();
    });

    it("记录 model_call 事件", () => {
      const handler = createModelCallEndedHandler(state, store);
      handler({
        runId: "run-1",
        callId: "call-1",
        provider: "openai",
        model: "gpt-4o",
        durationMs: 1000,
        outcome: "completed",
        responseStreamBytes: 1024,
      }, {});
      expect(state.getTodayTokens()).toBeGreaterThan(0);
    });
  });

  describe("protect 模式", () => {
    it("Emergency Stop 阻断请求", async () => {
      state.setEmergencyStop(true);
      const handler = createBeforeAgentReplyHandler(state, store);
      const result = await handler({ agentId: "test" }, {});
      expect(result).toBeDefined();
      expect(result?.reason).toBe("emergency_stop");
      expect(result?.reply.isError).toBe(true);
    });

    it("超预算阻断请求", async () => {
      state.setMode("protect");
      (state.config as any).dailyTokenLimit = 0.001;
      state.updateSourceStats("test", 0.01);

      const handler = createBeforeAgentReplyHandler(state, store);
      const result = await handler({ agentId: "test" }, {});
      expect(result).toBeDefined();
      expect(result?.reason).toBe("daily_token_limit");
    });

    it("熔断阻断请求", async () => {
      state.setMode("protect");
      for (let i = 0; i < 5; i++) {
        state.breaker.recordFailure("test");
      }

      const handler = createBeforeAgentReplyHandler(state, store);
      const result = await handler({ agentId: "test" }, {});
      expect(result).toBeDefined();
      expect(result?.reason).toBe("source_cooldown");
    });
  });
});
