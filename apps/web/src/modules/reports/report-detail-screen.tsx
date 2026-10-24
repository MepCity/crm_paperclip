"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { fixtureReportsPort } from "./fixture-port";
import type { ReportDetail, ReportsPort } from "./port";
import { reportPath } from "./reports-screen";

function relativeUpdate(updatedAt: string, now: number) {
  const minutes = Math.max(0, Math.floor((now - Date.parse(updatedAt)) / 60000));
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  return `Updated ${Math.floor(minutes / 60)} h ago`;
}

export function ReportDetailScreen({
  orgSlug,
  reportId,
  port = fixtureReportsPort,
}: {
  orgSlug: string;
  reportId: string;
  port?: ReportsPort;
}) {
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
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
  useEffect(() => load(), [load]);

  if (status === "loading") return <p role="status">Loading report…</p>;
  if (status === "error") return <p role="alert">Report could not be loaded.</p>;
  if (status === "missing" || !report) return <p role="alert">Report not found.</p>;

  return (
    <section aria-label="Report detail" className="min-h-full bg-bg text-md text-text">
      <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-3 py-3">
        <div className="flex items-center gap-3">
          <Link href={reportPath(orgSlug)} aria-label="Back to Reports">
            <Icons.arrowLeft className="size-4" aria-hidden />
          </Link>
          <h1 className="text-xl font-semibold">{report.name}</h1>
          <Button variant="icon" aria-label="Report information" aria-disabled="true">
            <Icons.info className="size-4" aria-hidden />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="icon" aria-label="Refresh report" onPress={() => load()}>
            <Icons.refresh className="size-4" aria-hidden />
          </Button>
          <span className="text-text-muted">{relativeUpdate(report.updatedAt, now)}</span>
          <div className="inline-flex items-center">
            <button
              type="button"
              aria-disabled="true"
              className="h-8 rounded-l border border-border bg-surface px-3 text-text"
            >
              Edit
            </button>
            <button
              type="button"
              aria-label="Report menu"
              aria-disabled="true"
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
            aria-label="Filter"
            aria-disabled="true"
            className="gap-2"
          >
            <Icons.filter className="size-4" aria-hidden />
            Filter
            <span
              data-testid="filter-active-indicator"
              className="size-2 rounded-full bg-primary"
              aria-hidden
            />
          </Button>
          <button type="button" aria-disabled="true" className="px-1 text-text">
            Filter By Date
          </button>
          <button type="button" aria-disabled="true" className="px-1 text-primary">
            Clear
          </button>
        </div>
        <button
          type="button"
          aria-disabled="true"
          className="px-1 text-text underline decoration-dashed underline-offset-4"
        >
          Show Details
        </button>
      </div>
      <div className="overflow-x-auto border border-border bg-surface">
        <table aria-label="Report results" className="w-full border-collapse text-left">
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
          <p className="py-12 text-center text-text-muted">No Data Found</p>
        )}
      </div>
    </section>
  );
}
