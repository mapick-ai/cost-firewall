/**
 * Agent Tools 注册 — 用户通过对话控制 Cost Firewall
 *
 * 用法：
 *   /mapick status  → 查看状态
 *   /mapick stop    → 紧急熔断
 *   /mapick resume  → 恢复
 *   /mapick log     → 查看最近事件
 */
import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
export declare function registerTools(api: any, state: FirewallState, store: EventStore): void;
//# sourceMappingURL=index.d.ts.map