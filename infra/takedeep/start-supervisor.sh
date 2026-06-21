#!/usr/bin/env bash
# Start TakeDeep on vast.ai (supervisord, not systemd).
set -euo pipefail

export PATH="/root/.bun/bin:$PATH"
CONF_SRC="/opt/takedeep/Deepcode-vscode/infra/takedeep/supervisor/takedeep.conf"
CONF_DST="/etc/supervisor/conf.d/takedeep.conf"

cp "$CONF_SRC" "$CONF_DST"
supervisorctl reread
supervisorctl update
supervisorctl restart takedeep-api takedeep-dash takedeep-serve takedeep-tunnel || supervisorctl start takedeep-api takedeep-dash takedeep-serve takedeep-tunnel
sleep 3
supervisorctl status takedeep-api takedeep-dash takedeep-serve takedeep-tunnel
echo "==> health"
curl -sf http://127.0.0.1:8787/health && echo " api ok"
curl -sf -o /dev/null -w "dash %{http_code}\n" http://127.0.0.1:8788/login
