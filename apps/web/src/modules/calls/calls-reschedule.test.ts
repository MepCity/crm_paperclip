import { expect, test } from "vitest";
import { isCallScheduled } from "./calls-reschedule";

const rec = (s: unknown) => ({ id: "c1", fields: { Outgoing_Call_Status: s as string } });

test("Scheduled and Overdue are scheduled", () => {
  expect(isCallScheduled(rec("Scheduled"))).toBe(true);
  expect(isCallScheduled(rec("Overdue"))).toBe(true);
});

test("Completed and empty are not scheduled", () => {
  expect(isCallScheduled(rec("Completed"))).toBe(false);
  expect(isCallScheduled(rec(null))).toBe(false);
  expect(isCallScheduled({ id: "c1", fields: {} })).toBe(false);
});
