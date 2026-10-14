# Deals — record detail

Status: upper detail and two related-card viewports observed. Further card navigation stopped under the capture network rule; incomplete scope is explicit. Submitted for independent inventory and safety review. Module 4 / MEP-346 and MEP-347.

## Purpose

Describe the observed upper Deals detail, stage bar, More Options and Timeline. Reuse [accounts-record-detail.md](accounts-record-detail.md), then [contacts-record-detail.md](contacts-record-detail.md) and [record-detail.md](record-detail.md) for shared behaviour. Exported fields, stages and relations remain in [deals.md](deals.md). MEP-347 observes Notes through Competitors and Cadences through the Products header; lower field sections and remaining cards remain not observed; stage-changing flows belong to MEP-353. No write was attempted.

## Layout

The shared shell surrounds a header with Back, deal identity, a dash and Amount, and Add Tags below. No portrait placeholder or account/website link is painted in the header. Send Email, Edit and More Options form the right action group; previous/next record arrows are not painted. Their navigation read was blocked by the capture tool, so availability and behaviour remain not observed.

The Related List rail is followed by SALES SUMMARY. The painted summary labels are Lead Conversion Time and Sales Cycle Duration; the latter wraps its day(s) unit. The next summary line is below the utility-strip boundary and is not asserted from the DOM. Overview/Timeline and Last Update share the tab row. Overview starts with START/CLOSING dates and a horizontal stage sequence, then a five-field business card: Deal Owner, Stage, Probability (%), Expected Revenue, Closing Date. Probability is displayed as an integer; the percent sign is in its label. Expected Revenue is empty and uses a dash. Money in the header uses TL, period grouping and a comma decimal separator with two decimals. Dates use day.month.year. Below are Contact Person and Next Action summaries. Contact Person has a portrait, contact/account/email links, and static envelope/telephone glyphs with phone display; these phone glyphs are not separate interactive controls in the source. Next Action has a month/day ribbon and an activity link. No detail-field section or Hide Details is painted within this viewport.

## Control inventory

IDs are stable across captures. `same` inherits the cited observation limits and does not establish activation here. Static field display, headings, dates and glyphs are described in Layout; header Amount and stage dates additionally receive badge IDs to make the Deals-specific displays traceable. No persisted-preference, stage, terminal, record-action or menu-row control was operated. Screen positions, not offscreen DOM positions, determine presence.

### Control inventory — m4d-list-base

Shell: SH-01–SH-46 as in contacts.md; Deals (SH-16) is active. No new shell control.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No changed painted controls compared with m4-list-base in deals.md. Four record links are visible across three stage columns; the header counters do not establish a total-record count. Only a record link in the first open stage was used.

Rest: as in m4-list-base; covered by the overlay: none. Absent here: none of its painted controls.

### Control inventory — m4d-detail-main

Shell: SH-01–SH-46 as in contacts.md; Deals is active. The whole shell, right edge and utility strip were inspected. No new shell control.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DD-01 | Header | Back | icon button | leftmost | same | seen (m4d-detail-main) | M4 | AD-01 |
| DD-04 | Header | Add Tags | button | below identity | same | seen (m4d-detail-main) | M6 | AD-04 |
| DD-05 | Header | Send Email | button | right actions, first | same | seen (m4d-detail-main) | M10 | AD-05 |
| DD-06 | Header | Edit | button | right actions, second | same | seen (m4d-detail-main) | M4 | AD-06 |
| DD-07 | Header | More Options / three dots | icon button | right actions, third and far right | Opens the observed fifteen-row menu | seen (m4d-detail-main) | M4 | AD-07 |
| DD-90 | Header | Amount | badge | identity line, after deal name and dash | not observed | seen (m4d-detail-main) | M4 | new |
| DD-10 | Related-list rail | Notes | link | rail, row 1 | same | seen (m4d-detail-main) | M6 | AD-10 |
| DD-11 | Related-list rail | Connected Records | link | rail, row 2 | same | seen (m4d-detail-main) | ? | AD-11 |
| DD-12 | Related-list rail | Attachments | link | rail, row 3 | same | seen (m4d-detail-main) | M6 | AD-12 |
| DD-54 | Related-list rail | Stage History | link | rail, row 4 | not observed | seen (m4d-detail-main) | M4 | new |
| DD-55 | Related-list rail | Competitors | link | rail, row 5 | not observed | seen (m4d-detail-main) | ? | new |
| DD-13 | Related-list rail | Cadences | link | rail, row 6 | same | seen (m4d-detail-main) | P3 | D-13 moved |
| DD-15 | Related-list rail | Open Activities | link | rail, row 7 | same | seen (m4d-detail-main) | M5 | AD-15 |
| DD-16 | Related-list rail | Closed Activities | link | rail, row 8 | same | seen (m4d-detail-main) | M5 | AD-16 |
| DD-18 | Related-list rail | Products | link | rail, row 9 | same | seen (m4d-detail-main) | P2 | AD-18 |
| DD-20 | Related-list rail | Quotes | link | rail, row 10 | same | seen (m4d-detail-main) | P2 | AD-20 |
| DD-21 | Related-list rail | Sales Orders | link | rail, row 11 | same | seen (m4d-detail-main) | P2 | AD-21 |
| DD-56 | Related-list rail | Contact Roles | link | rail, row 12 | not observed | seen (m4d-detail-main) | M2 | new |
| DD-23 | Related-list rail | Emails | link | rail, row 13 | same | seen (m4d-detail-main) | M10 | AD-23 moved |
| DD-19 | Related-list rail | Cases | link | rail, row 14 | same | seen (m4d-detail-main) | M8 | AD-19 |
| DD-24 | Related-list rail | Invoices | link | rail, row 15 | same | seen (m4d-detail-main) | P2 | AD-24 moved |
| DD-29 | Related-list rail | Add Related List | link | below last related-list link | same | seen (m4d-detail-main) | M11 | AD-29 |
| DD-57 | Related-list rail | Stage History count | badge | after Stage History | not observed | seen (m4d-detail-main) | M4 | new |
| DD-30 | Related-list rail | Open Activities count | badge | after Open Activities | same | seen (m4d-detail-main) | M5 | AD-30 |
| DD-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | same | seen (m4d-detail-main) | M5 | AD-31 |
| DD-58 | Related-list rail | Contact Roles count | badge | after Contact Roles | not observed | seen (m4d-detail-main) | M2 | new |
| DD-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | same | seen (m4d-detail-main) | M4 | AD-32 |
| DD-33 | Tab row | Overview | tab | first tab, selected | same | seen (m4d-detail-main) | M4 | AD-33 |
| DD-34 | Tab row | Timeline | tab | second tab | Opens History with an empty log region | seen (m4d-detail-main) | M4 | AD-34 |
| DD-35 | Tab row | Last Update indicator | badge | far right | same | seen (m4d-detail-main) | M4 | AD-35 |
| DD-60 | Stage bar | Left chevron | icon button | left edge of stage sequence | not observed | seen (m4d-detail-main) | M4 | new |
| DD-61.1 | Stage bar | Qualification | button | stage sequence, visible item 1 | not observed | seen (m4d-detail-main) | M4 | new |
| DD-61.2 | Stage bar | Needs Analysis | button | stage sequence, visible item 2 | not observed | seen (m4d-detail-main) | M4 | new |
| DD-61.3 | Stage bar | Value Proposition | button | stage sequence, visible item 3 | not observed | seen (m4d-detail-main) | M4 | new |
| DD-61.4 | Stage bar | Identify Decision Makers | button | stage sequence, visible item 4 | not observed | seen (m4d-detail-main) | M4 | new |
| DD-61.5 | Stage bar | Proposal/Price Quote (clipped) | button | stage sequence, visible item 5 | not observed | seen (m4d-detail-main) | M4 | new |
| DD-62 | Stage bar | Down chevron | icon button | inside current Qualification step, after label | not observed | seen (m4d-detail-main) | M4 | new |
| DD-63 | Stage bar | Right chevron | icon button | right edge of stage sequence | not observed | seen (m4d-detail-main) | M4 | new |
| DD-64 | Stage bar | Thumbs up with down chevron | icon button | after stage sequence, first terminal control | not observed | seen (m4d-detail-main) | M4 | new |
| DD-65 | Stage bar | Thumbs down with down chevron | icon button | after stage sequence, second terminal control | not observed | seen (m4d-detail-main) | M4 | new |
| DD-91 | Stage bar | START date | badge | above sequence, left | not observed | seen (m4d-detail-main) | M4 | new |
| DD-92 | Stage bar | CLOSING date with stopwatch glyph | badge | above sequence, right | not observed | seen (m4d-detail-main) | M4 | new |
| DD-66 | Contact Person summary | Contact record link | link | body, after portrait | same | seen (m4d-detail-main) | M2 | AD-103 moved |
| DD-67 | Contact Person summary | Account record link | link | below contact link, after static at | same | seen (m4d-detail-main) | M3 | D-03 moved |
| DD-68 | Contact Person summary | Email link | link | below account link | same | seen (m4d-detail-main) | M10 | AD-104 moved |
| DD-69 | Next Action summary | Activity record link | link | after date ribbon | not observed | seen (m4d-detail-main) | M5 | new |

Absent here: AD-02 (portrait), AD-08–AD-09 (record navigation arrows), AD-99 (header Website); AD-14, AD-96, AD-97, AD-26 and AD-98 (Deals, Contacts, Member Accounts, Social and Add Link rail entries); AD-101–AD-102 (Notes/Contacts counts). AD-37, AD-38, AD-41 and AD-100 are not painted in this viewport. The Add Link source element is below the viewport, not evidence of module-wide absence. No hover-only rail controls are painted.

### Control inventory — m4d-detail-more

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DD-07.1 | More Options menu | Clone | menu item | menu, row 1 | same | seen (m4d-detail-more) | M4 | AD-07.1 |
| DD-07.2 | More Options menu | Share | menu item | menu, row 2 | same | seen (m4d-detail-more) | M4 | AD-07.2 |
| DD-07.3 | More Options menu | Delete | menu item | menu, row 3 | same | seen (m4d-detail-more) | M4 | AD-07.3 |
| DD-07.4 | More Options menu | Print Preview | menu item | menu, row 4 | same | seen (m4d-detail-more) | M4 | AD-07.4 |
| DD-07.5 | More Options menu | Find and Merge Duplicates | menu item | menu, row 5 | same | seen (m4d-detail-more) | M4 | AD-07.5 |
| DD-07.6 | More Options menu | Mail Merge | menu item | menu, row 6 | same | seen (m4d-detail-more) | M9 | AD-07.6 |
| DD-07.7 | More Options menu | Run Macro | menu item | menu, row 7 | same | seen (m4d-detail-more) | M12 | D-07.7 |
| DD-07.8 | More Options menu | Customize Business Card | menu item | menu, row 8 | same | seen (m4d-detail-more) | M11 | AD-07.7 moved |
| DD-07.9 | More Options menu | Organize Deal Details | menu item | menu, row 9 | same | seen (m4d-detail-more) | M11 | AD-07.8 moved |
| DD-07.10 | More Options menu | Add Related List | menu item | menu, row 10 | same | seen (m4d-detail-more) | M11 | AD-07.9 moved |
| DD-07.11 | More Options menu | Review History | menu item | menu, row 11 | same | seen (m4d-detail-more) | P3 | AD-07.10 moved |
| DD-07.12 | More Options menu | Enroll to Cadence | menu item | menu, row 12 | same | seen (m4d-detail-more) | P3 | D-07.12 |
| DD-07.13 | More Options menu | Add Kiosk | menu item | menu, row 13 | same | seen (m4d-detail-more) | M11 | AD-07.11 moved |
| DD-07.14 | More Options menu | Create Button | menu item | menu, row 14 | same | seen (m4d-detail-more) | M11 | AD-07.12 moved |
| DD-07.15 | More Options menu | Create Client Script | menu item | menu, row 15 | same | seen (m4d-detail-more) | M11 | AD-07.13 moved |

Two static separators follow rows 3 and 6. No visible submenu arrow is painted on any row; Mail Merge has no arrow. Decorative sparkles accompany Add Kiosk and Create Client Script. No row was selected or hovered.

Rest: as in m4d-detail-main; covered by the overlay: DD-35 (partly), DD-92 and DD-64–DD-65. The menu also covers the right part of the stage strip, including the end of DD-61.5 and DD-63; these are not new or absent module controls.

### Control inventory — m4d-detail-timeline

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DD-33 | Tab row | Overview | tab | first tab, unselected | same | seen (m4d-detail-timeline) | M4 | AD-33 |
| DD-34 | Tab row | Timeline | tab | second tab, selected | Opens History | seen (m4d-detail-timeline) | M4 | AD-34 |
| DD-70 | Timeline | History | tab | inner tab row, first and only painted tab | same | seen (m4d-detail-timeline) | M4 | AD-159 |
| DD-71 | Timeline | Show Upcoming Automated Actions | button | history toolbar, right, with downward chevron | same | seen (m4d-detail-timeline) | M12 | AD-160 |
| DD-72 | Timeline | Filter Timeline History | icon button | after Timeline History heading | same | seen (m4d-detail-timeline) | M4 | AD-161 |

Rest: as in m4d-detail-main for shell, header, rail and outer tabs; covered by the overlay: none. Overview content is replaced, so DD-60–DD-69, DD-61.1–DD-61.5 and DD-91–DD-92 are absent from this state. No Interactions tab, event link or filter panel is painted.

### Control inventory — m4d-list-after

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DD-L01 | Board | Stage selection checkbox | checkbox | first visible stage header, upper right | not observed | seen (m4d-list-after) | M4 | new |
| DD-L02 | Board | Create Deal | button | below first stage column, left footer segment | not observed | seen (m4d-list-after) | M4 | DL-12 moved |
| DD-L03 | Board | Opposing arrows icon | icon button | below first stage column, right footer segment | not observed | seen (m4d-list-after) | M4 | new |

The three added painted controls are incidental to later column loading; they were not clicked. Four record links have the same set and columns as m4d-list-base. The selection checkbox belongs to the stage header, not an individual card. The card footer remains below the entire first column.

Rest: as in m4d-list-base; covered by the overlay: none.

### Control inventory — m4c-list-base

Shell: SH-01–SH-46 as in contacts.md; Deals active. The refreshed image is painted, replacing the earlier loading evidence.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DD-L01 | Board | Stage selection checkbox | checkbox | first stage header, upper right | not observed | seen (m4c-list-base) | M4 | DD-L01 in m4d-list-after |
| DD-L02 | Board | Create Deal | button | below first column, left footer segment | not observed | seen (m4c-list-base) | M4 | DL-12 moved |
| DD-L03 | Board | Opposing arrows icon | icon button | below first column, right footer segment | not observed | seen (m4c-list-base) | M4 | DD-L03 in m4d-list-after |

Rest: as in m4-list-base; covered by the overlay: none. The later first-column selection/footer controls are as in m4d-list-after. Four record links are painted across three columns. Column counters do not establish the total count. Record-link identities are excluded.

### Control inventory — m4c-detail-base

Shell: SH-01–SH-46 as in contacts.md. Entire screenshot inspected, including utility strip and edges.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No changed painted control relative to m4d-detail-main. Existing DD-01, DD-04–DD-07, DD-10–DD-13, DD-15–DD-16, DD-18–DD-21, DD-23–DD-24, DD-29–DD-35, DD-54–DD-58, DD-60–DD-69, DD-61.1–DD-61.5 and DD-90–DD-92 retain their IDs. Related-card navigation selectors originate from this capture.

Rest: as in m4d-detail-main; covered by the overlay: none. Absent here: same as that baseline. No named control for scrolling to lower Deal Information or Description is painted; no substitute navigation was attempted.

### Control inventory — m4c-card-notes

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DD-93 | Related-list rail | Organize Deal Details | icon button | after Related List heading | same | seen (m4c-card-notes) | M11 | AD-105 |
| DD-94 | Related-list rail | Plus icon | icon button | Notes row, right end | same | seen (m4c-card-notes) | M6 | AD-106 |
| DD-95 | Notes card | Recent Last | select | header, right | same | seen (m4c-card-notes) | M6 | AD-107 |
| DD-96 | Notes card | Add a note | input | body, below header | same | seen (m4c-card-notes) | M6 | AD-108 moved |
| DD-97 | Attachments card | Attach / down arrow | button | header, right | same | seen (m4c-card-notes) | M6 | AD-110 |
| DD-98 | Record content | Scroll To Top | icon button | floating at lower right | same | seen (m4c-card-notes) | M4 | AD-111 |
| DD-99 | Stage History card | Table with plus icon | icon button | header, right | not observed | seen (m4c-card-notes) | M11 | new |
| DD-100 | Stage History card | Stage | column header | table header, visible column 1 | not observed | seen (m4c-card-notes) | M4 | new |
| DD-101 | Stage History card | Amount | column header | table header, visible column 2 | not observed | seen (m4c-card-notes) | M4 | new |
| DD-102 | Stage History card | Probability (%) | column header | table header, visible column 3 | not observed | seen (m4c-card-notes) | M4 | new |
| DD-103 | Stage History card | Expected Revenue | column header | table header, visible column 4 | not observed | seen (m4c-card-notes) | M4 | new |
| DD-104 | Stage History card | Closing Date | column header | table header, visible column 5 | not observed | seen (m4c-card-notes) | M4 | new |
| DD-105 | Stage History card | Stage Duration (Calendar Days) | column header | table header, visible column 6 | not observed | seen (m4c-card-notes) | M4 | new |
| DD-106 | Stage History card | Modified Time (clipped) | column header | table header, visible column 7 | not observed | seen (m4c-card-notes) | M4 | new |
| DD-107 | Competitors card | New | button | header, right | not observed | seen (m4c-card-notes) | ? | new |

Rest: as in m4c-detail-base for shell, fixed header, rail and tabs; covered by the overlay: none. Overview stage/business/summary content DD-60–DD-69, DD-61.1–DD-61.5, DD-91–DD-92 is scrolled out. Notes is selected; its plus and the rail organize icon are newly painted. Notes, Connected Records, Attachments and Stage History have complete headings and upper controls; no separate capture is needed for them. Competitors has a complete heading/New action and readable empty state. No Show More, card-header counter, Stage History row-end control or collapse icon is painted. Modified Time is clipped at the right; Modified By is outside the screenshot. Scroll To Top partly overlaps the Competitors header area but its New action remains visible. Absent here: AD-109 (Show More), Notes rail badge AD-101; this record has no note rows.

### Control inventory — m4c-card-cadences

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DD-93 | Related-list rail | Organize Deal Details | icon button | after Related List heading | same | seen (m4c-card-cadences) | M11 | AD-105 |
| DD-108 | Related-list rail | Plus icon | icon button | Cadences row, right end | not observed | seen (m4c-card-cadences) | P3 | new |
| DD-109 | Cadences card | Enroll | button | header, right | same | seen (m4c-card-cadences) | P3 | D-55 |
| DD-110 | Open Activities card | Add New / down arrow | button | header, right group, first | same | seen (m4c-card-cadences) | M5 | AD-135 |
| DD-111 | Open Activities card | Untranslated column-view label | select | header, right group, second | not observed | seen (m4c-card-cadences) | M5 | new |
| DD-112 | Open Activities card | Table with plus icon | icon button | header, right group, third | same | seen (m4c-card-cadences) | M11 | AD-137 |
| DD-113 | Open Activities card | Diagonal expand arrows | icon button | header, right group, fourth | same | seen (m4c-card-cadences) | M5 | AD-138 |
| DD-114 | Open Activities card | Open Tasks count | badge | first visible activity column, after title | same | seen (m4c-card-cadences) | M5 | AD-139 |
| DD-115 | Open Activities card | Open Meetings count | badge | second visible activity column, after title | same | seen (m4c-card-cadences) | M5 | AD-140 |
| DD-116 | Closed Activities card | Column View | select | header, right group, first | same | seen (m4c-card-cadences) | M5 | AD-141 |
| DD-117 | Closed Activities card | Table with plus icon | icon button | header, right group, second | same | seen (m4c-card-cadences) | M11 | AD-142 |
| DD-118 | Closed Activities card | Diagonal expand arrows | icon button | header, right group, third | same | seen (m4c-card-cadences) | M5 | AD-143 |
| DD-119 | Closed Activities card | Closed Tasks count | badge | first visible activity column, after title | same | seen (m4c-card-cadences) | M5 | AD-144 |
| DD-120 | Closed Activities card | Closed Meetings count | badge | second visible activity column, after title | same | seen (m4c-card-cadences) | M5 | AD-145 |
| DD-121 | Products card | Add Products | button | header, right | same | seen (m4c-card-cadences) | P2 | AD-146 |
| DD-98 | Record content | Scroll To Top | icon button | floating at lower right | same | seen (m4c-card-cadences) | M4 | AD-111 |

Rest: as in m4c-detail-base for shell, fixed header, rail and tabs; covered by the overlay: none. Overview content is scrolled out as in m4c-card-notes. Cadences is selected and its plus is painted. Open Activities displays the untranslated selector label recorded above, rather than Accounts Column View; no option was opened. Open/Closed Tasks and Meetings form two visible columns; Calls is outside the horizontal viewport. Activity record links are row data and excluded from the inventory. Products heading and Add Products are visible at the bottom; its body is below the utility boundary. No card action, preference or row link was operated.

### Control inventory — m4c-card-quotes

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

Both the 12000 ms attempt and the single 25000 ms retry painted only the loading skeleton. Both requested clicks were skipped with matched 0. No card control was observed.

Rest: intended baseline m4c-detail-base, but no painted baseline control is present; covered by the overlay: none. Skeleton shapes and the Loading indicator are placeholders.

### Control inventory — m4c-card-sales-orders

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DD-93 | Related-list rail | Organize Deal Details | icon button | after Related List heading | same | seen (m4c-card-sales-orders) | M11 | AD-105 |
| DD-122 | Related-list rail | Plus icon | icon button | Sales Orders row, right end | same | seen (m4c-card-sales-orders) | P2 | AD-151 |
| DD-123 | Sales Orders card | Assign | button | header, right group, first | same | seen (m4c-card-sales-orders) | P2 | AD-149 |
| DD-124 | Sales Orders card | New | button | header, right group, second | same | seen (m4c-card-sales-orders) | P2 | AD-150 |
| DD-125 | Contact Roles card | Add Contacts Roles | button | header, right group, first | not observed | seen (m4c-card-sales-orders) | M2 | new |
| DD-126 | Contact Roles card | Edit All | button | header, right group, second | not observed | seen (m4c-card-sales-orders) | M2 | new |
| DD-127 | Contact Roles card | Table with plus icon | icon button | header, right group, third | not observed | seen (m4c-card-sales-orders) | M11 | new |
| DD-128 | Contact Roles card | Contact Name | column header | table header, named column 1 | same | seen (m4c-card-sales-orders) | M2 | AD-121 |
| DD-129 | Contact Roles card | Account Name | column header | table header, named column 2 | not observed | seen (m4c-card-sales-orders) | M3 | new |
| DD-130 | Contact Roles card | Phone | column header | table header, named column 3 | same | seen (m4c-card-sales-orders) | M2 | AD-123 moved |
| DD-131 | Contact Roles card | Email | column header | table header, named column 4 | same | seen (m4c-card-sales-orders) | M2 | AD-122 moved |
| DD-132 | Contact Roles card | Role Name | column header | table header, named column 5 | not observed | seen (m4c-card-sales-orders) | M2 | new |
| DD-133 | Contact Roles card | Contact record link | link | row, Contact Name column | same | seen (m4c-card-sales-orders) | M2 | AD-127 |
| DD-134 | Contact Roles card | Account record link | link | row, Account Name column | not observed | seen (m4c-card-sales-orders) | M3 | new |
| DD-135 | Contact Roles card | Phone call icon | icon button | row, after Phone display | same | seen (m4c-card-sales-orders) | M5 | AD-129 |
| DD-136 | Contact Roles card | Email link | link | row, Email column | same | seen (m4c-card-sales-orders) | M10 | AD-128 |
| DD-137 | Emails card | Emails associated with … (clipped) | select | tab row, right | not observed | seen (m4c-card-sales-orders) | M10 | new |
| DD-138 | Emails card | Compose Email | button | header, right | same | seen (m4c-card-sales-orders) | M10 | AD-131 |
| DD-139 | Emails card | Mails | tab | below header, first | same | seen (m4c-card-sales-orders) | M10 | AD-132 |
| DD-140 | Emails card | Drafts | tab | below header, second | same | seen (m4c-card-sales-orders) | M10 | AD-133 |
| DD-141 | Emails card | Scheduled | tab | below header, third | same | seen (m4c-card-sales-orders) | M10 | AD-134 |
| DD-142 | Cases card | Assign | button | header, right group, first | same | seen (m4c-card-sales-orders) | M8 | AD-155 |
| DD-143 | Cases card | New | button | header, right group, second | same | seen (m4c-card-sales-orders) | M8 | AD-156 |
| DD-144 | Invoices card | Assign | button | header, right group, first | same | seen (m4c-card-sales-orders) | P2 | AD-152 |
| DD-145 | Invoices card | New (partly covered) | button | header, right group, second | same | seen (m4c-card-sales-orders) | P2 | AD-153 |
| DD-98 | Record content | Scroll To Top | icon button | floating at lower right | same | seen (m4c-card-sales-orders) | M4 | AD-111 |

Rest: as in m4c-detail-base for shell, fixed header, rail and tabs; covered by the overlay: none. Overview content is scrolled out. Sales Orders is selected. Sales Orders, Contact Roles, Emails and Cases have fully visible headings and upper controls, so no separate Contact Roles, Emails or Cases capture was taken. Contact Roles has a blank leading structural cell, five named columns and a populated row; no card-header counter or row-end action is painted. Record links are inventoried structurally without copying their values. The phone icon DD-135 is image-only. Emails shows Mails selected with No records found; Drafts, Scheduled and the selector were not opened. Its selector label differs from Accounts sent-mail scope. Invoices is empty; Scroll To Top partly covers its New action. No creation, assignment, editing, communication or preference control was activated.

Absent here: Accounts email scope AD-130 (replaced by DD-137); Accounts Contacts Hierarchy View, Assign, New and diagonal expand controls AD-115–AD-117, AD-120 are not painted in Contact Roles. Mobile, Fax and Contact Owner headers AD-124–AD-126 are absent; Account Name and Role Name replace that field set.

### Control inventory — m4c-card-invoices

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DD-93 | Related-list rail | Organize Deal Details | icon button | after Related List heading | same | seen (m4c-card-invoices) | M11 | AD-105 |
| DD-125 | Contact Roles card | Add Contacts Roles | button | header, right group, first | not observed | seen (m4c-card-invoices) | M2 | new |
| DD-126 | Contact Roles card | Edit All | button | header, right group, second | not observed | seen (m4c-card-invoices) | M2 | new |
| DD-127 | Contact Roles card | Table with plus icon | icon button | header, right group, third | not observed | seen (m4c-card-invoices) | M11 | new |
| DD-128 | Contact Roles card | Contact Name | column header | table header, named column 1 | same | seen (m4c-card-invoices) | M2 | AD-121 |
| DD-129 | Contact Roles card | Account Name | column header | table header, named column 2 | not observed | seen (m4c-card-invoices) | M3 | new |
| DD-130 | Contact Roles card | Phone | column header | table header, named column 3 | same | seen (m4c-card-invoices) | M2 | AD-123 moved |
| DD-131 | Contact Roles card | Email | column header | table header, named column 4 | same | seen (m4c-card-invoices) | M2 | AD-122 moved |
| DD-132 | Contact Roles card | Role Name | column header | table header, named column 5 | not observed | seen (m4c-card-invoices) | M2 | new |
| DD-133 | Contact Roles card | Contact record link | link | row, Contact Name column | same | seen (m4c-card-invoices) | M2 | AD-127 |
| DD-134 | Contact Roles card | Account record link | link | row, Account Name column | not observed | seen (m4c-card-invoices) | M3 | new |
| DD-135 | Contact Roles card | Phone call icon | icon button | row, after Phone display | same | seen (m4c-card-invoices) | M5 | AD-129 |
| DD-136 | Contact Roles card | Email link | link | row, Email column | same | seen (m4c-card-invoices) | M10 | AD-128 |
| DD-137 | Emails card | Emails associated with … (clipped) | select | tab row, right | not observed | seen (m4c-card-invoices) | M10 | new |
| DD-138 | Emails card | Compose Email | button | header, right | same | seen (m4c-card-invoices) | M10 | AD-131 |
| DD-139 | Emails card | Mails | tab | below header, first | same | seen (m4c-card-invoices) | M10 | AD-132 |
| DD-140 | Emails card | Drafts | tab | below header, second | same | seen (m4c-card-invoices) | M10 | AD-133 |
| DD-141 | Emails card | Scheduled | tab | below header, third | same | seen (m4c-card-invoices) | M10 | AD-134 |
| DD-142 | Cases card | Assign | button | header, right group, first | same | seen (m4c-card-invoices) | M8 | AD-155 |
| DD-143 | Cases card | New | button | header, right group, second | same | seen (m4c-card-invoices) | M8 | AD-156 |
| DD-144 | Invoices card | Assign | button | header, right group, first | same | seen (m4c-card-invoices) | P2 | AD-152 |
| DD-145 | Invoices card | New | button | header, right group, second | same | seen (m4c-card-invoices) | P2 | AD-153 |
| DD-98 | Record content | Scroll To Top | icon button | floating at lower right | same | seen (m4c-card-invoices) | M4 | AD-111 |
| DD-146 | Related-list rail | Plus icon | icon button | Invoices row, right end | same | seen (m4c-card-invoices) | P2 | AD-151 moved |
| DD-147 | Record-page footer | Add Related List | button | footer, left | same | seen (m4c-card-invoices) | M11 | D-93 |
| DD-148 | Record-page footer | Standard View | select | footer, right group, first | same | seen (m4c-card-invoices) | M11 | D-94 |
| DD-149 | Record-page footer | Create a custom record page | button | footer, right group, second | same | seen (m4c-card-invoices) | M11 | D-95 |

Rest: as in m4c-detail-base for shell, fixed header, rail and tabs; covered by the overlay: none. Overview content and Sales Orders are scrolled out. Invoices is selected; its plus DD-146 replaces Sales Orders plus DD-122. Contact Roles upper actions are partly clipped beneath the fixed tab row, but its five named columns and structural row links remain visible. Emails and Cases retain their controls. Invoices has fully visible Assign and New with No records found; no counter or column header is painted. The record-page footer exposes Add Related List, the static Record detail page views label, Standard View and Create a custom record page. All three controls match Contacts D-93–D-95; Accounts did not observe this footer. No footer control was clicked. Scroll To Top no longer covers Invoices New.

Absent here: DD-122–DD-124 (Sales Orders is scrolled out); no new control replaces those header actions.

### Control inventory — m4c-list-after

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

The required after capture produced a loading skeleton at 12000 ms and again in the single 25000 ms retry. No painted interactive control; the central Loading indicator and skeleton shapes are placeholders. Shell, edges and bottom corners were inspected as an image.

Rest: intended route as in m4c-list-base, but its painted SH/DL controls are absent during loading; covered by the overlay: none. This is not module-wide absence. No count comparison is possible.

### Shell controls missing from app-shell.md

No additional Deals shell control found. Reuse the missing-shell list in contacts.md. SH-46 is image-only; resize hotspots have no painted grip.

## Stage bar

The observed record is at the first open stage. Qualification is the current outlined chevron step with a down chevron; no passed step is visible. The following painted steps are unselected chevrons. Future-state styling is observed only at this record position; passed-state styling is not observed. A faint left chevron precedes the steps and a right chevron bounds the scroll window. Neither was clicked. CLOSING has a stopwatch glyph; no duration text is painted beside the stage strip. The two terminal controls show thumbs up/down, each with a down chevron; their menus and effects remain not observed.

| Painted order | Stage | deals.md exported order | Observed presentation |
| --- | --- | --- | --- |
| 1 | Qualification | 2 | Current, with down chevron |
| 2 | Needs Analysis | 3 | Unselected future step |
| 3 | Value Proposition | 4 | Unselected future step |
| 4 | Identify Decision Makers | 5 | Unselected future step |
| 5 | Proposal/Price Quote | 6 | Future step; label clipped at right |
| not painted | Negotiation/Review | 7 | Offscreen DOM is not screen evidence |
| not painted | Closed Won | 8 | Closed-stage sequence display not observed |
| not painted | Closed Lost | 9 | Closed-stage sequence display not observed |
| not painted | Closed Lost to Competition | 10 | Closed-stage sequence display not observed |

The five visible labels follow exported order without a discrepancy. Closed-stage representation cannot be inferred from the thumbs controls. Clicking a stage, down chevron or terminal action remains not observed and is reserved for pipeline research.

## More Options and Timeline

| Deals # | Label | Ref | Difference |
| --- | --- | --- | --- |
| DD-07.1 | Clone | AD-07.1 | Same label/order |
| DD-07.2 | Share | AD-07.2 | Same label/order |
| DD-07.3 | Delete | AD-07.3 | Same label/order |
| DD-07.4 | Print Preview | AD-07.4 | Same label/order |
| DD-07.5 | Find and Merge Duplicates | AD-07.5 | Same label/order |
| DD-07.6 | Mail Merge | AD-07.6 | Same label/order |
| DD-07.7 | Run Macro | D-07.7 | Present in Contacts; absent in Accounts |
| DD-07.8 | Customize Business Card | AD-07.7 moved | Accounts row 7 → Deals row 8 |
| DD-07.9 | Organize Deal Details | AD-07.8 moved | Module-name substitution; Accounts row 8 → Deals row 9 |
| DD-07.10 | Add Related List | AD-07.9 moved | Accounts row 9 → Deals row 10 |
| DD-07.11 | Review History | AD-07.10 moved | Accounts row 10 → Deals row 11 |
| DD-07.12 | Enroll to Cadence | D-07.12 | Present in Contacts; absent in Accounts |
| DD-07.13 | Add Kiosk | AD-07.11 moved | Accounts row 11 → Deals row 13 |
| DD-07.14 | Create Button | AD-07.12 moved | Accounts row 12 → Deals row 14 |
| DD-07.15 | Create Client Script | AD-07.13 moved | Accounts row 13 → Deals row 15 |

All fifteen menu rows match Contacts order, with the module-name substitution in Organize Deal Details. Accounts lacks Run Macro and Enroll to Cadence, moving its later rows upward. Separators match Accounts. Row activation, submenu contents and action outcomes are not observed.

| Deals # | Label | Ref | Difference |
| --- | --- | --- | --- |
| DD-70 | History | AD-159 | Same inner-tab position; only painted inner tab |
| DD-71 | Show Upcoming Automated Actions | AD-160 | Same toolbar position and down chevron |
| DD-72 | Filter Timeline History | AD-161 | Same filter icon after heading; panel not reopened |
| absent | Interactions | D-43 | As in Accounts, no Interactions tab painted |
| absent | Activity record link | AD-162 | No event rows painted; empty history |

Timeline displays the static empty message “No logs found” beneath Timeline History. No dates, event connectors, stage-change descriptions or author rows are painted. This is the observed empty state for this record, not a claim that Deals has no history events. A Stage History rail count is visible while Timeline is empty; their equivalence is not established. The shared Contacts filter D-47–D-51 remains the comparison source; no filter was opened or applied here.

## Differences from Accounts record detail

- Header Amount replaces the Accounts Website display; no portrait or previous/next arrows are painted.
- Stage dates, chevron sequence, horizontal navigation and two terminal controls add an entire Overview region above the business card.
- The five business fields are Deals-specific; there is no business-card Phone call control. Probability is an integer and Expected Revenue is empty in the observed record.
- Stage History, Competitors, Cadences and Contact Roles replace several Accounts rail entries; the exact order and badge locations are inventoried. SALES SUMMARY follows the related links.
- Contact Person and Next Action replace the Accounts Contacts summary arrangement; contact, account and email links are painted in the former, and an activity link in the latter.
- More Options adds two Contacts-shared rows to Accounts. Timeline has the Accounts History-only layout but an empty state, so populated stage-change rows remain unobserved.

## Related-list rail vs metadata

Only labels and order are compared. Exported sequence is from deals.md › Related lists.

| Painted order | Rail label | Exported sequence | Comparison |
| --- | --- | --- | --- |
| 1 | Notes | 2 | Notes/Connected Records swapped on screen |
| 2 | Connected Records | 1 | Notes/Connected Records swapped on screen |
| 3 | Attachments | 3 | Same relative order |
| 4 | Stage History | 4 | Same relative order |
| 5 | Competitors | 5 | Same relative order |
| 6 | Cadences | 6 | Same relative order |
| 7 | Open Activities | 8–10 | Combined Tasks/Meetings/Calls rail entry |
| 8 | Closed Activities | 12–14 | Combined Tasks/Meetings/Calls rail entry |
| 9 | Products | 17 | Same relative order |
| 10 | Quotes | 18 | Same relative order |
| 11 | Sales Orders | 19 | Same relative order |
| 12 | Contact Roles | 20 | Same relative order |
| 13 | Emails | 21 | Same relative order |
| 14 | Cases | 22 | Same relative order |
| 15 | Invoices | 24 | Same relative order |

Exported visible Checklists (23) and Locking Information (25) are not painted in this rail. Hidden Review Summary/Field History, Email Sentiment and Email Drafts are also not painted. Add Related List is a utility link, not an exported relation. SALES SUMMARY is a static section, not another related list. The rail's Stage History and Contact Roles badges are Deals-specific; Activities counts reuse Accounts.

## Related-list cards

The first fifteen rows follow the observed rail. Checklists and Locking Information have no observed rail position. Shared rows below cite Accounts first, then Contacts; only observed differences are expanded. No record values or activity contents are reproduced. Counts indicate presence only, not customer-specific values.

| Order | Card title | Module | Counter | Upper controls | Column headers | Empty state | Ref | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Notes | M6 | No card-header counter | Recent Last DD-95; Add a note DD-96 | None painted | Input only; no note rows | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Accounts Notes: same header controls; no Show More; input directly below header | seen (m4c-card-notes) |
| 2 | Connected Records | ? | None painted | None painted | None painted | No records found | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Accounts Connected Records: same empty card | seen (m4c-card-notes) |
| 3 | Attachments | M6 | None painted | Attach / down arrow DD-97 | None painted | No Attachment | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Accounts Attachments: same | seen (m4c-card-notes) |
| 4 | Stage History | M4 | No card-header counter; rail badge DD-57 | Table with plus DD-99 | Stage; Amount; Probability (%); Expected Revenue; Closing Date; Stage Duration (Calendar Days); Modified Time (clipped) | Populated; empty state not observed | new | seen (m4c-card-notes) |
| 5 | Competitors | ? | None painted | New DD-107 | None painted | No records found | new | seen (m4c-card-notes) |
| 6 | Cadences | P3 | None painted | Enroll DD-109 | None painted | No records found | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Contacts Related-list cards › Cadences: same; Accounts has no Cadences card | seen (m4c-card-cadences) |
| 7 | Open Activities | M5 | Tasks/Meetings badges DD-114–DD-115 | DD-110–DD-113 | Open Tasks; Open Meetings; Calls not painted | Meetings: No records found; Tasks populated | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Accounts Open Activities: same layout; selector label differs (DD-111) | seen (m4c-card-cadences) |
| 8 | Closed Activities | M5 | Tasks/Meetings badges DD-119–DD-120 | DD-116–DD-118 | Closed Tasks; Closed Meetings; Calls not painted | Populated; empty state not observed | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Accounts Closed Activities: same visible controls | seen (m4c-card-cadences) |
| 9 | Products | P2 | not observed | Add Products DD-121 | not observed | not observed | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Accounts Products: same header action; body not observed | seen header (m4c-card-cadences) |
| 10 | Quotes | P2 | not observed | not observed | not observed | not observed | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Related-list cards › Quotes; Deals equivalence not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 11 | Sales Orders | P2 | No card-header counter | Assign DD-123; New DD-124 | None painted | No records found | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Accounts Sales Orders: same | seen (m4c-card-sales-orders) |
| 12 | Contact Roles | M2 | No card-header counter; rail badge DD-58 | Add Contacts Roles DD-125; Edit All DD-126; table with plus DD-127 | Contact Name; Account Name; Phone; Email; Role Name | Populated; empty state not observed | new | seen (m4c-card-sales-orders) |
| 13 | Emails | M10 | No card-header counter | Compose Email DD-138; Mails/Drafts/Scheduled DD-139–DD-141; scope selector DD-137 | None painted | Mails: No records found; other tabs not opened | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Accounts Emails: same except scope selector | seen (m4c-card-sales-orders) |
| 14 | Cases | M8 | No card-header counter | Assign DD-142; New DD-143 | None painted | No records found | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Accounts Cases: same | seen (m4c-card-sales-orders) |
| 15 | Invoices | P2 | No card-header counter | Assign DD-144; New DD-145 | None painted | No records found | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Accounts Invoices: same | seen (m4c-card-invoices); partly covered in m4c-card-sales-orders |
| not observed | Checklists | ? | not observed | not observed | not observed | not observed | new scope; not observed | not observed (MEP-347); exported relation (deals.md) |
| not observed | Locking Information | M11 | not observed | not observed | not observed | not observed | new scope; not observed | not observed (MEP-347); exported relation (deals.md) |

Stage History, Competitors and Connected Records have painted card evidence in m4c-card-notes, as recorded above. Stage History exposes its upper icon and seven visible or clipped column headers; Competitors exposes New and its empty state; Connected Records exposes its empty state without upper controls. Sales Orders, Contact Roles, Emails and Cases are painted in m4c-card-sales-orders; Invoices upper controls are fully visible in m4c-card-invoices. Contact Roles includes its upper actions and five named columns. Quotes, Checklists, Locking Information and the lower detail fields remain unobserved. Stage History is compared with metadata in the following section; unseen columns and row-end actions are not inferred. No new DD number is assigned to an unobserved control.

## Contact Roles behaviour

MEP-557 (2026-10-14): existing captures re-inspected; no new reference navigation or clicks. The MEP-417 single-click exception explicitly belongs to Hierarchy View and cannot transfer to another control. Add Contacts Roles (DD-125) and Edit All (DD-126) were therefore not opened. No selection, save, settings change or write was attempted. Their interiors and the configured role list remain **not observed**.

### Observed card and documented control inventory

Existing DD-125–DD-136 and their source reconciliation remain authoritative. The following numbered entries distinguish card evidence from documentation; D-CR numbers are documentary references, not newly observed DD controls.

| # | Region | Control / structure | Position / behaviour | Source | Module |
| --- | --- | --- | --- | --- | --- |
| DD-125 | Contact Roles card | Add Contacts Roles | First header action; opening not observed. Public help calls the entry Add Contact Roles. | seen (m4c-card-sales-orders, m4c-card-invoices); D-CR1 | M2 |
| DD-126 | Contact Roles card | Edit All | Second header action; container, fields, footer, selection defaults and validation not observed; no explicit description found in the consulted help/API pages. Do not equate this with the settings page called Edit Contact Roles. | seen (same captures) | M2 |
| DD-128–DD-132 | Contact Roles card | Contact Name, Account Name, Phone, Email, Role Name | Five named columns. A populated relationship has a visually blank Role Name cell; this establishes a display state, not how it was created. | seen (same captures) | M2; Account Name M3 |
| D-CR1.1 | Contact Roles Mapping | Contact checkboxes; select all | Help describes selecting individual contacts or all contacts. FAQ scopes candidates to the deal's account; with no associated contacts, none are listed. Exact empty text, search, pagination and container shape not observed. | documented (D-CR1, D-CR2) | M2 |
| D-CR1.2 | Contact Roles Mapping | Contact Role dropdown | One role selector for each contact in the documented flow. Actual configured options, order, default and blank-option label not observed. | documented (D-CR1) | M2 |
| D-CR1.3 | Contact Roles Mapping | Save | Final action in the documented association flow; never operated. Cancel/close controls and success/error presentation not established by the consulted text. | documented (D-CR1, D-CR2) | M2 |

### Rules, validation and role configuration

- **Documented:** administrators can manage roles through Setup → Customization → Modules and Fields → Deals → Settings → Contact Roles. The settings page supports adding, deleting, renaming and reordering roles before saving (D-CR1). Settings were not visited. Help examples include Decision Maker, Product Management and Purchasing; these are not an exhaustive or account-specific list.
- **Documented:** role metadata has a name, identifier and sequence position (D-CR3). Public sample options do not establish the configured list. No direct reference API request was made.
- **Documented API validation, not UI validation:** the specific-deal association API requires a Contact_Role object and reports missing-role and invalid-role errors, as well as invalid deal/contact and permission errors (D-CR4). This does not prove that the web mapping screen requires a role. A blank card cell cannot prove successful creation without a role or the meaning of `-None-`.
- **Not observable without a write / not documented in consulted sources:** adding the same contact twice (error, ignored selection or update), saving no selection, saving without a role, Edit All save behaviour, changing a relationship's Deal/Contact, exact validation messages and post-save states. The API identifies an association by deal/contact and describes its result as an update (D-CR4); inferring pair identity is reasonable, but rejecting a second add is not documented by that fact.

### Differences and unresolved checks against MEP-556

1. Its seven-option interim list is **unverified**, not a confirmed match. Documentation establishes configurable roles; it also mentions Decision Maker, absent from that list. This is a documentary difference, not proof of a missing configured option.
2. Optional role / `-None-` remains an interim UI rule. The blank display is observed; the public association API requires a role object. Keep this API/UI distinction explicit rather than claiming either behaviour was tested.
3. Duplicate-pair rejection and immutable Deal/Contact remain interim rules. The public API's pair-addressed update does not establish a duplicate-add validation error or the Edit All implementation.
4. Account-scoped candidates are documented (D-CR2). MEP-556 seeds same-account examples but its stated existence checks alone do not express this picker scope. Cross-account API acceptance is not established here.

### Documentary sources

Public primary help/developer documentation read on 2026-10-14; titles and section keys are neutral references. Source URLs are intentionally excluded under the repository naming rule. No authenticated reference endpoint was called and no example record values or identifiers were retained.

- D-CR1: **Modifying Special Fields**, “Customize Contact Roles”, customization and association steps.
- D-CR2: **FAQs: Contact Management**, “How to associate multiple contacts with a deal?”.
- D-CR3: **Get Contact Roles**, public API v8, response metadata definitions.
- D-CR4: **Add Contact Roles to a Specific Deal**, public API v8, input requirements, errors and update result.

## Stage History column comparison

Compare [deals.md](deals.md#stage-history-module), metadata only, with m4c-card-notes. Painted columns are Stage, Amount, Probability (%), Expected Revenue, Closing Date, Stage Duration (Calendar Days), then partially visible Modified Time. All seven labels correspond to exported fields, but their screen order differs from exported field order. Modified By exists in offscreen source only and is not asserted as painted. Deal Name, Record Id, Last Activity Time and Moved To are not painted; their metadata presence does not imply a visible column. The rightmost structure and row-end actions remain not observed. No table customization was opened.

## Record-page footer and edges

The fixed header, tabs, rail, full right edge and utility strip were inspected in every card image, including the lower card viewport. Floating Scroll To Top DD-98 is newly painted and reuses Accounts AD-111. The Invoices jump exposes the record customization footer: Add Related List DD-147, Standard View DD-148 and Create a custom record page DD-149 match Contacts D-93–D-95. The lower Deal Information fields, Description and rail Add Link remain unreachable with a permitted named section control in the baseline. No free scrolling or alternate control was invented. Checklists and Locking Information have no observed rail entry.

## Differences from earlier modules

- Notes has no populated row, Show More or rail count; Add a note follows the header directly.
- Stage History and Competitors introduce Deals-specific card regions and controls DD-99–DD-107.
- Cadences reuses Contacts rather than Accounts; its selected rail row paints a plus DD-108.
- Open Activities paints an untranslated selector label DD-111 in the same position as Accounts Column View. Other observed activity-card controls match Accounts.
- Contact Roles adds its two labeled upper actions and Role Name column; Emails uses a Deal association scope selector rather than Accounts sent-mail scope. Quotes remains unobserved after both permitted loading retries; lower fields have no permitted section-navigation control.

## Capability table

| Capability | Module | Reused from Accounts / Contacts or Deals-specific | Evidence / limit |
| --- | --- | --- | --- |
| Shared shell, Back, Tags, header actions and outer tabs | M4; Tags M6, email M10 | Accounts AD-01, AD-04–AD-07, AD-32–AD-35 | Menu/tab opening observed; write actions unoperated |
| Header amount and stage dates | M4 | Deals-specific | DD-90–DD-92; money/date format observed |
| Stage sequence and terminal controls | M4 | Deals-specific | DD-60–DD-65; effects not observed |
| Rail and counts | Per inventory | Accounts/Contacts plus Deals-specific entries | Presence/order only |
| SALES SUMMARY | M4 | Deals-specific | Painted labels only; calculation not observed |
| Five-field business card | M4 | Shared card frame, Deals-specific fields | Display only; inline editing not observed |
| Contact Person and Next Action links | M2/M3/M10/M5 | Accounts contact/email links moved; added activity summary | Links unoperated; card interiors deferred |
| More Options | Per menu inventory | Accounts plus Contacts Run Macro / Enroll to Cadence | Fifteen rows; outcomes not observed |
| Timeline History toolbar | M4/M12 | Accounts AD-159–AD-161 | Empty state observed; filter unopened |
| Related cards | Per card inventory | Shared Accounts/Contacts controls plus Stage History and Competitors | Upper and lower card viewports observed; actions unoperated; Quotes loading attempts unsuccessful |
| Lower details and record-page footer | M4/M11 | Footer reused from Contacts D-93–D-95 | Footer observed in m4c-card-invoices; lower fields lack permitted named section navigation |
| Populated stage-change Timeline rows | M4 | Deals-specific, not observed | No rows in this record |

## Capture refs

Only neutral slugs identify local evidence; raw images and customer values are not committed or uploaded.

| Slug | Clicks | Skipped | Observed state |
| --- | --- | --- | --- |
| m4d-list-base | 0 | 0 | Preserved populated board, four record links |
| m4d-detail-main | 1 | 0 | Preserved Overview baseline |
| m4d-detail-more | 2 | 0 | Fifteen-row menu |
| m4d-detail-timeline | 2 | 0 | History, empty log region |
| m4d-list-after | 0 | 0 | Same four links/columns; late column controls |
| m4c-list-base | 0 | 0 | Refreshed with extended wait; four record links, total count not painted |
| m4c-detail-base | 1 | 0 | Preserved Overview baseline, three related reads |
| m4c-card-notes | 2 | 0 | Preserved Notes through Competitors viewport |
| m4c-card-cadences | 2 | 0 | Cadences, Open/Closed Activities, Products header; expected blocked telemetry |
| m4c-card-quotes | 2 requested | 2 | 12000 ms attempt and 25000 ms retry both loading skeleton; no click applied |
| m4c-card-sales-orders | 2 | 0 | Sales Orders, populated Contact Roles, Emails, Cases and Invoices; New partly covered |
| m4c-card-invoices | 2 | 0 | Invoices header/actions fully visible; record customization footer |
| m4c-list-after | 0 | 0 | 12000 ms attempt and single 25000 ms retry: loading skeleton, no total comparison |

The first detail establishes three related reads; all successful subsequent card captures retain that count. Quotes has no applied click and only nine GET reads in each loading attempt. All captures satisfy the amended expected-call limits, including one blocked navigation read per detail capture. The menu and Timeline have no skipped click. No successful record write or telemetry request was observed. The base and main captures were not repeated. No stage, terminal action, persisted preference, menu row or unsafe card control was clicked.

MEP-347: extended-wait list and detail captures from the interrupted run are preserved. Notes was also completed in that run; its timestamp distinguishes it from the failed new invocation. Cadences first produced an empty directory; the single same-command retry succeeded. List/detail expected non-GET calls remain within their stated limits; detail and both cards have three related reads. Cadences includes one blocked POST /murphy/:id/clientmetricslog with a [telemetry] annotation. The previous stop misread that annotation; QA confirmed this is expected under rule 5a, so permitted card research resumed. No successful record write or persisted preference was observed. Resumed Sales Orders and Invoices each retain three related reads and the expected list/detail call limits. Quotes was attempted at 12000 ms and retried once at 25000 ms; both requested clicks were skipped in a loading skeleton, so no replacement selector or route was tried. Sales Orders also fully covers Contact Roles, Emails and Cases; dedicated captures for those cards were omitted under the no-duplicate rule. Invoices was captured because its New action was partly overlapped; the resulting image also exposes the footer. The final click-free list remained a loading skeleton at both 12000 ms and 25000 ms; its retained retry has nine GET reads and three blocked telemetry-tagged calls. The initial painted list has four visible record links but no total label, so neither total-record equality nor visible-link equality can be established.

## Open questions

- Previous/next record arrows are not painted, possibly because the navigation read was blocked; their availability/order/boundaries remain not observed.
- Passed-stage styling, closed-stage strip display, stage/terminal menus and transition effects remain not observed; pipeline research owns these gaps.
- Populated Timeline stage-change row structure and the relation between Stage History and Timeline remain not observed; this record shows an empty Timeline.
- Hover-only inline-edit, rail and card controls remain not observed. No hover or unsafe alternate selector was attempted.
- Competitors and Checklists retain unknown module ownership (`?`) from deals.md. Connected Records retains shared unknown ownership from Accounts; a lead decision is needed to assign it.
- No Deals-specific shell ownership decision was introduced. Unknown SH ownership remains in contacts.md.
- The earlier clientmetricslog stop was a reading error: its blocked-request entry carries [telemetry] and belongs to expected rule 5a. No exception or further network approval is required for the permitted card navigation.
- Lower Deal Information, Description and Add Link remain not observed: the baseline provides no permitted named section-navigation control. Quotes remains not observed after the 12000 ms attempt and single 25000 ms retry both stayed in a loading skeleton. Contact Roles empty state and hover-only row-end controls remain not observed.
- Total-record equality cannot be verified: the initial painted board has four visible links but no total count; column counts are not reliable totals.
- Stage History rightmost columns and row-end controls remain not observed; Modified Time is only partially painted and Modified By is offscreen. No horizontal scrolling was attempted.
- Checklists and Locking Information remain exported relations only; neither their rail controls nor card interiors were observed. Hover-only card controls remain not observed. No board decision is requested by this research.

## Reconciliation of controls.json

Every source ordinal is accounted for exactly once below. Repeated wrappers can map to one ID. Source counts are IDs represented by source items, not instance counts. Image-only additions: SH-46 in every image, DL-75–DL-76 in lists, DD-62 and DD-91–DD-92 in Overview. Menus may cover underlying controls whose source remains mapped; the difference inventory records that coverage. Source boxes use the capture viewport boundary; no measurements are reproduced.

### m4d-list-base

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 35–36, 38, 52, 60, 63, 84, 88, 112, 117, 120, 128–130, 140, 145, 163, 241, 245, 252, 256, 263, 265, 272, 275, 282 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 82, 85, 92–93, 95–96, 98–99, 102–103, 108–111, 139, 143, 238–239, 242, 290–305 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34 |
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
| excluded: below viewport/panel or beyond horizontal viewport | 66–81, 176–237, 283–289, 306 |
| excluded: invisible resize hotspot; no painted grip | 83, 240 |
| SH-26 | 86 |
| SH-27 | 87 |
| SH-28 | 89 |
| SH-29 | 90 |
| SH-30 | 91 |
| SH-31 | 94 |
| SH-32 | 97 |
| SH-33 | 100–101 |
| SH-34 | 104–107 |
| DL-01 | 113 |
| DL-02 | 114–116 |
| DL-03 | 118 |
| DL-04 | 119 |
| DL-05 | 121 |
| DL-06 | 122 |
| DL-07 | 123 |
| DL-08 | 124 |
| DL-09 | 125 |
| DL-10 | 126 |
| DL-11 | 127 |
| DL-12 | 131 |
| DL-13 | 132–133 |
| DL-14 | 134 |
| DL-70 | 135–137 |
| DL-71 | 138 |
| DL-15 | 141–142 |
| DL-16 | 144 |
| DL-17 | 146–147 |
| DL-19 | 148–149 |
| DL-20 | 150–151 |
| DL-21 | 152–153 |
| DL-22 | 154–155 |
| DL-23 | 156–157 |
| DL-24 | 158–159 |
| DL-25 | 160–161 |
| DL-26 | 162 |
| DL-27 | 164–165 |
| DL-65 | 166–167 |
| DL-66 | 168–169 |
| DL-67 | 170–171 |
| DL-68 | 172–173 |
| DL-69 | 174–175 |
| DL-72 | 243 |
| DL-77 | 244, 255, 274 |
| DL-78 | 246–247, 257–258, 266–267, 276–277 |
| DL-79 | 248–249, 259–260, 268–269, 278–279 |
| DL-80 | 250–251, 261–262, 270–271, 280–281 |
| DL-81 | 253, 264 |
| DL-73 | 254 |
| DL-74 | 273 |
| SH-35 | 307 |
| SH-36 | 308 |
| SH-37 | 309 |
| SH-38 | 310 |
| SH-39 | 311 |
| SH-40 | 312 |
| SH-41 | 313 |
| SH-42 | 314 |
| SH-43 | 315 |
| SH-44 | 316 |
| SH-45 | 317 |

317 source items; 86 inventory IDs represented; 162 excluded items.

### m4d-detail-main

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 83, 86, 106, 122, 174, 178, 194, 228 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 112, 114, 121, 125, 128, 131, 137, 140, 149, 152, 155, 161, 164, 167, 192–193, 213, 219, 221, 227, 252, 262, 266, 279, 285, 298, 302, 311, 314–315, 318, 321–324, 328, 336, 348–349, 358, 361, 377, 379, 382, 387, 390, 415, 425–426, 451–452, 465–466, 474–492, 505 |
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
| excluded: below viewport/panel or beyond horizontal viewport | 65–80, 172, 187–188, 233–251, 253–261, 263–265, 267–278, 280–284, 286–297, 299–301, 303–310, 312–313, 316–317, 319–320, 325–327, 329–335, 337–347, 350–357, 359–360, 362–376, 378, 380–381, 383–386, 388–389, 391–414, 416–424, 427–450, 453–464, 467–473, 493 |
| excluded: invisible resize hotspot; no painted grip | 82 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| DD-01 | 107–108 |
| excluded: static field/record data, not a separate control | 109, 169–170, 195–212, 214–218, 220, 222–226 |
| DD-90 | 110–111 |
| DD-04 | 113 |
| DD-05 | 115–116 |
| DD-06 | 117–118 |
| DD-07 | 119–120 |
| DD-10 | 123–124 |
| DD-11 | 126–127 |
| DD-12 | 129–130 |
| DD-54 | 132–133 |
| DD-57 | 134 |
| DD-55 | 135–136 |
| DD-13 | 138–139 |
| DD-15 | 141–142 |
| DD-30 | 143 |
| DD-16 | 144–145 |
| DD-31 | 146 |
| DD-18 | 147–148 |
| DD-20 | 150–151 |
| DD-21 | 153–154 |
| DD-56 | 156–157 |
| DD-58 | 158 |
| DD-23 | 159–160 |
| DD-19 | 162–163 |
| DD-24 | 165–166 |
| DD-29 | 168 |
| excluded: summary line clipped below utility-strip boundary | 171 |
| DD-32 | 173 |
| DD-33 | 175 |
| DD-34 | 176 |
| DD-35 | 177 |
| DD-60 | 179 |
| DD-61.1 | 180 |
| DD-61.2 | 181 |
| DD-61.3 | 182 |
| DD-61.4 | 183 |
| DD-61.5 | 184 |
| excluded: stage lies behind the clipped strip boundary; not painted | 185–186 |
| DD-63 | 189 |
| DD-64 | 190 |
| DD-65 | 191 |
| DD-66 | 229 |
| DD-67 | 230 |
| DD-68 | 231 |
| DD-69 | 232 |
| SH-35 | 494 |
| SH-36 | 495 |
| SH-37 | 496 |
| SH-38 | 497 |
| SH-39 | 498 |
| SH-40 | 499 |
| SH-41 | 500 |
| SH-42 | 501 |
| SH-43 | 502 |
| SH-44 | 503 |
| SH-45 | 504 |
| excluded: unpainted tooltip, not a separate control | 506 |

506 source items; 88 inventory IDs represented; 372 excluded items.

### m4d-detail-more

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 83, 86, 106, 122, 174, 178, 194, 228, 506 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 112, 114, 121, 125, 128, 131, 137, 140, 149, 152, 155, 161, 164, 167, 192–193, 213, 219, 221, 227, 252, 262, 266, 279, 285, 298, 302, 311, 314–315, 318, 321–324, 328, 336, 348–349, 358, 361, 377, 379, 382, 387, 390, 415, 425–426, 451–452, 465–466, 474–492, 505 |
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
| excluded: below viewport/panel or beyond horizontal viewport | 65–80, 172, 187–188, 233–251, 253–261, 263–265, 267–278, 280–284, 286–297, 299–301, 303–310, 312–313, 316–317, 319–320, 325–327, 329–335, 337–347, 350–357, 359–360, 362–376, 378, 380–381, 383–386, 388–389, 391–414, 416–424, 427–450, 453–464, 467–473, 493 |
| excluded: invisible resize hotspot; no painted grip | 82 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| DD-01 | 107–108 |
| excluded: static field/record data, not a separate control | 109, 169–170, 195–212, 214–218, 220, 222–226 |
| DD-90 | 110–111 |
| DD-04 | 113 |
| DD-05 | 115–116 |
| DD-06 | 117–118 |
| DD-07 | 119–120 |
| DD-10 | 123–124 |
| DD-11 | 126–127 |
| DD-12 | 129–130 |
| DD-54 | 132–133 |
| DD-57 | 134 |
| DD-55 | 135–136 |
| DD-13 | 138–139 |
| DD-15 | 141–142 |
| DD-30 | 143 |
| DD-16 | 144–145 |
| DD-31 | 146 |
| DD-18 | 147–148 |
| DD-20 | 150–151 |
| DD-21 | 153–154 |
| DD-56 | 156–157 |
| DD-58 | 158 |
| DD-23 | 159–160 |
| DD-19 | 162–163 |
| DD-24 | 165–166 |
| DD-29 | 168 |
| excluded: summary line clipped below utility-strip boundary | 171 |
| DD-32 | 173 |
| DD-33 | 175 |
| DD-34 | 176 |
| DD-35 | 177 |
| DD-60 | 179 |
| DD-61.1 | 180 |
| DD-61.2 | 181 |
| DD-61.3 | 182 |
| DD-61.4 | 183 |
| DD-61.5 | 184 |
| excluded: stage lies behind the clipped strip boundary; not painted | 185–186 |
| DD-63 | 189 |
| DD-64 | 190 |
| DD-65 | 191 |
| DD-66 | 229 |
| DD-67 | 230 |
| DD-68 | 231 |
| DD-69 | 232 |
| SH-35 | 494 |
| SH-36 | 495 |
| SH-37 | 496 |
| SH-38 | 497 |
| SH-39 | 498 |
| SH-40 | 499 |
| SH-41 | 500 |
| SH-42 | 501 |
| SH-43 | 502 |
| SH-44 | 503 |
| SH-45 | 504 |
| DD-07.1 | 507 |
| DD-07.2 | 508 |
| DD-07.3 | 509 |
| DD-07.4 | 510 |
| DD-07.5 | 511 |
| DD-07.6 | 512 |
| DD-07.7 | 513 |
| DD-07.8 | 514 |
| DD-07.9 | 515 |
| DD-07.10 | 516 |
| DD-07.11 | 517 |
| DD-07.12 | 518 |
| DD-07.13 | 519 |
| DD-07.14 | 520 |
| DD-07.15 | 521 |

521 source items; 103 inventory IDs represented; 372 excluded items.

### m4d-detail-timeline

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 83, 86, 106, 122, 174, 178, 180–181, 183, 185 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 112, 114, 121, 125, 128, 131, 137, 140, 149, 152, 155, 161, 164, 167, 179, 187–209 |
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
| excluded: below viewport/panel or beyond horizontal viewport | 65–80, 172, 210 |
| excluded: invisible resize hotspot; no painted grip | 82 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| DD-01 | 107–108 |
| excluded: static field/record data, not a separate control | 109, 169–170 |
| DD-90 | 110–111 |
| DD-04 | 113 |
| DD-05 | 115–116 |
| DD-06 | 117–118 |
| DD-07 | 119–120 |
| DD-10 | 123–124 |
| DD-11 | 126–127 |
| DD-12 | 129–130 |
| DD-54 | 132–133 |
| DD-57 | 134 |
| DD-55 | 135–136 |
| DD-13 | 138–139 |
| DD-15 | 141–142 |
| DD-30 | 143 |
| DD-16 | 144–145 |
| DD-31 | 146 |
| DD-18 | 147–148 |
| DD-20 | 150–151 |
| DD-21 | 153–154 |
| DD-56 | 156–157 |
| DD-58 | 158 |
| DD-23 | 159–160 |
| DD-19 | 162–163 |
| DD-24 | 165–166 |
| DD-29 | 168 |
| excluded: summary line clipped below utility-strip boundary | 171 |
| DD-32 | 173 |
| DD-33 | 175 |
| DD-34 | 176 |
| DD-35 | 177 |
| DD-70 | 182 |
| DD-71 | 184 |
| DD-72 | 186 |
| SH-35 | 211 |
| SH-36 | 212 |
| SH-37 | 213 |
| SH-38 | 214 |
| SH-39 | 215 |
| SH-40 | 216 |
| SH-41 | 217 |
| SH-42 | 218 |
| SH-43 | 219 |
| SH-44 | 220 |
| SH-45 | 221 |
| excluded: unpainted tooltip, not a separate control | 222 |

222 source items; 78 inventory IDs represented; 98 excluded items.

### m4d-list-after

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 35, 37, 51, 59, 62, 83, 87, 111, 116, 119, 127–129, 139, 144, 162, 240, 246, 253, 259, 266, 268, 275, 278, 285 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 138, 142, 237–238, 241, 293–307, 320 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34 |
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
| excluded: below viewport/panel or beyond horizontal viewport | 65–80, 175–236, 286–292, 308 |
| excluded: invisible resize hotspot; no painted grip | 82, 239 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| DL-01 | 112 |
| DL-02 | 113–115 |
| DL-03 | 117 |
| DL-04 | 118 |
| DL-05 | 120 |
| DL-06 | 121 |
| DL-07 | 122 |
| DL-08 | 123 |
| DL-09 | 124 |
| DL-10 | 125 |
| DL-11 | 126 |
| DL-12 | 130 |
| DL-13 | 131–132 |
| DL-14 | 133 |
| DL-70 | 134–136 |
| DL-71 | 137 |
| DL-15 | 140–141 |
| DL-16 | 143 |
| DL-17 | 145–146 |
| DL-19 | 147–148 |
| DL-20 | 149–150 |
| DL-21 | 151–152 |
| DL-22 | 153–154 |
| DL-23 | 155–156 |
| DL-24 | 157–158 |
| DL-25 | 159–160 |
| DL-26 | 161 |
| DL-27 | 163–164 |
| DL-65 | 165–166 |
| DL-66 | 167–168 |
| DL-67 | 169–170 |
| DL-68 | 171–172 |
| DL-69 | 173–174 |
| DL-72 | 242 |
| DD-L01 | 243–244 |
| DL-77 | 245, 258, 277 |
| DL-78 | 247–248, 260–261, 269–270, 279–280 |
| DL-79 | 249–250, 262–263, 271–272, 281–282 |
| DL-80 | 251–252, 264–265, 273–274, 283–284 |
| DL-81 | 254, 267 |
| DD-L02 | 255 |
| DD-L03 | 256 |
| DL-73 | 257 |
| DL-74 | 276 |
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

320 source items; 89 inventory IDs represented; 161 excluded items.

### m4c-list-base

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: structural wrapper, static heading or duplicate; no separate painted control | 1, 35, 37, 51, 59, 62, 65–66, 82–83, 87, 111, 116, 118–119, 127–129, 139, 144, 162, 175, 239–240, 246, 255, 261, 268, 270, 277, 280, 287, 310 |
| SH-01 | 2–3 |
| DL-02 | 4, 113–115 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 138, 142, 237–238, 241, 295–309, 322 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34 |
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
| excluded: record-row or static display data | 67 |
| excluded: outside viewport or clipped content boundary | 68–80, 177–236, 288–294 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| DL-01 | 112 |
| DL-03 | 117 |
| DL-05 | 120 |
| DL-06 | 121 |
| DL-07 | 122 |
| DL-08 | 123 |
| DL-09 | 124 |
| DL-10 | 125 |
| DL-11 | 126 |
| DL-12 | 130 |
| DL-13 | 131–132 |
| DL-14 | 133 |
| DL-70 | 134–136 |
| DL-71 | 137 |
| DL-15 | 140–141 |
| DL-16 | 143 |
| DL-17 | 145 |
| DD-L01 | 146, 148, 150, 152, 154, 156, 158, 160, 164, 166, 168, 170, 172, 174, 176, 243–244, 247–248 |
| DL-19 | 147 |
| DL-20 | 149 |
| DL-21 | 151 |
| DL-22 | 153 |
| DL-23 | 155 |
| DL-24 | 157 |
| DL-25 | 159 |
| DL-26 | 161 |
| DL-27 | 163 |
| DL-65 | 165 |
| DL-66 | 167 |
| DL-67 | 169 |
| DL-68 | 171 |
| DL-69 | 173 |
| DL-72 | 242 |
| DL-77 | 245, 260, 279 |
| DL-78 | 249–250, 262–263, 271–272, 281–282 |
| DL-79 | 251–252, 264–265, 273–274, 283–284 |
| DL-80 | 253–254, 266–267, 275–276, 285–286 |
| DL-81 | 256, 269 |
| DD-L02 | 257 |
| DD-L03 | 258 |
| DL-73 | 259 |
| DL-74 | 278 |
| SH-35 | 311 |
| SH-36 | 312 |
| SH-37 | 313 |
| SH-38 | 314 |
| SH-39 | 315 |
| SH-40 | 316 |
| SH-41 | 317 |
| SH-42 | 318 |
| SH-43 | 319 |
| SH-44 | 320 |
| SH-45 | 321 |

322 source items; 88 inventory IDs represented; 161 excluded items. Image-only IDs: SH-46, DL-75–DL-76.

### m4c-detail-base

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: structural wrapper, static heading or duplicate; no separate painted control | 1, 37, 51, 59, 62, 65–66, 82–83, 86, 106, 109, 122, 169–171, 174, 178, 185–186, 194–212, 214–218, 220, 222–226, 228, 494 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 112, 114, 121, 125, 128, 131, 137, 140, 149, 152, 155, 161, 164, 167, 192–193, 213, 219, 221, 227, 252, 262, 266, 279, 285, 298, 302, 311, 314–315, 318, 321–324, 328, 336, 348–349, 358, 361, 377, 379, 382, 387, 390, 415, 425–426, 451–452, 465–466, 474–493 |
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
| excluded: record-row or static display data | 67 |
| excluded: outside viewport or clipped content boundary | 68–80, 172, 187–188, 233–251, 253–261, 263–265, 267–278, 280–284, 286–297, 299–301, 303–310, 312–313, 316–317, 319–320, 325–327, 329–335, 337–347, 350–357, 359–360, 362–376, 378, 380–381, 383–386, 388–389, 391–414, 416–424, 427–450, 453–464, 467–473, 506 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| DD-01 | 107–108 |
| DD-90 | 110–111 |
| DD-04 | 113 |
| DD-05 | 115–116 |
| DD-06 | 117–118 |
| DD-07 | 119–120 |
| DD-10 | 123–124 |
| DD-11 | 126–127 |
| DD-12 | 129–130 |
| DD-54 | 132–133 |
| DD-57 | 134 |
| DD-55 | 135–136 |
| DD-13 | 138–139 |
| DD-15 | 141–142 |
| DD-30 | 143 |
| DD-16 | 144–145 |
| DD-31 | 146 |
| DD-18 | 147–148 |
| DD-20 | 150–151 |
| DD-21 | 153–154 |
| DD-56 | 156–157 |
| DD-58 | 158 |
| DD-23 | 159–160 |
| DD-19 | 162–163 |
| DD-24 | 165–166 |
| DD-29 | 168 |
| DD-32 | 173 |
| DD-33 | 175 |
| DD-34 | 176 |
| DD-35 | 177 |
| DD-60 | 179 |
| DD-61.1 | 180 |
| DD-61.2 | 181 |
| DD-61.3 | 182 |
| DD-61.4 | 183 |
| DD-61.5 | 184 |
| DD-63 | 189 |
| DD-64 | 190 |
| DD-65 | 191 |
| DD-66 | 229 |
| DD-67 | 230 |
| DD-68 | 231 |
| DD-69 | 232 |
| SH-35 | 495 |
| SH-36 | 496 |
| SH-37 | 497 |
| SH-38 | 498 |
| SH-39 | 499 |
| SH-40 | 500 |
| SH-41 | 501 |
| SH-42 | 502 |
| SH-43 | 503 |
| SH-44 | 504 |
| SH-45 | 505 |

506 source items; 88 inventory IDs represented; 372 excluded items. Image-only IDs: SH-46, DD-62, DD-91–DD-92.

### m4c-card-notes

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: structural wrapper, static heading or duplicate; no separate painted control | 1, 37, 51, 59, 62, 65–66, 82–83, 86, 106, 109, 121, 123, 172–174, 177, 317, 329–331, 333–334, 337–338, 341–343, 355, 358, 360, 368–369, 372, 374–375, 503 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 112, 114, 122, 127, 131, 134, 140, 143, 152, 155, 158, 164, 167, 170, 195–196, 216, 222, 224, 230, 255, 265, 269, 283, 289, 302, 306, 315, 318–319, 322, 325–328, 332, 340, 352–353, 362, 365, 381, 383, 386, 390, 393, 421, 431–432, 457–458, 475–476, 485–502, 515 |
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
| excluded: record-row or static display data | 67, 354, 356–357, 359, 361, 363–364, 366 |
| excluded: outside viewport or clipped content boundary | 68–80, 175, 181–194, 197–215, 217–221, 223, 225–229, 231–235, 237–238, 241–254, 256–264, 266–268, 270–273, 279–282, 284–288, 290–301, 303–305, 307–310, 351, 367, 373, 376–380, 382, 384–385, 387–389, 391–392, 394–420, 422–430, 433–456, 459–474, 477–483, 516 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| DD-01 | 107–108 |
| DD-90 | 110–111 |
| DD-04 | 113 |
| DD-05 | 115–116 |
| DD-06 | 117–118 |
| DD-07 | 119–120 |
| DD-93 | 124 |
| DD-10 | 125–126 |
| DD-94 | 128 |
| DD-11 | 129–130 |
| DD-12 | 132–133 |
| DD-54 | 135–136 |
| DD-57 | 137 |
| DD-55 | 138–139 |
| DD-13 | 141–142 |
| DD-15 | 144–145 |
| DD-30 | 146 |
| DD-16 | 147–148 |
| DD-31 | 149 |
| DD-18 | 150–151 |
| DD-20 | 153–154 |
| DD-21 | 156–157 |
| DD-56 | 159–160 |
| DD-58 | 161 |
| DD-23 | 162–163 |
| DD-19 | 165–166 |
| DD-24 | 168–169 |
| DD-29 | 171 |
| DD-32 | 176 |
| DD-33 | 178 |
| DD-34 | 179 |
| DD-35 | 180 |
| excluded: scrolled content behind fixed tab boundary | 236, 239–240, 274–278, 311–314, 316 |
| DD-95 | 320–321 |
| DD-96 | 323–324 |
| DD-97 | 335–336 |
| DD-99 | 339 |
| DD-100 | 344 |
| DD-101 | 345 |
| DD-102 | 346 |
| DD-103 | 347 |
| DD-104 | 348 |
| DD-105 | 349 |
| DD-106 | 350 |
| DD-107 | 370–371 |
| DD-98 | 484 |
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

516 source items; 90 inventory IDs represented; 376 excluded items. Image-only IDs: SH-46.

### m4c-card-cadences

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: structural wrapper, static heading or duplicate; no separate painted control | 1, 37, 51, 59, 62, 65–66, 82–83, 86, 106, 109, 121, 123, 172–174, 177, 371–372, 375–376, 387–389, 391–396, 400–401, 407–408, 415–417, 419–421, 425–427, 429–430, 435, 438–439, 539 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 112, 114, 122, 127, 130, 133, 139, 142, 152, 155, 158, 164, 167, 170, 195–196, 216, 222, 224, 230, 255, 265, 269, 282, 288, 301, 305, 314, 317–318, 321, 324–327, 331, 339, 351–352, 361, 364, 380, 382, 385, 397–399, 402–403, 405–406, 410, 413, 422–424, 431–433, 436–437, 461, 471–472, 497–498, 511–512, 521–538, 551 |
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
| excluded: record-row or static display data | 67, 390, 418, 428 |
| excluded: outside viewport or clipped content boundary | 68–80, 175, 181–194, 197–215, 217–221, 223, 225–229, 231–254, 256–264, 266–268, 270–281, 283–287, 289–300, 302–304, 306–313, 315–316, 319–320, 322–323, 328–330, 332–335, 337–338, 350, 366, 404, 434, 442–460, 462–470, 473–496, 499–510, 513–519, 552 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| DD-01 | 107–108 |
| DD-90 | 110–111 |
| DD-04 | 113 |
| DD-05 | 115–116 |
| DD-06 | 117–118 |
| DD-07 | 119–120 |
| DD-93 | 124 |
| DD-10 | 125–126 |
| DD-11 | 128–129 |
| DD-12 | 131–132 |
| DD-54 | 134–135 |
| DD-57 | 136 |
| DD-55 | 137–138 |
| DD-13 | 140–141 |
| DD-108 | 143 |
| DD-15 | 144–145 |
| DD-30 | 146 |
| DD-16 | 147–148 |
| DD-31 | 149 |
| DD-18 | 150–151 |
| DD-20 | 153–154 |
| DD-21 | 156–157 |
| DD-56 | 159–160 |
| DD-58 | 161 |
| DD-23 | 162–163 |
| DD-19 | 165–166 |
| DD-24 | 168–169 |
| DD-29 | 171 |
| DD-32 | 176 |
| DD-33 | 178 |
| DD-34 | 179 |
| DD-35 | 180 |
| excluded: scrolled content behind fixed tab boundary | 336, 340–349, 353–360, 362–363, 365, 367–370 |
| DD-109 | 373–374 |
| DD-110 | 377–379 |
| DD-111 | 381 |
| DD-112 | 383–384 |
| DD-113 | 386 |
| DD-116 | 409 |
| DD-117 | 411–412 |
| DD-118 | 414 |
| DD-121 | 440–441 |
| DD-98 | 520 |
| SH-35 | 540 |
| SH-36 | 541 |
| SH-37 | 542 |
| SH-38 | 543 |
| SH-39 | 544 |
| SH-40 | 545 |
| SH-41 | 546 |
| SH-42 | 547 |
| SH-43 | 548 |
| SH-44 | 549 |
| SH-45 | 550 |

552 source items; 87 inventory IDs represented; 413 excluded items. Image-only IDs: SH-46, DD-114–DD-115, DD-119–DD-120.

### m4c-list-after

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: structural navigation wrapper around loading skeleton | 1 |
| excluded: invisible zero-area element | 2–3 |

3 source items; 0 inventory IDs represented; 3 excluded items. No image-only control painted.

### m4c-card-sales-orders

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: structural wrapper, static label/value or repeated source; no separate painted control | 1, 37, 51, 59, 62, 82–83, 86, 106, 109, 121, 123–124, 172–174, 399–406, 411–412, 419–422, 430–433, 436, 439–440, 442–446, 456–457, 462–463 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 112, 114, 127, 130, 133, 139, 142, 151, 154, 157, 164, 167, 170, 195–196, 216, 222, 224, 230, 255, 265, 269, 282, 288, 301, 305, 314, 317–318, 321, 324–327, 331, 339, 351–352, 361, 364, 380, 382, 385, 390, 393, 418, 428–429, 454–455, 468–469, 478–495, 508 |
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
| excluded: outside viewport or behind fixed content header | 65–80, 175, 177, 181–194, 197–215, 217–221, 223, 225–229, 231–254, 256–264, 266–268, 270–281, 283–287, 289–300, 302–304, 306–313, 315–316, 319–320, 322–323, 328–330, 332–338, 340–350, 353–360, 362–363, 365–379, 381, 383–384, 386–389, 391–392, 394–398, 470–476, 496, 509 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| DD-01 | 107–108 |
| DD-90 | 110–111 |
| DD-04 | 113 |
| DD-05 | 115–116 |
| DD-06 | 117–118 |
| DD-07 | 119–120 |
| DD-93 | 122 |
| DD-10 | 125–126 |
| DD-11 | 128–129 |
| DD-12 | 131–132 |
| DD-54 | 134–135 |
| DD-57 | 136 |
| DD-55 | 137–138 |
| DD-13 | 140–141 |
| DD-15 | 143–144 |
| DD-30 | 145 |
| DD-16 | 146–147 |
| DD-31 | 148 |
| DD-18 | 149–150 |
| DD-20 | 152–153 |
| DD-21 | 155–156 |
| DD-122 | 158 |
| DD-56 | 159–160 |
| DD-58 | 161 |
| DD-23 | 162–163 |
| DD-19 | 165–166 |
| DD-24 | 168–169 |
| DD-29 | 171 |
| DD-32 | 176 |
| DD-33 | 178 |
| DD-34 | 179 |
| DD-35 | 180 |
| DD-123 | 407–408 |
| DD-124 | 409–410 |
| DD-125 | 413–414 |
| DD-126 | 415–416 |
| DD-127 | 417 |
| DD-128 | 423 |
| DD-129 | 424 |
| DD-130 | 425 |
| DD-131 | 426 |
| DD-132 | 427 |
| DD-133 | 434–435 |
| DD-134 | 437–438 |
| DD-136 | 441 |
| DD-138 | 447–448 |
| DD-139 | 449 |
| DD-140 | 450 |
| DD-141 | 451 |
| DD-137 | 452–453 |
| DD-142 | 458–459 |
| DD-143 | 460–461 |
| DD-144 | 464–465 |
| DD-145 | 466–467 |
| DD-98 | 477 |
| SH-35 | 497 |
| SH-36 | 498 |
| SH-37 | 499 |
| SH-38 | 500 |
| SH-39 | 501 |
| SH-40 | 502 |
| SH-41 | 503 |
| SH-42 | 504 |
| SH-43 | 505 |
| SH-44 | 506 |
| SH-45 | 507 |

509 source items; 100 inventory IDs represented; 351 excluded items.

Image-only additions for m4c-card-sales-orders: SH-46 and DD-135. These supplement the source-ID count; every source ordinal is assigned exactly once.

### m4c-card-quotes

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: loading structural wrapper; no painted control | 1 |
| excluded: invisible zero-area element | 2–3 |

3 source items; 0 inventory IDs represented; 3 excluded items.

### m4c-card-invoices

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: structural wrapper, static label/value or repeated source; no separate painted control | 1, 37, 51, 59, 62, 82–83, 86, 106, 109, 121, 123–124, 172–174, 405–410, 412, 419–422, 430–433, 436, 439–440, 442–446, 456–457, 462–463, 470 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 112, 114, 127, 130, 133, 139, 142, 151, 154, 157, 163, 166, 169, 195–196, 216, 222, 224, 230, 255, 265, 269, 282, 288, 301, 305, 314, 317–318, 321, 324–327, 331, 339, 351–352, 361, 364, 380, 382, 385, 390, 393, 418, 428–429, 454–455, 468–469, 478–496 |
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
| excluded: outside viewport or behind fixed content header | 65–80, 175, 177, 181–194, 197–215, 217–221, 223, 225–229, 231–254, 256–264, 266–268, 270–281, 283–287, 289–300, 302–304, 306–313, 315–316, 319–320, 322–323, 328–330, 332–338, 340–350, 353–360, 362–363, 365–379, 381, 383–384, 386–389, 391–392, 394–404, 411, 497, 509 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| DD-01 | 107–108 |
| DD-90 | 110–111 |
| DD-04 | 113 |
| DD-05 | 115–116 |
| DD-06 | 117–118 |
| DD-07 | 119–120 |
| DD-93 | 122 |
| DD-10 | 125–126 |
| DD-11 | 128–129 |
| DD-12 | 131–132 |
| DD-54 | 134–135 |
| DD-57 | 136 |
| DD-55 | 137–138 |
| DD-13 | 140–141 |
| DD-15 | 143–144 |
| DD-30 | 145 |
| DD-16 | 146–147 |
| DD-31 | 148 |
| DD-18 | 149–150 |
| DD-20 | 152–153 |
| DD-21 | 155–156 |
| DD-56 | 158–159 |
| DD-58 | 160 |
| DD-23 | 161–162 |
| DD-19 | 164–165 |
| DD-24 | 167–168 |
| DD-146 | 170 |
| DD-29 | 171 |
| DD-32 | 176 |
| DD-33 | 178 |
| DD-34 | 179 |
| DD-35 | 180 |
| DD-125 | 413–414 |
| DD-126 | 415–416 |
| DD-127 | 417 |
| DD-128 | 423 |
| DD-129 | 424 |
| DD-130 | 425 |
| DD-131 | 426 |
| DD-132 | 427 |
| DD-133 | 434–435 |
| DD-134 | 437–438 |
| DD-136 | 441 |
| DD-138 | 447–448 |
| DD-139 | 449 |
| DD-140 | 450 |
| DD-141 | 451 |
| DD-137 | 452–453 |
| DD-142 | 458–459 |
| DD-143 | 460–461 |
| DD-144 | 464–465 |
| DD-145 | 466–467 |
| DD-147 | 471 |
| DD-148 | 472–474 |
| DD-149 | 475–476 |
| DD-98 | 477 |
| SH-35 | 498 |
| SH-36 | 499 |
| SH-37 | 500 |
| SH-38 | 501 |
| SH-39 | 502 |
| SH-40 | 503 |
| SH-41 | 504 |
| SH-42 | 505 |
| SH-43 | 506 |
| SH-44 | 507 |
| SH-45 | 508 |

509 source items; 101 inventory IDs represented; 349 excluded items.

Image-only additions for m4c-card-invoices: SH-46 and DD-135. Every source ordinal is assigned exactly once.
