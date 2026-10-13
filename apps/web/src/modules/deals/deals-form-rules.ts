import type { FormRules } from "@/components/records/form/form-model";

export const DEALS_FORM_CREATE_TITLE = "Create Deal";
export const DEALS_FORM_EDIT_TITLE = "Edit Deal";

export const DEALS_FORM_STAGE_DEFAULT = "Qualification";
export const DEALS_FORM_PROBABILITY_DEFAULT = 10;
export const DEALS_FORM_PICKLIST_NONE = "-None-";

export const DEALS_FORM_DEFAULTS = {
  Stage: DEALS_FORM_STAGE_DEFAULT,
  Probability: DEALS_FORM_PROBABILITY_DEFAULT,
  Type: DEALS_FORM_PICKLIST_NONE,
  Lead_Source: DEALS_FORM_PICKLIST_NONE,
} as const;

export const dealsFormRules: FormRules = {
  owner: "Owner",
  currency: "Amount",
  currencies: ["Amount", "Expected_Revenue"],
  omitted: ["Connected_To__s", "Reason_For_Loss__s"],
  defaultValues: DEALS_FORM_DEFAULTS,
};

/**
 * Spec column order for Deal Information (seven rows in two columns).
 * Row 1: Deal Owner (left) / Amount (right)
 * Row 2: Deal Name (left) / Closing Date (right)
 * Row 3: Account Name (left) / Stage (right)
 * Row 4: Type (left) / Probability (%) (right)
 * Row 5: Next Step (left) / Expected Revenue (right)
 * Row 6: Lead Source (left) / Campaign Source (right)
 * Row 7: Contact Name (left) / (no field)
 */
export const DEALS_FORM_INFORMATION_COLUMNS = [
  ["Owner", "Deal_Name", "Account_Name", "Type", "Next_Step", "Lead_Source", "Contact_Name"],
  ["Amount", "Closing_Date", "Stage", "Probability", "Expected_Revenue", "Campaign_Source"],
] as const;
