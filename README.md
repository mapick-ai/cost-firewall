# @mapick/cost-firewall

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

| In Chat | CLI | Action |
|---|---|---|
| `/firewall` | `openclaw firewall status` | Status |
| `/firewall stop` | `openclaw firewall stop` | 🛑 Emergency stop |
| `/firewall resume` | `openclaw firewall resume` | ▶️ Resume |
| — | `openclaw firewall mode observe\|protect` | Toggle mode |
| `/firewall budget` | `openclaw firewall budget set\|reset` | Daily token limit |
| `/firewall log` | `openclaw firewall log` | Recent events |
| — | `openclaw firewall reset <source>` | Clear cooldown |

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

## Defaults

| Rule | Threshold | Window | Cooldown |
|---|---|---|---|
| Consecutive Failures | 3 | — | 30s |
| Token Velocity | 100K tokens | 60s | 30s |
| Call Frequency | 30 calls | 60s | 30s |
| Daily Token Limit | unlimited | — | — |

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
