import type { FieldValue } from "@crm/core/records";
import type { FormRules } from "@/components/records/form/form-model";

export const CASES_FORM_CREATE_TITLE = "Create Case";
export const CASES_FORM_EDIT_TITLE = "Edit Case";
export const CASES_DELETE_CONFIRM_TITLE = "Delete Case";
export const CASES_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Case?";
export const CASES_FORM_PICKLIST_NONE = "-None-";

/** System fields are never drawn in the form (Case Number is drawn locked). */
export const CASES_FORM_SYSTEM_FIELDS = [
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "id",
  "Last_Activity_Time",
] as const;

export function buildCasesFormDefaults(): Record<string, FieldValue> {
  return {
    Status: "New",
    Priority: CASES_FORM_PICKLIST_NONE,
    Type: CASES_FORM_PICKLIST_NONE,
    Case_Reason: CASES_FORM_PICKLIST_NONE,
    Case_Origin: CASES_FORM_PICKLIST_NONE,
  };
}

/**
 * Spec column order for Case Information (eight rows in two columns).
 * Row 1: Case Number (locked) / Case Owner
 * Row 2: Product Name / Status
 * Row 3: Type / Priority
 * Row 4: Case Origin / Case Reason
 * Row 5: Related To / Subject
 * Row 6: Account Name / Reported By
 * Row 7: Deal Name / Email
 * Row 8: Phone / (no field)
 */
export const CASES_FORM_INFORMATION_COLUMNS = [
  [
    "Case_Number",
    "Product_Name",
    "Type",
    "Case_Origin",
    "Related_To",
    "Account_Name",
    "Deal_Name",
    "Phone",
  ],
  ["Owner", "Status", "Priority", "Case_Reason", "Subject", "Reported_By", "Email"],
] as const;

/**
 * Status, Case Origin and Subject are required by metadata; Owner defaults to the signed-in
 * user; Product Name is an unregistered module (P2 laterModule, no picker drawn). Case Number
 * is drawn locked and blank on create. Interim (not observed): edit = create form filled with
 * the record, and no Email requirement when Case Origin is Email.
 */
export const casesFormRules: FormRules = {
  owner: "Owner",
  readOnlyFields: ["Case_Number"],
  laterModuleFields: {
    Product_Name: "P2",
  },
  omittedSections: ["Comment Information"],
  omitted: [
    "Connected_To__s",
    "Add_Comment",
    "Comments",
    "No_of_comments",
    "Tag",
    "Locked__s",
    ...CASES_FORM_SYSTEM_FIELDS,
  ],
  defaultValues: buildCasesFormDefaults,
};
