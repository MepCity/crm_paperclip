import { describe, expect, it } from "vitest";
import type { RecordData } from "../../contract";
import type { FixtureHookContext, FixtureModuleStore } from "../hooks";
import { dealsHooks, historyHooks } from "./hooks";

const deal = (id: string, stage: string, created = "2026-10-10T00:00:00.000Z"): RecordData => ({
  id,
  fields: { Stage: stage, Amount: 100, Created_Time: created, Modified_Time: created },
});
const dealRef = (id: string) => ({ module: "Deals", id });

function context(deals: RecordData[], history: RecordData[] = []) {
  const stores: Record<string, FixtureModuleStore> = {
    Deals: { records: new Map(deals.map((d) => [d.id, d])), nextId: 1000n },
    DealHistory: { records: new Map(history.map((h) => [h.id, h])), nextId: 1n },
  };
  const ctx: FixtureHookContext = {
    registeredModules: Object.keys(stores),
    moduleStore: (m) => stores[m] as FixtureModuleStore,
  };
  return { ctx, history: stores.DealHistory as FixtureModuleStore };
}
const rowsOf = (store: FixtureModuleStore, id: string) =>
  [...store.records.values()].filter(
    (r) => (r.fields.Potential_Name as { id: string } | null)?.id === id,
  );

describe("dealsHooks.afterSeed", () => {
  it("creates one history row per deal", () => {
    const deals = Array.from({ length: 3 }, (_, i) => deal(`d${i}`, "Qualification"));
    const { ctx, history } = context(deals);
    dealsHooks.afterSeed?.(ctx);
    expect(history.records.size).toBe(3);
    for (const d of deals) expect(rowsOf(history, d.id)).toHaveLength(1);
  });

  it("adds a Qualification row first for every 10th non-Qualification deal", () => {
    const deals = Array.from({ length: 11 }, (_, i) => deal(`d${i}`, "Negotiation/Review"));
    const { ctx, history } = context(deals);
    dealsHooks.afterSeed?.(ctx);
    expect(rowsOf(history, "d0")).toHaveLength(2);
    expect(rowsOf(history, "d1")).toHaveLength(1);
    expect(rowsOf(history, "d10")).toHaveLength(2);
    const [first] = rowsOf(history, "d0");
    expect(first?.fields.Stage).toBe("Qualification");
    expect(first?.fields.Moved_To__s).toBe("Negotiation/Review");
    expect(first?.fields.Stage_Duration_Calendar_Days).toBe(2);
    expect(first?.fields.Modified_Time).toBe("2026-10-08T00:00:00.000Z");
    expect(deals[0]?.fields.Created_Time).toBe("2026-10-08T00:00:00.000Z");
  });

  it("does not add a Qualification row for a Qualification deal at index 0", () => {
    const { ctx, history } = context([deal("d0", "Qualification")]);
    dealsHooks.afterSeed?.(ctx);
    expect(rowsOf(history, "d0")).toHaveLength(1);
  });
});

describe("dealsHooks.afterWrite", () => {
  const seeded = () => {
    const d = deal("d1", "Qualification", "2026-10-01T00:00:00.000Z");
    const c = context([d]);
    dealsHooks.afterSeed?.(c.ctx);
    return { ...c, d };
  };

  it("adds a row and closes the previous one when the stage changes", () => {
    const { ctx, history, d } = seeded();
    const previous = { ...d };
    const next: RecordData = {
      id: "d1",
      fields: {
        ...d.fields,
        Stage: "Proposal/Price Quote",
        Modified_Time: "2026-10-04T12:00:00.000Z",
      },
    };
    dealsHooks.afterWrite?.(next, previous, ctx);
    const rows = rowsOf(history, "d1");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.fields.Moved_To__s).toBe("Proposal/Price Quote");
    expect(rows[0]?.fields.Stage_Duration_Calendar_Days).toBe(3);
    expect(rows[1]?.fields.Stage).toBe("Proposal/Price Quote");
    expect(rows[1]?.fields.Potential_Name).toEqual(dealRef("d1"));
  });

  it("adds a row for a newly created deal (no previous)", () => {
    const { ctx, history } = context([]);
    dealsHooks.afterWrite?.(deal("n1", "Qualification"), undefined, ctx);
    expect(rowsOf(history, "n1")).toHaveLength(1);
  });

  it("adds nothing when the stage is unchanged", () => {
    const { ctx, history, d } = seeded();
    dealsHooks.afterWrite?.({ id: "d1", fields: { ...d.fields, Amount: 5 } }, d, ctx);
    expect(rowsOf(history, "d1")).toHaveLength(1);
  });
});

describe("dealsHooks.afterDelete", () => {
  it("removes history rows of the deleted deals only", () => {
    const { ctx, history } = context([deal("d1", "Qualification"), deal("d2", "Qualification")]);
    dealsHooks.afterSeed?.(ctx);
    dealsHooks.afterDelete?.(["d1"], ctx);
    expect(rowsOf(history, "d1")).toHaveLength(0);
    expect(rowsOf(history, "d2")).toHaveLength(1);
  });
});

describe("dealsHooks config", () => {
  it("applies deal rules and cleans history on merge", () => {
    expect(dealsHooks.applyRules).toBeTypeOf("function");
    expect(dealsHooks.mergeRelatedRecords).toEqual([
      { module: "DealHistory", field: "Potential_Name" },
    ]);
  });
});

describe("historyHooks.orderRows", () => {
  it("reverses rows in place", () => {
    const rows = ["a", "b", "c"].map((id) => ({ id, fields: {} }));
    historyHooks.orderRows?.(rows);
    expect(rows.map((r) => r.id)).toEqual(["c", "b", "a"]);
  });
});
