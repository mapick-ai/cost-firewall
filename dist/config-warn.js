/**
 * Config risk detection
 *
 * Check at startup whether fallback config may bypass Mapick
 */
export function detectConfigRisks(config) {
    const warnings = [];
    const modelConfig = config?.agents?.defaults?.model;
    if (!modelConfig)
        return warnings;
    const primary = modelConfig.primary ?? "";
    const fallbacks = modelConfig.fallbacks ?? [];
    if (primary.startsWith("mapick/")) {
        const nonMapickFallbacks = fallbacks.filter((f) => !f.startsWith("mapick/"));
        if (nonMapickFallbacks.length > 0) {
            warnings.push({
                level: "warn",
                message: `Configuration risk: primary model uses Mapick (${primary}), ` +
                    `but fallbacks include non-Mapick models (${nonMapickFallbacks.join(", ")}). ` +
                    `These fallbacks will bypass Mapick protection.`,
            });
        }
    }
    return warnings;
}
//# sourceMappingURL=config-warn.js.map