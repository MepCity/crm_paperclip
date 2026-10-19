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

Specs: `contacts.md`, `contacts-record-detail.md`, `contacts-form.md`,
`global-search.md`, `duplicates.md`. Closing QA in MEP-355 walked the seven
implementation areas below against the cited spec inventories and the
reference captures.

### Assigned to Module 2 at the Module 1 gate

| Capability | Spec section |
| --- | --- |
| Global search across modules | `app-shell.md` › Actions; `global-search.md` |
| Find and Merge Duplicates; Deduplicate, for Leads and Contacts | `leads.md` › Actions; `duplicates.md` |

### Global search layer — done; QA MEP-355 (MEP-349)

| Inventory | Implementation | Verification |
| --- | --- | --- |
| SH-27 | Search records is first in the top bar right controls on every shell screen | Shell and global-search component tests; global-search e2e |
| S-10, S-10.1–S-10.7, S-13 | Module selector and module search; registry supplies shipped modules; Leads, Contacts, Accounts and Deals are selectable (MEP-415); Tasks/Meetings M5 remain inert | Selector filtering, future-module no-op and module-scoped request tests |
| S-11, S-14 | Empty focused query; three-character minimum; 300 ms debounce; hash prefix selects nameOrTags and shows Record Name badge | Component request tests |
| S-12.1–S-12.15 | Record history per organization/user; newest first, unique module/id, capped at 15; absent when empty | History storage and record navigation tests |
| S-15–S-18 | Module groups, first five records, detail navigation; email M10 and call M5 inert; advanced route preserves query/module; Deals layer rows use the Deals screen header and open Deal detail (MEP-415) | Component tests; global-search e2e; MEP-355 re-walk (short query and `Deal` layer group) |

Interim rules: localStorage history, substring module filtering, debounce and group cap,
shared no-records copy and error Alert; Escape/outside dismissal and focus restoration.
Assistant and cross-application links use neutral labels and remain inert (P3).
Unavailable storage does not prevent record navigation. No tokens are changed.

### Contacts create / edit / clone form — done; QA MEP-355 (MEP-321); fixes MEP-390

| Inventory | Implementation | Verification |
| --- | --- | --- |
| F-01–F-04, F-57 | Shared form strip; Edit Page Layout and Client Script tab (M11, inert) | Contacts form e2e; inventory chrome component tests via screen |
| F-05 | Contact Image (M6, inert): silhouette inside the control; title and portrait stay separate | `record-form-screen-contacts-layout.test.tsx`; contacts form e2e |
| F-06–F-32, F-17.1–F-17.8 | Metadata Standard layout; owner picker, salutation prefix, lookups, date, Twitter `@`, picklists | Module definition and shared form tests; contacts form e2e |
| F-33–F-34.8 | Mailing and Other address groups; Copy Address; Clear All per group | Dual-address rendering; contacts form e2e |
| F-54 | Description Information textarea | Shared form section |
| F-55–F-56 | Form footer view controls (M11, inert) | Inventory footer on Contacts form |

Connected To is omitted on create (metadata-enabled but not shown in reference captures). Validation, save destinations, Save and New, unsaved cancel and clone follow interim Leads rules. Account Name (M3) lookup uses the Choose Account record picker (MEP-343, interim rule shared with Accounts); Vendor Name (P2) lookup remains inert; Reporting To uses the Contacts record picker.

### Contacts list — done; QA MEP-355 (MEP-319)

| Inventory | Implementation | Verification |
| --- | --- | --- |
| SH-14 | Registered beneath Leads; list, create and detail routes resolve the Contacts definition | Registry, shell and route tests |
| L-01–L-14, L-02.1–L-02.14 | Service views; shared sort/presentation/refresh; create split button and ordered Actions menu | Component tests; Contacts e2e passed on merged service |
| L-15–L-32 | Metadata-driven filter panel, with later-module checkbox assignments; Account Name filter active (MEP-343) | Shared panel tests; field-filter e2e passed |
| L-33–L-40, L-42–L-53; L-04.1–L-04.4; L-36.1–L-36.18 | Shared table, alphabet, row selection, pagination and detail link; row controls, Account Name link to Account detail (L-43, MEP-343) and email later-module handling | Shared table tests; Contacts and unchanged Leads e2e passed |
| L-41 | M5: rendered when activity data arrives; no badge is drawn now. Contact Name aligns with rows without activity. | CTO decision; activity-summary contract deferred to M5 |

Later-module controls: create arrow M6; view customization M11; Activities M5,
Campaigns M7, Latest Email Status M10, Cadences P3;
View Settings M11; email M10, notes M6, row pulse P3. Actions preserve the
reference order; Manage Tags/Export M6, Mass Email M10, campaigns M7,
client script M11 and the unresolved Sheet view P3 remain inert.

Interim shared Leads rules: selection toolbar, page-size implementation,
unobserved create-menu items, filter operators, empty state and additional
header options. Drafts, Approve Contacts, Print View,
Show custom views as Dropdown and row ellipsis have no handler, following the
existing shared screen boundary or the explicit delivery scope. Account cells
use the merged lookup display: names are shown and link to the active Account
record detail route (L-43, MEP-343).
Mass menu actions never create selection; dialogs act only on selected rows.
Print View retains its visual submenu arrow without opening a submenu. Unknown saved-view
columns have a read-only text rendering fallback; service-provided column lists
remain authoritative.

### Contacts record detail — done; QA MEP-355 (MEP-320); fixes MEP-388

| Inventory | Implementation | Verification |
| --- | --- | --- |
| D-01–D-09, D-32–D-35 | Shared record header and tab row; Account subtitle links to Account detail (D-03, MEP-343); Contacts add-tags row; Send Email as primary later-module command (M10); prev/next from list context | `e2e/contacts-detail.spec.ts` |
| D-07.1–D-07.15 | Contacts More Options menu; Clone and Delete handlers | Contacts detail e2e; shared menu tests |
| D-36–D-51 | Business card and Contact Information with phone call icons (D-37, D-41); balanced two-column Contact Information layout (MEP-388); active Account Name link (D-39) and inline edit via Choose Account picker (MEP-343); Timeline History filter; upcoming actions (M12, inert) | Contacts module tests; contacts detail e2e. Timeline panel and filter walked in MEP-355; **history rows: not walked** (seed record has no history) |
| D-10–D-31, D-52–D-95 (rail/cards) | Contacts related-list definitions; Open and Closed Activities cards without count badges until M5 activity data (D-30, D-31); M2 Reporting Contacts data card; Deals rail row active (D-14, MEP-415) | Related-list component tests; contacts detail e2e. **Reporting Contacts manager filter (MEP-380): covered by e2e "Reporting Contacts filters by manager id, not by a shared Full Name"** (not walked in MEP-355; card not reopened after the fix landed) |
| D-89–D-91 | Reporting Contacts rail plus, New/Add → create with Reporting To prefill; Hierarchy View opens Contact Hierarchy modal (D-90, MEP-421) | Contacts detail e2e |
| D-14, D-56 | Deals card lists the Deals whose Contact Name is this record (interim columns: All Deals view); New Deal opens the Deal create form with Contact Name, and Account Name when the contact has an account (MEP-415) | `e2e/contacts-detail.spec.ts`; `contacts-related-lists.test.tsx`, `related-deals-card-body.test.tsx` |
| AD-163–AD-164 | Contact Hierarchy modal Close Modal button (AD-163) and indented contact links (AD-164, MEP-421) | `contact-hierarchy-modal.test.tsx`, `e2e/contacts-detail.spec.ts` |

Share (M11) and Print Preview (M6) are later-module controls in More Options (Module
1 gate assignment). Find and Merge Duplicates opens the shared merge flow (MEP-352).
Connected Records (`?`) uses `laterModule="P3"`. Lower Contact Information field order
follows layout metadata (interim rule).

### Find and Merge Duplicates (record detail) — done; QA MEP-355 (MEP-352)

| Inventory | Implementation | Verification |
| --- | --- | --- |
| X-27 – X-37.5 | Criteria, matching table, selection (2–3), Search / Next / Clear | `merge-criteria.test.ts`, `merge-field-selection.test.ts`, `merge-matching-table.test.tsx`, `e2e/merge-duplicates.spec.ts` |
| X-38 – X-44.13.3 | Comparison header, conflicts-only, per-field and column selection, merge confirm | `merge-field-selection.test.ts`; `merge-comparison.test.tsx`; `e2e/merge-duplicates.spec.ts` |
| D-07.5 / Leads More Options | Menu handler → `/merge` route | Contacts/Leads more-options tests; e2e |
| SH-49 (documentary shell) | Not drawn on merge screens | N/A (out of scope per task) |

### Deduplicate (list Actions) — done; QA MEP-355 (MEP-354); fixes MEP-395

| Inventory | Implementation | Verification |
| --- | --- | --- |
| L-14.8 / X-15.10 | Deduplicate Contacts (row 8) and Deduplicate Leads (row 10) start the job without a row selection | `e2e/deduplicate.spec.ts`; Leads menu rows in `leads/list-config.ts` |
| X-45.1 – X-45.4, X-46, X-47 | Select Field panel: unique fields first, then the documented order, then the module's other text, email and phone fields; Email preselected; a fourth field is refused | `dedup-config.test.ts`, `dedup-job.test.tsx` |
| X-48 – X-50 | Deduplicate confirmation with the Auto-Merge and Resolve Conflicts notes and Learn More | `dedup-job.test.tsx`; e2e |
| X-51 | Running notice with OK; the result waits for it | `dedup-job.test.tsx`; e2e |
| X-52 – X-54 | Conflict popup: merged groups and removed records, Do it later, Resolve Now | `dedup-job.test.tsx`; e2e (Resolve Now walked in MEP-355; **Do it later: e2e "Contacts: Do it later closes the notice and keeps the list"**) |
| X-55 – X-60 | Conflict groups page: field tabs, range with arrows, match value and Duplicates columns, View; groups over three ask for three records first; the shared comparison merges | `dedup-conflict-screen.test.tsx`; e2e |

Later-module controls: none on these screens; the Leads menu rows of later modules
(M6, M7, M10, M11, M12, P3) are drawn inert with `laterModule`.

Interim rules: the automatic master is chosen by the service and is not selectable
in the automatic path, while conflict resolution offers the master radio (MEP-352
comparison); "Do it later" only closes the popup and the groups are found again from
the same fields, because no emailed link or three-day token exists (M10); the merged
and removed counts in the popup are our own wording, as the reference documents no
result copy; the list refreshes through the existing query invalidation. A rejected
module metadata load on the conflict-groups route and a failed conflict-groups query
each show a danger alert with Try again instead of returning to the list (MEP-395).
A failed deduplicate job returns to the field panel with a danger toast (MEP-354).

### Advanced search results page — done; QA MEP-355 (MEP-351)

| Inventory | Implementation | Verification |
| --- | --- | --- |
| S-19, S-20, S-21, S-22 | Top bar with search input, close icon, filter toggle button, and Sort By selector (defaulting to Modified Time desc) | Component tests; `e2e/advanced-search.spec.ts` |
| S-23.<Module>, S-24.<Module>.1–.4, S-25.<Module>.* | Result cards for Leads, Contacts, Accounts, and Notes (M6); module count badges, pagination arrows, Manage columns icon button (Icons.columns), record link (Accounts with M3 inert link), and column headers | Component tests; `e2e/advanced-search.spec.ts` |
| S-26, S-27.*, S-28, S-29 | Manage Columns dialog with column search, 10-column selection limit, Cancel, and Save | Component tests; `e2e/advanced-search.spec.ts` |
| S-30, S-31.1–.8, S-32.1–.5, S-33, S-34, S-35.1–.2, S-36, S-37 | Filter panel: module checkboxes (Contacts, Accounts, Leads and Deals active — MEP-415; Tasks M5, Meetings M5, Calls M5, Products P2 inert), system field filters with operator and user picker, Apply Filter, and Clear | Component tests; `e2e/advanced-search.spec.ts` |
| S-38, S-39, S-40, S-41, S-42, S-43.* | Row actions button, phone call icon (M5 inert), email link (M10 inert), related record links, stage badge (display chip, handler-less since MEP-415), column values with list cell formatting and user display names | Component tests |
| S-46 | Bottom link "Search across applications" (P3 inert) | Component tests; `e2e/advanced-search.spec.ts` |

Notes card (M6) is rendered with count 0, pagination controls (M6 inert), Manage columns button (M6 inert), and empty table body. S-47 is unobserved in reference captures; short query (< 3 chars) shows empty state without executing search requests. Interim rules: default columns are first 5 columns from default list view, persisting in memory for current page session; 10 records per card; Sort By defaults to Modified Time desc with common system fields; field filter operators match list filter operators; empty query and loading show blank space, unexpected errors bubble to boundary.

### Module 2 gate

Closing QA: MEP-355 (re-walk and CTO approval). Milestone code reviews: MEP-356,
MEP-357. Baseline on `main` at `fd25861`. Closing fixes MEP-388, MEP-390 and MEP-395
landed after the MEP-355 walk and were verified in their own QA.

**Known gaps**

- **Later-module controls:** drawn in place and do nothing when clicked (board
  decision, MEP-292): tags, email, call icon, campaign, note / attachment /
  activity cards, Share (M11), Print Preview (M6), Contact Image (M6), Edit Page
  Layout, Client Script, Vendor lookup.
- **Activity badges:** Open / Closed Activities counts and the list activity badge
  appear when activity data arrives in M5.
- **Deals rows in search:** layer group titles show record ids instead of deal
  names until the Deals screen definition ships in M4.
- **Merge:** no note, attachment, or activity transfer and no email notification
  (each belongs to its module).
- **Drafts, Approve Contacts:** not observed in reference captures;
  behaviour unknown; drawn inert. Hierarchy View on Reporting Contacts (D-90) opens Contact Hierarchy modal with interim rules (MEP-421).
- **Shell:** only Home, Leads, Contacts, and Accounts; other tabs arrive with
  their modules.
- **Database adapter** is not wired (ADR 0002 measurement pending); Contacts runs on
  the fixture record service.

**Interim rules**

- **Contact Hierarchy modal (D-90, MEP-421):** Contact hierarchy modal opens from Reporting Contacts card. Interim rules 1–9: tree of contact's account (root = Account_Name); if contact has no account, no account row is drawn, manager (if any) is at top, contact under manager, direct reports under contact; no badge/highlight for current contact; contact links navigate to contact detail; X, Escape, and backdrop click dismiss modal and restore focus; Loading... and RelatedRecordsListError states; pagination reads up to 500 contacts in pages of 100 with fields projection (Full_Name, Reporting_To, Account_Name). Unobserved aspects: empty state, depth limit, hover-only controls, close outcome, link target, and D-90's own opened state in reference captures. Multilevel account-company tree (Member Accounts) is explicitly out of scope.
- Manual merge: the user picks the master record; bulk cleanup picks the record
  with the most recent activity as master.
- Merged-record creation metadata comes from the oldest record in the group (spec
  text overrides the conflicting screenshot).
- An empty value is not a merge conflict. "Do it later" only closes the popup;
  merged / removed count wording is ours.
- Search history lives in the browser; queries need at least three characters and
  a 300 ms debounce; advanced search shows ten records per card and keeps default
  columns for the session.
- Form validation, Save and New, cancel, and clone; list selection bar, page size,
  and empty state follow the Leads patterns.

**Open items**

- Route and search module constants, and the Share / Print Preview rows closing the
  menu when clicked: **closed (MEP-383)**.
- Shared-component visual differences with Leads (Last Update placement, portrait
  initials vs silhouette, Edit Page Layout placement, Client Script tab colour):
  end-of-project batch in MEP-281.
- **Do it later** on the deduplicate conflict popup was not clicked in the closing
  walk; covered by automated tests only.
- When the database adapter lands, search and merge contract tests will run against
  it; no rework is expected.

## Module 3 — Accounts

Specs: `accounts.md`, `accounts-record-detail.md`, `accounts-form.md`. Closing QA in
MEP-384 walked the three implementation areas below against the cited spec inventories
and the reference captures.

### Accounts record detail — done; QA MEP-384 (MEP-342); fixes MEP-391, MEP-393, MEP-394

| Inventory | Implementation | Verification |
| --- | --- | --- |
| AD-01–AD-09, AD-32–AD-35, AD-99 | Shared record header; building placeholder (M6), Website link; Send Email as primary later-module command (M10, MEP-394); Last Update on the tab row with clock icon (MEP-394); prev/next from list context | `e2e/accounts-detail.spec.ts`; `accounts-last-update.test.ts` |
| AD-07.1–AD-07.13 | Accounts More Options menu (no Run Macro / Enroll to Cadence); Clone and Delete; Find and Merge Duplicates opens the shared merge flow (MEP-393, after MEP-384 walk) | Accounts detail e2e; `accounts-record-more-options.test.ts` |
| AD-37–AD-41, AD-100, AD-103–AD-104 | Business card, Contacts summary, details; call icons (M5, inert) | Accounts detail e2e; detail section tests |
| AD-159–AD-162 | Timeline History only; filter and upcoming actions (M12, inert) | Accounts detail e2e. **Populated history rows: e2e "Timeline History shows a row after an inline edit" (`test.fixme`, Accounts Timeline receives no events; bug reported on MEP-672)** |
| AD-10–AD-31, AD-96–AD-102, AD-98 | Accounts related-list rail and cards; Open and Closed Activities cards draw no count badge when the card holds zero records (MEP-394); Contacts badge from service counts | Related-list tests; accounts detail e2e. Related-list query failures show an error state instead of an empty list (MEP-391) |
| AD-115–AD-120, AD-154 | Contacts card data and New prefill; Member Accounts card with Account Owner display names (MEP-393), New prefill, and active rail plus (MEP-387); Hierarchy View opens Contact Hierarchy modal (AD-115, MEP-421) | Accounts detail e2e |
| AD-112–AD-114 | Deals rail plus and Deals card: the Deals whose Account Name is this record (interim columns: All Deals view); New Deal opens the Deal create form with Account Name prefilled; Assign is handler-less like the Contacts card Assign (MEP-415) | `e2e/accounts-detail.spec.ts`; `accounts-related-lists.test.tsx`, `related-deals-card-body.test.tsx` |
| AD-163–AD-164 | Contact Hierarchy modal Close Modal button (AD-163) and indented contact links (AD-164, MEP-421) | `contact-hierarchy-modal.test.tsx`, `e2e/accounts-detail.spec.ts` |

Share (M11) and Print Preview (M6) are later-module controls in More Options (same as
Contacts; open states not observed in reference captures). **Hierarchy View (AD-115):**
opens Contact Hierarchy modal (MEP-421, seen in m3h-hierarchy-open). Notes rail badge
omitted when count is zero. Billing/Shipping and lower detail field order follow Contacts
address interim rules. Contacts detail Account subtitle and Account Name links to Accounts
detail were walked in MEP-384 (L-43 / D-03 / D-39 cross-check).

### Accounts create / edit / clone form — done; QA MEP-384 (MEP-341); fixes MEP-389, MEP-394

| Inventory | Implementation | Verification |
| --- | --- | --- |
| AF-01–AF-04, AF-47 | Shared form strip with `Create Account`; Edit Page Layout beside the title and Client Script tab (M11, inert, MEP-394) | `e2e/accounts-form.spec.ts`; inventory chrome tests |
| AF-05 | Account Image building placeholder above the title (M6, inert; silhouette separate from label, MEP-394) | `profileImageLaterModule` + `profileImageIcon` on the Accounts definition; accounts form e2e |
| AF-06–AF-24 | Spec eight-row Account Information grid; owner picker, Parent Account lookup, four picklists, currency prefix and passive information icon, numeric and bigint entries; Account Number loads and saves on edit (MEP-389) | Module definition, shared form tests; accounts form e2e |
| AF-11.1–AF-11.18 | Observed record-picker chrome on the Parent Account dialog | `select-record-dialog.test.tsx`; accounts form e2e |
| AF-13.1–AF-13.8 | Searchable Account Type panel (`searchablePicklists` form rule) | accounts form e2e |
| AF-25–AF-43 | Billing and Shipping address groups; Copy Address; Clear All per group | Dual-address rendering; accounts form e2e |
| AF-30.1, AF-35.1–AF-35.8 | State list with only `-None-` while Country is unset; country panel search and options | Shared composite input tests |
| AF-44 | Description Information textarea | Shared form section |
| AF-45–AF-46 | Form footer view controls (M11, inert) | Inventory footer on the Accounts form. **AF-45 – AF-46: e2e "form footer view controls draw below the fold and stay inert"** |

Connected To is omitted on create (metadata-enabled but absent from the reference form captures).
Registering Accounts retires the transitional inert state of Account Name references: the Contacts
form lookup, the Contacts list cell and the Contacts detail now resolve to Account record links
(MEP-384 Contacts cross-check). Account Number (`bigint`) draws the single-line numeric entry
with the integer validation rule and is written as decimal text, the only shape the service
accepts for a long integer.

`laterModule`: AF-05 image (M6), AF-11.16 picker handset (M5), AF-01/AF-45/AF-46/AF-47 customization
and automation (M11). Drawn without handlers (never exercised in the capture): AF-11.3 New Account,
AF-11.4 table mark, AF-11.6/8/10/12 column options, AF-11.13 Filter, AF-16 currency information icon.
AF-48 Channels and AF-49 Threads (`?`, shell utility strip) are not painted by this task.

Interim rules (behaviour not observed in the reference, taken from the Contacts form): Copy Address
direction labels, error copy and focus order, unsaved-changes confirmation, save destination,
Save and New reset, the whole Edit Account form and the clone rule.

### Accounts list — done; QA MEP-384 (MEP-340)

| Inventory | Implementation | Verification |
| --- | --- | --- |
| SH-15 | Registered in registry.ts beneath Contacts; list and detail routes resolve Accounts definition | `registry.test.ts`, `definition.test.ts`, `accounts-list.spec.ts` |
| AL-01, AL-52 | Pinned view tab strip supporting "All Accounts" and "All Locked Accounts" tabs alongside view pill | `view-tab-strip.test.tsx`, `accounts-list.spec.ts` |
| AL-02, AL-02.2–AL-02.9 | View ellipsis menu with 8 stock views in reference CRM order; custom view switching | `view-tab-strip.test.tsx`, `accounts-list.spec.ts` |
| AL-02.10–AL-02.12 | Customization items in view menu: Dropdown toggle, New Custom View (M11), Manage Custom View (M11) | `view-tab-strip.test.tsx`. **AL-02.10: e2e "Accounts view menu: show custom views as Dropdown stays inert"** (item is inert; the strip never switches to a dropdown) |
| AL-03, AL-64 | Filter toggle button, list refresh button | `accounts-list.spec.ts` |
| AL-04 | Sort popover by Account Name and field dictionary labels | `accounts-list.spec.ts`, `list-config.test.ts` |
| AL-05–AL-11 | Seven shared view type icons: List, Kanban, Sheet, Chart, Timeline, Two horizontal bars, Down chevron | Shared component tests. AL-06 – AL-11: drawn inert; only list presentation is active (interim rule) |
| AL-12, AL-13 | Create Account primary button; attached arrow dropdown (M6, inert) | `accounts-list.spec.ts` |
| AL-14.1–AL-14.10 | 10 Actions menu items in reference order; Mass Update and Deduplicate Accounts dialogs open from Actions | `accounts-list.spec.ts`. Drafts and Print View close the menu without navigation (not observed open in reference; same as Contacts) |
| AL-15, AL-16, AL-20–AL-25 | System defined filter rows including Locked, Record Action, Related Records Action, Touched Records, Untouched Records, and Cadences (P3); no Activities/Campaigns/Latest Email Status (L-17–L-19 absent) | `list-filters.test.ts`, `accounts-list.spec.ts`. AL-20 – AL-24: rows drawn disabled; open filter behaviour not observed (same as Contacts) |
| AL-26, AL-27, AL-53–AL-59 | Field filters with search and visible field rows (Account Name, Account Number, Account Owner, Account Site, Account Type, Annual Revenue, Billing Address, Billing Address - City; L-28–L-31 absent); no "Filter By Related Modules" | `list-filters.test.ts`, `accounts-list.spec.ts` |
| AL-33 | View Settings gear button (M11, inert) | `accounts-list.spec.ts` |
| AL-34, AL-40 | Header and row-level selection checkboxes; selection bar integration | `accounts-list.spec.ts` |
| AL-35, AL-39, AL-60, AL-61 | Columns: Account Name, Phone, Website, Account Owner | `record-table.test.tsx`, `accounts-list.spec.ts` |
| AL-36 | Alphabet filter (A-Z, All) on Account Name link column | `accounts-list.spec.ts` |
| AL-42 | Account Name row link navigates to record detail route | `accounts-list.spec.ts` |
| AL-45, AL-46 | Row three dots button; note bubble button (M6, inert) | `record-table.test.tsx`, `accounts-list.spec.ts` |
| AL-48–AL-51 | Pagination: count, page size, next/previous links | `accounts-list.spec.ts` |
| AL-62 | Handset call icon button next to Phone value (M5, inert) | `record-table.test.tsx`, `accounts-list.spec.ts` |
| AL-63 | Website cell renders active clickable hyperlink with https:// normalization | `cell-value.test.tsx`, `accounts-list.spec.ts` |

Later-module controls: Create Account arrow M6; view customization M11;
Cadences P3; View Settings M11; handset icon M5; notes M6; Manage Tags M6;
Export Accounts M6; Create Client Script M11; Sheet view P3.
Absent from Contacts: L-17–L-19, L-28–L-31, L-37–L-38, L-41, L-43–L-44, L-47 (no row activity pulse or badge column space; selection checkbox is immediately before Account Name).
Mass action flows (Mass Update, Change Owner, Delete Account) wire to selection bar dialogs.
Contacts Account Name lookup cells link to `/tab/Accounts/:id` active record routes (MEP-384
Contacts cross-check). Global search with Accounts selected navigates to detail (MEP-384).

### Module 3 gate

Closing QA: MEP-384 (walk and CTO approval). Milestone code reviews: MEP-385, MEP-386.
Baseline on `main` at `4a8a014`. Closing fixes MEP-387, MEP-389, MEP-391, MEP-393, MEP-394,
and MEP-392 landed after the MEP-384 walk and were verified in their own QA (MEP-393 and
MEP-394 were approved but not yet on `main` when the gate summary was written; both have
merged since).

**Known gaps**

- **Later-module controls (M5+):** activity, note, attachment, and email / product card
  behaviour; tags, export, page layout, Cadences, and Sheet view remain drawn in place and
  inert when clicked. The Deals card and its rail row are active since MEP-415; Assign stays
  handler-less, same as the Contacts card Assign.
- **Not observed open in reference captures (same state as Contacts):** Share, Print Preview,
  Drafts, Print View, the five system filters (Locked, Record Action, Related Records Action,
  Touched Records, Untouched Records), and non-list view type icons.
- **Hierarchy View (AD-115):** implemented in MEP-421; opens Contact Hierarchy modal with interim rules 1–9.
- Connected To is omitted on the create form; synthetic seed data has no populated Timeline
  history (empty shell was walked).
- **Not walked in closing QA:** show custom views as a dropdown (AL-02.10) and form footer
  view controls below the fold (AF-45 – AF-46).

**Interim rules**

- **Contact Hierarchy modal (AD-115, MEP-421):** Contact hierarchy modal opens from Contacts card. Interim rules 1–9: root = account; contacts of account fetched with Account_Name = account; Reporting_To in set nests under parent; cycle protection ensures single render and fallback to root; siblings sorted by Full_Name ascending; empty state renders only root account row with no empty text; contact links navigate to contact detail; X, Escape, and backdrop click dismiss modal and restore focus; Loading... and RelatedRecordsListError states; pagination reads up to 500 contacts in pages of 100 with fields projection (Full_Name, Reporting_To, Account_Name). Unobserved aspects: empty state, depth limit, hover-only controls, close outcome, link target, and D-90's own opened state in reference captures. Multilevel account-company tree (Member Accounts) is explicitly out of scope.
- More Options, delete confirmation, Timeline shell, record page footer, and form error copy,
  focus order, unsaved-changes handling, post-save destination, Save and New, and Copy Address
  directions follow the Contacts patterns.
- Billing and Shipping addresses use the Contacts address component; Choose Account uses the
  same record picker as Parent Account.
- Member Accounts columns come from the All Accounts view; the Contacts summary shows the first
  contact; the email card uses the `Sent` label; sort labels come from the field dictionary.

**Open items**

- **Board question (gate card):** resolved in MEP-421; Hierarchy View opens Contact Hierarchy modal based on m3h-hierarchy-open capture and interim rules 1–9.
- Assigning a parent account to itself or into a cycle is not blocked; the reference rule was
  not observed and none was invented.
- Related-list cards cap at 100 records with no pagination; reference behaviour above that cap
  was not captured; the same cap applies to the Contacts card.
- Closing QA screenshots predate the fix tasks; corrected rows were verified in fix QA, not in
  a full Module 3 re-walk.
- The database adapter is not wired (ADR 0002, MEP-40); Accounts runs on the fixture record
  service.

## Module 4 — Deals

Specs: `deals.md`, `deals-record-detail.md`, `deals-form.md`, `deals-pipeline.md` (stage transitions), shared `record-detail.md` and `accounts-record-detail.md` behaviour.

### Deals list — done; QA MEP-451 (MEP-410)

Inventory is SH-16 and DL-01–DL-27, DL-65–DL-69. Board controls DL-70–DL-81 are covered under Deals stage board (DP-70–DP-81).
DL-18 is not in the Deals inventory (the Campaigns system filter is absent).

| Inventory | Implementation | Verification |
| --- | --- | --- |
| SH-16 | Deals rail link under Accounts | `registry.test.ts`, `shell.spec.ts`, `deals-list.spec.ts` |
| DL-01 | Single pinned tab, All Deals | `list-config.test.ts`, `deals-list.spec.ts` |
| DL-02 | View menu: 11 service views plus the shared menu controls; My Deals omits Owner | `deals.test.ts`, `deals-list.spec.ts` |
| DL-03 | Filter toggle | shared list toolbar, `deals-list.spec.ts` |
| DL-04 | Sort by Deal Name | `list-config.test.ts`, `deals-list.spec.ts` |
| DL-05–DL-11 | Seven view-type icons. Default presentation is Board (DP-06); List (DP-05) switches to table | `view-type-switcher.test.tsx`, `deals-list.spec.ts`, `deals-board.spec.ts` |
| DL-12 | Create Deal opens the create route | `list-config.test.ts`, `deals-list.spec.ts` |
| DL-13 | Create arrow, M6, inert | `deals-list.spec.ts` |
| DL-14 | Actions menu matches the Accounts row set with Deal / Deals labels | `list-config.test.ts`, `deals-list.spec.ts` |
| DL-15–DL-16 | Filter search and System Defined Filters toggle | `deals-list.spec.ts` |
| DL-17, DL-19–DL-25 | System rows in capture order. Activities M5, Latest Email Status M10, Cadences P3 are inert. Locked, Record Action, Related Records Action, Touched Records and Untouched Records stay disabled like Accounts | `list-filters.test.ts`, `deals-list.spec.ts` |
| DL-26, DL-27, DL-65–DL-69 | Field rows: Account Name, Amount, Campaign Source (M7, inert), Closing Date, Connected To, Contact Name, then remaining metadata fields | `list-filters.test.ts`, `deals-list.spec.ts` |

Temporary table rules (not painted in the Deals capture; Accounts table behaviour): row selection, Deal Name alphabet menu, pagination and total, refresh, row menu, Deal Name detail link, Account Name and Contact Name links, Amount drawn like the board card (`TRY 31,800.00`, empty stays empty; Deals only), Closing Date through the shared date cell (`Sep 26, 2026`, while board cards draw `dd.MM.yyyy`; the difference is a temporary rule), Stage as plain text. Selection, alphabet, paging, both links and the Amount filter are covered by `deals-list.spec.ts`.

Later-module controls: DL-13 M6; DL-17 M5; DL-19 M10; DL-25 P3; DL-66 M7; Manage Tags M6; Export Deals M6; Create Client Script M11; Sheet view P3. View Settings is M11, same as Accounts. Drafts, Deduplicate Deals and Print View stay handler-less, same as Accounts.

### Deals record detail — done; QA MEP-453 (MEP-412)

| Area | Inventory | Tests |
| --- | --- | --- |
| Header, tags, actions | DD-01, DD-04–DD-07, DD-90 | `deals-detail.spec.ts` |
| Related-list rail | DD-10–DD-31 (Deals entries), DD-54–DD-58 (badges per spec) | `deals-detail.spec.ts`, `deals-related-lists.test.tsx` |
| Tabs and last update | DD-32–DD-35 | `deals-detail.spec.ts` |
| Stage bar and verify dialog | DD-60–DD-65, DD-91–DD-92 | `deals-detail.spec.ts`, `stage-bar.test.tsx` |
| Business card | DD-66 (card fields) | `deals-detail.spec.ts`, `deals-detail-sections.test.ts` |
| Contact Person summary | DD-66–DD-68 | `deals-detail.spec.ts` |
| Details and inline edit | Deal Information, Description Information | `deals-detail.spec.ts` |
| More Options | DD-07.1–DD-07.15 | `deals-record-more-options.test.ts`, `deals-detail.spec.ts` |
| Timeline | DD-70–DD-72 | `deals-detail.spec.ts`, `deals-timeline.test.ts` |
| SALES SUMMARY rail section | Lead Conversion Time, Sales Cycle Duration | `deals-detail.spec.ts` |

Next Action summary (DD-69) omitted until Activities (M5). Related-card interiors deferred to the lower-half issue.

### Deals record detail — related cards and lower half — done; QA MEP-453 (MEP-414)

| Area | Inventory | Tests |
| --- | --- | --- |
| Related-list card set | DD-93–DD-149 (card headers, controls, columns, footer DD-147–DD-149) | `deals-related-lists.test.tsx`, `deals-detail.spec.ts` |
| Stage History data | DD-99–DD-106, DD-57 rail badge | `deal-stage-history-card-body.tsx`, `deals-detail.spec.ts` |
| Contact Roles card rows + rail count | DD-125–DD-132, DD-58 | `contact-roles-card-body.test.tsx`, `deals-detail.spec.ts` |
| Scroll To Top | DD-98 | `deals-detail.spec.ts`, shared record detail e2e |
| Lower detail sections | Deal Information, Description Information | `deals-detail-sections.test.ts`, `deals-detail.spec.ts` |
| SALES SUMMARY | Lead Conversion Time, Sales Cycle Duration | `deals-detail.spec.ts` |

**Interim rules:** Quotes card upper controls follow Accounts (not observed in reference). Open Activities column selector uses the untranslated label from the capture (DD-111). Emails scope selector label differs from Accounts (DD-137). Contact Roles upper actions remain inert pending the dialog implementation (MEP-544).

### Deals create / edit / clone form — done; QA MEP-453 (MEP-440)

| Inventory | Implementation | Verification |
| --- | --- | --- |
| DF-01 | Edit Page Layout beside the form title (M11, inert) | shared form chrome, `e2e/deals-form.spec.ts` |
| DF-02–DF-04 | Cancel, Save and New, Save in the title strip's right group | `e2e/deals-form.spec.ts` |
| DF-05, DF-06 | Deal Owner field on the session owner, with the Select User dialog behind its lookup icon | `e2e/deals-form.spec.ts`, `select-user-dialog.spec.ts` |
| DF-07 | Deal Name input with its required marker | `e2e/deals-form.spec.ts` |
| DF-08, DF-09 | Account Name lookup entry plus the Choose Account picker re-used from the Accounts form | `e2e/deals-form.spec.ts` |
| DF-10, DF-11, DF-12 | Type, Next Step and Lead Source in the spec's left column | `e2e/deals-form.spec.ts`, `deals-form-rules.test.ts` |
| DF-13, DF-14 | Contact Name lookup entry with the same picker shape, titled Choose Contact and searched by Contact Name | `e2e/deals-form.spec.ts`, `deals-form-rules.test.ts` |
| DF-15, DF-16, DF-17 | Amount with the home-currency prefix and the information icon (icon drawn without a handler) | `e2e/deals-form.spec.ts` |
| DF-18 | Closing Date on the shared masked date entry (DD.MM.YYYY) | `e2e/deals-form.spec.ts`, `field-input.test.tsx` |
| DF-19 | Stage select holding the nine metadata stages in order | `e2e/deals-form.spec.ts`, `deals-form-rules.test.ts` |
| DF-20 | Probability (%) as a bounded integer entry, refilled by the selected stage's metadata probability and still editable by hand | `deals-form-rules.test.ts`, `form-model.test.ts`, `field-input.test.tsx`, `e2e/deals-form.spec.ts` |
| DF-21, DF-21.1, DF-21.2 | Expected Revenue read-only with its own currency prefix and lock; never computed in the form | `e2e/deals-form.spec.ts` |
| DF-23, DF-24 | Campaign Source entry and lookup icon drawn in place, inert (M7 `laterModule`) | `e2e/deals-form.spec.ts`, `field-input.test.tsx` |
| DF-25, DF-29 | Description multiline editor with its lower-right resize grip | `e2e/deals-form.spec.ts` |
| DF-26, DF-27 | Form footer: Create Form Views label with Standard View and Create a custom form page (M11, inert) | `e2e/deals-form.spec.ts` |
| DF-28 | Client Script tab on the page's right edge (M11, inert) | `e2e/deals-form.spec.ts` |
| — | Create-route query-parameter prefill (Stage, Account_Name, Contact_Name and any other create-visible field) | `create-prefill-params.test.ts`, `e2e/deals-form.spec.ts` |
| — | Edit on a lost stage paints Reason For Loss under Stage; other stages and create leave it out | `deals-form-rules.test.ts`, `form-model.test.ts`, `e2e/deals-form.spec.ts` |
| — | Deals registered in the module registry: nav rail, Create Records row, module search result and all six routes | `registry.test.ts`, `shell.test.tsx`, `create-records.test.tsx`, `global-search.test.tsx`, `e2e/shell.spec.ts` |

Interim rules (behaviour the capture did not observe): error copy, focus order,
unsaved-changes confirmation, save destination and Save and New reset taken from
the Accounts form; the whole Edit Deal form; the Choose Contact picker's
configuration; Probability's 0–100 range; a stage prefilled through a query
parameter refilling Probability.

Known gaps: DF-01, DF-26, DF-27 and DF-28 belong to customization (M11) and
DF-23 and DF-24 to Campaigns (M7) — drawn in place, inert. The Amount information
icon is drawn without a handler because the capture never opened it. Expected
Revenue stays empty after a save: the write service produces no value for it, and
the formula is pipeline research (MEP-353), not this capture.

### Deals stage board — done; QA MEP-451 (MEP-413)

Inventory is DP-05, DP-06, DP-70–DP-81, DD-L01–DD-L03.

| Inventory | Implementation | Verification |
| --- | --- | --- |
| DP-05, DP-06 | Default presentation is `"board"` (DP-06 active). View switcher switches between board and list (table, DP-05) | `deals-board.spec.ts`, `deals-list.spec.ts`, `list-config.test.ts` |
| DP-70, DP-71 | Board toolbar: STAGEVIEW select (DP-70) and pencil settings icon button (DP-71) rendered inert | `deals-board.test.tsx`, `deals-board.spec.ts` |
| DP-72–DP-77 | All 9 metadata stages in order left to right. Column headers: Stage label (DP-72–74), count (DP-75), probability percentage (DP-76), Amount sum formatted as currency (DP-77) from `summarize({ groupBy: "Stage", sum: "Amount" })` | `deals-board.test.tsx`, `deals-board.spec.ts` |
| DP-78–DP-80 | Card rows in order: Deal Name link (DP-78), Stage text, Account Name link (DP-79), Deal Owner text, Contact Name link (DP-80), Amount currency, Closing Date (`dd.MM.yyyy`). Empty fields omitted. Column limit: list page size | `deals-board.test.tsx`, `deals-board.spec.ts` |
| DP-81 | Task icon (M5) omitted until activity module lands | CTO decision; deferred to M5 |
| DD-L01–DD-L03 | Column header selection checkbox (DD-L01), opposing arrow collapse/expand (DD-L03), and footer Create Deal button (DD-L02) with stage pre-selected (`writeRecordCreatePrefill`) | `record-board.tsx`, `deals-board.spec.ts` |
| Board drag & drop | Dragging card updates Stage. Moving into Closed Won / Closed Lost opens Verify Details dialog (`StageChangeDialog`: Amount, Closing Date, Stage, Reason for Loss for Lost). Save writes, Cancel rolls back. Service error rolls back card and shows danger toast | `deals-board.spec.ts`, `deals-board.tsx` |

Interim rules:
- Filter panel, views, and sort apply to board cards. Pagination, row selection, and selection bar are omitted in board presentation.
- Column footer Create Deal sets session prefill and opens `/tab/Deals/create` with preselected Stage.
- Dragging cards between open stages calls `update("Deals", id, { Stage })` immediately. Dragging into terminal stages (Closed Won, Closed Lost, Closed Lost to Competition) opens the Verify Details dialog.

- Verify Details dialog on board shows the home currency symbol prefix (`TL` fallback), like record detail (DP-99).
- Board card Closing Date in an open stage before today draws in danger colour; today, later dates and closed stages stay plain (DP-80). Deal Name draws in the bold title weight (DP-78).
- Board presentation draws no refresh button; the table presentation keeps it.

### Deals links in earlier modules — done; QA MEP-453 (MEP-415)

`LIVE_MODULE_KEYS` carries M4, so every control keyed to Deals draws active: the Deals
card and rail row in Accounts and Contacts, the converted-deal lookup in Leads, and the
Deals entries in global and advanced search.

| Inventory | Implementation | Verification |
| --- | --- | --- |
| AD-112–AD-114 | Accounts Deals card data (Account Name filter), rail plus and New Deal prefill; Assign handler-less | `e2e/accounts-detail.spec.ts`, `accounts-related-lists.test.tsx` |
| D-14, D-56 | Contacts Deals card data (Contact Name filter) and New Deal prefill with Contact Name plus the person's Account Name | `e2e/contacts-detail.spec.ts`, `contacts-related-lists.test.tsx` |
| Card body | Shared `RelatedDealsCardBody`: default-view columns, Deal Name detail link, values through the shared field display | `related-deals-card-body.test.tsx` |
| S-10, S-15–S-18, S-30/S-31, S-42 | Deals is selectable in the module selector, its filter checkbox is active, its search rows link to Deal detail, and the stage chip draws unlocked | `global-search.test.tsx`, `advanced-search-*` tests |
| Leads Converted Deal | Generic lookup display resolves the registered Deals route; no Deals-keyed control is drawn in Leads | `field-value.test.tsx` (registered Deals lookup) |

Handler-less M4 controls: Accounts Deals card Assign (mirrors the Contacts card Assign),
advanced-search stage chip (reference behaviour is "display stage"). Leads conversion
itself is untouched; the seeded Leads records carry no converted references, so the
converted-deal link has no fixture to exercise.

### Module 4 gate

Closing QA: MEP-453 (Deals form, record detail, stage transitions, earlier module links; CTO approval) and MEP-451 (Deals list and stage board; CTO approval). Milestone code reviews: MEP-412, MEP-414, MEP-440, MEP-410, MEP-413, MEP-415. Baseline on `main` at `828d552`. Fixes MEP-469 verified on `main`.

**Known gaps**

- **Later-module controls (M5+):** activity, note, attachment, campaign, cases, email, customization, automation, and commerce controls (M5–M12, P2, P3) remain drawn in place and inert when clicked (`data-later-module`).
- **Contact Roles card (DD-125–DD-132):** rows (Contact Name and Account Name link to their detail pages, Phone, Email, Role Name) and the rail count badge (DD-58) are live; upper actions (Add Contacts Roles, Edit All, table icon) stay handler-less until MEP-544.
- **Accounts Deals card Assign (AD-113):** drawn handler-less, mirroring the Contacts card Assign.
- **Expected Revenue on form (DF-21):** read-only without a live client preview; the server computes `Amount × Probability / 100`, rounded to two decimals, after stage probability defaults, and returns the value after saving. Blank Amount yields `null`. This is an interim CTO rule because the exported metadata provides no formula. Seed, create, update, mass update and merge use the same Deals rule. CSV persistence is not implemented yet. Per Platform Lead decision MEP-673, client-supplied Expected_Revenue is rejected by shared read-only validation and stored values remain unchanged. Open gate question: this retains existing validation rather than the CTO wording requesting silent ignoring; confirm this interim difference at the module gate. Blank Probability follows existing stage-default rules; revenue uses the stored Probability.
- **Amount information icon (DF-17):** drawn without a handler (unopened in reference capture).
- **Advanced search stage chip (S-42):** chip renders stage label for display only; no interactive filtering.
- **Kanban configuration and multi-pipeline:** Kanban settings window (DP-90–DP-93, DP-103), Manage Kanban Views window (DP-95, DP-111, DP-112) and the create-mode Share this with choice (DP-110) are done; Stage is the only Categorize By option and Mono Color the only Header Style (DP-94 pending). Gaps: Manage Kanban Views has no reordering or deleting (movements not observed), Selected users is drawn disabled (user picker not observed), and the multi-pipeline selector (DP-96) and pipeline management remain out of scope for Module 4.
- **Timeline history:** empty shell walked (seed deal record carries no prior audit events).
- **Leads converted deal:** generic lookup display resolves the registered Deals route; seeded Leads records carry no converted references.

**Interim rules**

- Stage board is the default presentation (`defaultPresentation: "board"`); view switcher toggles between board and table presentation.
- Stage board drag-and-drop between open stages updates Stage immediately; dragging into terminal stages (Closed Won, Closed Lost, Closed Lost to Competition) opens the Verify Details dialog.
- Verify Details dialog on record detail and board verifies Amount, Closing Date, Stage, and Reason for Loss (for Closed Lost / Lost to Competition) with home currency symbol (`TL`).
- Column footer `+ Create Deal` button on board sets session prefill (`writeRecordCreatePrefill`) and navigates to the create form with preselected Stage.
- Form field order for Deal Information follows the seven-row two-column spec layout; Reason For Loss is conditionally rendered under Stage only when the record's stage is in a lost category.
- Form validation, Save and New, unsaved-changes confirmation, save destination, error copy, and focus order follow the Accounts form patterns.
- Choose Account and Choose Contact record pickers use the shared modal picker shape; Stage selection automatically updates Probability (%) to metadata default (editable).
- Stage History card columns and Contact Roles columns follow the spec and capture order from left to right; Stage History rows record every stage transition with duration and timestamp.
- Accounts and Contacts detail Deals cards use the shared `RelatedDealsCardBody` with All Deals columns, filtered by parent record lookup.
- Deals table presentation follows Accounts table rules (row selection, Deal Name alphabet menu, pagination, refresh, row menu).
- Board card Closing Date in an open stage before today draws in danger colour; today, later dates and closed stages stay plain (DP-80). Deal Name draws in the bold title weight (DP-78).
- Board presentation draws no refresh button; the table presentation keeps it.

**Open items**

- **Board card Deal Name emphasis (DP-78):** resolved in MEP-469 with bold title styling.
- **Verify Details dialog currency on board (DP-99):** resolved in MEP-469 with home currency symbol.
- **Overdue Closing Date styling on board (DP-80):** resolved in MEP-469 with danger colour tone.
- **Table Amount formatting:** resolved in MEP-469 with currency formatting.
- **Board toolbar refresh button:** resolved in MEP-469 by removing refresh icon from board presentation.
- Shared component visual differences with Leads / Contacts to be handled in end-of-project polish.
- Database adapter remains unwired (ADR 0002, MEP-40); Deals runs on fixture record service.
- Record detail fixes after closing QA (stage terminal buttons, rail order, Contact Person title, Stage History cells): resolved in MEP-493.


## Module 5 — Activities

### Tasks list — implemented; QA pending (MEP-459)

Inventory is SH-20, TL-01 – TL-66, TL-02.1 – TL-02.20, TL-14.1 – TL-14.6.

| Area | Inventory | Tests |
| --- | --- | --- |
| Shell entry | SH-19, SH-20 (Tasks is the first entry of the Activities group) | `tasks-list.spec.ts`, `definition.test.ts` |
| View strip and menu | TL-01, TL-02, TL-02.1 – TL-02.20 (Search filters rows by name; interim) | `tasks-list.spec.ts`, `view-tab-strip.test.tsx` |
| Toolbar | TL-03 – TL-13, TL-65 (no Sheet tile; Kanban and Timeline tiles inert; TL-13 `laterModule` M6) | `tasks-list.spec.ts`, `list-config.test.ts` |
| Actions | TL-14, TL-14.1 – TL-14.6 (Manage Tags and Export Tasks `laterModule` M6) | `tasks-list.spec.ts`, `list-config.test.ts` |
| Filter panel | TL-15 – TL-26, TL-53 – TL-61, TL-66 (no Activities, Latest Email Status, Cadences, related-modules group) | `tasks-list.spec.ts`, `list-filters.test.ts` |
| Table and footer | TL-33 – TL-42, TL-62 – TL-64, TL-48 – TL-51 (TL-33 `laterModule` M11) | `tasks-list.spec.ts` |

Interim rules: selection bar, page size, empty state and row actions follow Accounts;
Related To and Contact Name link to the related record when the target module is registered.
The detail and form parts of the definition borrow module-neutral Deals builders until the
Tasks detail and form tasks land.


### Tasks record detail — implemented (MEP-591); e2e MEP-473

| Area | Inventory | Evidence |
| --- | --- | --- |
| Header, tags, Close Task, Edit, More Options | TD-01, TD-04–TD-09 | `tasks-detail.spec.ts` |
| Tabs, last update, Timeline empty state | TD-33–TD-35 | `tasks-detail.spec.ts` |
| Business card, detail sections, Related To suffix | TD-36–TD-46 | `tasks-detail.spec.ts`, `tasks-detail-sections.test.ts` |
| Right panel: person, Deal Summary, Open Activities | TD-50–TD-73 | `tasks-detail.spec.ts`, `activity-relation-panel.test.tsx` |

Interim rules: Close Task shows only while the task is open, opens no confirmation and
updates Status through the record service (errors show a toast); the right panel's Deal
Summary and the Open Activities counts are read live for the related Contact (Deals through
the Deals list, open Tasks / Meetings / Calls through the activity lists); "+ New" and the
panel search icons draw without handlers; Add Tags and Conversations are drawn as later-module controls.


### Activities screens — side-by-side visual check (board decision MEP-570, 2026-10-14 and 2026-10-15)

From now on, QA and the approver do not approve any Activities screen — including forms
(Create/Edit page or dialog), list views, and record detail — until they have opened our screen
at the same CSS viewport (1470 × 835, DPR 2), put our screenshot next to the reference capture,
and ticked every row of the spec's measured inventory (`research/specs/activities-form.md`,
`activities.md`, and `activities-record-detail.md`). Components and layouts from
Leads/Accounts/Contacts/Deals must never be copied as-is into Activities screens.

Our screenshot is uploaded to the task as an attachment; the reference image never enters the
repo or task (only its research workspace path is referenced). The result of each comparison (✓
per verified row) is recorded below and in the review comments. `apps/web/e2e/activities-form-visual.spec.ts`
guards the measured values and absence of copied chrome for Task Create/Edit, Meeting window and
full form, and Activities lists/detail. Call Create/Edit join it once the Call form lands.

#### Task and Meeting form screens — measured comparison result

| Screen / Area | Measured inventory | Verified result | Evidence |
| --- | --- | --- | --- |
| Task Create & Edit: Header & placement | Requirements 1–3: Pale #EEF1F9 title band y=50–113; 548 px column x=332–880; 590 px blank right area; #313949 section headings | ✓ Matched | `activities-form-visual.spec.ts`, `tasks-form.spec.ts` |
| Task Create & Edit: Columns & styling | Requirements 4–6: Left-aligned labels x=332; values start x=551; unboxed rows; 1 px #DCDBEE underline spanning label and value | ✓ Matched | `activities-form-visual.spec.ts` |
| Task Create & Edit: Required indicator | Requirement 7: 25 × 2 px horizontal #F27B77 red segment at row left edge under Subject | ✓ Matched | `activities-form-visual.spec.ts` |
| Task Create & Edit: Lookups & selects | Requirements 8–10: Contact/Account label type selector with magnifying-glass icon at x=859; short Status (103 px) & Priority (59 px) spans; DD.MM.YYYY Due Date without calendar glyph | ✓ Matched | `activities-form-visual.spec.ts`, `tasks-form.spec.ts` |
| Task Create & Edit: Toggles & Description | Requirements 11–12: Bare 28 × 15 switches for Reminder & Repeat with no adjacent text; underlined textarea with 7 × 7 resize grip | ✓ Matched | `activities-form-visual.spec.ts`, `tasks-form.spec.ts` |
| Task Create & Edit: Form chrome | Requirement 14: No "Create Form Views", no "Client Script" tab | ✓ Matched | `activities-form-visual.spec.ts` |
| Meeting Information dialog: Modal & grid | Requirements 1–4: Centered 500 px modal at x=485; 418 px lines from x=515 to 933; labels left at x=515, values start at x=682; 50 px pitch | ✓ Matched | `activities-form-visual.spec.ts`, `meeting-information-dialog.tsx` |
| Meeting Information dialog: Fields & controls | Requirements 5–11: Unboxed rows; 25 × 2 px red marker; All day 15 × 15 checkbox; Date and time on one line 10 px apart; Cancel and Save only (no Save and New) | ✓ Matched | `activities-form-visual.spec.ts`, `meeting-information-dialog.tsx` |
| Meeting Full Form (Add more details) | Requirements 1–14: Expands to full form with Repeat and Description; no copied form chrome | ✓ Matched | `activities-form-visual.spec.ts` |
| Activities Lists & Detail: Copied chrome | MEP-590/591 blockers: No Related List rail (`[data-record-rail]`), no rail collapse toggle (`[data-record-rail-control]`), no copied form chrome | ✓ Matched | `activities-form-visual.spec.ts`, `tasks-detail.spec.ts` |


### Calls record detail — implemented; QA pending (MEP-508)

| Area | Inventory | Evidence |
| --- | --- | --- |
| Header, title link, phone glyph, tags, Reschedule Call, Down arrow, More Options | CD-01, CD-02, CD-04, CD-05, CD-05.1, CD-07, CD-08, CD-09 | `calls-detail.spec.ts`, `calls-record-header.test.ts`, `calls-reschedule.test.ts` |
| More Options menu (Edit, Share, Delete, Print Preview, Send Email) | CD-07.1–CD-07.5 | `calls-detail.spec.ts`, `calls-record-more-options.test.ts` |
| Tabs, last update, Timeline empty state | CD-33–CD-35 | `calls-detail.spec.ts`, `calls-timeline.test.ts` |
| Business card, detail sections, Call For / Related To suffixes | CD-36, CD-39, CD-41, CD-42, CD-46 | `calls-detail.spec.ts`, `calls-detail-sections.test.ts` |
| Right panel: person, Deal Summary ("No Deals found"), Open Activities, phone call icon | CD-50–CD-52, CD-54–CD-58, CD-60, CD-61, CD-63–CD-70 | `calls-detail.spec.ts` |

Interim rules: Reschedule Call (CD-05) and Down arrow (CD-05.1) render without handlers only when `Outgoing_Call_Status` is one of `Scheduled`, `Overdue`, or `Cancelled`; the header Edit button is suppressed (Edit is located in More Options CD-07.1); Call For contact link (CD-02) and Related To (CD-39/CD-46) display their plural module suffix (`- Contacts`, `- Deals`, `- Accounts`); right panel renders single phone call action (TD-59 mobile absent) and Deal Summary displays "No Deals found" (CD-61); later-module controls (Add Tags CD-04 M6, Share CD-07.2 M11, Print Preview CD-07.4 M6, Send Email CD-07.5/CD-55/CD-57 M10, Conversations CD-52 M10, More Info CD-60 M2) draw in place and stay inert.

### Meetings record detail — implemented; QA pending (MEP-507)

| Area | Inventory | Evidence |
| --- | --- | --- |
| Back, tags, Edit, More Options and record navigation | MD-01, MD-04, MD-06–MD-09 | `meetings-detail.spec.ts` |
| Overview, Timeline and tab-row Last Update | MD-33–MD-35 | `meetings-detail.spec.ts` |
| Static business card, Related To suffix and Contact Name link | MD-39, MD-45 | `meetings-detail.spec.ts`, `meetings-detail-sections.test.ts` |
| Participants between business card and details; Add without handler | MD-47, MD-41 | `meetings-detail.spec.ts` |
| More Options: six rows, separators after Delete and Export Meeting | MD-07.1–MD-07.6 | `meetings-detail.spec.ts`, `meetings-record-more-options.test.ts` |
| Person, Info/Conversations, Deal Summary and Open Activities | MD-50–MD-52, MD-54–MD-70 | `meetings-detail.spec.ts`; existing Tasks relation panel |

Edit uses the registered shared Meetings form route. Inline editing in detail sections and
Last Update reuse Deals rules; the business card is static. Add Tags is M6; the existing
menu retains Share/Create Button as M11 and Print Preview as M6. Conversations, Send Email
and Email are M10. Export Meeting and participant Add have no handlers. Relation panel
counts and data loading follow Tasks; Meetings/Calls counts remain the existing zero fallback.
Offscreen details and Timeline use the shared metadata-driven presentation and empty history.

Interim decision MEP-517: Participants reads array emptiness only. Empty/invalid values
show No participant found; a populated opaque array shows a blank body with heading/Add,
without interpreting any entries or inventing names. The populated appearance/item schema
remains an open question for the corresponding research/contract work.

### Meetings create and edit — implemented; QA pending (MEP-509)

Inventory is MF-01 – MF-15 and MF-02.1 – MF-02.3.

| Area | Inventory | Tests |
| --- | --- | --- |
| Meeting Information window: Title, Meeting Venue and its three options, Location, All day, From and To (date + time), Host, Participants + Add | MF-01 – MF-11, MF-02.1 – MF-02.3 | `meetings-form.spec.ts`, `meetings-form-rules.test.ts` |
| Footer: Add more details, Cancel, Save; body scroll | MF-12 – MF-15 | `meetings-form.spec.ts` |
| Full form (Add more details, Edit): metadata layout order, values carried over | Meeting form fields vs metadata | `meetings-form.spec.ts` |

Provisional rules: From and To are required, To before From blocks Save with the shared
"Please enter a valid To." under To; a new window starts at the next full hour with To one
hour later and Host the signed-in user; All day hides the time entries and stores the day at
UTC midnight; no provider choice (Online adds no field), Location is always shown;
Participants Add opens the existing record picker for Contacts or Leads, at most 50, rows can
be removed, no invitation is sent; Reminder and Participants Reminder are selects (At start,
5/10/15/30 minutes, 1/2 hours, 1/2 days before) that only store the value; Repeat is drawn
in place as a `laterModule="P3"` toggle (open question for the board); Save opens the record,
Cancel creates nothing. The record's Participants Add opens the same picker and writes the
list. Provider and the audit, check-in and tag fields are not drawn.

## Module 6 — CSV import and export

Sources: `research/specs/csv-import-export.md` (CSV-01 – CSV-32), ADR 0005 §3. Entry points were
captured on the four module lists; the wizard, export dialog and history screens were not
observable in the reference and follow public documentation (interim rules T4 – T7).

| Area | Inventory | Tests |
| --- | --- | --- |
| List entry points | CSV-02, CSV-04, CSV-05 (Create chevron "Import <Module>", Actions "Export <Module>" on Leads, Contacts, Accounts, Deals; Tasks, Meetings and Calls keep `laterModule` M6) | `csv-import-export.spec.ts`, `list-config.test.ts` |
| Import wizard | CSV-06 – CSV-19 (route `tab/<module>/import`; mapping step replaces the earlier placeholder; default match field is the first non-`id` unique field) | `csv-import-export.spec.ts`, `import-wizard.test.tsx`, `mapping-step.test.tsx` |
| Import summary and history | CSV-27 – CSV-30 (Settings › Data Administration › Import History, Undo removes added records only) | `csv-import-export.spec.ts`, `history.test.tsx` |
| Export | CSV-21 – CSV-26 (view scope, all/choose/exclude fields, selected records up to 500, completion toast with Download and View export history) | `csv-import-export.spec.ts`, `export-dialog.test.tsx`, `toast.test.tsx` |
| Export history | CSV-31, CSV-32 (Settings › Data Administration › Export History) | `history.test.tsx` |

Open differences for the module gate: in-process, synchronous transfer without recovery
(decision 1); CSV only, UTF-8 or ISO-8859-1, no XLS/XLSX/VCF, ZIP or password protection
(decision 3); history is per-organization in memory, 7 days, lost on restart (decision 6);
export reads at run and download time, best effort under concurrent writes, text cells starting
with `=`, `+`, `-`, `@`, tab or CR get a leading `'` (decision 7); no separate export profile
permission (decision 8); Notify Email (M10), Layout selection and Create New Fields (M11) are
disabled (decision 9), and there is no criteria builder: scope is a custom view.
Interim rules: Retry in Export History opens the module list; Undo is offered for every job that
is not already undone and the server re-checks the delete permission; selection export is
disabled above 500 rows with the limit written in the menu label.

## Module 7 — Campaigns

### Campaigns list

Implemented; QA pending (MEP-805).

| Inventory | Implementation | Verification |
| --- | --- | --- |
| SH-18 | Registered in registry.ts after Calls; shell entry and create-records row live | `registry.test.ts`, `shell.test.tsx`, `campaigns-list.spec.ts` |
| CL-01, CL-02, CL-02.1 – CL-02.8 | Single All Campaigns tab; view menu with four service views, Dropdown toggle, New / Manage Custom View (M11, inert) | `campaigns-list.spec.ts` |
| CL-03 – CL-11, CL-40 | Filter, Sort, presentation icons and refresh as in Accounts | `campaigns-list.spec.ts` |
| CL-12, CL-13 | Create Campaign opens the create route; arrow is `laterModule` M6 | `campaigns-list.spec.ts` |
| CL-14, CL-14.1 – CL-14.9 | Nine Actions rows in reference order, no Deduplicate; Sheet view `laterModule` P3 | `campaigns-list.spec.ts` |
| CL-15 – CL-31 | Filter panel groups from the module definition | `list-filters.test.ts`, `campaigns-list.spec.ts` |
| CL-32 – CL-39 | View Settings `laterModule` M11; alphabet picker; empty text and Total Records 0 | `campaigns-list.spec.ts` |

Provisional rules: the populated table body is the Accounts table (not observed in the reference).

### Campaigns create / edit form

Implemented; closing QA 2/2 exercised the create and edit flows on 2026-10-19
(MEP-853). One visible layout defect remains: the footer controls sit directly
below Description and leave a large blank area underneath, while the reference
form keeps that footer at the bottom edge of the form viewport.

| Inventory | Implementation | Verification |
| --- | --- | --- |
| CF-01 | Edit Page Layout beside the form title (M11, inert) | `campaigns-form.spec.ts` |
| CF-02–CF-04 | Cancel, Save and New, Save in the title strip's right group | `campaigns-form.spec.ts` |
| CF-05, CF-06 | Campaign Owner field on the session owner and in initial focus, with the Select User dialog behind its lookup icon | `campaigns-form.spec.ts` |
| CF-07 | Campaign Name input with its required marker | `campaigns-form.spec.ts` |
| CF-08 | Start Date on shared masked date entry (DD.MM.YYYY) | `campaigns-form.spec.ts` |
| CF-09, CF-09.1, CF-10 | Expected Revenue with home-currency prefix and information icon | `campaigns-form.spec.ts`, `campaigns-form-rules.test.ts` |
| CF-11, CF-11.1, CF-12 | Actual Cost with home-currency prefix and information icon | `campaigns-form.spec.ts`, `campaigns-form-rules.test.ts` |
| CF-13 | Numbers sent integer entry | `campaigns-form.spec.ts` |
| CF-14, CF-14.1–CF-14.8 | Type select popup with search input, required marker, and options in metadata order | `campaigns-form.spec.ts`, `campaigns-form-rules.test.ts` |
| CF-15, CF-15.1–CF-15.5 | Status select popup with five options and no search box | `campaigns-form.spec.ts`, `campaigns-form-rules.test.ts` |
| CF-16 | End Date on shared masked date entry (DD.MM.YYYY) | `campaigns-form.spec.ts` |
| CF-17, CF-17.1, CF-18 | Budgeted Cost with home-currency prefix and information icon | `campaigns-form.spec.ts`, `campaigns-form-rules.test.ts` |
| CF-19 | Expected Response integer entry | `campaigns-form.spec.ts` |
| CF-20, CF-21 | Description multiline editor with its lower-right resize grip | `campaigns-form.spec.ts` |
| CF-22, CF-23 | Form footer: Create Form Views label with Standard View and Create a custom form page (M11, inert) | `campaigns-form.spec.ts` |
| CF-24 | Client Script tab on the page's right edge (M11, inert) | `campaigns-form.spec.ts` |
| — | Parent Campaign omitted from the form layout | `campaigns-form.spec.ts`, `campaigns-form-rules.test.ts` |

Provisional rules (behaviour not observed in reference):
- Edit form reuses the create form layout populated with saved record values (Accounts edit behaviour).
- Required field error copy and post-save navigation follow Accounts behaviour.
- No ordering constraint between Start Date and End Date.
- Currency and integer field validation follows shared field behaviour.

Later-module controls: CF-01, CF-22, CF-23, CF-24 (M11 `laterModule`).

### Campaigns record detail

- GK-1 header (Campaign Name title, arrows, Edit, More Options): implemented by provisional rule; QA pending (MEP-812).
- GK-2 Overview (layout sections, inline edit): implemented by provisional rule; QA pending (MEP-812).
- GK-3 Timeline (Accounts Timeline): implemented by provisional rule; QA pending (MEP-812).
- GK-4 related-list rail (metadata order, card bodies empty): implemented by provisional rule; QA pending (MEP-812).
- GK-5 Leads and Contacts cards (campaign membership, Member Status, Email, Phone): implemented by provisional rule; closing QA 2/2 verified populated cards and their left-to-right headings (MEP-853).
- GK-6 Deals card (Campaign Source matching deals, Accounts Deals card behaviour): implemented by provisional rule; closing QA 2/2 verified the populated card and record navigation (MEP-853).
- GK-7 Child Campaigns card (Parent Campaign matching campaigns, standard columns): implemented by provisional rule; closing QA 2/2 verified the populated card (MEP-853).
- GK-8 Notes, Attachments, open/closed activities, Checklists, Connected Records (Accounts counterparts and laterModule): implemented by provisional rule; closing QA 2/2 verified the Notes flow and related-card order (MEP-853).

Closing QA 2/2 found that the populated Leads/Contacts cards still render the
phone Call action with `data-later-module="M5"`; clicking it opens no call flow.
The detail also retains M5/M6 later-module markers on activity and attachment
rail/actions. These controls cross the M7 functionality threshold and need a
gate decision or correction. M10/M11/P3 controls did not navigate when clicked.

### Campaigns links in earlier modules

Leads Campaigns (CX-18) and Contacts Campaigns (CX-318) appear as the second
system filter in their respective list panels. The provisional criterion limits
(CX-207: up to five campaigns; CX-209: Member Status) remain open questions
because the reference filter was not operated. Closing QA 2/2 tested the local
select, Apply, and Clear flows (MEP-853): the selected campaign returns two
Leads and one Contact; Clear restores the full lists. After Apply, both filter
panels scroll horizontally and clip the left edge of their section headings
and checkboxes, a visible defect.

### Module 7 gate

Closing QA 2/2 (MEP-853): all nine prerequisite Campaigns branches were present
on `origin/main` at `4301d431` (2026-10-19 02:31:45 +0300). The create/edit form,
related cards, and Leads/Contacts Campaigns filters were exercised against the
local app. The form footer placement, M5/M6 inert controls on the Campaigns
detail, and the horizontally clipped Campaigns filter panels remain defects
for the CTO gate. The detail layout, Add to Campaigns picker, member-status
choices, populated membership columns/actions, Campaign Source lookup, and form
validation/edit behaviour remain provisional where the reference could not be
observed.
Existing/Create New bulk membership, Campaign type/status and Service status
filter criteria, Lead-conversion membership transfer, and a Deals Campaigns
card are outside this half of the gate. Closing QA 1/2 (MEP-852) is tracked
separately.

## Module 6 · Print page (MEP-871, interim rule)

The reference print page could not be captured (capture protection, MEP-793), so the layout is
our own and is an **interim rule** listed as an open question at the Module 6 gate.

| Item | Status |
| --- | --- |
| Record Print Preview (PS-03) — Leads, Contacts, Accounts, Deals: More Options → Print Preview opens `.../tab/<module>/<recordId>/print` in the same tab | Done (interim layout: title + module, Print, Close; sections in detail order, label–value in two columns) |
| List Print Default view (PS-17/18) — Leads, Contacts, Accounts: Actions → Print View → Print Default view opens `.../tab/<module>/print?viewId=` with the current view's records (current filter and sort, one page) as a table | Done (interim layout) |
| Deals list Print View | Not added (not observed in the reference) |
| Print Using Canvas (PS-19), Print Mailing Labels | Unchanged (later-module placeholders) |
| Tasks, Meetings, Calls, Campaigns Print entries | Unchanged (Module 5 / Campaigns) |

Interim rule details: Print calls `window.print()`, Close goes back, `@media print` hides the
buttons and everything outside the print page.

## Module 8 — Cases and Solutions

### Cases and Solutions lists

Implemented; QA pending (MEP-862).

| Inventory | Implementation | Verification |
| --- | --- | --- |
| KL-45, KL-51 (SL-45, SL-51) | Cases and Solutions registered in registry.ts; shell entries and create-records rows live | `registry.test.ts`, `shell.test.tsx`, `create-records.test.tsx`, `cases-list.spec.ts`, `solutions-list.spec.ts` |
| KL-01, KL-02, KL-02.1 – KL-02.12 | Single All Cases tab; view menu with eight service views, Dropdown toggle, New / Manage Custom View (M11, inert) | `cases-list.spec.ts` |
| SL-01, SL-02, SL-02.1 – SL-02.8 | Single All Solutions tab; view menu with four service views, Dropdown toggle, New / Manage Custom View (M11, inert) | `solutions-list.spec.ts` |
| KL-03 – KL-13, KL-40 (SL-03 – SL-13, SL-40) | Filter, Sort, presentation icons, refresh and Create as in Campaigns; arrow is `laterModule` M6 | `cases-list.spec.ts`, `solutions-list.spec.ts` |
| KL-14.1 – KL-14.11 | Eleven Actions rows in reference order; Sheet view and Approve Cases `laterModule` P3 | `cases-list.spec.ts` |
| SL-14.1 – SL-14.9 | Nine Actions rows, no Mass Email or Approve; Sheet view `laterModule` P3 | `solutions-list.spec.ts` |
| KL-15 – KL-39 (SL-15 – SL-39) | Filter panel groups from the module definition; View Settings `laterModule` M11; alphabet picker; empty text and Total Records 0 | `list-filters.test.ts`, `cases-list.spec.ts`, `solutions-list.spec.ts` |

Provisional rules: the populated table body is the Campaigns table (not observed in the reference).

### Cases record detail

- GK-1 route and page (accessible from list, search and direct URL; not-found handling): implemented by provisional rule; QA pending (MEP-863).
- GK-2 header (Subject title, previous / next arrows, Edit, More Options; case-specific actions omitted): implemented by provisional rule; QA pending (MEP-863).
- GK-3 Overview (sections and fields from layout, inline editing, read-only autonumber/comments): implemented by provisional rule; QA pending (MEP-863).
- GK-4 Timeline (Campaigns Timeline): implemented by provisional rule; QA pending (MEP-863).
- GK-5 related-list rail and cards (Connected Records, Notes, Attachments, Open Activities, Closed Activities, Emails; metadata order): implemented by provisional rule; QA pending (MEP-863).

### Solutions record detail

- GK-1 route and page (accessible from list, search and direct URL; not-found handling): implemented by provisional rule; QA pending (MEP-863).
- GK-2 header (Solution Title title, previous / next arrows, Edit, More Options; solution-specific actions omitted): implemented by provisional rule; QA pending (MEP-863).
- GK-3 Overview (sections and fields from layout, inline editing, read-only autonumber/comments): implemented by provisional rule; QA pending (MEP-863).
- GK-4 Timeline (Campaigns Timeline): implemented by provisional rule; QA pending (MEP-863).
- GK-5 related-list rail and cards (Connected Records, Notes, Attachments; metadata order): implemented by provisional rule; QA pending (MEP-863).

### Solutions create / edit form

Implemented; QA pending (MEP-896).

| Inventory | Implementation | Verification |
| --- | --- | --- |
| SF-01 | Edit Page Layout beside the form title (M11, inert) | `solutions-form.spec.ts` |
| SF-02–SF-04 | Cancel, Save and New, Save in the title strip's right group | `solutions-form.spec.ts` |
| SF-05, SF-06 | Solution Number locked input with lock icon badge; empty on create, populated and preserved on edit | `solutions-form.spec.ts`, `solutions-form-rules.test.ts`, `field-input.test.tsx` |
| SF-07 | Solution Title input with its required marker | `solutions-form.spec.ts`, `solutions-form-rules.test.ts` |
| SF-08, SF-08.1–SF-08.3 | Status picklist popup defaulting to Draft, three options (Draft, Reviewed, Duplicate) and no search box | `solutions-form.spec.ts`, `solutions-form-rules.test.ts` |
| SF-09, SF-10 | Solution Owner field on the session owner and in initial focus, with the Select User dialog behind its lookup icon | `solutions-form.spec.ts`, `solutions-form-rules.test.ts` |
| SF-11, SF-12 | Product Name lookup input and button (P2 `laterModule`, inert) | `solutions-form.spec.ts`, `solutions-form-rules.test.ts` |
| SF-13, SF-15 | Question multiline input with required marker and resize grip | `solutions-form.spec.ts`, `solutions-form-rules.test.ts` |
| SF-14, SF-16 | Answer multiline input with required marker and resize grip | `solutions-form.spec.ts`, `solutions-form-rules.test.ts` |
| SF-17, SF-18 | Form footer: Create Form Views label with Standard View and Create a custom form page (M11, inert) | `solutions-form.spec.ts` |
| SF-19 | Client Script tab on the page's right edge (M11, inert) | `solutions-form.spec.ts` |
| — | Published checkbox, Add Comment, Comments, No. of comments, Tag, Connected To, and system audit fields omitted from form layout | `solutions-form.spec.ts`, `solutions-form-rules.test.ts` |

Provisional rules (behaviour not observed in reference):
- Edit form reuses the create form layout populated with saved record values (Accounts edit behaviour).
- Required field error copy and post-save navigation follow Accounts behaviour.
- Solution Number is generated by fixture service autonumber and stays read-only across create and edit.

Later-module controls: SF-01, SF-17, SF-18, SF-19 (M11 `laterModule`); SF-11, SF-12 (P2 `laterModule`).


### Cases create / edit form

- KF-01 – KF-34 implemented (MEP-895). M11 controls (KF-01, KF-29, KF-30, KF-32) and Product Name (KF-07, KF-08, P2) are `laterModule`; the Product picker (KF-08.x) is not drawn.
- Case Number (KF-05, KF-06) is locked, blank on create and filled on edit.
- Provisional: edit form = create form filled; shared picklist adds a leading `-None-` to Status (KF-20.x list otherwise matches); no Email requirement for Case Origin = Email; Type / Case Reason options in metadata order.

### Cases links in earlier modules (MEP-900)

| ID | Behaviour | Tests |
| --- | --- | --- |
| KX-01 – KX-16 | Accounts, Contacts and Deals detail: Cases card live (no later-module marker); filters Cases on `Account_Name` / `Related_To` / `Deal_Name`; empty card shows Assign and New and "No records found"; rail entry kept (Contacts rail plus included) | `related-cases-card-body.test.tsx`, `*-related-lists.test.tsx`, `accounts-detail.spec.ts`, `contacts-detail.spec.ts`, `deals-detail.spec.ts` |
| Provisional | Filled card columns Subject (detail link), Case Number, Status, Priority, Case Owner; New opens the Cases form with the parent field (and Account Name when known) filled; Assign has no handler; no Cases ↔ Solutions link (CTO decision) | same |

