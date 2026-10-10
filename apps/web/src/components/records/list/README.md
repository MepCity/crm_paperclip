# Record list

Module-agnostic presentation for a records table. Routes, data loading and the
page that joins the tab, toolbar and filter panel live elsewhere. These
components import types from `@crm/core/records` and format datetimes through
`@crm/core/format`. They do not call a record service.

## RecordTable

`record-table.tsx`

| Prop | Meaning |
| --- | --- |
| `columns` | `FieldDefinition[]` in screen order. Header text defaults to `field.label`. |
| `records` | `RecordData[]` for the current page. |
| `linkField` | API name of the column that links to the row. |
| `linkFieldLabel` | Optional display label for the link column header. When omitted, `field.label` is used. |
| `rowHref` | Builds that column's address from the record. |
| `selectedIds` | Controlled selection. Ids that are not on this page are kept. |
| `onSelectedIdsChange` | Called with the next id list. |
| `sortableFields` | API names whose data header draws the column options trigger. |
| `onSortChange` | Called with `{ field, order }` when an order is picked in that menu. |
| `alphabet` | Optional alphabetical filter of the link column header: `{ value, onChange }`. `value` is the chosen letter, `null` is `All`. Omitting it draws no control. |
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

When `alphabet` is supplied, the link column header draws the `AlphabetFilter` control from
`components/ui` right after the label, and only there: other headers keep their plain label.
The control's accessible name is `Filter by first letter` and its text is the current choice,
`All` or a letter. Each data header keeps `aria-label` as its own accessible name, so the
control inside the cell does not change how the column is announced. The table does not filter
anything: the page owns the choice (`list-views.md` › Filters / views / sorting / search ›
Alphabetical filter, Layout › Visual layout › All alphabet dropdown).

The header checkbox selects or clears every row on the page. A row checkbox
selects that row. The selection toolbar is composed on the module list page,
not inside this table.

The badge strip is an empty placeholder. No activity ribbon is drawn.

A single-line row is `--size-list-row-pad`, one `--size-list-line-height` line
and `--size-list-row-pad` again. There is no minimum row height: each extra
text line adds one line height, and cell content stays top-aligned. A 1px
separator follows the row. `wrapText` is decided by the cell box, so a link cell
inherits it too: with `wrapText` false a long name or mail address stays on one
line and is cut with an ellipsis instead of growing the row. Each data header has a short divider on its right
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

### Column options menu

Source: `research/specs/list-views.md` → Filters / views / sorting / search (Column header
options) and Layout → Visual layout (Column options menu).

A data header whose field is in `sortableFields` draws a trigger named
`<shown header label> column options` at the cell's trailing end, before its divider — the label
the header itself shows, so `linkFieldLabel` is what the link column's trigger is named. It sits
outside the label flow, so the label keeps its truncation width and the column keeps its measured
width.
The link column keeps the trigger visible; the others stay hidden until the header is hovered or
holds keyboard focus, and stay visible while their menu is open.

The menu has two rows, `Asc` then `Desc`. Picking one calls `onSortChange` with
`{ field, order }` and closes the menu; Escape closes it and returns focus to the trigger. The
menu is the shared measured `Menu`: 151 px wide (`--size-popover-column-options-width`), 30 px
rows (`--size-menu-item-height`), a 1 px `--color-border` edge on `--color-menu-surface`,
`--radius-md` corners, row text in the **List menu item** role (`--text-md`,
`--font-weight-normal`) in `--color-text`, hovered row `--color-surface-hover`, and arrow glyphs
in `--color-menu-icon` at `--size-menu-icon`. It opens under the trigger, aligned to its leading
edge.

#### Interim

- Only `Lead Name` was captured, so the menu of every other column is assumed identical, and its
  trigger is assumed to appear on mouse hover only.
- The trigger's drawing, size and place are not measured: it reuses the list sort glyph at
  `--size-menu-icon`, centred in the header and inset `--size-list-cell-inset` from the cell's
  trailing edge, before the divider.
- The trigger glyph keeps the shared icon-button tone (`--color-text-muted`); the spec row
  measures only the menu's own glyphs.
- The menu is anchored to the trigger's leading edge because the measured menu box (x 963–1114)
  reaches past its column's right edge (x 988). The reference's own offset is not measured.
- The row inset inside the menu is the shared measured menu inset (`--size-menu-inset`); the
  list spec row measures the menu box and the rows, never their inset.
- The sorted column keeps no header indicator, and the applied order is not marked in the menu.
- Choosing an order closes the menu.

#### Not drawn

`Pin Column`, `Filter by` and `Hide Column` — the reference menu's other three entries. Their
results were never observed, and pinning or hiding a column is a persisted view preference owned
by the customisation module (M11).

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

Column options are live in the demo: picking `Asc` or `Desc` re-orders that section's own rows.
`Created` is kept outside the sortable set, so its header draws no trigger.

## Known deviations

The captured list shows these controls, and none of their behaviour was
observed, so they are not drawn: row hover actions, column resize, column
drag, and sorting by clicking a header label (sorting is offered through the
column options menu). The **All** alphabetical filter beside the link column
header is drawn; its effect is `Interim` (see
Module list page below).

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
- The View Settings button is drawn in the header overlay. Scrolled to the
  end, the overlay covers the last 40px of the last column header. That overlap was not
  observed.
- The popover follows the measured row (`--size-popover-settings-width` 264px,
  `--size-list-settings-row-width` 250px by `--size-menu-item-height` 30px,
  `--size-menu-inset` 6px). `Manage Columns` and `Reset Column Size` are not drawn: they
  belong to the customization module, so the popover has only the page/view group and no
  group divider.
- The page-size submenu and the View Mode submenu are not measured in the spec. Their
  width follows their content, the marker sits before the label, and the submenu chevron
  is 16px (`--size-menu-icon`). The submenu's border keeps the shared popover border.
- The parent rows' leading glyphs, the value column and the row gap are read from the
  `list-settings` capture, not measured in the spec: the glyphs are 16px
  (`--size-menu-icon`) with the 12px label gap (`--size-menu-label-gap`) already used by
  measured menus, the value sits right-aligned before the submenu chevron. Their text
  weights are measured (`typography.md` › Table settings row label / value); the label's
  14px maps to the existing 14.5px `--text-md` token and the value's 640-660 band to
  `--font-weight-bold` (650). The glyph drawings are our own (`Icons.list`, `Icons.eye`);
  the spec forbids reusing the reference's icon assets.
- The View Settings trigger is an icon-only button in a 40px cell; the reference's
  control and icon sizes in that cell were not measured. It uses `--size-list-view-icon`,
  and its glyph is the framed sliders drawing (`Icons.settingsSliders`), not the bare
  gear used by the shell's Settings nav item.
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
Left filters, Search, Filter operators by field type and Flow 6. No data access or port mapping.

### Props

| Prop | Contract |
| --- | --- |
| `title` | Visible panel heading and accessible region name. |
| `searchLabel` / `searchPlaceholder` | Accessible input label and visible placeholder, supplied by the caller. |
| `groups` | Ordered `{ id, label, items: { id, label, disabled?, editor? }[] }[]`; group IDs and item IDs must each be unique across the panel. |
| `selectedIds` | Controlled selected item IDs. Selection remains intact when searching or collapsing. |
| `onApply` | Optional callback receiving ordered `AppliedFilter[]`: `{ itemId, operatorId, value }`. No record query is made. Omit to omit Apply. |
| `onClear` | Optional notification after the panel discards all drafts and calls `onSelectionChange([])`. |
| `groups[].items[].editor` | Optional `{ fieldType: FilterFieldType, options?: { id, label }[], currencyCode?: string }`. Without this definition the item remains a checkbox only. |
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
- AND/OR and persisted panel preferences remain unobserved and are excluded.
- Open question 17 still covers closed groups; checked boxes and the default editors
  are now described by the four measured field-filter rows.

### Field editor catalog

`lib/records/filter-operators.ts` is pure data; `FilterFieldType`, `FilterOperatorId`,
`AppliedFilter`, and `AppliedFilterValue` are safe browser contracts, independent of
any service port. IDs are stable. Option values are option IDs, never display labels.

| Type | Labels → IDs in screen order | Default | Value |
| --- | --- | --- | --- |
| text | is → equal; isn't → not_equal; contains → contains; doesn't contain → not_contains; starts with → starts_with; ends with → ends_with; is empty → is_empty; is not empty → is_not_empty | contains | string, Type here |
| email, phone | Same eight text operators | equal | string, Type here |
| picklist | is → equal; is not → not_equal; is empty → is_empty; is not empty → is_not_empty | equal | string[], searchable multiple choice, None |
| website | Same eight text operators | contains | string, Type here |
| integer | Same ten numeric operators as currency | equal | number or [number, number], no prefix |
| currency | = → equal; != → not_equal; < → less_than; <= → less_equal; > → greater_than; >= → greater_equal; between → between; not between → not_between; is empty → is_empty; is not empty → is_not_empty | equal | number or [number, number], optional currency code prefix |
| boolean | is → equal | equal | boolean, Selected / Not Selected |
| ownerlookup | is → equal; is not → not_equal; is empty → is_empty; is not empty → is_not_empty; belongs to Role / does not belong to Role / belongs to Group (observed labels) | equal | string[], searchable users, Click to Select Users.; role/group rows use the 141 × 25 px search cap (placeholder None) with empty option source and block Apply until criteria exist |
| datetime | Full operator list and screen order match `list-views.md` › Filter operators by field type (`datetime` / Created Time), including Previous/Next, On/before/after, between/not between, fiscal presets and empty operators | age in | number + `days` / `weeks` / `months` for age/due/Previous/Next; `DD.MM.YYYY` for On/before/after; From/To range for between/not between; fiscal presets block Apply until fiscal settings exist |
| tag | is → equal; is not → not_equal; is empty → is_empty; is not empty → is_not_empty | equal | multi-select button, empty tag source; Apply blocked until criteria exist |
| multilookup | Same eight text operators as `text` with connected_to value control | equal | text input plus module dropdown (default Contacts); Apply blocked until criteria exist |
| compound_address | is nearby → is_nearby | is_nearby | Choose Location input and radius dropdown; Apply blocked until criteria exist |

Empty operators always have no value control and emit null. Checking starts a
fresh default draft. Changing the operator discards the old value. Unchecking,
external deselection, and Clear discard drafts; search and group collapse keep them.
Drafts are internal: the caller controls only item selection. Apply uses panel order,
including checked fields hidden by search. Text is trimmed before Apply and criteria
generation; whitespace-only text is incomplete;
currency requires finite numbers, ranges require two finite numbers, choices require
at least one supplied option ID, and days require a nonnegative safe integer. Both
state values are complete immediately. Invalid numeric drafts are never emitted.
The page must supply synchronous option labels and IDs; these components never load
options. Clear does not change the search query or group expansion.

### Observed value list dimensions

`list-views.md` → Value list structures and Visual layout define the boolean
81 × 24 px trigger and two states, picklist 170 × 220 px popover with 158 × 28 px
rows, and owner header 77 × 28 px type selector plus 229 × 28 px search, with
327 × 174 px body and 315 × 41 px user rows. Caller options supply names and
secondary details; avatars are original initials. Currency range inputs are
100 × 25 px with From/To placeholders. All operator widths use one intrinsic
text/chevron/padding rule; dropdown offset comes from its token.

### Interim

The behavior after reference controls are clicked is unobserved; the task-authorized
rules above are provisional until the Module 1 gate. The unmeasured appearance uses
existing primitive tokens:

- Apply Filter / Clear size and placement: existing small buttons, footer outside
  the scrollable group content. A constrained-height parent makes only the rows scroll.
- The user-type selector contents beyond the initial Users option and current-user
  identification remain Interim; callers may supply `detail` and `currentUser` flags.
- The days unit sits next to the numeric input with the existing smallest spacing.
- **after** shares the single `DD.MM.YYYY` control used for **before** (**Interim**; no separate spec row).
- Apply stays disabled until every checked editable row is complete.
- Multiple field rows can be open simultaneously.
- Board-authorized reversible assumption (MEP-198): rows without an editor keep
  their existing checkbox selection contract. Apply emits only checked editable
  rows; the footer appears only when an editable row is checked. Clear resets
  all rows, including checkbox-only selections. No operator is invented for
  unobserved field types.

`/dev/ui` → filter editors starts all supported rows checked, shows disabled
Apply and the fixed footer, and lets reviewers open an operator list or Clear and
select two rows. Only synthetic data appears in demos and tests.

### Not drawn

- Email is blocked / is not blocked: email module (M10).
- Tag, Connected To and Address option sources and Apply criteria: editors drawn;
  Apply stays disabled until the Platform contract lands (MEP-255). System-defined
  and related-module editors: their respective modules.
- Fiscal period presets (Current/Previous/Next FY/FQ): operator list and zero-control
  rows are drawn; Apply stays disabled until fiscal settings and criteria exist.
- textarea, double, bigint, lookup, multi_module_lookup,
  profileimage: no observed operator catalog.

### Deviations

- The expand triangle is `#000000` in the spec and `--color-text-strong` here. The
  magnifier and triangle are original drawings; no reference assets are copied.
- Page position and full Leads lists belong to the page task.
- Operator/value/list text has no typography table role. It uses the neighboring
  Status stage value role (`--text-sm`, `--font-weight-normal`), matching the
  measured 13–14 px regular class. Footer buttons retain their existing text role.
- Operator intrinsic widths follow the original font and chevron drawing; the
  source lists variable widths for examples, rather than a fixed selector width.
- Open operator shadow parameters retain the existing soft-shadow token; they are
  not measured.

## ViewSettingsMenu

`view-settings-menu.tsx` — the control inside `RecordTable`'s `settings` slot.
Source: `research/specs/list-views.md` › Layout (View Settings paragraph), Layout →
Visual layout (View Settings popover; Data and trailing column widths), Actions
(View Settings) and Flows 5.

| Prop | Contract |
| --- | --- |
| `perPage` | Page size in effect: the address value when it carries `per_page`, otherwise the stored preference. Marks the submenu row. |
| `onPerPageChange` | Receives the chosen `ListPerPage` (10, 20, 30, 40, 50, 100) and closes the menu. |
| `wrapText` | Marks the Wrap Text row. |
| `onWrapTextChange` | Receives the next boolean and closes the menu. |

- Trigger: an icon-only button in the 40px header cell, accessible name **View Settings**.
  Its glyph is the framed settings sliders (`Icons.settingsSliders`). Opens with click,
  Enter or Space; Escape closes it and returns focus to the trigger. Opening focuses the
  first row, so the first ArrowDown moves to the second.
- Popover: 264px (`--size-popover-settings-width`), rows 30px
  (`--size-menu-item-height`). Row text follows the two roles `research/specs/typography.md`
  measures from `list-settings`: the label is Table settings row label (`--text-md` /
  `--font-weight-normal`), the value in effect is Table settings row value (`--text-md` /
  `--font-weight-bold`). The focused row uses the measured highlight fill.
- Rows: **Records Per Page** and **View Mode**, each a submenu opened with ArrowRight
  or a click. A row draws its leading glyph, its label, then the value in effect pushed
  to the right edge and the submenu chevron: `Records Per Page 30`, `View Mode Wrap Text`.
  The value belongs to the row's accessible name, and react-aria gives the submenu popover
  that same name — which is how `list-page-size` names the page-size menu. View Mode shows
  its value only while Wrap Text is on; the off-state label was never observed.
- Wrap Text is a `menuitemcheckbox`; page sizes are `menuitemradio` and the current size
  carries a check marker.
- Not drawn: **Manage Columns** and **Reset Column Size** — parity checklist row 9's
  column work belongs to M11 (Customization).
- The component is presentational: the page owns the address, the preference keys and
  the record query.

## View tab and toolbar

- `ViewTabStrip({ viewName })`: renders the selected view label in the measured pill.
  It is a static label: no selector, tab options or additional tabs are rendered.
- `ListToolbar({ filterOpen, onFilterChange, onRefresh, fields, sort, onSortApply,
  create, actions?, presentationLabel? })`: controlled Filter state with `aria-pressed`,
  Sort, a static accessible list presentation indicator, refresh and create/actions.
  `create` takes the `SplitButton` props. `actions` takes `MenuAction[]` from the menu
  primitive (`id`, `label`, `onAction`, optional `isDisabled`). No Actions button is
  rendered for an empty collection. `presentationLabel` defaults to `List presentation`.
- `SelectionBar({ selectedCount, onClear, onDelete, onMassUpdate?, actions? })`: replaces
  the toolbar while `selectedCount > 0`. Shows the measured toolbar height, a count
  (`1 Record Selected` / `3 Records Selected`), a `Clear` text control, `Delete`, an
  optional `Mass Update` button when `onMassUpdate` is set (113 × 32 px, same chrome as
  `Delete`), and an optional `Actions` menu when `actions` is non-empty. The page
  supplies module labels and wires delete confirmation.
- `MassUpdateDialog` and `ChangeOwnerDialog`: bulk write dialogs opened from the selection
  bar on the module list page. They call `useMassUpdate` / `useChangeOwner`, clear
  selection and refresh the list on success without a toast.
- `SortPopover({ fields, sort, onApply })`: `fields` is a readonly array of
  `{ apiName, label }` in the order the caller supplies — the component never sorts it;
  `sort` is `SortSpec | null`. A new opening resets the local draft from `sort`. Null
  defaults to None and Ascending. Apply requires a field in the current
  collection and emits `{ field, order: "asc" | "desc" }`. Cancel, Escape and outside
  dismissal leave the applied value alone. The page supplies eligible sort fields.
  Only the Sort By label is visible; the order selector keeps the accessible name Order
  without a visible label, and the two selectors share a row. Insets, selector gap, button
  size and the disabled Apply fill come from the Sort popover tokens. The dialog opens
  6 px below the toolbar control (`SORT_ANCHOR_OFFSET`): the spec puts its outer box top at
  y 138 while the toolbar row ends at y 132. A portaled field list
  does not dismiss the draft.
- Sort By field list: the `SearchableSelect` primitive in `components/ui` draws it (ADR 0003
  §1 keeps React Aria inside the primitive layer); this file only supplies the options, the
  anchor offset and the classes the tokens below attach to. The first option is `None`, then
  the given fields in the given order.
  A search input above the list filters option labels case-insensitively; with no match the
  list stays empty. Choosing an option closes the list and keeps the draft, so Apply still
  has to confirm it; choosing `None` disables Apply again. The selected option is marked and
  the list scrolls. Panel size, the band above the list, list height, border and row colours
  come from the Sort By field dropdown tokens and `list-views.md` › Sort By field dropdown.
  The panel keeps the shared popover chrome (`bg-surface`, 1 px `--color-border`, shadow), is
  left-aligned with the selector and overlaps its bottom border by 1 px
  (`SORT_FIELD_DROPDOWN_OFFSET`: panel top y 222, selector bottom y 223). The search band is
  `--size-popover-sort-field-dropdown-list-offset` (panel y 222 → list y 268 = 46 px, minus the
  panel border in `list-chrome.css`), so the list body starts on the measured edge. The
  trigger and the option rows carry the Sort dialog text role (`variant="sort"`:
  `--text-sm`, `--font-weight-normal`) from `typography.md` › List and detail text roles;
  that role has no bold selected row, so the only row override left is the measured
  selection fill.
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
(`create`, `actions` or `columnOptions`) for measured popover widths; default menus retain their width.
`Menu` accepts `placement` too, which the column options menu uses to anchor on its trigger's
leading edge; every other menu keeps `bottom end`.
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
| Sort dialog heading (`Sort By` label) | `--text-md` | `--font-weight-normal` |
| Sort dialog field selector value | `--text-sm` | `--font-weight-normal` |
| Sort dialog order selector option | `--text-sm` | `--font-weight-normal` |
| Sort dialog footer button (Cancel / Apply) | `--text-sm` | `--font-weight-semibold` |
| List menu item (More / Actions) | `--text-md` | `--font-weight-normal` |
| Table column header | `--text-md` | `--font-weight-normal` |
| Table cell value | `--text-md` | `--font-weight-normal` |
| Table settings row label | `--text-md` | `--font-weight-normal` |
| Table settings row value | `--text-md` | `--font-weight-bold` |
| Footer fixed label | `--text-md` | `--font-weight-normal` |
| Column options menu row | `--text-md` | `--font-weight-normal` |

Footer counts and range endpoints stay at `--font-weight-semibold`. All colours
are retained. Toolbar labels, Sort dialog heading, disabled list menu items, and
table settings labels map measured 14px to the existing 14.5px `--text-md`
token; no separate 14px size is introduced. Sort disabled Apply maps measured
weight 620 to `--font-weight-semibold` (510). The column options menu rows use
typography.md's **List menu item** role (`--text-md`, `--font-weight-normal`).

## Module list page (Leads)

Routes live under the organization shell with a single `ApiProvider` on
`app/crm/[orgSlug]/tab/layout.tsx`. Page paths are built with `lib/crm-paths.ts`.
Leads-only labels and filter rows sit in
`modules/leads/list-config.ts` and `modules/leads/list-filters.ts`.

### Address state

Query names mirror the reference list requests: `page` (default 1), `per_page`
(default 30; allowed 10, 20, 30, 40, 50, 100), `sort_by`, `sort_order`.
Parsing and list-query assembly live in `lib/records/list-search-params.ts`.
Invalid values fall back to defaults. When the address carries no `per_page`, the
stored `list.per-page` preference supplies the page size; a stored value outside the
six sizes falls back to 30. Sort Apply and footer Previous / Next
update the address; Refresh Custom View re-requests the open view's list and
count queries without changing the URL. View Settings writes `per_page` and resets
`page` to 1 through the same address helper. A column options pick writes the same
`sort_by` / `sort_order` keys and starts the new sort on page 1.
`sort_by` is accepted only for a field in the Sort By list, so the address and
the dialog offer the same set: `lib/records/sort-fields.ts` resolves the
module's ordered `sortFieldLabels` against field metadata by label, and
`Lead Name` resolves to the config's `linkField`.

### Filter apply (Leads)

`lib/records/filter-criteria.ts` maps `{ field, operatorId, value }` rows to port
`Criteria`. `modules/leads/list-filters.ts` builds panel groups from module metadata;
`modules/leads/leads-list-client.tsx` supplies the built groups once module fields
and users are loaded. Labels keep the spec order; `Lead Name` maps to the page
`linkField` (`Full_Name`); picklist options use stored values; owner rows use
`useUsers`; currency rows use `LEADS_LIST_CURRENCY_CODE` from `list-config.ts`.
`ModuleListScreen` wires Apply and Clear to `useRecordList` and `useRecordCount`.

| Panel `operatorId` | Criterion (comparator + value) |
| --- | --- |
| equal | `equal` + string, string[], boolean, or number |
| not_equal | `not_equal` + string, string[], or number |
| contains / not_contains / starts_with / ends_with | same comparator + string |
| is_empty / is_not_empty | same comparator + `null` |
| less_than / less_equal / greater_than / greater_equal | same comparator + number |
| between / not_between | same comparator + `[lower, upper]` |
| age_in / due_in | `less_equal` + `{ token: "AGEINDAYS" \| "DUEINDAYS", offset: N }` |
| today | `equal` + `{ token: "TODAY" }` |
| tomorrow / yesterday / till_yesterday / starting_tomorrow / this_week / previous_week / this_month / previous_month / this_year / previous_year / next_year | `equal` + `{ token: "PERIOD", name: "<UTC period>" }` |

Apply writes criteria to `useRecordList` and `useRecordCount`, resets row selection,
and returns to page 1 when needed. Clear removes criteria. Changing the open view
clears applied criteria and panel selection. `ValidationError` on `filters` shows the
server message above the panel actions; the table keeps the previous page via
`keepPreviousData`.

Disabled filter rows (deviations): `textarea`, `lookup`,
`multi_module_lookup`, `double`, `bigint`, `profileimage`, and `Tag`; system-defined
and related-module groups stay disabled.

### First-letter filter (Leads)

The link column header carries the `AlphabetFilter` control
(`list-views.md` › Filters / views / sorting / search › Alphabetical filter;
`leads-write-behaviour.md` › B1: a letter limits the list to the records whose name starts
with it). `ModuleListScreen` holds the choice in page state, where `null` is `All`.

`firstLetterCriteria(config.linkField, letter)` builds the leaf
`{ field: linkField, comparator: "starts_with", value: letter }`, and `combineCriteriaAnd`
from `lib/records/filter-criteria.ts` merges it with the criteria the panel applied into one
`and` group — the shape several panel rows already produce, with no extra nesting.
`useRecordList` and `useRecordCount` both get the merged criteria, so the rows and the total
answer the same restriction.

- Choosing a letter returns the list to page 1 and drops row selection, like applying a panel
  filter. `All` removes the leaf; with nothing else applied the queries carry no filters.
- The panel's `Clear` removes only what the panel applied; the letter stays.
- Changing the open view returns the control to `All`, together with the criteria, the panel
  draft and the selection it already discarded.
- With no matching record the table shows its normal empty state (`No Leads found.`) and a zero
  total.

### Interim

- Selection bar placement, counter copy (`Clear`, delete dialog title and body,
  button labels), no toast after delete, and selection limited to the loaded page
  (cleared on view, address, filter draft, or refresh) were not observed in the
  reference capture; they follow this task's authorized interim rules.
- Refresh re-requests `bulk` and `count` for the open view; the reference's
  refresh requests were not observed.
- View Settings preferences are stored in the browser, not on the server: `list.per-page`
  and `list.wrap-text.<viewId>` go through `usePreference` (`lib/preferences.ts`), whose
  key is scoped by organization and user id. Server-side storage waits for ADR 0002.
  `PreferenceProvider` wraps the organization layout once.
- The reference Wrap Text state was never switched, and the scope of these settings
  (per user or per view) was not observed: the capture tool blocked preference writes.
  Wrap Text is therefore stored per view and defaults to on, which is the behaviour the
  populated list capture shows.
- Choosing a page size closes the menu; whether the reference closes it was not observed.
- Page size default 30 is captured preference, not persisted user choice.
- The Sort By list is the 39 labels in `LEADS_SORT_FIELD_LABELS` (`list-views.md` ›
  Sorting), none dropped: every label resolves to a Leads metadata field. A label
  without a metadata field would leave the list out and be named here.
- The same set decides which headers draw a column options trigger.
- A sort picked in a column header starts on page 1, while the Sort popover keeps the open
  page. Neither path was applied in the reference, so no paging rule is observed.
- The Sort By search input reuses the filter search tokens (34 px high, magnifier
  inset) because the spec measures only the panel and the list body. The band it
  sits in is measured (`--size-popover-sort-field-dropdown-list-offset`, 46 px from
  the panel top to the list top); the input is centred in that band, so its own
  inset (5.5 px above and below) is Interim.
- An empty search result shows an empty list; the reference's no-match state was
  not captured (no message is drawn).
- Choosing `None` cannot clear an applied sort: Apply stays disabled, so the sort
  in the address can only be replaced by another field. Clearing through Sort
  was not observed.
- While the field list is open, React Aria hides the rest of the Sort dialog from
  assistive technology (nested overlay). Escape closes the list first, back to the
  dialog and then to the page.
- Multiple field filters combine with `AND`; filters are not stored in the address
  and clear on full page reload; no toolbar indicator after apply; empty results use
  the table empty state; validation errors appear above Apply/Clear; the panel stays
  open with rows checked after apply.
- The letter compares the link column's field (`config.linkField`, `Full_Name`, the column
  the reference labels `Lead Name`). The spec documents that a letter limits the list to the
  records starting with it but never records which field it targets, so the link field is the
  authorized interim choice (`leads-write-behaviour.md` › B1, open question 5).
- The comparison is the service's text-family `starts_with`, case-insensitive
  (`packages/core/records/README.md`); no separate letter rule was observed.
- The letter is not carried in the address, like applied panel filters: it clears on a full
  page reload. Whether the reference keeps it in the URL was not observed.
- The letter combines with the panel filter in one `and` group; the reference's combination
  rule was never observed (only one control was opened, never applied).
- The closed control's measure and its chosen-letter display use existing tokens only
  (`components/ui/README.md` › Alphabet filter primitive › Interim).
- With no matching record the letter shows the table's normal empty state; that state for a
  letter result was not observed.
- Module-local record text search is not drawn: its fields, matching rule and result states
  were never observed (`list-views.md` › Open questions 5), and it stays the remaining part of
  parity checklist row 10.
- Split Create arrow, Actions menu, view selector, and activity
  ribbon are not drawn on the page. View Settings is drawn, but its
  `Manage Columns` and `Reset Column Size` entries belong to M11 and are not drawn.

### Page layout

The list page uses measured viewport coordinates from the visual layout table.
Tab strip and toolbar sit flush under the shell top bar (no top inset). Horizontal
insets are 12 px for the view pill, 15 px for the filter/table lane, 73 px before
the toolbar’s right edge, and 16 px (`--size-list-inset`) on the table’s trailing
edge. A 15 px gap separates the toolbar from the filter/table row. The page fills the
shell main height; the table card grows in the body row and keeps the footer on
the card bottom while record rows scroll inside the card.

The card does not reach the bottom of the content area. At 1470 × 835 the content
area ends at y 807 and the card ends at y 794, so 13 px of canvas stays visible
under the card. `--list-card-bottom-gap` carries that value and is applied as the
page's `padding-bottom`; the body row flexes to fill the rest of the page height,
so the gap under the card stays 13 px whatever the shell height.

### Page deviations

- Panel closed: table widening beside the filter lane was not verified in the
  reference; our table grows into the freed horizontal space.
- Create Lead control x position is not compared while the split arrow and Actions
  control remain out of scope.

## Interim (bulk dialogs)

**Mass Update**

- Enabled `Update` uses existing primary button tokens (reference enabled fill was not
  observed).
- Backdrop uses the shared dialog overlay token.
- Value controls after a field is chosen follow the create/edit form input tokens at
  285 px width.
- Dialog height can grow when inline or general error text is shown.

**Change Owner**

- Entire dialog presentation (modal vs page) and `Cancel` styling were not observed;
  frame, padding, buttons and backdrop follow the unsaved-changes modal tokens; the
  owner control follows create/edit form input geometry.
- Field order for mass update follows module layout order.
- Optional mass-update values may be cleared by submitting an empty value.
- No success toast or banner after either bulk action completes.
