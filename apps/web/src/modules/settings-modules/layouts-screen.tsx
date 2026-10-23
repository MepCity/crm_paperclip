"use client";

import { ArrowLeft, HelpCircle, MoreHorizontal, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MODULE_TABS, SIDEBAR_MODULES } from "./fields-model";
import { defaultLayoutRow, type LayoutRow } from "./layouts-model";

export function LayoutsScreen({
  orgSlug,
  module,
  rows = [defaultLayoutRow()],
}: {
  orgSlug: string;
  module: string;
  rows?: LayoutRow[];
}) {
  const [moduleQuery, setModuleQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const modules = SIDEBAR_MODULES.filter(
    (m) => !moduleQuery.trim() || m.toLowerCase().includes(moduleQuery.trim().toLowerCase()),
  );

  return (
    <div
      className="flex rounded-lg border border-border bg-surface shadow-xs"
      data-settings-layouts
    >
      <aside className="w-56 shrink-0 border-r border-border p-3">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={`/crm/${orgSlug}/settings/modules`}
            className="flex items-center gap-1 text-sm font-semibold text-text"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Modules
          </Link>
          <button
            type="button"
            aria-label="Search modules"
            onClick={() => setSearching((s) => !s)}
            className="text-text-muted"
          >
            <Search className="size-4" aria-hidden="true" />
          </button>
        </div>
        {searching ? (
          <input
            type="search"
            aria-label="Filter modules"
            value={moduleQuery}
            onChange={(e) => setModuleQuery(e.target.value)}
            className="mb-2 w-full rounded-md border border-border px-2 py-1 text-sm"
          />
        ) : null}
        <nav aria-label="Modules">
          <ul>
            {modules.map((m) => (
              <li key={m}>
                {m === module ? (
                  <span
                    aria-current="page"
                    className="block rounded-md bg-surface-muted px-2 py-2 text-sm font-semibold text-text"
                  >
                    {m}
                  </span>
                ) : (
                  <Link
                    href={`/crm/${orgSlug}/settings/modules/${encodeURIComponent(m)}/layouts`}
                    className="block px-2 py-2 text-sm text-text-muted hover:text-text"
                  >
                    {m}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="border-b border-border px-6 pt-5 pb-3">
          <h1 className="text-xl font-semibold text-text">{module}</h1>
        </div>
        <div
          role="tablist"
          aria-label="Module configuration"
          className="flex items-center gap-6 border-b border-border px-6"
        >
          {MODULE_TABS.map((t) => {
            if (t === "Layouts") {
              return (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected="true"
                  className="border-b-2 border-primary py-4 text-sm font-semibold text-text"
                >
                  {t}
                </button>
              );
            }
            if (t === "Fields") {
              return (
                <Link
                  key={t}
                  href={`/crm/${orgSlug}/settings/modules/${encodeURIComponent(module)}/fields`}
                  role="tab"
                  aria-selected="false"
                  className="py-4 text-sm text-text-muted hover:text-text"
                >
                  {t}
                </Link>
              );
            }
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected="false"
                disabled
                className="py-4 text-sm text-text-muted opacity-60 cursor-not-allowed"
              >
                {t}
              </button>
            );
          })}
          <button
            type="button"
            aria-label="Layouts help"
            disabled
            className="ml-auto text-text-muted"
          >
            <HelpCircle className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-text-muted">
              Design your own layouts to fit your business processes, then assign them to your user
              accounts based on permission profiles.
            </p>
            <button
              type="button"
              disabled
              className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-text opacity-60 cursor-not-allowed"
            >
              Create New Layout
            </button>
          </div>
          <div className="max-h-[640px] overflow-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-border bg-surface">
                <tr>
                  {["Name", "Shared To", "Last Modified", "Status"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 font-semibold text-text">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-2">
                        <span className="font-medium text-accent-blue">{row.name}</span>
                        {module === "Leads" ? (
                          <button
                            type="button"
                            aria-label="More"
                            disabled
                            className="text-text-muted opacity-60 cursor-not-allowed"
                          >
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </button>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-text-muted">{row.sharedTo}</td>
                    <td className="px-4 py-4 text-text-muted">{row.lastModifiedAt ?? ""}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={row.status}
                        aria-label={`${row.name} layout status`}
                        disabled
                        className={`relative inline-flex h-5 w-9 rounded-full opacity-60 cursor-not-allowed ${row.status ? "bg-success" : "bg-border"}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`absolute top-0.5 size-4 rounded-full bg-surface ${row.status ? "right-0.5" : "left-0.5"}`}
                        />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
