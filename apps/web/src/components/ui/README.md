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
section are quoted as `Colour summary` and `Type summary`. Until other screen specs arrive, every
source row is in `research/specs/app-shell.md`.

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
| `--color-bg` | `#eef1f9` | app-shell.md › Main content › Bounds and page surface › "Leads `#EEF1F9`" | from spec |
| `--color-surface` | `#ffffff` | app-shell.md › Colour summary › "`#FFFFFF` › Top bar, Home main surface, utility strip, menu, active text approx." | from spec |
| `--color-text` | `#313949` | app-shell.md › Colour summary › "`#313949` › Page title/menu text approx.; search dimmer source colour" | from spec |
| `--color-text-muted` | `#616e88` | app-shell.md › Colour summary › "`#616E88` › Top-bar line icons, approx." | from spec |
| `--color-text-placeholder` | `#8c91ab` | app-shell.md › Colour summary › "`#8C91AB` › Global search placeholder, approx." | from spec |
| `--color-border` | `#ced0e1` | app-shell.md › Colour summary › "`#CED0E1` › More Actions menu edge and dividers" | from spec |
| `--color-primary` | `#5464f2` | app-shell.md › Colour summary › "`#5464F2` › Sales folder icon, quick-create border, and open search outline" | from spec |
| `--color-primary-text` | `#ffffff` | No measured text on a primary fill | not yet measured |
| `--color-primary-hover` | `#1d4ed8` | No hover state was captured | not yet measured |
| `--color-primary-pressed` | `#1e40af` | No pressed state was captured | not yet measured |
| `--color-primary-subtle` | `#f0f1ff` | app-shell.md › Colour summary › "`#F0F1FF` › Quick-create button interior" | from spec |
| `--color-danger` | `#b91c1c` | No destructive state in the app shell spec | not yet measured |
| `--color-danger-text` | `#ffffff` | No destructive state in the app shell spec | not yet measured |
| `--color-danger-hover` | `#991b1b` | No destructive state in the app shell spec | not yet measured |
| `--color-danger-pressed` | `#7f1d1d` | No destructive state in the app shell spec | not yet measured |
| `--color-success` | `#047857` | No success state in the app shell spec | not yet measured |
| `--color-success-text` | `#ffffff` | No success state in the app shell spec | not yet measured |
| `--color-success-hover` | `#065f46` | No success state in the app shell spec | not yet measured |
| `--color-success-pressed` | `#064e3b` | No success state in the app shell spec | not yet measured |
| `--color-warning` | `#92400e` | No warning state in the app shell spec | not yet measured |
| `--color-warning-text` | `#ffffff` | No warning state in the app shell spec | not yet measured |
| `--color-warning-hover` | `#78350f` | No warning state in the app shell spec | not yet measured |
| `--color-warning-pressed` | `#652b0d` | No warning state in the app shell spec | not yet measured |
| `--color-surface-hover` | `#f0f4fc` | app-shell.md › Colour summary › "`#F0F4FC` › Highlighted More Actions row" | from spec |
| `--color-surface-pressed` | `#e5e7eb` | No pressed surface was captured | not yet measured |
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
| `--font-sans` | system stack | app-shell.md › Visual layout introduction › "The type has a rounded humanist sans-serif feel with ordinary tracking; the exact font is not measurable from capture" | not yet measured |
| `--font-mono` | system stack | No monospaced text in the app shell spec | not yet measured |
| `--font-weight-normal` | `400` | app-shell.md › Type summary › "regular" (Rail fixed link, Rail child link, Rail Search placeholder, Top-bar search placeholder, Menu item, Utility label) | from spec |
| `--font-weight-semibold` | `600` | app-shell.md › Type summary › "semibold" (Product selector, Page title, Rail active link, Teamspace selector, Group heading, Help utility label) | from spec |
| `--text-2xs` | `0.5rem` (8px) | app-shell.md › Type summary › "Utility label › approx. 8 px / regular" | from spec |
| `--text-xs` | `0.75rem` (12px) | app-shell.md › Type summary › "Help utility label › approx. 12 px / semibold" | from spec |
| `--text-sm` | `0.875rem` (14px) | app-shell.md › Type summary › "Top-bar search placeholder › approx. 14 px / regular" | from spec |
| `--text-md` | `0.9375rem` (15px) | app-shell.md › Type summary › "approx. 15 px" (Rail fixed link, Rail active link, Group heading, Rail child link, Rail Search placeholder, Menu item) | from spec |
| `--text-base` | `1rem` (16px) | app-shell.md › Type summary › "approx. 16 px / semibold" (Product selector, Teamspace selector) | from spec |
| `--text-lg` | `1.125rem` (18px) | No measured 18 px style | not yet measured |
| `--text-xl` | `1.25rem` (20px) | app-shell.md › Type summary › "Page title › approx. 20 px / semibold" | from spec |
| `--text-2xl` | `1.5rem` (24px) | No measured 24 px style | not yet measured |
| `--text-3xl` | `1.875rem` (30px) | No measured 30 px style | not yet measured |
| `--radius-sm` | `0.125rem` (2px) | No measured 2 px corner | not yet measured |
| `--radius-md` | `0.375rem` (6px) | app-shell.md › Rail/active row › "approx. 6 px radius"; the same radius is measured on Rail/local Search, Top bar/right controls (quick create), Teamspace More Actions menu and its highlighted row, Top bar/global search, and Global search panel | from spec |
| `--radius-lg` | `0.5rem` (8px) | No measured 8 px corner | not yet measured |
| `--radius-full` | `9999px` | app-shell.md › Top bar/right controls › Order, sizing, spacing › "Avatar is about 30 x 30 circular" | from spec |
| `--shadow-sm` | unchanged | app-shell.md › Bottom utility strip › "exact blur parameters are **not measurable from capture**"; Teamspace More Actions menu › "blur/spread and opacity are **not measurable from capture**" | not yet measured |
| `--shadow-md` | unchanged | Same two rows: shadow parameters are not measurable from capture | not yet measured |
| `--shadow-lg` | unchanged | Same two rows: shadow parameters are not measurable from capture | not yet measured |
| `--space-1` | `0.25rem` (4px) | Generic scale; the measured gaps carry their own `--size-*` token below | not yet measured |
| `--space-2` | `0.5rem` (8px) | Generic scale; the measured gaps carry their own `--size-*` token below | not yet measured |
| `--space-3` | `0.75rem` (12px) | Generic scale; the measured gaps carry their own `--size-*` token below | not yet measured |
| `--space-4` | `1rem` (16px) | Generic scale; the measured gaps carry their own `--size-*` token below | not yet measured |
| `--space-6` | `1.5rem` (24px) | Generic scale; the measured gaps carry their own `--size-*` token below | not yet measured |
| `--space-8` | `2rem` (32px) | Generic scale; the measured gaps carry their own `--size-*` token below | not yet measured |
| `--size-rail-width` | `320px` | app-shell.md › Navigation rail › Bounds and surface › "x 0-320, y 0-807; 320 wide" | from spec |
| `--size-topbar-height` | `50px` | app-shell.md › Top bar › Bounds and surface › "x 320-1470, y 0-50; 50 high" | from spec |
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
| `--size-menu-item-height` | `30px` | app-shell.md › Teamspace More Actions menu › Item geometry › "first three visible bands about 30 px high" | from spec |
| `--size-menu-icon` | `16px` | app-shell.md › Teamspace More Actions menu › Item geometry › "icon approx. 16 x 16" | from spec |
| `--size-menu-label-gap` | `12px` | app-shell.md › Teamspace More Actions menu › Item geometry › "about 12 px between icon and label" | from spec |

### Shell coordinate tokens

The shell also needs these offsets to preserve positions when later controls are omitted.
They are derived from the same Visual layout rows, not new measurements.

| Token | Value | Spec row and derivation | Status |
| --- | --- | --- | --- |
| `--size-topbar-control-gap` | `2px` | Top bar/right controls: 34 px centres minus half the 34 px settings slot and half the 30 px avatar | from spec |
| `--size-rail-nested-row-gap` | `2px` | Rail/nested link: 32 px pitch minus 30 px row | from spec |
| `--size-rail-nested-icon-offset` | `28px` | Rail/nested link: icon x 48 minus fixed icon x 20 | from spec |
| `--size-rail-nested-label-gap` | `14px` | Rail/nested link: label x 78 minus icon right x 64 | from spec |
| `--size-rail-header-top` | `11px` | Rail/product selector: top y 11 | from spec |
| `--size-rail-nav-start` | `5px` | Rail/pinned rows: y 55 minus the 50 px header | from spec |
| `--size-rail-product-gap` | `8px` | Rail/product selector: label x 53 minus mark right x 45 | from spec |
| `--size-rail-pinned-region` | `227px` | Rail/teamspace divider: y 277 minus the 50 px header | from spec |
| `--size-rail-teamspace-top` | `11px` | Rail/teamspace selector: y 289 minus divider bottom y 278 | from spec |
| `--size-rail-teamspace-group-gap` | `49px` | Rail/group heading: top y 362 minus selector bottom y 313; reserves later Search footprint | from spec |

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
- **Other positions and viewport-derived bounds.** Except for the derived shell offsets above, the teamspace divider is at
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

### Contrast notes

ADR 0003 §8 requires WCAG 2.1 AA: 4.5:1 for text and 3:1 for the non-text parts of a control. The
ratios below are computed from the token values with the WCAG relative-luminance formula.

Measured pairs that reach AA:

| Pair | Ratio |
| --- | --- |
| `--color-text` on `--color-surface` | 11.59:1 |
| `--color-text` on `--color-bg` | 10.26:1 |
| `--color-rail-item-active-text` on `--color-rail-item-active` | 9.60:1 |
| `--color-rail-text` on `--color-rail-surface` | 7.58:1 |
| `--color-text-muted` on `--color-surface` | 5.13:1 |
| `--color-primary` on `--color-surface` | 4.69:1 |
| `--color-primary-text` on `--color-primary` | 4.69:1 |
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
| `--color-primary` on `--color-bg` | 4.15:1 | The primary colour is measured as an icon, a border and an outline, never as text on the page surface |

No component consumes either placeholder token yet and `text-primary` is only rendered on a panel,
so nothing on `/dev/ui` fails AA today. The three placeholder rows fall under the ADR 0003 §8
exception: the tokens are used only for the placeholder of a real input. The last row does not:
primary-coloured text needs `--color-surface` behind it.

Separators sit below the 3:1 non-text ratio and stay as measured under the same exception:
`--color-border` on a panel (1.53:1), `--color-topbar-border` on the top bar (1.36:1) and
`--color-rail-border` on the rail (1.90:1). They divide regions rather than identify a control, and
the skeleton border they replace was no darker (1.47:1). A border that outlines a control is not
covered by the exception.

