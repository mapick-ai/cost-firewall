/**
 * 配置解析与默认值
 */
export const DEFAULT_CONFIG = {
    breaker: {
        consecutiveFailures: 3,
        cooldownSec: 30,
        tokenVelocityWindowSec: 60,
        tokenVelocityThreshold: 100000,
        callFrequencyWindowSec: 60,
        callFrequencyThreshold: 30,
    },
    dailyTokenLimit: null,
    privacy: {
        storePromptText: false,
        enableRawConversationHooks: false,
    },
};
export function resolveConfig(input) {
    return {
        breaker: {
            ...DEFAULT_CONFIG.breaker,
            ...input.breaker,
        },
        dailyTokenLimit: input.dailyTokenLimit ?? DEFAULT_CONFIG.dailyTokenLimit,
        privacy: {
            ...DEFAULT_CONFIG.privacy,
            ...input.privacy,
        },
    };
}
//# sourceMappingURL=config.js.map