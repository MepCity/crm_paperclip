"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import "./form.css";

export interface RecordFormShellActionLabels {
  cancel: string;
  saveAndNew: string;
  save: string;
}

export interface RecordFormShellProps {
  title: string;
  formAriaLabel: string;
  actionLabels: RecordFormShellActionLabels;
  onCancel?: () => void;
  onSaveAndNew?: () => void;
  onSave?: () => void;
  children: ReactNode;
}

export function RecordFormShell({
  title,
  formAriaLabel,
  actionLabels,
  onCancel,
  onSaveAndNew,
  onSave,
  children,
}: RecordFormShellProps) {
  return (
    <div className="record-form-shell" data-record-form-shell>
      <header className="record-form-strip" data-record-form-strip>
        <h1 className="record-form-strip__title" data-record-form-title>
          {title}
        </h1>
        <div className="record-form-strip__actions" data-record-form-actions>
          <Button type="button" variant="secondary" size="formAction" onPress={onCancel}>
            {actionLabels.cancel}
          </Button>
          <Button type="button" variant="secondary" size="formAction" onPress={onSaveAndNew}>
            {actionLabels.saveAndNew}
          </Button>
          <Button type="button" variant="primary" size="formAction" onPress={onSave}>
            {actionLabels.save}
          </Button>
        </div>
      </header>
      <div className="record-form-card" data-record-form-card>
        <form className="record-form-card__body" aria-label={formAriaLabel}>
          {children}
        </form>
      </div>
    </div>
  );
}
