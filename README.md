# @mapick/cost-firewall

![Version](https://img.shields.io/badge/version-0.2.2-2563eb)
![License](https://img.shields.io/github/license/mapick-ai/cost-firewall?color=16a34a)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)
![OpenClaw Plugin](https://img.shields.io/badge/OpenClaw-Plugin-8B5CF6)

AI Call Firewall — real-time monitoring, budget control, automatic circuit breaker.

---

## Install

**One-click:**
```bash
curl -fsSL https://raw.githubusercontent.com/mapick-ai/cost-firewall/main/install.sh | bash
```

**Manual:**
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

Copy the entire block below and execute:

```bash
# 1. Install the plugin
openclaw plugins install @mapick/cost-firewall

# 2. Enable it
openclaw plugins enable mapick-firewall

# 3. Verify registration
openclaw plugins list | grep mapick-firewall

# 4. Restart gateway
openclaw gateway restart

# 5. Verify it works
openclaw firewall status

# 6. Optional: set a daily token budget
openclaw firewall budget set 500000
```

After installation, verify:
- [ ] `openclaw plugins list` shows `mapick-firewall` (enabled)
- [ ] `openclaw firewall status` returns valid JSON
- [ ] Dashboard accessible at http://localhost:18789/mapick/dashboard
- [ ] Model config uses `mapick/` prefix if firewall protection is desired
- [ ] Fallbacks also use `mapick/` prefix (non-mapick fallbacks bypass the firewall)

---

## Known Limitations

- **Provider Layer**: `mapick/*` model routing is registered and unit-tested, but end-to-end gateway contract validation (createStreamFn invocation, synthetic stream delivery, fallback routing) is pending.
- **Message format**: Plain text calls work; tool calls, system prompts, and reasoning payloads may need format conversion for upstream APIs.

---

## Dev

```bash
pnpm install
pnpm build
pnpm test
```

## License

MIT
