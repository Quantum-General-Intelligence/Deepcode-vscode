import { InstallationVersion } from "@/installation/version"
import { BRAND } from "@/takedeep/brand"

export const DEFAULT_HEADERS = {
  "HTTP-Referer": BRAND.docsUrl,
  "X-Title": BRAND.name,
  "User-Agent": `${BRAND.userAgent}/${InstallationVersion}`,
}
