/**
 * Config risk detection
 *
 * Check at startup whether fallback config may bypass Mapick
 */

export interface ConfigWarning {
  level: "warn" | "error";
  message: string;
}

export function detectConfigRisks(config: any): ConfigWarning[] {
  const warnings: ConfigWarning[] = [];

  const modelConfig = config?.agents?.defaults?.model;
  if (!modelConfig) return warnings;

  const primary = modelConfig.primary ?? "";
  const fallbacks: string[] = modelConfig.fallbacks ?? [];

  if (primary.startsWith("mapick/")) {
    const nonMapickFallbacks = fallbacks.filter((f) => !f.startsWith("mapick/"));
    if (nonMapickFallbacks.length > 0) {
      warnings.push({
        level: "warn",
        message:
          `Configuration risk: primary model uses Mapick (${primary}), ` +
          `but fallbacks include non-Mapick models (${nonMapickFallbacks.join(", ")}). ` +
          `These fallbacks will bypass Mapick protection.`,
      });
    }
  }

  return warnings;
}
