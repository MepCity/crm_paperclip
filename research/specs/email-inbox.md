# Email inbox — list research and access evidence

Status: closed as gap: mail area not accessible to the capture user; no mail tab in the rail.
Disposition: CTO decision on 2026-10-21; pending UI Lead approval.
Issue: MEP-1010 / M10-R1. Research date: 2026-10-21.

## Purpose

Describe the default mail folder and directly exposed sent, draft, scheduled
and tracked lists, without opening a message or changing any state. Follow
[module-10-email-calendar-research-plan.md](../module-10-email-calendar-research-plan.md),
section 4.1. This document records the closed access gap and retained evidence;
it does not establish an inbox implementation contract.

## Layout and observed state

A click-free probe of `/crm/<org>/tab/Emails` showed the application shell and
an access-denied dialog over an empty content region. The screenshot was
inspected. The dialog contains a heading, a short explanation about insufficient
permissions and contacting an administrator, and an OK button. OK was never
clicked (confirmation/dismissal controls are forbidden).

No mail module title, mailbox selector, folder pane, message list or utility
strip is visible. This is **not evidence of an unconnected mailbox**. The rail
inventory E-01–E-35 contains no mail tab. The CTO determined on
2026-10-21 that the mail area is unavailable to this capture user and closed
R1 as a gap. The exact role/license prerequisite remains a documentation
question for R9. No alternate route or folder query was invented; none will
be tried, and switching applications through E-01 is outside scope.

## Control inventory

### Base: `m10r1-mail-inbox-base`

All rows have presence source `seen (m10r1-mail-inbox-base)`; behaviour is
`not observed` because no control was clicked. Shell controls are dimmed behind
the dialog. `Contacts ref` refers to [contacts.md](contacts.md); `new` means
absent from that inventory, not necessarily specific to email. Entry numbers
below are **one-based JSON array positions for offline reconciliation only**,
never selectors. Nested DOM representations of one visible control are grouped.
Status text is included to describe the observed error state.

| # | Region | Control | Type | Position | Behaviour | Source | Module | Contacts ref | controls.json entries |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E-01 | Rail | Product selector | select | header, left | not observed | seen (m10r1-mail-inbox-base) | Shared shell | SH-01 | 2–4 |
| E-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m10r1-mail-inbox-base) | Shared shell | SH-02 | 11 |
| E-03 | Rail | Home | link | pinned group, first | not observed | seen (m10r1-mail-inbox-base) | M14 | SH-03 | 12–14 |
| E-04 | Rail | Workqueue | link | pinned group, second | not observed | seen (m10r1-mail-inbox-base) | M14 | SH-04 | 15–17 |
| E-05 | Rail | Reports | link | pinned group, third | not observed | seen (m10r1-mail-inbox-base) | M13 | SH-05 | 18–20 |
| E-06 | Rail | Analytics | link | pinned group, fourth | not observed | seen (m10r1-mail-inbox-base) | M13 | SH-06 | 21–23 |
| E-07 | Rail | Agents | link | pinned group, fifth | not observed | seen (m10r1-mail-inbox-base) | P3 | SH-07 | 24–26 |
| E-08 | Rail | MCP | link | pinned group, sixth | not observed | seen (m10r1-mail-inbox-base) | P3 | SH-08 | 27–29 |
| E-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m10r1-mail-inbox-base) | M11 | SH-09 | 30–32 |
| E-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m10r1-mail-inbox-base) | M11 | SH-10 | 34 |
| E-11 | Rail | Search | input | below teamspace header | not observed | seen (m10r1-mail-inbox-base) | Shared shell | SH-11 | 35–36 |
| E-12 | Rail | Sales | group toggle | first module group | not observed | seen (m10r1-mail-inbox-base) | Shared shell | SH-12 | 37 |
| E-13 | Rail | Leads | link | Sales group, first | not observed | seen (m10r1-mail-inbox-base) | M1 | SH-13 | 39–40 |
| E-14 | Rail | Contacts | link | Sales group, second | not observed | seen (m10r1-mail-inbox-base) | M2 | SH-14 | 41–42 |
| E-15 | Rail | Accounts | link | Sales group, third | not observed | seen (m10r1-mail-inbox-base) | M3 | SH-15 | 43–44 |
| E-16 | Rail | Deals | link | Sales group, fourth | not observed | seen (m10r1-mail-inbox-base) | M4 | SH-16 | 45–46 |
| E-17 | Rail | Documents | link | Sales group, fifth | not observed | seen (m10r1-mail-inbox-base) | M9 | SH-17 | 47–48 |
| E-18 | Rail | Campaigns | link | Sales group, sixth | not observed | seen (m10r1-mail-inbox-base) | M7 | SH-18 | 49–50 |
| E-19 | Rail | Activities | group toggle | second module group | not observed | seen (m10r1-mail-inbox-base) | M5 | SH-19 | 51 |
| E-20 | Rail | Tasks | link | Activities group, first | not observed | seen (m10r1-mail-inbox-base) | M5 | SH-20 | 53–54 |
| E-21 | Rail | Meetings | link | Activities group, second | not observed | seen (m10r1-mail-inbox-base) | M5 | SH-21 | 55–56 |
| E-22 | Rail | Calls | link | Activities group, third | not observed | seen (m10r1-mail-inbox-base) | M5 | SH-22 | 57–58 |
| E-23 | Rail | Integrations | group toggle | third module group | not observed | seen (m10r1-mail-inbox-base) | M15 | SH-23 | 59 |
| E-24 | Rail | Visits | link | Integrations group | not observed | seen (m10r1-mail-inbox-base) | M15 | SH-24 | 61–62 |
| E-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m10r1-mail-inbox-base) | P2 | SH-25 | 64–65 |
| E-26 | Rail | Resize handle | separator | rail right edge | not observed | seen (m10r1-mail-inbox-base) | Shared shell | new | 83 |
| E-27 | Top bar | Search records | button | before creation shortcut | not observed | seen (m10r1-mail-inbox-base) | Shared shell | SH-26 | 86 |
| E-28 | Top bar | Plus icon | icon button | after search | not observed | seen (m10r1-mail-inbox-base) | Shared shell | SH-27 | 87 |
| E-29 | Top bar | Assistant shortcut | icon button | after creation shortcut | not observed | seen (m10r1-mail-inbox-base) | P3 | SH-28 | 89 |
| E-30 | Top bar | Notifications | icon button | after assistant | not observed | seen (m10r1-mail-inbox-base) | Shared shell | SH-29 | 90 |
| E-31 | Top bar | Calendar | icon button | after notifications | not observed | seen (m10r1-mail-inbox-base) | M10 | SH-30 | 91–93 |
| E-32 | Top bar | Marketplace | icon button | after calendar | not observed | seen (m10r1-mail-inbox-base) | Shared shell | SH-31 | 94–96 |
| E-33 | Top bar | Setup | icon button | after marketplace | not observed | seen (m10r1-mail-inbox-base) | M11 | SH-32 | 97–99 |
| E-34 | Top bar | Profile | icon button | after setup | not observed | seen (m10r1-mail-inbox-base) | Shared shell | SH-33 | 100–101 |
| E-35 | Top bar | Applications menu | icon button | far right | not observed | seen (m10r1-mail-inbox-base) | Shared shell | SH-34 | 104–107 |
| E-36 | Access dialog | Permission Denied | status heading | dialog top | not observed | seen (m10r1-mail-inbox-base) | Shared shell | new | 122 |
| E-37 | Access dialog | Permission explanation | status text | below heading | not observed | seen (m10r1-mail-inbox-base) | Shared shell | new | 123 |
| E-38 | Access dialog | OK | button | dialog lower right | not observed | seen (m10r1-mail-inbox-base) | Shared shell | new | 124–125 |

### Reconciliation

- 125 raw entries → 38 numbered inventory rows representing 77 raw entries;
  48 entries excluded. Grouping removes 39 duplicate/nested representations.
- Excluded entries: `1, 5–10, 33, 38, 52, 60, 63, 66–82, 84–85, 88,
  102–103, 108–121`. These are navigation/group containers, zero-size hidden
  dialogs/popovers, offscreen rail content (including Products), the empty
  module-title placeholder, and utility-region scaffolding absent from the
  screenshot. They do not establish visible mail controls.
- The utility controls SH-35–SH-46 in Contacts are not visible here and are
  not asserted to exist in this failed state.

### Delta: `m10r1-mail-inbox-retry-base`

| # | Change against base | Source | Contacts ref |
| --- | --- | --- | --- |
| D-01 | None: all 125 control entries are identical to the base; reuse E-01–E-38 | seen (m10r1-mail-inbox-retry-base) | unchanged SH-01–SH-34; new rows unchanged |

The repeat screenshot was inspected. Its reconciliation is also 125 raw entries
→ the same 38 inventory rows (77 represented entries) + 48 excluded entries.
No shell table is repeated.

## Fields

No message or mailbox fields were observed. Metadata has no `Emails` field
export; no sender, recipient, subject, unread, attachment or thread field
contract is inferred. Metadata gap verification belongs to R8.

## Actions and click list

Click list: **empty (0 selectors, 0 clicks)**. Offline selector matching and
`DANGEROUS_TEXT` checks have no candidate to evaluate; no guard exception was
used. The complete base screenshot and controls list were inspected offline.
No row, shell icon, confirmation, navigation group, account switcher, view,
filter or search field was operated. The visible OK button was not clicked.

## Filters / views / sorting / search

| Requested view | Evidence | Contacts ref |
| --- | --- | --- |
| Default inbox | Not reached; access dialog only | new |
| Sent | No direct link exposed in the captured state | new |
| Drafts | No direct link exposed in the captured state | new |
| Scheduled | No direct link exposed in the captured state | new |
| Tracked | No direct link exposed in the captured state | new |

No folder delta capture was possible. Sorting, pagination, selection and bulk
bar behaviour remain unobserved; Contacts list behaviour is not assumed for mail.

## Flows and empty/error states

1. Navigate directly, without clicks, with `--wait 25000`.
2. Observe the access-denied dialog; do not dismiss it.
3. The initial paint gate fails: no mail title, 125 controls (passes the count
   threshold), 26 API calls, and three `pageerror` diagnostics (one reports
   `$L(...).sortable is not a function`, two are opaque objects).
4. The single repeat started at 13:28:41 UTC, more than five minutes after
   the first capture completed at 13:23:29 UTC. It finished at 13:29:14 UTC
   with the same access dialog, 125 identical controls, 26 API entries and
   the same three pageerrors. No failed GET script request was reported in
   either capture, but the pageerrors and missing title fail the paint gate.
5. Stop here: no additional captures, guessed routes, dismissals or attempts
   to repair the reference CRM. The CTO closed this access gap on 2026-10-21;
   the retained evidence is submitted for UI Lead approval as a gap record, not a painted mail-screen
   specification.

The inbox empty state, connected-mailbox state, populated lists, loading and
mail-service error states are not observed. No already-read message can be
identified for R2. After R1 approval, R2 proceeds documentation-only with
the gap recorded and no mail-area captures. R3 record-detail related-list
captures remain within their separately approved scope.

## Request safety ledger (paths and counts only)

No request payload, response shape or customer value is recorded here.
`network.json` contains 26 API entries, all GET. `meta.json.blockedRequests`
contains the following refused attempts, each once:

| Method | Path (host omitted) | Count | Result |
| --- | --- | --- | --- |
| POST | `/crm/<org>/ActivityReminder.do` | 1 | blocked, reminder poll |
| POST | `/murphy/:id/ingest/exceptions` | 1 | blocked, telemetry |
| POST | `/murphy/:id/telemetry/urlMonitor` | 1 | blocked, telemetry |

These three refused attempts form the base non-GET ledger. The repeat has
exactly the same paths and counts, with no excess or new non-GET request.
The repeat's 26 API entries are also all GET. No refused endpoint was directly
retried; the sole repeat was the plan-authorized whole-page paint probe. No mailbox-sync path appears. Because no mail
list loaded, this does **not** establish whether a real list load starts sync.
No popup, download, file chooser, print or window-open action was recorded.

## Write-only flows

No write was attempted. Existing [write-only flows](../module-10-write-only-flows.md)
cover compose/send (W1), drafts (W3), scheduled send (W4), connection (W7), sync
(W8) and tracking (W12). No new write-only flow was discovered in this probe.

## Open questions

1. Which role/license enables the mail area? R9 must answer from public
   documentation only; no permission, setting, connection or session change.
2. Which sent/draft/scheduled/tracked list views are available, and what are
   their documented behaviours? R9 must record documentation-only evidence.
3. Does a real list load trigger synchronization, and at which documented
   path? No mail list loaded; R9 must use public documentation only and leave
   undocumented details open, without triggering sync.
4. What does the inbox show with no connected mailbox? Not observed; R9 may
   describe documented behaviour, retaining any remaining visual gap. The
   access-denied dialog must not substitute for this empty state.

These follow-ups are recorded in the R9 scope note in
[write-only flows](../module-10-write-only-flows.md#6-r9-documentation-only-follow-up-from-r1).
The route/access question is closed by the CTO decision; no new route is to
be explored. R2 has no already-read message evidence and proceeds only with
public documentation and a gap record after R1 approval.

## Capture refs

- `m10r1-mail-inbox-base` — click-free `/crm/<org>/tab/Emails`, `--wait 25000`;
  screenshot inspected; controls, diagnostics, blocked requests and network
  method ledger checked. Initial paint gate failed.

- `m10r1-mail-inbox-retry-base` — same click-free path and wait; the only
  five-minute paint-gate repeat. Screenshot inspected, full controls array
  compared equal, blocked paths/counts unchanged, paint gate failed again.

## Verification

- `research/specs/verify.mjs` is absent; no application test suite was run for
  this documentation-only change.
- Offline assertions check required sections, 38 inventory rows, 125 = 77
  represented + 48 excluded entries, repeat-array equality, empty click lists,
  unchanged blocked-request counts and GET-only network entries.
- `git diff --check` passes. Neutral-content scan checks no absolute local
  path, account identifier, address or external URL enters this spec.

Captures remain in the local research workspace. No screenshots or customer
content are copied into the repository.

## R9 — documentation-based answers (MEP-1302)

Checked 2026-10-24. Public first-party help only; no capture, mailbox access,
message opening, synchronization, connection or preference change. Earlier
observations and access-gap disposition remain valid. The numbered items below
are proposals for UI Lead review, all **documented, not observed**. They do not
certify the current installation or delivered implementation.

### Public source register

Titles are neutralized; product names and hosts are omitted deliberately.
Locate each in the first-party help knowledge base by the breadcrumb and
article topic below. Pages were read, not just search summaries.

| Ref | Neutral page title / topic locator | Sections used |
| --- | --- | --- |
| E-D1 | CRM › sales email client › Getting started › Your sales-focused email client | Permissions and Availability; Configuration; Accessing; Folders and Labels |
| E-D2 | CRM › sales email client › Emails › Compose, Organize and Configure Emails | Compose an email; Add response reminder; Schedule Emails |
| E-D3 | CRM › sales email client › Emails › Email Views and Email Sentiment | Access Email Views; default-view notes |
| E-D4 | CRM › Troubleshooting › Troubleshooting the sales email client | Missing emails; deleted thread still visible |
| E-D5 | CRM › Connect with customers › Email › User functions › Configuring Email Compose Setting | While composing an email; Schedule the email |
| E-D6 | CRM › Customize CRM account › Record-level customization › Customizing Record's Detail Page | Customize an individual related list › Emails |

### Question dispositions and implementation consequences

| Original question | Verdict | Documentation answer / remaining gap | Implementation consequence |
| --- | --- | --- | --- |
| 1 — Role/license | Partly answered | E-D1 specifies Enterprise or above, profile-level Email Integration permission, and completed IMAP/POP3 setup. Any profile type can configure it; administrators can restrict module access. The tab appears after configuration. This does not identify which prerequisite failed for the capture user or prove the denied route is this documented client. | ED01: keep entitlement, profile authorization and connection state distinct; no administrator-only assumption or invented route. |
| 2 — Sent/draft/scheduled/tracked lists | Partly answered | E-D1 names Inbox, Drafts and Sent. E-D2 explicitly locates queued messages in a Scheduled folder and permits editing there; editing without saving can prevent delivery and produce a failure notice. Save draft and sent-message response reminders are documented. E-D3 describes statistical views, not a folder literally named Tracked. Exact columns, ordering, pagination and current visual layout remain unknown. | ED02–ED05 define capability proposals; no unseen folder layout or tracking folder is certified. |
| 3 — List-load synchronization / path | Still open for trigger and path | E-D4 describes mapped folders and asynchronous delays: messages commonly take 3–6 minutes; deletion propagation can take about 10 minutes. It supplies neither an HTTP sync endpoint nor proof that opening a list initiates sync. These are troubleshooting estimates, not a service-level guarantee. | ED06: list reads must not implicitly connect or start synchronization based on this research. Provider execution remains under its separately approved contract; invent no reference endpoint. |
| 4 — No connected mailbox | Partly answered | E-D1 documents setup before tab availability, but no exact disconnected inbox illustration, text, CTA or redirect. It does not document an accessible empty message list without setup. An authorized-but-empty folder is another state. | ED07: retain disconnected, empty and access-denied states separately; existing fixture UI is an implementation choice pending visual evidence. Never reuse the access dialog as proof of the disconnected design. |

### Proposed capability items — documented, not observed

| # | Proposal and source | Boundary |
| --- | --- | --- |
| ED01 | Entitlement/profile/connection prerequisites (E-D1; question 1) | Local account diagnosis and exact denied-screen mapping remain open. |
| ED02 | Separate Sent and Drafts capabilities (E-D1/E-D2) | Resuming or discarding drafts is a write path; no editor was opened. |
| ED03 | Scheduled capability (E-D2); record Emails also includes scheduled mail (E-D6) | Inbox Scheduled folder and record Scheduled scope are different surfaces; exact list parity remains open. |
| ED04 | Statistical views (E-D3): Unread = incoming unread; Unopened = outgoing not opened; Not Responded = outgoing opened without response; Not Replied = incoming read without reply; All Messages = all statuses | Views cannot be deleted/customized. Unread and All Messages remain when Email Insights is disabled; other listed statistical views depend on it. A missing tracking event is not evidence of an unopened message. |
| ED05 | Draft ownership and scheduled permissions (E-D5): minimizing compose saves a record-related draft; owner resumes editing, others see a reader with Edit only when permitted; scheduled edit/delete follows email sharing | Exact autosave timing and permission evaluation remain unobserved. E-D6 documents related-list subject, sentiment, emotions, intent, date, source, sender and delivery status; those are not certified inbox columns. |
| ED06 | Asynchronous mail propagation (E-D4; question 3) | No list-load trigger, sync method/path, retry or polling contract established. |
| ED07 | Setup prerequisite and distinct disconnected state (E-D1; question 4) | No exact empty-state design established; do not connect to resolve it. |

### R9 verification and retained questions

Documentation coverage answers the capability questions only. Remaining gate
questions: deployed entitlement/route mapping, exact folder UI, tracking-view
placement, list-load sync semantics/endpoint and no-mailbox visual state.
W3/W4/W7/W8/W12/W19 restrictions remain unchanged. No public page authorizes a
reference experiment. Checks: question coverage and unique ED IDs, source-row
cross-references, relative links, `git diff --check` and forbidden-term hook.
No application tests are required for these Markdown-only changes.
