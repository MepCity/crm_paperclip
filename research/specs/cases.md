# Cases

Research slice: MEP-839, Module 8 record detail. This file records the authorized empty-list fallback; it does not establish a visually observed detail screen.

## Purpose

Describe the available evidence for a case detail, its comments, Timeline and related cards without writing to the reference CRM. The All Cases view contains no records. No record was created, no preference changed, no menu opened and no tab closed.

## Record detail

### Availability and evidence boundary

`m8d-cases-list-base` is a painted empty All Cases list: module-specific title, 55 API calls, visible “No Cases found.” and Total Records 0; zero record links. The issue explicitly permits this fallback when no record can be opened. The record-link painting condition cannot hold for an empty dataset; no claim of a populated painting gate is made. Diagnostics contain client errors, but the image shows the list controls and empty state. No longer wait or invented detail URL was used.

Header, Edit, More Options contents, previous/next arrows, Overview, Timeline, Timeline filter, related-list rail and detail card geometry are **not observed**. No KD number below represents an unseen detail control. The numbered inventory belongs to the fallback screen only.

### Control inventory — m8d-cases-list-base

Shell: SH-01–SH-11 and SH-26–SH-46 as in [contacts.md](contacts.md), with SH-08 labelled MCP. SH-46 is image-only. SH-12–SH-25 are clipped by the already-scrolled navigation viewport, not visible. The Cases navigation item is selected. No scrolling or preference toggle was performed. The visible extra rail entries are listed separately below; their destination behaviour and uncertain owning modules remain unobserved.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KD-01 | List | All Cases | tab | view strip, first | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-01 (accounts.md) |
| KD-02 | List | More Custom View / three dots | icon button | after All Cases | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-02 moved (accounts.md) |
| KD-03 | List | Filter | button | toolbar, left first | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-03 (accounts.md) |
| KD-04 | List | Sort | button | toolbar, left second | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-04 (accounts.md) |
| KD-05 | List | List view | icon button | toolbar view group, 1 | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-05 (accounts.md) |
| KD-06 | List | Kanban view | icon button | toolbar view group, 2 | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-06 (accounts.md) |
| KD-07 | List | Sheet view | icon button | toolbar view group, 3 | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-07 (accounts.md) |
| KD-08 | List | Chart view | icon button | toolbar view group, 4 | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-08 (accounts.md) |
| KD-09 | List | Timeline view | icon button | toolbar view group, 5 | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-09 (accounts.md) |
| KD-10 | List | Two horizontal bars | icon button | toolbar view group, 6 | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-10 (accounts.md) |
| KD-11 | List | Down chevron | icon button | toolbar view group, 7 | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-11 (accounts.md) |
| KD-12 | List | Create Case | button | toolbar, right first | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-12 (accounts.md) |
| KD-13 | List | More / down arrow | icon button | attached to Create Case | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-13 (accounts.md) |
| KD-14 | List | Actions / three dots | icon button | toolbar, far right | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-14 (accounts.md) |
| KD-15 | List | Search | input | filter panel, below title | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-15 (accounts.md) |
| KD-16 | List | System Defined Filters | toggle | filter panel, first heading | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-16 (accounts.md) |
| KD-17 | List | Latest Email Status | checkbox | system section, 1 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-19 (contacts.md) |
| KD-18 | List | Locked | checkbox | system section, 2 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-20 (contacts.md) |
| KD-19 | List | Record Action | checkbox | system section, 3 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-21 (contacts.md) |
| KD-20 | List | Related Records Action | checkbox | system section, 4 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-22 (contacts.md) |
| KD-21 | List | Touched Records | checkbox | system section, 5 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-23 (contacts.md) |
| KD-22 | List | Untouched Records | checkbox | system section, 6 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-24 (contacts.md) |
| KD-23 | List | Filter By Fields | toggle | filter panel, second heading | not observed; no click | seen (m8d-cases-list-base) | M8 | L-26 (contacts.md) |
| KD-24 | List | Account Name | checkbox | field section, 1 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-27 (contacts.md) |
| KD-25 | List | Case Number | checkbox | field section, 2 | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-26 | List | Case Origin | checkbox | field section, 3 | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-27 | List | Case Owner | checkbox | field section, 4 | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-28 | List | Case Reason | checkbox | field section, 5 | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-29 | List | Connected To | checkbox | field section, 6 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-30 (contacts.md) |
| KD-30 | List | Created By | checkbox | field section, 7 | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-31 | List | Created Time | checkbox | field section, 8 | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-32 | List | Deal Name (partly clipped) | checkbox | field section, 9 | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-33 | List | View Settings / sliders | icon button | table header, far right overlay | not observed; no click | seen (m8d-cases-list-base) | M11 | L-33 (contacts.md) |
| KD-34 | List | Case Number | column header | first text column | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-35 | List | Subject | column header | second text column | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-36 | List | All / down arrow | select | inside Subject header | not observed; no click | seen (m8d-cases-list-base) | M8 | L-36 (contacts.md) |
| KD-37 | List | Status | column header | third text column | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-38 | List | Priority | column header | fourth text column | not observed; no click | seen (m8d-cases-list-base) | M8 | new |

Refresh Custom View exists in the DOM but is not painted. No row selection, row-end action or pagination arrow is visible. Case Origin, Related To, Account Name and Case Owner table headers are offscreen DOM evidence, not image observations. Deal Name is only partly visible at the bottom of the field-filter viewport.

#### Shell controls missing from the inherited inventory

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KD-S01 | Rail | Products | link | module rail, visible row 1 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S02 | Rail | Quotes | link | module rail, visible row 2 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S03 | Rail | Invoices | link | module rail, visible row 3 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S04 | Rail | Sales Orders | link | module rail, visible row 4 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S05 | Rail | Solutions | link | module rail, visible row 5 below Search | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-S06 | Rail | Social | link | module rail, visible row 6 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S07 | Rail | Forecasts | link | module rail, visible row 7 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S08 | Rail | Purchase Orders | link | module rail, visible row 8 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S09 | Rail | Vendors | link | module rail, visible row 9 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S10 | Rail | SalesInbox | link | module rail, visible row 10 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S11 | Rail | Cases | link | module rail, visible row 11 below Search | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-S12 | Rail | My Jobs | link | module rail, visible row 12 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S13 | Rail | Services | link | module rail, visible row 13 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S14 | Rail | Projects | link | module rail, visible row 14 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |

### Offline reconciliation

Every controls.json entry is assigned below by its one-based source ordinal. Hidden duplicates are mapped to their visible control when meaningful; unrelated containers are excluded. The screenshot was opened as an image and inspected through the lower utility strip and right corners. SH-46 (trash icon) is the image-only addition. No overlay was opened.

| Source ordinal(s) | Inventory reference or exclusion |
| --- | --- |
| 1, 5, 6, 7, 8, 9, 10, 33, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105, 108, 110, 111, 112, 115, 119, 120, 122, 123, 125, 126, 129, 130, 135, 136, 137, 138, 139, 148, 163, 164, 167, 169, 183, 242, 243, 245, 247, 248, 249, 250, 251, 252, 253, 254, 255, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 322, 323, 324, 325, 326, 327 | Excluded: structural wrappers, hidden overlays, empty cells, static text or duplicate containers |
| 2, 3, 4 | SH-01 |
| 11 | SH-02 |
| 12, 13, 14 | SH-03 |
| 15, 16, 17 | SH-04 |
| 18, 19, 20 | SH-05 |
| 21, 22, 23 | SH-06 |
| 24, 25, 26 | SH-07 |
| 27, 28, 29 | SH-08 |
| 30, 31, 32 | SH-09 |
| 34 | SH-10 |
| 35, 36 | SH-11 |
| 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65 | Excluded: clipped navigation groups / links behind the rail viewport |
| 67, 68 | KD-S01 |
| 70, 71 | KD-S02 |
| 73, 74 | KD-S03 |
| 76, 77 | KD-S04 |
| 79, 80 | KD-S05 |
| 82, 83 | KD-S06 |
| 85, 86 | KD-S07 |
| 88, 89 | KD-S08 |
| 91, 92 | KD-S09 |
| 94, 95 | KD-S10 |
| 97, 98 | KD-S11 |
| 100, 101 | KD-S12 |
| 103, 104 | KD-S13 |
| 106, 107 | KD-S14 |
| 109, 244 | Excluded: resize hotspots without a painted grip |
| 113 | SH-26 |
| 114 | SH-27 |
| 116 | SH-28 |
| 117 | SH-29 |
| 118 | SH-30 |
| 121 | SH-31 |
| 124 | SH-32 |
| 127, 128 | SH-33 |
| 131, 132, 133, 134 | SH-34 |
| 140 | KD-01 |
| 141, 142, 143, 144, 145 | KD-02 |
| 146 | KD-03 |
| 147 | KD-04 |
| 149 | KD-05 |
| 150 | KD-06 |
| 151 | KD-07 |
| 152 | KD-08 |
| 153 | KD-09 |
| 154 | KD-10 |
| 155, 156 | KD-11 |
| 157, 158 | Excluded: unpainted Refresh Custom View |
| 159 | KD-12 |
| 160, 161 | KD-13 |
| 162, 320 | KD-14 |
| 165, 166, 321 | KD-15 |
| 168 | KD-16 |
| 170, 171 | KD-17 |
| 172, 173 | KD-18 |
| 174, 175 | KD-19 |
| 176, 177 | KD-20 |
| 178, 179 | KD-21 |
| 180, 181 | KD-22 |
| 182 | KD-23 |
| 184, 185 | KD-24 |
| 186, 187 | KD-25 |
| 188, 189 | KD-26 |
| 190, 191 | KD-27 |
| 192, 193 | KD-28 |
| 194, 195 | KD-29 |
| 196, 197 | KD-30 |
| 198, 199 | KD-31 |
| 200, 201 | KD-32 |
| 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241 | Excluded: offscreen field / related-module filters |
| 246 | KD-33 |
| 256 | KD-34 |
| 257 | KD-35 |
| 258, 259 | KD-36 |
| 260 | KD-37 |
| 261 | KD-38 |
| 262, 263, 264, 265, 266 | Excluded: offscreen table headers |
| 309 | SH-35 |
| 310 | SH-36 |
| 311 | SH-37 |
| 312 | SH-38 |
| 313 | SH-39 |
| 314 | SH-40 |
| 315 | SH-41 |
| 316 | SH-42 |
| 317 | SH-43 |
| 318 | SH-44 |
| 319 | SH-45 |

### Metadata-backed detail sections

Source M1: research metadata `modules/Cases/fields.json`, `layouts.json`, `related_lists.json`; 30 fields. Metadata establishes field types and layout membership, not actual detail rendering, collapse state or card order. No field values are reproduced.

- **Case Image:** empty field list in layout metadata; rendering not observed.
- **Case Information:** `Owner`, `Case_Number`, `Status`, `Product_Name`, `Priority`, `Type`, `Case_Reason`, `Case_Origin`, `Subject`, `Related_To`, `No_of_comments`, `Account_Name`, `Reported_By`, `Deal_Name`, `Email`, `Tag`, `Phone`, `Created_By`, `Modified_By`, `Created_Time`, `Modified_Time`, `id`, `Last_Activity_Time`, `Connected_To__s`.
- **Description Information:** `Description` and `Internal_Comments`, both textarea.
- **Solution Information:** `Solution` and `Add_Comment`, both textarea.
- **Comment Information:** `Comments`, text. `No_of_comments` is integer; its relation to any painted badge is not observed.
- `Locked__s` is boolean in the field dictionary, absent from these layout section fields.

### Public documentation evidence

D1: reference CRM public help, **Working with Cases**, sections “Standard fields in the Cases module”, “Emails in Cases”, “Associate Case with Other Records”; accessed 2026-10-17. Locator: help knowledge base → CRM → Customer Support → `working-with-cases`. Vendor-bearing source URLs are deliberately not stored in the repository.

D1 describes description and resolution text, internal follow-up notes and solution comments. It documents composing case email for the related contact, with a default primary address and alternative addresses. Case-related emails can be filtered by sent messages or contact-associated messages. It describes related activities, completed history, attachments and notes. These are documented capabilities, not observations of button positions. D1 contains a mismatched module label in its association instructions; metadata governs module membership. No documentation screenshot or image asset was copied.

### Related-list cards

Each subsection below is **metadata only** (M1). Sequence numbers are retained, including ties. For every card: rendered heading, counter, columns, row controls, empty-state wording and location in the rail are **not observed**. Provisional implementation must reuse the closest existing shared card and await the CTO gate for any Cases-specific difference; metadata visibility alone does not prove that a card is painted. No add, associate, remove or row action was exercised.

#### Connected Records

M1: sequence 1, API key `Connected_Records__s`. No Cases-specific card behaviour established; preserve as a gate question.

#### Review Process-Review Summary

M1: sequence 1, API key `Review_Processes`. No Cases-specific card behaviour established; preserve as a gate question.

#### Notes

M1: sequence 2, API key `Notes`. Provisional shared behaviour: [notes.md](notes.md); D1 documents notes association.

#### Review Process-Field History

M1: sequence 2, API key `Review_Logs`. No Cases-specific card behaviour established; preserve as a gate question.

#### WebformUsage

M1: sequence 3, API key `WebformUsage`. No Cases-specific card behaviour established; preserve as a gate question.

#### Attachments

M1: sequence 4, API key `Attachments`. Provisional shared behaviour: [attachments.md](attachments.md); D1 documents document attachments.

#### Open Tasks

M1: sequence 6, API key `Tasks`. Provisional shared activity presentation: [activities-record-detail.md](activities-record-detail.md); D1 documents open/completed activity history without confirming this card split.

#### Open Meetings

M1: sequence 7, API key `Events`. Provisional shared activity presentation: [activities-record-detail.md](activities-record-detail.md); D1 documents open/completed activity history without confirming this card split.

#### Open Calls

M1: sequence 8, API key `Calls`. Provisional shared activity presentation: [activities-record-detail.md](activities-record-detail.md); D1 documents open/completed activity history without confirming this card split.

#### Closed Calls

M1: sequence 11, API key `Calls_History`. Provisional shared activity presentation: [activities-record-detail.md](activities-record-detail.md); D1 documents open/completed activity history without confirming this card split.

#### Closed Meetings

M1: sequence 12, API key `Events_History`. Provisional shared activity presentation: [activities-record-detail.md](activities-record-detail.md); D1 documents open/completed activity history without confirming this card split.

#### Closed Tasks

M1: sequence 13, API key `Tasks_History`. Provisional shared activity presentation: [activities-record-detail.md](activities-record-detail.md); D1 documents open/completed activity history without confirming this card split.

#### Mailing History

M1: sequence 14, API key `Mailing_History`. No Cases-specific card behaviour established; preserve as a gate question.

#### Checklists

M1: sequence 15, API key `CheckLists`. No Cases-specific card behaviour established; preserve as a gate question.

#### Emails

M1: sequence 16, API key `Emails`. D1 documents case/contact email filtering; send and reply placement remain not observed. Do not open any compose control during research.

#### Locking Information

M1: sequence 17, API key `Locking_Information__s`. No Cases-specific card behaviour established; preserve as a gate question.

#### Email Drafts

M1: sequence 18, API key `Email_Drafts__s`. No Cases-specific card behaviour established; preserve as a gate question.

#### Email Sentiment

M1: sequence 18, API key `Email_Sentiment`. No Cases-specific card behaviour established; preserve as a gate question.

#### Solutions card or solution association

No `Solutions` related-list key appears in Cases metadata. `Solution` is a textarea, not a lookup. Neither a Solutions card nor a solution link was observed. D1 describes adding a resolved answer to the Solutions module as a subsequent workflow; that does not establish a relationship card or a Find Solution control. Do not invent one from the similarly named field.

### Case-specific controls and Timeline

Comment composer, Add Comment submission, Close Case, status-changing controls, Escalate, Reply, Send Email, Find Solution, solution association, locking/unlocking and approval/rejection controls were not visible because no detail was available. Their presence, exact label and position are not established by this research. D1 establishes email composition and comment field purposes only; it does not establish the requested close/escalate/find-solution control layout. All remain inspection-only in the reference.

Timeline, its filter popup, and its empty-state text are not observed. Reuse [accounts-record-detail.md](accounts-record-detail.md) and [record-detail.md](record-detail.md) only as provisional shared patterns; no Cases filter options or timeline event labels are asserted.

## Evidence gaps

These are CTO gate inputs, not questions sent to the board. Every proposal below is provisional and requires gate resolution before being treated as Cases parity evidence.

| Item | Available source / missing evidence | Provisional rule proposal |
| --- | --- | --- |
| Detail title, Edit, More Options, previous/next | Empty list image; no record link | Reuse shared record header; leave menu membership unresolved |
| Overview, Timeline and opened Timeline filter | No record; shared detail specs only | Reuse shared tabs provisionally; do not invent Cases filter options or empty wording |
| Field placement and section presentation | M1 layout membership; no detail image | Use metadata fields in section order; keep read-only and editable presentations separate |
| Description, Internal Comments, Solution | M1 textarea types; D1 purposes | Reuse textarea display pattern; exact rendering unresolved |
| Comment entry, history and count | M1 Add_Comment, Comments, No_of_comments; D1 field purpose | Keep comment submission separate from internal notes; count-update and history behaviour unresolved |
| All 18 related cards: header, count, columns, row controls, empty states | M1 list membership only; D1 covers a subset generically | Reuse shared card per type; confirm visibility/order/columns at gate |
| Solutions relationship or Find Solution | No Solutions list in M1; D1 workflow only | Keep Solution text field; add no relationship card without further evidence |
| Close/status/escalate and approval/locking | M1 Status and Locked__s; no visible controls | No dedicated action inferred from a field or metadata list |
| Reply / Send Email position | D1 documents composition; no detail image | Reuse shared email workflow provisionally; exact action location unresolved |
| Hover actions, validation, success and server-error states | Not observable from empty list without a write | Keep not observed; never create reference records to obtain evidence |
| Extra rail module ownership | Image establishes labels only | Keep unknown ownership as ? until shared-shell research resolves it |

## Capture refs and verification

- `m8d-cases-list-base`: click-free All Cases empty list; 327 source entries; image opened. 55 API calls form the baseline. Zero executed/skipped clicks. Expected blocked reminder, notification and telemetry requests only; no record mutation evidence.
- No detail, More Options, Timeline or filter capture: no record to open. No “after” capture was necessary after zero interactions: base is also the final observed state, total 0 and record links 0.
- No network contract table or visual measurements are included. Metadata was read offline. Markdown/source integrity and ordinal coverage were checked; application tests are not applicable to a documentation-only change.
