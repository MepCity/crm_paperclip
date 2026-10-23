import { randomUUID } from "node:crypto";
import type { RecordData, RecordService } from "@crm/core/records";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { expect, test, vi } from "vitest";
import { calendarEvent, loadCalendarEvents, shiftDate, visibleRange } from "./calendar-model";

const record = (id: string, fields = {}): RecordData => ({
  id,
  fields: {
    Event_Title: "Planning",
    Start_DateTime: "2026-01-31T09:00:00Z",
    End_DateTime: "2026-01-31T10:00:00Z",
    ...fields,
  },
});

test("month navigation clamps leap days and crosses years without skipping months", () => {
  expect(shiftDate("2026-01-31", "month", 1)).toBe("2026-02-28");
  expect(shiftDate("2024-01-31", "month", 1)).toBe("2024-02-29");
  expect(shiftDate("2026-01-31", "month", -1)).toBe("2025-12-31");
  expect(shiftDate("2026-12-31", "day", 1)).toBe("2027-01-01");
  expect(shiftDate("2026-12-31", "week", 1)).toBe("2027-01-07");
  expect(visibleRange("2026-01-31", "week")).toEqual({ start: "2026-01-26", end: "2026-02-02" });
  expect(visibleRange("2026-01-31", "month")).toEqual({ start: "2025-12-29", end: "2026-02-09" });
});

test("all-day dates stay stable and inclusive stored end becomes exclusive", () => {
  expect(
    calendarEvent(
      record("all", {
        All_day: true,
        Start_DateTime: "2026-01-31T00:00:00Z",
        End_DateTime: "2026-02-01T23:59:59Z",
      }),
    ),
  ).toMatchObject({ start: "2026-01-31T00:00", end: "2026-02-02T00:00", allDay: true });
  expect(calendarEvent(record("invalid", { Start_DateTime: "invalid" }))).toBeNull();
  expect(calendarEvent(record("zero", { End_DateTime: "2026-01-31T09:00:00Z" }))).toBeNull();
});

test("loads every record page through the port and includes only overlapping events", async () => {
  const list = vi
    .fn()
    .mockResolvedValueOnce({
      records: [
        record("outside", {
          Start_DateTime: "2025-01-01T00:00:00Z",
          End_DateTime: "2025-01-01T01:00:00Z",
        }),
      ],
      moreRecords: true,
    })
    .mockResolvedValueOnce({ records: [record("inside")], moreRecords: false });
  const service = { list } as unknown as RecordService;
  const events = await loadCalendarEvents(
    service,
    { start: "2026-01-01", end: "2026-02-01" },
    "user-a",
  );
  expect(events.map((event) => event.id)).toEqual(["inside"]);
  expect(list).toHaveBeenNthCalledWith(
    2,
    "Events",
    expect.objectContaining({
      page: 2,
      filters: { field: "Owner", comparator: "equal", value: { token: "CURRENTUSER" } },
    }),
  );
});

test("calendar queries satisfy the fixture port contract in both calendar scopes", async () => {
  const service = createFixtureRecordService(
    {
      orgId: randomUUID(),
      orgSlug: "calendar-test",
      orgName: "Calendar Test",
      userId: "calendar-user",
      role: "admin",
    },
    { now: () => new Date("2026-01-15T12:00:00Z") },
  );
  const range = { start: "2026-01-01", end: "2026-02-01" };
  const all = await loadCalendarEvents(service, range);
  expect(all).toHaveLength(250);
  await expect(loadCalendarEvents(service, range, "calendar-user")).resolves.toBeInstanceOf(Array);
});
