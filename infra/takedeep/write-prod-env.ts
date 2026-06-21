/** Generate /opt/takedeep/.env from repo-root .env-local (never commit output). */
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dir, "../..")
const local = readFileSync(resolve(root, ".env-local"), "utf8")
const get = (key: string) => local.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""

/** Bash-safe single-quoted value for `source .env` (prevents $ expansion). */
function q(value: string) {
  if (!value) return ""
  return `'${value.replace(/'/g, `'\\''`)}'`
}

const lines = [
  "TAKEDEEP_API_URL=https://deeper-api.takedeep.ai",
  "TAKEDEEP_DASH_URL=https://deeper-dash.takedeep.ai",
  "TAKEDEEP_WEB_URL=https://deeper.takedeep.ai",
  "TAKEDEEP_API_PORT=8787",
  "TAKEDEEP_DASH_PORT=8788",
  "TAKEDEEP_DB_PATH=/var/lib/takedeep/takedeep.db",
  `TAKEDEEP_JWT_SECRET=${q(get("KILO_SERVER_PASSWORD") || get("TAKEDEEP_JWT_SECRET") || "change-me")}`,
  "TAKEDEEP_ADMIN_EMAIL=sam@sammane.com",
  "TAKEDEEP_DEVICE_CODE_TTL_SEC=900",
  `LITELLM_QUALTRON_URL=${get("LITELLM_PUBLIC_URL") || get("LITELLM_URL") || "https://llm.qgi.dev"}`,
  `LITELLM_QUALTRON_MASTER_KEY=${q(get("LITELLM_MASTER_KEY") || get("LITELLM_IRIDTRON_MASTER_KEY") || get("LITELLM_QUALTRON_MASTER_KEY"))}`,
  `CF_ACCESS_SERVICE_TOKEN_ID=${get("CF_ACCESS_SERVICE_TOKEN_ID")}`,
  `CF_ACCESS_SERVICE_TOKEN_SECRET=${q(get("CF_ACCESS_SERVICE_TOKEN_SECRET"))}`,
  `CF_ACCESS_SERVICE_TOKEN_UUID=39fff3b9-f7e1-44ec-9e19-61381febb499`,
  `STRIPE_THEOSYM_SECRET_KEY=${q(get("STRIPE_THEOSYM_SECRET_KEY"))}`,
  `STRIPE_THEOSYM_WEBHOOK_SECRET=${q(get("STRIPE_THEOSYM_WEBHOOK_SECRET"))}`,
  `KILO_SERVER_PASSWORD=${q(get("KILO_SERVER_PASSWORD"))}`,
  `CF_TUNNEL_SYMBOLIQ_TOKEN=${q(get("CF_TUNNEL_SYMBOLIQ_TOKEN"))}`,
  `CF_TUNNEL_SYMBOLIQ_ID=${get("CF_TUNNEL_SYMBOLIQ_ID")}`,
]

const out = resolve(import.meta.dir, ".prod.env")
writeFileSync(out, lines.filter((l) => /^[^=]+=.+/.test(l)).join("\n") + "\n")
console.log(`wrote ${out}`)
