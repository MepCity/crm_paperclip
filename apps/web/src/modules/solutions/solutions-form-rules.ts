import type { FieldValue } from "@crm/core/records";
import type { FormRules } from "@/components/records/form/form-model";

export const SOLUTIONS_FORM_CREATE_TITLE = "Create Solution";
export const SOLUTIONS_FORM_EDIT_TITLE = "Edit Solution";
export const SOLUTIONS_DELETE_CONFIRM_TITLE = "Delete Solution";
export const SOLUTIONS_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Solution?";
export const SOLUTIONS_FORM_PICKLIST_NONE = "-None-";

/** System fields and autonumber are never drawn in the form. */
export const SOLUTIONS_FORM_SYSTEM_FIELDS = [
  "Solution_Number",
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "id",
  "Last_Activity_Time",
] as const;

export function buildSolutionsFormDefaults(): Record<string, FieldValue> {
  return {
    Status: "Draft",
  };
}

/**
 * Interim (MEP-841 / MEP-861). Solution Title is required by metadata;
 * Owner defaults to the signed-in user; Product Name is an unregistered module (P2 laterModule).
 */
export const solutionsFormRules: FormRules = {
  owner: "Owner",
  laterModuleFields: {
    Product_Name: "P2",
  },
  omitted: ["Connected_To__s", ...SOLUTIONS_FORM_SYSTEM_FIELDS],
  defaultValues: buildSolutionsFormDefaults,
};
