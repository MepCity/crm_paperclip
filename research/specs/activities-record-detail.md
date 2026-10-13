# Activities — record detail

Status: Tasks image inventory ready for Grok QA review and UI Lead approval; closing list verified. Meetings and Calls will add differences in a later task. No write action or persistent preference was exercised.

## Purpose

Describe the visible Tasks detail and its differences from [accounts-record-detail.md](accounts-record-detail.md). Shared record behaviour remains in [record-detail.md](record-detail.md); exported fields and related lists remain in [activities.md](activities.md). Closing, reminders and recurrence use [activities-flows.md](activities-flows.md) › Task flows. Record values and identities are omitted.

## Layout

Tasks opens as a full record page within the shared shell, rather than a modal. The header has Back, a static task glyph and subject, Add Tags below, then Close Task, Edit, More Options, Previous Record and Next Record. There is no portrait control or Related List rail. Overview/Timeline occupy the left of the main tab row; Last Update is at its right. A separate right panel begins alongside this row.

Overview has a single-column business card: Priority, Due Date, Status, Related To, Task Owner. Values are plain text except the relation link. Dates use `DD.MM.YYYY`; the relation shows a linked record label followed by an unlinked module suffix. Priority and Status have no coloured badge or completion checkbox in this image. Value regions expose button roles in controls.json, but no editor or hover pencil was opened.

Hide Details heads the expanded Task Information card. The visible fields, in order, are Task Owner, Subject, Due Date, Contact Name and Related To (at the bottom boundary). Contact Name is a link; Related To is a link plus module suffix. Lower fields, Description Information, Notes, Attachments, Checklists and Locking Information are outside the screenshot. Their offscreen DOM does not establish appearance.

The right panel has a related-person selector, Info (selected) and Conversations. Info shows a static person portrait, a contact link and Contact badge, Send Email, an account link, email link, phone/mobile text with two call icons, More Info, Deal Summary with + New and a deal link, then Open Activities with + New and collapsed Tasks/Meetings/Calls rows carrying counts and down chevrons. Deal amount, stage and closing date are static record data. The three rows were not expanded because persisted collapse preferences are forbidden.

## Control inventory (Tasks)

Refs prefer Accounts, then Deals, then Contacts. `same` preserves the cited observation limits. Repeated wrappers map to one control. Static field labels, record values and glyphs are not separate controls. Visible value regions with button roles are included with `not observed` behaviour; this does not assert an observed editing flow.

### Control inventory — m5d-tasks-list-base

Shell: SH-01–SH-46 as in contacts.md; SH-20 Tasks is active, SH-08 is shortened to MCP. No new shell control. The image matches activities.md › m5-tasks-list-base; incidental row actions remain unpainted.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

Rest: as in m5-tasks-list-base in activities.md; covered by the overlay: none. TL-42 opens the selected open Task in m5d-task-main. Total records: 12. The interrupted run's earlier loading-only image is superseded by this continuation's painted baseline.

### Control inventory — m5d-task-main

Shell: SH-01–SH-46 as in contacts.md; Tasks is active and MCP is shortened. The whole shell, right panel, lower utility strip and corners were inspected. SH-46 is screenshot-only. No additional painted shell control.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TD-01 | Header | Back | icon button | leftmost | same | seen (m5d-task-main) | M5 | AD-01 |
| TD-04 | Header | Add Tags | button | below subject | same | seen (m5d-task-main) | M6 | AD-04 |
| TD-05 | Header | Close Task | button | right actions, first | not observed; Task flows documents completion | seen (m5d-task-main) | M5 | new |
| TD-06 | Header | Edit | button | right actions, second | same | seen (m5d-task-main) | M5 | AD-06 |
| TD-07 | Header | More Options / three dots | icon button | right actions, third | Opens action menu | seen (m5d-task-main) | M5 | AD-07 |
| TD-08 | Header | Previous Record | icon button | after More Options | same | seen (m5d-task-main) | M5 | AD-08 |
| TD-09 | Header | Next Record | icon button | far right | same | seen (m5d-task-main) | M5 | AD-09 |
| TD-33 | Tab row | Overview | tab | left, first, selected | same | seen (m5d-task-main) | M5 | AD-33 moved |
| TD-34 | Tab row | Timeline | tab | left, second | Opens Timeline | seen (m5d-task-main) | M5 | AD-34 moved |
| TD-35 | Tab row | Last Update indicator | badge | main column, far right | same | seen (m5d-task-main) | M5 | AD-35 |
| TD-36 | Business card | Priority value region | button | field 1, after label | not observed | seen (m5d-task-main) | M5 | new |
| TD-37 | Business card | Due Date value region | button | field 2, after label | not observed | seen (m5d-task-main) | M5 | new |
| TD-38 | Business card | Status value region | button | field 3, after label | not observed | seen (m5d-task-main) | M5 | new |
| TD-39 | Business card | Related To record link | link | field 4, before module suffix | not observed | seen (m5d-task-main) | M4 | new |
| TD-40 | Business card | Task Owner value region | button | field 5, after label | not observed | seen (m5d-task-main) | M5 | new |
| TD-41 | Details card | Hide Details | button | card header, left | same | seen (m5d-task-main) | M5 | AD-38 |
| TD-42 | Details card | Task Owner value region | button | Task Information, field 1 | not observed | seen (m5d-task-main) | M5 | new |
| TD-43 | Details card | Subject value region | button | Task Information, field 2 | not observed | seen (m5d-task-main) | M5 | new |
| TD-44 | Details card | Due Date value region | button | Task Information, field 3 | not observed | seen (m5d-task-main) | M5 | new |
| TD-45 | Details card | Contact Name record link | link | Task Information, field 4 | not observed | seen (m5d-task-main) | M2 | new |
| TD-46 | Details card | Related To record link | link | Task Information, field 5, partly at bottom edge | not observed | seen (m5d-task-main) | M4 | new |
| TD-50 | Right panel | Related-person selector / down arrow | select | panel top | not observed | seen (m5d-task-main) | M5 | new |
| TD-51 | Right panel | Info | tab | below selector, first, selected | not observed | seen (m5d-task-main) | M5 | new |
| TD-52 | Right panel | Conversations | tab | below selector, second | not observed | seen (m5d-task-main) | M10 | new |
| TD-54 | Right panel | Contact record link | link | person summary, beside portrait | same | seen (m5d-task-main) | M2 | AD-103 moved |
| TD-55 | Right panel | Send Email | button | person summary, below contact link | same | seen (m5d-task-main) | M10 | AD-05 moved |
| TD-56 | Right panel | Account record link | link | person summary, after Send Email | not observed | seen (m5d-task-main) | M3 | new |
| TD-57 | Right panel | Email link | link | after account link | same | seen (m5d-task-main) | M10 | AD-104 moved |
| TD-58 | Right panel | Phone call icon | icon button | after phone display | same | seen (m5d-task-main) | M5 | AD-129 moved |
| TD-59 | Right panel | Phone call icon | icon button | after mobile display | same | seen (m5d-task-main) | M5 | AD-129 moved |
| TD-60 | Right panel | More Info | link | person summary, bottom right | not observed | seen (m5d-task-main) | M2 | new |
| TD-61 | Right panel | + New | button | Deal Summary heading, right | not observed | seen (m5d-task-main) | M4 | new |
| TD-62 | Right panel | Deal record link | link | Deal Summary body | not observed | seen (m5d-task-main) | M4 | new |
| TD-63 | Right panel | + New | button | Open Activities heading, right | not observed | seen (m5d-task-main) | M5 | new |
| TD-64 | Right panel | Tasks / down chevron | toggle | Open Activities, row 1 | not observed | seen (m5d-task-main) | M5 | new |
| TD-65 | Right panel | Tasks count | badge | row 1, after Tasks | not observed | seen (m5d-task-main) | M5 | new |
| TD-66 | Right panel | Meetings / down chevron | toggle | Open Activities, row 2 | not observed | seen (m5d-task-main) | M5 | new |
| TD-67 | Right panel | Meetings count | badge | row 2, after Meetings | not observed | seen (m5d-task-main) | M5 | new |
| TD-68 | Right panel | Calls / down chevron | toggle | Open Activities, row 3 | not observed | seen (m5d-task-main) | M5 | new |
| TD-69 | Right panel | Calls count | badge | row 3, after Calls | not observed | seen (m5d-task-main) | M5 | new |
| TD-70 | Right panel | Contact | badge | person summary, to right of contact link | not observed | seen (m5d-task-main) | M2 | new |

Absent here: AD-02, AD-05 at its header position, AD-99, all related-list rail entries/actions/counters (AD-10–AD-31, AD-96–AD-98, AD-101–AD-102), AD-32, business/detail phone actions AD-37/AD-41 and website AD-100. There is no visible header Mark as Completed or completion checkbox. This records the observed page, not module-wide absence.

### Control inventory — m5d-task-more

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TD-07.1 | More Options menu | Clone | menu item | row 1 | same | seen (m5d-task-more) | M5 | AD-07.1 |
| TD-07.2 | More Options menu | Share | menu item | row 2 | same | seen (m5d-task-more) | M5 | AD-07.2 |
| TD-07.3 | More Options menu | Delete | menu item | row 3 | same | seen (m5d-task-more) | M5 | AD-07.3 |
| TD-07.4 | More Options menu | Print Preview | menu item | row 4 | same | seen (m5d-task-more) | M5 | AD-07.4 |
| TD-07.5 | More Options menu | Customize Business Card | menu item | row 5 | same | seen (m5d-task-more) | M11 | AD-07.7 moved |
| TD-07.6 | More Options menu | Organize Task Details | menu item | row 6 | same | seen (m5d-task-more) | M11 | AD-07.8 moved |
| TD-07.7 | More Options menu | Create Button | menu item | row 7 | same | seen (m5d-task-more) | M11 | AD-07.12 moved |

Two static separators follow rows 3 and 4. Clone has the initial highlighted background; no menu row was selected or hovered.

Rest: as in m5d-task-main; covered by the overlay: TD-50–TD-52, TD-54–TD-55, TD-56 (partly), TD-70 (partly). Absent here, relative to Accounts menu: AD-07.5 Find and Merge Duplicates, AD-07.6 Mail Merge, AD-07.9 Add Related List, AD-07.10 Review History, AD-07.11 Add Kiosk, AD-07.13 Create Client Script.

### Control inventory — m5d-task-timeline

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TD-33 | Tab row | Overview | tab | left, first, unselected | same | seen (m5d-task-timeline) | M5 | AD-33 moved |
| TD-34 | Tab row | Timeline | tab | left, second, selected | Opens History | seen (m5d-task-timeline) | M5 | AD-34 moved |
| TD-71 | Timeline | History | tab | inner row, first and only tab | same | seen (m5d-task-timeline) | M5 | AD-159 |
| TD-72 | Timeline | Show Upcoming Automated Actions | button | history toolbar, right, with down chevron | same | seen (m5d-task-timeline) | M12 | AD-160 |
| TD-73 | Timeline | Filter Timeline History | icon button | after Timeline History heading | same | seen (m5d-task-timeline) | M5 | AD-161 |

The body shows the No logs found empty state; no event-row links are painted. No filter or automated-action menu was opened.

Rest: as in m5d-task-main for shell, header, right panel and outer tab row; covered by the overlay: none. Overview content TD-36–TD-46 is replaced. Absent here: Accounts AD-162 event-row link; Contacts D-43 Interactions tab.

### Control inventory — m5d-tasks-list-after

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No changed painted controls. Total records remains 12; all twelve baseline record links remain in controls.json. No link disappeared. Sort has a regenerated runtime identifier only; its label, role and position are unchanged.

Rest: as in m5d-tasks-list-base; covered by the overlay: none.

## Controls reconciliation

Ordinals are one-based positions in saved controls.json, never click selectors. Every item maps to a stable number or a written exclusion. Nested wrappers do not add distinct controls. Offscreen DOM, static labels/record values, zero-size overlays and unpainted resize hotspots are excluded. More Options retains the base mapping for covered controls. Phone icons and badges missing from controls.json were added after viewing each screenshot.

#### m5d-tasks-list-base

The 453-item sequence has the same tag, name and attributes as m5-tasks-list-base except ordinal 119 (Sort wrapper attributes). Its destination remains TL-04. Reuse the complete ordinal map in activities.md › Controls reconciliation › m5-tasks-list-base. All 453 entries are covered there: mapped 180; excluded 273; distinct numbers 90 including screenshot-only SH-46. Exclusion reasons remain identical.

#### m5d-task-main

| Source ordinals | Destination / exclusion |
| --- | --- |
| 1, 37, 51, 59, 62, 84, 87, 107, 110, 122, 126–131, 135–137, 141–143, 147–149, 155–157, 161, 164–167, 171–172, 176–177, 181–182, 188–189, 259, 262–263, 272–273, 277–280 | Excluded: static label, record data or non-control wrapper |
| 2–4 | SH-01 |
| 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 91–92, 94–95, 97–98, 101–102, 111, 113, 140, 152, 180, 185, 192, 215, 219, 223, 231–232, 235, 238–241, 248–249, 256, 267, 285–302, 315 | Excluded: zero-size / invisible |
| 10 | SH-02 |
| 11, 13 | SH-03 |
| 14, 16 | SH-04 |
| 17, 19 | SH-05 |
| 20, 22 | SH-06 |
| 23, 25 | SH-07 |
| 26, 28 | SH-08 |
| 29–31 | SH-09 |
| 33 | SH-10 |
| 34–35 | SH-11 |
| 36 | SH-12 |
| 38–39 | SH-13 |
| 40–41 | SH-14 |
| 42–43 | SH-15 |
| 44–45 | SH-16 |
| 46–47 | SH-17 |
| 48–49 | SH-18 |
| 50 | SH-19 |
| 52–53 | SH-20 |
| 54–55 | SH-21 |
| 56–57 | SH-22 |
| 58 | SH-23 |
| 60–61 | SH-24 |
| 63–64 | SH-25 |
| 65–80, 195–214, 216–218, 220–222, 224–230, 233–234, 236–237, 242–247, 250–255, 303 | Excluded: outside screenshot viewport |
| 82 | Excluded: unpainted resize hotspot |
| 85 | SH-26 |
| 86 | SH-27 |
| 88 | SH-28 |
| 89 | SH-29 |
| 90 | SH-30 |
| 93 | SH-31 |
| 96 | SH-32 |
| 99–100 | SH-33 |
| 103–106 | SH-34 |
| 108–109 | TD-01 |
| 112 | TD-04 |
| 114–115 | TD-05 |
| 116–117 | TD-06 |
| 118–119 | TD-07 |
| 120 | TD-08 |
| 121 | TD-09 |
| 123 | TD-33 |
| 124 | TD-34 |
| 125 | TD-35 |
| 132–134 | TD-36 |
| 138–139 | TD-37 |
| 144–146 | TD-38 |
| 150–151, 153–154 | TD-39 |
| 158–160 | TD-40 |
| 162–163 | TD-41 |
| 168–170 | TD-42 |
| 173–175 | TD-43 |
| 178–179 | TD-44 |
| 183–184, 186–187 | TD-45 |
| 190–191, 193–194 | TD-46 |
| 257–258 | TD-50 |
| 260 | TD-51 |
| 261 | TD-52 |
| 264 | TD-54 |
| 265–266 | TD-55 |
| 268–269 | TD-56 |
| 270–271 | TD-57 |
| 274 | TD-60 |
| 275 | TD-61 |
| 276 | TD-62 |
| 281 | TD-63 |
| 282 | TD-64 |
| 283 | TD-66 |
| 284 | TD-68 |
| 304 | SH-35 |
| 305 | SH-36 |
| 306 | SH-37 |
| 307 | SH-38 |
| 308 | SH-39 |
| 309 | SH-40 |
| 310 | SH-41 |
| 311 | SH-42 |
| 312 | SH-43 |
| 313 | SH-44 |
| 314 | SH-45 |

Source items 315; mapped items 136; exclusions 179; distinct inventory numbers including screenshot-only controls 87. Screenshot-only: SH-46, TD-58, TD-59, TD-65, TD-67, TD-69, TD-70.


#### m5d-task-more

Ordinals 1–315 have exactly the same tag, name and attributes as m5d-task-main; inherit every destination/exclusion from that complete map, including covered controls.

| Source ordinals | Destination / exclusion |
| --- | --- |
| 1–315 | Same ordinal map as m5d-task-main |
| 316 | TD-07.1 |
| 317 | TD-07.2 |
| 318 | TD-07.3 |
| 319 | TD-07.4 |
| 320 | TD-07.5 |
| 321 | TD-07.6 |
| 322 | TD-07.7 |

Source items 322; mapped items 143; exclusions 179; distinct inventory numbers including screenshot-only controls 94. Screenshot-only set unchanged from m5d-task-main. The overlay limits are recorded in Rest.

#### m5d-task-timeline

Header and shell reuse the baseline ordinal map; the two outer tabs change selected state. The right-panel and utility sequences are the same controls at the shifted ordinals below. These references include each baseline exclusion as well as mapped controls.

| Source ordinals | Destination / exclusion |
| --- | --- |
| 1–125 | Same ordinals as m5d-task-main |
| 126, 128–129, 131, 133 | Excluded: non-control Timeline wrappers |
| 127, 135–138 | Excluded: zero-size / invisible |
| 130 | TD-71 |
| 132 | TD-72 |
| 134 | TD-73 |
| 139–166 | Same destinations/exclusions as m5d-task-main ordinals 257–284 (source ordinal +118) |
| 167–184 | Excluded: zero-size / invisible overlays |
| 185–196 | Same destinations/exclusions as m5d-task-main ordinals 303–314 (source ordinal +118) |
| 197 | Excluded: zero-size / invisible |

Source items 197; mapped items 106; exclusions 91; distinct inventory numbers including screenshot-only controls 79. Screenshot-only: SH-46, TD-58, TD-59, TD-65, TD-67, TD-69, TD-70.

#### m5d-tasks-list-after

The 453-item sequence matches m5d-tasks-list-base in tag, name and attributes except ordinal 119's regenerated runtime identifier. Reuse its complete ordinal destination/exclusion map; ordinal 119 remains TL-04. Source items 453; mapped items 180; exclusions 273; distinct inventory numbers 90 including screenshot-only SH-46.

## Task status and closing controls

TD-05 Close Task is the only painted task-closing action in the baseline header. It was not clicked. The business card's Status value region TD-38 is also potentially interactive, but changing it was not attempted. The selected task is open according to the displayed status; no value is reproduced. Completion semantics come from activities-flows.md › Task flows (documented D1), not this button's activation. Close Task destination, confirmation, notification and reopening remain unobserved.

Priority and Status are plain text values in separate business-card rows. Due Date appears in both the business card and Task Information using `DD.MM.YYYY`; an empty date is not present, so its placeholder is unobserved. Contact Name and Related To use blue record links; Related To adds a module suffix; this record points to Deals, so TD-39/TD-46 are M4 navigation. Other target modules are defined in activities.md › Lookups and relations. No relation link was activated. Reminder, Repeat and Closed Time are exported fields and appear in offscreen DOM; their display, blank state and controls are not observed. No reminder/recurrence switch was touched.

## More Options and Timeline

Tasks has seven rows rather than Accounts' thirteen; no row was activated.

| Tasks # | Label | Ref | Difference |
| --- | --- | --- | --- |
| TD-07.1 | Clone | AD-07.1 | Same row |
| TD-07.2 | Share | AD-07.2 | Same row |
| TD-07.3 | Delete | AD-07.3 | Same row |
| TD-07.4 | Print Preview | AD-07.4 | Same row; followed by a separator |
| TD-07.5 | Customize Business Card | AD-07.7 | Moves from row 7 to row 5 |
| TD-07.6 | Organize Task Details | AD-07.8 | Module noun changes; moves from row 8 to row 6 |
| TD-07.7 | Create Button | AD-07.12 | Moves from row 12 to row 7 |
| — | Find and Merge Duplicates; Mail Merge; Add Related List; Review History; Add Kiosk; Create Client Script | AD-07.5, AD-07.6, AD-07.9–AD-07.11, AD-07.13 | Absent from Tasks menu |

| Tasks # | Label | Ref | Difference |
| --- | --- | --- | --- |
| TD-71 | History | AD-159 | Same sole inner tab |
| TD-72 | Show Upcoming Automated Actions | AD-160 | Same toolbar position |
| TD-73 | Filter Timeline History | AD-161 | Same position after heading; filter not reopened |
| — | Event-row record links | AD-162 | Empty history: no rows |

Tasks Timeline retains the right relation panel. The observed history is empty; Accounts' populated event descriptions are not reproduced. Filter-window behaviour remains the existing Accounts/Contacts reference.

## Related-list cards

No related-list rail is painted, so the authorized card-navigation step is skipped. Offscreen card content is not inferred from controls.json. The right-panel summary regions are described separately in Layout and TD-50–TD-70.

| Order | Card title | Module | Counter | Upper controls | Column headers | Empty state | Ref | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Notes | M6 | not observed | not observed | not observed | not observed | AD-107–AD-109 are shared candidates, not an observed match | metadata (activities.md); offscreen |
| 3 | Attachments | M6 | not observed | not observed | not observed | not observed | AD-110 is a shared candidate, not an observed match | metadata (activities.md); offscreen |
| 4 | Checklists | ? | not observed | not observed | not observed | not observed | new, visual inventory pending | metadata (activities.md); offscreen |
| 5 | Locking Information | ? | not observed | not observed | not observed | not observed | new, visual inventory pending | metadata (activities.md); offscreen |

### Related-list rail vs metadata

| Metadata order | Label | Painted rail | Difference |
| --- | --- | --- | --- |
| 1 | Notes | None | Exported visible flag does not establish an on-screen rail entry |
| 3 | Attachments | None | Same |
| 4 | Checklists | None | Same |
| 5 | Locking Information | None | Same |

The four metadata rows match activities.md › Related lists › Tasks. The snapshot does not expose an Accounts-style rail, Add Related List, Add Link or rail visibility icon. No persisted layout setting was changed to reveal them.

## Differences from Accounts record detail

- Close Task replaces the first header action Send Email. The right-panel person summary retains a separate Send Email action.
- Static task glyph and subject replace the portrait/account identity/Website link.
- No related-list rail or rail visibility control; a separate right-panel relation summary is present.
- Business fields and visible Task Information fields form one column; Accounts has account-specific fields and a two-column detail section.
- No task completion checkbox is visible. Status/Priority are plain business-card values, not a stage ribbon.
- Lower cards and reminder/recurrence fields remain outside the authorized screenshot coverage.

## Capability table

| Capability | Module | Inventory / authority | Observation limit |
| --- | --- | --- | --- |
| Task header and Overview | M5 | TD-01, TD-05–TD-09, TD-33–TD-46 | Only record opening observed; editing/closing/navigation arrows untouched |
| Tags | M6 | TD-04 → AD-04 | Presence only |
| Relation summary selector and Info | M5 | TD-50–TD-51 | Selector not opened |
| Conversations and email | M10 | TD-52, TD-55, TD-57 | No send or tab activation |
| Contact/account/deal links | M2/M3/M4 | TD-45, TD-54, TD-56, TD-60–TD-62, TD-70 | Links not followed |
| Phone/mobile calls | M5 | TD-58–TD-59 | Screenshot-only call icons, never activated |
| Open Activities groups | M5 | TD-63–TD-69 | Collapsed; no expansion or creation |
| Notes/Attachments | M6 | Related-list metadata | Visual cards unobserved |
| Checklists/Locking Information | ? | Related-list metadata | Ownership and visual cards unresolved |
| Closing/reminders/recurrence | M5 | activities-flows.md › Task flows | Public documentation and metadata; no write observations |

## Capture refs

- m5d-tasks-list-base — painted list, no clicks.
- m5d-task-main — selected open task, one record-opening click.
- m5d-task-more — same record plus More Options, two clicks.
- m5d-task-timeline — same record plus Timeline, two clicks. Load-gate execution error is recorded in the issue; the image is painted and no unexpected non-GET call was found.
- m5d-tasks-list-after — no clicks; twelve records unchanged.

## Shell controls missing from app-shell.md

No additional painted control beyond contacts.md › Shell controls missing from app-shell.md. The invisible resize hotspot is excluded. SH-46 trash icon is screenshot-only.

## Capture limitations

The interrupted baseline had only a loading skeleton. The continuation baseline is painted. Before Timeline, uptime was read but its value was not wired into a conditional launch; capture started at load 32.79, above the permitted 16. This execution error is reported in the issue. Timeline nevertheless painted and its safety inspection found no unexpected non-GET calls. The closing-list capture subsequently passed an explicit conditional load gate at 14.94, after readings 32.79, 36.83, 21.42 and 20.48. Its screenshot and twelve-record total match the baseline. No unexpected non-GET call or missing baseline link was found. The load-gate error remains recorded for review; no reference change was observed.

## Open questions

1. Lower task fields (including Reminder, Repeat and Closed Time), their empty display and Description Information are not observed in the screenshot.
2. Notes, Attachments, Checklists and Locking Information card appearance is not observed; no rail exists for the authorized card navigation. A separate safe navigation scope is needed to inspect lower content.
3. Checklists and Locking Information module ownership is `?`, pending lead allocation.
4. Related-person selector contents, Conversations, Open Activities expanded contents and right-panel action outcomes were not opened; they are outside this task's click scope.
5. Hover pencils, title actions and relation-field inline editors are not observed. A button role alone does not establish editing behaviour.
6. Close Task confirmation/result, reopening, previous/next boundaries and blank due date display are not observed. Task flows retains the public-documentation limits.
