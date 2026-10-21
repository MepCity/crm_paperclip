# Module 10 — write-test protocol (DRAFT, not in force)

- Status: Draft proposal for the board. Nothing in this file is authorized.
- Companion: `module-10-write-only-flows.md` (the narrowed list N1 to N5),
  `module-10-email-calendar-research-plan.md`
- **Hard statement: no write happens in the reference CRM before a written
  board decision is added to AGENTS.md. Rule 2 holds until then, for every
  agent, in every route below, including the sandbox route's preparation.**
  A comment, an issue text or this file never counts as that decision.

## 1. Order of preference (board's preference)

1. **Prepare everything first and narrow the write needs.** Finish the read-only
   plan (R1 to R9), the documentation pass and the ADR; shrink the list in
   section 4 of the write-only file to what truly remains.
2. **Ask the vendor for a sandbox or trial organization.** Writes happen only
   there. Section 2.
3. **Last resort: a night test on the live system.** Only if the sandbox is
   refused or unusable, and only with the written decision. Sections 3 to 9.

## 2. Sandbox route

### 2.1 Questions for the board to put to the vendor

1. Can we get a sandbox, developer or trial organization for the same
   product, and for how long (days, renewal, expiry behaviour)?
2. Is it the same edition and feature set as the production organization
   (email integration, calendar, templates, mass email, workflow rules,
   assignment rules, tracking), and which features are edition-limited?
3. Is the email/mail area enabled, and can we connect our own mailbox (which
   providers and protocols are supported in a sandbox; are there send limits)?
4. Is it fully isolated from the live organization: no shared records,
   users, mailboxes, notifications, audit log, or outgoing mail path?
5. Can we create our own users and roles, and mirror the production profiles
   and role hierarchy?
6. Are there data-copy features (metadata copy, sample data), and can the
   production metadata (modules, fields, layouts, views) be applied without
   copying customer data?
7. Does outgoing mail from the sandbox use the real mail path? Can we restrict
   it to approved addresses?
8. Do the terms of use allow capturing screens and recording behaviour for the
   purpose of building our own internal system? (Board to check licence
   terms; a legal question, not for an agent.)
9. Does the sandbox have a separate sign-in, so agents never use the board's
   production login?
10. Is there a way to reset or delete the sandbox when done?

### 2.2 Acceptance criteria for a test environment

| # | Criterion | Check |
| --- | --- | --- |
| A1 | Same edition and features as production (email module on, calendar, templates, tracking) | Vendor answer 2 in writing; feature list screenshot |
| A2 | Own mailbox connectable (a board-owned test mailbox) | Dry run by the board |
| A3 | Isolated from live data and live users: no shared users, records, notifications | Vendor answer 4; separate sign-in |
| A4 | No customer data | Empty or synthetic data only |
| A5 | Test users and roles exist and can be created | Board creates two test users |
| A6 | Outgoing mail limited to internal test addresses | Settings or domain allow-list |
| A7 | Terms allow the study | Board's own check |
| A8 | Capture tool can be pointed at it without a new login in the shared browser (a new login notifies the board's phone) | Board decides how sign-in is handled; agents do not log in |
| A9 | Disposable: can be reset or deleted | Vendor answer 10 |

The sandbox is also read-write for agents only after the board's written
decision names it (AGENTS.md amendment variant B, section 9), because
everything else in AGENTS.md rule 2 refers to "the reference CRM".

## 3. Live-system night test (last resort)

### 3.1 Preconditions (all required)

- Sandbox refused or unusable, recorded in an issue comment by the CEO.
- Written board decision added to AGENTS.md (section 9 text, variant A).
- This protocol finalized by the board, with the action list in section 5
  numbered and approved line by line.
- Time window set by the board (section 7).
- Rollback and cleanup owner named (a human, not an agent).

### 3.2 Test data rules

- Every record the test creates carries the marker `ZZTEST` in each name-like
  field it has (title, subject, last name, company name, template name),
  followed by a running number. Example: `ZZTEST-01`.
- No record already in the system is edited, deleted, cloned, merged or used
  as a related record. Test records are linked only to other test records.
- No email to any external address. The only recipient is one internal test
  mailbox owned by the board, listed in the decision. No real person is
  invited to a test meeting. No CC/BCC, no mass email, no template sent to a
  contact list.
- Owners of test records: a designated test user if the board creates one;
  otherwise the board's own user (notification side effects noted below).
- No automation or assignment rule is tested; see 4.2 for the avoidance.

## 4. Side effects that must be thought through before a night test

### 4.1 Cleanup and permanence

| Item | What happens | Cleanup / accepted? |
| --- | --- | --- |
| Test records | Created records remain in lists, counts, searches | Delete each one, then purge from the recycle bin in the same window; a human confirms the empty recycle bin |
| Recycle bin | Deleted records sit there until purged; purge is a further write | Included in the approved action list; recorded as an action |
| Audit trail / change history | Create, update, delete and send events are recorded and cannot be removed | **Board decides: accepted or not.** If not accepted, the night test cannot run on the live system |
| Notifications | The owner, followers and managers may receive in-app or mail notices | Use a test owner; warn users; list known notice types before the window |
| Workflow rules / assignment rules | May fire on creation or update of the test record (assign owner, send mail, create task, field update) | See 4.2 |
| Timeline entries | A sent mail or a meeting adds timeline rows on the test record only | Gone with the test record; if the record had been linked to a real record, it would persist; therefore never link |
| Email sync side effects | A connected mailbox may sync and auto-create or match records, or pull mail into the timeline of real contacts | Connect only a fresh board-owned test mailbox; disconnect at the end; record what sync created; the sync window must be known first |
| Reports and dashboards | Counts, email analytics counters (`Sent`, `Tracked`, `Opened`, `Replied`, `Received`) and activity tallies change by the number of test actions | Note counts before and after; accepted or not is a board decision; cannot be reverted |
| Mail provider side | The internal test mailbox keeps the received mail; the sender account's sent log shows it | Board owns the mailbox; delete there |
| Tracking | Opens and clicks recorded when the board opens a tracked test mail | Send with tracking off if the option exists; otherwise accepted |
| Quotas | Daily send limits consumed | Count against the daily quota; trivial for a handful of mails |
| Storage | Uploaded attachments or templates consume storage | Remove and purge |
| Calendar | An event may appear on the owner's calendar and sync to an external calendar if sync is on | Test user without calendar sync |

### 4.2 Rules that could fire on test records

`workflow_rules.json` in the local metadata export holds an API-not-supported
error and `assignment_rules.json` holds `null`: **the rules cannot be listed
from the export.** Consequences:

1. The board (or an admin) reads the rule lists in the settings pages, which is
   read-only viewing, before the window, and records for Leads, Contacts,
   Accounts, Deals, Meetings and Emails: which rules exist, their trigger
   (create, edit, both), their scope (all records or conditions), and their
   actions (email alert, task, field update, webhook).
2. For each rule that would fire, the protocol chooses one of: test record
   fields set so the condition does not match (for example a name condition
   that `ZZTEST` does not satisfy); use a module the rule does not cover; or
   the action is dropped from the list.
3. Any rule that sends mail to a real person, or calls a webhook, makes the
   corresponding action impossible and it is removed.
4. If the rules cannot be read at all, no action that creates a record runs.

### 4.3 Items outside our control

- Other users receiving a notification about the test records: warn them or
  restrict to a time when nobody works; accepted risk, to be written down.
- Vendor-side logs.
- Metrics that survive deletion (count of records ever created, API calls).

## 5. Pre-approved action list (template; each action numbered, exact, nothing else)

The board approves the final list line by line. Any action not on the list is
forbidden. Each action states: exact control path or API-free UI route,
exact input, expected result, how it is undone. Draft entries map to the
narrowed list N1 to N5:

| No. | Action (exact) | Input | Evidence | Undo |
| --- | --- | --- | --- | --- |
| T1 | Open Compose from the test Contact `ZZTEST-01` detail; press Send with empty recipient | none | screenshot of validation message | none needed |
| T2 | Same compose; recipient = the internal test mailbox; subject `ZZTEST-01 mail`; body one line; Send | the one address from the decision | screenshot of the Emails card and the timeline row; mail header in the test mailbox | delete test record, purge |
| T3 | Create meeting `ZZTEST-01 meeting` on the test Contact, one invitee = test mailbox; Save | as stated | invitation mail look; Invitees list | delete meeting, purge |
| T4 | Accept the invitation from the test mailbox | none | state after RSVP | covered by deletion |
| T5 | Create template `ZZTEST-01 template` with one merge field; Preview with the test record; Delete | as stated | preview screenshot | delete, purge |
| T6 | (optional) Import a three-row file with `ZZTEST` names, Notify Email on; read the mail | file prepared by us | mail text | delete the three records, purge |
| T7 | Delete the test records and purge the recycle bin | list of `ZZTEST` records | empty recycle bin screenshot | n/a |

The list is a draft, not an approval. Connection of a mailbox (N3) is
deliberately absent: connecting a mailbox to the live system risks pulling real
mail; if the board wants N3, it must be a separate decision with a fresh
mailbox and the sync window known.

## 6. Cleanup checklist (after the window)

1. Every `ZZTEST` record deleted; recycle bin purged; screenshot of the empty
   bin and of a search for `ZZTEST` with zero results.
2. Templates, drafts and uploaded files removed and purged.
3. Test mailbox cleaned by the board; mailbox disconnected if it was
   connected.
4. Notification inbox of the test owner cleared; list of other users who
   received a notice recorded.
5. Analytics counters before and after recorded in the evidence.
6. Audit trail entries noted as permanent (accepted by the board's decision).
7. A final read-only view confirms nothing else changed (lists, counts, a
   hash of the visible region of the lists touched).

## 7. Time window and watching

| Item | Proposal |
| --- | --- |
| Window | Set by the board in the decision: date, start, end, local time zone. Outside it nothing runs. |
| Variant 1: board watches live | The board sits at the shared browser, sees each action, and says go before each numbered action; any surprise stops the run at once. Safest; costs the board's night. |
| Variant 2: board does not watch | A pre-approved list runs unattended with the abort conditions below; evidence is reviewed in the morning. Higher risk; allowed only if all of the following hold: no external recipient is possible, rules proven non-firing, and every action is read-back-verified before the next. |
| Run length | Short; maximum number of actions equals the list; one agent only. |

## 8. Abort conditions

Stop at once, do nothing further (no revert attempt unless the list names it),
and tell the board, when:

- any action not on the list is offered by the UI or any extra request
  appears (a request count above the expectation);
- a recipient other than the test mailbox is shown or prefilled;
- a prompt asks to confirm something affecting existing records, users,
  settings or mailbox permissions;
- a rule or notification can be seen to fire on a real person;
- an error page, a repeated error, or a session sign-in prompt appears (never
  log in again; the board handles it);
- the page changes layout in a way the list did not predict;
- the window ends.

## 9. Evidence to record

For every action: its number, wall time, screenshot before and after (in
`captures/<slug>/`, not in the repo), the capture `meta.json`, request paths
and counts, outcome in one line, and the undo performed. Specs written from
the evidence follow the usual rules: structure only, no mailbox values, no
vendor name.

## 10. Proposed AGENTS.md amendment (text for the board; NOT applied)

The board adds this text to AGENTS.md only if it decides to allow a write
test. Until it is added, rule 2 applies in full.

**Variant A (live system, night test):**

> Exception to rule 2, valid only for the window and the list in
> `research/module-10-night-test-protocol.md`, version approved on
> `<date>` by the board: during the window `<start>` to `<end>` (local time),
> the agent named in the protocol may perform exactly the numbered actions
> T1 to T`<n>` in the reference CRM, on records whose name fields start with
> `ZZTEST`, with the one internal test mailbox named in the protocol as the
> only recipient and no real invitee. No other add, change, delete, send,
> merge, import, export, convert, assign or setting change is permitted, and
> rule 2 applies unchanged outside the window and the list. On any abort
> condition of the protocol the agent stops and reports to the board.
> Audit-trail entries, notifications and counters that cannot be removed are
> accepted by the board for this window. This exception expires at `<end>`
> and is removed from this file by the board afterwards.

**Variant B (vendor sandbox organization):**

> Exception to rule 2: the reference CRM sandbox organization named by the
> board in the protocol (identified there, never in this repository) is not
> "the reference CRM" for rule 2. Writes are permitted in it, within the
> protocol's list of actions, with no customer data and only addresses owned
> by the board. The production organization remains strictly read-only.
> Nobody opens a new session or login in the shared browser; the board
> handles sign-in.

The amendment text names no vendor, no account identifiers and no address;
the identifying details live in the board's private notes.
