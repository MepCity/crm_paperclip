import { expect, test } from "vitest";
import {
  buildCallsRecordMoreMenuGroups,
  CALLS_DELETE_CONFIRM_MESSAGE,
  CALLS_DELETE_CONFIRM_TITLE,
  CALLS_RECORD_MORE_OPTIONS_GROUPS,
} from "./calls-record-more-options";

const rows = () => CALLS_RECORD_MORE_OPTIONS_GROUPS.flatMap((g) => g.items);

test("exposes five rows in two groups with expected order", () => {
  expect(rows().map((r) => r.label)).toEqual([
    "Edit",
    "Share",
    "Delete",
    "Print Preview",
    "Send Email",
  ]);
  expect(CALLS_RECORD_MORE_OPTIONS_GROUPS).toHaveLength(2);
  expect(CALLS_RECORD_MORE_OPTIONS_GROUPS[0]?.items.map((i) => i.label)).toEqual([
    "Edit",
    "Share",
    "Delete",
  ]);
  expect(CALLS_RECORD_MORE_OPTIONS_GROUPS[1]?.items.map((i) => i.label)).toEqual([
    "Print Preview",
    "Send Email",
  ]);
});

test("Send Email is the only M10 row", () => {
  expect(
    rows()
      .filter((r) => r.laterModule === "M10")
      .map((r) => r.id),
  ).toEqual(["send-email"]);
});

test("omits Clone and customization rows", () => {
  const labels = rows().map((r) => r.label);
  for (const label of [
    "Clone",
    "Customize Business Card",
    "Organize Task Details",
    "Create Button",
  ]) {
    expect(labels).not.toContain(label);
  }
});

test("defines delete confirmation texts", () => {
  expect(CALLS_DELETE_CONFIRM_TITLE).toBe("Delete Call");
  expect(CALLS_DELETE_CONFIRM_MESSAGE).toBe("Are you sure you want to delete this Call?");
});

test("wires edit and delete handlers only", () => {
  const onEdit = () => {};
  const onDelete = () => {};
  const items = buildCallsRecordMoreMenuGroups({ onEdit, onDelete }).flatMap((g) => g.items);
  expect(items.find((i) => i.id === "edit")?.onAction).toBe(onEdit);
  expect(items.find((i) => i.id === "delete")?.onAction).toBe(onDelete);
  for (const item of items.filter((i) => i.id !== "edit" && i.id !== "delete")) {
    expect(item.onAction).toBeUndefined();
  }
});
