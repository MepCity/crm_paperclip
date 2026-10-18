import { describe, expect, it } from "vitest";
import type { FieldDefinition, RecordData } from "../contract";
import { historyBatch, historyChanges } from "./history-write";
import type { FixtureModuleStore } from "./hooks";
import type { FixtureModuleBundle } from "./registry";

const f = (apiName: string, dataType: string, extra: object = {}) =>
  ({ apiName, label: apiName.toUpperCase(), dataType, ...extra }) as unknown as FieldDefinition;
function bundle(
  extra: Partial<FixtureModuleBundle> = {},
  fields: FieldDefinition[] = [],
): FixtureModuleBundle {
  return {
    metadata: {
      fields: [
        f("Name", "text"),
        f("Status", "picklist", {
          picklist: [{ storedValue: "a", displayValue: "Alpha" }],
        }),
        f("Parent", "lookup"),
        f("Modified_Time", "datetime"),
        ...fields,
      ],
    },
    displayNameField: "Name",
    ...extra,
  } as unknown as FixtureModuleBundle;
}
const rec = (id: string, fields: RecordData["fields"]): RecordData => ({ id, fields });
const store = (...records: RecordData[]): FixtureModuleStore => ({
  records: new Map(records.map((r) => [r.id, r])),
  nextId: 1n,
});
const commit = {
  sequence: 3,
  occurredAt: "2026-01-01T00:00:00.000Z",
  actor: { id: "u", name: "User" },
  source: "ui" as never,
};

describe("historyChanges", () => {
  const b = bundle();
  it("skips audit fields and unchanged values, maps picklist display", () => {
    const changes = historyChanges(
      b,
      rec("1", { Name: "x", Status: "a", Modified_Time: "1" }),
      rec("1", { Name: "x", Status: "zzz", Modified_Time: "2" }),
    );
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      apiName: "Status",
      label: "STATUS",
      old: "a",
      new: "zzz",
      oldDisplay: "Alpha",
      newDisplay: "zzz",
    });
  });
  it("treats missing as null and null display as null", () => {
    const [c] = historyChanges(b, rec("1", {}), rec("1", { Name: "n" }));
    expect(c).toMatchObject({ old: null, new: "n", oldDisplay: null, newDisplay: "n" });
  });
  it("ignores lookup name differences and key order", () => {
    const a = rec("1", { Parent: { module: "X", id: "9", name: "A" } });
    const c = rec("1", { Parent: { module: "X", id: "9", name: "B" } });
    expect(historyChanges(b, a, c)).toEqual([]);
  });
  it("uses lookup name for display and stringifies other objects", () => {
    const [c] = historyChanges(
      b,
      rec("1", { Parent: { module: "X", id: "1", name: "One" } }),
      rec("1", { Parent: { module: "X", id: "2" } }),
    );
    expect(c?.oldDisplay).toBe("One");
    expect(c?.newDisplay).toBe("2");
  });
  it("applies the snapshot callback with the previous flag", () => {
    const [c] = historyChanges(b, rec("1", { Name: "a" }), rec("1", { Name: "b" }), (v, prev) =>
      prev ? "OLD" : `${v}!`,
    );
    expect(c).toMatchObject({ old: "OLD", new: "b!", oldDisplay: "OLD", newDisplay: "b!" });
  });
});

describe("historyBatch", () => {
  const bundles = { A: bundle(), B: bundle() };
  const op = { module: "A", mechanism: "test" };

  it("emits created, updated and deleted events with ordinals and shared operation id", () => {
    const before = new Map([
      ["A", store(rec("1", { Name: "x" }), rec("3", { Name: "gone" }))],
      ["B", store()],
    ]);
    const after = new Map([
      ["A", store(rec("1", { Name: "y" }), rec("2", { Name: "new" }))],
      ["B", store(rec("b1", { Name: "bn" }))],
    ]);
    const events = historyBatch(before, after, bundles, op, commit);
    expect(events.map((e) => [e.stream.module, e.stream.recordId, e.kind, e.ordinal])).toEqual([
      ["A", "1", "fields_updated", 0],
      ["A", "3", "record_deleted", 1],
      ["A", "2", "record_created", 2],
      ["B", "b1", "record_created", 3],
    ]);
    expect(new Set(events.map((e) => e.operationId)).size).toBe(1);
    expect(new Set(events.map((e) => e.id)).size).toBe(4);
    expect(events[0]).toMatchObject({
      schemaVersion: 1,
      mechanism: "test",
      sequence: 3,
      payload: null,
      subject: events[0]?.stream,
    });
    expect(events[1]?.changes).toEqual([]);
  });

  it("skips untouched stores, identical clones and no-change updates", () => {
    const s = store(rec("1", { Name: "x" }));
    const before = new Map([
      ["A", s],
      ["B", store(rec("1", { Name: "x" }))],
    ]);
    const after = new Map([
      ["A", s],
      ["B", store(rec("1", { Name: "x" }))],
    ]);
    expect(historyBatch(before, after, bundles, op, commit)).toEqual([]);
    const audit = new Map([["B", store(rec("1", { Name: "x", Modified_Time: "9" }))]]);
    expect(historyBatch(before, audit, bundles, op, commit)).toEqual([]);
  });

  it("forces the operation kind for the target record even without changes", () => {
    const s1 = store(rec("1", { Name: "x" }));
    const s2 = store(rec("1", { Name: "x" }));
    const events = historyBatch(
      new Map([["A", s1]]),
      new Map([["A", s2]]),
      bundles,
      { module: "A", recordId: "1", kind: "record_restored", mechanism: "m" },
      commit,
    );
    expect(events).toHaveLength(1);
    expect(events[0]?.kind).toBe("record_restored");
  });

  it("skips deleted merge sources of the operation module", () => {
    const events = historyBatch(
      new Map([["A", store(rec("1", { Name: "m" }), rec("2", { Name: "src" }))]]),
      new Map([["A", store(rec("1", { Name: "m2" }))]]),
      bundles,
      { module: "A", recordId: "1", kind: "records_merged", mechanism: "merge" },
      commit,
    );
    expect(events.map((e) => [e.stream.recordId, e.kind])).toEqual([["1", "records_merged"]]);
  });

  it("skips child and read-only modules", () => {
    const b = { A: bundle({ childModule: true }), B: bundle({ readOnly: true }) };
    const events = historyBatch(
      new Map([
        ["A", store()],
        ["B", store()],
      ]),
      new Map([
        ["A", store(rec("1", {}))],
        ["B", store(rec("1", {}))],
      ]),
      b,
      op,
      commit,
    );
    expect(events).toEqual([]);
  });

  it("resolves lookup snapshots to current display names per side", () => {
    const ref = (id: string) => ({ module: "B", id });
    const events = historyBatch(
      new Map([
        ["A", store(rec("1", { Parent: ref("b1") }))],
        ["B", store(rec("b1", { Name: "Old Name" }))],
      ]),
      new Map([
        ["A", store(rec("1", { Parent: ref("b2") }))],
        ["B", store(rec("b1", { Name: "Old Name" }), rec("b2", { Name: "New Name" }))],
      ]),
      bundles,
      op,
      commit,
    );
    const change = events.find((e) => e.stream.module === "A")?.changes[0];
    expect(change?.old).toEqual({ module: "B", id: "b1", name: "Old Name" });
    expect(change?.new).toEqual({ module: "B", id: "b2", name: "New Name" });
  });

  it("keeps a stored lookup name when the target is unavailable", () => {
    const events = historyBatch(
      new Map([["A", store(rec("1", { Parent: null }))]]),
      new Map([["A", store(rec("1", { Parent: { module: "Zed", id: "9", name: "Kept" } }))]]),
      bundles,
      op,
      commit,
    );
    expect(events[0]?.changes[0]?.new).toEqual({ module: "Zed", id: "9", name: "Kept" });
  });

  it("throws on missing bundle or staged store", () => {
    expect(() => historyBatch(new Map(), new Map([["Q", store()]]), bundles, op, commit)).toThrow(
      "Missing module history metadata.",
    );
    expect(() => historyBatch(new Map(), new Map([["A", store()]]), bundles, op, commit)).toThrow(
      "Missing staged module.",
    );
  });
});
