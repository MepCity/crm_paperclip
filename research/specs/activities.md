# Activities — module metadata and list screens

Status: research for Grok QA inventory review and UI Lead metadata approval. MEP-23 / Module 5.

## Purpose

Define the Tasks baseline and the Meetings/Calls metadata differences. Reuse existing specs for shared controls. Meetings/Calls list evidence is recorded below; all record details, forms and write flows are separate research tasks. Tables below are generated from exported metadata; they contain configuration, never record values.

## Meetings list

The two permitted click-free captures show a loading skeleton, not a populated or empty list. The module heading, view selector, toolbar, filter panel, table/calendar presentation and footer are **not observed**. A loading skeleton does not establish an empty state. No list/calendar preference was changed. The existing Meetings Views table remains metadata evidence only.

Create-menu and Actions captures were not taken: neither trigger exists in the task's base controls.json, so a unique selector could not be validated. No alternative selector or navigation was attempted. No ML number is assigned to an unseen control.

### Control inventory — m5l-meetings-list-base

Shell: not observed; skeleton placeholders do not establish SH-01–SH-46. No shell-control difference can be assessed.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No painted interactive control. Loading text and decorative placeholders are not controls. Absent here: the rendered Tasks list baseline (TL controls) and shell (SH controls); absence during loading does not establish a Meetings feature difference.

### Control inventory — m5l-meetings-list-after

No changed interactive controls; the loading skeleton remains. Record links remain zero; total record count is not observed. This comparison does not verify persisted record counts.

Rest: as in m5l-meetings-list-base; covered by the overlay: none.

### Meetings source reconciliation

| Capture | Source ordinals | Destination / exclusion |
| --- | --- | --- |
| m5l-meetings-list-base | 1 | Excluded: navigation container without painted controls |
| m5l-meetings-list-base | 2–3 | Excluded: zero-area notification/message containers |
| m5l-meetings-list-after | 1 | Excluded: navigation container without painted controls |
| m5l-meetings-list-after | 2–3 | Excluded: zero-area notification/message containers |

Each capture: source items 3; mapped items 0; exclusions 3; distinct inventory numbers 0. Both screenshots were opened as images; no image-only interactive controls were visible.

## Calls list

Both permitted click-free captures show a loading skeleton. Title, view selector, toolbar, filter fields, table, footer, call type/direction indicators and handset actions are **not observed**. This is not an observed empty state. The Calls Views table remains metadata evidence; no view selector or view-type preference was exercised.

Create-menu and Actions captures were not taken: their triggers are absent from this task's base controls.json. No unique selector could be validated; no alternative was attempted. The distinction, labels and order of scheduling versus logging menu rows remain not observed. No CL number is assigned to an unseen control.

### Control inventory — m5l-calls-list-base

Shell: not observed; skeleton placeholders do not establish SH-01–SH-46. No shell-control difference can be assessed.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No painted interactive control. Loading text and decorative placeholders are not controls. Absent here: the rendered Tasks list baseline (TL controls) and shell (SH controls); absence during loading does not establish a Calls feature difference.

### Control inventory — m5l-calls-list-after

No changed interactive controls; the loading skeleton remains. Record links remain zero; total record count is not observed. This comparison does not verify persisted record counts.

Rest: as in m5l-calls-list-base; covered by the overlay: none.

### Calls source reconciliation

| Capture | Source ordinals | Destination / exclusion |
| --- | --- | --- |
| m5l-calls-list-base | 1 | Excluded: navigation container without painted controls |
| m5l-calls-list-base | 2–3 | Excluded: zero-area notification/message containers |
| m5l-calls-list-after | 1 | Excluded: navigation container without painted controls |
| m5l-calls-list-after | 2–3 | Excluded: zero-area notification/message containers |

Each capture: source items 3; mapped items 0; exclusions 3; distinct inventory numbers 0. Both screenshots were opened as images; no image-only interactive control was visible.

## Module family

| UI plural / singular | API module | View / create / edit / delete | Profiles |
| --- | --- | --- | --- |
| Tasks / Task | Tasks | true / true / true / true | Administrator; Standard |
| Meetings / Meeting | Events | true / true / true / true | Administrator; Standard |
| Calls / Call | Calls | true / true / true / true | Administrator; Standard |


## Layout

Tasks opens as a populated table, with the existing shell, view strip, toolbar, expanded filter panel and footer. Four text columns are visible; three further columns are clipped to the right. No view preference was changed. Metadata layouts below describe section order, not observed forms.

## Control inventory (Tasks list)

Stable numbers refer to control kinds; repeated row checkboxes and links reuse their number. Only the three specified menu triggers were requested. No menu row, checkbox, view icon or record action was exercised. Ref uses Accounts first, Contacts second; moved records positional differences.

### Control inventory — m5-tasks-list-base

Shell: SH-01–SH-46 as in contacts.md. Tasks (SH-20) is active; Contacts (SH-14) is inactive. SH-08 is visibly shortened to MCP. Shell rows are not repeated. The module heading is static text. SH-46 (trash icon) is image-only. No other shell difference was found.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TL-01 | View strip | All Tasks | tab | left, first | same | seen (m5-tasks-list-base) | M5 | AL-01 |
| TL-02 | View strip | Three dots icon | icon button | after current view tab | Opens the view menu | seen (m5-tasks-list-base) | M5 | AL-02 moved |
| TL-03 | Toolbar | Filter | button | left group, first | same | seen (m5-tasks-list-base) | M5 | AL-03 |
| TL-04 | Toolbar | Sort | button | left group, second | same | seen (m5-tasks-list-base) | M5 | AL-04 |
| TL-05 | Toolbar | List view icon (active) | icon button | view group, first | same | seen (m5-tasks-list-base) | M5 | AL-05 |
| TL-06 | Toolbar | Kanban view icon | icon button | view group, second | same | seen (m5-tasks-list-base) | M5 | AL-06 |
| TL-08 | Toolbar | Chart view icon | icon button | view group, third | same | seen (m5-tasks-list-base) | M5 | AL-08 moved |
| TL-09 | Toolbar | Timeline view icon | icon button | view group, fourth | same | seen (m5-tasks-list-base) | M5 | AL-09 moved |
| TL-10 | Toolbar | Two horizontal bars icon | icon button | view group, fifth | same | seen (m5-tasks-list-base) | M5 | AL-10 moved |
| TL-11 | Toolbar | Down chevron | icon button | view group, sixth | same | seen (m5-tasks-list-base) | M5 | AL-11 moved |
| TL-12 | Toolbar | Create Task | button | right group, first | same | seen (m5-tasks-list-base) | M5 | AL-12 |
| TL-13 | Toolbar | Down arrow / More | icon button | attached to Create Task | same | seen (m5-tasks-list-base) | M6 | AL-13 |
| TL-14 | Toolbar | Three dots / Actions | icon button | right group, far right | Opens the Actions menu | seen (m5-tasks-list-base) | M5 | AL-14 |
| TL-15 | Filter panel | Search | input | below Filter Tasks by heading | same | seen (m5-tasks-list-base) | M5 | AL-15 |
| TL-16 | Filter panel | System Defined Filters | toggle | first section heading | same | seen (m5-tasks-list-base) | M5 | AL-16 |
| TL-20 | Filter panel | Locked | checkbox | system-defined section, Locked | same | seen (m5-tasks-list-base) | M5 | AL-20 |
| TL-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | same | seen (m5-tasks-list-base) | M5 | AL-21 |
| TL-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | same | seen (m5-tasks-list-base) | M5 | AL-22 |
| TL-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | same | seen (m5-tasks-list-base) | M5 | AL-23 |
| TL-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | same | seen (m5-tasks-list-base) | M5 | AL-24 |
| TL-26 | Filter panel | Filter By Fields | toggle | second section heading | same | seen (m5-tasks-list-base) | M5 | AL-26 |
| TL-53 | Filter panel | Closed Time | checkbox | field section, row 1 | not observed | seen (m5-tasks-list-base) | M5 | new |
| TL-54 | Filter panel | Contact Name | checkbox | field section, row 2 | same | seen (m5-tasks-list-base) | M5 | L-31 moved |
| TL-55 | Filter panel | Created By | checkbox | field section, row 3 | not observed | seen (m5-tasks-list-base) | M5 | new |
| TL-56 | Filter panel | Created Time | checkbox | field section, row 4 | not observed | seen (m5-tasks-list-base) | M5 | new |
| TL-57 | Filter panel | Due Date | checkbox | field section, row 5 | not observed | seen (m5-tasks-list-base) | M5 | new |
| TL-58 | Filter panel | Last Activity Time | checkbox | field section, row 6 | not observed | seen (m5-tasks-list-base) | M5 | new |
| TL-59 | Filter panel | Modified By | checkbox | field section, row 7 | not observed | seen (m5-tasks-list-base) | M5 | new |
| TL-60 | Filter panel | Modified Time | checkbox | field section, row 8 | not observed | seen (m5-tasks-list-base) | M5 | new |
| TL-61 | Filter panel | Priority | checkbox | field section, row 9 | not observed | seen (m5-tasks-list-base) | M5 | new |
| TL-33 | Table | Sliders icon | icon button | header, far right overlay | same | seen (m5-tasks-list-base) | M11 | AL-33 |
| TL-34 | Table | Select all checkbox | checkbox | header, before Subject | same | seen (m5-tasks-list-base) | M5 | AL-34 |
| TL-35 | Table | Subject | column header | first text column | not observed | seen (m5-tasks-list-base) | M5 | new |
| TL-36 | Table | All with down arrow | select | within Subject header, right | same | seen (m5-tasks-list-base) | M5 | AL-36 |
| TL-62 | Table | Due Date | column header | second text column | not observed | seen (m5-tasks-list-base) | M5 | new |
| TL-63 | Table | Status | column header | third text column | not observed | seen (m5-tasks-list-base) | M5 | new |
| TL-64 | Table | Priority | column header | fourth text column | not observed | seen (m5-tasks-list-base) | M5 | new |
| TL-40 | Table | Record selection checkbox | checkbox | each visible row, before Subject | same | seen (m5-tasks-list-base) | M5 | AL-40 |
| TL-42 | Table | Task record link | link | Subject cells | same | seen (m5-tasks-list-base) | M5 | AL-42 |
| TL-48 | List footer | Total Records | badge | left | same | seen (m5-tasks-list-base) | M5 | AL-48 |
| TL-49 | List footer | Displayed record range | badge | right group, between arrows | same | seen (m5-tasks-list-base) | M5 | AL-49 |
| TL-50 | List footer | Previous | icon button | before range | same | seen (m5-tasks-list-base) | M5 | AL-50 |
| TL-51 | List footer | Next | icon button | after range | same | seen (m5-tasks-list-base) | M5 | AL-51 |

| TL-66 | Filter panel | Related To (partly clipped) | checkbox | field section, row 10 at bottom edge | not observed | seen (m5-tasks-list-base) | M5 | new |

Absent here: AL-07 (Sheet toolbar icon), AL-25 (Cadences), AL-27, AL-39, AL-45–AL-46, AL-52–AL-63 (Accounts-specific fields, columns, extra locked-view tab, handset/website actions). TL-53–TL-61 and TL-62–TL-64 replace the Accounts field filters and non-name columns. There is no visible completion checkbox/checkmark, completion button or status badge; Status is plain cell text. Hover-only row actions remain not observed. The Refresh affordance exists in controls.json but is not painted in the base image.

### Control inventory — m5-tasks-view-selector

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TL-02.1 | View menu | Search | input | popup, above Public Views | not observed | seen (m5-tasks-view-selector) | M5 | new |
| TL-02.2 | View menu | Public Views | toggle | popup, first section heading | same | seen (m5-tasks-view-selector) | M5 | AL-02.1 moved |
| TL-02.3 | View menu | All Locked Tasks | menu item | public views, row 1 | same | seen (m5-tasks-view-selector) | M5 | AL-02.3 moved |
| TL-02.4 | View menu | All Tasks | menu item | public views, row 2 | same | seen (m5-tasks-view-selector) | M5 | AL-02.2 moved |
| TL-02.5 | View menu | Closed Tasks | menu item | public views, row 3 | not observed | seen (m5-tasks-view-selector) | M5 | new |
| TL-02.6 | View menu | My Closed Tasks | menu item | public views, row 4 | not observed | seen (m5-tasks-view-selector) | M5 | new |
| TL-02.7 | View menu | My Next 7 Days + Overdue Tasks | menu item | public views, row 5 | not observed | seen (m5-tasks-view-selector) | M5 | new |
| TL-02.8 | View menu | My Open Tasks | menu item | public views, row 6 | not observed | seen (m5-tasks-view-selector) | M5 | new |
| TL-02.9 | View menu | My Overdue Tasks | menu item | public views, row 7 | not observed | seen (m5-tasks-view-selector) | M5 | new |
| TL-02.10 | View menu | My Tasks | menu item | public views, row 8 | same | seen (m5-tasks-view-selector) | M5 | AL-02.4 moved |
| TL-02.11 | View menu | My Today + Overdue Tasks | menu item | public views, row 9 | not observed | seen (m5-tasks-view-selector) | M5 | new |
| TL-02.12 | View menu | My Today's Tasks | menu item | public views, row 10 | not observed | seen (m5-tasks-view-selector) | M5 | new |
| TL-02.13 | View menu | My Tomorrow's Tasks | menu item | public views, row 11 | not observed | seen (m5-tasks-view-selector) | M5 | new |
| TL-02.14 | View menu | Next 7 Days + Overdue Tasks | menu item | public views, row 12 | not observed | seen (m5-tasks-view-selector) | M5 | new |
| TL-02.15 | View menu | Open Tasks | menu item | public views, row 13 | not observed | seen (m5-tasks-view-selector) | M5 | new |
| TL-02.16 | View menu | Overdue Tasks | menu item | public views, row 14 | not observed | seen (m5-tasks-view-selector) | M5 | new |
| TL-02.17 | View menu | Today + Overdue Tasks | menu item | public views, row 15 | not observed | seen (m5-tasks-view-selector) | M5 | new |
| TL-02.18 | View menu | Show custom views as Dropdown | button | popup, below view list | same | seen (m5-tasks-view-selector) | M5 | AL-02.10 |
| TL-02.19 | View menu | New Custom View | menu item | popup, penultimate row | same | seen (m5-tasks-view-selector) | M11 | AL-02.11 |
| TL-02.20 | View menu | Manage Custom View | menu item | popup, last row | same | seen (m5-tasks-view-selector) | M11 | AL-02.12 |

Rest: as in m5-tasks-list-base; covered by the overlay: TL-04–TL-11, TL-33–TL-36, TL-40, TL-42 and portions of TL-15–TL-16, TL-20–TL-24, TL-26, TL-48, TL-53–TL-61. Only Today + Overdue Tasks is painted at the bottom of the view list. Today's Tasks and Tomorrow's Tasks have source boxes but are clipped behind the fixed popup footer; they are metadata/DOM evidence, not visible menu rows. All Tasks carries the selected checkmark (part of its menu item).

### Control inventory — m5-tasks-create-menu

No opened or changed controls. The one requested click was skipped by the tool's dangerous-attribute guard. Menu contents remain not observed; no alternative selector was attempted.

Rest: as in m5-tasks-list-base; covered by the overlay: none.

### Control inventory — m5-tasks-actions

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TL-14.1 | Actions menu | Mass Transfer | menu item | popup, row 1 | same | seen (m5-tasks-actions) | M5 | AL-14.1 |
| TL-14.2 | Actions menu | Mass Delete | menu item | popup, row 2 | same | seen (m5-tasks-actions) | M5 | AL-14.2 |
| TL-14.3 | Actions menu | Mass Update | menu item | popup, row 3 | same | seen (m5-tasks-actions) | M5 | AL-14.3 |
| TL-14.4 | Actions menu | Manage Tags | menu item | popup, row 4 | same | seen (m5-tasks-actions) | M6 | AL-14.4 |
| TL-14.5 | Actions menu | Export Tasks | menu item | popup, row 5 | same | seen (m5-tasks-actions) | M6 | AL-14.8 moved |
| TL-14.6 | Actions menu | Print View | menu item | popup, last row | same | seen (m5-tasks-actions) | M5 | AL-14.10 moved |
| TL-65 | Toolbar | Refresh icon | icon button | after view-group down chevron | same | seen (m5-tasks-actions) | M5 | AL-64 |

Rest: as in m5-tasks-list-base; covered by the overlay: TL-33, part of TL-64 and Priority cells in the first three rows. Absent here: AL-14.5–AL-14.7 and AL-14.9 (Drafts, Deduplicate Accounts, Create Client Script, Sheet view). Print View is image-only. Decorative sparkles and the submenu arrow are parts of its row, not separate controls. No submenu was opened.


### Control inventory — m5-tasks-list-after

No changed controls. Total Records remains 12; displayed range remains 1 to 12. The table presentation and visible columns are unchanged.

Rest: as in m5-tasks-list-base; covered by the overlay: none.

### Shell controls missing from app-shell.md

No additional activity-only shell control. Reuse the missing-shell list in contacts.md. The shell trash icon SH-46 is painted but absent from controls.json. Unpainted resize affordances are excluded rather than represented as observed controls.

### Reconciliation of controls.json

Ordinals below are one-based positions in the saved controls list, not selectors. Every item is mapped or explicitly excluded. Nested wrappers mapped to a control are duplicates and do not increase the distinct-control count. Hidden/clipped DOM data is not treated as image evidence. Controls behind an overlay retain the base reference, as required by the Rest line. Image-only SH-46 is included in each distinct total; TL-14.6 is additionally image-only in Actions.

#### m5-tasks-list-base

| Source ordinals | Destination / exclusion |
| --- | --- |
| 1, 37, 51, 59, 62, 84, 88, 112, 120, 135, 140, 152, 188, 441 | Excluded: non-control wrapper / static text |
| 2–4 | SH-01 |
| 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 85, 92–93, 95–96, 98–99, 102–103, 108–111, 134, 138, 185–186, 190–191, 413–421, 426–440, 453 | Excluded: zero-size / invisible |
| 10 | SH-02 |
| 11, 13 | SH-03 |
| 14, 16 | SH-04 |
| 17, 19 | SH-05 |
| 20, 22 | SH-06 |
| 23, 25 | SH-07 |
| 26, 28 | SH-08 |
| 29–31 | SH-09 |
| 33 | SH-10 |
| 34–35 | SH-11 |
| 36 | SH-12 |
| 38–39 | SH-13 |
| 40–41 | SH-14 |
| 42–43 | SH-15 |
| 44–45 | SH-16 |
| 46–47 | SH-17 |
| 48–49 | SH-18 |
| 50 | SH-19 |
| 52–53 | SH-20 |
| 54–55 | SH-21 |
| 56–57 | SH-22 |
| 58 | SH-23 |
| 60–61 | SH-24 |
| 63–64 | SH-25 |
| 65–80, 206–209, 222–227, 239–244, 256–260, 272–277, 289–294, 306–311, 323–328, 340–345, 357–361, 373–378, 390–395, 407–412 | Excluded: outside visible viewport |
| 82, 187 | Excluded: unpainted resize affordance |
| 86 | SH-26 |
| 87 | SH-27 |
| 89 | SH-28 |
| 90 | SH-29 |
| 91 | SH-30 |
| 94 | SH-31 |
| 97 | SH-32 |
| 100–101 | SH-33 |
| 104–107 | SH-34 |
| 113 | TL-01 |
| 114–117 | TL-02 |
| 118 | TL-03 |
| 119 | TL-04 |
| 121 | TL-05 |
| 122 | TL-06 |
| 123 | TL-08 |
| 124 | TL-09 |
| 125 | TL-10 |
| 126–127 | TL-11 |
| 128–129 | Excluded: refresh not painted |
| 130 | TL-12 |
| 131–132 | TL-13 |
| 133 | TL-14 |
| 136–137 | TL-15 |
| 139 | TL-16 |
| 141–142 | TL-20 |
| 143–144 | TL-21 |
| 145–146 | TL-22 |
| 147–148 | TL-23 |
| 149–150 | TL-24 |
| 151 | TL-26 |
| 153–154 | TL-53 |
| 155–156 | TL-54 |
| 157–158 | TL-55 |
| 159–160 | TL-56 |
| 161–162 | TL-57 |
| 163–164 | TL-58 |
| 165–166 | TL-59 |
| 167–168 | TL-60 |
| 169–170 | TL-61 |
| 171–172 | TL-66 |
| 173–184 | Excluded: filter continuation below panel viewport |
| 189 | TL-33 |
| 192–197, 210–213, 216, 219–221, 228–230, 233, 236–238, 245–247, 250, 253–255, 261–263, 266, 269–271, 278–280, 283, 286–288, 295–297, 300, 303–305, 312–314, 317, 320–322, 329–331, 334, 337–339, 346–348, 351, 354–356, 362–364, 367, 370–372, 379–381, 384, 387–389 | Excluded: record row data / non-control wrapper |
| 198–199 | TL-34 |
| 200 | TL-35 |
| 201–202 | TL-36 |
| 203 | TL-62 |
| 204 | TL-63 |
| 205 | TL-64 |
| 214–215, 231–232, 248–249, 264–265, 281–282, 298–299, 315–316, 332–333, 349–350, 365–366, 382–383 | TL-40 |
| 217–218, 234–235, 251–252, 267–268, 284–285, 301–302, 318–319, 335–336, 352–353, 368–369, 385–386 | TL-42 |
| 396–406 | Excluded: last data row beneath list footer |
| 422 | TL-48 |
| 423 | TL-49 |
| 424 | TL-50 |
| 425 | TL-51 |
| 442 | SH-35 |
| 443 | SH-36 |
| 444 | SH-37 |
| 445 | SH-38 |
| 446 | SH-39 |
| 447 | SH-40 |
| 448 | SH-41 |
| 449 | SH-42 |
| 450 | SH-43 |
| 451 | SH-44 |
| 452 | SH-45 |

Source items 453; mapped items 180; exclusions 273; distinct inventory numbers including image-only controls 90. Image-only: SH-46.

#### m5-tasks-view-selector

| Source ordinals | Destination / exclusion |
| --- | --- |
| 1, 37, 51, 59, 62, 84, 88, 112, 120, 135, 140, 152, 188, 453–454, 457–458, 460 | Excluded: non-control wrapper / static text |
| 2–4 | SH-01 |
| 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 85, 92–93, 95–96, 98–99, 102–103, 108–111, 134, 138, 185–186, 190–191, 413–421, 426–441, 482 | Excluded: zero-size / invisible |
| 10 | SH-02 |
| 11, 13 | SH-03 |
| 14, 16 | SH-04 |
| 17, 19 | SH-05 |
| 20, 22 | SH-06 |
| 23, 25 | SH-07 |
| 26, 28 | SH-08 |
| 29–31 | SH-09 |
| 33 | SH-10 |
| 34–35 | SH-11 |
| 36 | SH-12 |
| 38–39 | SH-13 |
| 40–41 | SH-14 |
| 42–43 | SH-15 |
| 44–45 | SH-16 |
| 46–47 | SH-17 |
| 48–49 | SH-18 |
| 50 | SH-19 |
| 52–53 | SH-20 |
| 54–55 | SH-21 |
| 56–57 | SH-22 |
| 58 | SH-23 |
| 60–61 | SH-24 |
| 63–64 | SH-25 |
| 65–80, 206–209, 222–227, 239–244, 256–260, 272–277, 289–294, 306–311, 323–328, 340–345, 357–361, 373–378, 390–395, 407–412 | Excluded: outside visible viewport |
| 82, 187 | Excluded: unpainted resize affordance |
| 86 | SH-26 |
| 87 | SH-27 |
| 89 | SH-28 |
| 90 | SH-29 |
| 91 | SH-30 |
| 94 | SH-31 |
| 97 | SH-32 |
| 100–101 | SH-33 |
| 104–107 | SH-34 |
| 113 | TL-01 |
| 114–117 | TL-02 |
| 118 | TL-03 |
| 119 | TL-04 |
| 121 | TL-05 |
| 122 | TL-06 |
| 123 | TL-08 |
| 124 | TL-09 |
| 125 | TL-10 |
| 126–127 | TL-11 |
| 128–129 | Excluded: refresh not painted |
| 130 | TL-12 |
| 131–132 | TL-13 |
| 133 | TL-14 |
| 136–137 | TL-15 |
| 139 | TL-16 |
| 141–142 | TL-20 |
| 143–144 | TL-21 |
| 145–146 | TL-22 |
| 147–148 | TL-23 |
| 149–150 | TL-24 |
| 151 | TL-26 |
| 153–154 | TL-53 |
| 155–156 | TL-54 |
| 157–158 | TL-55 |
| 159–160 | TL-56 |
| 161–162 | TL-57 |
| 163–164 | TL-58 |
| 165–166 | TL-59 |
| 167–168 | TL-60 |
| 169–170 | TL-61 |
| 171–172 | TL-66 |
| 173–184 | Excluded: filter continuation below panel viewport |
| 189 | TL-33 |
| 192–197, 210–213, 216, 219–221, 228–230, 233, 236–238, 245–247, 250, 253–255, 261–263, 266, 269–271, 278–280, 283, 286–288, 295–297, 300, 303–305, 312–314, 317, 320–322, 329–331, 334, 337–339, 346–348, 351, 354–356, 362–364, 367, 370–372, 379–381, 384, 387–389 | Excluded: record row data / non-control wrapper |
| 198–199 | TL-34 |
| 200 | TL-35 |
| 201–202 | TL-36 |
| 203 | TL-62 |
| 204 | TL-63 |
| 205 | TL-64 |
| 214–215, 231–232, 248–249, 264–265, 281–282, 298–299, 315–316, 332–333, 349–350, 365–366, 382–383 | TL-40 |
| 217–218, 234–235, 251–252, 267–268, 284–285, 301–302, 318–319, 335–336, 352–353, 368–369, 385–386 | TL-42 |
| 396–406 | Excluded: last data row beneath list footer |
| 422 | TL-48 |
| 423 | TL-49 |
| 424 | TL-50 |
| 425 | TL-51 |
| 442 | SH-35 |
| 443 | SH-36 |
| 444 | SH-37 |
| 445 | SH-38 |
| 446 | SH-39 |
| 447 | SH-40 |
| 448 | SH-41 |
| 449 | SH-42 |
| 450 | SH-43 |
| 451 | SH-44 |
| 452 | SH-45 |
| 455–456 | TL-02.1 |
| 459 | TL-02.2 |
| 461 | TL-02.3 |
| 462 | TL-02.4 |
| 463 | TL-02.5 |
| 464 | TL-02.6 |
| 465 | TL-02.7 |
| 466 | TL-02.8 |
| 467 | TL-02.9 |
| 468 | TL-02.10 |
| 469 | TL-02.11 |
| 470 | TL-02.12 |
| 471 | TL-02.13 |
| 472 | TL-02.14 |
| 473 | TL-02.15 |
| 474 | TL-02.16 |
| 475 | TL-02.17 |
| 476–477 | Excluded: view rows clipped behind popup footer |
| 478 | TL-02.18 |
| 479–480 | TL-02.19 |
| 481, 483 | TL-02.20 |

Source items 483; mapped items 203; exclusions 280; distinct inventory numbers including image-only controls 110. Image-only: SH-46.

#### m5-tasks-create-menu

| Source ordinals | Destination / exclusion |
| --- | --- |
| 1, 37, 51, 59, 62, 84, 88, 112, 120, 135, 140, 152, 188, 453 | Excluded: non-control wrapper / static text |
| 2–4 | SH-01 |
| 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 85, 92–93, 95–96, 98–99, 102–103, 108–111, 134, 138, 185–186, 190–191, 413–421, 426–441 | Excluded: zero-size / invisible |
| 10 | SH-02 |
| 11, 13 | SH-03 |
| 14, 16 | SH-04 |
| 17, 19 | SH-05 |
| 20, 22 | SH-06 |
| 23, 25 | SH-07 |
| 26, 28 | SH-08 |
| 29–31 | SH-09 |
| 33 | SH-10 |
| 34–35 | SH-11 |
| 36 | SH-12 |
| 38–39 | SH-13 |
| 40–41 | SH-14 |
| 42–43 | SH-15 |
| 44–45 | SH-16 |
| 46–47 | SH-17 |
| 48–49 | SH-18 |
| 50 | SH-19 |
| 52–53 | SH-20 |
| 54–55 | SH-21 |
| 56–57 | SH-22 |
| 58 | SH-23 |
| 60–61 | SH-24 |
| 63–64 | SH-25 |
| 65–80, 206–209, 222–227, 239–244, 256–260, 272–277, 289–294, 306–311, 323–328, 340–345, 357–361, 373–378, 390–395, 407–412 | Excluded: outside visible viewport |
| 82, 187 | Excluded: unpainted resize affordance |
| 86 | SH-26 |
| 87 | SH-27 |
| 89 | SH-28 |
| 90 | SH-29 |
| 91 | SH-30 |
| 94 | SH-31 |
| 97 | SH-32 |
| 100–101 | SH-33 |
| 104–107 | SH-34 |
| 113 | TL-01 |
| 114–117 | TL-02 |
| 118 | TL-03 |
| 119 | TL-04 |
| 121 | TL-05 |
| 122 | TL-06 |
| 123 | TL-08 |
| 124 | TL-09 |
| 125 | TL-10 |
| 126–127 | TL-11 |
| 128–129 | Excluded: refresh not painted |
| 130 | TL-12 |
| 131–132 | TL-13 |
| 133 | TL-14 |
| 136–137 | TL-15 |
| 139 | TL-16 |
| 141–142 | TL-20 |
| 143–144 | TL-21 |
| 145–146 | TL-22 |
| 147–148 | TL-23 |
| 149–150 | TL-24 |
| 151 | TL-26 |
| 153–154 | TL-53 |
| 155–156 | TL-54 |
| 157–158 | TL-55 |
| 159–160 | TL-56 |
| 161–162 | TL-57 |
| 163–164 | TL-58 |
| 165–166 | TL-59 |
| 167–168 | TL-60 |
| 169–170 | TL-61 |
| 171–172 | TL-66 |
| 173–184 | Excluded: filter continuation below panel viewport |
| 189 | TL-33 |
| 192–197, 210–213, 216, 219–221, 228–230, 233, 236–238, 245–247, 250, 253–255, 261–263, 266, 269–271, 278–280, 283, 286–288, 295–297, 300, 303–305, 312–314, 317, 320–322, 329–331, 334, 337–339, 346–348, 351, 354–356, 362–364, 367, 370–372, 379–381, 384, 387–389 | Excluded: record row data / non-control wrapper |
| 198–199 | TL-34 |
| 200 | TL-35 |
| 201–202 | TL-36 |
| 203 | TL-62 |
| 204 | TL-63 |
| 205 | TL-64 |
| 214–215, 231–232, 248–249, 264–265, 281–282, 298–299, 315–316, 332–333, 349–350, 365–366, 382–383 | TL-40 |
| 217–218, 234–235, 251–252, 267–268, 284–285, 301–302, 318–319, 335–336, 352–353, 368–369, 385–386 | TL-42 |
| 396–406 | Excluded: last data row beneath list footer |
| 422 | TL-48 |
| 423 | TL-49 |
| 424 | TL-50 |
| 425 | TL-51 |
| 442 | SH-35 |
| 443 | SH-36 |
| 444 | SH-37 |
| 445 | SH-38 |
| 446 | SH-39 |
| 447 | SH-40 |
| 448 | SH-41 |
| 449 | SH-42 |
| 450 | SH-43 |
| 451 | SH-44 |
| 452 | SH-45 |

Source items 453; mapped items 180; exclusions 273; distinct inventory numbers including image-only controls 90. Image-only: SH-46.

#### m5-tasks-actions

| Source ordinals | Destination / exclusion |
| --- | --- |
| 1, 37, 51, 59, 62, 84, 88, 112, 120, 135, 140, 152, 188, 452 | Excluded: non-control wrapper / static text |
| 2–4 | SH-01 |
| 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 85, 92–93, 95–96, 98–99, 102–103, 108–111, 134, 138, 185–186, 190–191, 413–421, 426–441, 443, 445, 447, 449, 451 | Excluded: zero-size / invisible |
| 10 | SH-02 |
| 11, 13 | SH-03 |
| 14, 16 | SH-04 |
| 17, 19 | SH-05 |
| 20, 22 | SH-06 |
| 23, 25 | SH-07 |
| 26, 28 | SH-08 |
| 29–31 | SH-09 |
| 33 | SH-10 |
| 34–35 | SH-11 |
| 36 | SH-12 |
| 38–39 | SH-13 |
| 40–41 | SH-14 |
| 42–43 | SH-15 |
| 44–45 | SH-16 |
| 46–47 | SH-17 |
| 48–49 | SH-18 |
| 50 | SH-19 |
| 52–53 | SH-20 |
| 54–55 | SH-21 |
| 56–57 | SH-22 |
| 58 | SH-23 |
| 60–61 | SH-24 |
| 63–64 | SH-25 |
| 65–80, 206–209, 222–227, 239–244, 256–260, 272–277, 289–294, 306–311, 323–328, 340–345, 357–361, 373–378, 390–395, 407–412 | Excluded: outside visible viewport |
| 82, 187 | Excluded: unpainted resize affordance |
| 86 | SH-26 |
| 87 | SH-27 |
| 89 | SH-28 |
| 90 | SH-29 |
| 91 | SH-30 |
| 94 | SH-31 |
| 97 | SH-32 |
| 100–101 | SH-33 |
| 104–107 | SH-34 |
| 113 | TL-01 |
| 114–117 | TL-02 |
| 118 | TL-03 |
| 119 | TL-04 |
| 121 | TL-05 |
| 122 | TL-06 |
| 123 | TL-08 |
| 124 | TL-09 |
| 125 | TL-10 |
| 126–127 | TL-11 |
| 128–129 | TL-65 |
| 130 | TL-12 |
| 131–132 | TL-13 |
| 133 | TL-14 |
| 136–137 | TL-15 |
| 139 | TL-16 |
| 141–142 | TL-20 |
| 143–144 | TL-21 |
| 145–146 | TL-22 |
| 147–148 | TL-23 |
| 149–150 | TL-24 |
| 151 | TL-26 |
| 153–154 | TL-53 |
| 155–156 | TL-54 |
| 157–158 | TL-55 |
| 159–160 | TL-56 |
| 161–162 | TL-57 |
| 163–164 | TL-58 |
| 165–166 | TL-59 |
| 167–168 | TL-60 |
| 169–170 | TL-61 |
| 171–172 | TL-66 |
| 173–184 | Excluded: filter continuation below panel viewport |
| 189 | TL-33 |
| 192–197, 210–213, 216, 219–221, 228–230, 233, 236–238, 245–247, 250, 253–255, 261–263, 266, 269–271, 278–280, 283, 286–288, 295–297, 300, 303–305, 312–314, 317, 320–322, 329–331, 334, 337–339, 346–348, 351, 354–356, 362–364, 367, 370–372, 379–381, 384, 387–389 | Excluded: record row data / non-control wrapper |
| 198–199 | TL-34 |
| 200 | TL-35 |
| 201–202 | TL-36 |
| 203 | TL-62 |
| 204 | TL-63 |
| 205 | TL-64 |
| 214–215, 231–232, 248–249, 264–265, 281–282, 298–299, 315–316, 332–333, 349–350, 365–366, 382–383 | TL-40 |
| 217–218, 234–235, 251–252, 267–268, 284–285, 301–302, 318–319, 335–336, 352–353, 368–369, 385–386 | TL-42 |
| 396–406 | Excluded: last data row beneath list footer |
| 422 | TL-48 |
| 423 | TL-49 |
| 424 | TL-50 |
| 425 | TL-51 |
| 442 | TL-14.1 |
| 444 | TL-14.2 |
| 446 | TL-14.3 |
| 448 | TL-14.4 |
| 450 | TL-14.5 |
| 453 | SH-35 |
| 454 | SH-36 |
| 455 | SH-37 |
| 456 | SH-38 |
| 457 | SH-39 |
| 458 | SH-40 |
| 459 | SH-41 |
| 460 | SH-42 |
| 461 | SH-43 |
| 462 | SH-44 |
| 463 | SH-45 |

Source items 463; mapped items 187; exclusions 276; distinct inventory numbers including image-only controls 97. Image-only: SH-46, TL-14.6.

#### m5-tasks-list-after

| Source ordinals | Destination / exclusion |
| --- | --- |
| 1, 37, 51, 59, 62, 84, 88, 112, 120, 135, 140, 152, 188, 453 | Excluded: non-control wrapper / static text |
| 2–4 | SH-01 |
| 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 83, 85, 92–93, 95–96, 98–99, 102–103, 108–111, 134, 138, 185–186, 190–191, 413–421, 426–441 | Excluded: zero-size / invisible |
| 10 | SH-02 |
| 11, 13 | SH-03 |
| 14, 16 | SH-04 |
| 17, 19 | SH-05 |
| 20, 22 | SH-06 |
| 23, 25 | SH-07 |
| 26, 28 | SH-08 |
| 29–31 | SH-09 |
| 33 | SH-10 |
| 34–35 | SH-11 |
| 36 | SH-12 |
| 38–39 | SH-13 |
| 40–41 | SH-14 |
| 42–43 | SH-15 |
| 44–45 | SH-16 |
| 46–47 | SH-17 |
| 48–49 | SH-18 |
| 50 | SH-19 |
| 52–53 | SH-20 |
| 54–55 | SH-21 |
| 56–57 | SH-22 |
| 58 | SH-23 |
| 60–61 | SH-24 |
| 63–64 | SH-25 |
| 65–80, 206–209, 222–227, 239–244, 256–260, 272–277, 289–294, 306–311, 323–328, 340–345, 357–361, 373–378, 390–395, 407–412 | Excluded: outside visible viewport |
| 82, 187 | Excluded: unpainted resize affordance |
| 86 | SH-26 |
| 87 | SH-27 |
| 89 | SH-28 |
| 90 | SH-29 |
| 91 | SH-30 |
| 94 | SH-31 |
| 97 | SH-32 |
| 100–101 | SH-33 |
| 104–107 | SH-34 |
| 113 | TL-01 |
| 114–117 | TL-02 |
| 118 | TL-03 |
| 119 | TL-04 |
| 121 | TL-05 |
| 122 | TL-06 |
| 123 | TL-08 |
| 124 | TL-09 |
| 125 | TL-10 |
| 126–127 | TL-11 |
| 128–129 | Excluded: refresh not painted |
| 130 | TL-12 |
| 131–132 | TL-13 |
| 133 | TL-14 |
| 136–137 | TL-15 |
| 139 | TL-16 |
| 141–142 | TL-20 |
| 143–144 | TL-21 |
| 145–146 | TL-22 |
| 147–148 | TL-23 |
| 149–150 | TL-24 |
| 151 | TL-26 |
| 153–154 | TL-53 |
| 155–156 | TL-54 |
| 157–158 | TL-55 |
| 159–160 | TL-56 |
| 161–162 | TL-57 |
| 163–164 | TL-58 |
| 165–166 | TL-59 |
| 167–168 | TL-60 |
| 169–170 | TL-61 |
| 171–172 | TL-66 |
| 173–184 | Excluded: filter continuation below panel viewport |
| 189 | TL-33 |
| 192–197, 210–213, 216, 219–221, 228–230, 233, 236–238, 245–247, 250, 253–255, 261–263, 266, 269–271, 278–280, 283, 286–288, 295–297, 300, 303–305, 312–314, 317, 320–322, 329–331, 334, 337–339, 346–348, 351, 354–356, 362–364, 367, 370–372, 379–381, 384, 387–389 | Excluded: record row data / non-control wrapper |
| 198–199 | TL-34 |
| 200 | TL-35 |
| 201–202 | TL-36 |
| 203 | TL-62 |
| 204 | TL-63 |
| 205 | TL-64 |
| 214–215, 231–232, 248–249, 264–265, 281–282, 298–299, 315–316, 332–333, 349–350, 365–366, 382–383 | TL-40 |
| 217–218, 234–235, 251–252, 267–268, 284–285, 301–302, 318–319, 335–336, 352–353, 368–369, 385–386 | TL-42 |
| 396–406 | Excluded: last data row beneath list footer |
| 422 | TL-48 |
| 423 | TL-49 |
| 424 | TL-50 |
| 425 | TL-51 |
| 442 | SH-35 |
| 443 | SH-36 |
| 444 | SH-37 |
| 445 | SH-38 |
| 446 | SH-39 |
| 447 | SH-40 |
| 448 | SH-41 |
| 449 | SH-42 |
| 450 | SH-43 |
| 451 | SH-44 |
| 452 | SH-45 |

Source items 453; mapped items 180; exclusions 273; distinct inventory numbers including image-only controls 90. Image-only: SH-46.



## Fields shared by the three types

Each cell records API name, JSON representation, system mandatory, layout required, length, unique, and read_only / field_read_only respectively. Shared label/type does not imply identical permissions or flags. No field has a non-empty unique configuration.

| Field | Tasks | Meetings | Calls |
| --- | --- | --- | --- |
| Contact Name (`lookup`) | `Who_Id`; jsonobject; mandatory False; required Standard: false; length 120; unique no; RO False / False | `Who_Id`; jsonobject; mandatory False; required Standard: false; length 120; unique no; RO False / False | `Who_Id`; jsonobject; mandatory False; required Standard: false; length 120; unique no; RO False / False |
| Related To (`lookup`) | `What_Id`; jsonobject; mandatory False; required Standard: false; length 120; unique no; RO False / False | `What_Id`; jsonobject; mandatory False; required Standard: false; length 120; unique no; RO False / False | `What_Id`; jsonobject; mandatory False; required Standard: false; length 120; unique no; RO False / False |
| Created By (`ownerlookup`) | `Created_By`; jsonobject; mandatory False; required Standard: false; length 120; unique no; RO False / False | `Created_By`; jsonobject; mandatory False; required Standard: false; length 120; unique no; RO False / False | `Created_By`; jsonobject; mandatory False; required Standard: false; length 120; unique no; RO False / False |
| Modified By (`ownerlookup`) | `Modified_By`; jsonobject; mandatory False; required Standard: false; length 120; unique no; RO False / False | `Modified_By`; jsonobject; mandatory False; required Standard: false; length 120; unique no; RO False / False | `Modified_By`; jsonobject; mandatory False; required Standard: false; length 120; unique no; RO False / False |
| Created Time (`datetime`) | `Created_Time`; string; mandatory False; required Standard: false; length 120; unique no; RO False / False | `Created_Time`; string; mandatory False; required Standard: false; length 120; unique no; RO False / False | `Created_Time`; string; mandatory False; required Standard: false; length 120; unique no; RO False / False |
| Modified Time (`datetime`) | `Modified_Time`; string; mandatory False; required Standard: false; length 120; unique no; RO False / False | `Modified_Time`; string; mandatory False; required Standard: false; length 120; unique no; RO False / False | `Modified_Time`; string; mandatory False; required Standard: false; length 120; unique no; RO False / False |
| Description (`textarea`) | `Description`; string; mandatory False; required Standard: false; length 32000; unique no; RO False / False | `Description`; string; mandatory False; required Standard: false; length 32000; unique no; RO False / False | `Description`; string; mandatory False; required Standard: false; length 32000; unique no; RO False / False |
| Tag (`text`) | `Tag`; jsonarray; mandatory False; required Standard: false; length 2000; unique no; RO False / False | `Tag`; jsonarray; mandatory False; required Standard: false; length 2000; unique no; RO False / False | `Tag`; jsonarray; mandatory False; required Standard: false; length 2000; unique no; RO False / False |
| Record Id (`bigint`) | `id`; string; mandatory False; required Standard: false; length 18; unique no; RO True / True | `id`; string; mandatory False; required Standard: false; length 18; unique no; RO True / True | `id`; string; mandatory False; required Standard: false; length 18; unique no; RO True / True |
| Last Activity Time (`datetime`) | `Last_Activity_Time`; string; mandatory False; required Standard: false; length 120; unique no; RO False / False | `Last_Activity_Time`; string; mandatory False; required Standard: false; length 120; unique no; RO False / False | `Last_Activity_Time`; string; mandatory False; required Standard: false; length 120; unique no; RO False / False |


## Tasks fields and layout

Baseline. `fields.json`: 20 fields.

| Layout | Visible | Default profiles | Section / order | Columns | Fields in exported order |
| --- | --- | --- | --- | --- | --- |
| Standard | True | Administrator: True; Standard: True | Task Information / 1 | 1 | `Owner`, `Subject`, `Due_Date`, `Who_Id`, `What_Id`, `Status`, `Priority`, `Created_By`, `Tag`, `Send_Notification_Email`, `Modified_By`, `Remind_At`, `Created_Time`, `Modified_Time`, `Recurring_Activity`, `Closed_Time`, `id`, `Last_Activity_Time` |
| Standard | True | Administrator: True; Standard: True | Description Information / 2 | 1 | `Description` |

| Label | API name | Type / JSON | System mandatory | Layout required | Unique | Length | read_only / field_read_only |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Task Owner | `Owner` | ownerlookup / jsonobject | False | Standard: false | no | 120 | False / True |
| Subject | `Subject` | text / string | True | Standard: true | no | 255 | False / False |
| Due Date | `Due_Date` | date / string | False | Standard: false | no | 20 | False / False |
| Status | `Status` | picklist / string | False | Standard: false | no | 120 | False / False |
| Priority | `Priority` | picklist / string | False | Standard: false | no | 120 | False / False |
| Send Notification Email | `Send_Notification_Email` | boolean / boolean | False | Standard: false | no | 5 | False / False |
| Reminder | `Remind_At` | ALARM / jsonobject | False | Standard: false | no | 100 | False / False |
| Repeat | `Recurring_Activity` | RRULE / jsonobject | False | Standard: false | no | 100 | False / False |
| Closed Time | `Closed_Time` | datetime / string | False | Standard: false | no | 120 | True / True |
| Locked | `Locked__s` | boolean / boolean | False | Standard: not in layout | no | 5 | True / True |


Status and Priority option order is below. Closed Tasks views test `Status = Completed`; this is metadata evidence for closure, not an observed completion action. Due Date is a date string; Closed Time a datetime string; Reminder an ALARM object; Repeat an RRULE object; Send Notification Email a boolean. No reminder/repeat keys or transition rule are supplied by this export.


## Meetings fields and layout

Shared fields are defined above against Tasks; the following dictionary contains only labels/types not shared by all three. `fields.json`: 34 fields.

| Layout | Visible | Default profiles | Section / order | Columns | Fields in exported order |
| --- | --- | --- | --- | --- | --- |
| Standard | True | Administrator: True; Standard: True | Meeting Information / 1 | 1 | `Event_Title`, `Meeting_Venue__s`, `Venue`, `Meeting_Provider__s`, `All_day`, `Start_DateTime`, `End_DateTime`, `Owner`, `Participants`, `Who_Id`, `Created_By`, `Recurring_Activity`, `Modified_By`, `Created_Time`, `Modified_Time`, `Remind_Participants`, `Last_Activity_Time`, `What_Id` |
| Standard | True | Administrator: True; Standard: True | Meeting Additional Information / 2 | 1 | `Description`, `Remind_At`, `Check_In_Time`, `Check_In_By`, `Check_In_Comment`, `Check_In_Sub_Locality`, `Check_In_City`, `Check_In_State`, `Check_In_Country`, `Latitude`, `Longitude`, `ZIP_Code`, `Check_In_Address`, `Check_In_Status`, `Tag`, `id` |

| Label | API name | Type / JSON | System mandatory | Layout required | Unique | Length | read_only / field_read_only |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Host | `Owner` | ownerlookup / jsonobject | False | Standard: false | no | 120 | False / True |
| Title | `Event_Title` | text / string | True | Standard: true | no | 255 | False / False |
| Location | `Venue` | text / string | False | Standard: false | no | 255 | False / False |
| Repeat | `Recurring_Activity` | RRULE / jsonobject | False | Standard: false | no | 100 | False / False |
| Reminder | `Remind_At` | multireminder / jsonarray | False | Standard: false | no | 100 | False / False |
| All day | `All_day` | boolean / boolean | False | Standard: false | no | 5 | False / False |
| Participants | `Participants` | bigint / jsonarray | False | Standard: false | no | 120 | False / False |
| Check-In Time | `Check_In_Time` | datetime / string | False | Standard: false | no | 120 | True / True |
| Check-In By | `Check_In_By` | ownerlookup / jsonobject | False | Standard: false | no | 120 | True / True |
| Check-In Comment | `Check_In_Comment` | textarea / string | False | Standard: false | no | 3000 | True / True |
| Check-In Sub-Locality | `Check_In_Sub_Locality` | text / string | False | Standard: false | no | 250 | True / True |
| Check-In City | `Check_In_City` | text / string | False | Standard: false | no | 100 | True / True |
| Check-In State | `Check_In_State` | text / string | False | Standard: false | no | 100 | True / True |
| Check-In Country | `Check_In_Country` | text / string | False | Standard: false | no | 100 | True / True |
| Latitude | `Latitude` | double / double | False | Standard: false | no | 30 | True / True |
| Longitude | `Longitude` | double / double | False | Standard: false | no | 30 | True / True |
| Zip Code | `ZIP_Code` | text / string | False | Standard: false | no | 30 | True / True |
| Check-In Address | `Check_In_Address` | textarea / string | False | Standard: false | no | 2000 | True / True |
| Checked In Status | `Check_In_Status` | text / string | False | Standard: false | no | 30 | True / True |
| From | `Start_DateTime` | datetime / string | True | Standard: true | no | 120 | False / False |
| To | `End_DateTime` | datetime / string | True | Standard: true | no | 120 | False / False |
| Participants Reminder | `Remind_Participants` | multireminder / jsonarray | False | Standard: false | no | 100 | False / False |
| Meeting Venue | `Meeting_Venue__s` | picklist / string | True | Standard: true | no | 120 | False / False |
| Provider | `Meeting_Provider__s` | picklist / string | False | Standard: false | no | 120 | False / False |


From / To are `Start_DateTime` / `End_DateTime`; both are required in Standard. All day is boolean, Host is the owner lookup, Participants is bigint / jsonarray. Reminder and Participants Reminder use multireminder arrays, while Repeat reuses Tasks RRULE. Meeting Venue is a picklist; Provider has no exported options. Check-In location fields form one group: Sub-Locality, City, State, Country, Latitude, Longitude, Zip Code, Address (types/lengths in the dictionary). Check-In Time, By and Comment accompany Checked In Status (`text`, not an exported picklist). Visibility dependencies and check-in transitions are not specified.


## Calls fields and layout

Shared fields are defined above against Tasks; the following dictionary contains only labels/types not shared by all three. `fields.json`: 26 fields.

| Layout | Visible | Default profiles | Section / order | Columns | Fields in exported order |
| --- | --- | --- | --- | --- | --- |
| Standard | True | Administrator: True; Standard: True | Call Information / 1 | 1 | `Who_Id`, `What_Id`, `Call_Type`, `Outgoing_Call_Status`, `Call_Start_Time`, `Dialled_Number`, `Call_Duration`, `Caller_ID`, `Owner`, `Subject`, `Created_By`, `Modified_By`, `Created_Time`, `Modified_Time`, `Voice_Recording__s`, `Reminder`, `Call_Duration_in_seconds`, `Scheduled_In_CRM`, `Tag`, `id`, `Last_Activity_Time` |
| Standard | True | Administrator: True; Standard: True | Purpose Of Outgoing Call / 2 | 1 | `Call_Purpose`, `Call_Agenda` |
| Standard | True | Administrator: True; Standard: True | Outcome Of Outgoing Call / 3 | 1 | `Call_Result`, `Description` |
| Standard | True | Administrator: True; Standard: True | Reason For Incoming Call / 4 | 1 | `Description` |

| Label | API name | Type / JSON | System mandatory | Layout required | Unique | Length | read_only / field_read_only |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Call Owner | `Owner` | ownerlookup / jsonobject | False | Standard: false | no | 120 | True / False |
| Subject | `Subject` | text / string | False | Standard: false | no | 255 | False / False |
| Call Type | `Call_Type` | picklist / string | True | Standard: true | no | 120 | False / False |
| Call Purpose | `Call_Purpose` | picklist / string | False | Standard: false | no | 120 | False / False |
| Call Start Time | `Call_Start_Time` | datetime / string | True | Standard: true | no | 120 | False / False |
| Call Duration | `Call_Duration` | text / string | True | Standard: true | no | 50 | False / False |
| Call Duration (in seconds) | `Call_Duration_in_seconds` | integer / integer | False | Standard: false | no | 50 | False / False |
| Call Result | `Call_Result` | picklist / string | False | Standard: false | no | 120 | False / False |
| CTI Entry | `CTI_Entry` | boolean / boolean | False | Standard: not in layout | no | 5 | False / False |
| Reminder | `Reminder` | picklist / string | False | Standard: false | no | 100 | False / False |
| Outgoing Call Status | `Outgoing_Call_Status` | picklist / string | False | Standard: false | no | 120 | False / False |
| Scheduled in CRM | `Scheduled_In_CRM` | picklist / string | False | Standard: false | no | 120 | True / True |
| Call Agenda | `Call_Agenda` | text / string | False | Standard: false | no | 255 | False / False |
| Caller ID | `Caller_ID` | text / string | False | Standard: false | no | 30 | True / True |
| Dialled Number | `Dialled_Number` | text / string | False | Standard: false | no | 30 | True / True |
| Voice Recording | `Voice_Recording__s` | website / string | False | Standard: false | no | 1000 | False / False |


Call Duration is text; duration in seconds is integer. Reminder is a picklist, unlike Tasks/Meetings. Outgoing purpose/agenda and outcome/result/description, and incoming reason/description are section labels in metadata; no conditional visibility expression by Call Type/status is supplied. CTI Entry is absent from Standard sections although present in the field dictionary. Scheduled in CRM is a string picklist, not a boolean. Caller ID / Dialled Number are text and Voice Recording is website / string. Do not infer transition or dialling behaviour from these types.


## Picklists

Display → actual pairs retain exported order; equal pairs are shown once. An empty catalog means not supplied, not an invented list. Subject remains type text despite carrying suggestions.

### Tasks

| Field | Options (display → actual) |
| --- | --- |
| Subject | Email; Call; Meeting; Send Letter; Product Demo |
| Status | Not Started; Deferred; In Progress; Completed; Waiting for input → Waiting on someone else |
| Priority | High; Highest; Low; Lowest; Normal |

### Meetings

| Field | Options (display → actual) |
| --- | --- |
| Meeting_Venue__s | In-office; Client location; Online |
| Meeting_Provider__s | not supplied |

### Calls

| Field | Options (display → actual) |
| --- | --- |
| Call_Type | Outbound; Inbound; Missed |
| Call_Purpose | -None-; Prospecting; Administrative; Negotiation; Demo; Project; Desk → Support |
| Call_Result | -None-; Interested; Not interested; No response/Busy; Requested more info; Requested call back; Invalid number |
| Reminder | None → none; 5 minutes before → 5 mins; 10 minutes before → 10 mins; 15 minutes before → 15 mins; 30 minutes before → 30 mins; 1 hour before → 1 hrs; 2 hours before → 2 hrs; 1 day before → 1 days; 2 days before → 2 days |
| Outgoing_Call_Status | -None-; Scheduled; Completed; Overdue; Cancelled |
| Scheduled_In_CRM | False; True |


## Lookups and relations (who / what)

The complete exported target list is below. `se_module` is a polymorphic marker, not an enumerated target catalog. `multi_module_lookup` is empty on these fields; metadata does not enumerate additional Related To targets or specify whether one lookup constrains the other. Do not expand this marker into a guessed module list.

| Module | Field | Target module(s) supplied | Required | Relation API / label | Edit revalidation / query |
| --- | --- | --- | --- | --- | --- |
| Tasks | Contact Name / `Who_Id` | Contacts | Standard: false | Tasks / Open Tasks | False / no system query |
| Tasks | Related To / `What_Id` | se_module | Standard: false | None / activities | not supplied / no system query |
| Meetings | Contact Name / `Who_Id` | Contacts | Standard: false | Events / Open Meetings | False / no system query |
| Meetings | Related To / `What_Id` | se_module | Standard: false | None / activities | not supplied / no system query |
| Calls | Contact Name / `Who_Id` | Contacts | Standard: false | Calls / Open Calls | False / no system query |
| Calls | Related To / `What_Id` | se_module | Standard: false | None / activities | not supplied / no system query |


### Incoming activity relations

Scan of all exported module fields and related lists; no record IDs or values are included. Mixed Activities relations are retained without assuming that their target key equals a single activity type.

| Source module | Kind | Label | Target module key | Relation API | Order / visible |
| --- | --- | --- | --- | --- | --- |
| Accounts | related list | Open Calls | Calls | Calls | 8 / True |
| Accounts | related list | Open Meetings | Events | Events | 9 / True |
| Accounts | related list | Open Tasks | Tasks | Tasks | 10 / True |
| Accounts | related list | Closed Tasks | Tasks | Tasks_History | 13 / True |
| Accounts | related list | Closed Meetings | Events | Events_History | 14 / True |
| Accounts | related list | Closed Calls | Calls | Calls_History | 15 / True |
| Campaigns | related list | Open Calls | Calls | Calls | 6 / True |
| Campaigns | related list | Open Meetings | Events | Events | 7 / True |
| Campaigns | related list | Open Tasks | Tasks | Tasks | 8 / True |
| Campaigns | related list | Closed Tasks | Tasks | Tasks_History | 10 / True |
| Campaigns | related list | Closed Meetings | Events | Events_History | 11 / True |
| Campaigns | related list | Closed Calls | Calls | Calls_History | 12 / True |
| Cases | related list | Open Tasks | Tasks | Tasks | 6 / True |
| Cases | related list | Open Meetings | Events | Events | 7 / True |
| Cases | related list | Open Calls | Calls | Calls | 8 / True |
| Cases | related list | Closed Calls | Calls | Calls_History | 11 / True |
| Cases | related list | Closed Meetings | Events | Events_History | 12 / True |
| Cases | related list | Closed Tasks | Tasks | Tasks_History | 13 / True |
| Contacts | related list | Open Calls | Calls | Calls | 8 / True |
| Contacts | related list | Open Meetings | Events | Events | 9 / True |
| Contacts | related list | Open Tasks | Tasks | Tasks | 10 / True |
| Contacts | related list | Closed Tasks | Tasks | Tasks_History | 13 / True |
| Contacts | related list | Closed Meetings | Events | Events_History | 14 / True |
| Contacts | related list | Closed Calls | Calls | Calls_History | 15 / True |
| Contacts | related list | Invited Meetings | Events | Invited_Events | 16 / True |
| Deals | related list | Open Tasks | Tasks | Tasks | 8 / True |
| Deals | related list | Open Meetings | Events | Events | 9 / True |
| Deals | related list | Open Calls | Calls | Calls | 10 / True |
| Deals | related list | Closed Tasks | Tasks | Tasks_History | 12 / True |
| Deals | related list | Closed Meetings | Events | Events_History | 13 / True |
| Deals | related list | Closed Calls | Calls | Calls_History | 14 / True |
| Invoices | related list | Open Tasks | Tasks | Tasks | 6 / True |
| Invoices | related list | Open Meetings | Events | Events | 7 / True |
| Invoices | related list | Open Calls | Calls | Calls | 8 / True |
| Invoices | related list | Closed Calls | Calls | Calls_History | 11 / True |
| Invoices | related list | Closed Meetings | Events | Events_History | 12 / True |
| Invoices | related list | Closed Tasks | Tasks | Tasks_History | 13 / True |
| Leads | related list | Open Calls | Calls | Calls | 7 / True |
| Leads | related list | Open Meetings | Events | Events | 8 / True |
| Leads | related list | Open Tasks | Tasks | Tasks | 9 / True |
| Leads | related list | Closed Tasks | Tasks | Tasks_History | 11 / True |
| Leads | related list | Closed Meetings | Events | Events_History | 12 / True |
| Leads | related list | Closed Calls | Calls | Calls_History | 13 / True |
| Leads | related list | Invited Meetings | Events | Invited_Events | 16 / True |
| Products | related list | Open Calls | Calls | Calls | 7 / True |
| Products | related list | Open Meetings | Events | Events | 8 / True |
| Products | related list | Open Tasks | Tasks | Tasks | 9 / True |
| Products | related list | Closed Tasks | Tasks | Tasks_History | 11 / True |
| Products | related list | Closed Meetings | Events | Events_History | 12 / True |
| Products | related list | Closed Calls | Calls | Calls_History | 13 / True |
| Purchase_Orders | related list | Open Tasks | Tasks | Tasks | 6 / True |
| Purchase_Orders | related list | Open Meetings | Events | Events | 7 / True |
| Purchase_Orders | related list | Open Calls | Calls | Calls | 8 / True |
| Purchase_Orders | related list | Closed Calls | Calls | Calls_History | 10 / True |
| Purchase_Orders | related list | Closed Meetings | Events | Events_History | 11 / True |
| Purchase_Orders | related list | Closed Tasks | Tasks | Tasks_History | 12 / True |
| Qualify_Leads_through_Call | field | Call attempt 1 > Trigger - Call unattended > Call | Calls | Call_attempt_1_Trigger_Call_unattended_Call | — |
| Qualify_Leads_through_Call | field | Scheduled call > Trigger - Create > CreatedRecord | Calls | Scheduled_call_Trigger_Create_CreatedRecord | — |
| Qualify_Leads_through_Call | field | Lead incoming call > Trigger - Call received > Call | Calls | Lead_incoming_call_Trigger_Call_received_Call | — |
| Qualify_Leads_through_Call | field | Call attempt direct > Trigger - Call unattended > Call | Calls | Call_attempt_direct_Trigger_Call_unattended_Call | — |
| Qualify_Leads_through_Call | field | Lead incoming call from create > Trigger - Call received > Call | Calls | Lead_incoming_call_from_create_Trigger_Call_receiv | — |
| Qualify_Leads_through_Call | field | Lead incoming call after call attempt 1 > Trigger - Call received > Call | Calls | Lead_incoming_call_after_call_attempt_1_Trigger_Ca | — |
| Qualify_Leads_through_Call | field | Lead contacted us 3 > Trigger - Call received > Call | Calls | Lead_contacted_us_3_Trigger_Call_received_Call | — |
| Qualify_Leads_through_Call | field | Lead incoming call after call attempt 2 > Trigger - Call received > Call | Calls | Lead_incoming_call_after_call_attempt_2_Trigger_Ca | — |
| Qualify_Leads_through_Call | field | Call attempt 2 > Trigger - Call unattended > Call | Calls | Call_attempt_2_Trigger_Call_unattended_Call | — |
| Qualify_Leads_through_Call | field | Missed scheduled call > Trigger - Call overdue > Call | Calls | Missed_scheduled_call_Trigger_Call_overdue_Call | — |
| Qualify_Leads_through_Email | field | Lead Clicked on Email > instant_action_Task1 > AssignedTask | Tasks | Lead_Clicked_on_Email_instant_action_Task1_Assigne | — |
| Qualify_Leads_through_Email | field | Lead opened Email > scheduled_action1_Task1 > AssignedTask | Tasks | Lead_opened_Email_scheduled_action1_Task1_Assigned | — |
| Quotes | related list | Open Calls | Calls | Calls | 7 / True |
| Quotes | related list | Open Meetings | Events | Events | 8 / True |
| Quotes | related list | Open Tasks | Tasks | Tasks | 9 / True |
| Quotes | related list | Closed Tasks | Tasks | Tasks_History | 10 / True |
| Quotes | related list | Closed Meetings | Events | Events_History | 11 / True |
| Quotes | related list | Closed Calls | Calls | Calls_History | 12 / True |
| Sales_Journey_Default_Path_Finder | field | Task Created > Touchpoint - Create - 1 > CreatedRecord | Tasks | Task_Created_Touchpoint_Create_1_CreatedRecord | — |
| Sales_Journey_Default_Path_Finder | field | Task Created > Touchpoint - Edit - 1 > EditedRecord | Tasks | Task_Created_Touchpoint_Edit_1_EditedRecord | — |
| Sales_Journey_Default_Path_Finder | field | Task Deferred > Touchpoint - Edit - 1 > EditedRecord | Tasks | Task_Deferred_Touchpoint_Edit_1_EditedRecord | — |
| Sales_Journey_Default_Path_Finder | field | Task Deferred > Touchpoint - Create - 1 > CreatedRecord | Tasks | Task_Deferred_Touchpoint_Create_1_CreatedRecord | — |
| Sales_Journey_Default_Path_Finder | field | Task in Progress > Touchpoint - Edit - 1 > EditedRecord | Tasks | Task_in_Progress_Touchpoint_Edit_1_EditedRecord | — |
| Sales_Journey_Default_Path_Finder | field | Task in Progress > Touchpoint - Create - 1 > CreatedRecord | Tasks | Task_in_Progress_Touchpoint_Create_1_CreatedRecord | — |
| Sales_Journey_Default_Path_Finder | field | Task Completed > Touchpoint - Create - 1 > CreatedRecord | Tasks | Task_Completed_Touchpoint_Create_1_CreatedRecord | — |
| Sales_Journey_Default_Path_Finder | field | Task Completed > Touchpoint - Edit - 1 > EditedRecord | Tasks | Task_Completed_Touchpoint_Edit_1_EditedRecord | — |
| Sales_Journey_Default_Path_Finder | field | Meeting Created > Touchpoint - Create - 1 > CreatedRecord | Events | Meeting_Created_Touchpoint_Create_1_CreatedRecord | — |
| Sales_Journey_Default_Path_Finder | field | Call Created > Touchpoint - Create - 1 > CreatedRecord | Calls | Call_Created_Touchpoint_Create_1_CreatedRecord | — |
| Sales_Orders | related list | Open Tasks | Tasks | Tasks | 7 / True |
| Sales_Orders | related list | Open Meetings | Events | Events | 8 / True |
| Sales_Orders | related list | Open Calls | Calls | Calls | 9 / True |
| Sales_Orders | related list | Closed Meetings | Events | Events_History | 10 / True |
| Sales_Orders | related list | Closed Calls | Calls | Calls_History | 12 / True |
| Sales_Orders | related list | Closed Tasks | Tasks | Tasks_History | 13 / True |
| Vendors | related list | Open Meetings | Events | Events | 8 / True |
| Vendors | related list | Open Calls | Calls | Calls | 10 / True |
| Vendors | related list | Open Tasks | Tasks | Tasks | 11 / True |
| Vendors | related list | Closed Tasks | Tasks | Tasks_History | 15 / True |
| Vendors | related list | Closed Meetings | Events | Events_History | 16 / True |
| Vendors | related list | Closed Calls | Calls | Calls_History | 17 / True |


## Field types new in this module

Set difference against Leads, Contacts, Accounts and Deals field dictionaries. The export supplies JSON type only; nested reminder/recurrence/participant record schemas are not supplied.

| Type | Metadata representation | Fields |
| --- | --- | --- |
| ALARM | jsonobject | Tasks.Remind_At |
| RRULE | jsonobject | Tasks.Recurring_Activity; Events.Recurring_Activity |
| multireminder | jsonarray | Events.Remind_At; Events.Remind_Participants |


Participants is an additional representation difference: bigint / jsonarray rather than the shared Record Id bigint / string. Related To remains lookup / jsonobject with `se_module`, not a new declared data_type.

## Views

Generated from view summaries and each matching detailed custom-view export. `null` sort is unspecified, never a guessed default. All listed views are public/system-defined. Criteria preserve operators and dynamic tokens; identifiers are omitted.


### Tasks

| View | Default | Criteria | Columns (order) | Sort field / order |
| --- | --- | --- | --- | --- |
| All Locked Tasks | False | Locked__s equal True | Subject, Due_Date, Status, Priority, What_Id, Who_Id, Owner | null / null |
| All Tasks | True | none | Subject, Due_Date, Status, Priority, What_Id, Who_Id, Owner | null / null |
| Closed Tasks | False | Status equal Completed | Subject, Due_Date, Status, Priority, What_Id, Who_Id, Owner | null / null |
| My Closed Tasks | False | (Status equal Completed AND Owner equal {'name': '${CURRENTUSER}'}) | Due_Date, Subject, Status, Priority, What_Id, Who_Id, BEST_TIME | null / null |
| My Next 7 Days + Overdue Tasks | False | ((Due_Date less_equal ${NEXT7DAYS} AND Status not_equal Completed) AND Owner equal {'name': '${CURRENTUSER}'}) | Due_Date, Subject, Status, Priority, What_Id, Who_Id, BEST_TIME | null / null |
| My Open Tasks | False | (Owner equal {'name': '${CURRENTUSER}'} AND Status not_equal Completed) | Subject, Due_Date, Status, Priority, What_Id, Who_Id | null / null |
| My Overdue Tasks | False | ((Due_Date equal ${YESTERDAYMINUS} AND Status not_equal Completed) AND Owner equal {'name': '${CURRENTUSER}'}) | Due_Date, Subject, Status, Priority, What_Id, Who_Id, BEST_TIME | null / null |
| My Tasks | False | Owner equal {'name': '${CURRENTUSER}'} | Due_Date, Subject, Status, Priority, What_Id, Who_Id, BEST_TIME | null / null |
| My Today + Overdue Tasks | False | ((Due_Date less_equal ${TODAYANDOVERDUE} AND Status not_equal Completed) AND Owner equal {'name': '${CURRENTUSER}'}) | Due_Date, Subject, Status, Priority, What_Id, Who_Id, BEST_TIME | null / null |
| My Today's Tasks | False | ((Due_Date equal ${TODAY} AND Status not_equal Completed) AND Owner equal {'name': '${CURRENTUSER}'}) | Due_Date, Subject, Status, Priority, What_Id, Who_Id, BEST_TIME | null / null |
| My Tomorrow's Tasks | False | (Due_Date equal ${TOMORROW} AND Owner equal {'name': '${CURRENTUSER}'}) | Due_Date, Subject, Status, Priority, What_Id, Who_Id, BEST_TIME | null / null |
| Next 7 Days + Overdue Tasks | False | (Due_Date less_equal ${NEXT7DAYS} AND Status not_equal Completed) | Subject, Due_Date, Status, Priority, What_Id, Who_Id, Owner | null / null |
| Open Tasks | False | Status not_equal Completed | Subject, Due_Date, Status, Priority, What_Id, Who_Id, Owner | null / null |
| Overdue Tasks | False | (Due_Date equal ${YESTERDAYMINUS} AND Status not_equal Completed) | Subject, Due_Date, Status, Priority, What_Id, Who_Id, Owner | null / null |
| Today + Overdue Tasks | False | (Due_Date less_equal ${TODAYANDOVERDUE} AND Status not_equal Completed) | Subject, Due_Date, Status, Priority, What_Id, Who_Id, Owner | null / null |
| Today's Tasks | False | (Due_Date equal ${TODAY} AND Status not_equal Completed) | Subject, Due_Date, Status, Priority, What_Id, Who_Id, Owner | null / null |
| Tomorrow's Tasks | False | Due_Date equal ${TOMORROW} | Subject, Due_Date, Status, Priority, What_Id, Who_Id, Owner | null / null |


### Meetings

| View | Default | Criteria | Columns (order) | Sort field / order |
| --- | --- | --- | --- | --- |
| All Meetings | True | none | Event_Title, Start_DateTime, End_DateTime, What_Id, Who_Id, Owner | null / null |
| Cancelled Meetings | False | none | Event_Title, Start_DateTime, End_DateTime, What_Id, Who_Id | null / null |
| Completed Meetings | False | End_DateTime less_than ${CURRENTTIME} | Event_Title, Start_DateTime, End_DateTime, What_Id, Who_Id, Owner | null / null |
| My Cancelled Meetings | False | Owner equal {'name': '${CURRENTUSER}'} | Event_Title, Start_DateTime, End_DateTime, What_Id, Who_Id, Owner | null / null |
| My Completed Meetings | False | (End_DateTime less_than ${CURRENTTIME} AND Owner equal {'name': '${CURRENTUSER}'}) | Event_Title, Start_DateTime, End_DateTime, What_Id, Who_Id, Owner | null / null |
| My Meetings | False | Host_or_Participant equal {'name': '${CURRENTUSER}'} | Event_Title, Start_DateTime, End_DateTime, What_Id, Who_Id | null / null |
| My Today's Meetings | False | (Start_DateTime equal ${TODAY} AND Owner equal {'name': '${CURRENTUSER}'}) | Event_Title, Start_DateTime, End_DateTime, What_Id, Who_Id | null / null |
| My Upcoming Meetings | False | (End_DateTime greater_equal ${CURRENTTIME} AND Owner equal {'name': '${CURRENTUSER}'}) | Event_Title, Start_DateTime, End_DateTime, What_Id, Who_Id, Owner | null / null |
| This Weeks Meetings | False | Start_DateTime equal ${THISWEEK} | Event_Title, Start_DateTime, End_DateTime, What_Id, Who_Id, Owner | null / null |
| Today's Meetings | False | Start_DateTime equal ${TODAY} | Event_Title, Start_DateTime, End_DateTime, What_Id, Who_Id, Owner | null / null |
| Upcoming Meetings | False | End_DateTime greater_equal ${CURRENTTIME} | Event_Title, Start_DateTime, End_DateTime, What_Id, Who_Id, Owner | null / null |


### Calls

| View | Default | Criteria | Columns (order) | Sort field / order |
| --- | --- | --- | --- | --- |
| All Calls | True | none | Subject, Call_Type, Call_Start_Time, Call_Duration, What_Id, Who_Id, Owner | null / null |
| Attended Calls | False | (Call_Type equal Outbound AND Call_Duration_in_seconds greater_than 0) | Subject, What_Id, Call_Start_Time | null / null |
| Cancelled Calls | False | Outgoing_Call_Status equal Cancelled | Subject, What_Id, Call_Start_Time | null / null |
| Completed Calls | False | ((Outgoing_Call_Status not_equal Scheduled AND Outgoing_Call_Status not_equal Overdue) OR Outgoing_Call_Status equal ${EMPTY}) | Subject, What_Id, Call_Start_Time, Call_Type, Call_Start_Time, Call_Duration | null / null |
| Incoming Calls | False | Call_Type equal Inbound | Subject, What_Id, Call_Start_Time | null / null |
| Missed Calls | False | Call_Type equal Missed | Subject, What_Id, Call_Start_Time | null / null |
| My Attended Calls | False | ((Call_Type equal Outbound AND Call_Duration_in_seconds greater_than 0) AND Owner equal {'name': '${CURRENTUSER}'}) | Subject, What_Id, Call_Start_Time | null / null |
| My Calls | False | Owner equal {'name': '${CURRENTUSER}'} | Subject, Call_Type, Call_Start_Time, Call_Duration, What_Id, Who_Id | null / null |
| My Cancelled Calls | False | (Outgoing_Call_Status equal Cancelled AND Owner equal {'name': '${CURRENTUSER}'}) | Subject, What_Id, Call_Start_Time | null / null |
| My Incoming Calls | False | (Call_Type equal Inbound AND Owner equal {'name': '${CURRENTUSER}'}) | Subject, What_Id, Call_Start_Time | null / null |
| My Missed Calls | False | (Call_Type equal Missed AND Owner equal {'name': '${CURRENTUSER}'}) | Subject, What_Id, Call_Start_Time | null / null |
| My Outgoing Calls | False | (Call_Type equal Outbound AND Owner equal {'name': '${CURRENTUSER}'}) | Subject, What_Id, Call_Start_Time | null / null |
| My Overdue Calls | False | (Outgoing_Call_Status equal Overdue AND Owner equal {'name': '${CURRENTUSER}'}) | Subject, What_Id, Call_Start_Time | null / null |
| My Scheduled Calls | False | (Outgoing_Call_Status equal Scheduled AND Owner equal {'name': '${CURRENTUSER}'}) | Subject, What_Id, Call_Start_Time | null / null |
| My Scheduled+Overdue Calls for Today | False | (((Outgoing_Call_Status equal Scheduled OR Outgoing_Call_Status equal Overdue) AND Call_Start_Time equal ${TODAY}) AND Owner equal {'name': '${CURRENTUSER}'}) | Subject, What_Id, Call_Start_Time | null / null |
| My Today's Scheduled Calls | False | ((Outgoing_Call_Status equal Scheduled AND Owner equal {'name': '${CURRENTUSER}'}) AND Call_Start_Time equal ${TODAY}) | Subject, What_Id, Call_Start_Time | null / null |
| My Unattended Calls | False | ((Outgoing_Call_Status equal Completed AND Call_Duration_in_seconds equal 0) AND Owner equal {'name': '${CURRENTUSER}'}) | Subject, What_Id, Call_Start_Time | null / null |
| Outgoing Calls | False | Call_Type equal Outbound | Subject, What_Id, Call_Start_Time | null / null |
| Overdue Calls | False | Outgoing_Call_Status equal Overdue | Subject, What_Id, Call_Start_Time | null / null |
| Scheduled Calls | False | Outgoing_Call_Status equal Scheduled | Subject, What_Id, Call_Start_Time | null / null |
| Today's Scheduled Calls | False | (Outgoing_Call_Status equal Scheduled AND Call_Start_Time equal ${TODAY}) | Subject, What_Id, Call_Start_Time | null / null |
| Today's Scheduled+Overdue Calls | False | ((Outgoing_Call_Status equal Scheduled OR Outgoing_Call_Status equal Overdue) AND Call_Start_Time equal ${TODAY}) | Subject, What_Id, Call_Start_Time | null / null |
| Unattended Calls | False | (Outgoing_Call_Status equal Completed AND Call_Duration_in_seconds equal 0) | Subject, What_Id, Call_Start_Time | null / null |


Observed Tasks list default sort: `id / desc` (network infoSort); exported view sort remains null.

## Related lists


### Tasks

| Order | Label | API name | Target module | Visible / visibility | Record operations |
| --- | --- | --- | --- | --- | --- |
| 1 | Notes | Notes | Notes | True / 10 | edit: False; create: False; bulk_edit: False; delete: False; disassociate: False; assign: False |
| 3 | Attachments | Attachments | Attachments | True / 10 | edit: False; create: False; bulk_edit: False; delete: False; disassociate: False; assign: False |
| 4 | Checklists | CheckLists | CheckLists | True / 10 | edit: False; create: False; bulk_edit: False; delete: False; disassociate: False; assign: False |
| 5 | Locking Information | Locking_Information__s | Locking_Information__s | True / 10 | edit: False; create: False; bulk_edit: False; delete: False; disassociate: False; assign: False |


### Meetings

| Order | Label | API name | Target module | Visible / visibility | Record operations |
| --- | --- | --- | --- | --- | --- |
| 1 | Notes | Notes | Notes | True / 10 | edit: False; create: False; bulk_edit: False; delete: False; disassociate: False; assign: False |
| 3 | Attachments | Attachments | Attachments | True / 10 | edit: False; create: False; bulk_edit: False; delete: False; disassociate: False; assign: False |
| 4 | Invitees | Invitees | Invitees | True / 10 | edit: False; create: False; bulk_edit: False; delete: False; disassociate: False; assign: False |
| 6 | Checklists | CheckLists | CheckLists | True / 10 | edit: False; create: False; bulk_edit: False; delete: False; disassociate: False; assign: False |


### Calls

| Order | Label | API name | Target module | Visible / visibility | Record operations |
| --- | --- | --- | --- | --- | --- |
| 1 | Notes | Notes | Notes | True / 10 | edit: False; create: False; bulk_edit: False; delete: False; disassociate: False; assign: False |
| 2 | Checklists | CheckLists | CheckLists | True / 10 | edit: False; create: False; bulk_edit: False; delete: False; disassociate: False; assign: False |


## Field permissions by profile

Administrator and Standard are the two exported profiles. Module metadata advertises view/create/edit/delete and lists both profiles; it does not separately enumerate each profile’s module operation permissions. Field permission does not override field read-only or create/edit flags. RW = read_write. Every field is included, separately per module.


### Tasks

| Field | Administrator | Standard | View / create / edit / quick create |
| --- | --- | --- | --- |
| Owner | RW | RW | True / True / True / False |
| Subject | RW | RW | True / True / True / True |
| Due_Date | RW | RW | True / True / True / True |
| Who_Id | RW | RW | True / True / True / False |
| What_Id | RW | RW | True / True / True / False |
| Status | RW | RW | True / True / True / False |
| Priority | RW | RW | True / True / True / True |
| Created_By | RW | RW | True / False / False / False |
| Modified_By | RW | RW | True / False / False / False |
| Created_Time | RW | RW | True / False / False / False |
| Modified_Time | RW | RW | True / False / False / False |
| Description | RW | RW | True / True / True / False |
| Send_Notification_Email | RW | RW | True / True / True / False |
| Remind_At | RW | RW | True / True / True / False |
| Recurring_Activity | RW | RW | True / True / True / False |
| Closed_Time | read_only | read_only | True / False / False / False |
| Tag | RW | RW | True / False / False / False |
| id | read_only | read_only | True / False / False / False |
| Locked__s | read_only | read_only | False / False / False / False |
| Last_Activity_Time | RW | RW | True / False / False / False |


### Meetings

| Field | Administrator | Standard | View / create / edit / quick create |
| --- | --- | --- | --- |
| Owner | RW | RW | True / True / True / False |
| Event_Title | RW | RW | True / True / True / True |
| Venue | RW | RW | True / True / True / True |
| Who_Id | RW | RW | True / True / True / False |
| What_Id | RW | RW | True / True / True / False |
| Created_By | RW | RW | True / False / False / True |
| Modified_By | RW | RW | True / False / False / True |
| Created_Time | RW | RW | True / False / False / False |
| Modified_Time | RW | RW | True / False / False / False |
| Description | RW | RW | True / True / True / False |
| Recurring_Activity | RW | RW | True / True / False / False |
| Remind_At | RW | RW | True / True / True / False |
| All_day | RW | RW | True / True / True / True |
| Participants | RW | RW | False / True / True / False |
| Check_In_Time | read_only | read_only | True / False / False / False |
| Check_In_By | read_only | read_only | True / False / False / False |
| Check_In_Comment | read_only | read_only | True / False / False / False |
| Check_In_Sub_Locality | read_only | read_only | True / False / False / False |
| Check_In_City | read_only | read_only | True / False / False / False |
| Check_In_State | read_only | read_only | True / False / False / False |
| Check_In_Country | read_only | read_only | True / False / False / False |
| Latitude | read_only | read_only | True / False / False / False |
| Longitude | read_only | read_only | True / False / False / False |
| ZIP_Code | read_only | read_only | True / False / False / False |
| Check_In_Address | read_only | read_only | True / False / False / False |
| Check_In_Status | read_only | read_only | True / False / False / False |
| Start_DateTime | RW | RW | True / True / True / True |
| End_DateTime | RW | RW | True / True / True / True |
| Tag | RW | RW | True / False / False / False |
| Remind_Participants | RW | RW | True / True / True / False |
| id | read_only | read_only | True / False / False / False |
| Last_Activity_Time | RW | RW | True / False / False / False |
| Meeting_Venue__s | RW | RW | True / True / True / False |
| Meeting_Provider__s | RW | RW | True / True / True / False |


### Calls

| Field | Administrator | Standard | View / create / edit / quick create |
| --- | --- | --- | --- |
| Owner | RW | RW | True / False / False / False |
| Subject | RW | RW | True / True / True / True |
| Call_Type | RW | RW | True / True / False / True |
| Call_Purpose | RW | RW | True / True / True / True |
| Who_Id | RW | RW | True / True / True / True |
| What_Id | RW | RW | True / True / True / True |
| Call_Start_Time | RW | RW | True / True / True / True |
| Call_Duration | RW | RW | True / True / True / True |
| Call_Duration_in_seconds | RW | RW | True / False / False / False |
| Description | RW | RW | True / True / True / True |
| Call_Result | RW | RW | True / True / True / True |
| CTI_Entry | RW | RW | False / False / False / False |
| Created_By | RW | RW | True / False / False / False |
| Modified_By | RW | RW | True / False / False / False |
| Created_Time | RW | RW | True / False / False / False |
| Modified_Time | RW | RW | True / False / False / False |
| Reminder | RW | RW | True / True / True / False |
| Tag | RW | RW | True / False / False / False |
| Outgoing_Call_Status | RW | RW | True / True / False / False |
| Scheduled_In_CRM | read_only | read_only | True / False / False / False |
| id | read_only | read_only | True / False / False / False |
| Last_Activity_Time | RW | RW | True / False / False / False |
| Call_Agenda | RW | RW | True / True / True / False |
| Caller_ID | read_only | read_only | True / False / False / False |
| Dialled_Number | read_only | read_only | True / False / False / False |
| Voice_Recording__s | RW | RW | True / True / True / False |

## Differences from Tasks list — Meetings and Calls

- Meetings: list differences cannot be established from the loading-only captures. Metadata differences remain in the module-specific tables. Create menu, Actions rows, filters, visible columns, time/participant presentation, view icons and empty state are not observed.

- Calls: list differences cannot be established from the loading-only captures. Type/direction and handset icons, scheduling/logging menu rows, Actions, filters, columns, view icons and empty state remain not observed.

## Differences from Accounts list

- One view tab (All Tasks) instead of All Accounts plus All Locked Accounts. The public-view menu adds Search and activity due-date/open/closed views; it has no recently-created/modified or unread views in the observed list.
- Five view-type icons plus the dropdown, with Sheet absent from the toolbar. List is active. A refresh icon becomes painted in the Actions capture, as in Accounts AL-64.
- System filters retain Locked, Record Action, Related Records Action, Touched Records and Untouched Records; Cadences is absent. The visible field filters are Closed Time, Contact Name, Created By, Created Time, Due Date, Last Activity Time, Modified By, Modified Time and Priority; Related To is partly clipped at the bottom. DOM-only continuation: Related To, Status, Subject, Tag, Task Owner, then Filter By Related Modules / Notes. The latter continuation is not a viewed scrolled state.
- Table shows Subject with All selector, Due Date, Status and Priority. Related To, Contact Name and Task Owner extend beyond the right edge (exported columns and DOM only). Status is plain text; no row completion control is painted. Checkboxes are record selection, not completion. Empty state and hover-only row actions are not observed.
- Actions has Mass Transfer, Mass Delete, Mass Update, Manage Tags, Export Tasks and Print View. Drafts, Deduplicate, Create Client Script and Sheet view are absent. The Print View submenu arrow belongs to the menu row; submenu and every execution result remain not observed.

## Shared components reused

| Component | Definition (section / inventory / implementation task) | Activities difference |
| --- | --- | --- |
| List screen | accounts.md › Control inventory, AL-01–AL-51; contacts.md L-01–L-51; MEP-319 | TL refs reuse common controls; activity fields/columns and due-date view catalog differ |
| Related-list rail and cards | accounts-record-detail.md › Control inventory; contacts-record-detail.md D-10–D-31, D-52–D-95; MEP-325 | Tasks Checklists; Meetings Invitees; no detail observed in this task |
| Lookup | accounts-form.md › Parent Account lookup; contacts-form.md › Control inventory; MEP-318 | Who_Id Contacts target; What_Id polymorphic marker; full target list/dependencies unresolved |
| Date field | contacts-form.md F-25; MEP-317 | Tasks Due Date uses date; no activity picker captured |
| Date-time field | leads-fields-and-layout.md › field dictionary; contacts-form.md F-25 / MEP-317 date primitive | Metadata datetime reused for From/To, Call Start Time, Closed Time and Check-In Time; no previous datetime picker inventory is established here; time-picker extension awaits forms |
| Owner selector | contacts-form.md F-06; MEP-318 shared lookup work | Task Owner, Host, Call Owner; Calls create/edit flags differ |
| Bulk-action windows | list-views.md › bulk actions; accounts.md AL-14.1–AL-14.3; shared list work MEP-319 | TL-14.1–TL-14.3 entries only; activity windows not opened |
| Global search | global-search.md › Control inventory, S-10 module menu; MEP-288 | Shell SH-26 reused; no activity query executed |
| Board view | deals-pipeline.md › Stage (Kanban) view; deals.md DL-05–DL-11; MEP-353 | TL-06 only; Tasks board grouping/cards not observed and view preference not changed |

## Capability table

| Capability | Inventory numbers / metadata section | Module key | Reused from previous module / Activities-specific |
| --- | --- | --- | --- |
| Shell / global search / navigation | SH-01–SH-46 | as in contacts.md | Reused; active Tasks link |
| Public view menu | TL-01–TL-02, TL-02.1–TL-02.20 | M5; creation/management M11 | Reused container; activity view catalog and search differ |
| Filter and sort | TL-03–TL-04, TL-15–TL-16, TL-20–TL-26, TL-53–TL-61 | M5 | Reused mechanics; activity field catalog |
| View modes / refresh | TL-05–TL-11, TL-65 | M5 | Reused controls; Sheet absent; other presentations not observed |
| Create Task / create menu | TL-12–TL-13 | M5 / M6 | Reused trigger; menu contents not observed |
| Record table and selection | TL-33–TL-36, TL-40, TL-42, TL-62–TL-64 | M5; settings M11 | Reused table/selection; Subject and activity columns |
| Pagination and count | TL-48–TL-51 | M5 | Reused; 12 total, range 1 to 12 |
| Bulk transfer/delete/update | TL-14, TL-14.1–TL-14.3 | M5 | Reused entries; dialogs/execution not observed |
| Tags / export | TL-14.4–TL-14.5 | M6 | Reused entries; execution not observed |
| Print View | TL-14.6 | M5 | Reused entry; submenu not observed |
| Task reminder / repeat / completion fields | Tasks fields and layout; Picklists; ALARM / RRULE | M5 | Activities-specific metadata; transitions not observed |
| Calls list | Calls list / source reconciliation | M5 | Loading-only evidence; rendered controls not observed |
| Meetings list | Meetings list / source reconciliation | M5 | Loading-only evidence; rendered controls and list presentation not observed |
| Meeting scheduling / participants / check-in | Meetings fields and layout; multireminder | M5 | Activities-specific metadata; UI belongs to later research |
| Call logging / scheduling / CTI | Calls fields and layout; Picklists | M5 | Activities-specific metadata; type/status conditions not supplied |
| Who / What and incoming activity relations | Lookups and relations | M5 and source-module key | Existing lookup primitive; polymorphic targets and activity relation catalogs |

## Capture refs

- m5l-calls-list-base — no clicks; loading skeleton, no record links.
- m5l-calls-list-after — no clicks, 12-second wait; loading skeleton, no record links.
- m5l-calls-create-menu / m5l-calls-actions — not captured; triggers absent from base controls.json.

- m5l-meetings-list-base — no clicks; loading skeleton, no record links.
- m5l-meetings-list-after — no clicks, 12-second wait; loading skeleton, no record links.
- m5l-meetings-create-menu / m5l-meetings-actions — not captured; triggers absent from base controls.json.


- m5-tasks-list-base — full, table opening, no clicks, 12 total records.
- m5-tasks-view-selector — one requested/completed click; public-view menu only.
- m5-tasks-create-menu — one requested click, skipped; no opened state.
- m5-tasks-actions — one requested/completed click; six visible Actions rows.
- m5-tasks-list-after — no clicks; comparison below in inventory.

All screenshots were opened as images. Raw files stay in the local research workspace; only slugs are recorded here. All non-GET traffic matched the issue's permitted list-opening/shell reads or blocked background polls/telemetry. No write or preference action was executed. Counts and exclusion accounting are in the reconciliation and issue comments.

## Open questions

- Create-menu contents are not observed because the tool rejected its trigger. Do not infer import/create rows.
- Empty state, completion affordances on hover, and other hover-only row actions remain not observed. No completion action was clicked.
- Related To export has only `se_module`, not a complete enumerated target list. Who_Id exports Contacts only; alternative person targets and mutual constraints are not established by metadata.
- ALARM / RRULE / multireminder supply JSON container types, without nested schema; Participants supplies bigint / jsonarray without item structure. Public-documentation flow research must resolve these before implementation tasks.
- Provider has no exported options. Checked In Status is text with no status catalog. Check-In / call-type / call-status visibility rules and transition effects are not supplied.
- Sort field/order in exported custom views are null. Observed Tasks opening sorts by id descending; this does not establish every view's default.
- Shared shell module assignments with `?` remain as in contacts.md; no additional Tasks-specific unknown assignment was introduced.
- Meetings rendered list and shell controls, presentation, record count, start/end and participant display remain not observed because both captures stayed in loading. Create-menu and Actions triggers could not be validated; their contents remain not observed.
- Meetings after capture started above the load threshold because the load check was not conditional. This process deviation is recorded in the issue; no click occurred.
- Calls rendered controls, call indicators and handset icons, scheduling/logging menu labels/order and empty state remain not observed because both captures stayed in loading. No unseen control is inferred from metadata.
- Forms and all record details remain outside this list task.

No board decision is requested by this spec. Unknown behaviour is explicitly preserved for the follow-on research and lead review.
