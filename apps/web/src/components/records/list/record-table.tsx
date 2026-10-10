"use client";

import type { FormatOptions } from "@crm/core/format";
import type { FieldDefinition, RecordData, SortSpec } from "@crm/core/records";
import { type ReactNode, useState } from "react";
import { AlphabetFilter } from "@/components/ui/alphabet-filter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icon";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";
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
  /** API names whose header offers the column options menu. */
  sortableFields: ReadonlySet<string>;
  /** Called with the order picked in that menu. The page owns the applied sort. */
  onSortChange: (sort: SortSpec) => void;
  /**
   * Alphabetical filter of the link column header. Drawn only when it is supplied:
   * `value` is the chosen letter, or null for `All`.
   */
  alphabet?: { value: string | null; onChange: (letter: string | null) => void };
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

const headerBox = [
  "relative h-(--size-list-header-height) overflow-hidden",
  "border-b-(length:--size-list-header-border) border-b-panel-border",
  "text-left align-middle text-md font-normal text-text-strong",
].join(" ");

const bodyBox = "border-b border-b-row-separator align-top text-md font-normal text-text";

const inset = "ps-(--size-list-cell-inset)";

const cellLine = [
  "flex w-full items-start py-(--size-list-row-pad)",
  "leading-(--size-list-line-height)",
].join(" ");

/**
 * Module-agnostic records table: leading pair, optional badge strip and data
 * columns. The data area scrolls horizontally. View Settings is a header overlay.
 */
export function RecordTable({
  columns,
  records,
  linkField,
  rowHref,
  selectedIds,
  onSelectedIdsChange,
  sortableFields,
  onSortChange,
  alphabet,
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
      className="relative flex max-h-full min-h-0 max-w-full flex-col overflow-hidden rounded-md border border-panel-border bg-surface"
    >
      <section
        aria-label={empty ? "Records" : undefined}
        className={`min-h-0 flex-1 overflow-x-auto overflow-y-auto ${
          empty ? "outline-none focus-visible:ring-2 focus-visible:ring-focus-ring" : ""
        }`}
        // No row control is focusable when the page is empty, so the scroller
        // itself takes keyboard focus (WCAG 2.1.1 / scrollable region).
        tabIndex={empty ? 0 : undefined}
      >
        {/* Separate borders keep the 2px header rule inside each cell box. */}
        <table className="w-max min-w-full border-separate border-spacing-0" aria-label="Records">
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
                  <div className="flex h-full items-center justify-end pe-(--size-list-checkbox-inset)">
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
                  aria-label={field.label}
                  className={`${dataColumn} ${headerBox} group/column`}
                >
                  <div className={`flex h-full items-center overflow-hidden ${inset}`}>
                    <span data-part="header-label" className="min-w-0 truncate">
                      {field.label}
                    </span>
                    {field.apiName === linkField && alphabet ? (
                      <AlphabetFilter
                        label="Filter by first letter"
                        value={alphabet.value}
                        onChange={alphabet.onChange}
                        className="shrink-0"
                      />
                    ) : null}
                  </div>
                  {sortableFields.has(field.apiName) ? (
                    <ColumnOptionsMenu
                      field={field.apiName}
                      label={field.label}
                      alwaysVisible={field.apiName === linkField}
                      onSortChange={onSortChange}
                    />
                  ) : null}
                  <span
                    data-part="divider"
                    aria-hidden="true"
                    className="pointer-events-none absolute top-(--size-list-header-rule-offset) right-0 h-(--size-list-header-rule) w-px bg-panel-border"
                  />
                </th>
              ))}
            </tr>
          </thead>
          {empty ? null : (
            <tbody>
              {records.map((record) => (
                <tr key={record.id} data-part="row">
                  <td
                    data-part="leading"
                    className={`${halfLeading} ${bodyBox} sticky left-0 z-10`}
                  />
                  <td
                    data-part="leading"
                    className={`${halfLeading} ${bodyBox} sticky left-[calc(var(--size-list-leading-pair-width)/2)] z-10`}
                  >
                    <div className="flex justify-end pe-(--size-list-checkbox-inset) pt-(--size-list-checkbox-offset)">
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
                  />
                  {columns.map((field) => (
                    <td
                      key={field.apiName}
                      data-part="column"
                      className={`${dataColumn} ${bodyBox}`}
                    >
                      <div className={`${cellLine} ${inset} ${wrapText ? "" : "overflow-hidden"}`}>
                        <div
                          data-part="value"
                          className={
                            wrapText
                              ? "min-h-(--size-list-line-height) min-w-0 whitespace-normal break-words"
                              : "min-h-(--size-list-line-height) min-w-0 truncate"
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
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </section>
      {empty ? (
        <div
          data-part="empty"
          className="border-b border-b-row-separator bg-surface pt-(--size-list-empty-offset) pb-(--size-list-row-pad) text-center text-sm text-text-empty leading-(--size-list-line-height)"
        >
          {emptyMessage}
        </div>
      ) : null}
      <div
        data-part="settings"
        className={[
          "absolute top-0 right-0 z-30 box-border flex items-center justify-center bg-surface",
          "h-(--size-list-header-height) w-(--size-list-settings-width)",
          "border-l border-l-panel-border",
          "border-b-(length:--size-list-header-border) border-b-panel-border",
        ].join(" ")}
      >
        {settings ?? null}
      </div>
      <RecordTableFooter {...footer} />
    </div>
  );
}

/** Kept invisible until the header is hovered or holds keyboard focus. */
const hoverReveal = [
  "opacity-0 pointer-events-none",
  "group-hover/column:opacity-100 group-hover/column:pointer-events-auto",
  "group-focus-within/column:opacity-100 group-focus-within/column:pointer-events-auto",
].join(" ");

/**
 * Column header options: the trigger sits at the header cell's trailing end, before its
 * divider, and is placed outside the label flow so the label keeps its truncation width.
 * The menu offers `Asc` and `Desc` only; the reference's other three entries are not drawn.
 */
function ColumnOptionsMenu({
  field,
  label,
  alwaysVisible,
  onSortChange,
}: {
  field: string;
  label: string;
  alwaysVisible: boolean;
  onSortChange: (sort: SortSpec) => void;
}) {
  const [open, setOpen] = useState(false);
  const name = `${label} column options`;
  return (
    <MenuTrigger isOpen={open} onOpenChange={setOpen}>
      <Button
        aria-label={name}
        variant="icon"
        size="compact"
        data-part="column-options"
        className={[
          "absolute top-1/2 right-(--size-list-cell-inset) -translate-y-1/2",
          "h-(--size-menu-icon) w-(--size-menu-icon)",
          alwaysVisible || open ? "" : hoverReveal,
        ].join(" ")}
      >
        <Icons.sort aria-hidden="true" className="h-(--size-menu-icon) w-(--size-menu-icon)" />
      </Button>
      <Menu
        aria-label={name}
        width="columnOptions"
        appearance="measured"
        placement="bottom start"
        onAction={(key) => onSortChange({ field, order: key === "desc" ? "desc" : "asc" })}
      >
        <MenuItem id="asc" appearance="measured" textValue="Asc">
          <Icons.columnSortAsc
            aria-hidden="true"
            className="shrink-0 text-menu-icon h-(--size-menu-icon) w-(--size-menu-icon)"
          />
          Asc
        </MenuItem>
        <MenuItem id="desc" appearance="measured" textValue="Desc">
          <Icons.columnSortDesc
            aria-hidden="true"
            className="shrink-0 text-menu-icon h-(--size-menu-icon) w-(--size-menu-icon)"
          />
          Desc
        </MenuItem>
      </Menu>
    </MenuTrigger>
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
    <div data-part="checkbox" className="w-fit">
      <Checkbox hideLabel label={label} isSelected={isSelected} onChange={onChange} />
    </div>
  );
}
