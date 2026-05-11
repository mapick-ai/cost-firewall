import { describe, it, expect } from "vitest";
import { sourceFromHookContext, sourceFromModelCall, sourceFromProviderContext } from "../../src/source.js";

describe("sourceFromHookContext", () => {
  it("优先使用 agentId + sessionId", () => {
    const source = sourceFromHookContext(
      { agentId: "agent-1", sessionId: "sess-1" },
      {}
    );
    expect(source).toBe("agent-1/sess-1");
  });

  it("其次使用 sessionKey", () => {
    const source = sourceFromHookContext(
      { sessionKey: "workspace/default" },
      {}
    );
    expect(source).toBe("workspace/default");
  });

  it("兜底使用 unknown", () => {
    const source = sourceFromHookContext({}, {});
    expect(source).toBe("unknown");
  });
});

describe("sourceFromModelCall", () => {
  it("使用 agentId + sessionId", () => {
    const source = sourceFromModelCall(
      { provider: "openai", model: "gpt-4o", sessionId: "sess-1" },
      { agentId: "agent-1" }
    );
    expect(source).toBe("agent-1/sess-1");
  });

  it("使用 sessionKey", () => {
    const source = sourceFromModelCall(
      { provider: "openai", model: "gpt-4o", sessionKey: "workspace/default" },
      {}
    );
    expect(source).toBe("workspace/default");
  });

  it("兜底使用 provider/model", () => {
    const source = sourceFromModelCall(
      { provider: "openai", model: "gpt-4o" },
      {}
    );
    expect(source).toBe("openai/gpt-4o");
  });
});

describe("sourceFromProviderContext", () => {
  it("使用 workspaceDir + upstream + model", () => {
    const source = sourceFromProviderContext(
      { workspaceDir: "/home/user/project" },
      { upstream: "openai", model: "gpt-4o" }
    );
    expect(source).toBe("project/openai/gpt-4o");
  });

  it("无 workspaceDir 时使用 upstream + model", () => {
    const source = sourceFromProviderContext(
      {},
      { upstream: "anthropic", model: "claude-sonnet-4-6" }
    );
    expect(source).toBe("anthropic/claude-sonnet-4-6");
  });
});
