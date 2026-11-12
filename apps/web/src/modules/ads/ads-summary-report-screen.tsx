"use client";

import type { AdsSummary } from "@crm/core/ads";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { MessageKey } from "@/i18n/catalogs";
import { useUiTranslations } from "@/i18n/client-provider";
import type { ReportDetail, ReportsPort } from "@/modules/reports/port";
import { ReportDetailScreen } from "@/modules/reports/report-detail-screen";
import { fetchAdsSummary } from "./api";

export const ADS_SUMMARY_REPORT_ID = "ads-summary";

export interface AdsSummaryRange {
  from?: string;
  to?: string;
}

type Translate = (key: MessageKey) => string;

const amountFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Turns the aggregated summary into the generic report table (one row per keyword bucket + total). */
export function summaryToReport(summary: AdsSummary, t: Translate, now = new Date()): ReportDetail {
  const rows = summary.rows.map((row) => [
    [
      row.campaignName ?? t("modules.adsSummary.noCampaign"),
      row.adGroupName ?? t("modules.adsSummary.noGroup"),
      row.keywordName ?? t("modules.adsSummary.noKeyword"),
    ].join(" › "),
    String(row.leads),
    String(row.contacts),
    String(row.deals),
    amountFormat.format(row.dealAmount),
  ]);
  if (rows.length > 0)
    rows.push([
      t("modules.adsSummary.grandTotal"),
      String(summary.totals.leads),
      String(summary.totals.contacts),
      String(summary.totals.deals),
      amountFormat.format(summary.totals.dealAmount),
    ]);
  return {
    id: ADS_SUMMARY_REPORT_ID,
    name: t("modules.adsSummary.title"),
    description: null,
    folder: t("modules.adsSummary.folder"),
    lastAccessedDate: null,
    createdBy: null,
    headings: [
      t("modules.adsSummary.columns.path"),
      t("modules.adsSummary.columns.leads"),
      t("modules.adsSummary.columns.contacts"),
      t("modules.adsSummary.columns.deals"),
      t("modules.adsSummary.columns.dealAmount"),
    ],
    rows,
    updatedAt: now.toISOString(),
  };
}

export function AdsSummaryReportScreen({
  orgSlug,
  load,
}: {
  orgSlug: string;
  load?: (range: AdsSummaryRange) => Promise<AdsSummary>;
}) {
  const t = useUiTranslations();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [applied, setApplied] = useState<AdsSummaryRange>({});
  const [empty, setEmpty] = useState(false);
  // Latest loader and translator without re-creating the port on every render.
  const deps = useRef({ orgSlug, load, t });
  deps.current = { orgSlug, load, t };

  // A new port only per applied range: that is what makes the report screen reload.
  const port = useMemo<ReportsPort>(
    () => ({
      async getReport() {
        const current = deps.current;
        const summary = await (current.load
          ? current.load(applied)
          : fetchAdsSummary(current.orgSlug, applied));
        setEmpty(summary.rows.length === 0);
        return summaryToReport(summary, current.t);
      },
      async listReports() {
        return [];
      },
    }),
    [applied],
  );

  const toolbar = (
    <form
      className="flex items-end gap-3"
      data-testid="ads-summary-filter"
      onSubmit={(event) => {
        event.preventDefault();
        setApplied({ ...(from ? { from } : {}), ...(to ? { to } : {}) });
      }}
    >
      <label className="flex items-center gap-2 text-text">
        {t("modules.adsSummary.from")}
        <input
          type="date"
          name="from"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className="h-8 rounded border border-border bg-surface px-2 text-text"
        />
      </label>
      <label className="flex items-center gap-2 text-text">
        {t("modules.adsSummary.to")}
        <input
          type="date"
          name="to"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          className="h-8 rounded border border-border bg-surface px-2 text-text"
        />
      </label>
      <Button variant="secondary" type="submit" data-testid="ads-summary-apply">
        {t("modules.adsSummary.apply")}
      </Button>
      <button
        type="button"
        className="px-1 text-primary"
        onClick={() => {
          setFrom("");
          setTo("");
          setApplied({});
        }}
      >
        {t("modules.adsSummary.clear")}
      </button>
    </form>
  );

  return (
    <div data-testid="ads-summary-report">
      <ReportDetailScreen
        orgSlug={orgSlug}
        reportId={ADS_SUMMARY_REPORT_ID}
        port={port}
        toolbar={toolbar}
      />
      {empty ? (
        <p className="px-3 py-6 text-sm text-text-muted" data-testid="ads-summary-empty">
          {t("modules.adsSummary.empty")}
        </p>
      ) : null}
    </div>
  );
}
