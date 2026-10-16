import { ValidationError } from "@crm/core/errors";
import type { RecordHistoryEvent, RecordHistoryPage } from "@crm/core/records";
import { describe, expect, it } from "vitest";
import {
  decodeTimelineQuery,
  decodeTimelinesPage,
  encodeTimelineEvent,
  encodeTimelineFilters,
  encodeTimelineQuery,
  encodeTimelinesPage,
  type TimelineSelection,
} from "./timelines";

const decode = (filters?: unknown, extra = "") => {
  const params = new URLSearchParams(extra);
  if (filters !== undefined)
    params.set("filters", typeof filters === "string" ? filters : JSON.stringify(filters));
  return decodeTimelineQuery(params);
};
const leaf = (api_name: string, comparator: string, value: unknown) => ({
  field: { api_name },
  comparator,
  value,
});
const rejects = (filters: unknown) => expect(() => decode(filters)).toThrow(ValidationError);
const none: TimelineSelection = { modules: [], userId: null, time: "any", sources: [] };

describe("decodeTimelineQuery", () => {
  it("applies defaults and ignores unknown keys", () => {
    expect(decode(undefined, "include=x")).toEqual({ perPage: 25, pageToken: null });
    expect(decode(undefined, "page_token=abc&per_page=200")).toEqual({
      perPage: 200,
      pageToken: "abc",
    });
  });
  it("rejects bad per_page", () => {
    for (const v of ["0", "201", "x", "1.5", "-1"])
      expect(() => decode(undefined, `per_page=${v}`)).toThrow(ValidationError);
  });
  it("accepts every leaf", () => {
    expect(decode(leaf("record.module.api_name", "in", ["Events", "Leads"])).modules).toEqual([
      "Events",
      "Leads",
    ]);
    expect(decode(leaf("done_by.id", "equal", "u1")).actorId).toBe("u1");
    expect(decode(leaf("done_by.id", "in", ["u1"])).actorId).toBe("u1");
    expect(decode(leaf("source", "in", ["crm_ui", "crm_api", "import"])).sources).toEqual([
      "manual",
      "api",
      "import",
    ]);
    const q = decode(
      leaf("audited_time", "between", ["2026-10-16T00:00:00+03:00", "2026-10-17T00:00:00Z"]),
    );
    expect(q.from).toBe("2026-10-16T00:00:00+03:00");
    expect(q.to).toBe("2026-10-17T00:00:00Z");
  });
  it("accepts an AND group", () => {
    const q = decode({
      group_operator: "AND",
      group: [leaf("done_by.id", "equal", "u1"), leaf("source", "in", ["import"])],
    });
    expect(q.actorId).toBe("u1");
    expect(q.sources).toEqual(["import"]);
  });
  it("rejects invalid filters", () => {
    rejects("{not json");
    rejects("[]");
    rejects(leaf("name", "equal", "x"));
    rejects(leaf("record.module.api_name", "equal", ["Leads"]));
    rejects(leaf("record.module.api_name", "in", []));
    rejects(leaf("record.module.api_name", "in", "Leads"));
    rejects(leaf("record.module.api_name", "in", ["Meetings"]));
    rejects(leaf("record.module.api_name", "in", ["Events", "Meetings"]));
    rejects(leaf("done_by.id", "equal", 5));
    rejects(leaf("done_by.id", "in", ["a", "b"]));
    rejects(leaf("done_by.id", "starts_with", "a"));
    rejects(leaf("source", "in", ["manual"]));
    rejects(leaf("source", "equal", ["crm_ui"]));
    rejects(leaf("audited_time", "between", ["2026-10-16T00:00:00", "2026-10-17T00:00:00Z"]));
    rejects(leaf("audited_time", "between", ["2026-10-17T00:00:00Z", "2026-10-16T00:00:00Z"]));
    rejects(leaf("audited_time", "between", ["2026-10-16T00:00:00Z"]));
    rejects(leaf("audited_time", "greater_than", "2026-10-16T00:00:00Z"));
    rejects({ group_operator: "OR", group: [leaf("done_by.id", "equal", "u1")] });
    rejects({
      group_operator: "AND",
      group: [leaf("done_by.id", "equal", "a"), leaf("done_by.id", "equal", "b")],
    });
    rejects({
      group_operator: "AND",
      group: [{ group_operator: "AND", group: [leaf("done_by.id", "equal", "a")] }],
    });
  });
});

describe("encodeTimelineFilters", () => {
  const window = (sel: Partial<TimelineSelection>, now: string, tz: string) => {
    const q = decodeTimelineQuery(
      new URLSearchParams({
        filters: encodeTimelineFilters({ ...none, ...sel }, new Date(now), tz) ?? "",
      }),
    );
    return [q.from, q.to];
  };
  it("returns null for nothing selected", () => {
    expect(encodeTimelineFilters(none, new Date(), "UTC")).toBeNull();
  });
  it("computes Istanbul windows", () => {
    const now = "2026-10-16T10:00:00Z";
    expect(window({ time: "today" }, now, "Europe/Istanbul")).toEqual([
      "2026-10-16T00:00:00+03:00",
      "2026-10-17T00:00:00+03:00",
    ]);
    expect(window({ time: "yesterday" }, now, "Europe/Istanbul")).toEqual([
      "2026-10-15T00:00:00+03:00",
      "2026-10-16T00:00:00+03:00",
    ]);
    expect(window({ time: "last7" }, now, "Europe/Istanbul")).toEqual([
      "2026-10-10T00:00:00+03:00",
      "2026-10-17T00:00:00+03:00",
    ]);
    expect(window({ time: "last30" }, now, "Europe/Istanbul")[0]).toBe("2026-09-17T00:00:00+03:00");
  });
  it("uses the local date just after local midnight", () => {
    expect(window({ time: "today" }, "2026-10-15T21:00:30Z", "Europe/Istanbul")[0]).toBe(
      "2026-10-16T00:00:00+03:00",
    );
    expect(window({ time: "today" }, "2026-10-15T20:59:59Z", "Europe/Istanbul")[0]).toBe(
      "2026-10-15T00:00:00+03:00",
    );
  });
  it("handles New York and DST change days", () => {
    expect(window({ time: "today" }, "2026-10-16T15:00:00Z", "America/New_York")).toEqual([
      "2026-10-16T00:00:00-04:00",
      "2026-10-17T00:00:00-04:00",
    ]);
    expect(window({ time: "today" }, "2026-11-01T12:00:00Z", "America/New_York")).toEqual([
      "2026-11-01T00:00:00-04:00",
      "2026-11-02T00:00:00-05:00",
    ]);
    expect(window({ time: "today" }, "2026-03-08T12:00:00Z", "America/New_York")).toEqual([
      "2026-03-08T00:00:00-05:00",
      "2026-03-09T00:00:00-04:00",
    ]);
    expect(window({ time: "last7" }, "2026-11-03T12:00:00Z", "America/New_York")[0]).toBe(
      "2026-10-28T00:00:00-04:00",
    );
  });
  it("round-trips a full selection", () => {
    const sel: TimelineSelection = {
      modules: ["Leads", "Events"],
      userId: "u1",
      time: "last7",
      sources: ["manual", "import"],
    };
    const q = decodeTimelineQuery(
      new URLSearchParams({
        filters:
          encodeTimelineFilters(sel, new Date("2026-10-16T10:00:00Z"), "Europe/Istanbul") ?? "",
      }),
    );
    expect(q).toMatchObject({
      modules: ["Leads", "Events"],
      actorId: "u1",
      sources: ["manual", "import"],
      from: "2026-10-10T00:00:00+03:00",
      to: "2026-10-17T00:00:00+03:00",
    });
  });
  it("omits empty selectors and uses a bare leaf for one", () => {
    const json = encodeTimelineFilters({ ...none, userId: "u1" }, new Date(), "UTC");
    expect(JSON.parse(json ?? "")).toEqual(leaf("done_by.id", "equal", "u1"));
  });
  it("maps meetings and Meetings module selection to Events", () => {
    const jsonLower = encodeTimelineFilters({ ...none, modules: ["meetings"] }, new Date(), "UTC");
    expect(JSON.parse(jsonLower ?? "")).toEqual(leaf("record.module.api_name", "in", ["Events"]));

    const jsonUpper = encodeTimelineFilters({ ...none, modules: ["Meetings"] }, new Date(), "UTC");
    expect(JSON.parse(jsonUpper ?? "")).toEqual(leaf("record.module.api_name", "in", ["Events"]));

    const jsonDedup = encodeTimelineFilters(
      { ...none, modules: ["Events", "meetings"] },
      new Date(),
      "UTC",
    );
    expect(JSON.parse(jsonDedup ?? "")).toEqual(leaf("record.module.api_name", "in", ["Events"]));
  });
});

describe("encodeTimelineEvent", () => {
  const baseEvent: RecordHistoryEvent = {
    id: "evt-1",
    schemaVersion: 1,
    stream: { module: "Leads", recordId: "rec-1", name: "Alice" },
    subject: { module: "Leads", recordId: "rec-1", name: "Alice" },
    kind: "fields_updated",
    actor: { id: "user-1", name: "Agent User" },
    occurredAt: "2026-10-16T12:00:00.000Z",
    sequence: 1,
    operationId: "op-1",
    ordinal: 0,
    source: "manual",
    mechanism: null,
    changes: [
      {
        apiName: "Company",
        label: "Company",
        dataType: "text",
        old: "Old Co",
        new: "New Co",
        oldDisplay: "Old Co",
        newDisplay: "New Co",
      },
    ],
    payload: { note: "sample" },
  };

  it("encodes standard field update event with same stream and subject", () => {
    const encoded = encodeTimelineEvent(baseEvent);
    expect(encoded).toEqual({
      id: "evt-1",
      audited_time: "2026-10-16T12:00:00.000Z",
      done_by: { id: "user-1", name: "Agent User" },
      record: { module: { api_name: "Leads" }, id: "rec-1", name: "Alice" },
      related_record: null,
      action: "updated",
      source: "crm_ui",
      field_history: [
        {
          api_name: "Company",
          field_label: "Company",
          data_type: "text",
          _value: { old: "Old Co", new: "New Co" },
        },
      ],
      automation: null,
      extension: null,
      type: null,
      event_kind: "fields_updated",
      event_details: { note: "sample" },
    });
  });

  it("encodes child event with stream distinct from subject", () => {
    const childEvent: RecordHistoryEvent = {
      ...baseEvent,
      kind: "note_added",
      subject: { module: "Notes", recordId: "note-1", name: "Note title" },
      changes: [],
    };
    const encoded = encodeTimelineEvent(childEvent);
    expect(encoded.action).toBe("added");
    expect(encoded.record).toEqual({
      module: { api_name: "Notes" },
      id: "note-1",
      name: "Note title",
    });
    expect(encoded.related_record).toEqual({
      module: { api_name: "Leads" },
      id: "rec-1",
      name: "Alice",
    });
  });

  it("maps action literals correctly according to ADR 0006 §3", () => {
    expect(encodeTimelineEvent({ ...baseEvent, kind: "record_created", changes: [] }).action).toBe(
      "added",
    );
    expect(
      encodeTimelineEvent({ ...baseEvent, kind: "attachment_added", changes: [] }).action,
    ).toBe("added");
    expect(
      encodeTimelineEvent({ ...baseEvent, kind: "related_record_added", changes: [] }).action,
    ).toBe("relatedrecords_added");
    expect(encodeTimelineEvent({ ...baseEvent, kind: "record_deleted", changes: [] }).action).toBe(
      "deleted",
    );
    expect(
      encodeTimelineEvent({ ...baseEvent, kind: "related_record_removed", changes: [] }).action,
    ).toBe("deleted");
    expect(
      encodeTimelineEvent({ ...baseEvent, kind: "attachment_deleted", changes: [] }).action,
    ).toBe("deleted");
    expect(encodeTimelineEvent({ ...baseEvent, kind: "records_merged", changes: [] }).action).toBe(
      "merged",
    );
    expect(
      encodeTimelineEvent({ ...baseEvent, kind: "record_converted", changes: [] }).action,
    ).toBe("converted");
    expect(encodeTimelineEvent({ ...baseEvent, kind: "record_restored", changes: [] }).action).toBe(
      "restored",
    );

    // owner_assigned only when single change is Owner
    const ownerChange = {
      apiName: "Owner",
      label: "Owner",
      dataType: "ownerlookup" as const,
      old: "u1",
      new: "u2",
      oldDisplay: "User 1",
      newDisplay: "User 2",
    };
    expect(
      encodeTimelineEvent({ ...baseEvent, kind: "fields_updated", changes: [ownerChange] }).action,
    ).toBe("owner_assigned");

    // mixed fields update stays updated
    expect(
      encodeTimelineEvent({
        ...baseEvent,
        kind: "fields_updated",
        changes: [ownerChange, { ...ownerChange, apiName: "Company", label: "Company" }],
      }).action,
    ).toBe("updated");
  });

  it("maps sources to wire tokens", () => {
    expect(encodeTimelineEvent({ ...baseEvent, source: "manual" }).source).toBe("crm_ui");
    expect(encodeTimelineEvent({ ...baseEvent, source: "api" }).source).toBe("crm_api");
    expect(encodeTimelineEvent({ ...baseEvent, source: "import" }).source).toBe("import");
  });
});

describe("encodeTimelinesPage and decodeTimelinesPage", () => {
  const event: RecordHistoryEvent = {
    id: "evt-1",
    schemaVersion: 1,
    stream: { module: "Leads", recordId: "rec-1", name: null },
    subject: { module: "Leads", recordId: "rec-1", name: null },
    kind: "fields_updated",
    actor: { id: "user-1", name: "Agent User" },
    occurredAt: "2026-10-16T12:00:00.000Z",
    sequence: 0,
    operationId: "evt-1",
    ordinal: 0,
    source: "api",
    mechanism: null,
    changes: [
      {
        apiName: "Company",
        label: "Company",
        dataType: "text",
        old: "A",
        new: "B",
        oldDisplay: "A",
        newDisplay: "B",
      },
    ],
    payload: null,
  };

  it("returns null for empty page (204 wire representation)", () => {
    const encoded = encodeTimelinesPage(
      { events: [], nextPageToken: null, moreRecords: false },
      { perPage: 25, pageToken: null },
    );
    expect(encoded).toBeNull();
  });

  it("decodes null into an empty page", () => {
    expect(decodeTimelinesPage(null)).toEqual({
      events: [],
      nextPageToken: null,
      moreRecords: false,
    });
  });

  it("round-trips a non-empty page", () => {
    const page: RecordHistoryPage = {
      events: [event],
      nextPageToken: "next-tok",
      moreRecords: true,
    };
    const wire = encodeTimelinesPage(page, { perPage: 10, pageToken: "prev-tok" });
    expect(wire).toMatchObject({
      info: {
        count: 1,
        more_records: true,
        page: 1,
        per_page: 10,
        next_page_token: "next-tok",
        previous_page_token: "prev-tok",
      },
    });
    const decoded = decodeTimelinesPage(wire);
    expect(decoded.nextPageToken).toBe("next-tok");
    expect(decoded.moreRecords).toBe(true);
    expect(decoded.events).toHaveLength(1);
    expect(decoded.events[0]).toMatchObject({
      id: "evt-1",
      kind: "fields_updated",
      source: "api",
      stream: { module: "Leads", recordId: "rec-1", name: null },
      subject: { module: "Leads", recordId: "rec-1", name: null },
      changes: [{ apiName: "Company", oldDisplay: "A", newDisplay: "B" }],
    });
  });
});

describe("encodeTimelineQuery", () => {
  it("encodes minimal query", () => {
    const params = encodeTimelineQuery({ perPage: 25, pageToken: null });
    expect(params.get("per_page")).toBe("25");
    expect(params.get("page_token")).toBeNull();
    expect(params.get("filters")).toBeNull();
  });

  it("encodes page token and single filter", () => {
    const params = encodeTimelineQuery({
      perPage: 50,
      pageToken: "cursor-1",
      actorId: "usr-9",
    });
    expect(params.get("per_page")).toBe("50");
    expect(params.get("page_token")).toBe("cursor-1");
    expect(JSON.parse(params.get("filters") ?? "")).toEqual({
      field: { api_name: "done_by.id" },
      comparator: "equal",
      value: "usr-9",
    });
  });

  it("maps Meetings and meetings to Events and combines multiple filters with AND", () => {
    const params = encodeTimelineQuery({
      perPage: 25,
      pageToken: null,
      modules: ["Meetings", "Leads", "meetings"],
      sources: ["manual", "import"],
      from: "2026-10-10T00:00:00+03:00",
      to: "2026-10-17T00:00:00+03:00",
    });
    const filters = JSON.parse(params.get("filters") ?? "");
    expect(filters.group_operator).toBe("AND");
    expect(filters.group).toHaveLength(3);
    expect(filters.group[0]).toEqual({
      field: { api_name: "record.module.api_name" },
      comparator: "in",
      value: ["Events", "Leads"],
    });
    expect(filters.group[1]).toEqual({
      field: { api_name: "audited_time" },
      comparator: "between",
      value: ["2026-10-10T00:00:00+03:00", "2026-10-17T00:00:00+03:00"],
    });
    expect(filters.group[2]).toEqual({
      field: { api_name: "source" },
      comparator: "in",
      value: ["crm_ui", "import"],
    });
  });
});
