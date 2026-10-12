"use client";

import "./filter-control.css";
import { useState } from "react";
import { Button, ListBox, ListBoxItem } from "react-aria-components";
import { Icons } from "./icon";
import { Popover, PopoverTrigger } from "./popover";
import { Select, SelectItem } from "./select";
import { TextField } from "./text-field";

export interface MultiSelectOption {
  id: string;
  label: string;
  detail?: string;
  currentUser?: boolean;
}
export interface MultiSelectProps {
  variant?: "choices" | "users";
  label: string;
  placeholder: string;
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onChange: (value: string[]) => void;
}
/** A locally searchable multiple choice list; it never loads options. */
export function MultiSelect({
  variant = "choices",
  label,
  placeholder,
  options,
  value,
  onChange,
}: MultiSelectProps) {
  const [query, setQuery] = useState("");
  const visible = options.filter((option) =>
    `${option.label} ${option.detail ?? ""}`.toLowerCase().includes(query.toLowerCase()),
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
      <Popover
        title={label}
        hideTitle
        className={variant === "users" ? "filter-user-popover" : "filter-choice-popover"}
        contentClassName="filter-choice-content"
      >
        {variant === "users" ? (
          <div className="filter-user-header">
            <Select
              label={`${label} user type`}
              hideLabel
              variant="filter"
              items={[{ id: "users", label: "Users" }]}
              value="users"
              onChange={() => {}}
            >
              {(option) => (
                <SelectItem variant="filter" id={option.id}>
                  {option.label}
                </SelectItem>
              )}
            </Select>
            <div className="filter-user-search">
              <TextField label={`Search ${label}`} hideLabel value={query} onChange={setQuery} />
            </div>
          </div>
        ) : (
          <div className="filter-choice-search">
            <TextField label={`Search ${label}`} hideLabel value={query} onChange={setQuery} />
          </div>
        )}
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
          className={`filter-choice-list ${variant === "users" ? "filter-user-body" : ""}`}
        >
          {(option) => (
            <ListBoxItem id={option.id} textValue={option.label} className="filter-choice-option">
              {({ isSelected }) => (
                <>
                  <span aria-hidden className="w-3 shrink-0">
                    {isSelected && <Icons.check className="h-3 w-3" />}
                  </span>
                  {variant === "users" && (
                    <span aria-hidden className="filter-user-avatar">
                      {option.label.slice(0, 1)}
                    </span>
                  )}
                  <span>
                    {option.label}
                    {variant === "users" && (
                      <span className="block text-xs text-text-muted">
                        {option.currentUser ? "Logged in User" : option.detail}
                      </span>
                    )}
                  </span>
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </PopoverTrigger>
  );
}
