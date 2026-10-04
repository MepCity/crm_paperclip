# Leads — fields and layout configuration

Status: approved (MEP-16, Module 1 Leads, research 1/5). Read-only study of the live reference CRM; metadata export dated 2026-10-03. Captures are referenced by slug only (they live outside the repo). Scope is the Leads module only; other modules' setup pages, the module list and the layout editor itself are out of scope.

Conventions: `<org>` stands for the org segment of the reference CRM URL, `<layoutId>` for a layout id. Source of truth is `~/Desktop/mepcity-research/metadata/modules/Leads/` (`fields.json`, `layouts.json`, `related_lists.json`); captures only confirm what metadata cannot show. Form-flag shorthand used below: `V` = shown in detail view, `C` = shown on create, `E` = shown on edit, `Q` = in quick create (taken from the `view_type` flags of each field).

## Purpose

Leads is the first module of the rebuild. This spec defines the Leads data model (every field, type, constraint and picklist), how the Standard layout arranges those fields (sections, columns, order), what the create, quick-create and detail forms show, which related lists the lead detail page offers, and how a lead's fields map onto Contacts, Accounts and Deals when it is converted. It is the input for the Leads schema, create/edit form and conversion implementation. The admin UI that edits this configuration (Setup > Customization > Modules and Fields > Leads) is described only as far as it tells us what the configuration contains.

**What is actually configured for Leads in our org.** Almost entirely stock:

| Capability | Status for Leads | Evidence |
|---|---|---|
| User-created custom fields | not in use. The one field flagged `custom_field=true` (`Lead_Status_Modified_Time`) is system-generated and hidden | `fields.json`; `setup-leads-summary` ("Custom Fields 1 out of 300") |
| More than one layout | not in use: one layout, `Standard`, shared to both profiles | `layouts.json`; `setup-leads-layouts` |
| Layout rules | not in use | "No Rules Configured" in `setup-leads-layout-rules` |
| Validation rules | not in use | "No Rules Configured" in `setup-leads-validation-rules` |
| Record locking configuration | not in use | "Configure Now" empty state in `setup-leads-locking` |
| Map dependency (dependent picklists) | not in use | "No Mapping Configured" in `setup-leads-map-dependency` |
| Custom links / custom buttons | not in use | Summary "Buttons 0 / Links 0" in `setup-leads-summary` |
| Workflows, assignment rules, approvals, templates, cadences attached to Leads | none (all 0) | `setup-leads-summary` |
| Unique fields, default values, tooltips, field history tracking | none (no field has any) | `fields.json` |
| Field-level permissions | only system-managed fields are read-only or hidden, identical for both profiles | `fields.json` `profiles[]`; `setup-leads-field-permissions` |

Parity target is therefore the stock behaviour below. Rows marked "not in use" are documented for completeness and must not enter the parity checklist. Module-level facts from `modules.json`: label Lead / Leads; creatable, editable, deletable, convertable, quick-create enabled, API supported, global search supported, blueprint supported; shown as tab, cannot be hidden; visible to 2 profiles (Administrator, Standard). The module was last modified in August 2026 but the metadata does not reveal what changed (see Open questions).

## Layout

### 1. Setup pages for Leads (what the admin area contains)

Route `/settings/modules/Leads/<tab>`. A left rail lists customizable modules; the main area has the heading "Leads" and a tab strip: Layouts, Layout Rules, Validation Rules, Fields (sub-pills Field Listing and Field Permissions, plus a "Create and Edit Fields" button that opens the layout editor), Record Locking Configuration, Map Dependency Fields (extra "Preferences" tab on that page, not captured), Links, Buttons, Summary. Tabs with no configuration show an explicit empty state.

- **Layouts tab** (`setup-leads-layouts`): one row, `Standard`, shared to Administrator and Standard, status on, with "Create New Layout" above. Layout `actions_allowed`: edit, rename, clone, set layout permissions = true; delete, deactivate, downgrade = false. Layout-to-profile assignment is in `layouts.json` `profiles[]`: both profiles have `Standard` as default view and default assignment view.
- **Field Listing** (`setup-leads-fields`): searchable table with columns Fields, Data Type, Custom Field. It lists **29** fields: Address, Annual Revenue, Company, Connected To, Converted Account, Converted Contact, Converted Deal, Created By, Description, Email, Email Opt Out, Fax, First Name, Industry, Last Name, Lead Image, Lead Owner, Lead Source, Lead Status, Mobile, Modified By, No. of Employees, Phone, Rating, Secondary Email, Skype ID, Title, Twitter, Website. It omits the address sub-fields (only the composite Address appears), Salutation, Full Name, the time stamps, Tag, conversion bookkeeping and other system fields.
- **Field Permissions** (`setup-leads-field-permissions`): profile selector (starts on Administrator) and one row per field with radio columns Read and Write / Read Only / Don't Show. It lists **26** fields: the Field Listing set minus Converted Account, Converted Contact and Converted Deal.
- **Summary** (`setup-leads-summary`): read-only card; Customization group shows module permission (Administrator, Standard), layouts (Standard), "System Fields 33", "Custom Fields 1 out of 300", Buttons 0, Links 0; Automation group shows all zeros.

### 2. Standard layout

Four sections (from `layouts.json`; the layout also has `show_business_card=true`, with `business_card_field_limit` = 5 at module level):

- **Lead Image** — 1 column, 1 field, section order 1. Field order (`sequence_number`; * = required in layout): 1: Lead Image.
- **Lead Information** — 2 columns, 38 fields, section order 2. Field order (`sequence_number`; * = required in layout): 1: Lead Owner; 2: Company *; 3: First Name; 4: Last Name *; 4: Full Name; 5: Title; 6: Email; 7: Phone; 8: Fax; 9: Mobile; 10: Website; 11: Lead Source; 12: Lead Status; 13: Industry; 14: No. of Employees; 15: Annual Revenue; 16: Rating; 16: Tag; 18: Created By; 19: Email Opt Out; 20: Skype ID; 21: Modified By; 22: Created Time; 23: Modified Time; 26: Salutation; 30: Secondary Email; 30: Twitter; 31: Last Activity Time; 40: Converted Date Time; 46: Lead Conversion Time; 47: Unsubscribed Mode; 48: Unsubscribed Time; 49: Converted Account; 50: Converted Contact; 51: Converted Deal; 51: Record Id; 52: Is Converted; 57: Connected To. Repeated sequence numbers: 4, 16, 30, 51.
- **Address Information** — 2 columns, 10 fields, section order 3. Field order (`sequence_number`; * = required in layout): 1: Address; 1: Address - City; 1: Address - Coordinates; 1: Address - Country / Region; 1: Address - Flat / House No./ Building / Apartment Name; 1: Address - Latitude; 1: Address - Longitude; 1: Address - State / Province; 1: Address - Street Address; 1: Address - Zip / Postal Code. Repeated sequence numbers: 1.
- **Description Information** — 1 column, 1 field, section order 4. Field order (`sequence_number`; * = required in layout): 1: Description.

Address Information holds the composite `Address` field plus its nine sub-fields (Country/Region, Flat/House No./Building/Apartment Name, Street Address, City, State/Province, Zip/Postal Code, Latitude, Longitude, and the read-only Coordinates, which the editor shows as a hidden sub-field); the metadata gives every one of them sequence 1, so their on-screen order is not derivable from sequence numbers and must be taken from the editor capture (order seen for the first eight: Country/Region, Flat/House No./Building/Apartment Name, Street Address, City, State/Province, Zip/Postal Code, Latitude, Longitude).

**Column placement.** Metadata does not store left/right placement. The Create canvas in `setup-leads-layout-editor` is the only source. It shows Lead Information as two columns:
- Left: Lead Owner, First Name (with a Salutation dropdown attached), Title, Phone, Mobile, Lead Source, Industry, Annual Revenue, Email Opt Out, Modified By, Connected To.
- Right: Company, Last Name, Email, Fax, Website, Lead Status, No. of Employees, Rating, Created By, Skype ID, Twitter, Secondary Email.

Sorting those fields by `sequence_number` shows the pattern odd numbers = left column, even numbers = right column, holding for all 23 inputs seen (Lead Owner 1, Company 2, First Name 3, Last Name 4, Title 5, Email 6, Phone 7, Fax 8, Mobile 9, Website 10, Lead Source 11, Lead Status 12, Industry 13, No. of Employees 14, Annual Revenue 15, Rating 16, Created By 18, Email Opt Out 19, Skype ID 20, Modified By 21, Twitter 30 and Secondary Email 30 (right), Connected To 57). Treat this as an observed rule for those fields only; the detail-only fields (Created Time, Modified Time, Full Name, Tag, Last Activity Time, Salutation, conversion fields) were not rendered on the Create canvas, so their column is unknown. Lead Image (1 column) and Description (1 column) are single-column sections.

### 3. Create, edit, quick create and detail forms

Derived from the per-field `view_type` flags (view 44 fields, create 34, edit 33, quick create 5):

- **Create form.** Fields with `C` set. Lead Information: Lead Owner, Company, Last Name (system-required), First Name, Salutation (rendered attached to First Name), Title, Email, Phone, Fax, Mobile, Website, Lead Source, Lead Status, Industry, No. of Employees, Annual Revenue, Rating, Skype ID, Email Opt Out, Secondary Email, Twitter, Connected To. Plus Lead Image, the address block (all sub-fields have `C` on; Coordinates is read-only) and Description. Created By, Modified By, Created Time, Modified Time, Full Name, Tag, Last Activity Time and all conversion/system fields have `C` off.
- **Edit form.** Same as create except `Connected To` has `E` off (create-only) and the system-managed fields stay off.
- **Quick create** (5 fields, order from `quick_sequence_number`): 1 Company, 2 First Name, 3 Last Name, 4 Email, 5 Phone. Company and Last Name are the required ones.
- **Detail view.** Fields with `V` set. Not shown in detail although they are in the layout: First Name, Last Name, Salutation, Converted Account, Converted Contact, Converted Deal. Detail shows `Full Name` instead of First Name / Last Name / Salutation. Detail adds the read-only system fields: Created By, Modified By, Created Time, Modified Time, Last Activity Time, Tag, Converted Date Time, Lead Conversion Time, Unsubscribed Mode, Unsubscribed Time, Record Id, Is Converted. Converted Account / Converted Contact / Converted Deal are in the layout but have all four flags off, so they do not appear on any form. By their names they are filled by conversion (inferred, not confirmed).
- **Business card.** `show_business_card` is on. Fields flagged `businesscard_supported`: Address - Latitude, Address - Longitude, Lead Owner, Title, Email, Phone, Fax, Mobile, Website, Lead Source, Lead Status, Industry, No. of Employees, Annual Revenue, Rating, Created By, Modified By, Description, Skype ID, Email Opt Out, Secondary Email, Twitter, Address, Address - Country / Region, Address - Flat / House No./ Building / Apartment Name, Address - Street Address, Address - City, Address - State / Province, Address - Zip / Postal Code, Address - Coordinates. Which five (limit) are shown on the card is not in the metadata.
- Fields in the metadata but not in the layout: Change Log Time, Locked, Last Enriched Time, Enrich Status, Distance (`nearby_distance__s`), Lead Status Modified Time. All are system-managed.

The layout editor (Create / Quick Create / Detail View canvas tabs) was captured only for the Create tab; Quick Create and Detail View membership above comes from metadata flags (see Open questions).

### 4. Related lists on the lead detail page

`related_lists.json` has **35** entries; **5 are hidden** (`visible=false`): Review Process-Review Summary, WebformUsage, Review Process-Field History, Email Sentiment, Email Drafts. `record_operations` shows which row actions the list offers (listed true flags only; `bulk_edit`, `assign` are never true here). Columns: sequence, API name, module, type, visible, operations.

| Seq | API name | Module | Type | Visible | Record operations |
|---|---|---|---|---|---|
| 1 | `Connected_Records__s` | - | `combined_view` | yes | - |
| 1 | `Review_Processes` | `Review_Processes` | `default` | no | - |
| 1 | `WebformUsage` | `WebformUsage` | `default` | no | - |
| 2 | `Entity_Cadences_leads` | `Entity_Cadences__s` | `default` | yes | - |
| 2 | `Review_Logs` | `Review_Logs` | `default` | no | - |
| 3 | `Notes` | `Notes` | `default` | yes | - |
| 4 | `Attachments` | `Attachments` | `default` | yes | - |
| 5 | `Products` | `Products` | `default` | yes | disassociate |
| 7 | `Calls` | `Calls` | `default` | yes | edit, create |
| 8 | `Events` | `Events` | `default` | yes | edit, create |
| 9 | `Tasks` | `Tasks` | `default` | yes | edit, create |
| 11 | `Email_Sentiment` | `Email_Sentiment` | `default` | no | - |
| 11 | `Tasks_History` | `Tasks` | `default` | yes | edit, create |
| 12 | `Events_History` | `Events` | `default` | yes | edit, create |
| 13 | `Calls_History` | `Calls` | `default` | yes | edit, create |
| 16 | `Invited_Events` | `Events` | `default` | yes | edit, delete |
| 17 | `Emails` | `Emails` | `default` | yes | create, delete |
| 18 | `Campaigns` | `Campaigns` | `default` | yes | edit, disassociate |
| 19 | `Social` | `Social` | `default` | yes | - |
| 20 | `CheckLists` | `CheckLists` | `default` | yes | - |
| 21 | `Locking_Information__s` | `Locking_Information__s` | `default` | yes | - |
| 118 | `Connected_Record_Child12` | `Invoices` | `default` | yes | create |
| 119 | `Connected_Record_Child1` | `Accounts` | `default` | yes | create |
| 120 | `Connected_Record_Child2` | `Contacts` | `default` | yes | create |
| 121 | `Connected_Record_Child3` | `Deals` | `default` | yes | create |
| 122 | `Connected_Record_Child4` | `Campaigns` | `default` | yes | create |
| 123 | `Connected_Record_Child5` | `Cases` | `default` | yes | create |
| 124 | `Connected_Record_Child6` | `Solutions` | `default` | yes | create |
| 125 | `Connected_Record_Child7` | `Products` | `default` | yes | create |
| 126 | `Connected_Record_Child8` | `Vendors` | `default` | yes | create |
| 127 | `Connected_Record_Child9` | `Quotes` | `default` | yes | create |
| 128 | `Connected_Record_Child10` | `Sales_Orders` | `default` | yes | create |
| 129 | `Connected_Record_Child11` | `Purchase_Orders` | `default` | yes | create |
| 130 | `Voice_of_the_Customer__s` | - | `default` | yes | - |
| 131 | `Email_Drafts__s` | `Email_Drafts__s` | `default` | no | - |

The `Connected_Record_Child*` entries appear to be generated lists, one per module that can be linked through the "Connected To" field (inferred from names) (Invoices, Accounts, Contacts, Deals, Campaigns, Cases, Solutions, Products, Vendors, Quotes, Sales Orders, Purchase Orders); only "create" is allowed on them. Module-specific behaviour of each related list belongs to the Detail View research task.

## Fields

Field dictionary for Leads, from `fields.json` + `layouts.json` (**56 fields**; all have `created_source=default`; origin is therefore system for every field). Columns: Req. = `sys` (system mandatory, cannot be turned off), `layout` (marked required in the Standard layout) or `-`; Len = `length` (and decimal places after a comma); RO = `read_only` flag; Forms = `VCEQ` flags (see Conventions); Seq = `sequence_number` inside the layout section; Unique, default value, tooltip, history tracking are empty for every field and not repeated per row. Rows are grouped by layout section in sequence order; the last group is not in the layout.

| Label | API name | Type | Len | Req. | RO | Forms | Seq | Layout section | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Lead Image | `Record_Image` | `profileimage` | 255 | - | - | `VCE-` | 1 | Lead Image |  |
| Lead Owner | `Owner` | `ownerlookup` | 120 | - | - | `VCE-` | 1 | Lead Information | `field_read_only` |
| Company | `Company` | `text` | 200 | layout | - | `VCEQ` | 2 | Lead Information | mass update; quick create #1 |
| First Name | `First_Name` | `text` | 40 | - | - | `-CEQ` | 3 | Lead Information | quick create #2 |
| Last Name | `Last_Name` | `text` | 80 | sys | - | `-CEQ` | 4 | Lead Information | quick create #3 |
| Full Name | `Full_Name` | `text` | 120 | - | - | `V---` | 4 | Lead Information |  |
| Title | `Designation` | `text` | 100 | - | - | `VCE-` | 5 | Lead Information | mass update |
| Email | `Email` | `email` | 100 | - | - | `VCEQ` | 6 | Lead Information | quick create #4 |
| Phone | `Phone` | `phone` | 30 | - | - | `VCEQ` | 7 | Lead Information | mass update; quick create #5 |
| Fax | `Fax` | `text` | 30 | - | - | `VCE-` | 8 | Lead Information | mass update |
| Mobile | `Mobile` | `phone` | 30 | - | - | `VCE-` | 9 | Lead Information | mass update |
| Website | `Website` | `website` | 255 | - | - | `VCE-` | 10 | Lead Information | mass update |
| Lead Source | `Lead_Source` | `picklist` | 120 | - | - | `VCE-` | 11 | Lead Information | 17 options; mass update |
| Lead Status | `Lead_Status` | `picklist` | 120 | - | - | `VCE-` | 12 | Lead Information | 9 options; mass update |
| Industry | `Industry` | `picklist` | 120 | - | - | `VCE-` | 13 | Lead Information | 19 options; mass update |
| No. of Employees | `No_of_Employees` | `integer` | 9 | - | - | `VCE-` | 14 | Lead Information | mass update |
| Annual Revenue | `Annual_Revenue` | `currency` | 16,2 | - | - | `VCE-` | 15 | Lead Information | mass update |
| Rating | `Rating` | `picklist` | 120 | - | - | `VCE-` | 16 | Lead Information | 6 options; mass update |
| Tag | `Tag` | `text` | 2000 | - | - | `V---` | 16 | Lead Information |  |
| Created By | `Created_By` | `ownerlookup` | 120 | - | - | `V---` | 18 | Lead Information |  |
| Email Opt Out | `Email_Opt_Out` | `boolean` | 5 | - | - | `VCE-` | 19 | Lead Information | mass update |
| Skype ID | `Skype_ID` | `text` | 50 | - | - | `VCE-` | 20 | Lead Information | mass update |
| Modified By | `Modified_By` | `ownerlookup` | 120 | - | - | `V---` | 21 | Lead Information |  |
| Created Time | `Created_Time` | `datetime` | 120 | - | - | `V---` | 22 | Lead Information |  |
| Modified Time | `Modified_Time` | `datetime` | 120 | - | - | `V---` | 23 | Lead Information |  |
| Salutation | `Salutation` | `picklist` | 25 | - | - | `-CE-` | 26 | Lead Information | 6 options; mass update |
| Secondary Email | `Secondary_Email` | `email` | 100 | - | - | `VCE-` | 30 | Lead Information |  |
| Twitter | `Twitter` | `text` | 50 | - | - | `VCE-` | 30 | Lead Information |  |
| Last Activity Time | `Last_Activity_Time` | `datetime` | 120 | - | - | `V---` | 31 | Lead Information | `field_read_only` |
| Converted Date Time | `Converted_Date_Time` | `datetime` | 120 | - | - | `V---` | 40 | Lead Information |  |
| Lead Conversion Time | `Lead_Conversion_Time` | `integer` | 9 | - | - | `V---` | 46 | Lead Information | `field_read_only` |
| Unsubscribed Mode | `Unsubscribed_Mode` | `picklist` | 120 | - | yes | `V---` | 47 | Lead Information | 4 options; `field_read_only`; both profiles read_only |
| Unsubscribed Time | `Unsubscribed_Time` | `datetime` | 120 | - | yes | `V---` | 48 | Lead Information | `field_read_only`; both profiles read_only |
| Converted Account | `Converted_Account` | `lookup` | 120 | - | yes | `----` | 49 | Lead Information | -> Accounts; `field_read_only`; both profiles read_only |
| Converted Contact | `Converted_Contact` | `lookup` | 120 | - | yes | `----` | 50 | Lead Information | -> Contacts; `field_read_only`; both profiles read_only |
| Converted Deal | `Converted_Deal` | `lookup` | 120 | - | yes | `----` | 51 | Lead Information | -> Deals; `field_read_only`; both profiles read_only |
| Record Id | `id` | `bigint` | 18 | - | yes | `V---` | 51 | Lead Information | `field_read_only`; both profiles read_only |
| Is Converted | `Converted__s` | `boolean` | 5 | - | yes | `V---` | 52 | Lead Information | `field_read_only`; both profiles read_only |
| Connected To | `Connected_To__s` | `multi_module_lookup` | 120 | - | - | `VC--` | 57 | Lead Information |  |
| Address - Latitude | `Latitude` | `double` | 50,9 | - | - | `VCE-` | 1 | Address Information |  |
| Address - Longitude | `Longitude` | `double` | 50,9 | - | - | `VCE-` | 1 | Address Information |  |
| Address | `Address` | `textarea` | 2000 | - | yes | `VCE-` | 1 | Address Information | `field_read_only` |
| Address - Country / Region | `Country` | `picklist` | 120 | - | - | `VCE-` | 1 | Address Information | 248 options (global set `Country__s`) |
| Address - Flat / House No./ Building / Apartment Name | `Flat_House_No_Building_Apartment_Name` | `text` | 255 | - | - | `VCE-` | 1 | Address Information |  |
| Address - Street Address | `Street` | `text` | 255 | - | - | `VCE-` | 1 | Address Information |  |
| Address - City | `City` | `text` | 255 | - | - | `VCE-` | 1 | Address Information |  |
| Address - State / Province | `State` | `picklist` | 120 | - | - | `VCE-` | 1 | Address Information | 3954 options (global set `States__s`) |
| Address - Zip / Postal Code | `Zip_Code` | `text` | 255 | - | - | `VCE-` | 1 | Address Information |  |
| Address - Coordinates | `Coordinates` | `textarea` | 255 | - | yes | `VCE-` | 1 | Address Information | `field_read_only` |
| Description | `Description` | `textarea` | 32000 | - | - | `VCE-` | 1 | Description Information |  |
| Change Log Time | `Change_Log_Time__s` | `datetime` | 120 | - | yes | `----` | - | (not in layout) | `field_read_only`; both profiles read_only |
| Locked | `Locked__s` | `boolean` | 5 | - | yes | `----` | - | (not in layout) | `field_read_only`; both profiles read_only |
| Last Enriched Time | `Last_Enriched_Time__s` | `datetime` | 120 | - | yes | `----` | - | (not in layout) | `field_read_only`; both profiles read_only |
| Enrich Status | `Enrich_Status__s` | `picklist` | 120 | - | yes | `----` | - | (not in layout) | 3 options; `field_read_only`; both profiles read_only |
| Distance | `nearby_distance__s` | `double` | 16,2 | - | yes | `----` | - | (not in layout) | `field_read_only`; both profiles read_only |
| Lead Status Modified Time | `Lead_Status_Modified_Time` | `datetime` | 120 | - | - | `----` | - | (not in layout) | `field_read_only`; both profiles hidden; `custom_field=true`, system-generated |

Constraints that hold across the module:
- Required: `Last_Name` (system mandatory) and `Company` (required by the layout only). No other field is required. No field is unique, so duplicates are allowed on every field including Email.
- Default values: none. Every field has an empty `default_value` and no picklist option is flagged as the default.
- `field_read_only` (type fixed by the system, cannot be changed in Field Permissions): Lead Owner, Last Activity Time, Lead Conversion Time, Unsubscribed Mode, Unsubscribed Time, Converted Account, Converted Contact, Converted Deal, Record Id, Change Log Time, Is Converted, Locked, Last Enriched Time, Enrich Status, Address, Address - Coordinates, Distance, Lead Status Modified Time.
- Mass-update eligible (`mass_update=true`): Company, Title, Phone, Fax, Mobile, Website, Lead Source, Lead Status, Industry, No. of Employees, Annual Revenue, Rating, Skype ID, Email Opt Out, Salutation.
- Types seen on Leads and the label used in the Field Listing: `text` Single Line (Fax shows as "Fax"), `textarea` Multi Line (Large) (Address shows as "Address"), `email` Email, `phone` Phone, `website` URL, `picklist` Pick List, `integer` Number, `currency` Currency, `boolean` Boolean (palette calls it Checkbox), `datetime` Date/Time, `double` Decimal, `bigint` Long Integer, `lookup` / `ownerlookup` Lookup (Created By / Modified By display as Single Line), `profileimage` Lead Image, `multi_module_lookup` shown raw. UI label names are inferred by matching Field Listing rows to metadata; where the UI never shows a type, it is unconfirmed.
- Precision: `Annual_Revenue` has 2 decimal places (length 16); `Latitude` / `Longitude` are `double` with 9 decimal places (length 50); `nearby_distance__s` has 2 decimal places.
- `Address` is a composite (ui type 777) container; its stored value is a text field and the address parts are separate fields. `Coordinates` is a read-only text field derived from latitude/longitude.
- Salutation is a picklist stored in its own field (`Salutation`) but rendered as a dropdown attached to First Name; it has `V` off.
- First Name, Last Name and Salutation have `V` off; the detail header uses `Full_Name` (system text, read-only).

### Picklists

Configuration only, taken from `pick_list_values` sorted by `sequence_number`. Display value is shown; the stored (actual) value is given only where it differs. All picklists are static (no colour codes, not sorted lexically except Unsubscribed Mode). None has a default option; the first option of the editable picklists is the placeholder `-None-`.

- **Lead Source** (17): 1. -None-; 2. Advertisement; 3. Cold Call; 4. Employee Referral; 5. External Referral; 6. Online Store (stored `OnlineStore`); 7. X (Twitter) (stored `Twitter`); 8. Facebook; 9. Partner; 10. Public Relations; 11. Sales Email Alias (stored `Sales Mail Alias`); 12. Seminar Partner; 13. Internal Seminar (stored `Seminar-Internal`); 14. Trade Show; 15. Web Download; 16. Web Research; 17. Chat.
- **Lead Status** (9): 1. -None-; 2. Attempted to Contact; 3. Contact in Future; 4. Contacted; 5. Junk Lead; 6. Lost Lead; 7. Not Contacted; 8. Pre-Qualified; 9. Not Qualified. Lead Status has record categories enabled; each option carries a `record_category_value`: Attempted to Contact, Contact in Future, Contacted, Lost Lead, Not Contacted, Pre-Qualified = Open; Junk Lead = Junk; Not Qualified = Not Qualified; `-None-` has none. The converted-lead flag is separate (`Converted__s`).
- **Industry** (19): 1. -None-; 2. ASP (Application Service Provider); 3. Data/Telecom OEM; 4. ERP (Enterprise Resource Planning); 5. Government/Military; 6. Large Enterprise; 7. ManagementISV; 8. MSP (Management Service Provider); 9. Network Equipment Enterprise (stored `Network Equipment (Enterprise)`); 10. Non-management ISV; 11. Optical Networking; 12. Service Provider; 13. Small/Medium Enterprise; 14. Storage Equipment; 15. Storage Service Provider; 16. Systems Integrator; 17. Wireless Industry; 18. ERP; 19. Management ISV.
- **Rating** (6): 1. -None-; 2. Acquired; 3. Active; 4. Market Failed; 5. Project Cancelled; 6. Shut Down (stored `ShutDown`).
- **Salutation** (6): 1. -None-; 2. Mr.; 3. Mrs.; 4. Ms.; 5. Dr.; 6. Prof..
- **Unsubscribed Mode** (4, read-only, lexical order): Consent form; Manual; Unsubscribe link; and a label naming the vendor's email-campaign product (exact value in `fields.json`; not reproduced here).
- **Enrich Status** (3, read-only, not in layout): Available; Enriched; Data not found.
- **Country** (248 options) and **State** (3954 options) are not defined on the field: they come from the global picklist sets `Country__s` and `States__s` (the stock "Countries and States List" set, shared by other modules). Do not list them in this spec; the full lists are in `~/Desktop/mepcity-research/metadata/modules/Leads/fields.json` (`pick_list_values` of `Country` and `State`).

A Lead Status blueprint ("Lead nurturing process", inactive) exists on `Lead_Status`; blueprints belong to the Automation research task. Dependent picklists (map dependency) are not configured on Leads.

### Field permissions by profile

Two profiles exist on the module: Administrator and Standard. The permission set is identical for both (`profiles[].permission_type` in `fields.json`):
- **Read and Write** — 43 fields (all user-editable fields plus the system fields Created By, Modified By, Created Time, Modified Time, Full Name, Tag, Last Activity Time, Converted Date Time, Lead Conversion Time; the form flags, not the permission, keep those out of create/edit).
- **Read Only** — 12 fields: Unsubscribed Mode, Unsubscribed Time, Converted Account, Converted Contact, Converted Deal, Record Id, Change Log Time, Is Converted, Locked, Last Enriched Time, Enrich Status, Distance.
- **Hidden (Don't Show)** — 1 field: Lead Status Modified Time.

Each field also exposes `allowed_permissions_to_update` (which of the three settings an admin may choose) in the permissions call; the Field Permissions screen lets the admin change them per field and profile.

### Lead conversion field mapping

`convertable` is true for Leads. `layouts.json` carries the layout-level mapping targets and each field in `fields.json` carries a `convert_mapping` object with its target field per destination module. **28 of the 56 fields are mapped** (at least one destination); the rest are not carried over by the mapping.

Target layouts at conversion: Contacts `Standard`, Accounts `Standard`, Deals `Standard`.

Deals fields requested at conversion (layout-level, not copied from a lead field): Amount (optional), Deal Name (required), Closing Date (optional), Stage (required).

| Leads field | API name | Contacts field | Accounts field | Deals field |
|---|---|---|---|---|
| Address - Latitude | `Latitude` | `Mailing_Latitude` | `Billing_Latitude` | - |
| Address - Longitude | `Longitude` | `Mailing_Longitude` | `Billing_Longitude` | - |
| Company | `Company` | - | `Account_Name` | - |
| First Name | `First_Name` | `First_Name` | - | - |
| Last Name | `Last_Name` | `Last_Name` | - | - |
| Title | `Designation` | `Title` | - | - |
| Email | `Email` | `Email` | - | - |
| Phone | `Phone` | `Phone` | `Phone` | - |
| Fax | `Fax` | `Fax` | `Fax` | - |
| Mobile | `Mobile` | `Mobile` | - | - |
| Website | `Website` | - | `Website` | - |
| Lead Source | `Lead_Source` | `Lead_Source` | - | `Lead_Source` |
| Industry | `Industry` | - | `Industry` | - |
| No. of Employees | `No_of_Employees` | - | `Employees` | - |
| Annual Revenue | `Annual_Revenue` | - | `Annual_Revenue` | - |
| Rating | `Rating` | - | `Rating` | - |
| Description | `Description` | `Description` | `Description` | `Description` |
| Skype ID | `Skype_ID` | `Skype_ID` | - | - |
| Secondary Email | `Secondary_Email` | `Secondary_Email` | - | - |
| Twitter | `Twitter` | `Twitter` | - | - |
| Address | `Address` | `Mailing_Address` | `Billing_Address` | - |
| Address - Country / Region | `Country` | `Mailing_Country` | `Billing_Country` | - |
| Address - Flat / House No./ Building / Apartment Name | `Flat_House_No_Building_Apartment_Name` | `Mailing_Flat_House_No_Building_Apartment_Name` | `Billing_Flat_House_No_Building_Apartment_Name` | - |
| Address - Street Address | `Street` | `Mailing_Street` | `Billing_Street` | - |
| Address - City | `City` | `Mailing_City` | `Billing_City` | - |
| Address - State / Province | `State` | `Mailing_State` | `Billing_State` | - |
| Address - Zip / Postal Code | `Zip_Code` | `Mailing_Zip` | `Billing_Code` | - |
| Address - Coordinates | `Coordinates` | `Mailing_Coordinates` | `Billing_Coordinates` | - |

Not mapped (no destination in any module): Lead Owner, Lead Status, Created By, Modified By, Created Time, Modified Time, Full Name, Email Opt Out, Salutation, Last Activity Time, Tag, Lead Image, Converted Date Time, Lead Conversion Time, Unsubscribed Mode, Unsubscribed Time, Converted Account, Converted Contact, Converted Deal, Record Id, Change Log Time, Is Converted, Locked, Last Enriched Time, Enrich Status, Distance, Connected To, Lead Status Modified Time.

Notable shape: the company name goes only to the Accounts record (`Account_Name`); First Name, Last Name, Title, Email, Mobile, Skype ID, Secondary Email and Twitter go only to Contacts; Phone and Fax go to Contacts and Accounts; Website, Industry, No. of Employees, Annual Revenue and Rating go only to Accounts; Description goes to all three; Lead Source goes to Contacts and Deals; and the address block (including coordinates) to Contacts as the mailing address and to Accounts as the billing address. Whether the owner is carried over and how a lead's status/converted flags are written after conversion is not part of this mapping (see Open questions).

## Actions

Setup side (no action was executed; only navigation):
- Layouts: create new layout, open a layout in the editor, rename, clone, set layout permissions (per `actions_allowed`); status switch.
- Fields: "Create and Edit Fields" opens the layout editor; Field Permissions: choose profile, set one of three radios per field, Save / Cancel.
- Layout Rules / Validation Rules / Map Dependency / Record Locking: create flows (empty).
- Layout editor (Create canvas): page title "Create Lead", Cancel / Save and New / Save buttons, a "Manage Edit Page Buttons" link, a field palette (29 field types, a "new section" block, Mirror and Button components, an "Unused Items" group; "Custom Fields Left: 299"), sections with a section gear, field cards with a "..." menu and drag handle, tabs Create / Quick Create / Detail View.

Lead record side (what the layout implies for the form the rebuild needs): create (Save, Save and New, Cancel), quick create (5 fields), edit, detail view with related lists, and convert (target mapping above). Per-record actions and list-page actions belong to the Leads list and detail research tasks.

## Filters / views / sorting / search

- Field Listing: free-text search over field label or data type; fixed alphabetical order by label.
- Field Permissions: profile selector.
- Fields marked in `fields.json` as searchable, filterable and sortable drive the list-view search, filter and sort options; the per-field flags are in the metadata and not duplicated here. Leads list views (system and shared custom views) belong to the Leads list research task.

## Flows

Flow A — Browse Leads configuration (what we captured, read-only)
1. Open Setup > Customization > Modules and Fields, click Leads. The Layouts tab opens.
2. Switch tabs. Tabs without configuration show an explicit "No ... Configured" state (Layout Rules, Validation Rules, Map Dependency) or a call-to-action card (Record Locking).
3. Fields tab > Field Listing / Field Permissions; Summary for counts.

Flow B — Open the layout editor
1. From Layouts click `Standard` (or Fields > Create and Edit Fields).
2. Editor loads the layout with inner details and opens on the Create tab; a first-visit product-tour overlay covered the page in our capture. Save buttons are disabled until a change is made.

Flow C — Change a field or its permission (not executed; described from palette, metadata and flags only)
1. Drag a field type into a section column or move an unused field in; open its properties to set label, requirement, length and picklist options; Save applies to all profiles assigned to the layout.
2. Field Permissions: pick a profile and set Read and Write / Read Only / Don't Show; Save.
These flows are recorded for the customization module; they are not part of Leads parity. Validation messages and the properties dialog were not captured.

Flow D — Convert a lead (data side only)
1. (Inferred from the metadata, not observed.) The user converts a lead; the mapping above decides which Contacts, Accounts and Deals fields are pre-filled; Deal Name and Stage are required when a deal is created; Amount and Closing Date are optional.
2. (Inferred from field names.) The lead is flagged converted (`Converted__s`), `Converted_Date_Time` is set and `Converted_Account`, `Converted_Contact`, `Converted_Deal` point at the created records. The conversion dialog itself belongs to the lead detail/conversion research task.

Empty/error states seen: empty lists for Layout Rules, Validation Rules, Map Dependency; Links and Buttons rendered blank in the captures because the tool blocked the `get_assigned` POST (see Data needs).

## Data needs

Requests the Leads setup pages make (method, path shape, key parameters, response field names; values omitted). All GET unless stated; generic shell calls (notifications, chat, constants, feature flags, user preferences) are omitted.

- Layouts tab: `/crm/v3/settings/layouts?module=Leads&include_inner_details&include=total_profiles&fields=...` -> `layouts[]{id, name, display_label, status, generated_type, visible, profiles[]{id, name, default, _default_view, _default_assignment_view}, actions_allowed{edit, rename, clone, downgrade, delete, deactivate, set_layout_permissions}, show_business_card, convert_mapping, has_more_profiles, created_time, modified_time}`; `/crm/v2.2/settings/layouts?module=Leads&fields=id,status`; `/crm/v9/settings/wizards?module=Leads` -> `info{wizard_count, limits}` (wizards are a separate feature).
- Layout editor: `/crm/v8/settings/layouts/<layoutId>?module=Leads&mode=all&include_inner_details` -> one layout with `sections[]{id, api_name, display_label, name, sequence_number, column_count, tab_traversal, isSubformSection, generated_type, type, fields[]{full field object + required, section_id, sequence_number, subform_properties, validation_rule}}` and `convert_mapping` (layout-level: per destination `{display_label, name, id}` plus the Deals `fields[]{api_name, field_label, id, required}`); `/crm/v2.2/settings/layouts?module=Leads&include_element_types&include_inner_details&include=total_profiles&fields=...`; `/crm/v3/settings/related_lists?module=Leads` -> `related_lists[]{api_name, name, display_label, type, visible, visibility, sequence_number, module, personality_name, record_operations{edit, create, bulk_edit, delete, disassociate, assign}, customize_sort, customize_fields, customize_display_label}`; `/crm/v10/settings/layouts/<layoutId>/map_dependency?module=Leads` (204 empty); `/crm/v9/settings/global_map_dependency` -> `global_map_dependency[]{restrict_external_values, parent_global_picklist, child_global_picklist}`; `/crm/v4/settings/custom_buttons/actions/count?module=Leads`; `/crm/v9/settings/custom_buttons?module=Leads` (204).
- Fields tab: `/crm/v2.2/settings/fields?module=Leads&include=allowed_permissions_to_update&include_external_fields` and `...?module=Leads&type=all` -> `fields[]` with: `api_name, field_label, display_label, data_type, json_type, ui_type, length, decimal_place, system_mandatory, read_only, field_read_only, unique, custom_field, created_source, visible, tooltip, default_value, mass_update, sortable, filterable, searchable, businesscard_supported, quick_sequence_number, view_type{view, create, edit, quick_create}, profiles[]{id, name, permission_type}, allowed_permissions_to_update{read_write, read_only, hidden}, pick_list_values[]{display_value, actual_value, reference_value, sequence_number, colour_code, record_category_value, type}, global_picklist, enable_record_category, lookup, multi_module_lookup, formula, auto_number, currency, rollup_summary, subform, history_tracking, convert_mapping{Contacts, Accounts, Deals}`.
- Rules and guard rails: `/crm/v9/settings/layout_rules?module=Leads`; `/crm/v2.2/settings/validation_rules?module=Leads` (204) with `/crm/v2.1/settings/validation_rules/actions/rule_dependencyData?module=Leads`; `/crm/v9/settings/record_locking_configurations?module=Leads&feature_type=...` (204).
- Shared: `/crm/v9/settings/profiles?type=private_profile` and `?include_types=...` -> `profiles[]{id, name, display_label, api_name, description, custom, type}`; `/crm/v4/settings/modules/actions/supported_actions`; `/crm/v2.2/settings/modules?feature_name=...`.
- Blocked by the capture tool on the Links and Buttons tabs: `POST /crm/v9/settings/profiles/actions/get_assigned` (the tabs rendered blank; "not in use" comes from the Summary counts).
- Write calls implied by the screens (layout, field, permission, rule updates) were never executed.

Data needed to render a Leads create/edit/detail form: the field dictionary above (type, length, required, picklist options, form flags), the layout (sections, columns, order), and the profile permission per field. Data needed for conversion: per-field `convert_mapping`, the target layouts and the Deals conversion fields.

## Capture refs

All read-only; `blockedRequests` and `skippedClicks` are empty unless noted.
- `setup-leads-layouts` — Layouts tab.
- `setup-leads-layout-editor` — Standard layout editor, Create tab (tour overlay present).
- `setup-leads-fields` — Field Listing.
- `setup-leads-field-permissions` — Field Permissions (Administrator).
- `setup-leads-layout-rules`, `setup-leads-validation-rules`, `setup-leads-locking`, `setup-leads-map-dependency` — empty states.
- `setup-leads-links`, `setup-leads-buttons` — blockedRequests: `POST /crm/v9/settings/profiles/actions/get_assigned`; tabs rendered blank.
- `setup-leads-summary` — Summary tab.
- Failed: `setup-leads-layout-quickcreate` (Quick Create tab click intercepted by the onboarding overlay; the capture folder is empty). `setup-leads-module-row-menu` (attempt to open the Leads row "..." menu on the module list to look for a conversion-mapping entry; the tool skipped the click, so the capture only shows the module list and nothing from it is used).

Metadata: `~/Desktop/mepcity-research/metadata/modules/Leads/fields.json`, `layouts.json`, `related_lists.json`, `modules.json`, `profiles.json`, `blueprints.json`.

## Open questions

1. **Resolved: rendered column placement.** The real create and edit forms retain the two-column Lead Information rows described above; the detail has Lead Owner through Modified By in the left column and Company through Twitter in the right. Address sub-fields form one vertical column on create/edit, while the detail shows one composite Address row. See `research/specs/record-detail.md` Layout and Fields. Metadata does not encode this rendered placement.
2. **Partly resolved: detail and business card; quick create remains unverified.** The real detail order and five business-card fields are documented in `research/specs/record-detail.md`. Quick-create metadata order is Company, First Name, Last Name, Email, Phone; the actual quick-create form was not reachable through a named control. The onboarding overlay still prevented the editor-tab capture, and it was not dismissed.
3. **Resolved: Created By / Modified By in the real form.** They do not appear in the captured create or edit form; both appear as system rows in the detail. See `research/specs/record-detail.md`. The layout editor canvas is not a literal rendering of the real create form.
4. **Lead conversion mapping page was not captured.** The mapping page's address is not in any existing capture. As instructed, one attempt was made to find it through the Leads row "..." menu on the module list (`setup-leads-module-row-menu`); the capture tool skipped the click, so no further attempt was made and no address was guessed. The mapping above is complete as to what metadata stores. Unknown: whether the owner and status are carried over by conversion, what the conversion dialog does when a destination field is required but unmapped (Deals requires Deal Name and Stage, and neither is mapped from a lead field), and whether admins can edit the mapping in the UI (the customization module question).
5. **Field counts differ between sources.** Field Listing 29 rows, Field Permissions 26 rows, Summary "System Fields 33", metadata 56 fields. The listing evidently hides address sub-fields, time stamps, Salutation and other system-managed fields; the exact filter is unknown. The earlier draft reported 28 listing rows; the capture contains 29.
6. **"Custom" field count.** Summary says "Custom Fields 1 out of 300" and the editor counter says 299 left, but the only `custom_field=true` field (`Lead_Status_Modified_Time`) has `created_source=default`, is hidden in both profiles and is not in the layout. It is system-generated; no user has created a custom field on Leads.
7. **Properties dialog not captured.** Which of the observed field attributes (label, requirement, uniqueness, length, picklist options, tooltip, default, quick-create flag) an admin can edit per type is inferred from metadata only; relevant to the customization module, not to Leads parity.
8. **Links and Buttons tabs** could not render because the tool blocks the `get_assigned` POST; Summary shows 0 buttons and 0 links.
9. **What changed in the module** (last modified August 2026) cannot be told from metadata: all fields are `created_source=default`, there is one layout and no custom field. Candidates are picklist or layout-visibility edits; it could be compared against stock defaults later.
10. **Workflow rules cannot be exported** (API not supported); automation counts come from the Summary tab only (Leads: all 0).
