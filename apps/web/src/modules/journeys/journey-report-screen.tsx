"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import { Spinner } from "@/components/ui/spinner";
import { useUiTranslations } from "@/i18n/client-provider";
import { fetchJourneyReport } from "./api";
import type { JourneyReportData } from "./types";

export interface JourneyReportScreenProps {
  orgSlug: string;
  journeyId: string;
}

type DateRangeOption = "7d" | "30d" | "90d" | "all";

export function JourneyReportScreen({ orgSlug, journeyId }: JourneyReportScreenProps) {
  const t = useUiTranslations();
  const [report, setReport] = useState<JourneyReportData | null>(null);
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

      const data = await fetchJourneyReport(orgSlug, journeyId, { startDate, endDate });
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load journey report");
    } finally {
      setLoading(false);
    }
  }, [orgSlug, journeyId, dateRange]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (loading && !report) {
    return (
      <div className="flex flex-1 items-center justify-center p-12" data-testid="report-loading">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  const summary = report?.summary ?? {
    totalInstances: 0,
    active: 0,
    completed: 0,
    exited: 0,
    stopped: 0,
  };

  const states = report?.states ?? [];
  const transitions = report?.transitions ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border bg-card px-6 py-4 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/crm/${orgSlug}/settings/commandcenter/journey-builder/${journeyId}`}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
            data-testid="report-back-button"
          >
            <ArrowLeft className="size-4" />
            {t("modules.journeys.reports.backToEditor") || "Back to Journey"}
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-lg font-semibold text-foreground" data-testid="report-journey-title">
            {report?.journey.name ?? "Journey"} - {t("modules.journeys.reports.title") || "Reports"}
          </h1>
          {report?.journey && <Badge variant="neutral">{report.journey.module}</Badge>}
          {report?.journey && (
            <Badge
              variant={
                report.journey.status === "active"
                  ? "success"
                  : report.journey.status === "draft"
                    ? "warning"
                    : "neutral"
              }
            >
              {report.journey.status}
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
              {t("modules.journeys.reports.dateRange7d") || "Last 7 days"}
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
              {t("modules.journeys.reports.dateRange30d") || "Last 30 days"}
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
              {t("modules.journeys.reports.dateRange90d") || "Last 90 days"}
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
              {t("modules.journeys.reports.dateRangeAll") || "All time"}
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
            {t("modules.journeys.reports.summaryTitle") || "Journey Execution Summary"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("modules.journeys.reports.totalRecords") || "Total Records"}
              </span>
              <span className="text-2xl font-bold text-foreground" data-testid="kpi-total">
                {summary.totalInstances}
              </span>
            </div>

            <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("modules.journeys.reports.active") || "Active"}
              </span>
              <span className="text-2xl font-bold text-success" data-testid="kpi-active">
                {summary.active}
              </span>
            </div>

            <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("modules.journeys.reports.completed") || "Completed"}
              </span>
              <span className="text-2xl font-bold text-foreground" data-testid="kpi-completed">
                {summary.completed}
              </span>
            </div>

            <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("modules.journeys.reports.exited") || "Exited"}
              </span>
              <span className="text-2xl font-bold text-destructive" data-testid="kpi-exited">
                {summary.exited}
              </span>
            </div>

            <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("modules.journeys.reports.stopped") || "Stopped"}
              </span>
              <span className="text-2xl font-bold text-muted-foreground" data-testid="kpi-stopped">
                {summary.stopped}
              </span>
            </div>
          </div>
        </section>

        {/* Section 1: Records per State & Average Time in State */}
        <section
          aria-labelledby="states-heading"
          className="bg-card border border-border rounded-lg p-5"
          data-testid="journey-states-metrics"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <h2 id="states-heading" className="text-base font-semibold text-foreground">
              {t("modules.journeys.reports.recordsPerStateTitle") || "Records per State"}
            </h2>
          </div>

          {states.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("modules.journeys.reports.noStates") || "No states configured in this journey."}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {states.map((st, idx) => {
                const total = summary.totalInstances || 1;
                const statePercent = Math.min(
                  100,
                  Math.round((st.totalEntered / Math.max(1, total)) * 100),
                );

                return (
                  <div
                    key={st.id}
                    className="flex flex-col gap-2 p-3.5 rounded-md bg-muted/20 border border-border/50"
                    data-testid={`state-metric-${st.id}`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">
                          {idx + 1}. {st.name}
                        </span>
                        {st.isStart && (
                          <Badge variant="neutral" className="text-[10px] py-0 px-1.5">
                            {t("modules.journeys.editor.startBadge") || "Start State"}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground font-mono">
                        <span>
                          {t("modules.journeys.reports.colCurrentRecords") || "Current"}:{" "}
                          <strong
                            className="text-foreground"
                            data-testid={`state-current-${st.id}`}
                          >
                            {st.currentCount}
                          </strong>
                        </span>
                        <span>
                          {t("modules.journeys.reports.colTotalEntered") || "Total Entered"}:{" "}
                          <strong className="text-foreground" data-testid={`state-total-${st.id}`}>
                            {st.totalEntered}
                          </strong>
                        </span>
                        <span>
                          {t("modules.journeys.reports.colAverageTime") || "Avg Time"}:{" "}
                          <strong
                            className="text-foreground"
                            data-testid={`state-avgtime-${st.id}`}
                          >
                            {st.averageTimeInStateFormatted}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-muted/60 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${statePercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Overall Flow (Transition Counts) */}
        <section
          aria-labelledby="flow-heading"
          className="bg-card border border-border rounded-lg p-5"
          data-testid="journey-flow-metrics"
        >
          <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
            <h2 id="flow-heading" className="text-base font-semibold text-foreground">
              {t("modules.journeys.reports.overallFlowTitle") || "Overall Flow"}
            </h2>
          </div>

          {transitions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("modules.journeys.reports.noTransitions") || "No transitions configured."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2 font-semibold">
                      {t("modules.journeys.reports.colTransition") || "Transition"}
                    </th>
                    <th className="pb-2 font-semibold">
                      {t("modules.journeys.reports.colTrigger") || "Trigger"}
                    </th>
                    <th className="pb-2 font-semibold text-center">
                      {t("modules.journeys.reports.colExecutions") || "Executions"}
                    </th>
                    <th className="pb-2 font-semibold text-center">Success</th>
                    <th className="pb-2 font-semibold text-center">Failed</th>
                    <th className="pb-2 font-semibold text-right">
                      {t("modules.journeys.reports.colSuccessRate") || "Success Rate"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transitions.map((tr) => {
                    const successRate =
                      tr.count > 0 ? Math.round((tr.successCount / tr.count) * 100) : 0;

                    return (
                      <tr
                        key={tr.id}
                        className="hover:bg-muted/10 transition-colors"
                        data-testid={`transition-metric-${tr.id}`}
                      >
                        <td className="py-3 font-semibold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span>{tr.fromName}</span>
                            <ArrowRight className="size-3 text-muted-foreground" />
                            <span>{tr.toName}</span>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          <Badge variant="neutral" className="text-[10px]">
                            {tr.triggerKind}
                          </Badge>
                        </td>
                        <td
                          className="py-3 text-center font-bold font-mono text-foreground"
                          data-testid={`transition-count-${tr.id}`}
                        >
                          {tr.count}
                        </td>
                        <td className="py-3 text-center font-mono text-success">
                          {tr.successCount}
                        </td>
                        <td className="py-3 text-center font-mono text-destructive">
                          {tr.failedCount}
                        </td>
                        <td className="py-3 text-right font-bold text-foreground">
                          {tr.count > 0 ? `${successRate}%` : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
