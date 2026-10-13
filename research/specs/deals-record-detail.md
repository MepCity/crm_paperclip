# Deals — record detail

Status: upper detail observed; lower-detail research not observed because its list baseline remained a loading skeleton. Submitted for independent inventory review. Module 4 / MEP-346 and MEP-347.

## Purpose

Describe the observed upper Deals detail, stage bar, More Options and Timeline. Reuse [accounts-record-detail.md](accounts-record-detail.md), then [contacts-record-detail.md](contacts-record-detail.md) and [record-detail.md](record-detail.md) for shared behaviour. Exported fields, stages and relations remain in [deals.md](deals.md). Lower field sections and related-card interiors were attempted in MEP-347 but remain not observed; stage-changing flows belong to MEP-353. No write was attempted.

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

Shell: not observed in this capture; the shell is replaced by a loading skeleton. The whole image, right edge and bottom corners were inspected.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No painted interactive control. Loading shapes and the central Loading indicator are static placeholders, not buttons. The prior task's record selector matches zero source items; no alternative record link exists in this capture. Detail/card captures were not attempted under the unique-selector rule.

Rest: as in m4-list-base only for the intended route; its populated screen is not painted here; covered by the overlay: none. Absent here: all painted SH and DL controls from that baseline, because the page is loading; this is not module-wide absence.

### Control inventory — m4c-list-after

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No changed painted control. The central loading animation differs in phase; it is not interactive. No record count or record link is painted in either list capture.

Rest: as in m4c-list-base; covered by the overlay: none. Absent here: same loading-state absence as m4c-list-base.

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

The first fifteen rows follow the rail observed in m4d-detail-main, not a newly observed card order. Checklists and Locking Information follow exported relations only and have no observed rail position. MEP-347 did not reach any card. Shared references identify earlier documentation, **not** confirmed Deals equivalence; every Deals interior remains not observed. No row data is reproduced.

| Order | Card title | Module | Counter | Upper controls | Column headers | Empty state | Ref | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Notes | M6 | not observed | not observed | not observed | not observed | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Related-list cards › Notes; Deals equivalence not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 2 | Connected Records | ? | not observed | not observed | not observed | not observed | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Related-list cards › Connected Records; Deals equivalence not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 3 | Attachments | M6 | not observed | not observed | not observed | not observed | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Related-list cards › Attachments; Deals equivalence not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 4 | Stage History | M4 | not observed | not observed | not observed | not observed | new scope; not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 5 | Competitors | ? | not observed | not observed | not observed | not observed | new scope; not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 6 | Cadences | P3 | not observed | not observed | not observed | not observed | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Related-list cards › Cadences; Deals equivalence not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 7 | Open Activities | M5 | not observed | not observed | not observed | not observed | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Related-list cards › Open Activities; Deals equivalence not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 8 | Closed Activities | M5 | not observed | not observed | not observed | not observed | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Related-list cards › Closed Activities; Deals equivalence not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 9 | Products | P2 | not observed | not observed | not observed | not observed | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Related-list cards › Products; Deals equivalence not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 10 | Quotes | P2 | not observed | not observed | not observed | not observed | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Related-list cards › Quotes; Deals equivalence not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 11 | Sales Orders | P2 | not observed | not observed | not observed | not observed | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Related-list cards › Sales Orders; Deals equivalence not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 12 | Contact Roles | M2 | not observed | not observed | not observed | not observed | new scope; not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 13 | Emails | M10 | not observed | not observed | not observed | not observed | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Related-list cards › Emails; Deals equivalence not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 14 | Cases | M8 | not observed | not observed | not observed | not observed | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Related-list cards › Cases; Deals equivalence not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| 15 | Invoices | P2 | not observed | not observed | not observed | not observed | [accounts-record-detail.md](accounts-record-detail.md#related-list-cards) › Related-list cards › Invoices; Deals equivalence not observed | not observed (MEP-347); rail seen (m4d-detail-main) |
| not observed | Checklists | ? | not observed | not observed | not observed | not observed | new scope; not observed | not observed (MEP-347); exported relation (deals.md) |
| not observed | Locking Information | M11 | not observed | not observed | not observed | not observed | new scope; not observed | not observed (MEP-347); exported relation (deals.md) |

Stage History, Contact Roles and Competitors have observed rail links (DD-54–DD-56), but no observed card headings, counters, upper buttons, columns, empty states or row-end controls. Connected Records also remains not observed at card level despite its shared rail reference. Stage History columns cannot be compared with [deals.md](deals.md#stage-history-module) without a painted card; metadata is not substituted for screen evidence. No new DD number is assigned to an unobserved control.

## Record-page footer and edges

The upper-detail right edge and utility strip retain the existing shell references. The record-page footer, lower Deal Information fields and description were not reached in MEP-347. Its two list images contain only shell/content skeletons and a central loading indicator, with no painted footer, edge icon or corner control. No named section-navigation control was available because no detail capture could be opened. This does not establish the absence of lower record controls.

## Differences from earlier modules

No lower-detail or card difference can be established from the loading captures. Accounts and Contacts remain the nearest shared-card documentation; their controls are not asserted as present in Deals until observed. The Deals-specific upper-detail differences above remain unchanged.

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
| Lower details, related cards and record-page footer | Per related-card table | Shared candidates plus Deals-specific card scope | not observed in MEP-347; loading baseline prevents verified navigation |
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
| m4c-list-base | 0 | 0 | Loading skeleton; no record links/count |
| m4c-list-after | 0 | 0 | Loading skeleton; no record links/count |

The first detail establishes three related reads; both subsequent detail captures retain that count. All captures satisfy the amended expected-call limits, including one blocked navigation read per detail capture. The menu and Timeline have no skipped click. No successful record write or telemetry request was observed. The base and main captures were not repeated. No stage, terminal action, persisted preference, menu row or unsafe card control was clicked.

MEP-347: both preserved list captures have nine GET calls, no non-GET call, no blocked request and no skipped click. Their record counts cannot be compared because neither is painted. No detail baseline or related-read count was established. Detail, card and section captures were omitted because no unique record link could be validated in m4c-list-base. The loading-race retry rule applies to a skipped first click in a click-containing capture; neither capture has a click, so it was not invoked. No write or preference action was attempted.

## Open questions

- Previous/next record arrows are not painted, possibly because the navigation read was blocked; their availability/order/boundaries remain not observed.
- Passed-stage styling, closed-stage strip display, stage/terminal menus and transition effects remain not observed; pipeline research owns these gaps.
- Populated Timeline stage-change row structure and the relation between Stage History and Timeline remain not observed; this record shows an empty Timeline.
- Hover-only inline-edit, rail and card controls remain not observed. No hover or unsafe alternate selector was attempted.
- Competitors and Checklists retain unknown module ownership (`?`) from deals.md. Connected Records retains shared unknown ownership from Accounts; a lead decision is needed to assign it.
- No Deals-specific shell ownership decision was introduced. Unknown SH ownership remains in contacts.md.
- MEP-347 could not open detail: its list baseline has no record link. Lower Deal Information fields, description, Add Link and every card interior remain not observed. The final list also remained a loading skeleton, so total-record equality cannot be verified. No alternate selector, direct record path or extra capture was attempted.
- Stage History column comparison with deals.md › Stage History module remains not observed; exported field definitions are not evidence of painted column headings.
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

### m4c-list-base and m4c-list-after

Each capture has the same three source items; every item is excluded, with no represented inventory ID. Both screenshots were opened as images and inspected over the entire viewport; no image-only interactive control exists.

| Inventory number / exclusion reason | controls.json item ordinals, each capture |
| --- | --- |
| excluded: structural navigation wrapper around the skeleton; no painted control | 1 |
| excluded: invisible zero-area element | 2–3 |

Each: 3 source items; 0 inventory IDs represented; 3 excluded items. No shell ID is claimed from unpainted skeleton shapes.
