/**
 * Read-only Analytics dashboard data definitions.
 * Inventory A01-A12, AC01-AC09.
 */

export type CardState = "empty" | "value";

export interface KpiCardData<T = number> {
  state: CardState;
  value?: T;
  formatted?: string;
}

export interface AccountKpiCardData {
  state: CardState;
  value?: number;
  changePercentage?: string;
  previousPeriodLabel?: string;
  previousPeriodValue?: number;
}

export interface LeadTargetCardData {
  state: CardState;
  current?: number;
  target?: number;
  remaining?: number;
}

export interface RevenueTargetCardData {
  state: CardState;
  category?: string;
  sumMetric?: string;
  target?: number;
  achieved?: number;
  formattedTarget?: string;
  formattedAchieved?: string;
  percentage?: number;
}

export interface MetricRow {
  label: string;
  value: string;
}

export interface PerformanceMonitorCardData {
  state: CardState;
  period?: string;
  metrics?: readonly MetricRow[];
}

export interface LeadSourceItem {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface LeadSourceCardData {
  state: CardState;
  sources?: readonly LeadSourceItem[];
}

export interface RepPerformanceItem {
  rank: number;
  name: string;
  amount: string;
}

export interface ProlificRepsCardData {
  state: CardState;
  ownerColumnLabel?: string;
  amountColumnLabel?: string;
  reps?: readonly RepPerformanceItem[];
}

export interface AnalyticsDashboardData {
  overviewTitle: string;
  scopeLabel: string;
  leadsThisMonth: KpiCardData<number>;
  revenueThisMonth: KpiCardData<number>;
  dealsInPipeline: KpiCardData<number>;
  accountsThisMonth: AccountKpiCardData;
  leadTarget: LeadTargetCardData;
  revenueTarget: RevenueTargetCardData;
  performanceMonitor: PerformanceMonitorCardData;
  leadsBySource: LeadSourceCardData;
  prolificReps: ProlificRepsCardData;
}

export interface AnalyticsPort {
  getDashboard(): Promise<AnalyticsDashboardData>;
}

/** Local fixture storage only; no production mutation endpoint is inferred. */
export interface EmptyDashboard {
  name: string;
  description: string;
  access: "private";
  components: readonly never[];
}

export interface DashboardCreationPort {
  createEmptyDashboard(input: EmptyDashboard): Promise<EmptyDashboard>;
}
