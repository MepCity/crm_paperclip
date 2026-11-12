"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePortal } from "@/modules/external-portal/portal-context";
import type { PortalModule } from "@/modules/external-portal/types";

const MODULE_DESCRIPTIONS: Record<PortalModule, string> = {
  Contacts: "View and manage contact details associated with your account.",
  Accounts: "View company and organization account information.",
  Deals: "Track active deals, pipeline stages, and sales opportunities.",
  Cases: "Submit and track customer support tickets and inquiries.",
  Quotes: "Review sales quotes, pricing proposals, and terms.",
  Invoices: "Inspect invoices, payment statuses, and billing records.",
};

const MODULE_ICONS: Record<PortalModule, string> = {
  Contacts: "👤",
  Accounts: "🏢",
  Deals: "💼",
  Cases: "🎫",
  Quotes: "📝",
  Invoices: "💳",
};

export default function PortalHomePage() {
  const { slug, session, loading } = usePortal();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push(`/portal/${encodeURIComponent(slug)}/login`);
    }
  }, [loading, session, router, slug]);

  if (loading || !session) {
    return (
      <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
        Loading portal...
      </div>
    );
  }

  const modulesConfig = session.userType?.modules;
  const enabledModules = (Object.keys(MODULE_DESCRIPTIONS) as PortalModule[]).filter(
    (mod) => modulesConfig?.[mod]?.enabled,
  );

  const canCreateCase = Boolean(
    modulesConfig?.Cases?.enabled && modulesConfig.Cases.actions.create,
  );

  return (
    <div className="space-y-8" data-testid="portal-home">
      {/* Welcome Hero */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              Welcome back, {session.user.name}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              You are signed in to {session.portal?.name || "Customer Portal"}. Access your records
              and requests below.
            </p>
          </div>
          {canCreateCase && (
            <Link
              href={`/portal/${encodeURIComponent(slug)}/Cases/new`}
              className="inline-flex items-center justify-center rounded bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-hover)]"
              data-testid="portal-home-new-case"
            >
              + Submit New Case
            </Link>
          )}
        </div>
      </div>

      {/* Enabled Modules Grid */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-[var(--color-text)]">Available Modules</h2>
        {enabledModules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
            No modules are currently available for your account.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enabledModules.map((mod) => (
              <div
                key={mod}
                className="flex flex-col justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs transition hover:border-[var(--color-primary)]"
                data-testid={`portal-module-card-${mod}`}
              >
                <div>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-bg-muted)] text-lg">
                      {MODULE_ICONS[mod]}
                    </span>
                    <h3 className="text-base font-semibold text-[var(--color-text)]">{mod}</h3>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                    {MODULE_DESCRIPTIONS[mod]}
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                  <Link
                    href={`/portal/${encodeURIComponent(slug)}/${encodeURIComponent(mod)}`}
                    className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                  >
                    View Records &rarr;
                  </Link>
                  {mod === "Cases" && canCreateCase && (
                    <Link
                      href={`/portal/${encodeURIComponent(slug)}/Cases/new`}
                      className="text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      + New
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Profile Summary */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Identity Profile
            </div>
            <div className="text-sm font-medium text-[var(--color-text)]">
              {session.user.name} &bull; {session.user.email}
            </div>
          </div>
          {modulesConfig?.Contacts?.enabled && session.user.recordId && (
            <Link
              href={`/portal/${encodeURIComponent(slug)}/Contacts/${encodeURIComponent(session.user.recordId)}`}
              className="inline-flex items-center text-xs font-medium text-[var(--color-primary)] hover:underline"
              data-testid="portal-view-my-profile"
            >
              View / Edit Contact Profile &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
