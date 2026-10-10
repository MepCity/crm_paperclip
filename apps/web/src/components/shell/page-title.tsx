"use client";

import { createContext, useContext, useLayoutEffect } from "react";
import { APP_NAME } from "@/app-info";

export const PageTitleContext = createContext<((title: string) => void) | null>(null);

/** Declare once per page, including error and loading fallbacks. */
export function PageTitle({ title }: { title: string }) {
  const setTitle = useContext(PageTitleContext);
  if (!setTitle) throw new Error("PageTitle must be rendered inside AppShell.");
  useLayoutEffect(() => {
    setTitle(title);
    document.title = `${title} | ${APP_NAME}`;
  }, [title, setTitle]);
  return null;
}
