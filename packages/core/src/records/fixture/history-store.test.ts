import { describe, expect, it } from "vitest";
import type { RecordHistoryEvent } from "../history";
import { fixtureHistoryStore } from "./history-store";

function makeEvent(over: Partial<RecordHistoryEvent> = {}): RecordHistoryEvent {
  return {
    id: "e1",
    schemaVersion: 1,
    stream: { module: "Leads", recordId: "r1" },
    subject: { module: "Leads", recordId: "r1" },
    kind: "fields_updated",
    actor: { id: "u1", name: "User" },
    occurredAt: "2026-01-01T00:00:00Z",
    sequence: 1,
    operationId: "op1",
    ordinal: 0,
    source: "manual",
    mechanism: null,
    changes: [],
    payload: null,
    ...over,
  };
}

describe("fixtureHistoryStore", () => {
  it("appends and reads events newest first", () => {
    const store = fixtureHistoryStore(new Map());
    store.appendBatch([
      makeEvent({ id: "a", sequence: 1, operationId: "o1" }),
      makeEvent({ id: "b", sequence: 3, operationId: "o3" }),
      makeEvent({ id: "c", sequence: 2, operationId: "o2" }),
    ]);
    expect(store.readPage({ module: "Leads", recordId: "r1" }, 10).map((e) => e.id)).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("orders ties by ordinal then id descending", () => {
    const store = fixtureHistoryStore(new Map());
    store.appendBatch([
      makeEvent({ id: "a", ordinal: 0 }),
      makeEvent({ id: "b", ordinal: 1 }),
      makeEvent({ id: "c", ordinal: 1, operationId: "op2" }),
    ]);
    // Same sequence: ordinal desc, then id desc.
    expect(store.readPage({ module: "Leads", recordId: "r1" }, 10).map((e) => e.id)).toEqual([
      "c",
      "b",
      "a",
    ]);
  });

  it("filters by record stream and high-water mark", () => {
    const store = fixtureHistoryStore(new Map());
    store.appendBatch([
      makeEvent({ id: "a", sequence: 1 }),
      makeEvent({ id: "b", sequence: 5, operationId: "o2" }),
      makeEvent({
        id: "c",
        operationId: "o3",
        stream: { module: "Leads", recordId: "r2" },
      }),
      makeEvent({
        id: "d",
        operationId: "o4",
        stream: { module: "Contacts", recordId: "r1" },
      }),
    ]);
    expect(store.readPage({ module: "Leads", recordId: "r1" }, 3).map((e) => e.id)).toEqual(["a"]);
    expect(store.readPage({ module: "Leads", recordId: "r2" }, 3).map((e) => e.id)).toEqual(["c"]);
    expect(store.readPage({ module: "Leads", recordId: "none" }, 3)).toEqual([]);
  });

  it("treats an identical rewrite as idempotent", () => {
    const events = new Map<string, RecordHistoryEvent>();
    const store = fixtureHistoryStore(events);
    store.appendBatch([makeEvent()]);
    store.appendBatch([makeEvent()]);
    expect(events.size).toBe(1);
  });

  it("rejects a conflicting event with the same id", () => {
    const store = fixtureHistoryStore(new Map());
    store.appendBatch([makeEvent()]);
    expect(() => store.appendBatch([makeEvent({ kind: "record_created" })])).toThrow(
      "Conflicting history event.",
    );
  });

  it("rejects a conflicting event with the same operation and ordinal", () => {
    const store = fixtureHistoryStore(new Map());
    store.appendBatch([makeEvent()]);
    expect(() => store.appendBatch([makeEvent({ id: "other" })])).toThrow(
      "Conflicting history event.",
    );
  });

  it("publishes nothing when a batch fails", () => {
    const events = new Map<string, RecordHistoryEvent>();
    const store = fixtureHistoryStore(events);
    store.appendBatch([makeEvent()]);
    expect(() =>
      store.appendBatch([
        makeEvent({ id: "new", operationId: "o2" }),
        makeEvent({ kind: "record_created" }),
      ]),
    ).toThrow();
    expect([...events.keys()]).toEqual(["e1"]);
  });

  it("stores a clone so later caller mutation is not visible", () => {
    const store = fixtureHistoryStore(new Map());
    const event = makeEvent();
    store.appendBatch([event]);
    event.kind = "record_deleted";
    expect(store.readPage({ module: "Leads", recordId: "r1" }, 10)[0]?.kind).toBe("fields_updated");
  });
});
