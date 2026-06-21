import { afterEach, describe, expect, it } from "bun:test"
import { getShellEnvironment, execWithShellEnv, clearShellEnvCache } from "../../src/agent-manager/shell-env"

const win = process.platform === "win32"

afterEach(() => {
  clearShellEnvCache()
})

describe("getShellEnvironment", () => {
  it("returns an object with PATH", async () => {
    const env = await getShellEnvironment()
    expect(env).toBeDefined()
    expect(typeof env.PATH).toBe("string")
    expect(env.PATH!.length).toBeGreaterThan(0)
  })

  it("returns HOME", async () => {
    const env = await getShellEnvironment()
    const home = env.HOME || env.USERPROFILE
    expect(typeof home).toBe("string")
  })

  it("caches results across calls", async () => {
    const first = await getShellEnvironment()
    const second = await getShellEnvironment()
    expect(first.PATH).toBe(second.PATH)
  })

  it("returns a copy (mutations don't corrupt cache)", async () => {
    const first = await getShellEnvironment()
    first.PATH = "/mutated"
    const second = await getShellEnvironment()
    expect(second.PATH).not.toBe("/mutated")
  })

  it("handles multiline env values without corrupting PATH", async () => {
    const env = await getShellEnvironment()
    expect(env.PATH).toBeDefined()
    expect(env.PATH).not.toContain("\n")
  })
})

describe("execWithShellEnv", () => {
  it("executes a simple command", async () => {
    const { stdout } = win
      ? await execWithShellEnv("cmd", ["/c", "echo", "hello"])
      : await execWithShellEnv("echo", ["hello"])
    expect(stdout.trim()).toBe("hello")
  })

  it.skipIf(win)("passes cwd option through", async () => {
    const { stdout } = await execWithShellEnv("pwd", [], { cwd: "/tmp" })
    expect(stdout.trim()).toMatch(/\/tmp$/)
  })

  it("throws on non-ENOENT errors", async () => {
    const cmd = win ? "cmd" : "ls"
    const args = win ? ["/c", "dir", "--nonexistent-flag-that-fails"] : ["--nonexistent-flag-that-fails"]
    await expect(execWithShellEnv(cmd, args)).rejects.toThrow()
  })

  it("concurrent calls don't reject prematurely", async () => {
    const [a, b] = win
      ? await Promise.all([
          execWithShellEnv("cmd", ["/c", "echo", "first"]),
          execWithShellEnv("cmd", ["/c", "echo", "second"]),
        ])
      : await Promise.all([execWithShellEnv("echo", ["first"]), execWithShellEnv("echo", ["second"])])
    expect(a.stdout.trim()).toBe("first")
    expect(b.stdout.trim()).toBe("second")
  })
})

describe("clearShellEnvCache", () => {
  it("forces fresh resolution on next call", async () => {
    const first = await getShellEnvironment()
    clearShellEnvCache()
    const second = await getShellEnvironment()
    expect(first.PATH).toBeDefined()
    expect(second.PATH).toBeDefined()
  })
})
