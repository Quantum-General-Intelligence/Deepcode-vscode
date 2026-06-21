/**
 * TakeDeep product branding — single source of truth for fork-specific names and URLs.
 */

export const BRAND = {
  name: "TakeDeep",
  cli: "deeper",
  configDir: ".takedeep",
  legacyConfigDirs: [".kilo", ".kilocode"] as const,
  apiUrl: "https://deeper-api.takedeep.ai",
  appUrl: "https://deeper-dash.takedeep.ai",
  webUrl: "https://deeper.takedeep.ai",
  docsUrl: "https://deeper-api.takedeep.ai",
  extensionPublisher: "takedeep",
  extensionName: "takedeep",
  extensionId: "takedeep.takedeep",
  userAgent: "TakeDeep",
  providerId: "kilo",
  providerLabel: "TakeDeep",
} as const

export const ENV_API_URL = "TAKEDEEP_API_URL"
export const ENV_LEGACY_API_URL = "KILO_API_URL"

export function apiBase() {
  return process.env[ENV_API_URL] || process.env[ENV_LEGACY_API_URL] || BRAND.apiUrl
}
