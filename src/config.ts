/**
 * 配置解析与默认值
 */

import type { FirewallConfig } from "./types.js";

export const DEFAULT_CONFIG: Required<FirewallConfig> = {
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

export function resolveConfig(input: Partial<FirewallConfig>): FirewallConfig {
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
