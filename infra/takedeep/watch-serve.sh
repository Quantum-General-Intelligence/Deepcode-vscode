#!/usr/bin/env bash
# Restart takedeep-serve when /global/health stops responding (hung event loop).
set -euo pipefail
source /opt/takedeep/.env
AUTH=$(printf 'kilo:%s' "$KILO_SERVER_PASSWORD" | base64 | tr -d '\n')
URL=http://127.0.0.1:4096/global/health

while true; do
  if ! curl -sf -m 8 -H "Authorization: Basic $AUTH" "$URL" >/dev/null; then
    echo "$(date -Is) takedeep-serve health failed — restarting"
    supervisorctl restart takedeep-serve || true
    sleep 15
  fi
  sleep 30
done
