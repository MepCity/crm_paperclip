// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { EmailTemplatesScreen } from "./email-templates-screen";
import { fixtureEmailTemplatesPort } from "./fixture-port";

afterEach(cleanup);

describe("EmailTemplatesScreen", () => {
  it("renders default view with all controls and inventory rows present", async () => {
    render(<EmailTemplatesScreen port={fixtureEmailTemplatesPort} />);

    // Screen title and type tabs
    expect(screen.getByRole("heading", { name: "Templates" })).toBeDefined();
    const emailTab = screen.getByRole("tab", { name: "Email" });
    expect(emailTab.getAttribute("aria-selected")).toBe("true");

    const inventoryTab = screen.getByRole("tab", { name: "Inventory" });
    expect(inventoryTab.getAttribute("data-later-module")).toBe("P2");

    const mailMergeTab = screen.getByRole("tab", { name: "Mail Merge" });
    expect(mailMergeTab.getAttribute("data-later-module")).toBe("M10");

    // Controls in header
    expect(screen.getByRole("combobox", { name: "All Modules" })).toBeDefined();
    expect(screen.getByRole("searchbox", { name: "Search Template" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Help" }).getAttribute("data-later-module")).toBe(
      "M10",
    );

    // Wait for async port data to load
    await screen.findByRole("button", { name: "All Templates" });

    // Folder pane
    expect(
      screen.getByRole("button", { name: "New Template" }).getAttribute("aria-disabled"),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Favorites" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Associated Templates" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Created by me" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Shared with me" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Public Email Templates" })).toBeDefined();
    expect(
      screen.getByRole("button", { name: "Reorder folders" }).getAttribute("data-later-module"),
    ).toBe("M10");

    // Table headers
    expect(screen.getByRole("checkbox", { name: "Select all" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Template Name" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Modified By" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Last Used" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Stats" })).toBeDefined();

    // Table rows populated
    await screen.findByText("Big Deal Alert");
    expect(screen.getByText("Lead Welcome Notice")).toBeDefined();
    expect(screen.getByText("Quarterly Review Invite")).toBeDefined();
    expect(screen.getByText("Contact Follow-up")).toBeDefined();
    expect(screen.getByText("Task Escalation Reminder")).toBeDefined();

    // Row-level inert controls
    const favoriteButtons = screen.getAllByRole("button", { name: "Favorite" });
    expect(favoriteButtons.length).toBeGreaterThan(0);
    expect(favoriteButtons[0]?.getAttribute("data-later-module")).toBe("M10");

    const actionButtons = screen.getAllByRole("button", { name: "Document action" });
    expect(actionButtons.length).toBeGreaterThan(0);
    expect(actionButtons[0]?.getAttribute("data-later-module")).toBe("M10");
  });

  it("filters templates by folder selection", async () => {
    const user = userEvent.setup();
    render(<EmailTemplatesScreen port={fixtureEmailTemplatesPort} />);

    await screen.findByText("Big Deal Alert");

    // Switch to Favorites folder
    await user.click(screen.getByRole("button", { name: "Favorites" }));
    expect(screen.getByText("Lead Welcome Notice")).toBeDefined();
    expect(screen.getByText("Contact Follow-up")).toBeDefined();
    expect(screen.queryByText("Big Deal Alert")).toBeNull();
    expect(screen.queryByText("Quarterly Review Invite")).toBeNull();

    // Switch to Associated Templates folder
    await user.click(screen.getByRole("button", { name: "Associated Templates" }));
    expect(screen.getByText("Big Deal Alert")).toBeDefined();
    expect(screen.getByText("Task Escalation Reminder")).toBeDefined();
    expect(screen.queryByText("Lead Welcome Notice")).toBeNull();

    // Switch back to All Templates
    await user.click(screen.getByRole("button", { name: "All Templates" }));
    expect(screen.getByText("Big Deal Alert")).toBeDefined();
    expect(screen.getByText("Lead Welcome Notice")).toBeDefined();
    expect(screen.getByText("Quarterly Review Invite")).toBeDefined();
  });

  it("filters templates by module dropdown", async () => {
    const user = userEvent.setup();
    render(<EmailTemplatesScreen port={fixtureEmailTemplatesPort} />);

    await screen.findByText("Big Deal Alert");

    const moduleSelect = screen.getByRole("combobox", { name: "All Modules" });
    await user.selectOptions(moduleSelect, "Deals");

    expect(screen.getByText("Big Deal Alert")).toBeDefined();
    expect(screen.queryByText("Lead Welcome Notice")).toBeNull();
    expect(screen.queryByText("Quarterly Review Invite")).toBeNull();

    // Switch to Leads
    await user.selectOptions(moduleSelect, "Leads");
    expect(screen.getByText("Lead Welcome Notice")).toBeDefined();
    expect(screen.queryByText("Big Deal Alert")).toBeNull();

    // Reset to All Modules
    await user.selectOptions(moduleSelect, "All Modules");
    expect(screen.getByText("Big Deal Alert")).toBeDefined();
    expect(screen.getByText("Lead Welcome Notice")).toBeDefined();
  });

  it("filters templates by search input", async () => {
    const user = userEvent.setup();
    render(<EmailTemplatesScreen port={fixtureEmailTemplatesPort} />);

    await screen.findByText("Big Deal Alert");

    const searchInput = screen.getByRole("searchbox", { name: "Search Template" });
    await user.type(searchInput, "welcome");

    expect(screen.getByText("Lead Welcome Notice")).toBeDefined();
    expect(screen.queryByText("Big Deal Alert")).toBeNull();
    expect(screen.queryByText("Quarterly Review Invite")).toBeNull();

    await user.clear(searchInput);
    expect(screen.getByText("Big Deal Alert")).toBeDefined();
    expect(screen.getByText("Lead Welcome Notice")).toBeDefined();
  });

  it("displays empty state when no templates match the criteria", async () => {
    const user = userEvent.setup();
    render(<EmailTemplatesScreen port={fixtureEmailTemplatesPort} />);

    await screen.findByText("Big Deal Alert");

    const searchInput = screen.getByRole("searchbox", { name: "Search Template" });
    await user.type(searchInput, "nonexistent-query-string");

    expect(screen.getByText("No records to display.")).toBeDefined();
    expect(screen.queryByText("Big Deal Alert")).toBeNull();
  });
});
