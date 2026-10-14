# Activities — Tasks, Meetings and Calls create and edit forms

## Purpose

Tasks is the baseline for later Meetings and Calls form differences. Inventory observed controls and reuse [accounts-form.md](accounts-form.md), [deals-form.md](deals-form.md) and [contacts-form.md](contacts-form.md). Field configuration is in [activities.md](activities.md); documented reminder and recurrence behaviour is in [activities-flows.md](activities-flows.md). No field was filled, option selected, switch changed, lookup searched or save/cancel action invoked. The Edit opening attempt triggered a blocked non-baseline POST to the neutral legacy Edit endpoint. Capture rule 5 stopped further clicks; the edit form was not rendered. The final no-click list is used only for the safety comparison. No exception to the request rules is inferred. Metadata is not evidence of rendered controls.

## Layout

The Create Task page retains the shell with Tasks active. Its title strip has Edit Page Layout followed by Cancel, Save and New, Save in the right group. Task Information is a single column, in this order: Task Owner, Subject, Due Date, Contact type and person input, related-module type and record input, Status, Priority, Reminder, Repeat. Description Information follows with a multiline Description editor and resize grip. Subject alone has a visible required input-edge marker. Due Date shows DD.MM.YYYY without a separate painted calendar icon. Create defaults are Contact, Account, Not Started and High; owner identity is omitted. Reminder and Repeat are off; Repeat appears subdued. No helper text is painted beside them.

No image section, address section, Client Script tab or create-form-view footer is painted. The global utility strip remains at the bottom. Send Notification Email is configured in metadata but is not painted in this create image.

## Control inventory (Tasks)

Stable TF numbers recur across captures. Select arrows belong to their select. Image-only controls supplement controls.json. `same` retains the reference's observation limits. Label differences and position changes use `moved` where appropriate; shell rows are never repeated.

### Control inventory — m5f-tasks-list-base

Shell: SH-01–SH-46 as in [contacts.md](contacts.md); Tasks SH-20 is active. Rest: as in m5-tasks-list-base in [activities.md](activities.md); covered by the overlay: none. No new list control; total records 12. The same list controls and painted boundary are present.

### Control inventory — m5f-task-create

Shell: SH-01–SH-46 as in [contacts.md](contacts.md); Tasks SH-20 active; Channels and Threads AF-48–AF-49 are not painted. SH-46 is image-only. No new shell control.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TF-01 | Header | Edit Page Layout | link | title strip, after title | same | seen (m5f-task-create) | M11 | AF-01 |
| TF-02 | Header | Cancel | button | right group, first | same | seen (m5f-task-create) | M5 | AF-02 |
| TF-03 | Header | Save and New | button | right group, second | same | seen (m5f-task-create) | M5 | AF-03 |
| TF-04 | Header | Save | button | right group, third | same | seen (m5f-task-create) | M5 | AF-04 |
| TF-05 | Task Information | Task Owner | select | row 1, value side | same | seen (m5f-task-create) | M5 | AF-06 |
| TF-06 | Task Information | User lookup icon | icon button | row 1, input right edge | same | seen (m5f-task-create) | M5 | AF-07 |
| TF-07 | Task Information | Subject | input | row 2, value side | not observed | seen (m5f-task-create) | M5 | new |
| TF-08 | Task Information | Due Date | input | row 3, value side | same; calendar not opened | seen (m5f-task-create) | M5 | new |
| TF-09 | Task Information | Contact | select | row 4, label side | not observed; type list not opened | seen (m5f-task-create) | M5 | new |
| TF-10 | Task Information | Contact Name | input | row 4, value side | not observed | seen (m5f-task-create) | M5 | DF-13 moved |
| TF-11 | Task Information | Contact lookup icon | icon button | row 4, input right edge | opens Choose Contact; no selection made | seen (m5f-task-create) | M5 | DF-14 moved |
| TF-12 | Task Information | Account | select | row 5, label side | opens Related To module list; no module selected | seen (m5f-task-create) | M5 | new |
| TF-13 | Task Information | Related To | input | row 5, value side | not observed | seen (m5f-task-create) | M5 | new |
| TF-14 | Task Information | Account lookup icon | icon button | row 5, input right edge | not observed; not opened in this task | seen (m5f-task-create) | M5 | AF-11 moved |
| TF-15 | Task Information | Status | select | row 6, value side | opens five-option list without search | seen (m5f-task-create) | M5 | new |
| TF-16 | Task Information | Priority | select | row 7, value side | not observed; not opened in this task | seen (m5f-task-create) | M5 | new |
| TF-17 | Task Information | Reminder | toggle | row 8, value side | not observed; changing switch forbidden | seen (m5f-task-create) | M5 | new |
| TF-18 | Task Information | Repeat | toggle | row 9, value side | not observed; changing switch forbidden | seen (m5f-task-create) | M5 | new |
| TF-19 | Description Information | Description | input | only editor, value side | same | seen (m5f-task-create) | M5 | AF-44 |
| TF-20 | Description Information | Resize grip | icon button | editor lower-right corner | not observed | seen (m5f-task-create) | M5 | DF-29 |

Absent here: AF-05, AF-08–AF-10, AF-12–AF-43, AF-45–AF-49. TF-08 reuses the shared date component in MEP-317 and DF-18, but its different label is inventoried as new. No AF image/address/financial control is inferred from metadata.

### Control inventory — m5f-task-create-status

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TF-15.1 | Status list | Not Started | menu item | popup, first | not observed; currently checked | seen (m5f-task-create-status) | M5 | new |
| TF-15.2 | Status list | Deferred | menu item | popup, second | not observed | seen (m5f-task-create-status) | M5 | new |
| TF-15.3 | Status list | In Progress | menu item | popup, third | not observed | seen (m5f-task-create-status) | M5 | new |
| TF-15.4 | Status list | Completed | menu item | popup, fourth | not observed | seen (m5f-task-create-status) | M5 | new |
| TF-15.5 | Status list | Waiting for input | menu item | popup, fifth | not observed | seen (m5f-task-create-status) | M5 | new |

Rest: as in m5f-task-create; covered by the overlay: TF-16–TF-18 (value-side area). No search input is painted. Utility-strip connection text covers SH-35–SH-37 (and the DOM Channels/Threads controls); it is status text, not a new action. Option order matches activities.md; the final display label maps to Waiting on someone else in metadata.

### Control inventory — m5f-task-create-related

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TF-12.1 | Related To module list | Search | input | popup, above options | not observed | seen (m5f-task-create-related) | M5 | new |
| TF-12.2 | Related To module list | Account | menu item | popup, option 1 | not observed | seen (m5f-task-create-related) | M3 | new |
| TF-12.3 | Related To module list | Deal | menu item | popup, option 2 | not observed | seen (m5f-task-create-related) | M4 | new |
| TF-12.4 | Related To module list | Product | menu item | popup, option 3 | not observed | seen (m5f-task-create-related) | P2 | new |
| TF-12.5 | Related To module list | Quote | menu item | popup, option 4 | not observed | seen (m5f-task-create-related) | P2 | new |
| TF-12.6 | Related To module list | Sales Order | menu item | popup, option 5 | not observed | seen (m5f-task-create-related) | P2 | new |
| TF-12.7 | Related To module list | Purchase Order | menu item | popup, option 6 | not observed | seen (m5f-task-create-related) | P2 | new |
| TF-12.8 | Related To module list | Invoice | menu item | popup, option 7 | not observed | seen (m5f-task-create-related) | P2 | new |

Rest: as in m5f-task-create; covered by the overlay: none of the value-side controls. The popup covers label text below Related To. Account is checked. Visible module order is Account, Deal, Product, Quote, Sales Order, Purchase Order, Invoice. Campaign, Vendor and Case are DOM entries below the popup viewport, not observed menu rows; no scrolling or selection was attempted.

### Control inventory — m5f-task-create-contact

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TF-11.1 | Contact popup | Close cross | icon button | header, far right | same | seen (m5f-task-create-contact) | M2 | AF-11.1 |
| TF-11.2 | Contact popup | Search by Contact Name | input | below title, left | same | seen (m5f-task-create-contact) | M2 | AF-11.2 |
| TF-11.3 | Contact popup | New Contact | button | below title, right | same | seen (m5f-task-create-contact) | M2 | AF-11.3 |
| TF-11.4 | Contact popup | Table with down arrow icon | icon button | table header, first | same | seen (m5f-task-create-contact) | M2 | AF-11.4 |
| TF-11.5 | Contact popup | Contact Name | column header | table header, text column 1 | same | seen (m5f-task-create-contact) | M2 | AF-11.5 |
| TF-11.6 | Contact popup | Column options | icon button | text column 1, right | same | seen (m5f-task-create-contact) | M2 | AF-11.6 |
| TF-11.7 | Contact popup | Account Name | column header | table header, text column 2 | same | seen (m5f-task-create-contact) | M2 | AF-11.5 moved |
| TF-11.8 | Contact popup | Column options | icon button | text column 2, right | same | seen (m5f-task-create-contact) | M2 | AF-11.6 moved |
| TF-11.9 | Contact popup | Email | column header | table header, text column 3 | not observed | seen (m5f-task-create-contact) | M2 | new |
| TF-11.10 | Contact popup | Column options | icon button | text column 3, right | same | seen (m5f-task-create-contact) | M2 | AF-11.6 moved |
| TF-11.11 | Contact popup | Phone | column header | table header, text column 4 | same | seen (m5f-task-create-contact) | M2 | AF-11.7 moved |
| TF-11.12 | Contact popup | Column options | icon button | text column 4, right | same | seen (m5f-task-create-contact) | M2 | AF-11.8 moved |
| TF-11.13 | Contact popup | Contact Owner | column header | table header, text column 5 | same | seen (m5f-task-create-contact) | M2 | AF-11.11 moved |
| TF-11.14 | Contact popup | Column options | icon button | text column 5, right | same | seen (m5f-task-create-contact) | M2 | AF-11.12 moved |
| TF-11.15 | Contact popup | Filter | icon button | table header, far right | same | seen (m5f-task-create-contact) | M2 | AF-11.13 |
| TF-11.16 | Contact popup | Row selection circle | toggle | each visible row, first | same | seen (m5f-task-create-contact) | M2 | AF-11.14 |
| TF-11.17 | Contact popup | Contact record link | link | each visible row, Contact Name | same | seen (m5f-task-create-contact) | M2 | AF-11.15 |
| TF-11.18 | Contact popup | Phone handset icon | icon button | populated Phone cells, after value | same | seen (m5f-task-create-contact) | M5 | AF-11.16 |
| TF-11.19 | Contact popup | Previous | icon button | footer, right group, first | same | seen (m5f-task-create-contact) | M2 | AF-11.17 |
| TF-11.20 | Contact popup | Next | icon button | footer, right group, second | same | seen (m5f-task-create-contact) | M2 | AF-11.18 |

Rest: as in m5f-task-create; covered by the overlay: TF-01–TF-03, TF-05–TF-17; TF-18 is partly covered. TF-04 remains visible at the far right and TF-19–TF-20 below the dialog; the entire underlying form is inactive. The popup covers most upper shell controls; reuse the shell baseline underneath it. Nine rows are fully visible; a tenth row is clipped at the lower boundary. Row circles, links and handsets are inventoried once as repeated controls. Previous is subdued and Next is enabled in appearance; neither was operated. No total count is painted in the popup footer. Its scrollbar is a scrolling affordance, not an independent action. Compared with Choose Account, the popup adds Account Name and Email columns, places Phone fourth and owner fifth, and omits Website.

### Control inventory — m5f-task-detail-base

No inventory by task scope. This screenshot was inspected only to validate the Edit control. One record-opening click, no skipped click; six related reads establish this task's detail baseline. Record values are omitted.

### Control inventory — m5f-tasks-list-after

Shell: SH-01–SH-46 as in contacts.md; Tasks SH-20 active. Rest: as in m5f-tasks-list-base; covered by the overlay: none. No new control. Painted total records remains 12; no baseline record link was lost. The list structure and control boxes match the baseline.

## Edit form

### Control inventory — m5f-task-edit

The requested Edit form is not observed. Two opening clicks completed without skipped selectors, but the screenshot remains on record detail. A non-baseline legacy Edit POST was blocked by the capture tool; subsequent clicks were stopped. No Task edit-form header, sections, fields, defaults or create/edit differences are inferred. All controls.json entries belong to record detail and are excluded from the form inventory by scope. The thin top progress indicator is a loading state, not a form control. No field values are reproduced.

## Who / what fields

Contact Name renders as a Contact type select at the label side, a blank person input and a lookup icon. controls.json also contains an unpainted native select with Lead / Contact options; this does not establish an opened menu. The authorized sequence does not open this type selector. Related To renders as Account type select, blank related-record input and lookup icon. The opened list inventory is recorded below; no module is selected. Lookup reuse is limited to the shared component in MEP-318 and accounts-form.md. No cross-field constraint is inferred.

## Reminder and repeat controls

Reminder TF-17 and Repeat TF-18 are image-only toggles, not opening buttons or links. Their conditional captures are therefore omitted. Inside controls, defaults after enabling, helper text, dependencies and validation are not observed. Documented semantics: activities-flows.md, D1 and Tasks baseline reminder/recurrence sections. Those describe configuration behaviour without establishing this organization's rendered interior. No switch was changed.

## Differences from the Account form

Single-column Task Information replaces the Accounts two-column form. Subject replaces Account Name as the visible required field. No image/address/financial fields appear. Polymorphic person and related-record type selectors are specific to activities. Due Date, Status, Priority, Reminder and Repeat are activity controls. No Create Form Views / Standard View / custom form page footer or Client Script tab is painted. The shared header actions and owner/lookup components keep prior observation limits.

## Form fields vs metadata

| Painted field | activities.md API name | Metadata type | Visible create control / state |
| --- | --- | --- | --- |
| Task Owner | Owner | ownerlookup | TF-05, TF-06; owner identity omitted |
| Subject | Subject | text | TF-07; required marker |
| Due Date | Due_Date | date | TF-08; date placeholder |
| Contact Name (Contact) | Who_Id | lookup | TF-09–TF-11; type plus input and lookup |
| Related To (Account) | What_Id | lookup | TF-12–TF-14; module plus input and lookup |
| Status | Status | picklist | TF-15; Not Started |
| Priority | Priority | picklist | TF-16; High |
| Reminder | Remind_At | ALARM object | TF-17; off toggle |
| Repeat | Recurring_Activity | RRULE object | TF-18; off, subdued toggle |
| Description | Description | textarea | TF-19; multiline |

Send_Notification_Email, Created_By, Modified_By, Created_Time, Modified_Time, Closed_Time, id, Last_Activity_Time and Tag are in the exported layout but are not painted as create-form controls. Locked__s is not in the exported layout. Metadata's single-column sections agree with the image. Priority catalog High, Highest, Low, Lowest, Normal comes from activities.md only; opened order not observed. Subject's metadata suggestions are not an observed popup.

## Capability table

| Capability | Owner | Reuse / addition | Evidence limit |
| --- | --- | --- | --- |
| Shared form header and owner selection | M5; layout M11 | TF-01–TF-06, AF refs | no actions invoked |
| Task fields and status menu | M5 | TF-07–TF-16, TF-15.1–TF-15.5 | Priority/person type/related lookup not opened |
| Polymorphic related target and person lookup | M5; targets M2/M3/M4/P2 | TF-12.1–TF-12.8, TF-11.1–TF-11.20; AF lookup refs | no selection, search or write |
| Reminder / recurrence | M5 | TF-17–TF-18; activities-flows.md D1 | interior not observed; toggles forbidden |
| Description editor | M5 | TF-19–TF-20 | no text entered or resize attempted |
| Notification delivery | M10; task flag M5 | activities.md / activities-flows.md | email control not painted in create |

## Capture refs

| Slug | Clicks | Skipped | Evidence / boundary |
| --- | --- | --- | --- |
| m5f-tasks-list-base | 0 | 0 | Painted list; total 12; gate apiCalls 56 against prior baseline 56 |
| m5f-task-create | 0 | 0 | Complete visible single-column form |
| m5f-task-create-status | 1 | 0 | Five-option Status menu |
| m5f-task-create-related | 1 | 0 | Search and seven painted related-module options |
| m5f-task-create-contact | 1 | 0 | Choose Contact popup; one Contacts lookup read |
| m5f-task-detail-base | 1 | 0 | Selector source only; six related reads; no detail inventory |
| m5f-task-edit | 2 | 0 | Form not rendered; unexpected legacy Edit POST blocked; stop rule applied |
| m5f-tasks-list-after | 0 | 0 | Painted list; total 12; apiCalls 56 |

m5f-task-create-reminder and m5f-task-create-repeat were not taken because the controls are toggles. The initial list and Contact-popup attempts each failed with profile in use; each identical command succeeded after a measured wait exceeding five minutes. Failed attempts produced no meta/network/image and establish no UI observation. Successful captures have no skipped clicks. Every successful screenshot was opened as an image. Network checks were recorded before each next capture: the list/form/lookup/detail baseline stayed within the task's expected read set, except the blocked legacy Edit opening request. No successful record-write response was observed. The safety stop is an unresolved research boundary, not a claim that the Edit endpoint is read-only.

Raw captures stay local; no images or customer values belong in this repository.

## Open questions

1. Edit opening triggered an unexpected blocked legacy Edit POST; CTO must assess the read-only access boundary before any further Edit research. No retry, alternate route, guard override or expected-call exception was attempted.

2. Priority opened order, Contact type menu rendering, Subject suggestion popup and Related To lookup interior are not observed; their opening is outside this task's authorized sequence.
3. Reminder/Repeat interior, default configuration and dependencies are not observable without changing a switch; reuse documented semantics without inventing layout.
4. Send Notification Email is configured but absent from the create screenshot; conditional rendering is not established.
5. Hover-only form controls, validation/error/success messages and save result are not observed. Write-dependent behaviour stays outside the capture scope.

### Shell controls missing from app-shell.md

None newly observed; SH-01–SH-46 remain the baseline.

## Controls reconciliation

One-based ordinals identify source items, never reference selectors. Every source item is mapped or explicitly excluded. Duplicate wrappers mapped to one number do not increase the distinct-control count. Screenshot visibility takes precedence over DOM presence. Image-only controls are listed separately.

### Reconciliation — m5f-tasks-list-base

| Destination / exclusion | Source item ordinals |
| --- | --- |
| Excluded: non-control wrapper / static text | 1, 37, 51, 59, 62, 84, 88, 112, 120, 135, 140, 152, 188, 441 |
| SH-01 | 2–4 |
| Excluded: zero-size / invisible | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 85, 92–93, 95–96, 98–99, 102–103, 108–111, 134, 138, 185–186, 190–191, 413–421, 426–440, 453 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| Excluded: outside visible viewport | 65–80, 206–209, 222–227, 239–244, 256–260, 272–277, 289–294, 306–311, 323–328, 340–345, 357–361, 373–378, 390–395, 407–412 |
| Excluded: unpainted resize affordance | 82, 187 |
| SH-26 | 86 |
| SH-27 | 87 |
| SH-28 | 89 |
| SH-29 | 90 |
| SH-30 | 91 |
| SH-31 | 94 |
| SH-32 | 97 |
| SH-33 | 100–101 |
| SH-34 | 104–107 |
| TL-01 | 113 |
| TL-02 | 114–117 |
| TL-03 | 118 |
| TL-04 | 119 |
| TL-05 | 121 |
| TL-06 | 122 |
| TL-08 | 123 |
| TL-09 | 124 |
| TL-10 | 125 |
| TL-11 | 126–127 |
| Excluded: refresh not painted | 128–129 |
| TL-12 | 130 |
| TL-13 | 131–132 |
| TL-14 | 133 |
| TL-15 | 136–137 |
| TL-16 | 139 |
| TL-20 | 141–142 |
| TL-21 | 143–144 |
| TL-22 | 145–146 |
| TL-23 | 147–148 |
| TL-24 | 149–150 |
| TL-26 | 151 |
| TL-53 | 153–154 |
| TL-54 | 155–156 |
| TL-55 | 157–158 |
| TL-56 | 159–160 |
| TL-57 | 161–162 |
| TL-58 | 163–164 |
| TL-59 | 165–166 |
| TL-60 | 167–168 |
| TL-61 | 169–170 |
| TL-66 | 171–172 |
| Excluded: filter continuation below panel viewport | 173–184 |
| TL-33 | 189 |
| Excluded: record row data / non-control wrapper | 192–197, 210–213, 216, 219–221, 228–230, 233, 236–238, 245–247, 250, 253–255, 261–263, 266, 269–271, 278–280, 283, 286–288, 295–297, 300, 303–305, 312–314, 317, 320–322, 329–331, 334, 337–339, 346–348, 351, 354–356, 362–364, 367, 370–372, 379–381, 384, 387–389 |
| TL-34 | 198–199 |
| TL-35 | 200 |
| TL-36 | 201–202 |
| TL-62 | 203 |
| TL-63 | 204 |
| TL-64 | 205 |
| TL-40 | 214–215, 231–232, 248–249, 264–265, 281–282, 298–299, 315–316, 332–333, 349–350, 365–366, 382–383 |
| TL-42 | 217–218, 234–235, 251–252, 267–268, 284–285, 301–302, 318–319, 335–336, 352–353, 368–369, 385–386 |
| Excluded: last data row beneath list footer | 396–406 |
| TL-48 | 422 |
| TL-49 | 423 |
| TL-50 | 424 |
| TL-51 | 425 |
| SH-35 | 442 |
| SH-36 | 443 |
| SH-37 | 444 |
| SH-38 | 445 |
| SH-39 | 446 |
| SH-40 | 447 |
| SH-41 | 448 |
| SH-42 | 449 |
| SH-43 | 450 |
| SH-44 | 451 |
| SH-45 | 452 |

Source items 453; source-backed inventory numbers 89; excluded items 273; image-only: SH-46.

### Reconciliation — m5f-task-create

| Destination / exclusion | Source item ordinals |
| --- | --- |
| Excluded: non-control wrapper / static text | 1, 37, 51, 59, 62 |
| SH-01 | 2–4 |
| Excluded: zero-size / invisible | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 91–92, 94–95, 97–98, 101–102, 108–109, 140–151, 155–158 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| Excluded: outside visible viewport | 65–80 |
| Excluded: unpainted resize affordance | 82 |
| Excluded: static title | 84 |
| SH-26 | 85 |
| SH-27 | 86 |
| Excluded: non-control wrapper | 87 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| Excluded: invisible helper / structural wrapper | 107, 152–154, 159 |
| TF-01 | 110 |
| TF-04 | 111 |
| TF-03 | 112 |
| TF-02 | 113 |
| TF-05 | 114–116 |
| TF-06 | 117 |
| TF-07 | 118 |
| TF-08 | 119 |
| Excluded: unpainted native select | 120, 125, 131, 135 |
| TF-09 | 121–122 |
| TF-10 | 123 |
| TF-11 | 124 |
| TF-12 | 126–128 |
| TF-13 | 129 |
| TF-14 | 130 |
| TF-15 | 132–134 |
| TF-16 | 136–138 |
| TF-19 | 139 |
| SH-35 | 160 |
| SH-36 | 161 |
| SH-37 | 162 |
| SH-38 | 163 |
| SH-39 | 164 |
| SH-40 | 165 |
| SH-41 | 166 |
| SH-42 | 167 |
| SH-43 | 168 |
| SH-44 | 169 |
| SH-45 | 170 |

Source items 170; source-backed inventory numbers 62; excluded items 73; image-only: SH-46, TF-17, TF-18, TF-20.

### Reconciliation — m5f-task-create-status

| Destination / exclusion | Source item ordinals |
| --- | --- |
| Excluded: non-control wrapper / static text | 1, 37, 51, 59, 62 |
| SH-01 | 2–4 |
| Excluded: zero-size / invisible | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 91–92, 94–95, 97–98, 101–102, 108–109, 140–154, 158 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| Excluded: outside visible viewport | 65–80 |
| Excluded: unpainted resize affordance | 82 |
| Excluded: static title | 84 |
| SH-26 | 85 |
| SH-27 | 86 |
| Excluded: non-control wrapper | 87 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| Excluded: invisible helper / structural wrapper | 107, 155–157, 159 |
| TF-01 | 110 |
| TF-04 | 111 |
| TF-03 | 112 |
| TF-02 | 113 |
| TF-05 | 114–116 |
| TF-06 | 117 |
| TF-07 | 118 |
| TF-08 | 119 |
| Excluded: unpainted native select | 120, 125, 131, 135 |
| TF-09 | 121–122 |
| TF-10 | 123 |
| TF-11 | 124 |
| TF-12 | 126–128 |
| TF-13 | 129 |
| TF-14 | 130 |
| TF-15 | 132–134 |
| TF-16 | 136–138 |
| TF-19 | 139 |
| Excluded: utility controls covered by connection status text | 160–164 |
| SH-38 | 165 |
| SH-39 | 166 |
| SH-40 | 167 |
| SH-41 | 168 |
| SH-42 | 169 |
| SH-43 | 170 |
| SH-44 | 171 |
| SH-45 | 172 |
| Excluded: search input not painted in popup | 173 |
| Excluded: menu wrapper | 174 |
| TF-15.1 | 175 |
| TF-15.2 | 176 |
| TF-15.3 | 177 |
| TF-15.4 | 178 |
| TF-15.5 | 179 |

Source items 179; source-backed inventory numbers 64; excluded items 80; image-only: SH-46, TF-17, TF-18, TF-20.

### Reconciliation — m5f-task-create-related

| Destination / exclusion | Source item ordinals |
| --- | --- |
| Excluded: non-control wrapper / static text | 1, 37, 51, 59, 62 |
| SH-01 | 2–4 |
| Excluded: zero-size / invisible | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 91–92, 94–95, 97–98, 101–102, 108–109, 140–151, 155–157, 170 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| Excluded: outside visible viewport | 65–80 |
| Excluded: unpainted resize affordance | 82 |
| Excluded: static title | 84 |
| SH-26 | 85 |
| SH-27 | 86 |
| Excluded: non-control wrapper | 87 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| Excluded: invisible helper / structural wrapper | 107, 152–154, 158 |
| TF-01 | 110 |
| TF-04 | 111 |
| TF-03 | 112 |
| TF-02 | 113 |
| TF-05 | 114–116 |
| TF-06 | 117 |
| TF-07 | 118 |
| TF-08 | 119 |
| Excluded: unpainted native select | 120, 125, 131, 135 |
| TF-09 | 121–122 |
| TF-10 | 123 |
| TF-11 | 124 |
| TF-12 | 126–128 |
| TF-13 | 129 |
| TF-14 | 130 |
| TF-15 | 132–134 |
| TF-16 | 136–138 |
| TF-19 | 139 |
| SH-35 | 159 |
| SH-36 | 160 |
| SH-37 | 161 |
| SH-38 | 162 |
| SH-39 | 163 |
| SH-40 | 164 |
| SH-41 | 165 |
| SH-42 | 166 |
| SH-43 | 167 |
| SH-44 | 168 |
| SH-45 | 169 |
| TF-12.1 | 171 |
| Excluded: menu wrapper | 172 |
| TF-12.2 | 173 |
| TF-12.3 | 174 |
| TF-12.4 | 175 |
| TF-12.5 | 176 |
| TF-12.6 | 177 |
| TF-12.7 | 178 |
| TF-12.8 | 179 |
| Excluded: options below popup viewport | 180–182 |

Source items 182; source-backed inventory numbers 70; excluded items 77; image-only: SH-46, TF-17, TF-18, TF-20.


### Reconciliation — m5f-task-create-contact

| Destination / exclusion | Source item ordinals |
| --- | --- |
| Excluded: non-control wrapper / static text | 1, 37, 51, 59, 62 |
| SH-01 | 2–4 |
| Excluded: zero-size / invisible | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 91–92, 94–95, 97–98, 101–102, 108–109, 123–124, 142–155, 159, 172, 179, 198–199 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| Excluded: outside visible viewport | 65–80 |
| Excluded: unpainted resize affordance | 82 |
| Excluded: static title | 84 |
| SH-26 | 85 |
| SH-27 | 86 |
| Excluded: non-control wrapper | 87 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| Excluded: invisible helper / structural wrapper | 107, 156–158, 160 |
| TF-01 | 110 |
| TF-04 | 111 |
| TF-03 | 112 |
| TF-02 | 113 |
| TF-05 | 114–116 |
| TF-06 | 117 |
| TF-07 | 118 |
| TF-08 | 119 |
| Excluded: unpainted native select | 120, 127, 133, 137 |
| TF-09 | 121–122 |
| TF-10 | 125 |
| TF-11 | 126 |
| TF-12 | 128–130 |
| TF-13 | 131 |
| TF-14 | 132 |
| TF-15 | 134–136 |
| TF-16 | 138–140 |
| TF-19 | 141 |
| SH-35 | 161 |
| SH-36 | 162 |
| SH-37 | 163 |
| SH-38 | 164 |
| SH-39 | 165 |
| SH-40 | 166 |
| SH-41 | 167 |
| SH-42 | 168 |
| SH-43 | 169 |
| SH-44 | 170 |
| SH-45 | 171 |
| Excluded: popup structural wrapper / record data | 173, 181–185, 197, 200–202, 205, 208–214, 217, 220–226, 229, 232–238, 241, 244–250, 253, 256–262, 265, 268–274, 277, 280–286, 289, 292–298, 301, 304–308, 321–322 |
| TF-11.1 | 174 |
| TF-11.2 | 175–176 |
| TF-11.3 | 177–178 |
| TF-11.15 | 180 |
| TF-11.4 | 186 |
| TF-11.5 | 187 |
| TF-11.6 | 188 |
| TF-11.7 | 189 |
| TF-11.8 | 190 |
| TF-11.9 | 191 |
| TF-11.10 | 192 |
| TF-11.11 | 193 |
| TF-11.12 | 194 |
| TF-11.13 | 195 |
| TF-11.14 | 196 |
| TF-11.16 | 203–204, 215–216, 227–228, 239–240, 251–252, 263–264, 275–276, 287–288, 299–300 |
| TF-11.17 | 206–207, 218–219, 230–231, 242–243, 254–255, 266–267, 278–279, 290–291, 302–303 |
| Excluded: clipped last popup row | 309–320 |
| TF-11.19 | 323 |
| TF-11.20 | 324 |

Source items 324; source-backed inventory numbers 81; excluded items 172; image-only: SH-46, TF-11.18, TF-17, TF-18, TF-20.

### Reconciliation — m5f-tasks-list-after

| Destination / exclusion | Source item ordinals |
| --- | --- |
| Excluded: non-control wrapper / static text | 1, 37, 51, 59, 62, 84, 88, 112, 120, 135, 140, 152, 188, 441 |
| SH-01 | 2–4 |
| Excluded: zero-size / invisible | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 85, 92–93, 95–96, 98–99, 102–103, 108–111, 134, 138, 185–186, 190–191, 413–421, 426–440, 453 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| Excluded: outside visible viewport | 65–80, 206–209, 222–227, 239–244, 256–260, 272–277, 289–294, 306–311, 323–328, 340–345, 357–361, 373–378, 390–395, 407–412 |
| Excluded: unpainted resize affordance | 82, 187 |
| SH-26 | 86 |
| SH-27 | 87 |
| SH-28 | 89 |
| SH-29 | 90 |
| SH-30 | 91 |
| SH-31 | 94 |
| SH-32 | 97 |
| SH-33 | 100–101 |
| SH-34 | 104–107 |
| TL-01 | 113 |
| TL-02 | 114–117 |
| TL-03 | 118 |
| TL-04 | 119 |
| TL-05 | 121 |
| TL-06 | 122 |
| TL-08 | 123 |
| TL-09 | 124 |
| TL-10 | 125 |
| TL-11 | 126–127 |
| Excluded: refresh not painted | 128–129 |
| TL-12 | 130 |
| TL-13 | 131–132 |
| TL-14 | 133 |
| TL-15 | 136–137 |
| TL-16 | 139 |
| TL-20 | 141–142 |
| TL-21 | 143–144 |
| TL-22 | 145–146 |
| TL-23 | 147–148 |
| TL-24 | 149–150 |
| TL-26 | 151 |
| TL-53 | 153–154 |
| TL-54 | 155–156 |
| TL-55 | 157–158 |
| TL-56 | 159–160 |
| TL-57 | 161–162 |
| TL-58 | 163–164 |
| TL-59 | 165–166 |
| TL-60 | 167–168 |
| TL-61 | 169–170 |
| TL-66 | 171–172 |
| Excluded: filter continuation below panel viewport | 173–184 |
| TL-33 | 189 |
| Excluded: record row data / non-control wrapper | 192–197, 210–213, 216, 219–221, 228–230, 233, 236–238, 245–247, 250, 253–255, 261–263, 266, 269–271, 278–280, 283, 286–288, 295–297, 300, 303–305, 312–314, 317, 320–322, 329–331, 334, 337–339, 346–348, 351, 354–356, 362–364, 367, 370–372, 379–381, 384, 387–389 |
| TL-34 | 198–199 |
| TL-35 | 200 |
| TL-36 | 201–202 |
| TL-62 | 203 |
| TL-63 | 204 |
| TL-64 | 205 |
| TL-40 | 214–215, 231–232, 248–249, 264–265, 281–282, 298–299, 315–316, 332–333, 349–350, 365–366, 382–383 |
| TL-42 | 217–218, 234–235, 251–252, 267–268, 284–285, 301–302, 318–319, 335–336, 352–353, 368–369, 385–386 |
| Excluded: last data row beneath list footer | 396–406 |
| TL-48 | 422 |
| TL-49 | 423 |
| TL-50 | 424 |
| TL-51 | 425 |
| SH-35 | 442 |
| SH-36 | 443 |
| SH-37 | 444 |
| SH-38 | 445 |
| SH-39 | 446 |
| SH-40 | 447 |
| SH-41 | 448 |
| SH-42 | 449 |
| SH-43 | 450 |
| SH-44 | 451 |
| SH-45 | 452 |

Source items 453; source-backed inventory numbers 89; excluded items 273; image-only: SH-46.

### Reconciliation — m5f-task-detail-base

| Destination / exclusion | Source item ordinals |
| --- | --- |
| Excluded: record-detail controls, outside this form inventory | 1–320 |

Source items 320; form inventory numbers 0; excluded items 320. Detail-base has an explicit selector-only scope exemption. Edit remains on the detail screen after its blocked opening call; none of these items establishes an edit-form control. Both screenshots were inspected, without reproducing record values or a second detail inventory.

### Reconciliation — m5f-task-edit

| Destination / exclusion | Source item ordinals |
| --- | --- |
| Excluded: record-detail controls, outside this form inventory | 1–320 |

Source items 320; form inventory numbers 0; excluded items 320. Detail-base has an explicit selector-only scope exemption. Edit remains on the detail screen after its blocked opening call; none of these items establishes an edit-form control. Both screenshots were inspected, without reproducing record values or a second detail inventory.

## Meeting form

Tasks TF numbers above remain the baseline. Meetings research follows the
read-only capture boundary; record values and identities are omitted. The
CTO decision in MEP-427 prohibits opening Edit. The selector-only detail
capture is consequently omitted too. Meeting edit form: **not observed**.
The existing Meeting detail specification and documented D2/D5 semantics in
[activities-flows.md](activities-flows.md) describe capabilities, not an
observed edit layout or confirmed create/edit differences.

### Control inventory — m5g-meetings-list-base

Shell: SH-01–SH-46 as in [contacts.md](contacts.md); Meetings SH-21 active.
Rest: as in m5l-meetings-list-base in [activities.md](activities.md); covered
by the overlay: none. Absent here: ML-40–ML-41 (highlighted-row pencil and
note bubble). Total Records is 9; all nine record links are present. No new
list or shell control. The screenshot was opened as an image and scanned
through the rail, toolbar, filter panel, table, footer and utility strip.

### Reconciliation — m5g-meetings-list-base

Every one-based source ordinal is mapped below. Ordinals are evidence
indexes, never click selectors. Visibility exclusions retain the preceding
Meetings list baseline; the screenshot confirms the same visible boundary.

| Destination / exclusion | Source item ordinals |
| --- | --- |
| Excluded: non-control wrapper / static text | 1, 37, 51, 59, 62, 84, 88, 112, 120, 134, 139, 149, 209, 213, 214, 215, 216, 217, 218 |
| SH-01 | 2, 3, 4 |
| Excluded: zero-area / invisible | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 85, 92, 93, 95, 96, 98, 99, 102, 103, 108, 109, 110, 111, 133, 137, 206, 207, 211, 212, 373, 374, 375, 376, 377, 378, 379, 380, 381, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 413 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29, 30, 31 |
| SH-10 | 33 |
| SH-11 | 34, 35 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 60, 61 |
| SH-25 | 63, 64 |
| Excluded: outside visible viewport / clipped filter continuation | 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 227, 228, 229, 243, 244, 245, 246, 259, 260, 261, 262, 275, 276, 277, 278, 291, 292, 293, 294, 307, 308, 309, 322, 323, 324, 325, 338, 339, 340, 341, 354, 355, 356, 369, 370, 371, 372, 401 |
| Excluded: unpainted resize affordance | 82, 208 |
| SH-26 | 86 |
| SH-27 | 87 |
| SH-28 | 89 |
| SH-29 | 90 |
| SH-30 | 91 |
| SH-31 | 94 |
| SH-32 | 97 |
| SH-33 | 100, 101 |
| SH-34 | 104, 105, 106, 107 |
| ML-01 | 113 |
| ML-02 | 114, 115, 116, 117 |
| ML-03 | 118 |
| ML-04 | 119 |
| ML-05 | 121 |
| ML-06 | 122 |
| ML-07 | 123 |
| ML-08 | 124 |
| ML-09 | 125, 126 |
| Excluded: Refresh not painted | 127, 128 |
| ML-10 | 129 |
| ML-11 | 130, 131 |
| ML-12 | 132 |
| ML-13 | 135, 136 |
| ML-14 | 138 |
| ML-15 | 140, 141 |
| ML-16 | 142, 143 |
| ML-17 | 144, 145 |
| ML-18 | 146, 147 |
| ML-19 | 148 |
| ML-20 | 150, 151 |
| ML-21 | 152, 153 |
| ML-22 | 154, 155 |
| ML-23 | 156, 157 |
| ML-24 | 158, 159 |
| ML-25 | 160, 161 |
| ML-26 | 162, 163 |
| ML-27 | 164, 165 |
| ML-28 | 166, 167 |
| ML-29 | 168, 169 |
| ML-30 | 210 |
| ML-31 | 219, 220 |
| ML-32 | 221 |
| ML-33 | 222, 223 |
| ML-34 | 224 |
| ML-35 | 225 |
| ML-36 | 226 |
| Excluded: record row data / non-control wrapper | 230, 231, 232, 233, 236, 239, 240, 241, 247, 248, 249, 252, 255, 256, 257, 263, 264, 265, 268, 271, 272, 273, 279, 280, 281, 284, 287, 288, 289, 295, 296, 297, 300, 303, 304, 305, 310, 311, 312, 315, 318, 319, 320, 326, 327, 328, 331, 334, 335, 336, 342, 343, 344, 347, 350, 351, 352, 357, 358, 359, 362, 365, 366, 367 |
| ML-37 | 234, 235, 250, 251, 266, 267, 282, 283, 298, 299, 313, 314, 329, 330, 345, 346, 360, 361 |
| ML-38 | 237, 238, 253, 254, 269, 270, 285, 286, 301, 302, 316, 317, 332, 333, 348, 349, 363, 364 |
| ML-39 | 242, 258, 274, 290, 306, 321, 337, 353, 368 |
| ML-42 | 382 |
| ML-43 | 383 |
| ML-44 | 384 |
| ML-45 | 385 |
| SH-35 | 402 |
| SH-36 | 403 |
| SH-37 | 404 |
| SH-38 | 405 |
| SH-39 | 406 |
| SH-40 | 407 |
| SH-41 | 408 |
| SH-42 | 409 |
| SH-43 | 410 |
| SH-44 | 411 |
| SH-45 | 412 |

Source items 413; mapped source items 178; excluded 235; source-backed
inventory numbers 88; image-only SH-46 adds one (89 total).

### Control inventory — m5g-meeting-create

Shell: SH-01–SH-46 as in [contacts.md](contacts.md); Meetings SH-21 active.
The permitted create address produced the shell with an empty content region
on both completed attempts. Each used the prescribed wait; the second began
more than three minutes after the first completed. **Create Meeting form is
not observed.** There is no painted form title, header action, section, field,
required marker or footer to inventory. No MF number is allocated to an
unseen control. This is an incomplete rendering observation, not proof that
Meetings lacks a create form. No alternative address or create-button click
was attempted. Shell controls missing from app-shell.md: none newly observed.

Absent here: all TF-01–TF-20 form controls are unpainted; this does not establish
that their Meeting equivalents are unavailable. The shell utility strip is
painted. The screenshot was opened as an image, including the right boundary
and bottom corners.

### Date-time, all-day and venue fields (Meetings)

From / To, All day, Host, Location, Meeting Venue and Provider: rendered
controls, ordering, default state, visible requiredness, date/time split and
provider menu are **not observed**. No date/time list or picklist was opened.
Metadata establishes field configuration only (table below). Documented D2
in activities-flows.md describes start/end, all-day and physical/online venue
semantics; it does not establish this organization's form presentation.
Provider choices and conditional visibility remain open questions.

### Participants picker (Meetings)

No participant-opening button/link was painted. Conditional capture
m5g-meeting-create-participants is omitted. Picker title, tabs, search,
headers, row controls and footer are **not observed**. No participant was
selected, added or removed, and no invitation was sent. Reuse documented D2
participant categories and limits in activities-flows.md only as documented
behaviour; do not infer an observed picker from them.

### Reminder and repeat controls (Meetings)

Reminder, Participants Reminder and Repeat control types and positions are
**not observed**. There is no painted button/link permitting an opening
capture, so m5g-meeting-create-repeat and m5g-meeting-create-reminder are
omitted. No switch/checkbox was changed. Documented recurrence and reminder
semantics reuse activities-flows.md D2/D5; they do not confirm rendered
interiors, default configurations or create/edit dependencies. Contact Name
and Related To differences from TF-09–TF-14 likewise remain **not observed**.

### Meeting form fields vs metadata

All rows below are metadata-only. API names and types reuse activities.md;
none is promoted to a seen control or assigned an MF number.

| Configured field | API name | Metadata type | Visible create control / state |
| --- | --- | --- | --- |
| Title | Event_Title | text | not observed; layout required |
| Meeting Venue | Meeting_Venue__s | picklist | not observed; layout required |
| Location | Venue | text | not observed |
| Provider | Meeting_Provider__s | picklist | not observed; catalog unavailable in export |
| All day | All_day | boolean | not observed |
| From | Start_DateTime | datetime | not observed; layout required |
| To | End_DateTime | datetime | not observed; layout required |
| Host | Owner | ownerlookup | not observed |
| Participants | Participants | bigint | not observed; participant semantics documented separately |
| Contact Name | Who_Id | lookup | not observed; no TF equivalence established |
| Related To | What_Id | lookup | not observed; no TF equivalence established |
| Repeat | Recurring_Activity | RRULE | not observed |
| Participants Reminder | Remind_Participants | multireminder | not observed |
| Description | Description | textarea | not observed |
| Reminder | Remind_At | multireminder | not observed |

Exported layout sections are Meeting Information and Meeting Additional
Information. Audit, check-in, geographic, tag and record-identity fields
remain metadata-only as listed in activities.md; they are not an observed
create form. No notification, validation, success, error or invitation
confirmation state is inferred.

### Meeting capability table

| Capability | Owner | Reuse / addition | Evidence limit |
| --- | --- | --- | --- |
| Form shell | M5; shell registry | SH references above | shell seen; create content unpainted |
| Scheduling / host / venue | M5 | activities.md metadata; activities-flows.md D2 | form controls and provider catalog not observed |
| Participants / related person and record | M5; targets M1/M2/M3/M4/P2 | D2; TF baseline as comparison only | picker and actual form equivalence not observed |
| Reminder / participants reminder / recurrence | M5 | D2/D5 | no interior observed or toggle changed |
| Edit form | M5 | existing Meeting detail and D2/D5 | CTO prohibits Edit opening; create/edit differences not observed |
| Invitation delivery | M10; participant state M5 | activities-flows.md | delivery outside scope; no send action |

### Meeting capture refs

| Slug | Clicks | Skipped | Evidence / boundary |
| --- | --- | --- | --- |
| m5g-meetings-list-base | 0 | 0 | Painted list; total 9; apiCalls 57, previous baseline 57; gate passed |
| m5g-meeting-create | 0 | 0 | Shell only; two completed captures both apiCalls 47; form not observed |
| m5g-meetings-list-after | 0 | 0 | Painted list; total 9; apiCalls 56; no baseline record link lost |

The initial create attempt failed with profile in use and produced no usable
meta/network/image. The identical command was retried after a measured wait
exceeding five minutes; its shell-only image triggered the single permitted
boyanma retry after more than three minutes. The saved create slug represents
the final completed attempt. Earlier completed-attempt counts remain in the
issue's comments. Every completed screenshot was opened as an image.
The create read baseline has only the shared shell trigger outside GET;
blocked reminder/notification/telemetry calls stay within the expected set.
No successful record-write response or clicked control was observed.

Not captured: participants/venue/repeat/reminder (no painted opening control);
detail-base (selector-only prerequisite unnecessary when Edit is forbidden);
edit (CTO decision). No alternate path, selector or guard override was tried.
Raw images remain in the local research workspace.

### Meeting open questions

1. The authorized create address paints only the shell after the permitted
   retry. A safe supported route to the form needs lead/CTO assessment before
   further capture; an alternative route was not attempted in this task.
2. Complete create inventory, required markers, From/To date/time arrangement,
   all-day defaults, Host lookup, venue/provider menu and Location dependencies
   remain not observed. Metadata is not a substitute for a rendered image.
3. Participants picker, participants reminder and repeat/reminder interiors,
   Contact Name / Related To differences and any hover-only form controls
   remain not observed. No control type is invented from its field type.
4. Edit is not observed under the CTO's no-Edit decision. Exact create/edit
   differences, recurrence-instance prompt and read-only edit access remain
   unresolved; existing detail and documented semantics do not answer layout.
5. Validation/error/success, invitations and saved effects require writes and
   remain outside this capture scope. No board decision is requested here.

### Reconciliation — m5g-meeting-create

One-based ordinals are evidence indexes only. The screenshot paints shell
controls, no form controls. Every source item is mapped or excluded below.

| Destination / exclusion | Source item ordinals |
| --- | --- |
| Excluded: non-control wrapper / static text | 1, 37, 51, 59, 62, 82, 84, 87, 122 |
| SH-01 | 2, 3, 4 |
| Excluded: zero-area / invisible | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 91, 92, 94, 95, 97, 98, 101, 102, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 134 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29, 30, 31 |
| SH-10 | 33 |
| SH-11 | 34, 35 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 60, 61 |
| SH-25 | 63, 64 |
| Excluded: outside visible viewport | 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99, 100 |
| SH-34 | 103, 104, 105, 106 |
| SH-35 | 123 |
| SH-36 | 124 |
| SH-37 | 125 |
| SH-38 | 126 |
| SH-39 | 127 |
| SH-40 | 128 |
| SH-41 | 129 |
| SH-42 | 130 |
| SH-43 | 131 |
| SH-44 | 132 |
| SH-45 | 133 |

Source items 134; mapped source items 71; excluded 63; source-backed
inventory numbers 45; image-only SH-46 adds one (46 total). Form controls 0.

### Control inventory — m5g-meetings-list-after

Shell: SH-01–SH-46 as in contacts.md; Meetings SH-21 active. Differences:
Channels AF-48 and Threads AF-49 appear in utility-strip positions three and
four, as in accounts-form.md; Contacts SH-37 moves after them. No shell rows
are repeated. Their module ownership remains ? as in that prior spec.

Rest: as in m5g-meetings-list-base; covered by the overlay: none. No new
Meeting control. Painted Total Records remains 9; no baseline record link
is missing. The screenshot was opened as an image and its full boundary
checked. Shell controls missing from app-shell.md: existing AF-48–AF-49
classification gap only; no newly discovered control.

### Reconciliation — m5g-meetings-list-after

| Destination / exclusion | Source item ordinals |
| --- | --- |
| Excluded: non-control wrapper / static text | 1, 37, 51, 59, 62, 84, 88, 112, 120, 134, 139, 149, 209, 213, 214, 215, 216, 217, 218, 401 |
| SH-01 | 2, 3, 4 |
| Excluded: zero-area / invisible | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 85, 92, 93, 95, 96, 98, 99, 102, 103, 108, 109, 110, 111, 133, 137, 206, 207, 211, 212, 373, 374, 375, 376, 377, 378, 379, 380, 381, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 415 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29, 30, 31 |
| SH-10 | 33 |
| SH-11 | 34, 35 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 60, 61 |
| SH-25 | 63, 64 |
| Excluded: outside visible viewport / clipped filter continuation | 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 227, 228, 229, 243, 244, 245, 246, 259, 260, 261, 262, 275, 276, 277, 278, 291, 292, 293, 294, 307, 308, 309, 322, 323, 324, 325, 338, 339, 340, 341, 354, 355, 356, 369, 370, 371, 372 |
| Excluded: unpainted resize affordance | 82, 208 |
| SH-26 | 86 |
| SH-27 | 87 |
| SH-28 | 89 |
| SH-29 | 90 |
| SH-30 | 91 |
| SH-31 | 94 |
| SH-32 | 97 |
| SH-33 | 100, 101 |
| SH-34 | 104, 105, 106, 107 |
| ML-01 | 113 |
| ML-02 | 114, 115, 116, 117 |
| ML-03 | 118 |
| ML-04 | 119 |
| ML-05 | 121 |
| ML-06 | 122 |
| ML-07 | 123 |
| ML-08 | 124 |
| ML-09 | 125, 126 |
| Excluded: Refresh not painted | 127, 128 |
| ML-10 | 129 |
| ML-11 | 130, 131 |
| ML-12 | 132 |
| ML-13 | 135, 136 |
| ML-14 | 138 |
| ML-15 | 140, 141 |
| ML-16 | 142, 143 |
| ML-17 | 144, 145 |
| ML-18 | 146, 147 |
| ML-19 | 148 |
| ML-20 | 150, 151 |
| ML-21 | 152, 153 |
| ML-22 | 154, 155 |
| ML-23 | 156, 157 |
| ML-24 | 158, 159 |
| ML-25 | 160, 161 |
| ML-26 | 162, 163 |
| ML-27 | 164, 165 |
| ML-28 | 166, 167 |
| ML-29 | 168, 169 |
| ML-30 | 210 |
| ML-31 | 219, 220 |
| ML-32 | 221 |
| ML-33 | 222, 223 |
| ML-34 | 224 |
| ML-35 | 225 |
| ML-36 | 226 |
| Excluded: record row data / non-control wrapper | 230, 231, 232, 233, 236, 239, 240, 241, 247, 248, 249, 252, 255, 256, 257, 263, 264, 265, 268, 271, 272, 273, 279, 280, 281, 284, 287, 288, 289, 295, 296, 297, 300, 303, 304, 305, 310, 311, 312, 315, 318, 319, 320, 326, 327, 328, 331, 334, 335, 336, 342, 343, 344, 347, 350, 351, 352, 357, 358, 359, 362, 365, 366, 367 |
| ML-37 | 234, 235, 250, 251, 266, 267, 282, 283, 298, 299, 313, 314, 329, 330, 345, 346, 360, 361 |
| ML-38 | 237, 238, 253, 254, 269, 270, 285, 286, 301, 302, 316, 317, 332, 333, 348, 349, 363, 364 |
| ML-39 | 242, 258, 274, 290, 306, 321, 337, 353, 368 |
| ML-42 | 382 |
| ML-43 | 383 |
| ML-44 | 384 |
| ML-45 | 385 |
| SH-35 | 402 |
| SH-36 | 403 |
| AF-48 | 404 |
| AF-49 | 405 |
| SH-37 | 406 |
| SH-38 | 407 |
| SH-39 | 408 |
| SH-40 | 409 |
| SH-41 | 410 |
| SH-42 | 411 |
| SH-43 | 412 |
| SH-44 | 413 |
| SH-45 | 414 |

Source items 415; mapped source items 180; excluded 235; source-backed
inventory numbers 90; image-only SH-46 adds one (91 total).


## Call forms

The permitted create address renders **Create Call**, with Outbound and
Scheduled defaults. This is the observed schedule-state create form, not
proof that the unobserved Create menu opens an identical form. The earlier
m5l-calls-create-menu trigger was skipped by the tool; no menu row was
available for a Log capture. Log and Edit forms remain **not observed**.
The CTO's no-Edit decision also makes the selector-only detail capture
unnecessary; existing Calls detail evidence is in activities-record-detail.md.

Call Information is a single column: Call From/To with Contact type beneath
its label, Related To, Call Type, Outgoing Call Status, Call Start Time,
Call Owner, Subject, Reminder. Purpose Of Outgoing Call follows. A Call
Purpose select is fully painted; only the upper edge of the following input
is painted above the fixed utility strip. Its Call Agenda identity comes
from controls.json and metadata; its label and complete input are not observed
in the image. No scrolling was authorized. Lower outcome/description fields
are not inferred to be absent from the complete form.

Required input-edge markers are painted on Call From/To, Call Type and the
date side of Call Start Time. Related To and Subject have no marker. The
initial person input has a focus outline set by the page; no field was
clicked, filled or searched. Owner identity and the initialized time value
are omitted. Call Type and Outgoing Call Status both have dropdown arrows;
their options and conditional changes were not opened. No duration control
is painted in this Scheduled state. The footer is the global utility strip,
not an observed additional form action row.

### Control inventory — m5h-calls-list-base

Shell: SH-01–SH-46 as in [contacts.md](contacts.md); Calls SH-22 active.
Rest: as in m5l-calls-list-base in [activities.md](activities.md); covered by
the overlay: none. Absent here: CL-39–CL-41 highlighted-row affordances.
Total Records 890; range 1 to 30. No new list control.

### Control inventory — m5h-call-schedule

Shell: SH-01–SH-46 as in [contacts.md](contacts.md); Calls SH-22 active.
No newly observed shell control. Utility-strip controls remain visible.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CF-01 | Header | Edit Page Layout | link | title strip, after title | same | seen (m5h-call-schedule) | M11 | TF-01 |
| CF-02 | Header | Save and Create Follow-up Task | button | right group, first | not observed; never invoked | seen (m5h-call-schedule) | M5 | new |
| CF-03 | Header | Cancel | button | right group, second | same | seen (m5h-call-schedule) | M5 | TF-02 moved |
| CF-04 | Header | Save | button | right group, third | same | seen (m5h-call-schedule) | M5 | TF-04 |
| CF-05 | Call Information | Contact | select | row 1, label side, below Call From/To | same; type list not opened | seen (m5h-call-schedule) | M5 | TF-09 moved |
| CF-06 | Call Information | Call From/To | input | row 1, value side | not observed | seen (m5h-call-schedule) | M5 | new |
| CF-07 | Call Information | Contact lookup icon | icon button | row 1, input right edge | same; not opened here | seen (m5h-call-schedule) | M5 | TF-11 moved |
| CF-08 | Call Information | Related To | input | row 2, value side | same | seen (m5h-call-schedule) | M5 | TF-13 moved |
| CF-09 | Call Information | Related-record lookup icon | icon button | row 2, input right edge | not observed; no module selector painted | seen (m5h-call-schedule) | M5 | TF-14 moved |
| CF-10 | Call Information | Call Type | select | row 3, value side | not observed; Outbound displayed with dropdown arrow | seen (m5h-call-schedule) | M5 | new |
| CF-11 | Call Information | Outgoing Call Status | select | row 4, value side | not observed; Scheduled displayed with dropdown arrow | seen (m5h-call-schedule) | M5 | new |
| CF-12 | Call Information | Call Start Time (date) | input | row 5, left segment | not observed; date placeholder DD.MM.YYYY | seen (m5h-call-schedule) | M5 | new |
| CF-13 | Call Information | Call Start Time (time) | input | row 5, right segment | not observed; 12-hour time with AM/PM | seen (m5h-call-schedule) | M5 | new |
| CF-14 | Call Information | Call Owner | select | row 6, value side | same | seen (m5h-call-schedule) | M5 | TF-05 moved |
| CF-15 | Call Information | User lookup icon | icon button | row 6, input right edge | same; not opened here | seen (m5h-call-schedule) | M5 | TF-06 moved |
| CF-16 | Call Information | Subject | input | row 7, value side | same; no required marker here | seen (m5h-call-schedule) | M5 | TF-07 moved |
| CF-17 | Call Information | Reminder | select | row 8, value side | opens picklist; None displayed | seen (m5h-call-schedule) | M5 | new |
| CF-18 | Purpose Of Outgoing Call | Call Purpose | select | first row, value side | opens picklist; -None- displayed | seen (m5h-call-schedule) | M5 | new |
| CF-19 | Lower continuation | Partially clipped input | input | below Call Purpose, upper edge above utility strip | not observed; DOM identifies Call Agenda, label unpainted | seen (m5h-call-schedule) | M5 | new |

Absent here: TF-03 (Save and New), TF-08 (Due Date), TF-12 (Account module
selector), TF-15–TF-16 (task Status/Priority), TF-17–TF-18 (Reminder/Repeat
toggles), TF-19–TF-20 (Description/resize grip). No Meeting equivalence is
established because its form is not observed. A calendar icon, duration,
Call Result and outcome section are not painted in this viewport.

### Call-specific field behaviour

Contact type is shown below Call From/To; its closed control differs in
position from TF-09. Lookup is present, but no Contact/Lead choice or lookup
window is observed here. Related To has a record input and lookup icon with
no separate Account/other-module type selector, unlike TF-12–TF-14. Its
lookup target and module-selection interior remain not observed.

Calls uses a Reminder **select**, unlike Tasks' TF-17 toggle and Meetings'
metadata multireminder. Schedule-state duration and Call Result controls are
not painted; Log duration minutes/seconds and result behaviour are documented
in activities-flows.md D3, not observed controls. Call Agenda is configured
as text, but only its input's upper edge is seen. No field value or choice
was changed. Outgoing status, type-dependent sections, editability and exact
schedule-versus-log requiredness cannot be inferred from the closed controls.

### Reconciliation — m5h-call-schedule

One-based source ordinals are evidence indexes, never selectors. Duplicate
wrappers and dropdown arrows map to their parent control. CF-19 accounts for
the clipped input edge; its unseen label is not claimed as image evidence.

| Destination / exclusion | Source item ordinals |
| --- | --- |
| Excluded: non-control wrapper / static text | 1, 37, 51, 59, 62, 82, 84, 87, 163 |
| SH-01 | 2, 3, 4 |
| Excluded: zero-area / invisible | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 91, 92, 94, 95, 97, 98, 101, 102, 108, 109, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 162 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29, 30, 31 |
| SH-10 | 33 |
| SH-11 | 34, 35 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 60, 61 |
| SH-25 | 63, 64 |
| Excluded: outside visible viewport | 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 107, 160, 161 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99, 100 |
| SH-34 | 103, 104, 105, 106 |
| CF-01 | 110 |
| CF-04 | 111 |
| CF-02 | 112 |
| CF-03 | 113 |
| CF-05 | 114, 115, 116 |
| CF-06 | 117 |
| CF-07 | 118 |
| CF-08 | 119 |
| CF-09 | 120 |
| CF-10 | 121, 122, 123, 124 |
| CF-11 | 125, 126, 127, 128 |
| CF-12 | 129 |
| CF-13 | 130 |
| CF-14 | 131, 132, 133 |
| CF-15 | 134 |
| CF-16 | 135 |
| CF-17 | 136, 137, 138, 139 |
| CF-18 | 140, 141, 142, 143 |
| CF-19 | 144 |
| SH-35 | 164 |
| SH-36 | 165 |
| SH-37 | 166 |
| SH-38 | 167 |
| SH-39 | 168 |
| SH-40 | 169 |
| SH-41 | 170 |
| SH-42 | 171 |
| SH-43 | 172 |
| SH-44 | 173 |
| SH-45 | 174 |

Source items 174; mapped source items 106; excluded 68; distinct inventory
numbers 65, including image-only SH-46. Form inventory numbers 19.


### Control inventory — m5h-call-schedule-purpose

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CF-18.1 | Call Purpose list | -None- | menu item | popup above field, first | not observed; currently highlighted | seen (m5h-call-schedule-purpose) | M5 | new |
| CF-18.2 | Call Purpose list | Prospecting | menu item | popup, second | not observed | seen (m5h-call-schedule-purpose) | M5 | new |
| CF-18.3 | Call Purpose list | Administrative | menu item | popup, third | not observed | seen (m5h-call-schedule-purpose) | M5 | new |
| CF-18.4 | Call Purpose list | Negotiation | menu item | popup, fourth | not observed | seen (m5h-call-schedule-purpose) | M5 | new |
| CF-18.5 | Call Purpose list | Demo | menu item | popup, fifth | not observed | seen (m5h-call-schedule-purpose) | M5 | new |
| CF-18.6 | Call Purpose list | Project | menu item | popup, sixth | not observed | seen (m5h-call-schedule-purpose) | M5 | new |
| CF-18.7 | Call Purpose list | Desk | menu item | popup, seventh | not observed | seen (m5h-call-schedule-purpose) | M5 | new |

Rest: as in m5h-call-schedule; covered by the overlay: CF-16–CF-17
(left input segment only). The popup opens upward; no search input is painted.
The seven displayed labels agree with activities.md; Desk maps to Support
in metadata, not an observed selected value. No option was selected.

### Reconciliation — m5h-call-schedule-purpose

Source ordinals 1–174 retain the destinations/exclusions of
m5h-call-schedule. The overlay partly covers CF-16–CF-17; their remaining
segments are still painted. Ordinal 175 is an unpainted search input,
excluded; 176 is a non-control list wrapper, excluded. Ordinals 177–183
map respectively to CF-18.1–CF-18.7. Source items 183; mapped source items
113; exclusions 70; distinct inventory numbers 72, including image-only
SH-46. The entire screenshot, shell, menu and utility strip were inspected.

### Call form fields by form

Schedule below means the observed Scheduled-state Create Call address.
The menu-specific route is not observed. Log and Edit are not observed;
documentation is kept in a separate column/narrative, never substituted for
image evidence. Metadata entries reuse activities.md, including shared fields.

| Field | Schedule form | Log form | Edit form | Metadata (activities.md) |
| --- | --- | --- | --- | --- |
| Contact Name / Call From/To | CF-05–CF-07; Contact type, person input, lookup; required edge | not observed | not observed | Who_Id lookup; not layout-required |
| Related To | CF-08–CF-09; input + lookup; no module type selector | not observed | not observed | What_Id lookup; not layout-required |
| Call Type | CF-10 select; Outbound; required edge | not observed | not observed | picklist; system/layout required |
| Outgoing Call Status | CF-11 select; Scheduled | not observed | not observed | picklist; optional |
| Call Start Time | CF-12–CF-13 date + time inputs; date required edge | not observed | not observed | datetime; system/layout required |
| Call Owner | CF-14–CF-15 select + user lookup | not observed | not observed | ownerlookup; field_read_only false |
| Subject | CF-16 input; no required edge | not observed | not observed | text; optional |
| Reminder | CF-17 select; None | not observed | not observed | picklist; optional; nine exported options |
| Call Purpose | CF-18 select; -None- | not observed | not observed | picklist; optional; seven exported options |
| Call Agenda | CF-19 upper edge only; full control/label not observed | not observed | not observed | text; optional |
| Call Duration | not painted in captured Scheduled state | not observed | not observed | text; system/layout required |
| Call Duration (in seconds) | not painted | not observed | not observed | integer; optional |
| Call Result | not painted in captured viewport | not observed | not observed | picklist; optional |
| Description | not painted in captured viewport | not observed | not observed | textarea; optional |
| Dialled Number / Caller ID | not painted | not observed | not observed | text; read-only |
| Voice Recording | not painted | not observed | not observed | website/string; optional |
| Scheduled in CRM | not painted | not observed | not observed | picklist/string; read-only |
| CTI Entry | not painted | not observed | not observed | boolean; absent from Standard layout |
| Repeat | not painted | not observed | not observed | no Calls RRULE field exported |
| Audit / identity / Tag / Last Activity Time | not painted | not observed | not observed | configuration only; no create control inferred |

### Call form fields vs metadata

The observed required edge on Call From/To differs from the optional exported
Who_Id layout field. Call Type and Call Start Time edges agree with required
metadata. Call Duration is exported as required but is not painted in the
captured Scheduled state; its conditional requiredness is not encoded by the
layout. Call Agenda's complete rendering, lower outcome section and
Description cannot be assessed outside this viewport. Metadata layout order
and sections remain configuration, not evidence of a painted lower form.

Call Type and Outgoing Call Status are rendered selects, not fixed plain
text. Selection effects and available options were not observed; the closed
values agree with the documented schedule defaults (activities-flows.md D3).
Call Result's metadata picklist conflicts with D3's older text-box wording;
no Log form was observed to resolve that conflict. Reminder and Call Purpose
opened catalogs are compared separately with activities.md. No metadata-only
field is assigned a fabricated CF number.

### Call capability table

| Capability | Owner | Reuse / addition | Evidence limit |
| --- | --- | --- | --- |
| Header / shell / owner | M5; shell registry | TF references; CF-02 follow-up task action | controls seen; save/cancel/follow-up result never invoked |
| Who / related record | M5; targets M1/M2/M3/M4/P2 | CF-05–CF-09; TF baseline with positions changed | closed Contact type and lookup only; related module selector absent |
| Schedule type / status / start | M5 | CF-10–CF-13; activities-flows.md D3/D4 | Closed selects and split date/time seen; conditional transitions unknown |
| Reminder | M5 | CF-17 and opened options; activities.md catalog | no option chosen, no reminder created |
| Purpose / agenda | M5 | CF-18; clipped CF-19 | purpose list seen; full agenda rendering unknown |
| Log / duration / result | M5 | activities-flows.md D3–D5 | documented only; Log route and form not observed |
| Edit | M5 | existing Calls detail; D3/D4 | CTO prohibits Edit opening; completed-edit documentation conflict unresolved |
| Telephony | external service; M5 activity state | activities-flows.md | no handset or real call action invoked |

### Call open questions

1. Create menu entries and the Log route/form remain not observed because the
   earlier permitted menu trigger was skipped. The observed /create page is
   Scheduled-state evidence only; no alternate trigger or route was attempted.
2. Exact Log-vs-Schedule controls, Call Type/status options and conditional
   fields, requiredness, duration minutes/seconds arrangement and Call Result
   popup remain not observed. Lower form content and full Call Agenda require
   a separately authorized passive viewport observation; no scroll was attempted.
3. Contact/Lead type list, Contact lookup and Related To lookup/module target
   remain not observed here. Calls has no painted TF-12-like module selector.
4. Edit is not observed under the CTO decision. Existing detail and D3/D4
   establish documented semantics only; modern completed-edit access and exact
   schedule/log/edit differences remain unresolved.
5. Required Call From/To edge versus optional Who_Id metadata, and required
   metadata duration versus unpainted Scheduled-state duration need assessment;
   no conditional requirement is invented. Follow-up Task creation result,
   validation/error/success states and hover-only controls remain not observed.

### Module 5 remaining not-observed topics

Across activities.md, activities-flows.md, activities-record-detail.md and
this file: persisted view alternatives and hover-only actions; activity
filter result/boundary rules and badge precedence; write-result validation,
completion/reopen/cancel/reschedule effects and Closed Time handling;
reminder/recurrence interiors and generated-series effects; notifications and
participant/invitation outcomes; Meetings create/picker/venue/provider form
presentation; Calls menu/Log/lower-form/duration/result and all Edit forms;
parent activity count discrepancies/hidden Calls categories; no-provider
handset outcome and unresolved legacy-documentation conflicts. These are
research gaps, not inferred behaviours or a direct board question.


### Control inventory — m5h-call-schedule-reminder

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CF-17.1 | Reminder list | None | menu item | popup above field, first | not observed; checked | seen (m5h-call-schedule-reminder) | M5 | new |
| CF-17.2 | Reminder list | 5 minutes before | menu item | popup, second | not observed | seen (m5h-call-schedule-reminder) | M5 | new |
| CF-17.3 | Reminder list | 10 minutes before | menu item | popup, third | not observed | seen (m5h-call-schedule-reminder) | M5 | new |
| CF-17.4 | Reminder list | 15 minutes before | menu item | popup, fourth | not observed | seen (m5h-call-schedule-reminder) | M5 | new |
| CF-17.5 | Reminder list | 30 minutes before | menu item | popup, fifth | not observed | seen (m5h-call-schedule-reminder) | M5 | new |
| CF-17.6 | Reminder list | 1 hours before | menu item | popup, sixth | not observed | seen (m5h-call-schedule-reminder) | M5 | new |
| CF-17.7 | Reminder list | 2 hours before | menu item | popup, seventh | not observed | seen (m5h-call-schedule-reminder) | M5 | new |
| CF-17.8 | Reminder list | Partially clipped option | menu item | popup, lower boundary after seventh | not observed; full label unpainted | seen (m5h-call-schedule-reminder) | M5 | new |

Rest: as in m5h-call-schedule; covered by the overlay: CF-11–CF-12,
CF-14, CF-16 (left segments only). CF-13's time segment and right-side lookup
icons remain visible. The popup opens upward. No search input is painted.
The partial row's DOM label is 1 day before; 2 days before is below the
popup clip and not observed as a visible option. No scrolling/selection was
attempted. Metadata has nine options; seven complete plus one partial row
are not a shorter configured catalog. The displayed **1 hours before**
differs from metadata's **1 hour before**; the underlying mapping is not
verified by a selection. None is visibly checked.

### Reconciliation — m5h-call-schedule-reminder

Source ordinals 1–174 retain m5h-call-schedule destinations/exclusions;
partly covered field controls retain their painted segments. Ordinal 175
is an unpainted search input (excluded); 176 is a non-control list wrapper
(excluded). Ordinals 177–184 map respectively to CF-17.1–CF-17.8.
Ordinal 185 is outside the popup's visible viewport (excluded).
Source items 185; mapped source items 114; exclusions 71; distinct inventory
numbers 73, including image-only SH-46. The complete image was inspected.

### Call Log and Edit observation limit

Log form, Log Call Result popup and duration controls are **not observed**;
there was no observed menu row granting their prescribed entry route.
Edit is **not observed** under the CTO no-Edit decision. No CF edit numbers,
actions, default values or field differences are invented. Existing Calls
detail is used as a field-readback reference only. activities-flows.md D3/D4
provides documented schedule/log semantics and reminder availability; it
does not settle modern form layout or its completed-edit restriction.

### Reconciliation — m5h-calls-list-base

Use the one-based mapping in activities.md › Calls source reconciliation —
m5l-calls-list-base: old ordinals 292–295 are absent; old 1–291 retain their
mapping, and old 296–655 map to current 292–651 (subtract four). This is the
same mapping as m5l-calls-create-menu; tag/selector order and visible regions
were compared. The Sort wrapper has different internal attributes but the
same visible label/type/position and remains CL-04. Source items 651;
mapped source items 181; exclusions 470; distinct inventory numbers 88,
including image-only SH-46. No highlighted-row controls are painted.


### Control inventory — m5h-calls-list-after

Shell: SH-01–SH-46 as in [contacts.md](contacts.md); Calls SH-22 active.
Rest: as in m5h-calls-list-base; covered by the overlay: none.
Absent here: CL-39–CL-41, as in the current base. Total Records remains 890,
range remains 1 to 30. Source record-link instances remain 23; multiset
comparison loses zero baseline links. No record value is copied here.

### Reconciliation — m5h-calls-list-after

Source ordinals 1–651 retain m5h-calls-list-base destinations/exclusions.
Only the Sort wrapper's internal attributes differ; its label, type and
position are unchanged. Source items 651; mapped source items 181;
exclusions 470; distinct inventory numbers 88, including image-only SH-46.
The full image, table boundaries, side rail and utility strip were inspected.

### Call capture refs

| Slug | Clicks | Skipped | Evidence / boundary |
| --- | --- | --- | --- |
| m5h-calls-list-base | 0 | 0 | Painted list; total 890; apiCalls 55, previous baseline 55; gate passed |
| m5h-call-schedule | 0 | 0 | Scheduled-state Create Call; 19 form inventory numbers; apiCalls 46 |
| m5h-call-schedule-purpose | 1 | 0 | Seven complete purpose options; no selection; apiCalls 46 |
| m5h-call-schedule-reminder | 1 | 0 | Seven complete options plus one partially clipped; no selection; apiCalls 46 |
| m5h-calls-list-after | 0 | 0 | Painted list; total 890; apiCalls 55; no baseline record link lost |

All five completed captures used the prescribed wait, with no retry needed.
Every screenshot was opened as an image. Expected non-GET request paths and
counts were checked before the next capture and recorded in issue comments;
blocked requests remain shared reminder/notification/telemetry calls. No
successful record-write response, unblocked telemetry or unexpected path was
observed. Forms share only the shell trigger as their non-GET read baseline.

Not captured: Log (earlier menu entries not observed); Log Result (no Log
form); detail-base (only an Edit-selector prerequisite); Edit (CTO decision).
No alternate selector, route, scrolling, toggle override or write was used.
Raw captures remain in the local research workspace and are not uploaded.
