/**
 * Push updated prod env + restart API on symboliq (reads .env-local).
 */
import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { spawnSync } from "node:child_process"

const root = resolve(import.meta.dir, "../..")
spawnSync("bun", ["infra/takedeep/write-prod-env.ts"], { cwd: root, stdio: "inherit" })

const local = readFileSync(resolve(root, ".env-local"), "utf8")
const get = (key: string) => local.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""
const sshKey = resolve(process.env.USERPROFILE ?? "", ".ssh/dbm_ed25519")
const host = get("SYMBOLIQ_TS_IP") || "100.79.165.23"

const prod = resolve(import.meta.dir, ".prod.env")
const scp = spawnSync("scp", ["-i", sshKey, prod, `root@${host}:/opt/takedeep/.env`], { stdio: "inherit" })
if (scp.status !== 0) process.exit(scp.status ?? 1)

const remote = spawnSync(
  "ssh",
  [
    "-i",
    sshKey,
    `root@${host}`,
    `chmod 600 /opt/takedeep/.env && supervisorctl stop takedeep-litellm-proxy 2>/dev/null; supervisorctl restart takedeep-api && sleep 2 && curl -sf http://127.0.0.1:8787/health`,
  ],
  { stdio: "inherit" },
)
process.exit(remote.status ?? 0)
