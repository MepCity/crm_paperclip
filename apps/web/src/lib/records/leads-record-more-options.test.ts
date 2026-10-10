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
    const deleteItem = LEADS_RECORD_MORE_OPTIONS_SPEC_GROUPS[0]?.items.find(
      (item) => item.id === "delete",
    );
    expect(deleteItem?.handlerKey).toBe("onDelete");
  });

  it("renders only handler-backed items and preserves spec group boundaries", () => {
    const onDelete = vi.fn();
    const groups = buildLeadsRecordMoreMenuGroups({ onDelete });
    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe("leads-more-primary");
    expect(groups[0]?.items).toEqual([{ id: "delete", label: "Delete", onAction: onDelete }]);
  });

  it("lists every unimplemented label in deviations with a parity module", () => {
    const implemented = new Set(["Delete"]);
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
