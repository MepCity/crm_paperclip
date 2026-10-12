"use client";

import type { ListView } from "@crm/core/records";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, MenuDivider, MenuItem, MenuTrigger } from "@/components/ui/menu";

export interface ViewTabStripProps {
  viewName: string;
  views?: readonly Pick<ListView, "id" | "name">[];
  onViewChange?: (id: string) => void;
}

export function ViewTabStrip({ viewName, views, onViewChange }: ViewTabStripProps) {
  const [publicOpen, setPublicOpen] = useState(true);
  return (
    <div
      className="flex h-(--size-list-tab-height) items-center gap-3 border-b border-(--color-panel-border)"
      data-view-tab-strip
    >
      <span
        className="inline-flex h-(--size-list-pill-height) min-w-(--size-list-pill-width) items-center justify-center rounded-md bg-(--color-surface-selected) px-2 text-sm font-bold text-text"
        data-view-pill
      >
        {viewName}
      </span>
      {views ? (
        <MenuTrigger>
          <Button variant="ghost" size="listIcon" aria-label="Custom views">
            <Icons.ellipsis aria-hidden className="h-4 w-4" />
          </Button>
          <Menu aria-label="Custom views" placement="bottom start" appearance="measured">
            <MenuItem
              id="public"
              shouldCloseOnSelect={false}
              onAction={() => setPublicOpen(!publicOpen)}
            >
              <Icons.chevronDown aria-hidden className="h-4 w-4" />
              Public Views
            </MenuItem>
            {publicOpen
              ? views.map((view) => (
                  <MenuItem key={view.id} id={view.id} onAction={() => onViewChange?.(view.id)}>
                    {view.name === viewName ? (
                      <Icons.check aria-hidden className="h-4 w-4" />
                    ) : null}
                    {view.name}
                  </MenuItem>
                ))
              : null}
            <MenuDivider />
            <MenuItem id="dropdown">Show custom views as Dropdown</MenuItem>
            <MenuDivider />
            <MenuItem id="new" laterModule="M11">
              New Custom View
            </MenuItem>
            <MenuItem id="manage" laterModule="M11">
              Manage Custom View
            </MenuItem>
          </Menu>
        </MenuTrigger>
      ) : null}
    </div>
  );
}
