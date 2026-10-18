# Cases — list screen and module inventory

Status: MEP-838 research slice 1/5, submitted for UI Lead approval. Metadata and capture evidence are distinguished below.

## Purpose

Describe the Cases list and module configuration. Detail and form research belong to subsequent slices. No reference writes or persisted preference changes are permitted.

## Fields and layout

Source: research workspace `modules/Cases/fields.json` and `layouts.json`. Metadata is authoritative for configuration; it does not establish screen visibility. 30 fields.

| API name | Label | Type | System mandatory | Standard layout required |
| --- | --- | --- | --- | --- |
| `Case_Number` | Case Number | autonumber | no | no |
| `Owner` | Case Owner | ownerlookup | no | no |
| `Status` | Status | picklist | yes | yes |
| `Product_Name` | Product Name | lookup | no | no |
| `Priority` | Priority | picklist | no | no |
| `Type` | Type | picklist | no | no |
| `Case_Reason` | Case Reason | picklist | no | no |
| `Case_Origin` | Case Origin | picklist | yes | yes |
| `Subject` | Subject | text | yes | yes |
| `Related_To` | Related To | lookup | no | no |
| `No_of_comments` | No. of comments | integer | no | no |
| `Reported_By` | Reported By | text | no | no |
| `Email` | Email | email | no | no |
| `Phone` | Phone | phone | no | no |
| `Created_By` | Created By | ownerlookup | no | no |
| `Modified_By` | Modified By | ownerlookup | no | no |
| `Created_Time` | Created Time | datetime | no | no |
| `Modified_Time` | Modified Time | datetime | no | no |
| `Description` | Description | textarea | no | no |
| `Internal_Comments` | Internal Comments | textarea | no | no |
| `Solution` | Solution | textarea | no | no |
| `Add_Comment` | Add Comment | textarea | no | no |
| `Comments` | Comments | text | no | no |
| `Account_Name` | Account Name | lookup | no | no |
| `Deal_Name` | Deal Name | lookup | no | no |
| `Tag` | Tag | text | no | no |
| `id` | Record Id | bigint | no | no |
| `Locked__s` | Locked | boolean | no | no |
| `Last_Activity_Time` | Last Activity Time | datetime | no | no |
| `Connected_To__s` | Connected To | multi_module_lookup | no | no |

Picklists, metadata order:

- `Status`: New; Escalated; On Hold; Closed.
- `Priority`: -None-; High; Medium; Low.
- `Type`: -None-; Problem; Feature Request; Question.
- `Case_Reason`: -None-; User did not attend any training; Complex functionality; Existing problem; Instructions not clear; New problem.
- `Case_Origin`: -None-; Email; Phone; Web.

Layout sections, metadata order (not form observations):

- **Case Image** (1 columns): no field entries.
- **Case Information** (2 columns): `Owner`, `Case_Number`, `Status`, `Product_Name`, `Priority`, `Type`, `Case_Reason`, `Case_Origin`, `Subject`, `Related_To`, `No_of_comments`, `Account_Name`, `Reported_By`, `Deal_Name`, `Email`, `Tag`, `Phone`, `Created_By`, `Modified_By`, `Created_Time`, `Modified_Time`, `id`, `Last_Activity_Time`, `Connected_To__s`.
- **Description Information** (1 columns): `Description`, `Internal_Comments`.
- **Solution Information** (1 columns): `Solution`, `Add_Comment`.
- **Comment Information** (1 columns): `Comments`.

Related lists, metadata sequence; visibility is configuration, not a detail-screen observation. Equal sequence numbers are retained.

| Sequence | Label | API name | Visible |
| --- | --- | --- | --- |
| 1 | Connected Records | `Connected_Records__s` | true |
| 1 | Review Process-Review Summary | `Review_Processes` | false |
| 2 | Notes | `Notes` | true |
| 2 | Review Process-Field History | `Review_Logs` | false |
| 3 | WebformUsage | `WebformUsage` | false |
| 4 | Attachments | `Attachments` | true |
| 6 | Open Tasks | `Tasks` | true |
| 7 | Open Meetings | `Events` | true |
| 8 | Open Calls | `Calls` | true |
| 11 | Closed Calls | `Calls_History` | true |
| 12 | Closed Meetings | `Events_History` | true |
| 13 | Closed Tasks | `Tasks_History` | true |
| 14 | Mailing History | `Mailing_History` | true |
| 15 | Checklists | `CheckLists` | true |
| 16 | Emails | `Emails` | true |
| 17 | Locking Information | `Locking_Information__s` | true |
| 18 | Email Drafts | `Email_Drafts__s` | false |
| 18 | Email Sentiment | `Email_Sentiment` | false |

## Views

Source: `custom_views.json` and per-view files. Availability below must come from screen evidence, independently of criteria. System criterion fields absent from the field dictionary are not editable fields.

| View | Criteria | Columns, metadata order | Availability |
| --- | --- | --- | --- |
| All Cases (default) | None | `Case_Number`, `Subject`, `Status`, `Priority`, `Case_Origin`, `Related_To`, `Account_Name`, `Owner` | empty (deduced from All Cases = 0) |
| All Locked Cases | `Locked__s` equal True | `Subject`, `Status`, `Priority`, `Case_Origin`, `Related_To`, `Account_Name`, `Owner` | empty (deduced from All Cases = 0) |
| Closed Cases | `Status` equal Closed | `Case_Number`, `Subject`, `Status`, `Priority`, `Case_Origin`, `Related_To`, `Account_Name`, `Owner` | empty (deduced from All Cases = 0) |
| Escalated Cases | `Status` equal Escalated | `Case_Number`, `Subject`, `Status`, `Priority`, `Case_Origin`, `Related_To`, `Account_Name`, `Owner` | empty (deduced from All Cases = 0) |
| My Cases | `Owner` equal current user | `Case_Number`, `Subject`, `Status`, `Priority`, `Case_Origin`, `Related_To`, `Account_Name` | empty (deduced from All Cases = 0) |
| Open Cases | `Status` not_equal Closed | `Case_Number`, `Subject`, `Status`, `Priority`, `Case_Origin`, `Related_To`, `Account_Name`, `Owner` | empty (deduced from All Cases = 0) |
| Today's Cases | `Created_Time` equal today | `Case_Number`, `Subject`, `Status`, `Priority`, `Case_Origin`, `Related_To`, `Account_Name`, `Owner` | empty (deduced from All Cases = 0) |
| Unread Cases | `Common_Status` not_contains v | `Case_Number`, `Subject`, `Status`, `Priority`, `Case_Origin`, `Related_To`, `Account_Name`, `Owner` | empty (deduced from All Cases = 0) |

All metadata views have wrap text enabled and no pinned fields. No runtime default sort is inferred from null metadata sort values. View selection, saving and preference controls must not be used to establish availability.

## List screen

All Cases is painted and empty: Total Records 0. The filter panel is already open; it was not toggled. The empty-state exception in the issue applies: no record can be opened. All eight view criteria select subsets of this empty universe; their availability is empty by deduction, not by selecting views.

### Control inventory — m8-cases-list-base

Shell: SH-01–SH-11 and SH-26–SH-46 as in [contacts.md](contacts.md). SH-08 reads MCP here. SH-12–SH-25 are outside the current rail scroll position. KL-41–KL-54 list the visible replacement rail links; Cases is active. SH-46 (trash) is image-only. Top bar, utility strip and both screen corners were inspected. No shell controls were clicked.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KL-01 | View strip | All Cases | tab | left, first | not observed | seen (m8-cases-list-base) | M8 | CL-01 (campaigns.md) |
| KL-02 | View strip | Three dots / More Custom View | icon button | after current view | Opens the system-view menu | seen (m8-cases-list-base) | M8 | CL-02 (campaigns.md) |
| KL-03 | Toolbar | Filter | button | left, first | not observed | seen (m8-cases-list-base) | M8 | CL-03 (campaigns.md) |
| KL-04 | Toolbar | Sort | button | left, second | not observed | seen (m8-cases-list-base) | M8 | CL-04 (campaigns.md) |
| KL-05 | Toolbar | List view | icon button | view group, item 1 | not observed | seen (m8-cases-list-base) | M8 | CL-05 (campaigns.md) |
| KL-06 | Toolbar | Kanban view | icon button | view group, item 2 | not observed | seen (m8-cases-list-base) | M8 | CL-06 (campaigns.md) |
| KL-07 | Toolbar | Sheet view | icon button | view group, item 3 | not observed | seen (m8-cases-list-base) | M8 | CL-07 (campaigns.md) |
| KL-08 | Toolbar | Chart view | icon button | view group, item 4 | not observed | seen (m8-cases-list-base) | M8 | CL-08 (campaigns.md) |
| KL-09 | Toolbar | Timeline view | icon button | view group, item 5 | not observed | seen (m8-cases-list-base) | M8 | CL-09 (campaigns.md) |
| KL-10 | Toolbar | Two horizontal bars | icon button | view group, item 6 | not observed | seen (m8-cases-list-base) | M8 | CL-10 (campaigns.md) |
| KL-11 | Toolbar | Down chevron | icon button | view group, item 7 | not observed | seen (m8-cases-list-base) | M8 | CL-11 (campaigns.md) |
| KL-12 | Toolbar | Create Case | button | right group, main button | not observed | seen (m8-cases-list-base) | M8 | CL-12 (campaigns.md) |
| KL-13 | Toolbar | Down arrow / More | icon button | attached to Create Case | not observed | seen (m8-cases-list-base) | M6 | CL-13 (campaigns.md) |
| KL-14 | Toolbar | Three dots / Actions | icon button | far right | Opens Actions menu | seen (m8-cases-list-base) | M8 | CL-14 (campaigns.md) |
| KL-15 | Filter panel | Search | input | below title | not observed | seen (m8-cases-list-base) | M8 | CL-15 (campaigns.md) |
| KL-16 | Filter panel | System Defined Filters | toggle | first section heading | not observed | seen (m8-cases-list-base) | M8 | CL-16 (campaigns.md) |
| KL-17 | Filter panel | Latest Email Status | checkbox | system section, item 1 | not observed | seen (m8-cases-list-base) | M8 | L-17 (contacts.md) |
| KL-18 | Filter panel | Locked | checkbox | system section, item 2 | not observed | seen (m8-cases-list-base) | M8 | AL-20 (accounts.md) |
| KL-19 | Filter panel | Record Action | checkbox | system section, item 3 | not observed | seen (m8-cases-list-base) | M8 | CL-17 (campaigns.md) |
| KL-20 | Filter panel | Related Records Action | checkbox | system section, item 4 | not observed | seen (m8-cases-list-base) | M8 | CL-18 (campaigns.md) |
| KL-21 | Filter panel | Touched Records | checkbox | system section, item 5 | not observed | seen (m8-cases-list-base) | M8 | CL-19 (campaigns.md) |
| KL-22 | Filter panel | Untouched Records | checkbox | system section, item 6 | not observed | seen (m8-cases-list-base) | M8 | CL-20 (campaigns.md) |
| KL-23 | Filter panel | Filter By Fields | toggle | second section heading | not observed | seen (m8-cases-list-base) | M8 | CL-21 (campaigns.md) |
| KL-24 | Filter panel | Account Name | checkbox | field section, visible item 1 | not observed | seen (m8-cases-list-base) | M8 | AL-27 (accounts.md) |
| KL-25 | Filter panel | Case Number | checkbox | field section, visible item 2 | not observed | seen (m8-cases-list-base) | M8 | new |
| KL-26 | Filter panel | Case Origin | checkbox | field section, visible item 3 | not observed | seen (m8-cases-list-base) | M8 | new |
| KL-27 | Filter panel | Case Owner | checkbox | field section, visible item 4 | not observed | seen (m8-cases-list-base) | M8 | CL-25 moved (campaigns.md) |
| KL-28 | Filter panel | Case Reason | checkbox | field section, visible item 5 | not observed | seen (m8-cases-list-base) | M8 | new |
| KL-29 | Filter panel | Connected To | checkbox | field section, visible item 6 | not observed | seen (m8-cases-list-base) | M8 | CL-26 moved (campaigns.md) |
| KL-30 | Filter panel | Created By | checkbox | field section, visible item 7 | not observed | seen (m8-cases-list-base) | M8 | CL-27 moved (campaigns.md) |
| KL-31 | Filter panel | Created Time | checkbox | field section, visible item 8 | not observed | seen (m8-cases-list-base) | M8 | CL-28 moved (campaigns.md) |
| KL-32 | Table | View Settings / sliders | icon button | header, far right overlay | not observed | seen (m8-cases-list-base) | M11 | CL-32 (campaigns.md) |
| KL-33 | Table | Case Number | column header | first text column | not observed | seen (m8-cases-list-base) | M8 | new |
| KL-34 | Table | Subject | column header | second text column | not observed | seen (m8-cases-list-base) | M8 | new |
| KL-36 | Table | Status | column header | third text column | not observed | seen (m8-cases-list-base) | M8 | CL-36 moved (campaigns.md) |
| KL-37 | Table | Priority | column header | fourth text column | not observed | seen (m8-cases-list-base) | M8 | new |
| KL-35 | Table | All with down arrow | select | inside Subject header | not observed | seen (m8-cases-list-base) | M8 | CL-34 moved (campaigns.md) |
| KL-38 | Table | No Cases found. | status text | empty table body | Displays empty results | seen (m8-cases-list-base) | M8 | CL-38 (campaigns.md) |
| KL-39 | List footer | Total Records 0 | badge | bottom left | Displays zero total | seen (m8-cases-list-base) | M8 | CL-39 (campaigns.md) |
| KL-41 | Rail | Products | link | visible module row 1 | not observed | seen (m8-cases-list-base) | P2 | new |
| KL-42 | Rail | Quotes | link | visible module row 2 | not observed | seen (m8-cases-list-base) | P2 | new |
| KL-43 | Rail | Invoices | link | visible module row 3 | not observed | seen (m8-cases-list-base) | P2 | new |
| KL-44 | Rail | Sales Orders | link | visible module row 4 | not observed | seen (m8-cases-list-base) | P2 | new |
| KL-45 | Rail | Solutions | link | visible module row 5 | not observed | seen (m8-cases-list-base) | M8 | new |
| KL-46 | Rail | Social | link | visible module row 6 | not observed | seen (m8-cases-list-base) | M15 | new |
| KL-47 | Rail | Forecasts | link | visible module row 7 | not observed | seen (m8-cases-list-base) | P2 | new |
| KL-48 | Rail | Purchase Orders | link | visible module row 8 | not observed | seen (m8-cases-list-base) | P2 | new |
| KL-49 | Rail | Vendors | link | visible module row 9 | not observed | seen (m8-cases-list-base) | P2 | new |
| KL-50 | Rail | SalesInbox | link | visible module row 10 | not observed | seen (m8-cases-list-base) | M10 | new |
| KL-51 | Rail | Cases | link | visible module row 11 | not observed | seen (m8-cases-list-base) | M8 | new |
| KL-52 | Rail | My Jobs | link | visible module row 12 | not observed | seen (m8-cases-list-base) | ? | new |
| KL-53 | Rail | Services | link | visible module row 13 | not observed | seen (m8-cases-list-base) | ? | new |
| KL-54 | Rail | Projects | link | visible module row 14 | not observed | seen (m8-cases-list-base) | ? | new |
| KL-55 | Rail | Right resize handle | separator | right edge of navigation rail | not observed | seen (m8-cases-list-base) | M1 | new |
| KL-56 | Filter panel | Right resize handle | separator | right edge of filter panel | not observed | seen (m8-cases-list-base) | M1 | new |

KL-40: Refresh Custom View is DOM-only and unpainted in this base; not observed visually. The bottom edge shows only a fragment of the next field-filter checkbox; its label and full control are clipped. No visible select-all checkbox, record row, row-end action or paging control. Case Origin, Related To, Account Name and Case Owner table columns are offscreen.

Bulk selection: Ref [contacts.md](contacts.md) L-34 / L-40 and [list-views.md](list-views.md), selection and bulk actions; no selection attempted.

### Control inventory — m8-cases-list-views

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KL-02.1 | View menu | Public Views | toggle | popup, row 1 | not observed; not selected | seen (m8-cases-list-views) | M8 | CL-02.1 (campaigns.md) |
| KL-02.2 | View menu | All Cases | menu item | popup, row 2 | not observed; not selected | seen (m8-cases-list-views) | M8 | CL-02.3 moved (campaigns.md) |
| KL-02.3 | View menu | All Locked Cases | menu item | popup, row 3 | not observed; not selected | seen (m8-cases-list-views) | M8 | AL-02.3 (accounts.md) |
| KL-02.4 | View menu | Closed Cases | menu item | popup, row 4 | not observed; not selected | seen (m8-cases-list-views) | M8 | new |
| KL-02.5 | View menu | Escalated Cases | menu item | popup, row 5 | not observed; not selected | seen (m8-cases-list-views) | M8 | new |
| KL-02.6 | View menu | My Cases | menu item | popup, row 6 | not observed; not selected | seen (m8-cases-list-views) | M8 | new |
| KL-02.7 | View menu | Open Cases | menu item | popup, row 7 | not observed; not selected | seen (m8-cases-list-views) | M8 | new |
| KL-02.8 | View menu | Today's Cases | menu item | popup, row 8 | not observed; not selected | seen (m8-cases-list-views) | M8 | new |
| KL-02.9 | View menu | Unread Cases | menu item | popup, row 9 | not observed; not selected | seen (m8-cases-list-views) | M8 | CL-02.5 moved (campaigns.md) |
| KL-02.10 | View menu | Show custom views as Dropdown | button | popup, row 10 | not observed; not selected | seen (m8-cases-list-views) | M11 | CL-02.6 moved (campaigns.md) |
| KL-02.11 | View menu | New Custom View | menu item | popup, row 11 | not observed; not selected | seen (m8-cases-list-views) | M11 | CL-02.7 moved (campaigns.md) |
| KL-02.12 | View menu | Manage Custom View | menu item | popup, row 12 | not observed; not selected | seen (m8-cases-list-views) | M11 | CL-02.8 moved (campaigns.md) |

KL-40 Refresh Custom View is painted to the right of the menu in this capture; not clicked. Rest: as in m8-cases-list-base; covered by overlay: part of the filter panel, KL-33 and KL-34. Check mark on All Cases indicates the active view. No view was selected.

Reconciliation: base items 1–319 retain their mappings, except 157–158 now map to the visibly painted KL-40. Items 320–322, 324, 348–349 are menu wrappers, excluded as structural duplicates. Item 323 → KL-02.1; 325–332 → KL-02.2–KL-02.9; 333 → KL-02.10; 334–335 → KL-02.11; 336–338 → KL-02.12. 339 is the refresh-icon duplicate (KL-40). Base items 320–327 shift to 340–347. All 349 entries accounted for.

### Create menu — not observed

The requested opening was rejected by automatic approval review before execution because the split-button selector could enter an import workflow. No command ran, no capture exists and no alternate selector was tried. Contents remain not observed; Ref CL-13 and the guarded m7-list-create-menu state in [campaigns.md](campaigns.md).

### Control inventory — m8-cases-list-actions

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KL-14.1 | Actions menu | Mass Transfer | menu item | popup, row 1 | not observed; not selected | seen (m8-cases-list-actions) | M8 | CL-14.1 (campaigns.md) |
| KL-14.2 | Actions menu | Mass Delete | menu item | popup, row 2 | not observed; not selected | seen (m8-cases-list-actions) | M8 | CL-14.2 (campaigns.md) |
| KL-14.3 | Actions menu | Mass Update | menu item | popup, row 3 | not observed; not selected | seen (m8-cases-list-actions) | M8 | CL-14.3 (campaigns.md) |
| KL-14.4 | Actions menu | Manage Tags | menu item | popup, row 4 | not observed; not selected | seen (m8-cases-list-actions) | M6 | CL-14.4 (campaigns.md) |
| KL-14.5 | Actions menu | Drafts | menu item | popup, row 5 | not observed; not selected | seen (m8-cases-list-actions) | M8 | CL-14.5 (campaigns.md) |
| KL-14.6 | Actions menu | Mass Email | menu item | popup, row 6 | not observed; not selected | seen (m8-cases-list-actions) | M10 | new |
| KL-14.7 | Actions menu | Approve Cases | menu item | popup, row 7 | not observed; not selected | seen (m8-cases-list-actions) | P3 | new |
| KL-14.8 | Actions menu | Create Client Script | menu item | popup, row 8 | not observed; not selected | seen (m8-cases-list-actions) | M11 | CL-14.6 moved (campaigns.md) |
| KL-14.9 | Actions menu | Export Cases | menu item | popup, row 9 | not observed; not selected | seen (m8-cases-list-actions) | M6 | CL-14.7 moved (campaigns.md) |
| KL-14.10 | Actions menu | Sheet view | menu item | popup, row 10 | not observed; not selected | seen (m8-cases-list-actions) | ? | CL-14.8 moved (campaigns.md) |
| KL-14.11 | Actions menu | Print View | menu item | popup, row 11 | not observed; not selected | seen (m8-cases-list-actions) | M8 | CL-14.9 moved (campaigns.md) |

KL-40 Refresh Custom View is painted after the view-group chevron, not clicked; Ref CL-40 (campaigns.md). Print View includes a submenu arrow, not opened. Sheet view has a branded prefix omitted here. Sparkles on Create Client Script and Print View are decorative. Rest: as in m8-cases-list-base; covered by overlay: KL-37 and KL-32, plus right-hand empty table area.

Reconciliation: items 1–303 keep base assignments, except 157–158 now map to KL-40. 304–306 are the same hidden hovercard/terms elements as base 305–306/304, excluded. 307–308 → KL-14.1; 309–310 → .2; 311–312 → .3; 313–314 → .4; 315 is a hidden empty assignment link, excluded; 316–317 → .5; 318–319 → .6; 320–321 → .7; 322 → .8; 323 → .9. 324–336 map to base 307–319; 337 → KL-40 (duplicate); 338–345 map to base 320–327; 346 is a menu wrapper, excluded. All 346 entries accounted for. KL-14.10 and KL-14.11 are image-only additions.

### Reconciliation — m8-cases-list-base

Each controls.json ordinal maps once below. Ordinals are offline evidence references, never selectors. Wrappers and child inputs share a number.

| Inventory or exclusion | Source ordinals |
| --- | --- |
| KL-01 | 140 |
| KL-02 | 141, 142, 143, 144, 145 |
| KL-03 | 146 |
| KL-04 | 147 |
| KL-05 | 149 |
| KL-06 | 150 |
| KL-07 | 151 |
| KL-08 | 152 |
| KL-09 | 153 |
| KL-10 | 154 |
| KL-11 | 155, 156 |
| KL-12 | 159 |
| KL-13 | 160, 161 |
| KL-14 | 162, 320 |
| KL-15 | 165, 166, 321 |
| KL-16 | 168 |
| KL-17 | 170, 171 |
| KL-18 | 172, 173 |
| KL-19 | 174, 175 |
| KL-20 | 176, 177 |
| KL-21 | 178, 179 |
| KL-22 | 180, 181 |
| KL-23 | 182 |
| KL-24 | 184, 185 |
| KL-25 | 186, 187 |
| KL-26 | 188, 189 |
| KL-27 | 190, 191 |
| KL-28 | 192, 193 |
| KL-29 | 194, 195 |
| KL-30 | 196, 197 |
| KL-31 | 198, 199 |
| KL-32 | 246 |
| KL-33 | 256 |
| KL-34 | 257 |
| KL-36 | 260 |
| KL-37 | 261 |
| KL-35 | 258, 259 |
| KL-38 | 281 |
| KL-39 | 291 |
| KL-41 | 66, 67, 68 |
| KL-42 | 69, 70, 71 |
| KL-43 | 72, 73, 74 |
| KL-44 | 75, 76, 77 |
| KL-45 | 78, 79, 80 |
| KL-46 | 81, 82, 83 |
| KL-47 | 84, 85, 86 |
| KL-48 | 87, 88, 89 |
| KL-49 | 90, 91, 92 |
| KL-50 | 93, 94, 95 |
| KL-51 | 96, 97, 98 |
| KL-52 | 99, 100, 101 |
| KL-53 | 102, 103, 104 |
| KL-54 | 105, 106, 107 |
| KL-55 | 109 |
| KL-56 | 244 |
| SH-01 | 2, 3, 4 |
| SH-02 | 11 |
| SH-03 | 12, 13, 14 |
| SH-04 | 15, 16, 17 |
| SH-05 | 18, 19, 20 |
| SH-06 | 21, 22, 23 |
| SH-07 | 24, 25, 26 |
| SH-08 | 27, 28, 29 |
| SH-09 | 30, 31, 32 |
| SH-10 | 34 |
| SH-11 | 35, 36 |
| SH-26 | 113 |
| SH-27 | 114 |
| SH-28 | 116 |
| SH-29 | 117 |
| SH-30 | 118 |
| SH-31 | 121 |
| SH-32 | 124 |
| SH-33 | 127, 128 |
| SH-34 | 131, 132, 133, 134 |
| SH-35 | 308 |
| SH-36 | 309 |
| SH-37 | 310 |
| SH-38 | 311 |
| SH-39 | 312 |
| SH-40 | 313 |
| SH-41 | 314 |
| SH-42 | 315 |
| SH-43 | 316 |
| SH-44 | 317 |
| SH-45 | 318 |
| Excluded: structural wrapper / duplicate, no separate visible control | 1, 111, 115, 139, 148, 164, 169, 183, 245, 249, 250, 251, 252, 253, 254, 255, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 307, 322, 323, 324, 325, 327 |
| Excluded: zero-area hidden element | 5, 6, 7, 8, 9, 10, 33, 108, 110, 112, 119, 120, 122, 123, 125, 126, 129, 130, 135, 136, 137, 138, 163, 167, 242, 243, 247, 248, 282, 283, 284, 285, 286, 287, 288, 289, 290, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 319 |
| Excluded: rail modules above current scroll position; not painted | 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65 |
| Excluded: refresh control exists in DOM but unpainted in base image (KL-40; not observed) | 157, 158 |
| Excluded: clipped filter or offscreen table content; not visually observed | 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 262, 263, 264, 265, 266, 326 |

All 327 source items accounted for: 159 mapped items, 168 excluded items. Image-only SH-46 is additional.


### Control inventory — m8-cases-list-after

No changed visible controls. Rest: as in m8-cases-list-base; covered by overlay: none. The image was opened: Total Records remains 0 → 0, record links 0 → 0; no evidence of a reference change. Refresh remains unpainted. All 327 controls.json entries retain base mappings except hidden items 304–306, reordered to base 305, 306, 304 respectively; all three remain excluded.

## Capture self-audit

Numbers below count distinct inventory references receiving source items; image-only additions are separate. Exclusions are hidden, clipped, offscreen or structural duplicates, detailed in each reconciliation. Every screenshot was opened as an image.

| Slug | controls.json items | Distinct mapped numbers | Excluded items | Image-only additions |
| --- | --- | --- | --- | --- |
| m8-cases-list-base | 327 | 86 | 168 | 1 (trash) |
| m8-cases-list-views | 349 | 99 | 172 | 1 (trash) |
| m8-cases-list-actions | 346 | 96 | 168 | 3 (trash, Sheet view, Print View) |
| m8-cases-list-after | 327 | 86 | 168 | 1 (trash) |

All capture safety comparisons were posted to the issue before the next capture. No unexpected non-GET path or count increase occurred. Expected blocked background/telemetry calls remain blocked. All requested opening clicks executed without skips; the Create split-menu call was rejected before execution and is not a capture. No tabs were closed.

### Shell controls missing from app-shell.md

Services (KL-53), Projects (KL-54) and the rail resize handle (KL-55) are observed here but not described by app-shell.md. The other additional rail links are named in its metadata inventory; KL-41–KL-54 establish their visible positions in this capture. The filter resize handle KL-56 is listed separately as a shared list control.

## Capture refs

- `m8-cases-list-base` — painted default empty list, filter panel already open.
- `m8-cases-list-views` — open system-view menu; no view selected.
- `m8-cases-list-actions` — open Actions menu; no operation selected.
- `m8-cases-list-after` — final passive comparison.

No Create-menu capture exists: automatic approval review rejected the call before execution. No tabs were closed.

## Evidence gaps

| Item | Source | Provisional rule proposal |
| --- | --- | --- |
| Populated rows, row-end actions, hover controls | No records in observed default list; inherited list inventory in contacts.md L-39–L-46 | Reuse shared record-list controls; retain module-specific row actions as not observed until gate decision. Never create reference records to obtain evidence. |
| Paging and page-size controls | D3, Common Operations with Records, Record Navigation; not observed on empty list | Reuse shared previous/next and page-size controls only for populated lists; no paging arrows in the observed empty state. Exact module behavior awaits gate decision. |
| Create split-menu contents | Opening not executed; guarded control | Keep contents not observed. D1/D2 document manual creation and file import capabilities, but do not establish current menu labels or order. |
| Filter fields below viewport and related-module filters | controls.json DOM only; clipped in screenshot | Keep DOM-only catalogue separate from visible-control inventory; reuse shared panel scroll behavior, no toggle or filter application. |
| System-view selection and availability | View metadata and default list total | Do not select a view or change persisted preferences; distinguish subset deduction from observed empty results. |

### DOM-only filter catalogue

The following are present in controls.json below the visible panel cutoff, not screen observations: Deal Name; Email; Last Activity Time; Modified By; Modified Time; No. of comments; Phone; Priority; Product Name; Related To; Reported By; Status; Subject; Tag; Type. The related-module section contains Calls, Emails, Meetings, Notes and Tasks in DOM order. The first Deal Name checkbox is only a bottom-edge fragment in the image. No scrolling, field toggle or filter application was performed.

## Public documentation

Read-only public help consulted on 2026-10-17; neutral source keys avoid copying product identifiers or URLs into the repository. Article titles and headings are sufficient locators within the reference CRM public help. These are documented capabilities, not observations of this account.

- D1 — Working with Cases, Creating Cases: manual creation and file import are supported. No write was performed.
- D2 — Working with Solutions, Creating Solutions: manual creation and file import are supported; Solution Title, Question and Answer are required. Metadata determines the configured types and layout here.
- D3 — Common Operations with Records, Record Navigation: list navigation supports previous/next pages and a selectable page size. Exact empty-list controls are established only by the images.

## Open questions

- Exact populated row-end and hover-only controls remain not observed because both default lists are empty. CTO collects the evidence-gap decisions at the module gate; no board question is opened in this slice.
- Sheet view attribution and the rail links My Jobs, Services and Projects are unresolved (`?`), pending the module gate.
- Create split-menu opening is not observed following the automatic approval rejection; no alternative access was attempted.
