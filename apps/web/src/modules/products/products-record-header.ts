import type { RecordData } from "@crm/core/records";

export function productsRecordHeaderIdentity(record: RecordData): {
  title: string;
  hasPortrait: false;
  recordNavigation: true;
} {
  const name = record.fields.Product_Name;
  return {
    title: typeof name === "string" ? name : "",
    hasPortrait: false,
    recordNavigation: true,
  };
}
