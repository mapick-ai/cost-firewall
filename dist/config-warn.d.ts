/**
 * Config risk detection
 *
 * Check at startup whether fallback config may bypass Mapick
 */
export interface ConfigWarning {
    level: "warn" | "error";
    message: string;
}
export declare function detectConfigRisks(config: any): ConfigWarning[];
//# sourceMappingURL=config-warn.d.ts.map