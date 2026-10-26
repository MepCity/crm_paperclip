import type { RecordData } from "@crm/core/records";

/**
 * Task completion status value.
 * Interim rule based on documented task completion flows.
 */
export const TASK_COMPLETED_STATUS = "Completed";

/**
 * Checks whether a task record is currently open.
 * Returns true if Status is not "Completed". Empty, null, or undefined Status is treated as open.
 */
export function isTaskOpen(record: RecordData): boolean {
  const status = record.fields.Status;
  return status !== TASK_COMPLETED_STATUS;
}

/**
 * Returns the patch payload to close an open task.
 * Sets Status to "Completed". Does not write other fields (Closed_Time is handled server-side).
 */
export function closeTaskPatch(): { Status: string } {
  return { Status: TASK_COMPLETED_STATUS };
}

/**
 * Visibility rule for Close Task header button (TD-05).
 * Only shown when the task is open.
 */
export function isCloseTaskButtonVisible(record: RecordData): boolean {
  return isTaskOpen(record);
}
