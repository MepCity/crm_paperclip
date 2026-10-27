"use client";

import { english, type MessageKey } from "./catalogs";
import { useUiTranslations } from "./client-provider";

const keys = new Map(Object.entries(english.records.utilities).map(([key, value]) => [value, key]));

/** Translate only application-owned utility labels; never pass record values here. */
export function useUtilityLabel() {
  const t = useUiTranslations();
  return (label: string) => {
    const key = keys.get(label);
    return key ? t(`records.utilities.${key}` as MessageKey) : label;
  };
}
