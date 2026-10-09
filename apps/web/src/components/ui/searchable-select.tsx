"use client";

import { type ReactNode, useId, useState } from "react";
import { Button, ListBox, type Selection } from "react-aria-components";
import { Icons } from "./icon";
import { Popover, PopoverTrigger } from "./popover";
import { TextField } from "./text-field";

/** React Aria reports selection changes as a set even in single mode, so read its first key. */
function firstKey(keys: Selection): string | null {
  if (keys == null) return null;
  if (typeof keys === "object") {
    for (const key of keys) return String(key);
    return null;
  }
  return String(keys);
}

export interface SearchableSelectProps<T extends object> {
  label: string;
  /** Keeps the accessible name and removes the label from the visual layout. */
  hideLabel?: boolean;
  /** Text the trigger shows for the current selection. */
  valueText: string;
  /** Options in display order; the component never sorts them. */
  options: readonly T[];
  /** Stable identity of an option. */
  optionKey: (option: T) => string;
  /** Text of an option: the row's content and what the search field matches. */
  optionText: (option: T) => string;
  /** Renders one row for an option, normally a `SelectItem` carrying `optionKey` as its id. */
  children: (option: T) => ReactNode;
  /** `optionKey` of the selected option, or null while nothing is selected. */
  selectedKey: string | null;
  /** Called with the chosen option; the panel closes itself. */
  onSelect: (option: T) => void;
  /** Accessible name of the search field. */
  searchLabel: string;
  searchPlaceholder?: string;
  /** Accessible name of the option layer. */
  panelTitle: string;
  /** Gap between the trigger and the panel; a negative value overlaps the trigger's border. */
  offset?: number;
  className?: string;
  triggerClassName?: string;
  popoverClassName?: string;
  contentClassName?: string;
  /** Class of the band that holds the search field above the list. */
  searchClassName?: string;
  listClassName?: string;
}

/**
 * A single-choice selector whose option panel carries a search field above the list. The
 * search matches `optionText` case-insensitively and leaves the list empty when nothing
 * matches. It loads no data and keeps the order of the options it is given.
 */
export function SearchableSelect<T extends object>({
  label,
  hideLabel = false,
  valueText,
  options,
  optionKey,
  optionText,
  children,
  selectedKey,
  onSelect,
  searchLabel,
  searchPlaceholder = "Search",
  panelTitle,
  offset,
  className,
  triggerClassName,
  popoverClassName,
  contentClassName,
  searchClassName,
  listClassName,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const labelId = useId();
  const valueId = useId();
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? options.filter((option) => optionText(option).toLowerCase().includes(needle))
    : options;
  const selectedVisible = visible.some((option) => optionKey(option) === selectedKey);
  /** A plain ListBox does not dismiss its overlay, so the choice closes it here. */
  function choose(keys: Selection) {
    const key = firstKey(keys);
    const option = visible.find((item) => optionKey(item) === key);
    if (!option) return;
    onSelect(option);
    setOpen(false);
  }
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span
        id={labelId}
        className={hideLabel ? "sr-only record-label text-md" : "record-label text-md"}
      >
        {label}
      </span>
      <PopoverTrigger
        isOpen={open}
        onOpenChange={(next) => {
          // Every opening starts with an empty search field.
          if (next) setQuery("");
          setOpen(next);
        }}
      >
        <Button
          aria-labelledby={`${labelId} ${valueId}`}
          className={
            triggerClassName ?? "record-control flex items-center justify-between text-left"
          }
        >
          <span id={valueId} className="truncate">
            {valueText}
          </span>
          <Icons.chevronDown className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
        </Button>
        <Popover
          title={panelTitle}
          hideTitle
          offset={offset}
          placement="bottom start"
          className={popoverClassName}
          contentClassName={contentClassName}
        >
          <div className={searchClassName}>
            <TextField
              variant="filter-search"
              size="fill"
              label={searchLabel}
              placeholder={searchPlaceholder}
              value={query}
              onChange={setQuery}
            />
          </div>
          <ListBox
            aria-label={`${label} options`}
            selectionMode="single"
            items={visible}
            selectedKeys={
              selectedVisible && selectedKey != null ? new Set([selectedKey]) : new Set<string>()
            }
            onSelectionChange={choose}
            className={`outline-none ${listClassName ?? ""}`}
          >
            {children}
          </ListBox>
        </Popover>
      </PopoverTrigger>
    </div>
  );
}
