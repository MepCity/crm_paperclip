# Duplicate discovery and merging

## Purpose

Document record-specific duplicate search and module-wide deduplication for Leads and Contacts, without executing either operation. Module 2 delivers both capabilities by assignment; related content follows its own module. Live evidence establishes only the list-menu entry; workflow evidence comes from public help.

## Control inventory

### Control inventory — list-actions

This existing Leads capture was the authorized fallback in the original delivery. Contacts evidence is now available and inventoried below; current Contacts entry placement comes from m2-list-actions. No new list-menu click was made. Its older capture has no controls.json: reconciliation is unavailable, not zero controls. Full screenshot was opened as an image.

Shell controls reuse SH-01–SH-46 from global-search.md at their corresponding shell positions. Home is unselected; Leads is selected. In this older screenshot the bottom-left utility cluster additionally includes the following controls (and Contacts follows them). The branding-bearing sheet menu row uses a neutral description.

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-47 | Shell | Channels | icon button | bottom strip, left, third | not observed | seen (list-actions) | ? |
| SH-48 | Shell | Threads | icon button | bottom strip, left, fourth | not observed | seen (list-actions) | ? |
| SH-40.1 | Shell | Announcement count (value omitted) | badge | bottom strip, above Announcements icon | not observed | seen (list-actions) | ? |
| SH-38 | Shell | Contacts | icon button | bottom strip, left, fifth | not observed | seen (list-actions) | ? |
| SH-50 | Shell | Trash bin icon | icon button | bottom strip, far right, after Help | not observed | seen (list-actions) | ? |
| X-01 | View header | All Leads | button | header, left, first | not observed | seen (list-actions) | M1 |
| X-02 | View header | Three dots icon | icon button | header, left, second | not observed | seen (list-actions) | M1 |
| X-03 | Toolbar | Filter | button | toolbar, left, first | not observed | seen (list-actions) | M1 |
| X-04 | Toolbar | Sort | button | toolbar, left, second | not observed | seen (list-actions) | M1 |
| X-05 | Toolbar | List icon | icon button | toolbar, left, 3 | not observed | seen (list-actions) | M1 |
| X-06 | Toolbar | Vertical panels icon | icon button | toolbar, left, 4 | not observed | seen (list-actions) | M1 |
| X-07 | Toolbar | Table icon | icon button | toolbar, left, 5 | not observed | seen (list-actions) | M1 |
| X-08 | Toolbar | Pie chart icon | icon button | toolbar, left, 6 | not observed | seen (list-actions) | M1 |
| X-09 | Toolbar | Hierarchy icon | icon button | toolbar, left, 7 | not observed | seen (list-actions) | M1 |
| X-10 | Toolbar | Horizontal panels icon | icon button | toolbar, left, 8 | not observed | seen (list-actions) | M1 |
| X-11 | Toolbar | Down chevron | icon button | toolbar, left, 9 | not observed | seen (list-actions) | M1 |
| X-12 | Toolbar | Refresh icon | icon button | toolbar, left, 10 | not observed | seen (list-actions) | M1 |
| X-13 | Toolbar | Create Lead | button | toolbar, right group, left | not observed | seen (list-actions) | M1 |
| X-14 | Toolbar | Down arrow | icon button | toolbar, right group, middle | not observed | seen (list-actions) | M1 |
| X-15 | Toolbar | Three dots icon | icon button | toolbar, right group, right | open Actions menu already shown | seen (list-actions) | M1 |
| X-15.1 | Actions menu | Mass Transfer | menu item | menu, row 1 | not observed | seen (list-actions) | M1 |
| X-15.2 | Actions menu | Mass Delete | menu item | menu, row 2 | not observed | seen (list-actions) | M1 |
| X-15.3 | Actions menu | Mass Update | menu item | menu, row 3 | not observed | seen (list-actions) | M1 |
| X-15.4 | Actions menu | Mass Convert | menu item | menu, row 4 | not observed | seen (list-actions) | M1 |
| X-15.5 | Actions menu | Manage Tags | menu item | menu, row 5 | not observed | seen (list-actions) | M11 |
| X-15.6 | Actions menu | Assignment Rules | menu item | menu, row 6 | not observed | seen (list-actions) | M12 |
| X-15.7 | Actions menu | Drafts | menu item | menu, row 7 | not observed | seen (list-actions) | M1 |
| X-15.8 | Actions menu | Mass Email | menu item | menu, row 8 | not observed | seen (list-actions) | M10 |
| X-15.9 | Actions menu | Approve Leads | menu item | menu, row 9 | not observed | seen (list-actions) | P3 |
| X-15.10 | Actions menu | Deduplicate Leads | menu item | menu, row 10 | not observed | seen (list-actions) | M2 |
| X-15.11 | Actions menu | Add to Campaigns | menu item | menu, row 11 | not observed | seen (list-actions) | M7 |
| X-15.12 | Actions menu | Create Client Script | menu item | menu, row 12 | not observed | seen (list-actions) | M11 |
| X-15.13 | Actions menu | Export Leads | menu item | menu, row 13 | not observed | seen (list-actions) | M6 |
| X-15.14 | Actions menu | Spreadsheet view (neutral description) | menu item | menu, row 14 | not observed | seen (list-actions) | ? |
| X-15.15 | Actions menu | Print View | menu item | menu, row 15 | not observed | seen (list-actions) | M6 |
| X-16 | Filter panel | Search | input | panel, top | not observed | seen (list-actions) | M1 |
| X-17 | Filter panel | System Defined Fil… | button | panel, first group heading | not observed | seen (list-actions) | M1 |
| X-17.1 | Filter panel | Activities | checkbox | first group, row 1 | not observed | seen (list-actions) | M5 |
| X-17.2 | Filter panel | Campaigns | checkbox | first group, row 2 | not observed | seen (list-actions) | M7 |
| X-17.3 | Filter panel | Latest Email Status | checkbox | first group, row 3 | not observed | seen (list-actions) | M10 |
| X-17.4 | Filter panel | Locked | checkbox | first group, row 4 | not observed | seen (list-actions) | P3 |
| X-17.5 | Filter panel | Record Action | checkbox | first group, row 5 | not observed | seen (list-actions) | M1 |
| X-17.6 | Filter panel | Related Records Action | checkbox | first group, row 6 | not observed | seen (list-actions) | M1 |
| X-17.7 | Filter panel | Touched Records | checkbox | first group, row 7 | not observed | seen (list-actions) | M1 |
| X-17.8 | Filter panel | Untouched Records | checkbox | first group, row 8 | not observed | seen (list-actions) | M1 |
| X-17.9 | Filter panel | Cadences | checkbox | first group, row 9 | not observed | seen (list-actions) | P3 |
| X-18 | Filter panel | Filter By Fields | button | panel, second group heading | not observed | seen (list-actions) | M1 |
| X-18.1 | Filter panel | Address | checkbox | second group, row 1 | not observed | seen (list-actions) | M1 |
| X-18.2 | Filter panel | Address - City | checkbox | second group, row 2 | not observed | seen (list-actions) | M1 |
| X-18.3 | Filter panel | Address - Country / Region | checkbox | second group, row 3 | not observed | seen (list-actions) | M1 |
| X-18.4 | Filter panel | Address - Flat / House No. / Building / | checkbox | second group, row 4 (clipped label) | not observed | seen (list-actions) | M1 |
| X-19 | Table | Select all | checkbox | table header, first | not observed | seen (list-actions) | M1 |
| X-20.1 | Table | Lead Name | column header | table header, data column 1 | not observed | seen (list-actions) | M1 |
| X-20.2 | Table | Company | column header | table header, data column 2 | not observed | seen (list-actions) | M1 |
| X-20.3 | Table | Email | column header | table header, data column 3 | not observed | seen (list-actions) | M1 |
| X-20.4 | Table | Column obscured by menu | column header | table header, data column 4 | not observed | not observed | M1 |
| X-21 | Table | All | select | Lead Name header, right | not observed | seen (list-actions) | M1 |
| X-22.1 | Table | Record selection | checkbox | table, row 1, left | not observed | seen (list-actions) | M1 |
| X-22.2 | Table | Record selection | checkbox | table, row 2, left | not observed | seen (list-actions) | M1 |
| X-22.3 | Table | Record selection | checkbox | table, row 3, left | not observed | seen (list-actions) | M1 |
| X-22.4 | Table | Record selection | checkbox | table, row 4, left | not observed | seen (list-actions) | M1 |
| X-22.5 | Table | Record selection | checkbox | table, row 5, left | not observed | seen (list-actions) | M1 |
| X-22.6 | Table | Record selection | checkbox | table, row 6, left | not observed | seen (list-actions) | M1 |
| X-22.7 | Table | Record selection | checkbox | table, row 7, left | not observed | seen (list-actions) | M1 |
| X-22.8 | Table | Record selection | checkbox | table, row 8, left | not observed | seen (list-actions) | M1 |
| X-22.9 | Table | Record selection | checkbox | table, row 9, left | not observed | seen (list-actions) | M1 |
| X-22.10 | Table | Record selection | checkbox | table, row 10, left | not observed | seen (list-actions) | M1 |
| X-23.1 | Table | Record name (value omitted) | link | table, row 1, name cell | not observed | seen (list-actions) | M1 |
| X-23.2 | Table | Record name (value omitted) | link | table, row 2, name cell | not observed | seen (list-actions) | M1 |
| X-23.3 | Table | Record name (value omitted) | link | table, row 3, name cell | not observed | seen (list-actions) | M1 |
| X-23.4 | Table | Record name (value omitted) | link | table, row 4, name cell | not observed | seen (list-actions) | M1 |
| X-23.5 | Table | Record name (value omitted) | link | table, row 5, name cell | not observed | seen (list-actions) | M1 |
| X-23.6 | Table | Record name (value omitted) | link | table, row 6, name cell | not observed | seen (list-actions) | M1 |
| X-23.7 | Table | Record name (value omitted) | link | table, row 7, name cell | not observed | seen (list-actions) | M1 |
| X-23.8 | Table | Record name (value omitted) | link | table, row 8, name cell | not observed | seen (list-actions) | M1 |
| X-23.9 | Table | Record name (value omitted) | link | table, row 9, name cell | not observed | seen (list-actions) | M1 |
| X-23.10 | Table | Record name (value omitted) | link | table, row 10, name cell | not observed | seen (list-actions) | M1 |
| X-24.1 | Table | Activity date badge (value omitted) | badge | table, row 8, before name | not observed | seen (list-actions) | M5 |
| X-24.2 | Table | Activity date badge (value omitted) | badge | table, row 10, before name | not observed | seen (list-actions) | M5 |
| X-25 | Table footer | Left arrow | icon button | footer, right, first | not observed | seen (list-actions) | M1 |
| X-26 | Table footer | Right arrow | icon button | footer, right, last | not observed | seen (list-actions) | M1 |

The record count and range are text, not actions; ordinary data cells are omitted. Print View includes a right-facing submenu arrow within the same menu item. No tooltip or hidden row action was opened (list-actions). Headers behind the menu or horizontal clipping (Lead Source / Lead Owner) are not counted as visible; Phone is explicitly marked unobserved.

### Shell registry crosswalk

The original search delivery and the later Contacts delivery independently assigned shell IDs. In this pair of specs, SH-01–SH-25 match contacts.md; contacts.md SH-26–SH-45 correspond to these specs SH-27–SH-46; contacts.md SH-46 corresponds to SH-50 (trash bin). SH-26 here is the rail resize handle. SH-47/SH-48 are the older Leads Channels/Threads controls; SH-49 is documentary only. Existing L IDs below refer to contacts.md and are reused, not newly allocated X IDs. Contacts is third in the current bottom-left cluster, fifth in the older Leads cluster (m2-list-actions; list-actions).

### Control inventory — m2-list-actions

Current Contacts screenshot: Deduplicate Contacts is Actions row 8 (L-14.8). No new capture or click was performed; all visible controls reuse the Contacts spec IDs, with the shell crosswalk above.

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L-01 | View strip | All Contacts | tab | left, first | not observed | seen (m2-list-actions) | M2 |
| L-02 | View strip | Three dots icon | icon button | after current view tab | not observed | seen (m2-list-actions) | M2 |
| L-03 | Toolbar | Filter | button | left group, first | not observed | seen (m2-list-actions) | M2 |
| L-04 | Toolbar | Sort | button | left group, second | not observed | seen (m2-list-actions) | M2 |
| L-05 | Toolbar | List view icon | icon button | view group, first | not observed | seen (m2-list-actions) | M2 |
| L-06 | Toolbar | Kanban view icon | icon button | view group, second | not observed | seen (m2-list-actions) | M2 |
| L-07 | Toolbar | Sheet view icon | icon button | view group, third | not observed | seen (m2-list-actions) | M2 |
| L-08 | Toolbar | Chart view icon | icon button | view group, fourth | not observed | seen (m2-list-actions) | M2 |
| L-09 | Toolbar | Timeline view icon | icon button | view group, fifth | not observed | seen (m2-list-actions) | M2 |
| L-10 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | not observed | seen (m2-list-actions) | M2 |
| L-11 | Toolbar | Down chevron | icon button | view group, seventh | not observed | seen (m2-list-actions) | M2 |
| L-12 | Toolbar | Create Contact | button | right group, first | not observed | seen (m2-list-actions) | M2 |
| L-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Contact | not observed | seen (m2-list-actions) | M6 |
| L-14 | Toolbar | Three dots / Actions | icon button | right group, far right | Opens the Actions menu | seen (m2-list-actions) | M2 |
| L-14.1 | Actions menu | Mass Transfer | menu item | popup, row 1 | not observed | seen (m2-list-actions) | M2 |
| L-14.2 | Actions menu | Mass Delete | menu item | popup, row 2 | not observed | seen (m2-list-actions) | M2 |
| L-14.3 | Actions menu | Mass Update | menu item | popup, row 3 | not observed | seen (m2-list-actions) | M2 |
| L-14.4 | Actions menu | Manage Tags | menu item | popup, row 4 | not observed | seen (m2-list-actions) | M6 |
| L-14.5 | Actions menu | Drafts | menu item | popup, row 5 | not observed | seen (m2-list-actions) | M2 |
| L-14.6 | Actions menu | Mass Email | menu item | popup, row 6 | not observed | seen (m2-list-actions) | M10 |
| L-14.7 | Actions menu | Approve Contacts | menu item | popup, row 7 | not observed | seen (m2-list-actions) | M2 |
| L-14.8 | Actions menu | Deduplicate Contacts | menu item | popup, row 8 | not observed | seen (m2-list-actions) | M2 |
| L-14.9 | Actions menu | Add to Campaigns | menu item | popup, row 9 | not observed | seen (m2-list-actions) | M7 |
| L-14.10 | Actions menu | Create Client Script | menu item | popup, row 10 | not observed | seen (m2-list-actions) | M11 |
| L-14.11 | Actions menu | Export Contacts | menu item | popup, row 11 | not observed | seen (m2-list-actions) | M6 |
| L-14.12 | Actions menu | Sheet view | menu item | popup, row 12 | not observed | seen (m2-list-actions) | ? |
| L-14.13 | Actions menu | Print View | menu item | popup, row 13 | not observed | seen (m2-list-actions) | M2 |
| L-15 | Filter panel | Search | input | below Filter Contacts by heading | not observed | seen (m2-list-actions) | M2 |
| L-16 | Filter panel | System Defined Filters | toggle | first section heading | not observed | seen (m2-list-actions) | M2 |
| L-17 | Filter panel | Activities | checkbox | system-defined section, Activities | not observed | seen (m2-list-actions) | M5 |
| L-18 | Filter panel | Campaigns | checkbox | system-defined section, Campaigns | not observed | seen (m2-list-actions) | M7 |
| L-19 | Filter panel | Latest Email Status | checkbox | system-defined section, Latest Email Status | not observed | seen (m2-list-actions) | M10 |
| L-20 | Filter panel | Locked | checkbox | system-defined section, Locked | not observed | seen (m2-list-actions) | M2 |
| L-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | not observed | seen (m2-list-actions) | M2 |
| L-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | not observed | seen (m2-list-actions) | M2 |
| L-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | not observed | seen (m2-list-actions) | M2 |
| L-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | not observed | seen (m2-list-actions) | M2 |
| L-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | not observed | seen (m2-list-actions) | P3 |
| L-26 | Filter panel | Filter By Fields | toggle | second section heading | not observed | seen (m2-list-actions) | M2 |
| L-27 | Filter panel | Account Name | checkbox | field section, Account Name | not observed | seen (m2-list-actions) | M3 |
| L-28 | Filter panel | Assistant | checkbox | field section, Assistant | not observed | seen (m2-list-actions) | M2 |
| L-29 | Filter panel | Asst Phone | checkbox | field section, Asst Phone | not observed | seen (m2-list-actions) | M2 |
| L-30 | Filter panel | Connected To | checkbox | field section, Connected To | not observed | seen (m2-list-actions) | M2 |
| L-31 | Filter panel | Contact Name | checkbox | field section, Contact Name | not observed | seen (m2-list-actions) | M2 |
| L-32 | Filter panel | Contact Owner (partly clipped) | checkbox | field section, Contact Owner (partly clipped) | not observed | seen (m2-list-actions) | M2 |
| L-34 | Table | Select all checkbox | checkbox | header, before activity column | not observed | seen (m2-list-actions) | M2 |
| L-35 | Table | Contact Name | column header | first text column | not observed | seen (m2-list-actions) | M2 |
| L-36 | Table | All with down arrow | select | within Contact Name header, right | not observed | seen (m2-list-actions) | M2 |
| L-37 | Table | Account Name | column header | second text column | not observed | seen (m2-list-actions) | M3 |
| L-38 | Table | Email | column header | third text column | not observed | seen (m2-list-actions) | M2 |
| L-40 | Table | Record selection checkbox | checkbox | each visible row, before activity column | not observed | seen (m2-list-actions) | M2 |
| L-41 | Table | Call activity flag | badge | rows with activity, before Contact Name | not observed | seen (m2-list-actions) | M5 |
| L-42 | Table | Contact record link | link | Contact Name cells | not observed | seen (m2-list-actions) | M2 |
| L-43 | Table | Account record link | link | Account Name cells | not observed | seen (m2-list-actions) | M3 |
| L-44 | Table | Email address link | link | Email cells | not observed | seen (m2-list-actions) | M10 |
| L-48 | List footer | Total Records | badge | left | not observed | seen (m2-list-actions) | M2 |
| L-49 | List footer | Displayed record range | badge | right group, between arrows | not observed | seen (m2-list-actions) | M2 |
| L-50 | List footer | Previous | icon button | right group, before range | not observed | seen (m2-list-actions) | M2 |
| L-51 | List footer | Next | icon button | right group, after range | not observed | seen (m2-list-actions) | M2 |
| L-52 | Toolbar | Circular arrow icon | icon button | after view group | not observed | seen (m2-list-actions) | M2 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2-list-actions) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2-list-actions) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2-list-actions) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2-list-actions) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2-list-actions) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2-list-actions) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2-list-actions) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2-list-actions) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2-list-actions) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2-list-actions) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2-list-actions) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2-list-actions) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2-list-actions) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2-list-actions) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2-list-actions) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2-list-actions) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2-list-actions) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2-list-actions) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2-list-actions) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2-list-actions) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2-list-actions) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2-list-actions) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2-list-actions) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2-list-actions) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2-list-actions) | P2 |
| SH-27 | Top bar | Search records | button | right group, first | not observed | seen (m2-list-actions) | ? |
| SH-28 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2-list-actions) | M1 |
| SH-29 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2-list-actions) | P3 |
| SH-30 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2-list-actions) | ? |
| SH-31 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2-list-actions) | M10 |
| SH-32 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2-list-actions) | ? |
| SH-33 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2-list-actions) | M11 |
| SH-34 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2-list-actions) | ? |
| SH-35 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2-list-actions) | ? |
| SH-36 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2-list-actions) | ? |
| SH-37 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2-list-actions) | ? |
| SH-38 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2-list-actions) | ? |
| SH-39 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2-list-actions) | ? |
| SH-40 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2-list-actions) | ? |
| SH-41 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2-list-actions) | ? |
| SH-42 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2-list-actions) | ? |
| SH-43 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2-list-actions) | M5 |
| SH-44 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2-list-actions) | M1 |
| SH-45 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2-list-actions) | ? |
| SH-46 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2-list-actions) | ? |
| SH-50 | Utility strip | Trash bin icon | icon button | far right, after Help | not observed | seen (m2-list-actions) | ? |

#### Reconciliation — m2-list-actions

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| Excluded: covered by open popup | 285, 302 |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 65, 66, 67, 68, 82, 83, 87, 111, 116, 119, 127, 128, 135, 137, 140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 166, 168, 170, 172, 173, 174, 283, 284, 288, 289, 292, 293, 295, 296, 706 |
| Excluded: invisible or outside captured viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 84, 91, 92, 94, 95, 97, 98, 101, 102, 107, 108, 109, 110, 134, 138, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 286, 287, 303, 304, 320, 321, 335, 336, 350, 351, 366, 367, 381, 382, 397, 398, 412, 413, 427, 428, 442, 443, 458, 459, 474, 475, 489, 490, 505, 506, 520, 521, 526, 533, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660, 661, 662, 663, 664, 665, 666, 667, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686, 687, 689, 691, 693, 695, 696, 698, 700, 718 |
| Excluded: record data or table structure | 290, 291, 305, 306, 307, 308, 311, 313, 315, 317, 319, 322, 323, 324, 327, 328, 330, 332, 334, 337, 338, 339, 342, 343, 345, 347, 349, 352, 353, 354, 357, 359, 361, 363, 365, 368, 369, 370, 373, 374, 376, 378, 380, 383, 384, 385, 388, 390, 392, 394, 396, 399, 400, 401, 404, 406, 408, 410, 411, 414, 415, 416, 419, 420, 422, 424, 426, 429, 430, 431, 434, 436, 438, 440, 441, 444, 445, 446, 449, 451, 453, 455, 457, 460, 461, 462, 465, 467, 469, 471, 473, 476, 477, 478, 481, 482, 484, 486, 488, 491, 492, 493, 496, 498, 500, 502, 504, 507, 508, 509, 512, 513, 515, 517, 519, 522, 523, 524, 527, 528, 530, 532, 534 |
| L-01 | 112 |
| L-02 | 113, 114, 115 |
| L-03 | 117 |
| L-04 | 118 |
| L-05 | 120 |
| L-06 | 121 |
| L-07 | 122 |
| L-08 | 123 |
| L-09 | 124 |
| L-10 | 125 |
| L-11 | 126 |
| L-12 | 130 |
| L-13 | 131, 132 |
| L-14 | 133 |
| L-14.1 | 688 |
| L-14.2 | 690 |
| L-14.3 | 692 |
| L-14.4 | 694 |
| L-14.5 | 697 |
| L-14.6 | 699 |
| L-14.7 | 701 |
| L-14.8 | 702 |
| L-14.9 | 703 |
| L-14.10 | 704 |
| L-14.11 | 705 |
| L-15 | 136 |
| L-16 | 139 |
| L-17 | 141 |
| L-18 | 143 |
| L-19 | 145 |
| L-20 | 147 |
| L-21 | 149 |
| L-22 | 151 |
| L-23 | 153 |
| L-24 | 155 |
| L-25 | 157 |
| L-26 | 159 |
| L-27 | 161 |
| L-28 | 163 |
| L-29 | 165 |
| L-30 | 167 |
| L-31 | 169 |
| L-32 | 171 |
| L-34 | 294 |
| L-35 | 297 |
| L-36 | 298, 299 |
| L-37 | 300 |
| L-38 | 301 |
| L-40 | 309, 310, 325, 326, 340, 341, 355, 356, 371, 372, 386, 387, 402, 403, 417, 418, 432, 433, 447, 448, 463, 464, 479, 480, 494, 495, 510, 511, 525 |
| L-41 | 312, 358, 389, 405, 435, 450, 466, 497 |
| L-42 | 314, 329, 344, 360, 375, 391, 407, 421, 437, 452, 468, 483, 499, 514, 529 |
| L-43 | 316, 331, 346, 362, 377, 393, 409, 423, 439, 454, 470, 485, 501, 516, 531 |
| L-44 | 318, 333, 348, 364, 379, 395, 425, 456, 472, 487, 503, 518 |
| L-48 | 668 |
| L-49 | 669 |
| L-50 | 670 |
| L-51 | 671 |
| L-52 | 129 |
| SH-01 | 2, 3, 4 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29, 30, 31 |
| SH-10 | 33 |
| SH-11 | 34 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 60, 61 |
| SH-25 | 63, 64 |
| SH-27 | 85 |
| SH-28 | 86 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 90 |
| SH-32 | 93 |
| SH-33 | 96 |
| SH-34 | 99, 100 |
| SH-35 | 103, 104, 105, 106 |
| SH-36 | 707 |
| SH-37 | 708 |
| SH-38 | 709 |
| SH-39 | 710 |
| SH-40 | 711 |
| SH-41 | 712 |
| SH-42 | 713 |
| SH-43 | 714 |
| SH-44 | 715 |
| SH-45 | 716 |
| SH-46 | 717 |


### Documented controls — D2: record-specific criteria and matching records

Images D2-image-2 and D2-image-3 are cropped panels; no unseen surrounding controls are inferred. `toggle` below represents a native radio choice because the task inventory vocabulary has no radio type.

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| X-27 | Criteria | Match any of the criteria below | select | criteria heading, right | chooses any/all matching | documented (D2) | M2 |
| X-28.1.1 | Criteria | First Name | select | criterion row 1, left | choose field | documented (D2) | M2 |
| X-28.1.2 | Criteria | Operator | select | criterion row 1, middle | choose condition | documented (D2) | M2 |
| X-28.1.3 | Criteria | Value field | input | criterion row 1, right | criterion value | documented (D2) | M2 |
| X-28.1.4 | Criteria | Minus icon | icon button | criterion row 1, far right | remove criterion | documented (D2) | M2 |
| X-28.2.1 | Criteria | Last Name | select | criterion row 2, left | choose field | documented (D2) | M2 |
| X-28.2.2 | Criteria | Operator | select | criterion row 2, middle | choose condition | documented (D2) | M2 |
| X-28.2.3 | Criteria | Value field | input | criterion row 2, right | criterion value | documented (D2) | M2 |
| X-28.2.4 | Criteria | Minus icon | icon button | criterion row 2, far right | remove criterion | documented (D2) | M2 |
| X-28.3.1 | Criteria | Email | select | criterion row 3, left | choose field | documented (D2) | M2 |
| X-28.3.2 | Criteria | Operator | select | criterion row 3, middle | choose condition | documented (D2) | M2 |
| X-28.3.3 | Criteria | Value field | input | criterion row 3, right | criterion value | documented (D2) | M2 |
| X-28.3.4 | Criteria | Minus icon | icon button | criterion row 3, far right | remove criterion | documented (D2) | M2 |
| X-28.4.1 | Criteria | Mobile | select | criterion row 4, left | choose field | documented (D2) | M2 |
| X-28.4.2 | Criteria | Operator | select | criterion row 4, middle | choose condition | documented (D2) | M2 |
| X-28.4.3 | Criteria | Value field | input | criterion row 4, right | criterion value | documented (D2) | M2 |
| X-28.4.4 | Criteria | Minus icon | icon button | criterion row 4, far right | remove criterion | documented (D2) | M2 |
| X-28.5.1 | Criteria | Fax | select | criterion row 5, left | choose field | documented (D2) | M2 |
| X-28.5.2 | Criteria | Operator | select | criterion row 5, middle | choose condition | documented (D2) | M2 |
| X-28.5.3 | Criteria | Value field | input | criterion row 5, right | criterion value | documented (D2) | M2 |
| X-28.5.4 | Criteria | Minus icon | icon button | criterion row 5, far right | remove criterion | documented (D2) | M2 |
| X-29 | Criteria | Plus icon | icon button | last criterion, after minus | add criterion | documented (D2) | M2 |
| X-30 | Field menu | Search field | input | open field menu, top | not observed | documented (D2) | M2 |
| X-28.5.1.1 | Field menu | Email Opt Out | menu item | field menu, visible row 1 | choose criterion field | documented (D2) | M2 |
| X-28.5.1.2 | Field menu | Fax | menu item | field menu, visible row 2 | choose criterion field | documented (D2) | M2 |
| X-28.5.1.3 | Field menu | First Name | menu item | field menu, visible row 3 | choose criterion field | documented (D2) | M2 |
| X-28.5.1.4 | Field menu | Full Name | menu item | field menu, visible row 4 | choose criterion field | documented (D2) | M2 |
| X-28.5.1.5 | Field menu | Industry | menu item | field menu, visible row 5 | choose criterion field | documented (D2) | M2 |
| X-28.5.1.6 | Field menu | Last Activity Time | menu item | field menu, visible row 6 | choose criterion field | documented (D2) | M2 |
| X-28.5.1.7 | Field menu | Last Name | menu item | field menu, visible row 7 | choose criterion field | documented (D2) | M2 |
| X-31 | Criteria | Search | button | criteria panel, lower right | fetch matching records | documented (D2) | M2 |
| X-32 | Matching Records | Clear | link | selection summary, after count | clear selected records | documented (D2) | M2 |
| X-33 | Matching Records | Next | button | selection summary, after Clear | continue to merge | documented (D2) | M2 |
| X-34 | Matching Records | Left arrow | icon button | panel, upper right, first | pagination | documented (D2) | M2 |
| X-35 | Matching Records | Right arrow | icon button | panel, upper right, second | pagination | documented (D2) | M2 |
| X-36.1 | Matching Records | Lead Name | column header | table, column 1 | display field | documented (D2) | M2 |
| X-36.2 | Matching Records | Company | column header | table, column 2 | display field | documented (D2) | M2 |
| X-36.3 | Matching Records | Email | column header | table, column 3 | display field | documented (D2) | M2 |
| X-36.4 | Matching Records | Phone | column header | table, column 4 | display field | documented (D2) | M2 |
| X-36.5 | Matching Records | Mobile | column header | table, column 5 | display field | documented (D2) | M2 |
| X-36.6 | Matching Records | Created Time | column header | table, column 6 | display field | documented (D2) | M2 |
| X-36.7 | Matching Records | Modified Time | column header | table, column 7 | display field | documented (D2) | M2 |
| X-36.8 | Matching Records | Lead Owner | column header | table, column 8 | display field | documented (D2) | M2 |
| X-37.1 | Matching Records | Record selection | checkbox | table row 1, first cell | select record | documented (D2) | M2 |
| X-37.2 | Matching Records | Record selection | checkbox | table row 2, first cell | select record | documented (D2) | M2 |
| X-37.3 | Matching Records | Record selection | checkbox | table row 3, first cell | select record | documented (D2) | M2 |
| X-37.4 | Matching Records | Record selection | checkbox | table row 4, first cell | select record | documented (D2) | M2 |
| X-37.5 | Matching Records | Record selection | checkbox | table row 5, first cell | select record | documented (D2) | M2 |

### Documented controls — D2: merge comparison

D2-image-4 shows a Contacts comparison. Its compact documentary shell is not the captured session shell: SH-01, SH-03, SH-05, SH-06, SH-09 and SH-27–SH-28/SH-30–SH-35 reappear; the additional truncated My Requ… link is listed below. No assistant icon appears in this illustration.

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-49 | Documentary shell | My Requ… | link | compact rail, fourth navigation row | not observed | documented (D2) | M2 |
| X-38 | Merge header | Information icon | icon button | beside page title | not observed | documented (D2) | M2 |
| X-39 | Merge header | Cancel | button | page header, right, first | not observed | documented (D2) | M2 |
| X-40 | Merge header | Merge | button | page header, right, last | commit merge | documented (D2) | M2 |
| X-41 | Merge comparison | Show Conflicts Only | checkbox | above table, right | hide matching fields | documented (D2) | M2 |
| X-42.1 | Merge comparison | Record 1 | toggle | comparison header, source column 1 | choose master | documented (D2) | M2 |
| X-43.1 | Merge comparison | Select All | link | comparison header, source column 1, after record | take source values | documented (D2) | M2 |
| X-42.2 | Merge comparison | Record 2 | toggle | comparison header, source column 2 | choose master | documented (D2) | M2 |
| X-43.2 | Merge comparison | Select All | link | comparison header, source column 2, after record | take source values | documented (D2) | M2 |
| X-42.3 | Merge comparison | Record 3 | toggle | comparison header, source column 3 | choose master | documented (D2) | M2 |
| X-43.3 | Merge comparison | Select All | link | comparison header, source column 3, after record | take source values | documented (D2) | M2 |
| X-44.1.1 | Merge comparison | Account Name value choice | toggle | Account Name row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.1.2 | Merge comparison | Account Name value choice | toggle | Account Name row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.1.3 | Merge comparison | Account Name value choice | toggle | Account Name row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.2.1 | Merge comparison | Contact Image value choice | toggle | Contact Image row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.2.2 | Merge comparison | Contact Image value choice | toggle | Contact Image row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.2.3 | Merge comparison | Contact Image value choice | toggle | Contact Image row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.3.1 | Merge comparison | Department value choice | toggle | Department row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.3.2 | Merge comparison | Department value choice | toggle | Department row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.3.3 | Merge comparison | Department value choice | toggle | Department row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.4.1 | Merge comparison | Email value choice | toggle | Email row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.4.2 | Merge comparison | Email value choice | toggle | Email row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.4.3 | Merge comparison | Email value choice | toggle | Email row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.5.1 | Merge comparison | First Name value choice | toggle | First Name row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.5.2 | Merge comparison | First Name value choice | toggle | First Name row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.5.3 | Merge comparison | First Name value choice | toggle | First Name row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.6.1 | Merge comparison | Last Name value choice | toggle | Last Name row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.6.2 | Merge comparison | Last Name value choice | toggle | Last Name row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.6.3 | Merge comparison | Last Name value choice | toggle | Last Name row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.7.1 | Merge comparison | Lead Source value choice | toggle | Lead Source row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.7.2 | Merge comparison | Lead Source value choice | toggle | Lead Source row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.7.3 | Merge comparison | Lead Source value choice | toggle | Lead Source row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.8.1 | Merge comparison | Mailing City value choice | toggle | Mailing City row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.8.2 | Merge comparison | Mailing City value choice | toggle | Mailing City row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.8.3 | Merge comparison | Mailing City value choice | toggle | Mailing City row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.9.1 | Merge comparison | Mailing State value choice | toggle | Mailing State row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.9.2 | Merge comparison | Mailing State value choice | toggle | Mailing State row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.9.3 | Merge comparison | Mailing State value choice | toggle | Mailing State row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.10.1 | Merge comparison | Mailing Street value choice | toggle | Mailing Street row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.10.2 | Merge comparison | Mailing Street value choice | toggle | Mailing Street row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.10.3 | Merge comparison | Mailing Street value choice | toggle | Mailing Street row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.11.1 | Merge comparison | Mailing Zip value choice | toggle | Mailing Zip row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.11.2 | Merge comparison | Mailing Zip value choice | toggle | Mailing Zip row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.11.3 | Merge comparison | Mailing Zip value choice | toggle | Mailing Zip row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.12.1 | Merge comparison | Phone value choice | toggle | Phone row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.12.2 | Merge comparison | Phone value choice | toggle | Phone row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.12.3 | Merge comparison | Phone value choice | toggle | Phone row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.13.1 | Merge comparison | Title value choice | toggle | Title row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.13.2 | Merge comparison | Title value choice | toggle | Title row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.13.3 | Merge comparison | Title value choice | toggle | Title row, source column 3 | select final field value | documented (D2) | M2 |

Modified Time is displayed without a radio choice in this example (D2-image-4). Record values and portraits are excluded.

### Documented controls — D3: deduplication

Images D3-image-3–D3-image-8 show field selection, confirmation, progress notice, conflict popup and conflict groups. D3-image-2 is an older menu illustration; current Contacts entry position is taken from m2-list-actions instead.

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| X-45.1 | Deduplicate fields | Email | checkbox | field panel, row 1 | choose match field | documented (D3) | M2 |
| X-45.2 | Deduplicate fields | Company | checkbox | field panel, row 2 | choose match field | documented (D3) | M2 |
| X-45.3 | Deduplicate fields | Phone | checkbox | field panel, row 3 | choose match field | documented (D3) | M2 |
| X-45.4 | Deduplicate fields | Mobile | checkbox | field panel, row 4 | choose match field | documented (D3) | M2 |
| X-46 | Deduplicate fields | Find And Merge Duplicates | button | field panel, footer left | start deduplication confirmation | documented (D3) | M2 |
| X-47 | Deduplicate fields | Cancel | button | field panel, footer right | not observed | documented (D3) | M2 |
| X-48 | Confirmation | Learn More | link | confirmation, below explanation | not observed | documented (D3) | M2 |
| X-49 | Confirmation | Cancel | button | confirmation, footer left | not observed | documented (D3) | M2 |
| X-50 | Confirmation | Yes, proceed | button | confirmation, footer right | start job | documented (D3) | M2 |
| X-51 | Progress notice | OK | button | notice, bottom centre | not observed | documented (D3) | M2 |
| X-52 | Conflict popup | Minus icon | icon button | popup title, right | not observed | documented (D3) | M2 |
| X-53 | Conflict popup | Do it later | button | popup body, right, first | defer resolution | documented (D3) | M2 |
| X-54 | Conflict popup | Resolve Now | button | popup body, right, second | open conflict groups | documented (D3) | M2 |
| X-55 | Conflict groups | Cancel | button | page header, right | not observed | documented (D3) | M2 |
| X-56.1 | Conflict groups | Email | tab | group panel, top left, 1 | switch match-field group | documented (D3) | M2 |
| X-56.2 | Conflict groups | Company | tab | group panel, top left, 2 | switch match-field group | documented (D3) | M2 |
| X-56.3 | Conflict groups | Mobile | tab | group panel, top left, 3 | switch match-field group | documented (D3) | M2 |
| X-57 | Conflict groups | Left arrow | icon button | group panel, upper right, first | pagination | documented (D3) | M2 |
| X-58 | Conflict groups | Right arrow | icon button | group panel, upper right, last | pagination | documented (D3) | M2 |
| X-59.1 | Conflict groups | Email | column header | table, first column | match value | documented (D3) | M2 |
| X-59.2 | Conflict groups | Duplicates | column header | table, second column | duplicate count | documented (D3) | M2 |
| X-60 | Conflict groups | View | button | group row, right | open comparison | documented (D3) | M2 |

## Behaviour and flows

- The saved Leads Actions menu has Deduplicate Leads at row 10; the saved Contacts Actions menu has Deduplicate Contacts at row 8. Neither execution was opened (list-actions; m2-list-actions).
- Record-specific discovery starts from record detail's More menu; modify initially supplied criteria, choose all/any matching, Search, select matches, then Next (D2).
- Comparison chooses a master and final field values, optionally selecting a whole source or showing conflicts only; Merge commits the result (D2).
- Module-wide discovery starts from Actions → Deduplicate [Module], chooses fields and confirms a job; identical records merge automatically, conflicts need review (D3).
- Conflict notification permits immediate resolution or deferral; the emailed resolution link expires after three days, and View opens the group's comparison (D3).

## Rules and limits

- Find and Merge requires the profile's Find and Merge permission, supports Leads and Contacts (plus Accounts, Deals, Vendors and custom modules), and accepts two or three selected records (D2).
- Record-specific search documents six criterion fields; the current per-module field list must come from metadata, not the illustrative values (D2).
- Deduplicate is restricted to administrators or the highest hierarchy, supports the same modules, allows up to three matching fields, and permits only one initiating user per module at a time (D3).
- Deduplicate offers configured unique fields or a module's default set; combined fields require matching values in all selected fields (D3).
- Automatic master selection uses the latest Last Activity Time and is not manually adjustable; conflict resolution separately documents a master choice (D3).
- At most three records merge together; larger conflict groups require choosing three (D3).
- Duplicates are permanently removed and merging has no undo; associated child records move to the master (D3).
- Attachments, notes and activities transfer; manual merge uses the oldest record's creation attribution (D2).
- Open activities inherit the master owner only when their owner matches the duplicate owner; Contacts' related Deals use the same owner-match condition, while other relationships retain ownership (D2).
- Manual merge can trigger Edit/Delete automation; automatic merges do not. Large related lists above 1000 use a scheduled merge with locked records and completion notification (D2).
- Read-only values have no selectable radio choice; no merged-record report/audit list is provided for Deduplicate (D3).

## Capability table

| Capability | Module | Evidence | Remaining |
| --- | --- | --- | --- |
| Record-specific discovery, criteria, selection | M2 | D2 | Current Contacts field defaults/operators |
| Master and per-field choice; conflicts-only | M2 | D2 | Validation and confirmation copy |
| Module-wide job, automatic merge, conflict review | M2 | m2-list-actions, D3 | Current runtime screens/results |
| Irreversible removal and related-record transfer | M2 | D2 / D3 | Failures, simultaneous changes |
| Notes/attachments transfer | M6 | D2 | Feature arrives with related content |
| Activities transfer/ownership | M5 | D2 / D3 | Runtime effect |
| Contacts' related Deals ownership | M4 | D2 | Runtime effect |
| Manual automation triggers | M12 / P3 | D2 | Later automation feature families |
| Large-list scheduled completion | M2 | D2 | Queue and notification states |

## Sources

- D2 — Public help: record-specific duplicate discovery and merge.
- D3 — Public help: module-wide automatic deduplication and conflict resolution.
- Captures: m2-list-actions (Contacts), list-actions (original Leads fallback).
- Document addresses, page/image copies and original sentence evidence stay in local research notes `docs-notes/m2-search-duplicates`.

## Shell controls missing from app-shell.md

Reuse the missing-shell list in global-search.md. Documentary My Requ… (SH-49) has an unresolved function/module and is not asserted as available in this session. SH-47/SH-48 are already described generically in the older shell specification.

## Unobserved control states

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| X-61 | Record rows | Hover-only action controls | icon button | row end | not observed | not observed | ? |

## Open questions

1. Not observed without a write: merge/job confirmation, validation, no-match and failure states; final result copy; cancellation once queued; partial failure, concurrent edits and permission loss; exact notification contents; timeline/audit events; locking and scheduling behaviour.
2. Not observed: Contacts' current criteria fields/operators, defaults, empty values, case/diacritic matching, duplicate-set ordering and pagination. Leads illustrations do not establish identical Contacts field lists. Both modules support the same tools (D2/D3), but Contacts has the related-Deals ownership exception (D2).
3. D3 says automatic master cannot be changed but manual conflict comparison allows a choice. Confirm the runtime distinction; do not apply the automatic constraint to every manual comparison.
4. D2's matching-list image says creation/read-only/hidden values are retained from the master, whereas its prose specifies oldest-record creation attribution. This documentary discrepancy needs a decision before implementing creation metadata preservation.
5. Hover-only row actions were not observed; no duplicate screen was opened live, and no additional toolbar/menu labels are inferred.
6. Unknown ownership: hover-only actions (X-61), spreadsheet view, announcement-count badge (SH-40.1), trash bin (SH-50), shared utilities from global-search.md and documentary My Requ… (SH-49). Deduplicate's later email notification delivery belongs to M10; the job remains M2.
7. D3 contains selected-field-only wording alongside conflict checks for other values; preserve the explicit conflict resolution rule, but exact blank-value and conflict evaluation needs clarification before automatic merge.


## Child-record integration boundary

Notes transfer to the merge master without changing their IDs. Contact merge
transfers Contact_Roles, retaining the master's existing row for repeated deals
and retaining one transferred row when multiple duplicates share another deal.
The fixture applies transfers on staged stores before committing the merge.

Open question: Lead conversion has no record-service operation yet, and the
reference behavior for notes on conversion remains unresearched. No conversion
transfer is implemented; updating an already converted Lead retains its notes
on that Lead. This regression test does not establish actual conversion parity.

Notes and Contact_Roles are child modules: generic CRUD and criteria-based
listing remain available, while global/advanced search, selectable module lists
and duplicate discovery exclude them. Export is not implemented on the current
RecordService port; any future export module picker must use the child-module
exclusion rather than all registered bundles.
