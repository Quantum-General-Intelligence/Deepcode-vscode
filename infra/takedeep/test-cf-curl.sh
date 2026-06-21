#!/bin/bash
set -a
source /opt/takedeep/.env
set +a
/opt/instance-tools/bin/cloudflared access curl \
  "https://llm-qualtron.qgi.dev/v1/models" \
  --header "Authorization: Bearer ${LITELLM_QUALTRON_MASTER_KEY}" \
  --header "CF-Access-Client-Id: ${CF_ACCESS_SERVICE_TOKEN_ID}" \
  --header "CF-Access-Client-Secret: ${CF_ACCESS_SERVICE_TOKEN_SECRET}" 2>&1 | head -c 500
echo
