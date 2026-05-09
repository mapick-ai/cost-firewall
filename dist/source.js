/**
 * Source key 解析
 *
 * 优先级：
 * 1. agentId + sessionId
 * 2. sessionKey
 * 3. workspaceDir + provider + model
 * 4. provider + model
 */
export function sourceFromHookContext(event, ctx) {
    const agentId = event.agentId ?? ctx.agentId;
    const sessionId = event.sessionId ?? ctx.sessionId;
    if (agentId && sessionId) {
        return `${agentId}/${sessionId}`;
    }
    const sessionKey = event.sessionKey ?? ctx.sessionKey;
    if (sessionKey) {
        return sessionKey;
    }
    return "unknown";
}
export function sourceFromModelCall(event, ctx) {
    if (event.sessionId) {
        const agentId = ctx.agentId ?? "unknown";
        return `${agentId}/${event.sessionId}`;
    }
    if (event.sessionKey) {
        return event.sessionKey;
    }
    return `${event.provider}/${event.model}`;
}
export function sourceFromProviderContext(ctx, route) {
    if (ctx.workspaceDir) {
        return `${ctx.workspaceDir}/${route.upstream}/${route.model}`;
    }
    return `${route.upstream}/${route.model}`;
}
//# sourceMappingURL=source.js.map