import { expect, test } from "vitest";
import {
  buildTasksRecordMoreMenuGroups,
  TASKS_DELETE_CONFIRM_MESSAGE,
  TASKS_DELETE_CONFIRM_TITLE,
  TASKS_RECORD_MORE_OPTIONS_GROUPS,
} from "./tasks-record-more-options";

test("exposes seven More Options rows in three groups with expected order and labels", () => {
  const rows = TASKS_RECORD_MORE_OPTIONS_GROUPS.flatMap((group) => group.items);
  expect(rows).toHaveLength(7);
  expect(rows.map((row) => row.label)).toEqual([
    "Clone",
    "Share",
    "Delete",
    "Print Preview",
    "Customize Business Card",
    "Organize Task Details",
    "Create Button",
  ]);

  expect(TASKS_RECORD_MORE_OPTIONS_GROUPS).toHaveLength(3);
  expect(TASKS_RECORD_MORE_OPTIONS_GROUPS[0]?.items.map((i) => i.label)).toEqual([
    "Clone",
    "Share",
    "Delete",
  ]);
  expect(TASKS_RECORD_MORE_OPTIONS_GROUPS[1]?.items.map((i) => i.label)).toEqual(["Print Preview"]);
  expect(TASKS_RECORD_MORE_OPTIONS_GROUPS[2]?.items.map((i) => i.label)).toEqual([
    "Customize Business Card",
    "Organize Task Details",
    "Create Button",
  ]);
});

test("marks customization rows as laterModule M11 and print preview as M6", () => {
  const rows = TASKS_RECORD_MORE_OPTIONS_GROUPS.flatMap((group) => group.items);
  expect(rows.find((r) => r.id === "customize-business-card")?.laterModule).toBe("M11");
  expect(rows.find((r) => r.id === "organize-task-details")?.laterModule).toBe("M11");
  expect(rows.find((r) => r.id === "create-button")?.laterModule).toBe("M11");
  expect(rows.find((r) => r.id === "share")?.laterModule).toBe("M11");
  expect(rows.find((r) => r.id === "print-preview")?.laterModule).toBe("M6");
});

test("does not include absent rows from Accounts and Deals menus", () => {
  const allLabels = TASKS_RECORD_MORE_OPTIONS_GROUPS.flatMap((g) => g.items).map((i) => i.label);
  const absentLabels = [
    "Find and Merge Duplicates",
    "Mail Merge",
    "Add Related List",
    "Review History",
    "Add Kiosk",
    "Create Client Script",
  ];
  for (const label of absentLabels) {
    expect(allLabels).not.toContain(label);
  }
});

test("defines expected delete confirmation texts", () => {
  expect(TASKS_DELETE_CONFIRM_TITLE).toBe("Delete Task");
  expect(TASKS_DELETE_CONFIRM_MESSAGE).toBe("Are you sure you want to delete this Task?");
});

test("wires clone and delete handlers while leaving other rows without handlers", () => {
  const onClone = () => {};
  const onDelete = () => {};
  const groups = buildTasksRecordMoreMenuGroups({ onClone, onDelete });
  const allItems = groups.flatMap((g) => g.items);
  const clone = allItems.find((item) => item.id === "clone");
  const deleteItem = allItems.find((item) => item.id === "delete");

  expect(clone?.onAction).toBe(onClone);
  expect(deleteItem?.onAction).toBe(onDelete);

  const nonHandledItems = allItems.filter((i) => i.id !== "clone" && i.id !== "delete");
  for (const item of nonHandledItems) {
    expect(item.onAction).toBeUndefined();
  }
});
