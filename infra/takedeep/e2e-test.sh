#!/bin/bash
# E2E: verify TakeDeep API can list LiteLLM models
set -euo pipefail
source /opt/takedeep/.env
export PATH=/root/.bun/bin:$PATH
cd /opt/takedeep/Deepcode-vscode/packages/takedeep-server

TOKEN=$(bun -e "
import { db, userByEmail, insertToken } from './src/db.ts'
import { token, hash, id } from './src/auth.ts'
const email = 'sam@sammane.com'
let u = userByEmail(email)
if (!u) {
  const uid = id()
  db.query('INSERT INTO users (id,email,password_hash,role) VALUES (?,?,?,?)').run(uid, email, 'x', 'admin')
  u = userByEmail(email)!
}
const t = token()
insertToken(t, u.id)
console.log(t)
")

echo "token issued"
CODE=$(curl -sf -X POST http://127.0.0.1:8787/api/device-auth/codes | bun -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(j.code)")
curl -sf -X POST "http://127.0.0.1:8788/device/approve" -d "code=$CODE" -b "td_session=$(curl -sf -X POST http://127.0.0.1:8788/login -d 'email=sam@sammane.com&password=x' -c - | grep td_session | awk '{print $7}')" >/dev/null 2>&1 || true

MODELS=$(curl -sf "http://127.0.0.1:8787/api/openrouter/models" -H "Authorization: Bearer $TOKEN")
echo "$MODELS" | head -c 200
echo
curl -sf https://deeper-api.takedeep.ai/health
echo " public ok"
