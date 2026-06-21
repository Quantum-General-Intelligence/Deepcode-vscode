import * as path from "path"
import os from "os"
import { Filesystem } from "../util"
import { BRAND } from "@/takedeep/brand"

export namespace KilocodePaths {
  const home = () => process.env.HOME || process.env.USERPROFILE || os.homedir()

  const extensionStorage = `${BRAND.extensionPublisher}.${BRAND.extensionName}`

  /**
   * Get the platform-specific VSCode global storage path for the TakeDeep extension.
   */
  export function vscodeGlobalStorage(): string {
    const home = os.homedir()
    switch (process.platform) {
      case "darwin":
        return path.join(home, "Library", "Application Support", "Code", "User", "globalStorage", extensionStorage)
      case "win32":
        return path.join(
          process.env.APPDATA || path.join(home, "AppData", "Roaming"),
          "Code",
          "User",
          "globalStorage",
          extensionStorage,
        )
      default:
        return path.join(home, ".config", "Code", "User", "globalStorage", extensionStorage)
    }
  }

  /** Global config directories: legacy paths first, then .takedeep */
  export function globalDirs(): string[] {
    return [...BRAND.legacyConfigDirs.map((name) => path.join(home(), name)), path.join(home(), BRAND.configDir)]
  }

  /**
   * Discover Kilo directories containing skills.
   * Returns parent directories (.kilocode/ and .kilo/) for glob pattern "skills/[*]/SKILL.md".
   *
   * - Walks up from projectDir to worktreeRoot for .kilocode/ and .kilo/
   * - Includes global ~/.kilocode/ and ~/.kilo/
   * - Includes VSCode extension global storage
   *
   * Does NOT copy/migrate skills - just provides paths for discovery.
   * Skills remain in their original locations and can be managed independently
   * by the Kilo VSCode extension.
   */
  export async function skillDirectories(opts: {
    projectDir: string
    worktreeRoot: string
    skipGlobalPaths?: boolean
  }): Promise<string[]> {
    const directories: string[] = []

    if (!opts.skipGlobalPaths) {
      // 1. Global ~/.kilocode/ and ~/.kilo/ (loaded first so project-level overrides)
      for (const global of globalDirs()) {
        const globalSkills = path.join(global, "skills")
        if (!(await Filesystem.isDir(globalSkills))) continue
        directories.push(global) // Return parent, not skills/
      }

      // 2. VSCode extension global storage (marketplace-installed skills)
      const vscode = vscodeGlobalStorage()
      const vscodeSkills = path.join(vscode, "skills")
      if (await Filesystem.isDir(vscodeSkills)) {
        directories.push(vscode) // Return parent, not skills/
      }
    }

    // 3. Walk up from project dir to worktree root for config directories
    const projectTargets = [...BRAND.legacyConfigDirs, BRAND.configDir] as const
    for (const target of projectTargets) {
      const projectDirs = await Array.fromAsync(
        Filesystem.up({
          targets: [target],
          start: opts.projectDir,
          stop: opts.worktreeRoot,
        }),
      )
      for (const dir of projectDirs) {
        const skillsDir = path.join(dir, "skills")
        if ((await Filesystem.isDir(skillsDir)) && !directories.includes(dir)) {
          directories.push(dir)
        }
      }
    }

    return directories
  }
}
