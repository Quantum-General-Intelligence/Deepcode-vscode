import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dir, "../..")
const local = readFileSync(resolve(root, ".env-local"), "utf8")
const get = (key: string) => local.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""
const account = get("CLOUDFLARE_ACCOUNT_ID")
const headers = {
  "X-Auth-Email": get("CF_API_EMAIL"),
  "X-Auth-Key": get("CF_GLOBAL_API_KEY"),
  "Content-Type": "application/json",
}

async function api(path: string, init?: RequestInit) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, { ...init, headers: { ...headers, ...init?.headers } })
  const json = await res.json()
  if (!json.success) {
    console.error(path, JSON.stringify(json.errors))
    process.exit(1)
  }
  return json.result
}

const appId = "8af1d523-9136-43c4-91ba-9d957f19aea0"
const policies = await api(`/accounts/${account}/access/apps/${appId}/policies?per_page=50`)
console.log(JSON.stringify(policies.map((p: { id: string; name: string; precedence: number; include: unknown }) => ({ id: p.id, name: p.name, precedence: p.precedence, include: p.include })), null, 2))
