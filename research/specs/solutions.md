# Solutions

Status: MEP-838 research slice 1/5, submitted for UI Lead approval. Metadata and capture evidence are distinguished below.

## Purpose

Describe the Solutions list and module configuration. Detail and form research belong to subsequent slices. No reference writes or persisted preference changes are permitted.

## Fields and layout

Source: research workspace `modules/Solutions/fields.json` and `layouts.json`. Metadata is authoritative for configuration; it does not establish screen visibility. 20 fields.

| API name | Label | Type | System mandatory | Standard layout required |
| --- | --- | --- | --- | --- |
| `Solution_Number` | Solution Number | autonumber | no | no |
| `Owner` | Solution Owner | ownerlookup | no | no |
| `Solution_Title` | Solution Title | text | yes | yes |
| `Published` | Published | boolean | no | no |
| `Status` | Status | picklist | no | no |
| `Product_Name` | Product Name | lookup | no | no |
| `No_of_comments` | No. of comments | integer | no | no |
| `Created_By` | Created By | ownerlookup | no | no |
| `Modified_By` | Modified By | ownerlookup | no | no |
| `Created_Time` | Created Time | datetime | no | no |
| `Modified_Time` | Modified Time | datetime | no | no |
| `Question` | Question | textarea | no | yes |
| `Answer` | Answer | textarea | no | yes |
| `Add_Comment` | Add Comment | textarea | no | no |
| `Comments` | Comments | text | no | no |
| `Tag` | Tag | text | no | no |
| `id` | Record Id | bigint | no | no |
| `Locked__s` | Locked | boolean | no | no |
| `Last_Activity_Time` | Last Activity Time | datetime | no | no |
| `Connected_To__s` | Connected To | multi_module_lookup | no | no |

Picklists, metadata order:

- `Status`: Draft; Reviewed; Duplicate.

Layout sections, metadata order (not form observations):

- **Solution Image** (1 columns): no field entries.
- **Solution Information** (2 columns): `Solution_Number`, `Owner`, `Solution_Title`, `Status`, `Product_Name`, `No_of_comments`, `Created_By`, `Modified_By`, `Created_Time`, `Modified_Time`, `Tag`, `id`, `Last_Activity_Time`, `Connected_To__s`.
- **Description Information** (1 columns): `Question`, `Answer`, `Add_Comment`.
- **Comment Information** (1 columns): `Comments`.

Related lists, metadata sequence; visibility is configuration, not a detail-screen observation. Equal sequence numbers are retained.

| Sequence | Label | API name | Visible |
| --- | --- | --- | --- |
| 1 | Review Process-Review Summary | `Review_Processes` | false |
| 1 | Connected Records | `Connected_Records__s` | true |
| 2 | Notes | `Notes` | true |
| 2 | Review Process-Field History | `Review_Logs` | false |
| 3 | Attachments | `Attachments` | true |
| 4 | Checklists | `CheckLists` | true |
| 5 | Locking Information | `Locking_Information__s` | true |

## Views

Source: `custom_views.json` and per-view files. Availability below must come from screen evidence, independently of criteria. System criterion fields absent from the field dictionary are not editable fields.

| View | Criteria | Columns, metadata order | Availability |
| --- | --- | --- | --- |
| All Locked Solutions | `Locked__s` equal True | `Solution_Title`, `Status`, `Owner` | empty (deduced from All Solutions = 0) |
| All Solutions (default) | None | `Solution_Number`, `Solution_Title`, `Status`, `Owner` | empty (deduced from All Solutions = 0) |
| My Solutions | `Owner` equal current user | `Solution_Number`, `Solution_Title`, `Status` | empty (deduced from All Solutions = 0) |
| Unread Solutions | `Common_Status` not_contains v | `Solution_Number`, `Solution_Title`, `Status`, `Owner` | empty (deduced from All Solutions = 0) |

All metadata views have wrap text enabled and no pinned fields. No runtime default sort is inferred from null metadata sort values. View selection, saving and preference controls must not be used to establish availability.

## List screen

All Solutions is painted and empty: Total Records 0. The filter panel is already open, not toggled. All four system views select subsets of this empty universe, so their availability is empty by deduction; no view was selected. No reference record is available for later detail slices.

### Control inventory — m8-solutions-list-base

Shell: SH-01–SH-11 and SH-23–SH-46 as in [contacts.md](contacts.md). SH-08 reads MCP. SH-23 (Integrations) is partly clipped beneath the rail Search box; Visits and Price Books follow it. SH-12–SH-22 are outside the visible rail area. SL-41–SL-51 give the remaining visible module links; Solutions is active. My Jobs is only a bottom-edge fragment; Services and Projects are outside the visible rail area. SH-46 is image-only. No shell control was clicked.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SL-01 | View strip | All Solutions | tab | left, first | not observed | seen (m8-solutions-list-base) | M8 | KL-01 (cases.md) |
| SL-02 | View strip | Three dots / More Custom View | icon button | after current view | Opens the system-view menu | seen (m8-solutions-list-base) | M8 | KL-02 (cases.md) |
| SL-03 | Toolbar | Filter | button | left, first | not observed | seen (m8-solutions-list-base) | M8 | KL-03 (cases.md) |
| SL-04 | Toolbar | Sort | button | left, second | not observed | seen (m8-solutions-list-base) | M8 | KL-04 (cases.md) |
| SL-05 | Toolbar | List view | icon button | view group, item 1 | not observed | seen (m8-solutions-list-base) | M8 | KL-05 (cases.md) |
| SL-06 | Toolbar | Kanban view | icon button | view group, item 2 | not observed | seen (m8-solutions-list-base) | M8 | KL-06 (cases.md) |
| SL-07 | Toolbar | Sheet view | icon button | view group, item 3 | not observed | seen (m8-solutions-list-base) | M8 | KL-07 (cases.md) |
| SL-08 | Toolbar | Chart view | icon button | view group, item 4 | not observed | seen (m8-solutions-list-base) | M8 | KL-08 (cases.md) |
| SL-09 | Toolbar | Timeline view | icon button | view group, item 5 | not observed | seen (m8-solutions-list-base) | M8 | KL-09 (cases.md) |
| SL-10 | Toolbar | Two horizontal bars | icon button | view group, item 6 | not observed | seen (m8-solutions-list-base) | M8 | KL-10 (cases.md) |
| SL-11 | Toolbar | Down chevron | icon button | view group, item 7 | not observed | seen (m8-solutions-list-base) | M8 | KL-11 (cases.md) |
| SL-12 | Toolbar | Create Solution | button | right group, main button | not observed | seen (m8-solutions-list-base) | M8 | KL-12 (cases.md) |
| SL-13 | Toolbar | Down arrow / More | icon button | attached to Create Case | not observed | seen (m8-solutions-list-base) | M6 | KL-13 (cases.md) |
| SL-14 | Toolbar | Three dots / Actions | icon button | far right | Opens Actions menu | seen (m8-solutions-list-base) | M8 | KL-14 (cases.md) |
| SL-15 | Filter panel | Search | input | below title | not observed | seen (m8-solutions-list-base) | M8 | KL-15 (cases.md) |
| SL-16 | Filter panel | System Defined Filters | toggle | first section heading | not observed | seen (m8-solutions-list-base) | M8 | KL-16 (cases.md) |
| SL-17 | Filter panel | Locked | checkbox | system section, item 1 | not observed | seen (m8-solutions-list-base) | M8 | KL-18 moved (cases.md) |
| SL-18 | Filter panel | Record Action | checkbox | system section, item 2 | not observed | seen (m8-solutions-list-base) | M8 | KL-19 moved (cases.md) |
| SL-19 | Filter panel | Related Records Action | checkbox | system section, item 3 | not observed | seen (m8-solutions-list-base) | M8 | KL-20 moved (cases.md) |
| SL-20 | Filter panel | Touched Records | checkbox | system section, item 4 | not observed | seen (m8-solutions-list-base) | M8 | KL-21 moved (cases.md) |
| SL-21 | Filter panel | Untouched Records | checkbox | system section, item 5 | not observed | seen (m8-solutions-list-base) | M8 | KL-22 moved (cases.md) |
| SL-22 | Filter panel | Filter By Fields | toggle | second section heading | not observed | seen (m8-solutions-list-base) | M8 | KL-23 moved (cases.md) |
| SL-23 | Filter panel | Connected To | checkbox | field section, visible item 1 | not observed | seen (m8-solutions-list-base) | M8 | KL-29 moved (cases.md) |
| SL-24 | Filter panel | Created By | checkbox | field section, visible item 2 | not observed | seen (m8-solutions-list-base) | M8 | KL-30 moved (cases.md) |
| SL-25 | Filter panel | Created Time | checkbox | field section, visible item 3 | not observed | seen (m8-solutions-list-base) | M8 | KL-31 moved (cases.md) |
| SL-26 | Filter panel | Last Activity Time | checkbox | field section, visible item 4 | not observed | seen (m8-solutions-list-base) | M8 | new |
| SL-27 | Filter panel | Modified By | checkbox | field section, visible item 5 | not observed | seen (m8-solutions-list-base) | M8 | new |
| SL-28 | Filter panel | Modified Time | checkbox | field section, visible item 6 | not observed | seen (m8-solutions-list-base) | M8 | new |
| SL-29 | Filter panel | No. of comments | checkbox | field section, visible item 7 | not observed | seen (m8-solutions-list-base) | M8 | new |
| SL-30 | Filter panel | Product Name | checkbox | field section, visible item 8 | not observed | seen (m8-solutions-list-base) | M8 | new |
| SL-31 | Filter panel | Solution Number | checkbox | field section, visible item 9 | not observed | seen (m8-solutions-list-base) | M8 | KL-25 moved (cases.md) |
| SL-32 | Table | View Settings / sliders | icon button | header, far right overlay | not observed | seen (m8-solutions-list-base) | M11 | KL-32 (cases.md) |
| SL-33 | Table | Solution Number | column header | first text column | not observed | seen (m8-solutions-list-base) | M8 | KL-33 (cases.md) |
| SL-34 | Table | Solution Title | column header | second text column | not observed | seen (m8-solutions-list-base) | M8 | KL-34 (cases.md) |
| SL-35 | Table | All with down arrow | select | inside Solution Title header | not observed | seen (m8-solutions-list-base) | M8 | KL-35 (cases.md) |
| SL-36 | Table | Status | column header | third text column | not observed | seen (m8-solutions-list-base) | M8 | KL-36 (cases.md) |
| SL-37 | Table | Solution Owner | column header | fourth text column | not observed | seen (m8-solutions-list-base) | M8 | new |
| SL-38 | Table | No Solutions found. | status text | empty table body | Displays empty results | seen (m8-solutions-list-base) | M8 | KL-38 (cases.md) |
| SL-39 | List footer | Total Records 0 | badge | bottom left | Displays zero total | seen (m8-solutions-list-base) | M8 | KL-39 (cases.md) |
| SL-41 | Rail | Products | link | visible module row after Price Books, item 1 | not observed | seen (m8-solutions-list-base) | P2 | KL-41 moved (cases.md) |
| SL-42 | Rail | Quotes | link | visible module row after Price Books, item 2 | not observed | seen (m8-solutions-list-base) | P2 | KL-42 moved (cases.md) |
| SL-43 | Rail | Invoices | link | visible module row after Price Books, item 3 | not observed | seen (m8-solutions-list-base) | P2 | KL-43 moved (cases.md) |
| SL-44 | Rail | Sales Orders | link | visible module row after Price Books, item 4 | not observed | seen (m8-solutions-list-base) | P2 | KL-44 moved (cases.md) |
| SL-45 | Rail | Solutions | link | visible module row after Price Books, item 5 | not observed | seen (m8-solutions-list-base) | M8 | KL-45 moved (cases.md) |
| SL-46 | Rail | Social | link | visible module row after Price Books, item 6 | not observed | seen (m8-solutions-list-base) | M15 | KL-46 moved (cases.md) |
| SL-47 | Rail | Forecasts | link | visible module row after Price Books, item 7 | not observed | seen (m8-solutions-list-base) | P2 | KL-47 moved (cases.md) |
| SL-48 | Rail | Purchase Orders | link | visible module row after Price Books, item 8 | not observed | seen (m8-solutions-list-base) | P2 | KL-48 moved (cases.md) |
| SL-49 | Rail | Vendors | link | visible module row after Price Books, item 9 | not observed | seen (m8-solutions-list-base) | P2 | KL-49 moved (cases.md) |
| SL-50 | Rail | SalesInbox | link | visible module row after Price Books, item 10 | not observed | seen (m8-solutions-list-base) | M10 | KL-50 moved (cases.md) |
| SL-51 | Rail | Cases | link | visible module row after Price Books, item 11 | not observed | seen (m8-solutions-list-base) | M8 | KL-51 moved (cases.md) |
| SL-52 | Rail | Right resize handle | separator | right edge of navigation rail | not observed | seen (m8-solutions-list-base) | M1 | KL-55 (cases.md) |
| SL-53 | Filter panel | Right resize handle | separator | right edge of filter panel | not observed | seen (m8-solutions-list-base) | M1 | KL-56 (cases.md) |

SL-40: Refresh Custom View is DOM-only and unpainted in this base; not observed visually. Latest Email Status is absent from Solutions system filters. No select-all checkbox, populated row, row-end action or paging control is painted. A bottom-edge fragment of Solution Owner in the filter panel does not establish full visual observation. All four configured table columns are visible.

Bulk selection: Ref [contacts.md](contacts.md) L-34 / L-40 and [list-views.md](list-views.md); no selection attempted.

### Control inventory — m8-solutions-list-views

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SL-02.1 | View menu | Public Views | toggle | popup, row 1 | not observed; not selected | seen (m8-solutions-list-views) | M8 | KL-02.1 (cases.md) |
| SL-02.2 | View menu | All Locked Solutions | menu item | popup, row 2 | not observed; not selected | seen (m8-solutions-list-views) | M8 | KL-02.3 moved (cases.md) |
| SL-02.3 | View menu | All Solutions | menu item | popup, row 3 | not observed; not selected | seen (m8-solutions-list-views) | M8 | KL-02.2 moved (cases.md) |
| SL-02.4 | View menu | My Solutions | menu item | popup, row 4 | not observed; not selected | seen (m8-solutions-list-views) | M8 | KL-02.6 moved (cases.md) |
| SL-02.5 | View menu | Unread Solutions | menu item | popup, row 5 | not observed; not selected | seen (m8-solutions-list-views) | M8 | KL-02.9 moved (cases.md) |
| SL-02.6 | View menu | Show custom views as Dropdown | button | popup, row 6 | not observed; not selected | seen (m8-solutions-list-views) | M11 | KL-02.10 moved (cases.md) |
| SL-02.7 | View menu | New Custom View | menu item | popup, row 7 | not observed; not selected | seen (m8-solutions-list-views) | M11 | KL-02.11 moved (cases.md) |
| SL-02.8 | View menu | Manage Custom View | menu item | popup, row 8 | not observed; not selected | seen (m8-solutions-list-views) | M11 | KL-02.12 moved (cases.md) |

SL-40 Refresh Custom View is painted after the view-group chevron, not clicked; Ref KL-40 (cases.md). Rest: as in m8-solutions-list-base; covered by overlay: part of the filter panel, SL-33 and SL-34. Check mark on All Solutions indicates the active view; no menu row was selected.

Reconciliation: 1–277 keep base mappings, except 155–156 now map to the visibly painted SL-40. 278–280 and 282 are structural menu wrappers, excluded. 281 → SL-02.1; 283 → .2; 284 → .3; 285 → .4; 286 → .5; 287 → .6; 288–289 → .7; 290–292 → .8. 293 → SL-40 duplicate; 294–301 map to base 278–285; 302–303 are duplicate menu bodies, excluded. All 303 entries accounted for.

### Create menu — not observed

This split button has the same guarded import-related technical attribute as Cases. The Cases opening was rejected by automatic approval review before execution, so no equivalent Solutions call or alternative access was attempted. Contents remain not observed; Ref KL-13 and Create menu — not observed in [cases.md](cases.md).

### Control inventory — m8-solutions-list-actions

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SL-14.1 | Actions menu | Mass Transfer | menu item | popup, row 1 | not observed; not selected | seen (m8-solutions-list-actions) | M8 | KL-14.1 (cases.md) |
| SL-14.2 | Actions menu | Mass Delete | menu item | popup, row 2 | not observed; not selected | seen (m8-solutions-list-actions) | M8 | KL-14.2 (cases.md) |
| SL-14.3 | Actions menu | Mass Update | menu item | popup, row 3 | not observed; not selected | seen (m8-solutions-list-actions) | M8 | KL-14.3 (cases.md) |
| SL-14.4 | Actions menu | Manage Tags | menu item | popup, row 4 | not observed; not selected | seen (m8-solutions-list-actions) | M6 | KL-14.4 (cases.md) |
| SL-14.5 | Actions menu | Drafts | menu item | popup, row 5 | not observed; not selected | seen (m8-solutions-list-actions) | M8 | KL-14.5 (cases.md) |
| SL-14.6 | Actions menu | Create Client Script | menu item | popup, row 6 | not observed; not selected | seen (m8-solutions-list-actions) | M11 | KL-14.8 moved (cases.md) |
| SL-14.7 | Actions menu | Export Solutions | menu item | popup, row 7 | not observed; not selected | seen (m8-solutions-list-actions) | M6 | KL-14.9 moved (cases.md) |
| SL-14.8 | Actions menu | Sheet view | menu item | popup, row 8 | not observed; not selected | seen (m8-solutions-list-actions) | ? | KL-14.10 moved (cases.md) |
| SL-14.9 | Actions menu | Print View | menu item | popup, row 9 | not observed; not selected | seen (m8-solutions-list-actions) | M8 | KL-14.11 moved (cases.md) |

SL-40 Refresh Custom View is painted after the view-group chevron, not clicked. Rest: as in m8-solutions-list-base; covered by overlay: SL-37, SL-32 and right-hand empty table area. No Mass Email or Approve Cases equivalent is present. Print View has an unopened submenu arrow; sparkles are decorative. The branded Sheet view prefix is omitted here. No menu item was selected.

Reconciliation: items 1–264 retain base assignments, except 155–156 now map to SL-40. 265–266 → SL-14.1; 267–268 → .2; 269–270 → .3; 271–272 → .4; 273–274 → .5; 275 → .6; 276 → .7. 277–289 map to base 265–277; 290 → SL-40 duplicate; 291–298 map to base 278–285; 299 is a menu wrapper, excluded. All 299 entries accounted for. SL-14.8 and SL-14.9 are image-only.

### Reconciliation — m8-solutions-list-base

| Inventory or exclusion | Source ordinals |
| --- | --- |
| SL-01 | 138 |
| SL-02 | 139, 140, 141, 142, 143 |
| SL-03 | 144 |
| SL-04 | 145 |
| SL-05 | 147 |
| SL-06 | 148 |
| SL-07 | 149 |
| SL-08 | 150 |
| SL-09 | 151 |
| SL-10 | 152 |
| SL-11 | 153, 154 |
| SL-12 | 157 |
| SL-13 | 158, 159 |
| SL-14 | 160, 278 |
| SL-15 | 163, 164, 279 |
| SL-16 | 166 |
| SL-17 | 168, 169 |
| SL-18 | 170, 171 |
| SL-19 | 172, 173 |
| SL-20 | 174, 175 |
| SL-21 | 176, 177 |
| SL-22 | 178 |
| SL-23 | 180, 181 |
| SL-24 | 182, 183 |
| SL-25 | 184, 185 |
| SL-26 | 186, 187 |
| SL-27 | 188, 189 |
| SL-28 | 190, 191 |
| SL-29 | 192, 193 |
| SL-30 | 194, 195 |
| SL-31 | 196, 197 |
| SL-32 | 214 |
| SL-33 | 223 |
| SL-34 | 224 |
| SL-35 | 225, 226 |
| SL-36 | 227 |
| SL-37 | 228 |
| SL-38 | 239 |
| SL-39 | 249 |
| SL-41 | 66, 67, 68 |
| SL-42 | 69, 70, 71 |
| SL-43 | 72, 73, 74 |
| SL-44 | 75, 76, 77 |
| SL-45 | 78, 79, 80 |
| SL-46 | 81, 82, 83 |
| SL-47 | 84, 85, 86 |
| SL-48 | 87, 88, 89 |
| SL-49 | 90, 91, 92 |
| SL-50 | 93, 94, 95 |
| SL-51 | 96, 97, 98 |
| SL-52 | 107 |
| SL-53 | 212 |
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
| SH-23 | 59 |
| SH-24 | 60, 61, 62 |
| SH-25 | 63, 64, 65 |
| SH-26 | 111 |
| SH-27 | 112 |
| SH-28 | 114 |
| SH-29 | 115 |
| SH-30 | 116 |
| SH-31 | 119 |
| SH-32 | 122 |
| SH-33 | 125, 126 |
| SH-34 | 129, 130, 131, 132 |
| SH-35 | 266 |
| SH-36 | 267 |
| SH-37 | 268 |
| SH-38 | 269 |
| SH-39 | 270 |
| SH-40 | 271 |
| SH-41 | 272 |
| SH-42 | 273 |
| SH-43 | 274 |
| SH-44 | 275 |
| SH-45 | 276 |
| Excluded: structural wrapper / duplicate, no separate visible control | 1, 109, 113, 137, 146, 162, 167, 179, 213, 217, 218, 219, 220, 221, 222, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 265, 280, 281, 282, 283, 285 |
| Excluded: zero-area hidden element | 5, 6, 7, 8, 9, 10, 33, 106, 108, 110, 117, 118, 120, 121, 123, 124, 127, 128, 133, 134, 135, 136, 161, 165, 210, 211, 215, 216, 240, 241, 242, 243, 244, 245, 246, 247, 248, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 277 |
| Excluded: rail content outside visible scroll area or bottom-edge fragment | 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 99, 100, 101, 102, 103, 104, 105 |
| Excluded: refresh control exists in DOM but unpainted (SL-40; not observed) | 155, 156 |
| Excluded: filter content below panel cutoff; not visually observed | 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 284 |

All 285 entries accounted for: 157 mapped items, 128 excluded items. Image-only SH-46 is additional.


### Control inventory — m8-solutions-list-after

No changed visible controls. Rest: as in m8-solutions-list-base; covered by overlay: none. The image was opened and all 285 controls.json entries match the base order and mappings. Total Records remains 0 → 0 and record links 0 → 0; no evidence of a reference change. Refresh remains unpainted.

## Record detail

Research slice: MEP-840. This section complements the separate list/form research; it does not replace it. Shared references use the delivered Cases detail inventory from MEP-839 (`cases.md`, KD numbers), pending its integration into main.

### Purpose and evidence boundary

Describe the record header, tabs, content and related cards without modifying the reference CRM. The permitted fallback applies: `m8-solutions-detail-empty` shows a painted **All Solutions** list, “No Solutions found.” and Total Records 0. There are zero record links, 55 API calls (the previous Solutions list baseline also has 55), and a successful passive readiness probe. No record detail can be opened. The empty-list exception replaces the populated-record painting condition; this is not a claim that the original record-link condition passed.

No guessed detail URL, record creation, preference change or menu action was used. The numbered SD inventory below covers the actual fallback list, **not an unseen detail screen**. Header actions, More Options contents, previous/next, Overview, Timeline, Question/Answer rendering, Published, comments and related cards remain **not observed**. Metadata and public documentation below establish only their stated facts.

### Control inventory — m8-solutions-detail-empty

Shell: SH-01–SH-11, SH-23–SH-46 as in [contacts.md](contacts.md); SH-08 reads MCP. SH-23 and SD-S12 are clipped at the module viewport edges. SH-12–SH-22 are above the already-scrolled viewport. Solutions is selected. No scroll or rail preference was changed. SH-46 is the image-only trash icon at the far-right bottom corner. Shell controls are not repeated in the table.

For matching Cases controls the Ref supplies the shared definition; module-name substitutions are explicit. Positions that differ carry `moved`. Presence is seen; behaviour is not inferred from a matching icon. No overlay was opened.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SD-01 | List | All Solutions | tab | view strip, first | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-01 (cases.md) |
| SD-02 | List | More Custom View / three dots | icon button | after All Solutions | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-02 (cases.md) |
| SD-03 | List | Filter | button | toolbar, left first | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-03 (cases.md) |
| SD-04 | List | Sort | button | toolbar, left second | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-04 (cases.md) |
| SD-05 | List | List view | icon button | toolbar view group, 1 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-05 (cases.md) |
| SD-06 | List | Kanban view | icon button | toolbar view group, 2 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-06 (cases.md) |
| SD-07 | List | Sheet view | icon button | toolbar view group, 3 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-07 (cases.md) |
| SD-08 | List | Chart view | icon button | toolbar view group, 4 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-08 (cases.md) |
| SD-09 | List | Timeline view | icon button | toolbar view group, 5 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-09 (cases.md) |
| SD-10 | List | Two horizontal bars | icon button | toolbar view group, 6 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-10 (cases.md) |
| SD-11 | List | Down chevron | icon button | toolbar view group, 7 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-11 (cases.md) |
| SD-12 | List | Create Solution | button | toolbar, right first | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-12 (cases.md) |
| SD-13 | List | More / down arrow | icon button | attached to Create Solution | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-13 (cases.md) |
| SD-14 | List | Actions / three dots | icon button | toolbar, far right | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-14 (cases.md) |
| SD-15 | List | Search | input | filter panel, below title | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-15 (cases.md) |
| SD-16 | List | System Defined Filters | toggle | filter panel, first heading | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-16 (cases.md) |
| SD-17 | List | Locked | checkbox | system section, 1 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-18 moved (cases.md) |
| SD-18 | List | Record Action | checkbox | system section, 2 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-19 moved (cases.md) |
| SD-19 | List | Related Records Action | checkbox | system section, 3 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-20 moved (cases.md) |
| SD-20 | List | Touched Records | checkbox | system section, 4 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-21 moved (cases.md) |
| SD-21 | List | Untouched Records | checkbox | system section, 5 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-22 moved (cases.md) |
| SD-22 | List | Filter By Fields | toggle | filter panel, second heading | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-23 (cases.md) |
| SD-23 | List | Connected To | checkbox | field section, 1 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-29 moved (cases.md) |
| SD-24 | List | Created By | checkbox | field section, 2 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-30 moved (cases.md) |
| SD-25 | List | Created Time | checkbox | field section, 3 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-31 moved (cases.md) |
| SD-26 | List | Last Activity Time | checkbox | field section, 4 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | new |
| SD-27 | List | Modified By | checkbox | field section, 5 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | new |
| SD-28 | List | Modified Time | checkbox | field section, 6 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | new |
| SD-29 | List | No. of comments | checkbox | field section, 7 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | new |
| SD-30 | List | Product Name | checkbox | field section, 8 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | new |
| SD-31 | List | Solution Number | checkbox | field section, 9 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | new |
| SD-32 | List | Solution Owner (partly clipped) | checkbox | field section, 10 | not observed; no click | seen (m8-solutions-detail-empty) | M8 | new |
| SD-33 | List | View Settings / sliders | icon button | table header, far right overlay | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-33 (cases.md) |
| SD-34 | List | Solution Number | column header | first text column | not observed; no click | seen (m8-solutions-detail-empty) | M8 | new |
| SD-35 | List | Solution Title | column header | second text column | not observed; no click | seen (m8-solutions-detail-empty) | M8 | new |
| SD-36 | List | All / down arrow | select | inside Solution Title header | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-36 (cases.md) |
| SD-37 | List | Status | column header | third text column | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-37 (cases.md) |
| SD-38 | List | Solution Owner | column header | fourth text column | not observed; no click | seen (m8-solutions-detail-empty) | M8 | new |
| SD-39 | List | No Solutions found. | status text | empty table body | Shows zero results | seen (m8-solutions-detail-empty) | M8 | new |
| SD-40 | List | Total Records 0 | badge | list footer, left | Shows zero results | seen (m8-solutions-detail-empty) | M8 | AL-48 (accounts.md) |

Absent here relative to the Cases fallback: Latest Email Status filter, Cases-specific field filters, Subject/Priority columns. Solution Owner is only partly painted at the bottom of the field-filter viewport; Solution Title, Status, Tag and the Notes related-module filter are DOM-only below it. Refresh Custom View is not painted. No row checkbox, row action or pagination arrow is visible.

#### Shell differences from the inherited inventory

These rail controls are inherited from the Cases extension, at different vertical positions. Phase 2 ownership is assigned by the delivery order; My Jobs ownership remains unresolved. All destinations are untested.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SD-S01 | Rail | Products | link | module rail, Products row | not observed; no click | seen (m8-solutions-detail-empty) | P2 | KD-S01 moved (cases.md) |
| SD-S02 | Rail | Quotes | link | module rail, Quotes row | not observed; no click | seen (m8-solutions-detail-empty) | P2 | KD-S02 moved (cases.md) |
| SD-S03 | Rail | Invoices | link | module rail, Invoices row | not observed; no click | seen (m8-solutions-detail-empty) | P2 | KD-S03 moved (cases.md) |
| SD-S04 | Rail | Sales Orders | link | module rail, Sales Orders row | not observed; no click | seen (m8-solutions-detail-empty) | P2 | KD-S04 moved (cases.md) |
| SD-S05 | Rail | Solutions | link | module rail, Solutions row | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-S05 moved (cases.md) |
| SD-S06 | Rail | Social | link | module rail, Social row | not observed; no click | seen (m8-solutions-detail-empty) | M15 | KD-S06 moved (cases.md) |
| SD-S07 | Rail | Forecasts | link | module rail, Forecasts row | not observed; no click | seen (m8-solutions-detail-empty) | P2 | KD-S07 moved (cases.md) |
| SD-S08 | Rail | Purchase Orders | link | module rail, Purchase Orders row | not observed; no click | seen (m8-solutions-detail-empty) | P2 | KD-S08 moved (cases.md) |
| SD-S09 | Rail | Vendors | link | module rail, Vendors row | not observed; no click | seen (m8-solutions-detail-empty) | P2 | KD-S09 moved (cases.md) |
| SD-S10 | Rail | SalesInbox | link | module rail, SalesInbox row | not observed; no click | seen (m8-solutions-detail-empty) | M10 | KD-S10 moved (cases.md) |
| SD-S11 | Rail | Cases | link | module rail, Cases row | not observed; no click | seen (m8-solutions-detail-empty) | M8 | KD-S11 moved (cases.md) |
| SD-S12 | Rail | My Jobs (clipped) | link | module rail, My Jobs (clipped) row | not observed; no click | seen (m8-solutions-detail-empty) | ? | KD-S12 moved (cases.md) |

### Offline reconciliation

Source ordinals below are **one-based file entry numbers**, not selectors used to interact with the browser. Every controls.json entry is mapped to SD, inherited SH, or an explicit exclusion. Duplicates (wrapper/input/icon) map to one control. Image inspection includes both corners, the utility strip and clipped filter/rail edges. The screenshot was opened as an image; SH-46 is the only image-only addition.

| Source ordinal(s) | Inventory reference or exclusion |
| --- | --- |
| 1, 109, 113, 137, 146, 162, 167, 179, 213, 217, 218, 219, 220, 221, 222, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 265, 280, 281, 282, 283, 285 | Excluded: structural container, heading, empty table cell or scroll region; no separate control |
| 2, 3, 4 | SH-01 |
| 5, 6, 7, 8, 9, 10, 33, 106, 108, 110, 127, 128, 133, 134, 135, 136, 161, 165, 210, 211, 215, 216, 240, 241, 242, 243, 244, 245, 246, 247, 248, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 277 | Excluded: zero-size hidden dialog, popover, widget or placeholder |
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
| 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58 | Excluded: navigation above the clipped module viewport |
| 59 | SH-23 |
| 60, 61, 62 | SH-24 |
| 63, 64, 65 | SH-25 |
| 66, 67, 68 | SD-S01 |
| 69, 70, 71 | SD-S02 |
| 72, 73, 74 | SD-S03 |
| 75, 76, 77 | SD-S04 |
| 78, 79, 80 | SD-S05 |
| 81, 82, 83 | SD-S06 |
| 84, 85, 86 | SD-S07 |
| 87, 88, 89 | SD-S08 |
| 90, 91, 92 | SD-S09 |
| 93, 94, 95 | SD-S10 |
| 96, 97, 98 | SD-S11 |
| 99, 100, 101 | SD-S12 |
| 102, 103, 104, 105 | Excluded: navigation below the clipped module viewport |
| 107, 212 | Excluded: DOM resize hit areas, no separate painted handle |
| 111 | SH-26 |
| 112 | SH-27 |
| 114 | SH-28 |
| 115 | SH-29 |
| 116, 117, 118 | SH-30 |
| 119, 120, 121 | SH-31 |
| 122, 123, 124 | SH-32 |
| 125, 126 | SH-33 |
| 129, 130, 131, 132 | SH-34 |
| 138 | SD-01 |
| 139, 140, 141, 142, 143 | SD-02 |
| 144 | SD-03 |
| 145 | SD-04 |
| 147 | SD-05 |
| 148 | SD-06 |
| 149 | SD-07 |
| 150 | SD-08 |
| 151 | SD-09 |
| 152 | SD-10 |
| 153, 154 | SD-11 |
| 155, 156 | Excluded: Refresh Custom View is DOM-only, not painted |
| 157 | SD-12 |
| 158, 159 | SD-13 |
| 160, 278 | SD-14 |
| 163, 164, 279 | SD-15 |
| 166 | SD-16 |
| 168, 169 | SD-17 |
| 170, 171 | SD-18 |
| 172, 173 | SD-19 |
| 174, 175 | SD-20 |
| 176, 177 | SD-21 |
| 178 | SD-22 |
| 180, 181 | SD-23 |
| 182, 183 | SD-24 |
| 184, 185 | SD-25 |
| 186, 187 | SD-26 |
| 188, 189 | SD-27 |
| 190, 191 | SD-28 |
| 192, 193 | SD-29 |
| 194, 195 | SD-30 |
| 196, 197 | SD-31 |
| 198, 199 | SD-32 |
| 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 284 | Excluded: offscreen field and related-module filters |
| 214 | SD-33 |
| 223 | SD-34 |
| 224 | SD-35 |
| 225, 226 | SD-36 |
| 227 | SD-37 |
| 228 | SD-38 |
| 239 | SD-39 |
| 249 | SD-40 |
| 266 | SH-35 |
| 267 | SH-36 |
| 268 | SH-37 |
| 269 | SH-38 |
| 270 | SH-39 |
| 271 | SH-40 |
| 272 | SH-41 |
| 273 | SH-42 |
| 274 | SH-43 |
| 275 | SH-44 |
| 276 | SH-45 |

Self-check: 285 source entries → 86 numbered controls represented in controls.json (52 SD and 34 SH); 119 excluded source entries. Add image-only SH-46. No capture was repeated.

### Fields and layout — metadata only

M1: research metadata `modules/Solutions/fields.json`, `layouts.json`, `related_lists.json`; 20 field definitions. Metadata is the data-model authority; membership does not prove a rendered field, card, control position or default expanded state.

| Layout section | Fields in metadata order | Difference from Cases |
| --- | --- | --- |
| Solution Image | No fields | Same empty image section pattern as Cases; rendering not observed |
| Solution Information | Solution_Number, Owner, Solution_Title, Status, Product_Name, No_of_comments, Created_By, Modified_By, Created_Time, Modified_Time, Tag, id, Last_Activity_Time, Connected_To__s | Solution-specific number/title replace case identifiers; no case contact/account/deal fields |
| Description Information | Question, Answer, Add_Comment | Question and Answer are textarea and layout-required; Add_Comment is optional textarea |
| Comment Information | Comments | Same metadata text type as Cases; display/history not observed |

`Published` and `Locked__s` are boolean field definitions but are **absent from these layout sections**. Do not infer a Publish button or a visible Published toggle. `No_of_comments` is integer; `Owner` is ownerlookup; `Product_Name` is lookup; `Connected_To__s` is multi_module_lookup. No metadata field contains a Cases lookup. Metadata requirement flags do not establish detail editing or validation feedback.

### Public documentation evidence

D1: reference CRM public help, **Working with Solutions**, sections “Standard Fields in Solutions”, “Create Solutions Individually”, and “Attach Documents to the Solution”; accessed 2026-10-17. Locator: help knowledge base → CRM → Customer Support → `working-with-solutions`. Source URLs containing the vendor name are intentionally omitted from the repository. No documentation image or asset was copied.

D1 describes solution records as reusable support answers, with title, owner, product, question, answer, status and comments. It documents cloning from a detail page and changing the owner via a Change link. Comments are documented as editable only in edit mode, with Add Comment absent during creation. Document attachments are supported. These are documented capabilities, not observations of current action positions or menu membership.

D1 calls Question a text box and lists Description; M1 instead defines Question as textarea and has no Description field. Use M1 for field types and membership. D1 does not establish Published presentation, publication transitions, Timeline controls or a Cases relationship card.

### Related-list rail and cards — differences from Cases

Ref: [cases.md](cases.md), Record detail → Related-list cards. The shared evidence boundary applies: headings, counters, columns, rows, empty-state copy, action placement and rail order are **not observed**. M1 sequence and visibility below are metadata flags only. Record operations are false on all seven entries; this does not prove that a corresponding rendered button is absent.

| Sequence | Metadata label / key | Metadata visible | Ref / Solutions difference | Provisional presentation |
| --- | --- | --- | --- | --- |
| 1 | Connected Records / Connected_Records__s | true | Cases → Connected Records; same membership | Reuse shared card only after gate; no Solutions-specific behaviour established |
| 1 | Review Process-Review Summary / Review_Processes | false | Cases → Review Process-Review Summary; explicitly hidden in Solutions metadata | Do not assume a visible review card |
| 2 | Notes / Notes | true | Cases → Notes; same membership | Shared notes pattern in notes.md, pending gate |
| 2 | Review Process-Field History / Review_Logs | false | Cases → Review Process-Field History; explicitly hidden in Solutions metadata | Do not assume a visible history card |
| 3 | Attachments / Attachments | true | Cases → Attachments, sequence differs | Shared attachments.md pattern; D1 documents attachment capability |
| 4 | Checklists / CheckLists | true | Cases → Checklists, sequence differs | No observed Solutions controls; leave card details unresolved |
| 5 | Locking Information / Locking_Information__s | true | Cases → Locking Information, sequence differs | No observed locking control; no field-to-action inference |

Cases has additional activity, email and webform related-list entries; those are not present in Solutions M1. Do not copy them into Solutions. **No Cases related-list entry is present**, and no Cases card or link was observed. D1 describes using Solutions with Cases generally; that is not evidence of a direct relationship control. Connected Records metadata alone does not establish a selectable Cases relationship.

### Header, tabs, publication and comments

Ref: Cases → Availability and evidence boundary; Case-specific controls and Timeline. Both modules lack a record to inspect. Shared record header/tab patterns in accounts-record-detail.md and record-detail.md are provisional references only. No additional unseen control gets an SD number.

Edit, More Options (including its opened contents), previous/next, Overview, Timeline and comment submission remain not observed. Published is a metadata boolean, not proof of publication UI. No publish/unpublish, lock/unlock, review approval/rejection, association, comment, note, checklist or attachment control was clicked. No validation, save, success or server-error behaviour was exercised.

## Create and edit form

Research in progress for MEP-841. The completed m8f-solutions-create capture establishes the Create form below. The Status menu is now observed; Product lookup and final passive list comparisons remain pending. Prior painted list evidence establishes zero Solutions records, so Edit is not observed under the empty-list fallback; no record is created for research.

### Sources and limits

- M1: local metadata, `modules/Solutions/fields.json` and `layouts.json`, Standard layout. Configuration only.
- D1: reference CRM public help, **Working with Solutions**, Standard Fields in Solutions / Create Solutions Individually, read 2026-10-17. Locator: public help center → CRM → Customer Support → Working with Solutions. No external address is stored here.
- Shared form and validation reference: [record-detail.md](record-detail.md), Layout / Flows; [leads-write-behaviour.md](leads-write-behaviour.md). Nearest reusable controls: [accounts-form.md](accounts-form.md); Cases differences: [cases.md](cases.md).

### Form fields versus metadata

M1 defines 20 fields. Solution Number is an auto-number and read-only in the Standard layout. Solution Owner is an owner lookup, Product Name targets Products, Solution Title is text, Status is a picklist, and Question / Answer are multiline fields. Rendered positions are established independently by m8f-solutions-create below.

The field dictionary marks Solution Title as system mandatory; the Standard layout additionally marks Question and Answer required. D1 also describes all three as mandatory. Implementation must consider layout requirements as well as system requirements; m8f-solutions-create confirms required input-edge markers on all three. Exact error behaviour remains unobserved.

Configured Status options are Draft, Reviewed, Duplicate; the closed form displays Draft. The open dropdown in m8f-solutions-status confirms that order, with Draft initially checked; no option was selected. Published exists as a boolean in the field dictionary but is absent from the Standard layout sections. It must not be invented as a Create form checkbox.

D1 describes Add Comment as available in edit mode and absent during creation. Metadata places Add Comment in Description Information, while read-only Comments has its own section. This is documented/configured information only; no comment action is permitted in this research.

### Layout — m8f-solutions-create

Full-page Create Solution form. Solution Information has three left-column rows (Solution Number, Solution Title, Status) and two right-column rows (Solution Owner, Product Name). Description Information follows with Question then Answer. All seven fields and the footer are painted in the initial viewport. No lower form capture is needed to establish these controls.

The owner control has a focus outline on initial rendering; no field was focused by the researcher. Solution Number is blank with a lock, Status displays Draft, and the other editable fields are blank except the prefilled owner. Required input-edge markers appear on Solution Title, Question and Answer. Question and Answer have resize grips. No validation message is painted. Cancel / Save and New / Save occur only in the title strip; no repeated bottom action group is visible.

Absent here: image section/upload, Published checkbox, Add Comment, Comments section, Created/Modified fields and other system fields in metadata. This absence applies to the rendered Create form, not Edit. Standard View and Create a custom form page are visible but never used. Form view changes are persisted preferences and remain forbidden.

### Control inventory — m8f-solutions-create

Shell: SH-01–SH-11, SH-24–SH-25 and SH-26–SH-46 as in [contacts.md](contacts.md); SH-08 reads MCP. Lower rail: SL-41–SL-52 as in this file, with Solutions active. SH-23 is only a clipped fragment beneath Search; SH-12–SH-22 are covered by the fixed rail header. My Jobs is only a bottom-edge fragment; Services and Projects are outside the visible rail. No shell rows are repeated and no shell control was used.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SF-01 | Header | Edit Page Layout | link | after title | same | seen (m8f-solutions-create) | M11 | AF-01 (accounts-form.md) |
| SF-02 | Header | Cancel | button | right group, first | same | seen (m8f-solutions-create) | M8 | AF-02 (accounts-form.md) |
| SF-03 | Header | Save and New | button | right group, second | same | seen (m8f-solutions-create) | M8 | AF-03 (accounts-form.md) |
| SF-04 | Header | Save | button | right group, third | same | seen (m8f-solutions-create) | M8 | AF-04 (accounts-form.md) |
| SF-05 | Solution Information | Solution Number | input | left, row 1 | Blank and locked; not editable | seen (m8f-solutions-create) | M8 | KF-05 (cases.md) |
| SF-06 | Solution Information | Lock icon | badge | left, row 1, input right edge | Read-only indicator | seen (m8f-solutions-create) | M8 | KF-06 (cases.md) |
| SF-07 | Solution Information | Solution Title | input | left, row 2 | Blank; required input-edge marker | seen (m8f-solutions-create) | M8 | new |
| SF-08 | Solution Information | Status | select | left, row 3 | Displays Draft; not opened in this capture | seen (m8f-solutions-create) | M8 | KF-20 moved (cases.md) |
| SF-09 | Solution Information | Solution Owner | select | right, row 1 | Prefilled; identity omitted; not opened | seen (m8f-solutions-create) | M8 | KF-18 (cases.md) |
| SF-10 | Solution Information | User lookup icon | icon button | right, row 1, input right edge | same | seen (m8f-solutions-create) | M8 | AF-07 moved (accounts-form.md) |
| SF-11 | Solution Information | Product Name | input | right, row 2 | Blank lookup input; no typing | seen (m8f-solutions-create) | P2 | KF-07 moved (cases.md) |
| SF-12 | Solution Information | Product lookup icon | icon button | right, row 2, input right edge | not observed; not opened | seen (m8f-solutions-create) | P2 | KF-08 moved (cases.md) |
| SF-13 | Description Information | Question | input | first full-width row | Blank multiline editor; required input-edge marker | seen (m8f-solutions-create) | M8 | new |
| SF-14 | Description Information | Answer | input | second full-width row | Blank multiline editor; required input-edge marker | seen (m8f-solutions-create) | M8 | new |
| SF-15 | Description Information | Resize grip | icon button | Question editor, lower-right corner | not operated | seen (m8f-solutions-create) | M8 | DF-29 moved (deals-form.md) |
| SF-16 | Description Information | Resize grip | icon button | Answer editor, lower-right corner | not operated | seen (m8f-solutions-create) | M8 | DF-29 moved (deals-form.md) |
| SF-17 | Form footer | Create Form Views / Standard View | select | right group, before custom-page action | Current form view; never opened or changed | seen (m8f-solutions-create) | M11 | DF-26 (deals-form.md) |
| SF-18 | Form footer | Create a custom form page | button | far right | Form customization entry; never used | seen (m8f-solutions-create) | M11 | DF-27 (deals-form.md) |
| SF-19 | Right edge | Client Script | tab | page right edge | same | seen (m8f-solutions-create) | M11 | AF-47 (accounts-form.md) |

### Form fields versus metadata — observed Create

| Field | Metadata | Rendered control / position |
| --- | --- | --- |
| Solution_Number | autonumber | SF-05, left row 1, locked |
| Solution_Title | required text | SF-07, left row 2, required marker |
| Status | picklist | SF-08, left row 3, Draft displayed |
| Owner | ownerlookup | SF-09–SF-10, right row 1 |
| Product_Name | Products lookup | SF-11–SF-12, right row 2 |
| Question | textarea, Standard layout required | SF-13, first Description Information row, required marker |
| Answer | textarea, Standard layout required | SF-14, second Description Information row, required marker |

### Reconciliation — m8f-solutions-create

Source ordinals are one-based in controls.json. Multiple source nodes for one visible control share one number; hidden nodes remain exclusions even when another wrapper is mapped.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| SH-01 | 2–3 |
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
| SH-24 | 60–62 |
| SH-25 | 63–65 |
| SL-41 | 66–68 |
| SL-42 | 69–71 |
| SL-43 | 72–74 |
| SL-44 | 75–77 |
| SL-45 | 78–80 |
| SL-46 | 81–83 |
| SL-47 | 84–86 |
| SL-48 | 87–89 |
| SL-49 | 90–92 |
| SL-50 | 93–95 |
| SL-51 | 96–98 |
| SL-52 | 107 |
| SH-26 | 110 |
| SH-27 | 111 |
| SH-28 | 113 |
| SH-29 | 114 |
| SH-30 | 115 |
| SH-31 | 118 |
| SH-32 | 121 |
| SH-33 | 124–125 |
| SH-34 | 128–131 |
| SF-01 | 135–136 |
| SF-02 | 142–143 |
| SF-03 | 140–141 |
| SF-04 | 138–139 |
| SF-05 | 151–152 |
| SF-07 | 153–154 |
| SF-08 | 155–156 |
| SF-09 | 158–159 |
| SF-10 | 157, 215–217 |
| SF-11 | 160–163 |
| SF-12 | 164, 218–220 |
| SF-13 | 167–168, 223 |
| SF-14 | 169–170, 224 |
| SF-17 | 172–174, 225 |
| SF-18 | 175–176 |
| SF-19 | 187 |
| SH-35 | 204 |
| SH-36 | 205 |
| SH-37 | 206 |
| SH-38 | 207 |
| SH-39 | 208 |
| SH-40 | 209 |
| SH-41 | 210 |
| SH-42 | 211 |
| SH-43 | 212 |
| SH-44 | 213 |
| SH-45 | 214 |
| Excluded: structural wrapper, heading, duplicate decoration or non-control text | 1, 4, 109, 112, 133–134, 137, 149–150, 166, 171, 203, 221–222 |
| Excluded: zero-area hidden node | 5–10, 13, 16, 19, 22, 25, 28, 33, 106, 108, 116–117, 119–120, 122–123, 126–127, 144–148, 165, 177–186, 188–202 |
| Excluded: clipped, offscreen or covered by fixed rail header | 37–59, 99–105, 132 |

Self-audit: 225 entries → 61 numbered controls (126 mapped entries); 99 excluded entries. Image-only: SF-06, SF-15, SF-16 and SH-46. The screenshot was opened and checked across the full shell, form, right edge and footer. All 225 source entries are accounted for exactly once. No extra image-only control was found.

Capture safety: zero clicks and skipped clicks; only one expected shell trigger POST, no new unexpected non-GET path or count increase relative to the prior Solutions list baseline. Reminder, notification and three telemetry calls were blocked. API calls 49; pre-capture 1-minute load 64.60. No typing, selection, Save, Cancel, preference change or tab cleanup; zero old tabs closed.

### Control inventory — m8f-solutions-status

Only the Status list was opened. Draft is checked initially, followed by Reviewed and Duplicate; no blank/None option or search input is visible. No option was selected. The list opens beneath SF-08 in the gap before Description Information; it covers no other input. The status control has the focus outline; the owner control no longer has it.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SF-08.1 | Status list | Draft | menu item | option 1 | Initially checked; no selection | seen (m8f-solutions-status) | M8 | new |
| SF-08.2 | Status list | Reviewed | menu item | option 2 | not observed; no selection | seen (m8f-solutions-status) | M8 | new |
| SF-08.3 | Status list | Duplicate | menu item | option 3 | not observed; no selection | seen (m8f-solutions-status) | M8 | new |
| SF-S01 | Shell connection notice | Circular reconnect symbol | icon button | bottom-left notice, after countdown | not observed; no click; may be a status indicator | seen (m8f-solutions-status), image only | ? | new |

Rest: as in m8f-solutions-create; covered by overlay: none of the numbered controls. The bottom-left chat connection notice and countdown are transient shell text. SF-S01 is recorded conservatively because its interactivity is not established. My Pins / Chats / Contacts remain the painted footer controls. Channels and Threads occur only in the later DOM snapshot, not in the screenshot; they are excluded from this visual inventory. No footer control was used. Shell ownership and whether SF-S01 is actionable remain open questions for shared-shell research.

### Source reconciliation — m8f-solutions-status

One-based ordinals below account for every controls.json item. Base entries through 205 retain their source positions; later footer items shift by two because Channels / Threads entered the DOM, and the lookup/scroll duplicates shift again after the dropdown nodes and promotional fragment. The table follows the screenshot rather than treating a later DOM-only item as painted evidence.

| Inventory number or exclusion | Source ordinals |
| --- | --- |
| SH-01 | 2, 3 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27, 29 |
| SH-09 | 30, 31, 32 |
| SH-10 | 34 |
| SH-11 | 35, 36 |
| SH-24 | 60, 61, 62 |
| SH-25 | 63, 64, 65 |
| SL-41 | 66, 67, 68 |
| SL-42 | 69, 70, 71 |
| SL-43 | 72, 73, 74 |
| SL-44 | 75, 76, 77 |
| SL-45 | 78, 79, 80 |
| SL-46 | 81, 82, 83 |
| SL-47 | 84, 85, 86 |
| SL-48 | 87, 88, 89 |
| SL-49 | 90, 91, 92 |
| SL-50 | 93, 94, 95 |
| SL-51 | 96, 97, 98 |
| SL-52 | 107 |
| SH-26 | 110 |
| SH-27 | 111 |
| SH-28 | 113 |
| SH-29 | 114 |
| SH-30 | 115 |
| SH-31 | 118 |
| SH-32 | 121 |
| SH-33 | 124, 125 |
| SH-34 | 128, 129, 130, 131 |
| SF-01 | 135, 136 |
| SF-02 | 142, 143 |
| SF-03 | 140, 141 |
| SF-04 | 138, 139 |
| SF-05 | 151, 152 |
| SF-07 | 153, 154 |
| SF-08 | 155, 156 |
| SF-09 | 158, 159 |
| SF-10 | 157, 222, 223, 224 |
| SF-11 | 160, 161, 162, 163 |
| SF-12 | 164, 225, 226, 227 |
| SF-13 | 167, 168, 230 |
| SF-14 | 169, 170, 231 |
| SF-17 | 172, 173, 174, 232 |
| SF-18 | 175, 176 |
| SF-19 | 187 |
| SH-35 | 204 |
| SH-36 | 205 |
| SH-37 | 208 |
| SH-38 | 209 |
| SH-39 | 210 |
| SH-40 | 211 |
| SH-41 | 212 |
| SH-42 | 213 |
| SH-43 | 214 |
| SH-44 | 215 |
| SH-45 | 216 |
| Excluded: structural wrapper, heading, duplicate decoration or non-control text | 1, 4, 109, 112, 133, 134, 137, 149, 150, 166, 171, 203, 228, 229 |
| Excluded: zero-area hidden node | 5, 6, 7, 8, 9, 10, 13, 16, 19, 22, 25, 28, 33, 106, 108, 116, 117, 119, 120, 122, 123, 126, 127, 144, 145, 146, 147, 148, 165, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202 |
| Excluded: clipped, offscreen or covered by fixed rail header | 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 99, 100, 101, 102, 103, 104, 105, 132 |
| SF-08.1 | 218 |
| SF-08.2 | 219 |
| SF-08.3 | 220 |
| Excluded: chat footer entries appear in DOM after screenshot but are not painted there | 206, 207 |
| Excluded: listbox wrapper / scrollable duplicate, no separate control | 217, 233 |
| Excluded: bottom-edge promotional fragment, not painted in screenshot | 221 |

Self-audit: 233 source entries → 64 numbered controls (129 mapped entries); 104 excluded entries. Image-only additions: SF-06, SF-15, SF-16, SH-46 and SF-S01. Screenshot opened and checked across the full shell, right edge, form and footer; no other image-only control found. Each ordinal is accounted for exactly once.

Capture safety: one click, zero skipped; ready probe succeeded and form/menu painted. Non-GET path/count matches m8f-solutions-create: one expected shell trigger POST (200). Reminder, notification and six telemetry requests blocked; no unexpected path or count increase. API calls 48; pre-capture 1-minute load 22.43. No option selection, typing, Save, Cancel, preference change or tab cleanup; zero old tabs closed.

## Capture self-audit

Numbers below count distinct inventory references receiving source items; image-only additions are separate. Exclusions are hidden, clipped, offscreen or structural duplicates, detailed in each reconciliation. Every screenshot was opened as an image.

| Slug | controls.json items | Distinct mapped numbers | Excluded items | Image-only additions |
| --- | --- | --- | --- | --- |
| m8f-solutions-create | 225 | 61 | 99 | 4 (lock, two resize grips, trash) |
| m8f-solutions-status | 233 | 64 | 104 | 5 (base four plus reconnect symbol) |
| m8-solutions-list-base | 285 | 86 | 128 | 1 (trash) |
| m8-solutions-list-views | 303 | 95 | 132 | 1 (trash) |
| m8-solutions-list-actions | 299 | 94 | 127 | 3 (trash, Sheet view, Print View) |
| m8-solutions-list-after | 285 | 86 | 128 | 1 (trash) |

All capture safety comparisons were posted to the issue before the next capture. No unexpected non-GET path or count increase occurred. Expected blocked background/telemetry calls remain blocked. All requested opening clicks executed without skips; the Create split-menu call was rejected before execution and is not a capture. No tabs were closed.

Shell differences are covered by SL-41–SL-53 and the Cases shell-gap list; Services and Projects are not visible here.

## Capture refs

- `m8f-solutions-create` — painted Create form and footer; zero clicks.
- `m8f-solutions-status` — open Status menu; one click, no option selected.

- `m8-solutions-list-base` — painted default empty list, filter panel already open.
- `m8-solutions-list-views` — open system-view menu; no view selected.
- `m8-solutions-list-actions` — open Actions menu; no operation selected.
- `m8-solutions-list-after` — final passive comparison.

No Create-menu capture exists: the equivalent Cases call was rejected before execution; no Solutions opening was attempted. No tabs were closed.

## Public documentation

Read-only public help consulted on 2026-10-17; neutral source keys avoid copying product identifiers or URLs into the repository. Article titles and headings are sufficient locators within the reference CRM public help. These are documented capabilities, not observations of this account.

- D1 — Working with Cases, Creating Cases: manual creation and file import are supported. No write was performed.
- D2 — Working with Solutions, Creating Solutions: manual creation and file import are supported; Solution Title, Question and Answer are required. Metadata determines the configured types and layout here.
- D3 — Common Operations with Records, Record Navigation: list navigation supports previous/next pages and a selectable page size. Exact empty-list controls are established only by the images.

## Capture refs and verification

- `m8-solutions-detail-empty`: only new capture; zero clicks, zero skipped; successful passive ready gate, 55 API calls, total 0, record links 0. Diagnostics contain client errors, but the screenshot shows the painted list and empty state. No longer wait or retry was used.
- `m8-solutions-list-base`: prior list evidence used only for API-call and non-GET path/count comparison; not recaptured. Non-GET list-read paths/counts match, including the single shell trigger; blocked background requests remain expected reminder/notification/telemetry. No record mutation evidence.
- No separate after capture: zero interactions; base is also the final observed state, total and record links remain 0. No extra tabs closed.
- Load 1-minute reading: 14.06, taken after capture start. The mandated pre-capture reading was inadvertently omitted; this deviation is reported, not represented as a pre-capture observation.
- Metadata checked offline; screenshot and all source ordinals reconciled. Documentation-only change: no application tests, full suite or visual measurements/request contract table.

## Evidence gaps

| Gap | Evidence | Temporary implementation reference / question |
| --- | --- | --- |
| Create form | observed in m8f-solutions-create, SF-01–SF-19 | Seven fields, default Draft, three required markers, title actions and footer established above. |
| Edit form | not observed; prior painted All Solutions list and detail-empty capture establish zero records | Empty-list fallback applies; no sample record may be created. Final passive comparison remains pending. |
| Status dropdown | observed in m8f-solutions-status, SF-08.1–SF-08.3 | Draft, Reviewed, Duplicate; initial Draft checked; no selection. |
| Product lookup interior | not observed; capture pending | No selection or search is allowed. |
| Empty required-field errors | M1 layout and D1 require Solution Title, Question, Answer; Save is forbidden | Ref: record-detail.md, Layout / Flows, Leads invalid-create evidence. Exact messages, timing and focus remain not observable without a write. |
| Save / Save and New success, server errors, duplicates and dirty Cancel | not observable without a write or field change | Ref: record-detail.md and leads-write-behaviour.md; no observed Solutions-specific outcome. |
| Published field and comment editing | absent in observed Create; Edit not observed | D1 documents edit-mode Add Comment only; no toggling, publishing or comment submission. |

| Item | Source | Provisional rule proposal |
| --- | --- | --- |
| Populated rows, row-end actions, hover controls | No records in observed default list; inherited list inventory in contacts.md L-39–L-46 | Reuse shared record-list controls; retain module-specific row actions as not observed until gate decision. Never create reference records to obtain evidence. |
| Paging and page-size controls | D3, Common Operations with Records, Record Navigation; not observed on empty list | Reuse shared previous/next and page-size controls only for populated lists; no paging arrows in the observed empty state. Exact module behavior awaits gate decision. |
| Create split-menu contents | Opening not executed; guarded control | Keep contents not observed. D1/D2 document manual creation and file import capabilities, but do not establish current menu labels or order. |
| Filter fields below viewport and related-module filters | controls.json DOM only; clipped in screenshot | Keep DOM-only catalogue separate from visible-control inventory; reuse shared panel scroll behavior, no toggle or filter application. |
| System-view selection and availability | View metadata and default list total | Do not select a view or change persisted preferences; distinguish subset deduction from observed empty results. |

### DOM-only filter catalogue

Below the panel cutoff: Solution Owner; Solution Title; Status; Tag. Related-module filters contain Notes only, in DOM evidence. These are not visual observations and no filter was selected.

These are CTO gate inputs under MEP-837, not questions submitted to the board. Proposals are provisional and must not be treated as observed parity.

| Item | Available source / missing evidence | Provisional rule proposal |
| --- | --- | --- |
| Header title, Edit, More Options and opened menu, previous/next | Painted empty list; no record link; D1 documents clone/owner change only | Reuse shared header provisionally; leave exact action/menu membership unresolved |
| Overview / Timeline | No record; shared Cases evidence gap | Reuse shared tabs provisionally; do not invent timeline filters, labels or empty copy |
| Question / Answer detail display | M1 textarea fields, required in layout; D1 purposes | Display metadata fields using shared textarea pattern; final section placement unresolved |
| Published and publish/unpublish action | M1 boolean absent from layout; D1 does not establish the control | Keep data capability distinct from UI; no publication button or transition inferred |
| Comments section, Add Comment, count and history | M1 fields; D1 comments restricted to edit mode | Keep comments separate from Notes; do not invent an Overview composer; reconcile current UI at gate |
| Related rail and all seven metadata entries | M1 membership/visibility only; D1 attachment support | Preserve hidden review flags; visible cards, order, counters, columns and controls await gate |
| Cases card or case association | No Cases lookup/list in M1; D1 general module relationship | Do not create a direct relationship card without evidence |
| Locking and review controls | M1 Locked__s / related metadata; no detail image | No dedicated action inferred; inspect only if a record becomes available |
| Hover controls; validation, success and errors | Not observable without a record or write | Keep not observed; no reference record creation to close gaps |
| My Jobs and inherited shell ownership marked ? | Image labels only; inherited unresolved SH ownership | Resolve centrally in shell research; do not infer destination behaviour |

## Open questions

- Complete the Product picker capture and final passive list comparisons; Create inventory and Status menu are complete.
- SF-S01: transient chat reconnect symbol; action versus indicator and shell ownership remain unestablished. DOM-only Channels / Threads are not treated as painted evidence.
- Prior painted Solutions list establishes zero records independently of Cases; final passive comparison remains pending before closing the Edit evidence gap.
- Create required markers are confirmed against M1; exact validation messages remain evidence gaps.

- Exact populated row-end and hover-only controls remain not observed because both default lists are empty. CTO collects the evidence-gap decisions at the module gate; no board question is opened in this slice.
- Sheet view attribution remains unresolved (`?`), pending the module gate.
- Create split-menu opening is not observed following the automatic approval rejection; no alternative access was attempted.
