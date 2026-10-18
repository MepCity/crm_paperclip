"use client";

import type {
  FieldDefinition,
  FieldValue,
  ListView,
  ModuleApiName,
  ModuleMetadata,
  ModuleRecordReference,
  RecordData,
  RecordService,
} from "@crm/core/records";
import { type CSSProperties, type ReactNode, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { RecordChoice } from "@/components/ui/record-choice";
import { TableRadio, TableRadioGroup } from "@/components/ui/table-radio";
import { TextField } from "@/components/ui/text-field";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import {
  type ClientRecordService,
  useOptionalClientRecordService,
} from "@/lib/api/client/provider";
import { resolveModuleScreenByApiName } from "@/modules/registry";
import "./select-record-dialog.css";

interface CommonSelectRecordDialogProps {
  module: ModuleApiName;
  /** Modules the user can switch between inside the picker (shown only when more than one). */
  modules?: readonly ModuleApiName[];
  title?: string;
  /** Name column for modules whose screens are not registered yet. */
  nameField?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  cancelLabel?: string;
  doneLabel?: string;
  selectedId?: string;
  /**
   * `observed` draws the picker as captured in the reference Parent Account lookup
   * (`accounts-form.md` › Parent Account lookup): header close cross, `New <record>` action,
   * table/column/filter header marks, record links and chevron pagination, with no footer
   * actions. `interim` (default) keeps the shared picker shape from MEP-318.
   */
  chrome?: "interim" | "observed";
  /** Record address for the name-cell links; only used by the `observed` chrome. */
  recordHref?: (id: string) => string;
  /** Owner id to display name, so `ownerlookup` columns such as Account Owner show a name. */
  ownerNames?: Readonly<Record<string, string>>;
  beforeSearch?: ReactNode;
  isSubmitting?: boolean;
  onCancel: () => void;
  recordService?: RecordService | ClientRecordService;
}

export type SelectRecordDialogProps = CommonSelectRecordDialogProps &
  (
    | {
        selection?: "single";
        selectedIds?: never;
        onDone: (reference: ModuleRecordReference) => void;
      }
    | {
        selection: "multiple";
        selectedIds?: readonly string[];
        onDone: (references: ModuleRecordReference[]) => void;
      }
  );

interface ColumnInfo {
  key: string;
  label: string;
  dataType?: FieldDefinition["dataType"];
}

function formatCellText(value: FieldValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    return "name" in value && typeof value.name === "string"
      ? value.name
      : "id" in value && typeof value.id === "string"
        ? value.id
        : "";
  }
  return String(value);
}

/** An owner column carries an opaque user id; the picker shows the member's name instead. */
function cellText(
  value: FieldValue | undefined,
  dataType: FieldDefinition["dataType"] | undefined,
  ownerNames: Readonly<Record<string, string>> | undefined,
): string {
  const text = formatCellText(value);
  if (dataType === "ownerlookup" && text && ownerNames?.[text]) return ownerNames[text];
  return text;
}

export function SelectRecordDialog(props: SelectRecordDialogProps) {
  const {
    module: initialModule,
    modules,
    title,
    nameField,
    searchLabel,
    searchPlaceholder,
    cancelLabel = "Cancel",
    doneLabel = "Done",
    selectedId,
    chrome = "interim",
    recordHref,
    ownerNames,
    beforeSearch,
    isSubmitting = false,
    onCancel,
    recordService,
  } = props;
  const multiple = props.selection === "multiple";
  const observed = chrome === "observed" && !multiple;
  const [selected, setSelected] = useState<Map<string, ModuleRecordReference>>(
    () =>
      new Map((props.selectedIds ?? []).map((id) => [id, { module: initialModule, id, name: id }])),
  );
  const titleId = useId();
  const clientService = useOptionalClientRecordService();
  const service = recordService ?? clientService;

  const [module, setModule] = useState<ModuleApiName>(initialModule);
  const [draftId, setDraftId] = useState<string>(selectedId ?? "");
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [metadata, setMetadata] = useState<ModuleMetadata | null>(null);
  const [defaultView, setDefaultView] = useState<ListView | null>(null);
  const [records, setRecords] = useState<readonly RecordData[]>([]);
  const [moreRecords, setMoreRecords] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const screenDef = resolveModuleScreenByApiName(module);
  const singularLabel = screenDef?.singularLabel ?? metadata?.singularLabel ?? module;
  const pluralLabel = screenDef?.pluralLabel ?? metadata?.pluralLabel ?? module;
  const dialogTitle = title ?? `Choose ${singularLabel}`;

  // 1. Load module metadata and views
  useEffect(() => {
    if (!service) return;
    let active = true;

    async function init() {
      if (!service) return;
      try {
        const [modMeta, views] = await Promise.all([
          service.getModule(module),
          service.listViews(module),
        ]);
        if (!active) return;
        setMetadata(modMeta);
        const viewsList: readonly ListView[] = views;
        const defView = viewsList.find((v) => v.isDefault) ?? viewsList[0] ?? null;
        setDefaultView(defView);
      } catch {
        // Handle error silently or allow fallback
      }
    }

    void init();
    return () => {
      active = false;
    };
  }, [module, service]);

  // 2. Load records whenever viewId, search, or page changes
  useEffect(() => {
    if (!service || !defaultView) return;
    let active = true;
    setLoading(true);

    async function loadData() {
      if (!service || !defaultView) return;
      try {
        const trimmedSearch = search.trim();
        const [listRes, countRes] = await Promise.all([
          service.list(module, {
            viewId: defaultView.id,
            page,
            perPage: 10,
            search: trimmedSearch || undefined,
          }),
          service.count(module, {
            viewId: defaultView.id,
            search: trimmedSearch || undefined,
          }),
        ]);
        if (!active) return;
        setRecords(listRes.records);
        setMoreRecords(listRes.moreRecords);
        setTotalCount(countRes);
      } catch {
        if (!active) return;
        setRecords([]);
        setMoreRecords(false);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, [module, service, defaultView, search, page]);

  // Determine columns
  const linkField =
    nameField ??
    screenDef?.list.linkField ??
    (metadata?.fields.some((f) => f.apiName === "Full_Name") ? "Full_Name" : "Name");
  useEffect(() => {
    if (!multiple) return;
    setSelected((previous) => {
      let next = previous;
      for (const record of records) {
        const reference = previous.get(record.id);
        if (!reference) continue;
        const name = formatCellText(record.fields[linkField]) || record.id;
        if (reference.name === name) continue;
        if (next === previous) next = new Map(previous);
        next.set(record.id, { module, id: record.id, name });
      }
      return next;
    });
  }, [multiple, records, linkField, module]);

  const fieldMap = new Map<string, FieldDefinition>(
    metadata?.fields.map((f) => [f.apiName, f]) ?? [],
  );

  const nameColLabel =
    fieldMap.get(linkField)?.label ?? screenDef?.list.linkFieldLabel ?? `${singularLabel} Name`;

  const otherCols: ColumnInfo[] = (defaultView?.columns ?? [])
    .filter((colName) => colName !== linkField && colName !== "id")
    .slice(0, 3)
    .map((colName) => ({
      key: colName,
      label: fieldMap.get(colName)?.label ?? colName,
      dataType: fieldMap.get(colName)?.dataType,
    }));

  /** The observed picker names its search field after the record column and shows no summary. */
  const effectiveSearchLabel = observed
    ? (searchLabel ?? `Search by ${nameColLabel}`)
    : (searchLabel ?? "Search");
  const effectiveSearchPlaceholder = observed
    ? effectiveSearchLabel
    : (searchPlaceholder ?? `Search ${pluralLabel}`);
  const newRecordLabel = `New ${singularLabel}`;

  const summaryRecord =
    records.find((r) => r.id === draftId) ?? records.find((r) => r.id === selectedId);
  const summaryName = summaryRecord
    ? formatCellText(summaryRecord.fields[linkField]) || summaryRecord.id
    : "";

  const selectionChanged = draftId !== "" && draftId !== selectedId;
  const rowCount = records.length;
  const panelStyle = {
    "--select-user-row-count": String(rowCount),
  } as CSSProperties;

  const referenceFor = (id: string): ModuleRecordReference => {
    const selected = records.find((r) => r.id === id);
    const resolvedName = selected ? formatCellText(selected.fields[linkField]) || id : id;
    return { module, id, name: resolvedName };
  };

  const handleDone = () => {
    if (isSubmitting) return;
    if (props.selection === "multiple") {
      props.onDone(Array.from(selected.values()));
    } else if (draftId) props.onDone(referenceFor(draftId));
  };

  /** The observed picker paints no footer action, so choosing a row applies and closes. */
  const choose = (id: string) => {
    if (isSubmitting) return;
    if (multiple) {
      setSelected((previous) => {
        const next = new Map(previous);
        if (next.has(id)) next.delete(id);
        else next.set(id, referenceFor(id));
        return next;
      });
      return;
    }
    setDraftId(id);
    if (observed) props.onDone(referenceFor(id));
  };

  const table = (
    <table className="select-user-table">
      <colgroup>
        <col className="select-user-col-radio" />
        <col className="select-record-col-name" />
        {otherCols.map((col) => (
          <col key={col.key} />
        ))}
        {observed ? <col className="select-record-col-filter" /> : null}
      </colgroup>
      <thead>
        <tr className="select-user-header-band">
          <th scope="col" className="select-user-th-radio">
            {multiple ? (
              <Checkbox
                label="Select all on this page"
                hideLabel
                isDisabled={loading || isSubmitting || records.length === 0}
                isSelected={records.length > 0 && records.every((r) => selected.has(r.id))}
                isIndeterminate={
                  records.some((r) => selected.has(r.id)) &&
                  !records.every((r) => selected.has(r.id))
                }
                onChange={(checked) =>
                  setSelected((previous) => {
                    const next = new Map(previous);
                    for (const record of records) {
                      if (checked) next.set(record.id, referenceFor(record.id));
                      else next.delete(record.id);
                    }
                    return next;
                  })
                }
              />
            ) : observed ? (
              <Button
                aria-label="Table columns"
                variant="icon"
                size="compact"
                className="select-record-table-icon"
              >
                <Icons.tableChevronDown
                  aria-hidden
                  className="h-(--size-menu-icon) w-(--size-menu-icon)"
                />
              </Button>
            ) : (
              <span className="sr-only">Select</span>
            )}
          </th>
          <th scope="col" className="select-user-th-name">
            {observed ? (
              <span className="select-record-th-label">
                <span>{nameColLabel}</span>
                <Button aria-label={`${nameColLabel} column options`} variant="icon" size="compact">
                  <Icons.sort aria-hidden className="h-(--size-menu-icon) w-(--size-menu-icon)" />
                </Button>
              </span>
            ) : (
              nameColLabel
            )}
          </th>
          {otherCols.map((col) => (
            <th key={col.key} scope="col">
              {observed ? (
                <span className="select-record-th-label">
                  <span>{col.label}</span>
                  <Button aria-label={`${col.label} column options`} variant="icon" size="compact">
                    <Icons.sort aria-hidden className="h-(--size-menu-icon) w-(--size-menu-icon)" />
                  </Button>
                </span>
              ) : (
                col.label
              )}
            </th>
          ))}
          {observed ? (
            <th scope="col" className="select-record-th-filter">
              <Button
                aria-label="Filter"
                variant="icon"
                size="compact"
                className="select-record-filter-icon"
              >
                <Icons.filter aria-hidden className="h-(--size-menu-icon) w-(--size-menu-icon)" />
              </Button>
            </th>
          ) : null}
        </tr>
        <tr className="select-user-header-rule" aria-hidden>
          <td colSpan={otherCols.length + (observed ? 3 : 2)} />
        </tr>
      </thead>
      <tbody>
        {rowCount === 0 && !loading && (
          <tr>
            <td colSpan={otherCols.length + 2} className="px-6 py-4 text-center text-text-muted">
              No records found.
            </td>
          </tr>
        )}
        {records.flatMap((record, index) => {
          const recordDisplayName = formatCellText(record.fields[linkField]) || record.id;
          const dataRow = (
            <tr
              key={record.id}
              className="cursor-pointer"
              onClick={(event) => {
                if (
                  multiple &&
                  event.target instanceof Element &&
                  event.target.closest(".select-user-td-radio")
                )
                  return;
                choose(record.id);
              }}
            >
              <td className="select-user-td-radio">
                {multiple ? (
                  <Checkbox
                    label={recordDisplayName}
                    hideLabel
                    isSelected={selected.has(record.id)}
                    isDisabled={isSubmitting}
                    onChange={() => choose(record.id)}
                  />
                ) : (
                  <TableRadio value={record.id} aria-label={recordDisplayName} />
                )}
              </td>
              <td className="select-user-td-name">
                {observed && recordHref ? (
                  <Link href={recordHref(record.id)}>{recordDisplayName}</Link>
                ) : (
                  recordDisplayName
                )}
              </td>
              {otherCols.map((col) => (
                <td key={col.key}>
                  {cellText(record.fields[col.key], col.dataType, ownerNames)}
                  {observed && col.dataType === "phone" && record.fields[col.key] ? (
                    <Button
                      aria-label="Phone"
                      variant="icon"
                      size="compact"
                      laterModule="M5"
                      className="select-record-phone-action"
                    >
                      <Icons.phone
                        aria-hidden
                        className="h-(--size-menu-icon) w-(--size-menu-icon)"
                      />
                    </Button>
                  ) : null}
                </td>
              ))}
            </tr>
          );
          if (index === records.length - 1) return [dataRow];
          return [
            dataRow,
            <tr key={`${record.id}-divider`} className="select-user-row-divider" aria-hidden>
              <td colSpan={otherCols.length + (observed ? 3 : 2)} />
            </tr>,
          ];
        })}
      </tbody>
    </table>
  );

  return (
    <TopAlignedModal
      isOpen
      isDismissable={false}
      aria-labelledby={titleId}
      panelClassName={`select-user-modal-panel select-record-modal-panel${
        observed
          ? " select-record-modal-panel--observed"
          : beforeSearch
            ? " select-record-modal-panel--with-options"
            : ""
      }`}
      panelStyle={panelStyle}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <h2 id={titleId} className="select-user-title">
        {dialogTitle}
      </h2>
      {observed ? (
        <Button
          aria-label="Close"
          variant="icon"
          size="compact"
          className="select-record-close"
          onPress={onCancel}
        >
          <Icons.close aria-hidden className="h-(--size-menu-icon) w-(--size-menu-icon)" />
        </Button>
      ) : null}

      {modules && modules.length > 1 ? (
        <div className="select-record-module-choice">
          <RecordChoice
            label="Module"
            hideLabel
            value={module}
            onChange={(next) => {
              setModule(next ?? initialModule);
              setDraftId("");
              setSelected(new Map());
              setPage(1);
            }}
            options={modules.map((m) => ({
              value: m,
              label: resolveModuleScreenByApiName(m)?.pluralLabel ?? m,
            }))}
          />
        </div>
      ) : null}

      {beforeSearch}
      <div className="select-user-search-row">
        <div className="select-user-search-field">
          <TextField
            variant="filter-search"
            size="fill"
            filterSearchWrapperClassName="select-user-search-input-wrap"
            label={effectiveSearchLabel}
            placeholder={effectiveSearchPlaceholder}
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            autoFocus
          />
        </div>
        {observed ? (
          <Button variant="secondary" size="md" className="select-record-new">
            <Icons.plus aria-hidden className="h-(--size-menu-icon) w-(--size-menu-icon)" />
            {newRecordLabel}
          </Button>
        ) : (
          <div className="select-user-summary" aria-live="polite">
            {multiple ? (
              <span>{selected.size} selected</span>
            ) : (
              <>
                <span className="select-user-summary-label">Selected {singularLabel}:</span>
                <div className="select-record-summary-icon" aria-hidden>
                  <Icons.recordLookup module={module} className="h-4 w-4" />
                </div>
                <span className="select-user-summary-name">{summaryName}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="select-user-table-wrap select-record-table-wrap">
        <div className="select-user-table-frame">
          {multiple ? (
            <div className="select-user-table-group">{table}</div>
          ) : (
            <TableRadioGroup
              aria-label={dialogTitle}
              value={draftId}
              onChange={choose}
              className="select-user-table-group"
            >
              {table}
            </TableRadioGroup>
          )}
        </div>
      </div>

      <div className="select-record-pagination">
        {observed ? (
          <div className="select-record-pagination-icons">
            <Button
              aria-label="Previous"
              variant="icon"
              size="compact"
              isDisabled={page <= 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
            >
              <Icons.chevronLeft
                aria-hidden
                className="h-(--size-menu-icon) w-(--size-menu-icon)"
              />
            </Button>
            <Button
              aria-label="Next"
              variant="icon"
              size="compact"
              isDisabled={!moreRecords}
              onPress={() => setPage((p) => p + 1)}
            >
              <Icons.chevronRight
                aria-hidden
                className="h-(--size-menu-icon) w-(--size-menu-icon)"
              />
            </Button>
          </div>
        ) : (
          <>
            <span>{totalCount !== null ? `Total Records: ${totalCount}` : `Page ${page}`}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                isDisabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm">Page {page}</span>
              <Button
                variant="secondary"
                size="sm"
                isDisabled={!moreRecords}
                onPress={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>

      {observed ? null : (
        <div className="select-user-footer">
          <Button
            variant="secondary"
            size="selectUserFooter"
            className="select-user-footer-action select-user-footer-action--cancel"
            isDisabled={isSubmitting}
            onPress={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            size="selectUserFooter"
            className="select-user-footer-action select-user-footer-action--done"
            isDisabled={
              isSubmitting || (multiple ? selected.size === 0 : !draftId || !selectionChanged)
            }
            onPress={handleDone}
          >
            {doneLabel}
          </Button>
        </div>
      )}
    </TopAlignedModal>
  );
}
