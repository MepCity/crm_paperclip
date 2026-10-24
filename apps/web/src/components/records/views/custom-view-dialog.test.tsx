import type { FieldDefinition } from "@crm/core/records";
import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import * as api from "./custom-view-api";
import { CustomViewDialog, type CustomViewDialogProps } from "./custom-view-dialog";

const mockFields: (FieldDefinition & { id?: string })[] = [
  {
    id: "f-name",
    apiName: "Full_Name",
    label: "Lead Name",
    dataType: "text",
    required: true,
    readOnly: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
    unique: false,
    massUpdate: false,
  },
  {
    id: "f-company",
    apiName: "Company",
    label: "Company",
    dataType: "text",
    required: true,
    readOnly: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
    unique: false,
    massUpdate: false,
  },
  {
    id: "f-email",
    apiName: "Email",
    label: "Email",
    dataType: "email",
    required: false,
    readOnly: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
    unique: false,
    massUpdate: false,
  },
  {
    id: "f-phone",
    apiName: "Phone",
    label: "Phone",
    dataType: "phone",
    required: false,
    readOnly: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
    unique: false,
    massUpdate: false,
  },
  {
    id: "f-revenue",
    apiName: "Annual_Revenue",
    label: "Annual Revenue",
    dataType: "currency",
    required: false,
    readOnly: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
    unique: false,
    massUpdate: false,
  },
  {
    id: "f-email-opt-out",
    apiName: "Email_Opt_Out",
    label: "Email Opt Out",
    dataType: "boolean",
    required: false,
    readOnly: false,
    views: { view: true, create: true, edit: true, quickCreate: true },
    unique: false,
    massUpdate: false,
  },
];

function defaultProps(overrides: Partial<CustomViewDialogProps> = {}): CustomViewDialogProps {
  return {
    open: true,
    mode: "create",
    module: "Leads",
    orgSlug: "test-org",
    isAdmin: true,
    expectedRevision: "rev-1",
    fields: mockFields,
    onClose: vi.fn(),
    onSave: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
}

describe("CustomViewDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders create form with available and selected columns", () => {
    render(<CustomViewDialog {...defaultProps()} />);
    expect(screen.getByRole("heading", { name: "New Custom View" })).toBeTruthy();
    expect(screen.getByLabelText("Enter Custom View Name")).toBeTruthy();
    expect(screen.getByText('Specify Criteria - "Leads"')).toBeTruthy();
    expect(screen.getByText("Choose Column for Default List View")).toBeTruthy();
  });

  it("validates empty view name and columns before submission", async () => {
    const user = userEvent.setup();
    render(<CustomViewDialog {...defaultProps({ initial: { columns: [] } })} />);

    const saveButton = screen.getByRole("button", { name: "Save" });
    await user.click(saveButton);

    expect(screen.getByRole("alert").textContent).toContain("Enter a custom view name.");
  });

  it("adds and removes columns", async () => {
    const user = userEvent.setup();
    render(
      <CustomViewDialog
        {...defaultProps({
          initial: { columns: ["Full_Name", "Company"] },
        })}
      />,
    );

    // Initial selected columns
    expect(screen.getByLabelText("Remove column Lead Name")).toBeTruthy();
    expect(screen.getByLabelText("Remove column Company")).toBeTruthy();

    // Click to add Email
    const addEmail = screen.getByRole("button", { name: "Email" });
    await user.click(addEmail);

    expect(screen.getByLabelText("Remove column Email")).toBeTruthy();

    // Remove Lead Name
    await user.click(screen.getByLabelText("Remove column Lead Name"));
    expect(screen.queryByLabelText("Remove column Lead Name")).toBeNull();
  });

  it("adds and updates criteria rows", async () => {
    const user = userEvent.setup();
    render(<CustomViewDialog {...defaultProps()} />);

    expect(screen.getByText("No criteria specified.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Add Criterion" }));

    expect(screen.getByLabelText("Criterion 1 Field")).toBeTruthy();
    expect(screen.getByLabelText("Criterion 1 Comparator")).toBeTruthy();
    expect(screen.getByLabelText("Criterion 1 Value")).toBeTruthy();

    await user.type(screen.getByLabelText("Criterion 1 Value"), "Acme");
    expect((screen.getByLabelText("Criterion 1 Value") as HTMLInputElement).value).toBe("Acme");

    await user.click(screen.getByLabelText("Remove criterion 1"));
    expect(screen.queryByLabelText("Criterion 1 Field")).toBeNull();
  });

  it("saves a new shared custom view through sendViewCommand with stable field IDs", async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(api, "sendViewCommand").mockResolvedValue({
      ok: true,
      revision: "rev-2",
    });

    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <CustomViewDialog
        {...defaultProps({
          isAdmin: true,
          onSave,
          onClose,
          initial: { columns: ["Full_Name", "Company"] },
        })}
      />,
    );

    // Sharing section is visible for admin
    expect(screen.getByTestId("sharing-section")).toBeTruthy();

    // Type name
    await user.type(screen.getByLabelText("Enter Custom View Name"), "Enterprise Leads");

    // Click Save
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(sendSpy).toHaveBeenCalledWith(
      "test-org",
      "Leads",
      "POST",
      "rev-1",
      expect.objectContaining({
        type: "view.create",
        view: expect.objectContaining({
          name: "Enterprise Leads",
          columns: ["f-name", "f-company"],
          systemDefined: false,
          isDefault: false,
        }),
      }),
      undefined,
    );

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Enterprise Leads",
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("preserves criteria AST with groupOperator OR and typed values", async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(api, "sendViewCommand").mockResolvedValue({
      ok: true,
      revision: "rev-2",
    });

    render(
      <CustomViewDialog
        {...defaultProps({
          mode: "edit",
          isAdmin: true,
          initial: {
            id: "view-or-test",
            name: "OR Leads",
            columns: ["Full_Name"],
            criteria: {
              groupOperator: "or",
              group: [
                { field: "Annual_Revenue", comparator: "greater_than", value: 50000 },
                { field: "Email_Opt_Out", comparator: "equal", value: true },
              ],
            },
          },
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(sendSpy).toHaveBeenCalledWith(
      "test-org",
      "Leads",
      "PATCH",
      "rev-1",
      expect.objectContaining({
        type: "view.patch",
        view: expect.objectContaining({
          id: "view-or-test",
          name: "OR Leads",
          criteria: {
            groupOperator: "or",
            group: [
              { field: "f-revenue", comparator: "greater_than", value: 50000 },
              { field: "f-email-opt-out", comparator: "equal", value: true },
            ],
          },
        }),
      }),
      "view-or-test",
    );
  });

  it("preserves existing sort without wiping it to null", async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(api, "sendViewCommand").mockResolvedValue({
      ok: true,
      revision: "rev-2",
    });

    render(
      <CustomViewDialog
        {...defaultProps({
          mode: "edit",
          isAdmin: true,
          initial: {
            id: "view-sort-test",
            name: "Sorted Leads",
            columns: ["Full_Name", "Company"],
            sort: { field: "Company", order: "desc" },
          },
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(sendSpy).toHaveBeenCalledWith(
      "test-org",
      "Leads",
      "PATCH",
      "rev-1",
      expect.objectContaining({
        type: "view.patch",
        view: expect.objectContaining({
          id: "view-sort-test",
          sort: { field: "f-company", order: "desc" },
        }),
      }),
      "view-sort-test",
    );
  });

  it("member sees NO sharing option and saves private view to user-scoped storage", async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(api, "sendViewCommand");
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <CustomViewDialog
        {...defaultProps({
          isAdmin: false,
          userId: "member-user-1",
          onSave,
          onClose,
          initial: { columns: ["Full_Name"] },
        })}
      />,
    );

    // Sharing section MUST NOT be rendered for members (Kurul 1 / Board decision 1)
    expect(screen.queryByTestId("sharing-section")).toBeNull();
    expect(screen.queryByRole("radio", { name: "Everyone" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "Only me" })).toBeNull();

    await user.type(screen.getByLabelText("Enter Custom View Name"), "My Personal Leads");
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Must NOT call organization shared view command
    expect(sendSpy).not.toHaveBeenCalled();

    // Must call onSave with private view
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "My Personal Leads",
        sharedTo: "only_me",
      }),
    );
    expect(onClose).toHaveBeenCalled();

    // User-scoped private view is saved in localStorage
    const saved = api.getPrivateViews("test-org", "member-user-1", "Leads");
    expect(saved).toHaveLength(1);
    expect(saved[0]?.name).toBe("My Personal Leads");

    // Second user does NOT see this view (user isolation)
    const otherUserViews = api.getPrivateViews("test-org", "other-user-2", "Leads");
    expect(otherUserViews).toEqual([]);
  });

  it("admin selecting 'Only me' saves private view without calling sendViewCommand", async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(api, "sendViewCommand");
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <CustomViewDialog
        {...defaultProps({
          isAdmin: true,
          userId: "admin-user-1",
          onSave,
          onClose,
          initial: { columns: ["Full_Name"] },
        })}
      />,
    );

    // Admin sees sharing options and selects "Only me"
    expect(screen.getByTestId("sharing-section")).toBeTruthy();
    await user.click(screen.getByRole("radio", { name: "Only me" }));

    await user.type(screen.getByLabelText("Enter Custom View Name"), "Admin Private Leads");
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Does NOT hit organization shared views endpoint
    expect(sendSpy).not.toHaveBeenCalled();

    // Saved to admin's private views
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Admin Private Leads",
        sharedTo: "only_me",
      }),
    );
    const adminViews = api.getPrivateViews("test-org", "admin-user-1", "Leads");
    expect(adminViews).toHaveLength(1);
    expect(adminViews[0]?.name).toBe("Admin Private Leads");
  });

  it("preserves nested criteria AST A AND (B OR C) when editing name only", async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(api, "sendViewCommand").mockResolvedValue({
      ok: true,
      revision: "rev-2",
    });

    const nestedCriteria = {
      groupOperator: "and" as const,
      group: [
        { field: "f-name", comparator: "equal" as const, value: "Acme" },
        {
          groupOperator: "or" as const,
          group: [
            { field: "f-revenue", comparator: "greater_than" as const, value: 50000 },
            { field: "f-company", comparator: "equal" as const, value: "Big Corp" },
          ],
        },
      ],
    };

    render(
      <CustomViewDialog
        {...defaultProps({
          mode: "edit",
          isAdmin: true,
          initial: {
            id: "view-nested",
            name: "Original Nested View",
            columns: ["Full_Name"],
            criteria: nestedCriteria,
          },
        })}
      />,
    );

    const nameInput = screen.getByLabelText("Enter Custom View Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Renamed Nested View");

    await user.click(screen.getByRole("button", { name: "Save" }));

    // The nested AST must NOT be flattened to A AND B AND C!
    expect(sendSpy).toHaveBeenCalledWith(
      "test-org",
      "Leads",
      "PATCH",
      "rev-1",
      expect.objectContaining({
        type: "view.patch",
        view: expect.objectContaining({
          id: "view-nested",
          name: "Renamed Nested View",
          criteria: {
            groupOperator: "and",
            group: [
              { field: "f-name", comparator: "equal", value: "Acme" },
              {
                groupOperator: "or",
                group: [
                  { field: "f-revenue", comparator: "greater_than", value: 50000 },
                  { field: "f-company", comparator: "equal", value: "Big Corp" },
                ],
              },
            ],
          },
        }),
      }),
      "view-nested",
    );
  });

  it("preserves nested criteria AST and updates modified leaf value", async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(api, "sendViewCommand").mockResolvedValue({
      ok: true,
      revision: "rev-2",
    });

    const nestedCriteria = {
      groupOperator: "and" as const,
      group: [
        { field: "f-name", comparator: "equal" as const, value: "Acme" },
        {
          groupOperator: "or" as const,
          group: [
            { field: "f-revenue", comparator: "greater_than" as const, value: 50000 },
            { field: "f-company", comparator: "equal" as const, value: "Old Corp" },
          ],
        },
      ],
    };

    render(
      <CustomViewDialog
        {...defaultProps({
          mode: "edit",
          isAdmin: true,
          initial: {
            id: "view-nested-edit",
            name: "Nested Edit",
            columns: ["Full_Name"],
            criteria: nestedCriteria,
          },
        })}
      />,
    );

    // Edit criterion 3 value (the second leaf in the OR group: row index 2)
    const val3 = screen.getByLabelText("Criterion 3 Value");
    await user.clear(val3);
    await user.type(val3, "New Corp");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(sendSpy).toHaveBeenCalledWith(
      "test-org",
      "Leads",
      "PATCH",
      "rev-1",
      expect.objectContaining({
        type: "view.patch",
        view: expect.objectContaining({
          id: "view-nested-edit",
          criteria: {
            groupOperator: "and",
            group: [
              { field: "f-name", comparator: "equal", value: "Acme" },
              {
                groupOperator: "or",
                group: [
                  { field: "f-revenue", comparator: "greater_than", value: 50000 },
                  { field: "f-company", comparator: "equal", value: "New Corp" },
                ],
              },
            ],
          },
        }),
      }),
      "view-nested-edit",
    );
  });

  it("correctly changes boolean criterion from true to false", async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(api, "sendViewCommand").mockResolvedValue({
      ok: true,
      revision: "rev-2",
    });

    render(
      <CustomViewDialog
        {...defaultProps({
          mode: "edit",
          isAdmin: true,
          initial: {
            id: "view-bool",
            name: "Boolean View",
            columns: ["Full_Name"],
            criteria: {
              field: "f-email-opt-out",
              comparator: "equal",
              value: true,
            },
          },
        })}
      />,
    );

    const valInput = screen.getByLabelText("Criterion 1 Value");
    expect((valInput as HTMLInputElement).value).toBe("true");

    await user.clear(valInput);
    await user.type(valInput, "false");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(sendSpy).toHaveBeenCalledWith(
      "test-org",
      "Leads",
      "PATCH",
      "rev-1",
      expect.objectContaining({
        view: expect.objectContaining({
          criteria: {
            field: "f-email-opt-out",
            comparator: "equal",
            value: false, // NOT true!
          },
        }),
      }),
      "view-bool",
    );
  });

  it("correctly parses and sends numeric between criterion as [number, number]", async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(api, "sendViewCommand").mockResolvedValue({
      ok: true,
      revision: "rev-2",
    });

    render(
      <CustomViewDialog
        {...defaultProps({
          mode: "edit",
          isAdmin: true,
          initial: {
            id: "view-between",
            name: "Between View",
            columns: ["Full_Name"],
            criteria: {
              field: "f-revenue",
              comparator: "between",
              value: [10000, 50000],
            },
          },
        })}
      />,
    );

    // Initial input display should be "10000, 50000", not "[10000,50000]"
    const valInput = screen.getByLabelText("Criterion 1 Value");
    expect((valInput as HTMLInputElement).value).toBe("10000, 50000");

    await user.clear(valInput);
    await user.type(valInput, "20000, 80000");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(sendSpy).toHaveBeenCalledWith(
      "test-org",
      "Leads",
      "PATCH",
      "rev-1",
      expect.objectContaining({
        view: expect.objectContaining({
          criteria: {
            field: "f-revenue",
            comparator: "between",
            value: [20000, 80000], // Real numbers, NOT [NaN, NaN] or [null, null]
          },
        }),
      }),
      "view-between",
    );
  });

  it("protects system-defined and default views: disables Save and Delete", () => {
    render(
      <CustomViewDialog
        {...defaultProps({
          mode: "edit",
          initial: {
            id: "all-leads",
            name: "All Leads",
            systemDefined: true,
            isDefault: true,
            columns: ["Full_Name"],
          },
        })}
      />,
    );

    expect(
      screen.getByText("Protected view: System and default views cannot be edited or deleted."),
    ).toBeTruthy();

    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(
      saveButton.hasAttribute("disabled") || saveButton.getAttribute("aria-disabled") === "true",
    ).toBe(true);

    const deleteButton = screen.getByRole("button", { name: "Delete View" });
    expect(
      deleteButton.hasAttribute("disabled") ||
        deleteButton.getAttribute("aria-disabled") === "true",
    ).toBe(true);
  });

  it("surfaces protected_view server rejection if server rejects", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "sendViewCommand").mockResolvedValue({
      ok: false,
      stale: false,
      forbidden: false,
      message: "protected_view: system and default views are immutable.",
      fieldErrors: { view: ["protected_view"] },
    });

    render(
      <CustomViewDialog
        {...defaultProps({
          mode: "edit",
          initial: {
            id: "protected-custom",
            name: "Protected Custom",
            systemDefined: false,
            columns: ["Full_Name"],
          },
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("protected_view");
    });
  });

  it("surfaces view_field error when view references an inactive/retired field and does NOT drop it", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "sendViewCommand").mockResolvedValue({
      ok: false,
      stale: false,
      forbidden: false,
      message: "View references an inactive or unknown field: retired_field.",
      fieldErrors: { view_field: ["retired_field"] },
    });

    render(
      <CustomViewDialog
        {...defaultProps({
          mode: "create",
          initial: {
            columns: ["Full_Name"],
            criteria: { field: "retired_field", comparator: "equal", value: "test" },
          },
        })}
      />,
    );

    await user.type(screen.getByLabelText("Enter Custom View Name"), "Test View");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "View references an inactive or unknown field: retired_field",
      );
    });

    // Ensure the criterion was not silently dropped
    expect(screen.getByTestId("criterion-row-0")).toBeTruthy();
  });

  it("retains user draft entries when server reports SCHEMA_REVISION_MISMATCH", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "sendViewCommand").mockResolvedValue({
      ok: false,
      stale: true,
      forbidden: false,
      message:
        "The views changed since this page loaded. Refresh to load the latest definition, then save again; your entries are kept.",
    });

    render(
      <CustomViewDialog
        {...defaultProps({
          initial: { columns: ["Full_Name"] },
        })}
      />,
    );

    await user.type(screen.getByLabelText("Enter Custom View Name"), "Keep My Name");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain(
        "The views changed since this page loaded",
      );
    });

    // Form value is still there
    expect((screen.getByLabelText("Enter Custom View Name") as HTMLInputElement).value).toBe(
      "Keep My Name",
    );
  });

  it("deletes a custom view when Delete View is clicked", async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(api, "sendViewCommand").mockResolvedValue({
      ok: true,
      revision: "rev-3",
    });

    const onDelete = vi.fn();
    const onClose = vi.fn();

    render(
      <CustomViewDialog
        {...defaultProps({
          mode: "edit",
          initial: {
            id: "custom-view-1",
            name: "Old View",
            systemDefined: false,
            isDefault: false,
            columns: ["Full_Name"],
          },
          onDelete,
          onClose,
        })}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete View" }));

    expect(sendSpy).toHaveBeenCalledWith(
      "test-org",
      "Leads",
      "DELETE",
      "rev-1",
      { type: "view.delete" },
      "custom-view-1",
    );
    expect(onDelete).toHaveBeenCalledWith("custom-view-1");
    expect(onClose).toHaveBeenCalled();
  });
});
