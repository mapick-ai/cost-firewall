/**
 * Upstream auth resolution
 *
 * 从 OpenClaw plugin runtime 读取 upstream API key
 * 不另存、不复制
 */

export interface AuthResult {
  apiKey: string;
  headers?: Record<string, string>;
}

export async function resolveUpstreamAuth(
  api: any,
  upstream: string,
  model: string
): Promise<AuthResult> {
  if (api.runtime?.modelAuth?.getApiKeyForModel) {
    try {
      const key = await api.runtime.modelAuth.getApiKeyForModel({
        model: { provider: upstream, id: model },
        cfg: api.config,
        workspaceDir: api.workspaceDir,
      });

      if (key) {
        return { apiKey: key };
      }
    } catch (err) {
      // 继续尝试其他方式
    }
  }

  if (api.runtime?.modelAuth?.resolveApiKeyForProvider) {
    try {
      const key = await api.runtime.modelAuth.resolveApiKeyForProvider(upstream);
      if (key) {
        return { apiKey: key };
      }
    } catch (err) {
      // 继续
    }
  }

  throw new Error(
    `Mapick: unable to resolve API key for upstream "${upstream}". ` +
    `Please ensure the key is configured in OpenClaw.`
  );
}
