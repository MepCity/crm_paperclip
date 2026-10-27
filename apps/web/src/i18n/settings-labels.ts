"use client";

import { english, type MessageKey } from "./catalogs";
import { useUiTranslations } from "./client-provider";

const keys = new Map(Object.entries(english.settings.labels).map(([key, value]) => [value, key]));

/** Application-owned settings vocabulary only; call sites preserve customized labels and values. */
export function useSettingsLabel() {
  const t = useUiTranslations();
  return (label: string) => {
    const key = keys.get(label);
    return key ? t(`settings.labels.${key}` as MessageKey) : label;
  };
}
