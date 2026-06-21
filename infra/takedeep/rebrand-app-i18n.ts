/** Rebrand packages/app i18n strings from Kilo/OpenCode to TakeDeep. */
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const dir = resolve(import.meta.dir, "../../packages/app/src/i18n")

const rules: Array<[RegExp, string]> = [
  [/\bKilo\b/g, "TakeDeep"],
  [/OpenCode Zen/g, "TakeDeep Gateway"],
  [/opencode\.ai\/zen/g, "deeper-dash.takedeep.ai"],
  [/\bopencode\.json\b/g, "kilo.jsonc"],
  [/dialog\.provider\.opencode\.note": "([^"]*)"/g, 'dialog.provider.opencode.note": "Models via TakeDeep Gateway and LiteLLM"'],
  [/dialog\.provider\.opencode\.tagline": "[^"]*"/g, 'dialog.provider.opencode.tagline": "TakeDeep managed models"'],
]

for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))) {
  const path = resolve(dir, file)
  let text = readFileSync(path, "utf8")
  for (const [pattern, repl] of rules) text = text.replace(pattern, repl)
  writeFileSync(path, text)
  console.log(`rebranded ${file}`)
}
