import { describe, it, expect, beforeEach } from "vitest";
import { FirewallState } from "../../src/state.js";
import { EventStore } from "../../src/store.js";
import { createBeforeAgentReplyHandler } from "../../src/hooks/before-agent-reply.js";
import { createModelCallEndedHandler } from "../../src/hooks/model-call.js";
import { parseMapickModelRef } from "../../src/provider/route.js";
import { createBlockedStream } from "../../src/provider/synthetic.js";

describe("E2E 完整流程", () => {
  let state: FirewallState;
  let store: EventStore;

  beforeEach(() => {
    state = new FirewallState();
    store = new EventStore();
  });

  it("observe → protect → stop → resume 完整流程", async () => {
    // 1. observe 模式放行
    const replyHandler = createBeforeAgentReplyHandler(state, store);
    let result = await replyHandler({ agentId: "test" }, {});
    expect(result).toBeUndefined();

    // 2. 记录 model call
    const callHandler = createModelCallEndedHandler(state, store);
    callHandler({
      runId: "run-1",
      callId: "call-1",
      provider: "openai",
      model: "gpt-4o",
      durationMs: 1000,
      outcome: "completed",
      responseStreamBytes: 1024,
    }, {});
    expect(state.getTodayTokens()).toBeGreaterThan(0);

    // 3. 切换到 protect 模式
    state.setMode("protect");
    expect(state.globalStats.mode).toBe("protect");

    // 4. Emergency Stop
    state.setEmergencyStop(true);
    result = await replyHandler({ agentId: "test" }, {});
    expect(result).toBeDefined();
    expect(result?.reason).toBe("emergency_stop");

    // 5. Resume
    state.setEmergencyStop(false);
    result = await replyHandler({ agentId: "test" }, {});
    expect(result).toBeUndefined();
  });

  it("Provider Layer 拦截流程", async () => {
    state.setEmergencyStop(true);

    const route = parseMapickModelRef("mapick/openai/gpt-4o");
    expect(route).not.toBeNull();

    const stream = createBlockedStream({
      provider: route!.upstream,
      model: route!.model,
      reason: "emergency_stop",
    });

    const chunks: any[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
  });

  it("熔断流程", async () => {
    state.setMode("protect");

    for (let i = 0; i < 5; i++) {
      state.breaker.recordFailure("test-agent");
    }

    const replyHandler = createBeforeAgentReplyHandler(state, store);
    const result = await replyHandler({ agentId: "test-agent" }, {});
    expect(result).toBeDefined();
    expect(result?.reason).toBe("source_cooldown");
  });
});
