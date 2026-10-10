"use client";

import { createContext, useContext, useEffect, useLayoutEffect } from "react";
import { APP_NAME } from "@/app-info";

export const PageTitleContext = createContext<((title: string) => void) | null>(null);

/** Declare once per page, including error and loading fallbacks. */
export function PageTitle({ title }: { title: string }) {
  const setTitle = useContext(PageTitleContext);
  if (!setTitle) throw new Error("PageTitle must be rendered inside AppShell.");
  useLayoutEffect(() => {
    setTitle(title);
  }, [title, setTitle]);
  // Route metadata owns stable titles on navigations; this runs after the framework
  // applies segment metadata so loading and error fallbacks still win.
  useEffect(() => {
    document.title = `${title} | ${APP_NAME}`;
  }, [title]);
  return null;
}
