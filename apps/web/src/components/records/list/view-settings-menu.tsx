"use client";

import type { ReactNode } from "react";
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

const markerWidth = "w-(--size-menu-icon) h-(--size-menu-icon) shrink-0";

/**
 * View Settings control for the header's trailing cell: the page size submenu and the
 * Wrap Text switch under View Mode. Manage Columns and Reset Column Size belong to the
 * customization module, so they are not drawn here.
 */
export function ViewSettingsMenu({
  perPage,
  onPerPageChange,
  wrapText,
  onWrapTextChange,
}: ViewSettingsMenuProps) {
  return (
    <MenuTrigger>
      <Button variant="ghost" size="listIcon" aria-label="View Settings" className="shrink-0">
        <Icons.settings aria-hidden="true" className="h-4 w-4 shrink-0" />
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
            textValue="Records Per Page"
            className="justify-between"
          >
            Records Per Page
            <SubmenuIndicator />
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
            textValue="View Mode"
            className="justify-between"
          >
            View Mode
            <SubmenuIndicator />
          </MenuItem>
          <Submenu
            ariaLabel="View Mode"
            selectionMode="multiple"
            selectedKeys={wrapText ? ["wrap-text"] : []}
          >
            <MenuItem
              appearance="measured"
              id="wrap-text"
              textValue="Wrap Text"
              shouldCloseOnSelect
              onAction={() => onWrapTextChange(!wrapText)}
            >
              {({ isSelected }) => <MarkedRow isMarked={isSelected}>Wrap Text</MarkedRow>}
            </MenuItem>
          </Submenu>
        </SubmenuTrigger>
      </Menu>
    </MenuTrigger>
  );
}

function SubmenuIndicator() {
  return <Icons.chevronRight aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 opacity-60" />;
}

function MarkedRow({ isMarked, children }: { isMarked: boolean; children: ReactNode }) {
  return (
    <>
      {isMarked ? (
        <Icons.check aria-hidden="true" className={markerWidth} />
      ) : (
        <span aria-hidden="true" className={markerWidth} />
      )}
      {children}
    </>
  );
}
