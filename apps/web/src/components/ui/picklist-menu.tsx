"use client";

import { type ReactNode, useRef, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  Header,
  Input,
  Label,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  TextField,
} from "react-aria-components";
import { Icons } from "./icon";
import "./picklist-menu.css";

export interface PicklistOption {
  value: string | null;
  label: string;
}
export interface PicklistGroup {
  label: string;
  options: readonly PicklistOption[];
}

export interface PicklistMenuProps {
  trigger: ReactNode;
  label: string;
  searchLabel: string;
  searchPlaceholder: string;
  emptyLabel: string;
  options?: readonly PicklistOption[];
  groups?: readonly PicklistGroup[];
  value: string | null;
  onSelect: (value: string | null) => void;
  appearance: "stage" | "terminal";
  defaultOpen?: boolean;
  isDisabled?: boolean;
}

// Index keys preserve a null value without reserving a possible stored string.
export function PicklistMenu({
  trigger,
  label,
  searchLabel,
  searchPlaceholder,
  emptyLabel,
  options,
  groups,
  value,
  onSelect,
  appearance,
  defaultOpen = false,
  isDisabled = false,
}: PicklistMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const source = groups ?? [{ label: "", options: options ?? [] }];
  let index = 0;
  const sections = source.map((group) => ({
    ...group,
    options: group.options.map((option) => ({ ...option, id: String(index++) })),
  }));
  const all = sections.flatMap((group) => group.options);
  const filtered = sections
    .map((group) => ({
      ...group,
      options: group.options.filter((option) =>
        option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
      ),
    }))
    .filter((group) => group.options.length);
  const selected = all.find((option) => option.value === value);
  function select(key: string | number) {
    const option = all.find((option) => option.id === String(key));
    if (!option) return;
    setOpen(false);
    onSelect(option.value);
  }
  const rows = (items: typeof all) =>
    items.map((option) => (
      <MenuItem key={option.id} id={option.id} textValue={option.label} className="picklist-option">
        {option.value === value && <Icons.statusCheck aria-hidden className="picklist-check" />}
        {option.label}
      </MenuItem>
    ));
  return (
    <DialogTrigger
      isOpen={open}
      onOpenChange={(next) => {
        if (isDisabled) return;
        setQuery("");
        setOpen(next);
      }}
    >
      {trigger}
      <Popover
        placement={appearance === "stage" ? "bottom start" : "bottom end"}
        offset={appearance === "stage" ? 0 : 8.5}
        className={`picklist-popover picklist-${appearance}`}
      >
        {appearance === "terminal" && <span className="picklist-pointer" aria-hidden />}
        <div
          onKeyDownCapture={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
            }
          }}
        >
          <Dialog aria-label={label} className="outline-none">
            <TextField value={query} onChange={setQuery} className="picklist-search">
              <Label className="sr-only">{searchLabel}</Label>
              <Icons.filterSearch aria-hidden className="picklist-magnifier" />
              <Input
                autoFocus
                placeholder={searchPlaceholder}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    const items = listRef.current?.querySelectorAll<HTMLElement>(
                      '[role="menuitemradio"][data-key]',
                    );
                    const item = event.key === "ArrowDown" ? items?.[0] : items?.[items.length - 1];
                    item?.focus();
                  }
                }}
              />
            </TextField>
            <Menu
              ref={listRef}
              aria-label={label}
              autoFocus={false}
              onClose={() => setOpen(false)}
              selectionMode="single"
              selectedKeys={selected ? [selected.id] : []}
              onAction={select}
              className="picklist-options"
            >
              {groups
                ? filtered.map((group) => (
                    <MenuSection key={group.label} id={group.label} className="picklist-group">
                      <Header className="picklist-heading">{group.label}</Header>
                      {rows(group.options)}
                    </MenuSection>
                  ))
                : rows(filtered.flatMap((group) => group.options))}
            </Menu>
            {!filtered.length && <span className="picklist-empty">{emptyLabel}</span>}
          </Dialog>
        </div>
      </Popover>
    </DialogTrigger>
  );
}
