import type { AdsSummary } from "@crm/core/ads";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdsSummaryReportScreen, summaryToReport } from "./ads-summary-report-screen";

vi.mock("./api", () => ({ fetchAdsSummary: vi.fn() }));

const summary: AdsSummary = {
  rows: [
    {
      campaignId: "c1",
      campaignName: "Autumn Search",
      adGroupId: "g1",
      adGroupName: "Brand",
      keywordId: "k1",
      keywordName: "crm software",
      leads: 2,
      contacts: 1,
      deals: 1,
      dealAmount: 1500,
    },
    {
      campaignId: null,
      campaignName: null,
      adGroupId: null,
      adGroupName: null,
      keywordId: null,
      keywordName: null,
      leads: 1,
      contacts: 0,
      deals: 0,
      dealAmount: 0,
    },
  ],
  totals: { leads: 3, contacts: 1, deals: 1, dealAmount: 1500 },
};

const english = (key: string) =>
  ({
    "modules.adsSummary.noCampaign": "No campaign",
    "modules.adsSummary.noGroup": "No ad group",
    "modules.adsSummary.noKeyword": "No keyword",
    "modules.adsSummary.grandTotal": "Grand Total",
  })[key] ?? key;

describe("ads summary report", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("maps the aggregation to one row per keyword bucket plus a grand total", () => {
    const report = summaryToReport(summary, english as never, new Date("2026-11-12T00:00:00Z"));
    expect(report.headings).toHaveLength(5);
    expect(report.rows).toEqual([
      ["Autumn Search › Brand › crm software", "2", "1", "1", "1,500.00"],
      ["No campaign › No ad group › No keyword", "1", "0", "0", "0.00"],
      ["Grand Total", "3", "1", "1", "1,500.00"],
    ]);
    expect(summaryToReport({ rows: [], totals: summary.totals }, english as never).rows).toEqual(
      [],
    );
  });

  it("renders the report table and reloads with the applied date range", async () => {
    const user = userEvent.setup();
    const load = vi.fn(async () => summary);
    render(<AdsSummaryReportScreen orgSlug="test-org" load={load} />);
    const table = await screen.findByRole("table");
    expect(within(table).getByText("Autumn Search › Brand › crm software")).toBeTruthy();
    expect(within(table).getByText("Grand Total")).toBeTruthy();
    expect(load).toHaveBeenLastCalledWith({});

    const from = screen.getByLabelText("From") as HTMLInputElement;
    const to = screen.getByLabelText("To") as HTMLInputElement;
    await user.type(from, "2026-11-01");
    await user.type(to, "2026-11-30");
    await user.click(screen.getByTestId("ads-summary-apply"));
    await waitFor(() =>
      expect(load).toHaveBeenLastCalledWith({ from: "2026-11-01", to: "2026-11-30" }),
    );

    await user.click(screen.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(load).toHaveBeenLastCalledWith({}));
  });

  it("shows the empty message when no record is attributed", async () => {
    const load = vi.fn(async () => ({ rows: [], totals: summary.totals }));
    render(<AdsSummaryReportScreen orgSlug="test-org" load={load} />);
    expect(await screen.findByTestId("ads-summary-empty")).toBeTruthy();
  });
});
