import type { FieldValue } from "@crm/core/records";
import type { FormRules } from "@/components/records/form/form-model";

export const CASES_FORM_CREATE_TITLE = "Create Case";
export const CASES_FORM_EDIT_TITLE = "Edit Case";
export const CASES_DELETE_CONFIRM_TITLE = "Delete Case";
export const CASES_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Case?";
export const CASES_FORM_PICKLIST_NONE = "-None-";

/** System fields and autonumber are never drawn in the form. */
export const CASES_FORM_SYSTEM_FIELDS = [
  "Case_Number",
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
 * Interim (MEP-841 / MEP-861). Status, Case Origin and Subject are required by metadata;
 * Owner defaults to the signed-in user; Product Name is an unregistered module (P2 laterModule).
 */
export const casesFormRules: FormRules = {
  owner: "Owner",
  laterModuleFields: {
    Product_Name: "P2",
  },
  omitted: ["Connected_To__s", ...CASES_FORM_SYSTEM_FIELDS],
  defaultValues: buildCasesFormDefaults,
};
