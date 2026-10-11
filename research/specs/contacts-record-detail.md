# Contacts — record detail

Status: authorized continuation captures completed; ready for Grok QA inventory review and UI Lead approval. Unobserved areas remain explicit open questions.

## Purpose

Describe observed Contacts record-detail differences from [record-detail.md](record-detail.md). Field definitions, metadata layouts and SH/L control numbers remain in [contacts.md](contacts.md); they are not repeated as field tables. Only the captured record was inspected. No write or persistent preference control was exercised.

## Layout

The shared rail and top bar surround a record header. The header contains a back arrow, initial portrait placeholder, contact identity followed by an Account link, Add Tags, right-aligned actions and previous/next arrows. Below it, the Related List rail is left of the Overview/Timeline tabs and Last Update indicator. Overview starts with a five-field business card and an expanded details card. Timeline replaces that content with History and Interactions tabs.

The initial detail screenshot contains only the start of Contact Information. Authorized rail links scroll the inner content to related-card regions while the record header and tab row stay fixed. Several consecutive cards fit in one capture. The final card capture includes the record-page customization footer above the shared utility strip. Lower Contact Information, Reporting To, Address and Description were not painted by these permitted jumps; no separate permitted section-jump control was identified. No unseen field presentation is inferred from offscreen DOM entries.

The native rail scroll track is structural scrolling chrome, not an additional application action. Content behind the fixed header/tab row, beyond the horizontal activity viewport, or underneath the utility strip is excluded from painted evidence. No drag, explicit hover or persistent preference action was performed.

## Control inventory

SH and L numbers reuse the approved Contacts list inventory. Shell controls are listed by those existing numbers for screenshot reconciliation, not assigned new numbers. Repeated links and row controls share one structural number. `seen` records presence only; unclicked behaviour is `not observed`. No menu item was selected. Observed activation is cited by its continuation slug; presence in an earlier screenshot alone does not establish behaviour.

### Control inventory — m2d-list-base

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L-01 | View strip | All Contacts | tab | left, first | not observed | seen (m2d-list-base) | M2 |
| L-02 | View strip | Three dots icon | icon button | after current view tab | not observed | seen (m2d-list-base) | M2 |
| L-03 | Toolbar | Filter | button | left group, first | not observed | seen (m2d-list-base) | M2 |
| L-04 | Toolbar | Sort | button | left group, second | not observed | seen (m2d-list-base) | M2 |
| L-05 | Toolbar | List view icon | icon button | view group, first | not observed | seen (m2d-list-base) | M2 |
| L-06 | Toolbar | Kanban view icon | icon button | view group, second | not observed | seen (m2d-list-base) | M2 |
| L-07 | Toolbar | Sheet view icon | icon button | view group, third | not observed | seen (m2d-list-base) | M2 |
| L-08 | Toolbar | Chart view icon | icon button | view group, fourth | not observed | seen (m2d-list-base) | M2 |
| L-09 | Toolbar | Timeline view icon | icon button | view group, fifth | not observed | seen (m2d-list-base) | M2 |
| L-10 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | not observed | seen (m2d-list-base) | M2 |
| L-11 | Toolbar | Down chevron | icon button | view group, seventh | not observed | seen (m2d-list-base) | M2 |
| L-12 | Toolbar | Create Contact | button | right group, first | not observed | seen (m2d-list-base) | M2 |
| L-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Contact | not observed | seen (m2d-list-base) | M6 |
| L-14 | Toolbar | Three dots / Actions | icon button | right group, far right | not observed | seen (m2d-list-base) | M2 |
| L-15 | Filter panel | Search | input | below Filter Contacts by heading | not observed | seen (m2d-list-base) | M2 |
| L-16 | Filter panel | System Defined Filters | toggle | first section heading | not observed | seen (m2d-list-base) | M2 |
| L-17 | Filter panel | Activities | checkbox | system-defined section, Activities | not observed | seen (m2d-list-base) | M5 |
| L-18 | Filter panel | Campaigns | checkbox | system-defined section, Campaigns | not observed | seen (m2d-list-base) | M7 |
| L-19 | Filter panel | Latest Email Status | checkbox | system-defined section, Latest Email Status | not observed | seen (m2d-list-base) | M10 |
| L-20 | Filter panel | Locked | checkbox | system-defined section, Locked | not observed | seen (m2d-list-base) | M2 |
| L-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | not observed | seen (m2d-list-base) | M2 |
| L-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | not observed | seen (m2d-list-base) | M2 |
| L-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | not observed | seen (m2d-list-base) | M2 |
| L-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | not observed | seen (m2d-list-base) | M2 |
| L-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | not observed | seen (m2d-list-base) | P3 |
| L-26 | Filter panel | Filter By Fields | toggle | second section heading | not observed | seen (m2d-list-base) | M2 |
| L-27 | Filter panel | Account Name | checkbox | field section, Account Name | not observed | seen (m2d-list-base) | M3 |
| L-28 | Filter panel | Assistant | checkbox | field section, Assistant | not observed | seen (m2d-list-base) | M2 |
| L-29 | Filter panel | Asst Phone | checkbox | field section, Asst Phone | not observed | seen (m2d-list-base) | M2 |
| L-30 | Filter panel | Connected To | checkbox | field section, Connected To | not observed | seen (m2d-list-base) | M2 |
| L-31 | Filter panel | Contact Name | checkbox | field section, Contact Name | not observed | seen (m2d-list-base) | M2 |
| L-32 | Filter panel | Contact Owner (partly clipped) | checkbox | field section, Contact Owner (partly clipped) | not observed | seen (m2d-list-base) | M2 |
| L-33 | Table | Sliders icon | icon button | header, far right overlay | not observed | seen (m2d-list-base) | M11 |
| L-34 | Table | Select all checkbox | checkbox | header, before activity column | not observed | seen (m2d-list-base) | M2 |
| L-35 | Table | Contact Name | column header | first text column | not observed | seen (m2d-list-base) | M2 |
| L-36 | Table | All with down arrow | select | within Contact Name header, right | not observed | seen (m2d-list-base) | M2 |
| L-37 | Table | Account Name | column header | second text column | not observed | seen (m2d-list-base) | M3 |
| L-38 | Table | Email | column header | third text column | not observed | seen (m2d-list-base) | M2 |
| L-39 | Table | Phone (partly clipped) | column header | fourth text column, right edge | not observed | seen (m2d-list-base) | M2 |
| L-40 | Table | Record selection checkbox | checkbox | each visible row, before activity column | not observed | seen (m2d-list-base) | M2 |
| L-41 | Table | Call activity flag | badge | rows with activity, before Contact Name | not observed | seen (m2d-list-base) | M5 |
| L-42 | Table | Contact record link | link | Contact Name cells | not observed | seen (m2d-list-base) | M2 |
| L-43 | Table | Account record link | link | Account Name cells | not observed | seen (m2d-list-base) | M3 |
| L-44 | Table | Email address link | link | Email cells | not observed | seen (m2d-list-base) | M10 |
| L-48 | List footer | Total Records | badge | left | not observed | seen (m2d-list-base) | M2 |
| L-49 | List footer | Displayed record range | badge | right group, between arrows | not observed | seen (m2d-list-base) | M2 |
| L-50 | List footer | Previous | icon button | right group, before range | not observed | seen (m2d-list-base) | M2 |
| L-51 | List footer | Next | icon button | right group, after range | not observed | seen (m2d-list-base) | M2 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2d-list-base) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2d-list-base) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2d-list-base) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2d-list-base) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2d-list-base) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2d-list-base) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2d-list-base) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2d-list-base) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2d-list-base) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2d-list-base) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2d-list-base) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2d-list-base) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2d-list-base) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2d-list-base) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2d-list-base) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2d-list-base) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2d-list-base) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2d-list-base) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2d-list-base) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2d-list-base) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2d-list-base) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2d-list-base) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2d-list-base) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2d-list-base) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2d-list-base) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2d-list-base) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2d-list-base) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2d-list-base) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2d-list-base) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2d-list-base) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2d-list-base) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2d-list-base) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2d-list-base) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2d-list-base) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2d-list-base) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2d-list-base) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2d-list-base) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2d-list-base) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2d-list-base) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2d-list-base) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2d-list-base) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2d-list-base) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2d-list-base) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2d-list-base) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2d-list-base) | ? |
| SH-46 | Utility strip | Stacked cards icon | icon button | far right, after Help | not observed | seen (m2d-list-base) | ? |

The Contact record link (L-42) was used for the following detail capture; opening that one record is observed in m2d-detail-main. No record text is reproduced.

#### Reconciliation — m2d-list-base

Item ordinals are one-based positions in the local controls.json array, not selectors. Structural arrays were compared with the approved list-after capture: only the Sort wrapper accessibility attribute differs; the visible inventory and exclusions remain the same.

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 65, 66, 67, 68, 82, 83, 87, 111, 116, 119, 127, 128, 135, 137, 140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 166, 168, 170, 172, 173, 174, 283, 284, 288, 289, 292, 293, 295, 296, 687 |
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

### Control inventory — m2d-list-after

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L-01 | View strip | All Contacts | tab | left, first | not observed | seen (m2d-list-after) | M2 |
| L-02 | View strip | Three dots icon | icon button | after current view tab | not observed | seen (m2d-list-after) | M2 |
| L-03 | Toolbar | Filter | button | left group, first | not observed | seen (m2d-list-after) | M2 |
| L-04 | Toolbar | Sort | button | left group, second | not observed | seen (m2d-list-after) | M2 |
| L-05 | Toolbar | List view icon | icon button | view group, first | not observed | seen (m2d-list-after) | M2 |
| L-06 | Toolbar | Kanban view icon | icon button | view group, second | not observed | seen (m2d-list-after) | M2 |
| L-07 | Toolbar | Sheet view icon | icon button | view group, third | not observed | seen (m2d-list-after) | M2 |
| L-08 | Toolbar | Chart view icon | icon button | view group, fourth | not observed | seen (m2d-list-after) | M2 |
| L-09 | Toolbar | Timeline view icon | icon button | view group, fifth | not observed | seen (m2d-list-after) | M2 |
| L-10 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | not observed | seen (m2d-list-after) | M2 |
| L-11 | Toolbar | Down chevron | icon button | view group, seventh | not observed | seen (m2d-list-after) | M2 |
| L-12 | Toolbar | Create Contact | button | right group, first | not observed | seen (m2d-list-after) | M2 |
| L-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Contact | not observed | seen (m2d-list-after) | M6 |
| L-14 | Toolbar | Three dots / Actions | icon button | right group, far right | not observed | seen (m2d-list-after) | M2 |
| L-15 | Filter panel | Search | input | below Filter Contacts by heading | not observed | seen (m2d-list-after) | M2 |
| L-16 | Filter panel | System Defined Filters | toggle | first section heading | not observed | seen (m2d-list-after) | M2 |
| L-17 | Filter panel | Activities | checkbox | system-defined section, Activities | not observed | seen (m2d-list-after) | M5 |
| L-18 | Filter panel | Campaigns | checkbox | system-defined section, Campaigns | not observed | seen (m2d-list-after) | M7 |
| L-19 | Filter panel | Latest Email Status | checkbox | system-defined section, Latest Email Status | not observed | seen (m2d-list-after) | M10 |
| L-20 | Filter panel | Locked | checkbox | system-defined section, Locked | not observed | seen (m2d-list-after) | M2 |
| L-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | not observed | seen (m2d-list-after) | M2 |
| L-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | not observed | seen (m2d-list-after) | M2 |
| L-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | not observed | seen (m2d-list-after) | M2 |
| L-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | not observed | seen (m2d-list-after) | M2 |
| L-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | not observed | seen (m2d-list-after) | P3 |
| L-26 | Filter panel | Filter By Fields | toggle | second section heading | not observed | seen (m2d-list-after) | M2 |
| L-27 | Filter panel | Account Name | checkbox | field section, Account Name | not observed | seen (m2d-list-after) | M3 |
| L-28 | Filter panel | Assistant | checkbox | field section, Assistant | not observed | seen (m2d-list-after) | M2 |
| L-29 | Filter panel | Asst Phone | checkbox | field section, Asst Phone | not observed | seen (m2d-list-after) | M2 |
| L-30 | Filter panel | Connected To | checkbox | field section, Connected To | not observed | seen (m2d-list-after) | M2 |
| L-31 | Filter panel | Contact Name | checkbox | field section, Contact Name | not observed | seen (m2d-list-after) | M2 |
| L-32 | Filter panel | Contact Owner (partly clipped) | checkbox | field section, Contact Owner (partly clipped) | not observed | seen (m2d-list-after) | M2 |
| L-33 | Table | Sliders icon | icon button | header, far right overlay | not observed | seen (m2d-list-after) | M11 |
| L-34 | Table | Select all checkbox | checkbox | header, before activity column | not observed | seen (m2d-list-after) | M2 |
| L-35 | Table | Contact Name | column header | first text column | not observed | seen (m2d-list-after) | M2 |
| L-36 | Table | All with down arrow | select | within Contact Name header, right | not observed | seen (m2d-list-after) | M2 |
| L-37 | Table | Account Name | column header | second text column | not observed | seen (m2d-list-after) | M3 |
| L-38 | Table | Email | column header | third text column | not observed | seen (m2d-list-after) | M2 |
| L-39 | Table | Phone (partly clipped) | column header | fourth text column, right edge | not observed | seen (m2d-list-after) | M2 |
| L-40 | Table | Record selection checkbox | checkbox | each visible row, before activity column | not observed | seen (m2d-list-after) | M2 |
| L-41 | Table | Call activity flag | badge | rows with activity, before Contact Name | not observed | seen (m2d-list-after) | M5 |
| L-42 | Table | Contact record link | link | Contact Name cells | not observed | seen (m2d-list-after) | M2 |
| L-43 | Table | Account record link | link | Account Name cells | not observed | seen (m2d-list-after) | M3 |
| L-44 | Table | Email address link | link | Email cells | not observed | seen (m2d-list-after) | M10 |
| L-48 | List footer | Total Records | badge | left | not observed | seen (m2d-list-after) | M2 |
| L-49 | List footer | Displayed record range | badge | right group, between arrows | not observed | seen (m2d-list-after) | M2 |
| L-50 | List footer | Previous | icon button | right group, before range | not observed | seen (m2d-list-after) | M2 |
| L-51 | List footer | Next | icon button | right group, after range | not observed | seen (m2d-list-after) | M2 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2d-list-after) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2d-list-after) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2d-list-after) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2d-list-after) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2d-list-after) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2d-list-after) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2d-list-after) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2d-list-after) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2d-list-after) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2d-list-after) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2d-list-after) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2d-list-after) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2d-list-after) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2d-list-after) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2d-list-after) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2d-list-after) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2d-list-after) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2d-list-after) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2d-list-after) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2d-list-after) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2d-list-after) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2d-list-after) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2d-list-after) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2d-list-after) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2d-list-after) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2d-list-after) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2d-list-after) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2d-list-after) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2d-list-after) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2d-list-after) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2d-list-after) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2d-list-after) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2d-list-after) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2d-list-after) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2d-list-after) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2d-list-after) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2d-list-after) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2d-list-after) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2d-list-after) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2d-list-after) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2d-list-after) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2d-list-after) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2d-list-after) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2d-list-after) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2d-list-after) | ? |
| SH-46 | Utility strip | Stacked cards icon | icon button | far right, after Help | not observed | seen (m2d-list-after) | ? |

#### Reconciliation — m2d-list-after

Item ordinals are one-based positions in the local controls.json array, not selectors. Structural arrays were compared with the approved list-after capture: only the Sort wrapper accessibility attribute differs; the visible inventory and exclusions remain the same.

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 65, 66, 67, 68, 82, 83, 87, 111, 116, 119, 127, 128, 135, 137, 140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 166, 168, 170, 172, 173, 174, 283, 284, 288, 289, 292, 293, 295, 296, 687 |
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

### Control inventory — m2d-detail-main

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2d-detail-main) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2d-detail-main) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2d-detail-main) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2d-detail-main) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2d-detail-main) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2d-detail-main) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2d-detail-main) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2d-detail-main) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2d-detail-main) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2d-detail-main) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2d-detail-main) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2d-detail-main) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2d-detail-main) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2d-detail-main) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2d-detail-main) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2d-detail-main) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2d-detail-main) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2d-detail-main) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2d-detail-main) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2d-detail-main) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2d-detail-main) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2d-detail-main) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2d-detail-main) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2d-detail-main) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2d-detail-main) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2d-detail-main) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2d-detail-main) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2d-detail-main) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2d-detail-main) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2d-detail-main) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2d-detail-main) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2d-detail-main) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2d-detail-main) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2d-detail-main) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2d-detail-main) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2d-detail-main) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2d-detail-main) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2d-detail-main) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2d-detail-main) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2d-detail-main) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2d-detail-main) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2d-detail-main) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2d-detail-main) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2d-detail-main) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2d-detail-main) | ? |
| SH-46 | Utility strip | Stacked cards icon | icon button | far right, after Help | not observed | seen (m2d-detail-main) | ? |
| D-01 | Header | Back | icon button | leftmost | not observed | seen (m2d-detail-main) | M2 |
| D-02 | Header | Portrait placeholder | icon button | after Back | not observed | seen (m2d-detail-main) | M6 |
| D-03 | Header | Account record link | link | identity line, after contact identity | not observed | seen (m2d-detail-main) | M3 |
| D-04 | Header | Add Tags | button | below identity | not observed | seen (m2d-detail-main) | M6 |
| D-05 | Header | Send Email | button | right actions, first | not observed | seen (m2d-detail-main) | M10 |
| D-06 | Header | Edit | button | right actions, second | not observed | seen (m2d-detail-main) | M2 |
| D-07 | Header | More Options / three dots | icon button | right actions, third | Opens the action menu (seen in m2d2-detail-more) | seen (m2d-detail-main) | M2 |
| D-08 | Header | Previous Record | icon button | after More Options | not observed | seen (m2d-detail-main) | M2 |
| D-09 | Header | Next Record | icon button | far right | not observed | seen (m2d-detail-main) | M2 |
| D-10 | Related-list rail | Notes | link | rail, row 1 | not observed | seen (m2d-detail-main) | M6 |
| D-11 | Related-list rail | Connected Records | link | rail, row 2 | not observed | seen (m2d-detail-main) | ? |
| D-12 | Related-list rail | Attachments | link | rail, row 3 | not observed | seen (m2d-detail-main) | M6 |
| D-13 | Related-list rail | Cadences | link | rail, row 4 | not observed | seen (m2d-detail-main) | P3 |
| D-14 | Related-list rail | Deals | link | rail, row 5 | not observed | seen (m2d-detail-main) | M4 |
| D-15 | Related-list rail | Open Activities | link | rail, row 6 | not observed | seen (m2d-detail-main) | M5 |
| D-16 | Related-list rail | Closed Activities | link | rail, row 7 | not observed | seen (m2d-detail-main) | M5 |
| D-17 | Related-list rail | Invited Meetings | link | rail, row 8 | not observed | seen (m2d-detail-main) | M5 |
| D-18 | Related-list rail | Products | link | rail, row 9 | not observed | seen (m2d-detail-main) | P2 |
| D-19 | Related-list rail | Cases | link | rail, row 10 | not observed | seen (m2d-detail-main) | M8 |
| D-20 | Related-list rail | Quotes | link | rail, row 11 | not observed | seen (m2d-detail-main) | P2 |
| D-21 | Related-list rail | Sales Orders | link | rail, row 12 | not observed | seen (m2d-detail-main) | P2 |
| D-22 | Related-list rail | Purchase Orders | link | rail, row 13 | not observed | seen (m2d-detail-main) | P2 |
| D-23 | Related-list rail | Emails | link | rail, row 14 | not observed | seen (m2d-detail-main) | M10 |
| D-24 | Related-list rail | Invoices | link | rail, row 15 | not observed | seen (m2d-detail-main) | P2 |
| D-25 | Related-list rail | Campaigns | link | rail, row 16 | not observed | seen (m2d-detail-main) | M7 |
| D-26 | Related-list rail | Social | link | rail, row 17 | not observed | seen (m2d-detail-main) | M15 |
| D-27 | Related-list rail | Reporting Contacts | link | rail, row 18 | not observed | seen (m2d-detail-main) | M2 |
| D-28 | Related-list rail | Voice of the Customer | link | rail, row 19 | not observed | seen (m2d-detail-main) | P3 |
| D-29 | Related-list rail | Add Related List | link | below last related-list link | not observed | seen (m2d-detail-main) | M11 |
| D-30 | Related-list rail | Open Activities count | badge | after Open Activities | not observed | seen (m2d-detail-main) | M5 |
| D-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | not observed | seen (m2d-detail-main) | M5 |
| D-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | not observed | seen (m2d-detail-main) | M2 |
| D-33 | Tab row | Overview | tab | first tab, selected | not observed | seen (m2d-detail-main) | M2 |
| D-34 | Tab row | Timeline | tab | second tab | Opens Timeline History (seen in m2d2-detail-timeline) | seen (m2d-detail-main) | M2 |
| D-35 | Tab row | Last Update indicator | badge | far right | not observed | seen (m2d-detail-main) | M2 |
| D-36 | Business card | Email address link | link | Email field value | not observed | seen (m2d-detail-main) | M10 |
| D-37 | Business card | Phone call icon | icon button | after Phone value | not observed | seen (m2d-detail-main) | M5 |
| D-38 | Details card | Hide Details | button | card header, left | not observed | seen (m2d-detail-main) | M2 |
| D-39 | Details card | Account record link | link | Contact Information, left column, Account Name value | not observed | seen (m2d-detail-main) | M3 |
| D-40 | Details card | Email address link | link | Contact Information, left column, Email value | not observed | seen (m2d-detail-main) | M10 |
| D-41 | Details card | Phone call icon | icon button | Contact Information, left column, after Phone value | not observed | seen (m2d-detail-main) | M5 |

D-37 and D-41 are screenshot-only call controls; SH-46 is the screenshot-only utility stacked-cards icon. Plain field labels and values are not separate controls. Contact Owner is plain text in this capture; no owner-picker behaviour is inferred. The portrait is an upload affordance whose opening and hover state remain unobserved.

#### Reconciliation — m2d-detail-main

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| D-01 | 107, 108 |
| D-02 | 110, 111 |
| D-03 | 113, 114, 115 |
| D-04 | 117 |
| D-05 | 119, 120 |
| D-06 | 121, 122 |
| D-07 | 123, 124 |
| D-08 | 125 |
| D-09 | 126 |
| D-10 | 129, 130 |
| D-11 | 132, 133 |
| D-12 | 135, 136 |
| D-13 | 138, 139 |
| D-14 | 141, 142 |
| D-15 | 144, 145 |
| D-16 | 147, 148 |
| D-17 | 150, 151 |
| D-18 | 153, 154 |
| D-19 | 156, 157 |
| D-20 | 159, 160 |
| D-21 | 162, 163 |
| D-22 | 165, 166 |
| D-23 | 168, 169 |
| D-24 | 171, 172 |
| D-25 | 174, 175 |
| D-26 | 177, 178 |
| D-27 | 180, 181 |
| D-28 | 183, 184 |
| D-29 | 186 |
| D-30 | 146 |
| D-31 | 149 |
| D-32 | 188 |
| D-33 | 190 |
| D-34 | 191 |
| D-35 | 192 |
| D-36 | 207, 208 |
| D-38 | 228, 229 |
| D-39 | 242, 243 |
| D-40 | 248, 249 |
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
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98, 99 |
| SH-34 | 102, 103, 104, 105 |
| SH-35 | 481 |
| SH-36 | 482 |
| SH-37 | 483 |
| SH-38 | 484 |
| SH-39 | 485 |
| SH-40 | 486 |
| SH-41 | 487 |
| SH-42 | 488 |
| SH-43 | 489 |
| SH-44 | 490 |
| SH-45 | 491 |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 82, 83, 86, 106, 128, 189, 193, 194, 195, 196, 197, 198, 202, 203, 204, 209, 210, 211, 215, 216, 217, 218, 220, 221, 222, 223, 224, 226, 227, 230, 231, 232, 233, 237, 238, 244, 245, 250, 251, 255, 256, 257, 259, 480 |
| Excluded: invisible or outside captured inner viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 90, 91, 93, 94, 96, 97, 100, 101, 109, 116, 118, 127, 131, 134, 137, 140, 143, 152, 155, 158, 161, 164, 167, 170, 173, 176, 179, 182, 185, 187, 214, 219, 225, 241, 254, 258, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 279, 289, 294, 299, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 492 |
| Excluded: record value or field wrapper | 112, 199, 200, 201, 205, 206, 212, 213, 234, 235, 236, 239, 240, 246, 247, 252, 253 |
| Excluded: field content outside captured inner viewport | 276, 277, 278, 280, 281, 282, 283, 284, 285, 286, 287, 288, 290, 291, 292, 293, 295, 296, 297, 298, 300 |

### Control inventory — m2d2-list-base

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L-01 | View strip | All Contacts | tab | left, first | not observed | seen (m2d2-list-base) | M2 |
| L-02 | View strip | Three dots icon | icon button | after current view tab | not observed | seen (m2d2-list-base) | M2 |
| L-03 | Toolbar | Filter | button | left group, first | not observed | seen (m2d2-list-base) | M2 |
| L-04 | Toolbar | Sort | button | left group, second | not observed | seen (m2d2-list-base) | M2 |
| L-05 | Toolbar | List view icon | icon button | view group, first | not observed | seen (m2d2-list-base) | M2 |
| L-06 | Toolbar | Kanban view icon | icon button | view group, second | not observed | seen (m2d2-list-base) | M2 |
| L-07 | Toolbar | Sheet view icon | icon button | view group, third | not observed | seen (m2d2-list-base) | M2 |
| L-08 | Toolbar | Chart view icon | icon button | view group, fourth | not observed | seen (m2d2-list-base) | M2 |
| L-09 | Toolbar | Timeline view icon | icon button | view group, fifth | not observed | seen (m2d2-list-base) | M2 |
| L-10 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | not observed | seen (m2d2-list-base) | M2 |
| L-11 | Toolbar | Down chevron | icon button | view group, seventh | not observed | seen (m2d2-list-base) | M2 |
| L-12 | Toolbar | Create Contact | button | right group, first | not observed | seen (m2d2-list-base) | M2 |
| L-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Contact | not observed | seen (m2d2-list-base) | M6 |
| L-14 | Toolbar | Three dots / Actions | icon button | right group, far right | not observed | seen (m2d2-list-base) | M2 |
| L-15 | Filter panel | Search | input | below Filter Contacts by heading | not observed | seen (m2d2-list-base) | M2 |
| L-16 | Filter panel | System Defined Filters | toggle | first section heading | not observed | seen (m2d2-list-base) | M2 |
| L-17 | Filter panel | Activities | checkbox | system-defined section, Activities | not observed | seen (m2d2-list-base) | M5 |
| L-18 | Filter panel | Campaigns | checkbox | system-defined section, Campaigns | not observed | seen (m2d2-list-base) | M7 |
| L-19 | Filter panel | Latest Email Status | checkbox | system-defined section, Latest Email Status | not observed | seen (m2d2-list-base) | M10 |
| L-20 | Filter panel | Locked | checkbox | system-defined section, Locked | not observed | seen (m2d2-list-base) | M2 |
| L-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | not observed | seen (m2d2-list-base) | M2 |
| L-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | not observed | seen (m2d2-list-base) | M2 |
| L-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | not observed | seen (m2d2-list-base) | M2 |
| L-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | not observed | seen (m2d2-list-base) | M2 |
| L-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | not observed | seen (m2d2-list-base) | P3 |
| L-26 | Filter panel | Filter By Fields | toggle | second section heading | not observed | seen (m2d2-list-base) | M2 |
| L-27 | Filter panel | Account Name | checkbox | field section, Account Name | not observed | seen (m2d2-list-base) | M3 |
| L-28 | Filter panel | Assistant | checkbox | field section, Assistant | not observed | seen (m2d2-list-base) | M2 |
| L-29 | Filter panel | Asst Phone | checkbox | field section, Asst Phone | not observed | seen (m2d2-list-base) | M2 |
| L-30 | Filter panel | Connected To | checkbox | field section, Connected To | not observed | seen (m2d2-list-base) | M2 |
| L-31 | Filter panel | Contact Name | checkbox | field section, Contact Name | not observed | seen (m2d2-list-base) | M2 |
| L-32 | Filter panel | Contact Owner (partly clipped) | checkbox | field section, Contact Owner (partly clipped) | not observed | seen (m2d2-list-base) | M2 |
| L-33 | Table | Sliders icon | icon button | header, far right overlay | not observed | seen (m2d2-list-base) | M11 |
| L-34 | Table | Select all checkbox | checkbox | header, before activity column | not observed | seen (m2d2-list-base) | M2 |
| L-35 | Table | Contact Name | column header | first text column | not observed | seen (m2d2-list-base) | M2 |
| L-36 | Table | All with down arrow | select | within Contact Name header, right | not observed | seen (m2d2-list-base) | M2 |
| L-37 | Table | Account Name | column header | second text column | not observed | seen (m2d2-list-base) | M3 |
| L-38 | Table | Email | column header | third text column | not observed | seen (m2d2-list-base) | M2 |
| L-39 | Table | Phone (partly clipped) | column header | fourth text column, right edge | not observed | seen (m2d2-list-base) | M2 |
| L-40 | Table | Record selection checkbox | checkbox | each visible row, before activity column | not observed | seen (m2d2-list-base) | M2 |
| L-41 | Table | Call activity flag | badge | rows with activity, before Contact Name | not observed | seen (m2d2-list-base) | M5 |
| L-42 | Table | Contact record link | link | Contact Name cells | Opens the Contact detail (seen in m2d2-detail-more) | seen (m2d2-list-base) | M2 |
| L-43 | Table | Account record link | link | Account Name cells | not observed | seen (m2d2-list-base) | M3 |
| L-44 | Table | Email address link | link | Email cells | not observed | seen (m2d2-list-base) | M10 |
| L-48 | List footer | Total Records | badge | left | not observed | seen (m2d2-list-base) | M2 |
| L-49 | List footer | Displayed record range | badge | right group, between arrows | not observed | seen (m2d2-list-base) | M2 |
| L-50 | List footer | Previous | icon button | right group, before range | not observed | seen (m2d2-list-base) | M2 |
| L-51 | List footer | Next | icon button | right group, after range | not observed | seen (m2d2-list-base) | M2 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2d2-list-base) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2d2-list-base) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2d2-list-base) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2d2-list-base) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2d2-list-base) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2d2-list-base) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2d2-list-base) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2d2-list-base) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2d2-list-base) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2d2-list-base) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2d2-list-base) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2d2-list-base) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2d2-list-base) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2d2-list-base) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2d2-list-base) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2d2-list-base) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2d2-list-base) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2d2-list-base) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2d2-list-base) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2d2-list-base) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2d2-list-base) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2d2-list-base) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2d2-list-base) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2d2-list-base) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2d2-list-base) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2d2-list-base) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2d2-list-base) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2d2-list-base) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2d2-list-base) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2d2-list-base) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2d2-list-base) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2d2-list-base) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2d2-list-base) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2d2-list-base) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2d2-list-base) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2d2-list-base) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2d2-list-base) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2d2-list-base) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2d2-list-base) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2d2-list-base) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2d2-list-base) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2d2-list-base) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2d2-list-base) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2d2-list-base) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2d2-list-base) | ? |
| SH-46 | Utility strip | Stacked cards icon | icon button | far right, after Help | not observed | seen (m2d2-list-base) | ? |

#### Reconciliation — m2d2-list-base

Item ordinals identify the one-based local controls.json entries only; they are not selectors. Every entry is assigned below. Offscreen elements and plain record/event text are excluded; visible screenshot-only controls are retained in the inventory.

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 4, 35, 37, 51, 59, 62, 82, 83, 87, 111, 114, 116, 119, 127, 128, 135, 137, 140, 160, 283, 284, 288, 289, 292, 293, 295, 296, 307, 308, 311, 317, 319, 323, 324, 327, 332, 334, 338, 339, 342, 347, 349, 353, 354, 357, 363, 365, 369, 370, 373, 378, 380, 384, 385, 394, 396, 400, 401, 404, 410, 411, 415, 416, 419, 424, 426, 430, 431, 440, 441, 445, 446, 449, 455, 457, 461, 462, 471, 473, 477, 478, 481, 484, 486, 488, 492, 493, 496, 502, 504, 508, 509, 512, 517, 519 |
| SH-01 | 2, 3 |
| Excluded: invisible or outside captured inner viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 84, 91, 92, 94, 95, 97, 98, 101, 102, 107, 108, 109, 110, 134, 138, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 286, 287, 303, 304, 320, 321, 335, 336, 350, 351, 366, 367, 381, 382, 397, 398, 412, 413, 427, 428, 442, 443, 458, 459, 474, 475, 489, 490, 505, 506, 511, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660, 661, 662, 663, 664, 665, 666, 667, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686, 687, 699 |
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
| L-01 | 112 |
| L-02 | 113, 115 |
| L-03 | 117 |
| L-04 | 118 |
| L-05 | 120 |
| L-06 | 121 |
| L-07 | 122 |
| L-08 | 123 |
| L-09 | 124 |
| L-10 | 125 |
| L-11 | 126 |
| Excluded: target not painted in screenshot | 129 |
| L-12 | 130 |
| L-13 | 131, 132 |
| L-14 | 133 |
| L-15 | 136 |
| L-16 | 139 |
| L-17 | 141 |
| Excluded: duplicate native input represented by its filter checkbox wrapper | 142, 144, 146, 148, 150, 152, 154, 156, 158, 162, 164, 166, 168, 170, 172 |
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
| Excluded: record data or table structure | 290, 291, 305, 306, 313, 315, 322, 328, 330, 337, 343, 345, 352, 359, 361, 368, 374, 376, 383, 388, 390, 392, 399, 406, 408, 414, 420, 422, 429, 434, 436, 438, 444, 451, 453, 460, 465, 467, 469, 476, 482, 491, 498, 500, 507, 513, 515 |
| L-34 | 294 |
| L-35 | 297 |
| L-36 | 298, 299 |
| L-37 | 300 |
| L-38 | 301 |
| L-39 | 302 |
| L-40 | 309, 310, 325, 326, 340, 341, 355, 356, 371, 372, 386, 387, 402, 403, 417, 418, 432, 433, 447, 448, 463, 464, 479, 480, 494, 495 |
| L-41 | 312, 358, 389, 405, 435, 450, 466, 497 |
| L-42 | 314, 329, 344, 360, 375, 391, 407, 421, 437, 452, 468, 483, 499 |
| L-43 | 316, 331, 346, 362, 377, 393, 409, 423, 439, 454, 470, 485, 501 |
| L-44 | 318, 333, 348, 364, 379, 395, 425, 456, 472, 487, 503 |
| Excluded: record row behind fixed list footer or below table viewport | 510, 514, 516, 518 |
| L-48 | 668 |
| L-49 | 669 |
| L-50 | 670 |
| L-51 | 671 |
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

Screenshot-only controls: SH-46, L-04.

### Control inventory — m2d2-detail-more

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2d2-detail-more) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2d2-detail-more) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2d2-detail-more) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2d2-detail-more) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2d2-detail-more) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2d2-detail-more) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2d2-detail-more) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2d2-detail-more) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2d2-detail-more) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2d2-detail-more) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2d2-detail-more) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2d2-detail-more) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2d2-detail-more) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2d2-detail-more) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2d2-detail-more) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2d2-detail-more) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2d2-detail-more) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2d2-detail-more) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2d2-detail-more) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2d2-detail-more) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2d2-detail-more) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2d2-detail-more) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2d2-detail-more) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2d2-detail-more) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2d2-detail-more) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2d2-detail-more) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2d2-detail-more) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2d2-detail-more) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2d2-detail-more) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2d2-detail-more) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2d2-detail-more) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2d2-detail-more) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2d2-detail-more) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2d2-detail-more) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2d2-detail-more) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2d2-detail-more) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2d2-detail-more) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2d2-detail-more) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2d2-detail-more) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2d2-detail-more) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2d2-detail-more) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2d2-detail-more) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2d2-detail-more) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2d2-detail-more) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2d2-detail-more) | ? |
| SH-46 | Utility strip | Stacked cards icon | icon button | far right, after Help | not observed | seen (m2d2-detail-more) | ? |
| D-01 | Header | Back | icon button | leftmost | not observed | seen (m2d2-detail-more) | M2 |
| D-02 | Header | Portrait placeholder | icon button | after Back | not observed | seen (m2d2-detail-more) | M6 |
| D-03 | Header | Account record link | link | identity line, after contact identity | not observed | seen (m2d2-detail-more) | M3 |
| D-04 | Header | Add Tags | button | below identity | not observed | seen (m2d2-detail-more) | M6 |
| D-05 | Header | Send Email | button | right actions, first | not observed | seen (m2d2-detail-more) | M10 |
| D-06 | Header | Edit | button | right actions, second | not observed | seen (m2d2-detail-more) | M2 |
| D-07 | Header | More Options / three dots | icon button | right actions, third | Opens the record action menu | seen (m2d2-detail-more) | M2 |
| D-08 | Header | Previous Record | icon button | after More Options | not observed | seen (m2d2-detail-more) | M2 |
| D-09 | Header | Next Record | icon button | far right | not observed | seen (m2d2-detail-more) | M2 |
| D-10 | Related-list rail | Notes | link | rail, row 1 | not observed | seen (m2d2-detail-more) | M6 |
| D-11 | Related-list rail | Connected Records | link | rail, row 2 | not observed | seen (m2d2-detail-more) | ? |
| D-12 | Related-list rail | Attachments | link | rail, row 3 | not observed | seen (m2d2-detail-more) | M6 |
| D-13 | Related-list rail | Cadences | link | rail, row 4 | not observed | seen (m2d2-detail-more) | P3 |
| D-14 | Related-list rail | Deals | link | rail, row 5 | not observed | seen (m2d2-detail-more) | M4 |
| D-15 | Related-list rail | Open Activities | link | rail, row 6 | not observed | seen (m2d2-detail-more) | M5 |
| D-16 | Related-list rail | Closed Activities | link | rail, row 7 | not observed | seen (m2d2-detail-more) | M5 |
| D-17 | Related-list rail | Invited Meetings | link | rail, row 8 | not observed | seen (m2d2-detail-more) | M5 |
| D-18 | Related-list rail | Products | link | rail, row 9 | not observed | seen (m2d2-detail-more) | P2 |
| D-19 | Related-list rail | Cases | link | rail, row 10 | not observed | seen (m2d2-detail-more) | M8 |
| D-20 | Related-list rail | Quotes | link | rail, row 11 | not observed | seen (m2d2-detail-more) | P2 |
| D-21 | Related-list rail | Sales Orders | link | rail, row 12 | not observed | seen (m2d2-detail-more) | P2 |
| D-22 | Related-list rail | Purchase Orders | link | rail, row 13 | not observed | seen (m2d2-detail-more) | P2 |
| D-23 | Related-list rail | Emails | link | rail, row 14 | not observed | seen (m2d2-detail-more) | M10 |
| D-24 | Related-list rail | Invoices | link | rail, row 15 | not observed | seen (m2d2-detail-more) | P2 |
| D-25 | Related-list rail | Campaigns | link | rail, row 16 | not observed | seen (m2d2-detail-more) | M7 |
| D-26 | Related-list rail | Social | link | rail, row 17 | not observed | seen (m2d2-detail-more) | M15 |
| D-27 | Related-list rail | Reporting Contacts | link | rail, row 18 | not observed | seen (m2d2-detail-more) | M2 |
| D-28 | Related-list rail | Voice of the Customer | link | rail, row 19 | not observed | seen (m2d2-detail-more) | P3 |
| D-29 | Related-list rail | Add Related List | link | below last related-list link | not observed | seen (m2d2-detail-more) | M11 |
| D-30 | Related-list rail | Open Activities count | badge | after Open Activities | not observed | seen (m2d2-detail-more) | M5 |
| D-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | not observed | seen (m2d2-detail-more) | M5 |
| D-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | not observed | seen (m2d2-detail-more) | M2 |
| D-33 | Tab row | Overview | tab | first tab, selected | not observed | seen (m2d2-detail-more) | M2 |
| D-34 | Tab row | Timeline | tab | second tab | Opens Timeline History (seen in m2d2-detail-timeline) | seen (m2d2-detail-more) | M2 |
| D-35 | Tab row | Last Update indicator | badge | far right | not observed | seen (m2d2-detail-more) | M2 |
| D-36 | Business card | Email address link | link | Email field value | not observed | seen (m2d2-detail-more) | M10 |
| D-37 | Business card | Phone call icon | icon button | after Phone value | not observed | seen (m2d2-detail-more) | M5 |
| D-38 | Details card | Hide Details | button | card header, left | not observed | seen (m2d2-detail-more) | M2 |
| D-39 | Details card | Account record link | link | Contact Information, left column, Account Name value | not observed | seen (m2d2-detail-more) | M3 |
| D-40 | Details card | Email address link | link | Contact Information, left column, Email value | not observed | seen (m2d2-detail-more) | M10 |
| D-41 | Details card | Phone call icon | icon button | Contact Information, left column, after Phone value | not observed | seen (m2d2-detail-more) | M5 |
| D-07.1 | More Options menu | Clone | menu item | menu, row 1 | not observed | seen (m2d2-detail-more) | M2 |
| D-07.2 | More Options menu | Share | menu item | menu, row 2 | not observed | seen (m2d2-detail-more) | M2 |
| D-07.3 | More Options menu | Delete | menu item | menu, row 3 | not observed | seen (m2d2-detail-more) | M2 |
| D-07.4 | More Options menu | Print Preview | menu item | menu, row 4 | not observed | seen (m2d2-detail-more) | M2 |
| D-07.5 | More Options menu | Find and Merge Duplicates | menu item | menu, row 5 | not observed | seen (m2d2-detail-more) | M2 |
| D-07.6 | More Options menu | Mail Merge | menu item | menu, row 6 | not observed | seen (m2d2-detail-more) | M9 |
| D-07.7 | More Options menu | Run Macro | menu item | menu, row 7 | not observed | seen (m2d2-detail-more) | M12 |
| D-07.8 | More Options menu | Customize Business Card | menu item | menu, row 8 | not observed | seen (m2d2-detail-more) | M11 |
| D-07.9 | More Options menu | Organize Contact Details | menu item | menu, row 9 | not observed | seen (m2d2-detail-more) | M11 |
| D-07.10 | More Options menu | Add Related List | menu item | menu, row 10 | not observed | seen (m2d2-detail-more) | M11 |
| D-07.11 | More Options menu | Review History | menu item | menu, row 11 | not observed | seen (m2d2-detail-more) | P3 |
| D-07.12 | More Options menu | Enroll to Cadence | menu item | menu, row 12 | not observed | seen (m2d2-detail-more) | P3 |
| D-07.13 | More Options menu | Add Kiosk | menu item | menu, row 13 | not observed | seen (m2d2-detail-more) | M11 |
| D-07.14 | More Options menu | Create Button | menu item | menu, row 14 | not observed | seen (m2d2-detail-more) | M11 |
| D-07.15 | More Options menu | Create Client Script | menu item | menu, row 15 | not observed | seen (m2d2-detail-more) | M11 |

#### Reconciliation — m2d2-detail-more

Item ordinals identify the one-based local controls.json entries only; they are not selectors. Every entry is assigned below. Offscreen elements and plain record/event text are excluded; visible screenshot-only controls are retained in the inventory.

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 82, 83, 86, 106, 115, 128, 189, 193, 194, 195, 196, 197, 198, 202, 203, 204, 209, 210, 211, 215, 216, 217, 218, 220, 221, 222, 223, 224, 226, 227, 230, 231, 232, 233, 237, 238, 243, 244, 245, 250, 251, 255, 256, 257, 259 |
| SH-01 | 2, 3, 4 |
| Excluded: invisible or outside captured inner viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 90, 91, 93, 94, 96, 97, 100, 101, 109, 116, 118, 127, 131, 134, 137, 140, 143, 152, 155, 158, 161, 164, 167, 170, 173, 176, 179, 182, 185, 187, 214, 219, 225, 241, 254, 258, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 279, 289, 294, 299, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 520 |
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
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98, 99 |
| SH-34 | 102, 103, 104, 105 |
| D-01 | 107, 108 |
| D-02 | 110, 111 |
| Excluded: record value or field wrapper | 112, 199, 200, 201, 205, 206, 212, 213, 234, 235, 236, 239, 240, 246, 247, 252, 253 |
| D-03 | 113, 114 |
| D-04 | 117 |
| D-05 | 119, 120 |
| D-06 | 121, 122 |
| D-07 | 123, 124 |
| D-08 | 125 |
| D-09 | 126 |
| D-10 | 129, 130 |
| D-11 | 132, 133 |
| D-12 | 135, 136 |
| D-13 | 138, 139 |
| D-14 | 141, 142 |
| D-15 | 144, 145 |
| D-30 | 146 |
| D-16 | 147, 148 |
| D-31 | 149 |
| D-17 | 150, 151 |
| D-18 | 153, 154 |
| D-19 | 156, 157 |
| D-20 | 159, 160 |
| D-21 | 162, 163 |
| D-22 | 165, 166 |
| D-23 | 168, 169 |
| D-24 | 171, 172 |
| D-25 | 174, 175 |
| D-26 | 177, 178 |
| D-27 | 180, 181 |
| D-28 | 183, 184 |
| D-29 | 186 |
| D-32 | 188 |
| D-33 | 190 |
| D-34 | 191 |
| D-35 | 192 |
| D-36 | 207, 208 |
| D-38 | 228, 229 |
| D-39 | 242 |
| D-40 | 248, 249 |
| Excluded: field content outside captured inner viewport | 276, 277, 278, 280, 281, 282, 283, 284, 285, 286, 287, 288, 290, 291, 292, 293, 295, 296, 297, 298, 300 |
| SH-35 | 509 |
| SH-36 | 510 |
| SH-37 | 511 |
| SH-38 | 512 |
| SH-39 | 513 |
| SH-40 | 514 |
| SH-41 | 515 |
| SH-42 | 516 |
| SH-43 | 517 |
| SH-44 | 518 |
| SH-45 | 519 |
| D-07.1 | 521 |
| D-07.2 | 522 |
| D-07.3 | 523 |
| D-07.4 | 524 |
| D-07.5 | 525 |
| D-07.6 | 526 |
| D-07.7 | 527 |
| D-07.8 | 528 |
| D-07.9 | 529 |
| D-07.10 | 530 |
| D-07.11 | 531 |
| D-07.12 | 532 |
| D-07.13 | 533 |
| D-07.14 | 534 |
| D-07.15 | 535 |

Screenshot-only controls: SH-46, D-37, D-41.

### Control inventory — m2d2-detail-timeline

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2d2-detail-timeline) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2d2-detail-timeline) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2d2-detail-timeline) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2d2-detail-timeline) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2d2-detail-timeline) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2d2-detail-timeline) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2d2-detail-timeline) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2d2-detail-timeline) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2d2-detail-timeline) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2d2-detail-timeline) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2d2-detail-timeline) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2d2-detail-timeline) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2d2-detail-timeline) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2d2-detail-timeline) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2d2-detail-timeline) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2d2-detail-timeline) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2d2-detail-timeline) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2d2-detail-timeline) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2d2-detail-timeline) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2d2-detail-timeline) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2d2-detail-timeline) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2d2-detail-timeline) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2d2-detail-timeline) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2d2-detail-timeline) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2d2-detail-timeline) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2d2-detail-timeline) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2d2-detail-timeline) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2d2-detail-timeline) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2d2-detail-timeline) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2d2-detail-timeline) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2d2-detail-timeline) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2d2-detail-timeline) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2d2-detail-timeline) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2d2-detail-timeline) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2d2-detail-timeline) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2d2-detail-timeline) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2d2-detail-timeline) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2d2-detail-timeline) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2d2-detail-timeline) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2d2-detail-timeline) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2d2-detail-timeline) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2d2-detail-timeline) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2d2-detail-timeline) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2d2-detail-timeline) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2d2-detail-timeline) | ? |
| SH-46 | Utility strip | Stacked cards icon | icon button | far right, after Help | not observed | seen (m2d2-detail-timeline) | ? |
| D-01 | Header | Back | icon button | leftmost | not observed | seen (m2d2-detail-timeline) | M2 |
| D-02 | Header | Portrait placeholder | icon button | after Back | not observed | seen (m2d2-detail-timeline) | M6 |
| D-03 | Header | Account record link | link | identity line, after contact identity | not observed | seen (m2d2-detail-timeline) | M3 |
| D-04 | Header | Add Tags | button | below identity | not observed | seen (m2d2-detail-timeline) | M6 |
| D-05 | Header | Send Email | button | right actions, first | not observed | seen (m2d2-detail-timeline) | M10 |
| D-06 | Header | Edit | button | right actions, second | not observed | seen (m2d2-detail-timeline) | M2 |
| D-07 | Header | More Options / three dots | icon button | right actions, third | Opens the action menu (seen in m2d2-detail-more) | seen (m2d2-detail-timeline) | M2 |
| D-08 | Header | Previous Record | icon button | after More Options | not observed | seen (m2d2-detail-timeline) | M2 |
| D-09 | Header | Next Record | icon button | far right | not observed | seen (m2d2-detail-timeline) | M2 |
| D-10 | Related-list rail | Notes | link | rail, row 1 | not observed | seen (m2d2-detail-timeline) | M6 |
| D-11 | Related-list rail | Connected Records | link | rail, row 2 | not observed | seen (m2d2-detail-timeline) | ? |
| D-12 | Related-list rail | Attachments | link | rail, row 3 | not observed | seen (m2d2-detail-timeline) | M6 |
| D-13 | Related-list rail | Cadences | link | rail, row 4 | not observed | seen (m2d2-detail-timeline) | P3 |
| D-14 | Related-list rail | Deals | link | rail, row 5 | not observed | seen (m2d2-detail-timeline) | M4 |
| D-15 | Related-list rail | Open Activities | link | rail, row 6 | not observed | seen (m2d2-detail-timeline) | M5 |
| D-16 | Related-list rail | Closed Activities | link | rail, row 7 | not observed | seen (m2d2-detail-timeline) | M5 |
| D-17 | Related-list rail | Invited Meetings | link | rail, row 8 | not observed | seen (m2d2-detail-timeline) | M5 |
| D-18 | Related-list rail | Products | link | rail, row 9 | not observed | seen (m2d2-detail-timeline) | P2 |
| D-19 | Related-list rail | Cases | link | rail, row 10 | not observed | seen (m2d2-detail-timeline) | M8 |
| D-20 | Related-list rail | Quotes | link | rail, row 11 | not observed | seen (m2d2-detail-timeline) | P2 |
| D-21 | Related-list rail | Sales Orders | link | rail, row 12 | not observed | seen (m2d2-detail-timeline) | P2 |
| D-22 | Related-list rail | Purchase Orders | link | rail, row 13 | not observed | seen (m2d2-detail-timeline) | P2 |
| D-23 | Related-list rail | Emails | link | rail, row 14 | not observed | seen (m2d2-detail-timeline) | M10 |
| D-24 | Related-list rail | Invoices | link | rail, row 15 | not observed | seen (m2d2-detail-timeline) | P2 |
| D-25 | Related-list rail | Campaigns | link | rail, row 16 | not observed | seen (m2d2-detail-timeline) | M7 |
| D-26 | Related-list rail | Social | link | rail, row 17 | not observed | seen (m2d2-detail-timeline) | M15 |
| D-27 | Related-list rail | Reporting Contacts | link | rail, row 18 | not observed | seen (m2d2-detail-timeline) | M2 |
| D-28 | Related-list rail | Voice of the Customer | link | rail, row 19 | not observed | seen (m2d2-detail-timeline) | P3 |
| D-29 | Related-list rail | Add Related List | link | below last related-list link | not observed | seen (m2d2-detail-timeline) | M11 |
| D-30 | Related-list rail | Open Activities count | badge | after Open Activities | not observed | seen (m2d2-detail-timeline) | M5 |
| D-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | not observed | seen (m2d2-detail-timeline) | M5 |
| D-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | not observed | seen (m2d2-detail-timeline) | M2 |
| D-33 | Tab row | Overview | tab | first tab, unselected | not observed | seen (m2d2-detail-timeline) | M2 |
| D-34 | Tab row | Timeline | tab | second tab, selected | Opens Timeline; History is initially selected | seen (m2d2-detail-timeline) | M2 |
| D-35 | Tab row | Last Update indicator | badge | far right | not observed | seen (m2d2-detail-timeline) | M2 |
| D-42 | Timeline | History | tab | inner tab row, first | not observed | seen (m2d2-detail-timeline) | M2 |
| D-43 | Timeline | Interactions | tab | inner tab row, second | not observed | seen (m2d2-detail-timeline) | M2 |
| D-44 | Timeline | Show Upcoming Automated Actions | button | history toolbar, right | not observed | seen (m2d2-detail-timeline) | M12 |
| D-45 | Timeline | Filter Timeline History | icon button | history toolbar, after heading | not observed | seen (m2d2-detail-timeline) | M2 |
| D-46 | Timeline | Activity record link | link | call-event description | not observed | seen (m2d2-detail-timeline) | M5 |

#### Reconciliation — m2d2-detail-timeline

Item ordinals identify the one-based local controls.json entries only; they are not selectors. Every entry is assigned below. Offscreen elements and plain record/event text are excluded; visible screenshot-only controls are retained in the inventory.

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 82, 83, 86, 106, 115, 128, 189, 193, 195, 196, 199, 201 |
| SH-01 | 2, 3, 4 |
| Excluded: invisible or outside captured inner viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 90, 91, 93, 94, 96, 97, 100, 101, 109, 116, 118, 127, 131, 134, 137, 140, 143, 152, 155, 158, 161, 164, 167, 170, 173, 176, 179, 182, 185, 187, 194, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 251 |
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
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98, 99 |
| SH-34 | 102, 103, 104, 105 |
| D-01 | 107, 108 |
| D-02 | 110, 111 |
| Excluded: record value or field wrapper | 112 |
| D-03 | 113, 114 |
| D-04 | 117 |
| D-05 | 119, 120 |
| D-06 | 121, 122 |
| D-07 | 123, 124 |
| D-08 | 125 |
| D-09 | 126 |
| D-10 | 129, 130 |
| D-11 | 132, 133 |
| D-12 | 135, 136 |
| D-13 | 138, 139 |
| D-14 | 141, 142 |
| D-15 | 144, 145 |
| D-30 | 146 |
| D-16 | 147, 148 |
| D-31 | 149 |
| D-17 | 150, 151 |
| D-18 | 153, 154 |
| D-19 | 156, 157 |
| D-20 | 159, 160 |
| D-21 | 162, 163 |
| D-22 | 165, 166 |
| D-23 | 168, 169 |
| D-24 | 171, 172 |
| D-25 | 174, 175 |
| D-26 | 177, 178 |
| D-27 | 180, 181 |
| D-28 | 183, 184 |
| D-29 | 186 |
| D-32 | 188 |
| D-33 | 190 |
| D-34 | 191 |
| D-35 | 192 |
| D-42 | 197 |
| D-43 | 198 |
| D-44 | 200 |
| D-45 | 202 |
| Excluded: record/event data or decorative event glyph | 203, 204, 205, 206, 207, 208, 210, 211, 212, 214, 215, 216 |
| D-46 | 209, 213 |
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

Screenshot-only controls: SH-46.

### Control inventory — m2d2-detail-timeline-filter

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2d2-detail-timeline-filter) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2d2-detail-timeline-filter) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2d2-detail-timeline-filter) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2d2-detail-timeline-filter) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2d2-detail-timeline-filter) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2d2-detail-timeline-filter) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2d2-detail-timeline-filter) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2d2-detail-timeline-filter) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2d2-detail-timeline-filter) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2d2-detail-timeline-filter) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2d2-detail-timeline-filter) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2d2-detail-timeline-filter) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2d2-detail-timeline-filter) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2d2-detail-timeline-filter) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2d2-detail-timeline-filter) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2d2-detail-timeline-filter) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2d2-detail-timeline-filter) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2d2-detail-timeline-filter) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2d2-detail-timeline-filter) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2d2-detail-timeline-filter) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2d2-detail-timeline-filter) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2d2-detail-timeline-filter) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2d2-detail-timeline-filter) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2d2-detail-timeline-filter) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2d2-detail-timeline-filter) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2d2-detail-timeline-filter) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2d2-detail-timeline-filter) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2d2-detail-timeline-filter) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2d2-detail-timeline-filter) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2d2-detail-timeline-filter) | ? |
| SH-46 | Utility strip | Stacked cards icon | icon button | far right, after Help | not observed | seen (m2d2-detail-timeline-filter) | ? |
| D-01 | Header | Back | icon button | leftmost | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| D-02 | Header | Portrait placeholder | icon button | after Back | not observed | seen (m2d2-detail-timeline-filter) | M6 |
| D-03 | Header | Account record link | link | identity line, after contact identity | not observed | seen (m2d2-detail-timeline-filter) | M3 |
| D-04 | Header | Add Tags | button | below identity | not observed | seen (m2d2-detail-timeline-filter) | M6 |
| D-05 | Header | Send Email | button | right actions, first | not observed | seen (m2d2-detail-timeline-filter) | M10 |
| D-06 | Header | Edit | button | right actions, second | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| D-07 | Header | More Options / three dots | icon button | right actions, third | Opens the action menu (seen in m2d2-detail-more) | seen (m2d2-detail-timeline-filter) | M2 |
| D-08 | Header | Previous Record | icon button | after More Options | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| D-09 | Header | Next Record | icon button | far right | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| D-10 | Related-list rail | Notes | link | rail, row 1 | not observed | seen (m2d2-detail-timeline-filter) | M6 |
| D-11 | Related-list rail | Connected Records | link | rail, row 2 | not observed | seen (m2d2-detail-timeline-filter) | ? |
| D-12 | Related-list rail | Attachments | link | rail, row 3 | not observed | seen (m2d2-detail-timeline-filter) | M6 |
| D-13 | Related-list rail | Cadences | link | rail, row 4 | not observed | seen (m2d2-detail-timeline-filter) | P3 |
| D-14 | Related-list rail | Deals | link | rail, row 5 | not observed | seen (m2d2-detail-timeline-filter) | M4 |
| D-15 | Related-list rail | Open Activities | link | rail, row 6 | not observed | seen (m2d2-detail-timeline-filter) | M5 |
| D-16 | Related-list rail | Closed Activities | link | rail, row 7 | not observed | seen (m2d2-detail-timeline-filter) | M5 |
| D-17 | Related-list rail | Invited Meetings | link | rail, row 8 | not observed | seen (m2d2-detail-timeline-filter) | M5 |
| D-18 | Related-list rail | Products | link | rail, row 9 | not observed | seen (m2d2-detail-timeline-filter) | P2 |
| D-19 | Related-list rail | Cases | link | rail, row 10 | not observed | seen (m2d2-detail-timeline-filter) | M8 |
| D-20 | Related-list rail | Quotes | link | rail, row 11 | not observed | seen (m2d2-detail-timeline-filter) | P2 |
| D-21 | Related-list rail | Sales Orders | link | rail, row 12 | not observed | seen (m2d2-detail-timeline-filter) | P2 |
| D-22 | Related-list rail | Purchase Orders | link | rail, row 13 | not observed | seen (m2d2-detail-timeline-filter) | P2 |
| D-23 | Related-list rail | Emails | link | rail, row 14 | not observed | seen (m2d2-detail-timeline-filter) | M10 |
| D-24 | Related-list rail | Invoices | link | rail, row 15 | not observed | seen (m2d2-detail-timeline-filter) | P2 |
| D-25 | Related-list rail | Campaigns | link | rail, row 16 | not observed | seen (m2d2-detail-timeline-filter) | M7 |
| D-26 | Related-list rail | Social | link | rail, row 17 | not observed | seen (m2d2-detail-timeline-filter) | M15 |
| D-27 | Related-list rail | Reporting Contacts | link | rail, row 18 | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| D-28 | Related-list rail | Voice of the Customer | link | rail, row 19 | not observed | seen (m2d2-detail-timeline-filter) | P3 |
| D-29 | Related-list rail | Add Related List | link | below last related-list link | not observed | seen (m2d2-detail-timeline-filter) | M11 |
| D-30 | Related-list rail | Open Activities count | badge | after Open Activities | not observed | seen (m2d2-detail-timeline-filter) | M5 |
| D-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | not observed | seen (m2d2-detail-timeline-filter) | M5 |
| D-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| D-33 | Tab row | Overview | tab | first tab, unselected | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| D-34 | Tab row | Timeline | tab | second tab, selected | Opens Timeline; History is initially selected | seen (m2d2-detail-timeline-filter) | M2 |
| D-35 | Tab row | Last Update indicator | badge | far right | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| D-42 | Timeline | History | tab | inner tab row, first | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| D-43 | Timeline | Interactions | tab | inner tab row, second | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| D-44 | Timeline | Show Upcoming Automated Actions | button | history toolbar, right | not observed | seen (m2d2-detail-timeline-filter) | M12 |
| D-45 | Timeline | Filter Timeline History | icon button | history toolbar, after heading | Opens the Timeline filter panel (no selection or application) | seen (m2d2-detail-timeline-filter) | M2 |
| D-46 | Timeline | Activity record link | link | call-event description | not observed | seen (m2d2-detail-timeline-filter) | M5 |
| D-47 | Timeline filters | All Modules | select | filter panel, upper row, first | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| D-48 | Timeline filters | All Users | select | filter panel, upper row, second | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| D-49 | Timeline filters | Any Time | select | filter panel, upper row, third | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| D-50 | Timeline filters | All Sources | select | filter panel, lower row, first | not observed | seen (m2d2-detail-timeline-filter) | M2 |
| D-51 | Timeline filters | Apply Filter | button | filter panel, lower row, second | not observed | seen (m2d2-detail-timeline-filter) | M2 |

#### Reconciliation — m2d2-detail-timeline-filter

Item ordinals identify the one-based local controls.json entries only; they are not selectors. Every entry is assigned below. Offscreen elements and plain record/event text are excluded; visible screenshot-only controls are retained in the inventory.

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 82, 83, 86, 106, 115, 128, 189, 193, 195, 196, 199, 201 |
| SH-01 | 2, 3, 4 |
| Excluded: invisible or outside captured inner viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 90, 91, 93, 94, 96, 97, 100, 101, 109, 116, 118, 127, 131, 134, 137, 140, 143, 152, 155, 158, 161, 164, 167, 170, 173, 176, 179, 182, 185, 187, 194, 203, 205, 206, 209, 211, 213, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 264 |
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
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98, 99 |
| SH-34 | 102, 103, 104, 105 |
| D-01 | 107, 108 |
| D-02 | 110, 111 |
| Excluded: record value or field wrapper | 112 |
| D-03 | 113, 114 |
| D-04 | 117 |
| D-05 | 119, 120 |
| D-06 | 121, 122 |
| D-07 | 123, 124 |
| D-08 | 125 |
| D-09 | 126 |
| D-10 | 129, 130 |
| D-11 | 132, 133 |
| D-12 | 135, 136 |
| D-13 | 138, 139 |
| D-14 | 141, 142 |
| D-15 | 144, 145 |
| D-30 | 146 |
| D-16 | 147, 148 |
| D-31 | 149 |
| D-17 | 150, 151 |
| D-18 | 153, 154 |
| D-19 | 156, 157 |
| D-20 | 159, 160 |
| D-21 | 162, 163 |
| D-22 | 165, 166 |
| D-23 | 168, 169 |
| D-24 | 171, 172 |
| D-25 | 174, 175 |
| D-26 | 177, 178 |
| D-27 | 180, 181 |
| D-28 | 183, 184 |
| D-29 | 186 |
| D-32 | 188 |
| D-33 | 190 |
| D-34 | 191 |
| D-35 | 192 |
| D-42 | 197 |
| D-43 | 198 |
| D-44 | 200 |
| D-45 | 202 |
| D-47 | 204 |
| D-48 | 207 |
| Excluded: duplicate structural wrapper; fallback text not painted | 208 |
| D-49 | 210 |
| D-50 | 212 |
| D-51 | 214, 215 |
| Excluded: record/event data or decorative event glyph | 216, 217, 218, 219, 220, 221, 223, 224, 225, 227, 228, 229 |
| D-46 | 222, 226 |
| SH-35 | 253 |
| SH-36 | 254 |
| SH-37 | 255 |
| SH-38 | 256 |
| SH-39 | 257 |
| SH-40 | 258 |
| SH-41 | 259 |
| SH-42 | 260 |
| SH-43 | 261 |
| SH-44 | 262 |
| SH-45 | 263 |

Screenshot-only controls: SH-46.

### Control inventory — m2d2-card-notes

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2d2-card-notes) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2d2-card-notes) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2d2-card-notes) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2d2-card-notes) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2d2-card-notes) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2d2-card-notes) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2d2-card-notes) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2d2-card-notes) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2d2-card-notes) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2d2-card-notes) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2d2-card-notes) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2d2-card-notes) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2d2-card-notes) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2d2-card-notes) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2d2-card-notes) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2d2-card-notes) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2d2-card-notes) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2d2-card-notes) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2d2-card-notes) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2d2-card-notes) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2d2-card-notes) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2d2-card-notes) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2d2-card-notes) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2d2-card-notes) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2d2-card-notes) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2d2-card-notes) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2d2-card-notes) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2d2-card-notes) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2d2-card-notes) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2d2-card-notes) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2d2-card-notes) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2d2-card-notes) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2d2-card-notes) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2d2-card-notes) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2d2-card-notes) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2d2-card-notes) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2d2-card-notes) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2d2-card-notes) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2d2-card-notes) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2d2-card-notes) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2d2-card-notes) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2d2-card-notes) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2d2-card-notes) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2d2-card-notes) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2d2-card-notes) | ? |
| SH-46 | Utility strip | Stacked cards icon | icon button | far right, after Help | not observed | seen (m2d2-card-notes) | ? |
| D-01 | Header | Back | icon button | leftmost | not observed | seen (m2d2-card-notes) | M2 |
| D-02 | Header | Portrait placeholder | icon button | after Back | not observed | seen (m2d2-card-notes) | M6 |
| D-03 | Header | Account record link | link | identity line, after contact identity | not observed | seen (m2d2-card-notes) | M3 |
| D-04 | Header | Add Tags | button | below identity | not observed | seen (m2d2-card-notes) | M6 |
| D-05 | Header | Send Email | button | right actions, first | not observed | seen (m2d2-card-notes) | M10 |
| D-06 | Header | Edit | button | right actions, second | not observed | seen (m2d2-card-notes) | M2 |
| D-07 | Header | More Options / three dots | icon button | right actions, third | Opens the action menu (seen in m2d2-detail-more) | seen (m2d2-card-notes) | M2 |
| D-08 | Header | Previous Record | icon button | after More Options | not observed | seen (m2d2-card-notes) | M2 |
| D-09 | Header | Next Record | icon button | far right | not observed | seen (m2d2-card-notes) | M2 |
| D-10 | Related-list rail | Notes | link | rail, row 1 | Scrolls into the related-card area; the Notes card itself is above the painted area | seen (m2d2-card-notes) | M6 |
| D-11 | Related-list rail | Connected Records | link | rail, row 2 | not observed | seen (m2d2-card-notes) | ? |
| D-12 | Related-list rail | Attachments | link | rail, row 3 | not observed | seen (m2d2-card-notes) | M6 |
| D-13 | Related-list rail | Cadences | link | rail, row 4 | not observed | seen (m2d2-card-notes) | P3 |
| D-14 | Related-list rail | Deals | link | rail, row 5 | not observed | seen (m2d2-card-notes) | M4 |
| D-15 | Related-list rail | Open Activities | link | rail, row 6 | not observed | seen (m2d2-card-notes) | M5 |
| D-16 | Related-list rail | Closed Activities | link | rail, row 7 | not observed | seen (m2d2-card-notes) | M5 |
| D-17 | Related-list rail | Invited Meetings | link | rail, row 8 | not observed | seen (m2d2-card-notes) | M5 |
| D-18 | Related-list rail | Products | link | rail, row 9 | not observed | seen (m2d2-card-notes) | P2 |
| D-19 | Related-list rail | Cases | link | rail, row 10 | not observed | seen (m2d2-card-notes) | M8 |
| D-20 | Related-list rail | Quotes | link | rail, row 11 | not observed | seen (m2d2-card-notes) | P2 |
| D-21 | Related-list rail | Sales Orders | link | rail, row 12 | not observed | seen (m2d2-card-notes) | P2 |
| D-22 | Related-list rail | Purchase Orders | link | rail, row 13 | not observed | seen (m2d2-card-notes) | P2 |
| D-23 | Related-list rail | Emails | link | rail, row 14 | not observed | seen (m2d2-card-notes) | M10 |
| D-24 | Related-list rail | Invoices | link | rail, row 15 | not observed | seen (m2d2-card-notes) | P2 |
| D-25 | Related-list rail | Campaigns | link | rail, row 16 | not observed | seen (m2d2-card-notes) | M7 |
| D-26 | Related-list rail | Social | link | rail, row 17 | not observed | seen (m2d2-card-notes) | M15 |
| D-27 | Related-list rail | Reporting Contacts | link | rail, row 18 | not observed | seen (m2d2-card-notes) | M2 |
| D-28 | Related-list rail | Voice of the Customer | link | rail, row 19 | not observed | seen (m2d2-card-notes) | P3 |
| D-29 | Related-list rail | Add Related List | link | below last related-list link | not observed | seen (m2d2-card-notes) | M11 |
| D-30 | Related-list rail | Open Activities count | badge | after Open Activities | not observed | seen (m2d2-card-notes) | M5 |
| D-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | not observed | seen (m2d2-card-notes) | M5 |
| D-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | not observed | seen (m2d2-card-notes) | M2 |
| D-33 | Tab row | Overview | tab | first tab, selected | not observed | seen (m2d2-card-notes) | M2 |
| D-34 | Tab row | Timeline | tab | second tab | Opens Timeline History (seen in m2d2-detail-timeline) | seen (m2d2-card-notes) | M2 |
| D-35 | Tab row | Last Update indicator | badge | far right | not observed | seen (m2d2-card-notes) | M2 |
| D-52 | Related-list rail | List with lines icon | icon button | after Related List heading | not observed | seen (m2d2-card-notes) | M11 |
| D-53 | Related-list rail | Plus icon | icon button | Notes row, right end | not observed | seen (m2d2-card-notes) | M6 |
| D-54 | Attachments card | Attach / down arrow | button | header, right | not observed | seen (m2d2-card-notes) | M6 |
| D-55 | Cadences card | Enroll | button | header, right | not observed | seen (m2d2-card-notes) | P3 |
| D-56 | Deals card | New Deal | button | header, right | not observed | seen (m2d2-card-notes) | M4 |
| D-57 | Open Activities card | Add New / down arrow | button | header, right group, first | not observed | seen (m2d2-card-notes) | M5 |
| D-58 | Open Activities card | Column View | select | header, right group, second | not observed | seen (m2d2-card-notes) | M5 |
| D-59 | Open Activities card | Table with plus icon | icon button | header, right group, third | not observed | seen (m2d2-card-notes) | M11 |
| D-60 | Open Activities card | Diagonal expand arrows | icon button | header, right group, fourth | not observed | seen (m2d2-card-notes) | M5 |
| D-61 | Open Activities card | Open Tasks count | badge | first visible activity column, after title | not observed | seen (m2d2-card-notes) | M5 |
| D-62 | Open Activities card | Open Meetings count | badge | second visible activity column, after title | not observed | seen (m2d2-card-notes) | M5 |
| D-63 | Record content | Scroll To Top | icon button | floating at lower right | not observed | seen (m2d2-card-notes) | M2 |

#### Reconciliation — m2d2-card-notes

Item ordinals identify the one-based local controls.json entries only; they are not selectors. Every entry is assigned below. Offscreen elements and plain record/event text are excluded; visible screenshot-only controls are retained in the inventory.

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 82, 83, 86, 106, 127, 129, 192, 230, 233, 363, 364, 366, 367 |
| SH-01 | 2, 3, 4 |
| Excluded: invisible or outside captured inner viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 90, 91, 93, 94, 96, 97, 100, 101, 109, 116, 118, 128, 133, 137, 140, 143, 146, 155, 158, 161, 164, 167, 170, 173, 176, 179, 182, 185, 188, 190, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 231, 232, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 365, 368, 369, 370, 371, 375, 393, 395, 398, 402, 403, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543 |
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
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98, 99 |
| SH-34 | 102, 103, 104, 105 |
| D-01 | 107, 108 |
| D-02 | 110, 111 |
| Excluded: record value or field wrapper | 112 |
| D-03 | 113, 114, 115, 246 |
| D-04 | 117 |
| D-05 | 119, 120 |
| D-06 | 121, 122 |
| D-07 | 123, 124 |
| D-08 | 125 |
| D-09 | 126 |
| D-52 | 130 |
| D-10 | 131, 132 |
| D-53 | 134 |
| D-11 | 135, 136 |
| D-12 | 138, 139 |
| D-13 | 141, 142 |
| D-14 | 144, 145 |
| D-15 | 147, 148 |
| D-30 | 149 |
| D-16 | 150, 151 |
| D-31 | 152 |
| D-17 | 153, 154 |
| D-18 | 156, 157 |
| D-19 | 159, 160 |
| D-20 | 162, 163 |
| D-21 | 165, 166 |
| D-22 | 168, 169 |
| D-23 | 171, 172 |
| D-24 | 174, 175 |
| D-25 | 177, 178 |
| D-26 | 180, 181 |
| D-27 | 183, 184 |
| D-28 | 186, 187 |
| D-29 | 189 |
| D-32 | 191 |
| D-33 | 193 |
| D-34 | 194 |
| D-35 | 195 |
| Excluded: duplicate structural wrapper or non-interactive heading/empty-state text | 372, 373, 374, 376, 377, 380, 381, 384, 385, 388, 389, 400, 401, 404, 405 |
| D-54 | 378, 379 |
| D-55 | 382, 383 |
| D-56 | 386, 387 |
| D-57 | 390, 391, 392 |
| D-58 | 394 |
| D-59 | 396, 397 |
| D-60 | 399 |
| D-63 | 523 |
| SH-35 | 544 |
| SH-36 | 545 |
| SH-37 | 546 |
| SH-38 | 547 |
| SH-39 | 548 |
| SH-40 | 549 |
| SH-41 | 550 |
| SH-42 | 551 |
| SH-43 | 552 |
| SH-44 | 553 |
| SH-45 | 554 |

Screenshot-only controls: SH-46, D-61, D-62.

### Control inventory — m2d2-card-connected-records

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2d2-card-connected-records) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2d2-card-connected-records) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2d2-card-connected-records) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2d2-card-connected-records) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2d2-card-connected-records) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2d2-card-connected-records) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2d2-card-connected-records) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2d2-card-connected-records) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2d2-card-connected-records) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2d2-card-connected-records) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2d2-card-connected-records) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2d2-card-connected-records) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2d2-card-connected-records) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2d2-card-connected-records) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2d2-card-connected-records) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2d2-card-connected-records) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2d2-card-connected-records) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2d2-card-connected-records) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2d2-card-connected-records) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2d2-card-connected-records) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2d2-card-connected-records) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2d2-card-connected-records) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2d2-card-connected-records) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2d2-card-connected-records) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2d2-card-connected-records) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2d2-card-connected-records) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2d2-card-connected-records) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2d2-card-connected-records) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2d2-card-connected-records) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2d2-card-connected-records) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2d2-card-connected-records) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2d2-card-connected-records) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2d2-card-connected-records) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2d2-card-connected-records) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2d2-card-connected-records) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2d2-card-connected-records) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2d2-card-connected-records) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2d2-card-connected-records) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2d2-card-connected-records) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2d2-card-connected-records) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2d2-card-connected-records) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2d2-card-connected-records) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2d2-card-connected-records) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2d2-card-connected-records) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2d2-card-connected-records) | ? |
| SH-46 | Utility strip | Stacked cards icon | icon button | far right, after Help | not observed | seen (m2d2-card-connected-records) | ? |
| D-01 | Header | Back | icon button | leftmost | not observed | seen (m2d2-card-connected-records) | M2 |
| D-02 | Header | Portrait placeholder | icon button | after Back | not observed | seen (m2d2-card-connected-records) | M6 |
| D-03 | Header | Account record link | link | identity line, after contact identity | not observed | seen (m2d2-card-connected-records) | M3 |
| D-04 | Header | Add Tags | button | below identity | not observed | seen (m2d2-card-connected-records) | M6 |
| D-05 | Header | Send Email | button | right actions, first | not observed | seen (m2d2-card-connected-records) | M10 |
| D-06 | Header | Edit | button | right actions, second | not observed | seen (m2d2-card-connected-records) | M2 |
| D-07 | Header | More Options / three dots | icon button | right actions, third | Opens the action menu (seen in m2d2-detail-more) | seen (m2d2-card-connected-records) | M2 |
| D-08 | Header | Previous Record | icon button | after More Options | not observed | seen (m2d2-card-connected-records) | M2 |
| D-09 | Header | Next Record | icon button | far right | not observed | seen (m2d2-card-connected-records) | M2 |
| D-10 | Related-list rail | Notes | link | rail, row 1 | Scrolls into the related-card area; the Notes card itself is above the painted area | seen (m2d2-card-connected-records) | M6 |
| D-11 | Related-list rail | Connected Records | link | rail, row 2 | Scrolls to the Connected Records card; the captured body remains in a loading state | seen (m2d2-card-connected-records) | ? |
| D-12 | Related-list rail | Attachments | link | rail, row 3 | not observed | seen (m2d2-card-connected-records) | M6 |
| D-13 | Related-list rail | Cadences | link | rail, row 4 | not observed | seen (m2d2-card-connected-records) | P3 |
| D-14 | Related-list rail | Deals | link | rail, row 5 | not observed | seen (m2d2-card-connected-records) | M4 |
| D-15 | Related-list rail | Open Activities | link | rail, row 6 | not observed | seen (m2d2-card-connected-records) | M5 |
| D-16 | Related-list rail | Closed Activities | link | rail, row 7 | not observed | seen (m2d2-card-connected-records) | M5 |
| D-17 | Related-list rail | Invited Meetings | link | rail, row 8 | not observed | seen (m2d2-card-connected-records) | M5 |
| D-18 | Related-list rail | Products | link | rail, row 9 | not observed | seen (m2d2-card-connected-records) | P2 |
| D-19 | Related-list rail | Cases | link | rail, row 10 | not observed | seen (m2d2-card-connected-records) | M8 |
| D-20 | Related-list rail | Quotes | link | rail, row 11 | not observed | seen (m2d2-card-connected-records) | P2 |
| D-21 | Related-list rail | Sales Orders | link | rail, row 12 | not observed | seen (m2d2-card-connected-records) | P2 |
| D-22 | Related-list rail | Purchase Orders | link | rail, row 13 | not observed | seen (m2d2-card-connected-records) | P2 |
| D-23 | Related-list rail | Emails | link | rail, row 14 | not observed | seen (m2d2-card-connected-records) | M10 |
| D-24 | Related-list rail | Invoices | link | rail, row 15 | not observed | seen (m2d2-card-connected-records) | P2 |
| D-25 | Related-list rail | Campaigns | link | rail, row 16 | not observed | seen (m2d2-card-connected-records) | M7 |
| D-26 | Related-list rail | Social | link | rail, row 17 | not observed | seen (m2d2-card-connected-records) | M15 |
| D-27 | Related-list rail | Reporting Contacts | link | rail, row 18 | not observed | seen (m2d2-card-connected-records) | M2 |
| D-28 | Related-list rail | Voice of the Customer | link | rail, row 19 | not observed | seen (m2d2-card-connected-records) | P3 |
| D-29 | Related-list rail | Add Related List | link | below last related-list link | not observed | seen (m2d2-card-connected-records) | M11 |
| D-30 | Related-list rail | Open Activities count | badge | after Open Activities | not observed | seen (m2d2-card-connected-records) | M5 |
| D-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | not observed | seen (m2d2-card-connected-records) | M5 |
| D-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | not observed | seen (m2d2-card-connected-records) | M2 |
| D-33 | Tab row | Overview | tab | first tab, selected | not observed | seen (m2d2-card-connected-records) | M2 |
| D-34 | Tab row | Timeline | tab | second tab | Opens Timeline History (seen in m2d2-detail-timeline) | seen (m2d2-card-connected-records) | M2 |
| D-35 | Tab row | Last Update indicator | badge | far right | not observed | seen (m2d2-card-connected-records) | M2 |
| D-52 | Related-list rail | List with lines icon | icon button | after Related List heading | not observed | seen (m2d2-card-connected-records) | M11 |
| D-54 | Attachments card | Attach / down arrow | button | header, right | not observed | seen (m2d2-card-connected-records) | M6 |
| D-55 | Cadences card | Enroll | button | header, right | not observed | seen (m2d2-card-connected-records) | P3 |
| D-56 | Deals card | New Deal | button | header, right | not observed | seen (m2d2-card-connected-records) | M4 |
| D-57 | Open Activities card | Add New / down arrow | button | header, right group, first | not observed | seen (m2d2-card-connected-records) | M5 |
| D-58 | Open Activities card | Column View | select | header, right group, second | not observed | seen (m2d2-card-connected-records) | M5 |
| D-59 | Open Activities card | Table with plus icon | icon button | header, right group, third | not observed | seen (m2d2-card-connected-records) | M11 |
| D-60 | Open Activities card | Diagonal expand arrows | icon button | header, right group, fourth | not observed | seen (m2d2-card-connected-records) | M5 |
| D-61 | Open Activities card | Open Tasks count | badge | first visible activity column, after title | not observed | seen (m2d2-card-connected-records) | M5 |
| D-62 | Open Activities card | Open Meetings count | badge | second visible activity column, after title | not observed | seen (m2d2-card-connected-records) | M5 |
| D-63 | Record content | Scroll To Top | icon button | floating at lower right | not observed | seen (m2d2-card-connected-records) | M2 |

#### Reconciliation — m2d2-card-connected-records

Item ordinals identify the one-based local controls.json entries only; they are not selectors. Every entry is assigned below. Offscreen elements and plain record/event text are excluded; visible screenshot-only controls are retained in the inventory.

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 82, 83, 86, 106, 127, 129, 191, 229, 232, 362, 363, 365, 366, 399, 400, 403, 404 |
| SH-01 | 2, 3, 4 |
| Excluded: invisible or outside captured inner viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 90, 91, 93, 94, 96, 97, 100, 101, 109, 116, 118, 128, 133, 136, 139, 142, 145, 154, 157, 160, 163, 166, 169, 172, 175, 178, 181, 184, 187, 189, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 230, 231, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 364, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 379, 380, 383, 384, 387, 388, 392, 394, 397, 401, 402, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 553 |
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
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98, 99 |
| SH-34 | 102, 103, 104, 105 |
| D-01 | 107, 108 |
| D-02 | 110, 111 |
| Excluded: record value or field wrapper | 112 |
| D-03 | 113, 114, 115, 245 |
| D-04 | 117 |
| D-05 | 119, 120 |
| D-06 | 121, 122 |
| D-07 | 123, 124 |
| D-08 | 125 |
| D-09 | 126 |
| D-52 | 130 |
| D-10 | 131, 132 |
| D-11 | 134, 135 |
| D-12 | 137, 138 |
| D-13 | 140, 141 |
| D-14 | 143, 144 |
| D-15 | 146, 147 |
| D-30 | 148 |
| D-16 | 149, 150 |
| D-31 | 151 |
| D-17 | 152, 153 |
| D-18 | 155, 156 |
| D-19 | 158, 159 |
| D-20 | 161, 162 |
| D-21 | 164, 165 |
| D-22 | 167, 168 |
| D-23 | 170, 171 |
| D-24 | 173, 174 |
| D-25 | 176, 177 |
| D-26 | 179, 180 |
| D-27 | 182, 183 |
| D-28 | 185, 186 |
| D-29 | 188 |
| D-32 | 190 |
| D-33 | 192 |
| D-34 | 193 |
| D-35 | 194 |
| D-54 | 377, 378 |
| D-55 | 381, 382 |
| D-56 | 385, 386 |
| D-57 | 389, 390, 391 |
| D-58 | 393 |
| D-59 | 395, 396 |
| D-60 | 398 |
| D-63 | 522 |
| SH-35 | 542 |
| SH-36 | 543 |
| SH-37 | 544 |
| SH-38 | 545 |
| SH-39 | 546 |
| SH-40 | 547 |
| SH-41 | 548 |
| SH-42 | 549 |
| SH-43 | 550 |
| SH-44 | 551 |
| SH-45 | 552 |

Screenshot-only controls: SH-46, D-61, D-62.

### Control inventory — m2d2-card-closed-activities

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2d2-card-closed-activities) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2d2-card-closed-activities) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2d2-card-closed-activities) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2d2-card-closed-activities) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2d2-card-closed-activities) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2d2-card-closed-activities) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2d2-card-closed-activities) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2d2-card-closed-activities) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2d2-card-closed-activities) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2d2-card-closed-activities) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2d2-card-closed-activities) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2d2-card-closed-activities) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2d2-card-closed-activities) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2d2-card-closed-activities) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2d2-card-closed-activities) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2d2-card-closed-activities) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2d2-card-closed-activities) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2d2-card-closed-activities) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2d2-card-closed-activities) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2d2-card-closed-activities) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2d2-card-closed-activities) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2d2-card-closed-activities) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2d2-card-closed-activities) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2d2-card-closed-activities) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2d2-card-closed-activities) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2d2-card-closed-activities) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2d2-card-closed-activities) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2d2-card-closed-activities) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2d2-card-closed-activities) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2d2-card-closed-activities) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2d2-card-closed-activities) | ? |
| SH-46 | Utility strip | Stacked cards icon | icon button | far right, after Help | not observed | seen (m2d2-card-closed-activities) | ? |
| D-01 | Header | Back | icon button | leftmost | not observed | seen (m2d2-card-closed-activities) | M2 |
| D-02 | Header | Portrait placeholder | icon button | after Back | not observed | seen (m2d2-card-closed-activities) | M6 |
| D-03 | Header | Account record link | link | identity line, after contact identity | not observed | seen (m2d2-card-closed-activities) | M3 |
| D-04 | Header | Add Tags | button | below identity | not observed | seen (m2d2-card-closed-activities) | M6 |
| D-05 | Header | Send Email | button | right actions, first | not observed | seen (m2d2-card-closed-activities) | M10 |
| D-06 | Header | Edit | button | right actions, second | not observed | seen (m2d2-card-closed-activities) | M2 |
| D-07 | Header | More Options / three dots | icon button | right actions, third | Opens the action menu (seen in m2d2-detail-more) | seen (m2d2-card-closed-activities) | M2 |
| D-08 | Header | Previous Record | icon button | after More Options | not observed | seen (m2d2-card-closed-activities) | M2 |
| D-09 | Header | Next Record | icon button | far right | not observed | seen (m2d2-card-closed-activities) | M2 |
| D-10 | Related-list rail | Notes | link | rail, row 1 | Scrolls into the related-card area; the Notes card itself is above the painted area | seen (m2d2-card-closed-activities) | M6 |
| D-11 | Related-list rail | Connected Records | link | rail, row 2 | not observed | seen (m2d2-card-closed-activities) | ? |
| D-12 | Related-list rail | Attachments | link | rail, row 3 | not observed | seen (m2d2-card-closed-activities) | M6 |
| D-13 | Related-list rail | Cadences | link | rail, row 4 | not observed | seen (m2d2-card-closed-activities) | P3 |
| D-14 | Related-list rail | Deals | link | rail, row 5 | not observed | seen (m2d2-card-closed-activities) | M4 |
| D-15 | Related-list rail | Open Activities | link | rail, row 6 | not observed | seen (m2d2-card-closed-activities) | M5 |
| D-16 | Related-list rail | Closed Activities | link | rail, row 7 | Scrolls to the Closed Activities card | seen (m2d2-card-closed-activities) | M5 |
| D-17 | Related-list rail | Invited Meetings | link | rail, row 8 | not observed | seen (m2d2-card-closed-activities) | M5 |
| D-18 | Related-list rail | Products | link | rail, row 9 | not observed | seen (m2d2-card-closed-activities) | P2 |
| D-19 | Related-list rail | Cases | link | rail, row 10 | not observed | seen (m2d2-card-closed-activities) | M8 |
| D-20 | Related-list rail | Quotes | link | rail, row 11 | not observed | seen (m2d2-card-closed-activities) | P2 |
| D-21 | Related-list rail | Sales Orders | link | rail, row 12 | not observed | seen (m2d2-card-closed-activities) | P2 |
| D-22 | Related-list rail | Purchase Orders | link | rail, row 13 | not observed | seen (m2d2-card-closed-activities) | P2 |
| D-23 | Related-list rail | Emails | link | rail, row 14 | not observed | seen (m2d2-card-closed-activities) | M10 |
| D-24 | Related-list rail | Invoices | link | rail, row 15 | not observed | seen (m2d2-card-closed-activities) | P2 |
| D-25 | Related-list rail | Campaigns | link | rail, row 16 | not observed | seen (m2d2-card-closed-activities) | M7 |
| D-26 | Related-list rail | Social | link | rail, row 17 | not observed | seen (m2d2-card-closed-activities) | M15 |
| D-27 | Related-list rail | Reporting Contacts | link | rail, row 18 | not observed | seen (m2d2-card-closed-activities) | M2 |
| D-28 | Related-list rail | Voice of the Customer | link | rail, row 19 | not observed | seen (m2d2-card-closed-activities) | P3 |
| D-29 | Related-list rail | Add Related List | link | below last related-list link | not observed | seen (m2d2-card-closed-activities) | M11 |
| D-30 | Related-list rail | Open Activities count | badge | after Open Activities | not observed | seen (m2d2-card-closed-activities) | M5 |
| D-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | not observed | seen (m2d2-card-closed-activities) | M5 |
| D-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | not observed | seen (m2d2-card-closed-activities) | M2 |
| D-33 | Tab row | Overview | tab | first tab, selected | not observed | seen (m2d2-card-closed-activities) | M2 |
| D-34 | Tab row | Timeline | tab | second tab | Opens Timeline History (seen in m2d2-detail-timeline) | seen (m2d2-card-closed-activities) | M2 |
| D-35 | Tab row | Last Update indicator | badge | far right | not observed | seen (m2d2-card-closed-activities) | M2 |
| D-52 | Related-list rail | List with lines icon | icon button | after Related List heading | not observed | seen (m2d2-card-closed-activities) | M11 |
| D-63 | Record content | Scroll To Top | icon button | floating at lower right | not observed | seen (m2d2-card-closed-activities) | M2 |
| D-64 | Closed Activities card | Column View | select | header, right group, first | not observed | seen (m2d2-card-closed-activities) | M5 |
| D-65 | Closed Activities card | Table with plus icon | icon button | header, right group, second | not observed | seen (m2d2-card-closed-activities) | M11 |
| D-66 | Closed Activities card | Diagonal expand arrows | icon button | header, right group, third | not observed | seen (m2d2-card-closed-activities) | M5 |
| D-67 | Closed Activities card | Closed Tasks count | badge | first visible activity column, after title | not observed | seen (m2d2-card-closed-activities) | M5 |
| D-68 | Closed Activities card | Closed Meetings count | badge | second visible activity column, after title | not observed | seen (m2d2-card-closed-activities) | M5 |
| D-69 | Products card | Add Products | button | header, right | not observed | seen (m2d2-card-closed-activities) | P2 |
| D-70 | Cases card | Assign | button | header, right group, first | not observed | seen (m2d2-card-closed-activities) | M8 |
| D-71 | Cases card | New (partly overlapped by Scroll To Top) | button | header, right group, second | not observed | seen (m2d2-card-closed-activities) | M8 |

#### Reconciliation — m2d2-card-closed-activities

Item ordinals identify the one-based local controls.json entries only; they are not selectors. Every entry is assigned below. Offscreen elements and plain record/event text are excluded; visible screenshot-only controls are retained in the inventory.

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 82, 83, 86, 106, 127, 129, 191, 395, 396, 399, 400, 428 |
| SH-01 | 2, 3, 4 |
| Excluded: invisible or outside captured inner viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 90, 91, 93, 94, 96, 97, 100, 101, 109, 116, 118, 128, 133, 136, 139, 142, 145, 154, 157, 160, 163, 166, 169, 172, 175, 178, 181, 184, 187, 189, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 388, 390, 393, 397, 398, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 414, 417, 421, 422, 425, 426, 427, 429, 430, 431, 432, 433, 434, 435, 436, 437, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538 |
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
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98, 99 |
| SH-34 | 102, 103, 104, 105 |
| D-01 | 107, 108 |
| D-02 | 110, 111 |
| Excluded: record value or field wrapper | 112 |
| D-03 | 113, 114, 115, 245 |
| D-04 | 117 |
| D-05 | 119, 120 |
| D-06 | 121, 122 |
| D-07 | 123, 124 |
| D-08 | 125 |
| D-09 | 126 |
| D-52 | 130 |
| D-10 | 131, 132 |
| D-11 | 134, 135 |
| D-12 | 137, 138 |
| D-13 | 140, 141 |
| D-14 | 143, 144 |
| D-15 | 146, 147 |
| D-30 | 148 |
| D-16 | 149, 150 |
| D-31 | 151 |
| D-17 | 152, 153 |
| D-18 | 155, 156 |
| D-19 | 158, 159 |
| D-20 | 161, 162 |
| D-21 | 164, 165 |
| D-22 | 167, 168 |
| D-23 | 170, 171 |
| D-24 | 173, 174 |
| D-25 | 176, 177 |
| D-26 | 179, 180 |
| D-27 | 182, 183 |
| D-28 | 185, 186 |
| D-29 | 188 |
| D-32 | 190 |
| D-33 | 192 |
| D-34 | 193 |
| D-35 | 194 |
| Excluded: scrolled content behind sticky header/tab row | 385, 386, 387, 389, 391, 392, 394 |
| Excluded: duplicate structural wrapper or non-interactive heading/empty-state text | 411, 412, 419, 420, 423, 424, 438, 439, 440, 441, 444, 445 |
| D-64 | 413 |
| D-65 | 415, 416 |
| D-66 | 418 |
| D-69 | 442, 443 |
| D-70 | 446, 447 |
| D-71 | 448, 449 |
| Excluded: below inner viewport or too clipped to identify in screenshot | 450, 451, 452, 453, 454, 455 |
| D-63 | 518 |
| SH-35 | 539 |
| SH-36 | 540 |
| SH-37 | 541 |
| SH-38 | 542 |
| SH-39 | 543 |
| SH-40 | 544 |
| SH-41 | 545 |
| SH-42 | 546 |
| SH-43 | 547 |
| SH-44 | 548 |
| SH-45 | 549 |

Screenshot-only controls: SH-46, D-67, D-68.

### Control inventory — m2d2-card-cases

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2d2-card-cases) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2d2-card-cases) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2d2-card-cases) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2d2-card-cases) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2d2-card-cases) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2d2-card-cases) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2d2-card-cases) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2d2-card-cases) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2d2-card-cases) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2d2-card-cases) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2d2-card-cases) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2d2-card-cases) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2d2-card-cases) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2d2-card-cases) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2d2-card-cases) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2d2-card-cases) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2d2-card-cases) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2d2-card-cases) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2d2-card-cases) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2d2-card-cases) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2d2-card-cases) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2d2-card-cases) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2d2-card-cases) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2d2-card-cases) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2d2-card-cases) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2d2-card-cases) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2d2-card-cases) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2d2-card-cases) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2d2-card-cases) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2d2-card-cases) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2d2-card-cases) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2d2-card-cases) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2d2-card-cases) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2d2-card-cases) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2d2-card-cases) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2d2-card-cases) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2d2-card-cases) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2d2-card-cases) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2d2-card-cases) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2d2-card-cases) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2d2-card-cases) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2d2-card-cases) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2d2-card-cases) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2d2-card-cases) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2d2-card-cases) | ? |
| SH-46 | Utility strip | Stacked cards icon | icon button | far right, after Help | not observed | seen (m2d2-card-cases) | ? |
| D-01 | Header | Back | icon button | leftmost | not observed | seen (m2d2-card-cases) | M2 |
| D-02 | Header | Portrait placeholder | icon button | after Back | not observed | seen (m2d2-card-cases) | M6 |
| D-03 | Header | Account record link | link | identity line, after contact identity | not observed | seen (m2d2-card-cases) | M3 |
| D-04 | Header | Add Tags | button | below identity | not observed | seen (m2d2-card-cases) | M6 |
| D-05 | Header | Send Email | button | right actions, first | not observed | seen (m2d2-card-cases) | M10 |
| D-06 | Header | Edit | button | right actions, second | not observed | seen (m2d2-card-cases) | M2 |
| D-07 | Header | More Options / three dots | icon button | right actions, third | Opens the action menu (seen in m2d2-detail-more) | seen (m2d2-card-cases) | M2 |
| D-08 | Header | Previous Record | icon button | after More Options | not observed | seen (m2d2-card-cases) | M2 |
| D-09 | Header | Next Record | icon button | far right | not observed | seen (m2d2-card-cases) | M2 |
| D-10 | Related-list rail | Notes | link | rail, row 1 | Scrolls into the related-card area; the Notes card itself is above the painted area | seen (m2d2-card-cases) | M6 |
| D-11 | Related-list rail | Connected Records | link | rail, row 2 | not observed | seen (m2d2-card-cases) | ? |
| D-12 | Related-list rail | Attachments | link | rail, row 3 | not observed | seen (m2d2-card-cases) | M6 |
| D-13 | Related-list rail | Cadences | link | rail, row 4 | not observed | seen (m2d2-card-cases) | P3 |
| D-14 | Related-list rail | Deals | link | rail, row 5 | not observed | seen (m2d2-card-cases) | M4 |
| D-15 | Related-list rail | Open Activities | link | rail, row 6 | not observed | seen (m2d2-card-cases) | M5 |
| D-16 | Related-list rail | Closed Activities | link | rail, row 7 | Scrolls to the Closed Activities card | seen (m2d2-card-cases) | M5 |
| D-17 | Related-list rail | Invited Meetings | link | rail, row 8 | not observed | seen (m2d2-card-cases) | M5 |
| D-18 | Related-list rail | Products | link | rail, row 9 | not observed | seen (m2d2-card-cases) | P2 |
| D-19 | Related-list rail | Cases | link | rail, row 10 | Scrolls to the Cases card | seen (m2d2-card-cases) | M8 |
| D-20 | Related-list rail | Quotes | link | rail, row 11 | not observed | seen (m2d2-card-cases) | P2 |
| D-21 | Related-list rail | Sales Orders | link | rail, row 12 | not observed | seen (m2d2-card-cases) | P2 |
| D-22 | Related-list rail | Purchase Orders | link | rail, row 13 | not observed | seen (m2d2-card-cases) | P2 |
| D-23 | Related-list rail | Emails | link | rail, row 14 | not observed | seen (m2d2-card-cases) | M10 |
| D-24 | Related-list rail | Invoices | link | rail, row 15 | not observed | seen (m2d2-card-cases) | P2 |
| D-25 | Related-list rail | Campaigns | link | rail, row 16 | not observed | seen (m2d2-card-cases) | M7 |
| D-26 | Related-list rail | Social | link | rail, row 17 | not observed | seen (m2d2-card-cases) | M15 |
| D-27 | Related-list rail | Reporting Contacts | link | rail, row 18 | not observed | seen (m2d2-card-cases) | M2 |
| D-28 | Related-list rail | Voice of the Customer | link | rail, row 19 | not observed | seen (m2d2-card-cases) | P3 |
| D-29 | Related-list rail | Add Related List | link | below last related-list link | not observed | seen (m2d2-card-cases) | M11 |
| D-30 | Related-list rail | Open Activities count | badge | after Open Activities | not observed | seen (m2d2-card-cases) | M5 |
| D-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | not observed | seen (m2d2-card-cases) | M5 |
| D-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | not observed | seen (m2d2-card-cases) | M2 |
| D-33 | Tab row | Overview | tab | first tab, selected | not observed | seen (m2d2-card-cases) | M2 |
| D-34 | Tab row | Timeline | tab | second tab | Opens Timeline History (seen in m2d2-detail-timeline) | seen (m2d2-card-cases) | M2 |
| D-35 | Tab row | Last Update indicator | badge | far right | not observed | seen (m2d2-card-cases) | M2 |
| D-52 | Related-list rail | List with lines icon | icon button | after Related List heading | not observed | seen (m2d2-card-cases) | M11 |
| D-63 | Record content | Scroll To Top | icon button | floating at lower right | not observed | seen (m2d2-card-cases) | M2 |
| D-70 | Cases card | Assign | button | header, right group, first | not observed | seen (m2d2-card-cases) | M8 |
| D-71 | Cases card | New | button | header, right group, second | not observed | seen (m2d2-card-cases) | M8 |
| D-72 | Related-list rail | Plus icon | icon button | Cases row, right end | not observed | seen (m2d2-card-cases) | M8 |
| D-73 | Quotes card | Assign | button | header, right group, first | not observed | seen (m2d2-card-cases) | P2 |
| D-74 | Quotes card | New | button | header, right group, second | not observed | seen (m2d2-card-cases) | P2 |
| D-75 | Sales Orders card | Assign | button | header, right group, first | not observed | seen (m2d2-card-cases) | P2 |
| D-76 | Sales Orders card | New | button | header, right group, second | not observed | seen (m2d2-card-cases) | P2 |
| D-77 | Purchase Orders card | Assign | button | header, right group, first | not observed | seen (m2d2-card-cases) | P2 |
| D-78 | Purchase Orders card | New | button | header, right group, second | not observed | seen (m2d2-card-cases) | P2 |
| D-79 | Emails card | Compose Email | button | header, right | not observed | seen (m2d2-card-cases) | M10 |
| D-80 | Emails card | Mails | tab | below header, first, selected | not observed | seen (m2d2-card-cases) | M10 |
| D-81 | Emails card | Drafts | tab | below header, second | not observed | seen (m2d2-card-cases) | M10 |
| D-82 | Emails card | Scheduled | tab | below header, third | not observed | seen (m2d2-card-cases) | M10 |

#### Reconciliation — m2d2-card-cases

Item ordinals identify the one-based local controls.json entries only; they are not selectors. Every entry is assigned below. Offscreen elements and plain record/event text are excluded; visible screenshot-only controls are retained in the inventory.

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 82, 83, 86, 106, 127, 129, 192 |
| SH-01 | 2, 3, 4 |
| Excluded: invisible or outside captured inner viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 90, 91, 93, 94, 96, 97, 100, 101, 109, 116, 118, 128, 133, 136, 139, 142, 145, 154, 157, 160, 164, 167, 170, 173, 176, 179, 182, 185, 188, 190, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 441, 442, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502 |
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
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98, 99 |
| SH-34 | 102, 103, 104, 105 |
| D-01 | 107, 108 |
| D-02 | 110, 111 |
| Excluded: record value or field wrapper | 112 |
| D-03 | 113, 114, 115, 246 |
| D-04 | 117 |
| D-05 | 119, 120 |
| D-06 | 121, 122 |
| D-07 | 123, 124 |
| D-08 | 125 |
| D-09 | 126 |
| D-52 | 130 |
| D-10 | 131, 132 |
| D-11 | 134, 135 |
| D-12 | 137, 138 |
| D-13 | 140, 141 |
| D-14 | 143, 144 |
| D-15 | 146, 147 |
| D-30 | 148 |
| D-16 | 149, 150 |
| D-31 | 151 |
| D-17 | 152, 153 |
| D-18 | 155, 156 |
| D-19 | 158, 159 |
| D-72 | 161 |
| D-20 | 162, 163 |
| D-21 | 165, 166 |
| D-22 | 168, 169 |
| D-23 | 171, 172 |
| D-24 | 174, 175 |
| D-25 | 177, 178 |
| D-26 | 180, 181 |
| D-27 | 183, 184 |
| D-28 | 186, 187 |
| D-29 | 189 |
| D-32 | 191 |
| D-33 | 193 |
| D-34 | 194 |
| D-35 | 195 |
| Excluded: scrolled content behind sticky header/tab row | 406, 407 |
| Excluded: duplicate structural wrapper or non-interactive heading/empty-state text | 408, 409, 414, 415, 420, 421, 426, 427, 432, 433, 434, 435 |
| D-70 | 410, 411 |
| D-71 | 412, 413 |
| D-73 | 416, 417 |
| D-74 | 418, 419 |
| D-75 | 422, 423 |
| D-76 | 424, 425 |
| D-77 | 428, 429 |
| D-78 | 430, 431 |
| D-79 | 436, 437 |
| D-80 | 438 |
| D-81 | 439 |
| D-82 | 440 |
| Excluded: below inner viewport or too clipped to identify in screenshot | 443, 444, 445, 446, 447, 448 |
| D-63 | 482 |
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

Screenshot-only controls: SH-46.

### Control inventory — m2d2-card-invoices

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2d2-card-invoices) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2d2-card-invoices) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2d2-card-invoices) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2d2-card-invoices) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2d2-card-invoices) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2d2-card-invoices) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2d2-card-invoices) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2d2-card-invoices) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2d2-card-invoices) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2d2-card-invoices) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2d2-card-invoices) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2d2-card-invoices) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2d2-card-invoices) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2d2-card-invoices) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2d2-card-invoices) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2d2-card-invoices) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2d2-card-invoices) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2d2-card-invoices) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2d2-card-invoices) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2d2-card-invoices) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2d2-card-invoices) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2d2-card-invoices) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2d2-card-invoices) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2d2-card-invoices) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2d2-card-invoices) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2d2-card-invoices) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2d2-card-invoices) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2d2-card-invoices) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2d2-card-invoices) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2d2-card-invoices) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2d2-card-invoices) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2d2-card-invoices) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2d2-card-invoices) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2d2-card-invoices) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2d2-card-invoices) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2d2-card-invoices) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2d2-card-invoices) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2d2-card-invoices) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2d2-card-invoices) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2d2-card-invoices) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2d2-card-invoices) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2d2-card-invoices) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2d2-card-invoices) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2d2-card-invoices) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2d2-card-invoices) | ? |
| SH-46 | Utility strip | Stacked cards icon | icon button | far right, after Help | not observed | seen (m2d2-card-invoices) | ? |
| D-01 | Header | Back | icon button | leftmost | not observed | seen (m2d2-card-invoices) | M2 |
| D-02 | Header | Portrait placeholder | icon button | after Back | not observed | seen (m2d2-card-invoices) | M6 |
| D-03 | Header | Account record link | link | identity line, after contact identity | not observed | seen (m2d2-card-invoices) | M3 |
| D-04 | Header | Add Tags | button | below identity | not observed | seen (m2d2-card-invoices) | M6 |
| D-05 | Header | Send Email | button | right actions, first | not observed | seen (m2d2-card-invoices) | M10 |
| D-06 | Header | Edit | button | right actions, second | not observed | seen (m2d2-card-invoices) | M2 |
| D-07 | Header | More Options / three dots | icon button | right actions, third | Opens the action menu (seen in m2d2-detail-more) | seen (m2d2-card-invoices) | M2 |
| D-08 | Header | Previous Record | icon button | after More Options | not observed | seen (m2d2-card-invoices) | M2 |
| D-09 | Header | Next Record | icon button | far right | not observed | seen (m2d2-card-invoices) | M2 |
| D-10 | Related-list rail | Notes | link | rail, row 1 | Scrolls into the related-card area; the Notes card itself is above the painted area | seen (m2d2-card-invoices) | M6 |
| D-11 | Related-list rail | Connected Records | link | rail, row 2 | not observed | seen (m2d2-card-invoices) | ? |
| D-12 | Related-list rail | Attachments | link | rail, row 3 | not observed | seen (m2d2-card-invoices) | M6 |
| D-13 | Related-list rail | Cadences | link | rail, row 4 | not observed | seen (m2d2-card-invoices) | P3 |
| D-14 | Related-list rail | Deals | link | rail, row 5 | not observed | seen (m2d2-card-invoices) | M4 |
| D-15 | Related-list rail | Open Activities | link | rail, row 6 | not observed | seen (m2d2-card-invoices) | M5 |
| D-16 | Related-list rail | Closed Activities | link | rail, row 7 | Scrolls to the Closed Activities card | seen (m2d2-card-invoices) | M5 |
| D-17 | Related-list rail | Invited Meetings | link | rail, row 8 | not observed | seen (m2d2-card-invoices) | M5 |
| D-18 | Related-list rail | Products | link | rail, row 9 | not observed | seen (m2d2-card-invoices) | P2 |
| D-19 | Related-list rail | Cases | link | rail, row 10 | Scrolls to the Cases card | seen (m2d2-card-invoices) | M8 |
| D-20 | Related-list rail | Quotes | link | rail, row 11 | not observed | seen (m2d2-card-invoices) | P2 |
| D-21 | Related-list rail | Sales Orders | link | rail, row 12 | not observed | seen (m2d2-card-invoices) | P2 |
| D-22 | Related-list rail | Purchase Orders | link | rail, row 13 | not observed | seen (m2d2-card-invoices) | P2 |
| D-23 | Related-list rail | Emails | link | rail, row 14 | not observed | seen (m2d2-card-invoices) | M10 |
| D-24 | Related-list rail | Invoices | link | rail, row 15 | Scrolls to the Invoices card | seen (m2d2-card-invoices) | P2 |
| D-25 | Related-list rail | Campaigns | link | rail, row 16 | not observed | seen (m2d2-card-invoices) | M7 |
| D-26 | Related-list rail | Social | link | rail, row 17 | not observed | seen (m2d2-card-invoices) | M15 |
| D-27 | Related-list rail | Reporting Contacts | link | rail, row 18 | not observed | seen (m2d2-card-invoices) | M2 |
| D-28 | Related-list rail | Voice of the Customer | link | rail, row 19 | not observed | seen (m2d2-card-invoices) | P3 |
| D-29 | Related-list rail | Add Related List | link | below last related-list link | not observed | seen (m2d2-card-invoices) | M11 |
| D-30 | Related-list rail | Open Activities count | badge | after Open Activities | not observed | seen (m2d2-card-invoices) | M5 |
| D-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | not observed | seen (m2d2-card-invoices) | M5 |
| D-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | not observed | seen (m2d2-card-invoices) | M2 |
| D-33 | Tab row | Overview | tab | first tab, selected | not observed | seen (m2d2-card-invoices) | M2 |
| D-34 | Tab row | Timeline | tab | second tab | Opens Timeline History (seen in m2d2-detail-timeline) | seen (m2d2-card-invoices) | M2 |
| D-35 | Tab row | Last Update indicator | badge | far right | not observed | seen (m2d2-card-invoices) | M2 |
| D-52 | Related-list rail | List with lines icon | icon button | after Related List heading | not observed | seen (m2d2-card-invoices) | M11 |
| D-63 | Record content | Scroll To Top | icon button | floating at lower right | not observed | seen (m2d2-card-invoices) | M2 |
| D-83 | Related-list rail | Plus icon | icon button | Invoices row, right end | not observed | seen (m2d2-card-invoices) | P2 |
| D-84 | Invoices card | Assign | button | header, right group, first | not observed | seen (m2d2-card-invoices) | P2 |
| D-85 | Invoices card | New | button | header, right group, second | not observed | seen (m2d2-card-invoices) | P2 |
| D-86 | Campaigns card | Add Campaigns | button | header, right | not observed | seen (m2d2-card-invoices) | M7 |
| D-87 | Social card | Associate Twitter | link | left panel, first | not observed | seen (m2d2-card-invoices) | M15 |
| D-88 | Social card | Associate Facebook | link | left panel, second | not observed | seen (m2d2-card-invoices) | M15 |

#### Reconciliation — m2d2-card-invoices

Item ordinals identify the one-based local controls.json entries only; they are not selectors. Every entry is assigned below. Offscreen elements and plain record/event text are excluded; visible screenshot-only controls are retained in the inventory.

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 82, 83, 86, 106, 127, 129, 192 |
| SH-01 | 2, 3, 4 |
| Excluded: invisible or outside captured inner viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 90, 91, 93, 94, 96, 97, 100, 101, 109, 116, 118, 128, 133, 136, 139, 142, 145, 154, 157, 160, 163, 166, 169, 172, 175, 179, 182, 185, 188, 190, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 443, 444, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 515 |
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
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98, 99 |
| SH-34 | 102, 103, 104, 105 |
| D-01 | 107, 108 |
| D-02 | 110, 111 |
| Excluded: record value or field wrapper | 112 |
| D-03 | 113, 114, 115, 246 |
| D-04 | 117 |
| D-05 | 119, 120 |
| D-06 | 121, 122 |
| D-07 | 123, 124 |
| D-08 | 125 |
| D-09 | 126 |
| D-52 | 130 |
| D-10 | 131, 132 |
| D-11 | 134, 135 |
| D-12 | 137, 138 |
| D-13 | 140, 141 |
| D-14 | 143, 144 |
| D-15 | 146, 147 |
| D-30 | 148 |
| D-16 | 149, 150 |
| D-31 | 151 |
| D-17 | 152, 153 |
| D-18 | 155, 156 |
| D-19 | 158, 159 |
| D-20 | 161, 162 |
| D-21 | 164, 165 |
| D-22 | 167, 168 |
| D-23 | 170, 171 |
| D-24 | 173, 174 |
| D-83 | 176 |
| D-25 | 177, 178 |
| D-26 | 180, 181 |
| D-27 | 183, 184 |
| D-28 | 186, 187 |
| D-29 | 189 |
| D-32 | 191 |
| D-33 | 193 |
| D-34 | 194 |
| D-35 | 195 |
| Excluded: scrolled content behind sticky header/tab row | 438, 439, 440, 441, 442 |
| Excluded: duplicate structural wrapper or non-interactive heading/empty-state text | 445, 446, 451, 452, 455, 456, 457 |
| D-84 | 447, 448 |
| D-85 | 449, 450 |
| D-86 | 453, 454 |
| D-87 | 458, 459 |
| D-88 | 460, 461 |
| D-63 | 484 |
| SH-35 | 504 |
| SH-36 | 505 |
| SH-37 | 506 |
| SH-38 | 507 |
| SH-39 | 508 |
| SH-40 | 509 |
| SH-41 | 510 |
| SH-42 | 511 |
| SH-43 | 512 |
| SH-44 | 513 |
| SH-45 | 514 |

Screenshot-only controls: SH-46.

### Control inventory — m2d2-card-reporting-contacts

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2d2-card-reporting-contacts) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2d2-card-reporting-contacts) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2d2-card-reporting-contacts) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2d2-card-reporting-contacts) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2d2-card-reporting-contacts) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2d2-card-reporting-contacts) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2d2-card-reporting-contacts) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2d2-card-reporting-contacts) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2d2-card-reporting-contacts) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2d2-card-reporting-contacts) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2d2-card-reporting-contacts) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2d2-card-reporting-contacts) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2d2-card-reporting-contacts) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2d2-card-reporting-contacts) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2d2-card-reporting-contacts) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2d2-card-reporting-contacts) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2d2-card-reporting-contacts) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2d2-card-reporting-contacts) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2d2-card-reporting-contacts) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2d2-card-reporting-contacts) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2d2-card-reporting-contacts) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2d2-card-reporting-contacts) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2d2-card-reporting-contacts) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2d2-card-reporting-contacts) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2d2-card-reporting-contacts) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2d2-card-reporting-contacts) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2d2-card-reporting-contacts) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2d2-card-reporting-contacts) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2d2-card-reporting-contacts) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2d2-card-reporting-contacts) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2d2-card-reporting-contacts) | ? |
| SH-46 | Utility strip | Stacked cards icon | icon button | far right, after Help | not observed | seen (m2d2-card-reporting-contacts) | ? |
| D-01 | Header | Back | icon button | leftmost | not observed | seen (m2d2-card-reporting-contacts) | M2 |
| D-02 | Header | Portrait placeholder | icon button | after Back | not observed | seen (m2d2-card-reporting-contacts) | M6 |
| D-03 | Header | Account record link | link | identity line, after contact identity | not observed | seen (m2d2-card-reporting-contacts) | M3 |
| D-04 | Header | Add Tags | button | below identity | not observed | seen (m2d2-card-reporting-contacts) | M6 |
| D-05 | Header | Send Email | button | right actions, first | not observed | seen (m2d2-card-reporting-contacts) | M10 |
| D-06 | Header | Edit | button | right actions, second | not observed | seen (m2d2-card-reporting-contacts) | M2 |
| D-07 | Header | More Options / three dots | icon button | right actions, third | Opens the action menu (seen in m2d2-detail-more) | seen (m2d2-card-reporting-contacts) | M2 |
| D-08 | Header | Previous Record | icon button | after More Options | not observed | seen (m2d2-card-reporting-contacts) | M2 |
| D-09 | Header | Next Record | icon button | far right | not observed | seen (m2d2-card-reporting-contacts) | M2 |
| D-10 | Related-list rail | Notes | link | rail, row 1 | Scrolls into the related-card area; the Notes card itself is above the painted area | seen (m2d2-card-reporting-contacts) | M6 |
| D-11 | Related-list rail | Connected Records | link | rail, row 2 | not observed | seen (m2d2-card-reporting-contacts) | ? |
| D-12 | Related-list rail | Attachments | link | rail, row 3 | not observed | seen (m2d2-card-reporting-contacts) | M6 |
| D-13 | Related-list rail | Cadences | link | rail, row 4 | not observed | seen (m2d2-card-reporting-contacts) | P3 |
| D-14 | Related-list rail | Deals | link | rail, row 5 | not observed | seen (m2d2-card-reporting-contacts) | M4 |
| D-15 | Related-list rail | Open Activities | link | rail, row 6 | not observed | seen (m2d2-card-reporting-contacts) | M5 |
| D-16 | Related-list rail | Closed Activities | link | rail, row 7 | Scrolls to the Closed Activities card | seen (m2d2-card-reporting-contacts) | M5 |
| D-17 | Related-list rail | Invited Meetings | link | rail, row 8 | not observed | seen (m2d2-card-reporting-contacts) | M5 |
| D-18 | Related-list rail | Products | link | rail, row 9 | not observed | seen (m2d2-card-reporting-contacts) | P2 |
| D-19 | Related-list rail | Cases | link | rail, row 10 | Scrolls to the Cases card | seen (m2d2-card-reporting-contacts) | M8 |
| D-20 | Related-list rail | Quotes | link | rail, row 11 | not observed | seen (m2d2-card-reporting-contacts) | P2 |
| D-21 | Related-list rail | Sales Orders | link | rail, row 12 | not observed | seen (m2d2-card-reporting-contacts) | P2 |
| D-22 | Related-list rail | Purchase Orders | link | rail, row 13 | not observed | seen (m2d2-card-reporting-contacts) | P2 |
| D-23 | Related-list rail | Emails | link | rail, row 14 | not observed | seen (m2d2-card-reporting-contacts) | M10 |
| D-24 | Related-list rail | Invoices | link | rail, row 15 | Scrolls to the Invoices card | seen (m2d2-card-reporting-contacts) | P2 |
| D-25 | Related-list rail | Campaigns | link | rail, row 16 | not observed | seen (m2d2-card-reporting-contacts) | M7 |
| D-26 | Related-list rail | Social | link | rail, row 17 | not observed | seen (m2d2-card-reporting-contacts) | M15 |
| D-27 | Related-list rail | Reporting Contacts | link | rail, row 18 | Scrolls to Reporting Contacts; the last card and record-page footer are visible | seen (m2d2-card-reporting-contacts) | M2 |
| D-28 | Related-list rail | Voice of the Customer | link | rail, row 19 | not observed | seen (m2d2-card-reporting-contacts) | P3 |
| D-29 | Related-list rail | Add Related List | link | below last related-list link | not observed | seen (m2d2-card-reporting-contacts) | M11 |
| D-30 | Related-list rail | Open Activities count | badge | after Open Activities | not observed | seen (m2d2-card-reporting-contacts) | M5 |
| D-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | not observed | seen (m2d2-card-reporting-contacts) | M5 |
| D-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | not observed | seen (m2d2-card-reporting-contacts) | M2 |
| D-33 | Tab row | Overview | tab | first tab, selected | not observed | seen (m2d2-card-reporting-contacts) | M2 |
| D-34 | Tab row | Timeline | tab | second tab | Opens Timeline History (seen in m2d2-detail-timeline) | seen (m2d2-card-reporting-contacts) | M2 |
| D-35 | Tab row | Last Update indicator | badge | far right | not observed | seen (m2d2-card-reporting-contacts) | M2 |
| D-52 | Related-list rail | List with lines icon | icon button | after Related List heading | not observed | seen (m2d2-card-reporting-contacts) | M11 |
| D-63 | Record content | Scroll To Top | icon button | floating at lower right | not observed | seen (m2d2-card-reporting-contacts) | M2 |
| D-89 | Related-list rail | Plus icon | icon button | Reporting Contacts row, right end | not observed | seen (m2d2-card-reporting-contacts) | M2 |
| D-90 | Reporting Contacts card | Hierarchy View | button | header, after title | not observed | seen (m2d2-card-reporting-contacts) | M2 |
| D-91 | Reporting Contacts card | New | button | header, right | not observed | seen (m2d2-card-reporting-contacts) | M2 |
| D-92 | Voice of the Customer card | Enable feature | button | body, below introductory text | not observed | seen (m2d2-card-reporting-contacts) | P3 |
| D-93 | Record-page footer | Add Related List | button | footer, left | not observed | seen (m2d2-card-reporting-contacts) | M11 |
| D-94 | Record-page footer | Standard View | select | footer, right group, first | not observed | seen (m2d2-card-reporting-contacts) | M11 |
| D-95 | Record-page footer | Create a custom record page | button | footer, right group, second | not observed | seen (m2d2-card-reporting-contacts) | M11 |

#### Reconciliation — m2d2-card-reporting-contacts

Item ordinals identify the one-based local controls.json entries only; they are not selectors. Every entry is assigned below. Offscreen elements and plain record/event text are excluded; visible screenshot-only controls are retained in the inventory.

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 35, 37, 51, 59, 62, 82, 83, 86, 106, 127, 129, 192, 464 |
| SH-01 | 2, 3, 4 |
| Excluded: invisible or outside captured inner viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 90, 91, 93, 94, 96, 97, 100, 101, 109, 116, 118, 128, 133, 136, 139, 142, 145, 154, 157, 160, 163, 166, 169, 172, 175, 178, 181, 184, 188, 190, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283, 284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 294, 295, 296, 297, 298, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 309, 310, 311, 312, 313, 314, 315, 316, 317, 318, 319, 320, 321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333, 334, 335, 336, 337, 338, 339, 340, 341, 342, 343, 344, 345, 346, 347, 348, 349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361, 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 416, 417, 418, 419, 420, 421, 422, 424, 425, 426, 427, 428, 429, 430, 432, 433, 434, 435, 436, 437, 438, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 459, 460, 461, 462, 463, 465, 466, 467, 468, 469, 470, 471, 484, 485, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 524 |
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
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98, 99 |
| SH-34 | 102, 103, 104, 105 |
| D-01 | 107, 108 |
| D-02 | 110, 111 |
| Excluded: record value or field wrapper | 112 |
| D-03 | 113, 114, 115, 246 |
| D-04 | 117 |
| D-05 | 119, 120 |
| D-06 | 121, 122, 415, 423, 431, 439, 458 |
| D-07 | 123, 124 |
| D-08 | 125 |
| D-09 | 126 |
| D-52 | 130 |
| D-10 | 131, 132 |
| D-11 | 134, 135 |
| D-12 | 137, 138 |
| D-13 | 140, 141 |
| D-14 | 143, 144 |
| D-15 | 146, 147 |
| D-30 | 148 |
| D-16 | 149, 150 |
| D-31 | 151 |
| D-17 | 152, 153 |
| D-18 | 155, 156 |
| D-19 | 158, 159 |
| D-20 | 161, 162 |
| D-21 | 164, 165 |
| D-22 | 167, 168 |
| D-23 | 170, 171 |
| D-24 | 173, 174 |
| D-25 | 176, 177 |
| D-26 | 179, 180 |
| D-27 | 182, 183 |
| D-89 | 185 |
| D-28 | 186, 187 |
| D-29 | 189 |
| D-32 | 191 |
| D-33 | 193 |
| D-34 | 194 |
| D-35 | 195 |
| Excluded: duplicate structural wrapper or non-interactive heading/introductory text | 472, 473, 477, 478, 479, 480, 486 |
| D-90 | 474 |
| D-91 | 475, 476 |
| D-92 | 481, 482, 483 |
| D-93 | 487 |
| D-94 | 488, 489, 490 |
| D-95 | 491, 492 |
| D-63 | 493 |
| SH-35 | 513 |
| SH-36 | 514 |
| SH-37 | 515 |
| SH-38 | 516 |
| SH-39 | 517 |
| SH-40 | 518 |
| SH-41 | 519 |
| SH-42 | 520 |
| SH-43 | 521 |
| SH-44 | 522 |
| SH-45 | 523 |

Screenshot-only controls: SH-46.

### Control inventory — m2d2-list-after

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L-01 | View strip | All Contacts | tab | left, first | not observed | seen (m2d2-list-after) | M2 |
| L-02 | View strip | Three dots icon | icon button | after current view tab | not observed | seen (m2d2-list-after) | M2 |
| L-03 | Toolbar | Filter | button | left group, first | not observed | seen (m2d2-list-after) | M2 |
| L-04 | Toolbar | Sort | button | left group, second | not observed | seen (m2d2-list-after) | M2 |
| L-05 | Toolbar | List view icon | icon button | view group, first | not observed | seen (m2d2-list-after) | M2 |
| L-06 | Toolbar | Kanban view icon | icon button | view group, second | not observed | seen (m2d2-list-after) | M2 |
| L-07 | Toolbar | Sheet view icon | icon button | view group, third | not observed | seen (m2d2-list-after) | M2 |
| L-08 | Toolbar | Chart view icon | icon button | view group, fourth | not observed | seen (m2d2-list-after) | M2 |
| L-09 | Toolbar | Timeline view icon | icon button | view group, fifth | not observed | seen (m2d2-list-after) | M2 |
| L-10 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | not observed | seen (m2d2-list-after) | M2 |
| L-11 | Toolbar | Down chevron | icon button | view group, seventh | not observed | seen (m2d2-list-after) | M2 |
| L-12 | Toolbar | Create Contact | button | right group, first | not observed | seen (m2d2-list-after) | M2 |
| L-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Contact | not observed | seen (m2d2-list-after) | M6 |
| L-14 | Toolbar | Three dots / Actions | icon button | right group, far right | not observed | seen (m2d2-list-after) | M2 |
| L-15 | Filter panel | Search | input | below Filter Contacts by heading | not observed | seen (m2d2-list-after) | M2 |
| L-16 | Filter panel | System Defined Filters | toggle | first section heading | not observed | seen (m2d2-list-after) | M2 |
| L-17 | Filter panel | Activities | checkbox | system-defined section, Activities | not observed | seen (m2d2-list-after) | M5 |
| L-18 | Filter panel | Campaigns | checkbox | system-defined section, Campaigns | not observed | seen (m2d2-list-after) | M7 |
| L-19 | Filter panel | Latest Email Status | checkbox | system-defined section, Latest Email Status | not observed | seen (m2d2-list-after) | M10 |
| L-20 | Filter panel | Locked | checkbox | system-defined section, Locked | not observed | seen (m2d2-list-after) | M2 |
| L-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | not observed | seen (m2d2-list-after) | M2 |
| L-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | not observed | seen (m2d2-list-after) | M2 |
| L-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | not observed | seen (m2d2-list-after) | M2 |
| L-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | not observed | seen (m2d2-list-after) | M2 |
| L-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | not observed | seen (m2d2-list-after) | P3 |
| L-26 | Filter panel | Filter By Fields | toggle | second section heading | not observed | seen (m2d2-list-after) | M2 |
| L-27 | Filter panel | Account Name | checkbox | field section, Account Name | not observed | seen (m2d2-list-after) | M3 |
| L-28 | Filter panel | Assistant | checkbox | field section, Assistant | not observed | seen (m2d2-list-after) | M2 |
| L-29 | Filter panel | Asst Phone | checkbox | field section, Asst Phone | not observed | seen (m2d2-list-after) | M2 |
| L-30 | Filter panel | Connected To | checkbox | field section, Connected To | not observed | seen (m2d2-list-after) | M2 |
| L-31 | Filter panel | Contact Name | checkbox | field section, Contact Name | not observed | seen (m2d2-list-after) | M2 |
| L-32 | Filter panel | Contact Owner (partly clipped) | checkbox | field section, Contact Owner (partly clipped) | not observed | seen (m2d2-list-after) | M2 |
| L-33 | Table | Sliders icon | icon button | header, far right overlay | not observed | seen (m2d2-list-after) | M11 |
| L-34 | Table | Select all checkbox | checkbox | header, before activity column | not observed | seen (m2d2-list-after) | M2 |
| L-35 | Table | Contact Name | column header | first text column | not observed | seen (m2d2-list-after) | M2 |
| L-36 | Table | All with down arrow | select | within Contact Name header, right | not observed | seen (m2d2-list-after) | M2 |
| L-37 | Table | Account Name | column header | second text column | not observed | seen (m2d2-list-after) | M3 |
| L-38 | Table | Email | column header | third text column | not observed | seen (m2d2-list-after) | M2 |
| L-39 | Table | Phone (partly clipped) | column header | fourth text column, right edge | not observed | seen (m2d2-list-after) | M2 |
| L-40 | Table | Record selection checkbox | checkbox | each visible row, before activity column | not observed | seen (m2d2-list-after) | M2 |
| L-41 | Table | Call activity flag | badge | rows with activity, before Contact Name | not observed | seen (m2d2-list-after) | M5 |
| L-42 | Table | Contact record link | link | Contact Name cells | Opens the Contact detail (seen in m2d2-detail-more) | seen (m2d2-list-after) | M2 |
| L-43 | Table | Account record link | link | Account Name cells | not observed | seen (m2d2-list-after) | M3 |
| L-44 | Table | Email address link | link | Email cells | not observed | seen (m2d2-list-after) | M10 |
| L-48 | List footer | Total Records | badge | left | not observed | seen (m2d2-list-after) | M2 |
| L-49 | List footer | Displayed record range | badge | right group, between arrows | not observed | seen (m2d2-list-after) | M2 |
| L-50 | List footer | Previous | icon button | right group, before range | not observed | seen (m2d2-list-after) | M2 |
| L-51 | List footer | Next | icon button | right group, after range | not observed | seen (m2d2-list-after) | M2 |
| SH-01 | Rail | Product selector | select | header, left | not observed | seen (m2d2-list-after) | ? |
| SH-02 | Rail | Hide Menu | icon button | header, right | not observed | seen (m2d2-list-after) | M1 |
| SH-03 | Rail | Home | link | pinned group, Home | not observed | seen (m2d2-list-after) | M14 |
| SH-04 | Rail | Workqueue | link | pinned group, Workqueue | not observed | seen (m2d2-list-after) | M14 |
| SH-05 | Rail | Reports | link | pinned group, Reports | not observed | seen (m2d2-list-after) | M13 |
| SH-06 | Rail | Analytics | link | pinned group, Analytics | not observed | seen (m2d2-list-after) | M13 |
| SH-07 | Rail | Agents | link | pinned group, Agents | not observed | seen (m2d2-list-after) | P3 |
| SH-08 | Rail | MCP Server | link | pinned group, MCP Server | not observed | seen (m2d2-list-after) | P3 |
| SH-09 | Rail | Teamspace selector | select | teamspace header, left | not observed | seen (m2d2-list-after) | M11 |
| SH-10 | Rail | More Actions | icon button | teamspace header, right | not observed | seen (m2d2-list-after) | M11 |
| SH-11 | Rail | Search | input | below teamspace header | not observed | seen (m2d2-list-after) | M1 |
| SH-12 | Rail | Sales | toggle | first navigation group | not observed | seen (m2d2-list-after) | M1 |
| SH-13 | Rail | Leads | link | Sales group, Leads | not observed | seen (m2d2-list-after) | M1 |
| SH-14 | Rail | Contacts | link | Sales group, Contacts | not observed | seen (m2d2-list-after) | M2 |
| SH-15 | Rail | Accounts | link | Sales group, Accounts | not observed | seen (m2d2-list-after) | M3 |
| SH-16 | Rail | Deals | link | Sales group, Deals | not observed | seen (m2d2-list-after) | M4 |
| SH-17 | Rail | Documents | link | Sales group, Documents | not observed | seen (m2d2-list-after) | M9 |
| SH-18 | Rail | Campaigns | link | Sales group, Campaigns | not observed | seen (m2d2-list-after) | M7 |
| SH-19 | Rail | Activities | toggle | second navigation group | not observed | seen (m2d2-list-after) | M5 |
| SH-20 | Rail | Tasks | link | Activities group, Tasks | not observed | seen (m2d2-list-after) | M5 |
| SH-21 | Rail | Meetings | link | Activities group, Meetings | not observed | seen (m2d2-list-after) | M5 |
| SH-22 | Rail | Calls | link | Activities group, Calls | not observed | seen (m2d2-list-after) | M5 |
| SH-23 | Rail | Integrations | toggle | third navigation group | not observed | seen (m2d2-list-after) | M15 |
| SH-24 | Rail | Visits | link | Integrations group | not observed | seen (m2d2-list-after) | M15 |
| SH-25 | Rail | Price Books | link | bottom visible rail row | not observed | seen (m2d2-list-after) | P2 |
| SH-26 | Top bar | Search records | button | right group, first | not observed | seen (m2d2-list-after) | ? |
| SH-27 | Top bar | Plus icon | icon button | right group, after search | not observed | seen (m2d2-list-after) | M1 |
| SH-28 | Top bar | Assistant shortcut | icon button | right group, after plus | not observed | seen (m2d2-list-after) | P3 |
| SH-29 | Top bar | Notifications | icon button | right group, after assistant | not observed | seen (m2d2-list-after) | ? |
| SH-30 | Top bar | Calendar | icon button | right group, after notifications | not observed | seen (m2d2-list-after) | M10 |
| SH-31 | Top bar | Marketplace | icon button | right group, after calendar | not observed | seen (m2d2-list-after) | ? |
| SH-32 | Top bar | Setup | icon button | right group, after marketplace | not observed | seen (m2d2-list-after) | M11 |
| SH-33 | Top bar | Profile | icon button | right group, after setup | not observed | seen (m2d2-list-after) | ? |
| SH-34 | Top bar | Applications menu | icon button | right group, far right | not observed | seen (m2d2-list-after) | ? |
| SH-35 | Utility strip | My Pins | icon button | left group, first | not observed | seen (m2d2-list-after) | ? |
| SH-36 | Utility strip | Chats | icon button | left group, second | not observed | seen (m2d2-list-after) | ? |
| SH-37 | Utility strip | Contacts | icon button | left group, third | not observed | seen (m2d2-list-after) | ? |
| SH-38 | Utility strip | Document with small clock icon | icon button | right group, first | not observed | seen (m2d2-list-after) | ? |
| SH-39 | Utility strip | Announcements | icon button | right group, second | not observed | seen (m2d2-list-after) | ? |
| SH-40 | Utility strip | Chart with notification dot icon | icon button | right group, third | not observed | seen (m2d2-list-after) | ? |
| SH-41 | Utility strip | Square with corner arrow icon | icon button | right group, fourth | not observed | seen (m2d2-list-after) | ? |
| SH-42 | Utility strip | Activity Reminders | icon button | right group, fifth | not observed | seen (m2d2-list-after) | M5 |
| SH-43 | Utility strip | Recent Items | icon button | right group, sixth | not observed | seen (m2d2-list-after) | M1 |
| SH-44 | Utility strip | Accessibility | icon button | right group, seventh | not observed | seen (m2d2-list-after) | ? |
| SH-45 | Utility strip | Help | icon button | right group, eighth | not observed | seen (m2d2-list-after) | ? |
| SH-46 | Utility strip | Stacked cards icon | icon button | far right, after Help | not observed | seen (m2d2-list-after) | ? |
| L-45 | Table | Row three dots icon | icon button | highlighted row, before selection checkbox, first | not observed | seen (m2d2-list-after) | M2 |
| L-46 | Table | Row note bubble icon | icon button | highlighted row, before selection checkbox, second | not observed | seen (m2d2-list-after) | M6 |
| L-47 | Table | Row pulse icon | icon button | highlighted row, after selection checkbox | not observed | seen (m2d2-list-after) | ? |

#### Reconciliation — m2d2-list-after

Item ordinals identify the one-based local controls.json entries only; they are not selectors. Every entry is assigned below. Offscreen elements and plain record/event text are excluded; visible screenshot-only controls are retained in the inventory.

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 4, 35, 37, 51, 59, 62, 82, 83, 87, 111, 114, 116, 119, 127, 128, 135, 137, 140, 160, 283, 284, 288, 289, 292, 293, 295, 296, 307, 308, 311, 317, 319, 323, 324, 327, 332, 334, 338, 339, 342, 347, 349, 353, 354, 357, 363, 365, 369, 372, 375, 381, 383, 387, 388, 397, 399, 403, 404, 407, 413, 414, 418, 419, 422, 427, 429, 433, 434, 443, 444, 448, 449, 452, 458, 460, 464, 465, 474, 476, 480, 481, 484, 487, 489, 491, 495, 496, 499, 505, 507, 511, 512, 515, 520, 522 |
| SH-01 | 2, 3 |
| Excluded: invisible or outside captured inner viewport | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 84, 91, 92, 94, 95, 97, 98, 101, 102, 107, 108, 109, 110, 134, 138, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264, 265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 286, 287, 303, 304, 320, 321, 335, 336, 350, 351, 366, 367, 384, 385, 400, 401, 415, 416, 430, 431, 445, 446, 461, 462, 477, 478, 492, 493, 508, 509, 514, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660, 661, 662, 663, 664, 665, 666, 667, 668, 669, 670, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686, 687, 688, 689, 690, 691 |
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
| L-01 | 112 |
| L-02 | 113, 115 |
| L-03 | 117 |
| L-04 | 118 |
| L-05 | 120 |
| L-06 | 121 |
| L-07 | 122 |
| L-08 | 123 |
| L-09 | 124 |
| L-10 | 125 |
| L-11 | 126 |
| Excluded: target not painted in screenshot | 129 |
| L-12 | 130 |
| L-13 | 131, 132 |
| L-14 | 133 |
| L-15 | 136 |
| L-16 | 139 |
| L-17 | 141 |
| Excluded: duplicate native input represented by its filter checkbox wrapper | 142, 144, 146, 148, 150, 152, 154, 156, 158, 162, 164, 166, 168, 170, 172 |
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
| Excluded: record data or table structure | 290, 291, 305, 306, 313, 315, 322, 328, 330, 337, 343, 345, 352, 359, 361, 368, 377, 379, 386, 391, 393, 395, 402, 409, 411, 417, 423, 425, 432, 437, 439, 441, 447, 454, 456, 463, 468, 470, 472, 479, 485, 494, 501, 503, 510, 516, 518 |
| L-34 | 294 |
| L-35 | 297 |
| L-36 | 298, 299 |
| L-37 | 300 |
| L-38 | 301 |
| L-39 | 302 |
| L-40 | 309, 310, 325, 326, 340, 341, 355, 356, 373, 374, 389, 390, 405, 406, 420, 421, 435, 436, 450, 451, 466, 467, 482, 483, 497, 498 |
| L-41 | 312, 358, 392, 408, 438, 453, 469, 500 |
| L-42 | 314, 329, 344, 360, 378, 394, 410, 424, 440, 455, 471, 486, 502 |
| L-43 | 316, 331, 346, 362, 380, 396, 412, 426, 442, 457, 473, 488, 504 |
| L-44 | 318, 333, 348, 364, 382, 398, 428, 459, 475, 490, 506 |
| L-45 | 370 |
| L-46 | 371 |
| L-47 | 376 |
| Excluded: record row behind fixed list footer or below table viewport | 513, 517, 519, 521 |
| L-48 | 671 |
| L-49 | 672 |
| L-50 | 673 |
| L-51 | 674 |
| SH-35 | 692 |
| SH-36 | 693 |
| SH-37 | 694 |
| SH-38 | 695 |
| SH-39 | 696 |
| SH-40 | 697 |
| SH-41 | 698 |
| SH-42 | 699 |
| SH-43 | 700 |
| SH-44 | 701 |
| SH-45 | 702 |

Screenshot-only controls: SH-46, L-04.

### Shell controls missing from app-shell.md

Reuse the gaps recorded in contacts.md: the Motivator shortcut, Sticky Notes, far-right stacked-cards icon and unresolved document-with-clock utility icon. No additional shell control was visible here. The Contacts utility shortcut and Contacts module link remain separate controls. Unknown shell ownership (`?`) remains an open question inherited from contacts.md.

## More Options and Timeline

More Options opens the fifteen-row menu inventoried as D-07.1–D-07.15 in m2d2-detail-more. Separators divide Clone/Share/Delete, Print Preview/Find and Merge Duplicates/Mail Merge, and the remaining actions. No row was selected; downstream flows are not observed.

Timeline opens History with an Interactions sibling tab (m2d2-detail-timeline). The history toolbar contains Filter Timeline History and Show Upcoming Automated Actions. History groups events by date, with times, decorative event-type glyphs and activity record links. Record values, actor names and event descriptions are not reproduced. Interactions, activity-link navigation and upcoming-action expansion were not exercised.

Filter Timeline History opens a panel (m2d2-detail-timeline-filter). The upper row contains Modules/All Modules, Users/All Users and Time/Any Time. The lower row contains Sources/All Sources and Apply Filter. No dropdown was opened, no value was changed and Apply Filter was not clicked. The first attempt produced no evidence files; the exact command succeeded on the one permitted retry after two minutes.

The header and main tab row show no additional named menu-opening control in the captured states. Rail visibility and Hide Details are prohibited preference controls; their activation remains not observed.

## Differences from Leads record detail

- The identity line includes an Account record link. Account Name also appears as a truncated link in the visible Contact Information column. Navigation through either link was not exercised.
- There is no Convert button among the observed header actions. Send Email, Edit, More Options and previous/next arrows remain. No separate Send Email dropdown arrow is painted in this capture.
- No Lead Status strip precedes the business card. The five business-card labels are Contact Owner, Email, Phone, Mobile and Department; Department replaces Lead Status. Empty visible values use a dash.
- The details heading is Contact Information. Visible left-column labels begin Contact Owner, Account Name, Email, Phone and a partly clipped Other Phone. Visible right-column labels begin Lead Source, Contact Name, Vendor Name, Title and Department. This is a screenshot description, not a second field-definition table.
- The related-list rail includes Deals, Cases, Quotes, Sales Orders, Purchase Orders, Invoices and Reporting Contacts in addition to shared entries. The visible activity entries have count badges; their record values are not reproduced.
- Reporting To exists in the exported Contacts field table, but its detail presentation remains not observed. Reporting Contacts is now observed as a card with Hierarchy View, New and an empty body; its relationship flow was not opened.
- More Options includes Organize Contact Details and Contacts-specific related-record capabilities; menu visibility is observed, activation is not. The final footer has Add Related List, Standard View and Create a custom record page.

## Related-list cards

The rail order is retained below. `Seen` describes only the painted captured state; no card action was activated. Absence of a counter or header action applies to that screenshot, not every possible populated state. Card record rows are outside this research scope. Plain card titles and empty-state text are structure, not separate action controls.

| Order | Card title | Module | Title | Counter | Upper controls | Empty/loading state | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Notes | M6 | not observed | not observed | not observed | not observed | Rail D-10 seen; its jump did not paint the Notes card |
| 2 | Connected Records | ? | seen | no counter painted | no action painted | loading only; settled/empty state not observed | m2d2-card-notes; m2d2-card-connected-records |
| 3 | Attachments | M6 | seen | no counter painted | Attach / down arrow (D-54) | seen: no attachment | m2d2-card-notes |
| 4 | Cadences | P3 | seen | no counter painted | Enroll (D-55) | seen: no records | m2d2-card-notes |
| 5 | Deals | M4 | seen | no counter painted | New Deal (D-56) | seen: no records | m2d2-card-notes |
| 6 | Open Activities | M5 | seen | Tasks and Meetings count badges seen (D-61–D-62); Calls outside horizontal viewport | Add New / down arrow, Column View, table with plus, expand arrows (D-57–D-60) | seen: empty Tasks and Meetings columns; Calls body not observed | m2d2-card-notes |
| 7 | Closed Activities | M5 | seen | Tasks and Meetings count badges seen (D-67–D-68); Calls outside horizontal viewport | Column View, table with plus, expand arrows (D-64–D-66) | seen: empty Tasks and Meetings columns; Calls body not observed | m2d2-card-closed-activities |
| 8 | Invited Meetings | M5 | seen | no counter painted | no action painted | seen: no records | m2d2-card-closed-activities |
| 9 | Products | P2 | seen | no counter painted | Add Products (D-69) | seen: no records | m2d2-card-closed-activities |
| 10 | Cases | M8 | seen | no counter painted | Assign, New (D-70–D-71) | seen: no records | m2d2-card-cases |
| 11 | Quotes | P2 | seen | no counter painted | Assign, New (D-73–D-74) | seen: no records | m2d2-card-cases |
| 12 | Sales Orders | P2 | seen | no counter painted | Assign, New (D-75–D-76) | seen: no records | m2d2-card-cases |
| 13 | Purchase Orders | P2 | seen | no counter painted | Assign, New (D-77–D-78) | seen: no records | m2d2-card-cases |
| 14 | Emails | M10 | seen | no counter painted | Compose Email (D-79); Mails/Drafts/Scheduled tabs (D-80–D-82) | seen: no records in initially selected Mails; other tabs not opened | m2d2-card-cases |
| 15 | Invoices | P2 | seen | no counter painted | Assign, New (D-84–D-85) | seen: no records | m2d2-card-invoices |
| 16 | Campaigns | M7 | seen | no counter painted | Add Campaigns (D-86) | seen: no records | m2d2-card-invoices |
| 17 | Social | M15 | seen | no counter painted | no header action painted; Associate Twitter/Associate Facebook links in left body (D-87–D-88) | seen: unassociated-profile panel and guidance; no association attempted | m2d2-card-invoices |
| 18 | Reporting Contacts | M2 | seen | no counter painted | Hierarchy View, New (D-90–D-91) | seen: no records | m2d2-card-reporting-contacts |
| 19 | Voice of the Customer | P3 | seen | no counter painted | no header action painted; Enable feature in body (D-92) | seen: feature-introduction state; no activation attempted | m2d2-card-reporting-contacts |

The first Notes jump painted Connected Records and the following cards, with the Notes card above the visible area. Connected Records received one redundant dedicated capture; it adds no new card controls. Separate captures were omitted for cards whose title and upper controls were already fully visible. Cases received a dedicated capture because its New button was partly covered by the floating Scroll To Top control in the preceding image.

### Record-page footer and edges

m2d2-card-reporting-contacts shows Add Related List (D-93) on the left, then the Record detail page views label, Standard View (D-94) and Create a custom record page (D-95) at the right. D-93 is distinct from the rail Add Related List link D-29. None was activated. The floating Scroll To Top control is D-63; it was not clicked. The rail scroll track, fixed tab row, rightmost card controls and complete shared utility strip were checked as part of each screenshot scan.

## Capability table

| Capability | Module | Evidence / limit |
| --- | --- | --- |
| Open a Contact from its list link | M2 | m2d-detail-main and continuation captures; one record inspected |
| Back/previous/next and Edit | M2 | D-01, D-06, D-08–D-09; visible only, navigation/editing not exercised |
| More Options menu | M2 / M9 / M11 / M12 / P3 | D-07 and D-07.1–D-07.15; menu opened, no row selected |
| Account links in header and detail | M3 | D-03, D-39; navigation not observed |
| Portrait, Add Tags and Notes-row plus | M6 | D-02, D-04, D-53; no write action exercised |
| Send Email, email links and email card controls | M10 | D-05, D-36, D-40, D-79–D-82; not activated |
| Phone call icons | M5 | D-37, D-41; screenshot-only, not activated |
| Overview / Timeline and last-update indicator | M2 | D-33–D-35; Timeline History content observed |
| History / Interactions and activity links | M2 / M5 | D-42–D-43, D-46; History initially selected, other actions not exercised |
| Timeline filter panel | M2 | D-45, D-47–D-51; panel opened, options and applied results not observed |
| Upcoming automated actions | M12 | D-44 visible; expansion not observed |
| Related-list navigation | As assigned above | D-10, D-11, D-16, D-19, D-24, D-27 exercised; other links not clicked because their cards were already painted |
| Related-list cards, counters and actions | As assigned above | Table above and D-54–D-92; Notes card remains not observed; no card action activated |
| Rail visibility, Hide Details, card view/customization/expand | M2 / M5 / M11 | D-32, D-38, D-58–D-60, D-64–D-66; preference controls not exercised |
| Organize details and record-page customization footer | M11 | D-52, D-93–D-95; presence only |
| Add Related List in rail | M11 | D-29; not activated |
| Scroll To Top | M2 | D-63; visible only |
| Lower Contact Information, Reporting To, Address and Description | M2 | not observed; authorized jumps paint card regions instead |
| Hover-only controls | M2 / M6 / later modules | L-45–L-47 incidentally painted in list-after; selected rail-row plus controls seen; field pencils and other hover actions remain not observed |


## Capture refs

| Slug | Requested clicks | Skipped | What it shows |
| --- | --- | --- | --- |
| m2d-list-base | 0 | 0 | Original populated list baseline |
| m2d-detail-main | 1 | 0 | Original header, rail, business card and start of Contact Information |
| m2d-list-after | 0 | 0 | Original closing list |
| m2d2-list-base | 0 | 0 | Continuation opening list |
| m2d2-detail-more | 2 | 0 | Fifteen-row More Options menu |
| m2d2-detail-timeline | 2 | 0 | Timeline History |
| m2d2-detail-timeline-filter | 3 | 0 | Timeline filter panel; one successful retry |
| m2d2-card-notes | 2 | 0 | Connected Records loading; Attachments, Cadences, Deals; Open Activities header |
| m2d2-card-connected-records | 2 | 0 | Same card region; redundant capture |
| m2d2-card-closed-activities | 2 | 0 | Closed Activities, Invited Meetings, Products and partly overlapped Cases action |
| m2d2-card-cases | 2 | 0 | Cases, Quotes, Sales Orders, Purchase Orders, Emails |
| m2d2-card-invoices | 2 | 0 | Invoices, Campaigns, Social |
| m2d2-card-reporting-contacts | 2 | 0 | Reporting Contacts, Voice of the Customer, record-page footer |
| m2d2-list-after | 0 | 0 | Unchanged total and unselected list; incidental row action icons |

All eleven successful continuation screenshots were opened as images and scanned across the full frame. Every continuation controls.json entry has an inventory number or an explicit exclusion in its reconciliation table. Screenshot-only call controls, activity count badges and the far-right utility icon are included. The initial filter attempt created no evidence files and is not a separate observed state.

The opening and closing list totals are equal and the records remain unselected. Selectors were sourced from the approved baseline controls or the Timeline capture and validated offline for exactly one matching element. No alternate selector, forbidden open override, dropdown selection, explicit hover or write action was used.

Safety: the CTO decision of 2026-10-11 treats baseline detail-opening non-GET calls as automatic read loading; this continuation compares paths and counts and permits the task's blocked labelled telemetry. Every successful capture was checked and commented before the next capture. No new non-telemetry non-GET path, excess baseline count, sent telemetry or successful record write was found.

## Open questions

1. Notes card title, counter, upper controls and empty state remain not observed: its authorized rail jump painted the following card region. No repeat or alternate selector was used to recover that state.
2. Lower Contact Information (including Reporting To), Address and Description remain not observed. No separately named permitted section-jump control was identified, and the first card capture did not paint preceding details. Their field presentation is not inferred from metadata or offscreen DOM controls.
3. Connected Records remained in a loading state in both captures. Its settled state, actions, counter and module ownership (`?`) remain open. The initial screenshot shows no header action; this does not establish settled-state absence.
4. Open and Closed Calls columns fall outside the horizontal activity viewport; their counters and card controls are not observed. No horizontal scrolling or preference action was attempted. Card contents/record-row data remain outside scope.
5. Interactions content, upcoming automated actions, filter-dropdown options, applied filter results, all menu-item outcomes and unclicked navigation remain not observed. Write success/error states are not observable without a write in this capture workflow.
6. Field pencils, portrait hover controls, card collapse affordances and other hover-only actions remain not observed. Row action icons and selected rail-row plus controls were incidentally painted and inventoried; their activation remains not observed.
7. Previous/next ordering and boundaries, back and Account-link navigation remain unobserved. Persisted-preference controls, including Hide Details, rail visibility, activity view/expand/customization and record-page view changes, were not exercised.
8. Shared-shell ownership gaps and the row pulse icon ownership (`?`, L-47) are inherited from contacts.md. No additional shell control was found; D-52 belongs to the record rail, not the shared application shell.

No board decision is requested directly. UI Lead evaluates the remaining evidence gaps and module ownership during approval; unobserved states must not be treated as implementation evidence.
