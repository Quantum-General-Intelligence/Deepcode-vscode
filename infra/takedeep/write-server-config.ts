/** Generate managed server config for deeper serve — all LiteLLM models from /v1/models. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { configModelEntry, fetchLiteModels, litellmHeaders } from "../../packages/opencode/src/kilocode/provider/litellm.ts"

const root = resolve(import.meta.dir, "../..")
const local = readFileSync(resolve(root, ".env-local"), "utf8")
const get = (key: string) => local.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""

const api = get("TAKEDEEP_API_URL") || "https://deeper-api.takedeep.ai"
const litellmUrl = get("LITELLM_PUBLIC_URL") || get("LITELLM_URL") || "https://llm.qgi.dev"
const litellmKey =
  get("LITELLM_MASTER_KEY") || get("LITELLM_IRIDTRON_MASTER_KEY") || get("LITELLM_QUALTRON_MASTER_KEY")
const env = {
  CF_ACCESS_SERVICE_TOKEN_ID: get("CF_ACCESS_SERVICE_TOKEN_ID"),
  CF_ACCESS_SERVICE_TOKEN_SECRET: get("CF_ACCESS_SERVICE_TOKEN_SECRET"),
}
const baseURL = `${litellmUrl.replace(/\/$/, "")}/v1`
const headers = litellmHeaders(env, {})

if (!litellmKey) {
  console.error("LITELLM_MASTER_KEY (or LITELLM_IRIDTRON_MASTER_KEY) missing in .env-local")
  process.exit(1)
}

const list = await fetchLiteModels({ baseURL, apiKey: litellmKey, headers })
if (!list.length) {
  console.error("LiteLLM returned no models from", baseURL)
  process.exit(1)
}

const ids = list.map((m) => m.id)
const defaultId = ids.includes("Qualtron 4B")
  ? "Qualtron 4B"
  : ids.includes("Qulatron 4B")
    ? "Qulatron 4B"
    : ids[0]
const models = Object.fromEntries(ids.map((id) => [id, configModelEntry(id)]))

const config = JSON.stringify(
  {
    $schema: `${api}/config.json`,
    model: `litellm/${defaultId}`,
    enabled_providers: ["litellm", "kilo"],
    disabled_providers: ["opencode", "opencode-go"],
    provider: {
      litellm: {
        name: "LiteLLM",
        env: ["LITELLM_QUALTRON_MASTER_KEY", "CF_ACCESS_SERVICE_TOKEN_ID", "CF_ACCESS_SERVICE_TOKEN_SECRET"],
        options: {
          baseURL,
          litellmProxy: true,
        },
        models,
      },
      kilo: {
        name: "TakeDeep Gateway",
        options: {
          baseURL: api,
        },
      },
    },
  },
  null,
  2,
)

const out = resolve(import.meta.dir, "kilo.server.jsonc")
writeFileSync(out, config + "\n")

const managed = resolve(import.meta.dir, "generated/etc/deeper/kilo.jsonc")
mkdirSync(resolve(managed, ".."), { recursive: true })
writeFileSync(managed, config + "\n")
console.log(`wrote ${out} (${ids.length} models: ${ids.join(", ")})`)
