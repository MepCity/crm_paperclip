# Record list

Module-agnostic presentation for a records table. Routes, data loading and the
page that joins the tab, toolbar and filter panel live elsewhere. These
components import types from `@crm/core/records` and format datetimes through
`@crm/core/format`. They do not call a record service.

## RecordTable

`record-table.tsx`

| Prop | Meaning |
| --- | --- |
| `columns` | `FieldDefinition[]` in screen order. Header text is `field.label`. |
| `records` | `RecordData[]` for the current page. |
| `linkField` | API name of the column that links to the row. |
| `rowHref` | Builds that column's address from the record. |
| `selectedIds` | Controlled selection. Ids that are not on this page are kept. |
| `onSelectedIdsChange` | Called with the next id list. |
| `wrapText` | Wrap cell text and grow the row. When false, the cell truncates. |
| `emptyMessage` | Message in the first body band when `records` is empty. |
| `settings` | Content of the header-only 40px View Settings overlay. Omit it to leave the cell empty. |
| `ownerNames` | User id → display name, passed through to `CellValue`. |
| `format` | Locale and time zone for datetime cells. |
| `footer` | Props for `RecordTableFooter`, rendered inside the same card. |

Header order when rows exist: an unlabeled leading cell and a selection cell
(together `--size-list-leading-pair-width`), a badge strip
(`--size-list-badge-width`), then one data column per field
(`--size-list-column-width`). The data columns scroll. The leading pair and the
badge strip stay pinned. View Settings is not a column: a
`--size-list-settings-width` overlay sits on the header's right edge, with a
1px left border, and body rows have no cell there. Omitting `settings` leaves
that overlay empty, with no accessible name. Scrolled to the end, the overlay
covers the last `--size-list-settings-width` of the last column header.

The header checkbox selects or clears every row on the page. A row checkbox
selects that row. Nothing else changes: there is no selection toolbar.

The badge strip is an empty placeholder. No activity ribbon is drawn.

A single-line row is `--size-list-row-pad`, one `--size-list-line-height` line
and `--size-list-row-pad` again. There is no minimum row height: each extra
text line adds one line height, and cell content stays top-aligned. A 1px
separator follows the row. Each data header has a short divider on its right
edge; the first data column has none on its left, and body rows have no
vertical dividers.

The selection box's right edge sits `--size-list-checkbox-inset` inside the
leading pair. In the header it is centred; in a body row its top is
`--size-list-checkbox-offset` below the row.

Empty `records`: the header and footer stay, the badge strip and the checkboxes
are omitted, and the two leading cells remain. The first body band sits outside
the horizontal scroller, so `emptyMessage` stays centred on the card's visible
width whatever the column count or scroll position. The text is inset from the
top of that band. The horizontal scroller is then a tab stop, because the empty
page has no other focusable control inside it, and only then does that scroller
have an accessible name.

## CellValue

`cell-value.tsx`

| Prop | Meaning |
| --- | --- |
| `field` | Field definition, including picklist options when the field has them. |
| `value` | Domain value. `null` and `""` render an empty cell. |
| `href` | When set, the cell links here in the body text colour. |
| `ownerNames` | See above. A missing id is shown as the id itself. |
| `format` | Passed to `formatDateTime`. |

| Data type | Display |
| --- | --- |
| `text` | Plain text. A link only when `href` is set. |
| `email` | `mailto:` link in the body text colour, unless `href` is set. |
| `phone` | Plain text. |
| `picklist` | The option `displayValue` whose `storedValue` matches, otherwise the stored text. |
| `ownerlookup` | `ownerNames[id]`, otherwise the id. |
| `datetime` | `formatDateTime`. |

Other types are not columns of the captured views. A string is shown as text, a
number or boolean as its decimal or `true`/`false` text, and a module reference
as its id. None of those become links.

## RecordTableFooter

`record-table-footer.tsx`

| Prop | Meaning |
| --- | --- |
| `total` | Bold count after **Total Records**. `null` leaves the label alone. |
| `page` | One-based page. |
| `pageSize` | Page size used to compute the range. |
| `recordCount` | Records actually on this page. |
| `moreRecords` | Whether another page exists after this one. |
| `previousHref` | Address for Previous. Ignored on page 1. |
| `nextHref` | Address for Next. Ignored when `moreRecords` is false. |

The range is `(page - 1) * pageSize + 1` through that start plus `recordCount - 1`.
The right-hand order is previous chevron, range, next chevron. The controls are
icon-only; Previous and Next are accessible names. The endpoints and the total
use `--font-weight-semibold` in the body colour. The word "to" stays at normal
weight in `--color-text-muted`. An enabled control is a link in the body
colour; a disabled control uses `--color-text-disabled` and is not a link. On a
single page both are disabled. A page with no records shows only the total.

## States in `/dev/ui`

The `record-table` demo uses synthetic values (`Lead 001`, `example.org`):

- Populated records: single-line rows, one row whose company wraps, both controls disabled.
- Wrapped records, one long name and email, the row grows past two lines.
- Empty records, total 0, the empty message, no badge, no checkboxes, no range.
- Later page, Previous and Next both enabled.

## Known deviations

The captured list shows these controls, and none of their behaviour was
observed, so they are not drawn: the **All** menu on the name header, row
hover actions, column resize, column drag, and sorting by clicking a header.

Also:

- The two leading cells share the measured 100px equally. The capture has no
  divider between them, so the individual widths are unknown. The selection
  box sits at the trailing end of the second cell.
- The badge strip is blank. The activity ribbon belongs to a later module.
- The checkbox is the existing primitive. Its measured size is out of scope.
- The empty message words are a prop. The module-specific sentence belongs to
  the page that composes this table.
- Picklist display values come from the field's published options. The spec
  does not describe that formatting.
- Phone and every type that is not a row link or an email stay plain text.
- Footer numbers retain `--font-weight-semibold` (510) by CTO decision; the
  new `--font-weight-bold` (650) is used for the view tab.
- The enabled pagination chevron was not observed. It uses the body colour.
- A view with fewer columns was measured near 204px. Column width stays 200px.
- Figtree changes the measured advance of some labels. The largest recorded
  difference is 2px (`research/specs/typography.md`).
- The settings menu is not drawn. The header overlay is a slot. Scrolled to the
  end, it covers the last 40px of the last column header. That overlap was not
  observed.
- A wide empty table's message position was not observed. The message is
  centred on the visible card.
- A partially selected page does not draw an indeterminate header box. Partial
  selection was not observed; the header box is checked only when every row on
  the page is selected.

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
- Open question 17 records what was not captured: a closed group and a checked checkbox.

### Deviations

- The expand triangle is `#000000` in the spec and `--color-text-strong` here. The
  magnifier and triangle are original drawings; no reference assets are copied.
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
6 px corners. Existing hover/pressed fills are retained. `toolbar`, `listToolbar`, `splitPrimary`,
`splitArrow`, `actions`, `listFilter` and `listIcon` sizes use list tokens. `Menu` accepts optional `width`
(`create` or `actions`) for measured popover widths; default menus retain their width.
`Popover` accepts `hideTitle` (a visually hidden accessible title) and `contentClassName`
for composing the compact Sort layout. Select interaction remains in the shared primitive;
the scoped list CSS applies the measured selector dimensions.

## Deviations and open questions

- No view selector/options, View Settings or unconfirmed presentation controls, as scoped.
- Icons are original line drawings. No reference logo, image, font or icon asset is added.
- Typography uses the Figtree type tokens (`research/specs/typography.md`); glyph widths can
  differ from the reference by up to 2 px. Label lengths can change intrinsic widths. The
  measured minimums reproduce the All Leads pill and Create Lead split button; longer labels grow.
- Sort content insets, the selector gap, button size and the outer border follow the Sort
  popover row. Page coordinates still belong to the page integration task.
- The second selector's initial `#F5F6F8` fill and `#D2D9F1` border are an open question:
  the capture does not say whether that control is disabled until a field is chosen, so the
  shared selector style stays.
- Menu entries in demos are neutral examples; real action availability belongs to the caller.
- Shadow parameters, hover and pressed states retain existing primitive behavior because
  the spec does not measure them. Disabled Apply is measured: a flat pale fill, not a
  faded primary gradient. Responsive behavior outside the captured desktop is open.

## Adopted text roles

`research/specs/typography.md` → List and detail text roles, with the CTO token
mapping in MEP-126, supersedes the earlier list-spec type estimates:

| Role | Size token | Weight token |
| --- | --- | --- |
| List view tab | `--text-sm` | `--font-weight-bold` |
| List toolbar Filter / Sort | `--text-md` | `--font-weight-semibold` |
| List primary button (button or link) | `--text-md` | `--font-weight-semibold` |
| Table column header | `--text-md` | `--font-weight-normal` |
| Table cell value | `--text-md` | `--font-weight-normal` |
| Footer fixed label | `--text-md` | `--font-weight-normal` |

Footer counts and range endpoints stay at `--font-weight-semibold`. All colours
are retained. Toolbar labels map the measured 14px to the existing 14.5px token;
no separate 14px size is introduced. The Sort popover action buttons retain their
existing size until their screen typography task.

## Module list page (Leads)

Routes live under the organization shell with a single `ApiProvider` on
`app/o/[orgSlug]/tab/layout.tsx`. Page paths are built with `lib/crm-paths.ts`
(interim `/o` prefix until MEP-89). Leads-only labels and filter rows sit in
`modules/leads/list-config.ts` and `modules/leads/list-filters.ts`.

### Address state

Query names mirror the reference list requests: `page` (default 1), `per_page`
(default 30; allowed 10, 20, 30, 40, 50, 100), `sort_by`, `sort_order`.
Parsing and list-query assembly live in `lib/records/list-search-params.ts`.
Invalid values fall back to defaults. Sort Apply and footer Previous / Next
update the address; Refresh Custom View calls `router.refresh()` on the same URL.

### Interim

- Page size default 30 is captured preference, not persisted user choice.
- Sort By options are all module fields except the nine non-sortable API names in
  `list-views.md` › Sorting; the reference menu contents were not observed.
- Filter panel rows are drawn disabled; checking them does not filter records.
- Split Create arrow, Actions menu, view selector, View Settings, and activity
  ribbon are not drawn on the page.
- Organization paths use `/o/[orgSlug]/…` instead of ADR 0004’s `/crm/[orgSlug]/…`
  target until MEP-89 lands.

### Page layout

The list page uses measured viewport coordinates from the visual layout table.
Tab strip and toolbar sit flush under the shell top bar (no top inset). Horizontal
insets are 12 px for the view pill, 15 px for the filter/table lane, 73 px before
the toolbar’s right edge, and 16 px (`--size-list-inset`) on the table’s trailing
edge. A 15 px gap separates the toolbar from the filter/table row. The page fills the
shell main height; the table card grows in the body row and keeps the footer on
the card bottom while record rows scroll inside the card.

### Page deviations

- Panel closed: table widening beside the filter lane was not verified in the
  reference; our table grows into the freed horizontal space.
- Create Lead control x position is not compared while the split arrow and Actions
  control remain out of scope.
- Column header copy follows field metadata labels (for example **Full Name** for
  `Full_Name`), not the reference list label **Lead Name**.
