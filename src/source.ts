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

export function sourceFromHookContext(
  event: Partial<HookContext>,
  ctx: Partial<HookContext>
): string {
  const agentId = event.agentId ?? ctx.agentId;
  const sessionId = event.sessionId ?? ctx.sessionId;

  if (agentId && sessionId) {
    return `${agentId}/${sessionId}`;
  }

  const sessionKey = event.sessionKey ?? ctx.sessionKey;
  if (sessionKey) {
    return sessionKey;
  }

  return sessionId ? `session:${sessionId}` : "unknown";
}

export function sourceFromModelCall(
  event: ModelCallEvent,
  ctx: Partial<HookContext>
): string {
  if (event.sessionId) {
    const agentId = ctx.agentId;
    return agentId ? `${agentId}/${event.sessionId}` : `session:${event.sessionId}`;
  }

  if (event.sessionKey) {
    return event.sessionKey;
  }

  return `${event.provider}/${event.model}`;
}

export function sourceFromProviderContext(
  ctx: ProviderContext,
  route: RouteInfo
): string {
  if (ctx.workspaceDir) {
    // Use last-level directory name instead of full path to avoid leaking user file paths
    const parts = ctx.workspaceDir.replace(/\\/g, "/").split("/").filter(Boolean);
    const basename = parts[parts.length - 1] || "ws";
    return `${basename}/${route.upstream}/${route.model}`;
  }
  return `${route.upstream}/${route.model}`;
}
