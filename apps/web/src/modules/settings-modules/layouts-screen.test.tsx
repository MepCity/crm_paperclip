// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { LayoutsScreen } from "./layouts-screen";

afterEach(cleanup);

describe("LayoutsScreen", () => {
  it("renders 4-column table, default row, and keeps writes disabled", () => {
    render(<LayoutsScreen orgSlug="org-1" module="Leads" />);

    expect(screen.getByRole("heading", { name: "Leads" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Shared To" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Last Modified" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeDefined();

    expect(screen.getByText("Standard")).toBeDefined();
    expect(screen.getByText("Administrator and Standard")).toBeDefined();
    expect(screen.getByRole("switch", { name: "Standard layout status" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(
      screen.getByRole("switch", { name: "Standard layout status" }).getAttribute("aria-checked"),
    ).toBe("true");

    expect(screen.getByRole("tab", { name: "Layouts" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Fields" }).getAttribute("href")).toBe(
      "/crm/org-1/settings/modules/Leads/fields",
    );
    expect(screen.getByRole("button", { name: "Create New Layout" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("link", { name: "Back to Modules" }).getAttribute("href")).toBe(
      "/crm/org-1/settings/modules",
    );
  });

  it("includes More menu for Leads layout row", () => {
    render(<LayoutsScreen orgSlug="org-1" module="Leads" />);
    expect(screen.getByRole("button", { name: "More" })).toBeDefined();
    expect(screen.getByRole("button", { name: "More" })).toHaveProperty("disabled", true);
  });

  it("does not include More menu for Contacts, Accounts, or Deals", () => {
    const { unmount } = render(<LayoutsScreen orgSlug="org-1" module="Contacts" />);
    expect(screen.queryByRole("button", { name: "More" })).toBeNull();
    unmount();

    render(<LayoutsScreen orgSlug="org-1" module="Accounts" />);
    expect(screen.queryByRole("button", { name: "More" })).toBeNull();
    cleanup();

    render(<LayoutsScreen orgSlug="org-1" module="Deals" />);
    expect(screen.queryByRole("button", { name: "More" })).toBeNull();
  });

  it("filters sidebar modules and preserves active module highlighting", async () => {
    render(<LayoutsScreen orgSlug="org-1" module="Accounts" />);
    const nav = screen.getByRole("navigation", { name: "Modules" });
    const current = nav.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe("Accounts");

    await userEvent.click(screen.getByRole("button", { name: "Search modules" }));
    const searchInput = screen.getByRole("searchbox", { name: "Filter modules" });
    await userEvent.type(searchInput, "deal");
    expect(screen.getByRole("link", { name: "Deals" })).toBeDefined();
    expect(screen.queryByRole("link", { name: "Contacts" })).toBeNull();
  });
});
