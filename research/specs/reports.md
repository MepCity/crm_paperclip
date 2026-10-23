# Reports and Analytics — R1 read-only research

## Purpose and evidence boundary

MEP-1211 covers the populated Reports landing list, one existing report opened
for viewing, and the initial Analytics dashboard. Module 2+ parity applies:
control inventory and functional structure, without measurements or request
shapes. No reference assets, record values, identities or report descriptions
are reproduced. Analytics dashboard internals belong to R2.

**Partial coverage:** folder navigation, folder contents and an empty report
list were not safely observable in the resting state. These are open research,
not approved implementation assumptions. An empty report result is observed;
it is distinct from an empty list of report definitions.

## Capture refs and read-only audit

Local research capture directories (never committed):

| Slug | State | Requested clicks / steps | Blocked requests | Result |
| --- | --- | --- | --- | --- |
| `m13r1-reports-main` | All Reports, populated | 0 / 0 | 3 | Painted list; no report-folder pane |
| `m13r1-report-detail` | Existing email-template ranking report | 1 / 1, existing report-name link; result `clicked` | 3 | Painted report header and empty results table |
| `m13r1-analytics-entry` | Initial organization overview | 0 / 0 | 4 | Painted mixed dashboard; runtime errors limit acceptance |

All three contain screenshot.png, controls.json, aria.yml, meta.json,
network.json and page.txt. Captured on 2026-10-23, sequentially under the
capture tool lock. After each capture, meta clicks, steps and blocked requests
were checked. No skipped clicks, downloads, file choosers, print calls or
allowed-open exceptions occurred. The only requested click was a uniquely
named existing report link, not Edit, Run/Save or a preference control.

Each capture blocked background reminder retrieval, notification-status and
telemetry requests. Analytics additionally blocked an automatic
`PUT /crm/v8/Analytics/metadata` on page entry. This was **not allowed or
retried**; no preference/save action was requested. Its purpose and effect
cannot be established from the blocked request alone. Do not assert that
Analytics initialized without errors or that the attempted update succeeded.

All captures log initialization errors, including a missing sortable function
and shell/router errors. Their screenshots are painted, but completeness of
missing UI is not certified. Analytics also logs a 400 and XMLHttpRequest
errors. No diagnostic is treated as a product requirement. No recovery that
relaxes the write guard was attempted. No reference change is evidenced.

## Layout and fields

### Reports landing

The expanded shared navigation is on the left. Reports is selected; the main
header says Reports. The content toolbar has an All Reports selector at left,
Search All Reports, Create Report and a help icon at right. Below is a populated
list with Report Name, Description, Folder, Last Accessed Date and Created By.
Rows begin with an unchecked checkbox and an unfilled star, followed by a
report-name link. Long names/descriptions truncate. Missing date/creator cells
use a dash. No header select-all control or pagination is visible in this
capture; do not infer that none exists elsewhere.

The initial viewport contains thirteen report rows. More rows appear in the
ARIA/control export beyond the visible viewport; they are not additional
screenshot-certified controls. The report-folder pane requested by the issue
is absent in this All Reports state. The shared module navigation is not a
report-folder pane. Folder cells are text, with no exported navigation link.

Fields are report-definition name (text/link), description (text), folder
label (text), last-accessed date (date/absent) and creator (identity/absent).
Checkbox and favorite state are interactive row affordances, not data columns.
No actual values or descriptions are required fixtures.

### Existing report detail

Opening a report-name link navigates to `/crm/<org>/tab/Reports/<report>`.
The left shell renders as a narrow navigation rail automatically; no menu
collapse control was operated. Header: back arrow, report title, information
icon, refresh with relative update text, and Edit with a separate menu arrow.
The global top utilities remain in controls.json but are not painted in this
screenshot; they are not counted as visible detail controls.

A second toolbar has Filter with an active indicator, Filter By Date, Clear,
and Show Details at the right. An empty results table retains nine headings:
Template Name, Sent, Bounced, Tracked, Bounced Among Tracked, Opened, Clicked,
Replied, Received. The eight metric headings show sort glyphs. The result body
shows **No Data Found**. No report parameters were changed. This is evidence
for one email-oriented report type, not a universal report schema.

### Analytics entry

The expanded shell returns on direct navigation to `/crm/<org>/tab/Dashboards`.
The toolbar contains All, the current overview selector with a star, an All
Users scope badge, refresh, Add Component, Create Dashboard, more actions and
help. A grid shows four first-row KPI cards (lead volume, revenue, pipeline
count and account comparison); the next row contains lead and revenue target
visuals. The lower viewport edge reveals performance, lead-source and sales
representative cards, with only partial contents visible. Some cards show empty
illustrations while others show aggregates. Numeric values, targets, currency
values and identities are deliberately omitted. Card wrappers carry a loading
attribute despite painted content; stable completion is not proven.

## Numbered control inventory

Sources: **L** = `m13r1-reports-main`; **D** = `m13r1-report-detail`;
**A** = `m13r1-analytics-entry`. Numbers in raw columns are one-based
controls.json entries. Screenshot-only entries use “image”. Duplicate wrappers
and nested anchors count once. Controls not explicitly described as operated
were **not operated**; appearance/label does not establish their write behaviour.

### Shared shell — L and A

The same shell is visible in both states, with matching raw entry indices.
All controls below belong to Shell, except module destinations owned by their
respective modules. Navigation destinations are resting evidence only.

| # | Position | Control / function indicated | Raw L/A |
| --- | --- | --- | --- |
| H01 | Top left | Application selector; neutral application identity | 2–4 |
| H02 | Sidebar top right | Hide Menu; persistent preference risk | 11 |
| H03 | Sidebar | Home navigation | 12–14 |
| H04 | Sidebar | Workqueue navigation | 15–17 |
| H05 | Sidebar | Reports navigation; L current | 18–20 |
| H06 | Sidebar | Analytics navigation; A current | 21–23 |
| H07 | Sidebar | Agents navigation | 24–26 |
| H08 | Sidebar | MCP navigation | 27–29 |
| H09 | Sidebar divider | Teamspace selector | 30–32 |
| H10 | Teamspace right | More Actions | 34 |
| H11 | Below teamspace | Module search input | 35–36 |
| H12 | Sidebar | Sales disclosure, collapsed | 37 |
| H13 | Sidebar | Activities disclosure, expanded | 38 |
| H14 | Activities | Tasks navigation | 40–41 |
| H15 | Activities | Meetings navigation | 42–43 |
| H16 | Activities | Calls navigation | 44–45 |
| H17 | Sidebar | Integrations disclosure, expanded | 46 |
| H18 | Integrations | Visits navigation | 48–49 |
| H19 | Sidebar | Price Books navigation | 51–52 |
| H20 | Sidebar | Products navigation | 54–55 |
| H21 | Sidebar | Quotes navigation | 57–58 |
| H22 | Sidebar | Invoices navigation | 60–61 |
| H23 | Sidebar | Sales Orders navigation | 63–64 |
| H24 | Sidebar | Solutions navigation | 66–67 |
| H25 | Sidebar bottom edge | Social navigation | 69–70 |
| H26 | Sidebar right edge | Resize handle; not dragged | 82 |
| H27 | Top bar | Global Search records | 85 |
| H28 | Top bar | Quick create plus | 86 |
| H29 | Top bar | Assistant | 88 |
| H30 | Top bar | Notifications | 89 |
| H31 | Top bar | Calendar | 90–92 |
| H32 | Top bar | Marketplace | 93–95 |
| H33 | Top bar | Setup | 96–98 |
| H34 | Top bar | Profile | 99–100 |
| H35 | Top right corner | Applications menu | 103–106 |

D shows H03–H08 in the narrow rail (raw 5–22), a compact teamspace entry
(raw 23–25), and an application/menu icon (raw 2–4, Show Menu); none was
operated. H09–H26's expanded contents and H27–H35 are not painted there.

### Bottom utility strip — all three states

All belong to Shell and remain unoperated. Sources are each screenshot and
matching named controls; L indices below, D/A reconciled by label or selector.

| # | Position | Control / indicated function | Raw L |
| --- | --- | --- | --- |
| H36 | Bottom left | My Pins | 282 |
| H37 | Bottom left | Chats | 283 |
| H38 | Bottom left | Contacts | 284 |
| H39 | Bottom right cluster, first | Command palette icon | 285 |
| H40 | Bottom right | Announcements | 286 |
| H41 | Bottom right | Motivator | 287 |
| H42 | Bottom right | Sticky Notes | 288 |
| H43 | Bottom right | Activity Reminders | 289 |
| H44 | Bottom right | Recent Items | 290 |
| H45 | Bottom right | Accessibility | 291 |
| H46 | Bottom right | Help | 292 |
| H47 | Bottom far right | Bin-shaped utility icon, purpose unverified | image |

Zero-area live-chat containers and modal/popover placeholders are not visible
controls. No hidden menu content is claimed as observed.

### Reports landing — L, owner Module 13

| # | Position | Control / observed limit | Raw |
| --- | --- | --- | --- |
| R01 | Toolbar left | All Reports combobox; not opened or changed | 107 |
| R02 | Toolbar right | Search All Reports input; empty, not typed | 112–113 |
| R03 | Toolbar right | Create Report; write entry, forbidden | 114–115 |
| R04 | Toolbar far right | Context help icon; not opened | 296 |
| R05.01–R05.13 | Each visible row, left | Unchecked selection checkbox; selection actions unknown | 116 + 3 × (row − 1) |
| R06.01–R06.13 | Each visible row, before name | Favorite star; never toggled | image |
| R07.01–R07.13 | Each visible row, name | Existing report navigation link; only first opened in D | 118 + 3 × (row − 1) |

The row ranges assign a unique control number to each visible instance without
copying report names. Headers and folder text are not proven controls.

### Report detail — D, owner Module 13

| # | Position | Control / observed limit | Raw |
| --- | --- | --- | --- |
| V01 | Header left | Back to report list arrow; not clicked | 50 |
| V02 | After title | Information icon; not opened | image |
| V03 | Header right | Refresh report; not invoked | 55 |
| V04 | Header right | Edit; forbidden | 52–53 |
| V05 | Beside Edit | Report menu arrow; contents unknown | 54 |
| V06 | Second toolbar left | Filter; active indicator; not opened | 57 |
| V07 | Beside Filter | Filter By / Date; detail disclosure untested | 60; image |
| V08 | Beside Date | Clear; not clicked | 58–59 |
| V09 | Second toolbar right | Show Details; preference risk, not opened | image |
| V10.01–V10.08 | Metric headers from Sent through Received | Sort glyph per metric; never operated | 72–79; image |

Filter editor controls exported as raw 62–70 are not painted in the screenshot;
no opened editor state is claimed. No selection, export or save was performed.

### Analytics entry — A, owner Module 13

| # | Position | Control / observed limit | Raw |
| --- | --- | --- | --- |
| A01 | Toolbar left | All scope/category dropdown; unchanged | 109–111 |
| A02 | Beside All | Current overview selector; not opened | 112 |
| A03 | Inside overview selector | Favorite star; forbidden to toggle | 113, 214 |
| A04 | After overview | All Users globe/scope badge; interactivity unproven | 215; image |
| A05 | Toolbar right | Refresh all components; not invoked | 119 |
| A06 | Toolbar right | Add Component; forbidden | 120–121 |
| A07 | Toolbar right | Create Dashboard; forbidden | 122–124 |
| A08 | Toolbar right | More actions ellipsis; unopened | 125–126 |
| A09 | Toolbar far right | Context help; unopened | 127, 216 |
| A10.01–A10.04 | First row, left to right | KPI card/chart regions; drilldown untested | 128–148 |
| A11.01–A11.02 | Second row, left to right | Lead target gauge / revenue target bar regions; unoperated | 149–156 |
| A12.01–A12.03 | Lower viewport edge, left to right | Partial performance / lead-source / representative regions; unoperated | 157–181 |

A10–A12 describe chart hit regions, not proven navigation. Per-component refresh
nodes (130, 134, 138, 143, 151, 155, 159, 174, 178) exist in controls.json but
are not visibly painted in the resting screenshot; hover states are unobserved.
No drag/reorder, card menu, user scope or dashboard selection was exercised.

## Actions, filters, flows and states

1. Navigate to Reports: the route resolves to a populated All Reports list.
2. Follow one existing report-name link: the report header and empty result
   table render; relative update text appears. Passive last access is permitted.
3. Navigate directly to Analytics: the initial overview and mixed empty/filled
   cards render, subject to the blocked automatic update and runtime errors.

Search, category choice, folder choice, selection, favorites, sorting, filter
editing, detail toggling and refresh behaviour are **unverified**. No search
text was entered to manufacture a no-results state. No folder was created.
Create/edit/delete, scheduling, sharing, export, save and pinning remain outside
this read-only issue. Literal validation, loading transitions, permission errors,
server error presentation and write success states were not observed.

## Metadata and documentation-derived behaviour

The local `metadata/modules.json` index contains Reports (`api_name: Reports`)
and Analytics (`api_name: Analytics`, module name Dashboards). Both are visible,
viewable default modules; generic creatable/editable/deletable and api_supported
flags are false. These generic module flags do not prove the capabilities of
the dedicated Reports/Analytics UI, whose creation buttons are visible.
No matching per-module fields/layout export directory exists, so there is no
exported report-definition, folder or dashboard field schema. Email_Analytics
and Email_Template_Analytics are separate modules and are not substitutes.

**Documentation-derived sections: none in R1.** No public source is needed to
assert the observed read-only screen structure. Write behaviour remains unknown
rather than being inferred from button labels or generic module metadata.

## Open questions

- U1: Is the missing report-folder panel expected for All Reports, or affected
  by initialization errors? Folder contents have no safe observed navigation
  link in this state. Do not guess folder URLs or switch persisted views.
- U2: What categories does R01 contain, and does selection persist? No selector
  was opened under this issue's navigation-links-only click restriction.
- U3: Empty report-list/folder/search states, search matching/debounce and
  pagination remain unobserved. The empty V result is not evidence for them.
- U4: Exact report types, populated results, drilldown, totals, grouping,
  filter defaults and sort cycles need separate evidence. One report is not
  sufficient to generalize all report schemas.
- U5: Analytics' blocked automatic metadata update and initialization errors
  limit confidence in full entry-state completeness. Keep the guard; R2 must
  document this boundary before deeper exploration.
- U6: Menu entries, preferences, favorites, scheduling, sharing, export,
  permissions and all write validation are unobserved. Document only in a
  separately authorized research slice, never by executing writes.
- U7: Information/help icons and far-right bin utility identity are unverified;
  no speculative click was made.

## Suggested first implementation slice

Implement only the observed read-only Reports list: shell entry, toolbar,
report-definition columns, missing-value dashes and existing-report navigation
using synthetic fixtures. Keep data access behind a small read interface;
metadata does not establish a reusable CRUD model. Render write/preference
entries without connecting them until their contracts are approved. Cover the
list and navigation with component/e2e tests. Do not invent folder navigation,
search semantics, favorites, report execution or Analytics persistence in this
slice. U1–U3 gate those behaviours; the report/detail and Analytics cards are
follow-up slices after evidence review. This is a scope recommendation, not
implementation authorization or a completed module gate.

## R2 — Analytics evidence audit and navigation boundary (MEP-1224)

### Scope and acceptance boundary

R2 re-inspects the retained R1 Analytics screenshot, ARIA, controls and request
ledger. It does **not** reopen Analytics: R1 already records an automatic
metadata PUT, and this issue forbids retrying an automatic blocked write.
The existing overview is evidence for one dashboard's resting structure only.
It is not evidence for a dashboard list, selector options or a successfully
initialized Analytics service. No dashboard identifier or route was guessed.

The numbered A01–A12 and H01–H47 inventories above remain the complete visible
control inventory for that retained screenshot. R2 adds component detail below;
it introduces no newly observed controls and does not renumber R1 entries.

### Existing dashboard — component inventory and states

Source for every row: `m13r1-analytics-entry`, visually re-inspected in R2.
Owner: Module 13. Chart regions are not proven buttons or navigation links.
All entries are **unoperated**; chart drilldown, tooltips and selection remain
unknown. Titles below describe structure without reproducing customer values.

| # / R1 ref | Position | Type / visible state | Behaviour boundary |
| --- | --- | --- | --- |
| AC01 / A10.01 | First row, first card | Lead-volume KPI; heading and empty illustration | Empty card, not an empty dashboard; no period control visible |
| AC02 / A10.02 | First row, second card | Revenue KPI; truncated heading and empty illustration | No error/retry label observed |
| AC03 / A10.03 | First row, third card | Pipeline KPI; heading and single aggregate | No selectable row or visible period picker |
| AC04 / A10.04 | First row, fourth card | Account KPI; aggregate, colored comparison percentage, previous-period caption/value | Comparison is displayed text, not an observed period selector |
| AC05 / A11.01 | Second row, left card | Lead-target semicircular gauge, needle, current/target endpoints and remaining caption | Target values omitted; no editing control observed |
| AC06 / A11.02 | Second row, wide right card | Revenue-target horizontal bar; organization category, amount axis, target marker and achieved legend | Legend is not proven interactive; scope is displayed, not changed |
| AC07 / A12.01 | Third row, left edge | Performance-monitor heading and partial card | Export contains period/metric cells below the viewport; full table not screenshot-certified |
| AC08 / A12.02 | Third row, middle edge | Lead-source heading and partial chart region | Chart type, categories and legend not visible enough to establish |
| AC09 / A12.03 | Third row, right edge | Representative scorecard heading and clipped column headings | Export indicates owner and amount columns; rows are below the utility strip and not certified visible |

A01–A09 cover the top toolbar: category dropdown, overview combobox, favorite,
user-scope badge, refresh, Add Component, Create Dashboard, actions and help.
H01–H47 cover the shell, screen edges and bottom utilities. No separate filter
or period-selector control is painted. This does not prove their absence from
other dashboards or unopened menus. None was clicked, selected or changed.

Per-card refresh entries are exported but not painted in the screenshot.
Their hover state is **not observed**, and they are not added as visible
controls. Card wrappers still report loading despite painted charts: do not
implement a permanent loading state from this instrumentation attribute.

Controls reconciliation: the retained Analytics export has 232 entries.
Entries 1–108 are shell controls, duplicate wrappers, title/presentation nodes
or zero-area placeholders, covered by H01–H35 or excluded for those reasons.
Entries 109–127 and 214–219 map to A01–A09, with duplicate SVG/wrapper and
scroll-container entries excluded. Entries 128–181 and 220–232 map to
AC01–AC09; nested wrappers, noninteractive data text, unpainted refresh nodes
and scroll containers are excluded as additional controls. Entries 182–184
are below-viewport scorecard data; 185–200 and 213 are zero-area placeholders;
201 is a utility wrapper and 202–212 map to H36–H46. H47 is screenshot-only.
No below-viewport identity, number, period value or customer content is copied.

### R1 open questions revisited

| Question | R2 finding | Consequence |
| --- | --- | --- |
| U1 — report-folder panel | R1 has no folder navigation link; folder cells are text | Panel show/hide is a prohibited preference change; do not infer folder routes |
| U2 — report categories | All Reports is a combobox, not a navigation link | Opening/selecting it falls outside the navigation-links-only scope; option catalogue and persistence remain unknown |
| U5 — Analytics entry | Existing evidence confirms the automatic metadata PUT was blocked once in R1 | No R2 Analytics entry or retry; purpose, successful initialization and completeness remain unverified |

Dashboard list, existing-dashboard selection, lower-card contents, all
filter/period options, tooltip/drilldown behaviour, loading completion and
permission/error states remain open. No safe existing-dashboard link is exposed
in the retained closed-selector state. The overview itself does not establish
a dashboard-list schema, empty-list message or pagination contract.

### Suggested next implementation slice

Retain the R1 recommendation: implement the observed read-only Reports list
with synthetic definitions and existing-report navigation first. R2 does not
unlock dashboard selection, filtering, favorites, persistence or refresh.
A later Analytics presentation slice may use AC01–AC06 as a bounded resting
layout reference only after UI Lead accepts the incomplete initialization
boundary. Full dashboard/list behaviour needs separately approved evidence;
never loosen the capture write guards to obtain it.

### R2 capture ledger and stop condition

**Partial research; not implementation-ready Analytics approval.** Exactly one
new capture ran. Before it, one-minute load was 10.28 (informational only).
A passive readiness probe was supplied; no click, hover, scroll, toggle,
selector choice, field entry or preference change was requested.

| Capture | Requested clicks / steps | Ready gate | API calls | Blocked requests | Disposition |
| --- | --- | --- | --- | --- | --- |
| `m13r2-reports-base` | 0 / 0 | Failed: generic combobox probe matched three DOM elements | 40 | 7 | Exit 2; stop, no repeat or deeper capture |
| `m13r1-analytics-entry` (retained evidence only) | 0 / 0 in R1 | No explicit ready probe in R1; runtime errors recorded | 51 | 4 in R1 | Not recaptured; metadata update remains blocked boundary |

All six new base evidence files exist. Screenshot inspection confirms a Reports
title, populated rows and no report-folder pane; the control export contains
50 existing-report links and 298 total entries. These satisfy the Reports
content indicators (R1 baseline: 40 API calls), but **do not override the failed
tool readiness gate**. The broad probe was ambiguous; it does not establish
that the Reports body failed to render. A sortable-function pageerror also
remains. No retry or alternative route was attempted after the failure.

The new screenshot uses H01–H47 and R01–R07 above, with thirteen painted rows.
The export is unchanged from R1 except one additional row action:

| # | Region / position | Control / type | Observed behaviour | Source / owner |
| --- | --- | --- | --- | --- |
| R08 | Seventh visible report row, after name | Ellipsis icon / row actions | Visible in resting capture; never opened; menu unknown | `m13r2-reports-base`, raw 137 / Module 13 |

R1 raw entries before 137 keep their indices; later entries shift by one.
The 297 shared export entries retain R1's mapping/exclusions. R08 adds one
visible control; it is not evidence for an authorized menu-opening flow.

Blocked ledger: reminder retrieval POST once, notification-status POST once,
telemetry log POST twice, telemetry URL-monitor POST twice, telemetry client
metrics POST once. No new business-write attempt is recorded in this Reports
capture. The successful request ledger contains one external visitor-trigger
POST, count one, also present with count one in R1 Reports and Analytics.
It is recorded as background traffic, not asserted to be a CRM write or an
approved business-write contract. No new non-GET route family or excess count
was found. No export, download, print, popup action or file chooser occurred.

U1 remains only partially evidenced (pane absent again); U2 is unanswered;
U5's blocked boundary is confirmed from retained evidence, not resolved.
UI Lead must decide the safe continuation scope before further capture:
a uniquely named passive Reports probe could remove the ambiguity, while
Analytics must remain closed unless a reviewed navigation path respects the
no-retry rule. The current deliverable records a stop and evidence gaps; it
does not claim completion of the requested dashboard-list exploration.
