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
| `children` | Form body inside the card. |

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

## Field inputs

Source: `research/specs/record-detail.md` → Create and edit forms, Visual layout
(Lead Information rows, Composite inputs, Country panel, Standard picklist,
Owner dropdown). Typography: `research/specs/typography.md` → List and detail
text roles. Interactive primitives remain inside `components/ui` (ADR 0003).
No data loading, API paths or runtime core imports exist in these components.

### FieldInput props

`field: FieldDefinition`, `value: FieldValue`, `onChange(value)` are controlled.
`disabled` and metadata `readOnly` prevent edits. `errorMessage` enables the
existing invalid appearance and links its explanation to the control.
`field.required` draws the required strip; validation belongs to the caller.
Text `maxLength` comes from metadata. Empty strings and cleared numbers emit
`null`; booleans emit booleans; numeric primitives parse numbers on commit.

`id?` sets the focusable control id (`input`, picklist trigger, or checkbox).
`hideLabel?` keeps the accessible name and hides the visible label (`sr-only`);
use with `FormRow` so only one label is visible.

`options` overrides metadata `picklist` in supplied order. `searchable` opts
into a panel search (Country and State callers set it; no module-specific
inference). Published `-None-` placeholders collapse into one first `null`
option. Saved unlisted strings append to the inventory. An empty inventory
contains only `-None-`. `searchLabel` overrides the search input label.

`users` supplies `{id, name, email}` owner options; selected IDs remain opaque.
`onOpenPicker` enables the in-field picker action; omit it when unavailable.
`pickerLabel` and `searchLabel` provide its copy. The default search label is
`Search Users`. A saved owner missing from the supplied inventory is shown by ID.
`currencyPrefix` / `currencyInformation` supply the currency annotation and
information icon's accessible label; no organization currency is assumed.
`textPrefix` supplies an attached text marker. `placeholder` supplies input copy.
`defaultOpen` supports isolated panel-state examples; it never overrides disabled.
All copy/data may be supplied through props; fallback copy is generic English.

| Data type | UI |
| --- | --- |
| text, email, phone, website | TextField (text, email, tel, url) |
| textarea | TextArea with lower-corner resize handle |
| integer, double | NumberField without grouping; integer uses integer precision |
| currency | NumberField with optional prefix/information annotation |
| boolean | Checkbox |
| picklist | RecordChoice without search; ordered list and null first option |
| picklist + searchable | RecordChoice with focused search and scrolling list |
| ownerlookup | RecordChoice with name/email/avatar and selected checkmark |
| profileimage | 48px noninteractive original portrait placeholder |
| lookup, multi_module_lookup, datetime, bigint | Nothing; absent from the observed Leads form |

### Composite inputs

`PrefixInput` extends TextField with independent `prefixLabel`, `prefixValue`,
`onPrefixChange` and `options`. Supports `id?` and `hideLabel?` like `FieldInput`.
Empty Salutation uses muted placeholder ink.
`TextPrefixInput` attaches a literal prefix (such as `@`). `CoordinatesInput` takes
`label`, `latitude`, `longitude`, `onChange` and optional `disabled`,
`errorMessage`, `latitudeLabel`, `longitudeLabel`, `clearLabel`, `id?`, `hideLabel?`.
Changes preserve the other coordinate; Clear All emits both coordinates as null.

The `/dev/ui` field-input demo has empty, filled, required and disabled states
for every rendered field type, plus searchable inventories, unlisted saved value,
composites and an invalid field. Open any list to inspect its panel state.
The demo picker callback changes a synthetic owner to make the integration visible;
the actual dialog belongs to MEP-139.

### Interim

- Searchable picklists use a case-insensitive substring of the displayed label.
  A search term was not entered in the reference CRM research. The null choice
  remains visible when filtering.
- Owner search uses a case-insensitive substring of name or email.
- Owner secondary typography is unmeasurable. Use its primary value's adjacent
  role, `--text-md` / `--font-weight-normal`. Unmeasured row/avatar geometry uses
  the existing spacing scale, 32px avatar and minimum 48px row. Selected owner
  names use the nearest selected picklist role (`--font-weight-semibold`).
- Currency value inset after the measured divider was not captured; it uses
  `--space-3` like other framed inputs.

### Empty selection contrast (MEP-157)

Empty Salutation prefix ink stays on `--color-text-placeholder` (`#8C91AB`, 3.11:1
on a panel). A selected prefix uses `--color-text`. ADR 0003 §8 covers the
empty-value text; gallery scans exclude only `[data-part=empty-value]`, not the
surrounding trigger.

### Deviations and deferred controls

- Form row columns and label placement: MEP-138 (parity checklist rows 20–21).
  This component gallery is not the final page layout.
- Owner picker dialog: MEP-139 (row 19). Action is rendered only with a callback.
- Create/edit page actions and save: MEP-145 (rows 20–21).
- Measured validation appearance: MEP-146 (row 22); existing invalid primitive
  colour and accessible explanation remain in this issue.
- Image upload: M6 image/attachment module (row 18); placeholder only.
- Country/State inventories and dependency: ADR 0002. Props supply inventories.
- Unsupported lookup/multi-module/date-time/long-integer controls: absent from
  Leads form; their corresponding later modules must supply primitives.
- Currency prefix/information content is supplied by callers; the spec does not
  publish the organization currency. Company stays a text field (suggestions unseen).
- Own user silhouette and shared icon components replace reference assets. No
  reference logo, image, icon or font files are added. Font advances may differ.
- Dropdown border, option geometry and panel heights are measured. Unmeasured
  horizontal padding, owner row gaps, icon sizes and disabled appearance use the
  existing scale. Panel placement adapts to the available viewport; standard
  panels open above when below cannot fit. Shadow blur remains unmeasurable
  and is omitted. No separate 14px or 15px typography token is introduced.

## Record form screen (MEP-145, stage A)

`RecordFormScreen` loads metadata, the optional edit record and organization users
through the browser hooks. Mount it inside the organization's `ApiProvider` and
pass the session user ID. The heading uses the module's singular label. Sections
and column placement come from `buildFormModel(metadata, mode)`; create/edit flags
filter the columns without changing their order. Read-only inputs remain visible
and disabled, but never enter a write payload.

`RecordFormConfig` supplies the module, presentation rules, navigation callback
and `paths.detail(id)`, `paths.create`, `paths.cancel`. The route layer must use the
shared page-path helper and determine the user's origin; the screen does not
construct routes or inspect browser history. Stage B adds the create/edit routes,
list/detail entry points, browser request checks and measured page coordinates
when the list route dependency is merged. No alternate path helper is introduced.

`form-model.ts` owns initial values, null/placeholder conversion, primitive value
mapping and create/partial-update payloads. An edit form keeps its initial baseline
while queries refetch, preserving in-progress input. Writes use `useCreateRecord`
and `useUpdateRecord`; all strip actions and inputs are disabled while a write is
pending, and a synchronous guard prevents duplicate submissions. The form has
`noValidate`: server validation owns these errors; measured validation and dirty
form confirmation belong to MEP-146. Field errors appear at their controls and
focus the first rendered error, including composite prefix and longitude controls.

### Interim page behavior and Leads rules

- Save navigates to the saved record, Save and New resets create values and
  navigates to the create page, and Cancel navigates to the supplied origin. No
  success message is shown. These results follow the authorized interim A7 rules
  in `research/specs/leads-write-behaviour.md`, not observed write behavior.
- `leads-form-rules.ts` is the only production file naming Leads-specific fields:
  Salutation belongs to First Name, Address groups its metadata-ordered subfields,
  Latitude/Longitude form one Coordinates row, Annual Revenue accepts a currency
  prefix from configuration, and Twitter receives `@`. Connected To is omitted.
- Country/State use metadata inventories. A saved unlisted value remains an
  option; without Country, State displays only the null option. The existing
  saved State is preserved internally until an explicit edit; no unresearched
  dependency clearing is introduced.
- Currency text must be supplied by the route configuration when available; no
  organization currency is guessed. The information action is omitted until a
  functional interaction and copy are available.
- `renderOwnerPicker` is an integration slot for the approved Select User dialog.
  Users come from `useUsers`. Done writes an opaque ID; Cancel preserves the
  previous owner; both return focus to the opening icon. The action is omitted
  unless the slot is supplied. Stage A tests the slot's integration contract;
  wiring and testing the real dialog waits for MEP-205's delivery into main.
- Image upload (parity row 18, image/attachment module), auxiliary form-view and
  customization controls (rows 20–21, customization module), and Client Script
  (automation module) remain omitted as scoped deferred controls. Placeholder
  portrait and our original icons are used; no reference assets are copied.
- Unexpected write failure keeps input on the form with the existing generic
  alert. Measured non-field error presentation belongs to MEP-168.

Tests use an `ApiProvider` with the fixture service: create payload, populated edit,
partial update, server error placement/focus, Save and New reset, origin cancel,
write locking, owner dropdown and picker integration, composite errors and
Country/State options. Unit tests independently cover metadata filtering/order,
required/read-only flags, value mapping and explicit clears. Final page parity
and end-to-end browser flows remain stage B acceptance checks.
