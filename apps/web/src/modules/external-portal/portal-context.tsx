"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getPortalMe, logoutPortal } from "./portal-client";
import type { PortalSessionInfo } from "./types";

interface PortalContextValue {
  slug: string;
  session: PortalSessionInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({
  slug,
  children,
  initialSession,
}: {
  slug: string;
  children: React.ReactNode;
  initialSession?: PortalSessionInfo | null;
}) {
  const [session, setSession] = useState<PortalSessionInfo | null>(initialSession ?? null);
  const [loading, setLoading] = useState<boolean>(!initialSession);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const data = await getPortalMe(slug);
      setSession(data);
    } catch {
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!initialSession) {
      void refresh();
    }
  }, [initialSession, refresh]);

  const logout = useCallback(async () => {
    try {
      await logoutPortal(slug);
    } catch {
      // ignore error on logout
    }
    setSession(null);
    router.push(`/portal/${encodeURIComponent(slug)}/login`);
  }, [slug, router]);

  return (
    <PortalContext.Provider value={{ slug, session, loading, refresh, logout }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error("usePortal must be used within a PortalProvider");
  }
  return ctx;
}
