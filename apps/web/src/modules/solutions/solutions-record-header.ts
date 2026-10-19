import type { RecordData } from "@crm/core/records";

/**
 * Interim (MEP-840 / MEP-861 / MEP-863): no portrait or placeholder, Solution_Title title,
 * previous / next record arrows on like Campaigns.
 */
export function solutionsRecordHeaderIdentity(record: RecordData): {
  title: string;
  hasPortrait: false;
  recordNavigation: true;
} {
  const name = record.fields.Solution_Title;
  return {
    title: typeof name === "string" ? name : "",
    hasPortrait: false,
    recordNavigation: true,
  };
}
