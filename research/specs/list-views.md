# Leads list views

Status: draft for CTO review (MEP-17). This describes only the Leads list in the live reference CRM. It is the reusable list pattern for later modules; their specs should cite this file and state only differences. The field model and shell are specified in `research/specs/leads-fields-and-layout.md` (MEP-16) and `research/specs/app-shell.md` (MEP-24). Those approved drafts were read from their issue branches and are not copied here. Routes use `<org>` and `<viewId>` placeholders.

## Purpose

Browse Leads in a saved view, inspect the available filters and list controls, and reach a Lead record. The captured account has 14 configured views in Leads metadata: 11 system-defined public views and three user-created views. The metadata marks **All Open Leads** as the default; the captured list tab is labeled **All Leads**. This mismatch remains open below. There is no evidence that the three custom views are unused, so they remain part of the configured view inventory.

## Layout

The persistent shell is described in `research/specs/app-shell.md`. Within Leads, a view tab occupies the top of the content area. A toolbar below it has Filter, Sort, several view-type icons, refresh, Create Lead, an adjacent unlabeled dropdown, More, and Actions. The left **Advanced Filters** panel is open in the captured default view. It has a search box and three expandable groups: System Defined Filters, Filter By Fields, and Filter By Related Modules. The right side holds the records table with a View Settings control at its top edge. The table footer shows Total Records and a range with Previous/Next buttons.

The populated capture displays six data columns: Lead Name, Company, Email, Phone, Lead Source, Lead Owner. Before them are an unlabeled selection checkbox column and non-data badge/action columns. The default view has ten visible rows and disabled Previous/Next controls at its single page. A second system view has a different, shorter column set (Lead Name, Company, Phone, Email), an explicit “No Leads found” empty state, and Total Records 0. These are view-specific columns, not a fixed global schema. The initial `/tab/Leads/list` capture showed the shell before the list populated; it is evidence of a blank loading interval, not a confirmed final error or empty state.

View Settings opens Manage Columns, Reset Column Size, Records Per Page, and View Mode. Manage Columns opens a dialog with search, checked visible columns, further available columns, Cancel and Save. It also includes Activity Badge and Note Badge as selected presentation columns. The page-size submenu offers 10, 20, 30, 40, 50, and 100; 30 is shown as the current setting. No setting was changed. Column drag/reorder, resize, maximum selected columns, and save validation were not tested.

## Fields

These are the six visible data columns in the populated capture. API names, types, and flags come from the Leads `fields.json` metadata; the required Company constraint is from the Standard layout in the approved field spec. No displayed field is unique. The UI label **Lead Name** maps provisionally to metadata `Full_Name` / **Full Name** and needs confirmation.

| List label | API name | Data type | Required / unique / read-only | Notes |
| --- | --- | --- | --- | --- |
| Lead Name | `Full_Name` (provisional) | `text` | no / no / no | Metadata label is Full Name; row links open Lead detail. Confirm list mapping. |
| Company | `Company` | `text` | layout-required / no / no | Visible in default and empty-view column sets. |
| Email | `Email` | `email` | no / no / no | Rendered as a mail link when populated. |
| Phone | `Phone` | `phone` | no / no / no | Visible text in list. |
| Lead Source | `Lead_Source` | `picklist` | no / no / no | Visible in the populated default view. |
| Lead Owner | `Owner` | `ownerlookup` | no / no / field-managed | `field_read_only=true` in metadata, although `read_only=false`; ownership behavior belongs to the field spec. |

For the complete Leads field dictionary and constraints, see `research/specs/leads-fields-and-layout.md` and the external research metadata `metadata/modules/Leads/fields.json`. The list column chooser also offers many fields that are not selected in the captured view; its choices must be driven by the view/field configuration rather than copied into this table.

## Actions

| Control | Observed options or effect | Boundary |
| --- | --- | --- |
| View tab options | Edit, Pin, Clone, Close View, Delete View | Menu opened only. Pin/favorite persistence and permission rules are unverified. |
| Filter | Toggles the Advanced Filters panel | Filter selection was blocked by the capture tool; no filter was applied. |
| Sort | Opens Sort By field, Ascending/Descending order control, Cancel and Apply | No sort was applied. Available sort fields and default order were not captured. |
| View Settings | Manage Columns, Reset Column Size, Records Per Page, View Mode Wrap Text | Column dialog and page-size submenu opened; no changes saved. |
| Create Lead | Named primary button | Creation flow belongs to the Leads form spec. Adjacent dropdown has no reliable accessible name; its choices were not opened. |
| More | Import Leads, Import Notes, Facebook Ads Sync, LinkedIn Ads Sync, Tiktok Ads Sync | Menu only. Import and sync execution are outside this task. |
| Actions | Mass Transfer, Mass Delete, Mass Update, Mass Convert, Manage Tags, Assignment Rules, Drafts, Mass Email, Approve Leads, Deduplicate Leads, Add to Campaigns, Create Client Script, Export Leads, spreadsheet view, Print View | Menu only. No bulk, export, send, approval, or other action was run. |
| Row selection | Checkbox in each row and one in table header | No selection was made. Resulting selection toolbar and row quick actions are unverified. |
| Row link | Lead Name opens the record detail route | Record detail is covered by its own spec. |
| Pagination | Previous and Next controls, current range and total count | One populated page only; both buttons disabled. |

The view-type toolbar shows multiple icons in addition to the active list layout. Those controls have no accessible names in the capture, so their exact type list and use in this organization are **unverified**. No non-list type was opened. Do not add another presentation type to the Module 1 parity checklist from icon appearance alone.

## Filters / views / sorting / search

**Views.** The configured system views in `custom_views.json` are All Open Leads (default), All Locked Leads, Converted Leads, Mailing Labels, My Converted Leads, My Leads, Recently Created Leads, Recently Modified Leads, Todays Leads, Unread Leads, and Unsubscribed Leads. Three further views have `system_defined=false` and category `created_by_me`; their names are omitted because they may be user-specific. System views have category `public_views`. The current view tab exposes Pin and view-management options. Grouping, a full view selector, favorites, sharing choices, and a new-view dialog were not inspectable because the relevant dropdown controls lacked accessible names. Metadata `favorite` is null for all 14 views, so no configured favorite can be confirmed; this feature is **not in use in the captured metadata**, subject to the separate Pin menu behavior.

**Left filters.** System Defined Filters lists Activities, Campaigns, Latest Email Status, Locked, Record Action, Related Records Action, Touched Records, Untouched Records, and Cadences. Filter By Fields lists record fields from the Leads metadata, including text, picklist, email/phone, currency, integer, datetime, lookup/owner lookup, boolean, address and other field types. Filter By Related Modules lists relationships, including activity and connected-record modules; their detailed behavior belongs to later module work. `fields.json` marks 48 of 56 Leads fields filterable. The UI's field list differs from the full metadata set and includes **Lead Name**, which does not match the metadata label **Full Name**. The capture tool skipped the Company filter checkbox as an editable toggle, so no operator/value panel was opened. Consequently the per-type operator lists (text, picklist, date/datetime, number/currency, lookup, boolean and other types), AND/OR combination, validation, and zero-result behavior after applying filters are **unknown**, not inferred from field types.

**Sorting.** Sort opens a small dialog with Sort By and direction selectors. No sort field options or applied order were captured. The table headers are visible, but their menus and sort effects were not exercised. The network list response exposes `sort_by` and `sort_order` keys in `info`.

**Search.** The shell-level Search records entry is global and described in `research/specs/app-shell.md`; it is not evidence of module-local search. The filter panel's Search box appears to search filter choices, but no term was entered. A module-local record search control, search scope, request shape, result presentation, and no-match state were not verified. No customer name was used as a query.

## Flows

1. **Open Leads list.** Navigate to `/crm/<org>/tab/Leads/list` or a configured `/custom-view/<viewId>/list` route. The shell renders first; then the view tab, filter panel, table and footer appear. If the view has no matching records, keep column headers and show the empty message and zero total, as seen in `list-converted`. An explicit loading indicator and an error state were not seen.
2. **Inspect a view.** The current tab shows the view label. Opening its More Options menu reveals Edit, Pin, Clone, Close View and Delete View. A full selector and new-view form were not reachable through a named control. No view was created, changed, pinned or deleted.
3. **Inspect sort.** Open Sort; the field selector initially shows None and the order control shows Ascending. Apply is disabled until a field is chosen. Cancel is present. The validation and response after choosing a field remain unverified.
4. **Inspect columns.** Open View Settings then Manage Columns. The dialog shows checked current columns, unchecked available columns, search, Cancel and Save. Leave without changing any checkbox or saving. Invalid selection and save failure behavior remain unverified.
5. **Inspect page size.** Open View Settings then Records Per Page 30. The six choices appear. No choice was selected; the effect on pagination and preference persistence is unverified.
6. **Inspect filters.** The panel groups and checkboxes appear at load. A click on Company was skipped by the read-only capture tool; no criteria, operator, value, AND/OR, or result state was reached. Implementers must resolve the operator contracts before building those controls.
7. **Inspect operation menus.** Open More or Actions to list entries, then leave them. No operation was executed. Selection-dependent availability, confirmations and error states remain unverified.

## Data needs

The following are sanitized request *shapes* observed in `network.json`, not prescriptions for our internal API. Only method, endpoint, parameter names and response field names are recorded. The list uses read-shaped POST requests; no record mutation was performed.

| Method | Endpoint path | Query/request field names | Response field names | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/crm/<org>/ViewPreference.do` | None observed | `modules` | View preference bootstrap. |
| GET | `/crm/<org>/ModuleCache.do` | Query: `module`, `getField` | `id`, `fields` | Module field cache. |
| GET | `/crm/v9/settings/custom_views` | Query: `page`, `module`, `per_page`, `filters` | `custom_views`, `info` (`per_page`, `default`, `count`, `page`, `more_records`, `translation`) | View inventory. |
| GET | `/crm/v9/settings/custom_views/<viewId>` | Query: `module` | `custom_views` | Selected view configuration. |
| GET | `/crm/v9/settings/custom_views/<viewId>/filters` | Query: `module`, `cvid` | No body captured (204) | Selected view filters. |
| GET | `/crm/v4.0/settings/fields` | Query: `module` | `fields` | Filter/column field definitions. |
| GET | `/crm/v2.2/Leads/actions` | Query: `cvid` | `actions` | Available record/list actions. |
| POST | `/crm/v2.2/Leads/actions/count` | Query: `on_demand_properties`, `approved`, `cvid`, `home_converted_currency`, `formatted_currency` | `count` | Total matching records. |
| POST | `/crm/v2.2/Leads/bulk` | Query: `page`, `fields`, `approved`, `cvid`, `home_converted_currency`, `formatted_currency`, `per_page`, `on_demand_properties` | `data`, `info` (`per_page`, `count`, `page`, `sort_by`, `sort_order`, `more_records`) | Paged list rows. |
| GET | `/crm/v9/settings/modules/Leads/actions/view_preference_configurations` | None observed | `modules` | List presentation preference. |

The second view's navigation caused the capture tool to block two `PUT` requests for pin state and view preference configuration. They did not complete. This is an observed side effect of opening the view and must not be reproduced by research actions.

## Capture refs

`list-main` (shell before list hydration), `list-default` (populated default list), `list-view-selector` (current tab), `list-view-options` (view options), `list-sort` (sort dialog), `list-settings` (table settings), `list-columns` (column dialog), `list-actions` (bulk menu), `list-more` (import menu), `list-filter-text` (filter selection skipped), `list-converted` (empty system view), `list-page-size` (page-size submenu). Captures remain in the local research workspace. No raw capture or customer value is included here.

## Open questions

1. Why does metadata mark **All Open Leads** as default while the captured tab says **All Leads**? Is this an alias, a user view preference, or a separate view? Confirm the selected view identity without changing preferences.
2. What are the full view selector's groups, favorite presentation, default-selection rule, and new-view dialog fields? In particular, confirm criteria field/operator/value rows, AND/OR grouping, column selection, sharing and validation. The dropdown control had no reliable accessible name.
3. Which exact operators and value editors are offered for each Leads filterable type (text, email/phone/website/textarea, picklist, date/datetime, integer/double/currency/bigint, lookup/owner lookup/multi-module lookup, boolean, image/address)? The capture tool skipped the editable checkbox before these controls appeared.
4. Which toolbar icons correspond to list, kanban, canvas or other view types, and which are configured or actually used here? The icons had no accessible names. The active list type is the only confirmed one.
5. Which field options appear under Sort By, what is the view's default sort, and do column headings open a menu or sort directly? No field or header action was selected.
6. What does the adjacent unlabeled Create Lead dropdown offer? Does a module-local record search exist, and if so what fields, matching rule and result/empty states does it use? The global shell search is separate.
7. What row-hover quick actions, selection toolbar, page transitions, record-range behavior, and list error state appear? Only an unselected single page and an empty view were observed.
8. Is the list label **Lead Name** backed by `Full_Name`? The metadata label is **Full Name**; confirm field mapping and whether any other list-field labels differ from metadata.
9. Do view settings and Pin persist at user or shared scope, and what permissions constrain menu entries? The capture tool blocked preference writes on the second view, so persistence was not studied.
