// @vitest-environment jsdom
import type { CustomizationField, LayoutDefinition } from "@crm/core/customization";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LayoutEditor } from "./layout-editor";
import { LayoutsScreen } from "./layouts-screen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const mockFields: CustomizationField[] = [
  {
    id: "field:First_Name",
    apiName: "First_Name",
    label: "First Name",
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: true },
    lifecycle: "active",
  },
  {
    id: "field:Last_Name",
    apiName: "Last_Name",
    label: "Last Name",
    dataType: "text",
    required: true,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: true },
    lifecycle: "active",
  },
  {
    id: "field:Company",
    apiName: "Company",
    label: "Company",
    dataType: "text",
    required: true,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: true },
    lifecycle: "active",
  },
  {
    id: "field:Email",
    apiName: "Email",
    label: "Email",
    dataType: "email",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: true },
    lifecycle: "active",
  },
  {
    id: "field:Annual_Revenue",
    apiName: "Annual_Revenue",
    label: "Annual Revenue",
    dataType: "currency",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: true,
    views: { view: true, create: true, edit: true, quickCreate: true },
    lifecycle: "active",
  },
];

const mockLayout: LayoutDefinition = {
  id: "Leads:layout:default",
  label: "Standard",
  isDefault: true,
  sections: [
    {
      id: "sec-info",
      label: "Lead Information",
      columnCount: 2,
      columns: [
        ["field:First_Name", "field:Last_Name"],
        ["field:Company", "field:Email"],
      ],
      fields: ["field:First_Name", "field:Last_Name", "field:Company", "field:Email"],
    },
    {
      id: "sec-other",
      label: "Other Details",
      columnCount: 1,
      columns: [[]],
      fields: [],
    },
  ],
};

describe("LayoutEditor Component", () => {
  it("renders layout editor with sections, columns, and available fields", () => {
    render(
      <LayoutEditor
        orgSlug="acme"
        module="Leads"
        initialLayout={mockLayout}
        fields={mockFields}
        initialRevision="v1:0"
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Standard Layout" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Save Layout" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Back to Layouts" })).toBeDefined();

    // Section 1
    expect(screen.getByDisplayValue("Lead Information")).toBeDefined();
    expect(screen.getByText("First Name")).toBeDefined();
    expect(screen.getByText("Last Name")).toBeDefined();
    expect(screen.getByText("Company")).toBeDefined();
    expect(screen.getByText("Email")).toBeDefined();

    // Required badges for Last Name and Company
    const requiredBadges = screen.getAllByText("Required");
    expect(requiredBadges.length).toBeGreaterThanOrEqual(2);

    // Section 2
    expect(screen.getByDisplayValue("Other Details")).toBeDefined();

    // Available / Unused fields panel has Annual Revenue
    expect(screen.getByText("Available Fields")).toBeDefined();
    expect(screen.getByText("Annual Revenue")).toBeDefined();
    expect(screen.getByRole("button", { name: "Add Annual Revenue to layout" })).toBeDefined();
  });

  it("allows reordering fields within a column", async () => {
    render(
      <LayoutEditor
        orgSlug="acme"
        module="Leads"
        initialLayout={mockLayout}
        fields={mockFields}
        initialRevision="v1:0"
        onCancel={vi.fn()}
      />,
    );

    const moveDownFirst = screen.getByRole("button", { name: "Move First Name down" });
    await userEvent.click(moveDownFirst);

    // After moving down, First Name move up should now be enabled
    expect(screen.getByRole("button", { name: "Move First Name up" })).not.toHaveProperty(
      "disabled",
      true,
    );
  });

  it("allows moving fields between columns", async () => {
    render(
      <LayoutEditor
        orgSlug="acme"
        module="Leads"
        initialLayout={mockLayout}
        fields={mockFields}
        initialRevision="v1:0"
        onCancel={vi.fn()}
      />,
    );

    const moveToCol2 = screen.getByRole("button", { name: "Move First Name to column 2" });
    await userEvent.click(moveToCol2);

    // First Name should now be in Column 2 and have a button to move to column 1
    expect(screen.getByRole("button", { name: "Move First Name to column 1" })).toBeDefined();
  });

  it("allows hiding a field from the layout into available fields", async () => {
    render(
      <LayoutEditor
        orgSlug="acme"
        module="Leads"
        initialLayout={mockLayout}
        fields={mockFields}
        initialRevision="v1:0"
        onCancel={vi.fn()}
      />,
    );

    const hideEmail = screen.getByRole("button", { name: "Hide Email" });
    await userEvent.click(hideEmail);

    // Email should now be in Available Fields panel
    expect(screen.getByRole("button", { name: "Add Email to layout" })).toBeDefined();
  });

  it("allows placing an available field into the layout", async () => {
    render(
      <LayoutEditor
        orgSlug="acme"
        module="Leads"
        initialLayout={mockLayout}
        fields={mockFields}
        initialRevision="v1:0"
        onCancel={vi.fn()}
      />,
    );

    const addRevenue = screen.getByRole("button", { name: "Add Annual Revenue to layout" });
    await userEvent.click(addRevenue);

    // Annual Revenue should now have layout controls
    expect(screen.getByRole("button", { name: "Hide Annual Revenue" })).toBeDefined();
  });

  it("allows renaming a section and changing column count", async () => {
    render(
      <LayoutEditor
        orgSlug="acme"
        module="Leads"
        initialLayout={mockLayout}
        fields={mockFields}
        initialRevision="v1:0"
        onCancel={vi.fn()}
      />,
    );

    const secInput = screen.getByDisplayValue("Lead Information");
    await userEvent.clear(secInput);
    await userEvent.type(secInput, "Primary Lead Info");
    expect(screen.getByDisplayValue("Primary Lead Info")).toBeDefined();

    // Change column count to 1
    const oneColBtn = screen.getByRole("button", { name: "Set Primary Lead Info to 1 column" });
    await userEvent.click(oneColBtn);
    expect(oneColBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("allows adding and removing sections", async () => {
    render(
      <LayoutEditor
        orgSlug="acme"
        module="Leads"
        initialLayout={mockLayout}
        fields={mockFields}
        initialRevision="v1:0"
        onCancel={vi.fn()}
      />,
    );

    // Add Section
    await userEvent.click(screen.getByRole("button", { name: "Add Section" }));
    const nameInput = screen.getByRole("textbox", { name: "New Section Name" });
    await userEvent.type(nameInput, "Custom Info");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByDisplayValue("Custom Info")).toBeDefined();

    // Delete section
    const deleteBtn = screen.getByRole("button", { name: "Delete section Other Details" });
    await userEvent.click(deleteBtn);
    expect(screen.queryByDisplayValue("Other Details")).toBeNull();
  });

  it("saves layout successfully and calls onSaved callback", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ revision: "v1:1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onSaved = vi.fn();
    render(
      <LayoutEditor
        orgSlug="acme"
        module="Leads"
        initialLayout={mockLayout}
        fields={mockFields}
        initialRevision="v1:0"
        onCancel={vi.fn()}
        onSaved={onSaved}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save Layout" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain("Layout saved successfully.");
    });
    expect(onSaved).toHaveBeenCalledWith(expect.any(Object), "v1:1");
  });

  it("displays server rejection error when required field is unreachable and preserves draft", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        code: "INVALID_DATA",
        message: "Required field is unreachable without a server value.",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LayoutEditor
        orgSlug="acme"
        module="Leads"
        initialLayout={mockLayout}
        fields={mockFields}
        initialRevision="v1:0"
        onCancel={vi.fn()}
      />,
    );

    // Hide required field Company
    await userEvent.click(screen.getByRole("button", { name: "Hide Company" }));

    // Click Save Layout
    await userEvent.click(screen.getByRole("button", { name: "Save Layout" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "Required field is unreachable without a server value.",
      );
    });

    // Verify draft was preserved: Company is still in Available Fields, not lost
    expect(screen.getByRole("button", { name: "Add Company to layout" })).toBeDefined();
  });

  it("handles revision conflict (409) and preserves user draft", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ code: "SCHEMA_REVISION_MISMATCH" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LayoutEditor
        orgSlug="acme"
        module="Leads"
        initialLayout={mockLayout}
        fields={mockFields}
        initialRevision="v1:0"
        onCancel={vi.fn()}
      />,
    );

    // Rename section
    const secInput = screen.getByDisplayValue("Lead Information");
    await userEvent.clear(secInput);
    await userEvent.type(secInput, "My Draft Name");

    await userEvent.click(screen.getByRole("button", { name: "Save Layout" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "The layout changed since this page loaded",
      );
    });

    // Verify user draft was preserved
    expect(screen.getByDisplayValue("My Draft Name")).toBeDefined();
  });
});

describe("LayoutsScreen with Editor Integration", () => {
  it("renders Customize Layout button and clickable row when editor is available", async () => {
    render(
      <LayoutsScreen
        orgSlug="acme"
        module="Leads"
        editor={{
          revision: "v1:0",
          layout: mockLayout,
          fields: mockFields,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "Customize Layout" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Edit Standard layout" })).toBeDefined();

    // Clicking Customize Layout opens the LayoutEditor
    await userEvent.click(screen.getByRole("button", { name: "Customize Layout" }));
    expect(screen.getByRole("heading", { name: "Standard Layout" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Back to Layouts" })).toBeDefined();

    // Clicking Back to Layouts returns to table
    await userEvent.click(screen.getByRole("button", { name: "Back to Layouts" }));
    expect(screen.getByRole("button", { name: "Customize Layout" })).toBeDefined();
  });
});
