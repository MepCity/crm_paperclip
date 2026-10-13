"use client";

import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FieldInput } from "@/components/records/form/field-input";
import { Button } from "@/components/ui/button";
import { claimOpeningFocus } from "@/components/ui/opening-focus";
import { TopAlignedModal } from "@/components/ui/top-aligned-modal";
import {
  type StageBarStage,
  type StageChangeFieldErrors,
  type StageChangeFormValues,
  StageChangeSubmitError,
} from "./types";
import "./stage-change-dialog.css";

export interface StageChangeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  stages: readonly StageBarStage[];
  initialValues: StageChangeFormValues;
  reasonForLossOptions: readonly { storedValue: string; displayValue: string }[];
  showReasonForLoss: boolean;
  onSubmit: (values: StageChangeFormValues) => Promise<void>;
  isPending?: boolean;
}

function field(
  apiName: string,
  label: string,
  dataType: FieldDefinition["dataType"],
  extra: Partial<FieldDefinition> = {},
): FieldDefinition {
  return {
    apiName,
    label,
    dataType,
    required: false,
    readOnly: false,
    massUpdate: false,
    unique: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
    ...extra,
  };
}

const amountField = field("Amount", "Amount", "currency");
const closingDateField = field("Closing_Date", "Closing Date", "date");
const stageField = field("Stage", "Stage", "picklist");
const reasonField = field("Reason_For_Loss", "Reason for Loss", "picklist");

function requiredMessage(label: string) {
  return `${label} cannot be empty.`;
}

export function StageChangeDialog({
  isOpen,
  onOpenChange,
  stages,
  initialValues,
  reasonForLossOptions,
  showReasonForLoss,
  onSubmit,
  isPending = false,
}: StageChangeDialogProps) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<StageChangeFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const stagePicklist = useMemo(
    () =>
      stages.map((stage) => ({
        storedValue: stage.value,
        displayValue: stage.label,
      })),
    [stages],
  );

  useEffect(() => {
    if (!isOpen) return;
    setValues(initialValues);
    setFieldErrors({});
    const frame = requestAnimationFrame(() => claimOpeningFocus(cancelRef.current));
    return () => cancelAnimationFrame(frame);
  }, [isOpen, initialValues]);

  const busy = isPending || submitting;

  function close() {
    if (busy) return;
    onOpenChange(false);
  }

  function patch(fieldName: keyof StageChangeFormValues, next: FieldValue) {
    setValues((current) => ({
      ...current,
      [fieldName]:
        fieldName === "amount"
          ? typeof next === "number"
            ? next
            : null
          : fieldName === "reasonForLoss"
            ? typeof next === "string"
              ? next
              : null
            : typeof next === "string"
              ? next
              : "",
    }));
    setFieldErrors((current) => {
      const { [fieldName]: _removed, ...rest } = current;
      return rest;
    });
  }

  async function submit() {
    if (busy) return;
    const nextErrors: StageChangeFieldErrors = {};
    if (!values.stage) nextErrors.stage = requiredMessage(stageField.label);
    if (!values.closingDate?.trim()) {
      nextErrors.closingDate = requiredMessage(closingDateField.label);
    }
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof StageChangeSubmitError) {
        setFieldErrors(error.fieldErrors);
        return;
      }
      throw error;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <TopAlignedModal
      isOpen={isOpen}
      isDismissable={!busy}
      aria-labelledby={titleId}
      panelClassName="stage-change-modal-panel"
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <div data-stage-change-dialog>
        <h2 id={titleId} className="stage-change-title">
          Verify Details
        </h2>
        <div className="stage-change-fields">
          <FieldInput
            field={amountField}
            value={values.amount}
            onChange={(next) => patch("amount", next)}
            errorMessage={fieldErrors.amount}
            disabled={busy}
            currencyPrefix="$"
          />
          <FieldInput
            field={closingDateField}
            value={values.closingDate}
            onChange={(next) => patch("closingDate", typeof next === "string" ? next : "")}
            errorMessage={fieldErrors.closingDate}
            disabled={busy}
          />
          <FieldInput
            field={stageField}
            value={values.stage}
            onChange={(next) => patch("stage", next)}
            errorMessage={fieldErrors.stage}
            disabled={busy}
            options={stagePicklist}
            searchable
          />
          {showReasonForLoss || stages.find((s) => s.value === values.stage)?.kind === "lost" ? (
            <FieldInput
              field={reasonField}
              value={values.reasonForLoss}
              onChange={(next) => patch("reasonForLoss", next)}
              errorMessage={fieldErrors.reasonForLoss}
              disabled={busy}
              options={reasonForLossOptions}
              searchable
            />
          ) : null}
        </div>
        <div className="stage-change-actions">
          <Button
            ref={cancelRef}
            variant="secondary"
            size="record"
            className="stage-change-action-button"
            isDisabled={busy}
            onPress={close}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="record"
            className="stage-change-action-button"
            isDisabled={busy}
            isPending={busy}
            onPress={() => void submit()}
          >
            Save
          </Button>
        </div>
      </div>
    </TopAlignedModal>
  );
}
