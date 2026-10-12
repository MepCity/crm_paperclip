# Accounts — list screen and module inventory

Status: research submitted for Grok QA inventory review and UI Lead metadata approval. MEP-21 / Module 3.

## Purpose
Define Accounts-specific list differences and exported module configuration. Reuse [contacts.md](contacts.md) and [list-views.md](list-views.md). Record detail, related-list cards and forms are separate tasks.

## Layout
Same shell and list regions as Contacts: view strip, toolbar, open filter panel, table and footer. Accounts shows two view tabs, a shorter system-filter group and four visible table columns. No dimensions, colours or typography are specified. The populated basic image is the visual source; empty state remains not observed.

## Control inventory

Numbers are stable across captures; repeated row controls share a number. `same` reuses the cited Contacts behaviour, including its not-observed limits. Only the public-view and Actions menus were opened. No menu row was selected and no record or preference action was exercised. Source establishes presence; metadata is never presented as screen observation.

### Control inventory — m3-list-base

Shell: SH-01–SH-46 as in contacts.md. Accounts is the active rail link (SH-15); Contacts is inactive (SH-14). Shell rows are not repeated. The module title is static text. Rightmost utility-strip trash icon SH-46 and the Phone handset icons are present in the image but absent from controls.json.

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AL-01 | View strip | All Accounts | tab | left, first | same | seen (m3-list-base) | M3 | L-01 |
| AL-02 | View strip | Three dots icon | icon button | after the second view tab | Opens the public-view menu (m3-list-view-selector) | seen (m3-list-base) | M3 | L-02 moved |
| AL-03 | Toolbar | Filter | button | left group, first | same | seen (m3-list-base) | M3 | L-03 |
| AL-04 | Toolbar | Sort | button | left group, second | same | seen (m3-list-base) | M3 | L-04 |
| AL-05 | Toolbar | List view icon | icon button | view group, first | same | seen (m3-list-base) | M3 | L-05 |
| AL-06 | Toolbar | Kanban view icon | icon button | view group, second | same | seen (m3-list-base) | M3 | L-06 |
| AL-07 | Toolbar | Sheet view icon | icon button | view group, third | same | seen (m3-list-base) | M3 | L-07 |
| AL-08 | Toolbar | Chart view icon | icon button | view group, fourth | same | seen (m3-list-base) | M3 | L-08 |
| AL-09 | Toolbar | Timeline view icon | icon button | view group, fifth | same | seen (m3-list-base) | M3 | L-09 |
| AL-10 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | same | seen (m3-list-base) | M3 | L-10 |
| AL-11 | Toolbar | Down chevron | icon button | view group, seventh | same | seen (m3-list-base) | M3 | L-11 |
| AL-12 | Toolbar | Create Account | button | right group, first | same | seen (m3-list-base) | M3 | L-12 |
| AL-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Account | same | seen (m3-list-base) | M6 | L-13 |
| AL-14 | Toolbar | Three dots / Actions | icon button | right group, far right | Opens the Actions menu (m3-list-actions) | seen (m3-list-base) | M3 | L-14 |
| AL-15 | Filter panel | Search | input | below Filter Accounts by heading | same | seen (m3-list-base) | M3 | L-15 |
| AL-16 | Filter panel | System Defined Filters | toggle | first section heading | same | seen (m3-list-base) | M3 | L-16 |
| AL-20 | Filter panel | Locked | checkbox | system-defined section, Locked | same | seen (m3-list-base) | M3 | L-20 moved |
| AL-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | same | seen (m3-list-base) | M3 | L-21 moved |
| AL-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | same | seen (m3-list-base) | M3 | L-22 moved |
| AL-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | same | seen (m3-list-base) | M3 | L-23 moved |
| AL-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | same | seen (m3-list-base) | M3 | L-24 moved |
| AL-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | same | seen (m3-list-base) | P3 | L-25 moved |
| AL-26 | Filter panel | Filter By Fields | toggle | second section heading | same | seen (m3-list-base) | M3 | L-26 |
| AL-27 | Filter panel | Account Name | checkbox | field section, first row | same | seen (m3-list-base) | M3 | L-27 |
| AL-33 | Table | Sliders icon | icon button | header, far right overlay | same | seen (m3-list-base) | M11 | L-33 |
| AL-34 | Table | Select all checkbox | checkbox | header, before Account Name | same | seen (m3-list-base) | M3 | L-34 moved |
| AL-35 | Table | Account Name | column header | first text column | same | seen (m3-list-base) | M3 | L-35 |
| AL-36 | Table | All with down arrow | select | within Account Name header, right | same | seen (m3-list-base) | M3 | L-36 |
| AL-39 | Table | Phone | column header | second text column | same | seen (m3-list-base) | M3 | L-39 moved |
| AL-40 | Table | Record selection checkbox | checkbox | each visible row, after notes area and before Account Name | same | seen (m3-list-base) | M3 | L-40 moved |
| AL-42 | Table | Account record link | link | Account Name cells | same | seen (m3-list-base) | M3 | L-42 |
| AL-45 | Table | Row three dots icon | icon button | highlighted row, first control; not shown after menu opening | same | seen (m3-list-base) | M3 | L-45 |
| AL-46 | Table | Note bubble icon | icon button | rows with notes, before selection checkbox | same | seen (m3-list-base) | M6 | L-46 moved |
| AL-48 | List footer | Total Records | badge | left | same | seen (m3-list-base) | M3 | L-48 |
| AL-49 | List footer | Displayed record range | badge | right group, between arrows | same | seen (m3-list-base) | M3 | L-49 |
| AL-50 | List footer | Previous | icon button | right group, before range | same | seen (m3-list-base) | M3 | L-50 |
| AL-51 | List footer | Next | icon button | right group, after range | same | seen (m3-list-base) | M3 | L-51 |
| AL-52 | View strip | All Locked Accounts | tab | left, second | not observed | seen (m3-list-base) | M3 | new |
| AL-53 | Filter panel | Account Number | checkbox | field section, row 2 | not observed | seen (m3-list-base) | M3 | new |
| AL-54 | Filter panel | Account Owner | checkbox | field section, row 3 | not observed | seen (m3-list-base) | M3 | new |
| AL-55 | Filter panel | Account Site | checkbox | field section, row 4 | not observed | seen (m3-list-base) | M3 | new |
| AL-56 | Filter panel | Account Type | checkbox | field section, row 5 | not observed | seen (m3-list-base) | M3 | new |
| AL-57 | Filter panel | Annual Revenue | checkbox | field section, row 6 | not observed | seen (m3-list-base) | M3 | new |
| AL-58 | Filter panel | Billing Address | checkbox | field section, row 7 | not observed | seen (m3-list-base) | M3 | new |
| AL-59 | Filter panel | Billing Address - City | checkbox | field section, row 8 | not observed | seen (m3-list-base) | M3 | new |
| AL-60 | Table | Website | column header | third text column | not observed | seen (m3-list-base) | M3 | new |
| AL-61 | Table | Account Owner | column header | fourth text column | not observed | seen (m3-list-base) | M3 | new |
| AL-62 | Table | Phone handset icon | icon button | each populated Phone cell, after value | not observed | seen (m3-list-base) | M5 | new |
| AL-63 | Table | Website link | link | Website cells | not observed | seen (m3-list-base) | M3 | new |

Absent here: L-17–L-19, L-28–L-32, L-37–L-38, L-41, L-43–L-44, L-47. AL-27 is the first Account Name field-filter row; AL-35 is the module-name equivalent in the first column. AL-39 is the same Phone header moved to column 2. The All Locked Accounts tab is additional to Contacts' base strip.

### Control inventory — m3-list-view-selector

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AL-02.1 | View menu | Public Views | toggle | popup, row 1 | same | seen (m3-list-view-selector) | M3 | L-02.1 |
| AL-02.2 | View menu | All Accounts | menu item | popup, row 2 | same | seen (m3-list-view-selector) | M3 | L-02.2 |
| AL-02.3 | View menu | All Locked Accounts | menu item | popup, row 3 | same | seen (m3-list-view-selector) | M3 | L-02.3 |
| AL-02.4 | View menu | My Accounts | menu item | popup, row 4 | same | seen (m3-list-view-selector) | M3 | L-02.5 moved |
| AL-02.5 | View menu | New Last Week | menu item | popup, row 5 | same | seen (m3-list-view-selector) | M3 | L-02.6 moved |
| AL-02.6 | View menu | New This Week | menu item | popup, row 6 | same | seen (m3-list-view-selector) | M3 | L-02.7 moved |
| AL-02.7 | View menu | Recently Created Accounts | menu item | popup, row 7 | same | seen (m3-list-view-selector) | M3 | L-02.8 moved |
| AL-02.8 | View menu | Recently Modified Accounts | menu item | popup, row 8 | same | seen (m3-list-view-selector) | M3 | L-02.9 moved |
| AL-02.9 | View menu | Unread Accounts | menu item | popup, row 9 | same | seen (m3-list-view-selector) | M3 | L-02.10 moved |
| AL-02.10 | View menu | Show custom views as Dropdown | button | popup, row 10 | same | seen (m3-list-view-selector) | M3 | L-02.12 moved |
| AL-02.11 | View menu | New Custom View | menu item | popup, row 11 | same | seen (m3-list-view-selector) | M11 | L-02.13 moved |
| AL-02.12 | View menu | Manage Custom View | menu item | popup, row 12 | same | seen (m3-list-view-selector) | M11 | L-02.14 moved |

Rest: as in m3-list-base; covered by the overlay: AL-07–AL-11, parts of AL-34–AL-36 / AL-39 and repeated AL-40 / AL-42 / AL-46 cells. AL-45 is no longer painted. Absent here: L-02.4 (Mailing Labels), L-02.11 (Unsubscribed Contacts).

### Control inventory — m3-list-create-menu

No changed or opened controls. The one requested click was skipped by the capture tool's dangerous-attribute guard. Create-menu contents and behaviour remain `not observed`; no alternative selector was attempted.

Rest: as in m3-list-base; covered by the overlay: none.

### Control inventory — m3-list-actions

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AL-14.1 | Actions menu | Mass Transfer | menu item | popup, row 1 | same | seen (m3-list-actions) | M3 | L-14.1 |
| AL-14.2 | Actions menu | Mass Delete | menu item | popup, row 2 | same | seen (m3-list-actions) | M3 | L-14.2 |
| AL-14.3 | Actions menu | Mass Update | menu item | popup, row 3 | same | seen (m3-list-actions) | M3 | L-14.3 |
| AL-14.4 | Actions menu | Manage Tags | menu item | popup, row 4 | same | seen (m3-list-actions) | M6 | L-14.4 |
| AL-14.5 | Actions menu | Drafts | menu item | popup, row 5 | same | seen (m3-list-actions) | M3 | L-14.5 |
| AL-14.6 | Actions menu | Deduplicate Accounts | menu item | popup, row 6 | same | seen (m3-list-actions) | M3 | L-14.8 moved |
| AL-14.7 | Actions menu | Create Client Script | menu item | popup, row 7 | same | seen (m3-list-actions) | M11 | L-14.10 moved |
| AL-14.8 | Actions menu | Export Accounts | menu item | popup, row 8 | same | seen (m3-list-actions) | M6 | L-14.11 moved |
| AL-14.9 | Actions menu | Sheet view | menu item | popup, row 9 | same | seen (m3-list-actions) | ? | L-14.12 moved |
| AL-14.10 | Actions menu | Print View | menu item | popup, row 10 | same | seen (m3-list-actions) | M3 | L-14.13 moved |
| AL-64 | Toolbar | Refresh icon | icon button | after view-group down chevron | not observed | seen (m3-list-actions) | M3 | new |

Rest: as in m3-list-base; covered by the overlay: AL-61 and repeated Account Owner cell values. AL-45 is no longer painted. Absent here: L-14.6 (Mass Email), L-14.7 (Approve Contacts), L-14.9 (Add to Campaigns). Sheet view is a neutral rendering of the product-prefixed visible label. Its module key stays ?, as in Contacts. Decorative sparkles beside two menu labels are not separate controls. The submenu arrow is part of Print View; no submenu was opened.

### Control inventory — m3-list-after

No changed controls relative to the basic capture. Record count remains 373; range remains 1 to 30.

Rest: as in m3-list-base; covered by the overlay: none.

### Shell controls missing from app-shell.md

No Accounts-only shell control was found. Reuse the missing-shell list in contacts.md. Resize hotspots have no painted grip and were not exercised; they are reconciled as invisible affordances below.


### Reconciliation of controls.json
Ordinals are one-based source-list positions, not selectors. Every source item has one destination or written exclusion. Wrappers/duplicates mapped to the same ID do not create additional controls. Image-only controls: AL-62 (handset icons), SH-46 (trash bin); Actions additionally AL-14.9 and AL-14.10.

#### m3-list-base

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| AL-01 | 112 |
| AL-02 | 114–117 |
| AL-03 | 118 |
| AL-04 | 119 |
| AL-05 | 121 |
| AL-06 | 122 |
| AL-07 | 123 |
| AL-08 | 124 |
| AL-09 | 125 |
| AL-10 | 126 |
| AL-11 | 127–128 |
| AL-12 | 131 |
| AL-13 | 132–133 |
| AL-14 | 134 |
| AL-15 | 137–138 |
| AL-16 | 140 |
| AL-20 | 142–143 |
| AL-21 | 144–145 |
| AL-22 | 146–147 |
| AL-23 | 148–149 |
| AL-24 | 150–151 |
| AL-25 | 152–153 |
| AL-26 | 154 |
| AL-27 | 156–157 |
| AL-33 | 256 |
| AL-34 | 265–266 |
| AL-35 | 267 |
| AL-36 | 268–269 |
| AL-39 | 270 |
| AL-40 | 279–280, 291–292, 304–305, 317–318, 330–331, 342–343, 355–356, 369–370, 382–383, 394–395, 407–408 |
| AL-42 | 282, 294, 307, 320, 333, 345, 358, 372, 385, 397, 410 |
| AL-45 | 366 |
| AL-46 | 277, 302, 315, 328, 340, 353, 367, 380, 405 |
| AL-48 | 571 |
| AL-49 | 572 |
| AL-50 | 573 |
| AL-51 | 574 |
| AL-52 | 113 |
| AL-53 | 158–159 |
| AL-54 | 160–161 |
| AL-55 | 162–163 |
| AL-56 | 164–165 |
| AL-57 | 166–167 |
| AL-58 | 168–169 |
| AL-59 | 170–171 |
| AL-60 | 271 |
| AL-61 | 272 |
| AL-63 | 285, 297, 310, 323, 348, 361, 375, 388, 400, 413 |
| SH-01 | 2–4 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| SH-35 | 591 |
| SH-36 | 592 |
| SH-37 | 593 |
| SH-38 | 594 |
| SH-39 | 595 |
| SH-40 | 596 |
| SH-41 | 597 |
| SH-42 | 598 |
| SH-43 | 599 |
| SH-44 | 600 |
| SH-45 | 601 |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82–83, 87, 111, 120, 136, 141, 155, 255, 259–264, 273 |
| excluded: invisible below clipped panel/table boundary | 65–80, 172–251, 419–420, 422, 425, 428–561, 590 |
| excluded: invisible refresh footprint; no painted icon in base | 129–130 |
| excluded: invisible resize hotspot; no painted grip | 254 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 135, 139, 252–253, 257–258, 562–570, 575–589, 602 |
| excluded: record row data or row wrapper | 274–276, 278, 281, 283–284, 286–290, 293, 295–296, 298–301, 303, 306, 308–309, 311–314, 316, 319, 321–322, 324–327, 329, 332, 334–339, 341, 344, 346–347, 349–352, 354, 357, 359–360, 362–365, 368, 371, 373–374, 376–379, 381, 384, 386–387, 389–393, 396, 398–399, 401–404, 406, 409, 411–412, 414–418, 421, 423–424, 426–427 |

602 source items; 93 inventory IDs represented by source entries; 413 excluded items. Image-only controls are additional to that source-ID count.

#### m3-list-view-selector

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| AL-01 | 112 |
| AL-02 | 114–117 |
| AL-02.1 | 605 |
| AL-02.10 | 615 |
| AL-02.11 | 616–617 |
| AL-02.12 | 618, 620 |
| AL-02.2 | 607 |
| AL-02.3 | 608 |
| AL-02.4 | 609 |
| AL-02.5 | 610 |
| AL-02.6 | 611 |
| AL-02.7 | 612 |
| AL-02.8 | 613 |
| AL-02.9 | 614 |
| AL-03 | 118 |
| AL-04 | 119 |
| AL-05 | 121 |
| AL-06 | 122 |
| AL-07 | 123 |
| AL-08 | 124 |
| AL-09 | 125 |
| AL-10 | 126 |
| AL-11 | 127–128 |
| AL-12 | 131 |
| AL-13 | 132–133 |
| AL-14 | 134 |
| AL-15 | 137–138 |
| AL-16 | 140 |
| AL-20 | 142–143 |
| AL-21 | 144–145 |
| AL-22 | 146–147 |
| AL-23 | 148–149 |
| AL-24 | 150–151 |
| AL-25 | 152–153 |
| AL-26 | 154 |
| AL-27 | 156–157 |
| AL-33 | 256 |
| AL-34 | 265–266 |
| AL-35 | 267 |
| AL-36 | 268–269 |
| AL-39 | 270 |
| AL-40 | 279–280, 291–292, 304–305, 317–318, 330–331, 342–343, 355–356, 368–369, 381–382, 393–394, 406–407 |
| AL-42 | 282, 294, 307, 320, 333, 345, 358, 371, 384, 396, 409 |
| AL-46 | 277, 302, 315, 328, 340, 353, 366, 379, 404 |
| AL-48 | 570 |
| AL-49 | 571 |
| AL-50 | 572 |
| AL-51 | 573 |
| AL-52 | 113 |
| AL-53 | 158–159 |
| AL-54 | 160–161 |
| AL-55 | 162–163 |
| AL-56 | 164–165 |
| AL-57 | 166–167 |
| AL-58 | 168–169 |
| AL-59 | 170–171 |
| AL-60 | 271 |
| AL-61 | 272 |
| AL-63 | 285, 297, 310, 323, 348, 361, 374, 387, 399, 412 |
| SH-01 | 2–4 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| SH-35 | 590 |
| SH-36 | 591 |
| SH-37 | 592 |
| SH-38 | 593 |
| SH-39 | 594 |
| SH-40 | 595 |
| SH-41 | 596 |
| SH-42 | 597 |
| SH-43 | 598 |
| SH-44 | 599 |
| SH-45 | 600 |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82–83, 87, 111, 120, 136, 141, 155, 255, 259–264, 273, 602–604, 606, 619 |
| excluded: invisible below clipped panel/table boundary | 65–80, 172–251, 418–419, 421, 424, 427–560, 589 |
| excluded: invisible refresh footprint; no painted icon in base | 129–130 |
| excluded: invisible resize hotspot; no painted grip | 254 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 135, 139, 252–253, 257–258, 561–569, 574–588, 601 |
| excluded: record row data or row wrapper | 274–276, 278, 281, 283–284, 286–290, 293, 295–296, 298–301, 303, 306, 308–309, 311–314, 316, 319, 321–322, 324–327, 329, 332, 334–339, 341, 344, 346–347, 349–352, 354, 357, 359–360, 362–365, 367, 370, 372–373, 375–378, 380, 383, 385–386, 388–392, 395, 397–398, 400–403, 405, 408, 410–411, 413–417, 420, 422–423, 425–426 |

620 source items; 104 inventory IDs represented by source entries; 418 excluded items. Image-only controls are additional to that source-ID count.

#### m3-list-create-menu

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| AL-01 | 112 |
| AL-02 | 114–117 |
| AL-03 | 118 |
| AL-04 | 119 |
| AL-05 | 121 |
| AL-06 | 122 |
| AL-07 | 123 |
| AL-08 | 124 |
| AL-09 | 125 |
| AL-10 | 126 |
| AL-11 | 127–128 |
| AL-12 | 131 |
| AL-13 | 132–133 |
| AL-14 | 134 |
| AL-15 | 137–138 |
| AL-16 | 140 |
| AL-20 | 142–143 |
| AL-21 | 144–145 |
| AL-22 | 146–147 |
| AL-23 | 148–149 |
| AL-24 | 150–151 |
| AL-25 | 152–153 |
| AL-26 | 154 |
| AL-27 | 156–157 |
| AL-33 | 256 |
| AL-34 | 265–266 |
| AL-35 | 267 |
| AL-36 | 268–269 |
| AL-39 | 270 |
| AL-40 | 279–280, 291–292, 304–305, 317–318, 330–331, 342–343, 355–356, 369–370, 382–383, 394–395, 407–408 |
| AL-42 | 282, 294, 307, 320, 333, 345, 358, 372, 385, 397, 410 |
| AL-45 | 366 |
| AL-46 | 277, 302, 315, 328, 340, 353, 367, 380, 405 |
| AL-48 | 571 |
| AL-49 | 572 |
| AL-50 | 573 |
| AL-51 | 574 |
| AL-52 | 113 |
| AL-53 | 158–159 |
| AL-54 | 160–161 |
| AL-55 | 162–163 |
| AL-56 | 164–165 |
| AL-57 | 166–167 |
| AL-58 | 168–169 |
| AL-59 | 170–171 |
| AL-60 | 271 |
| AL-61 | 272 |
| AL-63 | 285, 297, 310, 323, 348, 361, 375, 388, 400, 413 |
| SH-01 | 2–4 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| SH-35 | 591 |
| SH-36 | 592 |
| SH-37 | 593 |
| SH-38 | 594 |
| SH-39 | 595 |
| SH-40 | 596 |
| SH-41 | 597 |
| SH-42 | 598 |
| SH-43 | 599 |
| SH-44 | 600 |
| SH-45 | 601 |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82–83, 87, 111, 120, 136, 141, 155, 255, 259–264, 273 |
| excluded: invisible below clipped panel/table boundary | 65–80, 172–251, 419–420, 422, 425, 428–561, 590 |
| excluded: invisible refresh footprint; no painted icon in base | 129–130 |
| excluded: invisible resize hotspot; no painted grip | 254 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 135, 139, 252–253, 257–258, 562–570, 575–589, 602 |
| excluded: record row data or row wrapper | 274–276, 278, 281, 283–284, 286–290, 293, 295–296, 298–301, 303, 306, 308–309, 311–314, 316, 319, 321–322, 324–327, 329, 332, 334–339, 341, 344, 346–347, 349–352, 354, 357, 359–360, 362–365, 368, 371, 373–374, 376–379, 381, 384, 386–387, 389–393, 396, 398–399, 401–404, 406, 409, 411–412, 414–418, 421, 423–424, 426–427 |

602 source items; 93 inventory IDs represented by source entries; 413 excluded items. Image-only controls are additional to that source-ID count.

#### m3-list-actions

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| AL-01 | 112 |
| AL-02 | 114–117 |
| AL-03 | 118 |
| AL-04 | 119 |
| AL-05 | 121 |
| AL-06 | 122 |
| AL-07 | 123 |
| AL-08 | 124 |
| AL-09 | 125 |
| AL-10 | 126 |
| AL-11 | 127–128 |
| AL-12 | 131 |
| AL-13 | 132–133 |
| AL-14 | 134 |
| AL-14.1 | 590 |
| AL-14.2 | 592 |
| AL-14.3 | 594 |
| AL-14.4 | 596 |
| AL-14.5 | 599 |
| AL-14.6 | 600 |
| AL-14.7 | 601 |
| AL-14.8 | 602 |
| AL-15 | 137–138 |
| AL-16 | 140 |
| AL-20 | 142–143 |
| AL-21 | 144–145 |
| AL-22 | 146–147 |
| AL-23 | 148–149 |
| AL-24 | 150–151 |
| AL-25 | 152–153 |
| AL-26 | 154 |
| AL-27 | 156–157 |
| AL-33 | 256 |
| AL-34 | 265–266 |
| AL-35 | 267 |
| AL-36 | 268–269 |
| AL-39 | 270 |
| AL-40 | 279–280, 291–292, 304–305, 317–318, 330–331, 342–343, 355–356, 368–369, 381–382, 393–394, 406–407 |
| AL-42 | 282, 294, 307, 320, 333, 345, 358, 371, 384, 396, 409 |
| AL-46 | 277, 302, 315, 328, 340, 353, 366, 379, 404 |
| AL-48 | 570 |
| AL-49 | 571 |
| AL-50 | 572 |
| AL-51 | 573 |
| AL-52 | 113 |
| AL-53 | 158–159 |
| AL-54 | 160–161 |
| AL-55 | 162–163 |
| AL-56 | 164–165 |
| AL-57 | 166–167 |
| AL-58 | 168–169 |
| AL-59 | 170–171 |
| AL-60 | 271 |
| AL-61 | 272 |
| AL-63 | 285, 297, 310, 323, 348, 361, 374, 387, 399, 412 |
| AL-64 | 130 |
| SH-01 | 2–4 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| SH-35 | 604 |
| SH-36 | 605 |
| SH-37 | 606 |
| SH-38 | 607 |
| SH-39 | 608 |
| SH-40 | 609 |
| SH-41 | 610 |
| SH-42 | 611 |
| SH-43 | 612 |
| SH-44 | 613 |
| SH-45 | 614 |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82–83, 87, 111, 120, 136, 141, 155, 255, 259–264, 273 |
| excluded: invisible below clipped panel/table boundary | 65–80, 172–251, 418–419, 421, 424, 427–560, 603 |
| excluded: invisible refresh footprint; no painted icon in base | 129 |
| excluded: invisible resize hotspot; no painted grip | 254 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 135, 139, 252–253, 257–258, 561–569, 574–589, 591, 593, 595, 597–598, 615 |
| excluded: record row data or row wrapper | 274–276, 278, 281, 283–284, 286–290, 293, 295–296, 298–301, 303, 306, 308–309, 311–314, 316, 319, 321–322, 324–327, 329, 332, 334–339, 341, 344, 346–347, 349–352, 354, 357, 359–360, 362–365, 367, 370, 372–373, 375–378, 380, 383, 385–386, 388–392, 395, 397–398, 400–403, 405, 408, 410–411, 413–417, 420, 422–423, 425–426 |

615 source items; 101 inventory IDs represented by source entries; 418 excluded items. Image-only controls are additional to that source-ID count.

#### m3-list-after

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| AL-01 | 112 |
| AL-02 | 114–117 |
| AL-03 | 118 |
| AL-04 | 119 |
| AL-05 | 121 |
| AL-06 | 122 |
| AL-07 | 123 |
| AL-08 | 124 |
| AL-09 | 125 |
| AL-10 | 126 |
| AL-11 | 127–128 |
| AL-12 | 131 |
| AL-13 | 132–133 |
| AL-14 | 134 |
| AL-15 | 137–138 |
| AL-16 | 140 |
| AL-20 | 142–143 |
| AL-21 | 144–145 |
| AL-22 | 146–147 |
| AL-23 | 148–149 |
| AL-24 | 150–151 |
| AL-25 | 152–153 |
| AL-26 | 154 |
| AL-27 | 156–157 |
| AL-33 | 256 |
| AL-34 | 265–266 |
| AL-35 | 267 |
| AL-36 | 268–269 |
| AL-39 | 270 |
| AL-40 | 279–280, 291–292, 304–305, 317–318, 330–331, 342–343, 355–356, 369–370, 382–383, 394–395, 407–408 |
| AL-42 | 282, 294, 307, 320, 333, 345, 358, 372, 385, 397, 410 |
| AL-45 | 366 |
| AL-46 | 277, 302, 315, 328, 340, 353, 367, 380, 405 |
| AL-48 | 571 |
| AL-49 | 572 |
| AL-50 | 573 |
| AL-51 | 574 |
| AL-52 | 113 |
| AL-53 | 158–159 |
| AL-54 | 160–161 |
| AL-55 | 162–163 |
| AL-56 | 164–165 |
| AL-57 | 166–167 |
| AL-58 | 168–169 |
| AL-59 | 170–171 |
| AL-60 | 271 |
| AL-61 | 272 |
| AL-63 | 285, 297, 310, 323, 348, 361, 375, 388, 400, 413 |
| SH-01 | 2–4 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| SH-35 | 592 |
| SH-36 | 593 |
| SH-37 | 594 |
| SH-38 | 595 |
| SH-39 | 596 |
| SH-40 | 597 |
| SH-41 | 598 |
| SH-42 | 599 |
| SH-43 | 600 |
| SH-44 | 601 |
| SH-45 | 602 |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82–83, 87, 111, 120, 136, 141, 155, 255, 259–264, 273 |
| excluded: invisible below clipped panel/table boundary | 65–80, 172–251, 419–420, 422, 425, 428–561, 591 |
| excluded: invisible refresh footprint; no painted icon in base | 129–130 |
| excluded: invisible resize hotspot; no painted grip | 254 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 135, 139, 252–253, 257–258, 562–570, 575–590 |
| excluded: record row data or row wrapper | 274–276, 278, 281, 283–284, 286–290, 293, 295–296, 298–301, 303, 306, 308–309, 311–314, 316, 319, 321–322, 324–327, 329, 332, 334–339, 341, 344, 346–347, 349–352, 354, 357, 359–360, 362–365, 368, 371, 373–374, 376–379, 381, 384, 386–387, 389–393, 396, 398–399, 401–404, 406, 409, 411–412, 414–418, 421, 423–424, 426–427 |

602 source items; 93 inventory IDs represented by source entries; 413 excluded items. Image-only controls are additional to that source-ID count.

## Fields and layout
Source: exported Accounts metadata. 51 fields; one Standard layout. Visible: True; business-card display: True. Active Standard layout; both Administrator and Standard profiles use it as default. Required and form flags below are metadata, not observed form behaviour.

| Order | Section | Columns | Fields | Configured sequence |
| --- | --- | --- | --- | --- |
| 1 | Account Image | 1 | 1 | 1: Account Image |
| 2 | Account Information | 2 | 24 | 1: Account Owner; 2: Rating; 3: Account Name; 4: Phone; 5: Account Site; 6: Fax; 7: Parent Account; 8: Website; 9: Account Number; 10: Ticker Symbol; 11: Account Type; 12: Ownership; 13: Industry; 14: Employees; 15: Annual Revenue; 16: SIC Code; 16: Tag; 17: Created By; 18: Modified By; 19: Created Time; 20: Modified Time; 22: Last Activity Time; 22: Record Id; 26: Connected To |
| 3 | Address Information | 2 | 20 | 1: Billing Address; 1: Billing Address - City; 1: Billing Address - Coordinates; 1: Billing Address - Country / Region; 1: Billing Address - Flat / House No./ Building / Apartment Name; 1: Billing Address - Latitude; 1: Billing Address - Longitude; 1: Billing Address - State / Province; 1: Billing Address - Street Address; 1: Billing Address - Zip / Postal Code; 2: Shipping Address; 2: Shipping Address - City; 2: Shipping Address - Coordinates; 2: Shipping Address - Country / Region; 2: Shipping Address - Flat / House No./ Building / Apartment Name; 2: Shipping Address - Latitude; 2: Shipping Address - Longitude; 2: Shipping Address - State / Province; 2: Shipping Address - Street Address; 2: Shipping Address - Zip / Postal Code |
| 4 | Description Information | 1 | 1 | 1: Description |

Outside layout: Change Log Time, Locked, Last Enriched Time, Enrich Status, Distance.

### Field dictionary
Required reports system and layout constraints independently. RO / field RO retains both export flags. VCEQ = detail/create/edit/quick-create. No exported uniqueness constraint is represented by “none”.

| Label | API name | Type | Length | Required | Unique | RO / field RO | VCEQ | Section | Sequence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Billing Address - Latitude | Billing_Latitude | double | 50, 9 decimals | no | none | False / False | VCE- | Address Information | 1 |
| Billing Address - Longitude | Billing_Longitude | double | 50, 9 decimals | no | none | False / False | VCE- | Address Information | 1 |
| Shipping Address - Latitude | Shipping_Latitude | double | 50, 9 decimals | no | none | False / False | VCE- | Address Information | 2 |
| Shipping Address - Longitude | Shipping_Longitude | double | 50, 9 decimals | no | none | False / False | VCE- | Address Information | 2 |
| Account Owner | Owner | ownerlookup | 120 | no | none | False / True | VCE- | Account Information | 1 |
| Rating | Rating | picklist | 120 | no | none | False / False | VCE- | Account Information | 2 |
| Account Name | Account_Name | text | 200 | system, layout | none | False / False | VCEQ | Account Information | 3 |
| Phone | Phone | phone | 30 | no | none | False / False | VCEQ | Account Information | 4 |
| Account Site | Account_Site | text | 100 | no | none | False / False | VCE- | Account Information | 5 |
| Fax | Fax | text | 30 | no | none | False / False | VCE- | Account Information | 6 |
| Parent Account | Parent_Account | lookup | 120 | no | none | False / False | VCE- | Account Information | 7 |
| Website | Website | website | 255 | no | none | False / False | VCEQ | Account Information | 8 |
| Account Number | Account_Number | bigint | 18 | no | none | False / False | VCE- | Account Information | 9 |
| Ticker Symbol | Ticker_Symbol | text | 30 | no | none | False / False | VCE- | Account Information | 10 |
| Account Type | Account_Type | picklist | 120 | no | none | False / False | VCE- | Account Information | 11 |
| Ownership | Ownership | picklist | 120 | no | none | False / False | VCE- | Account Information | 12 |
| Industry | Industry | picklist | 120 | no | none | False / False | VCE- | Account Information | 13 |
| Employees | Employees | integer | 9 | no | none | False / False | VCE- | Account Information | 14 |
| Annual Revenue | Annual_Revenue | currency | 16, 2 decimals | no | none | False / False | VCE- | Account Information | 15 |
| SIC Code | SIC_Code | integer | 9 | no | none | False / False | VCE- | Account Information | 16 |
| Created By | Created_By | ownerlookup | 120 | no | none | False / False | V--- | Account Information | 17 |
| Modified By | Modified_By | ownerlookup | 120 | no | none | False / False | V--- | Account Information | 18 |
| Created Time | Created_Time | datetime | 120 | no | none | False / False | V--- | Account Information | 19 |
| Modified Time | Modified_Time | datetime | 120 | no | none | False / False | V--- | Account Information | 20 |
| Description | Description | textarea | 32000 | no | none | False / False | VCE- | Description Information | 1 |
| Last Activity Time | Last_Activity_Time | datetime | 120 | no | none | False / True | V--- | Account Information | 22 |
| Tag | Tag | text | 2000 | no | none | False / False | V--- | Account Information | 16 |
| Account Image | Record_Image | profileimage | 255 | no | none | False / False | VCE- | Account Image | 1 |
| Record Id | id | bigint | 18 | no | none | True / True | V--- | Account Information | 22 |
| Change Log Time | Change_Log_Time__s | datetime | 120 | no | none | True / True | ---- | outside layout | — |
| Locked | Locked__s | boolean | 5 | no | none | True / True | ---- | outside layout | — |
| Last Enriched Time | Last_Enriched_Time__s | datetime | 120 | no | none | True / True | ---- | outside layout | — |
| Enrich Status | Enrich_Status__s | picklist | 120 | no | none | True / True | ---- | outside layout | — |
| Billing Address | Billing_Address | textarea | 2000 | no | none | True / True | VCE- | Address Information | 1 |
| Billing Address - Country / Region | Billing_Country | picklist | 120 | no | none | False / False | VCE- | Address Information | 1 |
| Billing Address - Flat / House No./ Building / Apartment Name | Billing_Flat_House_No_Building_Apartment_Name | text | 255 | no | none | False / False | VCE- | Address Information | 1 |
| Billing Address - Street Address | Billing_Street | text | 255 | no | none | False / False | VCE- | Address Information | 1 |
| Billing Address - City | Billing_City | text | 255 | no | none | False / False | VCE- | Address Information | 1 |
| Billing Address - State / Province | Billing_State | picklist | 120 | no | none | False / False | VCE- | Address Information | 1 |
| Billing Address - Zip / Postal Code | Billing_Code | text | 255 | no | none | False / False | VCE- | Address Information | 1 |
| Billing Address - Coordinates | Billing_Coordinates | textarea | 255 | no | none | True / True | VCE- | Address Information | 1 |
| Shipping Address | Shipping_Address | textarea | 2000 | no | none | True / True | VCE- | Address Information | 2 |
| Shipping Address - Country / Region | Shipping_Country | picklist | 120 | no | none | False / False | VCE- | Address Information | 2 |
| Shipping Address - Flat / House No./ Building / Apartment Name | Shipping_Flat_House_No_Building_Apartment_Name | text | 255 | no | none | False / False | VCE- | Address Information | 2 |
| Shipping Address - Street Address | Shipping_Street | text | 255 | no | none | False / False | VCE- | Address Information | 2 |
| Shipping Address - City | Shipping_City | text | 255 | no | none | False / False | VCE- | Address Information | 2 |
| Shipping Address - State / Province | Shipping_State | picklist | 120 | no | none | False / False | VCE- | Address Information | 2 |
| Shipping Address - Zip / Postal Code | Shipping_Code | text | 255 | no | none | False / False | VCE- | Address Information | 2 |
| Shipping Address - Coordinates | Shipping_Coordinates | textarea | 255 | no | none | True / True | VCE- | Address Information | 2 |
| Distance | nearby_distance__s | double | 16, 2 decimals | no | none | True / True | ---- | outside layout | — |
| Connected To | Connected_To__s | multi_module_lookup | 120 | no | none | False / False | VC-- | Account Information | 26 |

### Types absent from Leads and Contacts
Metadata comparison uses the union of exported Leads and Contacts data types.
New types: none.
Account Image (profileimage), Connected To (multi_module_lookup) and coordinate doubles already exist in Contacts. Employees and SIC Code are integer fields of length 9; Annual Revenue is currency, length 16, 2 decimal places, precision 2 and normal rounding. Exported display_format is null for these numeric fields; rendered formatting is not observed.

## Picklists
Exported option order; no dropdown was observed. Country and state catalogs are referenced rather than duplicated.

| Label | API name | Options | Exported options |
| --- | --- | --- | --- |
| Rating | Rating | 6 | -None-; Acquired; Active; Market Failed; Project Cancelled; Shut Down |
| Account Type | Account_Type | 14 | -None-; Analyst; Competitor; Customer; Distributor; Integrator; Investor; Other; Partner; Press; Prospect; Reseller; Supplier; Vendor |
| Ownership | Ownership | 9 | -None-; Other; Private; Public; Subsidiary; Partnership; Government; Privately Held; Public Company |
| Industry | Industry | 24 | -None-; ASP (Application Service Provider); Data/Telecom OEM; ERP (Enterprise Resource Planning); Government/Military; Large Enterprise; ManagementISV; MSP (Management Service Provider); Network Equipment Enterprise; Non-management ISV; Optical Networking; Service Provider; Small/Medium Enterprise; Storage Equipment; Storage Service Provider; Systems Integrator; Wireless Industry; Financial Services; Education; Technology; Real Estate; Consulting; Communications; Manufacturing |
| Enrich Status | Enrich_Status__s | 3 | Available; Enriched; Data not found |

Billing Country: script comparison of ordered display/actual pairs against Contacts Mailing_Country: identical (248 options). See [contacts.md — Country / Region catalog](contacts.md#country--region-catalog).
Shipping Country: script comparison of ordered display/actual pairs against Contacts Mailing_Country: identical (248 options). See [contacts.md — Country / Region catalog](contacts.md#country--region-catalog).
Billing State: script comparison of ordered display/actual pairs against Contacts Mailing_State: identical (3954 options). See [contacts.md — State / Province catalog](contacts.md#state--province-catalog).
Shipping State: script comparison of ordered display/actual pairs against Contacts Mailing_State: identical (3954 options). See [contacts.md — State / Province catalog](contacts.md#state--province-catalog).

## Lookups and relations
Parent Account targets Accounts; exported reverse API name is Child_Accounts, display label Member Accounts. revalidate_filter_during_edit=false; no system query is configured. Cycle prevention, selection constraints and visible hierarchy affordances are not observed. No inference is made about recursive depth. Connected To exports Leads as its only target and allows dynamic module addition; additional targets are not inferred.

### Incoming Accounts lookups
Scanned every exported metadata/modules/*/fields.json; null module exports were skipped. Custom automation labels and identifiers are omitted; two incoming Accounts lookups were counted there. The table reports configured lookup targets, including self-relations.

| Source module | Field | API name | Type | Reverse relation |
| --- | --- | --- | --- | --- |
| Accounts | Parent Account | Parent_Account | lookup | Child_Accounts |
| Attachments | Parent ID | Parent_Id | lookup | Attachments |
| Cases | Account Name | Account_Name | lookup | Cases |
| Contacts | Account Name | Account_Name | lookup | Contacts |
| Deals | Account Name | Account_Name | lookup | Deals |
| Email_Sentiment | Seid | Seid | multi_module_lookup | Email_Sentiment |
| Invoices | Account Name | Account_Name | lookup | Invoices |
| Leads | Converted Account | Converted_Account | lookup | — |
| Locking_Information__s | Locked For | Locked_For__s | multi_module_lookup | Locking_Information__s |
| Custom automation module (two fields) | Accounts result lookup | omitted custom identifiers | lookup | — |
| Quotes | Account Name | Account_Name | lookup | Quotes |
| Sales_Orders | Account Name | Account_Name | lookup | SalesOrders |

## Views
Metadata only; no view was selected. Null sorting does not establish a default order.

| View | Default | Criteria | Columns | Sort by / order |
| --- | --- | --- | --- | --- |
| All Accounts | yes | null (no exported criterion) | Account_Name, Phone, Website, Owner | null / null |
| All Locked Accounts | no | Locked__s equal True | Account_Name, Phone, Website, Owner | null / null |
| My Accounts | no | Owner equal {'name': '${CURRENTUSER}'} | Account_Name, Phone, Website | null / null |
| New Last Week | no | Created_Time equal ${LASTWEEK} | Account_Name, Phone, Website, Owner | null / null |
| New This Week | no | Created_Time equal ${THISWEEK} | Account_Name, Phone, Website, Owner | null / null |
| Recently Created Accounts | no | (Common_Status contains c AND Created_Time less_equal ${AGEINDAYS}+31) | Account_Name, Phone, Website, Owner | null / null |
| Recently Modified Accounts | no | (Common_Status contains m AND Modified_Time less_equal ${AGEINDAYS}+31) | Account_Name, Phone, Website, Owner | null / null |
| Unread Accounts | no | Common_Status not_contains v | Account_Name, Phone, Website, Owner | null / null |

All exported views are system-defined and public; wrap_text=true, locked=false, favorite=null. Common_Status is a view-criterion reference, not an exported field definition. Parent_Account is not a configured column in these views.

## Related lists
Exported configuration only, sorted numerically by sequence. Target keys reuse the Contacts mapping; unresolved targets retain ?.

| Order | Label | API name | Target module | Module key | Visible | Type | Enabled operations |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Connected Records | Connected_Records__s | — | ? | yes | combined_view | none |
| 1 | Review Process-Review Summary | Review_Processes | Review_Processes | P3 | no | default | none |
| 2 | Notes | Notes | Notes | M6 | yes | default | none |
| 2 | Review Process-Field History | Review_Logs | Review_Logs | P3 | no | default | none |
| 3 | Attachments | Attachments | Attachments | M6 | yes | default | none |
| 4 | Deals | Deals | Deals | M4 | yes | default | edit, create, bulk_edit, delete, assign, disassociate |
| 5 | Contacts | Contacts | Contacts | M2 | yes | default | edit, create, bulk_edit, delete, disassociate, assign |
| 6 | Emails | Emails | Emails | M10 | yes | default | create, delete |
| 8 | Open Calls | Calls | Calls | M5 | yes | default | edit, create |
| 9 | Open Meetings | Events | Events | M5 | yes | default | edit, create |
| 10 | Open Tasks | Tasks | Tasks | M5 | yes | default | edit, create |
| 13 | Closed Tasks | Tasks_History | Tasks | M5 | yes | default | edit, create |
| 14 | Closed Meetings | Events_History | Events | M5 | yes | default | edit, create |
| 15 | Closed Calls | Calls_History | Calls | M5 | yes | default | edit, create |
| 17 | Products | Products | Products | P2 | yes | default | disassociate |
| 18 | Quotes | Quotes | Quotes | P2 | yes | default | edit, create, bulk_edit, delete, assign, disassociate |
| 19 | Sales Orders | SalesOrders | Sales_Orders | P2 | yes | default | edit, create, bulk_edit, delete, assign, disassociate |
| 20 | Invoices | Invoices | Invoices | P2 | yes | default | edit, create, bulk_edit, delete, assign, disassociate |
| 21 | Member Accounts | Child_Accounts | Accounts | M3 | yes | default | edit, create, delete |
| 22 | Cases | Cases | Cases | M8 | yes | default | edit, create, bulk_edit, delete, assign, disassociate |
| 23 | Social | Social | Social | M15 | yes | default | none |
| 24 | Checklists | CheckLists | CheckLists | ? | yes | default | none |
| 25 | Locking Information | Locking_Information__s | Locking_Information__s | M11 | yes | default | none |
| 28 | Email Drafts | Email_Drafts__s | Email_Drafts__s | M10 | no | default | none |
| 28 | Email Sentiment | Email_Sentiment | Email_Sentiment | P3 | no | default | none |

## Field permissions by profile
Source: each exported field’s profiles. Profile IDs are deliberately omitted. Permissions do not override read_only/field_read_only or layout flags.

| Field | Administrator | Standard |
| --- | --- | --- |
| Billing Address - Latitude | read_write | read_write |
| Billing Address - Longitude | read_write | read_write |
| Shipping Address - Latitude | read_write | read_write |
| Shipping Address - Longitude | read_write | read_write |
| Account Owner | read_write | read_write |
| Rating | read_write | read_write |
| Account Name | read_write | read_write |
| Phone | read_write | read_write |
| Account Site | read_write | read_write |
| Fax | read_write | read_write |
| Parent Account | read_write | read_write |
| Website | read_write | read_write |
| Account Number | read_write | read_write |
| Ticker Symbol | read_write | read_write |
| Account Type | read_write | read_write |
| Ownership | read_write | read_write |
| Industry | read_write | read_write |
| Employees | read_write | read_write |
| Annual Revenue | read_write | read_write |
| SIC Code | read_write | read_write |
| Created By | read_write | read_write |
| Modified By | read_write | read_write |
| Created Time | read_write | read_write |
| Modified Time | read_write | read_write |
| Description | read_write | read_write |
| Last Activity Time | read_write | read_write |
| Tag | read_write | read_write |
| Account Image | read_write | read_write |
| Record Id | read_only | read_only |
| Change Log Time | read_only | read_only |
| Locked | read_only | read_only |
| Last Enriched Time | read_only | read_only |
| Enrich Status | read_only | read_only |
| Billing Address | read_write | read_write |
| Billing Address - Country / Region | read_write | read_write |
| Billing Address - Flat / House No./ Building / Apartment Name | read_write | read_write |
| Billing Address - Street Address | read_write | read_write |
| Billing Address - City | read_write | read_write |
| Billing Address - State / Province | read_write | read_write |
| Billing Address - Zip / Postal Code | read_write | read_write |
| Billing Address - Coordinates | read_write | read_write |
| Shipping Address | read_write | read_write |
| Shipping Address - Country / Region | read_write | read_write |
| Shipping Address - Flat / House No./ Building / Apartment Name | read_write | read_write |
| Shipping Address - Street Address | read_write | read_write |
| Shipping Address - City | read_write | read_write |
| Shipping Address - State / Province | read_write | read_write |
| Shipping Address - Zip / Postal Code | read_write | read_write |
| Shipping Address - Coordinates | read_write | read_write |
| Distance | read_only | read_only |
| Connected To | read_write | read_write |

## Differences from Contacts list
- View strip: All Accounts and All Locked Accounts before the selector; Contacts basic capture has one tab.
- Visible system filters: Locked, Record Action, Related Records Action, Touched Records, Untouched Records, Cadences. Activities, Campaigns and Latest Email Status are absent.
- Visible field filters: Account Name, Account Number, Account Owner, Account Site, Account Type, Annual Revenue, Billing Address, Billing Address - City. Other labels below the clipping boundary are DOM evidence only (not observed as visible controls).
- Columns: Account Name with All selector, Phone, Website, Account Owner. Phone includes a handset icon; Website contains links; note bubbles appear before row-selection boxes where present. Hierarchy is not a visible table column.
- Public Views has eight Accounts choices; Contacts-only Mailing Labels and Unsubscribed Contacts are absent.
- Actions has ten rows (AL-14.1–AL-14.10). Contacts-only Mass Email, Approve Contacts and Add to Campaigns are absent. Create-menu contents were blocked, not assumed from Contacts.
- Empty state and hover-only controls not present in these screenshots remain not observed.

### Clipped filter labels (DOM evidence only)

Below the visible field rows: Billing Address - Country / Region; Billing Address - Flat / House No./ Building / Apartment Name; Billing Address - State / Province; Billing Address - Street Address; Billing Address - Zip / Postal Code; Connected To; Created By; Created Time; Employees; Fax; Industry; Last Activity Time; Modified By; Modified Time; Ownership; Parent Account; Phone; Rating; Shipping Address; Shipping Address - City; Shipping Address - Country / Region; Shipping Address - Flat / House No./ Building / Apartment Name; Shipping Address - State / Province; Shipping Address - Street Address; Shipping Address - Zip / Postal Code; SIC Code; Tag; Ticker Symbol; Website. These labels are present in controls.json but clipped from the screenshot; no AL number is assigned as a visible control. Parent Account occurs in this list, which is the only captured list-state trace of the hierarchy beyond metadata.

The likewise clipped Filter By Related Modules group lists: Account Product Relation (Products); Accounts (Member Accounts); Cases; Contacts; Deals; Emails; Invoices; Leads (Converted Leads); Quotes; Sales Orders. No toggle was operated.

## Shared components reused
Shared list controls are visually checked through Contacts refs. Form and detail entries below are implementation references awaiting their separate captures.

| Component | Definition / inventory / implementation task | Accounts difference |
| --- | --- | --- |
| Two address groups | contacts-form.md F-33–F-52; MEP-315 | Billing / Shipping instead of Mailing / Other; catalogs compared above |
| Related-list rail and cards | contacts-record-detail.md D-10–D-31, D-52–D-95; MEP-325 | Member Accounts relation; detail capture belongs to MEP-327 / MEP-328 |
| Lookup | contacts-form.md; MEP-318 | Parent Account self-lookup; incoming Accounts links above |
| Date input | contacts-form.md; MEP-317 | No date-type field in Accounts layout; only system datetime fields |
| List screen | contacts.md L-01–L-51; MEP-319 | Accounts-specific tabs, filters and columns; AL references above |
| Bulk-action dialogs | list-views.md; contacts.md | AL-14.1–AL-14.3 menu entries seen; their dialogs were not opened |
| Global search | global-search.md | Accounts is a module-menu item S-10.4 and documented advanced-filter option S-31.2; no Accounts query was run |
| Duplicates | duplicates.md | D2 lists Accounts support for Find and Merge; AL-14.6 shows Deduplicate Accounts entry only; no dialog or execution observed |

## Capability table
| Capability | Inventory numbers | Module key | Reuse / Accounts-specific |
| --- | --- | --- | --- |
| Public view selector | AL-01, AL-02, AL-02.1–AL-02.12, AL-52 | M3 | Contacts reused; Accounts view names and extra tab |
| Filter / sort | AL-03–AL-04, AL-15–AL-27, AL-53–AL-59 | M3 | Contacts reused; Accounts-specific field set |
| View modes | AL-05–AL-11 | M3 | Contacts reused; mode switching not exercised |
| Create / create menu | AL-12–AL-13 | M3 / M6 | Contacts reused; create menu not observed |
| Record table / selection | AL-33–AL-36, AL-39–AL-40, AL-42, AL-60–AL-63 | M3 / M5 | Accounts columns and telephone affordance |
| Row tools / notes | AL-45–AL-46 | M3 / M6 | Contacts reused; note position moved |
| Pagination | AL-48–AL-51 | M3 | Contacts reused |
| Mass actions / drafts | AL-14.1–AL-14.5 | M3 / M6 | Contacts reused; menu presence only |
| Deduplicate | AL-14.6 | M3 | Contacts reused; module-name label |
| Client script | AL-14.7 | M11 | Contacts reused |
| Export | AL-14.8 | M6 | Contacts reused; module-name label |
| Sheet / print | AL-14.9–AL-14.10 | ? / M3 | Contacts reused; menu rows moved |
| Refresh | AL-64 | M3 | New painted control versus Contacts base |
| Parent / Member Accounts hierarchy | no visible list control | M3 | Accounts-specific metadata; detail/form tasks |
| Global search / Find and Merge | S-10.4, S-31.2 (global-search.md); D2 (duplicates.md) | M3 | Shared documented capability only |

## Capture refs
- m3-list-base: basic populated list, 0 clicks / 0 skipped. First attempt failed with profile in use; the same command succeeded once after the prescribed two-minute wait.
- m3-list-view-selector: public-view menu, 1 requested click / 0 skipped.
- m3-list-create-menu: unchanged basic screen, 1 requested click / 1 skipped (dangerous attribute guard); no workaround.
- m3-list-actions: Actions menu, 1 requested click / 0 skipped.
- m3-list-after: basic list, 0 clicks / 0 skipped; same count as base.

Every screenshot was opened as an image. Each capture has exactly one successful POST for Accounts/bulk, Accounts/actions/count, Analytics_Components/actions/run and shell visitor triggers; all are the expected read calls. ActivityReminder.do and crminotification.do are blocked in every capture. Four telemetry paths are blocked in view-selector and Actions captures. No unexpected non-GET path or excess count was found. Raw captures stay outside the repository.

## Open questions
- Create-menu contents remain not observed because the tool skipped the opener. Lead must retain this evidence limit; no bypass is authorized.
- Hover-only controls outside the highlighted row, empty state and refresh behaviour remain not observed.
- Hierarchy validation and write-only outcomes are not observable without a write.
- Unknown related-list module keys require lead classification; preserve ? until decided.
