import { describe, it, expect } from "vitest";
import { estimateTokens, getProviderModelKey } from "../../src/pricing.js";

describe("estimateTokens", () => {
  it("估算 OpenAI GPT-4o 费用", () => {
    const cost = estimateTokens(
      { prompt_tokens: 1000, completion_tokens: 500 },
      "openai",
      "gpt-4o"
    );
    // input: $2.5/1M, output: $10/1M
    expect(cost).toBeCloseTo(1000 + 500, 6);
  });

  it("估算 Anthropic Claude 费用", () => {
    const cost = estimateTokens(
      { prompt_tokens: 2000, completion_tokens: 1000 },
      "anthropic",
      "claude-sonnet-4-6"
    );
    // input: $3/1M, output: $15/1M
    expect(cost).toBeCloseTo(2000 + 1000, 6);
  });

  it("未知模型返回基于 bytes 的估算", () => {
    const cost = estimateTokens(
      { prompt_tokens: 0, completion_tokens: 0 },
      "unknown",
      "unknown-model",
      1024
    );
    expect(cost).toBeGreaterThan(0);
  });

  it("无 usage 信息时返回 0", () => {
    const cost = estimateTokens(null, "openai", "gpt-4o");
    expect(cost).toBe(0);
  });
});

describe("getProviderModelKey", () => {
  it("生成 provider/model key", () => {
    expect(getProviderModelKey("openai", "gpt-4o")).toBe("openai/gpt-4o");
  });
});
