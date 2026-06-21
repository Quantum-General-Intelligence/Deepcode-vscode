#!/bin/bash
export PATH=/root/.bun/bin:$PATH
cd /opt/takedeep/Deepcode-vscode/packages/takedeep-server
TOKEN=$(bun -e '
import "./src/db.ts"
import { userByEmail, insertToken, insertUser, countUsers } from "./src/db.ts"
import { token, id } from "./src/auth.ts"
const email = "probe@takedeep.ai"
let u = userByEmail(email)
if (!u) {
  const uid = id()
  insertUser({ id: uid, email, password_hash: "x", role: countUsers() ? "user" : "admin" })
  u = userByEmail(email)
}
const t = token()
insertToken(t, u.id)
console.log(t)
')
echo "models local:"
curl -sf "http://127.0.0.1:8787/api/openrouter/models" -H "Authorization: Bearer $TOKEN" | head -c 300
echo
echo "models public:"
curl -sf "https://deeper-api.takedeep.ai/api/openrouter/models" -H "Authorization: Bearer $TOKEN" | head -c 300
echo
