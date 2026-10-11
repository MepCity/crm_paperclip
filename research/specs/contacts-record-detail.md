# Contacts — record detail

Status: partial research stopped under the capture safety rule; submitted for inventory review and UI Lead safety/scope decision. This is not a complete implementation baseline.

## Purpose

Describe observed Contacts record-detail differences from [record-detail.md](record-detail.md). Field definitions, metadata layouts and SH/L control numbers remain in [contacts.md](contacts.md); they are not repeated as field tables. Only the captured record was inspected. No write or persistent preference control was exercised.

## Layout

The shared rail and top bar surround a record header. The header contains a back arrow, initial portrait placeholder, contact identity followed by an Account link, Add Tags, right-aligned actions and previous/next arrows. Below it, the Related List rail is left of the Overview/Timeline tabs and Last Update indicator. Overview starts directly with a five-field business card, followed by the expanded details card. The captured screen shows only the start of Contact Information. The shared utility strip remains at the bottom.

The tool requested a full-page screenshot, but the inner content scroller did not expand: lower fields, related-list cards and the record-page customization footer are outside the image. Their presence in controls.json is not counted as painted evidence. No scrolling click was invented.

## Control inventory

SH and L numbers reuse the approved Contacts list inventory. Shell controls are listed by those existing numbers for screenshot reconciliation, not assigned new numbers. Repeated links and row controls share one structural number. `seen` records presence only; unclicked behaviour is `not observed`. No menu item was selected.

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
| D-07 | Header | More Options / three dots | icon button | right actions, third | not observed | seen (m2d-detail-main) | M2 |
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
| D-34 | Tab row | Timeline | tab | second tab | not observed | seen (m2d-detail-main) | M2 |
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

### Shell controls missing from app-shell.md

Reuse the gaps recorded in contacts.md: the Motivator shortcut, Sticky Notes, far-right stacked-cards icon and unresolved document-with-clock utility icon. No additional shell control was visible here. The Contacts utility shortcut and Contacts module link remain separate controls. Unknown shell ownership (`?`) remains an open question inherited from contacts.md.

## Differences from Leads record detail

- The identity line includes an Account record link. Account Name also appears as a truncated link in the visible Contact Information column. Navigation through either link was not exercised.
- There is no Convert button among the observed header actions. Send Email, Edit, More Options and previous/next arrows remain. No separate Send Email dropdown arrow is painted in this capture.
- No Lead Status strip precedes the business card. The five business-card labels are Contact Owner, Email, Phone, Mobile and Department; Department replaces Lead Status. Empty visible values use a dash.
- The details heading is Contact Information. Visible left-column labels begin Contact Owner, Account Name, Email, Phone and a partly clipped Other Phone. Visible right-column labels begin Lead Source, Contact Name, Vendor Name, Title and Department. This is a screenshot description, not a second field-definition table.
- The related-list rail includes Deals, Cases, Quotes, Sales Orders, Purchase Orders, Invoices and Reporting Contacts in addition to shared entries. The visible activity entries have count badges; their record values are not reproduced.
- Reporting To exists in the exported Contacts field table, but its detail presentation is below the captured viewport and not observed. Reporting Contacts is observed as a rail link only.

## Related-list cards

The rail establishes the following order. Every card is included as an unobserved card below; card headers, counters, buttons, populated rows and empty states are **not observed in the screenshot**. The inner scroller clips all cards. Do not implement offscreen controls from controls.json as if visually confirmed; use a later authorized research continuation. Metadata-only related lists remain in contacts.md.

| Order | Rail title / corresponding card | Module | Card screenshot evidence |
| --- | --- | --- | --- |
| 1 | Notes | M6 | not observed; rail D-10 seen |
| 2 | Connected Records | ? | not observed; rail D-11 seen |
| 3 | Attachments | M6 | not observed; rail D-12 seen |
| 4 | Cadences | P3 | not observed; rail D-13 seen |
| 5 | Deals | M4 | not observed; rail D-14 seen |
| 6 | Open Activities | M5 | not observed; rail D-15 seen |
| 7 | Closed Activities | M5 | not observed; rail D-16 seen |
| 8 | Invited Meetings | M5 | not observed; rail D-17 seen |
| 9 | Products | P2 | not observed; rail D-18 seen |
| 10 | Cases | M8 | not observed; rail D-19 seen |
| 11 | Quotes | P2 | not observed; rail D-20 seen |
| 12 | Sales Orders | P2 | not observed; rail D-21 seen |
| 13 | Purchase Orders | P2 | not observed; rail D-22 seen |
| 14 | Emails | M10 | not observed; rail D-23 seen |
| 15 | Invoices | P2 | not observed; rail D-24 seen |
| 16 | Campaigns | M7 | not observed; rail D-25 seen |
| 17 | Social | M15 | not observed; rail D-26 seen |
| 18 | Reporting Contacts | M2 | not observed; rail D-27 seen |
| 19 | Voice of the Customer | P3 | not observed; rail D-28 seen |

## Capability table

| Capability | Module | Evidence / limit |
| --- | --- | --- |
| Open a Contact from its list link | M2 | m2d-detail-main; one record opened |
| Identity, back/previous/next, Edit and More Options | M2 | D-01, D-06–D-09; presence only, activation not observed |
| Account links in header and detail | M3 | D-03, D-39; navigation not observed |
| Portrait and Add Tags | M6 | D-02, D-04; write actions not exercised |
| Send Email and email links | M10 | D-05, D-36, D-40; not activated |
| Phone call icons | M5 | D-37, D-41; screenshot-only, not activated |
| Overview / Timeline tabs and last-update indicator | M2 | D-33–D-35; Overview seen, Timeline content not observed |
| Related-list rail and activity badges | As assigned above | D-10–D-31; no link activated |
| Rail visibility and Hide Details | M2 | D-32, D-38; persisted-preference actions prohibited |
| Add Related List | M11 | D-29; not activated |
| Lower details, card actions, empty states and record-page footer | As assigned above | not observed; clipped by inner viewport |
| More Options menu, Timeline filters and other header/tab menus | M2 / later modules | not observed; stopped before menu captures |
| Field pencils and hover-only record controls | M2 | not observed; tool has no authorized hover step |

## Capture refs

| Slug | Requested clicks | Skipped | What it shows |
| --- | --- | --- | --- |
| m2d-list-base | 0 | 0 | Populated Contacts list and shared shell |
| m2d-detail-main | 1 | 0 | Contact header, related-list rail, Overview business card and top of details |
| m2d-list-after | 0 | 0 | Same list structure, total and unselected state |

All three screenshot.png files were opened as images and scanned across the whole frame. List total and selection state are unchanged before/after. The record selector was sourced from the base controls.json and checked offline for a single match. No alternate selector or forbidden open override was used.

The required safety comparison detected new non-GET paths on the detail capture: `POST /crm/<org>/EntityCustomization.do` returned 200, and `POST /crm/v4/Contacts/<record>/actions/get_related_records_count` was blocked. The detail capture also contains `POST /crm/v2.2/Contacts/bulk` for a related-record query, which returned 204. This bulk path exists in the base capture for list loading (200), but the related-record query is additional detail-opening evidence; a path-only comparison does not distinguish those uses. No query values, record identifiers or payload contents are reproduced here. These status codes do not establish whether data changed. Later menu captures were not attempted; only the required after capture followed. No evidence establishes that a record or preference changed. This partial spec must not open the implementation gate.

## Open questions

1. UI Lead must decide the safety/scope of the new non-GET detail-opening calls under task rule 5 and return this task for an authorized continuation if appropriate. No new capture should be inferred as approved by this partial handoff.
2. More Options menu contents, Timeline contents and filter controls, and any other menu-opening header/tab controls are not observed because research stopped. No labels or items are invented.
3. Lower Contact Information (including Reporting To), Address/Description sections, every related-list card header/count/action/empty state, right edge and record-page footer remain outside the screenshot despite full-page capture. An approved means of observing the inner scroller is needed.
4. Field pencils, portrait hover controls and related-list hover actions are not observed. Their behaviour remains open.
5. Previous/next ordering and boundaries, back navigation, account-link navigation, successful/error write states and every unclicked action remain unobserved. Persisted-preference controls cannot be exercised.
6. Unknown shared-shell module assignments are inherited from contacts.md. Connected Records module ownership is `?` in the approved Contacts metadata inventory; its record-linking flow was not opened.

No board decision is requested directly in this handoff; the domain lead evaluates the stop evidence first.

