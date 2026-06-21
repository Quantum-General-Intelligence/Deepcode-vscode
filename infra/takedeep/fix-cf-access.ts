/**
 * Allow CF Access service token on llm-qualtron.qgi.dev (reads .env-local).
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dir, "../..")
const local = readFileSync(resolve(root, ".env-local"), "utf8")
const get = (key: string) => local.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""

const account = get("CLOUDFLARE_ACCOUNT_ID")
const email = get("CF_API_EMAIL")
const globalKey = get("CF_GLOBAL_API_KEY")
const tokenId = get("CF_ACCESS_SERVICE_TOKEN_UUID") || "39fff3b9-f7e1-44ec-9e19-61381febb499"

const headers: Record<string, string> = {
  "X-Auth-Email": email,
  "X-Auth-Key": globalKey,
  "Content-Type": "application/json",
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, { ...init, headers: { ...headers, ...init?.headers } })
  const json = await res.json()
  if (!json.success) {
    console.error("CF error", path, JSON.stringify(json.errors ?? json))
    process.exit(1)
  }
  return json.result
}

const hosts = ["llm.qgi.dev", "llm-qualtron.qgi.dev"]
const apps = await api(`/accounts/${account}/access/apps?per_page=100`)
const sid = get("CF_ACCESS_SERVICE_TOKEN_ID")
const secret = get("CF_ACCESS_SERVICE_TOKEN_SECRET")
const key = get("LITELLM_MASTER_KEY") || get("LITELLM_QUALTRON_MASTER_KEY")

for (const host of hosts) {
  let app = apps.find((a: { domain?: string; name?: string }) => a.domain === host)
  if (!app) {
    console.log("creating access app for", host)
    app = await api(`/accounts/${account}/access/apps`, {
      method: "POST",
      body: JSON.stringify({
        name: `LiteLLM ${host}`,
        domain: host,
        type: "self_hosted",
        session_duration: "24h",
        auto_redirect_to_identity: false,
      }),
    })
  }

  console.log("app", app.id, app.domain ?? app.name)

  const policies = await api(`/accounts/${account}/access/apps/${app.id}/policies?per_page=50`)
  const name = "Service token — TakeDeep"
  const existing = policies.find((p: { name: string }) => p.name === name)
  const maxPrec = policies.reduce((n: number, p: { precedence?: number }) => Math.max(n, p.precedence ?? 0), 0)

  const body = {
    name,
    decision: "non_identity",
    include: [{ service_token: { token_id: tokenId } }],
    precedence: existing?.precedence ?? maxPrec + 1,
  }

  if (existing) {
    await api(`/accounts/${account}/access/apps/${app.id}/policies/${existing.id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    })
    console.log("updated policy", existing.id)
  } else {
    const created = await api(`/accounts/${account}/access/apps/${app.id}/policies`, {
      method: "POST",
      body: JSON.stringify(body),
    })
    console.log("created policy", created.id)
  }

  const probe = await fetch(`https://${host}/v1/models`, {
    headers: {
      Authorization: `Bearer ${key}`,
      "CF-Access-Client-Id": sid,
      "CF-Access-Client-Secret": secret,
    },
    signal: AbortSignal.timeout(20_000),
  })
  console.log("probe", host, probe.status, (await probe.text()).slice(0, 120))

  const ip = get("SYMBOLIQ_SSH_HOST") || "45.135.163.226"
  const bypassName = "Bypass — symboliq"
  const bypass = policies.find((p: { name: string }) => p.name === bypassName)
  const bypassBody = {
    name: bypassName,
    decision: "bypass",
    include: [{ ip: { ip: `${ip}/32` } }],
    precedence: bypass?.precedence ?? maxPrec + 2,
  }
  if (bypass) {
    await api(`/accounts/${account}/access/apps/${app.id}/policies/${bypass.id}`, {
      method: "PUT",
      body: JSON.stringify(bypassBody),
    })
    console.log("updated bypass", bypass.id)
  } else {
    const created = await api(`/accounts/${account}/access/apps/${app.id}/policies`, {
      method: "POST",
      body: JSON.stringify(bypassBody),
    })
    console.log("created bypass", created.id)
  }
}
