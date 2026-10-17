# Cases

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

Status, Case Origin and Subject have a required input-edge marker. Description Information follows, with Description then Internal Comments as full-width multiline controls with resize grips. Solution Information and the form footer are below the initial viewport; their presence in extracted text alone is not a visual observation. Client Script occupies the right edge. No Case Image section is painted in the initial viewport.

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

KF-06, KF-33 and KF-34 are image-only. A select includes its arrow; a required marker is a field state, not an extra control. KF-28–KF-31 are reserved for the lower form. Absent here: account image, address blocks, Copy Address, account-specific commercial fields.

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

### Form fields versus metadata

M1 configures 30 fields. Case Number is an auto-number; Owner is an owner lookup; Status / Type / Priority / Case Reason / Case Origin are picklists; Product Name targets Products, Related To targets Contacts, Account Name targets Accounts, and Deal Name targets Deals. The rendered Related To and Reported By controls are distinct. Case Number is locked on Create. The metadata requirements Status / Case Origin / Subject agree with their three visible markers. No values from an existing record were copied.

The initial viewport visually establishes KF-05–KF-27. Solution, Add Comment and Comments are not established by that image. Metadata-only system fields, tags, timestamps, comment counts and connection fields must not be inferred as create inputs. A Case Image section exists in M1 but has no fields and is not painted here.

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

## Public documentation

Read-only public help consulted on 2026-10-17; neutral source keys avoid copying product identifiers or URLs into the repository. Article titles and headings are sufficient locators within the reference CRM public help. These are documented capabilities, not observations of this account.

- D1 — Working with Cases, Creating Cases: manual creation and file import are supported. No write was performed.
- D2 — Working with Solutions, Creating Solutions: manual creation and file import are supported; Solution Title, Question and Answer are required. Metadata determines the configured types and layout here.
- D3 — Common Operations with Records, Record Navigation: list navigation supports previous/next pages and a selectable page size. Exact empty-list controls are established only by the images.

## Evidence gaps

| Gap | Evidence | Temporary implementation reference / question |
| --- | --- | --- |
| Edit form, field order, defaults and buttons | not observed: All Cases has zero records | Reuse Create structure only as a provisional rule; confirm at the module gate. Do not invent a reference record. |
| Empty required-field errors | M1 requires Status, Case Origin, Subject; D1 agrees; Save is forbidden | Ref: record-detail.md, Layout / Flows, Leads invalid-create evidence. Reuse shared inline required-field feedback provisionally; exact Cases messages, focus and timing remain not observed. |
| Origin Email conditional validation | D1 describes an email requirement for email-origin cases; no option was selected | Gate question: confirm conditional rule against the current layout; do not claim an observed marker or message. |
| Successful Save / Save and New, server errors, duplicates and dirty Cancel | not observable without a write or field change | Ref: record-detail.md and leads-write-behaviour.md; no observed Cases-specific outcome. |
| Lower form and repeated footer buttons | not observed: below the initial viewport | Solution Information is extracted and configured, but its rendered field and footer positions need a permitted scroll capture; KF-28–KF-31 remain unassigned. |
| Deal, Contact and Product picker interiors | pending capture; Account popup observed in m8f-cases-account | Partial step files without meta.json/network.json are excluded; do not infer popup controls from metadata. |
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

## Open questions

- Exact populated row-end and hover-only controls remain not observed because both default lists are empty. CTO collects the evidence-gap decisions at the module gate; no board question is opened in this slice.
- Sheet view attribution and the rail links My Jobs, Services and Projects are unresolved (`?`), pending the module gate.
- Create split-menu opening is not observed following the automatic approval rejection; no alternative access was attempted.
