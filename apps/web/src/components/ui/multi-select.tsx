"use client";

import "./filter-control.css";
import { useState } from "react";
import { Button, ListBox, ListBoxItem } from "react-aria-components";
import { Icons } from "./icon";
import { Popover, PopoverTrigger } from "./popover";
import { TextField } from "./text-field";

export interface MultiSelectOption {
  id: string;
  label: string;
}
export interface MultiSelectProps {
  label: string;
  placeholder: string;
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onChange: (value: string[]) => void;
}
/** A locally searchable multiple choice list; it never loads options. */
export function MultiSelect({ label, placeholder, options, value, onChange }: MultiSelectProps) {
  const [query, setQuery] = useState("");
  const visible = options.filter((option) =>
    option.label.toLowerCase().includes(query.toLowerCase()),
  );
  const selectedLabel = options
    .filter((option) => value.includes(option.id))
    .map((option) => option.label)
    .join(", ");
  return (
    <PopoverTrigger onOpenChange={() => setQuery("")}>
      <Button
        aria-label={label}
        data-empty={value.length === 0 || undefined}
        className="filter-multi-trigger"
      >
        <span data-part={value.length === 0 ? "empty-value" : undefined} className="truncate">
          {selectedLabel || placeholder}
        </span>
        <Icons.chevronDown aria-hidden className="h-3 w-3 shrink-0" />
      </Button>
      <Popover title={label} hideTitle className="w-(--size-filter-operator-list-width)">
        <TextField label={`Search ${label}`} hideLabel value={query} onChange={setQuery} />
        <ListBox
          aria-label={label}
          items={visible}
          selectionMode="multiple"
          selectionBehavior="toggle"
          escapeKeyBehavior="none"
          selectedKeys={value}
          onSelectionChange={(keys) => {
            // Keep selected options hidden by search; RAC receives the complete selection.
            onChange(keys === "all" ? options.map((option) => option.id) : [...keys].map(String));
          }}
          className="mt-2 max-h-60 overflow-auto outline-none"
        >
          {(option) => (
            <ListBoxItem
              id={option.id}
              textValue={option.label}
              className="flex items-center gap-2 rounded px-2 py-2 text-sm text-text outline-none data-selected:bg-surface-selected data-focused:bg-surface-hover data-focus-visible:ring-2 data-focus-visible:ring-focus-ring"
            >
              {({ isSelected }) => (
                <>
                  <span aria-hidden className="w-3 shrink-0">
                    {isSelected && <Icons.check className="h-3 w-3" />}
                  </span>
                  {option.label}
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </PopoverTrigger>
  );
}
