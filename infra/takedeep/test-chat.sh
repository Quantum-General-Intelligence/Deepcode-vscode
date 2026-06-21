#!/usr/bin/env bash
set -euo pipefail
export PATH=/root/.bun/bin:$PATH
source /opt/takedeep/.env

echo "== direct litellm (Qualtron 4B)"
curl -s -m 60 "https://llm.qgi.dev/v1/chat/completions" \
  -H "Authorization: Bearer ${LITELLM_QUALTRON_MASTER_KEY}" \
  -H "CF-Access-Client-Id: ${CF_ACCESS_SERVICE_TOKEN_ID}" \
  -H "CF-Access-Client-Secret: ${CF_ACCESS_SERVICE_TOKEN_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"model":"Qualtron 4B","messages":[{"role":"user","content":"Say hi in 3 words"}],"max_tokens":20,"stream":false}' \
  | head -c 800
echo

echo "== takedeep-api proxy"
TOKEN=$(cd /opt/takedeep/Deepcode-vscode/packages/takedeep-server && bun -e '
import "./src/db.ts"
import { userByEmail, insertToken, insertUser, countUsers } from "./src/db.ts"
import { token, id } from "./src/auth.ts"
const email = "probe@takedeep.ai"
let u = userByEmail(email)
if (!u) { const uid = id(); insertUser({ id: uid, email, password_hash: "x", role: countUsers() ? "user" : "admin" }); u = userByEmail(email) }
const t = token(); insertToken(t, u.id); console.log(t)
')
curl -s -m 60 "http://127.0.0.1:8787/api/openrouter/chat/completions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"Qualtron 4B","messages":[{"role":"user","content":"Say hi in 3 words"}],"max_tokens":20,"stream":false}' \
  | head -c 800
echo

echo "== deeper serve session prompt (if session exists)"
# list recent serve logs
supervisorctl tail -2000 takedeep-serve 2>/dev/null | tail -30
