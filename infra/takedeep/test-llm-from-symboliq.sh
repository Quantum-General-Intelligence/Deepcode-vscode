#!/usr/bin/env bash
set -euo pipefail
set -a
source /opt/takedeep/.env
set +a

KEY="$LITELLM_QUALTRON_MASTER_KEY"
ID="${CF_ACCESS_SERVICE_TOKEN_ID%.access}"

echo "egress=$(curl -s -m 8 https://ifconfig.me)"
echo "models id=${ID:0:12}..."

code=$(curl -s -o /tmp/llm.out -w "%{http_code}" -m 25 \
  "https://llm.qgi.dev/v1/models" \
  -H "Authorization: Bearer ${KEY}" \
  -H "CF-Access-Client-Id: ${ID}" \
  -H "CF-Access-Client-Secret: ${CF_ACCESS_SERVICE_TOKEN_SECRET}")
echo "models http:${code}"
head -c 200 /tmp/llm.out
echo

body='{"model":"Qualtron 4B","messages":[{"role":"user","content":"Reply with exactly: pong"}],"max_tokens":50,"reasoning_effort":"none","extra_body":{"chat_template_kwargs":{"enable_thinking":false}}}'
code=$(curl -s -o /tmp/chat.out -w "%{http_code}" -m 90 \
  "https://llm.qgi.dev/v1/chat/completions" \
  -H "Authorization: Bearer ${KEY}" \
  -H "CF-Access-Client-Id: ${ID}" \
  -H "CF-Access-Client-Secret: ${CF_ACCESS_SERVICE_TOKEN_SECRET}" \
  -H "Content-Type: application/json" \
  -d "$body")
echo "chat http:${code}"
head -c 500 /tmp/chat.out
echo
