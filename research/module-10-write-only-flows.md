# Module 10 — flows that can only be studied by writing

- Status: Write-observation window closed as an observation gap (MEP-1343,
  Platform Lead decision MEP-1355, 2026-10-25). Earlier documentation findings
  remain separate from live evidence; see section 10.
- Companion: `module-10-email-calendar-research-plan.md`,
  `module-10-night-test-protocol-draft.md`, `docs/adr/0009-real-email-and-calendar.md`
- Rule: the reference CRM stays strictly read-only. Nothing here is run. The
  public-documentation verdicts below are the analyst's first judgment from what
  the metadata export shows; the documentation pass (plan issue R9) must confirm
  each one with dated source rows before the board relies on them.

Legend. Docs enough: yes (documentation settles what the implementation
needs), partly (settles the main path, leaves details), no (behaviour has to be
seen). Routes: docs only, sandbox org (vendor trial or test org), night test
(last resort, see the protocol draft).

## 1. Flow table

| # | Flow | What we need to know | Docs enough? | Reasoning | What read-only capture still gives | Route |
| --- | --- | --- | --- | --- | --- | --- |
| W1 | Compose and send | Editor controls, recipient fields (to/cc/bcc), from-address choice, subject/body limits, attachment limits, signature insert, template insert, validation messages (empty recipient, invalid address, over limit), send result, what is written to the record timeline and Emails related list | partly | Help pages describe the happy path and limits; field-level validation text and error states are rarely documented. The implementation can choose its own messages, but one-to-one parity wants the reference's. | Entry-point controls on record detail (Send Email buttons drawn) and the related list shape; no compose surface | docs only for limits; sandbox for validation text and result state |
| W2 | Reply, reply all, forward | Prefilled recipients, quoted-text format, subject prefix, attachment carry-over, thread linkage | partly | Behaviour follows mail convention (RFC 5322 headers); the reference's exact prefix and quote format needs sight | Thread view layout with action row (drawn, not clicked) | docs only; sandbox to confirm the quote format |
| W3 | Save draft and drafts list | Auto-save timing, draft ownership (user-only or shared), where drafts show (related list), delete-draft behaviour | partly | The drafts module exists in metadata (related list on Leads and Contacts) but without a field export | Drafts related list shape and empty state; list of drafts in the mail area if any | sandbox |
| W4 | Scheduled send and send later | Time picker, time zone rules, cancel/edit scheduled mail, failure handling | partly | Documented as a feature; edge cases (time zone, past time) are not | Scheduled view list if the shell exposes it | sandbox |
| W5 | Meeting scheduling with invitees | Invitee picker (users, contacts, leads, free-form), invitation email contents, ICS attachment, reschedule and cancel notices, reminder timing, meeting provider integration, venue vs online fields, conflict warning | partly | `Events` metadata gives fields (title, venue, start/end, all-day, recurrence rule, reminders, participants, meeting provider and venue picklists) and the Invitees related list. The outgoing invitation mail format and RSVP states are not in metadata. Calendar standards (iCalendar, iTIP/iMIP RFC 5545/5546/6047) define what an invitation must contain. | Meeting detail with Invitees list (structure) already in the Activities spec; calendar grid | docs plus standards; sandbox for the invitation mail look and the RSVP state set |
| W6 | RSVP handling (accept, decline, tentative) | State set, who can change which state, effect on the event, notice to organizer, behaviour for external invitees replying by mail | no | Reply processing by mail (iMIP) is standard, but the reference's state vocabulary and UI are not documented in enough detail | Invitees related list column set (structure) | sandbox, or night test only if sandbox is refused |
| W7 | Mailbox connection (IMAP/SMTP, OAuth) | Provider choices offered, which provider connections exist (OAuth with Gmail / Microsoft 365 vs IMAP with app password), connection test, scopes requested, error states (bad password, 2FA, blocked app), reconnect prompt, disconnect effects on stored mail, per-user vs org-wide mailbox, shared mailbox | partly | Provider protocols and OAuth scopes are public (Gmail API, Microsoft Graph, IMAP/SMTP RFCs). The reference's account model (who may connect, how many per user, what disconnect deletes) needs sight or a help page. | Settings page structure when no write is needed (read-only), list of connected accounts shape | docs for protocols; sandbox for the account model |
| W8 | Initial sync and ongoing sync | Sync window on first connect (how far back), folders synced, frequency, manual sync, what sync writes (records auto-created? matching rules), dedupe of already-linked mail | no | Documentation states the feature but rarely the exact window and matching rules; behaviour is observable only with a real mailbox | None (a sync call must never be triggered); metadata `Email_Analytics` shows counters for sent/received/tracked | sandbox; night test only as last resort |
| W9 | Email templates: create, edit, merge fields | Editor (rich text, HTML), merge-field picker by module, fallback values, folders/sharing, attachment support, preview with record, template validation | partly | Merge-field syntax and module field lists are documented; editor behaviour and validation are not. Template analytics module exists. | Templates list structure (R7), module field names from metadata | docs for syntax; sandbox for editor and preview |
| W10 | Calendar sync (two-way with an external calendar) | Providers offered, direction, which events sync (all, owned, invited), conflict resolution, deletion propagation, recurrence handling, meeting provider link creation | no | Depends on provider APIs plus the reference's rules; none of the rules are in metadata | Calendar settings page structure (R6) | sandbox |
| W11 | Notify Email (CSV import completion mail, CSV-09) | Whether the option is a checkbox or an address field, default state, who receives it, mail subject/body and when it is sent (success vs failure), what an import report links to | partly | Import help describes that a completion notice is sent; the exact mail is not shown. The notification can be implemented to a spec we choose. The import upload step is not reachable read-only without starting an import. | Upload step is reachable only after choosing a file (a write path); do not capture | docs for the behaviour; our own template for the mail; sandbox only for parity of mail text |
| W12 | Email tracking (open and click) | Which events are tracked, tracking-pixel and link rewriting design, privacy options, how events show on timeline and `Email_Analytics`, bot/proxy opens | partly | Tracking is an industry pattern; counters exist in `Email_Analytics` (tracked, opened, clicked, replied, bounced). Reference-specific display rules need sight. | Timeline and related-list columns that show status (structure); analytics module fields | docs for the pattern; sandbox for display |
| W13 | Associating an email to a record (manual and automatic) | Matching by address, many-to-one rules, manual add/remove association, related-list effect | partly | Matching by address is simple; edge cases (several records with the same address, accounts by domain) are not documented | Related list shape | docs; sandbox for edge cases |
| W14 | Bounce and failure handling | Bounce detection, status text on the list, blocked/invalid address flags, unsubscribe handling (the list filter has an email operator for blocked addresses) | partly | Delivery status notifications are standardized (RFC 3464); the status vocabulary is not | List filter operator names (already captured in list-views) | docs plus standards; sandbox for the status words |
| W15 | Mass email and mail merge | Recipient limits, per-day quota, preview, schedule, unsubscribe link, merge field resolution, report | partly | Quotas and limits are documented by edition; the review/preview step is not | Mass Email entry point (drawn), campaign and list screens | docs for limits; sandbox for the flow |
| W16 | Email inside workflows and assignment | Rules that send mail or tasks on record events, template pickers | no | Workflow and assignment rules are not exportable from this environment (API-not-supported / null), so rule content is unknown | None | out of Module 10 scope; Module 12 (automation) question |
| W17 | Calendar event create/drag/resize/delete | Slot click behaviour, drag/resize rules, conflict warning, delete confirm, recurring edit scope (this, following, all) | partly | Recurrence edit scope is documented in the calendar help; UI micro-behaviour is not | Calendar grid default view | docs; sandbox |
| W18 | Attachments in mail (send and receive) | Size cap, count, blocked types, inline images, link to Attachments of the record | partly | Per-edition limits are documented; the guides may disagree (as in ADR 0005 P1/P2) | Attachment chip shape in thread view | docs; our own limits per ADR 0009 |
| W19 | Sharing and permissions on mail | Who sees whose mail on a record, share-mail option, profile permissions for email | partly | Profile export is descriptive without action grants (as noted in ADR 0007 M3); permission wording needs a help page | Profiles/roles files | docs; board decision on our model |

## 2. Where public documentation settles the matter

Documentation (with source rows, dated, locator without vendor hostname) is
sufficient for: protocol and standards behaviour (IMAP, SMTP, MIME,
threading headers, iCalendar), per-edition limits, merge-field syntax, the
list of provider integrations, the existence and purpose of options. Two
conflicting guides are both recorded; the implementation uses a documented
constant in our code with a comment that the value is an interim choice, and an
open question stays in the spec (practice from ADR 0005).

## 3. What read-only capture still gives

- Screens in their resting state: inbox list, calendar default view, settings
  pages, templates list, Emails and Drafts cards on record detail.
- Controls drawn but not operated (compose entry points, RSVP buttons).
- Metadata: `Events` fields and related lists, `Email_Analytics` counters,
  the Emails and Drafts related lists on Leads and Contacts, picklists for
  meeting provider and venue.
- Gaps in the export itself: no field export for `Emails`, `Email_Drafts__s`,
  `Email_Template__s`, `CalendarBookings__s`; rules not exportable.

## 4. Narrowed list: what genuinely needs a write

Everything else is covered by documentation, standards or our own design
(Module 10 is built to a real implementation, so behaviour we cannot see is
specified by us, with the open question recorded).

| # | Needs a write to see | Why documentation cannot replace it | Smallest observation |
| --- | --- | --- | --- |
| N1 | Compose validation and send result states (W1, W2, W3) | Exact messages and the timeline/related-list entries after a send | One compose with an empty recipient (validation), one send to an internal test mailbox, then read the record and timeline |
| N2 | Invitation mail and RSVP state set (W5, W6) | Mail look, state vocabulary, organizer notice | One meeting with one internal test invitee; one RSVP by that invitee |
| N3 | First sync result and matching rules (W7, W8, W13) | Sync window, folder set, auto-created records, address matching | Connect one board-owned test mailbox in a sandbox org; read what appears |
| N4 | Template editor and preview (W9) | Editor validation and preview with record | One template create with a merge field, preview, delete |
| N5 | Notify Email text (W11) | The mail the user actually receives | One small import of a test file with the option on; only needed for text parity |

N1 to N5 are suggestions for the board to accept, shrink or drop. W6, W8, W10
and W16 have no docs fallback; if the sandbox is refused, the CEO and CTO
decide whether to build to the standard and mark the vocabulary as an open
question rather than run a night test. N5 is low value: the mail can be our
own text.

## 5. Recommended route summary

| Route | Flows |
| --- | --- |
| Docs only (plus standards) | W11 (behaviour), W12, W13, W14, W15, W17, W18, W19 |
| Docs first, sandbox to close the gap | W1, W2, W3, W4, W5, W9 |
| Sandbox required (docs do not cover) | W6, W7 (account model), W8, W10 |
| Out of scope for Module 10 | W16 |
| Night test only if sandbox refused | N1, N2, N3, N4 (N5 never needed) |

## 6. R9 documentation-only follow-up from R1

CTO decision, 2026-10-21 (MEP-1010): R1 is closed as an access gap. The capture
user has no mail tab in the rail; two click-free probes show access denied.
Retain the evidence in [email-inbox.md](specs/email-inbox.md). No further mail
entry route, application switch, permission, setting, connection or session
change is authorized.

R9 must use public documentation only, with dated source rows, for:

- The role/license prerequisites for access to the mail area (W7, W19).
- Available sent, draft, scheduled and tracked list views and their documented
  behaviour (W3, W4, W12); none was observed in R1.
- Whether list loading initiates synchronization and any documented sync path
  (W8). No sync is triggered to verify this. Missing documentation remains an
  explicit gap, not a basis for a live experiment.
- The documented no-connected-mailbox empty state, retaining any visual gap.

This note assigns research questions, not documentation findings; it does not
change the write-only flow verdicts above. After R1 approval, R2 proceeds
with public documentation and a gap record, with no mail-area capture. R3's
record-detail Emails related-list captures continue as planned.

## 7. R2 message-view documentation follow-up

R2 (MEP-1011), 2026-10-21, is documentation-only under R1's approved access-gap
decision. See [email-message.md](specs/email-message.md) for dated D1–D3 source
locators, documented capabilities and explicit observation limits.

- W2/W3/W18: reply/reply-all/forward prefills, quote format, attachment carry-over,
  draft timing and validation/results remain unverified. No compose or reply
  surface was opened. The related-list thread announcement does not prove the
  mail-area thread layout or grouping algorithm.
- W12/W19: reading side effects (receipt/remote tracking), permission-filtered
  conversation history and persistence of the correspondence scope choice
  remain open. No message was opened and no scope choice was changed.
- Additional write flow: response-reminder creation from sent-message detail
  (D2, Add ResponseWatch on sent emails). The guide describes a Reply-adjacent
  dropdown, Add Reminder, time/message inputs and Create. This settles the
  capability only; exact validation and resulting notification state remain
  unobserved. Never run it in the reference CRM.
- Context-pane deal/activity/note creation is documented by D1 but is a write,
  not a safe way to inspect linked-record context; no such entry was clicked.
- R9 should check message loading/empty/error guidance and any documented
  reading side effects, leaving undocumented behaviour as a gap. No additional
  mail route, sync, preference, permission or connection change is authorized.

## 8. R9 public-documentation check (MEP-1019)

Checked 2026-10-21 by web search over first-party help material only. No
reference CRM access, no capture. R9b (MEP-1033, 2026-10-22) resolved
paths only for W13, W17 and W19 (host and product name omitted); all other
rows stay "path not resolved" because searches returned community threads or
redirect links, not first-party help pages. Vendor figures come
from search summaries, not from a page read in full. Third-party pages were
ignored.

| Flow | Public doc enough? | Topic locator (checked 2026-10-21) | What the source proves / limit |
| --- | --- | --- | --- |
| W1 | partly | help: composing emails; template attachment limits | Template attachments: up to 10 files, 3 MB total. Composer limits depend on edition or the mailbox provider. No validation message text. |
| W3 | partly | help: email drafts; drafts API reference | Drafts can be saved and created through an API for Leads, Contacts, Deals. No auto-save timing or ownership rule. |
| W4 | partly | help: scheduling emails | Scheduled mail waits in an Outbox and can be edited, rescheduled or cancelled; paid editions only. Time zone and past-time rules not found. |
| W5, W6 | partly (W6: no) | help: scheduling meetings and invitees | Invitation mail has an RSVP section (Yes / Maybe / No); host is notified; participant status window and an invited-meetings related list exist. Full state vocabulary and external-invitee reply handling not found. |
| W7 | partly | help: mailbox configuration (OAuth, IMAP) | OAuth for the large providers; custom IMAP/SMTP with host, port and SSL/TLS; app-specific password when 2FA is on; each user authorizes their own mailbox. Role/licence prerequisites for mail-area access not found. |
| W8 | no | none found | No documented first-sync window, folder set or matching rule; whether list loading starts a sync is not documented. Stays a gap; no sync is triggered. |
| W9 | partly | help: template merge fields | Merge fields use `${Module.Field}` syntax and a `#` picker; user lookup fields exist. Editor validation and preview not covered. |
| W10 | partly | help: calendar integrations | Two-way sync with a major external calendar via a marketplace integration; others via plugin or API. Direction rules, conflict handling, recurrence and deletion propagation not found. |
| W12 | partly | help: email insights | Status lifecycle: In Queue, Delivered, Delivery Failure, Opened. Tracking is limited for some send routes. Click tracking and bot-open handling not found. |
| W14 | partly | help: email insights | Delivery Failure status exists. Bounce reasons and blocked-address vocabulary not found. |
| W15 | yes for limits | help: mass email limits | Per 24 h in org time zone: 250 / 500 / 1,000 / 2,000 by edition; count includes mass mail, macros, autoresponders and schedulers; an add-on raises it. Preview and review step not found. |
| W18 | partly | help: attachments and large files | Template cap above; large-file link option exists. Per-message cap for ordinary mail not confirmed. |
| W2 | no | none found (first-party) | Only user-community threads surfaced (reply and reply-all offered on sent mail inside a record; forward reported missing). Community threads are not counted as a source. Prefix, quote format, attachment carry-over not documented. |
| W11 | own template | section 1 (our own mail spec) | No public check needed: the completion mail is our own template per section 1. |
| W13 | partly | help: email sharing, `/crm/help/<mail-integration>/email-sharing` (path read from the search result; page not read in full) | Admins can exclude up to 10 domains from being added to records (search summary of the page). Matching rule for several records with one address not found. |
| W16 | out of scope | n/a | Module 12 (automation) scope. |
| W17 | partly | help: meetings FAQ, `/portal/en/kb/crm-v2-1/faqs/activity-management/articles/<meetings-module-faq>` (path read from the search result; page not read in full) | Deleting a recurring event offers "delete all future events"; recurrence end defaults to Never. Editing a single occurrence vs this-and-following, drag/resize and conflict warning not found. |
| W19 | partly | help: email sharing, `/crm/help/<mail-integration>/email-sharing` (page not read in full) | Per-user sharing modes Private / Custom / Complete; org data-sharing default for CRM-sent mail Public Read/Write/Delete with Private and Public Read Only options (community announcement, 2024). Profile action grants not found. |

Conflicts: none seen. Mass email numbers came from a search summary that also
cited a third-party page; the first-party figure is the one recorded.

Open questions
1. Help page paths for W1, W3-W10, W12, W14, W15, W18 are still not resolved; the W1 attachment and W15 quota figures were not re-verified on the pages themselves.
2. W2 has no first-party source.
3. W8 and the mail-area access prerequisites stay documented gaps.

## R5 settings observation and write-only follow-up

R5 (MEP-1014), 2026-10-22: a click-free email-settings entry shows the
Compose Settings form, but the base and single five-minute retry both fail the paint gate. CEO
decision MEP-1051 owns the next step. See
[email-settings.md](specs/email-settings.md). No field, toggle or tab was clicked.
This is no evidence of successful settings loading, signature absence or a
particular mailbox connection state.

| Flow | Resting evidence | Still unobserved; never test in the reference CRM |
| --- | --- | --- |
| Compose preferences | Font-family/font-size and sender/reply-to closed selectors; sample preview | Save timing, option lists, validation, cross-editor persistence, success/error feedback |
| Signature management | Add New Signature entry; signature model-processing error | Create/edit/delete, editor, association to sender, insertion defaults and resulting preview |
| Mailbox configuration (W7/W8) | Email subtab link only | Connect, disconnect, reconfigure, authorization, sync and connection results |
| Tracking (W12) and sharing (W19) | Email Intelligence and Email Sharing navigation labels only | Tracking switches, consent, saved sharing and downstream effects |
| Inbound/outbound processing and forwarding | Email Parser / BCC Dropbox navigation labels only | Rule creation, forwarding targets, disclaimers, automatic processing and notifications |
| Deliverability / unsubscribe (W14/W15) | Email Deliverability / Unsubscribe Link navigation labels only | Saved configuration, verification, limits, unsubscribe generation and recipient effects |

Use public documentation for these write behaviours and record its limits;
this entry makes no new documentation verdict. A runtime failure is not a
reason to connect a mailbox, change preferences, retry a blocked write or
open an editor. Remaining read-only research requires a paint-gate decision
before another capture series.

## R6 calendar settings prerequisite and write gaps

R6 (MEP-1015), click-free capture `m10r6-booking-base`, observed an internal
booking-administration prerequisite: organization business hours are not
configured. The dialog offers Configure Business Hours and Cancel; neither was
clicked. The public booking page was never opened. Both the base and the single
permitted retry failed the strict paint gate. The retry also increased refused
telemetry POST count from 1 to 2, invoking the stop rule. CEO decision MEP-1043
closed the blocker with documentation-only completion and explicit access gaps;
no further R6 capture or configuration is authorized. See [calendar-settings.md](specs/calendar-settings.md).

- W10: provider connection, synchronization direction and conflict/deletion
  rules remain unknown. No connection or sync was initiated.
- Working-hours configuration is a persisted organization setting. Do not
  configure it to reveal the booking list. The hours editor, validation and
  post-save state remain unobserved.
- Calendar-wide default reminder changes and meeting-provider setup persist
  preferences or connections. No values were changed; Events reminder fields
  do not establish calendar-wide defaults.
- Booking-page create/edit/publish and public reservation submission are writes.
  None was attempted. The internal list is obscured by the prerequisite; its
  columns and empty/error states remain unknown.
- R6 documentation completion: calendar-settings.md records dated D1–D5 public
  source locators, offline navigation audit and documented/not-observed rows.
  Personal hours, organization business hours, reminders, booking categories and
  CalDAV capabilities are documented. Provider options, full list structure,
  defaults and exact error states remain access gaps.
- Implementation uses the observed prerequisite plus documented behaviour and
  existing Module 1–9 components, per MEP-1043. The Module 10 gate summary must
  list the remaining gaps from calendar-settings.md. Documentation does not
  authorize changing hours, reminders, activation, connections or synchronization.
  No separate follow-up issue or additional live R6 probe is required.

## 9. R7 template list observation limits (MEP-1017)

The click-free templates list capture shows New Template, a template-name link,
a favorite star, select-all, folder links, a module selector, a stats cell, an
unnamed document action and a folder-reorder icon. No control was operated.
See [email-templates.md](specs/email-templates.md) for the inventory and paint
gate outcome; visible presence does not establish working behaviour.

- W9/N4: create/edit/clone/delete, editor autosave, merge fields, attachment
  handling, folder creation/move/sharing and preview validation remain
  unobservable without a write or a proven separate read-only preview entry.
  Offscreen Preview/Analytics markup is not such proof. No template was opened.
- Favorite changes and folder reordering persist state and were not attempted.
  Selection-armed bulk move/delete, and saving any filter or module preference,
  also remain forbidden. Merely seeing the selection or filter controls does not
  authorize testing them.
- R9 documentation may establish capabilities, but exact editor validation, draft
  creation on open, preview side effects and save results remain explicit gaps
  unless independently documented. No reference CRM write test is authorized.

## R10 rule-check safety gap (MEP-1016)

The workflow response shape establishes one configured rule and a non-null
last-execution field. Its active state, module, triggers, actions and recipient
roles remain unknown. MEP-1102 closes that UI route. One subsequent click-free
assignment-list capture shows no rule rows but triggers the request-baseline
stop rule; it establishes no absence or safe notification configuration. No
further capture or retry was performed. The other rule/notification
categories remain unverified. See
[the R10 exposure register](specs/email-calendar-rule-check.md): unknown counts
as yes for test-write eligibility. The W16 implementation scope remains Module
12; its notification-risk check is required now for Module 10 safety.

Do not create/edit a record to discover a workflow, run assignment, trigger an
approval/auto-response, send a test alert or create a scheduled action to observe
its delivery. No such action was attempted. Public documentation cannot prove
this environment's active configuration. Restore read-only evidence first;
residual unknowns stay gated for CTO/board disposition under the existing
read-only rule. This addendum authorizes no write or editor opening.


### R5 continuation safety stop (MEP-1158)

MEP-1051 accepts the three known R5 runtime errors; it does not relax the
request-baseline rule. The click-free `m10r5-mailbox-settings-base` capture
on 2026-10-23 shows Configure Email, three static capability columns, Help
and Get Started. Get Started was not clicked; provider selection, credentials,
connection, authorization, synchronization and connection results remain
unobserved. No connected-mailbox list is established from this entry screen.
The refused urlMonitor telemetry POST count rose from 1 to 2, so rule 7
stopped research immediately without retry or another settings capture.
CEO decision MEP-1158 owns further read-only coverage. Existing write-only
restrictions and the earlier R5 follow-up table remain applicable; the
original MEP-1051 decision wait is historical and resolved.


### R5 bounded continuation decision (MEP-1158)

The historical request-count stop above is resolved by MEP-1158. Its exception
covers only variable counts on four refused, unanswered request paths during
click-free R5 base loads; it authorizes no field, toggle, setup or write action.
The settings spec records the additional resting-page evidence and per-capture
accounting. Existing Compose/signature and mailbox Configure Email gaps remain
explicit: no Get Started, Configure, connection, provider, credential,
authorization, signature editor or preference change is attempted.

- Email Sharing: mass update, row selection, sharing changes, excluded domains,
  recipient scope and the Preferences editor remain untested. Visible sharing
  states do not establish choice lists, validation, propagation or save results.
- Organization Emails: adding/verifying/removing addresses, sender/reply-to
  selection and verification delivery remain unobserved. The initial page's
  verification prerequisite is explanatory evidence only.
- Custom Email Fields: enabling/disabling conversation inclusion and any
  resulting synchronization remain forbidden; the off-state switch was not
  clicked. Described related-list, composer, report and filtering capabilities
  are stated page content, not exercised outcomes.
- Incoming/outgoing rules, forwarding, disclaimers and limits only receive
  observed coverage if directly present in the authorized resting pages.
  A missing direct read-only route remains an access/setup gap; no guessed
  configuration editor or setup flow is entered to discover it.


### R5 new parser-path stop (MEP-1159)

The MEP-1158 continuation captured three additional resting settings pages,
then stopped at `m10r5-email-parser-base` (2026-10-23). The capture tool refused
one new `POST /crm/<org>/EmailParserAction.do` (`emailParser` legacy action).
The page remained a loading skeleton; no parser form or rule list is proved.
No non-GET response, click or retry occurred. MEP-1158's four variable refused
classes do not cover this new path. MEP-1159 is the CEO-owned decision path.

Email Parser setup/rule creation, parsing execution/results, BCC forwarding,
BCC Dropbox configuration, deliverability configuration/limits, tracking and
intelligence changes, unsubscribe setup and any rules, forwarding, disclaimers
or limits requiring setup stay explicit gaps. BCC Dropbox, Email Deliverability,
Email Intelligence and Unsubscribe Link were not visited after DUR. No guard
bypass, endpoint replay, Configure/Get Started or write-only experiment is
authorized. Compose/signature and mailbox setup gaps remain unchanged.


### R5 parser gap disposition (MEP-1159 resolved)

The CEO subsequently accepted Email Parser as an explicit gap: data did not
load because the tool blocked the request. No retry or guard change. Five
refused/unanswered classes may vary on the remaining click-free R5 pages:
urlMonitor, reminder, notification, logs, EmailParserAction. A new refused path
makes its page an explicit gap and permits the next named page; this does
not permit the refused request to reach the reference CRM. New/increased
responded non-GET, new runtime/script error, tool failure or suspected change
still stops all R5. The final settings spec records the remaining four pages.
This supersedes the historical MEP-1159 decision wait above; every write/setup
restriction remains in force.


### R5 BCC automatic POST safety gap (MEP-1160)

Under MEP-1159 the next single click-free page was BCC Dropbox. Its load
recorded a new responded `POST /crm/v8/settings/bcc_dropbox` (one, HTTP 200),
plus the existing visitor POST. No field or action was used. The tool retains
only response structure, so the call's semantics/persistent effect are unknown;
a successful response alone does not prove a reference setting changed.
The new responded path triggers the full R5 stop, unlike a refused-path gap.
A new refused telemetry customMetrics POST was also recorded. No retry,
rollback or further reference navigation occurred. MEP-1160 owns disposition.

The resting page's generated-address display, copy icon, Regenerate, vCard,
Exclude Domains and Edit Search Pattern are inventoried in email-settings.md.
No address is retained. Regeneration, address verification, BCC delivery,
search-pattern edits, automatic record creation/association, domain exclusions
and downloads remain untested. Seeing an address does not prove whether this
load generated it. Do not send a BCC test, replay the endpoint or change the
guard to investigate. Deliverability, Intelligence and Unsubscribe remain
unvisited after this full stop; rules, forwarding, disclaimers and limits
without a direct read-only route remain explicit gaps. The accepted Parser
gap and Compose/mailbox setup gaps are unchanged.


### R5 final accepted gaps (MEP-1160 resolved)

The CEO closed R5 captures after the BCC stop. No new capture or retry.
The existing BCC screenshot/controls are used offline, all actions not clicked.
The complete page-by-page gap table is in
[the final R5 spec](specs/email-settings.md#final-disposition--mep-1160-accepted-scope-closure).
Email Deliverability, Email Intelligence, Unsubscribe Link, incoming rules,
outgoing rules, forwarding, disclaimers and limits close as explicit DUR/access
or setup gaps. Parser is already accepted as a blocked-data gap by MEP-1159.
Configure Email/provider/connection states and Compose/signature editor/save
states remain setup/write gaps. No functional absence is inferred.

BCC page load may initialize settings automatically. **Our implementation
reads through GET only; no automatic creation until a board decision**
(MEP-1160). The observed POST 200 does not prove or exclude persistent effect.
The CEO recorded the low-confidence change concern to the board. Do not probe,
replay, regenerate, verify an address or send mail to resolve it. This final
scope closure supersedes the historical MEP-1160 wait above; the partial spec
and this artifact are ready for the existing UI Lead approval gate.

## 8. R3 record-detail observation boundary

R3 (MEP-1012), 2026-10-21: see
[email-record-detail.md](specs/email-record-detail.md). The Lead resting screen
shows Send Email and email-address links; none is activated. The initial probe
fails the paint gate; MEP-1020/1021 accept the existing retry using the earlier
painted Lead baseline errors and blocked-telemetry count exception. No new Lead
capture is made. The board subsequently supplied the Contact address; the
click-free `m10r3-contact-detail-base` was captured with `--wait 25000`. Its
new `setMethods` pageerror triggers DUR under MEP-1020; MEP-1023 owns the
offline safe-continuation review. That issue authorized one click-free retry.
The retry was captured, initially stopped on a new diagnostic, then accepted
by CEO comment `e5f0ac94` on MEP-1012 as the resting-state base. No third
Contact capture or click is allowed. Send Email
and the Emails rail entry are visible, while the card and timeline email rows
remain unobserved. Historical Contact evidence shows Compose Email and
Mails/Drafts/Scheduled tabs, but does not establish current draft contents.

- W1/W3: opening compose, resuming an existing draft, autosave, save/delete,
  sending and scheduling remain writes or possible writes; no editor is opened
  to inspect a Drafts result. Empty/error/validation states are not manufactured.
- W12/W13/W19: send/receive/open/click/reply/bounce timeline entries, permission
  filtering, tracking and association results are not observed. No message is
  opened or sent to generate a timeline row. Metadata lists Emails and Email
  Drafts relations on Leads, Contacts, Accounts and Deals, without proving any
  visible card or event vocabulary.
- R9 should document record-related email status/columns, draft visibility,
  scheduled-mail placement and history events with dated sources; missing UI
  evidence stays a gap. This note requests documentation only and grants no
  sandbox, night-test, message-open, sync or preference-change permission.


R3 final boundary (CEO decision, 2026-10-21): the accepted historical
`m6-contacts-drafts` shows a separate Drafts search page with criteria and an
empty result area, not a record-card Drafts result. `m6-contacts-detail-more`
and `m7-campaign-links-contact-detail` show Overview, not email history.
Record draft contents and email timeline events remain not observed with these
reasons and move to the Module 10 gate questions. R9 retains the documentation
follow-up above; no additional reference access or write is authorized.

## 9. R4 calendar observation boundary

R4 (MEP-1013), 2026-10-22: see [calendar.md](specs/calendar.md).
Only the opening calendar route is captured, without view/date overrides or
clicks. The initial default Day screenshot is provisional because of a page
error; it does not establish weekly/monthly layouts or ordinary event tiles.

- W5/W6/W17 remain untested: create from a slot, drag, resize, reschedule,
  delete, recurrence edit scope, invitees and RSVP are writes. No event is
  created or manipulated to populate an empty range.
- W10 and calendar/user/group view creation or management remain writes or
  possible preference writes. No connection, sync, selection, import/export,
  view switch, sidebar collapse, search or date navigation is invoked.
- R9 should preserve the distinction between documented capabilities and
  unobserved results/validation. This note authorizes no further live action.

## 10. W1 window disposition — no live write observations

Decision date: 2026-10-25. Authority: Platform Lead's final decision in
MEP-1355, including the board's recorded statement that no `BoardRecipient:`
confirmation had been supplied. The dependency is complete because a gap
closure was chosen, not because live activation became available.

The temporary window permitted bounded observations by the CRM Analyst, but
it did not itself satisfy the installed capture tool's activation conditions.
No live policy file is installed in the research write-window directory. The
issue has no activation policy block, and actual endpoint, body and cleanup
contracts have not been established. The existing W0 examples are not proof
of live request formats. The tool's recipient confirmation requirement was
retained; no agent-authored confirmation or substitute policy was introduced.
No capture-tool code or protection was changed for this issue.

All rows below mean **not observed — gap** for this window. Earlier public
help findings above remain documentation claims, not observed results.

| Flow | Window result and remaining observation gap |
| --- | --- |
| W1 | Not observed — gap. Compose, empty/invalid recipient validation, send feedback, record email and timeline results. |
| W2 | Not observed — gap. Reply/reply-all/forward recipients, quotes, subject prefixes, attachment carry-over and thread results. |
| W3 | Not observed — gap. Draft create/save/edit/delete, autosave timing and resulting draft lists. |
| W4 | Not observed — gap. Schedule, time-zone/past-time validation, edit and cancellation results. |
| W5 | Not observed — gap. Meeting creation, board-only invitation, reschedule/cancel notices and invitation content. |
| W6 | Not observed — gap. RSVP states, transitions, organizer feedback and external-invitee processing. |
| W7 | Not observed — gap. Connection tests, reconnect/disconnect and permission/error states. No provider connection is authorized by this closure. |
| W8 | Not observed — gap. First/ongoing sync, matching and deduplication. No sync was triggered. |
| W9 | Not observed — gap. Template create/edit/copy/delete, merge-field picker, preview and validation. |
| W10 | Not observed — gap. Calendar integration, conflicts and deletion propagation. No external service was connected. |
| W11 | Not observed — gap. Import completion notification text. No import was performed. |
| W12 | Not observed — gap. Saved tracking choices, open/click results and status transitions. |
| W13 | Not observed — gap. Record-originated send, manual association/removal and address matching results. |
| W14 | Not observed — gap. Delivery failures, bounce/unsubscribe feedback and blocked-address wording. No failure was deliberately induced. |
| W15 | Not observed — gap. Mass-mail/merge preview and results. Mass/campaign sending was excluded from the window. |
| W16 | Not observed — gap. Workflow email actions belong to Module 12; no automation was created here. |
| W17 | Not observed — gap. Calendar event create/edit/delete, recurrence scopes, drag/resize and conflicts. |
| W18 | Not observed — gap. File attachment upload/remove/send, limits and inline-image feedback. |
| W19 | Not observed — gap. Saved mail-sharing/permission choices and downstream visibility. |

Additional requested settings observations also remain gaps: signature
create/edit/delete and sender association, compose/email preference saving,
personal working hours, organization business hours and calendar defaults.
No previous/new setting values were collected because no setting was changed.

### Exact text and evidence boundary

There are no new observed validation, success or error messages, screenshots,
numbered control inventories, loading/empty states or permission-state captures
from this window. No live reference route or browser action was taken in this
issue. Historical capture limits in the companion specs remain unchanged.
Do not implement guessed messages as if this window verified them.

### Open questions retained

1. What are the exact field-validation and success/error texts for the requested
   mail, template, signature, calendar and settings writes?
2. What live endpoint/body and reversible cleanup contracts would permit a
   separately approved, single-flow capture adapter? No such adapter is claimed.
3. What are the unresolved invitation/RSVP, recurrence/drag/resize, draft,
   scheduled-send, association and sharing results listed in the table?
4. Which mail/calendar states require unavailable access or a provider
   connection? This closure establishes neither access nor a connection.

These are recorded gaps, not pending permission requests or scheduled retries.
A future live observation needs a new bounded issue and the required platform
approvals; this document does not authorize it.

### Issue-scoped cleanup statement

No reference record, draft, message, template, event, attachment, invitation,
automation or setting was created, changed, sent or deleted by this issue.
The local window change log contains its header and no operation rows at the
preflight check. There is no issue-scoped test item or setting to restore.
This statement does not replace the umbrella W5 final cleanup report or
assert the state of other issues.
