/**
 * Push sources + config to symboliq, build deeper (linux) there, restart serve.
 */
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { spawnSync } from "node:child_process"

const root = resolve(import.meta.dir, "../..")
const local = readFileSync(resolve(root, ".env-local"), "utf8")
const get = (key: string) => local.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""
const sshKey = resolve(process.env.USERPROFILE ?? "", ".ssh/dbm_ed25519")
const host = get("SYMBOLIQ_TS_IP") || "100.79.165.23"
const remote = `root@${host}`
const repo = "/opt/takedeep/Deepcode-vscode"

function run(cmd: string[], cwd = root, shell = process.platform === "win32") {
  const r = spawnSync(cmd[0], cmd.slice(1), { cwd, stdio: "inherit", shell })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

function sshRun(cmd: string) {
  const r = spawnSync("ssh", ["-i", sshKey, remote, cmd], { stdio: "inherit" })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

console.log("==> local config artifacts")
run(["bun", "infra/takedeep/write-server-config.ts"])
run(["bun", "infra/takedeep/write-prod-env.ts"])

const prodEnv = resolve(root, "packages/app/.env.production.local")
writeFileSync(prodEnv, "VITE_DEFAULT_DIRECTORY=/opt/takedeep/Deepcode-vscode\n")
console.log("wrote", prodEnv)

console.log("==> tar+ssh sync to symboliq")
const excludes = [
  "node_modules",
  "packages/opencode/dist",
  "packages/app/dist",
  ".git",
  "infra/takedeep/.prod.env",
  "infra/takedeep/generated",
]
const tarArgs = [
  "tar",
  "czf",
  "-",
  ...excludes.flatMap((x) => ["--exclude", x]),
  "-C",
  root,
  ".",
]
const tar = spawnSync(tarArgs[0], tarArgs.slice(1), {
  cwd: root,
  encoding: "buffer",
  maxBuffer: 1024 * 1024 * 1024,
})
if (tar.status !== 0) {
  console.error(tar.stderr?.toString())
  process.exit(tar.status ?? 1)
}
console.log(`archive ${(tar.stdout.length / 1e6).toFixed(1)} MB`)
const sshSync = spawnSync("ssh", ["-i", sshKey, remote, `mkdir -p ${repo} && tar xzf - -C ${repo}`], {
  input: tar.stdout,
  stdio: ["pipe", "inherit", "inherit"],
  maxBuffer: 1024 * 1024 * 1024,
})
if (sshSync.status !== 0) process.exit(sshSync.status ?? 1)

console.log("==> push env + server config")
run(["scp", "-i", sshKey, resolve(import.meta.dir, ".prod.env"), `${remote}:/opt/takedeep/.env`])
run(["scp", "-i", sshKey, resolve(import.meta.dir, "kilo.server.jsonc"), `${remote}:/tmp/kilo.server.jsonc`])

const remoteBuild = [
  "set -e",
  "export PATH=/root/.bun/bin:$PATH",
  "chmod 600 /opt/takedeep/.env",
  "install -d -m 755 /etc/deeper",
  "cp /tmp/kilo.server.jsonc /etc/deeper/kilo.jsonc",
  `cd ${repo}`,
  "bun install",
  "VITE_DEFAULT_DIRECTORY=/opt/takedeep/Deepcode-vscode bun run --cwd packages/app build",
  `cd ${repo}/packages/opencode`,
  "bun run script/build.ts --single --skip-install",
  "DIST_BIN=$(find dist -path '*/bin/deeper' -type f | head -1)",
  'test -n "$DIST_BIN"',
  "chmod +x /opt/takedeep/Deepcode-vscode/infra/takedeep/watch-serve.sh",
  "cp /opt/takedeep/Deepcode-vscode/infra/takedeep/supervisor/takedeep.conf /etc/supervisor/conf.d/takedeep.conf",
  "supervisorctl reread && supervisorctl update",
  "supervisorctl stop takedeep-serve || true",
  "cp \"$DIST_BIN\" /opt/takedeep/deeper",
  "chmod 755 /opt/takedeep/deeper",
  "supervisorctl start takedeep-litellm-proxy || true",
  "sleep 2",
  "supervisorctl restart takedeep-serve takedeep-serve-watch",
  "sleep 4",
  "set -a && source /opt/takedeep/.env && set +a",
  'AUTH=$(printf "kilo:%s" "$KILO_SERVER_PASSWORD" | base64 | tr -d "\\n")',
  'curl -sf -H "Authorization: Basic $AUTH" http://127.0.0.1:4096/global/health',
].join(" && ")

console.log("==> remote build + restart")
sshRun(remoteBuild)

console.log("Done. Open https://deeper.takedeep.ai (basic auth: kilo / your KILO_SERVER_PASSWORD)")
