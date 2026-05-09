/**
 * 配置风险检测
 *
 * 启动时检测 fallback 配置是否可能绕过 Mapick
 */
export interface ConfigWarning {
    level: "warn" | "error";
    message: string;
}
export declare function detectConfigRisks(config: any): ConfigWarning[];
//# sourceMappingURL=config-warn.d.ts.map