"use client";

import type { FormatOptions } from "@crm/core/format";
import { createContext, type ReactNode, useContext, useMemo } from "react";
import { useUiLanguage } from "@/i18n/client-provider";
import { DEFAULT_FORMAT } from "./locale";

const FormatContext = createContext<FormatOptions>(DEFAULT_FORMAT);

/** Supplies the organization's format options to every screen below it. */
export function FormatProvider({
  format,
  children,
}: {
  format: FormatOptions;
  children: ReactNode;
}) {
  return <FormatContext.Provider value={format}>{children}</FormatContext.Provider>;
}

/** The single source of number, money and date formatting in client components. */
export function useFormat(): FormatOptions {
  const format = useContext(FormatContext);
  const language = useUiLanguage();
  return useMemo(() => (language ? { ...format, language } : format), [format, language]);
}
