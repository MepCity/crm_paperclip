import { type FormatOptions, formatRelativeTime } from "@crm/core/format";
import type { RecordData } from "@crm/core/records";
import { translator } from "@/i18n/catalogs";
import { LEADS_DETAIL_FIELD_API_NAMES } from "@/modules/leads/leads-detail.constants";

export function formatLeadsLastUpdateLabel(
  record: RecordData,
  now: Date,
  format: FormatOptions,
): string | null {
  const modified = record.fields[LEADS_DETAIL_FIELD_API_NAMES.Modified_Time];
  if (modified === null || modified === undefined || modified === "") return null;
  const relative = formatRelativeTime(String(modified), now, format);
  return format.language === "tr"
    ? translator("tr")("records.detail.lastUpdate", { time: relative })
    : `Last Update : ${relative}`;
}
