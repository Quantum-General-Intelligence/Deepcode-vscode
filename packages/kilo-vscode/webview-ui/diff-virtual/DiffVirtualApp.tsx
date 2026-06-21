import { createMemo, createSignal, onCleanup, Show } from "solid-js"
import type { Component } from "solid-js"
import { CodeComponentProvider } from "@takedeep/ui/context/code"
import { DiffComponentProvider } from "@takedeep/ui/context/diff"
import { FileComponentProvider } from "@takedeep/ui/context/file"
import { MarkedProvider } from "@takedeep/ui/context/marked"
import { Code } from "@takedeep/ui/code"
import { Diff } from "@takedeep/ui/diff"
import { File } from "@takedeep/ui/file"
import { FileIcon } from "@takedeep/ui/file-icon"
import { RadioGroup } from "@takedeep/ui/radio-group"
import { ThemeProvider } from "@takedeep/ui/theme"
import { normalize, text } from "@takedeep/ui/session-diff"
import { LanguageProvider, useLanguage } from "../src/context/language"
import { ServerProvider, useServer } from "../src/context/server"
import { VSCodeProvider } from "../src/context/vscode"

type DiffStyle = "unified" | "split"

interface DiffVirtualFile {
  file: string
  patch?: string
  before?: string
  after?: string
  additions: number
  deletions: number
}

const DiffVirtualContent: Component = () => {
  const { t } = useLanguage()
  const [diff, setDiff] = createSignal<DiffVirtualFile | null>(null)
  const [style, setStyle] = createSignal<DiffStyle>("unified")

  const handler = (event: MessageEvent) => {
    const msg = event.data as { type: string; diff?: DiffVirtualFile; initialDiffStyle?: DiffStyle }
    if (msg?.type === "diffVirtual.data" && msg.diff) {
      setDiff(msg.diff)
      setStyle(msg.initialDiffStyle ?? "unified")
    }
  }

  window.addEventListener("message", handler)
  onCleanup(() => window.removeEventListener("message", handler))

  const filename = () => {
    const f = diff()?.file ?? ""
    return f.includes("/") ? (f.split("/").pop() ?? f) : f
  }

  const directory = () => {
    const f = diff()?.file ?? ""
    if (!f.includes("/")) return null
    return f.split("/").slice(0, -1).join("/")
  }

  const resolved = createMemo(() => {
    const d = diff()
    if (!d) return { before: "", after: "" }
    if (d.before !== undefined || d.after !== undefined) return { before: d.before ?? "", after: d.after ?? "" }
    if (d.patch) {
      const view = normalize(d as { file: string; patch: string; additions: number; deletions: number })
      return { before: text(view, "deletions"), after: text(view, "additions") }
    }
    return { before: "", after: "" }
  })

  return (
    <div class="am-review-layout">
      <Show when={diff()}>
        {(d) => (
          <>
            <div class="am-review-toolbar">
              <div class="am-review-toolbar-left">
                <RadioGroup
                  options={["unified", "split"] as const}
                  current={style()}
                  size="small"
                  value={(s) => s}
                  label={(s) =>
                    s === "unified" ? t("ui.sessionReview.diffStyle.unified") : t("ui.sessionReview.diffStyle.split")
                  }
                  onSelect={(s) => {
                    if (s) setStyle(s)
                  }}
                />
                <span class="am-review-toolbar-stats">
                  <FileIcon node={{ path: d().file, type: "file" }} />
                  <Show when={directory()}>
                    <span class="am-review-toolbar-dir">{`\u2066${directory()}/\u2069`}</span>
                  </Show>
                  <span class="am-review-toolbar-fname">{filename()}</span>
                  <span class="am-review-toolbar-adds">+{d().additions}</span>
                  <span class="am-review-toolbar-dels">-{d().deletions}</span>
                </span>
              </div>
            </div>
            <div class="am-review-diff" style={{ width: "100%" }}>
              <Diff
                before={{ name: d().file, contents: resolved().before }}
                after={{ name: d().file, contents: resolved().after }}
                diffStyle={style()}
              />
            </div>
          </>
        )}
      </Show>
    </div>
  )
}

const DiffVirtualShell: Component = () => {
  const server = useServer()

  return (
    <LanguageProvider vscodeLanguage={server.vscodeLanguage} languageOverride={server.languageOverride}>
      <DiffComponentProvider component={Diff}>
        <CodeComponentProvider component={Code}>
          <FileComponentProvider component={File}>
            <MarkedProvider>
              <DiffVirtualContent />
            </MarkedProvider>
          </FileComponentProvider>
        </CodeComponentProvider>
      </DiffComponentProvider>
    </LanguageProvider>
  )
}

export const DiffVirtualApp: Component = () => {
  return (
    <ThemeProvider defaultTheme="kilo-vscode">
      <VSCodeProvider>
        <ServerProvider>
          <DiffVirtualShell />
        </ServerProvider>
      </VSCodeProvider>
    </ThemeProvider>
  )
}
