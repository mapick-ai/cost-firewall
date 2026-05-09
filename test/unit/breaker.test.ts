import { describe, it, expect, beforeEach } from "vitest";
import { Breaker } from "../../src/breaker.js";
import type { FirewallConfig } from "../../src/types.js";

const defaultConfig: FirewallConfig = {
  breaker: {
    consecutiveFailures: 3,
    cooldownSec: 5,
    tokenVelocityWindowSec: 60,
    tokenVelocityThreshold: 1000,
    callFrequencyWindowSec: 60,
    callFrequencyThreshold: 10,
  },
};

describe("Breaker", () => {
  let breaker: Breaker;

  beforeEach(() => {
    breaker = new Breaker(defaultConfig);
  });

  it("初始状态不熔断", () => {
    expect(breaker.isCoolingDown("source-1")).toBe(false);
  });

  it("连续失败达到阈值后熔断", () => {
    breaker.recordFailure("source-1");
    breaker.recordFailure("source-1");
    expect(breaker.isCoolingDown("source-1")).toBe(false);

    breaker.recordFailure("source-1");
    expect(breaker.isCoolingDown("source-1")).toBe(true);
  });

  it("成功调用重置连续失败计数", () => {
    breaker.recordFailure("source-1");
    breaker.recordFailure("source-1");
    breaker.recordSuccess("source-1");
    breaker.recordFailure("source-1");
    expect(breaker.isCoolingDown("source-1")).toBe(false);
  });

  it("不同 source 独立计数", () => {
    breaker.recordFailure("source-1");
    breaker.recordFailure("source-1");
    breaker.recordFailure("source-1");
    expect(breaker.isCoolingDown("source-1")).toBe(true);
    expect(breaker.isCoolingDown("source-2")).toBe(false);
  });

  it("cooldown 过期后自动恢复", async () => {
    // 使用短 cooldown 配置
    const shortBreaker = new Breaker({
      breaker: { consecutiveFailures: 2, cooldownSec: 1 },
    });
    shortBreaker.recordFailure("source-1");
    shortBreaker.recordFailure("source-1");
    expect(shortBreaker.isCoolingDown("source-1")).toBe(true);

    await new Promise((r) => setTimeout(r, 1100));
    expect(shortBreaker.isCoolingDown("source-1")).toBe(false);
  }, 5000);

  it("getBlockedReason 返回熔断原因", () => {
    breaker.recordFailure("source-1");
    breaker.recordFailure("source-1");
    breaker.recordFailure("source-1");
    expect(breaker.getBlockedReason("source-1")).toBe("consecutive_failures");
  });

  it("手动 reset 清除熔断状态", () => {
    breaker.recordFailure("source-1");
    breaker.recordFailure("source-1");
    breaker.recordFailure("source-1");
    breaker.reset("source-1");
    expect(breaker.isCoolingDown("source-1")).toBe(false);
  });
});

describe("Token Velocity", () => {
  let breaker: Breaker;

  beforeEach(() => {
    breaker = new Breaker(defaultConfig);
  });

  it("窗口内 token 超阈值触发熔断", () => {
    const reason = breaker.recordTokens("src", 600);
    expect(reason).toBeUndefined();
    const reason2 = breaker.recordTokens("src", 500);
    expect(reason2).toBe("token_velocity");
    expect(breaker.isCoolingDown("src")).toBe(true);
    expect(breaker.getBlockedReason("src")).toBe("token_velocity");
  });

  it("低于阈值不触发", () => {
    const reason = breaker.recordTokens("src", 400);
    expect(reason).toBeUndefined();
    expect(breaker.isCoolingDown("src")).toBe(false);
  });
});

describe("Call Frequency", () => {
  let breaker: Breaker;

  beforeEach(() => {
    breaker = new Breaker(defaultConfig);
  });

  it("窗口内调用次数超阈值触发熔断", () => {
    for (let i = 0; i < 9; i++) breaker.recordCall("src");
    expect(breaker.isCoolingDown("src")).toBe(false);
    breaker.recordCall("src");
    expect(breaker.isCoolingDown("src")).toBe(true);
    expect(breaker.getBlockedReason("src")).toBe("call_frequency");
  });

  it("低于阈值不触发", () => {
    for (let i = 0; i < 5; i++) breaker.recordCall("src");
    expect(breaker.isCoolingDown("src")).toBe(false);
  });
});
