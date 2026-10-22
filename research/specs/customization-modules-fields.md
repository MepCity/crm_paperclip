# Customization — Modules and Fields (R1 research)

## Purpose and status

Inspect the module administration list and the initial read-only tabs for Leads.
The initial module-list capture is accepted as painted by the CTO decision of
2026-10-22. The `_sortableParentData` page error is known sorting-library noise
on these settings pages when the screenshot is fully painted; a genuinely
blank or partial image still fails. This revision adds the Leads initial Layouts screen. Research remains
**incomplete**: the inherited blocked-request delta rule stopped further tab
captures. CTO must disposition that delta before continuation. No editor or
persisted preference was operated.

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
| ML-30 | Module tab strip, left to right | Layout Rules | 47, 48 | Visible tab; not opened because safety delta stopped continuation | M11 | new |
| ML-31 | Module tab strip, left to right | Validation Rules | 49, 50 | Visible tab; not opened because safety delta stopped continuation | M11 | new |
| ML-32 | Module tab strip, left to right | Fields | 51, 52 | Visible tab; not opened because safety delta stopped continuation | M11 | new |
| ML-33 | Module tab strip, left to right | Record Locking Configuration | 53, 54 | Visible tab; not opened because safety delta stopped continuation | M11 | new |
| ML-34 | Module tab strip, left to right | Map Dependency Fields | 55, 56 | Visible tab; not opened because safety delta stopped continuation | M11 | new |
| ML-35 | Module tab strip, left to right | Links | 57, 58 | Visible tab; not opened because safety delta stopped continuation | M11 | new |
| ML-36 | Module tab strip, left to right | Buttons | 59, 60 | Visible tab; not opened because safety delta stopped continuation | M11 | new |
| ML-37 | Module tab strip, left to right | Summary | 61, 62 | Visible tab; not opened because safety delta stopped continuation | M11 | new |
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
- **STOP:** the inherited new-path/increased-count rule applies even though
  the new requests are refused telemetry. No further tab capture or replay was
  attempted. No successful settings write or reference mutation is evidenced.
  CTO must decide whether these refused passive diagnostics permit continuation.

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
3. Audit the request delta; stop before any tab click because the inherited
   new-path/increased-count rule is triggered.

No search, sorting, filtering, reordering, status switch, panel preference,
creation or editor action is tested. No Save-capable editor is opened.
Empty results, validation, loading/recovery and permission errors are unobserved.

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

## Open questions and unobserved states

1. CTO disposition of the refused telemetry delta is required before further
   live capture. This is distinct from the already-closed successful visitor
   POST question and already-accepted sorting-library paint noise.
2. The first states of Layout Rules, Validation Rules, Fields, Record Locking
   Configuration, Map Dependency Fields, Links, Buttons and Summary are not
   captured. Their tab labels alone are not evidence of their contents.
3. Search/filter, empty, permission and error behaviour on those tabs remains
   unknown. No Custom Views tab is visible in the observed module tab set.
4. Status-switch availability, information tooltips, Teamspace destinations,
   contextual help and more-menu contents are unobserved and outside the
   authorized open-only tab continuation.
5. Create/edit/save, validation, field/layout changes, module visibility,
   deletion and reorder outcomes are not observable within this issue's
   read-only boundary. Do not infer them from a resting list image.
6. An earlier Modules-table capture showing the Tasks date was not found among
   the preceding email-settings evidence; no causal attribution is made.

## Verification and handoff

Both captured states have screenshot inspection and unique raw-control mapping.
The prior module-list inventory is preserved; the continuation adds a complete
Layouts inventory. Privacy/neutral-language and whitespace checks are required
before publication. Documentation only: no application tests, typecheck or e2e.
`research/specs/verify.mjs` is absent. Acceptance remains incomplete until the
remaining eight initial tab screens are captured after CTO safety disposition.
