/**
 * Upstream auth resolution
 *
 * Priority:
 * 1. api.runtime.modelAuth (OpenClaw SDK)
 * 2. api.config.models.providers (direct config read)
 * 3. Environment variables
 */
export interface AuthResult {
    apiKey: string;
    headers?: Record<string, string>;
}
export declare function resolveUpstreamAuth(api: any, upstream: string, model: string): Promise<AuthResult>;
//# sourceMappingURL=auth.d.ts.map