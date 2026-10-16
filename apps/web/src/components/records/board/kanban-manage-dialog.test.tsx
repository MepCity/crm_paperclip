import type { KanbanView } from "@crm/core/records";
import { cleanup, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@/test/render";
import { KanbanManageDialog, type KanbanManageDialogProps } from "./kanban-manage-dialog";

afterEach(cleanup);

const sampleViews: readonly KanbanView[] = [
  {
    id: "view-1",
    name: "Pipeline Stages",
    categorizeBy: "Stage",
    aggregateBy: "Amount",
    headerStyle: "mono_color",
    fields: ["Deal_Name", "Stage", "Amount"],
    sharedTo: "everyone",
    createdBy: { id: "user-1", name: "Ada Lovelace" },
    modifiedBy: { id: "user-1", name: "Ada Lovelace" },
  },
  {
    id: "view-2",
    name: "Lead Status Flow",
    categorizeBy: "Lead_Status",
    aggregateBy: null,
    headerStyle: "mono_color",
    fields: ["Full_Name", "Lead_Status"],
    sharedTo: "only_me",
    createdBy: { id: "user-2", name: "Charles Babbage" },
    modifiedBy: { id: "user-3", name: "Grace Hopper" },
  },
  {
    id: "view-3",
    name: "Custom Shared View",
    categorizeBy: "Custom_Field",
    aggregateBy: null,
    headerStyle: "mono_color",
    fields: ["Deal_Name"],
    // Non-standard sharedTo value to test the fallback in SHARED_LABELS
    sharedTo: "custom_group" as KanbanView["sharedTo"],
    createdBy: { id: "user-1", name: "Ada Lovelace" },
    modifiedBy: { id: "user-2", name: "Charles Babbage" },
  },
];

function createProps(overrides: Partial<KanbanManageDialogProps> = {}): KanbanManageDialogProps {
  return {
    open: true,
    views: sampleViews,
    fieldLabel: (apiName) => (apiName === "Stage" ? "Stage Label" : apiName),
    onCreate: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
}

describe("KanbanManageDialog", () => {
  it("renders nothing when open is false", () => {
    const props = createProps({ open: false });
    const { container } = render(<KanbanManageDialog {...props} />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders table headers and rows for each view with mapped fields when open is true", () => {
    const props = createProps({
      open: true,
      fieldLabel: (apiName) => (apiName === "Stage" ? "Stage Label" : `Field (${apiName})`),
    });

    render(<KanbanManageDialog {...props} />);

    expect(screen.getByRole("dialog", { name: "Manage Kanban Views" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Manage Kanban Views" })).toBeTruthy();

    // Check table column headers
    expect(screen.getByRole("columnheader", { name: "View Name" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Used Field" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Shared To" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Last Modified By" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Created By" })).toBeTruthy();

    const rows = screen.getAllByRole("row");
    // Row 0 is the table header row
    const row1 = rows[1];
    const row2 = rows[2];
    const row3 = rows[3];
    if (!row1 || !row2 || !row3) {
      throw new Error("Expected 3 data rows in the table");
    }

    const row1Within = within(row1);
    expect(row1Within.getByRole("cell", { name: "Pipeline Stages" })).toBeTruthy();
    expect(row1Within.getByRole("cell", { name: "Stage Label" })).toBeTruthy();
    expect(row1Within.getByRole("cell", { name: "Everyone" })).toBeTruthy();
    expect(row1Within.getAllByRole("cell", { name: "Ada Lovelace" })).toHaveLength(2);

    const row2Within = within(row2);
    expect(row2Within.getByRole("cell", { name: "Lead Status Flow" })).toBeTruthy();
    expect(row2Within.getByRole("cell", { name: "Field (Lead_Status)" })).toBeTruthy();
    expect(row2Within.getByRole("cell", { name: "Only me" })).toBeTruthy();
    expect(row2Within.getByRole("cell", { name: "Grace Hopper" })).toBeTruthy();
    expect(row2Within.getByRole("cell", { name: "Charles Babbage" })).toBeTruthy();

    // Check fallback for custom sharedTo value
    const row3Within = within(row3);
    expect(row3Within.getByRole("cell", { name: "Custom Shared View" })).toBeTruthy();
    expect(row3Within.getByRole("cell", { name: "Field (Custom_Field)" })).toBeTruthy();
    expect(row3Within.getByRole("cell", { name: "custom_group" })).toBeTruthy();
    expect(row3Within.getByRole("cell", { name: "Charles Babbage" })).toBeTruthy();
    expect(row3Within.getByRole("cell", { name: "Ada Lovelace" })).toBeTruthy();
  });

  it("calls onClose when the Close Modal button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const props = createProps({ onClose });

    render(<KanbanManageDialog {...props} />);

    const closeButton = screen.getByRole("button", { name: "Close Modal" });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onCreate when the Create Kanban View button is clicked", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const props = createProps({ onCreate });

    render(<KanbanManageDialog {...props} />);

    const createButton = screen.getByRole("button", { name: "Create Kanban View" });
    await user.click(createButton);

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("calls fieldLabel callback for each view categorizeBy and displays the returned label", () => {
    const fieldLabel = vi.fn((apiName: string) => `Categorized By ${apiName}`);
    const props = createProps({ fieldLabel });

    render(<KanbanManageDialog {...props} />);

    expect(fieldLabel).toHaveBeenCalledWith("Stage");
    expect(fieldLabel).toHaveBeenCalledWith("Lead_Status");
    expect(fieldLabel).toHaveBeenCalledWith("Custom_Field");
    expect(screen.getByRole("cell", { name: "Categorized By Stage" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Categorized By Lead_Status" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "Categorized By Custom_Field" })).toBeTruthy();
  });

  it("calls onClose when Escape key is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const props = createProps({ onClose });

    render(<KanbanManageDialog {...props} />);

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
