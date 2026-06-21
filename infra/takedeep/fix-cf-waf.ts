/**
 * WAF skip for symboliq -> llm-qualtron (bot fight blocks datacenter curl).
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dir, "../..")
const local = readFileSync(resolve(root, ".env-local"), "utf8")
const get = (key: string) => local.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""

const zone = "6789484014cd7c769f13ac53ef39607d" // qgi.dev
const ip = get("SYMBOLIQ_SSH_HOST") || "45.135.163.226"
const clientId = get("CF_ACCESS_SERVICE_TOKEN_ID")

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

const rulesets = await api(`/zones/${zone}/rulesets`)
const custom = rulesets.find((r: { phase: string }) => r.phase === "http_request_firewall_custom")

const expr = `(http.host in {"llm-qualtron.qgi.dev" "llm.qgi.dev"} and (ip.src eq ${ip} or http.request.headers[\"cf-access-client-id\"][0] eq \"${clientId}\"))`
const rule = {
  description: "TakeDeep symboliq LiteLLM",
  expression: expr,
  action: "skip",
  action_parameters: { phases: ["http_request_firewall_managed", "http_request_sbfm"] },
}

if (custom) {
  const full = await api(`/zones/${zone}/rulesets/${custom.id}`)
  const rules = full.rules ?? []
  const idx = rules.findIndex((r: { description: string }) => r.description === rule.description)
  if (idx >= 0) rules[idx] = { ...rules[idx], ...rule }
  else rules.unshift({ ...rule, enabled: true })
  await api(`/zones/${zone}/rulesets/${custom.id}`, { method: "PUT", body: JSON.stringify({ rules }) })
  console.log("updated waf ruleset", custom.id)
} else {
  const created = await api(`/zones/${zone}/rulesets`, {
    method: "POST",
    body: JSON.stringify({
      name: "custom firewall",
      kind: "zone",
      phase: "http_request_firewall_custom",
      rules: [{ ...rule, enabled: true }],
    }),
  })
  console.log("created waf ruleset", created.id)
}

console.log("done for ip", ip)
