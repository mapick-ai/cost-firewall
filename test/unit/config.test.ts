import { describe, it, expect } from "vitest";
import { resolveConfig, DEFAULT_CONFIG } from "../../src/config.js";

describe("resolveConfig", () => {
  it("返回默认配置当输入为空", () => {
    const config = resolveConfig({});
    expect(config.breaker?.consecutiveFailures).toBe(5);
    expect(config.breaker?.cooldownSec).toBe(30);
    expect(config.dailyBudgetUsd).toBeNull();
    expect(config.privacy?.storePromptText).toBe(false);
  });

  it("合并用户配置", () => {
    const config = resolveConfig({
      dailyBudgetUsd: 10,
      breaker: { consecutiveFailures: 3 },
    });
    expect(config.dailyBudgetUsd).toBe(10);
    expect(config.breaker?.consecutiveFailures).toBe(3);
    expect(config.breaker?.cooldownSec).toBe(30); // 默认值保留
  });

  it("privacy 默认不开启内容审计", () => {
    const config = resolveConfig({});
    expect(config.privacy?.enableRawConversationHooks).toBe(false);
  });
});
