# Customization — Company details and currencies (R2)

## Purpose and status

Inspect the initial read-only Company Details and Currencies pages. This
research informs MEP-496 and ADR 0011; it does not decide a locale policy.
Module 2+ parity applies: observed controls and behaviour, without pixel,
colour, typography or frontend request-shape specifications. No reference
assets or organization values are copied.

## Evidence and capture refs

- `captures/m11r2-company-details/`: historical failed attempt, progress.json
  only, stopped at goto. Not target-state acceptance evidence.
- `captures/m11r2-company-details-resume/`: accepted fully painted Company
  Details initial state, 2026-10-23 16:25 UTC; no clicks.
- `captures/m11r2-currencies/`: Currencies initial state, inspected below.
- Complete captures retain screenshot.png, aria.yml, page.txt, controls.json,
  network.json, meta.json and progress.json in the local research workspace.
  Raw captures contain organization information and remain local; they are
  never committed or uploaded as deliverables.

The earlier navigation timeout was resolved through MEP-1177 and MEP-1178.
Platform Lead released the restart condition. Before resuming, only the
capture serve process was running and its lock was absent. Two page tabs
were counted: a local index and the existing reference page. There were no
extra stale capture tabs; **zero tabs closed**. The serve page and at least
one existing page were preserved. One capture per target was attempted in
this run, sequentially, with no click, hover, input, toggle or preference
change. Both destinations were evidenced navigation links, not guessed routes.

## Layout

The settings sidebar remains on the left, with Setup Home, its search,
Frequently Used, General and Security Control groups visible. Company Settings
is selected. A global utility bar sits above the content; the bottom utility
strip remains visible.

Company Settings has seven horizontal tabs: Company Details, Fiscal Year,
Domain Mapping, Business hours, Holidays, Currencies and Hierarchy Preference.
The active tab is distinguished from its neighbours. These are navigation
controls; none of the other five target pages was opened.

Company Details contains an organization identity/contact block, Access URL,
Locale Information and Team Licenses. Identity/contact values and the access
address are omitted here. Contact-type icons include email, telephone, fax,
website and location; some slots are empty. These are display content, not
proof of interactive controls. Locale Information shows a Time Zone row with
an offset, a time-zone name and an IANA region/city identifier. Its pencil is
visible. No country/locale selector, date format, number format or home
currency is visible on this initial page.

## Control inventory

Numbers describe distinct visible controls in screenshot reading order.
`C` is the one-based controls.json entry for Company Details; `K` denotes
Currencies. Nested wrappers/anchors for the same visible action are counted
once. Offscreen sidebar entries, hidden/zero-sized modal placeholders,
presentation SVGs and broad navigation/content containers are not extra
controls. Screenshot-only controls have no exported selector; their actions
are inferred from the icon and context and remain untested. Positions are
qualitative, not styling measurements. No control was operated unless stated.

### Shared shell and tab strip

These controls are visible on both initial states. Source positions below
refer to Company Details; the Currencies reconciliation follows its inventory.
Every row belongs to the settings shell unless its owner says otherwise.

| No. | Position / visible control | Observed affordance / limit | Source | Owner |
| --- | --- | --- | --- | --- |
| 1 | Sidebar top, back arrow | Return navigation; not opened | C3 + image | Shell |
| 2 | Sidebar top, Setup Home | Setup landing link | C4–5 | Settings |
| 3 | Sidebar top right, sliders | Settings editor affordance; forbidden to open | C6–7 + image | Settings |
| 4 | Sidebar beneath header, Search | Empty settings search input; no typing | C8–9 | Settings |
| 5 | Sidebar, Frequently Used heading/chevron | Expanded accordion; no preference change | C10–11 | Settings |
| 6 | Below Frequently Used, Profiles | Profile settings shortcut | C13–14 | Settings |
| 7 | Sidebar, General heading/chevron | Expanded accordion; untouched | C15–16 | Settings |
| 8 | General, Personal Settings | User-level settings navigation; unopened | C18–19 | Settings |
| 9 | General, Users | User settings navigation | C20–21 | Settings |
| 10 | General, Company Settings | Selected company-settings navigation | C22–23 | Settings |
| 11 | General, Calendar Booking | Booking settings navigation | C24–25 | Settings |
| 12 | General, Motivator | Motivation settings navigation | C26–27 | Settings |
| 13 | General, Agents | Agent settings navigation | C28–29 | Settings |
| 14 | Sidebar, Security Control heading/chevron | Expanded accordion; untouched | C30–31 | Settings |
| 15 | Security Control, Profiles | Profile settings navigation | C33–34 | Settings |
| 16 | Security Control, Roles and Sharing | Roles/sharing navigation | C35–36 | Settings |
| 17 | Security Control, mail add-on users | Mail add-on settings link; neutralized label | C37–38 + image | Settings |
| 18 | Security Control, Compliance Settings | Compliance settings navigation | C39–40 | Settings |
| 19 | Security Control, Territory Management | Territory settings navigation | C41–42 | Settings |
| 20 | Security Control, Trusted Domain | Trusted-domain navigation | C43–44 | Settings |
| 21 | Security Control, Support Access | Support-access navigation | C45–46 | Settings |
| 22 | Security Control, Single Sign-On | SAML settings affordance | C47 | Settings |
| 23 | Security Control, Security Policies | Security-policy affordance | C48 | Settings |
| 24 | Security Control, Active Directory Sync | Directory-sync affordance | C49 | Settings |
| 25 | Security Control, Login History | Login-history affordance | C50 | Settings |
| 26 | Sidebar lower edge, Audit Log | Audit navigation; partly clipped | C51–52 + image | Settings |
| 27 | Global top bar, Search records | Global search affordance; untouched | C234 | Shell |
| 28 | Global top bar, plus | Global create affordance; forbidden | C235 | Shell |
| 29 | Global top bar, assistant icon | Assistant affordance; neutralized label | C237 + image | Shell |
| 30 | Global top bar, bell | Notifications affordance | C238 | Shell |
| 31 | Global top bar, calendar | Calendar navigation | C239 | Shell |
| 32 | Global top bar, storefront | Marketplace affordance | C242 | Shell |
| 33 | Global top bar, gear | Setup selected | C245 | Shell |
| 34 | Global top bar, avatar | Profile menu affordance | C248–249 | Shell |
| 35 | Global top bar, grid | Applications menu affordance | C252–253 | Shell |
| 36 | Bottom left, My Pins | Pins utility | C304 | Shell |
| 37 | Bottom left, Chats | Chat utility | C305 | Shell |
| 38 | Bottom left, Contacts | Contacts utility | C306 | Shell |
| 39 | Bottom right strip, command icon | Command palette affordance | C307 | Shell |
| 40 | Bottom right strip, megaphone | Announcements affordance | C308 | Shell |
| 41 | Bottom right strip, chart | Motivator affordance | C309 | Shell |
| 42 | Bottom right strip, note icon | Sticky Notes affordance | C310 | Shell |
| 43 | Bottom right strip, alarm | Activity Reminders affordance | C311 | Shell |
| 44 | Bottom right strip, recent icon | Recent Items affordance | C312 | Shell |
| 45 | Bottom right strip, accessibility | Accessibility affordance | C313 | Shell |
| 46 | Bottom right strip, Help | Help affordance | C314 | Shell |
| 47 | Bottom far right, bin icon | Utility bin affordance; destination unverified | Image only | Shell |
| 48 | Content tabs, Company Details | Active on Company Details | C258–260 | Company settings |
| 49 | Content tabs, Fiscal Year | Navigation only; unopened | C261–263 | Company settings |
| 50 | Content tabs, Domain Mapping | Navigation only; unopened | C264–266 | Company settings |
| 51 | Content tabs, Business hours | Navigation only; unopened | C267–269 | Company settings |
| 52 | Content tabs, Holidays | Navigation only; unopened | C270–272 | Company settings |
| 53 | Content tabs, Currencies | Link establishes `/crm/<org>/settings/currencies` | C273–275 | Company settings |
| 54 | Content tabs, Hierarchy Preference | Navigation only; unopened | C276–278 | Company settings |

### Company Details controls

| No. | Position / visible control | Observed affordance / limit | Source | Owner |
| --- | --- | --- | --- | --- |
| 55 | Beside organization name, pencil | Identity/contact editor affordance; never opened | Image only | Company details |
| 56 | Beside Access URL heading, pencil | Access-address editor affordance; never opened | Image only | Company details |
| 57 | Beside access address, copy icon | Copy affordance; not invoked | Image only | Company details |
| 58 | Beside Time Zone value, pencil | Time-zone editor affordance; never opened | Image only | Company details |
| 59 | Team Licenses explanation, Learn More | Documentation link; unopened | Image only | Licensing |
| 60 | Under Team Licenses, Get Team User License | License acquisition affordance; forbidden | C286 + image | Licensing |

Reconciliation: 328 exported entries include deeply offscreen sidebar content,
wrappers and hidden components. The inventory contains 60 distinct visible
controls, including six screenshot-only controls (47, 55–59). No editor, modal,
Save control or currency list is visible on Company Details. The organization
image is treated as display content; no hover or image action is established.

### Currencies initial state

The active Currencies tab contains a title, Help action and short explanation
of organization currency preferences. A bordered confirmation panel proposes
a home currency as a display name plus a three-letter ISO code. The displayed
currency value is intentionally omitted. The panel warns that confirmation
makes the home currency unchangeable later; this is **visible guidance**, not
a tested mutation or an independently established backend restriction.

No currency table, rate, active/inactive switch, Add action or numeric-format
sample is visible. This is an initial configuration/confirmation state, not
an empty currency table and not an error. Reaching a subsequent list requires
an unauthorized confirmation; research ends at this state.

| No. | Position / visible control | Observed affordance / limit | Source | Owner |
| --- | --- | --- | --- | --- |
| 61 | Content heading, upper right, Help | Currency documentation affordance; unopened | K281 + image | Currencies |
| 62 | Confirmation panel, left button, Change Home Currency | Change affordance; editor forbidden, unopened | K283–284 | Currencies |
| 63 | Confirmation panel, right button, Yes, Confirm Home Currency | Persisting confirmation; strictly forbidden, untouched | K285–286 | Currencies |

Reconciliation: 331 exported entries. Currencies has 57 distinct visible
controls: shared inventory IDs 1–54 plus 61–63. Shared sidebar, top bar and tabs
match Company Details: K3–278 source numbers match the C numbers above. Bottom
IDs 36–46 map to K306–316 (C304–314); ID 47 is screenshot-only in both states.
ID 48 is now inactive and ID 53 active. Company-only IDs 55–60 are absent.
The shared shell inventory therefore explicitly applies to this screenshot;
it is not an inferred inventory of a hidden state.

## Fields and metadata cross-check

| Requested concept | Initial-screen evidence | Limit |
| --- | --- | --- |
| Organization identity/contact | Read-only identity block with contact slots | Values omitted; editor unopened |
| Access address | Read-only address and copy/edit affordances | Address omitted; copy/edit untested |
| Organization time zone | Time Zone under Locale Information | Offset + name + region/city format; no selection opened |
| Country / locale | No such visible field on either initial screen | Do not infer its absence from the entire product |
| Date format | No visible field/sample | User settings and editors not researched |
| Number format | No visible field/sample | No decimal/grouping policy established |
| Home currency | Proposed name + ISO code on confirmation panel | Not confirmed; no saved-state equivalence assumed |
| Currency list / exchange rates | No list/rate on this initial state | Requires a write-dependent next state; unavailable |

Local `metadata/currencies.json` contains a `currencies` array with one entry.
Its field names include symbol, ISO code, name, active/base flags, exchange
rate, format, symbol placement and creation/modification metadata. Identity
and timestamp values are omitted. This is a previously exported data-model
snapshot, not proof of a currently visible table or confirmation status.
A base flag in metadata must not be equated with completion of the screen's
home-currency confirmation. No new metadata request was made.

## Actions, filters and flows

1. Navigate through the capture tool to the evidenced Company Details route
   `/crm/<org>/settings/company-details`. Observe only the initial page.
2. Read its Currencies tab destination from controls.json; independently open
   that destination with no click steps or editor opening.
3. Observe the unconfirmed home-currency state and stop before Change or
   Confirm. No save, add, activate, rate update, toggle or preference change.

Neither target presents a visible list filter, sort, pagination or record
search. Shell search inputs remain untouched. No application validation,
post-save outcome, empty-result search, permission-denied state, loading
state or recovery flow was triggered. Hidden modal placeholders in the
control export are not evidence of open dialogs.

## Paint gate and non-GET safety audit

Both screenshots were visually inspected and fully painted with the correct
active tab and target content. Both reached `done`. No failed script loads,
ready-time pending requests, editor, popup, print, download, file chooser or
Escape occurred. The known `_sortableParentData` page error remains in both
captures; its fully-painted settings-screen exception was accepted in R1.
Both also contain an invalid hovercard-origin console warning; no hover was
requested and no visible target content is missing. These diagnostics are
recorded, not interpreted as product error states.

| Capture | Exported controls | Distinct visible controls | API calls | Blocked POSTs | Successful non-GET |
| --- | --- | --- | --- | --- | --- |
| Company Details resume | 328 | 60 | 43 | 6 | One passive visitor POST, 200 |
| Currencies | 331 | 57 | 45 | 4 | One passive visitor POST, 200 |

Blocked requests, grouped by neutral destination:

| Destination / classification | Company Details | Currencies |
| --- | --- | --- |
| `/crm/<org>/ActivityReminder.do`, reminder polling | 1 | 1 |
| `/crm/<org>/crminotification.do`, notification status | 1 | 1 |
| Telemetry `/:id/ingest/infoLogs` | 1 | 0 |
| Telemetry `/:id/ingest/exceptions` | 1 | 0 |
| Telemetry `/:id/telemetry/urlMonitor` | 1 | 1 |
| Telemetry `/:id/telemetry/logs` | 1 | 1 |

Every blocked request remained refused. Each successful non-GET is the
page-initiated POST `/visitor/v2/<workspace>/livevisitors/<id>/triggers`, count
one, status 200, with the same visitor response shape previously classified
by the CTO as a passive visit trace in R1. No manual request/replay occurred.
There is no PageLayout POST, PUT, PATCH or DELETE in either network export.
No evidence of a reference record, setting or preference write was found.
The historical progress-only capture still has no auditable network output;
this current audit does not retroactively assert zero requests for that run.

## Open questions

1. Where are organization country/locale, date format and number format
   configured, and how do they interact with Personal Settings? The only
   organization locale field observed here is Time Zone. No MEP-496 or ADR
   0011 default should be inferred from the current account's display values.
2. What are the time-zone selector options, validation and propagation
   semantics? Not observable without opening a write-capable editor.
3. Which home-currency choices, formatting/precision and symbol-placement
   controls exist? The Change action was forbidden and unopened.
4. What currency table, active state, rate columns and actions appear after
   confirmation? Not observable without a write. The initial confirmation
   screen must not be replaced by an invented list in the implementation.
5. How is home-currency immutability enforced and what are save/activation,
   rate-update, success/error and permission behaviours? Visible guidance
   alone does not answer these write-dependent questions.
6. What do the screenshot-only bin and organization-image affordances do?
   The bin destination and any image hover action remain unverified; neither
   needs to be operated for this bounded research.

These are bounded evidence limits for UI Lead review, not requests to perform
writes. Any later expansion requires a separate scope decision while the
reference CRM remains strictly read-only.

## Verification and handoff

Screenshot-to-control reconciliation and current network/meta inspection
completed for both initial states. Neutral wording and value redaction were
checked. Only this spec changed; `docs/parity-checklist.md` is untouched.
`git diff --check` is the documentation check; no application code changed,
so application unit/e2e/typecheck runs are not applicable. UI Lead reviews
the spec and its explicit write-dependent limits.
