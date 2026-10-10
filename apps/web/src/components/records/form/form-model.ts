import type { FieldDefinition, FieldValue, ModuleMetadata, RecordInput } from "@crm/core/records";

export type FormMode = "create" | "edit";
export interface FormSectionModel {
  label: string;
  columns: FieldDefinition[][];
}

/** Placement comes from columns, never from field dictionary or sequence order. */
export function buildFormModel(metadata: ModuleMetadata, mode: FormMode): FormSectionModel[] {
  const fields = new Map(metadata.fields.map((field) => [field.apiName, field]));
  return metadata.layout.map((section) => ({
    label: section.label,
    columns: section.columns.map((column) =>
      column.flatMap((name) => {
        const field = fields.get(name);
        return field?.views[mode] ? [field] : [];
      }),
    ),
  }));
}

export function textValue(value: FieldValue | undefined): string {
  return typeof value === "string" ? value : "";
}

export function numberValue(value: FieldValue | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeFormValue(
  field: FieldDefinition,
  value: FieldValue | undefined,
): FieldValue {
  if (value === undefined || value === "" || (field.dataType === "picklist" && value === "-None-"))
    return null;
  return value;
}

/** A visible read-only field remains in the form, but never enters a write. */
export function initialFormValues(
  fields: readonly FieldDefinition[],
  values: RecordInput = {},
): Record<string, FieldValue> {
  return Object.fromEntries(
    fields.map((field) => [field.apiName, normalizeFormValue(field, values[field.apiName])]),
  );
}

function sameValue(left: FieldValue, right: FieldValue): boolean {
  if (left === right) return true;
  return (
    typeof left === "object" &&
    left !== null &&
    typeof right === "object" &&
    right !== null &&
    left.module === right.module &&
    left.id === right.id
  );
}

export function formValuesEqual(
  fields: readonly FieldDefinition[],
  left: RecordInput,
  right: RecordInput,
): boolean {
  return fields.every((field) =>
    sameValue(
      normalizeFormValue(field, left[field.apiName]),
      normalizeFormValue(field, right[field.apiName]),
    ),
  );
}

export function formPayload(
  fields: readonly FieldDefinition[],
  values: RecordInput,
  baseline?: RecordInput,
): RecordInput {
  return Object.fromEntries(
    fields.flatMap((field) => {
      if (field.readOnly || field.dataType === "profileimage") return [];
      const next = normalizeFormValue(field, values[field.apiName]);
      if (baseline && sameValue(next, normalizeFormValue(field, baseline[field.apiName])))
        return [];
      return [[field.apiName, next]];
    }),
  );
}

export interface FormRules {
  owner: string;
  prefix?: { field: string; prefix: string };
  address?: { field: string; latitude: string; longitude: string; coordinates: string };
  country?: { field: string; state: string };
  currency?: string;
  textPrefixes?: Readonly<Record<string, string>>;
  omitted?: readonly string[];
  labelLines?: Readonly<Record<string, readonly string[]>>;
}

export function formFields(
  metadata: ModuleMetadata,
  sections: readonly FormSectionModel[],
  mode: FormMode,
  rules: FormRules,
): FieldDefinition[] {
  const names = new Set(
    sections.flatMap((section) => section.columns.flat().map((f) => f.apiName)),
  );
  if (rules.prefix && names.has(rules.prefix.field)) names.add(rules.prefix.prefix);
  if (rules.address && names.has(rules.address.field)) {
    names.add(rules.address.latitude);
    names.add(rules.address.longitude);
  }
  return metadata.fields.filter(
    (field) =>
      names.has(field.apiName) && field.views[mode] && !rules.omitted?.includes(field.apiName),
  );
}

/** Address labels describe the subfield, while its parent is the fieldset legend. */
export function addressLabel(field: FieldDefinition, parent: FieldDefinition): string {
  const prefix = `${parent.label} - `;
  return field.label.startsWith(prefix) ? field.label.slice(prefix.length) : field.label;
}
