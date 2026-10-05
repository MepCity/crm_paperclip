"use client";

import { type ReactNode, useId } from "react";
import "./form.css";

export interface FieldGroupProps {
  name: string;
  children: ReactNode;
}

export function FieldGroup({ name, children }: FieldGroupProps) {
  const legendId = useId();
  return (
    <fieldset
      className="record-form-field-group"
      aria-labelledby={legendId}
      data-record-form-field-group
    >
      <legend className="record-form-field-group__legend" id={legendId}>
        {name}
      </legend>
      <div className="record-form-field-group__body">{children}</div>
    </fieldset>
  );
}
