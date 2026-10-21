# Email and mailbox settings — read-only research

Status: blocked after two failed paint probes; decision owner CEO (MEP-1051).
Partial observation only; not an implementation-ready settings contract.
Issue: MEP-1014. Observed 2026-10-22 (local date).

## Purpose and scope

Describe email settings reachable through direct navigation or named settings
links under section 4.5 of the
[approved research plan](../module-10-email-calendar-research-plan.md).
The later sequencing decision allows R5 independently of R4. It does not
relax the paint gate, stop rule or read-only restriction.

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
