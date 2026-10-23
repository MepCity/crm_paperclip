# Email and mailbox settings — read-only research

Status: blocked on MEP-1160 after a new responded BCC settings POST.
MEP-1051 accepted the original three runtime errors as the R5 baseline.
Resting-page observations only; write and setup states remain explicit gaps.
Issue: MEP-1014. Observed 2026-10-22 and 2026-10-23 (local dates).

## Purpose and scope

Describe email settings reachable through direct navigation or named settings
links under section 4.5 of the
[approved research plan](../module-10-email-calendar-research-plan.md).
The later sequencing decision allows R5 independently of R4. MEP-1051 later accepts only the three known runtime errors for R5; the
stop rule and read-only restriction remain unchanged.

The entry route was established from the Email link in the retained `m6-setup`
controls. A new click-free capture of `/crm/<org>/settings/email-configuration`
landed on `/crm/<org>/settings/email-configuration/email-compose-settings`.
No alternate mail-area entry, permission change or mailbox connection was tried.

## Layout (provisional observation)

Setup navigation occupies the left rail; the current Email item is highlighted
under Channels. The top shell has record search and utility icons. A main card
has email-area tabs, a second configuration tab row, the Compose Settings
heading, help entry and a vertically arranged form. A utility strip remains at
the bottom. The form shows four closed selectors, a static sample preview and
an Email Signature row with an Add New Signature entry. Values identifying a
person or address are deliberately omitted.

This is partial visual evidence despite visible content: runtime errors fail
the required paint gate. In particular, an email-signature model-processing
error means the Add New Signature row cannot prove there are no saved signatures.
No empty/error/loading state for a correctly loaded settings page is established.

## Control inventory

Presence source for every base row: `seen (m10r5-email-settings-base)`.
Behaviour for every row is **not clicked / not observed**. Nested wrappers for
one control share a row. Entry numbers below are one-based `controls.json`
indices. Contacts references point to [contacts.md](contacts.md); `new` means
no matching Contacts inventory row, not proof of an email-only feature.
Labels are neutralized where necessary. Positions are descriptive, not measurements.

| # | Region | Control | Type | Position | Behaviour | Owner | Contacts ref | Control entries |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ES-01 | Setup rail | Back arrow | icon button | header, before Setup Home | not clicked | Shared setup | new | 3 |
| ES-02 | Setup rail | Setup Home | link | header | not clicked | Shared setup | new | 4–5 |
| ES-03 | Setup rail | Customize setup icon | icon link | header, after Setup Home | not clicked | Shared setup | new | 6–7 |
| ES-04 | Setup rail | Search settings | search input | below rail header | not clicked | Shared setup | new | 8–9 |
| ES-05 | Setup rail | Mail add-on users | navigation link | visible rail order | not clicked | Shared setup | new | 37–38 |
| ES-06 | Setup rail | Compliance Settings | navigation link | visible rail order | not clicked | Shared setup | new | 39–40 |
| ES-07 | Setup rail | Territory Management | navigation link | visible rail order | not clicked | Shared setup | new | 41–42 |
| ES-08 | Setup rail | Trusted Domain | navigation link | visible rail order | not clicked | Shared setup | new | 43–44 |
| ES-09 | Setup rail | Support Access | navigation link | visible rail order | not clicked | Shared setup | new | 45–46 |
| ES-10 | Setup rail | Single Sign-On | navigation link | visible rail order | not clicked | Shared setup | new | 47 |
| ES-11 | Setup rail | Security Policies | navigation link | visible rail order | not clicked | Shared setup | new | 48 |
| ES-12 | Setup rail | Active Directory Sync | navigation link | visible rail order | not clicked | Shared setup | new | 49 |
| ES-13 | Setup rail | Login History | navigation link | visible rail order | not clicked | Shared setup | new | 50 |
| ES-14 | Setup rail | Audit Log | navigation link | visible rail order | not clicked | Shared setup | new | 51–52 |
| ES-15 | Setup rail | Channels | group toggle | visible rail order | not clicked | Shared setup | new | 53–54 |
| ES-16 | Setup rail | Email | navigation link | visible rail order | not clicked | Shared setup | new | 56–57 |
| ES-17 | Setup rail | Telephony | navigation link | visible rail order | not clicked | Shared setup | new | 58–59 |
| ES-18 | Setup rail | Business Messaging | navigation link | visible rail order | not clicked | Shared setup | new | 60–61 |
| ES-19 | Setup rail | Notification SMS | navigation link | visible rail order | not clicked | Shared setup | new | 62–63 |
| ES-20 | Setup rail | Webforms | navigation link | visible rail order | not clicked | Shared setup | new | 64–65 |
| ES-21 | Setup rail | Social | navigation link | visible rail order | not clicked | Shared setup | new | 66–67 |
| ES-22 | Setup rail | Chat | navigation link | visible rail order | not clicked | Shared setup | new | 68–69 |
| ES-23 | Setup rail | Portals | navigation link | visible rail order | not clicked | Shared setup | new | 70–71 |
| ES-24 | Setup rail | Customization | group toggle | visible rail order | not clicked | Shared setup | new | 72–73 |
| ES-25 | Setup rail | Modules and Fields | navigation link | visible rail order | not clicked | Shared setup | new | 75–76 |
| ES-26 | Setup rail | Pipelines | navigation link | visible rail order | not clicked | Shared setup | new | 77–78 |
| ES-27 | Setup rail | Wizards (partially visible) | navigation link | visible rail order | not clicked | Shared setup | new | 79–80 |
| ES-28 | Top bar | Search records | button | right group, in displayed order | not clicked | Shared shell | SH-26 | 234 |
| ES-29 | Top bar | Creation shortcut | button | right group, in displayed order | not clicked | Shared shell | SH-27 | 235 |
| ES-30 | Top bar | Assistant shortcut | button | right group, in displayed order | not clicked | Shared shell | SH-28 | 237 |
| ES-31 | Top bar | Notifications | button | right group, in displayed order | not clicked | Shared shell | SH-29 | 238 |
| ES-32 | Top bar | Calendar | button | right group, in displayed order | not clicked | Shared shell | SH-30 | 239 |
| ES-33 | Top bar | Marketplace | button | right group, in displayed order | not clicked | Shared shell | SH-31 | 242 |
| ES-34 | Top bar | Setup | button | right group, in displayed order | not clicked | Shared shell | SH-32 | 245 |
| ES-35 | Top bar | Profile | button | right group, in displayed order | not clicked | Shared shell | SH-33 | 248–249 |
| ES-36 | Top bar | Applications menu | button | right group, in displayed order | not clicked | Shared shell | SH-34 | 252–255 |
| ES-37 | Email area | Email Configuration | navigation tab | top tab row, in displayed order | not clicked | M10 | new | 258–260 |
| ES-38 | Email area | Email Parser | navigation tab | top tab row, in displayed order | not clicked | M10 | new | 261–263 |
| ES-39 | Email area | BCC Dropbox | navigation tab | top tab row, in displayed order | not clicked | M10 | new | 264–266 |
| ES-40 | Email area | Email Deliverability | navigation tab | top tab row, in displayed order | not clicked | M10 | new | 267–269 |
| ES-41 | Email area | Email Intelligence | navigation tab | top tab row, in displayed order | not clicked | M10 | new | 270–272 |
| ES-42 | Email area | Unsubscribe Link | navigation tab | top tab row, in displayed order | not clicked | M10 | new | 273–275 |
| ES-43 | Email configuration | Compose | navigation tab | second tab row, in displayed order | not clicked | M10 | new | 276–277 |
| ES-44 | Email configuration | Email | navigation tab | second tab row, in displayed order | not clicked | M10 | new | 278–279 |
| ES-45 | Email configuration | Email Sharing | navigation tab | second tab row, in displayed order | not clicked | M10 | new | 280–281 |
| ES-46 | Email configuration | Organization Emails | navigation tab | second tab row, in displayed order | not clicked | M10 | new | 282–283 |
| ES-47 | Email configuration | Custom Email Fields | navigation tab | second tab row, in displayed order | not clicked | M10 | new | 284–285 |
| ES-48 | Compose settings | Default Font Family | closed select | form, in displayed order | not clicked | M10 | new | 290–291 |
| ES-49 | Compose settings | Default Font Size | closed select | form, in displayed order | not clicked | M10 | new | 292–293 |
| ES-50 | Compose settings | Default From Address | closed select | form, in displayed order | not clicked | M10 | new | 294–295 |
| ES-51 | Compose settings | Default Reply-To Address | closed select | form, in displayed order | not clicked | M10 | new | 296–297 |
| ES-52 | Compose settings | Font family information icon | icon | beside family selector | not clicked | M10 | new | 328 |
| ES-53 | Compose settings | Add New Signature | action link | Email Signature row | not clicked | M10 | new | 298 |
| ES-54 | Utility strip | My Pins | button | bottom strip, in displayed order | not clicked | Shared shell | SH-35 | 317 |
| ES-55 | Utility strip | Chats | button | bottom strip, in displayed order | not clicked | Shared shell | SH-36 | 318 |
| ES-56 | Utility strip | Contacts | button | bottom strip, in displayed order | not clicked | Shared shell | SH-37 | 319 |
| ES-57 | Utility strip | Command/document shortcut | button | bottom strip, in displayed order | not clicked | Shared shell | SH-38 | 320 |
| ES-58 | Utility strip | Announcements | button | bottom strip, in displayed order | not clicked | Shared shell | SH-39 | 321 |
| ES-59 | Utility strip | Motivator | button | bottom strip, in displayed order | not clicked | Shared shell | SH-40 | 322 |
| ES-60 | Utility strip | Sticky Notes | button | bottom strip, in displayed order | not clicked | Shared shell | SH-41 | 323 |
| ES-61 | Utility strip | Activity Reminders | button | bottom strip, in displayed order | not clicked | Shared shell | SH-42 | 324 |
| ES-62 | Utility strip | Recent Items | button | bottom strip, in displayed order | not clicked | Shared shell | SH-43 | 325 |
| ES-63 | Utility strip | Accessibility | button | bottom strip, in displayed order | not clicked | Shared shell | SH-44 | 326 |
| ES-64 | Utility strip | Help | button | bottom strip, in displayed order | not clicked | Shared shell | SH-45 | 327 |

Additional screenshot-only controls: **ES-65**, Compose Settings Help,
at the right of the heading; help link; owner M10; Contacts ref `new`;
`not clicked`. No corresponding interactive entry was collected. This is
separate from the bottom-strip Help entry. **ES-66**, the far-right utility
trash-bin icon after Help, matches Contacts `SH-46`; owner Shared shell;
`not clicked`; no corresponding interactive entry was collected. Static labels, the descriptive
paragraph and sample-preview text are not interactive controls.

### Base reconciliation

- `controls.json`: 344 entries → 64 indexed inventory rows plus two
  screenshot-only rows = 66 visible controls.
- 111 entries assigned; 47 duplicate/nested representations collapsed;
  233 entries excluded. Arithmetic: 64 + 47 + 233 = 344.
- Excluded indices: `1–2, 10–36, 55, 74, 81–233, 236, 240–241, 243–244, 246–247, 250–251, 256–257, 286–289, 299–316, 329–344`.
- Exclusions are navigation/group wrappers, offscreen or clipped rail entries,
  zero-size links/dialogs/popovers, body/scroll containers and inactive UI
  scaffolding. Rail items concealed behind the fixed setup header are not
  asserted visible merely because their boxes overlap the viewport.
- The information icon is inventoried but unnamed and never clicked. The
  Preview area is static. No shell or setup preference was changed.

### Retry delta: `m10r5-email-settings-retry-base`

| # | Change against base | Source | Contacts ref |
| --- | --- | --- | --- |
| D-01 | No new or removed visible control. Reuse ES-01–ES-66. Field alignment and Reply-To label wrapping differ in the screenshot; no behaviour inference. | seen (retry) | same as base |
| D-02 | Indices 312–314 reorder the same hidden modal/hovercard scaffolding. All remain excluded; this is not a visible dialog. | controls (retry) | new; hidden |

Retry reconciliation: 344 entries → 64 indexed inventory rows plus two
screenshot-only controls = 66 controls; 111 assigned entries, 47 collapsed
representations, 233 excluded. Assigned indices and exclusion set match the
base. Both screenshots were inspected; no assertion that files are identical.

## Fields and actions

| Field/action | Observed structure | Interaction and limit |
| --- | --- | --- |
| Default Font Family | Closed selector with a selected value and adjacent information icon | not clicked; choices and persistence unobserved |
| Default Font Size | Closed selector | not clicked; choices unobserved; no typography measurement recorded |
| Preview | Read-only sample display below the font selectors | no input or preview interaction attempted |
| Default From Address | Closed selector displaying identity/address content | not clicked; no identity or address retained |
| Default Reply-To Address | Closed selector displaying identity/address content | not clicked; no identity or address retained |
| Email Signature | Add New Signature entry | not clicked; no editor opened; existing-signature state unreliable due to model error |
| Help | Heading and bottom-strip entries | not clicked |

The form controls are on the resting settings page; no settings editor was
opened as an action. There is no observed Save/Cancel control in the visible
form. This does not establish auto-save behaviour. Validation, save results,
font-menu contents and signature editing require further evidence; no change
is attempted to discover them.

## Filters, views, sorting and search

Setup search and record search are present but unused. No text was typed,
filter applied, tab selected or view preference changed. The selected Compose
tab was the route's resting state, not a user-selected preference in this run.

## Navigation coverage and remaining gaps

| Surface | Evidence | Limit / next evidence needed |
| --- | --- | --- |
| Compose / signatures | Partial resting form above | Failed paint gate; signature list cannot be trusted |
| Connected mailbox settings | Email subtab link present | not clicked; mailbox/provider/connection state unobserved |
| Email Sharing | Named subtab link present | not clicked; permissions and sharing form unobserved |
| Organization Emails | Named subtab link present | not clicked; no addresses retained |
| Custom Email Fields | Named subtab link present | not clicked; field preferences unobserved |
| Email Deliverability | Named top-level link present | not clicked; notes and limits unobserved |
| Email Intelligence / tracking | Named top-level link present | not clicked; cannot infer tracking switches from tab name |
| Unsubscribe Link | Named top-level link present | not clicked; configuration and limits unobserved |
| Email Parser / BCC Dropbox | Named top-level links present | not clicked; inbound processing/forwarding behaviour unobserved |
| Incoming/outgoing rules, forwarding, disclaimers, limits | No dedicated form observed | Do not infer absence; follow-up after paint/access decision |

## Click list and safety check

Executed click list: `[]`. No hover, scroll, keypress, field, toggle, search or
navigation click was executed. Offline selector matching and dangerous-text
checks are **vacuously passing for the empty list**; no candidate is declared
approved for a future run. The screenshot and controls were inspected offline.
Named links are inventory evidence only. No exception flag was used.

## Flows and paint gate

1. Verify no other capture command is running (only the serve process).
2. Navigate to the settings route, without clicks, with `--wait 25000`.
3. Base: Compose Settings heading present; 344 controls; 51 API entries.
   No earlier equivalent settings base establishes an API-count threshold.
   Record/message links are not required on this settings screen.
4. Diagnostics contain two page errors: `Cannot read properties of undefined
   (reading '_sortableParentData')` and `ZBluePencil is not defined`.
   No JavaScript GET request failure was recorded. An additional console error
   reports invalid email-signature model data. Thus the paint gate **fails**.
5. After more than five minutes (base completed 22:00:43 UTC; retry started
   22:05:55 UTC), run the single identical click-free retry, `--wait 25000`.
6. Retry: heading present, 344 controls, 51 API entries (above half of base);
   the same two page errors and signature-model console error persist. No
   failed JavaScript GET is recorded. The paint gate **fails again**.
7. Stop without another capture or settings-tab navigation. CEO decision
   MEP-1051 owns gap acceptance or a bounded technical follow-up; this issue
   stays blocked on that decision. The existing UI Lead gate is retained for
   the later research disposition. No skeleton or incomplete form is submitted
   as a completed settings contract.

## Non-GET baseline and blocked requests

Only neutral paths and counts are retained for safety accounting; no request
payload shapes, customer identifiers or external hostnames are copied.
`network.json` response counts and `meta.json` blocked requests are separate:
blocked attempts have no response entry and are not counted twice.

| Method | Neutral path / service | Base count | Disposition |
| --- | --- | --- | --- |
| POST | `/proofing/v2/batch/activities` | 1 | response recorded; no field interaction |
| POST | `/visitor/v2/<service>/livevisitors/:id/triggers` | 1 | response recorded; automatic shell load |
| POST | `/crm/<org>/ActivityReminder.do` | 1 | blocked; legacy `showreminder` |
| POST | `/crm/<org>/crminotification.do` | 1 | blocked; legacy `status` |
| POST | telemetry `/murphy/:id/ingest/exceptions` | 1 | blocked |
| POST | telemetry `/murphy/:id/telemetry/logs` | 1 | blocked |
| POST | telemetry `/murphy/:id/telemetry/urlMonitor` | 1 | blocked |

The initial base defines this set, not a later authorization to write. Any
later new non-GET path or higher count invokes DUR immediately, even if blocked.
The retry has the identical non-GET path/count multiset: each of the seven
rows above has count 1 again; no new path and no increased count. There is no
DUR request-baseline breach. It has the same five blocked-request classes,
reported without retrying them individually. The only repeat was the
plan-authorized whole-page paint probe. The five blocked requests were not retried individually. There was no toggle
interaction, mailbox sync, send, download, popup, print or automatic Escape.

## Write-only behaviour

Saving compose preferences, creating/editing/deleting signatures, changing
sender/reply-to, mailbox connection/reconfiguration, tracking changes, inbound
or outbound rules, forwarding/disclaimers and unsubscribe changes are never
exercised. See [module-10-write-only-flows.md](../module-10-write-only-flows.md),
R5 follow-up. Public-documentation work must label its claims `documented`;
no documentation findings are asserted by this capture-only run.

## Open questions

1. Can a technical follow-up produce an error-free base for Compose Settings
   without changing reference settings, session or permissions?
2. Which scoped remaining settings pages are available read-only after the
   gate is resolved? Navigation links alone do not establish their forms.
3. How are existing signatures represented? The model error prevents an
   empty-signature conclusion.
4. What are selection persistence, save/validation and error outcomes? These
   remain unobserved without a write; use public documentation or a later
   explicit board decision, never a live experiment.

## Capture refs

- `m6-setup`: retained navigation evidence only, Email link; not a new capture
  in this issue and not used as the R5 request baseline.
- `m10r5-email-settings-base`: click-free entry route; `--wait 25000`;
  completed 2026-10-21 22:00:43 UTC; screenshot, controls, aria, page text,
  network and meta retained in the research workspace. Paint gate failed.

- `m10r5-email-settings-retry-base`: identical click-free entry route and wait;
  started 2026-10-21 22:05:55 UTC, completed 22:06:33 UTC; same evidence
  files retained. Paint gate failed; no additional capture authorized.

## Verification and disposition

- `origin/main` merge: already up to date before handoff.
- `git diff --check`: passed. Inventory numbering, reconciliation arithmetic,
  relative links and new-spec privacy-pattern checks: passed.
- `research/specs/verify.mjs` is absent. No application code changed; no
  application, component or e2e tests run. No CI result claimed.
- Deliver partial evidence with an explicit blocked decision path, not a
  completed research claim. The remaining settings coverage is listed in
  MEP-1051; no parity-checklist change.


## R5 continuation after MEP-1051 (2026-10-23)

MEP-1051 accepts the two original captures as evidence and allows the known
sortable-parent, proofing-global and signature-model errors on R5 pages.
New page errors still stop research. MEP-1013 is complete; only the capture
serve process was present before this run. No old capture or spent click
was repeated. Current `origin/main` was merged; the write-only addenda from
both branches were preserved.

### Mailbox configuration base and delta inventory

Source for all following rows: `seen (m10r5-mailbox-settings-base)`.
Direct route: `/crm/<org>/settings/email-configuration/email-settings?action=mailSelect`,
from the original base's named Email link (entry 279). No click executed.
Completed 2026-10-23 01:20:05 UTC with `--wait 25000`.

The Email configuration subtab is selected by route. The main card shows
Configure Email, a help link, short introductory text, three illustrated
capability columns (record context, sending/receiving, synchronization),
and Get Started. There is no connected-mailbox table, credential field or
provider picker in this resting screen. This is an observed setup entry,
not proof of mailbox state elsewhere. Illustrations remain reference evidence;
implementation must create its own assets. Get Started was never clicked:
opening a connection workflow is outside this read-only run.

| # | Delta against Compose base | Position / type | Behaviour | Owner | Contacts ref | Control entries |
| --- | --- | --- | --- | --- | --- | --- |
| MB-01 | Reuse ES-01–ES-47 with Email selected instead of Compose | Same setup rail, shell and tab rows | not clicked | Same as base | Same as base | Same indices as base |
| MB-02 | Remove ES-48–ES-53 | Compose fields and signature action absent | not observed on this route | M10 | new | None |
| MB-03 | Get Started replaces Compose form | Main card, centered action link below capability columns | not clicked; connection flow forbidden | M10 | new | 287 |
| MB-04 | Reuse ES-54–ES-64 | Bottom utility strip | not clicked | Shared shell | SH-35–SH-45 | 304–314, respectively |
| MB-05 | Heading Help replaces Compose Settings Help (ES-65) | Right of Configure Email heading; link | not clicked | M10 | new | Screenshot-only |
| MB-06 | Reuse ES-66 | Far-right bottom trash-bin icon | not clicked | Shared shell | SH-46 | Screenshot-only |

Screenshot and controls inspected offline. Reconciliation: 330 entries →
59 indexed controls plus two screenshot-only controls = **61 controls**.
102 entries assigned, 43 nested representations collapsed, 228 excluded:
59 + 43 + 228 = 330. Excluded indices:
`1–2, 10–36, 55, 74, 81–233, 236, 240–241, 243–244, 246–247, 250–251, 256–257, 286, 288–303, 315–330`.
Exclusion reasons match the Compose base: hidden/clipped navigation,
wrappers, inactive dialogs, zero-size scaffolding and scroll containers.
All reused indexed control names were checked against their base mappings.

### Paint and request accounting

Configure Email heading present; 330 controls; 42 API records, exceeding
half of 51 in the earlier base. Only the accepted sortable-parent pageerror
remains; no new pageerror or failed JavaScript GET is recorded. Script
loads: 261 network, 2 cache, 0 failed. Paint criteria pass under MEP-1051;
this does not override the independent network stop below.

| Non-GET class | Original base | Mailbox base | Result |
| --- | --- | --- | --- |
| Proofing activities POST | 1 | 0 | Reduced |
| Shell visitor-trigger POST | 1 | 1 | Same |
| Blocked reminder POST | 1 | 1 | Same |
| Blocked notification POST | 1 | 1 | Same |
| Blocked exceptions telemetry POST | 1 | 0 | Absent |
| Blocked logs telemetry POST | 1 | 1 | Same |
| Blocked urlMonitor telemetry POST | 1 | 2 | **DUR: count increased** |

Five blocked requests total. Response entries and blocked attempts are counted
separately, without double counting. No new non-GET path was seen, but the
urlMonitor count increase alone invokes rule 7, even though both attempts
were refused. No request was retried individually, no rollback attempted,
and no further capture was made. No tool error, leaked tab, popup, download,
file chooser, print or automatic Escape was reported.

Executed click list remains `[]`; selector/DANGEROUS_TEXT check passes for
the empty list. All fields, switches, links, Get Started and help remain
not clicked. No credentials or addresses were entered or copied.

### Historical remaining scope and disposition before MEP-1158

MEP-1158 is assigned to the CEO for a bounded continuation decision or
explicit gap disposition. Until it resolves, no new R5 capture is authorized.
Remaining read-only pages: Email Sharing, Organization Emails, Custom Email
Fields, Email Parser, BCC Dropbox, Email Deliverability, Email Intelligence,
Unsubscribe Link, plus safely reachable rules, forwarding, disclaimers and
limits. The coverage table above describes the original run; mailbox setup
now has the limited resting-screen evidence in this addendum. Signature state,
write outcomes and all unvisited settings forms remain open questions.
The original MEP-1051 paint blocker is resolved, superseded by MEP-1158;
this is still a partial spec, awaiting eventual UI Lead approval.

Capture refs added: `m10r5-mailbox-settings-base` (screenshot, aria, page,
controls, network, meta in the research workspace; no screenshot committed).
Verification: inventory arithmetic and mapped control names passed;
`git diff --check` passed. `research/specs/verify.mjs` is absent.
Documentation only; application tests and CI were not run or claimed.


## R5 safe continuation under MEP-1158 (2026-10-23)

This section supersedes the historical MEP-1158 wait and request-count stop
above. CEO decision MEP-1158 permits only click-free base captures, one per
remaining page, no retries. Counts may vary only for refused, unanswered
urlMonitor, reminder, notification and logs requests. Every capture reports
these counts. A new blocked path, new responded non-GET path, visitor count
above one, new error outside the three MEP-1051 baseline errors, or a tool
failure still stops research. Existing Compose and mailbox captures are reused.
No clicks, searches, field changes, setup entry or preference editor is used.
Click list `[]`; offline selector and DANGEROUS_TEXT checks pass for this empty
list. Every control below is **not clicked**; presence does not prove behaviour.

### Email Sharing — delta inventory

Source: `seen (m10r5-email-sharing-base)`. Direct route:
`/crm/<org>/settings/email-configuration/email-sharing`.
Setup shell and both tab rows match the original base; Email Sharing is the
route-selected subtab. The main card contains a permissions heading, brief
explanation, user/profile search, Mass Update, Preferences, and a user table.
Columns are user identity/role/status, configuration type, sharing, excluded
domains and shared-with scope. Identity values are omitted. Three rows are
visible: two enabled closed sharing selectors and one disabled selector;
two shared-with scope entries are visible. No configured-account conclusion
is inferred from this table. No row or selection was operated.

| # | Delta against Compose base | Position / type | Behaviour | Owner | Contacts ref | Control entries |
| --- | --- | --- | --- | --- | --- | --- |
| SH-01 | Reuse ES-01–ES-47; Email Sharing selected | Rail, shell and tab rows | not clicked | Same as base | Same as base | Same as base |
| SH-02 | Remove ES-48–ES-53 | Compose fields absent | not observed | M10 | new | None |
| SH-03 | Permissions heading Help | Main heading, right; link | not clicked | M10 | new | 287 |
| SH-04 | Search User, Profile | Above table, left; search/combobox representation | not clicked | M10 | new | 288–291 |
| SH-05 | Mass Update | Above table, right; button | not clicked; write | M10 | new | 292–293 |
| SH-06 | Preferences | Above table, right; navigation link | not clicked; preference editor not inspected | M10 | new | 294–295 |
| SH-07 | Select all users | Table header, left; checkbox | not clicked | M10 | new | 296–297 |
| SH-08 | Column filter icon | Table header, right | not clicked; unnamed | M10 | new | 298 |
| SH-09 | First visible row sharing selector | Sharing column; closed dropdown | not clicked | M10 | new | 299–300 |
| SH-10 | First visible row shared-with scope | Shared-with column | not clicked | M10 | new | 302 |
| SH-11 | Second visible row sharing selector | Sharing column; closed dropdown | not clicked | M10 | new | 303–304 |
| SH-12 | Second visible row shared-with scope | Shared-with column | not clicked | M10 | new | 306 |
| SH-13 | Third visible row sharing selector | Sharing column; disabled closed dropdown | not clicked | M10 | new | 307–308 |
| SH-14 | Shared-with information icon | Table header, after label | not clicked | M10 | new | Screenshot-only |
| SH-15 | Reuse ES-54–ES-64 | Bottom utility strip | not clicked | Shared shell | SH-35–SH-45 | 334–344 |
| SH-16 | Reuse ES-66 | Bottom trash-bin icon | not clicked | Shared shell | SH-46 | Screenshot-only |

Reconciliation: 361 entries → 69 indexed controls plus two screenshot-only
controls = **71 controls**. 121 assigned entries, 52 nested representations
collapsed, 240 excluded; 69 + 52 + 240 = 361. Exclusions retain the base's
hidden/clipped rail and shell scaffolding; additionally excluded are result
wrapper 286, zero-size domain controls 301/305/309, inactive modal/popover
entries 310–332, utility wrapper 333, decorative search/arrow elements
345–347, and offscreen/container entries 348–361. No table identity is copied.
Heading present, 42 API records, no failed JavaScript load, only the accepted
sortable-parent pageerror: paint passes under MEP-1051. Responded non-GET:
visitor POST 1 only. Blocked reminder 1, notification 1, logs 1, urlMonitor 1;
4 total. No new path, new error or tool failure; MEP-1158 safety checks pass.
Capture completed 2026-10-23 01:24:48 UTC, `--wait 25000`; screenshot inspected.
Capture refs added: `m10r5-email-sharing-base` (screenshot, controls, aria,
page, network, meta retained locally; no screenshot committed).


### Organization Emails — delta inventory

Source: `seen (m10r5-organization-emails-base)`. Direct route:
`/crm/<org>/settings/email-configuration/organization-emails`.
Organization Emails is selected. The resting card has an address-management
heading, Help, explanatory text and Add Email Address; no address rows are
visible. The explanation describes department sender/reply-to use and a
verification prerequisite; this text is evidence of a stated prerequisite,
not an exercised verification flow. No address or credential is retained.

| # | Delta against Compose base | Position / type | Behaviour | Owner | Contacts ref | Control entries |
| --- | --- | --- | --- | --- | --- | --- |
| OR-01 | Reuse ES-01–ES-47; Organization Emails selected | Rail, shell and tab rows | not clicked | Same as base | Same as base | Same as base |
| OR-02 | Remove ES-48–ES-53 | Compose form absent | not observed | M10 | new | None |
| OR-03 | Organization addresses Help | Main heading, right; link | not clicked | M10 | new | 287 |
| OR-04 | Add Email Address | Below explanation; button | not clicked; write/setup entry | M10 | new | 288–289 |
| OR-05 | Reuse ES-54–ES-64 | Bottom utility strip | not clicked | Shared shell | SH-35–SH-45 | 309–319 |
| OR-06 | Reuse ES-66 | Bottom trash-bin icon | not clicked | Shared shell | SH-46 | Screenshot-only |

Reconciliation: 334 entries → 60 indexed controls plus one screenshot-only
control = **61 controls**. 104 assigned entries, 44 collapsed nested
representations, 230 excluded: 60 + 44 + 230 = 334. Base shell exclusions
are reused; additionally exclude result wrapper 286, zero-size dialogs and
containers 290–308, and offscreen/container entries 320–334.
Heading present, 42 API records; only accepted sortable-parent pageerror;
no failed script load. Paint passes under MEP-1051. Responded non-GET:
visitor POST 1 only. Blocked reminder 1, notification 1, logs 1, urlMonitor 2;
5 total. MEP-1158 allows this refused count variation; all other safety checks
pass. Completed 2026-10-23 01:26:00 UTC, `--wait 25000`; screenshot inspected.
Capture refs added: `m10r5-organization-emails-base` (all six evidence files
retained in the research workspace).


### Custom Email Fields — delta inventory

Source: `seen (m10r5-custom-email-fields-base)`. Direct route:
`/crm/<org>/settings/email-configuration/custom-email-fields-preference`.
Custom Email Fields is selected. A preferences heading has an off-state
switch beside it and Help at the right. Explanatory text describes including
custom-email-field conversations in record related lists, composer suggestions,
email reporting and latest-email-status filtering. A highlighted note states
that primary/secondary email sharing permissions also apply. These are stated
capabilities, never tested. No custom field picker is visible in this state.
The toggle remains **not clicked**; no synchronization was initiated.

| # | Delta against Compose base | Position / type | Behaviour | Owner | Contacts ref | Control entries |
| --- | --- | --- | --- | --- | --- | --- |
| CF-01 | Reuse ES-01–ES-47; Custom Email Fields selected | Rail, shell and tab rows | not clicked | Same as base | Same as base | Same as base |
| CF-02 | Remove ES-48–ES-53 | Compose fields absent | not observed | M10 | new | None |
| CF-03 | Custom email preferences switch | Beside main heading; off-state toggle | not clicked; persisted preference | M10 | new | 287–288 |
| CF-04 | Preferences heading Help | Main heading, right | not clicked | M10 | new | Screenshot-only |
| CF-05 | Reuse ES-54–ES-64 | Bottom utility strip | not clicked | Shared shell | SH-35–SH-45 | 308–318 |
| CF-06 | Reuse ES-66 | Bottom trash-bin icon | not clicked | Shared shell | SH-46 | Screenshot-only |

Reconciliation: 332 entries → 59 indexed controls plus two screenshot-only
controls = **61 controls**. 103 assigned entries, 44 collapsed nested
representations, 229 excluded: 59 + 44 + 229 = 332. Base shell exclusions
remain; additionally exclude result wrapper 286, hidden dialogs/containers
289–307 and offscreen/container entries 319–332. Static paragraphs, bullet
points and the highlighted note are not controls.
Heading present, 41 API records; only accepted sortable-parent pageerror;
no failed JavaScript load. Paint passes under MEP-1051. Responded non-GET:
visitor POST 1 only. Blocked reminder 1, notification 1, logs 1, urlMonitor 2;
5 total. MEP-1158 safety checks pass. Completed 2026-10-23 01:27:38 UTC,
`--wait 25000`; screenshot inspected.
Capture refs added: `m10r5-custom-email-fields-base` (all six evidence files
retained locally).


### Email Parser — stopped base; no completed screen contract

Source: `seen (m10r5-email-parser-base)`. Direct route:
`/crm/<org>/settings/email-parser`, taken from base entry 263, no click.
Completed 2026-10-23 01:28:49 UTC with `--wait 25000`.
The screenshot shows a full-page loading skeleton and Loading indicator;
there is no visible usable settings control or module heading. Do not infer
parser fields, rule rows, empty state or successful navigation from underlying
DOM entries. The 285 collected entries are all excluded from the visible
inventory because they are behind the loading surface or zero-size/offscreen.
Screenshot inspected. No reference assets or text blocks are copied.

| # | Delta against Compose base | Position / type | Behaviour | Owner | Contacts ref | Control entries |
| --- | --- | --- | --- | --- | --- | --- |
| LD-01 | All functional base controls obscured by loader | Full-page loading surface | no interaction; not a completed settings state | M10/shared loader | new | 1–285 excluded |

Reconciliation: **285 entries → 0 visible controls, 285 excluded**, no
assigned or collapsed entries. LD-01 describes the visible state; it is not
an interactive inventory item. The screenshot contains no additional
interactive control. This is failed-probe evidence only, not a skeleton
handed off for implementation or QA as a completed screen.

| Request class | Email Parser count | Safety result |
| --- | --- | --- |
| Responded non-GET | 0 | No response-bearing write recorded |
| Blocked reminder POST | 1 | Allowed variable class |
| Blocked notification POST | 0 | Absent |
| Blocked logs POST | 0 | Absent |
| Blocked urlMonitor POST | 2 | Allowed variable class |
| **Blocked `/crm/<org>/EmailParserAction.do` POST** | **1** | **New path outside MEP-1158: DUR** |

Four blocked attempts total; parser legacy action is `emailParser`.
There is no response for the refused parser request. No request is replayed
individually. 26 API records and 285 controls were collected; JavaScript
loads have zero failures. Only the accepted sortable-parent pageerror remains.
The visible heading requirement fails; the page did not paint. The independent
new-path stop rule applies immediately, so there is no paint retry. No tool
error, leaked tab, download, file chooser, popup, print or automatic Escape
was reported. Clicks, steps and skipped-click lists are empty.

Capture refs added: `m10r5-email-parser-base` (all six files retained locally).
No BCC Dropbox or later page was captured after this stop.

### Historical coverage and disposition at the parser stop

MEP-1159 is the new CEO-owned decision dependency. R5 is stopped until the
CEO records explicit gap acceptance or another bounded, read-only continuation
decision. This does not authorize changing the capture guard or replaying
the refused endpoint. The existing UI Lead approval gate remains for eventual
research completion; this partial delivery does not enter final approval.

| Surface | Current evidence | Remaining limit |
| --- | --- | --- |
| Compose / signatures | Original captures, known errors accepted by MEP-1051 | Signature model, editor, choices, save/validation remain gaps |
| Mailbox | Configure Email resting entry | Configure/Get Started and everything after setup remain unobserved |
| Email Sharing | Resting permissions table | Search, filters, bulk action, choices, preferences and save effects untested |
| Organization Emails | Introductory address page | Add/verify/edit/delete and verification results unobserved |
| Custom Email Fields | Resting off-state preference | Enabling, synchronization and downstream outcomes untested |
| Email Parser | Failed loading probe; new blocked path | Entire functional page remains unobserved |
| BCC Dropbox | Original navigation link only | Not visited after DUR |
| Email Deliverability | Original navigation link only | Not visited after DUR; notes and limits unobserved |
| Email Intelligence | Original navigation link only | Not visited after DUR; tracking options unobserved |
| Unsubscribe Link | Original navigation link only | Not visited after DUR; configuration unobserved |
| Incoming/outgoing rules, forwarding, disclaimers, limits | No dedicated directly reachable form established | Explicit access/setup gaps; do not infer absence |

Open questions carried forward: functional parser access without a blocked
request; scope disposition for the five uncompleted top-level pages; exact
write outcomes and signature representation; read-only reachability of rules,
forwarding, disclaimers and limits. Setup/write-dependent items remain in
[module-10-write-only-flows.md](../module-10-write-only-flows.md). No public
documentation claims were added by this capture-only continuation.

Final click list remains `[]`; all fields, toggles, search, selection, Help,
Preferences, Add Email Address and setup actions are **not clicked**. Offline
selector/DANGEROUS_TEXT checks pass for the empty list. No account identifiers,
addresses or customer values were retained in this spec. No reference state
change was observed. No parity-checklist change.


### Continuation verification

- Current `origin/main` merge: already up to date.
- `git diff --check`, base-to-delta control-name mappings, assigned-index
  uniqueness, all three reconciliation counts, relative links and added-content
  privacy-pattern checks passed. Parser has zero visible interactive controls;
  all 285 underlying entries are excluded from the functional inventory.
- Every new screenshot was inspected. All four captures used `--wait 25000`;
  no capture was retried. No tool failure or tab leak was reported.
- `research/specs/verify.mjs` is absent. Documentation only; no application
  tests, full test run or local verify. Automatic push/CI not verified.
- MEP-1014 `blocked` status and MEP-1159 dependency were confirmed by API.
  UI Lead approval remains pending until the scope decision is resolved.


## Final R5 boundaries — MEP-1159

The CEO resolved the parser-stop dependency during the same research run.
Email Parser is accepted as an explicit gap: **data did not load; the tool
blocked the request**. It is not recaptured, and the guard is not relaxed.
The earlier blocked disposition and MEP-1159 wait above are historical.

The remaining four pages each receive one click-free base capture. Refused,
unanswered counts for urlMonitor, reminder, notification, logs and
EmailParserAction may vary. A different refused unanswered path makes that
page an explicit gap, then research continues to the next page, without
replaying its endpoint. Persistent non-paint similarly becomes a page gap.
Any new/increased responded non-GET, new pageerror/script failure, tool error
or suspected reference change still stops all R5. No additional decision issue
is needed for a page-only refused-path gap. Only direct recorded addresses
are used; click list remains `[]`. Setup and write-only states stay gaps.


### BCC Dropbox — resting evidence and full safety stop

Source: `seen (m10r5-bcc-dropbox-base)`. Direct route:
`/crm/<org>/settings/bcc-dropbox`, from the original base's named link.
Captured 2026-10-23 01:34:32 UTC, `--wait 25000`, no clicks or retry.

BCC Dropbox is the selected top-level email tab; the configuration subtabs
are absent. The resting page shows an address-verification warning, Help,
BCC explanation, a generated-address card, Regenerate and Download as vCard,
a copy icon, an Exclude Domains input with information icon, and Search Pattern
with Edit Search Pattern. A note continues below the viewport. The explanation
states that a BCC copy can associate mail with CRM records, and the search
pattern describes Contacts before Leads and possible new-Lead creation. These
are page statements only; no mail or search-pattern action was exercised.
The generated address is never copied or retained in the repository. Its
presence does not establish whether this load created or merely returned it.

| # | Delta against Compose base | Position / type | Behaviour | Owner | Contacts ref | Control entries |
| --- | --- | --- | --- | --- | --- | --- |
| BC-01 | Reuse ES-01–ES-34 | Setup rail and top shell | not clicked | Same as base | Same as base | Same as base |
| BC-02 | Reuse ES-35 Profile | Top shell | not clicked | Shared shell | SH-33 | 248–249 |
| BC-03 | Reuse ES-36 Applications menu | Top shell | not clicked | Shared shell | SH-34 | 252–255 |
| BC-04 | Additional Applications menu representation | Top shell, adjacent dots icon | not clicked; screenshot shows overlapping shell affordances | Shared shell | SH-34 | 256–258 |
| BC-05 | Reuse ES-37–ES-42; BCC Dropbox selected | Top email tab row | not clicked | M10 | Same as base | 261–278, three entries per tab |
| BC-06 | Remove ES-43–ES-53 | Configuration subtabs and Compose form absent | not observed | M10 | new | None |
| BC-07 | BCC heading Help | Main card, right | not clicked | M10 | new | Screenshot-only; 280 zero-size excluded |
| BC-08 | Regenerate | Address card, top right; action link | not clicked; write | M10 | new | 281 |
| BC-09 | Download as vCard | Address card, top right; action link | not clicked; export/download | M10 | new | 282 |
| BC-10 | Copy address icon | Address card, beside address | not clicked | M10 | new | 284, 333–334 |
| BC-11 | Exclude Domains information icon | Beside field label | not clicked | M10 | new | 285, 335 |
| BC-12 | Exclude Domains | Address card; text input | not clicked | M10 | new | 286–288 |
| BC-13 | Edit Search Pattern | Search-pattern section, after explanation | not clicked; configuration action | M10 | new | 290 |
| BC-14 | Reuse ES-54–ES-64 | Bottom utility strip | not clicked | Shared shell | SH-35–SH-45 | 322–332 |
| BC-15 | Reuse ES-66 | Bottom trash-bin icon | not clicked | Shared shell | SH-46 | Screenshot-only |

Reconciliation: 350 entries → 60 indexed controls plus two screenshot-only
controls = **62 controls**. 105 assigned entries, 45 nested representations
collapsed, 245 excluded: 60 + 45 + 245 = 350. Original rail/shell exclusions
through 251 remain. Also exclude tab-row wrappers 259–260, content wrapper
279, zero-size help 280, static address display 283, static search description
289, offscreen Add Email 291–292, inactive dialogs/containers 293–321 and
body/offscreen/scroll wrappers 336–350. Hidden Add Email is not asserted as a
visible control or operated. The screenshot was inspected; no scrolling.

Heading present, 43 API records; only accepted sortable-parent pageerror,
zero failed JavaScript loads. Paint passes under MEP-1051. However:

| Non-GET class | Count | Result |
| --- | --- | --- |
| **Responded POST `/crm/v8/settings/bcc_dropbox`** | **1, HTTP 200** | **New responded path: full DUR under MEP-1159** |
| Responded shell visitor POST | 1 | Existing automatic shell class |
| Blocked reminder POST | 1 | Accepted refused class |
| Blocked notification POST | 1 | Accepted refused class |
| Blocked logs POST | 1 | Accepted refused class |
| Blocked urlMonitor POST | 1 | Accepted refused class |
| Blocked telemetry `/murphy/:id/telemetry/customMetrics` POST | 1 | New refused class; page gap under MEP-1159 |
| Blocked EmailParserAction POST | 0 | Absent |

Five blocked attempts, two responded non-GET entries. The request summary
for the BCC POST is null; retained response evidence is structure only and
does not establish its semantics or persistent effect. HTTP 200 is not proof
that settings changed. No control was clicked, no rollback or request replay
was attempted. The new responded path independently stops all R5 immediately;
the new refused telemetry path does not override that stop. No tool error,
tab leak, popup, download, file chooser, print or automatic Escape was reported.
Click/step lists remain empty.

Capture refs added: `m10r5-bcc-dropbox-base` (all six evidence files retained
in the research workspace; no screenshot or address committed).

### Current disposition after the BCC stop

MEP-1160 is the CEO-owned safety/scope decision dependency. The source issue
was confirmed `blocked` with that dependency. No further capture is performed.
The earlier MEP-1159 wait is resolved: Parser is an accepted open gap. The
three additional configuration pages and BCC resting evidence are retained;
none proves write results. MEP-1160 must resolve the new responded POST before
any further R5 navigation. No change to the capture guard is authorized.

Remaining unvisited pages: Email Deliverability, Email Intelligence and
Unsubscribe Link. Incoming/outgoing rules, forwarding, disclaimers and limits
remain gaps wherever no direct read-only route was established. Compose/signature
and Configure Email setup gaps remain explicit in the write-only document.
UI Lead approval stays pending; this is partial evidence, not completed R5.

Verification: BCC reused control mappings and reconciliation arithmetic checked;
all five new screenshots inspected. Current `origin/main` merge already up to
date. `git diff --check`, relative links and added-content privacy checks pass.
`research/specs/verify.mjs` absent; documentation only, no application tests.
No parity-checklist change, no manual push, no automatic-push/CI claim.
