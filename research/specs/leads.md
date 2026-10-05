# Leads — Module 1 entry and scope

Status: read-only Module 1 research complete. The conversion page's opening and expanded Deal states are documented in `research/specs/lead-conversion.md`; its remaining states do not block Module 1. This document links the approved Leads research rather than restating those screens. Capture names refer only to local research captures; no record values are retained here.

## Purpose

Leads is Module 1. Users reach a saved Leads list, open a Lead, work with its fields and related information, and can initiate conversion to a Contact and Account with an optional Deal. The first four specs define the shared shell, field model, list, and record page: `research/specs/app-shell.md`, `research/specs/leads-fields-and-layout.md`, `research/specs/list-views.md`, and `research/specs/record-detail.md`. This entry identifies Leads-specific actions, observed use, and cross-module dependencies; the conversion page is in `research/specs/lead-conversion.md`. It does not specify the Contacts, Accounts, or Deals screens.

## Layout

The Leads list and record geometry is specified in `research/specs/list-views.md` and `research/specs/record-detail.md`. The list has a Leads toolbar with **Create Lead**, **More**, and **Actions**. The detail header places **Convert** between **Send Email** and **Edit**, with **More Options** after Edit. The header's identity and related rail follow the record-detail spec. The conversion page's observed regions, opening controls, and expanded Deal subform are in `research/specs/lead-conversion.md`.

### Visual layout

All values in this subsection are **measured from screenshot** in CSS pixels using pixel samples of `leads-detail`, `detail-more`, and `list-actions`; the screenshot scale is two image pixels per CSS pixel. The shared record and list measurements are in the linked specs.

| Element | Measured bounds and appearance | State / evidence |
| --- | --- | --- |
| Detail Convert trigger | Interactive box x 1185–1266, y 70–102 (81 × 32); 1 px `#D5D8E9` edge on all four sides (left edge x 1184.5–1185.5, right edge x 1265–1266, top edge y 70–71, bottom edge y 101–102), approximately 6 px corners; interior vertical gradient from `#FDFDFE` (y 74–76) through `#F8F7FB` (y 86–88) to `#F1F0F7` (y 100–101), the same secondary header button described in `research/specs/record-detail.md`; label ink `#313949` runs from text start x 1199.5 to text end x 1251.5 and y 81–91, centered with about 14 px side padding. | Enabled in the observed record header; `leads-detail`. Its hover, focus, and disabled variants were not captured. |
| Detail More Options menu | White `#FFFFFF` panel over the page surface `#EEF1F9`; a visible highlighted option uses `#F0F4FC` and text pixels include `#313949`. | Open menu; `detail-more`. Panel geometry and menu item rhythm are already specified in `research/specs/record-detail.md`. |
| List Actions menu | White `#FFFFFF` panel with a 1 px `#CED0E1` border, outer bounds x 1251–1450, y 131.5–645.5 (199 × 514); 6 px padding above the first row; 32 px row pitch; highlighted first row fill `#F0F4FC` at x 1258–1443, y 138.5–170.5 (185 × 32, 6 px inside the border); row text `#313949` starts at x 1278.5; one 1 px group divider `#EDF0F4` at x 1262–1439, y 563.5–564.5, between the thirteenth and fourteenth rows. | Open menu; `list-actions`. List toolbar placement is in `research/specs/list-views.md`. |
| Conversion page | Its opening and expanded Deal state dimensions, surfaces, spacing, typography, and controls are measured in `research/specs/lead-conversion.md`. | Dedicated route observed; owner picker state remains open. |

The measured palette above is local to the sampled components. The conversion page's styling is measured separately in `research/specs/lead-conversion.md`. Recreate icons for their functions; do not reuse reference assets.

## Fields

The table includes fields directly relevant to the conversion entry and the mapping metadata, not the complete Leads field dictionary. Lead API names and types come from `metadata/modules/Leads/fields.json`; the optional Deal target fields come from `metadata/modules/Deals/fields.json` and the Lead layout's `convert_mapping`. For complete Lead flags, limits, picklists, and mappings, use `research/specs/leads-fields-and-layout.md`. The conversion page's observed fields and metadata-only targets are distinguished in `research/specs/lead-conversion.md`.

| Label | API name | Data type | Required / unique / read-only | Notes |
| --- | --- | --- | --- | --- |
| Lead Owner | `Owner` | `ownerlookup` | Optional / no unique constraint / metadata field is editable | Present on the Lead; conversion page owner control and remaining questions are in `research/specs/lead-conversion.md`. |
| Company | `Company` | `text` | Required in Standard Lead layout / no unique constraint / editable | Source for the visible new Account chip; see `research/specs/lead-conversion.md`. |
| First Name | `First_Name` | `text` | Optional / no unique constraint / editable | Contact mapping details are in the field/layout spec; see `research/specs/lead-conversion.md` for the displayed identity. |
| Last Name | `Last_Name` | `text` | System required / no unique constraint / editable | Contact mapping details are in the field/layout spec; see `research/specs/lead-conversion.md` for the displayed identity. |
| Converted Account | `Converted_Account` | `lookup` | Optional / no unique constraint / read-only | Conversion bookkeeping field; hidden from Lead forms by all four view flags. |
| Converted Contact | `Converted_Contact` | `lookup` | Optional / no unique constraint / read-only | Conversion bookkeeping field; hidden from Lead forms by all four view flags. |
| Converted Deal | `Converted_Deal` | `lookup` | Optional / no unique constraint / read-only | Conversion bookkeeping field; hidden from Lead forms by all four view flags. |
| Potential Name (mapping label) | `Deal_Name` | `text` | Required in target mapping and Deal metadata / no unique constraint / editable | `convert_mapping.Deals.fields` uses this label; Deal metadata and observed screen use **Deal Name**. Checked-state control documented in `research/specs/lead-conversion.md`. |
| Amount | `Amount` | `currency` | Optional / no unique constraint / editable | Deal mapping target; checked-state control documented in `research/specs/lead-conversion.md`. |
| Closing Date | `Closing_Date` | `date` | Optional / no unique constraint / editable | Deal mapping target; layout-required checked-state control documented in `research/specs/lead-conversion.md`. |
| Stage | `Stage` | `picklist` | Required in target mapping and Deal metadata / no unique constraint / editable | Deal mapping target; checked-state control documented in `research/specs/lead-conversion.md`. |

`convert_mapping` names one Standard target layout for each of Contacts, Accounts, and Deals. It enumerates four Deal target fields but no Account or Contact field list. This is a mapping declaration, not evidence of a particular dialog control or validation message.

## Actions

| Surface | Leads-specific control or menu item | Observation and boundary |
| --- | --- | --- |
| Detail header | **Convert** | Enabled trigger on the observed unconverted Lead. No click was performed: the permitted capture tool and automatic approval review prohibit it. The dedicated conversion page is documented in `research/specs/lead-conversion.md`. |
| List Actions | **Mass Transfer**, **Mass Delete**, **Mass Update**, **Mass Convert**, **Manage Tags**, **Assignment Rules**, **Drafts**, **Mass Email**, **Approve Leads**, **Deduplicate Leads**, **Add to Campaigns**, **Create Client Script**, **Export Leads**; divider; the spreadsheet-view entry, **Print View** | Menu inventory in displayed order from `list-actions`; no item executed. Mass Convert and Approve Leads are Lead-specific labels. Other items may appear in other modules; their cross-module uniqueness has not been verified. |
| Detail More Options | **Find and Merge Duplicates**, **Organize Lead Details**, **Enroll to Cadence**, plus Clone, Share, Delete, Print Preview, Mail Merge, Run Macro, Customize Business Card, Add Related List, Review History, Add Kiosk, Create Button, Create Client Script | Menu inventory only, from `detail-more`; no item executed. These labels are shown on Leads; uniqueness relative to other modules is unverified. |
| List create split button | **Create Lead** and **More**; More opens Import Leads, Import Notes, and three ad-sync entries | Menu only. Import and synchronization execution were not attempted. Lead creation fields and behavior are in the linked field and detail specs. |

The action inventory is descriptive. It is not authorization to run bulk, conversion, import, export, email, approval, assignment, or record-changing actions against the reference CRM.

## Filters / views / sorting / search

The complete 14-view inventory, columns, saved criteria, filters, sorting controls, search behavior, and request shapes are in `research/specs/list-views.md`. **All Leads** is the default displayed view; metadata stores its name as **All Open Leads**. It has ten observed rows. **Mailing Labels** and **My Leads** also showed ten; **Unread Leads** showed six. The other captured system views were empty. Three user-created status views (**Junk Leads**, **Not Qualified Leads**, **Open Leads**) are configured with Lead Status criteria and four selected columns, but their list result counts were not captured. `last_accessed_time` is populated on six views in the current metadata export: All Leads, Mailing Labels, My Leads, Unread Leads, Today's Leads and the user-created Open Leads. All of these stamps except Today's Leads fall inside this research's own capture sessions, so they are not evidence of use by our team; opening a view can set this field. Only Today's Leads carries a stamp that predates the research. A null value on the other eight views is not proof that they are unused. Favorites are **not in use in the captured metadata**: all `favorite` values are null. No saved view was added, edited, deleted, pinned, or applied during this task.

The observed detail record's Notes, Cadences, Attachments, Products, Open Activities, Closed Activities, Invited Meetings, Emails, Campaigns, Social, and Customer Interactions bodies are empty or show setup guidance, so they are **not in use for that observed record**. Links and custom buttons return empty responses and are **not in use in the captured setup**. The Lead Image history entry is populated. A related-record count request was blocked, so Connected Records use is unresolved. See `research/specs/record-detail.md` for each related list and its visible controls; no inference about all other Leads is warranted from one record.

## Flows

1. **Reach a Lead.** Select Leads in the shell, load the default or a saved view, then activate a named Lead link. The populated default list and unconverted detail render as described in the linked specs. The plain `/crm/<org>/tab/Leads/list` path is not the list route: the app treats `list` as a record id, requests `GET /crm/v2.2/Leads/list`, receives 404, and leaves the page body blank under the Leads title with no message (`leads-main`). The list route is `/crm/<org>/tab/Leads/custom-view/<viewId>/list`, reached from the rail link (`research/specs/app-shell.md`). Whether a non-existent numeric record id renders the same blank body is unobserved. Empty saved views retain headers and show **No Leads found.** with zero total. Network error states were not observed.
2. **Inspect Leads actions.** Open **Actions** on the list or **More Options** on the detail page. Read the menu labels above; dismiss without selecting a result-producing command. No action-specific form, validation, success, empty, or error state was observed.
3. **Conversion entry.** A **Convert** header control is visible and enabled on the observed Lead. The dedicated conversion page, opening state, and expanded Deal subform are documented in `research/specs/lead-conversion.md`; unobserved interactions remain open there.
4. **Converted views.** Select **Converted Leads** or **My Converted Leads** to see the empty view structure observed in this organization. No actual conversion was run; the behavior of a converted record, list navigation after conversion, duplicate matching, and errors is unknown.

### Module 1 capability and dependency table

“Module 1” below means a Leads-only implementation plus the minimum shell and internal Lead API. “Later dependency” records what else must exist for a complete end-to-end behavior; it is not a board decision to omit a visible feature. “Used” reflects only metadata and the captured organization/record, never an assumption about every record.

| Capability | Use evidence | Module 1 feasibility or later dependency |
| --- | --- | --- |
| Shell navigation to Leads and active rail state | Used; Leads route and active item captured | Module 1 with minimum app shell. |
| Shared page header, list and record navigation | Used; list and detail captured | Module 1. |
| Standard Lead layout and four sections | Used; only configured layout | Module 1. |
| Lead schema, required Company/Last Name, picklists, field limits | Used; populated Leads and metadata | Module 1. |
| Create Lead form | Visible; no save performed | Module 1 with Lead write API; submit validation and error details remain open. |
| Edit Lead form | Visible; edit form opened, no save | Module 1 with Lead write API; submit outcomes remain open. |
| Quick-create Lead form | Five fields in metadata; route captured in field research | Module 1 if exposed by module-local create; shell shortcut access remains open. |
| Detail business card and field sections | Used; record captured | Module 1. |
| Lead image and portrait display | Used; one image/history event observed | Module 1 display; upload/write flow depends on later attachment capability. |
| Lead owner display and selector | Used; owner field shown | Module 1 with user directory/permissions. |
| Lead list rows, columns, wrapping and pagination | Used; ten-row default | Module 1. |
| Default All Leads view | Used and default | Module 1. |
| Other stock saved views and empty state | Configured; several captured, some populated | Module 1. |
| Three user-created Lead Status views | Configured; result counts unknown | Module 1 for reading; view editing depends on customization later. |
| Saved-view criteria, columns and sharing | Configured on three views | Module 1 can read existing definitions; authoring/sharing UI depends on customization later. |
| Favorites and pinning | Not in use in metadata; Pin visible | Later preference persistence; board scope decision. |
| List filters and field criteria | Visible; no filter applied | Module 1 core list filtering; exact operators and validation remain open. |
| List sort and page-size controls | Visible; dialogs/menus captured, not applied | Module 1 with list query support. |
| List presentation modes beyond table | Icons visible; no alternate mode confirmed in use | Later design/scope decision; mode behavior unobserved. |
| Lead list/record search entry points | Visible; query/results untested | Module 1 for Lead-local behavior; global search depends on shell/search later. |
| Record Overview and Timeline History | Used; Lead Image history event | Module 1 for Lead history display; full activity sources depend on later modules. |
| Timeline Interactions, filters and signals | Empty for observed record | Later Activities/communications/signals; board scope decision. |
| Lead status ribbon and inline field edit | Visible; edit result not exercised | Module 1 with Lead write API; validation behavior open. |
| Delete Lead (detail More Options) | Menu visible; not executed | Module 1 with Lead write API; confirmation dialog and post-delete navigation unobserved. |
| Clone Lead | Menu visible; not executed | Module 1 with Lead write API; clone form unobserved. |
| Mass Transfer, Mass Delete, Mass Update | Menu visible; not executed | Module 1 with row selection and bulk Lead write API; dialogs unobserved. |
| Convert Lead to Contact/Account; optional Deal | Visible on the observed unconverted Lead; no conversion executed; opening page and expanded Deal subform in `research/specs/lead-conversion.md` | **Not feasible in Module 1.** Depends on Contacts, Accounts, and Deals. |
| Converted-account/contact/deal bookkeeping and converted views | Fields and empty views configured | **Not feasible in Module 1.** Depends on Contacts, Accounts, and Deals conversion; see `research/specs/lead-conversion.md`. |
| Mass Convert | Menu visible; not executed | **Not feasible in Module 1.** Depends on Contacts, Accounts, and Deals conversion plus selection/bulk API; see `research/specs/lead-conversion.md`. |
| Find and Merge Duplicates, Deduplicate Leads | Menu visible; not executed | Depends on duplicate matching/merge capability; details unobserved. |
| Approve Leads, Assignment Rules, Enroll to Cadence, Run Macro, Review History, blueprints | Menu/configuration entry points; automation counts zero or inactive | Not in use in captured setup; later automation/permissions. |
| Notes | Empty for observed record | Later notes module. |
| Attachments and image upload | Empty attachment card; Lead Image exists | Later attachments/storage module for write flow. |
| Calls, Meetings, Tasks and activity related lists | Empty for observed record | Later Activities module. |
| Send Email, Drafts, Mass Email, Mail Merge and unsubscribe state | Email list empty; unsubscribe views configured | Later communications/integrations; record fields can exist in Module 1. |
| Add to Campaigns and social associations | Empty/setup guidance on observed record | Later integrations/campaigns. |
| Products and connected records | Product list empty; related count blocked | Later linked modules; actual use unresolved. |
| Manage Tags | Menu visible; no tag action run | Later notes/attachments/tags phase per module order, unless board brings forward. |
| Export Leads, Print Preview, Print View, spreadsheet view and imports | Menu entries visible; not run | Later CSV/export/reporting capabilities; board scope decision. |
| Customize Business Card, Organize Lead Details, Add Related List, Add Kiosk, Create Button, Create Client Script, custom links, layout/validation rules, dependent picklists, locking | Empty or absent in Leads setup; menu entries visible | Not in use; later customization if board includes them. |
| Share, permissions and profile visibility | Two profiles in metadata; Share menu visible | Module 1 needs baseline auth/permissions; sharing flow needs later policy/implementation. |
| Layout customization and field permissions | Setup controls visible, one Standard layout configured | Later customization; Module 1 consumes current configuration. |
| Connected-module navigation from Lead detail | Related metadata names Accounts, Contacts, Deals and others | Later corresponding modules; only link presence in Lead page is known. |

## Data needs

These are request **shapes** from the list/detail captures and metadata; paths use placeholders. Conversion page load requests are in `research/specs/lead-conversion.md`. See the linked list and detail specs for the full request inventories.

| Method | Endpoint path | Query or body field names | Response field names | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/crm/<org>/ConstantsInitial.do`, `/crm/<org>/Constants.do`, `/crm/<org>/ModuleMeta.do` | No query keys observed | Bootstrap groups such as `crmObj`, `crmObjInitial`, `globalObjectInitial`; ModuleMeta body shape unavailable | Shell and module bootstrap. |
| GET | `/crm/<org>/ViewPreference.do` | None observed | `modules[]`: `module_name`, `custom_view`, `cvid`, `per_page`, view-mode flags | Saved view preference. |
| POST | `/crm/v2.2/Leads/actions/count` | Query: `approved`, `cvid`, `formatted_currency`, `home_converted_currency`, `on_demand_properties`; body captured opaquely | `count` | Current list count. |
| POST | `/crm/v2.2/Leads/bulk` | Query: `approved`, `cvid`, `fields`, `formatted_currency`, `home_converted_currency`, `on_demand_properties`, `page`, `per_page`; body field names unavailable | `data[]`, `info`: `per_page`, `count`, `page`, `sort_by`, `sort_order`, `more_records` | Paged Lead rows. |
| GET | `/crm/v2.2/Leads/<recordId>` | `approved`, `converted`, `formatted_currency`, `home_converted_currency`, `on_demand_properties`, `insert_recent_item`, `include_element_types` | `data[]`: Lead API fields, `Owner`, `Full_Name`, `Tag`, `id`, state and permission flags | Detail record and Convert eligibility context. |
| GET | `/crm/v2.2/Leads/list` | `approved`, `converted`, `formatted_currency`, `home_converted_currency`, `on_demand_properties`, `insert_recent_item`, `include_element_types` | `404` | Result of the plain `/list` path; not a list request. |
| POST | `/crm/v4/Leads/<recordId>/actions/get_related_records_count` | Not observed: capture blocked the request | Not observed | Related-list count; blocked in `leads-detail`. |
| GET | `/crm/v5/Leads/<recordId>/__conversion_options` | `include_inner_details` | 204, no response body | Conversion page load; see `research/specs/lead-conversion.md` for other requests and unresolved submit contract. |

## Capture refs

New captures: `leads-main` (plain `/list` path: record request returns 404, blank body), `leads-default` (hydrated default list), `leads-detail` (named Lead navigation). Prior, reused captures: `list-actions`, `list-more`, `list-converted`, `list-default`, `detail-main`, `detail-more`, and the linked specs' capture sets. The attempted `leads-convert` capture was rejected before the Convert click; it is not evidence of a dialog. `leads-detail` recorded a blocked related-record-count POST; `leads-main` and `leads-default` recorded no blocked requests or skipped clicks. No reference CRM data was changed.

## Open questions

1. **Conversion page:** Its observed opening state, expanded Deal subform, and remaining questions about owner picker, matching, validation, empty/loading/error states, submit contract, and post-conversion navigation are in `research/specs/lead-conversion.md`; these do not block Module 1.
2. In Module 1, should the detail header's **Convert** trigger remain visible but disabled, or be hidden? The reference shows it enabled, while Contacts, Accounts, and Deals are later dependencies; this requires a board decision.
3. Which listed menu entries are genuinely unique to Leads rather than shared across modules? Only their presence on Leads has been inspected. What are their enabled/disabled states after selection or for converted records?
4. Which three custom views have records, if any, and which views are actually used beyond Today's Leads, the only view whose `last_accessed_time` predates this research? The available metadata and captures do not establish that other configured views are unused.
5. Which related lists are populated on other Leads, and does Connected Records contain entries? One observed record is empty in the rendered lists, and its related-count POST was blocked.
6. What are list filter operators/validation, alternative presentation modes, inline edit outcomes, form submit errors, delete confirmation, clone form, and mass-action dialogs? The linked specs document the visible entry points but not these unexecuted flows.
