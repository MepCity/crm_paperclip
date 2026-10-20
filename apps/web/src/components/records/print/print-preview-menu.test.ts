import { expect, test, vi } from "vitest";
import { PRINT_LIST_MODULES, supportsListPrint, supportsRecordPrint } from "./print-modules";
import { withPrintPreviewAction } from "./print-preview-menu";

const groups = [
  {
    id: "g",
    items: [
      { id: "print-preview", label: "Print Preview", laterModule: "M6" as const },
      { id: "mail-merge", label: "Mail Merge", laterModule: "M9" as const },
    ],
  },
];

test("without a handler the row keeps its later-module marker", () => {
  expect(withPrintPreviewAction(groups, undefined)).toBe(groups);
});

test("with a handler only Print Preview becomes live", () => {
  const onPrint = vi.fn();
  const [group] = withPrintPreviewAction(groups, onPrint);
  const [preview, merge] = group?.items ?? [];
  expect(preview?.laterModule).toBeUndefined();
  preview?.onAction?.();
  expect(onPrint).toHaveBeenCalledOnce();
  expect(merge?.laterModule).toBe("M9");
});

test("module support matches the board decision", () => {
  expect(supportsRecordPrint("Deals")).toBe(true);
  expect(supportsRecordPrint("Tasks")).toBe(false);
  expect(supportsListPrint("Deals")).toBe(false);
  expect(PRINT_LIST_MODULES).toEqual(["Leads", "Contacts", "Accounts"]);
});
