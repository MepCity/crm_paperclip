import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JourneyReportScreen } from "./journey-report-screen";

const mockReportData = {
  journey: {
    id: "j-123",
    name: "Qualify Leads Journey",
    module: "Leads" as const,
    status: "active" as const,
    description: "Multi-stage qualification",
  },
  summary: {
    totalInstances: 10,
    active: 6,
    completed: 2,
    exited: 1,
    stopped: 1,
  },
  states: [
    {
      id: "state-start",
      name: "Prospect Entry",
      isStart: true,
      currentCount: 3,
      totalEntered: 10,
      averageTimeInStateMs: 86400000,
      averageTimeInStateFormatted: "1d",
    },
    {
      id: "state-qualified",
      name: "Qualified Lead",
      isStart: false,
      currentCount: 3,
      totalEntered: 5,
      averageTimeInStateMs: 172800000,
      averageTimeInStateFormatted: "2d",
    },
  ],
  transitions: [
    {
      id: "trans-qualify",
      from: "state-start",
      fromName: "Prospect Entry",
      to: "state-qualified",
      toName: "Qualified Lead",
      triggerKind: "record_updated",
      count: 5,
      successCount: 4,
      failedCount: 1,
    },
  ],
};

const fetchJourneyReportMock = vi.fn(
  async (_orgSlug?: string, _journeyId?: string, _options?: unknown) => mockReportData,
);

vi.mock("./api", () => ({
  fetchJourneyReport: (orgSlug: string, journeyId: string, options?: unknown) =>
    fetchJourneyReportMock(orgSlug, journeyId, options),
}));

describe("JourneyReportScreen", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders KPIs, state metrics, and transition overall flow", async () => {
    render(<JourneyReportScreen orgSlug="test-org" journeyId="j-123" />);

    expect(await screen.findByTestId("report-journey-title")).toBeDefined();
    expect(screen.getByTestId("kpi-total").textContent).toBe("10");
    expect(screen.getByTestId("kpi-active").textContent).toBe("6");
    expect(screen.getByTestId("kpi-completed").textContent).toBe("2");
    expect(screen.getByTestId("kpi-exited").textContent).toBe("1");
    expect(screen.getByTestId("kpi-stopped").textContent).toBe("1");

    // States breakdown
    expect(screen.getByTestId("state-metric-state-start")).toBeDefined();
    expect(screen.getByTestId("state-current-state-start").textContent).toBe("3");
    expect(screen.getByTestId("state-total-state-start").textContent).toBe("10");
    expect(screen.getByTestId("state-avgtime-state-start").textContent).toBe("1d");

    // Transition flow
    expect(screen.getByTestId("transition-metric-trans-qualify")).toBeDefined();
    expect(screen.getByTestId("transition-count-trans-qualify").textContent).toBe("5");
    expect(screen.getByText("80%")).toBeDefined();
  });

  it("handles date range selector clicks and refetches data", async () => {
    render(<JourneyReportScreen orgSlug="test-org" journeyId="j-123" />);
    await screen.findByTestId("report-journey-title");

    const btn30d = screen.getByTestId("report-range-30d");
    fireEvent.click(btn30d);

    await waitFor(() => {
      expect(fetchJourneyReportMock).toHaveBeenCalledTimes(2);
    });
  });
});
