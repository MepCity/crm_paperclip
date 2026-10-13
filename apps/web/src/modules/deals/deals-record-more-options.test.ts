import { expect, test } from "vitest";
import {
  buildDealsRecordMoreMenuGroups,
  DEALS_RECORD_MORE_OPTIONS_GROUPS,
} from "./deals-record-more-options";

test("exposes fifteen More Options rows in three groups", () => {
  const rows = DEALS_RECORD_MORE_OPTIONS_GROUPS.flatMap((group) => group.items);
  expect(rows).toHaveLength(15);
  expect(rows.map((row) => row.label)).toEqual([
    "Clone",
    "Share",
    "Delete",
    "Print Preview",
    "Find and Merge Duplicates",
    "Mail Merge",
    "Run Macro",
    "Customize Business Card",
    "Organize Deal Details",
    "Add Related List",
    "Review History",
    "Enroll to Cadence",
    "Add Kiosk",
    "Create Button",
    "Create Client Script",
  ]);
});

test("wires clone and delete handlers", () => {
  const onClone = () => {};
  const onDelete = () => {};
  const groups = buildDealsRecordMoreMenuGroups({ onClone, onDelete });
  const clone = groups.flatMap((g) => g.items).find((item) => item.id === "clone");
  const deleteItem = groups.flatMap((g) => g.items).find((item) => item.id === "delete");
  expect(clone?.onAction).toBe(onClone);
  expect(deleteItem?.onAction).toBe(onDelete);
});
