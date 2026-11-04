import type { FieldValue } from "@crm/core/records";
import type { FormRules } from "@/components/records/form/form-model";

export const QUOTES_FORM_CREATE_TITLE = "Create Quote";
export const QUOTES_FORM_EDIT_TITLE = "Edit Quote";
export const QUOTES_DELETE_CONFIRM_TITLE = "Delete Quote";
export const QUOTES_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Quote?";

/** System fields and autonumber excluded from inline edit. */
export const QUOTES_FORM_SYSTEM_FIELDS = [
  "Quote_Number",
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "id",
  "Last_Activity_Time",
  "Locked__s",
  "Sub_Total",
  "Grand_Total",
] as const;

/** System and calculated fields omitted from the create and edit forms. */
export const QUOTES_FORM_OMITTED_FIELDS = [
  "Quote_Number",
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "id",
  "Last_Activity_Time",
  "Locked__s",
  "Connected_To__s",
  "Tag",
  "nearby_distance__s",
  "Discount_Percentage",
  "Header_Tax",
] as const;

/** Spec field order for Quote Information (research/specs/quotes.md section 2). */
export const QUOTES_FORM_INFORMATION_COLUMNS = [
  ["Owner", "Subject", "Quote_Stage", "Team", "Carrier"],
  ["Deal_Name", "Valid_Till", "Contact_Name", "Account_Name"],
] as const;

export function buildQuotesFormDefaults(): Record<string, FieldValue> {
  return { Quote_Stage: "Draft" };
}

/**
 * Quote create / edit form rules. Subject and Account Name are required; Owner defaults to the
 * signed-in user; Quote Stage defaults to Draft. No "Edit page layout" link (no inventory chrome);
 * Save / Save and New / Cancel come from the shared shell.
 */
export const quotesFormRules: FormRules = {
  owner: "Owner",
  initialFocus: "Owner",
  requiredFields: ["Subject", "Account_Name"],
  fallbackColumns: {
    "Quote Information": QUOTES_FORM_INFORMATION_COLUMNS,
  },
  omitted: QUOTES_FORM_OMITTED_FIELDS,
  defaultValues: buildQuotesFormDefaults,
};
