/**
 * Upstream auth resolution
 *
 * 优先级：
 * 1. api.runtime.modelAuth (OpenClaw SDK)
 * 2. api.config.models.providers (直接读 config)
 * 3. 环境变量
 */
export interface AuthResult {
    apiKey: string;
    headers?: Record<string, string>;
}
export declare function resolveUpstreamAuth(api: any, upstream: string, model: string): Promise<AuthResult>;
//# sourceMappingURL=auth.d.ts.map