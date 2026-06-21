#!/usr/bin/env bash
# One-shot: CF WAF fix + env sync + API restart on symboliq
set -euo pipefail
cd "$(dirname "$0")/../.."
bun infra/takedeep/fix-cf-waf.ts
bun infra/takedeep/write-prod-env.ts
bun infra/takedeep/remote-restart-api.ts
ssh -i "${HOME}/.ssh/dbm_ed25519" root@100.79.165.23 "bash /tmp/test-litellm-cf.sh && bash /tmp/e2e-models.sh"
