# Parity checklist

One section per module. Each row is a capability of the reference CRM that
the module's research found, assigned to the module that delivers it.

## How to read this file

- **The specs win.** `research/specs/` describes behaviour, look and request
  shapes. This file only indexes them and assigns a module. If a row and a
  spec disagree, the spec is right and the row is fixed.
- **Done** means: QA checked the capability against the cited spec section
  and found the same behaviour, the same look (the spec's Visual layout
  section) and resembling requests (`research/specs/request-shapes.md`,
  `docs/adr/0004-request-shape.md`).
- **Everything visible is listed.** The end goal is the whole reference
  system, so a capability we do not use today still gets a row and a module.
- **Later rows are not drawn early — Leads screens only.** On the screens
  built in Module 1, a control whose function belongs to a later module is
  left out until that module ships. Every such row is reported as a known
  gap at the module gate. These screens are brought in line with the next
  rule in the end-of-project batch, not before.
- **From Module 2 on, later-module controls are drawn but do nothing**
  (board decision of 2026-10-11). A control that is visible on the
  reference screen and whose function belongs to a later module (the
  `Module` column of the screen's control inventory) is drawn in its
  reference place and look, and nothing happens when it is clicked: no
  action, no navigation, no menu, no message and no tooltip. It is built
  with the shared `laterModule` state of the UI primitives. Leaving such a
  control out is a defect; its missing function is not, and is reported as
  a known gap at the module gate.
- **Open research** marks a behaviour the specs record as unobserved. Under
  the read-only rule it can only come from the reference CRM's public
  documentation. A row with open research is built to the spec as far as the
  spec goes; the rest is reported at the gate.
- **Module assignment** follows the order in `AGENTS.md`. The assignments
  were made by the CTO on 2026-10-05 from the capability table in
  `research/specs/leads.md`; the board may move any row.
- **From Module 2 on** (board decisions of 2026-10-09 and 2026-10-11):
  behaviour stays one-to-one; the look is "same by eye", built from the
  Module 1 components and tokens; requests need not resemble the reference.
  Every screen spec carries a numbered inventory of every visible control,
  and **Done** means QA ticked that inventory beside the reference
  screenshot and found the same behaviour. A missing or misplaced control
  is a defect.

| Key | Module |
| --- | --- |
| M1 | Leads with the minimal app shell |
| M2 | Contacts |
| M3 | Accounts |
| M4 | Deals and pipeline |
| M5 | Activities (tasks, meetings, calls) |
| M6 | Notes, attachments, CSV import and export |
| M7 | Campaigns |
| M8 | Cases and solutions |
| M9 | Documents |
| M10 | Email inbox and calendar |
| M11 | Customization (fields, layouts, views) |
| M12 | Automation (workflows, assignment rules) |
| M13 | Reports and analytics |
| M14 | Home dashboard and work queue |
| M15 | Visits and social |
| P2 | Phase 2 (products, price books, quotes, orders, invoices, vendors, forecasts) |
| P3 | Phase 3 (cadences, approval queue and every remaining area) |
| — | Not in the module order yet; see "Rows without a module" |

## Module 1 — Leads

Specs: `app-shell.md`, `list-views.md`, `record-detail.md`,
`leads-fields-and-layout.md`, `leads.md`, `leads-write-behaviour.md` (write
flows, from the public documentation), with `request-shapes.md` and
`typography.md` for every screen.

### Delivered in Module 1

| # | Capability | Spec section | Open research |
| --- | --- | --- | --- |
| 1 | Shell frame: rail, top bar, content area; navigation to Home and Leads with the active rail row; expanded Sales group | `app-shell.md` › Layout, Visual layout, Actions | Collapsed rail and group collapse were not observed. |
| 2 | Home route as a page skeleton | `app-shell.md` › Layout | Its components are M14. |
| 3 | Top-bar `+` › `Create Records` menu with the Lead entry | `app-shell.md` › Actions; `record-detail.md` › Create and edit forms | Other entries arrive with their modules. |
| 4 | Leads list page: header, view selector, toolbar, table with wrapping, footer with range, total and pagination | `list-views.md` › Layout, Visual layout, Fields | — |
| 5 | Default view, stock views and the empty state, including the two converted-lead views as empty views | `list-views.md` › Filters / views / sorting / search, View definitions from the metadata export | — |
| 6 | The three user-created views, read as stored (criteria, columns) | `list-views.md` › View definitions from the metadata export | — |
| 7 | View criteria and sort applied as defined | `list-views.md` › Criteria wire format, Saved and response sort evidence | — |
| 8 | Filter panel with field filters: operator and value per field, Apply Filter, Clear | `list-views.md` › Filters / views / sorting / search, Filter operators by field type | The result and the request of Apply Filter, how several fields combine, validation, the value controls of non-default operators, and the operators of field types other than the eight observed. |
| 9 | Sort dialog with its field list; column header Asc and Desc; Records Per Page; Wrap Text; Refresh | `list-views.md` › Actions, Filters / views / sorting / search | The result of a sort choice, the header menu on columns other than Lead Name, and whether a sorted column is marked. |
| 10 | Search inside Leads: the letter list beside Lead Name | `list-views.md` › Filters / views / sorting / search; `leads-write-behaviour.md` › B1 | The field a letter applies to and the result state. A text search inside the module was not observed. |
| 11 | Row selection with Mass Transfer, Mass Delete and Mass Update | `list-views.md` › Actions; `leads.md` › Actions; `leads-write-behaviour.md` › A3–A6 | Look and copy of the selection bar and the dialogs; result messages. |
| 12 | Record header: identity, portrait placeholder, Edit, More Options, previous and next record | `record-detail.md` › Record page, Visual layout | Previous/next order and boundaries. |
| 13 | Related-list rail frame and its show/hide control, stored as a user preference | `record-detail.md` › Record page | Entries arrive with their modules (see below). |
| 14 | Lead Status ribbon with the stage menu and the terminal menu | `record-detail.md` › Record page; `leads-write-behaviour.md` › A9 | Result of applying a stage. |
| 15 | Business card (five fields) and the detail sections, blank values, Created By and Modified By rows, Hide Details | `record-detail.md` › Record page, Fields | Collapse behaviour of Hide Details. |
| 16 | Inline field edit on the detail page | `record-detail.md` › Actions; `leads-write-behaviour.md` › A8 | Result of Save and Cancel, where errors appear, editors of field types other than the observed picklist. |
| 17 | Timeline › History with its filter | `record-detail.md` › Timeline, Filters / views / sorting / search | Result of applying a filter; other event types. |
| 18 | Lead image shown with our own placeholder | `record-detail.md` › Record page | Upload is M6. |
| 19 | Lead owner display and the `Select User` picker | `record-detail.md` › Create and edit forms | — |
| 20 | Create Lead form: Standard layout, required markers, picklists, Country and State lists | `record-detail.md` › Create and edit forms; `leads-fields-and-layout.md` › Standard layout | Whether a compact quick-create form exists. The Country and State option lists are empty until the inventory is seeded with the database adapter (ADR 0002); only -None- is offered. |
| 21 | Edit Lead form | `record-detail.md` › Create and edit forms | — |
| 22 | Save validation (required and format messages, focus) and the unsaved-changes dialog on Cancel | `record-detail.md` › Create and edit forms, Flows; `leads-write-behaviour.md` › A10 | Look of server errors on the form. |
| 23 | Save and Save and New results | `record-detail.md` › Flows; `leads-write-behaviour.md` › A7 | Destination and message after a successful save. |
| 24 | Delete Lead | `leads.md` › Actions; `leads-write-behaviour.md` › A1 | Confirmation dialog and where the page goes afterwards. |
| 25 | Clone Lead | `leads.md` › Actions; `leads-write-behaviour.md` › A2 | Look of the clone form, the fields it leaves out and where the page goes after Save. |
| 26 | Lead schema: fields, types, required fields, limits, picklists | `leads-fields-and-layout.md` › Fields, Picklists | The Country and State option lists are empty until the inventory is seeded with the database adapter (ADR 0002); only -None- is offered. |
| 27 | Field permissions of the two profiles applied to list, detail and forms | `leads-fields-and-layout.md` › Field permissions by profile | Whether the shell differs by profile. Not delivered yet: one profile exists until profile-based field permissions arrive with the database adapter (ADR 0002). |

### Leads capabilities delivered by later modules

| Capability | Module | Spec section |
| --- | --- | --- |
| Convert Lead to Contact and Account with an optional Deal; Mass Convert; converted-record fields and navigation | M4 (needs M2, M3) | `leads.md` › Flows; `leads-fields-and-layout.md` › Lead conversion field mapping |
| Open Activities, Closed Activities and Invited Meetings cards; Timeline › Interactions | M5 | `record-detail.md` › Related-list structure and use, Timeline |
| Notes card; Attachments card and image upload; Add Tags and Manage Tags | M6 | `record-detail.md` › Related-list structure and use; `leads.md` › Actions |
| Import Leads, Import Notes, Export Leads | M6 | `list-views.md` › Actions |
| Campaigns card and Add to Campaigns | M7 | `record-detail.md` › Related-list structure and use |
| Emails card, Send Email, Drafts, Mass Email, Mail Merge, unsubscribe handling; calendar shortcut in the top bar | M10 | `leads.md` › Actions; `app-shell.md` › Actions |
| View authoring and sharing (Edit, Clone, Close and Delete View), Pin and favourites, Manage Columns, Reset Column Size, view types other than the table | M11 | `list-views.md` › Actions |
| Column header menu entries Pin Column, Hide Column and Filter by | M11 | `list-views.md` › Filters / views / sorting / search |
| Customize Business Card, Organize Lead Details, Add Related List, Links and Add Link, custom record page, Create Button, layout and validation rules, dependent picklist authoring, layout editor and field permission administration; Settings entry | M11 | `leads.md` › Actions; `leads-fields-and-layout.md` › Layout |
| Assignment Rules, Run Macro, blueprints | M12 | `leads.md` › Actions |
| Filter panel: system defined filters and filters by related module | with the module that owns the data (activities M5, notes M6, campaigns M7, email M10, cadences P3) | `list-views.md` › Filters / views / sorting / search |
| Filter panel: email operators for blocked addresses | M10 | `list-views.md` › Filter operators by field type |
| Home components (onboarding and setup steps) | M14 | `app-shell.md` › Home components currently shown |
| Social card; ad-platform lead sync entries | M15 | `record-detail.md` › Related-list structure and use; `list-views.md` › Actions |
| Products card | P2 | `record-detail.md` › Related-list structure and use |
| Cadences card and Enroll to Cadence; Approve Leads and Review History; Voice of the Customer card; Add Kiosk and Create Client Script; applications menu, extensions entry and team-space controls | P3 | `record-detail.md` › Related-list structure and use; `leads.md` › Actions; `app-shell.md` › Actions |
| Deleting a Lead also deletes its notes and activities; a change of owner can carry the Lead's open activities | M5, M6 | `leads-write-behaviour.md` › A1, A5 |
| Mandatory-fields form opened by a layout rule during inline edit; duplicate alert on unique fields with its link to the existing record (no unique field is configured today) | M11 | `leads-write-behaviour.md` › A8, A10 |
| Overwrite and Append choice when a multi-select field is mass updated (Leads has no such field) | with the first module that has one | `leads-write-behaviour.md` › A4 |
| Links from the Lead page to records of other modules | with each module | `leads.md` › Module 1 capability and dependency table |

### Rows without a module

The module order does not name these. The board approved the assignments
below on 2026-10-11 (Module 1 gate). The three rows marked Unresolved stay
open; the board is asked again when the related module starts. The two rows
assigned to M2 moved to "Module 2 — Contacts".

| Capability | Decision | Spec section |
| --- | --- | --- |
| Record Share and the sharing rules behind it | M11 | `leads.md` › Module 1 capability and dependency table |
| Print Preview and Print View | M6 | `leads.md` › Actions |
| Notifications in the top bar | M12 | `app-shell.md` › Actions |
| User menu in the top bar | M1 for sign-out through our own account screens; the reference menu's options are unobserved | `app-shell.md` › Actions |
| Connected Records card | Unresolved: its use in our organization is unknown | `record-detail.md` › Related-list structure and use |
| Recycle Bin: deleted records are kept 60 days, can be restored, and are removed for good only by an administrator | M6, with the other data administration tools; keeping deleted records is decided in ADR 0002 | `leads-write-behaviour.md` › A1 |
| Mass Update, Mass Transfer and Mass Delete tool pages with a criteria step (list Actions menu) | M11, with view criteria editing | `leads-write-behaviour.md` › A4–A6 |
| Filter panel: owner operators by role and by group; date operators by fiscal year and fiscal quarter | Unresolved: they need roles, groups and a fiscal-year setting, which the module order does not name | `list-views.md` › Filter operators by field type |
| Mass actions on every record of a view; progress indicator of a running mass action | Unresolved: availability depends on the edition | `leads-write-behaviour.md` › A3 |

### Module 1 gate

1. QA walks rows 1–27 against the cited sections and records pass or fail
   per row.
2. Rows whose open research is still unresolved are reported with what was
   built and what is missing.
3. Every row of the two tables above is reported as a known gap with its
   module.
4. The board accepted the gate on 2026-10-11. Known visual differences of
   Module 1 are fixed in one batch at the end of the project, not now.

## Module 2 — Contacts

Specs (being written): `contacts.md`, `contacts-record-detail.md`,
`contacts-form.md`, `global-search.md`, `duplicates.md`. The numbered rows
are added from their capability tables when the specs are approved.

### Contacts create / edit / clone form — implemented; QA pending (MEP-321)

| Inventory | Implementation | Verification |
| --- | --- | --- |
| F-01–F-04, F-57 | Shared form strip; Edit Page Layout and Client Script tab (M11, inert) | Contacts form e2e; inventory chrome component tests via screen |
| F-05 | Contact Image placeholder (M6, inert) | `profileImageLaterModule` on create form |
| F-06–F-32, F-17.1–F-17.8 | Metadata Standard layout; owner picker, salutation prefix, lookups, date, Twitter `@`, picklists | Module definition and shared form tests; contacts form e2e |
| F-33–F-34.8 | Mailing and Other address groups; Copy Address; Clear All per group | Dual-address rendering; contacts form e2e |
| F-54 | Description Information textarea | Shared form section |
| F-55–F-56 | Form footer view controls (M11, inert) | Inventory footer on Contacts form |

Connected To is omitted on create (metadata-enabled but not shown in reference captures). Validation, save destinations, Save and New, unsaved cancel and clone follow interim Leads rules. Account Name (M3) and Vendor Name (P2) lookups are inert; Reporting To uses the Contacts record picker.

### Contacts list — implemented; QA pending (MEP-319)

| Inventory | Implementation | Verification |
| --- | --- | --- |
| SH-14 | Registered beneath Leads; list, create and detail routes resolve the Contacts definition | Registry, shell and route tests |
| L-01–L-14, L-02.1–L-02.14 | Service views; shared sort/presentation/refresh; create split button and ordered Actions menu | Component tests; Contacts e2e passed on merged service |
| L-15–L-32 | Metadata-driven filter panel, with later-module checkbox assignments | Shared panel tests; field-filter e2e passed |
| L-33–L-40, L-42–L-53; L-04.1–L-04.4; L-36.1–L-36.18 | Shared table, alphabet, row selection, pagination and detail link; row controls and email later-module handling | Shared table tests; Contacts and unchanged Leads e2e passed |
| L-41 | M5: rendered when activity data arrives; no badge is drawn now. Contact Name aligns with rows without activity. | CTO decision; activity-summary contract deferred to M5 |

Later-module controls: create arrow M6; view customization M11; Activities M5,
Campaigns M7, Latest Email Status M10, Cadences P3, Account Name filter M3;
View Settings M11; email M10, notes M6, row pulse P3. Actions preserve the
reference order; Manage Tags/Export M6, Mass Email M10, campaigns M7,
client script M11 and the unresolved Sheet view P3 remain inert.

Interim shared Leads rules: selection toolbar, page-size implementation,
unobserved create-menu items, filter operators, empty state and additional
header options. Drafts, Approve Contacts, Print View,
Show custom views as Dropdown and row ellipsis have no handler, following the
existing shared screen boundary or the explicit delivery scope. Account cells
use the merged lookup display: names are shown and later-module links remain inert.
Mass menu actions never create selection; dialogs act only on selected rows.
Print View retains its visual submenu arrow without opening a submenu. Unknown saved-view
columns have a read-only text rendering fallback; service-provided column lists
remain authoritative.

### Contacts record detail — implemented; QA pending (MEP-320)

| Inventory | Implementation | Verification |
| --- | --- | --- |
| D-01–D-09, D-32–D-35 | Shared record header and tab row; Contacts add-tags row, Send Email (M10), prev/next from list context | `e2e/contacts-detail.spec.ts` |
| D-07.1–D-07.15 | Contacts More Options menu; Clone and Delete handlers | Contacts detail e2e; shared menu tests |
| D-36–D-51 | Business card, details, Timeline History filter; upcoming actions (M12, inert) | Contacts module tests; contacts detail e2e |
| D-10–D-31, D-52–D-95 (rail/cards) | Contacts related-list definitions; M2 Reporting Contacts data card | Related-list component tests; contacts detail e2e |
| D-89–D-91 | Reporting Contacts rail plus, New/Add → create with Reporting To prefill; Hierarchy View drawn without handler | Contacts detail e2e |

Share and Print Preview are drawn without handlers (separate tasks). Find and Merge
Duplicates opens the shared merge flow (MEP-352). Connected Records (`?`) uses
`laterModule="P3"`. Lower Contact Information field order follows layout metadata
(interim rule).

### Find and Merge Duplicates (record detail) — implemented; QA pending (MEP-352)

| Inventory | Implementation | Verification |
| --- | --- | --- |
| X-27 – X-37.5 | Criteria, matching table, selection (2–3), Search / Next / Clear | `merge-criteria.test.ts`, `merge-field-selection.test.ts`, `merge-matching-table.test.tsx`, `e2e/merge-duplicates.spec.ts` |
| X-38 – X-44.13.3 | Comparison header, conflicts-only, per-field and column selection, merge confirm | `merge-field-selection.test.ts`; `merge-comparison.test.tsx`; `e2e/merge-duplicates.spec.ts` |
| D-07.5 / Leads More Options | Menu handler → `/merge` route | Contacts/Leads more-options tests; e2e |
| SH-49 (documentary shell) | Not drawn on merge screens | N/A (out of scope per task) |

### Deduplicate (list Actions) — implemented; QA pending (MEP-354)

| Inventory | Implementation | Verification |
| --- | --- | --- |
| L-14.8 / X-15.10 | Deduplicate Contacts (row 8) and Deduplicate Leads (row 10) start the job without a row selection | `e2e/deduplicate.spec.ts`; Leads menu rows in `leads/list-config.ts` |
| X-45.1 – X-45.4, X-46, X-47 | Select Field panel: unique fields first, then the documented order, then the module's other text, email and phone fields; Email preselected; a fourth field is refused | `dedup-config.test.ts`, `dedup-job.test.tsx` |
| X-48 – X-50 | Deduplicate confirmation with the Auto-Merge and Resolve Conflicts notes and Learn More | `dedup-job.test.tsx`; e2e |
| X-51 | Running notice with OK; the result waits for it | `dedup-job.test.tsx`; e2e |
| X-52 – X-54 | Conflict popup: merged groups and removed records, Do it later, Resolve Now | `dedup-job.test.tsx`; e2e |
| X-55 – X-60 | Conflict groups page: field tabs, range with arrows, match value and Duplicates columns, View; groups over three ask for three records first; the shared comparison merges | `dedup-conflict-screen.test.tsx`; e2e |

Later-module controls: none on these screens; the Leads menu rows of later modules
(M6, M7, M10, M11, M12, P3) are drawn inert with `laterModule`.

Interim rules: the automatic master is chosen by the service and is not selectable
in the automatic path, while conflict resolution offers the master radio (MEP-352
comparison); "Do it later" only closes the popup and the groups are found again from
the same fields, because no emailed link or three-day token exists (M10); the merged
and removed counts in the popup are our own wording, as the reference documents no
result copy; the list refreshes through the existing query invalidation.

### Assigned to Module 2 at the Module 1 gate

| Capability | Spec section |
| --- | --- |
| Global search across modules | `app-shell.md` › Actions; `global-search.md` |
| Find and Merge Duplicates; Deduplicate, for Leads and Contacts | `leads.md` › Actions; `duplicates.md` |
