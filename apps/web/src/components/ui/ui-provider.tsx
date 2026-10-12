"use client";

import type { ReactNode } from "react";
import { I18nProvider } from "react-aria-components";
import { DEFAULT_LOCALE } from "@/lib/locale";

export interface UiProviderProps {
  children: ReactNode;
  /** Locale every React Aria primitive below formats with. */
  locale?: string;
}

/**
 * The single source of the locale React Aria formats with, mounted once in the root layout.
 * Without it the primitives fall back to the browser locale, which is not the app locale
 * (ADR 0003, "Language and formatting").
 */
export function UiProvider({ children, locale = DEFAULT_LOCALE }: UiProviderProps) {
  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}
