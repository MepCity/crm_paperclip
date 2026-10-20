import type { RecordData } from "@crm/core/records";

/**
 * Interim (MEP-839 / MEP-861 / MEP-863): no portrait or placeholder, Subject title,
 * previous / next record arrows on like Campaigns.
 */
export function casesRecordHeaderIdentity(record: RecordData): {
  title: string;
  hasPortrait: false;
  recordNavigation: true;
} {
  const name = record.fields.Subject;
  return {
    title: typeof name === "string" ? name : "",
    hasPortrait: false,
    recordNavigation: true,
  };
}
