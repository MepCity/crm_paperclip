"use client";

import type { FormatOptions } from "@crm/core/format";
import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { useLayoutEffect, useRef, useState } from "react";
import { FieldPencil } from "./field-pencil";
import { FieldValueView } from "./field-value";

export interface DetailFieldRowProps {
  field: FieldDefinition;
  value: FieldValue;
  ownerNames?: Readonly<Record<string, string>>;
  format: FormatOptions;
  auditTimestamp?: string | null;
  layout: "business" | "details" | "details-full" | "details-full-description";
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
      : layout === "details-full-description"
        ? "detail-details-row-full detail-details-row-description"
        : layout === "details-full"
          ? "detail-details-row-full"
          : "detail-details-row";

  const valueWrapRef = useRef<HTMLDivElement>(null);
  const [wrappedValue, setWrappedValue] = useState(false);

  useLayoutEffect(() => {
    if (layout === "business") {
      setWrappedValue(false);
      return;
    }
    const wrap = valueWrapRef.current;
    if (!wrap) {
      setWrappedValue(false);
      return;
    }

    const measure = () => {
      const valueEl = wrap.querySelector(".detail-field-value");
      if (!valueEl) {
        setWrappedValue(false);
        return;
      }
      const lineHeight = Number.parseFloat(getComputedStyle(valueEl).lineHeight);
      const isAuditValue = valueEl.querySelector(".detail-audit-timestamp") !== null;
      setWrappedValue(!isAuditValue && valueEl.scrollHeight > lineHeight + 1);
    };

    measure();
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [layout]);

  return (
    <div
      className={rowClass}
      data-detail-field={field.apiName}
      data-detail-wrapped={wrappedValue ? "true" : undefined}
    >
      <div className="detail-field-label">{field.label}</div>
      <div className="detail-field-value-wrap" ref={valueWrapRef}>
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
