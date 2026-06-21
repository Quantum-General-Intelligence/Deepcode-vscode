// English runtime translations for autocomplete (takedeep:autocomplete.* namespace)

export const dict = {
  "takedeep:autocomplete.statusBar.enabled": "$(zap) Autocomplete",
  "takedeep:autocomplete.statusBar.snoozed": "snoozed",
  "takedeep:autocomplete.statusBar.warning": "$(warning) Autocomplete",
  "takedeep:autocomplete.statusBar.tooltip.basic": "TakeDeep Autocomplete",
  "takedeep:autocomplete.statusBar.tooltip.disabled": "TakeDeep Autocomplete (disabled)",
  "takedeep:autocomplete.statusBar.tooltip.noUsableProvider":
    "**No autocomplete model configured**\n\nTo enable autocomplete, add a profile with one of these supported providers: {{providers}}.\n\n[Open Settings]({{command}})",
  "takedeep:autocomplete.statusBar.tooltip.sessionTotal": "Session total cost:",
  "takedeep:autocomplete.statusBar.tooltip.provider": "Provider:",
  "takedeep:autocomplete.statusBar.tooltip.model": "Model:",
  "takedeep:autocomplete.statusBar.tooltip.profile": "Profile: ",
  "takedeep:autocomplete.statusBar.tooltip.defaultProfile": "Default",
  "takedeep:autocomplete.statusBar.tooltip.completionSummary":
    "Performed {{count}} completions between {{startTime}} and {{endTime}}, for a total cost of {{cost}}.",
  "takedeep:autocomplete.statusBar.tooltip.providerInfo": "Autocompletions provided by {{model}} via {{provider}}.",
  "takedeep:autocomplete.statusBar.cost.zero": "$0.00",
  "takedeep:autocomplete.statusBar.cost.lessThanCent": "<$0.01",
  "takedeep:autocomplete.toggleMessage": "TakeDeep Autocomplete {{status}}",
  "takedeep:autocomplete.progress.title": "TakeDeep",
  "takedeep:autocomplete.progress.analyzing": "Analyzing your code...",
  "takedeep:autocomplete.progress.generating": "Generating suggested edits...",
  "takedeep:autocomplete.progress.processing": "Processing suggested edits...",
  "takedeep:autocomplete.progress.showing": "Displaying suggested edits...",
  "takedeep:autocomplete.input.title": "TakeDeep: Quick Task",
  "takedeep:autocomplete.input.placeholder": "e.g., 'refactor this function to be more efficient'",
  "takedeep:autocomplete.commands.generateSuggestions": "TakeDeep: Generate Suggested Edits",
  "takedeep:autocomplete.commands.displaySuggestions": "Display Suggested Edits",
  "takedeep:autocomplete.commands.cancelSuggestions": "Cancel Suggested Edits",
  "takedeep:autocomplete.commands.applyCurrentSuggestion": "Apply Current Suggested Edit",
  "takedeep:autocomplete.commands.applyAllSuggestions": "Apply All Suggested Edits",
  "takedeep:autocomplete.commands.category": "TakeDeep",
  "takedeep:autocomplete.codeAction.title": "TakeDeep: Suggested Edits",
  "takedeep:autocomplete.chatParticipant.fullName": "TakeDeep Agent",
  "takedeep:autocomplete.chatParticipant.name": "Agent",
  "takedeep:autocomplete.chatParticipant.description": "I can help you with quick tasks and suggested edits.",
  "takedeep:autocomplete.incompatibilityExtensionPopup.message":
    "TakeDeep Autocomplete is being blocked by a conflict with GitHub Copilot. To fix this, you must disable Copilot's inline suggestions.",
  "takedeep:autocomplete.incompatibilityExtensionPopup.disableCopilot": "Disable Copilot",
  "takedeep:autocomplete.incompatibilityExtensionPopup.disableInlineAssist": "Disable Autocomplete",
  "takedeep:autocomplete.creditsExhausted.message":
    "TakeDeep Autocomplete has been paused because your account has no remaining credits. Add credits to resume autocomplete.",
  "takedeep:autocomplete.creditsExhausted.addCredits": "Add Credits",
  "takedeep:autocomplete.authError.message":
    "TakeDeep Autocomplete has been paused due to an authentication error. Please sign in again.",
}
