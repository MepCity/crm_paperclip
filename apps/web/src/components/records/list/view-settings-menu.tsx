"use client";

import type { ComponentType, ReactNode, SVGProps } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, MenuItem, MenuTrigger, Submenu, SubmenuTrigger } from "@/components/ui/menu";
import { LIST_PER_PAGE_OPTIONS, type ListPerPage } from "@/lib/records/list-search-params";

export interface ViewSettingsMenuProps {
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

/** View Mode's value as the capture shows it. The off-state label was never observed. */
const WRAP_TEXT_LABEL = "Wrap Text";

/**
 * View Settings control for the header's trailing cell: the page size submenu and the
 * Wrap Text switch under View Mode. Manage Columns and Reset Column Size belong to the
 * customization module, so they are not drawn here.
 *
 * `list-settings` names each parent row by its label plus the value in effect
 * ("Records Per Page 30", "View Mode Wrap Text") and puts one glyph at the row's start,
 * so glyph, label and value are drawn in that order. The submenu popover takes its name
 * from the trigger row, which is how `list-page-size` names it ("Records Per Page 30").
 */
export function ViewSettingsMenu({
  perPage,
  onPerPageChange,
  wrapText,
  onWrapTextChange,
}: ViewSettingsMenuProps) {
  const perPageLabel = `Records Per Page ${perPage}`;
  const viewModeLabel = wrapText ? `View Mode ${WRAP_TEXT_LABEL}` : "View Mode";
  return (
    <MenuTrigger>
      <Button variant="ghost" size="listIcon" aria-label="View Settings" className="shrink-0">
        <Icons.settingsSliders aria-hidden="true" className={iconWidth} />
      </Button>
      <Menu
        width="settings"
        appearance="measured"
        aria-label="View Settings"
        shouldCloseOnInteractOutside={(element) =>
          !element.closest('[data-trigger="SubmenuTrigger"]')
        }
      >
        <SubmenuTrigger>
          <MenuItem
            appearance="measured"
            id="records-per-page"
            aria-label={perPageLabel}
            textValue={perPageLabel}
          >
            <RowContent icon={Icons.list} label="Records Per Page" value={String(perPage)} />
          </MenuItem>
          <Submenu ariaLabel="Records Per Page" selectionMode="single" selectedKeys={[perPage]}>
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
              label="View Mode"
              value={wrapText ? WRAP_TEXT_LABEL : null}
            />
          </MenuItem>
          <Submenu
            ariaLabel="View Mode"
            selectionMode="multiple"
            selectedKeys={wrapText ? ["wrap-text"] : []}
          >
            <MenuItem
              appearance="measured"
              id="wrap-text"
              textValue={WRAP_TEXT_LABEL}
              shouldCloseOnSelect
              onAction={() => onWrapTextChange(!wrapText)}
            >
              {({ isSelected }) => <MarkedRow isMarked={isSelected}>{WRAP_TEXT_LABEL}</MarkedRow>}
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
