import type { FieldValue } from "@crm/core/records";
import type { FormRules } from "@/components/records/form/form-model";

export const SOLUTIONS_FORM_CREATE_TITLE = "Create Solution";
export const SOLUTIONS_FORM_EDIT_TITLE = "Edit Solution";
export const SOLUTIONS_DELETE_CONFIRM_TITLE = "Delete Solution";
export const SOLUTIONS_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Solution?";
export const SOLUTIONS_FORM_PICKLIST_NONE = "-None-";

/**
 * System fields and autonumber excluded from inline edit.
 * Solution_Number is drawn locked in the form (SF-05/SF-06), so it is excluded from form omitted.
 */
export const SOLUTIONS_FORM_SYSTEM_FIELDS = [
  "Solution_Number",
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "id",
  "Last_Activity_Time",
] as const;

/** System fields omitted from the create and edit forms. */
export const SOLUTIONS_FORM_OMITTED_SYSTEM_FIELDS = [
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "id",
  "Last_Activity_Time",
] as const;

/**
 * Spec column order for Solution Information (SF-05–SF-11).
 * Left column: Solution Number (SF-05, locked), Solution Title (SF-07, required), Status (SF-08)
 * Right column: Solution Owner (SF-09/SF-10), Product Name (SF-11/SF-12, P2 laterModule)
 */
export const SOLUTIONS_FORM_INFORMATION_COLUMNS = [
  ["Solution_Number", "Solution_Title", "Status"],
  ["Owner", "Product_Name"],
] as const;

export function buildSolutionsFormDefaults(): Record<string, FieldValue> {
  return {
    Status: "Draft",
  };
}

/**
 * Solution create / edit form rules (MEP-896).
 * Solution Title is required by metadata; Question and Answer are layout-required (SF-13, SF-14);
 * Solution Number is drawn locked (SF-05, SF-06) and preserved in edit;
 * Owner defaults to the signed-in user and receives initial focus (SF-09, SF-10);
 * Status picklist defaults to Draft (SF-08.1);
 * Product Name is an unregistered module lookup (P2 laterModule, SF-11);
 * Published, Add Comment, Comments, image section, and system audit fields are omitted (item 5).
 */
export const solutionsFormRules: FormRules = {
  owner: "Owner",
  initialFocus: "Owner",
  laterModuleFields: {
    Product_Name: "P2",
  },
  requiredFields: ["Solution_Title", "Question", "Answer"],
  readOnlyFields: ["Solution_Number"],
  fallbackColumns: {
    "Solution Information": SOLUTIONS_FORM_INFORMATION_COLUMNS,
  },
  omitted: [
    "Connected_To__s",
    "Published",
    "Add_Comment",
    "Comments",
    "No_of_comments",
    "Tag",
    ...SOLUTIONS_FORM_OMITTED_SYSTEM_FIELDS,
  ],
  omittedSections: ["Comment Information", "Solution Image", "Record Image"],
  defaultValues: buildSolutionsFormDefaults,
};
