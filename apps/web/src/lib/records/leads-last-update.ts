import { type FormatOptions, formatRelativeTime } from "@crm/core/format";
import type { RecordData } from "@crm/core/records";
import { LEADS_DETAIL_FIELD_API_NAMES } from "@/lib/records/leads-detail.constants";

export function formatLeadsLastUpdateLabel(
  record: RecordData,
  now: Date,
  format: FormatOptions,
): string | null {
  const modified = record.fields[LEADS_DETAIL_FIELD_API_NAMES.Modified_Time];
  if (modified === null || modified === undefined || modified === "") return null;
  const relative = formatRelativeTime(String(modified), now, format);
  return `Last Update : ${relative}`;
}
