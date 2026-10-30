# Module walk checklist (full-screen QA tour)

Hand-out for the detailed all-screen QA tour after the first release. Walk each module top to bottom and tick the boxes. The list holds no values of its own: for any exact measurement, label, message or colour, open the spec named in the section's **Sources** line and the matching section of `docs/parity-checklist.md`. A mismatch with the spec is a finding; a doubt the spec does not settle goes in as an open question.

## How to use

- Run each screen in a fresh session, mouse first, then keyboard only.
- For every screen check: **look** (layout, spacing, colours, typography), **behaviour** (clicks, state changes, persistence), **validation messages** (wording and placement), **keyboard** (tab order, Enter, Esc, focus ring).
- Record findings as one issue per screen, citing the section below.

## How the module sections work

Every module section lists the screens to open. Each screen has five boxes (look, behaviour, validation, keyboard as they apply). Where the section says "as the spec describes", the exact value lives in the named spec or checklist section; if neither covers the point, record an open question instead of a finding.

## Shared screens

Sources: `list-views.md`, `record-detail.md`, `app-shell.md`, `tags.md`, `notes.md`, `attachments.md`, `csv-import-export.md`, `recycle-bin.md`, `print-and-share.md`. The module sections below repeat these screens with module sources; use the shared lists when a module spec says it reuses a shared screen.

### List
- [ ] Look: toolbar, column header row and row layout match the shared list spec section.
- [ ] Behaviour: view switcher, sorting, paging and row selection work as the spec describes.
- [ ] Behaviour: selection shows the mass-action bar; clearing hides it.
- [ ] Validation: actions the spec disables for the current selection stay disabled and show the spec's feedback.
- [ ] Keyboard: Tab reaches toolbar, rows and paging; Enter opens a record.

### Filter panel
- [ ] Look: panel layout and field groups match the spec.
- [ ] Behaviour: operators follow the field type; the value control follows the operator.
- [ ] Behaviour: apply and clear change the list as the filter section of the spec or checklist describes; where the Apply result is listed as open, record an open question.
- [ ] Validation: incomplete criteria are handled; the exact message is not fixed by the sources (the checklist lists filter validation as open research), so record an open question instead of a finding.
- [ ] Keyboard: panel opens from the keyboard and closes with Esc; focus order follows the visual order.

### Create / edit form
- [ ] Look: section order, field widths, required markers and buttons match the form spec.
- [ ] Behaviour: defaults, dependent fields and lookups behave as the spec describes.
- [ ] Validation: required, format and length messages appear with the spec's wording and placement.
- [ ] Behaviour: Save, Save and New (where the spec lists it) and Cancel follow the spec.
- [ ] Keyboard: tab order follows the visual order; Enter and Esc act as the spec says.

### Record detail
- [ ] Look: header, side cards, section order and action buttons match the detail spec.
- [ ] Behaviour: header actions and the actions menu offer exactly what the spec lists, and each works.
- [ ] Behaviour: switching sections or tabs keeps the record context.
- [ ] Validation: inline edits (where the spec allows them) show the spec's messages.
- [ ] Keyboard: every header action and card control is reachable and shows a focus ring.

### Empty and error states
- [ ] Empty list and empty search show the spec's empty state.
- [ ] Unknown record id: check only if the spec defines it; otherwise record an open question.
- [ ] A failed request: feedback matches the spec if it defines one; otherwise record an open question.
- [ ] Recovery after a failed request: open question unless the spec defines it.
- [ ] Keyboard: error and empty-state actions are reachable.

## Leads
Sources: `leads.md`, `leads-fields-and-layout.md`, `leads-write-behaviour.md`, `lead-conversion.md`, `duplicates.md`; checklist "Module 1 — Leads".

### List
- [ ] Look: toolbar, column header row and row layout match the Leads list spec section.
- [ ] Behaviour: view switcher, sorting, paging and row selection work as the spec describes.
- [ ] Behaviour: selection shows the mass-action bar; clearing hides it.
- [ ] Validation: actions the spec disables for the current selection stay disabled and show the spec's feedback.
- [ ] Keyboard: Tab reaches toolbar, rows and paging; Enter opens a record.

### Filter panel
- [ ] Look: panel layout and field groups match the spec.
- [ ] Behaviour: operators follow the field type; the value control follows the operator.
- [ ] Behaviour: apply and clear change the list as the filter section of the spec or checklist describes; where the Apply result is listed as open, record an open question.
- [ ] Validation: incomplete criteria are handled; the exact message is not fixed by the sources (the checklist lists filter validation as open research), so record an open question instead of a finding.
- [ ] Keyboard: panel opens from the keyboard and closes with Esc; focus order follows the visual order.

### Create / edit form
- [ ] Look: section order, field widths, required markers and buttons match the form spec.
- [ ] Behaviour: defaults, dependent fields and lookups behave as the spec describes.
- [ ] Validation: required, format and length messages appear with the spec's wording and placement.
- [ ] Behaviour: Save, Save and New (where the spec lists it) and Cancel follow the spec.
- [ ] Keyboard: tab order follows the visual order; Enter and Esc act as the spec says.

### Record detail
- [ ] Look: header, side cards, section order and action buttons match the detail spec.
- [ ] Behaviour: header actions and the actions menu offer exactly what the spec lists, and each works.
- [ ] Behaviour: switching sections or tabs keeps the record context.
- [ ] Validation: inline edits (where the spec allows them) show the spec's messages.
- [ ] Keyboard: every header action and card control is reachable and shows a focus ring.

### Related lists
- [ ] Look: card headers, column sets and row layout match the spec.
- [ ] Behaviour: only the related-list actions this module's spec lists work (open, and add/link/unlink if listed); anything else is an open question.
- [ ] Behaviour: an empty related list shows the spec's empty state.
- [ ] Behaviour: counts and ordering update after an add or a removal.
- [ ] Keyboard: related-list actions and row links are reachable.

### Timeline
- [ ] Look: entries, date grouping and icons match the spec.
- [ ] Behaviour: history and notes entries (where the spec lists them) appear in the spec's order.
- [ ] Behaviour: adding a note (where the spec allows it) shows it immediately.
- [ ] Validation: empty-note handling, only if the notes spec defines it; otherwise an open question.
- [ ] Keyboard: timeline entries and their controls are reachable.

### Empty and error states
- [ ] Empty list and empty search show the spec's empty state.
- [ ] Unknown record id: check only if the spec defines it; otherwise record an open question.
- [ ] A failed request: feedback matches the spec if it defines one; otherwise record an open question.
- [ ] Recovery after a failed request: open question unless the spec defines it.
- [ ] Keyboard: error and empty-state actions are reachable.

### Convert lead
- [ ] Look: dialog layout and options match `lead-conversion.md`.
- [ ] Behaviour: each option changes the result as the spec describes.
- [ ] Behaviour: converted records and links appear as the spec describes.
- [ ] Validation: blocked or incomplete conversions show the spec's message.
- [ ] Keyboard: dialog opens, traps focus and closes with Esc.

### Find / merge duplicates and Deduplicate
- [ ] Look: duplicate screens match `duplicates.md`.
- [ ] Behaviour: match selection and merge follow the spec.
- [ ] Behaviour: the merged record keeps the links the spec lists.
- [ ] Validation: merge with too few or too many records shows the spec's message.
- [ ] Keyboard: selection and merge controls are reachable.
## Contacts
Sources: `contacts.md`, `contacts-form.md`, `contacts-record-detail.md`, `global-search.md`, `duplicates.md`; checklist "Module 2 — Contacts".

### List
- [ ] Look: toolbar, column header row and row layout match the Contacts list spec section.
- [ ] Behaviour: view switcher, sorting, paging and row selection work as the spec describes.
- [ ] Behaviour: selection shows the mass-action bar; clearing hides it.
- [ ] Validation: actions the spec disables for the current selection stay disabled and show the spec's feedback.
- [ ] Keyboard: Tab reaches toolbar, rows and paging; Enter opens a record.

### Filter panel
- [ ] Look: panel layout and field groups match the spec.
- [ ] Behaviour: operators follow the field type; the value control follows the operator.
- [ ] Behaviour: apply and clear change the list as the filter section of the spec or checklist describes; where the Apply result is listed as open, record an open question.
- [ ] Validation: incomplete criteria are handled; the exact message is not fixed by the sources (the checklist lists filter validation as open research), so record an open question instead of a finding.
- [ ] Keyboard: panel opens from the keyboard and closes with Esc; focus order follows the visual order.

### Create / edit form
- [ ] Look: section order, field widths, required markers and buttons match the form spec.
- [ ] Behaviour: defaults, dependent fields and lookups behave as the spec describes.
- [ ] Validation: required, format and length messages appear with the spec's wording and placement.
- [ ] Behaviour: Save, Save and New (where the spec lists it) and Cancel follow the spec.
- [ ] Keyboard: tab order follows the visual order; Enter and Esc act as the spec says.

### Record detail
- [ ] Look: header, side cards, section order and action buttons match the detail spec.
- [ ] Behaviour: header actions and the actions menu offer exactly what the spec lists, and each works.
- [ ] Behaviour: switching sections or tabs keeps the record context.
- [ ] Validation: inline edits (where the spec allows them) show the spec's messages.
- [ ] Keyboard: every header action and card control is reachable and shows a focus ring.

### Related lists
- [ ] Look: card headers, column sets and row layout match the spec.
- [ ] Behaviour: only the related-list actions this module's spec lists work (open, and add/link/unlink if listed); anything else is an open question.
- [ ] Behaviour: an empty related list shows the spec's empty state.
- [ ] Behaviour: counts and ordering update after an add or a removal.
- [ ] Keyboard: related-list actions and row links are reachable.

### Timeline
- [ ] Look: entries, date grouping and icons match the spec.
- [ ] Behaviour: history and notes entries (where the spec lists them) appear in the spec's order.
- [ ] Behaviour: adding a note (where the spec allows it) shows it immediately.
- [ ] Validation: empty-note handling, only if the notes spec defines it; otherwise an open question.
- [ ] Keyboard: timeline entries and their controls are reachable.

### Empty and error states
- [ ] Empty list and empty search show the spec's empty state.
- [ ] Unknown record id: check only if the spec defines it; otherwise record an open question.
- [ ] A failed request: feedback matches the spec if it defines one; otherwise record an open question.
- [ ] Recovery after a failed request: open question unless the spec defines it.
- [ ] Keyboard: error and empty-state actions are reachable.

### Global search layer
- [ ] Look: layer layout and result rows match `global-search.md`.
- [ ] Behaviour: typing updates results as the spec describes.
- [ ] Behaviour: choosing a result opens the record.
- [ ] Validation: no-result and short-input states match the spec.
- [ ] Keyboard: open, arrow selection, Enter and Esc work.

### Advanced search results page
- [ ] Look: results page matches the checklist section "Advanced search results page".
- [ ] Behaviour: criteria carry over from the search layer.
- [ ] Behaviour: paging and row actions follow the spec.
- [ ] Validation: empty results show the spec's state.
- [ ] Keyboard: result rows and paging are reachable.

### Find and Merge Duplicates / Deduplicate
- [ ] Look: screens match `duplicates.md`.
- [ ] Behaviour: match selection and merge follow the spec.
- [ ] Behaviour: the Deduplicate list action starts from the list Actions menu.
- [ ] Validation: invalid selections show the spec's message.
- [ ] Keyboard: controls are reachable.
## Accounts
Sources: `accounts.md`, `accounts-form.md`, `accounts-record-detail.md`; checklist "Module 3 — Accounts".

### List
- [ ] Look: toolbar, column header row and row layout match the Accounts list spec section.
- [ ] Behaviour: view switcher, sorting, paging and row selection work as the spec describes.
- [ ] Behaviour: selection shows the mass-action bar; clearing hides it.
- [ ] Validation: actions the spec disables for the current selection stay disabled and show the spec's feedback.
- [ ] Keyboard: Tab reaches toolbar, rows and paging; Enter opens a record.

### Filter panel
- [ ] Look: panel layout and field groups match the spec.
- [ ] Behaviour: operators follow the field type; the value control follows the operator.
- [ ] Behaviour: apply and clear change the list as the filter section of the spec or checklist describes; where the Apply result is listed as open, record an open question.
- [ ] Validation: incomplete criteria are handled; the exact message is not fixed by the sources (the checklist lists filter validation as open research), so record an open question instead of a finding.
- [ ] Keyboard: panel opens from the keyboard and closes with Esc; focus order follows the visual order.

### Create / edit form
- [ ] Look: section order, field widths, required markers and buttons match the form spec.
- [ ] Behaviour: defaults, dependent fields and lookups behave as the spec describes.
- [ ] Validation: required, format and length messages appear with the spec's wording and placement.
- [ ] Behaviour: Save, Save and New (where the spec lists it) and Cancel follow the spec.
- [ ] Keyboard: tab order follows the visual order; Enter and Esc act as the spec says.

### Record detail
- [ ] Look: header, side cards, section order and action buttons match the detail spec.
- [ ] Behaviour: header actions and the actions menu offer exactly what the spec lists, and each works.
- [ ] Behaviour: switching sections or tabs keeps the record context.
- [ ] Validation: inline edits (where the spec allows them) show the spec's messages.
- [ ] Keyboard: every header action and card control is reachable and shows a focus ring.

### Related lists
- [ ] Look: card headers, column sets and row layout match the spec.
- [ ] Behaviour: only the related-list actions this module's spec lists work (open, and add/link/unlink if listed); anything else is an open question.
- [ ] Behaviour: an empty related list shows the spec's empty state.
- [ ] Behaviour: counts and ordering update after an add or a removal.
- [ ] Keyboard: related-list actions and row links are reachable.

### Timeline
- [ ] Look: entries, date grouping and icons match the spec.
- [ ] Behaviour: history and notes entries (where the spec lists them) appear in the spec's order.
- [ ] Behaviour: adding a note (where the spec allows it) shows it immediately.
- [ ] Validation: empty-note handling, only if the notes spec defines it; otherwise an open question.
- [ ] Keyboard: timeline entries and their controls are reachable.

### Empty and error states
- [ ] Empty list and empty search show the spec's empty state.
- [ ] Unknown record id: check only if the spec defines it; otherwise record an open question.
- [ ] A failed request: feedback matches the spec if it defines one; otherwise record an open question.
- [ ] Recovery after a failed request: open question unless the spec defines it.
- [ ] Keyboard: error and empty-state actions are reachable.
## Deals
Sources: `deals.md`, `deals-form.md`, `deals-record-detail.md`, `deals-pipeline.md`, `deals-kanban-settings.md`; checklist "Module 4 — Deals".

### List
- [ ] Look: toolbar, column header row and row layout match the Deals list spec section.
- [ ] Behaviour: view switcher, sorting, paging and row selection work as the spec describes.
- [ ] Behaviour: selection shows the mass-action bar; clearing hides it.
- [ ] Validation: actions the spec disables for the current selection stay disabled and show the spec's feedback.
- [ ] Keyboard: Tab reaches toolbar, rows and paging; Enter opens a record.

### Filter panel
- [ ] Look: panel layout and field groups match the spec.
- [ ] Behaviour: operators follow the field type; the value control follows the operator.
- [ ] Behaviour: apply and clear change the list as the filter section of the spec or checklist describes; where the Apply result is listed as open, record an open question.
- [ ] Validation: incomplete criteria are handled; the exact message is not fixed by the sources (the checklist lists filter validation as open research), so record an open question instead of a finding.
- [ ] Keyboard: panel opens from the keyboard and closes with Esc; focus order follows the visual order.

### Create / edit form
- [ ] Look: section order, field widths, required markers and buttons match the form spec.
- [ ] Behaviour: defaults, dependent fields and lookups behave as the spec describes.
- [ ] Validation: required, format and length messages appear with the spec's wording and placement.
- [ ] Behaviour: Save, Save and New (where the spec lists it) and Cancel follow the spec.
- [ ] Keyboard: tab order follows the visual order; Enter and Esc act as the spec says.

### Record detail
- [ ] Look: header, side cards, section order and action buttons match the detail spec.
- [ ] Behaviour: header actions and the actions menu offer exactly what the spec lists, and each works.
- [ ] Behaviour: switching sections or tabs keeps the record context.
- [ ] Validation: inline edits (where the spec allows them) show the spec's messages.
- [ ] Keyboard: every header action and card control is reachable and shows a focus ring.

### Related lists
- [ ] Look: card headers, column sets and row layout match the spec.
- [ ] Behaviour: only the related-list actions this module's spec lists work (open, and add/link/unlink if listed); anything else is an open question.
- [ ] Behaviour: an empty related list shows the spec's empty state.
- [ ] Behaviour: counts and ordering update after an add or a removal.
- [ ] Keyboard: related-list actions and row links are reachable.

### Timeline
- [ ] Look: entries, date grouping and icons match the spec.
- [ ] Behaviour: history and notes entries (where the spec lists them) appear in the spec's order.
- [ ] Behaviour: adding a note (where the spec allows it) shows it immediately.
- [ ] Validation: empty-note handling, only if the notes spec defines it; otherwise an open question.
- [ ] Keyboard: timeline entries and their controls are reachable.

### Empty and error states
- [ ] Empty list and empty search show the spec's empty state.
- [ ] Unknown record id: check only if the spec defines it; otherwise record an open question.
- [ ] A failed request: feedback matches the spec if it defines one; otherwise record an open question.
- [ ] Recovery after a failed request: open question unless the spec defines it.
- [ ] Keyboard: error and empty-state actions are reachable.

### Stage (Kanban) board
- [ ] Look: columns, card content and totals match `deals-pipeline.md`.
- [ ] Behaviour: dragging a card between stages updates the deal as the spec describes.
- [ ] Behaviour: closing won or lost follows the spec.
- [ ] Validation: moves the spec forbids are refused with its message.
- [ ] Keyboard: board controls are reachable; document any gap as an open question.

### Kanban settings
- [ ] Look: screen matches `deals-kanban-settings.md`.
- [ ] Behaviour: each setting changes the board as the spec describes.
- [ ] Behaviour: saving and cancelling follow the spec.
- [ ] Validation: invalid settings show the spec's message.
- [ ] Keyboard: controls are reachable.

### Deals links from earlier modules
- [ ] Look: Deals cards in Leads, Contacts and Accounts match the checklist section "Deals links in earlier modules".
- [ ] Behaviour: opening and adding a deal from a parent works.
- [ ] Behaviour: counts match the Deals list.
- [ ] Validation: parent-prefilled fields behave as the spec says.
- [ ] Keyboard: card actions are reachable.
## Tasks
Sources: `activities.md`, `activities-form.md`, `activities-record-detail.md`, `activities-flows.md`; checklist "Module 5 — Activities", "Tasks list", "Tasks record detail", "Tasks and Calls forms".

### List
- [ ] Look: toolbar, column header row and row layout match the Tasks list spec section.
- [ ] Behaviour: view switcher, sorting, paging and row selection work as the spec describes.
- [ ] Behaviour: selection shows the mass-action bar; clearing hides it.
- [ ] Validation: actions the spec disables for the current selection stay disabled and show the spec's feedback.
- [ ] Keyboard: Tab reaches toolbar, rows and paging; Enter opens a record.

### Filter panel
- [ ] Look: panel layout and field groups match the spec.
- [ ] Behaviour: operators follow the field type; the value control follows the operator.
- [ ] Behaviour: apply and clear change the list as the filter section of the spec or checklist describes; where the Apply result is listed as open, record an open question.
- [ ] Validation: incomplete criteria are handled; the exact message is not fixed by the sources (the checklist lists filter validation as open research), so record an open question instead of a finding.
- [ ] Keyboard: panel opens from the keyboard and closes with Esc; focus order follows the visual order.

### Create / edit form
- [ ] Look: section order, field widths, required markers and buttons match the form spec.
- [ ] Behaviour: defaults, dependent fields and lookups behave as the spec describes.
- [ ] Validation: required, format and length messages appear with the spec's wording and placement.
- [ ] Behaviour: Save, Save and New (where the spec lists it) and Cancel follow the spec.
- [ ] Keyboard: tab order follows the visual order; Enter and Esc act as the spec says.

### Record detail
- [ ] Look: header, side cards, section order and action buttons match the detail spec.
- [ ] Behaviour: header actions and the actions menu offer exactly what the spec lists, and each works.
- [ ] Behaviour: switching sections or tabs keeps the record context.
- [ ] Validation: inline edits (where the spec allows them) show the spec's messages.
- [ ] Keyboard: every header action and card control is reachable and shows a focus ring.

### Related lists
- [ ] Look: card headers, column sets and row layout match the spec.
- [ ] Behaviour: only the related-list actions this module's spec lists work (open, and add/link/unlink if listed); anything else is an open question.
- [ ] Behaviour: an empty related list shows the spec's empty state.
- [ ] Behaviour: counts and ordering update after an add or a removal.
- [ ] Keyboard: related-list actions and row links are reachable.

### Timeline
- [ ] Look: entries, date grouping and icons match the spec.
- [ ] Behaviour: history and notes entries (where the spec lists them) appear in the spec's order.
- [ ] Behaviour: adding a note (where the spec allows it) shows it immediately.
- [ ] Validation: empty-note handling, only if the notes spec defines it; otherwise an open question.
- [ ] Keyboard: timeline entries and their controls are reachable.

### Empty and error states
- [ ] Empty list and empty search show the spec's empty state.
- [ ] Unknown record id: check only if the spec defines it; otherwise record an open question.
- [ ] A failed request: feedback matches the spec if it defines one; otherwise record an open question.
- [ ] Recovery after a failed request: open question unless the spec defines it.
- [ ] Keyboard: error and empty-state actions are reachable.

### Activity cards on parent records
- [ ] Look: cards on Leads, Contacts, Accounts and Deals match the checklist section "Activities in parent modules".
- [ ] Behaviour: Add New from a parent prefills the parent link.
- [ ] Behaviour: open and completed groups follow the spec.
- [ ] Validation: forms opened from a parent show the spec's messages.
- [ ] Keyboard: card actions are reachable.
## Meetings
Sources: `activities.md`, `activities-form.md`, `activities-record-detail.md`, `activities-flows.md`; checklist "Meetings and Calls lists", "Meetings record detail", "Meetings create and edit".

### List
- [ ] Look: toolbar, column header row and row layout match the Meetings list spec section.
- [ ] Behaviour: view switcher, sorting, paging and row selection work as the spec describes.
- [ ] Behaviour: selection shows the mass-action bar; clearing hides it.
- [ ] Validation: actions the spec disables for the current selection stay disabled and show the spec's feedback.
- [ ] Keyboard: Tab reaches toolbar, rows and paging; Enter opens a record.

### Filter panel
- [ ] Look: panel layout and field groups match the spec.
- [ ] Behaviour: operators follow the field type; the value control follows the operator.
- [ ] Behaviour: apply and clear change the list as the filter section of the spec or checklist describes; where the Apply result is listed as open, record an open question.
- [ ] Validation: incomplete criteria are handled; the exact message is not fixed by the sources (the checklist lists filter validation as open research), so record an open question instead of a finding.
- [ ] Keyboard: panel opens from the keyboard and closes with Esc; focus order follows the visual order.

### Create / edit form
- [ ] Look: section order, field widths, required markers and buttons match the form spec.
- [ ] Behaviour: defaults, dependent fields and lookups behave as the spec describes.
- [ ] Validation: required, format and length messages appear with the spec's wording and placement.
- [ ] Behaviour: Save, Save and New (where the spec lists it) and Cancel follow the spec.
- [ ] Keyboard: tab order follows the visual order; Enter and Esc act as the spec says.

### Record detail
- [ ] Look: header, side cards, section order and action buttons match the detail spec.
- [ ] Behaviour: header actions and the actions menu offer exactly what the spec lists, and each works.
- [ ] Behaviour: switching sections or tabs keeps the record context.
- [ ] Validation: inline edits (where the spec allows them) show the spec's messages.
- [ ] Keyboard: every header action and card control is reachable and shows a focus ring.

### Related lists
- [ ] Look: card headers, column sets and row layout match the spec.
- [ ] Behaviour: only the related-list actions this module's spec lists work (open, and add/link/unlink if listed); anything else is an open question.
- [ ] Behaviour: an empty related list shows the spec's empty state.
- [ ] Behaviour: counts and ordering update after an add or a removal.
- [ ] Keyboard: related-list actions and row links are reachable.

### Timeline
- [ ] Look: entries, date grouping and icons match the spec.
- [ ] Behaviour: history and notes entries (where the spec lists them) appear in the spec's order.
- [ ] Behaviour: adding a note (where the spec allows it) shows it immediately.
- [ ] Validation: empty-note handling, only if the notes spec defines it; otherwise an open question.
- [ ] Keyboard: timeline entries and their controls are reachable.

### Empty and error states
- [ ] Empty list and empty search show the spec's empty state.
- [ ] Unknown record id: check only if the spec defines it; otherwise record an open question.
- [ ] A failed request: feedback matches the spec if it defines one; otherwise record an open question.
- [ ] Recovery after a failed request: open question unless the spec defines it.
- [ ] Keyboard: error and empty-state actions are reachable.

### Activity cards on parent records
- [ ] Look: cards on Leads, Contacts, Accounts and Deals match the checklist section "Activities in parent modules".
- [ ] Behaviour: Add New from a parent prefills the parent link.
- [ ] Behaviour: open and completed groups follow the spec.
- [ ] Validation: forms opened from a parent show the spec's messages.
- [ ] Keyboard: card actions are reachable.
## Calls
Sources: `activities.md`, `activities-form.md`, `activities-record-detail.md`, `activities-flows.md`; checklist "Meetings and Calls lists", "Calls record detail", "Tasks and Calls forms", "Module 5 correction (MEP-950)".

### List
- [ ] Look: toolbar, column header row and row layout match the Calls list spec section.
- [ ] Behaviour: view switcher, sorting, paging and row selection work as the spec describes.
- [ ] Behaviour: selection shows the mass-action bar; clearing hides it.
- [ ] Validation: actions the spec disables for the current selection stay disabled and show the spec's feedback.
- [ ] Keyboard: Tab reaches toolbar, rows and paging; Enter opens a record.

### Filter panel
- [ ] Look: panel layout and field groups match the spec.
- [ ] Behaviour: operators follow the field type; the value control follows the operator.
- [ ] Behaviour: apply and clear change the list as the filter section of the spec or checklist describes; where the Apply result is listed as open, record an open question.
- [ ] Validation: incomplete criteria are handled; the exact message is not fixed by the sources (the checklist lists filter validation as open research), so record an open question instead of a finding.
- [ ] Keyboard: panel opens from the keyboard and closes with Esc; focus order follows the visual order.

### Create / edit form
- [ ] Look: section order, field widths, required markers and buttons match the form spec.
- [ ] Behaviour: defaults, dependent fields and lookups behave as the spec describes.
- [ ] Validation: required, format and length messages appear with the spec's wording and placement.
- [ ] Behaviour: Save, Save and New (where the spec lists it) and Cancel follow the spec.
- [ ] Keyboard: tab order follows the visual order; Enter and Esc act as the spec says.

### Record detail
- [ ] Look: header, side cards, section order and action buttons match the detail spec.
- [ ] Behaviour: header actions and the actions menu offer exactly what the spec lists, and each works.
- [ ] Behaviour: switching sections or tabs keeps the record context.
- [ ] Validation: inline edits (where the spec allows them) show the spec's messages.
- [ ] Keyboard: every header action and card control is reachable and shows a focus ring.

### Related lists
- [ ] Look: card headers, column sets and row layout match the spec.
- [ ] Behaviour: only the related-list actions this module's spec lists work (open, and add/link/unlink if listed); anything else is an open question.
- [ ] Behaviour: an empty related list shows the spec's empty state.
- [ ] Behaviour: counts and ordering update after an add or a removal.
- [ ] Keyboard: related-list actions and row links are reachable.

### Timeline
- [ ] Look: entries, date grouping and icons match the spec.
- [ ] Behaviour: history and notes entries (where the spec lists them) appear in the spec's order.
- [ ] Behaviour: adding a note (where the spec allows it) shows it immediately.
- [ ] Validation: empty-note handling, only if the notes spec defines it; otherwise an open question.
- [ ] Keyboard: timeline entries and their controls are reachable.

### Empty and error states
- [ ] Empty list and empty search show the spec's empty state.
- [ ] Unknown record id: check only if the spec defines it; otherwise record an open question.
- [ ] A failed request: feedback matches the spec if it defines one; otherwise record an open question.
- [ ] Recovery after a failed request: open question unless the spec defines it.
- [ ] Keyboard: error and empty-state actions are reachable.

### Activity cards on parent records
- [ ] Look: cards on Leads, Contacts, Accounts and Deals match the checklist section "Activities in parent modules".
- [ ] Behaviour: Add New from a parent prefills the parent link.
- [ ] Behaviour: open and completed groups follow the spec.
- [ ] Validation: forms opened from a parent show the spec's messages.
- [ ] Keyboard: card actions are reachable.
## Campaigns
Sources: `campaigns.md`; checklist "Module 7 — Campaigns".

### List
- [ ] Look: toolbar, column header row and row layout match the Campaigns list spec section.
- [ ] Behaviour: view switcher, sorting, paging and row selection work as the spec describes.
- [ ] Behaviour: selection shows the mass-action bar; clearing hides it.
- [ ] Validation: actions the spec disables for the current selection stay disabled and show the spec's feedback.
- [ ] Keyboard: Tab reaches toolbar, rows and paging; Enter opens a record.

### Filter panel
- [ ] Look: panel layout and field groups match the spec.
- [ ] Behaviour: operators follow the field type; the value control follows the operator.
- [ ] Behaviour: apply and clear change the list as the filter section of the spec or checklist describes; where the Apply result is listed as open, record an open question.
- [ ] Validation: incomplete criteria are handled; the exact message is not fixed by the sources (the checklist lists filter validation as open research), so record an open question instead of a finding.
- [ ] Keyboard: panel opens from the keyboard and closes with Esc; focus order follows the visual order.

### Create / edit form
- [ ] Look: section order, field widths, required markers and buttons match the form spec.
- [ ] Behaviour: defaults, dependent fields and lookups behave as the spec describes.
- [ ] Validation: required, format and length messages appear with the spec's wording and placement.
- [ ] Behaviour: Save, Save and New (where the spec lists it) and Cancel follow the spec.
- [ ] Keyboard: tab order follows the visual order; Enter and Esc act as the spec says.

### Record detail
- [ ] Look: header, side cards, section order and action buttons match the detail spec.
- [ ] Behaviour: header actions and the actions menu offer exactly what the spec lists, and each works.
- [ ] Behaviour: switching sections or tabs keeps the record context.
- [ ] Validation: inline edits (where the spec allows them) show the spec's messages.
- [ ] Keyboard: every header action and card control is reachable and shows a focus ring.

### Related lists
- [ ] Look: card headers, column sets and row layout match the spec.
- [ ] Behaviour: only the related-list actions this module's spec lists work (open, and add/link/unlink if listed); anything else is an open question.
- [ ] Behaviour: an empty related list shows the spec's empty state.
- [ ] Behaviour: counts and ordering update after an add or a removal.
- [ ] Keyboard: related-list actions and row links are reachable.

### Timeline
- [ ] Look: entries, date grouping and icons match the spec.
- [ ] Behaviour: history and notes entries (where the spec lists them) appear in the spec's order.
- [ ] Behaviour: adding a note (where the spec allows it) shows it immediately.
- [ ] Validation: empty-note handling, only if the notes spec defines it; otherwise an open question.
- [ ] Keyboard: timeline entries and their controls are reachable.

### Empty and error states
- [ ] Empty list and empty search show the spec's empty state.
- [ ] Unknown record id: check only if the spec defines it; otherwise record an open question.
- [ ] A failed request: feedback matches the spec if it defines one; otherwise record an open question.
- [ ] Recovery after a failed request: open question unless the spec defines it.
- [ ] Keyboard: error and empty-state actions are reachable.

### Campaign links from earlier modules
- [ ] Look: cards match the checklist section "Campaigns links in earlier modules".
- [ ] Behaviour: open and add from a parent work.
- [ ] Behaviour: counts match the Campaigns list.
- [ ] Validation: prefilled parent fields follow the spec.
- [ ] Keyboard: card actions are reachable.
## Cases
Sources: `cases.md`; checklist "Module 8 — Cases and Solutions".

### List
- [ ] Look: toolbar, column header row and row layout match the Cases list spec section.
- [ ] Behaviour: view switcher, sorting, paging and row selection work as the spec describes.
- [ ] Behaviour: selection shows the mass-action bar; clearing hides it.
- [ ] Validation: actions the spec disables for the current selection stay disabled and show the spec's feedback.
- [ ] Keyboard: Tab reaches toolbar, rows and paging; Enter opens a record.

### Filter panel
- [ ] Look: panel layout and field groups match the spec.
- [ ] Behaviour: operators follow the field type; the value control follows the operator.
- [ ] Behaviour: apply and clear change the list as the filter section of the spec or checklist describes; where the Apply result is listed as open, record an open question.
- [ ] Validation: incomplete criteria are handled; the exact message is not fixed by the sources (the checklist lists filter validation as open research), so record an open question instead of a finding.
- [ ] Keyboard: panel opens from the keyboard and closes with Esc; focus order follows the visual order.

### Create / edit form
- [ ] Look: section order, field widths, required markers and buttons match the form spec.
- [ ] Behaviour: defaults, dependent fields and lookups behave as the spec describes.
- [ ] Validation: required, format and length messages appear with the spec's wording and placement.
- [ ] Behaviour: Save, Save and New (where the spec lists it) and Cancel follow the spec.
- [ ] Keyboard: tab order follows the visual order; Enter and Esc act as the spec says.

### Record detail
- [ ] Look: header, side cards, section order and action buttons match the detail spec.
- [ ] Behaviour: header actions and the actions menu offer exactly what the spec lists, and each works.
- [ ] Behaviour: switching sections or tabs keeps the record context.
- [ ] Validation: inline edits (where the spec allows them) show the spec's messages.
- [ ] Keyboard: every header action and card control is reachable and shows a focus ring.

### Related lists
- [ ] Look: card headers, column sets and row layout match the spec.
- [ ] Behaviour: only the related-list actions this module's spec lists work (open, and add/link/unlink if listed); anything else is an open question.
- [ ] Behaviour: an empty related list shows the spec's empty state.
- [ ] Behaviour: counts and ordering update after an add or a removal.
- [ ] Keyboard: related-list actions and row links are reachable.

### Timeline
- [ ] Look: entries, date grouping and icons match the spec.
- [ ] Behaviour: history and notes entries (where the spec lists them) appear in the spec's order.
- [ ] Behaviour: adding a note (where the spec allows it) shows it immediately.
- [ ] Validation: empty-note handling, only if the notes spec defines it; otherwise an open question.
- [ ] Keyboard: timeline entries and their controls are reachable.

### Empty and error states
- [ ] Empty list and empty search show the spec's empty state.
- [ ] Unknown record id: check only if the spec defines it; otherwise record an open question.
- [ ] A failed request: feedback matches the spec if it defines one; otherwise record an open question.
- [ ] Recovery after a failed request: open question unless the spec defines it.
- [ ] Keyboard: error and empty-state actions are reachable.

### Cases links and CSV export
- [ ] Look: cards match the checklist section "Cases links in earlier modules".
- [ ] Behaviour: open and add from a parent work.
- [ ] Behaviour: CSV export follows the checklist section "Solutions/Cases CSV export".
- [ ] Validation: export with no selection or no rows follows the spec.
- [ ] Keyboard: export and card actions are reachable.
## Solutions
Sources: `solutions.md`; checklist "Module 8 — Cases and Solutions".

### List
- [ ] Look: toolbar, column header row and row layout match the Solutions list spec section.
- [ ] Behaviour: view switcher, sorting, paging and row selection work as the spec describes.
- [ ] Behaviour: selection shows the mass-action bar; clearing hides it.
- [ ] Validation: actions the spec disables for the current selection stay disabled and show the spec's feedback.
- [ ] Keyboard: Tab reaches toolbar, rows and paging; Enter opens a record.

### Filter panel
- [ ] Look: panel layout and field groups match the spec.
- [ ] Behaviour: operators follow the field type; the value control follows the operator.
- [ ] Behaviour: apply and clear change the list as the filter section of the spec or checklist describes; where the Apply result is listed as open, record an open question.
- [ ] Validation: incomplete criteria are handled; the exact message is not fixed by the sources (the checklist lists filter validation as open research), so record an open question instead of a finding.
- [ ] Keyboard: panel opens from the keyboard and closes with Esc; focus order follows the visual order.

### Create / edit form
- [ ] Look: section order, field widths, required markers and buttons match the form spec.
- [ ] Behaviour: defaults, dependent fields and lookups behave as the spec describes.
- [ ] Validation: required, format and length messages appear with the spec's wording and placement.
- [ ] Behaviour: Save, Save and New (where the spec lists it) and Cancel follow the spec.
- [ ] Keyboard: tab order follows the visual order; Enter and Esc act as the spec says.

### Record detail
- [ ] Look: header, side cards, section order and action buttons match the detail spec.
- [ ] Behaviour: header actions and the actions menu offer exactly what the spec lists, and each works.
- [ ] Behaviour: switching sections or tabs keeps the record context.
- [ ] Validation: inline edits (where the spec allows them) show the spec's messages.
- [ ] Keyboard: every header action and card control is reachable and shows a focus ring.

### Related lists
- [ ] Look: card headers, column sets and row layout match the spec.
- [ ] Behaviour: only the related-list actions this module's spec lists work (open, and add/link/unlink if listed); anything else is an open question.
- [ ] Behaviour: an empty related list shows the spec's empty state.
- [ ] Behaviour: counts and ordering update after an add or a removal.
- [ ] Keyboard: related-list actions and row links are reachable.

### Timeline
- [ ] Look: entries, date grouping and icons match the spec.
- [ ] Behaviour: history and notes entries (where the spec lists them) appear in the spec's order.
- [ ] Behaviour: adding a note (where the spec allows it) shows it immediately.
- [ ] Validation: empty-note handling, only if the notes spec defines it; otherwise an open question.
- [ ] Keyboard: timeline entries and their controls are reachable.

### Empty and error states
- [ ] Empty list and empty search show the spec's empty state.
- [ ] Unknown record id: check only if the spec defines it; otherwise record an open question.
- [ ] A failed request: feedback matches the spec if it defines one; otherwise record an open question.
- [ ] Recovery after a failed request: open question unless the spec defines it.
- [ ] Keyboard: error and empty-state actions are reachable.

### CSV export
- [ ] Look: export entry matches the checklist section "Solutions/Cases CSV export".
- [ ] Behaviour: exported scope follows the spec.
- [ ] Behaviour: file name and columns follow the spec.
- [ ] Validation: empty-result export follows the spec.
- [ ] Keyboard: export control is reachable.
## Cross-cutting

Sources: `csv-import-export.md`, `recycle-bin.md`, `tags.md`, `print-and-share.md`, `typography.md`; checklist "Module 6", "Shared choice panels".

### CSV import and export
- [ ] Look: import and export screens match the spec.
- [ ] Behaviour: each step follows the spec.
- [ ] Behaviour: results and error reports follow the spec.
- [ ] Validation: bad files show the spec's messages.
- [ ] Keyboard: wizard controls are reachable.

### Recycle Bin
- [ ] Look: list matches `recycle-bin.md`.
- [ ] Behaviour: delete moves a record in.
- [ ] Behaviour: restore returns it.
- [ ] Behaviour: delete forever removes it.
- [ ] Validation: confirmations show the spec's wording.

### Tags
- [ ] Look: tag chips match `tags.md`.
- [ ] Behaviour: add and remove.
- [ ] Behaviour: filter by tag.
- [ ] Validation: invalid names show the spec's message.
- [ ] Keyboard: tag controls are reachable.

### Print page and share
- [ ] Look: print page matches the checklist section "Print page".
- [ ] Behaviour: print and share follow `print-and-share.md`.
- [ ] Behaviour: content matches the record.
- [ ] Validation: unavailable share states follow the spec.
- [ ] Keyboard: controls are reachable.

### Shared choice panels
- [ ] Look: panels match the checklist section "Shared choice panels".
- [ ] Behaviour: selection works the same in every form.
- [ ] Behaviour: search inside a panel works.
- [ ] Validation: required panels show the spec's message.
- [ ] Keyboard: open, arrows, Enter and Esc work.

## Documents

Not yet live. When Documents is ready, add a section here using the same pattern (list, filter panel, form, record detail, related lists, timeline, empty/error states) and the new spec and checklist section names.
