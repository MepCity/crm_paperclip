import type { KanbanView } from "@crm/core/records";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { setSelectedDealsKanbanViewId, useSelectedDealsKanbanView } from "./deals-kanban-selection";

const viewA: KanbanView = {
  id: "va",
  name: "View A",
  categorizeBy: "Stage",
  aggregateBy: "Amount",
  headerStyle: "mono_color",
  fields: ["Deal_Name", "Stage"],
  sharedTo: "everyone",
  createdBy: { id: "u1", name: "Alice" },
  modifiedBy: { id: "u1", name: "Alice" },
};

const viewB: KanbanView = {
  id: "vb",
  name: "View B",
  categorizeBy: "Stage",
  aggregateBy: null,
  headerStyle: "mono_color",
  fields: ["Deal_Name"],
  sharedTo: "only_me",
  createdBy: { id: "u2", name: "Bob" },
  modifiedBy: { id: "u2", name: "Bob" },
};

vi.mock("@/lib/api/client/hooks", () => ({
  useKanbanViews: () => ({ data: mockViews }),
}));

let mockViews: KanbanView[] = [viewA, viewB];

describe("useSelectedDealsKanbanView", () => {
  afterEach(() => {
    setSelectedDealsKanbanViewId(null);
    mockViews = [viewA, viewB];
  });

  it("returns the first view when nothing is selected", () => {
    const { result } = renderHook(() => useSelectedDealsKanbanView());
    expect(result.current.views).toEqual([viewA, viewB]);
    expect(result.current.view).toBe(viewA);
  });

  it("returns viewB after setSelectedDealsKanbanViewId(b.id)", () => {
    const { result } = renderHook(() => useSelectedDealsKanbanView());
    act(() => {
      setSelectedDealsKanbanViewId(viewB.id);
    });
    expect(result.current.view).toBe(viewB);
  });

  it("falls back to the first view when an unknown id is set", () => {
    const { result } = renderHook(() => useSelectedDealsKanbanView());
    act(() => {
      setSelectedDealsKanbanViewId("unknown-id");
    });
    expect(result.current.view).toBe(viewA);
  });

  it("returns empty views and undefined view when there is no data", () => {
    mockViews = [];
    const { result } = renderHook(() => useSelectedDealsKanbanView());
    expect(result.current.views).toEqual([]);
    expect(result.current.view).toBeUndefined();
  });
});
