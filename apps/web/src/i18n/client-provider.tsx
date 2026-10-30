"use client";

import { useRouter } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { createContext, type ReactNode, useContext, useEffect, useMemo } from "react";
import { UiProvider } from "@/components/ui/ui-provider";
import { catalog, type MessageKey, type MessageValues, SAFE_ERROR, translator } from "./catalogs";
import type { UiLanguage } from "./resolve-language";

const LanguageContext = createContext<UiLanguage>("en");

export function LanguageProvider({
  language,
  children,
}: {
  language: UiLanguage;
  children: ReactNode;
}) {
  const router = useRouter();
  useEffect(() => {
    document.documentElement.lang = language;
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [language, router]);
  const messages = useMemo(() => catalog(language).messages, [language]);
  return (
    <LanguageContext.Provider value={language}>
      <NextIntlClientProvider
        locale={language}
        messages={messages}
        timeZone="UTC"
        onError={() => {}}
        getMessageFallback={() => SAFE_ERROR}
      >
        <UiProvider locale={language === "tr" ? "tr-TR" : "en-US"}>{children}</UiProvider>
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

export function useUiLanguage() {
  return useContext(LanguageContext);
}

/** Safe shared wrapper, including English ICU fallback under the English plural rules. */
export function useUiTranslations() {
  const language = useUiLanguage();
  const translate = useMemo(() => translator(language), [language]);
  return (key: MessageKey, values?: MessageValues) => translate(key, values);
}
