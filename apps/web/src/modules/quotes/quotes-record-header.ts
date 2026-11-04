import type { RecordData } from "@crm/core/records";

/** No portrait; Subject is the title; previous / next record arrows on. */
export function quotesRecordHeaderIdentity(record: RecordData): {
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
