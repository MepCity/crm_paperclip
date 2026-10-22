# Customization — Modules and Fields (R1 partial research)

## Purpose and status

Inspect the module administration list and the initial read-only tabs for Leads.
This draft preserves one captured list state. **Research is incomplete:** the
base fails the mandatory paint gate, so no module link or tab was clicked.
It is not approved implementation evidence. CTO must decide the continuation;
no claim is made about unobserved Leads screens.

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
The resting screenshot shows a Tasks-row drag grip and ellipsis without any
hover/click step. Their appearance trigger remains unknown.

## Control inventory — initial module list

All rows below have source **seen, `m11r1-modules-base` screenshot**, reconciled
against one-based `controls.json` entries. Seen means visible in the failed-gate
image, not accepted paint evidence. A dash denotes a screenshot-only control.
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
| MF-47 | Table / Leads / first column | Leads | 289, 290 | Module configuration link; not opened. Leads href targets the layouts list. | M11 | new |
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
| MF-64 | Table / Tasks / left edge | Drag grip | — | Visible in screenshot; never dragged | M11 | new |
| MF-65 | Table / Tasks / beside name | More menu | 313 | Visible in initial screenshot; not opened | M11 | new |
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
2. Inspect the screenshot and diagnostics before any proposed open-only click.
3. Stop because the paint gate fails; do not open Leads or any tab.

No search, sorting, filtering, reordering, status switch, panel preference,
creation or editor action was tested. No Save-capable editor was opened.
Empty results, validation, loading/recovery and permission errors are unobserved.
The Leads link exposes a layouts-list destination; this is route provenance
only and does not certify that the destination is safe or painted.

## Capture refs, paint gate and safety audit

- `m11r1-modules-base` — click-free `/crm/<org>/settings/modules`,
  `--wait 25000`; captured 2026-10-22 at 20:14:41 UTC.
- Complete folder contains screenshot.png, aria.yml, page.txt, network.json,
  controls.json, meta.json and progress.json. Raw evidence remains local in the
  research workspace and is never committed or uploaded with customer data.
- Heading/tab present; 469 controls; 50 API calls. **Paint gate FAILED** because
  diagnostics include `pageerror Cannot read properties of undefined (reading
  '_sortableParentData')`. No failed script load was reported (`scriptLoads.failed`
  is zero); that does not negate the page error.
- Click list: empty. Selector checks: not applicable, zero click candidates.
  No hover, scroll, field fill, toggle, drag, Escape or retry occurred.
- One attempt per screen per run is the stricter current issue rule. Therefore
  the five-minute retry in the inherited rule was not spent in this heartbeat.
  A subsequent run may consider the one delayed retry only after CTO resolves
  the successful visitor POST uncertainty below. A second failed gate must stop.
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
| POST `/crm/<org>/PageLayout.do` | 1 | 200 | Request has an action string; response contains features and module collections. Consistent with a layout read; action value is not retained by the shape log. |
| POST `/visitor/v2/<workspace>/livevisitors/<id>/triggers` | 1 | 200 | Visitor-widget response has URL/object/data keys and encrypted visitor information. Exact side effects cannot be established from shape-only evidence. |

The visitor request is not counted as a refused request or silently assumed to
be harmless telemetry. It occurred during click-free page loading; no manual
request was issued. Whether it is only a permitted passive visit trace or has
another persisted effect is **unknown**. No reference mutation is proven, but
further live inspection is stopped pending CTO safety disposition. Do not
attempt rollback, inspect the widget through another channel or replay requests.

Only one base capture exists, so there is no subsequent path/count delta to
compare. No manual retry of a refused request occurred. A future capture must
compare both the successful non-GET set and these refused path/counts, and
invoke the inherited stop rule on any new path or increased count.

## Open questions and unobserved states

1. Is the successful visitor-widget POST only a passive visit trace, or does
   it persist another effect? CTO must resolve this before any new capture.
2. Can a delayed, separate-run retry pass the paint gate? If it fails again,
   stop rather than pursuing module navigation or repairing the reference app.
3. Leads initial tab set, selected tab, layouts list, Fields and Custom Views
   availability remain unobserved. The issue's example tab names are targets
   for investigation, not observed controls.
4. Initial controls, list columns, search/filter behaviour, empty/error and
   permission states on every Leads settings tab remain unknown.
5. Status-switch availability differences, information tooltips, Teamspace
   link destinations and the Tasks-row more-menu contents are unobserved.
6. Create/edit/save, validation, field/layout changes, module visibility,
   deletion and reorder outcomes are not observable within this issue's
   read-only boundary. Do not infer their behaviour from this list image.

## Verification and handoff

Screenshot inspected and raw-control mappings checked for unique coverage.
Repository diff whitespace and neutral-language/privacy checks passed
before handoff. Documentation only: no application tests, typecheck or e2e are
needed. `research/specs/verify.mjs` is absent. This partial draft and its access
gap go to CTO for continuation; the original research acceptance is not met.
