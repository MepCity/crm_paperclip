import type { AnalyticsDashboardData, AnalyticsPort } from "./port";

/**
 * Synthetic Analytics overview fixture matching the captured resting state.
 * Reference CRM research m13r1-analytics-entry / m13r2-reports-base:
 * - LEADS THIS MONTH: empty illustration (AC01 / A10.01)
 * - REVENUE THIS MONTH: empty illustration (AC02 / A10.02)
 * - DEALS IN PIPELINE: value aggregate 9 (AC03 / A10.03)
 * - ACCOUNTS THIS MONTH: value 32, 47.5%, Last Month Relative: 61 (AC04 / A10.04)
 * - LEAD GENERATION TARGET: value gauge (AC05 / A11.01)
 * - REVENUE TARGET: value horizontal bar (AC06 / A11.02)
 * - LAST 3 MONTHS PERFORMANCE MONITOR: value metrics table (AC07 / A12.01)
 * - LEADS BY SOURCE: value source distribution (AC08 / A12.02)
 * - PROLIFIC SALES REPS: value representative scorecard (AC09 / A12.03)
 */
export const capturedDashboardData: AnalyticsDashboardData = {
  overviewTitle: "Org Overview",
  scopeLabel: "All Users",
  leadsThisMonth: {
    state: "empty",
  },
  revenueThisMonth: {
    state: "empty",
  },
  dealsInPipeline: {
    state: "value",
    value: 9,
  },
  accountsThisMonth: {
    state: "value",
    value: 32,
    changePercentage: "47.5%",
    previousPeriodLabel: "Last Month Relative:",
    previousPeriodValue: 61,
  },
  leadTarget: {
    state: "value",
    current: 10,
    target: 1000,
    remaining: 990,
  },
  revenueTarget: {
    state: "value",
    category: "Entire Org",
    sumMetric: "Sum of Amount",
    target: 10000000,
    achieved: 785000,
    formattedTarget: "$10,000,000.00",
    formattedAchieved: "$785,000.00",
    percentage: 7.85,
  },
  performanceMonitor: {
    state: "value",
    period: "July 2026",
    metrics: [
      { label: "LEADS CREATED", value: "0" },
      { label: "DEALS CREATED", value: "1" },
      { label: "DEALS WON", value: "1" },
      { label: "REVENUE WON", value: "$35,000.00" },
      { label: "OPEN AMOUNT", value: "$270,000.00" },
    ],
  },
  leadsBySource: {
    state: "value",
    sources: [
      { label: "Advertisement", count: 2, percentage: 20, color: "#1f6be8" },
      { label: "Cold Call", count: 2, percentage: 20, color: "#10b981" },
      { label: "Online Store", count: 2, percentage: 20, color: "#f59e0b" },
      { label: "Partner", count: 1, percentage: 10, color: "#8b5cf6" },
      { label: "External Referral", count: 1, percentage: 10, color: "#ec4899" },
      { label: "Seminar Partner", count: 1, percentage: 10, color: "#06b6d4" },
      { label: "Web Download", count: 1, percentage: 10, color: "#64748b" },
    ],
  },
  prolificReps: {
    state: "value",
    ownerColumnLabel: "Deal Owner",
    amountColumnLabel: "Sum of Amount",
    reps: [
      { rank: 1, name: "Hatice Arslan", amount: "$35,000.00" },
      { rank: 2, name: "Alex Morgan", amount: "$22,500.00" },
      { rank: 3, name: "Jordan Taylor", amount: "$15,000.00" },
    ],
  },
};

/** All-value state where even cards 1 and 2 show synthetic metrics. */
export const allValuesDashboardData: AnalyticsDashboardData = {
  ...capturedDashboardData,
  leadsThisMonth: {
    state: "value",
    value: 12,
  },
  revenueThisMonth: {
    state: "value",
    value: 45000,
    formatted: "$45,000.00",
  },
};

/** All-empty state where every card displays an empty illustration. */
export const allEmptyDashboardData: AnalyticsDashboardData = {
  overviewTitle: "Org Overview",
  scopeLabel: "All Users",
  leadsThisMonth: { state: "empty" },
  revenueThisMonth: { state: "empty" },
  dealsInPipeline: { state: "empty" },
  accountsThisMonth: { state: "empty" },
  leadTarget: { state: "empty" },
  revenueTarget: { state: "empty" },
  performanceMonitor: { state: "empty" },
  leadsBySource: { state: "empty" },
  prolificReps: { state: "empty" },
};

export function createFixtureAnalyticsPort(
  data: AnalyticsDashboardData = capturedDashboardData,
): AnalyticsPort {
  return {
    async getDashboard() {
      return structuredClone(data);
    },
  };
}

export const fixtureAnalyticsPort: AnalyticsPort = createFixtureAnalyticsPort();
