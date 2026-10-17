# Campaigns — list screen and module inventory

Status: research for MEP-754 / Module 7; empty-state painting gate accepted by the CTO in MEP-803. Menu evidence is recorded below for UI Lead review.

## Purpose

Describe the Campaigns list and exported module configuration. Record detail, forms and links from other modules belong to separate research slices. Module 2+ inventory rules apply: no visual measurements or request contract table.

## Fields and layout

Source: research workspace metadata, `modules/Campaigns/fields.json` and `layouts.json`. This section is metadata, not a claim that every field was visible on the list. Required columns distinguish system mandatory from the Standard layout requirement.

| API name | Label | Type | System mandatory | Layout required |
| --- | --- | --- | --- | --- |
| `Owner` | Campaign Owner | ownerlookup | no | no |
| `Type` | Type | picklist | no | yes |
| `Campaign_Name` | Campaign Name | text | yes | yes |
| `Status` | Status | picklist | no | no |
| `Start_Date` | Start Date | date | no | no |
| `End_Date` | End Date | date | no | no |
| `Expected_Revenue` | Expected Revenue | currency | no | no |
| `Budgeted_Cost` | Budgeted Cost | currency | no | no |
| `Actual_Cost` | Actual Cost | currency | no | no |
| `Expected_Response` | Expected Response | bigint | no | no |
| `Num_sent` | Numbers sent | bigint | no | no |
| `Created_By` | Created By | ownerlookup | no | no |
| `Modified_By` | Modified By | ownerlookup | no | no |
| `Created_Time` | Created Time | datetime | no | no |
| `Modified_Time` | Modified Time | datetime | no | no |
| `Description` | Description | textarea | no | no |
| `Tag` | Tag | text | no | no |
| `Parent_Campaign` | Parent Campaign | lookup | no | no |
| `id` | Record Id | bigint | no | no |
| `Last_Activity_Time` | Last Activity Time | datetime | no | no |
| `Connected_To__s` | Connected To | multi_module_lookup | no | no |

Type is required by the Standard layout despite `system_mandatory: false`; Campaign Name is required by both. Actual form rendering is reserved for the form slice.

- `Type` options, metadata order: -None-; Conference; Webinar; Trade Show; Public Relations; Partners; Referral Program; Advertisement; Banner Ads; Direct mail; Email; Telemarketing; Others.
- `Status` options, metadata order: -None-; Planning; Active; Inactive; Complete.

Standard layout sections, metadata order:

- **Campaign Information** (2 columns): `Owner`, `Type`, `Campaign_Name`, `Status`, `Start_Date`, `End_Date`, `Expected_Revenue`, `Budgeted_Cost`, `Actual_Cost`, `Expected_Response`, `Num_sent`, `Created_By`, `Modified_By`, `Created_Time`, `Modified_Time`, `Tag`, `Parent_Campaign`, `id`, `Last_Activity_Time`, `Connected_To__s`.
- **Description Information** (1 columns): `Description`.

Related lists, ordered by metadata `sequence_number` (gaps are retained; this is not a detail-screen observation):

| Sequence | Label | API name |
| --- | --- | --- |
| -1 | Locking Information | `Locking_Information__s` |
| 1 | Connected Records | `Connected_Records__s` |
| 2 | Notes | `Notes` |
| 3 | Child Campaigns | `Child_Campaigns` |
| 6 | Open Calls | `Calls` |
| 7 | Open Meetings | `Events` |
| 8 | Open Tasks | `Tasks` |
| 9 | Attachments | `Attachments` |
| 10 | Closed Tasks | `Tasks_History` |
| 11 | Closed Meetings | `Events_History` |
| 12 | Closed Calls | `Calls_History` |
| 15 | Leads | `Leads` |
| 16 | Deals | `Deals` |
| 17 | Contacts | `Contacts` |
| 18 | Checklists | `CheckLists` |

## Views

Source: `custom_views.json` and the four per-view metadata files. All four are public, system-defined views; All Campaigns is the metadata default. Sort field and direction are null for every view, so no runtime default sort is inferred. All have wrap text enabled and no pinned fields.

| View | Criteria | Columns in metadata order |
| --- | --- | --- |
| All Active Campaigns | Status equals Active | Campaign_Name, Type, Status, Start_Date, End_Date, Owner |
| All Campaigns | None | Campaign_Name, Type, Status, Start_Date, End_Date, Owner |
| My Active Campaigns | Owner equals current user AND Status equals Active | Campaign_Name, Type, Status, Start_Date, End_Date |
| Unread Campaigns | Common_Status does not contain `v` | Campaign_Name, Type, Status, Start_Date, End_Date, Owner |

`Common_Status` is a system criterion in view metadata, absent from the 21-field dictionary. Do not invent an editable field for it.

## List screen

The default All Campaigns view is empty. The filter panel is already open; no panel preference was changed. The image shows four column headers, with the first truncated; two additional headers exist offscreen in controls.json and metadata, not in the image. No populated row, selection checkbox, row-end action or pagination arrow is painted. The footer shows Total Records 0.

### Control inventory — m7-list-base

Shell: SH-01–SH-46 as in [contacts.md](contacts.md); SH-18 is active. SH-08 is labelled MCP here. The image-only trash icon SH-46 is present. No new shell control was found relative to Contacts, including the bottom utility strip and upper-right shortcuts.

`seen` establishes presence only. The base capture contains no clicks; later menu-opening observations are recorded separately. Other behaviour is `not observed`, including inherited controls. The Ref column points to the closest existing inventory; module-name equivalents are identified by the Campaigns label.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CL-01 | View strip | All Campaigns | tab | left, first | not observed | seen (m7-list-base) | M7 | AL-01 (accounts.md) |
| CL-02 | View strip | Three dots / More Custom View | icon button | after current view | Opens the system-view menu (m7-list-views) | seen (m7-list-base) | M7 | AL-02 (accounts.md) |
| CL-03 | Toolbar | Filter | button | left, first | not observed | seen (m7-list-base) | M7 | AL-03 (accounts.md) |
| CL-04 | Toolbar | Sort | button | left, second | not observed | seen (m7-list-base) | M7 | AL-04 (accounts.md) |
| CL-05 | Toolbar | List view icon | icon button | view group, item 1 | not observed | seen (m7-list-base) | M7 | AL-05 (accounts.md) |
| CL-06 | Toolbar | Kanban view icon | icon button | view group, item 2 | not observed | seen (m7-list-base) | M7 | AL-06 (accounts.md) |
| CL-07 | Toolbar | Sheet view icon | icon button | view group, item 3 | not observed | seen (m7-list-base) | M7 | AL-07 (accounts.md) |
| CL-08 | Toolbar | Chart view icon | icon button | view group, item 4 | not observed | seen (m7-list-base) | M7 | AL-08 (accounts.md) |
| CL-09 | Toolbar | Timeline view icon | icon button | view group, item 5 | not observed | seen (m7-list-base) | M7 | AL-09 (accounts.md) |
| CL-10 | Toolbar | Two horizontal bars icon | icon button | view group, item 6 | not observed | seen (m7-list-base) | M7 | AL-10 (accounts.md) |
| CL-11 | Toolbar | Down chevron | icon button | view group, item 7 | not observed | seen (m7-list-base) | M7 | AL-11 (accounts.md) |
| CL-12 | Toolbar | Create Campaign | button | right group, main button | not observed | seen (m7-list-base) | M7 | AL-12 (accounts.md) |
| CL-13 | Toolbar | Down arrow / More | icon button | attached to Create Campaign | not observed | seen (m7-list-base) | M6 | AL-13 (accounts.md) |
| CL-14 | Toolbar | Three dots / Actions | icon button | far right | not observed | seen (m7-list-base) | M7 | AL-14 (accounts.md) |
| CL-15 | Filter panel | Search | input | below panel title | not observed | seen (m7-list-base) | M7 | AL-15 (accounts.md) |
| CL-16 | Filter panel | System Defined Filters | toggle | first section heading | not observed | seen (m7-list-base) | M7 | AL-16 (accounts.md) |
| CL-17 | Filter panel | Record Action | checkbox | system section, item 1 | not observed | seen (m7-list-base) | M7 | AL-21 (accounts.md) |
| CL-18 | Filter panel | Related Records Action | checkbox | system section, item 2 | not observed | seen (m7-list-base) | M7 | AL-22 (accounts.md) |
| CL-19 | Filter panel | Touched Records | checkbox | system section, item 3 | not observed | seen (m7-list-base) | M7 | AL-23 (accounts.md) |
| CL-20 | Filter panel | Untouched Records | checkbox | system section, item 4 | not observed | seen (m7-list-base) | M7 | AL-24 (accounts.md) |
| CL-21 | Filter panel | Filter By Fields | toggle | second section heading | not observed | seen (m7-list-base) | M7 | AL-26 (accounts.md) |
| CL-22 | Filter panel | Actual Cost | checkbox | field section, visible item 1 | not observed | seen (m7-list-base) | M7 | new |
| CL-23 | Filter panel | Budgeted Cost | checkbox | field section, visible item 2 | not observed | seen (m7-list-base) | M7 | new |
| CL-24 | Filter panel | Campaign Name | checkbox | field section, visible item 3 | not observed | seen (m7-list-base) | M7 | AL-27 (accounts.md) |
| CL-25 | Filter panel | Campaign Owner | checkbox | field section, visible item 4 | not observed | seen (m7-list-base) | M7 | AL-54 (accounts.md) |
| CL-26 | Filter panel | Connected To | checkbox | field section, visible item 5 | not observed | seen (m7-list-base) | M7 | L-30 moved (contacts.md) |
| CL-27 | Filter panel | Created By | checkbox | field section, visible item 6 | not observed | seen (m7-list-base) | M7 | new |
| CL-28 | Filter panel | Created Time | checkbox | field section, visible item 7 | not observed | seen (m7-list-base) | M7 | new |
| CL-29 | Filter panel | End Date | checkbox | field section, visible item 8 | not observed | seen (m7-list-base) | M7 | new |
| CL-30 | Filter panel | Expected Response | checkbox | field section, visible item 9 | not observed | seen (m7-list-base) | M7 | new |
| CL-31 | Filter panel | Expected Revenue | checkbox | field section, visible item 10 | not observed | seen (m7-list-base) | M7 | new |
| CL-32 | Table | View Settings / sliders icon | icon button | header, far right overlay | not observed | seen (m7-list-base) | M11 | AL-33 (accounts.md) |
| CL-33 | Table | Campaign Name (truncated) | column header | first text column | not observed | seen (m7-list-base) | M7 | AL-35 (accounts.md) |
| CL-34 | Table | All with down arrow | select | inside first text header | not observed | seen (m7-list-base) | M7 | AL-36 (accounts.md) |
| CL-35 | Table | Type | column header | text column 2 | not observed | seen (m7-list-base) | M7 | new |
| CL-36 | Table | Status | column header | text column 3 | not observed | seen (m7-list-base) | M7 | new |
| CL-37 | Table | Start Date | column header | text column 4 | not observed | seen (m7-list-base) | M7 | new |
| CL-38 | Table | No Campaigns found. | status text | empty table body | Displays the empty result state | seen (m7-list-base) | M7 | new |
| CL-39 | List footer | Total Records 0 | badge | bottom left | Displays the empty total | seen (m7-list-base) | M7 | AL-48 (accounts.md) |
| CL-40 | Toolbar | Refresh Custom View | icon button | after view-group down chevron; not painted | not observed | not observed (DOM only) | M7 | AL-64 (accounts.md) |

Absent here: Accounts' second view tab, Locked and Cadences system filters, select-all checkbox, record rows, row menus, note bubbles and paging controls. CL-40 exists in controls.json but is not painted in the image; it is not a visible-control claim. End Date and Campaign Owner table headers are offscreen, not additional visible columns. Filter rows below Expected Revenue and the related-module filter section are clipped, not observed visually. No scrolling, toggling or filtering was performed.

### Reconciliation of controls.json — m7-list-base

One-based ordinals are offline evidence references, never click selectors. Nested wrappers and inputs share an inventory number. Each source item is assigned below; clipped controls are explicitly excluded from the visible inventory.

| Inventory / exclusion | Source item ordinals |
| --- | --- |
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
| SH-12 | 37 |
| SH-13 | 39, 40 |
| SH-14 | 41, 42 |
| SH-15 | 43, 44 |
| SH-16 | 45, 46 |
| SH-17 | 47, 48 |
| SH-18 | 49, 50 |
| SH-19 | 51 |
| SH-20 | 53, 54 |
| SH-21 | 55, 56 |
| SH-22 | 57, 58 |
| SH-23 | 59 |
| SH-24 | 61, 62 |
| SH-25 | 64, 65 |
| SH-26 | 87 |
| SH-27 | 88 |
| SH-28 | 90 |
| SH-29 | 91 |
| SH-30 | 92, 93, 94 |
| SH-31 | 95, 96, 97 |
| SH-32 | 98, 99, 100 |
| SH-33 | 101, 102 |
| SH-34 | 105, 106, 107, 108 |
| SH-35 | 268 |
| SH-36 | 269 |
| SH-37 | 270 |
| SH-38 | 271 |
| SH-39 | 272 |
| SH-40 | 273 |
| SH-41 | 274 |
| SH-42 | 275 |
| SH-43 | 276 |
| SH-44 | 277 |
| SH-45 | 278 |
| CL-01 | 114 |
| CL-02 | 115, 116, 117, 118, 119 |
| CL-03 | 120 |
| CL-04 | 121 |
| CL-05 | 123 |
| CL-06 | 124 |
| CL-07 | 125 |
| CL-08 | 126 |
| CL-09 | 127 |
| CL-10 | 128 |
| CL-11 | 129, 130 |
| CL-12 | 133 |
| CL-13 | 134, 135 |
| CL-14 | 136, 280 |
| CL-15 | 139, 140, 281 |
| CL-16 | 142 |
| CL-17 | 144, 145 |
| CL-18 | 146, 147 |
| CL-19 | 148, 149 |
| CL-20 | 150, 151 |
| CL-21 | 152 |
| CL-32 | 210 |
| CL-33 | 220 |
| CL-34 | 221, 222 |
| CL-35 | 223 |
| CL-36 | 224 |
| CL-37 | 225 |
| CL-38 | 241 |
| CL-39 | 251 |
| CL-40 (DOM only; not painted) | 131, 132 |
| Excluded: clipped field-filter rows (Last Activity Time through Type) | 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191 |
| Excluded: clipped related-module filters and heading | 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205 |
| Excluded: offscreen End Date / Campaign Owner headers | 226, 227 |
| Excluded: resize hotspots without a painted grip; never exercised | 83, 208 |
| CL-22 | 154, 155 |
| CL-23 | 156, 157 |
| CL-24 | 158, 159 |
| CL-25 | 160, 161 |
| CL-26 | 162, 163 |
| CL-27 | 164, 165 |
| CL-28 | 166, 167 |
| CL-29 | 168, 169 |
| CL-30 | 170, 171 |
| CL-31 | 172, 173 |
| Excluded: noninteractive containers, static title, empty table cells, hidden overlays, clipped rail containers and duplicate structural wrappers | 1, 5, 6, 7, 8, 9, 10, 33, 38, 52, 60, 63, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 84, 85, 86, 89, 103, 104, 109, 110, 111, 112, 113, 122, 137, 138, 141, 143, 153, 206, 207, 209, 211, 212, 213, 214, 215, 216, 217, 218, 219, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 242, 243, 244, 245, 246, 247, 248, 249, 250, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 279, 282, 283, 284, 285, 286, 287 |

Image inspection adds SH-46 (trash bin), absent from controls.json. The populated-row bulk-selection toolbar is `not observed`: there is no row to select; Ref: [contacts.md](contacts.md) L-34 / L-40 and [list-views.md](list-views.md), selection and bulk actions. No safe selection was attempted.

### Control inventory — m7-list-base-retry

No changed visible controls: CL-01–CL-40 and shell refs remain as in m7-list-base. Both images were opened. Total Records remains 0; no record link disappeared. The 287 controls.json entries reconcile as above with one ordering change: retry item 267 is the hidden live-chat widget (base 279, excluded); retry 268 is the utility-strip wrapper (base 267, excluded); retry 269–279 map to base 268–278, respectively (SH-35–SH-45). All other ordinals retain their base mapping. Rest: as in m7-list-base; covered by overlay: none.

The second click-free capture was taken after the required five-minute interval, with the same command and 25-second wait. Both captures have 56 API calls and a module-specific title, but zero record links. The CTO resolved the empty-state gate in MEP-803: successful count plus empty bulk response, visible empty text and zero total, repeated after five minutes, replace the record-link condition. The module title and API-call conditions still apply. Both existing captures satisfy this exception; m7-list-base remains the base. No further full recapture was required. Populated list structure is derived only from the metadata columns above and the Module 1–4 list patterns, not observed Campaigns rows.

### Control inventory — m7-list-views

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CL-02.1 | View menu | Public Views | toggle | popup, row 1 | not observed; not selected | seen (m7-list-views) | M7 | AL-02.1 (accounts.md) |
| CL-02.2 | View menu | All Active Campaigns | menu item | popup, row 2 | not observed; not selected | seen (m7-list-views) | M7 | new |
| CL-02.3 | View menu | All Campaigns | menu item | popup, row 3 | not observed; not selected | seen (m7-list-views) | M7 | AL-02.2 moved (accounts.md) |
| CL-02.4 | View menu | My Active Campaigns | menu item | popup, row 4 | not observed; not selected | seen (m7-list-views) | M7 | new |
| CL-02.5 | View menu | Unread Campaigns | menu item | popup, row 5 | not observed; not selected | seen (m7-list-views) | M7 | AL-02.9 moved (accounts.md) |
| CL-02.6 | View menu | Show custom views as Dropdown | button | popup, row 6 | not observed; not selected | seen (m7-list-views) | M7 | AL-02.10 moved (accounts.md) |
| CL-02.7 | View menu | New Custom View | menu item | popup, row 7 | not observed; not selected | seen (m7-list-views) | M11 | AL-02.11 moved (accounts.md) |
| CL-02.8 | View menu | Manage Custom View | menu item | popup, row 8 | not observed; not selected | seen (m7-list-views) | M11 | AL-02.12 moved (accounts.md) |

All Campaigns is visibly checked. No view was selected; criteria remain metadata evidence. Absent here: locked, recently created/modified and weekly views from Accounts. Rest: as in m7-list-base; covered by the overlay: CL-04–CL-11, part of CL-15–CL-20 and the left edge of CL-33.

### Control inventory — m7-list-create-menu

No new controls. One requested click, zero executed, one skipped by the tool's dangerous-attribute guard. The page is painted, so this is not a loading retry case. No alternative selector was attempted. Create-menu contents remain `not observed`; Ref: AL-13 / m3-list-create-menu (accounts.md), the same guarded opening.

Rest: as in m7-list-base; covered by the overlay: none. The image was opened and confirms the same empty list and zero total.

### Control inventory — m7-list-actions

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CL-14.1 | Actions menu | Mass Transfer | menu item | popup, row 1 | not observed; not selected | seen (m7-list-actions) | M7 | AL-14.1 (accounts.md) |
| CL-14.2 | Actions menu | Mass Delete | menu item | popup, row 2 | not observed; not selected | seen (m7-list-actions) | M7 | AL-14.2 (accounts.md) |
| CL-14.3 | Actions menu | Mass Update | menu item | popup, row 3 | not observed; not selected | seen (m7-list-actions) | M7 | AL-14.3 (accounts.md) |
| CL-14.4 | Actions menu | Manage Tags | menu item | popup, row 4 | not observed; not selected | seen (m7-list-actions) | M6 | AL-14.4 (accounts.md) |
| CL-14.5 | Actions menu | Drafts | menu item | popup, row 5 | not observed; not selected | seen (m7-list-actions) | M7 | AL-14.5 (accounts.md) |
| CL-14.6 | Actions menu | Create Client Script | menu item | popup, row 6 | not observed; not selected | seen (m7-list-actions) | M11 | AL-14.7 moved (accounts.md) |
| CL-14.7 | Actions menu | Export Campaigns | menu item | popup, row 7 | not observed; not selected | seen (m7-list-actions) | M6 | AL-14.8 moved (accounts.md) |
| CL-14.8 | Actions menu | Sheet view | menu item | popup, row 8 | not observed; not selected | seen (m7-list-actions) | ? | AL-14.9 moved (accounts.md) |
| CL-14.9 | Actions menu | Print View | menu item | popup, row 9 | not observed; not selected | seen (m7-list-actions) | M7 | AL-14.10 moved (accounts.md) |
| CL-40 | Toolbar | Refresh Custom View | icon button | after view-group down chevron | not observed; not clicked | seen (m7-list-actions) | M7 | AL-64 (accounts.md) |

Print View has a right-facing submenu arrow; no submenu was opened. Decorative sparkle marks accompany Create Client Script and Print View. Sheet view uses a neutral label here; its visible branded prefix is intentionally omitted. Its module attribution remains unresolved, as in Accounts. Absent here: Deduplicate Accounts. Rest: as in m7-list-base; covered by the overlay: CL-37 and right-hand empty table area. No menu row was selected. CL-40 is now painted; this does not change the base-image absence.

### Reconciliation of menu and final captures

Source ordinals below are offline evidence only. Every inherited ordinal uses the exact assignment or exclusion in the base reconciliation. Tag, name, kind and selector were checked; the generated Sort selector suffix changes without changing the control. Each screenshot was opened. No additional shell control was found.

| Capture | Source items | Inventory / exclusion |
| --- | --- | --- |
| m7-list-views | 1–263 | Same ordinal assignments as base |
| m7-list-views | 264, 265, 266 | Base 265, 266, 264: hidden overlays, excluded |
| m7-list-views | 267, 268 | Base 279, 267: hidden chat / structural utility wrapper, excluded |
| m7-list-views | 269–279 | Base 268–278: SH-35–SH-45 |
| m7-list-views | 280–282, 284 | Menu and accordion containers, excluded as structural duplicates |
| m7-list-views | 283 | CL-02.1 |
| m7-list-views | 285, 286, 287, 288 | CL-02.2, CL-02.3, CL-02.4, CL-02.5 |
| m7-list-views | 289 | CL-02.6 |
| m7-list-views | 290, 291 | CL-02.7, nested duplicate |
| m7-list-views | 292–294 | CL-02.8, nested / hidden wrappers included |
| m7-list-views | 295 | CL-40 icon duplicate; covered by menu |
| m7-list-views | 296–303 | Base 280–287 assignments / exclusions |
| m7-list-views | 304, 305 | Nonoverflowing menu / accordion scroll containers, excluded as structural duplicates |
| m7-list-create-menu | 1–287 | Same ordinal assignments as base; no menu opened |
| m7-list-actions | 1–266 | Same ordinal assignments as base; CL-40 now visibly painted |
| m7-list-actions | 267, 268 | CL-14.1, hidden link wrapper + visible anchor |
| m7-list-actions | 269, 270 | CL-14.2, hidden link wrapper + visible anchor |
| m7-list-actions | 271, 272 | CL-14.3, hidden link wrapper + visible anchor |
| m7-list-actions | 273, 274 | CL-14.4, hidden link wrapper + visible anchor |
| m7-list-actions | 275, 276 | CL-14.5, hidden link wrapper + visible anchor |
| m7-list-actions | 277 | CL-14.6 |
| m7-list-actions | 278 | CL-14.7 |
| m7-list-actions | 279–291 | Base 267–279 assignments / exclusions |
| m7-list-actions | 292 | CL-40 icon duplicate |
| m7-list-actions | 293–300 | Base 280–287 assignments / exclusions |
| m7-list-actions | 301 | Nonoverflowing menu body, excluded as structural duplicate |
| m7-list-after | 1–287 | Same ordinal assignments as base |

Image-only additions: CL-14.8 (Sheet view) and CL-14.9 (Print View, including its submenu arrow) are absent from controls.json, but visible in m7-list-actions. SH-46 remains image-only in every capture. Decorative sparkle marks are not separate controls.

### Control inventory — m7-list-after

No changed controls relative to the base. CL-01–CL-40 retain their base visibility, including the unpainted CL-40; no menu is open. Rest: as in m7-list-base; covered by the overlay: none. The final image confirms the empty state and Total Records 0. Record links remain 0 → 0 and total remains 0 → 0; no evidence of a reference change.

## Actions and flows

No write, menu item, preference or filter was exercised. The system-view and Actions menus were opened without selecting any item. Create-menu contents remain `not observed` because the tool blocked the opening control. No success, validation, error-after-write or populated-row behaviour can be inferred from the empty result.

## Open questions

- Row-end controls, populated pagination, cell contents and bulk selection: not visible in an empty list; metadata / public documentation and inherited list patterns are the available evidence. Campaigns-specific behaviour remains not observed. Do not create reference records to research it.
- Create-menu contents: not observed because the capture guard rejected the opening control. No alternative route or selector was attempted.
- Sheet view module attribution remains `?`, inherited from Accounts; destination behaviour and the Print View submenu were not observed.
- Hidden/offscreen filter rows and table headers are not visual observations. Their DOM presence is kept separate from metadata and the visible inventory.

## Capture refs

- `m7-list-base` — empty All Campaigns list; image opened and compared to controls.json.
- `m7-list-base-retry` — same empty state after the mandated retry; image opened; no menu clicked.
- `m7-list-views` — Public Views menu; one executed opening click, no selection; image opened.
- `m7-list-create-menu` — one requested opening click skipped by the guard; unchanged empty list; image opened.
- `m7-list-actions` — nine Actions rows, refresh icon visible; one executed opening click; image opened.
- `m7-list-after` — final click-free empty list; image opened; total and record-link counts unchanged.

## Create / edit form

### Purpose and evidence boundary

Inventory the open Campaigns create form without entering data, selecting an option, saving, cancelling or changing a preference. This section is the MEP-759 research slice; list and detail research are separate slices. Metadata describes configuration, never proof of a rendered control. No customer or user values are reproduced.

The list is empty. The CTO's MEP-803 empty-list gate decision applies: the earlier `m7-list-base` / `m7-list-base-retry` established the repeated empty state; `m7f-list-base` confirms the same state and total of zero. Edit cannot be opened without an existing record. No record was created and no record route was invented. All edit-specific fields, defaults, controls and differences remain **not observed**.

### Layout and field order

`m7f-create` shows a full-page Create Campaign form inside the shared shell. The fixed header has Edit Page Layout and, left to right in its right group, Cancel, Save and New, Save. Campaign Information uses two columns:

| Row | Left | Right |
| --- | --- | --- |
| 1 | Campaign Owner, selector and user lookup | Type |
| 2 | Campaign Name | Status |
| 3 | Start Date | End Date |
| 4 | Expected Revenue, TL prefix, information icon | Budgeted Cost, TL prefix, information icon |
| 5 | Actual Cost, TL prefix, information icon | Expected Response |
| 6 | Numbers sent | No field |

Description Information follows, with a single multiline Description input and lower-right resize grip. The bottom form area has the static Create Form Views label, Standard View selector and Create a custom form page button. There is no second Save/Cancel group at the bottom. Client Script is fixed on the right edge and overlaps part of Expected Response. The shell utility strip remains below the form.

Campaign Name and Type have required input-edge markers. Owner is prefilled and automatically focused on load; its value is omitted. Type and Status initially show `-None-`. The dates show `DD.MM.YYYY`, with no separate visible calendar icon; other editable fields are empty. All three currency fields have a TL prefix and an information icon; no information popup was opened. Parent Campaign is absent from the rendered form, including its lookup button. No attempt was made to reveal hidden fields through layout or form-view settings.

### Control inventory — m7f-create

Shell: SH-01–SH-46 in [contacts.md](contacts.md), with Campaigns SH-18 active. MCP is the shorter visible label for SH-08. Channels/Threads are absent. The rail Products entry is below the viewport; Price Books is partially visible. The utility right group preserves SH-38–SH-46; SH-46 is image-only. No new visible shell control was found. The rail boundary handle in the source is structural; no separate painted grip is visible.

Stable CF numbers persist across captures. Select arrows belong to their select. Required markers are field states. `same` retains the cited control's interaction limits. Source ordinals below are one-based `controls.json` entries; they are evidence references, never click selectors.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CF-01 | Header | Edit Page Layout | link | after title | same; not opened | seen (m7f-create) | M11 | AF-01, accounts-form.md |
| CF-02 | Header | Cancel | button | right group, first | same; not operated | seen (m7f-create) | M7 | AF-02, accounts-form.md |
| CF-03 | Header | Save and New | button | right group, second | same; not operated | seen (m7f-create) | M7 | AF-03, accounts-form.md |
| CF-04 | Header | Save | button | right group, third | same; not operated | seen (m7f-create) | M7 | AF-04, accounts-form.md |
| CF-05 | Campaign Information | Campaign Owner | select | left row 1 | same; prefilled, automatic focus | seen (m7f-create) | M7 | AF-06, accounts-form.md |
| CF-06 | Campaign Information | User lookup icon | icon button | owner input, right edge | same; not opened | seen (m7f-create) | M7 | AF-07, accounts-form.md |
| CF-07 | Campaign Information | Campaign Name | input | left row 2 | same; required marker | seen (m7f-create) | M7 | AF-08, accounts-form.md |
| CF-08 | Campaign Information | Start Date | input | left row 3 | not observed; placeholder visible | seen (m7f-create) | M7 | new |
| CF-09 | Campaign Information | Expected Revenue | input | left row 4 | not observed; editable blank currency input | seen (m7f-create) | M7 | new |
| CF-09.1 | Campaign Information | TL | badge | Expected Revenue prefix | currency prefix; no action | seen (m7f-create) | M7 | DF-16 moved, deals-form.md |
| CF-10 | Campaign Information | Information icon | icon button | Expected Revenue, right edge | same; not opened | seen (m7f-create) | M7 | AF-16 moved, accounts-form.md |
| CF-11 | Campaign Information | Actual Cost | input | left row 5 | not observed | seen (m7f-create) | M7 | new |
| CF-11.1 | Campaign Information | TL | badge | Actual Cost prefix | currency prefix; no action | seen (m7f-create) | M7 | DF-16 moved, deals-form.md |
| CF-12 | Campaign Information | Information icon | icon button | Actual Cost, right edge | same; not opened | seen (m7f-create) | M7 | AF-16 moved, accounts-form.md |
| CF-13 | Campaign Information | Numbers sent | input | left row 6 | not observed | seen (m7f-create) | M7 | new |
| CF-14 | Campaign Information | Type | select | right row 1 | opens Type list; no selection | seen (m7f-create) | M7 | new |
| CF-15 | Campaign Information | Status | select | right row 2 | opens Status list; no selection | seen (m7f-create) | M7 | new |
| CF-16 | Campaign Information | End Date | input | right row 3 | not observed; placeholder visible | seen (m7f-create) | M7 | new |
| CF-17 | Campaign Information | Budgeted Cost | input | right row 4 | not observed | seen (m7f-create) | M7 | new |
| CF-17.1 | Campaign Information | TL | badge | Budgeted Cost prefix | currency prefix; no action | seen (m7f-create) | M7 | DF-16 moved, deals-form.md |
| CF-18 | Campaign Information | Information icon | icon button | Budgeted Cost, right edge | same; not opened | seen (m7f-create) | M7 | AF-16 moved, accounts-form.md |
| CF-19 | Campaign Information | Expected Response | input | right row 5 | not observed; partly covered by Client Script | seen (m7f-create) | M7 | new |
| CF-20 | Description Information | Description | input | only multiline editor | same | seen (m7f-create) | M7 | AF-44, accounts-form.md |
| CF-21 | Description Information | Resize grip | icon button | editor lower-right | not observed | seen (m7f-create) | M7 | DF-29, deals-form.md |
| CF-22 | Form footer | Standard View | select | after Create Form Views label | not observed; Accounts source-only reference | seen (m7f-create) | M11 | AF-45, accounts-form.md |
| CF-23 | Form footer | Create a custom form page | button | footer, right | not observed; Accounts source-only reference | seen (m7f-create) | M11 | AF-46, accounts-form.md |
| CF-24 | Right edge | Client Script | tab | page right edge | same; not opened | seen (m7f-create) | M11 | AF-47, accounts-form.md |

Absent here: account image AF-05, Parent Account input/lookup AF-10–AF-11, account-specific fields AF-09/AF-12–AF-24 and address controls AF-25–AF-43. Campaigns instead has the CF fields above. The configured Parent Campaign lookup does not establish a visible equivalent of AF-11.

### Form fields vs metadata

Configuration sources: `metadata/modules/Campaigns/fields.json` and `layouts.json` in the local research workspace. The exported layout contains Campaign Information and Description Information. Type is layout-required but not system-mandatory; Campaign Name is both layout-required and system-mandatory. Both required markers are observed, so these two sources agree with the rendering.

| Field API key | Metadata type | Rendered control | Evidence |
| --- | --- | --- | --- |
| Owner | ownerlookup | CF-05, CF-06 | prefilled selector and user lookup |
| Type | picklist | CF-14 | required, initially -None- |
| Campaign_Name | text | CF-07 | required, blank |
| Status | picklist | CF-15 | initially -None- |
| Start_Date | date | CF-08 | date placeholder; calendar not observed |
| End_Date | date | CF-16 | date placeholder; calendar not observed |
| Expected_Revenue | currency | CF-09, CF-09.1, CF-10 | TL prefix and information icon |
| Budgeted_Cost | currency | CF-17, CF-17.1, CF-18 | TL prefix and information icon |
| Actual_Cost | currency | CF-11, CF-11.1, CF-12 | TL prefix and information icon |
| Expected_Response | bigint | CF-19 | blank single-line input |
| Num_sent | bigint | CF-13 | blank single-line input |
| Description | textarea | CF-20, CF-21 | blank multiline input |
| Parent_Campaign | lookup | absent | no lookup input/button rendered |
| Created_By, Modified_By | ownerlookup | absent | metadata only |
| Created_Time, Modified_Time | datetime | absent | metadata only |
| Tag | text | absent | metadata only |
| id | bigint | absent | metadata only |
| Last_Activity_Time | datetime | absent | metadata only |
| Connected_To__s | multi_module_lookup | absent | metadata only |

### Validation and unobserved states

No save, input focus, typing or option selection was requested. Required-field error wording, date-order validation, currency precision/range, numeric validation, save success/error states and post-save navigation are **not observed without a write**. These remain open questions; no undocumented validation rule is asserted.

Date picker: **not observed**. The screenshot and controls list contain date inputs, with no separately named or stable calendar-opening button. Clicking a date input would focus a field, forbidden by the inherited form rules. Parent Campaign popup: **not observed**, because its opener is absent. Edit: **not observed**, because the list has no records.

### Capture refs and list comparison

- `m7f-list-base`: no-click list gate; zero records.
- `m7f-create`: Create Campaign button, one click; painted full form.
- `m7f-create-type`: direct observed create route, Type list opening, one click.
- `m7f-create-status`: direct observed create route, Status list opening, one click.
- `m7f-list-after`: no-click final list comparison.

List controls are not re-inventoried in this form slice. The complete CL inventory and source mapping belong to MEP-754; its artifact is the review access path until the research slices are integrated. `m7f-list-base` reuses the earlier `m7-list-base` list inventory from the MEP-754 slice (CL-01–CL-40 plus SH references), with identical source ordinals, tags, names and bounds; no shell difference was found. No list control was operated except the verified Create Campaign button. Raw screenshots stay in the local research workspace.

### Control inventory — m7f-create-type

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CF-14.1 | Type popup | Search | input | top, above options | not observed; empty, automatic popup focus | seen (m7f-create-type) | M7 | AF-13.1 moved, accounts-form.md |
| CF-14.2 | Type popup | -None- | menu item | option 1 | checked; not selected by the analyst | seen (m7f-create-type) | M7 | AF-13.2 moved, accounts-form.md |
| CF-14.3 | Type popup | Conference | menu item | option 2 | not observed | seen (m7f-create-type) | M7 | new |
| CF-14.4 | Type popup | Webinar | menu item | option 3 | not observed | seen (m7f-create-type) | M7 | new |
| CF-14.5 | Type popup | Trade Show | menu item | option 4 | not observed | seen (m7f-create-type) | M7 | new |
| CF-14.6 | Type popup | Public Relations | menu item | option 5 | not observed | seen (m7f-create-type) | M7 | new |
| CF-14.7 | Type popup | Partners | menu item | option 6 | not observed | seen (m7f-create-type) | M7 | new |
| CF-14.8 | Type popup | Referral Program | menu item | option 7, clipped at lower edge | not observed | seen (m7f-create-type) | M7 | new |

Rest: as in `m7f-create`; covered by the overlay: CF-15, CF-16, CF-17, CF-17.1, CF-18, CF-19 and part of CF-24. The popup search magnifier and checked-option tick are decorations of CF-14.1 / CF-14.2, not independent controls. Source entries for the remaining six options lie outside the popup's clipped viewport and are not claimed as visually observed.

Metadata-only complete Type order: -None-, Conference, Webinar, Trade Show, Public Relations, Partners, Referral Program, Advertisement, Banner Ads, Direct mail, Email, Telemarketing, Others. Only the first seven appear in this capture; no scrolling was requested.

### Source reconciliation — m7f-create

All 212 source entries are covered below. Wrapper/child duplicates share a number; hidden items do not establish visibility. The screenshot additionally establishes CF-21 and SH-46, and the currency prefixes are included with their inputs.

| Inventory number | Source ordinals |
| --- | --- |
| SH-01 | 2–4 |
| SH-02 | 11 |
| SH-03 | 12–14 |
| SH-04 | 15–17 |
| SH-05 | 18–20 |
| SH-06 | 21–23 |
| SH-07 | 24–26 |
| SH-08 | 27–29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| SH-12 | 37 |
| SH-13 | 39–40 |
| SH-14 | 41–42 |
| SH-15 | 43–44 |
| SH-16 | 45–46 |
| SH-17 | 47–48 |
| SH-18 | 49–50 |
| SH-19 | 51 |
| SH-20 | 53–54 |
| SH-21 | 55–56 |
| SH-22 | 57–58 |
| SH-23 | 59 |
| SH-24 | 61–62 |
| SH-25 | 64–65 |
| SH-26 | 86 |
| SH-27 | 87 |
| SH-28 | 89 |
| SH-29 | 90 |
| SH-30 | 91–93 |
| SH-31 | 94–96 |
| SH-32 | 97–99 |
| SH-33 | 100–101 |
| SH-34 | 104–107 |
| SH-35 | 191 |
| SH-36 | 192 |
| SH-37 | 193 |
| SH-38 | 194 |
| SH-39 | 195 |
| SH-40 | 196 |
| SH-41 | 197 |
| SH-42 | 198 |
| SH-43 | 199 |
| SH-44 | 200 |
| SH-45 | 201 |
| CF-01 | 110–112 |
| CF-02 | 118–119 |
| CF-03 | 116–117 |
| CF-04 | 114–115 |
| CF-05 | 128–129 |
| CF-06 | 127, 203–205 |
| CF-07 | 130–131 |
| CF-08 | 132–133 |
| CF-09 / CF-09.1 | 134–135 |
| CF-10 | 206 |
| CF-11 / CF-11.1 | 138–139 |
| CF-12 | 207 |
| CF-13 | 142–143 |
| CF-14 | 144–145 |
| CF-15 | 146–147 |
| CF-16 | 148–149 |
| CF-17 / CF-17.1 | 150–151 |
| CF-18 | 208 |
| CF-19 | 154–155 |
| CF-20 / CF-21 | 157–158, 211 |
| CF-22 | 160–162, 212 |
| CF-23 | 163–164 |
| CF-24 | 175 |
| Excluded: outside viewport (including rail Products and unused rail groups) | 66–81, 108 |
| Excluded: structural container or static heading/label; no independent control | 1, 38, 52, 60, 63, 83, 85, 88, 109, 113, 125–126, 156, 159, 190, 209–210 |
| Excluded: zero-area hidden/inactive element | 5–10, 33, 82, 84, 102–103, 120–124, 136–137, 140–141, 152–153, 165–174, 176–189, 202 |

Self-check: controls.json 212 entries → 131 mapped source entries, 81 explicitly excluded; 27 CF inventory numbers (CF-01–CF-24 plus three currency-prefix subnumbers), plus shared SH controls. CF-21 is the image-only resize affordance within the textarea.

### Control inventory — m7f-create-status

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CF-15.1 | Status popup | -None- | menu item | option 1 | checked; not selected by the analyst | seen (m7f-create-status) | M7 | new |
| CF-15.2 | Status popup | Planning | menu item | option 2 | not observed | seen (m7f-create-status) | M7 | new |
| CF-15.3 | Status popup | Active | menu item | option 3 | not observed | seen (m7f-create-status) | M7 | new |
| CF-15.4 | Status popup | Inactive | menu item | option 4 | not observed | seen (m7f-create-status) | M7 | new |
| CF-15.5 | Status popup | Complete | menu item | option 5 | not observed | seen (m7f-create-status) | M7 | new |

Rest: as in `m7f-create`; covered by the overlay: CF-16, CF-17, CF-17.1, CF-18, CF-19 and part of CF-24. This list has no search input. Its five visible options match the metadata order exactly. The tick belongs to CF-15.1. Status here is a form field; it was only opened, never changed.

### Open questions

1. Edit layout and edit-only controls/defaults cannot be observed while Campaigns has no records. Revisit only when a record becomes available independently; creating a record for research remains forbidden.
2. Parent Campaign is exported in the layout but absent from the rendered create form. Its lookup popup and reason for absence are not observed. No configuration change is authorized to reveal it.
3. A date input may expose a calendar after focus, but that action is outside the inherited form-opening rules. Calendar structure and date selection remain not observed.
4. Required error text, Start/End Date ordering, numeric constraints and save outcomes are not observed without a write. Resolve from public documentation or a lead decision before implementation depends on them.
5. Currency information-popup content, owner selection and custom form-view behaviour are not observed; only their visible controls are inventoried.

### Source reconciliation — m7f-create-type

All 229 source entries are reconciled; base controls retain their numbers even where covered by the popup.

| Inventory number / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural container or static heading/label; no independent control | 1, 38, 52, 60, 63, 83, 85, 88, 109, 113, 125–126, 156, 159, 191, 225–226 |
| SH-01 | 2–4 |
| Excluded: zero-area hidden/inactive element | 5–10, 33, 82, 84, 102–103, 120–124, 136–137, 140–141, 152–153, 165–174, 176–190 |
| SH-02 | 11 |
| SH-03 | 12–14 |
| SH-04 | 15–17 |
| SH-05 | 18–20 |
| SH-06 | 21–23 |
| SH-07 | 24–26 |
| SH-08 | 27–29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| SH-12 | 37 |
| SH-13 | 39–40 |
| SH-14 | 41–42 |
| SH-15 | 43–44 |
| SH-16 | 45–46 |
| SH-17 | 47–48 |
| SH-18 | 49–50 |
| SH-19 | 51 |
| SH-20 | 53–54 |
| SH-21 | 55–56 |
| SH-22 | 57–58 |
| SH-23 | 59 |
| SH-24 | 61–62 |
| SH-25 | 64–65 |
| Excluded: outside viewport (including rail Products and unused rail groups) | 66–81, 108 |
| SH-26 | 86 |
| SH-27 | 87 |
| SH-28 | 89 |
| SH-29 | 90 |
| SH-30 | 91–93 |
| SH-31 | 94–96 |
| SH-32 | 97–99 |
| SH-33 | 100–101 |
| SH-34 | 104–107 |
| CF-01 | 110–112 |
| CF-04 | 114–115 |
| CF-03 | 116–117 |
| CF-02 | 118–119 |
| CF-06 | 127, 218–220 |
| CF-05 | 128–129 |
| CF-07 | 130–131 |
| CF-08 | 132–133 |
| CF-09 / CF-09.1 | 134–135 |
| CF-11 / CF-11.1 | 138–139 |
| CF-13 | 142–143 |
| CF-14 | 144–145 |
| CF-15 | 146–147 |
| CF-16 | 148–149 |
| CF-17 / CF-17.1 | 150–151 |
| CF-19 | 154–155 |
| CF-20 / CF-21 | 157–158, 227 |
| CF-22 | 160–162, 228 |
| CF-23 | 163–164 |
| CF-24 | 175 |
| SH-35 | 192 |
| SH-36 | 193 |
| SH-37 | 194 |
| SH-38 | 195 |
| SH-39 | 196 |
| SH-40 | 197 |
| SH-41 | 198 |
| SH-42 | 199 |
| SH-43 | 200 |
| SH-44 | 201 |
| SH-45 | 202 |
| CF-14.1 | 203 |
| Excluded: popup structural container | 204 |
| CF-14.2 | 205 |
| CF-14.3 | 206 |
| CF-14.4 | 207 |
| CF-14.5 | 208 |
| CF-14.6 | 209 |
| CF-14.7 | 210 |
| CF-14.8 | 211 |
| Excluded: option outside clipped popup viewport; metadata only | 212–217 |
| CF-10 | 221 |
| CF-12 | 222 |
| CF-18 | 223 |
| CF-14.1 (magnifier decoration) | 224 |
| Excluded: popup structural duplicate | 229 |

Self-check: controls.json 229 entries → 140 mapped source entries, 89 excluded for the reasons above; base inventory plus 8 popup numbers.

### Source reconciliation — m7f-create-status

All 219 source entries are reconciled; base controls retain their numbers even where covered by the popup.

| Inventory number / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural container or static heading/label; no independent control | 1, 38, 52, 60, 63, 83, 85, 88, 109, 113, 125–126, 156, 159, 191, 215–216 |
| SH-01 | 2–4 |
| Excluded: zero-area hidden/inactive element | 5–10, 33, 82, 84, 102–103, 120–124, 136–137, 140–141, 152–153, 165–174, 176–190 |
| SH-02 | 11 |
| SH-03 | 12–14 |
| SH-04 | 15–17 |
| SH-05 | 18–20 |
| SH-06 | 21–23 |
| SH-07 | 24–26 |
| SH-08 | 27–29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| SH-12 | 37 |
| SH-13 | 39–40 |
| SH-14 | 41–42 |
| SH-15 | 43–44 |
| SH-16 | 45–46 |
| SH-17 | 47–48 |
| SH-18 | 49–50 |
| SH-19 | 51 |
| SH-20 | 53–54 |
| SH-21 | 55–56 |
| SH-22 | 57–58 |
| SH-23 | 59 |
| SH-24 | 61–62 |
| SH-25 | 64–65 |
| Excluded: outside viewport (including rail Products and unused rail groups) | 66–81, 108 |
| SH-26 | 86 |
| SH-27 | 87 |
| SH-28 | 89 |
| SH-29 | 90 |
| SH-30 | 91–93 |
| SH-31 | 94–96 |
| SH-32 | 97–99 |
| SH-33 | 100–101 |
| SH-34 | 104–107 |
| CF-01 | 110–112 |
| CF-04 | 114–115 |
| CF-03 | 116–117 |
| CF-02 | 118–119 |
| CF-06 | 127, 209–211 |
| CF-05 | 128–129 |
| CF-07 | 130–131 |
| CF-08 | 132–133 |
| CF-09 / CF-09.1 | 134–135 |
| CF-11 / CF-11.1 | 138–139 |
| CF-13 | 142–143 |
| CF-14 | 144–145 |
| CF-15 | 146–147 |
| CF-16 | 148–149 |
| CF-17 / CF-17.1 | 150–151 |
| CF-19 | 154–155 |
| CF-20 / CF-21 | 157–158, 217 |
| CF-22 | 160–162, 218 |
| CF-23 | 163–164 |
| CF-24 | 175 |
| SH-35 | 192 |
| SH-36 | 193 |
| SH-37 | 194 |
| SH-38 | 195 |
| SH-39 | 196 |
| SH-40 | 197 |
| SH-41 | 198 |
| SH-42 | 199 |
| SH-43 | 200 |
| SH-44 | 201 |
| SH-45 | 202 |
| Excluded: popup structural container | 203 |
| CF-15.1 | 204 |
| CF-15.2 | 205 |
| CF-15.3 | 206 |
| CF-15.4 | 207 |
| CF-15.5 | 208 |
| CF-10 | 212 |
| CF-12 | 213 |
| CF-18 | 214 |
| Excluded: popup structural duplicate | 219 |

Self-check: controls.json 219 entries → 136 mapped source entries, 83 excluded for the reasons above; base inventory plus 5 popup numbers.

### Source reconciliation — list gate and final comparison

`m7f-list-base`: 287 source entries use the exact ordinal mapping in MEP-754, `Reconciliation of controls.json — m7-list-base`. Every source entry was compared by tag, name and bounds and is identical. This covers CL-01–CL-40 and SH-01–SH-45 (SH-46 is image-only); CL-40 is DOM-only, not painted. 146 source entries map to visible-control numbers; 141 are excluded as hidden/unpainted, clipped, structural or duplicate wrappers under that mapping. No overlay.

`m7f-list-after`: 287 entries use the same assignments, with only hidden-overlay ordering changes at ordinals 264–266 (all already excluded). Every other tag/name/bounds tuple is identical. Self-check: 146 mapped entries and 141 excluded; CL-01–CL-40 plus SH references. Both list screenshots show total 0 and zero record links; no record disappeared. All five screenshots were opened as images. No tab was closed.


## Record detail

### Not observed — the reference has no campaign records

This is the MEP-811 source inventory authorized by the CTO's defer_detail decision
on MEP-758. It replaces that slice's blocked-detail disposition; it does not claim
screen observation or authorize implementation from an assumed layout. The approved
MEP-759 form research above is preserved unchanged. No new capture, record creation,
preference change or guessed detail route was used.

The existing `m7d-list-base` remains the prerequisite evidence: empty list, total 0,
no record links. Its saved retry and blocked-background-request audit belong to
MEP-758; this task issues no capture requests. There is no detail screenshot to
compare. UI Lead review checks source fidelity and open questions only.

### Sources and reading rules

- M1: local research `metadata/modules/Campaigns/layouts.json`, Standard layout,
  `sections[].sequence_number` and `fields[].sequence_number`.
- M2: local research `metadata/modules/Campaigns/related_lists.json`, all 15 entries.
- P1: reference CRM public help, **Creating Campaigns**, article path
  `crm/marketing-automation-tools/campaigns/articles/create-campaigns`, read 2026-10-17.
  Section names below identify the specific evidence; documentation describes the
  general product, not this account's rendered detail.
- P2: reference CRM public help, **Associating Other Records**, article path
  `crm/manage-crm-data/record-management/articles/associate-other-records`,
  **Add Notes** and **Add Tasks, Events & Calls**, read 2026-10-17.
- P3: reference CRM public help, **Customizing Record's Detail Page**, article path
  `crm/customize-crm-account/record-level-customization/articles/page-level-customization`,
  **Organize Page Details**, read 2026-10-17.

Neutral article paths omit the publisher hostname to comply with repository naming
rules. No documentation images or customer examples are reproduced.

CD numbers are stable source-inventory identifiers, **not observed controls**.
Every row gives a Source. Metadata order is configuration order, never painted
position. No existing CD identifiers were allocated in MEP-758, so numbering starts
at CD-01 here. Shared-module patterns remain hypotheses and do not establish parity.

### Section and field inventory

All fields below have `view_type.view=true` in M1. That flag does not prove that a
field is painted. Campaign Information has two configured columns; Description
Information has one. Neither the actual detail grid nor business-card placement
is known. Field sequence 16 is duplicated; array order is retained for that tie.

| # | Section / field | Configured order | Type / limit | Source | Evidence |
| --- | --- | --- | --- | --- | --- |
| CD-01 | Campaign Information | section 1 | 2 configured columns | metadata | M1 |
| CD-02 | Campaign Owner (`Owner`) | field 1 | ownerlookup; rendering unknown | metadata | M1, Campaign Information |
| CD-03 | Type (`Type`) | field 2 | picklist; rendering unknown | metadata | M1, Campaign Information |
| CD-04 | Campaign Name (`Campaign_Name`) | field 3 | text; rendering unknown | metadata | M1, Campaign Information |
| CD-05 | Status (`Status`) | field 4 | picklist; rendering unknown | metadata | M1, Campaign Information |
| CD-06 | Start Date (`Start_Date`) | field 5 | date; rendering unknown | metadata | M1, Campaign Information |
| CD-07 | End Date (`End_Date`) | field 6 | date; rendering unknown | metadata | M1, Campaign Information |
| CD-08 | Expected Revenue (`Expected_Revenue`) | field 7 | currency; rendering unknown | metadata | M1, Campaign Information |
| CD-09 | Budgeted Cost (`Budgeted_Cost`) | field 8 | currency; rendering unknown | metadata | M1, Campaign Information |
| CD-10 | Actual Cost (`Actual_Cost`) | field 9 | currency; rendering unknown | metadata | M1, Campaign Information |
| CD-11 | Expected Response (`Expected_Response`) | field 10 | bigint; rendering unknown | metadata | M1, Campaign Information |
| CD-12 | Numbers sent (`Num_sent`) | field 11 | bigint; rendering unknown | metadata | M1, Campaign Information |
| CD-13 | Created By (`Created_By`) | field 12 | ownerlookup; rendering unknown | metadata | M1, Campaign Information |
| CD-14 | Modified By (`Modified_By`) | field 13 | ownerlookup; rendering unknown | metadata | M1, Campaign Information |
| CD-15 | Created Time (`Created_Time`) | field 14 | datetime; rendering unknown | metadata | M1, Campaign Information |
| CD-16 | Modified Time (`Modified_Time`) | field 15 | datetime; rendering unknown | metadata | M1, Campaign Information |
| CD-17 | Tag (`Tag`) | field 16 | text; rendering unknown | metadata | M1, Campaign Information |
| CD-18 | Parent Campaign (`Parent_Campaign`) | field 16 | lookup; rendering unknown | metadata | M1, Campaign Information |
| CD-19 | Record Id (`id`) | field 20 | bigint; rendering unknown | metadata | M1, Campaign Information |
| CD-20 | Last Activity Time (`Last_Activity_Time`) | field 21 | datetime; rendering unknown | metadata | M1, Campaign Information |
| CD-21 | Connected To (`Connected_To__s`) | field 23 | multi_module_lookup; rendering unknown | metadata | M1, Campaign Information |
| CD-22 | Description Information | section 2 | 1 configured columns | metadata | M1 |
| CD-23 | Description (`Description`) | field 1 | textarea; rendering unknown | metadata | M1, Description Information |

### Related-list configuration inventory

All M2 entries have `visible=true`; that is configuration, not observed visibility.
Sequence gaps are retained. Permission flags and relation API names do not establish
UI buttons, endpoint requests or availability. No metadata route was navigated.

| # | Related list | Configured sequence | API name | Source | Evidence |
| --- | --- | --- | --- | --- | --- |
| CD-24 | Locking Information | -1 | `Locking_Information__s` | metadata | M2 |
| CD-25 | Connected Records | 1 | `Connected_Records__s` | metadata | M2 |
| CD-26 | Notes | 2 | `Notes` | metadata | M2 |
| CD-27 | Child Campaigns | 3 | `Child_Campaigns` | metadata | M2 |
| CD-28 | Open Calls | 6 | `Calls` | metadata | M2 |
| CD-29 | Open Meetings | 7 | `Events` | metadata | M2 |
| CD-30 | Open Tasks | 8 | `Tasks` | metadata | M2 |
| CD-31 | Attachments | 9 | `Attachments` | metadata | M2 |
| CD-32 | Closed Tasks | 10 | `Tasks_History` | metadata | M2 |
| CD-33 | Closed Meetings | 11 | `Events_History` | metadata | M2 |
| CD-34 | Closed Calls | 12 | `Calls_History` | metadata | M2 |
| CD-35 | Leads | 15 | `Leads` | metadata | M2 |
| CD-36 | Deals | 16 | `Deals` | metadata | M2 |
| CD-37 | Contacts | 17 | `Contacts` | metadata | M2 |
| CD-38 | Checklists | 18 | `CheckLists` | metadata | M2 |

### Public-documentation and pattern inventory

The related-list descriptions below are documentation-only. Member Status is
supported for Leads/Contacts; the sources do not establish it for Deals.
No documented action was performed.

| # | Region / item | Documented capability or pattern; local rendering unknown | Source | Evidence |
| --- | --- | --- | --- | --- |
| CD-39 | Header: More | Opens campaign actions. | public docs | P1, Create Campaigns Individually → To clone campaigns |
| CD-40 | Header menu: Clone | Copies a campaign through a clone form. | public docs | P1, To clone campaigns |
| CD-41 | Header menu: Organize module details | Generic detail-page customization action, under top-right More; Campaigns availability unknown. | public docs | P3, Organize Page Details |
| CD-42 | Header: Edit | Candidate shared action only; Campaigns presence, position and enablement unknown. | pattern: accounts-record-detail.md:40 | AD-06 |
| CD-43 | Leads / Contacts members | Associate records and choose campaign Member Status. | public docs | P1, Add Leads/Contacts to the Campaign |
| CD-44 | Member Status update | Mass-update selected lead/contact members; distinct from Lead Status. | public docs | P1, Mass Update Campaign Member Status |
| CD-45 | Member filters | Filter Leads/Contacts by related-list fields. | public docs | P1, Filter Leads or Contacts |
| CD-46 | Deals | Lists deals attributed to the campaign; Member Status is unconfirmed. | public docs | P1, Associate Campaign with Other Records |
| CD-47 | Child Campaigns | Related list supports +New; selected leads/contacts can seed child campaigns. | public docs | P1, Create Child Campaigns |
| CD-48 | Open / Closed Activities | Documents open tasks/events and completed activities. | public docs | P1, Associate Campaign with Other Records |
| CD-49 | Activities: Calls | Generic activity association includes Log a Call; campaign-specific rendering unknown. | public docs | P2, Add Tasks, Events & Calls |
| CD-50 | Notes | Generic record notes support body, optional title and Save; Campaigns placement unknown. | public docs | P2, Add Notes; M2 supplies Campaigns relation separately |
| CD-51 | Attachments | Campaign-related documents. | public docs | P1, Associate Campaign with Other Records |

The generic P3 customization operation changes persisted preferences and is forbidden
in the reference CRM. Its inventory row describes documentation, not permission to
open or use it. Edit remains a pattern because the campaign-specific article does
not establish that button's header placement. No Delete, Share, Send Email or other
menu item is inferred from another module.

### Open questions

1. What is the actual header composition, record identity/business card, tag UI,
   navigation, Edit placement, More menu order, permission-dependent visibility and
   complete action set? Documentation proves only the capabilities cited above.
2. Are Overview and Timeline present, and what are their default states, filters,
   events, counters and empty states? Neither metadata nor these articles determines them.
3. Which configured fields render, in which columns/order, with what formatting,
   inline-edit affordances and empty values? Resolve the duplicate field sequence 16,
   Parent Campaign visibility and system/Connected To fields through future observation.
4. Which related lists actually render, in what rail/card order, with which counters,
   columns, paging, sorting, selection, row controls, hover actions and empty states?
   M2's visibility flags and sequence are insufficient to answer this.
5. Are activities grouped as Open/Closed Activities or split into Calls, Meetings
   and Tasks? How do history lists render? Public docs and metadata use different grouping.
6. Does Deals expose Member Status at all? Public docs establish that field only
   for Leads/Contacts; do not implement it for Deals from analogy.
7. What Member Status values/defaults and member permissions apply locally? What
   exact add/import/filter/update dialogs and validation states are available?
8. How are Child Campaigns, parent links, hierarchy depth/limits and member reuse
   presented in this account? The documented capability does not establish local UI.
9. Are Locking Information, Connected Records and Checklists visible or conditional?
   What are the actual Notes and Attachments controls, permissions and empty states?
10. What are the write-dependent validation, success/error messages, confirmation
    flows and resulting navigation? Not observable without a write; no such test
    is authorized. No network contract or guessed detail route is specified.

These questions record deferred observation, not a request to create reference data.
Revisit only if records become available independently and a later task authorizes
read-only observation. This document-only slice is complete within the CTO's scope;
no CD screenshot comparison is required.
