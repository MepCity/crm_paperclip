# Record form layout

Module-agnostic presentation for create and edit record forms. Field controls,
validation, save flows and page wiring live in other issues; these components only
provide the measured shell, sections, two-column rows and bordered field groups.

## RecordFormShell

`record-form-shell.tsx`

| Prop | Meaning |
| --- | --- |
| `title` | Fixed strip heading (for example `Create Lead`). |
| `formAriaLabel` | Accessible name on the `<form>` landmark inside the card. |
| `actionLabels` | `cancel`, `saveAndNew`, and `save` button text. |
| `onCancel`, `onSaveAndNew`, `onSave` | Optional press handlers for the strip actions. |
| `children` | Form body inside the white card. |

The strip stays `position: sticky` while the card body scrolls. Action order in
the tab sequence is Cancel, Save and New, then Save.

## FormSection

`form-section.tsx`

Optional `title` and `layout` (`single` or `two-column`). The layout flag is for
documentation and tests; place a `FormGrid` in two-column sections and full-width
rows in single-column sections.

## FormGrid and FormRow

`form-grid.tsx`, `form-row.tsx`

`FormGrid` renders independent left and right columns. Each `FormRow` draws a
right-aligned label and a control slot. Pass `column` as `left`, `right`, or
`full` (Description-style rows). Set `controlId` on the row and the same `id` on
the child control so the label association works.

Measured geometry uses tokens from `app/tokens.css` (source:
`research/specs/record-detail.md` › Layout › Visual layout › Create/edit form).
The `--size-form-column-gap` token is the measured span from the left input’s
right edge to the right input’s left edge (right label column plus label gap);
`FormGrid` does not add a separate flex gap between columns.

## FieldGroup

`field-group.tsx`

Bordered group with a legend straddling the top edge (for example `Address`). It
spans the left column width. Rows inside the group use the narrower
`--size-form-input-group-width` control column while keeping the same label
geometry as the main grid.

## Demo

`/dev/ui` › `record-form-layout` shows a synthetic Create Lead layout with long
labels, Address Information (bordered group), Description Information, and a
scroll host to exercise the sticky strip. Layout styles live in `form.css`;
demo-only control chrome lives in `record-form-layout.demo.css`.
