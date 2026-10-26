"use client";

import { DOTTED_DAY_FIRST_FORMAT, formatDate } from "@crm/core/format";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { TextField } from "@/components/ui/text-field";
import { fixtureReportsPort } from "./fixture-port";
import type { ReportDefinition, ReportsPort } from "./port";
import { ReportsCategorySelector } from "./reports-category-selector";

export function reportPath(orgSlug: string, id?: string) {
  const root = `/crm/${encodeURIComponent(orgSlug)}/tab/Reports`;
  return id ? `${root}/${encodeURIComponent(id)}` : root;
}

export function ReportsScreen({
  orgSlug,
  port = fixtureReportsPort,
  initialReports,
}: {
  orgSlug: string;
  port?: ReportsPort;
  initialReports?: readonly ReportDefinition[];
}) {
  const [reports, setReports] = useState<readonly ReportDefinition[]>(initialReports ?? []);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    initialReports ? "ready" : "loading",
  );
  useEffect(() => {
    if (initialReports) return;
    let active = true;
    setStatus("loading");
    port
      .listReports()
      .then((rows) => {
        if (!active) return;
        setReports(rows);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [port, initialReports]);

  return (
    <section aria-label="Reports" className="min-h-full bg-bg p-3 text-md text-text">
      <span id="reports-unavailable" className="sr-only">
        Not available in this read-only view.
      </span>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3">
        <ReportsCategorySelector />
        <div className="flex items-center gap-4">
          <div className="w-60 rounded-md border border-control-border bg-surface px-2">
            <TextField
              label="Search All Reports"
              placeholder="Search All Reports"
              hideLabel
              variant="search"
              isReadOnly
              value=""
              prefix={<Icons.filterSearch className="size-4" aria-hidden />}
            />
          </div>
          <Button
            variant="recordPrimary"
            aria-disabled="true"
            aria-describedby="reports-unavailable"
          >
            Create Report
          </Button>
          <Button
            variant="icon"
            aria-label="Reports help"
            aria-disabled="true"
            aria-describedby="reports-unavailable"
          >
            <Icons.info className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
      {status === "loading" && <p role="status">Loading reports…</p>}
      {status === "error" && <p role="alert">Reports could not be loaded.</p>}
      {status === "ready" && (
        <div className="overflow-x-auto rounded-xl bg-surface">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-14" />
              <col className="w-[29%]" />
              <col className="w-1/4" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b-2 border-border">
                <th scope="col">
                  <span className="sr-only">Selection and favorite</span>
                </th>
                {["Report Name", "Description", "Folder", "Last Accessed Date", "Created By"].map(
                  (heading) => (
                    <th key={heading} scope="col" className="px-3 py-2 font-semibold">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="group border-b border-border">
                  <td className="py-4 pl-4">
                    <div className="flex items-center gap-1">
                      <Checkbox
                        label={`Select ${report.name}`}
                        hideLabel
                        isReadOnly
                        isSelected={false}
                      />
                      <Button
                        variant="icon"
                        size="compact"
                        aria-label={`Favorite ${report.name}`}
                        aria-disabled="true"
                        aria-describedby="reports-unavailable"
                        className="text-text-muted"
                      >
                        <span aria-hidden>☆</span>
                      </Button>
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <Link href={reportPath(orgSlug, report.id)} className="min-w-0 truncate">
                        {report.name}
                      </Link>
                      <Button
                        variant="icon"
                        size="compact"
                        aria-label={`Report actions: ${report.name}`}
                        aria-disabled="true"
                        aria-describedby="reports-unavailable"
                        className="shrink-0 text-text-muted opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100"
                      >
                        <Icons.ellipsis className="size-4" aria-hidden />
                      </Button>
                    </div>
                  </td>
                  <td className="truncate px-3 py-4" title={report.description ?? undefined}>
                    {report.description || "-"}
                  </td>
                  <td className="truncate px-3 py-4">{report.folder || "-"}</td>
                  <td className="px-3 py-4">
                    {report.lastAccessedDate
                      ? formatDate(report.lastAccessedDate, DOTTED_DAY_FIRST_FORMAT)
                      : "-"}
                  </td>
                  <td className="truncate px-3 py-4">{report.createdBy || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
