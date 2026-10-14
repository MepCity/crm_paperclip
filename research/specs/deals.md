# Deals — list screen and module inventory

Status: research submitted for Grok QA inventory review and UI Lead metadata approval. MEP-22 / Module 4.

## Purpose

Define Deals-specific list differences and exported configuration; reuse [accounts.md](accounts.md), then [contacts.md](contacts.md) and [list-views.md](list-views.md). Detail, forms, related cards and pipeline transitions belong to subsequent tasks.

## Layout

The user’s default presentation is a populated stage board (Kanban), not a table. It was retained without mode changes. Shared shell, view strip, toolbar and already-open filter panel match Accounts. The board has a STAGEVIEW selector and pencil icon, horizontally arranged stage headers and cards. Three stages and four cards are visible; further stages are offscreen. The utility strip remains at the bottom. Table presentation and pagination are not observed.

## Control inventory

Stable numbers identify repeated controls without record text. `same` retains the cited spec’s observation limits; no menu row, stage, card or persisted preference was operated. Stage badges describe presence only.

### Control inventory — m4-list-base

Shell: SH-01–SH-46 as in contacts.md. Deals is the active rail link SH-16; Accounts and Contacts are inactive. No shell rows are repeated.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DL-01 | View strip | All Deals | tab | left, first | same | seen (m4-list-base) | M4 | AL-01 |
| DL-02 | View strip | Three dots icon | icon button | after current view tab | same | seen (m4-list-base) | M4 | AL-02 moved |
| DL-03 | Toolbar | Filter | button | left group, first | same | seen (m4-list-base) | M4 | AL-03 |
| DL-04 | Toolbar | Sort | button | left group, second | same | seen (m4-list-base) | M4 | AL-04 |
| DL-05 | Toolbar | List view icon | icon button | view group, first | same | seen (m4-list-base) | M4 | AL-05 |
| DL-06 | Toolbar | Kanban view icon (active) | icon button | view group, second | same | seen (m4-list-base) | M4 | AL-06 |
| DL-07 | Toolbar | Sheet view icon | icon button | view group, third | same | seen (m4-list-base) | M4 | AL-07 |
| DL-08 | Toolbar | Chart view icon | icon button | view group, fourth | same | seen (m4-list-base) | M4 | AL-08 |
| DL-09 | Toolbar | Timeline view icon | icon button | view group, fifth | same | seen (m4-list-base) | M4 | AL-09 |
| DL-10 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | same | seen (m4-list-base) | M4 | AL-10 |
| DL-11 | Toolbar | Down chevron | icon button | view group, seventh | same | seen (m4-list-base) | M4 | AL-11 |
| DL-12 | Toolbar | Create Deal | button | right group, first | same | seen (m4-list-base) | M4 | AL-12 |
| DL-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Deal | same | seen (m4-list-base) | M6 | AL-13 |
| DL-14 | Toolbar | Three dots / Actions | icon button | right group, far right | same | seen (m4-list-base) | M4 | AL-14 |
| DL-15 | Filter panel | Search | input | below Filter Deals by heading | same | seen (m4-list-base) | M4 | AL-15 |
| DL-16 | Filter panel | System Defined Filters | toggle | first section heading | same | seen (m4-list-base) | M4 | AL-16 |
| DL-20 | Filter panel | Locked | checkbox | system-defined section, Locked | same | seen (m4-list-base) | M4 | AL-20 moved |
| DL-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | same | seen (m4-list-base) | M4 | AL-21 moved |
| DL-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | same | seen (m4-list-base) | M4 | AL-22 moved |
| DL-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | same | seen (m4-list-base) | M4 | AL-23 moved |
| DL-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | same | seen (m4-list-base) | M4 | AL-24 moved |
| DL-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | same | seen (m4-list-base) | P3 | AL-25 moved |
| DL-26 | Filter panel | Filter By Fields | toggle | second section heading | same | seen (m4-list-base) | M4 | AL-26 |
| DL-27 | Filter panel | Account Name | checkbox | field section, first row | same | seen (m4-list-base) | M3 | AL-27 |
| DL-17 | Filter panel | Activities | checkbox | system section, first row | same | seen (m4-list-base) | M5 | L-17 |
| DL-19 | Filter panel | Latest Email Status | checkbox | system section, second row | same | seen (m4-list-base) | M10 | L-19 moved |
| DL-65 | Filter panel | Amount | checkbox | field section, second row | not observed | seen (m4-list-base) | M4 | new |
| DL-66 | Filter panel | Campaign Source | checkbox | field section, third row | not observed | seen (m4-list-base) | M7 | new |
| DL-67 | Filter panel | Closing Date | checkbox | field section, fourth row | not observed | seen (m4-list-base) | M4 | new |
| DL-68 | Filter panel | Connected To | checkbox | field section, fifth row | same | seen (m4-list-base) | M4 | L-30 moved |
| DL-69 | Filter panel | Contact Name checkbox (label clipped) | checkbox | field section, sixth row, clipped at bottom | same | seen (m4-list-base) | M2 | L-31 moved |
| DL-70 | Board toolbar | STAGEVIEW | select | below main toolbar, left | not observed | seen (m4-list-base) | M4 | new |
| DL-71 | Board toolbar | Pencil icon | icon button | after STAGEVIEW | not observed | seen (m4-list-base) | M4 | new |
| DL-72 | Board | Qualification | badge | first visible stage header | not observed | seen (m4-list-base) | M4 | new |
| DL-73 | Board | Needs Analysis | badge | second visible stage header | not observed | seen (m4-list-base) | M4 | new |
| DL-74 | Board | Value Proposition | badge | third visible stage header, right edge | not observed | seen (m4-list-base) | M4 | new |
| DL-75 | Board | Stage record count | badge | beside each visible stage label | not observed | seen (m4-list-base) | M4 | new |
| DL-76 | Board | Stage probability | badge | after count and separator in each header | not observed | seen (m4-list-base) | M4 | new |
| DL-77 | Board | Stage amount total | badge | second line of each visible stage header | not observed | seen (m4-list-base) | M4 | new |
| DL-78 | Board card | Deal record link | link | card first line | same | seen (m4-list-base) | M4 | AL-42 moved |
| DL-79 | Board card | Account record link | link | card third line | same | seen (m4-list-base) | M3 | AL-42 moved |
| DL-80 | Board card | Contact record link | link | card fifth line | same | seen (m4-list-base) | M2 | L-42 moved |
| DL-81 | Board card | Task with checkmark icon | link | card bottom right where present | not observed | seen (m4-list-base) | M5 | new |

Absent here: AL-33–AL-36, AL-39–AL-40, AL-42, AL-45–AL-46, AL-48–AL-63 in their Accounts table/filter positions; AL-52 second view tab; AL-64 refresh is not painted in base. AL-42 is reused in card positions above. L-18 Campaigns system filter is absent.

The three stage headings show count 0 and zero currency summaries despite four visible cards; these header counters are not a reliable total-record count. No overall count is painted. Money uses the TL prefix, period grouping and comma decimal separator with two decimals; dates use day.month.year. Card stage, owner, amount and date text are record data, not extra controls. Task-link icons appear on two cards. No drag or stage selection was performed.

### Control inventory — m4-list-view-selector

No opened controls. Initial profile-in-use failure; permitted retry captured loading with matched 0; the 25-second loading-race retry failed with profile in use. The saved image remains the loading state. Menu contents remain `not observed`; no alternate selector was tried.

Rest: as in m4-list-base is not visually established because the loading screen covers the shell and module; covered by the overlay: SH-01–SH-46 and all base DL controls. No painted interactive control is visible.

### Control inventory — m4-list-create-menu

No opened controls. Both 12-second and 25-second attempts captured loading, and the first selector matched zero elements. Menu contents remain `not observed`; no alternate selector was tried.

Rest: as in m4-list-base is not visually established because the loading screen covers the shell and module; covered by the overlay: SH-01–SH-46 and all base DL controls. No painted interactive control is visible.

### Control inventory — m4-list-actions

No opened controls. Both attempts skipped the first selector (matched 0); the 25-second image has a painted rail/top shell but no module content. Actions rows remain `not observed`. Shell: SH-01–SH-33 as in contacts.md; SH-16 is not painted active while loading. The application-menu grid SH-34 has an unpainted footprint; utility strip SH-35–SH-46 is absent in this saved image.

Rest: as in m4-list-base is not visually established; covered by the loading state: all DL controls. No menu overlay opened.

### Control inventory — m4-list-after

No painted interactive controls. The 25-second no-click image remains a loading skeleton. Record count and visible-card comparison with base are `not observed`; this is not evidence of changed records.

Rest: as in m4-list-base is not visually established; covered by the loading state: SH-01–SH-46 and all base DL controls.

### Shell controls missing from app-shell.md

No Deals-only shell control found. Reuse contacts.md’s missing-shell list. SH-46 (trash bin) is image-only. Resize hotspots have no painted grip.

### Reconciliation of controls.json

Every source item maps to an inventory number or explicit exclusion below. Repeated wrappers may map to one ID. Image-only additions: SH-46, DL-75 and DL-76; these are additional to source-ID counts.
#### m4-list-base

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| DL-01 | 112 |
| DL-02 | 113–116 |
| DL-03 | 117 |
| DL-04 | 118 |
| DL-05 | 120 |
| DL-06 | 121 |
| DL-07 | 122 |
| DL-08 | 123 |
| DL-09 | 124 |
| DL-10 | 125 |
| DL-11 | 126–127 |
| DL-12 | 130 |
| DL-13 | 131–132 |
| DL-14 | 133 |
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
| DL-70 | 134–136 |
| DL-71 | 137 |
| DL-72 | 242 |
| DL-73 | 253 |
| DL-74 | 272 |
| DL-77 | 243, 254, 273 |
| DL-78 | 245–246, 256–257, 265–266, 275–276 |
| DL-79 | 247–248, 258–259, 267–268, 277–278 |
| DL-80 | 249–250, 260–261, 269–270, 279–280 |
| DL-81 | 252, 263 |
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
| SH-35 | 306 |
| SH-36 | 307 |
| SH-37 | 308 |
| SH-38 | 309 |
| SH-39 | 310 |
| SH-40 | 311 |
| SH-41 | 312 |
| SH-42 | 313 |
| SH-43 | 314 |
| SH-44 | 315 |
| SH-45 | 316 |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 83, 87, 111, 119, 139, 144, 162, 240, 305 |
| excluded: invisible below panel boundary or beyond horizontal viewport | 65–80, 175–236, 282–288 |
| excluded: invisible refresh footprint; no painted icon | 128–129 |
| excluded: invisible resize hotspot; no painted grip | 82, 239 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 138, 142, 237–238, 241, 289–304 |
| excluded: record card wrapper or record amount data | 244, 251, 255, 262, 264, 271, 274, 281 |

316 source items; 86 inventory IDs represented; 158 excluded items.

#### m4-list-view-selector

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: invisible zero-area element | 2–3 |
| excluded: structural loading placeholder; no painted control | 1 |

3 source items; 0 inventory IDs represented; 3 excluded items.

#### m4-list-create-menu

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: invisible zero-area element | 2–3 |
| excluded: structural loading placeholder; no painted control | 1 |

3 source items; 0 inventory IDs represented; 3 excluded items.

#### m4-list-actions

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
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
| SH-26 | 83 |
| SH-27 | 84 |
| SH-28 | 86 |
| SH-29 | 87 |
| SH-30 | 88 |
| SH-31 | 91 |
| SH-32 | 94 |
| SH-33 | 97–98 |
| excluded: application-menu grid footprint is unpainted; no visible control | 101 |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 85 |
| excluded: invisible below panel boundary or beyond horizontal viewport | 65–80 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81–82, 89–90, 92–93, 95–96, 99–100, 102, 104–112 |
| excluded: loading progress indicator; no interactive control | 103 |

112 source items; 33 inventory IDs represented; 56 excluded items.

#### m4-list-after

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: invisible zero-area element | 2–3 |
| excluded: structural loading placeholder; no painted control | 1 |

3 source items; 0 inventory IDs represented; 3 excluded items.

## Fields and layout

Source: exported Deals fields and layouts; configuration only, no form observed. Profile and layout IDs are omitted.

Layout: Standard; visible=yes. Default for Administrator, Standard.
| Order | Section | Columns | Fields |
| --- | --- | --- | --- |
| 1 | Deal Image | 1 | 0 |
| 2 | Deal Information | 2 | 25 |
| 3 | Description Information | 1 | 1 |

| Label | API name | Type | Length | System / layout required | Unique | Read-only / field-read-only | VCEQ | Section | Sequence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Deal Owner | Owner | ownerlookup | 120 | no/no | none | false / true | VCE- | Deal Information | 1 |
| Amount | Amount | currency | 16, 2 decimals | no/no | none | false / false | VCEQ | Deal Information | 2 |
| Deal Name | Deal_Name | text | 120 | yes/yes | none | false / false | VCEQ | Deal Information | 3 |
| Closing Date | Closing_Date | date | 20 | no/yes | none | false / false | VCEQ | Deal Information | 4 |
| Account Name | Account_Name | lookup | 120 | no/yes | none | false / false | VCEQ | Deal Information | 5 |
| Stage | Stage | picklist | 120 | yes/yes | none | false / false | VCEQ | Deal Information | 6 |
| Type | Type | picklist | 120 | no/no | none | false / false | VCE- | Deal Information | 7 |
| Probability (%) | Probability | integer | 3 | no/no | none | false / false | VCE- | Deal Information | 10 |
| Next Step | Next_Step | text | 100 | no/no | none | false / false | VCE- | Deal Information | 9 |
| Lead Source | Lead_Source | picklist | 120 | no/no | none | false / false | VCE- | Deal Information | 11 |
| Campaign Source | Campaign_Source | lookup | 120 | no/no | none | false / false | VCE- | Deal Information | 14 |
| Created By | Created_By | ownerlookup | 120 | no/no | none | false / false | V--- | Deal Information | 16 |
| Modified By | Modified_By | ownerlookup | 120 | no/no | none | false / false | V--- | Deal Information | 15 |
| Created Time | Created_Time | datetime | 120 | no/no | none | false / false | V--- | Deal Information | 18 |
| Modified Time | Modified_Time | datetime | 120 | no/no | none | false / false | V--- | Deal Information | 17 |
| Description | Description | textarea | 32000 | no/no | none | false / false | VCE- | Description Information | 1 |
| Contact Name | Contact_Name | lookup | 120 | no/no | none | false / false | VCE- | Deal Information | 13 |
| Expected Revenue | Expected_Revenue | currency | 16, 2 decimals | no/no | none | true / true | VCEQ | Deal Information | 12 |
| Last Activity Time | Last_Activity_Time | datetime | 120 | no/no | none | false / true | V--- | Deal Information | 21 |
| Lead Conversion Time | Lead_Conversion_Time | integer | 9 | no/no | none | false / true | V--- | Deal Information | 24 |
| Sales Cycle Duration | Sales_Cycle_Duration | integer | 9 | no/no | none | false / true | V--- | Deal Information | 23 |
| Overall Sales Duration | Overall_Sales_Duration | integer | 9 | no/no | none | false / true | V--- | Deal Information | 26 |
| Tag | Tag | text | 2000 | no/no | none | false / false | V--- | Deal Information | 18 |
| Record Id | id | bigint | 18 | no/no | none | true / true | V--- | Deal Information | 32 |
| Change Log Time | Change_Log_Time__s | datetime | 120 | no/no | none | true / true | ---- | outside layout | — |
| Locked | Locked__s | boolean | 5 | no/no | none | true / true | ---- | outside layout | — |
| Reason For Loss | Reason_For_Loss__s | picklist | 120 | no/no | none | false / false | VCE- | Deal Information | 8 |
| Stage Modified Time | Stage_Modified_Time | datetime | 120 | no/no | none | false / true | ---- | outside layout | — |
| Connected To | Connected_To__s | multi_module_lookup | 120 | no/no | none | false / false | VC-- | Deal Information | 37 |

### Money, date and derived fields

| Field | Type | Read-only / field-read-only | Custom / virtual | Formula | Layout |
| --- | --- | --- | --- | --- | --- |
| Amount | currency | false / false | no/no | none exported | Deal Information |
| Closing Date | date | false / false | no/no | none exported | Deal Information |
| Probability (%) | integer | false / false | no/no | none exported | Deal Information |
| Next Step | text | false / false | no/no | none exported | Deal Information |
| Expected Revenue | currency | true / true | no/no | none exported | Deal Information |
| Lead Conversion Time | integer | false / true | no/no | none exported | Deal Information |
| Sales Cycle Duration | integer | false / true | no/no | none exported | Deal Information |
| Overall Sales Duration | integer | false / true | no/no | none exported | Deal Information |
| Locked | boolean | true / true | no/no | none exported | outside layout |
| Reason For Loss | picklist | false / false | no/no | none exported | Deal Information |
| Stage Modified Time | datetime | false / true | no/no | none exported | outside layout |
| Connected To | multi_module_lookup | false / false | no/no | none exported | Deal Information |

All these fields have created_source=default. Empty formula objects do not establish a calculation rule. Expected Revenue is read-only currency; its calculation is not exported. Duration units and write-triggered recalculation remain not observed. Amount and Expected Revenue export normal rounding, precision 2, length 16 and 2 decimals; display_format is null. Probability exports integer length 3; no range is exported.

### Types absent from Leads, Contacts and Accounts

Script comparison of exported data_type unions: none.

## Stages

Generated from Stage.pick_list_values in exported order; Order preserves sequence_number (starts at 2).

| Order | Stage | Probability | Forecast category | Deal category |
| --- | --- | --- | --- | --- |
| 2 | Qualification | 10 | Pipeline | Open |
| 3 | Needs Analysis | 20 | Pipeline | Open |
| 4 | Value Proposition | 40 | Pipeline | Open |
| 5 | Identify Decision Makers | 60 | Pipeline | Open |
| 6 | Proposal/Price Quote | 75 | Pipeline | Open |
| 7 | Negotiation/Review | 90 | Pipeline | Open |
| 8 | Closed Won | 100 | Closed | Closed Won |
| 9 | Closed Lost | 0 | Omitted | Closed Lost |
| 10 | Closed Lost to Competition | 0 | Omitted | Closed Lost |

No layout-bound pipeline definition is present in the exported layout. Pipeline research must establish it separately. Identify Decision Makers has actual_value `Id. Decision Makers`; all other stage display/actual pairs agree.

## Picklists

Exported ordered options; no option was selected. Stage options are fully listed above.

| Field | Options |
| --- | --- |
| Type | -None-; Existing Business; New Business |
| Reason For Loss | -None-; Expectation Mismatch; Price; Unqualified Customer; Lack of response; Missed Follow Ups; Wrong Target; Competition; Future Interest; Other |

Script comparison: all 15 Deals Lead Source display/actual pairs match the corresponding Leads entries in leads-fields-and-layout.md. Leads alone additionally contains Facebook and X (Twitter) (actual value: Twitter); Deals has no additional option. The remaining relative order is identical.

## Lookups and relations

| Field | Type | Target | System / layout required | Reverse relation |
| --- | --- | --- | --- | --- |
| Deal Owner | ownerlookup | Users; no target exported | no/no | — |
| Account Name | lookup | Accounts | no/yes | Deals |
| Campaign Source | lookup | Campaigns | no/no | Deals |
| Created By | ownerlookup | Users; no target exported | no/no | — |
| Modified By | ownerlookup | Users; no target exported | no/no | — |
| Contact Name | lookup | Contacts | no/no | Deals |
| Connected To | multi_module_lookup | Leads | no/no | Deals |

Account Name, Contact Name and Campaign Source have revalidate_filter_during_edit=false and no system query. Connected To exports Leads only, with dynamic module addition allowed; further targets are not inferred.

### Incoming Deals links

Script scanned every exported metadata/modules/*/fields.json; null exports skipped.

| Source module | Field | API name | Type | Reverse relation |
| --- | --- | --- | --- | --- |
| Attachments | Parent ID | Parent_Id | lookup | Attachments |
| Cadences_Followups__s | Entity | Entity__s | multi_module_lookup | Cadences_Followups__s |
| Cases | Deal Name | Deal_Name | lookup | Cases |
| DealHistory | Deal Name | Potential_Name | lookup | Stage_History |
| Email_Sentiment | Seid | Seid | multi_module_lookup | Email_Sentiment |
| Entity_Cadences__s | Entity | Seid__s | multi_module_lookup | Entity_Cadences__s |
| Invoices | Deal Name | Deal_Name__s | lookup | Invoices |
| Leads | Converted Deal | Converted_Deal | lookup | — |
| Locking_Information__s | Locked For | Locked_For__s | multi_module_lookup | Locking_Information__s |
| Quotes | Deal Name | Deal_Name | lookup | Quotes |
| Custom automation module A (2 fields) | Deals result lookups | omitted custom identifiers | lookup | — |
| Custom automation module B (22 fields) | Deals result lookups | omitted custom identifiers | lookup | — |
| Sales_Orders | Deal Name | Deal_Name | lookup | SalesOrders |
| Team_Selling__s | Related To | Related_To | multi_module_lookup | Team_Selling__s |

## Stage History module

Stage.history_tracking targets DealHistory, with Stage_Duration_Calendar_Days as duration field. DealHistory Deal Name (Potential_Name) is a lookup to Deals. Metadata only; history rows are not observed here.

| Label | API name | Type | Length | Read-only / field-read-only | Required |
| --- | --- | --- | --- | --- | --- |
| Deal Name | Potential_Name | lookup | 120 | false / false | no |
| Stage | Stage | picklist | 120 | false / false | no |
| Stage Duration (Calendar Days) | Stage_Duration_Calendar_Days | integer | 50 | false / false | no |
| Modified By | Modified_By | ownerlookup | 120 | false / false | no |
| Modified Time | Modified_Time | datetime | 120 | false / false | no |
| Amount | Amount | currency | 16 | false / false | no |
| Probability (%) | Probability | integer | 3 | false / false | no |
| Expected Revenue | Expected_Revenue | currency | 16 | true / false | no |
| Closing Date | Closing_Date | date | 20 | false / false | no |
| Record Id | id | bigint | 18 | true / true | no |
| Last Activity Time | Last_Activity_Time | datetime | 120 | true / true | no |
| Moved To | Moved_To__s | picklist | 120 | true / false | no |

## Views

Metadata only; no view selected. Null sorting does not establish default order.

| View | Default | Criteria | Columns | Sort by / order |
| --- | --- | --- | --- | --- |
| All Deals | yes | null | Deal_Name, Amount, Stage, Closing_Date, Account_Name, Contact_Name, Owner | null / null |
| All Locked Deals | no | Locked__s equal true | Deal_Name, Amount, Stage, Closing_Date, Account_Name, Contact_Name, Owner | null / null |
| Closing Next Month | no | Closing_Date equal ${NEXTMONTH} | Deal_Name, Amount, Stage, Closing_Date, Account_Name, Contact_Name, Owner | null / null |
| Closing This Month | no | Closing_Date equal ${THISMONTH} | Deal_Name, Amount, Stage, Closing_Date, Account_Name, Contact_Name, Owner | null / null |
| My Deals | no | Owner equal {"name": "${CURRENTUSER}"} | Deal_Name, Amount, Stage, Closing_Date, Account_Name, Contact_Name | null / null |
| My Deals Closing This Month | no | (Closing_Date equal ${THISMONTH} AND Owner equal {"name": "${CURRENTUSER}"}) | Deal_Name, Amount, Stage, Closing_Date, Account_Name, Contact_Name, Owner | null / null |
| New Last Week | no | Created_Time equal ${LASTWEEK} | Deal_Name, Amount, Stage, Closing_Date, Account_Name, Contact_Name, Owner | null / null |
| New This Week | no | Created_Time equal ${THISWEEK} | Deal_Name, Amount, Stage, Closing_Date, Account_Name, Contact_Name, Owner | null / null |
| Recently Created Deals | no | (Common_Status contains c AND Created_Time less_equal ${AGEINDAYS}+31) | Deal_Name, Amount, Stage, Closing_Date, Account_Name, Contact_Name, Owner | null / null |
| Recently Modified Deals | no | (Common_Status contains m AND Modified_Time less_equal ${AGEINDAYS}+31) | Deal_Name, Amount, Stage, Closing_Date, Account_Name, Contact_Name, Owner | null / null |
| Unread Deals | no | Common_Status not_contains v | Deal_Name, Amount, Stage, Closing_Date, Account_Name, Contact_Name, Owner | null / null |

All exported views are system-defined and public; wrap_text=true, locked=false, favorite=null. Common_Status is a criterion reference, not an exported field definition.

## Related lists

Exported configuration, sorted numerically by sequence.

| Order | Label | API name | Target module | Module key | Visible | Type | Enabled operations |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Connected Records | Connected_Records__s | — | ? | yes | combined_view | none |
| 1 | Review Process-Review Summary | Review_Processes | Review_Processes | P3 | no | default | none |
| 2 | Notes | Notes | Notes | M6 | yes | default | none |
| 2 | Review Process-Field History | Review_Logs | Review_Logs | P3 | no | default | none |
| 3 | Attachments | Attachments | Attachments | M6 | yes | default | none |
| 4 | Stage History | Stage_History | DealHistory | M4 | yes | default | none |
| 5 | Competitors | Competitors | Competitors | ? | yes | default | edit, create, delete |
| 6 | Cadences | Entity_Cadences_Potentials | Entity_Cadences__s | P3 | yes | default | none |
| 8 | Open Tasks | Tasks | Tasks | M5 | yes | default | edit, create |
| 9 | Open Meetings | Events | Events | M5 | yes | default | edit, create |
| 10 | Open Calls | Calls | Calls | M5 | yes | default | edit, create |
| 12 | Closed Tasks | Tasks_History | Tasks | M5 | yes | default | edit, create |
| 13 | Closed Meetings | Events_History | Events | M5 | yes | default | edit, create |
| 14 | Email Sentiment | Email_Sentiment | Email_Sentiment | P3 | no | default | none |
| 14 | Closed Calls | Calls_History | Calls | M5 | yes | default | edit, create |
| 17 | Products | Products | Products | P2 | yes | default | disassociate |
| 18 | Quotes | Quotes | Quotes | P2 | yes | default | edit, create, bulk_edit, delete, assign, disassociate |
| 19 | Sales Orders | SalesOrders | Sales_Orders | P2 | yes | default | edit, create, bulk_edit, delete, assign, disassociate |
| 20 | Contact Roles | Contact_Roles | Contacts | M2 | yes | default | disassociate |
| 21 | Emails | Emails | Emails | M10 | yes | default | create, delete |
| 22 | Cases | Cases | Cases | M8 | yes | default | edit, create, bulk_edit, delete, assign, disassociate |
| 23 | Checklists | CheckLists | CheckLists | ? | yes | default | none |
| 24 | Invoices | Invoices | Invoices | P2 | yes | default | edit, create, bulk_edit, delete, assign, disassociate |
| 25 | Locking Information | Locking_Information__s | Locking_Information__s | M11 | yes | default | none |
| 50 | Email Drafts | Email_Drafts__s | Email_Drafts__s | M10 | no | default | none |

## Field permissions by profile

profiles.json exports Administrator and Standard. Table uses each field’s exported profiles, joined by profile name; IDs are omitted. Permissions do not override field read-only and layout flags.

| Field | Administrator | Standard |
| --- | --- | --- |
| Deal Owner | read_write | read_write |
| Amount | read_write | read_write |
| Deal Name | read_write | read_write |
| Closing Date | read_write | read_write |
| Account Name | read_write | read_write |
| Stage | read_write | read_write |
| Type | read_write | read_write |
| Probability (%) | read_write | read_write |
| Next Step | read_write | read_write |
| Lead Source | read_write | read_write |
| Campaign Source | read_write | read_write |
| Created By | read_write | read_write |
| Modified By | read_write | read_write |
| Created Time | read_write | read_write |
| Modified Time | read_write | read_write |
| Description | read_write | read_write |
| Contact Name | read_write | read_write |
| Expected Revenue | read_only | read_only |
| Last Activity Time | read_write | read_write |
| Lead Conversion Time | read_write | read_write |
| Sales Cycle Duration | read_write | read_write |
| Overall Sales Duration | read_write | read_write |
| Tag | read_write | read_write |
| Record Id | read_only | read_only |
| Change Log Time | read_only | read_only |
| Locked | read_only | read_only |
| Reason For Loss | read_write | read_write |
| Stage Modified Time | hidden | hidden |
| Connected To | read_write | read_write |

## Differences from Accounts list

- Deals opens in stage-board mode; Accounts opens as a table. Table columns are metadata only here: Deal Name, Amount, Stage, Closing Date, Account Name, Contact Name, Deal Owner. My Deals omits Owner. Empty state, table sums, selection bar and pagination remain not observed.
- One All Deals tab precedes the selector; Accounts also paints All Locked Accounts as a second tab.
- Activities and Latest Email Status are added to the system filters. Accounts’ remaining system filters are reused, shifted down.
- Visible field filters: Account Name, Amount, Campaign Source, Closing Date, Connected To; Contact Name’s checkbox is partly clipped at the bottom. No filter was toggled.
- Board cards display Deal link, stage, Account link, owner text, Contact link, amount and closing date; task links appear where present. No note icon or card-selection checkbox is painted.

### Clipped filter labels (DOM evidence only)

Below the panel boundary: Contact Name label, Created By, Created Time, Deal Name, Deal Owner, Expected Revenue, Last Activity Time, Lead Conversion Time, Lead Source, Modified By, Modified Time, Next Step, Overall Sales Duration, Probability (%), Reason For Loss, Sales Cycle Duration, Stage, Tag, Type. The related-module group below them lists Calls, Cases, Deal Contact Role (Contact Roles), Deal Product Relation (Products), Emails, Invoices, Leads (Converted Leads), Meetings, Notes, Quotes, Sales Orders, Tasks. These are clipped DOM evidence, not visible controls; no panel was expanded or scrolled.

## Shared components reused

Form and record-detail entries are reuse references; the Deals form and detail have not been observed in this task.

| Component | Definition / inventory / implementation task | Deals difference |
| --- | --- | --- |
| List screen | accounts.md Control inventory AL-01–AL-27; contacts.md L-01–L-51; MEP-319 | Shared toolbar and filters; board rather than table; Deals views and field set |
| Related-list rail and cards | accounts-record-detail.md; contacts-record-detail.md D-10–D-31, D-52–D-95; MEP-325 | Stage History, Competitors, Contact Roles; separate Deals detail/card tasks |
| Lookup field | accounts-form.md Parent Account AF-11, AF-11.1–AF-11.18; MEP-318 | Required Account Name; optional Contact Name and Campaign Source; no popup opened here |
| Date field | contacts-form.md F-25; MEP-317; lead-conversion.md Deal subform Closing Date | Closing Date is layout-required; cards display day.month.year |
| Money field | accounts-form.md Annual Revenue AF-15 and its information icon; accounts.md Fields and layout | Amount plus read-only Expected Revenue; same exported precision/rounding |
| Owner selector | accounts-form.md AF-06; contacts-form.md F-06 | Deal Owner; owner popup not observed |
| Bulk-action windows | list-views.md; accounts.md AL-14.1–AL-14.3 | Openers seen; menus and windows not observed |
| Global search | global-search.md S-10.5, S-23.Deals, S-31.5 and documented Deals result controls (D1) | Deals module entry and documented result/filter controls; no query run |
| Duplicates | duplicates.md documented support and limits | Use only its declared module coverage; no Deals duplicate flow observed here |
| Lead conversion | lead-conversion.md Fields and Deal subform | Existing Amount, Deal Name, Closing Date, Stage, Campaign Source and Contact Role definitions; no conversion performed |

## Capability table

| Capability | Inventory numbers | Module key | Reuse / Deals-specific |
| --- | --- | --- | --- |
| View selector | DL-01–DL-02 (menu not observed) | M4 | Accounts / Contacts reused; Deals view labels |
| Filter / sort | DL-03–DL-04, DL-15–DL-27, DL-65–DL-69 | M4 / M3 / M2 / M5 / M7 / M10 / P3 | Accounts / Contacts reused; Deals field filters |
| View modes | DL-05–DL-11 | M4 | Accounts reused; active Kanban retained |
| Create / create menu | DL-12–DL-13 | M4 / M6 | Accounts reused; opener only |
| Actions | DL-14 (menu not observed) | M4 / M6 / M11 / ? | Accounts reused where evidenced; menu rows only |
| Board selector / setup | DL-70–DL-71 | M4 | Deals-specific; not operated |
| Stage summaries | DL-72–DL-77 | M4 | Deals-specific; visible three headings, count/probability/amount |
| Deal / Account / Contact links | DL-78–DL-80 | M4 / M3 / M2 | Accounts / Contacts links reused in card positions |
| Task shortcut | DL-81 | M5 | Deals-specific card placement; not operated |
| Table / selection / pagination | not observed | M4 | Accounts / Contacts reuse candidate; no mode change |
| Stage History | no visible list control; exported Stage history_tracking | M4 | Deals-specific metadata; subsequent detail/cards |
| Global search | S-10.5, S-31.5 (global-search.md) | M4 | Shared declared capability only |
| Lead conversion Deal subform | lead-conversion.md Fields | M1 / M4 | Existing conversion spec reused |

## Capture refs

| Slug | Requested clicks | Skipped | Saved image / evidence limit |
| --- | --- | --- | --- |
| m4-list-base | 0 | 0 | Populated stage board; no total-record count. Initial short-wait image was loading; same no-click screen recaptured at 12 seconds. |
| m4-list-view-selector | 1 | 1 | Loading; menu not observed. Profile-in-use failure preceded saved 12-second image; subsequent 25-second attempt also failed with profile in use. |
| m4-list-create-menu | 1 | 1 | Loading; matched 0 at both 12 and 25 seconds; menu not observed. |
| m4-list-actions | 1 | 1 | Painted shell only; matched 0 at both waits; menu not observed. |
| m4-list-after | 0 | 0 | Loading at 25 seconds; count comparison not observed. |

In base: successful Deals/actions/count × 1, Deals/bulk × 1 plus six board reads (7 total; 200/204), visitor triggers × 1; no Analytics run. Automatic PUT to settings/modules/Deals × 1 and POST /crm/v2.2/Deals/actions/grouped_counts × 1 were blocked. These no-click additions form the permitted screen baseline. Reminder and notification polls are blocked. All later saved images have only GET calls plus blocked telemetry: view-selector has one urlMonitor; create has urlMonitor, exceptions and logs once each; Actions has urlMonitor twice and exceptions once; after has urlMonitor, exceptions and logs once each. No unblocked telemetry, new click-triggered non-GET path or excess baseline count was found. All three requested openers were skipped; no actual menu click completed.

Raw screenshots remain in the research workspace; no reference image or customer value is copied into the repository. Every completed capture image was opened and examined. Controls reconciliation ordinals are source-list positions, never selectors. No record-write request received a successful status. The basic screen automatically attempted a settings PUT, which the tool blocked; it is a no-click baseline, not an authorized setting action.

## Open questions

- Total-record count cannot be compared: no total is painted in this presentation. The final image did not finish loading, so even visible-card comparison is unavailable; retain this evidence limit.
- Three stage counters and monetary totals are zero despite cards being present. Cause is not observable; do not infer empty stages from the badges.
- Table presentation, empty state, hover-only card tools and controls beyond the horizontal viewport remain not observed. Mode changes and card dragging are forbidden.
- Board selector, pencil, stage summaries and task-link behaviour were not exercised. Pipeline research owns their documented behaviour and transition rules.
- Export lacks a pipeline definition and derived revenue/duration formula. System changes and write outcomes cannot be established from metadata alone.
- Connected Records, Competitors and Checklists related-list module assignment remains ?; preserve until lead classification.
- View selector, Create menu and Actions contents remain not observed after the authorized attempts. Shared menu definitions are reuse candidates, not Deals observations. Review must retain this gap; no further capture or alternative selector was attempted.

## Follow-up — board scroll and Stage evidence (MEP-539)

`m539-board-base` is a fresh painted no-click board capture. The shell, filter controls, board headers and four visible cards reuse the `m4-list-base` inventory above; record values are omitted. One visible column contains two cards, both fully within the available card area. This is not a populated-overflow example. The first visible column also paints two footer controls absent from the earlier painted inventory:

| # | Region | Control | Type | Position | Observed behaviour | Source | Module |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DL-82 | Board column footer | Create Deal | action | first visible column, footer left | Not operated; creating is forbidden | seen (`m539-board-base`) | M4 |
| DL-83 | Board column footer | Collapse Kanban stage | icon button | same footer, right | Accessible name identifies collapse; not operated because it changes a persisted preference | seen (`m539-board-base`) | M4 |

The corresponding control entries have `data-zcqa=createRecByStage` and `data-zcqa=collapseKanbanStage`; the latter has a column-scoped unique selector. No footer was clicked. Footer visibility on other columns or its hover trigger is not established.

`m539-board-scroll` targets the exported unique **column root** for Needs Analysis. Step evidence reports `not scrollable`: root overflow is `visible`, its content exceeds its client height, and scroll position stays zero. This establishes only that the column root is not the vertical scroll container. It does **not** establish whether an inner card container has its own scrollbar or what happens with many cards. No inner scrolling-container selector was exported. No view, density, column sizing, sorting or filter preference was changed to manufacture overflow.

The Stage values on this board are record text, not evidence of an advanced-search Stage chip action. No advanced-search result was reached in this no-click continuation; whether that chip opens a menu, a filter or an options list remains **not observed**. The documented advanced-search Stage badge in [global-search.md](global-search.md) does not establish its click behaviour.

| Capture | Steps | Safety audit |
| --- | --- | --- |
| `m539-board-base` | None | Eight blocked background requests: reminder, grouped counts, Deals list, notification status and four telemetry requests |
| `m539-board-scroll` | One bounded scroll probe, result `not scrollable` | Five blocked background requests: reminder, grouped counts, Deals list, notification status and telemetry |

Both final screenshots were painted and inspected with the exported controls and metadata. The scroll step image is incomplete and does not establish a painted scroll transition; only metadata establishes the bounded probe result. Blocked list/count requests limit conclusions about record completeness and header counts. These aborted background calls are not evidence of a completed record or preference mutation.

Open questions: a safe unique Amount icon selector (see [deals-form.md](deals-form.md)); an exported inner scroll-container selector and a naturally overflowing column; advanced-search Stage chip behaviour; Account Deals Assign and Contact Roles dialogs. Assign and Edit All remain gated by MEP-562 and were not attempted. No submitted, saved, assigned or edited state was studied.
