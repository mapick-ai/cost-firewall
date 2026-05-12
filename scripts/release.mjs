#!/usr/bin/env node

/**
 * Release script for @mapick/cost-firewall
 *
 * Usage:
 *   npm run release          # dry-run (patch)
 *   npm run release -- patch # bump patch: 0.2.2 → 0.2.3
 *   npm run release -- minor # bump minor: 0.2.2 → 0.3.0
 *   npm run release -- major # bump major: 0.2.2 → 1.0.0
 *   npm run release -- 0.2.5 # explicit version
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PKG_PATH = resolve(ROOT, "package.json");
const PLUGIN_MANIFEST_PATH = resolve(ROOT, "openclaw.plugin.json");
const INDEX_PATH = resolve(ROOT, "src/index.ts");

// ── Parse bump type ──────────────────────────────────────
const bumpArg = process.argv[2] || "dry-run";
const VALID = new Set(["patch", "minor", "major", "dry-run"]);

const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));
const pluginManifest = JSON.parse(readFileSync(PLUGIN_MANIFEST_PATH, "utf-8"));
const currentVersion = pkg.version;

let nextVersion;
if (VALID.has(bumpArg)) {
  const parts = currentVersion.split(".").map(Number);
  if (bumpArg === "patch") nextVersion = `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  else if (bumpArg === "minor") nextVersion = `${parts[0]}.${parts[1] + 1}.0`;
  else if (bumpArg === "major") nextVersion = `${parts[0] + 1}.0.0`;
  else nextVersion = currentVersion; // dry-run
} else {
  // Explicit version (e.g. "0.2.5")
  if (/^\d+\.\d+\.\d+$/.test(bumpArg)) {
    nextVersion = bumpArg;
  } else {
    console.error(`❌ Invalid bump type: "${bumpArg}"`);
    console.error(`   Valid: patch | minor | major | <semver>`);
    process.exit(1);
  }
}

const tag = `v${nextVersion}`;

// ── Dry-run ──────────────────────────────────────────────
const isDryRun = bumpArg === "dry-run";
console.log(`\n  📦 @mapick/cost-firewall  ${currentVersion} → ${nextVersion}${isDryRun ? " (dry-run)" : ""}\n`);

function run(cmd, opts = {}) {
  if (isDryRun) {
    console.log(`   ▶ ${cmd}`);
    return "";
  }
  return execSync(cmd, { cwd: ROOT, stdio: "inherit", ...opts });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf-8" }).trim();
}

const steps = [];

// 1. Verify clean working tree
steps.push(() => {
  const status = runCapture("git status --porcelain");
  if (status) {
    console.error("❌ Working tree is not clean. Commit or stash changes first.\n");
    process.exit(1);
  }
});

// 2. Run tests
steps.push(() => {
  console.log("  🧪 Running tests...");
  run("npm test");
});

// 3. Bump version metadata
steps.push(() => {
  console.log("  📝 Bumping version metadata...");
  pkg.version = nextVersion;
  writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n");

  pluginManifest.version = nextVersion;
  writeFileSync(PLUGIN_MANIFEST_PATH, JSON.stringify(pluginManifest, null, 2) + "\n");

  const indexSource = readFileSync(INDEX_PATH, "utf-8");
  const nextIndexSource = indexSource.replace(/version:\s*"[^"]+"/, `version: "${nextVersion}"`);
  if (nextIndexSource === indexSource) {
    console.error("❌ Could not find plugin version field in src/index.ts");
    process.exit(1);
  }
  writeFileSync(INDEX_PATH, nextIndexSource);
});

// 4. README version badge is dynamic (shields.io + GitHub tag API)
//    No update needed — just ensure tag gets pushed in step 8.
steps.push(() => {
  console.log(`  📖 README badge auto-resolves to ${tag} via shields.io`);
});

// 5. Git commit + tag
steps.push(() => {
  console.log(`  🏷️  Committing and tagging ${tag}...`);
  run(`git add package.json openclaw.plugin.json src/index.ts`);
  run(`git commit -m "release: ${tag}"`);
  run(`git tag -f ${tag}`);
});

// 6. Build
steps.push(() => {
  console.log("  🔨 Building...");
  run("npm run build");
});

// 7. Publish to npm
steps.push(() => {
  console.log("  📤 Publishing to npm...");
  run("npm publish");
});

// 8. Push to GitHub (commit + tag)
steps.push(() => {
  console.log("  ⬆️  Pushing to GitHub...");
  run("git push");
  run("git push --tags");
});

// ── Execute ──────────────────────────────────────────────
for (const step of steps) {
  try {
    step();
  } catch (err) {
    console.error(`\n❌ Release failed at: ${step.name || "unknown step"}`);
    if (!isDryRun) {
      console.error("   Revert with: git tag -d " + tag + " && git reset --hard HEAD~1");
    }
    process.exit(1);
  }
}

console.log(`\n✅ Released ${tag}\n`);
