# Calendar — default view and documented alternatives

## Purpose and evidence boundary

M10-R4 (MEP-1013) inventories the calendar without changing any reference CRM
record or preference. Only direct navigation to the observed calendar pathname
was used, without date, view-type or calendar-selection query overrides.
The initial screenshot shows Day selected. Both captures initially failed the
strict paint gate because of `$L(...).sortable is not a function`.
CEO decision MEP-1042 (2026-10-22) accepts this known application-wide baseline
error and explicitly authorizes offline completion for UI Lead review. The
rendered Day inventory is therefore submitted for review; it does not establish
Week/Month layouts or event-tile behaviour. Known blocked telemetry count growth
is logged under rule 7's path-only exception, not treated as a stop.
No third capture, click or browser intervention was performed.

This disposition supersedes the provisional R4 wording in section 9 of
[module-10-write-only-flows.md](../module-10-write-only-flows.md); its write
restrictions and W5/W6/W10/W17 gaps remain applicable.

## Layout

The outer rail is minimized. A Calendar sidebar contains search, two system
calendar entries and a mini-calendar below. My Calendar is selected. The main
region has its calendar heading, a Day/Week/Month selector, Create and Options,
then a date strip with a picker and previous/next controls. The day schedule
contains an overdue summary, an empty all-day band and a time axis/grid. No
ordinary event tile is visible. A hatched time band is visible; its meaning is
not established. The current-time label is present in extracted text but the
line is not conclusively visible in the screenshot. The utility strip persists.
No Today control is painted. Mini-calendar date cells include adjacent-month
days and a marked selected date. No measurements or design tokens are inferred.

## Control inventory — m10r4-calendar-base

Source for every row: seen (m10r4-calendar-base), accepted for offline completion
under MEP-1042; UI Lead review pending.
Raw indices are 1-based positions in controls.json. Nested entries representing
one painted control share one row. Contacts refs refer to contacts.md; they do
not imply calendar behaviour was exercised. Static labels are marked explicitly.

| # | Region | Control | Position | Observed behaviour | Source | Owner | Contacts ref | Raw indices |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| C-001 | Rail | Menu navigation region | outer rail | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-01 | 1 |
| C-002 | Rail | Product/home icon | top | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-02 | 2, 3 |
| C-003 | Rail | Show Menu | top, disclosure | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-03 | 4 |
| C-004 | Rail | Home | stacked navigation | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-04 | 5, 6, 7 |
| C-005 | Rail | Workqueue | stacked navigation | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | new | 8, 9, 10 |
| C-006 | Rail | Reports | stacked navigation | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-08 | 11, 12, 13 |
| C-007 | Rail | Analytics | stacked navigation | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-09 | 14, 15, 16 |
| C-008 | Rail | Agents | stacked navigation | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | new | 17, 18, 19 |
| C-009 | Rail | MCP | stacked navigation | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | new | 20, 21, 22 |
| C-010 | Rail | Teamspace shortcut | below navigation | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | new | 23, 24, 25 |
| C-011 | Sidebar | More | header edge | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 27 |
| C-012 | Sidebar | Hide Menu | header edge | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 28 |
| C-013 | Sidebar | Search | under Calendar heading | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 29, 30 |
| C-014 | Sidebar | My Calendar | first calendar; selected | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 33, 34, 35 |
| C-015 | Sidebar | All Users | second calendar | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 36, 37, 38 |
| C-016 | Mini-calendar | Previous Month | month header left | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 47 |
| C-017 | Mini-calendar | Next Month | month header right | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 48 |
| C-018 | Mini-calendar | Monday | weekday header | static weekday label; no interaction tested | seen (m10r4-calendar-base) | M10 | new | 51 |
| C-019 | Mini-calendar | Tuesday | weekday header | static weekday label; no interaction tested | seen (m10r4-calendar-base) | M10 | new | 52 |
| C-020 | Mini-calendar | Wednesday | weekday header | static weekday label; no interaction tested | seen (m10r4-calendar-base) | M10 | new | 53 |
| C-021 | Mini-calendar | Thursday | weekday header | static weekday label; no interaction tested | seen (m10r4-calendar-base) | M10 | new | 54 |
| C-022 | Mini-calendar | Friday | weekday header | static weekday label; no interaction tested | seen (m10r4-calendar-base) | M10 | new | 55 |
| C-023 | Mini-calendar | Saturday | weekday header | static weekday label; no interaction tested | seen (m10r4-calendar-base) | M10 | new | 56 |
| C-024 | Mini-calendar | Sunday | weekday header | static weekday label; no interaction tested | seen (m10r4-calendar-base) | M10 | new | 57 |
| C-025 | Mini-calendar | Date cell 28 | chronological grid; cell 1 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 59 |
| C-026 | Mini-calendar | Date cell 29 | chronological grid; cell 2 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 60 |
| C-027 | Mini-calendar | Date cell 30 | chronological grid; cell 3 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 61 |
| C-028 | Mini-calendar | Date cell 1 | chronological grid; cell 4 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 62 |
| C-029 | Mini-calendar | Date cell 2 | chronological grid; cell 5 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 63 |
| C-030 | Mini-calendar | Date cell 3 | chronological grid; cell 6 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 64 |
| C-031 | Mini-calendar | Date cell 4 | chronological grid; cell 7 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 65 |
| C-032 | Mini-calendar | Date cell 5 | chronological grid; cell 8 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 67 |
| C-033 | Mini-calendar | Date cell 6 | chronological grid; cell 9 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 68 |
| C-034 | Mini-calendar | Date cell 7 | chronological grid; cell 10 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 69 |
| C-035 | Mini-calendar | Date cell 8 | chronological grid; cell 11 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 70 |
| C-036 | Mini-calendar | Date cell 9 | chronological grid; cell 12 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 71 |
| C-037 | Mini-calendar | Date cell 10 | chronological grid; cell 13 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 72 |
| C-038 | Mini-calendar | Date cell 11 | chronological grid; cell 14 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 73 |
| C-039 | Mini-calendar | Date cell 12 | chronological grid; cell 15 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 75 |
| C-040 | Mini-calendar | Date cell 13 | chronological grid; cell 16 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 76 |
| C-041 | Mini-calendar | Date cell 14 | chronological grid; cell 17 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 77 |
| C-042 | Mini-calendar | Date cell 15 | chronological grid; cell 18 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 78 |
| C-043 | Mini-calendar | Date cell 16 | chronological grid; cell 19 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 79 |
| C-044 | Mini-calendar | Date cell 17 | chronological grid; cell 20 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 80 |
| C-045 | Mini-calendar | Date cell 18 | chronological grid; cell 21 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 81 |
| C-046 | Mini-calendar | Date cell 19 | chronological grid; cell 22 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 83 |
| C-047 | Mini-calendar | Date cell 20 | chronological grid; cell 23 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 84 |
| C-048 | Mini-calendar | Date cell 21 | chronological grid; cell 24 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 85 |
| C-049 | Mini-calendar | Date cell 22 | chronological grid; cell 25 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 86 |
| C-050 | Mini-calendar | Date cell 23 | chronological grid; cell 26 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 87 |
| C-051 | Mini-calendar | Date cell 24 | chronological grid; cell 27 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 88 |
| C-052 | Mini-calendar | Date cell 25 | chronological grid; cell 28 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 89 |
| C-053 | Mini-calendar | Date cell 26 | chronological grid; cell 29 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 91 |
| C-054 | Mini-calendar | Date cell 27 | chronological grid; cell 30 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 92 |
| C-055 | Mini-calendar | Date cell 28 | chronological grid; cell 31 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 93 |
| C-056 | Mini-calendar | Date cell 29 | chronological grid; cell 32 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 94 |
| C-057 | Mini-calendar | Date cell 30 | chronological grid; cell 33 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 95 |
| C-058 | Mini-calendar | Date cell 31 | chronological grid; cell 34 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 96 |
| C-059 | Mini-calendar | Date cell 1 | chronological grid; cell 35 | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 97 |
| C-060 | Sidebar | Resize handle | sidebar boundary | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 98 |
| C-061 | Top bar | Search records | first | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-26 | 100 |
| C-062 | Top bar | Plus icon | after search | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-27 | 101 |
| C-063 | Top bar | Assistant shortcut | after plus | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-28 | 103 |
| C-064 | Top bar | Notifications | after assistant | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-29 | 104 |
| C-065 | Top bar | Calendar | active shortcut | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | SH-30 | 105, 106, 107 |
| C-066 | Top bar | Marketplace | after calendar | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-31 | 108, 109, 110 |
| C-067 | Top bar | Setup | after marketplace | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M11 | SH-32 | 111, 112, 113 |
| C-068 | Top bar | Profile | after setup | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-33 | 114, 115 |
| C-069 | Top bar | Applications menu | far right | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-34 | 118, 119 |
| C-070 | Toolbar | Create dropdown | right | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 122, 123 |
| C-071 | Toolbar | Options dropdown | after Create | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 124, 125 |
| C-072 | Toolbar | My Calendar heading | left | static current-calendar label | seen (m10r4-calendar-base) | M10 | new | 129 |
| C-073 | Toolbar | Day | view selector; selected | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 132, 133 |
| C-074 | Toolbar | Week | view selector; inactive | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 134, 135 |
| C-075 | Toolbar | Month | view selector; inactive | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 136, 137 |
| C-076 | Date strip | Contextual date picker icon | before date | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 138 |
| C-077 | Date strip | Selected date and weekday | after date picker | static date label | seen (m10r4-calendar-base) | M10 | new | 139 |
| C-078 | Date strip | Previous day | right | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 140 |
| C-079 | Date strip | Next day | far right | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 141 |
| C-080 | Schedule | Overdue Activities summary | above all-day row | not clicked; behaviour not observed | seen (m10r4-calendar-base) | M10 | new | 142, 143, 144 |
| C-081 | Utility strip | My Pins | bottom strip | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-35 | 172 |
| C-082 | Utility strip | Chats | bottom strip | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-36 | 173 |
| C-083 | Utility strip | Contacts | bottom strip | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-37 | 174 |
| C-084 | Utility strip | Document with clock icon | bottom strip | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-38 | 175 |
| C-085 | Utility strip | Announcements | bottom strip | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-39 | 176 |
| C-086 | Utility strip | Motivator | bottom strip | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-40 | 177 |
| C-087 | Utility strip | Sticky Notes | bottom strip | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-41 | 178 |
| C-088 | Utility strip | Activity Reminders | bottom strip | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-42 | 179 |
| C-089 | Utility strip | Recent Items | bottom strip | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-43 | 180 |
| C-090 | Utility strip | Accessibility | bottom strip | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-44 | 181 |
| C-091 | Utility strip | Help | bottom strip | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-45 | 182 |
| C-092 | Utility strip | Live chat widget | bottom strip | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | new | 183 |
| C-093 | Sidebar | Calendar list scroll region | calendar navigation | scroll not operated | seen (m10r4-calendar-base) | M10 | new | 184 |
| C-094 | Schedule | Time-grid scroll region | main body | scroll not operated | seen (m10r4-calendar-base) | M10 | new | 185, 186, 187, 188 |
| C-095 | Schedule | All-Day summary | above time grid | image-only; zero displayed; not clicked | seen (m10r4-calendar-base) | M10 | new | image-only |
| C-096 | Utility strip | Recycle bin icon | far right | not clicked; behaviour not observed | seen (m10r4-calendar-base) | Shared shell | SH-46 | image-only |

### Reconciliation

- controls.json: 188 entries; represented raw entries: 132.
- Inventory: 96 logical rows, including two image-only supplements.
- Excluded raw entries (56): 26, 31, 32, 39, 40, 41, 42, 43, 44, 45, 46, 49, 50, 58, 66, 74, 82, 90, 99, 102, 116, 117, 120, 121, 126, 127, 128, 130, 131, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171.
- Exclusions are structural navigation/list/group/row wrappers, presentation
  SVGs, a title hook with no painted control, and closed dialog/popover/notification
  hosts. Their DOM presence does not prove an open dialog. No customer field or
  event content was copied.

## Fields

The viewed calendar has no editable form opened. Meeting data is owned by the
Events metadata and existing Activities specs: title, start/end, all-day state,
recurrence, reminder, participants and related record. Calendar display also
needs current calendar/view/date, activity type, overdue count and access scope.
This is a structural dependency list, not a new schema or request contract.

## Actions, filters and flows

Click list: `[]` (base and retry). No selector was scheduled or executed. Offline unique-selector
tests and DANGEROUS_TEXT checks therefore have zero candidates and zero passes;
they are not evidence that any visible action is safe. The guard source was read.

Never operated: Day/Week/Month, previous/next day/month, date cells/picker,
calendar selectors, search, sidebar show/hide/resize, Create, Options, overdue
summary, grid slots, event hover/click, drag/resize, user/group management,
sharing, booking, sync, import/export, RSVP and all shell/utility actions.
No empty slot is clicked. No screenshot is a whole-account empty-state proof.
No loading, validation, success, permission-error or server-error state is
verified. A failed paint is a research failure, not a product error-state spec.

## Documented views (not live-observed)

D1 documents day/week/month schedules, an all-day area above day/week schedules,
activity-type icons and purpose-based categories. Day concerns one date, Week
a weekly schedule and Month a month overview. Activity tiles may truncate a
title; a documented hover exposes title/time, and click opens details. No tile
was hovered or opened here. Mini-calendar navigation, working-hours display and
a current-time indicator are documented. These statements establish capability,
not this account's configuration, tile contents, exact weekly/monthly layout
or preference persistence.

D2 documents account-specific preferences for visible activity types, working
days/hours, week start and week-number display. They can change what a weekly
schedule includes; the capture does not establish organization defaults.

| Source | Locator (public help; hostname omitted) | Checked | Limit |
| --- | --- | --- | --- |
| D2 | /portal/en/kb/crm/organization-settings/calendar-management/articles/manage-calendar — calendar preferences | 2026-10-22 | Account preferences; no live settings inspected |
| D1 | /portal/en/kb/crm/organization-settings/calendar-management/articles/using-calendar — calendar components and meeting management | 2026-10-22 | Public documented behaviour only; no asset copied |

## Capture refs and request safety

- m10r4-calendar-base: click-free, --wait 25000; 48 API groups, 188 controls.
- Calendar heading present; no ordinary event link because range reads returned
  204. Diagnostics include pageerror: $L(...).sortable is not a function.
  Initially failed the strict paint gate; MEP-1042 accepts this message as an
  application-wide baseline. The CEO confirmed the other gate conditions pass:
  rendered heading/grid, 188 controls, 48 API groups, and no activity-link
  requirement for the empty range.
- Event-range reads are GET /crm/v9/__calendar_activities (four request groups,
  one call each, 204). No payload shapes are specified.

Initial non-GET baseline (hostnames and variable identifiers removed):

| Method | Neutral path | Count | Disposition |
| --- | --- | --- | --- |
| POST | /crm/v9/coql | 1 | 200; page-load query |
| POST | /visitor/v2/<service>/<region>/livevisitors/<id>/triggers | 1 | 200; shell trigger |
| POST | /crm/<org>/ActivityReminder.do | 1 | blocked; reminder poll |
| POST | /crm/<org>/crminotification.do | 1 | blocked; notification poll |
| POST | /<telemetry-service>/<id>/telemetry/urlMonitor | 1 | blocked; telemetry |
| POST | /<telemetry-service>/<id>/ingest/exceptions | 1 | blocked; telemetry |
| POST | /<telemetry-service>/<id>/telemetry/logs | 1 | blocked; telemetry |

The five blockedRequests were refused by the tool, not retried as individual
requests. A permitted click-free paint retry is compared to this path/count
baseline. No event creation, edit, sync or preference write was requested.

## Open questions

1. Resolved by MEP-1042: existing Day evidence is accepted for offline completion
   with the known baseline error; no new capture is authorized.
2. Week/Month layout remains documented only. The existing board interaction
   `8ab91a66-b656-4bdd-9016-437bd1d6f88f` on MEP-1013 is pending, including
   the event-tile gap. No answer or view-switch permission is inferred. This
   open question is retained while the CEO-authorized spec goes to UI Lead.
3. Event tile title/duration/category shape, overlap, recurrence indicators,
   overflow and permissions are unobserved with this empty range.
4. Meaning of the hatched band and current-time marker placement is unresolved.
5. Is date navigation persisted? It was not tested.

Write-required behaviours stay in module-10-write-only-flows.md (W5, W6, W10,
W17); no write is needed or attempted to resolve this inventory.

## Verification

research/specs/verify.mjs is absent. Documentation-only checks cover unique
inventory IDs, complete 1-based raw-control reconciliation, relative links,
required sections and git diff --check. No application code is changed; no
application tests, biome, typecheck or full verify is run.

## Retry delta — m10r4-calendar-retry-base

Click-free retry began at 2026-10-21 21:12:59 UTC, more than five minutes after
base meta at 21:07:46 UTC; retry meta is 21:13:52 UTC. It again has 48 API
groups and 188 controls. The same pageerror originally failed the gate; MEP-1042 subsequently accepts
it as an application-wide baseline, without requiring an earlier calendar
capture. That decision is the acceptance basis, not this capture itself.
There are no new logical controls and no label/type changes across raw indices.
The same 132 represented raw entries map to 96 C rows, with 56 excluded.
Shell inventory is not repeated.

| Row ref | Region | Difference | Source | Owner | Contacts ref |
| --- | --- | --- | --- | --- | --- |
| C-094 | Schedule scroll region | Initial hatched time band is absent; visible grid starts slightly earlier. No scroll action performed; cause unknown. | seen (m10r4-calendar-retry-base) | M10 | new |
| C-094 | Schedule | Hour grid and empty range remain visible, with no ordinary activity tiles; current-time label changes with clock. | seen (m10r4-calendar-retry-base) | M10 | new |

### Stop-rule comparison

Allowed non-GET paths and counts remain /crm/v9/coql = 1 and the neutral visitor
trigger path = 1. Four calendar activity GET groups remain 204. The reminder,
notification, exception telemetry and log telemetry blocked paths each remain
one. Blocked urlMonitor telemetry increases from one to two. The earlier DUR interpretation was corrected by the CEO in MEP-1042: rule 7
compares only the path for known blocked telemetry/polls. No new path appeared;
this count increase does not trigger DUR. Total blockedRequests: base 5, retry 6. No blocked request was
manually replayed; no click was executed. No claim of a reference write is made.

No further capture or preference operation is authorized by this document. The
Week/Month documentation limit and existing pending board card remain open.
No duplicate interaction is created and no board answer is presumed.

## R9 — documentation-based answers (MEP-1302)

Checked 2026-10-24 using public first-party CRM help only. No capture, view
switch, date navigation, hover, event mutation or preference change. All CD
items are proposals **documented, not observed**, submitted to UI Lead. This
addendum does not answer, replace or resolve the board interaction on MEP-1013.
Earlier Day evidence and retry reconciliation remain unchanged.

### Public source register

Neutral titles and knowledge-base breadcrumbs omit product names and hosts.
Both articles were read; separate standalone calendar-product documentation
and third-party copies were excluded because they do not establish CRM UI.

| Ref | Neutral page title / topic locator | Sections used |
| --- | --- | --- |
| C-D1 | CRM › Organization settings › Calendar management › Using Calendar | Components; UI elements; Controls; Managing meetings; Other Users' Calendar |
| C-D2 | CRM › Organization settings › Calendar management › Managing Calendar | Set Calendar Preferences |

### Question dispositions and implementation consequences

| Original question | Verdict | Documentation answer / remaining gap | Implementation consequence |
| --- | --- | --- | --- |
| 2 — Week/Month layout | Partly answered | C-D1 documents Day/Week/Month, top all-day activities in Day/Week and optional week numbers. C-D2 allows all days or exclusion of closed days, and a chosen week start. Exact geometry remains unknown. | CD01: support documented ranges and all-day separation; retain visual parity and the existing board card as open. Do not assert a universal seven-day work week. |
| 3 — Event tile shape/overlap/recurrence | Partly answered | C-D1 describes purpose colors, activity icons, shortened names and full title/time on hover; recurrence is supported. No overlap algorithm, overflow rule, recurrence glyph, dimensions or duration-to-height formula is specified. | CD02/CD03: preserve readable titles/time and distinguish activity types. Collision handling, truncation thresholds and recurrence badges remain implementation proposals, requiring review rather than a claim of reference parity. |
| 4 — Hatched band/current-time marker | Partly answered | C-D1 identifies working-hours display, a current-time indicator and a patterned tile for cursor position. It does not identify the captured band conclusively or specify marker geometry/update cadence. | CD04: keep cursor, working hours and clock concepts distinct; never label the observed hatch as unavailable time solely from its texture. |
| 5 — Date-navigation persistence | Still open | C-D1 documents mini-calendar and range arrows. C-D2 documents saved preferences, but neither says whether the selected date survives reload, navigation away or a new session. | CD05: support range navigation; do not infer persistent date state or a settings write. Any local persistence policy must be labelled an implementation decision. |

### Proposed capability items — documented, not observed

| # | Proposal / source | Unresolved boundary |
| --- | --- | --- |
| CD01 | Day/Week/Month and all-day placement (C-D1); work-week preferences (C-D2) | Month cell structure, adjacent dates, responsive geometry and populated layouts are unobserved. |
| CD02 | Activity icon, purpose color, shortened title with hover information (C-D1) | No copied icons/assets or inferred color tokens; overlap and overflow remain open. |
| CD03 | Recurrence capability (C-D1); calendar visibility follows authorization (C-D1, Other Users' Calendar) | Recurrence tile decoration and precise permission-filtered tile rendering are unobserved; do not grant visibility from this functional summary. |
| CD04 | Current-time, working-hours and cursor indicators (C-D1) | Relationship to C-094's changing hatch remains unproved; no exact position, color or refresh contract. |
| CD05 | Mini-calendar/range navigation (C-D1) | Date/view persistence and restoration remain undocumented; no reference preference changed. |

### R9 verification and gate handoff

CD01–CD05 are a functional inventory, not evidence of completed implementation.
Retain Week/Month visual review, tile collision/overflow/recurrence decoration,
hatch identification, marker geometry and date persistence at the Module 10
gate. W5/W6/W10/W17 remain untested. No further live investigation is authorized.
Checks cover questions 2–5, unique CD IDs, source references, relative links,
`git diff --check` and the forbidden-term hook. No application test is run for
this Markdown-only update.
