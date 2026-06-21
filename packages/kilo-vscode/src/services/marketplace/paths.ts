import * as path from "path"
import * as os from "os"
import { CLI_NAME, CONFIG_DIR } from "../../constants"

/**
 * Global config dir: ~/.config/deeper/ (XDG_CONFIG_HOME/deeper)
 * This matches where the CLI reads global config from.
 */
function globalConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config")
  return path.join(xdg, CLI_NAME)
}

export class MarketplacePaths {
  /** Project-scope config file: <workspace>/.takedeep/kilo.json */
  configPath(scope: "project" | "global", workspace?: string): string {
    if (scope === "project") return path.join(workspace!, CONFIG_DIR, "kilo.json")
    return path.join(globalConfigDir(), "kilo.json")
  }

  /** Skill install directory (where the marketplace installer writes to). */
  skillsDir(scope: "project" | "global", workspace?: string): string {
    if (scope === "project") return path.join(workspace!, CONFIG_DIR, "skills")
    return path.join(os.homedir(), CONFIG_DIR, "skills")
  }
}
