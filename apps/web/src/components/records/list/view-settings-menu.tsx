"use client";

import type { ComponentType, ReactNode, SVGProps } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import type { ModuleKey } from "@/components/ui/later-module";
import {
  Menu,
  MenuDivider,
  MenuItem,
  MenuTrigger,
  Submenu,
  SubmenuTrigger,
} from "@/components/ui/menu";
import { useUiTranslations } from "@/i18n/client-provider";
import { LIST_PER_PAGE_OPTIONS, type ListPerPage } from "@/lib/records/list-search-params";

export interface ViewSettingsMenuProps {
  laterModule?: ModuleKey;
  onManageColumns?: () => void;
  /** Page size in effect: the address value when it carries `per_page`, otherwise the stored preference. */
  perPage: ListPerPage;
  onPerPageChange: (perPage: ListPerPage) => void;
  wrapText: boolean;
  onWrapTextChange: (wrapText: boolean) => void;
}

const iconWidth = "w-(--size-menu-icon) h-(--size-menu-icon) shrink-0";

/** The submenu chevron sits after the value, at the row's right edge. */
const submenuIndicatorWidth = `${iconWidth} opacity-60`;

/**
 * `typography.md` › Table settings row value (measured from `list-settings`, wght 640–660)
 * is heavier than the row label (Table settings row label, wght 420), so only the value
 * leaves the menu item's `font-normal`; `--font-weight-bold` (650) sits in that band.
 */
const rowValueClass = "ml-auto shrink-0 font-bold";

/**
 * View Settings control for the header's trailing cell: the page size submenu and the
 * Wrap Text switch under View Mode. Metadata consumers can supply Manage Columns;
 * Reset Column Size remains outside this control.
 *
 * `list-settings` names each parent row by its label plus the value in effect
 * ("Records Per Page 30", "View Mode Wrap Text") and puts one glyph at the row's start,
 * so glyph, label and value are drawn in that order. The submenu popover takes its name
 * from the trigger row, which is how `list-page-size` names it ("Records Per Page 30").
 */
export function ViewSettingsMenu({
  laterModule,
  onManageColumns,
  perPage,
  onPerPageChange,
  wrapText,
  onWrapTextChange,
}: ViewSettingsMenuProps) {
  const t = useUiTranslations();
  const wrapTextLabel = t("records.chrome.wrapText");
  const perPageLabel = `${t("records.chrome.recordsPerPage")} ${perPage}`;
  const viewModeLabel = wrapText
    ? `${t("records.chrome.viewMode")} ${wrapTextLabel}`
    : t("records.chrome.viewMode");
  return (
    <MenuTrigger>
      <Button
        laterModule={laterModule}
        variant="ghost"
        size="listIcon"
        aria-label={t("records.chrome.viewSettings")}
        className="shrink-0"
      >
        <Icons.settingsSliders aria-hidden="true" className={iconWidth} />
      </Button>
      <Menu
        width="settings"
        appearance="measured"
        aria-label={t("records.chrome.viewSettings")}
        shouldCloseOnInteractOutside={(element) =>
          !element.closest('[data-trigger="SubmenuTrigger"]')
        }
      >
        {onManageColumns ? (
          <MenuItem
            id="manage-columns"
            textValue={t("records.actions.manageColumns")}
            shouldCloseOnSelect
            onAction={onManageColumns}
          >
            {t("records.actions.manageColumns")}
          </MenuItem>
        ) : null}
        {onManageColumns ? (
          <>
            <MenuItem id="reset-column-size" isDisabled>
              {t("records.chrome.resetColumnSize")}
            </MenuItem>
            <MenuDivider />
          </>
        ) : null}
        <SubmenuTrigger>
          <MenuItem
            appearance="measured"
            id="records-per-page"
            aria-label={perPageLabel}
            textValue={perPageLabel}
          >
            <RowContent
              icon={Icons.list}
              label={t("records.chrome.recordsPerPage")}
              value={String(perPage)}
            />
          </MenuItem>
          <Submenu
            ariaLabel={t("records.chrome.recordsPerPage")}
            selectionMode="single"
            selectedKeys={[perPage]}
          >
            {LIST_PER_PAGE_OPTIONS.map((option) => (
              <MenuItem
                key={option}
                appearance="measured"
                id={option}
                textValue={String(option)}
                shouldCloseOnSelect
                onAction={() => onPerPageChange(option)}
              >
                {({ isSelected }) => <MarkedRow isMarked={isSelected}>{option}</MarkedRow>}
              </MenuItem>
            ))}
          </Submenu>
        </SubmenuTrigger>
        <SubmenuTrigger>
          <MenuItem
            appearance="measured"
            id="view-mode"
            aria-label={viewModeLabel}
            textValue={viewModeLabel}
          >
            <RowContent
              icon={Icons.eye}
              label={t("records.chrome.viewMode")}
              value={wrapText ? wrapTextLabel : null}
            />
          </MenuItem>
          <Submenu
            ariaLabel={t("records.chrome.viewMode")}
            selectionMode="multiple"
            selectedKeys={wrapText ? ["wrap-text"] : []}
          >
            <MenuItem
              appearance="measured"
              id="wrap-text"
              textValue={wrapTextLabel}
              shouldCloseOnSelect
              onAction={() => onWrapTextChange(!wrapText)}
            >
              {({ isSelected }) => <MarkedRow isMarked={isSelected}>{wrapTextLabel}</MarkedRow>}
            </MenuItem>
          </Submenu>
        </SubmenuTrigger>
      </Menu>
    </MenuTrigger>
  );
}

/**
 * One parent row in the order the capture shows it: leading glyph, label, then the value
 * in effect pushed to the right edge, with the submenu chevron last.
 */
function RowContent({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string | null;
}) {
  return (
    <>
      <Icon aria-hidden="true" className={iconWidth} />
      <span>{label}</span>
      {value ? <span className={rowValueClass}>{value}</span> : null}
      <Icons.chevronRight aria-hidden="true" className={submenuIndicatorWidth} />
    </>
  );
}

function MarkedRow({ isMarked, children }: { isMarked: boolean; children: ReactNode }) {
  return (
    <>
      {isMarked ? (
        <Icons.check aria-hidden="true" className={iconWidth} />
      ) : (
        <span aria-hidden="true" className={iconWidth} />
      )}
      {children}
    </>
  );
}
