import { Hono } from "hono"
import { getCookie, setCookie } from "hono/cookie"
import Stripe from "stripe"
import { cfg } from "./config"
import {
  approveDevice,
  countUsers,
  denyDevice,
  deviceByCode,
  insertUser,
  listUsers,
  userByEmail,
  userById,
  type User,
} from "./db"
import { dashSession, hash, id, parseDashSession, token, verify } from "./auth"

const stripe = cfg.stripeSecret ? new Stripe(cfg.stripeSecret) : undefined

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — TakeDeep</title>
  <style>
    :root { font-family: system-ui, sans-serif; color: #0f172a; background: #f8fafc; }
    body { max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; }
    h1 { font-size: 1.5rem; margin: 0 0 1rem; }
    label { display: block; margin: 0.75rem 0 0.25rem; font-size: 0.875rem; }
    input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; }
    button, .btn { display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; border: 0; border-radius: 8px;
      background: #2563eb; color: #fff; text-decoration: none; cursor: pointer; }
    .btn.secondary { background: #64748b; }
    .btn.danger { background: #dc2626; }
    .error { color: #dc2626; margin-top: 0.75rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.875rem; }
    th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #e2e8f0; }
    nav a { margin-right: 1rem; }
  </style>
</head>
<body>
  <nav style="margin-bottom:1rem"><a href="/">Home</a><a href="/billing">Billing</a><a href="/admin">Admin</a></nav>
  <div class="card">${body}</div>
</body>
</html>`
}

function sessionUser(c: { req: { header: (n: string) => string | undefined } }) {
  const raw = getCookie(c as any, "td_session")
  const data = parseDashSession(raw)
  if (!data) return undefined
  return userById(data.userId)
}

export function dashApp() {
  const app = new Hono()

  app.get("/", (c) => {
    const user = sessionUser(c)
    if (!user) return c.redirect("/login")
    return c.html(
      layout(
        "Dashboard",
        `<h1>TakeDeep</h1>
        <p>Signed in as <strong>${user.email}</strong></p>
        <p><a class="btn" href="/billing">Invoices & billing</a></p>
        ${user.role === "admin" ? `<p><a class="btn secondary" href="/admin">User admin</a></p>` : ""}
        <form method="post" action="/logout"><button type="submit">Sign out</button></form>`,
      ),
    )
  })

  app.get("/login", (c) =>
    c.html(
      layout(
        "Sign in",
        `<h1>Sign in</h1>
        <form method="post" action="/login">
          <label>Email</label><input name="email" type="email" required />
          <label>Password</label><input name="password" type="password" required />
          <button type="submit">Sign in</button>
        </form>
        <p style="margin-top:1rem"><a href="/register">Create account</a></p>`,
      ),
    ),
  )

  app.post("/login", async (c) => {
    const form = await c.req.parseBody()
    const email = String(form.email ?? "").toLowerCase()
    const password = String(form.password ?? "")
    const user = userByEmail(email)
    if (!user || !(await verify(password, user.password_hash))) {
      return c.html(layout("Sign in", `<h1>Sign in</h1><p class="error">Invalid email or password.</p><p><a href="/login">Try again</a></p>`), 401)
    }
    setCookie(c, "td_session", dashSession({ userId: user.id, email: user.email }), {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    })
    return c.redirect("/")
  })

  app.get("/register", (c) =>
    c.html(
      layout(
        "Register",
        `<h1>Create account</h1>
        <form method="post" action="/register">
          <label>Name</label><input name="name" type="text" />
          <label>Email</label><input name="email" type="email" required />
          <label>Password</label><input name="password" type="password" required minlength="8" />
          <button type="submit">Register</button>
        </form>`,
      ),
    ),
  )

  app.post("/register", async (c) => {
    const form = await c.req.parseBody()
    const email = String(form.email ?? "").toLowerCase()
    const password = String(form.password ?? "")
    const name = String(form.name ?? "")
    if (userByEmail(email)) {
      return c.html(layout("Register", `<p class="error">Email already registered.</p><a href="/login">Sign in</a>`), 409)
    }

    let stripeId: string | undefined
    if (stripe) {
      const customer = await stripe.customers.create({ email, name: name || undefined })
      stripeId = customer.id
    }

    const userId = id()
    const role = countUsers() === 0 || email === cfg.adminEmail ? "admin" : "user"
    insertUser({
      id: userId,
      email,
      name: name || undefined,
      password_hash: await hash(password),
      role,
      stripe_customer_id: stripeId,
    })

    setCookie(c, "td_session", dashSession({ userId, email }), {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    })
    return c.redirect("/")
  })

  app.post("/logout", (c) => {
    setCookie(c, "td_session", "", { path: "/", maxAge: 0 })
    return c.redirect("/login")
  })

  app.get("/device", (c) => {
    const user = sessionUser(c)
    const authCode = c.req.query("code") ?? ""
    if (!authCode) return c.text("Missing code", 400)
    if (!user) return c.redirect(`/login?next=${encodeURIComponent(`/device?code=${authCode}`)}`)

    const row = deviceByCode(authCode)
    const expired = !row || row.expires_at < Date.now()
    const status = row?.status ?? "expired"

    return c.html(
      layout(
        "Device authorization",
        `<h1>Authorize TakeDeep</h1>
        <p>Code: <strong>${authCode}</strong></p>
        <p>Status: ${status}</p>
        ${expired ? `<p class="error">This code expired.</p>` : ""}
        ${!expired && status === "pending"
          ? `<form method="post" action="/device/approve" style="display:inline"><input type="hidden" name="code" value="${authCode}" />
             <button type="submit">Approve</button></form>
             <form method="post" action="/device/deny" style="display:inline;margin-left:0.5rem"><input type="hidden" name="code" value="${authCode}" />
             <button class="danger" type="submit">Deny</button></form>`
          : status === "approved"
            ? `<p>You can return to the app.</p>`
            : ""}`,
      ),
    )
  })

  app.post("/device/approve", async (c) => {
    const user = sessionUser(c)
    if (!user) return c.redirect("/login")
    const form = await c.req.parseBody()
    const authCode = String(form.code ?? "")
    approveDevice(authCode, user.id)
    return c.redirect(`/device?code=${authCode}`)
  })

  app.post("/device/deny", async (c) => {
    const user = sessionUser(c)
    if (!user) return c.redirect("/login")
    const form = await c.req.parseBody()
    denyDevice(String(form.code ?? ""))
    return c.redirect("/")
  })

  app.get("/billing", async (c) => {
    const user = sessionUser(c)
    if (!user) return c.redirect("/login")
    if (!stripe || !user.stripe_customer_id) {
      return c.html(layout("Billing", `<h1>Billing</h1><p>Stripe is not configured.</p>`))
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${cfg.dashUrl}/billing`,
    })

    const invoices = await stripe.invoices.list({ customer: user.stripe_customer_id, limit: 12 })
    const rows = invoices.data
      .map(
        (inv) =>
          `<tr><td>${inv.number ?? inv.id}</td><td>${inv.status}</td><td>${((inv.amount_due ?? 0) / 100).toFixed(2)} ${inv.currency?.toUpperCase()}</td>
           <td>${inv.hosted_invoice_url ? `<a href="${inv.hosted_invoice_url}">View</a>` : ""}</td></tr>`,
      )
      .join("")

    return c.html(
      layout(
        "Billing",
        `<h1>Billing & invoices</h1>
        <p><a class="btn" href="${portal.url}">Stripe customer portal</a></p>
        <table><thead><tr><th>Invoice</th><th>Status</th><th>Amount</th><th></th></tr></thead><tbody>${rows || "<tr><td colspan=4>No invoices yet</td></tr>"}</tbody></table>`,
      ),
    )
  })

  app.get("/admin", (c) => {
    const user = sessionUser(c)
    if (!user || user.role !== "admin") return c.text("Forbidden", 403)
    const users = listUsers()
    const rows = users
      .map(
        (u: User) =>
          `<tr><td>${u.email}</td><td>${u.role}</td><td>${(u.balance_cents / 100).toFixed(2)}</td><td>${u.stripe_customer_id ?? ""}</td><td>${u.created_at}</td></tr>`,
      )
      .join("")
    return c.html(
      layout(
        "Admin",
        `<h1>Users</h1>
        <table><thead><tr><th>Email</th><th>Role</th><th>Balance</th><th>Stripe</th><th>Created</th></tr></thead><tbody>${rows}</tbody></table>`,
      ),
    )
  })

  app.post("/webhooks/stripe", async (c) => {
    if (!stripe) return c.text("stripe disabled", 503)
    const sig = c.req.header("stripe-signature")
    const raw = await c.req.text()
    if (!sig || !cfg.stripeWebhookSecret) return c.text("missing webhook config", 400)
    const event = stripe.webhooks.constructEvent(raw, sig, cfg.stripeWebhookSecret)
    if (event.type === "invoice.paid") {
      const inv = event.data.object as Stripe.Invoice
      // balance updates can be wired here
      console.log("[stripe] invoice paid", inv.id)
    }
    return c.json({ received: true })
  })

  return app
}
