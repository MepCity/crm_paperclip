"use client";

import type { FormatOptions } from "@crm/core/format";
import type { FieldDefinition, RecordData, RecordId } from "@crm/core/records";
import { useMemo } from "react";
import { CellValue } from "@/components/records/list/cell-value";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { comparisonFields, isMergeValueSelectable, valuesConflict } from "./merge-field-selection";

export interface MergeComparisonProps {
  records: readonly RecordData[];
  fields: readonly FieldDefinition[];
  masterId: RecordId;
  fieldChoices: Readonly<Record<string, RecordId>>;
  conflictsOnly: boolean;
  ownerNames: Readonly<Record<string, string>>;
  format: FormatOptions;
  displayNameField: string;
  onMasterChange: (id: RecordId) => void;
  onFieldChoiceChange: (fieldApiName: string, recordId: RecordId) => void;
  onSelectAllFromRecord: (recordId: RecordId) => void;
  onConflictsOnlyChange: (checked: boolean) => void;
}

export function MergeComparison({
  records,
  fields,
  masterId,
  fieldChoices,
  conflictsOnly,
  ownerNames,
  format,
  displayNameField,
  onMasterChange,
  onFieldChoiceChange,
  onSelectAllFromRecord,
  onConflictsOnlyChange,
}: MergeComparisonProps) {
  const rows = useMemo(() => comparisonFields(fields, records), [fields, records]);
  const visibleRows = conflictsOnly
    ? rows.filter((field) =>
        valuesConflict(records.map((record) => record.fields[field.apiName] ?? null)),
      )
    : rows;

  return (
    <div className="merge-comparison flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        <Checkbox
          label="Show Conflicts Only"
          isSelected={conflictsOnly}
          onChange={onConflictsOnlyChange}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-auto border border-panel-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-panel-border bg-surface-muted">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-surface-muted px-4 py-3 text-left font-medium text-text"
              >
                Field
              </th>
              {records.map((record, index) => {
                const title = String(record.fields[displayNameField] ?? `Record ${index + 1}`);
                return (
                  <th
                    key={record.id}
                    scope="col"
                    className="min-w-[10rem] border-l border-panel-border px-4 py-3 text-left font-medium text-text"
                  >
                    <div className="flex flex-col gap-2">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="merge-master"
                          checked={masterId === record.id}
                          onChange={() => onMasterChange(record.id)}
                          aria-label={`Record ${index + 1}`}
                        />
                        <span>{title}</span>
                      </label>
                      <Link
                        href="#select-all"
                        variant="body"
                        className="text-primary hover:underline"
                        onPress={() => onSelectAllFromRecord(record.id)}
                      >
                        Select All
                      </Link>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((field) => {
              const selectable = isMergeValueSelectable(field);
              return (
                <tr key={field.apiName} className="border-b border-row-separator">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-surface px-4 py-2 text-left font-normal text-text-muted"
                  >
                    {field.label}
                  </th>
                  {records.map((record) => {
                    const value = record.fields[field.apiName] ?? null;
                    const checked = fieldChoices[field.apiName] === record.id;
                    return (
                      <td
                        key={record.id}
                        className="border-l border-row-separator px-4 py-2 align-top"
                      >
                        <div className="flex items-start gap-2">
                          {selectable ? (
                            <input
                              type="radio"
                              name={`merge-field-${field.apiName}`}
                              checked={checked}
                              onChange={() => onFieldChoiceChange(field.apiName, record.id)}
                              aria-label={`${field.label} value choice`}
                            />
                          ) : (
                            <span className="w-4 shrink-0" aria-hidden="true" />
                          )}
                          <CellValue
                            field={field}
                            value={value}
                            ownerNames={ownerNames}
                            format={format}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {conflictsOnly && visibleRows.length === 0 ? (
        <p className="text-sm text-text-muted">No conflicting fields.</p>
      ) : null}
    </div>
  );
}

export function MergeComparisonHeaderActions({
  onCancel,
  onMerge,
  mergeDisabled,
  busy,
}: {
  onCancel: () => void;
  onMerge: () => void;
  mergeDisabled?: boolean;
  busy?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" onPress={onCancel}>
        Cancel
      </Button>
      <Button variant="primary" onPress={onMerge} isDisabled={mergeDisabled || busy}>
        Merge
      </Button>
    </div>
  );
}

export function MergeComparisonInfoButton() {
  return (
    <Button variant="icon" size="compact" aria-label="Merge information">
      <Icons.info aria-hidden className="size-4" />
    </Button>
  );
}
