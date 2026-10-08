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
- **Later rows are not drawn early.** A control whose function belongs to a
  later module is left out until that module ships; we do not render inert
  controls. Every such row is reported as a known gap at the module gate.
- **Open research** marks a behaviour the specs record as unobserved. Under
  the read-only rule it can only come from the reference CRM's public
  documentation. A row with open research is built to the spec as far as the
  spec goes; the rest is reported at the gate.
- **Module assignment** follows the order in `AGENTS.md`. The assignments
  were made by the CTO on 2026-10-05 from the capability table in
  `research/specs/leads.md`; the board may move any row.

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
| 20 | Create Lead form: Standard layout, required markers, picklists, Country and State lists | `record-detail.md` › Create and edit forms; `leads-fields-and-layout.md` › Standard layout | Whether a compact quick-create form exists. |
| 21 | Edit Lead form | `record-detail.md` › Create and edit forms | — |
| 22 | Save validation (required and format messages, focus) and the unsaved-changes dialog on Cancel | `record-detail.md` › Create and edit forms, Flows; `leads-write-behaviour.md` › A10 | Look of server errors on the form. |
| 23 | Save and Save and New results | `record-detail.md` › Flows; `leads-write-behaviour.md` › A7 | Destination and message after a successful save. |
| 24 | Delete Lead | `leads.md` › Actions; `leads-write-behaviour.md` › A1 | Confirmation dialog and where the page goes afterwards. |
| 25 | Clone Lead | `leads.md` › Actions; `leads-write-behaviour.md` › A2 | Look of the clone form, the fields it leaves out and where the page goes after Save. |
| 26 | Lead schema: fields, types, required fields, limits, picklists | `leads-fields-and-layout.md` › Fields, Picklists | — |
| 27 | Field permissions of the two profiles applied to list, detail and forms | `leads-fields-and-layout.md` › Field permissions by profile | Whether the shell differs by profile. |

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

The module order does not name these. The proposal is the CTO's; the board
decides.

| Capability | Proposal | Spec section |
| --- | --- | --- |
| Global search across modules | M2, the first point with two modules | `app-shell.md` › Actions |
| Find and Merge Duplicates; Deduplicate Leads | M2, together with Contacts | `leads.md` › Actions |
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
