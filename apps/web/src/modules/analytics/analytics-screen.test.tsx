// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnalyticsScreen } from "./analytics-screen";
import {
  allEmptyDashboardData,
  allValuesDashboardData,
  capturedDashboardData,
  createFixtureAnalyticsPort,
} from "./fixture-port";
import type { AnalyticsPort } from "./port";

afterEach(cleanup);

describe("AnalyticsScreen", () => {
  it("renders toolbar controls A01–A09 in rendered/unwired resting state", async () => {
    const port = createFixtureAnalyticsPort();
    render(<AnalyticsScreen orgSlug="acme" port={port} />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "LEADS THIS MONTH" })).toBeTruthy();
    });

    // A01: All dropdown
    const allDropdown = screen.getByRole("button", { name: "All" });
    expect(allDropdown).toBeTruthy();
    expect(allDropdown.getAttribute("aria-disabled")).toBe("true");

    // A02: Overview selector & A03: Favorite star
    const combobox = screen.getByRole("combobox", { name: "Overview selector" });
    expect(combobox.textContent).toContain("Org Overview");
    const star = screen.getByRole("button", { name: "Favorite Org Overview" });
    expect(star).toBeTruthy();
    expect(star.getAttribute("aria-disabled")).toBe("true");

    // A04: All Users scope badge
    const badge = screen.getByLabelText("Scope: All Users");
    expect(badge.textContent).toContain("All Users");

    // A05: Refresh button
    const refreshBtn = screen.getByRole("button", { name: "Refresh all components" });
    expect(refreshBtn).toBeTruthy();

    // A06: Add Component
    const addComp = screen.getByRole("button", { name: "Add Component" });
    expect(addComp).toBeTruthy();
    expect(addComp.getAttribute("aria-disabled")).toBe("true");

    // A07: Create Dashboard
    const createDash = screen.getByRole("button", { name: "Create Dashboard" });
    expect(createDash).toBeTruthy();
    expect(createDash.getAttribute("aria-disabled")).toBe("true");

    // A08: More actions
    const moreActions = screen.getByRole("button", { name: "More actions" });
    expect(moreActions).toBeTruthy();
    expect(moreActions.getAttribute("aria-disabled")).toBe("true");

    // A09: Context help
    const help = screen.getByRole("button", { name: "Analytics help" });
    expect(help).toBeTruthy();
    expect(help.getAttribute("aria-disabled")).toBe("true");
  });

  it("wires refresh button (A05) to re-read dashboard port data", async () => {
    const getDashboardSpy = vi.fn().mockResolvedValue(structuredClone(capturedDashboardData));
    const port: AnalyticsPort = { getDashboard: getDashboardSpy };

    const user = userEvent.setup();
    render(<AnalyticsScreen orgSlug="acme" port={port} />);

    await waitFor(() => {
      expect(getDashboardSpy).toHaveBeenCalledTimes(1);
    });

    const refreshBtn = screen.getByRole("button", { name: "Refresh all components" });
    await user.click(refreshBtn);

    await waitFor(() => {
      expect(getDashboardSpy).toHaveBeenCalledTimes(2);
    });
  });

  it("renders captured dashboard with cards 1 and 2 in empty illustration state and 3–9 in value state", async () => {
    const port = createFixtureAnalyticsPort(capturedDashboardData);
    render(<AnalyticsScreen orgSlug="acme" port={port} />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "LEADS THIS MONTH" })).toBeTruthy();
    });

    // A10.01 / AC01: LEADS THIS MONTH - empty illustration
    const leadsCard = screen.getByRole("region", { name: "LEADS THIS MONTH" });
    expect(leadsCard.textContent).toContain("No data available");

    // A10.02 / AC02: REVENUE THIS MONTH - empty illustration
    const revenueCard = screen.getByRole("region", { name: "REVENUE THIS MONTH" });
    expect(revenueCard.textContent).toContain("No data available");

    // A10.03 / AC03: DEALS IN PIPELINE - value state (9)
    const pipelineCard = screen.getByRole("region", { name: "DEALS IN PIPELINE" });
    expect(pipelineCard.textContent).toContain("9");

    // A10.04 / AC04: ACCOUNTS THIS MONTH - value state (32, 47.5%, Last Month Relative: 61)
    const accountsCard = screen.getByRole("region", { name: "ACCOUNTS THIS MONTH" });
    expect(accountsCard.textContent).toContain("32");
    expect(accountsCard.textContent).toContain("47.5%");
    expect(accountsCard.textContent).toContain("Last Month Relative: 61");

    // A11.01 / AC05: LEAD GENERATION TARGET - THIS YEAR - value state gauge
    const leadTargetCard = screen.getByRole("region", {
      name: "LEAD GENERATION TARGET - THIS YEAR",
    });
    expect(leadTargetCard.textContent).toContain("10");
    expect(leadTargetCard.textContent).toContain("Target: 1000");
    expect(leadTargetCard.textContent).toContain("Remaining : 990");

    // A11.02 / AC06: REVENUE TARGET - THIS YEAR - value state horizontal bar
    const revTargetCard = screen.getByRole("region", { name: "REVENUE TARGET - THIS YEAR" });
    expect(revTargetCard.textContent).toContain("Entire Org");
    expect(revTargetCard.textContent).toContain("Target : $10,000,000.00");
    expect(revTargetCard.textContent).toContain("Achieved : $785,000.00");
    expect(revTargetCard.textContent).toContain("Achieved");

    // A12.01 / AC07: LAST 3 MONTHS PERFORMANCE MONITOR - value state table
    const perfCard = screen.getByRole("region", { name: "LAST 3 MONTHS PERFORMANCE MONITOR" });
    expect(perfCard.textContent).toContain("July 2026");
    expect(perfCard.textContent).toContain("LEADS CREATED");
    expect(perfCard.textContent).toContain("REVENUE WON");
    expect(perfCard.textContent).toContain("$35,000.00");

    // A12.02 / AC08: LEADS BY SOURCE - value state donut & legend
    const sourceCard = screen.getByRole("region", { name: "LEADS BY SOURCE" });
    expect(sourceCard.textContent).toContain("Advertisement 2 (20.00 %)");
    expect(sourceCard.textContent).toContain("Cold Call 2 (20.00 %)");

    // A12.03 / AC09: PROLIFIC SALES REPS - value state scorecard
    const repsCard = screen.getByRole("region", { name: "PROLIFIC SALES REPS" });
    expect(repsCard.textContent).toContain("Deal Owner");
    expect(repsCard.textContent).toContain("Sum of Amount");
    expect(repsCard.textContent).toContain("1. Hatice Arslan");
    expect(repsCard.textContent).toContain("$35,000.00");
  });

  it("renders value state for all cards when fixture provides values (including cards 1 and 2)", async () => {
    const port = createFixtureAnalyticsPort(allValuesDashboardData);
    render(<AnalyticsScreen orgSlug="acme" port={port} />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "LEADS THIS MONTH" })).toBeTruthy();
    });

    const leadsCard = screen.getByRole("region", { name: "LEADS THIS MONTH" });
    expect(leadsCard.textContent).toContain("12");

    const revenueCard = screen.getByRole("region", { name: "REVENUE THIS MONTH" });
    expect(revenueCard.textContent).toContain("$45,000.00");
  });

  it("renders empty illustration state for every card when fixture specifies empty states", async () => {
    const port = createFixtureAnalyticsPort(allEmptyDashboardData);
    render(<AnalyticsScreen orgSlug="acme" port={port} />);

    await waitFor(() => {
      expect(screen.getByRole("region", { name: "LEADS THIS MONTH" })).toBeTruthy();
    });

    const cardTitles = [
      "LEADS THIS MONTH",
      "REVENUE THIS MONTH",
      "DEALS IN PIPELINE",
      "ACCOUNTS THIS MONTH",
      "LEAD GENERATION TARGET - THIS YEAR",
      "REVENUE TARGET - THIS YEAR",
      "LAST 3 MONTHS PERFORMANCE MONITOR",
      "LEADS BY SOURCE",
      "PROLIFIC SALES REPS",
    ];

    for (const title of cardTitles) {
      const card = screen.getByRole("region", { name: title });
      expect(card.textContent).toContain("No data available");
    }
  });

  it("allows clicking per-card refresh buttons to trigger reload", async () => {
    const getDashboardSpy = vi.fn().mockResolvedValue(structuredClone(capturedDashboardData));
    const port: AnalyticsPort = { getDashboard: getDashboardSpy };

    const user = userEvent.setup();
    render(<AnalyticsScreen orgSlug="acme" port={port} />);

    await waitFor(() => {
      expect(getDashboardSpy).toHaveBeenCalledTimes(1);
    });

    const cardRefreshButtons = screen.getAllByRole("button", { name: "Refresh Component" });
    expect(cardRefreshButtons).toHaveLength(9);

    const firstButton = cardRefreshButtons[0];
    expect(firstButton).toBeDefined();
    if (firstButton) {
      await user.click(firstButton);
    }

    await waitFor(() => {
      expect(getDashboardSpy).toHaveBeenCalledTimes(2);
    });
  });

  it("renders error alert when port call fails", async () => {
    const port: AnalyticsPort = {
      getDashboard: vi.fn().mockRejectedValue(new Error("Network failure")),
    };

    render(<AnalyticsScreen orgSlug="acme" port={port} />);

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert.textContent).toContain("Analytics dashboard could not be loaded.");
    });
  });
});
