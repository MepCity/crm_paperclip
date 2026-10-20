import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useRecordNoteEvents } from "./use-record-note-events";

const state = vi.hoisted(() => ({
  modules: ["Leads", "Contacts", "Accounts", "Deals", "Campaigns", "Cases", "Solutions"],
  loaded: true,
  useViews: vi.fn(),
  useRecordList: vi.fn(),
}));

vi.mock("@/lib/api/client/hooks", () => ({
  useModule: () => ({
    data: state.loaded
      ? { fields: [{ apiName: "Parent_Id", lookup: { module: "Leads", modules: state.modules } }] }
      : undefined,
  }),
  useViews: state.useViews,
  useRecordList: state.useRecordList,
  useUsers: () => ({ data: [{ userId: "user-1", name: "Test User" }] }),
}));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  state.loaded = true;
  state.modules = ["Leads", "Contacts", "Accounts", "Deals", "Campaigns", "Cases", "Solutions"];
});

function mockCachedNotes() {
  state.useViews.mockReturnValue({ data: [{ id: "notes-view", isDefault: true }] });
  state.useRecordList.mockReturnValue({
    data: {
      records: [{ id: "note-1", fields: { Note_Title: "Follow up", Created_By: "user-1" } }],
    },
  });
}

it.each(["Tasks", "Events", "Calls"] as const)(
  "does not request or project Notes for unsupported %s parents, even with cached data",
  (module) => {
    mockCachedNotes();
    const { result } = renderHook(() => useRecordNoteEvents(module, "parent-1"));
    expect(state.useViews).toHaveBeenCalledWith("Notes", { enabled: false });
    expect(state.useRecordList).toHaveBeenCalledWith("Notes", expect.anything(), {
      enabled: false,
    });
    expect(result.current).toEqual([]);
  },
);

it("waits for Notes metadata before listing and projects notes for an accepted parent", () => {
  mockCachedNotes();
  state.loaded = false;
  const { result, rerender } = renderHook(() => useRecordNoteEvents("Leads", "parent-1"));
  expect(state.useRecordList).toHaveBeenLastCalledWith("Notes", expect.anything(), {
    enabled: false,
  });
  expect(result.current).toEqual([]);
  state.loaded = true;
  rerender();
  expect(state.useRecordList).toHaveBeenLastCalledWith(
    "Notes",
    expect.objectContaining({
      filters: {
        field: "Parent_Id",
        comparator: "equal",
        value: { module: "Leads", id: "parent-1" },
      },
    }),
    { enabled: true },
  );
  expect(result.current).toMatchObject([{ id: "note-note-1", actorName: "Test User" }]);
});

it("uses metadata when another parent becomes supported", () => {
  mockCachedNotes();
  state.modules = [...state.modules, "Tasks"];
  const { result } = renderHook(() => useRecordNoteEvents("Tasks", "parent-1"));
  expect(state.useRecordList).toHaveBeenCalledWith("Notes", expect.anything(), { enabled: true });
  expect(result.current).toHaveLength(1);
});
