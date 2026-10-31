import { createTranslator } from "next-intl";
import chatEn from "../../messages/en/chat.json";
import commonEn from "../../messages/en/common.json";
import metadataEn from "../../messages/en/metadata.json";
import modulesEn from "../../messages/en/modules.json";
import recordsEn from "../../messages/en/records.json";
import settingsEn from "../../messages/en/settings.json";
import shellEn from "../../messages/en/shell.json";
import chatTr from "../../messages/tr/chat.json";
import commonTr from "../../messages/tr/common.json";
import metadataTr from "../../messages/tr/metadata.json";
import modulesTr from "../../messages/tr/modules.json";
import recordsTr from "../../messages/tr/records.json";
import settingsTr from "../../messages/tr/settings.json";
import shellTr from "../../messages/tr/shell.json";
import type { UiLanguage } from "./resolve-language";

export const english = {
  common: commonEn,
  shell: shellEn,
  settings: settingsEn,
  metadata: metadataEn,
  records: recordsEn,
  modules: modulesEn,
  chat: chatEn,
};
export const turkish = {
  common: commonTr,
  shell: shellTr,
  settings: settingsTr,
  metadata: metadataTr,
  records: recordsTr,
  modules: modulesTr,
  chat: chatTr,
};
export type Messages = typeof english;
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`;
}[keyof T & string];
export type MessageKey = Paths<Messages>;
export type MessageValues = Record<string, string | number | Date>;
export const SAFE_ERROR = english.common.error;

type Tree = { [key: string]: string | Tree };

/** Keep provenance: an English fallback must use English plural rules. */
export function mergeCatalog(base: Tree, selected: Tree, prefix = "") {
  const messages: Tree = {};
  const fallbacks = new Set<string>();
  for (const [key, value] of Object.entries(base)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const leaf = selected[key];
    if (typeof value === "string") {
      if (typeof leaf === "string" && leaf.trim()) messages[key] = leaf;
      else {
        messages[key] = value;
        fallbacks.add(path);
      }
    } else {
      const nested = mergeCatalog(value, typeof leaf === "object" ? leaf : {}, path);
      messages[key] = nested.messages;
      for (const item of nested.fallbacks) fallbacks.add(item);
    }
  }
  return { messages, fallbacks };
}

export function catalog(language: UiLanguage) {
  return mergeCatalog(english, language === "tr" ? turkish : english);
}

export function translator(
  language: UiLanguage,
  selected: Tree = language === "tr" ? turkish : english,
) {
  const merged = mergeCatalog(english, selected);
  const options = {
    timeZone: "UTC",
    onError: () => {
      throw new Error("InvalidMessage");
    },
  };
  const en = createTranslator({ ...options, locale: "en", messages: english });
  const active = createTranslator({
    ...options,
    locale: language,
    messages: merged.messages as Messages,
  });
  return (key: string, values?: MessageValues): string => {
    try {
      if (!merged.fallbacks.has(key)) return active(key as MessageKey, values);
    } catch {
      /* Retry the original English ICU message, without logging parameters. */
    }
    try {
      return en(key as MessageKey, values);
    } catch {
      return SAFE_ERROR;
    }
  };
}
