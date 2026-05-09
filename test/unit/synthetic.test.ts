import { describe, it, expect } from "vitest";
import { createBlockedStream } from "../../src/provider/synthetic.js";

describe("createBlockedStream", () => {
  it("生成可迭代的 blocked stream", async () => {
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
    const content = chunks.map((c) => c.choices?.[0]?.delta?.content ?? "").join("");
    expect(content).toContain("emergency_stop");
  });

  it("生成 Anthropic 格式的 blocked stream", async () => {
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
  });
});
