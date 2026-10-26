# Email message and conversation — documentation-only research

Status: documentation-only with an access gap; pending UI Lead approval.
Issue: MEP-1011 / M10-R2. Research date: 2026-10-21.

## Purpose and evidence boundary

Describe message reading and conversation context under section 4.2 of the
[approved research plan](../module-10-email-calendar-research-plan.md).
[R1](email-inbox.md) identified no already-read message: the mail area was
inaccessible to the capture user. The CTO closed that access gap and the UI Lead
approved R1 on 2026-10-21, explicitly routing R2 to public documentation only.
No mail-area capture, alternate route, message open or browser interaction was
performed in R2. This file is a documented capability baseline with gaps, not a
verified screen implementation contract. R3 retains its separate record-detail
scope; it must not use this file as evidence that opening a message is safe.

## Documentation sources

All sources below are first-party public help material, read on 2026-10-21.
Locators omit the host; bracketed segments replace product-bearing path text
with neutral aliases, as required by repository policy. These are source
locators, not reference CRM navigation routes. Section headings distinguish the
relevant material; no guide's instructions were executed. Documentation images,
sample people, addresses and message contents were not copied.

| ID | Neutral source title | Locator and section | What it proves / limit |
| --- | --- | --- | --- |
| D1 | Sales-focused email client overview | `/portal/en/kb/crm/[mail-area]/getting-started/articles/[client-overview]` — Email Detail View | Right-side record context; does not prove this user's available controls or exact message layout |
| D2 | Compose, Organize and Configure Emails | `/portal/en/kb/crm/[mail-area]/emails/articles/compose-organize-and-configure-emails` — Add ResponseWatch; Add ResponseWatch on sent emails | Reply-adjacent reminder entry on a sent message; does not settle reply-all/forward placement or prefills |
| D3 | Enhancements related to emails | `/portal/en/community/topic/enhancements-related-to-emails` — Email threads; Attachment pop-up from email related list; attachment cloud-storage enhancement | First-party feature announcement, not proof of deployment or current layout in the capture account |

D1's detail-view section documents a right pane with Info, Conversations and
Timeline. Info includes sender contact details, associated deals and activities;
it also offers record creation and note taking. Conversations gives prior
lead/contact correspondence with a choice between the user's sent mail and
mail from all CRM users. Timeline lists record activity chronologically. These
are documented capabilities; access and sharing still constrain what is visible.

D2 describes adding a response reminder from a sent message through a dropdown
next to Reply, then entering a time and reminder message and creating it. This
is a write flow, never an allowed inspection step.

D3 describes expandable previous messages/follow-ups for mail sent from CRM.
It separately describes attachment access from an email-related-list icon and
saving attachments to related lists or cloud storage, including availability in
the mail area. This does not establish that the mail area uses the same thread
control, ordering, or attachment popup as the record related list.

## Layout

Only the right context pane is established by D1. The message header strip,
subject position, sender/recipient presentation, body region, thread stack,
attachment chips and message action row have not been seen. No geometry, type,
colour or request-shape contract is inferred. D3's record-email thread feature
must not be substituted for an observed mail-area thread screen.

## Control inventory

### Documentation baseline (no captured base)

There is no R2 `controls.json` or screenshot to reconcile. The numbered table
records capabilities and explicit gaps, not a complete visible-control census.
Position is only supplied where D1/D2 establish it. `Contacts ref` refers to
[contacts-record-detail.md](contacts-record-detail.md); `new` means no verified
shared-control mapping. Shared shell rows remain in R1 E-01–E-38 and are not
asserted to appear on an unseen message screen.

| # | Control or region | Position | Behaviour / inspection status | Source | Owning module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- |
| EM-01 | Info section | Right context pane | Sender and related-record context; not clicked | documented (D1) | M10 / linked CRM modules | new |
| EM-02 | Conversations section | Right context pane | Prior correspondence for lead/contact; not clicked | documented (D1) | M10 | new |
| EM-03 | Correspondence scope choice | Conversations; exact widget unknown | Own sent mail or mail from all users; not clicked, persistence unknown | documented (D1) | M10 / permissions | new |
| EM-04 | Timeline section | Right context pane | Chronological record activity; not clicked | documented (D1) | Shared record context | new |
| EM-05 | Create deal/activity/note entry points | Detail view; exact placement unknown | Writes CRM data; not clicked | documented (D1) | M4 / M5 / notes | new |
| EM-06 | Reply and adjacent dropdown | Sent-message detail; dropdown next to Reply | Reminder entry described; not clicked | documented (D2) | M10 | new |
| EM-07 | Add Reminder | Reply-adjacent dropdown | Creates response reminder; not clicked | documented (D2) | M10 | new |
| EM-08 | Expandable previous messages | CRM-sent email thread; mail-area placement unknown | Earlier messages/follow-ups; never expanded | documented (D3), mail-area applicability not observed | M10 | new |
| EM-09 | Attachment access and save options | Related-list email icon; mail-area placement unknown | Attachment access/storage capability; not clicked | documented (D3), exact mail-area UI not observed | M10 / attachments | new |
| EM-10 | Subject and message header | Unknown | Text structure, truncation and controls unknown | not observed | M10 | new |
| EM-11 | Sender and recipient chips | Unknown | Expanded addresses, cc/bcc presentation unknown | not observed | M10 | new |
| EM-12 | Message body and quoted content | Unknown | HTML, plain text, remote-image and quote handling unknown | not observed | M10 | new |
| EM-13 | Reply All / Forward | Unknown | Placement, visibility and prefills unknown; not clicked | not observed; W2 research question | M10 | new |
| EM-14 | Back / previous / next message navigation | Unknown | Existence, labels and behaviour unknown | not observed | M10 | new |

### Delta against R1

No observed delta exists: R1 captured an access dialog, not a mail list or
message. EM-01–EM-14 add documentation and gap rows only. No R2 full shell
inventory or selector is invented; R1's 125 controls must not be counted as R2
controls. No measured parity or inventory-completeness claim is made.

## Fields

Sender context and related-record information are documented by D1. Subject,
from/to/cc/bcc, timestamps, body, attachments and message/thread identifiers
remain structural research questions, not field definitions. As recorded by
the plan and R1, the metadata export has no `Emails` field folder. R8 owns that
model gap; no mandatory flags, lengths, validation, thread keys or data schema
are inferred here.

## Actions and click list

Click list: **empty (0 selectors, 0 clicks)**. Offline selector match and
`DANGEROUS_TEXT` checks: not applicable, no candidate. No new capture command
was run, so there is no R2 base to test selectors against.

Not clicked: opening any message, Reply, Reply All, Forward, Compose, reminder
creation, CRM record creation/editing/linking, attachment preview/download/save,
thread expansion, scope selection, state changes, settings, sync, search and
panel/view preferences. EM rows marked documented do not imply an action was
visible or operated in the reference session.

## Filters / views / sorting / search

D1 establishes the correspondence scope capability only. Its default, permission
filtering, persistence, exact control type and effect on thread grouping remain
unknown. Thread order, collapsed defaults, searching within messages and
pagination were not observed. No scope, sort, view or filter was changed.

## Flows and empty/error states

1. Apply R1's eligibility decision: no unambiguously already-read message
   exists in the evidence, so do not open the mail area or any message.
2. Read public D1–D3 and record capabilities separately from unknown details.
3. Retain the access gap and submit the documentation baseline for approval.

No read receipt, tracking pixel, sync or non-GET request was triggered by a
reference-session capture in R2. There is no R2 request baseline and no
`blockedRequests` file; this is not a claim that a real message open has no
side effects. The plan's tracking/read-receipt and unexpected-POST stop rules
still apply to any separately authorized future observation.

R1's access dialog is not evidence for message loading, missing-message,
permission-revoked, empty conversation, absent attachment, failed attachment,
remote-content blocking or mail-service error states. None of those states is
established by D1–D3. Reply validation, draft creation, success/failure results,
quoted text and attachment carry-over are not observable without a write and
remain in W2/W3/W18 below.

## Write-only flows

See [write-only flows](../module-10-write-only-flows.md), W2 (reply/reply-all/
forward), W3 (drafts), W12 (tracking), W13 (association), W18 (attachments) and
W19 (sharing). R2 adds a documentation follow-up there for response reminders
and context-pane creation; no write test or sandbox action is authorized.

## Open questions

1. What are the actual mail-area message layout, action labels, header/chip
   behaviour, thread order and collapsed defaults? Not observed; D3 is not
   sufficient evidence for the mail-area presentation.
2. Does opening an already-read message send a receipt or load remote tracking
   content? No safe live evidence; documentation silence must stay a gap.
3. What does Reply All include, what does Forward preserve, and how are quoted
   text, subject prefixes and attachments handled? W2/W18; not established here.
4. How is message grouping determined and how does sharing restrict historical
   correspondence? R8/R9 and W19; scope choice is not a permission grant.
5. Which loading, empty and error states are documented for message reading?
   R9 should retain any unresolved visual gap rather than inventing states.

R9 owns the remaining documentation pass through the companion flow file;
these questions do not authorize another mail capture. R3 proceeds only after
R2 approval and within its own record-detail scope.

## Capture refs

- R2: **none**; documentation-only by the approved R1 access-gap decision.
- Inherited eligibility evidence only: `m10r1-mail-inbox-base` and
  `m10r1-mail-inbox-retry-base`, inventoried in [R1](email-inbox.md). No new
  inspection/count claim is made for these captures in R2.
- R2 reconciliation: captures 0, raw controls not applicable, 14 documentation/
  gap rows, excluded controls not applicable. No captured base or delta exists.

## Verification

`research/specs/verify.mjs` is absent. Documentation checks cover required
sections, 14 uniquely numbered rows, source references, repository-relative
links, empty click list, explicit access gap and neutral content. `git diff
--check` is run before handoff. No application tests are needed for this
research-only change; `docs/parity-checklist.md` is unchanged.
