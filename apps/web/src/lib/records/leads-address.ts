import type { FieldValue } from "@crm/core/records";
import { formatCompositeAddress } from "./composite-address";

/** Builds the single Address detail row from populated sub-fields (Leads interim rule). */
export function formatLeadsCompositeAddress(fields: Readonly<Record<string, FieldValue>>): string {
  return formatCompositeAddress("Address", fields);
}
