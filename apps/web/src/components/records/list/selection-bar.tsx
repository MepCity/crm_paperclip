"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, type MenuAction, MenuItem, MenuTrigger } from "@/components/ui/menu";

export interface SelectionBarProps {
  selectedCount: number;
  onClear: () => void;
  /** The Actions menu operations. Items without a wired handler stay visible but inert. */
  actions?: readonly MenuAction[];
  onSendEmail?: () => void;
  onTags?: () => void;
  onMassUpdate?: () => void;
}

/**
 * `list-views.md` › Selection toolbar records the single-record counter "**1 Record Selected.**"
 * The plural form is `Not observed`, so `N Records Selected.` is an Interim extension of the
 * measured singular pattern (issue MEP-162). The trailing period is measured.
 */
function selectionLabel(count: number): string {
  return `${count} Record${count === 1 ? "" : "s"} Selected.`;
}

export function SelectionBar({
  selectedCount,
  onClear,
  actions = [],
  onSendEmail,
  onTags,
  onMassUpdate,
}: SelectionBarProps) {
  if (selectedCount <= 0) return null;

  return (
    <div
      className="flex h-(--size-list-toolbar-height) items-center gap-(--size-list-selection-strip-gap)"
      data-selection-bar
    >
      <div
        className="flex h-(--size-list-selection-counter-height) w-(--size-list-selection-counter-width) items-center justify-between text-md font-normal text-text"
        data-part="selection-strip"
      >
        <span data-part="selection-count">{selectionLabel(selectedCount)}</span>
        <Button
          variant="ghost"
          size="compact"
          className="h-(--size-list-selection-clear-height) w-(--size-list-selection-clear-width) justify-start text-md font-normal text-primary data-hovered:bg-transparent data-hovered:underline data-pressed:bg-transparent"
          onPress={onClear}
        >
          Clear
        </Button>
      </div>
      <div
        className="flex items-center gap-(--size-list-selection-button-gap)"
        data-part="record-actions"
      >
        <Button
          variant="selection"
          size="listSelection"
          className="w-(--size-list-selection-send-email-width)"
          onPress={onSendEmail}
        >
          Send Email
        </Button>
        <Button
          variant="selection"
          size="listSelection"
          className="w-(--size-list-selection-tags-width)"
          onPress={onTags}
        >
          Tags
        </Button>
        <Button
          variant="selection"
          size="listSelection"
          className="w-(--size-list-mass-update-button-width)"
          onPress={onMassUpdate}
        >
          Mass Update
        </Button>
        {actions.length > 0 ? (
          <MenuTrigger>
            <Button
              variant="selection"
              size="listSelection"
              className="w-(--size-list-selection-actions-width) px-0"
              aria-label="Actions"
            >
              <Icons.ellipsis aria-hidden="true" className="h-4 w-4 shrink-0" />
            </Button>
            <Menu
              width="actions"
              items={actions}
              onAction={(key) => actions.find((item) => item.id === key)?.onAction()}
            >
              {(item) => (
                <MenuItem
                  id={item.id}
                  appearance="measured"
                  isDisabled={item.isDisabled}
                  className="h-(--size-list-selection-menu-row-height)"
                >
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
