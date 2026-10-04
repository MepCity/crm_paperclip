# Record list presentation components

These components compose UI primitives without fetching data. Core imports are type-only.
Measured values come from `research/specs/list-views.md` → Layout → Visual layout and
`apps/web/src/app/tokens.css`. The page owns data, navigation and persisted state.

## View tab and toolbar

- `ViewTabStrip({ viewName })`: renders the selected view label in the measured pill.
  It is a static label: no selector, tab options or additional tabs are rendered.
- `ListToolbar({ filterOpen, onFilterChange, onRefresh, fields, sort, onSortApply,
  create, actions?, presentationLabel? })`: controlled Filter state with `aria-pressed`,
  Sort, a static accessible list presentation indicator, refresh and create/actions.
  `create` takes the `SplitButton` props. `actions` takes `MenuAction[]` from the menu
  primitive (`id`, `label`, `onAction`, optional `isDisabled`). No Actions button is
  rendered for an empty collection. `presentationLabel` defaults to `List presentation`.
- `SortPopover({ fields, sort, onApply, defaultOpen? })`: `fields` is a readonly array of
  `{ apiName, label }`; `sort` is `SortSpec | null`. A new opening resets the local draft
  from `sort`. Null defaults to None and Ascending. Apply requires a field in the current
  collection and emits `{ field, order: "asc" | "desc" }`. Cancel, Escape and outside
  dismissal leave the applied value alone. The page supplies eligible sort fields.
  Only the Sort By label is visible; the order selector keeps the accessible name Order
  without a visible label, and the two selectors share a row. Disabled Apply uses the
  flat pale primary fill. A portaled field list does not dismiss the draft.
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
- Spacing inside the Sort content and the remaining nearby toolbar controls uses the existing
  spacing scale. Only total popover size, selector sizes and the 8–12 px toolbar gap range
  are measured; page coordinates belong to the page integration task.
- Menu entries in demos are neutral examples; real action availability belongs to the caller.
- Shadow parameters, hover and pressed states retain existing primitive behavior because
  the spec does not measure them. Disabled Apply is measured: a flat pale fill, not a
  faded primary gradient. Responsive behavior outside the captured desktop is open.
