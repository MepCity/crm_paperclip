# Email and calendar — rule, assignment and notification check

Status: M10-R10 / MEP-1016. Evidence date: 2026-10-22 UTC.
Both permitted captures fail the paint gate; research stopped after the single
retry. Further capture requires a reviewed continuation.

**Incomplete safety check: no test write is cleared by this document.**
Approval: CTO; feeds ADR 0009 Topic 8 and the night-test protocol section 4.2.

## Purpose

Check existing automation and notification exposure before any proposed write.
The reference CRM remains strictly read-only. No rule, editor, record, toggle,
notification item or preferences control was opened or operated.
Unknown exposure counts as **yes** for the matching write-test gate.
This is a gap record, not an implementation-ready automation specification.

## Layout and paint gate

The click-free workflow-rules route shows the settings rail and shared top bar.
The main content area is blank: no workflow heading, module selector, rule table,
empty-state message or error panel is visible. Blank content does not establish
that there are no rules. The utility strip is absent from this screenshot.
The rail shows Frequently Used, General and Security Control; automation links
exist in the exported DOM below the viewport, without proving a loaded list.

The base has 285 controls and 30 API calls. The title-presence gate fails and
page errors are present: an unavailable messaging integration property, missing
sortable-parent state, and a JSON parse/model resolution failure on the workflow
route. Script-load counters report zero failed scripts. These counters do not
override the page errors or missing workflow heading. There is no earlier
comparable workflow-list base to establish an API-call ratio; no ratio is invented.
There is no visible record link. Whether the underlying list contains data is unknown.

## Control inventory

Every row has behaviour **not observed**; only resting presence is evidenced by
screenshot inspection and controls.json. Raw entries are one-based. Nested
representations share one logical row. Contacts references use
[contacts.md](contacts.md). Settings controls are new relative to that rail.
User-facing vendor labels are described functionally.

| # | Region | Control | Type | Position | Behaviour | Source | Module | Contacts ref | Raw entries |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R-01 | Setup rail | Back arrow | icon button | header left | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 3 |
| R-02 | Setup rail | Setup Home | link | header | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 4, 5 |
| R-03 | Setup rail | Setup customization | icon link | header right | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 6, 7 |
| R-04 | Setup rail | Search | input | below header | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 8, 9 |
| R-05 | Setup rail | Frequently Used | expanded group | above shortcut | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 10, 11 |
| R-06 | Setup rail | Profiles shortcut | link | Frequently Used group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 13, 14 |
| R-07 | Setup rail | General | expanded group | above general links | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 15, 16 |
| R-08 | Setup rail | Personal Settings | link | General group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 18, 19 |
| R-09 | Setup rail | Users | link | General group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 20, 21 |
| R-10 | Setup rail | Company Settings | link | General group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 22, 23 |
| R-11 | Setup rail | Calendar Booking | link | General group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 24, 25 |
| R-12 | Setup rail | Motivator | link | General group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 26, 27 |
| R-13 | Setup rail | Agents | link | General group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 28, 29 |
| R-14 | Setup rail | Security Control | expanded group | above security links | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 30, 31 |
| R-15 | Setup rail | Profiles | navigation item | Security Control group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 33, 34 |
| R-16 | Setup rail | Roles and Sharing | navigation item | Security Control group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 35, 36 |
| R-17 | Setup rail | Mail add-on users | navigation item | Security Control group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 37, 38 |
| R-18 | Setup rail | Compliance Settings | navigation item | Security Control group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 39, 40 |
| R-19 | Setup rail | Territory Management | navigation item | Security Control group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 41, 42 |
| R-20 | Setup rail | Trusted Domain | navigation item | Security Control group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 43, 44 |
| R-21 | Setup rail | Support Access | navigation item | Security Control group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 45, 46 |
| R-22 | Setup rail | Single sign-on | navigation item | Security Control group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 47 |
| R-23 | Setup rail | Security Policies | navigation item | Security Control group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 48 |
| R-24 | Setup rail | Directory sync | navigation item | Security Control group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 49 |
| R-25 | Setup rail | Login History | navigation item | Security Control group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 50 |
| R-26 | Setup rail | Audit Log | navigation item | Security Control group | not observed | seen (m10r10-workflow-rules-base) | M11 | new | 51, 52 |
| R-27 | Top bar | Search records | control | right-side shell toolbar | not observed | seen (m10r10-workflow-rules-base) | Shared shell | SH-26 | 234 |
| R-28 | Top bar | Plus icon | control | right-side shell toolbar | not observed | seen (m10r10-workflow-rules-base) | Shared shell | SH-27 | 235 |
| R-29 | Top bar | Assistant shortcut | control | right-side shell toolbar | not observed | seen (m10r10-workflow-rules-base) | Shared shell | SH-28 | 237 |
| R-30 | Top bar | Notifications | control | right-side shell toolbar | not observed | seen (m10r10-workflow-rules-base) | Shared shell | SH-29 | 238 |
| R-31 | Top bar | Calendar | control | right-side shell toolbar | not observed | seen (m10r10-workflow-rules-base) | Shared shell | SH-30 | 239 |
| R-32 | Top bar | Marketplace | control | right-side shell toolbar | not observed | seen (m10r10-workflow-rules-base) | Shared shell | SH-31 | 242 |
| R-33 | Top bar | Setup | control | right-side shell toolbar | not observed | seen (m10r10-workflow-rules-base) | Shared shell | SH-32 | 245 |
| R-34 | Top bar | Profile | control | right-side shell toolbar | not observed | seen (m10r10-workflow-rules-base) | Shared shell | SH-33 | 248, 249 |
| R-35 | Top bar | Applications menu | control | right-side shell toolbar | not observed | seen (m10r10-workflow-rules-base) | Shared shell | SH-34 | 252, 253, 254, 255 |

Reconciliation: **285 raw entries → 35 inventory rows using 60 raw entries;
225 excluded raw entries**. Exclusions are 1–2, 12, 17, 32, 53–233, 236,
240–241, 243–244, 246–247, 250–251 and 256–285: parent containers, rail links
below the viewport, hidden dialogs, zero-height content, loading scaffolding and
extra scroll containers. The main content adds zero visible controls. No bottom
utility control is inferred from other screens.

### Delta: m10r10-workflow-rules-retry-base

| # | Difference against base | Source | Contacts ref |
| --- | --- | --- | --- |
| D-01 | Visible controls unchanged: reuse R-01–R-35 | seen (m10r10-workflow-rules-retry-base) | unchanged base references |
| D-02 | Hidden loader position changes; hidden modal/hovercard entries 270–272 reorder | controls.json; all remain excluded | new diagnostic scaffolding only |
| D-03 | Thin loading indicator remains visible along the upper edge; main content stays blank | screenshot inspected | new; no control |

Retry reconciliation: **285 raw entries → 35 inventory rows using 60 raw entries;
225 excluded**. Mapped entries are identical. Excluded set is unchanged; differences
are only raw 258 and 270–272. There is no new module control or rule row.

## Fields, filters and actions

Rule names, modules, triggers, action types, recipient roles and active states
are not visible. No module filter, search, sort, pagination or rule editor was
used. Shell search and rail search are drawn but not operated. No rule name or
customer value is copied. There is no observed empty-state or validation flow.

Click list: **empty (0 selectors, 0 clicks)**. Offline selector matching and
DANGEROUS_TEXT review have zero candidates. No allow-open, toggle, ready-timeout,
scroll or hover option was used. The workflow base route was taken from the
existing local settings-link capture, not guessed. Other routes were not probed
while the paint gate was unresolved.

## Exposure register

Rows are unverified categories, **not observed configured rules**. Unknown in
any risk-bearing column prevents a no-risk conclusion. Recipient roles listed
in scope are owner, team, follower or named user; none is established by this
capture. No identity or address is recorded.

| # | Rule or setting category | Module scope to check | Trigger | Action type | Recipient role | Active? | Could fire on a test write (yes/no/unknown) | Gate / evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| E-01 | Workflow rules | All modules; Emails, Events, Leads, Contacts, Accounts, Deals and Cases first | unknown (create/edit/field/date not established) | unknown | unknown | unknown | unknown | Treat as yes; workflow list did not paint |
| E-02 | Assignment rules | All supported modules, not enumerated | unknown | unknown | unknown | unknown | unknown | Treat as yes; list not captured; metadata null |
| E-03 | Owner notifications | All affected modules, not enumerated | unknown | unknown | unknown | unknown | unknown | Treat as yes; settings not captured |
| E-04 | Mention and follower notifications | All affected modules, not enumerated | unknown | unknown | unknown | unknown | unknown | Treat as yes; settings not captured |
| E-05 | Reminder mail | Events and other supported activities, not enumerated | unknown | unknown | unknown | unknown | unknown | Treat as yes; blocked shell reminder poll proves no configuration |
| E-06 | Email alerts | All supported modules, not enumerated | unknown | unknown | unknown | unknown | unknown | Treat as yes; action list not captured |
| E-07 | Scheduled actions / schedules | All supported modules, not enumerated | unknown | unknown | unknown | unknown | unknown | Treat as yes; lists not captured |
| E-08 | Approval processes | All supported modules, not enumerated | unknown | unknown | unknown | unknown | unknown | Treat as yes; list not captured |
| E-09 | Auto-response / auto-reply rules | All supported modules, not enumerated | unknown | unknown | unknown | unknown | unknown | Treat as yes; list not captured |

Local metadata cross-check: workflow_rules.json is an API_NOT_SUPPORTED error
object (400), and assignment_rules.json is null. Neither proves absence or
inactivity. See [email-calendar-metadata.md](email-calendar-metadata.md), section 6.
No API workaround or editor inspection is authorized by this gap.

## Request baseline and read-only audit

Base network.json has no non-GET entries. meta.json separately records four
blocked POST attempts caused by the page load. These are the baseline, not
successfully performed writes:

| Method | Neutral path | Blocked count | Category |
| --- | --- | --- | --- |
| POST | /crm/<org>/ActivityReminder.do | 1 | legacy reminder poll (showreminder) |
| POST | /murphy/:id/telemetry/urlMonitor | 2 | telemetry |
| POST | /murphy/:id/ingest/exceptions | 1 | telemetry |

Query values and hostnames are omitted. No blocked request was replayed or
manually retried. No file chooser, download, print, popup, click or automatic
Escape is recorded. Tool exit code: 0; this does not mean the paint gate passed.

### Retry outcome and stopping point

Retry started at 19:58:52 UTC, more than five minutes after the base was written.
Both runs use --wait 25000 and exit 0. Retry has 30 API calls, 285 controls,
the same four page errors, and the same four blocked POSTs (identical path/count
multiset). Both network.json files contain no non-GET entries. No unexpected
non-GET path or excess count was found. This is a paint-gate stop, not evidence
that a write occurred. No third capture, alternative route or rule editor was
attempted. Tool cleanup completed normally for both runs.

Remaining research after reviewed restoration: workflow lists across all modules
(with the seven priority modules first), assignment lists, owner/mention/follower
and reminder settings, email alerts, scheduled actions, approval lists and
response rules. Only named read-only navigation or click-free direct paths are
permitted; base capture, offline selector checks, per-base request accounting,
inventory and unknown-as-yes rules still apply. No configuration change is a
valid recovery action.

## Write-only flows and open questions

See [the write-only flow register](../module-10-write-only-flows.md), R10 addendum.
Creating/editing a record to observe automation, testing assignment, invoking an
approval or auto-response, sending a test alert, or waiting for a newly scheduled
action to fire are not performed. Public documentation can explain possible
triggers, but cannot identify this environment's enabled rules or recipients.

1. Can the workflow list be rendered through the existing capture/session
   without any preference, rule, permission, account or browser-session change?
2. Once read-only rendering is restored, which configured rules are active for
   each module, and what triggers, actions and recipient roles does each list
   expose without opening an editor?
3. Can the remaining categories be inspected as read-only lists? If a list
   cannot establish recipient roles, the matching write remains gated unknown.
4. CTO must review the residual exposure before relying on this check in ADR
   0009 Topic 8. No row currently supports a safe test-write conclusion.

## Capture refs

- m10r10-workflow-rules-base — click-free /crm/<org>/settings/workflow-rules,
  --wait 25000; captured 2026-10-22T19:53:37.424Z; screenshot inspected.
- m10r10-workflow-rules-retry-base — same click-free route and wait;
  captured 2026-10-22T19:59:47.404Z; screenshot inspected; paint gate failed.
- Route discovery only: m10r7-email-templates-base, settings rail href for
  Workflow Rules. Its template data and inventory are not reused here.
