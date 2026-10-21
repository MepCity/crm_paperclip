# Calendar settings and booking pages — R6 access evidence

## Purpose and status

Investigate calendar synchronization, working hours, default reminders, booking
page administration and meeting providers without changing the reference CRM.
This is a documentation-completed research deliverable with explicit access gaps;
unobserved screens are not accepted as visual parity evidence.
The booking route exposes a missing-business-hours prerequisite rather than a
booking list. No configuration, connection, preference or public booking page
was opened. R6 no longer depends on R5 approval under the CEO decision on
MEP-1035; the single-capture rule remains in force.

## Layout and observed prerequisite

The settings sidebar occupies the left region, with settings search and
category navigation. The utility strip remains above the otherwise empty
content area. A blocking dialog dims the page. It has a warning symbol, a
heading indicating business hours are not configured, one explanatory sentence
that booking requires organization business hours, then a primary Configure
Business Hours button and a secondary Cancel button. No booking rows, list
columns, pagination or booking-page links are visible behind the dialog.

This evidence proves the prerequisite in the current session only. It does not
prove the booking list is empty, that the user lacks booking permissions, or
what the post-configuration page looks like. Static title and explanatory copy
are described here, not counted as interactive controls.

## Capture refs and paint gate

- `m10r6-booking-base`: click-free navigation to
  `/crm/<org>/settings/booking`, `--wait 25000`.
- Route provenance: the named Calendar Booking link in the existing
  `m6-setup` capture exposes that settings path. It is an internal administration
  route, not a public booking URL.
- Base: 291 control entries; 26 API calls. The captured page title identifies
  Calendar Booking, and the prerequisite is drawn. Diagnostics include
  `pageerror Cannot read properties of undefined (reading '_sortableParentData')`.
  Therefore the base fails the strict paint gate despite its visible dialog
  and control count. No screen behind it is accepted as painted.
- `m10r6-booking-retry-base`: same click-free route and wait, started at
  21:29:02 UTC, more than five minutes after base completion at 21:23:53 UTC
  on 2026-10-21. Retry: 291 control entries, 26 API calls, same prerequisite
  and same page error. It also fails the paint gate. No further capture ran.
- **STOP (plan rule 7):** refused telemetry POST count increased from 1 to 2.
  No successful non-GET request was captured. Even though the additional
  request was refused telemetry, the count increase invokes the strict stop
  rule; no rollback or further retry was attempted. CEO decision MEP-1043
  subsequently closed the blocker: documentation-only completion, explicit access
  gaps, no new R6 capture.

## Control inventory — base

All rows are **seen (`m10r6-booking-base`)**, with behaviour limited to the
resting image. Background controls are dimmed by the modal and were not tested.
The raw column gives one-based entry numbers in `controls.json`; paired custom
elements and anchors/buttons represent one visible control. `Contacts ref` is
`new` for settings navigation and booking controls; shared shell entries refer
to the Contacts shell inventory without claiming identical settings layout.

| # | Position | Control | Raw entries | Observed behaviour / limit | Owning module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- |
| CS-01 | Sidebar top | Back icon | 3 | Unnamed; not clicked | Shell | Contacts shell |
| CS-02 | Sidebar top | Setup Home | 4, 5 | Navigation drawn; not clicked | Shell | Contacts shell |
| CS-03 | Sidebar top | Setup editor icon | 6, 7 | Unnamed editor entry; not clicked | Settings | new |
| CS-04 | Sidebar top | Settings search | 8, 9 | Empty input; not typed | Settings | new |
| CS-05 | Sidebar | Frequently Used | 10, 11 | Expanded category; not toggled | Settings | new |
| CS-06 | Sidebar / Frequently Used | Profiles | 13, 14 | Navigation drawn; not clicked | Settings | new |
| CS-07 | Sidebar | General | 15, 16 | Expanded category; not toggled | Settings | new |
| CS-08 | Sidebar / General | Personal Settings | 18, 19 | Navigation drawn; not clicked | Settings | new |
| CS-09 | Sidebar / General | Users | 20, 21 | Navigation drawn; not clicked | Settings | new |
| CS-10 | Sidebar / General | Company Settings | 22, 23 | Navigation drawn; not clicked | Settings | new |
| CS-11 | Sidebar / General | Calendar Booking | 24, 25 | Current route; prerequisite dialog overlays content | M10 | new |
| CS-12 | Sidebar / General | Motivator | 26, 27 | Navigation drawn; not clicked | Settings | new |
| CS-13 | Sidebar / General | Agents | 28, 29 | Navigation drawn; not clicked | Settings | new |
| CS-14 | Sidebar | Security Control | 30, 31 | Expanded category; not toggled | Settings | new |
| CS-15 | Sidebar / Security | Profiles | 33, 34 | Navigation drawn; not clicked | Settings | new |
| CS-16 | Sidebar / Security | Roles and Sharing | 35, 36 | Navigation drawn; not clicked | Settings | new |
| CS-17 | Sidebar / Security | Mail add-on users | 37, 38 | Neutral label; navigation not clicked | Settings | new |
| CS-18 | Sidebar / Security | Compliance Settings | 39, 40 | Navigation drawn; not clicked | Settings | new |
| CS-19 | Sidebar / Security | Territory Management | 41, 42 | Navigation drawn; not clicked | Settings | new |
| CS-20 | Sidebar / Security | Trusted Domain | 43, 44 | Navigation drawn; not clicked | Settings | new |
| CS-21 | Sidebar / Security | Support Access | 45, 46 | Navigation drawn; not clicked | Settings | new |
| CS-22 | Sidebar / Security | Single Sign-On (SAML) | 47 | Entry drawn; not clicked | Settings | new |
| CS-23 | Sidebar / Security | Security Policies | 48 | Entry drawn; not clicked | Settings | new |
| CS-24 | Sidebar / Security | Directory integration | 49 | Entry drawn; not clicked | Settings | new |
| CS-25 | Sidebar / Security | Login History | 50 | Entry drawn; not clicked | Settings | new |
| CS-26 | Sidebar / Security | Audit Log | 51, 52 | Navigation drawn; not clicked | Settings | new |
| CS-27 | Top utility strip | Search records | 234 | Search surface; not typed | Shell | Contacts shell |
| CS-28 | Top utility strip | Quick-create icon | 235 | Unnamed; not clicked | Shell | Contacts shell |
| CS-29 | Top utility strip | Assistant | 237 | Neutral label; not clicked | Shell | Contacts shell |
| CS-30 | Top utility strip | Notifications | 238 | Not clicked | Shell | Contacts shell |
| CS-31 | Top utility strip | Calendar | 239 | Not clicked | M10 | new |
| CS-32 | Top utility strip | Marketplace | 242 | Not clicked | Settings | new |
| CS-33 | Top utility strip | Setup | 245 | Current area; not clicked | Settings | new |
| CS-34 | Top utility strip | Profile | 248, 249 | Not clicked | Shell | Contacts shell |
| CS-35 | Top utility strip | Applications menu | 252, 253, 254, 255 | One visible menu glyph; not clicked | Shell | Contacts shell |
| CS-36 | Prerequisite dialog / primary action | Configure Business Hours | 275, 276 | Not clicked: opens configuration flow | M10 | new |
| CS-37 | Prerequisite dialog / secondary action | Cancel | 277, 278 | Not clicked: no dismissal or workaround | M10 | new |

### Reconciliation

`controls.json` 291 → inventory 37 logical controls, represented by
64 raw entries; excluded 227 raw entries. The arithmetic is
64 + 227 = 291. Collapsing duplicate render elements accounts
for 27 entries; exclusion and deduplication are separate.

Excluded raw entries: 1, 2, 12, 17, 32, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 236, 240, 241, 243, 244, 246, 247, 250, 251, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291.

Reasons: noninteractive menu/category containers; category text and body
wrappers; navigation lying below the captured sidebar viewport; zero-area
routing anchors and dormant modal/popover placeholders; dialog wrapper,
heading and explanatory text. Extra accordion-body entries repeat existing
containers. No sidebar scroll or category expansion was performed. The visible
shell and utility strip are included above, even though the modal prevents
interaction. No out-of-viewport item is represented as a visible control.

## Retry delta inventory

| Capture | Inventory delta | Reconciliation | Contacts ref |
| --- | --- | --- | --- |
| `m10r6-booking-retry-base` | None: all 291 control entries are byte-for-byte equal after JSON parsing; screenshot shows the same prerequisite | 37 logical controls represented by 64 raw entries; 227 excluded with exactly the base mapping | CS-01–CS-37 retain the base references |

No new controls or valid booking-list state were observed. The retry does not
upgrade either failed paint gate to an accepted implementation reference.

## Actions, selectors and safety

Click list: **empty**. Offline selector-match tests: not applicable (zero
selectors); `DANGEROUS_TEXT` candidates: zero. No click was spent, skipped or
retried. No fields were filled. Configure Business Hours opens a configuration
flow and is outside this read-only run. Cancel was left untouched. Preferences,
view switches, provider connection, synchronization and public booking links
remain forbidden.

## Non-GET baseline audit

The base `network.json` contains **zero non-GET entries**. The capture tool
separately reports the following refused requests in `meta.json`:

| Refused request | Base count | Interpretation |
| --- | --- | --- |
| POST `/crm/<org>/ActivityReminder.do` (reminder polling) | 1 | Blocked by the tool; not retried manually |
| POST to telemetry service, path `/:id/telemetry/urlMonitor` | 1 | Blocked by the tool; hostname omitted |

Retry comparison: reminder polling remains 1; refused telemetry becomes 2.
Both `network.json` files contain zero non-GET entries. The increase is in
`meta.json.blockedRequests`; it is not hidden by the empty network baseline.
This is the stop condition reported to the CEO, not a claim that data changed.

These are the base path/count set, not successful writes or permission to
trigger them. Any additional non-GET path or count above this set invokes the
plan's stop rule. No request payloads, account identifiers or hostnames are
copied here. No popup, open request, print, download or file chooser was
reported by the base capture.

## Fields and metadata cross-check

The local `Events` field export gives:

| Field | Type | What it proves / does not prove |
| --- | --- | --- |
| `Venue` | text | Event location field, not organization working hours |
| `Meeting_Venue__s` | picklist | In-office, client-location and online venue categories |
| `Meeting_Provider__s` | picklist; exported options empty | Provider field exists; offered providers remain unknown |
| `Remind_At` | multireminder | Event reminder field; no evidence of calendar-wide defaults |
| `Remind_Participants` | multireminder | Participant reminder field; no evidence of default timing |

`CalendarBookings__s` has no field export. Do not infer booking-page fields,
calendar sync providers, directions, defaults, hours or validation from Events.

## Filters, views, flows and states

The only observed booking state is the missing-business-hours prerequisite.
The list, its filters, sorting/search, create/edit form, empty state and error
handling remain unobserved. Working-hours configuration and booking creation
are writes; neither was attempted. Synchronization setup and meeting-provider
connections are also writes. See the R6 section in
[the write-only register](../module-10-write-only-flows.md).

## Documentation-only completion — CEO decision MEP-1043

Decision dated 2026-10-21: complete R6 from existing offline evidence and public
documentation, retain access gaps, then submit to UI Lead. No new capture,
reference click, browser/session intervention or configuration is authorized.

### Offline navigation audit

Existing `m6-setup/controls.json` was scanned by accessible name only. Calendar
(raw entry 8) is a named utility entry, not a settings link. Calendar Booking
(entries 39–40, one logical link) points to the already-probed internal booking
route. Activity Reminders (entry 258) is a utility button, not evidence of a
default-reminder settings route. No named direct link containing synchronization,
business hours or meeting-provider settings was found in this file. This is a
file-level search result, not proof that such routes do not exist. No links were
followed. The captured Company Settings navigation in CS-10 is a possible parent,
not a verified business-hours destination. No URL or selector was invented.

### Public source register

First-party pages read on 2026-10-22 (local date). Locators omit vendor hostnames
and product names deliberately. They identify public documentation, never a
reference-session endpoint. No API was called and no documentation image was
copied. Source IDs below are independent of the capture inventory.

| ID | Public locator / section |
| --- | --- |
| D1 | Help topic Calendar Management; `/portal/en/kb/crm/organization-settings/calendar-management/articles/manage-calendar`; Set Calendar Preferences |
| D2 | Help topic FAQs on Calendar Booking; `/portal/en/kb/crm/faqs/activity-management/articles/faqs-on-calendar-booking`; booking types, permissions, participant reminders, deactivation |
| D3 | Help topic Using Calendar Synchronization via CalDAV; `/portal/en/kb/crm/organization-settings/calendar-management/articles/use-calendar-synchronization-via-caldav`; introductory synchronization description and initial-sync note |
| D4 | Developer reference Get Calendar Preferences; `/crm/developer/docs/api/v8/get-calendar-preferences.html`; meeting preferences and reminders descriptions |
| D5 | Help topic FAQs on Business Hours; questions 1 (custom hours), 3 (hours versus shifts), 11 (shift outside organization hours); topic locator only because the published path includes a prohibited product name |

### Documented scope and access gaps

Every row is **documented, not observed** unless marked **access gap**.
Documented controls are not added to the seen CS inventory.

| # | Area / control or behaviour | Source | Finding and limit | Contacts ref |
| --- | --- | --- | --- | --- |
| CD-01 | Calendar preferences entry and sections | D1 | Options > Preferences; activity selection, CalDAV, unavailability, color coding, reminders and notifications. Personal preferences, saved with Done. No layout or current values verified. | new |
| CD-02 | Personal working hours | D1 | Week start, day start/end and two weekly holidays; distinct from organization hours. No current schedule or complete time-option set verified. | new |
| CD-03 | Organization business hours | D5 | Setup > General > Company Settings > Business hours; presets or custom hours, week start and same/different daily hours. Shifts define user schedules; out-of-range shifts prevent saving changed organization hours. Exact validation copy unknown. | new |
| CD-04 | Default reminders | D1, D2 | Intervals for meetings, appointments and all-day meetings; email reminder switch and assignment notifications. New event reminders inherit host preferences. Full interval choices and actual defaults remain gaps. | new |
| CD-05 | Synchronization options | D1, D3 | CalDAV access and cross-product unavailability synchronization are documented; other services use marketplace management. CalDAV supports two-way meetings with iOS. This does not establish general provider conflict/deletion rules or session configuration. | new |
| CD-06 | Booking administration | D2 | Individual/user and team bookings, permission-dependent access, a More menu with Edit, participant reminder interval/custom value, and activation control are documented. Exact columns, filters, pagination and blank/error screens remain access gaps. | new |
| CD-07 | Meeting providers | D4, local Events metadata | API reference describes a meeting-service configuration collection; metadata has no provider options. Documentation reviewed does not establish an exhaustive offered-provider set for this session. **Access gap**: no provider list inferred from a sample or notification channels. | new |
| CD-08 | Missing-hours prerequisite | Existing captures only | Observed prerequisite retained despite failed paint gates. No reviewed public source settles its dismissal, validation or post-configuration routing. Those remain **access gaps**. | new |

D1 and D2 differ in calendar activity coverage: D1 allows activity selection
including tasks/appointments, while D2's older calendar FAQ says only calls and
meetings appear. This R6 settings pass does not resolve edition/version
differences or override the calendar-view spec. CalDAV initial-sync limits in D3
do not establish the behaviour of other providers; no universal sync limit is
adopted. Provider configuration in D4 is separate from reminder delivery channels.

### Implementation boundary and gate questions

Under the CEO decision, implementation issues reproduce the observed prerequisite
dialogue. Settings and booking administration use documented behaviour and
existing Module 1–9 components. This does not certify unobserved layouts.
The Module 10 gate summary must explicitly list:

1. Booking-list columns, status presentation, filters/search/sort, pagination,
   empty/error states and the post-business-hours route remain unobserved.
2. Full working-hours/reminder option sets, current defaults and exact validation
   messages are not established by the reviewed sources.
3. Meeting-provider choices, integration availability in this session, sync
   conflict/recurrence/deletion semantics and provider-specific setup errors remain
   gaps. CalDAV documentation cannot settle every provider.
4. The two failed paint gates remain failures; documentation does not repair them.

These are accepted research limits for UI Lead review, not requests to configure
the reference CRM. Business-hours configuration, reminder changes, connection,
synchronization, booking activation/edit/publish and public reservations remain
forbidden. No additional task or live probe is required by MEP-1043.

## Verification and handoff limits

- Merged the available `origin/main` before handoff.
- `git diff --check` passed; neutral-language/privacy scan passed for both
  changed documents; sequential inventory IDs and raw-entry reconciliation
  were checked against both local capture files.
- `research/specs/verify.mjs` does not exist. Documentation-only change: no
  application, browser-test, build or full-suite run was performed.
- Screenshots and raw captures remain local only; the neutral spec is uploaded
  as the issue artifact. Research completion retains the access gaps above;
  it does not establish visual parity for unobserved screens.
- CEO continuation steps 1–5 are applied: retry result retained, offline links
  audited, public sources recorded, implementation boundary stated, write-only
  register aligned. UI Lead is the spec approver; MEP-1043 is resolved.
