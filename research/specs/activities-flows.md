# Activities — flows and activity controls on parent records

Status: MEP-423 research for Grok QA, then UI Lead approval. Module 5.

## Purpose

Specify activity-specific behaviour carried into Module 5, using Tasks as the baseline and Meetings/Calls only for their differences. Shared list, shell, detail and lookup controls retain their existing numbers. No reference record, preference or setting was changed; no capture command was run. Calendar and email delivery belong to M10, automation to M12; telephony and online meeting connections are external services.

## Sources and evidence levels

| Source | Meaning |
| --- | --- |
| seen (slug) | Existing saved screenshot opened as an image, with its aria and controls inspected; not a new observation of a write |
| metadata | Exported module fields, layouts, related lists and view criteria; cross-checked against [activities.md](activities.md) |
| documented (D key) | Public help capability; supporting original text in local docs-notes/m5-activities/keys.md and D-key text copies |
| not observed | Neither a usable image nor an explicit applicable statement; no inferred control or transition |

D1 Tasks; D2 Meetings; D3 logging/scheduling calls; D4 Calls FAQ; D5 calendar activity operations (only their activity-facing behaviour is used); D6 advanced filters; D7 Activities FAQ; D8 list views/badges; D9 related-card presentations; D10 Kanban views. Addresses and original source sentences remain only in the local documentation evidence. Public pages are not proof of organization settings. Documentation images were not copied or treated as saved screen evidence.

Existing screen inventories are incorporated by reference, rather than rewritten. All reused frames were inspected, including shell, rail, fixed header, utility strip and corners. Tables below contain activity controls and differences; complete existing full-frame inventories and their ordinal reconciliation tables remain the nearest authority. `same` refers to visible structure only, never to a verified write result. Repeated controls retain their original numbers. AX numbers identify previously unnumbered Leads controls or newly inventoried activity details.

## Carried over from earlier modules

The following exhausts every line containing `M5` in docs/parity-checklist.md at research time, including narrative lines (line numbers are discovery aids, not stable identifiers). The M5 module-key row is the registry definition, not a deferred control.

| Checklist row | Control numbers | Spec that describes it today | What Module 5 must add | Source |
| --- | --- | --- | --- | --- |
| 52: M5 registry key | SH-19–SH-22 | contacts.md › shell | Tasks/Meetings/Calls module navigation | metadata; existing shell inventory |
| 111: activity cards and Timeline › Interactions | D-15–D-17; D-30–D-31; D-57–D-68; AD-135–AD-145; DD-110–DD-120 | record-detail.md › Related-list structure and Timeline; contacts-record-detail.md | Activity data, closure grouping, counters and activity interaction content; Timeline write-generated contents remain not observed | seen (card inventories below); documented (D7, D9) |
| 120: system/related-module filters | L-17; AX-40–AX-45 | list-views.md › Filter operators by field type | Activity predicates and summaries; do not duplicate non-activity filters | seen (w2b-filter-system-activities); documented (D6) |
| 126: Lead delete cascade / owner carry | No numbered write control; A1, A5 are behaviour sections | leads-write-behaviour.md › A1, A5 | Preserve documented Lead deletion cascade; distinguish optional transfer from an unconditional transfer | existing documented A1/A5; documented (D7); no new cascade observation |
| 180: module selector | S-10.1–S-10.7; S-13 | global-search.md | Activate Tasks/Meetings selection and search using activity fields | existing inventory; behaviour not observed here |
| 183: search groups / handset | S-15–S-18 | global-search.md | Activity results/detail routing; handset behaviour without connection remains unknown | existing inventory; not observed |
| 211: list activity badge | L-41 | contacts.md | Open-activity summaries and badge interaction; no badge for a record without open activity is documented, but exact icon-selection precedence remains unknown | documented (D8); seen (w2b-filter-system-activities) |
| 213: later-module controls narrative | L-17; L-41 | contacts.md; list-views.md | Same activity work as rows 120/211; no extra control | existing inventory |
| 238: Contacts rail/card counts | D-30–D-31; D-61–D-62; D-67–D-68 | contacts-record-detail.md | Supply separate rail/card counts without treating the captured mismatch as a calculation rule | seen (m2d2-card-notes; m2d2-card-closed-activities) |
| 286: advanced-search module boxes | S-31.3 Tasks; S-31.6 Meetings; S-31.7 Calls | global-search.md | Enable matching activity module filters/results; shared apply/clear logic stays there | existing inventory; not observed here |
| 287: advanced-search handset | S-39 | global-search.md | Resolve handset action/connection boundary | existing inventory; not observed |
| 305: Accounts activity counts narrative | AD-30–AD-31; AD-139–AD-140; AD-144–AD-145 | accounts-record-detail.md | Same counter work as Contacts; Calls column is not painted | seen (m3c-card-deals; m3c-card-closed-activities) |
| 355: Accounts call icons | AD-37; AD-41 | accounts-record-detail.md | Handset action after phone values, including no-connection case | seen (m3c-detail-open) for AD-37; AD-41 referenced only, not observed here |
| 388: lookup handset | AF-11.16 | accounts-form.md | Same call capability inside lookup; no new lookup layout | existing inventory; not observed here |
| 419: Accounts list handset | AL-62 | accounts.md | Same call capability beside Phone | existing inventory; not observed here |
| 423: later-module narrative handset | AL-62 | accounts.md | Duplicate reference to row 419, no extra control | existing inventory |

S-31 numbers are retained from global-search.md; module checkboxes are not evidence that an activity result was returned. Task/meeting transfers are described both unconditionally and as an option in D7: its specific optional-transfer paragraph agrees with A5; selection defaults and whether Calls transfer are **not observed**. Documented (D7).

## Activity cards on parent records

| Parent | Open Activities | Closed Activities | Invited Meetings | Difference / nearest authority | Source |
| --- | --- | --- | --- | --- | --- |
| Leads | Single empty body; Add New with down arrow; no Column View or category counters painted | Single empty body; no action or counter painted | Empty, no action/counter | Earlier simpler layout; do not retrofit later captured presentation | seen (detail-attachments-card; detail-meetings-card); record-detail.md |
| Contacts | Add New, Column View, table-plus, expand; Tasks and Meetings category/count headers; both empty | Column View, table-plus, expand; Tasks/Meetings count headers; both empty | Empty, no action/counter | D-57–D-68; Calls outside horizontal viewport | seen (m2d2-card-notes; m2d2-card-closed-activities) |
| Accounts | Same visible controls/categories as Contacts, empty | Same visible controls/categories as Contacts, empty | Absent from captured rail and exported parent related-list inventory | AD-135–AD-145; Calls outside viewport | seen (m3c-card-deals; m3c-card-closed-activities); metadata |
| Deals | Same header positions; untranslated selector label; populated Tasks, empty Meetings | Same header positions; populated Tasks and Meetings | Absent from captured rail and exported parent related-list inventory | DD-110–DD-120; Calls outside viewport | seen (m4c-card-cadences); metadata |

Card titles and empty-state text are static headings/body text, not buttons. Open Tasks/Open Meetings and Closed Tasks/Closed Meetings are category headings with task/calendar glyphs and adjacent badges, not sortable table columns in these images. No record-table column headers, row-end menus, completion checkmarks or hover actions are painted. Populated Deals cards show subject links, due date and owner; the open task adds Status/Priority, the closed task adds Closed Time, the meeting shows a start/end time range. Values are excluded; subject links are inventoried below. Seen (m4c-card-cadences).

Rail badges are painted independently of category badges. Contacts/Accounts rail badges remain nonempty while their shown category counts are zero. This is a captured discrepancy, not evidence that counts include hidden Calls or a defined count policy. Calls are outside the horizontal viewport; no horizontal navigation was performed.

Open Activities supports creating/associating tasks, meetings and calls. Column, Chronological and Tab presentations separate categories, order activities by time, or tabulate each category respectively; closed cards also support these presentations. Invited Meetings is a read-only list of invitations awaiting response. Documented (D9). The visible Add New menus and Column View option menus were never opened in the selected saved frames; exact menu rows remain **not observed**.

### Control inventory — detail-attachments-card

Full Leads card baseline. Shell: SH-01–SH-46 as in contacts.md; Leads active; SH-36–SH-39 retain the older Chats/Channels/Threads/Contacts arrangement described in app-shell.md. Fixed header/rail/tab structure is record-detail.md › Layout. Leads' Convert is between Send Email and Edit. No count badge is painted in its activity rail.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AX-01 | Header | Back | icon button | leftmost | same | seen (detail-attachments-card) | M1 | D-01 |
| AX-02 | Header | Record portrait | icon button | after Back | not observed | seen (detail-attachments-card) | M6 | D-02 variant |
| AX-03 | Header | Add Tags | button | below identity | same | seen (detail-attachments-card) | M6 | D-04 |
| AX-04 | Header | Send Email | button | right group, first | same | seen (detail-attachments-card) | M10 | D-05 |
| AX-05 | Header | Convert | button | right group, second | Opens conversion flow per existing spec | seen (detail-attachments-card) | M1 | record-detail.md › Actions |
| AX-06 | Header | Edit | button | right group, third | same | seen (detail-attachments-card) | M1 | D-06 moved |
| AX-07 | Header | Three dots | icon button | right group, fourth | same | seen (detail-attachments-card) | M1 | D-07 moved |
| AX-08 | Header | Previous | icon button | after action group, first | same | seen (detail-attachments-card) | M1 | D-08 |
| AX-09 | Header | Next | icon button | after action group, second | same | seen (detail-attachments-card) | M1 | D-09 |
| AX-10 | Related-list rail | Related-list settings glyph | icon button | after heading | not observed | seen (detail-attachments-card) | M11 | new |
| AX-11 | Related-list rail | Notes | link | row 1 | same | seen (detail-attachments-card) | M6 | D-10 |
| AX-12 | Related-list rail | Connected Records | link | row 2 | same | seen (detail-attachments-card) | ? | D-11 |
| AX-13 | Related-list rail | Cadences | link | row 3 | same | seen (detail-attachments-card) | P3 | D-13 moved |
| AX-14 | Related-list rail | Attachments | link | row 4 | same | seen (detail-attachments-card) | M6 | D-12 moved |
| AX-15 | Related-list rail | Products | link | row 5 | same | seen (detail-attachments-card) | P2 | D-18 moved |
| AX-16 | Related-list rail | Open Activities | link | row 6 | same | seen (detail-attachments-card) | M5 | D-15 |
| AX-17 | Related-list rail | Closed Activities | link | row 7 | same | seen (detail-attachments-card) | M5 | D-16 |
| AX-18 | Related-list rail | Invited Meetings | link | row 8 | same | seen (detail-attachments-card) | M5 | D-17 |
| AX-19 | Related-list rail | Emails | link | row 9 | same | seen (detail-attachments-card) | M10 | D-23 moved |
| AX-20 | Related-list rail | Campaigns | link | row 10 | same | seen (detail-attachments-card) | M7 | D-25 moved |
| AX-21 | Related-list rail | Social | link | row 11 | same | seen (detail-attachments-card) | M15 | D-26 moved |
| AX-22 | Related-list rail | Voice of the Customer | link | row 12 | same | seen (detail-attachments-card) | M13 | D-28 moved |
| AX-23 | Related-list rail | Add Related List | link | below entries | same | seen (detail-attachments-card) | M11 | D-29 |
| AX-24 | Related-list rail | Add Link | link | Links section | not observed | seen (detail-attachments-card) | M11 | AD-98 |
| AX-25 | Related-list rail | Plus | icon button | selected Attachments row, right end | not observed | seen (detail-attachments-card) | M6 | new |
| AX-26 | Tab row | Rail visibility icon | icon button | before Overview | same | seen (detail-attachments-card) | M1 | D-32 |
| AX-27 | Tab row | Overview | tab | first, selected | same | seen (detail-attachments-card) | M1 | D-33 |
| AX-28 | Tab row | Timeline | tab | second | same | seen (detail-attachments-card) | M1 | D-34 |
| AX-29 | Tab row | Last Update | badge | far right | same | seen (detail-attachments-card) | M1 | D-35 |
| AX-30 | Attachments card | Attach / arrow | button | header, right | same | seen (detail-attachments-card) | M6 | D-54 |
| AX-31 | Products card | Add Products | button | header, right | same | seen (detail-attachments-card) | P2 | D-69 |
| AX-32 | Open Activities card | Add New / arrow | button | header, right, sole action | not observed | seen (detail-attachments-card) | M5 | D-57 moved |
| AX-33 | Emails card | Compose Email | button | header, right | same | seen (detail-attachments-card) | M10 | AD-131 |
| AX-34 | Page | Scroll To Top | icon button | lower right, above utility strip | same | seen (detail-attachments-card) | M1 | D-63 |

Absent here: D-30–D-31 activity rail counts; D-58–D-62 and D-64–D-68 category-view controls and counts; Contacts-only rail entries. No activity row-end action is visible. controls.json was not generated for this older capture; its absence is an evidence gap, not a zero count.

### Control inventory — detail-meetings-card

Difference from detail-attachments-card. Shell unchanged. Invited Meetings is selected; its empty card has no action or badge.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AX-35 | Emails card | Mails | tab | tab row, first, selected | same | seen (detail-meetings-card) | M10 | AD-132 |
| AX-36 | Emails card | Drafts | tab | tab row, second | same | seen (detail-meetings-card) | M10 | AD-133 |
| AX-37 | Emails card | Scheduled | tab | tab row, third | same | seen (detail-meetings-card) | M10 | AD-134 |
| AX-38 | Campaigns card | Add Campaigns | button | header, right | not observed | seen (detail-meetings-card) | M7 | record-detail.md › Related-list structure |
| AX-39.1 | Social card | Associate Twitter | link | body, left column, first | not observed | seen (detail-meetings-card) | M15 | record-detail.md › Related-list structure |
| AX-39.2 | Social card | Associate Facebook | link | body, left column, second | not observed | seen (detail-meetings-card) | M15 | record-detail.md › Related-list structure |

Rest: as in detail-attachments-card; covered by the overlay: none. Scrolled out: AX-30–AX-32; selected Attachments plus AX-25 absent. AX-33 and AX-34 move with the content. controls.json is also absent here.
### Control inventory — m2d2-card-notes

Full inherited baseline. Shell: SH-01–SH-46 as in contacts.md; parent module active. Full-frame coverage and every controls.json item: [contacts-record-detail.md](contacts-record-detail.md) › Reconciliation — m2d2-card-notes. Non-activity controls retain their existing numbers.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-01 | Header | Back | icon button | leftmost | same | seen (m2d2-card-notes) | M2 | D-01 (contacts-record-detail.md) |
| D-02 | Header | Portrait placeholder | icon button | after Back | same | seen (m2d2-card-notes) | M6 | D-02 (contacts-record-detail.md) |
| D-03 | Header | Account record link | link | identity line, after contact identity | same | seen (m2d2-card-notes) | M3 | D-03 (contacts-record-detail.md) |
| D-04 | Header | Add Tags | button | below identity | same | seen (m2d2-card-notes) | M6 | D-04 (contacts-record-detail.md) |
| D-05 | Header | Send Email | button | right actions, first | same | seen (m2d2-card-notes) | M10 | D-05 (contacts-record-detail.md) |
| D-06 | Header | Edit | button | right actions, second | same | seen (m2d2-card-notes) | M2 | D-06 (contacts-record-detail.md) |
| D-07 | Header | More Options / three dots | icon button | right actions, third | same | seen (m2d2-card-notes) | M2 | D-07 (contacts-record-detail.md) |
| D-08 | Header | Previous Record | icon button | after More Options | same | seen (m2d2-card-notes) | M2 | D-08 (contacts-record-detail.md) |
| D-09 | Header | Next Record | icon button | far right | same | seen (m2d2-card-notes) | M2 | D-09 (contacts-record-detail.md) |
| D-10 | Related-list rail | Notes | link | rail, row 1 | same | seen (m2d2-card-notes) | M6 | D-10 (contacts-record-detail.md) |
| D-11 | Related-list rail | Connected Records | link | rail, row 2 | same | seen (m2d2-card-notes) | ? | D-11 (contacts-record-detail.md) |
| D-12 | Related-list rail | Attachments | link | rail, row 3 | same | seen (m2d2-card-notes) | M6 | D-12 (contacts-record-detail.md) |
| D-13 | Related-list rail | Cadences | link | rail, row 4 | same | seen (m2d2-card-notes) | P3 | D-13 (contacts-record-detail.md) |
| D-14 | Related-list rail | Deals | link | rail, row 5 | same | seen (m2d2-card-notes) | M4 | D-14 (contacts-record-detail.md) |
| D-15 | Related-list rail | Open Activities | link | rail, row 6 | same | seen (m2d2-card-notes) | M5 | D-15 (contacts-record-detail.md) |
| D-16 | Related-list rail | Closed Activities | link | rail, row 7 | same | seen (m2d2-card-notes) | M5 | D-16 (contacts-record-detail.md) |
| D-17 | Related-list rail | Invited Meetings | link | rail, row 8 | same | seen (m2d2-card-notes) | M5 | D-17 (contacts-record-detail.md) |
| D-18 | Related-list rail | Products | link | rail, row 9 | same | seen (m2d2-card-notes) | P2 | D-18 (contacts-record-detail.md) |
| D-19 | Related-list rail | Cases | link | rail, row 10 | same | seen (m2d2-card-notes) | M8 | D-19 (contacts-record-detail.md) |
| D-20 | Related-list rail | Quotes | link | rail, row 11 | same | seen (m2d2-card-notes) | P2 | D-20 (contacts-record-detail.md) |
| D-21 | Related-list rail | Sales Orders | link | rail, row 12 | same | seen (m2d2-card-notes) | P2 | D-21 (contacts-record-detail.md) |
| D-22 | Related-list rail | Purchase Orders | link | rail, row 13 | same | seen (m2d2-card-notes) | P2 | D-22 (contacts-record-detail.md) |
| D-23 | Related-list rail | Emails | link | rail, row 14 | same | seen (m2d2-card-notes) | M10 | D-23 (contacts-record-detail.md) |
| D-24 | Related-list rail | Invoices | link | rail, row 15 | same | seen (m2d2-card-notes) | P2 | D-24 (contacts-record-detail.md) |
| D-25 | Related-list rail | Campaigns | link | rail, row 16 | same | seen (m2d2-card-notes) | M7 | D-25 (contacts-record-detail.md) |
| D-26 | Related-list rail | Social | link | rail, row 17 | same | seen (m2d2-card-notes) | M15 | D-26 (contacts-record-detail.md) |
| D-27 | Related-list rail | Reporting Contacts | link | rail, row 18 | same | seen (m2d2-card-notes) | M2 | D-27 (contacts-record-detail.md) |
| D-28 | Related-list rail | Voice of the Customer | link | rail, row 19 | same | seen (m2d2-card-notes) | P3 | D-28 (contacts-record-detail.md) |
| D-29 | Related-list rail | Add Related List | link | below last related-list link | same | seen (m2d2-card-notes) | M11 | D-29 (contacts-record-detail.md) |
| D-30 | Related-list rail | Open Activities count | badge | after Open Activities | same | seen (m2d2-card-notes) | M5 | D-30 (contacts-record-detail.md) |
| D-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | same | seen (m2d2-card-notes) | M5 | D-31 (contacts-record-detail.md) |
| D-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | same | seen (m2d2-card-notes) | M2 | D-32 (contacts-record-detail.md) |
| D-33 | Tab row | Overview | tab | first tab, selected | same | seen (m2d2-card-notes) | M2 | D-33 (contacts-record-detail.md) |
| D-34 | Tab row | Timeline | tab | second tab | same | seen (m2d2-card-notes) | M2 | D-34 (contacts-record-detail.md) |
| D-35 | Tab row | Last Update indicator | badge | far right | same | seen (m2d2-card-notes) | M2 | D-35 (contacts-record-detail.md) |
| D-52 | Related-list rail | List with lines icon | icon button | after Related List heading | same | seen (m2d2-card-notes) | M11 | D-52 (contacts-record-detail.md) |
| D-53 | Related-list rail | Plus icon | icon button | Notes row, right end | same | seen (m2d2-card-notes) | M6 | D-53 (contacts-record-detail.md) |
| D-54 | Attachments card | Attach / down arrow | button | header, right | same | seen (m2d2-card-notes) | M6 | D-54 (contacts-record-detail.md) |
| D-55 | Cadences card | Enroll | button | header, right | same | seen (m2d2-card-notes) | P3 | D-55 (contacts-record-detail.md) |
| D-56 | Deals card | New Deal | button | header, right | same | seen (m2d2-card-notes) | M4 | D-56 (contacts-record-detail.md) |
| D-57 | Open Activities card | Add New / down arrow | button | header, right group, first | same | seen (m2d2-card-notes) | M5 | D-57 (contacts-record-detail.md) |
| D-58 | Open Activities card | Column View | select | header, right group, second | same | seen (m2d2-card-notes) | M5 | D-58 (contacts-record-detail.md) |
| D-59 | Open Activities card | Table with plus icon | icon button | header, right group, third | same | seen (m2d2-card-notes) | M11 | D-59 (contacts-record-detail.md) |
| D-60 | Open Activities card | Diagonal expand arrows | icon button | header, right group, fourth | same | seen (m2d2-card-notes) | M5 | D-60 (contacts-record-detail.md) |
| D-61 | Open Activities card | Open Tasks count | badge | first visible activity column, after title | same | seen (m2d2-card-notes) | M5 | D-61 (contacts-record-detail.md) |
| D-62 | Open Activities card | Open Meetings count | badge | second visible activity column, after title | same | seen (m2d2-card-notes) | M5 | D-62 (contacts-record-detail.md) |
| D-63 | Record content | Scroll To Top | icon button | floating at lower right | same | seen (m2d2-card-notes) | M2 | D-63 (contacts-record-detail.md) |

Absent here: activity Calls categories outside the horizontal viewport; unopened action/view menus and hover-only row-end controls are not observed.

### Control inventory — m2d2-card-closed-activities

Activity-card difference table. Shell: SH-01–SH-46 as in contacts.md; parent module active. Full-frame coverage and every controls.json item: [contacts-record-detail.md](contacts-record-detail.md) › Reconciliation — m2d2-card-closed-activities. Non-activity controls retain their existing numbers.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D-64 | Closed Activities card | Column View | select | header, right group, first | same | seen (m2d2-card-closed-activities) | M5 | D-64 (contacts-record-detail.md) |
| D-65 | Closed Activities card | Table with plus icon | icon button | header, right group, second | same | seen (m2d2-card-closed-activities) | M11 | D-65 (contacts-record-detail.md) |
| D-66 | Closed Activities card | Diagonal expand arrows | icon button | header, right group, third | same | seen (m2d2-card-closed-activities) | M5 | D-66 (contacts-record-detail.md) |
| D-67 | Closed Activities card | Closed Tasks count | badge | first visible activity column, after title | same | seen (m2d2-card-closed-activities) | M5 | D-67 (contacts-record-detail.md) |
| D-68 | Closed Activities card | Closed Meetings count | badge | second visible activity column, after title | same | seen (m2d2-card-closed-activities) | M5 | D-68 (contacts-record-detail.md) |

Rest: as in m2d2-card-notes for the fixed header, rail, tabs and shell; covered by the overlay: none. Scrolling changes the body; **all** additional non-activity controls are incorporated from the same-slug inventory in contacts-record-detail.md. This is not a claim that scrolled card bodies equal the baseline.

Absent here: activity Calls categories outside the horizontal viewport; unopened action/view menus and hover-only row-end controls are not observed.

### Control inventory — m3c-detail-open

Full inherited baseline. Shell: SH-01–SH-46 as in contacts.md; parent module active. Full-frame coverage and every controls.json item: [accounts-record-detail.md](accounts-record-detail.md) › m3c-detail-open. Non-activity controls retain their existing numbers.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD-01 | Header | Back | icon button | leftmost | same | seen (m3c-detail-open) | M3 | AD-01 (accounts-record-detail.md) |
| AD-02 | Header | Portrait placeholder | icon button | after Back | same | seen (m3c-detail-open) | M6 | AD-02 (accounts-record-detail.md) |
| AD-04 | Header | Add Tags | button | below identity | same | seen (m3c-detail-open) | M6 | AD-04 (accounts-record-detail.md) |
| AD-05 | Header | Send Email | button | right actions, first | same | seen (m3c-detail-open) | M10 | AD-05 (accounts-record-detail.md) |
| AD-06 | Header | Edit | button | right actions, second | same | seen (m3c-detail-open) | M3 | AD-06 (accounts-record-detail.md) |
| AD-07 | Header | More Options / three dots | icon button | right actions, third | same | seen (m3c-detail-open) | M3 | AD-07 (accounts-record-detail.md) |
| AD-08 | Header | Previous Record | icon button | after More Options | same | seen (m3c-detail-open) | M3 | AD-08 (accounts-record-detail.md) |
| AD-09 | Header | Next Record | icon button | far right | same | seen (m3c-detail-open) | M3 | AD-09 (accounts-record-detail.md) |
| AD-10 | Related-list rail | Notes | link | rail, row 1 | same | seen (m3c-detail-open) | M6 | AD-10 (accounts-record-detail.md) |
| AD-11 | Related-list rail | Connected Records | link | rail, row 2 | same | seen (m3c-detail-open) | ? | AD-11 (accounts-record-detail.md) |
| AD-12 | Related-list rail | Attachments | link | rail, row 3 | same | seen (m3c-detail-open) | M6 | AD-12 (accounts-record-detail.md) |
| AD-14 | Related-list rail | Deals | link | rail, row 4 | same | seen (m3c-detail-open) | M4 | AD-14 (accounts-record-detail.md) |
| AD-15 | Related-list rail | Open Activities | link | rail, row 7 | same | seen (m3c-detail-open) | M5 | AD-15 (accounts-record-detail.md) |
| AD-16 | Related-list rail | Closed Activities | link | rail, row 8 | same | seen (m3c-detail-open) | M5 | AD-16 (accounts-record-detail.md) |
| AD-18 | Related-list rail | Products | link | rail, row 9 | same | seen (m3c-detail-open) | P2 | AD-18 (accounts-record-detail.md) |
| AD-19 | Related-list rail | Cases | link | rail, row 14 | same | seen (m3c-detail-open) | M8 | AD-19 (accounts-record-detail.md) |
| AD-20 | Related-list rail | Quotes | link | rail, row 10 | same | seen (m3c-detail-open) | P2 | AD-20 (accounts-record-detail.md) |
| AD-21 | Related-list rail | Sales Orders | link | rail, row 11 | same | seen (m3c-detail-open) | P2 | AD-21 (accounts-record-detail.md) |
| AD-23 | Related-list rail | Emails | link | rail, row 6 | same | seen (m3c-detail-open) | M10 | AD-23 (accounts-record-detail.md) |
| AD-24 | Related-list rail | Invoices | link | rail, row 12 | same | seen (m3c-detail-open) | P2 | AD-24 (accounts-record-detail.md) |
| AD-26 | Related-list rail | Social | link | rail, row 15 | same | seen (m3c-detail-open) | M15 | AD-26 (accounts-record-detail.md) |
| AD-29 | Related-list rail | Add Related List | link | below last related-list link | same | seen (m3c-detail-open) | M11 | AD-29 (accounts-record-detail.md) |
| AD-30 | Related-list rail | Open Activities count | badge | after Open Activities | same | seen (m3c-detail-open) | M5 | AD-30 (accounts-record-detail.md) |
| AD-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | same | seen (m3c-detail-open) | M5 | AD-31 (accounts-record-detail.md) |
| AD-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | same | seen (m3c-detail-open) | M3 | AD-32 (accounts-record-detail.md) |
| AD-33 | Tab row | Overview | tab | first tab, selected | same | seen (m3c-detail-open) | M3 | AD-33 (accounts-record-detail.md) |
| AD-34 | Tab row | Timeline | tab | second tab | same | seen (m3c-detail-open) | M3 | AD-34 (accounts-record-detail.md) |
| AD-35 | Tab row | Last Update indicator | badge | far right | same | seen (m3c-detail-open) | M3 | AD-35 (accounts-record-detail.md) |
| AD-37 | Business card | Phone call icon | icon button | after Phone value, fifth field | same | seen (m3c-detail-open) | M5 | AD-37 (accounts-record-detail.md) |
| AD-38 | Details card | Hide Details | button | card header, left | same | seen (m3c-detail-open) | M3 | AD-38 (accounts-record-detail.md) |
| AD-96 | Related-list rail | Contacts | link | rail, row 5 | same | seen (m3c-detail-open) | M2 | AD-96 (accounts-record-detail.md) |
| AD-97 | Related-list rail | Member Accounts | link | rail, row 13 | same | seen (m3c-detail-open) | M3 | AD-97 (accounts-record-detail.md) |
| AD-98 | Related-list rail | Add Link | link | Links group, below Add Related List | same | seen (m3c-detail-open) | M11 | AD-98 (accounts-record-detail.md) |
| AD-99 | Header | Website link | link | identity line, after account identity | same | seen (m3c-detail-open) | M3 | AD-99 (accounts-record-detail.md) |
| AD-101 | Related-list rail | Notes count | badge | after Notes | same | seen (m3c-detail-open) | M6 | AD-101 (accounts-record-detail.md) |
| AD-102 | Related-list rail | Contacts count | badge | after Contacts | same | seen (m3c-detail-open) | M2 | AD-102 (accounts-record-detail.md) |
| AD-103 | Contacts summary | Contact record link | link | body, after portrait | same | seen (m3c-detail-open) | M2 | AD-103 (accounts-record-detail.md) |
| AD-104 | Contacts summary | Email link | link | body, below record link | same | seen (m3c-detail-open) | M10 | AD-104 (accounts-record-detail.md) |

Activity card bodies are below this viewport. Only the rail counts (and Deals Next Action) provide activity evidence here.

### Control inventory — m3c-card-deals

Activity-card difference table. Shell: SH-01–SH-46 as in contacts.md; parent module active. Full-frame coverage and every controls.json item: [accounts-record-detail.md](accounts-record-detail.md) › m3c-card-deals. Non-activity controls retain their existing numbers.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD-135 | Open Activities card | Add New / down arrow | button | header, right group, first | same | seen (m3c-card-deals) | M5 | AD-135 (accounts-record-detail.md) |
| AD-136 | Open Activities card | Column View | select | header, right group, second | same | seen (m3c-card-deals) | M5 | AD-136 (accounts-record-detail.md) |
| AD-137 | Open Activities card | Table with plus icon | icon button | header, right group, third | same | seen (m3c-card-deals) | M11 | AD-137 (accounts-record-detail.md) |
| AD-138 | Open Activities card | Diagonal expand arrows | icon button | header, right group, fourth | same | seen (m3c-card-deals) | M5 | AD-138 (accounts-record-detail.md) |
| AD-139 | Open Activities card | Open Tasks count | badge | first visible activity column, after title | same | seen (m3c-card-deals) | M5 | AD-139 (accounts-record-detail.md) |
| AD-140 | Open Activities card | Open Meetings count | badge | second visible activity column, after title | same | seen (m3c-card-deals) | M5 | AD-140 (accounts-record-detail.md) |

Rest: as in m3c-detail-open for the fixed header, rail, tabs and shell; covered by the overlay: none. Scrolling changes the body; **all** additional non-activity controls are incorporated from the same-slug inventory in accounts-record-detail.md. This is not a claim that scrolled card bodies equal the baseline.

Absent here: activity Calls categories outside the horizontal viewport; unopened action/view menus and hover-only row-end controls are not observed.

### Control inventory — m3c-card-closed-activities

Activity-card difference table. Shell: SH-01–SH-46 as in contacts.md; parent module active. Full-frame coverage and every controls.json item: [accounts-record-detail.md](accounts-record-detail.md) › m3c-card-closed-activities. Non-activity controls retain their existing numbers.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD-141 | Closed Activities card | Column View | select | header, right group, first | same | seen (m3c-card-closed-activities) | M5 | AD-141 (accounts-record-detail.md) |
| AD-142 | Closed Activities card | Table with plus icon | icon button | header, right group, second | same | seen (m3c-card-closed-activities) | M11 | AD-142 (accounts-record-detail.md) |
| AD-143 | Closed Activities card | Diagonal expand arrows | icon button | header, right group, third | same | seen (m3c-card-closed-activities) | M5 | AD-143 (accounts-record-detail.md) |
| AD-144 | Closed Activities card | Closed Tasks count | badge | first visible activity column, after title | same | seen (m3c-card-closed-activities) | M5 | AD-144 (accounts-record-detail.md) |
| AD-145 | Closed Activities card | Closed Meetings count | badge | second visible activity column, after title | same | seen (m3c-card-closed-activities) | M5 | AD-145 (accounts-record-detail.md) |

Rest: as in m3c-detail-open for the fixed header, rail, tabs and shell; covered by the overlay: none. Scrolling changes the body; **all** additional non-activity controls are incorporated from the same-slug inventory in accounts-record-detail.md. This is not a claim that scrolled card bodies equal the baseline.

Absent here: activity Calls categories outside the horizontal viewport; unopened action/view menus and hover-only row-end controls are not observed.

### Control inventory — m4c-detail-base

Full inherited baseline. Shell: SH-01–SH-46 as in contacts.md; parent module active. Full-frame coverage and every controls.json item: [deals-record-detail.md](deals-record-detail.md) › m4c-detail-base. Non-activity controls retain their existing numbers.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DD-01 | Header | Back | icon button | leftmost | same | seen (m4c-detail-base) | M4 | DD-01 (deals-record-detail.md) |
| DD-04 | Header | Add Tags | button | below identity | same | seen (m4c-detail-base) | M6 | DD-04 (deals-record-detail.md) |
| DD-05 | Header | Send Email | button | right actions, first | same | seen (m4c-detail-base) | M10 | DD-05 (deals-record-detail.md) |
| DD-06 | Header | Edit | button | right actions, second | same | seen (m4c-detail-base) | M4 | DD-06 (deals-record-detail.md) |
| DD-07 | Header | More Options / three dots | icon button | right actions, third and far right | same | seen (m4c-detail-base) | M4 | DD-07 (deals-record-detail.md) |
| DD-10 | Related-list rail | Notes | link | rail, row 1 | same | seen (m4c-detail-base) | M6 | DD-10 (deals-record-detail.md) |
| DD-11 | Related-list rail | Connected Records | link | rail, row 2 | same | seen (m4c-detail-base) | ? | DD-11 (deals-record-detail.md) |
| DD-12 | Related-list rail | Attachments | link | rail, row 3 | same | seen (m4c-detail-base) | M6 | DD-12 (deals-record-detail.md) |
| DD-13 | Related-list rail | Cadences | link | rail, row 6 | same | seen (m4c-detail-base) | P3 | DD-13 (deals-record-detail.md) |
| DD-15 | Related-list rail | Open Activities | link | rail, row 7 | same | seen (m4c-detail-base) | M5 | DD-15 (deals-record-detail.md) |
| DD-16 | Related-list rail | Closed Activities | link | rail, row 8 | same | seen (m4c-detail-base) | M5 | DD-16 (deals-record-detail.md) |
| DD-18 | Related-list rail | Products | link | rail, row 9 | same | seen (m4c-detail-base) | P2 | DD-18 (deals-record-detail.md) |
| DD-19 | Related-list rail | Cases | link | rail, row 14 | same | seen (m4c-detail-base) | M8 | DD-19 (deals-record-detail.md) |
| DD-20 | Related-list rail | Quotes | link | rail, row 10 | same | seen (m4c-detail-base) | P2 | DD-20 (deals-record-detail.md) |
| DD-21 | Related-list rail | Sales Orders | link | rail, row 11 | same | seen (m4c-detail-base) | P2 | DD-21 (deals-record-detail.md) |
| DD-23 | Related-list rail | Emails | link | rail, row 13 | same | seen (m4c-detail-base) | M10 | DD-23 (deals-record-detail.md) |
| DD-24 | Related-list rail | Invoices | link | rail, row 15 | same | seen (m4c-detail-base) | P2 | DD-24 (deals-record-detail.md) |
| DD-29 | Related-list rail | Add Related List | link | below last related-list link | same | seen (m4c-detail-base) | M11 | DD-29 (deals-record-detail.md) |
| DD-30 | Related-list rail | Open Activities count | badge | after Open Activities | same | seen (m4c-detail-base) | M5 | DD-30 (deals-record-detail.md) |
| DD-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | same | seen (m4c-detail-base) | M5 | DD-31 (deals-record-detail.md) |
| DD-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | same | seen (m4c-detail-base) | M4 | DD-32 (deals-record-detail.md) |
| DD-33 | Tab row | Overview | tab | first tab, selected | same | seen (m4c-detail-base) | M4 | DD-33 (deals-record-detail.md) |
| DD-34 | Tab row | Timeline | tab | second tab | same | seen (m4c-detail-base) | M4 | DD-34 (deals-record-detail.md) |
| DD-35 | Tab row | Last Update indicator | badge | far right | same | seen (m4c-detail-base) | M4 | DD-35 (deals-record-detail.md) |
| DD-54 | Related-list rail | Stage History | link | rail, row 4 | same | seen (m4c-detail-base) | M4 | DD-54 (deals-record-detail.md) |
| DD-55 | Related-list rail | Competitors | link | rail, row 5 | same | seen (m4c-detail-base) | ? | DD-55 (deals-record-detail.md) |
| DD-56 | Related-list rail | Contact Roles | link | rail, row 12 | same | seen (m4c-detail-base) | M2 | DD-56 (deals-record-detail.md) |
| DD-57 | Related-list rail | Stage History count | badge | after Stage History | same | seen (m4c-detail-base) | M4 | DD-57 (deals-record-detail.md) |
| DD-58 | Related-list rail | Contact Roles count | badge | after Contact Roles | same | seen (m4c-detail-base) | M2 | DD-58 (deals-record-detail.md) |
| DD-60 | Stage bar | Left chevron | icon button | left edge of stage sequence | same | seen (m4c-detail-base) | M4 | DD-60 (deals-record-detail.md) |
| DD-61.1 | Stage bar | Qualification | button | stage sequence, visible item 1 | same | seen (m4c-detail-base) | M4 | DD-61.1 (deals-record-detail.md) |
| DD-61.2 | Stage bar | Needs Analysis | button | stage sequence, visible item 2 | same | seen (m4c-detail-base) | M4 | DD-61.2 (deals-record-detail.md) |
| DD-61.3 | Stage bar | Value Proposition | button | stage sequence, visible item 3 | same | seen (m4c-detail-base) | M4 | DD-61.3 (deals-record-detail.md) |
| DD-61.4 | Stage bar | Identify Decision Makers | button | stage sequence, visible item 4 | same | seen (m4c-detail-base) | M4 | DD-61.4 (deals-record-detail.md) |
| DD-61.5 | Stage bar | Proposal/Price Quote (clipped) | button | stage sequence, visible item 5 | same | seen (m4c-detail-base) | M4 | DD-61.5 (deals-record-detail.md) |
| DD-62 | Stage bar | Down chevron | icon button | inside current Qualification step, after label | same | seen (m4c-detail-base) | M4 | DD-62 (deals-record-detail.md) |
| DD-63 | Stage bar | Right chevron | icon button | right edge of stage sequence | same | seen (m4c-detail-base) | M4 | DD-63 (deals-record-detail.md) |
| DD-64 | Stage bar | Thumbs up with down chevron | icon button | after stage sequence, first terminal control | same | seen (m4c-detail-base) | M4 | DD-64 (deals-record-detail.md) |
| DD-65 | Stage bar | Thumbs down with down chevron | icon button | after stage sequence, second terminal control | same | seen (m4c-detail-base) | M4 | DD-65 (deals-record-detail.md) |
| DD-66 | Contact Person summary | Contact record link | link | body, after portrait | same | seen (m4c-detail-base) | M2 | DD-66 (deals-record-detail.md) |
| DD-67 | Contact Person summary | Account record link | link | below contact link, after static at | same | seen (m4c-detail-base) | M3 | DD-67 (deals-record-detail.md) |
| DD-68 | Contact Person summary | Email link | link | below account link | same | seen (m4c-detail-base) | M10 | DD-68 (deals-record-detail.md) |
| DD-69 | Next Action summary | Activity record link | link | after date ribbon | same | seen (m4c-detail-base) | M5 | DD-69 (deals-record-detail.md) |
| DD-90 | Header | Amount | badge | identity line, after deal name and dash | same | seen (m4c-detail-base) | M4 | DD-90 (deals-record-detail.md) |
| DD-91 | Stage bar | START date | badge | above sequence, left | same | seen (m4c-detail-base) | M4 | DD-91 (deals-record-detail.md) |
| DD-92 | Stage bar | CLOSING date with stopwatch glyph | badge | above sequence, right | same | seen (m4c-detail-base) | M4 | DD-92 (deals-record-detail.md) |

Activity card bodies are below this viewport. Only the rail counts (and Deals Next Action) provide activity evidence here.

### Control inventory — m4c-card-cadences

Activity-card difference table. Shell: SH-01–SH-46 as in contacts.md; parent module active. Full-frame coverage and every controls.json item: [deals-record-detail.md](deals-record-detail.md) › m4c-card-cadences. Non-activity controls retain their existing numbers.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DD-110 | Open Activities card | Add New / down arrow | button | header, right group, first | same | seen (m4c-card-cadences) | M5 | DD-110 (deals-record-detail.md) |
| DD-111 | Open Activities card | Untranslated column-view label | select | header, right group, second | same | seen (m4c-card-cadences) | M5 | DD-111 (deals-record-detail.md) |
| DD-112 | Open Activities card | Table with plus icon | icon button | header, right group, third | same | seen (m4c-card-cadences) | M11 | DD-112 (deals-record-detail.md) |
| DD-113 | Open Activities card | Diagonal expand arrows | icon button | header, right group, fourth | same | seen (m4c-card-cadences) | M5 | DD-113 (deals-record-detail.md) |
| DD-114 | Open Activities card | Open Tasks count | badge | first visible activity column, after title | same | seen (m4c-card-cadences) | M5 | DD-114 (deals-record-detail.md) |
| DD-115 | Open Activities card | Open Meetings count | badge | second visible activity column, after title | same | seen (m4c-card-cadences) | M5 | DD-115 (deals-record-detail.md) |
| DD-116 | Closed Activities card | Column View | select | header, right group, first | same | seen (m4c-card-cadences) | M5 | DD-116 (deals-record-detail.md) |
| DD-117 | Closed Activities card | Table with plus icon | icon button | header, right group, second | same | seen (m4c-card-cadences) | M11 | DD-117 (deals-record-detail.md) |
| DD-118 | Closed Activities card | Diagonal expand arrows | icon button | header, right group, third | same | seen (m4c-card-cadences) | M5 | DD-118 (deals-record-detail.md) |
| DD-119 | Closed Activities card | Closed Tasks count | badge | first visible activity column, after title | same | seen (m4c-card-cadences) | M5 | DD-119 (deals-record-detail.md) |
| DD-120 | Closed Activities card | Closed Meetings count | badge | second visible activity column, after title | same | seen (m4c-card-cadences) | M5 | DD-120 (deals-record-detail.md) |
| AX-47 | Open Tasks body | Task subject link | link | first category, first line of each task | not observed | seen (m4c-card-cadences) | M5 | pending |
| AX-48 | Closed Tasks body | Task subject link | link | first category, first line of each task | same structure as AX-47; closed task | seen (m4c-card-cadences) | M5 | AX-47 moved |
| AX-49 | Closed Meetings body | Meeting title link | link | second category, first line of each meeting | not observed | seen (m4c-card-cadences) | M5 | pending |

Rest: as in m4c-detail-base for the fixed header, rail, tabs and shell; covered by the overlay: none. Scrolling changes the body; **all** additional non-activity controls are incorporated from the same-slug inventory in deals-record-detail.md. This is not a claim that scrolled card bodies equal the baseline.

Absent here: activity Calls categories outside the horizontal viewport; unopened action/view menus and hover-only row-end controls are not observed.

## List activity badge and activity filters

L-41 in contacts.md covers the existing handset activity flag. The saved Leads filter frames also show a task-check glyph and handset glyph in date ribbons before the record-name column. A meeting-specific list glyph, badge click result, tooltip, ordering when several activities exist and date-selection rule are **not observed**. The badge represents open tasks/meetings/calls/appointments, when present; display can be disabled through column management. Documented (D8). Appointments are not thereby added to this module's Tasks/Meetings/Calls scope.

The activity filter's five choices and four Activity Due ranges are already described in list-views.md › Filter operators by field type, `system_filter` row. Applying a filter was not observed. D6 documents filtering related records by overdue Tasks and absence of activities, but does not define all five predicates or boundary/time-zone rules. Documented (D6).

### Control inventory — w2b-filter-system-activities

Full activity-filter baseline; shared list: L-01–L-51 as in contacts.md, with Lead Name replacing Contact Name and Leads replacing Contacts. Exact Leads toolbar/column/filter structure: list-views.md. Shell: SH-01–SH-46 as in contacts.md, older utility strip as in app-shell.md. L-41 includes the activity ribbons; task glyph is an additional observed variant. L-17 is checked. No result filtering is inferred.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AX-40.1 | Activity filter | Without Open Activity | select | inline group, first radio choice | not observed | seen (w2b-filter-system-activities) | M5 | new |
| AX-40.2 | Activity filter | Overdue | select | inline group, second radio choice | not observed | seen (w2b-filter-system-activities) | M5 | new |
| AX-40.3 | Activity filter | Activity Due | select | inline group, third radio choice, selected | Reveals its range selector | seen (w2b-filter-system-activities) | M5 | new |
| AX-41 | Activity filter | Today + Overdue / arrow | select | below Activity Due | Opens four-item range menu in next frame | seen (w2b-filter-system-activities) | M5 | new |
| AX-40.4 | Activity filter | Without Any Activity | select | inline group, fourth radio choice | not observed | seen (w2b-filter-system-activities) | M5 | new |
| AX-40.5 | Activity filter | Activity Done | select | inline group, fifth radio choice | not observed | seen (w2b-filter-system-activities) | M5 | new |
| AX-42 | Filter footer | Apply Filter | button | panel bottom, first | same | seen (w2b-filter-system-activities) | M1 | list-views.md › Actions |
| AX-43 | Filter footer | Clear | button | panel bottom, second | same | seen (w2b-filter-system-activities) | M1 | list-views.md › Actions |
| AX-45 | Table | Company | column header | second text column | same | seen (w2b-filter-system-activities) | M1 | list-views.md › Layout |
| AX-44 | Record rows | Task activity date ribbon | badge | between row checkbox and Lead Name | Open activity indication; exact date-selection rule not observed | seen (w2b-filter-system-activities) | M5 | L-41 variant |

Radio controls use `select` as the permitted inventory vocabulary; they are mutually exclusive radio choices, not dropdowns. Absent here: lower field-filter rows scrolled out; no saved-filter action painted; hovered row menu not observed.

### Control inventory — w2b-filter-system-activities-ops

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AX-41.1 | Range menu | Today | menu item | row 1 | not observed | seen (w2b-filter-system-activities-ops) | M5 | new |
| AX-41.2 | Range menu | Tomorrow | menu item | row 2 | not observed | seen (w2b-filter-system-activities-ops) | M5 | new |
| AX-41.3 | Range menu | Next 7 days | menu item | row 3 | not observed | seen (w2b-filter-system-activities-ops) | M5 | new |
| AX-41.4 | Range menu | Today + Overdue | menu item | row 4, checked | not observed | seen (w2b-filter-system-activities-ops) | M5 | new |

Rest: as in w2b-filter-system-activities; covered by the overlay: AX-40.4, AX-40.5, upper Campaigns/Latest Email Status rows. No menu choice was selected.

## Task flows

Metadata baseline: activities.md › Tasks layout/fields, Picklists and Custom views. Reminder is an ALARM object, Repeat an RRULE object, Send Notification Email boolean, Closed Time a read-only datetime. Status options and actual values are not repeated here. Exported Closed Tasks criteria use `Status = Completed`; overdue view criteria combine due date and non-completed status. Metadata does not define reminder/RRULE payload keys or when instances are materialized.

| Flow | Task-specific rule | Source |
| --- | --- | --- |
| Complete | Only system Status Completed closes a task; a custom field with that label does not | documented (D1) |
| Completion control | Calendar preview has Mark as Completed; Tasks list completion affordance is not observed (activities.md › TL-63) | documented (D5); existing image inventory |
| Closed Time | Field exists/read-only; closed Deals task displays it; timestamp assignment, time zone and clearing on reopen are not observed | metadata; seen (m4c-card-cadences) |
| Reopen | Exact action, next status and Closed Time handling not observed; do not assume a Reopen button or Not Started reset | not observed |
| Reminder | Date/time or days/weeks/months before due date; repeatable; delivery Email, Pop Up or Both | documented (D1) |
| Reminder control | Reminder switch opens configuration; choose timing, repeat and delivery | documented (D1) |
| Repeat | Daily/weekly/monthly/yearly/custom; custom interval and day/date choices; due date required | documented (D1) |
| End recurrence | Never, number of occurrences, or date; daily can exclude weekends/holidays; monthly can move to next business day | documented (D1) |
| Instance lifecycle | Disabling recurrence can remove current/upcoming tasks; disabling first occurrence makes it single; exact generation timing not observed | documented (D1) |
| Recurring reminder edit | Apply change to current task or upcoming tasks | documented (D1) |
| Notification | Send Notification Email targets owner; Notify Owner covers new assignment, owner change and completion | documented (D1) |
| Overdue display | Date/non-completed criteria exist; exact Tasks-row overdue decoration not observed | metadata; activities.md › Custom views |

Notify Owner and Send Notification Email wording differs within D1; whether they are one control in this organization is not observed. Post-save messages, failed writes, reminder preview, repeat-dialog arrangement and recurrence deletion confirmation are not observed. No inferred form inventory is created; Ref for future Task form/detail controls is `pending`.

## Meeting flows

Shared relation/owner/description controls: activities.md › Lookups and relations and Tasks baseline above. Differences: From/To required datetimes, All day boolean, Participants array, Reminder/Participants Reminder arrays, RRULE Repeat. There is no exported Meeting Status picklist. Venue options are In-office, Client location and Online; Provider has no exported option catalog. Metadata.

| Difference from Tasks | Meeting rule | Source |
| --- | --- | --- |
| Time / All day | From/To set start/end; All day checkbox | documented (D2) |
| Completion | Closes automatically at end date/time; no status update | documented (D2) |
| Participants | Add selects users/leads/contacts or invites by email; maximum 50 | documented (D2) |
| Invitation | Invitations include participants; RSVP notifications and individual Re-invite supported | documented (D2) |
| Sending choice | Calendar save with participants offers Send / Do not Send; latter schedules without invitation email; module-form equivalence unknown | documented (D5) |
| Reminder | Email/pop-up; D2 says both selected from Activities and email can be disabled in calendar preferences | documented (D2) |
| Participants Reminder | At start; 5/10/15/30 minutes; 1/2 hours; 1/2 days before; multiple reminders | documented (D5) |
| Repeat | Daily intervals; weekly intervals/weekdays; monthly date/day; yearly date/day; From/To recurrence dates; exact modern termination menu unknown | documented (D2) |
| Reschedule | Calendar action edits meeting timing then saves; module detail control placement not observed | documented (D5) |
| Cancel | Web module cancellation action, dialog, invitation consequences and status handling not observed | not observed |
| Check-In | Mobile-only creation; details visible on meeting and parent; no web Check-In write inferred | documented (D2) |
| Venue / Provider | Online chooses enabled provider; physical venues use Location | documented (D2) |

Provider names mentioned by D2 include Zoom, Microsoft Teams and Google Meet; the reference CRM's own provider is described neutrally as native provider. These are documentation examples, not organization-enabled choices. Documented (D2). Connection setup and service actions are outside scope. All-day time normalization and end-before-start errors are not observed. Form/detail Ref: `pending`.

## Call flows

Reuse Tasks relations and owner concepts only; Calls does not reuse task recurrence or status rules. Metadata: Call Type Outbound/Inbound/Missed; Outgoing Call Status includes Scheduled/Completed/Overdue/Cancelled; Call Result is a picklist, duration text with a separate integer seconds field. Calls Reminder catalog is in activities.md › Picklists; it contains None and longer intervals beyond D4's shorter list. There is no exported RRULE field for Calls. Conditional requiredness/visibility is not encoded by the Standard layout.

| Flow | Call-specific rule | Source |
| --- | --- | --- |
| Schedule | Create Call → Schedule a call → details → Schedule | documented (D4) |
| Schedule fields | Lead/contact, related record, Subject, owner, purpose, Reminder; Outbound/Scheduled defaults; number fields documented but organization visibility unknown | documented (D3) |
| Log completed | Inbound/Outbound, subject, related person, purpose, duration minutes/seconds, description/result; save into Closed Activities | documented (D3) |
| Missed / incoming | Calendar logging distinguishes missed start time from incoming start time plus duration; outgoing logging marks completed | documented (D5) |
| Mark as Completed | Moves scheduled call to parent's Closed Activities; action offered on detail, lists, related lists, reminders and calendar | documented (D3) |
| Completion details | Calendar action verifies status/start/duration before Save | documented (D5) |
| Reschedule / cancel | Scheduled calls expose Reschedule Call / Cancel Call; calendar cancellation accepts a reason before Save | documented (D3, D5) |
| Call Result | Exported picklist, not D3's legacy text-box description; retain organization metadata type | metadata; documented (D3) conflict |
| Duration | Completed call takes minutes/seconds; start and duration cannot be made non-mandatory in documented log form | documented (D3) |
| Reminder | Schedule/edit scheduled call has reminder selector; D4 lists 5/10/15/30 minutes and 1 hour | documented (D4) |
| Completed edit | D3 says completed records cannot be edited; organization behaviour not observed | documented (D3) |
| Handset without integration | Neither handset destination nor no-provider message verified; do not infer dialler, tel link or a silently successful call | not observed |

D3 mixes older Current/Completed Call terminology with newer Schedule/Log forms. D4 calls Cancel Call a deletion operation, while exported Cancelled Calls is a status view. The exact cancel persistence and completed-edit rule need reconciliation; do not equate cancel with delete. No success/error text, validation copy, zero-duration policy or phone-provider action is observed. Call form/detail Ref: `pending`.

## Presentations

| Presentation | What is established | Source |
| --- | --- | --- |
| Tasks List | Table of task subject/due date/status/priority, toolbar List active; inventory reused from activities.md › TL-01–TL-66 | existing image inventory |
| Tasks Kanban | TL-06 icon present; opened board, grouping field and drag behaviour not observed | existing image inventory; not observed |
| Meetings / Calls list/board | Specific organization presentation controls remain pending their list spec | not observed |
| Generic Kanban | Card grouping by category; D10 also excludes activities in its create-view paragraph, conflicting with its broad availability statement | documented (D10) |
| Related-card Column / Chronological / Tab | Categorized activities / time order / separate tabular categories; these are card views, not module Kanban | documented (D9) |
| Calendar | Day/week/month schedules and activity tiles; activity entry point only here, implementation M10 | documented (D5) |

Chart/Timeline/split-style Tasks toolbar icons already belong to activities.md (TL-08–TL-11); opening them was not observed. No saved preference was changed.

## Evidence gaps

| Topic | Documented (D key) | Not verified by image | Evidence would require | Affects implementation? |
| --- | --- | --- | --- | --- |
| Task completion / reopen / Closed Time | D1, D5 partly; reopen/reset unknown | Write result, control on Tasks detail and reopen semantics | Completing/reopening a task (forbidden) or additional explicit public documentation | Yes: lifecycle and timestamp rules |
| Reminder / repeat controls | D1 | Configuration arrangement, errors, defaults | Changing switches/preferences or saving recurrence (forbidden) | Yes: form/recurrence scheduling; unknown generation timing |
| Notifications | D1, D2, D5 | Actual email delivery / Notify Owner equivalence | Sending notification/invitation (forbidden) | Yes: distinguish state from M10 delivery |
| Participant / recurrence changes | D2, D5 | Picker layout, saved invitee state, termination UI | Adding invitees or saving a repeat rule (forbidden) | Yes: form/array/series semantics |
| Meeting completion / all day | D2 | Closure boundary/time zone, all-day normalization | Waiting past end or writing all-day record (no write permitted) | Yes: time-based grouping |
| Meeting cancel / reschedule | D5 only reschedule in calendar | Web module cancel and attendee effects | Reschedule/cancel write (forbidden); applicable public documentation | Yes: unknown cancellation persistence |
| Check-In | D2 mobile-only | Web readback layout, mobile write | Mobile check-in (forbidden); future read-only detail research | Yes for readback; no web write assumed |
| Calls schedule/log/complete | D3–D5 | Conditional fields, success/errors, cancellation data, completed-edit behaviour | Saving or changing call (forbidden) | Yes: D3 legacy wording versus metadata |
| Parent counts / Calls category | D7, D9 | Rail/category calculation, Calls layout | Additional read-only image in a future authorized task; preference change forbidden | Yes: counts cannot be inferred from mismatch |
| Add New / Column View menus | D9 only presentations | Exact action/view option rows | Existing menu evidence or future authorized passive opening; no saving | Yes: missing menu inventory |
| Badge precedence / click | D8 | Multi-activity choice, date selection, hover/click content | Passive opening in future authorized task; no writes | Yes: L-41 behaviour incomplete |
| Activity filter predicates / boundaries | D6 partly | Applied results and all predicate definitions | Apply/write forbidden here; more explicit public documentation | Yes: server filtering contract |
| Parent deletion / owner transfer | Existing A1/A5; D7 | Selected transfers/defaults/Calls involvement | Deletion/owner write (forbidden) | Yes: preserve prior cascade; do not expand unspecified transfer |
| Handset without connection | None | No-provider outcome across AD/AL/AF/S controls | Public documentation or CTO decision; actual call initiation forbidden | Yes: no simulated connection result |
| List/board/Calendar support | D5, D10 conflict | Tasks board and Meetings/Calls presentations | Changing persisted view preference (forbidden) | Yes: grouping/action scope; Calendar remains M10 |
| Older Leads controls files | None | Per-item controls reconciliation absent | controls.json did not exist; no recapture in this task | No inferred counts; image inventory still usable |

D9's broad deadline-based closure sentence conflicts with D1's explicit Completed-only task rule and exported overdue-task criteria. The conflict is recorded rather than used to close overdue Tasks. Documented (D9, D1); metadata. D7's owner-transfer wording conflict and D10's availability conflict likewise remain explicit; CTO opens any board decision, this spec requests none directly.

## Capability table

| Capability | Owner | Reuse / addition | Evidence limit |
| --- | --- | --- | --- |
| Parent activity cards / counts / list badges | M5 | Existing D/AD/DD/L-41 controls plus activity links AX-47–AX-49 | Captured parent differences; counter and badge selection rules unknown |
| Task closure / reminders / recurrence | M5 | Tasks baseline; future form/detail refs pending | Documented; reopen and generation timing unknown |
| Meeting time closure / participants / reminders / repeat | M5 | Tasks differences above | Documented; writes and cancel unknown |
| Call schedule / log / completion / cancel / reminders | M5 | Separate call type/status model | Metadata plus documentation conflicts |
| Activity system filters / search registry | M5 | L-17, S-10/S-31; AX-40–AX-45 | Applied-result predicate boundary unobserved |
| Phone / online meeting provider | External service, UI trace M5 | Existing handsets and Provider | Connection effects not implemented from inference |
| Check-In readback | M5; visits M15 | Meeting fields in activities.md | Mobile write documented; web layout pending |
| Email/calendar delivery and UI | M10 | Activity-facing entry names only | No delivery/calendar implementation prescribed |
| View/column customization | M11 | Existing table-plus controls | Persisted preferences never changed |
| Automated interaction content | M12; activity content M5 | record-detail.md › Timeline | Concrete write-generated logs not observed |

## Capture refs

Only existing local captures were read. Capture history values below are original commands, not commands from this task. No new network safety comparison or after-capture equality is claimed. Earlier captures predate current activity capture rules; their original safety reports stay authoritative.

| Slug | Historical clicks | Skipped | Image evidence |
| --- | --- | --- | --- |
| detail-attachments-card | 2 | 0 | Leads open/closed/invited empty cards |
| detail-meetings-card | 2 | 0 | Leads Invited Meetings and adjacent cards |
| m2d2-card-notes | 2 | 0 | Contacts Open Activities header/empty categories |
| m2d2-card-closed-activities | 2 | 0 | Contacts Closed Activities and Invited Meetings |
| m3c-detail-open | 1 | 0 | Accounts rail activity counters/Phone handset |
| m3c-card-deals | 2 | 0 | Accounts Open Activities and related cards |
| m3c-card-closed-activities | 2 | 0 | Accounts Closed Activities |
| m4c-detail-base | 1 | 0 | Deals rail counts and Next Action |
| m4c-card-cadences | 2 | 0 | Deals populated activity categories |
| w2b-filter-system-activities | 1 | 0 | Activity radio filter and task/call ribbons |
| w2b-filter-system-activities-ops | 2 | 0 | Four-item Activity Due range menu |

Discovery scanned existing captures/*/aria.yml for Open Activities, Closed Activities and Invited Meetings. Most matches were rail text or offscreen DOM, not painted cards; they were not promoted to evidence. The selected images cover the four parents without revisiting identical states. Hover-only actions remain not observed.

## Open questions

1. Task reopen action/target status and Closed Time assignment/reset; RRULE instance-generation timing and series-edit boundaries.
2. Meeting all-day normalization, end-before-start validation, time-zone closure boundary, web cancel semantics and invite-send parity between module form and calendar.
3. Calls cancellation versus deletion, completed-record edit restriction, conditional fields and zero-duration rules; no-connection handset outcome.
4. Parent rail/category count discrepancy; visible Calls category/row controls; Add New and presentation-menu rows; populated Invited Meetings structure.
5. Badge precedence/date/tooltip/navigation and complete filter predicates/time-zone boundaries; optional owner transfer defaults and inclusion of Calls.
6. Kanban availability conflict; enabled Provider options absent in metadata; future list/detail/form refs remain pending.
7. Connected Records ownership is `?`, inherited from the existing specs. No new module assignment is made here.

### Shell controls missing from app-shell.md

None newly observed. Existing shell inventory is SH-01–SH-46 in contacts.md; old utility-strip differences are documented in app-shell.md. The related-list settings glyph AX-10 belongs to the record rail, not the app shell.

## Controls reconciliation

Item ordinals refer only to existing controls.json entries, not selectors. Inherited reconciliation is used without copying source attributes. Counts below count distinct source-backed inventory numbers (shell included); image-only controls supplement them.

| Slug | Source items | Source-backed inventory IDs | Excluded items | Reconciliation reference |
| --- | --- | --- | --- | --- |
| m2d2-card-notes | 554 | 90 | 406 | contacts-record-detail.md › same-slug reconciliation |
| m2d2-card-closed-activities | 549 | 88 | 405 | contacts-record-detail.md › same-slug reconciliation |
| m3c-detail-open | 508 | 82 | 377 | accounts-record-detail.md › same-slug reconciliation |
| m3c-card-deals | 553 | 107 | 386 | accounts-record-detail.md › same-slug reconciliation |
| m3c-card-closed-activities | 544 | 89 | 401 | accounts-record-detail.md › same-slug reconciliation |
| m4c-detail-base | 506 | 88 | 372 | deals-record-detail.md › same-slug reconciliation |
| m4c-card-cadences | 552 | 90 | 410 | deals-record-detail.md › same-slug reconciliation |
| w2b-filter-system-activities | 522 | 76 | 360 | Per-item table below |
| w2b-filter-system-activities-ops | 527 | 75 | 371 | Per-item table below |
| detail-attachments-card | missing | not countable | not countable | Image inventory AX-01–AX-34 |
| detail-meetings-card | missing | not countable | not countable | Image difference inventory AX-35–AX-39.2 |

Exclusions in inherited tables cover invisible/outside/covered content, duplicate wrappers, static text and record values. m4c-card-cadences overrides three prior record-data exclusions: item 390 → AX-47; 418 → AX-48; 428 → AX-49. These are actual activity subject links. Its source-backed ID count becomes 90 and excluded-item count 410. Image-only activity category badges remain DD-114–DD-115 and DD-119–DD-120.

### Reconciliation — w2b-filter-system-activities

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: static data or structural wrapper | 1, 4, 37, 51, 82, 111, 119, 128, 135, 138, 141, 303–304, 308–309, 489, 514 |
| SH-01 | 2–3 |
| excluded: invisible zero-area | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 134, 139, 301–302, 306–307, 479–487, 492–506, 522 |
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
| SH-13 | 38–39, 83 |
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
| SH-24 | 59–61 |
| SH-25 | 62–64 |
| excluded: outside image | 65–80, 323–325, 339–341, 354–356, 369–371, 384–386, 399–401, 414–416, 429–431, 445–447, 460–462, 476–478, 507–513, 515–521 |
| SH-26 | 85 |
| SH-27 | 86 |
| excluded: duplicate structural wrapper | 87, 105–106, 114 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–104 |
| L-01 | 112 |
| L-02 | 113, 115–116 |
| L-03 | 117 |
| L-04 | 118 |
| L-05 | 120 |
| L-06 | 121 |
| L-07 | 122 |
| L-08 | 123 |
| L-09 | 124 |
| L-10 | 125 |
| L-11 | 126–127 |
| excluded: static row data | 129 |
| L-12 | 130 |
| L-13 | 131–132 |
| L-14 | 133 |
| L-15 | 136–137 |
| L-16 | 140 |
| L-17 | 142–143 |
| AX-40.1 | 144–145 |
| AX-40.2 | 146–147 |
| AX-40.3 | 148–149 |
| AX-41 | 150–151 |
| AX-40.4 | 152–153 |
| AX-40.5 | 154–155 |
| L-18 | 156–157 |
| L-19 | 158–159 |
| L-20 | 160–161 |
| L-21 | 162–163 |
| L-22 | 164–165 |
| L-23 | 166–167 |
| L-24 | 168–169 |
| excluded: behind filter footer | 170–173 |
| excluded: clipped filter content | 174–297 |
| AX-42 | 298–299 |
| AX-43 | 300 |
| L-33 | 305 |
| excluded: static row data or structural wrapper | 310–313, 316–317, 320–322, 326–329, 332–333, 335–336, 338, 342–344, 347–348, 350–351, 353, 357–359, 362–363, 365–366, 368, 372–374, 377–378, 380–381, 383, 387–389, 392–393, 395–396, 398, 402–404, 407–408, 410–411, 413, 417–419, 422–423, 425–426, 428, 432–434, 437, 439, 441–442, 444, 448–450, 453–454, 456–457, 459, 463–465, 468, 470, 472–473, 475 |
| L-40 | 314, 330–331, 345–346, 360–361, 375–376, 390–391, 405–406, 420–421, 435–436, 451–452, 466–467 |
| L-34 | 315 |
| L-36 | 318–319 |
| L-42 | 334, 337, 349, 352, 364, 367, 379, 382, 394, 397, 409, 412, 424, 427, 440, 443, 455, 458, 471, 474 |
| AX-44 | 438 |
| L-41 | 469 |
| L-48 | 488 |
| L-50 | 490 |
| L-51 | 491 |

SH references use contacts.md; L references use contacts.md list inventory. AX references use the filter inventory here. Structural table cells and headings without separate controls are excluded; their checkboxes/links/badges are separately mapped. The screenshot, rather than DOM presence alone, determines visibility.

### Reconciliation — w2b-filter-system-activities-ops

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: static data or structural wrapper | 1, 4, 37, 51, 82, 111, 119, 128, 135, 138, 141, 303–304, 308–309, 489, 514 |
| SH-01 | 2–3 |
| excluded: invisible zero-area | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 134, 139, 301–302, 306–307, 479–487, 492–506, 522 |
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
| SH-13 | 38–39, 83 |
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
| SH-24 | 59–61 |
| SH-25 | 62–64 |
| excluded: outside image | 65–80, 323–325, 339–341, 354–356, 369–371, 384–386, 399–401, 414–416, 429–431, 445–447, 460–462, 476–478, 507–513, 515–521 |
| SH-26 | 85 |
| SH-27 | 86 |
| excluded: duplicate structural wrapper | 87, 105–106, 114 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–104 |
| L-01 | 112 |
| L-02 | 113, 115–116 |
| L-03 | 117 |
| L-04 | 118 |
| L-05 | 120 |
| L-06 | 121 |
| L-07 | 122 |
| L-08 | 123 |
| L-09 | 124 |
| L-10 | 125 |
| L-11 | 126–127 |
| excluded: static row data | 129 |
| L-12 | 130 |
| L-13 | 131–132 |
| L-14 | 133 |
| L-15 | 136–137 |
| L-16 | 140 |
| L-17 | 142–143 |
| AX-40.1 | 144–145 |
| AX-40.2 | 146–147 |
| AX-40.3 | 148–149 |
| AX-41 | 150–151 |
| excluded: covered by range menu | 152–161 |
| L-21 | 162–163 |
| L-22 | 164–165 |
| L-23 | 166–167 |
| L-24 | 168–169 |
| excluded: behind filter footer | 170–173 |
| excluded: clipped filter content | 174–297 |
| AX-42 | 298–299 |
| AX-43 | 300 |
| L-33 | 305 |
| excluded: static row data or structural wrapper | 310–313, 316–317, 320–322, 326–329, 332–333, 335–336, 338, 342–344, 347–348, 350–351, 353, 357–359, 362–363, 365–366, 368, 372–374, 377–378, 380–381, 383, 387–389, 392–393, 395–396, 398, 402–404, 407–408, 410–411, 413, 417–419, 422–423, 425–426, 428, 432–434, 437, 439, 441–442, 444, 448–450, 453–454, 456–457, 459, 463–465, 468, 470, 472–473, 475, 523 |
| L-40 | 314, 330–331, 345–346, 360–361, 375–376, 390–391, 405–406, 420–421, 435–436, 451–452, 466–467 |
| L-34 | 315 |
| L-36 | 318–319 |
| L-42 | 334, 337, 349, 352, 364, 367, 379, 382, 394, 397, 409, 412, 424, 427, 440, 443, 455, 458, 471, 474 |
| AX-44 | 438 |
| L-41 | 469 |
| L-48 | 488 |
| L-50 | 490 |
| L-51 | 491 |
| AX-41.1 | 524 |
| AX-41.2 | 525 |
| AX-41.3 | 526 |
| AX-41.4 | 527 |

SH references use contacts.md; L references use contacts.md list inventory. AX references use the filter inventory here. Structural table cells and headings without separate controls are excluded; their checkboxes/links/badges are separately mapped. The screenshot, rather than DOM presence alone, determines visibility.
