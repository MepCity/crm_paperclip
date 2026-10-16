import { ValidationError } from "@crm/core/errors";
import { describe, expect, it } from "vitest";
import { decodeTimelineQuery, encodeTimelineFilters, type TimelineSelection } from "./timelines";

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
