#!/usr/bin/env bash
set -e

# Mapick Cost Firewall — One-click installer
# Usage: curl -fsSL https://raw.githubusercontent.com/mapick-ai/cost-firewall/main/install.sh | bash

echo "🛡️  Mapick Cost Firewall Installer"
echo "=================================="

# 1. Install the plugin
echo ""
echo "→ Installing plugin..."
openclaw plugins install @mapick/cost-firewall

# 2. Enable it
echo ""
echo "→ Enabling plugin..."
openclaw plugins enable mapick-firewall

# 3. Configure with sensible defaults
echo ""
echo "→ Configuring..."
CONFIG="$HOME/.openclaw/openclaw.json"
if [ -f "$CONFIG" ]; then
  python3 -c "
import json, os
config_path = os.environ.get('OPENCLAW_CONFIG_PATH', os.path.expanduser('~/.openclaw/openclaw.json'))
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
echo "→ Verifying..."
openclaw firewall status

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
