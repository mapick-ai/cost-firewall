#!/usr/bin/env bash
set -e


# Mapick Cost Firewall installer
# Usage: curl -fsSL https://raw.githubusercontent.com/mapick-ai/cost-firewall/v0.2.11/install.sh | bash

echo "🛡️  Mapick Cost Firewall Installer"
echo "=================================="

PLUGIN_ID="mapick-firewall"
PLUGIN_PACKAGE="@mapick/cost-firewall"
INSTALL_COMMAND="curl -fsSL https://raw.githubusercontent.com/mapick-ai/cost-firewall/v0.2.11/install.sh | bash"

# Check OpenClaw version.
OC_VERSION=$(openclaw --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
MIN_VERSION="2026.5.7"

if [ -n "$OC_VERSION" ]; then
  OC_VER_NUM=$(echo "$OC_VERSION" | awk -F. '{ printf "%d%02d%02d", $1, $2, $3 }')
  MIN_VER_NUM=$(echo "$MIN_VERSION" | awk -F. '{ printf "%d%02d%02d", $1, $2, $3 }')
  if [ "$OC_VER_NUM" -lt "$MIN_VER_NUM" ]; then
    echo ""
    echo "⚠  OpenClaw $OC_VERSION is below the required minimum ($MIN_VERSION)."
    echo ""

    if [ -t 1 ] && exec 3<> /dev/tty 2>/dev/null; then
      cleanup_version_menu() {
        tput cnorm 2>/dev/null || true
        exec 3>&-
      }

      draw_version_menu() {
        local selected="$1"
        local upgrade_marker=" "
        local exit_marker=" "
        [ "$selected" -eq 1 ] && upgrade_marker=">"
        [ "$selected" -eq 2 ] && exit_marker=">"
        tput rc 2>/dev/null || true
        tput ed 2>/dev/null || true
        printf "──────────────────────────────────────────────────\n"
        printf "  %s\n" "OpenClaw upgrade required"
        printf "  %s\n" "Current version:  $OC_VERSION"
        printf "  %s\n" "Required version: $MIN_VERSION"
        printf "──────────────────────────────────────────────────\n"
        printf "  %s\n" "$upgrade_marker 1 Upgrade OpenClaw"
        printf "  %s\n" "$exit_marker 2 Exit"
        printf "──────────────────────────────────────────────────\n"
        printf "  %s\n" "Use ↑/↓, Press Enter to confirm."
      }

      trap cleanup_version_menu EXIT
      tput sc 2>/dev/null || true
      tput civis 2>/dev/null || true

      selected=1
      while true; do
        draw_version_menu "$selected"
        IFS= read -rsn1 key <&3
        case "$key" in
          $'\x1b')
            seq1=""
            seq2=""
            IFS= read -rsn1 -t 1 seq1 <&3 || seq1=""
            if [ "$seq1" = "[" ] || [ "$seq1" = "O" ]; then
              IFS= read -rsn1 -t 1 seq2 <&3 || seq2=""
            fi
            case "$seq1$seq2" in
              '[A'|'OA') [ "$selected" -gt 1 ] && selected=$((selected - 1)) ;;
              '[B'|'OB') [ "$selected" -lt 2 ] && selected=$((selected + 1)) ;;
            esac
            ;;
          [kK1])
            selected=1
            ;;
          [jJ2])
            selected=2
            ;;
          "")
            break
            ;;
        esac
      done

      cleanup_version_menu
      trap - EXIT
      echo ""
      if [ "$selected" -eq 1 ]; then
        echo "→ Running: openclaw update"
        openclaw update < /dev/tty
        echo ""
        echo "Upgrade complete."
        echo "Continue installation with:"
        echo "  $INSTALL_COMMAND"
        exit 0
      fi

      echo "Exiting without changes."
      exit 1
    fi

    echo "   1. Upgrade OpenClaw"
    echo "      Run: openclaw update"
    echo "      Then continue installation with:"
    echo "        $INSTALL_COMMAND"
    echo "   2. Exit"
    echo ""
    exit 1
  fi
fi

# 1. Install or update plugin
echo ""
echo "→ Installing or updating plugin..."

# Try update first (fast path for existing installations)
openclaw plugins update "$PLUGIN_ID" || true

# Verify plugin is actually installed on disk; if not, install from npm
PLUGIN_INSTALLED=0
for dir in \
  "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/extensions/$PLUGIN_ID" \
  "$HOME/.openclaw/extensions/$PLUGIN_ID" \
  "/Volumes/ACASIS/openclaw/state/extensions/$PLUGIN_ID" \
  "/Volumes/ACASIS/openclaw/state/npm/node_modules/@mapick/cost-firewall"; do
  if [ -d "$dir" ]; then PLUGIN_INSTALLED=1; break; fi
done

if [ "$PLUGIN_INSTALLED" -eq 0 ]; then
  echo "   Plugin not found on disk. Installing from npm..."
  openclaw plugins install "$PLUGIN_PACKAGE" --force
else
  echo "   Plugin found on disk."
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

# 4. Verify installed version matches expected
echo ""
echo "→ Verifying installed version..."
EXPECTED_VERSION=$(curl -fsSL https://registry.npmjs.org/@mapick%2Fcost-firewall/latest 2>/dev/null | python3 -c 'import json,sys;print(json.load(sys.stdin)["version"])' 2>/dev/null || echo "unknown")

INSTALLED_VERSION=""
for dir in \
  "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/extensions/mapick-firewall" \
  "$HOME/.openclaw/extensions/mapick-firewall" \
  "/Volumes/ACASIS/openclaw/state/extensions/mapick-firewall" \
  "/Volumes/ACASIS/openclaw/state/npm/node_modules/@mapick/cost-firewall" ; do

  if [ -f "$dir/package.json" ]; then
    INSTALLED_VERSION=$(node -e "try{console.log(require('$dir/package.json').version)}catch(e){}" 2>/dev/null)
    [ -n "$INSTALLED_VERSION" ] && break
  fi
done

if [ -z "$INSTALLED_VERSION" ]; then
  echo "  ⚠ Could not determine installed version"
elif [ "$INSTALLED_VERSION" != "$EXPECTED_VERSION" ] && [ "$EXPECTED_VERSION" != "unknown" ]; then
  echo "  ✗ Version mismatch: expected $EXPECTED_VERSION, installed $INSTALLED_VERSION"
  echo "  Possible cause: OpenClaw security scan blocked the new package."
  echo "  Run: openclaw plugins install @mapick/cost-firewall --force --dangerously-force-unsafe-install"
  exit 1
else
  echo "  ✓ Version $INSTALLED_VERSION matches expected $EXPECTED_VERSION"
fi

# 5. Restart gateway
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
sleep 10  # Give gateway time to fully load plugins after restart
PLUGIN_LOADED=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  perl -e 'alarm 10; exec @ARGV' -- openclaw plugins list 2>&1 | grep -q "$PLUGIN_ID" && { PLUGIN_LOADED=1; break; }
  sleep 3
done
if [ "$PLUGIN_LOADED" -eq 1 ]; then
  pass_check "Plugin loaded"
else
  echo "  ⚠ Plugin not in openclaw plugins list (gateway may still be loading)"
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
