#!/usr/bin/env bash
# Rebuild deeper on symboliq and restart serve (after opencode fixes).
set -euo pipefail
export PATH=/root/.bun/bin:$PATH
REPO=/opt/takedeep/Deepcode-vscode
cd "$REPO/packages/opencode"
bun run script/build.ts --single --skip-install
DIST_BIN=$(find dist -path '*/bin/deeper' -type f | head -1)
test -n "$DIST_BIN"
supervisorctl stop takedeep-serve || true
cp "$DIST_BIN" /opt/takedeep/deeper
chmod 755 /opt/takedeep/deeper
supervisorctl start takedeep-serve
sleep 3
supervisorctl status takedeep-serve
