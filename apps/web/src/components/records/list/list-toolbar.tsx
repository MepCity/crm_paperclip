"use client";

import type { SortSpec } from "@crm/core/records";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, type MenuAction, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { SplitButton, type SplitButtonProps } from "@/components/ui/split-button";
import { SortPopover, type SortPopoverProps } from "./sort-popover";

export interface ListToolbarProps {
  filterOpen: boolean;
  onFilterChange: (open: boolean) => void;
  onRefresh: () => void;
  fields: SortPopoverProps["fields"];
  sort: SortSpec | null;
  onSortApply: (sort: SortSpec) => void;
  create: SplitButtonProps;
  actions?: readonly MenuAction[];
  presentationLabel?: string;
}

export function ListToolbar({
  filterOpen,
  onFilterChange,
  onRefresh,
  fields,
  sort,
  onSortApply,
  create,
  actions = [],
  presentationLabel = "List presentation",
}: ListToolbarProps) {
  return (
    <div
      className="flex h-(--size-list-toolbar-height) items-center justify-between gap-3"
      data-list-toolbar
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="listFilter"
          aria-pressed={filterOpen}
          onPress={() => onFilterChange(!filterOpen)}
          className="gap-1 aria-pressed:bg-(--color-surface-active)"
        >
          <Icons.filter aria-hidden="true" className="h-4 w-4 shrink-0" />
          Filter
        </Button>
        <SortPopover fields={fields} sort={sort} onApply={onSortApply} />
        <span
          role="img"
          aria-label={presentationLabel}
          className="flex h-(--size-list-view-icon) w-(--size-list-view-icon) items-center justify-center rounded-md bg-primary-subtle text-primary"
        >
          <Icons.list aria-hidden="true" className="h-4 w-4 shrink-0" />
        </span>
        <Button
          variant="ghost"
          size="listIcon"
          aria-label="Refresh Custom View"
          onPress={onRefresh}
        >
          <Icons.refresh aria-hidden="true" className="h-4 w-4 shrink-0" />
        </Button>
      </div>
      <div className="flex items-center gap-(--size-button-gap)">
        <SplitButton {...create} />
        {actions.length > 0 && (
          <MenuTrigger>
            <Button variant="secondary" size="actions" aria-label="Actions">
              <Icons.ellipsis aria-hidden="true" className="h-4 w-4 shrink-0" />
            </Button>
            <Menu
              width="actions"
              items={actions}
              onAction={(key) => actions.find((item) => item.id === key)?.onAction()}
            >
              {(item) => (
                <MenuItem id={item.id} isDisabled={item.isDisabled}>
                  {item.label}
                </MenuItem>
              )}
            </Menu>
          </MenuTrigger>
        )}
      </div>
    </div>
  );
}
