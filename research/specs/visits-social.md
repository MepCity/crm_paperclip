# Visits and Social — R1 read-only research

## Purpose and evidence boundary

MEP-1257 records the current Visits and Social entry states under Module 2+
inventory parity. Both are integration introductions, not empty record tables.
This document certifies the observed resting states only. No external service
was connected, tracking installed, profile associated or preference operated.
No implementation or module gate is claimed.

Screenshots, controls.json and aria.yml were reconciled manually. Wrapper and
nested button/link exports represent one user control. Containers, decorative
images, static headings and hidden dialogs are not additional controls. An
export outside the clipped viewport is not treated as visible. Names below are
neutral where the original label contains reference branding. Icons, fonts,
illustrations and promotional screenshots must be recreated independently.

## Capture refs and safety ledger

Evidence stays in the local research workspace. Screenshots contain account or
record information and are not committed or uploaded.

| Slug | Date (UTC) | Navigation / steps | Paint gate | Blocked requests |
| --- | --- | --- | --- | --- |
| `m15r1-visits-entry` | 2026-10-24 | Direct neutral Visits route; 0 clicks, 0 steps | `[data-zcqa="tab_Visits"]`; passed, 62 ms | 3: reminder retrieval, notification status, exception telemetry POSTs |
| `m15r1-social-entry` | 2026-10-24 | Direct neutral Social route; 0 clicks, 0 steps | `[data-zcqa="tab_Social"]`; passed, 35 ms | 2: reminder retrieval and notification status POSTs |

Both ran sequentially with a 12-second final wait and unchanged guards. All six
base files exist. Both gates use a shell navigation element; the screenshots
independently confirm that the destination body painted. No failed scripts were
reported by either gate. Shell/router/sortable errors remain in diagnostics;
they are limitations of the observation, not product requirements. No capture
failed and no retry was performed. No skipped clicks, allowed-open exceptions,
automatic Escape, file chooser, download or print occurred. No successful
reference mutation is evidenced.

Existing record evidence was inspected locally, without reopening the reference:

| Slug | Original date (UTC) | Original actions / blocks | Use here |
| --- | --- | --- | --- |
| `leads-detail` | 2026-10-04 | 1 click; 1 blocked request; predates explicit paint-gate metadata | Screenshot-visible Social related-list entry; card content is export-only below the viewport |
| `m2d2-card-invoices` | 2026-10-11 | 2 clicks; 8 blocked requests; predates explicit paint-gate metadata | Screenshot-visible Contact Social card; existing Contacts spec D-87/D-88 and card ledger |

Those historical actions were not replayed. Full original control inventories
remain owned by `leads.md` and `contacts-record-detail.md`; only Module 15
record affordances are extracted here. Old record evidence is not a current
account-state or newly captured screen claim.

## Layout and fields

Visits retains the shared shell and a Visits title. The body contains a visitor
tracking heading, an external tracking-service attribution, a promotional
carousel image, feature heading and explanatory text, six slide indicators,
previous/next arrows and a Get Started action. The first indicator is active.
The sample table and visitor panel inside the promotional image are pixels,
not live records or controls. No list columns, row actions, module search,
view/filter/sort selector, period selector or pagination is exposed.

Social retains the same header and utility strip, with Social selected. Its body
contains a social-account illustration, account-linking guidance and one setup
action. No brand selector, streams, posts, messages, channels, filters, periods,
composer or toolbar specific to Social is visible. The rail is automatically
positioned further down on entry; no scroll or preference action was requested.

No editable fields or record values are displayed in either module body.
Visits metadata has null fields/custom views/related lists and a Standard
layout with empty sections. This does not establish a visit-record schema.
No dedicated Social module directory exists in the inspected metadata export.
A populated data model must not be inferred from either introduction.

## Control inventory — shared shell in both new entry captures

Source for every S row: both new screenshots and corresponding controls.json;
all behaviours beyond the resting affordance are untested. Owner is shared
shell unless a destination module is explicitly named. This inventory applies
independently to each entry screen with the visibility differences recorded.

| # | Position / control | Observed state and boundary |
| --- | --- | --- |
| S01 | Rail header: application switcher | Closed; neutral name, branding omitted |
| S02 | Rail header: Hide Menu | Unoperated preference control |
| S03 | Rail: Home | Existing navigation link; Home owner |
| S04 | Rail: Workqueue | Existing navigation link; Workqueue owner |
| S05 | Rail: Reports | Existing navigation link; Reports owner |
| S06 | Rail: Analytics | Existing navigation link; Analytics owner |
| S07 | Rail: Agents | Existing navigation link; Agents owner |
| S08 | Rail: MCP | Existing navigation link; MCP owner |
| S09 | Rail: teamspace selector | Closed |
| S10 | Teamspace: More Actions | Closed |
| S11 | Teamspace: Search | Empty textbox; no typing |
| S12 | Rail: Sales group | Collapsed in Visits; clipped above Social module viewport |
| S13 | Rail: Activities group | Expanded in Visits; clipped in Social |
| S14 | Rail: Tasks | Visible in Visits; clipped in Social; Activities owner |
| S15 | Rail: Meetings | Visible in Visits; clipped in Social; Activities owner |
| S16 | Rail: Calls | Visible in Visits; clipped in Social; Activities owner |
| S17 | Rail: Integrations group | Expanded in Visits; clipped in Social |
| S18 | Rail: Visits | Selected in Visits; partially clipped beneath search in Social; M15 |
| S19 | Rail: Price Books | Visible in both; destination owner |
| S20 | Rail: Products | Visible in both; destination owner |
| S21 | Rail: Quotes | Visible in both; destination owner |
| S22 | Rail: Invoices | Visible in both; destination owner |
| S23 | Rail: Sales Orders | Visible in both; destination owner |
| S24 | Rail: Solutions | Visible in both; destination owner |
| S25 | Rail: Social | Visible in both, selected in Social; M15 |
| S26 | Rail: Forecasts | Visible in Social only; destination owner |
| S27 | Rail: Purchase Orders | Visible in Social only; destination owner |
| S28 | Rail: Vendors | Visible in Social only; destination owner |
| S29 | Rail: SalesInbox | Visible in Social only; email owner |
| S30 | Rail: Cases | Visible in Social only; Cases owner |
| S31 | Rail: My Jobs | Visible in Social only; destination owner |
| S32 | Rail: Services | Top fragment visible at Social lower edge; destination owner |
| S33 | Rail right edge: resize handle | Exported affordance, narrow boundary; never dragged |
| S34 | Header: Search records | Closed global search |
| S35 | Header: plus icon | Global create affordance; unopened |
| S36 | Header: assistant icon | Neutral name; unopened |
| S37 | Header: Notifications | Unopened |
| S38 | Header: Calendar | Existing navigation affordance; unopened |
| S39 | Header: Marketplace | Unopened |
| S40 | Header: Setup | Unopened; forbidden settings boundary |
| S41 | Header: Profile | Unopened |
| S42 | Header: Applications menu | Unopened |
| S43 | Bottom left: My Pins | Unopened |
| S44 | Bottom left: Chats | Unopened |
| S45 | Bottom left: Contacts | Communication utility, not the CRM Contacts module |
| S46 | Bottom right: command palette icon | Unnamed in screenshot; identified by exported data attribute |
| S47 | Bottom right: Announcements | Unopened |
| S48 | Bottom right: Motivator | Unopened |
| S49 | Bottom right: Sticky Notes | Unopened |
| S50 | Bottom right: Activity Reminders | Unopened |
| S51 | Bottom right: Recent Items | Unopened |
| S52 | Bottom right: Accessibility | Unopened |
| S53 | Bottom right: Help | Unopened |
| S54 | Far bottom right: tray/bin icon | Screenshot-visible, no matching named interactive export; purpose unresolved U6 |

Projects is exported below the Social viewport and is excluded from its visible
inventory. Hidden dialogs, duplicate decorative SVGs and zero-size frames are
also excluded. Group headers and module exports can retain nonzero boxes while
clipped beneath the fixed rail header; screenshot visibility takes precedence.

## Control inventory — Visits body (V0)

Source: `m15r1-visits-entry` screenshot, controls.json entries 106–115 and aria.
Owner for V rows: Module 15. No V control was operated.

| # | Position / control | Observed behaviour / boundary |
| --- | --- | --- |
| V01 | Carousel left: previous arrow | Button role, no accessible name or unique selector exported; untested |
| V02 | Below feature text: indicator 1 | First dot active; button role, data-value 0 |
| V03 | Indicator 2 | Inactive; button role, data-value 1 |
| V04 | Indicator 3 | Inactive; button role, data-value 2 |
| V05 | Indicator 4 | Inactive; button role, data-value 3 |
| V06 | Indicator 5 | Inactive; button role, data-value 4 |
| V07 | Indicator 6 | Inactive; button role, data-value 5 |
| V08 | Carousel right: next arrow | Button role, no accessible name or unique selector exported; untested |
| V09 | Bottom centre: Get Started | Setup boundary; never clicked |

No other live body control was present. Carousel persistence, slide timing and
setup destination are unknown; the promotional image is not a schema source.

## Control inventory — Social body (SO0)

Source: `m15r1-social-entry` screenshot, controls.json entries 120–121 and aria.
Owner: Module 15. Common shell S01–S54 applies with the visibility above.

| # | Position / control | Observed behaviour / boundary |
| --- | --- | --- |
| SO01 | Below guidance: Let's Get Started | One button, wrapper `#getStarted`; setup boundary, never clicked |

The illustration and guidance are static. No channel-specific live controls are
present; the two service symbols in the illustration are not connect buttons.

## Existing record-level affordances

Source: `m2d2-card-invoices` screenshot reconciled with its controls and the
Contacts record-detail spec. This is the unassociated-profile state. The Social
card follows Campaigns; it has a title, left association panel and a right
illustration/guidance panel. Guidance says Facebook association is initiated
from the Social tab; it does not establish an association flow or permission.
No profile name, handle, post, engagement metric, counter or visitor history is
shown. Other Contacts controls retain the existing spec's inventory.

| # | Position / control | Observed state / owner |
| --- | --- | --- |
| RC01 | Contact related-list rail: Social | Visible navigation entry; M15 / record shell |
| RC02 | Social card, left upper: Associate Twitter | Visible link affordance; unoperated; M15 |
| RC03 | Social card, left lower: Associate Facebook | Visible link affordance; unoperated; M15 |
| RC04 | Right lower floating up-arrow | Visible record navigation affordance; unoperated; record shell |
| RL01 | Lead related-list rail: Social | Visible in `leads-detail`; unoperated in this research; M15 |

The Lead export includes a Social complementary region with the same two links,
but that region is below the screenshot viewport: not a painted Lead card claim.
No Visits card or Visits related-list entry is visible in either inspected
record screenshot. The global Visits navigation item is not a related list.
No claim is made that Visits is absent from all records or configurations.

## Flows and state boundaries

1. Navigate to Visits: shell and V0 introduction render; stop before setup or
   carousel interaction. A populated list and a zero-visits table remain unknown.
2. Navigate to Social: shell and SO0 account-linking introduction render; stop
   before SO01. No connection, brand creation, publishing or reply flow studied.
3. Existing record evidence: identify Social rail entry and unassociated Contact
   card. Stop before RC02/RC03; no profile lookup or association was attempted.

No validation, submit outcome, permission failure or server-error state was
exercised. A disconnected integration introduction must remain distinct from
an enabled integration with zero records. Captured runtime diagnostics must not
be designed as expected user-facing errors.

## Open questions

- U1: Which external tracking account, website ownership, script installation,
  consent and permissions are prerequisites for enabled Visits? Setup requires
  writes and is outside this research; no live installation is authorized.
- U2: What Visits columns, filters, row actions, detail fields and record-level
  visitor cards appear after enablement? No live data screen is observable here.
- U3: Which social accounts, brands, service permissions and licensing unlock
  streams? No setup screen or connected-account evidence was inspected.
- U4: What profile matching, association, removal, stream/post/reply and error
  behaviours exist? Not observable without setup or writes; no inferred contract.
- U5: Are historical Lead/Contact Social affordances still current, and when does
  a Visits card appear? Older record evidence is explicitly bounded above.
- U6: What does the unnamed bottom-right tray/bin affordance do? No identifying
  interactive export; not clicked. Carousel persistence is also unobserved.

These questions are research boundaries for UI Lead review, not a request to
connect services or permission to change the reference. Public-documentation
research or later safe evidence can narrow them in a separately scoped issue.

## Suggested first implementation slice (proposal only)

After research approval, implement fixture-backed disconnected Visits and Social
entry states within the existing shell. Reuse existing navigation and button
components; supply original, neutral artwork. Fixtures represent integration
availability and disconnected state, not a fabricated Visit schema. Keep setup
controls visibly represented with an explicit local unavailable explanation;
this is a proposed local boundary requiring approval, not observed behaviour.
Do not connect an external service or send reference-like integration writes.

Reuse the existing record card for the fixture-backed unassociated Contact
Social state and existing related-list navigation; do not add a global record
hook or infer a Visits card. Approval should resolve whether to include this
historical card in the first slice. Local tests should distinguish disconnected
introductions from enabled-empty tables, verify all body controls and ensure
setup/association controls issue no external writes. Populated lists, tracking,
streams and publishing remain separate evidence-dependent work.
