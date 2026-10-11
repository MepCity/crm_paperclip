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
import { type CSSProperties, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { TableRadio, TableRadioGroup } from "@/components/ui/table-radio";
import { TextField } from "@/components/ui/text-field";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import {
  type ClientRecordService,
  useOptionalClientRecordService,
} from "@/lib/api/client/provider";
import { resolveModuleScreenByApiName } from "@/modules/registry";
import "./select-record-dialog.css";

export interface SelectRecordDialogProps {
  module: ModuleApiName;
  title?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  cancelLabel?: string;
  doneLabel?: string;
  selectedId?: string;
  onDone: (reference: ModuleRecordReference) => void;
  onCancel: () => void;
  recordService?: RecordService | ClientRecordService;
}

interface ColumnInfo {
  key: string;
  label: string;
}

function formatCellText(value: FieldValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    return "name" in value && typeof value.name === "string" ? value.name : value.id;
  }
  return String(value);
}

export function SelectRecordDialog({
  module,
  title,
  searchLabel = "Search",
  searchPlaceholder,
  cancelLabel = "Cancel",
  doneLabel = "Done",
  selectedId,
  onDone,
  onCancel,
  recordService,
}: SelectRecordDialogProps) {
  const titleId = useId();
  const clientService = useOptionalClientRecordService();
  const service = recordService ?? clientService;

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
    screenDef?.list.linkField ??
    (metadata?.fields.some((f) => f.apiName === "Full_Name") ? "Full_Name" : "Name");
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
    }));

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

  const handleDone = () => {
    if (!draftId) return;
    const selected = records.find((r) => r.id === draftId);
    const resolvedName = selected ? formatCellText(selected.fields[linkField]) || draftId : draftId;
    onDone({
      module,
      id: draftId,
      name: resolvedName,
    });
  };

  return (
    <TopAlignedModal
      isOpen
      isDismissable={false}
      aria-labelledby={titleId}
      panelClassName="select-user-modal-panel select-record-modal-panel"
      panelStyle={panelStyle}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <h2 id={titleId} className="select-user-title">
        {dialogTitle}
      </h2>

      <div className="select-user-search-row">
        <div className="select-user-search-field">
          <TextField
            variant="filter-search"
            size="fill"
            filterSearchWrapperClassName="select-user-search-input-wrap"
            label={searchLabel}
            placeholder={searchPlaceholder ?? `Search ${pluralLabel}`}
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            autoFocus
          />
        </div>
        <div className="select-user-summary" aria-live="polite">
          <span className="select-user-summary-label">Selected {singularLabel}:</span>
          <div className="select-record-summary-icon" aria-hidden>
            <Icons.recordLookup module={module} className="h-4 w-4" />
          </div>
          <span className="select-user-summary-name">{summaryName}</span>
        </div>
      </div>

      <div className="select-user-table-wrap select-record-table-wrap">
        <div className="select-user-table-frame">
          <TableRadioGroup
            aria-label={dialogTitle}
            value={draftId}
            onChange={setDraftId}
            className="select-user-table-group"
          >
            <table className="select-user-table">
              <colgroup>
                <col className="select-user-col-radio" />
                <col className="select-record-col-name" />
                {otherCols.map((col) => (
                  <col key={col.key} />
                ))}
              </colgroup>
              <thead>
                <tr className="select-user-header-band">
                  <th scope="col" className="select-user-th-radio">
                    <span className="sr-only">Select</span>
                  </th>
                  <th scope="col" className="select-user-th-name">
                    {nameColLabel}
                  </th>
                  {otherCols.map((col) => (
                    <th key={col.key} scope="col">
                      {col.label}
                    </th>
                  ))}
                </tr>
                <tr className="select-user-header-rule" aria-hidden>
                  <td colSpan={otherCols.length + 2} />
                </tr>
              </thead>
              <tbody>
                {rowCount === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={otherCols.length + 2}
                      className="px-6 py-4 text-center text-text-muted"
                    >
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
                      onClick={() => setDraftId(record.id)}
                    >
                      <td className="select-user-td-radio">
                        <TableRadio value={record.id} aria-label={recordDisplayName} />
                      </td>
                      <td className="select-user-td-name font-medium">{recordDisplayName}</td>
                      {otherCols.map((col) => (
                        <td key={col.key}>{formatCellText(record.fields[col.key])}</td>
                      ))}
                    </tr>
                  );
                  if (index === records.length - 1) return [dataRow];
                  return [
                    dataRow,
                    <tr
                      key={`${record.id}-divider`}
                      className="select-user-row-divider"
                      aria-hidden
                    >
                      <td colSpan={otherCols.length + 2} />
                    </tr>,
                  ];
                })}
              </tbody>
            </table>
          </TableRadioGroup>
        </div>
      </div>

      <div className="select-record-pagination">
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
      </div>

      <div className="select-user-footer">
        <Button
          variant="secondary"
          size="selectUserFooter"
          className="select-user-footer-action select-user-footer-action--cancel"
          onPress={onCancel}
        >
          {cancelLabel}
        </Button>
        <Button
          size="selectUserFooter"
          className="select-user-footer-action select-user-footer-action--done"
          isDisabled={!draftId || !selectionChanged}
          onPress={handleDone}
        >
          {doneLabel}
        </Button>
      </div>
    </TopAlignedModal>
  );
}
