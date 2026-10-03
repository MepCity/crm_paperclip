# Setup > Customization > Modules and Fields

Status: draft for CTO review (MEP-16, research 1/9). Read-only study of the live reference CRM; metadata export dated 2026-10-03. Captures are referenced by slug only (they live outside the repo).

Conventions: `<org>` stands for the org segment of the reference CRM URL, `<layoutId>` for a layout id, `<owner>` for a user. Internal route for Deals still uses the legacy module name `Potentials` (`/settings/modules/Potentials/...`); every other module uses its API name.

## Purpose

This is the admin area where the board customizes the data model of every CRM module: which modules exist and are shown as tabs, which layouts a module has and which profiles see them, which fields exist (system and custom), field-level permissions per profile, and per-module guard rails (layout rules, validation rules, record locking, dependent picklists, custom links/buttons). It is the foundation for the Phase 3 customization work (custom fields/modules, layouts, picklists) and defines which modules and layouts the next 8 research tasks must look at.

Scope boundary: workflow rules, assignment rules, blueprints, approvals, cadences, reports and integrations are separate research tasks. This screen only links to them (see Summary tab below).

**What is actually configured in our org (usage summary).** Our setup is almost entirely stock reference CRM:

| Capability | Status in our org | Evidence |
|---|---|---|
| Custom modules | not in use (0 custom modules; `generated_type` is never `custom`) | `modules.json`; `setup-modules-main` (Custom Module / Team Module filter chips, no custom rows) |
| User-created custom fields | not in use (0 on Leads, Contacts, Accounts, Deals, Tasks) | Summary tab "Custom Fields 0 out of 300/140" (`setup-deals-summary`, `setup-contacts-summary`, `setup-accounts-summary`, `setup-tasks-summary`); Leads shows 1 (system-generated, see Open questions) in `setup-leads-summary` |
| More than one layout per module | not in use (every module has exactly one `Standard` layout, shared to both profiles) | `modules/*/layouts.json`; `setup-leads-layouts` |
| Layout rules | not in use | "No Rules Configured" in `setup-leads-layout-rules` |
| Validation rules | not in use | "No Rules Configured" in `setup-leads-validation-rules` |
| Record locking configuration | not in use | "Configure Now" empty state in `setup-leads-locking` |
| Map dependency (dependent picklists) | not in use | "No Mapping Configured" in `setup-leads-map-dependency` |
| Custom links / custom buttons | not in use | Summary "Buttons 0 / Links 0" for Leads, Contacts, Accounts, Deals, Tasks |
| Web tabs | not in use | "No Web Tabs Found" in `setup-web-tabs` |
| Global picklist sets | in use, but only stock sets (Source, Industry, Countries and States) | `setup-global-sets` |
| Custom (user-created) list views | in use on Leads only (3 shared views) | `modules/*/custom_views.json` |
| Field-level permissions | in use only for system-managed fields (read-only/hidden for both profiles) | `fields.json` `profiles[].permission_type`; `setup-leads-field-permissions` |
| Modified-from-default modules | Leads, Deals, Contacts, Accounts, Quotes, Sales Orders, Purchase Orders, Invoices, Vendors, Meetings, Cases, Forecasts, My Jobs (Approvals) show a Last Modified date | `modules.json` `modified_time`; `setup-modules-main` |

Parity target for Phase 3 therefore = the stock behavior below (module list with tab visibility, single Standard layout per module, field catalogue + picklists, field permissions per profile, Quick Create subset). Items marked "not in use" are documented for completeness but must not enter the parity checklist.

## Layout

### 1. Modules and Fields home (`setup-modules-main`)
Route: `/settings/modules`. Setup shell (left navigation, search) with a page-level tab strip:
- **Modules** (default): searchable table, with two filter chips ("Custom Module", "Team Module") and two creation buttons ("Create New Module", "Create Module Using Zia") above it.
- **Web Tabs** (`/settings/web-tabs`): not in use.
- **Global Sets** (`/settings/global_picklists`): shared picklist value sets.
- **Deal Management** (`/settings/teamselling`): Team Selling configuration (see Open questions: capture was blocked by a navigation-guard dialog).

Modules table columns: Displayed In Tabs As (icon, name link, row "..." menu, drag handle for tab order), Module Name (API-facing label), Teamspace (count link, every row shows 1 teamspace except Feeds and Services = none), Shared To (All Profiles, or "N Profile"), Last Modified (avatar + date, only for modules whose configuration was touched), Status (on/off switch; the switch is disabled with an info icon on Leads and Contacts). The table scrolls inside its container.

Rows seen (29), in tab order: Workqueue, Leads, Contacts, Accounts, Deals, Tasks, Meetings, Calls, Reports, Analytics, Products, Quotes, Sales Orders, Purchase Orders, Invoices, Feeds, SalesInbox, Campaigns, Vendors, Price Books, Cases, Solutions, Documents, Forecasts, Visits (1 profile), Social (1 profile), Google Ads (1 profile), My Jobs (= `Approvals`), Services (no teamspace, shared to none).

Display-label vs API-name differences: `Events` is shown as "Meetings"; `Approvals` as "My Jobs"; `Orchestration` as "CommandCenter"; `Price_Books` shows as "PriceBooks" in the Module Name column.

Standard vs custom: all 56 `default` + 4 `subform` (line-item child modules: Quoted/Ordered/Purchase/Invoiced Items) + 1 `field_tracker` (`DealHistory`) modules are system-generated; none are custom. 61 modules are exported in `modules.json`; the UI home list shows only the 29 tab-capable ones above (hidden/system modules such as Notes, Attachments, Emails, cadence and approval log modules, `*_Items`, Forecast_*, Orchestration children are not listed).

### 2. Module settings page (`setup-leads-layouts`, `setup-leads-summary`, ...)
Route: `/settings/modules/<Module>/<tab>`. Left rail lists the 17 customizable modules (Leads, Contacts, Accounts, Deals, Tasks, Meetings, Calls, Products, Quotes, Sales Orders, Purchase Orders, Invoices, Campaigns, Vendors, Price Books, Cases, Solutions) with a back arrow and a search icon. Main area has a heading with the module label and a horizontal tab strip, identical for every module:

| Tab | Route suffix | Content |
|---|---|---|
| Layouts | `layouts` | Table of layouts (Name link, Shared To, Last Modified, Status switch) + "Create New Layout" |
| Layout Rules | `layout-rules` | Empty state in our org (columns Name, Primary Field, Last Modified, Status; "New Layout Rule") |
| Validation Rules | `validation-rules` | Empty state (columns Field Name, Validate Using, Executes On, Last Modified, Status; "Create New Validation Rule") |
| Fields | `field-listing` / `field-permissions` | Two pill sub-tabs: Field Listing and Field Permissions, plus a "Create and Edit Fields" button that opens the layout editor |
| Record Locking Configuration | `locking-configuration` | Intro text + "Configure Now" (empty) |
| Map Dependency Fields | `map-dependency/list` | Per-layout list of Parent Field / Child Field / Last Modified + "Create Map Dependency" |
| Links | `custom-link` | Custom links list (blank render in capture, see Data needs) |
| Buttons | `buttons` | Custom buttons list (blank render in capture) |
| Summary | `summary` | Read-only module summary |

Extra tab "Preferences" appears next to Map Dependency Fields on the map-dependency page only (seen in `setup-leads-map-dependency`; content not captured).

Differences by module: Tasks, Calls, Meetings have the same tab strip. Custom field quota shown in Summary is 300 for Leads/Contacts/Accounts/Deals and 140 for Tasks.

### 3. Layouts tab
Heading text explains layouts are assigned to user accounts based on permission profiles. One row per layout. Our Leads, Contacts, Accounts, Deals (and every other module) has one active layout named `Standard`, shared to Administrator and Standard profiles, status switch on. `actions_allowed` (metadata) for the Standard layout: edit, rename, clone, set layout permissions = true; delete, deactivate, downgrade = false. Layout-to-profile assignment is stored in `layouts.json` `profiles[]` with `_default_view` / `_default_assignment_view` pointing at the layout.

### 4. Layout editor (`setup-leads-layout-editor`)
Route: `/settings/modules/<Module>/layouts/<layoutId>`. Full-screen dark-chrome editor, opened by clicking the layout name or "Create and Edit Fields".
- **Top bar**: back arrow to the layout list, module name, layout switcher (dropdown showing the current layout name), a settings gear, a help/doc icon, and Cancel / Save and Close / Save buttons (Save buttons are disabled until a change is made).
- **Left palette (dark)**, three collapsible groups:
  1. *New Fields* — 29 draggable field types: Single Line, Multi-Line, Email, Phone, Pick List, Multi-Select, Date, Date/Time, Number, Auto-Number, Currency, Decimal, Percent, Long Integer, Checkbox, URL, Lookup, Formula, User, File Upload, Image Upload, Rollup Summary, Radio Button, Address, Multi-Select Lookup, Subform; plus a "NEW SECTION" block. A counter "Custom Fields Left: 299" is displayed at the bottom of the group (Leads has 1 used of 300).
  2. *Components* — Mirror, Button (both flagged "new").
  3. *Unused Items* — collapsed list of fields not placed on the layout (not expanded in capture).
- **Canvas** with three tabs: **Create**, **Quick Create**, **Detail View**. The Create tab renders the form as the user will see it: page title ("Create Lead"), Cancel / Save and New / Save buttons and a "Manage Edit Page Buttons" link, then sections in order. Each field card has a "..." menu (field properties) and a drag handle; sections have a gear (section properties). Sections are two-column except the image and description sections.
- An onboarding tour overlay ("Introducing Address Field") covered the page in the capture and blocked further interaction (see Open questions).

Leads Standard layout, Create view (from `setup-leads-layout-editor` aria + `layouts.json`):
- *Lead Image* (1 column): image field.
- *Lead Information* (2 columns, 23 inputs in the Create view; the stored layout section holds 38 fields incl. system read-only ones). Left column: Lead Owner, First Name (with salutation dropdown), Title, Phone, Mobile, Lead Source, Industry, Annual Revenue, Email Opt Out, Modified By, Connected To. Right column: Company, Last Name, Email, Fax, Website, Lead Status, No. of Employees, Rating, Created By, Skype ID, Twitter, Secondary Email.
- *Address Information* (2 columns): composite Address field expanded into Country/Region, Flat/House No./Building/Apartment Name, Street Address, City, State/Province, Zip/Postal Code, Latitude, Longitude (Coordinates hidden sub-field).
- *Description Information* (1 column): Description.

Deals Standard layout (from `layouts.json`): *Deal Image* (1 col, empty), *Deal Information* (2 cols, 25 fields), *Description Information* (1 col, 1 field). Contacts: Contact Image / Contact Information (34) / Address Information (20) / Description Information. Accounts: Account Image / Account Information (24) / Address Information (20) / Description Information. Tasks: Task Information (1 col, 18) / Description Information. Meetings (`Events`): Meeting Information (18) / Meeting Additional Information (16), single column. Calls: Call Information / Purpose Of Outgoing Call / Outcome Of Outgoing Call / Reason For Incoming Call. Quotes: Quote Information / Address Information / Quoted Items (subform) / Terms and Conditions / Description Information.

Quick Create and Detail View tabs were not opened (blocked by the overlay). Quick Create membership is derived from `fields.json` `view_type.quick_create`:
- Leads: Company, First Name, Last Name, Email, Phone.
- Deals: Amount, Deal Name, Closing Date, Account Name, Stage, Expected Revenue.

### 5. Field Listing / Field Permissions (`setup-leads-fields`, `setup-leads-field-permissions`, `setup-deals-fields`)
- Field Listing: searchable table (search by field label or data type) with columns Fields, Data Type, Custom Field. Shows only user-facing fields (Leads: 28 rows, Deals: 18 rows). A "Create and Edit Fields" button opens the layout editor.
- Field Permissions: a profile selector (starts on Administrator) and a table with one row per field and three radio columns: Read and Write, Read Only, Don't Show. (The same permission model is stored per field in metadata as `profiles[].permission_type` = `read_write` / `read_only` / `hidden`.)

### 6. Summary tab (`setup-leads-summary`, `setup-deals-summary`, ...)
Read-only card "Summary of necessary information about this module". Groups: *Primary* (module name, API name, plural/singular display label, last modified by/on), *Customization* (module permission = profiles, layouts, system fields count, custom fields "x out of quota", buttons, links), *Automation* (workflows, assignment rules, approvals, templates, cadences counts — these are the "points of connection" to out-of-scope screens). Values observed in our org:

| Module | System fields | Custom fields | Buttons | Links | Workflows | Assignment rules | Approvals | Templates | Cadences |
|---|---|---|---|---|---|---|---|---|---|
| Leads | 33 | 1 of 300 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Contacts | 43 | 0 of 300 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Accounts | 37 | 0 of 300 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |
| Deals | 19 | 0 of 300 | 0 | 0 | 1 | 0 | 0 | 2 | 0 |
| Tasks | 12 | 0 of 140 | 0 | 0 | 0 | 0 | 0 | 0 | n/a |

Deals is the only reference module that has an automation attached (1 workflow, 2 templates); its content belongs to the Automation research task.

### 7. Global Sets (`setup-global-sets`)
Table: Global Set Name, Used In, Created By, Modified By, with "Create Global Set". Sets present: `Source`, `Industry` (stock, not attached to any field), `Countries and States List` (used in Leads, Contacts, Accounts, Quotes, Sales Orders, Purchase Orders, Invoices, Vendors; created at account setup). In metadata the fields linked to a global picklist are `Country`/`State` (global picklists `Country__s`, `States__s`, 14 fields each) and the team-selling `Member_Role` / `Access` fields.

## Fields

This screen manages fields rather than showing a record form; the table below is the field catalogue for the two reference modules, taken from `~/Desktop/mepcity-research/metadata/modules/<Module>/fields.json` and `layouts.json`. Columns: Req. = `sys` (system mandatory, cannot be turned off) / `layout` (marked required in the Standard layout) / `-`; Len = `length`; Notes = layout section, Quick Create membership, picklist option counts, lookup target, profile permission if not read/write for both profiles. UI data-type names differ from API names — see the mapping table after the inventory.

### Leads (56 fields; 1 layout; sections: Lead Image, Lead Information, Address Information, Description Information)

| Label | API name | data_type | Req. | Unique | Read-only | Len | Notes |
|---|---|---|---|---|---|---|---|
| Address - Latitude | `Latitude` | `double` | - | - | - | 50 | Address Information |
| Address - Longitude | `Longitude` | `double` | - | - | - | 50 | Address Information |
| Lead Owner | `Owner` | `ownerlookup` | - | - | - | 120 | Lead Information |
| Company | `Company` | `text` | layout | - | - | 200 | Lead Information; quick create |
| First Name | `First_Name` | `text` | - | - | - | 40 | Lead Information; quick create |
| Last Name | `Last_Name` | `text` | sys | - | - | 80 | Lead Information; quick create |
| Title | `Designation` | `text` | - | - | - | 100 | Lead Information |
| Email | `Email` | `email` | - | - | - | 100 | Lead Information; quick create |
| Phone | `Phone` | `phone` | - | - | - | 30 | Lead Information; quick create |
| Fax | `Fax` | `text` | - | - | - | 30 | Lead Information |
| Mobile | `Mobile` | `phone` | - | - | - | 30 | Lead Information |
| Website | `Website` | `website` | - | - | - | 255 | Lead Information |
| Lead Source | `Lead_Source` | `picklist` | - | - | - | 120 | Lead Information; 17 options |
| Lead Status | `Lead_Status` | `picklist` | - | - | - | 120 | Lead Information; 9 options |
| Industry | `Industry` | `picklist` | - | - | - | 120 | Lead Information; 19 options |
| No. of Employees | `No_of_Employees` | `integer` | - | - | - | 9 | Lead Information |
| Annual Revenue | `Annual_Revenue` | `currency` | - | - | - | 16 | Lead Information |
| Rating | `Rating` | `picklist` | - | - | - | 120 | Lead Information; 6 options |
| Created By | `Created_By` | `ownerlookup` | - | - | - | 120 | Lead Information; system-managed |
| Modified By | `Modified_By` | `ownerlookup` | - | - | - | 120 | Lead Information; system-managed |
| Created Time | `Created_Time` | `datetime` | - | - | - | 120 | Lead Information; system-managed |
| Modified Time | `Modified_Time` | `datetime` | - | - | - | 120 | Lead Information; system-managed |
| Full Name | `Full_Name` | `text` | - | - | - | 120 | Lead Information; system-managed |
| Description | `Description` | `textarea` | - | - | - | 32000 | Description Information |
| Skype ID | `Skype_ID` | `text` | - | - | - | 50 | Lead Information |
| Email Opt Out | `Email_Opt_Out` | `boolean` | - | - | - | 5 | Lead Information |
| Salutation | `Salutation` | `picklist` | - | - | - | 25 | Lead Information; 6 options |
| Secondary Email | `Secondary_Email` | `email` | - | - | - | 100 | Lead Information |
| Last Activity Time | `Last_Activity_Time` | `datetime` | - | - | - | 120 | Lead Information; system-managed |
| Twitter | `Twitter` | `text` | - | - | - | 50 | Lead Information |
| Tag | `Tag` | `text` | - | - | - | 2000 | Lead Information; system-managed |
| Lead Image | `Record_Image` | `profileimage` | - | - | - | 255 | Lead Image |
| Converted Date Time | `Converted_Date_Time` | `datetime` | - | - | - | 120 | Lead Information; system-managed |
| Lead Conversion Time | `Lead_Conversion_Time` | `integer` | - | - | - | 9 | Lead Information; system-managed |
| Unsubscribed Mode | `Unsubscribed_Mode` | `picklist` | - | - | yes | 120 | Lead Information; 4 options; profiles: read_only; system-managed |
| Unsubscribed Time | `Unsubscribed_Time` | `datetime` | - | - | yes | 120 | Lead Information; profiles: read_only; system-managed |
| Converted Account | `Converted_Account` | `lookup` | - | - | yes | 120 | Lead Information; -> Accounts; profiles: read_only; system-managed |
| Converted Contact | `Converted_Contact` | `lookup` | - | - | yes | 120 | Lead Information; -> Contacts; profiles: read_only; system-managed |
| Converted Deal | `Converted_Deal` | `lookup` | - | - | yes | 120 | Lead Information; -> Deals; profiles: read_only; system-managed |
| Record Id | `id` | `bigint` | - | - | yes | 18 | Lead Information; profiles: read_only; system-managed |
| Change Log Time | `Change_Log_Time__s` | `datetime` | - | - | yes | 120 | not in layout; profiles: read_only; system-managed |
| Is Converted | `Converted__s` | `boolean` | - | - | yes | 5 | Lead Information; profiles: read_only; system-managed |
| Locked | `Locked__s` | `boolean` | - | - | yes | 5 | not in layout; profiles: read_only; system-managed |
| Last Enriched Time | `Last_Enriched_Time__s` | `datetime` | - | - | yes | 120 | not in layout; profiles: read_only; system-managed |
| Enrich Status | `Enrich_Status__s` | `picklist` | - | - | yes | 120 | not in layout; 3 options; profiles: read_only; system-managed |
| Address | `Address` | `textarea` | - | - | yes | 2000 | Address Information |
| Address - Country / Region | `Country` | `picklist` | - | - | - | 120 | Address Information; 248 options (global set) |
| Address - Flat / House No./ Building / Apartment Name | `Flat_House_No_Building_Apartment_Name` | `text` | - | - | - | 255 | Address Information |
| Address - Street Address | `Street` | `text` | - | - | - | 255 | Address Information |
| Address - City | `City` | `text` | - | - | - | 255 | Address Information |
| Address - State / Province | `State` | `picklist` | - | - | - | 120 | Address Information; 3954 options (global set) |
| Address - Zip / Postal Code | `Zip_Code` | `text` | - | - | - | 255 | Address Information |
| Address - Coordinates | `Coordinates` | `textarea` | - | - | yes | 255 | Address Information |
| Distance | `nearby_distance__s` | `double` | - | - | yes | 16 | not in layout; profiles: read_only; system-managed |
| Connected To | `Connected_To__s` | `multi_module_lookup` | - | - | - | 120 | Lead Information |
| Lead Status Modified Time | `Lead_Status_Modified_Time` | `datetime` | - | - | - | 120 | not in layout; profiles: hidden; system-managed |

Leads picklists (config, not data): Lead Status (9: -None-, Attempted to Contact, Contact in Future, Contacted, Junk Lead, Lost Lead, Not Contacted, Pre-Qualified, Not Qualified; the options carry a `record_category_value`), Lead Source (17), Rating (6), Industry (19), Salutation (6). Full values: `modules/Leads/fields.json`.

### Deals (29 fields; 1 layout; sections: Deal Image, Deal Information, Description Information)

| Label | API name | data_type | Req. | Unique | Read-only | Len | Notes |
|---|---|---|---|---|---|---|---|
| Deal Owner | `Owner` | `ownerlookup` | - | - | - | 120 | Deal Information |
| Amount | `Amount` | `currency` | - | - | - | 16 | Deal Information; quick create |
| Deal Name | `Deal_Name` | `text` | sys | - | - | 120 | Deal Information; quick create |
| Closing Date | `Closing_Date` | `date` | layout | - | - | 20 | Deal Information; quick create |
| Account Name | `Account_Name` | `lookup` | layout | - | - | 120 | Deal Information; quick create; -> Accounts |
| Stage | `Stage` | `picklist` | sys | - | - | 120 | Deal Information; quick create; 9 options |
| Type | `Type` | `picklist` | - | - | - | 120 | Deal Information; 3 options |
| Probability (%) | `Probability` | `integer` | - | - | - | 3 | Deal Information |
| Next Step | `Next_Step` | `text` | - | - | - | 100 | Deal Information |
| Lead Source | `Lead_Source` | `picklist` | - | - | - | 120 | Deal Information; 15 options |
| Campaign Source | `Campaign_Source` | `lookup` | - | - | - | 120 | Deal Information; -> Campaigns |
| Created By | `Created_By` | `ownerlookup` | - | - | - | 120 | Deal Information; system-managed |
| Modified By | `Modified_By` | `ownerlookup` | - | - | - | 120 | Deal Information; system-managed |
| Created Time | `Created_Time` | `datetime` | - | - | - | 120 | Deal Information; system-managed |
| Modified Time | `Modified_Time` | `datetime` | - | - | - | 120 | Deal Information; system-managed |
| Description | `Description` | `textarea` | - | - | - | 32000 | Description Information |
| Contact Name | `Contact_Name` | `lookup` | - | - | - | 120 | Deal Information; -> Contacts |
| Expected Revenue | `Expected_Revenue` | `currency` | - | - | yes | 16 | Deal Information; quick create; profiles: read_only |
| Last Activity Time | `Last_Activity_Time` | `datetime` | - | - | - | 120 | Deal Information; system-managed |
| Lead Conversion Time | `Lead_Conversion_Time` | `integer` | - | - | - | 9 | Deal Information; system-managed |
| Sales Cycle Duration | `Sales_Cycle_Duration` | `integer` | - | - | - | 9 | Deal Information; system-managed |
| Overall Sales Duration | `Overall_Sales_Duration` | `integer` | - | - | - | 9 | Deal Information; system-managed |
| Tag | `Tag` | `text` | - | - | - | 2000 | Deal Information; system-managed |
| Record Id | `id` | `bigint` | - | - | yes | 18 | Deal Information; profiles: read_only; system-managed |
| Change Log Time | `Change_Log_Time__s` | `datetime` | - | - | yes | 120 | not in layout; profiles: read_only; system-managed |
| Locked | `Locked__s` | `boolean` | - | - | yes | 5 | not in layout; profiles: read_only; system-managed |
| Reason For Loss | `Reason_For_Loss__s` | `picklist` | - | - | - | 120 | Deal Information; 10 options |
| Stage Modified Time | `Stage_Modified_Time` | `datetime` | - | - | - | 120 | not in layout; profiles: hidden; system-managed |
| Connected To | `Connected_To__s` | `multi_module_lookup` | - | - | - | 120 | Deal Information |

Deals `Stage` is a special picklist: 9 values (Qualification, Needs Analysis, Value Proposition, Identify Decision Makers, Proposal/Price Quote, Negotiation/Review, Closed Won, Closed Lost, Closed Lost to Competition), each carrying `probability`, `forecast_category`, `forecast_type`, `deal_category` and a record category; history tracking writes to the `DealHistory` field-tracker module. Pipeline configuration belongs to the Deals + pipeline research task (Pipelines is a separate Setup screen; only its existence is noted here). `Reason_For_Loss__s` is a 10-option picklist; Deals layout `Account_Name` and `Closing_Date` are marked required in the layout even though they are not system mandatory.

### Field properties exposed by the metadata (what the editor's field properties dialog must be able to represent)
Observed attribute keys per field: label, API name, data type + UI type, length, decimal places, system-mandatory vs layout-required, unique, read-only, tooltip, default value, picklist values (display/actual value, sequence, colour code, record category), global picklist link, lookup target + filter, formula, auto-number settings (prefix, start number, suffix), rollup summary, currency precision/rounding, `view_type` flags (view, create, edit, quick_create), per-profile permission, mass-update eligibility, sortable/filterable/searchable, history tracking, webhook/blueprint support. The dialog itself was not captured (see Open questions), so which of these are user-editable per type is not confirmed from the UI.

### Field-type inventory (all 42 exported modules)
Counts come from `modules/*/fields.json` (27 distinct `data_type` values; 3 modules failed to export fields: Visits, Actions_Performed, Approvals).

| data_type | Fields | Modules | Appears in |
|---|---|---|---|
| `lookup` | 212 | 31 | Accounts, Approval_Action_Logs__s, Approval_Logs__s, Approval_Records__s, Attachments, +26 more |
| `text` | 141 | 23 | Accounts, Attachments, Automation_Cadences__s, Calls, Campaigns, +18 more |
| `datetime` | 118 | 38 | Accounts, Approval_Action_Logs__s, Approval_Logs__s, Approval_Records__s, Attachments, +33 more |
| `picklist` | 105 | 30 | Accounts, Approval_Action_Logs__s, Approval_Logs__s, Cadences_Followups__s, Calls, +25 more |
| `ownerlookup` | 76 | 32 | Accounts, Approval_Action_Logs__s, Attachments, Automation_Cadences__s, Cadences_Followups__s, +27 more |
| `textarea` | 64 | 25 | Accounts, Approval_Action_Logs__s, Calls, Campaigns, Cases, +20 more |
| `bigint` | 51 | 38 | Accounts, Approval_Action_Logs__s, Approval_Logs__s, Approval_Records__s, Attachments, +33 more |
| `integer` | 47 | 11 | Accounts, Approval_Logs__s, Calls, Cases, DealHistory, +6 more |
| `double` | 46 | 14 | Accounts, Contacts, Events, Invoiced_Items, Invoices, +9 more |
| `currency` | 42 | 15 | Accounts, Campaigns, DealHistory, Deals, Email_Analytics, +10 more |
| `boolean` | 25 | 16 | Accounts, Calls, Cases, Contacts, Deals, +11 more |
| `multi_module_lookup` | 23 | 23 | Accounts, Approval_Logs__s, Approval_Records__s, Cadences_Followups__s, Campaigns, +18 more |
| `formula` | 20 | 8 | Invoiced_Items, Invoices, Ordered_Items, Purchase_Items, Purchase_Orders, +3 more |
| `date` | 16 | 10 | Campaigns, Contacts, DealHistory, Deals, Invoices, +5 more |
| `email` | 13 | 6 | Cases, Contacts, Email_Sentiment, Leads, Qualify_Leads_through_Email, +1 more |
| `phone` | 10 | 5 | Accounts, Cases, Contacts, Leads, Vendors |
| `userlookup` | 6 | 4 | Approval_Records__s, Locking_Information__s, Preferred_Team_Members__s, Team_Selling__s |
| `profileimage` | 5 | 5 | Accounts, Contacts, Leads, Products, Vendors |
| `autonumber` | 5 | 5 | Cases, Invoices, Quotes, Sales_Orders, Solutions |
| `website` | 4 | 4 | Accounts, Calls, Leads, Vendors |
| `module` | 4 | 4 | Approval_Records__s, Email_Analytics, Email_Sentiment, Email_Template_Analytics |
| `linetax` | 4 | 4 | Invoiced_Items, Ordered_Items, Purchase_Items, Quoted_Items |
| `subform` | 4 | 4 | Invoices, Purchase_Orders, Quotes, Sales_Orders |
| `RRULE` | 2 | 2 | Events, Tasks |
| `multireminder` | 2 | 1 | Events |
| `ALARM` | 1 | 1 | Tasks |
| `multiselectpicklist` | 1 | 1 | Products |

Mapping between API `data_type` and the editor's palette/listing label (inferred by matching Field Listing labels in `setup-leads-fields` / `setup-deals-fields` to metadata; items marked ? are not seen in UI):

| API data_type | UI label |
|---|---|
| `text` | Single Line (also used for system fields shown as "Single Line" such as Fax, Skype ID, Twitter) |
| `textarea` | Multi Line (Large) |
| `email`, `phone`, `currency`, `date`, `datetime` | Email, Phone, Currency, Date, Date/Time |
| `integer` | Number |
| `double` | Decimal ? |
| `bigint` | Long Integer ? (record id, system) |
| `boolean` | Boolean / Checkbox |
| `website` | URL |
| `picklist` | Pick List |
| `multiselectpicklist` | Multi-Select (only `Products.Tax`) |
| `lookup`, `ownerlookup`, `userlookup` | Lookup (owner fields appear as Lookup; Created By / Modified By appear as Single Line) |
| `multi_module_lookup` | shown raw as `multi_module_lookup` (the "Connected To" field) |
| `autonumber` | Auto-Number ? |
| `formula` | Formula ? |
| `profileimage` | Lead Image (Image Upload family) |
| `subform` | Subform ? |
| Address (ui type 777 container + sub-fields) | Address |
| `ALARM`, `RRULE`, `multireminder` | activity-only system types (Tasks reminder/recurrence, Meetings reminders), not in palette |
| `linetax`, `module` | system types for line items / analytics, not in palette |

Palette types with no instance in our metadata (not in use): Percent, File Upload, Rollup Summary, Radio Button, Multi-Select Lookup (the only multi-module lookup is the system "Connected To"). Auto-Number is used only by system numbering fields (Case, Solution, Quote, Sales Order, Invoice numbers); Formula only on inventory modules (Quotes, Sales Orders, Purchase Orders, Invoices and their `*_Items` subform modules). Subform is used only for the four line-item subforms.

### Modules with something to look at in later research tasks
| Module | Reason |
|---|---|
| Leads | 3 shared custom views (`Junk Leads`, `Not Qualified Leads`, `Open Leads`), 1 system-generated "custom" field (`Lead_Status_Modified_Time`, hidden from both profiles), inactive blueprint "Lead nurturing process" on `Lead_Status`; 0 workflows |
| Deals | 1 workflow, 2 email templates, 11 stock views, field-tracker module `DealHistory`; 0 custom fields |
| Contacts | `Email` is unique; Contacts has 10 views (stock) |
| Products | `Product_Name` is unique; only module with `multiselectpicklist` (`Tax`) |
| Quotes, Sales Orders, Purchase Orders, Invoices | formulas, auto-number, subforms (line items); modified from default on 2026-08-20 |
| Tasks, Meetings, Calls | many views (17, 11, 23), activity-specific types (`ALARM`, `RRULE`, `multireminder`); Tasks has an inactive blueprint "Task Process Management" |
| Cases, Solutions | auto-number fields; Cases modified from default |
| Vendors | modified from default |
| Forecasts, Approvals (My Jobs) | modified from default (2026-09-30 and 2026-07-20) |
| Qualify_Leads_through_Call/Email, Sales_Journey_Default_Path_Finder (CommandCenter children) | 37/40/85 system-generated "custom" fields (trigger/touchpoint columns), hidden; not user-configured |

No module has a second layout, no module has a user-created custom field, and no custom module exists.

## Actions

Module list (`setup-modules-main`):
- Click a module name: opens `/settings/modules/<Module>/layouts`.
- Row "..." menu next to the name (appears on hover; not opened in capture — the 18 action names per module come from `GET /v4/settings/modules/actions/supported_actions`, items are `{display_label, name}`; 29 modules supported).
- Status switch: show/hide a module (disabled for Leads and Contacts).
- Drag handle: reorder tabs.
- Search box; chips "Custom Module", "Team Module".
- "Create New Module", "Create Module Using Zia": create flows (not opened; no writes).
- Teamspace count link: shows teamspaces the module belongs to.
- Page tabs Modules / Web Tabs / Global Sets / Deal Management.

Module settings:
- Layouts: "Create New Layout"; click layout name to open the editor; Status switch; per-layout menu (clone/rename/set permissions — from `actions_allowed`).
- Layout Rules: "New Layout Rule" (empty).
- Validation Rules: "Create New Validation Rule" (empty).
- Fields: "Create and Edit Fields"; Field Permissions profile selector and per-field radio.
- Record Locking: "Configure Now".
- Map Dependency: "Create Map Dependency".
- Links / Buttons: create flows (not captured).

Layout editor: drag a palette type onto a section; drag fields between columns/sections/Unused Items; section gear (section properties); field "..." (properties, mark required, remove to Unused, delete custom field); NEW SECTION; Save, Save and Close, Cancel; tab switch Create / Quick Create / Detail View; "Manage Edit Page Buttons"; layout switcher dropdown; preview (eye icon at top-right of the canvas).

None of these actions were executed; only navigation was performed.

## Filters / views / sorting / search

- Module list: free-text search over module names; filter chips Custom Module and Team Module; sorting is the tab order (drag to reorder), not a column sort.
- Module settings left rail: search icon filters the module list.
- Field Listing: search by field label or data type; fixed alphabetical order by label.
- Field Permissions: profile selector.
- Global Sets: no search or filter.
- Custom views: not managed here; the per-module list views (`custom_views.json`) are surfaced on the module list pages (Leads/Contacts/Accounts/Deals specs). Leads has 14 views (11 system-defined incl. All Open Leads (default), All Locked Leads, Converted Leads, Mailing Labels, My Converted Leads, My Leads, Recently Created, Recently Modified, Todays Leads, Unread, Unsubscribed; plus 3 user-created shared views). Deals has 11 system views (All Deals as `ALLVIEWS` default, All Locked, Closing Next/This Month, My Deals, My Deals Closing This Month, New Last/This Week, Recently Created/Modified, Unread). Contacts 10, Accounts 8 (all system-defined).

## Flows

Flow A — Browse module configuration (read-only, what we captured)
1. Open Setup > Customization > Modules and Fields. Table loads (Modules tab). Empty state: if search finds nothing the table is empty.
2. Click Leads. The module settings page opens on the Layouts tab; the left rail highlights the module.
3. Switch tabs; each tab loads its own list; tabs with no configuration show an explicit "No ... Configured" empty state (Layout Rules, Validation Rules, Map Dependency) or a call-to-action card (Record Locking).
4. Open Summary to see counts and automation attachments.

Flow B — Open the layout editor
1. From Layouts tab click the layout name (or Fields > Create and Edit Fields).
2. Editor loads layout JSON with inner details and shows the Create tab; first visit shows a product-tour overlay.
3. Switch to Quick Create or Detail View to edit what each shows; Save is disabled until a change is made; Cancel with unsaved changes asks for confirmation (the same discard-confirm pattern appeared as "discard your changes?" dialog on the Deal Management route).

Flow C — Add or edit a field in the layout (not executed; described from palette, metadata and reference CRM behavior of the screen as far as visible)
1. Drag a type from New Fields into a section column (counter "Custom Fields Left" decrements) or drag an unused field from Unused Items.
2. Field card opens its properties (label, mandatory, unique where applicable, length/decimals, picklist options, default, tooltip, Quick Create / permissions).
3. Save validates, applies to all profiles assigned to the layout. Validation errors (duplicate label, quota exceeded when 0 left) block save. Not confirmed from the UI.

Flow D — Set field permissions
1. Fields tab > Field Permissions, choose profile (Administrator, Standard), set Read and Write / Read Only / Don't Show per field, save. Not executed.

Flow E — Toggle module visibility
1. Use the Status switch in the module list. The switch is disabled with an info icon on Leads and Contacts (cannot be hidden). Not executed.

Error/empty states observed: empty lists for Layout Rules, Validation Rules, Map Dependency, Web Tabs; Links and Buttons tabs rendered blank in the capture because the tool blocked a POST (see Data needs).

## Data needs

Requests observed (method, path, key query parameters, response field names; values omitted). All GET unless noted. Base host `crm.reference CRM.com`.

Module list page:
- `GET /crm/v6/settings/modules?include=team_spaces&status=...` → `modules[]` with `api_name, id, singular_label, plural_label, actual_singular_label, actual_plural_label, generated_type, show_as_tab, visibility, visible?, status, creatable, editable, deletable, convertable, quick_create, lookupable, sub_menu_available, profile_count, profiles[], team_spaces, parent_module, business_card_field_limit, recycle_bin_on_delete, modified_time, modified_by, web_link, api_supported, feeds_required, public_fields_configured, arguments, access_type, source, private_profile, has_more_profiles, isBlueprintSupported, global_search_supported, presence_sub_menu`.
- `GET /crm/v2.2/settings/modules?feature_name=...` (older shape incl. `scoring_supported, webform_supported, email_parser_supported, inventory_template_supported, triggers_supported, filter_supported, emailTemplate_support, sequence_number`).
- `GET /crm/v4/settings/modules/actions/supported_actions` → `modules[]{api_name, id, name, singular_label, plural_label, actions[]{name, display_label}}`.
- `GET /crm/v2.2/settings/modules/actions/relationships` → `modules[]{api_name, id, relationships[]{type, related_to[]{module{api_name,id}, mandated_in_any_layout}}}`.
- `GET /crm/v6/settings/modules/actions/associations` → `modules[]{api_name, id, associations[]{type, resource{api_name,name,id}, details{related_module, related_list}}}`.
- `GET /crm/v6/settings/customize` → `settings_customization.components[]{api_name, display_label, sequence_number, show, generated_type, menus[]{..., sub_menus[]{api_name, display_label, url, action, show, permissions}}}` (drives the Setup navigation tree).
- `GET /crm/v9/settings/profiles?type=private_profile` and `?include_types=...` → `profiles[]{id, name, display_label, api_name, description, custom, type}`, `info`.
- Legacy internal calls on the same page: `GET ModuleMeta.do` (`tabInfo`, `modules`), `POST PageLayout.do` (`action` param; returns `features`, `allModules`, `zbModules`), `GET PageLayout.do?action=moduleList`.

Module settings / Layouts tab:
- `GET /crm/v3/settings/layouts?module=<Module>&include_inner_details&include=total_profiles&fields=has_more_profiles,created_time,created_for,visible,profiles,source,...` → `layouts[]{id, name, display_label, status, generated_type, visible, profiles[]{id, name, default, _default_view, _default_assignment_view}, actions_allowed{...}, show_business_card, convert_mapping (Leads only), has_more_profiles, created_time, modified_time}`.
- `GET /crm/v2.2/settings/layouts?module=<Module>&fields=id,status`.
- `GET /crm/v9/settings/wizards?module=<Module>` → `info{wizard_count, limits{...}}` (wizards are a separate customization feature).
- `GET /crm/v4/settings/custom_buttons/actions/count?module=<Module>` → `count`; `GET /crm/v9/settings/custom_buttons?module=<Module>` (204/empty in our org).
- `POST /crm/v9/settings/profiles/actions/get_assigned` (**blocked** by the capture tool on the Links and Buttons tabs; the tabs rendered blank).

Layout editor:
- `GET /crm/v8/settings/layouts/<layoutId>?module=<Module>&mode=all&include_inner_details` → one layout with `sections[]{id, api_name, display_label, name, sequence_number, column_count, tab_traversal, isSubformSection, generated_type, type, fields[]{...full field object + required, section_id, subform_properties, validation_rule}}` plus `convert_mapping`.
- `GET /crm/v2.2/settings/layouts?module=<Module>&include_element_types&include_inner_details&include=total_profiles&fields=...` (list with full detail).
- `GET /crm/v3/settings/related_lists?module=<Module>` → `related_lists[]{visible, visibility, personality_name, module, record_operations{edit, create, bulk_edit, delete, ...}}` (35 for Leads; detail belongs to the Detail View/related-lists research).
- `GET /crm/v10/settings/layouts/<layoutId>/map_dependency?module=<Module>` (empty, 204).
- `GET /crm/v9/settings/global_map_dependency` → `global_map_dependency[]{restrict_external_values, parent_global_picklist{api_name,id,rid}, child_global_picklist{...}}`.
- `GET /crm/v9/settings/variable_groups`, `GET /crm/v7/settings/slyteui`, `GET /crm/v7/settings/cscript_pages` (client script, developer features; ignore for parity).

Fields tab:
- `GET /crm/v2.2/settings/fields?module=<Module>&include=allowed_permissions_to_update&include_external_fields` → `fields[]` (full field object incl. `allowed_permissions_to_update{read_write, read_only, hidden}`, `profiles[]{id, name, permission_type}`, `view_type{view, edit, quick_create, create}`, `pick_list_values[]`, `lookup`, `formula`, `auto_number`, `unique`, `system_mandatory`, `length`, `decimal_place`, `ui_type`, `data_type`, `json_type`, `custom_field`, `created_source`, ...).

Global Sets:
- Global picklist list call (path not isolated in the capture; shape: name, used-in modules, created/modified by).

Not run by us but implied by the screen (write calls, never executed): layout create/update/delete, field create/update/delete, field permission update, module status/sequence update.

Other: reference metadata export (`~/Desktop/mepcity-research/metadata/`) already contains the same data in API v4 form and is the offline source for the parity data model.

## Capture refs

Captured (all read-only; `blockedRequests` and `skippedClicks` empty unless noted):
- `setup-modules-main` — Modules and Fields home.
- `setup-leads-layouts` — Leads > Layouts tab.
- `setup-leads-layout-editor` — Leads Standard layout editor, Create tab (tour overlay present).
- `setup-leads-fields` — Leads > Fields > Field Listing.
- `setup-leads-field-permissions` — Leads > Fields > Field Permissions.
- `setup-leads-layout-rules`, `setup-leads-validation-rules`, `setup-leads-locking`, `setup-leads-map-dependency`.
- `setup-leads-links`, `setup-leads-buttons` — blockedRequests: `POST /crm/v9/settings/profiles/actions/get_assigned` (tab rendered blank).
- `setup-leads-summary`, `setup-deals-summary`, `setup-contacts-summary`, `setup-accounts-summary`, `setup-tasks-summary`.
- `setup-deals-fields`.
- `setup-web-tabs`, `setup-global-sets`.
- `setup-deal-management` — blocked by a "discard your changes" confirmation dialog; page content not captured.
- Attempted but failed: Quick Create tab click in the layout editor (click intercepted by the onboarding overlay; no output kept).

Metadata cross-checked: `~/Desktop/mepcity-research/metadata/modules.json`, `modules/*/fields.json`, `modules/*/layouts.json`, `modules/*/custom_views.json`, `profiles.json`, `blueprints.json`.

## Open questions

1. **Onboarding overlay blocks the layout editor.** A "new feature" tour covers the editor and intercepts pointer events, so Quick Create, Detail View, field properties dialog, section properties, and the Unused Items list could not be captured. Dismissing the tour (Skip) writes a per-user UI flag in reference CRM, so we did not click it. Need board decision: either dismiss it themselves once in the shared reference CRM window or explicitly allow the Skip click, then re-capture the editor (about 4 captures). Until then field-property options are inferred from metadata only.
2. **Deal Management page** (`/settings/teamselling`) opened a "discard your changes?" dialog on load; real content not captured. Metadata shows a hidden `Team_Selling__s` module (parent Deals, 0 profiles) and `Preferred_Team_Members__s`; unknown whether Team Selling is enabled.
3. **Links / Buttons tabs** render blank because the tool blocks the POST `get_assigned` (it is a read-only lookup but is a POST). Summary shows 0 buttons/links for the five modules checked; other modules not checked.
4. **UI vs metadata mismatches:**
   - Leads Field Listing shows 28 rows and Summary says "System Fields 33"; `fields.json` has 56 fields (55 non-custom). The listing and the summary evidently apply different filters (hidden/system-managed fields excluded); the exact rule is unknown. Same for Deals (listing 18, summary 19, metadata 29), Contacts (summary 43 vs 61), Accounts (37 vs 51), Tasks (12 vs 20).
   - Created By / Modified By are `ownerlookup` in metadata but listed as "Single Line"; Fax, Skype ID, Twitter are `text` in metadata and "Single Line" (Fax is labelled "Fax"); `Lead_Image` shows as "Lead Image".
   - Leads Summary says 1 custom field out of 300; the editor counter says 299 left; the only `custom_field: true` field (`Lead_Status_Modified_Time`) has `created_source: default` (system-generated by reference CRM), is hidden from both profiles and is not in the layout. So "custom" here does not mean user-created.
   - Layout stores 38 fields in Lead Information, but the Create tab shows 23 inputs; the rest are read-only/system fields (Created Time, Full Name, Tag, Converted *, etc.) shown only in Detail View — to confirm with the Detail View capture.
   - Deals layout marks Account Name and Closing Date as required though not system mandatory; unknown whether this was a deliberate board change (module last modified 2026-08-22) or a default.
   - `modules.json` lists `Visits`, `Actions_Performed`, `Approvals` without fields (export error); Visits/Approvals exist in the UI list.
   - UI list includes "Services" (no teamspace, shared to none) that has no entry in `modules.json`.
   - Module Name for Price Books displays as "PriceBooks" in the list.
5. **Modified-from-default modules** (Leads, Deals, Contacts, Accounts, Quotes, Sales Orders, Purchase Orders, Invoices, Vendors on 2026-08-20/22; Meetings 2026-07-04; Cases 2026-04-13; Forecasts 2026-09-30): we cannot tell from metadata what changed (all fields have `created_source: default`, no custom fields, one layout). Likely candidates: field/section visibility or picklist edits. Could be compared against reference CRM's stock defaults in a later pass.
6. **Last-modified owner** is shown with a user's name in the UI; intentionally not recorded here.
7. **Workflow rules export** returned `API_NOT_SUPPORTED`; automation counts in this spec come only from the Summary tab (Deals: 1 workflow, 2 templates; others 0). Details belong to the Automation research task.
8. **Teamspaces** (every module row says "1 Teamspaces") are a reference CRM feature outside this task's scope; the parity need is not determined.
9. Which of the 18 per-module actions in `supported_actions` appear in the row "..." menu is unknown; the menu was not opened.
