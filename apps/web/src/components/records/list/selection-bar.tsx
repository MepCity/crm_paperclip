"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, type MenuAction, MenuItem, MenuTrigger } from "@/components/ui/menu";

export interface SelectionBarProps {
  selectedCount: number;
  recordLabelSingular: string;
  recordLabelPlural: string;
  onClear: () => void;
  onDelete: () => void;
  actions?: readonly MenuAction[];
}

function selectionLabel(count: number, singular: string, plural: string): string {
  if (count === 1) return `1 ${singular} Selected`;
  return `${count} ${plural} Selected`;
}

export function SelectionBar({
  selectedCount,
  recordLabelSingular,
  recordLabelPlural,
  onClear,
  onDelete,
  actions = [],
}: SelectionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div
      className="flex h-(--size-list-toolbar-height) items-center justify-between gap-3"
      data-selection-bar
    >
      <div className="flex min-w-0 items-center gap-3 text-md font-normal text-text">
        <span data-part="selection-count">
          {selectionLabel(selectedCount, recordLabelSingular, recordLabelPlural)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 font-normal text-primary data-hovered:underline"
          onPress={onClear}
        >
          Clear
        </Button>
      </div>
      <div className="flex items-center gap-(--size-button-gap)">
        <Button variant="secondary" size="listToolbar" onPress={onDelete}>
          Delete
        </Button>
        {actions.length > 0 ? (
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
        ) : null}
      </div>
    </div>
  );
}
