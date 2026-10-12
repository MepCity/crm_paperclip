"use client";

import type { FormatOptions } from "@crm/core/format";
import type { FieldDefinition, RecordData, RecordId } from "@crm/core/records";
import { CellValue } from "@/components/records/list/cell-value";
import { Checkbox } from "@/components/ui/checkbox";

export function MergeMatchingTable({
  records,
  columns,
  linkField,
  selectedIds,
  anchorId,
  maxSelected,
  ownerNames,
  format,
  emptyMessage,
  onToggle,
}: {
  records: readonly RecordData[];
  columns: readonly FieldDefinition[];
  linkField: string;
  selectedIds: ReadonlySet<RecordId>;
  anchorId: RecordId;
  maxSelected: number;
  ownerNames: Readonly<Record<string, string>>;
  format: FormatOptions;
  emptyMessage: string;
  onToggle: (id: RecordId, checked: boolean) => void;
}) {
  if (records.length === 0) {
    return (
      <div
        className="border border-panel-border bg-surface py-8 text-center text-sm text-text-empty"
        data-part="empty"
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-auto border border-panel-border">
      <table className="w-full min-w-[48rem] border-collapse text-sm" aria-label="Matching records">
        <thead>
          <tr className="border-b border-panel-border bg-surface-muted text-left">
            <th scope="col" className="w-12 px-3 py-2 font-semibold">
              {" "}
            </th>
            {columns.map((column) => (
              <th key={column.apiName} scope="col" className="px-3 py-2 font-semibold text-text">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const selected = selectedIds.has(record.id);
            const atCap = selectedIds.size >= maxSelected;
            const disabled = !selected && atCap;
            const label = String(record.fields[linkField] ?? "Record");
            return (
              <tr key={record.id} className="border-b border-row-separator">
                <td className="px-3 py-2">
                  <Checkbox
                    label={label}
                    hideLabel
                    isSelected={selected}
                    isDisabled={disabled || (selected && record.id === anchorId)}
                    onChange={(checked) => onToggle(record.id, checked)}
                  />
                </td>
                {columns.map((column) => (
                  <td key={column.apiName} className="px-3 py-2 align-top text-text">
                    <CellValue
                      field={column}
                      value={record.fields[column.apiName] ?? null}
                      ownerNames={ownerNames}
                      format={format}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
