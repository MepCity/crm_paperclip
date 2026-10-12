"use client";

import type { ComponentType, SVGProps } from "react";
import { Icons } from "@/components/ui/icon";

interface ViewTypeTile {
  id: string;
  /**
   * Our own accessible name. `list-views.md` › View type switcher records that all seven controls
   * are unnamed in the reference and that only the bulleted-list presentation is confirmed, so the
   * names describe the measured glyph instead of inventing a reference view type.
   */
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** The row's ink box for this glyph; the svg box is the ink box because the glyphs are filled. */
  sizeClass: string;
}

const TILES: readonly ViewTypeTile[] = [
  {
    id: "list",
    label: "List presentation",
    icon: Icons.viewTypeList,
    sizeClass: "w-(--size-list-view-type-list) h-(--size-list-view-type-list)",
  },
  {
    id: "split",
    label: "Split presentation",
    icon: Icons.viewTypeSplit,
    sizeClass: "w-(--size-list-view-type-split) h-(--size-list-view-type-split)",
  },
  {
    id: "grid",
    label: "Grid presentation",
    icon: Icons.viewTypeGrid,
    sizeClass: "w-(--size-list-view-type-grid) h-(--size-list-view-type-grid)",
  },
  {
    id: "chart",
    label: "Chart presentation",
    icon: Icons.viewTypeChart,
    sizeClass: "w-(--size-list-view-type-chart) h-(--size-list-view-type-chart)",
  },
  {
    id: "connected",
    label: "Connected presentation",
    icon: Icons.viewTypeConnected,
    sizeClass:
      "w-(--size-list-view-type-connected-width) h-(--size-list-view-type-connected-height)",
  },
  {
    id: "cards",
    label: "Cards presentation",
    icon: Icons.viewTypeCards,
    sizeClass: "w-(--size-list-view-type-cards-width) h-(--size-list-view-type-cards-height)",
  },
];

const TILE_BASE =
  "flex h-(--size-list-view-icon) w-(--size-list-view-icon) shrink-0 cursor-default items-center " +
  "justify-center rounded-(--radius-list-toolbar-tile) bg-transparent outline-none " +
  "text-(--color-text-muted) data-[active=true]:bg-primary-subtle data-[active=true]:text-primary " +
  "data-hovered:bg-surface-hover data-focus-visible:ring-2 data-focus-visible:ring-focus-ring";

/**
 * The presentation switcher: six view-type tiles and the trailing overflow arrow on a 32 px pitch.
 *
 * Interim: the list presentation is the only type the module implements, so the other tiles and
 * the arrow are visible with `aria-disabled="true"` and do nothing when activated. Their names are
 * ours; the reference exposes no accessible names for these controls.
 */
export function ViewTypeSwitcher() {
  return (
    <div
      className="flex items-center gap-(--size-list-view-switcher-gap)"
      data-view-type-switcher
      data-part="view-type-switcher"
    >
      {TILES.map((tile) => {
        const active = tile.id === "list";
        const Icon = tile.icon;
        return (
          <button
            key={tile.id}
            type="button"
            aria-label={tile.label}
            aria-pressed={active}
            aria-disabled={active ? undefined : true}
            data-active={active}
            className={TILE_BASE}
          >
            <Icon aria-hidden="true" className={`${tile.sizeClass} shrink-0`} />
          </button>
        );
      })}
      <button
        type="button"
        aria-label="More presentations"
        aria-disabled={true}
        data-active={false}
        className={TILE_BASE}
      >
        <Icons.viewTypeArrow
          aria-hidden="true"
          className="w-(--size-list-view-type-arrow-width) h-(--size-list-view-type-arrow-height) shrink-0"
        />
      </button>
    </div>
  );
}
