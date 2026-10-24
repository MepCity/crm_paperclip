import type { FieldDefinition, FieldValue, RecordData } from "@crm/core/records";
import type { DetailFieldEntry } from "@/components/records/detail/details-card";
import { formatCompositeAddress } from "./composite-address";

export interface CompositeAddressDetailRule {
  parentApiName: string;
  parentLabel?: string;
  displayFieldApiNames?: readonly string[];
}

export function buildCompositeAddressDetailFields(
  rules: readonly CompositeAddressDetailRule[],
  moduleFields: readonly FieldDefinition[],
  record: RecordData,
  withDetailLabel: (field: FieldDefinition) => FieldDefinition = (field) => field,
): DetailFieldEntry[] {
  const byName = new Map(moduleFields.map((field) => [field.apiName, field]));
  const activeValues = Object.fromEntries(
    Object.entries(record.fields).filter(([name]) => {
      const field = byName.get(name);
      return !field || field.views.view;
    }),
  );
  return rules.flatMap((rule) => {
    const addressField = byName.get(rule.parentApiName);
    if (addressField && !addressField.views.view) return [];
    if (!addressField && moduleFields.length > 0) return [];
    const field =
      addressField ??
      ({
        apiName: rule.parentApiName,
        label: rule.parentLabel ?? rule.parentApiName,
        dataType: "textarea",
        required: false,
        readOnly: false,
        unique: false,
        massUpdate: false,
        views: { view: true, create: true, edit: true, quickCreate: false },
      } satisfies FieldDefinition);
    const composite = formatCompositeAddress(
      rule.parentApiName,
      activeValues,
      rule.displayFieldApiNames,
    );
    return [
      {
        column: "full" as const,
        field: withDetailLabel(field),
        value: composite.length > 0 ? composite : null,
      },
    ];
  });
}

export function fieldOnRecord(record: RecordData, apiName: string): FieldValue | undefined {
  if (!Object.hasOwn(record.fields, apiName)) return undefined;
  return record.fields[apiName];
}
