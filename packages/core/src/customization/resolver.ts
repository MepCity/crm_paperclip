import { ValidationError } from "../errors";
import type { Criteria, FieldDefinition } from "../records/contract";
import { validateCriteria } from "../records/fixture/query";
import { baselineSchema, parse, snapshotSchema } from "./schema";
import type {
  CustomizationField,
  CustomizationSnapshot,
  EffectiveModuleDefinition,
  ModuleBaseline,
} from "./types";

export function invalid(message: string): never {
  throw new ValidationError({ customization: [message] });
}
export function unique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) invalid(`Duplicate ${label}.`);
}
export function immutable<T>(value: T): T {
  if (typeof value === "object" && value !== null) {
    for (const child of Object.values(value)) immutable(child);
    Object.freeze(value);
  }
  return value;
}
export function emptySnapshot(baseline: ModuleBaseline): CustomizationSnapshot {
  return { baselineVersion: baseline.version, revision: 0, fields: [], fieldPatches: {} };
}

/** Pure resolution; no cache, clock, tenant state or input mutation. */
export function resolveEffectiveModule(
  baselineInput: ModuleBaseline,
  overlayInput?: CustomizationSnapshot,
): EffectiveModuleDefinition {
  const baseline = parse(baselineSchema, baselineInput);
  const overlay = parse(snapshotSchema, overlayInput ?? emptySnapshot(baseline));
  if (overlay.baselineVersion !== baseline.version) invalid("Baseline version mismatch.");
  for (const field of baseline.fields) {
    if (field.systemRequired && !field.required)
      invalid("System-required baseline field must be required.");
  }
  const allFields = [...baseline.fields, ...overlay.fields];
  unique(
    allFields.map((field) => field.id),
    "field identity",
  );
  unique([...allFields.map((field) => field.apiName), ...baseline.reservedApiNames], "API name");
  for (const field of overlay.fields) {
    if (
      ![
        "text",
        "textarea",
        "email",
        "phone",
        "website",
        "picklist",
        "integer",
        "currency",
        "double",
        "bigint",
        "boolean",
        "date",
        "datetime",
      ].includes(field.dataType) ||
      !baseline.customFieldTypes.includes(field.dataType)
    )
      invalid("Unsupported custom field type.");
    if (field.lookup || field.acceptsJsonArray)
      invalid("Custom lookup and opaque array semantics are not enabled.");
  }
  const byId = new Map(allFields.map((field) => [field.id, field]));
  const baselineById = new Map(baseline.fields.map((field) => [field.id, field]));
  for (const [fieldId, patch] of Object.entries(overlay.fieldPatches)) {
    const field = byId.get(fieldId);
    if (field?.lifecycle !== "active") invalid("Patch references an inactive or unknown field.");
    const original = baselineById.get(fieldId);
    for (const property of Object.keys(patch)) {
      if (original && !original.customizable.includes(property as keyof typeof patch)) {
        invalid("Field property is protected by the baseline.");
      }
    }
    if (original?.systemRequired && patch.required === false)
      invalid("Cannot relax a system-required field.");
    if (original?.readOnly && patch.readOnly === false)
      invalid("Cannot make a system-owned field writable.");
    if (original?.maxLength && patch.maxLength && patch.maxLength > original.maxLength) {
      invalid("Cannot relax a baseline length invariant.");
    }
    byId.set(fieldId, { ...field, ...patch });
  }
  const fields: CustomizationField[] = [];
  for (const field of byId.values()) {
    if (field.picklist) {
      if (field.dataType !== "picklist") invalid("Picklist constraint on an unsupported type.");
      unique(
        field.picklist.map((option) => option.storedValue),
        "picklist value",
      );
    }
    if (field.lifecycle === "active") {
      // Strip baseline policy from the effective serializable field definition.
      const {
        id,
        apiName,
        label,
        dataType,
        required,
        readOnly,
        unique: isUnique,
        massUpdate,
        views,
        lifecycle,
        maxLength,
        picklist,
        lookup,
        acceptsJsonArray,
      } = field;
      fields.push({
        id,
        apiName,
        label,
        dataType,
        required,
        readOnly,
        unique: isUnique,
        massUpdate,
        views,
        lifecycle,
        ...(maxLength !== undefined ? { maxLength } : {}),
        ...(picklist !== undefined ? { picklist } : {}),
        ...(lookup ? { lookup } : {}),
        ...(acceptsJsonArray !== undefined ? { acceptsJsonArray } : {}),
      });
    }
  }
  const active = new Map(fields.map((field) => [field.id, field]));
  const layouts = overlay.layouts ?? baseline.layouts;
  unique(
    layouts.map((layout) => layout.id),
    "layout identity",
  );
  if (layouts.length !== 1 || !layouts[0]?.isDefault)
    invalid("One default layout is required until layout assignment is defined.");
  for (const layout of layouts) {
    unique(
      layout.sections.map((section) => section.id),
      "section identity",
    );
    const placed = layout.sections.flatMap((section) => section.columns.flat());
    unique(placed, "field placement");
    for (const section of layout.sections) {
      if (
        !baseline.supportedColumnCounts.includes(section.columnCount) ||
        section.columns.length !== section.columnCount
      ) {
        invalid("Unsupported or inconsistent layout column count.");
      }
    }
    for (const id of placed)
      if (!active.has(id)) invalid("Layout references an inactive or unknown field.");
    for (const field of fields) {
      if (!field.required || baselineById.get(field.id)?.serverValue) continue;
      if (
        field.readOnly ||
        !field.views.create ||
        (!field.views.edit && baselineById.get(field.id)?.views.edit !== false) ||
        !placed.includes(field.id)
      ) {
        invalid("Required field is unreachable without a server value.");
      }
    }
  }
  const views = overlay.views ?? baseline.views;
  unique(
    views.map((view) => view.id),
    "view identity",
  );
  if (views.filter((view) => view.isDefault).length > 1) invalid("Multiple default views.");
  const queryFields = new Map<string, FieldDefinition>(
    fields.map((field) => [field.apiName, field]),
  );
  const translateCriteria = (criteria: Criteria): Criteria => {
    if ("group" in criteria) return { ...criteria, group: criteria.group.map(translateCriteria) };
    const field = active.get(criteria.field);
    if (!field) invalid("View criterion references an inactive or unknown field.");
    return { ...criteria, field: field.apiName };
  };
  for (const original of baseline.views.filter((view) => view.systemDefined)) {
    const next = views.find((view) => view.id === original.id);
    if (JSON.stringify(next) !== JSON.stringify(original)) invalid("System view is protected.");
  }
  for (const view of views) {
    if (
      view.systemDefined &&
      !baseline.views.some((original) => original.id === view.id && original.systemDefined)
    ) {
      invalid("Cannot create a system-defined view through an overlay.");
    }
    unique(view.columns, "view column");
    for (const id of [...view.columns, ...(view.sort ? [view.sort.field] : [])]) {
      if (!active.has(id)) invalid("View references an inactive or unknown field.");
    }
    if (view.criteria) validateCriteria(translateCriteria(view.criteria), queryFields);
  }
  const capabilities = Object.fromEntries(
    Object.entries(baseline.capabilities).map(([key, enabled]) => [
      key,
      enabled && baseline.engineCapabilities[key] === true,
    ]),
  );
  return immutable({
    apiName: baseline.apiName,
    singularLabel: baseline.singularLabel,
    pluralLabel: baseline.pluralLabel,
    baselineVersion: baseline.version,
    revision: overlay.revision,
    fields,
    layouts,
    views,
    capabilities,
  });
}
