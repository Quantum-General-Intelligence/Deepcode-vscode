import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dir, "../..")
const local = readFileSync(resolve(root, ".env-local"), "utf8")
const get = (key: string) => local.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""
const account = get("CLOUDFLARE_ACCOUNT_ID")
const headers = {
  "X-Auth-Email": get("CF_API_EMAIL"),
  "X-Auth-Key": get("CF_GLOBAL_API_KEY"),
}

const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/access/service_tokens`, { headers })
const json = await res.json()
console.log(JSON.stringify(json.result?.map((t: { id: string; name: string; client_id: string }) => ({ id: t.id, name: t.name, client_id: t.client_id })), null, 2))
