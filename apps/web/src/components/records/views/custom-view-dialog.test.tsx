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
    localStorage.clear();
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
          initial: { columns: ["Full_Name"] },
        })}
      />,
    );

    // Initial selected has Full_Name
    expect(screen.getByText("Selected (1)")).toBeTruthy();

    // Click on Company in Available list to add it
    const companyItem = screen.getByText("Company");
    await user.click(companyItem);

    expect(screen.getByText("Selected (2)")).toBeTruthy();

    // Remove Full_Name
    const removeBtn = screen.getByRole("button", { name: "Remove column Lead Name" });
    await user.click(removeBtn);

    expect(screen.getByText("Selected (1)")).toBeTruthy();
  });

  it("reorders columns using move up and move down buttons", async () => {
    const user = userEvent.setup();
    render(
      <CustomViewDialog
        {...defaultProps({
          initial: { columns: ["Full_Name", "Company"] },
        })}
      />,
    );

    const downBtn = screen.getByRole("button", { name: "Move Lead Name down" });
    await user.click(downBtn);

    // Selected items order changed
    const selectedList = screen.getByRole("list", { name: "Selected columns" });
    const items = selectedList.querySelectorAll("li");
    expect(items[0]?.textContent).toContain("Company");
    expect(items[1]?.textContent).toContain("Lead Name");
  });

  it("adds, edits, and removes criteria rows", async () => {
    const user = userEvent.setup();
    render(<CustomViewDialog {...defaultProps()} />);

    expect(screen.getByText("No criteria specified.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Add Criterion" }));
    expect(screen.getByTestId("criterion-row-0")).toBeTruthy();

    const valueInput = screen.getByLabelText("Criterion 1 Value");
    await user.type(valueInput, "Acme");
    expect((valueInput as HTMLInputElement).value).toBe("Acme");

    // Remove criterion
    await user.click(screen.getByRole("button", { name: "Remove criterion 1" }));
    expect(screen.queryByTestId("criterion-row-0")).toBeNull();
    expect(screen.getByText("No criteria specified.")).toBeTruthy();
  });

  it("admin sees sharing options and saves shared view via sendViewCommand", async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(api, "sendViewCommand").mockResolvedValue({
      ok: true,
      revision: "rev-2",
      view: {
        id: "view-123",
        name: "Enterprise Leads",
        systemDefined: false,
        isDefault: false,
        columns: ["Full_Name", "Company"],
        criteria: null,
        sort: null,
      },
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
    expect(screen.getByRole("radio", { name: "Everyone" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Only me" })).toBeTruthy();

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

  it("member sees NO sharing option and saves private view locally without server mutation", async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(api, "sendViewCommand");
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <CustomViewDialog
        {...defaultProps({
          isAdmin: false,
          onSave,
          onClose,
          initial: { columns: ["Full_Name"] },
        })}
      />,
    );

    // Sharing section MUST NOT be rendered for members (Üye: paylaşım seçeneği yok)
    expect(screen.queryByTestId("sharing-section")).toBeNull();
    expect(screen.queryByRole("radio", { name: "Everyone" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "Only me" })).toBeNull();

    await user.type(screen.getByLabelText("Enter Custom View Name"), "My Personal Leads");
    await user.click(screen.getByRole("button", { name: "Save" }));

    // Server shared-view endpoint is NOT called
    expect(sendSpy).not.toHaveBeenCalled();

    // Saved to private views
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "My Personal Leads",
        columns: ["Full_Name"],
      }),
    );
    expect(onClose).toHaveBeenCalled();

    // Verify stored in private views storage
    const stored = api.getPrivateViews("test-org", "Leads");
    expect(stored.some((v) => v.name === "My Personal Leads")).toBe(true);
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
            sharedTo: "everyone",
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
      message: "View criterion references an inactive or unknown field: retired_field.",
      fieldErrors: { view_field: ["retired_field"] },
    });

    render(
      <CustomViewDialog
        {...defaultProps({
          mode: "create",
          initial: {
            columns: ["Full_Name"],
            criteria: { field: "retired_field", comparator: "equal", value: "test" },
            sharedTo: "everyone",
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
            sharedTo: "everyone",
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
