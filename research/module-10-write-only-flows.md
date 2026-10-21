# Module 10 — flows that can only be studied by writing

- Status: Draft for CEO/board review
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

## 8. R3 record-detail observation boundary

R3 (MEP-1012), 2026-10-21: see
[email-record-detail.md](specs/email-record-detail.md). The Lead resting screen
shows Send Email and email-address links; none is activated. The initial probe
fails the paint gate; MEP-1020/1021 accept the existing retry using the earlier
painted Lead baseline errors and blocked-telemetry count exception. No new Lead
capture is made. The board subsequently supplied the Contact address; the
click-free `m10r3-contact-detail-base` was captured with `--wait 25000`. Its
new `setMethods` pageerror triggers DUR under MEP-1020; MEP-1023 owns the
offline safe-continuation review. No retry or click was attempted. Send Email
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
