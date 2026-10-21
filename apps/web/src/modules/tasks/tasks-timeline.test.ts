import { expect, test } from "vitest";
import {
  DEALS_TIMELINE_MODULE_OPTIONS,
  DEALS_TIMELINE_SOURCE_OPTIONS,
} from "../deals/deals-timeline";
import {
  normalizeTasksEventKind,
  TASKS_TIMELINE_MODULE_OPTIONS,
  TASKS_TIMELINE_SOURCE_OPTIONS,
  TASKS_TIMELINE_SUBTABS,
} from "./tasks-timeline";

test("uses History-only timeline subtabs and no Interactions tab", () => {
  expect(TASKS_TIMELINE_SUBTABS).toEqual([{ id: "history", label: "History" }]);
  expect(TASKS_TIMELINE_SUBTABS.some((tab) => tab.id === "interactions")).toBe(false);
});

test("uses filter option sets matching Deals with non-empty choices", () => {
  expect(TASKS_TIMELINE_MODULE_OPTIONS).toBe(DEALS_TIMELINE_MODULE_OPTIONS);
  expect(TASKS_TIMELINE_SOURCE_OPTIONS).toBe(DEALS_TIMELINE_SOURCE_OPTIONS);
  expect(TASKS_TIMELINE_MODULE_OPTIONS.length).toBeGreaterThan(0);
  expect(TASKS_TIMELINE_SOURCE_OPTIONS.length).toBeGreaterThan(0);
  expect(TASKS_TIMELINE_MODULE_OPTIONS.some((opt) => opt.id === "tasks")).toBe(true);
});

test("normalizes event kinds returning input kind", () => {
  expect(normalizeTasksEventKind("task_created")).toBe("task_created");
  expect(normalizeTasksEventKind("status_changed")).toBe("status_changed");
});
