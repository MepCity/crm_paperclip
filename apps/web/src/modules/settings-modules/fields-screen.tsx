"use client";

import { ArrowLeft, HelpCircle, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { type FieldEditorData, useFieldEditor } from "./fields-editor";
import { type FieldRow, filterFieldRows, MODULE_TABS, SIDEBAR_MODULES } from "./fields-model";

const SUBTABS = ["Field Listing", "Field Permissions", "AI Governance"];

export function FieldsScreen({
  orgSlug,
  module,
  rows,
  editor,
}: {
  orgSlug: string;
  module: string;
  rows: FieldRow[];
  /** Present only for an admin on an editing-enabled deployment. */
  editor?: FieldEditorData;
}) {
  return <FieldsScreenBody orgSlug={orgSlug} module={module} rows={rows} editor={editor} />;
}

const NO_EDITOR: FieldEditorData = {
  revision: "",
  layout: { id: "", label: "", isDefault: true, sections: [] },
  retired: [],
};

function FieldsScreenBody({
  orgSlug,
  module,
  rows,
  editor,
}: {
  orgSlug: string;
  module: string;
  rows: FieldRow[];
  editor?: FieldEditorData;
}) {
  const edit = useFieldEditor(orgSlug, module, editor ?? NO_EDITOR);
  const [query, setQuery] = useState("");
  const [moduleQuery, setModuleQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.label.localeCompare(b.label, "en", { sensitivity: "base" })),
    [rows],
  );
  const shown = useMemo(() => filterFieldRows(sortedRows, query), [sortedRows, query]);
  const modules = SIDEBAR_MODULES.filter(
    (m) => !moduleQuery.trim() || m.toLowerCase().includes(moduleQuery.trim().toLowerCase()),
  );

  return (
    <div className="flex rounded-lg border border-border bg-surface shadow-xs" data-settings-fields>
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
                    href={`/crm/${orgSlug}/settings/modules/${encodeURIComponent(m)}/fields`}
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
            if (t === "Fields") {
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
            if (t === "Layouts") {
              return (
                <Link
                  key={t}
                  href={`/crm/${orgSlug}/settings/modules/${encodeURIComponent(module)}/layouts`}
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
            aria-label="Fields help"
            disabled
            className="ml-auto text-text-muted"
          >
            <HelpCircle className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-6">
          <div
            role="tablist"
            aria-label="Field views"
            className="mb-4 inline-flex rounded-full border border-border bg-surface-muted p-1"
          >
            {SUBTABS.map((t, i) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={i === 0}
                disabled={i !== 0}
                className={`rounded-full px-4 py-1 text-sm font-medium transition-colors ${
                  i === 0
                    ? "bg-surface font-semibold text-text shadow-xs"
                    : "text-text-muted opacity-60 cursor-not-allowed"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mb-4 flex items-center justify-between">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search Fields or Data Types"
                placeholder="Search Fields or Data Types"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-72 rounded-md border border-border bg-surface py-2 pl-8 pr-3 text-sm focus:border-primary focus:outline-hidden"
              />
            </div>
            {editor ? (
              edit.toolbar
            ) : (
              <button
                type="button"
                disabled
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-text opacity-60 cursor-not-allowed"
              >
                Create and Edit Fields
              </button>
            )}
          </div>
          {editor ? edit.banner : null}
          <div className="max-h-[640px] overflow-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-border bg-surface">
                <tr>
                  {(editor
                    ? ["Fields", "Data Type", "Custom Field", "Actions"]
                    : ["Fields", "Data Type", "Custom Field"]
                  ).map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 font-semibold text-text">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={editor ? 4 : 3} className="px-4 py-8 text-center text-text-muted">
                      No fields found
                    </td>
                  </tr>
                ) : (
                  shown.map((r) => (
                    <tr key={r.apiName} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">{r.label}</td>
                      <td className="px-4 py-3">{r.dataType}</td>
                      <td className="px-4 py-3">{r.custom ? "Custom" : ""}</td>
                      {editor ? <td className="px-4 py-3">{edit.actions(r)}</td> : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {editor ? edit.retired : null}
        </div>
      </div>
      {editor ? edit.dialog : null}
    </div>
  );
}
