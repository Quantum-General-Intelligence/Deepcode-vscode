#!/usr/bin/env bash
set -euo pipefail
source /opt/takedeep/.env
supervisorctl status takedeep-litellm-proxy || true
curl -sf "http://127.0.0.1:14000/v1/models" \
  -H "Authorization: Bearer ${LITELLM_QUALTRON_MASTER_KEY}" \
  | head -c 8000
