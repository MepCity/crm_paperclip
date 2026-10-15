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
  },
  {
    id: "v2",
    name: "Second",
    categorizeBy: "Stage",
    aggregateBy: null,
    headerStyle: "mono_color",
    fields: ["Deal_Name"],
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
});
