// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { fixtureReportsPort } from "./fixture-port";
import { ReportsScreen, reportPath } from "./reports-screen";

afterEach(cleanup);

describe("Reports landing", () => {
  it("renders thirteen synthetic definitions with captured columns and missing-value dashes", async () => {
    render(<ReportsScreen orgSlug="demo" />);
    const table = await screen.findByRole("table", { name: "Report definitions" });
    expect(within(table).getAllByRole("row")).toHaveLength(14);
    for (const name of [
      "Report Name",
      "Description",
      "Folder",
      "Last Accessed Date",
      "Created By",
    ]) {
      expect(within(table).getByRole("columnheader", { name })).toBeTruthy();
    }
    const rows = within(table).getAllByRole("row");
    expect(
      within(rows[1] as HTMLElement)
        .getAllByRole("cell")
        .slice(-2)
        .map((cell) => cell.textContent),
    ).toEqual(["-", "-"]);
    expect(within(rows[3] as HTMLElement).getByText("01.10.2026")).toBeTruthy();
    expect(within(rows[13] as HTMLElement).getByText("Demo Analyst")).toBeTruthy();
    expect(within(rows[13] as HTMLElement).getAllByText("-")).toHaveLength(2);
  });

  it("links every report to its own detail route and keeps folder values as text", async () => {
    render(<ReportsScreen orgSlug="demo" />);
    const reports = await fixtureReportsPort.listReports();
    for (const report of reports) {
      expect((await screen.findByRole("link", { name: report.name })).getAttribute("href")).toBe(
        reportPath("demo", report.id),
      );
    }
    expect(screen.queryByRole("link", { name: "Outreach Reports" })).toBeNull();
    expect(reportPath("demo", "report/one")).toBe("/crm/demo/tab/Reports/report%2Fone");
  });

  it("leaves search, category, selection, favorite, create and help unwired", async () => {
    const user = userEvent.setup();
    render(<ReportsScreen orgSlug="demo" />);
    await screen.findByRole("table");
    const search = screen.getByRole("textbox", { name: "Search All Reports" });
    await user.type(search, "anything");
    expect((search as HTMLInputElement).value).toBe("");
    for (const name of [
      "All Reports",
      "Create Report",
      "Reports help",
      "Favorite Weekly outreach overview",
      "Report actions: Weekly outreach overview",
    ]) {
      const button = screen.getByRole("button", { name });
      expect(button.getAttribute("aria-disabled")).toBe("true");
      await user.click(button);
    }
    const checkbox = screen.getByRole("checkbox", { name: "Select Weekly outreach overview" });
    await user.click(checkbox);
    expect(checkbox.getAttribute("aria-checked")).not.toBe("true");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getAllByRole("row")).toHaveLength(14);
  });

  it("renders an inert R08 row actions button for every report with hover and focus visibility styles", async () => {
    const user = userEvent.setup();
    render(<ReportsScreen orgSlug="demo" />);
    const table = await screen.findByRole("table", { name: "Report definitions" });
    const reports = await fixtureReportsPort.listReports();

    const dataRows = within(table).getAllByRole("row").slice(1);
    expect(dataRows).toHaveLength(reports.length);

    for (const [index, report] of reports.entries()) {
      const row = dataRows[index] as HTMLElement;
      expect(row.className).toContain("group");

      const button = within(row).getByRole("button", {
        name: `Report actions: ${report.name}`,
      });
      expect(button).toBeTruthy();
      expect(button.getAttribute("aria-disabled")).toBe("true");
      expect(button.className).toContain("opacity-0");
      expect(button.className).toContain("group-hover:opacity-100");
      expect(button.className).toContain("group-focus-within:opacity-100");

      // Inertness: clicking the button performs no navigation, creates no dialog or menu
      await user.click(button);
      expect(screen.queryByRole("menu")).toBeNull();
      expect(screen.queryByRole("dialog")).toBeNull();
    }
  });

  it("shows a safe error if the read adapter fails", async () => {
    render(
      <ReportsScreen
        orgSlug="demo"
        port={{
          listReports: async () => {
            throw new Error("unavailable");
          },
        }}
      />,
    );
    expect((await screen.findByRole("alert")).textContent).toBe("Reports could not be loaded.");
    expect(screen.queryByRole("table")).toBeNull();
  });
});
