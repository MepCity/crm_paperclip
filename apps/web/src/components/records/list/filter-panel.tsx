"use client";

import "./filter-panel.css";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Disclosure } from "@/components/ui/disclosure";
import { TextField } from "@/components/ui/text-field";
import type { AppliedFilter } from "@/lib/records/filter-operators";
import {
  draftOperator,
  type FilterDraft,
  FilterEditor,
  type FilterEditorDefinition,
  initialFilterDraft,
  isFilterComplete,
} from "./filter-editor";

export interface FilterGroup {
  id: string;
  label: string;
  items: { id: string; label: string; disabled?: boolean; editor?: FilterEditorDefinition }[];
}

export interface FilterPanelProps {
  title: string;
  searchLabel: string;
  searchPlaceholder: string;
  groups: readonly FilterGroup[];
  selectedIds: readonly string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onApply?: (filters: AppliedFilter[]) => void;
  onClear?: () => void;
  /** Shown above the footer actions when a server-side filter validation fails. */
  applyErrorMessage?: string | null;
}

export function FilterPanel({
  title,
  searchLabel,
  searchPlaceholder,
  groups,
  selectedIds,
  onSelectionChange,
  onApply,
  onClear,
  applyErrorMessage,
}: FilterPanelProps) {
  const titleId = useId();
  const [drafts, setDrafts] = useState<Record<string, FilterDraft>>({});
  // External deselection (including page-level reset) must discard drafts too.
  useEffect(() => {
    setDrafts((current) => {
      const entries = Object.entries(current).filter(([id]) => selectedIds.includes(id));
      return entries.length === Object.keys(current).length ? current : Object.fromEntries(entries);
    });
  }, [selectedIds]);
  const selectedItems = groups
    .flatMap((group) => group.items)
    .filter((item) => selectedIds.includes(item.id) && item.editor);
  const completed = selectedItems.every(
    (item) =>
      item.editor &&
      isFilterComplete(item.editor, drafts[item.id] ?? initialFilterDraft(item.editor)),
  );
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
      className="filter-panel box-border w-(--size-list-filter-width) shrink-0 rounded-md border border-panel-border bg-surface pl-(--size-list-filter-padding) pr-(--size-list-filter-search-end-inset)"
    >
      <h2
        id={titleId}
        className="m-0 pt-(--size-list-filter-title-inset-top) mb-(--size-list-filter-heading-to-search) text-md font-bold text-text"
      >
        <span className="block leading-(--size-list-filter-title-line)">{title}</span>
      </h2>
      <TextField
        label={searchLabel}
        placeholder={searchPlaceholder}
        variant="filter-search"
        value={query}
        onChange={setQuery}
      />
      <div className="filter-panel-content mt-(--size-list-filter-search-to-group)">
        {visibleGroups.map((group, index) => (
          <div
            key={group.id}
            className={index === 0 ? undefined : "mt-(--size-list-filter-group-gap)"}
          >
            <Disclosure
              variant="filter"
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
              <ul className="min-w-0 pt-(--size-list-filter-group-to-row)">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col min-h-(--size-list-filter-row-height) w-full min-w-0 items-start py-(--size-list-filter-row-padding)"
                  >
                    <Checkbox
                      align="first-line"
                      variant="filter"
                      label={item.label}
                      isDisabled={item.disabled}
                      isSelected={selectedIds.includes(item.id)}
                      onChange={(selected) => {
                        setDrafts((current) => {
                          const next = { ...current };
                          if (selected && item.editor)
                            next[item.id] = initialFilterDraft(item.editor);
                          else delete next[item.id];
                          return next;
                        });
                        onSelectionChange(
                          selected
                            ? [...selectedIds, item.id]
                            : selectedIds.filter((id) => id !== item.id),
                        );
                      }}
                    />
                    {selectedIds.includes(item.id) && item.editor && (
                      <FilterEditor
                        label={item.label}
                        editor={item.editor}
                        draft={drafts[item.id] ?? initialFilterDraft(item.editor)}
                        onChange={(draft) =>
                          setDrafts((current) => ({ ...current, [item.id]: draft }))
                        }
                      />
                    )}
                  </li>
                ))}
              </ul>
            </Disclosure>
          </div>
        ))}
      </div>
      {selectedItems.length > 0 && (
        <div className="filter-panel-actions flex flex-col gap-2 py-3">
          {applyErrorMessage ? (
            <p className="m-0 text-sm text-danger" role="alert">
              {applyErrorMessage}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            {onApply && (
              <Button
                size="sm"
                isDisabled={!completed}
                onPress={() => {
                  if (!completed) return;
                  onApply(
                    selectedItems.flatMap((item) => {
                      if (!item.editor) return [];
                      const draft = drafts[item.id] ?? initialFilterDraft(item.editor);
                      return [
                        {
                          itemId: item.id,
                          operatorId: draft.operatorId,
                          value:
                            draftOperator(item.editor, draft)?.control === "none"
                              ? null
                              : typeof draft.value === "string"
                                ? draft.value.trim()
                                : draft.value,
                        },
                      ];
                    }),
                  );
                }}
              >
                Apply Filter
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                setDrafts({});
                onSelectionChange([]);
                onClear?.();
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
