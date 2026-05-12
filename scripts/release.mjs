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
const README_PATH = resolve(ROOT, "README.md");

// ── Parse bump type ──────────────────────────────────────
const bumpArg = process.argv[2] || "dry-run";
const VALID = new Set(["patch", "minor", "major", "dry-run"]);

const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));
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

// 3. Bump version in package.json
steps.push(() => {
  console.log("  📝 Bumping version...");
  pkg.version = nextVersion;
  writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n");
});

// 4. Update README version badge (static badge with explicit version)
steps.push(() => {
  console.log(`  📖 Updating README version badge to ${nextVersion}...`);
  let readme = readFileSync(README_PATH, "utf-8");
  const newBadge = `![Version](https://img.shields.io/badge/version-${nextVersion}-2563eb)`;
  readme = readme.replace(
    /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[^)]+\)/,
    newBadge
  );
  writeFileSync(README_PATH, readme);
  console.log(`     ${newBadge}`);
});

// 5. Git commit + tag
steps.push(() => {
  console.log(`  🏷️  Committing and tagging ${tag}...`);
  run(`git add package.json README.md`);
  // Only commit if there are staged changes
  const staged = runCapture("git diff --cached --stat");
  if (staged) {
    run(`git commit -m "release: ${tag}"`);
  }
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
