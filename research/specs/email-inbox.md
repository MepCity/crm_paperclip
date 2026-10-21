# Email inbox — list research and access evidence

Status: blocked; both click-free probes failed the paint gate and showed an
access-denied dialog. CTO access/route decision is required before continuation.
Issue: MEP-1010 / M10-R1. Research date: 2026-10-21.

## Purpose

Describe the default mail folder and directly exposed sent, draft, scheduled
and tracked lists, without opening a message or changing any state. Follow
[module-10-email-calendar-research-plan.md](../module-10-email-calendar-research-plan.md),
section 4.1. This document currently records an access failure, not an inbox
implementation contract.

## Layout and observed state

A click-free probe of `/crm/<org>/tab/Emails` showed the application shell and
an access-denied dialog over an empty content region. The screenshot was
inspected. The dialog contains a heading, a short explanation about insufficient
permissions and contacting an administrator, and an OK button. OK was never
clicked (confirmation/dismissal controls are forbidden).

No mail module title, mailbox selector, folder pane, message list or utility
strip is visible. This is **not evidence of an unconnected mailbox**. Whether
this path is the correct mail-area entry point remains unverified; neither a
missing feature nor missing user permissions can be concluded from this probe.
No alternate route or folder query was invented.

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
   to repair the reference CRM. This is incomplete research, not a skeleton
   submitted as a completed mail-screen specification.

The inbox empty state, connected-mailbox state, populated lists, loading and
mail-service error states are not observed. No already-read message can be
identified for R2; R2 must not open a message on this evidence.

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

1. What is the correct existing mail-area entry path available to this session?
   Is the access dialog caused by the route, feature availability or permission?
   An authorized owner must establish this without changing reference settings.
2. What does the inbox show with no connected mailbox? Not observed; do not
   substitute the access-denied dialog for that empty state.
3. Which sent/draft/scheduled/tracked lists expose direct read-only links?
4. Does actual inbox navigation invoke sync, and at which path? No mail list
   load was observed; no conclusion about synchronization is possible.
5. R2 has no evidence of an unambiguously already-read message. Keep message
   opening prohibited until adequate read-state evidence exists.

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
