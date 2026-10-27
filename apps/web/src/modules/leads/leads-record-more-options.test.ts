import { describe, expect, it, vi } from "vitest";
import {
  buildLeadsRecordMoreMenuGroups,
  LEADS_RECORD_MORE_OPTIONS_DEVIATIONS,
  LEADS_RECORD_MORE_OPTIONS_SPEC_GROUPS,
} from "./leads-record-more-options";

describe("leads-record-more-options", () => {
  it("keeps the full spec inventory in three groups with Delete in the first group", () => {
    expect(LEADS_RECORD_MORE_OPTIONS_SPEC_GROUPS).toHaveLength(3);
    const labels = LEADS_RECORD_MORE_OPTIONS_SPEC_GROUPS.flatMap((group) =>
      group.items.map((item) => item.label),
    );
    expect(labels).toEqual([
      "Clone",
      "Share",
      "Delete",
      "Print Preview",
      "Find and Merge Duplicates",
      "Mail Merge",
      "Run Macro",
      "Customize Business Card",
      "Organize Lead Details",
      "Add Related List",
      "Review History",
      "Enroll to Cadence",
      "Add Kiosk",
      "Create Button",
      "Create Client Script",
    ]);
    const cloneItem = LEADS_RECORD_MORE_OPTIONS_SPEC_GROUPS[0]?.items.find(
      (item) => item.id === "clone",
    );
    const deleteItem = LEADS_RECORD_MORE_OPTIONS_SPEC_GROUPS[0]?.items.find(
      (item) => item.id === "delete",
    );
    expect(cloneItem?.handlerKey).toBe("onClone");
    expect(deleteItem?.handlerKey).toBe("onDelete");
  });

  it("renders the full inventory with inert feature boundaries and working record handlers", () => {
    const onClone = vi.fn();
    const onDelete = vi.fn();
    const onFindMergeDuplicates = vi.fn();
    const groups = buildLeadsRecordMoreMenuGroups({
      onClone,
      onDelete,
      onFindMergeDuplicates,
    });
    expect(groups).toHaveLength(3);
    expect(groups[0]?.items).toEqual([
      { id: "clone", label: "Clone", onAction: onClone },
      { id: "share", label: "Share", laterModule: "M11" },
      { id: "delete", label: "Delete", onAction: onDelete },
    ]);
    expect(groups[1]?.items).toEqual([
      { id: "print-preview", label: "Print Preview", laterModule: "M6" },
      {
        id: "find-merge-duplicates",
        label: "Find and Merge Duplicates",
        onAction: onFindMergeDuplicates,
      },
      { id: "mail-merge", label: "Mail Merge", laterModule: "M10" },
    ]);
    expect(groups[2]?.items).toHaveLength(9);
    for (const item of groups[2]?.items ?? []) {
      expect(item.laterModule).toBeTruthy();
      expect(item.onAction).toBeUndefined();
    }
  });

  it("omits Find and Merge Duplicates when onFindMergeDuplicates is not provided", () => {
    const onClone = vi.fn();
    const onDelete = vi.fn();
    const groups = buildLeadsRecordMoreMenuGroups({
      onClone,
      onDelete,
    });
    const labels = groups.flatMap((group) => group.items.map((item) => item.label));
    expect(labels).not.toContain("Find and Merge Duplicates");
  });

  it("lists every unimplemented label in deviations with a parity module", () => {
    const implemented = new Set(["Clone", "Delete", "Find and Merge Duplicates"]);
    const specLabels = LEADS_RECORD_MORE_OPTIONS_SPEC_GROUPS.flatMap((group) =>
      group.items.map((item) => item.label),
    );
    const deviationLabels = LEADS_RECORD_MORE_OPTIONS_DEVIATIONS.map((row) => row.label);
    expect(deviationLabels).toEqual(specLabels.filter((label) => !implemented.has(label)));
    for (const row of LEADS_RECORD_MORE_OPTIONS_DEVIATIONS) {
      expect(row.parityModule.length).toBeGreaterThan(0);
    }
  });
});
