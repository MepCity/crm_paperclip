"use client";

import type { ReactNode } from "react";
import "./form.css";

export interface FormGridProps {
  left: ReactNode;
  right: ReactNode;
}

export function FormGrid({ left, right }: FormGridProps) {
  return (
    <div className="record-form-grid" data-record-form-grid>
      <div className="record-form-column record-form-column--left" data-record-form-column="left">
        {left}
      </div>
      <div className="record-form-column record-form-column--right" data-record-form-column="right">
        {right}
      </div>
    </div>
  );
}
