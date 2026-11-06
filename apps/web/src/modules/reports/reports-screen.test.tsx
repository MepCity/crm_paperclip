// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { fixtureReportsPort } from "./fixture-port";
import { ReportsScreen, reportPath } from "./reports-screen";

afterEach(cleanup);

describe("Reports landing", () => {
  it("renders thirteen synthetic definitions with captured columns and missing-value dashes", async () => {
    render(<ReportsScreen orgSlug="demo" />);
    const table = await screen.findByRole("table");
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

  it("leaves search, selection, favorite, create and help unwired", async () => {
    const user = userEvent.setup();
    render(<ReportsScreen orgSlug="demo" />);
    await screen.findByRole("table");
    const search = screen.getByRole("textbox", { name: "Search All Reports" });
    await user.type(search, "anything");
    expect((search as HTMLInputElement).value).toBe("");
    for (const name of [
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

  it("opens R01 category selector panel and displays all R09–R19 controls in order", async () => {
    const user = userEvent.setup();
    render(<ReportsScreen orgSlug="demo" />);
    await screen.findByRole("table");

    const trigger = screen.getByRole("button", { name: "All Reports" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();

    // R09: "Search Folder" textbox
    const searchFolder = within(dialog).getByRole("textbox", { name: "Search Folder" });
    expect(searchFolder).toBeTruthy();
    expect((searchFolder as HTMLInputElement).value).toBe("");

    // R09 accepts text but does not filter (R3 U3 open)
    await user.type(searchFolder, "custom search");
    expect((searchFolder as HTMLInputElement).value).toBe("custom search");

    // Listbox with R10-R17
    const listbox = within(dialog).getByRole("listbox", { name: "Report folders" });
    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(8);

    const expectedOptions = [
      "All Reports",
      "My Reports",
      "Favorites",
      "Recently Viewed",
      "Shared Reports",
      "Scheduled Reports",
      "Recently Deleted",
      "Account and Contact Reports",
    ];

    expect(options.map((opt) => opt.textContent?.trim())).toEqual(expectedOptions);

    // R10 is selected (aria-selected="true" + data-selected="true")
    const firstOption = options[0];
    expect(firstOption).toBeDefined();
    expect(firstOption?.getAttribute("aria-selected")).toBe("true");
    expect(firstOption?.getAttribute("data-selected")).toBe("true");
    expect(firstOption?.className).toContain("bg-surface-selected");
    // Other options are not selected
    for (const opt of options.slice(1)) {
      expect(opt.getAttribute("aria-selected")).toBe("false");
      expect(opt.hasAttribute("data-selected")).toBe(false);
    }

    // Divider between R16 and R17
    const separator = within(listbox).getByRole("separator");
    expect(separator).toBeTruthy();

    // R18: Manage Folders button with gear icon, disabled with tooltip
    const manageFolders = within(dialog).getByRole("button", { name: "Manage Folders" });
    expect(manageFolders).toBeTruthy();
    expect(manageFolders.getAttribute("aria-disabled")).toBe("true");

    // R19: Advanced analytics entry, disabled with tooltip
    const advancedAnalytics = within(dialog).getByRole("button", { name: /Advanced analytics/i });
    expect(advancedAnalytics).toBeTruthy();
    expect(advancedAnalytics.getAttribute("aria-disabled")).toBe("true");
    expect(within(advancedAnalytics).getByText("Advanced Analytics")).toBeTruthy();
  });

  it("closes category panel with Escape and returns focus to R01 while selection stays All Reports", async () => {
    const user = userEvent.setup();
    render(<ReportsScreen orgSlug="demo" />);
    await screen.findByRole("table");

    const trigger = screen.getByRole("button", { name: "All Reports" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(trigger.textContent).toContain("All Reports");
  });

  it("closes category panel with outside click and returns focus to R01", async () => {
    const user = userEvent.setup();
    render(<ReportsScreen orgSlug="demo" />);
    const table = await screen.findByRole("table");

    const trigger = screen.getByRole("button", { name: "All Reports" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeTruthy();

    await user.click(within(table).getByText("Report Name"));
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(trigger.textContent).toContain("All Reports");
  });

  it("clicking any option R11–R17 closes panel and keeps All Reports (selection semantics unobserved)", async () => {
    const user = userEvent.setup();
    render(<ReportsScreen orgSlug="demo" />);
    await screen.findByRole("table");

    const trigger = screen.getByRole("button", { name: "All Reports" });

    for (const name of [
      "My Reports",
      "Favorites",
      "Scheduled Reports",
      "Account and Contact Reports",
    ]) {
      await user.click(trigger);
      const dialog = screen.getByRole("dialog");
      const option = within(dialog).getByRole("option", { name });
      await user.click(option);
      expect(screen.queryByRole("dialog")).toBeNull();
      await waitFor(() => expect(document.activeElement).toBe(trigger));
      expect(trigger.textContent).toContain("All Reports");
    }
  });

  it("renders disabled R18 and R19 with 'Not available yet' tooltip triggers", async () => {
    const user = userEvent.setup();
    render(<ReportsScreen orgSlug="demo" />);
    await screen.findByRole("table");

    const trigger = screen.getByRole("button", { name: "All Reports" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog");

    const manageBtn = within(dialog).getByRole("button", { name: "Manage Folders" });
    expect(manageBtn.getAttribute("aria-disabled")).toBe("true");

    const analyticsBtn = within(dialog).getByRole("button", { name: /Advanced analytics/i });
    expect(analyticsBtn.getAttribute("aria-disabled")).toBe("true");

    // Clicking either disabled button does not trigger any action, navigation, or close the dialog
    await user.click(manageBtn);
    expect(screen.getByRole("dialog")).toBeTruthy();
    await user.click(analyticsBtn);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("renders an inert R08 row actions button for every report with hover and focus visibility styles", async () => {
    const user = userEvent.setup();
    render(<ReportsScreen orgSlug="demo" />);
    const table = await screen.findByRole("table");
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
          getReport: async () => null,
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

describe("Reports a11y semantics", () => {
  it("explains unavailable controls and leaves tables unlabeled", async () => {
    render(<ReportsScreen orgSlug="demo" />);
    const table = await screen.findByRole("table");
    expect(table.getAttribute("aria-label")).toBeNull();
    const help = screen.getByRole("button", { name: "Reports help" });
    expect(help.getAttribute("aria-disabled")).toBe("true");
    const note = document.getElementById(help.getAttribute("aria-describedby") ?? "");
    expect(note?.textContent).toContain("Not available");
  });
});

it("opens the observed primary-module entry and cancels without a report write", async () => {
  const user = userEvent.setup();
  render(
    <ReportsScreen
      orgSlug="demo"
      builderActions={{
        fields: async () => ({ ok: true, value: [] }),
        run: async () => ({ ok: false, error: { code: "unavailable" } }),
        save: async () => ({ ok: false, error: { code: "unavailable" } }),
      }}
    />,
  );
  await screen.findByRole("table");
  await user.click(screen.getByRole("button", { name: "Create Report" }));
  const dialog = screen.getByRole("dialog", { name: "Create Report" });
  expect(
    (within(dialog).getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled,
  ).toBe(true);
  await user.click(within(dialog).getByRole("button", { name: /Select Primary Module/ }));
  await user.click(screen.getByRole("option", { name: "Leads" }));
  expect(
    (within(dialog).getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled,
  ).toBe(false);
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(screen.queryByRole("dialog")).toBeNull();
});
