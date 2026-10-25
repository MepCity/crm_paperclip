import { getRequestConfig } from "next-intl/server";
import { cache } from "react";
import { getSession } from "@/lib/session";
import { readSavedLanguage } from "@/server/personal-settings/language";
import { catalog, SAFE_ERROR, translator } from "./catalogs";
import { resolveLanguage } from "./resolve-language";

export const requestLanguage = cache(async () => {
  const session = await getSession();
  if (!session) return "en" as const;
  try {
    return resolveLanguage(await readSavedLanguage(session.user.id));
  } catch {
    return "en" as const;
  }
});

export async function getUiTranslations() {
  return translator(await requestLanguage());
}

export default getRequestConfig(async () => {
  const locale = await requestLanguage();
  return {
    locale,
    messages: catalog(locale).messages,
    timeZone: "UTC",
    onError: () => {},
    getMessageFallback: () => SAFE_ERROR,
  };
});
