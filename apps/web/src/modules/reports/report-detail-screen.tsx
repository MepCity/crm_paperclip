"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import type { MessageKey, MessageValues } from "@/i18n/catalogs";
import { useUiTranslations } from "@/i18n/client-provider";
import { fixtureReportsPort } from "./fixture-port";
import type { ReportDetail, ReportsPort } from "./port";
import { reportPath } from "./reports-screen";

function relativeUpdate(
  updatedAt: string,
  now: number,
  t: (key: MessageKey, values?: MessageValues) => string,
) {
  const minutes = Math.max(0, Math.floor((now - Date.parse(updatedAt)) / 60000));
  if (minutes < 1) return t("modules.reports.updatedJustNow");
  if (minutes < 60) return t("modules.reports.updatedMinAgo", { count: minutes });
  return t("modules.reports.updatedHourAgo", { count: Math.floor(minutes / 60) });
}

export function ReportDetailScreen({
  orgSlug,
  reportId,
  port = fixtureReportsPort,
  initialReport,
}: {
  orgSlug: string;
  reportId: string;
  port?: ReportsPort;
  initialReport?: ReportDetail | null;
}) {
  const t = useUiTranslations();
  const [report, setReport] = useState<ReportDetail | null>(initialReport ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">(
    initialReport !== undefined ? (initialReport ? "ready" : "missing") : "loading",
  );
  const [now, setNow] = useState(() => Date.now());
  const load = useCallback(() => {
    let active = true;
    port
      .getReport(reportId)
      .then((row) => {
        if (!active) return;
        setReport(row);
        setNow(Date.now());
        setStatus(row ? "ready" : "missing");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [port, reportId]);
  useEffect(() => {
    if (initialReport !== undefined) return;
    load();
  }, [load, initialReport]);

  if (status === "loading") return <p role="status">{t("modules.reports.loadingDetail")}</p>;
  if (status === "error") return <p role="alert">{t("modules.reports.errorDetail")}</p>;
  if (status === "missing" || !report) return <p role="alert">{t("modules.reports.notFound")}</p>;

  return (
    <section
      aria-label={t("modules.reports.reportDetail")}
      className="min-h-full bg-bg text-md text-text"
    >
      <span id="reports-unavailable" hidden>
        {t("modules.reports.notAvailableYet")}
      </span>
      <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-3 py-3">
        <div className="flex items-center gap-3">
          <Link href={reportPath(orgSlug)} aria-label={t("modules.reports.backToReports")}>
            <Icons.arrowLeft className="size-4" aria-hidden />
          </Link>
          <h1 className="text-xl font-semibold">{report.name}</h1>
          <Button
            variant="icon"
            aria-label={t("modules.reports.reportInformation")}
            aria-disabled="true"
            aria-describedby="reports-unavailable"
          >
            <Icons.info className="size-4" aria-hidden />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="icon"
            aria-label={t("modules.reports.refreshReport")}
            onPress={() => load()}
          >
            <Icons.refresh className="size-4" aria-hidden />
          </Button>
          <span className="text-text-muted">{relativeUpdate(report.updatedAt, now, t)}</span>
          <div className="inline-flex items-center">
            <button
              type="button"
              aria-disabled="true"
              aria-describedby="reports-unavailable"
              className="h-8 rounded-l border border-border bg-surface px-3 text-text"
            >
              {t("common.actions.edit")}
            </button>
            <button
              type="button"
              aria-label={t("modules.reports.reportMenu")}
              aria-disabled="true"
              aria-describedby="reports-unavailable"
              className="inline-flex h-8 items-center rounded-r border border-l-0 border-border bg-surface px-2 text-text"
            >
              <Icons.chevronDown className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </header>
      <div className="flex items-center justify-between gap-3 px-3 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="recordSelector"
            aria-label={t("modules.reports.filter")}
            aria-disabled="true"
            aria-describedby="reports-unavailable"
            className="gap-2"
          >
            <Icons.filter className="size-4" aria-hidden />
            {t("modules.reports.filter")}
            <span
              data-testid="filter-active-indicator"
              className="size-2 rounded-full bg-primary"
              aria-hidden
            />
          </Button>
          <button
            type="button"
            aria-disabled="true"
            aria-describedby="reports-unavailable"
            className="px-1 text-text"
          >
            {t("modules.reports.filterByDate")}
          </button>
          <button
            type="button"
            aria-disabled="true"
            aria-describedby="reports-unavailable"
            className="px-1 text-primary"
          >
            {t("modules.reports.clear")}
          </button>
        </div>
        <button
          type="button"
          aria-disabled="true"
          aria-describedby="reports-unavailable"
          className="px-1 text-text underline decoration-dashed underline-offset-4"
        >
          {t("modules.reports.showDetails")}
        </button>
      </div>
      <div className="overflow-x-auto border border-border bg-surface">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-bg">
              {report.headings.map((heading, index) => (
                <th
                  key={heading}
                  scope="col"
                  className={`border-r border-border px-3 py-2 font-semibold last:border-r-0 ${index > 0 ? "text-right" : "text-left"}`}
                >
                  <span
                    className={`inline-flex items-center gap-1 ${index > 0 ? "flex-row-reverse" : ""}`}
                  >
                    {heading}
                    {index > 0 && <Icons.sort className="size-3 text-text-muted" aria-hidden />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row) => (
              <tr key={row[0]} className="border-b border-border">
                {row.map((value, index) => (
                  <td
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed column order
                    key={index}
                    className={`border-r border-border px-3 py-3 last:border-r-0 ${index > 0 ? "text-right" : ""}`}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {report.rows.length === 0 && (
          <p className="py-12 text-center text-text-muted">{t("modules.reports.noDataFound")}</p>
        )}
      </div>
    </section>
  );
}
