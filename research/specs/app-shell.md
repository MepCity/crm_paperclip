# Application shell and Home skeleton

## Purpose

Provide the persistent navigation needed to reach Leads and identify the currently active module. Document the Home view currently presented by the reference CRM without treating its onboarding content as a required Leads feature. Scope labels below mean **needed for Module 1** or **later**.

## Layout

| Region or element | Observed structure and behavior | Scope |
| --- | --- | --- |
| Left navigation rail | Persistent full-height menu beside the main content. A top product selector and a `Hide Menu` control precede navigation. Home is visibly selected on the Home route; Leads is selected after following its link. The menu can be hidden, but the resulting collapsed state was not captured. | needed for Module 1: persistent rail, active module, hide control |
| Pinned links | Home, Workqueue, Reports, Analytics, Agents, and MCP Server appear above the teamspace section, in that order. | needed for Module 1: Home entry; later: other links |
| Teamspace navigation | A named teamspace selector, a local Search box, and grouped module links appear below pinned links. Sales is expanded and shows Leads, Contacts, Accounts, Deals, Documents, Campaigns. Activities is expanded and shows Tasks, Meetings, Calls. Integrations is expanded and shows Visits. Price Books and Products appear in additional regions lower in the rail. | needed for Module 1: teamspace container, Sales group, Leads link; later: other groups, links, local search |
| Teamspace overflow | `More Actions` opens New Teamspace, Create Folder, Add Modules, Manage CRM Teamspace, and View All Teamspace. No option was executed. | later |
| Top bar | Current page title at left. At right: global record search, quick-create `+`, assistant shortcut, notifications, calendar, extensions/store, settings, user avatar, and applications menu. Calendar and settings have navigable links; their destinations were not opened. | needed for Module 1: page title; later: the other entries unless Leads workflows explicitly require them |
| Bottom utility strip | Persistent utility controls include pins, chat, channels, threads, contacts, announcements, reminders, recent items, accessibility, and help. | later |
| Main content | On `/crm/<org>/tab/Home/begin`, the active view is an onboarding/setup welcome page. It has an introductory area and a setup checklist area; no list, counter, or chart dashboard widgets are displayed. | later |

The current interface has **no horizontal module tab bar**. The rail and its groups serve that navigation role. Module links use `/crm/<org>/tab/<Module>/...`; the Leads rail link targets `/tab/Leads`, and following it resolved to `/tab/Leads/custom-view/<viewId>/list`. Home uses `/tab/Home/begin`. `<org>` and `<viewId>` are placeholders, not literal values.

The module metadata records 33 `show_as_tab` entries. In `sequence_number` order they are: Home (1), Workqueue (2), Leads (3), Contacts (4), Accounts (5), Deals (6), Tasks / Meetings / Calls (7), Reports (8), Analytics (9), Products (10), Quotes (11), Sales Orders (12), Purchase Orders (13), Invoices (14), Feeds / SalesInbox (15), Campaigns (17), Vendors (18), Price Books (19), Cases (20), Solutions (21), Documents (22), Forecasts (23), Visits (24), Social (25), Emails (35), CommandCenter (56), Automation Cadences (106), Cadences Followups (107), Entity Cadences (108), and My Jobs (119). Feeds is marked `visible: false`; the other 32 are marked visible. This metadata order is not the rendered rail order. Only the Home and Leads route/selection were verified. See the external research workspace's `metadata/modules.json` for full module configuration and `metadata/profiles.json` for the two configured profile types; the captures do not establish profile-specific menu differences.

### Visual layout

All values are measured from screenshot. The 2940 × 1670 image corresponds to a **1470 × 835 CSS px viewport at 2 image px per CSS px**: the straight top-bar rule at image rows 98–99, rail separator at rows 554–555, and open-menu dividers at rows 778–779 and 860–861 each occupy exactly two image pixels (`home-main`, `home-more-actions`). Coordinates below use the viewport's top-left corner as `(0, 0)` and all dimensions are CSS px. Flat interior pixels, rather than softened edges, supply hex colours. Text colours use the darkest solid glyph pixels and are **approx.**; type sizes are **approx.**, inferred from measured cap and x-height; CSS line-height is **not measurable from capture** because each label appears on a single line. Visible row bounds and glyph top–bottom positions are reported separately. The type has a rounded humanist sans-serif feel with ordinary tracking; the exact font is not measurable from capture (`home-main`).

| Region / element | Property | Value | State | Capture | Note |
| --- | --- | --- | --- | --- | --- |
| Navigation rail | Bounds and surface | x 0–320, y 0–807; 320 wide; `#223458` | Home and Leads | `home-main`, `home-leads-navigation` | Full-height above the utility strip; sharp edge at x 320, with no distinct right border. |
| Top bar | Bounds and surface | x 320–1470, y 0–50; 50 high; `#FFFFFF` | Home and Leads | `home-main`, `home-leads-navigation` | Bottom rule at y 49–50 is 1 px `#DCDBEE`; no separate shadow band is visible. |
| Main content | Bounds and page surface | x 320–1470, y 50–807; 1150 × 757; Home `#FFFFFF`, Leads `#EEF1F9` | Route dependent | `home-main`, `home-leads-navigation` | The Home onboarding composition is outside this measurement. A shell-wide content inset is **not measurable from capture**; the Leads list has its own panels and toolbar. |
| Bottom utility strip | Bounds, surface, and elevation | x 0–1470, y 807–835; 28 high; `#FFFFFF` | Home and Leads | `home-main`, `home-leads-navigation` | A light shadow occupies about 7 px above it (y 800–807, from `#FEFEFE` to about `#E7E7E7` over white); exact blur parameters are **not measurable from capture**. Left tool cluster occupies x 0–290; right cluster begins at x 1017. |
| Rail/product selector | Visible occupied box | x 15–150, y 11–41; 30 high | Default | `home-main` | Product mark occupies x 15–45, 30 × 30; recreate it with an original asset. Label begins near x 53; down chevron near x 138–148. Label approx. 16 px semibold; visible cap y 20–31, x-height y 23–31; CSS line-height is **not measurable from capture**; `#C2CBDE` approx. |
| Rail/Hide Menu | Icon bounds | x 285–303, y 17–33; approx. 18 × 16 | Default | `home-main` | Functionally named `Hide Menu`; no labelled button box or collapsed result was captured. Icon colour approx. `#C2CBDE`. |
| Rail/pinned rows | Row box and rhythm | x 10–310; 300 wide × 30 high; starts y 55, then 36 px vertical pitch | Home selected | `home-main` | 10 px side inset; 6 px between rows. The six pinned entries end above the y 277 separator. Later entries need only this footprint. |
| Rail/pinned link | Icon, label, and type | icon approx. 16 × 16 at x 20–36; label starts x 48; approx. 12 px gap; label approx. 15 px regular; CSS line-height is **not measurable from capture**; `#C2CBDE` approx. | Unselected | `home-main` | Workqueue glyph core spans 26 image px (13 CSS px) including descender; coloured link icons vary by function and should be redrawn. |
| Rail/active row | Box, fill, text, indicator | x 10–310, 300 × 30; `#31446F` fill; approx. 6 px radius; `#FFFFFF` approx. 15 px semibold; CSS line-height is **not measurable from capture**; no side indicator | Home selected | `home-main` | Home occupies y 55–85. Flat fill starts at x 10 on its midline; no separate indicator-colour run. |
| Rail/active row | Box, fill, text, indicator | x 10–310, y 394–424; `#31446F` fill; `#FFFFFF` approx. label and icon; no side indicator | Leads selected | `home-leads-navigation` | Same 30 px row height and approx. 6 px corners. A trailing more-actions icon appears within this row. |
| Rail/scrollbar | Visible thumb | x 312–320, y about 356–578; 8 px wide; `#AAAAAA` | Leads route only | `home-leads-navigation`, `home-main` | Visible along the rail right edge in the Leads capture; absent in Home. |
| Rail/teamspace divider | Position and rule | y 277–278; 1 px `#505D81` across rail | Default | `home-main` | Separates pinned links from teamspace. |
| Rail/teamspace selector | Occupied row | y 289–313; about 24 high; left inset 13 px | Default | `home-main` | 24 × 24 coloured monogram block at x 13–37, text begins x 42; chevron near x 169–180; label approx. 16 px semibold; cap y 295.5–306.5, x-height y 298–306; CSS line-height is **not measurable from capture**; `#C2CBDE` approx. The selector itself has no measured enclosing border. |
| Rail/teamspace overflow trigger | Icon bounds | x 288–302, centred near y 301; approx. 14 × 4 | Closed / open | `home-main`, `home-more-actions` | Open trigger gains `#374D7F` fill in a 30 × 30 box at x 280–310, y 286–316. |
| Rail/local Search | Input box | x 10–310, y 324–354; 300 × 30; transparent/`#223458` fill, 1 px `#505D81` border, approx. 6 px radius | Empty | `home-main` | Search icon approx. 15 × 15 at x 20–35; placeholder starts x 41, approx. 15 px regular; cap y 333–344, x-height y 336.5–344; CSS line-height is **not measurable from capture**; `#7A859B` approx. Later feature: retain this footprint. |
| Rail/group heading | Row, icon, label, chevron | Sales row centred at y 377, about 30 high; icon approx. 14 × 14 at x 21–35; label begins x 48; chevron at x 287–297 | Expanded | `home-main`, `home-leads-navigation` | Approx. 15 px semibold, `#C2CBDE` approx.; cap y 371–382, x-height y 374–382; CSS line-height is **not measurable from capture**; the folder icon is solid `#5464F2`; top gap after local Search is about 9 px. The upward chevron denotes the observed expanded state. |
| Rail/nested link | Row and indent | Leads row y 394–424; about 30 high; 32 px pitch; icon approx. 16 × 16 at x 48–64, label starts x 78 | Unselected / selected | `home-main`, `home-leads-navigation` | Approx. 15 px regular, `#C2CBDE` approx. when unselected; cap y 403–414, x-height y 406–414; icon `#7D8AA7` when unselected and `#FFFFFF` when selected; CSS line-height is **not measurable from capture**; selected styling is the active row above. Indent from fixed-link label is 30 px. |
| Rail/groups below Sales | Position and footprint | Activities heading near y 601, Integrations near y 729; same heading and child-row geometry | Expanded | `home-main` | Later content. The screenshot shows expanded chevrons and child links; lower entries continue under the strip's top edge. |
| Top bar/page title | Position and type | left x 336 (16 px from content edge), glyph top near y 17; approx. 20 px semibold, `#313949` approx. | Home / Leads | `home-main`, `home-leads-navigation` | Text changes with route; measured cap is 26 image px = 13 CSS px, x-height 10 CSS px, and ascender height up to 14 CSS px. The approx. 20 px size follows these three heights; CSS line-height is **not measurable from capture**. |
| Top bar/global search | Footprint | x 929–1164, y 8–40; 235 × 32; `#EEF1F9` fill, approx. 6 px radius | Closed | `home-main` | Later feature. Search glyph approx. 17 × 17; placeholder approx. 14 px regular, `#8C91AB` approx. |
| Top bar/right controls | Order, sizing, spacing | search → quick create → assistant → bell → calendar → store → settings → avatar → applications; icon centres roughly 34 px apart after quick create | Default | `home-main` | Later controls except title. Quick-create box x 1176–1204, y 10–38 (28 × 28), 1 px `#5464F2` border, approx. 6 px radius; other line icons about 18 × 18, `#616E88` approx. Avatar is about 30 × 30 circular; applications grid is about 18 × 18. |
| Main and strip boundary | Position | content ends at y 807; strip overlaps the viewport bottom | Home / Leads | `home-main`, `home-leads-navigation` | The strip's left cluster is five roughly 58 px slots; right cluster uses roughly 49 px icon cells and a wider Help cell. These are later controls. |

**Open layers and visible states.** The `More Actions` trigger is open in `home-more-actions`; the first menu row is highlighted, but whether that highlight is hover, focus, or default selection is **not measurable from capture**. The global search panel is open in `home-search`; its dimmer also covers the rail and top bar, while the utility strip remains bright.

| Region / element | Property | Value | State | Capture | Note |
| --- | --- | --- | --- | --- | --- |
| Teamspace More Actions menu | Outer bounds and placement | x 328–565, y 286–473; about 237 × 187 | Open | `home-more-actions` | Starts level with the trigger's top and about 18 px to its right; a small left-pointing notch reaches x 322. |
| Teamspace More Actions menu | Surface, edge, corners, shadow | `#FFFFFF` fill; 1 px `#CED0E1` edge; approx. 6 px radius | Open | `home-more-actions` | Soft grey shadow is visible outside the edge; blur/spread and opacity are **not measurable from capture**. |
| Teamspace More Actions menu | Item geometry | inner horizontal inset 6 px; first three visible bands about 30 px high; last two bands between dividers about 40 px high, but their row-box heights are **not measurable from capture**; icon approx. 16 × 16; text begins x 375 | Open | `home-more-actions` | Text approx. 15 px regular, `#313949` approx.; CSS line-height is **not measurable from capture**; about 12 px between icon and label. Two 1 px `#CED0E1` dividers cross x 335–559 at y 389 and y 430. |
| Teamspace More Actions menu | Highlighted first item | x 335–559, y 293–323; `#F0F4FC` fill, approx. 6 px radius | Highlighted while menu open | `home-more-actions` | State cause is not measurable from capture; no menu action was executed. |
| Global search dimmer | Area and colour | x 0–1470, y 0–807; `#313949` at approx. 50% opacity | Search open | `home-search`, `home-main` | Solved from flat pairs: white `#FFFFFF` becomes `#989CA4`; rail `#223458` becomes `#293651`. The bottom utility strip at y 807–835 is not dimmed. |
| Global search panel | Outer bounds | x about 355.5–1164, y 4–679; about 808.5 × 675; `#FFFFFF` | Search open | `home-search` | Approx. 6 px outer radius; sits 4 px below the viewport top. Only geometry is in scope. |
| Global search input | Footprint | x 366–1154, y 14–54; about 788 × 40 | Search open | `home-search` | Blue `#5464F2` outline is visible. Interior behaviour is later. |

**Colour summary** (flat interiors; text and line-icon samples marked approx. where glyph antialiasing can vary):

| Colour | Use | Capture |
| --- | --- | --- |
| `#223458` | Rail surface and empty local Search interior | `home-main` |
| `#31446F` | Active Home/Leads row | `home-main`, `home-leads-navigation` |
| `#374D7F` | Open teamspace overflow trigger | `home-more-actions` |
| `#505D81` | Rail divider and local Search border | `home-main` |
| `#00B96F` | Teamspace monogram block | `home-main` |
| `#5A78FF`, `#FF7621`, `#EE3275`, `#A247EA`, `#F18E0A`, `#E7B910` | Functional accent colours in pinned-link icons; replace with original drawn icons | `home-main` |
| `#C2CBDE` | Rail labels and chevrons, approx. | `home-main` |
| `#7D8AA7` | Unselected nested-link icon | `home-main` |
| `#AAAAAA` | Visible rail scrollbar thumb in Leads | `home-leads-navigation` |
| `#7A859B` | Local Search placeholder, approx. | `home-main` |
| `#FFFFFF` | Top bar, Home main surface, utility strip, menu, active text approx. | `home-main`, `home-more-actions` |
| `#EEF1F9` | Leads main surface | `home-leads-navigation` |
| `#DBDFE8` | Avatar disk | `home-main` |
| `#C5C4D3` | Utility-strip cell rules | `home-main` |
| `#7875E6` | Help utility cell | `home-main` |
| `#DCDBEE` | Top-bar lower rule | `home-main` |
| `#EEF1F9` | Global search field | `home-main` |
| `#F0F1FF` | Quick-create button interior | `home-main` |
| `#8C91AB` | Global search placeholder, approx. | `home-main` |
| `#616E88` | Top-bar line icons, approx. | `home-main` |
| `#5464F2` | Sales folder icon, quick-create border, and open search outline | `home-main`, `home-search` |
| `#313949` | Page title/menu text approx.; search dimmer source colour | `home-main`, `home-more-actions`, `home-search` |
| `#CED0E1` | More Actions menu edge and dividers | `home-more-actions` |
| `#F0F4FC` | Highlighted More Actions row | `home-more-actions` |
| `#989CA4`, `#293651` | White and rail surfaces after the open-search dimmer | `home-search` |

**Type summary** (size and weight approx.; cap and x-height are measured CSS px; a single-line screenshot cannot establish CSS line-height):

| Style | Size / weight | Cap height / x-height | CSS line-height | Use | Capture |
| --- | --- | --- | --- | --- | --- |
| Product selector | approx. 16 px / semibold | 11 / 8 | not measurable from capture | Rail header label | `home-main` |
| Page title | approx. 20 px / semibold | 13 / 10; ascender up to 14 | not measurable from capture | Home and Leads title | `home-main`, `home-leads-navigation` |
| Rail fixed link | approx. 15 px / regular | 10.5 / 7.5 | not measurable from capture | Unselected pinned entries; glyphs vertically centred in their 30 px rows | `home-main` |
| Rail active link | approx. 15 px / semibold | 10.5 / 7.5 | not measurable from capture | Selected Home or Leads; Home glyphs y 64.5–75 within row y 55–85 | `home-main`, `home-leads-navigation` |
| Teamspace selector | approx. 16 px / semibold | 11 / 8 | not measurable from capture | Teamspace label; cap y 295.5–306.5 within selector y 289–313 | `home-main` |
| Group heading | approx. 15 px / semibold | 11 / 7.5 | not measurable from capture | Sales heading; cap y 371–382 within its centred row | `home-main` |
| Rail child link | approx. 15 px / regular | 10.5 / 7.5 | not measurable from capture | Unselected Leads and other children; cap y 403–414 within row y 394–424 | `home-main` |
| Rail Search placeholder | approx. 15 px / regular | 10.5 / 7.5 | not measurable from capture | Local Search; cap y 333–344 within input y 324–354 | `home-main` |
| Top-bar search placeholder | approx. 14 px / regular | 9.5 / 7 | not measurable from capture | Global search; cap y 18.5–28 within field y 8–40 | `home-main` |
| Menu item | approx. 15 px / regular | 11 / 8 | not measurable from capture | Open More Actions menu; glyphs vertically centred in visible bands | `home-more-actions` |
| Utility label | approx. 8 px / regular | 6 / 4.5 | not measurable from capture | Bottom left tool captions; later | `home-main` |
| Help utility label | approx. 12 px / semibold | 8 / 5.5 | not measurable from capture | Bottom Help cell; later | `home-main` |

### Home components currently shown

| Title, generalized where needed | Type | Source module | Scope |
| --- | --- | --- | --- |
| Welcome / getting started | Onboarding introduction | Home / organization setup | later |
| Setup checklist | Onboarding task list | Organization setup | later |
| Invite team | Setup step detail | Organization setup | later |
| Introductory video | Help media entry | Home / help | later |
| Webinar help | External help entry | Home / help | later |

The checklist also names pipeline configuration, email connection, migration, and integration as setup steps. They are entry points only in this spec. Dashboard widgets are **not in use in the captured Home view**: the `home-main` capture displays the onboarding page and no dashboard widget headings. Whether another Home view is available is unresolved.

## Fields

| Label | API name | Data type | Required / unique / read-only | Notes |
| --- | --- | --- | --- | --- |
| Not applicable | Not applicable | Not applicable | Not applicable | The shell and captured Home view show no CRM record fields. Module field definitions belong to their module specs and metadata, not to this screen. |

## Actions

| Entry | Observed affordance or opened options | Scope |
| --- | --- | --- |
| Home and Leads navigation | Follow named rail links; active row follows the destination. | needed for Module 1 |
| Group headings | Sales, Activities, and Integrations are expandable groups. Their expanded state was observed; collapse behavior was not exercised. | needed for Module 1: Sales; later: others |
| Global search | Opens an overlay with an All Modules selector, query field, search hint, and a populated recent/search-history list. No query or result page was opened. | later |
| Quick create `+` | Opens the two-column `Create Records` menu. Its `Lead` choice opens the full Standard Create Lead form; see `research/specs/record-detail.md`. | needed for Module 1: Lead entry; other choices later |
| Notifications | Visible in the top bar; menu contents not verified. | later |
| Calendar / activity shortcut | Calendar icon links to a day view; reminder controls also appear in the bottom strip. Menus were not opened. | later |
| Settings and extensions/store | Separate top-bar links are present; destinations were not opened. | later |
| User avatar / menu | Visible in the top bar; options not verified. No sign-out or account-switching action was selected. | later |
| Applications menu | Named top-bar button present; options not verified. | later |
| Teamspace overflow | New Teamspace, Create Folder, Add Modules, Manage CRM Teamspace, View All Teamspace. Menu only; no action executed. | later |
| Home setup actions | Setup-step entries, an invite action, and Skip are visible. None was executed. | later |

## Filters / views / sorting / search

The captured Home view is the onboarding/setup view. No Home filter, sort, or dashboard view selector was visible. Global search is a separate overlay with an All Modules selector and search history; its results and filter behavior are outside this spec. The teamspace rail also has a local Search input; its behavior was not exercised. Leads list views are specified separately, not here. There is no observed shell-level sort. These features are **later**, except keeping the currently selected navigation item clear, which is **needed for Module 1**.

## Flows

1. **Reach Leads (needed for Module 1).** Load Home; the rail shows Home selected and Sales expanded. Choose the Leads link. The browser enters `/crm/<org>/tab/Leads/custom-view/<viewId>/list`, the page title becomes Leads, and the Leads row becomes active. A failed route or inaccessible module should leave a clear page-level error and preserve navigation; the reference failure state was not captured.
2. **Open a navigation group (needed for Module 1 for Sales).** Activate the Sales group heading to reveal or hide its links. The captured state is expanded. If a group has no available modules, show its empty state rather than inventing links; that state was not observed.
3. **Open global search (later).** Activate Search records. An overlay opens with a module selector, empty query field, hint, and a populated history list. Query validation, no-match behavior, and request errors were not tested; do not infer them from this capture.
4. **Open teamspace overflow (later).** Activate More Actions. The five named menu options appear. Dismiss without selecting an option. Menu execution and its validation/error states are outside scope.
5. **Load Home (later).** Navigate to `/tab/Home/begin`. The captured account shows onboarding/setup content rather than dashboard components. No setup action was taken. Empty, completed-onboarding, and failed-load states were not observed; implementation should not assume the onboarding view is universal.

## Data needs

The following are request *shapes* observed in the sanitized capture network files. Paths and field names are retained; values, organization identifiers, record identifiers, and response payloads are omitted. These describe reference behavior, not required internal API design.

| Method | Endpoint path | Parameter or request field names | Response field names | Use / scope |
| --- | --- | --- | --- | --- |
| GET | `/crm/<org>/ConstantsInitial.do` and `/crm/<org>/Constants.do` | None observed | `crmObj`, `crmObjInitial`, `globalObjectInitial`, `otherObj`, `crmInitArguments` (among other bootstrap groups) | Shell bootstrap; needed for Module 1 conceptually |
| GET | `/crm/<org>/ModuleMeta.do` | None observed | Response shape not available in capture | Module availability; needed for Module 1 conceptually |
| GET | `/crm/<org>/ViewPreference.do` | None observed | `modules[]`: `module_name`, `custom_view`, `cvid`, `per_page`, view-mode flags | Saved module view preferences; later except Leads entry routing |
| GET | `/crm/v9/org/actions/onboarding_status` | None observed | `org[]`: `onboarded_status`, `feature_status`, `popup_state`; `feature_status` contains setup-step status keys | Active Home onboarding view; later |
| POST | `/crm/<org>/crminotification.do` | `action`, `crmcsrfparam` | `newnoti`, `routineMessage`, `seen`, `unseen`, `status` | Notification badge; later. Captured as a read response; no notification action was taken. |
| GET | `/crm/v2/signals/notifications/actions/count` | None observed | `notifications.live_ntc_count`, `notifications.unseen_ntc_count` | Notification count; later |
| POST | `/crm/<org>/ActivityReminder.do` | Query: `actionName`, `fromIndex`, `toIndex`; body: `crmcsrfparam` | `details`, `keyVsFieldLabel` | Reminder strip; later. Captured as a read response; no reminder action was taken. |
| GET | `/crm/v9/recent_items` | Query: `filters` | `recent_items` | Global search history overlay; later |

## Capture refs

The Visual layout measurements use `home-main`, `home-leads-navigation`, `home-more-actions`, and `home-search`; `home-quick-create` shows the same shell geometry as `home-main`.

`home-main` (initial Home and layout), `home-more-actions` (teamspace overflow), `home-quick-create` (same Home state after an unintended positional click was blocked), `home-search` (global search overlay), `home-leads-navigation` (Leads route and active rail state). All captures remained in the local research workspace. No raw capture or customer value is included here. `home-quick-create` records a blocked `PUT` to `/crm/v9/org/actions/onboarding_status`; `home-leads-navigation` records a blocked `PUT` to `/crm/v9/settings/user_view_preference`. Neither write completed. No `skippedClicks` were recorded.

## Open questions

1. What is the normal Home view after onboarding is completed, and which dashboard components, if any, are configured? The captured account remained on `/tab/Home/begin`; Skip would have changed onboarding state, so it was not used.
2. Which of the 33 metadata `show_as_tab` modules can appear in this team's grouped rail, and how are module overflow and ordering controlled? Metadata sequence differs from the visible pinned/teamspace order. Feeds is `show_as_tab: true` but `visible: false`.
3. What are the notification, user-avatar, and applications-menu options? Their icons had no reliable accessible names in the capture, and no safe named selector was available. The quick-create menu and its Lead destination are documented in `research/specs/record-detail.md`. Calendar, extensions/store, and settings destinations were visible but not opened.
4. Does the shell vary between Administrator and Standard profiles? Metadata lists both profiles, but the capture shows one session only.
5. What are the collapsed rail, empty menu/search, and route/network error states? None was captured. Validation rules for global search are also unknown.
6. The top-bar `+` → `Lead` choice opens the full Standard Create Lead form; see `research/specs/record-detail.md`. The module-local creation action remains described in the Leads screen spec.
7. Which exact typeface, CSS font metrics, CSS line-heights, shadow blur/spread, and shell-wide main-content inset apply? Single-line labels do not reveal CSS line-height or the height of an unhighlighted menu item; these are not measurable from capture. The Visual layout records only measured glyph and region geometry.
8. What produces the first More Actions item highlight (hover, focus, or default selection), and what are the hidden-rail, hover, focus, disabled, and empty shell states? These are not measurable from capture.
