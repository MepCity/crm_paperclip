# Module walk checklist (full-screen QA tour)

Hand-out for the detailed all-screen QA tour after the first release. Walk each module top to bottom and tick the boxes. The list holds no values of its own: for any exact measurement, label, message or colour, open the spec named in the section's **Sources** line and the matching section of `docs/parity-checklist.md`. A mismatch with the spec is a finding; a doubt the spec does not settle goes in as an open question.

## How to use

- Run each screen in a fresh session, mouse first, then keyboard only.
- For every screen check: **look** (layout, spacing, colours, typography), **behaviour** (clicks, state changes, persistence), **validation messages** (wording and placement), **keyboard** (tab order, Enter, Esc, focus ring).
- Record findings as one issue per screen, citing the section below.

## Shared screens (repeat in every module that has them)

Sources: `research/specs/list-views.md`, `record-detail.md`, `app-shell.md`, `tags.md`, `notes.md`, `attachments.md`, `csv-import-export.md`, `recycle-bin.md`, `print-and-share.md`.

### List
- [ ] Look: header, toolbar, column header row and row layout match the spec.
- [ ] Behaviour: view switcher, sorting, paging and row selection work.
- [ ] Behaviour: mass-action bar appears on selection and hides when cleared.
- [ ] Validation: actions the spec disables for the selection stay disabled.
- [ ] Keyboard: tab reaches toolbar, rows and paging; Enter opens a record.

### Filter panel
- [ ] Look: panel layout and field groups match the spec.
- [ ] Behaviour: operators change with field type; value control changes with operator.
- [ ] Behaviour: apply, clear and the resulting empty state work.
- [ ] Validation: incomplete criteria show the spec's message.
- [ ] Keyboard: panel opens, traps focus and closes with Esc.

### Create / edit / clone form
- [ ] Look: section order, field widths, required markers and buttons match.
- [ ] Behaviour: defaults, dependent fields and lookups behave as in the spec.
- [ ] Validation: required, format and length messages show on save.
- [ ] Behaviour: cancel with unsaved changes follows the spec.
- [ ] Keyboard: tab order follows the visual order; Enter and Esc as in the spec.

### Record detail
- [ ] Look: header, tabs/sections, side cards and action buttons match.
- [ ] Behaviour: edit, clone, delete and the actions menu work.
- [ ] Behaviour: related lists open, add and show their empty state.
- [ ] Behaviour: timeline lists history and notes; notes can be added.
- [ ] Keyboard: every header action and card control is reachable.

### Empty and error states
- [ ] Empty list, empty related list and empty search show the spec's states.
- [ ] Unknown record id and unauthorised access show the error page.
- [ ] A failed request shows the spec's error feedback and the screen recovers.

## Leads
Sources: `leads.md`, `leads-fields-and-layout.md`, `leads-write-behaviour.md`, `lead-conversion.md`, `duplicates.md`; checklist "Module 1 — Leads".
- [ ] List and filter panel (shared checks above).
- [ ] Create/edit form: fields and layout follow `leads-fields-and-layout.md`; write rules follow `leads-write-behaviour.md`.
- [ ] Record detail with related lists and timeline.
- [ ] Convert lead: dialog look, option behaviour, resulting records and links.
- [ ] Find/merge duplicates and deduplicate flows.
- [ ] Empty and error states.

## Contacts
Sources: `contacts.md`, `contacts-form.md`, `contacts-record-detail.md`, `global-search.md`, `duplicates.md`; checklist "Module 2 — Contacts".
- [ ] List, filter panel, advanced search results page.
- [ ] Global search layer: open, type, results, keyboard selection.
- [ ] Create/edit/clone form.
- [ ] Record detail, related lists, timeline.
- [ ] Find and Merge Duplicates (record) and Deduplicate (list Actions).
- [ ] Empty and error states.

## Accounts
Sources: `accounts.md`, `accounts-form.md`, `accounts-record-detail.md`; checklist "Module 3 — Accounts".
- [ ] List and filter panel.
- [ ] Create/edit/clone form.
- [ ] Record detail, related lists (including Deals and activities), timeline.
- [ ] Empty and error states.

## Deals
Sources: `deals.md`, `deals-form.md`, `deals-record-detail.md`, `deals-pipeline.md`, `deals-kanban-settings.md`; checklist "Module 4 — Deals".
- [ ] List and filter panel.
- [ ] Stage (Kanban) board: columns, card look, drag between stages, closing won/lost.
- [ ] Kanban settings screen.
- [ ] Create/edit/clone form, including pipeline and stage fields.
- [ ] Record detail: related cards, lower half, timeline.
- [ ] Deals links from earlier modules.
- [ ] Empty and error states.

## Tasks
Sources: `activities.md`, `activities-form.md`, `activities-record-detail.md`, `activities-flows.md`; checklist "Module 5 — Activities".
- [ ] List and filter panel (including activity filters).
- [ ] Create/edit form (Subject suggestions, calendars).
- [ ] Record detail, notes, attachments card.
- [ ] Activity cards on parent records; Add New from a parent.
- [ ] Empty and error states.

## Meetings
Sources: same as Tasks; checklist "Meetings and Calls lists", "Meetings record detail", "Meetings create and edit".
- [ ] List and filter panel.
- [ ] Create/edit form: date/time, participants, validation messages.
- [ ] Record detail, related lists, timeline.
- [ ] Activity cards on parent records.
- [ ] Empty and error states.

## Calls
Sources: same as Tasks; checklist "Meetings and Calls lists", "Calls record detail", "Tasks and Calls forms".
- [ ] List and filter panel.
- [ ] Create/edit form, including the contact-call entry point.
- [ ] Record detail, related lists, timeline.
- [ ] Activity cards on parent records.
- [ ] Empty and error states.

## Campaigns
Sources: `campaigns.md`; checklist "Module 7 — Campaigns".
- [ ] List and filter panel.
- [ ] Create/edit form.
- [ ] Record detail, related lists, timeline.
- [ ] Campaign links from earlier modules.
- [ ] Empty and error states.

## Cases
Sources: `cases.md`; checklist "Module 8 — Cases and Solutions".
- [ ] List and filter panel.
- [ ] Cases form.
- [ ] Record detail, related lists, timeline.
- [ ] Cases links in earlier modules; CSV export.
- [ ] Empty and error states.

## Solutions
Sources: `solutions.md`; checklist "Module 8 — Cases and Solutions".
- [ ] List and filter panel.
- [ ] Create/edit form.
- [ ] Record detail, related lists, timeline.
- [ ] CSV export.
- [ ] Empty and error states.

## Cross-cutting
Sources: `csv-import-export.md`, `recycle-bin.md`, `tags.md`, `print-and-share.md`, `typography.md`; checklist "Module 6" and "Shared choice panels".
- [ ] CSV import and export per module.
- [ ] Recycle Bin: delete, restore, delete forever.
- [ ] Tags: add, remove, filter by tag.
- [ ] Print page and share.
- [ ] Shared choice panels behave the same in every form.

## Documents
Not yet live. When Documents is ready, add a section here using the same pattern (list, filter panel, form, record detail, related lists, timeline, empty/error states) and the new spec and checklist section names.
