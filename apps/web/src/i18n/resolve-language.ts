export type UiLanguage = "en" | "tr";

export function supportedLanguage(value: unknown): UiLanguage | undefined {
  return value === "en" || value === "tr" ? value : undefined;
}

/** Organization defaults are reserved and deliberately disabled until specified. */
export function resolveLanguage(savedPreference: unknown): UiLanguage {
  return supportedLanguage(savedPreference) ?? "en";
}
