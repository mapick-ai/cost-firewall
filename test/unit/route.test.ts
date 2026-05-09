import { describe, it, expect } from "vitest";
import { parseMapickModelRef, isMapickModelRef } from "../../src/provider/route.js";

describe("parseMapickModelRef", () => {
  it("解析 mapick/openai/gpt-4o", () => {
    const route = parseMapickModelRef("mapick/openai/gpt-4o");
    expect(route).toEqual({ upstream: "openai", model: "gpt-4o" });
  });

  it("解析 mapick/anthropic/claude-sonnet-4-6", () => {
    const route = parseMapickModelRef("mapick/anthropic/claude-sonnet-4-6");
    expect(route).toEqual({ upstream: "anthropic", model: "claude-sonnet-4-6" });
  });

  it("解析 mapick/openrouter/anthropic/claude-sonnet-4.5", () => {
    const route = parseMapickModelRef("mapick/openrouter/anthropic/claude-sonnet-4.5");
    expect(route).toEqual({ upstream: "openrouter", model: "anthropic/claude-sonnet-4.5" });
  });

  it("无效格式返回 null", () => {
    expect(parseMapickModelRef("openai/gpt-4o")).toBeNull();
    expect(parseMapickModelRef("mapick")).toBeNull();
    expect(parseMapickModelRef("mapick/openai")).toBeNull();
  });
});

describe("isMapickModelRef", () => {
  it("识别 mapick/ 前缀", () => {
    expect(isMapickModelRef("mapick/openai/gpt-4o")).toBe(true);
    expect(isMapickModelRef("openai/gpt-4o")).toBe(false);
    expect(isMapickModelRef("anthropic/claude-sonnet-4-6")).toBe(false);
  });
});
