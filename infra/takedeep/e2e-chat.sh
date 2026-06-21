#!/usr/bin/env bash
set -euo pipefail
export PATH=/root/.bun/bin:$PATH
source /opt/takedeep/.env
DIR=/opt/takedeep/Deepcode-vscode
AUTH=$(printf 'kilo:%s' "$KILO_SERVER_PASSWORD" | base64 | tr -d '\n')
BASE=http://127.0.0.1:4096

echo "== health"
curl -sf -H "Authorization: Basic $AUTH" "$BASE/global/health" || curl -sf -H "Authorization: Basic $AUTH" "$BASE/health" || echo "no health endpoint"
echo

echo "== grep fix in deployed source"
grep -n "enable_thinking" "$DIR/packages/opencode/src/provider/transform.ts" | head -2 || echo "MISSING transform fix"

echo "== create session"
SESSION=$(curl -sf -H "Authorization: Basic $AUTH" -H "x-kilo-directory: $DIR" -H "Content-Type: application/json" \
  -d '{}' "$BASE/session" | bun -e 'console.log(JSON.parse(require("fs").readFileSync(0,"utf8")).id)')
echo "session=$SESSION"

echo "== prompt litellm/Qualtron 4B"
curl -sf -H "Authorization: Basic $AUTH" -H "x-kilo-directory: $DIR" -H "Content-Type: application/json" \
  -d "{\"model\":{\"providerID\":\"litellm\",\"modelID\":\"Qualtron 4B\"},\"parts\":[{\"type\":\"text\",\"text\":\"Reply with exactly: pong\"}]}" \
  "$BASE/session/$SESSION/message" | head -c 500
echo

echo "== wait + read messages"
sleep 15
curl -sf -H "Authorization: Basic $AUTH" -H "x-kilo-directory: $DIR" \
  "$BASE/session/$SESSION/message" | bun -e '
const msgs = JSON.parse(require("fs").readFileSync(0,"utf8"));
for (const m of msgs) {
  if (m.info.role !== "assistant") continue;
  const text = (m.parts||[]).filter(p=>p.type==="text").map(p=>p.text).join("");
  const reasoning = (m.parts||[]).filter(p=>p.type==="reasoning").map(p=>p.text).join("");
  console.log("assistant text:", JSON.stringify(text.slice(0,200)));
  console.log("assistant reasoning:", JSON.stringify(reasoning.slice(0,120)));
  console.log("parts:", (m.parts||[]).map(p=>p.type).join(","));
}
'

echo "== serve log tail"
supervisorctl tail -3000 takedeep-serve 2>&1 | tail -40
