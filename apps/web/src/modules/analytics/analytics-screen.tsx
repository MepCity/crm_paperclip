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
  const t = useUiTranslations();
  const [creating, setCreating] = useState(false);
  const [custom, setCustom] = useState<EmptyDashboard | null>(null);
  const [adding, setAdding] = useState(false);
