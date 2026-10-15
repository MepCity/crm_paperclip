import type { FieldDefinition } from "@crm/core/records";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { MAX_SELECTED_COLUMNS } from "./constants";
import { ManageColumnsDialog, type ManageColumnsDialogProps } from "./manage-columns-dialog";

afterEach(cleanup);

function makeField(
  apiName: string,
  label: string = apiName,
  extra: Partial<FieldDefinition> = {},
): FieldDefinition {
  return {
    apiName,
    label,
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
    ...extra,
  };
}

const sampleFields: readonly FieldDefinition[] = [
  makeField("Deal_Name", "Deal Name", { required: true }),
  makeField("Amount", "Amount"),
  makeField("Stage", "Stage"),
  makeField("Closing_Date", "Closing Date"),
  makeField("Account_Name", "Account Name"),
  makeField("Type", "Type"),
  makeField("Probability", "Probability"),
  makeField("Expected_Revenue", "Expected Revenue"),
  makeField("Lead_Source", "Lead Source"),
  makeField("Campaign_Source", "Campaign Source"),
  makeField("Contact_Name", "Contact Name"),
  makeField("Description", "Description"),
];

function createProps(overrides: Partial<ManageColumnsDialogProps> = {}): ManageColumnsDialogProps {
  return {
    isOpen: true,
    onClose: vi.fn(),
    moduleLabel: "Deals",
    allFields: sampleFields,
    selectedColumns: ["Deal_Name", "Amount"],
    onSave: vi.fn(),
    ...overrides,
  };
}

describe("ManageColumnsDialog", () => {
  it("renders nothing when isOpen is false", () => {
    const props = createProps({ isOpen: false });
    const { container } = render(<ManageColumnsDialog {...props} />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows module label in heading, search input, and initial selected columns in available columns list", () => {
    const props = createProps({
      isOpen: true,
      moduleLabel: "Deals",
      selectedColumns: ["Deal_Name", "Stage"],
    });

    render(<ManageColumnsDialog {...props} />);

    expect(screen.getByRole("heading", { name: "Manage Columns Deals" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Search fields" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Available columns" })).toBeTruthy();

    const dealNameBox = screen.getByRole("checkbox", { name: "Deal Name" }) as HTMLInputElement;
    const stageBox = screen.getByRole("checkbox", { name: "Stage" }) as HTMLInputElement;
    const amountBox = screen.getByRole("checkbox", { name: "Amount" }) as HTMLInputElement;

    expect(dealNameBox.checked).toBe(true);
    expect(stageBox.checked).toBe(true);
    expect(amountBox.checked).toBe(false);
  });

  it("filters available columns by query matching label or apiName case-insensitively", async () => {
    const user = userEvent.setup();
    const props = createProps({
      isOpen: true,
      selectedColumns: ["Deal_Name"],
    });

    render(<ManageColumnsDialog {...props} />);

    const searchInput = screen.getByRole("textbox", { name: "Search fields" });

    // Search with mixed case matching label
    await user.type(searchInput, "aMoUnT");
    expect(screen.getByRole("checkbox", { name: "Amount" })).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: "Stage" })).toBeNull();

    // Search with query matching apiName
    await user.clear(searchInput);
    await user.type(searchInput, "closing_date");
    expect(screen.getByRole("checkbox", { name: "Closing Date" })).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: "Amount" })).toBeNull();

    // Search with query matching nothing
    await user.clear(searchInput);
    await user.type(searchInput, "nonexistent");
    expect(screen.getByText("No fields found.")).toBeTruthy();
  });

  it("toggling a field and saving calls onSave once with the resulting column api names in order", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();
    const props = createProps({
      isOpen: true,
      selectedColumns: ["Deal_Name", "Stage"],
      onSave,
      onClose,
    });

    render(<ManageColumnsDialog {...props} />);

    // Uncheck Stage
    await user.click(screen.getByRole("checkbox", { name: "Stage" }));
    // Check Amount
    await user.click(screen.getByRole("checkbox", { name: "Amount" }));
    // Check Account Name
    await user.click(screen.getByRole("checkbox", { name: "Account Name" }));

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(["Deal_Name", "Amount", "Account_Name"]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cancel button calls onClose and does not call onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();
    const props = createProps({
      isOpen: true,
      selectedColumns: ["Deal_Name"],
      onSave,
      onClose,
    });

    render(<ManageColumnsDialog {...props} />);

    await user.click(screen.getByRole("checkbox", { name: "Amount" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("dismissing dialog with Escape calls onClose and does not call onSave", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();
    const props = createProps({
      isOpen: true,
      selectedColumns: ["Deal_Name"],
      onSave,
      onClose,
    });

    render(<ManageColumnsDialog {...props} />);

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("disables unselected checkboxes when MAX_SELECTED_COLUMNS limit is reached and re-enables on uncheck", async () => {
    const user = userEvent.setup();
    expect(MAX_SELECTED_COLUMNS).toBe(10);

    const initialTen = sampleFields.slice(0, 10).map((f) => f.apiName);
    const firstField = sampleFields[0];
    const eleventh = sampleFields[10]; // Contact_Name
    const twelfth = sampleFields[11]; // Description
    if (!firstField || !eleventh || !twelfth) {
      throw new Error("Missing sample fields for limit test");
    }
    const onSave = vi.fn();

    const props = createProps({
      isOpen: true,
      allFields: sampleFields,
      selectedColumns: initialTen,
      onSave,
    });

    render(<ManageColumnsDialog {...props} />);

    // Unselected fields are disabled when at limit
    const eleventhBox = screen.getByRole("checkbox", { name: eleventh.label }) as HTMLInputElement;
    const twelfthBox = screen.getByRole("checkbox", { name: twelfth.label }) as HTMLInputElement;
    expect(eleventhBox.disabled).toBe(true);
    expect(twelfthBox.disabled).toBe(true);

    // Selected checkboxes remain enabled (no required fields locked from being unchecked)
    const firstBox = screen.getByRole("checkbox", {
      name: firstField.label,
    }) as HTMLInputElement;
    expect(firstBox.checked).toBe(true);
    expect(firstBox.disabled).toBe(false);

    // Clicking disabled eleventh checkbox does not check it
    await user.click(eleventhBox);
    expect(eleventhBox.checked).toBe(false);

    // Uncheck first box: count is now 9, below MAX_SELECTED_COLUMNS limit
    await user.click(firstBox);
    expect(firstBox.checked).toBe(false);

    // Eleventh and twelfth become enabled
    expect(eleventhBox.disabled).toBe(false);
    expect(twelfthBox.disabled).toBe(false);

    // Now we can check eleventh box
    await user.click(eleventhBox);
    expect(eleventhBox.checked).toBe(true);

    // Re-check that twelfth box is disabled again because limit is reached
    expect(twelfthBox.disabled).toBe(true);
  });

  it("resets draft and search when reopened", async () => {
    const user = userEvent.setup();
    const props = createProps({
      isOpen: true,
      selectedColumns: ["Deal_Name"],
    });

    const { rerender } = render(<ManageColumnsDialog {...props} />);

    const searchInput = screen.getByRole("textbox", { name: "Search fields" });
    await user.type(searchInput, "Amount");
    await user.click(screen.getByRole("checkbox", { name: "Amount" }));

    // Close dialog
    rerender(<ManageColumnsDialog {...props} isOpen={false} />);

    // Reopen dialog
    rerender(<ManageColumnsDialog {...props} isOpen={true} />);

    const reopenedSearch = screen.getByRole("textbox", {
      name: "Search fields",
    }) as HTMLInputElement;
    expect(reopenedSearch.value).toBe("");

    const amountCheckbox = screen.getByRole("checkbox", { name: "Amount" }) as HTMLInputElement;
    expect(amountCheckbox.checked).toBe(false);
  });
});
