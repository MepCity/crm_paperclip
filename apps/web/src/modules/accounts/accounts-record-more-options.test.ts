import { expect, test, vi } from "vitest";
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

test("Share and Print Preview use shared later-module keys", () => {
  const groups = buildAccountsRecordMoreMenuGroups({ onClone: () => {}, onDelete: () => {} });
  const items = groups.flatMap((group) => group.items);
  expect(items.find((item) => item.id === "share")?.laterModule).toBe("M11");
  expect(items.find((item) => item.id === "print-preview")?.laterModule).toBe("M6");
});

test("buildAccountsRecordMoreMenuGroups wires clone, delete, and find merge duplicates", () => {
  const onClone = vi.fn();
  const onDelete = vi.fn();
  const onFindMergeDuplicates = vi.fn();
  const groups = buildAccountsRecordMoreMenuGroups({ onClone, onDelete, onFindMergeDuplicates });
  const clone = groups.flatMap((g) => g.items).find((item) => item.id === "clone");
  const del = groups.flatMap((g) => g.items).find((item) => item.id === "delete");
  const merge = groups.flatMap((g) => g.items).find((item) => item.id === "find-merge-duplicates");
  expect(clone?.onAction).toBe(onClone);
  expect(del?.onAction).toBe(onDelete);
  expect(merge?.onAction).toBe(onFindMergeDuplicates);
  clone?.onAction?.();
  del?.onAction?.();
  merge?.onAction?.();
  expect(onClone).toHaveBeenCalledOnce();
  expect(onDelete).toHaveBeenCalledOnce();
  expect(onFindMergeDuplicates).toHaveBeenCalledOnce();
  expect(ACCOUNTS_DELETE_CONFIRM_TITLE).toBe("Delete Account");
  expect(ACCOUNTS_DELETE_CONFIRM_MESSAGE).toContain("Account");
});

test("omits Find and Merge Duplicates when onFindMergeDuplicates is not provided", () => {
  const onClone = vi.fn();
  const onDelete = vi.fn();
  const groups = buildAccountsRecordMoreMenuGroups({ onClone, onDelete });
  const labels = groups.flatMap((group) => group.items.map((item) => item.label));
  expect(labels).not.toContain("Find and Merge Duplicates");
  expect(groups.flatMap((g) => g.items)).toHaveLength(12);
});
