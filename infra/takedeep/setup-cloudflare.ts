/** Create Cloudflare tunnel + DNS for TakeDeep on symboliq (reads .env-local). */
import { readFileSync, writeFileSync, appendFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dir, "../..")
const local = readFileSync(resolve(root, ".env-local"), "utf8")
const get = (key: string) => local.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""

const account = get("CLOUDFLARE_ACCOUNT_ID")
const token = get("CLOUDFLARE_API_TOKEN")
const email = get("CF_API_EMAIL")
const globalKey = get("CF_GLOBAL_API_KEY")
const existingId = get("CF_TUNNEL_SYMBOLIQ_ID")
const existingTok = get("CF_TUNNEL_SYMBOLIQ_TOKEN")

const headers: Record<string, string> = globalKey && email
  ? { "X-Auth-Email": email, "X-Auth-Key": globalKey, "Content-Type": "application/json" }
  : { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

if (!account || (!token && !globalKey)) {
  console.error("missing Cloudflare credentials")
  process.exit(1)
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, { ...init, headers: { ...headers, ...init?.headers } })
  const json = await res.json()
  if (!json.success) {
    console.error("CF API error", path, JSON.stringify(json.errors ?? json))
    process.exit(1)
  }
  return json.result
}

const zone = await api("/zones?name=takedeep.ai")
const zoneId = zone[0]?.id
if (!zoneId) {
  console.error("zone takedeep.ai not found")
  process.exit(1)
}

let tunnelId = existingId
if (!tunnelId) {
  const tunnels = await api(`/accounts/${account}/cfd_tunnel?name=symboliq-g6x16-takedeep`)
  tunnelId = tunnels[0]?.id
}
if (!tunnelId) {
  const created = await api(`/accounts/${account}/cfd_tunnel`, {
    method: "POST",
    body: JSON.stringify({ name: "symboliq-g6x16-takedeep", config_src: "local" }),
  })
  tunnelId = created.id
  console.log("created tunnel", tunnelId)
}

let tunnelToken = existingTok
if (!tunnelToken) {
  const tok = await api(`/accounts/${account}/cfd_tunnel/${tunnelId}/token`)
  tunnelToken = typeof tok === "string" ? tok : tok?.token
  console.log("got tunnel token")
}

await api(`/accounts/${account}/cfd_tunnel/${tunnelId}/configurations`, {
  method: "PUT",
  body: JSON.stringify({
    config: {
      ingress: [
        { hostname: "deeper-api.takedeep.ai", service: "http://127.0.0.1:8787" },
        { hostname: "deeper-dash.takedeep.ai", service: "http://127.0.0.1:8788" },
        { hostname: "deeper.takedeep.ai", service: "http://127.0.0.1:4096" },
        { service: "http_status:404" },
      ],
    },
  }),
})
console.log("tunnel ingress configured")

const hosts = ["deeper-api.takedeep.ai", "deeper-dash.takedeep.ai", "deeper.takedeep.ai"]
const target = `${tunnelId}.cfargotunnel.com`

for (const name of hosts) {
  const records = await api(`/zones/${zoneId}/dns_records?name=${name}`)
  if (records.length) {
    console.log("dns exists", name)
    continue
  }
  await api(`/zones/${zoneId}/dns_records`, {
    method: "POST",
    body: JSON.stringify({ type: "CNAME", name, content: target, proxied: true, ttl: 1 }),
  })
  console.log("dns created", name)
}

const prod = resolve(import.meta.dir, ".prod.env")
let body = readFileSync(prod, "utf8")
if (!body.includes("CF_TUNNEL_SYMBOLIQ_TOKEN=") || body.match(/^CF_TUNNEL_SYMBOLIQ_TOKEN=$/m)) {
  body = body.replace(/^CF_TUNNEL_SYMBOLIQ_TOKEN=.*$/m, `CF_TUNNEL_SYMBOLIQ_TOKEN=${tunnelToken}`)
}
if (!body.includes("CF_TUNNEL_SYMBOLIQ_ID=")) {
  appendFileSync(prod, `CF_TUNNEL_SYMBOLIQ_ID=${tunnelId}\n`)
} else {
  body = body.replace(/^CF_TUNNEL_SYMBOLIQ_ID=.*$/m, `CF_TUNNEL_SYMBOLIQ_ID=${tunnelId}`)
  writeFileSync(prod, body)
}

// append to .env-local markers for reuse (user file, gitignored)
if (!local.includes("CF_TUNNEL_SYMBOLIQ_ID=")) {
  appendFileSync(resolve(root, ".env-local"), `\nCF_TUNNEL_SYMBOLIQ_ID=${tunnelId}\nCF_TUNNEL_SYMBOLIQ_TOKEN=${tunnelToken}\n`)
}

console.log("tunnel ready", tunnelId)
