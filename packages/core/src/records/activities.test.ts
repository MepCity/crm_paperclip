import { describe, expect, it } from "vitest";
import { activityDate, activityState, selectActivitySummary } from "./activities";
import type { RecordData } from "./contract";

const now = new Date("2026-10-14T12:00:00Z");
const row = (fields: RecordData["fields"]): RecordData => ({ id: "synthetic", fields });
describe("shared activity rules", () => {
  it.each(["Not Started", "In Progress", "Deferred", null])(
    "keeps unfinished task %s open",
    (Status) => {
      expect(activityState("Tasks", row({ Status }), now)).toBe("open");
    },
  );
  it("closes completed tasks and reads their due date", () => {
    expect(activityState("Tasks", row({ Status: "Completed" }), now)).toBe("closed");
    expect(activityDate("Tasks", row({ Due_Date: "2026-10-14" }))).toBe("2026-10-14");
  });
  it.each(["2026-10-14T11:59:59Z", "2026-10-14T12:00:00Z", null, "invalid"])(
    "closes meetings ending %s",
    (End_DateTime) => {
      expect(activityState("Events", row({ End_DateTime }), now)).toBe("closed");
    },
  );
  it("opens only meetings with a future end and uses the start date", () => {
    expect(activityState("Events", row({ End_DateTime: "2026-10-14T12:00:01Z" }), now)).toBe(
      "open",
    );
    expect(activityDate("Events", row({ Start_DateTime: "2026-10-14T08:00:00Z" }))).toBe(
      "2026-10-14T08:00:00Z",
    );
  });
  it.each(["Scheduled", "Overdue", "Completed", "", null, "unknown"])(
    "classifies call %s",
    (Outgoing_Call_Status) => {
      expect(activityState("Calls", row({ Outgoing_Call_Status }), now)).toBe(
        ["Scheduled", "Overdue"].includes(String(Outgoing_Call_Status)) ? "open" : "closed",
      );
    },
  );
  it("reads call dates and returns null for absent activity dates", () => {
    expect(activityDate("Calls", row({ Call_Start_Time: "2026-10-14T08:00:00Z" }))).toBe(
      "2026-10-14T08:00:00Z",
    );
    for (const module of ["Tasks", "Events", "Calls"])
      expect(activityDate(module, row({}))).toBeNull();
  });
  it("selects earliest open date, puts empty dates last, and resolves kind ties", () => {
    const activity = (kind: "task" | "meeting" | "call", date: string | null) => ({
      kind,
      date,
      state: "open" as const,
      activityId: kind,
    });
    const call = activity("call", "2026-10-14T00:00:00Z");
    const meeting = activity("meeting", "2026-10-14T00:00:00Z");
    const task = activity("task", "2026-10-14");
    expect(selectActivitySummary([call, meeting, task])?.kind).toBe("task");
    expect(selectActivitySummary([call, meeting])?.kind).toBe("meeting");
    expect(selectActivitySummary([activity("task", null), call])?.kind).toBe("call");
    expect(
      selectActivitySummary([
        activity("call", null),
        activity("meeting", null),
        activity("task", null),
      ])?.kind,
    ).toBe("task");
    expect(
      selectActivitySummary([{ ...task, state: "closed" }, activity("call", "2026-10-13")])?.kind,
    ).toBe("call");
    expect(selectActivitySummary([{ ...task, state: "closed" }])).toBeUndefined();
  });
});
