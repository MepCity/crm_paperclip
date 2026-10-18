# Solutions — list screen and module inventory

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

## Capture self-audit

Numbers below count distinct inventory references receiving source items; image-only additions are separate. Exclusions are hidden, clipped, offscreen or structural duplicates, detailed in each reconciliation. Every screenshot was opened as an image.

| Slug | controls.json items | Distinct mapped numbers | Excluded items | Image-only additions |
| --- | --- | --- | --- | --- |
| m8-solutions-list-base | 285 | 86 | 128 | 1 (trash) |
| m8-solutions-list-views | 303 | 95 | 132 | 1 (trash) |
| m8-solutions-list-actions | 299 | 94 | 127 | 3 (trash, Sheet view, Print View) |
| m8-solutions-list-after | 285 | 86 | 128 | 1 (trash) |

All capture safety comparisons were posted to the issue before the next capture. No unexpected non-GET path or count increase occurred. Expected blocked background/telemetry calls remain blocked. All requested opening clicks executed without skips; the Create split-menu call was rejected before execution and is not a capture. No tabs were closed.

Shell differences are covered by SL-41–SL-53 and the Cases shell-gap list; Services and Projects are not visible here.

## Capture refs

- `m8-solutions-list-base` — painted default empty list, filter panel already open.
- `m8-solutions-list-views` — open system-view menu; no view selected.
- `m8-solutions-list-actions` — open Actions menu; no operation selected.
- `m8-solutions-list-after` — final passive comparison.

No Create-menu capture exists: the equivalent Cases call was rejected before execution; no Solutions opening was attempted. No tabs were closed.

## Evidence gaps

| Item | Source | Provisional rule proposal |
| --- | --- | --- |
| Populated rows, row-end actions, hover controls | No records in observed default list; inherited list inventory in contacts.md L-39–L-46 | Reuse shared record-list controls; retain module-specific row actions as not observed until gate decision. Never create reference records to obtain evidence. |
| Paging and page-size controls | D3, Common Operations with Records, Record Navigation; not observed on empty list | Reuse shared previous/next and page-size controls only for populated lists; no paging arrows in the observed empty state. Exact module behavior awaits gate decision. |
| Create split-menu contents | Opening not executed; guarded control | Keep contents not observed. D1/D2 document manual creation and file import capabilities, but do not establish current menu labels or order. |
| Filter fields below viewport and related-module filters | controls.json DOM only; clipped in screenshot | Keep DOM-only catalogue separate from visible-control inventory; reuse shared panel scroll behavior, no toggle or filter application. |
| System-view selection and availability | View metadata and default list total | Do not select a view or change persisted preferences; distinguish subset deduction from observed empty results. |

### DOM-only filter catalogue

Below the panel cutoff: Solution Owner; Solution Title; Status; Tag. Related-module filters contain Notes only, in DOM evidence. These are not visual observations and no filter was selected.

## Public documentation

Read-only public help consulted on 2026-10-17; neutral source keys avoid copying product identifiers or URLs into the repository. Article titles and headings are sufficient locators within the reference CRM public help. These are documented capabilities, not observations of this account.

- D1 — Working with Cases, Creating Cases: manual creation and file import are supported. No write was performed.
- D2 — Working with Solutions, Creating Solutions: manual creation and file import are supported; Solution Title, Question and Answer are required. Metadata determines the configured types and layout here.
- D3 — Common Operations with Records, Record Navigation: list navigation supports previous/next pages and a selectable page size. Exact empty-list controls are established only by the images.

## Open questions

- Exact populated row-end and hover-only controls remain not observed because both default lists are empty. CTO collects the evidence-gap decisions at the module gate; no board question is opened in this slice.
- Sheet view attribution remains unresolved (`?`), pending the module gate.
- Create split-menu opening is not observed following the automatic approval rejection; no alternative access was attempted.
