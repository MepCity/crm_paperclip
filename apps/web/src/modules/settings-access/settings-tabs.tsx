"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Link } from "@/components/ui/link";

type TabSet = "users" | "roles";

type TabDef = { id: string; label: string; path: string; adminOnly?: boolean };

const TABS: Record<TabSet, { label: string; tabs: TabDef[] }> = {
  users: {
    label: "Users and groups",
    tabs: [
      { id: "users", label: "Users", path: "users" },
      { id: "groups", label: "Groups", path: "groups", adminOnly: true },
      { id: "activate-users", label: "Activate Users", path: "activate-users", adminOnly: true },
    ],
  },
  roles: {
    label: "Roles and sharing",
    tabs: [
      { id: "roles", label: "Roles", path: "roles" },
      { id: "data-sharing", label: "Data Sharing Settings", path: "data-sharing" },
    ],
  },
};

/** Paths each tab set covers; the settings menu marks its entry active on any of them. */
export function settingsTabPaths(set: TabSet, orgSlug: string): string[] {
  return TABS[set].tabs.map((tab) => `/crm/${orgSlug}/settings/${tab.path}`);
}

/**
 * The page-level tab strip of the reference's Users and Roles pages: each tab is its own route
 * (Users / Groups / Activate Users; Roles / Data Sharing Settings), so the strip is links.
 */
export function SettingsTabs({
  set,
  orgSlug,
  canManage = true,
}: {
  set: TabSet;
  orgSlug: string;
  canManage?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const { label, tabs } = TABS[set];
  return (
    <nav aria-label={label} className="flex gap-2 border-b border-border px-2" data-settings-tabs>
      {tabs
        .filter((tab) => canManage || !tab.adminOnly)
        .map((tab) => {
          const href = `/crm/${orgSlug}/settings/${tab.path}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={tab.id}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`-mb-px border-b-2 px-4 py-3 text-md no-underline ${
                active
                  ? "border-primary font-semibold text-text"
                  : "border-transparent text-text-muted data-hovered:text-text"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
    </nav>
  );
}

/** Card with the tab strip on top, as the reference frames the Users and Roles pages. */
export function TabbedSettingsPage({
  set,
  orgSlug,
  children,
}: {
  set: TabSet;
  orgSlug: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-lg border border-border bg-surface">
      <SettingsTabs set={set} orgSlug={orgSlug} />
      <div className="p-6">{children}</div>
    </section>
  );
}
