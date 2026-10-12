"use client";

import type { ReactNode } from "react";
import "./form.css";

export type FormRowColumn = "left" | "right" | "full";

export interface FormRowProps {
  label: ReactNode;
  controlId: string;
  column: FormRowColumn;
  children: ReactNode;
}

export function FormRow({ label, controlId, column, children }: FormRowProps) {
  const rowClass =
    column === "full"
      ? "record-form-row record-form-row--full"
      : `record-form-row record-form-row--${column}`;
  return (
    <div className={rowClass} data-record-form-row data-record-form-row-column={column}>
      <label className="record-form-row__label" htmlFor={controlId}>
        {label}
      </label>
      <div className="record-form-row__control" data-record-form-control-slot>
        {children}
      </div>
    </div>
  );
}
