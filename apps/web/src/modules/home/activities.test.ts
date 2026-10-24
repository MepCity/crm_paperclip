import { describe, expect, it } from "vitest";
import { activityRows, filterActivities, fixtureNow, isOverdue, periodRange } from "./activities";

const now = new Date(fixtureNow); // Saturday 2026-10-24, UTC
const ids = (r: { id: string }[]) => r.map((x) => x.id);

describe("home activity periods (fixed clock, UTC)", () => {
  it("computes boundaries", () => {
    expect(periodRange("today", now, "UTC")).toEqual([
      Date.parse("2026-10-24T00:00:00Z"),
      Date.parse("2026-10-25T00:00:00Z"),
    ]);
    expect(periodRange("this-week", now, "UTC")[0]).toBe(Date.parse("2026-10-19T00:00:00Z"));
    expect(periodRange("next-week", now, "UTC")[0]).toBe(Date.parse("2026-10-26T00:00:00Z"));
    expect(periodRange("next-7-days", now, "UTC")[1]).toBe(Date.parse("2026-10-31T00:00:00Z"));
  });
  it("uses the timezone for the day edge", () => {
    expect(isOverdue("2026-10-24T02:00:00Z", now, "UTC")).toBe(false);
    expect(isOverdue("2026-10-24T02:00:00Z", now, "America/Los_Angeles")).toBe(true);
  });
  it("filters rows deterministically", () => {
    const today = filterActivities(activityRows, "today", now, "UTC");
    expect(ids(today.overdue)).toEqual(["t1"]);
    expect(ids(today.inPeriod)).toEqual(["t2", "m1", "c1"]);
    expect(ids(filterActivities(activityRows, "next-week", now, "UTC").inPeriod)).toEqual([
      "t3",
      "m2",
    ]);
    expect(ids(filterActivities(activityRows, "next-7-days", now, "UTC").inPeriod)).toEqual([
      "t2",
      "t3",
      "m1",
      "m2",
      "c1",
    ]);
  });
});
