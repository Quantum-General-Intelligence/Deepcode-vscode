#!/usr/bin/env bash
# Validate TakeDeep infra assets (run locally or in CI).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INFRA="$ROOT/infra/takedeep"

echo "==> bash syntax"
bash -n "$INFRA/deploy.sh"
bash -n "$INFRA/e2e-chat.sh"
bash -n "$INFRA/watch-serve.sh"

echo "==> cloudflared hostnames"
grep -q "deeper-api.takedeep.ai" "$INFRA/cloudflared.yml"
grep -q "deeper-dash.takedeep.ai" "$INFRA/cloudflared.yml"
grep -q "deeper.takedeep.ai" "$INFRA/cloudflared.yml"

echo "==> env.example"
grep -q "TAKEDEEP_API_URL" "$INFRA/env.example"
grep -q "CF_TUNNEL_SYMBOLIQ_TOKEN" "$INFRA/env.example"
grep -q "KILO_SERVER_PASSWORD" "$INFRA/env.example"

echo "==> managed config template"
test -f "$INFRA/generated/etc/deeper/kilo.jsonc"
grep -q "litellm/" "$INFRA/generated/etc/deeper/kilo.jsonc"

echo "==> deploy.sh structure"
! grep -q $'^fi$' <(tail -n 5 "$INFRA/deploy.sh" | head -n 2) || true
lines=$(tail -n 3 "$INFRA/deploy.sh" | tr '\n' ' ')
echo "$lines" | grep -q 'echo "Done."'

echo "OK"
