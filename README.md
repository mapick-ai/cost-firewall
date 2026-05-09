# @mapick/cost-firewall

Mapick Cost Firewall — OpenClaw 原生插件版

## 功能

- **零配置观测**：安装后自动统计每次 LLM 调用的费用、延迟、成功率
- **跨次拦截**：Emergency Stop、Daily Budget、自动熔断
- **请求级硬拦截**：通过 `mapick/*` 前缀实现 request-level precheck
- **Dashboard**：实时查看调用统计和拦截事件
- **隐私优先**：默认不读取 prompt/response 明文

## 安装

```bash
openclaw plugins install @mapick/cost-firewall
openclaw plugins enable mapick-firewall
openclaw gateway restart
```

## 使用

```bash
# 查看状态
openclaw mapick status

# 切换模式
openclaw mapick mode observe   # 观测模式（默认）
openclaw mapick mode protect   # 保护模式

# Emergency Stop
openclaw mapick stop
openclaw mapick resume

# 预算
openclaw mapick budget set 20  # 每日 $20
openclaw mapick budget reset

# Dashboard
open http://localhost:18789/mapick/dashboard
```

## 配置

```json
{
  "plugins": {
    "entries": {
      "mapick-firewall": {
        "dailyBudgetUsd": 10,
        "breaker": {
          "consecutiveFailures": 5,
          "cooldownSec": 30
        }
      }
    }
  }
}
```

## 架构

双层防御：

1. **Hook Layer**：零配置观测 + 跨次拦截（`before_agent_reply`、`model_call_*`、`agent_end`）
2. **Provider Layer**：请求级硬拦截（`mapick/* + createStreamFn`）

## 开发

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 测试
pnpm test

# 开发模式
pnpm dev
```

## License

MIT
