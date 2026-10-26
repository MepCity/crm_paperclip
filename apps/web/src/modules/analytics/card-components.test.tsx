// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AccountsKpiContent,
  CardEmptyIllustration,
  DashboardCard,
  KpiCardContent,
  LeadsBySourceContent,
  LeadTargetContent,
  PerformanceMonitorContent,
  ProlificRepsContent,
  RevenueTargetContent,
} from "./card-components";

afterEach(cleanup);

describe("DashboardCard", () => {
  it("renders section with accessible title heading and children", () => {
    render(
      <DashboardCard title="Performance Summary">
        <p>Metric summary text</p>
      </DashboardCard>,
    );

    expect(screen.getByRole("region", { name: "Performance Summary" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Performance Summary" })).toBeTruthy();
    expect(screen.getByText("Metric summary text")).toBeTruthy();
  });

  it("renders refresh button with accessible label and invokes onRefresh callback", async () => {
    const onRefresh = vi.fn();
    const user = userEvent.setup();

    render(
      <DashboardCard title="Lead Statistics" onRefresh={onRefresh}>
        <div>Card body</div>
      </DashboardCard>,
    );

    const refreshBtn = screen.getByRole("button", { name: "Refresh Component" });
    expect(refreshBtn).toBeTruthy();

    await user.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});

describe("CardEmptyIllustration (AC01/AC02)", () => {
  it("renders default empty illustration label", () => {
    render(<CardEmptyIllustration />);
    expect(screen.getByText("No data available")).toBeTruthy();
  });

  it("renders custom label when specified", () => {
    render(<CardEmptyIllustration label="No records in this period" />);
    expect(screen.getByText("No records in this period")).toBeTruthy();
  });
});

describe("KpiCardContent (AC01, AC02, AC03)", () => {
  it("renders empty illustration state (AC01/AC02)", () => {
    render(<KpiCardContent data={{ state: "empty" }} />);
    expect(screen.getByText("No data available")).toBeTruthy();
  });

  it("renders single aggregate with formatted value string (AC03)", () => {
    render(
      <KpiCardContent
        data={{
          state: "value",
          formatted: "1,450 Leads",
          value: 1450,
        }}
      />,
    );
    expect(screen.getByText("1,450 Leads")).toBeTruthy();
  });

  it("renders single aggregate with raw numeric value (AC03)", () => {
    render(<KpiCardContent data={{ state: "value", value: 342 }} />);
    expect(screen.getByText("342")).toBeTruthy();
  });

  it("renders fallback 0 when value and formatted are omitted", () => {
    render(<KpiCardContent data={{ state: "value" }} />);
    expect(screen.getByText("0")).toBeTruthy();
  });
});

describe("AccountsKpiContent (AC04)", () => {
  it("renders empty illustration state (AC01/AC02)", () => {
    render(<AccountsKpiContent data={{ state: "empty" }} />);
    expect(screen.getByText("No data available")).toBeTruthy();
  });

  it("renders aggregate with positive comparison percentage and previous-period caption (AC04)", () => {
    render(
      <AccountsKpiContent
        data={{
          state: "value",
          value: 48,
          changePercentage: "+18.5%",
          previousPeriodLabel: "vs Last Month",
          previousPeriodValue: 40,
        }}
      />,
    );
    expect(screen.getByText("48")).toBeTruthy();
    expect(screen.getByText("+18.5%")).toBeTruthy();
    expect(screen.getByText("vs Last Month 40")).toBeTruthy();
  });

  it("renders aggregate with negative comparison percentage and previous-period caption (AC04)", () => {
    render(
      <AccountsKpiContent
        data={{
          state: "value",
          value: 32,
          changePercentage: "-12.0%",
          previousPeriodLabel: "vs Last Month",
          previousPeriodValue: 36,
        }}
      />,
    );
    expect(screen.getByText("32")).toBeTruthy();
    expect(screen.getByText("-12.0%")).toBeTruthy();
    expect(screen.getByText("vs Last Month 36")).toBeTruthy();
  });

  it("renders value without comparison percentage or previous-period caption when omitted", () => {
    render(<AccountsKpiContent data={{ state: "value", value: 15 }} />);
    expect(screen.getByText("15")).toBeTruthy();
    expect(screen.queryByText(/vs/)).toBeNull();
  });

  it("renders fallback 0 when value is undefined", () => {
    render(<AccountsKpiContent data={{ state: "value" }} />);
    expect(screen.getByText("0")).toBeTruthy();
  });
});

describe("LeadTargetContent (AC05)", () => {
  it("renders empty illustration state (AC01/AC02)", () => {
    render(<LeadTargetContent data={{ state: "empty" }} />);
    expect(screen.getByText("No data available")).toBeTruthy();
  });

  it("renders gauge at 0% with current, target, remaining, and baseline endpoint (AC05)", () => {
    render(
      <LeadTargetContent
        data={{
          state: "value",
          current: 0,
          target: 800,
          remaining: 800,
        }}
      />,
    );
    // Baseline endpoint and current center indicator both render "0"
    expect(screen.getAllByText("0")).toHaveLength(2);
    expect(screen.getByText("Target: 800")).toBeTruthy();
    expect(screen.getByText("Remaining : 800")).toBeTruthy();
  });

  it("renders gauge at partial progress with computed remaining value (AC05)", () => {
    render(
      <LeadTargetContent
        data={{
          state: "value",
          current: 350,
          target: 1000,
        }}
      />,
    );
    expect(screen.getByText("350")).toBeTruthy();
    expect(screen.getByText("Target: 1000")).toBeTruthy();
    expect(screen.getByText("Remaining : 650")).toBeTruthy();
  });

  it("renders gauge at >=100% clamp with remaining clamped to 0 (AC05)", () => {
    render(
      <LeadTargetContent
        data={{
          state: "value",
          current: 1250,
          target: 1000,
        }}
      />,
    );
    expect(screen.getByText("1250")).toBeTruthy();
    expect(screen.getByText("Target: 1000")).toBeTruthy();
    expect(screen.getByText("Remaining : 0")).toBeTruthy();
  });

  it("renders gauge with default fallbacks when values are omitted", () => {
    render(<LeadTargetContent data={{ state: "value" }} />);
    expect(screen.getByText("Target: 1000")).toBeTruthy();
    expect(screen.getByText("Remaining : 1000")).toBeTruthy();
  });
});

describe("RevenueTargetContent (AC06)", () => {
  it("renders empty illustration state (AC01/AC02)", () => {
    render(<RevenueTargetContent data={{ state: "empty" }} />);
    expect(screen.getByText("No data available")).toBeTruthy();
  });

  it("renders horizontal target bar with custom category, metric, target, achieved, and legend (AC06)", () => {
    render(
      <RevenueTargetContent
        data={{
          state: "value",
          category: "Enterprise Division",
          sumMetric: "Sum of Bookings",
          formattedTarget: "$2,500,000",
          formattedAchieved: "$1,250,000",
          percentage: 50,
        }}
      />,
    );
    expect(screen.getByText("Enterprise Division")).toBeTruthy();
    expect(screen.getByText("Sum of Bookings")).toBeTruthy();
    expect(screen.getByText("Target : $2,500,000")).toBeTruthy();
    expect(screen.getByText("Achieved : $1,250,000")).toBeTruthy();
    expect(screen.getByText("Achieved")).toBeTruthy();
  });

  it("renders default category, metric, target, and achieved when omitted", () => {
    render(<RevenueTargetContent data={{ state: "value" }} />);
    expect(screen.getByText("Entire Org")).toBeTruthy();
    expect(screen.getByText("Sum of Amount")).toBeTruthy();
    expect(screen.getByText("Target : $10,000,000.00")).toBeTruthy();
    expect(screen.getByText("Achieved : $785,000.00")).toBeTruthy();
    expect(screen.getByText("Achieved")).toBeTruthy();
  });

  it("renders progress bar at 0%, partial, and clamped at >=100%", () => {
    const { rerender } = render(
      <RevenueTargetContent
        data={{
          state: "value",
          percentage: 0,
        }}
      />,
    );
    expect(screen.getByText("Achieved")).toBeTruthy();

    rerender(
      <RevenueTargetContent
        data={{
          state: "value",
          percentage: 65,
        }}
      />,
    );
    expect(screen.getByText("Achieved")).toBeTruthy();

    rerender(
      <RevenueTargetContent
        data={{
          state: "value",
          percentage: 140,
        }}
      />,
    );
    expect(screen.getByText("Achieved")).toBeTruthy();
  });
});

describe("PerformanceMonitorContent (AC07)", () => {
  it("renders empty illustration state", () => {
    render(<PerformanceMonitorContent data={{ state: "empty" }} />);
    expect(screen.getByText("No data available")).toBeTruthy();
  });

  it("renders period title and metrics table rows", () => {
    render(
      <PerformanceMonitorContent
        data={{
          state: "value",
          period: "Last 3 Months",
          metrics: [
            { label: "New Inquiries", value: "128" },
            { label: "Qualified", value: "64" },
          ],
        }}
      />,
    );
    expect(screen.getByText("Last 3 Months")).toBeTruthy();
    expect(screen.getByText("New Inquiries")).toBeTruthy();
    expect(screen.getByText("128")).toBeTruthy();
    expect(screen.getByText("Qualified")).toBeTruthy();
    expect(screen.getByText("64")).toBeTruthy();
  });

  it("renders without period header when omitted", () => {
    render(
      <PerformanceMonitorContent
        data={{
          state: "value",
          metrics: [{ label: "Win Rate", value: "32%" }],
        }}
      />,
    );
    expect(screen.getByText("Win Rate")).toBeTruthy();
    expect(screen.getByText("32%")).toBeTruthy();
  });
});

describe("LeadsBySourceContent (AC08)", () => {
  it("renders empty illustration state", () => {
    render(<LeadsBySourceContent data={{ state: "empty" }} />);
    expect(screen.getByText("No data available")).toBeTruthy();
  });

  it("renders sources legend with label, count, and formatted percentage", () => {
    render(
      <LeadsBySourceContent
        data={{
          state: "value",
          sources: [
            { label: "Organic Search", count: 60, percentage: 60, color: "#3b82f6" },
            { label: "Paid Ads", count: 40, percentage: 40, color: "#10b981" },
          ],
        }}
      />,
    );
    expect(screen.getByText("Organic Search 60 (60.00 %)")).toBeTruthy();
    expect(screen.getByText("Paid Ads 40 (40.00 %)")).toBeTruthy();
  });

  it("renders without error when sources array is empty", () => {
    render(<LeadsBySourceContent data={{ state: "value", sources: [] }} />);
    expect(screen.queryByText("No data available")).toBeNull();
  });
});

describe("ProlificRepsContent (AC09)", () => {
  it("renders empty illustration state", () => {
    render(<ProlificRepsContent data={{ state: "empty" }} />);
    expect(screen.getByText("No data available")).toBeTruthy();
  });

  it("renders table with custom headers, rep rank, name, and amount", () => {
    render(
      <ProlificRepsContent
        data={{
          state: "value",
          ownerColumnLabel: "Sales Executive",
          amountColumnLabel: "Total Won",
          reps: [
            { rank: 1, name: "Taylor Swift", amount: "$350,000" },
            { rank: 2, name: "Alex Morgan", amount: "$210,000" },
          ],
        }}
      />,
    );
    expect(screen.getByText("Sales Executive")).toBeTruthy();
    expect(screen.getByText("Total Won")).toBeTruthy();
    expect(screen.getByText("1. Taylor Swift")).toBeTruthy();
    expect(screen.getByText("$350,000")).toBeTruthy();
    expect(screen.getByText("2. Alex Morgan")).toBeTruthy();
    expect(screen.getByText("$210,000")).toBeTruthy();
  });

  it("renders default column headers when omitted", () => {
    render(<ProlificRepsContent data={{ state: "value", reps: [] }} />);
    expect(screen.getByText("Deal Owner")).toBeTruthy();
    expect(screen.getByText("Sum of Amount")).toBeTruthy();
  });
});
