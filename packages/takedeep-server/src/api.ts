import { Hono } from "hono"
import { cors } from "hono/cors"
import { cfg } from "./config"
import {
  deviceByCode,
  insertDevice,
  insertToken,
  userById,
  userByToken,
  db,
} from "./db"
import { bearer, code as makeCode, token } from "./auth"
import { defaultModelId, fetchLiteModels, proxyChat, toOpenRouter } from "./litellm"

const pending = new Map<string, number>()

export function apiApp() {
  const app = new Hono()

  app.use(
    "*",
    cors({
      origin: (origin) => origin ?? cfg.dashUrl,
      credentials: true,
    }),
  )

  app.get("/health", (c) => c.json({ ok: true }))

  app.post("/api/device-auth/codes", async (c) => {
    const ip = c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "local"
    const now = Date.now()
    const last = pending.get(ip) ?? 0
    if (now - last < 2000) return c.json({ error: "rate limited" }, 429)
    pending.set(ip, now)

    const authCode = makeCode()
    const expiresAt = now + cfg.deviceCodeTtlSec * 1000
    insertDevice(authCode, expiresAt)

    return c.json({
      code: authCode,
      verificationUrl: `${cfg.dashUrl}/device?code=${authCode}`,
      expiresIn: cfg.deviceCodeTtlSec,
    })
  })

  app.get("/api/device-auth/codes/:code", async (c) => {
    const authCode = c.req.param("code")
    const row = deviceByCode(authCode)
    if (!row) return c.json({ status: "expired" }, 410)
    if (row.expires_at < Date.now()) return c.json({ status: "expired" }, 410)
    if (row.status === "pending") return c.json({ status: "pending" }, 202)
    if (row.status === "denied") return c.json({ status: "denied" }, 403)
    if (row.status === "consumed") return c.json({ status: "expired" }, 410)
    if (row.status !== "approved" || !row.user_id) return c.json({ status: "expired" }, 410)

    const u = userById(row.user_id)
    if (!u) return c.json({ status: "expired" }, 410)

    const apiToken = token()
    insertToken(apiToken, u.id)
    db.query("UPDATE device_codes SET status = 'consumed' WHERE code = ?").run(authCode)

    return c.json({ status: "approved", token: apiToken, userEmail: u.email })
  })

  app.get("/api/profile", async (c) => {
    const tok = bearer(c.req.header("authorization"))
    if (!tok) return c.json({ error: "unauthorized" }, 401)
    const user = userByToken(tok)
    if (!user) return c.json({ error: "unauthorized" }, 401)
    return c.json({
      user: { email: user.email, name: user.name ?? user.email },
      organizations: [],
    })
  })

  app.get("/api/profile/balance", async (c) => {
    const tok = bearer(c.req.header("authorization"))
    if (!tok) return c.json({ error: "unauthorized" }, 401)
    const user = userByToken(tok)
    if (!user) return c.json({ error: "unauthorized" }, 401)
    return c.json({ balance: user.balance_cents / 100 })
  })

  app.get("/api/defaults", async (c) => {
    const model = await defaultModelId()
    return c.json({ defaultFreeModel: model, defaultModel: model })
  })

  app.get("/api/organizations/:org/defaults", async (c) => {
    const model = await defaultModelId()
    return c.json({ defaultModel: model })
  })

  app.get("/api/users/notifications", async (c) => c.json({ notifications: [] }))

  app.get("/api/organizations/:org/modes", async (c) => {
    const tok = bearer(c.req.header("authorization"))
    if (!tok || !userByToken(tok)) return c.json({ error: "unauthorized" }, 401)
    return c.json({ modes: [] })
  })

  app.get("/api/openrouter/models", async (c) => {
    const tok = bearer(c.req.header("authorization"))
    if (!tok || !userByToken(tok)) return c.json({ error: "unauthorized" }, 401)
    const models = toOpenRouter(await fetchLiteModels())
    return c.json({ data: models })
  })

  app.post("/api/openrouter/chat/completions", async (c) => {
    const tok = bearer(c.req.header("authorization"))
    if (!tok || !userByToken(tok)) return c.json({ error: "unauthorized" }, 401)
    return proxyChat(c.req.raw)
  })

  app.post("/api/openrouter/v1/chat/completions", async (c) => {
    const tok = bearer(c.req.header("authorization"))
    if (!tok || !userByToken(tok)) return c.json({ error: "unauthorized" }, 401)
    return proxyChat(c.req.raw)
  })

  app.get("/config.json", (c) =>
    c.json({
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "TakeDeep Config",
      type: "object",
      additionalProperties: true,
    }),
  )

  app.get("/api/marketplace/*", (c) => c.json({ items: [] }))

  return app
}
