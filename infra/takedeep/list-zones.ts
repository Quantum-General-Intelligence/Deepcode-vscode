import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dir, "../..")
const local = readFileSync(resolve(root, ".env-local"), "utf8")
const get = (key: string) => local.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""

const account = get("CLOUDFLARE_ACCOUNT_ID")
const token = get("CLOUDFLARE_API_TOKEN")
const email = get("CF_API_EMAIL")
const globalKey = get("CF_GLOBAL_API_KEY")

async function list(headers: Record<string, string>) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones?per_page=50`, { headers })
  const json = await res.json()
  console.log("success", json.success, "count", json.result?.length)
  for (const z of json.result ?? []) console.log(z.name, z.id)
}

console.log("--- bearer token ---")
await list({ Authorization: `Bearer ${token}` })
console.log("--- global key ---")
await list({ "X-Auth-Email": email, "X-Auth-Key": globalKey })
