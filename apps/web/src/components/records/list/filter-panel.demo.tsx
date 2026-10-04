"use client";

import { useState } from "react";
import { type FilterGroup, FilterPanel } from "./filter-panel";

const groups: FilterGroup[] = [
  {
    id: "system",
    label: "System Defined Filters",
    items: [
      { id: "recent", label: "Recent samples" },
      { id: "archived", label: "Archived samples", disabled: true },
    ],
  },
  {
    id: "fields",
    label: "Filter By Fields",
    items: [
      { id: "sample-title", label: "Sample title" },
      { id: "sample-code", label: "Sample code" },
    ],
  },
  {
    id: "related",
    label: "Filter By Related Modules",
    items: [{ id: "sample-links", label: "Sample links" }],
  },
];

export default function FilterPanelDemo() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">
        Toggle headings for closed groups; search “code” for one result. Archived samples is
        disabled.
      </p>
      <FilterPanel
        title="Filter Leads by"
        searchLabel="Search filter choices"
        searchPlaceholder="Search"
        groups={groups}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
      <p role="status" className="text-sm text-text">
        Selected: {selectedIds.join(", ") || "None"}
      </p>
    </div>
  );
}
