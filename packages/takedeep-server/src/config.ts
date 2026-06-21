import { BRAND } from "@takedeep/gateway/brand"

function env(key: string, fallback = "") {
  return process.env[key] ?? fallback
}

export const cfg = {
  apiPort: Number(env("TAKEDEEP_API_PORT", "8787")),
  dashPort: Number(env("TAKEDEEP_DASH_PORT", "8788")),
  apiUrl: env("TAKEDEEP_API_URL", BRAND.apiUrl),
  dashUrl: env("TAKEDEEP_DASH_URL", BRAND.appUrl),
  webUrl: env("TAKEDEEP_WEB_URL", BRAND.webUrl),
  dbPath: env("TAKEDEEP_DB_PATH", "/var/lib/takedeep/takedeep.db"),
  jwtSecret: env("TAKEDEEP_JWT_SECRET", env("KILO_SERVER_PASSWORD", "change-me-in-production")),
  litellmUrl: env("LITELLM_URL", env("LITELLM_QUALTRON_URL", env("LITELLM_IRIDTRON_URL", "https://llm.qgi.dev"))).replace(
    /\/$/,
    "",
  ),
  litellmKey: env(
    "LITELLM_MASTER_KEY",
    env("LITELLM_IRIDTRON_MASTER_KEY", env("LITELLM_QUALTRON_MASTER_KEY", "")),
  ),
  cfAccessId: env("CF_ACCESS_SERVICE_TOKEN_ID", ""),
  cfAccessSecret: env("CF_ACCESS_SERVICE_TOKEN_SECRET", ""),
  stripeSecret: env("STRIPE_THEOSYM_SECRET_KEY", ""),
  stripeWebhookSecret: env("STRIPE_THEOSYM_WEBHOOK_SECRET", ""),
  adminEmail: env("TAKEDEEP_ADMIN_EMAIL", "").toLowerCase(),
  deviceCodeTtlSec: Number(env("TAKEDEEP_DEVICE_CODE_TTL_SEC", "900")),
}

export function litellmHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (cfg.litellmKey) headers.Authorization = `Bearer ${cfg.litellmKey}`
  if (cfg.cfAccessId && cfg.cfAccessSecret) {
    headers["CF-Access-Client-Id"] = cfg.cfAccessId
    headers["CF-Access-Client-Secret"] = cfg.cfAccessSecret
  }
  return headers
}
