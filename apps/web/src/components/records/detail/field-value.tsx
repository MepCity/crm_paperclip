"use client";

import type { FormatOptions } from "@crm/core/format";
import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { Link } from "@/components/ui/link";
import { EMPTY_FIELD_DISPLAY, formatFieldValue, isFieldValueEmpty } from "../field-format";

export interface FieldValueViewProps {
  field: FieldDefinition;
  value: FieldValue;
  ownerNames?: Readonly<Record<string, string>>;
  format: FormatOptions;
  /** ISO timestamp paired with `Created_By` / `Modified_By`. */
  auditTimestamp?: string | null;
}

export function FieldValueView({
  field,
  value,
  ownerNames = {},
  format,
  auditTimestamp,
}: FieldValueViewProps) {
  if (isFieldValueEmpty(field, value)) {
    return <span className="detail-field-value">{EMPTY_FIELD_DISPLAY}</span>;
  }

  const rendered = formatFieldValue(field, value, ownerNames, format, {
    auditTimestamp,
    multiline: field.dataType === "textarea",
    linkWebsite: true,
  });

  if (rendered.kind === "empty") {
    return <span className="detail-field-value">{EMPTY_FIELD_DISPLAY}</span>;
  }

  if (rendered.kind === "audit") {
    return (
      <span className="detail-field-value">
        <span>{rendered.name}</span>
        {rendered.timestamp ? (
          <span className="detail-audit-timestamp">{rendered.timestamp}</span>
        ) : null}
      </span>
    );
  }

  if (rendered.kind === "link") {
    return (
      <Link
        href={rendered.link.href}
        variant="body"
        prefetch={false}
        className="detail-field-value detail-field-value-link"
      >
        {rendered.link.text}
      </Link>
    );
  }

  if (rendered.kind === "multiline") {
    return <span className="detail-field-value detail-multiline">{rendered.text}</span>;
  }

  const text =
    field.dataType === "boolean" && value === true && rendered.kind === "text"
      ? "Yes"
      : rendered.text;
  return <span className="detail-field-value">{text}</span>;
}
