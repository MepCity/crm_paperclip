"use client";

import type { SortSpec } from "@crm/core/records";
import { useId, useState } from "react";
import {
  Button as AriaButton,
  DialogTrigger,
  Input,
  Label,
  ListBox,
  type Selection,
  TextField,
} from "react-aria-components";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectItem } from "@/components/ui/select";
import "./list-chrome.css";

/** ListBox key for the None option; no field API name uses this spelling. */
const NONE_KEY = "sort-none";

/**
 * Gap between the toolbar control and the Sort dialog. list-views.md › Sort popover measures
 * the outer box at y 138; the toolbar row the control sits in ends at y 132 (Create Lead y 99–132).
 */
const SORT_ANCHOR_OFFSET = 6;

/**
 * list-views.md › Sort By field dropdown measures the panel top at y 222, one pixel above the
 * selector's bottom edge (y 223), so the panel covers the selector's bottom border.
 */
const SORT_FIELD_DROPDOWN_OFFSET = -1;

/** React Aria reports selection changes as a set even in single mode, so read its first key. */
function firstKey(keys: Selection): string | null {
  if (keys == null) return null;
  if (typeof keys === "object") {
    for (const key of keys) return String(key);
    return null;
  }
  return String(keys);
}

interface FieldOption {
  key: string;
  label: string;
  apiName: string | null;
}

export interface SortPopoverProps {
  fields: readonly { apiName: string; label: string }[];
  sort: SortSpec | null;
  onApply: (sort: SortSpec) => void;
}

export function SortPopover({ fields, sort, onApply }: SortPopoverProps) {
  const [open, setOpen] = useState(false);
  const [field, setField] = useState(sort?.field ?? "");
  const [order, setOrder] = useState<SortSpec["order"]>(sort?.order ?? "asc");
  const validField = fields.some((option) => option.apiName === field);
  const changeOpen = (next: boolean) => {
    if (next) {
      setField(sort?.field ?? "");
      setOrder(sort?.order ?? "asc");
    }
    setOpen(next);
  };
  return (
    <PopoverTrigger isOpen={open} onOpenChange={changeOpen}>
      <Button variant="ghost" size="listToolbar" className="gap-1">
        <Icons.sort aria-hidden="true" className="h-4 w-4" />
        Sort
      </Button>
      <Popover
        title="Sort"
        hideTitle
        offset={SORT_ANCHOR_OFFSET}
        placement="bottom start"
        className="record-sort-popover w-(--size-popover-sort-width) h-(--size-popover-sort-height)"
        contentClassName="record-sort-dialog"
        shouldCloseOnInteractOutside={(element) =>
          !element.closest("[data-trigger='Select']") &&
          !element.closest(".record-sort-field-dropdown")
        }
      >
        <div className="record-sort-fields">
          <SortByFieldSelect
            fields={fields}
            value={validField ? field : null}
            onChange={(apiName) => setField(apiName ?? "")}
          />
          <Select
            label="Order"
            hideLabel
            items={[
              { id: "asc", label: "Ascending" },
              { id: "desc", label: "Descending" },
            ]}
            value={order}
            onChange={(key) => setOrder(key === "desc" ? "desc" : "asc")}
          >
            {(item) => <SelectItem id={item.id}>{item.label}</SelectItem>}
          </Select>
        </div>
        <div className="record-sort-actions">
          <Button variant="secondary" size="toolbar" onPress={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="toolbar"
            isDisabled={!validField}
            onPress={() => {
              onApply({ field, order });
              setOpen(false);
            }}
          >
            Apply
          </Button>
        </div>
      </Popover>
    </PopoverTrigger>
  );
}

/** The Sort By field and its searchable option list: None first, then the given fields. */
function SortByFieldSelect({
  fields,
  value,
  onChange,
}: {
  fields: readonly { apiName: string; label: string }[];
  value: string | null;
  onChange: (apiName: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const labelId = useId();
  const valueId = useId();
  const options: FieldOption[] = [
    { key: NONE_KEY, label: "None", apiName: null },
    ...fields.map((field) => ({ key: field.apiName, label: field.label, apiName: field.apiName })),
  ];
  const selectedKey = value ?? NONE_KEY;
  const selectedLabel = options.find((option) => option.key === selectedKey)?.label ?? "None";
  const needle = query.trim().toLowerCase();
  const visible = options.filter((option) => option.label.toLowerCase().includes(needle));
  const changeOpen = (next: boolean) => {
    if (next) setQuery("");
    setOpen(next);
  };
  return (
    <div className="flex flex-col gap-1">
      <span id={labelId} className="record-label text-md">
        Sort By
      </span>
      <DialogTrigger isOpen={open} onOpenChange={changeOpen}>
        <AriaButton
          aria-labelledby={`${labelId} ${valueId}`}
          className="record-control flex items-center justify-between text-left"
        >
          <span id={valueId} className="truncate">
            {selectedLabel}
          </span>
          <Icons.chevronDown className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
        </AriaButton>
        <Popover
          title="Sort By fields"
          hideTitle
          offset={SORT_FIELD_DROPDOWN_OFFSET}
          placement="bottom start"
          className="record-sort-field-dropdown w-(--size-popover-sort-field-dropdown-width) h-(--size-popover-sort-field-dropdown-height)"
          contentClassName="record-sort-field-dialog"
        >
          <TextField value={query} onChange={setQuery}>
            <Label className="sr-only">Search fields</Label>
            <div className="record-sort-field-search px-1.5">
              <div className="relative flex-1">
                <Icons.filterSearch
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-(--size-list-filter-search-icon-inset) h-(--size-list-filter-search-icon) w-(--size-list-filter-search-icon) -translate-y-1/2 text-text"
                />
                <Input
                  placeholder="Search"
                  className="h-(--size-list-filter-search-height) w-full min-w-0 rounded-md border border-control-border bg-surface pr-3 pl-(--size-list-filter-search-padding) text-md font-normal text-text outline-none placeholder:text-md placeholder:font-normal placeholder:text-text-placeholder data-focus-visible:border-primary data-focus-visible:ring-2 data-focus-visible:ring-focus-ring"
                />
              </div>
            </div>
          </TextField>
          <ListBox
            aria-label="Sort By options"
            selectionMode="single"
            items={visible}
            selectedKeys={
              visible.some((option) => option.key === selectedKey)
                ? new Set([selectedKey])
                : new Set<string>()
            }
            onSelectionChange={(keys) => {
              const option = visible.find((item) => String(item.key) === String(firstKey(keys)));
              if (!option) return;
              onChange(option.apiName);
              setOpen(false);
            }}
            className="record-sort-field-list h-(--size-popover-sort-field-dropdown-list-height) overflow-y-auto outline-none"
          >
            {(option) => <SelectItem id={option.key}>{option.label}</SelectItem>}
          </ListBox>
        </Popover>
      </DialogTrigger>
    </div>
  );
}
