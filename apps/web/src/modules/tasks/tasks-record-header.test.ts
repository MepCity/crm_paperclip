import type { RecordData } from "@crm/core/records";
import { expect, test } from "vitest";
import { Icons } from "@/components/ui/icon";
import { tasksRecordHeaderIdentity } from "./tasks-record-header";

function taskRecord(fields: RecordData["fields"] = {}): RecordData {
  return { id: "test-task-1", fields };
}

test("builds record header with Subject title, static task icon and default record navigation", () => {
  const result = tasksRecordHeaderIdentity(taskRecord({ Subject: "Call with Client" }));

  expect(result.title).toBe("Call with Client");
  expect(result.hasPortrait).toBe(false);
  expect(result.recordNavigation).toBe(true);
  expect(result.subtitle).toBeUndefined();
});

test("handles empty or missing Subject safely with empty string title", () => {
  expect(tasksRecordHeaderIdentity(taskRecord({}))).toEqual({
    title: "",
    hasPortrait: false,
    recordNavigation: true,
  });

  expect(tasksRecordHeaderIdentity(taskRecord({ Subject: null }))).toEqual({
    title: "",
    hasPortrait: false,
    recordNavigation: true,
  });

  expect(tasksRecordHeaderIdentity(taskRecord({ Subject: "" }))).toEqual({
    title: "",
    hasPortrait: false,
    recordNavigation: true,
  });
});
