"use client";

import type { SortSpec } from "@crm/core/records";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { SearchableSelect } from "@/components/ui/searchable-select";
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
  const options: FieldOption[] = [
    { key: NONE_KEY, label: "None", apiName: null },
    ...fields.map((field) => ({ key: field.apiName, label: field.label, apiName: field.apiName })),
  ];
  const selectedKey = value ?? NONE_KEY;
  const selectedLabel = options.find((option) => option.key === selectedKey)?.label ?? "None";
  return (
    <SearchableSelect
      label="Sort By"
      panelTitle="Sort By fields"
      searchLabel="Search fields"
      valueText={selectedLabel}
      options={options}
      optionKey={(option) => option.key}
      optionText={(option) => option.label}
      selectedKey={selectedKey}
      onSelect={(option) => onChange(option.apiName)}
      offset={SORT_FIELD_DROPDOWN_OFFSET}
      popoverClassName="record-sort-field-dropdown w-(--size-popover-sort-field-dropdown-width) h-(--size-popover-sort-field-dropdown-height)"
      contentClassName="record-sort-field-dialog"
      searchClassName="record-sort-field-search px-1.5"
      listClassName="record-sort-field-list h-(--size-popover-sort-field-dropdown-list-height) overflow-y-auto"
    >
      {(option) => <SelectItem id={option.key}>{option.label}</SelectItem>}
    </SearchableSelect>
  );
}
