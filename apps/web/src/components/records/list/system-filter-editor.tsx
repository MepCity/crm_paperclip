"use client";

import type { RecordActionKind, RelatedActionKind, SystemFiltersValue } from "@crm/core/records";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { Select, SelectItem } from "@/components/ui/select";
import { type TimelineTimePreset, timelinePeriod } from "@/lib/api/wire/timelines";

export type SystemEditorKind =
  | "locked"
  | "record_action"
  | "related_records_action"
  | "touched"
  | "untouched";
export interface SystemEditorOptions {
  relatedModules?: readonly MultiSelectOption[];
  recordActions?: readonly RecordActionKind[];
}
export interface SystemFilterDraft {
  locked: boolean;
  action: string;
  module: string;
  actorIds: string[];
  time: Exclude<TimelineTimePreset, "any">;
}
export function initialSystemFilterDraft(kind: SystemEditorKind): SystemFilterDraft {
  return {
    locked: true,
    action: kind === "record_action" ? "created" : "added",
    module: "",
    actorIds: [],
    time: "last7",
  };
}
const periods = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
];
const actionLabels = {
  created: "Created",
  updated: "Modified",
  converted: "Converted",
  merged: "Merged",
  added: "Added",
  deleted: "Deleted",
};
export function isSystemFilterComplete(
  kind: SystemEditorKind,
  draft: SystemFilterDraft,
  options: SystemEditorOptions = {},
  users: readonly MultiSelectOption[] = [],
): boolean {
  if (kind === "locked") return typeof draft.locked === "boolean";
  if (
    !periods.some(({ id }) => id === draft.time) ||
    draft.actorIds.length > 25 ||
    draft.actorIds.some((id) => !users.some((user) => user.id === id))
  )
    return false;
  if (kind === "record_action")
    return (options.recordActions ?? ["created", "updated"]).includes(
      draft.action as RecordActionKind,
    );
  if (kind === "related_records_action")
    return (
      ["added", "updated", "deleted"].includes(draft.action) &&
      Boolean(options.relatedModules?.some(({ id }) => id === draft.module))
    );
  return true;
}
export function systemFilterValue(
  kind: SystemEditorKind,
  draft: SystemFilterDraft,
  now: Date,
  timeZone: string,
): SystemFiltersValue {
  if (kind === "locked") return { locked: { locked: draft.locked } };
  const common = {
    ...(draft.actorIds.length ? { actorIds: draft.actorIds } : {}),
    period: timelinePeriod(draft.time, now, timeZone),
  };
  if (kind === "record_action")
    return { recordAction: { ...common, action: draft.action as RecordActionKind } };
  if (kind === "related_records_action")
    return {
      relatedRecordsAction: {
        ...common,
        action: draft.action as RelatedActionKind,
        module: draft.module,
      },
    };
  return { [kind]: common };
}
export function SystemFilterEditor({
  kind,
  label,
  value,
  onChange,
  users = [],
  relatedModules = [],
  recordActions = ["created", "updated"],
}: {
  kind: SystemEditorKind;
  label: string;
  value: SystemFilterDraft;
  onChange: (value: SystemFilterDraft) => void;
  users?: readonly MultiSelectOption[];
} & SystemEditorOptions) {
  const select = (
    name: string,
    selected: string,
    items: readonly MultiSelectOption[],
    change: (value: string) => void,
  ) => (
    <Select
      label={`${label} ${name}`}
      hideLabel
      variant="filter"
      items={items}
      value={selected}
      onChange={(key) => change(String(key))}
    >
      {(item) => (
        <SelectItem variant="filter" id={item.id}>
          {item.label}
        </SelectItem>
      )}
    </Select>
  );
  return (
    <div className="filter-editor flex flex-col gap-2 min-w-0">
      {kind === "locked" ? (
        select(
          "state",
          String(value.locked),
          [
            { id: "true", label: "Locked" },
            { id: "false", label: "Not locked" },
          ],
          (locked) => onChange({ ...value, locked: locked === "true" }),
        )
      ) : (
        <>
          {kind === "related_records_action" &&
            select("module", value.module, relatedModules, (module) =>
              onChange({ ...value, module }),
            )}
          {(kind === "record_action" || kind === "related_records_action") &&
            select(
              "action",
              value.action,
              (kind === "record_action"
                ? recordActions
                : (["added", "updated", "deleted"] as const)
              ).map((id) => ({ id, label: actionLabels[id] })),
              (action) => onChange({ ...value, action }),
            )}
          <MultiSelect
            variant="users"
            label={`${label} By`}
            placeholder="Any user"
            options={users}
            value={value.actorIds}
            onChange={(actorIds) => onChange({ ...value, actorIds })}
          />
          {select("period", value.time, periods, (time) =>
            onChange({ ...value, time: time as SystemFilterDraft["time"] }),
          )}
        </>
      )}
    </div>
  );
}
