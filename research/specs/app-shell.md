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
| Quick create `+` | Visible in the top bar. Its menu options were not verified because the control has no accessible name in the capture. | later; revisit if Leads creation requires this entry |
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

`home-main` (initial Home and layout), `home-more-actions` (teamspace overflow), `home-quick-create` (same Home state after an unintended positional click was blocked), `home-search` (global search overlay), `home-leads-navigation` (Leads route and active rail state). All captures remained in the local research workspace. No raw capture or customer value is included here. `home-quick-create` records a blocked `PUT` to `/crm/v9/org/actions/onboarding_status`; `home-leads-navigation` records a blocked `PUT` to `/crm/v9/settings/user_view_preference`. Neither write completed. No `skippedClicks` were recorded.

## Open questions

1. What is the normal Home view after onboarding is completed, and which dashboard components, if any, are configured? The captured account remained on `/tab/Home/begin`; Skip would have changed onboarding state, so it was not used.
2. Which of the 33 metadata `show_as_tab` modules can appear in this team's grouped rail, and how are module overflow and ordering controlled? Metadata sequence differs from the visible pinned/teamspace order. Feeds is `show_as_tab: true` but `visible: false`.
3. What are the quick-create, notification, user-avatar, and applications-menu options? Their icons had no reliable accessible names in the capture, and no safe named selector was available. Calendar, extensions/store, and settings destinations were visible but not opened.
4. Does the shell vary between Administrator and Standard profiles? Metadata lists both profiles, but the capture shows one session only.
5. What are the collapsed rail, empty menu/search, and route/network error states? None was captured. Validation rules for global search are also unknown.
6. Does Leads creation depend on the top-bar quick-create entry, or is its module-local action sufficient? Confirm against the Leads screen spec before implementing that top-bar menu in Module 1.
