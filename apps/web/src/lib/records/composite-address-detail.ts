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
  const activeValues = Object.fromEntries(
    Object.entries(record.fields).filter(([name]) =>
      moduleFields.some((field) => field.apiName === name && field.views.view),
    ),
  );
  const byName = new Map(moduleFields.map((field) => [field.apiName, field]));
  return rules.flatMap((rule) => {
    const field = byName.get(rule.parentApiName);
    if (!field?.views.view) return [];
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
