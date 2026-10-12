"use client";

import type { ReactNode } from "react";
import "./form.css";

export type FormSectionLayout = "single" | "two-column";

export interface FormSectionProps {
  title?: string;
  layout?: FormSectionLayout;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function FormSection({
  title,
  layout = "single",
  headerActions,
  children,
}: FormSectionProps) {
  return (
    <section
      className="record-form-section"
      data-record-form-section
      data-record-form-section-layout={layout}
    >
      {title ? (
        <div className="record-form-section__header" data-record-form-section-header>
          <h2 className="record-form-section__title" data-record-form-section-title>
            {title}
          </h2>
          {headerActions ? (
            <div className="record-form-section__header-actions">{headerActions}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
