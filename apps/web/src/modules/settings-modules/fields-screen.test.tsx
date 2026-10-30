// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FieldsScreen } from "./fields-screen";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  refresh.mockClear();
});
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
    const tableRows = screen.getAllByRole("row").slice(1);
    expect(tableRows[0]?.textContent).toContain("Email");
    expect(tableRows[1]?.textContent).toContain("Last Name");
    expect(screen.getByRole("tab", { name: "Field Listing" }).getAttribute("aria-selected")).toBe(
      "true",
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

  describe("editor", () => {
    const layout = {
      id: "layout:Leads",
      label: "Standard",
      isDefault: true,
      sections: [{ id: "s", label: "S", columnCount: 2, columns: [["f1"], []], fields: ["f1"] }],
    };
    const editor = { revision: "r1", layout, retired: [] };
    const editRows = [
      { id: "f1", apiName: "Custom_A", label: "Custom A", dataType: "Single Line", custom: true },
    ];

    it("offers only simple scalar types and sends a revisioned create command", async () => {
      const fetchMock = vi.fn(async () => Response.json({ revision: "r2" }));
      vi.stubGlobal("fetch", fetchMock);
      render(<FieldsScreen orgSlug="o" module="Leads" rows={editRows} editor={editor} />);
      await userEvent.click(screen.getByRole("button", { name: "Create and Edit Fields" }));
      const options = screen.getAllByRole("option").map((o) => o.textContent);
      expect(options).not.toContain("Pick List");
      expect(options).not.toContain("Lookup");
      expect(options).toContain("Single Line");
      await userEvent.type(screen.getByLabelText("Field label"), "Fax Note");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));
      const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
      const [url, init] = calls[0] as [string, RequestInit];
      expect(url).toBe("/crm/v2.2/settings/fields?module=Leads");
      const body = JSON.parse(String(init.body));
      expect(body.expectedRevision).toBe("r1");
      expect(body.command).toMatchObject({ type: "field.create", field: { apiName: "Fax_Note" } });
      expect(refresh).toHaveBeenCalled();
    });

    it("keeps entered values and offers refresh on a stale revision", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          Response.json({ code: "SCHEMA_REVISION_MISMATCH", message: "x" }, { status: 409 }),
        ),
      );
      render(<FieldsScreen orgSlug="o" module="Leads" rows={editRows} editor={editor} />);
      await userEvent.click(screen.getByRole("button", { name: "Edit Custom A" }));
      await userEvent.type(screen.getByLabelText("Field label"), " X");
      await userEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(screen.getByRole("alert").textContent).toContain("Refresh");
      expect((screen.getByLabelText("Field label") as HTMLInputElement).value).toBe("Custom A X");
      await userEvent.click(screen.getByRole("button", { name: "Refresh" }));
      expect(refresh).toHaveBeenCalled();
    });

    it("shows the server message when a required field is rejected", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          Response.json(
            { code: "INVALID_DATA", message: "Required field must be placed." },
            { status: 400 },
          ),
        ),
      );
      render(<FieldsScreen orgSlug="o" module="Leads" rows={editRows} editor={editor} />);
      await userEvent.click(screen.getByRole("button", { name: "Edit Custom A" }));
      await userEvent.click(screen.getByLabelText("Required"));
      await userEvent.click(screen.getByRole("button", { name: "Save" }));
      expect(screen.getByRole("alert").textContent).toContain("Required field must be placed.");
    });
  });
});
