/**
 * Hook 注册入口
 */
import { createBeforeAgentReplyHandler } from "./before-agent-reply.js";
import { createModelCallStartedHandler, createModelCallEndedHandler } from "./model-call.js";
import { createAgentEndHandler } from "./agent-end.js";
export function registerHooks(api, state, store) {
    api.on("before_agent_reply", createBeforeAgentReplyHandler(state, store));
    api.on("model_call_started", createModelCallStartedHandler(state, store));
    api.on("model_call_ended", createModelCallEndedHandler(state, store));
    api.on("agent_end", createAgentEndHandler(state, store));
    if (state.config.privacy?.enableRawConversationHooks) {
        // llm_input/output — 仅 opt-in
        // 后续版本实现
    }
}
//# sourceMappingURL=index.js.map