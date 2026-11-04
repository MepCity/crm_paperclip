"use client";

import { useState } from "react";
import { LineItemEditor } from "./line-item-editor";
import {
  type HeaderState,
  headerFromValues,
  headerToValues,
  type LineRow,
  rowsFromValue,
  rowsToValue,
} from "./line-item-model";

export interface LineItemsFieldProps {
  /** Subform API name, e.g. `Quoted_Items`. */
  field: string;
  title: string;
  values: Readonly<Record<string, unknown>>;
  disabled?: boolean;
  /** Form errors keyed by field name; `Quoted_Items[0].Quantity` style keys are mapped. */
  errors: Readonly<Record<string, string>>;
  onChange: (writes: Record<string, unknown>) => void;
}

/** Binds the editor to a record form: rows + header live locally, writes go to form values. */
export function LineItemsField({
  field,
  title,
  values,
  disabled,
  errors,
  onChange,
}: LineItemsFieldProps) {
  const [rows, setRows] = useState<LineRow[]>(() => rowsFromValue(values[field]));
  const [header, setHeader] = useState<HeaderState>(() => headerFromValues(values));
  const mapped: Record<string, string> = {};
  for (const [key, message] of Object.entries(errors)) {
    if (key === field) mapped[""] = message;
    else if (key.startsWith(`${field}[`)) mapped[key.slice(field.length)] = message;
    else if (key === "Discount" || key === "Adjustment" || key === "Discount_Percentage")
      mapped[key] = message;
  }
  return (
    <LineItemEditor
      title={title}
      rows={rows}
      header={header}
      disabled={disabled}
      errors={mapped}
      onRowsChange={(next) => {
        setRows(next);
        onChange({ [field]: rowsToValue(next) });
      }}
      onHeaderChange={(next) => {
        setHeader(next);
        onChange(headerToValues(next));
      }}
    />
  );
}
