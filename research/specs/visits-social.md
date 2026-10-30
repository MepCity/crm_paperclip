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

## R2 — documentation-based functional spec (MEP-1272)

### Evidence boundary and source register

Public help pages reviewed on 2026-10-24. Everything in R2 is **documented,
not observed**; R1 remains the authority for painted controls. No capture tool,
integration, setup, association or reference account was operated. Documentation
can describe several UI generations; it does not prove current account
availability, positions, exact labels, default selections or error presentation.
No images, example records or provider assets are reused.

Source titles below are neutralized where necessary. Full provider URLs are
intentionally omitted under the repository naming rule. Section headings are
locators within the public reference CRM help center, not application routes.

| Source | Public page title (neutral wording) | Section locators |
| --- | --- | --- |
| D1 | Setting up visitor-tracking integration | Use Visits Tab; Standard Fields; CRM View for Visits Tab; Related Lists |
| D2 | Integrating CRM with visitor tracking | CRM – Visits; List View; Modifying the List View; Tracking your visitors inside CRM |
| D3 | Visitor Tracking — Overview | New Fields in Leads/Contacts Module; Related List; Attachments of Chat Transcripts |
| D4 | Visitor-tracking integration FAQs | Empty Visits; tab visibility; editions; notifications; setup conflicts |
| D5 | Working with the Social Tab | Dashboard; Monitor; Post; Activity Log; View Social Interactions |
| D6 | Social Profiles | Associating social media profiles; Components of the Social Related List |
| D7 | Setting up Social Tab / Manage Social Accounts | Create Brand in CRM; Add Facebook Page; Add X (Twitter) Handle; Enable Social Admin Permission |
| D8 | Using Visitor Tracking (developer guide) | Standard Fields; Records in the Visits Tab — corroboration only, vertical-application context |

D8 is supporting evidence, not a substitute for current CRM metadata. D1/D3 list
eight Visit Summary fields; D4 refers to seven without enumerating them in the
retrieved text. Preserve that discrepancy; do not change fields to force agreement.

### Visits: documented functional surfaces

Each row carries its evidence status and source page title. Unknown details
are explicit gaps rather than inferred generic CRM behaviour.

| Surface | Documented structure / boundary | Status and page title |
| --- | --- | --- |
| List columns | Configurable through Edit → Manage Columns; initial subset/order unspecified | documented — D2, Integrating CRM with visitor tracking |
| Views | All Visits; Today's Visits; Top Visits; Today's Top Visits; Visits by Leads; Visits by Contacts | documented — D2, Integrating CRM with visitor tracking |
| Filters | Tracking-account selector; precise criteria for “Top”, timezone and ordinary filter operators unresolved | documented — D2, Integrating CRM with visitor tracking; D1, Setting up visitor-tracking integration |
| CRM view | Customers, Potential Customers, Leads/Contacts groups | documented — D1, Setting up visitor-tracking integration |
| Row entry | Open a Visit to inspect details; inline edit/delete/clone/mass-action menus unspecified | documented — D1, Setting up visitor-tracking integration |
| Detail related lists | Actions Performed, notes, attachments; transcript may be attached | documented — D8, Using Visitor Tracking |
| Actions Performed fields | Action Type (Accessed/Navigation/Chat), Actions, Time Spent, Action Performed Time | documented — D1, Setting up visitor-tracking integration |
| Enabled-empty | Before incoming visits, Send to Webmaster link; removed after visits arrive | documented — D1, Setting up visitor-tracking integration |

Field catalog below is not a claim that every field is a visible list column.
Source D8 defines integration-populated, noneditable standard values; the rest
are corroborated by D1. Types are semantic fixture needs, not API metadata.

| Visit detail fields | Semantic fixture values | Status and page title |
| --- | --- | --- |
| IP Address; VisitedBy; Visited Page; Time Spent (Minutes) | Address; Lead/Contact reference; page; duration | documented — D8, Using Visitor Tracking |
| Referrer; User Agents; Attended By | Referral URL; client information; attending user | documented — D8, Using Visitor Tracking |
| Visited Page URL; Browser; Operating System; Portal Name | URL; client/platform; tracking portal | documented — D1, Setting up visitor-tracking integration |
| Visitor Type; Revenue; Visited Time; Search Keyword; Search Engine | Category; amount; timestamp; acquisition text | documented — D1, Setting up visitor-tracking integration |

**Record-level Visits:** D3, *Visitor Tracking — Overview*, documents a Visit
Summary on Leads/Contacts: Days Visited, Number Of Chats, Average Time Spent
(Minutes), Last Visited Time, First Visited Time, First Visited URL, Referrer,
Visitor Score. Its Visits related list contains IP Address, Visited Page, Time
Spent (Minutes), Referrer and Search Engine, with a portal selector. Chat
transcripts can accompany Lead/Contact records. This establishes module/field
scope; it does not establish a new business-card layout or an Accounts Visits
card. No shared hook should query Visits on every record module.

**Prerequisites:** D4, *Visitor-tracking integration FAQs*, documents paid CRM
and tracking-service editions, Visits tab visibility, Create Visits permission
and Add Visits Details configuration. Notification delivery additionally depends
on tracking rules, enabled embed/tracking, user membership and notification
settings. Missing permission/configuration can explain no data; it is not always
a genuine zero-visit result. D3, *Visitor Tracking — Overview*, requires tracking
code on the website and a Visits profile permission. Website publication and
integration association are write boundaries. Exact ownership verification,
consent presentation and account entitlement remain unverified; nothing here
authorizes installing code or enabling tracking.

### Social: documented functional surfaces

| Surface | Structure | Status and page title |
| --- | --- | --- |
| Dashboard | Conversation and Message tabs; network, brand and module filters | documented — D5, Working with the Social Tab |
| Monitor | Network columns, keyword/user search, refresh; column save/reorder controls change preferences | documented — D5, Working with the Social Tab |
| Post | Network posts, brand filter, composer and engagement actions | documented — D5, Working with the Social Tab |
| Activity Log | Current user's social actions, newest first | documented — D5, Working with the Social Tab |
| Record Social | Interactions/Messages, network/brand filters, Search & Associate | documented — D5, Working with the Social Tab |

**RC02/RC03 outcome:** D6, *Social Profiles*, documents profile association on
Leads, Contacts and Accounts. Associated X profiles expose basic information,
tweets and follower/following/likes counts; Facebook exposes basic information.
Profile Info has Unlink. Social Interactions differs from Streams (timeline/feed);
Tweet and Send DM are documented write actions. X lookup accepts name/handle;
an existing record handle may associate automatically. Facebook matching depends
on profile search privacy. These are documented outcomes, not confirmation that
the historical RC03 link currently opens a particular dialog. D6's “three
profiles” wording conflicts with its two enumerated networks; do not invent a
third network. D5 and D6 use different record section vocabulary; retain both
as documentation variants, without promising both layouts at once.

**Permissions/prerequisites:** D7, *Setting up Social Tab / Manage Social
Accounts*, requires Social Administrator for organization configuration, a brand
and an authorized Facebook Page or X handle. Facebook requires a Page. Profile
access and per-network action permissions are distinct; tab access alone can
show no data with an administrator-contact instruction. Removing Social Admin
does not itself remove read access. Brand allowance depends on edition; exact
current entitlement is unknown. D6, *Social Profiles*, names Social Profile or
Social Tab access and profile privacy constraints. A usable brand account or
personal authentication is required for interaction. Authorization expiry,
matching failures and service errors are not specified sufficiently for parity.

### Proposed documented control inventory

**Documented, not observed.** IDs below are functional candidates, not a complete
painted inventory or evidence of position. They do not replace V/SO/RC IDs.
Owners: Visits/Social respectively; existing list and record shells retain
navigation ownership. “Boundary” means represent only under an approved local
policy; do not execute on the reference or connect a real service.

| ID | Candidate / context | Source page title | Proposed local treatment |
| --- | --- | --- | --- |
| VD01 | Tracking-account selector, Visits | D2 — Integrating CRM with visitor tracking | In-memory fixture scope |
| VD02 | Six predefined views, Visits | D2 — Integrating CRM with visitor tracking | Local selection; Top criteria need approval |
| VD03 | Edit / Manage Columns, list | D2 — Integrating CRM with visitor tracking | Preference boundary; no persistence |
| VD04 | List / CRM view choice | D1 — Setting up visitor-tracking integration | Approved fixture mode only |
| VD05 | Visit row → detail | D1 — Setting up visitor-tracking integration | Existing read-only detail component |
| VD06 | Notes / attachment actions, detail | D1 — Setting up visitor-tracking integration | Write boundary |
| VD07 | Send to Webmaster, enabled-empty | D1 — Setting up visitor-tracking integration | Send boundary |
| VD08 | Portal selector, Lead/Contact Visits related list | D3 — Visitor Tracking — Overview | Local fixture scope |
| SD01 | Dashboard / Monitor / Post / Activity Log | D5 — Working with the Social Tab | Fixture navigation |
| SD02 | Conversation / Message; network / brand / module filters | D5 — Working with the Social Tab | In-memory fixture filters |
| SD03 | Monitor search / refresh | D5 — Working with the Social Tab | Local fixture results |
| SD04 | Monitor add/save/remove/reorder columns | D5 — Working with the Social Tab | Preference boundary |
| SD05 | Compose / engage / Add to CRM | D5 — Working with the Social Tab | Publish and record-write boundaries |
| SD06 | Search / Associate profile, record | D6 — Social Profiles | Association boundary |
| SD07 | Profile Unlink, record | D6 — Social Profiles | Association boundary |
| SD08 | Interaction channel choice / account choice | D6 — Social Profiles | Fixture scope only |
| SD09 | Tweet / Send DM / reply / like / comment | D6 — Social Profiles | External-write boundary |
| SD10 | Brand / account settings | D7 — Setting up Social Tab / Manage Social Accounts | Setup boundary |

### U1–U6 disposition

“Answered” would require the whole question, including current account behaviour,
to be resolved. Public documentation narrows structure but cannot certify an
enabled installation. Existing R1 wording stays intact as the historical baseline.

| Question | R2 disposition | Implementation consequence |
| --- | --- | --- |
| U1 | partly — D3/D4 prerequisites documented; consent/ownership checks unknown | Model readiness explicitly; no setup or tracking implementation |
| U2 | partly — D1/D2/D3/D8 fields, views and related lists documented; default columns, Top criteria, row menus unknown | Fixture list can use an explicitly proposed subset; no claimed live schema or arbitrary row actions |
| U3 | partly — D7 organization/brand/authorization and permissions documented; current licensing unknown | Separate disconnected, denied and available fixture states; no live connect |
| U4 | partly — D5/D6 association, streams and write affordances documented; precise errors and RC03 flow unknown | Associated fixture read surfaces only; writes require separate approved scope |
| U5 | partly — D3 documents conditional Lead/Contact Visits; D6 supports Social in Leads/Contacts/Accounts; current installation unobserved | Guard by supported module and availability; retain historical-card caveat |
| U6 | still open — no reviewed page identifies R1 tray/bin control or carousel persistence | Leave with shared-shell/research owner; no inferred action or saved preference |

### Suggested S3/S4 implementation slices (proposals only)

These are delivery suggestions, not approved implementation tasks or permission
to expand S1/S2. Reuse existing list/record components and original neutral
artwork. Fixture shapes are internal view data; no API contract, migration or
reference metadata change is proposed. Keep unsupported modules free of new
requests. Retain disconnected introductions separately from enabled-empty,
permission-denied and populated fixture states. Loading/error visuals remain
local conventions pending evidence; do not claim them as observed parity.

- **S3 — Visits read-only fixtures:** approved subset of the field catalog,
  VD01/VD02/VD05, detail fields and Actions Performed, Lead/Contact summary and
  related list with VD08. Reuse existing record sections and navigation. Obtain
  UI Lead's choice of provisional columns and Top-view fixture membership;
  do not invent ranking logic. Keep setup, sends, column persistence, notes and
  uploads unavailable with an explicit local explanation. Test state separation,
  field rendering, supported-module guards and absence of external writes.
- **S4 — Social read-only fixtures:** SD01/SD02, fixed Monitor columns and
  associated record profiles/interactions, with Lead/Contact scope first.
  Treat Accounts as a separately enumerated extension if approved. Choose one
  documented record-layout variant explicitly. Render association and outbound
  actions under a visible local unavailable policy; do not mutate local records
  as if synchronization succeeded. Test channel/brand fixture scoping, allowed
  modules, disconnected/denied/populated states and zero outbound requests.

S3/S4 acceptance must explicitly label documentation-derived behaviour. No
populated-state capture completeness or Module 15 gate is asserted by R2.

## W4 write-window disposition — 2026-10-25

MEP-1346 includes only Visits/Social states reachable **without connecting an
external account**. The final Platform Lead decision in
[MEP-1355](/MEP/issues/MEP-1355#comment-68b28723-d4fb-4860-b352-c92690ff7d75)
also covers W4: no live write observation without a proven endpoint/body/restore
contract, and no synthetic policy presented as a live contract. No new capture
or connection attempt was made. The R1 disconnected introductions remain the
painted baseline; R2 enabled-state documentation remains documentation only.

### Visits and Social gap inventory

| ID | Requested scope | W4 disposition / missing evidence |
| --- | --- | --- |
| VW01 | Visits settings/states reachable without an external account | Open / no fresh observation. R1 introduction and R2 prerequisites do not establish a configuration form, current permissions, enabled-empty state or save validation |
| SW01 | Social settings/states reachable without an external account | Open / no fresh observation. R1 introduction and R2 permission vocabulary do not establish this account's brand settings, denied state or validation |
| SW02 | Distinguish disconnected, denied, expired authorization and service error | Open. Earlier introduction evidence does not certify those other states or their literal messages; no authentication or integration fault was induced |
| VSX01 | External-account authorization, tracking setup and social connection | Excluded by the W4 scope; not attempted and not a newly approved follow-up |

VW/SW IDs track gaps, not screenshot-certified controls. No new numbered
painted inventory, success/error/validation text, loading behaviour or setting
defaults were obtained. Existing V/SO/RC and documented VD/SD inventories retain
their stated provenance. No new endpoint, request shape or restoration method
is inferred. Existing captures were not replayed merely to restate entry states.

### Audit and next boundary

W4 did not open the reference CRM, connect a service, create a brand, install
tracking, associate/unlink a profile, publish/send/interact or change settings
or preferences. No `ZZTEST-` object was created and there is no W4 restoration
action. The local window journal still contains only its empty table scaffold;
this does not replace [W5](/MEP/issues/MEP-1347) global verification.

The existing independent review stage checks gap documentation and evidence
limits, not enabled-state parity. No ADR/module-gate acceptance is claimed.
A future supported live observation requires the separate single-flow approval
path in MEP-1355; external connections remain outside this task's scope.


## W4 continuation — 25 October 2026

Fresh `w4-visits-continuation` first caught a centered **Yükleniyor** state.
It is a transient loading observation, not an empty or permission state.
`w4-visits-settled` waits twelve seconds and paints the visitor-tracking
introduction: a promotional carousel, previous/next arrows, six indicator dots,
explanatory heading/text, and blue Başlarken action below. No visit list,
configuration field or existing integration is visible. Promotional content is
not customer data and must not be copied as application assets.

`w4-social-continuation` also waits twelve seconds. It paints the unconnected
social introduction: centered social-network illustration, explanatory text and
green Başlayalım action. No social feed, publishing composer, account settings
or existing connection is visible. The earlier R1 resting-state boundary holds.

| ID | Visible state/control | Observation and boundary |
| --- | --- | --- |
| VC01 | Visits loading indicator | Captured before settled introduction; no final error inferred |
| VC02 | Visits carousel and indicators | Visible introduction; not operated or treated as live visits |
| VC03 | Başlarken | Setup entry visible; not invoked because no external integration is authorized |
| SC01 | Social introduction illustration/text | Unconnected account entry state |
| SC02 | Başlayalım | Setup entry visible; no connection, authorization or publishing performed |

Screenshots were inspected alongside controls.json and aria.yml. The quick
Visits capture has one blocked legacy background POST; settled Visits has three
background blocks; Social has two. No requested clicks, inputs, downloads or
writes were performed in these captures. Settings, profile association and
publishing behaviour remain unobserved; no network/payload or success/error
contract is invented. VW01, SW01 and SW02 remain bounded by the unconnected
state; VSX01 external-account connection remains excluded by the board.


## W4 final scope disposition — 26 October 2026

The board's 00:25 Istanbul answer accepts the captured Visits loading/settled
introduction and disconnected Social introduction as sufficient W4 live
coverage. It directs closure without another live attempt, tool repair or
guard relaxation. This supersedes the earlier pending-route disposition.

VW01 and SW01 have live entry-state coverage only. Settings, enabled views,
profile association, publishing and SW02 denied/expired/service-error states
remain **not observed, documentation-based** to the extent supported by the
existing R2 VD/SD sources. Unsupported messages and account-specific behaviour
remain unknown. VSX01 external authorization/tracking/social connection stays
excluded; no external account was connected and no message was sent.

No Visits/Social object or setting was created. The historical empty-journal
statements predate the Analytics experiment: final shared W4 allowedWrites=3,
with that test dashboard board-deleted and absence-verified. The existing
`w4-unsaved-exit-audit` has no open W4 object or setting; the separately retained
W2 Documents item remains outside this claim. No fresh reference action or
cleanup flag was issued for closure. [W5](/MEP/issues/MEP-1347) owns window-wide
verification; its board-named 05:00 Istanbul check is not scheduled or certified
by this document. This bounded W4 delivery is ready for independent review;
no enabled-state parity, architecture or module-gate acceptance is claimed.
