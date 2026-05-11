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

// Environment variable name mapping
const ENV_VAR_MAP: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  qwen: "DASHSCOPE_API_KEY",
};

export async function resolveUpstreamAuth(
  api: any,
  upstream: string,
  model: string
): Promise<AuthResult> {
  // Helper: extract key from response (could be string or { apiKey, ... })
  function extractKey(raw: any): string | undefined {
    if (!raw) return undefined;
    if (typeof raw === "string") return raw;
    return raw.apiKey ?? raw.key ?? raw.value ?? undefined;
  }

  // 1. Try SDK runtime auth
  if (api.runtime?.modelAuth?.getApiKeyForModel) {
    try {
      const key = extractKey(await api.runtime.modelAuth.getApiKeyForModel({
        model: { provider: upstream, id: model },
        cfg: api.config,
        workspaceDir: api.workspaceDir,
      }));
      if (key) return { apiKey: key };
    } catch { /* continue */ }
  }

  if (api.runtime?.modelAuth?.resolveApiKeyForProvider) {
    try {
      const key = extractKey(await api.runtime.modelAuth.resolveApiKeyForProvider(upstream));
      if (key) return { apiKey: key };
    } catch { /* continue */ }
  }

  // 2. Read directly from config
  const providerConfig = api.config?.models?.providers?.[upstream];
  if (providerConfig?.apiKey) {
    return { apiKey: providerConfig.apiKey };
  }

  // 3. Read from environment variables
  const envVar = ENV_VAR_MAP[upstream];
  if (envVar && process.env[envVar]) {
    return { apiKey: process.env[envVar]! };
  }

  throw new Error(
    `Mapick: unable to resolve API key for upstream "${upstream}". ` +
    `Configure it in OpenClaw (models.providers.${upstream}.apiKey) ` +
    `or set the ${ENV_VAR_MAP[upstream] ?? upstream.toUpperCase() + "_API_KEY"} environment variable.`
  );
}
