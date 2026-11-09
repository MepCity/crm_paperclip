"use client";

import { formatDate } from "@crm/core/format";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { Spinner } from "@/components/ui/spinner";
import { useUiTranslations } from "@/i18n/client-provider";
import { useFormat } from "@/lib/format-context";
import { fetchWebform, fetchWebformAnalytics } from "./api";
import type { WebformAnalyticsSummary, WebformDetail } from "./types";

export interface WebformAnalyticsScreenProps {
  orgSlug: string;
  formId: string;
}

type DateRangeOption = "7d" | "30d" | "90d" | "all";

export function WebformAnalyticsScreen({ orgSlug, formId }: WebformAnalyticsScreenProps) {
  const t = useUiTranslations();
  const orgFormat = useFormat();
  const [form, setForm] = useState<WebformDetail | null>(null);
  const [analytics, setAnalytics] = useState<WebformAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState<DateRangeOption>("7d");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Compute dates
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

      const location = selectedLocation !== "all" ? selectedLocation : undefined;

      const [formDetail, analyticsData] = await Promise.all([
        fetchWebform(orgSlug, formId),
        fetchWebformAnalytics(orgSlug, formId, { startDate, endDate, location }),
      ]);

      setForm(formDetail);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [orgSlug, formId, dateRange, selectedLocation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !analytics) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

  const isEmpty = !analytics || (analytics.totalVisits === 0 && analytics.totalSubmissions === 0);

  // Distinct locations for dropdown
  const locationOptions = Array.from(
    new Set([
      "hosted",
      "undefined",
      ...(form?.locations.map((l) => l.origin) ?? []),
      ...(analytics?.byLocation.map((l) => l.location) ?? []),
    ]),
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border bg-card px-6 py-4 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/crm/${orgSlug}/settings/webforms/${formId}`}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Icons.arrowLeft className="size-4" />
            {t("modules.webforms.analytics.back")}
          </Link>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-lg font-semibold text-foreground">
            {t("modules.webforms.analytics.title", { name: form?.name ?? "" })}
          </h1>
          {form && <Badge variant="neutral">{form.module}</Badge>}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="text-xs bg-surface border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:border-primary"
            data-testid="analytics-location-filter"
          >
            <option value="all">{t("modules.webforms.analytics.allLocations")}</option>
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Date Range Selector */}
          <div className="flex items-center bg-muted/30 border border-border rounded p-0.5 text-xs">
            <button
              type="button"
              className={`px-2.5 py-1 rounded transition-colors ${
                dateRange === "7d"
                  ? "bg-surface text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setDateRange("7d")}
              data-testid="range-7d"
            >
              {t("modules.webforms.analytics.last7Days")}
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded transition-colors ${
                dateRange === "30d"
                  ? "bg-surface text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setDateRange("30d")}
              data-testid="range-30d"
            >
              {t("modules.webforms.analytics.last30Days")}
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded transition-colors ${
                dateRange === "90d"
                  ? "bg-surface text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setDateRange("90d")}
              data-testid="range-90d"
            >
              {t("modules.webforms.analytics.last90Days")}
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded transition-colors ${
                dateRange === "all"
                  ? "bg-surface text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setDateRange("all")}
              data-testid="range-all"
            >
              {t("modules.webforms.analytics.allTime")}
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
        {isEmpty ? (
          <div
            data-testid="analytics-empty-state"
            className="flex flex-col items-center justify-center p-16 bg-card border border-border rounded-lg text-center gap-3 my-8"
          >
            <div className="size-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
              <Icons.barChart className="size-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {t("modules.webforms.analytics.noData")}
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              {t("modules.webforms.analytics.noDataDesc")}
            </p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("modules.webforms.analytics.visits")}
                </span>
                <span className="text-2xl font-bold text-foreground" data-testid="kpi-visits">
                  {analytics.totalVisits.toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("modules.webforms.analytics.submissions")}
                </span>
                <span className="text-2xl font-bold text-foreground" data-testid="kpi-submissions">
                  {analytics.totalSubmissions.toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("modules.webforms.analytics.accepted")}
                </span>
                <span className="text-2xl font-bold text-success" data-testid="kpi-accepted">
                  {analytics.totalAccepted.toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-card border border-border rounded-lg flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("modules.webforms.analytics.conversionRate")}
                </span>
                <span className="text-2xl font-bold text-primary" data-testid="kpi-conversion">
                  {analytics.overallConversionRate}%
                </span>
              </div>
            </div>

            {/* Outcomes & Location Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Outcomes Breakdown */}
              <div className="p-5 bg-card border border-border rounded-lg flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  {t("modules.webforms.analytics.outcomesTitle")}
                </h3>
                <div className="divide-y divide-border text-xs">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-foreground flex items-center gap-2">
                      <span className="size-2 rounded-full bg-success" />
                      {t("modules.webforms.analytics.outcomeAccepted")}
                    </span>
                    <span className="font-semibold text-foreground" data-testid="outcome-accepted">
                      {analytics.outcomes.accepted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-foreground flex items-center gap-2">
                      <span className="size-2 rounded-full bg-destructive" />
                      {t("modules.webforms.analytics.outcomeInvalid")}
                    </span>
                    <span className="font-semibold text-foreground" data-testid="outcome-invalid">
                      {analytics.outcomes.invalid}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-foreground flex items-center gap-2">
                      <span className="size-2 rounded-full bg-warning" />
                      {t("modules.webforms.analytics.outcomeSpam")}
                    </span>
                    <span className="font-semibold text-foreground" data-testid="outcome-spam">
                      {analytics.outcomes.spam}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-foreground flex items-center gap-2">
                      <span className="size-2 rounded-full bg-muted-foreground" />
                      {t("modules.webforms.analytics.outcomeDuplicate")}
                    </span>
                    <span className="font-semibold text-foreground" data-testid="outcome-duplicate">
                      {analytics.outcomes.duplicatePendingApproval}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-foreground flex items-center gap-2">
                      <span className="size-2 rounded-full bg-info" />
                      {t("modules.webforms.analytics.outcomePendingApproval")}
                    </span>
                    <span
                      className="font-semibold text-foreground"
                      data-testid="outcome-pending-approval"
                    >
                      {analytics.outcomes.pendingApproval}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-foreground flex items-center gap-2">
                      <span className="size-2 rounded-full bg-info" />
                      {t("modules.webforms.analytics.outcomePendingDoubleOptIn")}
                    </span>
                    <span
                      className="font-semibold text-foreground"
                      data-testid="outcome-pending-optin"
                    >
                      {analytics.outcomes.pendingDoubleOptIn}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-foreground flex items-center gap-2">
                      <span className="size-2 rounded-full bg-destructive" />
                      {t("modules.webforms.analytics.outcomeRejectedLocation")}
                    </span>
                    <span
                      className="font-semibold text-foreground"
                      data-testid="outcome-rejected-location"
                    >
                      {analytics.outcomes.rejectedLocation}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-foreground flex items-center gap-2">
                      <span className="size-2 rounded-full bg-destructive" />
                      {t("modules.webforms.analytics.outcomeRateLimited")}
                    </span>
                    <span
                      className="font-semibold text-foreground"
                      data-testid="outcome-rate-limited"
                    >
                      {analytics.outcomes.rateLimited}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Performance Breakdown */}
              <div className="p-5 bg-card border border-border rounded-lg flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  {t("modules.webforms.analytics.locationBreakdown")}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="pb-2 font-semibold">
                          {t("modules.webforms.analytics.location")}
                        </th>
                        <th className="pb-2 font-semibold text-right">
                          {t("modules.webforms.analytics.visits")}
                        </th>
                        <th className="pb-2 font-semibold text-right">
                          {t("modules.webforms.analytics.submissions")}
                        </th>
                        <th className="pb-2 font-semibold text-right">
                          {t("modules.webforms.analytics.conversionRate")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {analytics.byLocation.map((loc) => (
                        <tr key={loc.location} className="hover:bg-muted/10">
                          <td className="py-2.5 font-mono text-foreground font-semibold">
                            {loc.location}
                          </td>
                          <td className="py-2.5 text-right text-muted-foreground">{loc.visits}</td>
                          <td className="py-2.5 text-right text-muted-foreground">
                            {loc.submissions}
                          </td>
                          <td className="py-2.5 text-right font-semibold text-primary">
                            {loc.conversionRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Daily Trends Table */}
            {(analytics.daily ?? []).length > 0 && (
              <div className="p-5 bg-card border border-border rounded-lg flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  {t("modules.webforms.analytics.dailyTrends")}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="pb-2 font-semibold">
                          {t("modules.webforms.analytics.date")}
                        </th>
                        <th className="pb-2 font-semibold text-right">
                          {t("modules.webforms.analytics.visits")}
                        </th>
                        <th className="pb-2 font-semibold text-right">
                          {t("modules.webforms.analytics.submissions")}
                        </th>
                        <th className="pb-2 font-semibold text-right">
                          {t("modules.webforms.analytics.accepted")}
                        </th>
                        <th className="pb-2 font-semibold text-right">
                          {t("modules.webforms.analytics.conversionRate")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(analytics.daily ?? []).map((d) => {
                        const conv =
                          d.visits > 0 ? Number(((d.accepted / d.visits) * 100).toFixed(1)) : 0;
                        return (
                          <tr key={d.day} className="hover:bg-muted/10">
                            <td className="py-2.5 font-mono text-foreground">
                              {formatDate(d.day, orgFormat)}
                            </td>
                            <td className="py-2.5 text-right text-muted-foreground">{d.visits}</td>
                            <td className="py-2.5 text-right text-muted-foreground">
                              {d.submissions}
                            </td>
                            <td className="py-2.5 text-right text-success font-semibold">
                              {d.accepted}
                            </td>
                            <td className="py-2.5 text-right font-semibold text-primary">
                              {conv}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
