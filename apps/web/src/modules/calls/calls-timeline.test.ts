import { expect, test } from "vitest";
import {
  TASKS_TIMELINE_MODULE_OPTIONS,
  TASKS_TIMELINE_SOURCE_OPTIONS,
} from "../tasks/tasks-timeline";
import {
  CALLS_TIMELINE_MODULE_OPTIONS,
  CALLS_TIMELINE_SOURCE_OPTIONS,
  CALLS_TIMELINE_SUBTABS,
  normalizeCallsEventKind,
} from "./calls-timeline";

test("uses History-only timeline subtabs with empty events", () => {
  expect(CALLS_TIMELINE_SUBTABS).toEqual([{ id: "history", label: "History" }]);
});

test("uses the Tasks option sets, including a Calls module option", () => {
  expect(CALLS_TIMELINE_MODULE_OPTIONS).toBe(TASKS_TIMELINE_MODULE_OPTIONS);
  expect(CALLS_TIMELINE_SOURCE_OPTIONS).toBe(TASKS_TIMELINE_SOURCE_OPTIONS);
  expect(CALLS_TIMELINE_SOURCE_OPTIONS.length).toBeGreaterThan(0);
  expect(CALLS_TIMELINE_MODULE_OPTIONS.some((opt) => opt.id === "calls")).toBe(true);
});

test("normalizes event kinds returning input kind", () => {
  expect(normalizeCallsEventKind("call_logged")).toBe("call_logged");
});
