// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fixtureReportsPort } from "./fixture-port";
import { ReportDetailScreen } from "./report-detail-screen";

afterEach(cleanup);

describe("Report detail", () => {
  it("renders header, toolbar, nine headings and the empty state", async () => {
    render(<ReportDetailScreen orgSlug="demo" reportId="sample-report-2" />);
    expect(await screen.findByRole("heading", { name: "Message engagement summary" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Back to Reports" }).getAttribute("href")).toBe(
      "/crm/demo/tab/Reports",
    );
    for (const name of [
      "Report information",
      "Refresh report",
      "Edit",
      "Report menu",
      "Filter",
      "Filter By Date",
      "Clear",
      "Show Details",
    ]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }
    expect(screen.getByTestId("filter-active-indicator")).toBeTruthy();
    expect(screen.getByText(/^Updated/)).toBeTruthy();
    const table = screen.getByRole("table", { name: "Report results" });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(9);
    expect(screen.getByText("No Data Found")).toBeTruthy();
  });

  it("renders populated rows from fixture data", async () => {
    render(<ReportDetailScreen orgSlug="demo" reportId="sample-report-1" />);
    const table = await screen.findByRole("table", { name: "Report results" });
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(screen.queryByText("No Data Found")).toBeNull();
  });

  it("refresh re-reads the port", async () => {
    const getReport = vi.fn(fixtureReportsPort.getReport);
    render(
      <ReportDetailScreen
        orgSlug="demo"
        reportId="sample-report-1"
        port={{ ...fixtureReportsPort, getReport }}
      />,
    );
    await screen.findByRole("table", { name: "Report results" });
    await userEvent.setup().click(screen.getByRole("button", { name: "Refresh report" }));
    expect(getReport).toHaveBeenCalledTimes(2);
  });

  it("shows not found for an unknown id", async () => {
    render(<ReportDetailScreen orgSlug="demo" reportId="nope" />);
    expect((await screen.findByRole("alert")).textContent).toBe("Report not found.");
  });
});
