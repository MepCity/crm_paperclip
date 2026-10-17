import type { RecordData } from "@crm/core/records";

/**
 * Interim (MEP-758 decides): no portrait or placeholder, Campaign_Name title,
 * previous / next record arrows off.
 */
export function campaignsRecordHeaderIdentity(record: RecordData): {
  title: string;
  hasPortrait: false;
  recordNavigation: false;
} {
  const name = record.fields.Campaign_Name;
  return {
    title: typeof name === "string" ? name : "",
    hasPortrait: false,
    recordNavigation: false,
  };
}
