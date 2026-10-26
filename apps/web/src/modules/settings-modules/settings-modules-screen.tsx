"use client";

import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  Home,
  Info,
  LayoutGrid,
  type LucideIcon,
  Network,
  Phone,
  Search,
  Settings,
  Sparkles,
  User,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fixtureModuleListPort } from "./fixture-port";
import type { ModuleListPort, ModuleSummary } from "./port";

const tabs = ["Modules", "Web Tabs", "Global Sets", "Deal Management"];
const heads = [
  "Displayed In Tabs As",
  "Module Name",
  "Teamspace",
  "Shared To",
  "Last Modified",
  "Status",
];

const MODULE_ICONS: Record<string, LucideIcon> = {
  Home,
  Workqueue: CheckSquare,
  Leads: UserPlus,
  Contacts: Users,
  Accounts: Building2,
  Deals: Briefcase,
  Tasks: CheckSquare,
  Meetings: Calendar,
  Calls: Phone,
  Reports: BarChart3,
};

export function SettingsModulesScreen({
  port = fixtureModuleListPort,
  orgSlug,
}: {
  port?: ModuleListPort;
  orgSlug?: string;
}) {
  const [rows, setRows] = useState<ModuleSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let live = true;
    port
      .listModules()
      .then((r) => live && setRows(r))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [port]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        !q || r.displayLabel.toLowerCase().includes(q) || r.moduleName.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const message = error
    ? "Modules could not be loaded."
    : rows === null
      ? "Loading modules…"
      : shown.length === 0
        ? "No modules found"
        : null;

  return (
    <div className="rounded-lg border border-border bg-surface shadow-xs" data-settings-modules>
      <div role="tablist" className="flex gap-8 border-b border-border px-6">
        {tabs.map((t, i) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={i === 0}
            aria-disabled={i === 0 ? undefined : "true"}
            disabled={i !== 0}
            className={`py-4 text-md ${i === 0 ? "border-b-2 border-primary font-semibold text-text" : "text-text-muted"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="p-6">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search modules"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-72 rounded-md border border-border bg-surface py-2 pl-8 pr-3 text-sm focus:border-primary focus:outline-hidden"
            />
          </div>
          <span className="flex items-center gap-1.5 text-sm text-text-muted">
            <span aria-hidden="true" data-testid="legend-custom" className="relative size-4">
              <LayoutGrid className="size-4 text-text-muted" />
              <Settings className="absolute -bottom-1 -right-1 size-2 text-text-muted" />
            </span>
            Custom Module
          </span>
          <span className="flex items-center gap-1.5 text-sm text-text-muted">
            <Network aria-hidden="true" data-testid="legend-team" className="size-4 text-success" />
            Team Module
          </span>
          <div className="ml-auto flex items-center gap-4">
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-2 text-sm font-semibold text-text opacity-60"
            >
              <Sparkles className="size-4 text-accent-blue" aria-hidden="true" />
              Create module using assistant
            </button>
            <button
              type="button"
              disabled
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-text opacity-60"
            >
              Create New Module
            </button>
          </div>
        </div>
        <div className="max-h-[640px] overflow-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 border-b border-border bg-surface">
              <tr>
                {heads.map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-semibold text-text">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {message ? (
                <tr>
                  <td
                    colSpan={heads.length}
                    role={error ? "alert" : undefined}
                    className="px-4 py-8 text-center text-text-muted"
                  >
                    {message}
                  </td>
                </tr>
              ) : (
                shown.map((r) => (
                  <tr key={r.apiName} className="border-b border-border last:border-0">
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-2">
                        <ModuleIcon apiName={r.apiName} />
                        {orgSlug && r.apiName === "Leads" ? (
                          <Link
                            href={`/crm/${orgSlug}/settings/modules/Leads/fields`}
                            className="text-accent-blue"
                          >
                            {r.displayLabel}
                          </Link>
                        ) : (
                          r.displayLabel
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4">{r.moduleName}</td>
                    <td className="px-4 py-4 text-accent-blue">{r.teamspaceCount} Teamspaces</td>
                    <td className="px-4 py-4">{r.sharedTo}</td>
                    <td className="px-4 py-4">
                      {r.lastModifiedAt ? (
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            data-testid="modifier-avatar"
                            className="flex size-6 items-center justify-center rounded-full bg-border text-text-muted"
                          >
                            <User className="size-3.5" />
                          </span>
                          {r.lastModifiedAt}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={r.enabled}
                          aria-label={`${r.displayLabel} status`}
                          disabled
                          className={`relative inline-flex h-5 w-9 rounded-full opacity-60 ${r.enabled ? "bg-success" : "bg-border"}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`absolute top-0.5 size-4 rounded-full bg-surface ${r.enabled ? "right-0.5" : "left-0.5"}`}
                          />
                        </button>
                        {(r.apiName === "Leads" || r.apiName === "Contacts") && (
                          <Info
                            data-testid="status-info-icon"
                            className="size-3.5 text-text-muted"
                            aria-label={`${r.displayLabel} is a system module`}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ModuleIcon({ apiName }: { apiName: string }) {
  const Icon = MODULE_ICONS[apiName] ?? LayoutGrid;
  return (
    <span
      data-testid="module-icon"
      aria-hidden="true"
      className="flex size-6 items-center justify-center rounded-md bg-surface-muted text-text-muted"
    >
      <Icon className="size-4" />
    </span>
  );
}
