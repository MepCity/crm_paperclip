# Feature F — Webforms, cadences, portals, journeys and ads

Research issue: MEP-1478; parent: MEP-1477. Research date: 2026-11-06.
Status: research complete within read-only observation limits; review required.
This is input to an ADR, not an architectural decision.

## Evidence and boundaries

The reference CRM was inspected through the guarded capture tool only. No form
was submitted, no account connected, and no record, setting, preference, portal,
cadence or journey was created or changed. Capture files remain in the local
research workspace; only neutral structure is reproduced here.

Evidence labels: **Observed** means screenshot plus text/control evidence;
**Metadata** means the existing module metadata export; **Documentation** means
public help/API documentation inspected on the research date; **Proposal** means
an ADR input requiring a decision. Documentation is not proof that this account
has an enabled feature or that its current screens match those documents.

Control numbers are local to each state. Shared shell controls are inventoried
once and inherited explicitly by each setup state. Duplicate wrappers and SVG
children describe the same control; zero-area hidden dialogs are not visible
controls. A control's purpose may be inferred from its label without executing
its action. Write controls are inventoried but never exercised.

### Shared setup shell (Observed; owner: app shell / Setup)

Inherited by W1/W2, C1 and subsequent setup states unless an exception is noted.
Background controls are visually present but covered by the modal in W2.
These controls were not clicked for this study.

1. Top-left back arrow — return from Setup.
2. Adjacent Setup Home link — setup index.
3. Beside Setup Home, sliders icon — setup customization, not exercised.
4. Left panel search input — filter setup navigation, not filled.
5. Top utility row, record search — global record search.
6. To its right, plus icon — global creation menu, unopened.
7. Next, assistant icon — assistant entry, unopened; original asset excluded.
8. Next, bell — notifications.
9. Next, calendar — calendar entry.
10. Next, marketplace icon — marketplace entry.
11. Next, gear — Setup, selected.
12. Next, profile avatar — account menu; no identity copied.
13. Far-right application grid — application menu.
14. Bottom-left pin — My Pins.
15. Next, chat bubble — Chats.
16. Next, person — Contacts.
17. Bottom-right strip, command icon — command palette.
18. Next, announcement icon — Announcements.
19. Next, chart icon — Motivator.
20. Next, note icon — Sticky Notes.
21. Next, clock icon — Activity Reminders.
22. Next, history icon — Recent Records.
23. Next, accessibility icon — accessibility options.
24. Next, Help — help panel.
25. Far-right small tray icon — visible utility icon; its precise function is
    not resolved from this capture and it was not clicked.

P1 and the initial cadence dialog screenshots have no bottom utility/chat
strip, so those states inherit only 1–13. J1/J2 and C1b additionally have **Channels** and
**Threads** in the bottom-left group, in that order between Chats and Contacts
(shared-shell controls 26 and 27). Shell loading/session differences are
recorded as observed variations, not a requested Feature F shell change.
Navigation accordions and links are separate from the above controls. Each
link opens its named settings area; each accordion caret could change panel
visibility and was never used. The visible sidebar sets are listed below in
top-to-bottom order; clipped/occluded DOM entries are excluded after screenshot
reconciliation. These are navigation controls, not new Feature F functions.

**W1/W2 sidebar:**

1. Security Policies (upper clipped row).
2. Active Directory Sync.
3. Login History.
4. Audit Log.
5. Channels heading/caret.
6. Email.
7. Telephony.
8. Business Messaging.
9. Notification SMS.
10. Webforms (selected).
11. Social.
12. Chat.
13. Portals.
14. Customization heading/caret.
15. Modules and Fields.
16. Pipelines.
17. Wizards.
18. Kiosk Studio.
19. Canvas (lower clipped row).

**C1 sidebar:**

1. Translations (upper clipped row).
2. Templates.
3. Teamspace.
4. Automation heading/caret.
5. Workflow Rules.
6. Actions.
7. Schedules.
8. Assignment.
9. Scoring Rules.
10. Cadences (selected).
11. Process Management heading/caret.
12. Blueprint.
13. Approval Processes.
14. Review Processes.
15. Connected Workflow.
16. Experience Center heading/caret.
17. Signals.
18. CommandCenter.
19. Segmentation (lower clipped row).

**P1 sidebar:**

1. Audit Log (upper clipped row).
2. Channels heading/caret.
3. Email.
4. Telephony.
5. Business Messaging.
6. Notification SMS.
7. Webforms.
8. Social.
9. Chat.
10. Portals (selected).
11. Customization heading/caret.
12. Modules and Fields.
13. Pipelines.
14. Wizards.
15. Kiosk Studio.
16. Canvas.
17. Customize Home Page.
18. Translations.
19. Templates (lower clipped row).

**J1/J2 sidebar:**

1. Scoring Rules (upper clipped row).
2. Cadences.
3. Process Management heading/caret.
4. Blueprint.
5. Approval Processes.
6. Review Processes.
7. Connected Workflow.
8. Experience Center heading/caret.
9. Signals.
10. CommandCenter (selected).
11. Segmentation.
12. Data Administration heading/caret.
13. Import.
14. Export.
15. Data Backup.
16. Remove Sample Data.
17. Storage.
18. Recycle Bin.
19. Admin Tools heading (lower clipped row).

**A1 sidebar:**

1. Remove Sample Data (upper clipped row).
2. Storage.
3. Recycle Bin.
4. Admin Tools heading/caret.
5. Sandbox.
6. Copy Customization.
7. Marketplace heading/caret.
8. All.
9. Reference application catalogue (neutral replacement for a branded label).
10. Google (selected).
11. Microsoft.
12. Extension Builder.
13. Facebook.
14. LinkedIn.
15. TikTok.
16. QuickBooks.
17. Developer Hub heading/caret.
18. MCP for AI Agents (truncated).
19. APIs and SDKs (lower clipped row).

A1 highlights the marketplace top icon instead of the Setup gear. The
Announcements utility is visually muted in that capture; availability was not
tested. None of the neighbouring integrations is part of the build scope.

## 1. Webforms — first implementation part

### W1. Empty landing page (Observed)

Capture: `mep-1478-webforms-list`. Route suffix: `/settings/webform`.
The page is inside Setup, with left setup navigation, top utilities and bottom
chat/utility strip. The content has two tabs and an introductory three-panel
area: form building, analytics and A/B testing. The rightmost panel is clipped
at the captured viewport; do not interpret clipped controls as absent.

1. Upper-left content tab **Webforms** — selected; returns to forms.
2. Adjacent **Auto-response Rules** tab — opens response-rule configuration.
3. Right content edge contextual help marker — help entry; not opened.
4. Under analytics description **Learn more** — documentation; not opened.
5. Under A/B testing description **Learn more** — documentation; not opened.
6. Below introduction **New Form** — entry to form setup; no form exists yet.

No populated table, columns, module selector, list search, filters, pagination,
row actions or statistics are displayed in this empty state. Their absence here
does not establish their absence after creating a form. There is no existing
form available to inspect in view mode. No error banner was visible.

### W2. New-form initial dialog (Observed)

Capture: `mep-1478-webform-dialog`; opened W1 control 6 without entering data.
The backdrop retains W1 and the shared shell; a modal sits above it.

1. First row **Form Name** — blank text input, initially focused, marked required.
2. Second row **Module** — required dropdown, initially unselected with a
   choose-module placeholder; options not yet inspected in this state.
3. Bottom-right **Cancel** — dismisses the dialog; not exercised in this capture.
4. Adjacent **Create** — visually inactive while required fields are empty;
   never pressed. The resulting editor is not observable without proceeding.

No layout selector or close icon is visible in this initial state. No validation
submission was attempted. The tool closed its own capture tab after inspection.

**W2a. Module menu open (Observed)** — `mep-1478-webform-modules` inherits W2
controls 1–4; the menu overlays part of its footer. Additional controls:

5. Top of menu, search input — empty; not filled.
6. First option **Leads**.
7. Second option **Contacts**.
8. Third option **Vendors**.
9. Fourth option **Cases**.

No option was selected. Vendors appearing in the reference picker does not
authorise building that module; use only modules supported by our current app
unless the CTO identifies a prerequisite within the authorised feature.

### W3. Builder, settings, embedding and submission (Documentation)

No existing form is available. Any inaccessible states below must remain
documentation-derived requirements rather than invented observed inventories.

Public help, **Setting up Webforms**: the workflow selects module and layout,
builds a field layout, configures details, and produces source HTML, embed or
iframe code. Builder capabilities include dragging fields, required/hidden
flags, help, CAPTCHA, file upload, button labels and preview. Details include
location URLs, owner/assignment, notifications, visitor acknowledgement and
manual approval. Acknowledgements can use a response rule or template. Double
opt-in requires the primary email field and confirmation before record creation.
Submission/confirmation can redirect or show a thank-you page; splash feedback
cannot be combined with double opt-in. Domain restrictions apply to form
locations. Publishing, embedding, submission and confirmation were not tested.

Public API reference, **Create Webform**: a form references module and layout,
ordered mapped fields and special fields. Field properties include label,
required, hidden, default and help; special fields include CAPTCHA, file upload
and privacy policy. Configuration carries owner or assignment rule, spam
threshold, opt-in, owner notification, visitor response, approval, submission
action, allowed locations and analytics options. Portal forms additionally have
user-type and password fields. Exact editor controls, defaults and validation
messages in this account remain unobserved.

### W4. Analytics (Documentation)

Public help, **Webform Analytics**: aggregate visits/submissions can be split by
form location. Outcome categories distinguish duplicates, failed validation,
pending approval, pending double opt-in and created records. Lead conversion,
resulting deals and revenue are separate downstream metrics. Unrecognised or
removed locations can appear under an undefined-location bucket. This page was
not reachable from an existing form; no live analytics control inventory is
claimed.

### W5. End-to-end behaviour boundary (Documentation / Proposal)

Documented sequence: configure fields → details/assignment/response → obtain
embed code → visitor submits → validation and opt-in/approval gates → record
creation → assignment/notification. The exact ordering of all gates is not
observed; the arrows express dependencies, not a verified transaction order.

Public help, **Troubleshooting Webforms**, says unique-field duplicates and
invalid entries may enter manual approval even when ordinary approval is off;
pending approval delays workflow execution. This rules out assuming every
successful HTTP submission creates an immediately usable record. CAPTCHA,
module validation and spam review address different failure classes. No
duplicate record was submitted to test those paths.

For implementation sizing, distinguish these states explicitly: draft form,
published form, unavailable form, invalid submission, suspected spam, duplicate,
pending confirmation, pending approval, accepted record, failed asynchronous
notification. Exact customer-visible messages, HTTP statuses, retry rules and
duplicate resolution require the ADR; these are proposed state distinctions,
not reference-observed error text. A/B testing is advertised in W1, but its
editor and experiment policies are unobserved and need a scope decision.

## 2. Cadences

### C1. Empty list (Observed)

Capture: `mep-1478-cadences`; route suffix `/settings/cadences`. Inherits the
shared Setup shell. Heading and explanatory paragraph precede a search/create
row and a table. The introduction describes response-driven email/call/task
follow-ups and automatic unenrollment after the target response.

1. Upper-right contextual help marker — not opened.
2. Above table, left **Search** — blank text input; not filled.
3. Above table, right **Create Cadence** — entry to setup; no save performed.
4. Table header **All Modules** dropdown — module filter, unopened in C1.
5. Table header **Status** dropdown — status filter, unopened in C1.

Columns: Cadence Name, Module (header displays the all-modules filter), Who is
this for?, Number of Records, Status. Empty table says no cadences were found.
No rows, row actions, pagination or existing cadence editor/report is available.
No error banner is visible. Search matching and filter persistence are untested.

**C1a. Module filter open (Observed)** — `mep-1478-cadence-module-filter`
inherits C1 controls 1–5 and adds these top-to-bottom menu controls:

6. All Modules (checked/current).
7. Leads.
8. Contacts.
9. Accounts.
10. Deals.
11. Quotes.
12. Vendors (bottom visible option).

No option was selected, and there is no search input in this menu. The menu
has a bounded viewport; do not assert that these are the only supported modules.

**C1b. Status filter open (Observed)** — `mep-1478-cadence-status-filter`
inherits C1 controls 1–5 and adds:

6. Status (checked/current, no status restriction).
7. Active.
8. Inactive.

The menu opens below the Status header; no value was selected.

### C2. Initial create dialog (Observed)

Capture: `mep-1478-cadence-dialog`; opened C1 control 3 with no data entered.
The modal overlays the list; C1 controls are background only. Sidebar as C1;
only shared-shell controls 1–13 remain visible.

1. First row **Cadence Name** — blank text input, focused, required marker.
2. Second row **Module** — required dropdown, choose-module placeholder.
3. Third row **Description** — blank multiline textarea, resize grip.
4. Fourth row **Who is this for?** — required dropdown, initially None, visually
   muted before module selection. No audience was selected.
5. Bottom-right **Cancel** — dismiss action, not exercised.
6. Adjacent **Next** — visually inactive; never pressed.

No follow-up editor, delay fields, exit-rule editor or analytics can be reached
from this state without supplying data and proceeding. Those remain unobserved.

### C3. Enrollment, steps, exit and reports (Documentation)

Public help, **Cadences**: configuration starts with name, module, description
and audience: manually enrolled records or a custom view, optionally enrolling
new matching records. Follow-up types include email, task, call and business
messaging; this account's introduction mentions only the first three. Manual
enrollment appears in record actions, a Cadences related list and mass actions.
The related list shows name, record start date and status. Reports expose
action metrics and follow-up funnels. None of these write flows was executed.

Public help, **FAQs: Cadences**: exit criteria take priority over enrollment
and simultaneous follow-up triggers. A record leaving a custom view is not
automatically exited unless the corresponding exit rule exists. Deactivation
halts scheduled actions; editing scheduled follow-ups on republish can stop
affected enrollments. Re-enrollment is supported. Exact delay controls,
branching, defaults and report filters remain unobserved in this empty account.

## 3. Portals

### P1. Not-configured landing (Observed)

Capture: `mep-1478-portals`; route suffix `/settings/client-portal`.
Inside the shared Setup shell, the page has a Portals heading, brief
introduction and a single onboarding action rather than a portal list.

1. Header-right **Help** link — documentation; not opened.
2. Main introductory area **Get Started Now** — onboarding/configuration entry;
   not pressed because the next step may provision a portal.

No configured portal, user-type list, invitation list, permissions matrix,
branding editor or public preview is exposed here. This is evidence of an
unconfigured landing state, not evidence that the account edition lacks portals.
No error message or licence restriction is displayed.

### P2. Configuration and external experience (Documentation)

Public help, **Setting up Portal and Inviting Users**: portal setup precedes
user-group configuration. A group specifies a primary module, related/public
modules, layouts, action permissions and field permissions. External users
receive invitations, then operate within those permissions. Invitation templates
can vary by language. Documentation also describes automatic invitations and
notes exposed through portal activity. Creation, invitations, customization and
external login were not attempted. Help pages disagree about current free-user
limits; do not encode a quota or purchase requirement from these sources.

## 4. CommandCenter / customer journeys

### J1. PathFinder list (Observed)

Capture: `mep-1478-commandcenter-retry`; route suffix
`/settings/commandcenter/path-finder`. The first attempt timed out; the retry
rendered the actual page. PathFinder and Journey Builder are distinct tabs.
One system default path is present, in Draft with zero current records.

1. Content tab **PathFinder** — selected discovery/list surface.
2. Adjacent **Journey Builder** — navigation to journey definitions.
3. Header-right **Help** — documentation entry.
4. Above table, right **Configure PathFinder** — configuration entry; untouched.
5. Table row name link for the default path — `/view` destination; untouched.
6. Row record count **0** — text styled as an interactive count; destination
   not tested. It is not a delete action despite a misleading selector prefix.

Columns: PathFinder Name, Current Record Count, Last Modified Date, Status.
Last-modified cells include an avatar/date. Draft is plain status text here;
no activation toggle was visible. No search, filter, pagination or empty-state
message is present in this populated single-row list. No customer-defined title
or date value is reproduced. The sidebar has CommandCenter selected. The bottom
bar additionally shows Channels and Threads between Chats and Contacts.

### J2. Journey list (Observed)

Capture: `mep-1478-journeys`; route suffix
`/settings/commandcenter/journey-builder`. Inherits J1's shell/sidebar and tabs,
with Journey Builder selected. There are two default lead-qualification
templates, one call-based and one email-based, both Draft with zero records.

1. First tab **PathFinder** — sibling navigation.
2. Second tab **Journey Builder** — selected list.
3. Header-right **Help**.
4. Above table, right **Create Journey** with dropdown caret — unopened; no
   journey was created or reordered.
5. First row, call-template name link — opens its existing definition.
6. First row, current record count — zero, not followed.
7. Second row, email-template name link — opens its existing definition.
8. Second row, current record count — zero, not followed.

Columns: Journey Builder Name, Current Record Count, Last Modified, Status.
Avatar/date appear in modification cells. No live version, activation switch,
search, filter, paging or report control is visible at rest. Row DOM has drag
attributes but that does not establish a visible drag control; no row was moved.

### J3. Existing draft view attempt (Observed limitation)

Capture: `mep-1478-journey-canvas`. Opening the call-template's existing name
link produced a blank page with no visible controls or readable canvas. It is
not evidence of an empty journey. The guard also blocked an automatic
`POST /signals/v1/Signals__s/<id>/actions/invoke_webhook`; no webhook was allowed
to execute. Whether that request caused the blank view is unknown. No editor
interaction, retry of the action, activation or publication followed. The
reference's canvas, state/transition property panels and analytics remain
unobserved; use the documentation below with this explicit limitation.

### J4. Journey configuration and execution (Documentation)

Public help, **Building Journeys Through Journey Builder**: a journey consists
of module-associated states and transitions. States support immediate,
scheduled and recurring actions plus deadlines. Transitions have triggers,
conditions and actions; triggers include webform entry, record creation/edit,
API calls, approval/rejection, dates and channel signals. Cross-module
transitions need record connectivity. A journey has versions with one active
version. Execution flows from trigger through criteria to the next state and
its actions; delayed actions and deadlines continue through the worker.
Reports include state counts, average time per state and an overall flow.
Draft templates can exist before publication. None was activated or published.

Public help, **FAQs on CommandCenter**: participating records can be filtered
by instance/date/deadline, and transition logs expose the executed path.
These runtime states are documented, not demonstrated by this account's empty
execution data. A state/transition model must not be replaced by a generic
marketing workflow diagram without an explicit ADR decision.

## 5. Google Ads

### A1. Google integrations navigation (Observed)

Capture: `mep-1478-google`; route suffix
`/settings/extensions/google/contacts-modules`. Inherits the shared Setup shell.

1. First content tab **Contacts** — selected Google contacts integration.
2. Next **Calendar** — sibling integration.
3. Next **Google Ads** — ads integration settings.
4. Next **Google Chat** — sibling integration.
5. Header-right **Help** — documentation entry.
6. Under introductory copy **Authenticate Google Contacts** — external account
   authentication; never pressed and out of the feature's build scope.

This sibling page is navigation evidence, not ads settings evidence. Capture
`mep-1478-ads` shows only a loading skeleton, not a disabled/unsupported feature.
No credentials, account selection, connection or consent flow was attempted.

**A1a. Ads tab navigation attempted (Observed)** — `mep-1478-ads-entry`:
the existing Google Ads tab was clicked; content remained on the contacts
integration with a loading indication. No new functional control was exposed.
The capture guard blocked `POST /crm/<org>/GApps.do` as an unclassified legacy
action, in addition to the background blocks. Its payload semantics are not
certified read-only, so no alternate transport or guard bypass was attempted.
This is a research-access limitation, not evidence of an unlicensed feature.

### A2. Mapping and related surfaces (Documentation)

Public help, **Configuring Google Ads Integration**: the setup stages are
authentication, configuration, auto-tagging, packaging and tracking. An ad click
identifier links webform submission to campaign/group/keyword/ad attribution.
Tracking requires website and form integration; these steps would change an
external system and were not performed.

Public help, **Tracking Google Ads Data**: attribution can be displayed on Leads,
Contacts and Deals, transferred through lead conversion, and exposed through
campaigns, reports and dashboards. A conversion-export view and an ads summary
surface are described. Their presence in this account is unverified.

The authorised implementation scope is screens and data model only, with no
live connection. Public documentation describes a broader integration than the
board authorised: do not implement OAuth, auto-tagging, click enrichment,
conversion uploads or account synchronization as part of this feature.

## 6. Existing-module integration (Metadata)

The exported Leads and Contacts field catalogues contain `Lead_Source`
(picklist). Their related lists include `WebformUsage` and Cadences
(`Entity_Cadences_leads`, `Entity_Cadences_contacts`). Deals also has
`Lead_Source` and `Entity_Cadences_Potentials`. These are metadata observations,
not evidence of populated related-list rows. No matching GCLID, UTM or journey
field was found by label/API-name inspection in those three field catalogues.
Do not invent integration fields as already enabled in the reference account.

Earlier reference capture `m1381-d-leads-detail-tr` was re-inspected for the
Feature F integration location only: the record's related-list navigation has
**Cadences** between Linked Records and Attachments. This is one integration
control (open the record's cadence related section), not a fresh whole-record
inventory. No record values are reproduced and the control was not clicked in
this research. Populated cadence rows and WebformUsage UI remain unobserved.

## 7. Data-model sketch (Proposal; ADR input only)

Every entity needs tenant ownership, stable identifiers, timestamps and actor
audit. Use composite tenant foreign keys and tenant isolation consistently with
ADR 0017. Record/module/field references use existing metadata identifiers.

| Area | Candidate entities and key relations |
| --- | --- |
| Webforms | Form → module/layout, owner/assignment rule, status, published version; FormVersion → ordered FormField definitions, location allowlist, submit/confirmation behaviour, spam/opt-in/notification configuration; Submission → version, outcome, optional created record; FormEvent → visit/submission/outcome and location bucket |
| Cadences | Cadence → module/audience, version/status; CadenceStep → ordered action, timing and condition; Enrollment → cadence version + record, next step, state/reason; StepExecution → due time, outcome, retry/dedup key |
| Portals | Portal → tenant and branding; PortalUserType → primary/related modules, layouts, actions and field projection; ExternalIdentity → linked primary record; Invitation → identity/type, expiry and acceptance; PortalSession → separate external principal |
| Journeys | Journey → versions/status/order; State → module, actions and deadline; Transition → source/target, trigger and criteria; JourneyInstance → record references/current state/deadlines; TransitionExecution → event, result and audit |
| Ads | Local integration configuration/status; AdCampaign → AdGroup → Ad/Keyword; Attribution → record, click identifier and optional campaign/group/keyword; conversion/report projections. No OAuth credentials or external sync job in this feature |

Security boundary proposals for the ADR:

- Internal settings, reads and writes use ADR 0017 permission declarations;
  module and field permissions apply to pickers, previews, reports and exports.
  New feature-specific catalogue keys require an explicit ADR decision.
- Public form render/embed and submit routes expose only the published field
  projection. A public form identifier must never grant record reads. Resolve
  tenant/version server-side, allowlist fields, enforce required/type/length
  validation, protect against spam/replay/rate abuse, constrain redirects and
  sanitise configurable markup. Client hidden fields are untrusted input.
- Attachments need size/type limits, quarantine and private storage; CAPTCHA
  secrets stay server-side. Opt-in tokens need scope, expiry and one-use rules.
  Submission outcomes must not disclose whether a customer already exists.
- Create records through a bounded form principal with explicit module/field
  capability and assignment policy; do not grant anonymous Administrator access.
  Queue acknowledgements only after the applicable approval/opt-in decision.
- Portal identities are separate from internal memberships. Every request must
  combine portal type permissions, field projection and a verified relationship
  to the principal's own records; guessing a record ID must not grant access.
  Invitation/session tokens need expiry, revocation and tenant binding.
- Cadence/journey workers use scoped system actors, current permission checks,
  idempotent execution and tenant-local lookups. Define pause/exit races and
  retries before any mail, task creation or webhook execution is implemented.
- Ads remains disconnected; no authentication, auto-tagging, uploads or sync
  should execute. Attribution values are untrusted and permission-projected.

## 8. Proposed order and size

Follow the parent issue's order; sizes include UI, service, tests and parity
check, not only the landing pages. Each part ends with a side-by-side check.

| Order | Part | Size | Dependencies / suggested bounded build groups |
| --- | --- | --- | --- |
| 0 | Short Feature F ADR | M | Decide public principal, portal identity, published versions, permission keys, execution seams and unresolved behaviour |
| 1 | Webforms | L | Module/layout metadata, assignment, mail queue, approval and private attachment seams; 3 groups: builder/settings, public ingestion/security, embed/analytics/integration |
| 2 | Cadences | L | Existing mail/tasks/calls and worker; 3 groups: definitions/editor, enrollment/execution, reports/record integration |
| 3 | Portals | L | External identity and security review, existing access model and record relationships; 3 groups: configuration/permissions, invitation/auth/data access, external UI/branding |
| 4 | Journeys | L | Versioned automation events and worker; 3 groups: canvas/definitions, transitions/execution, analytics/record integration |
| 5 | Google Ads screens + model | M | Webform attribution and record projections; 2 groups: disconnected settings/model, record/report surfaces |

These groups size the work; the CTO owns issue creation and final contracts.
No implementation is authorised by a documentation-derived detail alone.

## 9. Open questions

1. Populated webform list columns, filters and row menu cannot be observed in
   the empty account state without creating a form. Do not create one.
2. Builder, property dialogs, settings, embed formats, hosted URL availability,
   preview and statistics controls need existing-form evidence; public docs
   establish capabilities, not current account layout.
3. Duplicate matching, precedence of spam/validation/approval/opt-in, exact
   submission error/success messages and notification timing are unobserved
   without a write. ADR must state explicit behaviour and evidence limits.
4. UTM/source mapping and arbitrary hidden-field defaults are not verified in
   this account. Keep attribution separate from the existing source picklist
   until the mapping is decided.
5. Public help and API descriptions disagree on some limits and validation
   details; do not turn generic limits into account-observed constraints.
6. Portal user types, module/field matrix, invitation list, branding controls,
   login and external preview cannot be inspected before portal configuration.
   No setup was performed; scope decisions belong to the CTO, not a request
   for the board to create data.
7. Cadence step editor, delay limits, exit criteria editor and actual reports
   cannot be inspected because no cadence exists and Next was not pressed.
   Clarify response events, business-hour/time-zone handling and reenrollment
   semantics in the ADR, using documented behaviour only where identified.
8. Ads content requires a legacy request not certified read-only by the capture
   guard. Do not allowlist it within this issue. The disconnected screen/model
   can be sized from documentation, but current settings controls remain unknown.
9. Ads field/report package is not present in the inspected field catalogues;
   decide which local attribution projections to introduce without enabling
   a live connector. Generic UTM attribution must not be assumed equivalent
   to campaign/keyword enrichment from a click ID.
10. PathFinder is visible alongside Journey Builder. The parent authorises
    customer journeys; the CTO must decide whether the minimum PathFinder
    navigation/list is included or discovery/reporting waits. Do not silently
    treat the two tabs as one automation engine.
11. Exact profile permission catalogue entries for webforms, portal management,
    portal users, cadence enrollment and journeys need the ADR 0017 extension.
    Public enrollment API behaviour must not weaken existing record access.
12. Form attachment support, double opt-in, A/B testing and response-rule editor
    depth need an explicit scope/contract decision before implementation issues
    are written; the empty account cannot demonstrate their account-specific UI.
13. Existing journey view rendered blank and an automatic webhook request was
    blocked. The canvas/property/report inventory is unavailable through this
    attempt. Do not unblock the webhook to obtain a screenshot. Its relation
    to rendering is unknown; the CTO can size from documented states/transitions
    while recording this parity evidence gap.

## 10. Capture audit and inventory reconciliation

Counts below are functional content controls/affordances, excluding inherited
shell and sidebar inventories. Counts include options when menus are open and
repeat inherited controls across states; they are not a distinct-control total.

| State | Capture slug | Content inventory |
| --- | --- | --- |
| W1 empty webforms | `mep-1478-webforms-list` | 6 |
| W2 initial dialog | `mep-1478-webform-dialog` | 4 modal controls; W1 behind backdrop |
| W2a module menu | `mep-1478-webform-modules` | 9 including W2 and menu |
| C1 empty cadences | `mep-1478-cadences` | 5 |
| C1a module filter | `mep-1478-cadence-module-filter` | 12 including C1 |
| C1b status filter | `mep-1478-cadence-status-filter` | 8 including C1 |
| C2 initial cadence dialog | `mep-1478-cadence-dialog` | 6 modal controls; C1 behind backdrop |
| P1 unconfigured portals | `mep-1478-portals` | 2 |
| J1 PathFinder list | `mep-1478-commandcenter-retry` | 6 |
| J2 journey list | `mep-1478-journeys` | 8 |
| J3 blank view attempt | `mep-1478-journey-canvas` | 0; not a valid canvas inventory |
| A1 Google integration entry | `mep-1478-google` | 6 |
| A1a Ads click/loading | `mep-1478-ads-entry` | A1 remains behind loading; 0 new |
| Ads direct loading skeleton | `mep-1478-ads` | 0 functional controls |

Shared shell: 25 controls, plus Channels/Threads where shown; five sidebar
sets of 19 entries each, including clipped boundary rows. Screenshot review
removes offscreen/zero-area entries and duplicate wrappers from controls.json.
Modal counts do not count the title or field labels as separate controls.

Diagnostic captures: `mep-1478-setup` proves the setup navigation entries;
`mep-1478-webforms` failed its readiness check because the text selector matched
multiple labels and executed no click; `mep-1478-commandcenter` timed out before
a screenshot was produced. These are not builder/canvas evidence.

All captures with clicks were checked against `meta.json.blockedRequests`.
Background blocks include telemetry, legacy reminder loading (`showreminder`)
and notification status. The two additional significant block classes are the
unclassified legacy integration POST in A1a and the automatic webhook POST in
J1/J2/J3. The latter was present on list navigations too, so it must not be
attributed specifically to opening the draft. No feature-write request was
intentionally made, no guard was weakened and
no blocked request was replayed. The tool closed its own temporary capture tabs;
no shared browser window, serve tab or other agent tab was closed.

## 11. Documentation source register

Public official help/API pages were read on 2026-11-06; the neutral titles
identify sources without introducing prohibited branded URLs into the repo.
No asset, source code or long passage from those pages is reproduced.

| Source title | Used for | Limitations |
| --- | --- | --- |
| Setting up Webforms | Builder/settings/embed and submit/confirmation capabilities | Generic product documentation, not the current account's editor |
| Create Webform (API reference, version 8) | Configuration and field structure | Not an observed frontend request contract |
| Webform Analytics | Outcome and downstream metric categories | No live statistics screen available |
| Troubleshooting Webforms | Duplicate/invalid/manual approval and workflow behaviour | No submission was used to verify it |
| Cadences | Audience, follow-ups, enrollment and reports | Empty account list prevents editor comparison |
| FAQs: Cadences | Exit precedence and lifecycle behaviour | Timing controls/defaults remain unknown |
| Setting up Portal and Inviting Users | User groups/modules/fields and invitations | Portal not configured; quota details not adopted |
| Building Journeys Through Journey Builder | States/transitions/versioning and reports | Existing canvas failed to render |
| FAQs on CommandCenter | Runtime instances and logs | Runtime data not observed |
| Configuring Google Ads Integration | Stages and click attribution | Live setup is excluded |
| Tracking Google Ads Data | Existing-module projections and conversion | Fields not enabled in inspected metadata |

## 12. Verification and review handoff

Docs only: no application code, schema, fixtures or runtime behaviour changed.
The branch was merged with the current `origin/main` (already up to date).
No tests are required by this research issue. The staged document is checked
by the repository name guard and whitespace check when committing. Sonnet QA
checks inventory completeness against the named captures and evidence labels;
the CTO reviews the ADR inputs and resolves scope/security questions. Do not
open implementation tasks merely because a generic help capability is listed.
