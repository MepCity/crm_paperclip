# Record detail presentation (MEP-141)

Overview tab cards for the record detail page: business card, collapsible details
card, shared field value rendering, and the `Last Update` age label. Data loading
and page placement live in MEP-144.

## Components

| Component | Role |
| --- | --- |
| `FieldValueView` | Read-only field value for detail rows; empty values use an em dash. |
| `BusinessCard` | Five (or fewer) label/value rows with right-aligned labels. |
| `DetailsCard` | `Hide Details` control, divider, and titled sections with one or two columns. |
| `LastUpdateLabel` | `Last Update` relative-age text supplied by the parent. |
| `DetailFieldRow` | Internal row layout for business and details cards. |

Shared formatting with list `CellValue` lives in `../field-format.ts`.

## Deviations (parity checklist)

| Module | Item |
| --- | --- |
| Record detail | Phone and Mobile call buttons not drawn. |
| Record detail | Skype icon not drawn. |
| Record detail | Checked boolean display not observed in reference captures. |

## Interim

- `Hide Details` collapsed state and `Show Details` label are implemented locally;
  persistence was not observed in reference captures and is not stored.
- `Last Update` label position on the page is not measured here (MEP-144).
- MEP-171 tracks remaining visual gaps: value column wrap width, vertical
  position of `Hide Details` and section headings (section heading is about 22 px
  lower than reference; `Hide Details` about 1.5 px lower), spacing between
  two-line field values, and pencil icon placement.

## Visual source

`research/specs/record-detail.md` › **Layout** › **Visual layout** (Business card,
Details card). Typography roles: `research/specs/typography.md` › **List and detail
text roles** (`Business/details field label`, `Business/details field value`,
`Details divider heading`, `Details subsection heading`).
