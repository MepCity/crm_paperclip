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
