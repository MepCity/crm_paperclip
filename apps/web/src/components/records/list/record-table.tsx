"use client";

import type { FormatOptions } from "@crm/core/format";
import type { FieldDefinition, RecordData } from "@crm/core/records";
import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { CellValue } from "./cell-value";
import { RecordTableFooter, type RecordTableFooterProps } from "./record-table-footer";

export interface RecordTableProps {
  /** Columns in screen order. Labels come from the field, not from a module. */
  columns: readonly FieldDefinition[];
  records: readonly RecordData[];
  /** API name of the column whose value links to the row. */
  linkField: string;
  rowHref: (record: RecordData) => string;
  /** Selected record ids. Selection of ids outside this page is preserved. */
  selectedIds: readonly string[];
  onSelectedIdsChange: (ids: readonly string[]) => void;
  /** When set, cell text wraps and the row grows. Otherwise the cell truncates. */
  wrapText: boolean;
  emptyMessage: string;
  /** Header slot for the 40px View Settings cell. Empty in this delivery. */
  settings?: ReactNode;
  /** User id → display name. See `CellValue`. */
  ownerNames?: Readonly<Record<string, string>>;
  format: FormatOptions;
  footer: RecordTableFooterProps;
}

const halfLeading = [
  "box-border w-[calc(var(--size-list-leading-pair-width)/2)]",
  "min-w-[calc(var(--size-list-leading-pair-width)/2)]",
  "max-w-[calc(var(--size-list-leading-pair-width)/2)]",
  "bg-surface p-0",
].join(" ");

const dataColumn = [
  "box-border w-(--size-list-column-width) min-w-(--size-list-column-width)",
  "max-w-(--size-list-column-width) bg-surface p-0",
].join(" ");

const badgeColumn = [
  "box-border w-(--size-list-badge-width) min-w-(--size-list-badge-width)",
  "max-w-(--size-list-badge-width) bg-surface p-0",
].join(" ");

const settingsColumn = [
  "box-border w-(--size-list-settings-width) min-w-(--size-list-settings-width)",
  "max-w-(--size-list-settings-width) bg-surface p-0",
].join(" ");

const headerBox = [
  "h-(--size-list-header-height) overflow-hidden border-b-(length:--size-list-header-border)",
  "border-b-panel-border text-left align-middle text-sm font-medium text-text-strong",
].join(" ");

const headerRule = "border-l border-l-panel-border";

const bodyBox = "border-b border-b-row-separator align-middle text-sm font-normal text-text";

const inset = "ps-(--size-list-cell-inset)";

/**
 * Module-agnostic records table: leading pair, optional badge strip, data
 * columns and a trailing settings cell. The data area scrolls horizontally.
 */
export function RecordTable({
  columns,
  records,
  linkField,
  rowHref,
  selectedIds,
  onSelectedIdsChange,
  wrapText,
  emptyMessage,
  settings,
  ownerNames,
  format,
  footer,
}: RecordTableProps) {
  const empty = records.length === 0;
  const selected = new Set(selectedIds);
  const pageIds = records.map((record) => record.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const columnCount = 2 + (empty ? 0 : 1) + columns.length + 1;

  function changePage(checked: boolean) {
    const next = new Set(selectedIds);
    for (const id of pageIds) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    onSelectedIdsChange([...next]);
  }

  function changeRow(id: string, checked: boolean) {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectedIdsChange([...next]);
  }

  return (
    <div
      data-part="card"
      className="max-w-full overflow-hidden rounded-md border border-panel-border bg-surface"
    >
      <section
        aria-label="Records"
        className={`overflow-x-auto ${
          empty ? "outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" : ""
        }`}
        // No row control is focusable when the page is empty, so the scroller
        // itself takes keyboard focus (WCAG 2.1.1 / scrollable region).
        tabIndex={empty ? 0 : undefined}
      >
        <table className="w-max min-w-full border-collapse border-spacing-0" aria-label="Records">
          <thead>
            <tr data-part="header">
              <td
                data-part="leading"
                className={`${halfLeading} ${headerBox} sticky left-0 z-20`}
              />
              {empty ? (
                <td
                  data-part="leading"
                  className={`${halfLeading} ${headerBox} sticky left-[calc(var(--size-list-leading-pair-width)/2)] z-20`}
                />
              ) : (
                <th
                  scope="col"
                  data-part="leading"
                  className={`${halfLeading} ${headerBox} sticky left-[calc(var(--size-list-leading-pair-width)/2)] z-20`}
                >
                  <div className="flex h-full items-center justify-end pe-(--size-list-cell-inset)">
                    <SelectionBox
                      label="Select all rows on this page"
                      isSelected={allSelected}
                      onChange={changePage}
                    />
                  </div>
                </th>
              )}
              {empty ? null : (
                <th
                  scope="col"
                  data-part="badge"
                  className={`${badgeColumn} ${headerBox} sticky left-(--size-list-leading-pair-width) z-10`}
                >
                  <span className="sr-only">Badges</span>
                </th>
              )}
              {columns.map((field) => (
                <th
                  key={field.apiName}
                  scope="col"
                  data-part="column"
                  className={`${dataColumn} ${headerBox} ${headerRule}`}
                >
                  <div className={`flex h-full items-center overflow-hidden ${inset}`}>
                    <span data-part="header-label" className="min-w-0 truncate">
                      {field.label}
                    </span>
                  </div>
                </th>
              ))}
              <th
                scope="col"
                data-part="settings"
                className={`${settingsColumn} ${headerBox} ${headerRule} sticky right-0 z-20`}
              >
                <div className="flex h-full items-center justify-center">
                  {settings ?? <span className="sr-only">View settings</span>}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {empty ? (
              <tr data-part="row">
                <td colSpan={columnCount} className={bodyBox}>
                  <div
                    data-part="empty"
                    className="flex min-h-(--size-list-row-height) items-center justify-center text-center"
                  >
                    {emptyMessage}
                  </div>
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} data-part="row">
                  <td
                    data-part="leading"
                    className={`${halfLeading} ${bodyBox} sticky left-0 z-10`}
                  />
                  <td
                    data-part="leading"
                    className={`${halfLeading} ${bodyBox} sticky left-[calc(var(--size-list-leading-pair-width)/2)] z-10`}
                  >
                    <div className="flex min-h-(--size-list-row-height) items-center justify-end pe-(--size-list-cell-inset)">
                      <SelectionBox
                        label={selectionLabel(record, linkField)}
                        isSelected={selected.has(record.id)}
                        onChange={(checked) => changeRow(record.id, checked)}
                      />
                    </div>
                  </td>
                  <td
                    data-part="badge"
                    className={`${badgeColumn} ${bodyBox} sticky left-(--size-list-leading-pair-width) z-10`}
                  >
                    <div className="min-h-(--size-list-row-height)" />
                  </td>
                  {columns.map((field) => (
                    <td
                      key={field.apiName}
                      data-part="column"
                      className={`${dataColumn} ${bodyBox}`}
                    >
                      <div
                        className={`flex min-h-(--size-list-row-height) w-full items-center ${inset} ${
                          wrapText ? "" : "overflow-hidden"
                        }`}
                      >
                        <div
                          data-part="value"
                          className={
                            wrapText ? "min-w-0 whitespace-normal break-words" : "min-w-0 truncate"
                          }
                        >
                          <CellValue
                            field={field}
                            value={record.fields[field.apiName] ?? null}
                            href={field.apiName === linkField ? rowHref(record) : undefined}
                            ownerNames={ownerNames}
                            format={format}
                          />
                        </div>
                      </div>
                    </td>
                  ))}
                  <td
                    data-part="settings"
                    className={`${settingsColumn} ${bodyBox} sticky right-0 z-10`}
                  >
                    <div className="min-h-(--size-list-row-height)" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
      <RecordTableFooter {...footer} />
    </div>
  );
}

function selectionLabel(record: RecordData, linkField: string): string {
  const value = record.fields[linkField];
  const text = typeof value === "string" && value !== "" ? value : record.id;
  return `Select ${text}`;
}

function SelectionBox({
  label,
  isSelected,
  onChange,
}: {
  label: string;
  isSelected: boolean;
  onChange: (isSelected: boolean) => void;
}) {
  return (
    <div className="w-fit [&_.text-sm]:sr-only [&>div]:w-fit">
      <Checkbox label={label} isSelected={isSelected} onChange={onChange} />
    </div>
  );
}
