import type {
  FieldDefinition,
  FieldValue,
  ModuleMetadata,
  RecordData,
  RecordInput,
} from "@crm/core/records";

export type FormMode = "create" | "edit";
export interface FormSectionModel {
  label: string;
  columns: FieldDefinition[][];
}

/** Placement comes from columns, never from field dictionary or sequence order. */
export function buildFormModel(
  metadata: ModuleMetadata,
  mode: FormMode,
  rules?: Pick<FormRules, "viewOverrides" | "readOnlyFields">,
): FormSectionModel[] {
  const fields = new Map(metadata.fields.map((field) => [field.apiName, field]));
  return metadata.layout.map((section) => ({
    label: section.label,
    columns: section.columns.map((column) =>
      column.flatMap((name) => {
        const field = fields.get(name);
        return field ? fieldForMode(field, mode, rules) : [];
      }),
    ),
  }));
}

function fieldForMode(
  field: FieldDefinition,
  mode: FormMode,
  rules?: Pick<FormRules, "viewOverrides" | "readOnlyFields">,
): FieldDefinition[] {
  const isReadOnlyEdit = mode === "edit" && Boolean(rules?.readOnlyFields?.includes(field.apiName));
  if (fieldInView(field, mode, rules) || isReadOnlyEdit) {
    return [isReadOnlyEdit ? { ...field, readOnly: true } : field];
  }
  return [];
}

/** A field is in a form mode when its export view says so, unless a rule overrides that view. */
export function fieldInView(
  field: FieldDefinition,
  mode: FormMode,
  rules?: Pick<FormRules, "viewOverrides">,
): boolean {
  return rules?.viewOverrides?.[field.apiName]?.[mode] ?? field.views[mode];
}

/** Screen-order overrides when service layout columns do not match the reference form. */
export function applySectionColumnOverrides(
  sections: readonly FormSectionModel[],
  overrides: Readonly<Record<string, readonly (readonly string[])[]>> | undefined,
  metadata: ModuleMetadata,
  mode: FormMode,
  rules?: Pick<FormRules, "viewOverrides" | "readOnlyFields">,
): FormSectionModel[] {
  if (!overrides) return [...sections];
  const fields = new Map(metadata.fields.map((field) => [field.apiName, field]));
  return sections.map((section) => {
    const override = overrides[section.label];
    if (!override) return section;
    return {
      label: section.label,
      columns: override.map((column) =>
        column.flatMap((name) => {
          const field = fields.get(name);
          return field ? fieldForMode(field, mode, rules) : [];
        }),
      ),
    };
  });
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
  // A `bigint` value is digit text from the service to the payload: a JavaScript number would round
  // a long integer away. A blank entry clears the field, and text is trimmed so retyping the same
  // digits is not read as a change. Anything that is not text is left untouched for `form-validation`
  // to report, so a stored value is never dropped here.
  if (field.dataType === "bigint") {
    if (typeof value !== "string") return value;
    const digits = value.trim();
    return digits === "" ? null : digits;
  }
  if (field.dataType === "lookup" && typeof value === "object" && value !== null) {
    if (!("id" in value) || typeof value.id !== "string" || value.id.trim() === "") {
      return null;
    }
  }
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
  // ALARM / RRULE carry opaque plain objects, compared by content.
  if (
    typeof left === "object" &&
    left !== null &&
    typeof right === "object" &&
    right !== null &&
    !("module" in left) &&
    !("module" in right)
  )
    return JSON.stringify(left) === JSON.stringify(right);
  return (
    typeof left === "object" &&
    left !== null &&
    typeof right === "object" &&
    right !== null &&
    "module" in left &&
    "module" in right &&
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

export interface AddressFormRule {
  field: string;
  latitude: string;
  longitude: string;
  coordinates: string;
  country: string;
  state: string;
  /** Writable sub-fields in render/copy/clear order when metadata names are not suffix-derived. */
  subfields?: readonly string[];
}

export interface NumberLimits {
  min?: number;
  max?: number;
}

/** Picker shape for one lookup field, when it differs from the target module's own configuration. */
export interface LookupPickerRule {
  chrome?: "interim" | "observed";
  searchLabel?: string;
}

/** A picklist write refills a numeric field with the selected option's `stage.probability`. */
export interface StageProbabilityRule {
  stage: string;
  probability: string;
}

/**
 * A field that stays out of the form until the loaded record's stage option carries one of the
 * listed `stage.category` values.
 */
export interface StageConditionalField {
  field: string;
  stage: string;
  categories: readonly string[];
}

/** What a rule set shows or requires for the values typed so far. */
export interface FormDynamicState {
  /** Fields not painted, validated or written while the current values hold. */
  hidden?: readonly string[];
  hiddenSections?: readonly string[];
  /** Fields whose requirement differs from the export (`true` required, `false` optional). */
  required?: Readonly<Record<string, boolean>>;
}

export interface FormRules {
  owner: string;
  /** Per-mode view overrides for fields whose export view disagrees with the reference form. */
  viewOverrides?: Readonly<Record<string, Partial<Record<FormMode, boolean>>>>;
  /** Row label shown instead of the export label (also used in validation messages). */
  labelOverrides?: Readonly<Record<string, string>>;
  /** Duration text fields (`MM:SS`) entered as a minutes box and a seconds box. */
  durationFields?: readonly string[];
  /** Visibility and requirement that follow the values typed so far. */
  dynamic?: (values: Readonly<Record<string, FieldValue | undefined>>) => FormDynamicState;
  prefix?: { field: string; prefix: string };
  address?: AddressFormRule;
  addresses?: readonly AddressFormRule[];
  country?: { field: string; state: string };
  countries?: readonly { field: string; state: string }[];
  currency?: string;
  currencies?: readonly string[];
  textPrefixes?: Readonly<Record<string, string>>;
  omitted?: readonly string[];
  /** Fields the service hides in edit that the reference edit form still draws (read-only ones). */
  editShownFields?: readonly string[];
  omittedSections?: readonly string[];
  labelLines?: Readonly<Record<string, readonly string[]>>;
  /** Picklists whose reference panel paints a search field above the options (AF-13.1). */
  searchablePicklists?: readonly string[];
  stageProbability?: StageProbabilityRule;
  numberLimits?: Readonly<Record<string, NumberLimits>>;
  stageConditionalFields?: readonly StageConditionalField[];
  /** The end of each pair may not be earlier than its start (Meetings: From and To). */
  ranges?: readonly { start: string; end: string }[];
  /** A checked flag switches the listed date-time fields to a day-only entry. */
  allDay?: { flag: string; fields: readonly string[] };
  /** Record modules a participants field can pick from. */
  participantModules?: Readonly<Record<string, readonly string[]>>;
  /** Fields drawn in place but inert until the named module ships. */
  laterModuleFields?: Readonly<Record<string, import("@/components/ui/later-module").ModuleKey>>;

  lookupPickers?: Readonly<Record<string, LookupPickerRule>>;
  /** Activity lookups whose module selector replaces the static row label. */
  lookupLabelFields?: readonly string[];
  /** Subdued off-state appearance; selection and editability are unchanged. */
  subduedToggles?: readonly string[];
  /** Fields marked required by layout rules even when not system-mandatory in metadata. */
  requiredFields?: readonly string[];
  /** Fields rendered read-only in the form even in edit mode when metadata marks edit: false. */
  readOnlyFields?: readonly string[];
  /** Field column order overrides when service layout columns do not match the reference form. */
  fallbackColumns?: Readonly<Record<string, readonly (readonly string[])[]>>;
  /** Initial field to focus when opening create form (defaults to owner). */
  initialFocus?: string;
  defaultValues?:
    | Readonly<Record<string, FieldValue>>
    | ((metadata?: ModuleMetadata) => Readonly<Record<string, FieldValue>>);
}

function stageCategoryMatches(
  rule: StageConditionalField,
  metadata: ModuleMetadata,
  record: RecordData | undefined,
): boolean {
  const value = record?.fields[rule.stage];
  if (typeof value !== "string") return false;
  const option = metadata.fields
    .find((field) => field.apiName === rule.stage)
    ?.picklist?.find((item) => item.storedValue === value);
  return Boolean(option?.stage?.category && rule.categories.includes(option.stage.category));
}

/**
 * Resolves the rules for one loaded form. A stage-conditional field stays omitted outside edit —
 * a create form has no record stage to read — and stays omitted in edit unless its stage option
 * carries one of the listed categories.
 */
export function resolveFormRules(
  rules: FormRules,
  context: { mode: FormMode; metadata: ModuleMetadata; record?: RecordData },
): FormRules {
  const conditional = rules.stageConditionalFields;
  if (!conditional?.length) return rules;
  const omitted = [...(rules.omitted ?? [])];
  for (const rule of conditional) {
    if (stageCategoryMatches(rule, context.metadata, context.record)) continue;
    if (!omitted.includes(rule.field)) omitted.push(rule.field);
  }
  return { ...rules, omitted };
}

/** The probability a stage write drags into its paired field, or undefined when nothing applies. */
export function stageProbabilityWrite(
  rules: FormRules,
  metadata: ModuleMetadata,
  name: string,
  value: FieldValue,
): { field: string; value: number } | undefined {
  const rule = rules.stageProbability;
  if (!rule || rule.stage !== name || typeof value !== "string") return undefined;
  const option = metadata.fields
    .find((field) => field.apiName === rule.stage)
    ?.picklist?.find((item) => item.storedValue === value);
  const probability = option?.stage?.probability;
  return typeof probability === "number"
    ? { field: rule.probability, value: probability }
    : undefined;
}

export function formFields(
  metadata: ModuleMetadata,
  sections: readonly FormSectionModel[],
  mode: FormMode,
  rules: FormRules,
): FieldDefinition[] {
  const visibleSections = rules.omittedSections?.length
    ? sections.filter((section) => !rules.omittedSections?.includes(section.label))
    : sections;
  const names = new Set(
    visibleSections.flatMap((section) => section.columns.flat().map((f) => f.apiName)),
  );
  if (rules.prefix && names.has(rules.prefix.field)) names.add(rules.prefix.prefix);
  for (const address of addressRulesList(rules)) {
    if (names.has(address.field)) {
      names.add(address.latitude);
      names.add(address.longitude);
    }
  }
  return metadata.fields
    .filter(
      (field) =>
        names.has(field.apiName) &&
        (fieldInView(field, mode, rules) ||
          (mode === "edit" && rules.readOnlyFields?.includes(field.apiName))) &&
        !rules.omitted?.includes(field.apiName),
    )
    .map((field) =>
      mode === "edit" && rules.readOnlyFields?.includes(field.apiName)
        ? { ...field, readOnly: true }
        : field,
    );
}

export function addressRulesList(rules: FormRules): readonly AddressFormRule[] {
  if (rules.addresses?.length) return rules.addresses;
  if (rules.address) return [rules.address];
  return [];
}

/** Address labels describe the subfield, while its parent is the fieldset legend. */
export function addressLabel(field: FieldDefinition, parent: FieldDefinition): string {
  const prefix = `${parent.label} - `;
  return field.label.startsWith(prefix) ? field.label.slice(prefix.length) : field.label;
}
