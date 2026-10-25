# Reports and Analytics — read-only research

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
- U2: Partially answered in R3: the initial category options and selector
  structure are observed below. Selection persistence and the full scrolled
  folder catalogue remain unverified; no category was selected.
- U3: Empty report-list/folder/search states, search matching/debounce and
  pagination remain unobserved. R3 stopped after the category capture
  exceeded the base non-GET ledger; no search was entered. The capture tool
  also has no text-entry/clear step. The empty V result is not evidence for them.
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

**Research closed with accepted access gaps; not full Analytics approval.** Exactly one
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
### R2 closure decision and permitted implementation boundary

UI Lead's MEP-1230 decision accepts the retained Reports evidence as
**readiness-gate violation with content independently verified**. The ambiguous
probe is not evidence of a render failure. No new Reports capture is required
or authorized by that decision; the failed attempt is not retried.

Analytics remains closed under the no-retry rule. Dashboard list, period/filter
options, lower-card contents and U1/U2/U5 close as **access gaps**, remaining
open/unverified in this specification. This closes the bounded research task,
not those behavioural questions. No additional capture ran after the decision;
R2 totals remain one new capture, zero requested clicks and zero steps.

Only AC01–AC06 may inform a limited resting presentation, with an incomplete
initialization caveat. Dashboard selection, filtering, favorites, persistence
and refresh remain outside the implementation boundary. The recommended first
slice remains the read-only Reports list with synthetic definitions and
existing-report navigation. Full dashboard behaviour requires new evidence
separately approved by the board. This decision grants neither implementation
authorization nor permission to relax any capture guard.

Verification for this documentation-only closure: reviewed the complete
MEP-1230 decision against the capture ledger, component inventory and checklist;
checked the Markdown diff. No application, unit or e2e code changed.


## R3 — Reports category selector and search boundary (MEP-1281)

### Observed selector structure

On 2026-10-24, a click-free Reports base passed a unique All Reports combobox
readiness probe. The screenshot independently confirms the Reports title,
report-definition columns and thirteen painted rows; the export has fifty
existing-report links. No report was opened. The probe refines R2's ambiguous
combobox probe without changing the content acceptance boundary.

A second capture opened R01 once. Its step-1 screenshot and ARIA preserve the
open state; explicit Escape then closed it, evidenced by step-2 and final
screenshots and final `aria-expanded: false`. All Reports stayed selected.
The selector overlays the upper-left portion of the table. It has a Search
Folder input, a scrollable category/folder list, and two footer entries. All
Reports has a checkmark and a tinted selected row. No option or footer was
clicked, no search field was filled, and the list was not scrolled.

The initial visible options, in order, are All Reports, My Reports, Favorites,
Recently Viewed, Shared Reports, Scheduled Reports and Recently Deleted.
Below a divider, an account/contact report-folder row is only partly visible.
ARIA additionally exports folder options covering account/contact,
deal, lead, campaign, case/solution, product, vendor, quote, sales order,
purchase order, invoice, sales metrics, email and meeting report groupings
(fourteen folder options in total). These are export-only contents except the
partly painted first row; they do not certify the complete scrolled catalogue.
No folder identifiers or customer-defined values are reproduced.

### New control inventory — continues after R08

Source: `m13r3-reports-category/step-1.png` and `step-1.yml`; Module 13 owns
all rows. The final controls.json is the **closed** state and must not be used
as an open-menu control export. Nested option/link pairs count once.

| # | Position | Control / type | Observed behaviour / limit |
| --- | --- | --- | --- |
| R09 | Selector panel top | Search Folder textbox | Empty and focused-looking; matching and text entry untested |
| R10 | List first row | All Reports option/link | Current checkmark and selected background; not selected again |
| R11 | List second row | My Reports option/link | Visible; destination not visited |
| R12 | List third row | Favorites option/link | Visible; no favorite or view preference changed |
| R13 | List fourth row | Recently Viewed option/link | Visible; destination not visited |
| R14 | List fifth row | Shared Reports option/link | Visible; sharing not invoked |
| R15 | List sixth row | Scheduled Reports option/link | Visible; schedule list not opened |
| R16 | List seventh row | Recently Deleted option/link | Visible; no deleted view or restoration invoked |
| R17 | Below category divider, clipped at list bottom | First report-folder option/link | Account/contact grouping only partly painted; no scroll or folder selection |
| R18 | Panel footer, upper row | Manage Folders button | Gear and label visible; not opened; management/write behaviour unknown |
| R19 | Panel footer, lower row | Advanced analytics integration entry | Two-line integration label/icon; not opened; destination and action unknown |

R01 is now observed opening and closing with Escape, without changing its
selection. R02 remains the untouched report-list search input. The open menu's
Search Folder (R09) is a separate input and is not evidence for R02 search.
Existing H/R inventories remain historical capture-specific mappings.

### Capture ledger and mandatory stop

Exactly two captures ran, with no retry. Both ready gates passed with zero
failed scripts; both report forty API ledger entries. Existing shell/router
and sortable-function diagnostics remain; a passed probe is not proof that
all initialization errors disappeared. Both resting exports contain 297
controls, without R2's transient row ellipsis; that does not invalidate R08's
prior observed state.

| Capture | Requested clicks / steps | Evidence | Blocked requests |
| --- | --- | --- | --- |
| `m13r3-reports-base` | 0 / 0 | Six standard files; painted populated list | 2: reminder retrieval POST ×1, notification-status POST ×1 |
| `m13r3-reports-category` | 1 / 2 | Six standard files plus open step-1 and closed step-2 PNG/YML | 5: same reminder/status POSTs ×1 each, telemetry URL-monitor POST ×2, telemetry log POST ×1 |

Before the click, the All Reports label, selector and exported attributes
passed the capture tool's dangerous-text/control guard with no exception.
The click result is `clicked`; Escape is `pressed`. No skipped clicks,
allowed-open exceptions, automatic Escape, remaining dialog, file chooser,
download, print, popup or window-open request is recorded in either capture.
No write guard was relaxed.

The path-and-count comparison includes successful non-GET network entries
**and blocked attempts**. Each capture contains the same external visitor-trigger
POST path with count one. Reminder and notification POST paths also match at
one each. The category capture adds two blocked telemetry URL-monitor POSTs
and one blocked telemetry log POST, absent from this base. Even though these
are telemetry and were blocked, they exceed the issue's non-GET baseline.
**Stop condition triggered: no third/search capture, retry or further browser
action was performed.** Timing or causal attribution to the selector is not
established by the ledger; the conservative stop does not require it.
No new successful non-GET path/count or reference mutation is evidenced.

### U2/U3 disposition and implementation boundary

U2 is partially answered: the visible options, initial selected state, panel
structure and Escape dismissal are evidenced. Selection persistence, category
contents and scrolled folders remain open. U1's folder-panel question remains;
a folder option is not evidence for folder contents or a separate folder pane.

U3 stays open: no non-matching query was entered, no empty-search state was
captured and nothing needed clearing. Independently, the installed capture
parser supports click/hover/scroll and Escape only, with no text-entry or clear
operation. No direct browser access, fabricated search route or capture-tool
modification was used to bypass that limitation. Further search research needs
separate authorization after the non-GET stop boundary and safe tool support
are addressed. U4–U7 and all R2 Analytics access gaps are unchanged.

This is a bounded partial research handoff for UI Lead approval, not completed
U2/U3 parity or authorization to implement category selection/search semantics.
Verification: visually inspected base, open and closed screenshots; reconciled
step ARIA and final controls; compared both non-GET ledgers by method/path/count;
reviewed the documentation diff. No application code changed; no unit/e2e run
is applicable to these documentation-only findings.

## R4 — documentation-based functional spec (MEP-1303)

### Evidence boundary and source register

R4 uses public help documentation read on 2026-10-24 only. **Every RD/AD
entry below is documented, not observed.** These are proposed functional
inventories, not additions to the screenshot-certified H/R/V/A/AC controls.
No capture, authenticated reference navigation, export or preference action
ran. R2/R3 stop conditions and U5's no-retry boundary remain in force.
No application code or Phase 2 research is included.

Sources are identified by neutral public page titles only, without vendor
names or URLs. Section locators distinguish overlapping guidance:

| Source | Neutral page title | Relevant section |
| --- | --- | --- |
| S1 | FAQs on Reports | Report types; field visibility; personal folders |
| S2 | Understanding and building reports | Grouping; aggregation; sorting; quick-view filters; actions; folders; roles |
| S3 | Scheduling Reports | Scheduler setup; standard fields; recurring delivery |
| S4 | FAQs: Exporting Data | Exporting data from reports |
| S5 | Creating dashboards | View/manage dashboards; sharing; dashboard/component filters |
| S6 | Analytical Components — Overview | Component families; detailed drilldown |
| S7 | Key Performance Indicators | KPI styles; duration; rollout warning |
| S8 | Charts | Report-based/quick charts; temporal grouping; rollout warning |
| S9 | Managing Profile Permissions | Module permissions: Reports and Analytics |
| S10 | Editing Criteria Patterns in Reports | Criteria-pattern limit |

Use S2 for the current builder rather than the older developer-platform
builder instructions. S7/S8 warn of phased availability: documentation is not
proof that a control exists in this account. S6's general access wording refers
to Reports permission, whereas S5/S9 distinguish Analytics access; use S9's
permission vocabulary, with effective account permissions still unverified.
No public page establishes this account's saved definitions or runtime state.

### U1–U7 disposition

Status describes the whole question, including the retained R1–R3 evidence.
No question is fully answered by generic help documentation alone.

| Question | Disposition | What R4 resolves / leaves open | Implementation consequence |
| --- | --- | --- | --- |
| U1 — missing folder pane | Partly | S2 describes folders; why the captured pane is absent remains unknown | Preserve observed selector; do not add a second pane based on documentation |
| U2 — categories | Partly | R3 remains the evidence for visible options; documentation does not certify persistence or the scrolled account catalogue | Keep category selection semantics pending; RD IDs do not replace R10–R19 |
| U3 — empty lists/search | Open | No account-specific search matching, debounce, pagination or empty copy established | Synthetic empty/error cases are engineering fixtures, not observed parity |
| U4 — report results/types | Partly | RD01–RD08 and RD12 describe functional capabilities; initial criteria, click cycles and report-specific results remain unknown | Propose bounded fixtures; no universal email-result schema or inferred default sort |
| U5 — Analytics initialization | Open | Public help cannot explain the blocked automatic PUT or certify initialization | No retry, guard exception or successful-service claim; retain AC01–AC06 presentation caveat |
| U6 — actions/preferences | Partly | RD08–RD11 and AD01–AD08 narrow documented capabilities; exact menus, favorite persistence, permissions and validation remain unobserved | Separate read access from all mutations; no write implementation is authorized here |
| U7 — utility identity | Open | Help does not identify the captured information/help/bin controls | Retain existing unknown labels; no invented destinations |

### Proposed Reports inventory — documented, not observed

Placement is functional context, not a claim about exact menu order, icons,
selected states or availability in the captured report type.

| ID | Surface / function | Documented behaviour | Source / implementation boundary |
| --- | --- | --- | --- |
| RD01 | Tabular result | Records appear in table columns | S1; use per-definition headings, not email headings for all reports |
| RD02 | Summary result | Grouped records include subtotals and summary information | S1; grouped presentation requires a separately approved model |
| RD03 | Matrix result | Summaries intersect row and column categories | S1; a flat string table cannot express this structure semantically |
| RD04 | Grouping | Rows and columns can be grouped; combined groups form a matrix | S2; grouping editor and persistence excluded |
| RD05 | Aggregates / Show Details | Sum, average, minimum, maximum and count; detail rows, subtotals and grand totals have visibility controls | S2; no default checkbox state established |
| RD06 | Sorting | Summary/matrix columns support ascending and descending order | S2; initial order, third click, null ordering and ties remain unknown |
| RD07 | Quick-view filter | Up to five date, datetime, checkbox, user-lookup, picklist or multipicklist filters; Apply Filter restricts results, Clear removes criteria | S2; no universal initial date range inferred |
| RD08 | Report actions | Run, Edit, Clone, Export; Send Email offers immediate or later delivery | S2; exact menu composition/order remains open; never execute in the reference |
| RD09 | Folders / access | Sharing supports Only me, Everyone or Selected Users; administrators can view others' reports | S2; folder sharing is distinct from exporting a file |
| RD10 | Scheduler | Scheduled Reports leads to a scheduler with report, format, start date/time, repeat/end and recipients. Recurrence: daily, weekly, monthly, yearly; email and supported chat integrations; at most 2,000 records | S3; integration availability, timezone/DST, failure copy and defaults remain open; no scheduler creation |
| RD11 | Export | Formatted exports preserve grouping: Excel/CSV/PDF, up to 2,000 rows. Detailed exports omit grouping: Excel/CSV, up to 50,000 rows | S4; no download, file generation or daily quota assumption |
| RD12 | Joined results | Up to three reports with the same primary module may be combined | S2; not a fourth basic report type; proposed later scope only |
| RD13 | Favorites | S2 identifies a predefined Favorites folder; R1/R3 show star/category affordances | S2 plus retained evidence; toggle, removal, ranking, limits and persistence remain open |
| RD14 | Permission vocabulary | Reports permissions distinguish View, Manage, Schedule and Export | S9; actual grants and denied-state presentation remain unverified |

S1 documents field visibility restrictions and private folders with administrator
access. Do not equate generic metadata CRUD flags with these capabilities.
Do not infer record-level security from whether a report definition is visible;
any real query implementation needs its own permission review.

S2's builder criteria limit (four), quick-view limit (five), and S10's criteria
pattern guidance (twenty-five) describe different or versioned surfaces.
Do not collapse them into one validation constant. S3's broad export wording
mentions HTML, while S4's report-specific section lists the formats in RD11.
HTML availability, detailed-PDF availability suggested by S2's broad wording,
and edition-specific daily quotas stay open rather than becoming contracts.
The inventory intentionally uses S4's narrower export matrix.

Report-result drilldown to an individual record, grouped-cell navigation,
target routes, breadcrumbs and back behaviour remain unverified. S2's
“drill down into related modules” concerns builder relationships, not evidence
of a result-cell interaction. Analytics drilldown is separately documented
below and must not be generalized to every report table.

### Proposed Analytics inventory — documented, not observed

| ID | Surface / function | Documented behaviour | Source / implementation boundary |
| --- | --- | --- | --- |
| AD01 | Dashboard catalogue | Favorites, Created by me, Shared with me, Public and other users' dashboards; the last category is administrator-only | S5; no exact option sequence or account list inferred |
| AD02 | Dashboard management | A consolidated management surface offers list/grid views | S5; not evidence that this is the captured overview; no view preference change |
| AD03 | Component families | Charts, KPI, Comparator, Anomaly Detector, Target Meter, Funnel, Cohort, Quadrant, Zone and Stage; up to twenty components | S6; do not retrofit every family into AC01–AC09 |
| AD04 | Period / metrics | KPI configuration has week, month, quarter, year, last-date, custom-date and fiscal-week duration choices; five KPI styles include scorecard/rankings | S7; configuration choices are not a universal overview period picker |
| AD05 | Dashboard filters | User/date/datetime/picklist fields; Apply/Clear affect relevant components, unfiltered components show a warning; Save Filter persists values | S5; no account defaults or saved criteria established |
| AD06 | Component filters | Up to two configured fields; temporary Apply differs from persistent Apply and Save; Anomaly Detector is excluded and cross-module Comparator has restrictions | S5; separate component state from dashboard-wide criteria |
| AD07 | Dashboard sharing | Only me, All users or Custom; locked dashboards are editable only by creator/admin | S5; sharing is not equivalent to data permission |
| AD08 | Component actions | Clone, Delete, Add to Home/Favorite, Embed URL, Move and Download are documented | S5; no exact menu layout or write action is approved |
| AD09 | Component drilldown | Charts, KPIs, Target Meters and Comparators can open detailed reports | S6; destination shape, columns and close/back behaviour remain unobserved |
| AD10 | Chart sources / periods | Report-based charts or Quick Charts; temporal grouping includes day, calendar/fiscal week, month, fiscal quarter and year; joined reports cannot source charts | S8; grouping granularity differs from a period filter |
| AD11 | Access vocabulary | Analytics permissions distinguish View Dashboards, Manage Dashboards and Export Dashboards | S9; no effective grants inferred from painted cards |

AD01/AD04–AD06 narrow R2's access gaps at the documentation level only.
They do not unlock reference re-entry or certify selector contents, visible
period controls, loading completion, chart interactions or lower-card layout.
No viewport measurements, assets or customer examples were copied.

### Suggested read-only fixture slices — proposals, not authorization

Existing code was inspected only to identify reusable seams. Names below are
repository-relative; no source changes accompany R4.

| Slice | Existing building blocks | Proposed synthetic cases and checks | Explicit limit |
| --- | --- | --- | --- |
| F1 — definition/detail baseline | `modules/reports/port.ts`: `ReportsPort.listReports/getReport`, `ReportDefinition`, `ReportDetail`; existing list/detail screens and fixture port | Missing optional cells, unknown report ID, empty and populated detail; assert headings belong to that definition and navigation remains read-only | Current fixture assigns email headings to every report; do not claim it covers RD01–RD03 |
| F2 — tabular illustration | Same `ReportDetail.headings/rows` shape and detail-screen tests | A synthetic lead-status table with three rows and fixed update time, plus an empty variant; assert columns/values align | No execution, date default, sort or generic report engine contract implied |
| F3 — grouped/matrix design fixture | Reuse definition identity, list navigation and screen shell | Two fictional categories with amounts 10 and 20, expected sum 30; later summary/matrix model must distinguish detail/group/subtotal/grand-total cells | Existing flat string rows lack group metadata; model/rendering approval precedes code, and aggregate labels must not masquerade as records |
| F4 — Analytics resting values | `AnalyticsPort.getDashboard`, `AnalyticsDashboardData`, `createFixtureAnalyticsPort`, existing card components | Independently authored mixed/value/empty dashboard data; fixed clock; check empty is distinct from zero and comparisons/target captions remain consistent | Port returns one dashboard without ID/filter parameters; it cannot establish AD01/AD05/AD06 selection or persistence |
| F5 — later catalogue/drilldown | Reuse screen shell and future read-only adapters, after contract approval | Synthetic catalogue categories and selected component records; permission-denied/loading/error cases should be explicitly designed and tested | Neither port currently models catalogue, permissions or drilldown; no guessed endpoint, route or mutation |

Use fictional names, amounts, labels and dates authored independently of
captures. Existing fixture values and comments are not research evidence.
F3/F5 require new approved contracts; F1/F2/F4 can reuse current data shapes
for bounded presentation tests. No developer data-source toggles belong in
product UI. Prefer test injection through existing ports. Proposed checks
are handoff guidance, not tests run in this documentation-only task.

R4 closes this bounded documentation research with U4/U6 partly answered and
R2 Analytics gaps narrowed only functionally. All remaining access/visual
questions above persist. UI Lead approval of this spec is not a module gate
or permission to implement undocumented defaults or reference writes.

## W4 historical gap disposition — superseded on 2026-10-25

Historical record only: the board reopened MEP-1346 for live observation on
25 October. The following gap-only disposition is superseded; the live
continuation below is authoritative for new observations.

MEP-1346 resumed after W0 and W3 completed. The then-current Platform Lead decision
in [MEP-1355](/MEP/issues/MEP-1355#comment-68b28723-d4fb-4860-b352-c92690ff7d75)
applies to W2–W4: unsupported live flows close as **unobserved gaps**. Installed
window tooling is not a verified live endpoint/body/restore contract. No
synthetic policy may be presented as a live contract. Send/invitation flows
also require a board-authored recipient confirmation; the address in the task
description alone does not satisfy that tool requirement. No policy, guard or
adapter was changed here, and no new live observation was attempted.

### Reports and Analytics gap inventory

Every row below is **unobserved / open**. Existing R1–R4 observations and
documentation remain evidence only to their stated extent. Requested test
objects would have used the `ZZTEST-` prefix; none was created.

| ID | Requested flow | Missing evidence / retained boundary |
| --- | --- | --- |
| RW01 | Create and save a tabular report | Builder steps, required fields, validation, save result, list insertion and cleanup verification |
| RW02 | Create and save a summary report | Group configuration, subtotals, saved result and delete verification; RD02 is documentation only |
| RW03 | Create and save a matrix report | Row/column configuration, intersections, validation and saved result; RD03 is documentation only |
| RW04 | Grouping, filters and sorting | Editor options/defaults, apply versus persistence, result refresh and restored state; RD04–RD07 do not certify live behaviour |
| RW05 | Create, organize and delete a report folder | Folder form, permissions, moving a test report, deletion restrictions and final absence |
| RW06 | Favorite and unfavorite a test report | Persistence, category membership, ordering and restoration; the visible star is not proof of a successful toggle |
| RW07 | Share a test report with the board user only | User picker, effective access, validation and exact restoration; no other recipient or user is authorized |
| RW08 | Schedule report delivery to the board recipient only | Recipient confirmation, supported live contract, format/recurrence/timezone defaults, save result and cancellation; no scheduler or delivery created |
| RW09 | Export a test report | Format dialog, validation, download/result and file contents remain unobserved; RD11 remains documentation, not a tested export contract |
| RW10 | Delete test reports and verify cleanup | Confirmation, success/error state, disappearance and any recycle-bin lifecycle; no deletion was executed |
| AW01 | Create, edit and delete a dashboard | Name/access defaults, validation, saved catalogue state and cleanup; AD01/AD07 remain documentation only |
| AW02 | Add, edit and delete a dashboard component | Type-specific forms, required fields, preview, persistence, errors and cleanup; AD03 does not establish one universal form |
| AW03 | Dashboard/component period and filters | Visible choices, default period, temporary versus saved values, refresh and restoration; AD04–AD06 remain documentation only |

No literal validation, success, error, permission-denied, empty or loading copy
was learned in W4. No new screenshot or numbered painted control inventory
exists for these flows; RW/AW IDs track gaps, not observed controls. Previously
blocked Analytics initialization writes remain blocked and unexplained. No
guessed request paths, payloads, restoration procedures or API shapes are added.

### Audit and next boundary

W4 did not open the reference CRM, create a report/folder/dashboard/component,
favorite, share, schedule, export, send, delete or change any preference. There
is no W4 test object or setting to restore. The local write-window journal was
inspected and contains its empty table scaffold only; it was not altered.
This is a scoped no-write statement, not the global W5 cleanup report.

[MEP-1347](/MEP/issues/MEP-1347) owns the window-wide verification and closure.
The existing independent review stage checks this documentation and evidence
boundary. This disposition is neither parity acceptance nor ADR/module-gate
approval. A future live attempt requires the separately approved single-flow
path in MEP-1355; it must not be inferred from this gap inventory.

## W4 live continuation — 2026-10-25, cleanup pending

The board reopened the window for live observation; W1 completed before this
continuation. The earlier W4 gap disposition is historical, not the current
completion result. This section records actual Turkish-interface observations.
W4 is **incomplete and paused for cleanup**. Home/Workqueue and Visits/Social
were not reached in this continuation. Their earlier evidence limits remain.

### Observed flow and controls

The Reports entry opens a populated list. Rapor Oluştur opens a modal over the
list. Its module selector starts empty; Devam appears disabled until a module
is chosen. The menu exposes CRM modules, including Leads, Contacts, Accounts,
Deals, Tasks, Meetings and Calls. Selecting Leads updates the field and enables
Devam. This is unsaved form state, not a created report. The attempted Devam
click was refused by the capture guard because of its savePrimaryModule
attribute. One preceding role selector matched no element; the later exported
unique option selector successfully selected Leads. No report builder/save,
validation message, report definition or report cleanup was observed.

Analytics Pano Oluştur opens an editor with a narrow app navigation rail,
a component palette on the left, and name/description/access controls above
an empty grid. Its initial name is Untitled Dashboard and its access is
Yalnızca ben. Saving the independently named ZZTEST test dashboard with no
description or components succeeds. The resulting dashboard shows its test
name, private access, Panoyu Sil, and the empty message
**Herhangi bir Bileşen Bulunamadı** with Bileşen Ekle. A component is therefore
not required for this observed save. No transient success toast is certified.

| ID | Visible control / state | Position and observed behaviour | Source / owner |
| --- | --- | --- | --- |
| WL01 | Rapor Oluştur | Reports toolbar; opens primary-module modal | reports-entry/create; Reports |
| WL02 | Birincil Modül Seç | Modal dropdown; empty placeholder, then chosen module | report-module/selected-module; Reports |
| WL03 | Module choices | Dropdown list; unique Leads option selected | report-module/selected-module; Reports |
| WL04 | İptal | Modal footer; visible, not operated | report-create; Reports |
| WL05 | Devam | Modal footer; enabled after selection; attempted click guard-blocked | report-builder/selected-module; Reports |
| WL06 | Pano Oluştur | Analytics toolbar; opens new editor | analytics-entry/dashboard-create; Analytics |
| WL07 | Pano Adını Gir | Editor header textbox; initial default replaced with test name | dashboard-create/save-validation; Analytics |
| WL08 | Açıklama Gir | Editor header textbox; left empty | dashboard-create; Analytics |
| WL09 | Yalnızca ben and access pencil | Header; initial private access, not operated | dashboard-create; Analytics |
| WL10 | Favorite star | Header beside name; not operated | dashboard-create; Analytics |
| WL11 | İptal | Editor upper right; visible, not operated | dashboard-create; Analytics |
| WL12 | Kaydet | Editor upper right; saves empty test dashboard | dashboard-save-validation; Analytics |
| WL13 | Component type palette | Left editor rail; Chart, KPI, Comparator, Anomaly Detector, Target Meter, Funnel, Cohort, Quadrant, Zone, Stage, Waterfall; gallery below viewport in initial editor | dashboard-create/add-component; Analytics |
| WL14 | Bileşen Ekle | Empty dashboard action; opens component-type modal | dashboard-add-component; Analytics |
| WL15 | Galeriden seç | Component modal; visible, not operated | dashboard-add-component; Analytics |
| WL16 | Grafik | Component modal; opens chart-source choice | dashboard-chart-form; Analytics |
| WL17 | Hızlı çizelge | Chart-source dialog; instant chart choice, not operated | dashboard-chart-form; Analytics |
| WL18 | Raporlardan | Chart-source dialog; existing-report choice, not operated | dashboard-chart-form; Analytics |
| WL19 | Panoyu Sil | Saved test dashboard toolbar; cleanup attempt guard-blocked | dashboard-delete-open; Analytics |
| WL20 | Close icon | Upper-right of component and chart-source dialogs; visible, not operated | dashboard-add-component/chart-form; Analytics |

Source abbreviations above have the prefix `w4-`. The full stable capture slugs
are in the audit table below. Screenshots were inspected alongside controls.json
and aria.yml. Duplicate wrappers are not counted separately. The app shell and
utility controls remain owned by the existing shell inventory; new editor rail
appearance was automatic, not an operated persistent collapse preference.

### Mutation and restore audit

The managed journal records three successful outgoing requests at
19:18:49–19:18:51 UTC: one dashboard create (HTTP 201), then two metadata updates
(HTTP 200) recording the same test dashboard as recently accessed. The latter
are passive access traces permitted by the board; no explicit preference change
was requested. The create used private access and no components. No customer
record, existing dashboard, recipient, sharing permission or setting changed.
No report, folder, component, schedule, export or external connection was created.

The cleanup capture attempted only Panoyu Sil on the registered test dashboard.
It was skipped with `dangerous attribute: delDashboard`; no delete request was
sent. **The test dashboard remains present and is not marked cleaned.** Further
reference activity stopped immediately and the board was notified. No guard,
policy module or tool was modified to circumvent the refusal; no new repair
chain was opened. The existing journal and registered object remain intact.
The board must remove the single empty test dashboard through the UI and report
the outcome; CRM Analyst then obtains fresh passive absence evidence before
using the official cleanup-proof flag. A board report alone is not absence proof.
The separately retained W2 test folder is not a W4 cleanup result.

| Capture slug | Steps / outcome | W4 cumulative writes | Blocked request count |
| --- | --- | --- | --- |
| w4-reports-entry | Entry; no steps | 0 | 2 |
| w4-report-create | Create opening clicked | 0 | 3 |
| w4-report-module | Create opening and dropdown clicked | 0 | 3 |
| w4-report-builder | Two openings; unmatched option and blocked Devam | 0 | 3 |
| w4-report-selected-module | Three clicks; module selected | 0 | 3 |
| w4-analytics-entry | Entry; no steps | 0 | 4 |
| w4-dashboard-create | Editor opened | 0 | 4 |
| w4-dashboard-save-validation | Editor opened, test name filled, Save clicked | 3 | 4 |
| w4-dashboard-add-component | Component modal opened | 3 | 4 |
| w4-dashboard-chart-form | Component modal and chart-source dialog opened | 3 | 4 |
| w4-dashboard-delete-open | Delete opening skipped by guard | 3 | 4 |

Blocked background requests have click-lock/host reasons; they were not retried
outside the tool. Runtime shell/sortable diagnostics remain capture limitations.
No permission-denied, server-error, loading or successful delete state was learned.
No raw IDs, account values, private addresses or request payload values are
reproduced here. The managed journal is the wire evidence, not a synthetic API
contract. Screenshots remain outside the repository.

### Coverage remaining at pause

RW01–RW04: primary-module entry observed only; tabular/summary/matrix builder,
grouping, filtering, sorting and saved reports remain open. RW05–RW10: folder,
favorite, sharing, scheduling, export and report deletion remain unobserved.
AW01: empty private create/save observed; editing and successful deletion remain
open, with cleanup pending. AW02: component-type and chart-source menus observed;
component form/save/edit/delete remain open. AW03: period/filter operation remains
unobserved. No parity, architecture or module-gate approval is claimed.
