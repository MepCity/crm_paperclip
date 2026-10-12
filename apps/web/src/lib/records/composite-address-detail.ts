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
  return rules.flatMap((rule) => {
    const composite = formatCompositeAddress(
      rule.parentApiName,
      record.fields,
      rule.displayFieldApiNames,
    );
    const addressField = byName.get(rule.parentApiName);
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
