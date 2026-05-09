import { describe, it, expect, beforeEach } from "vitest";
import { parseMapickModelRef, isMapickModelRef } from "../../src/provider/route.js";
import { createBlockedStream } from "../../src/provider/synthetic.js";
import { FirewallState } from "../../src/state.js";

describe("Provider Layer 集成", () => {
  describe("Route 解析", () => {
    it("解析 5 个支持的 provider", () => {
      const providers = ["openai", "anthropic", "openrouter", "deepseek", "qwen"];
      for (const p of providers) {
        const ref = `mapick/${p}/test-model`;
        expect(isMapickModelRef(ref)).toBe(true);
        const route = parseMapickModelRef(ref);
        expect(route).not.toBeNull();
        expect(route!.upstream).toBe(p);
      }
    });
  });

  describe("Blocked Stream", () => {
    it("生成 OpenAI 格式的 blocked response", async () => {
      const stream = createBlockedStream({
        provider: "openai",
        model: "gpt-4o",
        reason: "emergency_stop",
      });

      const chunks: any[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].object).toBe("chat.completion.chunk");
    });

    it("生成 Anthropic 格式的 blocked response", async () => {
      const stream = createBlockedStream({
        provider: "anthropic",
        model: "claude-sonnet-4-6",
        reason: "daily_budget_exceeded",
        format: "anthropic",
      });

      const chunks: any[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].type).toBe("message_start");
    });
  });

  describe("Precheck 逻辑", () => {
    it("Emergency Stop 阻断 provider 层请求", () => {
      const state = new FirewallState();
      state.setEmergencyStop(true);
      expect(state.globalStats.emergencyStop).toBe(true);
    });

    it("Budget 阻断 provider 层请求", () => {
      const state = new FirewallState({ dailyBudgetUsd: 0.01 });
      state.updateSourceStats("test", 0.1);
      expect(state.isBudgetExceeded()).toBe(true);
    });
  });
});
