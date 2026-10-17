import type { RecordData } from "@crm/core/records";

/**
 * Record header identity: Subject title (TD-43).
 * The task icon is an inline glyph before the title (TD-01).
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
    hasPortrait: true,
    recordNavigation: true,
  };
}
