import type { FieldValue } from "@crm/core/records";
import { LEADS_ADDRESS_COMPOSITE_FIELD_ORDER } from "./leads-detail.constants";

/** Builds the single Address detail row from populated sub-fields (Leads interim rule). */
export function formatLeadsCompositeAddress(fields: Readonly<Record<string, FieldValue>>): string {
  const parts: string[] = [];
  for (const apiName of LEADS_ADDRESS_COMPOSITE_FIELD_ORDER) {
    const value = fields[apiName];
    if (value === null || value === undefined || value === "") continue;
    parts.push(String(value));
  }
  return parts.join(", ");
}
