"use client";
import { useState } from "react";
import type { AppliedFilter, FilterFieldType } from "@/lib/records/filter-operators";
import { type FilterGroup, FilterPanel } from "./filter-panel";

const fieldTypes: FilterFieldType[] = [
  "text",
  "email",
  "phone",
  "picklist",
  "currency",
  "boolean",
  "ownerlookup",
  "datetime",
  "website",
  "integer",
];
const groups: FilterGroup[] = [
  {
    id: "fields",
    label: "Filter By Fields",
    items: fieldTypes.map((fieldType) => ({
      id: fieldType,
      label: `Sample ${fieldType}`,
      editor: {
        fieldType,
        currencyCode: fieldType === "currency" ? "TL" : undefined,
        options:
          fieldType === "picklist"
            ? [
                { id: "one", label: "Sample One" },
                { id: "two", label: "Sample Two" },
                ...Array.from({ length: 14 }, (_, index) => ({
                  id: `choice-${index}`,
                  label: `Choice ${index + 1}`,
                })),
              ]
            : [
                { id: "one", label: "Sample One", detail: "one@example.test", currentUser: true },
                { id: "two", label: "Sample Two", detail: "two@example.test" },
              ],
      },
    })),
  },
];
export default function FilterEditorsDemo() {
  const [selectedIds, setSelectedIds] = useState<string[]>(fieldTypes);
  const [applied, setApplied] = useState<AppliedFilter[]>([]);
  return (
    <div className="space-y-3">
      <p className="text-sm text-text-muted">
        All supported editors start checked. Open an operator list; complete values to enable Apply
        Filter. Clear and select two rows to exercise multiple drafts.
      </p>
      <div className="flex h-96">
        <FilterPanel
          title="Field filter editors"
          searchLabel="Search field filter choices"
          searchPlaceholder="Search"
          groups={groups}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onApply={setApplied}
          onClear={() => setApplied([])}
        />
      </div>
      <p role="status" className="text-sm text-text">
        Applied filters: {JSON.stringify(applied)}
      </p>
    </div>
  );
}
