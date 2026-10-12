# Accounts — record detail

Status: partial research; lower-detail continuation stopped for an unexpected non-GET path. Observed upper-detail inventory, with explicitly recorded capture gaps. The earlier safety-count gate was resolved by the CTO in MEP-330. More Options and Timeline attempts were skipped because their selectors matched no element while the list was loading; hierarchy opening was not attempted. These unobserved states are not implementation evidence.

## Purpose

Describe the observed upper Accounts record detail and differences from [contacts-record-detail.md](contacts-record-detail.md) and [record-detail.md](record-detail.md). Reuse [accounts.md](accounts.md) for fields and exported configuration. The lower-detail continuation and its safety stop are recorded below; card interiors and lower display remain unobserved. No record value is reproduced.

## Layout

The shared shell surrounds a back arrow, building portrait placeholder, account identity and Website link. Add Tags sits below the identity. Send Email, Edit, More Options and previous/next arrows occupy the right header group. The Related List rail includes a separate Links group. Overview/Timeline and the Last Update indicator share the tab row.

Overview contains a five-field business card: Account Owner, Industry, Employees, Annual Revenue and Phone. Empty visible values use a dash. Phone has a call icon. The expanded details card starts with Hide Details and Account Information. The visible left column shows Account Owner, Account Name, Account Site, Parent Account and partly clipped Account Number. The right column shows Rating, Phone, Fax and Website. Phone has a call icon and Website is a link. Lower fields and sections are not observed; their presence in offscreen DOM is not screen evidence.

## Control inventory

Stable AD numbers retain corresponding D suffixes where practical. Shared controls use the cited Contacts number, with `moved` when their position differs. `same` inherits the Contacts observation limits; it does not establish activation here. More Options and Timeline were attempted but both clicks in each capture were skipped, so their behaviour remains explicitly unobserved in Accounts. Static field labels/values are described above rather than treated as controls. Screenshot-only call icons are inventoried.

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
| AD-07 | Header | More Options / three dots | icon button | right actions, third | not observed; menu click skipped | seen (m3d-detail-main) | M3 | D-07 |
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
| AD-34 | Tab row | Timeline | tab | second tab | not observed; Timeline click skipped | seen (m3d-detail-main) | M3 | D-34 |
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

## More Options and Timeline

More Options (AD-07) is visible in the detail baseline. In m3d-detail-more the source-verified record link and More Options selector both matched zero elements and were skipped. Only the shell and blank main area were captured. No Accounts menu rows were observed; added, removed or reordered rows relative to Contacts D-07.1–D-07.15 remain unknown. No menu row was selected, and no alternate selector or retry was used. Contacts' fifteen rows must not be asserted as an Accounts inventory.

Timeline (AD-34) is visible beside Overview in the baseline. In m3d-detail-timeline the same record link and the source-verified Timeline selector both matched zero elements and were skipped. The image shows the shell and loading state. Accounts History/Interactions content, filters and differences from Contacts D-42–D-51 remain not observed. The filter panel was not reopened.

## Account hierarchy

Parent Account is the fourth visible left-column Account Information field. It displays an empty dash in this record, with no link or named hierarchy-view action painted beside it. No named hierarchy-opening control is painted in the captured upper header/field area. The source inventory does contain a named Hierarchy View button outside the screenshot viewport, without a stable attribute selector. Its location and safe opening behaviour could not be confirmed from the upper image. Under the conditional capture rule, m3d-detail-hierarchy was not attempted; hidden/offscreen DOM is not visible-control evidence. Member Accounts is a visible related-list rail entry (AD-97); its card interior belongs to the next task and is not hierarchy-view evidence. No parent or other record link was clicked. Hierarchy levels, row controls and populated-parent presentation remain not observed.

## Differences from Contacts record detail

- Website replaces the Account record link in the identity line (AD-99 vs D-03). The placeholder depicts a building; no source image asset is copied.
- Business-card field order is Account Owner, Industry, Employees, Annual Revenue, Phone. Phone moves from the Contacts third field to the fifth; the other Accounts business fields replace Contacts Email, Mobile and Department.
- Account Information replaces Contact Information. Its visible field arrangement is described in Layout. Parent Account is visible here, but empty. Website is linked in the right column (AD-100); no email link is painted.
- Contacts and Member Accounts are additional rail entries; Add Link follows the Links heading. Notes and Contacts have visible count badges (AD-101–AD-102). Badge values are not reproduced.
- The shortened rail lacks Cadences, Invited Meetings, Purchase Orders, Campaigns, Reporting Contacts and Voice of the Customer. Several shared entries move; see inventory positions.
- Header action labels and order match Contacts. More Options content and Timeline differences remain unobserved after skipped capture attempts.

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
| Parent Account / Member Accounts | M3 | Accounts-specific | empty parent display and rail entry; hierarchy not opened |
| Related-list rail / activity badges | Mixed as inventoried | Reused from Contacts, with moved entries | links not activated |
| Contacts rail and Notes/Contacts badges | M2 / M6 | Accounts-specific relative to Contacts detail | AD-96 / AD-101–AD-102 |
| Links / Add Link | M11 | Accounts-specific observed addition | AD-98; not activated |
| Phone call controls | M5 | Reused from Contacts, moved | AD-37 / AD-41; image-only, not activated |
| Rail visibility / Hide Details / Add Related List | M3 / M11 | Reused from Contacts | persisted-preference controls not activated |
| More Options rows | Mixed, not determined for Accounts | Comparison pending | not observed; both capture clicks skipped |
| Timeline content | M3 | Comparison pending | not observed; both capture clicks skipped |

## Capture refs

| Slug | Clicks | Skipped | What it shows |
| --- | --- | --- | --- |
| m3d-list-base | 0 | 0 | Populated opening list |
| m3d-detail-main | 1 | 0 | Header, rail, business card, upper Account Information |
| m3d-detail-more | 2 requested, 0 executed | 2 | Blank main area; intended menu not opened |
| m3d-detail-timeline | 2 requested, 0 executed | 2 | Loading main area; intended tab not opened |
| m3d-list-after | 0 | 0 | Renewed closing list, same total as opening |

m3d-detail-more and m3d-detail-timeline are evidence of loading/blank states only, not their intended opened states. m3d-detail-hierarchy was not attempted for the conditional reason recorded above and is not an evidence slug. All five successful screenshots were opened as images and inspected. Opening and the renewed closing totals are equal (373); no record selection is painted. The original record selector was reused and matched exactly one entry in m3d-list-base offline. More Options and Timeline selectors each matched exactly one expected entry in m3d-detail-main offline, but neither matched at capture time. No alternative selector or open/toggle override was used.

Safety: the baseline detail has three Accounts bulk readings (statuses 200, 204, 200), now within the aggregate bound of three approved by the CTO in MEP-330. Its two related readings carry the approved related-record query signatures. The historical stop was correct under the earlier bound and was resolved before this continuation. No successful record write is observed. The new More Options and Timeline attempts have only one list bulk reading each and no new non-GET path. More Options has one blocked telemetry call; Timeline has no blocked requests. The renewed closing list has one occurrence of each expected list-reading path and shell trigger, two blocked background polls and seven blocked telemetry calls. Its total remains 373. No fourth detail bulk call or unexpected non-GET path was observed.

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

1. More Options rows and Timeline differences remain unobserved: both attempts skipped their record and opening clicks while the list was loading. The earlier third-bulk safety question is resolved by MEP-330. A reviewer should decide whether a separately authorized continuation is required for these gaps; the analyst did not retry skipped clicks.
2. No named hierarchy-opening control was painted in the upper capture. An offscreen Hierarchy View source entry lacks a stable attribute selector; its safe activation was not established, so the conditional capture was omitted. Populated Parent Account display and hierarchy levels/row controls remain unknown; no alternate record was inspected.
3. Why are Checklists and Locking Information absent from the painted rail despite visible metadata flags? No hidden rail control or persistent preference was exercised.
4. Field pencils, portrait hover controls and selected-rail plus actions were not observed. Their existence/activation must not be inferred from Contacts or hidden DOM.
5. Previous/next ordering and boundaries, back navigation, Website links, and all write outcomes remain not observed. Lower details and related-card interiors remain unobserved after the continuation safety stop recorded below.
6. Connected Records ownership (?) and shared-shell ownership gaps remain inherited open questions from Contacts. No additional shell control was found. Add Link is assigned M11 as a record-page customization action; UI Lead should confirm this assignment.

### Shell controls missing from app-shell.md

No new shared-shell control was found beyond SH-01–SH-46 already inventoried in Contacts. The extra Links group belongs to the record rail.

## Lower-detail research safety stop

The MEP-328 continuation stopped after m3c-detail-base. A successful `POST /murphy/:id/clientmetricslog` appeared once (200) outside the task's permitted non-GET set. It was not added to the baseline allowance: this was a clicked capture. The existing capture tool's network guard remained in place. No card, persistent preference, write action, or alternate selector was activated. No successful Accounts record write is observed; the unexpected metrics path still requires a CTO safety decision before further captures.

The source-verified record link matched exactly one entry in m3c-list-base, and the tool reports one requested click with no skipped click. Nevertheless, the resulting screenshot still paints the Accounts list, with a highlighted row and its three-dots control; no detail header or rail is painted. This capture does not establish successful detail navigation. All planned card and lower-section captures were therefore omitted under the stop rule. The final permitted unclicked capture succeeded technically but paints a loading skeleton; it has no visible record total. Opening total is 373; closing equality is **not verified**. No retry or workaround was attempted.

### Control inventory — m3c-list-base

Shell: SH-01–SH-46 as in contacts.md; Accounts is active. No additional shell control is painted.

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No changed visible controls relative to m3-list-base in accounts.md, except the incidental row three-dots action is absent. The record link used is AL-42. No related-record column is painted, so list evidence could not identify a populated related-card candidate.

Rest: as in m3-list-base in accounts.md; covered by the overlay: none. Absent here: AL-45.

### Control inventory — m3c-detail-base

Shell: SH-01–SH-46 as in contacts.md; Accounts is active. This is a list screenshot despite the intended detail capture.

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AL-45 | Table | Row three dots icon | icon button | highlighted row, first control | same | seen (m3c-detail-base) | M3 | L-45 |

AL-45 reuses the existing Accounts list inventory number; no new AD number is allocated to a list control. Row links and Phone call icons remain AL-42, AL-63 and AL-46 as in accounts.md. The screenshot shows no record-detail controls.

Rest: as in m3c-list-base; covered by the overlay: none. All AD controls from m3d-detail-main are absent because the detail did not paint; this is not evidence of their unavailability.

### Control inventory — m3c-list-after

Shell: no interactive SH control is painted; only loading placeholders.

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

No visible interactive control. The central Loading illustration and shell skeleton are static. No list, footer, utility strip, record total or AD control is painted.

Rest: m3c-list-base structure did not finish painting; covered by the overlay: none. All painted AL/SH controls of the opening list are absent in this loading image.

## Related-list cards

Order below comes from the previously observed m3d-detail-main rail, not a new card observation. Every card interior remains **not observed in Accounts** after the safety stop. Contacts references are comparison destinations only; they do not establish Accounts counters, controls, columns or empty states. No record-row data is reproduced.

| Order | Card title | Module | Counter | Upper controls | Column headers | Empty state | Contacts ref | Source |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Notes | M6 | not observed | not observed | not observed | not observed | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Notes | Rail only: m3d-detail-main; card capture omitted |
| 2 | Connected Records | ? | not observed | not observed | not observed | not observed | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Connected Records | Rail only: m3d-detail-main; card capture omitted |
| 3 | Attachments | M6 | not observed | not observed | not observed | not observed | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Attachments | Rail only: m3d-detail-main; card capture omitted |
| 4 | Deals | M4 | not observed | not observed | not observed | not observed | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Deals; Accounts-specific relationship to inspect in depth | Rail only: m3d-detail-main; card capture omitted |
| 5 | Contacts | M2 | not observed | not observed | not observed | not observed | new: absent from Contacts detail | Rail only: m3d-detail-main; card capture omitted |
| 6 | Emails | M10 | not observed | not observed | not observed | not observed | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Emails | Rail only: m3d-detail-main; card capture omitted |
| 7 | Open Activities | M5 | not observed | not observed | not observed | not observed | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Open Activities | Rail only: m3d-detail-main; card capture omitted |
| 8 | Closed Activities | M5 | not observed | not observed | not observed | not observed | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Closed Activities | Rail only: m3d-detail-main; card capture omitted |
| 9 | Products | P2 | not observed | not observed | not observed | not observed | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Products | Rail only: m3d-detail-main; card capture omitted |
| 10 | Quotes | P2 | not observed | not observed | not observed | not observed | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Quotes | Rail only: m3d-detail-main; card capture omitted |
| 11 | Sales Orders | P2 | not observed | not observed | not observed | not observed | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Sales Orders | Rail only: m3d-detail-main; card capture omitted |
| 12 | Invoices | P2 | not observed | not observed | not observed | not observed | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Invoices | Rail only: m3d-detail-main; card capture omitted |
| 13 | Member Accounts | M3 | not observed | not observed | not observed | not observed | new: absent from Contacts detail | Rail only: m3d-detail-main; card capture omitted |
| 14 | Cases | M8 | not observed | not observed | not observed | not observed | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Cases | Rail only: m3d-detail-main; card capture omitted |
| 15 | Social | M15 | not observed | not observed | not observed | not observed | [contacts-record-detail.md](contacts-record-detail.md#related-list-cards) › Social | Rail only: m3d-detail-main; card capture omitted |

Contacts, Deals and Member Accounts must receive the full title/counter/button/column/empty-state and visible row-end inventory in an authorized continuation. Even though Deals exists in Contacts, its Accounts relationship is not treated as already researched. Notes and Connected Records also retain Contacts' observation gaps rather than inferred settled content.

## Record-page footer and edges

The new captures did not paint the Accounts record page. Billing/shipping display, Description, lower detail groups, record-page footer and floating record controls remain not observed. No named safe section-jump control could be established from m3c-detail-base, because it remained a list. Address form components remain defined by contacts-form.md F-33–F-52 and MEP-315; no display parity is claimed here. Contacts' footer D-93–D-95 and Scroll To Top D-63 are comparison references only, not Accounts observations. The full right edge and utility-strip corners were visually checked in each available image; no additional shell control was found.

### Differences and capability additions

- No newly observed Accounts-specific card control (`new` inventory row) was found in this continuation. Existing AD numbers remain unchanged.
- Related-card rendering, card actions, billing/shipping display, Description and record-page footer: M3 / related modules as assigned above; evidence remains not observed.
- The clicked source link did not produce a painted detail page. The loading closing capture cannot establish count stability.

### Capture refs — lower-detail continuation

| Slug | Clicks | Skipped | What it shows |
| --- | --- | --- | --- |
| m3c-list-base | 0 | 0 | Opening Accounts list; 373 total; incidental row action absent |
| m3c-detail-base | 1 requested | 0 | Accounts list after intended record opening; incidental three-dots action painted; unexpected successful metrics POST |
| m3c-list-after | 0 | 0 | Loading skeleton only; no total or interactive controls |

All three screenshots were opened as images and inspected across the complete viewport. All m3c-card-* and m3c-section-* captures were omitted because the safety stop occurred before the card sequence. Opening baseline has the four expected successful list/shell POST paths once each, two blocked background polls and one blocked telemetry call. The clicked capture adds the unexpected metrics path once; its four expected list/shell paths remain once each, with two blocked background polls and six blocked telemetry calls. It has no detail-reading POST set. Closing loading capture has one list bulk POST (200) and no blocked requests. No successful record write appears in these logs.

### Reconciliation of controls.json — lower-detail continuation

One-based ordinals are local evidence references, never selectors. The list controls reuse accounts.md AL IDs and contacts.md SH IDs. Source wrappers, row data and offscreen elements are excluded explicitly. Screenshot-only Phone call icons remain AL-46 and the far-right utility icon remains SH-46 in both painted lists; no extra icon is visible in the closing skeleton.

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

#### m3c-detail-base

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: duplicate or structural wrapper; no separate painted control | 1, 37, 51, 59, 62, 82–83, 86, 110, 119, 135, 140, 154, 254, 258–263, 272 |
| SH-01 | 2–4 |
| excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 106–109, 134, 138, 251–252, 256–257, 561–569, 574, 576–586, 588–589 |
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
| excluded: invisible below clipped panel/table boundary | 65–80, 171–250, 418–419, 421, 424, 427–560 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| AL-01 | 111 |
| AL-52 | 112 |
| AL-02 | 113–116 |
| AL-03 | 117 |
| AL-04 | 118 |
| AL-05 | 120 |
| AL-06 | 121 |
| AL-07 | 122 |
| AL-08 | 123 |
| AL-09 | 124 |
| AL-10 | 125 |
| AL-11 | 126–127 |
| excluded: invisible refresh footprint; no painted icon in base | 128–129 |
| AL-12 | 130 |
| AL-13 | 131–132 |
| AL-14 | 133 |
| AL-15 | 136–137 |
| AL-16 | 139 |
| AL-20 | 141–142 |
| AL-21 | 143–144 |
| AL-22 | 145–146 |
| AL-23 | 147–148 |
| AL-24 | 149–150 |
| AL-25 | 151–152 |
| AL-26 | 153 |
| AL-27 | 155–156 |
| AL-53 | 157–158 |
| AL-54 | 159–160 |
| AL-55 | 161–162 |
| AL-56 | 163–164 |
| AL-57 | 165–166 |
| AL-58 | 167–168 |
| AL-59 | 169–170 |
| excluded: invisible resize hotspot; no painted grip | 253 |
| AL-33 | 255 |
| AL-34 | 264–265 |
| AL-35 | 266 |
| AL-36 | 267–268 |
| AL-39 | 269 |
| AL-60 | 270 |
| AL-61 | 271 |
| excluded: record row data or row wrapper | 273–275, 278, 281, 283–284, 286–290, 293, 295–296, 298–301, 303, 306, 308–309, 311–314, 316, 319, 321–322, 324–327, 329, 332, 334–339, 341, 344, 346–347, 349–352, 354, 357, 359–360, 362–365, 367, 370, 372–373, 375–378, 380, 383, 385–386, 388–392, 395, 397–398, 400–403, 405, 408, 410–411, 413–417, 420, 422–423, 425–426 |
| AL-45 | 276 |
| AL-46 | 277, 302, 315, 328, 340, 353, 366, 379, 404 |
| AL-40 | 279–280, 291–292, 304–305, 317–318, 330–331, 342–343, 355–356, 368–369, 381–382, 393–394, 406–407 |
| AL-42 | 282, 294, 307, 320, 333, 345, 358, 371, 384, 396, 409 |
| AL-63 | 285, 297, 310, 323, 348, 361, 374, 387, 399, 412 |
| AL-48 | 570 |
| AL-49 | 571 |
| AL-50 | 572 |
| AL-51 | 573 |
| excluded: invisible loading or zero-area structural element | 575, 587 |
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
| excluded: invisible zero-height chat wrapper | 602 |

602 source items; 93 inventory IDs represented by source entries; 413 excluded items.

#### m3c-list-after

| Inventory number / exclusion reason | controls.json item ordinals |
| --- | --- |
| excluded: structural skeleton navigation wrapper; no painted control | 1 |
| excluded: invisible zero-height notification wrapper | 2 |
| excluded: invisible zero-area message box | 3 |

3 source items; 0 inventory IDs represented by source entries; 3 excluded items.

### Open questions — lower-detail continuation

1. CTO decision required: why did the clicked capture send `POST /murphy/:id/clientmetricslog` once with status 200, outside the authorized set? Does the tool require a guard change or a separately approved continuation? No exception was inferred by the analyst.
2. Closing record-total stability remains unknown: m3c-list-after paints only a loading skeleton. This is not evidence of a count change or of equality.
3. Every related-card interior, particularly Contacts, Deals and Member Accounts, remains unobserved after the mandatory stop. An authorized continuation is needed before implementation relies on their controls, columns, counters or empty states.
4. Billing/shipping read-only display, Description, lower detail sections and record-page footer remain unobserved. No section-jump control was established; no persistent layout action was clicked.
5. Hover-only row ends and rail controls remain not observed; no capture demonstrated their presence.

### Shell controls missing from app-shell.md — lower-detail continuation

None newly observed. The two list screenshots reuse SH-01–SH-46; the closing screenshot paints only static placeholders.
