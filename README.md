# @mapick/cost-firewall

![Version](https://img.shields.io/github/v/tag/mapick-ai/cost-firewall?label=version&color=2563eb)
![License](https://img.shields.io/github/license/mapick-ai/cost-firewall?color=16a34a)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)
![OpenClaw Plugin](https://img.shields.io/badge/OpenClaw-Plugin-8B5CF6)

AI Call Firewall — real-time monitoring, budget control, automatic circuit breaker.

---

## Install

```bash
openclaw plugins install @mapick/cost-firewall
openclaw plugins enable mapick-firewall
openclaw gateway restart
openclaw firewall status
```

Dashboard: **http://localhost:18789/mapick/dashboard**

---

## Commands

| CLI | Action |
|---|---|
| `openclaw firewall status` | View status (mode, tokens, blocked, limit) |
| `openclaw firewall stop` | 🛑 Emergency stop — block all AI calls |
| `openclaw firewall resume` | ▶️ Resume after stop |
| `openclaw firewall mode observe` | Observe mode — record only, no blocking |
| `openclaw firewall mode protect` | Protect mode — enable all breaker rules |
| `openclaw firewall budget set 50000` | Set daily token limit to 50K |
| `openclaw firewall budget reset` | Remove daily token limit |
| `openclaw firewall log --last 20` | Show last 20 events |
| `openclaw firewall reset <source>` | Reset a source from cooldown |

In OpenClaw chat: `/firewall status`, `/firewall stop`, `/firewall resume`, `/firewall log`

---

## Config

```jsonc
{
  "plugins": {
    "entries": {
      "mapick-firewall": {
        "enabled": true,
        "config": {
          "dailyTokenLimit": null,
          "breaker": {
            "consecutiveFailures": 3,
            "cooldownSec": 30,
            "tokenVelocityThreshold": 100000,
            "tokenVelocityWindowSec": 60,
            "callFrequencyThreshold": 30,
            "callFrequencyWindowSec": 60
          }
        }
      }
    }
  }
}
```

---

## Breaking Rules

Firewall has two modes: **Observe** (record, don't block) and **Protect** (active blocking).

| Rule | Trigger | Effect |
|---|---|---|
| Emergency Stop | `openclaw firewall stop` | Block all calls |
| Daily Token Limit | Today's tokens ≥ limit | Block all calls |
| Consecutive Failures | N failures in a row | Block source for cooldown |
| Token Velocity | N tokens in W seconds | Block source for cooldown |
| Call Frequency | N calls in W seconds | Block source for cooldown |

### Defaults

| Rule | Threshold | Window | Cooldown |
|---|---|---|---|
| Consecutive Failures | 3 | — | 30s |
| Token Velocity | 100K tokens | 60s | 30s |
| Call Frequency | 30 calls | 60s | 30s |
| Daily Token Limit | None (unlimited) | — | — |

---

## AI Installation Checklist

Use this checklist when installing the firewall automatically:

```markdown
## Installation Steps

1. Install the npm package:
   ```bash
   openclaw plugins install @mapick/cost-firewall
   ```

2. Enable the plugin:
   ```bash
   openclaw plugins enable mapick-firewall
   ```

3. Verify it's registered:
   ```bash
   openclaw plugins list | grep mapick-firewall
   ```
   Expected: should show `mapick-firewall` in the list.

4. Restart gateway:
   ```bash
   openclaw gateway restart
   ```

5. Verify it's working:
   ```bash
   openclaw firewall status
   ```
   Expected: returns JSON with mode, today_tokens, today_blocked, etc.

6. Optionally, set a daily token budget:
   ```bash
   openclaw firewall budget set 500000
   ```

## Routing calls through the firewall

To route AI calls through the firewall, configure the model with `mapick/` prefix:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "mapick/deepseek/deepseek-chat",
        "fallbacks": ["mapick/anthropic/claude-sonnet-4-20250514"]
      }
    }
  }
}
```

Format: `mapick/<upstream>/<model-id>`
Supported upstreams: `openai`, `anthropic`, `deepseek`, `openrouter`, `qwen`

## Validation

After installation, the AI should verify:
- [ ] `openclaw plugins list` shows `mapick-firewall` (enabled)
- [ ] `openclaw firewall status` returns valid JSON
- [ ] Dashboard accessible at http://localhost:18789/mapick/dashboard
- [ ] Model config uses `mapick/` prefix if firewall protection is desired
- [ ] Fallbacks also use `mapick/` prefix (non-mapick fallbacks bypass the firewall)
```

---

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm dev          # tsc --watch
```

See [RELEASE.md](./RELEASE.md) for release process.

## License

MIT
