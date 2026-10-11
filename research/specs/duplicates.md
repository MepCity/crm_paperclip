# Duplicate discovery and merging

## Purpose

Document record-specific duplicate search and module-wide deduplication for Leads and Contacts, without executing either operation. Module 2 delivers both capabilities by assignment; related content follows its own module. Live evidence establishes only the list-menu entry; workflow evidence comes from public help.

## Control inventory

### Control inventory — list-actions

Contacts `m2-list-actions` was unavailable at research time, so this existing Leads capture is the authorized fallback. No new list-menu click was made. Its older capture has no controls.json: reconciliation is unavailable, not zero controls. Full screenshot was opened as an image.

Shell controls reuse SH-01–SH-46 from global-search.md at their corresponding shell positions. Home is unselected; Leads is selected. In this older screenshot the bottom-left utility cluster additionally includes the following controls (and Contacts follows them). The branding-bearing sheet menu row uses a neutral description.

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-47 | Shell | Channels | icon button | bottom strip, left, third | not observed | seen (list-actions) | ? |
| SH-48 | Shell | Threads | icon button | bottom strip, left, fourth | not observed | seen (list-actions) | ? |
| X-01 | View header | All Leads | button | header, left, first | not observed | seen (list-actions) | M1 |
| X-02 | View header | Three dots icon | icon button | header, left, second | not observed | seen (list-actions) | M1 |
| X-03 | Toolbar | Filter | button | toolbar, left, first | not observed | seen (list-actions) | M1 |
| X-04 | Toolbar | Sort | button | toolbar, left, second | not observed | seen (list-actions) | M1 |
| X-05 | Toolbar | List icon | icon button | toolbar, left, 3 | not observed | seen (list-actions) | M1 |
| X-06 | Toolbar | Vertical panels icon | icon button | toolbar, left, 4 | not observed | seen (list-actions) | M1 |
| X-07 | Toolbar | Table icon | icon button | toolbar, left, 5 | not observed | seen (list-actions) | M1 |
| X-08 | Toolbar | Pie chart icon | icon button | toolbar, left, 6 | not observed | seen (list-actions) | M1 |
| X-09 | Toolbar | Hierarchy icon | icon button | toolbar, left, 7 | not observed | seen (list-actions) | M1 |
| X-10 | Toolbar | Horizontal panels icon | icon button | toolbar, left, 8 | not observed | seen (list-actions) | M1 |
| X-11 | Toolbar | Down chevron | icon button | toolbar, left, 9 | not observed | seen (list-actions) | M1 |
| X-12 | Toolbar | Refresh icon | icon button | toolbar, left, 10 | not observed | seen (list-actions) | M1 |
| X-13 | Toolbar | Create Lead | button | toolbar, right group, left | not observed | seen (list-actions) | M1 |
| X-14 | Toolbar | Down arrow | icon button | toolbar, right group, middle | not observed | seen (list-actions) | M1 |
| X-15 | Toolbar | Three dots icon | icon button | toolbar, right group, right | open Actions menu already shown | seen (list-actions) | M1 |
| X-15.1 | Actions menu | Mass Transfer | menu item | menu, row 1 | not observed | seen (list-actions) | M1 |
| X-15.2 | Actions menu | Mass Delete | menu item | menu, row 2 | not observed | seen (list-actions) | M1 |
| X-15.3 | Actions menu | Mass Update | menu item | menu, row 3 | not observed | seen (list-actions) | M1 |
| X-15.4 | Actions menu | Mass Convert | menu item | menu, row 4 | not observed | seen (list-actions) | M1 |
| X-15.5 | Actions menu | Manage Tags | menu item | menu, row 5 | not observed | seen (list-actions) | M11 |
| X-15.6 | Actions menu | Assignment Rules | menu item | menu, row 6 | not observed | seen (list-actions) | M12 |
| X-15.7 | Actions menu | Drafts | menu item | menu, row 7 | not observed | seen (list-actions) | M1 |
| X-15.8 | Actions menu | Mass Email | menu item | menu, row 8 | not observed | seen (list-actions) | M10 |
| X-15.9 | Actions menu | Approve Leads | menu item | menu, row 9 | not observed | seen (list-actions) | P3 |
| X-15.10 | Actions menu | Deduplicate Leads | menu item | menu, row 10 | not observed | seen (list-actions) | M2 |
| X-15.11 | Actions menu | Add to Campaigns | menu item | menu, row 11 | not observed | seen (list-actions) | M7 |
| X-15.12 | Actions menu | Create Client Script | menu item | menu, row 12 | not observed | seen (list-actions) | M11 |
| X-15.13 | Actions menu | Export Leads | menu item | menu, row 13 | not observed | seen (list-actions) | M6 |
| X-15.14 | Actions menu | Spreadsheet view (neutral description) | menu item | menu, row 14 | not observed | seen (list-actions) | ? |
| X-15.15 | Actions menu | Print View | menu item | menu, row 15 | not observed | seen (list-actions) | M6 |
| X-16 | Filter panel | Search | input | panel, top | not observed | seen (list-actions) | M1 |
| X-17 | Filter panel | System Defined Fil… | button | panel, first group heading | not observed | seen (list-actions) | M1 |
| X-17.1 | Filter panel | Activities | checkbox | first group, row 1 | not observed | seen (list-actions) | M5 |
| X-17.2 | Filter panel | Campaigns | checkbox | first group, row 2 | not observed | seen (list-actions) | M7 |
| X-17.3 | Filter panel | Latest Email Status | checkbox | first group, row 3 | not observed | seen (list-actions) | M10 |
| X-17.4 | Filter panel | Locked | checkbox | first group, row 4 | not observed | seen (list-actions) | P3 |
| X-17.5 | Filter panel | Record Action | checkbox | first group, row 5 | not observed | seen (list-actions) | M1 |
| X-17.6 | Filter panel | Related Records Action | checkbox | first group, row 6 | not observed | seen (list-actions) | M1 |
| X-17.7 | Filter panel | Touched Records | checkbox | first group, row 7 | not observed | seen (list-actions) | M1 |
| X-17.8 | Filter panel | Untouched Records | checkbox | first group, row 8 | not observed | seen (list-actions) | M1 |
| X-17.9 | Filter panel | Cadences | checkbox | first group, row 9 | not observed | seen (list-actions) | P3 |
| X-18 | Filter panel | Filter By Fields | button | panel, second group heading | not observed | seen (list-actions) | M1 |
| X-18.1 | Filter panel | Address | checkbox | second group, row 1 | not observed | seen (list-actions) | M1 |
| X-18.2 | Filter panel | Address - City | checkbox | second group, row 2 | not observed | seen (list-actions) | M1 |
| X-18.3 | Filter panel | Address - Country / Region | checkbox | second group, row 3 | not observed | seen (list-actions) | M1 |
| X-18.4 | Filter panel | Address - Flat / House No. / Building / | checkbox | second group, row 4 (clipped label) | not observed | seen (list-actions) | M1 |
| X-19 | Table | Select all | checkbox | table header, first | not observed | seen (list-actions) | M1 |
| X-20.1 | Table | Lead Name | column header | table header, data column 1 | not observed | seen (list-actions) | M1 |
| X-20.2 | Table | Company | column header | table header, data column 2 | not observed | seen (list-actions) | M1 |
| X-20.3 | Table | Email | column header | table header, data column 3 | not observed | seen (list-actions) | M1 |
| X-20.4 | Table | Column obscured by menu | column header | table header, data column 4 | not observed | not observed | M1 |
| X-21 | Table | All | select | Lead Name header, right | not observed | seen (list-actions) | M1 |
| X-22.1 | Table | Record selection | checkbox | table, row 1, left | not observed | seen (list-actions) | M1 |
| X-22.2 | Table | Record selection | checkbox | table, row 2, left | not observed | seen (list-actions) | M1 |
| X-22.3 | Table | Record selection | checkbox | table, row 3, left | not observed | seen (list-actions) | M1 |
| X-22.4 | Table | Record selection | checkbox | table, row 4, left | not observed | seen (list-actions) | M1 |
| X-22.5 | Table | Record selection | checkbox | table, row 5, left | not observed | seen (list-actions) | M1 |
| X-22.6 | Table | Record selection | checkbox | table, row 6, left | not observed | seen (list-actions) | M1 |
| X-22.7 | Table | Record selection | checkbox | table, row 7, left | not observed | seen (list-actions) | M1 |
| X-22.8 | Table | Record selection | checkbox | table, row 8, left | not observed | seen (list-actions) | M1 |
| X-22.9 | Table | Record selection | checkbox | table, row 9, left | not observed | seen (list-actions) | M1 |
| X-22.10 | Table | Record selection | checkbox | table, row 10, left | not observed | seen (list-actions) | M1 |
| X-23.1 | Table | Record name (value omitted) | link | table, row 1, name cell | not observed | seen (list-actions) | M1 |
| X-23.2 | Table | Record name (value omitted) | link | table, row 2, name cell | not observed | seen (list-actions) | M1 |
| X-23.3 | Table | Record name (value omitted) | link | table, row 3, name cell | not observed | seen (list-actions) | M1 |
| X-23.4 | Table | Record name (value omitted) | link | table, row 4, name cell | not observed | seen (list-actions) | M1 |
| X-23.5 | Table | Record name (value omitted) | link | table, row 5, name cell | not observed | seen (list-actions) | M1 |
| X-23.6 | Table | Record name (value omitted) | link | table, row 6, name cell | not observed | seen (list-actions) | M1 |
| X-23.7 | Table | Record name (value omitted) | link | table, row 7, name cell | not observed | seen (list-actions) | M1 |
| X-23.8 | Table | Record name (value omitted) | link | table, row 8, name cell | not observed | seen (list-actions) | M1 |
| X-23.9 | Table | Record name (value omitted) | link | table, row 9, name cell | not observed | seen (list-actions) | M1 |
| X-23.10 | Table | Record name (value omitted) | link | table, row 10, name cell | not observed | seen (list-actions) | M1 |
| X-24.1 | Table | Activity date badge (value omitted) | badge | table, row 8, before name | not observed | seen (list-actions) | M5 |
| X-24.2 | Table | Activity date badge (value omitted) | badge | table, row 10, before name | not observed | seen (list-actions) | M5 |
| X-25 | Table footer | Left arrow | icon button | footer, right, first | not observed | seen (list-actions) | M1 |
| X-26 | Table footer | Right arrow | icon button | footer, right, last | not observed | seen (list-actions) | M1 |

The record count and range are text, not actions; ordinary data cells are omitted. Print View includes a right-facing submenu arrow within the same menu item. No tooltip or hidden row action was opened (list-actions). Headers behind the menu or horizontal clipping (Lead Source / Lead Owner) are not counted as visible; Phone is explicitly marked unobserved.

### Documented controls — D2: record-specific criteria and matching records

Images D2-image-2 and D2-image-3 are cropped panels; no unseen surrounding controls are inferred. `toggle` below represents a native radio choice because the task inventory vocabulary has no radio type.

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| X-27 | Criteria | Match any of the criteria below | select | criteria heading, right | chooses any/all matching | documented (D2) | M2 |
| X-28.1.1 | Criteria | First Name | select | criterion row 1, left | choose field | documented (D2) | M2 |
| X-28.1.2 | Criteria | Operator | select | criterion row 1, middle | choose condition | documented (D2) | M2 |
| X-28.1.3 | Criteria | Value field | input | criterion row 1, right | criterion value | documented (D2) | M2 |
| X-28.1.4 | Criteria | Minus icon | icon button | criterion row 1, far right | remove criterion | documented (D2) | M2 |
| X-28.2.1 | Criteria | Last Name | select | criterion row 2, left | choose field | documented (D2) | M2 |
| X-28.2.2 | Criteria | Operator | select | criterion row 2, middle | choose condition | documented (D2) | M2 |
| X-28.2.3 | Criteria | Value field | input | criterion row 2, right | criterion value | documented (D2) | M2 |
| X-28.2.4 | Criteria | Minus icon | icon button | criterion row 2, far right | remove criterion | documented (D2) | M2 |
| X-28.3.1 | Criteria | Email | select | criterion row 3, left | choose field | documented (D2) | M2 |
| X-28.3.2 | Criteria | Operator | select | criterion row 3, middle | choose condition | documented (D2) | M2 |
| X-28.3.3 | Criteria | Value field | input | criterion row 3, right | criterion value | documented (D2) | M2 |
| X-28.3.4 | Criteria | Minus icon | icon button | criterion row 3, far right | remove criterion | documented (D2) | M2 |
| X-28.4.1 | Criteria | Mobile | select | criterion row 4, left | choose field | documented (D2) | M2 |
| X-28.4.2 | Criteria | Operator | select | criterion row 4, middle | choose condition | documented (D2) | M2 |
| X-28.4.3 | Criteria | Value field | input | criterion row 4, right | criterion value | documented (D2) | M2 |
| X-28.4.4 | Criteria | Minus icon | icon button | criterion row 4, far right | remove criterion | documented (D2) | M2 |
| X-28.5.1 | Criteria | Fax | select | criterion row 5, left | choose field | documented (D2) | M2 |
| X-28.5.2 | Criteria | Operator | select | criterion row 5, middle | choose condition | documented (D2) | M2 |
| X-28.5.3 | Criteria | Value field | input | criterion row 5, right | criterion value | documented (D2) | M2 |
| X-28.5.4 | Criteria | Minus icon | icon button | criterion row 5, far right | remove criterion | documented (D2) | M2 |
| X-29 | Criteria | Plus icon | icon button | last criterion, after minus | add criterion | documented (D2) | M2 |
| X-30 | Field menu | Search field | input | open field menu, top | not observed | documented (D2) | M2 |
| X-28.5.1.1 | Field menu | Email Opt Out | menu item | field menu, visible row 1 | choose criterion field | documented (D2) | M2 |
| X-28.5.1.2 | Field menu | Fax | menu item | field menu, visible row 2 | choose criterion field | documented (D2) | M2 |
| X-28.5.1.3 | Field menu | First Name | menu item | field menu, visible row 3 | choose criterion field | documented (D2) | M2 |
| X-28.5.1.4 | Field menu | Full Name | menu item | field menu, visible row 4 | choose criterion field | documented (D2) | M2 |
| X-28.5.1.5 | Field menu | Industry | menu item | field menu, visible row 5 | choose criterion field | documented (D2) | M2 |
| X-28.5.1.6 | Field menu | Last Activity Time | menu item | field menu, visible row 6 | choose criterion field | documented (D2) | M2 |
| X-28.5.1.7 | Field menu | Last Name | menu item | field menu, visible row 7 | choose criterion field | documented (D2) | M2 |
| X-31 | Criteria | Search | button | criteria panel, lower right | fetch matching records | documented (D2) | M2 |
| X-32 | Matching Records | Clear | link | selection summary, after count | clear selected records | documented (D2) | M2 |
| X-33 | Matching Records | Next | button | selection summary, after Clear | continue to merge | documented (D2) | M2 |
| X-34 | Matching Records | Left arrow | icon button | panel, upper right, first | pagination | documented (D2) | M2 |
| X-35 | Matching Records | Right arrow | icon button | panel, upper right, second | pagination | documented (D2) | M2 |
| X-36.1 | Matching Records | Lead Name | column header | table, column 1 | display field | documented (D2) | M2 |
| X-36.2 | Matching Records | Company | column header | table, column 2 | display field | documented (D2) | M2 |
| X-36.3 | Matching Records | Email | column header | table, column 3 | display field | documented (D2) | M2 |
| X-36.4 | Matching Records | Phone | column header | table, column 4 | display field | documented (D2) | M2 |
| X-36.5 | Matching Records | Mobile | column header | table, column 5 | display field | documented (D2) | M2 |
| X-36.6 | Matching Records | Created Time | column header | table, column 6 | display field | documented (D2) | M2 |
| X-36.7 | Matching Records | Modified Time | column header | table, column 7 | display field | documented (D2) | M2 |
| X-36.8 | Matching Records | Lead Owner | column header | table, column 8 | display field | documented (D2) | M2 |
| X-37.1 | Matching Records | Record selection | checkbox | table row 1, first cell | select record | documented (D2) | M2 |
| X-37.2 | Matching Records | Record selection | checkbox | table row 2, first cell | select record | documented (D2) | M2 |
| X-37.3 | Matching Records | Record selection | checkbox | table row 3, first cell | select record | documented (D2) | M2 |
| X-37.4 | Matching Records | Record selection | checkbox | table row 4, first cell | select record | documented (D2) | M2 |
| X-37.5 | Matching Records | Record selection | checkbox | table row 5, first cell | select record | documented (D2) | M2 |

### Documented controls — D2: merge comparison

D2-image-4 shows a Contacts comparison. Its compact documentary shell is not the captured session shell: SH-01, SH-03, SH-05, SH-06, SH-09 and SH-27–SH-28/SH-30–SH-35 reappear; the additional truncated My Requ… link is listed below. No assistant icon appears in this illustration.

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SH-49 | Documentary shell | My Requ… | link | compact rail, fourth navigation row | not observed | documented (D2) | M2 |
| X-38 | Merge header | Information icon | icon button | beside page title | not observed | documented (D2) | M2 |
| X-39 | Merge header | Cancel | button | page header, right, first | not observed | documented (D2) | M2 |
| X-40 | Merge header | Merge | button | page header, right, last | commit merge | documented (D2) | M2 |
| X-41 | Merge comparison | Show Conflicts Only | checkbox | above table, right | hide matching fields | documented (D2) | M2 |
| X-42.1 | Merge comparison | Record 1 | toggle | comparison header, source column 1 | choose master | documented (D2) | M2 |
| X-43.1 | Merge comparison | Select All | link | comparison header, source column 1, after record | take source values | documented (D2) | M2 |
| X-42.2 | Merge comparison | Record 2 | toggle | comparison header, source column 2 | choose master | documented (D2) | M2 |
| X-43.2 | Merge comparison | Select All | link | comparison header, source column 2, after record | take source values | documented (D2) | M2 |
| X-42.3 | Merge comparison | Record 3 | toggle | comparison header, source column 3 | choose master | documented (D2) | M2 |
| X-43.3 | Merge comparison | Select All | link | comparison header, source column 3, after record | take source values | documented (D2) | M2 |
| X-44.1.1 | Merge comparison | Account Name value choice | toggle | Account Name row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.1.2 | Merge comparison | Account Name value choice | toggle | Account Name row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.1.3 | Merge comparison | Account Name value choice | toggle | Account Name row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.2.1 | Merge comparison | Contact Image value choice | toggle | Contact Image row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.2.2 | Merge comparison | Contact Image value choice | toggle | Contact Image row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.2.3 | Merge comparison | Contact Image value choice | toggle | Contact Image row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.3.1 | Merge comparison | Department value choice | toggle | Department row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.3.2 | Merge comparison | Department value choice | toggle | Department row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.3.3 | Merge comparison | Department value choice | toggle | Department row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.4.1 | Merge comparison | Email value choice | toggle | Email row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.4.2 | Merge comparison | Email value choice | toggle | Email row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.4.3 | Merge comparison | Email value choice | toggle | Email row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.5.1 | Merge comparison | First Name value choice | toggle | First Name row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.5.2 | Merge comparison | First Name value choice | toggle | First Name row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.5.3 | Merge comparison | First Name value choice | toggle | First Name row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.6.1 | Merge comparison | Last Name value choice | toggle | Last Name row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.6.2 | Merge comparison | Last Name value choice | toggle | Last Name row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.6.3 | Merge comparison | Last Name value choice | toggle | Last Name row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.7.1 | Merge comparison | Lead Source value choice | toggle | Lead Source row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.7.2 | Merge comparison | Lead Source value choice | toggle | Lead Source row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.7.3 | Merge comparison | Lead Source value choice | toggle | Lead Source row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.8.1 | Merge comparison | Mailing City value choice | toggle | Mailing City row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.8.2 | Merge comparison | Mailing City value choice | toggle | Mailing City row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.8.3 | Merge comparison | Mailing City value choice | toggle | Mailing City row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.9.1 | Merge comparison | Mailing State value choice | toggle | Mailing State row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.9.2 | Merge comparison | Mailing State value choice | toggle | Mailing State row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.9.3 | Merge comparison | Mailing State value choice | toggle | Mailing State row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.10.1 | Merge comparison | Mailing Street value choice | toggle | Mailing Street row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.10.2 | Merge comparison | Mailing Street value choice | toggle | Mailing Street row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.10.3 | Merge comparison | Mailing Street value choice | toggle | Mailing Street row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.11.1 | Merge comparison | Mailing Zip value choice | toggle | Mailing Zip row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.11.2 | Merge comparison | Mailing Zip value choice | toggle | Mailing Zip row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.11.3 | Merge comparison | Mailing Zip value choice | toggle | Mailing Zip row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.12.1 | Merge comparison | Phone value choice | toggle | Phone row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.12.2 | Merge comparison | Phone value choice | toggle | Phone row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.12.3 | Merge comparison | Phone value choice | toggle | Phone row, source column 3 | select final field value | documented (D2) | M2 |
| X-44.13.1 | Merge comparison | Title value choice | toggle | Title row, source column 1 | select final field value | documented (D2) | M2 |
| X-44.13.2 | Merge comparison | Title value choice | toggle | Title row, source column 2 | select final field value | documented (D2) | M2 |
| X-44.13.3 | Merge comparison | Title value choice | toggle | Title row, source column 3 | select final field value | documented (D2) | M2 |

Modified Time is displayed without a radio choice in this example (D2-image-4). Record values and portraits are excluded.

### Documented controls — D3: deduplication

Images D3-image-3–D3-image-8 show field selection, confirmation, progress notice, conflict popup and conflict groups. D3-image-2 is an older menu illustration; current entry position is taken from list-actions instead.

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| X-45.1 | Deduplicate fields | Email | checkbox | field panel, row 1 | choose match field | documented (D3) | M2 |
| X-45.2 | Deduplicate fields | Company | checkbox | field panel, row 2 | choose match field | documented (D3) | M2 |
| X-45.3 | Deduplicate fields | Phone | checkbox | field panel, row 3 | choose match field | documented (D3) | M2 |
| X-45.4 | Deduplicate fields | Mobile | checkbox | field panel, row 4 | choose match field | documented (D3) | M2 |
| X-46 | Deduplicate fields | Find And Merge Duplicates | button | field panel, footer left | start deduplication confirmation | documented (D3) | M2 |
| X-47 | Deduplicate fields | Cancel | button | field panel, footer right | not observed | documented (D3) | M2 |
| X-48 | Confirmation | Learn More | link | confirmation, below explanation | not observed | documented (D3) | M2 |
| X-49 | Confirmation | Cancel | button | confirmation, footer left | not observed | documented (D3) | M2 |
| X-50 | Confirmation | Yes, proceed | button | confirmation, footer right | start job | documented (D3) | M2 |
| X-51 | Progress notice | OK | button | notice, bottom centre | not observed | documented (D3) | M2 |
| X-52 | Conflict popup | Minus icon | icon button | popup title, right | not observed | documented (D3) | M2 |
| X-53 | Conflict popup | Do it later | button | popup body, right, first | defer resolution | documented (D3) | M2 |
| X-54 | Conflict popup | Resolve Now | button | popup body, right, second | open conflict groups | documented (D3) | M2 |
| X-55 | Conflict groups | Cancel | button | page header, right | not observed | documented (D3) | M2 |
| X-56.1 | Conflict groups | Email | tab | group panel, top left, 1 | switch match-field group | documented (D3) | M2 |
| X-56.2 | Conflict groups | Company | tab | group panel, top left, 2 | switch match-field group | documented (D3) | M2 |
| X-56.3 | Conflict groups | Mobile | tab | group panel, top left, 3 | switch match-field group | documented (D3) | M2 |
| X-57 | Conflict groups | Left arrow | icon button | group panel, upper right, first | pagination | documented (D3) | M2 |
| X-58 | Conflict groups | Right arrow | icon button | group panel, upper right, last | pagination | documented (D3) | M2 |
| X-59.1 | Conflict groups | Email | column header | table, first column | match value | documented (D3) | M2 |
| X-59.2 | Conflict groups | Duplicates | column header | table, second column | duplicate count | documented (D3) | M2 |
| X-60 | Conflict groups | View | button | group row, right | open comparison | documented (D3) | M2 |

## Behaviour and flows

- The live Actions menu has Deduplicate Leads at row 10; its execution was not opened (list-actions).
- Record-specific discovery starts from record detail's More menu; modify initially supplied criteria, choose all/any matching, Search, select matches, then Next (D2).
- Comparison chooses a master and final field values, optionally selecting a whole source or showing conflicts only; Merge commits the result (D2).
- Module-wide discovery starts from Actions → Deduplicate [Module], chooses fields and confirms a job; identical records merge automatically, conflicts need review (D3).
- Conflict notification permits immediate resolution or deferral; the emailed resolution link expires after three days, and View opens the group's comparison (D3).

## Rules and limits

- Find and Merge requires the profile's Find and Merge permission, supports Leads and Contacts (plus Accounts, Deals, Vendors and custom modules), and accepts two or three selected records (D2).
- Record-specific search documents six criterion fields; the current per-module field list must come from metadata, not the illustrative values (D2).
- Deduplicate is restricted to administrators or the highest hierarchy, supports the same modules, allows up to three matching fields, and permits only one initiating user per module at a time (D3).
- Deduplicate offers configured unique fields or a module's default set; combined fields require matching values in all selected fields (D3).
- Automatic master selection uses the latest Last Activity Time and is not manually adjustable; conflict resolution separately documents a master choice (D3).
- At most three records merge together; larger conflict groups require choosing three (D3).
- Duplicates are permanently removed and merging has no undo; associated child records move to the master (D3).
- Attachments, notes and activities transfer; manual merge uses the oldest record's creation attribution (D2).
- Open activities inherit the master owner only when their owner matches the duplicate owner; Contacts' related Deals use the same owner-match condition, while other relationships retain ownership (D2).
- Manual merge can trigger Edit/Delete automation; automatic merges do not. Large related lists above 1000 use a scheduled merge with locked records and completion notification (D2).
- Read-only values have no selectable radio choice; no merged-record report/audit list is provided for Deduplicate (D3).

## Capability table

| Capability | Module | Evidence | Remaining |
| --- | --- | --- | --- |
| Record-specific discovery, criteria, selection | M2 | D2 | Current Contacts field defaults/operators |
| Master and per-field choice; conflicts-only | M2 | D2 | Validation and confirmation copy |
| Module-wide job, automatic merge, conflict review | M2 | list-actions, D3 | Current runtime screens/results |
| Irreversible removal and related-record transfer | M2 | D2 / D3 | Failures, simultaneous changes |
| Notes/attachments transfer | M6 | D2 | Feature arrives with related content |
| Activities transfer/ownership | M5 | D2 / D3 | Runtime effect |
| Contacts' related Deals ownership | M4 | D2 | Runtime effect |
| Manual automation triggers | M12 / P3 | D2 | Later automation feature families |
| Large-list scheduled completion | M2 | D2 | Queue and notification states |

## Sources

- D2 — Public help: record-specific duplicate discovery and merge.
- D3 — Public help: module-wide automatic deduplication and conflict resolution.
- Capture: list-actions (existing Leads fallback).
- Document addresses, page/image copies and original sentence evidence stay in local research notes `docs-notes/m2-search-duplicates`.

## Shell controls missing from app-shell.md

Reuse the missing-shell list in global-search.md. Documentary My Requ… (SH-49) has an unresolved function/module and is not asserted as available in this session. SH-47/SH-48 are already described generically in the older shell specification.

## Unobserved control states

| # | Region | Control | Type | Position | What it does | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| X-61 | Record rows | Hover-only action controls | icon button | row end | not observed | not observed | ? |

## Open questions

1. Not observed without a write: merge/job confirmation, validation, no-match and failure states; final result copy; cancellation once queued; partial failure, concurrent edits and permission loss; exact notification contents; timeline/audit events; locking and scheduling behaviour.
2. Not observed: Contacts' current criteria fields/operators, defaults, empty values, case/diacritic matching, duplicate-set ordering and pagination. Leads illustrations do not establish identical Contacts field lists. Both modules support the same tools (D2/D3), but Contacts has the related-Deals ownership exception (D2).
3. D3 says automatic master cannot be changed but manual conflict comparison allows a choice. Confirm the runtime distinction; do not apply the automatic constraint to every manual comparison.
4. D2's matching-list image says creation/read-only/hidden values are retained from the master, whereas its prose specifies oldest-record creation attribution. This documentary discrepancy needs a decision before implementing creation metadata preservation.
5. Hover-only row actions were not observed; no duplicate screen was opened live, and no additional toolbar/menu labels are inferred.
6. Unknown ownership: hover-only actions (X-61), spreadsheet view, shared utilities from global-search.md and documentary My Requ… (SH-49). Deduplicate's later email notification delivery belongs to M10; the job remains M2.
7. D3 contains selected-field-only wording alongside conflict checks for other values; preserve the explicit conflict resolution rule, but exact blank-value and conflict evaluation needs clarification before automatic merge.
