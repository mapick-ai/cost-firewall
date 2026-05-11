/**
 * Source key resolution
 *
 * Priority:
 * 1. agentId + sessionId
 * 2. sessionKey
 * 3. workspaceDir + provider + model
 * 4. provider + model
 */
export interface HookContext {
    agentId?: string;
    sessionId?: string;
    sessionKey?: string;
}
export interface ModelCallEvent {
    runId?: string;
    callId?: string;
    sessionKey?: string;
    sessionId?: string;
    provider: string;
    model: string;
}
export interface ProviderContext {
    workspaceDir?: string;
    provider?: string;
    modelId?: string;
}
export interface RouteInfo {
    upstream: string;
    model: string;
}
export declare function sourceFromHookContext(event: Partial<HookContext>, ctx: Partial<HookContext>): string;
export declare function sourceFromModelCall(event: ModelCallEvent, ctx: Partial<HookContext>): string;
export declare function sourceFromProviderContext(ctx: ProviderContext, route: RouteInfo): string;
//# sourceMappingURL=source.d.ts.map