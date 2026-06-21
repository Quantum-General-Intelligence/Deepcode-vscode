import * as vscode from "vscode"
import { EXTENSION_DISPLAY_NAME } from "../../constants"

export class KiloCodeActionProvider implements vscode.CodeActionProvider {
  static readonly metadata: vscode.CodeActionProviderMetadata = {
    providedCodeActionKinds: [vscode.CodeActionKind.QuickFix, vscode.CodeActionKind.RefactorRewrite],
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    if (range.isEmpty) return []

    const actions: vscode.CodeAction[] = []
    const name = EXTENSION_DISPLAY_NAME

    const add = new vscode.CodeAction(`Add to ${name}`, vscode.CodeActionKind.RefactorRewrite)
    add.command = { command: "takedeep.addToContext", title: `Add to ${name}` }
    actions.push(add)

    const hasDiagnostics = context.diagnostics.length > 0

    if (hasDiagnostics) {
      const fix = new vscode.CodeAction(`Fix with ${name}`, vscode.CodeActionKind.QuickFix)
      fix.command = { command: "takedeep.fixCode", title: `Fix with ${name}` }
      fix.isPreferred = true
      actions.push(fix)
    }

    if (!hasDiagnostics) {
      const explain = new vscode.CodeAction(`Explain with ${name}`, vscode.CodeActionKind.RefactorRewrite)
      explain.command = { command: "takedeep.explainCode", title: `Explain with ${name}` }
      actions.push(explain)

      const improve = new vscode.CodeAction(`Improve with ${name}`, vscode.CodeActionKind.RefactorRewrite)
      improve.command = { command: "takedeep.improveCode", title: `Improve with ${name}` }
      actions.push(improve)
    }

    return actions
  }
}
