# CSV import and export — control inventory

Status: research submitted for MEP-578, Module 6. Scope: Leads, Contacts, Accounts and Deals. No measurements or frontend request contract.

## Purpose and evidence boundary

Identify module-list entry points, the initial import/export configuration, later import steps and history. Observed controls establish presence; only opening Actions was exercised. File selection, upload, Next, Import, Export, Submit, Finish, downloads and undo were never exercised. No operating-system file picker was opened.

The capture guard rejects controls whose labels, selectors or attributes contain import/export. The creation split-button's More control also carries an import-related attribute. The export menu entry has no navigation href. No guard exception applies to these controls; no alternate selector, guessed route or tool modification was used to evade this boundary. Initial screens below are documentation evidence, not session observations.

## Layout

Leads uses the current list view; Deals opens in its already-saved stage board. No view type was changed. The list is surrounded by the navigation rail, top bar, view strip, toolbar, already-visible filter panel and bottom utility strip. The import launcher sits on the creation split-button; Actions is immediately to its right. The open Actions menu overlays the right side of the list, with the export entry near its lower portion. Existing shell and module-list inventories remain authoritative for unrelated controls: [Contacts](contacts.md), [Accounts](accounts.md), [Deals](deals.md), [Leads](leads.md).

## Sources

- C-L: `m6-csv-leads-list` and `m6-csv-leads-actions`, screenshot, accessibility tree and controls.
- C-C: `m6-csv-contacts-actions-retry`, screenshot, accessibility tree and controls; first attempt `m6-csv-contacts-actions` retained as failed-loading evidence.
- C-A: `m6-csv-accounts-actions-retry`, screenshot, accessibility tree and controls; first attempt `m6-csv-accounts-actions` produced only an empty directory after navigation timeout.
- C-D: `m6-csv-deals-actions`, screenshot, accessibility tree and controls.
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
| CSV-02 | More / down chevron | Attached to Create | Seen; opening blocked by import attribute (C-L, C-C, C-A, C-D); documented import entry (D-I) | M6 |
| CSV-03 | Actions | Toolbar far right | Opened; reveals module actions (C-L, C-C, C-A, C-D) | M1–M4 |
| CSV-04 | Export module | Lower Actions menu | Seen, not clicked (C-L, C-C, C-A, C-D) | M6 |
| CSV-05 | Import module | Creation dropdown | Documented; menu not observed (D-I) | M6 |
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
| CSV-21 | Module | Export configuration | Export target (D-E) | M6 |
| CSV-22 | Custom view / criteria | Export configuration | Record scope (D-E) | M6 |
| CSV-23 | All / Choose / Exclude fields | Export configuration | Field scope (D-E) | M6 |
| CSV-24 | CSV / XLSX and charset | Export preferences | File format (D-E) | M6 |
| CSV-25 | Password / rich-text preference | Export preferences | Archive protection and text handling (D-E) | M6 |
| CSV-26 | Export | Export footer | Starts job; never used (D-E) | M6 |
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
| Leads | C-L: Create split-button and Export Leads in Actions | Guard-blocked; D-I/D-F/D-E only | D-I only |
| Contacts | C-C: Create split-button and Export Contacts in Actions; first attempt failed to render | Not observed; documentation only | Documentation only |
| Accounts | C-A: Create split-button and Export Accounts in Actions; first attempt timed out | Not observed; documentation only | Documentation only |
| Deals | C-D: Create split-button and Export Deals in Actions; existing stage board | Not observed; documentation only | Documentation only |

A loading skeleton or missing artifact is an evidence failure, not an empty-module state. Import source variants, history access routes and per-module export defaults remain unverified. No history control was clicked: no evidenced safe route was obtained from the CSV launchers. The public navigation is Setup → Data Administration → Import → Import History; the capture guard also blocks Import-labelled settings entries. Undo and confirmation remain strictly unexercised.

## Empty, validation and error states

No-file wizard defaults, disabled Next, inline error placement, empty history copy and cancel/close behaviour were not observed. D-F documents missing headers, required values, encoding, type/length, date-format and picklist mismatches as failure causes. D-I documents skipped-row error summaries; D-E documents export processing error and retry. These are behavioural evidence only; no exact UI messages or success state were reproduced. Import and export permissions may suppress entries. An absent entry is not proof of missing functionality.

## Open questions

1. What are the exact first-step import source choices, instructions, initial selected values and cancel/back controls in this session? Not observable through the current guard.
2. What are the export window defaults and field/view variants in this session? The menu entry exposes no safe href; opening is guard-blocked.
3. Does the session use the newer import tool or the legacy FAQ flow? File/layout/mapping and final-step differences need lead resolution before implementation.
4. Which edition/file row limits apply? D-I and D-F differ.
5. Is undo available for seven or thirty days, and which detailed summaries remain accessible? D-I contradicts itself; no destructive verification permitted.
6. Exact initial-file validation, empty histories, permission errors, asynchronous job errors and cancellation behaviour are not observable without a write or blocked screen opening.
7. History screens and exact undo affordances remain documentation-only; no evidenced safe history route was obtained. The capture maintainer/UI Lead must resolve access before claiming current-session history parity.
8. Can a capture maintainer expose a narrowly governed read-only opening path for import/export/history? No capture-tool changes are authorized by this research issue.

## Capture refs and safety checks

Captures remain outside the repository. Every capture is checked against its screenshot and controls; all clicked captures require review of `meta.json.blockedRequests`. Blocked reminder-status, notification-status and telemetry requests are automatic page activity. C-D additionally blocked a module-settings PUT and grouped-counts POST. The latter can leave board counts inconsistent with visible cards; those counts are not used as business evidence. No blocked request was retried or allowed, and no import/export operation ran. No customer data, source assets, account identifiers or absolute local paths are included here. `docs/parity-checklist.md` is unchanged.

Verification: all successful screenshots opened; menu entries and filter controls reconciled with controls.json; every available meta.json reviewed, including the failed Contacts attempt. Sequential CSV IDs and local documentation links checked; banned terms, absolute local paths, account identifiers and email patterns absent. Only this spec is changed; no runtime tests apply to this documentation-only change.
