"use client";

import { createContext, type ReactNode, useContext } from "react";

/** Viewer's `features.feeds` permissions (ADR 0017/0018); everything allowed by default. */
export interface FeedsAccess {
  view: boolean;
  post: boolean;
}

const FeedsAccessContext = createContext<FeedsAccess>({ view: true, post: true });

export function FeedsAccessProvider({
  value,
  children,
}: {
  value: FeedsAccess;
  children: ReactNode;
}) {
  return <FeedsAccessContext.Provider value={value}>{children}</FeedsAccessContext.Provider>;
}

export function useFeedsAccess(): FeedsAccess {
  return useContext(FeedsAccessContext);
}
