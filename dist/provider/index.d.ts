/**
 * Provider 注册入口
 *
 * mapick/<upstream>/<model> 路由
 * - catalog: 声明模型目录
 * - resolveDynamicModel: 动态接受任意 upstream model ID
 * - createStreamFn: precheck + upstream 转发
 */
import type { FirewallState } from "../state.js";
import type { EventStore } from "../store.js";
export declare function registerProvider(api: any, state: FirewallState, store: EventStore): void;
//# sourceMappingURL=index.d.ts.map