"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Spinner } from "@/components/ui/spinner";
import { useUiTranslations } from "@/i18n/client-provider";
import { fetchCadenceReport } from "./api";
import type { CadenceReportData } from "./types";

export interface CadenceReportScreenProps {
  orgSlug: string;
  cadenceId: string;
}

type DateRangeOption = "7d" | "30d" | "90d" | "all";

export function CadenceReportScreen({ orgSlug, cadenceId }: CadenceReportScreenProps) {
  const t = useUiTranslations();
  const [report, setReport] = useState<CadenceReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>("7d");

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let startDate: string | undefined;
      let endDate: string | undefined;

      const now = new Date();
      endDate = now.toISOString().split("T")[0];

      if (dateRange === "7d") {
        const d = new Date(now.getTime() - 7 * 86400000);
        startDate = d.toISOString().split("T")[0];
      } else if (dateRange === "30d") {
        const d = new Date(now.getTime() - 30 * 86400000);
        startDate = d.toISOString().split("T")[0];
      } else if (dateRange === "90d") {
        const d = new Date(now.getTime() - 90 * 86400000);
        startDate = d.toISOString().split("T")[0];
      } else {
        startDate = undefined;
        endDate = undefined;
      }

      const data = await fetchCadenceReport(orgSlug, cadenceId, { startDate, endDate });
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cadence report");
    } finally {
      setLoading(false);
    }
  }, [orgSlug, cadenceId, dateRange]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (loading && !report) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  const summary = report?.summary ?? {
    enrolled: 0,
    active: 0,
    completed: 0,
    exited: 0,
    stopped: 0,
    paused: 0,
  };

  const stepMetrics = report?.stepMetrics ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border bg-card px-6 py-4 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/crm/${orgSlug}/settings/cadences/${cadenceId}`}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
            data-testid="report-back-button"
          >
            <Icons.arrowLeft className="size-4" />
            {t("modules.cadences.reports.backToEditor") || "Back to Cadence"}
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-lg font-semibold text-foreground" data-testid="report-cadence-title">
            {report?.cadence.name ?? "Cadence"} - {t("modules.cadences.reports.title") || "Reports"}
          </h1>
          {report?.cadence && <Badge variant="neutral">{report.cadence.module}</Badge>}
          {report?.cadence && (
            <Badge
              variant={
                report.cadence.status === "active"
                  ? "success"
                  : report.cadence.status === "inactive"
                    ? "neutral"
                    : "neutral"
              }
            >
              {report.cadence.status}
            </Badge>
          )}
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/30 border border-border rounded p-0.5 text-xs">
            <button
              type="button"
              className={`px-2.5 py-1 rounded transition-colors ${
                dateRange === "7d"
                  ? "bg-surface text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setDateRange("7d")}
              data-testid="report-range-7d"
            >
              {t("modules.cadences.reports.dateRange7d") || "Last 7 days"}
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded transition-colors ${
                dateRange === "30d"
                  ? "bg-surface text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setDateRange("30d")}
              data-testid="report-range-30d"
            >
              {t("modules.cadences.reports.dateRange30d") || "Last 30 days"}
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded transition-colors ${
                dateRange === "90d"
                  ? "bg-surface text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setDateRange("90d")}
              data-testid="report-range-90d"
            >
              {t("modules.cadences.reports.dateRange90d") || "Last 90 days"}
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded transition-colors ${
                dateRange === "all"
                  ? "bg-surface text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setDateRange("all")}
              data-testid="report-range-all"
            >
              {t("modules.cadences.reports.dateRangeAll") || "All time"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-6 py-2.5 border-b border-destructive/20">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-6 flex flex-col gap-6 max-w-6xl w-full mx-auto">
        {/* KPI Cards (Summary) */}
        <section aria-labelledby="summary-heading">
          <h2
            id="summary-heading"
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
          >
            {t("modules.cadences.reports.summaryTitle") || "Enrollment Summary"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("modules.cadences.reports.totalEnrolled") || "Total Enrolled"}
              </span>
              <span className="text-2xl font-bold text-foreground" data-testid="kpi-enrolled">
                {summary.enrolled}
              </span>
            </div>

            <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("modules.cadences.reports.active") || "Active"}
              </span>
              <span className="text-2xl font-bold text-success" data-testid="kpi-active">
                {summary.active}
              </span>
            </div>

            <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("modules.cadences.reports.completed") || "Completed"}
              </span>
              <span className="text-2xl font-bold text-foreground" data-testid="kpi-completed">
                {summary.completed}
              </span>
            </div>

            <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("modules.cadences.reports.exited") || "Exited"}
              </span>
              <span className="text-2xl font-bold text-danger" data-testid="kpi-exited">
                {summary.exited}
              </span>
            </div>

            <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("modules.cadences.reports.stopped") || "Stopped"}
              </span>
              <span className="text-2xl font-bold text-muted-foreground" data-testid="kpi-stopped">
                {summary.stopped}
              </span>
            </div>

            <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("modules.cadences.reports.paused") || "Paused"}
              </span>
              <span className="text-2xl font-bold text-muted-foreground" data-testid="kpi-paused">
                {summary.paused}
              </span>
            </div>
          </div>
        </section>

        {/* Follow-up Funnel by Step */}
        <section
          aria-labelledby="funnel-heading"
          className="bg-card border border-border rounded-lg p-5"
          data-testid="cadence-funnel"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <h2 id="funnel-heading" className="text-base font-semibold text-foreground">
              {t("modules.cadences.reports.funnelTitle") || "Follow-up Funnel"}
            </h2>
          </div>

          {stepMetrics.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("modules.cadences.reports.noMetrics") || "No steps configured in this cadence."}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {stepMetrics.map((step, idx) => (
                <div
                  key={step.stepId}
                  className="flex flex-col gap-1.5 p-3 rounded-md bg-muted/20 border border-border/50"
                  data-testid={`funnel-step-${idx}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {t("modules.cadences.reports.funnelStep", { number: idx + 1 }) ||
                          `Step ${idx + 1}`}
                        : {step.stepName}
                      </span>
                      <Badge variant="neutral">{step.stepKind}</Badge>
                      {step.delayText && (
                        <span className="text-muted-foreground font-mono">({step.delayText})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground font-mono">
                      <span>
                        {t("modules.cadences.reports.entered") || "Entered"}: {step.enteredCount}
                      </span>
                      <span>
                        {t("modules.cadences.reports.colExecuted") || "Executed"}:{" "}
                        {step.completedCount}
                      </span>
                      <span className="font-bold text-foreground">{step.conversionRate}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-muted/60 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, step.conversionRate))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Action Metrics Table */}
        <section
          aria-labelledby="metrics-heading"
          className="bg-card border border-border rounded-lg p-5"
          data-testid="cadence-action-metrics"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <h2 id="metrics-heading" className="text-base font-semibold text-foreground">
              {t("modules.cadences.reports.actionMetricsTitle") || "Action Metrics"}
            </h2>
          </div>

          {stepMetrics.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("modules.cadences.reports.noMetrics") ||
                "No execution metrics recorded for this period."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2 font-semibold">
                      {t("modules.cadences.reports.colStep") || "Step"}
                    </th>
                    <th className="pb-2 font-semibold">
                      {t("modules.cadences.reports.colType") || "Type"}
                    </th>
                    <th className="pb-2 font-semibold">
                      {t("modules.cadences.reports.colExecuted") || "Executed"}
                    </th>
                    <th className="pb-2 font-semibold">
                      {t("modules.cadences.reports.colSkipped") || "Skipped"}
                    </th>
                    <th className="pb-2 font-semibold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stepMetrics.map((step) => (
                    <tr
                      key={step.stepId}
                      className="hover:bg-muted/10 transition-colors"
                      data-testid={`metric-row-${step.stepId}`}
                    >
                      <td className="py-2.5 font-semibold text-foreground">
                        <div>{step.stepName}</div>
                        {step.delayText && (
                          <div className="text-[11px] text-muted-foreground font-normal">
                            {step.delayText}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5">
                        <Badge variant="neutral">{step.stepKind}</Badge>
                      </td>
                      <td
                        className="py-2.5 font-mono text-foreground font-semibold"
                        data-testid={`metric-executed-${step.stepId}`}
                      >
                        {step.executed}
                      </td>
                      <td
                        className="py-2.5 font-mono"
                        data-testid={`metric-skipped-${step.stepId}`}
                      >
                        <span
                          className={step.skipped > 0 ? "text-danger" : "text-muted-foreground"}
                        >
                          {step.skipped}
                        </span>
                        {step.skipped > 0 && Object.keys(step.skippedReasons).length > 0 && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {Object.entries(step.skippedReasons).map(([r, c]) => (
                              <span key={r} className="inline-block mr-1">
                                {r}: {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono text-muted-foreground">
                        {step.stepKind === "email" && (
                          <span>
                            {t("modules.cadences.reports.colEmails") || "Emails Sent"}:{" "}
                            {step.emailsSent ?? 0} |{" "}
                            {t("modules.cadences.reports.colReplies") || "Replies"}:{" "}
                            {step.replies ?? 0}
                          </span>
                        )}
                        {step.stepKind === "task" && (
                          <span>
                            {t("modules.cadences.reports.colTasks") || "Tasks Created"}:{" "}
                            {step.tasksCreated ?? 0} | Completed: {step.tasksCompleted ?? 0}
                          </span>
                        )}
                        {step.stepKind === "call" && (
                          <span>
                            {t("modules.cadences.reports.colCalls") || "Calls Created"}:{" "}
                            {step.callsCreated ?? 0} | Completed: {step.callsCompleted ?? 0}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
