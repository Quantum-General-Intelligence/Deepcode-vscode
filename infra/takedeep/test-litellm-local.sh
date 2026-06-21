#!/bin/bash
set -a
source /opt/takedeep/.env
set +a
code=$(curl -s -o /tmp/lm.out -w "%{http_code}" --connect-timeout 10 -m 25 "http://127.0.0.1:14000/v1/models" -H "Authorization: Bearer ${LITELLM_QUALTRON_MASTER_KEY}")
echo "http:$code"
head -c 400 /tmp/lm.out
echo
