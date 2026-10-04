# Record list presentation components

These components compose UI primitives without fetching data. Core imports are type-only.
Measured values come from `research/specs/list-views.md` → Layout → Visual layout and
`apps/web/src/app/tokens.css`. The page owns data, navigation and persisted state.

## FilterPanel

Presentation-only panel, sourced from `research/specs/list-views.md`: Layout → Visual
layout (Filter panel, Filter content, Surface and line colors, Selected / disabled),
Left filters, Search and Flow 6. No data access or criteria controls.

### Props

| Prop | Contract |
| --- | --- |
| `title` | Visible panel heading and accessible region name. |
| `searchLabel` / `searchPlaceholder` | Accessible input label and visible placeholder, supplied by the caller. |
| `groups` | Ordered `{ id, label, items: { id, label, disabled? }[] }[]`; group IDs and item IDs must each be unique across the panel. |
| `selectedIds` | Controlled selected item IDs. Selection remains intact when searching or collapsing. |
| `onSelectionChange` | Receives the next complete ID array; adds at the end or removes the toggled item, retaining other IDs. Disabled rows never call it. |

Groups start open. The filled triangle precedes the heading label: open points down,
closed points right, and the icon has no tooltip title. Headings support Enter and
Space and expose `aria-expanded`. Clipped headings retain the complete accessible name
and a native title tooltip on the label. A row label that does not fit wraps; the
checkbox stays on the first line. The `/dev/ui` filter-panel demo uses synthetic items,
including a two-line label and a disabled row, and allows reviewers to demonstrate
open/closed groups and filtered results.

### Unverified

- Search currently matches row labels by case-insensitive substring and hides groups
  without matching rows. No term was entered in the reference capture; this is the
  task-authorized provisional behavior. An empty result shows no groups. Clearing
  restores rows and prior group expansion state. No filter is applied to records.
- Operators, values, AND/OR, apply controls, counters and persisted panel preferences
  remain unobserved and are excluded. Checked checkbox appearance keeps the existing
  primitive (16 px box, 1 px border); the spec measures only the unchecked box, and a
  checked box was not captured.
- Open question 12 records the still-unmeasured filter-panel parts: vertical gaps
  between the heading, the search field, the group headings and the rows; whether group
  headings are 14 px or nearer 15 px; and the search field's right inset. A closed group
  was not captured. Those gaps keep the existing spacing scale.

### Deviations

- The expand triangle is `#000000` in the spec and `--color-text-strong` here. The
  magnifier and triangle are original drawings; no reference assets are copied.
- Figtree at `--text-sm` fits **System Defined Filters** on one line in the 202 px
  panel, so the reference clip **System Defined Fil...** does not appear. The heading
  still truncates with an ellipsis when the label is wider than the row.
- Page position and full Leads lists belong to the page task.

## View tab and toolbar

- `ViewTabStrip({ viewName })`: renders the selected view label in the measured pill.
  It is a static label: no selector, tab options or additional tabs are rendered.
- `ListToolbar({ filterOpen, onFilterChange, onRefresh, fields, sort, onSortApply,
  create, actions?, presentationLabel? })`: controlled Filter state with `aria-pressed`,
  Sort, a static accessible list presentation indicator, refresh and create/actions.
  `create` takes the `SplitButton` props. `actions` takes `MenuAction[]` from the menu
  primitive (`id`, `label`, `onAction`, optional `isDisabled`). No Actions button is
  rendered for an empty collection. `presentationLabel` defaults to `List presentation`.
- `SortPopover({ fields, sort, onApply })`: `fields` is a readonly array of
  `{ apiName, label }`; `sort` is `SortSpec | null`. A new opening resets the local draft
  from `sort`. Null defaults to None and Ascending. Apply requires a field in the current
  collection and emits `{ field, order: "asc" | "desc" }`. Cancel, Escape and outside
  dismissal leave the applied value alone. The page supplies eligible sort fields.
  Only the Sort By label is visible; the order selector keeps the accessible name Order
  without a visible label, and the two selectors share a row. Insets, selector gap, button
  size and the disabled Apply fill come from the Sort popover tokens. A portaled field list
  does not dismiss the draft.
- `SplitButton({ label, onPress?, href?, items? })` lives in `components/ui`. `href`
  renders a primary link; otherwise `onPress` runs from a button. Nonempty `MenuAction[]`
  adds the separator and separately labelled More button. With no items, neither is drawn.
  The primary segment has a measured minimum width, allowing longer module labels to grow.

The `/dev/ui` `list-chrome` demo shows Filter open/closed, with/without menus, the view
label and an interactive Sort example. The `split-button` demo also shows a link primary.
Component tests exercise keyboard menus, separate actions, controlled state, draft discard
and apply payloads. `e2e/list-chrome.spec.ts` checks real rendered geometry and colours.

## Primitive extensions

`Button` and button-styled `Link` use measured primary and secondary gradients with
6 px corners. Existing hover/pressed fills are retained. `toolbar`, `splitPrimary`,
`splitArrow`, `actions`, `listFilter` and `listIcon` sizes use list tokens. `Menu` accepts optional `width`
(`create` or `actions`) for measured popover widths; default menus retain their width.
`Popover` accepts `hideTitle` (a visually hidden accessible title) and `contentClassName`
for composing the compact Sort layout. Select interaction remains in the shared primitive;
the scoped list CSS applies the measured selector dimensions.

## Deviations and open questions

- No view selector/options, View Settings or unconfirmed presentation controls, as scoped.
- Icons are original line drawings. No reference logo, image, font or icon asset is added.
- Typography uses the existing system font token; the precise reference family remains an
  open research question. Label lengths can change intrinsic widths. The measured minimums
  reproduce the All Leads pill and Create Lead split button; longer labels grow.
- Sort content insets, the selector gap, button size and the outer border follow the Sort
  popover row. Page coordinates still belong to the page integration task.
- The second selector's initial `#F5F6F8` fill and `#D2D9F1` border are an open question:
  the capture does not say whether that control is disabled until a field is chosen, so the
  shared selector style stays.
- Menu entries in demos are neutral examples; real action availability belongs to the caller.
- Shadow parameters, hover and pressed states retain existing primitive behavior because
  the spec does not measure them. Disabled Apply is measured: a flat pale fill, not a
  faded primary gradient. Responsive behavior outside the captured desktop is open.
