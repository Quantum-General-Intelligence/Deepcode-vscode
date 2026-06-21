import { Component, JSX } from "solid-js"
import { Dialog } from "@takedeep/ui/dialog"
import { Button } from "@takedeep/ui/button"
import { Icon } from "@takedeep/ui/icon"
import { useDialog } from "@takedeep/ui/context/dialog"
import { useVSCode } from "../../context/vscode"
import { useLanguage } from "../../context/language"

import { BRAND } from "../../brand"

const SUPPORT_URL = BRAND.supportUrl

const KiloLogo = (): JSX.Element => {
  const iconsBaseUri = (window as { ICONS_BASE_URI?: string }).ICONS_BASE_URI || ""

  return (
    <div class="feedback-dialog-logo">
      <img src={`${iconsBaseUri}/${BRAND.logoIcon}`} alt={BRAND.name} />
    </div>
  )
}

export const FeedbackDialog: Component = () => {
  const language = useLanguage()
  const dialog = useDialog()
  const vscode = useVSCode()

  const open = (url: string) => {
    vscode.postMessage({ type: "openExternal", url })
    dialog.close()
  }

  return (
    <Dialog title="" fit>
      <div class="feedback-dialog">
        <KiloLogo />
        <p class="feedback-dialog-message">{language.t("feedback.dialog.message")}</p>
        <div class="feedback-dialog-actions">
          <Button variant="primary" size="large" data-full-width="true" onClick={() => open(BRAND.docsUrl)}>
            <Icon name="help" size="small" />
            {language.t("feedback.dialog.support")}
          </Button>
          <Button variant="secondary" size="large" data-full-width="true" onClick={() => open(SUPPORT_URL)}>
            <Icon name="help" size="small" />
            {BRAND.supportUrl.replace("https://", "")}
          </Button>
        </div>
        <Button variant="ghost" size="small" onClick={() => dialog.close()}>
          {language.t("common.cancel")}
        </Button>
      </div>
    </Dialog>
  )
}
