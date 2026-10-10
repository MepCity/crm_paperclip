"use client";

import { isAppError, ValidationError } from "@crm/core/errors";
import type { FieldDefinition, FieldValue, ModuleApiName, RecordId } from "@crm/core/records";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FieldInput, type OwnerOption } from "@/components/records/form/field-input";
import { normalizeFormValue } from "@/components/records/form/form-model";
import { Button } from "@/components/ui/button";
import { RecordChoice } from "@/components/ui/record-choice";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import { useMassUpdate } from "@/lib/api/client/hooks";
import "./mass-update-dialog.css";

export interface MassUpdateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  module: ModuleApiName;
  recordIds: readonly RecordId[];
  fields: readonly FieldDefinition[];
  users?: readonly OwnerOption[];
  onSuccess: () => void;
}

function requiredEmptyMessage(field: FieldDefinition): string {
  return `${field.label} cannot be empty.`;
}

function isEmptyValue(field: FieldDefinition, value: FieldValue | undefined): boolean {
  const normalized = normalizeFormValue(field, value);
  return normalized === null;
}

export function MassUpdateDialog({
  isOpen,
  onOpenChange,
  module,
  recordIds,
  fields,
  users = [],
  onSuccess,
}: MassUpdateDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [selectedApiName, setSelectedApiName] = useState<string | null>(null);
  const [value, setValue] = useState<FieldValue | undefined>(undefined);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const massUpdate = useMassUpdate(module);

  const selectedField = useMemo(
    () => fields.find((field) => field.apiName === selectedApiName) ?? null,
    [fields, selectedApiName],
  );

  useEffect(() => {
    if (!isOpen) return;
    setSelectedApiName(null);
    setValue(undefined);
    setFieldError(null);
    setGeneralError(null);
    const frame = requestAnimationFrame(() => cancelRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  function close() {
    if (massUpdate.isPending) return;
    onOpenChange(false);
  }

  function onFieldChange(apiName: string | null) {
    setSelectedApiName(apiName);
    setValue(undefined);
    setFieldError(null);
    setGeneralError(null);
  }

  const fieldOptions = useMemo(
    () =>
      fields.map((field) => ({
        value: field.apiName,
        label: field.label,
      })),
    [fields],
  );

  const busy = massUpdate.isPending;
  const updateEnabled = Boolean(selectedField) && !busy;

  async function submit() {
    if (!selectedField || busy) return;
    setGeneralError(null);
    if (selectedField.required && isEmptyValue(selectedField, value)) {
      setFieldError(requiredEmptyMessage(selectedField));
      return;
    }
    setFieldError(null);
    const payload = {
      [selectedField.apiName]: normalizeFormValue(selectedField, value),
    };
    try {
      await massUpdate.mutateAsync({ ids: recordIds, input: payload });
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      if (error instanceof ValidationError) {
        const fieldMessages = error.fieldErrors[selectedField.apiName];
        if (fieldMessages?.length) {
          setFieldError(fieldMessages.join(" "));
          return;
        }
        const dataMessages = error.fieldErrors.data;
        if (dataMessages?.length) {
          setGeneralError(dataMessages.join(" "));
          return;
        }
        const first = Object.values(error.fieldErrors).flat()[0];
        setGeneralError(first ?? error.message);
        return;
      }
      setGeneralError(
        isAppError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : "Update failed.",
      );
    }
  }

  const panelClassName = [
    "mass-update-modal-panel",
    fieldError || generalError ? "mass-update-modal-panel--grow" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <TopAlignedModal
      isOpen={isOpen}
      isDismissable={!busy}
      aria-labelledby={titleId}
      panelClassName={panelClassName}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <div data-mass-update-dialog>
        <h2 id={titleId} className="mass-update-title">
          Mass Update
        </h2>
        <div className="mass-update-field-row">
          <div className="mass-update-field-selector">
            <RecordChoice
              id="mass-update-field"
              label="Field"
              hideLabel
              value={selectedApiName}
              onChange={(next) => onFieldChange(next)}
              options={[
                { value: null, label: "Select a field" },
                ...fieldOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                })),
              ]}
              mutedEmpty
            />
          </div>
          <div className="mass-update-value-cell">
            {selectedField ? (
              <FieldInput
                field={selectedField}
                value={value ?? null}
                onChange={setValue}
                errorMessage={fieldError ?? undefined}
                hideLabel
                disabled={busy}
                users={users}
                options={selectedField.picklist}
                searchable={selectedField.dataType === "picklist"}
              />
            ) : (
              <div
                className="mass-update-value-placeholder"
                aria-hidden="true"
                data-part="value-placeholder"
              />
            )}
          </div>
        </div>
        {generalError ? (
          <p className="mass-update-general-error" role="alert">
            {generalError}
          </p>
        ) : null}
        <div className="mass-update-actions">
          <Button
            ref={cancelRef}
            variant="secondary"
            size="record"
            className="mass-update-cancel"
            isDisabled={busy}
            onPress={close}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="record"
            className="mass-update-update"
            isDisabled={!updateEnabled}
            isPending={busy}
            onPress={() => void submit()}
          >
            Update
          </Button>
        </div>
      </div>
    </TopAlignedModal>
  );
}
