import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CadenceReportScreen } from "./cadence-report-screen";

const mockFetchCadenceReport = vi.fn(
  async (
    _orgSlug: string,
    _cadenceId: string,
    params?: { startDate?: string; endDate?: string },
  ) => {
    return {
      cadence: {
        id: "cad-123",
        name: "Enterprise Sequence",
        module: "Leads" as const,
        status: "active" as const,
        createdAt: "2026-11-01T00:00:00.000Z",
      },
      dateRange: {
        startDate: params?.startDate,
        endDate: params?.endDate,
      },
      summary: {
        enrolled: 100,
        active: 60,
        completed: 25,
        exited: 10,
        stopped: 3,
        paused: 2,
      },
      stepMetrics: [
        {
          stepId: "step-1",
          stepKind: "email" as const,
          stepName: "Intro Email",
          delayText: "0 minutes",
          executed: 95,
          skipped: 5,
          skippedReasons: { missing_email: 4, actor_lost_access: 1 },
          failed: 0,
          emailsSent: 95,
          replies: 10,
          enteredCount: 100,
          completedCount: 95,
          conversionRate: 95,
        },
        {
          stepId: "step-2",
          stepKind: "task" as const,
          stepName: "Follow-up Call Task",
          delayText: "2 days",
          executed: 70,
          skipped: 0,
          skippedReasons: {},
          failed: 0,
          tasksCreated: 70,
          tasksCompleted: 65,
          enteredCount: 95,
          completedCount: 70,
          conversionRate: 74,
        },
      ],
    };
  },
);

vi.mock("./api", () => ({
  fetchCadenceReport: (
    orgSlug: string,
    cadenceId: string,
    params?: { startDate?: string; endDate?: string },
  ) => mockFetchCadenceReport(orgSlug, cadenceId, params),
}));

describe("CadenceReportScreen", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders cadence report title, badges, summary KPIs, funnel and action metrics", async () => {
    render(<CadenceReportScreen orgSlug="test-org" cadenceId="cad-123" />);

    expect(await screen.findByTestId("report-cadence-title")).toBeDefined();
    expect(screen.getByText(/Enterprise Sequence/)).toBeDefined();
    expect(screen.getByText("Leads")).toBeDefined();

    // Summary KPIs
    expect(screen.getByTestId("kpi-enrolled").textContent).toBe("100");
    expect(screen.getByTestId("kpi-active").textContent).toBe("60");
    expect(screen.getByTestId("kpi-completed").textContent).toBe("25");
    expect(screen.getByTestId("kpi-exited").textContent).toBe("10");
    expect(screen.getByTestId("kpi-stopped").textContent).toBe("3");
    expect(screen.getByTestId("kpi-paused").textContent).toBe("2");

    // Funnel
    expect(screen.getByTestId("cadence-funnel")).toBeDefined();
    expect(screen.getByTestId("funnel-step-0")).toBeDefined();
    expect(screen.getAllByText(/Intro Email/).length).toBeGreaterThan(0);
    expect(screen.getByText("95%")).toBeDefined();

    // Action metrics table
    expect(screen.getByTestId("cadence-action-metrics")).toBeDefined();
    expect(screen.getByTestId("metric-executed-step-1").textContent).toBe("95");
    expect(screen.getByTestId("metric-skipped-step-1").textContent).toContain("5");
    expect(screen.getByText(/missing_email: 4/)).toBeDefined();
    expect(screen.getByText(/Emails Sent: 95/)).toBeDefined();
    expect(screen.getByText(/Replies: 10/)).toBeDefined();

    expect(screen.getByTestId("metric-executed-step-2").textContent).toBe("70");
    expect(screen.getByText(/Tasks Created: 70/)).toBeDefined();
  });

  it("changes date range filter and triggers fetchCadenceReport with corresponding params", async () => {
    render(<CadenceReportScreen orgSlug="test-org" cadenceId="cad-123" />);

    await screen.findByTestId("report-cadence-title");
    expect(mockFetchCadenceReport).toHaveBeenCalledTimes(1);

    const range30d = screen.getByTestId("report-range-30d");
    fireEvent.click(range30d);

    await waitFor(() => {
      expect(mockFetchCadenceReport).toHaveBeenCalledTimes(2);
    });

    const rangeAll = screen.getByTestId("report-range-all");
    fireEvent.click(rangeAll);

    await waitFor(() => {
      expect(mockFetchCadenceReport).toHaveBeenCalledWith("test-org", "cad-123", {
        startDate: undefined,
        endDate: undefined,
      });
    });
  });
});
