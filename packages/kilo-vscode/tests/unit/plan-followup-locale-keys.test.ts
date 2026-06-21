import { describe, expect, test } from "bun:test"
import { dict as ar } from "@takedeep/i18n/ar"
import { dict as br } from "@takedeep/i18n/br"
import { dict as bs } from "@takedeep/i18n/bs"
import { dict as da } from "@takedeep/i18n/da"
import { dict as de } from "@takedeep/i18n/de"
import { dict as en } from "@takedeep/i18n/en"
import { dict as es } from "@takedeep/i18n/es"
import { dict as fr } from "@takedeep/i18n/fr"
import { dict as ja } from "@takedeep/i18n/ja"
import { dict as ko } from "@takedeep/i18n/ko"
import { dict as nl } from "@takedeep/i18n/nl"
import { dict as no } from "@takedeep/i18n/no"
import { dict as pl } from "@takedeep/i18n/pl"
import { dict as ru } from "@takedeep/i18n/ru"
import { dict as th } from "@takedeep/i18n/th"
import { dict as tr } from "@takedeep/i18n/tr"
import { dict as uk } from "@takedeep/i18n/uk"
import { dict as zh } from "@takedeep/i18n/zh"
import { dict as zht } from "@takedeep/i18n/zht"

const dicts: Record<string, Record<string, string>> = {
  ar,
  br,
  bs,
  da,
  de,
  en,
  es,
  fr,
  ja,
  ko,
  nl,
  no,
  pl,
  ru,
  th,
  tr,
  uk,
  zh,
  zht,
}

const keys = [
  "plan.followup.header",
  "plan.followup.question",
  "plan.followup.answer.newSession",
  "plan.followup.answer.newSession.description",
  "plan.followup.answer.continue",
  "plan.followup.answer.continue.description",
]

describe("plan follow-up i18n keys", () => {
  for (const locale of Object.keys(dicts)) {
    test(`${locale} defines every plan.followup.* key`, () => {
      const d = dicts[locale]!
      for (const key of keys) {
        const value = d[key]
        expect(value, `${locale} is missing ${key}`).toBeDefined()
        expect(value, `${locale} has empty value for ${key}`).toBeTruthy()
      }
    })
  }
})
