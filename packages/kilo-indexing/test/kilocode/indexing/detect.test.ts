import { describe, expect, test } from "bun:test"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { hasIndexingPlugin, isIndexingPlugin, normalizePluginName } from "../../../src/detect"

describe("indexing plugin detection", () => {
  test("bundles detect module for browser targets", async () => {
    const dir = await mkdtemp(`${tmpdir()}/kilo-indexing-detect-`)
    const result = await Bun.build({
      entrypoints: [new URL("../../../src/detect.ts", import.meta.url).pathname],
      minify: true,
      outdir: dir,
      target: "browser",
    })

    expect(result.success).toBe(true)
  })

  test("normalizes supported plugin forms", () => {
    expect(normalizePluginName("kilo-indexing")).toBe("kilo-indexing")
    expect(normalizePluginName("kilo-indexing@1.2.3")).toBe("kilo-indexing")
    expect(normalizePluginName("@takedeep/indexing")).toBe("@takedeep/indexing")
    expect(normalizePluginName("@takedeep/indexing@1.2.3")).toBe("@takedeep/indexing")
    expect(normalizePluginName("../../packages/kilo-indexing")).toBe("@takedeep/indexing")
    expect(normalizePluginName("file:///tmp/.opencode/plugin/kilo-indexing.js")).toBe("kilo-indexing")
    expect(normalizePluginName("file:///tmp/node_modules/@takedeep/indexing/index.js")).toBe(
      "@takedeep/indexing",
    )
    expect(normalizePluginName("file:///tmp/repo/packages/kilo-indexing/src/index.ts")).toBe("@takedeep/indexing")
  })

  test("detects supported indexing plugin specifiers", () => {
    const values = [
      "kilo-indexing",
      "kilo-indexing@1.2.3",
      "@takedeep/indexing",
      "@takedeep/indexing@1.2.3",
      "../../packages/kilo-indexing",
      "file:///tmp/.opencode/plugin/kilo-indexing.js",
      "file:///tmp/node_modules/@takedeep/indexing/index.js",
      "file:///tmp/repo/packages/kilo-indexing/src/index.ts",
    ]

    for (const value of values) {
      expect(isIndexingPlugin(value)).toBe(true)
    }
  })

  test("ignores unrelated plugin specifiers", () => {
    expect(isIndexingPlugin("@takedeep/gateway")).toBe(false)
    expect(isIndexingPlugin("file:///tmp/.opencode/plugin/index.js")).toBe(false)
    expect(hasIndexingPlugin(["@takedeep/gateway", "foo@1.0.0"])).toBe(false)
  })

  test("detects indexing plugin in merged plugin lists", () => {
    expect(
      hasIndexingPlugin(["@takedeep/gateway", "file:///tmp/node_modules/@takedeep/indexing/index.js"]),
    ).toBe(true)
  })
})
