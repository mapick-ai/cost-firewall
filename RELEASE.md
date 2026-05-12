# Release Flow

```bash
# Dry-run preview
npm run release v0.2.0 "feat: zero-config routing"

# Or with env
DRY_RUN=1 .shell/release-firewall.sh v0.2.0
```

**Auto-executes:**
1. `git status` — must be clean
2. Bump version in `package.json` + `openclaw.plugin.json` + `src/index.ts`
3. Update `VERSION.md` changelog
4. `pnpm build` + `pnpm test`
5. `git commit` + `git tag`
6. `git push` + `git push --tags`
7. `npm publish`
8. `gh release create` (GitHub Release)

**Env vars:**
- `DRY_RUN=1` — preview only, restore files after
- `SKIP_NPM=1` — skip npm publish
- `SKIP_GH=1` — skip GitHub Release
