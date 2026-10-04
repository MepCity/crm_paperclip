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
| `emptyMessage` | Centered message when `records` is empty. |
| `settings` | Content of the trailing 40px header cell. Omit it to leave the cell empty. |
| `ownerNames` | User id → display name, passed through to `CellValue`. |
| `format` | Locale and time zone for datetime cells. |
| `footer` | Props for `RecordTableFooter`, rendered inside the same card. |

Header order when rows exist: an unlabeled leading cell and a selection cell
(together `--size-list-leading-pair-width`), a badge strip
(`--size-list-badge-width`), one data column per field
(`--size-list-column-width`), then the settings cell
(`--size-list-settings-width`). The data columns scroll. The leading pair, the
badge strip and the settings cell stay pinned.

The header checkbox selects or clears every row on the page. A row checkbox
selects that row. Nothing else changes: there is no selection toolbar.

The badge strip is an empty placeholder. No activity ribbon is drawn.

Empty `records`: the header and footer stay, the badge strip and the checkboxes
are omitted, and the two leading cells remain. The first body band shows
`emptyMessage`, centered. The horizontal scroller is then a tab stop, because
the empty page has no other focusable control inside it.

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
An empty page shows **0 to 0**. The endpoints and the total use
`--font-weight-semibold`. The word "to" stays at normal weight. Previous and
Next are links in the body colour; a disabled control is text in
`--color-text-disabled` and is not a link. On a single page both are disabled.

## States in `/dev/ui`

The `record-table` demo uses synthetic values (`Lead 001`, `example.org`):

- Populated records, single page, both controls disabled.
- Wrapped records, one long name and email, the row grows.
- Empty records, total 0, the empty message, no badge and no checkboxes.
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
- Footer padding uses the 12px cell inset. The gap between the range and the
  controls uses the 12px spacing step. Neither distance is measured in the spec.
- The empty message uses ordinary cell text. The spec does not measure that
  line's type. The words themselves are a prop; the module-specific sentence
  belongs to the page that composes this table.
- Picklist display values come from the field's published options. The spec
  does not describe that formatting.
- Phone and every type that is not a row link or an email stay plain text.
- Footer emphasis uses `--font-weight-semibold`. The spec says "bold" and the
  type scale has no separate bold token.
- The settings menu is not drawn. The trailing cell is a slot.
- A partially selected page does not draw an indeterminate header box. Partial
  selection was not observed; the header box is checked only when every row on
  the page is selected.

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
