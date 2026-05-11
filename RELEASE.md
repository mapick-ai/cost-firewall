# Release & Installation Guide

## Overview

`@mapick/cost-firewall` is an OpenClaw native plugin. It publishes to **npm** (for `openclaw plugins install`) and optionally to **GitHub Releases** (for manual install).

---

## Installation

### Via OpenClaw CLI (recommended)

```bash
openclaw plugins install @mapick/cost-firewall
openclaw plugins enable mapick-firewall
openclaw gateway restart
```

### Via GitHub Release (air-gapped / manual)

```bash
# 1. Download the release tarball from GitHub
curl -L https://github.com/mapick-ai/cost-firewall/releases/download/v0.1.0/mapick-cost-firewall.tgz -o mapick-cost-firewall.tgz

# 2. Install from local tarball
openclaw plugins install ./mapick-cost-firewall.tgz
openclaw plugins enable mapick-firewall
openclaw gateway restart
```

### Verify Installation

```bash
# Check plugin is loaded
openclaw plugins list | grep mapick-firewall

# View status
openclaw mapick status

# Open dashboard
open http://localhost:18789/mapick/dashboard
```

### Configuration

Edit `openclaw.json` or use the dashboard:

```json
{
  "plugins": {
    "entries": {
      "mapick-firewall": {
        "enabled": true,
        "config": {
          "dailyTokenLimit": 500000,
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

## Release Workflow

### Prerequisites

- `npm` account with access to the `@mapick` scope
- `gh` CLI installed and authenticated (for GitHub Releases)
- Clean working tree in `cost-firewall/`

### Step-by-Step

```bash
cd /Volumes/ACASIS/development/mapick/cost-firewall
```

#### 1. Update version

Edit `package.json`:

```bash
# Bump version (semver)
# package.json → "version": "0.2.0"
```

#### 2. Update changelog

Edit `CHANGELOG.md` (create if not exists):

```markdown
## 0.2.0 - 2026-05-11

### Added
- New rule: daily budget per source
- Dashboard: real-time SSE refresh

### Fixed
- Duplicate precheck logic consolidated
- OpenRouter pricing fallback

### Changed
- estimateCost now returns token count (not USD)
```

#### 3. Build

```bash
pnpm install
pnpm build          # tsc → dist/
pnpm test           # vitest run
pnpm test:coverage  # optional
```

Verify `dist/index.js` and `dist/index.d.ts` are generated.

#### 4. Git tag & push

```bash
git add -A
git commit -m "release: v0.2.0"
git tag v0.2.0
git push origin main --tags
```

#### 5. Publish to npm

```bash
# Dry-run first
npm publish --dry-run

# Actual publish
npm publish --access public
```

This makes the plugin available via `openclaw plugins install @mapick/cost-firewall`.

#### 6. GitHub Release (optional)

```bash
gh release create v0.2.0 \
  --repo mapick-ai/cost-firewall \
  --title "v0.2.0" \
  --notes "$(cat <<EOF
## What's Changed
- New rule: daily budget per source
- Dashboard: real-time SSE refresh
- Duplicate precheck logic consolidated
- OpenRouter pricing fallback

## Installation
\`\`\`bash
openclaw plugins install @mapick/cost-firewall
openclaw plugins enable mapick-firewall
openclaw gateway restart
\`\`\`
EOF
)" \
  --latest
```

---

## Automated Release (CI)

For automatic releases on tag push, add `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org

      - run: corepack enable && pnpm install
      - run: pnpm build
      - run: pnpm test

      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true
          make_latest: true
```

---

## Development Install (local testing)

```bash
# From cost-firewall directory
pnpm build

# Symlink into OpenClaw for local dev
openclaw plugins install ./
openclaw plugins enable mapick-firewall
openclaw gateway restart
```

On subsequent code changes:

```bash
pnpm build
openclaw gateway restart
```

Or use watch mode:

```bash
pnpm dev          # tsc --watch
# In another terminal:
openclaw gateway restart   # triggers reload
```

---

## Rollback

```bash
# Check installed version
openclaw plugins list | grep mapick-firewall

# Install a specific version
openclaw plugins install @mapick/cost-firewall@0.1.0
openclaw gateway restart

# Or remove entirely
openclaw plugins remove mapick-firewall
openclaw gateway restart
```
