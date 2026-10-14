import type { FieldValue, ModuleMetadata } from "@crm/core/records";
import type { FormRules } from "@/components/records/form/form-model";

export const TASKS_FORM_CREATE_TITLE = "Create Task";
export const TASKS_FORM_EDIT_TITLE = "Edit Task";

export const TASKS_FORM_STATUS_DEFAULT = "Not Started";
export const TASKS_FORM_PRIORITY_DEFAULT = "High";

/** Fields the exported layout carries but the create form never paints (`activities-form.md`). */
export const TASKS_FORM_OMITTED_FIELDS = [
  "Send_Notification_Email",
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "Closed_Time",
  "Last_Activity_Time",
  "Tag",
  "id",
] as const;

/**
 * Create defaults: Status is the first status option and Priority is High. The Who and What
 * type selectors default to Contact and Account through the lookup's first target module.
 */
export function buildTasksFormDefaults(metadata?: ModuleMetadata): Record<string, FieldValue> {
  const pick = (apiName: string, fallback: string) => {
    const options = metadata?.fields.find((f) => f.apiName === apiName)?.picklist;
    const wanted = options?.find((o) => o.storedValue === fallback);
    return wanted?.storedValue ?? options?.[0]?.storedValue ?? fallback;
  };
  return {
    Status: pick("Status", TASKS_FORM_STATUS_DEFAULT),
    Priority: pick("Priority", TASKS_FORM_PRIORITY_DEFAULT),
  };
}

export const tasksFormRules: FormRules = {
  owner: "Owner",
  omitted: TASKS_FORM_OMITTED_FIELDS,
  defaultValues: buildTasksFormDefaults,
};

/**
 * Task Information is one column, in the reference order: owner, subject, due date, Who
 * (Contact / Lead), What (Related To), status, priority, reminder, repeat.
 */
export const TASKS_FORM_INFORMATION_COLUMNS = [
  [
    "Owner",
    "Subject",
    "Due_Date",
    "Who_Id",
    "What_Id",
    "Status",
    "Priority",
    "Remind_At",
    "Recurring_Activity",
  ],
] as const;
