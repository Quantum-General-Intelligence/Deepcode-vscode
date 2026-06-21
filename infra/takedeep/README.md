# TakeDeep deployment (symboliq-g6x16)

Production hostnames:

| Host | Service | Port |
|---|---|---|
| `deeper-api.takedeep.ai` | Gateway API (`@takedeep/server` api) | 8787 |
| `deeper-dash.takedeep.ai` | Dashboard (auth, device approve, Stripe) | 8788 |
| `deeper.takedeep.ai` | `deeper serve` web UI backend | 4096 |

LLM traffic is proxied through the API to LiteLLM on Qualtron (`LITELLM_QUALTRON_URL` over Tailscale).

## Server setup

1. Join **symboliq-g6x16** to Tailscale (must reach `100.67.97.49:4000`).
2. Copy `infra/takedeep/env.example` → `/opt/takedeep/.env` and fill from `.env-local`.
3. Create a Cloudflare Tunnel for symboliq-g6x16; route the three hostnames per `infra/takedeep/cloudflared.yml`.
4. Run `infra/takedeep/deploy.sh` on the server (or install systemd units manually).
5. In Stripe TheoSym, add webhook `https://deeper-dash.takedeep.ai/webhooks/stripe` → set `STRIPE_THEOSYM_WEBHOOK_SECRET`.

Validate infra locally: `bash infra/takedeep/validate.sh` (also runs in CI on `infra/takedeep/**` changes).

Rebrand docs after upstream doc sync: `bun infra/takedeep/rebrand-docs.ts`.

## First admin

First registered user becomes admin. Or set `TAKEDEEP_ADMIN_EMAIL` to force admin on that email.

## Device sign-in flow

1. VS Code / CLI → `POST https://deeper-api.takedeep.ai/api/device-auth/codes`
2. User opens `https://deeper-dash.takedeep.ai/device?code=…` and approves
3. Client polls until it receives an API token

## Local dev

```bash
cd packages/takedeep-server
export TAKEDEEP_DB_PATH=./takedeep.dev.db
export LITELLM_QUALTRON_URL=http://100.67.97.49:4000
export LITELLM_QUALTRON_MASTER_KEY=...
bun run start:api   # :8787
bun run start:dash  # :8788
```
