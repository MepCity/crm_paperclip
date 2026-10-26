"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { useUiTranslations } from "@/i18n/client-provider";
import {
  AccountsKpiContent,
  DashboardCard,
  KpiCardContent,
  LeadsBySourceContent,
  LeadTargetContent,
  PerformanceMonitorContent,
  ProlificRepsContent,
  RevenueTargetContent,
} from "./card-components";
import { fixtureAnalyticsPort } from "./fixture-port";
import type { AnalyticsDashboardData, AnalyticsPort } from "./port";

export function AnalyticsScreen({
  orgSlug: _orgSlug,
  port = fixtureAnalyticsPort,
}: {
  orgSlug: string;
  port?: AnalyticsPort;
}) {
  const t = useUiTranslations();
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const loadDashboard = useCallback(() => {
    setStatus("loading");
    port
      .getDashboard()
      .then((dashboard) => {
        setData(dashboard);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [port]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const overviewTitle = data?.overviewTitle ?? t("modules.analytics.orgOverview");
  const scopeLabel = data?.scopeLabel ?? t("modules.analytics.allUsers");

  return (
    <section
      aria-label={t("modules.analytics.analytics")}
      className="min-h-full bg-bg p-4 text-md text-text"
    >
      <span id="analytics-unavailable" className="sr-only">
        {t("modules.reports.notAvailableYet")}
      </span>
      {/* A01–A09: Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
        {/* Left cluster: A01, A02, A03, A04 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* A01: All dropdown */}
          <Button
            variant="recordSelector"
            aria-label={t("modules.analytics.all")}
            aria-disabled="true"
            aria-describedby="analytics-unavailable"
            className="h-8 gap-2 px-3 text-sm"
          >
            <span>{t("modules.analytics.all")}</span>
            <Icons.chevronDown className="size-3.5" aria-hidden />
          </Button>

          {/* A02–A03: Overview selector with star */}
          <div className="flex h-8 items-center rounded-md border border-control-border bg-surface shadow-xs">
            {/* A03: Favorite star */}
            <Button
              variant="icon"
              size="compact"
              aria-label={t("modules.analytics.favoriteOverview", { name: overviewTitle })}
              aria-disabled="true"
              aria-describedby="analytics-unavailable"
              className="px-2 text-text-muted"
            >
              <span aria-hidden className="text-sm">
                ☆
              </span>
            </Button>
            {/* A02: Overview selector */}
            <div
              role="combobox"
              aria-label={t("modules.analytics.overviewSelector")}
              aria-expanded="false"
              aria-disabled="true"
              aria-describedby="analytics-unavailable"
              tabIndex={0}
              className="flex items-center gap-2 pr-3 pl-1 text-sm font-semibold text-text"
            >
              <span>{overviewTitle}</span>
              <Icons.chevronDown className="size-3.5 text-text-muted" aria-hidden />
            </div>
          </div>

          {/* A04: All Users scope badge */}
          <div
            role="status"
            aria-label={t("modules.analytics.scopeAllUsers", { scope: scopeLabel })}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-text-muted shadow-2xs"
          >
            <svg
              className="size-3.5 text-text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{scopeLabel}</span>
          </div>
        </div>

        {/* Right cluster: A05, A06, A07, A08, A09 */}
        <div className="flex items-center gap-2">
          {/* A05: Refresh all components (wired!) */}
          <Button
            variant="icon"
            size="compact"
            aria-label={t("modules.analytics.refreshAll")}
            onClick={loadDashboard}
            className="p-1.5 text-text-muted hover:text-text"
          >
            <Icons.refresh className="size-4" aria-hidden />
          </Button>

          {/* A06: Add Component */}
          <Button
            variant="recordSecondary"
            size="toolbar"
            aria-disabled="true"
            aria-describedby="analytics-unavailable"
            className="h-8 text-xs font-semibold"
          >
            {t("modules.analytics.addComponent")}
          </Button>

          {/* A07: Create Dashboard */}
          <Button
            variant="recordPrimary"
            size="toolbar"
            aria-disabled="true"
            aria-describedby="analytics-unavailable"
            className="h-8 text-xs font-semibold"
          >
            {t("modules.analytics.createDashboard")}
          </Button>

          {/* A08: More actions */}
          <Button
            variant="icon"
            size="compact"
            aria-label={t("modules.analytics.moreActions")}
            aria-disabled="true"
            aria-describedby="analytics-unavailable"
            className="p-1.5 text-text-muted"
          >
            <Icons.ellipsis className="size-4" aria-hidden />
          </Button>

          {/* A09: Context help */}
          <Button
            variant="icon"
            size="compact"
            aria-label={t("modules.analytics.help")}
            aria-disabled="true"
            aria-describedby="analytics-unavailable"
            className="p-1.5 text-text-muted"
          >
            <Icons.info className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      {status === "loading" && !data && (
        <div role="status" className="py-12 text-center text-text-muted">
          {t("modules.analytics.loading")}
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="py-12 text-center text-danger">
          {t("modules.analytics.error")}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-12 gap-3.5">
          {/* Row 1: Four KPI cards A10.01–A10.04 */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <DashboardCard title={t("modules.analytics.leadsThisMonth")} onRefresh={loadDashboard}>
              <KpiCardContent data={data.leadsThisMonth} />
            </DashboardCard>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <DashboardCard
              title={t("modules.analytics.revenueThisMonth")}
              onRefresh={loadDashboard}
            >
              <KpiCardContent data={data.revenueThisMonth} />
            </DashboardCard>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <DashboardCard title={t("modules.analytics.dealsInPipeline")} onRefresh={loadDashboard}>
              <KpiCardContent data={data.dealsInPipeline} />
            </DashboardCard>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <DashboardCard
              title={t("modules.analytics.accountsThisMonth")}
              onRefresh={loadDashboard}
            >
              <AccountsKpiContent data={data.accountsThisMonth} />
            </DashboardCard>
          </div>

          {/* Row 2: Target cards A11.01–A11.02 */}
          <div className="col-span-12 lg:col-span-4">
            <DashboardCard title={t("modules.analytics.leadTargetYear")} onRefresh={loadDashboard}>
              <LeadTargetContent data={data.leadTarget} />
            </DashboardCard>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <DashboardCard
              title={t("modules.analytics.revenueTargetYear")}
              onRefresh={loadDashboard}
            >
              <RevenueTargetContent data={data.revenueTarget} />
            </DashboardCard>
          </div>

          {/* Row 3: Breakdown cards A12.01–A12.03 */}
          <div className="col-span-12 lg:col-span-4">
            <DashboardCard
              title={t("modules.analytics.performanceMonitor")}
              onRefresh={loadDashboard}
            >
              <PerformanceMonitorContent data={data.performanceMonitor} />
            </DashboardCard>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <DashboardCard title={t("modules.analytics.leadsBySource")} onRefresh={loadDashboard}>
              <LeadsBySourceContent data={data.leadsBySource} />
            </DashboardCard>
          </div>

          <div className="col-span-12 lg:col-span-3">
            <DashboardCard title={t("modules.analytics.prolificReps")} onRefresh={loadDashboard}>
              <ProlificRepsContent data={data.prolificReps} />
            </DashboardCard>
          </div>
        </div>
      )}
    </section>
  );
}
