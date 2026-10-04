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
