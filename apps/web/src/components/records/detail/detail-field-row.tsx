"use client";

import type { FormatOptions } from "@crm/core/format";
import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { FieldPencil } from "./field-pencil";
import { FieldValueView } from "./field-value";

export interface DetailFieldRowProps {
  field: FieldDefinition;
  value: FieldValue;
  ownerNames?: Readonly<Record<string, string>>;
  format: FormatOptions;
  auditTimestamp?: string | null;
  layout: "business" | "details" | "details-full";
  onEdit?: (apiName: string) => void;
}

export function DetailFieldRow({
  field,
  value,
  ownerNames,
  format,
  auditTimestamp,
  layout,
  onEdit,
}: DetailFieldRowProps) {
  const rowClass =
    layout === "business"
      ? "detail-business-row"
      : layout === "details-full"
        ? "detail-details-row-full"
        : "detail-details-row";

  return (
    <div className={rowClass} data-detail-field={field.apiName}>
      <div className="detail-field-label">{field.label}</div>
      <div className="detail-field-value-wrap">
        <FieldValueView
          field={field}
          value={value}
          ownerNames={ownerNames}
          format={format}
          auditTimestamp={auditTimestamp}
        />
        {onEdit ? (
          <FieldPencil label={`Edit ${field.label}`} onClick={() => onEdit(field.apiName)} />
        ) : null}
      </div>
    </div>
  );
}
