"use client";

import type { FormatOptions } from "@crm/core/format";
import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { useId, useLayoutEffect, useRef, useState } from "react";
import { FieldPencil } from "./field-pencil";
import { FieldValueView } from "./field-value";
import { useInlineEdit } from "./inline-edit-context";
import { InlineFieldEditor } from "./inline-field-editor";

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
  const inline = useInlineEdit();
  const rowId = useId();
  const editable = inline?.eligible(field) ?? false;
  const editing = editable && inline?.activeId === rowId;
  const valueButton = useRef<HTMLButtonElement>(null);
  function close() {
    inline?.activate(null);
    requestAnimationFrame(() => valueButton.current?.focus());
  }
  const edit = editable
    ? () => inline?.activate(rowId)
    : onEdit
      ? () => onEdit(field.apiName)
      : undefined;
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
  const [wrappedLink, setWrappedLink] = useState(false);

  useLayoutEffect(() => {
    if (layout === "business" || editing) {
      setWrappedValue(false);
      setWrappedLink(false);
      return;
    }
    const wrap = valueWrapRef.current;
    if (!wrap) {
      setWrappedValue(false);
      return;
    }

    const measure = () => {
      const valueEl = wrap.querySelector(".detail-field-value, .detail-field-value-link");
      if (!valueEl) {
        setWrappedValue(false);
        setWrappedLink(false);
        return;
      }
      const lineHeight = Number.parseFloat(getComputedStyle(valueEl).lineHeight);
      const isAuditValue = valueEl.querySelector(".detail-audit-timestamp") !== null;
      const isLink = valueEl.classList.contains("detail-field-value-link");
      const wraps = !isAuditValue && valueEl.scrollHeight > lineHeight + 1;
      setWrappedValue(wraps);
      setWrappedLink(wraps && isLink);
    };

    measure();
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [layout, editing]);

  return (
    <div
      className={rowClass}
      data-detail-field={field.apiName}
      data-detail-wrapped={wrappedValue ? "true" : undefined}
      data-detail-wrapped-link={wrappedLink ? "true" : undefined}
    >
      <div className="detail-field-label">{field.label}</div>
      <div className="detail-field-value-wrap" ref={valueWrapRef}>
        {editing && inline ? (
          <InlineFieldEditor
            key={rowId}
            field={field}
            value={value}
            users={inline.users}
            onSave={inline.save}
            onCancel={close}
            onComplete={close}
          />
        ) : (
          <>
            {editable && field.dataType !== "website" && field.dataType !== "email" ? (
              <button
                ref={valueButton}
                type="button"
                className="detail-inline-value-button"
                aria-label={`Edit ${field.label} value`}
                onClick={edit}
              >
                <FieldValueView
                  field={field}
                  value={value}
                  ownerNames={ownerNames}
                  format={format}
                  auditTimestamp={auditTimestamp}
                />
              </button>
            ) : (
              <FieldValueView
                field={field}
                value={value}
                ownerNames={ownerNames}
                format={format}
                auditTimestamp={auditTimestamp}
              />
            )}
            {edit ? <FieldPencil label={`Edit ${field.label}`} onClick={edit} /> : null}
          </>
        )}
      </div>
    </div>
  );
}
