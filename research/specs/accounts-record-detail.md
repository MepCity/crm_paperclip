# Accounts — record detail

Status: researched related-card inventory; lower field display and record-page footer remain unobserved. The earlier safety-count gate was resolved by the CTO in MEP-330. More Options and Timeline are observed in the m3m continuation; the earlier m3d attempts remain loading-state evidence only. Hierarchy opening was not attempted; its documented structure and remaining observation gaps are recorded below.

## Purpose

Describe the observed upper Accounts record detail and differences from [contacts-record-detail.md](contacts-record-detail.md) and [record-detail.md](record-detail.md). Reuse [accounts.md](accounts.md) for fields and exported configuration. The lower-detail continuation, resolved safety stop and related-card controls are recorded below. Lower field display remains unobserved. No record value is reproduced.

## Layout

The shared shell surrounds a back arrow, building portrait placeholder, account identity and Website link. Add Tags sits below the identity. Send Email, Edit, More Options and previous/next arrows occupy the right header group. The Related List rail includes a separate Links group. Overview/Timeline and the Last Update indicator share the tab row.

Overview contains a five-field business card: Account Owner, Industry, Employees, Annual Revenue and Phone. Empty visible values use a dash. Phone has a call icon. The expanded details card starts with Hide Details and Account Information. The visible left column shows Account Owner, Account Name, Account Site, Parent Account and partly clipped Account Number. The right column shows Rating, Phone, Fax and Website. Phone has a call icon and Website is a link. Lower fields and sections are not observed; their presence in offscreen DOM is not screen evidence.

## Control inventory

Stable AD numbers retain corresponding D suffixes where practical. Shared controls use the cited Contacts number, with `moved` when their position differs. `same` inherits the Contacts observation limits; it does not establish activation here. Earlier loading-only attempts remain below; the m3m continuation observes the opened menu and Timeline. Static field labels/values are described above rather than treated as controls. Screenshot-only call icons are inventoried.

### Control inventory — m3d-list-base

Shell: SH-01–SH-46 as in contacts.md; Accounts is active instead of Contacts. No new shell control.

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No new controls. AL-45 (incidental row three dots) is absent in this image compared with m3-list-base. AL-42 was used to open the detail; its one-record navigation is observed in m3d-detail-main. No Parent Account column is painted, so an arbitrary visible record link was used.

Rest: as in m3-list-base in accounts.md; covered by the overlay: none. Absent here: AL-45.

### Control inventory — m3d-detail-main

Shell: SH-01–SH-46 as in contacts.md; Accounts is active instead of Contacts. No additional shell control is painted. The entire shell, utility strip and right edge were inspected.

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD-01 | Header | Back | icon button | leftmost | same | seen (m3d-detail-main) | M3 | D-01 |
| AD-02 | Header | Portrait placeholder | icon button | after Back | same | seen (m3d-detail-main) | M6 | D-02 |
| AD-04 | Header | Add Tags | button | below identity | same | seen (m3d-detail-main) | M6 | D-04 |
| AD-05 | Header | Send Email | button | right actions, first | same | seen (m3d-detail-main) | M10 | D-05 |
| AD-06 | Header | Edit | button | right actions, second | same | seen (m3d-detail-main) | M3 | D-06 |
| AD-07 | Header | More Options / three dots | icon button | right actions, third | Opens the menu seen in m3m-detail-more | seen (m3d-detail-main) | M3 | D-07 |
| AD-08 | Header | Previous Record | icon button | after More Options | same | seen (m3d-detail-main) | M3 | D-08 |
| AD-09 | Header | Next Record | icon button | far right | same | seen (m3d-detail-main) | M3 | D-09 |
| AD-99 | Header | Website link | link | identity line, after account identity | not observed | seen (m3d-detail-main) | M3 | new |
| AD-10 | Related-list rail | Notes | link | rail, row 1 | same | seen (m3d-detail-main) | M6 | D-10 |
| AD-11 | Related-list rail | Connected Records | link | rail, row 2 | same | seen (m3d-detail-main) | ? | D-11 |
| AD-12 | Related-list rail | Attachments | link | rail, row 3 | same | seen (m3d-detail-main) | M6 | D-12 |
| AD-14 | Related-list rail | Deals | link | rail, row 4 | same | seen (m3d-detail-main) | M4 | D-14 moved |
| AD-96 | Related-list rail | Contacts | link | rail, row 5 | not observed | seen (m3d-detail-main) | M2 | new |
| AD-23 | Related-list rail | Emails | link | rail, row 6 | same | seen (m3d-detail-main) | M10 | D-23 moved |
| AD-15 | Related-list rail | Open Activities | link | rail, row 7 | same | seen (m3d-detail-main) | M5 | D-15 moved |
| AD-16 | Related-list rail | Closed Activities | link | rail, row 8 | same | seen (m3d-detail-main) | M5 | D-16 moved |
| AD-18 | Related-list rail | Products | link | rail, row 9 | same | seen (m3d-detail-main) | P2 | D-18 |
| AD-20 | Related-list rail | Quotes | link | rail, row 10 | same | seen (m3d-detail-main) | P2 | D-20 moved |
| AD-21 | Related-list rail | Sales Orders | link | rail, row 11 | same | seen (m3d-detail-main) | P2 | D-21 moved |
| AD-24 | Related-list rail | Invoices | link | rail, row 12 | same | seen (m3d-detail-main) | P2 | D-24 moved |
| AD-97 | Related-list rail | Member Accounts | link | rail, row 13 | not observed | seen (m3d-detail-main) | M3 | new |
| AD-19 | Related-list rail | Cases | link | rail, row 14 | same | seen (m3d-detail-main) | M8 | D-19 moved |
| AD-26 | Related-list rail | Social | link | rail, row 15 | same | seen (m3d-detail-main) | M15 | D-26 moved |
| AD-29 | Related-list rail | Add Related List | link | below last related-list link | same | seen (m3d-detail-main) | M11 | D-29 |
| AD-98 | Related-list rail | Add Link | link | Links group, below Add Related List | not observed | seen (m3d-detail-main) | M11 | new |
| AD-101 | Related-list rail | Notes count | badge | after Notes | not observed | seen (m3d-detail-main) | M6 | new |
| AD-102 | Related-list rail | Contacts count | badge | after Contacts | not observed | seen (m3d-detail-main) | M2 | new |
| AD-30 | Related-list rail | Open Activities count | badge | after Open Activities | same | seen (m3d-detail-main) | M5 | D-30 |
| AD-31 | Related-list rail | Closed Activities count | badge | after Closed Activities | same | seen (m3d-detail-main) | M5 | D-31 |
| AD-32 | Tab row | Related-list rail visibility icon | icon button | before Overview | same | seen (m3d-detail-main) | M3 | D-32 |
| AD-33 | Tab row | Overview | tab | first tab, selected | same | seen (m3d-detail-main) | M3 | D-33 |
| AD-34 | Tab row | Timeline | tab | second tab | Opens Timeline seen in m3m-detail-timeline | seen (m3d-detail-main) | M3 | D-34 |
| AD-35 | Tab row | Last Update indicator | badge | far right | same | seen (m3d-detail-main) | M3 | D-35 |
| AD-37 | Business card | Phone call icon | icon button | after Phone value, fifth field | same | seen (m3d-detail-main) | M5 | D-37 moved |
| AD-38 | Details card | Hide Details | button | card header, left | same | seen (m3d-detail-main) | M3 | D-38 |
| AD-41 | Details card | Phone call icon | icon button | Account Information, right column, after Phone value | same | seen (m3d-detail-main) | M5 | D-41 moved |
| AD-100 | Details card | Website link | link | Account Information, right column, fourth field value | not observed | seen (m3d-detail-main) | M3 | new |

Absent here: D-03, D-13, D-17, D-22, D-25, D-27, D-28, D-36, D-39, D-40. D-52 (Organize Contact Details rail control) and D-53 (Notes-row plus) are not painted. This does not establish that hover-only controls are unavailable. Accounts has no email-value link in this business card.

### Control inventory — m3d-detail-more

Shell: SH-01–SH-33 as in contacts.md, except SH-15 (Accounts) is not painted as active. SH-34–SH-46 are not painted during loading. No additional shell control.

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No opened controls: both requested clicks were skipped with zero matching elements. The main content area is blank; no record header or menu is painted. The loading progress line is static, not a control.

Rest: as in m3d-detail-main **for shared-shell controls only**; covered by the overlay: none. The record content did not load, so all AD controls from the detail baseline are absent in this image; this is not a claim that they are unavailable in Accounts.

### Control inventory — m3d-detail-timeline

Shell: SH-01–SH-32 as in contacts.md, except SH-15 (Accounts) is not painted as active. SH-33–SH-46 are not painted during loading. No additional shell control.

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No opened controls: both requested clicks were skipped with zero matching elements. The main content area shows a loading illustration and Loading text; no record header or Timeline controls are painted. The loading illustration/text is static, not a control.

Rest: as in m3d-detail-main **for shared-shell controls only**; covered by the overlay: none. The record content did not load, so all AD controls from the detail baseline are absent in this image; this is not a claim that they are unavailable in Accounts.

### Control inventory — m3d-list-after

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No changed controls relative to m3d-list-base. The screenshot is the closing list, not an overlay. AL-45 remains absent.

Rest: as in m3d-list-base; covered by the overlay: none.

### Control inventory — m3m-list-base

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No changed visible controls relative to m3-list-base; incidental row action AL-45 is absent. Shell: SH-01–SH-46 as in contacts.md; Accounts is active.

Rest: as in m3-list-base in accounts.md; covered by the overlay: none. Absent here: AL-45.

### Control inventory — m3m-detail-base

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD-103 | Contacts summary | Contact record link | link | body, after portrait | not observed | seen (m3m-detail-base) | M2 | new |
| AD-104 | Contacts summary | Email link | link | body, below record link | not observed | seen (m3m-detail-base) | M10 | new |

Shell: SH-01–SH-46 as in contacts.md; Accounts is active. No new shell control. The longer wait paints the same Contacts summary already inventoried in m3c-detail-open. Its portrait, envelope and telephone glyphs are static; only the two links are interactive.

Rest: as in m3d-detail-main; covered by the overlay: none. Moved below viewport: AD-41, AD-100 and the Parent Account field. The business-card call icon AD-37 and Hide Details AD-38 remain visible.

### Control inventory — m3m-detail-more

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD-07.1 | More Options menu | Clone | menu item | menu, row 1 | same | seen (m3m-detail-more) | M3 | D-07.1 |
| AD-07.2 | More Options menu | Share | menu item | menu, row 2 | same | seen (m3m-detail-more) | M3 | D-07.2 |
| AD-07.3 | More Options menu | Delete | menu item | menu, row 3 | same | seen (m3m-detail-more) | M3 | D-07.3 |
| AD-07.4 | More Options menu | Print Preview | menu item | menu, row 4 | same | seen (m3m-detail-more) | M3 | D-07.4 |
| AD-07.5 | More Options menu | Find and Merge Duplicates | menu item | menu, row 5 | same | seen (m3m-detail-more) | M3 | D-07.5 |
| AD-07.6 | More Options menu | Mail Merge | menu item | menu, row 6 | same | seen (m3m-detail-more) | M9 | D-07.6 |
| AD-07.7 | More Options menu | Customize Business Card | menu item | menu, row 7 | same | seen (m3m-detail-more) | M11 | D-07.8 moved |
| AD-07.8 | More Options menu | Organize Account Details | menu item | menu, row 8 | same | seen (m3m-detail-more) | M11 | D-07.9 moved |
| AD-07.9 | More Options menu | Add Related List | menu item | menu, row 9 | same | seen (m3m-detail-more) | M11 | D-07.10 moved |
| AD-07.10 | More Options menu | Review History | menu item | menu, row 10 | same | seen (m3m-detail-more) | P3 | D-07.11 moved |
| AD-07.11 | More Options menu | Add Kiosk | menu item | menu, row 11 | same | seen (m3m-detail-more) | M11 | D-07.13 moved |
| AD-07.12 | More Options menu | Create Button | menu item | menu, row 12 | same | seen (m3m-detail-more) | M11 | D-07.14 moved |
| AD-07.13 | More Options menu | Create Client Script | menu item | menu, row 13 | same | seen (m3m-detail-more) | M11 | D-07.15 moved |

Two non-interactive separators follow rows 3 and 6; they have no control ID. Mail Merge has no visible submenu arrow. Add Kiosk and Create Client Script carry decorative sparkles. No row was selected or hovered; submenu contents and action outcomes were not observed.

Rest: as in m3m-detail-base; covered by the overlay: AD-35 (partially). The menu covers non-interactive business-card whitespace and the right edge of the Contacts summary. Absent here: D-07.7 (Run Macro), D-07.12 (Enroll to Cadence).

### Control inventory — m3m-detail-timeline

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD-33 | Tab row | Overview | tab | first tab, unselected | same | seen (m3m-detail-timeline) | M3 | D-33 |
| AD-34 | Tab row | Timeline | tab | second tab, selected | Opens History | seen (m3m-detail-timeline) | M3 | D-34 |
| AD-159 | Timeline | History | tab | inner tab row, first and only painted tab | same | seen (m3m-detail-timeline) | M3 | D-42 |
| AD-160 | Timeline | Show Upcoming Automated Actions | button | history toolbar, right, with downward chevron | same | seen (m3m-detail-timeline) | M12 | D-44 |
| AD-161 | Timeline | Filter Timeline History | icon button | after Timeline History heading | same | seen (m3m-detail-timeline) | M3 | D-45 |
| AD-162 | Timeline | Activity record link | link | call-event descriptions | same | seen (m3m-detail-timeline) | M5 | D-46 |

Rest: as in m3m-detail-base for shell, header, rail and outer tab row; covered by the overlay: none. Overview content is replaced: AD-37, AD-38, AD-103–AD-104 are absent. Absent here: D-43 (Interactions). D-47–D-51 belong to the unopened filter panel and are not asserted as visible here.

### Control inventory — m3m-list-after

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No changed painted controls relative to m3m-list-base.

Rest: as in m3m-list-base; covered by the overlay: none.

## More Options and Timeline

More Options opens a thirteen-row action menu in m3m-detail-more. Its labels and order are compared below; each row remains presence evidence only. Two separators and decorative sparkles beside Add Kiosk and Create Client Script are described in the inventory.

| Accounts # | Label | Contacts ref | Difference |
| --- | --- | --- | --- |
| AD-07.1 | Clone | D-07.1 | Same label/order |
| AD-07.2 | Share | D-07.2 | Same label/order |
| AD-07.3 | Delete | D-07.3 | Same label/order |
| AD-07.4 | Print Preview | D-07.4 | Same label/order |
| AD-07.5 | Find and Merge Duplicates | D-07.5 | Same label/order |
| AD-07.6 | Mail Merge | D-07.6 | Same label/order |
| AD-07.7 | Customize Business Card | D-07.8 | Moves from row 8 to row 7 |
| AD-07.8 | Organize Account Details | D-07.9 | Module-name substitution; moves from row 9 to row 8 |
| AD-07.9 | Add Related List | D-07.10 | Moves from row 10 to row 9 |
| AD-07.10 | Review History | D-07.11 | Moves from row 11 to row 10 |
| AD-07.11 | Add Kiosk | D-07.13 | Moves from row 13 to row 11 |
| AD-07.12 | Create Button | D-07.14 | Moves from row 14 to row 12 |
| AD-07.13 | Create Client Script | D-07.15 | Moves from row 15 to row 13 |
| absent | Run Macro | D-07.7 | Not painted in Accounts |
| absent | Enroll to Cadence | D-07.12 | Not painted in Accounts |

Timeline (AD-34) opens a populated History region in m3m-detail-timeline. Unlike Contacts, no Interactions tab is painted. Timeline History, its filter icon and Show Upcoming Automated Actions with a downward chevron match the Contacts toolbar. The history is grouped by date, with a vertical connector, event-type glyphs, times, descriptions and author/date lines. Visible event structures include account-field changes and call added/updated entries; call descriptions link to activity records (AD-162). Date headers and event glyphs are static display, not editable controls. No event text, values or names are reproduced. The empty-history state is not observed. The filter panel was not reopened; its shared Contacts inventory D-47–D-51 remains the comparison source, without asserting Accounts panel contents. No event link or automated-action control was activated.

## Account hierarchy

AD-115 is the Hierarchy View button in the **Contacts card**, after its title, already seen in m3c-card-deals and inventoried by the related-card continuation. It was not clicked here. Its card location does not establish an account-company tree.

The public help describes the Contacts-card hierarchy as the contact reporting structure, available inside Accounts and Contacts records (`documented`, D-H1). The Reporting to lookup links a contact to another contact associated with an account (`documented`, D-H1). The documented structure includes direct reports and the overall reporting hierarchy; the Accounts entry point is its Contacts related list (`documented`, D-H1). The document does not establish the exact modern opened container, depth limit, empty state or row controls: these remain `not observed` (D-H1 documentation gap).

Separately, Member Accounts represents secondary divisions or subsidiaries associated with a parent account (`documented`, D-H2). Its documented list supports Account Name, Phone, Website, Account Type, Industry and Annual Revenue sorting links, Edit/Del row links and New (`documented`, D-H2); these are documentation evidence, not additional painted AD controls. A multilevel account-company tree, its depth and its controls remain `not observed`; the document describes parent/member relationships without specifying that tree (D-H2 documentation gap).

### Documentation keys

Public help was read on 2026-10-12. Locators below are article paths on the reference CRM public help site; host/product names are intentionally omitted under repository policy. No source image or customer example is copied.

| Key | Public article / section | Neutral locator | Supports |
| --- | --- | --- | --- |
| D-H1 | Modifying Special Fields / Add Reporting Manager for Contacts; View Contact Hierarchy | /portal/en/kb/crm/customize-crm-account/customizing-fields/articles/modify-special-fields | Reporting to relationship; direct reports and overall contact structure; Accounts Contacts-card entry point |
| D-H2 | Creating Accounts / Add Member Accounts | /portal/en/kb/crm/sales-force-automation/accounts/articles/create-accounts | Parent/member divisions and subsidiaries; documented list sorting and row actions |

## Differences from Contacts record detail

- Website replaces the Account record link in the identity line (AD-99 vs D-03). The placeholder depicts a building; no source image asset is copied.
- Business-card field order is Account Owner, Industry, Employees, Annual Revenue, Phone. Phone moves from the Contacts third field to the fifth; the other Accounts business fields replace Contacts Email, Mobile and Department.
- Account Information replaces Contact Information. Its visible field arrangement is described in Layout. Parent Account is visible here, but empty. Website is linked in the right column (AD-100); no email link is painted.
- Contacts and Member Accounts are additional rail entries; Add Link follows the Links heading. Notes and Contacts have visible count badges (AD-101–AD-102). Badge values are not reproduced.
- The shortened rail lacks Cadences, Invited Meetings, Purchase Orders, Campaigns, Reporting Contacts and Voice of the Customer. Several shared entries move; see inventory positions.
- Header action labels and order match Contacts. More Options has 13 rows instead of 15: Run Macro and Enroll to Cadence are absent, Organize Account Details substitutes the module name, and later rows move up. Accounts Timeline paints History alone, whereas Contacts also paints Interactions; the history toolbar and activity-link structure are shared.

## Related-list rail vs metadata

Only names and order are in scope. Exported configuration is from accounts.md, not a claim that every exported entry is painted.

| Painted order | Rail label | Exported sequence / relationship | Comparison |
| --- | --- | --- | --- |
| 1 | Notes | 2 | Before Connected Records on screen |
| 2 | Connected Records | 1 | After Notes on screen |
| 3 | Attachments | 3 | Same relative order |
| 4 | Deals | 4 | Same relative order |
| 5 | Contacts | 5 | Same relative order |
| 6 | Emails | 6 | Same relative order |
| 7 | Open Activities | 8–10: Open Calls / Open Meetings / Open Tasks | One combined rail entry |
| 8 | Closed Activities | 13–15: Closed Tasks / Closed Meetings / Closed Calls | One combined rail entry |
| 9 | Products | 17 | Same relative order |
| 10 | Quotes | 18 | Same relative order |
| 11 | Sales Orders | 19 | Same relative order |
| 12 | Invoices | 20 | Same relative order |
| 13 | Member Accounts | 21 | Same relative order |
| 14 | Cases | 22 | Same relative order |
| 15 | Social | 23 | Same relative order |

Checklists (24) and Locking Information (25) are marked visible in metadata but have no painted rail entry in this captured record. Review Process entries, Email Drafts and Email Sentiment are hidden in metadata and absent on screen. Add Related List and Add Link are customization actions, not related-list metadata rows.

## Capability table

| Capability | Module | Reused from Contacts / Accounts-specific | Evidence / limit |
| --- | --- | --- | --- |
| Open record from list | M3 | Reused from Contacts | AL-42; one record opened |
| Header actions and record navigation | M3 / M6 / M10 | Reused from Contacts | AD-01–AD-09 excluding AD-03; presence only |
| Website links | M3 | Accounts-specific | AD-99–AD-100; links not followed |
| Overview business card and Account Information | M3 | Accounts-specific fields, shared structure | visible upper fields only |
| Parent Account / Member Accounts | M3 | Accounts-specific | parent display/rail/cards seen; documented relationship D-H2; no hierarchy opened |
| Contacts hierarchy entry point | M2 | Shared contact reporting structure | AD-115 in Contacts card; documented D-H1; opened controls not observed |
| Related-list rail / activity badges | Mixed as inventoried | Reused from Contacts, with moved entries | Notes, Deals, Closed Activities and Sales Orders rail jumps observed in this continuation |
| Contacts rail and Notes/Contacts badges | M2 / M6 | Accounts-specific relative to Contacts detail | AD-96 / AD-101–AD-102; Contacts summary links AD-103–AD-104 |
| Links / Add Link | M11 | Accounts-specific observed addition | AD-98; not activated |
| Phone call controls | M5 | Reused from Contacts, moved | AD-37 / AD-41; image-only, not activated |
| Rail visibility / Hide Details / Add Related List | M3 / M11 | Reused from Contacts | persisted-preference controls not activated |
| More Options rows | M3 / M9 / M11 / P3 | Shared menu with two absent rows and module-name substitution | AD-07.1–AD-07.13, m3m-detail-more; no row activated |
| Timeline content | M3 / M12 | Shared History toolbar; see More Options and Timeline | m3m-detail-timeline; filter not reopened |

## Capture refs

| Slug | Clicks | Skipped | What it shows |
| --- | --- | --- | --- |
| m3d-list-base | 0 | 0 | Populated opening list |
| m3d-detail-main | 1 | 0 | Header, rail, business card, upper Account Information |
| m3d-detail-more | 2 requested, 0 executed | 2 | Blank main area; loading state only; see m3m-detail-more |
| m3d-detail-timeline | 2 requested, 0 executed | 2 | Loading main area; loading state only; see m3m-detail-timeline |
| m3d-list-after | 0 | 0 | Renewed closing list, same total as opening |
| m3m-list-base | 0 | 0 | Opening list; total 373 |
| m3m-detail-base | 1 | 0 | Painted header/rail, business card, Contacts summary and beginning of Account Information |
| m3m-detail-more | 2 | 0 | Thirteen-row action menu |
| m3m-detail-timeline | 2 | 0 | Populated History, filter and automated-actions control; no Interactions tab |
| m3m-list-after | 0 | 0 | Closing list; total 373 |

m3d-detail-more and m3d-detail-timeline are evidence of loading/blank states only, not their intended opened states. m3d-detail-hierarchy was not attempted because the named entry was outside the upper viewport and safe activation was not established and is not an evidence slug. All five successful screenshots were opened as images and inspected. Opening and the renewed closing totals are equal (373); no record selection is painted. The original record selector was reused and matched exactly one entry in m3d-list-base offline. More Options and Timeline selectors each matched exactly one expected entry in m3d-detail-main offline, but neither matched at capture time. No alternative selector or open/toggle override was used.

Safety: the baseline detail has three Accounts bulk readings (statuses 200, 204, 200), now within the aggregate bound of three approved by the CTO in MEP-330. Its two related readings carry the approved related-record query signatures. The historical stop was correct under the earlier bound and was resolved before this continuation. No successful record write is observed. The historical m3d More Options and Timeline attempts have only one list bulk reading each and no new non-GET path. More Options has one blocked telemetry call; Timeline has no blocked requests. The renewed closing list has one occurrence of each expected list-reading path and shell trigger, two blocked background polls and seven blocked telemetry calls. Its total remains 373. No fourth detail bulk call or unexpected non-GET path was observed.

### Reconciliation of controls.json

Ordinals below are one-based local evidence positions, never click selectors. Every source item has exactly one inventory destination or written exclusion. Multiple DOM wrappers may refer to the same structural control. The list baseline differs from m3-list-base only in a Sort accessibility attribute and the absent incidental row action. The renewed m3d-list-after retains the 601-entry baseline mapping; only a Sort accessibility attribute differs, without a painted control change. Loading captures retain the first 81 shell entries and map their smaller top-bar tail separately. The first 82 detail entries match the approved Accounts baseline. Later top-bar entries have different wrapper structure and are mapped individually to the same painted SH controls. Image-only AD-37, AD-41 and SH-46 supplement the source mappings.

#### m3d-list-base

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82–83, 87, 111, 120, 136, 141, 155, 255, 259–264, 273 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 135, 139, 252–253, 257–258, 561–569, 574–588, 601 |
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
| excluded: invisible below clipped panel/table boundary | 65–80, 172–251, 418–419, 421, 424, 427–560, 589 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| AL-01 | 112 |
| AL-52 | 113 |
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
| excluded: invisible refresh footprint; no painted icon in base | 129–130 |
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
| AL-53 | 158–159 |
| AL-54 | 160–161 |
| AL-55 | 162–163 |
| AL-56 | 164–165 |
| AL-57 | 166–167 |
| AL-58 | 168–169 |
| AL-59 | 170–171 |
| excluded: invisible resize hotspot; no painted grip | 254 |
| AL-33 | 256 |
| AL-34 | 265–266 |
| AL-35 | 267 |
| AL-36 | 268–269 |
| AL-39 | 270 |
| AL-60 | 271 |
| AL-61 | 272 |
| excluded: record row data or row wrapper | 274–276, 278, 281, 283–284, 286–290, 293, 295–296, 298–301, 303, 306, 308–309, 311–314, 316, 319, 321–322, 324–327, 329, 332, 334–339, 341, 344, 346–347, 349–352, 354, 357, 359–360, 362–365, 367, 370, 372–373, 375–378, 380, 383, 385–386, 388–392, 395, 397–398, 400–403, 405, 408, 410–411, 413–417, 420, 422–423, 425–426 |
| AL-46 | 277, 302, 315, 328, 340, 353, 366, 379, 404 |
| AL-40 | 279–280, 291–292, 304–305, 317–318, 330–331, 342–343, 355–356, 368–369, 381–382, 393–394, 406–407 |
| AL-42 | 282, 294, 307, 320, 333, 345, 358, 371, 384, 396, 409 |
| AL-63 | 285, 297, 310, 323, 348, 361, 374, 387, 399, 412 |
| AL-48 | 570 |
| AL-49 | 571 |
| AL-50 | 572 |
| AL-51 | 573 |
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

601 source items; 92 inventory IDs represented by source entries; 413 excluded items. Image-only controls are additional.

#### m3d-detail-main

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81 |
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
| excluded: invisible below clipped panel/table boundary | 65–80 |
| excluded: duplicate wrapper or structural text | 83, 86, 106, 127, 176, 180–182, 215, 218–219 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| excluded: zero-area or invisible element | 90–91, 93–94, 96–97, 100–101, 109, 115, 117, 126, 133, 136, 139, 145, 154, 157, 160, 163, 166, 169, 172, 193, 199, 201, 206, 208, 214, 233, 238, 244, 249, 253, 257, 265, 271, 275, 286, 291, 295, 299, 312, 317, 319, 323, 345, 356–357, 379–380, 386, 388, 391, 396, 399, 440–443, 451–469, 482 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| AD-01 | 107–108 |
| AD-02 | 110–111 |
| excluded: static field label, value or field wrapper | 112, 183–192, 194–198, 200, 202–205, 207, 209–213, 220–232, 234–237, 239–243, 245, 262–264, 266–270, 272–274, 276–280, 283–285 |
| AD-99 | 113–114 |
| AD-04 | 116 |
| AD-05 | 118–119 |
| AD-06 | 120–121 |
| AD-07 | 122–123 |
| AD-08 | 124 |
| AD-09 | 125 |
| AD-10 | 128–129 |
| AD-101 | 130 |
| AD-11 | 131–132 |
| AD-12 | 134–135 |
| AD-14 | 137–138 |
| AD-96 | 140–141 |
| AD-102 | 142 |
| AD-23 | 143–144 |
| AD-15 | 146–147 |
| AD-30 | 148 |
| AD-16 | 149–150 |
| AD-31 | 151 |
| AD-18 | 152–153 |
| AD-20 | 155–156 |
| AD-21 | 158–159 |
| AD-24 | 161–162 |
| AD-97 | 164–165 |
| AD-19 | 167–168 |
| AD-26 | 170–171 |
| AD-29 | 173 |
| AD-98 | 174 |
| AD-32 | 175 |
| AD-33 | 177 |
| AD-34 | 178 |
| AD-35 | 179 |
| AD-38 | 216–217 |
| excluded: outside captured content viewport | 246–248, 250–252, 254–256, 258–261, 287–290, 292–294, 296–298, 300–311, 313–316, 318, 320–322, 324–344, 346–355, 358–378, 381–385, 387, 389–390, 392–395, 397–398, 400–439, 444–450, 470 |
| AD-100 | 281–282 |
| SH-35 | 471 |
| SH-36 | 472 |
| SH-37 | 473 |
| SH-38 | 474 |
| SH-39 | 475 |
| SH-40 | 476 |
| SH-41 | 477 |
| SH-42 | 478 |
| SH-43 | 479 |
| SH-44 | 480 |
| SH-45 | 481 |

482 source items; 81 inventory IDs represented by source entries; 352 excluded items. Image-only controls are additional.

#### m3d-list-after

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82–83, 87, 111, 120, 136, 141, 155, 255, 259–264, 273 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 135, 139, 252–253, 257–258, 561–569, 574–588, 601 |
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
| excluded: invisible below clipped panel/table boundary | 65–80, 172–251, 418–419, 421, 424, 427–560, 589 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| AL-01 | 112 |
| AL-52 | 113 |
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
| excluded: invisible refresh footprint; no painted icon in base | 129–130 |
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
| AL-53 | 158–159 |
| AL-54 | 160–161 |
| AL-55 | 162–163 |
| AL-56 | 164–165 |
| AL-57 | 166–167 |
| AL-58 | 168–169 |
| AL-59 | 170–171 |
| excluded: invisible resize hotspot; no painted grip | 254 |
| AL-33 | 256 |
| AL-34 | 265–266 |
| AL-35 | 267 |
| AL-36 | 268–269 |
| AL-39 | 270 |
| AL-60 | 271 |
| AL-61 | 272 |
| excluded: record row data or row wrapper | 274–276, 278, 281, 283–284, 286–290, 293, 295–296, 298–301, 303, 306, 308–309, 311–314, 316, 319, 321–322, 324–327, 329, 332, 334–339, 341, 344, 346–347, 349–352, 354, 357, 359–360, 362–365, 367, 370, 372–373, 375–378, 380, 383, 385–386, 388–392, 395, 397–398, 400–403, 405, 408, 410–411, 413–417, 420, 422–423, 425–426 |
| AL-46 | 277, 302, 315, 328, 340, 353, 366, 379, 404 |
| AL-40 | 279–280, 291–292, 304–305, 317–318, 330–331, 342–343, 355–356, 368–369, 381–382, 393–394, 406–407 |
| AL-42 | 282, 294, 307, 320, 333, 345, 358, 371, 384, 396, 409 |
| AL-63 | 285, 297, 310, 323, 348, 361, 374, 387, 399, 412 |
| AL-48 | 570 |
| AL-49 | 571 |
| AL-50 | 572 |
| AL-51 | 573 |
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

601 source items; 92 inventory IDs represented by source entries; 413 excluded items. Image-only controls are additional.

#### m3d-detail-more

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62 |
| SH-01 | 2, 3, 4 |
| excluded: invisible zero-area element | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29, 30, 31 |
| SH-10 | 33 |
| SH-11 | 34, 35 |
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
| excluded: invisible below clipped panel/table boundary | 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80 |
| excluded: zero-area element | 82, 89, 90, 92, 93, 95, 96, 99, 100, 104, 105, 106, 107, 108, 109, 110, 111, 112 |
| SH-26 | 83 |
| SH-27 | 84 |
| excluded: duplicate structural wrapper | 85 |
| SH-28 | 86 |
| SH-29 | 87 |
| SH-30 | 88 |
| SH-31 | 91 |
| SH-32 | 94 |
| SH-33 | 97, 98 |
| excluded: empty icon footprint; no painted control | 101 |
| excluded: zero-area utility-strip wrapper | 102 |
| excluded: static loading progress decoration | 103 |

112 source items; 33 inventory IDs represented by source entries; 56 excluded items. No opened AD controls. The entire image, including corners and right edge, was inspected.

#### m3d-detail-timeline

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62 |
| SH-01 | 2, 3, 4 |
| excluded: invisible zero-area element | 5, 6, 7, 8, 9, 12, 15, 18, 21, 24, 27, 32, 81 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29, 30, 31 |
| SH-10 | 33 |
| SH-11 | 34, 35 |
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
| excluded: invisible below clipped panel/table boundary | 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80 |
| excluded: zero-area element | 82, 89, 90, 92, 93, 95, 96, 99, 100, 104, 105, 106, 107, 108, 109, 110, 111, 112 |
| SH-26 | 83 |
| SH-27 | 84 |
| excluded: duplicate structural wrapper | 85 |
| SH-28 | 86 |
| SH-29 | 87 |
| SH-30 | 88 |
| SH-31 | 91 |
| SH-32 | 94 |
| excluded: profile source entries; no painted control in screenshot | 97, 98 |
| excluded: empty icon footprint; no painted control | 101 |
| excluded: zero-area utility-strip wrapper | 102 |
| excluded: static loading progress decoration | 103 |

112 source items; 32 inventory IDs represented by source entries; 58 excluded items. No opened AD controls. The entire image, including corners and right edge, was inspected.

## Open questions

1. Hierarchy View opens the contact reporting structure according to D-H1; its exact opened container, depth, row controls and empty state remain not observed. D-H2 does not document a multilevel account-company tree or its controls. No hierarchy activation or preference-write experiment is authorized.
2. Parent Account populated presentation remains not observed; no alternate record was opened. Contacts summary links, menu actions/submenus, Interactions and automated-action outcomes remain not observed.
3. Why are Checklists and Locking Information absent from the painted rail despite visible metadata flags? No hidden rail control or persistent preference was exercised.
4. Field pencils, portrait hover controls and selected-rail plus actions were not observed. Their existence/activation must not be inferred from Contacts or hidden DOM.
5. Previous/next ordering and boundaries, back navigation, Website links, and all write outcomes remain not observed. Lower field display remains unobserved; related-card controls are documented in the continuation below.
6. Connected Records ownership (?) and shared-shell ownership gaps remain inherited open questions from Contacts. No additional shell control was found. Add Link is assigned M11 as a record-page customization action; UI Lead should confirm this assignment.

### Shell controls missing from app-shell.md

No new shared-shell control was found beyond SH-01–SH-46 already inventoried in Contacts. The extra Links group belongs to the record rail.

## Lower-detail research safety stop

The first continuation stopped at m3c-detail-base after one successful metrics POST outside the permitted set; its intended detail had not finished painting. The CTO identified browser telemetry, confirmed no record/preference write, and widened the capture tool's telemetry guard on 2026-10-12. m3c-detail-base and the skeletal m3c-list-after remain unchanged as historical stop evidence, without control inventories. Research resumed with new slugs and a 12-second wait; m3c-detail-open painted the detail and m3c-card-notes demonstrated that the previously successful metrics route is now blocked as telemetry.

### Control inventory — m3c-list-base

Shell: SH-01–SH-46 as in contacts.md; Accounts is active. No additional shell control is painted.

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No changed visible controls relative to m3-list-base in accounts.md, except the incidental row three-dots action is absent. The record link used is AL-42. No related-record column is painted, so list evidence could not identify a populated related-card candidate.

Rest: as in m3-list-base in accounts.md; covered by the overlay: none. Absent here: AL-45.

### Control inventory — m3c-detail-open

Shell: SH-01–SH-46 as in contacts.md; Accounts is active. No new shell control. This is a difference capture against m3d-detail-main.

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD-103 | Contacts summary | Contact record link | link | body, after portrait | not observed | seen (m3c-detail-open) | M2 | new |
| AD-104 | Contacts summary | Email link | link | body, below record link | not observed | seen (m3c-detail-open) | M10 | new |


A Contacts summary is inserted between the business card and Hide Details. Its silhouette, envelope and telephone symbols accompany static display; no separate source control or green call action is painted there. The two actual links are inventoried without their values. The Account Information title and its first left/right fields reach the lower viewport; other upper fields and their controls have moved below it. The green business-card Phone action remains AD-37 (image-only).

Rest: as in m3d-detail-main for the fixed header, rail, tab row and business card; covered by the overlay: none. Scrolled or displaced below the viewport: AD-41, AD-100. AD-38 is lower, below the Contacts summary. Absent here: D-03, D-13, D-17, D-22, D-25, D-27, D-28, D-36, D-39, D-40, D-52, D-53 as in the upper baseline.

### Control inventory — m3c-card-notes

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD-105 | Related-list rail | Organize Accounts Details | icon button | after Related List heading | same | seen (m3c-card-notes) | M11 | D-52 |
| AD-106 | Related-list rail | Plus icon | icon button | Notes row, right end | same | seen (m3c-card-notes) | M6 | D-53 |
| AD-107 | Notes card | Recent Last | select | header, right | not observed | seen (m3c-card-notes) | M6 | new |
| AD-108 | Notes card | Add a note | input | body, below notes | not observed | seen (m3c-card-notes) | M6 | new |
| AD-109 | Notes card | Show More / down arrow | button | body, end of truncated note | not observed | seen (m3c-card-notes) | M6 | new |
| AD-110 | Attachments card | Attach / down arrow | button | header, right | same | seen (m3c-card-notes) | M6 | D-54 |
| AD-111 | Record content | Scroll To Top | icon button | floating at lower right | same | seen (m3c-card-notes) | M3 | D-63 |

Rest: as in m3d-detail-main for the shell, fixed header, rail and tab row; covered by the overlay: none. Scrolled out: AD-37, AD-38, AD-41, AD-100, AD-103–AD-104. The selected rail row changes as named above; other rail entries retain the baseline order. The Notes-row plus and Organize Accounts Details icon are newly painted. Notes has no header counter, column headings or row-end action painted; the rail retains its count badge AD-101. Record-row names, text, metadata and embedded links are excluded as row data. Show More is a screenshot-only action at the end of truncated content. No action was activated. Connected Records has settled to the shared no-records empty state, rather than the loading state in Contacts. Attachments is fully visible and matches Contacts. The next Deals header controls fall behind the bottom utility boundary and are not usable observation here; they are inventoried in m3c-card-deals.

### Control inventory — m3c-card-deals

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD-105 | Related-list rail | Organize Accounts Details | icon button | after Related List heading | same | seen (m3c-card-deals) | M11 | D-52 |
| AD-111 | Record content | Scroll To Top | icon button | floating at lower right | same | seen (m3c-card-deals) | M3 | D-63 |
| AD-112 | Related-list rail | Plus icon | icon button | Deals row, right end | same | seen (m3c-card-deals) | M4 | D-53 moved |
| AD-113 | Deals card | Assign | button | header, right group, first | not observed | seen (m3c-card-deals) | M4 | new |
| AD-114 | Deals card | New Deal | button | header, right group, second | same | seen (m3c-card-deals) | M4 | D-56 |
| AD-115 | Contacts card | Hierarchy View | button | header, after title | same | seen (m3c-card-deals) | M2 | D-90 moved |
| AD-116 | Contacts card | Assign | button | header, right group, first | not observed | seen (m3c-card-deals) | M2 | new |
| AD-117 | Contacts card | New | button | header, right group, second | not observed | seen (m3c-card-deals) | M2 | new |
| AD-118 | Contacts card | Edit | button | header, right group, third | not observed | seen (m3c-card-deals) | M2 | new |
| AD-119 | Contacts card | Table with plus icon | icon button | header, right group, fourth | not observed | seen (m3c-card-deals) | M11 | new |
| AD-120 | Contacts card | Diagonal expand arrows | icon button | header, right group, fifth | not observed | seen (m3c-card-deals) | M2 | new |
| AD-121 | Contacts card | Contact Name | column header | table header, named column 1 | not observed | seen (m3c-card-deals) | M2 | new |
| AD-122 | Contacts card | Email | column header | table header, named column 2 | not observed | seen (m3c-card-deals) | M2 | new |
| AD-123 | Contacts card | Phone | column header | table header, named column 3 | not observed | seen (m3c-card-deals) | M2 | new |
| AD-124 | Contacts card | Mobile | column header | table header, named column 4 | not observed | seen (m3c-card-deals) | M2 | new |
| AD-125 | Contacts card | Fax | column header | table header, named column 5 | not observed | seen (m3c-card-deals) | M2 | new |
| AD-126 | Contacts card | Contact Owner | column header | table header, named column 6 | not observed | seen (m3c-card-deals) | M2 | new |
| AD-127 | Contacts card | Contact record link | link | row, Contact Name column | not observed | seen (m3c-card-deals) | M2 | new |
| AD-128 | Contacts card | Email link | link | row, Email column | not observed | seen (m3c-card-deals) | M10 | new |
| AD-129 | Contacts card | Phone call icon | icon button | row, after Phone display | not observed | seen (m3c-card-deals) | M5 | new |
| AD-130 | Emails card | Accounts - Sent emails from CRM / down arrow | select | tab row, right | not observed | seen (m3c-card-deals) | M10 | new |
| AD-131 | Emails card | Compose Email | button | header, right | same | seen (m3c-card-deals) | M10 | D-79 |
| AD-132 | Emails card | Mails | tab | below header, 1 | same | seen (m3c-card-deals) | M10 | D-80 |
| AD-133 | Emails card | Drafts | tab | below header, 2 | same | seen (m3c-card-deals) | M10 | D-81 |
| AD-134 | Emails card | Scheduled | tab | below header, 3 | same | seen (m3c-card-deals) | M10 | D-82 |
| AD-135 | Open Activities card | Add New / down arrow | button | header, right group, first | same | seen (m3c-card-deals) | M5 | D-57 |
| AD-136 | Open Activities card | Column View | select | header, right group, second | same | seen (m3c-card-deals) | M5 | D-58 |
| AD-137 | Open Activities card | Table with plus icon | icon button | header, right group, third | same | seen (m3c-card-deals) | M11 | D-59 |
| AD-138 | Open Activities card | Diagonal expand arrows | icon button | header, right group, fourth | same | seen (m3c-card-deals) | M5 | D-60 |
| AD-139 | Open Activities card | Open Tasks count | badge | first visible activity column, after title | same | seen (m3c-card-deals) | M5 | D-61 |
| AD-140 | Open Activities card | Open Meetings count | badge | second visible activity column, after title | same | seen (m3c-card-deals) | M5 | D-62 |

Rest: as in m3d-detail-main for the shell, fixed header, rail and tab row; covered by the overlay: none. Scrolled out: AD-37, AD-38, AD-41, AD-100, AD-103–AD-104. The selected rail row changes as named above; other rail entries retain the baseline order. Deals is selected; its plus is AD-112. Deals adds Assign before New Deal compared with Contacts. Contacts is a populated table with six named headers and a blank leading cell column; that blank column contains no painted checkbox, column control or row action. Contact-row values are outside scope; only the two link controls and green call icon are inventoried. The Contacts title has no counter badge. Hierarchy View and all upper actions were only viewed. Emails additionally paints its Accounts sent-mail selector; none of its tabs or selector options was opened. Open Tasks/Open Meetings counters are image-only; Calls is outside the horizontal viewport. The next Closed Activities header is below the readable boundary and is not inventoried from this screenshot.

### Control inventory — m3c-card-closed-activities

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD-105 | Related-list rail | Organize Accounts Details | icon button | after Related List heading | same | seen (m3c-card-closed-activities) | M11 | D-52 |
| AD-111 | Record content | Scroll To Top | icon button | floating at lower right | same | seen (m3c-card-closed-activities) | M3 | D-63 |
| AD-141 | Closed Activities card | Column View | select | header, right group, first | same | seen (m3c-card-closed-activities) | M5 | D-64 |
| AD-142 | Closed Activities card | Table with plus icon | icon button | header, right group, second | same | seen (m3c-card-closed-activities) | M11 | D-65 |
| AD-143 | Closed Activities card | Diagonal expand arrows | icon button | header, right group, third | same | seen (m3c-card-closed-activities) | M5 | D-66 |
| AD-144 | Closed Activities card | Closed Tasks count | badge | first visible activity column, after title | same | seen (m3c-card-closed-activities) | M5 | D-67 |
| AD-145 | Closed Activities card | Closed Meetings count | badge | second visible activity column, after title | same | seen (m3c-card-closed-activities) | M5 | D-68 |
| AD-146 | Products card | Add Products | button | header, right | same | seen (m3c-card-closed-activities) | P2 | D-69 |
| AD-147 | Quotes card | Assign | button | header, right group, first | same | seen (m3c-card-closed-activities) | P2 | D-73 |
| AD-148 | Quotes card | New | button | header, right group, second | same | seen (m3c-card-closed-activities) | P2 | D-74 |
| AD-149 | Sales Orders card | Assign | button | header, right group, first | same | seen (m3c-card-closed-activities) | P2 | D-75 |
| AD-150 | Sales Orders card | New | button | header, right group, second | same | seen (m3c-card-closed-activities) | P2 | D-76 |

Rest: as in m3d-detail-main for the shell, fixed header, rail and tab row; covered by the overlay: none. Scrolled out: AD-37, AD-38, AD-41, AD-100, AD-103–AD-104. The selected rail row changes as named above; other rail entries retain the baseline order. Closed Activities is selected; no rail-row plus is painted. Closed Tasks/Closed Meetings counters are image-only; Calls is outside the horizontal viewport. Products and Quotes are fully visible. Sales Orders New is partly covered by Scroll To Top; its separate following capture establishes the complete button. Invoices starts below this viewport; its actions are not evidence here.

### Control inventory — m3c-card-sales-orders

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AD-105 | Related-list rail | Organize Accounts Details | icon button | after Related List heading | same | seen (m3c-card-sales-orders) | M11 | D-52 |
| AD-111 | Record content | Scroll To Top | icon button | floating at lower right | same | seen (m3c-card-sales-orders) | M3 | D-63 |
| AD-149 | Sales Orders card | Assign | button | header, right group, first | same | seen (m3c-card-sales-orders) | P2 | D-75 |
| AD-150 | Sales Orders card | New | button | header, right group, second | same | seen (m3c-card-sales-orders) | P2 | D-76 |
| AD-151 | Related-list rail | Plus icon | icon button | Sales Orders row, right end | same | seen (m3c-card-sales-orders) | P2 | D-83 moved |
| AD-152 | Invoices card | Assign | button | header, right group, first | same | seen (m3c-card-sales-orders) | P2 | D-84 |
| AD-153 | Invoices card | New | button | header, right group, second | same | seen (m3c-card-sales-orders) | P2 | D-85 |
| AD-154 | Member Accounts card | New | button | header, right | not observed | seen (m3c-card-sales-orders) | M3 | new |
| AD-155 | Cases card | Assign | button | header, right group, first | same | seen (m3c-card-sales-orders) | M8 | D-70 |
| AD-156 | Cases card | New | button | header, right group, second | same | seen (m3c-card-sales-orders) | M8 | D-71 |
| AD-157 | Social card | Associate Twitter | link | left panel, first | same | seen (m3c-card-sales-orders) | M15 | D-87 |
| AD-158 | Social card | Associate Facebook | link | left panel, second | same | seen (m3c-card-sales-orders) | M15 | D-88 |

Rest: as in m3d-detail-main for the shell, fixed header, rail and tab row; covered by the overlay: none. Scrolled out: AD-37, AD-38, AD-41, AD-100, AD-103–AD-104. The selected rail row changes as named above; other rail entries retain the baseline order. Sales Orders is selected; its plus is AD-151. Sales Orders, Invoices, Member Accounts and Cases headers and upper actions are fully visible. Member Accounts has no counter or column headings in this empty state and only New at the right. Social's title and both association links are painted; its lower guidance and record-page footer remain below the viewport. No association, record creation or card preference control was activated.

### Control inventory — m3c-list-end

Shell: SH-01–SH-46 as in contacts.md; Accounts is active.

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No changed painted controls relative to m3c-list-base. No record is selected. The opening and closing totals are both 373.

Rest: as in m3c-list-base and accounts.md m3-list-base; covered by the overlay: none. Absent here: AL-45.

## Related-list cards

Order is the painted Accounts rail order. Common-card references point to [contacts-record-detail.md](contacts-record-detail.md#related-list-cards), **Related-list cards**, named row; only differences are expanded here. No card action was activated. Counter absence and missing column headings describe the captured state, not every possible populated record. Row contents are outside scope. Rail badge values and row data are not reproduced.

| Order | Card title | Module | Counter | Upper controls | Column headers | Empty state | Contacts ref | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Notes | M6 | No card-header counter; rail badge AD-101 | Recent Last (AD-107); Add a note below content (AD-108); Show More at truncated content (AD-109) | None painted | Populated; empty state not observed | Notes: previously not observed; this fills title/action evidence only | m3c-card-notes |
| 2 | Connected Records | ? | No counter painted, same | No upper action painted, same | None painted | Settled no-records state; Contacts only showed loading | Connected Records | m3c-card-notes |
| 3 | Attachments | M6 | Same | Same: Attach / down arrow AD-110 → D-54 | None painted | Same: no attachment | Attachments | m3c-card-notes |
| 4 | Deals | M4 | No counter painted | **Assign AD-113, New Deal AD-114**, right group in that order; Assign is additional | None painted in empty card | No records | Deals; additional Assign | m3c-card-deals |
| 5 | Contacts | M2 | No card counter; rail badge AD-102 | **Hierarchy View AD-115** after title; **Assign AD-116, New AD-117, Edit AD-118, table with plus AD-119, diagonal expand AD-120** at right | **Contact Name, Email, Phone, Mobile, Fax, Contact Owner** (AD-121–AD-126); blank leading cell column has no painted control | Populated; empty state not observed | new; no Contacts card in Contacts detail. D-90 is a moved hierarchy-control comparison | m3c-card-deals |
| 6 | Emails | M10 | Same | Same Compose Email and Mails/Drafts/Scheduled (AD-131–AD-134 → D-79–D-82); additionally Accounts sent-mail selector AD-130 at right of tab row | None painted | Same: no records in Mails; other tabs not opened | Emails; additional selector | m3c-card-deals |
| 7 | Open Activities | M5 | Same Open Tasks / Open Meetings badges AD-139–AD-140 → D-61–D-62; Calls outside viewport | Same AD-135–AD-138 → D-57–D-60 | Same two visible activity-column titles; no record-table headers painted | Same: empty Tasks/Meetings; Calls not observed | Open Activities | m3c-card-deals |
| 8 | Closed Activities | M5 | Same Closed Tasks / Closed Meetings badges AD-144–AD-145 → D-67–D-68; Calls outside viewport | Same AD-141–AD-143 → D-64–D-66 | Same two visible activity-column titles; no record-table headers painted | Same: empty Tasks/Meetings; Calls not observed | Closed Activities | m3c-card-closed-activities |
| 9 | Products | P2 | Same | Same Add Products AD-146 → D-69 | None painted | Same: no records | Products | m3c-card-closed-activities |
| 10 | Quotes | P2 | Same | Same Assign/New AD-147–AD-148 → D-73–D-74 | None painted | Same: no records | Quotes | m3c-card-closed-activities |
| 11 | Sales Orders | P2 | Same | Same Assign/New AD-149–AD-150 → D-75–D-76 | None painted | Same: no records | Sales Orders | m3c-card-sales-orders; partly overlapped New in m3c-card-closed-activities |
| 12 | Invoices | P2 | Same | Same Assign/New AD-152–AD-153 → D-84–D-85 | None painted | Same: no records | Invoices | m3c-card-sales-orders |
| 13 | Member Accounts | M3 | **No counter painted** | **New AD-154**, header right; no other upper action painted | **None painted in empty card** | **No records** | new; no Member Accounts card in Contacts detail | m3c-card-sales-orders |
| 14 | Cases | M8 | Same | Same Assign/New AD-155–AD-156 → D-70–D-71 | None painted | Same: no records | Cases | m3c-card-sales-orders |
| 15 | Social | M15 | Same | No header action, same; body links AD-157–AD-158 → D-87–D-88 | None painted | Association panel visible; lower guidance not observed | Social | m3c-card-sales-orders |

Deals and Member Accounts are empty, so populated column headers and row-end controls remain unobserved. Contacts has no row-end action painted in the blank leading cell or at the trailing owner column; hover-only actions remain unobserved. No card count value is copied. Notes' populated content is not evidence of its empty state.

Connected Records and Attachments received no dedicated capture because their titles and all painted upper controls were fully visible in m3c-card-notes. Contacts, Emails and Open Activities were covered by m3c-card-deals. Products and Quotes were covered by m3c-card-closed-activities. Invoices, Member Accounts, Cases and Social were covered by m3c-card-sales-orders. Only four card jumps were needed; all three priority cards were covered before the twenty-capture limit. Sales Orders was recaptured because its New button was partly overlapped in the preceding image. No other card jump was repeated.

## Record-page footer and edges

The fixed header, tab row, rail, full right edge, utility strip and floating Scroll To Top AD-111 were inspected in every new screenshot. The record-page customization footer remains below the last captured viewport; Contacts D-93–D-95 are comparison references, not Accounts observations. No new shell control was found beyond SH-01–SH-46.

Billing/shipping read-only display and Description remain unobserved. The first card jump targets Notes directly and does not expose preceding lower detail sections. No separately named section-heading jump control is established in m3c-detail-open; hidden/offscreen DOM field groups are not screen evidence. No invented selector, scroll operation or persistent preference action was used. Form/address definitions remain shared with contacts-form.md F-33–F-52 and MEP-315; no field or country/state catalogue is repeated here.

### Differences and capability additions

- Contacts summary record/email links AD-103–AD-104 are inserted below the business card; this pushes Account Information and its upper controls lower in the initial viewport.
- Notes sort/input/truncation controls are now observed, filling Contacts' missing-card observation. Connected Records reaches a settled empty state, filling its loading-only gap.
- Deals adds Assign. Contacts exposes a populated relationship table with hierarchy/action/customization controls and six named columns. Member Accounts shows an empty relationship card with New only.
- Emails adds its Accounts sent-mail selector. Shared card controls use Contacts references; persistent view and customization controls were not activated.

| Capability addition | Module | Evidence / limit |
| --- | --- | --- |
| Contacts summary / populated related Contacts | M2 / M10 / M5 | AD-103–AD-104, AD-115–AD-129; structure and links only, no record/communication action followed |
| Notes card sort/input/truncation | M6 | AD-107–AD-109 visible; no selection, filling or expansion |
| Connected Records settled empty state | ? | m3c-card-notes; ownership remains open |
| Deals relationship / Assign | M4 | AD-113–AD-114; empty state, no button activation |
| Member Accounts relationship | M3 | AD-154; empty state; populated headers and hierarchy not observed |
| Email source selector | M10 | AD-130; initial display only |
| Shared related-card actions and activity badges | Mixed as inventoried | AD-110–AD-158 with Contacts references; Calls outside horizontal viewport |
| Record footer, lower address and Description | M3 / M11 | not observed; no permitted named section jump established |

### Capture refs — lower-detail continuation

| Slug | Clicks | Skipped | What it shows |
| --- | --- | --- | --- |
| m3c-list-base | 0 | 0 | Opening list; 373 records |
| m3c-detail-base | 1 | 0 | Detail did not load; historical telemetry-stop evidence only |
| m3c-list-after | 0 | 0 | Loading skeleton; historical stop evidence only |
| m3c-detail-open | 1 | 0 | Loaded detail; Contacts summary inserted above Hide Details |
| m3c-card-notes | 2 | 0 | Notes, settled empty Connected Records, Attachments |
| m3c-card-deals | 2 | 0 | Deals, populated Contacts, Emails, Open Activities |
| m3c-card-closed-activities | 2 | 0 | Closed Activities, Products, Quotes; overlapped Sales Orders New |
| m3c-card-sales-orders | 2 | 0 | Sales Orders, Invoices, Member Accounts, Cases, upper Social |
| m3c-list-end | 0 | 0 | Closing list; 373 records, same as opening |

All six new screenshots were opened as images and inspected across the whole frame; source arrays do not substitute for image evidence. The old failed detail and skeleton captures remain unchanged as historical stop evidence, without inventory/reconciliation tables. New selectors were validated offline against exactly one expected entry: the original record selector in m3c-list-base and each named ray text selector in m3c-detail-open. No skipped click, alternate selector, open/toggle override, preference change or card write action occurred. All new commands used a 12-second wait. No detail retry was needed.

Safety: every new capture was checked and commented before the next one. Each detail/card capture has three Accounts bulk readings (one list and two approved related-record signatures), with EntityCustomization, list count, analytics and shell trigger once each. Background polls and labelled telemetry are blocked. The formerly successful clientmetricslog route appears blocked as telemetry in the Notes, Deals and Closed Activities captures. No unexpected non-GET path, excess allowed count, sent telemetry or successful record write appears in the resumed logs. The closing list has the expected list/shell set once each and confirms 373 records.

### Reconciliation of controls.json — lower-detail continuation

One-based ordinals are local evidence references, never selectors. The list controls reuse accounts.md AL IDs and contacts.md SH IDs. Source wrappers, row data and offscreen elements are excluded explicitly. Source-backed note bubble icons remain AL-46. Screenshot-only Phone handset icons are AL-62 and the far-right utility icon is SH-46 in both painted lists. m3c-list-end shows the fully loaded closing list.

#### m3c-list-base

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82–83, 87, 111, 120, 136, 141, 155, 255, 259–264, 273 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 135, 139, 252–253, 257–258, 561–569, 574–588 |
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
| excluded: invisible below clipped panel/table boundary | 65–80, 172–251, 418–419, 421, 424, 427–560 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| AL-01 | 112 |
| AL-52 | 113 |
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
| excluded: invisible refresh footprint; no painted icon in base | 129–130 |
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
| AL-53 | 158–159 |
| AL-54 | 160–161 |
| AL-55 | 162–163 |
| AL-56 | 164–165 |
| AL-57 | 166–167 |
| AL-58 | 168–169 |
| AL-59 | 170–171 |
| excluded: invisible resize hotspot; no painted grip | 254 |
| AL-33 | 256 |
| AL-34 | 265–266 |
| AL-35 | 267 |
| AL-36 | 268–269 |
| AL-39 | 270 |
| AL-60 | 271 |
| AL-61 | 272 |
| excluded: record row data or row wrapper | 274–276, 278, 281, 283–284, 286–290, 293, 295–296, 298–301, 303, 306, 308–309, 311–314, 316, 319, 321–322, 324–327, 329, 332, 334–339, 341, 344, 346–347, 349–352, 354, 357, 359–360, 362–365, 367, 370, 372–373, 375–378, 380, 383, 385–386, 388–392, 395, 397–398, 400–403, 405, 408, 410–411, 413–417, 420, 422–423, 425–426 |
| AL-46 | 277, 302, 315, 328, 340, 353, 366, 379, 404 |
| AL-40 | 279–280, 291–292, 304–305, 317–318, 330–331, 342–343, 355–356, 368–369, 381–382, 393–394, 406–407 |
| AL-42 | 282, 294, 307, 320, 333, 345, 358, 371, 384, 396, 409 |
| AL-63 | 285, 297, 310, 323, 348, 361, 374, 387, 399, 412 |
| AL-48 | 570 |
| AL-49 | 571 |
| AL-50 | 572 |
| AL-51 | 573 |
| excluded: invisible zero-height chat wrapper | 589 |
| excluded: duplicate utility-strip wrapper | 590 |
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

601 source items; 92 inventory IDs represented by source entries; 413 excluded items.

### Reconciliation of controls.json — resumed captures

One-based local evidence ordinals are never selectors. Every source item below maps to one ID or one exclusion. Zero-area/offscreen DOM, fields behind the fixed header or utility boundary, static labels/values, repeated wrappers and record-row contents are excluded. The blank Contacts leading header is structural, not a separate painted control. Direct Notes record/content links are row data outside the card-structure scope; their text is not copied. Summary and Contacts-table links are retained as neutral structural link controls. Image-only AD-37 (business-card call), AD-109 (Show More), AD-129 (table call), AD-139–AD-140 and AD-144–AD-145 (activity badges), and SH-46 supplement the relevant source mappings. The summary's silhouette, envelope and telephone symbol are display decoration; no independent interactive source control is established.

#### m3c-detail-open

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82, 86, 106, 176, 180–181, 215, 218, 221 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 109, 115, 117, 126, 133, 136, 139, 145, 154, 157, 160, 163, 166, 169, 172, 193, 199, 201, 206, 208, 214, 236, 241, 247, 252, 256, 260, 268, 274, 278, 289, 294, 298, 302, 315, 320, 323–324, 340–343, 347, 369, 380–381, 405–406, 412, 414, 417, 422, 425, 466–469, 477–496 |
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
| SH-15 | 42–43, 83 |
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
| excluded: outside or covered by captured content boundary | 65–80, 231–235, 237–240, 242–246, 248–251, 253–255, 257–259, 261–264, 273, 275–277, 279–288, 290–293, 295–297, 299–301, 303–314, 316–319, 321–322, 325–339, 344–346, 348–368, 370–379, 382–404, 407–411, 413, 415–416, 418–421, 423–424, 426–465, 470–476, 497 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| AD-01 | 107–108 |
| AD-02 | 110–111 |
| excluded: static label, value or structural text | 112, 127, 182–192, 194–198, 200, 202–205, 207, 209–213, 222–230, 265–267, 269–272 |
| AD-99 | 113–114 |
| AD-04 | 116 |
| AD-05 | 118–119 |
| AD-06 | 120–121 |
| AD-07 | 122–123 |
| AD-08 | 124 |
| AD-09 | 125 |
| AD-10 | 128–129 |
| AD-101 | 130 |
| AD-11 | 131–132 |
| AD-12 | 134–135 |
| AD-14 | 137–138 |
| AD-96 | 140–141 |
| AD-102 | 142 |
| AD-23 | 143–144 |
| AD-15 | 146–147 |
| AD-30 | 148 |
| AD-16 | 149–150 |
| AD-31 | 151 |
| AD-18 | 152–153 |
| AD-20 | 155–156 |
| AD-21 | 158–159 |
| AD-24 | 161–162 |
| AD-97 | 164–165 |
| AD-19 | 167–168 |
| AD-26 | 170–171 |
| AD-29 | 173 |
| AD-98 | 174 |
| AD-32 | 175 |
| AD-33 | 177 |
| AD-34 | 178 |
| AD-35 | 179 |
| AD-103 | 216 |
| AD-104 | 217 |
| AD-38 | 219–220 |
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

508 source items; 82 inventory IDs represented by source entries; 377 excluded items. Image-only controls supplement these counts.

#### m3c-card-notes

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82, 86, 106, 178, 334, 338 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 109, 115, 117, 126, 135, 138, 141, 147, 156, 159, 162, 165, 168, 171, 174, 195, 201, 203, 208, 210, 216, 238, 243, 249, 254, 258, 262, 270, 276, 280, 291, 296, 300, 304, 314–315, 319, 321, 326, 329–330, 346–349, 353, 375, 386–387, 411–412, 418, 420, 423, 428, 431, 472–475, 484–501, 514 |
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
| SH-15 | 42–43, 83 |
| SH-16 | 44–45, 358 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| excluded: outside or covered by captured content boundary | 65–80, 182–194, 196–200, 202, 204–207, 209, 211–215, 217–237, 239–242, 244–248, 250–253, 255–257, 259–261, 263–269, 271–275, 277–279, 281–290, 292–295, 297–299, 301–303, 305–313, 316–318, 320, 322–325, 327, 359–374, 376–385, 388–410, 413–417, 419, 421–422, 424–427, 429–430, 432–471, 476–482, 502 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| AD-01 | 107–108 |
| AD-02 | 110–111 |
| excluded: static label, value or structural text | 112, 127, 328, 333, 335, 339, 350–352, 354–355 |
| AD-99 | 113–114 |
| AD-04 | 116 |
| AD-05 | 118–119 |
| AD-06 | 120–121 |
| AD-07 | 122–123 |
| AD-08 | 124 |
| AD-09 | 125 |
| AD-105 | 128 |
| AD-10 | 129–130 |
| AD-101 | 131 |
| AD-106 | 132 |
| AD-11 | 133–134 |
| AD-12 | 136–137 |
| AD-14 | 139–140 |
| AD-96 | 142–143 |
| AD-102 | 144 |
| AD-23 | 145–146 |
| AD-15 | 148–149 |
| AD-30 | 150 |
| AD-16 | 151–152 |
| AD-31 | 153 |
| AD-18 | 154–155 |
| AD-20 | 157–158 |
| AD-21 | 160–161 |
| AD-24 | 163–164 |
| AD-97 | 166–167 |
| AD-19 | 169–170 |
| AD-26 | 172–173 |
| AD-29 | 175 |
| AD-98 | 176 |
| AD-32 | 177 |
| AD-33 | 179 |
| AD-34 | 180 |
| AD-35 | 181 |
| AD-107 | 331–332 |
| excluded: record-row data or wrapper | 336–337, 340–343 |
| AD-108 | 344–345 |
| AD-110 | 356–357 |
| AD-111 | 483 |
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

514 source items; 85 inventory IDs represented by source entries; 377 excluded items. Image-only controls supplement these counts.

#### m3c-card-deals

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82, 86, 106, 178, 372–374, 384–385 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 109, 115, 117, 126, 134, 137, 140, 147, 156, 159, 162, 165, 168, 171, 174, 195, 201, 203, 208, 210, 216, 238, 243, 249, 254, 258, 262, 270, 276, 280, 291, 296, 300, 304, 317, 322, 325–326, 342–345, 349, 371, 382–383, 407–408, 414, 416, 419, 423–424, 427–428, 434–436, 440, 443, 447–448, 451–452, 461–463, 511–514, 523–540, 553 |
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
| SH-14 | 40–41, 360 |
| SH-15 | 42–43, 83 |
| SH-16 | 44–45, 354 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| excluded: outside or covered by captured content boundary | 65–80, 182–194, 196–200, 202, 204–207, 209, 211–215, 217–237, 239–242, 244–248, 250–253, 255–257, 259–261, 263–269, 271–275, 277–279, 281–290, 292–295, 297–299, 301–303, 305–316, 318–321, 323–324, 327–341, 346–348, 350–353, 438, 442, 444–446, 449–450, 453–460, 464–510, 515–521, 541 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| AD-01 | 107–108 |
| AD-02 | 110–111 |
| excluded: static label, value or structural text | 112, 127, 355, 361, 375, 396–399, 409–411, 421–422, 425–426, 429, 432–433, 437, 439, 441 |
| AD-99 | 113–114 |
| AD-04 | 116 |
| AD-05 | 118–119 |
| AD-06 | 120–121 |
| AD-07 | 122–123 |
| AD-08 | 124 |
| AD-09 | 125 |
| AD-105 | 128 |
| AD-10 | 129–130 |
| AD-101 | 131 |
| AD-11 | 132–133 |
| AD-12 | 135–136 |
| AD-14 | 138–139 |
| AD-112 | 141 |
| AD-96 | 142–143 |
| AD-102 | 144 |
| AD-23 | 145–146 |
| AD-15 | 148–149 |
| AD-30 | 150 |
| AD-16 | 151–152 |
| AD-31 | 153 |
| AD-18 | 154–155 |
| AD-20 | 157–158 |
| AD-21 | 160–161 |
| AD-24 | 163–164 |
| AD-97 | 166–167 |
| AD-19 | 169–170 |
| AD-26 | 172–173 |
| AD-29 | 175 |
| AD-98 | 176 |
| AD-32 | 177 |
| AD-33 | 179 |
| AD-34 | 180 |
| AD-35 | 181 |
| AD-113 | 356–357 |
| AD-114 | 358–359 |
| AD-115 | 362 |
| AD-116 | 363–364 |
| AD-117 | 365–366 |
| AD-118 | 367–368 |
| AD-119 | 369 |
| AD-120 | 370 |
| AD-121 | 376 |
| AD-122 | 377 |
| AD-123 | 378 |
| AD-124 | 379 |
| AD-125 | 380 |
| AD-126 | 381 |
| excluded: record-row data or wrapper | 386–387, 390, 392–395, 430–431 |
| AD-127 | 388–389 |
| AD-128 | 391 |
| AD-131 | 400–401 |
| AD-132 | 402 |
| AD-133 | 403 |
| AD-134 | 404 |
| AD-130 | 405–406 |
| AD-135 | 412–413 |
| AD-136 | 415 |
| AD-137 | 417–418 |
| AD-138 | 420 |
| AD-111 | 522 |
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

553 source items; 107 inventory IDs represented by source entries; 386 excluded items. Image-only controls supplement these counts.

#### m3c-card-closed-activities

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82, 86, 106, 177 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 109, 115, 117, 126, 134, 137, 140, 146, 155, 158, 161, 164, 167, 170, 173, 194, 200, 202, 207, 209, 215, 237, 242, 248, 253, 257, 261, 269, 275, 279, 290, 295, 299, 303, 316, 321, 324–325, 341–344, 348, 370, 381–382, 406–407, 413, 415, 418, 422–423, 426–427, 433–435, 439, 442, 446–447, 450–451, 460–462, 502–505, 514–531, 544 |
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
| SH-15 | 42–43, 83 |
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
| excluded: outside or covered by captured content boundary | 65–80, 181–193, 195–199, 201, 203–206, 208, 210–214, 216–236, 238–241, 243–247, 249–252, 254–256, 258–260, 262–268, 270–274, 276–278, 280–289, 291–294, 296–298, 300–302, 304–315, 317–320, 322–323, 326–340, 345–347, 349–369, 371–380, 383–405, 408–412, 414, 416–417, 419–421, 424–425, 428–432, 480–501, 506–512, 532 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| AD-01 | 107–108 |
| AD-02 | 110–111 |
| excluded: static label, value or structural text | 112, 127, 436–437, 444–445, 448–449, 452–453, 456–459, 463–464, 467–468, 473–474, 479 |
| AD-99 | 113–114 |
| AD-04 | 116 |
| AD-05 | 118–119 |
| AD-06 | 120–121 |
| AD-07 | 122–123 |
| AD-08 | 124 |
| AD-09 | 125 |
| AD-105 | 128 |
| AD-10 | 129–130 |
| AD-101 | 131 |
| AD-11 | 132–133 |
| AD-12 | 135–136 |
| AD-14 | 138–139 |
| AD-96 | 141–142 |
| AD-102 | 143 |
| AD-23 | 144–145 |
| AD-15 | 147–148 |
| AD-30 | 149 |
| AD-16 | 150–151 |
| AD-31 | 152 |
| AD-18 | 153–154 |
| AD-20 | 156–157 |
| AD-21 | 159–160 |
| AD-24 | 162–163 |
| AD-97 | 165–166 |
| AD-19 | 168–169 |
| AD-26 | 171–172 |
| AD-29 | 174 |
| AD-98 | 175 |
| AD-32 | 176 |
| AD-33 | 178 |
| AD-34 | 179 |
| AD-35 | 180 |
| AD-141 | 438 |
| AD-142 | 440–441 |
| AD-143 | 443 |
| excluded: record-row data or wrapper | 454–455 |
| AD-146 | 465–466 |
| AD-147 | 469–470 |
| AD-148 | 471–472 |
| AD-149 | 475–476 |
| AD-150 | 477–478 |
| AD-111 | 513 |
| SH-35 | 533 |
| SH-36 | 534 |
| SH-37 | 535 |
| SH-38 | 536 |
| SH-39 | 537 |
| SH-40 | 538 |
| SH-41 | 539 |
| SH-42 | 540 |
| SH-43 | 541 |
| SH-44 | 542 |
| SH-45 | 543 |

544 source items; 89 inventory IDs represented by source entries; 401 excluded items. Image-only controls supplement these counts.

#### m3c-card-sales-orders

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82, 86, 106, 178 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 109, 115, 117, 126, 134, 137, 140, 146, 155, 158, 161, 165, 168, 171, 174, 195, 201, 203, 208, 210, 216, 238, 243, 249, 254, 258, 262, 270, 276, 280, 291, 296, 300, 304, 317, 322, 325–326, 342–345, 349, 371, 382–383, 407–408, 414, 416, 419, 424, 427, 468–471, 480–497, 510 |
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
| SH-15 | 42–43, 83 |
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
| excluded: outside or covered by captured content boundary | 65–80, 182–194, 196–200, 202, 204–207, 209, 211–215, 217–237, 239–242, 244–248, 250–253, 255–257, 259–261, 263–269, 271–275, 277–279, 281–290, 292–295, 297–299, 301–303, 305–316, 318–321, 323–324, 327–341, 346–348, 350–370, 372–381, 384–406, 409–413, 415, 417–418, 420–423, 425–426, 428–438, 472–478, 498 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| AD-01 | 107–108 |
| AD-02 | 110–111 |
| excluded: static label, value or structural text | 112, 127, 439–440, 445–446, 451–452, 455–456, 461–463 |
| AD-99 | 113–114 |
| AD-04 | 116 |
| AD-05 | 118–119 |
| AD-06 | 120–121 |
| AD-07 | 122–123 |
| AD-08 | 124 |
| AD-09 | 125 |
| AD-105 | 128 |
| AD-10 | 129–130 |
| AD-101 | 131 |
| AD-11 | 132–133 |
| AD-12 | 135–136 |
| AD-14 | 138–139 |
| AD-96 | 141–142 |
| AD-102 | 143 |
| AD-23 | 144–145 |
| AD-15 | 147–148 |
| AD-30 | 149 |
| AD-16 | 150–151 |
| AD-31 | 152 |
| AD-18 | 153–154 |
| AD-20 | 156–157 |
| AD-21 | 159–160 |
| AD-151 | 162 |
| AD-24 | 163–164 |
| AD-97 | 166–167 |
| AD-19 | 169–170 |
| AD-26 | 172–173 |
| AD-29 | 175 |
| AD-98 | 176 |
| AD-32 | 177 |
| AD-33 | 179 |
| AD-34 | 180 |
| AD-35 | 181 |
| AD-149 | 441–442 |
| AD-150 | 443–444 |
| AD-152 | 447–448 |
| AD-153 | 449–450 |
| AD-154 | 453–454 |
| AD-155 | 457–458 |
| AD-156 | 459–460 |
| AD-157 | 464–465 |
| AD-158 | 466–467 |
| AD-111 | 479 |
| SH-35 | 499 |
| SH-36 | 500 |
| SH-37 | 501 |
| SH-38 | 502 |
| SH-39 | 503 |
| SH-40 | 504 |
| SH-41 | 505 |
| SH-42 | 506 |
| SH-43 | 507 |
| SH-44 | 508 |
| SH-45 | 509 |

510 source items; 91 inventory IDs represented by source entries; 362 excluded items. Image-only controls supplement these counts.

#### m3c-list-end

The source array has 601 entries. Entries 1–588 retain the m3c-list-base inventory/exclusion mapping above (only a Sort wrapper accessibility attribute differs; no painted control change). Entry 589 is the duplicate utility wrapper; 590–600 map in order to SH-35–SH-45; 601 is an invisible zero-height chat wrapper. This accounts for every closing source entry: 92 source-backed inventory IDs and 413 excluded items. Image-only AL-62 and SH-46 remain covered by the shared references; source-backed AL-46 covers the note bubbles. No incidental row three-dots control is painted.

### Open questions — lower-detail continuation

1. Billing/shipping read-only display, Description and lower Account Information fields remain unobserved; there is no established named safe section jump. Shared address form controls do not establish their detail display.
2. The record-page customization footer and lower Social guidance remain below the last viewport. Their labels/actions must not be inferred from Contacts or offscreen DOM. Social did not receive an extra capture because its title and upper controls were already fully visible, as required by the capture rule.
3. Populated Deals/Member Accounts columns, counters and row ends, Contacts empty state, Notes empty state and any hover-only row/field/rail controls remain unobserved. No additional record was opened.
4. Open/Closed Calls columns and counters remain outside the horizontal activity viewport. No horizontal scroll or activity preference action was used.
5. Connected Records ownership (`?`) and shared-shell ownership questions remain inherited from Contacts. UI Lead should confirm the M11 assignment for Contacts table customization and Organize Accounts Details.
6. Hierarchy View is visible on the Contacts relationship card, but was not activated because card upper buttons are outside permitted clicks. It does not establish the Accounts parent/member hierarchy screen. More Options and Timeline are now observed in the m3m continuation above; hierarchy activation remains outside the permitted clicks.

### Shell controls missing from app-shell.md — lower-detail continuation

None newly observed. All six resumed images reuse SH-01–SH-46. Organize Accounts Details and selected-row plus controls belong to the record rail, not the shared app shell.

## Longer-wait continuation — source reconciliation

The five m3m screenshots were opened as images. Ordinals identify local evidence items only, never selectors. Existing approved mappings are reused when the source structure matches; changed, invisible and static-data entries are assigned explicitly. Image-only AD-37 and SH-46 supplement the DOM counts. The Contacts summary reuses AD-103–AD-104; no new number is allocated for the same control.

#### m3m-list-base

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82–83, 87, 111, 120, 136, 141, 155, 255, 259–264, 273 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 135, 139, 252–253, 257–258, 561–569, 574–585, 587–588, 601 |
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
| excluded: invisible below clipped panel/table boundary | 65–80, 172–251, 418–419, 421, 424, 427–560, 589 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| AL-01 | 112 |
| AL-52 | 113 |
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
| excluded: invisible refresh footprint; no painted icon in base | 129–130 |
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
| AL-53 | 158–159 |
| AL-54 | 160–161 |
| AL-55 | 162–163 |
| AL-56 | 164–165 |
| AL-57 | 166–167 |
| AL-58 | 168–169 |
| AL-59 | 170–171 |
| excluded: invisible resize hotspot; no painted grip | 254 |
| AL-33 | 256 |
| AL-34 | 265–266 |
| AL-35 | 267 |
| AL-36 | 268–269 |
| AL-39 | 270 |
| AL-60 | 271 |
| AL-61 | 272 |
| excluded: record row data or row wrapper | 274–276, 278, 281, 283–284, 286–290, 293, 295–296, 298–301, 303, 306, 308–309, 311–314, 316, 319, 321–322, 324–327, 329, 332, 334–339, 341, 344, 346–347, 349–352, 354, 357, 359–360, 362–365, 367, 370, 372–373, 375–378, 380, 383, 385–386, 388–392, 395, 397–398, 400–403, 405, 408, 410–411, 413–417, 420, 422–423, 425–426 |
| AL-46 | 277, 302, 315, 328, 340, 353, 366, 379, 404 |
| AL-40 | 279–280, 291–292, 304–305, 317–318, 330–331, 342–343, 355–356, 368–369, 381–382, 393–394, 406–407 |
| AL-42 | 282, 294, 307, 320, 333, 345, 358, 371, 384, 396, 409 |
| AL-63 | 285, 297, 310, 323, 348, 361, 374, 387, 399, 412 |
| AL-48 | 570 |
| AL-49 | 571 |
| AL-50 | 572 |
| AL-51 | 573 |
| excluded: zero-area/invisible element | 586 |
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

601 source items; 92 inventory IDs represented by source entries; 413 excluded items (invisible/offscreen, duplicate wrappers, static record/field/event data).

#### m3m-detail-base

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82, 86, 106, 176, 180–181, 215, 218, 221 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 109, 115, 117, 126, 133, 136, 139, 145, 154, 157, 160, 163, 166, 169, 172, 193, 199, 201, 206, 208, 214, 236, 241, 247, 252, 256, 260, 268, 274, 278, 289, 294, 298, 302, 315, 320, 323–324, 340–343, 347, 369, 380–381, 405–406, 412, 414, 417, 422, 425, 466–469, 477–496 |
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
| SH-15 | 42–43, 83 |
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
| excluded: outside or covered by captured content boundary | 65–80, 231–235, 237–240, 242–246, 248–251, 253–255, 257–259, 261–264, 273, 275–277, 279–288, 290–293, 295–297, 299–301, 303–314, 316–319, 321–322, 325–339, 344–346, 348–368, 370–379, 382–404, 407–411, 413, 415–416, 418–421, 423–424, 426–465, 470–476, 497 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| AD-01 | 107–108 |
| AD-02 | 110–111 |
| excluded: static label, value or structural text | 112, 127, 182–192, 194–198, 200, 202–205, 207, 209–213, 222–230, 265–267, 269–272 |
| AD-99 | 113–114 |
| AD-04 | 116 |
| AD-05 | 118–119 |
| AD-06 | 120–121 |
| AD-07 | 122–123 |
| AD-08 | 124 |
| AD-09 | 125 |
| AD-10 | 128–129 |
| AD-101 | 130 |
| AD-11 | 131–132 |
| AD-12 | 134–135 |
| AD-14 | 137–138 |
| AD-96 | 140–141 |
| AD-102 | 142 |
| AD-23 | 143–144 |
| AD-15 | 146–147 |
| AD-30 | 148 |
| AD-16 | 149–150 |
| AD-31 | 151 |
| AD-18 | 152–153 |
| AD-20 | 155–156 |
| AD-21 | 158–159 |
| AD-24 | 161–162 |
| AD-97 | 164–165 |
| AD-19 | 167–168 |
| AD-26 | 170–171 |
| AD-29 | 173 |
| AD-98 | 174 |
| AD-32 | 175 |
| AD-33 | 177 |
| AD-34 | 178 |
| AD-35 | 179 |
| AD-103 | 216 |
| AD-104 | 217 |
| AD-38 | 219–220 |
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

508 source items; 82 inventory IDs represented by source entries; 377 excluded items (invisible/offscreen, duplicate wrappers, static record/field/event data).

#### m3m-detail-more

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82, 86, 106, 176, 180–181, 215, 218, 221 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 109, 115, 117, 126, 133, 136, 139, 145, 154, 157, 160, 163, 166, 169, 172, 193, 199, 201, 206, 208, 214, 236, 241, 247, 252, 256, 260, 268, 274, 278, 289, 294, 298, 302, 315, 320, 323–324, 340–343, 347, 371, 382–383, 407–408, 474–477, 485–500, 502–503 |
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
| SH-15 | 42–43, 83 |
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
| excluded: outside or covered by captured content boundary | 65–80, 231–235, 237–240, 242–246, 248–251, 253–255, 257–259, 261–264, 273, 275–277, 279–288, 290–293, 295–297, 299–301, 303–314, 316–319, 321–322, 325–339, 344–346, 348–353, 360–370, 372–381, 384–406, 409–410, 420–421, 427–432, 439–440, 447–448, 455–460, 467–473, 478–484, 504 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| AD-01 | 107–108 |
| AD-02 | 110–111 |
| excluded: static label, value or structural text | 112, 127, 182–192, 194–198, 200, 202–205, 207, 209–213, 222–230, 265–267, 269–272 |
| AD-99 | 113–114 |
| AD-04 | 116 |
| AD-05 | 118–119 |
| AD-06 | 120–121 |
| AD-07 | 122–123 |
| AD-08 | 124 |
| AD-09 | 125 |
| AD-10 | 128–129 |
| AD-101 | 130 |
| AD-11 | 131–132 |
| AD-12 | 134–135 |
| AD-14 | 137–138 |
| AD-96 | 140–141 |
| AD-102 | 142 |
| AD-23 | 143–144 |
| AD-15 | 146–147 |
| AD-30 | 148 |
| AD-16 | 149–150 |
| AD-31 | 151 |
| AD-18 | 152–153 |
| AD-20 | 155–156 |
| AD-21 | 158–159 |
| AD-24 | 161–162 |
| AD-97 | 164–165 |
| AD-19 | 167–168 |
| AD-26 | 170–171 |
| AD-29 | 173 |
| AD-98 | 174 |
| AD-32 | 175 |
| AD-33 | 177 |
| AD-34 | 178 |
| AD-35 | 179 |
| AD-103 | 216 |
| AD-104 | 217 |
| AD-38 | 219–220 |
| excluded: outside captured content viewport | 354–359, 411–413, 415, 417–418, 422, 424–425, 433–438, 441–446, 449–454, 461–466 |
| excluded: zero-area/invisible element | 414, 416, 419, 423, 426, 501, 516 |
| SH-35 | 505 |
| SH-36 | 506 |
| SH-37 | 507 |
| SH-38 | 508 |
| SH-39 | 509 |
| SH-40 | 510 |
| SH-41 | 511 |
| SH-42 | 512 |
| SH-43 | 513 |
| SH-44 | 514 |
| SH-45 | 515 |
| AD-07.1 | 517 |
| AD-07.2 | 518 |
| AD-07.3 | 519 |
| AD-07.4 | 520 |
| AD-07.5 | 521 |
| AD-07.6 | 522 |
| AD-07.7 | 523 |
| AD-07.8 | 524 |
| AD-07.9 | 525 |
| AD-07.10 | 526 |
| AD-07.11 | 527 |
| AD-07.12 | 528 |
| AD-07.13 | 529 |

529 source items; 95 inventory IDs represented by source entries; 385 excluded items (invisible/offscreen, duplicate wrappers, static record/field/event data).

#### m3m-detail-timeline

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82, 86, 106, 176 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 109, 115, 117, 126, 133, 136, 139, 145, 154, 157, 160, 163, 166, 169, 172 |
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
| SH-15 | 42–43, 83 |
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
| excluded: outside or covered by captured content boundary | 65–80, 244 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| AD-01 | 107–108 |
| AD-02 | 110–111 |
| excluded: static label, value or structural text | 112, 127 |
| AD-99 | 113–114 |
| AD-04 | 116 |
| AD-05 | 118–119 |
| AD-06 | 120–121 |
| AD-07 | 122–123 |
| AD-08 | 124 |
| AD-09 | 125 |
| AD-10 | 128–129 |
| AD-101 | 130 |
| AD-11 | 131–132 |
| AD-12 | 134–135 |
| AD-14 | 137–138 |
| AD-96 | 140–141 |
| AD-102 | 142 |
| AD-23 | 143–144 |
| AD-15 | 146–147 |
| AD-30 | 148 |
| AD-16 | 149–150 |
| AD-31 | 151 |
| AD-18 | 152–153 |
| AD-20 | 155–156 |
| AD-21 | 158–159 |
| AD-24 | 161–162 |
| AD-97 | 164–165 |
| AD-19 | 167–168 |
| AD-26 | 170–171 |
| AD-29 | 173 |
| AD-98 | 174 |
| AD-32 | 175 |
| AD-33 | 177 |
| AD-34 | 178 |
| AD-35 | 179 |
| excluded: static event/date/icon or duplicate structural wrapper | 180, 182–183, 185, 187, 189–191, 193–198, 200–202 |
| excluded: zero-area/invisible element | 181, 208, 217, 221–243 |
| AD-159 | 184 |
| AD-160 | 186 |
| AD-161 | 188 |
| AD-162 | 192, 199, 203 |
| excluded: outside captured content viewport | 204–207, 209–216, 218–220 |
| SH-35 | 245 |
| SH-36 | 246 |
| SH-37 | 247 |
| SH-38 | 248 |
| SH-39 | 249 |
| SH-40 | 250 |
| SH-41 | 251 |
| SH-42 | 252 |
| SH-43 | 253 |
| SH-44 | 254 |
| SH-45 | 255 |

255 source items; 83 inventory IDs represented by source entries; 122 excluded items (invisible/offscreen, duplicate wrappers, static record/field/event data).

#### m3m-list-after

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82–83, 87, 111, 120, 136, 141, 155, 255, 259–264, 273 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 135, 139, 252–253, 257–258, 561–569, 574–587, 601 |
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
| excluded: invisible below clipped panel/table boundary | 65–80, 172–251, 418–419, 421, 424, 427–560, 589 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| AL-01 | 112 |
| AL-52 | 113 |
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
| excluded: invisible refresh footprint; no painted icon in base | 129–130 |
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
| AL-53 | 158–159 |
| AL-54 | 160–161 |
| AL-55 | 162–163 |
| AL-56 | 164–165 |
| AL-57 | 166–167 |
| AL-58 | 168–169 |
| AL-59 | 170–171 |
| excluded: invisible resize hotspot; no painted grip | 254 |
| AL-33 | 256 |
| AL-34 | 265–266 |
| AL-35 | 267 |
| AL-36 | 268–269 |
| AL-39 | 270 |
| AL-60 | 271 |
| AL-61 | 272 |
| excluded: record row data or row wrapper | 274–276, 278, 281, 283–284, 286–290, 293, 295–296, 298–301, 303, 306, 308–309, 311–314, 316, 319, 321–322, 324–327, 329, 332, 334–339, 341, 344, 346–347, 349–352, 354, 357, 359–360, 362–365, 367, 370, 372–373, 375–378, 380, 383, 385–386, 388–392, 395, 397–398, 400–403, 405, 408, 410–411, 413–417, 420, 422–423, 425–426 |
| AL-46 | 277, 302, 315, 328, 340, 353, 366, 379, 404 |
| AL-40 | 279–280, 291–292, 304–305, 317–318, 330–331, 342–343, 355–356, 368–369, 381–382, 393–394, 406–407 |
| AL-42 | 282, 294, 307, 320, 333, 345, 358, 371, 384, 396, 409 |
| AL-63 | 285, 297, 310, 323, 348, 361, 374, 387, 399, 412 |
| AL-48 | 570 |
| AL-49 | 571 |
| AL-50 | 572 |
| AL-51 | 573 |
| excluded: zero-area/invisible element | 588 |
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

601 source items; 92 inventory IDs represented by source entries; 413 excluded items (invisible/offscreen, duplicate wrappers, static record/field/event data).
