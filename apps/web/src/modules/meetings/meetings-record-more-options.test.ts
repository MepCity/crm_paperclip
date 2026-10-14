import { expect, test } from "vitest";
import {
  buildMeetingsRecordMoreMenuGroups,
  MEETINGS_DELETE_CONFIRM_MESSAGE,
  MEETINGS_DELETE_CONFIRM_TITLE,
  MEETINGS_RECORD_MORE_OPTIONS_GROUPS,
} from "./meetings-record-more-options";

test("exposes six More Options rows in three groups with expected order and labels", () => {
  const rows = MEETINGS_RECORD_MORE_OPTIONS_GROUPS.flatMap((group) => group.items);
  expect(rows).toHaveLength(6);
  expect(rows.map((row) => row.label)).toEqual([
    "Clone",
    "Share",
    "Delete",
    "Print Preview",
    "Export Meeting",
    "Create Button",
  ]);

  expect(MEETINGS_RECORD_MORE_OPTIONS_GROUPS).toHaveLength(3);
  expect(MEETINGS_RECORD_MORE_OPTIONS_GROUPS[0]?.items.map((i) => i.label)).toEqual([
    "Clone",
    "Share",
    "Delete",
  ]);
  expect(MEETINGS_RECORD_MORE_OPTIONS_GROUPS[1]?.items.map((i) => i.label)).toEqual([
    "Print Preview",
    "Export Meeting",
  ]);
  expect(MEETINGS_RECORD_MORE_OPTIONS_GROUPS[2]?.items.map((i) => i.label)).toEqual([
    "Create Button",
  ]);
});

test("marks automation group as single laterModule M11 row and handles print preview / share", () => {
  const rows = MEETINGS_RECORD_MORE_OPTIONS_GROUPS.flatMap((group) => group.items);
  expect(rows.find((r) => r.id === "create-button")?.laterModule).toBe("M11");
  expect(rows.find((r) => r.id === "share")?.laterModule).toBe("M11");
  expect(rows.find((r) => r.id === "print-preview")?.laterModule).toBe("M6");
  expect(rows.find((r) => r.id === "export-meeting")?.laterModule).toBeUndefined();
  expect(MEETINGS_RECORD_MORE_OPTIONS_GROUPS[2]?.items).toHaveLength(1);
  expect(MEETINGS_RECORD_MORE_OPTIONS_GROUPS[2]?.items[0]?.laterModule).toBe("M11");
});

test("does not include absent customization rows from Tasks menu or Accounts/Deals rows", () => {
  const allLabels = MEETINGS_RECORD_MORE_OPTIONS_GROUPS.flatMap((g) => g.items).map((i) => i.label);
  const absentLabels = [
    "Customize Business Card",
    "Organize Task Details",
    "Organize Meeting Details",
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
  expect(MEETINGS_DELETE_CONFIRM_TITLE).toBe("Delete Meeting");
  expect(MEETINGS_DELETE_CONFIRM_MESSAGE).toBe("Are you sure you want to delete this Meeting?");
});

test("wires clone and delete handlers while leaving other rows without handlers", () => {
  const onClone = () => {};
  const onDelete = () => {};
  const groups = buildMeetingsRecordMoreMenuGroups({ onClone, onDelete });
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
