import type { FieldDefinition } from "@crm/core/records";
import { isLeadInlineEditable } from "../leads/leads-inline-edit";
import { CAMPAIGNS_FORM_SYSTEM_FIELDS } from "./campaigns-form-rules";

/** Shared editing policy; system fields are never editable inline. */
export function isCampaignInlineEditable(field: FieldDefinition): boolean {
  return (
    !(CAMPAIGNS_FORM_SYSTEM_FIELDS as readonly string[]).includes(field.apiName) &&
    isLeadInlineEditable(field)
  );
}
