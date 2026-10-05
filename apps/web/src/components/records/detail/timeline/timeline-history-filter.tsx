"use client";

import { useMemo, useState } from "react";
import { Button } from "react-aria-components";
import { Checkbox } from "@/components/ui/checkbox";
import { Icons } from "@/components/ui/icon";
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

function isDirty(value: TimelineHistoryFilterValue): boolean {
  return (
    value.moduleIds.length > 0 ||
    value.userId !== null ||
    value.time !== "any" ||
    value.sourceIds.length > 0
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
  const [open, setOpen] = useState(false);
  const triggerLabel =
    selectedIds.length === 0
      ? allLabel
      : options
          .filter((option) => selectedIds.includes(option.id))
          .map((option) => option.label)
          .join(", ");
  return (
    <MenuTrigger isOpen={open} onOpenChange={setOpen}>
      <Button className="timeline-filter-selector" aria-label={label}>
        <span className="timeline-filter-selector-label">{triggerLabel}</span>
        <Icons.chevronDown className="timeline-filter-selector-chevron" aria-hidden="true" />
      </Button>
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
    </MenuTrigger>
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
  const [open, setOpen] = useState(false);
  const triggerLabel =
    userId === null
      ? allLabel
      : (options.find((option) => option.id === userId)?.label ?? allLabel);
  const items = useMemo(
    () => [{ id: "__all__", label: allLabel }, ...options],
    [allLabel, options],
  );
  return (
    <MenuTrigger isOpen={open} onOpenChange={setOpen}>
      <Button className="timeline-filter-selector" aria-label={label}>
        <span className="timeline-filter-selector-label">{triggerLabel}</span>
        <Icons.chevronDown className="timeline-filter-selector-chevron" aria-hidden="true" />
      </Button>
      <Menu
        items={items}
        onAction={(key) => {
          onChange(key === "__all__" ? null : String(key));
          setOpen(false);
        }}
      >
        {(item) => <MenuItem id={item.id}>{item.label}</MenuItem>}
      </Menu>
    </MenuTrigger>
  );
}

interface TimeSelectProps {
  value: TimelineTimePreset;
  onChange: (value: TimelineTimePreset) => void;
}

function TimeSelect({ value, onChange }: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const triggerLabel = TIME_OPTIONS.find((option) => option.id === value)?.label ?? "Any Time";
  return (
    <MenuTrigger isOpen={open} onOpenChange={setOpen}>
      <Button className="timeline-filter-selector" aria-label="Time">
        <span className="timeline-filter-selector-label">{triggerLabel}</span>
        <Icons.chevronDown className="timeline-filter-selector-chevron" aria-hidden="true" />
      </Button>
      <Menu
        items={TIME_OPTIONS}
        onAction={(key) => {
          onChange(key as TimelineTimePreset);
          setOpen(false);
        }}
      >
        {(item) => <MenuItem id={item.id}>{item.label}</MenuItem>}
      </Menu>
    </MenuTrigger>
  );
}

export interface TimelineHistoryFilterProps {
  modulesLabel: string;
  modulesAllLabel: string;
  moduleOptions: readonly TimelineFilterOption[];
  usersLabel: string;
  usersAllLabel: string;
  userOptions: readonly TimelineFilterOption[];
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
