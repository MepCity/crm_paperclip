# Email templates — list and folder structure

Status: M10-R7 / MEP-1017. Research captured 2026-10-22 (local date).
Screen presence is evidenced; both permitted captures fail the paint gate.
Research stopped after the single retry; this is a gap record, not an accepted
implementation-ready screen spec.
No template editor, preview, analytics pane or folder was opened.

## Purpose

Browse reusable email templates in the settings area by folder, module and
search. This spec covers the resting list only. Creation, editing, merge fields,
sharing changes and preview behaviour belong to W9/N4 in
[the write-only flow register](../module-10-write-only-flows.md).

## Layout

The settings rail replaces the module rail. Its current scroll position shows
Customization, Automation and the start of Process Management; Templates is
selected. The shared top bar and bottom utility strip remain visible.

The main card is headed Templates. Email is the selected type beside Inventory
and Mail Merge. The module selector and template search sit to the right.
A folder pane sits below the heading on the left, with New Template above the
folder links and an unnamed folder-order icon at the bottom. All Templates is
selected. The right side is a table with Template Name, Modified By, Last Used
and Stats columns. A select-all square precedes the first heading.

One populated row is visible. It has an outline favorite star, a primary template
name link, secondary module text and a short template description/name, a modifier
link with a date below, a last-used date, a stats dash and an unnamed document
action at the far right. Record content, names and dates are deliberately omitted.
No pagination, count, open filter menu or open folder editor is visible.

## Control inventory

Numbers in the final column refer to one-based entries in the base controls.json.
Every row has behaviour **not observed**: presence comes from the screenshot and
controls, with no click or typing. Nested representations share a row; hidden and
offscreen scaffolding is excluded below. Contacts references reuse
[contacts.md](contacts.md); the settings rail is new relative to that module rail.

| # | Region | Control | Type | Position / visible state | Behaviour | Source | Module | Contacts ref | Raw entries |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-01 | Setup rail | Back arrow | icon button | header left | not observed | seen (m10r7-email-templates-base) | M11 | new | 3 |
| T-02 | Setup rail | Setup Home | link | header | not observed | seen (m10r7-email-templates-base) | M11 | new | 4–5 |
| T-03 | Setup rail | Setup editor icon | icon link | header right | not observed | seen (m10r7-email-templates-base) | M11 | new | 6–7 |
| T-04 | Setup rail | Search | input | below header | not observed | seen (m10r7-email-templates-base) | M11 | new | 8–9 |
| T-05 | Setup rail | Social | link | above Customization | not observed | seen (m10r7-email-templates-base) | M11 | new | 66–67 |
| T-06 | Setup rail | Chat | link | above Customization | not observed | seen (m10r7-email-templates-base) | M11 | new | 68–69 |
| T-07 | Setup rail | Portals | link | above Customization | not observed | seen (m10r7-email-templates-base) | M11 | new | 70–71 |
| T-08 | Setup rail | Customization | expanded group | above settings links | not observed | seen (m10r7-email-templates-base) | M11 | new | 72–73 |
| T-09 | Setup rail | Modules and Fields | link | Customization group | not observed | seen (m10r7-email-templates-base) | M11 | new | 75–76 |
| T-10 | Setup rail | Pipelines | link | Customization group | not observed | seen (m10r7-email-templates-base) | M11 | new | 77–78 |
| T-11 | Setup rail | Wizards | link | Customization group | not observed | seen (m10r7-email-templates-base) | M11 | new | 79–80 |
| T-12 | Setup rail | Kiosk Studio | link | Customization group | not observed | seen (m10r7-email-templates-base) | M11 | new | 81–82 |
| T-13 | Setup rail | Canvas | link | Customization group | not observed | seen (m10r7-email-templates-base) | M11 | new | 83–84 |
| T-14 | Setup rail | Customize Home page | link | Customization group | not observed | seen (m10r7-email-templates-base) | M11 | new | 85–86 |
| T-15 | Setup rail | Translations | link | Customization group | not observed | seen (m10r7-email-templates-base) | M11 | new | 87–88 |
| T-16 | Setup rail | Templates | link | selected settings row | not observed | seen (m10r7-email-templates-base) | M11 | new | 89–90 |
| T-17 | Setup rail | Teamspace | link | Customization group | not observed | seen (m10r7-email-templates-base) | M11 | new | 91–92 |
| T-18 | Setup rail | Automation | expanded group | below Customization | not observed | seen (m10r7-email-templates-base) | M12 | new | 93–94 |
| T-19 | Setup rail | Workflow Rules | link | Automation group | not observed | seen (m10r7-email-templates-base) | M12 | new | 96–97 |
| T-20 | Setup rail | Actions | link | Automation group | not observed | seen (m10r7-email-templates-base) | M12 | new | 98–99 |
| T-21 | Setup rail | Schedules | link | Automation group | not observed | seen (m10r7-email-templates-base) | M12 | new | 100–101 |
| T-22 | Setup rail | Assignment | link | Automation group | not observed | seen (m10r7-email-templates-base) | M12 | new | 102–103 |
| T-23 | Setup rail | Scoring Rules | link | Automation group | not observed | seen (m10r7-email-templates-base) | M12 | new | 104–105 |
| T-24 | Setup rail | Cadences | link | Automation group | not observed | seen (m10r7-email-templates-base) | M12 | new | 106–107 |
| T-25 | Setup rail | Process Management | expanded group | below Automation | not observed | seen (m10r7-email-templates-base) | M12 | new | 108–109 |
| T-26 | Setup rail | Blueprint | link | Process Management group | not observed | seen (m10r7-email-templates-base) | M12 | new | 111–112 |
| T-27 | Setup rail | Approval Processes | partly clipped link | rail bottom edge | not observed | seen (m10r7-email-templates-base) | M12 | new | 113–114 |
| T-28 | Top bar | Search records | button | first top-bar control | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-26 | 234 |
| T-29 | Top bar | Plus icon | icon button | after search | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-27 | 235 |
| T-30 | Top bar | Assistant shortcut | icon button | after plus | not observed | seen (m10r7-email-templates-base) | P3 | SH-28 | 237 |
| T-31 | Top bar | Notifications | icon button | after assistant | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-29 | 238 |
| T-32 | Top bar | Calendar | icon button | after notifications | not observed | seen (m10r7-email-templates-base) | M10 | SH-30 | 239 |
| T-33 | Top bar | Marketplace | icon button | after calendar | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-31 | 242 |
| T-34 | Top bar | Setup | icon button | selected top-bar shortcut | not observed | seen (m10r7-email-templates-base) | M11 | SH-32 | 245 |
| T-35 | Top bar | Profile | icon button | after setup | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-33 | 248–249 |
| T-36 | Top bar | Applications menu | icon button | far right | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-34 | 252–255 |
| T-37 | Templates header | Email | tab link | first type tab; selected | not observed | seen (m10r7-email-templates-base) | M10 | new | 258–259 |
| T-38 | Templates header | Inventory | tab link | second type tab | not observed | seen (m10r7-email-templates-base) | P2 | new | 260–261 |
| T-39 | Templates header | Mail Merge | tab link | third type tab | not observed | seen (m10r7-email-templates-base) | M10 | new | 262–263 |
| T-40 | Templates header | Context help triangle | icon control | card upper right | not observed | seen (m10r7-email-templates-base) | M10 | new | 264 |
| T-41 | Templates header | Search Template | input | right of module selector | not observed | seen (m10r7-email-templates-base) | M10 | new | 265 |
| T-42 | Templates header | All Modules | combobox | before template search | not observed | seen (m10r7-email-templates-base) | M10 | new | 266–269 |
| T-43 | Template folders | New Template | button | above folder list | not observed | seen (m10r7-email-templates-base) | M10 | new | 273 |
| T-44 | Template folders | All Templates | link | selected folder row | not observed | seen (m10r7-email-templates-base) | M10 | new | 275 |
| T-45 | Template folders | Favorites | link | below All Templates | not observed | seen (m10r7-email-templates-base) | M10 | new | 276 |
| T-46 | Template folders | Associated Templates | link | below All Templates | not observed | seen (m10r7-email-templates-base) | M10 | new | 277 |
| T-47 | Template folders | Created by me | link | below All Templates | not observed | seen (m10r7-email-templates-base) | M10 | new | 278 |
| T-48 | Template folders | Shared with me | link | below All Templates | not observed | seen (m10r7-email-templates-base) | M10 | new | 279 |
| T-49 | Template folders | Public Email Templates | link | below All Templates | not observed | seen (m10r7-email-templates-base) | M10 | new | 280 |
| T-50 | Table header | Select all | checkbox | before Template Name | not observed | seen (m10r7-email-templates-base) | M10 | new | 281 |
| T-51 | Table header | Template Name | column heading | first text column | not observed | seen (m10r7-email-templates-base) | M10 | new | 282 |
| T-52 | Table header | Modified By | column heading | after template name | not observed | seen (m10r7-email-templates-base) | M10 | new | 283 |
| T-53 | Table header | Last Used | column heading | after Modified By | not observed | seen (m10r7-email-templates-base) | M10 | new | 284 |
| T-54 | Template row | Favorite star | icon control | before template name; outline state | not observed | seen (m10r7-email-templates-base) | M10 | new | 286 |
| T-55 | Template row | Template name | record link | primary row text; value omitted | not observed | seen (m10r7-email-templates-base) | M10 | new | 287–288 |
| T-56 | Template row | Modifier | user link | Modified By cell; value omitted | not observed | seen (m10r7-email-templates-base) | M10 | new | 289 |
| T-57 | Template row | Stats placeholder | cell control | Stats column; dash displayed | not observed | seen (m10r7-email-templates-base) | M10 | new | 290–291 |
| T-58 | Template row | Unnamed document action | icon control | far right of row | not observed | seen (m10r7-email-templates-base) | M10 | new | 292 |
| T-59 | Template folders | Folder reorder icon | icon control | folder-pane footer | not observed | seen (m10r7-email-templates-base) | M10 | new | 299 |
| T-60 | Utility strip | My Pins | button | bottom left | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-35 | 317 |
| T-61 | Utility strip | Chats | button | bottom left | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-36 | 318 |
| T-62 | Utility strip | Contacts | button | bottom left | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-37 | 319 |
| T-63 | Utility strip | Command palette icon | button | bottom right | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-38 | 320 |
| T-64 | Utility strip | Announcements | button | bottom right | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-39 | 321 |
| T-65 | Utility strip | Motivator | button | bottom right | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-40 | 322 |
| T-66 | Utility strip | Sticky Notes | button | bottom right | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-41 | 323 |
| T-67 | Utility strip | Activity Reminders | button | bottom right | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-42 | 324 |
| T-68 | Utility strip | Recent Items | button | bottom right | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-43 | 325 |
| T-69 | Utility strip | Accessibility | button | bottom right | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-44 | 326 |
| T-70 | Utility strip | Help | button | bottom right | not observed | seen (m10r7-email-templates-base) | Shared shell | SH-45 | 327 |
| T-71 | Utility strip | Trash bin icon | icon button | far right after Help | not observed | seen (m10r7-email-templates-base), screenshot only | Shared shell | SH-46 | none |

### Reconciliation

- Base: **341 raw entries → 70 controls-backed inventory rows**, representing
  108 raw entries; **233 excluded entries**. Grouping removes
  38 duplicate/nested representations. One additional screenshot-only row (T-71) gives
  **71 total inventory rows**; it has no raw-entry counterpart.
- Excluded raw entries: 1–2, 10–65, 74, 95, 110, 115–233, 236, 240–241, 243–244, 246–247, 250–251, 256–257, 270–272, 274, 285, 293–298, 300–316, 328–341.
- Exclusions are rail/navigation/group containers, offscreen settings links,
  zero-size hidden dialogs, the inactive bulk-action section, offscreen Preview /
  Analytics pane, and scrollable-region scaffolding. Raw 285 is the offscreen
  row-selection input; no separate visible row checkbox is asserted. The visible
  select-all square is represented by raw 281 despite its offscreen native input.
- Raw 264 is a zero-height help wrapper, included because the screenshot shows
  the corresponding help triangle. Raw 266 is the hidden native select grouped
  with its visible combobox. Raw 270–272 are hidden bulk controls and are excluded
  even though the delete child reports a nonzero box. Raw 293–297 lie outside the
  viewport; their Preview/Analytics text does not prove a safe preview entry.
- Template Name, Modified By and Last Used are interactive heading candidates
  in controls.json; Stats is screenshot-only static heading text. Module text,
  secondary template text and dates are static cells, described in Layout.

### Delta: m10r7-email-templates-retry-base

| # | Difference against base | Source | Contacts ref |
| --- | --- | --- | --- |
| D-01 | None: all 341 raw entries are identical; reuse T-01–T-70 | seen (m10r7-email-templates-retry-base) | unchanged references in base table |
| D-02 | Screenshot-only trash bin remains present; reuse T-71 | seen (m10r7-email-templates-retry-base) | SH-46 |

The retry screenshot was opened and inspected. Its reconciliation is also
341 raw entries → 70 controls-backed rows (108 raw entries) + 233 excluded;
with the screenshot-only trash control, **71 total rows**. The exclusion set
is identical. No shell or folder inventory is repeated.

## Fields

| Shown item | Observed representation | Limit |
| --- | --- | --- |
| Template name | Primary link plus secondary row text | No editor/validation or storage field inferred |
| Module | Secondary module label; All Modules combobox above list | Available menu options not opened |
| Modified by / modified date | User link with date below | No identity copied; no profile opened |
| Last used | Date cell | Formatting and empty-date behaviour not tested |
| Stats | Dash cell in this row | Metric, tooltip and analytics detail not observed |
| Favorite | Outline star | Toggle not operated |
| Folder | Six visible navigation links | Counts, nesting and custom-folder behaviour not observed |

Metadata cross-check: modules.json contains Email_Template__s with
api_supported=false and no exported module folder. It also contains
Email_Template_Analytics with api_supported=true, viewable=false,
creatable=false, editable=false and deletable=false. These are metadata flags,
not evidence that the settings list is unavailable. The analytics field export
contains User (ownerlookup), Template_Name (lookup), Mail_Source (picklist),
Entity_Source (module), Date (datetime), id (bigint), and integer counters Sent,
Bounced, Tracked, Bounced_Among_Tracked, Opened, Clicked, Replied and Received.
This supports the existence of analytics, but does not identify the visible Stats
cell metric or establish the template body's schema. R8 owns the full gap review.

## Actions and click list

Click list: **empty — 0 selectors, 0 clicks**. Offline selector matching and
DANGEROUS_TEXT checks have zero candidates; no exception or toggle flag was used.
The complete base screenshot was inspected. No new-template, name, favorite,
selection, user, stats, folder, module selector, search, type tab or shell control
was operated. Folder reordering is a persistent preference and is forbidden.

No preview is authorized by this evidence. The named Preview and Analytics
entries are inside an offscreen pane, and the visible row action is unnamed.
The template-name link includes a template selection parameter; it does not
prove a read-only destination. Neither it nor any editor was opened.

## Filters / views / sorting / search

- Type strip: Email selected; Inventory and Mail Merge are visible alternatives.
- Folder strip: All Templates selected; Favorites, Associated Templates,
  Created by me, Shared with me and Public Email Templates follow. Link hrefs
  distinguish folder routes; they do not establish selection persistence, filter
  semantics, permissions or result contents. No folder identifier is copied.
- Module selector: All Modules in a closed combobox. Hidden option text is not
  treated as an opened menu inventory. No option was selected.
- Search: Search Template input visible and empty. No text entered; matching,
  debounce, clearing and empty-results behaviour remain unknown.
- Sorting: three heading candidates observed; no direction indicator or default
  sort established, and no header clicked. No column configuration was changed.

## Flows and states

1. Navigate directly to the list path evidenced by the earlier m6-setup Templates
   link: /crm/<org>/settings/templates?type=email (no customer or account value).
2. Inspect the resting list only; all displayed controls remain unoperated.
3. Close only the capture tool's own tab through its normal completion.

The populated resting state is visible. Empty list, no search results, permission
errors, loading transitions, validation, save results and server errors are not
observed. A pageerror fails the paint gate even when content is visible; no
successful interaction behaviour is inferred from a partially reliable render.

## Capture refs

- m6-setup: prior local capture; Templates link supplies the direct list path.
  Not a new R7 capture and not re-inventoried here.
- m10r7-email-templates-base: click-free, --wait 25000, screenshot inspected;
  341 controls, 41 API call groups. Templates heading and populated row present.
  Comparable settings base m6-setup has 62 API call groups (half = 31), so the
  count threshold passes. No failed .js request, but the diagnostic
  pageerror Cannot read properties of undefined (reading '_sortableParentData')
  **fails the paint gate**. The permitted retry must wait at least five minutes
  after this capture completed at 21:35:25 UTC.
- m10r7-email-templates-retry-base: started at 21:40:37 UTC (more than five
  minutes later), completed at 21:41:22 UTC; click-free, --wait 25000. Same
  heading, populated row, 341 controls and 41 API call groups. The same
  sortable-parent pageerror fails the paint gate again; no failed .js request.
  The screenshot was inspected. No further capture, browser intervention or
  route exploration was attempted. UI Lead must decide how to handle this
  evidence gap before the list is treated as accepted research.

### Non-GET baseline and blocked requests

Paths are neutralized; query keys and request/response shapes are intentionally
omitted under the Module 2+ rule. This table is safety accounting only.

| Method | Service / neutral path | Base count | Outcome |
| --- | --- | --- | --- |
| POST | Shell visitor service /visitor/v2/<tenant>/livevisitors/<visitor>/triggers | 1 | Completed, status 200; passive shell trace |
| POST | CRM /crm/<org>/ActivityReminder.do | 1 | Blocked: legacy action showreminder |
| POST | CRM /crm/<org>/crminotification.do | 1 | Blocked: legacy action status |
| POST | Telemetry /murphy/<id>/telemetry/urlMonitor | 1 | Blocked: telemetry |
| POST | Telemetry /murphy/<id>/telemetry/logs | 1 | Blocked: telemetry |

network.json contains the completed visitor call only; blockedRequests contains
the other four attempts once each. The base establishes the path/count set;
the retry has exactly the same completed non-GET path/count and the same four
blocked attempts. No new path or excess count occurred; the non-GET stop rule
was not triggered. The paint gate remains failed in both captures. No record or template mutation,
download, popup, window-open or print action was observed. Blocked calls are
reported, never manually retried.

## Open questions

1. Can a later authorized read-only capture meet the paint gate without the
   sortable-parent error? No browser/session/tool changes are authorized here.
2. Does any named entry expose a preview without an editor or draft creation?
   Current evidence cannot establish this; no preview attempted.
3. Folder-result semantics, custom folders, nested folders, sharing and module
   filter options are unobserved. Does folder selection persist a preference?
4. Default sorting, heading click behaviour, pagination, search matching and
   empty/error states require documentation or later authorized research.
5. Which analytics measure drives Stats, including an unavailable-value dash?
6. Editor validation, merge fields, attachment support, folder/sharing writes,
   favorite changes and selection-armed bulk actions cannot be tested read-only.
   See W9/N4; no write experiment is authorized by this spec.
