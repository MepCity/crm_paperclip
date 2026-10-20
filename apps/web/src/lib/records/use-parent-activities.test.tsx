import type { ModuleApiName, RecordData } from "@crm/core/records";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parentActivityCriteria } from "./parent-activities";
import { useParentActivities, useParentActivityBadges } from "./use-parent-activities";

const api = vi.hoisted(() => ({
  useViews: vi.fn(),
  useRecordList: vi.fn(),
  useUsers: vi.fn(),
}));
vi.mock("@/lib/api/client/hooks", () => api);

const modules = ["Tasks", "Events", "Calls"] as const;
type ActivityModule = (typeof modules)[number];
type QueryState<T> = { data: T | undefined; isLoading: boolean; isError: boolean };
type View = { id: string; isDefault: boolean };
const ready = <T,>(data: T): QueryState<T> => ({ data, isLoading: false, isError: false });
let views: Record<ActivityModule, QueryState<View[]>>;
let lists: Record<ActivityModule, QueryState<{ records: RecordData[] }>>;
let users: QueryState<{ userId: string; name: string }[]>;
const recordPath = vi.fn((module: ModuleApiName, id: string) => `/tab/${module}/${id}`);
const rec = (id: string, fields: RecordData["fields"]): RecordData =>
  ({ id, fields }) as RecordData;
const show = () => renderHook(() => useParentActivities("Contacts", "parent-1", recordPath));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-10T00:00:00Z"));
  views = {
    Tasks: ready([{ id: "tasks-view", isDefault: true }]),
    Events: ready([{ id: "events-view", isDefault: true }]),
    Calls: ready([{ id: "calls-view", isDefault: true }]),
  };
  lists = {
    Tasks: ready({ records: [] }),
    Events: ready({ records: [] }),
    Calls: ready({ records: [] }),
  };
  users = ready([{ userId: "user-1", name: "Fixture User" }]);
  api.useViews.mockImplementation((module: ActivityModule) => views[module]);
  api.useRecordList.mockImplementation((module: ActivityModule, query: { page: number }) => {
    const list = lists[module];
    return {
      ...list,
      data: list.data && { page: query.page, moreRecords: false, ...list.data },
    };
  });
  api.useUsers.mockImplementation(() => users);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useParentActivities queries", () => {
  it.each(["Leads", "Contacts", "Accounts", "Deals"])(
    "selects default views and parent filters for %s",
    (parentModule) => {
      for (const module of modules) {
        views[module].data = [
          { id: `${module}-first`, isDefault: false },
          { id: `${module}-default`, isDefault: true },
        ];
      }
      renderHook(() => useParentActivities(parentModule, "parent-1", recordPath));
      for (const module of modules) {
        expect(api.useViews).toHaveBeenCalledWith(module);
        expect(api.useRecordList).toHaveBeenCalledWith(
          module,
          {
            viewId: `${module}-default`,
            page: 1,
            perPage: 100,
            filters: parentActivityCriteria(parentModule, "parent-1"),
          },
          { enabled: true },
        );
      }
    },
  );

  it("falls back to each module's first view when none is default", () => {
    for (const module of modules) {
      views[module].data = [
        { id: `${module}-first`, isDefault: false },
        { id: `${module}-second`, isDefault: false },
      ];
    }
    show();
    for (const module of modules) {
      expect(api.useRecordList).toHaveBeenCalledWith(
        module,
        expect.objectContaining({ viewId: `${module}-first` }),
        { enabled: true },
      );
    }
  });

  it("disables pending lists and enables them when views arrive", () => {
    for (const module of modules) {
      views[module] = { data: undefined, isLoading: true, isError: false };
    }
    const { result, rerender } = show();
    expect(result.current.isLoading).toBe(true);
    for (const module of modules) {
      expect(api.useRecordList).toHaveBeenCalledWith(
        module,
        {
          viewId: "pending",
          page: 1,
          perPage: 100,
          filters: parentActivityCriteria("Contacts", "parent-1"),
        },
        { enabled: false },
      );
      views[module] = ready([{ id: `${module}-ready`, isDefault: true }]);
    }
    rerender();
    expect(result.current.isLoading).toBe(false);
    for (const module of modules) {
      expect(api.useRecordList).toHaveBeenCalledWith(
        module,
        expect.objectContaining({ viewId: `${module}-ready` }),
        { enabled: true },
      );
    }
  });

  it("disables lists when the parent module is unsupported", () => {
    renderHook(() => useParentActivities("Tasks", "parent-1", recordPath));
    for (const module of modules) {
      expect(api.useRecordList).toHaveBeenCalledWith(
        module,
        expect.objectContaining({ filters: undefined }),
        { enabled: false },
      );
    }
  });
});

describe("useParentActivities query states", () => {
  it("returns empty categories and settled flags when no records exist", () => {
    const { result } = show();
    expect(result.current).toMatchObject({
      isLoading: false,
      isError: false,
      openCount: 0,
      closedCount: 0,
    });
    const empty = ["task", "meeting", "call"].map((kind) => ({ kind, count: 0, rows: [] }));
    expect(result.current.open).toEqual(empty);
    expect(result.current.closed).toEqual(empty);
  });

  it.each(modules)("propagates loading from %s views or its enabled list", (module) => {
    views[module].isLoading = true;
    const { result, rerender } = show();
    expect(result.current.isLoading).toBe(true);
    views[module].isLoading = false;
    lists[module].isLoading = true;
    rerender();
    expect(result.current.isLoading).toBe(true);
    lists[module].isLoading = false;
    rerender();
    expect(result.current.isLoading).toBe(false);
  });

  it.each(modules)("ignores loading from a disabled %s list without a view", (module) => {
    views[module] = ready([]);
    lists[module].isLoading = true;
    expect(show().result.current.isLoading).toBe(false);
    expect(api.useRecordList).toHaveBeenCalledWith(
      module,
      expect.objectContaining({ viewId: "pending" }),
      { enabled: false },
    );
  });

  it.each(modules)("propagates errors from %s views and lists independently", (module) => {
    views[module].isError = true;
    const { result, rerender } = show();
    expect(result.current.isError).toBe(true);
    views[module].isError = false;
    lists[module].isError = true;
    rerender();
    expect(result.current.isError).toBe(true);
    lists[module].isError = false;
    rerender();
    expect(result.current.isError).toBe(false);
  });

  it("includes users loading but excludes a users-only error", () => {
    users.isLoading = true;
    const { result, rerender } = show();
    expect(result.current.isLoading).toBe(true);
    users = { data: undefined, isLoading: false, isError: true };
    rerender();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });
});

describe("useParentActivities rows and badges", () => {
  it("resolves owner names from embedded names, user ids, and missing owners", () => {
    lists.Tasks.data = {
      records: [
        rec("named", { Owner: { id: "user-1", name: "Embedded User" } }),
        rec("object-id", { Owner: { id: "user-1" } }),
        rec("string-id", { Owner: "user-1" }),
        rec("unknown-string", { Owner: "unknown-user" }),
        rec("unknown-object", { Owner: { id: "unknown-user" } }),
        rec("missing", {}),
      ],
    };
    const { result } = show();
    expect(result.current.open[0]?.rows.map((row) => [row.id, row.ownerName])).toEqual([
      ["named", "Embedded User"],
      ["object-id", "Fixture User"],
      ["string-id", "Fixture User"],
      ["unknown-string", "unknown-user"],
      ["unknown-object", null],
      ["missing", null],
    ]);
  });

  it("maps all activity routes and sums open/closed categories for rail badges", () => {
    lists.Tasks.data = {
      records: [
        rec("task-open", { Subject: "Open task", Status: "Not Started" }),
        rec("task-closed", { Subject: "Closed task", Status: "Completed" }),
      ],
    };
    lists.Events.data = {
      records: [
        rec("meeting-open", {
          Event_Title: "Future meeting",
          End_DateTime: "2026-01-11T00:00:00Z",
        }),
        rec("meeting-closed", {
          Event_Title: "Past meeting",
          End_DateTime: "2026-01-09T00:00:00Z",
        }),
      ],
    };
    lists.Calls.data = {
      records: [
        rec("call-open", { Subject: "Scheduled call", Outgoing_Call_Status: "Scheduled" }),
        rec("call-overdue", { Subject: "Overdue call", Outgoing_Call_Status: "Overdue" }),
        rec("call-closed", { Subject: "Completed call", Outgoing_Call_Status: "Completed" }),
      ],
    };
    const { result } = show();
    expect(result.current.open.map((category) => category.count)).toEqual([1, 1, 2]);
    expect(result.current.closed.map((category) => category.count)).toEqual([1, 1, 1]);
    expect(result.current.openCount).toBe(4);
    expect(result.current.closedCount).toBe(3);
    for (const [categories, expected] of [
      [result.current.open, 4],
      [result.current.closed, 3],
    ] as const) {
      expect(categories.reduce((sum, category) => sum + category.count, 0)).toBe(expected);
      for (const category of categories) {
        const module =
          category.kind === "task" ? "Tasks" : category.kind === "meeting" ? "Events" : "Calls";
        for (const row of category.rows) {
          expect(recordPath).toHaveBeenCalledWith(module, row.id);
          expect(row.href).toBe(`/tab/${module}/${row.id}`);
        }
      }
    }
    expect(recordPath).toHaveBeenCalledTimes(7);
    const badges = renderHook(() => useParentActivityBadges("Contacts", "parent-1"));
    expect(badges.result.current).toEqual({
      openActivities: result.current.openCount,
      closedActivities: result.current.closedCount,
    });
  });
});

describe("useParentActivities paging and time", () => {
  it("loads every page and counts all rows", () => {
    const all = Array.from({ length: 101 }, (_, i) =>
      rec(`t${i}`, { Subject: `Task ${i}`, Status: "Not Started" }),
    );
    api.useRecordList.mockImplementation((module: ActivityModule, query: { page: number }) => {
      if (module !== "Tasks")
        return {
          data: { records: [], page: 1, moreRecords: false },
          isLoading: false,
          isError: false,
        };
      const records = query.page === 1 ? all.slice(0, 100) : all.slice(100);
      return {
        data: { records, page: query.page, moreRecords: query.page === 1 },
        isLoading: false,
        isError: false,
      };
    });
    const { result } = show();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.open.find((c) => c.kind === "task")?.count).toBe(101);
    expect(result.current.openCount).toBe(101);
  });

  it("moves an open meeting to closed when its end time passes", () => {
    lists.Events = ready({
      records: [
        rec("e1", {
          Event_Title: "Sync",
          Start_DateTime: "2026-01-10T00:00:00Z",
          End_DateTime: "2026-01-10T01:00:00Z",
        }),
      ],
    });
    const { result } = show();
    expect(result.current.openCount).toBe(1);
    act(() => {
      vi.advanceTimersByTime(61 * 60 * 1000);
    });
    expect(result.current.openCount).toBe(0);
    expect(result.current.closedCount).toBe(1);
  });
});
