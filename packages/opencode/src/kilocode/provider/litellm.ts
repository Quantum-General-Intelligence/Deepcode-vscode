// kilocode_change - new file
import { Effect } from "effect"
import { ModelID, ProviderID } from "@/provider/schema"
import { Log } from "@/util"
import { litellmFetch } from "./litellm-fetch"

const log = Log.create({ service: "litellm-provider" })

type LiteModel = { id: string; owned_by?: string }

type CustomDep = {
  auth: (id: string) => Effect.Effect<any | undefined>
  config: () => Effect.Effect<any>
  env: () => Effect.Effect<Record<string, string | undefined>>
  get: (key: string) => Effect.Effect<string | undefined>
}

type CustomLoaderResult = {
  autoload: boolean
  getModel?: (sdk: any, modelID: string, options?: Record<string, any>) => Promise<any>
  vars?: (options: Record<string, any>) => Record<string, string>
  options?: Record<string, any>
  discoverModels?: () => Promise<Record<string, any>>
}

type CustomLoader = (provider: any) => Effect.Effect<CustomLoaderResult>

export async function fetchLiteModels(input: {
  baseURL: string
  apiKey: string
  headers?: Record<string, string>
}) {
  const base = input.baseURL.replace(/\/+$/, "")
  const url = base.endsWith("/v1") ? `${base}/models` : `${base}/v1/models`
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      ...input.headers,
    },
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`LiteLLM models failed: ${response.status}`)
  const json = (await response.json()) as { data?: LiteModel[] }
  return json.data ?? []
}

function toModel(id: string) {
  return {
    id: ModelID.make(id),
    providerID: ProviderID.make("litellm"),
    name: id,
    family: "",
    release_date: "",
    api: {
      id,
      npm: "@ai-sdk/openai-compatible",
      url: "",
    },
    status: "active" as const,
    headers: {},
    options: {},
    cost: { input: 0, output: 0, cache: { read: 0, write: 0 } },
    limit: { context: 128_000, output: 16_384 },
    capabilities: {
      temperature: true,
      reasoning: false,
      attachment: false,
      toolcall: true,
      input: { text: true, audio: false, image: false, video: false, pdf: false },
      output: { text: true, audio: false, image: false, video: false, pdf: false },
      interleaved: false,
    },
    variants: {},
  }
}

export function litellmHeaders(env: Record<string, string | undefined>, opts: Record<string, any>) {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) }
  if (env.CF_ACCESS_SERVICE_TOKEN_ID && env.CF_ACCESS_SERVICE_TOKEN_SECRET) {
    headers["CF-Access-Client-Id"] = env.CF_ACCESS_SERVICE_TOKEN_ID
    headers["CF-Access-Client-Secret"] = env.CF_ACCESS_SERVICE_TOKEN_SECRET
  }
  return headers
}

export function litellmLoader(dep: CustomDep): CustomLoader {
  return () =>
    Effect.gen(function* () {
      const env = yield* dep.env()
      const cfg = yield* dep.config()
      const opts = cfg.provider?.litellm?.options ?? {}
      const apiKey =
        env.LITELLM_QUALTRON_MASTER_KEY ??
        env.LITELLM_MASTER_KEY ??
        env.LITELLM_IRIDTRON_MASTER_KEY ??
        opts.apiKey
      const baseURL = (
        opts.baseURL ??
        env.LITELLM_QUALTRON_URL ??
        env.LITELLM_URL ??
        "https://llm.qgi.dev/v1"
      ).replace(/\/$/, "")
      const headers = litellmHeaders(env, opts)

      return {
        autoload: !!apiKey,
        options: {
          litellmProxy: true,
          baseURL: baseURL.endsWith("/v1") ? baseURL : `${baseURL}/v1`,
          fetch: litellmFetch(),
          ...(apiKey ? { apiKey } : {}),
          ...(Object.keys(headers).length ? { headers } : {}),
        },
        async discoverModels() {
          if (!apiKey) return {}
          try {
            const list = await fetchLiteModels({ baseURL, apiKey, headers })
            const models: Record<string, any> = {}
            for (const item of list) models[item.id] = toModel(item.id)
            log.info("discovered litellm models", { count: list.length })
            return models
          } catch (err) {
            log.warn("litellm discovery failed", { err })
            return {}
          }
        },
      }
    })
}

export function configModelEntry(id: string) {
  return {
    name: id,
    limit: { context: 128_000, output: 16_384 },
    tool_call: true,
    temperature: true,
  }
}
