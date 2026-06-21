/** Hosted TakeDeep repo root on symboliq (deeper serve). */
const HOST_ROOT = "/opt/takedeep/Deepcode-vscode"

export function defaultDirectory() {
  const env = import.meta.env.VITE_DEFAULT_DIRECTORY
  if (env) return env
  if (typeof location !== "object") return
  if (location.hostname.endsWith("takedeep.ai")) return HOST_ROOT
}
