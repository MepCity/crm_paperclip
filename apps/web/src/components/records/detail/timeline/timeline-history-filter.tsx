"use client";

import { type ReactNode, useId, useMemo, useState } from "react";
import { Button } from "react-aria-components";
import { Checkbox } from "@/components/ui/checkbox";
import { Menu, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { Popover } from "@/components/ui/popover";
import type { TimelineFilterOption, TimelineHistoryFilterValue, TimelineTimePreset } from "./types";

const TIME_OPTIONS: { id: TimelineTimePreset; label: string }[] = [
  { id: "any", label: "Any Time" },
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
];

type SelectorTone = "checkbox-placeholder" | "user-placeholder" | "value";

function isDirty(value: TimelineHistoryFilterValue): boolean {
  return (
    value.moduleIds.length > 0 ||
    value.userId !== null ||
    value.time !== "any" ||
    value.sourceIds.length > 0
  );
}

interface FilterFieldProps {
  label: string;
  tone: SelectorTone;
  triggerLabel: string;
  menu: ReactNode;
}

function FilterField({ label, tone, triggerLabel, menu }: FilterFieldProps) {
  const labelId = useId();
  const [open, setOpen] = useState(false);
  return (
    <div className="timeline-history-filter-field">
      <p id={labelId} className="timeline-history-filter-field-label">
        {label}
      </p>
      <MenuTrigger isOpen={open} onOpenChange={setOpen}>
        <div className="timeline-filter-selector-wrap" data-tone={tone}>
          <Button className="timeline-filter-selector" aria-labelledby={labelId}>
            <span className="timeline-filter-selector-label">{triggerLabel}</span>
          </Button>
          <span className="timeline-filter-caret" aria-hidden="true" />
        </div>
        {menu}
      </MenuTrigger>
    </div>
  );
}

interface CheckboxSelectProps {
  label: string;
  allLabel: string;
  options: readonly TimelineFilterOption[];
  selectedIds: readonly string[];
  onChange: (selectedIds: string[]) => void;
}

function CheckboxSelect({ label, allLabel, options, selectedIds, onChange }: CheckboxSelectProps) {
  const triggerLabel =
    selectedIds.length === 0
      ? allLabel
      : options
          .filter((option) => selectedIds.includes(option.id))
          .map((option) => option.label)
          .join(", ");
  const tone: SelectorTone = selectedIds.length === 0 ? "checkbox-placeholder" : "value";
  return (
    <FilterField
      label={label}
      tone={tone}
      triggerLabel={triggerLabel}
      menu={
        <Popover
          title={label}
          hideTitle
          placement="bottom start"
          className="timeline-filter-menu"
          contentClassName="p-2"
        >
          <ul className="m-0 list-none p-0">
            {options.map((option) => (
              <li key={option.id} className="timeline-filter-menu-item">
                <Checkbox
                  label={option.label}
                  isSelected={selectedIds.includes(option.id)}
                  onChange={(selected) => {
                    onChange(
                      selected
                        ? [...selectedIds, option.id]
                        : selectedIds.filter((id) => id !== option.id),
                    );
                  }}
                />
              </li>
            ))}
          </ul>
        </Popover>
      }
    />
  );
}

interface UserSelectProps {
  label: string;
  allLabel: string;
  options: readonly TimelineFilterOption[];
  userId: string | null;
  onChange: (userId: string | null) => void;
}

function UserSelect({ label, allLabel, options, userId, onChange }: UserSelectProps) {
  const triggerLabel =
    userId === null
      ? allLabel
      : (options.find((option) => option.id === userId)?.label ?? allLabel);
  const tone: SelectorTone = userId === null ? "user-placeholder" : "value";
  const items = useMemo(
    () => [{ id: "__all__", label: allLabel }, ...options],
    [allLabel, options],
  );
  return (
    <FilterField
      label={label}
      tone={tone}
      triggerLabel={triggerLabel}
      menu={
        <Menu
          items={items}
          onAction={(key) => {
            onChange(key === "__all__" ? null : String(key));
          }}
        >
          {(item) => <MenuItem id={item.id}>{item.label}</MenuItem>}
        </Menu>
      }
    />
  );
}

interface TimeSelectProps {
  label: string;
  value: TimelineTimePreset;
  onChange: (value: TimelineTimePreset) => void;
}

function TimeSelect({ label, value, onChange }: TimeSelectProps) {
  const triggerLabel = TIME_OPTIONS.find((option) => option.id === value)?.label ?? "Any Time";
  return (
    <FilterField
      label={label}
      tone="value"
      triggerLabel={triggerLabel}
      menu={
        <Menu
          items={TIME_OPTIONS}
          onAction={(key) => {
            onChange(key as TimelineTimePreset);
          }}
        >
          {(item) => <MenuItem id={item.id}>{item.label}</MenuItem>}
        </Menu>
      }
    />
  );
}

export interface TimelineHistoryFilterProps {
  modulesLabel: string;
  modulesAllLabel: string;
  moduleOptions: readonly TimelineFilterOption[];
  usersLabel: string;
  usersAllLabel: string;
  userOptions: readonly TimelineFilterOption[];
  timeLabel: string;
  sourcesLabel: string;
  sourcesAllLabel: string;
  sourceOptions: readonly TimelineFilterOption[];
  applyLabel: string;
  onApply: (value: TimelineHistoryFilterValue) => void;
}

export function TimelineHistoryFilterPanel({
  modulesLabel,
  modulesAllLabel,
  moduleOptions,
  usersLabel,
  usersAllLabel,
  userOptions,
  timeLabel,
  sourcesLabel,
  sourcesAllLabel,
  sourceOptions,
  applyLabel,
  onApply,
}: TimelineHistoryFilterProps) {
  const [value, setValue] = useState<TimelineHistoryFilterValue>({
    moduleIds: [],
    userId: null,
    time: "any",
    sourceIds: [],
  });
  const canApply = isDirty(value);
  return (
    <div className="timeline-history-filter-panel" data-timeline-filter-panel>
      <div className="timeline-history-filter-row">
        <CheckboxSelect
          label={modulesLabel}
          allLabel={modulesAllLabel}
          options={moduleOptions}
          selectedIds={value.moduleIds}
          onChange={(moduleIds) => setValue((current) => ({ ...current, moduleIds }))}
        />
        <UserSelect
          label={usersLabel}
          allLabel={usersAllLabel}
          options={userOptions}
          userId={value.userId}
          onChange={(userId) => setValue((current) => ({ ...current, userId }))}
        />
        <TimeSelect
          label={timeLabel}
          value={value.time}
          onChange={(time) => setValue((current) => ({ ...current, time }))}
        />
      </div>
      <div className="timeline-history-filter-row">
        <CheckboxSelect
          label={sourcesLabel}
          allLabel={sourcesAllLabel}
          options={sourceOptions}
          selectedIds={value.sourceIds}
          onChange={(sourceIds) => setValue((current) => ({ ...current, sourceIds }))}
        />
        <button
          type="button"
          className="timeline-history-apply"
          disabled={!canApply}
          onClick={() => onApply(value)}
        >
          {applyLabel}
        </button>
      </div>
    </div>
  );
}
