# CSV import and export — control inventory

Status: MEP-578 baseline; MEP-658 read-only opening research; initial export inventory accepted for four modules; history navigation awaiting reviewed continuation, Module 6. Scope: Leads, Contacts, Accounts and Deals. No measurements or frontend request contract.

## Purpose and evidence boundary

Identify module-list entry points, the initial import/export configuration, later import steps and history. Observed controls establish presence. MEP-578 exercised Actions only; MEP-658 exercised the approved initial openings and Escape described below. File selection, upload, Next, Import, Export, Submit, Finish, downloads and undo were never exercised. No operating-system file picker was opened.

MEP-657 permits exact-name initial CSV openings with the write guard unchanged. MEP-708 permits the creation chevron through the exact `CSV Import Menu` exception. In the MEP-658 Leads trial, the chevron and `Import Leads` menu item were opened and Escape returned to the list. The initial import screen did not render: opening attempted a blocked import-collection POST and a blocked persisted-preference PUT. MEP-739 classifies these as forbidden writes, not reads. Neither request reached the server. Import openings must not be repeated for Leads or the other modules; no replay or allowlist is authorized. Initial import content remains documentation evidence, not observed UI.

MEP-740 clarifies the acceptance boundary: history captures permit only GET additions and the same blocked method/path set as the same settings/module click-free baseline. The known Deals baseline also blocks grouped-counts POST and module-settings PUT; neither is permitted or replayed. A new write path stops that capture without retry. Each history target has at most one capture; an absent target remains an open question.

## Layout

Leads uses the current list view; Deals opens in its already-saved stage board. No view type was changed. The list is surrounded by the navigation rail, top bar, view strip, toolbar, already-visible filter panel and bottom utility strip. The import launcher sits on the creation split-button; Actions is immediately to its right. The open Actions menu overlays the right side of the list, with the export entry near its lower portion. Existing shell and module-list inventories remain authoritative for unrelated controls: [Contacts](contacts.md), [Accounts](accounts.md), [Deals](deals.md), [Leads](leads.md).

## Sources

- C-L: `m6-csv-leads-list` and `m6-csv-leads-actions`, screenshot, accessibility tree and controls.
- C-C: `m6-csv-contacts-actions-retry`, screenshot, accessibility tree and controls; first attempt `m6-csv-contacts-actions` retained as failed-loading evidence.
- C-A: `m6-csv-accounts-actions-retry`, screenshot, accessibility tree and controls; first attempt `m6-csv-accounts-actions` produced only an empty directory after navigation timeout.
- C-D: `m6-csv-deals-actions`, screenshot, accessibility tree and controls.
- O-D: `m6-csv-open-deals-export-approved`, step-2 and final screenshot/accessibility tree, final metadata. Export dialog appeared only in final evidence after Escape. MEP-740 accepts its initial appearance and fields; Escape closure is unverified. Both extra blocked paths match the click-free Deals baseline and remain forbidden.
- O-A: `m6-csv-open-accounts-export-approved`, step-2 screenshot/accessibility tree and final metadata; same export dialog as O-E with Account/All Accounts labels, same defaults and limit.
- O-C: `m6-csv-open-contacts-export-approved`, step-2 screenshot/accessibility tree and final metadata; same export dialog as O-E with Contact/All Contacts labels, same defaults and limit.
- O-E: `m6-csv-open-leads-export-approved`, step-2 screenshot/accessibility tree and final metadata; initial export dialog observed, Escape closure verified.
- O-I: `m6-csv-open-leads-menuitem-approved`, step-1/step-2 accessibility trees and screenshots, final metadata; import menu observed, initial screen blocked. MEP-739 safety decision is authoritative for the stop boundary.
- D-I: reference CRM public help, “Import data into a CRM module”, accessed 2026-10-15; neutral help path `/portal/en/kb/crm/data-administration/import-data/articles/import-data-into-a-crm-module`; sections “Prepare the import files”, “Upload the files”, “Choose whether records need to be created, updated, or both”, “Mapping files and fields”, “Undo an import”, “View history of imports”.
- D-F: reference CRM public help, “FAQs: Import”, accessed 2026-10-15; neutral help path `/portal/en/kb/crm/faqs/data-administration/import/articles/faqs-import`; duplicate detection, import failure, Leads import and undo sections.
- D-E: reference CRM public help, “Export CRM Data”, accessed 2026-10-15; neutral help path `/portal/en/kb/crm/data-administration/export-data/articles/export-crm-data`; configuration, limits and history sections.

Public source URLs and product-labelled source assets are intentionally excluded. Sources describe product capabilities; availability in this account is unconfirmed. Field definitions and required/unique flags must come from module metadata, not sample records or FAQ examples.

## Control inventory

### Shared controls in captured list states

These controls are present in C-L, C-C, C-A and C-D; behaviour is not observed except for CSV-03. Stable SH IDs are reused from the Contacts inventory. A combined row is a reference to separately numbered controls, not a new shared identifier. Labels with account/product values are described structurally.

| Existing IDs | Controls and position | Owning module |
| --- | --- | --- |
| SH-01, SH-02 | Product selector and menu visibility button, rail header | Shell |
| SH-03–SH-08 | Home, Workqueue, Reports, Analytics, Agents, MCP; pinned rail group | M14, M13, P3 |
| SH-09–SH-12 | Teamspace selector, More Actions, module search, Sales group toggle | M11, Shell |
| SH-13–SH-18 | Leads, Contacts, Accounts, Deals, Documents, Campaigns; Sales links | M1–M4, M9, M7 |
| SH-19–SH-22 | Activities group toggle; Tasks, Meetings, Calls links | M5 |
| SH-23–SH-25 | Integrations toggle; Visits and Price Books links | M15, P2 |
| SH-26–SH-34 | Search records, quick create, assistant, notifications, calendar, marketplace, Setup, profile, applications; top bar | Shell, M1, M10, M11, P3 |
| SH-35–SH-37 | My Pins, Chats, Contacts; utility strip left | Shell, M2 |
| SH-38–SH-46 | Unnamed utility icon, announcements, motivator, sticky notes, activity reminders, recent items, accessibility, Help, trash; utility strip right | Shell, M5, M13 |

CSV-L-26 All Locked Accounts is an additional visible view tab (C-A, M3, not clicked). CSV-L-27 repeated phone icon (C-A, M5) and CSV-L-28 repeated note icon (C-A, M6) are seen, not clicked. Column links include the record-name link and website links (CSV-L-29, C-A, M3, not clicked).

Module-list control instances: current-view tab and overflow; Filter, Sort; list/board/sheet/chart/timeline/split icons and view overflow; refresh icon; CSV-01–CSV-03; filter search and section toggles; each visible filter checkbox; select-all and repeated row selection; alphabetical filter; column/view settings; record links, row activity indicators; page range and previous/next. Ownership remains M1–M4 except activity indicators (M5). All are seen, not exercised. Filter field names and column definitions remain in each module's list spec/metadata; no record values are copied. The screenshot clips some columns, so no complete offscreen column inventory is asserted.

Deals differences: CSV-SH-47 Channels and CSV-SH-48 Threads appear between Chats and Contacts in the bottom strip (Shell, seen C-D, not clicked). CSV-L-01 stage-view dropdown and CSV-L-02 pencil sit above the board (M4/M11, seen C-D, not clicked). Stage cards and record links replace table selection/column/pagination controls in the captured viewport; do not reproduce table controls on this state.

### CSV-specific controls

Stable CSV numbers below cover CSV-specific controls. Repeated module controls retain the same number with a module-qualified instance. Documentation entries have no observed position, default or enabled state unless explicitly noted.

| # | Control | Position | Behaviour / evidence | Owner |
| --- | --- | --- | --- | --- |
| CSV-01 | Create record | Toolbar right, first segment | Seen; not clicked (C-L, C-C, C-A, C-D) | M1–M4 |
| CSV-02 | More / down chevron | Attached to Create | Seen in all baseline modules; opened for Leads using the approved exact chevron exception (O-I) | M6 |
| CSV-03 | Actions | Toolbar far right | Opened; reveals module actions (C-L, C-C, C-A, C-D) | M1–M4 |
| CSV-04 | Export module | Lower Actions menu | Observed in Actions; initial dialog opened for all four modules (O-E, O-C, O-A, O-D) | M6 |
| CSV-05 | Import module | Creation dropdown | Observed in Leads creation menu (O-I); selected once, but initial content blocked; other modules documentation-only (D-I) | M6 |
| CSV-06 | File drop area / Browse | Initial import content | File intake; never used (D-I, D-F) | M6 |
| CSV-07 | Sample CSV / XLSX links | Below Browse | Download affordances; never used (D-I) | M6 |
| CSV-08 | Charset selector | After upload | Parsing charset (D-I) | M6 |
| CSV-09 | Notify Email | Import upload step | Completion notification option (D-I) | M6 |
| CSV-10 | Next | Wizard footer | Advances; never clicked (D-I) | M6 |
| CSV-11 | Layout | Record handling step | Conditional on multiple layouts (D-I) | M11 |
| CSV-12 | Add / Update / Both | Record handling step | Creates, updates or combines (D-I) | M6 |
| CSV-13 | Unique matching field | Record handling step | Duplicate identity (D-F) | M6 |
| CSV-14 | Ignore empty incoming values | Update handling step | Avoids blank overwrites (D-F) | M6 |
| CSV-15 | Field mapping selectors | Mapping step | Match columns to fields (D-F) | M6 |
| CSV-16 | Mapped / Unmapped tabs | Mapping step | Mapping subsets (D-F) | M6 |
| CSV-17 | Reset / Auto mapping | Mapping step | Mapping helpers (D-F) | M6 |
| CSV-18 | Replace empty values / + | Mapping rows | Replacement or additional field mapping (D-F) | M6 |
| CSV-19 | Default values | Mapping step | Field defaults (D-F) | M6 |
| CSV-20 | Create New Fields | Mapping step | Schema write; never used (D-F) | M11 |
| CSV-21 | Module | Export dialog heading | Observed fixed target “Export Lead”; no module selector in initial Leads dialog (O-E) | M6 |
| CSV-22 | Custom view | Configure section, first row | Observed selector, initially All Leads; options not opened (O-E). Criteria variants remain D-E only | M6 |
| CSV-23 | Fields to Export | Configure section, second row | Observed selector, initially Fields from custom view; alternatives not opened (O-E), D-E documents other scopes | M6 |
| CSV-24 | CSV / XLSX and charset | Preferences, below Configure | Observed CSV selected, XLSX unselected; charset UTF-8 (Unicode); not changed (O-E) | M6 |
| CSV-25 | Set Password | Preferences, below charset | Observed switch off; no password input in initial state (O-E). Rich-text option documentation-only (D-E) | M6 |
| CSV-26 | Export | Dialog footer right, primary button | Observed, never clicked; starts export per D-E (O-E, D-E) | M6 |
| CSV-27 | Import History | Data administration | History entry; not yet observed (D-I) | M6 |
| CSV-28 | View Imported Modules / summary counts | Import history | Summary and skipped-row errors (D-I) | M6 |
| CSV-29 | Undo Import | Import history row | Deletes additions; never used (D-I) | M6 |
| CSV-30 | Confirmation / proceed | Undo dialog | Destructive; never opened (D-I) | M6 |
| CSV-31 | Export History / filters / details | Export administration | Job tracking (D-E) | M6 |
| CSV-32 | Download / retry | Export history | Transfers data / starts another job; never used (D-E) | M6 |

### List and board controls

Each entry is seen and not clicked. L/C/A/D refer to the source keys above. Per-record controls are numbered once and repeat without copying record values.

| # | Control | Position / source | Owner |
| --- | --- | --- | --- |
| CSV-L-03 | Current-view tab | View strip, L/C/A/D | M1–M4 |
| CSV-L-04 | Current-view overflow | Beside view tab, L/C/A/D | M1–M4 |
| CSV-L-05 | Filter | Toolbar left, L/C/A/D | M1–M4 |
| CSV-L-06 | Sort | After Filter, L/C/A/D | M1–M4 |
| CSV-L-07 | List view | View icon group, L/C/A/D | M1–M4 |
| CSV-L-08 | Board view | View icon group, L/C/A/D | M1–M4 |
| CSV-L-09 | Sheet view | View icon group, L/C/A/D | M1–M4 |
| CSV-L-10 | Chart view | View icon group, L/C/A/D | M1–M4 |
| CSV-L-11 | Timeline view | View icon group, L/C/A/D | M1–M4 |
| CSV-L-12 | Split view | View icon group, L/C/A/D | M1–M4 |
| CSV-L-13 | More views | After view icons, L/C/A/D | M1–M4 |
| CSV-L-14 | Refresh | After view icons, L/C/A/D | M1–M4 |
| CSV-L-15 | Filter search | Left panel below heading, L/C/A/D | M1–M4 |
| CSV-L-16 | System Defined Filters | Left panel first section, L/C/A/D | M1–M4 |
| CSV-L-17 | Filter By Fields | Left panel second section, L/C/A/D | M1–M4 |
| CSV-L-18 | Select all | Table header, L/C/A | M1–M3 |
| CSV-L-19 | Row selection | Each table row, L/C/A | M1–M3 |
| CSV-L-20 | Alphabetical All selector | Beside primary-name column, L/C/A | M1–M3 |
| CSV-L-21 | View Settings | Table header right, L/C/A | M1–M3 |
| CSV-L-22 | Record link | Each row/card, L/C/A/D | M1–M4 |
| CSV-L-23 | Activity indicator | Rows/cards with activity, L/C/D | M5 |
| CSV-L-24 | Previous page | Table footer right, L/C/A | M1–M3 |
| CSV-L-25 | Next page | Table footer far right, L/C/A | M1–M3 |

### Visible filter control reconciliation

A also denotes C-A (Accounts). Activities, Campaigns and Latest Email Status do not appear in the captured Accounts system-filter section; the shared entries above apply to L/C/D only for those fields. All CSV-F controls below are checkboxes in the left filter panel, seen and not toggled. Source columns identify captured states; stable numbering deduplicates repeated labels. A partially clipped control establishes presence only.

| # | Control | Source | Owner |
| --- | --- | --- | --- |
| CSV-F-01 | Activities | L,C,D | M5 |
| CSV-F-02 | Campaigns | L,C | M7 |
| CSV-F-03 | Latest Email Status | L,C,D | M10 |
| CSV-F-04 | Locked | L,C,A,D | M1–M4 |
| CSV-F-05 | Record Action | L,C,A,D | M1–M4 |
| CSV-F-06 | Related Records Action | L,C,A,D | M1–M4 |
| CSV-F-07 | Touched Records | L,C,A,D | M1–M4 |
| CSV-F-08 | Untouched Records | L,C,A,D | M1–M4 |
| CSV-F-09 | Cadences | L,C,A,D | P3 |
| CSV-F-10 | Address | L | M1 |
| CSV-F-11 | Address - City | L | M1 |
| CSV-F-12 | Address - Country / Region | L | M1 |
| CSV-F-13 | Address - Flat / House / Building / Apartment | L | M1 |
| CSV-F-14 | Account Name | C,A,D | M3 |
| CSV-F-15 | Assistant | C | M2 |
| CSV-F-16 | Asst Phone | C | M2 |
| CSV-F-17 | Connected To | C,D | M2,M4 |
| CSV-F-18 | Contact Name | C | M2 |
| CSV-F-19 | Amount | D | M4 |
| CSV-F-20 | Campaign Source | D | M7 |
| CSV-F-21 | Closing Date | D | M4 |
| CSV-F-22 | Account Number | A | M3 |
| CSV-F-23 | Account Owner | A | M3 |
| CSV-F-24 | Account Site | A | M3 |
| CSV-F-25 | Account Type | A | M3 |
| CSV-F-26 | Annual Revenue | A | M3 |
| CSV-F-27 | Billing Address | A | M3 |
| CSV-F-28 | Billing Address - City | A | M3 |

### Other visible Actions menu controls

All are seen, not selected. L = C-L; C = C-C; A = C-A; D = C-D. Order follows the screenshot top to bottom; CSV-04 identifies the export row.

| # | Control | Source / position | Owner |
| --- | --- | --- | --- |
| CSV-A-01 | Mass Transfer | L,C,A,D, Actions menu | M1–M4 |
| CSV-A-02 | Mass Delete | L,C,A,D, Actions menu | M1–M4 |
| CSV-A-03 | Mass Update | L,C,A,D, Actions menu | M1–M4 |
| CSV-A-04 | Mass Convert | L, Actions menu | M1 |
| CSV-A-05 | Manage Tags | L,C,A,D, Actions menu | M6 |
| CSV-A-06 | Drafts | L,C,A,D, Actions menu | M1–M4 |
| CSV-A-07 | Mass Email | L,C,D, Actions menu | M10 |
| CSV-A-08 | Approve module | L,C, Actions menu | M1–M2 |
| CSV-A-09 | Deduplicate module | L,C,A,D, Actions menu | M1–M4 |
| CSV-A-10 | Add to Campaigns | L,C, Actions menu | M7 |
| CSV-A-11 | Create Client Script | L,C,A, Actions menu | M11 |
| CSV-A-12 | Sheet View submenu | L,C,A, Actions menu | Shell |
| CSV-A-13 | Print View submenu | L,C,A, Actions menu | Shell |

## Flows and limits

Documentation-only import: file intake → record handling → mapping → final submission → history. No later step was reached in the reference session. D-I specifies 25 MB, 500 columns, CSV/XLS/XLSX, plus VCF for Leads/Contacts. Edition row limits: 1,000 / 20,000 / 50,000 / 100,000 / 200,000 from Free through Ultimate. Headers and required values are needed. More than ten consecutive empty rows end parsing. Missing required values skip rows. History shows added/updated/skipped counts and errors. Undo covers additions, not updates. D-I's undo section says 30 days; its history section says seven-day detailed availability, creating an unresolved inconsistency.

D-F lists duplicate keys: Email for Leads/Contacts, Account Name for Accounts, Deal Name for Deals; Record ID can also match. Only mapped fields overwrite. Its non-CSV 5,000-row guidance differs from D-I's newer edition table. Preserve this as a source conflict; do not infer account limits.

Documentation-only export: configure module, record scope, fields and format → job → history. D-E limits: CSV 200,000 rows; XLSX 50,000; selected-record export 500; chosen fields 200; excluded fields 20; criteria 25; lookup modules five. Daily jobs by edition: 10/100/250/500/1,000. ZIP download expires after seven days; history lasts 60 days. Statuses include processing, completed and processing error. Profile export permission gates access.

## Module evidence matrix

| Module | Entry evidence | Initial screens | History |
| --- | --- | --- | --- |
| Leads | C-L; O-I creation menu | Import blocked by required write (O-I); initial export observed (O-E) | Documentation only |
| Contacts | C-C: Create split-button and Export Contacts in Actions; first baseline attempt failed to render | Import not retried per MEP-739; initial export matches Leads (O-C) | Documentation only |
| Accounts | C-A: Create split-button and Export Accounts in Actions; first baseline attempt timed out | Import not retried per MEP-739; initial export matches Leads (O-A) | Documentation only |
| Deals | C-D: Create split-button and Export Deals in Actions; existing stage board | Import not retried per MEP-739; initial export appearance accepted from final evidence (O-D); Escape closure unverified | Documentation only |

A loading skeleton or missing artifact is an evidence failure, not an empty-module state. Import source variants and history access remain unverified. Leads, Contacts and Accounts initial export defaults match; Deals final evidence shows the same defaults and is accepted for appearance/fields by MEP-740; closure remains unverified. No history control was clicked: no evidenced safe route was obtained from the CSV launchers. The public navigation is Setup → Data Administration → Import → Import History; the later click-free settings entry capture H-0 did not reach the history list. Undo and confirmation remain strictly unexercised.

## Empty, validation and error states

No-file wizard defaults, disabled Next, inline error placement and empty history copy were not observed. Escape closes the observed Leads, Contacts and Accounts export dialogs; Deals remains open in final evidence (O-D); Cancel is visible but was not clicked. D-F documents missing headers, required values, encoding, type/length, date-format and picklist mismatches as failure causes. D-I documents skipped-row error summaries; D-E documents export processing error and retry. These are behavioural evidence only; no exact UI messages or success state were reproduced. Import and export permissions may suppress entries. An absent entry is not proof of missing functionality.

## Open questions

1. What are the exact first-step import source choices, instructions, initial selected values and cancel/back controls in this session? Not observable without a forbidden import-session POST (O-I, MEP-739); no further import opening is authorized.
2. Export initial defaults are observed for Leads, Contacts and Accounts (O-E, O-C, O-A); Deals appearance/fields are accepted (O-D, MEP-740), while Escape closure remains unverified. Dropdown options, field/view variants and format-dependent states remain unobserved; scope permits only the initial dialog.
3. Does the session use the newer import tool or the legacy FAQ flow? File/layout/mapping and final-step differences need lead resolution before implementation.
4. Which edition/file row limits apply? D-I and D-F differ.
5. Is undo available for seven or thirty days, and which detailed summaries remain accessible? D-I contradicts itself; no destructive verification permitted.
6. Exact initial-file validation, empty histories, permission errors, asynchronous job errors and cancellation behaviour are not observable without a write or blocked screen opening.
7. History lists and exact undo affordances remain documentation-only. H-0 exposes the Import History navigation route, but its paint gate failed and no navigation click ran. Platform Lead continuation review is required before another capture; Export History has not been attempted.
8. Import opening cannot be studied under the read-only rule: MEP-739 forbids the required POST and persisted-preference PUT. Any separate board-provided evidence decision belongs to the CTO/parent issue owner; no such evidence or write is authorized here.

## Baseline MEP-578 capture refs and safety checks

Captures remain outside the repository. Every capture is checked against its screenshot and controls; all clicked captures require review of `meta.json.blockedRequests`. Blocked reminder-status, notification-status and telemetry requests are automatic page activity. C-D additionally blocked a module-settings PUT and grouped-counts POST. The latter can leave board counts inconsistent with visible cards; those counts are not used as business evidence. No blocked request was retried or allowed, and no import/export operation ran. No customer data, source assets, account identifiers or absolute local paths are included here. `docs/parity-checklist.md` is unchanged.

Verification: all successful screenshots opened; menu entries and filter controls reconciled with controls.json; every available meta.json reviewed, including the failed Contacts attempt. Sequential CSV IDs and local documentation links checked; banned terms, absolute local paths, account identifiers and email patterns absent. Only this spec is changed; no runtime tests apply to this documentation-only change. This baseline verification does not assert MEP-658 completion.


## MEP-658 import opening outcome

Observed (O-I): CSV-02 opens the creation dropdown and CSV-05 is the Leads import menu item. After CSV-05, only a loading skeleton and general error banner were captured; this is blocked-session evidence, not a reference product error, an empty state or an exact first-screen inventory. Escape closed the opening and the final capture shows the list.

Safety audit: `clicks=["#importButton", "role=menuitem[name=\"Import Leads\"]"]`; ordered steps are chevron click, import menu-item click, Escape. `cacheEnabled=true`, `ready.ok=true`; 11 blocked requests (seven telemetry, reminder-status, notification-status, import POST and preference PUT). `fileChooserBlocked=false`, `downloadBlocked=false`, `dialogVisibleAfterClose=false`; no popup, open or print activity. No initial-screen documentation claim becomes observed from this attempt. No first-screen discrepancy against public documentation is established.


### Observed initial export dialog (O-E, O-C, O-A, O-D)

A white dialog overlays the dimmed module list. Its heading identifies the fixed module. Configure contains CSV-22 then CSV-23; Preferences contains CSV-24 then CSV-25. No configuration control was opened or changed.

| # | Control | Position | Function / observation |
| --- | --- | --- | --- |
| CSV-E-01 | CSV radio | Preferences, file type row left | Selected initially; never changed |
| CSV-E-02 | XLSX radio | Same row, after CSV | Unselected; never changed |
| CSV-E-03 | Information icon | Immediately after XLSX | Visible; tooltip not opened |
| CSV-E-04 | Charset dropdown | Below file type | Initially UTF-8 (Unicode); options unobserved |
| CSV-E-05 | Cancel | Footer, left of Export | Visible secondary button; not clicked |
| CSV-E-06 | Escape | Keyboard closure | Exercised after initial screenshot; final metadata confirms closure for Leads/Contacts/Accounts only; Deals closure unverified |

The informational strip below Set Password states a 200,000-record maximum. No inline validation, empty data message or error is visible in this initial dialog. File-format changes, password fields, dropdown options, submission validation and job results remain unobserved. No close icon is visible in this captured dialog.

Documentation reconciliation: the initial Leads dialog exposes a fixed module heading rather than a module picker; field scope defaults to fields from the current view; CSV, UTF-8 and password off are now observed defaults. Criteria, alternate field scopes and rich-text preferences described by D-E are not visible in the initial state; this does not establish their absence in later variants. The displayed CSV limit agrees with D-E. No export operation was run.

O-E safety audit: `clicks=["#moreTools", "#cv_export_action"]`; steps Actions, Export Leads, Escape; eight blocked automatic requests (six telemetry, reminder-status, notification-status), no new write path. `cacheEnabled=true`, `ready.ok=true`, no failed scripts; file chooser/download flags false, dialog closed. No import opening was retried.

O-C safety audit: `clicks=["#moreTools", "#cv_export_action"]`; steps Actions, Export Contacts, Escape; eight blocked automatic requests (six telemetry, reminder-status, notification-status), no new write path. Ready and cache true, failed scripts empty; file chooser/download flags false and dialog closed. A clipped red banner is visible at the top of the background; no dialog validation message is present and no cause is inferred.

O-A safety audit: `clicks=["#moreTools", "#cv_export_action"]`; steps Actions, Export Accounts, Escape; seven blocked automatic requests (five telemetry, reminder-status, notification-status), no new write path. Ready and cache true, failed scripts empty; file chooser/download flags false and dialog closed. The clipped background banner also appears here; no cause is inferred.


### Deals appearance acceptance and closure limitation (O-D)

The capture used the already-saved stage board without changing its view. `ready.ok=true`; requested steps were Actions, Export Deals, Escape. The step-2 screenshot/accessibility tree did not yet show the export dialog; the final screenshot/accessibility tree did show it, with the same configuration/defaults as O-E except Deal/All Deals labels. `dialogVisibleAfterClose=true`: closure failed. Exit code 0 does not override this failed close check. Timing is recorded as evidence, not a proven root cause.

Ten requests were blocked: six telemetry requests (including repeated url-monitor events), reminder-status, notification-status, `POST /crm/v2.2/Deals/actions/grouped_counts` and `PUT /crm/v2.2/settings/modules/Deals`. MEP-740 confirms that both paths also occur in click-free Deals baselines and that the blocked method/path set matches. Both remain forbidden, not classified as safe or replayed. Board counts are not business evidence.

Safety: `clicks=["#moreTools", "#cv_export_action"]`, no skipped steps; `cacheEnabled=true`, failed scripts empty; file chooser/download flags false, no print/open/popup activity. No additional closure click, retry, view change, tool change or manual browser intervention followed. MEP-740 accepts the final screenshot/accessibility tree for the initial Deals appearance and fields. The delayed render or Escape handling cause is unproven; no retry or extra close click is authorized. History research proceeds under the one-capture-per-target conditions above.


### History entry attempt and readiness limitation (H-0)

Source H-0: `m6-csv-open-import-history-approved`, final screenshot, accessibility tree, controls and metadata. The direct route was the existing Setup Import entry `/crm/<org>/settings/data-migration`, taken from the prior `m6-setup` capture. It displays the migration-source landing page rather than the Import History list. No migration provider was selected. The screenshot is diagnostic evidence only: no history content, row controls, empty state or validation is established.

The passive probe `text="Import History"` matched two elements, so `ready.ok=false` after 90020 ms and the tool exited 2. This is an analyst probe-selection error, not a product failure or proof of a missing page. No step ran and no retry followed. The accessibility tree exposes a navigation link to `/crm/<org>/settings/import-history`; that link was not clicked and the route was not opened. These are neutral routes only.

| # | Control | Position | Evidence boundary / function |
| --- | --- | --- | --- |
| CSV-H-01 | Import navigation tab | Main content header, left | Visible on diagnostic landing screenshot; current entry, not a module import wizard |
| CSV-H-02 | Import History navigation link | Main content header, after Import | Visible navigation affordance; not clicked; list content unobserved |
| CSV-H-03 | Help | Landing content, upper right | Visible; not opened |

The migration-provider tile grid belongs to the separate migration flow and is outside this CSV history-list inventory. Provider names, logos and assets are not copied. The sidebar and utility strip are settings-shell controls, not history controls; no history-screen parity is asserted from this diagnostic capture.

H-0 audit: `clicks=[]`, `steps=[]`, `allowedOpenClicks=[]`; nine blocked requests (seven automatic telemetry requests, reminder-status and notification-status). The older `m6-setup` baseline contains only the two legacy status paths, so the exact blocked method/path set differs; H-0 is not accepted under MEP-740. No request was replayed or allowlisted. `cacheEnabled=true`, failed scripts empty; file chooser/download flags false, `printCalls=0`, open/popup arrays empty, dialog-after-close false. Seven evidence files were saved; final progress is done at 102471 ms. No manual browser/profile/tab/lock intervention occurred.

Following the readiness failure, no Export History capture was started. Existing capture guidance requires a reviewed continuation after gate failure. Platform Lead must settle the remaining bounded history navigation; no new import opening, operation, guard change or history retry is implied. Public-documentation history statements remain documentation-only and no new documentation discrepancy is claimed.
