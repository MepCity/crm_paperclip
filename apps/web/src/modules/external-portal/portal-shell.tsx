"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { usePortal } from "./portal-context";
import type { PortalModule } from "./types";

const MODULE_DISPLAY_NAMES: Record<PortalModule, string> = {
  Contacts: "Contacts",
  Accounts: "Accounts",
  Deals: "Deals",
  Cases: "Cases",
  Quotes: "Quotes",
  Invoices: "Invoices",
};

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { slug, session, loading, logout } = usePortal();
  const pathname = usePathname();

  const portalName = session?.portal?.name || "Customer Portal";
  const modulesConfig = session?.userType?.modules;
  const enabledModules = (Object.keys(MODULE_DISPLAY_NAMES) as PortalModule[]).filter(
    (mod) => modulesConfig?.[mod]?.enabled,
  );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Top Navbar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href={`/portal/${encodeURIComponent(slug)}`}
              className="flex items-center gap-2 text-base font-semibold text-[var(--color-text)] hover:opacity-85"
              data-testid="portal-brand-link"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded bg-[var(--color-primary)] text-xs font-bold text-white">
                P
              </span>
              <span>{portalName}</span>
            </Link>

            {/* Navigation Links */}
            {session && (
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href={`/portal/${encodeURIComponent(slug)}`}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                    pathname === `/portal/${slug}`
                      ? "bg-[var(--color-bg-muted)] text-[var(--color-text)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  Home
                </Link>
                {enabledModules.map((mod) => {
                  const href = `/portal/${encodeURIComponent(slug)}/${encodeURIComponent(mod)}`;
                  const isActive = pathname.startsWith(href);
                  return (
                    <Link
                      key={mod}
                      href={href}
                      className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-[var(--color-bg-muted)] text-[var(--color-text)]"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                      }`}
                      data-testid={`portal-nav-${mod}`}
                    >
                      {MODULE_DISPLAY_NAMES[mod]}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
              <span className="text-xs text-[var(--color-text-muted)]">Loading...</span>
            ) : session ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div
                    className="text-xs font-medium text-[var(--color-text)]"
                    data-testid="portal-user-name"
                  >
                    {session.user.name}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-muted)]">
                    {session.user.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text)]"
                  data-testid="portal-logout-button"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href={`/portal/${encodeURIComponent(slug)}/login`}
                className="rounded bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-primary-hover)]"
                data-testid="portal-login-nav-link"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</main>

      {/* Minimal Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-4 text-center text-xs text-[var(--color-text-muted)]">
        <div className="mx-auto max-w-7xl px-4">
          <span>Portal &bull; Secure Client Access</span>
        </div>
      </footer>
    </div>
  );
}
