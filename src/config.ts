/**
 * 配置解析与默认值
 */

import type { FirewallConfig } from "./types.js";

export const DEFAULT_CONFIG: Required<FirewallConfig> = {
  breaker: {
    costVelocityWindowSec: 60,
    costVelocityThresholdUsd: 0.5,
    cumulativeCostThresholdUsd: 1.0,
    callFrequencyWindowSec: 60,
    callFrequencyThreshold: 20,
    promptRepeatThreshold: 3,
    consecutiveFailures: 5,
    cooldownSec: 30,
  },
  dailyBudgetUsd: null,
  privacy: {
    storePromptText: false,
    enableRawConversationHooks: false,
  },
};

export function resolveConfig(input: Partial<FirewallConfig>): FirewallConfig {
  return {
    breaker: {
      ...DEFAULT_CONFIG.breaker,
      ...input.breaker,
    },
    dailyBudgetUsd: input.dailyBudgetUsd ?? DEFAULT_CONFIG.dailyBudgetUsd,
    privacy: {
      ...DEFAULT_CONFIG.privacy,
      ...input.privacy,
    },
  };
}
