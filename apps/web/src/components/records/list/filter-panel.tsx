"use client";

import { useId, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Disclosure } from "@/components/ui/disclosure";
import { TextField } from "@/components/ui/text-field";

export interface FilterGroup {
  id: string;
  label: string;
  items: { id: string; label: string; disabled?: boolean }[];
}

export interface FilterPanelProps {
  title: string;
  searchLabel: string;
  searchPlaceholder: string;
  groups: readonly FilterGroup[];
  selectedIds: readonly string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function FilterPanel({
  title,
  searchLabel,
  searchPlaceholder,
  groups,
  selectedIds,
  onSelectionChange,
}: FilterPanelProps) {
  const titleId = useId();
  const [query, setQuery] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(new Set());
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <section
      aria-labelledby={titleId}
      className="box-border w-(--size-list-filter-width) shrink-0 rounded-md border border-panel-border bg-surface px-(--size-list-filter-padding) py-4"
    >
      <h2 id={titleId} className="mb-3 text-md font-semibold text-text">
        {title}
      </h2>
      <TextField
        label={searchLabel}
        placeholder={searchPlaceholder}
        variant="filter-search"
        value={query}
        onChange={setQuery}
      />
      <div className="mt-3">
        {visibleGroups.map((group) => (
          <Disclosure
            key={group.id}
            label={group.label}
            isExpanded={!collapsedIds.has(group.id)}
            onExpandedChange={(expanded) => {
              setCollapsedIds((current) => {
                const next = new Set(current);
                if (expanded) next.delete(group.id);
                else next.add(group.id);
                return next;
              });
            }}
          >
            <ul>
              {group.items.map((item) => (
                <li key={item.id} className="flex h-(--size-list-filter-row-height) items-center">
                  <Checkbox
                    label={item.label}
                    isDisabled={item.disabled}
                    isSelected={selectedIds.includes(item.id)}
                    onChange={(selected) => {
                      onSelectionChange(
                        selected
                          ? [...selectedIds, item.id]
                          : selectedIds.filter((id) => id !== item.id),
                      );
                    }}
                  />
                </li>
              ))}
            </ul>
          </Disclosure>
        ))}
      </div>
    </section>
  );
}
