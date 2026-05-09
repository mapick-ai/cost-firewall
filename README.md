# @mapick/cost-firewall

Mapick Cost Firewall — Native OpenClaw Plugin

## Features

- **Zero-config observability**: Automatically track cost, latency, and success rate for every LLM call after installation
- **Cross-request blocking**: Emergency Stop, Daily Budget, automatic circuit breaker
- **Request-level hard blocking**: Pre-check before each LLM request via `mapick/*` prefix
- **Dashboard**: Real-time view of call statistics and blocked events
- **Privacy-first**: No prompt/response plaintext read by default

## Installation

```bash
openclaw plugins install @mapick/cost-firewall
openclaw plugins enable mapick-firewall
openclaw gateway restart
```

## Usage

```bash
# View status
openclaw mapick status

# Switch mode
openclaw mapick mode observe   # Observe mode (default)
openclaw mapick mode protect   # Protect mode

# Emergency Stop
openclaw mapick stop
openclaw mapick resume

# Budget
openclaw mapick budget set 20  # $20 per day
openclaw mapick budget reset

# Dashboard
open http://localhost:18789/mapick/dashboard
```

## Configuration

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

## Architecture

Dual-layer defense:

1. **Hook Layer**: Zero-config observability + cross-request blocking (`before_agent_reply`, `model_call_*`, `agent_end`)
2. **Provider Layer**: Request-level hard blocking (`mapick/* + createStreamFn`)

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Test
pnpm test

# Dev mode
pnpm dev
```

## License

MIT
