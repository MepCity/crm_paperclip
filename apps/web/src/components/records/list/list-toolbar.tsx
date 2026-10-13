"use client";

import type { SortSpec } from "@crm/core/records";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, type MenuAction, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { SplitButton, type SplitButtonProps } from "@/components/ui/split-button";
import { SortPopover, type SortPopoverProps } from "./sort-popover";
import { ViewTypeSwitcher } from "./view-type-switcher";

export interface ListToolbarProps {
  presentation?: "table" | "board";
  onPresentationChange?: (presentation: "table" | "board") => void;
  filterOpen: boolean;
  onFilterChange: (open: boolean) => void;
  onRefresh: () => void;
  fields: SortPopoverProps["fields"];
  sort: SortSpec | null;
  onSortApply: (sort: SortSpec | null) => void;
  create: SplitButtonProps;
  actions?: readonly MenuAction[];
  viewTypeTileIds?: readonly string[];
}

export function ListToolbar({
  presentation,
  onPresentationChange,
  filterOpen,
  onFilterChange,
  onRefresh,
  fields,
  sort,
  onSortApply,
  create,
  actions = [],
  viewTypeTileIds,
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
          className="gap-(--size-list-filter-toggle-icon-gap) rounded-(--radius-list-toolbar-tile)! aria-pressed:bg-(--color-surface-active)"
        >
          <Icons.filterToggle
            aria-hidden="true"
            className="h-(--size-list-filter-toggle-icon-height) w-(--size-list-filter-toggle-icon-width) shrink-0 text-(--color-list-filter-toggle-icon)"
          />
          Filter
        </Button>
        <SortPopover fields={fields} sort={sort} onApply={onSortApply} />
        <span className="ml-(--size-list-view-switcher-offset)">
          <ViewTypeSwitcher
            presentation={presentation}
            onPresentationChange={onPresentationChange}
            tileIds={viewTypeTileIds}
          />
        </span>
        <Button
          variant="ghost"
          size="listIcon"
          aria-label="Refresh Custom View"
          onPress={onRefresh}
        >
          <Icons.refresh
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-(--color-text-muted)"
          />
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
              onAction={(key) =>
                actions.find((item) => item.id === key && !item.laterModule)?.onAction()
              }
            >
              {(item) => (
                <MenuItem id={item.id} laterModule={item.laterModule} isDisabled={item.isDisabled}>
                  <span className="flex items-center justify-between gap-3">
                    {item.label}
                    {item.submenuIndicator ? (
                      <Icons.chevronRight aria-hidden="true" className="h-4 w-4 shrink-0" />
                    ) : null}
                  </span>
                </MenuItem>
              )}
            </Menu>
          </MenuTrigger>
        )}
      </div>
    </div>
  );
}
