import type { RecordData } from "@crm/core/records";

/**
 * Temporary rule (MEP-476): a call is scheduled when Outgoing_Call_Status is
 * Scheduled or Overdue. Reschedule Call and its arrow (CD-05, CD-05.1) show only then.
 */
export function isCallScheduled(record: RecordData): boolean {
  const status = record.fields.Outgoing_Call_Status;
  return status === "Scheduled" || status === "Overdue";
}
