#!/usr/bin/env bash
set -euo pipefail
export PATH=/root/.bun/bin:$PATH
source /opt/takedeep/.env
curl -sf -u "kilo:${KILO_SERVER_PASSWORD}" http://127.0.0.1:4096/provider \
  | bun -e 'const d=JSON.parse(require("fs").readFileSync(0,"utf8")); const p=d.all.find((x)=>x.id==="litellm"); console.log("providers:", d.all.map((x)=>x.id).join(", ")); console.log("litellm models:", p ? Object.keys(p.models).join(", ") : "(none)"); console.log("default:", d.default)'
