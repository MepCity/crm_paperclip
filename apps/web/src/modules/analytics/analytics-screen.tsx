"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
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
import { DashboardComponentChooser, DashboardCreate } from "./dashboard-create";
import { fixtureAnalyticsPort, fixtureDashboardCreationPort } from "./fixture-port";
import type {
  AnalyticsDashboardData,
  AnalyticsPort,
  DashboardCreationPort,
  EmptyDashboard,
} from "./port";

export function AnalyticsScreen({
  orgSlug: _orgSlug,
  port = fixtureAnalyticsPort,
  creationPort = fixtureDashboardCreationPort,
}: {
  orgSlug: string;
  port?: AnalyticsPort;
  creationPort?: DashboardCreationPort;
}) {
  const [creating, setCreating] = useState(false);
  const [custom, setCustom] = useState<EmptyDashboard | null>(null);
  const [adding, setAdding] = useState(false);
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

  if (creating)
    return (
      <DashboardCreate
        onCancel={() => {
          setCreating(false);
          setAdding(false);
        }}
        onSave={async (input) => {
          setCustom(await creationPort.createEmptyDashboard(input));
          setCreating(false);
          setAdding(false);
        }}
      />
    );

  return (
    <section aria-label="Analytics" className="min-h-full bg-bg p-4 text-md text-text">
      {adding && <DashboardComponentChooser onCancel={() => setAdding(false)} />}
      <span id="analytics-unavailable" className="sr-only">
        Not available in this read-only view.
      </span>
      {/* A01–A09: Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
        {/* Left cluster: A01, A02, A03, A04 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* A01: All dropdown */}
          <Button
            variant="recordSelector"
            aria-label="All"
            aria-disabled="true"
            aria-describedby="analytics-unavailable"
            className="h-8 gap-2 px-3 text-sm"
          >
            <span>All</span>
            <Icons.chevronDown className="size-3.5" aria-hidden />
          </Button>

          {/* A02–A03: Overview selector with star */}
          <div className="flex h-8 items-center rounded-md border border-control-border bg-surface shadow-xs">
            {/* A03: Favorite star */}
            <Button
              variant="icon"
              size="compact"
              aria-label="Favorite Org Overview"
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
              aria-label="Overview selector"
              aria-expanded="false"
              aria-disabled="true"
              aria-describedby="analytics-unavailable"
              tabIndex={0}
              className="flex items-center gap-2 pr-3 pl-1 text-sm font-semibold text-text"
            >
              <span>{custom?.name ?? data?.overviewTitle ?? "Org Overview"}</span>
              <Icons.chevronDown className="size-3.5 text-text-muted" aria-hidden />
            </div>
          </div>

          {/* A04: All Users scope badge */}
          <div
            role="status"
            aria-label={custom ? "Scope: Only me" : "Scope: All Users"}
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
            <span>{custom ? "Only me" : (data?.scopeLabel ?? "All Users")}</span>
          </div>
        </div>

        {/* Right cluster: A05, A06, A07, A08, A09 */}
        <div className="flex items-center gap-2">
          {/* A05: Refresh all components (wired!) */}
          <Button
            variant="icon"
            size="compact"
            aria-label="Refresh all components"
            onClick={loadDashboard}
            className="p-1.5 text-text-muted hover:text-text"
          >
            <Icons.refresh className="size-4" aria-hidden />
          </Button>

          {/* A06: Add Component */}
          {!custom && (
            <Button
              variant="recordSecondary"
              size="toolbar"
              aria-disabled="true"
              aria-describedby="analytics-unavailable"
              className="h-8 text-xs font-semibold"
            >
              Add Component
            </Button>
          )}

          {/* A07: Create Dashboard */}
          <Button
            variant="recordPrimary"
            size="toolbar"
            onPress={() => setCreating(true)}
            className="h-8 text-xs font-semibold"
          >
            Create Dashboard
          </Button>

          {custom && (
            <Button variant="recordSecondary" isDisabled>
              Delete Dashboard
            </Button>
          )}
          {/* A08: More actions */}
          <Button
            variant="icon"
            size="compact"
            aria-label="More actions"
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
            aria-label="Analytics help"
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
          Loading analytics dashboard…
        </div>
      )}

      {status === "error" && (
        <div role="alert" className="py-12 text-center text-danger">
          Analytics dashboard could not be loaded.
        </div>
      )}

      {custom && (
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center text-text-muted">
          <Icons.barChart className="mx-auto mb-5 size-16 text-text-muted" aria-hidden />
          <h2 className="text-md">No Components Found</h2>
          <Button className="mt-5" onPress={() => setAdding(true)}>
            Add Component
          </Button>
        </div>
      )}
      {data && !custom && (
        <div className="grid grid-cols-12 gap-3.5">
          {/* Row 1: Four KPI cards A10.01–A10.04 */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <DashboardCard title="LEADS THIS MONTH" onRefresh={loadDashboard}>
              <KpiCardContent data={data.leadsThisMonth} />
            </DashboardCard>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <DashboardCard title="REVENUE THIS MONTH" onRefresh={loadDashboard}>
              <KpiCardContent data={data.revenueThisMonth} />
            </DashboardCard>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <DashboardCard title="DEALS IN PIPELINE" onRefresh={loadDashboard}>
              <KpiCardContent data={data.dealsInPipeline} />
            </DashboardCard>
          </div>

          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <DashboardCard title="ACCOUNTS THIS MONTH" onRefresh={loadDashboard}>
              <AccountsKpiContent data={data.accountsThisMonth} />
            </DashboardCard>
          </div>

          {/* Row 2: Target cards A11.01–A11.02 */}
          <div className="col-span-12 lg:col-span-4">
            <DashboardCard title="LEAD GENERATION TARGET - THIS YEAR" onRefresh={loadDashboard}>
              <LeadTargetContent data={data.leadTarget} />
            </DashboardCard>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <DashboardCard title="REVENUE TARGET - THIS YEAR" onRefresh={loadDashboard}>
              <RevenueTargetContent data={data.revenueTarget} />
            </DashboardCard>
          </div>

          {/* Row 3: Breakdown cards A12.01–A12.03 */}
          <div className="col-span-12 lg:col-span-4">
            <DashboardCard title="LAST 3 MONTHS PERFORMANCE MONITOR" onRefresh={loadDashboard}>
              <PerformanceMonitorContent data={data.performanceMonitor} />
            </DashboardCard>
          </div>

          <div className="col-span-12 lg:col-span-5">
            <DashboardCard title="LEADS BY SOURCE" onRefresh={loadDashboard}>
              <LeadsBySourceContent data={data.leadsBySource} />
            </DashboardCard>
          </div>

          <div className="col-span-12 lg:col-span-3">
            <DashboardCard title="PROLIFIC SALES REPS" onRefresh={loadDashboard}>
              <ProlificRepsContent data={data.prolificReps} />
            </DashboardCard>
          </div>
        </div>
      )}
    </section>
  );
}
