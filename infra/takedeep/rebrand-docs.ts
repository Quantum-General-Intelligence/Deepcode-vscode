/** Bulk rebrand packages/kilo-docs from Kilo Code to TakeDeep. */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"

const root = resolve(import.meta.dir, "../../packages/kilo-docs")

const rules: Array<[RegExp, string]> = [
  [/https:\/\/app\.kilo\.ai/g, "https://deeper-dash.takedeep.ai"],
  [/https:\/\/api\.kilo\.ai/g, "https://deeper-api.takedeep.ai"],
  [/https:\/\/kilo\.ai/g, "https://deeper-api.takedeep.ai"],
  [/http:\/\/kilo\.ai/g, "http://deeper-api.takedeep.ai"],
  [/Kilo Code Documentation/g, "TakeDeep Documentation"],
  [/Kilo Code/g, "TakeDeep"],
  [/Kilo Gateway/g, "TakeDeep Gateway"],
  [/KiloClaw/g, "TakeDeep Claw"],
  [/kilocode\.kilo-code/g, "takedeep.takedeep"],
  [/Kilo-Org\/kilocode/g, "Quantum-General-Intelligence/Deepcode-vscode"],
  [/Kilo-Org\//g, "Quantum-General-Intelligence/"],
  [/\bkilo\.jsonc\b/g, "takedeep.jsonc"],
  [/\bkilo\.json\b/g, "takedeep.json"],
  [/\.kilo\//g, ".takedeep/"],
  [/\b`kilo`\b/g, "`deeper`"],
  [/\bnpx kilo\b/g, "npx deeper"],
  [/\bbunx @kilocode\/cli\b/g, "bunx @takedeep/cli"],
  [/npm install -g @kilocode\/cli/g, "npm install -g @takedeep/cli"],
  [/https:\/\/blog\.kilo\.ai/g, "https://deeper-api.takedeep.ai"],
  [/https:\/\/path\.kilo\.ai/g, "https://deeper-api.takedeep.ai"],
  [/app\.kilo\.ai/g, "deeper-dash.takedeep.ai"],
  [/api\.kilo\.ai/g, "deeper-api.takedeep.ai"],
  [/hi@kilo\.ai/g, "support@takedeep.ai"],
  [/migrations@kilo\.ai/g, "support@takedeep.ai"],
  [/hostname !== "kilo\.ai"/g, 'hostname !== "deeper-api.takedeep.ai"'],
  [/host \|\| "kilo\.ai"/g, 'host || "deeper-api.takedeep.ai"'],
  [/"name": "Kilo Code"/g, '"name": "TakeDeep"'],
  [/"short_name": "Kilo"/g, '"short_name": "TakeDeep"'],
  [/served under kilo\.ai\/docs/g, "served under deeper-api.takedeep.ai/docs"],
  [/at app\.kilo\.ai\/config\.json/g, "at deeper-api.takedeep.ai/config.json"],
  [/Kilo account/g, "TakeDeep account"],
  [/learning what Kilo itself/g, "learning what TakeDeep itself"],
  [/Kilo now goes/g, "TakeDeep now goes"],
  [/the Kilo Blog/g, "the TakeDeep blog"],
  [/Run Kilo from/g, "Run TakeDeep from"],
  [/Sign in with OAuth at kilo\.ai/g, "Sign in with OAuth at deeper-dash.takedeep.ai"],
  [/Sign in at kilo\.ai/g, "Sign in at deeper-dash.takedeep.ai"],
  [/The Kilo API at/g, "The TakeDeep API at"],
  [/\[kilo\.ai\]/g, "[deeper-api.takedeep.ai]"],
  [/\bkilo\.ai\b/g, "deeper-api.takedeep.ai"],
]

const skip = new Set(["node_modules", ".next", "dist"])

function walk(dir: string, files: string[] = []) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) walk(path, files)
    else if (/\.(md|mdx|tsx?|json|sample|txt|svg)$/.test(name)) files.push(path)
  }
  return files
}

let count = 0
for (const path of walk(root)) {
  const before = readFileSync(path, "utf8")
  let text = before
  for (const [pattern, repl] of rules) text = text.replace(pattern, repl)
  if (text !== before) {
    writeFileSync(path, text)
    count++
    console.log(`rebranded ${path.slice(root.length + 1)}`)
  }
}
console.log(`done — ${count} files updated`)
