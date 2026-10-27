"use client";

import { createContext, useContext, useEffect, useLayoutEffect } from "react";
import { APP_NAME } from "@/app-info";
import { english, type MessageKey } from "@/i18n/catalogs";
import { useUiTranslations } from "@/i18n/client-provider";
import { useMetadataDisplayAdapter } from "@/i18n/metadata-adapter";

export const PageTitleContext = createContext<((title: string) => void) | null>(null);

/** Declare once per page, including error and loading fallbacks. */
export function PageTitle({ title }: { title: string }) {
  const t = useUiTranslations();
  const adapter = useMetadataDisplayAdapter();
  const module = Object.entries(english.metadata.modules).find(
    ([, labels]) => labels.plural === title,
  );
  const shellKey = Object.entries(english.shell).find(([, label]) => label === title)?.[0];
  const displayTitle = module
    ? adapter.getModulePlural(module[0], title)
    : shellKey
      ? t(`shell.${shellKey}` as MessageKey)
      : title;
  const setTitle = useContext(PageTitleContext);
  if (!setTitle) throw new Error("PageTitle must be rendered inside AppShell.");
  useLayoutEffect(() => {
    setTitle(displayTitle);
  }, [displayTitle, setTitle]);
  // Route metadata owns stable titles on navigations; this runs after the framework
  // applies segment metadata so loading and error fallbacks still win.
  useEffect(() => {
    document.title = `${displayTitle} | ${APP_NAME}`;
  }, [displayTitle]);
  return null;
}
