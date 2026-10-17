import { describe, expect, it, vi } from "vitest";
import type { RecordData } from "../contract";
import { activityDeleteHook } from "./activity-hooks";
import type { FixtureHookContext, FixtureModuleStore } from "./hooks";

const rec = (id: string, fields: Record<string, unknown>) =>
  ({ id, fields }) as unknown as RecordData;

function setup() {
  const stores = {
    Tasks: {
      records: new Map([
        ["t1", rec("t1", { What_Id: { module: "Deals", id: "d1" } })],
        ["t2", rec("t2", { What_Id: { module: "Deals", id: "d2" } })],
        ["t3", rec("t3", { What_Id: { module: "Accounts", id: "d1" } })],
      ]),
      nextId: 1n,
    },
    Calls: {
      records: new Map([["c1", rec("c1", { Who_Id: { module: "Deals", id: "d1" } })]]),
      nextId: 1n,
    },
    Notes: { records: new Map([["n1", rec("n1", {})]]), nextId: 1n },
  };
  const ctx: FixtureHookContext = {
    registeredModules: ["Tasks", "Calls", "Notes", "Deals"],
    moduleStore: (m) => (stores as Record<string, FixtureModuleStore>)[m] as FixtureModuleStore,
  };
  return { stores, ctx };
}

describe("activityDeleteHook", () => {
  it("removes activities whose parent was deleted", () => {
    const { stores, ctx } = setup();
    activityDeleteHook("Deals")(["d1"], ctx);
    expect([...stores.Tasks.records.keys()]).toEqual(["t2", "t3"]);
    expect(stores.Calls.records.size).toBe(0);
  });

  it("ignores non-activity modules", () => {
    const { stores, ctx } = setup();
    activityDeleteHook("Deals")(["d1"], ctx);
    expect(stores.Notes.records.size).toBe(1);
  });

  it("does nothing for a module that cannot parent activities", () => {
    const { stores, ctx } = setup();
    activityDeleteHook("Notes")(["d1"], ctx);
    expect(stores.Tasks.records.size).toBe(3);
  });

  it("chains the wrapped afterDelete hook", () => {
    const { ctx } = setup();
    const next = vi.fn();
    activityDeleteHook("Deals", next)(["d1"], ctx);
    expect(next).toHaveBeenCalledWith(["d1"], ctx);
  });
});
