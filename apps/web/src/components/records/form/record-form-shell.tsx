"use client";

import type { FormEventHandler, ReactNode } from "react";
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
  disabled?: boolean;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

export function RecordFormShell({
  title,
  formAriaLabel,
  actionLabels,
  onCancel,
  onSaveAndNew,
  onSave,
  children,
  disabled = false,
  onSubmit,
}: RecordFormShellProps) {
  return (
    <div className="record-form-shell" data-record-form-shell>
      <header className="record-form-strip" data-record-form-strip>
        <h1 className="record-form-strip__title" data-record-form-title>
          {title}
        </h1>
        <div className="record-form-strip__actions" data-record-form-actions>
          <Button
            type="button"
            variant="secondary"
            size="formAction"
            className="record-form-strip__action record-form-strip__action--cancel"
            isDisabled={disabled}
            onPress={onCancel}
          >
            {actionLabels.cancel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="formAction"
            className="record-form-strip__action record-form-strip__action--save-new"
            isDisabled={disabled}
            onPress={onSaveAndNew}
          >
            {actionLabels.saveAndNew}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="formAction"
            className="record-form-strip__action record-form-strip__action--save"
            isDisabled={disabled}
            onPress={onSave}
          >
            {actionLabels.save}
          </Button>
        </div>
      </header>
      <div className="record-form-card" data-record-form-card>
        <form
          className="record-form-card__body"
          aria-label={formAriaLabel}
          noValidate
          onSubmit={onSubmit}
        >
          {children}
        </form>
      </div>
    </div>
  );
}
