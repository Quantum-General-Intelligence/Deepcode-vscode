import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { spawnSync } from "node:child_process"

const root = resolve(import.meta.dir, "../..")
const local = readFileSync(resolve(root, ".env-local"), "utf8")
const get = (key: string) => local.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? ""

const probe = await fetch("https://llm-qualtron.qgi.dev/v1/models", {
  headers: {
    Authorization: `Bearer ${get("LITELLM_QUALTRON_MASTER_KEY")}`,
    "CF-Access-Client-Id": get("CF_ACCESS_SERVICE_TOKEN_ID"),
    "CF-Access-Client-Secret": get("CF_ACCESS_SERVICE_TOKEN_SECRET"),
    "User-Agent": "TakeDeep-probe/1.0",
  },
})

const host = get("SYMBOLIQ_TS_IP") || "100.79.165.23"
const key = resolve(process.env.USERPROFILE ?? "", ".ssh/dbm_ed25519")

const script = `#!/bin/bash
curl -s -w "\\nhttp:%{http_code}\\n" --connect-timeout 15 -m 25 \\
  'https://llm-qualtron.qgi.dev/v1/models' \\
  -H 'Authorization: Bearer ${get("LITELLM_QUALTRON_MASTER_KEY")}' \\
  -H 'CF-Access-Client-Id: ${get("CF_ACCESS_SERVICE_TOKEN_ID")}' \\
  -H 'CF-Access-Client-Secret: ${get("CF_ACCESS_SERVICE_TOKEN_SECRET")}' \\
  -H 'User-Agent: TakeDeep-probe/1.0' | tail -5
`

const { writeFileSync } = await import("node:fs")
const path = "/tmp/probe-llm.sh"
writeFileSync(resolve(import.meta.dir, "probe-remote.sh"), script)

spawnSync("scp", ["-i", key, resolve(import.meta.dir, "probe-remote.sh"), `root@${host}:/tmp/probe-llm.sh`], { stdio: "inherit" })
const r = spawnSync("ssh", ["-i", key, `root@${host}`, "chmod +x /tmp/probe-llm.sh && bash /tmp/probe-llm.sh"], { encoding: "utf8" })
console.log("local probe", probe.status)
console.log("remote probe", r.stdout)
