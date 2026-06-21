import { cfg, litellmHeaders } from "./config"

type LiteModel = {
  id: string
  object?: string
  created?: number
  owned_by?: string
}

type OpenRouterModel = {
  id: string
  name: string
  description?: string
  context_length: number
  max_completion_tokens?: number
  pricing?: { prompt: string; completion: string }
  architecture?: { input_modalities: string[]; output_modalities: string[] }
  supported_parameters?: string[]
}

export async function fetchLiteModels() {
  const response = await fetch(`${cfg.litellmUrl}/v1/models`, {
    headers: litellmHeaders(),
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`LiteLLM models failed: ${response.status}`)
  const json = (await response.json()) as { data?: LiteModel[] }
  return json.data ?? []
}

export function toOpenRouter(models: LiteModel[]): OpenRouterModel[] {
  return models.map((m) => ({
    id: m.id,
    name: m.id,
    description: `LiteLLM model ${m.id}`,
    context_length: 128_000,
    max_completion_tokens: 16_384,
    pricing: { prompt: "0", completion: "0" },
    architecture: { input_modalities: ["text"], output_modalities: ["text"] },
    supported_parameters: ["temperature", "max_tokens", "tools", "tool_choice"],
  }))
}

export async function proxyChat(request: Request) {
  const url = `${cfg.litellmUrl}/v1/chat/completions`
  const parsed = JSON.parse(await request.text()) as Record<string, unknown>
  const extra = (parsed.extra_body ?? {}) as Record<string, unknown>
  const kwargs = (extra.chat_template_kwargs ?? {}) as Record<string, unknown>
  const body = JSON.stringify({
    ...parsed,
    reasoning_effort: parsed.reasoning_effort ?? "none",
    extra_body: {
      ...extra,
      chat_template_kwargs: { ...kwargs, enable_thinking: false },
    },
  })
  const headers = new Headers(litellmHeaders())
  const accept = request.headers.get("accept")
  if (accept) headers.set("accept", accept)

  const upstream = await fetch(url, { method: "POST", headers, body })
  const out = new Headers()
  out.set("content-type", upstream.headers.get("content-type") ?? "application/json")
  if (upstream.headers.get("cache-control")) out.set("cache-control", upstream.headers.get("cache-control")!)

  if (upstream.body && upstream.headers.get("content-type")?.includes("text/event-stream")) {
    return new Response(upstream.body, { status: upstream.status, headers: out })
  }

  const text = await upstream.text()
  return new Response(text, { status: upstream.status, headers: out })
}

export async function defaultModelId() {
  const models = await fetchLiteModels()
  return models[0]?.id ?? "gpt-4o-mini"
}
