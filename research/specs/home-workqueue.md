# Home and Workqueue — R1 read-only research

## Purpose and evidence boundary

MEP-1241 inventories the current Home entry and Workqueue entry. Module 2+
inventory parity applies. This is a bounded research deliverable, not a complete
dashboard specification or approval to implement unobserved states.

Home still presents onboarding rather than a dashboard. Workqueue opens a welcome
dialog over a populated Tasks queue. The dialog was never dismissed. Navigation
also attempted an automatic user-preference update, which the guard blocked.
Research stopped there: no further captures, queue changes or retries.

Sources are screenshots reconciled with controls.json and aria.yml. A control
exported behind the dialog or outside the viewport is explicitly distinguished
from a screenshot-visible control. Duplicate wrapper/button/link entries count
as one user control. Hidden empty dialogs and decorative images are excluded.
No reference assets, personal values, record names or identifiers are reproduced.

## Capture refs and safety ledger

All captures remain in the local research workspace; no screenshots are committed
or uploaded because they contain personal and record data.

| Slug | Navigation and requested steps | Paint gate | Blocked requests | Outcome |
| --- | --- | --- | --- | --- |
| `m14r1-home-default` | Home/begin; 0 clicks, 0 steps | `[data-zcqa="tab_Home"]`; passed; no failed scripts | 4 | Painted onboarding Home |
| `m14r1-workqueue-entry` | Home/begin, then one `role=link[name="Workqueue"]` navigation click; 1 step, clicked | Same Home gate passed before navigation | 6 | Painted Workqueue with welcome dialog; destination verified from screenshot and control tree, not a separate destination probe |

Both captured on 2026-10-23 UTC, sequentially under the capture lock. Both contain
screenshot.png, aria.yml, page.txt, controls.json, network.json and meta.json.
No hover, scroll, keypress, skipped click, allowed-open exception, automatic
Escape, download, chooser or print occurred. Guard configuration was unchanged.

Home blocked reminder retrieval, notification-status, URL-monitor telemetry and
internal client-tracking POSTs. Workqueue blocked those four categories, an
exception-telemetry POST, and **PUT `/crm/v9/settings/user_view_preference`**.
The preference request arose on entry without selecting a queue, period, filter
or view. It was not allowed or retried; its payload semantics are not certified.
No successful preference or record mutation is evidenced. Diagnostics include
shell/router errors, a missing sortable function and XMLHttpRequest errors;
they limit completeness and are not requirements for our product.

The earlier failed `m14-home-default` attempt never created a slug directory or
reached the browser; it has no gate or blocked-request result. MEP-1243 resolved
the sandbox output-permission boundary; the successful R1 captures used the
authorized elevated command without changing capture code or guards.

## Layout and comparison with earlier Home evidence

Home has the expanded shared navigation, a Home header and global toolbar. Its
body has a personalized greeting, video preview, webinar link and setup panel.
The panel lists five setup choices; team invitation is already highlighted and
its explanatory area contains an Invite users button. Skip is at the upper right.
These are onboarding regions, not activity/KPI widgets or empty dashboard cards.

Compared with `home-main` and `m2s-home-base`, the body structure and five setup
choices are unchanged. The current pinned label is MCP rather than MCP Server.
Sales is now already collapsed; Activities and Integrations remain expanded.
Consequently more standalone module links fit in the visible rail. The oldest
capture also had Channels and Threads in the bottom strip; the intermediate and
current captures show My Pins, Chats and Contacts. No preference was operated to
produce these differences; their cause is unknown.

Workqueue retains that shell. A user panel and adjacent plus control sit above a
left queue panel and right Tasks list. A modal welcome panel dims and covers much
of both. Its upper illustration advertises four capabilities; it is promotional
content, not evidence that the illustrated queues or counts exist. Its lower
region has a short introduction and Get Started. No visible close button exists.

## Control inventory

### Shared shell — Home H and Workqueue W

S01–S47 apply to both screenshots. On W they are visible through the dim overlay;
no availability while the modal is open is claimed. All are unoperated except
S04 in the Workqueue capture. Sources: both R1 screenshots, controls.json and ARIA.
Owner is the shared shell unless a destination module is named. Names describe
affordances; resulting menus and actions have not been tested.

| # | Position / control | Observed state or boundary / owner |
| --- | --- | --- |
| S01 | Rail top: product/application selector | Closed combobox; neutral product label in implementation |
| S02 | Rail top right: Hide Menu | Visible; persistent-layout risk; not operated |
| S03 | Pinned Home link | Selected in H; Home navigation |
| S04 | Pinned Workqueue link | Selected in W; sole tested navigation; Workqueue |
| S05 | Pinned Reports link | Reports destination |
| S06 | Pinned Analytics link | Analytics destination |
| S07 | Pinned Agents link | Agents destination |
| S08 | Pinned MCP link | MCP destination |
| S09 | Teamspace selector | Current teamspace caption; closed |
| S10 | Teamspace More Actions | Ellipsis; menu not opened |
| S11 | Rail Search | Empty module-search textbox; not filled |
| S12 | Sales group toggle | Already collapsed; not toggled |
| S13 | Activities group toggle | Already expanded; not toggled |
| S14 | Tasks link | Activities child; Tasks |
| S15 | Meetings link | Activities child; Meetings |
| S16 | Calls link | Activities child; Calls |
| S17 | Integrations group toggle | Already expanded; not toggled |
| S18 | Visits link | Integrations child; Visits |
| S19 | Price Books link | Standalone module navigation |
| S20 | Products link | Standalone module navigation |
| S21 | Quotes link | Standalone module navigation |
| S22 | Invoices link | Standalone module navigation |
| S23 | Sales Orders link | Standalone module navigation |
| S24 | Solutions link | Standalone module navigation |
| S25 | Social link | Last visible standalone link |
| S26 | Rail right edge: resize handle | Control export identifies handle; not dragged |
| S27 | Header: Search records | Closed global-search entry |
| S28 | Header: plus | Create affordance; `createIcon`; never clicked |
| S29 | Header: assistant icon | Accessible assistant label; not opened |
| S30 | Header: Notifications | Bell; not opened |
| S31 | Header: Calendar | Navigation affordance; Calendar |
| S32 | Header: Marketplace | Navigation affordance; Marketplace |
| S33 | Header: Setup | Navigation affordance; Settings |
| S34 | Header: Profile | Avatar entry; personal identity omitted |
| S35 | Header: Applications menu | Grid entry; closed |
| S36 | Bottom left: My Pins | Closed utility |
| S37 | Bottom left: Chats | Closed utility |
| S38 | Bottom left: Contacts | Closed utility; separate from CRM module navigation |
| S39 | Bottom right: unlabeled command icon | `open_commands_palette`; not opened |
| S40 | Bottom right: Announcements | Closed utility |
| S41 | Bottom right: unlabeled chart icon | Visible between Announcements and Motivator; no reliable exported name; untested |
| S42 | Bottom right: Motivator | Closed utility |
| S43 | Bottom right: Sticky Notes | Closed utility |
| S44 | Bottom right: Activity Reminders | Closed utility |
| S45 | Bottom right: Recent Items | Closed utility |
| S46 | Bottom right: Accessibility | Closed utility |
| S47 | Bottom right: Help | Closed utility |

Forecasts and additional module placeholders occur below the visible rail in the
export; they are not additional screenshot-certified controls for these states.
No shell group was expanded, collapsed or resized during this research.

### H — Home onboarding body

Owner: Home/onboarding. All nine controls are screenshot-visible, corroborated
by their data attributes or ARIA. None was operated.

| # | Position / control | Evidence and behaviour boundary |
| --- | --- | --- |
| H01 | Intro region: video play | `onboardingVideo`; playback untested |
| H02 | Below intro: Book Now | `webinarOption`; external webinar link, not followed |
| H03 | Setup first choice: Invite your team | `teamInviteOption`; initially highlighted |
| H04 | Setup second choice: Configure your deals pipeline | `dealsOption`; not selected |
| H05 | Setup third choice: Connect to your email account | `mailBoxOption`; not selected |
| H06 | Setup fourth choice: Migrate your existing data | `migrateDataOption`; not selected |
| H07 | Setup fifth choice: Integration | `appsAndExtensionOption`; not selected |
| H08 | Setup detail: Invite users | `teamInviteOptionButton`; write/setup flow forbidden |
| H09 | Body upper right: Skip | `skipOption`; onboarding change forbidden |

No Home-page switcher, existing-page list, period selector, task/meeting/call/deal
widget, KPI block or chart is visible. No per-widget empty state is observable.
This does not establish that a completed-onboarding dashboard lacks them.

### W — Workqueue initial welcome and underlying queue

Owner: Workqueue, except existing-record links owned by their destination modules.
W01 is the only unobscured dialog control. W02–W09 and W25–W29 have at least
partially visible counterparts around the dialog; central controls and labels
are occluded. The export records underlying controls regardless of occlusion.
Every entry below remains untested and unavailable for assumed use through the
modal. No click, dismissal or hover was used to expose additional controls.

| # | Position / control | Source and visibility limit |
| --- | --- | --- |
| W01 | Welcome dialog: Get Started | Screenshot and ARIA; never clicked; no close control observed |
| W02 | Top: User panel | Screenshot and `wq_superAdmin_userCont`; display name/avatar and role only |
| W03 | Top beside user: plus / users dropdown | Screenshot and `wq_superAdmin_userAdd`; unnamed combobox in ARIA; not opened |
| W04 | Left: My Open Activity period | Today & Overdue caption partly visible; options unknown |
| W05 | Left: Tasks activity queue | ARIA/control export; selected underlying Tasks list; dialog covers label |
| W06 | Left: Meetings activity queue | ARIA/control export; covered |
| W07 | Left: Calls activity queue | ARIA/control export; covered |
| W08 | Left: Blueprint job queue | My Jobs section; ARIA/control export, covered |
| W09 | Left: Customize queue | `wq_queueSetting`; covered; never opened |
| W10 | Left: Suggested queue | `wq_addQueue`; covered; never opened |
| W11 | Leads section: add queue | Export only behind modal; forbidden action |
| W12 | Leads: My Leads queue | Export only behind modal |
| W13 | Leads: recently assigned queue | Export caption uses a three-hour window; covered |
| W14 | Contacts section: add queue | Export only behind modal; forbidden action |
| W15 | Contacts: My Contacts queue | Export only behind modal |
| W16 | Contacts: recently assigned queue | Export caption uses a three-hour window; covered |
| W17 | Deals section: add queue | Export behind modal; forbidden action |
| W18 | Deals: My Deals queue | Screenshot below modal and export |
| W19 | Deals: Deals Closing This Month queue | Screenshot below modal and export |
| W20 | Campaigns section: add queue | Export below viewport; not screenshot-certified |
| W21 | Campaigns: My Active Campaigns queue | Export below viewport; not screenshot-certified |
| W22 | Tasks heading: refresh | Visible above dialog; `wq_crmRefreshLoader` |
| W23 | Tasks heading: Filter | Visible above dialog; `wq_lp_filterBtn`; not opened |
| W24 | Tasks heading right: contextual Help | Visible corner question mark; export has two Help images/boxes; only one fits viewport |
| W25 | Table header right: View Settings | Visible sliders; `listView_addColumn`; preference action forbidden |
| W26 | Subject header: All alphabet affordance | Export only, covered; `alphaSearch`; not opened |
| W27 | Per task: Subject record link | Ten exported row instances, mostly covered; destinations Tasks record detail; never clicked |
| W28 | Per task: Related To / Contact Name links | Lookup links exported, outside horizontal viewport; Accounts, Deals, Leads and Contacts destinations; never clicked |
| W29 | Footer: Previous / Next | Two separate controls; both visible disabled; no pagination performed |

W29 identifies both controls explicitly: W29a Previous and W29b Next. W27/W28
are repeated row-control templates, not copied record names. No visible mark
complete, edit, delete, assign or other per-row action was exposed. Empty leading
and trailing cells in the export are not evidence for any particular row action.
Queue section headings carry drag-oriented attributes; dragging was not tested
and no reorder behaviour is specified.

## Fields, widgets and data scope

Home greeting uses current-user display name; the setup panel uses a selected
setup-category state. There is no observed CRM record data widget on Home.

Workqueue user header shows avatar, display name and role. The left panel exports
My Open Activity (Tasks, Meetings, Calls), My Jobs (Blueprint), and My Workqueue
(Leads, Contacts, Deals, Campaigns) with numeric count badges per queue. Some
badges are zero; a zero badge does not establish an empty-result screen. No
approvals queue is certified merely because one appears in the welcome artwork.

The Tasks table exports Subject, Due Date, Status, Priority, Related To and
Contact Name, plus unlabeled edge cells. Screenshot-visible right-hand columns
are Status and Priority; other columns are substantially covered or horizontally
offscreen. Due Date is rendered as relative lateness in the export. Subject and
lookup cells are links; absent lookup cells can be blank. Footer shows total
record count, current range and disabled page controls. No sort indicator or
sort order is certified. No task checkbox or completion control is certified.

Metadata cross-check: Tasks `Subject` is text, `Due_Date` date, `Status` and
`Priority` picklists, `What_Id` (Related To) and `Who_Id` (Contact Name) lookups.
Home is a visible tab in modules.json; no separate Workqueue api_name was found
in that module index. Queue definitions are not established record-field schemas.
Request shapes and visual measurements are intentionally outside Module 2+ specs.

## Flows, filters and unobserved states

1. Enter Home at `/crm/<org>/tab/Home/begin`: current account renders onboarding.
   Inspect greeting/setup content; do not advance setup or Skip.
2. From Home follow existing Workqueue link. Its exported destination has the
   neutral shape `/crm/<org>/tab/Workqueue/<workspace>/queue/<queue>`; identifiers
   are opaque placeholders. Workqueue title, queue structure and welcome dialog
   render. Stop without Get Started. Automatic preference PUT is blocked.
3. Period is displayed as Today & Overdue; Filter and All alphabet affordances
   exist but options, application and persistence are unobserved. No filter,
   queue, user context, sort, layout or period was changed.
4. Record links exist underneath the modal, but no record was opened from it.
   Existing task/lookup detail routes belong to their modules; no new behaviour
   is inferred for this route.

Empty Home widgets, an empty Workqueue table, loading recovery, access-denied,
permission-specific menus and product error states remain unobserved. Tool/runtime
diagnostics are not substitutes for those states. No validation, write success,
completion, invitation, queue creation or onboarding transition was exercised.

## Open questions and accepted research limits pending UI Lead review

- U1: Completed-onboarding Home: page switcher, configured pages, widget types,
  per-widget fields and empty states are inaccessible in this observed state.
  No Skip, setup change, guessed alternate route or page selection is authorized.
- U2: Workqueue first-run dialog prevents unobscured interaction research.
  Dismissal/Get Started would change onboarding; not observable without a write.
- U3: Entry attempted a blocked user-preference PUT. Its intended effect and
  whether Workqueue initializes fully without it are unknown. Do not re-enter to
  retry, relax guards or infer successful initialization.
- U4: Queue selectors, period options, filter/sort controls, row actions and empty
  results need future safe evidence; modal artwork and zero badges are insufficient.
- U5: The bottom chart utility lacks a reliable name, and a duplicate exported
  contextual Help target is outside the viewport. Their actions remain unknown.
- U6: Current shell/runtime diagnostics and pre-navigation gate do not certify
  complete Workqueue readiness. The screenshot certifies only the entry state.

These are evidence limits, not approved deviations or a request for the board to
collect screenshots. UI Lead should judge the bounded R1 inventory and retain the
unobserved behaviour as open before any broader Module 14 implementation gate.

## Suggested first implementation slice (proposal, after research approval)

Build a local, read-only, fixture-backed Workqueue entry: reuse the existing app
shell, `components/records/list`, Tasks list configuration and existing record
detail routes. Use synthetic current-user and task fixtures, the observed section
labels and count-badge model, plus the initial welcome state. Keep fixture data
independent from research values. Recreate assets with our own code/tokens.

Limit acceptance to the observed entry structure, named control inventory,
semantic Tasks fields and safe local record links. Do not add Home dashboard
widgets or claim empty/filter/queue-management parity. Resolve modal/persistence
U2/U3 before enabling an interactive queue beyond the entry. A proposed follow-up
may test synthetic empty data, but its empty copy and behaviour need separate
evidence/approval. No implementation task is opened by this research.

Suggested later implementation checks: initial-entry component test, synthetic
task/count consistency, existing-record navigation test, and an e2e assertion
that opening the read-only route makes no mutation request. This docs-only issue
requires evidence and diff checks, not application test execution.

## R2 — documentation-based functional spec (MEP-1290)

### Evidence boundary and source register

Public documentation reviewed on 2026-10-24. **Documented, not observed** applies
to every HD/WD entry below. R1 remains the painted-state baseline; this supplement
does not certify the current installation, complete onboarding, authorize writes,
or open implementation work. No capture tool, authenticated application session,
page switch, dismissal, preference change or reference asset was used in R2.
Phase 2 research remains outside scope pending MEP-1284.

Titles below are neutral locators in the public reference CRM help center; URLs
and product-bearing titles are intentionally omitted under the naming rule.
Official help articles take precedence over historical announcements. No customer
values, account identifiers or screenshots are included.

| Ref | Neutral public page title | Section locator / evidence role |
| --- | --- | --- |
| D1 | Customizing Home Tab | Classic View; Switch between the Home Pages; Add Components in User's Home Page |
| D2 | Open Activities Homepage Component | What can you view; Decide how you want to view activities; Customize Activity information |
| D3 | Workqueue | Sections in Workqueue; Manager View; Accessing Workqueue |
| D4 | Introducing an updated User Home Page and other enhancements in Dashboards | Additional components for new sign-ups; historical defaults only |
| D5 | Introducing a new home page view and UI enhancements for Dashboards | Manager's Home; visual enhancements; historical empty-state guidance |

### Home page model and component catalogue

D1 documents Classic, personal User's Home, shared Customized Home and Manager's
Home. A top-right dropdown switches pages; last accessed becomes default.
Classic is fixed; personal and shared layouts are configurable. Actual configured
page names and account availability remain unknown.

Each row is documented with its source title via D1–D5. “Unknown” marks absent
field/empty-state evidence, not an empty value. IDs also form the proposed Home
inventory; they are functional candidates without certified position or geometry.

| ID | Type / data source | Fields or content | Empty evidence | Status / neutral page title |
| --- | --- | --- | --- | --- |
| HD01 | Page dropdown | Above page model | Unknown | documented — D1, Customizing Home Tab |
| HD02 | Classic Tasks list / Tasks | Fixed component; fields unknown | Unknown | documented — D1, Customizing Home Tab |
| HD03 | Classic Today's Events / Meetings | Fixed component; fields unknown | Unknown | documented — D1, Customizing Home Tab |
| HD04 | Classic Pipeline by Stage / Deals | Stage aggregation | Unknown | documented — D1, Customizing Home Tab |
| HD05 | Dashboard / configured analytics | Selected component | D5 caveat below | documented — D1, Customizing Home Tab |
| HD06 | Custom View / selected module | Selected view columns | Unknown | documented — D1, Customizing Home Tab |
| HD07 | Widgets / custom application | Application-defined | Unknown | documented — D1, Customizing Home Tab |
| HD08 | Kiosk / configured kiosk | Flow-defined | Unknown | documented — D1, Customizing Home Tab |
| HD09 | Reports / selected report | Report-defined | Unknown | documented — D1, Customizing Home Tab |
| HD10 | Voice of the Customer / selected component | Component-defined | Unknown | documented — D1, Customizing Home Tab |
| HD11 | Agents / configured agent | On-demand insights | Unknown | documented — D1, Customizing Home Tab |
| HD12 | Advanced Components | My Open Activities; Rich Text; Quick Links | Unknown | documented — D1, Customizing Home Tab |
| HD13 | Open Activities / Tasks, Meetings, Calls, Appointments | D2 field matrix below | Unknown | documented — D2, Open Activities Homepage Component |
| HD14 | New-user KPI presets / Deals, Leads, Calls | Open Deals; Leads; Untouched Deals; Today's Calls | Unknown | documented — D4, Introducing an updated User Home Page and other enhancements in Dashboards |
| HD15 | New-user custom-view presets / Tasks, Leads, Meetings, Deals | Open Tasks; Today's Leads; Meetings; Deals Closing this Month | Unknown | documented — D4, Introducing an updated User Home Page and other enhancements in Dashboards |
| HD16 | New-user funnel / Deals | Pipeline Deals by Stage | D5 caveat below | documented — D4, Introducing an updated User Home Page and other enhancements in Dashboards |
| HD17 | Manager dashboard / sales analytics | Monthly leads, deals, revenue, trend anomalies | D5 caveat below | documented — D5, Introducing a new home page view and UI enhancements for Dashboards |

“Widgets” (HD07) is an extension type, not a synonym for every dashboard card.
HD14–HD16 use current-user scope in D4. D4 says existing users retain their
customizations; these presets cannot establish this account's default dashboard.
Criteria such as “untouched”, exact KPI formulas and funnel values remain open.

D5 describes an illustration with “No data available” for empty dashboards and
ten rows for personal custom-view components. It is historical, not a universal
per-card empty contract. Do not apply it to HD02/HD03, custom applications or
Workqueue without evidence. Recreate any illustration independently.

D5 says custom pages always take default precedence, whereas D1 says last
accessed is default. Prefer the current help wording provisionally, retain this
conflict for approval, and do not test it in the reference. Manager access is
role-hierarchy-dependent in D5; it does not certify this user's entitlement.

### Open Activities: per-widget fields and selectors

Source for every row: documented — D2, *Open Activities Homepage Component*.
This is Home HD13, **not** a Workqueue period or column specification. The article
marks rollout as phased; no claim of current installation availability is made.

| Activity source | Documented default fields |
| --- | --- |
| Tasks | Due Date, Subject, Related To, Contact Name |
| Meetings | Title, From, To, Related To, Contact Name |
| Calls | Subject, Related To, Call Start time |
| Appointments | Appointment Name, Appointment For, Appointment Start Time |

HD13's timeline options are today, this week, next week and next seven days.
Preferences control overdue visibility and placement, plus all-day task/meeting
placement. Overdue starts at the top. Manage Fields selects an activity type and
supports field selection/reordering. These are preference-write boundaries;
none was operated. Date/time, activity information and related-record context
are documented; exact grouping, timezone edges, links and empty copy are open.
Appointments are a catalogue entry only, not authorization to expand module scope.

### Workqueue: functional inventory

**Documented, not observed.** D3, *Workqueue*, supports the following candidates;
IDs do not replace R1 W01–W29. No screenshot position, column order or account
entitlement is implied. This compact table is the documented Workqueue contract.

| ID | Functional candidate | Status / neutral page title |
| --- | --- | --- |
| WD01 | Open Activity: Tasks, Meetings, Calls, Appointments; today/overdue filtering | documented — D3, Workqueue |
| WD02 | Smart filters; manage columns | documented — D3, Workqueue |
| WD03 | Activity edit/delete/complete; overdue red, upcoming green | documented — D3, Workqueue |
| WD04 | My Records / Other User Records scope | documented — D3, Workqueue |
| WD05 | Queue source: custom view, date field or criteria; In the Last / Due In using hours/days/weeks | documented — D3, Workqueue |
| WD06 | Suggested queues; create queue; access selection | documented — D3, Workqueue |
| WD07 | Queue management: select/reorder; Category/List View | documented — D3, Workqueue |
| WD08 | Record field updates, email, follow-up, lead conversion | documented — D3, Workqueue |
| WD09 | Jobs: approval, review, Blueprint, image validation; approve/reject/delegate | documented — D3, Workqueue |
| WD10 | Manager subordinate context; existing queues only | documented — D3, Workqueue |

D3 specifies fifteen queues maximum, common across teamspaces; team/integrated
modules are unsupported. Manager View requires Enterprise or above.

**Unresolved in reviewed documentation:** exhaustive WD01 period menu (including
Tomorrow or custom ranges), WD02 operators/defaults, ordinary sort controls and
order, user-picker labels, row hover/menu geometry, exact completion eligibility,
pagination, and empty-result copy/actions. R1's Today & Overdue is an observed
caption, not proof of the entire menu. HD13 periods must not fill this gap.
No zero badge establishes an empty table; no generic dashboard empty illustration
establishes Workqueue emptiness. Record ownership and sharing semantics should
reuse existing authorization rather than infer new visibility from queue labels.
All WD03/WD06–WD09 writes and WD07 preferences remain prohibited in the reference.

### U1–U6 disposition

“Answered” requires the entire original question to be resolved. Documentation
narrows product capabilities; it cannot certify account state or remove R1's
blocked-request and runtime boundaries. No original question is fully answered.

| Question | Disposition | Implementation consequence |
| --- | --- | --- |
| U1 | partly — HD01–HD17 document page/component families; account page list, precise schemas/formulas and most empties unknown | Use explicitly proposed fixture variants, not a claimed configured dashboard; retain D1/D5 default conflict |
| U2 | still open — welcome dismissal and initialization effects not established | Retain first-run fixture separately; never require a reference dismissal to proceed |
| U3 | still open — documentation does not explain the blocked preference PUT or certify initialization without it | No retry, guard exception or inferred safe persistence; local fixtures make no preference requests |
| U4 | partly — WD01–WD10 establish capabilities; exhaustive periods, sort and empty-result contract unresolved | Limit local selectors to approved fixture options; no invented reference menu or action behaviour |
| U5 | still open — reviewed pages do not identify the bottom chart utility or duplicate offscreen Help target | Leave shared-shell ownership unchanged; do not invent an action |
| U6 | still open — public pages cannot certify this account's runtime/readiness | Keep R1 diagnostics separate from intended local loading/error behaviour |

### Suggested read-only fixture slices (proposals after research approval)

These are bounded implementation suggestions, not approved subtasks, API shapes,
metadata changes or new data models. Use synthetic records only. Reuse the
existing shell, list and record-detail components plus module field renderers.
Preserve the distinction between observed R1 entry and documented R2 candidates.

1. **H-F1 — personal page preview:** render a fixed, explicitly named fixture
   page with a Tasks custom-view card and a Deals aggregation card, drawn from
   existing module fixtures. Show source/field labels from HD06/HD16, with KPI
   formulas withheld unless approved. A local-only page selector may demonstrate
   HD01; it must not persist preferences or imply the account's actual page list.
2. **H-F2 — activity preview:** reuse Tasks/Meetings/Calls record links and HD13
   fields. Fix a synthetic clock/timezone for today/overdue tests. Keep Home's
   four documented periods separate from Workqueue options. Exclude Appointments
   until its own scope is approved. Empty, loading and error variants are local
   proposals needing acceptance, not documented reference copy.
3. **W-F1 — queue preview:** extend the R1 proposal with synthetic Tasks data,
   counts and existing detail links. Demonstrate populated and zero-result
   fixtures with clearly provisional empty presentation. Filter changes stay
   in memory; don't invent a full period/sort menu. Reuse underlying module
   authorization, and ensure unsupported pages make no queue requests.
4. **W-F2 — visibility preview:** separate current-user and subordinate fixtures
   only after an approved visibility contract. Represent Jobs and write actions
   as unavailable boundaries rather than implementing approval, conversion,
   email, queue creation or preference persistence. No real external integration.

Later implementation checks should cover count/result consistency, supported
module guards, safe existing-record navigation and absence of mutation requests.
Research verification is documentation/diff review plus the forbidden-term hook;
no application code changed, so no application tests are required for R2.
