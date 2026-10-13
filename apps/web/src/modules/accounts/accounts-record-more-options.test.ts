import { expect, test } from "vitest";
import {
  ACCOUNTS_DELETE_CONFIRM_MESSAGE,
  ACCOUNTS_DELETE_CONFIRM_TITLE,
  ACCOUNTS_RECORD_MORE_OPTIONS_GROUPS,
  buildAccountsRecordMoreMenuGroups,
} from "./accounts-record-more-options";

test("Accounts More Options menu inventory", () => {
  const labels = ACCOUNTS_RECORD_MORE_OPTIONS_GROUPS.flatMap((group) =>
    group.items.map((item) => item.label),
  );
  expect(labels).toEqual([
    "Clone",
    "Share",
    "Delete",
    "Print Preview",
    "Find and Merge Duplicates",
    "Mail Merge",
    "Customize Business Card",
    "Organize Account Details",
    "Add Related List",
    "Review History",
    "Add Kiosk",
    "Create Button",
    "Create Client Script",
  ]);
  expect(labels).not.toContain("Run Macro");
  expect(labels).not.toContain("Enroll to Cadence");
});

test("buildAccountsRecordMoreMenuGroups wires clone and delete", () => {
  const onClone = () => {};
  const onDelete = () => {};
  const groups = buildAccountsRecordMoreMenuGroups({ onClone, onDelete });
  const clone = groups.flatMap((g) => g.items).find((item) => item.id === "clone");
  const del = groups.flatMap((g) => g.items).find((item) => item.id === "delete");
  expect(clone?.onAction).toBe(onClone);
  expect(del?.onAction).toBe(onDelete);
  expect(ACCOUNTS_DELETE_CONFIRM_TITLE).toBe("Delete Account");
  expect(ACCOUNTS_DELETE_CONFIRM_MESSAGE).toContain("Account");
});
