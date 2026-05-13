/**
 * Hook registration entry point
 */

import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
import { createBeforeAgentReplyHandler, createTestBlockDetector } from "./before-agent-reply.js";
import { createBeforeModelResolveHandler } from "./before-model-resolve.js";
import { createModelCallStartedHandler, createModelCallEndedHandler } from "./model-call.js";
import { createAgentEndHandler } from "./agent-end.js";

export function registerHooks(
  api: any,
  state: FirewallState,
  store: EventStore
): void {
  api.on("before_agent_reply", createBeforeAgentReplyHandler(state, store));
  api.on("before_model_resolve", createBeforeModelResolveHandler(state, store));
  api.on("model_call_started", createModelCallStartedHandler(state, store));
  api.on("model_call_ended", createModelCallEndedHandler(state, store));

  if (state.config.privacy?.enableRawConversationHooks) {
    api.on("agent_end", createAgentEndHandler(state, store));
    api.on("llm_input", createTestBlockDetector(store));
  }
}
