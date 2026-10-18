# Cases

Status: integrated Module 8 list, detail and form research; form slice MEP-841 submitted for UI Lead review. Metadata and capture evidence are distinguished below.

Research slice: MEP-839, Module 8 record detail. This file records the authorized empty-list fallback; it does not establish a visually observed detail screen.

## Purpose

Describe the Cases list and module configuration. Detail and form research belong to subsequent slices. No reference writes or persisted preference changes are permitted.

Describe the available evidence for a case detail, its comments, Timeline and related cards without writing to the reference CRM. The All Cases view contains no records. No record was created, no preference changed, no menu opened and no tab closed.

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

## Record detail

### Availability and evidence boundary

`m8d-cases-list-base` is a painted empty All Cases list: module-specific title, 55 API calls, visible “No Cases found.” and Total Records 0; zero record links. The issue explicitly permits this fallback when no record can be opened. The record-link painting condition cannot hold for an empty dataset; no claim of a populated painting gate is made. Diagnostics contain client errors, but the image shows the list controls and empty state. No longer wait or invented detail URL was used.

Header, Edit, More Options contents, previous/next arrows, Overview, Timeline, Timeline filter, related-list rail and detail card geometry are **not observed**. No KD number below represents an unseen detail control. The numbered inventory belongs to the fallback screen only.

### Control inventory — m8d-cases-list-base

Shell: SH-01–SH-11 and SH-26–SH-46 as in [contacts.md](contacts.md), with SH-08 labelled MCP. SH-46 is image-only. SH-12–SH-25 are clipped by the already-scrolled navigation viewport, not visible. The Cases navigation item is selected. No scrolling or preference toggle was performed. The visible extra rail entries are listed separately below; their destination behaviour and uncertain owning modules remain unobserved.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KD-01 | List | All Cases | tab | view strip, first | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-01 (accounts.md) |
| KD-02 | List | More Custom View / three dots | icon button | after All Cases | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-02 moved (accounts.md) |
| KD-03 | List | Filter | button | toolbar, left first | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-03 (accounts.md) |
| KD-04 | List | Sort | button | toolbar, left second | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-04 (accounts.md) |
| KD-05 | List | List view | icon button | toolbar view group, 1 | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-05 (accounts.md) |
| KD-06 | List | Kanban view | icon button | toolbar view group, 2 | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-06 (accounts.md) |
| KD-07 | List | Sheet view | icon button | toolbar view group, 3 | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-07 (accounts.md) |
| KD-08 | List | Chart view | icon button | toolbar view group, 4 | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-08 (accounts.md) |
| KD-09 | List | Timeline view | icon button | toolbar view group, 5 | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-09 (accounts.md) |
| KD-10 | List | Two horizontal bars | icon button | toolbar view group, 6 | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-10 (accounts.md) |
| KD-11 | List | Down chevron | icon button | toolbar view group, 7 | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-11 (accounts.md) |
| KD-12 | List | Create Case | button | toolbar, right first | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-12 (accounts.md) |
| KD-13 | List | More / down arrow | icon button | attached to Create Case | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-13 (accounts.md) |
| KD-14 | List | Actions / three dots | icon button | toolbar, far right | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-14 (accounts.md) |
| KD-15 | List | Search | input | filter panel, below title | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-15 (accounts.md) |
| KD-16 | List | System Defined Filters | toggle | filter panel, first heading | not observed; no click | seen (m8d-cases-list-base) | M8 | AL-16 (accounts.md) |
| KD-17 | List | Latest Email Status | checkbox | system section, 1 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-19 (contacts.md) |
| KD-18 | List | Locked | checkbox | system section, 2 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-20 (contacts.md) |
| KD-19 | List | Record Action | checkbox | system section, 3 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-21 (contacts.md) |
| KD-20 | List | Related Records Action | checkbox | system section, 4 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-22 (contacts.md) |
| KD-21 | List | Touched Records | checkbox | system section, 5 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-23 (contacts.md) |
| KD-22 | List | Untouched Records | checkbox | system section, 6 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-24 (contacts.md) |
| KD-23 | List | Filter By Fields | toggle | filter panel, second heading | not observed; no click | seen (m8d-cases-list-base) | M8 | L-26 (contacts.md) |
| KD-24 | List | Account Name | checkbox | field section, 1 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-27 (contacts.md) |
| KD-25 | List | Case Number | checkbox | field section, 2 | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-26 | List | Case Origin | checkbox | field section, 3 | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-27 | List | Case Owner | checkbox | field section, 4 | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-28 | List | Case Reason | checkbox | field section, 5 | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-29 | List | Connected To | checkbox | field section, 6 | not observed; no click | seen (m8d-cases-list-base) | M8 | L-30 (contacts.md) |
| KD-30 | List | Created By | checkbox | field section, 7 | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-31 | List | Created Time | checkbox | field section, 8 | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-32 | List | Deal Name (partly clipped) | checkbox | field section, 9 | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-33 | List | View Settings / sliders | icon button | table header, far right overlay | not observed; no click | seen (m8d-cases-list-base) | M11 | L-33 (contacts.md) |
| KD-34 | List | Case Number | column header | first text column | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-35 | List | Subject | column header | second text column | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-36 | List | All / down arrow | select | inside Subject header | not observed; no click | seen (m8d-cases-list-base) | M8 | L-36 (contacts.md) |
| KD-37 | List | Status | column header | third text column | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-38 | List | Priority | column header | fourth text column | not observed; no click | seen (m8d-cases-list-base) | M8 | new |

Refresh Custom View exists in the DOM but is not painted. No row selection, row-end action or pagination arrow is visible. Case Origin, Related To, Account Name and Case Owner table headers are offscreen DOM evidence, not image observations. Deal Name is only partly visible at the bottom of the field-filter viewport.

#### Shell controls missing from the inherited inventory

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KD-S01 | Rail | Products | link | module rail, visible row 1 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S02 | Rail | Quotes | link | module rail, visible row 2 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S03 | Rail | Invoices | link | module rail, visible row 3 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S04 | Rail | Sales Orders | link | module rail, visible row 4 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S05 | Rail | Solutions | link | module rail, visible row 5 below Search | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-S06 | Rail | Social | link | module rail, visible row 6 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S07 | Rail | Forecasts | link | module rail, visible row 7 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S08 | Rail | Purchase Orders | link | module rail, visible row 8 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S09 | Rail | Vendors | link | module rail, visible row 9 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S10 | Rail | SalesInbox | link | module rail, visible row 10 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S11 | Rail | Cases | link | module rail, visible row 11 below Search | not observed; no click | seen (m8d-cases-list-base) | M8 | new |
| KD-S12 | Rail | My Jobs | link | module rail, visible row 12 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S13 | Rail | Services | link | module rail, visible row 13 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |
| KD-S14 | Rail | Projects | link | module rail, visible row 14 below Search | not observed; no click | seen (m8d-cases-list-base) | ? | new |

### Offline reconciliation

Every controls.json entry is assigned below by its one-based source ordinal. Hidden duplicates are mapped to their visible control when meaningful; unrelated containers are excluded. The screenshot was opened as an image and inspected through the lower utility strip and right corners. SH-46 (trash icon) is the image-only addition. No overlay was opened.

| Source ordinal(s) | Inventory reference or exclusion |
| --- | --- |
| 1, 5, 6, 7, 8, 9, 10, 33, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96, 99, 102, 105, 108, 110, 111, 112, 115, 119, 120, 122, 123, 125, 126, 129, 130, 135, 136, 137, 138, 139, 148, 163, 164, 167, 169, 183, 242, 243, 245, 247, 248, 249, 250, 251, 252, 253, 254, 255, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 322, 323, 324, 325, 326, 327 | Excluded: structural wrappers, hidden overlays, empty cells, static text or duplicate containers |
| 2, 3, 4 | SH-01 |
| 11 | SH-02 |
| 12, 13, 14 | SH-03 |
| 15, 16, 17 | SH-04 |
| 18, 19, 20 | SH-05 |
| 21, 22, 23 | SH-06 |
| 24, 25, 26 | SH-07 |
| 27, 28, 29 | SH-08 |
| 30, 31, 32 | SH-09 |
| 34 | SH-10 |
| 35, 36 | SH-11 |
| 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65 | Excluded: clipped navigation groups / links behind the rail viewport |
| 67, 68 | KD-S01 |
| 70, 71 | KD-S02 |
| 73, 74 | KD-S03 |
| 76, 77 | KD-S04 |
| 79, 80 | KD-S05 |
| 82, 83 | KD-S06 |
| 85, 86 | KD-S07 |
| 88, 89 | KD-S08 |
| 91, 92 | KD-S09 |
| 94, 95 | KD-S10 |
| 97, 98 | KD-S11 |
| 100, 101 | KD-S12 |
| 103, 104 | KD-S13 |
| 106, 107 | KD-S14 |
| 109, 244 | Excluded: resize hotspots without a painted grip |
| 113 | SH-26 |
| 114 | SH-27 |
| 116 | SH-28 |
| 117 | SH-29 |
| 118 | SH-30 |
| 121 | SH-31 |
| 124 | SH-32 |
| 127, 128 | SH-33 |
| 131, 132, 133, 134 | SH-34 |
| 140 | KD-01 |
| 141, 142, 143, 144, 145 | KD-02 |
| 146 | KD-03 |
| 147 | KD-04 |
| 149 | KD-05 |
| 150 | KD-06 |
| 151 | KD-07 |
| 152 | KD-08 |
| 153 | KD-09 |
| 154 | KD-10 |
| 155, 156 | KD-11 |
| 157, 158 | Excluded: unpainted Refresh Custom View |
| 159 | KD-12 |
| 160, 161 | KD-13 |
| 162, 320 | KD-14 |
| 165, 166, 321 | KD-15 |
| 168 | KD-16 |
| 170, 171 | KD-17 |
| 172, 173 | KD-18 |
| 174, 175 | KD-19 |
| 176, 177 | KD-20 |
| 178, 179 | KD-21 |
| 180, 181 | KD-22 |
| 182 | KD-23 |
| 184, 185 | KD-24 |
| 186, 187 | KD-25 |
| 188, 189 | KD-26 |
| 190, 191 | KD-27 |
| 192, 193 | KD-28 |
| 194, 195 | KD-29 |
| 196, 197 | KD-30 |
| 198, 199 | KD-31 |
| 200, 201 | KD-32 |
| 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241 | Excluded: offscreen field / related-module filters |
| 246 | KD-33 |
| 256 | KD-34 |
| 257 | KD-35 |
| 258, 259 | KD-36 |
| 260 | KD-37 |
| 261 | KD-38 |
| 262, 263, 264, 265, 266 | Excluded: offscreen table headers |
| 309 | SH-35 |
| 310 | SH-36 |
| 311 | SH-37 |
| 312 | SH-38 |
| 313 | SH-39 |
| 314 | SH-40 |
| 315 | SH-41 |
| 316 | SH-42 |
| 317 | SH-43 |
| 318 | SH-44 |
| 319 | SH-45 |

### Metadata-backed detail sections

Source M1: research metadata `modules/Cases/fields.json`, `layouts.json`, `related_lists.json`; 30 fields. Metadata establishes field types and layout membership, not actual detail rendering, collapse state or card order. No field values are reproduced.

- **Case Image:** empty field list in layout metadata; rendering not observed.
- **Case Information:** `Owner`, `Case_Number`, `Status`, `Product_Name`, `Priority`, `Type`, `Case_Reason`, `Case_Origin`, `Subject`, `Related_To`, `No_of_comments`, `Account_Name`, `Reported_By`, `Deal_Name`, `Email`, `Tag`, `Phone`, `Created_By`, `Modified_By`, `Created_Time`, `Modified_Time`, `id`, `Last_Activity_Time`, `Connected_To__s`.
- **Description Information:** `Description` and `Internal_Comments`, both textarea.
- **Solution Information:** `Solution` and `Add_Comment`, both textarea.
- **Comment Information:** `Comments`, text. `No_of_comments` is integer; its relation to any painted badge is not observed.
- `Locked__s` is boolean in the field dictionary, absent from these layout section fields.

### Public documentation evidence

D1: reference CRM public help, **Working with Cases**, sections “Standard fields in the Cases module”, “Emails in Cases”, “Associate Case with Other Records”; accessed 2026-10-17. Locator: help knowledge base → CRM → Customer Support → `working-with-cases`. Vendor-bearing source URLs are deliberately not stored in the repository.

D1 describes description and resolution text, internal follow-up notes and solution comments. It documents composing case email for the related contact, with a default primary address and alternative addresses. Case-related emails can be filtered by sent messages or contact-associated messages. It describes related activities, completed history, attachments and notes. These are documented capabilities, not observations of button positions. D1 contains a mismatched module label in its association instructions; metadata governs module membership. No documentation screenshot or image asset was copied.

### Related-list cards

Each subsection below is **metadata only** (M1). Sequence numbers are retained, including ties. For every card: rendered heading, counter, columns, row controls, empty-state wording and location in the rail are **not observed**. Provisional implementation must reuse the closest existing shared card and await the CTO gate for any Cases-specific difference; metadata visibility alone does not prove that a card is painted. No add, associate, remove or row action was exercised.

#### Connected Records

M1: sequence 1, API key `Connected_Records__s`. No Cases-specific card behaviour established; preserve as a gate question.

#### Review Process-Review Summary

M1: sequence 1, API key `Review_Processes`. No Cases-specific card behaviour established; preserve as a gate question.

#### Notes

M1: sequence 2, API key `Notes`. Provisional shared behaviour: [notes.md](notes.md); D1 documents notes association.

#### Review Process-Field History

M1: sequence 2, API key `Review_Logs`. No Cases-specific card behaviour established; preserve as a gate question.

#### WebformUsage

M1: sequence 3, API key `WebformUsage`. No Cases-specific card behaviour established; preserve as a gate question.

#### Attachments

M1: sequence 4, API key `Attachments`. Provisional shared behaviour: [attachments.md](attachments.md); D1 documents document attachments.

#### Open Tasks

M1: sequence 6, API key `Tasks`. Provisional shared activity presentation: [activities-record-detail.md](activities-record-detail.md); D1 documents open/completed activity history without confirming this card split.

#### Open Meetings

M1: sequence 7, API key `Events`. Provisional shared activity presentation: [activities-record-detail.md](activities-record-detail.md); D1 documents open/completed activity history without confirming this card split.

#### Open Calls

M1: sequence 8, API key `Calls`. Provisional shared activity presentation: [activities-record-detail.md](activities-record-detail.md); D1 documents open/completed activity history without confirming this card split.

#### Closed Calls

M1: sequence 11, API key `Calls_History`. Provisional shared activity presentation: [activities-record-detail.md](activities-record-detail.md); D1 documents open/completed activity history without confirming this card split.

#### Closed Meetings

M1: sequence 12, API key `Events_History`. Provisional shared activity presentation: [activities-record-detail.md](activities-record-detail.md); D1 documents open/completed activity history without confirming this card split.

#### Closed Tasks

M1: sequence 13, API key `Tasks_History`. Provisional shared activity presentation: [activities-record-detail.md](activities-record-detail.md); D1 documents open/completed activity history without confirming this card split.

#### Mailing History

M1: sequence 14, API key `Mailing_History`. No Cases-specific card behaviour established; preserve as a gate question.

#### Checklists

M1: sequence 15, API key `CheckLists`. No Cases-specific card behaviour established; preserve as a gate question.

#### Emails

M1: sequence 16, API key `Emails`. D1 documents case/contact email filtering; send and reply placement remain not observed. Do not open any compose control during research.

#### Locking Information

M1: sequence 17, API key `Locking_Information__s`. No Cases-specific card behaviour established; preserve as a gate question.

#### Email Drafts

M1: sequence 18, API key `Email_Drafts__s`. No Cases-specific card behaviour established; preserve as a gate question.

#### Email Sentiment

M1: sequence 18, API key `Email_Sentiment`. No Cases-specific card behaviour established; preserve as a gate question.

#### Solutions card or solution association

No `Solutions` related-list key appears in Cases metadata. `Solution` is a textarea, not a lookup. Neither a Solutions card nor a solution link was observed. D1 describes adding a resolved answer to the Solutions module as a subsequent workflow; that does not establish a relationship card or a Find Solution control. Do not invent one from the similarly named field.

### Case-specific controls and Timeline

Comment composer, Add Comment submission, Close Case, status-changing controls, Escalate, Reply, Send Email, Find Solution, solution association, locking/unlocking and approval/rejection controls were not visible because no detail was available. Their presence, exact label and position are not established by this research. D1 establishes email composition and comment field purposes only; it does not establish the requested close/escalate/find-solution control layout. All remain inspection-only in the reference.

Timeline, its filter popup, and its empty-state text are not observed. Reuse [accounts-record-detail.md](accounts-record-detail.md) and [record-detail.md](record-detail.md) only as provisional shared patterns; no Cases filter options or timeline event labels are asserted.

## Create and edit form

Read-only form research. This section covers the form only; list and record-detail research are separate work products. No field was filled, option selected, record saved, or preference changed.

### Sources and limits

- M1: local metadata, `modules/Cases/fields.json` and `layouts.json`, Standard layout. Configuration is not screen evidence.
- D1: reference CRM public help, **Working with Cases**, Standard fields and Creating Cases Individually, read 2026-10-17. Locator: public help center → CRM → Customer Support → Working with Cases. No external address is stored here.
- Shared form and validation evidence: [record-detail.md](record-detail.md), Layout / Flows; nearest reusable controls: [accounts-form.md](accounts-form.md), then [deals-form.md](deals-form.md) and [contacts-form.md](contacts-form.md).

`m8f-cases-base` paints All Cases with zero records. The parent research issue's explicit empty-list fallback applies: Edit cannot be reached from a record and remains **not observed**. No sample record was created.

### Layout and fields

The full-page Create Case form retains the shell and bottom utility strip. Its title strip has Edit Page Layout and, from left to right on the right, Cancel, Save and New, Save. Case Information has two columns:

| Row | Left | Right |
| --- | --- | --- |
| 1 | Case Number, locked and blank | Case Owner, prefilled, arrow and user lookup |
| 2 | Product Name, lookup | Status, New |
| 3 | Type, -None- | Priority, -None- |
| 4 | Case Origin, -None- | Case Reason, -None- |
| 5 | Related To, contact lookup | Subject |
| 6 | Account Name, lookup | Reported By |
| 7 | Deal Name, lookup | Email |
| 8 | Phone | No field |

Status, Case Origin and Subject have a required input-edge marker. Description Information follows, with Description then Internal Comments as full-width multiline controls with resize grips. Solution Information and the form footer are below the initial viewport; m8f-cases-lower establishes their rendering after scrolling, as inventoried below. Client Script occupies the right edge. No Case Image section is painted in the initial viewport.

### Control inventory — m8f-cases-create

Shell: SH-01–SH-46 as in [contacts.md](contacts.md), with Cases active. The rail is scrolled to its lower modules; no preference was changed. Initial viewport: Products through Projects; shared shell differences are listed below. No shell rows are repeated.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-01 | Header | Edit Page Layout | link | after title | same | seen (m8f-cases-create) | M11 | AF-01 |
| KF-02 | Header | Cancel | button | right group, first | same | seen (m8f-cases-create) | M8 | AF-02 |
| KF-03 | Header | Save and New | button | right group, second | same | seen (m8f-cases-create) | M8 | AF-03 |
| KF-04 | Header | Save | button | right group, third | same | seen (m8f-cases-create) | M8 | AF-04 |
| KF-05 | Case Information | Case Number | input | left, row 1 | Locked, blank; not editable | seen (m8f-cases-create) | M8 | new |
| KF-06 | Case Information | Lock icon | badge | left, row 1, input right edge | Read-only indicator; no action observed | seen (m8f-cases-create) | M8 | new |
| KF-07 | Case Information | Product Name | input | left, row 2 | Lookup input; no typing | seen (m8f-cases-create) | P2 | new |
| KF-08 | Case Information | Product lookup icon | icon button | left, row 2, input right edge | Opens product picker; no selection | seen (m8f-cases-create) | P2 | new |
| KF-09 | Case Information | Type | select | left, row 3 | not observed | seen (m8f-cases-create) | M8 | new |
| KF-10 | Case Information | Case Origin | select | left, row 4 | Opens origin choices; no selection | seen (m8f-cases-create) | M8 | new |
| KF-11 | Case Information | Related To | input | left, row 5 | Contact lookup input; no typing | seen (m8f-cases-create) | M2 | new |
| KF-12 | Case Information | Contact lookup icon | icon button | left, row 5, input right edge | Opens contact picker; no selection | seen (m8f-cases-create) | M2 | new |
| KF-13 | Case Information | Account Name | input | left, row 6 | same | seen (m8f-cases-create) | M3 | DF-08 moved |
| KF-14 | Case Information | Account lookup icon | icon button | left, row 6, input right edge | same | seen (m8f-cases-create) | M3 | AF-11 moved |
| KF-15 | Case Information | Deal Name | input | left, row 7 | Lookup input; no typing | seen (m8f-cases-create) | M4 | new |
| KF-16 | Case Information | Deal lookup icon | icon button | left, row 7, input right edge | Opens deal picker; no selection | seen (m8f-cases-create) | M4 | new |
| KF-17 | Case Information | Phone | input | left, row 8 | same | seen (m8f-cases-create) | M8 | AF-18 moved |
| KF-18 | Case Information | Case Owner | select | right, row 1 | Prefilled; identity omitted; not opened | seen (m8f-cases-create) | M8 | new |
| KF-19 | Case Information | User lookup icon | icon button | right, row 1, input right edge | same | seen (m8f-cases-create) | M8 | AF-07 moved |
| KF-20 | Case Information | Status | select | right, row 2 | Opens status choices; no selection | seen (m8f-cases-create) | M8 | new |
| KF-21 | Case Information | Priority | select | right, row 3 | Opens priority choices; no selection | seen (m8f-cases-create) | M8 | new |
| KF-22 | Case Information | Case Reason | select | right, row 4 | not observed | seen (m8f-cases-create) | M8 | new |
| KF-23 | Case Information | Subject | input | right, row 5 | Empty; required marker | seen (m8f-cases-create) | M8 | new |
| KF-24 | Case Information | Reported By | input | right, row 6 | Empty text input, distinct from Related To | seen (m8f-cases-create) | M8 | new |
| KF-25 | Case Information | Email | input | right, row 7 | Empty email input | seen (m8f-cases-create) | M8 | new |
| KF-26 | Description Information | Description | input | first full-width row | same | seen (m8f-cases-create) | M8 | AF-44 moved |
| KF-27 | Description Information | Internal Comments | input | second full-width row | Multiline editor; not filled | seen (m8f-cases-create) | M8 | new |
| KF-32 | Right edge | Client Script | tab | page right edge | same | seen (m8f-cases-create) | M11 | AF-47 |
| KF-33 | Description Information | Resize grip | icon button | Description, lower-right corner | not operated | seen (m8f-cases-create) | M8 | DF-29 moved |
| KF-34 | Description Information | Resize grip | icon button | Internal Comments, lower-right corner | not operated | seen (m8f-cases-create) | M8 | DF-29 moved |

KF-06, KF-33 and KF-34 are image-only. A select includes its arrow; a required marker is a field state, not an extra control. KF-28–KF-31 are established separately by m8f-cases-lower. Absent here: account image, address blocks, Copy Address, account-specific commercial fields.

### Control inventory — m8f-cases-lower

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-28 | Solution Information | Solution | input | full-width row below Description Information | Empty multiline editor; no typing | seen (m8f-cases-lower) | M8 | AF-44 moved |
| KF-29 | Form footer | Create Form Views / Standard View | select | footer, right group, before custom-page action | Current form view; never opened or changed | seen (m8f-cases-lower) | M11 | AF-45 |
| KF-30 | Form footer | Create a custom form page | button | footer, far right | Form customization entry; never used | seen (m8f-cases-lower) | M11 | AF-46 |
| KF-31 | Solution Information | Resize grip | icon button | Solution editor, lower-right corner | not operated | seen (m8f-cases-lower) | M8 | DF-29 moved |

Rest: as in m8f-cases-create; covered by the overlay: none. Scrolling the form leaves KF-01–KF-04 fixed at the top. KF-05–KF-09 and KF-18–KF-21 are outside the form clip or covered by that sticky header; only unlabelled lower edges of Type and Priority remain. KF-10–KF-17, KF-22–KF-27, KF-32–KF-34 remain visible. Solution Information follows Description Information. The footer contains the form-view selector and custom-page action; there is no second Save, Save and New or Cancel group at the bottom. No Case Image, Add Comment or Comments control is painted. KF-31 is image-only. Footer references AF-45–AF-46 were reserved but unobserved in accounts-form.md; this image establishes their rendering here.

Shell: the rail, top bar and right utility shortcuts retain the base positions. The left utility controls are covered by a connection-status strip with an automatic retry countdown and refresh icon. No chat action was used; its appearance is incidental background state, not an outcome of scrolling.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-S15 | Utility strip | Refresh icon | icon button | left group, after connection-status countdown | Accessible name Try Now; not used | seen (m8f-cases-lower) | ? | new |

### Control inventory — m8f-cases-status

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-20.1 | Status list | New | menu item | option 1 | Initially checked; no selection | seen (m8f-cases-status) | M8 | new |
| KF-20.2 | Status list | Escalated | menu item | option 2 | not observed | seen (m8f-cases-status) | M8 | new |
| KF-20.3 | Status list | On Hold | menu item | option 3 | not observed | seen (m8f-cases-status) | M8 | new |
| KF-20.4 | Status list | Closed | menu item | option 4 | not observed | seen (m8f-cases-status) | M8 | new |

Rest: as in m8f-cases-create; covered by the overlay: KF-21–KF-23. No search box is painted. The selected row has a check mark.

### Control inventory — m8f-cases-origin

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-10.1 | Case Origin list | -None- | menu item | option 1 | Initially checked; no selection | seen (m8f-cases-origin) | M8 | new |
| KF-10.2 | Case Origin list | Email | menu item | option 2 | not observed | seen (m8f-cases-origin) | M8 | new |
| KF-10.3 | Case Origin list | Phone | menu item | option 3 | not observed | seen (m8f-cases-origin) | M8 | new |
| KF-10.4 | Case Origin list | Web | menu item | option 4 | not observed | seen (m8f-cases-origin) | M8 | new |

Rest: as in m8f-cases-create; covered by the overlay: KF-11–KF-16. No search box is painted. The selected row has a check mark. Display label Web agrees with M1; D1 uses a longer channel name.

### Control inventory — m8f-cases-priority

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-21.1 | Priority list | -None- | menu item | option 1 | Initially checked; no selection | seen (m8f-cases-priority) | M8 | new |
| KF-21.2 | Priority list | High | menu item | option 2 | not observed | seen (m8f-cases-priority) | M8 | new |
| KF-21.3 | Priority list | Medium | menu item | option 3 | not observed | seen (m8f-cases-priority) | M8 | new |
| KF-21.4 | Priority list | Low | menu item | option 4 | not observed | seen (m8f-cases-priority) | M8 | new |

Rest: as in m8f-cases-create; covered by the overlay: KF-22–KF-23 and the upper edge of KF-24. No search box is painted. The selected row has a check mark. Options agree with M1; no option was selected.

### Control inventory — m8f-cases-account

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-14.1 | Account popup | Close cross | icon button | header, far right | same | seen (m8f-cases-account) | M3 | AF-11.1 |
| KF-14.2 | Account popup | Search by Account Name | input | below title, left | same | seen (m8f-cases-account) | M3 | AF-11.2 |
| KF-14.3 | Account popup | New Account | button | below title, right | same | seen (m8f-cases-account) | M3 | AF-11.3 |
| KF-14.4 | Account popup | Table with down arrow icon | icon button | table header, first | same | seen (m8f-cases-account) | M3 | AF-11.4 |
| KF-14.5 | Account popup | Account Name | column header | table header, text column 1 | same | seen (m8f-cases-account) | M3 | AF-11.5 |
| KF-14.6 | Account popup | Column options | icon button | text column 1, right | same | seen (m8f-cases-account) | M3 | AF-11.6 |
| KF-14.7 | Account popup | Phone | column header | table header, text column 2 | same | seen (m8f-cases-account) | M3 | AF-11.7 |
| KF-14.8 | Account popup | Column options | icon button | text column 2, right | same | seen (m8f-cases-account) | M3 | AF-11.8 |
| KF-14.9 | Account popup | Website | column header | table header, text column 3 | same | seen (m8f-cases-account) | M3 | AF-11.9 |
| KF-14.10 | Account popup | Column options | icon button | text column 3, right | same | seen (m8f-cases-account) | M3 | AF-11.10 |
| KF-14.11 | Account popup | Account Owner | column header | table header, text column 4 | same | seen (m8f-cases-account) | M3 | AF-11.11 |
| KF-14.12 | Account popup | Column options | icon button | text column 4, right | same | seen (m8f-cases-account) | M3 | AF-11.12 |
| KF-14.13 | Account popup | Filter | icon button | table header, far right | same | seen (m8f-cases-account) | M3 | AF-11.13 |
| KF-14.14 | Account popup | Row selection circle | toggle | each fully visible row, first | same | seen (m8f-cases-account) | M3 | AF-11.14 |
| KF-14.15 | Account popup | Account record link | link | each fully visible row, Account Name | same | seen (m8f-cases-account) | M3 | AF-11.15 |
| KF-14.16 | Account popup | Phone handset icon | icon button | populated Phone cells, after value | same | seen (m8f-cases-account) | M5 | AF-11.16 |
| KF-14.17 | Account popup | Previous | icon button | footer, right group, first | same | seen (m8f-cases-account) | M3 | AF-11.17 |
| KF-14.18 | Account popup | Next | icon button | footer, right group, second | same | seen (m8f-cases-account) | M3 | AF-11.18 |

Rest: as in m8f-cases-create; covered by the overlay: all or part of KF-01–KF-25, and part of the shell. KF-26–KF-27 and KF-32 remain visible; underlying controls are inactive. The modal title is Choose Account. Five complete rows are visible, followed by a clipped row edge; record values are omitted. Previous is disabled and Next is enabled. Search has the initial focus ring without user typing. The table has an internal scrollbar; it was not scrolled. No popup action, row, column option, filter or pagination control was used. KF-14.16 is image-only. Absent here: multi-select confirmation buttons.

### Control inventory — m8f-cases-deal

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-16.1 | Deal popup | Close cross | icon button | header, far right | same | seen (m8f-cases-deal) | M4 | AF-11.1 |
| KF-16.2 | Deal popup | Search by Deal Name | input | below title, left | same | seen (m8f-cases-deal) | M4 | AF-11.2 |
| KF-16.3 | Deal popup | New Deal | button | below title, right | same; not used | seen (m8f-cases-deal) | M4 | AF-11.3 |
| KF-16.4 | Deal popup | Table with down arrow icon | icon button | table header, first | same | seen (m8f-cases-deal) | M4 | AF-11.4 |
| KF-16.5 | Deal popup | Deal Name | column header | table header, text column 1 | Identifies column; sorting not used | seen (m8f-cases-deal) | M4 | AF-11.5 |
| KF-16.6 | Deal popup | Column options | icon button | text column 1, right | same | seen (m8f-cases-deal) | M4 | AF-11.6 |
| KF-16.7 | Deal popup | Amount | column header | table header, text column 2 | Identifies column; sorting not used | seen (m8f-cases-deal) | M4 | new |
| KF-16.8 | Deal popup | Column options | icon button | text column 2, right | same | seen (m8f-cases-deal) | M4 | AF-11.8 |
| KF-16.9 | Deal popup | Stage | column header | table header, text column 3 | Identifies column; sorting not used | seen (m8f-cases-deal) | M4 | new |
| KF-16.10 | Deal popup | Column options | icon button | text column 3, right | same | seen (m8f-cases-deal) | M4 | AF-11.10 |
| KF-16.11 | Deal popup | Closing Date | column header | table header, text column 4 | Identifies column; sorting not used | seen (m8f-cases-deal) | M4 | new |
| KF-16.12 | Deal popup | Column options | icon button | text column 4, right | same | seen (m8f-cases-deal) | M4 | AF-11.12 |
| KF-16.13 | Deal popup | Account Name | column header | table header, text column 5 | Identifies column; sorting not used | seen (m8f-cases-deal) | M4 | new |
| KF-16.14 | Deal popup | Column options | icon button | text column 5, right | same | seen (m8f-cases-deal) | M4 | AF-11.6 moved |
| KF-16.15 | Deal popup | Contact Name | column header | table header, text column 6 | Identifies column; sorting not used | seen (m8f-cases-deal) | M4 | new |
| KF-16.16 | Deal popup | Column options | icon button | text column 6, right | same | seen (m8f-cases-deal) | M4 | AF-11.6 moved |
| KF-16.17 | Deal popup | Deal Owner | column header | table header, text column 7 | Identifies column; sorting not used | seen (m8f-cases-deal) | M4 | new |
| KF-16.18 | Deal popup | Column options | icon button | text column 7, right | same | seen (m8f-cases-deal) | M4 | AF-11.6 moved |
| KF-16.19 | Deal popup | Filter | icon button | table header, far right | same | seen (m8f-cases-deal) | M4 | AF-11.13 |
| KF-16.20 | Deal popup | Row selection circle | toggle | each fully visible row, first | same; no selection | seen (m8f-cases-deal) | M4 | AF-11.14 |
| KF-16.21 | Deal popup | Deal record link | link | each fully visible row, Deal Name | same; not opened | seen (m8f-cases-deal) | M4 | AF-11.15 |
| KF-16.22 | Deal popup | Previous | icon button | footer, right group, first | same | seen (m8f-cases-deal) | M4 | AF-11.17 |
| KF-16.23 | Deal popup | Next | icon button | footer, right group, second | same | seen (m8f-cases-deal) | M4 | AF-11.18 |

Rest: as in m8f-cases-create; covered by the overlay: all or part of KF-01–KF-25 and part of the shell. KF-26–KF-27 and KF-32 remain visible; underlying controls are inactive. The title is Choose Deal. Seven complete rows are visible; values are omitted. All row circles are unselected. Previous is disabled and Next is enabled. The empty search has the initial focus ring. The table has an internal scrollbar; it was not scrolled. Column order is Deal Name, Amount, Stage, Closing Date, Account Name, Contact Name, Deal Owner. No popup action, row, column option, filter or pagination control was used. Absent here: Account popup Phone and Website columns, phone handset icons and multi-select confirmation buttons.

### Shell controls missing from app-shell.md

The lower rail is visible without a user preference change. These shell differences are recorded once; all have untested navigation behaviour. Module names are labels, not copied assets.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-S01 | Rail | Products | link | lower rail, item 1 | not observed | seen (m8f-cases-create) | P2 | new |
| KF-S02 | Rail | Quotes | link | lower rail, item 2 | not observed | seen (m8f-cases-create) | P2 | new |
| KF-S03 | Rail | Invoices | link | lower rail, item 3 | not observed | seen (m8f-cases-create) | P2 | new |
| KF-S04 | Rail | Sales Orders | link | lower rail, item 4 | not observed | seen (m8f-cases-create) | P2 | new |
| KF-S05 | Rail | Solutions | link | lower rail, item 5 | not observed | seen (m8f-cases-create) | M8 | new |
| KF-S06 | Rail | Social | link | lower rail, item 6 | not observed | seen (m8f-cases-create) | M15 | new |
| KF-S07 | Rail | Forecasts | link | lower rail, item 7 | not observed | seen (m8f-cases-create) | P2 | new |
| KF-S08 | Rail | Purchase Orders | link | lower rail, item 8 | not observed | seen (m8f-cases-create) | P2 | new |
| KF-S09 | Rail | Vendors | link | lower rail, item 9 | not observed | seen (m8f-cases-create) | P2 | new |
| KF-S10 | Rail | SalesInbox | link | lower rail, item 10 | not observed | seen (m8f-cases-create) | M10 | new |
| KF-S11 | Rail | Cases | link | lower rail, item 11 | not observed | seen (m8f-cases-create) | M8 | new |
| KF-S12 | Rail | My Jobs | link | lower rail, item 12 | not observed | seen (m8f-cases-create) | ? | new |
| KF-S13 | Rail | Services | link | lower rail, item 13 | not observed | seen (m8f-cases-create) | ? | new |
| KF-S14 | Rail | Projects | link | lower rail, item 14 | not observed | seen (m8f-cases-create) | ? | new |

The rail resize handle is reported in controls.json but no separate handle is painted over the boundary. It is not operated. No Channels or Threads shortcut is painted. The shared utility trash icon SH-46 is image-only.

### Control inventory — m8f-cases-contact

The Related To lookup opens **Choose Contact**, with five data columns and nine fully visible rows. No search, row selection, record opening, pagination, filter, column menu or New action was performed. The search field has the opening focus outline; no field was filled. No module-type switch is visible.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-12.1 | Contact popup | Close cross | icon button | header, far right | same | seen (m8f-cases-contact) | M2 | AF-11.1 |
| KF-12.2 | Contact popup | Search by Contact Name | input | below title, left | same; no search | seen (m8f-cases-contact) | M2 | AF-11.2 |
| KF-12.3 | Contact popup | New Contact | button | below title, right | same; not used | seen (m8f-cases-contact) | M2 | AF-11.3 |
| KF-12.4 | Contact popup | Table with down arrow icon | icon button | table header, first | same; not used | seen (m8f-cases-contact) | M2 | AF-11.4 |
| KF-12.5 | Contact popup | Contact Name | column header | table header, text column 1 | Identifies column; sorting not used | seen (m8f-cases-contact) | M2 | AF-11.5 |
| KF-12.6 | Contact popup | Column options | icon button | text column 1, right | same; not opened | seen (m8f-cases-contact) | M2 | AF-11.6 |
| KF-12.7 | Contact popup | Account Name | column header | table header, text column 2 | Identifies column; sorting not used | seen (m8f-cases-contact) | M2 | AF-11.5 moved |
| KF-12.8 | Contact popup | Column options | icon button | text column 2, right | same; not opened | seen (m8f-cases-contact) | M2 | AF-11.8 |
| KF-12.9 | Contact popup | Email | column header | table header, text column 3 | Identifies column; sorting not used | seen (m8f-cases-contact) | M2 | new |
| KF-12.10 | Contact popup | Column options | icon button | text column 3, right | same; not opened | seen (m8f-cases-contact) | M2 | AF-11.10 |
| KF-12.11 | Contact popup | Phone | column header | table header, text column 4 | Identifies column; sorting not used | seen (m8f-cases-contact) | M2 | AF-11.7 moved |
| KF-12.12 | Contact popup | Column options | icon button | text column 4, right | same; not opened | seen (m8f-cases-contact) | M2 | AF-11.12 |
| KF-12.13 | Contact popup | Contact Owner | column header | table header, text column 5 | Identifies column; sorting not used | seen (m8f-cases-contact) | M2 | AF-11.11 moved |
| KF-12.14 | Contact popup | Column options | icon button | text column 5, right | same; not opened | seen (m8f-cases-contact) | M2 | AF-11.6 moved |
| KF-12.15 | Contact popup | Filter | icon button | table header, far right | same; not opened | seen (m8f-cases-contact) | M2 | AF-11.13 |
| KF-12.16 | Contact popup | Row selection circle | toggle | each fully visible row, first | same; no selection | seen (m8f-cases-contact) | M2 | AF-11.14 |
| KF-12.17 | Contact popup | Contact record link | link | each fully visible row, Contact Name | same; not opened | seen (m8f-cases-contact) | M2 | AF-11.15 |
| KF-12.18 | Contact popup | Previous | icon button | footer, right group, first | same; visibly dimmed; not used | seen (m8f-cases-contact) | M2 | AF-11.17 |
| KF-12.19 | Contact popup | Next | icon button | footer, right group, second | same; not used | seen (m8f-cases-contact) | M2 | AF-11.18 |
| KF-12.20 | Contact popup | Phone handset icon | icon button | each populated Phone cell, after value | same; never used | seen (m8f-cases-contact) | M5 | AF-11.16 moved |

Rest: as in m8f-cases-create; covered by the overlay: KF-01–KF-25 and the upper shell. Retained controls remain dimmed behind the modal. KF-26, KF-27, their resize grips, the lower rail, utility strip and Client Script are visible behind it. The table has a visible vertical scroll thumb; it is a container affordance, not an extra action. KF-12.20 is image-only, repeated in the nine visible Phone cells; the controls exporter contains no separate handset entries. No call was initiated.

### Form fields versus metadata

M1 configures 30 fields. Case Number is an auto-number; Owner is an owner lookup; Status / Type / Priority / Case Reason / Case Origin are picklists; Product Name targets Products, Related To targets Contacts, Account Name targets Accounts, and Deal Name targets Deals. The rendered Related To and Reported By controls are distinct. Case Number is locked on Create. The metadata requirements Status / Case Origin / Subject agree with their three visible markers. No values from an existing record were copied.

The initial viewport visually establishes KF-05–KF-27. Solution is established separately by m8f-cases-lower (KF-28). Add Comment and Comments are not painted in either form image. Metadata-only system fields, tags, timestamps, comment counts and connection fields must not be inferred as create inputs. A Case Image section exists in M1 but has no fields and is not painted here.

### Control inventory — m8f-cases-after

No visible control changes. Rest: as in m8-cases-list-base; covered by overlay: none. The screenshot was opened across the rail, header, toolbar, empty table, right edge and footer. All Cases remains empty: Total Records 0 → 0 and record links 0 → 0 relative to m8f-cases-base. The existing empty-list exception applies to Edit; no record was created and no unseen Edit controls are inferred.

Source reconciliation inherits the m8-cases-list-base table with this ordinal translation: after 307 = base 319 (zero-area chat widget, excluded); after 308–319 = base 307–318. All other ordinals retain their mappings. The Sort control at 147 has only a transient attribute difference; its label, type and box are unchanged. No new image-only control was found; SH-46 remains image-only. Self-audit: 327 source items → 86 mapped numbers (159 mapped items); 168 exclusions. Missing / duplicate ordinals: 0.

Safety: zero clicks / skipped clicks; API calls 55 (baseline 55). Non-GET path/count comparison matches the baseline: Cases count ×1, list bulk ×1 and shell trigger ×1. Reminder, notification and ten telemetry attempts were blocked; no unexpected path or count increase. Pre-capture 1-minute load 127.91. Diagnostics contain known client errors, but the screenshot and passive ready gate establish the painted empty list. No preference change or tab cleanup; zero tabs closed.

### Form capture refs

- m8f-cases-base: initial passive empty list; inherits the list inventory above.
- m8f-cases-create: full Create form inventory KF-01–KF-34; lower controls established separately.
- m8f-cases-status, m8f-cases-origin, m8f-cases-priority: open choices; no option selected.
- m8f-cases-account, m8f-cases-deal, m8f-cases-contact, m8f-cases-product: open lookup interiors; no search or selection.
- m8f-cases-lower: one form scroll, lower Solution field and footer; zero clicks.
- m8f-cases-after: final passive empty-list comparison; zero clicks.

## Form capture reconciliation

### Reconciliation — m8f-cases-create

Source ordinals are one-based in controls.json; duplicate wrappers map to the same logical control. All source entries are covered. Screenshot-only controls are stated separately.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, duplicate decoration or non-control text | 1, 4, 109, 111, 114, 135–136, 139, 151–152, 200, 266–267 |
| SH-01 | 2–3 |
| KF-15 | 177–180 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 108, 110, 118–119, 121–122, 124–125, 128–129, 146–150, 160, 170, 176, 182, 213–222, 224–238 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| Excluded: clipped or outside viewport | 37–65, 134, 205–212, 239, 270 |
| KF-S01 | 66–68 |
| KF-S02 | 69–71 |
| KF-S03 | 72–74 |
| KF-S04 | 75–77 |
| KF-S05 | 78–80 |
| KF-S06 | 81–83 |
| KF-S07 | 84–86 |
| KF-S08 | 87–89 |
| KF-S09 | 90–92 |
| KF-S10 | 93–95 |
| KF-S11 | 96–98 |
| KF-S12 | 99–101 |
| KF-S13 | 102–104 |
| KF-S14 | 105–107 |
| SH-26 | 112 |
| SH-27 | 113 |
| SH-28 | 115 |
| SH-29 | 116 |
| SH-30 | 117 |
| SH-31 | 120 |
| SH-32 | 123 |
| SH-33 | 126–127 |
| SH-34 | 130–133 |
| KF-01 | 137–138 |
| KF-04 | 140–141 |
| KF-03 | 142–143 |
| KF-02 | 144–145 |
| KF-05 | 153–154 |
| KF-07 | 155–158 |
| KF-08 | 159, 251–253 |
| KF-09 | 161–162 |
| KF-10 | 163–164 |
| KF-11 | 165–168 |
| KF-12 | 169, 254–256 |
| KF-13 | 171–174 |
| KF-14 | 175, 257–259 |
| KF-16 | 181, 260–262 |
| KF-17 | 183–184 |
| KF-19 | 185, 263–265 |
| KF-18 | 186–187 |
| KF-20 | 188–189 |
| KF-21 | 190–191 |
| KF-22 | 192–193 |
| KF-23 | 194–195 |
| KF-24 | 196–197 |
| KF-25 | 198–199 |
| KF-26 | 201–202, 268 |
| KF-27 | 203–204, 269 |
| KF-32 | 223 |
| SH-35 | 240 |
| SH-36 | 241 |
| SH-37 | 242 |
| SH-38 | 243 |
| SH-39 | 244 |
| SH-40 | 245 |
| SH-41 | 246 |
| SH-42 | 247 |
| SH-43 | 248 |
| SH-44 | 249 |
| SH-45 | 250 |

Self-audit: 270 entries → 72 numbered controls (160 mapped entries); 110 excluded entries. Screenshot-only: KF-06, KF-33, KF-34 and SH-46.

### Reconciliation — m8f-cases-status

Source ordinals are one-based in controls.json; duplicate wrappers map to the same logical control. All source entries are covered. Screenshot-only controls are stated separately.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, duplicate decoration or non-control text | 1, 4, 109, 111, 114, 135–136, 139, 151–152, 200, 251, 256, 259, 262, 265, 268, 271–272, 276 |
| SH-01 | 2–3 |
| KF-15 | 177–180 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 108, 110, 118–119, 121–122, 124–125, 128–129, 146–150, 160, 170, 176, 182, 213–222, 224–238 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| Excluded: clipped or outside viewport | 37–65, 134, 205–212, 239, 275 |
| KF-S01 | 66–68 |
| KF-S02 | 69–71 |
| KF-S03 | 72–74 |
| KF-S04 | 75–77 |
| KF-S05 | 78–80 |
| KF-S06 | 81–83 |
| KF-S07 | 84–86 |
| KF-S08 | 87–89 |
| KF-S09 | 90–92 |
| KF-S10 | 93–95 |
| KF-S11 | 96–98 |
| KF-S12 | 99–101 |
| KF-S13 | 102–104 |
| KF-S14 | 105–107 |
| SH-26 | 112 |
| SH-27 | 113 |
| SH-28 | 115 |
| SH-29 | 116 |
| SH-30 | 117 |
| SH-31 | 120 |
| SH-32 | 123 |
| SH-33 | 126–127 |
| SH-34 | 130–133 |
| KF-01 | 137–138 |
| KF-04 | 140–141 |
| KF-03 | 142–143 |
| KF-02 | 144–145 |
| KF-05 | 153–154 |
| KF-07 | 155–158 |
| KF-08 | 159, 257–258 |
| KF-09 | 161–162 |
| KF-10 | 163–164 |
| KF-11 | 165–168 |
| KF-12 | 169, 260–261 |
| KF-13 | 171–174 |
| KF-14 | 175, 263–264 |
| KF-16 | 181, 266–267 |
| KF-17 | 183–184 |
| KF-19 | 185, 269–270 |
| KF-18 | 186–187 |
| KF-20 | 188–189 |
| KF-21 | 190–191 |
| KF-22 | 192–193 |
| KF-23 | 194–195 |
| KF-24 | 196–197 |
| KF-25 | 198–199 |
| KF-26 | 201–202, 273 |
| KF-27 | 203–204, 274 |
| KF-32 | 223 |
| SH-35 | 240 |
| SH-36 | 241 |
| SH-37 | 242 |
| SH-38 | 243 |
| SH-39 | 244 |
| SH-40 | 245 |
| SH-41 | 246 |
| SH-42 | 247 |
| SH-43 | 248 |
| SH-44 | 249 |
| SH-45 | 250 |
| KF-20.1 | 252 |
| KF-20.2 | 253 |
| KF-20.3 | 254 |
| KF-20.4 | 255 |

Self-audit: 276 entries → 76 numbered controls (159 mapped entries); 117 excluded entries. Screenshot-only: KF-06, KF-33, KF-34 and SH-46.

### Reconciliation — m8f-cases-origin

Source ordinals are one-based in controls.json; duplicate wrappers map to the same logical control. All source entries are covered. Screenshot-only controls are stated separately.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, duplicate decoration or non-control text | 1, 4, 109, 111, 114, 135–136, 139, 151–152, 200, 251, 256, 259, 262, 265, 268, 271–272, 276 |
| SH-01 | 2–3 |
| KF-15 | 177–180 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 108, 110, 118–119, 121–122, 124–125, 128–129, 146–150, 160, 170, 176, 182, 213–222, 224–237, 250 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| Excluded: clipped or outside viewport | 37–65, 134, 205–212, 238, 275 |
| KF-S01 | 66–68 |
| KF-S02 | 69–71 |
| KF-S03 | 72–74 |
| KF-S04 | 75–77 |
| KF-S05 | 78–80 |
| KF-S06 | 81–83 |
| KF-S07 | 84–86 |
| KF-S08 | 87–89 |
| KF-S09 | 90–92 |
| KF-S10 | 93–95 |
| KF-S11 | 96–98 |
| KF-S12 | 99–101 |
| KF-S13 | 102–104 |
| KF-S14 | 105–107 |
| SH-26 | 112 |
| SH-27 | 113 |
| SH-28 | 115 |
| SH-29 | 116 |
| SH-30 | 117 |
| SH-31 | 120 |
| SH-32 | 123 |
| SH-33 | 126–127 |
| SH-34 | 130–133 |
| KF-01 | 137–138 |
| KF-04 | 140–141 |
| KF-03 | 142–143 |
| KF-02 | 144–145 |
| KF-05 | 153–154 |
| KF-07 | 155–158 |
| KF-08 | 159, 257–258 |
| KF-09 | 161–162 |
| KF-10 | 163–164 |
| KF-11 | 165–168 |
| KF-12 | 169, 260–261 |
| KF-13 | 171–174 |
| KF-14 | 175, 263–264 |
| KF-16 | 181, 266–267 |
| KF-17 | 183–184 |
| KF-19 | 185, 269–270 |
| KF-18 | 186–187 |
| KF-20 | 188–189 |
| KF-21 | 190–191 |
| KF-22 | 192–193 |
| KF-23 | 194–195 |
| KF-24 | 196–197 |
| KF-25 | 198–199 |
| KF-26 | 201–202, 273 |
| KF-27 | 203–204, 274 |
| KF-32 | 223 |
| SH-35 | 239 |
| SH-36 | 240 |
| SH-37 | 241 |
| SH-38 | 242 |
| SH-39 | 243 |
| SH-40 | 244 |
| SH-41 | 245 |
| SH-42 | 246 |
| SH-43 | 247 |
| SH-44 | 248 |
| SH-45 | 249 |
| KF-10.1 | 252 |
| KF-10.2 | 253 |
| KF-10.3 | 254 |
| KF-10.4 | 255 |

Self-audit: 276 entries → 76 numbered controls (159 mapped entries); 117 excluded entries. Screenshot-only: KF-06, KF-33, KF-34 and SH-46.


### Reconciliation — m8f-cases-priority

Source ordinals are one-based in controls.json; duplicate wrappers map to the same logical control. All source entries are covered. Screenshot-only controls are stated separately.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, duplicate decoration or non-control text | 1, 4, 109, 111, 114, 135–136, 139, 151–152, 200, 251, 256, 259, 262, 265, 268, 271–272, 276 |
| SH-01 | 2–3 |
| KF-15 | 177–180 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 108, 110, 118–119, 121–122, 124–125, 128–129, 146–150, 160, 170, 176, 182, 213–222, 224–238 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| Excluded: clipped or outside viewport | 37–65, 134, 205–212, 239, 275 |
| KF-S01 | 66–68 |
| KF-S02 | 69–71 |
| KF-S03 | 72–74 |
| KF-S04 | 75–77 |
| KF-S05 | 78–80 |
| KF-S06 | 81–83 |
| KF-S07 | 84–86 |
| KF-S08 | 87–89 |
| KF-S09 | 90–92 |
| KF-S10 | 93–95 |
| KF-S11 | 96–98 |
| KF-S12 | 99–101 |
| KF-S13 | 102–104 |
| KF-S14 | 105–107 |
| SH-26 | 112 |
| SH-27 | 113 |
| SH-28 | 115 |
| SH-29 | 116 |
| SH-30 | 117 |
| SH-31 | 120 |
| SH-32 | 123 |
| SH-33 | 126–127 |
| SH-34 | 130–133 |
| KF-01 | 137–138 |
| KF-04 | 140–141 |
| KF-03 | 142–143 |
| KF-02 | 144–145 |
| KF-05 | 153–154 |
| KF-07 | 155–158 |
| KF-08 | 159, 257–258 |
| KF-09 | 161–162 |
| KF-10 | 163–164 |
| KF-11 | 165–168 |
| KF-12 | 169, 260–261 |
| KF-13 | 171–174 |
| KF-14 | 175, 263–264 |
| KF-16 | 181, 266–267 |
| KF-17 | 183–184 |
| KF-19 | 185, 269–270 |
| KF-18 | 186–187 |
| KF-20 | 188–189 |
| KF-21 | 190–191 |
| KF-22 | 192–193 |
| KF-23 | 194–195 |
| KF-24 | 196–197 |
| KF-25 | 198–199 |
| KF-26 | 201–202, 273 |
| KF-27 | 203–204, 274 |
| KF-32 | 223 |
| SH-35 | 240 |
| SH-36 | 241 |
| SH-37 | 242 |
| SH-38 | 243 |
| SH-39 | 244 |
| SH-40 | 245 |
| SH-41 | 246 |
| SH-42 | 247 |
| SH-43 | 248 |
| SH-44 | 249 |
| SH-45 | 250 |
| KF-21.1 | 252 |
| KF-21.2 | 253 |
| KF-21.3 | 254 |
| KF-21.4 | 255 |

Self-audit: 276 entries → 76 numbered controls (159 mapped entries); 117 excluded entries. Screenshot-only: KF-06, KF-33, KF-34 and SH-46.


### Reconciliation — m8f-cases-account

Source ordinals are one-based. Underlying form and shell entries retain their base mapping, including entries covered by the modal; this does not claim they are operable. Repeated row controls share a number; record values are excluded.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, duplicate decoration or non-control text | 1, 4, 109, 111, 114, 135–136, 139, 151–152, 200, 253, 261–265, 275, 278, 389–390, 409–410, 414 |
| SH-01 | 2–3 |
| KF-15 | 177–180 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 108, 110, 118–119, 121–122, 124–125, 128–129, 146–150, 160, 170, 176, 182, 213–224, 226–240, 259, 276–277 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| Excluded: clipped or outside viewport | 37–65, 134, 205–212, 241, 334–388, 413 |
| KF-S01 | 66–68 |
| KF-S02 | 69–71 |
| KF-S03 | 72–74 |
| KF-S04 | 75–77 |
| KF-S05 | 78–80 |
| KF-S06 | 81–83 |
| KF-S07 | 84–86 |
| KF-S08 | 87–89 |
| KF-S09 | 90–92 |
| KF-S10 | 93–95 |
| KF-S11 | 96–98 |
| KF-S12 | 99–101 |
| KF-S13 | 102–104 |
| KF-S14 | 105–107 |
| SH-26 | 112 |
| SH-27 | 113 |
| SH-28 | 115 |
| SH-29 | 116 |
| SH-30 | 117 |
| SH-31 | 120 |
| SH-32 | 123 |
| SH-33 | 126–127 |
| SH-34 | 130–133 |
| KF-01 | 137–138 |
| KF-04 | 140–141 |
| KF-03 | 142–143 |
| KF-02 | 144–145 |
| KF-05 | 153–154 |
| KF-07 | 155–158 |
| KF-08 | 159, 393–395 |
| KF-09 | 161–162 |
| KF-10 | 163–164 |
| KF-11 | 165–168 |
| KF-12 | 169, 396–398 |
| KF-13 | 171–174 |
| KF-14 | 175, 399–401 |
| KF-16 | 181, 402–404 |
| KF-17 | 183–184 |
| KF-19 | 185, 405–407 |
| KF-18 | 186–187 |
| KF-20 | 188–189 |
| KF-21 | 190–191 |
| KF-22 | 192–193 |
| KF-23 | 194–195 |
| KF-24 | 196–197 |
| KF-25 | 198–199 |
| KF-26 | 201–202, 411 |
| KF-27 | 203–204, 412 |
| KF-32 | 225 |
| SH-35 | 242 |
| SH-36 | 243 |
| SH-37 | 244 |
| SH-38 | 245 |
| SH-39 | 246 |
| SH-40 | 247 |
| SH-41 | 248 |
| SH-42 | 249 |
| SH-43 | 250 |
| SH-44 | 251 |
| SH-45 | 252 |
| KF-14.1 | 254 |
| KF-14.2 | 255–256, 408 |
| KF-14.3 | 257–258 |
| KF-14.4 | 266 |
| KF-14.5 | 267 |
| KF-14.6 | 268 |
| KF-14.7 | 269 |
| KF-14.8 | 270 |
| KF-14.9 | 271 |
| KF-14.10 | 272 |
| KF-14.11 | 273 |
| KF-14.12 | 274 |
| KF-14.13 | 260 |
| KF-14.17 | 391 |
| KF-14.18 | 392 |
| KF-14.14 | 281–282, 292–293, 303–304, 314–315, 325–326 |
| KF-14.15 | 284–285, 295–296, 306–307, 317–318, 328–329 |
| Excluded: record-row wrappers and non-interactive record cell data | 279–280, 283, 286–291, 294, 297–302, 305, 308–313, 316, 319–324, 327, 330–333 |

Self-audit: 414 entries → 89 numbered controls (198 mapped entries); 216 excluded entries. Missing / duplicate ordinals: 0. Screenshot-only: KF-14.16 (five handsets); base image-only KF-33, KF-34 and SH-46 remain visible, while KF-06 is covered. The five complete rows have unselected circles and record links. The clipped sixth row is excluded rather than inferred from the DOM.

### Reconciliation — m8f-cases-deal

Source ordinals are one-based. Covered form and shell controls retain their base mapping; they are inactive behind the modal. Record values and rows outside the painted table viewport are excluded.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, duplicate decoration or non-control text | 1, 4, 109, 111, 114, 135–136, 139, 151–152, 200, 241, 249–253, 269, 272, 423–424, 427, 455–456, 460 |
| SH-01 | 2–3 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 108, 110, 118–119, 121–122, 124–125, 128–129, 146–150, 160, 170, 176, 182, 213–224, 226–240, 247, 270–271 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| Excluded: clipped or outside viewport | 37–65, 134, 205–212, 378–422, 459 |
| KF-S01 | 66–68 |
| KF-S02 | 69–71 |
| KF-S03 | 72–74 |
| KF-S04 | 75–77 |
| KF-S05 | 78–80 |
| KF-S06 | 81–83 |
| KF-S07 | 84–86 |
| KF-S08 | 87–89 |
| KF-S09 | 90–92 |
| KF-S10 | 93–95 |
| KF-S11 | 96–98 |
| KF-S12 | 99–101 |
| KF-S13 | 102–104 |
| KF-S14 | 105–107 |
| SH-26 | 112 |
| SH-27 | 113 |
| SH-28 | 115 |
| SH-29 | 116 |
| SH-30 | 117 |
| SH-31 | 120 |
| SH-32 | 123 |
| SH-33 | 126–127 |
| SH-34 | 130–133 |
| KF-01 | 137–138 |
| KF-04 | 140–141 |
| KF-03 | 142–143 |
| KF-02 | 144–145 |
| KF-05 | 153–154 |
| KF-07 | 155–158 |
| KF-08 | 159, 439–441 |
| KF-09 | 161–162 |
| KF-10 | 163–164 |
| KF-11 | 165–168 |
| KF-12 | 169, 442–444 |
| KF-13 | 171–174 |
| KF-14 | 175, 445–447 |
| KF-15 | 177–180 |
| KF-16 | 181, 448–450 |
| KF-17 | 183–184 |
| KF-19 | 185, 451–453 |
| KF-18 | 186–187 |
| KF-20 | 188–189 |
| KF-21 | 190–191 |
| KF-22 | 192–193 |
| KF-23 | 194–195 |
| KF-24 | 196–197 |
| KF-25 | 198–199 |
| KF-26 | 201–202, 457 |
| KF-27 | 203–204, 458 |
| KF-32 | 225 |
| KF-16.1 | 242 |
| KF-16.2 | 243–244, 454 |
| KF-16.3 | 245–246 |
| KF-16.19 | 248 |
| KF-16.4 | 254 |
| KF-16.5 | 255 |
| KF-16.6 | 256 |
| KF-16.7 | 257 |
| KF-16.8 | 258 |
| KF-16.9 | 259 |
| KF-16.10 | 260 |
| KF-16.11 | 261 |
| KF-16.12 | 262 |
| KF-16.13 | 263 |
| KF-16.14 | 264 |
| KF-16.15 | 265 |
| KF-16.16 | 266 |
| KF-16.17 | 267 |
| KF-16.18 | 268 |
| Excluded: record-row wrappers and non-interactive record cell data | 273–274, 277, 280–289, 292, 295–304, 307, 310–319, 322, 325–334, 337, 340–349, 352, 355–364, 367, 370–377 |
| KF-16.20 | 275–276, 290–291, 305–306, 320–321, 335–336, 350–351, 365–366 |
| KF-16.21 | 278–279, 293–294, 308–309, 323–324, 338–339, 353–354, 368–369 |
| KF-16.22 | 425 |
| KF-16.23 | 426 |
| SH-35 | 428 |
| SH-36 | 429 |
| SH-37 | 430 |
| SH-38 | 431 |
| SH-39 | 432 |
| SH-40 | 433 |
| SH-41 | 434 |
| SH-42 | 435 |
| SH-43 | 436 |
| SH-44 | 437 |
| SH-45 | 438 |

Self-audit: 460 entries → 95 numbered controls (212 mapped entries); 248 excluded entries. Missing / duplicate ordinals: 0. Seven complete rows have unselected circles and record links. Image-only base KF-33, KF-34 and SH-46 remain visible; KF-06 is covered. No additional image-only popup control was found. Screenshot opened as an image.

### Control inventory — m8f-cases-product

The Product Name lookup opens **Choose Product**. The table is painted with three data columns and the empty state “No Products found”. No rows, selection circles, record links or pagination controls are visible. The opening search focus outline is present; no field was filled.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KF-08.1 | Product popup | Close cross | icon button | header, far right | same; not used | seen (m8f-cases-product) | P2 | AF-11.1 |
| KF-08.2 | Product popup | Search by Product Name / Product Code | input | below title, left | Empty; no typing or search | seen (m8f-cases-product) | P2 | new |
| KF-08.3 | Product popup | New Product | button | below title, right | Creation action; never used | seen (m8f-cases-product) | P2 | AF-11.3 |
| KF-08.4 | Product popup | Table with down arrow icon | icon button | table header, first | same; not opened | seen (m8f-cases-product) | P2 | AF-11.4 |
| KF-08.5 | Product popup | Product Name | column header | table header, text column 1 | Identifies column; sorting not used | seen (m8f-cases-product) | P2 | new |
| KF-08.6 | Product popup | Column options | icon button | text column 1, right | same; not opened | seen (m8f-cases-product) | P2 | AF-11.6 |
| KF-08.7 | Product popup | Product Code | column header | table header, text column 2 | Identifies column; sorting not used | seen (m8f-cases-product) | P2 | new |
| KF-08.8 | Product popup | Column options | icon button | text column 2, right | same; not opened | seen (m8f-cases-product) | P2 | AF-11.8 |
| KF-08.9 | Product popup | Product Owner | column header | table header, text column 3 | Identifies column; sorting not used | seen (m8f-cases-product) | P2 | new |
| KF-08.10 | Product popup | Column options | icon button | text column 3, right | same; not opened | seen (m8f-cases-product) | P2 | AF-11.12 moved |
| KF-08.11 | Product popup | Filter | icon button | table header, far right | same; not opened | seen (m8f-cases-product) | P2 | AF-11.13 |

Rest: as in m8f-cases-create; covered by the overlay: KF-01–KF-06, KF-18–KF-19 and portions of the upper shell. KF-07–KF-08 and KF-20 are at the lower overlay edge; the remaining lower form and utility strip remain visible behind the inactive overlay. No popup action, filter, column option, row or search was used. Absent here: Account popup Phone and Website columns, handset icons, row circles, record links and footer arrows.

### Reconciliation — m8f-cases-contact

Source ordinals are one-based. Form and shell retain their base mapping behind the modal. Row values are excluded; the tenth extracted row is below the painted table cutoff. Screenshot opened as an image.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, duplicate decoration or non-control text | 1, 4, 109, 111, 114, 135–136, 139, 151–152, 200, 241, 253, 261–265, 277, 280, 401–402, 421–422, 426 |
| SH-01 | 2–3 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 108, 110, 118–119, 121–122, 124–125, 128–129, 146–150, 160, 170, 176, 182, 213–224, 226–240, 259, 278–279 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| Excluded: clipped or outside viewport | 37–65, 134, 205–212, 425 |
| KF-S01 | 66–68 |
| KF-S02 | 69–71 |
| KF-S03 | 72–74 |
| KF-S04 | 75–77 |
| KF-S05 | 78–80 |
| KF-S06 | 81–83 |
| KF-S07 | 84–86 |
| KF-S08 | 87–89 |
| KF-S09 | 90–92 |
| KF-S10 | 93–95 |
| KF-S11 | 96–98 |
| KF-S12 | 99–101 |
| KF-S13 | 102–104 |
| KF-S14 | 105–107 |
| SH-26 | 112 |
| SH-27 | 113 |
| SH-28 | 115 |
| SH-29 | 116 |
| SH-30 | 117 |
| SH-31 | 120 |
| SH-32 | 123 |
| SH-33 | 126–127 |
| SH-34 | 130–133 |
| KF-01 | 137–138 |
| KF-04 | 140–141 |
| KF-03 | 142–143 |
| KF-02 | 144–145 |
| KF-05 | 153–154 |
| KF-07 | 155–158 |
| KF-08 | 159, 405–407 |
| KF-09 | 161–162 |
| KF-10 | 163–164 |
| KF-11 | 165–168 |
| KF-12 | 169, 408–410 |
| KF-13 | 171–174 |
| KF-14 | 175, 411–413 |
| KF-15 | 177–180 |
| KF-16 | 181, 414–416 |
| KF-17 | 183–184 |
| KF-19 | 185, 417–419 |
| KF-18 | 186–187 |
| KF-20 | 188–189 |
| KF-21 | 190–191 |
| KF-22 | 192–193 |
| KF-23 | 194–195 |
| KF-24 | 196–197 |
| KF-25 | 198–199 |
| KF-26 | 201–202, 423 |
| KF-27 | 203–204, 424 |
| KF-32 | 225 |
| SH-35 | 242 |
| SH-36 | 243 |
| SH-37 | 244 |
| SH-38 | 245 |
| SH-39 | 246 |
| SH-40 | 247 |
| SH-41 | 248 |
| SH-42 | 249 |
| SH-43 | 250 |
| SH-44 | 251 |
| SH-45 | 252 |
| KF-12.1 | 254 |
| KF-12.2 | 255–256, 420 |
| KF-12.3 | 257–258 |
| KF-12.15 | 260 |
| KF-12.4 | 266 |
| KF-12.5 | 267 |
| KF-12.6 | 268 |
| KF-12.7 | 269 |
| KF-12.8 | 270 |
| KF-12.9 | 271 |
| KF-12.10 | 272 |
| KF-12.11 | 273 |
| KF-12.12 | 274 |
| KF-12.13 | 275 |
| KF-12.14 | 276 |
| Excluded: row wrapper, non-interactive record cell or duplicate decoration | 281–282, 285, 288–294, 297, 300–306, 309, 312–318, 321, 324–330, 333, 336–342, 345, 348–354, 357, 360–366, 369, 372–378, 381, 384–388 |
| KF-12.16 | 283–284, 295–296, 307–308, 319–320, 331–332, 343–344, 355–356, 367–368, 379–380 |
| KF-12.17 | 286–287, 298–299, 310–311, 322–323, 334–335, 346–347, 358–359, 370–371, 382–383 |
| Excluded: clipped or outside popup viewport | 389–400 |
| KF-12.18 | 403 |
| KF-12.19 | 404 |

Self-audit: 426 entries → 91 numbered controls (216 mapped entries); 210 excluded entries. Missing / duplicate ordinals: 0. Screenshot-only: base KF-06, KF-33, KF-34 and SH-46, plus KF-12.20 (nine handsets). Nine unselected circles and nine contact links are visible. No other image-only popup action was found. Capture safety: one opening click, zero skipped clicks; the single Contacts lookup read and single shell trigger match the permitted path/count set. Reminder, notification and nine telemetry requests were blocked; no unexpected non-GET path, selection, search or record write was observed. API calls: 54. Pre-capture 1-minute load: 75.04. No tabs were closed.

### Reconciliation — m8f-cases-product

Source ordinals are one-based. Form and shell mapping is retained behind the modal. Entries 237–239 are reordered hidden nodes; all remain excluded. Screenshot opened as an image.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, duplicate decoration or non-control text | 1, 4, 109, 111, 114, 135–136, 139, 151–152, 200, 241, 253, 261–264, 272, 294–295, 299 |
| SH-01 | 2–3 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 108, 110, 118–119, 121–122, 124–125, 128–129, 146–150, 160, 170, 176, 182, 213–224, 226–240, 259, 273–275 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| Excluded: clipped or outside viewport | 37–65, 134, 205–212, 298 |
| KF-S01 | 66–68 |
| KF-S02 | 69–71 |
| KF-S03 | 72–74 |
| KF-S04 | 75–77 |
| KF-S05 | 78–80 |
| KF-S06 | 81–83 |
| KF-S07 | 84–86 |
| KF-S08 | 87–89 |
| KF-S09 | 90–92 |
| KF-S10 | 93–95 |
| KF-S11 | 96–98 |
| KF-S12 | 99–101 |
| KF-S13 | 102–104 |
| KF-S14 | 105–107 |
| SH-26 | 112 |
| SH-27 | 113 |
| SH-28 | 115 |
| SH-29 | 116 |
| SH-30 | 117 |
| SH-31 | 120 |
| SH-32 | 123 |
| SH-33 | 126–127 |
| SH-34 | 130–133 |
| KF-01 | 137–138 |
| KF-04 | 140–141 |
| KF-03 | 142–143 |
| KF-02 | 144–145 |
| KF-05 | 153–154 |
| KF-07 | 155–158 |
| KF-08 | 159, 277–279 |
| KF-09 | 161–162 |
| KF-10 | 163–164 |
| KF-11 | 165–168 |
| KF-12 | 169, 280–282 |
| KF-13 | 171–174 |
| KF-14 | 175, 283–285 |
| KF-15 | 177–180 |
| KF-16 | 181, 286–288 |
| KF-17 | 183–184 |
| KF-19 | 185, 289–291 |
| KF-18 | 186–187 |
| KF-20 | 188–189 |
| KF-21 | 190–191 |
| KF-22 | 192–193 |
| KF-23 | 194–195 |
| KF-24 | 196–197 |
| KF-25 | 198–199 |
| KF-26 | 201–202, 296 |
| KF-27 | 203–204, 297 |
| KF-32 | 225 |
| SH-35 | 242 |
| SH-36 | 243 |
| SH-37 | 244 |
| SH-38 | 245 |
| SH-39 | 246 |
| SH-40 | 247 |
| SH-41 | 248 |
| SH-42 | 249 |
| SH-43 | 250 |
| SH-44 | 251 |
| SH-45 | 252 |
| KF-08.1 | 254, 292 |
| KF-08.2 | 255–256, 293 |
| KF-08.3 | 257–258 |
| KF-08.11 | 260 |
| KF-08.4 | 265 |
| KF-08.5 | 266 |
| KF-08.6 | 267 |
| KF-08.7 | 268 |
| KF-08.8 | 269 |
| KF-08.9 | 270 |
| KF-08.10 | 271 |
| Excluded: non-interactive empty-state text | 276 |

Self-audit: 299 entries → 83 numbered controls (175 mapped entries); 124 excluded entries. Missing / duplicate ordinals: 0. Image-only base KF-33, KF-34 and SH-46 remain visible; KF-06 is covered. No additional image-only popup control was found. One opening click, zero skipped clicks. Only the single shell trigger is a non-GET response; reminder, notification and seven telemetry requests were blocked within the permitted set. No selection, search or record write was observed. API calls: 54. Pre-capture 1-minute load: 40.52. No tabs were closed.

### Reconciliation — m8f-cases-lower

Every one-based source ordinal is assigned exactly once below. Header clipping and the incidental connection-status strip are checked against the final screenshot.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, duplicate decoration or non-control text | 1, 4, 109, 111, 114, 135–136, 139, 151–152, 200, 205, 208, 240, 270–271 |
| SH-01 | 2–3 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 108, 110, 118–119, 121–122, 124–125, 128–129, 146–150, 160, 170, 176, 182, 214–223, 225–239 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| Excluded: clipped or outside viewport | 37–65, 134 |
| KF-S01 | 66–68 |
| KF-S02 | 69–71 |
| KF-S03 | 72–74 |
| KF-S04 | 75–77 |
| KF-S05 | 78–80 |
| KF-S06 | 81–83 |
| KF-S07 | 84–86 |
| KF-S08 | 87–89 |
| KF-S09 | 90–92 |
| KF-S10 | 93–95 |
| KF-S11 | 96–98 |
| KF-S12 | 99–101 |
| KF-S13 | 102–104 |
| KF-S14 | 105–107 |
| SH-26 | 112 |
| SH-27 | 113 |
| SH-28 | 115 |
| SH-29 | 116 |
| SH-30 | 117 |
| SH-31 | 120 |
| SH-32 | 123 |
| SH-33 | 126–127 |
| SH-34 | 130–133 |
| KF-01 | 137–138 |
| KF-04 | 140–141 |
| KF-03 | 142–143 |
| KF-02 | 144–145 |
| Excluded: outside the form clip or covered by the sticky header | 153–159, 161–162, 185–191, 255–257, 267–269 |
| KF-10 | 163–164 |
| KF-11 | 165–168 |
| KF-12 | 169, 258–260 |
| KF-13 | 171–174 |
| KF-14 | 175, 261–263 |
| KF-15 | 177–180 |
| KF-16 | 181, 264–266 |
| KF-17 | 183–184 |
| KF-22 | 192–193 |
| KF-23 | 194–195 |
| KF-24 | 196–197 |
| KF-25 | 198–199 |
| KF-26 | 201–202, 272 |
| KF-27 | 203–204, 273 |
| KF-28 | 206–207, 274 |
| KF-29 | 209–211, 275 |
| KF-30 | 212–213 |
| KF-32 | 224 |
| Excluded: covered by the chat connection-status strip | 241–245 |
| SH-38 | 246 |
| SH-39 | 247 |
| SH-40 | 248 |
| SH-41 | 249 |
| SH-42 | 250 |
| SH-43 | 251 |
| SH-44 | 252 |
| SH-45 | 253 |
| KF-S15 | 254 |

Self-audit: 275 entries → 65 numbered controls (145 mapped entries); 130 excluded entries. Missing / duplicate ordinals: 0. Image-only: KF-31, KF-33, KF-34 and SH-46. KF-06 is offscreen. Screenshot opened as an image. One scroll executed to the form bottom, zero clicks and zero skipped clicks; no form value or persistent preference was changed. Only the single shell trigger is a non-GET response; reminder, notification and eight telemetry requests remained blocked. No tabs were closed. The load reading was taken after capture start, not before; the timing omission is recorded in the issue comment.

## Capture self-audit

Numbers below count distinct inventory references receiving source items; image-only additions are separate. Exclusions are hidden, clipped, offscreen or structural duplicates, detailed in each reconciliation. Every screenshot was opened as an image.

| Slug | controls.json items | Distinct mapped numbers | Excluded items | Image-only additions |
| --- | --- | --- | --- | --- |
| m8-cases-list-base | 327 | 86 | 168 | 1 (trash) |
| m8f-cases-base | 327 | 86 | 168 | 1 (trash); inherited list inventory |
| m8f-cases-create | 270 | 72 | 110 | 4 (lock, two grips, trash) |
| m8f-cases-status | 276 | 76 | 117 | 4 (lock, two grips, trash) |
| m8f-cases-origin | 276 | 76 | 117 | 4 (lock, two grips, trash) |
| m8f-cases-priority | 276 | 76 | 117 | 4 (lock, two grips, trash) |
| m8f-cases-account | 414 | 89 | 216 | 4 types (handsets, two grips, trash) |
| m8f-cases-deal | 460 | 95 | 248 | 3 (two grips, trash) |
| m8f-cases-contact | 426 | 91 | 210 | 5 types (lock, two grips, trash, handsets) |
| m8f-cases-product | 299 | 83 | 124 | 3 (two grips, trash) |
| m8f-cases-lower | 275 | 65 | 130 | 4 (three grips, trash) |
| m8f-cases-after | 327 | 86 | 168 | 1 (trash) |
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

## Public documentation

Read-only public help consulted on 2026-10-17; neutral source keys avoid copying product identifiers or URLs into the repository. Article titles and headings are sufficient locators within the reference CRM public help. These are documented capabilities, not observations of this account.

- D1 — Working with Cases, Creating Cases: manual creation and file import are supported. No write was performed.
- D2 — Working with Solutions, Creating Solutions: manual creation and file import are supported; Solution Title, Question and Answer are required. Metadata determines the configured types and layout here.
- D3 — Common Operations with Records, Record Navigation: list navigation supports previous/next pages and a selectable page size. Exact empty-list controls are established only by the images.

## Capture refs and verification

- `m8d-cases-list-base`: click-free All Cases empty list; 327 source entries; image opened. 55 API calls form the baseline. Zero executed/skipped clicks. Expected blocked reminder, notification and telemetry requests only; no record mutation evidence.
- No detail, More Options, Timeline or filter capture: no record to open. No “after” capture was necessary after zero interactions: base is also the final observed state, total 0 and record links 0.
- No network contract table or visual measurements are included. Metadata was read offline. Markdown/source integrity and ordinal coverage were checked; application tests are not applicable to a documentation-only change.

## Evidence gaps

| Gap | Evidence | Temporary implementation reference / question |
| --- | --- | --- |
| Edit form, field order, defaults and buttons | not observed: All Cases has zero records | Reuse Create structure only as a provisional rule; confirm at the module gate. Do not invent a reference record. |
| Empty required-field errors | M1 requires Status, Case Origin, Subject; D1 agrees; Save is forbidden | Ref: record-detail.md, Layout / Flows, Leads invalid-create evidence. Reuse shared inline required-field feedback provisionally; exact Cases messages, focus and timing remain not observed. |
| Origin Email conditional validation | D1 describes an email requirement for email-origin cases; no option was selected | Gate question: confirm conditional rule against the current layout; do not claim an observed marker or message. |
| Successful Save / Save and New, server errors, duplicates and dirty Cancel | not observable without a write or field change | Ref: record-detail.md and leads-write-behaviour.md; no observed Cases-specific outcome. |
| Lower form and footer buttons | seen (m8f-cases-lower): Solution and form-view footer; header actions remain fixed | KF-28–KF-31 establish the lower controls. No repeated bottom Save, Save and New or Cancel group is painted. |
| Populated Product picker rows and pagination | not observed: m8f-cases-product paints an empty table; Account, Deal and Contact popups are observed separately | Do not infer populated-row controls from metadata or create reference products. |
| Field hover affordances and validation tooltips | not observed | Shared form pattern only, pending evidence. |
| Shell ownership for My Jobs, Services, Projects and utility shortcuts | visible labels / icons; destination not opened | Keep unknown module attribution until scope is decided. |

| Item | Source | Provisional rule proposal |
| --- | --- | --- |
| Populated rows, row-end actions, hover controls | No records in observed default list; inherited list inventory in contacts.md L-39–L-46 | Reuse shared record-list controls; retain module-specific row actions as not observed until gate decision. Never create reference records to obtain evidence. |
| Paging and page-size controls | D3, Common Operations with Records, Record Navigation; not observed on empty list | Reuse shared previous/next and page-size controls only for populated lists; no paging arrows in the observed empty state. Exact module behavior awaits gate decision. |
| Create split-menu contents | Opening not executed; guarded control | Keep contents not observed. D1/D2 document manual creation and file import capabilities, but do not establish current menu labels or order. |
| Filter fields below viewport and related-module filters | controls.json DOM only; clipped in screenshot | Keep DOM-only catalogue separate from visible-control inventory; reuse shared panel scroll behavior, no toggle or filter application. |
| System-view selection and availability | View metadata and default list total | Do not select a view or change persisted preferences; distinguish subset deduction from observed empty results. |

### DOM-only filter catalogue

The following are present in controls.json below the visible panel cutoff, not screen observations: Deal Name; Email; Last Activity Time; Modified By; Modified Time; No. of comments; Phone; Priority; Product Name; Related To; Reported By; Status; Subject; Tag; Type. The related-module section contains Calls, Emails, Meetings, Notes and Tasks in DOM order. The first Deal Name checkbox is only a bottom-edge fragment in the image. No scrolling, field toggle or filter application was performed.

These are CTO gate inputs, not questions sent to the board. Every proposal below is provisional and requires gate resolution before being treated as Cases parity evidence.

| Item | Available source / missing evidence | Provisional rule proposal |
| --- | --- | --- |
| Detail title, Edit, More Options, previous/next | Empty list image; no record link | Reuse shared record header; leave menu membership unresolved |
| Overview, Timeline and opened Timeline filter | No record; shared detail specs only | Reuse shared tabs provisionally; do not invent Cases filter options or empty wording |
| Field placement and section presentation | M1 layout membership; no detail image | Use metadata fields in section order; keep read-only and editable presentations separate |
| Description, Internal Comments, Solution | M1 textarea types; D1 purposes | Reuse textarea display pattern; exact rendering unresolved |
| Comment entry, history and count | M1 Add_Comment, Comments, No_of_comments; D1 field purpose | Keep comment submission separate from internal notes; count-update and history behaviour unresolved |
| All 18 related cards: header, count, columns, row controls, empty states | M1 list membership only; D1 covers a subset generically | Reuse shared card per type; confirm visibility/order/columns at gate |
| Solutions relationship or Find Solution | No Solutions list in M1; D1 workflow only | Keep Solution text field; add no relationship card without further evidence |
| Close/status/escalate and approval/locking | M1 Status and Locked__s; no visible controls | No dedicated action inferred from a field or metadata list |
| Reply / Send Email position | D1 documents composition; no detail image | Reuse shared email workflow provisionally; exact action location unresolved |
| Hover actions, validation, success and server-error states | Not observable from empty list without a write | Keep not observed; never create reference records to obtain evidence |
| Extra rail module ownership | Image establishes labels only | Keep unknown ownership as ? until shared-shell research resolves it |

## Open questions

- Exact populated row-end and hover-only controls remain not observed because both default lists are empty. CTO collects the evidence-gap decisions at the module gate; no board question is opened in this slice.
- Sheet view attribution and the rail links My Jobs, Services and Projects are unresolved (`?`), pending the module gate.
- Create split-menu opening is not observed following the automatic approval rejection; no alternative access was attempted.

## Links from other modules

MEP-842, research slice 5/5. Existing capture evidence is reused rather than recaptured. All three source screenshots were opened as images for this slice, including the fixed header, rail, card actions, right edge and utility strip. No reference session was opened, no control was clicked, and no tabs were closed during this slice. The tables below inventory the complete Cases surface in each image; the rest of each screen retains its existing screen inventory and reconciliation.

Metadata source: `modules/Accounts/related_lists.json`, `modules/Contacts/related_lists.json`, `modules/Deals/related_lists.json`, and Cases fields/layouts. Accounts and Deals configure Cases at sequence 22; Contacts at sequence 18. These metadata sequences differ from the rendered rail positions below. All three relate through standard Cases lookup fields, rather than a new standalone association model.

### Control inventory — m3c-card-sales-orders (reused Accounts evidence)

Shell and surrounding record controls: [accounts-record-detail.md](accounts-record-detail.md), m3d-detail-main and m3c-card-sales-orders. No shell rows are repeated. Sales Orders is selected; Cases itself is not the active rail row.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KX-01 | Related-list rail | Cases | link | row 14, after Member Accounts | same; no new click | seen (m3c-card-sales-orders) | M8 | AD-19 (accounts-record-detail.md) |
| KX-02 | Cases card | Cases | heading | below Member Accounts, header left | Names the related list; no counter painted | seen (m3c-card-sales-orders) | M8 | accounts-record-detail.md, Related-list cards, Cases row |
| KX-03 | Cases card | Assign | button | header right group, first | not observed; inspection only | seen (m3c-card-sales-orders) | M8 | AD-155 (accounts-record-detail.md) |
| KX-04 | Cases card | New | button | header right group, second | not observed; not opened | seen (m3c-card-sales-orders) | M8 | AD-156 (accounts-record-detail.md) |
| KX-05 | Cases card | No records found | status text | body, below header divider | Empty related list; no columns or rows painted | seen (m3c-card-sales-orders) | M8 | accounts-record-detail.md, Related-list cards, Cases row |

No Cases rail plus, card-header counter, column header, row selector, row-end menu or pagination is painted. Populated row controls remain not observed.

### Control inventory — m2d2-card-cases (reused Contacts evidence)

Shell and surrounding controls: [contacts-record-detail.md](contacts-record-detail.md), Control inventory — m2d2-card-cases, including its complete source-ordinal reconciliation. Cases is the selected rail entry. Its card is first below the sticky tabs.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KX-06 | Related-list rail | Cases | link | row 10, after Products | Scrolls to Cases; inherited observation, no new click | seen (m2d2-card-cases) | M8 | D-19 (contacts-record-detail.md) |
| KX-07 | Related-list rail | Plus icon | icon button | selected Cases row, right end | not observed; not clicked | seen (m2d2-card-cases) | M8 | D-72 (contacts-record-detail.md) |
| KX-08 | Cases card | Cases | heading | header left | Names the related list; no counter painted | seen (m2d2-card-cases) | M8 | contacts-record-detail.md, Related-list cards, Cases row |
| KX-09 | Cases card | Assign | button | header right group, first | not observed; inspection only | seen (m2d2-card-cases) | M8 | D-70 (contacts-record-detail.md) |
| KX-10 | Cases card | New | button | header right group, second | not observed; not opened | seen (m2d2-card-cases) | M8 | D-71 (contacts-record-detail.md) |
| KX-11 | Cases card | No records found | status text | body, below header divider | Empty related list; no columns or rows painted | seen (m2d2-card-cases) | M8 | contacts-record-detail.md, Related-list cards, Cases row |

No card-header counter, column header, row selector, row-end menu or pagination is painted. The plus is visible here because Cases is selected; it is not evidence that the inactive Accounts/Deals row lacks an equivalent affordance.

### Control inventory — m4c-card-sales-orders (reused Deals evidence)

Shell and surrounding controls: [deals-record-detail.md](deals-record-detail.md), m4c-detail-base and Control inventory — m4c-card-sales-orders. Sales Orders is selected. Cases follows Emails and precedes Invoices in the content.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| KX-12 | Related-list rail | Cases | link | row 14, after Emails | same; no new click | seen (m4c-card-sales-orders) | M8 | DD-19 (deals-record-detail.md) |
| KX-13 | Cases card | Cases | heading | header left | Names the related list; no counter painted | seen (m4c-card-sales-orders) | M8 | deals-record-detail.md, Related-list cards, Cases row |
| KX-14 | Cases card | Assign | button | header right group, first | not observed; inspection only | seen (m4c-card-sales-orders) | M8 | DD-142 (deals-record-detail.md) |
| KX-15 | Cases card | New | button | header right group, second | not observed; not opened | seen (m4c-card-sales-orders) | M8 | DD-143 (deals-record-detail.md) |
| KX-16 | Cases card | No records found | status text | body, below header divider | Empty related list; no columns or rows painted | seen (m4c-card-sales-orders) | M8 | deals-record-detail.md, Related-list cards, Cases row |

No Cases rail plus, card-header counter, column header, row selector, row-end menu or pagination is painted. The floating Scroll To Top overlaps the following Invoices action, not Cases New.

### Reused evidence reconciliation

Source ordinals are offline evidence references, never click selectors. Wrappers and their child buttons share an inventory number. This is a focused crosswalk into the existing whole-screen inventories, not a new capture or replacement shell inventory. All other source entries retain the original screen mapping/exclusion; surrounding cards are outside this slice and are not asserted absent.

| Slug | Source entries | Cases mapping | Cases structural exclusions | Remaining entries inherited from source screen spec |
| --- | --- | --- | --- | --- |
| m3c-card-sales-orders | 510 | KX-01: 169–170; KX-02: 456; KX-03: 457–458; KX-04: 459–460 | 455: enclosing card wrapper | 502 |
| m2d2-card-cases | 513 | KX-06: 158–159; KX-07: 161; KX-08: 409; KX-09: 410–411; KX-10: 412–413 | 408: enclosing card wrapper | 504 |
| m4c-card-sales-orders | 509 | KX-12: 165–166; KX-13: 457; KX-14: 458–459; KX-15: 460–461 | 456: enclosing card wrapper | 501 |

KX-05, KX-11 and KX-16 are visible empty-state text in the images, additional to controls.json. No additional Cases icon was found. No opened-menu delta exists: no Assign, New or plus control was activated. New capture safety/painting/count comparisons are inapplicable because this slice sends no requests; historical checks remain in the source specs.

### Parent lookup and prefill evidence

| Parent surface | Configured Cases field | Evidence | New-form prefill |
| --- | --- | --- | --- |
| Accounts Cases card | `Account_Name` / Account Name | Cases metadata; KF-13–KF-14 lookup in Create form | not observed; not established by public help |
| Contacts Cases card | `Related_To` / Related To | Cases metadata; KF-11–KF-12; D1 standard-field purpose | not observed; not established by public help |
| Deals Cases card | `Deal_Name` / Deal Name | Cases metadata; KF-15–KF-16; D4 documents Cases creation from deal details | not observed; not established by public help |

These are parent-field mappings, not proof of prefilled values. D1 identifies the contact/account/deal lookup purposes. D4 establishes the deal Cases entry point but does not specify automatic field population. Neither article confirms whether New opens a page or dialog, whether an associated account/contact is copied from the parent, or whether email/phone are copied. No such propagation should be implemented as an established parity rule. The standalone Create Case defaults remain described under Create and edit form.

### Case-related filters in earlier lists

| List | Case-related entry | Evidence boundary | Ref |
| --- | --- | --- | --- |
| Leads | Cases (Connected Records) | Existing related-module catalogue; connected-record relation, not a direct Cases parent lookup | list-views.md, Filter By Related Modules catalogue |
| Contacts | Cases | DOM-only, below the visible filter viewport in m2-list-base; not selected or visually confirmed | contacts.md base reconciliation excludes offscreen filter entries; existing capture controls.json |
| Accounts | Cases | DOM-only clipped related-module filter catalogue; no operator or value control opened | accounts.md, DOM-only filter catalogue |
| Deals | Cases | DOM-only clipped related-module filter catalogue; no operator or value control opened | deals.md, DOM-only filter catalogue |

Related-filter operators, has/has-not behavior, nested criteria and applied results remain not observed. Presence in a DOM catalogue does not establish an active filter or visible checkbox. No filter, view or preference was changed.

Products metadata also configures Cases (sequence 15) and Solutions (sequence 16). Products belongs to Phase 2; no Products screen research or implementation is included here.

## Cases and Solutions

The configured link shape is **Solution text on a Case**, with independent Solutions knowledge records. Evidence must not be interpreted as proof that a live detail screen has no additional control:

- Cases metadata contains `Solution` as textarea and no Solutions related list. The painted lower Create form confirms an editable multiline field, KF-28 in m8f-cases-lower; no solution picker or association control is painted there.
- Solutions metadata contains neither a Cases lookup nor a Cases related list. Its observed Create form has Product Name, Question and Answer, with no Case lookup (SF-05–SF-16 in solutions.md).
- Slice 2/5 and 3/5 could not open record detail because the painted Cases and Solutions lists have zero records. Find Solution, Add Solution, Associate, Remove and reciprocal detail cards therefore remain **not observed**, rather than proven absent.
- D1 describes moving a proven resolution into the knowledge module for reuse; D2 describes knowledge articles. This is a workflow connection, not documented evidence of a foreign key, related list, automatic copy or association widget.

**Recommendation for CTO decision:** retain the metadata-backed Solution textarea and the independent Solutions module. Do not add a Cases ↔ Solutions lookup, join table, reciprocal related-list card or Find Solution flow on present evidence. This is a proposal, not an approved architecture decision. If the gate requires an additional relationship, the CTO must decide its contract after reviewing the evidence gaps. Products links are a separate Phase 2 concern.

### Cross-module evidence gaps

| Item | Why unobserved | Proposed boundary pending CTO gate |
| --- | --- | --- |
| Populated Cases-card columns, counter, row actions, hover and paging | All three existing parent-card images are empty | Reuse the observed empty state; leave populated schema/actions unresolved, without creating reference records |
| New-card form and lookup prefill for each parent | New and rail-plus are forbidden; public help does not establish exact defaults | Keep the configured parent mapping separate from an unconfirmed prefill rule |
| Assign dialog and association/removal outcome | Assign not opened; association and removal are forbidden | Retain visible control evidence only; no invented picker, selection or success behavior |
| Related-module filter operators and applied results | Catalogue only; no toggle or application | Preserve catalogue availability separately from unobserved filter semantics |
| Reciprocal Cases/Solutions detail controls | Both datasets empty; no live detail available | Text-only recommendation above, with final decision owned by CTO |

### Cross-module public sources

Read-only public help reviewed on 2026-10-18. Neutral keys and article/heading locators are used because product-bearing URLs must not enter the repository. These sources establish documented capabilities, not account-specific observations.

- D1 — Working with Cases: Standard fields in the Cases module; Typical Case Management Process. Lookup purposes, a solution text field and resolution reuse workflow; no parent-card prefill contract.
- D2 — Working with Solutions: Standard Fields in Solutions; Creating Solutions. Independent knowledge article structure; no reciprocal Cases association contract.
- D4 — Creating Deals: Working with the Deals Details page; Associate Deals with Other Records. Documents Cases creation from deal details, without specifying populated fields.

### Cross-module open questions

- CTO: confirm the proposed text-only Cases/Solutions connection at the module gate; no new relationship is authorized by this spec.
- Parent-card New form prefills, populated related-list behavior and exact case-filter semantics remain not observed. Existing public documentation does not close these gaps. No reference writes are permitted to resolve them.
