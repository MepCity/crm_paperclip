import type { FieldDefinition } from "@crm/core/records";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { MAX_SELECTED_COLUMNS } from "./constants";
import { ManageColumnsDialog, type ManageColumnsDialogProps } from "./manage-columns-dialog";

function makeField(apiName: string, label: string): FieldDefinition {
  return {
    apiName,
    label,
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
  } as FieldDefinition;
}

const fields: FieldDefinition[] = [
  makeField("first_name", "First Name"),
  makeField("last_name", "Last Name"),
  ...Array.from({ length: MAX_SELECTED_COLUMNS + 2 }, (_, i) =>
    makeField(`field_${i + 1}`, `Field ${i + 1}`),
  ),
];

function renderDialog(overrides: Partial<ManageColumnsDialogProps> = {}) {
  const props: ManageColumnsDialogProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    moduleLabel: "Leads",
    allFields: fields,
    selectedColumns: ["last_name", "field_1"],
    ...overrides,
  };
  const utils = render(<ManageColumnsDialog {...props} />);
  return { ...utils, props };
}

function checkboxes() {
  return screen.getAllByRole("checkbox") as HTMLInputElement[];
}

function checkbox(label: string) {
  return screen.getByRole("checkbox", { name: label }) as HTMLInputElement;
}

afterEach(cleanup);

describe("ManageColumnsDialog", () => {
  it("renders nothing when closed", () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("labels the dialog and checks exactly the selected columns", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog", { name: "Manage Columns Leads" });
    expect(dialog).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Manage Columns Leads" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Search fields" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Available columns" })).toBeTruthy();
    expect(checkboxes()).toHaveLength(fields.length);
    for (const f of fields) {
      expect(checkbox(f.label).checked).toBe(["Last Name", "Field 1"].includes(f.label));
    }
  });

  it("filters by label and API name, ignoring case and surrounding spaces", async () => {
    const user = userEvent.setup();
    renderDialog();
    const search = screen.getByRole("textbox");
    await user.type(search, "  FIRST NAME ");
    expect(checkboxes().map((c) => c.closest("label")?.textContent)).toEqual(["First Name"]);
    await user.clear(search);
    await user.type(search, "LAST_NAME");
    expect(checkboxes().map((c) => c.closest("label")?.textContent)).toEqual(["Last Name"]);
  });

  it("shows an empty message when nothing matches and recovers when cleared", async () => {
    const user = userEvent.setup();
    renderDialog();
    const search = screen.getByRole("textbox");
    await user.type(search, "zzz-no-match");
    expect(screen.getByText("No fields found.")).toBeTruthy();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    await user.clear(search);
    expect(screen.queryByText("No fields found.")).toBeNull();
    expect(checkboxes()).toHaveLength(fields.length);
  });

  it("disables unchecked boxes at the column limit and re-enables on uncheck", async () => {
    const user = userEvent.setup();
    const selected = fields.slice(0, MAX_SELECTED_COLUMNS).map((f) => f.apiName);
    renderDialog({ selectedColumns: selected });
    for (const c of checkboxes()) {
      expect(c.disabled).toBe(!c.checked);
    }
    expect(checkboxes().filter((c) => c.checked)).toHaveLength(MAX_SELECTED_COLUMNS);

    // Clicking disabled checkbox does not toggle it
    const uncheckedField = fields.find((f) => !selected.includes(f.apiName));
    if (uncheckedField) {
      const disabledBox = checkbox(uncheckedField.label);
      expect(disabledBox.disabled).toBe(true);
      await user.click(disabledBox);
      expect(disabledBox.checked).toBe(false);
    }

    await user.click(checkbox("First Name"));
    expect(checkboxes().every((c) => !c.disabled)).toBe(true);
  });

  it("saves the draft in selection order and then closes", async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();
    await user.click(checkbox("Last Name"));
    await user.click(checkbox("Field 3"));
    await user.click(checkbox("First Name"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(props.onSave).toHaveBeenCalledTimes(1);
    expect(props.onSave).toHaveBeenCalledWith(["field_1", "field_3", "first_name"]);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("closes without saving on Cancel", async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();
    await user.click(checkbox("First Name"));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("dismissing dialog with Escape calls onClose and does not call onSave", async () => {
    const user = userEvent.setup();
    const { props } = renderDialog();
    await user.keyboard("{Escape}");
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("resets the draft and search when reopened", async () => {
    const user = userEvent.setup();
    const { props, rerender } = renderDialog();
    await user.click(checkbox("First Name"));
    await user.type(screen.getByRole("textbox"), "field");
    rerender(<ManageColumnsDialog {...props} isOpen={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<ManageColumnsDialog {...props} isOpen />);
    const dialog = screen.getByRole("dialog");
    expect((within(dialog).getByRole("textbox") as HTMLInputElement).value).toBe("");
    expect(checkboxes()).toHaveLength(fields.length);
    for (const f of fields) {
      expect(checkbox(f.label).checked).toBe(["Last Name", "Field 1"].includes(f.label));
    }
  });
});
