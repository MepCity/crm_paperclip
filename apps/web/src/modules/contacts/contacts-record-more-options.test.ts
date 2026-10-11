import { expect, test, vi } from "vitest";
import {
  buildContactsRecordMoreMenuGroups,
  CONTACTS_DELETE_CONFIRM_MESSAGE,
  CONTACTS_DELETE_CONFIRM_TITLE,
} from "./contacts-record-more-options";

test("keeps all fifteen menu rows in the three observed groups and connects only clone/delete", () => {
  const handlers = { onClone: vi.fn(), onDelete: vi.fn() };
  const groups = buildContactsRecordMoreMenuGroups(handlers);
  expect(groups.map((group) => group.items.map((item) => item.label))).toEqual([
    ["Clone", "Share", "Delete"],
    ["Print Preview", "Find and Merge Duplicates", "Mail Merge"],
    [
      "Run Macro",
      "Customize Business Card",
      "Organize Contact Details",
      "Add Related List",
      "Review History",
      "Enroll to Cadence",
      "Add Kiosk",
      "Create Button",
      "Create Client Script",
    ],
  ]);
  const items = groups.flatMap((group) => group.items);
  items[0]?.onAction?.();
  items[2]?.onAction?.();
  expect(handlers.onClone).toHaveBeenCalledOnce();
  expect(handlers.onDelete).toHaveBeenCalledOnce();
  for (const index of [1, 3, 4]) {
    expect(items[index]?.laterModule).toBeUndefined();
    expect(items[index]?.isDisabled).toBeUndefined();
    expect(items[index]?.onAction).toBeUndefined();
  }
  expect(items.slice(5).map((item) => item.laterModule)).toEqual([
    "M9",
    "M12",
    "M11",
    "M11",
    "M11",
    "P3",
    "P3",
    "M11",
    "M11",
    "M11",
  ]);
  expect(items.slice(5).every((item) => item.onAction === undefined)).toBe(true);
  expect(CONTACTS_DELETE_CONFIRM_TITLE).toBe("Delete Contact");
  expect(CONTACTS_DELETE_CONFIRM_MESSAGE).toBe("Are you sure you want to delete this Contact?");
});
