# Contacts — create and edit forms

## Purpose

Inventory the Contacts form controls and differences from the Lead form. Shared form context is in [record-detail.md](record-detail.md) › Create and edit forms; Contacts evidence here takes precedence over assumptions from Leads. Module 2 research is based on screenshots and a control reconciliation, without measurement, styling tokens or request-shape specification.

**Safety-limited research:** the earlier Account Name opening stopped its research run. Under the revised contract, the 2026-10-11 continuation stopped at `m2f2-create-reporting`: the requested lookup click was skipped (zero matches), and a blocked notification POST path was absent from the designated create baseline. Only the required no-click after capture followed. No field was filled, option selected, search performed or save action invoked. Both new list totals are 471; unchanged totals alone cannot prove unchanged field values. No status-bearing POST, PUT or DELETE to the Contacts record collection was captured. The CTO decision treats the specified detail-load and lookup-list calls as read-only page loading, with path/count limits; it does not exempt an additional non-baseline blocked path.

## Layout

The left navigation rail, top bar and bottom utility strip remain around the form. The form content scrolls internally; a full-page capture does not reveal all its scroll content. The fixed title strip reads `Create Contact`, followed by `Edit Page Layout`. Its right actions, left to right, are `Cancel`, `Save and New`, `Save`; all three are enabled at initial load. There is no visible header layout selector. A `Client Script` tab with a small left arrow sits on the page’s right edge and partially overlaps the far-right lookup area.

Contact Image precedes Contact Information. The image is a circular placeholder with no observed upload operation. Contact Information is a two-column grid. The following order combines screenshot evidence with accessible field labels; rows outside the captured viewport are identified rather than treated as visually verified.

| Row | Left column | Right column | Evidence |
| --- | --- | --- | --- |
| 1 | Contact Owner, dropdown arrow and user lookup icon | Lead Source, dropdown arrow | create screenshot |
| 2 | Salutation prefix and First Name | Last Name | create screenshot; Last Name has a required input-edge marker |
| 3 | Account Name, account lookup icon | Vendor Name, vendor lookup icon | create screenshot |
| 4 | Email | Title | create screenshot |
| 5 | Phone | Department | create screenshot |
| 6 | Other Phone | Home Phone | create screenshot |
| 7 | Mobile | Fax | create screenshot |
| 8 | Assistant | Date of Birth | create screenshot; date placeholder DD.MM.YYYY |
| 9 | — | Asst Phone | create screenshot |
| 10 | — | Email Opt Out | accessibility/control evidence only; below create viewport |
| 11 | — | Skype ID | accessibility/control evidence only; outside every captured form viewport |
| 12 | — | Secondary Email | partly visible at top of country capture |
| 13 | — | Twitter | country screenshot; @ prefix |
| 14 | — | Reporting To and contact lookup icon | country screenshot |

Contact Owner is prefilled on create; no user name is reproduced. Salutation and Lead Source initially show `-None-`. Last Name is the only required marker visible in the create viewport. No calendar or information icon is visible next to Date of Birth. Picker arrows are part of their select controls, not additional independently operable buttons. The left arrow and label on Client Script form one tab.

The country opening scrolls the form to Address Information. Its heading has `Copy Address` at the right. Bordered Mailing Address and Other Address groups sit side by side. Each group has, in order: Country / Region; Flat / House No./ Building / Apartment Name; Street Address; City; State / Province; Zip / Postal Code; Coordinates, with separate Latitude and Longitude inputs. All are shown in the country capture, although the open country list covers part of the Mailing fields. The country list shows a search input, checked `-None-`, and six further visible options; no search or selection was made. `Clear All` is present in each address’s accessible/control evidence below the viewport, and its visual placement is unverified.

Description Information and the form footer are below the captured viewport. Accessible evidence reports Description and `Create Form Views : Standard View`, with `Create a custom form page`. Their rendered controls remain not observed; the one-pixel Description placeholder is not evidence of a visible textarea. Edit Contact was not opened because research stopped at the Account Name lookup. Its title, enabled actions, field population and differences from create remain not observed.

## Control inventory

Numbers SH-01–SH-46 and L-* reuse [contacts.md](contacts.md). Shell rows are repeated for capture coverage, never renumbered. The rail-boundary resize hit area appears in controls evidence but is not separately painted; it is excluded with a reason rather than given a visible-control number. `seen` means presence, not an exercised action. Unclicked actions are `not observed`. `F-*` identifies form controls; open-list children use the parent number. Controls outside the internal scroll viewport, covered by the dropdown, or not painted are excluded from that capture’s visible inventory and reconciled below. The unobserved field list appears under Open questions.

The create screenshot does not paint the bottom utility strip, although its controls appear in controls.json; the later form captures do paint it. The list screenshots show the full strip, including the far-right trash icon. No new shell menu was opened.


### Control inventory — m2f-list-base

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L-01 | View strip | All Contacts | tab | left, first | not observed | seen (m2f-list-base) | M2 |
| L-02 | View strip | Three dots icon | icon button | after current view tab | not observed | seen (m2f-list-base) | M2 |
| L-03 | Toolbar | Filter | button | left group, first | not observed | seen (m2f-list-base) | M2 |
| L-04 | Toolbar | Sort | button | left group, second | not observed | seen (m2f-list-base) | M2 |
| L-05 | Toolbar | List view icon | icon button | view group, first | not observed | seen (m2f-list-base) | M2 |
| L-06 | Toolbar | Kanban view icon | icon button | view group, second | not observed | seen (m2f-list-base) | M2 |
| L-07 | Toolbar | Sheet view icon | icon button | view group, third | not observed | seen (m2f-list-base) | M2 |
| L-08 | Toolbar | Chart view icon | icon button | view group, fourth | not observed | seen (m2f-list-base) | M2 |
| L-09 | Toolbar | Timeline view icon | icon button | view group, fifth | not observed | seen (m2f-list-base) | M2 |
| L-10 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | not observed | seen (m2f-list-base) | M2 |
| L-11 | Toolbar | Down chevron | icon button | view group, seventh | not observed | seen (m2f-list-base) | M2 |
| L-12 | Toolbar | Create Contact | button | right group, first | not observed | seen (m2f-list-base) | M2 |
| L-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Contact | not observed | seen (m2f-list-base) | M6 |
| L-14 | Toolbar | Three dots / Actions | icon button | right group, far right | not observed | seen (m2f-list-base) | M2 |
| L-15 | Filter panel | Search | input | below Filter Contacts by heading | not observed | seen (m2f-list-base) | M2 |
| L-16 | Filter panel | System Defined Filters | toggle | first section heading | not observed | seen (m2f-list-base) | M2 |
| L-17 | Filter panel | Activities | checkbox | system-defined section, Activities | not observed | seen (m2f-list-base) | M5 |
| L-18 | Filter panel | Campaigns | checkbox | system-defined section, Campaigns | not observed | seen (m2f-list-base) | M7 |
| L-19 | Filter panel | Latest Email Status | checkbox | system-defined section, Latest Email Status | not observed | seen (m2f-list-base) | M10 |
| L-20 | Filter panel | Locked | checkbox | system-defined section, Locked | not observed | seen (m2f-list-base) | M2 |
| L-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | not observed | seen (m2f-list-base) | M2 |
| L-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | not observed | seen (m2f-list-base) | M2 |
| L-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | not observed | seen (m2f-list-base) | M2 |
| L-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | not observed | seen (m2f-list-base) | M2 |
| L-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | not observed | seen (m2f-list-base) | P3 |
| L-26 | Filter panel | Filter By Fields | toggle | second section heading | not observed | seen (m2f-list-base) | M2 |
| L-27 | Filter panel | Account Name | checkbox | field section, Account Name | not observed | seen (m2f-list-base) | M3 |
| L-28 | Filter panel | Assistant | checkbox | field section, Assistant | not observed | seen (m2f-list-base) | M2 |
| L-29 | Filter panel | Asst Phone | checkbox | field section, Asst Phone | not observed | seen (m2f-list-base) | M2 |
| L-30 | Filter panel | Connected To | checkbox | field section, Connected To | not observed | seen (m2f-list-base) | M2 |
| L-31 | Filter panel | Contact Name | checkbox | field section, Contact Name | not observed | seen (m2f-list-base) | M2 |
| L-32 | Filter panel | Contact Owner (partly clipped) | checkbox | field section, Contact Owner (partly clipped) | not observed | seen (m2f-list-base) | M2 |
| L-33 | Table | Sliders icon | icon button | header, far right overlay | not observed | seen (m2f-list-base) | M11 |
| L-34 | Table | Select all checkbox | checkbox | header, before activity column | not observed | seen (m2f-list-base) | M2 |
| L-35 | Table | Contact Name | column header | first text column | not observed | seen (m2f-list-base) | M2 |
| L-36 | Table | All with down arrow | select | within Contact Name header, right | not observed | seen (m2f-list-base) | M2 |
| L-37 | Table | Account Name | column header | second text column | not observed | seen (m2f-list-base) | M3 |
| L-38 | Table | Email | column header | third text column | not observed | seen (m2f-list-base) | M2 |
| L-39 | Table | Phone (partly clipped) | column header | fourth text column, right edge | not observed | seen (m2f-list-base) | M2 |
| L-40 | Table | Record selection checkbox | checkbox | each visible row, before activity column | not observed | seen (m2f-list-base) | M2 |
| L-41 | Table | Call activity flag | badge | rows with activity, before Contact Name | not observed | seen (m2f-list-base) | M5 |
| L-42 | Table | Contact record link | link | Contact Name cells | not observed | seen (m2f-list-base) | M2 |
| L-43 | Table | Account record link | link | Account Name cells | not observed | seen (m2f-list-base) | M3 |
| L-44 | Table | Email address link | link | Email cells | not observed | seen (m2f-list-base) | M10 |
| L-48 | List footer | Total Records | badge | left | not observed | seen (m2f-list-base) | M2 |
| L-49 | List footer | Displayed record range | badge | right group, between arrows | not observed | seen (m2f-list-base) | M2 |
| L-50 | List footer | Previous | icon button | right group, before range | not observed | seen (m2f-list-base) | M2 |
| L-51 | List footer | Next | icon button | right group, after range | not observed | seen (m2f-list-base) | M2 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2f-list-base) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2f-list-base) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2f-list-base) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2f-list-base) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2f-list-base) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2f-list-base) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2f-list-base) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2f-list-base) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2f-list-base) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2f-list-base) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2f-list-base) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2f-list-base) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2f-list-base) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2f-list-base) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2f-list-base) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2f-list-base) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2f-list-base) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2f-list-base) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2f-list-base) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2f-list-base) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2f-list-base) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2f-list-base) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2f-list-base) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2f-list-base) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2f-list-base) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2f-list-base) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2f-list-base) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2f-list-base) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2f-list-base) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2f-list-base) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2f-list-base) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2f-list-base) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2f-list-base) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2f-list-base) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2f-list-base) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2f-list-base) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2f-list-base) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2f-list-base) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2f-list-base) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2f-list-base) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2f-list-base) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2f-list-base) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2f-list-base) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2f-list-base) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2f-list-base) | ? |
| SH-46 | Utility strip | Trash bin icon | icon button | far right, after Help | not observed | seen (m2f-list-base) | ? |


#### Control reconciliation
Ordinal numbers are one-based positions in this capture’s controls.json; no internal selectors are reproduced.
| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 65, 66, 67, 68, 83, 87, 111, 116, 119, 127, 128, 135, 137, 140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 166, 168, 170, 172, 173, 174, 283, 284, 288, 289, 292, 293, 295, 296, 687 |
| Excluded: invisible or outside captured viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 84, 91, 92, 94, 95, 97, 98, 101, 102, 107, 108, 109, 110, 134, 138, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 286, 287, 303, 304, 320, 321, 335, 336, 350, 351, 366, 367, 381, 382, 397, 398, 412, 413, 427, 428, 442, 443, 458, 459, 474, 475, 489, 490, 505, 506, 520, 521, 526, 533, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660, 661, 662, 663, 664, 665, 666, 667, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686, 699 |
| Excluded: record data or table structure | 290, 291, 305, 306, 307, 308, 311, 313, 315, 317, 319, 322, 323, 324, 327, 328, 330, 332, 334, 337, 338, 339, 342, 343, 345, 347, 349, 352, 353, 354, 357, 359, 361, 363, 365, 368, 369, 370, 373, 374, 376, 378, 380, 383, 384, 385, 388, 390, 392, 394, 396, 399, 400, 401, 404, 406, 408, 410, 411, 414, 415, 416, 419, 420, 422, 424, 426, 429, 430, 431, 434, 436, 438, 440, 441, 444, 445, 446, 449, 451, 453, 455, 457, 460, 461, 462, 465, 467, 469, 471, 473, 476, 477, 478, 481, 482, 484, 486, 488, 491, 492, 493, 496, 498, 500, 502, 504, 507, 508, 509, 512, 513, 515, 517, 519, 522, 523, 524, 527, 528, 530, 532, 534 |
| Excluded: target not painted in screenshot | 129 |
| L-01 | 112 |
| L-02 | 113, 114, 115 |
| L-03 | 117 |
| L-04 | 118 |
| L-05 | 120 |
| L-06 | 121 |
| L-07 | 122 |
| L-08 | 123 |
| L-09 | 124 |
| L-10 | 125 |
| L-11 | 126 |
| L-12 | 130 |
| L-13 | 131, 132 |
| L-14 | 133 |
| L-15 | 136 |
| L-16 | 139 |
| L-17 | 141 |
| L-18 | 143 |
| L-19 | 145 |
| L-20 | 147 |
| L-21 | 149 |
| L-22 | 151 |
| L-23 | 153 |
| L-24 | 155 |
| L-25 | 157 |
| L-26 | 159 |
| L-27 | 161 |
| L-28 | 163 |
| L-29 | 165 |
| L-30 | 167 |
| L-31 | 169 |
| L-32 | 171 |
| L-33 | 285 |
| L-34 | 294 |
| L-35 | 297 |
| L-36 | 298, 299 |
| L-37 | 300 |
| L-38 | 301 |
| L-39 | 302 |
| L-40 | 309, 310, 325, 326, 340, 341, 355, 356, 371, 372, 386, 387, 402, 403, 417, 418, 432, 433, 447, 448, 463, 464, 479, 480, 494, 495, 510, 511, 525 |
| L-41 | 312, 358, 389, 405, 435, 450, 466, 497 |
| L-42 | 314, 329, 344, 360, 375, 391, 407, 421, 437, 452, 468, 483, 499, 514, 529 |
| L-43 | 316, 331, 346, 362, 377, 393, 409, 423, 439, 454, 470, 485, 501, 516, 531 |
| L-44 | 318, 333, 348, 364, 379, 395, 425, 456, 472, 487, 503, 518 |
| L-48 | 668 |
| L-49 | 669 |
| L-50 | 670 |
| L-51 | 671 |
| SH-01 | 2, 3, 4 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29, 30, 31 |
| SH-10 | 33 |
| SH-11 | 34 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 60, 61 |
| SH-25 | 63, 64 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99, 100 |
| SH-34 | 103, 104, 105, 106 |
| SH-35 | 688 |
| SH-36 | 689 |
| SH-37 | 690 |
| SH-38 | 691 |
| SH-39 | 692 |
| SH-40 | 693 |
| SH-41 | 694 |
| SH-42 | 695 |
| SH-43 | 696 |
| SH-44 | 697 |
| SH-45 | 698 |
| Excluded: resize hit area not separately painted | 82 |

Screenshot-only control: SH-46 (far-right trash icon), already numbered in contacts.md. It is present in this inventory without a controls.json ordinal.

### Control inventory — m2f-create

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-01 | Header | Edit Page Layout | link | title strip, after title | not observed | seen (m2f-create) | M11 |
| F-02 | Header | Cancel | button | title strip, right group, first | not observed | seen (m2f-create) | M2 |
| F-03 | Header | Save and New | button | title strip, right group, second | not observed | seen (m2f-create) | M2 |
| F-04 | Header | Save | button | title strip, right group, third | not observed | seen (m2f-create) | M2 |
| F-05 | Contact Image | Contact image placeholder | icon button | Contact Image, only portrait | not observed | seen (m2f-create) | M6 |
| F-06 | Contact Information | Contact Owner | select | left, row 1 | not observed | seen (m2f-create) | M2 |
| F-07 | Contact Information | User lookup icon | icon button | left, row 1, input right edge | not observed | seen (m2f-create) | M2 |
| F-08 | Contact Information | Salutation | select | left, row 2, First Name prefix | not observed | seen (m2f-create) | M2 |
| F-09 | Contact Information | First Name | input | left, row 2, after prefix | not observed | seen (m2f-create) | M2 |
| F-10 | Contact Information | Account Name | input | left, row 3 | not observed | seen (m2f-create) | M2 |
| F-11 | Contact Information | Account lookup icon | icon button | left, row 3, input right edge | not observed | seen (m2f-create) | M3 |
| F-12 | Contact Information | Email | input | left, row 4 | not observed | seen (m2f-create) | M2 |
| F-13 | Contact Information | Phone | input | left, row 5 | not observed | seen (m2f-create) | M2 |
| F-14 | Contact Information | Other Phone | input | left, row 6 | not observed | seen (m2f-create) | M2 |
| F-15 | Contact Information | Mobile | input | left, row 7 | not observed | seen (m2f-create) | M2 |
| F-16 | Contact Information | Assistant | input | left, row 8 | not observed | seen (m2f-create) | M2 |
| F-17 | Contact Information | Lead Source | select | right, row 1 | not observed | seen (m2f-create) | M2 |
| F-18 | Contact Information | Last Name | input | right, row 2; required marker | not observed | seen (m2f-create) | M2 |
| F-19 | Contact Information | Vendor Name | input | right, row 3 | not observed | seen (m2f-create) | P2 |
| F-20 | Contact Information | Vendor lookup icon | icon button | right, row 3, input right edge | not observed | seen (m2f-create) | P2 |
| F-21 | Contact Information | Title | input | right, row 4 | not observed | seen (m2f-create) | M2 |
| F-22 | Contact Information | Department | input | right, row 5 | not observed | seen (m2f-create) | M2 |
| F-23 | Contact Information | Home Phone | input | right, row 6 | not observed | seen (m2f-create) | M2 |
| F-24 | Contact Information | Fax | input | right, row 7 | not observed | seen (m2f-create) | M2 |
| F-25 | Contact Information | Date of Birth | input | right, row 8 | not observed | seen (m2f-create) | M2 |
| F-26 | Contact Information | Asst Phone | input | right, row 9 | not observed | seen (m2f-create) | M2 |
| F-57 | Right edge | Client Script | tab | page, right edge | not observed | seen (m2f-create) | M11 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2f-create) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2f-create) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2f-create) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2f-create) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2f-create) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2f-create) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2f-create) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2f-create) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2f-create) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2f-create) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2f-create) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2f-create) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2f-create) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2f-create) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2f-create) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2f-create) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2f-create) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2f-create) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2f-create) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2f-create) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2f-create) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2f-create) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2f-create) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2f-create) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2f-create) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2f-create) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2f-create) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2f-create) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2f-create) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2f-create) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2f-create) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2f-create) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2f-create) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2f-create) | ? |


#### Control reconciliation
Ordinal numbers are one-based positions in this capture’s controls.json; no internal selectors are reproduced.
| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate wrapper or non-interactive text | 1, 2, 4, 13, 16, 19, 22, 25, 28, 30, 31, 34, 37, 51, 86, 99, 103, 104, 105, 107, 123, 124, 126, 129, 131, 132, 133, 135, 136, 140, 142, 144, 146, 148, 151, 152, 154, 155, 159, 161, 163, 165, 167, 169, 171 |
| SH-01 | 3 |
| Excluded: invisible or placeholder | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81, 90, 91, 93, 94, 96, 97, 100, 101, 106, 118, 119, 120, 121, 122, 139, 158, 173, 174, 175, 176, 192, 195, 199, 213, 216, 220, 222, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254 |
| SH-02 | 10 |
| SH-03 | 11 |
| SH-04 | 14 |
| SH-05 | 17 |
| SH-06 | 20 |
| SH-07 | 23 |
| SH-08 | 26 |
| SH-09 | 29 |
| SH-10 | 33 |
| SH-11 | 35 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41, 83 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 59, 60, 61 |
| SH-25 | 62, 63, 64 |
| Excluded: outside rail viewport | 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 255, 258, 259 |
| Excluded: resize hit area not separately painted | 82 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98 |
| SH-34 | 102 |
| Excluded: outside form viewport | 108, 110, 111, 112, 114, 116, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 193, 194, 196, 197, 198, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 214, 215, 217, 218, 219, 221, 223, 224, 225, 226, 227, 228 |
| F-01 | 109 |
| F-04 | 113 |
| F-03 | 115 |
| F-02 | 117 |
| F-05 | 125 |
| F-07 | 127 |
| F-06 | 128 |
| F-08 | 130 |
| F-09 | 134 |
| F-10 | 137 |
| F-11 | 138 |
| F-12 | 141 |
| F-13 | 143 |
| F-14 | 145 |
| F-15 | 147 |
| F-16 | 149 |
| F-17 | 150 |
| F-18 | 153 |
| F-19 | 156 |
| F-20 | 157 |
| F-21 | 160 |
| F-22 | 162 |
| F-23 | 164 |
| F-24 | 166 |
| F-25 | 168 |
| F-26 | 170 |
| Excluded: checkbox clipped outside form viewport | 172 |
| F-57 | 239 |
| Excluded: utility strip not painted | 256, 257, 260, 261, 262, 263, 264, 265, 266, 267, 268 |

### Control inventory — m2f-create-source

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-01 | Header | Edit Page Layout | link | title strip, after title | not observed | seen (m2f-create-source) | M11 |
| F-02 | Header | Cancel | button | title strip, right group, first | not observed | seen (m2f-create-source) | M2 |
| F-03 | Header | Save and New | button | title strip, right group, second | not observed | seen (m2f-create-source) | M2 |
| F-04 | Header | Save | button | title strip, right group, third | not observed | seen (m2f-create-source) | M2 |
| F-05 | Contact Image | Contact image placeholder | icon button | Contact Image, only portrait | not observed | seen (m2f-create-source) | M6 |
| F-06 | Contact Information | Contact Owner | select | left, row 1 | not observed | seen (m2f-create-source) | M2 |
| F-07 | Contact Information | User lookup icon | icon button | left, row 1, input right edge | not observed | seen (m2f-create-source) | M2 |
| F-08 | Contact Information | Salutation | select | left, row 2, First Name prefix | not observed | seen (m2f-create-source) | M2 |
| F-09 | Contact Information | First Name | input | left, row 2, after prefix | not observed | seen (m2f-create-source) | M2 |
| F-10 | Contact Information | Account Name | input | left, row 3 | not observed | seen (m2f-create-source) | M2 |
| F-11 | Contact Information | Account lookup icon | icon button | left, row 3, input right edge | not observed | seen (m2f-create-source) | M3 |
| F-12 | Contact Information | Email | input | left, row 4 | not observed | seen (m2f-create-source) | M2 |
| F-13 | Contact Information | Phone | input | left, row 5 | not observed | seen (m2f-create-source) | M2 |
| F-14 | Contact Information | Other Phone | input | left, row 6 | not observed | seen (m2f-create-source) | M2 |
| F-15 | Contact Information | Mobile | input | left, row 7 | not observed | seen (m2f-create-source) | M2 |
| F-16 | Contact Information | Assistant | input | left, row 8 | not observed | seen (m2f-create-source) | M2 |
| F-17 | Contact Information | Lead Source | select | right, row 1 | Opens searchable Lead Source list; no option selected | seen (m2f-create-source) | M2 |
| F-17.1 | Lead Source list | Search | input | popup, search above options | not observed | seen (m2f-create-source) | M2 |
| F-17.2 | Lead Source list | -None- | menu item | popup, option 1 | not observed | seen (m2f-create-source) | M2 |
| F-17.3 | Lead Source list | Advertisement | menu item | popup, option 2 | not observed | seen (m2f-create-source) | M2 |
| F-17.4 | Lead Source list | Cold Call | menu item | popup, option 3 | not observed | seen (m2f-create-source) | M2 |
| F-17.5 | Lead Source list | Employee Referral | menu item | popup, option 4 | not observed | seen (m2f-create-source) | M2 |
| F-17.6 | Lead Source list | External Referral | menu item | popup, option 5 | not observed | seen (m2f-create-source) | M2 |
| F-17.7 | Lead Source list | Online Store | menu item | popup, option 6 | not observed | seen (m2f-create-source) | M2 |
| F-17.8 | Lead Source list | Partner | menu item | popup, option 7 | not observed | seen (m2f-create-source) | M2 |
| F-24 | Contact Information | Fax | input | right, row 7 | not observed | seen (m2f-create-source) | M2 |
| F-25 | Contact Information | Date of Birth | input | right, row 8 | not observed | seen (m2f-create-source) | M2 |
| F-26 | Contact Information | Asst Phone | input | right, row 9 | not observed | seen (m2f-create-source) | M2 |
| F-57 | Right edge | Client Script | tab | page, right edge | not observed | seen (m2f-create-source) | M11 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2f-create-source) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2f-create-source) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2f-create-source) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2f-create-source) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2f-create-source) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2f-create-source) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2f-create-source) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2f-create-source) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2f-create-source) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2f-create-source) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2f-create-source) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2f-create-source) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2f-create-source) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2f-create-source) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2f-create-source) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2f-create-source) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2f-create-source) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2f-create-source) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2f-create-source) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2f-create-source) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2f-create-source) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2f-create-source) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2f-create-source) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2f-create-source) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2f-create-source) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2f-create-source) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2f-create-source) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2f-create-source) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2f-create-source) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2f-create-source) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2f-create-source) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2f-create-source) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2f-create-source) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2f-create-source) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2f-create-source) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2f-create-source) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2f-create-source) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2f-create-source) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2f-create-source) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2f-create-source) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2f-create-source) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2f-create-source) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2f-create-source) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2f-create-source) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2f-create-source) | ? |
| SH-46 | Utility strip | Trash bin icon | icon button | far right, after Help | not observed | seen (m2f-create-source) | ? |


#### Control reconciliation
Ordinal numbers are one-based positions in this capture’s controls.json; no internal selectors are reproduced.
| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate wrapper or non-interactive text | 1, 2, 4, 13, 16, 19, 22, 25, 28, 30, 31, 34, 37, 51, 86, 99, 103, 104, 105, 107, 123, 124, 126, 129, 131, 132, 133, 135, 136, 140, 142, 144, 146, 148, 151, 152, 154, 155, 159, 161, 163, 165, 167, 169, 171, 268 |
| SH-01 | 3 |
| Excluded: invisible or placeholder | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81, 90, 91, 93, 94, 96, 97, 100, 101, 106, 118, 119, 120, 121, 122, 139, 158, 173, 174, 175, 176, 192, 195, 199, 213, 216, 220, 222, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254 |
| SH-02 | 10 |
| SH-03 | 11 |
| SH-04 | 14 |
| SH-05 | 17 |
| SH-06 | 20 |
| SH-07 | 23 |
| SH-08 | 26 |
| SH-09 | 29 |
| SH-10 | 33 |
| SH-11 | 35 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41, 83 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 59, 60, 61 |
| SH-25 | 62, 63, 64 |
| Excluded: outside rail viewport | 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 255 |
| Excluded: resize hit area not separately painted | 82 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98 |
| SH-34 | 102 |
| Excluded: outside form viewport | 108, 110, 111, 112, 114, 116, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 193, 194, 196, 197, 198, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 214, 215, 217, 218, 219, 221, 223, 224, 225, 226, 227, 228, 282, 283, 284, 285, 286, 287 |
| F-01 | 109 |
| F-04 | 113 |
| F-03 | 115 |
| F-02 | 117 |
| F-05 | 125 |
| F-07 | 127 |
| F-06 | 128 |
| F-08 | 130 |
| F-09 | 134 |
| F-10 | 137 |
| F-11 | 138 |
| F-12 | 141 |
| F-13 | 143 |
| F-14 | 145 |
| F-15 | 147 |
| F-16 | 149 |
| F-17 | 150 |
| Excluded: covered by open Lead Source list | 153, 156, 157, 160, 162, 164 |
| F-24 | 166 |
| F-25 | 168 |
| F-26 | 170 |
| Excluded: checkbox clipped outside form viewport | 172 |
| F-57 | 239 |
| SH-35 | 256 |
| SH-36 | 257 |
| SH-37 | 258 |
| SH-38 | 259 |
| SH-39 | 260 |
| SH-40 | 261 |
| SH-41 | 262 |
| SH-42 | 263 |
| SH-43 | 264 |
| SH-44 | 265 |
| SH-45 | 266 |
| F-17.1 | 267 |
| F-17.2 | 269 |
| F-17.3 | 270 |
| F-17.4 | 271 |
| F-17.5 | 272 |
| F-17.6 | 273 |
| F-17.7 | 274 |
| F-17.8 | 275 |
| Excluded: option outside popup viewport | 276, 277, 278, 279, 280, 281 |

### Control inventory — m2f-create-salutation

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-01 | Header | Edit Page Layout | link | title strip, after title | not observed | seen (m2f-create-salutation) | M11 |
| F-02 | Header | Cancel | button | title strip, right group, first | not observed | seen (m2f-create-salutation) | M2 |
| F-03 | Header | Save and New | button | title strip, right group, second | not observed | seen (m2f-create-salutation) | M2 |
| F-04 | Header | Save | button | title strip, right group, third | not observed | seen (m2f-create-salutation) | M2 |
| F-05 | Contact Image | Contact image placeholder | icon button | Contact Image, only portrait | not observed | seen (m2f-create-salutation) | M6 |
| F-06 | Contact Information | Contact Owner | select | left, row 1 | not observed | seen (m2f-create-salutation) | M2 |
| F-07 | Contact Information | User lookup icon | icon button | left, row 1, input right edge | not observed | seen (m2f-create-salutation) | M2 |
| F-08 | Contact Information | Salutation | select | left, row 2, First Name prefix | not observed | seen (m2f-create-salutation) | M2 |
| F-09 | Contact Information | First Name | input | left, row 2, after prefix | not observed | seen (m2f-create-salutation) | M2 |
| F-10 | Contact Information | Account Name | input | left, row 3 | not observed | seen (m2f-create-salutation) | M2 |
| F-11 | Contact Information | Account lookup icon | icon button | left, row 3, input right edge | not observed | seen (m2f-create-salutation) | M3 |
| F-12 | Contact Information | Email | input | left, row 4 | not observed | seen (m2f-create-salutation) | M2 |
| F-13 | Contact Information | Phone | input | left, row 5 | not observed | seen (m2f-create-salutation) | M2 |
| F-14 | Contact Information | Other Phone | input | left, row 6 | not observed | seen (m2f-create-salutation) | M2 |
| F-15 | Contact Information | Mobile | input | left, row 7 | not observed | seen (m2f-create-salutation) | M2 |
| F-16 | Contact Information | Assistant | input | left, row 8 | not observed | seen (m2f-create-salutation) | M2 |
| F-17 | Contact Information | Lead Source | select | right, row 1 | not observed | seen (m2f-create-salutation) | M2 |
| F-18 | Contact Information | Last Name | input | right, row 2; required marker | not observed | seen (m2f-create-salutation) | M2 |
| F-19 | Contact Information | Vendor Name | input | right, row 3 | not observed | seen (m2f-create-salutation) | P2 |
| F-20 | Contact Information | Vendor lookup icon | icon button | right, row 3, input right edge | not observed | seen (m2f-create-salutation) | P2 |
| F-21 | Contact Information | Title | input | right, row 4 | not observed | seen (m2f-create-salutation) | M2 |
| F-22 | Contact Information | Department | input | right, row 5 | not observed | seen (m2f-create-salutation) | M2 |
| F-23 | Contact Information | Home Phone | input | right, row 6 | not observed | seen (m2f-create-salutation) | M2 |
| F-24 | Contact Information | Fax | input | right, row 7 | not observed | seen (m2f-create-salutation) | M2 |
| F-25 | Contact Information | Date of Birth | input | right, row 8 | not observed | seen (m2f-create-salutation) | M2 |
| F-26 | Contact Information | Asst Phone | input | right, row 9 | not observed | seen (m2f-create-salutation) | M2 |
| F-57 | Right edge | Client Script | tab | page, right edge | not observed | seen (m2f-create-salutation) | M11 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2f-create-salutation) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2f-create-salutation) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2f-create-salutation) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2f-create-salutation) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2f-create-salutation) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2f-create-salutation) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2f-create-salutation) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2f-create-salutation) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2f-create-salutation) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2f-create-salutation) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2f-create-salutation) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2f-create-salutation) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2f-create-salutation) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2f-create-salutation) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2f-create-salutation) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2f-create-salutation) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2f-create-salutation) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2f-create-salutation) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2f-create-salutation) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2f-create-salutation) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2f-create-salutation) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2f-create-salutation) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2f-create-salutation) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2f-create-salutation) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2f-create-salutation) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2f-create-salutation) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2f-create-salutation) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2f-create-salutation) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2f-create-salutation) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2f-create-salutation) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2f-create-salutation) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2f-create-salutation) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2f-create-salutation) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2f-create-salutation) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2f-create-salutation) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2f-create-salutation) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2f-create-salutation) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2f-create-salutation) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2f-create-salutation) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2f-create-salutation) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2f-create-salutation) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2f-create-salutation) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2f-create-salutation) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2f-create-salutation) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2f-create-salutation) | ? |
| SH-46 | Utility strip | Trash bin icon | icon button | far right, after Help | not observed | seen (m2f-create-salutation) | ? |


#### Control reconciliation
Ordinal numbers are one-based positions in this capture’s controls.json; no internal selectors are reproduced.
| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate wrapper or non-interactive text | 1, 2, 4, 13, 16, 19, 22, 25, 28, 30, 31, 34, 37, 51, 86, 99, 103, 104, 105, 107, 123, 124, 126, 129, 131, 132, 133, 135, 136, 140, 142, 144, 146, 148, 151, 152, 154, 155, 159, 161, 163, 165, 167, 169, 171 |
| SH-01 | 3 |
| Excluded: invisible or placeholder | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81, 90, 91, 93, 94, 96, 97, 100, 101, 106, 118, 119, 120, 121, 122, 139, 158, 173, 174, 175, 176, 192, 195, 199, 213, 216, 220, 222, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254 |
| SH-02 | 10 |
| SH-03 | 11 |
| SH-04 | 14 |
| SH-05 | 17 |
| SH-06 | 20 |
| SH-07 | 23 |
| SH-08 | 26 |
| SH-09 | 29 |
| SH-10 | 33 |
| SH-11 | 35 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41, 83 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 59, 60, 61 |
| SH-25 | 62, 63, 64 |
| Excluded: outside rail viewport | 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 255 |
| Excluded: resize hit area not separately painted | 82 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98 |
| SH-34 | 102 |
| Excluded: outside form viewport | 108, 110, 111, 112, 114, 116, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 193, 194, 196, 197, 198, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 214, 215, 217, 218, 219, 221, 223, 224, 225, 226, 227, 228 |
| F-01 | 109 |
| F-04 | 113 |
| F-03 | 115 |
| F-02 | 117 |
| F-05 | 125 |
| F-07 | 127 |
| F-06 | 128 |
| F-08 | 130 |
| F-09 | 134 |
| F-10 | 137 |
| F-11 | 138 |
| F-12 | 141 |
| F-13 | 143 |
| F-14 | 145 |
| F-15 | 147 |
| F-16 | 149 |
| F-17 | 150 |
| F-18 | 153 |
| F-19 | 156 |
| F-20 | 157 |
| F-21 | 160 |
| F-22 | 162 |
| F-23 | 164 |
| F-24 | 166 |
| F-25 | 168 |
| F-26 | 170 |
| Excluded: checkbox clipped outside form viewport | 172 |
| F-57 | 239 |
| SH-35 | 256 |
| SH-36 | 257 |
| SH-37 | 258 |
| SH-38 | 259 |
| SH-39 | 260 |
| SH-40 | 261 |
| SH-41 | 262 |
| SH-42 | 263 |
| SH-43 | 264 |
| SH-44 | 265 |
| SH-45 | 266 |

### Control inventory — m2f-create-country

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-01 | Header | Edit Page Layout | link | title strip, after title | not observed | seen (m2f-create-country) | M11 |
| F-02 | Header | Cancel | button | title strip, right group, first | not observed | seen (m2f-create-country) | M2 |
| F-03 | Header | Save and New | button | title strip, right group, second | not observed | seen (m2f-create-country) | M2 |
| F-04 | Header | Save | button | title strip, right group, third | not observed | seen (m2f-create-country) | M2 |
| F-29 | Contact Information | Secondary Email | input | right, row 12 | not observed | seen (m2f-create-country) | M2 |
| F-30 | Contact Information | Twitter | input | right, row 13; @ prefix | not observed | seen (m2f-create-country) | M2 |
| F-31 | Contact Information | Reporting To | input | right, row 14 | not observed | seen (m2f-create-country) | M2 |
| F-32 | Contact Information | Contact lookup icon | icon button | right, row 14, input right edge | not observed | seen (m2f-create-country) | M2 |
| F-33 | Address Information | Copy Address | button | section heading, right | not observed | seen (m2f-create-country) | M2 |
| F-34 | Mailing Address | Country / Region | select | left, row 1 | Opens searchable country list; no option selected | seen (m2f-create-country) | M2 |
| F-34.1 | Mailing Country / Region list | Search | input | popup, search above options | not observed | seen (m2f-create-country) | M2 |
| F-34.2 | Mailing Country / Region list | -None- | menu item | popup, option 1 | not observed | seen (m2f-create-country) | M2 |
| F-34.3 | Mailing Country / Region list | Afghanistan | menu item | popup, option 2 | not observed | seen (m2f-create-country) | M2 |
| F-34.4 | Mailing Country / Region list | Aland Islands | menu item | popup, option 3 | not observed | seen (m2f-create-country) | M2 |
| F-34.5 | Mailing Country / Region list | Albania | menu item | popup, option 4 | not observed | seen (m2f-create-country) | M2 |
| F-34.6 | Mailing Country / Region list | Algeria | menu item | popup, option 5 | not observed | seen (m2f-create-country) | M2 |
| F-34.7 | Mailing Country / Region list | American Samoa | menu item | popup, option 6 | not observed | seen (m2f-create-country) | M2 |
| F-34.8 | Mailing Country / Region list | Andorra | menu item | popup, option 7 | not observed | seen (m2f-create-country) | M2 |
| F-39 | Mailing Address | Zip / Postal Code | input | left, row 6 | not observed | seen (m2f-create-country) | M2 |
| F-40 | Mailing Address | Latitude | input | left, coordinates, left | not observed | seen (m2f-create-country) | M2 |
| F-41 | Mailing Address | Longitude | input | left, coordinates, right | not observed | seen (m2f-create-country) | M2 |
| F-44 | Other Address | Country / Region | select | right, row 1 | not observed | seen (m2f-create-country) | M2 |
| F-45 | Other Address | Flat / House No./ Building / Apartment Name | input | right, row 2 | not observed | seen (m2f-create-country) | M2 |
| F-46 | Other Address | Street Address | input | right, row 3 | not observed | seen (m2f-create-country) | M2 |
| F-47 | Other Address | City | input | right, row 4 | not observed | seen (m2f-create-country) | M2 |
| F-48 | Other Address | State / Province | select | right, row 5 | not observed | seen (m2f-create-country) | M2 |
| F-49 | Other Address | Zip / Postal Code | input | right, row 6 | not observed | seen (m2f-create-country) | M2 |
| F-50 | Other Address | Latitude | input | right, coordinates, left | not observed | seen (m2f-create-country) | M2 |
| F-51 | Other Address | Longitude | input | right, coordinates, right | not observed | seen (m2f-create-country) | M2 |
| F-57 | Right edge | Client Script | tab | page, right edge | not observed | seen (m2f-create-country) | M11 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2f-create-country) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2f-create-country) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2f-create-country) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2f-create-country) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2f-create-country) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2f-create-country) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2f-create-country) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2f-create-country) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2f-create-country) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2f-create-country) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2f-create-country) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2f-create-country) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2f-create-country) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2f-create-country) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2f-create-country) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2f-create-country) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2f-create-country) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2f-create-country) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2f-create-country) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2f-create-country) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2f-create-country) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2f-create-country) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2f-create-country) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2f-create-country) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2f-create-country) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2f-create-country) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2f-create-country) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2f-create-country) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2f-create-country) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2f-create-country) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2f-create-country) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2f-create-country) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2f-create-country) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2f-create-country) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2f-create-country) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2f-create-country) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2f-create-country) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2f-create-country) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2f-create-country) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2f-create-country) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2f-create-country) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2f-create-country) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2f-create-country) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2f-create-country) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2f-create-country) | ? |
| SH-46 | Utility strip | Trash bin icon | icon button | far right, after Help | not observed | seen (m2f-create-country) | ? |


#### Control reconciliation
Ordinal numbers are one-based positions in this capture’s controls.json; no internal selectors are reproduced.
| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate wrapper or non-interactive text | 1, 2, 4, 13, 16, 19, 22, 25, 28, 30, 31, 34, 37, 51, 86, 99, 103, 104, 105, 107, 123, 126, 171, 175, 177, 179, 180, 184, 186, 188, 190, 192, 193, 196, 197, 207, 209, 211, 213, 214, 217, 218, 275 |
| SH-01 | 3 |
| Excluded: invisible or placeholder | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81, 90, 91, 93, 94, 96, 97, 100, 101, 106, 118, 119, 120, 121, 122, 124, 125, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 183, 199, 202, 206, 220, 223, 227, 229, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261 |
| SH-02 | 10 |
| SH-03 | 11 |
| SH-04 | 14 |
| SH-05 | 17 |
| SH-06 | 20 |
| SH-07 | 23 |
| SH-08 | 26 |
| SH-09 | 29 |
| SH-10 | 33 |
| SH-11 | 35 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41, 83 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 59, 60, 61 |
| SH-25 | 62, 63, 64 |
| Excluded: outside rail viewport | 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 262 |
| Excluded: resize hit area not separately painted | 82 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98 |
| SH-34 | 102 |
| Excluded: outside form viewport | 108, 110, 111, 112, 114, 116, 173, 174, 205, 226, 228, 230, 231, 232, 233, 234, 235, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523 |
| F-01 | 109 |
| F-04 | 113 |
| F-03 | 115 |
| F-02 | 117 |
| Excluded: checkbox clipped outside form viewport | 172 |
| F-29 | 176 |
| F-30 | 178 |
| F-31 | 181 |
| F-32 | 182 |
| F-33 | 185 |
| F-34 | 187 |
| Excluded: covered by open country list | 189, 191, 194, 195 |
| F-39 | 198 |
| F-40 | 200, 201 |
| F-41 | 203, 204 |
| F-44 | 208 |
| F-45 | 210 |
| F-46 | 212 |
| F-47 | 215 |
| F-48 | 216 |
| F-49 | 219 |
| F-50 | 221, 222 |
| F-51 | 224, 225 |
| F-57 | 246 |
| SH-35 | 263 |
| SH-36 | 264 |
| SH-37 | 265 |
| SH-38 | 266 |
| SH-39 | 267 |
| SH-40 | 268 |
| SH-41 | 269 |
| SH-42 | 270 |
| SH-43 | 271 |
| SH-44 | 272 |
| SH-45 | 273 |
| F-34.1 | 274 |
| F-34.2 | 276 |
| F-34.3 | 277 |
| F-34.4 | 278 |
| F-34.5 | 279 |
| F-34.6 | 280 |
| F-34.7 | 281 |
| F-34.8 | 282 |
| Excluded: option outside popup viewport | 283, 284, 285 |

The Mailing Address fields covered by the popup are not counted as visible controls in this state. Their labels/positions remain accessible evidence; the corresponding Other Address fields are visible.

### Control inventory — m2f-create-account

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-01 | Header | Edit Page Layout | link | title strip, after title | not observed | seen (m2f-create-account) | M11 |
| F-02 | Header | Cancel | button | title strip, right group, first | not observed | seen (m2f-create-account) | M2 |
| F-03 | Header | Save and New | button | title strip, right group, second | not observed | seen (m2f-create-account) | M2 |
| F-04 | Header | Save | button | title strip, right group, third | not observed | seen (m2f-create-account) | M2 |
| F-05 | Contact Image | Contact image placeholder | icon button | Contact Image, only portrait | not observed | seen (m2f-create-account) | M6 |
| F-06 | Contact Information | Contact Owner | select | left, row 1 | not observed | seen (m2f-create-account) | M2 |
| F-07 | Contact Information | User lookup icon | icon button | left, row 1, input right edge | not observed | seen (m2f-create-account) | M2 |
| F-08 | Contact Information | Salutation | select | left, row 2, First Name prefix | not observed | seen (m2f-create-account) | M2 |
| F-09 | Contact Information | First Name | input | left, row 2, after prefix | not observed | seen (m2f-create-account) | M2 |
| F-10 | Contact Information | Account Name | input | left, row 3 | not observed | seen (m2f-create-account) | M2 |
| F-11 | Contact Information | Account lookup icon | icon button | left, row 3, input right edge | Lookup was requested; popup not painted in screenshot; safety stop | seen (m2f-create-account) | M3 |
| F-12 | Contact Information | Email | input | left, row 4 | not observed | seen (m2f-create-account) | M2 |
| F-13 | Contact Information | Phone | input | left, row 5 | not observed | seen (m2f-create-account) | M2 |
| F-14 | Contact Information | Other Phone | input | left, row 6 | not observed | seen (m2f-create-account) | M2 |
| F-15 | Contact Information | Mobile | input | left, row 7 | not observed | seen (m2f-create-account) | M2 |
| F-16 | Contact Information | Assistant | input | left, row 8 | not observed | seen (m2f-create-account) | M2 |
| F-17 | Contact Information | Lead Source | select | right, row 1 | not observed | seen (m2f-create-account) | M2 |
| F-18 | Contact Information | Last Name | input | right, row 2; required marker | not observed | seen (m2f-create-account) | M2 |
| F-19 | Contact Information | Vendor Name | input | right, row 3 | not observed | seen (m2f-create-account) | P2 |
| F-20 | Contact Information | Vendor lookup icon | icon button | right, row 3, input right edge | not observed | seen (m2f-create-account) | P2 |
| F-21 | Contact Information | Title | input | right, row 4 | not observed | seen (m2f-create-account) | M2 |
| F-22 | Contact Information | Department | input | right, row 5 | not observed | seen (m2f-create-account) | M2 |
| F-23 | Contact Information | Home Phone | input | right, row 6 | not observed | seen (m2f-create-account) | M2 |
| F-24 | Contact Information | Fax | input | right, row 7 | not observed | seen (m2f-create-account) | M2 |
| F-25 | Contact Information | Date of Birth | input | right, row 8 | not observed | seen (m2f-create-account) | M2 |
| F-26 | Contact Information | Asst Phone | input | right, row 9 | not observed | seen (m2f-create-account) | M2 |
| F-57 | Right edge | Client Script | tab | page, right edge | not observed | seen (m2f-create-account) | M11 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2f-create-account) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2f-create-account) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2f-create-account) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2f-create-account) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2f-create-account) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2f-create-account) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2f-create-account) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2f-create-account) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2f-create-account) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2f-create-account) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2f-create-account) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2f-create-account) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2f-create-account) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2f-create-account) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2f-create-account) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2f-create-account) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2f-create-account) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2f-create-account) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2f-create-account) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2f-create-account) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2f-create-account) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2f-create-account) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2f-create-account) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2f-create-account) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2f-create-account) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2f-create-account) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2f-create-account) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2f-create-account) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2f-create-account) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2f-create-account) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2f-create-account) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2f-create-account) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2f-create-account) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2f-create-account) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2f-create-account) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2f-create-account) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2f-create-account) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2f-create-account) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2f-create-account) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2f-create-account) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2f-create-account) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2f-create-account) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2f-create-account) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2f-create-account) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2f-create-account) | ? |
| SH-46 | Utility strip | Trash bin icon | icon button | far right, after Help | not observed | seen (m2f-create-account) | ? |


#### Control reconciliation
Ordinal numbers are one-based positions in this capture’s controls.json; no internal selectors are reproduced.
| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate wrapper or non-interactive text | 1, 2, 4, 13, 16, 19, 22, 25, 28, 30, 31, 34, 37, 51, 86, 99, 103, 104, 105, 107, 123, 124, 126, 129, 131, 132, 133, 135, 136, 140, 142, 144, 146, 148, 151, 152, 154, 155, 159, 161, 163, 165, 167, 169, 171 |
| SH-01 | 3 |
| Excluded: invisible or placeholder | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81, 90, 91, 93, 94, 96, 97, 100, 101, 106, 118, 119, 120, 121, 122, 139, 158, 173, 174, 175, 176, 192, 195, 199, 213, 216, 220, 222, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 270, 271, 272, 273, 274, 275, 276, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304 |
| SH-02 | 10 |
| SH-03 | 11 |
| SH-04 | 14 |
| SH-05 | 17 |
| SH-06 | 20 |
| SH-07 | 23 |
| SH-08 | 26 |
| SH-09 | 29 |
| SH-10 | 33 |
| SH-11 | 35 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41, 83 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 59, 60, 61 |
| SH-25 | 62, 63, 64 |
| Excluded: outside rail viewport | 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 257 |
| Excluded: resize hit area not separately painted | 82 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98 |
| SH-34 | 102 |
| Excluded: outside form viewport | 108, 110, 111, 112, 114, 116, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 193, 194, 196, 197, 198, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 214, 215, 217, 218, 219, 221, 223, 224, 225, 226, 227, 228 |
| F-01 | 109 |
| F-04 | 113 |
| F-03 | 115 |
| F-02 | 117 |
| F-05 | 125 |
| F-07 | 127 |
| F-06 | 128 |
| F-08 | 130 |
| F-09 | 134 |
| F-10 | 137 |
| F-11 | 138 |
| F-12 | 141 |
| F-13 | 143 |
| F-14 | 145 |
| F-15 | 147 |
| F-16 | 149 |
| F-17 | 150 |
| F-18 | 153 |
| F-19 | 156 |
| F-20 | 157 |
| F-21 | 160 |
| F-22 | 162 |
| F-23 | 164 |
| F-24 | 166 |
| F-25 | 168 |
| F-26 | 170 |
| Excluded: checkbox clipped outside form viewport | 172 |
| F-57 | 241 |
| SH-35 | 258 |
| SH-36 | 259 |
| SH-37 | 260 |
| SH-38 | 261 |
| SH-39 | 262 |
| SH-40 | 263 |
| SH-41 | 264 |
| SH-42 | 265 |
| SH-43 | 266 |
| SH-44 | 267 |
| SH-45 | 268 |
| Excluded: lookup content not painted | 269, 277, 293, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407 |

The capture includes lookup-related accessibility/table entries, but the screenshot paints no lookup window. Those entries are excluded rather than described as visible popup controls. A thin, unlabelled strip at the top is not counted as an operable control.

### Control inventory — m2f-list-after

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L-01 | View strip | All Contacts | tab | left, first | not observed | seen (m2f-list-after) | M2 |
| L-02 | View strip | Three dots icon | icon button | after current view tab | not observed | seen (m2f-list-after) | M2 |
| L-03 | Toolbar | Filter | button | left group, first | not observed | seen (m2f-list-after) | M2 |
| L-04 | Toolbar | Sort | button | left group, second | not observed | seen (m2f-list-after) | M2 |
| L-05 | Toolbar | List view icon | icon button | view group, first | not observed | seen (m2f-list-after) | M2 |
| L-06 | Toolbar | Kanban view icon | icon button | view group, second | not observed | seen (m2f-list-after) | M2 |
| L-07 | Toolbar | Sheet view icon | icon button | view group, third | not observed | seen (m2f-list-after) | M2 |
| L-08 | Toolbar | Chart view icon | icon button | view group, fourth | not observed | seen (m2f-list-after) | M2 |
| L-09 | Toolbar | Timeline view icon | icon button | view group, fifth | not observed | seen (m2f-list-after) | M2 |
| L-10 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | not observed | seen (m2f-list-after) | M2 |
| L-11 | Toolbar | Down chevron | icon button | view group, seventh | not observed | seen (m2f-list-after) | M2 |
| L-12 | Toolbar | Create Contact | button | right group, first | not observed | seen (m2f-list-after) | M2 |
| L-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Contact | not observed | seen (m2f-list-after) | M6 |
| L-14 | Toolbar | Three dots / Actions | icon button | right group, far right | not observed | seen (m2f-list-after) | M2 |
| L-15 | Filter panel | Search | input | below Filter Contacts by heading | not observed | seen (m2f-list-after) | M2 |
| L-16 | Filter panel | System Defined Filters | toggle | first section heading | not observed | seen (m2f-list-after) | M2 |
| L-17 | Filter panel | Activities | checkbox | system-defined section, Activities | not observed | seen (m2f-list-after) | M5 |
| L-18 | Filter panel | Campaigns | checkbox | system-defined section, Campaigns | not observed | seen (m2f-list-after) | M7 |
| L-19 | Filter panel | Latest Email Status | checkbox | system-defined section, Latest Email Status | not observed | seen (m2f-list-after) | M10 |
| L-20 | Filter panel | Locked | checkbox | system-defined section, Locked | not observed | seen (m2f-list-after) | M2 |
| L-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | not observed | seen (m2f-list-after) | M2 |
| L-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | not observed | seen (m2f-list-after) | M2 |
| L-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | not observed | seen (m2f-list-after) | M2 |
| L-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | not observed | seen (m2f-list-after) | M2 |
| L-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | not observed | seen (m2f-list-after) | P3 |
| L-26 | Filter panel | Filter By Fields | toggle | second section heading | not observed | seen (m2f-list-after) | M2 |
| L-27 | Filter panel | Account Name | checkbox | field section, Account Name | not observed | seen (m2f-list-after) | M3 |
| L-28 | Filter panel | Assistant | checkbox | field section, Assistant | not observed | seen (m2f-list-after) | M2 |
| L-29 | Filter panel | Asst Phone | checkbox | field section, Asst Phone | not observed | seen (m2f-list-after) | M2 |
| L-30 | Filter panel | Connected To | checkbox | field section, Connected To | not observed | seen (m2f-list-after) | M2 |
| L-31 | Filter panel | Contact Name | checkbox | field section, Contact Name | not observed | seen (m2f-list-after) | M2 |
| L-32 | Filter panel | Contact Owner (partly clipped) | checkbox | field section, Contact Owner (partly clipped) | not observed | seen (m2f-list-after) | M2 |
| L-33 | Table | Sliders icon | icon button | header, far right overlay | not observed | seen (m2f-list-after) | M11 |
| L-34 | Table | Select all checkbox | checkbox | header, before activity column | not observed | seen (m2f-list-after) | M2 |
| L-35 | Table | Contact Name | column header | first text column | not observed | seen (m2f-list-after) | M2 |
| L-36 | Table | All with down arrow | select | within Contact Name header, right | not observed | seen (m2f-list-after) | M2 |
| L-37 | Table | Account Name | column header | second text column | not observed | seen (m2f-list-after) | M3 |
| L-38 | Table | Email | column header | third text column | not observed | seen (m2f-list-after) | M2 |
| L-39 | Table | Phone (partly clipped) | column header | fourth text column, right edge | not observed | seen (m2f-list-after) | M2 |
| L-40 | Table | Record selection checkbox | checkbox | each visible row, before activity column | not observed | seen (m2f-list-after) | M2 |
| L-41 | Table | Call activity flag | badge | rows with activity, before Contact Name | not observed | seen (m2f-list-after) | M5 |
| L-42 | Table | Contact record link | link | Contact Name cells | not observed | seen (m2f-list-after) | M2 |
| L-43 | Table | Account record link | link | Account Name cells | not observed | seen (m2f-list-after) | M3 |
| L-44 | Table | Email address link | link | Email cells | not observed | seen (m2f-list-after) | M10 |
| L-48 | List footer | Total Records | badge | left | not observed | seen (m2f-list-after) | M2 |
| L-49 | List footer | Displayed record range | badge | right group, between arrows | not observed | seen (m2f-list-after) | M2 |
| L-50 | List footer | Previous | icon button | right group, before range | not observed | seen (m2f-list-after) | M2 |
| L-51 | List footer | Next | icon button | right group, after range | not observed | seen (m2f-list-after) | M2 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2f-list-after) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2f-list-after) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2f-list-after) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2f-list-after) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2f-list-after) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2f-list-after) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2f-list-after) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2f-list-after) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2f-list-after) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2f-list-after) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2f-list-after) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2f-list-after) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2f-list-after) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2f-list-after) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2f-list-after) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2f-list-after) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2f-list-after) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2f-list-after) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2f-list-after) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2f-list-after) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2f-list-after) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2f-list-after) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2f-list-after) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2f-list-after) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2f-list-after) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2f-list-after) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2f-list-after) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2f-list-after) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2f-list-after) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2f-list-after) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2f-list-after) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2f-list-after) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2f-list-after) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2f-list-after) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2f-list-after) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2f-list-after) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2f-list-after) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2f-list-after) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2f-list-after) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2f-list-after) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2f-list-after) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2f-list-after) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2f-list-after) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2f-list-after) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2f-list-after) | ? |
| SH-46 | Utility strip | Trash bin icon | icon button | far right, after Help | not observed | seen (m2f-list-after) | ? |


#### Control reconciliation
Ordinal numbers are one-based positions in this capture’s controls.json; no internal selectors are reproduced.
| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 65, 66, 67, 68, 83, 87, 111, 116, 119, 127, 128, 135, 137, 140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 166, 168, 170, 172, 173, 174, 283, 284, 288, 289, 292, 293, 295, 296, 687 |
| Excluded: invisible or outside captured viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 84, 91, 92, 94, 95, 97, 98, 101, 102, 107, 108, 109, 110, 134, 138, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 286, 287, 303, 304, 320, 321, 335, 336, 350, 351, 366, 367, 381, 382, 397, 398, 412, 413, 427, 428, 442, 443, 458, 459, 474, 475, 489, 490, 505, 506, 520, 521, 526, 533, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660, 661, 662, 663, 664, 665, 666, 667, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686, 699 |
| Excluded: record data or table structure | 290, 291, 305, 306, 307, 308, 311, 313, 315, 317, 319, 322, 323, 324, 327, 328, 330, 332, 334, 337, 338, 339, 342, 343, 345, 347, 349, 352, 353, 354, 357, 359, 361, 363, 365, 368, 369, 370, 373, 374, 376, 378, 380, 383, 384, 385, 388, 390, 392, 394, 396, 399, 400, 401, 404, 406, 408, 410, 411, 414, 415, 416, 419, 420, 422, 424, 426, 429, 430, 431, 434, 436, 438, 440, 441, 444, 445, 446, 449, 451, 453, 455, 457, 460, 461, 462, 465, 467, 469, 471, 473, 476, 477, 478, 481, 482, 484, 486, 488, 491, 492, 493, 496, 498, 500, 502, 504, 507, 508, 509, 512, 513, 515, 517, 519, 522, 523, 524, 527, 528, 530, 532, 534 |
| Excluded: target not painted in screenshot | 129 |
| L-01 | 112 |
| L-02 | 113, 114, 115 |
| L-03 | 117 |
| L-04 | 118 |
| L-05 | 120 |
| L-06 | 121 |
| L-07 | 122 |
| L-08 | 123 |
| L-09 | 124 |
| L-10 | 125 |
| L-11 | 126 |
| L-12 | 130 |
| L-13 | 131, 132 |
| L-14 | 133 |
| L-15 | 136 |
| L-16 | 139 |
| L-17 | 141 |
| L-18 | 143 |
| L-19 | 145 |
| L-20 | 147 |
| L-21 | 149 |
| L-22 | 151 |
| L-23 | 153 |
| L-24 | 155 |
| L-25 | 157 |
| L-26 | 159 |
| L-27 | 161 |
| L-28 | 163 |
| L-29 | 165 |
| L-30 | 167 |
| L-31 | 169 |
| L-32 | 171 |
| L-33 | 285 |
| L-34 | 294 |
| L-35 | 297 |
| L-36 | 298, 299 |
| L-37 | 300 |
| L-38 | 301 |
| L-39 | 302 |
| L-40 | 309, 310, 325, 326, 340, 341, 355, 356, 371, 372, 386, 387, 402, 403, 417, 418, 432, 433, 447, 448, 463, 464, 479, 480, 494, 495, 510, 511, 525 |
| L-41 | 312, 358, 389, 405, 435, 450, 466, 497 |
| L-42 | 314, 329, 344, 360, 375, 391, 407, 421, 437, 452, 468, 483, 499, 514, 529 |
| L-43 | 316, 331, 346, 362, 377, 393, 409, 423, 439, 454, 470, 485, 501, 516, 531 |
| L-44 | 318, 333, 348, 364, 379, 395, 425, 456, 472, 487, 503, 518 |
| L-48 | 668 |
| L-49 | 669 |
| L-50 | 670 |
| L-51 | 671 |
| SH-01 | 2, 3, 4 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29, 30, 31 |
| SH-10 | 33 |
| SH-11 | 34 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 60, 61 |
| SH-25 | 63, 64 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99, 100 |
| SH-34 | 103, 104, 105, 106 |
| SH-35 | 688 |
| SH-36 | 689 |
| SH-37 | 690 |
| SH-38 | 691 |
| SH-39 | 692 |
| SH-40 | 693 |
| SH-41 | 694 |
| SH-42 | 695 |
| SH-43 | 696 |
| SH-44 | 697 |
| SH-45 | 698 |
| Excluded: resize hit area not separately painted | 82 |

Screenshot-only control: SH-46 (far-right trash icon), already numbered in contacts.md. It is present in this inventory without a controls.json ordinal.


### Control inventory — m2f2-list-base

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L-01 | View strip | All Contacts | tab | left, first | not observed | seen (m2f2-list-base) | M2 |
| L-02 | View strip | Three dots icon | icon button | after current view tab | not observed | seen (m2f2-list-base) | M2 |
| L-03 | Toolbar | Filter | button | left group, first | not observed | seen (m2f2-list-base) | M2 |
| L-04 | Toolbar | Sort | button | left group, second | not observed | seen (m2f2-list-base) | M2 |
| L-05 | Toolbar | List view icon | icon button | view group, first | not observed | seen (m2f2-list-base) | M2 |
| L-06 | Toolbar | Kanban view icon | icon button | view group, second | not observed | seen (m2f2-list-base) | M2 |
| L-07 | Toolbar | Sheet view icon | icon button | view group, third | not observed | seen (m2f2-list-base) | M2 |
| L-08 | Toolbar | Chart view icon | icon button | view group, fourth | not observed | seen (m2f2-list-base) | M2 |
| L-09 | Toolbar | Timeline view icon | icon button | view group, fifth | not observed | seen (m2f2-list-base) | M2 |
| L-10 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | not observed | seen (m2f2-list-base) | M2 |
| L-11 | Toolbar | Down chevron | icon button | view group, seventh | not observed | seen (m2f2-list-base) | M2 |
| L-12 | Toolbar | Create Contact | button | right group, first | not observed | seen (m2f2-list-base) | M2 |
| L-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Contact | not observed | seen (m2f2-list-base) | M6 |
| L-14 | Toolbar | Three dots / Actions | icon button | right group, far right | not observed | seen (m2f2-list-base) | M2 |
| L-15 | Filter panel | Search | input | below Filter Contacts by heading | not observed | seen (m2f2-list-base) | M2 |
| L-16 | Filter panel | System Defined Filters | toggle | first section heading | not observed | seen (m2f2-list-base) | M2 |
| L-17 | Filter panel | Activities | checkbox | system-defined section, Activities | not observed | seen (m2f2-list-base) | M5 |
| L-18 | Filter panel | Campaigns | checkbox | system-defined section, Campaigns | not observed | seen (m2f2-list-base) | M7 |
| L-19 | Filter panel | Latest Email Status | checkbox | system-defined section, Latest Email Status | not observed | seen (m2f2-list-base) | M10 |
| L-20 | Filter panel | Locked | checkbox | system-defined section, Locked | not observed | seen (m2f2-list-base) | M2 |
| L-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | not observed | seen (m2f2-list-base) | M2 |
| L-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | not observed | seen (m2f2-list-base) | M2 |
| L-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | not observed | seen (m2f2-list-base) | M2 |
| L-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | not observed | seen (m2f2-list-base) | M2 |
| L-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | not observed | seen (m2f2-list-base) | P3 |
| L-26 | Filter panel | Filter By Fields | toggle | second section heading | not observed | seen (m2f2-list-base) | M2 |
| L-27 | Filter panel | Account Name | checkbox | field section, Account Name | not observed | seen (m2f2-list-base) | M3 |
| L-28 | Filter panel | Assistant | checkbox | field section, Assistant | not observed | seen (m2f2-list-base) | M2 |
| L-29 | Filter panel | Asst Phone | checkbox | field section, Asst Phone | not observed | seen (m2f2-list-base) | M2 |
| L-30 | Filter panel | Connected To | checkbox | field section, Connected To | not observed | seen (m2f2-list-base) | M2 |
| L-31 | Filter panel | Contact Name | checkbox | field section, Contact Name | not observed | seen (m2f2-list-base) | M2 |
| L-32 | Filter panel | Contact Owner (partly clipped) | checkbox | field section, Contact Owner (partly clipped) | not observed | seen (m2f2-list-base) | M2 |
| L-33 | Table | Sliders icon | icon button | header, far right overlay | not observed | seen (m2f2-list-base) | M11 |
| L-34 | Table | Select all checkbox | checkbox | header, before activity column | not observed | seen (m2f2-list-base) | M2 |
| L-35 | Table | Contact Name | column header | first text column | not observed | seen (m2f2-list-base) | M2 |
| L-36 | Table | All with down arrow | select | within Contact Name header, right | not observed | seen (m2f2-list-base) | M2 |
| L-37 | Table | Account Name | column header | second text column | not observed | seen (m2f2-list-base) | M3 |
| L-38 | Table | Email | column header | third text column | not observed | seen (m2f2-list-base) | M2 |
| L-39 | Table | Phone (partly clipped) | column header | fourth text column, right edge | not observed | seen (m2f2-list-base) | M2 |
| L-40 | Table | Record selection checkbox | checkbox | each visible row, before activity column | not observed | seen (m2f2-list-base) | M2 |
| L-41 | Table | Call activity flag | badge | rows with activity, before Contact Name | not observed | seen (m2f2-list-base) | M5 |
| L-42 | Table | Contact record link | link | Contact Name cells | not observed | seen (m2f2-list-base) | M2 |
| L-43 | Table | Account record link | link | Account Name cells | not observed | seen (m2f2-list-base) | M3 |
| L-44 | Table | Email address link | link | Email cells | not observed | seen (m2f2-list-base) | M10 |
| L-48 | List footer | Total Records | badge | left | not observed | seen (m2f2-list-base) | M2 |
| L-49 | List footer | Displayed record range | badge | right group, between arrows | not observed | seen (m2f2-list-base) | M2 |
| L-50 | List footer | Previous | icon button | right group, before range | not observed | seen (m2f2-list-base) | M2 |
| L-51 | List footer | Next | icon button | right group, after range | not observed | seen (m2f2-list-base) | M2 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2f2-list-base) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2f2-list-base) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2f2-list-base) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2f2-list-base) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2f2-list-base) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2f2-list-base) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2f2-list-base) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2f2-list-base) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2f2-list-base) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2f2-list-base) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2f2-list-base) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2f2-list-base) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2f2-list-base) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2f2-list-base) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2f2-list-base) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2f2-list-base) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2f2-list-base) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2f2-list-base) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2f2-list-base) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2f2-list-base) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2f2-list-base) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2f2-list-base) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2f2-list-base) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2f2-list-base) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2f2-list-base) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2f2-list-base) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2f2-list-base) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2f2-list-base) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2f2-list-base) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2f2-list-base) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2f2-list-base) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2f2-list-base) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2f2-list-base) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2f2-list-base) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2f2-list-base) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2f2-list-base) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2f2-list-base) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2f2-list-base) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2f2-list-base) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2f2-list-base) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2f2-list-base) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2f2-list-base) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2f2-list-base) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2f2-list-base) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2f2-list-base) | ? |
| SH-46 | Utility strip | Trash bin icon | icon button | far right, after Help | not observed | seen (m2f2-list-base) | ? |

#### Control reconciliation

Ordinal numbers are one-based positions in this capture’s controls.json; no internal selectors are reproduced.

| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 65, 66, 67, 68, 83, 87, 111, 116, 119, 127, 128, 135, 137, 140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 166, 168, 170, 172, 173, 174, 283, 284, 288, 289, 292, 293, 295, 296 |
| Excluded: invisible or outside captured viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 84, 91, 92, 94, 95, 97, 98, 101, 102, 107, 108, 109, 110, 134, 138, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 286, 287, 303, 304, 320, 321, 335, 336, 350, 351, 366, 367, 381, 382, 397, 398, 412, 413, 427, 428, 442, 443, 458, 459, 474, 475, 489, 490, 505, 506, 520, 521, 526, 533, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660, 661, 662, 663, 664, 665, 666, 667, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686 |
| Excluded: record data or table structure | 290, 291, 305, 306, 307, 308, 311, 313, 315, 317, 319, 322, 323, 324, 327, 328, 330, 332, 334, 337, 338, 339, 342, 343, 345, 347, 349, 352, 353, 354, 357, 359, 361, 363, 365, 368, 369, 370, 373, 374, 376, 378, 380, 383, 384, 385, 388, 390, 392, 394, 396, 399, 400, 401, 404, 406, 408, 410, 411, 414, 415, 416, 419, 420, 422, 424, 426, 429, 430, 431, 434, 436, 438, 440, 441, 444, 445, 446, 449, 451, 453, 455, 457, 460, 461, 462, 465, 467, 469, 471, 473, 476, 477, 478, 481, 482, 484, 486, 488, 491, 492, 493, 496, 498, 500, 502, 504, 507, 508, 509, 512, 513, 515, 517, 519, 522, 523, 524, 527, 528, 530, 532, 534 |
| Excluded: target not painted in screenshot | 129 |
| L-01 | 112 |
| L-02 | 113, 114, 115 |
| L-03 | 117 |
| L-04 | 118 |
| L-05 | 120 |
| L-06 | 121 |
| L-07 | 122 |
| L-08 | 123 |
| L-09 | 124 |
| L-10 | 125 |
| L-11 | 126 |
| L-12 | 130 |
| L-13 | 131, 132 |
| L-14 | 133 |
| L-15 | 136 |
| L-16 | 139 |
| L-17 | 141 |
| L-18 | 143 |
| L-19 | 145 |
| L-20 | 147 |
| L-21 | 149 |
| L-22 | 151 |
| L-23 | 153 |
| L-24 | 155 |
| L-25 | 157 |
| L-26 | 159 |
| L-27 | 161 |
| L-28 | 163 |
| L-29 | 165 |
| L-30 | 167 |
| L-31 | 169 |
| L-32 | 171 |
| L-33 | 285 |
| L-34 | 294 |
| L-35 | 297 |
| L-36 | 298, 299 |
| L-37 | 300 |
| L-38 | 301 |
| L-39 | 302 |
| L-40 | 309, 310, 325, 326, 340, 341, 355, 356, 371, 372, 386, 387, 402, 403, 417, 418, 432, 433, 447, 448, 463, 464, 479, 480, 494, 495, 510, 511, 525 |
| L-41 | 312, 358, 389, 405, 435, 450, 466, 497 |
| L-42 | 314, 329, 344, 360, 375, 391, 407, 421, 437, 452, 468, 483, 499, 514, 529 |
| L-43 | 316, 331, 346, 362, 377, 393, 409, 423, 439, 454, 470, 485, 501, 516, 531 |
| L-44 | 318, 333, 348, 364, 379, 395, 425, 456, 472, 487, 503, 518 |
| L-48 | 668 |
| L-49 | 669 |
| L-50 | 670 |
| L-51 | 671 |
| SH-01 | 2, 3, 4 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29, 30, 31 |
| SH-10 | 33 |
| SH-11 | 34 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 60, 61 |
| SH-25 | 63, 64 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99, 100 |
| SH-34 | 103, 104, 105, 106 |
| Excluded: resize hit area not separately painted | 82 |
| Excluded: invisible utility container | 687 |
| Excluded: duplicate utility-strip wrapper | 688 |
| SH-35 | 689 |
| SH-36 | 690 |
| SH-37 | 691 |
| SH-38 | 692 |
| SH-39 | 693 |
| SH-40 | 694 |
| SH-41 | 695 |
| SH-42 | 696 |
| SH-43 | 697 |
| SH-44 | 698 |
| SH-45 | 699 |

Screenshot-only control: SH-46 (far-right trash icon). No new visible shell control or unnumbered icon was found.

### Control inventory — m2f2-create-reporting

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-01 | Header | Edit Page Layout | link | title strip, after title | not observed | seen (m2f2-create-reporting) | M11 |
| F-02 | Header | Cancel | button | title strip, right group, first | not observed | seen (m2f2-create-reporting) | M2 |
| F-03 | Header | Save and New | button | title strip, right group, second | not observed | seen (m2f2-create-reporting) | M2 |
| F-04 | Header | Save | button | title strip, right group, third | not observed | seen (m2f2-create-reporting) | M2 |
| F-05 | Contact Image | Contact image placeholder | icon button | Contact Image, only portrait | not observed | seen (m2f2-create-reporting) | M6 |
| F-06 | Contact Information | Contact Owner | select | left, row 1 | not observed | seen (m2f2-create-reporting) | M2 |
| F-07 | Contact Information | User lookup icon | icon button | left, row 1, input right edge | not observed | seen (m2f2-create-reporting) | M2 |
| F-08 | Contact Information | Salutation | select | left, row 2, First Name prefix | not observed | seen (m2f2-create-reporting) | M2 |
| F-09 | Contact Information | First Name | input | left, row 2, after prefix | not observed | seen (m2f2-create-reporting) | M2 |
| F-10 | Contact Information | Account Name | input | left, row 3 | not observed | seen (m2f2-create-reporting) | M2 |
| F-11 | Contact Information | Account lookup icon | icon button | left, row 3, input right edge | not observed | seen (m2f2-create-reporting) | M3 |
| F-12 | Contact Information | Email | input | left, row 4 | not observed | seen (m2f2-create-reporting) | M2 |
| F-13 | Contact Information | Phone | input | left, row 5 | not observed | seen (m2f2-create-reporting) | M2 |
| F-14 | Contact Information | Other Phone | input | left, row 6 | not observed | seen (m2f2-create-reporting) | M2 |
| F-15 | Contact Information | Mobile | input | left, row 7 | not observed | seen (m2f2-create-reporting) | M2 |
| F-16 | Contact Information | Assistant | input | left, row 8 | not observed | seen (m2f2-create-reporting) | M2 |
| F-17 | Contact Information | Lead Source | select | right, row 1 | not observed | seen (m2f2-create-reporting) | M2 |
| F-18 | Contact Information | Last Name | input | right, row 2; required marker | not observed | seen (m2f2-create-reporting) | M2 |
| F-19 | Contact Information | Vendor Name | input | right, row 3 | not observed | seen (m2f2-create-reporting) | P2 |
| F-20 | Contact Information | Vendor lookup icon | icon button | right, row 3, input right edge | not observed | seen (m2f2-create-reporting) | P2 |
| F-21 | Contact Information | Title | input | right, row 4 | not observed | seen (m2f2-create-reporting) | M2 |
| F-22 | Contact Information | Department | input | right, row 5 | not observed | seen (m2f2-create-reporting) | M2 |
| F-23 | Contact Information | Home Phone | input | right, row 6 | not observed | seen (m2f2-create-reporting) | M2 |
| F-24 | Contact Information | Fax | input | right, row 7 | not observed | seen (m2f2-create-reporting) | M2 |
| F-25 | Contact Information | Date of Birth | input | right, row 8 | not observed | seen (m2f2-create-reporting) | M2 |
| F-26 | Contact Information | Asst Phone | input | right, row 9 | not observed | seen (m2f2-create-reporting) | M2 |
| F-57 | Right edge | Client Script | tab | page, right edge | not observed | seen (m2f2-create-reporting) | M11 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2f2-create-reporting) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2f2-create-reporting) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2f2-create-reporting) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2f2-create-reporting) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2f2-create-reporting) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2f2-create-reporting) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2f2-create-reporting) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2f2-create-reporting) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2f2-create-reporting) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2f2-create-reporting) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2f2-create-reporting) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2f2-create-reporting) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2f2-create-reporting) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2f2-create-reporting) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2f2-create-reporting) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2f2-create-reporting) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2f2-create-reporting) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2f2-create-reporting) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2f2-create-reporting) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2f2-create-reporting) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2f2-create-reporting) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2f2-create-reporting) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2f2-create-reporting) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2f2-create-reporting) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2f2-create-reporting) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2f2-create-reporting) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2f2-create-reporting) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2f2-create-reporting) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2f2-create-reporting) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2f2-create-reporting) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2f2-create-reporting) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2f2-create-reporting) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2f2-create-reporting) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2f2-create-reporting) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2f2-create-reporting) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2f2-create-reporting) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2f2-create-reporting) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2f2-create-reporting) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2f2-create-reporting) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2f2-create-reporting) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2f2-create-reporting) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2f2-create-reporting) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2f2-create-reporting) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2f2-create-reporting) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2f2-create-reporting) | ? |
| SH-46 | Utility strip | Trash bin icon | icon button | far right, after Help | not observed | seen (m2f2-create-reporting) | ? |

#### Control reconciliation

Ordinal numbers are one-based positions in this capture’s controls.json; no internal selectors are reproduced.

| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate wrapper or non-interactive text | 1, 2, 4, 13, 16, 19, 22, 25, 28, 30, 31, 34, 37, 51, 86, 99, 103, 104, 105, 107, 123, 124, 126, 129, 131, 132, 133, 135, 136, 140, 142, 144, 146, 148, 151, 152, 154, 155, 159, 161, 163, 165, 167, 169, 171 |
| SH-01 | 3 |
| Excluded: invisible or placeholder | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81, 90, 91, 93, 94, 96, 97, 100, 101, 106, 118, 119, 120, 121, 122, 139, 158, 173, 174, 175, 176, 192, 195, 199, 213, 216, 220, 222, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254 |
| SH-02 | 10 |
| SH-03 | 11 |
| SH-04 | 14 |
| SH-05 | 17 |
| SH-06 | 20 |
| SH-07 | 23 |
| SH-08 | 26 |
| SH-09 | 29 |
| SH-10 | 33 |
| SH-11 | 35 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41, 83 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 59, 60, 61 |
| SH-25 | 62, 63, 64 |
| Excluded: outside rail viewport | 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80 |
| Excluded: resize hit area not separately painted | 82 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98 |
| SH-34 | 102 |
| Excluded: outside form viewport | 108, 110, 111, 112, 114, 116, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 193, 194, 196, 197, 198, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 214, 215, 217, 218, 219, 221, 223, 224, 225, 226, 227, 228 |
| F-01 | 109 |
| F-04 | 113 |
| F-03 | 115 |
| F-02 | 117 |
| F-05 | 125 |
| F-07 | 127 |
| F-06 | 128 |
| F-08 | 130 |
| F-09 | 134 |
| F-10 | 137 |
| F-11 | 138 |
| F-12 | 141 |
| F-13 | 143 |
| F-14 | 145 |
| F-15 | 147 |
| F-16 | 149 |
| F-17 | 150 |
| F-18 | 153 |
| F-19 | 156 |
| F-20 | 157 |
| F-21 | 160 |
| F-22 | 162 |
| F-23 | 164 |
| F-24 | 166 |
| F-25 | 168 |
| F-26 | 170 |
| Excluded: checkbox clipped outside form viewport | 172 |
| F-57 | 239 |
| Excluded: duplicate utility-strip wrapper | 255 |
| SH-35 | 256 |
| SH-36 | 257 |
| SH-37 | 258 |
| SH-38 | 259 |
| SH-39 | 260 |
| SH-40 | 261 |
| SH-41 | 262 |
| SH-42 | 263 |
| SH-43 | 264 |
| SH-44 | 265 |
| SH-45 | 266 |

Screenshot-only control: SH-46 (far-right trash icon). No new visible shell control or unnumbered icon was found.

The requested Reporting To selector was verified against the earlier country capture as one lookup icon. The current tool found zero matching elements and skipped it; no alternative selector or navigation was used. The screenshot remains at the upper create viewport. The owner lookup has a focus outline in the screenshot, but no owner-opening click was requested or executed; the origin of this outline is not established. Reporting To and owner popup contents are not observed.

### Control inventory — m2f2-list-after

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L-01 | View strip | All Contacts | tab | left, first | not observed | seen (m2f2-list-after) | M2 |
| L-02 | View strip | Three dots icon | icon button | after current view tab | not observed | seen (m2f2-list-after) | M2 |
| L-03 | Toolbar | Filter | button | left group, first | not observed | seen (m2f2-list-after) | M2 |
| L-04 | Toolbar | Sort | button | left group, second | not observed | seen (m2f2-list-after) | M2 |
| L-05 | Toolbar | List view icon | icon button | view group, first | not observed | seen (m2f2-list-after) | M2 |
| L-06 | Toolbar | Kanban view icon | icon button | view group, second | not observed | seen (m2f2-list-after) | M2 |
| L-07 | Toolbar | Sheet view icon | icon button | view group, third | not observed | seen (m2f2-list-after) | M2 |
| L-08 | Toolbar | Chart view icon | icon button | view group, fourth | not observed | seen (m2f2-list-after) | M2 |
| L-09 | Toolbar | Timeline view icon | icon button | view group, fifth | not observed | seen (m2f2-list-after) | M2 |
| L-10 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | not observed | seen (m2f2-list-after) | M2 |
| L-11 | Toolbar | Down chevron | icon button | view group, seventh | not observed | seen (m2f2-list-after) | M2 |
| L-12 | Toolbar | Create Contact | button | right group, first | not observed | seen (m2f2-list-after) | M2 |
| L-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Contact | not observed | seen (m2f2-list-after) | M6 |
| L-14 | Toolbar | Three dots / Actions | icon button | right group, far right | not observed | seen (m2f2-list-after) | M2 |
| L-15 | Filter panel | Search | input | below Filter Contacts by heading | not observed | seen (m2f2-list-after) | M2 |
| L-16 | Filter panel | System Defined Filters | toggle | first section heading | not observed | seen (m2f2-list-after) | M2 |
| L-17 | Filter panel | Activities | checkbox | system-defined section, Activities | not observed | seen (m2f2-list-after) | M5 |
| L-18 | Filter panel | Campaigns | checkbox | system-defined section, Campaigns | not observed | seen (m2f2-list-after) | M7 |
| L-19 | Filter panel | Latest Email Status | checkbox | system-defined section, Latest Email Status | not observed | seen (m2f2-list-after) | M10 |
| L-20 | Filter panel | Locked | checkbox | system-defined section, Locked | not observed | seen (m2f2-list-after) | M2 |
| L-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | not observed | seen (m2f2-list-after) | M2 |
| L-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | not observed | seen (m2f2-list-after) | M2 |
| L-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | not observed | seen (m2f2-list-after) | M2 |
| L-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | not observed | seen (m2f2-list-after) | M2 |
| L-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | not observed | seen (m2f2-list-after) | P3 |
| L-26 | Filter panel | Filter By Fields | toggle | second section heading | not observed | seen (m2f2-list-after) | M2 |
| L-27 | Filter panel | Account Name | checkbox | field section, Account Name | not observed | seen (m2f2-list-after) | M3 |
| L-28 | Filter panel | Assistant | checkbox | field section, Assistant | not observed | seen (m2f2-list-after) | M2 |
| L-29 | Filter panel | Asst Phone | checkbox | field section, Asst Phone | not observed | seen (m2f2-list-after) | M2 |
| L-30 | Filter panel | Connected To | checkbox | field section, Connected To | not observed | seen (m2f2-list-after) | M2 |
| L-31 | Filter panel | Contact Name | checkbox | field section, Contact Name | not observed | seen (m2f2-list-after) | M2 |
| L-32 | Filter panel | Contact Owner (partly clipped) | checkbox | field section, Contact Owner (partly clipped) | not observed | seen (m2f2-list-after) | M2 |
| L-33 | Table | Sliders icon | icon button | header, far right overlay | not observed | seen (m2f2-list-after) | M11 |
| L-34 | Table | Select all checkbox | checkbox | header, before activity column | not observed | seen (m2f2-list-after) | M2 |
| L-35 | Table | Contact Name | column header | first text column | not observed | seen (m2f2-list-after) | M2 |
| L-36 | Table | All with down arrow | select | within Contact Name header, right | not observed | seen (m2f2-list-after) | M2 |
| L-37 | Table | Account Name | column header | second text column | not observed | seen (m2f2-list-after) | M3 |
| L-38 | Table | Email | column header | third text column | not observed | seen (m2f2-list-after) | M2 |
| L-39 | Table | Phone (partly clipped) | column header | fourth text column, right edge | not observed | seen (m2f2-list-after) | M2 |
| L-40 | Table | Record selection checkbox | checkbox | each visible row, before activity column | not observed | seen (m2f2-list-after) | M2 |
| L-41 | Table | Call activity flag | badge | rows with activity, before Contact Name | not observed | seen (m2f2-list-after) | M5 |
| L-42 | Table | Contact record link | link | Contact Name cells | not observed | seen (m2f2-list-after) | M2 |
| L-43 | Table | Account record link | link | Account Name cells | not observed | seen (m2f2-list-after) | M3 |
| L-44 | Table | Email address link | link | Email cells | not observed | seen (m2f2-list-after) | M10 |
| L-48 | List footer | Total Records | badge | left | not observed | seen (m2f2-list-after) | M2 |
| L-49 | List footer | Displayed record range | badge | right group, between arrows | not observed | seen (m2f2-list-after) | M2 |
| L-50 | List footer | Previous | icon button | right group, before range | not observed | seen (m2f2-list-after) | M2 |
| L-51 | List footer | Next | icon button | right group, after range | not observed | seen (m2f2-list-after) | M2 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2f2-list-after) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2f2-list-after) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2f2-list-after) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2f2-list-after) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2f2-list-after) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2f2-list-after) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2f2-list-after) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2f2-list-after) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2f2-list-after) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2f2-list-after) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2f2-list-after) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2f2-list-after) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2f2-list-after) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2f2-list-after) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2f2-list-after) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2f2-list-after) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2f2-list-after) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2f2-list-after) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2f2-list-after) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2f2-list-after) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2f2-list-after) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2f2-list-after) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2f2-list-after) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2f2-list-after) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2f2-list-after) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2f2-list-after) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2f2-list-after) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2f2-list-after) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2f2-list-after) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2f2-list-after) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2f2-list-after) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2f2-list-after) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2f2-list-after) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2f2-list-after) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2f2-list-after) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2f2-list-after) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2f2-list-after) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2f2-list-after) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2f2-list-after) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2f2-list-after) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2f2-list-after) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2f2-list-after) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2f2-list-after) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2f2-list-after) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2f2-list-after) | ? |
| SH-46 | Utility strip | Trash bin icon | icon button | far right, after Help | not observed | seen (m2f2-list-after) | ? |

#### Control reconciliation

Ordinal numbers are one-based positions in this capture’s controls.json; no internal selectors are reproduced.

| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 65, 66, 67, 68, 83, 87, 111, 116, 119, 127, 128, 135, 137, 140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 166, 168, 170, 172, 173, 174, 283, 284, 288, 289, 292, 293, 295, 296 |
| Excluded: invisible or outside captured viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 84, 91, 92, 94, 95, 97, 98, 101, 102, 107, 108, 109, 110, 134, 138, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 286, 287, 303, 304, 320, 321, 335, 336, 350, 351, 366, 367, 381, 382, 397, 398, 412, 413, 427, 428, 442, 443, 458, 459, 474, 475, 489, 490, 505, 506, 520, 521, 526, 533, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660, 661, 662, 663, 664, 665, 666, 667, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686 |
| Excluded: record data or table structure | 290, 291, 305, 306, 307, 308, 311, 313, 315, 317, 319, 322, 323, 324, 327, 328, 330, 332, 334, 337, 338, 339, 342, 343, 345, 347, 349, 352, 353, 354, 357, 359, 361, 363, 365, 368, 369, 370, 373, 374, 376, 378, 380, 383, 384, 385, 388, 390, 392, 394, 396, 399, 400, 401, 404, 406, 408, 410, 411, 414, 415, 416, 419, 420, 422, 424, 426, 429, 430, 431, 434, 436, 438, 440, 441, 444, 445, 446, 449, 451, 453, 455, 457, 460, 461, 462, 465, 467, 469, 471, 473, 476, 477, 478, 481, 482, 484, 486, 488, 491, 492, 493, 496, 498, 500, 502, 504, 507, 508, 509, 512, 513, 515, 517, 519, 522, 523, 524, 527, 528, 530, 532, 534 |
| Excluded: target not painted in screenshot | 129 |
| L-01 | 112 |
| L-02 | 113, 114, 115 |
| L-03 | 117 |
| L-04 | 118 |
| L-05 | 120 |
| L-06 | 121 |
| L-07 | 122 |
| L-08 | 123 |
| L-09 | 124 |
| L-10 | 125 |
| L-11 | 126 |
| L-12 | 130 |
| L-13 | 131, 132 |
| L-14 | 133 |
| L-15 | 136 |
| L-16 | 139 |
| L-17 | 141 |
| L-18 | 143 |
| L-19 | 145 |
| L-20 | 147 |
| L-21 | 149 |
| L-22 | 151 |
| L-23 | 153 |
| L-24 | 155 |
| L-25 | 157 |
| L-26 | 159 |
| L-27 | 161 |
| L-28 | 163 |
| L-29 | 165 |
| L-30 | 167 |
| L-31 | 169 |
| L-32 | 171 |
| L-33 | 285 |
| L-34 | 294 |
| L-35 | 297 |
| L-36 | 298, 299 |
| L-37 | 300 |
| L-38 | 301 |
| L-39 | 302 |
| L-40 | 309, 310, 325, 326, 340, 341, 355, 356, 371, 372, 386, 387, 402, 403, 417, 418, 432, 433, 447, 448, 463, 464, 479, 480, 494, 495, 510, 511, 525 |
| L-41 | 312, 358, 389, 405, 435, 450, 466, 497 |
| L-42 | 314, 329, 344, 360, 375, 391, 407, 421, 437, 452, 468, 483, 499, 514, 529 |
| L-43 | 316, 331, 346, 362, 377, 393, 409, 423, 439, 454, 470, 485, 501, 516, 531 |
| L-44 | 318, 333, 348, 364, 379, 395, 425, 456, 472, 487, 503, 518 |
| L-48 | 668 |
| L-49 | 669 |
| L-50 | 670 |
| L-51 | 671 |
| SH-01 | 2, 3, 4 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29, 30, 31 |
| SH-10 | 33 |
| SH-11 | 34 |
| SH-12 | 36 |
| SH-13 | 38, 39 |
| SH-14 | 40, 41 |
| SH-15 | 42, 43 |
| SH-16 | 44, 45 |
| SH-17 | 46, 47 |
| SH-18 | 48, 49 |
| SH-19 | 50 |
| SH-20 | 52, 53 |
| SH-21 | 54, 55 |
| SH-22 | 56, 57 |
| SH-23 | 58 |
| SH-24 | 60, 61 |
| SH-25 | 63, 64 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99, 100 |
| SH-34 | 103, 104, 105, 106 |
| Excluded: resize hit area not separately painted | 82 |
| Excluded: invisible utility container | 687 |
| Excluded: duplicate utility-strip wrapper | 688 |
| SH-35 | 689 |
| SH-36 | 690 |
| SH-37 | 691 |
| SH-38 | 692 |
| SH-39 | 693 |
| SH-40 | 694 |
| SH-41 | 695 |
| SH-42 | 696 |
| SH-43 | 697 |
| SH-44 | 698 |
| SH-45 | 699 |

Screenshot-only control: SH-46 (far-right trash icon). No new visible shell control or unnumbered icon was found.

## Shell controls missing from app-shell.md

The inherited list in [contacts.md](contacts.md) identifies the document-with-clock icon (SH-38), chart shortcut (SH-40), square-with-arrow icon (SH-41), and far-right trash icon (SH-46) as lacking individual entries in app-shell.md. Their identities/functions remain unobserved where no visible label establishes them. No additional visually verified shell control was found in this task. The rail-boundary resize hit area is in controls.json but has no separately painted handle; it was not dragged. No shell preferences were changed. Shell controls retain their existing module assignment, including `?` where ownership is unresolved.

## Edit form

Edit Contact remains **not observed**. The required sequence stopped after `m2f2-create-reporting`, before either edit capture. No edit title, actions, field population, required markers, address controls or footer can be asserted from create evidence. The requested comparison with create therefore remains open, and stable F-* placeholders are retained without promotion to `seen`.

## Differences from the Lead form

| Area | Lead form | Contacts evidence |
| --- | --- | --- |
| Name and required fields | Company and Last Name required markers | Last Name required marker; no Company field in the create viewport; Account Name is a lookup without a visible required marker |
| Ownership | Lead Owner with dropdown and lookup | Contact Owner with dropdown and lookup; owner window not observed; continuation stopped before its capture |
| Associations | Company input | Account Name and Vendor Name lookup inputs/icons; Reporting To contact lookup visible in country capture |
| Information fields | Website, Lead Status, Industry, Annual Revenue, No. of Employees, Rating | Department, Home Phone, Other Phone, Date of Birth, Assistant, Asst Phone; Lead Source retained |
| Addresses | One Address group in left column | Mailing Address and Other Address side by side; Copy Address control visible |
| Bottom information | Skype ID, Secondary Email, Twitter | Secondary Email and Twitter seen; Skype ID and Email Opt Out only accessible/control evidence; no claim about their visual editors |
| Save and edit flows | Lead-specific observed/board validation in shared spec | No Contacts save, cancel, validation or edit outcome observed; do not inherit Lead validation copy as Contacts observation |

## Form fields vs metadata

Comparison uses [contacts.md](contacts.md) › Fields and layout and exported Contacts fields/layouts. A field in accessibility/control evidence is distinguished from a screenshot-verified field. Composite coordinates are represented by Latitude and Longitude inputs rather than an additional Coordinates input; group containers are not extra editable fields. The following table contains field names only; the evidence categories are explained outside it.

Fields seen in at least one screenshot include Contact Image, Contact Owner, Lead Source, Salutation, First Name, Last Name, Account Name, Vendor Name, Email, Title, Department, Phone, Home Phone, Other Phone, Fax, Mobile, Date of Birth, Assistant, Asst Phone, Secondary Email, Twitter, Reporting To, and the two address groups with their coordinate inputs. Covered Mailing fields in the country capture are accessible evidence, not independently visually verified input interiors.

| Form evidence but absent from exported fields | Exported fields without a screenshot-verified form control |
| --- | --- |
| — | Email Opt Out |
| — | Skype ID |
| — | Description |
| — | Mailing Address - Flat / House No./ Building / Apartment Name |
| — | Mailing Address - Street Address |
| — | Mailing Address - City |
| — | Mailing Address - State / Province |
| — | Full Name |
| — | Created By |
| — | Modified By |
| — | Created Time |
| — | Modified Time |
| — | Last Activity Time |
| — | Tag |
| — | Unsubscribed Mode |
| — | Unsubscribed Time |
| — | Record Id |
| — | Change Log Time |
| — | Locked |
| — | Last Enriched Time |
| — | Enrich Status |
| — | Distance |
| — | Connected To |

No visible field lacking a metadata counterpart was found. The table does not claim that every unpictured field is absent from the actual form: Email Opt Out, Skype ID and Description occur in accessible evidence; Connected To is create-enabled in metadata but absent from captured accessible/control evidence. Audit/system and full-name fields are metadata detail-only or outside-layout fields, not missing create inputs. Edit-enabled flags cannot be compared against a rendered edit form: neither the earlier run nor the continuation reached edit. The continuation upper viewport provides no new lower-field rendering, so the metadata comparison and placeholder status remain unchanged. Clear All, Copy Address, view/customization controls and lookup icons are controls, not metadata fields.

## Validation and save

Documentation keys are neutral citations; no vendor URLs are stored in the repository. Checked read-only on 2026-10-11. D2 retains the meaning used in [leads-write-behaviour.md](leads-write-behaviour.md); DF1 is a Contacts-specific help source.

| Key | Public source | Supported Contacts statement |
| --- | --- | --- |
| DF1 | Help article, “Creating Contacts”, sections Create Contact Individually and Work with the Contacts details page | Manual creation uses the Contacts form and Save; the creator owns the contact by default. The account lookup help describes optional creation/association, which was not exercised here. |
| D2 | Developer API v8, “Insert Records”, mandatory fields and field types | Lists Last Name as the Contacts mandatory name field, requires configured mandatory fields, and describes valid email/date values. These API rules do not establish browser message wording or placement. |

The visible Last Name marker and the exported layout both mark Last Name required. DF1 corroborates Save and default owner semantics. The documentation-backed concepts from the Lead write spec that also explicitly cover Contacts may be used as documented behaviour; Lead-only screenshots cannot establish Contacts UI outcomes. D2’s mandatory-field and format concepts apply at the documented API layer; metadata remains the current layout configuration source.

Contacts inline error wording, error placement/focus, first-invalid-field ordering, unsaved-change confirmation, successful-save destination/toast, Save and New reset/retention, edit-save result and duplicate handling in this exact form are **not observed** and not established by these sources. No write, Cancel or confirmation button was tested. Date of Birth’s visible browser placeholder is DD.MM.YYYY; the documented API date format is a separate rule and is not a form-input observation.

## Capability table

| Capability | Inventory / evidence | Module | Boundary |
| --- | --- | --- | --- |
| Create Contact form, field controls, required marker and action strip | F-01–F-32, create captures | M2 | Save/cancel outcomes not observed |
| Account association lookup | F-10, F-11 | M2 / M3 | Trigger seen; popup not painted; safety stop applied |
| Vendor association lookup | F-19, F-20 | P2 | Visible input/icon; not opened (same generic record-lookup type) |
| Reporting To contact lookup | F-31, F-32 | M2 | Input/icon seen; opening attempted in continuation but skipped (zero matches); popup not observed |
| Contact Owner select and user lookup | F-06, F-07 | M2 | Prefilled select seen; opening not attempted after stop |
| Lead Source searchable picklist | F-17 and F-17.1–F-17.8 | M2 | Opened only; popup scrolling/filter/selection untested |
| Salutation prefix | F-08 | M2 | Opening skipped by tool; no alternate selector used |
| Dual address groups and copy action | F-33–F-52 | M2 | Country opened; no value selection or copying |
| Contact image action | F-05 | M6 | Placeholder seen; upload not attempted |
| Form customization and Client Script | F-01, F-55–F-57 | M11 | Tab/link seen; footer visually unverified; nothing opened |
| Edit Contact | no capture | M2 | Not observed; both continuation edit captures omitted after stop |
| Shared shell and list return evidence | SH-* and L-* reused from contacts.md | existing assignments | No shell/list preference action performed |

## Capture refs

Only neutral slugs are recorded. Raw screenshots, accessible snapshots, control inventories and safety logs stay in the local research workspace and are not uploaded or committed.

| Slug | Requested clicks | Skipped | Shows |
| --- | --- | --- | --- |
| m2f-list-base | 0 | 0 | Initial Contacts list; total 471 |
| m2f-create | 0 | 0 | Initial Create Contact viewport |
| m2f-create-source | 1 | 0 | Lead Source search and visible option rows |
| m2f-create-salutation | 1 | 1 | Unchanged form; salutation opening blocked by dangerous-attribute guard |
| m2f-create-country | 1 | 0 | Lower form, dual addresses, open Mailing country list |
| m2f-create-account | 1 | 0 | Account lookup trigger; popup not painted; stop-rule condition |
| m2f-list-after | 0 | 0 | Contacts list after earlier stop; total still 471 |
| m2f2-list-base | 0 | 0 | Continuation list baseline; total 471 |
| m2f2-create-reporting | 1 | 1 | Lookup skipped (zero matches); upper create viewport; new blocked path triggers stop |
| m2f2-list-after | 0 | 0 | Required no-click list after continuation stop; total 471 |

The capture metadata’s clicks array records requested clicks, including skipped ones. In the earlier run, every capture’s meta.json was checked before the next capture, and a safety comment was saved on the issue. Baseline non-GET entries and blocked telemetry were compared; the Account lookup was the first new non-baseline, non-telemetry path. It is reported on the issue, without values. The after capture produced no new path. Reporting To/owner/edit captures were not taken after the stop. All seven screenshot files were opened as images and checked against the control reconciliation.

Continuation checks compare non-GET **path and aggregate count** against `m2f-list-base` for lists and `m2f-create` for create. The create continuation contains one blocked notification POST that the designated create baseline lacks. It is also present in the no-click list captures; this does not remove the explicit create-baseline stop condition. All status-bearing non-GET calls match their baseline paths and counts, and no unblocked telemetry was found. After the stop, owner, Mailing State / Province, Other Country / Region, edit and edit-lower captures were not taken. All three new screenshots were opened as images and reconciled. Raw capture folders remain local under their neutral slug names.

## Open questions

- Safety decision for the responsible lead: the continuation encountered a blocked notification POST absent from its designated create baseline. Clarify whether this background call belongs in the create baseline before restarting the remaining work; it was not treated as an exemption. No evidence establishes a record write.
- Edit Contact is not observed: title, actions, fields, values, required markers, footer and lookup differences cannot be specified from create alone.
- Salutation list opening was skipped because an attribute matched the dangerous-action guard. Options are not observed; the option catalog remains in contacts.md › Picklists, and is metadata evidence rather than an opened-list observation. No bypass or alternate selector was attempted.
- Owner dropdown/Select User window, Reporting To window and Account Name popup contents are not observed. Reporting To was attempted once in the continuation and skipped because the verified prior selector matched zero elements at capture time; no workaround was attempted. Vendor lookup was not separately opened because it shares the generic record-lookup type. Suggestions after input are unobserved; nothing was typed.
- The following form controls have accessible/metadata evidence but no screenshot-verified rendering. These rows reserve stable numbers without claiming visual observation; positions are accessible sequence only.

| # | Control | Type evidence | Position evidence | Source |
| --- | --- | --- | --- | --- |
| F-27 | Email Opt Out | checkbox in controls evidence | Contact Information, right, after Asst Phone | not observed visually |
| F-28 | Skype ID | input in accessible/control evidence | Contact Information, right, after Email Opt Out | not observed visually |
| F-35 | Mailing Flat / House No./ Building / Apartment Name | input in controls evidence | Mailing Address, row 2 | not observed visually |
| F-36 | Mailing Street Address | input in controls evidence | Mailing Address, row 3 | not observed visually |
| F-37 | Mailing City | input in controls evidence | Mailing Address, row 4 | not observed visually |
| F-38 | Mailing State / Province | select in controls evidence | Mailing Address, row 5 | not observed visually |
| F-42 | Mailing Clear All | link-like control in controls evidence | Mailing Address, after coordinates | not observed visually |
| F-52 | Other Clear All | link-like control in controls evidence | Other Address, after coordinates | not observed visually |
| F-54 | Description | field label and placeholder only | Description Information | not observed |
| F-55 | Standard View | select in controls evidence | form footer, after Create Form Views | not observed visually |
| F-56 | Create a custom form page | button in controls evidence | form footer, after view | not observed visually |

- Mailing Flat / House No./ Building / Apartment Name, Street Address, City and State / Province inputs were occluded by the country popup in the only lower-form screenshot. They are F-35–F-38 in accessible/control sequence; editors and visual states remain unverified. No second picklist of the same searchable type was opened merely to change the viewport.
- Connected To is create-enabled in metadata but absent from captured form evidence. Its conditional rendering is unresolved.
- Country/state dependence, Copy Address direction/menu/result, Clear All result, date calendar interaction, form image menu and any controls exposed only by hover remain not observed. A hover field pencil was not seen and is not claimed to exist.
- Contacts-specific validation/save/cancel/duplicate outcomes remain unobserved beyond DF1/D2. Do not reuse Lead screenshot error copy as Contacts observation.
- Module ownership of inherited shell controls marked `?` remains open: product selector, global search, notifications, marketplace/profile/applications, utility chat/pins/contacts/document/chart/square-arrow/accessibility/help/trash controls. No ownership is inferred from an icon alone.

