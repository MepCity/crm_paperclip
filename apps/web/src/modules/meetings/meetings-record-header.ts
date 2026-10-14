import type { RecordData } from "@crm/core/records";

/**
 * Record header identity: Event_Title as title (MD-06 only rule: Edit is first header action).
 * No portrait — Meetings record detail does not show a portrait placeholder.
 * Previous / next record arrows are present (MD-08, MD-09).
 */
export function meetingsRecordHeaderIdentity(
  record: RecordData,
  _context?: unknown,
): {
  title: string;
  subtitle?: string;
  hasPortrait?: boolean;
  recordNavigation?: boolean;
} {
  const title =
    typeof record.fields.Event_Title === "string" ? (record.fields.Event_Title as string) : "";

  return {
    title,
    hasPortrait: false,
    recordNavigation: true,
  };
}
