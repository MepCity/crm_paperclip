import type { FieldDefinition } from "@crm/core/records";
import { isLeadInlineEditable } from "../leads/leads-inline-edit";

/** Shared editing policy; Expected Revenue cannot be edited inline (read-only derived). */
export function isDealInlineEditable(field: FieldDefinition): boolean {
  return field.apiName !== "Expected_Revenue" && isLeadInlineEditable(field);
}
