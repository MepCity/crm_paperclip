# Automation rules — Workflow and Assignment

Status: R1 approved by UI Lead; R2 ready for review. Partial evidence, not a module gate.
Scope: MEP-1199 (R1) and MEP-1208 (R2) under MEP-1198. Module 2+ parity: screenshots, controls and
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
