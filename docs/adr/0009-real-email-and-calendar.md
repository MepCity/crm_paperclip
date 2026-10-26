# ADR 0009 — Real email and calendar (Module 10)

- Status: Accepted in direction (board answers to Q1–Q14 on 2026-10-21,
  MEP-1004); storage and schema details follow research R8 and are decided in
  the implementation issues (high tier) or a follow-up ADR
- Date: 2026-10-21
- Decider: Board (CTO recommends per topic, marked below)
- Issue: MEP-990
- Dependencies: ADR 0001 (stack, worker deferred to Phase 4), ADR 0002 (record
  storage and tenant isolation; Proposed, on branch history, not yet on `main`
  when this was written), ADR 0004, ADR 0005 (private blob-store port, upload
  batches), ADR 0007 (recovery boundary), ADR 0008 (documents storage; partly
  accepted, on its own branch history)
- Scope: architecture options and recommendations only; no implementation,
  schema or provider account is approved by this file

## Context

Board decision 2026-10-21: Module 10 (email inbox and calendar) must really
send and receive mail and support calendar. It is not a UI shell. The board will
use the CRM in real work after phase 1. Notify Email (CSV-09, deferred from the
Module 6 import) belongs to Module 10.

Evidence boundary:

- Local research metadata (structure only): `Events` has title, venue,
  start/end, all-day, recurrence rule, reminders, participants, and meeting
  provider and venue picklists, with Notes, Attachments, Invitees and CheckLists
  as related lists. `Emails` and `Email_Drafts__s` are related lists on Leads
  and Contacts. `Email_Analytics` holds per-user counters (sent, bounced,
  tracked, opened, clicked, replied, received). `Emails`, `Email_Drafts__s`,
  `Email_Template__s` and `CalendarBookings__s` have no field export, so the
  message, draft, template and booking models are ours to design.
- Workflow and assignment rules are not exportable (error / null).
- No reference CRM session was opened for this ADR; behaviour parity is a
  research question (see `research/module-10-email-calendar-research-plan.md`
  and `research/module-10-write-only-flows.md`).
- Repo today: `apps/web`, `packages/core` (records, tenancy, attachments with a
  local-disk blob store, transfer/CSV), `packages/db`. There is no `apps/worker`,
  no job queue, no mail code. ADR 0001 defers the worker to Phase 4 with a
  PostgreSQL-backed queue and states that no paid service is adopted without
  board approval.

## Decision drivers and criteria

| # | Criterion | Why it matters |
| --- | --- | --- |
| D1 | Real use by the board | Mail must actually arrive and leave; failures must be visible, not silent |
| D2 | Mailbox of the board's team works without exotic setup | Most likely a mix of Gmail / Google Workspace and Microsoft 365 or a plain IMAP host |
| D3 | Tenant isolation and secret safety | Mail is the most sensitive data in the CRM; one organization never sees another's mailbox or tokens |
| D4 | Least privilege | Request the smallest OAuth scopes; nothing outside the CRM's need |
| D5 | Local development and CI without a real mailbox | Tests run on a throwaway server (ADR 0001 harness style) |
| D6 | No unapproved spend | Hosted providers and KMS cost money: board approval needed |
| D7 | Parity with the reference screens | Inbox, thread, Emails related list, calendar views, settings (research pending) |
| D8 | Reuse of existing storage and write paths | Attachments follow ADR 0005/0008; records change only through the single write path (ADR 0002 §6 proposal) |
| D9 | Operability | Retries, backfill, rate limits, observability, and a way to disconnect cleanly |

## Trust boundary

| Asset | Who may read | Rule |
| --- | --- | --- |
| Mailbox credentials (OAuth refresh tokens, app passwords) | Only the connector service code | Never in `RecordData`, logs, API responses, events, error messages or fixtures; encrypted at rest; not readable by `crm_app` SQL paths that serve the browser |
| Message bodies and headers | Users whose permission model allows it (see topic 4 and Q8) | Stored per organization with the same tenant-leading keys and row-level security as other CRM tables; no cross-tenant joins |
| Attachments | Same access as the message | Private blobs through the ADR 0005 blob-store port; never public URLs |
| Provider webhooks and inbound SMTP | Anyone on the internet can call them | Verify signature or secret; unauthenticated payload never trusted for org selection |
| Worker | Reads all organizations' jobs | Own role and policy (as ADR 0002 §5 says for the Phase 4 worker); org id derived from the job row, never from the payload |
| Test environments | Developers and CI | No real mailbox or real customer data; synthetic fixtures only |

Tenant rule: a mailbox account belongs to exactly one organization and one
owner (user) or to the organization as a shared mailbox. Every message,
thread, draft and calendar row carries `organization_id` as the leading key
column, matching ADR 0002's policy shape.

## Topic 1 — Provider access

| Option | Pros | Cons |
| --- | --- | --- |
| A. Generic IMAP + SMTP (app passwords or XOAUTH2) | Works with any host; no vendor API approval; simple to test locally with GreenMail or Mailpit; no provider review process | Major providers are retiring basic auth; IMAP gives weak thread metadata and no push on many hosts; password handling is risky; per-provider quirks |
| B. Gmail API and Microsoft Graph with OAuth | First-class threads, push (history ids, change notifications), calendars and mail under one grant, scoped consent, revocable | Two integrations to build and keep; Google restricted scopes require app verification and a security assessment for public apps (internal/test-user apps avoid this); Microsoft tenant admin consent in some tenants; provider outages and quota differ |
| C. Transactional provider (Postmark, Amazon SES, others) for outbound only | Strong deliverability, bounce and complaint webhooks, simple API | Does not read the user's mailbox; sent mail does not appear in the user's own Sent folder; costs money; From-domain verification needed |
| D. A + B + C combined: OAuth providers for user mailboxes, IMAP/SMTP as fallback, optional transactional for system mail (Notify Email, invitations from a system address) | Covers real use | Most work; needs a connector interface from the start |

CTO recommendation (pending board decision): D, built in this order behind one
`MailConnector` port. First deliver B for the provider(s) the board's team
actually uses (the board names them: Q1), then A as the generic fallback, then
C only for system mail if volume or deliverability demands it. System mail
(Notify Email) can use plain SMTP of an organization-owned address at first.

## Topic 2 — Secret storage

| Option | Pros | Cons |
| --- | --- | --- |
| A. Envelope encryption with an application key from environment (AES-256-GCM, key id stored with the ciphertext) | No new service; fits local and single-host start; key rotation by re-encrypting rows | The key lives next to the app; compromise of the host exposes it; rotation is our job |
| B. Cloud KMS wrapping per-secret data keys | Key never leaves the KMS; audit of key use; managed rotation | Provider dependency and cost; board approval for hosted spend (D6); local dev needs a stand-in |
| C. Store OAuth refresh tokens only (no passwords) and refuse app passwords | Smallest secret surface; tokens are scoped and revocable; no password reuse risk | Excludes plain IMAP hosts that lack OAuth |
| D. App passwords allowed for IMAP | Works everywhere | Long-lived credentials that grant full mailbox access; harder to revoke; user may reuse a primary password |

CTO recommendation (pending board decision): A now behind a `SecretBox`
interface (so B can replace it without schema change), with C as the default
(OAuth tokens only) and D allowed only when an administrator enables it for a
named IMAP host. Rules: key id on every ciphertext; rotation job re-wraps
rows; secrets decrypted only in the connector process memory; `crm_app`
browser-facing queries select no secret column (catalog test, as ADR 0002 §5
does for credentials); disconnecting deletes the secret and stops the sync
immediately.

## Topic 3 — Inbound sync model

| Option | Pros | Cons |
| --- | --- | --- |
| A. IMAP polling by UID with `UIDVALIDITY` check | Simple; works on any host; resumable (last seen UID per folder); safe to repeat | Latency equals poll interval; load on the provider; must handle `UIDVALIDITY` reset (full resync) and expunges |
| B. IMAP IDLE with a poll fallback | Near real time on supporting hosts | A long-lived connection per mailbox; connection limits; reconnect logic |
| C. Provider push: Gmail watch plus history ids, Graph change notifications and delta queries | Efficient, near real time, incremental by cursor | Needs public webhook endpoint and subscription renewal (expiring); falls back to polling when a notification is missed |
| D. Sync window and folders: limit first sync to a recent window (for example 30 days) and to Inbox and Sent (more folders by setting) | Bounded first load, bounded storage, faster first use | Older mail is not in the CRM unless the user widens the window |

CTO recommendation (pending board decision): C for Gmail and Graph with a
scheduled delta poll as the safety net, A for generic IMAP (IDLE as a later
optimization), and D with a default 30-day window and Inbox plus Sent. Sync
is idempotent: a message is keyed by `(organization_id, mailbox_id,
provider_message_key)` so repeats do nothing. Cursors (UID/UIDVALIDITY or
history id / delta token) are stored per mailbox and folder. Sync runs only in
the worker and never from a page load; the UI shows last-sync time and error
state. Reference parity for window and folders is an open research question
(W8).

## Topic 4 — Threading and linking to records

| Option | Pros | Cons |
| --- | --- | --- |
| A. Standards headers: `Message-ID`, `In-Reply-To`, `References` (with subject-normalization fallback) | Works for any provider and for our own sent mail; deterministic | Clients drop headers; mailing lists rewrite subjects; edge cases merge or split threads |
| B. Provider thread ids (Gmail `threadId`, Graph `conversationId`) | Matches what users see in their mailbox | Provider-specific; not available over generic IMAP; ids are not portable |
| C. Both: provider id when present, headers as fallback and for our own sent mail | Best accuracy per provider | Two code paths; a thread table needs a source column |

Linking to CRM records: match each participant address (from/to/cc) against
indexed email fields of Leads, Contacts and Accounts (exact, case-insensitive
match on the normalized address; domain-to-Account matching is optional and
off by default). A message links to every matching record; manual association
and removal are allowed. Several records with the same address is an
edge case that links to all and flags the message as ambiguous. Link rows are
created by the connector through the record write path, never by direct SQL.

CTO recommendation (pending board decision): C for threading; exact-address
matching for linking, with manual association; domain matching deferred. Who
may read a mail linked to a shared record (own mail only, or any user who can
see the record) is a board question (Q8) because it is a privacy decision.

## Topic 5 — Attachments

| Option | Pros | Cons |
| --- | --- | --- |
| A. Reuse the ADR 0005 blob-store port and attachment metadata; mail attachments get their own link rows, bytes in the same private store | One storage authority; streaming; tenant namespace; later object-storage adapter | Needs the ADR 0008 shared content-store idea (`content_blobs`) to avoid duplication, still partly proposed |
| B. Keep attachments only in the provider and fetch on demand | No storage cost; no copy of sensitive files | Needs live provider access to open; fails after disconnect; slower; breaks offline tests |
| C. Copy into the CRM only when the user attaches or saves to a record | Small storage | Surprising for audit and search |

Limits: provider ceilings apply (Gmail 25 MB per sent message, Microsoft 365 150 MB for
Graph large uploads with limits per tenant policy; to be confirmed in the
provider docs when implemented); our own cap per message is a configurable
constant, default proposed 20 MB total outbound (the reference's value is an
open question; documents disagree as in ADR 0005 P1/P2). Inbound attachments
over the cap are recorded as metadata (name, size, type) with a "not stored"
marker. Scanning: run the ADR 0005 file policy (extension, claimed type,
actual format, active content rejection) on download, and an optional antivirus
step (ClamAV scanner behind a port) before a file is made downloadable;
quarantine on failure. Downloads use attachment disposition, `nosniff`, and no
public URLs.

CTO recommendation (pending board decision): A, with B as the behaviour for
over-cap files, and the antivirus port defined from day one even if the first
adapter is "off" (explicitly recorded in the settings page).

## Topic 6 — Calendar

| Option | Pros | Cons |
| --- | --- | --- |
| A. ICS invites only (iCalendar / iTIP via mail, RFC 5545/5546) | Works with any calendar client and mailbox; no calendar API; easy to test | No two-way sync; RSVP replies must be parsed from incoming mail; no free/busy |
| B. Provider calendar APIs (Google Calendar API, Microsoft Graph calendars) | Two-way sync, RSVP states from the provider, free/busy, meeting links | Another sync engine; broader OAuth scopes; two integrations |
| C. CalDAV | One protocol for several hosts | Uneven support (Microsoft 365 has none); complex sync; limited use inside the vendor ecosystems |
| D. CRM-native calendar (the `Events` model in our database) plus A for invitations, with B added per provider later | Delivers calendar views and meeting scheduling at once; invitations reach anyone; B is additive | No external calendar sync at first; board must accept |

RSVP handling: process incoming iMIP replies (METHOD:REPLY) by matching `UID`
and attendee address; update the invitee state (accepted / declined /
tentative / no response); also accept provider API state when B exists. The
state vocabulary of the reference is unknown (W6) and recorded as an open
question; ours follows iCalendar PARTSTAT.

CTO recommendation (pending board decision): D. Native `Events` first (it
already exists as the Meetings module), ICS invitations and iMIP reply
processing through the mailbox, then B for the provider(s) the board uses,
CalDAV not planned.

## Topic 7 — Sending limits and deliverability

| Aspect | Options | Notes |
| --- | --- | --- |
| Outbox | A. Send inline in the request; B. Persist to an outbox table, send from the worker with retries | Inline fails visibly but blocks and loses mail on a crash; outbox is reliable and enables scheduled send |
| Retries | Exponential backoff with a cap; permanent failures (invalid recipient, auth revoked) stop retrying and mark the message failed with a readable reason | Never silent; user sees status |
| Rate limits | Per mailbox and per organization counters against provider quotas (Gmail and Microsoft 365 daily limits; SMTP host limits); mass email is a later campaign concern | Counters in the database; configurable |
| SPF / DKIM / DMARC | Sending through the user's own provider inherits the user's domain setup; system mail from an own domain needs SPF, DKIM, DMARC records published by the board | Documented as a deployment step; the ADR does not choose a domain |
| Bounces | Parse DSN (RFC 3464) for SMTP/IMAP; use provider events for transactional providers; mark address as bounced and surface in lists (the reference has a blocked-address filter operator) | Bounce vocabulary open (W14) |
| Tracking | Open pixel and link rewriting are optional, off by default | Privacy and legal choice for the board (Q9) |

CTO recommendation (pending board decision): outbox table with worker sending,
bounded retries, visible status per message, per-mailbox daily counters, and
tracking off by default. Domain and DNS records are a board deployment task.

## Topic 8 — Local development and tests

| Option | Pros | Cons |
| --- | --- | --- |
| A. Mailpit (SMTP sink with web UI and API) | Trivial to start; good for outbound assertions | No IMAP |
| B. GreenMail or similar (SMTP + IMAP + POP3 in memory) | Full send and receive loop in one process; fits integration tests | JVM dependency |
| C. Own fake IMAP/SMTP in Node for unit tests | No external process; deterministic fixtures | Not a real protocol implementation; risk of testing the fake |
| D. Provider API fakes (recorded HTTP fixtures for Gmail/Graph) | Fast; tests mapping code | Fixtures drift from the real APIs; need a periodic manual check |

Rule: CI and local tests never use a real mailbox and never need a network
account. Test plan: connector contract suite run against fakes of each
provider; GreenMail (or an equivalent IMAP/SMTP test server) for the generic
connector in an optional integration tier; Mailpit for outbound in `pnpm dev`;
synthetic message fixtures (RFC 5322 samples with threads, attachments,
encodings, bounces, ICS invites) committed under the module's test folder,
with invented addresses on reserved domains (`example.com`). Live-provider
checks are a manual smoke, never in CI.

Test mailbox rule (board decision, 2026-10-21):

- A sandbox is not required. The only address any real send may go to, from
  our system or in a reference CRM write test, is the board's test address.
  It is given only in the board's decision comment on the Paperclip issue and
  is never written into the repository, specs, fixtures, seeds, committed
  config or commits (AGENTS.md rule 3); a manual smoke reads it from there or
  from a git-ignored `.env.local` variable.
- No email, invitation or notification may reach anyone registered in the
  reference CRM (customers, leads, contacts, users, team members). Our seeds
  and demo data therefore never hold real addresses, and the outbox refuses
  any real send in development unless the recipient equals the configured
  test address (an allow-list of one, checked in the sender, with a test).
- Before any write test in the reference CRM, its workflow rules, assignment
  rules, notification settings and owner/team notices are checked read-only;
  an action that could fire one is not run and goes to the board
  (`research/module-10-night-test-protocol-draft.md`, sections 0 and 4.2).
  Write tests use `ZZTEST` records, an approved action list and a deletion
  list, in a board-set window, and only after the rule 2 exception is added
  to AGENTS.md.
- Board answers Q12 to Q14 (2026-10-21): the CTO proposes the window and the
  final action list after R1 to R10 and the board approves; a notice that
  reaches only the board's own user or test address is accepted, anything
  else stops; undeletable logs and counters are accepted.

CTO recommendation (pending board decision): D and C for unit tests, GreenMail
(or a comparable test server; to be chosen at implementation after checking
install weight) for the IMAP integration tier, Mailpit for local sending.

## Topic 9 — Background jobs

Current repo: no worker, no queue; ADR 0001 defers `apps/worker` and a
PostgreSQL-backed queue to Phase 4 and `LISTEN/NOTIFY` for live updates.
Sync, outbox sending, token refresh, subscription renewal, bounce processing,
the Notify Email mail and scheduled sends all need background execution.

| Option | Pros | Cons |
| --- | --- | --- |
| A. Pull Phase 4's worker forward: `apps/worker` with a PostgreSQL job table (`FOR UPDATE SKIP LOCKED`), own database role and policy | Matches ADR 0001; no Redis; transactional enqueue with record writes | A queue ADR is needed first; the worker role must read all organizations' jobs safely |
| B. Use a library on PostgreSQL (graphile-worker, pg-boss) | Less code to write | New dependency to approve; its schema vs our RLS conventions |
| C. In-process timers in the Next.js server | No new process | Not reliable on restarts or multiple instances; unsuitable for real mail |
| D. External scheduler or hosted queue | Managed | Spend and new infrastructure; board approval |

CTO recommendation (pending board decision): A (or B if the queue ADR prefers a
vetted library), decided in a short queue ADR that is a prerequisite of Module
10 implementation. Because Module 10 is real use, the worker is not optional:
it moves from Phase 4 to the start of Module 10 implementation. Jobs are
idempotent, carry an organization id read from the row, and log failures
visibly.

## Notify Email (CSV-09)

Notify Email is a completion mail for a CSV import. It uses the same outbox
and worker: when an import job finishes, enqueue one system mail (to the
importing user, subject and body from our own template) and show the result in
the import history. The reference's exact text is not required for function;
parity of text is the optional N5 check in the write-only file. Until a
connector exists, this mail is delivered through the organization's SMTP
settings (topic 1, option D, system mail).

## Implementation order (for the board's information)

1. Queue ADR and `apps/worker` skeleton; `SecretBox`; mailbox account tables.
2. Outbound: outbox, SMTP/provider sender, compose, Emails related list, Notify Email.
3. Inbound: connector for the board's provider, sync, threading, linking.
4. Calendar: native views over `Events`, ICS invitations, iMIP replies.
5. Provider calendar sync, templates, tracking, bounce handling.

Each step ships through the module-by-module gates; research (read-only) runs
first as in the research plan.

## Consequences

- Module 10 is the first module with external side effects, secrets and a
  worker. Its risk tier is high for the connector, secrets, worker and data
  model issues.
- A real mailbox is never a test dependency; the board's own smoke checks are
  manual.
- Some reference behaviour (sync window, RSVP vocabulary, message states)
  stays an open question until the sandbox or documentation settles it; the
  implementation uses documented constants marked as interim.

## Board decisions (2026-10-21, MEP-1004)

These answers replace the "pending board decision" notes in the topics above
where they conflict.

| # | Decision |
| --- | --- |
| Q1 | Google (Gmail / Google Workspace mail and calendar) first, through option B; generic IMAP/SMTP (option A) later. Microsoft Graph is not planned for now. |
| Q2 | No hosted services for now: secrets, queue and outbound mail stay on our own host. |
| Q3 | Yes: an internal-only OAuth app for Google mail and calendar scopes; no public app verification. |
| Q4 | One personal mailbox per user; no shared organization mailboxes. |
| Q5 | Default sync window 30 days, Inbox and Sent; older mail can be imported on demand. |
| Q6 | Deferred. The first release sends from the user's own connected mailbox; a system sender domain and SPF/DKIM/DMARC are decided later. |
| Q7 | Outbound attachments: 20 MB total, ADR 0005 allowlist. |
| Q8 | A linked message is private to the mailbox owner by default; others who can see the record see it only if the owner shares it. Deliberate choice, recorded as a deviation if the reference behaves differently. |
| Q9 | No open or click tracking in the first release (implementation step 5 drops tracking). |
| Q10 | The worker moves forward from Phase 4 to the start of Module 10. |
| Q11 | First calendar release: native calendar over `Events` plus ICS invitations; external calendar sync later. |
| Q12 | After research R1–R10 the CTO proposes the live test window and the final action list; the board approves. No write before the AGENTS.md rule 2 exception is written. |
| Q13 | A notice or mail that can reach only the board's own user or test address is accepted without asking. Anything that could reach another user, customer, lead or contact stops that action and goes to the board. |
| Q14 | Accepted: undeletable audit-log and analytics traces of a live test are fine as long as they are only logs or counters and no message reaches anyone. |

## Board questions (as asked)

| # | Question |
| --- | --- |
| Q1 | Which mail and calendar providers does the team really use (Google Workspace, Microsoft 365, other IMAP host)? This decides the order in topic 1. |
| Q2 | Are hosted services (cloud KMS, transactional email provider, hosted queue) approved, or should everything stay on our own host for now? |
| Q3 | May the CRM request mailbox scopes (read, send, calendar) from Google or Microsoft for the board's accounts? Is an internal-only OAuth app acceptable, so no public app verification is needed? |
| Q4 | Per-user mailboxes only, or also shared organization mailboxes? How many mailboxes per user? |
| Q5 | Default sync window and folders (proposal: 30 days, Inbox and Sent)? Should older mail be importable on demand? |
| Q6 | Which domain and sender address should system mail (Notify Email, invitations) use, and who publishes SPF, DKIM and DMARC records? |
| Q7 | Maximum outbound attachment size and allowed types (proposal: 20 MB total, ADR 0005 allowlist)? |
| Q8 | Who may read a message linked to a record: only the mailbox owner, or everyone who can see the record? |
| Q9 | Open and click tracking: off by default, on by setting, or not built in the first version? |
| Q10 | Is the worker pulled forward from Phase 4 to the start of Module 10 (needed for real mail)? |
| Q11 | Is a native calendar plus ICS invitations acceptable for the first calendar release, with external calendar sync later? |
| Q12 | Answered 2026-10-21: sandbox optional; a live test window with the board's test address as the only recipient, after the read-only rule check and the AGENTS.md exception. Open: the window and the final action list. |
| Q13 | Answered 2026-10-21: the rule, assignment and notification check is mandatory and read-only before any write; a rule that could fire stops that action and goes to the board. Open: may a notice to the board's own user (record owner, Notify Email) be accepted? |
| Q14 | Does the board accept that audit trail entries and analytics counters from a live write test cannot be removed, if a night test is ever chosen? |

## Alternatives not chosen now

- Building only a UI against a fake backend: rejected by the board decision.
- Embedding a hosted unified-inbox or calendar service: adds spend and an
  external data processor holding all mail; not chosen without board approval.
- Storing full mail bodies encrypted client-side: rejected for now; it breaks
  server-side search and threading.
