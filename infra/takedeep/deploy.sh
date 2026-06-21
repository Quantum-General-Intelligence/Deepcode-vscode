#!/usr/bin/env bash
# Deploy TakeDeep stack on symboliq-g6x16 (Ubuntu). Run as root on the server.
set -euo pipefail

ROOT="${TAKEDEEP_ROOT:-/opt/takedeep}"
REPO="${ROOT}/Deepcode-vscode"
ENV_FILE="${ROOT}/.env"

echo "==> Install Bun if missing"
if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

echo "==> Sync or clone repo"
if [[ ! -d "$REPO/packages/takedeep-server" ]]; then
  mkdir -p "$ROOT"
  if [[ -d "$REPO/.git" ]]; then
    git -C "$REPO" pull --ff-only || true
  else
    echo "Repo missing at $REPO — rsync from workstation first."
    exit 1
  fi
fi

echo "==> Env file"
if [[ ! -f "$ENV_FILE" ]]; then
  cp "$REPO/infra/takedeep/env.example" "$ENV_FILE"
  echo "Edit $ENV_FILE then re-run."
  exit 1
fi

echo "==> Install deps + build CLI"
cd "$REPO"
export PATH="$HOME/.bun/bin:$PATH"
export KILO_VERSION="$(node -p "require('./packages/opencode/package.json').version" 2>/dev/null || echo 7.2.31)"
bun install
cd packages/takedeep-server
bun install

echo "==> Build CLI (optional; serve uses bun runtime)"
cd "$REPO/packages/opencode"
if bun run script/build.ts --single --skip-install 2>/dev/null; then
  DIST_BIN="$(find dist -path '*/bin/deeper' -type f 2>/dev/null | head -1)"
  if [[ -n "$DIST_BIN" ]]; then
    install -m 755 "$DIST_BIN" /opt/takedeep/deeper
    echo "installed /opt/takedeep/deeper"
  fi
fi

echo "==> Data dir"
install -d -o root -g root -m 755 /var/lib/takedeep

echo "==> process manager"
if command -v systemctl >/dev/null 2>&1 && systemctl is-system-running >/dev/null 2>&1; then
  cp "$REPO/infra/takedeep/systemd/"*.service /etc/systemd/system/
  systemctl daemon-reload
  systemctl enable takedeep-api takedeep-dash takedeep-serve
  systemctl restart takedeep-api takedeep-dash takedeep-serve
elif command -v supervisorctl >/dev/null 2>&1; then
  bash "$REPO/infra/takedeep/start-supervisor.sh"
else
  echo "No systemd/supervisor — run start-supervisor.sh manually"
fi

echo "==> cloudflared (systemd hosts only)"
if command -v systemctl >/dev/null 2>&1 && systemctl is-system-running >/dev/null 2>&1; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  CF_BIN="$(command -v cloudflared || echo /opt/instance-tools/bin/cloudflared)"
  if ! systemctl is-active cloudflared >/dev/null 2>&1; then
    "$CF_BIN" service install "$CF_TUNNEL_SYMBOLIQ_TOKEN" || true
  fi
  mkdir -p /etc/cloudflared
  cp "$REPO/infra/takedeep/cloudflared.yml" /etc/cloudflared/config.yml
  systemctl enable cloudflared 2>/dev/null || true
  systemctl restart cloudflared
fi

echo "Done."
