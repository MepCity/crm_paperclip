# Campaigns

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

## Record detail

Status: **blocked — no accessible record** (MEP-758). This section records
an evidence limit, not a completed record-detail inventory or an implementation
contract. No Campaigns record was created, changed or deleted.

### Purpose and evidence boundary

The requested research covers the header, Overview and Timeline, related-list
rail and all related cards. The list opening instead paints an empty state,
with **Total Records 0** and **No Campaigns found.** There is no record link to
open. A record route was not guessed. Metadata describes configuration only;
it cannot establish the appearance or behaviour of an unobserved detail screen.

### Control inventory

No `CD-01…` identifiers are allocated: no record-detail control was observed.
Allocating numbers to expected controls would imply screenshot evidence that
does not exist. The list capture is an access prerequisite, outside the detail
inventory. It establishes neither absence nor availability of controls inside
a Campaigns record.

| Requested region | Observation | Ref |
| --- | --- | --- |
| Header, Edit, More Options and its open menu | not observed | none; no detail capture |
| Previous / next record arrows | not observed | none; no detail capture |
| Overview and detail sections | not observed | none; no detail capture |
| Timeline, filter opener and open filter | not observed | none; no detail capture |
| Related-list rail and counters | not observed | none; no detail capture |

### Leads card

Not observed. Columns, member rows, Member Status display, counters, row controls,
empty state and member-add controls are unknown.

### Contacts card

Not observed. Columns, member rows, Member Status display, counters, row controls,
empty state and member-add controls are unknown.

### Deals card

Not observed. Columns, Member Status applicability, counters, row controls, empty
state and association controls are unknown.

### Child Campaigns card

Not observed. Columns, counters, row controls, empty state and add controls are
unknown.

### Open and closed activities cards

Not observed. Grouping into combined or separate activity cards, headings,
counters, columns, row controls and empty states are unknown.

### Notes card

Not observed. Header, counters, note structure, empty state and add controls are
unknown.

### Attachments card

Not observed. Header, counters, columns, row controls, empty state and attachment
controls are unknown. Metadata alone does not establish whether this card is
painted in the current layout.

### Other related cards

Not observed. The exported related-list configuration also names Locking
Information, Connected Records and Checklists. These are **metadata-only**
leads for later observation, not a confirmed rail or card inventory. Activity
relations are individually configured for open and closed Calls, Meetings and
Tasks; their rendered grouping remains unknown.

### Fields and actions

The existing `metadata/modules/Campaigns/` export remains the data-model source
of truth. No exported field, permission flag or relationship is promoted to
observed UI behaviour here. No write flow, success/error state or validation
was exercised. No detail menu item, persisted preference or adding control was
operated.

### Capture refs

- `m7d-list-base`: prerequisite list, no clicks; painted empty state, total 0,
  no Campaigns record links. One identical-command retry after more than five
  minutes again showed total 0 and no record links; both attempts had 56 API
  calls, 0 clicks, 0 skipped clicks and 7 blocked background/telemetry requests.
  The saved slug contains the retry. Screenshot inspected as an image; `meta.json`,
  `controls.json` and non-GET network path/count audit checked.

The prerequisite capture contains 287 controls.json entries. All are excluded
from the CD inventory because they belong to the list/shell prerequisite, not
the inaccessible record detail; no detail inventory is claimed. No tabs were
closed.

Raw captures remain in the local research workspace and are not committed or
uploaded. No network contract or visual measurements are specified.

### Open questions

1. What read-only evidence source should be used for the record detail when
   the accessible list contains no records? This requires a scope/access
   decision; it does not authorize creating a reference record.
2. Every requested detail control, section and card above remains not observed,
   including hover-only controls and Timeline empty/filter states. None should
   be implemented from this section as if observed.

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


## Links from other modules

Status: **research completed within the MEP-815 observation boundary; UI Lead review pending** (MEP-755). The blocked Add Campaigns picker stays not observed: no retry, alternate route or guard change is permitted. Remaining passive observations and documented fallbacks are distinguished below.

### Purpose and evidence boundary

This research slice follows links into Campaigns from Leads, Contacts and Deals. Existing screen controls retain their nearest screen references. Only opening a record or an initial selection surface is in scope; no membership, Member Status, lookup value or saved filter is changed. The inherited capture rules prohibit filter toggles and record-selection toggles in this task, so criteria revealed only by those toggles remain **not observed**.

### Capture refs

- `m7-campaign-links-leads-base`: painted Leads list, total 10; initial gate, 59 API calls.
- `m7-campaign-links-lead-detail`: one record link opened; upper detail and Campaigns rail entry.
- `m7-campaign-links-lead-card`: record then Campaigns rail link; empty Campaigns card.
- `m7-campaign-links-lead-picker`: the same sequence then Add Campaigns; blocked request, no painted picker.
- `m7-campaign-links-leads-after`: final no-click list comparison (record count reported below).

### Control inventory — m7-campaign-links-leads-base

Shell: SH-01–SH-46 in [contacts.md](contacts.md), Leads active. MCP is the shortened SH-08 label. Channels and Threads are absent; Products is below the viewport. Shell right edge and utility strip are unchanged. Refresh exists in source but is not painted in the toolbar. Magnifiers and select chevrons belong to their inputs/selects.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-01 | View strip | All Leads | tab | left, first | same | seen (m7-campaign-links-leads-base) | M1 | L-01 |
| CX-02 | View strip | Three dots icon | icon button | after current view tab | same | seen (m7-campaign-links-leads-base) | M1 | L-02 |
| CX-03 | Toolbar | Filter | button | left group, first | same | seen (m7-campaign-links-leads-base) | M1 | L-03 |
| CX-04 | Toolbar | Sort | button | left group, second | same | seen (m7-campaign-links-leads-base) | M1 | L-04 |
| CX-05 | Toolbar | List view icon | icon button | view group, first | same | seen (m7-campaign-links-leads-base) | M1 | L-05 |
| CX-06 | Toolbar | Kanban view icon | icon button | view group, second | same | seen (m7-campaign-links-leads-base) | M1 | L-06 |
| CX-07 | Toolbar | Sheet view icon | icon button | view group, third | same | seen (m7-campaign-links-leads-base) | M1 | L-07 |
| CX-08 | Toolbar | Chart view icon | icon button | view group, fourth | same | seen (m7-campaign-links-leads-base) | M1 | L-08 |
| CX-09 | Toolbar | Timeline view icon | icon button | view group, fifth | same | seen (m7-campaign-links-leads-base) | M1 | L-09 |
| CX-10 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | same | seen (m7-campaign-links-leads-base) | M1 | L-10 |
| CX-11 | Toolbar | Down chevron | icon button | view group, seventh | same | seen (m7-campaign-links-leads-base) | M1 | L-11 |
| CX-12 | Toolbar | Create Lead | button | right group, first | same | seen (m7-campaign-links-leads-base) | M1 | L-12 |
| CX-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Lead | same | seen (m7-campaign-links-leads-base) | M6 | L-13 |
| CX-14 | Toolbar | Three dots / Actions | icon button | right group, far right | same | seen (m7-campaign-links-leads-base) | M1 | L-14 |
| CX-15 | Filter panel | Search | input | below Filter Leads by heading | same | seen (m7-campaign-links-leads-base) | M1 | L-15 |
| CX-16 | Filter panel | System Defined Filters | toggle | first section heading | same | seen (m7-campaign-links-leads-base) | M1 | L-16 |
| CX-17 | Filter panel | Activities | checkbox | system-defined section, Activities | same | seen (m7-campaign-links-leads-base) | M5 | L-17 |
| CX-18 | Filter panel | Campaigns | checkbox | system-defined section, Campaigns | Not toggled; criteria not observed | seen (m7-campaign-links-leads-base) | M7 | L-18 |
| CX-19 | Filter panel | Latest Email Status | checkbox | system-defined section, Latest Email Status | same | seen (m7-campaign-links-leads-base) | M10 | L-19 |
| CX-20 | Filter panel | Locked | checkbox | system-defined section, Locked | same | seen (m7-campaign-links-leads-base) | M1 | L-20 |
| CX-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | same | seen (m7-campaign-links-leads-base) | M1 | L-21 |
| CX-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | same | seen (m7-campaign-links-leads-base) | M1 | L-22 |
| CX-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | same | seen (m7-campaign-links-leads-base) | M1 | L-23 |
| CX-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | same | seen (m7-campaign-links-leads-base) | M1 | L-24 |
| CX-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | same | seen (m7-campaign-links-leads-base) | P3 | L-25 |
| CX-26 | Filter panel | Filter By Fields | toggle | second section heading | same | seen (m7-campaign-links-leads-base) | M1 | L-26 |
| CX-27 | Filter panel | Address | checkbox | field section, first | same | seen (m7-campaign-links-leads-base) | M3 | new |
| CX-28 | Filter panel | Address - City | checkbox | field section, second | same | seen (m7-campaign-links-leads-base) | M2 | new |
| CX-29 | Filter panel | Address - Country / Region | checkbox | field section, third | same | seen (m7-campaign-links-leads-base) | M2 | new |
| CX-30 | Filter panel | Address - Flat / House No./ Building / Apartment Name | checkbox | field section, fourth, partly clipped | same | seen (m7-campaign-links-leads-base) | M2 | new |
| CX-33 | Table | Sliders icon | icon button | header, far right overlay | same | seen (m7-campaign-links-leads-base) | M11 | L-33 |
| CX-34 | Table | Select all checkbox | checkbox | header, before activity column | same | seen (m7-campaign-links-leads-base) | M1 | L-34 |
| CX-35 | Table | Lead Name | column header | first text column | same | seen (m7-campaign-links-leads-base) | M1 | L-35 |
| CX-36 | Table | All with down arrow | select | within Lead Name header, right | same | seen (m7-campaign-links-leads-base) | M1 | L-36 |
| CX-37 | Table | Company | column header | second text column | same | seen (m7-campaign-links-leads-base) | M3 | new |
| CX-38 | Table | Email | column header | third text column | same | seen (m7-campaign-links-leads-base) | M1 | L-38 |
| CX-39 | Table | Phone (partly clipped) | column header | fourth text column, right edge | same | seen (m7-campaign-links-leads-base) | M1 | L-39 |
| CX-40 | Table | Record selection checkbox | checkbox | each visible row, before activity column | same | seen (m7-campaign-links-leads-base) | M1 | L-40 |
| CX-41 | Table | Task and call activity flags | badge | rows with activity, before Lead Name | same | seen (m7-campaign-links-leads-base) | M5 | new |
| CX-42 | Table | Lead record link | link | Lead Name cells | Opens the record detail | seen (m7-campaign-links-leads-base) | M1 | L-42 |
| CX-44 | Table | Email address link | link | Email cells | same | seen (m7-campaign-links-leads-base) | M10 | L-44 |
| CX-48 | List footer | Total Records | badge | left | same | seen (m7-campaign-links-leads-base) | M1 | L-48 |
| CX-49 | List footer | Displayed record range | badge | right group, between arrows | same | seen (m7-campaign-links-leads-base) | M1 | L-49 |
| CX-50 | List footer | Previous | icon button | right group, before range | same | seen (m7-campaign-links-leads-base) | M1 | L-50 |
| CX-51 | List footer | Next | icon button | right group, after range | same | seen (m7-campaign-links-leads-base) | M1 | L-51 |

Absent here: Contacts Account record link L-43; Contacts field filters L-27–L-32 are replaced by the visible address fields. Row hover actions L-45–L-47 are not painted. Company cells are plain text. Phone and Email are clipped by the table viewport. No campaign filter was enabled.

### Control inventory — m7-campaign-links-lead-detail

Shell: as in the Leads list baseline. Lead detail follows [record-detail.md](record-detail.md), especially Layout and Related-list cards. Numbered nearest references below use [contacts-record-detail.md](contacts-record-detail.md). Static identity, field labels and values are not controls. The record portrait is displayed; no upload interaction was tested.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-101 | Header | Back | icon button | leftmost | same | seen (m7-campaign-links-lead-detail) | M1 | D-01 |
| CX-102 | Header | Record portrait | icon button | after Back | same | seen (m7-campaign-links-lead-detail) | M6 | new |
| CX-104 | Header | Add Tags | button | below identity | same | seen (m7-campaign-links-lead-detail) | M6 | D-04 |
| CX-105 | Header | Send Email | button | right actions, first | same | seen (m7-campaign-links-lead-detail) | M10 | D-05 |
| CX-106 | Header | Edit | button | right actions, third | same | seen (m7-campaign-links-lead-detail) | M1 | D-06 moved |
| CX-107 | Header | More Options / three dots | icon button | right actions, fourth | same | seen (m7-campaign-links-lead-detail) | M1 | D-07 moved |
| CX-108 | Header | Previous Record | icon button | after More Options | same | seen (m7-campaign-links-lead-detail) | M1 | D-08 |
| CX-109 | Header | Next Record | icon button | far right | same | seen (m7-campaign-links-lead-detail) | M1 | D-09 |
| CX-110 | Related-list rail | Notes | link | rail, row 1 | same | seen (m7-campaign-links-lead-detail) | M6 | D-10 |
| CX-111 | Related-list rail | Connected Records | link | rail, row 2 | same | seen (m7-campaign-links-lead-detail) | ? | D-11 |
| CX-112 | Related-list rail | Attachments | link | rail, row 4 | same | seen (m7-campaign-links-lead-detail) | M6 | D-12 moved |
| CX-113 | Related-list rail | Cadences | link | rail, row 3 | same | seen (m7-campaign-links-lead-detail) | P3 | D-13 moved |
| CX-115 | Related-list rail | Open Activities | link | rail, row 6 | same | seen (m7-campaign-links-lead-detail) | M5 | D-15 moved |
| CX-116 | Related-list rail | Closed Activities | link | rail, row 7 | same | seen (m7-campaign-links-lead-detail) | M5 | D-16 moved |
| CX-117 | Related-list rail | Invited Meetings | link | rail, row 8 | same | seen (m7-campaign-links-lead-detail) | M5 | D-17 moved |
| CX-118 | Related-list rail | Products | link | rail, row 5 | same | seen (m7-campaign-links-lead-detail) | P2 | D-18 moved |
| CX-123 | Related-list rail | Emails | link | rail, row 9 | same | seen (m7-campaign-links-lead-detail) | M10 | D-23 moved |
| CX-125 | Related-list rail | Campaigns | link | rail, row 10 | Scrolls to Campaigns card | seen (m7-campaign-links-lead-detail) | M7 | D-25 moved |
| CX-126 | Related-list rail | Social | link | rail, row 11 | same | seen (m7-campaign-links-lead-detail) | M15 | D-26 moved |
| CX-128 | Related-list rail | Voice of the Customer | link | rail, row 12 | same | seen (m7-campaign-links-lead-detail) | P3 | D-28 moved |
| CX-129 | Related-list rail | Add Related List | link | below last related-list link | same | seen (m7-campaign-links-lead-detail) | M11 | D-29 |
| CX-132 | Tab row | Related-list rail visibility icon | icon button | before Overview | same | seen (m7-campaign-links-lead-detail) | M1 | D-32 |
| CX-133 | Tab row | Overview | tab | first tab, selected | same | seen (m7-campaign-links-lead-detail) | M1 | D-33 |
| CX-134 | Tab row | Timeline | tab | second tab | same | seen (m7-campaign-links-lead-detail) | M1 | D-34 |
| CX-135 | Tab row | Last Update indicator | badge | far right | same | seen (m7-campaign-links-lead-detail) | M1 | D-35 |
| CX-136 | Business card | Email address link | link | Email field value | same | seen (m7-campaign-links-lead-detail) | M10 | D-36 |
| CX-137 | Business card | Phone call icon | icon button | after Phone value | same | seen (m7-campaign-links-lead-detail) | M5 | D-37 |
| CX-138 | Details card | Hide Details | button | card header, left | same | seen (m7-campaign-links-lead-detail) | M1 | D-38 |
| CX-140 | Details card | Email address link | link | Lead Information, right column, Email value | same | seen (m7-campaign-links-lead-detail) | M10 | D-40 moved |
| CX-141 | Details card | Phone call icon | icon button | Lead Information, left column, after Phone value | same | seen (m7-campaign-links-lead-detail) | M5 | D-41 moved |
| CX-142 | Header | Convert | button | right actions, second | not operated | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-143 | Related-list rail | Add Link | link | below Links heading | not operated | seen (m7-campaign-links-lead-detail) | M11 | new |
| CX-144.1 | Stage bar | Contact in Future (partly clipped) | button | visible stage 1, left to right | not operated; record-detail.md › Layout | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-144.2 | Stage bar | Contacted | button | visible stage 2, left to right | not operated; record-detail.md › Layout | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-144.3 | Stage bar | Junk Lead | button | visible stage 3, left to right | not operated; record-detail.md › Layout | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-144.4 | Stage bar | Lost Lead (current, with selector caret) | button | visible stage 4, left to right | not operated; record-detail.md › Layout | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-144.5 | Stage bar | Not Contacted | button | visible stage 5, left to right | not operated; record-detail.md › Layout | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-144.6 | Stage bar | Pre-Qualified | button | visible stage 6, left to right | not operated; record-detail.md › Layout | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-144.7 | Stage bar | Not Qualified | button | visible stage 7, left to right | not operated; record-detail.md › Layout | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-145.1 | Stage bar | Left chevron | icon button | left edge of stage sequence | not operated | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-145.2 | Stage bar | Right chevron | icon button | right edge of stage sequence | not operated | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-146 | Stage bar | Terminal-status button and chevron | button / select | right of stage sequence | not operated | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-147 | Business card | Mobile call icon | icon button | after Mobile value | not operated | seen (m7-campaign-links-lead-detail) | M5 | new |

Absent here: Contacts Account identity link, Deals/Cases/Quotes/order/invoice/Reporting Contacts rail entries and activity counters. Stage sequence is Lead Status; it is not a Campaign Member Status control. No Campaigns badge is painted in the rail.

### Control inventory — m7-campaign-links-lead-card (difference)

The Campaigns rail link scrolls its existing card beneath the fixed Overview/Timeline row. It does not open a separate Campaigns record. The card has a left-aligned Campaigns heading and right-aligned Add Campaigns button. No counter, column header, member row, Member Status or row action is painted. The empty body reads `No records found`.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-148 | Campaigns card | Add Campaigns | button | header, right | Opening attempted separately; blocked before picker painted; no association performed | seen (m7-campaign-links-lead-card) | M7 | contacts-record-detail.md D-86; record-detail.md › Related-list cards |
| CX-149 | Related-list rail | Plus icon | icon button | selected Campaigns row, right | not operated | seen (m7-campaign-links-lead-card) | M7 | new |
| CX-150 | Related-list rail | Small list icon | icon button | right of Related List heading | not operated; no preference changed | seen (m7-campaign-links-lead-card) | M11 | new |
| CX-151 | Social card | Associate Twitter | link | left stack, first | not operated | seen (m7-campaign-links-lead-card) | M15 | contacts-record-detail.md D-87 |
| CX-152 | Social card | Associate Facebook | link | left stack, second | not operated | seen (m7-campaign-links-lead-card) | M15 | contacts-record-detail.md D-88 |
| CX-153 | Content edge | Scroll To Top | icon button | lower right | not operated | seen (m7-campaign-links-lead-card) | M1 | contacts-record-detail.md D-63 |

Rest: as in `m7-campaign-links-lead-detail`; scrolling replaces the visible stage strip, business card and upper field rows (CX-136–CX-138, CX-140–CX-141, CX-144–CX-147). Header, rail, tabs and utility strip remain visible. Social's informational illustration and empty-state text are not controls.

### Source reconciliation — m7-campaign-links-leads-base

Every source entry is mapped below. Ordinals are one-based evidence references, never live selectors. Hidden elements and off-viewport fields do not establish visible controls. Shell grouping resolves to SH-01–SH-46 and their wrappers in contacts.md.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Shell SH-01–SH-46 (contacts.md); structural wrappers/duplicate descendants included | 1–4, 11–12, 14–15, 17–18, 20–21, 23–24, 26–27, 29–32, 34–68, 83, 85, 87–92, 95, 98, 101–102, 105–108, 172–173, 494–505 |
| Excluded: zero-area hidden/inactive element | 5–10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 86, 93–94, 96–97, 99–100, 103–104, 109–112, 137, 141, 288–289, 293–294, 466–474, 479–493, 506 |
| Excluded: outside viewport | 69–81, 174–287, 310–312, 326–328, 341–343, 356–358, 371–373, 386–388, 401–403, 416–418, 432–434, 447–449, 463–465, 513 |
| Excluded: structural container / duplicate wrapper | 113, 122, 138, 290–291, 295–300, 303, 509–512, 514 |
| CX-01 | 114 |
| CX-02 | 115–119 |
| CX-03 | 120 |
| CX-04 | 121 |
| CX-05 | 123 |
| CX-06 | 124 |
| CX-07 | 125 |
| CX-08 | 126 |
| CX-09 | 127 |
| CX-10 | 128 |
| CX-11 | 129–130 |
| Excluded: refresh DOM affordance not painted in screenshot | 131–132 |
| CX-12 | 133 |
| CX-13 | 134–135 |
| CX-14 | 136, 507 |
| CX-15 | 139–140, 508 |
| CX-16 | 142 |
| Excluded: structural container or static label/value | 143, 163, 313–316, 319–320, 322–323, 325, 329–331, 334–335, 337–338, 340, 344–346, 349–350, 352–353, 355, 359–361, 364–365, 367–368, 370, 374–376, 379–380, 382–383, 385, 389–391, 394–395, 397–398, 400, 404–406, 409–410, 412–413, 415, 419–421, 424, 426, 428–429, 431, 435–437, 440–441, 443–444, 446, 450–452, 455, 457, 459–460, 462 |
| CX-17 | 144–145 |
| CX-18 | 146–147 |
| CX-19 | 148–149 |
| CX-20 | 150–151 |
| CX-21 | 152–153 |
| CX-22 | 154–155 |
| CX-23 | 156–157 |
| CX-24 | 158–159 |
| CX-25 | 160–161 |
| CX-26 | 162 |
| CX-27 | 164–165 |
| CX-28 | 166–167 |
| CX-29 | 168–169 |
| CX-30 | 170–171 |
| CX-33 | 292 |
| CX-34 | 301–302 |
| CX-35 | 304 |
| CX-36 | 305–306 |
| CX-37 | 307 |
| CX-38 | 308 |
| CX-39 | 309 |
| CX-40 | 317–318, 332–333, 347–348, 362–363, 377–378, 392–393, 407–408, 422–423, 438–439, 453–454 |
| CX-42 | 321, 336, 351, 366, 381, 396, 411, 427, 442, 458 |
| CX-44 | 324, 339, 354, 369, 384, 399, 414, 430, 445, 461 |
| CX-41 | 425, 456 |
| CX-48 | 475 |
| CX-49 | 476 |
| CX-50 | 477 |
| CX-51 | 478 |

Self-check: 514 source entries; zero unresolved. Repeated row selection, record links, email links and activity flags reuse their numbers. The screenshot also supplies the utility strip final icon, already SH-46.

### Source reconciliation — m7-campaign-links-lead-detail

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Shell SH-01–SH-46 (contacts.md); structural wrappers/duplicate descendants included | 1–4, 11–12, 14–15, 17–18, 20–21, 23–24, 26–27, 29–32, 34–68, 83, 85–91, 94, 97, 100–101, 104–107, 426–437, 442, 450 |
| Excluded: zero-area hidden/inactive element | 5–10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 92–93, 95–96, 98–99, 102–103, 111, 116, 118, 129, 133, 136, 139, 142, 145, 148, 151, 154, 157, 160, 163, 166, 186–187, 285, 297, 301, 313, 327, 330–331, 334, 337–340, 344, 362, 376–377, 389–390, 398–399, 407–425, 438 |
| Excluded: outside viewport | 69–81, 282–284, 286–296, 298–300, 302–312, 314–326, 328–329, 332–333, 335–336, 341–343, 345–361, 363–375, 378–388, 391–397, 400–406, 443–449, 460–464 |
| Excluded: structural wrapper or duplicate static label | 108, 451, 454–458 |
| CX-101 | 109–110 |
| CX-102 | 112–113 |
| Excluded: static heading/identity or structural wrapper | 114–115, 130, 170, 174 |
| CX-104 | 117 |
| CX-105 | 119–120 |
| CX-142 | 121–122 |
| CX-106 | 123–124 |
| CX-107 | 125–126 |
| CX-108 | 127 |
| CX-109 | 128 |
| CX-110 | 131–132 |
| CX-111 | 134–135 |
| CX-113 | 137–138 |
| CX-112 | 140–141 |
| CX-118 | 143–144 |
| CX-115 | 146–147 |
| CX-116 | 149–150 |
| CX-117 | 152–153 |
| CX-123 | 155–156 |
| CX-125 | 158–159 |
| CX-126 | 161–162 |
| CX-128 | 164–165 |
| CX-129 | 167 |
| CX-143 | 168 |
| CX-132 | 169 |
| CX-133 | 171 |
| CX-134 | 172 |
| CX-135 | 173 |
| CX-145.1 | 175 |
| CX-145.2 | 184 |
| Excluded: stage item clipped behind related-list rail | 176 |
| CX-144.1 | 177 |
| CX-144.2 | 178 |
| CX-144.3 | 179 |
| CX-144.4 | 180 |
| CX-144.5 | 181 |
| CX-144.6 | 182 |
| CX-144.7 | 183 |
| CX-146 | 185 |
| Excluded: static field label/value or structural wrapper; inline edit not entered | 188–201, 203–221, 224–280 |
| CX-136 | 202 |
| CX-138 | 222–223 |
| CX-140 | 281 |
| CX-137 | 439 |
| CX-147 | 440 |
| CX-141 | 441 |
| Excluded: structural container or static label/value | 452–453, 459 |

Self-check: 464 source entries; zero unresolved. Static field wrappers do not establish hover/edit controls.

### Control inventory — m7-campaign-links-lead-picker (difference)

No picker controls painted. Add Campaigns initiated a blocked legacy request to `POST /crm/<org>/ShowMultiValuesForAdd.do` (one occurrence, no response status). The screenshot remains on the empty Campaigns card with a thin loading indicator at the top edge; source text also includes Loading. This is a blocked/loading state, not a selection-dialog design. There is no basis for inventing its title, columns, search placeholder, selection controls, Member Status choices, action buttons or defaults.

Rest: as in `m7-campaign-links-lead-card`; CX-149 and CX-150 are no longer painted because the prior rail hover is gone. No overlay covers the base. No retry, alternate route or longer wait was attempted after this stop condition.

### Scope coverage and reuse evidence

| Requested surface | Evidence and nearest Ref | Result in this slice |
| --- | --- | --- |
| Leads Campaigns card | CX-125, CX-148; record-detail.md › Related-list cards | Seen empty; title, right action and empty message; no counter or table |
| Contacts Campaigns card | CX-425, CX-486; contacts-record-detail.md D-25, D-86 | Recaptured empty under MEP-815; no counter, columns or member rows |
| Deals Campaigns card | m7-campaign-links-deal-detail; deals-record-detail.md › Related-list rail; CX-M2 | No Campaigns relation in metadata or current rail. No card inferred |
| Detail Add Campaigns opening | CX-148; m7-campaign-links-lead-picker | Attempt blocked; dialog not observed |
| List Add to Campaigns entry | CX-14.10 (Leads), CX-314.9 (Contacts); contacts.md L-14.9 | Both no-selection menus recaptured; no item selected; bulk dialog/selection toolbar not observed |
| Deals Campaign Source field and lookup trigger | deals-form.md DF-23–DF-24 | Earlier create form shows an optional lookup at right row 6; MEP-815 forbids opening the create/edit lookup; metadata fallback CX-211 |
| Deals Campaign Source detail value | m7-campaign-links-deal-detail; CX-211 | Field label exists in offscreen source; painted value/link not observed; no fabricated value or navigation |
| Leads Campaigns filter | CX-18; list-views.md › Left filters | Seen unchecked, second system filter; no toggle, criterion or filter execution |
| Contacts Campaigns filter | CX-318; contacts.md L-18 | Seen unchecked in current list; criteria documented, never enabled |
| Deals Campaign Source filter | deals.md DL-66 | Current CX-566 shows the unchecked field filter, third row; Campaigns system filter absent; criteria not enabled |
| Campaign members and Member Status | Empty Leads and Contacts cards; CX-D1–CX-D3 | Current populated UI not observed; documented headers and row actions are separate CX-200–CX-210 fallbacks |

Exported Leads and Contacts related-list metadata both mark Campaigns visible and allow edit/disassociate while create, delete, bulk edit and assign are false. These are relation capabilities, not evidence of rendered buttons or write outcomes. Deals exports Campaign_Source as a Campaigns lookup but has no Campaigns related-list definition. No identifiers or record values are reproduced.

### Flows and state boundaries

1. Open a Leads record from the list. The host detail displays its existing related-list rail.
2. Open the named Campaigns rail entry. The central pane scrolls to the Campaigns card while header, rail and tabs stay fixed.
3. Empty card: the heading and Add Campaigns action remain; the body shows No records found. There are no member rows to inspect.
4. The earlier Add Campaigns attempt was blocked; the picker remained unpainted and the required Leads after comparison was clean. MEP-815 forbids retry and authorizes only the remaining passive observations and documentary fallback. Repeat the safe record/rail flow for Contacts; do not click Add Campaigns there.

No field was filled, checkbox toggled, option selected or preference changed. No add, save, remove, send, assign, status change or confirmation control was used. Current search results, multi-selection presentation, cancellation, submission validation, success/error messages and post-write behaviour are **not observed**. The separately labelled documentary fallback establishes only the supported behaviours described there. Nothing in the loading screenshot establishes a server validation error.

### Open questions and resolved safety decision

- Resolved by CTO in MEP-815: never retry or allowlist the blocked legacy picker. Complete its contract with public documentation and metadata, using the existing multi-record picker as an interim implementation pattern.
- Filter and record-selection toggles remain prohibited. Campaign filter criteria and bulk dialogs use documentary evidence; their current rendered states remain not observed.
- Campaign Source is read only in record detail; no create/edit lookup opening is permitted. Existing lookup components provide the interim implementation pattern.
- Populated Campaigns-card columns, counters, Member Status and row affordances remain not observable from the empty member state. Do not create or associate a record to obtain them.
- Hover-only controls beyond the visible rail plus remain not observed. No browser tab was manually closed; the capture runtime cleaned up only its own capture tabs.

### Source reconciliation — m7-campaign-links-lead-card

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Shell SH-01–SH-46 (contacts.md); structural wrappers/duplicate descendants included | 1–4, 11–12, 14–15, 17–18, 20–21, 23–24, 26–27, 29–32, 34–68, 83, 85–91, 94, 97, 100–101, 104–107, 367, 428–439, 452 |
| Excluded: zero-area hidden/inactive element | 5–10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 92–93, 95–96, 98–99, 102–103, 111, 116, 118, 129, 134, 137, 140, 143, 146, 149, 152, 155, 158, 161, 165, 168, 188–189, 210, 216, 242, 247, 263, 287, 299, 303, 315, 329, 332–333, 336, 339–342, 346, 364, 378–379, 391–392, 400–401, 410–427, 440 |
| Excluded: outside viewport | 69–81, 176–187, 190–209, 211–215, 217–241, 243–246, 248–262, 264–286, 288–298, 300–302, 304–314, 316–328, 330–331, 334–335, 337–338, 343–345, 347–363, 365–366, 368, 393–399, 402–408, 441–449, 456–464, 466 |
| Excluded: static heading/identity/empty-state content or structural wrapper | 108, 114–115, 130, 172, 369–377, 380–381, 384–386, 453–455, 465 |
| CX-101 | 109–110 |
| CX-102 | 112–113 |
| CX-104 | 117 |
| CX-105 | 119–120 |
| CX-142 | 121–122 |
| CX-106 | 123–124 |
| CX-107 | 125–126 |
| CX-108 | 127 |
| CX-109 | 128 |
| CX-150 | 131 |
| CX-110 | 132–133 |
| CX-111 | 135–136 |
| CX-113 | 138–139 |
| CX-112 | 141–142 |
| CX-118 | 144–145 |
| CX-115 | 147–148 |
| CX-116 | 150–151 |
| CX-117 | 153–154 |
| CX-123 | 156–157 |
| CX-125 | 159–160 |
| CX-149 | 162 |
| CX-126 | 163–164 |
| CX-128 | 166–167 |
| CX-129 | 169 |
| CX-143 | 170 |
| CX-132 | 171 |
| CX-133 | 173 |
| CX-134 | 174 |
| CX-135 | 175 |
| CX-148 | 382–383 |
| CX-151 | 387–388, 450 |
| CX-152 | 389–390, 451 |
| CX-153 | 409 |

Self-check: 466 source entries; zero unresolved. Fixed header/rail/tab controls retain their base numbers; offscreen fields remain excluded. No picker controls are inferred.

### Source reconciliation — m7-campaign-links-lead-picker

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Shell SH-01–SH-46 (contacts.md); structural wrappers/duplicate descendants included | 1–4, 11–12, 14–15, 17–18, 20–21, 23–24, 26–27, 29–32, 34–68, 83, 85–91, 94, 97, 100–101, 104–107, 365, 412, 428–439, 451 |
| Excluded: zero-area hidden/inactive element | 5–10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 92–93, 95–96, 98–99, 102–103, 111, 116, 118, 129, 133, 136, 139, 142, 145, 148, 151, 154, 157, 160, 163, 166, 186–187, 208, 214, 240, 245, 261, 285, 297, 301, 313, 327, 330–331, 334, 337–340, 344, 362, 376–377, 389–390, 398–399, 408–411, 413–427 |
| Excluded: outside viewport | 69–81, 174–185, 188–207, 209–213, 215–239, 241–244, 246–260, 262–284, 286–296, 298–300, 302–312, 314–326, 328–329, 332–333, 335–336, 341–343, 345–361, 363–364, 366, 391–397, 400–406, 440–448, 455–463, 465 |
| Excluded: static heading/identity/empty-state content or structural wrapper | 108, 114–115, 130, 170, 367–375, 378–379, 382–384, 452–454, 464 |
| CX-101 | 109–110 |
| CX-102 | 112–113 |
| CX-104 | 117 |
| CX-105 | 119–120 |
| CX-142 | 121–122 |
| CX-106 | 123–124 |
| CX-107 | 125–126 |
| CX-108 | 127 |
| CX-109 | 128 |
| CX-110 | 131–132 |
| CX-111 | 134–135 |
| CX-113 | 137–138 |
| CX-112 | 140–141 |
| CX-118 | 143–144 |
| CX-115 | 146–147 |
| CX-116 | 149–150 |
| CX-117 | 152–153 |
| CX-123 | 155–156 |
| CX-125 | 158–159 |
| CX-126 | 161–162 |
| CX-128 | 164–165 |
| CX-129 | 167 |
| CX-143 | 168 |
| CX-132 | 169 |
| CX-133 | 171 |
| CX-134 | 172 |
| CX-135 | 173 |
| CX-148 | 380–381 |
| CX-151 | 385–386, 449 |
| CX-152 | 387–388, 450 |
| CX-153 | 407 |

Self-check: 465 source entries; zero unresolved. Fixed header/rail/tab controls retain their base numbers; offscreen fields remain excluded. No picker controls are inferred.

### Final list comparison — m7-campaign-links-leads-after

The final screenshot was opened as an image. The list is painted, has 59 API calls and retains total 10, ten record links and every initial record link. Its 514 source entries use the Leads-base reconciliation unchanged: only hidden overlay ordering differs at 491–493, all zero-area and excluded. No visible control differs; no record disappeared.

Self-check: controls.json 514 entries, zero unresolved; inventory CX-01–CX-51 (gaps intentional) and SH references as in the initial list. Rest: as in m7-campaign-links-leads-base; no overlay.

### Documentary fallback — approved in MEP-815

Public help was read on 2026-10-17. Source keys intentionally use neutral article titles and section names; source URLs are omitted under the repository naming rule. These sources describe supported behaviour, not this installation's current rendering. No public documentation instruction was executed in the reference application.

| Key | Source | Relevant section |
| --- | --- | --- |
| CX-D1 | Public help, Associating Records | Associate Campaigns |
| CX-D2 | Public help, Creating Campaigns | From the Lead/Contact Module; From the Record Detail Page; Customize Campaign Member Status |
| CX-D3 | Public help, Advanced Filters | Track records based on Campaign responses |
| CX-M1 | Local research metadata, modules/Leads/related_lists.json and modules/Contacts/related_lists.json | Visible Campaigns relation |
| CX-M2 | Local research metadata, modules/Deals/fields.json and related_lists.json | Campaign_Source lookup; no Campaigns related-list definition |
| CX-M3 | Local research metadata, modules/Campaigns/fields.json | Campaign fields and picklists; no Member Status field export |

| # | Region | Control / behaviour | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-200 | Populated Campaigns card | Campaign Name, Status, Type, Start Date, End Date, Expected Revenue, Budgeted Cost, Member Status | column headers | document order; current positions not observed | Documented sortable fields; current column subset/order not observed | docs (CX-D1) | M7 | new |
| CX-201 | Populated Campaigns card | Edit | row action | current position not observed | Changes membership status; never operated | docs (CX-D1) | M7 | new |
| CX-202 | Populated Campaigns card | Remove | row action | current position not observed | Removes the association; never operated | docs (CX-D1) | M7 | new |
| CX-203 | Add Campaigns selection | Campaign member Status | select | not observed | Documented status choice for association; this is separate from Campaign Status and Lead Status | docs (CX-D1, CX-D2) | M7 | new |
| CX-204 | Add Campaigns selection | Campaign selection | checkboxes | not observed | Supports selecting multiple campaigns for one lead | docs (CX-D1) | M7 | new |
| CX-205 | Add Campaigns selection | Add to Lead | button | not observed | Documented submission label in CX-D1; not an observed current label | docs (CX-D1) | M7 | new |
| CX-206 | List action flow | Existing / Create New | choices | not observed | Documented alternatives after selecting Leads or Contacts and Add to Campaigns; no selection performed | docs (CX-D2) | M7 | contacts.md L-14.9 |
| CX-207 | Campaigns filter | Campaign name | search / selection | not observed | Suggestions support up to five campaigns | docs (CX-D3) | M7 | CX-18 |
| CX-208 | Campaigns filter | Campaign type and Campaign status | selects | not observed | Narrow campaign suggestions | docs (CX-D3) | M7 | new |
| CX-209 | Campaigns filter | Member status | criterion | not observed | Applies to offline and online campaigns; values may be customized | docs (CX-D3) | M7 | new |
| CX-210 | Campaigns filter | Service status | conditional criterion | not observed | Available for integrated online campaigns; synchronized responses differ from manually editable Member Status | docs (CX-D3) | M7 | new |
| CX-211 | Deals detail/form/filter | Campaign Source | lookup | detail position not observed; form right row 6 in earlier research | Optional, filterable, single Campaigns relation; not a membership table | metadata (CX-M2) | M7 | deals-form.md DF-23–DF-24; deals.md DL-66 |

The interim selector contract approved by CTO is the existing record-picker pattern: search, multiple campaign selection, Add and Cancel. Search wording, result columns, paging, preselected items, duplicate-association handling, no-result state, close behaviour, validation and final action labels remain not observed. These are implementation fallback choices, not claims about the blocked window. Existing Campaign Source lookup uses the shared single-record lookup pattern; its search dialog is not observed.

CX-D1 documents a status selector, campaign checkboxes and Add to Lead; CX-D2 describes a newer select/Next/Confirm detail flow and an Existing/Create New bulk flow. Their differences cannot establish which dialog the installed legacy route renders. Preserve this ambiguity as an open question; do not combine the two documents into an invented observed sequence.

The metadata export contains no Member Status field or member-status option catalog. Campaigns Status and Type picklists are different fields and must not supply membership options. The installation's exact member-status options, order and default remain open.

Deals Campaign Source operators, empty/nonempty filtering, multiple-value matching and matching semantics between multiple campaigns/statuses are not established by these documents or field metadata; keep them open rather than assuming a generic operator set. No Campaigns system filter is inferred for Deals.

### Control inventory — m7-campaign-links-contacts-base

Shell: SH-01–SH-46 in contacts.md; Contacts active. MCP is the shortened SH-08 label; Channels/Threads absent; Products offscreen. Fixed utility edge includes image-only SH-46. No shell action was used.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-301 | View strip | All Contacts | tab | left, first | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-01 |
| CX-302 | View strip | Three dots icon | icon button | after current view tab | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-02 |
| CX-303 | Toolbar | Filter | button | left group, first | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-03 |
| CX-304 | Toolbar | Sort | button | left group, second | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-04 |
| CX-305 | Toolbar | List view icon | icon button | view group, first | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-05 |
| CX-306 | Toolbar | Kanban view icon | icon button | view group, second | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-06 |
| CX-307 | Toolbar | Sheet view icon | icon button | view group, third | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-07 |
| CX-308 | Toolbar | Chart view icon | icon button | view group, fourth | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-08 |
| CX-309 | Toolbar | Timeline view icon | icon button | view group, fifth | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-09 |
| CX-310 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-10 |
| CX-311 | Toolbar | Down chevron | icon button | view group, seventh | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-11 |
| CX-312 | Toolbar | Create Contact | button | right group, first | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-12 |
| CX-313 | Toolbar | Down arrow / More | icon button | right group, attached to Create Contact | same | seen (m7-campaign-links-contacts-base) | M6 | contacts.md L-13 |
| CX-314 | Toolbar | Three dots / Actions | icon button | right group, far right | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-14 |
| CX-315 | Filter panel | Search | input | below Filter Contacts by heading | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-15 |
| CX-316 | Filter panel | System Defined Filters | toggle | first section heading | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-16 |
| CX-317 | Filter panel | Activities | checkbox | system-defined section, Activities | same | seen (m7-campaign-links-contacts-base) | M5 | contacts.md L-17 |
| CX-318 | Filter panel | Campaigns | checkbox | system-defined section, Campaigns | Unchecked; not toggled; criteria documented below | seen (m7-campaign-links-contacts-base) | M7 | contacts.md L-18 |
| CX-319 | Filter panel | Latest Email Status | checkbox | system-defined section, Latest Email Status | same | seen (m7-campaign-links-contacts-base) | M10 | contacts.md L-19 |
| CX-320 | Filter panel | Locked | checkbox | system-defined section, Locked | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-20 |
| CX-321 | Filter panel | Record Action | checkbox | system-defined section, Record Action | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-21 |
| CX-322 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-22 |
| CX-323 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-23 |
| CX-324 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-24 |
| CX-325 | Filter panel | Cadences | checkbox | system-defined section, Cadences | same | seen (m7-campaign-links-contacts-base) | P3 | contacts.md L-25 |
| CX-326 | Filter panel | Filter By Fields | toggle | second section heading | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-26 |
| CX-327 | Filter panel | Account Name | checkbox | field section, Account Name | same | seen (m7-campaign-links-contacts-base) | M3 | contacts.md L-27 |
| CX-328 | Filter panel | Assistant | checkbox | field section, Assistant | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-28 |
| CX-329 | Filter panel | Asst Phone | checkbox | field section, Asst Phone | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-29 |
| CX-330 | Filter panel | Connected To | checkbox | field section, Connected To | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-30 |
| CX-331 | Filter panel | Contact Name | checkbox | field section, Contact Name | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-31 |
| CX-332 | Filter panel | Contact Owner (partly clipped) | checkbox | field section, Contact Owner (partly clipped) | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-32 |
| CX-333 | Table | Sliders icon | icon button | header, far right overlay | same | seen (m7-campaign-links-contacts-base) | M11 | contacts.md L-33 |
| CX-334 | Table | Select all checkbox | checkbox | header, before activity column | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-34 |
| CX-335 | Table | Contact Name | column header | first text column | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-35 |
| CX-336 | Table | All with down arrow | select | within Contact Name header, right | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-36 |
| CX-337 | Table | Account Name | column header | second text column | same | seen (m7-campaign-links-contacts-base) | M3 | contacts.md L-37 |
| CX-338 | Table | Email | column header | third text column | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-38 |
| CX-339 | Table | Phone (partly clipped) | column header | fourth text column, right edge | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-39 |
| CX-340 | Table | Record selection checkbox | checkbox | each visible row, before activity column | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-40 |
| CX-341 | Table | Call activity flag | badge | rows with activity, before Contact Name | same | seen (m7-campaign-links-contacts-base) | M5 | contacts.md L-41 |
| CX-342 | Table | Contact record link | link | Contact Name cells | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-42 |
| CX-343 | Table | Account record link | link | Account Name cells | same | seen (m7-campaign-links-contacts-base) | M3 | contacts.md L-43 |
| CX-344 | Table | Email address link | link | Email cells | same | seen (m7-campaign-links-contacts-base) | M10 | contacts.md L-44 |
| CX-348 | List footer | Total Records | badge | left | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-48 |
| CX-349 | List footer | Displayed record range | badge | right group, between arrows | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-49 |
| CX-350 | List footer | Previous | icon button | right group, before range | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-50 |
| CX-351 | List footer | Next | icon button | right group, after range | same | seen (m7-campaign-links-contacts-base) | M2 | contacts.md L-51 |

Refresh is present in source but not painted. Row-hover controls remain not observed. Static record values and field labels are excluded; record-link controls use structural names. No selection or preference control was operated.

#### Source reconciliation — m7-campaign-links-contacts-base

One-based source ordinals are evidence references only. Repeated descendants resolve to the same control.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, repeated descendant or static field/record text | 1, 4, 29, 36, 38, 52, 60, 63, 66–68, 83, 89, 107–108, 113, 116, 118–119, 122, 130–131, 138, 143, 163, 176–177, 286–287, 291–296, 299, 308–311, 314, 316, 318, 320, 322, 325–327, 330, 332, 334, 336, 338, 341–343, 346, 348, 350, 352, 354, 357–359, 362, 364, 366, 368, 370, 373–375, 378–379, 381, 383, 385, 388–390, 393, 395, 397, 399, 401, 404–406, 409, 411, 413, 415, 417, 420–422, 425, 427, 429, 431, 433, 436–438, 441, 443, 445, 447, 449, 452–454, 457, 459, 461, 463–464, 467–469, 472, 474, 476, 478, 480, 483–485, 488, 490, 492, 494, 496, 499–501, 504, 506, 508, 510, 512, 700, 713, 715–718, 720 |
| SH-01 | 2–3 |
| Excluded: zero-area hidden element | 5–10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 86, 93–94, 96–97, 99–100, 103–104, 109–112, 137, 141, 284–285, 289–290, 672–680, 685–699, 712 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35 |
| SH-12 | 37 |
| SH-13 | 39–40 |
| SH-14 | 41–42, 85 |
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
| Excluded: outside page viewport | 69–81, 178–283, 306–307, 671, 719 |
| SH-26 | 87 |
| SH-27 | 88 |
| SH-28 | 90 |
| SH-29 | 91 |
| SH-30 | 92 |
| SH-31 | 95 |
| SH-32 | 98 |
| SH-33 | 101–102 |
| SH-34 | 105–106 |
| CX-301 | 114 |
| CX-302 | 115, 117 |
| CX-303 | 120 |
| CX-304 | 121 |
| CX-305 | 123 |
| CX-306 | 124 |
| CX-307 | 125 |
| CX-308 | 126 |
| CX-309 | 127 |
| CX-310 | 128 |
| CX-311 | 129 |
| Excluded: refresh not painted | 132 |
| CX-312 | 133 |
| CX-313 | 134–135 |
| CX-314 | 136 |
| CX-315 | 139–140, 714 |
| CX-316 | 142 |
| CX-317 | 144–145 |
| CX-318 | 146–147 |
| CX-319 | 148–149 |
| CX-320 | 150–151 |
| CX-321 | 152–153 |
| CX-322 | 154–155 |
| CX-323 | 156–157 |
| CX-324 | 158–159 |
| CX-325 | 160–161 |
| CX-326 | 162 |
| CX-327 | 164–165 |
| CX-328 | 166–167 |
| CX-329 | 168–169 |
| CX-330 | 170–171 |
| CX-331 | 172–173 |
| CX-332 | 174–175 |
| CX-333 | 288 |
| CX-334 | 297–298 |
| CX-335 | 300 |
| CX-336 | 301–302 |
| CX-337 | 303 |
| CX-338 | 304 |
| CX-339 | 305 |
| CX-340 | 312–313, 328–329, 344–345, 360–361, 376–377, 391–392, 407–408, 423–424, 439–440, 455–456, 470–471, 486–487 |
| CX-341 | 315, 331, 347, 363, 394, 410, 426, 442, 458, 473, 489 |
| CX-342 | 317, 333, 349, 365, 380, 396, 412, 428, 444, 460, 475, 491 |
| CX-343 | 319, 335, 351, 367, 382, 398, 414, 430, 446, 462, 477, 493 |
| CX-344 | 321, 337, 353, 369, 384, 400, 416, 432, 448, 479, 495 |
| Excluded: row/column outside table content clip | 323–324, 339–340, 355–356, 371–372, 386–387, 402–403, 418–419, 434–435, 450–451, 465–466, 481–482, 497–498, 502–503, 505, 507, 509, 511, 513–670 |
| CX-348 | 681 |
| CX-349 | 682 |
| CX-350 | 683 |
| CX-351 | 684 |
| SH-35 | 701 |
| SH-36 | 702 |
| SH-37 | 703 |
| SH-38 | 704 |
| SH-39 | 705 |
| SH-40 | 706 |
| SH-41 | 707 |
| SH-42 | 708 |
| SH-43 | 709 |
| SH-44 | 710 |
| SH-45 | 711 |

Self-check: 720 entries; 201 mapped to CX/SH controls, 519 explicitly excluded; 48 CX numbers; zero unresolved. Screenshot opened as an image.

### Control inventory — m7-campaign-links-contact-detail

Shell: SH-01–SH-46 in contacts.md; Contacts active. MCP is the shortened SH-08 label; Channels/Threads absent; Products offscreen. Fixed utility edge includes image-only SH-46. No shell action was used.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-401 | Header | Back | icon button | leftmost | same | seen (m7-campaign-links-contact-detail) | M2 | contacts-record-detail.md D-01 |
| CX-402 | Header | Portrait placeholder | icon button | after Back | same | seen (m7-campaign-links-contact-detail) | M6 | contacts-record-detail.md D-02 |
| CX-403 | Header | Account record link | link | identity line, after contact identity | same | seen (m7-campaign-links-contact-detail) | M3 | contacts-record-detail.md D-03 |
| CX-404 | Header | Add Tags | button | below identity | same | seen (m7-campaign-links-contact-detail) | M6 | contacts-record-detail.md D-04 |
| CX-405 | Header | Send Email | button | right actions, first | same | seen (m7-campaign-links-contact-detail) | M10 | contacts-record-detail.md D-05 |
| CX-406 | Header | Edit | button | right actions, second | same | seen (m7-campaign-links-contact-detail) | M2 | contacts-record-detail.md D-06 |
| CX-407 | Header | More Options / three dots | icon button | right actions, third | same | seen (m7-campaign-links-contact-detail) | M2 | contacts-record-detail.md D-07 |
| CX-408 | Header | Previous Record | icon button | after More Options | same | seen (m7-campaign-links-contact-detail) | M2 | contacts-record-detail.md D-08 |
| CX-409 | Header | Next Record | icon button | far right | same | seen (m7-campaign-links-contact-detail) | M2 | contacts-record-detail.md D-09 |
| CX-410 | Related-list rail | Notes | link | rail, row 1 | same | seen (m7-campaign-links-contact-detail) | M6 | contacts-record-detail.md D-10 |
| CX-411 | Related-list rail | Connected Records | link | rail, row 2 | same | seen (m7-campaign-links-contact-detail) | ? | contacts-record-detail.md D-11 |
| CX-412 | Related-list rail | Attachments | link | rail, row 3 | same | seen (m7-campaign-links-contact-detail) | M6 | contacts-record-detail.md D-12 |
| CX-413 | Related-list rail | Cadences | link | rail, row 4 | same | seen (m7-campaign-links-contact-detail) | P3 | contacts-record-detail.md D-13 |
| CX-414 | Related-list rail | Deals | link | rail, row 5 | same | seen (m7-campaign-links-contact-detail) | M4 | contacts-record-detail.md D-14 |
| CX-415 | Related-list rail | Open Activities | link | rail, row 6 | same | seen (m7-campaign-links-contact-detail) | M5 | contacts-record-detail.md D-15 |
| CX-416 | Related-list rail | Closed Activities | link | rail, row 7 | same | seen (m7-campaign-links-contact-detail) | M5 | contacts-record-detail.md D-16 |
| CX-417 | Related-list rail | Invited Meetings | link | rail, row 8 | same | seen (m7-campaign-links-contact-detail) | M5 | contacts-record-detail.md D-17 |
| CX-418 | Related-list rail | Products | link | rail, row 9 | same | seen (m7-campaign-links-contact-detail) | P2 | contacts-record-detail.md D-18 |
| CX-419 | Related-list rail | Cases | link | rail, row 10 | same | seen (m7-campaign-links-contact-detail) | M8 | contacts-record-detail.md D-19 |
| CX-420 | Related-list rail | Quotes | link | rail, row 11 | same | seen (m7-campaign-links-contact-detail) | P2 | contacts-record-detail.md D-20 |
| CX-421 | Related-list rail | Sales Orders | link | rail, row 12 | same | seen (m7-campaign-links-contact-detail) | P2 | contacts-record-detail.md D-21 |
| CX-422 | Related-list rail | Purchase Orders | link | rail, row 13 | same | seen (m7-campaign-links-contact-detail) | P2 | contacts-record-detail.md D-22 |
| CX-423 | Related-list rail | Emails | link | rail, row 14 | same | seen (m7-campaign-links-contact-detail) | M10 | contacts-record-detail.md D-23 |
| CX-424 | Related-list rail | Invoices | link | rail, row 15 | same | seen (m7-campaign-links-contact-detail) | P2 | contacts-record-detail.md D-24 |
| CX-425 | Related-list rail | Campaigns | link | rail, row 16 | same | seen (m7-campaign-links-contact-detail) | M7 | contacts-record-detail.md D-25 |
| CX-426 | Related-list rail | Social | link | rail, row 17 | same | seen (m7-campaign-links-contact-detail) | M15 | contacts-record-detail.md D-26 |
| CX-427 | Related-list rail | Reporting Contacts | link | rail, row 18 | same | seen (m7-campaign-links-contact-detail) | M2 | contacts-record-detail.md D-27 |
| CX-428 | Related-list rail | Voice of the Customer | link | rail, row 19 | same | seen (m7-campaign-links-contact-detail) | P3 | contacts-record-detail.md D-28 |
| CX-429 | Related-list rail | Add Related List | link | below last related-list link | same | seen (m7-campaign-links-contact-detail) | M11 | contacts-record-detail.md D-29 |
| CX-430 | Related-list rail | Open Activities count | badge | after Open Activities | same | seen (m7-campaign-links-contact-detail) | M5 | contacts-record-detail.md D-30 |
| CX-431 | Related-list rail | Closed Activities count | badge | after Closed Activities | same | seen (m7-campaign-links-contact-detail) | M5 | contacts-record-detail.md D-31 |
| CX-432 | Tab row | Related-list rail visibility icon | icon button | before Overview | same | seen (m7-campaign-links-contact-detail) | M2 | contacts-record-detail.md D-32 |
| CX-433 | Tab row | Overview | tab | first tab, selected | same | seen (m7-campaign-links-contact-detail) | M2 | contacts-record-detail.md D-33 |
| CX-434 | Tab row | Timeline | tab | second tab | same | seen (m7-campaign-links-contact-detail) | M2 | contacts-record-detail.md D-34 |
| CX-435 | Tab row | Last Update indicator | badge | far right | same | seen (m7-campaign-links-contact-detail) | M2 | contacts-record-detail.md D-35 |
| CX-436 | Business card | Email address link | link | Email field value | same | seen (m7-campaign-links-contact-detail) | M10 | contacts-record-detail.md D-36 |
| CX-437 | Business card | Phone call icon | icon button | after Phone value | same | seen (m7-campaign-links-contact-detail) | M5 | contacts-record-detail.md D-37 |
| CX-438 | Details card | Hide Details | button | card header, left | same | seen (m7-campaign-links-contact-detail) | M2 | contacts-record-detail.md D-38 |
| CX-439 | Details card | Account record link | link | Contact Information, left column, Account Name value | same | seen (m7-campaign-links-contact-detail) | M3 | contacts-record-detail.md D-39 |
| CX-440 | Details card | Email address link | link | Contact Information, left column, Email value | same | seen (m7-campaign-links-contact-detail) | M10 | contacts-record-detail.md D-40 |
| CX-441 | Details card | Phone call icon | icon button | Contact Information, left column, after Phone value | same | seen (m7-campaign-links-contact-detail) | M5 | contacts-record-detail.md D-41 |

Campaigns is a rail link with no badge. Campaign Source is not a Contacts field. The identity Account link and repeated field Account link retain D-03 and D-39; call icons are unoperated. No field edit was entered.

#### Source reconciliation — m7-campaign-links-contact-detail

One-based source ordinals are evidence references only. Repeated descendants resolve to the same control.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, repeated descendant or static field/record text | 1, 4, 29, 36, 38, 52, 60, 63, 66–68, 83, 88, 106–108, 112, 114, 116, 130, 191, 195–208, 211–215, 217–220, 222–226, 228–229, 232–242, 246–249, 252–255, 257–259, 261, 278–280, 282–290, 292–295, 297–300, 302–305, 307, 510, 538–547 |
| SH-01 | 2–3 |
| Excluded: zero-area hidden element | 5–10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 92–93, 95–96, 98–99, 102–103, 111, 118, 120, 129, 133, 136, 139, 142, 145, 154, 157, 160, 163, 166, 169, 172, 175, 178, 181, 184, 187, 216, 221, 227, 243, 256, 260, 265, 269, 281, 291, 296, 301, 306, 311, 315, 319, 323, 327, 331, 335, 339, 348, 353, 356–357, 360, 363–366, 370, 388, 390, 393, 397, 400, 448–449, 469–470, 482–483, 491–509, 522 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35 |
| SH-12 | 37 |
| SH-13 | 39–40 |
| SH-14 | 41–42, 85 |
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
| Excluded: outside page viewport | 69–81, 189, 262–264, 266–268, 270–277, 308–310, 312–314, 316–318, 320–322, 324–326, 328–330, 332–334, 336–338, 340–347, 349–352, 354–355, 358–359, 361–362, 367–369, 371–387, 389, 391–392, 394–396, 398–399, 401–447, 450–468, 471–481, 484–490, 525–537, 548–552 |
| SH-26 | 86 |
| SH-27 | 87 |
| SH-28 | 89 |
| SH-29 | 90 |
| SH-30 | 91 |
| SH-31 | 94 |
| SH-32 | 97 |
| SH-33 | 100–101 |
| SH-34 | 104–105 |
| CX-401 | 109–110 |
| CX-402 | 113 |
| CX-403 | 115, 117 |
| CX-404 | 119 |
| CX-405 | 121–122 |
| CX-406 | 123–124 |
| CX-407 | 125–126 |
| CX-408 | 127 |
| CX-409 | 128 |
| CX-410 | 131–132 |
| CX-411 | 134–135 |
| CX-412 | 137–138 |
| CX-413 | 140–141 |
| CX-414 | 143–144 |
| CX-415 | 146–147 |
| CX-430 | 148 |
| CX-416 | 149–150 |
| CX-431 | 151 |
| CX-417 | 152–153 |
| CX-418 | 155–156 |
| CX-419 | 158–159 |
| CX-420 | 161–162 |
| CX-421 | 164–165 |
| CX-422 | 167–168 |
| CX-423 | 170–171 |
| CX-424 | 173–174 |
| CX-425 | 176–177 |
| CX-426 | 179–180 |
| CX-427 | 182–183 |
| CX-428 | 185–186 |
| CX-429 | 188 |
| CX-432 | 190 |
| CX-433 | 192 |
| CX-434 | 193 |
| CX-435 | 194 |
| CX-436 | 209–210 |
| CX-438 | 230–231 |
| CX-439 | 244–245 |
| CX-440 | 250–251 |
| SH-35 | 511 |
| SH-36 | 512 |
| SH-37 | 513 |
| SH-38 | 514 |
| SH-39 | 515 |
| SH-40 | 516 |
| SH-41 | 517 |
| SH-42 | 518 |
| SH-43 | 519 |
| SH-44 | 520 |
| SH-45 | 521 |
| CX-437 | 523 |
| CX-441 | 524 |

Self-check: 552 entries; 136 mapped to CX/SH controls, 416 explicitly excluded; 41 CX numbers; zero unresolved. Screenshot opened as an image.

### Control inventory — m7-campaign-links-contact-card (difference)

The Contacts Campaigns rail entry scrolls to an empty card, matching the Leads empty state: heading on the left, Add Campaigns on the right and No records found below. No count, columns, member rows or Member Status are painted. Card actions were not opened.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-450 | Related-list rail | Plus icon | icon button | selected Campaigns row, right | not operated | seen (m7-campaign-links-contact-card) | M7 | CX-149 |
| CX-451 | Related-list rail | Small list icon | icon button | right of Related List heading | not operated | seen (m7-campaign-links-contact-card) | M11 | CX-150 |
| CX-486 | Campaigns card | Add Campaigns | button | card header, right | not operated under MEP-815; picker not observed | seen (m7-campaign-links-contact-card) | M7 | contacts-record-detail.md D-86 |
| CX-487 | Social card | Associate Twitter | link | left stack, first | not operated | seen (m7-campaign-links-contact-card) | M15 | contacts-record-detail.md D-87 |
| CX-488 | Social card | Associate Facebook | link | left stack, second | not operated | seen (m7-campaign-links-contact-card) | M15 | contacts-record-detail.md D-88 |
| CX-463 | Content edge | Scroll To Top | icon button | lower right | not operated | seen (m7-campaign-links-contact-card) | M2 | contacts-record-detail.md D-63 |

Rest: as in m7-campaign-links-contact-detail for shell, header, rail and tabs. The scrolling content replaces CX-436–CX-441. No overlay; content behind the fixed header/tab row is not painted. The large Social illustration and instructional text are static and not reproduced.

#### Source reconciliation — m7-campaign-links-contact-card

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, repeated descendant or static field/record text | 1, 4, 29, 36, 38, 52, 60, 63, 66, 67, 68, 83, 88, 106, 107, 108, 112, 114, 116, 129, 131, 194, 460, 463, 464, 465, 539, 540, 541, 542, 552 |
| SH-01 | 2, 3 |
| Excluded: zero-area hidden element | 5, 6, 7, 8, 9, 10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 92, 93, 95, 96, 98, 99, 102, 103, 111, 118, 120, 130, 135, 138, 141, 144, 147, 156, 159, 162, 165, 168, 171, 174, 177, 180, 184, 187, 190, 523 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27 |
| SH-09 | 30, 31, 32 |
| SH-10 | 34 |
| SH-11 | 35 |
| SH-12 | 37 |
| SH-13 | 39, 40 |
| SH-14 | 41, 42, 85 |
| SH-15 | 43, 44 |
| SH-16 | 45, 46 |
| SH-17 | 47, 48 |
| SH-18 | 49, 50, 459 |
| SH-19 | 51 |
| SH-20 | 53, 54 |
| SH-21 | 55, 56 |
| SH-22 | 57, 58 |
| SH-23 | 59 |
| SH-24 | 61, 62 |
| SH-25 | 64, 65 |
| Excluded: outside page viewport | 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 192, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 543, 544, 545, 546, 547, 548, 549, 550, 551, 553 |
| SH-26 | 86 |
| SH-27 | 87 |
| SH-28 | 89 |
| SH-29 | 90 |
| SH-30 | 91 |
| SH-31 | 94 |
| SH-32 | 97 |
| SH-33 | 100, 101 |
| SH-34 | 104, 105 |
| CX-401 | 109, 110 |
| CX-402 | 113 |
| CX-403 | 115, 117 |
| CX-404 | 119 |
| CX-405 | 121, 122 |
| CX-406 | 123, 124 |
| CX-407 | 125, 126 |
| CX-408 | 127 |
| CX-409 | 128 |
| CX-451 | 132 |
| CX-410 | 133, 134 |
| CX-411 | 136, 137 |
| CX-412 | 139, 140 |
| CX-413 | 142, 143 |
| CX-414 | 145, 146 |
| CX-415 | 148, 149 |
| CX-430 | 150 |
| CX-416 | 151, 152 |
| CX-431 | 153 |
| CX-417 | 154, 155 |
| CX-418 | 157, 158 |
| CX-419 | 160, 161 |
| CX-420 | 163, 164 |
| CX-421 | 166, 167 |
| CX-422 | 169, 170 |
| CX-423 | 172, 173 |
| CX-424 | 175, 176 |
| CX-425 | 178, 179 |
| CX-450 | 181 |
| CX-426 | 182, 183 |
| CX-427 | 185, 186 |
| CX-428 | 188, 189 |
| CX-429 | 191 |
| CX-432 | 193 |
| CX-433 | 195 |
| CX-434 | 196 |
| CX-435 | 197 |
| Excluded: content behind fixed header/tabs or outside viewport | 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520 |
| CX-486 | 461, 462 |
| CX-487 | 466, 467, 537 |
| CX-488 | 468, 469, 538 |
| CX-463 | 492 |
| SH-44 | 521 |
| SH-45 | 522 |

Self-check: 553 source entries, 129 mapped to 41 CX numbers plus SH references, 424 excluded; zero unresolved. Screenshot opened as an image.

### Control inventory — m7-campaign-links-contacts-menu (difference)

No record selected. Actions opens thirteen rows; Add to Campaigns is ninth. No row was activated. The first row is highlighted by the opening pointer position. The final two rows are screenshot-only controls; the Print View arrow has a source entry. The final print row has a right-facing submenu arrow; that submenu was not opened.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-314.1 | Actions menu | Mass Transfer | menu item | popup, row 1 | not operated | seen (m7-campaign-links-contacts-menu) | M2 | contacts.md L-14.1 |
| CX-314.2 | Actions menu | Mass Delete | menu item | popup, row 2 | not operated | seen (m7-campaign-links-contacts-menu) | M2 | contacts.md L-14.2 |
| CX-314.3 | Actions menu | Mass Update | menu item | popup, row 3 | not operated | seen (m7-campaign-links-contacts-menu) | M2 | contacts.md L-14.3 |
| CX-314.4 | Actions menu | Manage Tags | menu item | popup, row 4 | not operated | seen (m7-campaign-links-contacts-menu) | M6 | contacts.md L-14.4 |
| CX-314.5 | Actions menu | Drafts | menu item | popup, row 5 | not operated | seen (m7-campaign-links-contacts-menu) | M2 | contacts.md L-14.5 |
| CX-314.6 | Actions menu | Mass Email | menu item | popup, row 6 | not operated | seen (m7-campaign-links-contacts-menu) | M10 | contacts.md L-14.6 |
| CX-314.7 | Actions menu | Approve Contacts | menu item | popup, row 7 | not operated | seen (m7-campaign-links-contacts-menu) | M2 | contacts.md L-14.7 |
| CX-314.8 | Actions menu | Deduplicate Contacts | menu item | popup, row 8 | not operated | seen (m7-campaign-links-contacts-menu) | M2 | contacts.md L-14.8 |
| CX-314.9 | Actions menu | Add to Campaigns | menu item | popup, row 9 | not operated | seen (m7-campaign-links-contacts-menu) | M7 | contacts.md L-14.9 |
| CX-314.10 | Actions menu | Create Client Script | menu item | popup, row 10 | not operated | seen (m7-campaign-links-contacts-menu) | M11 | contacts.md L-14.10 |
| CX-314.11 | Actions menu | Export Contacts | menu item | popup, row 11 | not operated | seen (m7-campaign-links-contacts-menu) | M6 | contacts.md L-14.11 |
| CX-314.12 | Actions menu | Sheet view | menu item | popup, row 12 | not operated | seen (m7-campaign-links-contacts-menu) | ? | contacts.md L-14.12 |
| CX-314.13 | Actions menu | Print View | menu item | popup, row 13 | not operated | seen (m7-campaign-links-contacts-menu) | M2 | contacts.md L-14.13 |
| CX-352 | Toolbar | Circular arrow icon | icon button | after view group | not operated | seen (m7-campaign-links-contacts-menu) | M2 | contacts.md L-52 |

Rest: as in m7-campaign-links-contacts-base. Overlay covers CX-333, CX-339 and part of CX-338/CX-344 on the right; left panel and row selection remain unchanged. The late-painted refresh is a new visible control, not an action performed. Decorative sparkles are not controls. No bulk-selection toolbar or dialog opened.

#### Source reconciliation — m7-campaign-links-contacts-menu

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, repeated descendant or static field/record text | 1, 4, 29, 36, 38, 52, 60, 63, 66, 67, 68, 83, 89, 107, 108, 113, 116, 118, 119, 122, 130, 131, 138, 143, 163, 176, 177, 286, 287, 291, 292, 293, 294, 295, 296, 299, 308, 309, 310, 311, 314, 316, 318, 320, 322, 325, 326, 327, 330, 332, 334, 336, 338, 341, 342, 343, 346, 348, 350, 352, 354, 357, 358, 359, 362, 364, 366, 368, 370, 373, 374, 375, 378, 379, 381, 383, 385, 388, 389, 390, 393, 395, 397, 399, 401, 404, 405, 406, 409, 411, 413, 415, 417, 420, 421, 422, 425, 427, 429, 431, 433, 436, 437, 438, 441, 443, 445, 447, 449, 452, 453, 454, 457, 459, 461, 463, 464, 467, 468, 469, 472, 474, 476, 478, 480, 483, 484, 485, 488, 490, 492, 494, 496, 499, 500, 501, 504, 506, 508, 510, 512, 720, 733, 736, 737, 738, 739, 741 |
| SH-01 | 2, 3 |
| Excluded: zero-area hidden element | 5, 6, 7, 8, 9, 10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 86, 93, 94, 96, 97, 99, 100, 103, 104, 109, 110, 111, 112, 137, 141, 284, 285, 289, 290, 672, 673, 674, 675, 676, 677, 678, 679, 680, 685, 686, 687, 688, 689, 690, 691, 692, 693, 694, 695, 696, 697, 698, 699, 700, 702, 704, 706, 708, 709, 711, 713, 719 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27 |
| SH-09 | 30, 31, 32 |
| SH-10 | 34 |
| SH-11 | 35 |
| SH-12 | 37 |
| SH-13 | 39, 40 |
| SH-14 | 41, 42, 85 |
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
| Excluded: outside page viewport | 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 306, 307, 671, 740 |
| SH-26 | 87 |
| SH-27 | 88 |
| SH-28 | 90 |
| SH-29 | 91 |
| SH-30 | 92 |
| SH-31 | 95 |
| SH-32 | 98 |
| SH-33 | 101, 102 |
| SH-34 | 105, 106 |
| CX-301 | 114 |
| CX-302 | 115, 117 |
| CX-303 | 120 |
| Excluded: structural wrapper, repeated descendant or static record text | 121, 742 |
| CX-305 | 123 |
| CX-306 | 124 |
| CX-307 | 125 |
| CX-308 | 126 |
| CX-309 | 127 |
| CX-310 | 128 |
| CX-311 | 129 |
| Excluded: refresh not painted | 132 |
| CX-312 | 133 |
| CX-313 | 134, 135 |
| CX-314 | 136 |
| CX-315 | 139, 140, 734 |
| CX-316 | 142 |
| CX-317 | 144, 145 |
| CX-318 | 146, 147 |
| CX-319 | 148, 149 |
| CX-320 | 150, 151 |
| CX-321 | 152, 153 |
| CX-322 | 154, 155 |
| CX-323 | 156, 157 |
| CX-324 | 158, 159 |
| CX-325 | 160, 161 |
| CX-326 | 162 |
| CX-327 | 164, 165 |
| CX-328 | 166, 167 |
| CX-329 | 168, 169 |
| CX-330 | 170, 171 |
| CX-331 | 172, 173 |
| CX-332 | 174, 175 |
| CX-333 | 288 |
| CX-334 | 297, 298 |
| CX-335 | 300 |
| CX-336 | 301, 302 |
| CX-337 | 303 |
| CX-338 | 304 |
| CX-339 | 305 |
| CX-340 | 312, 313, 328, 329, 344, 345, 360, 361, 376, 377, 391, 392, 407, 408, 423, 424, 439, 440, 455, 456, 470, 471, 486, 487 |
| CX-341 | 315, 331, 347, 363, 394, 410, 426, 442, 458, 473, 489 |
| CX-342 | 317, 333, 349, 365, 380, 396, 412, 428, 444, 460, 475, 491 |
| CX-343 | 319, 335, 351, 367, 382, 398, 414, 430, 446, 462, 477, 493 |
| CX-344 | 321, 337, 353, 369, 384, 400, 416, 432, 448, 479, 495 |
| Excluded: row/column outside table content clip | 323, 324, 339, 340, 355, 356, 371, 372, 386, 387, 402, 403, 418, 419, 434, 435, 450, 451, 465, 466, 481, 482, 497, 498, 502, 503, 505, 507, 509, 511, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660, 661, 662, 663, 664, 665, 666, 667, 668, 669, 670 |
| CX-348 | 681 |
| CX-349 | 682 |
| CX-350 | 683 |
| CX-351 | 684 |
| CX-314.1 | 701 |
| CX-314.2 | 703 |
| CX-314.3 | 705 |
| CX-314.4 | 707 |
| CX-314.5 | 710 |
| CX-314.6 | 712 |
| CX-314.7 | 714 |
| CX-314.8 | 715 |
| CX-314.9 | 716 |
| CX-314.10 | 717 |
| CX-314.11 | 718 |
| SH-35 | 721 |
| SH-36 | 722 |
| SH-37 | 723 |
| SH-38 | 724 |
| SH-39 | 725 |
| SH-40 | 726 |
| SH-41 | 727 |
| SH-42 | 728 |
| SH-43 | 729 |
| SH-44 | 730 |
| SH-45 | 731 |
| CX-352 | 732 |
| CX-314.13 | 735 |

Self-check: 742 entries; 213 mapped to 60 CX numbers plus SH, 529 excluded; zero unresolved. Screenshot opened as an image.

### Control inventory — m7-campaign-links-contacts-after (comparison)

Rest: as in m7-campaign-links-contacts-base, with no overlay or changed visible control. Total remains 490; the source contains the same 22 Contacts record links, with none missing. This counts loaded source links, not only the rows visible above the footer.

Self-check: 720 source entries use the base reconciliation; 201 mapped, 519 excluded, 48 CX numbers plus SH references; zero unresolved. The screenshot was opened as an image; the structural tag/name/bounds comparison is unchanged.

### Control inventory — m7-campaign-links-deals-base

Shell: SH-01–SH-46 as in contacts.md; Deals active. MCP is the shortened SH-08 label, Channels/Threads absent, Products below viewport. No shell action or new shell control.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-501 | View strip | All Deals | tab | left, first | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-01 |
| CX-502 | View strip | Three dots icon | icon button | after current view tab | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-02 |
| CX-503 | Toolbar | Filter | button | left group, first | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-03 |
| CX-504 | Toolbar | Sort | button | left group, second | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-04 |
| CX-505 | Toolbar | List view icon | icon button | view group, first | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-05 |
| CX-506 | Toolbar | Kanban view icon (active) | icon button | view group, second | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-06 |
| CX-507 | Toolbar | Sheet view icon | icon button | view group, third | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-07 |
| CX-508 | Toolbar | Chart view icon | icon button | view group, fourth | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-08 |
| CX-509 | Toolbar | Timeline view icon | icon button | view group, fifth | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-09 |
| CX-510 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-10 |
| CX-511 | Toolbar | Down chevron | icon button | view group, seventh | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-11 |
| CX-512 | Toolbar | Create Deal | button | right group, first | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-12 |
| CX-513 | Toolbar | Down arrow / More | icon button | right group, attached to Create Deal | same; not operated | seen (m7-campaign-links-deals-base) | M6 | deals.md DL-13 |
| CX-514 | Toolbar | Three dots / Actions | icon button | right group, far right | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-14 |
| CX-515 | Filter panel | Search | input | below Filter Deals by heading | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-15 |
| CX-516 | Filter panel | System Defined Filters | toggle | first section heading | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-16 |
| CX-520 | Filter panel | Locked | checkbox | system-defined section, Locked | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-20 |
| CX-521 | Filter panel | Record Action | checkbox | system-defined section, Record Action | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-21 |
| CX-522 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-22 |
| CX-523 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-23 |
| CX-524 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-24 |
| CX-525 | Filter panel | Cadences | checkbox | system-defined section, Cadences | same; not operated | seen (m7-campaign-links-deals-base) | P3 | deals.md DL-25 |
| CX-526 | Filter panel | Filter By Fields | toggle | second section heading | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-26 |
| CX-527 | Filter panel | Account Name | checkbox | field section, first row | same; not operated | seen (m7-campaign-links-deals-base) | M3 | deals.md DL-27 |
| CX-517 | Filter panel | Activities | checkbox | system section, first row | same; not operated | seen (m7-campaign-links-deals-base) | M5 | deals.md DL-17 |
| CX-519 | Filter panel | Latest Email Status | checkbox | system section, second row | same; not operated | seen (m7-campaign-links-deals-base) | M10 | deals.md DL-19 |
| CX-565 | Filter panel | Amount | checkbox | field section, second row | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-65 |
| CX-566 | Filter panel | Campaign Source | checkbox | field section, third row | Unchecked; not toggled; lookup metadata only for criterion semantics | seen (m7-campaign-links-deals-base) | M7 | deals.md DL-66 |
| CX-567 | Filter panel | Closing Date | checkbox | field section, fourth row | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-67 |
| CX-568 | Filter panel | Connected To | checkbox | field section, fifth row | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-68 |
| CX-569 | Filter panel | Contact Name checkbox (label clipped) | checkbox | field section, sixth row, clipped at bottom | same; not operated | seen (m7-campaign-links-deals-base) | M2 | deals.md DL-69 |
| CX-570 | Board toolbar | STAGEVIEW | select | below main toolbar, left | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-70 |
| CX-571 | Board toolbar | Pencil icon | icon button | after STAGEVIEW | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-71 |
| CX-572 | Board | Qualification | badge | first visible stage header | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-72 |
| CX-573 | Board | Needs Analysis | badge | second visible stage header | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-73 |
| CX-574 | Board | Value Proposition | badge | third visible stage header, right edge | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-74 |
| CX-575 | Board | Stage record count | badge | beside each visible stage label | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-75 |
| CX-576 | Board | Stage probability | badge | after count and separator in each header | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-76 |
| CX-577 | Board | Stage amount total | badge | second line of each visible stage header | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-77 |
| CX-578 | Board card | Deal record link | link | card first line | same; not operated | seen (m7-campaign-links-deals-base) | M4 | deals.md DL-78 |
| CX-579 | Board card | Account record link | link | card third line | same; not operated | seen (m7-campaign-links-deals-base) | M3 | deals.md DL-79 |
| CX-580 | Board card | Contact record link | link | card fifth line | same; not operated | seen (m7-campaign-links-deals-base) | M2 | deals.md DL-80 |
| CX-581 | Board card | Task with checkmark icon | link | card bottom right where present | same; not operated | seen (m7-campaign-links-deals-base) | M5 | deals.md DL-81 |

Same three visible stage columns and four deal links as deals.md. Header counts remain zero despite visible cards; use record links for comparison. No Campaigns system filter; Campaign Source is the third field filter. No view switch, drag, checkbox or field filter was used. Refresh is source-only; DL-75/DL-76 are screenshot-only stage count/probability badges. No table selection or list footer is painted.

#### Source reconciliation — m7-campaign-links-deals-base

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, repeated descendant or static field/record text | 1, 4, 29, 38, 52, 60, 63, 66, 67, 68, 83, 89, 107, 108, 113, 116, 118, 122, 131, 142, 147, 165, 242, 243, 247, 254, 258, 265, 267, 274, 277, 284, 308, 321, 322, 323, 324, 326, 327, 328, 329, 330, 331 |
| SH-01 | 2, 3 |
| Excluded: zero-area hidden element | 5, 6, 7, 8, 9, 10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 86, 93, 94, 96, 97, 99, 100, 103, 104, 109, 110, 111, 112, 141, 145, 240, 241, 244, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27 |
| SH-09 | 30, 31, 32 |
| SH-10 | 34 |
| SH-11 | 35, 36 |
| SH-12 | 37 |
| SH-13 | 39, 40 |
| SH-14 | 41, 42 |
| SH-15 | 43, 44 |
| SH-16 | 45, 46, 85 |
| SH-17 | 47, 48 |
| SH-18 | 49, 50 |
| SH-19 | 51 |
| SH-20 | 53, 54 |
| SH-21 | 55, 56 |
| SH-22 | 57, 58 |
| SH-23 | 59 |
| SH-24 | 61, 62 |
| SH-25 | 64, 65 |
| Excluded: outside page viewport | 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 285, 286, 287, 288, 289, 290, 291, 325 |
| SH-26 | 87 |
| SH-27 | 88 |
| SH-28 | 90 |
| SH-29 | 91 |
| SH-30 | 92 |
| SH-31 | 95 |
| SH-32 | 98 |
| SH-33 | 101, 102 |
| SH-34 | 105, 106 |
| CX-501 | 114 |
| CX-502 | 115, 117, 119 |
| CX-503 | 120 |
| CX-504 | 121 |
| CX-505 | 123 |
| CX-506 | 124 |
| CX-507 | 125 |
| CX-508 | 126 |
| CX-509 | 127 |
| CX-510 | 128 |
| CX-511 | 129, 130 |
| Excluded: refresh DOM not painted | 132 |
| CX-512 | 133 |
| CX-513 | 134, 135 |
| CX-514 | 136 |
| CX-570 | 137, 138, 139 |
| CX-571 | 140 |
| CX-515 | 143, 144, 320 |
| CX-516 | 146 |
| CX-517 | 148, 149 |
| CX-519 | 150, 151 |
| CX-520 | 152, 153 |
| CX-521 | 154, 155 |
| CX-522 | 156, 157 |
| CX-523 | 158, 159 |
| CX-524 | 160, 161 |
| CX-525 | 162, 163 |
| CX-526 | 164 |
| CX-527 | 166, 167 |
| CX-565 | 168, 169 |
| CX-566 | 170, 171 |
| CX-567 | 172, 173 |
| CX-568 | 174, 175 |
| CX-569 | 176, 177 |
| Excluded: below filter panel viewport | 178, 179 |
| CX-572 | 245 |
| CX-577 | 246, 257, 276 |
| CX-578 | 248, 249, 259, 260, 268, 269, 278, 279 |
| CX-579 | 250, 251, 261, 262, 270, 271, 280, 281 |
| CX-580 | 252, 253, 263, 264, 272, 273, 282, 283 |
| CX-581 | 255, 266 |
| CX-573 | 256 |
| CX-574 | 275 |
| SH-35 | 309 |
| SH-36 | 310 |
| SH-37 | 311 |
| SH-38 | 312 |
| SH-39 | 313 |
| SH-40 | 314 |
| SH-41 | 315 |
| SH-42 | 316 |
| SH-43 | 317 |
| SH-44 | 318 |
| SH-45 | 319 |

Self-check: 331 entries; 155 mapped to 41 source-backed CX numbers plus SH, 176 excluded; zero unresolved. Screenshot-only additions: CX-575, CX-576. Screenshot opened as an image.

### Control inventory — m7-campaign-links-deal-detail

Shell: SH-01–SH-46 as in contacts.md; Deals active. MCP is the shortened SH-08 label, Channels/Threads absent, Products below viewport. No shell action or new shell control.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-601 | Header | Back | icon button | leftmost | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-01 |
| CX-604 | Header | Add Tags | button | below identity | same; not operated | seen (m7-campaign-links-deal-detail) | M6 | deals-record-detail.md DD-04 |
| CX-605 | Header | Send Email | button | right actions, first | same; not operated | seen (m7-campaign-links-deal-detail) | M10 | deals-record-detail.md DD-05 |
| CX-606 | Header | Edit | button | right actions, second | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-06 |
| CX-607 | Header | More Options / three dots | icon button | right actions, third and far right | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-07 |
| CX-690 | Header | Amount | badge | identity line, after deal name and dash | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-90 |
| CX-610 | Related-list rail | Notes | link | rail, row 1 | same; not operated | seen (m7-campaign-links-deal-detail) | M6 | deals-record-detail.md DD-10 |
| CX-611 | Related-list rail | Connected Records | link | rail, row 2 | same; not operated | seen (m7-campaign-links-deal-detail) | ? | deals-record-detail.md DD-11 |
| CX-612 | Related-list rail | Attachments | link | rail, row 3 | same; not operated | seen (m7-campaign-links-deal-detail) | M6 | deals-record-detail.md DD-12 |
| CX-654 | Related-list rail | Stage History | link | rail, row 4 | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-54 |
| CX-655 | Related-list rail | Competitors | link | rail, row 5 | same; not operated | seen (m7-campaign-links-deal-detail) | ? | deals-record-detail.md DD-55 |
| CX-613 | Related-list rail | Cadences | link | rail, row 6 | same; not operated | seen (m7-campaign-links-deal-detail) | P3 | deals-record-detail.md DD-13 |
| CX-615 | Related-list rail | Open Activities | link | rail, row 7 | same; not operated | seen (m7-campaign-links-deal-detail) | M5 | deals-record-detail.md DD-15 |
| CX-616 | Related-list rail | Closed Activities | link | rail, row 8 | same; not operated | seen (m7-campaign-links-deal-detail) | M5 | deals-record-detail.md DD-16 |
| CX-618 | Related-list rail | Products | link | rail, row 9 | same; not operated | seen (m7-campaign-links-deal-detail) | P2 | deals-record-detail.md DD-18 |
| CX-620 | Related-list rail | Quotes | link | rail, row 10 | same; not operated | seen (m7-campaign-links-deal-detail) | P2 | deals-record-detail.md DD-20 |
| CX-621 | Related-list rail | Sales Orders | link | rail, row 11 | same; not operated | seen (m7-campaign-links-deal-detail) | P2 | deals-record-detail.md DD-21 |
| CX-656 | Related-list rail | Contact Roles | link | rail, row 12 | same; not operated | seen (m7-campaign-links-deal-detail) | M2 | deals-record-detail.md DD-56 |
| CX-623 | Related-list rail | Emails | link | rail, row 13 | same; not operated | seen (m7-campaign-links-deal-detail) | M10 | deals-record-detail.md DD-23 |
| CX-619 | Related-list rail | Cases | link | rail, row 14 | same; not operated | seen (m7-campaign-links-deal-detail) | M8 | deals-record-detail.md DD-19 |
| CX-624 | Related-list rail | Invoices | link | rail, row 15 | same; not operated | seen (m7-campaign-links-deal-detail) | P2 | deals-record-detail.md DD-24 |
| CX-629 | Related-list rail | Add Related List | link | below last related-list link | same; not operated | seen (m7-campaign-links-deal-detail) | M11 | deals-record-detail.md DD-29 |
| CX-657 | Related-list rail | Stage History count | badge | after Stage History | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-57 |
| CX-630 | Related-list rail | Open Activities count | badge | after Open Activities | same; not operated | seen (m7-campaign-links-deal-detail) | M5 | deals-record-detail.md DD-30 |
| CX-631 | Related-list rail | Closed Activities count | badge | after Closed Activities | same; not operated | seen (m7-campaign-links-deal-detail) | M5 | deals-record-detail.md DD-31 |
| CX-658 | Related-list rail | Contact Roles count | badge | after Contact Roles | same; not operated | seen (m7-campaign-links-deal-detail) | M2 | deals-record-detail.md DD-58 |
| CX-632 | Tab row | Related-list rail visibility icon | icon button | before Overview | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-32 |
| CX-633 | Tab row | Overview | tab | first tab, selected | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-33 |
| CX-634 | Tab row | Timeline | tab | second tab | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-34 |
| CX-635 | Tab row | Last Update indicator | badge | far right | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-35 |
| CX-660 | Stage bar | Left chevron | icon button | left edge of stage sequence | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-60 |
| CX-661.1 | Stage bar | Qualification | button | stage sequence, visible item 1 | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-61.1 |
| CX-661.2 | Stage bar | Needs Analysis | button | stage sequence, visible item 2 | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-61.2 |
| CX-661.3 | Stage bar | Value Proposition | button | stage sequence, visible item 3 | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-61.3 |
| CX-661.4 | Stage bar | Identify Decision Makers | button | stage sequence, visible item 4 | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-61.4 |
| CX-661.5 | Stage bar | Proposal/Price Quote (clipped) | button | stage sequence, visible item 5 | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-61.5 |
| CX-663 | Stage bar | Right chevron | icon button | right edge of stage sequence | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-63 |
| CX-664 | Stage bar | Thumbs up with down chevron | icon button | after stage sequence, first terminal control | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-64 |
| CX-665 | Stage bar | Thumbs down with down chevron | icon button | after stage sequence, second terminal control | same; not operated | seen (m7-campaign-links-deal-detail) | M4 | deals-record-detail.md DD-65 |
| CX-666 | Contact Person summary | Contact record link | link | body, after portrait | same; not operated | seen (m7-campaign-links-deal-detail) | M2 | deals-record-detail.md DD-66 |
| CX-667 | Contact Person summary | Account record link | link | below contact link, after static at | same; not operated | seen (m7-campaign-links-deal-detail) | M3 | deals-record-detail.md DD-67 |
| CX-668 | Contact Person summary | Email link | link | below account link | same; not operated | seen (m7-campaign-links-deal-detail) | M10 | deals-record-detail.md DD-68 |
| CX-669 | Next Action summary | Activity record link | link | after date ribbon | same; not operated | seen (m7-campaign-links-deal-detail) | M5 | deals-record-detail.md DD-69 |


No Campaigns rail/card is present, consistent with CX-M2. Header, rail, stage, summary, lower Contact Person and Next Action controls match the cited Deals detail. The two visible sales-summary lines are static labels and durations; the following line is behind the utility edge and excluded.

Campaign Source occurs in the offscreen details source as a right-column field label. Its field wrapper and value container are below this captured viewport; no Campaigns link is present in that field's source entries. This is **source-only**, not a painted empty-value or link observation. No field focus, edit, lookup, scroll workaround or record creation was attempted. Current detail presentation and a populated lookup link remain **not observed**. The form/lookup stays on the metadata + existing shared lookup fallback authorized in MEP-815.

#### Source reconciliation — m7-campaign-links-deal-detail

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural wrapper, repeated descendant or static field/record text | 1, 4, 29, 38, 52, 60, 63, 66, 67, 68, 83, 88, 106, 107, 108, 111, 124, 171, 172, 173, 176, 180, 187, 188, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 216, 217, 218, 219, 220, 222, 224, 225, 226, 227, 228, 230, 502, 521, 522, 523, 524, 525, 526, 527, 528, 529 |
| SH-01 | 2, 3 |
| Excluded: zero-area hidden element | 5, 6, 7, 8, 9, 10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 92, 93, 95, 96, 98, 99, 102, 103, 114, 116, 123, 127, 130, 133, 139, 142, 151, 154, 157, 163, 166, 169, 194, 195, 215, 221, 223, 229, 254, 264, 268, 281, 287, 300, 304, 313, 316, 317, 320, 323, 324, 325, 326, 330, 338, 350, 351, 360, 363, 379, 381, 384, 388, 391, 419, 429, 430, 455, 456, 473, 474, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501 |
| SH-02 | 11 |
| SH-03 | 12, 14 |
| SH-04 | 15, 17 |
| SH-05 | 18, 20 |
| SH-06 | 21, 23 |
| SH-07 | 24, 26 |
| SH-08 | 27 |
| SH-09 | 30, 31, 32 |
| SH-10 | 34 |
| SH-11 | 35, 36 |
| SH-12 | 37 |
| SH-13 | 39, 40 |
| SH-14 | 41, 42 |
| SH-15 | 43, 44 |
| SH-16 | 45, 46, 85 |
| SH-17 | 47, 48 |
| SH-18 | 49, 50 |
| SH-19 | 51 |
| SH-20 | 53, 54 |
| SH-21 | 55, 56 |
| SH-22 | 57, 58 |
| SH-23 | 59 |
| SH-24 | 61, 62 |
| SH-25 | 64, 65 |
| Excluded: outside page viewport | 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 174, 189, 190, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 255, 256, 257, 258, 259, 260, 261, 262, 263, 265, 266, 267, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 282, 283, 284, 285, 286, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 301, 302, 303, 305, 306, 307, 308, 309, 310, 311, 312, 314, 315, 318, 319, 321, 322, 327, 328, 329, 331, 332, 333, 334, 335, 336, 337, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 352, 353, 354, 355, 356, 357, 358, 359, 361, 362, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 380, 382, 383, 385, 386, 387, 389, 390, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 420, 421, 422, 423, 424, 425, 426, 427, 428, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 475, 476, 477, 478, 479, 480, 481, 514, 515, 516, 517, 518, 519, 520, 530, 531, 532, 533, 534 |
| SH-26 | 86 |
| SH-27 | 87 |
| SH-28 | 89 |
| SH-29 | 90 |
| SH-30 | 91 |
| SH-31 | 94 |
| SH-32 | 97 |
| SH-33 | 100, 101 |
| SH-34 | 104, 105 |
| CX-601 | 109, 110 |
| CX-690 | 112, 113 |
| CX-604 | 115 |
| CX-605 | 117, 118 |
| CX-606 | 119, 120 |
| CX-607 | 121, 122 |
| CX-610 | 125, 126 |
| CX-611 | 128, 129 |
| CX-612 | 131, 132 |
| CX-654 | 134, 135 |
| CX-657 | 136 |
| CX-655 | 137, 138 |
| CX-613 | 140, 141 |
| CX-615 | 143, 144 |
| CX-630 | 145 |
| CX-616 | 146, 147 |
| CX-631 | 148 |
| CX-618 | 149, 150 |
| CX-620 | 152, 153 |
| CX-621 | 155, 156 |
| CX-656 | 158, 159 |
| CX-658 | 160 |
| CX-623 | 161, 162 |
| CX-619 | 164, 165 |
| CX-624 | 167, 168 |
| CX-629 | 170 |
| CX-632 | 175 |
| CX-633 | 177 |
| CX-634 | 178 |
| CX-635 | 179 |
| CX-660 | 181 |
| CX-661.1 | 182 |
| CX-661.2 | 183 |
| CX-661.3 | 184 |
| CX-661.4 | 185 |
| CX-661.5 | 186 |
| CX-663 | 191 |
| CX-664 | 192 |
| CX-665 | 193 |
| CX-666 | 231 |
| CX-667 | 232 |
| CX-668 | 233 |
| CX-669 | 234 |
| SH-35 | 503 |
| SH-36 | 504 |
| SH-37 | 505 |
| SH-38 | 506 |
| SH-39 | 507 |
| SH-40 | 508 |
| SH-41 | 509 |
| SH-42 | 510 |
| SH-43 | 511 |
| SH-44 | 512 |
| SH-45 | 513 |

Self-check: 534 entries; 131 mapped to 43 source-backed CX numbers plus SH, 403 excluded; zero unresolved. Screenshot-only additions: none. Screenshot opened as an image.

### Control inventory — m7-campaign-links-deals-after (comparison)

Rest: as in m7-campaign-links-deals-base; no changed visible control or overlay. Four deal record links remain, with none missing. Header zeros do not represent the list total. No view, stage, field or preference was changed.

Self-check: 331 source entries reuse the base reconciliation with this explicit permutation: after 307–318 map to base 308–319 (utility controls and their wrapper); after 319 maps to the excluded base 307 zero-height chat wrapper. Items 304–306 are reordered zero-area overlays and remain excluded. All other ordinals keep their mapping. Totals stay 155 mapped to 41 source-backed CX numbers plus SH and 176 excluded; screenshot-only CX-575/CX-576 remain. Visible tag/name/bounds are unchanged. Screenshot opened as an image.

### Final open questions within the approved boundary

- What are the installation's Member Status options, order and default? The exported field catalog does not contain them. Campaign Status is not a substitute.
- Which documented association flow corresponds to the blocked picker: direct status plus checkbox selection, or selection followed by a confirmation step? Exact titles, layout, search placeholder, columns, pagination, close/cancel behaviour, preselection and duplicate handling remain not observed. Use the CTO-approved shared picker interim pattern.
- A populated Campaigns card is not observed: current counter placement, rendered column subset/order, row status editor and hover actions remain unknown. CX-200–CX-202 are documented capabilities, not current screen observations.
- The Deals Campaign Source field is below the initial captured detail viewport. Its painted empty state and populated link/target are not observed. Lookup search behaviour is a metadata/shared-component fallback; create/edit lookup opening stays prohibited.
- Exact Campaigns filter operators, multi-campaign/status matching semantics and Deals Campaign Source operators/empty-value rules remain not observed. The documentary five-campaign limit and conditional Service Status do not establish the current filter layout.
- Submission validation, success/error states and persistence outcomes cannot be observed without a write. No write-dependent state is claimed.

No further access exception or board action is requested: MEP-815 supplies the permitted fallback. These are explicit limits for UI Lead review and later implementation, not permission to retry blocked controls or invent missing states. No browser tab was manually closed during this continuation.

### Control inventory — m7-campaign-links-leads-menu (difference)

No record selected and no action row activated. Fourteen rows are painted; Add to Campaigns is tenth. Mass Convert precedes Manage Tags. The opening does not establish a selected-record toolbar or the Add to Campaigns dialog.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-14.1 | Actions menu | Mass Transfer | menu item | popup, row 1 | not operated | seen (m7-campaign-links-leads-menu) | M1 | contacts.md L-14.1 moved |
| CX-14.2 | Actions menu | Mass Delete | menu item | popup, row 2 | not operated | seen (m7-campaign-links-leads-menu) | M1 | contacts.md L-14.2 moved |
| CX-14.3 | Actions menu | Mass Update | menu item | popup, row 3 | not operated | seen (m7-campaign-links-leads-menu) | M1 | contacts.md L-14.3 moved |
| CX-14.4 | Actions menu | Mass Convert | menu item | popup, row 4 | not operated | seen (m7-campaign-links-leads-menu) | M1 | new |
| CX-14.5 | Actions menu | Manage Tags | menu item | popup, row 5 | not operated | seen (m7-campaign-links-leads-menu) | M6 | contacts.md L-14.4 moved |
| CX-14.6 | Actions menu | Drafts | menu item | popup, row 6 | not operated | seen (m7-campaign-links-leads-menu) | M1 | contacts.md L-14.5 moved |
| CX-14.7 | Actions menu | Mass Email | menu item | popup, row 7 | not operated | seen (m7-campaign-links-leads-menu) | M10 | contacts.md L-14.6 moved |
| CX-14.8 | Actions menu | Approve Leads | menu item | popup, row 8 | not operated | seen (m7-campaign-links-leads-menu) | M1 | contacts.md L-14.7 moved |
| CX-14.9 | Actions menu | Deduplicate Leads | menu item | popup, row 9 | not operated | seen (m7-campaign-links-leads-menu) | M1 | contacts.md L-14.8 moved |
| CX-14.10 | Actions menu | Add to Campaigns | menu item | popup, row 10 | not operated | seen (m7-campaign-links-leads-menu) | M7 | contacts.md L-14.9 moved |
| CX-14.11 | Actions menu | Create Client Script | menu item | popup, row 11 | not operated | seen (m7-campaign-links-leads-menu) | M11 | contacts.md L-14.10 moved |
| CX-14.12 | Actions menu | Export Leads | menu item | popup, row 12 | not operated | seen (m7-campaign-links-leads-menu) | M6 | contacts.md L-14.11 moved |
| CX-14.13 | Actions menu | Sheet view | menu item | popup, row 13 | not operated | seen (m7-campaign-links-leads-menu) | ? | contacts.md L-14.12 moved |
| CX-14.14 | Actions menu | Print View | menu item | popup, row 14 | not operated | seen (m7-campaign-links-leads-menu) | M1 | contacts.md L-14.13 moved |
| CX-52 | Toolbar | Circular arrow icon | icon button | after view group | not operated | seen (m7-campaign-links-leads-menu) | M1 | contacts.md L-52 |

Rest: as in m7-campaign-links-leads-base. Menu overlays the right side of the table, including CX-33, CX-39 and part of CX-38/CX-44; CX-52 is late-painted refresh. The final two menu rows are screenshot-only; Print View has a submenu arrow, not opened. No campaign action was clicked.

#### Source reconciliation — m7-campaign-links-leads-menu

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Shell SH-01–SH-46 (contacts.md); structural wrappers/duplicate descendants included | 1, 2, 3, 4, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30, 31, 32, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 83, 85, 87, 88, 89, 90, 91, 92, 95, 98, 101, 102, 105, 106, 107, 108, 172, 173, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526 |
| Excluded: zero-area hidden element | 5, 6, 7, 8, 9, 10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 86, 93, 94, 96, 97, 99, 100, 103, 104, 109, 110, 111, 112, 137, 141, 288, 289, 293, 294, 466, 467, 468, 469, 470, 471, 472, 473, 474, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 496, 498, 500, 502, 504, 505, 507, 509, 527 |
| Excluded: outside viewport | 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 310, 311, 312, 326, 327, 328, 341, 342, 343, 356, 357, 358, 371, 372, 373, 386, 387, 388, 401, 402, 403, 416, 417, 418, 432, 433, 434, 447, 448, 449, 463, 464, 465, 536 |
| Excluded: structural container / duplicate wrapper | 113, 122, 138, 290, 291, 295, 296, 297, 298, 299, 300, 303, 532, 533, 534, 535, 537 |
| CX-01 | 114 |
| CX-02 | 115, 116, 117, 118, 119 |
| CX-03 | 120 |
| Excluded: structural wrapper, repeated descendant or static record text | 121, 538 |
| CX-05 | 123 |
| CX-06 | 124 |
| CX-07 | 125 |
| CX-08 | 126 |
| CX-09 | 127 |
| CX-10 | 128 |
| CX-11 | 129, 130 |
| Excluded: refresh DOM affordance not painted in screenshot | 131, 528 |
| CX-52 | 132 |
| CX-12 | 133 |
| CX-13 | 134, 135 |
| CX-14 | 136, 529 |
| CX-15 | 139, 140, 530 |
| CX-16 | 142 |
| Excluded: structural container or static label/value | 143, 163, 313, 314, 315, 316, 319, 320, 322, 323, 325, 329, 330, 331, 334, 335, 337, 338, 340, 344, 345, 346, 349, 350, 352, 353, 355, 359, 360, 361, 364, 365, 367, 368, 370, 374, 375, 376, 379, 380, 382, 383, 385, 389, 390, 391, 394, 395, 397, 398, 400, 404, 405, 406, 409, 410, 412, 413, 415, 419, 420, 421, 424, 426, 428, 429, 431, 435, 436, 437, 440, 441, 443, 444, 446, 450, 451, 452, 455, 457, 459, 460, 462 |
| CX-17 | 144, 145 |
| CX-18 | 146, 147 |
| CX-19 | 148, 149 |
| CX-20 | 150, 151 |
| CX-21 | 152, 153 |
| CX-22 | 154, 155 |
| CX-23 | 156, 157 |
| CX-24 | 158, 159 |
| CX-25 | 160, 161 |
| CX-26 | 162 |
| CX-27 | 164, 165 |
| CX-28 | 166, 167 |
| CX-29 | 168, 169 |
| CX-30 | 170, 171 |
| CX-33 | 292 |
| CX-34 | 301, 302 |
| CX-35 | 304 |
| CX-36 | 305, 306 |
| CX-37 | 307 |
| CX-38 | 308 |
| CX-39 | 309 |
| CX-40 | 317, 318, 332, 333, 347, 348, 362, 363, 377, 378, 392, 393, 407, 408, 422, 423, 438, 439, 453, 454 |
| CX-42 | 321, 336, 351, 366, 381, 396, 411, 427, 442, 458 |
| CX-44 | 324, 339, 354, 369, 384, 399, 414, 430, 445, 461 |
| CX-41 | 425, 456 |
| CX-48 | 475 |
| CX-49 | 476 |
| CX-50 | 477 |
| CX-51 | 478 |
| CX-14.1 | 495 |
| CX-14.2 | 497 |
| CX-14.3 | 499 |
| CX-14.4 | 501 |
| CX-14.5 | 503 |
| CX-14.6 | 506 |
| CX-14.7 | 508 |
| CX-14.8 | 510 |
| CX-14.9 | 511 |
| CX-14.10 | 512 |
| CX-14.11 | 513 |
| CX-14.12 | 514 |
| CX-14.14 | 531 |

Self-check: 538 entries; 205 mapped to 58 source-backed CX numbers plus SH, 333 excluded; zero unresolved. Screenshot-only menu rows CX-14.13/CX-14.14 are additional. Screenshot opened as an image.

### Continuation capture ledger

All entries below were taken under MEP-815. Every screenshot was opened as an image and checked across the full frame. Counts are inventory reconciliation counts, not screen measurements. Initial five Leads captures and their earlier stop evidence remain above.

| Slug | Clicks | Skipped | Scope / reconciliation |
| --- | --- | --- | --- |
| m7-campaign-links-contacts-base | 0 | 0 | 720 entries → 48 CX + SH; 201 mapped, 519 excluded |
| m7-campaign-links-contact-detail | 1 | 0 | 552 → 41 CX + SH; 136 mapped, 416 excluded |
| m7-campaign-links-contact-card | 2 | 0 | 553 → 41 CX + SH; 129 mapped, 424 excluded; six-row difference inventory |
| m7-campaign-links-contacts-menu | 1 | 0 | 742 → 60 source-backed CX + SH; 213 mapped, 529 excluded; screenshot-only sheet row also inventoried |
| m7-campaign-links-contacts-after | 0 | 0 | 720, same reconciliation as Contacts base; total 490 → 490, source record links 22 → 22, missing 0 |
| m7-campaign-links-deals-base | 0 | 0 | 331 → 41 source-backed CX + SH; 155 mapped, 176 excluded; two screenshot-only badge IDs |
| m7-campaign-links-deal-detail | 1 | 0 | 534 → 43 CX + SH; 131 mapped, 403 excluded; Campaign Source source-only below viewport |
| m7-campaign-links-deals-after | 0 | 0 | 331, same mapping with explicit utility permutation; deal links 4 → 4, missing 0 |
| m7-campaign-links-leads-menu | 1 | 0 | 538 → 58 source-backed CX + SH; 205 mapped, 333 excluded; screenshot-only sheet row also inventoried |

| m7-campaign-links-leads-final | 0 | 0 | 516 → 47 CX + SH; 194 mapped, 322 excluded; total/record links 10 → 10, missing 0; two newly painted shell controls |

### Control inventory — m7-campaign-links-leads-final (difference)

Rest: as in m7-campaign-links-leads-base, no menu or selection. The list is painted, with total 10 and all ten original record links; API calls 58 against the initial 59. No missing record link. Refresh is again unpainted.

Shell controls missing from app-shell.md: the final utility strip additionally paints Channels and Threads. These were absent in the earlier captures in this slice and are not present in the cited shell inventory. They are recorded here without assuming a feature implementation or a persisted preference change. No utility control was clicked. SH-35/My Pins and SH-36/Chats remain first and second; SH-37/Contacts moves from third to fifth. The right utility group is unchanged.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-700 | Utility strip | Channels | icon button | left group, third | not observed; not operated | seen (m7-campaign-links-leads-final) | ? | new |
| CX-701 | Utility strip | Threads | icon button | left group, fourth | not observed; not operated | seen (m7-campaign-links-leads-final) | ? | new |

Source reconciliation: entries 1–493 retain the Leads-base mapping. Entries 494–496 map to the shell utility wrapper, SH-35 and SH-36; 497 → CX-700, 498 → CX-701, 499 → SH-37 moved. Entries 500–507 map in order to base 498–505; named right-group controls retain SH-38–SH-45. Entry 508 is the excluded zero-height live-chat wrapper. Entries 509–516 map to base 507–514 in order. The exact right utility controls are: 500 document/clock, 501 Announcements, 502 Motivator, 503 Sticky Notes, 504 Activity Reminders, 505 Recent Items, 506 Accessibility, 507 Help. SH-46 is image-only at the far right.

Self-check: 516 entries; 194 mapped to 47 CX numbers plus SH, 322 excluded; zero unresolved. Screenshot opened as an image. Open question: later shared-shell research should classify Channels/Threads; their presence does not expand the Campaigns feature scope.
