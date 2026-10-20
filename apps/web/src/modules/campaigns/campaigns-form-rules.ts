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
 * Spec column order for Campaign Information (six rows in two columns).
 * Row 1: Campaign Owner (left) / Type (right)
 * Row 2: Campaign Name (left) / Status (right)
 * Row 3: Start Date (left) / End Date (right)
 * Row 4: Expected Revenue (left) / Budgeted Cost (right)
 * Row 5: Actual Cost (left) / Expected Response (right)
 * Row 6: Numbers sent (left) / (no field)
 */
export const CAMPAIGNS_FORM_INFORMATION_COLUMNS = [
  ["Owner", "Campaign_Name", "Start_Date", "Expected_Revenue", "Actual_Cost", "Num_sent"],
  ["Type", "Status", "End_Date", "Budgeted_Cost", "Expected_Response"],
] as const;

export const campaignsFormRules: FormRules = {
  owner: "Owner",
  currency: "Expected_Revenue",
  currencies: ["Expected_Revenue", "Budgeted_Cost", "Actual_Cost"],
  searchablePicklists: ["Type"],
  requiredFields: ["Type"],
  omitted: ["Connected_To__s", "Parent_Campaign", ...CAMPAIGNS_FORM_SYSTEM_FIELDS],
  defaultValues: buildCampaignsFormDefaults,
};
