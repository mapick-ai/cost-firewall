#!/usr/bin/env bash
set -e

# Mapick Cost Firewall — One-click installer
# Usage: curl -fsSL https://raw.githubusercontent.com/mapick-ai/cost-firewall/main/install.sh | bash

echo "🛡️  Mapick Cost Firewall Installer"
echo "=================================="

# 1. Install or update plugin
echo ""
echo "→ Installing or updating plugin..."
PLUGIN_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/extensions/mapick-firewall"
if [ -d "$PLUGIN_DIR" ]; then
  echo "   Existing installation detected. Updating..."
  if ! openclaw plugins update mapick-firewall 2>/dev/null; then
    echo "   Update failed. Force reinstalling..."
    openclaw plugins install @mapick/cost-firewall --force
  fi
else
  openclaw plugins install @mapick/cost-firewall
fi

# 2. Enable it
echo ""
echo "→ Enabling plugin..."
openclaw plugins enable mapick-firewall

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
  python3 -c "
import json
config_path = '$CONFIG'
with open(config_path) as f:
    c = json.load(f)
c.setdefault('plugins', {}).setdefault('entries', {})['mapick-firewall'] = {
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
"
fi

# 4. Restart gateway
echo ""
echo "→ Restarting gateway..."
openclaw gateway restart

# 5. Wait and verify
echo ""
echo "→ Waiting for gateway..."
sleep 5

echo ""
echo "→ Verifying gateway..."
openclaw gateway status >/dev/null || echo "  ⚠ Gateway not responding"

echo ""
echo "→ Verifying plugin loaded..."
openclaw plugins list 2>&1 | grep -q mapick-firewall && echo "  ✓ Plugin loaded" || echo "  ⚠ Plugin not found"

echo ""
echo "→ Verifying firewall CLI..."
if openclaw firewall status >/dev/null 2>&1; then
  echo "  ✓ Firewall CLI working"
else
  echo "  ⚠ Firewall CLI may need gateway restart or API is not mounted"
fi

echo ""
echo "→ Verifying plugin API..."
if curl -fsS -m 5 -H "Accept: application/json" http://127.0.0.1:18789/mapick/api/stats >/tmp/mapick-firewall-stats.json 2>/dev/null; then
  python3 -c "
import json
with open('/tmp/mapick-firewall-stats.json') as f:
    data = json.load(f)
assert 'emergency_stop' in data, f'Missing emergency_stop in {data}'
print('  ✓ Plugin API verified')
" 2>/dev/null || echo "  ⚠ Plugin API returned unexpected response (may need gateway restart)"
else
  echo "  ⚠ Plugin API not reachable (OpenClaw may block plugin routes — try gateway restart)"
fi

echo ""
echo "=================================="
echo "✅ Installation complete!"
echo ""
echo "Commands:"
echo "  openclaw firewall status          View status"
echo "  openclaw firewall stop             Emergency stop"
echo "  openclaw firewall resume           Resume"
echo "  openclaw firewall mode protect     Enable protection"
echo ""
echo "Dashboard: http://localhost:18789/mapick/dashboard"
