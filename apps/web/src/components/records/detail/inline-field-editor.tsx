"use client";

import { isAppError, type ValidationError } from "@crm/core/errors";
import type { FieldDefinition, FieldValue, RecordInput } from "@crm/core/records";
import { useEffect, useId, useRef, useState } from "react";
import { Icons } from "@/components/ui/icon";
import { FieldInput, type OwnerOption } from "../form/field-input";
import { formPayload } from "../form/form-model";
import { validateRecordForm } from "../form/form-validation";
import "./inline-field-editor.css";

export interface InlineFieldEditorProps {
  field: FieldDefinition;
  value: FieldValue;
  users?: readonly OwnerOption[];
  onSave: (input: RecordInput) => Promise<void>;
  onCancel: () => void;
  onComplete: () => void;
  initialError?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function InlineFieldEditor({
  field,
  value,
  users,
  onSave,
  onCancel,
  onComplete,
  initialError,
  disabled,
  autoFocus = true,
}: InlineFieldEditorProps) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState(initialError);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const root = useRef<HTMLDivElement>(null);
  const saveLatest = useRef<() => Promise<void>>(async () => {});
  const cancelLatest = useRef<() => void>(() => {});
  const controlId = useId();
  const busy = saving || disabled;
  cancelLatest.current = () => {
    if (!busy) onCancel();
  };
  useEffect(() => {
    mounted.current = true;
    if (autoFocus && field.dataType !== "picklist" && field.dataType !== "ownerlookup") {
      root.current?.querySelector<HTMLElement>("input, textarea")?.focus();
    }
    // Overlay Escape can stop propagation before React's portal capture handler.
    // Observe only this input and the dialog referenced by its trigger.
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !(event.target instanceof Node)) return;
      const dialogId = root.current
        ?.querySelector("[aria-controls]")
        ?.getAttribute("aria-controls");
      const dialog = dialogId ? document.getElementById(dialogId) : null;
      if (!root.current?.contains(event.target) && !dialog?.contains(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      cancelLatest.current();
    };
    document.addEventListener("keydown", handleEscape, true);
    return () => {
      document.removeEventListener("keydown", handleEscape, true);
      mounted.current = false;
    };
  }, [field.dataType, autoFocus]);

  async function save() {
    if (inFlight.current || disabled) return;
    const values = { [field.apiName]: draft };
    const input = formPayload([field], values, { [field.apiName]: value });
    if (Object.keys(input).length === 0) {
      onComplete();
      return;
    }
    const message = validateRecordForm([field], values, (item) => item.label)[field.apiName];
    if (message) {
      setError(message);
      return;
    }
    inFlight.current = true;
    setSaving(true);
    setError(undefined);
    try {
      await onSave(input);
      if (mounted.current) onComplete();
    } catch (failure) {
      if (mounted.current) {
        const messages =
          isAppError(failure) && failure.code === "validation"
            ? (failure as ValidationError).fieldErrors[field.apiName]
            : undefined;
        setError(
          messages?.join(" ") ||
            (failure instanceof Error ? failure.message : "Something went wrong."),
        );
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  saveLatest.current = save;

  return (
    <div
      ref={root}
      className="detail-inline-editor"
      aria-busy={busy || undefined}
      onKeyDownCapture={(event) => {
        if (
          event.key === "Enter" &&
          event.target instanceof HTMLInputElement &&
          field.dataType !== "ownerlookup" &&
          field.dataType !== "picklist"
        ) {
          event.preventDefault();
          event.target.blur();
          setTimeout(() => {
            if (mounted.current) void saveLatest.current();
          }, 0);
        }
      }}
    >
      <div className="detail-inline-control">
        <FieldInput
          id={controlId}
          field={field}
          value={draft}
          onChange={setDraft}
          users={users}
          hideLabel
          inline={field.dataType === "picklist"}
          defaultOpen={field.dataType === "picklist"}
          errorMessage={error}
          disabled={busy}
        />
      </div>
      <div className="detail-inline-actions">
        <button
          type="button"
          className="detail-inline-save"
          aria-label="Save"
          disabled={busy}
          onClick={() => void save()}
        >
          <Icons.inlineCheck aria-hidden />
        </button>
        <button
          type="button"
          className="detail-inline-cancel"
          aria-label="Cancel"
          disabled={busy}
          onClick={onCancel}
        >
          <svg viewBox="0 0 12 12" aria-hidden>
            <path d="m2 2 8 8M10 2l-8 8" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
