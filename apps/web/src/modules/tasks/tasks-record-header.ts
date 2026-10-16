import type { RecordData } from "@crm/core/records";

/**
 * Record header identity: Subject title (TD-43).
 * No portrait / placeholder icon is used.
 * Previous / next record arrows are present (V07).
 */
export function tasksRecordHeaderIdentity(
  record: RecordData,
  _context?: unknown,
): {
  title: string;
  subtitle?: string;
  hasPortrait?: boolean;
  recordNavigation?: boolean;
} {
  const title = typeof record.fields.Subject === "string" ? (record.fields.Subject as string) : "";

  return {
    title,
    hasPortrait: false,
    recordNavigation: true,
  };
}
