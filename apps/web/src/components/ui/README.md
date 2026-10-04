# UI Primitives

This directory contains the headless-first design system components, built on `react-aria-components` and Tailwind CSS.

## Rules for adding a new primitive

1. **One primitive, one file:** Use `kebab-case.tsx`. No barrel files (`index.ts`). Import components directly from their file (e.g., `import { Button } from "@/components/ui/button"`).
2. **Design strictly with tokens:** Do not use arbitrary colors or generic tailwind colors (`bg-red-500`). Use semantic tokens like `bg-primary`, `text-text-muted`, `border-border`.
3. **Headless first:** Use `react-aria-components` for interaction and accessibility. Define styles on the `className` directly using Tailwind and Aria data attributes (e.g., `data-hovered:`, `data-disabled:`).
4. **Test thoroughly:** Every primitive must have a `*.test.tsx` file checking keyboard interaction, variants, and accessible roles/labels.
5. **Add a demo:** Create a `*.demo.tsx` file exhibiting all states and variants, and register it in `/dev/ui` (in `apps/web/src/app/dev/ui/demos.ts`).

## What NOT to do

- **No client-side dependencies that aren't strict UI utilities.**
- **Do not introduce heavy styling libraries** (e.g., styled-components, emotion). Tailwind + variables is enough.
- **Do not import from `@crm/core` in client components**, except for types or `@crm/core/errors`.

## Token sources

Every token declared in `apps/web/src/app/tokens.css`, in file order, with the row it comes from. The
**Visual layout** section of a spec is the only source of token values (ADR 0003, §2). Rows are
quoted as `Region or element › Property › Value`; the colour and type summaries at the end of that
section are quoted as `Colour summary` and `Type summary`. Source rows are in `research/specs/app-shell.md`
and `research/specs/list-views.md`; fitted type values come from `research/specs/typography.md`,
Recommendation and Variable-weight stem check. A list row is quoted by its element name. Detail and form
specs are not incorporated yet.

`Status` is `from spec` when the value is measured in that row and `not yet measured` when the specs
do not measure it yet — those tokens keep the value they had in the skeleton and must not be
invented. Hex digits are lower-case in `tokens.css` and upper-case in the spec; compare them
case-insensitively. Sizes are quoted in CSS px, and type sizes keep the `rem` of `tokens.css` with
the measured px in brackets.

`/dev/ui` renders every token in the `tokens` demo, where the value shown next to each sample is
read from the cascade with `getComputedStyle`, so it is never a second copy of the number.

The Value column quotes hex digits and pixel values as documentation. They are not code: no `.ts`
or `.tsx` file in this directory contains a colour literal or an arbitrary Tailwind value, which is
what the "no colour constants" rule forbids.

| Token | Value | Spec file and Visual layout row | Status |
| --- | --- | --- | --- |
| `--color-bg` | `#eef1f9` | app-shell.md › Main content › Bounds and page surface › "Leads `#EEF1F9`"; list-views.md › Leads content canvas › "pale blue-gray `#EEF1F9`"; Surface and line colors › "Main canvas `#EEF1F9`" | from spec |
| `--color-surface` | `#ffffff` | app-shell.md › Colour summary › "`#FFFFFF` › Top bar, Home main surface, utility strip, menu, active text approx."; list-views.md › Surface and line colors › "cards `#FFFFFF`"; Records table › "white `#FFFFFF`"; Table footer › "white" | from spec |
| `--color-text` | `#313949` | app-shell.md › Colour summary › "`#313949` › Page title/menu text approx.; search dimmer source colour"; list-views.md › Text roles › "toolbar labels about 14 px medium `#313949`"; "ordinary cells about 14 px regular `#313949`" | from spec |
| `--color-text-muted` | `#616e88` | app-shell.md › Colour summary › "`#616E88` › Top-bar line icons, approx." | from spec |
| `--color-text-placeholder` | `#8c91ab` | app-shell.md › Colour summary › "`#8C91AB` › Global search placeholder, approx."; list-views.md › Text roles › "Placeholder and subdued text `#8C91AB`" | from spec |
| `--color-border` | `#ced0e1` | app-shell.md › Colour summary › "`#CED0E1` › More Actions menu edge and dividers" | from spec |
| `--color-primary` | `#5464f2` | app-shell.md › Colour summary › "`#5464F2` › Sales folder icon, quick-create border, and open search outline"; list-views.md › Selected / disabled › "glyph `#5464F2`" | from spec |
| `--color-primary-text` | `#ffffff` | list-views.md › Create and action buttons › "white `#FFFFFF` label" | from spec |
| `--color-primary-hover` | `#1d4ed8` | No hover state was captured. The list spec does not measure a primary hover either | not yet measured |
| `--color-primary-pressed` | `#1e40af` | No pressed state was captured. The list spec does not measure a primary pressed state either | not yet measured |
| `--color-primary-subtle` | `#f0f1ff` | app-shell.md › Colour summary › "`#F0F1FF` › Quick-create button interior"; list-views.md › Selected / disabled › "with fill `#F0F1FF`" | from spec |
| `--color-danger` | `#b91c1c` | No destructive state in the app shell spec. The list spec does not measure one either | not yet measured |
| `--color-danger-text` | `#ffffff` | No destructive state in the app shell spec. The list spec does not measure one either | not yet measured |
| `--color-danger-hover` | `#991b1b` | No destructive state in the app shell spec. The list spec does not measure one either | not yet measured |
| `--color-danger-pressed` | `#7f1d1d` | No destructive state in the app shell spec. The list spec does not measure one either | not yet measured |
| `--color-success` | `#047857` | No success state in the app shell spec. The list spec does not measure one either | not yet measured |
| `--color-success-text` | `#ffffff` | No success state in the app shell spec. The list spec does not measure one either | not yet measured |
| `--color-success-hover` | `#065f46` | No success state in the app shell spec. The list spec does not measure one either | not yet measured |
| `--color-success-pressed` | `#064e3b` | No success state in the app shell spec. The list spec does not measure one either | not yet measured |
| `--color-warning` | `#92400e` | No warning state in the app shell spec. The list spec does not measure one either | not yet measured |
| `--color-warning-text` | `#ffffff` | No warning state in the app shell spec. The list spec does not measure one either | not yet measured |
| `--color-warning-hover` | `#78350f` | No warning state in the app shell spec. The list spec does not measure one either | not yet measured |
| `--color-warning-pressed` | `#652b0d` | No warning state in the app shell spec. The list spec does not measure one either | not yet measured |
| `--color-surface-hover` | `#f0f4fc` | app-shell.md › Colour summary › "`#F0F4FC` › Highlighted More Actions row"; list-views.md › Selected / disabled › "highlighted settings-menu row 250 × 30 px with fill `#F0F4FC`" | from spec |
| `--color-surface-pressed` | `#e5e7eb` | No pressed surface was captured. The list spec does not measure a pressed surface either | not yet measured |
| `--color-focus-ring` | `#5464f2` | app-shell.md › Global search input › Footprint › "Blue `#5464F2` outline is visible" | from spec |
| `--color-overlay` | `#313949` | app-shell.md › Global search dimmer › Area and colour › "`#313949` at approx. 50% opacity" | from spec |
| `--color-rail-surface` | `#223458` | app-shell.md › Colour summary › "`#223458` › Rail surface and empty local Search interior" | from spec |
| `--color-rail-surface-raised` | `#374d7f` | app-shell.md › Colour summary › "`#374D7F` › Open teamspace overflow trigger" | from spec |
| `--color-rail-border` | `#505d81` | app-shell.md › Colour summary › "`#505D81` › Rail divider and local Search border" | from spec |
| `--color-rail-text` | `#c2cbde` | app-shell.md › Colour summary › "`#C2CBDE` › Rail labels and chevrons, approx."; also Rail/group heading › "`#C2CBDE` approx." | from spec |
| `--color-rail-icon` | `#7d8aa7` | app-shell.md › Colour summary › "`#7D8AA7` › Unselected nested-link icon" | from spec |
| `--color-rail-placeholder` | `#7a859b` | app-shell.md › Colour summary › "`#7A859B` › Local Search placeholder, approx." | from spec |
| `--color-rail-scrollbar` | `#aaaaaa` | app-shell.md › Colour summary › "`#AAAAAA` › Visible rail scrollbar thumb in Leads" | from spec |
| `--color-rail-item-active` | `#31446f` | app-shell.md › Colour summary › "`#31446F` › Active Home/Leads row" | from spec |
| `--color-rail-item-active-text` | `#ffffff` | app-shell.md › Rail/active row › Box, fill, text, indicator › "`#FFFFFF` approx. 15 px semibold" | from spec |
| `--color-topbar-surface` | `#ffffff` | app-shell.md › Top bar › Bounds and surface › "50 high; `#FFFFFF`" | from spec |
| `--color-topbar-border` | `#dcdbee` | app-shell.md › Colour summary › "`#DCDBEE` › Top-bar lower rule" | from spec |
| `--color-menu-surface` | `#ffffff` | app-shell.md › Teamspace More Actions menu › Surface, edge, corners, shadow › "`#FFFFFF` fill" | from spec |
| `--color-utility-border` | `#c5c4d3` | app-shell.md › Colour summary › "`#C5C4D3` › Utility-strip cell rules" | from spec |
| `--color-utility-help` | `#7875e6` | app-shell.md › Colour summary › "`#7875E6` › Help utility cell" | from spec |
| `--color-monogram` | `#00b96f` | app-shell.md › Colour summary › "`#00B96F` › Teamspace monogram block" | from spec |
| `--color-avatar` | `#dbdfe8` | app-shell.md › Colour summary › "`#DBDFE8` › Avatar disk" | from spec |
| `--color-accent-blue` | `#5a78ff` | app-shell.md › Colour summary › "`#5A78FF` › Functional accent colours in pinned-link icons; replace with original drawn icons" | from spec |
| `--color-accent-orange` | `#ff7621` | app-shell.md › Colour summary › "`#FF7621` › Functional accent colours in pinned-link icons" | from spec |
| `--color-accent-pink` | `#ee3275` | app-shell.md › Colour summary › "`#EE3275` › Functional accent colours in pinned-link icons" | from spec |
| `--color-accent-purple` | `#a247ea` | app-shell.md › Colour summary › "`#A247EA` › Functional accent colours in pinned-link icons" | from spec |
| `--color-accent-amber` | `#f18e0a` | app-shell.md › Colour summary › "`#F18E0A` › Functional accent colours in pinned-link icons" | from spec |
| `--color-accent-yellow` | `#e7b910` | app-shell.md › Colour summary › "`#E7B910` › Functional accent colours in pinned-link icons" | from spec |
| `--color-panel-border` | `#dcdbee` | list-views.md › Surface and line colors › "panel and table outline 1 px `#DCDBEE`"; Table header and rows › "2 px `#DCDBEE` bottom border" and "1 px `#DCDBEE` vertical dividers"; Table footer › "two 1 px `#DCDBEE` lines" | from spec |
| `--color-row-separator` | `#edf0f4` | list-views.md › Surface and line colors › "horizontal row separators 1 px `#EDF0F4`"; Table header and rows › "1 px `#EDF0F4` separator" | from spec |
| `--color-control-border` | `#c5c4d3` | list-views.md › Surface and line colors › "filter search outline and unchecked checkbox border `#C5C4D3`"; Selected / disabled › "2 px `#C5C4D3` border" | from spec |
| `--color-button-border` | `#d5d8e9` | list-views.md › Create and action buttons › "1 px `#D5D8E9` border" | from spec |
| `--color-button-gradient-start` | `#fefefe` | list-views.md › Create and action buttons › "light vertical gradient fill from `#FEFEFE` at top" | from spec |
| `--color-button-gradient-end` | `#f2f1f8` | list-views.md › Create and action buttons › "to `#F2F1F8` at bottom" | from spec |
| `--color-primary-gradient-start` | `#5767f6` | list-views.md › Create and action buttons › "vertical gradient `#5767F6` at top" | from spec |
| `--color-primary-gradient-end` | `#154ec5` | list-views.md › Create and action buttons › "to `#154EC5` at bottom" | from spec |
| `--color-primary-divider` | `#c3c8f4` | list-views.md › Create and action buttons › "1 px `#C3C8F4` divider" | from spec |
| `--color-primary-disabled` | `#adb3ee` | list-views.md › Sort popover › "flat `#ADB3EE` fill" | from spec |
| `--color-popover-sort-border` | `#ced0e1` | list-views.md › Sort popover › "1 px `#CED0E1` border" | from spec |
| `--color-surface-selected` | `#f0f4fc` | list-views.md › Header and tab strip › "with 6 px corners and `#F0F4FC` fill" | from spec |
| `--color-surface-active` | `#edf0f9` | list-views.md › Selected / disabled › "Active Filter button 69.5 × 27 px with fill `#EDF0F9`" | from spec |
| `--color-text-strong` | `#202123` | list-views.md › Text roles › "column headers about 14 px medium `#202123`" | from spec |
| `--color-text-disabled` | `#b5b8be` | list-views.md › Text roles › "disabled pagination text/icon about `#B5B8BE`"; Selected / disabled › "Disabled pagination arrows about `#B5B8BE`" | from spec |
| `--font-sans` | `"Figtree", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif` | typography.md › Recommendation › Adopted Figtree; board selection (MEP-66, 2026-10-04) | from spec |
| `--font-mono` | system stack | No monospaced text in the app shell spec | not yet measured |
| `--font-weight-normal` | `400` | app-shell.md › Type summary › "regular" (Rail fixed link, Rail child link, Rail Search placeholder, Top-bar search placeholder, Menu item, Utility label); list-views.md › Text roles › "ordinary cells about 14 px regular" | from spec |
| `--font-weight-medium` | `500` | list-views.md › Text roles › "toolbar labels about 14 px medium"; "column headers about 14 px medium"; Figtree fit pending (MEP-95) | from spec |
| `--font-weight-semibold` | `510` | typography.md › Variable-weight stem check › `wght` 510, stem 1.69 CSS px; Recommendation › bold roles | from spec |
| `--text-2xs` | `0.53125rem` (8.5px) | typography.md › Recommendation › Utility label › 8.5px / 400 | from spec |
| `--text-xs` | `0.71875rem` (11.5px) | typography.md › Recommendation › Help utility label › 11.5px / 510 | from spec |
| `--text-13` | `0.8125rem` (13px) | list-views.md › Text roles › "View tab about 13 px semibold"; Table footer › "text about 13 px"; Figtree fit pending (MEP-95) | from spec |
| `--text-sm` | `0.84375rem` (13.5px) | typography.md › Recommendation › Top-bar search placeholder › 13.5px / 400 | from spec |
| `--text-md` | `0.90625rem` (14.5px) | typography.md › Recommendation › Rail fixed / active / child link, Group heading, Rail Search placeholder, Menu item › 14.5px | from spec |
| `--text-base` | `1rem` (16px, provisional) | typography.md › Recommendation › Product selector, Teamspace selector › 16px (provisional); generic selector text could not be measured | from spec |
| `--text-lg` | `1.125rem` (18px) | No measured 18 px style. The list spec does not measure an 18 px style either | not yet measured |
| `--text-xl` | `1.15625rem` (18.5px) | typography.md › Recommendation › Page title › 18.5px / 510 | from spec |
| `--text-2xl` | `1.5rem` (24px) | No measured 24 px style. The list spec does not measure a 24 px style either | not yet measured |
| `--text-3xl` | `1.875rem` (30px) | No measured 30 px style. The list spec does not measure a 30 px style either | not yet measured |
| `--radius-sm` | `0.125rem` (2px) | list-views.md › Selected / disabled › "Unselected checkboxes about 15 × 15 px with 2 px `#C5C4D3` border and 2–3 px radius". The token keeps the 2 px end of that range | from spec |
| `--radius-md` | `0.375rem` (6px) | app-shell.md › Rail/active row › "approx. 6 px radius"; the same radius is measured on Rail/local Search, Top bar/right controls (quick create), Teamspace More Actions menu and its highlighted row, Top bar/global search, and Global search panel; list-views.md › Header and tab strip › "6 px corners"; Filter panel, Records table, Create and action buttons, View options popover, Create More / Actions menus, View Settings popover and Sort popover use the same 6 px corners | from spec |
| `--radius-lg` | `0.5rem` (8px) | list-views.md › View edit form › "8 px corners" | from spec |
| `--radius-xl` | `1rem` (16px) | list-views.md › Manage Columns dialog › "about 16 px corners" | from spec |
| `--radius-full` | `9999px` | app-shell.md › Top bar/right controls › Order, sizing, spacing › "Avatar is about 30 x 30 circular" | from spec |
| `--shadow-sm` | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` | app-shell.md › Bottom utility strip › "exact blur parameters are **not measurable from capture**"; Teamspace More Actions menu › "blur/spread and opacity are **not measurable from capture**". The list spec only says "soft shadow" on the view-options, actions and settings popovers, so it does not measure blur, spread or opacity either | not yet measured |
| `--shadow-md` | `0 4px 6px -1px rgba(0, 0, 0, 0.1)` | Same shell rows, and the list spec does not measure shadow parameters either | not yet measured |
| `--shadow-lg` | `0 10px 15px -3px rgba(0, 0, 0, 0.1)` | Same shell rows, and the list spec does not measure shadow parameters either | not yet measured |
| `--space-1` | `0.25rem` (4px) | Generic scale; the measured gaps carry their own `--size-*` token below | not yet measured |
| `--space-2` | `0.5rem` (8px) | Generic scale; the measured gaps carry their own `--size-*` token below | not yet measured |
| `--space-3` | `0.75rem` (12px) | Generic scale; the measured gaps carry their own `--size-*` token below | not yet measured |
| `--space-4` | `1rem` (16px) | Generic scale; the measured gaps carry their own `--size-*` token below | not yet measured |
| `--space-6` | `1.5rem` (24px) | Generic scale; the measured gaps carry their own `--size-*` token below | not yet measured |
| `--space-8` | `2rem` (32px) | Generic scale; the measured gaps carry their own `--size-*` token below | not yet measured |
| `--size-rail-width` | `320px` | app-shell.md › Navigation rail › Bounds and surface › "x 0-320, y 0-807; 320 wide"; list-views.md › Leads content canvas › "Starts after the 320 px shell sidebar" | from spec |
| `--size-topbar-height` | `50px` | app-shell.md › Top bar › Bounds and surface › "x 320-1470, y 0-50; 50 high"; list-views.md › Header and tab strip › "Header about 50 px high" | from spec |
| `--size-utility-strip-height` | `28px` | app-shell.md › Bottom utility strip › Bounds, surface, and elevation › "x 0-1470, y 807-835; 28 high" | from spec |
| `--size-topbar-title-inset` | `16px` | app-shell.md › Top bar/page title › Position and type › "left x 336 (16 px from content edge)" | from spec |
| `--size-rail-row-width` | `300px` | app-shell.md › Rail/pinned rows › Row box and rhythm › "x 10-310; 300 wide x 30 high" | from spec |
| `--size-rail-row-height` | `30px` | app-shell.md › Rail/pinned rows › Row box and rhythm › "300 wide x 30 high"; also Rail/active row and Rail/nested link | from spec |
| `--size-rail-row-gap` | `6px` | app-shell.md › Rail/pinned rows › Row box and rhythm › "6 px between rows" | from spec |
| `--size-rail-row-pitch` | `36px` | app-shell.md › Rail/pinned rows › Row box and rhythm › "starts y 55, then 36 px vertical pitch" | from spec |
| `--size-rail-nested-row-pitch` | `32px` | app-shell.md › Rail/nested link › Row and indent › "32 px pitch" | from spec |
| `--size-rail-inset` | `10px` | app-shell.md › Rail/pinned rows › Row box and rhythm › "10 px side inset" | from spec |
| `--size-rail-nested-indent` | `30px` | app-shell.md › Rail/nested link › Row and indent › "Indent from fixed-link label is 30 px" | from spec |
| `--size-rail-label-gap` | `12px` | app-shell.md › Rail/pinned link › Icon, label, and type › "label starts x 48; approx. 12 px gap" | from spec |
| `--size-rail-icon` | `16px` | app-shell.md › Rail/pinned link › "icon approx. 16 x 16 at x 20-36"; also Rail/nested link › "icon approx. 16 x 16" | from spec |
| `--size-rail-group-icon` | `14px` | app-shell.md › Rail/group heading › Row, icon, label, chevron › "icon approx. 14 x 14 at x 21-35" | from spec |
| `--size-rail-search-icon` | `15px` | app-shell.md › Rail/local Search › Input box › "Search icon approx. 15 x 15 at x 20-35" | from spec |
| `--size-rail-scrollbar-width` | `8px` | app-shell.md › Rail/scrollbar › Visible thumb › "x 312-320 ... 8 px wide" | from spec |
| `--size-rail-group-gap` | `9px` | app-shell.md › Rail/group heading › Row, icon, label, chevron › "top gap after local Search is about 9 px" | from spec |
| `--size-rail-header-inset` | `15px` | app-shell.md › Rail/product selector › Visible occupied box › "x 15-150, y 11-41" | from spec |
| `--size-rail-product-selector-height` | `30px` | app-shell.md › Rail/product selector › Visible occupied box › "30 high" | from spec |
| `--size-rail-product-mark` | `30px` | app-shell.md › Rail/product selector › Visible occupied box › "Product mark occupies x 15-45, 30 x 30" | from spec |
| `--size-rail-selector-height` | `24px` | app-shell.md › Rail/teamspace selector › Occupied row › "y 289-313; about 24 high" | from spec |
| `--size-rail-selector-inset` | `13px` | app-shell.md › Rail/teamspace selector › Occupied row › "left inset 13 px" | from spec |
| `--size-rail-monogram` | `24px` | app-shell.md › Rail/teamspace selector › Occupied row › "24 x 24 coloured monogram block at x 13-37" | from spec |
| `--size-rail-overflow-trigger` | `30px` | app-shell.md › Rail/teamspace overflow trigger › Icon bounds › "Open trigger gains `#374D7F` fill in a 30 x 30 box" | from spec |
| `--size-topbar-icon` | `18px` | app-shell.md › Top bar/right controls › Order, sizing, spacing › "other line icons about 18 x 18"; "applications grid is about 18 x 18" | from spec |
| `--size-topbar-control-pitch` | `34px` | app-shell.md › Top bar/right controls › Order, sizing, spacing › "icon centres roughly 34 px apart after quick create" | from spec |
| `--size-topbar-quick-create` | `28px` | app-shell.md › Top bar/right controls › Order, sizing, spacing › "Quick-create box x 1176-1204, y 10-38 (28 x 28)" | from spec |
| `--size-topbar-avatar` | `30px` | app-shell.md › Top bar/right controls › Order, sizing, spacing › "Avatar is about 30 x 30 circular" | from spec |
| `--size-topbar-search-width` | `235px` | app-shell.md › Top bar/global search › Footprint › "x 929-1164, y 8-40; 235 x 32" | from spec |
| `--size-topbar-search-height` | `32px` | app-shell.md › Top bar/global search › Footprint › "235 x 32" | from spec |
| `--size-topbar-search-icon` | `17px` | app-shell.md › Top bar/global search › Footprint › "Search glyph approx. 17 x 17" | from spec |
| `--size-menu-width` | `237px` | app-shell.md › Teamspace More Actions menu › Outer bounds and placement › "about 237 x 187" | from spec |
| `--size-menu-offset` | `18px` | app-shell.md › Teamspace More Actions menu › Outer bounds and placement › "about 18 px to its right" | from spec |
| `--size-menu-inset` | `6px` | app-shell.md › Teamspace More Actions menu › Item geometry › "inner horizontal inset 6 px" | from spec |
| `--size-menu-item-height` | `30px` | app-shell.md › Teamspace More Actions menu › Item geometry › "first three visible bands about 30 px high"; list-views.md › View options popover › "30 px option rows"; View Settings popover › "rows around 30 px high"; Selected / disabled › "highlighted settings-menu row 250 × 30 px" | from spec |
| `--size-menu-icon` | `16px` | app-shell.md › Teamspace More Actions menu › Item geometry › "icon approx. 16 x 16" | from spec |
| `--size-menu-label-gap` | `12px` | app-shell.md › Teamspace More Actions menu › Item geometry › "about 12 px between icon and label" | from spec |
| `--size-list-inset` | `16px` | list-views.md › Leads content canvas › "16 px content inset" | from spec |
| `--size-list-tab-height` | `42px` | list-views.md › Header and tab strip › "tab strip about 42 px high" | from spec |
| `--size-list-pill-width` | `75.5px` | list-views.md › Header and tab strip › "selected view pill 75.5 × 26 px" | from spec |
| `--size-list-pill-height` | `26px` | list-views.md › Header and tab strip › "selected view pill 75.5 × 26 px" | from spec |
| `--size-list-toolbar-height` | `47px` | list-views.md › Toolbar › "About 47 px high below tab strip" | from spec |
| `--size-list-filter-width` | `202px` | list-views.md › Filter panel › "202 px wide including its 1 px borders" | from spec |
| `--size-list-filter-gap` | `10px` | list-views.md › Filter panel › "10 px gap to the table" | from spec |
| `--size-list-filter-padding` | `18px` | list-views.md › Filter panel › "18 px horizontal inner padding" | from spec |
| `--size-list-filter-search-height` | `34px` | list-views.md › Filter content › "placeholder about 34 px high" | from spec |
| `--size-list-filter-row-height` | `30px` | list-views.md › Filter content › "checkbox rows about 30 px high" | from spec |
| `--size-list-filter-button-width` | `69.5px` | list-views.md › Selected / disabled › "Active Filter button 69.5 × 27 px" | from spec |
| `--size-list-filter-button-height` | `27px` | list-views.md › Selected / disabled › "Active Filter button 69.5 × 27 px" | from spec |
| `--size-list-header-height` | `37px` | list-views.md › Table header and rows › "Header 37 px high: 35 px white plus a 2 px `#DCDBEE` bottom border". The 37 px box includes that border | from spec |
| `--size-list-header-border` | `2px` | list-views.md › Table header and rows › "2 px `#DCDBEE` bottom border" | from spec |
| `--size-list-row-height` | `54px` | list-views.md › Table header and rows › "54 px plus a 1 px `#EDF0F4` separator" | from spec |
| `--size-list-row-pitch` | `55px` | list-views.md › Table header and rows › "repeat every 55 px (54 px plus a 1 px `#EDF0F4` separator)" | from spec |
| `--size-list-leading-width` | `240px` | list-views.md › Leading table strips › "From the table edge at x=548 to the first data column edge at x=788 (240 px)" | from spec |
| `--size-list-leading-pair-width` | `100px` | list-views.md › Leading table strips › "The unlabeled leading cell and the selection cell together span 100 px" | from spec |
| `--size-list-badge-width` | `140px` | list-views.md › Leading table strips › "The badge strip is 140 px" | from spec |
| `--size-list-column-width` | `200px` | list-views.md › Data and trailing column widths › "200 px per column" | from spec |
| `--size-list-cell-inset` | `12px` | list-views.md › Data and trailing column widths › "Header and cell text starts 12 px inside the column edge" | from spec |
| `--size-list-settings-width` | `40px` | list-views.md › Data and trailing column widths › "View Settings occupies 40 px at the right edge" | from spec |
| `--size-list-settings-row-width` | `250px` | list-views.md › Selected / disabled › "highlighted settings-menu row 250 × 30 px" | from spec |
| `--size-list-footer-height` | `31px` | list-views.md › Table footer › "31 px high between two 1 px `#DCDBEE` lines". The 31 px band is between the lines; the lines are not included | from spec |
| `--size-list-view-icon` | `26px` | list-views.md › Selected / disabled › "active list presentation icon tile 26 × 26 px" | from spec |
| `--size-list-view-name-width` | `600px` | list-views.md › View edit form › "name input spans roughly 600 px" | from spec |
| `--size-list-column-lane-width` | `280px` | list-views.md › View edit form › "selected-column lane about 280 px wide" | from spec |
| `--size-button-split-width` | `137.5px` | list-views.md › Create and action buttons › "Split Create Lead 137.5 × 33 px" | from spec |
| `--size-button-split-height` | `33px` | list-views.md › Create and action buttons › "Split Create Lead 137.5 × 33 px" | from spec |
| `--size-button-split-primary` | `102.5px` | list-views.md › Create and action buttons › "primary segment 102.5 px" | from spec |
| `--size-button-split-arrow` | `34px` | list-views.md › Create and action buttons › "a 34 px arrow segment" | from spec |
| `--size-button-gap` | `8.5px` | list-views.md › Create and action buttons › "An 8.5 px gap separates it from the ellipsis button" | from spec |
| `--size-button-ellipsis-width` | `44px` | list-views.md › Create and action buttons › "ellipsis button, which is 44 × 32 px" | from spec |
| `--size-button-ellipsis-height` | `32px` | list-views.md › Create and action buttons › "ellipsis button, which is 44 × 32 px" | from spec |
| `--size-checkbox` | `15px` | list-views.md › Selected / disabled › "Unselected checkboxes about 15 × 15 px"; Leading table strips › "The 15 × 15 px checkbox" | from spec |
| `--size-checkbox-border` | `2px` | list-views.md › Selected / disabled › "2 px `#C5C4D3` border"; Surface and line colors › "checkbox outline about 2 px" | from spec |
| `--size-dialog-width` | `400px` | list-views.md › Manage Columns dialog › "about 400 px wide" | from spec |
| `--size-dialog-height` | `770px` | list-views.md › Manage Columns dialog › "770 px high" | from spec |
| `--size-dialog-padding` | `30px` | list-views.md › Manage Columns dialog › "30 px inner padding" | from spec |
| `--size-popover-view-width` | `128px` | list-views.md › View options popover › "About 128 px wide" | from spec |
| `--size-popover-import-width` | `180px` | list-views.md › Create More / Actions menus › "Import menu about 180 px wide" | from spec |
| `--size-popover-actions-width` | `200px` | list-views.md › Create More / Actions menus › "Actions menu about 200 px wide" | from spec |
| `--size-popover-settings-width` | `264px` | list-views.md › View Settings popover › "About 264 px wide" | from spec |
| `--size-popover-sort-width` | `385px` | list-views.md › Sort popover › "About 385 × 157 px" | from spec |
| `--size-popover-sort-height` | `157px` | list-views.md › Sort popover › "About 385 × 157 px" | from spec |
| `--size-popover-sort-field-width` | `150px` | list-views.md › Sort popover › "two side-by-side selectors around 150 px wide" | from spec |
| `--size-popover-sort-field-height` | `28px` | list-views.md › Sort popover › "28 px high" | from spec |
| `--size-popover-sort-field-top` | `57px` | list-views.md › Sort popover › "Both selectors sit at y 195–223"; outer box "y 138–296" (195 − 138) | from spec |
| `--size-popover-sort-inset-inline` | `31px` | list-views.md › Sort popover › "31 px from the outer left edge" | from spec |
| `--size-popover-sort-inset-end` | `39px` | list-views.md › Sort popover › "39 px from the outer right edge" | from spec |
| `--size-popover-sort-field-gap` | `15px` | list-views.md › Sort popover › "after a 15 px gap" | from spec |
| `--size-popover-sort-label-gap` | `18px` | list-views.md › Sort popover › "glyphs at x 444.5–489.5, y 162–174.5" | from spec |
| `--size-popover-sort-actions-offset` | `20px` | list-views.md › Sort popover › "20 px below the selectors" | from spec |
| `--size-popover-sort-button-height` | `27px` | list-views.md › Sort popover › "27 px high" | from spec |
| `--size-popover-sort-cancel-width` | `66.5px` | list-views.md › Sort popover › "Cancel is 66.5 px wide" | from spec |
| `--size-popover-sort-apply-width` | `60px` | list-views.md › Sort popover › "disabled Apply is 60 px wide" | from spec |
| `--size-popover-sort-button-gap` | `8px` | list-views.md › Sort popover › "after an 8 px gap" | from spec |

### Typeface

The board selected **Figtree** on 2026-10-04 (MEP-66). We serve our chosen open-license
font from its official source; we never copy the reference CRM's font files.

- Official file: https://github.com/erikdkennedy/figtree/raw/master/fonts/variable/Figtree%5Bwght%5D.ttf
- Embedded version: `Version 2.001`; variable `wght` axis 300–900, normal style.
- File: `apps/web/src/app/fonts/figtree/figtree-variable.ttf`, unchanged bytes.
- SHA-256: `c8d9e77bb970c18f7b55fd2d8c91f86c9e9cc42696da9c3e7bc4fffba1d3ef5a`.
- License: SIL OFL 1.1, unchanged `OFL.txt` beside the font.
- Official license: https://github.com/erikdkennedy/figtree/raw/master/OFL.txt
- License SHA-256: `140d37233e7f3ce7313798befa9600893bcceaf41a55fa0fa5ad52f7f657a268`.

To replace the typeface, update `--font-sans`, the single `@font-face` in `tokens.css`,
and the font folder with the official file and license. Then refit the size and weight
measurements in `typography.md`, update the tokens and this table, and verify the checksums,
rendered widths and weight axis. Components inherit `--font-sans` and need no family edits.

### Measured values that carry no token

These are in the Visual layout section but are not tokens, with the reason for each. They are not
gaps in the table above.

- **CSS line-height of every style.** The Type summary marks it "not measurable from capture" for
  all twelve styles, because each label appears on a single line. No `--leading-*` token exists.
- **Shadow blur, spread and opacity.** The utility strip ("about 7 px above it, from `#FEFEFE` to
  about `#E7E7E7` over white") and the More Actions menu both say the parameters are not measurable
  from capture, so the three `--shadow-*` tokens keep their skeleton values.
- **The dimmed surfaces `#989CA4` and `#293651`.** They are the result of `--color-overlay` at
  approx. 50% over `--color-surface` and `--color-rail-surface`. Compositing the tokens reproduces
  `#989CA4` exactly and lands one step away from `#293651` (`#2A3751`), which is what the spec's
  "approx. 50%" allows, so neither needs a token of its own.
- **The 1 px width of every measured rule.** The top-bar lower rule, the rail divider, the local
  Search border, the menu edge, the menu dividers and the quick-create border are all 1 px, which is
  the width Tailwind's `border` already gives.
- **The absence of a rail border.** "sharp edge at x 320, with no distinct right border" is a note
  for the shell, not a value.
- **Positions and viewport-derived bounds.** Rail rows start at y 55, the teamspace divider is at
  y 277-278, the selector row at y 289-313, the local Search at y 324-354, the Sales heading is
  centred at y 377, Activities is near y 601 and Integrations near y 729, the open menu is 187 high
  with a notch reaching x 322 and dividers at y 389 and y 430, the main content is 1150 x 757, and
  the strip clusters are "five roughly 58 px slots" and "roughly 49 px icon cells". These are
  coordinates of one 1470 x 835 viewport or content-driven results, not reusable metrics. The
  utility strip itself is `later` scope.
- **Global search panel and input geometry**, "about 808.5 x 675" and "about 788 x 40". The feature
  is `later` scope, the spec says only geometry is in scope, and both boxes are viewport
  coordinates rather than design metrics.
- **Glyph-only icon bounds.** The Hide Menu icon ("approx. 18 x 16", with "no labelled button box")
  and the overflow trigger glyph ("approx. 14 x 4") are artwork we redraw from our own icon set, so
  only their control boxes are tokenized. The implied label gaps of the nested link (x 64 to x 78)
  and the group heading (x 35 to x 48) are not stated as values.
- **Menu bands "between dividers about 40 px high"**, whose "row-box heights are **not measurable
  from capture**".

The list spec (`research/specs/list-views.md`, Visual layout) also measures values that carry no
token:

- **Ranges.** Toolbar gaps are "8–12 px" (Toolbar). View edit form inner padding is "28–32 px"
  (View edit form). The checkbox corner is "2–3 px"; `--radius-sm` keeps the 2 px end of that range
  and the range is not a second token.
- **Positions.** Filter-panel and table origins, column edges, the checkbox at x 623–638, the split
  divider at x=1362, View Settings at x 1414–1454, and the ribbon's x/y are coordinates of one
  1470 × 835 capture.
- **The records table "width about 908 px"** (Records table). It is the visible width in that
  viewport, not a reusable metric.
- **The 35 px white band** inside the table header. It is the 37 px header (`--size-list-header-height`)
  minus the 2 px bottom border (`--size-list-header-border`).
- **The first data row at 53 px.** The repeating row is 54 px plus a 1 px separator; 53 px is a
  single-capture exception, not a second row height.
- **Individual widths of the two leading cells.** They "together span 100 px" and "the header shows
  no divider between them, so their individual widths are not measurable."
- **1 px rules in the list.** Search outline, panel and table outline, row separator, header
  dividers, footer lines, the split divider and the ellipsis border are 1 px, which Tailwind's
  `border` already gives. The 2 px checkbox outline and the 2 px header rule are tokenized because
  they are not 1 px.
- **Activity ribbon.** Pale `#FFECEC` fill, activity icon `#FF5D5A` (about 11 × 12 px), date text
  `#F14949`, and the 72 × 24 px notched ribbon that starts 11 px inside the badge strip. The ribbon
  component belongs to the Activities module; its colours and size become tokens then.
- **Soft shadows without parameters.** View options, import/actions and settings popovers say only
  "soft shadow" or "shadow".
- **Colours stated without a hex.** "hovered row pale blue", "disabled view-menu entries are muted
  gray", and the Manage Columns "dark translucent scrim".
- **Sort By glyph band.** "glyphs at x 444.5–489.5, y 162–174.5" is ink, not a DOM box, so it is
  not a size token. `--size-popover-sort-label-gap` is the gap that places the label above the
  selector; the rendered ink top is measured from our own screenshot.
- **Second selector's initial fill.** "a `#F5F6F8` fill and a 1 px `#D2D9F1` border" was captured,
  but "whether it is disabled until a field is chosen was not captured", so neither colour is a
  token and the control is not drawn that way.

### Contrast notes

ADR 0003 §8 requires WCAG 2.1 AA: 4.5:1 for text and 3:1 for the non-text parts of a control. The
ratios below are computed from the token values with the WCAG relative-luminance formula.

Measured pairs that reach AA:

| Pair | Ratio |
| --- | --- |
| `--color-text-strong` on `--color-surface` | 16.11:1 |
| `--color-text` on `--color-surface` | 11.59:1 |
| `--color-text` on `--color-surface-selected` | 10.51:1 |
| `--color-text` on `--color-bg` | 10.26:1 |
| `--color-text` on `--color-surface-active` | 10.17:1 |
| `--color-rail-item-active-text` on `--color-rail-item-active` | 9.60:1 |
| `--color-rail-text` on `--color-rail-surface` | 7.58:1 |
| `--color-text-muted` on `--color-surface` | 5.13:1 |
| `--color-primary` on `--color-surface` | 4.69:1 |
| `--color-primary-text` on `--color-primary-gradient-end` | 7.17:1 |
| `--color-primary-text` on `--color-primary` | 4.69:1 |
| `--color-primary` on `--color-primary-subtle` | 4.18:1, non-text |
| `--color-text-muted` on `--color-surface-hover` | 4.65:1 |
| `--color-text-muted` on `--color-bg` | 4.54:1 |
| `--color-rail-icon` on `--color-rail-surface` | 3.57:1, non-text |
| `--color-focus-ring` on `--color-surface` | 4.69:1, non-text |

Measured pairs that stay below AA. Their values are kept exactly as measured and no check is
disabled. The board decided on 2026-10-04 that placeholder text and separator lines keep the
measured look; ADR 0003 §8 records that exception and its limits.

| Pair | Ratio | Where the reference uses it |
| --- | --- | --- |
| `--color-text-placeholder` `#8c91ab` on `--color-bg` `#eef1f9` | 2.75:1 | Top bar/global search › Footprint › "placeholder approx. 14 px regular, `#8C91AB` approx." |
| `--color-text-placeholder` `#8c91ab` on `--color-surface` | 3.11:1 | The same placeholder token on a panel |
| `--color-rail-placeholder` `#7a859b` on `--color-rail-surface` | 3.33:1 | Rail/local Search › Input box › "`#7A859B` approx." |
| `--color-primary` on `--color-bg` | 4.15:1 | The primary colour is measured as an icon, a border and an outline, never as text on the page surface. list-views.md › Text roles measures Lead Name and Email in the body colour even when linked ("rather than the blue action color"), so there is no separate link token |
| `--color-text-disabled` `#b5b8be` on `--color-surface` | 1.99:1 | list-views.md › Text roles › "disabled pagination text/icon about `#B5B8BE`"; Selected / disabled › "Disabled pagination arrows about `#B5B8BE`" |
| `--color-primary-text` `#ffffff` on `--color-primary-gradient-start` `#5767f6` | 4.49:1 | list-views.md › Create and action buttons › "vertical gradient `#5767F6` at top to `#154EC5` at bottom, white `#FFFFFF` label". The darker end of the same gradient passes at 7.17:1 |
| `--color-primary-text` `#ffffff` on `--color-primary-disabled` `#adb3ee` | 2.01:1 | list-views.md › Sort popover › "flat `#ADB3EE` fill and a white `#FFFFFF` label". Disabled controls are inactive text; the fill stays as measured |
| `--color-popover-sort-border` `#ced0e1` on `--color-surface` | 1.53:1 | list-views.md › Sort popover › "1 px `#CED0E1` border" |
| `--color-control-border` `#c5c4d3` on `--color-surface` | 1.72:1 | list-views.md › Surface and line colors › "filter search outline and unchecked checkbox border `#C5C4D3`" |
| `--color-button-border` `#d5d8e9` on `--color-button-gradient-start` `#fefefe` | 1.40:1 | list-views.md › Create and action buttons › "1 px `#D5D8E9` border" and "from `#FEFEFE` at top" |
| `--color-button-border` `#d5d8e9` on `--color-button-gradient-end` `#f2f1f8` | 1.26:1 | list-views.md › Create and action buttons › "to `#F2F1F8` at bottom" |
| `--color-primary-divider` `#c3c8f4` on `--color-primary-gradient-start` `#5767f6` | 2.76:1 | list-views.md › Create and action buttons › "1 px `#C3C8F4` divider" |
| `--color-panel-border` `#dcdbee` on `--color-surface` | 1.36:1 | list-views.md › Surface and line colors › "panel and table outline 1 px `#DCDBEE`" |
| `--color-row-separator` `#edf0f4` on `--color-surface` | 1.14:1 | list-views.md › Surface and line colors › "horizontal row separators 1 px `#EDF0F4`" |

No component consumes either placeholder token yet and `text-primary` is only rendered on a panel,
so nothing on `/dev/ui` fails AA today. The three placeholder rows fall under the ADR 0003 §8
exception: the tokens are used only for the placeholder of a real input. The last row does not:
primary-coloured text needs `--color-surface` behind it. In the list, Lead Name and Email stay on
`--color-text` when they are links (Text roles), so `--color-primary` is not a link colour there
either. It is the active presentation glyph on `--color-primary-subtle` (4.18:1, non-text).

Separators sit below the 3:1 non-text ratio and stay as measured under the same exception:
`--color-border` on a panel (1.53:1), `--color-topbar-border` on the top bar (1.36:1) and
`--color-rail-border` on the rail (1.90:1). They divide regions rather than identify a control, and
the skeleton border they replace was no darker (1.47:1). A border that outlines a control is not
covered by the exception.

The list rows in the table above are newly measured, so the placeholder and separator exceptions do
not cover them. Their values stay as measured. `--color-panel-border` and `--color-row-separator`
divide regions. `--color-control-border`, `--color-button-border` and `--color-primary-divider`
outline or split a control, and `--color-text-disabled` plus the white label on
`--color-primary-gradient-start` (4.49:1) are text. The board decides under the one-to-one look
rule; the CTO carries the list to the module gate.


## List chrome primitive composition

`SplitButton` composes a primary button or link, an optional 1 px token divider and a
separately named More menu trigger. Its item contract is `MenuAction` from `menu.tsx`.
Empty items omit both the divider and arrow. The `split-button` gallery and component
keyboard tests cover both trigger parts, plain creation and link navigation.

Button primary and secondary variants use the measured vertical gradients from the
**Create and action buttons** row of `list-views.md`, retaining existing hover/pressed
fills. A disabled primary button uses the flat `--color-primary-disabled` fill at full
opacity, with the same white label, instead of a faded copy of the enabled gradient. `toolbar`, `splitPrimary`, `splitArrow`, `actions`, `listFilter` and `listIcon` sizes consume the existing
`--size-button-*` values in the source table. `Menu.width` (`create`/`actions`) consumes
`--size-popover-import-width`/`--size-popover-actions-width` from **Create More / Actions
menus**. `Popover.hideTitle` keeps an accessible title without a visible heading;
`contentClassName` permits the fixed compact Sort layout. No token value is duplicated.
