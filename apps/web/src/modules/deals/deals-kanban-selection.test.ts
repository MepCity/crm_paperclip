// @vitest-environment jsdom
import type { KanbanView } from "@crm/core/records";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setSelectedDealsKanbanViewId, useSelectedDealsKanbanView } from "./deals-kanban-selection";

const mockViews: KanbanView[] = [
  {
    id: "view-pipeline",
    name: "Pipeline Stage",
    categorizeBy: "Stage",
    aggregateBy: "Amount",
    headerStyle: "mono_color",
    fields: ["Deal_Name", "Stage"],
    sharedTo: "everyone",
    createdBy: { id: "u1", name: "Ada" },
    modifiedBy: { id: "u1", name: "Ada" },
  },
  {
    id: "view-closing",
    name: "Closing Deals",
    categorizeBy: "Stage",
    aggregateBy: null,
    headerStyle: "mono_color",
    fields: ["Deal_Name", "Closing_Date"],
    sharedTo: "only_me",
    createdBy: { id: "u1", name: "Ada" },
    modifiedBy: { id: "u2", name: "Bob" },
  },
];

let queryData: KanbanView[] | undefined = mockViews;

vi.mock("@/lib/api/client/hooks", () => ({
  useKanbanViews: vi.fn(() => ({ data: queryData })),
}));

describe("setSelectedDealsKanbanViewId", () => {
  beforeEach(() => {
    queryData = mockViews;
    setSelectedDealsKanbanViewId(null);
  });

  afterEach(() => {
    setSelectedDealsKanbanViewId(null);
  });

  it("updates the selected view id across subscribers", () => {
    const { result } = renderHook(() => useSelectedDealsKanbanView());
    expect(result.current.view?.id).toBe(mockViews[0]?.id);

    act(() => {
      setSelectedDealsKanbanViewId("view-closing");
    });
    expect(result.current.view?.id).toBe("view-closing");
  });

  it("handles resetting back to null", () => {
    const { result } = renderHook(() => useSelectedDealsKanbanView());
    act(() => {
      setSelectedDealsKanbanViewId("view-closing");
    });
    expect(result.current.view?.id).toBe("view-closing");

    act(() => {
      setSelectedDealsKanbanViewId(null);
    });
    expect(result.current.view?.id).toBe(mockViews[0]?.id);
  });

  it("handles setting empty string or repeated calls idempotently", () => {
    const { result } = renderHook(() => useSelectedDealsKanbanView());

    act(() => {
      setSelectedDealsKanbanViewId("view-closing");
    });
    expect(result.current.view?.id).toBe("view-closing");

    act(() => {
      setSelectedDealsKanbanViewId("view-closing");
    });
    expect(result.current.view?.id).toBe("view-closing");

    act(() => {
      setSelectedDealsKanbanViewId("");
    });
    expect(result.current.view?.id).toBe(mockViews[0]?.id);
  });
});

describe("useSelectedDealsKanbanView", () => {
  beforeEach(() => {
    queryData = mockViews;
    setSelectedDealsKanbanViewId(null);
  });

  afterEach(() => {
    setSelectedDealsKanbanViewId(null);
  });

  it("defaults to the first view when no view is explicitly selected", () => {
    const { result } = renderHook(() => useSelectedDealsKanbanView());
    expect(result.current.views).toBe(mockViews);
    expect(result.current.view).toBe(mockViews[0]);
  });

  it("returns the explicitly selected view matching selectedId", () => {
    setSelectedDealsKanbanViewId("view-closing");
    const { result } = renderHook(() => useSelectedDealsKanbanView());
    expect(result.current.view).toBe(mockViews[1]);
  });

  it("falls back to the first view when the selectedId does not match any view", () => {
    setSelectedDealsKanbanViewId("unknown-view-id");
    const { result } = renderHook(() => useSelectedDealsKanbanView());
    expect(result.current.view).toBe(mockViews[0]);
  });

  it("returns empty views and undefined view when query data is empty or undefined", () => {
    queryData = [];
    const { result: emptyResult } = renderHook(() => useSelectedDealsKanbanView());
    expect(emptyResult.current.views).toEqual([]);
    expect(emptyResult.current.view).toBeUndefined();

    queryData = undefined;
    const { result: undefinedResult } = renderHook(() => useSelectedDealsKanbanView());
    expect(undefinedResult.current.views).toEqual([]);
    expect(undefinedResult.current.view).toBeUndefined();
  });
});
