import type { KanbanView } from "@crm/core/records";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { setSelectedDealsKanbanViewId } from "./deals-kanban-selection";
import { DealsKanbanToolbar } from "./deals-kanban-toolbar";
import { dealMetadata } from "./test-metadata";

const views: KanbanView[] = [
  {
    id: "v1",
    name: "STAGEVIEW",
    categorizeBy: "Stage",
    aggregateBy: "Amount",
    headerStyle: "mono_color",
    fields: ["Deal_Name", "Stage"],
    sharedTo: "everyone",
    createdBy: { id: "u1", name: "Ada" },
    modifiedBy: { id: "u1", name: "Ada" },
  },
  {
    id: "v2",
    name: "Second",
    categorizeBy: "Stage",
    aggregateBy: null,
    headerStyle: "mono_color",
    fields: ["Deal_Name"],
    sharedTo: "only_me",
    createdBy: { id: "u1", name: "Ada" },
    modifiedBy: { id: "u2", name: "Bob" },
  },
];
const mutateAsync = vi.fn();

vi.mock("@/lib/api/client/hooks", () => ({
  useKanbanViews: () => ({ data: views }),
  useModule: () => ({
    data: dealMetadata([
      {
        apiName: "Deal_Name",
        label: "Deal Name",
        dataType: "text",
        required: true,
        readOnly: false,
        unique: false,
        massUpdate: false,
        views: { create: true, edit: true, view: true, quickCreate: true },
      },
    ]),
  }),
  useSaveKanbanView: () => ({ mutateAsync }),
}));

describe("DealsKanbanToolbar", () => {
  afterEach(cleanup);
  beforeEach(() => {
    mutateAsync.mockReset();
    setSelectedDealsKanbanViewId(null);
  });

  test("fills the selector from saved views and switches selection", () => {
    render(<DealsKanbanToolbar />);
    const select = screen.getByRole("combobox", { name: "Board grouping" }) as HTMLSelectElement;
    expect(select.value).toBe("v1");
    fireEvent.change(select, { target: { value: "v2" } });
    expect(select.value).toBe("v2");
  });

  test("pencil opens edit settings and save updates the view then closes", async () => {
    mutateAsync.mockResolvedValue(views[0]);
    render(<DealsKanbanToolbar />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Board settings" }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(mutateAsync.mock.calls[0]?.[0]).toMatchObject({ id: "v1" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  test("Create Kanban View opens a blank create window", async () => {
    render(<DealsKanbanToolbar />);
    fireEvent.change(screen.getByRole("combobox", { name: "Board grouping" }), {
      target: { value: "__create_kanban_view__" },
    });
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  test("Manage Kanban Views lists the views, opens Create and closes with Escape and the cross", async () => {
    render(<DealsKanbanToolbar />);
    const select = screen.getByRole("combobox", { name: "Board grouping" });
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.change(select, { target: { value: "__manage_kanban_views__" } });
    const dialog = await screen.findByRole("dialog", { name: "Manage Kanban Views" });
    for (const name of ["View Name", "Used Field", "Shared To", "Last Modified By", "Created By"])
      expect(screen.getByRole("columnheader", { name })).toBeTruthy();
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.textContent).toContain("STAGEVIEW");
    expect(rows[0]?.textContent).toContain("Everyone");
    expect(rows[1]?.textContent).toContain("Only me");
    expect(rows[1]?.textContent).toContain("Bob");
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    fireEvent.change(select, { target: { value: "__manage_kanban_views__" } });
    fireEvent.click(await screen.findByRole("button", { name: "Close Modal" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  test("Create from the manage window opens the create settings; sharing defaults to Only me", async () => {
    mutateAsync.mockResolvedValue({ ...views[0], id: "v3" });
    render(<DealsKanbanToolbar />);
    fireEvent.change(screen.getByRole("combobox", { name: "Board grouping" }), {
      target: { value: "__manage_kanban_views__" },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Create Kanban View" }));
    await screen.findByRole("dialog", { name: "Kanban View - Settings" });
    expect(screen.queryByRole("dialog", { name: "Manage Kanban Views" })).toBeNull();
    expect((screen.getByRole("radio", { name: "Only me" }) as HTMLInputElement).checked).toBe(true);
    expect(
      (screen.getByRole("radio", { name: "Selected users" }) as HTMLInputElement).disabled,
    ).toBe(true);
    fireEvent.click(screen.getByRole("radio", { name: "Everyone" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Kanban View Name" }), {
      target: { value: "Shared" },
    });
    // Categorize By is required; the save is rejected before the service is called.
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  test("edit mode has no sharing choice", async () => {
    render(<DealsKanbanToolbar />);
    fireEvent.click(screen.getByRole("button", { name: "Board settings" }));
    await screen.findByRole("dialog");
    expect(screen.queryByRole("radio", { name: "Only me" })).toBeNull();
  });
});
