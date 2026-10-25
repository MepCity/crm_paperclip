"use client";

import type { ListView } from "@crm/core/records";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Menu, MenuDivider, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { TextField } from "@/components/ui/text-field";

// biome-ignore format: preserve line numbers
export interface ViewTabStripProps {
  viewName: string;
  views?: readonly Pick<ListView, "id" | "name">[];
  onViewChange?: (id: string) => void;
  pinnedViews?: readonly string[];
  /** Draws a Search box above Public Views that filters the rows by name (Tasks only). */
  searchable?: boolean;
  onNewView?: () => void; onEditView?: (id: string) => void; onManageViews?: () => void;
}

// biome-ignore format: preserve line numbers
export function ViewTabStrip({ viewName, views, onViewChange, pinnedViews, searchable, onNewView, onEditView, onManageViews }: ViewTabStripProps) {
  const [publicOpen, setPublicOpen] = useState(true), [query, setQuery] = useState("");
  // biome-ignore format: preserve line numbers
  const itemNewProps = onNewView ? { onAction: onNewView } : { laterModule: "M11" as const };
  // biome-ignore format: preserve line numbers
  const mgrProps = onManageViews ? { onAction: onManageViews } : { laterModule: "M11" as const };
  const needle = query.trim().toLowerCase();
  const visibleViews = needle
    ? views?.filter((view) => view.name.toLowerCase().includes(needle))
    : views;
  return (
    <div
      className="flex h-(--size-list-tab-height) items-center gap-3 border-b border-(--color-panel-border)"
      data-view-tab-strip
    >
      {pinnedViews && pinnedViews.length > 0 ? (
        <>
          {pinnedViews.map((tabName) => {
            const isActive = tabName === viewName;
            if (isActive) {
              return (
                <span
                  key={tabName}
                  className="inline-flex h-(--size-list-pill-height) min-w-(--size-list-pill-width) items-center justify-center rounded-md bg-(--color-surface-selected) px-2 text-sm font-bold text-text"
                  data-view-pill
                >
                  {tabName}
                </span>
              );
            }
            const target = views?.find((v) => v.name === tabName);
            return (
              <button
                key={tabName}
                type="button"
                onClick={() => {
                  if (target) onViewChange?.(target.id);
                }}
                className="inline-flex h-(--size-list-pill-height) min-w-(--size-list-pill-width) items-center justify-center rounded-md px-2 text-sm font-normal text-text hover:bg-surface-hover cursor-pointer"
              >
                {tabName}
              </button>
            );
          })}
          {!pinnedViews.includes(viewName) ? (
            <span
              key={viewName}
              className="inline-flex h-(--size-list-pill-height) min-w-(--size-list-pill-width) items-center justify-center rounded-md bg-(--color-surface-selected) px-2 text-sm font-bold text-text"
              data-view-pill
            >
              {viewName}
            </span>
          ) : null}
        </>
      ) : (
        <span
          className="inline-flex h-(--size-list-pill-height) min-w-(--size-list-pill-width) items-center justify-center rounded-md bg-(--color-surface-selected) px-2 text-sm font-bold text-text"
          data-view-pill
        >
          {viewName}
        </span>
      )}
      {views ? (
        <MenuTrigger>
          <Button variant="ghost" size="listIcon" aria-label="Custom views">
            <Icons.ellipsis aria-hidden className="h-4 w-4" />
          </Button>
          <Menu
            aria-label="Custom views"
            placement="bottom start"
            appearance="measured"
            tall
            widthPx={320}
            header={
              searchable ? (
                <TextField
                  label="Search views"
                  placeholder="Search"
                  variant="filter-search"
                  value={query}
                  onChange={setQuery}
                />
              ) : undefined
            }
          >
            <MenuItem
              id="public"
              shouldCloseOnSelect={false}
              onAction={() => setPublicOpen(!publicOpen)}
            >
              <Icons.chevronDown aria-hidden className="h-4 w-4" />
              Public Views
            </MenuItem>
            {publicOpen
              ? visibleViews?.map((view) => (
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
            <MenuItem id="new" {...itemNewProps}>
              New Custom View
            </MenuItem>
            <MenuItem id="manage"     {...mgrProps}>
              Manage Custom View
            </MenuItem>
            {onEditView ? (
              <MenuItem
                id="edit"
                onAction={() => {
                  const current = views?.find((v) => v.name === viewName);
                  if (current) onEditView(current.id);
                }}
              >
                {"Edit Current View"}
              </MenuItem>
            ) : null}
          </Menu>
        </MenuTrigger>
      ) : null}
    </div>
  );
}
