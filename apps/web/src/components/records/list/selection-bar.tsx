"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, type MenuAction, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { useUiTranslations } from "@/i18n/client-provider";

export interface SelectionBarProps {
  laterInventory?: boolean;
  tagsEnabled?: boolean;
  selectedCount: number;
  onClear: () => void;
  /** The Actions menu operations. Items without a wired handler stay visible but inert. */
  actions?: readonly MenuAction[];
  onSendEmail?: () => void;
  onTags?: () => void;
  onMassUpdate?: () => void;
}

export function SelectionBar({
  laterInventory = false,
  tagsEnabled = false,
  selectedCount,
  onClear,
  actions = [],
  onSendEmail,
  onTags,
  onMassUpdate,
}: SelectionBarProps) {
  const t = useUiTranslations();
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
        <span data-part="selection-count">
          {t("records.list.selectedCount", { count: selectedCount })}
        </span>
        <Button
          variant="ghost"
          size="compact"
          className="h-(--size-list-selection-clear-height) w-(--size-list-selection-clear-width) justify-start text-md font-normal text-primary data-hovered:bg-transparent data-hovered:underline data-pressed:bg-transparent"
          onPress={onClear}
        >
          {t("records.list.clear")}
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
          laterModule={laterInventory ? "M10" : undefined}
          onPress={onSendEmail}
        >
          {t("records.list.sendEmail")}
        </Button>
        <Button
          variant="selection"
          size="listSelection"
          className="w-(--size-list-selection-tags-width)"
          laterModule={laterInventory && !tagsEnabled ? "M6" : undefined}
          onPress={onTags}
        >
          {t("records.list.tags")}
        </Button>
        <Button
          variant="selection"
          size="listSelection"
          className="w-(--size-list-mass-update-button-width)"
          onPress={onMassUpdate}
        >
          {t("records.list.massUpdate")}
        </Button>
        {actions.length > 0 ? (
          <MenuTrigger>
            <Button
              variant="selection"
              size="listSelection"
              className="w-(--size-list-selection-actions-width) px-0"
              aria-label={t("records.list.actions")}
            >
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
                <MenuItem
                  id={item.id}
                  laterModule={item.laterModule}
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
