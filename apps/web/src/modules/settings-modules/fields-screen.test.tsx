// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { FieldsScreen } from "./fields-screen";

afterEach(cleanup);
const rows = [
  { apiName: "Last_Name", label: "Last Name", dataType: "Single Line", custom: false },
  { apiName: "Email", label: "Email", dataType: "Email", custom: false },
];

describe("FieldsScreen", () => {
  it("lists fields, filters by label or type, and keeps writes disabled", async () => {
    render(<FieldsScreen orgSlug="o" module="Leads" rows={rows} />);
    expect(screen.getByRole("heading", { name: "Leads" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Custom Field" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "Fields" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Layouts" }).getAttribute("href")).toBe(
      "/crm/o/settings/modules/Leads/layouts",
    );
    expect(screen.getByRole("button", { name: "Create and Edit Fields" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("link", { name: "Back to Modules" }).getAttribute("href")).toBe(
      "/crm/o/settings/modules",
    );
    await userEvent.type(
      screen.getByRole("searchbox", { name: "Search Fields or Data Types" }),
      "email",
    );
    expect(screen.getAllByRole("row")).toHaveLength(2);
    await userEvent.clear(screen.getByRole("searchbox", { name: "Search Fields or Data Types" }));
    await userEvent.type(
      screen.getByRole("searchbox", { name: "Search Fields or Data Types" }),
      "zzz",
    );
    expect(screen.getByText("No fields found")).toBeDefined();
  });

  it("renders with Contacts module heading and sidebar active state", () => {
    render(<FieldsScreen orgSlug="test-org" module="Contacts" rows={rows} />);
    expect(screen.getByRole("heading", { name: "Contacts" })).toBeDefined();
    const nav = screen.getByRole("navigation", { name: "Modules" });
    const current = nav.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe("Contacts");
    expect(screen.getByRole("tab", { name: "Layouts" }).getAttribute("href")).toBe(
      "/crm/test-org/settings/modules/Contacts/layouts",
    );
  });
});
