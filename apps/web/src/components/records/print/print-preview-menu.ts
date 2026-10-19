import type { RecordMenuGroup } from "@/components/records/detail/record-header";

/**
 * Turns the inert "Print Preview" More Options row into a live one when the module supplies a
 * handler (Module 6 print page); without a handler the row keeps its later-module marker.
 */
export function withPrintPreviewAction(
  groups: RecordMenuGroup[],
  onPrintPreview: (() => void) | undefined,
): RecordMenuGroup[] {
  if (!onPrintPreview) return groups;
  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.id !== "print-preview") return item;
      const { laterModule: _later, ...rest } = item;
      return { ...rest, onAction: onPrintPreview };
    }),
  }));
}
