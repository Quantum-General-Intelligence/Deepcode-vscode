# TakeDeep fork

This repository is a **TakeDeep** fork of Kilo Code / OpenCode.

| Setting | Value |
|---|---|
| Product name | TakeDeep |
| CLI command | `deeper` |
| Config directory | `.takedeep` |
| API | `https://deeper-api.takedeep.ai` |
| Dashboard | `https://deeper-dash.takedeep.ai` |
| Web UI | `https://deeper.takedeep.ai` |
| VS Code extension ID | `takedeep.takedeep` (sideload) |

## Environment variables

| Variable | Purpose |
|---|---|
| `TAKEDEEP_API_URL` | Override API base URL |
| `TAKEDEEP_POSTHOG_KEY` | PostHog project API key (telemetry off until set) |
| `TAKEDEEP_POSTHOG_HOST` | PostHog host (default `https://us.i.posthog.com`) |
| `KILO_API_URL` | Legacy alias for API URL |

## Sideload the extension

```bash
cd packages/kilo-vscode
bun script/local-bin.ts
bun run compile
bun run package
```

Install the generated `.vsix` via **Extensions â†’ Install from VSIX**.

## CLI (dev)

```bash
bun run dev -- help
# or after build:
packages/opencode/bin/deeper --version
```

## Phase 2 (done)

- English UI strings rebranded to TakeDeep
- Config file picker uses `.takedeep/` and `deeper-api.takedeep.ai` schema
- Provider settings emphasize sign-in + BYOK
- Support/docs links point at `deeper-api.takedeep.ai`

## Phase 3 (done)

- Commands/settings renamed: `kilo-code.new.*` â†’ `takedeep.*`
- Sidebar view: `takedeep.SidebarProvider`
- Activity bar + webview logos use `logo.png` / `logo-outline-black.png`
- VS Code settings scope: `takedeep.*` (was `kilo-code.new.*`)

## Phase 4 (done)

- All webview + `kilo-i18n` locale files rebranded (Kilo â†’ TakeDeep, `kilo.ai` â†’ `deeper-api.takedeep.ai`, `.kilo` config paths â†’ `.takedeep`)
- KiloClaw disabled (`ENABLE_CLAW = false`) â€” command and sidebar button removed
- Extension activate log uses `EXTENSION_DISPLAY_NAME`

## Phase 5 (done)

- npm scope renamed: `@kilocode/*` â†’ `@takedeep/*` (453+ files)
- CLI dist paths: `dist/@takedeep/cli-*`
- Root `README.md` rebranded for TakeDeep
- Binary references updated to `deeper` in build/install scripts

## Phase 6 (done)

- Extension host strings rebranded (code actions, autocomplete, tasks, reset dialogs)
- Marketplace API + paths use `deeper-api.takedeep.ai` and `.takedeep/`
- Gateway TUI usage links use `deeper-dash.takedeep.ai`
- Agent Manager git excludes cover `.takedeep/`, `.kilo/`, `.kilocode/`

## Phase 7 (done)

- E2E verification: CLI build, 2010 unit tests pass, VSIX packages
- Bugs fixed: worktree temp dir prefix, state file Windows writes, telemetry without PostHog key, `local-bin --skip-install`

## Phase 8 (done)

- Production URLs: `deeper-api`, `deeper-dash`, `deeper` subdomains
- `@takedeep/server`: gateway API + dashboard (device auth, LiteLLM proxy, Stripe TheoSym)
- Deploy assets in `infra/takedeep/`

## Phase 9 (done)

- `infra/takedeep/deploy.sh` fixed; `validate.sh` + CI workflow `takedeep-infra.yml`
- Production runbook in `infra/takedeep/README.md` (CF tunnel, Stripe webhook, device auth, e2e)
- `watch-serve.sh` health watchdog in supervisor

## Phase 10 (done)

- Web app: TakeDeep favicon/notification icon, feedback + changelog URLs
- `entry.tsx` hostname checks for `takedeep.ai`

## Phase 11 (done)

- VS Code extension: repo URL, `takedeep` command icons, autocomplete i18n namespace `takedeep:autocomplete.*`
- Removed broken custom icon font contribution

## Phase 12 (done)

- CLI `scriptName("deeper")`, TakeDeep ASCII logo, `BRAND.configSchemaUrl` in config loader
- `.takedeep/` config dirs + `takedeep.jsonc` precedence; share URLs use `deeper-dash.takedeep.ai`

## Phase 13 (done)

- Bulk docs rebrand via `infra/takedeep/rebrand-docs.ts` (`packages/kilo-docs`)

## Next phases

- Phase 14: Telemetry & ops (PostHog, runbooks)
- Phase 15: Structural cleanup (folder renames, upstream merge)
- Phase 16: Publication & distribution (Marketplace, npm, Open VSX)
