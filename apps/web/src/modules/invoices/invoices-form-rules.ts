import type { FieldValue } from "@crm/core/records";
import type { FormRules } from "@/components/records/form/form-model";

export const INVOICES_FORM_CREATE_TITLE = "Create Invoice";
export const INVOICES_FORM_EDIT_TITLE = "Edit Invoice";
export const INVOICES_DELETE_CONFIRM_TITLE = "Delete Invoice";
export const INVOICES_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Invoice?";

/** System fields and autonumber excluded from inline edit. */
export const INVOICES_FORM_SYSTEM_FIELDS = [
  "Invoice_Number",
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
export const INVOICES_FORM_OMITTED_FIELDS = [
  "Invoice_Number",
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "id",
  "Last_Activity_Time",
  "Locked__s",
  "Connected_To__s",
  "Deal_Name__s",
  "Sales_Order",
  "Tag",
  "nearby_distance__s",
  "Discount_Percentage",
  "Header_Tax",
] as const;

/** Spec field order for Invoice Information (research/specs/invoices.md section 2); Sales Order and
 * Deal Name are hidden. */
export const INVOICES_FORM_INFORMATION_COLUMNS = [
  ["Owner", "Subject", "Invoice_Date", "Due_Date", "Purchase_Order"],
  ["Excise_Duty", "Sales_Commission", "Status", "Account_Name", "Contact_Name"],
] as const;

/** Today as `YYYY-MM-DD` in the user's local time zone (the form model's date shape). */
function localToday(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function buildInvoicesFormDefaults(): Record<string, FieldValue> {
  return { Status: "Created", Invoice_Date: localToday() };
}

/**
 * Invoice create / edit form rules. Subject and Account Name are required; Owner defaults to the
 * signed-in user; Status defaults to Created; Invoice Date to today. No "Edit page layout" link (no inventory chrome);
 * Save / Save and New / Cancel come from the shared shell.
 */
export const invoicesFormRules: FormRules = {
  owner: "Owner",
  initialFocus: "Owner",
  requiredFields: ["Subject", "Account_Name"],
  currencies: ["Sales_Commission"],
  fallbackColumns: {
    "Invoice Information": INVOICES_FORM_INFORMATION_COLUMNS,
  },
  omitted: INVOICES_FORM_OMITTED_FIELDS,
  defaultValues: buildInvoicesFormDefaults,
};
