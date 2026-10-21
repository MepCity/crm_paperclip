# Email on record detail — partial research

Status: partial; awaiting board-authored Contact record address in the existing
issue interaction. MEP-1020 and CTO-approved MEP-1021 resolved the diagnostic
stop. The existing Lead retry is accepted as the R3 Lead baseline; no new
Lead capture is authorized or needed.
Issue: MEP-1012 / M10-R3. Research date: 2026-10-21.

## Purpose and evidence boundary

Document the Emails/Drafts related area, Send Email entry points and email
history on record details under section 4.3 of the
[approved plan](../module-10-email-calendar-research-plan.md).
R2 was approved before this research began. The approved preparation and R2
branches were merged. Existing shells and general behaviour stay in
[Lead detail](record-detail.md), [Contact detail](contacts-record-detail.md),
[Account detail](accounts-record-detail.md) and [Deal detail](deals-record-detail.md).

The only board-written `address.txt` found within the research workspace is
in `captures/board-lead-convert-probe/`. It identifies one Lead on a convert
route. Only its record-detail parent was loaded; the convert screen was not
opened. No Contact, Account or Deal address is supplied. No record was selected
from customer data, metadata, previous captures or a guessed identifier.

## Layout

The Lead probe visibly draws the shared rail, top bar, record header, related-list
rail, Overview/Timeline tabs, stage strip, business card and beginning of the
expanded details. Send Email is the first header action. Emails is a named
related-list rail entry. The business card and partially clipped details each
show an email link. The Emails card itself is below the captured viewport;
its DOM presence does not prove a painted or settled card. Drafts and email
history are not visible. No message was opened.

The initial probe remains failed evidence because of additional page errors.
The existing retry passes under the CTO-approved baseline-error amendment
(MEP-1021), as reconciled below. Acceptance covers the rendered resting record,
not the offscreen Emails card, Drafts contents or email history.

## Control inventory

### Full initial-probe inventory — m10r3-lead-detail-base

All rows have source `seen (m10r3-lead-detail-base)` unless explicitly marked
screenshot-only. Seen means presence, never tested activation. Position is
relative, without measurements. `Contacts ref` maps to the existing Contact
detail/shared shell inventory; `new` means no established shared mapping.
Controls repeated as DOM wrappers share one structural row.

| # | Position | Control | Behaviour / status | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- |
| ER-01 | Rail header | Application selector | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-01 |
| ER-02 | Rail header | Hide Menu | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-02 |
| ER-03 | Rail | Home | Present; not clicked | seen (m10r3-lead-detail-base) | M14 | SH-03 |
| ER-04 | Rail | Workqueue | Present; not clicked | seen (m10r3-lead-detail-base) | M14 | SH-04 |
| ER-05 | Rail | Reports | Present; not clicked | seen (m10r3-lead-detail-base) | M13 | SH-05 |
| ER-06 | Rail | Analytics | Present; not clicked | seen (m10r3-lead-detail-base) | M13 | SH-06 |
| ER-07 | Rail | Agents | Present; not clicked | seen (m10r3-lead-detail-base) | P3 | SH-07 |
| ER-08 | Rail | MCP | Present; not clicked | seen (m10r3-lead-detail-base) | P3 | SH-08 |
| ER-09 | Rail | Teamspace selector | Present; not clicked | seen (m10r3-lead-detail-base) | M11 | SH-09 |
| ER-10 | Rail | More Actions | Present; not clicked | seen (m10r3-lead-detail-base) | M11 | SH-10 |
| ER-11 | Rail | Search | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-11 |
| ER-12 | Rail | Sales | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-12 |
| ER-13 | Rail | Leads | Present; not clicked | seen (m10r3-lead-detail-base) | M1 | SH-13 |
| ER-14 | Rail | Contacts | Present; not clicked | seen (m10r3-lead-detail-base) | M2 | SH-14 |
| ER-15 | Rail | Accounts | Present; not clicked | seen (m10r3-lead-detail-base) | M3 | SH-15 |
| ER-16 | Rail | Deals | Present; not clicked | seen (m10r3-lead-detail-base) | M4 | SH-16 |
| ER-17 | Rail | Documents | Present; not clicked | seen (m10r3-lead-detail-base) | M9 | SH-17 |
| ER-18 | Rail | Campaigns | Present; not clicked | seen (m10r3-lead-detail-base) | M7 | SH-18 |
| ER-19 | Rail | Activities | Present; not clicked | seen (m10r3-lead-detail-base) | M5 | SH-19 |
| ER-20 | Rail | Tasks | Present; not clicked | seen (m10r3-lead-detail-base) | M5 | SH-20 |
| ER-21 | Rail | Meetings | Present; not clicked | seen (m10r3-lead-detail-base) | M5 | SH-21 |
| ER-22 | Rail | Calls | Present; not clicked | seen (m10r3-lead-detail-base) | M5 | SH-22 |
| ER-23 | Rail | Integrations | Present; not clicked | seen (m10r3-lead-detail-base) | M15 | SH-23 |
| ER-24 | Rail | Visits | Present; not clicked | seen (m10r3-lead-detail-base) | M15 | SH-24 |
| ER-25 | Rail | Price Books | Present; not clicked | seen (m10r3-lead-detail-base) | P2 | SH-25 |
| ER-26 | Top bar | Search records | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-26 |
| ER-27 | Top bar | Plus icon | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-27 |
| ER-28 | Top bar | Assistant shortcut | Present; not clicked | seen (m10r3-lead-detail-base) | P3 | SH-28 |
| ER-29 | Top bar | Notifications | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-29 |
| ER-30 | Top bar | Calendar | Present; not clicked | seen (m10r3-lead-detail-base) | M10 | SH-30 |
| ER-31 | Top bar | Marketplace | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-31 |
| ER-32 | Top bar | Setup | Present; not clicked | seen (m10r3-lead-detail-base) | M11 | SH-32 |
| ER-33 | Top bar | Profile | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-33 |
| ER-34 | Top bar | Applications menu | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-34 |
| ER-35 | Record header | Back | Present; not clicked | seen (m10r3-lead-detail-base) | M1 | D-01 |
| ER-36 | Record header | Portrait | Present; not clicked | seen (m10r3-lead-detail-base) | M6 | D-02 |
| ER-37 | Record header | Add Tags | Present; not clicked | seen (m10r3-lead-detail-base) | M6 | D-04 |
| ER-38 | Record header | Send Email | Present; not clicked | seen (m10r3-lead-detail-base) | M10 | D-05 |
| ER-39 | Record header | Convert | Present; not clicked | seen (m10r3-lead-detail-base) | M1 | new |
| ER-40 | Record header | Edit | Present; not clicked | seen (m10r3-lead-detail-base) | M1 | D-06 |
| ER-41 | Record header | More Options | Present; not clicked | seen (m10r3-lead-detail-base) | M1 | D-07 |
| ER-42 | Related-list rail | Notes | Present; not clicked | seen (m10r3-lead-detail-base) | M6 | D-10 |
| ER-43 | Related-list rail | Connected Records | Present; not clicked | seen (m10r3-lead-detail-base) | Unknown | D-11 |
| ER-44 | Related-list rail | Cadences | Present; not clicked | seen (m10r3-lead-detail-base) | P3 | D-13 |
| ER-45 | Related-list rail | Attachments | Present; not clicked | seen (m10r3-lead-detail-base) | M6 | D-12 |
| ER-46 | Related-list rail | Products | Present; not clicked | seen (m10r3-lead-detail-base) | P2 | D-18 |
| ER-47 | Related-list rail | Open Activities | Present; not clicked | seen (m10r3-lead-detail-base) | M5 | D-15 |
| ER-48 | Related-list rail | Closed Activities | Present; not clicked | seen (m10r3-lead-detail-base) | M5 | D-16 |
| ER-49 | Related-list rail | Invited Meetings | Present; not clicked | seen (m10r3-lead-detail-base) | M5 | D-17 |
| ER-50 | Related-list rail | Emails | Present; not clicked | seen (m10r3-lead-detail-base) | M10 | D-23 |
| ER-51 | Related-list rail | Campaigns | Present; not clicked | seen (m10r3-lead-detail-base) | M7 | D-25 |
| ER-52 | Related-list rail | Social | Present; not clicked | seen (m10r3-lead-detail-base) | M15 | D-26 |
| ER-53 | Related-list rail | Voice of the Customer | Present; not clicked | seen (m10r3-lead-detail-base) | P3 | D-28 |
| ER-54 | Related-list rail | Add Related List | Present; not clicked | seen (m10r3-lead-detail-base) | M11 | D-29 |
| ER-55 | Related-list rail | Add Link | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | new |
| ER-56 | Tab row | Related-list rail visibility | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | D-32 |
| ER-57 | Tab row | Overview | Selected; not clicked | seen (m10r3-lead-detail-base) | Shared | D-33 |
| ER-58 | Tab row | Timeline | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | D-34 |
| ER-59 | Stage strip | Stage backward arrow | Present; not clicked | seen (m10r3-lead-detail-base) | M1 | new |
| ER-60 | Stage strip | Contact in Future (partly clipped) | Status control; not clicked | seen (m10r3-lead-detail-base) | M1 | new |
| ER-61 | Stage strip | Contacted | Status control; not clicked | seen (m10r3-lead-detail-base) | M1 | new |
| ER-62 | Stage strip | Junk Lead | Status control; not clicked | seen (m10r3-lead-detail-base) | M1 | new |
| ER-63 | Stage strip | Lost Lead | Status control; not clicked | seen (m10r3-lead-detail-base) | M1 | new |
| ER-64 | Stage strip | Not Contacted | Status control; not clicked | seen (m10r3-lead-detail-base) | M1 | new |
| ER-65 | Stage strip | Pre-Qualified | Status control; not clicked | seen (m10r3-lead-detail-base) | M1 | new |
| ER-66 | Stage strip | Not Qualified | Status control; not clicked | seen (m10r3-lead-detail-base) | M1 | new |
| ER-67 | Stage strip | Stage forward arrow | Present; not clicked | seen (m10r3-lead-detail-base) | M1 | new |
| ER-68 | Stage strip right | Status icon/dropdown | Present; not clicked | seen (m10r3-lead-detail-base) | M1 | new |
| ER-69 | Business card | Email address link | Present; not clicked | seen (m10r3-lead-detail-base) | M10 | D-36 |
| ER-70 | Business card Phone | Phone call icon | Present; not clicked | seen (m10r3-lead-detail-base) | M5 | D-37 |
| ER-71 | Business card Mobile | Mobile call icon | Present; not clicked | seen (m10r3-lead-detail-base) | M5 | new |
| ER-72 | Details header | Hide Details | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | D-38 |
| ER-73 | Details field | Email address link (partly clipped) | Present; not clicked | seen (m10r3-lead-detail-base) | M10 | D-40 |
| ER-74 | Details Phone | Phone call icon | Present; not clicked | seen (m10r3-lead-detail-base) | M5 | D-41 |
| ER-75 | Utility strip | My Pins | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-35 |
| ER-76 | Utility strip | Chats | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-36 |
| ER-77 | Utility strip | Contacts | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-37 |
| ER-78 | Utility strip | Document/history icon | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-38 |
| ER-79 | Utility strip | Announcements | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-39 |
| ER-80 | Utility strip | Motivator | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-40 |
| ER-81 | Utility strip | Sticky Notes | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-41 |
| ER-82 | Utility strip | Activity Reminders | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-42 |
| ER-83 | Utility strip | Recent Items | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-43 |
| ER-84 | Utility strip | Accessibility | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-44 |
| ER-85 | Utility strip | Help | Present; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-45 |
| ER-86 | Utility strip far right | Stacked-cards icon | Screenshot only; not clicked | seen (m10r3-lead-detail-base) | Shared | SH-46 |

### Reconciliation

One-based ordinals refer only to local controls.json entries, never selectors.
Every raw entry has one mapping or exclusion. Plain record data is excluded;
no field content is reproduced. Screenshot-only icons are included separately.

| Inventory / exclusion | controls.json ordinals |
| --- | --- |
| ER-01 | 2, 3, 4 |
| ER-02 | 11 |
| ER-03 | 12, 14 |
| ER-04 | 15, 17 |
| ER-05 | 18, 20 |
| ER-06 | 21, 23 |
| ER-07 | 24, 26 |
| ER-08 | 27, 29 |
| ER-09 | 30, 31, 32 |
| ER-10 | 34 |
| ER-11 | 35, 36 |
| ER-12 | 37 |
| ER-13 | 39, 40 |
| ER-14 | 41, 42 |
| ER-15 | 43, 44 |
| ER-16 | 45, 46 |
| ER-17 | 47, 48 |
| ER-18 | 49, 50 |
| ER-19 | 51 |
| ER-20 | 53, 54 |
| ER-21 | 55, 56 |
| ER-22 | 57, 58 |
| ER-23 | 59 |
| ER-24 | 61, 62 |
| ER-25 | 64, 65 |
| ER-26 | 86 |
| ER-27 | 87 |
| ER-28 | 89 |
| ER-29 | 90 |
| ER-30 | 91 |
| ER-31 | 94 |
| ER-32 | 97 |
| ER-33 | 100, 101 |
| ER-34 | 104, 105, 106, 107 |
| ER-35 | 109, 110 |
| ER-36 | 112, 113 |
| ER-37 | 117 |
| ER-38 | 119, 120 |
| ER-39 | 121, 122 |
| ER-40 | 123, 124 |
| ER-41 | 125, 126 |
| ER-42 | 129, 130 |
| ER-43 | 132, 133 |
| ER-44 | 135, 136 |
| ER-45 | 138, 139 |
| ER-46 | 141, 142 |
| ER-47 | 144, 145 |
| ER-48 | 147, 148 |
| ER-49 | 150, 151 |
| ER-50 | 153, 154 |
| ER-51 | 156, 157 |
| ER-52 | 159, 160 |
| ER-53 | 162, 163 |
| ER-54 | 165 |
| ER-55 | 166 |
| ER-56 | 167 |
| ER-57 | 169 |
| ER-58 | 170 |
| ER-59 | 173 |
| ER-60 | 175 |
| ER-61 | 176 |
| ER-62 | 177 |
| ER-63 | 178 |
| ER-64 | 179 |
| ER-65 | 180 |
| ER-66 | 181 |
| ER-67 | 182 |
| ER-68 | 183 |
| ER-69 | 199, 200 |
| ER-70 | 436 |
| ER-71 | 437 |
| ER-72 | 220, 221 |
| ER-73 | 278, 279 |
| ER-74 | 438 |
| ER-75 | 425 |
| ER-76 | 426 |
| ER-77 | 427 |
| ER-78 | 428 |
| ER-79 | 429 |
| ER-80 | 430 |
| ER-81 | 431 |
| ER-82 | 432 |
| ER-83 | 433 |
| ER-84 | 434 |
| ER-85 | 435 |
| Excluded: Structural wrapper, heading or native scrolling chrome | 1, 38, 52, 60, 63, 83, 85, 88, 108, 128, 168, 172, 186, 219, 222, 223, 424, 447, 448, 449, 455 |
| Excluded: Hidden, offscreen or zero-area | 5, 6, 7, 8, 9, 10, 13, 16, 19, 22, 25, 28, 33, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 84, 92, 93, 95, 96, 98, 99, 102, 103, 111, 116, 118, 127, 131, 134, 137, 140, 143, 146, 149, 152, 155, 158, 161, 164, 184, 185, 206, 212, 238, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 440, 441, 442, 443, 444, 445, 446, 456, 457, 458, 459, 460, 461, 462 |
| Excluded: Plain field label/value, duplicate wrapper or non-painted region | 66, 67, 68, 114, 115, 171, 174, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 201, 202, 203, 204, 205, 207, 208, 209, 210, 211, 213, 214, 215, 216, 217, 218, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 239, 240, 241, 242, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 439, 450, 451, 452, 453, 454 |

Raw controls: 462. Mapped raw entries: 132. Excluded raw entries: 330. Structural inventory rows: 86 (one screenshot-only).

### Retry delta — m10r3-lead-detail-retry-base

The retry screenshot was opened and inspected across the full frame. All 462
entries match the base's tag/name/attributes/box in the same ordinal order.
Only three excluded offscreen entries (456–458) have different selector
strings; they stay excluded. No selector was used. Every base mapping and
exclusion therefore applies unchanged: 132 mapped raw entries, 330 excluded,
86 structural rows including one screenshot-only utility icon. No shell rows
are repeated.

| # | Delta / region | Behaviour / result | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- |
| ER-01–ER-86 | No visible control change | Same resting state; all actions untested | seen (m10r3-lead-detail-retry-base) | Same as base | Same as base |
| Excluded 456–458 | Offscreen Notes controls | Selector strings differ only; not painted | local controls comparison | M6 | not applicable |

The module title and raw-control count are present, but `pageerror
$L(...).sortable is not a function` and `pageerror XMLHttpRequest` remain.
Both messages also occur in the earlier accepted painted record-detail capture
`m7-campaign-links-lead-detail`. Under MEP-1021 rule 10 they are baseline
errors, not a gate failure. The retry has no other pageerror and no failed
JavaScript GET. Its 76 API entries exceed half of that earlier capture's 86;
462 controls exceed 50. The existing full-frame screenshot inspection shows
the module heading, rendered record and record links. Platform Lead accepted
this existing retry as the R3 Lead baseline in MEP-1020. No third Lead capture
is made. The original probe's additional `header` and `showChecklist` errors
remain failed evidence; it is not retrospectively accepted.

### Inherited Contact evidence (not a new R3 capture)

[Contact detail](contacts-record-detail.md) remains the authority for its earlier
`m2d2-card-cases` screenshot and reconciliation. It records the following;
R3 does not re-open that record or claim these are fresh capture results.

| # | Region / control | Behaviour / limit | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- |
| EC-01 | Header Send Email | Drawn; not activated | inherited Contact spec | M10 | D-05 |
| EC-02 | Emails rail entry | Drawn; navigation not tested there | inherited Contact spec | M10 | D-23 |
| EC-03 | Emails card Compose Email | Header action; not activated | inherited Contact spec | M10 | D-79 |
| EC-04 | Mails tab | Initially selected; empty record area | inherited Contact spec | M10 | D-80 |
| EC-05 | Drafts tab | Present; not opened | inherited Contact spec | M10 | D-81 |
| EC-06 | Scheduled tab | Present; not opened | inherited Contact spec | M10 | D-82 |

This historical evidence shows tabs inside an Emails card, not a separately
painted Drafts card. Metadata's separate related-list definition must not be
converted into a second visible card without evidence. No current Contact
delta, Drafts contents, message row or email timeline event is established.

## Fields and metadata

Local `modules/<Module>/related_lists.json`, read on 2026-10-21, lists `Emails`
and `Email_Drafts__s` for each of Leads, Contacts, Accounts and Deals. Their
labels are Emails and Email Drafts; both have type `default`. This establishes
related-list availability in the export, not current visibility or permission.
No record/module identifiers were copied. No `Emails` or `Email_Drafts__s`
field export is present, per the approved plan; R8 owns the missing model.

| Module | Exported email/draft relations | Fresh R3 detail evidence |
| --- | --- | --- |
| Leads | Both | Existing retry accepted under MEP-1020/1021; card offscreen |
| Contacts | Both | No board-written record address available |
| Accounts | Both | No board-written record address available |
| Deals | Both | No board-written record address available |

The visible email address is a link, not an editable recipient field in the
captured resting screen. Subject, sender/recipient columns, send/receive time,
status, attachment/thread markers, draft ownership and counters are unknown.
No schema, field constraints or request payload is inferred.

## Actions and click list

Executed click list: **empty (0 selectors / 0 clicks)**. Offline match testing
and `DANGEROUS_TEXT` testing have no executed candidates. Send Email is
excluded by the tool's dangerous-text guard (`send`) and the plan. Compose
Email is forbidden by the plan regardless of whether its text matches the
regular expression. Address links may open compose and are not clicked.

Emails navigation and Timeline remain untested. The accepted Lead baseline
does not establish that those controls avoid persisted preferences. No claim
is made that related headers expand without persisting. Drafts/Scheduled selection, message opens, scope/filter changes,
card collapse/expand, Hide Details and rail visibility are not exercised.
No unnamed menu, positional selector, preference change or alternate route
was used. No control is proposed for a preference or gate exception.

## Filters / views / sorting / search

No Emails card or message list is visible in the R3 viewport. Sort, search,
correspondence scope, pagination, thread expansion, Drafts/Scheduled selection and default ordering are unknown.
Shared Timeline filter behaviour stays in the existing record-detail specs;
email-specific filter options/results are not established.

## Request safety baseline

Initial click-free Lead probe: 77 API entries as reported by `meta.apiCalls`.
Successful non-GET rows in `network.json` are below. Paths are neutralized;
no host, account id, visitor id, request keys or payload shapes are copied.
These automatic load calls do not authorize any action or replay.

| Method | Neutral path | Count | Recorded HTTP status |
| --- | --- | --- | --- |
| POST | `/crm/<org>/EntityCustomization.do` | 1 | 200 |
| POST | `/crm/v2.2/Leads/bulk` | 2 | 204 |
| POST | `/visitor/v2/<service>/livevisitors/<id>/triggers` | 1 | 200 |

`meta.blockedRequests` has seven entries, one listed entry per path below.
Blocked entries do not prove a successful write. These were not retried or
manually replayed. The count is the evidence array's entries, not an assertion
about server-side executions.

| Method | Neutral blocked path | Tool reason |
| --- | --- | --- |
| POST | `/crm/<org>/ActivityReminder.do` | Legacy reminder action |
| POST | `/crm/v4/Leads/<id>/actions/get_related_records_count` | Related-record count guard |
| POST | `/crm/<org>/crminotification.do` | Legacy notification status |
| POST | `/murphy/<id>/ingest/exceptions` | Telemetry |
| POST | `/murphy/<id>/ingest/infoLogs` | Telemetry |
| POST | `/murphy/<id>/telemetry/urlMonitor` | Telemetry |
| POST | `/murphy/<id>/telemetry/logs` | Telemetry |

No mail-service load, email-related read count or safe message-read path is
established. Offscreen DOM text is not evidence that such data was loaded.
The accepted retry defines only this Lead module's load; it cannot be reused
as a Contact, Account or Deal baseline. Every sent non-GET path/count remains
subject to rule 7. A new blocked path still stops; only existing tool-blocked
telemetry/poll counts receive the limited MEP-1021 exception.

### Retry comparison and resolved stop

The retry reports 76 API entries. Sent non-GET counts are customization 1,
Lead bulk 1 and visitor trigger 1. Platform Lead's MEP-1020 comment states
initial Lead bulk 1 as well. Offline reconciliation in this continuation finds
one aggregated initial network row with `count: 2`, versus `count: 1` in the
accepted retry. The initial table preserves the file's count rather than
silently changing evidence. The accepted retry's continuation baseline is
unambiguously **1** for each of the three sent paths; no sent count increases
from the initial probe to that retry. The discrepancy in the review comment
does not change the accepted retry baseline.

The blocked array has **8 entries**, with the same seven paths as the initial
probe's **7 entries**. `/murphy/<id>/telemetry/urlMonitor` occurs twice versus
once; every other blocked path occurs once. The tool refused these requests;
none reached the reference CRM. No user write or manual replay occurred.

Research originally stopped under the then-current rule 7, with CEO notified.
MEP-1021 (CTO-approved) now compares existing blocked telemetry/poll paths by
path only and logs their counts. MEP-1020 is complete and accepts the existing
retry: the known page errors above and blocked urlMonitor count are logged,
not retried. Any new pageerror, failed JavaScript GET, new non-GET path or
increased sent count stops further research under the amended rules.

Contact remains unobserved pending the existing board address-file question.
No reference capture or click was made during this offline reconciliation.

## Flows and empty/error states

1. Read the sole board-authored address and load only its Lead detail parent.
2. Take click-free base with `--wait 25000`; inspect all six evidence files.
3. Detect failed paint gate from page errors; do not operate any control.
4. Apply the plan's single five-minute retry; retain failed evidence rather
   than treating visible content as a passed screen.

The first probe contains module title and 462 raw controls, but diagnostics
include `pageerror $L(...).sortable is not a function`,
`pageerror XMLHttpRequest`, `pageerror Cannot read properties of null (reading
'header')` and `pageerror Cannot read properties of null (reading 'showChecklist')`.
This fails the gate even though a screenshot exists. No failed JavaScript
request is needed to establish the failure. No tool failure, missing meta,
unknown click or user-initiated write occurred.

No fresh Emails/Drafts empty, loading, permission or error state is verified.
The inherited Contact empty Mails area does not establish Drafts emptiness or
an empty timeline. Email sent/received/opened/clicked/replied/bounced history
rows, their direction/status icons and navigation effects remain unobserved.
Creating mail to manufacture these states is forbidden.

## Write-only flows

See [write-only flows](../module-10-write-only-flows.md), W1/W3/W12/W13/W19.
Compose/send, draft create/save/delete/resume, schedule/cancel, association and
tracking-result history need separate documentation or a board decision. No
sandbox, night test or reference write is authorized by this spec.

## Open questions

1. Where is the board-authored Contact `address.txt` for the required Contact
   capture, and, if supplied, the Account/Deal addresses? Do not infer records.
2. Resolved: MEP-1020/1021 accept the existing retry using the earlier
   `m7-campaign-links-lead-detail` baseline errors and the blocked telemetry
   exception. The initial probe remains failed; no new Lead capture is made.
3. Does Emails navigation only scroll, and can it be used without persistence?
   Persistence has not been established; no click is made.
4. Which email/draft columns, counters, empty states, ownership and scope choices
   are actually visible? Metadata and inherited evidence do not settle them.
5. Which email events appear in Timeline, with what grouping, ordering and
   permission rules? No message was opened or created to obtain an example.

## Capture refs

- `m10r3-lead-detail-base`: click-free, `--wait 25000`; provisional screenshot
  inventory only; paint gate failed.
- `m10r3-lead-detail-retry-base`: click-free, `--wait 25000`; started
  2026-10-21 13:49:50 UTC, after base meta 13:44:36 UTC; initially stopped,
  subsequently accepted under MEP-1020/1021 as the R3 Lead baseline.
- `m7-campaign-links-lead-detail`: earlier accepted painted Lead detail,
  used only for baseline-error/API-count comparison; no new capture.
- `m2d2-card-cases`: inherited Contact spec reference only; no fresh R3 access,
  recount or raw-evidence completeness claim.

## Verification

`research/specs/verify.mjs` is absent. Documentation checks cover required
sections, unique inventory numbers, exhaustive raw-control reconciliation,
neutral content, relative links and `git diff --check`. No application code
changed; application tests and biome/typecheck are unnecessary for this task.
`docs/parity-checklist.md` is unchanged. This is a partial deliverable, not a
completed UI Lead handoff. Each R3 capture reconciles 462 raw controls to
86 structural rows (132 raw entries mapped), with 330 excluded raw entries.
No implementation/CI parity claim is made. The main merge includes unrelated
checklist updates; this issue authors no checklist edit.
