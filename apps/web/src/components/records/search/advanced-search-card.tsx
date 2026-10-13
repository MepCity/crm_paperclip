"use client";

import type { FieldDefinition, ModuleApiName, RecordData } from "@crm/core/records";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { moduleRecordPath } from "@/lib/crm-paths";
import { DEFAULT_FORMAT } from "@/lib/locale";
import { resolveModuleLaterKey, resolveModuleScreenByApiName } from "@/modules/registry";
import type { ModuleScreenDefinition } from "@/modules/types";
import { formatFieldValue } from "../field-format";
import { NOTES_CARD_COLUMNS } from "./constants";

export interface AdvancedSearchCardProps {
  module: ModuleApiName;
  moduleLabel: string;
  definition?: ModuleScreenDefinition;
  total: number;
  records: readonly RecordData[];
  page: number;
  perPage: number;
  columns: readonly string[];
  fieldsByApiName: Readonly<Record<string, FieldDefinition>>;
  ownerNames: Readonly<Record<string, string>>;
  onPageChange: (newPage: number) => void;
  onOpenManageColumns: () => void;
  orgSlug: string;
}

export function AdvancedSearchCard({
  module,
  moduleLabel,
  definition: propsDefinition,
  total,
  records,
  page,
  perPage,
  columns,
  fieldsByApiName,
  ownerNames,
  onPageChange,
  onOpenManageColumns,
  orgSlug,
}: AdvancedSearchCardProps) {
  const startCount = total === 0 ? 0 : (page - 1) * perPage + 1;
  const endCount = Math.min(page * perPage, total);
  const hasPrev = page > 1;
  const hasNext = page * perPage < total;

  const definition = propsDefinition ?? resolveModuleScreenByApiName(module);
  const tabName = definition?.tab ?? module;
  const linkFieldName = definition?.list?.linkField ?? "Full_Name";

  function getColumnLabel(colApiName: string): string {
    const field = fieldsByApiName[colApiName];
    if (field?.label) return field.label;
    if (colApiName === "Owner") return `${moduleLabel} Owner`;
    if (colApiName === "Full_Name") return `${moduleLabel} Name`;
    return colApiName.replace(/_/g, " ");
  }

  return (
    <section
      aria-label={`${moduleLabel} search results`}
      className="mb-4 overflow-hidden rounded-md border border-panel-border bg-surface shadow-xs"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-text">{moduleLabel}</h3>
          <span
            data-testid={`module-count-${module}`}
            className="inline-flex items-center justify-center rounded-full border border-border bg-surface-hover px-2 py-0.5 text-xs font-semibold text-text-muted"
          >
            {total}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            {startCount} - {endCount}
          </span>
          <button
            type="button"
            aria-label={`Previous ${moduleLabel} page`}
            disabled={!hasPrev}
            onClick={() => onPageChange(page - 1)}
            className="flex size-7 items-center justify-center rounded text-text-muted hover:bg-surface-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Icons.chevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`Next ${moduleLabel} page`}
            disabled={!hasNext}
            onClick={() => onPageChange(page + 1)}
            className="flex size-7 items-center justify-center rounded text-text-muted hover:bg-surface-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Icons.chevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left text-sm"
          aria-label={`${moduleLabel} records table`}
        >
          <thead>
            <tr className="border-b border-border bg-surface-hover text-xs font-semibold text-text-muted">
              {/* Row action column */}
              <th scope="col" className="w-8 px-2 py-2" />

              {/* Data column headers */}
              {columns.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-3 py-2 text-text-muted font-semibold whitespace-nowrap"
                >
                  {getColumnLabel(col)}
                </th>
              ))}

              {/* Manage columns header icon (S-24.<Module>.3) */}
              <th scope="col" className="w-10 px-2 py-2 text-right">
                <button
                  type="button"
                  aria-label={`Manage ${moduleLabel} columns`}
                  onClick={onOpenManageColumns}
                  className="inline-flex size-6 items-center justify-center rounded text-text-muted hover:bg-surface-hover hover:text-text"
                >
                  <Icons.columns className="size-3.5" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr
                key={record.id}
                className="group border-b border-border hover:bg-surface-hover/80 transition-colors"
              >
                {/* S-38: Row action icon button */}
                <td className="w-8 px-2 py-2.5">
                  <button
                    type="button"
                    aria-label="Row actions"
                    className="flex size-6 items-center justify-center rounded text-text-muted opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-surface-hover hover:text-text"
                  >
                    <Icons.ellipsis className="size-3.5" />
                  </button>
                </td>

                {/* Data columns */}
                {columns.map((col) => {
                  const val = record.fields[col];
                  const fieldDef = fieldsByApiName[col];
                  const isLinkField = col === linkFieldName;

                  // S-24.<Module>.4: Record Name Link
                  if (isLinkField) {
                    const text = String(val ?? "—");
                    if (definition) {
                      return (
                        <td key={col} className="px-3 py-2.5 whitespace-nowrap">
                          <Link
                            href={moduleRecordPath(orgSlug, tabName, record.id)}
                            className="font-semibold text-primary hover:underline"
                          >
                            {text}
                          </Link>
                        </td>
                      );
                    }
                    return (
                      <td key={col} className="px-3 py-2.5 whitespace-nowrap">
                        <Link
                          href="#"
                          laterModule={resolveModuleLaterKey(module)}
                          className="font-semibold text-primary hover:underline"
                        >
                          {text}
                        </Link>
                      </td>
                    );
                  }

                  // S-41: Related Record Link
                  if (
                    fieldDef?.dataType === "lookup" ||
                    col === "Account_Name" ||
                    col === "Contact_Name"
                  ) {
                    if (val && typeof val === "object" && "id" in val) {
                      const ref = val as { module?: string; id: string; name?: string };
                      const targetModule =
                        ref.module ??
                        fieldDef?.lookup?.module ??
                        (col === "Account_Name" ? "Accounts" : "Contacts");
                      const targetScreen = resolveModuleScreenByApiName(targetModule);
                      if (targetScreen) {
                        return (
                          <td key={col} className="px-3 py-2.5 whitespace-nowrap">
                            <Link
                              href={moduleRecordPath(orgSlug, targetScreen.tab, ref.id)}
                              className="text-primary hover:underline"
                            >
                              {ref.name ?? ref.id}
                            </Link>
                          </td>
                        );
                      }
                      return (
                        <td key={col} className="px-3 py-2.5 whitespace-nowrap">
                          <Link
                            href="#"
                            laterModule={resolveModuleLaterKey(targetModule)}
                            className="text-primary hover:underline"
                          >
                            {ref.name ?? ref.id}
                          </Link>
                        </td>
                      );
                    }
                    // Kimliği olmayan düz metin bağlantı açmasın (plain text)
                    const plainText = val != null && val !== "" ? String(val) : "—";
                    return (
                      <td key={col} className="px-3 py-2.5 whitespace-nowrap text-text">
                        {plainText}
                      </td>
                    );
                  }

                  // S-39: Phone icon with laterModule="M5"
                  if (fieldDef?.dataType === "phone" || col === "Phone" || col === "Mobile") {
                    const text = val ? String(val) : "";
                    return (
                      <td key={col} className="px-3 py-2.5 whitespace-nowrap text-text">
                        <span>{text || "—"}</span>
                        {text ? (
                          <Button
                            variant="icon"
                            size="compact"
                            aria-label="Call"
                            laterModule="M5"
                            className="inline-flex items-center ml-1.5 text-text-muted hover:text-text"
                          >
                            <Icons.phone className="size-3.5 inline" />
                          </Button>
                        ) : null}
                      </td>
                    );
                  }

                  // S-40: Email link with laterModule="M10"
                  if (
                    fieldDef?.dataType === "email" ||
                    col === "Email" ||
                    col === "Secondary_Email"
                  ) {
                    const text = val ? String(val) : "";
                    return (
                      <td key={col} className="px-3 py-2.5 whitespace-nowrap">
                        {text ? (
                          <Link href="#" laterModule="M10" className="text-primary hover:underline">
                            {text}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  }

                  // S-42: Stage value badge; Deals is live, so the chip draws unlocked and only
                  // displays the stage (the reference never showed an activation for it).
                  if (col === "Stage") {
                    const stageText = val ? String(val) : "";
                    return (
                      <td key={col} className="px-3 py-2.5 whitespace-nowrap">
                        {stageText ? (
                          <Button
                            variant="secondary"
                            size="compact"
                            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          >
                            {stageText}
                          </Button>
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  }

                  // Standard field formatted with formatFieldValue
                  if (fieldDef) {
                    const formatted = formatFieldValue(
                      fieldDef,
                      val ?? null,
                      ownerNames,
                      DEFAULT_FORMAT,
                      { orgSlug },
                    );
                    if (formatted.kind === "empty") {
                      return (
                        <td key={col} className="px-3 py-2.5 whitespace-nowrap text-text">
                          —
                        </td>
                      );
                    }
                    if (formatted.kind === "link") {
                      return (
                        <td key={col} className="px-3 py-2.5 whitespace-nowrap">
                          <Link
                            href={formatted.link.href ?? "#"}
                            laterModule={formatted.link.laterModule}
                            className="text-primary hover:underline"
                          >
                            {formatted.link.text}
                          </Link>
                        </td>
                      );
                    }
                    if (formatted.kind === "audit") {
                      return (
                        <td key={col} className="px-3 py-2.5 whitespace-nowrap text-text">
                          {formatted.name}
                          {formatted.timestamp ? ` ${formatted.timestamp}` : null}
                        </td>
                      );
                    }
                    return (
                      <td key={col} className="px-3 py-2.5 whitespace-nowrap text-text">
                        {formatted.text}
                      </td>
                    );
                  }

                  // Fallback for fields without fieldDef
                  if (col === "Owner" || col === "Created_By" || col === "Modified_By") {
                    const ownerText = val ? (ownerNames[String(val)] ?? String(val)) : "—";
                    return (
                      <td key={col} className="px-3 py-2.5 whitespace-nowrap text-text">
                        {ownerText}
                      </td>
                    );
                  }

                  return (
                    <td key={col} className="px-3 py-2.5 whitespace-nowrap text-text">
                      {val != null && val !== "" ? String(val) : "—"}
                    </td>
                  );
                })}

                {/* Trailing empty column matching header */}
                <td className="w-10 px-2 py-2.5" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Notes Card (M6): header drawn with count 0, empty table body */
export function NotesSearchCard() {
  return (
    <section
      aria-label="Notes search results"
      className="mb-4 overflow-hidden rounded-md border border-panel-border bg-surface shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-text">Notes</h3>
          <span
            data-testid="module-count-Notes"
            className="inline-flex items-center justify-center rounded-full border border-border bg-surface-hover px-2 py-0.5 text-xs font-semibold text-text-muted"
          >
            0
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">0 - 0</span>
          <Button
            variant="icon"
            size="compact"
            aria-label="Previous Notes page"
            laterModule="M6"
            className="flex size-7 items-center justify-center rounded text-text-muted hover:bg-surface-hover hover:text-text"
          >
            <Icons.chevronLeft className="size-4" />
          </Button>
          <Button
            variant="icon"
            size="compact"
            aria-label="Next Notes page"
            laterModule="M6"
            className="flex size-7 items-center justify-center rounded text-text-muted hover:bg-surface-hover hover:text-text"
          >
            <Icons.chevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left text-sm"
          aria-label="Notes records table"
        >
          <thead>
            <tr className="border-b border-border bg-surface-hover text-xs font-semibold text-text-muted">
              <th scope="col" className="w-8 px-2 py-2" />
              {NOTES_CARD_COLUMNS.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className="px-3 py-2 text-text-muted font-semibold whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              <th scope="col" className="w-10 px-2 py-2 text-right">
                <Button
                  variant="icon"
                  size="compact"
                  aria-label="Manage Notes columns"
                  laterModule="M6"
                  className="inline-flex size-6 items-center justify-center rounded text-text-muted hover:bg-surface-hover hover:text-text"
                >
                  <Icons.columns className="size-3.5" />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    </section>
  );
}
