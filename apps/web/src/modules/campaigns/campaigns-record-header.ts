import type { RecordData } from "@crm/core/records";

/**
 * Interim (MEP-758 decides): no portrait or placeholder, Campaign_Name title,
 * previous / next record arrows on like Accounts.
 */
export function campaignsRecordHeaderIdentity(record: RecordData): {
  title: string;
  hasPortrait: false;
  recordNavigation: true;
} {
  const name = record.fields.Campaign_Name;
  return {
    title: typeof name === "string" ? name : "",
    hasPortrait: false,
    recordNavigation: true,
  };
}
