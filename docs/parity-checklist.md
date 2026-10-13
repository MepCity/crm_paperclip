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
| S-10, S-10.1–S-10.7, S-13 | Module selector and module search; registry supplies shipped modules; Accounts M3, Deals M4, Tasks/Meetings M5 remain inert | Selector filtering, future-module no-op and module-scoped request tests |
| S-11, S-14 | Empty focused query; three-character minimum; 300 ms debounce; hash prefix selects nameOrTags and shows Record Name badge | Component request tests |
| S-12.1–S-12.15 | Record history per organization/user; newest first, unique module/id, capped at 15; absent when empty | History storage and record navigation tests |
| S-15–S-18 | Module groups, first five records, detail navigation; email M10 and call M5 inert; advanced route preserves query/module; Deals layer row titles use record ids until M4 (known gap) | Component tests; global-search e2e; MEP-355 re-walk (short query and `Deal` layer group) |

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
| D-10–D-31, D-52–D-95 (rail/cards) | Contacts related-list definitions; Open and Closed Activities cards without count badges until M5 activity data (D-30, D-31); M2 Reporting Contacts data card | Related-list component tests; contacts detail e2e. **Reporting Contacts manager filter (MEP-380): not walked** in MEP-355 (card not reopened after the fix landed) |
| D-89–D-91 | Reporting Contacts rail plus, New/Add → create with Reporting To prefill; Hierarchy View drawn without handler | Contacts detail e2e |

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
| X-52 – X-54 | Conflict popup: merged groups and removed records, Do it later, Resolve Now | `dedup-job.test.tsx`; e2e (Resolve Now walked in MEP-355; **Do it later: not walked**, test-only) |
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
| S-30, S-31.1–.8, S-32.1–.5, S-33, S-34, S-35.1–.2, S-36, S-37 | Filter panel: module checkboxes (Contacts, Accounts, Leads active; Tasks M5, Deals M4, Meetings M5, Calls M5, Products P2 inert), system field filters with operator and user picker, Apply Filter, and Clear | Component tests; `e2e/advanced-search.spec.ts` |
| S-38, S-39, S-40, S-41, S-42, S-43.* | Row actions button, phone call icon (M5 inert), email link (M10 inert), related record links, stage badge (M4 inert), column values with list cell formatting and user display names | Component tests |
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
- **Hierarchy View, Drafts, Approve Contacts:** not observed in reference captures;
  behaviour unknown; drawn inert.
- **Shell:** only Home, Leads, Contacts, and Accounts; other tabs arrive with
  their modules.
- **Database adapter** is not wired (ADR 0002 measurement pending); Contacts runs on
  the fixture record service.

**Interim rules**

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
| AD-159–AD-162 | Timeline History only; filter and upcoming actions (M12, inert) | Accounts detail e2e. **Populated history rows: not walked** (seed record has no history) |
| AD-10–AD-31, AD-96–AD-102, AD-98 | Accounts related-list rail and cards; Open and Closed Activities cards draw no count badge when the card holds zero records (MEP-394); Contacts badge from service counts | Related-list tests; accounts detail e2e. Related-list query failures show an error state instead of an empty list (MEP-391) |
| AD-115–AD-120, AD-154 | Contacts card data and New prefill; Member Accounts card with Account Owner display names (MEP-393), New prefill, and active rail plus (MEP-387); Hierarchy View drawn without handler | Accounts detail e2e |

Share (M11) and Print Preview (M6) are later-module controls in More Options (same as
Contacts; open states not observed in reference captures). **Hierarchy View (AD-115):**
drawn inert; open behaviour not observed (Module 3 gate known gap). Notes rail badge
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
| AF-45–AF-46 | Form footer view controls (M11, inert) | Inventory footer on the Accounts form. **AF-45 – AF-46: not walked** in MEP-384 (below the fold) |

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
| AL-02.10–AL-02.12 | Customization items in view menu: Dropdown toggle, New Custom View (M11), Manage Custom View (M11) | `view-tab-strip.test.tsx`. **AL-02.10: not walked** (strip did not return to dropdown in this pass) |
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

- **Later-module controls (M4+):** Deals, activity, note, attachment, and email / product card
  behaviour; tags, export, page layout, Cadences, and Sheet view remain drawn in place and
  inert when clicked.
- **Not observed open in reference captures (same state as Contacts):** Share, Print Preview,
  Drafts, Print View, the five system filters (Locked, Record Action, Related Records Action,
  Touched Records, Untouched Records), and non-list view type icons.
- **Hierarchy View** on the Contacts card: drawn inert; open state not observed; no
  implementation task was opened.
- Connected To is omitted on the create form; synthetic seed data has no populated Timeline
  history (empty shell was walked).
- **Not walked in closing QA:** show custom views as a dropdown (AL-02.10) and form footer
  view controls below the fold (AF-45 – AF-46).

**Interim rules**

- More Options, delete confirmation, Timeline shell, record page footer, and form error copy,
  focus order, unsaved-changes handling, post-save destination, Save and New, and Copy Address
  directions follow the Contacts patterns.
- Billing and Shipping addresses use the Contacts address component; Choose Account uses the
  same record picker as Parent Account.
- Member Accounts columns come from the All Accounts view; the Contacts summary shows the first
  contact; the email card uses the `Sent` label; sort labels come from the field dictionary.

**Open items**

- **Board question (gate card):** whether clicking Hierarchy View in the reference CRM to see
  its open state counts as read-only research; if yes, CRM Analyst captures it and a task opens;
  if no, whether to build it from the public documentation's description or leave it inert.
- Assigning a parent account to itself or into a cycle is not blocked; the reference rule was
  not observed and none was invented.
- Related-list cards cap at 100 records with no pagination; reference behaviour above that cap
  was not captured; the same cap applies to the Contacts card.
- Closing QA screenshots predate the fix tasks; corrected rows were verified in fix QA, not in
  a full Module 3 re-walk.
- The database adapter is not wired (ADR 0002, MEP-40); Accounts runs on the fixture record
  service.

## Module 4 — Deals

### Deals create / edit / clone form — implemented; QA pending (MEP-440)

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
