"use client";

import "./filter-panel.css";

import type { ActivityFilterValue, CampaignFilterValue } from "@crm/core/records";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Disclosure } from "@/components/ui/disclosure";
import type { ModuleKey } from "@/components/ui/later-module";
import type { MultiSelectOption } from "@/components/ui/multi-select";
import { TextField } from "@/components/ui/text-field";
import { activityFilterToCriteria } from "@/lib/records/filter-criteria";
import type { AppliedFilter } from "@/lib/records/filter-operators";
import { useModuleTags } from "@/lib/records/tags";
import { ActivityFilterEditor } from "./activity-filter-editor";
import { CampaignFilterEditor } from "./campaign-filter-editor";
import {
  draftOperator,
  type FilterDraft,
  FilterEditor,
  type FilterEditorDefinition,
  initialFilterDraft,
  isFilterComplete,
} from "./filter-editor";

export interface FilterItem {
  id: string;
  label: string;
  disabled?: boolean;
  editor?: FilterEditorDefinition;
  systemEditor?: "activities" | "campaigns";
  laterModule?: ModuleKey;
}

export interface FilterGroup {
  id: string;
  label: string;
  items: FilterItem[];
}

export interface FilterPanelProps {
  title: string;
  searchLabel: string;
  searchPlaceholder: string;
  groups: readonly FilterGroup[];
  selectedIds: readonly string[];
  onSelectionChange: (selectedIds: string[]) => void;
  /** Applied values used to seed editors when the panel mounts. */
  initialFilters?: readonly AppliedFilter[];
  initialActivityFilter?: ActivityFilterValue | null;
  initialCampaignFilter?: CampaignFilterValue | null;
  campaignOptions?: readonly MultiSelectOption[];
  onApply?: (
    filters: AppliedFilter[],
    activityFilter?: ActivityFilterValue | null,
    campaignFilter?: CampaignFilterValue | null,
  ) => void;
  onClear?: () => void;
  /** Shown above the footer actions when a server-side filter validation fails. */
  applyErrorMessage?: string | null;
}

const DEFAULT_ACTIVITY_FILTER: ActivityFilterValue = {
  choice: "activity_due",
  range: "today_overdue",
};

const DEFAULT_CAMPAIGN_FILTER: CampaignFilterValue = {
  campaignIds: [],
  memberStatuses: undefined,
};

export function FilterPanel({
  title,
  searchLabel,
  searchPlaceholder,
  groups,
  selectedIds,
  onSelectionChange,
  initialFilters = [],
  initialActivityFilter = null,
  initialCampaignFilter = null,
  campaignOptions,
  onApply,
  onClear,
  applyErrorMessage,
}: FilterPanelProps) {
  const tagModule = groups
    .flatMap((group) => group.items)
    .find((item) => selectedIds.includes(item.id) && item.editor?.tagModule)?.editor?.tagModule;
  const tags = useModuleTags(tagModule);
  const resolvedGroups = groups.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item.editor?.tagModule
        ? {
            ...item,
            editor: {
              ...item.editor,
              tagStatus: tags.status,
              options: tags.tags.map((tag) => ({ id: tag.id, label: tag.name, color: tag.color })),
            },
          }
        : item,
    ),
  }));
  const titleId = useId();
  const [drafts, setDrafts] = useState<Record<string, FilterDraft>>(() =>
    Object.fromEntries(initialFilters.map(({ itemId, ...draft }) => [itemId, draft])),
  );
  const [activityDraft, setActivityDraft] = useState<ActivityFilterValue>(
    () => initialActivityFilter ?? DEFAULT_ACTIVITY_FILTER,
  );
  const [campaignDraft, setCampaignDraft] = useState<CampaignFilterValue>(
    () => initialCampaignFilter ?? DEFAULT_CAMPAIGN_FILTER,
  );

  useEffect(() => {
    setActivityDraft(initialActivityFilter ?? DEFAULT_ACTIVITY_FILTER);
  }, [initialActivityFilter]);

  useEffect(() => {
    setCampaignDraft(initialCampaignFilter ?? DEFAULT_CAMPAIGN_FILTER);
  }, [initialCampaignFilter]);

  // External deselection (including page-level reset) must discard drafts too.
  useEffect(() => {
    setDrafts((current) => {
      const entries = Object.entries(current).filter(([id]) => selectedIds.includes(id));
      return entries.length === Object.keys(current).length ? current : Object.fromEntries(entries);
    });
  }, [selectedIds]);

  const isActivityItem = (item: FilterItem) =>
    item.systemEditor === "activities" ||
    item.id === "Activities" ||
    item.id === "activities" ||
    (item.label === "Activities" && !item.laterModule && !item.disabled);

  const isCampaignItem = (item: FilterItem) =>
    item.systemEditor === "campaigns" ||
    item.id === "Campaigns" ||
    item.id === "campaigns" ||
    (item.label === "Campaigns" && !item.laterModule && !item.disabled);

  const selectedFieldItems = resolvedGroups
    .flatMap((group) => group.items)
    .filter((item) => selectedIds.includes(item.id) && item.editor);
  const selectedActivityItem = groups
    .flatMap((group) => group.items)
    .find((item) => selectedIds.includes(item.id) && isActivityItem(item));
  const selectedCampaignItem = groups
    .flatMap((group) => group.items)
    .find((item) => selectedIds.includes(item.id) && isCampaignItem(item));
  const hasSelectedItems =
    selectedFieldItems.length > 0 || Boolean(selectedActivityItem) || Boolean(selectedCampaignItem);
  const completed =
    selectedFieldItems.every(
      (item) =>
        item.editor &&
        isFilterComplete(item.editor, drafts[item.id] ?? initialFilterDraft(item.editor)),
    ) &&
    (!selectedCampaignItem ||
      (campaignDraft.campaignIds.length >= 1 && campaignDraft.campaignIds.length <= 5));
  const [query, setQuery] = useState("");
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(new Set());
  const visibleGroups = resolvedGroups
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
                      labelClassName="w-(--size-list-filter-label-width)"
                      isDisabled={item.disabled}
                      laterModule={item.laterModule}
                      isSelected={selectedIds.includes(item.id)}
                      onChange={(selected) => {
                        setDrafts((current) => {
                          const next = { ...current };
                          if (selected && item.editor)
                            next[item.id] = initialFilterDraft(item.editor);
                          else delete next[item.id];
                          return next;
                        });
                        if (!selected && isActivityItem(item)) {
                          setActivityDraft(initialActivityFilter ?? DEFAULT_ACTIVITY_FILTER);
                        }
                        if (!selected && isCampaignItem(item)) {
                          setCampaignDraft(initialCampaignFilter ?? DEFAULT_CAMPAIGN_FILTER);
                        }
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
                    {selectedIds.includes(item.id) && isActivityItem(item) && (
                      <ActivityFilterEditor
                        className="filter-editor"
                        value={activityDraft}
                        onChange={setActivityDraft}
                      />
                    )}
                    {selectedIds.includes(item.id) && isCampaignItem(item) && (
                      <CampaignFilterEditor
                        className="filter-editor"
                        value={campaignDraft}
                        onChange={setCampaignDraft}
                        campaignOptions={campaignOptions}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </Disclosure>
          </div>
        ))}
      </div>
      {hasSelectedItems && (
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
                  const applied = selectedFieldItems.flatMap((item) => {
                    if (!item.editor) return [];
                    const draft = drafts[item.id] ?? initialFilterDraft(item.editor);
                    const control = draftOperator(item.editor, draft)?.control;
                    const appliedFilter: {
                      itemId: string;
                      operatorId: typeof draft.operatorId;
                      value: typeof draft.value;
                      daysUnit?: typeof draft.daysUnit;
                    } = {
                      itemId: item.id,
                      operatorId: draft.operatorId,
                      value:
                        control === "none"
                          ? null
                          : typeof draft.value === "string"
                            ? draft.value.trim()
                            : draft.value,
                    };
                    if (control === "days") appliedFilter.daysUnit = draft.daysUnit ?? "days";
                    return [appliedFilter];
                  });
                  const appliedCampaign: CampaignFilterValue | undefined = selectedCampaignItem
                    ? {
                        campaignIds: campaignDraft.campaignIds,
                        ...(campaignDraft.memberStatuses && campaignDraft.memberStatuses.length > 0
                          ? { memberStatuses: campaignDraft.memberStatuses }
                          : {}),
                      }
                    : undefined;

                  if (selectedCampaignItem) {
                    onApply(
                      applied,
                      selectedActivityItem ? activityFilterToCriteria(activityDraft) : undefined,
                      appliedCampaign,
                    );
                  } else if (selectedActivityItem) {
                    onApply(applied, activityFilterToCriteria(activityDraft));
                  } else {
                    onApply(applied);
                  }
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
                setActivityDraft(initialActivityFilter ?? DEFAULT_ACTIVITY_FILTER);
                setCampaignDraft(initialCampaignFilter ?? DEFAULT_CAMPAIGN_FILTER);
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
