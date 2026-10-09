import type { FieldValue, RecordData } from "@crm/core/records";
import { LEADS_DETAIL_FIELD_API_NAMES } from "@/lib/records/leads-detail.constants";

function textValue(fields: Readonly<Record<string, FieldValue>>, apiName: string): string {
  const value = fields[apiName];
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

/** Record header identity: Full_Name title and Company subtitle when present. */
export function leadsRecordHeaderIdentity(record: RecordData): {
  title: string;
  subtitle?: string;
} {
  const title = textValue(record.fields, LEADS_DETAIL_FIELD_API_NAMES.Full_Name);
  const company = textValue(record.fields, LEADS_DETAIL_FIELD_API_NAMES.Company);
  return company.length > 0 ? { title, subtitle: company } : { title };
}
