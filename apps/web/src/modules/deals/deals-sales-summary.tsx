"use client";

import type { RecordData } from "@crm/core/records";
import { useUiTranslations } from "@/i18n/client-provider";

function formatIntegerField(value: unknown): string {
  if (value === null || value === undefined || value === "") return "NA";
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.trunc(value));
  return "NA";
}

function formatSalesCycleDuration(value: unknown): string {
  if (value === null || value === undefined || value === "") return "NA";
  if (typeof value === "number" && Number.isFinite(value)) {
    const days = Math.trunc(value);
    return `${days} day(s)`;
  }
  return "NA";
}

export function DealsSalesSummary({ record }: { record: RecordData }) {
  const t = useUiTranslations();
  return (
    <div
      data-deals-sales-summary
      className="flex flex-col gap-2 px-(--size-record-rail-text-inset) pb-2"
    >
      <h3 className="text-sm font-semibold text-text-muted">{t("records.chrome.salesSummary")}</h3>
      <div className="flex flex-col gap-1 text-md text-text">
        <p>Lead Conversion Time: {formatIntegerField(record.fields.Lead_Conversion_Time)}</p>
        <p>Sales Cycle Duration: {formatSalesCycleDuration(record.fields.Sales_Cycle_Duration)}</p>
      </div>
    </div>
  );
}
