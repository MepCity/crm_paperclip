# Leads — Module 1 entry and scope

Status: read-only Module 1 research complete. Conversion dialog research is deferred under MEP-102 and does not block Module 1. This document links the approved Leads research rather than restating those screens. Capture names refer only to local research captures; no record values are retained here.

## Purpose

Leads is Module 1. Users reach a saved Leads list, open a Lead, work with its fields and related information, and can initiate conversion to a Contact and Account with an optional Deal. The first four specs define the shared shell, field model, list, and record page: `research/specs/app-shell.md`, `research/specs/leads-fields-and-layout.md`, `research/specs/list-views.md`, and `research/specs/record-detail.md`. This entry identifies Leads-specific actions, observed use, cross-module dependencies, and the remaining conversion research gap. It does not specify the Contacts, Accounts, or Deals screens.

## Layout

The Leads list and record geometry is specified in `research/specs/list-views.md` and `research/specs/record-detail.md`. The list has a Leads toolbar with **Create Lead**, **More**, and **Actions**. The detail header places **Convert** between **Send Email** and **Edit**, with **More Options** after Edit. The header's identity and related rail follow the record-detail spec. Opening the conversion dialog was blocked, so its regions, control order, and states cannot be specified from a screenshot.

### Visual layout

All values in this subsection are **measured from screenshot** in CSS pixels using pixel samples of `leads-detail`, `detail-more`, and `list-actions`; the screenshot scale is two image pixels per CSS pixel. The shared record and list measurements are in the linked specs.

| Element | Measured bounds and appearance | State / evidence |
| --- | --- | --- |
| Detail Convert trigger | Interactive box x 1185–1266, y 70–102 (81 × 32); 1 px pale edge, approximately 6 px corners; interior vertical gradient includes `#FDFDFE`, `#F8F8FB`, `#F5F4F9`, and `#F3F2F8`; label's solid glyph pixels are `#313949`. The label is visually centered in this 32 px row. | Enabled in the observed record header; `leads-detail`. Bounds are from the captured control box and the colors from pixel samples in that box. Its hover, focus, and disabled variants were not captured. |
| Detail More Options menu | White `#FFFFFF` panel over the page surface `#EEF1F9`; a visible highlighted option uses `#F0F4FC` and text pixels include `#313949`. | Open menu; `detail-more`. Panel geometry and menu item rhythm are already specified in `research/specs/record-detail.md`. |
| List Actions menu | White `#FFFFFF` panel; a visible highlighted item uses `#F0F4FC`, text pixels include `#313949`, and a divider uses `#CED0E1`. | Open menu; `list-actions`. List toolbar placement is in `research/specs/list-views.md`. |
| Conversion dialog | No screenshot exists. Its dimensions, surfaces, spacing, typography, controls, and states are unmeasured. | Research deferred to MEP-102; the safe capture tool blocks the header trigger. |

The measured palette above is local to the sampled components. Do not infer dialog styling from the header or menu. Recreate icons for their functions; do not reuse reference assets.

## Fields

The table includes fields directly relevant to the conversion entry and the mapping metadata, not the complete Leads field dictionary. Lead API names and types come from `metadata/modules/Leads/fields.json`; the optional Deal target fields come from `metadata/modules/Deals/fields.json` and the Lead layout's `convert_mapping`. For complete Lead flags, limits, picklists, and mappings, use `research/specs/leads-fields-and-layout.md`. A field's presence in metadata does **not** prove that the unobserved dialog renders it.

| Label | API name | Data type | Required / unique / read-only | Notes |
| --- | --- | --- | --- | --- |
| Lead Owner | `Owner` | `ownerlookup` | Optional / no unique constraint / metadata field is editable | Present on the Lead; whether conversion has separate Contact, Account, or Deal owner controls is unobserved. |
| Company | `Company` | `text` | Required in Standard Lead layout / no unique constraint / editable | Candidate Account name source, but the dialog's create or match controls and mapping are unobserved. |
| First Name | `First_Name` | `text` | Optional / no unique constraint / editable | Contact mapping details are in the field/layout spec; dialog rendering is unobserved. |
| Last Name | `Last_Name` | `text` | System required / no unique constraint / editable | Contact mapping details are in the field/layout spec; dialog rendering is unobserved. |
| Converted Account | `Converted_Account` | `lookup` | Optional / no unique constraint / read-only | Conversion bookkeeping field; hidden from Lead forms by all four view flags. |
| Converted Contact | `Converted_Contact` | `lookup` | Optional / no unique constraint / read-only | Conversion bookkeeping field; hidden from Lead forms by all four view flags. |
| Converted Deal | `Converted_Deal` | `lookup` | Optional / no unique constraint / read-only | Conversion bookkeeping field; hidden from Lead forms by all four view flags. |
| Potential Name (mapping label) | `Deal_Name` | `text` | Required in target mapping and Deal metadata / no unique constraint / editable | `convert_mapping.Deals.fields` uses this label; Deal metadata calls the same API field **Deal Name**. Dialog label unobserved. |
| Amount | `Amount` | `currency` | Optional / no unique constraint / editable | Optional Deal mapping field; dialog rendering unobserved. |
| Closing Date | `Closing_Date` | `date` | Optional / no unique constraint / editable | Optional Deal mapping field; dialog rendering unobserved. |
| Stage | `Stage` | `picklist` | Required in target mapping and Deal metadata / no unique constraint / editable | Optional Deal mapping field; dialog rendering unobserved. |

`convert_mapping` names one Standard target layout for each of Contacts, Accounts, and Deals. It enumerates four Deal target fields but no Account or Contact field list. This is a mapping declaration, not evidence of a particular dialog control or validation message.

## Actions

| Surface | Leads-specific control or menu item | Observation and boundary |
| --- | --- | --- |
| Detail header | **Convert** | Enabled trigger on the observed unconverted Lead. No click was performed: the permitted capture tool and automatic approval review prohibit it. Whether the first click opens a dialog or performs any write is unresolved. |
| List Actions | **Mass Convert**, **Approve Leads**, **Deduplicate Leads**, **Export Leads**, **Mass Email**, plus transfer/update/delete, tags, assignment rules, drafts, campaign, script, spreadsheet, and print entries | Menu inventory only, from `list-actions`; no item executed. Mass Convert and Approve Leads are Lead-specific labels. Other items may appear in other modules; their cross-module uniqueness has not been verified. |
| Detail More Options | **Find and Merge Duplicates**, **Organize Lead Details**, **Enroll to Cadence**, plus Clone, Share, Delete, Print Preview, Mail Merge, Run Macro, Customize Business Card, Add Related List, Review History, Add Kiosk, Create Button, Create Client Script | Menu inventory only, from `detail-more`; no item executed. These labels are shown on Leads; uniqueness relative to other modules is unverified. |
| List create split button | **Create Lead** and **More**; More opens Import Leads, Import Notes, and three ad-sync entries | Menu only. Import and synchronization execution were not attempted. Lead creation fields and behavior are in the linked field and detail specs. |

The action inventory is descriptive. It is not authorization to run bulk, conversion, import, export, email, approval, assignment, or record-changing actions against the reference CRM.

## Filters / views / sorting / search

The complete 14-view inventory, columns, saved criteria, filters, sorting controls, search behavior, and request shapes are in `research/specs/list-views.md`. **All Leads** is the default displayed view; metadata stores its name as **All Open Leads**. It has ten observed rows. **Mailing Labels** and **My Leads** also showed ten; **Unread Leads** showed six. The other captured system views were empty. Three user-created status views (**Junk Leads**, **Not Qualified Leads**, **Open Leads**) are configured with Lead Status criteria and four selected columns, but their list result counts were not captured. Only **All Leads** and **Today's Leads** have a metadata `last_accessed_time`; that is evidence of access, not proof the remaining views are unused. Favorites are **not in use in the captured metadata**: all `favorite` values are null. No saved view was added, edited, deleted, pinned, or applied during this task.

The observed detail record's Notes, Cadences, Attachments, Products, Open Activities, Closed Activities, Invited Meetings, Emails, Campaigns, Social, and Customer Interactions bodies are empty or show setup guidance, so they are **not in use for that observed record**. Links and custom buttons return empty responses and are **not in use in the captured setup**. The Lead Image history entry is populated. A related-record count request was blocked, so Connected Records use is unresolved. See `research/specs/record-detail.md` for each related list and its visible controls; no inference about all other Leads is warranted from one record.

## Flows

1. **Reach a Lead.** Select Leads in the shell, load the default or a saved view, then activate a named Lead link. The populated default list and unconverted detail render as described in the linked specs. The initial plain list route briefly showed a blank hydration interval; it is not a confirmed empty state. Empty saved views retain headers and show **No Leads found.** with zero total. Network error states were not observed.
2. **Inspect Leads actions.** Open **Actions** on the list or **More Options** on the detail page. Read the menu labels above; dismiss without selecting a result-producing command. No action-specific form, validation, success, empty, or error state was observed.
3. **Conversion entry (unverified).** A **Convert** header control is visible and enabled on the observed Lead. Its dialog could not be opened because the capture tool rejects this control before clicking. The metadata establishes target modules/layouts and Deal field mappings only. Dialog controls, validation, empty/error states, and request shapes are deferred to MEP-102; do not implement a guessed dialog from this spec.
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
| Convert Lead to Contact/Account; optional Deal | Visible on the observed unconverted Lead; no conversion executed; dialog unobserved | **Not feasible in Module 1.** Depends on Contacts, Accounts, and Deals. Dialog research is deferred under MEP-102. |
| Converted-account/contact/deal bookkeeping and converted views | Fields and empty views configured | **Not feasible in Module 1.** Depends on Contacts, Accounts, and Deals conversion; dialog research is deferred under MEP-102. |
| Mass Convert | Menu visible; not executed | **Not feasible in Module 1.** Depends on Contacts, Accounts, and Deals conversion plus selection/bulk API; dialog research is deferred under MEP-102. |
| Duplicates and merge | Menu visible; not executed | Depends on duplicate matching/merge capability; details unobserved. |
| Approval, assignment rules, cadences, macros, blueprints | Menu/configuration entry points; automation counts zero or inactive | Not in use in captured setup; later automation/permissions. |
| Notes | Empty for observed record | Later notes module. |
| Attachments and image upload | Empty attachment card; Lead Image exists | Later attachments/storage module for write flow. |
| Calls, Meetings, Tasks and activity related lists | Empty for observed record | Later Activities module. |
| Emails, drafts, mass email, mail merge and unsubscribe state | Email list empty; unsubscribe views configured | Later communications/integrations; record fields can exist in Module 1. |
| Campaigns and social associations | Empty/setup guidance on observed record | Later integrations/campaigns. |
| Products and connected records | Product list empty; related count blocked | Later linked modules; actual use unresolved. |
| Tags | Add Tags visible; no tag action run | Later notes/attachments/tags phase per module order, unless board brings forward. |
| Import/export, print and spreadsheet view | Menu entries visible; not run | Later CSV/export/reporting capabilities; board scope decision. |
| Custom buttons, links, layout/validation rules, dependent picklists, locking | Empty or absent in Leads setup | Not in use; later customization if board includes them. |
| Record sharing, permissions and profile visibility | Two profiles in metadata; Share menu visible | Module 1 needs baseline auth/permissions; sharing flow needs later policy/implementation. |
| Layout customization, field permissions and related-list management | Setup controls visible, one Standard layout configured | Later customization; Module 1 consumes current configuration. |
| Connected-module navigation from Lead detail | Related metadata names Accounts, Contacts, Deals and others | Later corresponding modules; only link presence in Lead page is known. |

## Data needs

These are request **shapes** from the list/detail captures and metadata; paths use placeholders. No conversion dialog request or response was observed. See the linked list and detail specs for the full request inventories.

| Method | Endpoint path | Query or body field names | Response field names | Purpose |
| --- | --- | --- | --- | --- |
| GET | `/crm/<org>/ConstantsInitial.do`, `/crm/<org>/Constants.do`, `/crm/<org>/ModuleMeta.do` | No query keys observed | Bootstrap groups such as `crmObj`, `crmObjInitial`, `globalObjectInitial`; ModuleMeta body shape unavailable | Shell and module bootstrap. |
| GET | `/crm/<org>/ViewPreference.do` | None observed | `modules[]`: `module_name`, `custom_view`, `cvid`, `per_page`, view-mode flags | Saved view preference. |
| POST | `/crm/v2.2/Leads/actions/count` | Query: `approved`, `cvid`, `formatted_currency`, `home_converted_currency`, `on_demand_properties`; body captured opaquely | `count` | Current list count. |
| POST | `/crm/v2.2/Leads/bulk` | Query: `approved`, `cvid`, `fields`, `formatted_currency`, `home_converted_currency`, `on_demand_properties`, `page`, `per_page`; body field names unavailable | `data[]`, `info`: `per_page`, `count`, `page`, `sort_by`, `sort_order`, `more_records` | Paged Lead rows. |
| GET | `/crm/v2.2/Leads/<recordId>` | `approved`, `converted`, `formatted_currency`, `home_converted_currency`, `on_demand_properties`, `insert_recent_item`, `include_element_types` | `data[]`: Lead API fields, `Owner`, `Full_Name`, `Tag`, `id`, state and permission flags | Detail record and Convert eligibility context. |
| POST | `/crm/v4/Leads/<recordId>/actions/get_related_records_count` | Not observed: capture blocked the request | Not observed | Related-list count; blocked in `leads-detail`. |
| Unknown | Conversion-dialog preload and conversion submit endpoint | Not observed | Not observed | No network contract should be invented. |

## Capture refs

New captures: `leads-main` (plain list route, initial shell interval), `leads-default` (hydrated default list), `leads-detail` (named Lead navigation). Prior, reused captures: `list-actions`, `list-more`, `list-converted`, `list-default`, `detail-main`, `detail-more`, and the linked specs' capture sets. The attempted `leads-convert` capture was rejected before the Convert click; it is not evidence of a dialog. `leads-detail` recorded a blocked related-record-count POST; `leads-main` and `leads-default` recorded no blocked requests or skipped clicks. No reference CRM data was changed.

## Open questions

1. **Conversion dialog, deferred to MEP-102:** What does the trigger open? Which controls choose new or existing Accounts and Contacts, handle duplicates, configure an optional Deal and owners, and what are their labels, initial values, order, required markers, permissions, and states? What are the dialog's measured layout, focus/disabled states, validation, empty/loading/error/cancel behavior, request and response shapes, and post-conversion navigation? The mapping calls `Deal_Name` **Potential Name**, while Deal metadata calls it **Deal Name**; its rendered label remains unknown. The capture tool blocks the trigger, and the board's read-only evidence request in MEP-102 does not block Module 1.
2. In Module 1, should the detail header's **Convert** trigger remain visible but disabled, or be hidden? The reference shows it enabled, while Contacts, Accounts, and Deals are later dependencies; this requires a board decision.
3. Which listed menu entries are genuinely unique to Leads rather than shared across modules? Only their presence on Leads has been inspected. What are their enabled/disabled states after selection or for converted records?
4. Which three custom views have records, if any, and which views are actually used beyond the two with `last_accessed_time`? The available metadata and captures do not establish that other configured views are unused.
5. Which related lists are populated on other Leads, and does Connected Records contain entries? One observed record is empty in the rendered lists, and its related-count POST was blocked.
6. What are list filter operators/validation, alternative presentation modes, inline edit outcomes, and form submit errors? The linked specs document the visible entry points but not these unexecuted flows.
