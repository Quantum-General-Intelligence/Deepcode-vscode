#!/bin/bash
set -a
source /opt/takedeep/.env
set +a
curl -s --connect-timeout 15 -m 20 "http://100.67.97.49:4000/v1/models" \
  -H "Authorization: Bearer ${LITELLM_QUALTRON_MASTER_KEY}" | head -c 400
echo
