// kilocode_change - new file

/** Inject iridtron/vLLM thinking-disable params; normalize empty content responses. */
const LITELLM_TIMEOUT_MS = 120_000

export function litellmFetch(base?: typeof fetch) {
  const inner = base ?? fetch
  const wrapped = async (input: RequestInfo | URL, init?: RequestInit) => {
    const opts = init ? { ...init } : {}
    const timeout = AbortSignal.timeout(LITELLM_TIMEOUT_MS)
    opts.signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
    const chat = url.includes("/chat/completions")

    if (chat && opts.method === "POST" && typeof opts.body === "string") {
      const parsed = JSON.parse(opts.body) as Record<string, unknown>
      const extra = (parsed.extra_body ?? {}) as Record<string, unknown>
      const kwargs = (extra.chat_template_kwargs ?? {}) as Record<string, unknown>
      opts.body = JSON.stringify({
        ...parsed,
        reasoning_effort: parsed.reasoning_effort ?? "none",
        extra_body: {
          ...extra,
          chat_template_kwargs: { ...kwargs, enable_thinking: false },
        },
      })
    }

    const res = await inner(input, opts)
    if (!chat || !res.ok || res.body == null) return res

    const type = res.headers.get("content-type") ?? ""
    if (type.includes("text/event-stream")) return res

    if (!type.includes("application/json")) return res

    const raw = await res.text()
    const json = JSON.parse(raw) as {
      choices?: Array<{ message?: { content?: string | null; reasoning_content?: string | null } }>
    }
    const msg = json.choices?.[0]?.message
    if (msg && (msg.content == null || msg.content === "") && msg.reasoning_content) {
      msg.content = msg.reasoning_content
    }
    return new Response(JSON.stringify(json), {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    })
  }
  return wrapped as typeof fetch
}
