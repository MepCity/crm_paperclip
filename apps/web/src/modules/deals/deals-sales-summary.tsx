"use client";

import type { RecordData } from "@crm/core/records";

function formatIntegerField(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" && Number.isFinite(value)) return String(Math.trunc(value));
  return "—";
}

function formatSalesCycleDuration(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number" && Number.isFinite(value)) {
    const days = Math.trunc(value);
    return `${days} day(s)`;
  }
  return "—";
}

export function DealsSalesSummary({ record }: { record: RecordData }) {
  return (
    <div
      data-deals-sales-summary
      className="flex flex-col gap-2 px-(--size-record-rail-text-inset) pb-2"
    >
      <h3 className="text-sm font-semibold text-text-muted">SALES SUMMARY</h3>
      <div className="flex flex-col gap-1 text-md text-text">
        <div className="flex justify-between gap-2">
          <span className="text-text-muted">Lead Conversion Time</span>
          <span>{formatIntegerField(record.fields.Lead_Conversion_Time)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-text-muted">Sales Cycle Duration</span>
          <span className="text-right">
            {formatSalesCycleDuration(record.fields.Sales_Cycle_Duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
