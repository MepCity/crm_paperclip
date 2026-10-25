# Automation rules — Workflow and Assignment

Status: R1 approved by UI Lead; R2 evidence retained; R3 ready for UI Lead review.
Scope: MEP-1199 (R1), MEP-1208 (R2), MEP-1253 (R3) under MEP-1198/MEP-1250. Module 2+ parity: screenshots, controls and
behaviour; no geometry or frontend request matching. Research date: 2026-10-23.

## Purpose and evidence boundary

Administrators configure conditional workflow actions and incoming-record owner
assignment under Setup > Automation. This report separates observed screens (O),
public documentation (D), and unresolved behaviour (U). Documentation is not proof
of this account's edition, enabled features, populated screens or visual layout.
No existing rule could be opened: Workflow does not load its content; Assignment
shows an introductory screen with no rule rows. No rule was created to fill gaps.

## Capture refs and read-only audit

Paths below are relative to the local research workspace, outside the repository.
Each directory contains screenshot.png, aria.yml, page.txt, controls.json,
network.json and meta.json. Raw evidence stays local because it contains account
information. Screenshots were inspected and reconciled against controls.json;
ARIA alone is not treated as a visible-control inventory.

| State | Capture directory | Result | meta.json audit |
| --- | --- | --- | --- |
| W0 — original Workflow landing | `captures/m10r10-workflow-rules-base/` | Blank content, loading marker and route-model errors; not an empty rules list | clicks/steps empty; 4 blocked background requests: reminder + telemetry |
| W1 — targeted Workflow retry | `captures/m12r1-workflow-rules-list/` | Same blank content; loading strip; route-model parse errors | clicks/steps empty; 1 blocked background reminder request |
| A0 — Assignment introductory state | `captures/m10r10-assignment-rules-base/` | Rules tab, explanatory paragraph, create control; no rows | clicks/steps empty; 5 blocked background requests: reminder, notification status + telemetry |

All three: skippedClicks and allowedOpenClicks empty; no file chooser, download,
print call or popup. Blocked background POSTs were prevented by the capture tool;
none was a deliberate action or an accepted mutation. No settings, view, filters,
rule status or order changed through this research. W1 used direct navigation
only to `/crm/<org>/settings/workflow-rules`, with a 1500 ms final wait. A0 was
reused instead of recapturing a fully evidenced state. No tabs were closed.

Before navigation, the capture tool's guards.mjs was read: DANGEROUS_TEXT rejects
assignment, enable/disable, clone, update, save and other write labels/attributes.
No guard override, alias selector, toggle or create/edit control was used.
Accordion expansion and other persisted preferences were left untouched.

## Layout and fields

### W0/W1 — Workflow unavailable content (O)

Setup sidebar and global top bar render. Main content is blank; W1 has a thin
loading indicator at the top. ARIA includes Loading; diagnostics report a route
model parse failure. There is no visible inline explanation, retry control,
list header, filter, tab, row, status toggle or row menu. Do not implement this
capture as the intended Workflow zero-record state. The underlying cause is
unresolved; do not infer that the account has zero workflow rules.

### A0 — Assignment introductory state (O)

The scrolled Setup sidebar highlights Assignment under Automation. A large main
card has Rules (selected), Thresholds, and an assistant tab in that order. Below
are the Assignment Rules heading, contextual help on the right edge, a brief
purpose paragraph, and a Create Assignment Rule button below the paragraph.
The rest of the card is blank. No illustration, grid, columns, search, filters,
module selector, sort control, pagination, row menu or status control is visible.
This is an observed introductory state, not a verified database count or general
permission/error state. No editable field appears in either captured main area.

## Numbered control inventory

Numbers identify logical controls; wrapper and nested anchor/button exports are
one control. Position is qualitative. O means visible screenshot plus exported
control/ARIA evidence. Functions inferred from names or targets are explicitly
marked; no click behaviour was tested. Shell ownership is shared Settings/App
shell; only A1–A6 belong to Automation. Offscreen ARIA nodes, zero-size dialogs,
containers, headings, loading indicators and decorative glyphs are not controls.

### Shared top area — W0, W1, A0

| # | Position / control | Function and evidence | Owner |
| --- | --- | --- | --- |
| H1 | Top left back arrow | Return navigation implied by icon; not clicked; `appTopMenuBackIcon` (O) | Settings shell |
| H2 | Beside back, Setup Home | Link to neutral settings index (O); not followed | Settings shell |
| H3 | Sidebar header right, sliders | Settings editor link target in ARIA (O); customization not opened | Settings shell |
| H4 | Below sidebar header, Search | Settings search textbox (O); not filled | Settings shell |
| H5 | Top right, Search records | Global record search (O); not opened | App shell |
| H6 | Beside search, plus | Global create affordance, `createIcon` (O); not opened | App shell |
| H7 | After plus, assistant icon | Assistant entry, exported title (O); not opened | App shell |
| H8 | Bell | Notifications entry (O); not opened | App shell |
| H9 | Calendar icon | Calendar navigation link (O); not followed | App shell |
| H10 | Store icon | Marketplace navigation link (O); not followed | App shell |
| H11 | Gear | Setup navigation link, selected appearance (O); not followed | App shell |
| H12 | Avatar | Profile entry (O); not opened | App shell |
| H13 | Far right app grid | Applications menu, accessible name (O); not opened | App shell |

### Sidebar visible controls — W0/W1

Every row is O in both screenshots; destination follows exported semantics,
not an exercised flow. Section chevrons are part of the section header control.

| # | Position / control | Function | Owner |
| --- | --- | --- | --- |
| W1 | Sidebar below search, Frequently Used + chevron | Expanded section; never toggle | Settings shell |
| W2 | Under W1, Profiles | Profile settings link | Settings shell |
| W3 | Next section, General + chevron | Expanded section; never toggle | Settings shell |
| W4 | General first, Personal Settings | Personal settings link | Settings shell |
| W5 | General second, Users | User administration link | Settings shell |
| W6 | General third, Company Settings | Company settings link | Settings shell |
| W7 | General fourth, Calendar Booking | Booking settings link | Settings shell |
| W8 | General fifth, Motivator | Motivation settings link | Settings shell |
| W9 | General last, Agents | Agent settings link | Settings shell |
| W10 | Below General, Security Control + chevron | Expanded section; never toggle | Settings shell |
| W11 | Security first, Profiles | Profile settings link | Settings shell |
| W12 | Security second, Roles and Sharing | Roles/sharing settings link | Settings shell |
| W13 | Security third, mail add-on users | Mail add-on user settings link; neutralized label | Settings shell |
| W14 | Security fourth, Compliance Settings | Compliance link | Settings shell |
| W15 | Security fifth, Territory Management | Territory settings link | Settings shell |
| W16 | Security sixth, Trusted Domain | Trusted-domain settings link | Settings shell |
| W17 | Security seventh, Support Access | Support-access link | Settings shell |
| W18 | Security next, Single Sign-On | Identity settings entry; not followed | Settings shell |
| W19 | Security next, Security Policies | Identity policy entry; not followed | Settings shell |
| W20 | Security next, Active Directory Sync | Directory entry; not followed | Settings shell |
| W21 | Security next, Login History | Login-history entry; not followed | Settings shell |
| W22 | Sidebar bottom, Audit Log | Audit settings link | Settings shell |

W0/W1 have no visible footer utility strip or Workflow content controls. Further
sidebar sections exported below the viewport are not claimed as screenshot evidence.

### Sidebar visible controls — A0

A0 starts mid-sidebar; header H1–H4 remains fixed. Cropped Wizards at the top and
Segmentation at the bottom remain recorded; other offscreen entries are excluded.

| # | Position / control | Function (O; not followed) | Owner |
| --- | --- | --- | --- |
| S1 | Top clipped entry, Wizards | Wizard settings link | Settings shell |
| S2 | Below S1, Kiosk Studio | Kiosk settings link | Settings shell |
| S3 | Below S2, Canvas | Canvas settings link | Settings shell |
| S4 | Below S3, Customize Home page | Home customization link | Settings shell |
| S5 | Below S4, Translations | Translation settings link | Settings shell |
| S6 | Below S5, Templates | Template settings link | Settings shell |
| S7 | Below S6, Teamspace | Teamspace settings link | Settings shell |
| S8 | Middle sidebar, Automation + chevron | Expanded header; never toggle | Settings shell |
| S9 | Automation first, Workflow Rules | Workflow landing navigation | Settings shell |
| S10 | Automation second, Actions | Action configuration navigation | Settings shell |
| S11 | Automation third, Schedules | Schedule configuration navigation | Settings shell |
| S12 | Automation fourth, Assignment | Selected; assignment landing navigation | Settings shell |
| S13 | Automation fifth, Scoring Rules | Scoring configuration navigation | Settings shell |
| S14 | Automation last, Cadences | Cadence configuration navigation | Settings shell |
| S15 | Below Automation, Process Management + chevron | Expanded header; never toggle | Settings shell |
| S16 | Process first, Blueprint | Process configuration link | Settings shell |
| S17 | Process second, Approval Processes | Approval configuration link | Settings shell |
| S18 | Process third, Review Processes | Review configuration link | Settings shell |
| S19 | Process last, Connected Workflow | Connected workflow link | Settings shell |
| S20 | Lower sidebar, Experience Center + chevron | Expanded header; never toggle | Settings shell |
| S21 | Experience first, Signals | Signal configuration link | Settings shell |
| S22 | Experience second, journey orchestration | Journey settings link; neutralized label | Settings shell |
| S23 | Bottom clipped, Segmentation | Segmentation link | Settings shell |

### Assignment main card and utility strip — A0

| # | Position / control | Function and evidence | Owner |
| --- | --- | --- | --- |
| A1 | Card top left, Rules | Selected tab; assignment-rules link target (O) | Automation |
| A2 | Next tab, Thresholds | Assignment-thresholds link target (O); destination unobserved | Automation |
| A3 | Third tab, assistant | Assignment reasoning link target (O); destination unobserved | Automation |
| A4 | Heading area, help image | ARIA help image within heading help target (O); exact hit area/action unverified | Automation |
| A5 | Card right edge, orange question tab | Contextual help `Contextual-HelpIcon` (O); not opened | Automation |
| A6 | Below description, Create Assignment Rule | Creation entry affordance (O); prohibited in this research; not opened | Automation |
| F1 | Footer left, My Pins | Pins entry (O); not opened | App shell |
| F2 | Next footer item, Chats | Chat entry (O); not opened | App shell |
| F3 | Next footer item, Contacts | Messaging contacts entry (O); not opened | App shell |
| F4 | Utility strip right, document/clock glyph | Unnamed `wmscsdiv` control (O); function unresolved, never clicked | App shell |
| F5 | Next icon, Announcements | Announcement entry, exported name (O); not opened | App shell |
| F6 | Next icon, Motivator | Motivation entry, exported name (O); not opened | App shell |
| F7 | Next icon, Sticky Notes | Notes entry, exported name (O); not opened | App shell |
| F8 | Next icon, Activity Reminders | Reminder entry, exported name (O); not opened | App shell |
| F9 | Next icon, Recent Items | Recent-items entry, exported name (O); not opened | App shell |
| F10 | Next icon, Accessibility | Accessibility entry, exported name (O); not opened | App shell |
| F11 | Purple Help | Help entry (O); not opened | App shell |
| F12 | Far right small bin-shaped glyph | Screenshot-only utility glyph; no unique named export reconciled; function unresolved | App shell |

A4 is retained because of exported help semantics; screenshot does not establish
a second independently usable help button beside the heading. Do not invent one.
S1/S23 are partly occluded by fixed shell regions. Offscreen controls exported
above them do not belong to the observed viewport.

## Documentation-only fields, actions and flows

Sources D1–D3 below were read on 2026-10-23. These are functional summaries,
not permission to configure the reference or a visual spec for unseen screens.

### Workflow (D1)

Configuration proceeds through module/name/description, trigger, conditions,
then actions. Record triggers cover creation, editing, creation-or-editing and
deletion; date-based execution is also documented. Conditions can match criteria
or all records, with later branches handling unmatched records. Immediate actions
include notifications, activities, field updates, webhooks, functions and record
creation; conversion depends on the trigger/module. Scheduled actions use a
trigger-relative time or a date/time field. A rule needs an associated immediate
or scheduled action before saving. Updating criteria or dates can cancel or
reschedule pending work. These fields and sections are candidates for a future
read model; no detail arrangement, action picker, literal validation, limits or
success/error wording is visually certified here.

### Assignment (D2, D3)

Configuration uses module, name and description, record criteria, and recipient
selection by user/role/group or user conditions. Multiple recipients use round
robin; availability can constrain recipients. Rules apply to imported, webform
and API records rather than ordinary manual creation. Ordered entries determine
the first matching assignment; a default recipient handles unmatched records.
Documentation describes opening a rule to inspect Rule Entry and a reorder
operation. Reordering and all saves were not attempted. Exact recipient labels,
round-robin display, validation, default presentation and detail layout remain
unobserved. The data required to render a read-only entry includes criteria,
recipient category and references, order, distribution mode and fallback; these
are proposed application fields, not a verified reference schema.

### Source catalog

Public reference CRM help articles (neutral titles). To keep prohibited names
and host identifiers out of the repository, paths below are help-site-relative;
they are documentation locations, not frontend network contracts. No example
records, customer values, images or branding were copied.

| Key | Article | Public help relative path |
| --- | --- | --- |
| D1 | Configuring Workflow Rules | `portal/en/kb/crm/automate-business-processes/workflows/articles/configuring-workflow-rules` |
| D2 | Setting up Assignment Rules | `portal/en/kb/crm/automate-business-processes/assignment-rules/articles/set-assignment-rules` |
| D3 | FAQs: Assignment | `portal/en/kb/crm/faqs/automation/assignment-rules/articles/faqs-assignment` |

## Metadata and implementation slices

`metadata/workflow_rules.json` contains an unsupported-version API error (400);
`metadata/assignment_rules.json` is null. Neither exports usable rule data;
neither is a data-model source. No reference rules, criteria, users or identifiers
are copied to fixtures. No network contract is asserted for Module 12.

1. **Ready after review: Assignment introductory screen.** Reuse Settings/App
   shell; port A1–A6 and the observed blank body using an explicitly synthetic
   empty fixture. Test selected tab, visible controls, absent grid and safe local
   navigation. Help and creation need separately specified local destinations;
   do not ship a fabricated wizard as parity. Thresholds/reasoning are outside R1.
2. **Ready as infrastructure only: fixture read port.** Define local read-only
   loading/empty/failure outcomes and synthetic rules using the documented
   concepts above. Platform design approval remains necessary for a shared API
   or schema. These fixtures are not exported metadata or a populated-list spec.
3. **Not visually ready: Workflow list and both rule details.** A list shell,
   populated columns/menus and trigger/condition/action or recipient entry panels
   need safe evidence or an explicitly approved functional interpretation. Do
   not turn W1's capture failure into the product's normal empty screen.
4. **Deferred: execution and editing.** Builders, validation, activation,
   reordering, clone/delete, scheduled execution and actual assignment require
   separate approved implementation/QA slices. Research never executes them.

## Open questions and state coverage

| Key | Gap / next evidence needed | Current disposition |
| --- | --- | --- |
| U1 | Workflow normal list, tabs/filters/columns, populated/empty states and row menu | Repeated route failure; safe recapture after access/rendering recovery, without weakening write guards |
| U2 | Workflow existing detail, trigger/criteria and instant/scheduled action sections | No accessible row or verified detail path; no guessed record identifiers |
| U3 | Assignment populated list and existing detail, criteria and recipient/round-robin display | No existing rule entry exposed in A0; retain documentation-only model until safe evidence exists |
| U4 | Create wizard, action pickers, schedule controls and all literal validation/success/errors | Unobserved without entering restricted flows; D1–D3 provide functional background only |
| U5 | Permission denied, true loading completion, transport errors and list search/filter persistence | Not observed; W1 is capture failure evidence, not a certified error design |
| U6 | A4 help hit area, F4 and F12 functions | Labels/unique safe target insufficient; not clicked |
| U7 | Edition-specific actions, limits, recipient availability and fallback details | Public docs cannot establish active account configuration |

No screenshot is claimed for U1–U7. UI Lead should approve the bounded Assignment
landing slice and identify which visual gaps require a later research task;
module parity remains open. No board decision or reference mutation is needed
to review this evidence-limited report.


## R2 — bounded recapture and Assignment navigation (MEP-1208)

R1's approved source was recovered from commit `9419f359` because its spec and
parity rows were not yet present in this issue's current `origin/main`. This
revision preserves that baseline and appends only the R2 findings. No UI code,
shared contract or automation data model changes are included.

### Capture refs and safety audit

Each directory below contains the six standard evidence files in the local
research workspace. Raw files are intentionally not committed or uploaded:
they contain account information. The sanitized spec is the review deliverable.

| State | Capture directory | Observation | Read-only audit |
| --- | --- | --- | --- |
| W2 | `captures/m12r2-workflow-list-attempt1/` | Workflow direct route, 12000 ms final wait; shell painted, content blank and loading marker visible | No clicks/steps; 3 background POSTs blocked: reminder and two telemetry |
| W3 | `captures/m12r2-workflow-list-attempt2/` | Same route, 20000 ms final wait; same blank content and loading strip | No clicks/steps; 3 background POSTs blocked: reminder and two telemetry |
| A7 | `captures/m12r2-assignment-thresholds/` | Assignment Rules introductory page remains visible; requested A2 navigation did not execute | One requested navigation click; step skipped by dangerous-attribute guard; 3 background POSTs blocked: reminder, notification status, telemetry |
| A8 | `captures/m12r2-assignment-assistant/` | Rules introductory page remains selected; A3 target did not open | One requested navigation click; step skipped by dangerous-attribute guard; 3 background POSTs blocked: reminder, notification status, telemetry |

W2/W3 complete their capture commands successfully, but this is **not** a
successful Workflow render. At capture, `pendingAtReady` is empty,
`cdnInFlight` is zero, and script failure count is zero in both. Diagnostics
still report JSON parsing failure in the Workflow route model and an undefined
sortable-parent dependency. A completed document load and settled asset fetches
do not prove that route content rendered. No normal empty state, permission
screen, transport-error design or existing-rule count can be inferred. Two
attempts were used; no further Workflow retry or guessed detail URL was made.

### Numbered inventory reconciliation

Screenshots were inspected alongside controls.json. W2/W3 retain H1–H13 and
W1–W22 from the R1 inventory, with no Workflow content control to add. Loading
strips are state indicators, not controls. A7/A8 retain H1–H13, S1–S23, A1–A6
and F1–F12 from A0. The Rules tab remains selected; there are no existing rule
rows, editable fields or additional main-card controls.

| # | Position / control | Newly established behaviour / boundary | Owner |
| --- | --- | --- | --- |
| A2 (R2) | Second tab, Thresholds | Exported nested anchor targets neutral route `/crm/<org>/settings/assignment-thresholds`; unique exported link wrapper requested once. Guard skips it because assignment-related attributes match its dangerous-action policy. Destination is not observed. | Automation |
| A3 (R2) | Third tab, assistant | Exported anchor is a distinct reasoning-page navigation target; requested once through its unique exported link wrapper. Guard skips the assignment-related attributes; Rules remains selected and the destination body is unobserved. | Automation |

`meta.clicks` records requested selectors, not proof that clicks executed.
`meta.steps[].result` and `skippedClicks` determine execution. No alternate
selector, direct destination route, toggle flag or allow-open override was used
to work around a guard refusal. Navigational intent alone does not certify
preference persistence. No tabs were closed.

### U-question resolution and next slices

| Key | R2 result | Disposition / next evidence |
| --- | --- | --- |
| U1 | Still unresolved: two bounded captures reproduce a route-model failure after shell paint and asset settling | Do not implement the blank region as the intended list or zero-record state. Further research needs a reviewed access/rendering recovery path. |
| U2 | Still unresolved: no Workflow list row exists in observed content | No detail navigation or identifier guessing; trigger/criteria/actions remain documentation-only. |
| U3 | Still unresolved: Assignment still exposes an introductory state, without an existing row | Populated list and detail need a pre-existing accessible rule; no rule creation for research. |
| U5 | Partially characterized: capture/render failure is reproducible, but no intended error UI is visible | Permission, transport-error presentation, genuine loading completion and search/filter persistence remain unobserved. |
| A2/A3 targets | Link semantics established; destination capture subject to guard results | A skipped step is not destination evidence; opening a local tab shell does not certify its target body. |

No additional destination UI slice is unlocked by R2. The R1-approved Assignment
introductory slice and synthetic read-only fixture remain the available scope.
Workflow list, both details, Thresholds and assistant body remain outside visual
implementation readiness. A narrowly reviewed capture-tool navigation-policy
follow-up can consider these specific read-only links; this report neither
changes guard policy nor requests permission to mutate the reference CRM.
U4/U6/U7 remain unchanged from R1. The Module 12 gate stays open.

## R3 — documentation-based read-only screens

MEP-1253, 2026-10-24. The board accepted documentation-based continuation in
MEP-1234; MEP-1250 separates implementation into Assignment and Workflow slices.
This section supersedes the earlier implementation-readiness restrictions for
these two read-only surfaces only. It does not certify unseen visual parity.
No new capture, click, toggle, reference data creation or metadata export was
performed. W0–W3/A0/A7/A8 remain the observation boundary and safety ledger.
D1–D3 were reread; no new documentation source was needed. The source catalog's
neutral article paths remain the citation keys for each numbered item below.

### Reading the inventory and port boundary

D1–D3 establish concepts, not the account's populated screen arrangement.
**I** means a proposed local functional interpretation; **A0 pattern** means
reuse of the observed introductory card only. Every inferred presentation has
an explicit U8+ question. All rows are owned by Automation; shared shell controls
retain their earlier owners. Display regions and states are numbered alongside
interactive controls so implementation and QA can trace the complete surface.
No geometry or pixel table applies.

Port mappings below refer to `packages/core/src/automation/types.ts`.
`list` is `AutomationPort.list(ctx, { kind, module?, cursor?, limit })`;
`get` is `AutomationPort.get(ctx, { kind, id })`. `RulePage.items` contains
`RuleSummary`, **without** trigger, branches, entries or fallback. Detail reads
must narrow `kind` before rendering. Loading is local promise state, not a
`ReadResult` variant. An empty result is `ok: true` with zero items; a failure
must never be rendered as that result. Neither method changes rules or executes
an engine. IDs/revisions identify and reconcile reads; they are not new columns.

### Workflow list inventory

| # | Region / read-only behaviour | Source / uncertainty | Port mapping |
| --- | --- | --- | --- |
| WL1 | Content heading Workflow Rules; table columns Name, Module, Trigger, Status in that proposed order | D1 concepts; I arrangement, U8 | `list` with `kind: workflow`; no heading/layout field |
| WL2 | Name is a keyboard-accessible detail link; one row per returned rule | D1 basic details; I link placement, U8/U9 | `RulePage.items[].name`, `.id`, `.kind`; `get` by same id |
| WL3 | Module label in each row | D1 module concept; I column, U8 | `RuleSummary.module`; label resolved locally |
| WL4 | Trigger summary, including selected fields or date field as applicable; never derive it from rule name | D1 trigger concept; I summary, U8/U10 | `get` → `WorkflowRule.trigger`; absent from `RuleSummary` |
| WL5 | Enabled/Disabled text, without an interactive switch | I presentation, U8/U15 | `RuleSummary.enabled` |
| WL6 | Module filter with All modules option; selection affects this local screen only | I, U8/U11; A0 contains no filter | `list.query.module`; omit for All modules; reset cursor |
| WL7 | Pending read: loading status; no fabricated rows | I, U12; W0–W3 are failures, not normal loading proof | Local pending `list`; separate pending `get` for WL4 |
| WL8 | Successful zero rows: empty explanation; distinguish no rules from no matches for selected module | I, U12; do not reuse W0–W3 blank region | `ok: true`, `value.items.length === 0`; current module filter |
| WL9 | Access denied: explicit unavailable-access state; no empty table claim | I, U12 | `ok: false`, `error.code: forbidden` |
| WL10 | Read failure: error plus safe local retry; preserve filter, prevent stale response replacement | I, U12 | `unavailable` / `invalid_query`; unexpected rejected promise handled locally; retry `list` |
| WL11 | Read next page only when a cursor exists; no invented total count or user-controlled sorting | I, U8/U11 | `RulePage.nextCursor`, `list.query.cursor/limit`; no total/sort field |

WL4 requires a separate read for each visible rule because the current list
contract lacks trigger. Deduplicate by id/revision within the loaded page and
bound detail-read concurrency; do not change the port in this slice. A pending
summary has its own loading text. A failed summary shows unavailable text and
local retry, while Name/Module/Status remain usable. U10 tracks this proposed
fallback and cost; never invent a trigger or silently label it disabled.

### Workflow detail inventory

| # | Region / read-only behaviour | Source / uncertainty | Port mapping |
| --- | --- | --- | --- |
| WD1 | Name heading, module, description and static status; return link to list | D1 basic details; I grouping/navigation, U9/U15 | `get` → `RuleBase.name/module/description/enabled`; no back-link field |
| WD2 | Trigger region: record event; changed field references; or date field and timezone | D1 trigger concepts; I display, U9/U16 | `Trigger.kind`; `record.on`, `field_change.fields`, `date.field/timezone` |
| WD3 | Ordered condition branches, with all-records or readable criteria expression | D1 conditions; I branch layout, U9/U16 | `WorkflowRule.branches`, `Branch.position/id/condition`; `Condition.kind`, `criteria` |
| WD4 | Immediate actions: show category and definition reference; show explicit empty section when none | D1 instant actions; I reference/empty display, U9/U13 | `Branch.immediate[]`; `Action.id/kind/definitionRef` |
| WD5 | Scheduled groups: time basis, offset and actions; explicit empty section when none | D1 scheduled actions; I group display, U9/U13 | `Branch.scheduled[].id/timing/actions`; `Timing.kind/offsetSeconds`, field-relative `field/timezone`; `Action` |
| WD6 | Pending, denied, not found and unavailable detail states; retry only reads; list remains reachable | I, U12 | Local pending `get`; `ReadFailure.code` including `not_found`; wrong returned kind treated as local failure |

Display `Branch.position` order, without drag handles. A condition is a
structured expression, not executable code. Keep parentheses, field/operator
and typed value distinctions from `Criteria`; do not flatten nested logic into
an inaccurate sentence. Date/field labels may use existing local metadata;
unresolved fields retain a neutral reference label (U13). Event-relative timing
uses its signed offset: negative before, zero at, positive after the event;
field-relative timing also names field and timezone. This is a display convention
(I, U16), not schedule calculation. Do not compute next-run dates.
The port does not express every D1 option, such as recurrence, section-change
triggers or later unmatched-branch semantics. Do not infer them from position
or `all_records`, add fields, or pretend opaque definitions contain full action
configuration. These remain U16, outside this read-only slice.

### Populated Assignment list inventory

| # | Region / read-only behaviour | Source / uncertainty | Port mapping |
| --- | --- | --- | --- |
| AL1 | Keep Assignment Rules heading and selected Rules tab; populated rows replace introductory body after a successful nonempty read | A0/A7/A8 pattern; I transition, U14 | `list` with `kind: assignment`; `RulePage.items` |
| AL2 | Proposed columns Order, Name, Module, Status; Name opens detail | D2 basic details; I columns, order/navigation/status, U14/U15 | `RuleSummary.position/name/id/module/enabled`; `get` with `kind: assignment` |
| AL3 | Module filter; read next page only when present | I, U11/U14; absent in A0 | `list.query.module/cursor/limit`; `RulePage.nextCursor` |
| AL4 | No rules: retain observed introductory paragraph/card; filtered zero matches: local no-matches explanation | A0 pattern; I distinction and hidden creation control, U12/U15 | Successful empty `RulePage.items`; current filter; no database-count assertion |
| AL5 | Loading, forbidden and error/retry states distinct from introductory body | I, U12 | Local pending `list`; `ReadFailure.code`; safe retry reads only |

AL2 order is rule-level `RuleBase.position`; it is not the entry evaluation
sequence. Preserve adapter page order; no browser sort may claim a global order
across cursors (U11). D2's entry sequence belongs to AD2. AL1 does not claim A0
itself proved zero records. Existing Thresholds/assistant navigation boundaries
remain as in R2; R3 does not specify destination bodies or enable blocked links.

### Assignment detail inventory

| # | Region / read-only behaviour | Source / uncertainty | Port mapping |
| --- | --- | --- | --- |
| AD1 | Name heading, module, description, static status; return to Assignment list | D2 basic details; I arrangement/status/navigation, U14/U15 | `get` → `AssignmentRule.name/module/description/enabled`; no navigation field |
| AD2 | Ordered entry rows, each with a displayed sequence and condition | D2 entry ordering/criteria; I table, U14/U16 | `AssignmentRule.entries[]`; `AssignmentEntry.position/id/condition` |
| AD3 | Recipient category and references; user-condition recipients show definition reference | D2/D3 recipient concepts; I display, U13/U14 | `AssignmentEntry.recipients`; `RecipientSet.kind`, `.refs` or `.definitionRef` |
| AD4 | Static distribution label Single or Round robin; no simulation or next-recipient prediction | D2/D3 multiple-recipient allocation; I label mapping, U14 | `AssignmentEntry.distribution: single / round_robin` |
| AD5 | Static availability policy: Ignore availability, Require available, or Unresolved | D2/D3 availability concept; I three-state display, U7/U14 | `AssignmentEntry.availability: ignore / require_available / unresolved` |
| AD6 | Separate default recipient section; null explicitly means no fallback configured in this fixture | D2/D3 default recipient; I null/type display, U7/U14 | `AssignmentRule.fallback: RecipientSet / null` |
| AD7 | Empty entries and pending/forbidden/not-found/error states remain distinct; keep return navigation | I, U12/U14 | Successful `entries.length === 0`; local pending `get`; `ReadFailure.code`; wrong kind fails locally |

AD2 orders entries by position and reads criteria as WD3; the screen never
checks a real record against them. AD3 preserves users/roles/groups distinctions;
`user_conditions` is an opaque definition, not a list of matched users. Use
synthetic references only. A directory resolver is absent from `AutomationPort`:
do not add a hidden request or claim references are human-readable names (U13).
AD5 is configured policy, not current online/shift status. `unresolved` must not
be coerced to ignore. AD6 does not invent a default owner when null, and the port
allows recipient sets broader than the documented default-user concept (U7).
D3 describes a contextual acting-user fallback when no default is selected;
this port does not encode that context. Null therefore reports configuration
only, never a prediction that unmatched records stay unassigned (U7/U16).
Associated follow-up tasks, thresholds and assistant suggestions have no fields
here; leave them outside the slice and tracked in U16.

### Write-control disposition

| # | Control | Proposed local decision and reason | Source / port boundary |
| --- | --- | --- | --- |
| RC1 | New rule / Create Assignment Rule | Hide, including A0's A6; no approved builder or write method | A6 observed; D1/D2 creation concept; I omission, U15; no port method |
| RC2 | Edit | Hide; detail is a read-only inspection | D1/D2 write flow; I omission, U15; no port method |
| RC3 | Delete | Hide; no deletion flow in scope | D1; I omission, U15; no port method |
| RC4 | Clone | Hide; no cloning flow in scope | D1; I omission, U15; no port method |
| RC5 | Reorder / drag handles | Hide; show positions as text only | D2 sequence concept; I omission, U15; `position` is read-only |
| RC6 | Enable/disable switch | Replace with static status text; no focusable switch | I, U15; read `enabled`, no update method |

These are review proposals under U15, not observed reference behaviour or a
claim that the board already chose omission. If UI Lead retains an affordance,
render it disabled with a readable read-only explanation and no handler. Never
substitute an enabled button that silently does nothing. No save, mutation,
execution, assignment, recipient lookup side effect or persisted preference is
unlocked. The reference's controls are never clicked to resolve this decision.

### Current open-question register (supersedes earlier dispositions)

| Key | Current disposition / decision still needed |
| --- | --- |
| U1 | W0–W3 do not establish normal Workflow visuals. Board permits functional documentation-based WL1–WL11; visual parity remains uncertified. No recapture requested. |
| U2 | Existing Workflow detail remains unseen. WD1–WD6 are documentation/port interpretations, not captured detail evidence. |
| U3 | Existing Assignment populated list/detail remains unseen. AL1–AL5/AD1–AD7 proceed under documentation-based scope, not a newly observed row. |
| U4 | Builders and literal validation/success/write errors remain deferred; no writes authorized. |
| U5 | Actual permission/loading/error designs and persistence remain unknown; U11/U12 specify proposed local handling only. |
| U6 | A4 help hit area and F4/F12 utility functions remain unresolved; no new actions inferred. |
| U7 | Account edition/limits, availability configuration and fallback semantics remain unknown. In particular, null fallback and non-user fallback sets require explicit display conventions, not claimed reference defaults. |
| U8 | Workflow column order, summary placement, list grouping and pagination affordance are unobserved. UI Lead reviews the proposed functional table. |
| U9 | Workflow detail arrangement, back-navigation state and empty action-section presentation are unobserved. Proposed sections require review. |
| U10 | Trigger summary is missing from RuleSummary. Review bounded per-row get reads, loading and partial-failure display; a contract extension needs separate approval. |
| U11 | Module filter presence, default list ordering, cursor presentation and filter/back-navigation persistence are unobserved. Proposed local filter resets cursor, is not saved, and does not globally sort pages. |
| U12 | Exact empty/loading/forbidden/not-found/error wording and retry presentation lack evidence. Proposed distinct accessible status regions must not masquerade as captured states. |
| U13 | Human-readable field, recipient and action labels/configuration cannot be resolved by this port alone. Use neutral synthetic reference labels; no fabricated resolved names or external lookups. |
| U14 | Assignment populated columns/detail arrangement, rule versus entry order display, distribution/availability captions and A0 transition are unobserved. Proposed read-only sections need UI Lead review. |
| U15 | Hiding creation/edit/delete/clone/reorder and replacing activation switches with text is a local scope proposal, including deviation from A0's visible A6. UI Lead must decide hidden versus disabled; no write action is offered either way. |
| U16 | D1/D2 options exceed the current read model: recurrence, section-change and unmatched branches, full action definitions and Assignment follow-up tasks. Show only representable fields, mark opaque references, defer unsupported semantics; never alter the model in these UI slices. |

### Implementation and verification handoff

| Slice under MEP-1250 | Inventory coverage | Verification expectations |
| --- | --- | --- |
| MEP-1255 populated Assignment | AL1–AL5, AD1–AD7, RC1–RC6 as applicable; reuse existing A0 shell | Synthetic empty/populated fixtures; module/cursor read arguments; correct entry order, all recipient variants, both distributions, three availability policies, null/non-null fallback; separate load/denied/missing/failure states; no mutation affordance handlers |
| MEP-1256 Workflow | WL1–WL11, WD1–WD6, RC1–RC6 as applicable | Synthetic trigger/condition/action/timing variants; per-row summary failure; empty and populated pages; module/cursor reset; kind narrowing; immediate/scheduled empties; separate denied/missing/failure states; no execution or write requests |

Each slice uses the existing read-only adapter and synthetic data. Preserve all
previous evidence and unresolved questions. This is a screen specification, not
an ADR approval, engine implementation, persistence decision or completion claim
for either coding slice. UI Lead review of these numbered proposals is the next
step; new reference capture is neither required nor authorized by R3.

## W3 — write-window gap disposition (MEP-1345)

2026-10-25. This section records an evidence-limited disposition, not completed
write observation. The final Platform Lead decision in MEP-1355 applies to
W2–W4: without an evidenced live endpoint/body/restore contract, no live write
observation proceeds. Synthetic policy examples are not live contracts. The
capture guards and activation requirements remain unchanged. W0 tool completion
and W2 documentation acceptance do not establish these missing contracts.

The board's temporary observation permission does not establish tool support.
No policy was fabricated or published, no guard bypass was attempted, and no
reference page was opened for this issue. The existing R1–R3 observations and
documentation-based functional scope above retain their original provenance.
This section adds no new visual, control, request or literal-message evidence.

| Key | Requested flow | W3 result / evidence still required |
| --- | --- | --- |
| AW1 | Create a prefixed Workflow rule | Unobserved / gap. Need the actual form, required fields, inactive creation contract and verified cleanup. No rule created. |
| AW2 | Workflow trigger and criteria builders | Unobserved / gap. Need field/operator/value controls, condition grouping and validation. Prior documentation is functional background only. |
| AW3 | Workflow immediate-action builder | Unobserved / gap. Need action picker and configuration states. No action executed; email recipients must remain restricted to the board under the window rules. |
| AW4 | Workflow scheduled-action builder | Unobserved / gap. Need timing controls, limits and save outcomes. No schedule or delayed action created. |
| AW5 | Edit a test Workflow rule | Unobserved / gap. Need populated editor, save/cancel outcomes and persistence evidence. No existing rule changed. |
| AW6 | Activate, deactivate and delete test Workflow rule | Unobserved / gap. No status toggle or delete attempted. Current tool policy requires inactive Automation payloads, so activation is unsupported; do not relax it to satisfy the observation list. Cleanup and single-object absence verification need proven contracts. |
| AW7 | Create a prefixed Assignment rule | Unobserved / gap. A0's creation affordance is previously observed; the creation wizard and save outcome are not. No rule created. |
| AW8 | Assignment criteria and recipient/action builders | Unobserved / gap. Need ordered entries, recipient choices, distribution, fallback and any follow-up action controls. No actual user/role/group assignment or record processing attempted. |
| AW9 | Edit, activate/deactivate and delete test Assignment rule | Unobserved / gap. Need editor, status availability, confirmation and persistence/cleanup evidence. Do not infer that a Workflow-style switch exists for Assignment. |
| AW10 | Literal validation, success/error, empty/loading/permission states | Unobserved / gap for the write flows above. No empty submission, duplicate-name probe or failed write was attempted; no literal message, numbered control inventory or screenshot is invented. |

AW1–AW10 retain U4/U7/U16 and all relevant visual questions as open. The
Workflow render failure remains diagnostic evidence; this disposition does not
turn it into a normal empty state. Read-only local implementation slices above
are not expanded to builders, execution or persistence. No Automation gate,
engine contract, ADR or functional/visual parity claim is approved here.

For any later research, CRM Analyst must first establish a single-flow live
contract through permitted evidence and obtain the separately reviewed policy
and approvals required by MEP-1355. Platform Lead owns contract/policy decisions;
UI Lead owns screen-evidence interpretation. No new adapter or implementation
issue is opened on speculative wire formats in this task.

Scope-specific restore statement: this issue created no rule, action, schedule
or test record, sent no email and changed no status or preference. There is
nothing from this issue to restore. The local window journal was inspected and
contains only its empty table scaffold. This is not the W5 global cleanup report.
Verification: AW1–AW10 coverage, preservation of prior evidence, neutral-language
and privacy checks, and git diff --check. Documentation only; application tests
and reference captures are inapplicable. Submit through the issue's existing
independent review stage; acceptance means gap documentation only.
