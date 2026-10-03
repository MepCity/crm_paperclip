# Leads list views

Status: draft for CTO review (MEP-17). This describes only the Leads list in the live reference CRM. It is the reusable list pattern for later modules; their specs should cite this file and state only differences. The field model and shell are specified in `research/specs/leads-fields-and-layout.md` (MEP-16) and `research/specs/app-shell.md` (MEP-24). Those approved drafts were read from their issue branches and are not copied here. Routes use `<org>` and `<viewId>` placeholders.

## Purpose

Browse Leads in a saved view, inspect the available filters and list controls, and reach a Lead record. The captured account has 14 configured views in Leads metadata: 11 system-defined public views and three user-created views. The default view's stored `name` is **All Open Leads**, while its `display_value`, and therefore its list-tab label, is **All Leads**. All three custom views are configured and remain in the view inventory.

## Layout

The persistent shell is described in `research/specs/app-shell.md`. Within Leads, a view tab occupies the top of the content area. A toolbar below it has Filter, Sort, several view-type icons, refresh, Create Lead, an adjacent unlabeled dropdown, More, and Actions. The left **Advanced Filters** panel is open in the captured default view. It has a search box and three expandable groups: System Defined Filters, Filter By Fields, and Filter By Related Modules. The right side holds the records table with a View Settings control at its top edge. The table footer shows Total Records and a range with Previous/Next buttons.

The populated capture displays six data columns: Lead Name, Company, Email, Phone, Lead Source, Lead Owner. Before them are an unlabeled selection checkbox column and non-data badge/action columns. The default view has ten visible rows and disabled Previous/Next controls at its single page. A second system view has a different, shorter column set (Lead Name, Company, Phone, Email), an explicit “No Leads found” empty state, and Total Records 0. These are view-specific columns, not a fixed global schema. The initial `/tab/Leads/list` capture showed the shell before the list populated; it is evidence of a blank loading interval, not a confirmed final error or empty state.

View Settings opens Manage Columns, Reset Column Size, Records Per Page, and View Mode. Manage Columns opens a dialog with search, checked visible columns, further available columns, Cancel and Save. It also includes Activity Badge and Note Badge as selected presentation columns. The page-size submenu offers 10, 20, 30, 40, 50, and 100; 30 is shown as the current setting. No setting was changed. Column drag/reorder, resize, maximum selected columns, and save validation were not tested.

Editing the system default opens a full-page view form with a disabled view-name box, available/selected column lists, a Lock this View switch, Cancel, and Save. The three user-created view forms add enabled view names, a criteria section, a related-modules-criteria switch that is off, and sharing radios (Only me, Everyone, Selected users); Everyone is selected in all three. Their criteria section shows one numbered row with module, field, comparator, record category and value controls, followed by an add-row icon. An AND connector precedes the related-modules section. The selected columns in each are Last Name, First Name, Company, and Email. No form control was changed or saved. The new-view entry point and its validation remain unobserved.

## Fields

These are the six visible data columns in the populated capture. API names, types, and flags come from the Leads `fields.json` metadata; the required Company constraint is from the Standard layout in the approved field spec. No displayed field is unique. The row request contains `Full_Name`, `First_Name`, and `Last_Name`, confirming that the **Lead Name** list label is backed by `Full_Name`; the metadata label remains **Full Name**.

| List label | API name | Data type | Required / unique / read-only | Sortable / filterable | Notes |
| --- | --- | --- | --- | --- | --- |
| Lead Name | `Full_Name` | `text` | no / no / no | yes / yes | Metadata label is Full Name; row links open Lead detail. The list request includes this field and both name components. |
| Company | `Company` | `text` | layout-required / no / no | yes / yes | Visible in default and empty-view column sets. |
| Email | `Email` | `email` | no / no / no | yes / yes | Rendered as a mail link when populated. |
| Phone | `Phone` | `phone` | no / no / no | yes / yes | Visible text in list. |
| Lead Source | `Lead_Source` | `picklist` | no / no / no | yes / yes | Visible in the populated default view. |
| Lead Owner | `Owner` | `ownerlookup` | no / no / field-managed | yes / yes | `field_read_only=true` in metadata, although `read_only=false`; ownership behavior belongs to the field spec. |

For the complete Leads field dictionary and constraints, see `research/specs/leads-fields-and-layout.md` and the external research metadata `metadata/modules/Leads/fields.json`. The list column chooser also offers many fields that are not selected in the captured view; its choices must be driven by the view/field configuration rather than copied into this table.

## Actions

| Control | Observed options or effect | Boundary |
| --- | --- | --- |
| View tab options | Edit, Pin, Clone, Close View, Delete View | Only Edit was followed, to inspect the form. Pin/favorite persistence and permission rules are unverified. |
| Filter | Toggles the Advanced Filters panel | Filter selection was blocked by the capture tool; no filter was applied. |
| Sort | Opens Sort By field, Ascending/Descending order control, Cancel and Apply | No sort was applied. Available sort fields and default order were not captured. |
| View Settings | Manage Columns, Reset Column Size, Records Per Page, View Mode Wrap Text | Column dialog and page-size submenu opened; no changes saved. |
| Create Lead | Named primary button | Creation flow belongs to the Leads form spec. Adjacent dropdown has no reliable accessible name; its choices were not opened. |
| More | Import Leads, Import Notes, Facebook Ads Sync, LinkedIn Ads Sync, Tiktok Ads Sync | Menu only. Import and sync execution are outside this task. |
| Actions | Mass Transfer, Mass Delete, Mass Update, Mass Convert, Manage Tags, Assignment Rules, Drafts, Mass Email, Approve Leads, Deduplicate Leads, Add to Campaigns, Create Client Script, Export Leads, spreadsheet view, Print View | Menu only. No bulk, export, send, approval, or other action was run. |
| Row selection | Checkbox in each row and one in table header | No selection was made. Resulting selection toolbar and row quick actions are unverified. |
| Row link | Lead Name opens the record detail route | Record detail is covered by its own spec. |
| Pagination | Previous and Next controls, current range and total count | One populated page only; both buttons disabled. |

The view-type toolbar shows six icon controls (an active bulleted-list icon, then vertically split, grid, pie/chart, connected-block, and stacked-row icons), followed by an overflow chevron. This is a **visual inference** from `list-default`, not confirmation of the type behind each icon. `ViewPreference.do` exposes `table_view`, `kanban_view`, `map_view`, `timeline_view`, `canvas_view`, `card_view`, `split_view`, `chart_view`, and `sheet_view` keys, while the Leads preference response has `default_view_type` and `last_accessed_views[].type`. These keys show possible presentation types, not their availability or use here. The populated list is the only observed type; other types are **not confirmed in use** and remain outside the Module 1 parity target.

The following visible controls had no accessible name in `list-default`; they were not clicked under the named-control rule. Counts follow the accessibility tree, which contains 11 unnamed buttons and two unnamed comboboxes outside the record table.

| Control group | Why not inspected | Evidence |
| --- | --- | --- |
| Product selector combobox and top-bar shortcut/navigation buttons | No accessible names on the controls; shell behavior is handled in the shell spec. | `list-default` |
| Create Lead adjacent dropdown | No accessible name; Create/Import options beyond the named More menu remain unknown. | `list-default` |
| View-type icon buttons and overflow combobox | No accessible names; icon meaning is only a visual inference. | `list-default` |
| Table-adjacent and utility-strip unnamed buttons | No accessible names; column-heading menu and row quick actions cannot be attributed safely. | `list-default` |

## Filters / views / sorting / search

**Views.** The following inventory is from `custom_views.json`. The UI tab uses `display_value`; `name` is shown only where it differs. `system_name` is a system key, not a record value.

| Display value | Different stored name | System name | System defined | Category | Default |
| --- | --- | --- | --- | --- | --- |
| All Leads | All Open Leads | `ALLVIEWS` | yes | `public_views` | yes |
| All Locked Leads | — | `ALLLOCKEDLEADS` | yes | `public_views` | no |
| Converted Leads | — | `CONVERTEDVIEWS` | yes | `public_views` | no |
| Junk Leads | — | — | no | `created_by_me` | no |
| Mailing Labels | — | `ALLVIEWS` | yes | `public_views` | no |
| My Converted Leads | — | `MYCONVERTEDVIEWS` | yes | `public_views` | no |
| My Leads | — | `MYVIEWS` | yes | `public_views` | no |
| Not Qualified Leads | — | — | no | `created_by_me` | no |
| Open Leads | — | — | no | `created_by_me` | no |
| Recently Created Leads | — | `RECENTLYCREATED` | yes | `public_views` | no |
| Recently Modified Leads | — | `RECENTLYMODIFIED` | yes | `public_views` | no |
| Today's Leads | Todays Leads | `today` | yes | `public_views` | no |
| Unread Leads | — | `UNREADVIEWS` | yes | `public_views` | no |
| Unsubscribed Leads | — | `UNSUBSCRIBED` | yes | `public_views` | no |

The current view tab exposes Pin and view-management options. The inventory response has four grouping translation keys: `public_views`, `other_users_views`, `shared_with_me`, and `created_by_me`; only public and created-by-me categories occur in the 14 configured views. A full selector and new-view entry point were not reached through named controls. `favorite` is null for every metadata item, so configured favorites are **not in use in the captured metadata**; Pin was not exercised.

**Saved view criteria observed.** All three user-created views use one Lead Status (`Lead_Status`, picklist) row with the **is** comparator and the **Record Category** control. Their selected columns, in order, are `Last_Name`, `First_Name`, `Company`, `Email`; sharing is Everyone and related-module criteria are off. The values below are configured picklist options, not record data. System default edit has no visible criteria section and its name is disabled.

| View | Comparator | Picklist value | Selected columns |
| --- | --- | --- | --- |
| Junk Leads | is | Junk | `Last_Name`, `First_Name`, `Company`, `Email` |
| Not Qualified Leads | is | Not Qualified | `Last_Name`, `First_Name`, `Company`, `Email` |
| Open Leads | is | Open | `Last_Name`, `First_Name`, `Company`, `Email` |

**Left filters.** System Defined Filters lists Activities, Campaigns, Latest Email Status, Locked, Record Action, Related Records Action, Touched Records, Untouched Records, and Cadences. Filter By Fields lists record fields from the Leads metadata, including text, picklist, email/phone, currency, integer, datetime, lookup/owner lookup, boolean, address and other field types. Filter By Related Modules lists relationships, including activity and connected-record modules; their detailed behavior belongs to later module work. `fields.json` marks 48 of 56 Leads fields filterable. The UI calls `Full_Name` **Lead Name**, differing from its metadata label **Full Name**. The capture tool skipped the Company filter checkbox as an editable toggle, so no operator/value panel was opened. Exact operator lists for text, email/phone/website/textarea, picklist, date/datetime, integer/double/currency/bigint, lookup/owner lookup/multi-module lookup, boolean, address and image types are **not observable with the current capture tool**. No operator set is inferred from the data types. The only **observed in saved views** comparator is **is** for the Lead Status picklist. Filter AND/OR combination, validation, and zero-result behavior after applying filters also remain unobserved.

**Sorting.** Sort opens a small dialog with Sort By and direction selectors. No sort field options or applied order were captured. The table headers are visible, but their menus and sort effects were not exercised. The network list response exposes `sort_by` and `sort_order` keys in `info`. Leads metadata marks **47 of 56** fields sortable. The nine non-sortable API names are `Description`, `Tag`, `Record_Image`, `Change_Log_Time__s`, `Last_Enriched_Time__s`, `Enrich_Status__s`, `Address`, `Coordinates`, and `Connected_To__s`. This is the field eligibility source; the exact Sort By menu may be narrower.

**Search.** The shell-level Search records entry is global and described in `research/specs/app-shell.md`; it is not evidence of module-local search. The filter panel's Search box appears to search filter choices, but no term was entered. A module-local record search control, search scope, request shape, result presentation, and no-match state were not verified. No customer name was used as a query.

## Flows

1. **Open Leads list.** Navigate to `/crm/<org>/tab/Leads/list` or a configured `/custom-view/<viewId>/list` route. The shell renders first; then the view tab, filter panel, table and footer appear. If the view has no matching records, keep column headers and show the empty message and zero total, as seen in `list-converted`. An explicit loading indicator and an error state were not seen.
2. **Inspect a view.** The current tab shows its `display_value`. Opening its More Options menu reveals Edit, Pin, Clone, Close View and Delete View. Edit opens the view form. For user views, inspect the name, the one Lead Status/is/picklist row, AND connector, off related-module criteria switch, selected columns, sharing radios and Lock switch. For the system default, inspect the disabled name and column chooser. Leave without saving; no view was created, changed, pinned or deleted. The new-view form and validation remain unobserved.
3. **Inspect sort.** Open Sort; the field selector initially shows None and the order control shows Ascending. Apply is disabled until a field is chosen. Cancel is present. The validation and response after choosing a field remain unverified.
4. **Inspect columns.** Open View Settings then Manage Columns. The dialog shows checked current columns, unchecked available columns, search, Cancel and Save. Leave without changing any checkbox or saving. Invalid selection and save failure behavior remain unverified.
5. **Inspect page size.** Open View Settings then Records Per Page 30. The six choices appear. No choice was selected; the effect on pagination and preference persistence is unverified.
6. **Inspect filters.** The panel groups and checkboxes appear at load. A click on Company was skipped by the read-only capture tool; no filter-specific criteria, operator, value, AND/OR, or result state was reached. The saved-view form separately confirms one picklist **is** comparator. Implementers must resolve the left-filter operator contracts before building those controls.
7. **Inspect operation menus.** Open More or Actions to list entries, then leave them. No operation was executed. Selection-dependent availability, confirmations and error states remain unverified.

## Data needs

The following are sanitized request *shapes* observed in `network.json`, not prescriptions for our internal API. Only method, endpoint, parameter names and response field names are recorded. The list uses read-shaped POST requests; no record mutation was performed.

| Method | Endpoint path | Query/request field names | Response field names | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/crm/<org>/ViewPreference.do` | None observed | `modules[]`: `module_name`, `cvid`, `per_page`, `table_view`, `kanban_view`, `map_view`, `timeline_view`, `canvas_view`, `card_view`, `split_view`, `chart_view`, `sheet_view`, `viewid`, `filter_status`, `customized_view`, `cv_tab_status`, `filter_width` | View preference bootstrap; type keys do not establish use. |
| GET | `/crm/<org>/ModuleCache.do` | Query: `module`, `getField` | `id`, `fields` | Module field cache. |
| GET | `/crm/v9/settings/custom_views` | Query: `page`, `module`, `per_page`, `filters` | `custom_views[]`: `display_value`, `name`, `system_name`, `system_defined`, `category`, `default`, `favorite`, `pin`, `tab_order`, `last_accessed_time`, `access_type`, `locked`, `module`; `info`: `per_page`, `default`, `count`, `page`, `more_records`, `translation` (`public_views`, `other_users_views`, `shared_with_me`, `created_by_me`) | View inventory and selector grouping. |
| GET | `/crm/v9/settings/custom_views/<viewId>` | Query: `module`; edit form also requests `include_inner_details` | `custom_views[]`: `criteria` (`comparator`, `field.api_name`, `field.field_label` when included, `type`, `value`), `fields[]` (`api_name`, `_pin`), `sort_by`, `sort_order`, `shared_to`, `wrap_text`, `access_type`, `locked`, `default`, `pin` | Selected view configuration and edit form. |
| GET | `/crm/v9/settings/custom_views/<viewId>/filters` | Query: `module`, `cvid` | No body captured (204) | Selected view filters. |
| GET | `/crm/v4.0/settings/fields` | Query: `module` | `fields` | A `list-default` call using this path requested a different module; it is not evidence of a Leads-specific field fetch. |
| GET | `/crm/v2.2/settings/fields`, `/crm/v2/settings/fields` | Query: `module`, optionally `type` | `fields` | Field definitions used while the edit form loads. |
| GET | `/crm/v8/settings/custom_views` | Query: `module`, `page`, `per_page`, `favourite` | No response body captured | Additional edit-form view request. |
| GET | `/crm/v2.2/Leads/actions` | Query: `cvid` | `actions` | Available record/list actions. |
| POST | `/crm/v2.2/Leads/actions/count` | Query: `on_demand_properties`, `approved`, `cvid`, `home_converted_currency`, `formatted_currency`; multipart body present, constituent field names unavailable in the capture | `count` | Total matching records. |
| POST | `/crm/v2.2/Leads/bulk` | Query: `page`, `fields`, `approved`, `cvid`, `home_converted_currency`, `formatted_currency`, `per_page`, `on_demand_properties`; no request body captured. The `fields` list includes `Full_Name`, `First_Name`, `Last_Name`, `Owner`, `Tag`, `Locked__s` and record state/permission properties. | `data[]`: row field values, `id`, `Owner`, state/permission properties; `info`: `per_page`, `count`, `page`, `sort_by`, `sort_order`, `more_records` | Paged list rows and confirmed name-field mapping. |
| GET | `/crm/v9/settings/modules/Leads/actions/view_preference_configurations` | None observed | `modules[]`: `per_page`, `default_view_type`, `last_accessed_views[]` (`type`, `custom_view.id`), `filter_status`, `show_filter_count`, `activity_badge`, `notes_badge` | List presentation preference; configuration shape alone does not prove non-list usage. |

Opening a different view caused the capture tool to block `PUT` requests for pin state and view preference configuration. They did not complete. This is an observed application side effect of navigation; it was not initiated through a research action. `network.json` records request/response shapes and types, not response values, so it cannot establish a before/after preference change.

## Capture refs

`list-main` (shell before list hydration), `list-default` (populated default list), `list-view-selector` (current tab), `list-view-options` (view options), `list-sort` (sort dialog), `list-settings` (table settings), `list-columns` (column dialog), `list-actions` (bulk menu), `list-more` (import menu), `list-filter-text` (filter selection skipped), `list-converted` (empty system view), `list-page-size` (page-size submenu), `list-view-edit` (initial route did not hydrate before named clicks), `list-view-edit-default` (system default form), `list-view-edit-1`, `list-view-edit-2`, `list-view-edit-3` (three configured user view forms). Captures remain in the local research workspace. No raw capture or customer value is included here. The five additional captures were authorized in the CTO's review to inspect view forms; only four reached an edit form because the initial route had not hydrated.

## Open questions

1. What are the full view selector's rendered groups, favorite presentation, default-selection behavior, and new-view entry point? The inventory exposes four grouping keys, while the dropdown controls lack accessible names. The edit form establishes the saved-view field/criteria/column/sharing structure, but the new-view form and its validation were not observed. The forms show one criterion and an AND connector; OR and multi-row grouping behavior remain unobserved.
2. Which exact operators and value editors are offered for each Leads filterable type (text, email/phone/website/textarea, picklist, date/datetime, integer/double/currency/bigint, lookup/owner lookup/multi-module lookup, boolean, image/address)? This is **not observable with the current capture tool** because it skips the filter checkbox. The only saved-view comparator observed is picklist **is**.
3. Which toolbar icons correspond to specific presentation types, and which types are actually configured or used? The six icons have no accessible names. Only the active list type is confirmed.
4. Which field options appear under Sort By, what is the view's default sort, and do column headings open a menu or sort directly? Metadata gives sortable eligibility, but no field or header action was selected.
5. What does the adjacent unlabeled Create Lead dropdown offer? Does a module-local record search exist, and if so what fields, matching rule and result/empty states does it use? The global shell search is separate.
6. What row-hover quick actions, selection toolbar, page transitions, record-range behavior, and list error state appear? Only an unselected single page and an empty view were observed.
7. Do view settings and Pin persist at user or shared scope, and what permissions constrain menu entries? The capture tool blocked preference writes during view navigation, so persistence was not studied.
8. The list label **Lead Name** maps to metadata `Full_Name`, labeled **Full Name**. Is this label override specific to list views or shared with other presentation types? No other visible field-label mismatch was found.
