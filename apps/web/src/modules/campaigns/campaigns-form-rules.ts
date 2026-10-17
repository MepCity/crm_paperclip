import type { FieldValue } from "@crm/core/records";
import type { FormRules } from "@/components/records/form/form-model";

export const CAMPAIGNS_FORM_CREATE_TITLE = "Create Campaign";
export const CAMPAIGNS_FORM_EDIT_TITLE = "Edit Campaign";
export const CAMPAIGNS_DELETE_CONFIRM_TITLE = "Delete Campaign";
export const CAMPAIGNS_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Campaign?";
export const CAMPAIGNS_FORM_PICKLIST_NONE = "-None-";

/** System fields are never drawn in the form. */
export const CAMPAIGNS_FORM_SYSTEM_FIELDS = [
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "id",
  "Last_Activity_Time",
] as const;

export function buildCampaignsFormDefaults(): Record<string, FieldValue> {
  return { Type: CAMPAIGNS_FORM_PICKLIST_NONE, Status: CAMPAIGNS_FORM_PICKLIST_NONE };
}

/**
 * Interim (MEP-759 decides). Campaign Name and Type are required by the layout (the service
 * reads that); Owner defaults to the signed-in user; money fields carry the currency prefix.
 */
export const campaignsFormRules: FormRules = {
  owner: "Owner",
  currency: "Expected_Revenue",
  currencies: ["Expected_Revenue", "Budgeted_Cost", "Actual_Cost"],
  omitted: ["Connected_To__s", ...CAMPAIGNS_FORM_SYSTEM_FIELDS],
  defaultValues: buildCampaignsFormDefaults,
};
