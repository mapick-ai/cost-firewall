#!/usr/bin/env bash
set -e

# Mapick Cost Firewall installer
# Usage: curl -fsSL https://raw.githubusercontent.com/mapick-ai/cost-firewall/main/install.sh | bash

echo "🛡️  Mapick Cost Firewall Installer"
echo "=================================="

PLUGIN_ID="mapick-firewall"
PLUGIN_PACKAGE="@mapick/cost-firewall"

# 1. Install or update plugin
echo ""
echo "→ Installing or updating plugin..."
if openclaw plugins update "$PLUGIN_ID"; then
  echo "   Existing installation updated."
else
  echo "   Update skipped or failed. Installing package..."
  openclaw plugins install "$PLUGIN_PACKAGE" --force --pin
fi

# 2. Enable it
echo ""
echo "→ Enabling plugin..."
openclaw plugins enable "$PLUGIN_ID"

# 3. Configure with sensible defaults
echo ""
echo "→ Configuring..."

# Find OpenClaw config path
CONFIG="${OPENCLAW_CONFIG_PATH:-}"
if [ -z "$CONFIG" ] || [ ! -f "$CONFIG" ]; then
  STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
  CONFIG="$STATE_DIR/openclaw.json"
fi
if [ ! -f "$CONFIG" ]; then
  CONFIG=$(find "$HOME" /Volumes /opt -maxdepth 4 -name "openclaw.json" -path "*/state/*" 2>/dev/null | head -1)
fi
if [ ! -f "$CONFIG" ]; then
  echo "⚠  Could not find OpenClaw config. Skipping auto-config."
  echo "   Add this to your OpenClaw config manually:"
  echo '   "plugins": {"entries": {"mapick-firewall": {"enabled": true, "hooks": {"allowConversationAccess": true}}}}'
else
  echo "   Config found: $CONFIG"
  CONFIG_PATH="$CONFIG" PLUGIN_ID="$PLUGIN_ID" python3 - <<'PY'
import json
import os

config_path = os.environ["CONFIG_PATH"]
plugin_id = os.environ["PLUGIN_ID"]
with open(config_path) as f:
    c = json.load(f)
c.setdefault('plugins', {}).setdefault('entries', {})[plugin_id] = {
    'enabled': True,
    'hooks': {'allowConversationAccess': True},
    'config': {
        'dailyTokenLimit': None,
        'breaker': {
            'consecutiveFailures': 3,
            'cooldownSec': 30,
            'tokenVelocityThreshold': 100000,
            'tokenVelocityWindowSec': 60,
            'callFrequencyThreshold': 30,
            'callFrequencyWindowSec': 60
        }
    }
}
with open(config_path, 'w') as f:
    json.dump(c, f, indent=2)
print('Configured.')
PY
fi

# 4. Restart gateway
echo ""
echo "→ Restarting gateway..."
openclaw gateway restart

# 5. Wait and verify
echo ""
echo "→ Waiting for gateway..."
sleep 5

VERIFY_FAILED=0
TMP_BASE="${TMPDIR:-/tmp}"
CLI_STATUS_FILE="$(mktemp "${TMP_BASE%/}/mapick-firewall-cli.XXXXXX")"
CLI_ERROR_FILE="$(mktemp "${TMP_BASE%/}/mapick-firewall-cli-err.XXXXXX")"
API_BODY_FILE="$(mktemp "${TMP_BASE%/}/mapick-firewall-api.XXXXXX")"
API_HEADERS_FILE="$(mktemp "${TMP_BASE%/}/mapick-firewall-api-headers.XXXXXX")"
cleanup() {
  rm -f "$CLI_STATUS_FILE" "$CLI_ERROR_FILE" "$API_BODY_FILE" "$API_HEADERS_FILE"
}
trap cleanup EXIT

pass_check() {
  echo "  ✓ $1"
}

fail_check() {
  echo "  ✗ $1"
  VERIFY_FAILED=1
}

echo ""
echo "→ Verifying gateway..."
if openclaw gateway status >/dev/null 2>&1; then
  pass_check "Gateway responding"
else
  fail_check "Gateway not responding"
fi

echo ""
echo "→ Verifying plugin loaded..."
if openclaw plugins list 2>&1 | grep -q "$PLUGIN_ID"; then
  pass_check "Plugin loaded"
else
  fail_check "Plugin not found in openclaw plugins list"
fi

echo ""
echo "→ Verifying firewall CLI..."
if openclaw firewall status >"$CLI_STATUS_FILE" 2>"$CLI_ERROR_FILE"; then
  if cli_error=$(CLI_STATUS_FILE="$CLI_STATUS_FILE" python3 - <<'PY' 2>&1
import json
import os

with open(os.environ["CLI_STATUS_FILE"]) as f:
    raw = f.read()
start = raw.find("{")
if start == -1:
    raise SystemExit(f"No JSON object found in CLI output: {raw[:200]!r}")
data = json.loads(raw[start:])
if "emergency_stop" not in data:
    raise SystemExit(f"Missing emergency_stop in {data}")
PY
  ); then
    pass_check "Firewall CLI working"
  else
    fail_check "Firewall CLI returned unexpected response: ${cli_error:-invalid JSON}"
  fi
else
  cli_error="$(tr '\n' ' ' <"$CLI_ERROR_FILE" | sed 's/[[:space:]]*$//')"
  fail_check "Firewall CLI failed${cli_error:+: $cli_error}"
fi

echo ""
echo "→ Verifying plugin API..."
if curl -fsS -m 5 -H "Accept: application/json" -D "$API_HEADERS_FILE" -o "$API_BODY_FILE" http://127.0.0.1:18789/mapick/api/stats 2>/dev/null; then
  if api_error=$(API_HEADERS_FILE="$API_HEADERS_FILE" API_BODY_FILE="$API_BODY_FILE" python3 - <<'PY' 2>&1
import json
import os

headers_path = os.environ["API_HEADERS_FILE"]
body_path = os.environ["API_BODY_FILE"]
with open(headers_path, encoding="utf-8", errors="replace") as f:
    headers = f.read().lower()
if "content-type:" not in headers or "application/json" not in headers:
    raise SystemExit("Missing application/json Content-Type")
with open(body_path) as f:
    data = json.load(f)
if "emergency_stop" not in data:
    raise SystemExit(f"Missing emergency_stop in {data}")
PY
  ); then
    pass_check "Plugin API verified"
  else
    fail_check "Plugin API returned unexpected response: ${api_error:-invalid JSON}"
  fi
else
  fail_check "Plugin API not reachable at /mapick/api/stats"
fi

echo ""
echo "=================================="
if [ "$VERIFY_FAILED" -ne 0 ]; then
  echo "❌ Installation finished, but verification failed."
  echo "   Fix the errors above and re-run this installer."
  exit 1
fi

echo "✅ Installation complete!"
echo ""
echo "Commands:"
echo "  openclaw firewall status          View status"
echo "  openclaw firewall stop             Emergency stop"
echo "  openclaw firewall resume           Resume"
echo "  openclaw firewall mode protect     Enable protection"
echo ""
echo "Dashboard: http://localhost:18789/mapick/dashboard"
