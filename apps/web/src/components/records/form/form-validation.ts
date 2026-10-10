import type { FieldDefinition, FieldValue } from "@crm/core/records";
import { normalizeFormValue, textValue } from "./form-model";

export function validationEmptyMessage(label: string): string {
  return `${label} cannot be empty.`;
}

export function validationFormatMessage(label: string): string {
  return `Please enter a valid ${label}.`;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailFormatValid(value: string): boolean {
  if (typeof document !== "undefined") {
    const probe = document.createElement("input");
    probe.type = "email";
    probe.value = value;
    return probe.checkValidity();
  }
  return EMAIL_PATTERN.test(value);
}

function skippedField(field: FieldDefinition): boolean {
  return (
    field.readOnly ||
    field.dataType === "profileimage" ||
    field.dataType === "lookup" ||
    field.dataType === "multi_module_lookup" ||
    field.dataType === "datetime" ||
    field.dataType === "bigint"
  );
}

function validateField(
  field: FieldDefinition,
  value: FieldValue | undefined,
  label: string,
): string | undefined {
  if (skippedField(field)) return undefined;
  const normalized = normalizeFormValue(field, value);
  if (field.required && normalized === null) return validationEmptyMessage(label);
  if (normalized === null) return undefined;

  if (field.dataType === "email") {
    const text = textValue(value);
    if (text && !isEmailFormatValid(text)) return validationFormatMessage(label);
  }

  if (field.dataType === "integer") {
    if (typeof value === "number" && !Number.isInteger(value))
      return validationFormatMessage(label);
  }

  if (field.dataType === "double" || field.dataType === "currency") {
    if (typeof value === "number" && !Number.isFinite(value)) return validationFormatMessage(label);
  }

  return undefined;
}

export function validateRecordForm(
  fields: readonly FieldDefinition[],
  values: Record<string, FieldValue | undefined>,
  resolveLabel: (field: FieldDefinition) => string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const message = validateField(field, values[field.apiName], resolveLabel(field));
    if (message) errors[field.apiName] = message;
  }
  return errors;
}
