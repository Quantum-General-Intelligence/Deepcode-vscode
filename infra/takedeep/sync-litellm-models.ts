/** Regenerate kilo.server.jsonc from LiteLLM and push to symboliq. */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { spawnSync } from "node:child_process"

const root = resolve(import.meta.dir, "../..")
spawnSync("bun", ["infra/takedeep/write-server-config.ts"], { cwd: root, stdio: "inherit" })

const local = readFileSync(resolve(root, ".env-local"), "utf8")
const get = (key: string) => local.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""
const sshKey = resolve(process.env.USERPROFILE ?? "", ".ssh/dbm_ed25519")
const host = get("SYMBOLIQ_TS_IP") || "100.79.165.23"

spawnSync("scp", ["-i", sshKey, resolve(import.meta.dir, "kilo.server.jsonc"), `root@${host}:/tmp/kilo.server.jsonc`], {
  stdio: "inherit",
})

const r = spawnSync(
  "ssh",
  [
    "-i",
    sshKey,
    `root@${host}`,
    "cp /tmp/kilo.server.jsonc /etc/deeper/kilo.jsonc && supervisorctl restart takedeep-serve && sleep 4 && /tmp/check-providers.sh",
  ],
  { stdio: "inherit" },
)
process.exit(r.status ?? 0)
