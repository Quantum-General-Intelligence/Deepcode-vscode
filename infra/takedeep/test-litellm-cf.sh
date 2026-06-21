#!/bin/bash
set -a
source /opt/takedeep/.env
set +a
code=$(curl -s -o /tmp/lm.out -w "%{http_code}" --connect-timeout 15 -m 25 \
  "https://llm-qualtron.qgi.dev/v1/models" \
  -H "Authorization: Bearer ${LITELLM_QUALTRON_MASTER_KEY}" \
  -H "CF-Access-Client-Id: ${CF_ACCESS_SERVICE_TOKEN_ID}" \
  -H "CF-Access-Client-Secret: ${CF_ACCESS_SERVICE_TOKEN_SECRET}")
echo "litellm https:$code"
head -c 300 /tmp/lm.out
echo
