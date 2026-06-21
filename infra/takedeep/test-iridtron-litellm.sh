#!/usr/bin/env bash
set -euo pipefail
source /opt/takedeep/.env
curl -sv "https://llm.qgi.dev/v1/models" \
  -H "Authorization: Bearer sk-7a039e4a259dd3310ddad14bc86d5afd9077f5a8cff2d760" \
  -H "CF-Access-Client-Id: ${CF_ACCESS_SERVICE_TOKEN_ID}" \
  -H "CF-Access-Client-Secret: ${CF_ACCESS_SERVICE_TOKEN_SECRET}" 2>&1 | tail -8
