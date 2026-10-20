import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import * as definitions from "./contract-suite-module";
import { createFixtureRecordService } from "./fixture";
import { matchesSystemFilters, validateSystemFilters } from "./system-filters";
import { describeSystemFiltersContract } from "./system-filters-contract-suite";

for (const definition of Object.values(definitions)) {
  describeSystemFiltersContract(
    "fixture",
    (ctx, now) => createFixtureRecordService(ctx, { now }),
    definition,
  );
}
const period = { from: "2026-01-01T00:00:00Z", to: "2026-01-02T00:00:00Z" };
describe("system filter validation", () => {
  it.each<[unknown, string]>([
    [null, "filters"],
    [[], "filters"],
    [{ extra: {} }, "extra"],
    [{ locked: {} }, "locked"],
    [{ locked: { locked: "true" } }, "locked"],
    [{ touched: null }, "touched"],
    [{ touched: { period, extra: true } }, "touched"],
    [{ recordAction: { action: "deleted", period } }, "recordAction"],
    [
      { relatedRecordsAction: { module: "Notes", action: "created", period } },
      "relatedRecordsAction",
    ],
    [
      { relatedRecordsAction: { module: "Unknown", action: "added", period } },
      "relatedRecordsAction",
    ],
    ...[
      undefined,
      {},
      { ...period, from: "2026-01-01" },
      { ...period, to: "bad" },
      { ...period, from: "2026-02-30T00:00:00Z" },
      { ...period, from: "2026-01-01T24:00:00Z" },
      { ...period, to: period.from },
      { from: period.to, to: period.from },
      { ...period, to: "2027-01-03T00:00:00Z" },
      { ...period, extra: true },
    ].map((value): [unknown, string] => [{ touched: { period: value } }, "touched"]),
    ...["user", [3], [""], Array(26).fill("user")].map((actorIds): [unknown, string] => [
      { touched: { period, actorIds } },
      "touched",
    ]),
  ])("rejects %j at its filter key", (value, key) => {
    try {
      validateSystemFilters(value);
      throw new Error("Expected rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).fieldErrors).toEqual({
        [`systemFilters.${key}`]: expect.any(Array),
      });
    }
  });
  it("accepts a 366 day window and offset instants", () => {
    expect(() =>
      validateSystemFilters({
        touched: { period: { from: "2026-01-01T03:00:00+03:00", to: "2027-01-02T00:00:00Z" } },
      }),
    ).not.toThrow();
  });
});

describe("history action mapping", () => {
  const record = { id: "parent", fields: {} };
  const event = (
    kind: import("./history").HistoryEventKind,
    subjectModule = "Leads",
    subjectId = "parent",
  ): import("./history").RecordHistoryEvent => ({
    id: "event",
    schemaVersion: 1,
    stream: { module: "Leads", recordId: "parent" },
    subject: { module: subjectModule, recordId: subjectId },
    kind,
    actor: { id: "user", name: "Synthetic" },
    occurredAt: period.from,
    sequence: 1,
    operationId: "operation",
    ordinal: 0,
    source: "manual",
    mechanism: null,
    changes: [],
    payload: null,
  });
  it.each([
    ["created", "record_created"],
    ["updated", "fields_updated"],
    ["converted", "record_converted"],
    ["merged", "records_merged"],
  ] as const)("maps direct %s and excludes related subjects", (action, kind) => {
    const filter = { recordAction: { action, period } };
    expect(matchesSystemFilters("Leads", record, filter, [event(kind)])).toBe(true);
    expect(matchesSystemFilters("Leads", record, filter, [event(kind, "Tasks", "child")])).toBe(
      false,
    );
    expect(
      matchesSystemFilters("Leads", record, filter, [
        { ...event(kind), stream: { module: "Contacts", recordId: "parent" } },
      ]),
    ).toBe(false);
  });
  it.each([
    ["added", "note_added", "Notes"],
    ["added", "attachment_added", "Attachments"],
    ["added", "record_created", "Tasks"],
    ["added", "related_record_added", "Events"],
    ["updated", "fields_updated", "Calls"],
    ["deleted", "attachment_deleted", "Attachments"],
    ["deleted", "record_deleted", "Tasks"],
    ["deleted", "related_record_removed", "Events"],
  ] as const)("maps related %s %s", (action, kind, module) => {
    const filter = { relatedRecordsAction: { action, module, period } };
    expect(matchesSystemFilters("Leads", record, filter, [event(kind, module, "child")])).toBe(
      true,
    );
    expect(matchesSystemFilters("Leads", record, filter, [])).toBe(false);
    expect(matchesSystemFilters("Leads", record, filter, [event(kind, "Other", "child")])).toBe(
      false,
    );
  });
});
