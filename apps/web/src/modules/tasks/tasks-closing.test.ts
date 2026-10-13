import type { RecordData } from "@crm/core/records";
import { expect, test } from "vitest";
import {
  closeTaskPatch,
  isCloseTaskButtonVisible,
  isTaskOpen,
  TASK_COMPLETED_STATUS,
} from "./tasks-closing";

function taskRecord(fields: RecordData["fields"] = {}): RecordData {
  return { id: "test-task-1", fields };
}

test("TASK_COMPLETED_STATUS constant is 'Completed'", () => {
  expect(TASK_COMPLETED_STATUS).toBe("Completed");
});

test("isTaskOpen returns true for non-completed status values", () => {
  expect(isTaskOpen(taskRecord({ Status: "In Progress" }))).toBe(true);
  expect(isTaskOpen(taskRecord({ Status: "Not Started" }))).toBe(true);
  expect(isTaskOpen(taskRecord({ Status: "Deferred" }))).toBe(true);
  expect(isTaskOpen(taskRecord({ Status: "Waiting on someone else" }))).toBe(true);
});

test("isTaskOpen returns false when Status is 'Completed'", () => {
  expect(isTaskOpen(taskRecord({ Status: "Completed" }))).toBe(false);
  expect(isTaskOpen(taskRecord({ Status: TASK_COMPLETED_STATUS }))).toBe(false);
});

test("isTaskOpen treats empty, null, or omitted Status as open", () => {
  expect(isTaskOpen(taskRecord({}))).toBe(true);
  expect(isTaskOpen(taskRecord({ Status: null }))).toBe(true);
  expect(isTaskOpen(taskRecord({ Status: "" }))).toBe(true);
});

test("closeTaskPatch returns { Status: 'Completed' } and no other fields", () => {
  const patch = closeTaskPatch();
  expect(patch).toEqual({ Status: "Completed" });
  expect(Object.keys(patch)).toEqual(["Status"]);
});

test("Close Task button visibility (TD-05) matches isTaskOpen", () => {
  // Open task: button visible
  expect(isCloseTaskButtonVisible(taskRecord({ Status: "In Progress" }))).toBe(true);
  expect(isCloseTaskButtonVisible(taskRecord({}))).toBe(true);

  // Closed task: button hidden
  expect(isCloseTaskButtonVisible(taskRecord({ Status: "Completed" }))).toBe(false);
});
