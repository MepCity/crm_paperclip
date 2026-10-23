# Customization — Modules and Fields (R1 research)

## Purpose and status

Inspect the module administration list and the initial read-only tabs for Leads.
The initial module-list capture is accepted as painted by the CTO decision of
2026-10-22. The `_sortableParentData` page error is known sorting-library noise
on these settings pages when the screenshot is fully painted; a genuinely
blank or partial image still fails. The existing module-list, Layouts, Validation Rules, Fields,
Record Locking Configuration and Map Dependency Fields evidence is preserved.
The CTO decision at 20:39 UTC authorizes one continuation attempt for Layout
Rules, Buttons and Summary, and one fresh-load retry for Links. Refused requests
remain blocked; no guard is relaxed. The original broken Links capture and its
20 shell controls are **invalid acceptance evidence**, retained only for diagnosis.
This continuation uses only initial tab navigation, never an editor or persisted
preference.

The CTO's 2026-10-23 01:03 UTC decision permits one final attempt per remaining
tab in a new run. A source-page load failure is skipped with a reason; no
further recovery run is requested. Unavailable tab states may be submitted as
explicit open questions. Earlier diagnostic failures below remain historical.

Module 2+ parity applies: inventory and behaviour only, without pixel metrics,
typography, colours or frontend request shapes. No reference assets are copied.

## Layout

A settings sidebar has a fixed header and search, then vertically scrollable
category navigation. The initial captured sidebar is positioned around Channels,
Customization and Automation; it was not scrolled or expanded by this run.
The top utility strip and bottom collaboration/utility bar remain visible.

The content card has Modules, Web Tabs, Global Sets and Deal Management tabs.
Modules is selected. Below are an empty module-search input, two module-type
legend glyphs (Custom Module and Team Module), and two creation entries.
The legend labels are static, not proven interactive filters.

The table has Displayed In Tabs As, Module Name, Teamspace, Shared To,
Last Modified and Status columns. Display labels may link to configuration;
internal module labels are separate text. Teamspace counts are styled as links.
Shared-to cells contain profile-scope text; last-modified cells can contain an
avatar and date or be blank. Dates, profile values and identities are not copied.
Ten system-module rows are visible, from Home to Reports. Further rows exist
outside the table viewport and are excluded from the visible inventory.
The resting screenshot shows a Tasks-row drag grip and ellipsis in a hover
state (CTO classification); the capture requested no hover/click step.
The Tasks last-modified date is the capture day. This is not attributed to our
inspection: no settings write is evidenced. Earlier email-settings captures do
not provide a comparable Modules table, so an earlier date cannot be verified.

## Control inventory — initial module list

All rows below have source **seen, `m11r1-modules-base` screenshot**, reconciled
against one-based `controls.json` entries. The image is accepted as painted by the CTO decision. A dash denotes a screenshot-only control.
Duplicate framework wrappers/anchors count as one logical control. Behaviour
is limited to resting appearance; no controls were operated.

| # | Position | Control | Raw entries | Observed behaviour / limit | Owning module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- |
| MF-01 | Sidebar header | Back icon | 3 | Not clicked; destination unverified | Shell | Contacts shell |
| MF-02 | Sidebar header | Setup Home | 4, 5 | Navigation entry; not clicked | Settings | new |
| MF-03 | Sidebar header | Setup editor icon | 6, 7 | Editor entry; forbidden in this issue | Settings | new |
| MF-04 | Sidebar header | Settings search | 8, 9 | Empty input; not typed | Settings | new |
| MF-05 | Sidebar first visible item | Audit Log | 51, 52 | Navigation drawn; not clicked | Settings | new |
| MF-06 | Sidebar category | Channels | 53, 54 | Expanded; never toggled | Settings | new |
| MF-07 | Sidebar / Channels | Email | 56, 57 | Navigation drawn; not clicked | Settings | new |
| MF-08 | Sidebar / Channels | Telephony | 58, 59 | Navigation drawn; not clicked | Settings | new |
| MF-09 | Sidebar / Channels | Business Messaging | 60, 61 | Navigation drawn; not clicked | Settings | new |
| MF-10 | Sidebar / Channels | Notification SMS | 62, 63 | Navigation drawn; not clicked | Settings | new |
| MF-11 | Sidebar / Channels | Webforms | 64, 65 | Navigation drawn; not clicked | Settings | new |
| MF-12 | Sidebar / Channels | Social | 66, 67 | Navigation drawn; not clicked | Settings | new |
| MF-13 | Sidebar / Channels | Chat | 68, 69 | Navigation drawn; not clicked | Settings | new |
| MF-14 | Sidebar / Channels | Portals | 70, 71 | Navigation drawn; not clicked | Settings | new |
| MF-15 | Sidebar category | Customization | 72, 73 | Expanded; never toggled | Settings | new |
| MF-16 | Sidebar / Customization | Modules and Fields | 75, 76 | Current route | M11 | new |
| MF-17 | Sidebar / Customization | Pipelines | 77, 78 | Navigation drawn; not clicked | M11 | new |
| MF-18 | Sidebar / Customization | Wizards | 79, 80 | Navigation drawn; not clicked | M11 | new |
| MF-19 | Sidebar / Customization | Kiosk Studio | 81, 82 | Navigation drawn; not clicked | M11 | new |
| MF-20 | Sidebar / Customization | Canvas | 83, 84 | Navigation drawn; not clicked | M11 | new |
| MF-21 | Sidebar / Customization | Customize Home page | 85, 86 | Navigation drawn; not clicked | M11 | new |
| MF-22 | Sidebar / Customization | Translations | 87, 88 | Navigation drawn; not clicked | M11 | new |
| MF-23 | Sidebar / Customization | Templates | 89, 90 | Navigation drawn; not clicked | M11 | new |
| MF-24 | Sidebar / Customization | Teamspace | 91, 92 | Navigation drawn; not clicked | M11 | new |
| MF-25 | Sidebar category | Automation | 93, 94 | Expanded; never toggled | Settings | new |
| MF-26 | Sidebar / Automation | Workflow Rules | 96, 97 | Navigation drawn; not clicked | Settings | new |
| MF-27 | Top utility strip | Search records | 234 | Not opened or typed | Shell | Contacts shell |
| MF-28 | Top utility strip | Quick create | 235 | Not opened or typed | Shell | Contacts shell |
| MF-29 | Top utility strip | Assistant | 237 | Not opened or typed | Shell | Contacts shell |
| MF-30 | Top utility strip | Notifications | 238 | Not opened or typed | Shell | Contacts shell |
| MF-31 | Top utility strip | Calendar | 239 | Not opened or typed | Shell | Contacts shell |
| MF-32 | Top utility strip | Marketplace | 242 | Not opened or typed | Shell | Contacts shell |
| MF-33 | Top utility strip | Setup | 245 | Not opened or typed | Shell | Contacts shell |
| MF-34 | Top utility strip | Profile | 248, 249 | Not opened or typed | Shell | Contacts shell |
| MF-35 | Top utility strip | Applications menu | 252, 253, 254, 255 | Not opened or typed | Shell | Contacts shell |
| MF-36 | Content tab strip | Modules | 258, 259, 260 | Selected initial tab | M11 | new |
| MF-37 | Content tab strip | Web Tabs | 261, 262, 263 | Navigation tab; not opened | M11 | new |
| MF-38 | Content tab strip | Global Sets | 264, 265, 266 | Navigation tab; not opened | M11 | new |
| MF-39 | Content tab strip | Deal Management | 267, 268, 269 | Navigation tab; not opened | M11 | new |
| MF-40 | Content toolbar left | Module search | 275, 276, 453 | Empty input with search glyph; not typed | M11 | new |
| MF-41 | Content toolbar right | Create module using assistant | 277, 278 | Creation entry; forbidden, not opened | M11 | new |
| MF-42 | Content toolbar far right | Create New Module | 279, 280 | Creation entry; forbidden, not opened | M11 | new |
| MF-43 | Table / Home / Teamspace | Teamspace count link | — | Visible in screenshot; destination unverified, not opened | M11 | new |
| MF-44 | Table / Home / Status | Status switch | 283, 284 | Appears on; enabled/disabled distinction not verified. Never toggled | M11 | new |
| MF-45 | Table / Workqueue / Teamspace | Teamspace count link | — | Visible in screenshot; destination unverified, not opened | M11 | new |
| MF-46 | Table / Workqueue / Status | Status switch | 286, 287 | Appears on; enabled/disabled distinction not verified. Never toggled | M11 | new |
| MF-47 | Table / Leads / first column | Leads | 289, 290 | Module configuration link; opened once in the continuation, landing on Layouts. | M11 | new |
| MF-48 | Table / Leads / Teamspace | Teamspace count link | — | Visible in screenshot; destination unverified, not opened | M11 | new |
| MF-49 | Table / Leads / Status | Status switch | 291, 292 | Appears on; enabled/disabled distinction not verified. Never toggled | M11 | new |
| MF-50 | Table / Leads / Status | Information glyph | 293 | Visible; tooltip/content unobserved | M11 | new |
| MF-51 | Table / Contacts / first column | Contacts | 295, 296 | Module configuration link; not opened | M11 | new |
| MF-52 | Table / Contacts / Teamspace | Teamspace count link | — | Visible in screenshot; destination unverified, not opened | M11 | new |
| MF-53 | Table / Contacts / Status | Status switch | 297, 298 | Appears on; enabled/disabled distinction not verified. Never toggled | M11 | new |
| MF-54 | Table / Contacts / Status | Information glyph | 299 | Visible; tooltip/content unobserved | M11 | new |
| MF-55 | Table / Accounts / first column | Accounts | 301, 302 | Module configuration link; not opened | M11 | new |
| MF-56 | Table / Accounts / Teamspace | Teamspace count link | — | Visible in screenshot; destination unverified, not opened | M11 | new |
| MF-57 | Table / Accounts / Status | Status switch | 303, 304 | Appears on; enabled/disabled distinction not verified. Never toggled | M11 | new |
| MF-58 | Table / Deals / first column | Deals | 306, 307 | Module configuration link; not opened | M11 | new |
| MF-59 | Table / Deals / Teamspace | Teamspace count link | — | Visible in screenshot; destination unverified, not opened | M11 | new |
| MF-60 | Table / Deals / Status | Status switch | 308, 309 | Appears on; enabled/disabled distinction not verified. Never toggled | M11 | new |
| MF-61 | Table / Tasks / first column | Tasks | 311, 312 | Module configuration link; not opened | M11 | new |
| MF-62 | Table / Tasks / Teamspace | Teamspace count link | — | Visible in screenshot; destination unverified, not opened | M11 | new |
| MF-63 | Table / Tasks / Status | Status switch | 314, 315 | Appears on; enabled/disabled distinction not verified. Never toggled | M11 | new |
| MF-64 | Table / Tasks / left edge | Drag grip | — | Hover-state control; never dragged | M11 | new |
| MF-65 | Table / Tasks / beside name | More menu | 313 | Hover-state control; not opened | M11 | new |
| MF-66 | Table / Meetings / first column | Meetings | 317, 318 | Module configuration link; not opened | M11 | new |
| MF-67 | Table / Meetings / Teamspace | Teamspace count link | — | Visible in screenshot; destination unverified, not opened | M11 | new |
| MF-68 | Table / Meetings / Status | Status switch | 319, 320 | Appears on; enabled/disabled distinction not verified. Never toggled | M11 | new |
| MF-69 | Table / Calls / first column | Calls | 322, 323 | Module configuration link; not opened | M11 | new |
| MF-70 | Table / Calls / Teamspace | Teamspace count link | — | Visible in screenshot; destination unverified, not opened | M11 | new |
| MF-71 | Table / Calls / Status | Status switch | 324, 325 | Appears on; enabled/disabled distinction not verified. Never toggled | M11 | new |
| MF-72 | Table / Reports / Teamspace | Teamspace count link | — | Visible in screenshot; destination unverified, not opened | M11 | new |
| MF-73 | Table / Reports / Status | Status switch | 327, 328 | Appears on; enabled/disabled distinction not verified. Never toggled | M11 | new |
| MF-74 | Table right edge | Vertical scroll thumb | — | Visible in screenshot; not scrolled | M11 | new |
| MF-75 | Bottom utility strip | My Pins | 442 | Not opened | Shell | Contacts shell |
| MF-76 | Bottom utility strip | Chats | 443 | Not opened | Shell | Contacts shell |
| MF-77 | Bottom utility strip | Contacts | 444 | Not opened | Shell | Contacts shell |
| MF-78 | Bottom utility strip | Command palette icon | 445 | Not opened | Shell | Contacts shell |
| MF-79 | Bottom utility strip | Announcements | 446 | Not opened | Shell | Contacts shell |
| MF-80 | Bottom utility strip | Motivator | 447 | Not opened | Shell | Contacts shell |
| MF-81 | Bottom utility strip | Sticky Notes | 448 | Not opened | Shell | Contacts shell |
| MF-82 | Bottom utility strip | Activity Reminders | 449 | Not opened | Shell | Contacts shell |
| MF-83 | Bottom utility strip | Recent Items | 450 | Not opened | Shell | Contacts shell |
| MF-84 | Bottom utility strip | Accessibility | 451 | Not opened | Shell | Contacts shell |
| MF-85 | Bottom utility strip | Help | 452 | Not opened | Shell | Contacts shell |

### Reconciliation

`controls.json` 469 → inventory 85 logical controls, of which
12 are screenshot-only. Raw entries represented: 131;
excluded: 338. Arithmetic: 131 + 338 = 469.
Duplicate represented entries: 58.

Excluded raw entries: 1, 2, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 55, 74, 95, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 236, 240, 241, 243, 244, 246, 247, 250, 251, 256, 257, 270, 271, 272, 273, 274, 281, 282, 285, 288, 294, 300, 305, 310, 316, 321, 326, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469.

Reasons: container/region/row wrappers, static legend glyphs (454–455), zero-area
modal/popover placeholders, below-viewport modules and sidebar items, and
extra accordion-body wrappers. Entries 48–50 lie behind the fixed sidebar
header despite nonnegative geometry. Entry 98–99 (Actions) is clipped by the
bottom bar and is not a usable visible control. Analytics and later rows are
below the table clipping edge, regardless of their page-coordinate geometry.
The table scroll thumb, row drag grip and Teamspace links are included from
the image even though the collector does not expose separate entries.

## Leads — initial Layouts screen

Source: **seen, `m11r1-leads-layouts` screenshot**, reconciled with its
one-based `controls.json` entries. The screenshot is fully painted. The module
list is replaced by a module-navigation sidebar; Leads is selected. The content
has a Leads heading, nine tabs and the selected Layouts list. **Custom Views is
not visible among these nine tabs**; record-list custom views must not be
inferred as a settings tab.

The table has Name, Shared To, Last Modified and Status columns. One default
layout row is visible. The last-modified cell is blank in this state; sharing
scope is displayed as text. No identifiers, scope values or record values are
retained. The layout name opens an editor and was not clicked. Table and
content scroll containers fit their contents; no scrollbars are visible there.
The sidebar fits all seventeen displayed module entries. No preferences changed.

| # | Position | Control | Raw entries | Observed behaviour / limit | Owning module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- |
| ML-01 | Top utility strip | Search records | 3 | Not opened or typed | Shell | Contacts shell |
| ML-02 | Top utility strip | Quick create | 4 | Not opened or typed | Shell | Contacts shell |
| ML-03 | Top utility strip | Assistant | 6 | Not opened or typed | Shell | Contacts shell |
| ML-04 | Top utility strip | Notifications | 7 | Not opened or typed | Shell | Contacts shell |
| ML-05 | Top utility strip | Calendar | 8 | Not opened or typed | Shell | Contacts shell |
| ML-06 | Top utility strip | Marketplace | 11 | Not opened or typed | Shell | Contacts shell |
| ML-07 | Top utility strip | Setup | 14 | Not opened or typed | Shell | Contacts shell |
| ML-08 | Top utility strip | Profile | 17, 18 | Not opened or typed | Shell | Contacts shell |
| ML-09 | Top utility strip | Applications menu | 21, 22, 23, 24 | Not opened or typed | Shell | Contacts shell |
| ML-10 | Sidebar header | Back to Modules | 26, 103, 104 | Back affordance visible; not clicked | M11 | new |
| ML-11 | Sidebar header right | Module search icon | 27, 105 | Not opened; input behaviour unobserved | M11 | new |
| ML-12 | Sidebar, top to bottom | Leads | 28 | Selected | M11 | new |
| ML-13 | Sidebar, top to bottom | Contacts | 29 | Module navigation; not opened | M11 | new |
| ML-14 | Sidebar, top to bottom | Accounts | 30 | Module navigation; not opened | M11 | new |
| ML-15 | Sidebar, top to bottom | Deals | 31 | Module navigation; not opened | M11 | new |
| ML-16 | Sidebar, top to bottom | Tasks | 32 | Module navigation; not opened | M11 | new |
| ML-17 | Sidebar, top to bottom | Meetings | 33 | Module navigation; not opened | M11 | new |
| ML-18 | Sidebar, top to bottom | Calls | 34 | Module navigation; not opened | M11 | new |
| ML-19 | Sidebar, top to bottom | Products | 35 | Module navigation; not opened | M11 | new |
| ML-20 | Sidebar, top to bottom | Quotes | 36 | Module navigation; not opened | M11 | new |
| ML-21 | Sidebar, top to bottom | Sales Orders | 37 | Module navigation; not opened | M11 | new |
| ML-22 | Sidebar, top to bottom | Purchase Orders | 38 | Module navigation; not opened | M11 | new |
| ML-23 | Sidebar, top to bottom | Invoices | 39 | Module navigation; not opened | M11 | new |
| ML-24 | Sidebar, top to bottom | Campaigns | 40 | Module navigation; not opened | M11 | new |
| ML-25 | Sidebar, top to bottom | Vendors | 41 | Module navigation; not opened | M11 | new |
| ML-26 | Sidebar, top to bottom | Price Books | 42 | Module navigation; not opened | M11 | new |
| ML-27 | Sidebar, top to bottom | Cases | 43 | Module navigation; not opened | M11 | new |
| ML-28 | Sidebar, top to bottom | Solutions | 44 | Module navigation; not opened | M11 | new |
| ML-29 | Module tab strip, left to right | Layouts | 45, 46 | Selected on entry | M11 | new |
| ML-30 | Module tab strip, left to right | Layout Rules | 47, 48 | Visible navigation tab; continuation evidence below | M11 | new |
| ML-31 | Module tab strip, left to right | Validation Rules | 49, 50 | Visible navigation tab; continuation evidence below | M11 | new |
| ML-32 | Module tab strip, left to right | Fields | 51, 52 | Visible navigation tab; continuation evidence below | M11 | new |
| ML-33 | Module tab strip, left to right | Record Locking Configuration | 53, 54 | Visible navigation tab; continuation evidence below | M11 | new |
| ML-34 | Module tab strip, left to right | Map Dependency Fields | 55, 56 | Visible navigation tab; continuation evidence below | M11 | new |
| ML-35 | Module tab strip, left to right | Links | 57, 58 | Visible navigation tab; continuation evidence below | M11 | new |
| ML-36 | Module tab strip, left to right | Buttons | 59, 60 | Visible navigation tab; continuation evidence below | M11 | new |
| ML-37 | Module tab strip, left to right | Summary | 61, 62 | Visible navigation tab; continuation evidence below | M11 | new |
| ML-38 | Content right edge | Contextual help | 63 | Not opened | M11 | new |
| ML-39 | Above table right | Create New Layout | 64, 65 | Creation entry; forbidden, not opened | M11 | new |
| ML-40 | Table, Name column | Default layout name link | 67, 68 | Editor destination; forbidden, not opened | M11 | new |
| ML-41 | Table, beside layout name | More menu | 69 | Forbidden, not opened | M11 | new |
| ML-42 | Table, Status column | Layout status switch | 70, 71 | Appears on; never toggled; availability unverified | M11 | new |
| ML-43 | Bottom utility strip | My Pins | 90 | Not opened | Shell | Contacts shell |
| ML-44 | Bottom utility strip | Chats | 91 | Not opened | Shell | Contacts shell |
| ML-45 | Bottom utility strip | Contacts | 92 | Not opened | Shell | Contacts shell |
| ML-46 | Bottom utility strip | Command palette | 93 | Not opened | Shell | Contacts shell |
| ML-47 | Bottom utility strip | Announcements | 94 | Not opened | Shell | Contacts shell |
| ML-48 | Bottom utility strip | Motivator | 95 | Not opened | Shell | Contacts shell |
| ML-49 | Bottom utility strip | Sticky Notes | 96 | Not opened | Shell | Contacts shell |
| ML-50 | Bottom utility strip | Activity Reminders | 97 | Not opened | Shell | Contacts shell |
| ML-51 | Bottom utility strip | Recent Items | 98 | Not opened | Shell | Contacts shell |
| ML-52 | Bottom utility strip | Accessibility | 99 | Not opened | Shell | Contacts shell |
| ML-53 | Bottom utility strip | Help | 100 | Not opened | Shell | Contacts shell |

### Reconciliation — Leads Layouts

`controls.json` 109 → inventory 53 logical controls;
72 raw entries represented; 37 excluded.
Arithmetic: 72 + 37 = 109. Duplicate represented entries:
19. No screenshot-only control was needed.

Excluded entries: 1, 2, 5, 9, 10, 12, 13, 15, 16, 19, 20, 25, 66, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 101, 102, 106, 107, 108, 109.
Reasons: hidden/zero-area shell and overlay placeholders (1–2, 9–10,
12–13, 15–16, 19–20, 25, 72–88, 101–102); navigation container 5;
static table-row wrapper 66; bottom-strip wrapper 89; body and nonoverflowing
scroll containers 106–109. Screenshot inspection confirms no missing visible
controls in these exclusions. Back-icon descendants and search-icon SVG are
reconciled with their logical parent controls.

### Capture and request delta — continuation

- `m11r1-leads-layouts`: start `/crm/<org>/settings/modules`, one exact
  exported Leads selector clicked; final neutral route
  `/crm/<org>/settings/modules/Leads/layouts`. Captured 2026-10-22 20:24:32 UTC.
- Complete screenshot, aria, page, controls, network, meta and progress evidence
  retained in the research workspace. Ready gate passed (113 ms); failed script
  loads: zero. The same known `_sortableParentData` noise appears; screenshot
  is fully painted. No other page error is recorded.
- One live attempt. A preceding sandbox denial occurred at output-directory
  creation, before browser attachment; it was not a reference-screen attempt.
- One click, name Leads, result clicked. No skipped clicks, editor, toggle,
  drag, hover, scroll, popup, file chooser, download or print occurred. No extra
  shared-browser tabs were closed by this agent.
- Successful non-GET set is unchanged: page-initiated passive/read
  `PageLayout.do` once and visitor `triggers` once, both 200.
- Refused reminder and notification paths: once each (unchanged).
  Refused telemetry `urlMonitor`: twice (unchanged); `logs`: three times
  (baseline once, **+2**). New refused telemetry paths: `/:id/clientmetricslog`
  once and `/:id/telemetry/customMetrics` once. Total refusals: **9 vs 5**.
- The previous run stopped at this delta. CTO subsequently classified refused
  telemetry changes as known noise and authorized continuation. These requests
  never left the browser; no successful settings write is evidenced.
- Current stop rule: a new successful 2xx non-GET path/count outside the accepted
  PageLayout/visitor exceptions; a genuinely blank/partial image; or a click
  opening an editor, menu or modal instead of a tab. Close unexpected overlays
  with Escape/Cancel without saving. A tool-failed tab is skipped for this run.


## Leads — Validation Rules

Source: **seen, `m11r1-leads-validation-rules` screenshot**, reconciled with its one-based
`controls.json`. The tab is fully painted. An empty rules table has Field Name, Validate Using,
Executes On, Last Modified and Status columns. A static empty-state message
occupies the table body. No rule rows or status switches are present.

| # | Position | Control | Raw entries | Observed behaviour / limit | Owning module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- |
| VR-01 | Top utility strip | Search records | 3 | Not opened or typed | Shell | Contacts shell |
| VR-02 | Top utility strip | Quick create | 4 | Not opened or typed | Shell | Contacts shell |
| VR-03 | Top utility strip | Assistant | 6 | Not opened or typed | Shell | Contacts shell |
| VR-04 | Top utility strip | Notifications | 7 | Not opened or typed | Shell | Contacts shell |
| VR-05 | Top utility strip | Calendar | 8 | Not opened or typed | Shell | Contacts shell |
| VR-06 | Top utility strip | Marketplace | 11 | Not opened or typed | Shell | Contacts shell |
| VR-07 | Top utility strip | Setup | 14 | Not opened or typed | Shell | Contacts shell |
| VR-08 | Top utility strip | Profile | 17, 18 | Not opened or typed | Shell | Contacts shell |
| VR-09 | Top utility strip | Applications menu | 21, 22, 23, 24 | Not opened or typed | Shell | Contacts shell |
| VR-10 | Sidebar header | Back to Modules | 26, 98, 99 | Back affordance visible; not clicked | M11 | new |
| VR-11 | Sidebar header right | Module search icon | 27, 100 | Not opened; input behaviour unobserved | M11 | new |
| VR-12 | Sidebar, top to bottom | Leads | 28 | Selected | M11 | new |
| VR-13 | Sidebar, top to bottom | Contacts | 29 | Module navigation; not opened | M11 | new |
| VR-14 | Sidebar, top to bottom | Accounts | 30 | Module navigation; not opened | M11 | new |
| VR-15 | Sidebar, top to bottom | Deals | 31 | Module navigation; not opened | M11 | new |
| VR-16 | Sidebar, top to bottom | Tasks | 32 | Module navigation; not opened | M11 | new |
| VR-17 | Sidebar, top to bottom | Meetings | 33 | Module navigation; not opened | M11 | new |
| VR-18 | Sidebar, top to bottom | Calls | 34 | Module navigation; not opened | M11 | new |
| VR-19 | Sidebar, top to bottom | Products | 35 | Module navigation; not opened | M11 | new |
| VR-20 | Sidebar, top to bottom | Quotes | 36 | Module navigation; not opened | M11 | new |
| VR-21 | Sidebar, top to bottom | Sales Orders | 37 | Module navigation; not opened | M11 | new |
| VR-22 | Sidebar, top to bottom | Purchase Orders | 38 | Module navigation; not opened | M11 | new |
| VR-23 | Sidebar, top to bottom | Invoices | 39 | Module navigation; not opened | M11 | new |
| VR-24 | Sidebar, top to bottom | Campaigns | 40 | Module navigation; not opened | M11 | new |
| VR-25 | Sidebar, top to bottom | Vendors | 41 | Module navigation; not opened | M11 | new |
| VR-26 | Sidebar, top to bottom | Price Books | 42 | Module navigation; not opened | M11 | new |
| VR-27 | Sidebar, top to bottom | Cases | 43 | Module navigation; not opened | M11 | new |
| VR-28 | Sidebar, top to bottom | Solutions | 44 | Module navigation; not opened | M11 | new |
| VR-29 | Module tab strip, left to right | Layouts | 45, 46 | Visible navigation tab; not operated in this capture | M11 | new |
| VR-30 | Module tab strip, left to right | Layout Rules | 47, 48 | Visible navigation tab; not operated in this capture | M11 | new |
| VR-31 | Module tab strip, left to right | Validation Rules | 49, 50 | Selected initial state | M11 | new |
| VR-32 | Module tab strip, left to right | Fields | 51, 52 | Visible navigation tab; not operated in this capture | M11 | new |
| VR-33 | Module tab strip, left to right | Record Locking Configuration | 53, 54 | Visible navigation tab; not operated in this capture | M11 | new |
| VR-34 | Module tab strip, left to right | Map Dependency Fields | 55, 56 | Visible navigation tab; not operated in this capture | M11 | new |
| VR-35 | Module tab strip, left to right | Links | 57, 58 | Visible navigation tab; not operated in this capture | M11 | new |
| VR-36 | Module tab strip, left to right | Buttons | 59, 60 | Visible navigation tab; not operated in this capture | M11 | new |
| VR-37 | Module tab strip, left to right | Summary | 61, 62 | Visible navigation tab; not operated in this capture | M11 | new |
| VR-38 | Content right edge | Contextual help | 64 | Not opened | M11 | new |
| VR-39 | Bottom utility strip | My Pins | 86 | Not opened | Shell | Contacts shell |
| VR-40 | Bottom utility strip | Chats | 87 | Not opened | Shell | Contacts shell |
| VR-41 | Bottom utility strip | Contacts | 88 | Not opened | Shell | Contacts shell |
| VR-42 | Bottom utility strip | Command palette | 89 | Not opened | Shell | Contacts shell |
| VR-43 | Bottom utility strip | Announcements | 90 | Not opened | Shell | Contacts shell |
| VR-44 | Bottom utility strip | Motivator | 91 | Not opened | Shell | Contacts shell |
| VR-45 | Bottom utility strip | Sticky Notes | 92 | Not opened | Shell | Contacts shell |
| VR-46 | Bottom utility strip | Activity Reminders | 93 | Not opened | Shell | Contacts shell |
| VR-47 | Bottom utility strip | Recent Items | 94 | Not opened | Shell | Contacts shell |
| VR-48 | Bottom utility strip | Accessibility | 95 | Not opened | Shell | Contacts shell |
| VR-49 | Bottom utility strip | Help | 96 | Not opened | Shell | Contacts shell |
| VR-50 | Content above table, right | Create New Validation Rule | 65, 66 | Creation entry; forbidden, not opened | M11 | new |

Reconciliation: 104 raw entries → 50 logical controls;
67 represented + 37 excluded = 104.
Excluded entries: 1, 2, 5, 9, 10, 12, 13, 15, 16, 19, 20, 25, 63, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 97, 101, 102, 103, 104.
Exclusions are static descriptions/table wrappers, navigation/utility containers,
hidden zero-area overlays, body and scroll-region wrappers, as checked
against the screenshot. Screen-specific overflow controls are listed separately.

## Leads — Fields

Source: **seen, `m11r1-leads-fields` screenshot**, reconciled with its one-based
`controls.json`. The tab is fully painted with Field Listing selected. Field Permissions and
AI Governance are visible subordinate tabs; neither was opened. The empty search
is above a table with Fields, Data Type and Custom Field columns. Ten whole rows
and part of the next row are visible; further definitions extend below the
content viewport. The visible field labels are plain text, not separate controls.
No custom-field marker is visible on the initial rows. Metadata remains the model
source; a partial screen list does not establish the complete field set.

| # | Position | Control | Raw entries | Observed behaviour / limit | Owning module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- |
| FL-01 | Top utility strip | Search records | 3 | Not opened or typed | Shell | Contacts shell |
| FL-02 | Top utility strip | Quick create | 4 | Not opened or typed | Shell | Contacts shell |
| FL-03 | Top utility strip | Assistant | 6 | Not opened or typed | Shell | Contacts shell |
| FL-04 | Top utility strip | Notifications | 7 | Not opened or typed | Shell | Contacts shell |
| FL-05 | Top utility strip | Calendar | 8 | Not opened or typed | Shell | Contacts shell |
| FL-06 | Top utility strip | Marketplace | 11 | Not opened or typed | Shell | Contacts shell |
| FL-07 | Top utility strip | Setup | 14 | Not opened or typed | Shell | Contacts shell |
| FL-08 | Top utility strip | Profile | 17, 18 | Not opened or typed | Shell | Contacts shell |
| FL-09 | Top utility strip | Applications menu | 21, 22, 23, 24 | Not opened or typed | Shell | Contacts shell |
| FL-10 | Sidebar header | Back to Modules | 26, 103, 104 | Back affordance visible; not clicked | M11 | new |
| FL-11 | Sidebar header right | Module search icon | 27, 105 | Not opened; input behaviour unobserved | M11 | new |
| FL-12 | Sidebar, top to bottom | Leads | 28 | Selected | M11 | new |
| FL-13 | Sidebar, top to bottom | Contacts | 29 | Module navigation; not opened | M11 | new |
| FL-14 | Sidebar, top to bottom | Accounts | 30 | Module navigation; not opened | M11 | new |
| FL-15 | Sidebar, top to bottom | Deals | 31 | Module navigation; not opened | M11 | new |
| FL-16 | Sidebar, top to bottom | Tasks | 32 | Module navigation; not opened | M11 | new |
| FL-17 | Sidebar, top to bottom | Meetings | 33 | Module navigation; not opened | M11 | new |
| FL-18 | Sidebar, top to bottom | Calls | 34 | Module navigation; not opened | M11 | new |
| FL-19 | Sidebar, top to bottom | Products | 35 | Module navigation; not opened | M11 | new |
| FL-20 | Sidebar, top to bottom | Quotes | 36 | Module navigation; not opened | M11 | new |
| FL-21 | Sidebar, top to bottom | Sales Orders | 37 | Module navigation; not opened | M11 | new |
| FL-22 | Sidebar, top to bottom | Purchase Orders | 38 | Module navigation; not opened | M11 | new |
| FL-23 | Sidebar, top to bottom | Invoices | 39 | Module navigation; not opened | M11 | new |
| FL-24 | Sidebar, top to bottom | Campaigns | 40 | Module navigation; not opened | M11 | new |
| FL-25 | Sidebar, top to bottom | Vendors | 41 | Module navigation; not opened | M11 | new |
| FL-26 | Sidebar, top to bottom | Price Books | 42 | Module navigation; not opened | M11 | new |
| FL-27 | Sidebar, top to bottom | Cases | 43 | Module navigation; not opened | M11 | new |
| FL-28 | Sidebar, top to bottom | Solutions | 44 | Module navigation; not opened | M11 | new |
| FL-29 | Module tab strip, left to right | Layouts | 45, 46 | Visible navigation tab; not operated in this capture | M11 | new |
| FL-30 | Module tab strip, left to right | Layout Rules | 47, 48 | Visible navigation tab; not operated in this capture | M11 | new |
| FL-31 | Module tab strip, left to right | Validation Rules | 49, 50 | Visible navigation tab; not operated in this capture | M11 | new |
| FL-32 | Module tab strip, left to right | Fields | 51, 52 | Selected initial state | M11 | new |
| FL-33 | Module tab strip, left to right | Record Locking Configuration | 53, 54 | Visible navigation tab; not operated in this capture | M11 | new |
| FL-34 | Module tab strip, left to right | Map Dependency Fields | 55, 56 | Visible navigation tab; not operated in this capture | M11 | new |
| FL-35 | Module tab strip, left to right | Links | 57, 58 | Visible navigation tab; not operated in this capture | M11 | new |
| FL-36 | Module tab strip, left to right | Buttons | 59, 60 | Visible navigation tab; not operated in this capture | M11 | new |
| FL-37 | Module tab strip, left to right | Summary | 61, 62 | Visible navigation tab; not operated in this capture | M11 | new |
| FL-38 | Module tab strip, right | Fields help | 106 | Not opened | M11 | new |
| FL-39 | Bottom utility strip | My Pins | 91 | Not opened | Shell | Contacts shell |
| FL-40 | Bottom utility strip | Chats | 92 | Not opened | Shell | Contacts shell |
| FL-41 | Bottom utility strip | Contacts | 93 | Not opened | Shell | Contacts shell |
| FL-42 | Bottom utility strip | Command palette | 94 | Not opened | Shell | Contacts shell |
| FL-43 | Bottom utility strip | Announcements | 95 | Not opened | Shell | Contacts shell |
| FL-44 | Bottom utility strip | Motivator | 96 | Not opened | Shell | Contacts shell |
| FL-45 | Bottom utility strip | Sticky Notes | 97 | Not opened | Shell | Contacts shell |
| FL-46 | Bottom utility strip | Activity Reminders | 98 | Not opened | Shell | Contacts shell |
| FL-47 | Bottom utility strip | Recent Items | 99 | Not opened | Shell | Contacts shell |
| FL-48 | Bottom utility strip | Accessibility | 100 | Not opened | Shell | Contacts shell |
| FL-49 | Bottom utility strip | Help | 101 | Not opened | Shell | Contacts shell |
| FL-50 | Content subtab strip, left | Field Listing | 63, 64 | Selected initial subtab | M11 | new |
| FL-51 | Content subtab strip, middle | Field Permissions | 65, 66 | Visible subordinate tab; not opened | M11 | new |
| FL-52 | Content subtab strip, right | AI Governance | 67, 68 | Visible subordinate tab; not opened | M11 | new |
| FL-53 | Above table, left | Search Fields or Data Types | 69, 107 | Empty search input with glyph; not typed | M11 | new |
| FL-54 | Above table, right | Create and Edit Fields | 70, 71 | Editor entry; forbidden, not opened | M11 | new |

Reconciliation: 111 raw entries → 54 logical controls;
75 represented + 36 excluded = 111.
Excluded entries: 1, 2, 5, 9, 10, 12, 13, 15, 16, 19, 20, 25, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 102, 108, 109, 110, 111.
Exclusions are static descriptions/table wrappers, navigation/utility containers,
hidden zero-area overlays, body and scroll-region wrappers, as checked
against the screenshot. Screen-specific overflow controls are listed separately.


## Leads — Record Locking Configuration

Source: **seen, `m11r1-leads-record-locking` screenshot**, reconciled with its one-based
`controls.json`. The fully painted initial state contains explanatory text and a Configure Now
entry, rather than a configured-rules table. The text describes restricting
changes to locked records; configuration details and allowed actions are
unobserved. The help control is beside the main tab strip.

| # | Position | Control | Raw entries | Observed behaviour / limit | Owning module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- |
| RL-01 | Top utility strip | Search records | 3 | Not opened or typed | Shell | Contacts shell |
| RL-02 | Top utility strip | Quick create | 4 | Not opened or typed | Shell | Contacts shell |
| RL-03 | Top utility strip | Assistant | 6 | Not opened or typed | Shell | Contacts shell |
| RL-04 | Top utility strip | Notifications | 7 | Not opened or typed | Shell | Contacts shell |
| RL-05 | Top utility strip | Calendar | 8 | Not opened or typed | Shell | Contacts shell |
| RL-06 | Top utility strip | Marketplace | 11 | Not opened or typed | Shell | Contacts shell |
| RL-07 | Top utility strip | Setup | 14 | Not opened or typed | Shell | Contacts shell |
| RL-08 | Top utility strip | Profile | 17, 18 | Not opened or typed | Shell | Contacts shell |
| RL-09 | Top utility strip | Applications menu | 21, 22, 23, 24 | Not opened or typed | Shell | Contacts shell |
| RL-10 | Sidebar header | Back to Modules | 26, 99, 100 | Back affordance visible; not clicked | M11 | new |
| RL-11 | Sidebar header right | Module search icon | 27, 101 | Not opened; input behaviour unobserved | M11 | new |
| RL-12 | Sidebar, top to bottom | Leads | 28 | Selected | M11 | new |
| RL-13 | Sidebar, top to bottom | Contacts | 29 | Module navigation; not opened | M11 | new |
| RL-14 | Sidebar, top to bottom | Accounts | 30 | Module navigation; not opened | M11 | new |
| RL-15 | Sidebar, top to bottom | Deals | 31 | Module navigation; not opened | M11 | new |
| RL-16 | Sidebar, top to bottom | Tasks | 32 | Module navigation; not opened | M11 | new |
| RL-17 | Sidebar, top to bottom | Meetings | 33 | Module navigation; not opened | M11 | new |
| RL-18 | Sidebar, top to bottom | Calls | 34 | Module navigation; not opened | M11 | new |
| RL-19 | Sidebar, top to bottom | Products | 35 | Module navigation; not opened | M11 | new |
| RL-20 | Sidebar, top to bottom | Quotes | 36 | Module navigation; not opened | M11 | new |
| RL-21 | Sidebar, top to bottom | Sales Orders | 37 | Module navigation; not opened | M11 | new |
| RL-22 | Sidebar, top to bottom | Purchase Orders | 38 | Module navigation; not opened | M11 | new |
| RL-23 | Sidebar, top to bottom | Invoices | 39 | Module navigation; not opened | M11 | new |
| RL-24 | Sidebar, top to bottom | Campaigns | 40 | Module navigation; not opened | M11 | new |
| RL-25 | Sidebar, top to bottom | Vendors | 41 | Module navigation; not opened | M11 | new |
| RL-26 | Sidebar, top to bottom | Price Books | 42 | Module navigation; not opened | M11 | new |
| RL-27 | Sidebar, top to bottom | Cases | 43 | Module navigation; not opened | M11 | new |
| RL-28 | Sidebar, top to bottom | Solutions | 44 | Module navigation; not opened | M11 | new |
| RL-29 | Module tab strip, left to right | Layouts | 45, 46 | Visible navigation tab; not operated in this capture | M11 | new |
| RL-30 | Module tab strip, left to right | Layout Rules | 47, 48 | Visible navigation tab; not operated in this capture | M11 | new |
| RL-31 | Module tab strip, left to right | Validation Rules | 49, 50 | Visible navigation tab; not operated in this capture | M11 | new |
| RL-32 | Module tab strip, left to right | Fields | 51, 52 | Visible navigation tab; not operated in this capture | M11 | new |
| RL-33 | Module tab strip, left to right | Record Locking Configuration | 53, 54 | Selected initial state | M11 | new |
| RL-34 | Module tab strip, left to right | Map Dependency Fields | 55, 56 | Visible navigation tab; not operated in this capture | M11 | new |
| RL-35 | Module tab strip, left to right | Links | 57, 58 | Visible navigation tab; not operated in this capture | M11 | new |
| RL-36 | Module tab strip, left to right | Buttons | 59, 60 | Visible navigation tab; not operated in this capture | M11 | new |
| RL-37 | Module tab strip, left to right | Summary | 61, 62 | Visible navigation tab; not operated in this capture | M11 | new |
| RL-38 | Module tab strip, right | Record locking help | 63 | Not opened | M11 | new |
| RL-39 | Bottom utility strip | My Pins | 87 | Not opened | Shell | Contacts shell |
| RL-40 | Bottom utility strip | Chats | 88 | Not opened | Shell | Contacts shell |
| RL-41 | Bottom utility strip | Contacts | 89 | Not opened | Shell | Contacts shell |
| RL-42 | Bottom utility strip | Command palette | 90 | Not opened | Shell | Contacts shell |
| RL-43 | Bottom utility strip | Announcements | 91 | Not opened | Shell | Contacts shell |
| RL-44 | Bottom utility strip | Motivator | 92 | Not opened | Shell | Contacts shell |
| RL-45 | Bottom utility strip | Sticky Notes | 93 | Not opened | Shell | Contacts shell |
| RL-46 | Bottom utility strip | Activity Reminders | 94 | Not opened | Shell | Contacts shell |
| RL-47 | Bottom utility strip | Recent Items | 95 | Not opened | Shell | Contacts shell |
| RL-48 | Bottom utility strip | Accessibility | 96 | Not opened | Shell | Contacts shell |
| RL-49 | Bottom utility strip | Help | 97 | Not opened | Shell | Contacts shell |
| RL-50 | Content upper left | Configure Now | 64, 65 | Configuration entry; forbidden, not opened | M11 | new |

Reconciliation: 104 raw entries → 50 logical controls;
67 represented + 37 excluded = 104.
Excluded entries: 1, 2, 5, 9, 10, 12, 13, 15, 16, 19, 20, 25, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 98, 102, 103, 104.
Exclusions are static descriptions/table wrappers, navigation/utility containers,
hidden zero-area overlays, body and scroll-region wrappers, as checked
against the screenshot. Screen-specific overflow controls are listed separately.


## Leads — Map Dependency Fields

Source: **seen, `m11r1-leads-dependencies` screenshot**, reconciled with its one-based
`controls.json`. The fully painted state has introductory text, a layout dropdown and a creation
button. The table has Parent Field, Child Field and Last Modified columns, with
a static empty mapping message. The introductory text describes dependencies
between supported choice-field types, with multi-select choices as children.
No mapping rows or row actions are visible. The default layout is preselected;
its option list and switching behaviour were not inspected.

| # | Position | Control | Raw entries | Observed behaviour / limit | Owning module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- |
| MD-01 | Top utility strip | Search records | 3 | Not opened or typed | Shell | Contacts shell |
| MD-02 | Top utility strip | Quick create | 4 | Not opened or typed | Shell | Contacts shell |
| MD-03 | Top utility strip | Assistant | 6 | Not opened or typed | Shell | Contacts shell |
| MD-04 | Top utility strip | Notifications | 7 | Not opened or typed | Shell | Contacts shell |
| MD-05 | Top utility strip | Calendar | 8 | Not opened or typed | Shell | Contacts shell |
| MD-06 | Top utility strip | Marketplace | 11 | Not opened or typed | Shell | Contacts shell |
| MD-07 | Top utility strip | Setup | 14 | Not opened or typed | Shell | Contacts shell |
| MD-08 | Top utility strip | Profile | 17, 18 | Not opened or typed | Shell | Contacts shell |
| MD-09 | Top utility strip | Applications menu | 21, 22, 23, 24 | Not opened or typed | Shell | Contacts shell |
| MD-10 | Sidebar header | Back to Modules | 26, 102, 103 | Back affordance visible; not clicked | M11 | new |
| MD-11 | Sidebar header right | Module search icon | 27, 104 | Not opened; input behaviour unobserved | M11 | new |
| MD-12 | Sidebar, top to bottom | Leads | 28 | Selected | M11 | new |
| MD-13 | Sidebar, top to bottom | Contacts | 29 | Module navigation; not opened | M11 | new |
| MD-14 | Sidebar, top to bottom | Accounts | 30 | Module navigation; not opened | M11 | new |
| MD-15 | Sidebar, top to bottom | Deals | 31 | Module navigation; not opened | M11 | new |
| MD-16 | Sidebar, top to bottom | Tasks | 32 | Module navigation; not opened | M11 | new |
| MD-17 | Sidebar, top to bottom | Meetings | 33 | Module navigation; not opened | M11 | new |
| MD-18 | Sidebar, top to bottom | Calls | 34 | Module navigation; not opened | M11 | new |
| MD-19 | Sidebar, top to bottom | Products | 35 | Module navigation; not opened | M11 | new |
| MD-20 | Sidebar, top to bottom | Quotes | 36 | Module navigation; not opened | M11 | new |
| MD-21 | Sidebar, top to bottom | Sales Orders | 37 | Module navigation; not opened | M11 | new |
| MD-22 | Sidebar, top to bottom | Purchase Orders | 38 | Module navigation; not opened | M11 | new |
| MD-23 | Sidebar, top to bottom | Invoices | 39 | Module navigation; not opened | M11 | new |
| MD-24 | Sidebar, top to bottom | Campaigns | 40 | Module navigation; not opened | M11 | new |
| MD-25 | Sidebar, top to bottom | Vendors | 41 | Module navigation; not opened | M11 | new |
| MD-26 | Sidebar, top to bottom | Price Books | 42 | Module navigation; not opened | M11 | new |
| MD-27 | Sidebar, top to bottom | Cases | 43 | Module navigation; not opened | M11 | new |
| MD-28 | Sidebar, top to bottom | Solutions | 44 | Module navigation; not opened | M11 | new |
| MD-29 | Module tab strip, left to right | Layouts | 45, 46 | Visible navigation tab; not operated in this capture | M11 | new |
| MD-30 | Module tab strip, left to right | Layout Rules | 47, 48 | Visible navigation tab; not operated in this capture | M11 | new |
| MD-31 | Module tab strip, left to right | Validation Rules | 49, 50 | Visible navigation tab; not operated in this capture | M11 | new |
| MD-32 | Module tab strip, left to right | Fields | 51, 52 | Visible navigation tab; not operated in this capture | M11 | new |
| MD-33 | Module tab strip, left to right | Record Locking Configuration | 53, 54 | Visible navigation tab; not operated in this capture | M11 | new |
| MD-34 | Module tab strip, left to right | Map Dependency Fields | 55, 56 | Selected initial state | M11 | new |
| MD-35 | Module tab strip, left to right | Links | 57, 58 | Visible navigation tab; not operated in this capture | M11 | new |
| MD-36 | Module tab strip, left to right | Buttons | 59, 60 | Visible navigation tab; not operated in this capture | M11 | new |
| MD-37 | Module tab strip, left to right | Summary | 61, 62 | Visible navigation tab; not operated in this capture | M11 | new |
| MD-38 | Content introduction, right | Dependency help | 65 | Not opened | M11 | new |
| MD-39 | Bottom utility strip | My Pins | 90 | Not opened | Shell | Contacts shell |
| MD-40 | Bottom utility strip | Chats | 91 | Not opened | Shell | Contacts shell |
| MD-41 | Bottom utility strip | Contacts | 92 | Not opened | Shell | Contacts shell |
| MD-42 | Bottom utility strip | Command palette | 93 | Not opened | Shell | Contacts shell |
| MD-43 | Bottom utility strip | Announcements | 94 | Not opened | Shell | Contacts shell |
| MD-44 | Bottom utility strip | Motivator | 95 | Not opened | Shell | Contacts shell |
| MD-45 | Bottom utility strip | Sticky Notes | 96 | Not opened | Shell | Contacts shell |
| MD-46 | Bottom utility strip | Activity Reminders | 97 | Not opened | Shell | Contacts shell |
| MD-47 | Bottom utility strip | Recent Items | 98 | Not opened | Shell | Contacts shell |
| MD-48 | Bottom utility strip | Accessibility | 99 | Not opened | Shell | Contacts shell |
| MD-49 | Bottom utility strip | Help | 100 | Not opened | Shell | Contacts shell |
| MD-50 | Above table, left | Layout selector | 66, 67, 68, 108 | Default layout selected; not opened or changed | M11 | new |
| MD-51 | Above table, right | Create Map Dependency | 69, 70 | Creation entry; forbidden, not opened | M11 | new |

Reconciliation: 108 raw entries → 51 logical controls;
71 represented + 37 excluded = 108.
Excluded entries: 1, 2, 5, 9, 10, 12, 13, 15, 16, 19, 20, 25, 63, 64, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 101, 105, 106, 107.
Exclusions are static descriptions/table wrappers, navigation/utility containers,
hidden zero-area overlays, body and scroll-region wrappers, as checked
against the screenshot. Screen-specific overflow controls are listed separately.


## Leads — Links failure state (invalid acceptance evidence)

Source: **seen, `m11r1-leads-links` screenshot**. One unique Links tab click
reached `/crm/<org>/settings/modules/Leads/custom-link`. The module sidebar,
heading, tab strip and Links content disappeared. The content card is blank
except for a static `[object Object]` error rendering. The top and bottom shell
remain. This is a **failed paint gate**, not an empty Links list or an accepted
reference design. No dialog, editor or menu appeared. No retry or recovery
navigation was attempted; live inspection stopped, so Buttons and Summary were
not opened.

Pre-click readiness succeeded (44 ms; no failed scripts), but that only proves
the source tab was ready. Two `XMLHttpRequest` page errors appear in addition
to known sorting-library noise. A refused POST to the neutral path
`/crm/v9/settings/profiles/actions/get_assigned` is new; it did not leave the
browser. Its refusal may relate to the rendering failure, but causation is
unproven. No guard was relaxed, request replayed or capture tool changed.
Successful non-GET calls remain the two accepted passive/read exceptions.

The inventory below is **invalid acceptance evidence**: it covers only the failed screen's visible shell controls.
It does not substitute for the intended Links initial-screen inventory.

| # | Position | Control | Raw entries | Observed behaviour / limit | Owning module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- |
| LE-01 | Top utility strip | Search records | 3 | Visible shell control; not operated | Shell | Contacts shell |
| LE-02 | Top utility strip | Quick create | 4 | Visible shell control; not operated | Shell | Contacts shell |
| LE-03 | Top utility strip | Assistant | 6 | Visible shell control; not operated | Shell | Contacts shell |
| LE-04 | Top utility strip | Notifications | 7 | Visible shell control; not operated | Shell | Contacts shell |
| LE-05 | Top utility strip | Calendar | 8 | Visible shell control; not operated | Shell | Contacts shell |
| LE-06 | Top utility strip | Marketplace | 11 | Visible shell control; not operated | Shell | Contacts shell |
| LE-07 | Top utility strip | Setup | 14 | Visible shell control; not operated | Shell | Contacts shell |
| LE-08 | Top utility strip | Profile | 17, 18 | Visible shell control; not operated | Shell | Contacts shell |
| LE-09 | Top utility strip | Applications menu | 21, 22, 23, 24 | Visible shell control; not operated | Shell | Contacts shell |
| LE-10 | Bottom utility strip | My Pins | 43 | Visible shell control; not operated | Shell | Contacts shell |
| LE-11 | Bottom utility strip | Chats | 44 | Visible shell control; not operated | Shell | Contacts shell |
| LE-12 | Bottom utility strip | Contacts | 45 | Visible shell control; not operated | Shell | Contacts shell |
| LE-13 | Bottom utility strip | Command palette | 46 | Visible shell control; not operated | Shell | Contacts shell |
| LE-14 | Bottom utility strip | Announcements | 47 | Visible shell control; not operated | Shell | Contacts shell |
| LE-15 | Bottom utility strip | Motivator | 48 | Visible shell control; not operated | Shell | Contacts shell |
| LE-16 | Bottom utility strip | Sticky Notes | 49 | Visible shell control; not operated | Shell | Contacts shell |
| LE-17 | Bottom utility strip | Activity Reminders | 50 | Visible shell control; not operated | Shell | Contacts shell |
| LE-18 | Bottom utility strip | Recent Items | 51 | Visible shell control; not operated | Shell | Contacts shell |
| LE-19 | Bottom utility strip | Accessibility | 52 | Visible shell control; not operated | Shell | Contacts shell |
| LE-20 | Bottom utility strip | Help | 53 | Visible shell control; not operated | Shell | Contacts shell |

Reconciliation: 55 raw entries → 20 logical controls;
24 represented + 31 excluded = 55.
Excluded entries: 1, 2, 5, 9, 10, 12, 13, 15, 16, 19, 20, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 54, 55.
Exclusions: shell containers, hidden/zero-area overlay placeholders, the static
error-text node (25), body and content-card wrappers. No content control survives.


## Leads — Layout Rules (continuation)

Source: **seen, `m11r1-leads-layout-rules-cont` screenshot**, reconciled against one-based
`controls.json`. The initial screen is fully painted. An explanatory line precedes the creation
entry and an empty table with Name, Primary Field, Last Modified and Status
columns. No configured rule row or status toggle is visible.

| # | Position | Control | Raw entries | Observed behaviour / limit | Owning module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- |
| LR-01 | Top utility strip | Search records | 3 | Not opened or typed | Shell | Contacts shell |
| LR-02 | Top utility strip | Quick create | 4 | Not opened or typed | Shell | Contacts shell |
| LR-03 | Top utility strip | Assistant | 6 | Not opened or typed | Shell | Contacts shell |
| LR-04 | Top utility strip | Notifications | 7 | Not opened or typed | Shell | Contacts shell |
| LR-05 | Top utility strip | Calendar | 8 | Not opened or typed | Shell | Contacts shell |
| LR-06 | Top utility strip | Marketplace | 11 | Not opened or typed | Shell | Contacts shell |
| LR-07 | Top utility strip | Setup | 14 | Not opened or typed | Shell | Contacts shell |
| LR-08 | Top utility strip | Profile | 17, 18 | Not opened or typed | Shell | Contacts shell |
| LR-09 | Top utility strip | Applications menu | 21, 22, 23, 24 | Not opened or typed | Shell | Contacts shell |
| LR-10 | Sidebar header | Back to Modules | 26, 99, 100 | Back affordance visible; not clicked | M11 | new |
| LR-11 | Sidebar header right | Module search icon | 27, 101 | Not opened; input behaviour unobserved | M11 | new |
| LR-12 | Sidebar, top to bottom | Leads | 28 | Selected | M11 | new |
| LR-13 | Sidebar, top to bottom | Contacts | 29 | Module navigation; not opened | M11 | new |
| LR-14 | Sidebar, top to bottom | Accounts | 30 | Module navigation; not opened | M11 | new |
| LR-15 | Sidebar, top to bottom | Deals | 31 | Module navigation; not opened | M11 | new |
| LR-16 | Sidebar, top to bottom | Tasks | 32 | Module navigation; not opened | M11 | new |
| LR-17 | Sidebar, top to bottom | Meetings | 33 | Module navigation; not opened | M11 | new |
| LR-18 | Sidebar, top to bottom | Calls | 34 | Module navigation; not opened | M11 | new |
| LR-19 | Sidebar, top to bottom | Products | 35 | Module navigation; not opened | M11 | new |
| LR-20 | Sidebar, top to bottom | Quotes | 36 | Module navigation; not opened | M11 | new |
| LR-21 | Sidebar, top to bottom | Sales Orders | 37 | Module navigation; not opened | M11 | new |
| LR-22 | Sidebar, top to bottom | Purchase Orders | 38 | Module navigation; not opened | M11 | new |
| LR-23 | Sidebar, top to bottom | Invoices | 39 | Module navigation; not opened | M11 | new |
| LR-24 | Sidebar, top to bottom | Campaigns | 40 | Module navigation; not opened | M11 | new |
| LR-25 | Sidebar, top to bottom | Vendors | 41 | Module navigation; not opened | M11 | new |
| LR-26 | Sidebar, top to bottom | Price Books | 42 | Module navigation; not opened | M11 | new |
| LR-27 | Sidebar, top to bottom | Cases | 43 | Module navigation; not opened | M11 | new |
| LR-28 | Sidebar, top to bottom | Solutions | 44 | Module navigation; not opened | M11 | new |
| LR-29 | Module tab strip, left to right | Layouts | 45, 46 | Visible navigation tab; not operated in this capture | M11 | new |
| LR-30 | Module tab strip, left to right | Layout Rules | 47, 48 | Selected initial state | M11 | new |
| LR-31 | Module tab strip, left to right | Validation Rules | 49, 50 | Visible navigation tab; not operated in this capture | M11 | new |
| LR-32 | Module tab strip, left to right | Fields | 51, 52 | Visible navigation tab; not operated in this capture | M11 | new |
| LR-33 | Module tab strip, left to right | Record Locking Configuration | 53, 54 | Visible navigation tab; not operated in this capture | M11 | new |
| LR-34 | Module tab strip, left to right | Map Dependency Fields | 55, 56 | Visible navigation tab; not operated in this capture | M11 | new |
| LR-35 | Module tab strip, left to right | Links | 57, 58 | Visible navigation tab; not operated in this capture | M11 | new |
| LR-36 | Module tab strip, left to right | Buttons | 59, 60 | Visible navigation tab; not operated in this capture | M11 | new |
| LR-37 | Module tab strip, left to right | Summary | 61, 62 | Visible navigation tab; not operated in this capture | M11 | new |
| LR-38 | Content right edge | Contextual help | 64 | Not opened | M11 | new |
| LR-39 | Bottom utility strip | My Pins | 87 | Not opened | Shell | Contacts shell |
| LR-40 | Bottom utility strip | Chats | 88 | Not opened | Shell | Contacts shell |
| LR-41 | Bottom utility strip | Contacts | 89 | Not opened | Shell | Contacts shell |
| LR-42 | Bottom utility strip | Command palette | 90 | Not opened | Shell | Contacts shell |
| LR-43 | Bottom utility strip | Announcements | 91 | Not opened | Shell | Contacts shell |
| LR-44 | Bottom utility strip | Motivator | 92 | Not opened | Shell | Contacts shell |
| LR-45 | Bottom utility strip | Sticky Notes | 93 | Not opened | Shell | Contacts shell |
| LR-46 | Bottom utility strip | Activity Reminders | 94 | Not opened | Shell | Contacts shell |
| LR-47 | Bottom utility strip | Recent Items | 95 | Not opened | Shell | Contacts shell |
| LR-48 | Bottom utility strip | Accessibility | 96 | Not opened | Shell | Contacts shell |
| LR-49 | Bottom utility strip | Help | 97 | Not opened | Shell | Contacts shell |
| LR-50 | Content above table, right | New Layout Rule | 65, 66 | Creation entry; forbidden, not opened | M11 | new |

Reconciliation: 104 raw entries → 50 logical controls;
67 represented + 37 excluded = 104.
Excluded entries: 1, 2, 5, 9, 10, 12, 13, 15, 16, 19, 20, 25, 63, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 98, 102, 103, 104.
Exclusions are hidden or zero-area overlays, structural containers, static text
and table wrappers, verified against the screenshot. No controls were operated
except the named tab.


## Leads — Summary (final continuation)

Source: **seen, `m11r1-leads-summary-final` screenshot**, reconciled with
one-based `controls.json`. Summary is selected and fully painted. A Primary
section presents module/API/display-name attributes and modification metadata.
A Customization section presents permission, layout and field-count summaries,
then Buttons and Links count links. Values, identities, dates and configured
counts are not copied. The Automation heading begins at the lower content edge;
its controls are below the captured content viewport and are not inventoried.
No content scrolling, count-link navigation or settings action was performed.

| # | Position | Control | Raw entries | Observed behaviour / limit | Owning module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- |
| SU-01 | Top utility strip | Search records | 3 | Not opened or typed | Shell | Contacts shell |
| SU-02 | Top utility strip | Quick create | 4 | Not opened or typed | Shell | Contacts shell |
| SU-03 | Top utility strip | Assistant | 6 | Not opened or typed | Shell | Contacts shell |
| SU-04 | Top utility strip | Notifications | 7 | Not opened or typed | Shell | Contacts shell |
| SU-05 | Top utility strip | Calendar | 8 | Not opened or typed | Shell | Contacts shell |
| SU-06 | Top utility strip | Marketplace | 11 | Not opened or typed | Shell | Contacts shell |
| SU-07 | Top utility strip | Setup | 14 | Not opened or typed | Shell | Contacts shell |
| SU-08 | Top utility strip | Profile | 17, 18 | Not opened or typed | Shell | Contacts shell |
| SU-09 | Top utility strip | Applications menu | 21, 22, 23, 24 | Not opened or typed | Shell | Contacts shell |
| SU-10 | Sidebar header | Back to Modules | 26, 104, 105 | Back affordance visible; not clicked | M11 | new |
| SU-11 | Sidebar header right | Module search icon | 27, 106 | Not opened; input behaviour unobserved | M11 | new |
| SU-12 | Sidebar, top to bottom | Leads | 28 | Selected | M11 | new |
| SU-13 | Sidebar, top to bottom | Contacts | 29 | Module navigation; not opened | M11 | new |
| SU-14 | Sidebar, top to bottom | Accounts | 30 | Module navigation; not opened | M11 | new |
| SU-15 | Sidebar, top to bottom | Deals | 31 | Module navigation; not opened | M11 | new |
| SU-16 | Sidebar, top to bottom | Tasks | 32 | Module navigation; not opened | M11 | new |
| SU-17 | Sidebar, top to bottom | Meetings | 33 | Module navigation; not opened | M11 | new |
| SU-18 | Sidebar, top to bottom | Calls | 34 | Module navigation; not opened | M11 | new |
| SU-19 | Sidebar, top to bottom | Products | 35 | Module navigation; not opened | M11 | new |
| SU-20 | Sidebar, top to bottom | Quotes | 36 | Module navigation; not opened | M11 | new |
| SU-21 | Sidebar, top to bottom | Sales Orders | 37 | Module navigation; not opened | M11 | new |
| SU-22 | Sidebar, top to bottom | Purchase Orders | 38 | Module navigation; not opened | M11 | new |
| SU-23 | Sidebar, top to bottom | Invoices | 39 | Module navigation; not opened | M11 | new |
| SU-24 | Sidebar, top to bottom | Campaigns | 40 | Module navigation; not opened | M11 | new |
| SU-25 | Sidebar, top to bottom | Vendors | 41 | Module navigation; not opened | M11 | new |
| SU-26 | Sidebar, top to bottom | Price Books | 42 | Module navigation; not opened | M11 | new |
| SU-27 | Sidebar, top to bottom | Cases | 43 | Module navigation; not opened | M11 | new |
| SU-28 | Sidebar, top to bottom | Solutions | 44 | Module navigation; not opened | M11 | new |
| SU-29 | Module tab strip, left to right | Layouts | 45, 46 | Visible navigation tab; not operated in this capture | M11 | new |
| SU-30 | Module tab strip, left to right | Layout Rules | 47, 48 | Visible navigation tab; not operated in this capture | M11 | new |
| SU-31 | Module tab strip, left to right | Validation Rules | 49, 50 | Visible navigation tab; not operated in this capture | M11 | new |
| SU-32 | Module tab strip, left to right | Fields | 51, 52 | Visible navigation tab; not operated in this capture | M11 | new |
| SU-33 | Module tab strip, left to right | Record Locking Configuration | 53, 54 | Visible navigation tab; not operated in this capture | M11 | new |
| SU-34 | Module tab strip, left to right | Map Dependency Fields | 55, 56 | Visible navigation tab; not operated in this capture | M11 | new |
| SU-35 | Module tab strip, left to right | Links | 57, 58 | Visible navigation tab; not operated in this capture | M11 | new |
| SU-36 | Module tab strip, left to right | Buttons | 59, 60 | Visible navigation tab; not operated in this capture | M11 | new |
| SU-37 | Module tab strip, left to right | Summary | 61, 62 | Selected initial state | M11 | new |
| SU-38 | Bottom utility strip | My Pins | 91 | Not opened | Shell | Contacts shell |
| SU-39 | Bottom utility strip | Chats | 92 | Not opened | Shell | Contacts shell |
| SU-40 | Bottom utility strip | Contacts | 93 | Not opened | Shell | Contacts shell |
| SU-41 | Bottom utility strip | Command palette | 94 | Not opened | Shell | Contacts shell |
| SU-42 | Bottom utility strip | Announcements | 95 | Not opened | Shell | Contacts shell |
| SU-43 | Bottom utility strip | Motivator | 96 | Not opened | Shell | Contacts shell |
| SU-44 | Bottom utility strip | Sticky Notes | 97 | Not opened | Shell | Contacts shell |
| SU-45 | Bottom utility strip | Activity Reminders | 98 | Not opened | Shell | Contacts shell |
| SU-46 | Bottom utility strip | Recent Items | 99 | Not opened | Shell | Contacts shell |
| SU-47 | Bottom utility strip | Accessibility | 100 | Not opened | Shell | Contacts shell |
| SU-48 | Bottom utility strip | Help | 101 | Not opened | Shell | Contacts shell |
| SU-49 | Customization summary | Buttons count link | 63, 64 | Visible count link; not opened; destination unverified | M11 | new |
| SU-50 | Customization summary | Links count link | 65, 66 | Visible count link; not opened; destination unverified | M11 | new |

Reconciliation: 110 raw entries → 50 logical controls;
68 represented + 42 excluded = 110.
Excluded entries: 1, 2, 5, 9, 10, 12, 13, 15, 16, 19, 20, 25, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 102, 103, 107, 108, 109, 110.
Exclusions are structural wrappers, hidden/zero-area overlays, the static
modification avatar, and Automation/template links below the visible content
viewport (67–74). No inaccessible or clipped control is counted as visible.

## Fields and metadata

This is a configuration list, not a Lead record form. The list search is a text
input; status cells are switch/checkbox pairs. Column headings are described
above; no field-definition editor was opened.
Local `metadata/modules/Leads/fields.json`, `layouts.json`, `custom_views.json`
and related-list exports exist as model evidence. Their presence does not
establish which settings tabs are visible or how a settings editor behaves.
No current record values, layout identifiers or profile identifiers are copied.

## Actions, filters, sorting and flows

1. Click-free navigation to `/crm/<org>/settings/modules` draws the list.
2. Open the Leads module-name link to inspect its initial layouts list.
3. Open only the authorized tab headings; inspect each image and successful
   non-GET set. A failed target is not retried in the same run.

No search, sorting, filtering, reordering, status switch, panel preference,
creation or editor action is tested. No Save-capable editor is opened.
Validation Rules and Map Dependency Fields have observed initial empty states.
Search-produced empty results, save validation, loading/recovery and permission
errors are unobserved. The Links failure is documented separately below.

## Capture refs, paint gate and safety audit

- `m11r1-modules-base` — click-free `/crm/<org>/settings/modules`,
  `--wait 25000`; captured 2026-10-22 at 20:14:41 UTC.
- Complete folder contains screenshot.png, aria.yml, page.txt, network.json,
  controls.json, meta.json and progress.json. Raw evidence remains local in the
  research workspace and is never committed or uploaded with customer data.
- Heading/tab present; 469 controls; 50 API calls. **Paint accepted by CTO** despite
  diagnostics include `pageerror Cannot read properties of undefined (reading
  '_sortableParentData')`. No failed script load was reported (`scriptLoads.failed`
  is zero). The full screenshot is painted; this specific error is known noise.
- Click list: empty. Selector checks: not applicable, zero click candidates.
  No hover, scroll, field fill, toggle, drag, Escape or retry occurred.
- The original run stopped at its gate. CTO reviewed the screenshot and
  authorized continuation without repeating the module-list capture. Each new
  target screen has at most one live capture attempt in this run.
- Tool reached `done`; no empty-folder, missing-meta or leaked-tab failure was
  reported. Eight existing targets were hidden by the relay; none were closed
  by this agent. No popup, print, download or file chooser was reported.

### Non-GET baseline

The following are **refused** background requests in `meta.json.blockedRequests`,
not successful writes and not permission to invoke them:

| Method / neutral path | Count | Classification |
| --- | --- | --- |
| POST `/crm/<org>/ActivityReminder.do` | 1 | Reminder polling, refused legacy action |
| POST telemetry `/:id/telemetry/urlMonitor` | 2 | Telemetry refused |
| POST `/crm/<org>/crminotification.do` | 1 | Notification status, refused legacy action |
| POST telemetry `/:id/telemetry/logs` | 1 | Telemetry refused |

`network.json` also records two successful background POSTs:

| Method / neutral path | Count | Status | Evidence / limit |
| --- | --- | --- | --- |
| POST `/crm/<org>/PageLayout.do` | 1 | 200 | Request has an action string; response contains features and module collections. Page-initiated, passive/read (CTO decision); action value is not retained by the shape log. |
| POST `/visitor/v2/<workspace>/livevisitors/<id>/triggers` | 1 | 200 | Visitor-widget response has URL/object/data keys and encrypted visitor information. Page-initiated, passive/read visitor trace (CTO decision). |

CTO classified both successful POSTs as page-initiated, passive/read on
2026-10-22: the first reads module/layout data; the second is the embedded
support widget's automatic visit trace. No click triggered either. The former
visitor-effect question is closed; this classification does not authorize
manual requests, replay or any settings write. Refused requests remain refused.

## Continuation capture audit — 2026-10-22

All captures start at `/crm/<org>/settings/modules/Leads/layouts`. Only one
attempt per target was made. No editor, modal, menu, search/filter change,
creation action, switch, drag, preference change, popup, download, print or
file chooser was operated. No shared-browser tabs were closed. Failed-script
count is zero for each capture. Blocked requests remained blocked.

| Capture folder under `captures/` | Target / result | Controls | Refused requests | Successful non-GET |
| --- | --- | --- | --- | --- |
| `m11r1-leads-layout-rules` | No click; ambiguous selector; Layouts remains | 107 | 7 | PageLayout/read ×1; visitor/passive ×1; both 200 |
| `m11r1-leads-validation-rules` | Clicked; fully painted | 104 | 3 | PageLayout/read ×1; visitor/passive ×1; both 200 |
| `m11r1-leads-fields` | Clicked; fully painted | 111 | 3 | PageLayout/read ×1; visitor/passive ×1; both 200 |
| `m11r1-leads-record-locking` | Clicked; fully painted | 104 | 3 | PageLayout/read ×1; visitor/passive ×1; both 200 |
| `m11r1-leads-dependencies` | Clicked; fully painted | 108 | 2 | PageLayout/read ×1; visitor/passive ×1; both 200 |
| `m11r1-leads-links` | Clicked; paint failed; STOP | 55 | 4 | PageLayout/read ×1; visitor/passive ×1; both 200 |

The refused-request changes are known noise under CTO's current rule, except
that the Links profile-assignment refusal is retained as failure evidence.
No successful settings-write delta is present. The stop is caused by the
visibly blank Links content, independently of request-count comparisons.
A pre-click ready probe or tool exit code alone does not establish final paint.

## Continuation capture audit — 2026-10-23

The CTO's 20:39 decision was applied without repeating accepted captures.
Each attempt starts with a fresh load of the Leads Layouts route. The original
broken Links capture and its 20 shell controls remain diagnostic only and are
excluded from accepted inventory totals.

| Capture folder under `captures/` | Target / result | Raw controls | Refused requests | Successful non-GET |
| --- | --- | --- | --- | --- |
| `m11r1-leads-layout-rules-cont` | Unique `#formRulesLI` click; fully painted | 104 | 3 | PageLayout/read ×1; visitor/passive ×1; both 200 |
| `m11r1-leads-buttons-cont` | Source Layouts page remained loading; target absent; no click | 282 | 2 | None recorded |

Layout Rules has 50 logical controls: 67 represented raw entries and 37
excluded entries. Its screenshot shows the complete module sidebar, nine tabs,
creation entry and empty table. The known sorting-library error is present;
failed script count is zero. The three refused requests are reminder polling,
notification status and telemetry URL monitoring, one each. There is no new
successful non-GET path or count increase.

The Buttons attempt fails the paint gate **before any click**. The source page
shows a loading skeleton and spinner; the unique target has zero matches after
30 seconds. `ready.ok` is false, the step is `not-run`, failed script count is
zero and the known sorting-library error is recorded. Reminder polling and
telemetry URL monitoring are refused once each. No successful non-GET request
is recorded, so no successful settings-write delta is evidenced. Tool exit
status is 2. The 282 raw controls are not an accepted screen inventory.

Live research stopped at this blank/partial paint, under the CTO's 20:28 stop
rule retained by the 20:39 decision. Buttons is not retried. Summary and the
single permitted Links retry are **not attempted in this continuation**; that
retry allowance is unconsumed. No editor, modal, menu, toggle, creation entry,
field, preference, drag, download or print was operated. No browser tab was
closed, no guard changed and no request replayed. The Links-specific exception
does not waive a loading failure on the source page of another tab.

## Final bounded continuation — 2026-10-23

The 01:03 UTC CTO decision is applied with fresh Layouts loads and a 15-second
wait before each readiness probe. Each target is attempted at most once in this
run. Unique selectors come from the accepted Layout Rules controls capture:
Buttons `#cusButtonLI`, Summary `#infoLI`, Links `#cusLinkLI`.

### Buttons — stale source content, invalid acceptance evidence

Capture: `m11r1-leads-buttons-final`. The source readiness probe succeeds and
one Buttons tab click is recorded. The final route is the Buttons route, but
manual screenshot inspection shows Layouts still selected and the layout
creation entry/table still displayed. The route reports an initialization error
while setting module state; a profile-assignment request was refused. This is
a failed tab transition, not the Buttons initial screen. The 108 raw controls
represent stale content and are excluded from the accepted inventory total.
There is no blank image, editor, modal or menu. Under the CTO's tool-failure
skip rule, the next authorized target may proceed; Buttons is not retried.

Eight requests were refused: reminder polling (1), notification status (1),
URL telemetry (2), profile assignment (1), telemetry logs (1), exception ingest
(1), custom metrics (1). Successful non-GET requests remain PageLayout/read (1)
and visitor/passive (1), both 200. No new successful non-GET path or count
increase is recorded. All guards remain enabled.

### Summary — accepted initial state

Capture: `m11r1-leads-summary-final`; unique `#infoLI` click, readiness true,
no failed scripts. The screenshot is fully painted and has 50 logical controls
(68 represented + 42 excluded = 110 raw entries). Five requests are refused:
URL telemetry (2), reminder polling (1), notification status (1), telemetry
logs (1). The known sorting-library error is present.

Successful non-GET calls comprise PageLayout module-list read (1), PageLayout
module-accessibility check (1, query action `isModuleAccessable`, module Leads),
and visitor/passive (1), all 200. The additional PageLayout call is explicitly
recorded rather than reported as an unchanged count: it checks access and is
within the CTO's PageLayout exception. No successful non-GET outside the
PageLayout/visitor exceptions appears. No settings operation was performed.

### Links — authorized retry consumed, known tool/page issue

Capture: `m11r1-leads-links-final`. The source readiness probe succeeds and the
single authorized `#cusLinkLI` click is recorded. The final screenshot again
shows an object-error marker in an otherwise blank content card. The module
sidebar, tab strip and Links content are absent. Manual image inspection fails
the paint gate despite the successful pre-click readiness probe/tool exit.
The 55 raw controls are diagnostic shell evidence only and are not inventoried
as Links controls. Neither this image nor the original failed Links image is
valid acceptance evidence or an empty-list design reference.

Eight requests are refused, with the same categories and counts as the final
Buttons attempt, including the profile-assignment read. Successful non-GET
requests are PageLayout/read (1) and visitor/passive (1), both 200. There is no
successful settings-write delta. Diagnostics report a rejected Links route
model and XMLHttpRequest page errors. Guards are unchanged, no request is
replayed, and no further live inspection follows this failed paint.

| Final capture folder under `captures/` | Result | Raw controls | Refused requests | Accepted logical controls |
| --- | --- | --- | --- | --- |
| `m11r1-leads-buttons-final` | Stale Layouts content at Buttons route; invalid target evidence | 108 | 8 | 0 |
| `m11r1-leads-summary-final` | Fully painted Summary | 110 | 5 | 50 |
| `m11r1-leads-links-final` | Blank/object error; invalid; final retry consumed | 55 | 8 | 0 |

All three final screenshots were inspected. No editor, menu, modal, toggle,
creation entry, field, saved preference, drag, download or print was operated.
No browser tabs were closed. The seven accepted tab inventories are retained;
Buttons and Links have justified open questions under the final CTO decision.

## Open questions and unobserved states

1. Buttons remains unobserved after its final permitted attempt: tab navigation
   reached the Buttons route, but the screen retained the Layouts content. The
   route failed during initialization after a profile-assignment read was
   refused by the capture guard. No guard bypass or additional retry is allowed.
   This stale content is not an accepted Buttons screen or product behaviour.
2. Links remains unobserved: the original and final blank/object-error captures
   are invalid acceptance evidence. The authorized fresh-load retry is consumed.
   This is a known tool/page issue; there is no further retry. Its intended
   initial state remains an open question, not product behaviour to reproduce.
3. Search/filter, empty-result, permission and error behaviour beyond the
   observed initial states remains unknown. Custom Views is not a visible tab.
4. Status-switch availability, information tooltips, Teamspace destinations,
   contextual help and more-menu contents remain unobserved.
5. Create/edit/save, validation, field/layout changes, module visibility,
   deletion and reorder outcomes are not observable within this read-only scope.
6. No earlier comparable Modules table was found for the Tasks date; no causal
   attribution is made.

## Verification and handoff

Accepted evidence covers the module list and seven of the nine Leads tabs:
Layouts, Layout Rules, Validation Rules, Fields, Record Locking Configuration
and Map Dependency Fields, plus Summary. Counts:
85 + 53 + 50 + 50 + 54 + 50 + 51 + 50 = **443 logical controls**. The invalid Links shell inventory (20) is excluded.
The earlier ambiguous Layout Rules attempt is superseded by the valid
continuation capture, without altering its historical failure record.

Each accepted inventory is reconciled with one-based raw controls and its
screenshot. The new Layout Rules mapping verifies unique raw-index use and
67 + 37 = 104. The failed Buttons screenshot was inspected independently of
the readiness result. Raw screenshots and data remain in the local research
workspace because they may contain customer/account information; they are
neither committed nor uploaded.

Documentation verification covers inventory arithmetic and uniqueness,
privacy/neutral-language scanning and `git diff --check`. Application tests,
typecheck, e2e and CI are unnecessary for this documentation-only change,
as explicitly decided by the CTO. `research/specs/verify.mjs` is absent.
The final bounded attempts are submitted with justified open questions for
unavailable tabs; CTO approval is required. No further capture recovery run
is requested under the 01:03 UTC decision.
