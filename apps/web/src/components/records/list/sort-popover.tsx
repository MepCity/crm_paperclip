"use client";

import type { SortSpec } from "@crm/core/records";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectItem } from "@/components/ui/select";
import "./list-chrome.css";

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
        placement="bottom start"
        className="record-sort-popover w-(--size-popover-sort-width) h-(--size-popover-sort-height)"
        contentClassName="record-sort-dialog"
        shouldCloseOnInteractOutside={(element) => !element.closest("[data-trigger='Select']")}
      >
        <div className="record-sort-fields">
          <Select
            variant="sort"
            label="Sort By"
            placeholder="None"
            items={fields}
            value={validField ? field : null}
            onChange={(key) => setField(String(key ?? ""))}
          >
            {(item) => (
              <SelectItem variant="sort" id={item.apiName}>
                {item.label}
              </SelectItem>
            )}
          </Select>
          <Select
            variant="sort"
            label="Order"
            hideLabel
            items={[
              { id: "asc", label: "Ascending" },
              { id: "desc", label: "Descending" },
            ]}
            value={order}
            onChange={(key) => setOrder(key === "desc" ? "desc" : "asc")}
          >
            {(item) => (
              <SelectItem variant="sort" id={item.id}>
                {item.label}
              </SelectItem>
            )}
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
