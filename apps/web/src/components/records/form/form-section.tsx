"use client";

import type { ReactNode } from "react";
import "./form.css";

export type FormSectionLayout = "single" | "two-column";

export interface FormSectionProps {
  title?: string;
  layout?: FormSectionLayout;
  children: ReactNode;
}

export function FormSection({ title, layout = "single", children }: FormSectionProps) {
  return (
    <section
      className="record-form-section"
      data-record-form-section
      data-record-form-section-layout={layout}
    >
      {title ? (
        <h2 className="record-form-section__title" data-record-form-section-title>
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
