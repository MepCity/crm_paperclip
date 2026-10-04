# Leads record detail and create/edit forms

Read-only research of one Lead in the reference CRM. This is the reusable record-page pattern for later modules; only Leads was inspected. Configuration and field definitions are in `research/specs/leads-fields-and-layout.md` and the external research workspace's `metadata/modules/Leads/{layouts,fields,related_lists}.json`. The list-to-record entry point is in `research/specs/list-views.md`. Capture slugs below refer to local research evidence, never to committed screenshots.

## Purpose

Open one Lead, read its identity and related information, inspect history, or open the full create/edit form. The observed record is a single sample; no record was changed. The form and page use the configured `Standard` layout. The create, edit, detail, and quick-create field flags remain defined by the field metadata; this spec adds observed placement and behavior.

## Layout

### Record page

Below the shared shell, a horizontal record header contains Back, a square portrait, `Full_Name`, a hyphen followed by Company, `Add Tags`, `Send Email`, `Convert`, `Edit`, `More Options`, and `Previous Record` / `Next Record` arrows. The prior/next arrows are present; their enabled boundaries and destination order were not tested. `Convert` opens a separate flow covered by later research. The portrait is a user image on this record; implementations must use their own asset or placeholder.

A white related-list rail occupies the left of the detail body. Its heading is `Related List`; 12 entries are visible in order: Notes, Connected Records, Cadences, Attachments, Products, Open Activities, Closed Activities, Invited Meetings, Emails, Campaigns, Social, Voice of the Customer. `Add Related List` follows. A `Links` heading and `Add Link` follow below. The central pane has only two primary tabs, `Overview` and `Timeline`. Overview starts with a `Last Update` age label, a horizontal Lead Status progression ribbon, a business-card panel, a collapsible `Hide Details` panel, then related-list cards. The status ribbon shows the configured Lead Status stages as chevrons; the current status is outlined blue and has a dropdown. The rightmost decision control is a red thumb icon/dropdown. These controls were not activated. `Standard View` and `Create a custom record page` appear at the bottom; customization was not entered.

The business card shows exactly five **fields** in this capture: Lead Owner, Email, Phone, Mobile, Lead Status. The portrait and heading are separate. The full detail panel shows Lead Information in two columns. Its left column, top to bottom: Lead Owner, Title, Phone, Mobile, Lead Source, Industry, Annual Revenue, Email Opt Out, Modified By. Its right column: Company, Lead Name (`Full_Name`), Email, Fax, Website, Lead Status, No. of Employees, Rating, Created By, Skype ID, Secondary Email, Twitter. `Lead Name` is the UI label here although metadata labels `Full_Name` as `Full Name`. Blank values render an em dash, including Rating and Fax; an empty detail picklist is **not** shown as `-None-`. The observed header/full-name presentation places Salutation, First Name, and Last Name in that order with spaces, then ` - ` and Company in the header. This confirms the composition for this one record, not every empty-name case. Details render Created By / Modified By with the user and timestamp. Address Information shows one composite Address row spanning the section; Description Information shows one Description row. The address sub-fields are not separate detail rows.

### Timeline

`Timeline` contains `History` and `Interactions` subtabs. History shows `0 Upcoming Automated Actions`, `Timeline History`, a filter button, and one observed `Lead Image uploaded` event with time and actor. Other event types are not evidenced by this one record. The History filter expands four selectors: Modules (`All Modules`), Users (`All Users`), Time (`Any Time`), Sources (`All Sources`); `Apply Filter` is initially disabled. Interactions shows `Customer Interactions`, a filter button, `Signals`, `Follow-ups`, `View By : All`, and the empty state `No logs available`. This feature is **not in use for the observed record**; other records were not inspected.

### Create and edit forms

The create route displays `Create Lead`; edit displays `Edit Lead`. Both place `Edit Page Layout` beside the title and `Cancel`, `Save and New`, `Save` on the right. The sections appear in order: Lead Image, Lead Information, Address Information, Description Information. Lead Information is a two-column row grid: left Lead Owner / First Name plus Salutation / Title / Phone / Mobile / Lead Source / Industry / Annual Revenue / Email Opt Out; right Company / Last Name / Email / Fax / Website / Lead Status / No. of Employees / Rating / Skype ID / Secondary Email / Twitter. The address section uses one column in the rendered form: Country / Region, Flat / House No./ Building / Apartment Name, Street Address, City, State / Province, Zip / Postal Code, Coordinates (Latitude and Longitude inputs plus Clear All). Description is a large text area. `Connected To` is flagged create-only in metadata but was **not visible** in the captured real create form; see Open questions. `Created By` and `Modified By` are absent from both real forms, resolving the layout-editor discrepancy in the field spec.

Company and Last Name have a narrow red required indicator on the input's left edge; other visible fields have no such indicator. Lead Owner is prefilled on create. Create picklists show `-None-` before selection, including Salutation, Lead Source, Lead Status, Industry, Rating, Country / Region, and State / Province. Edit retains record values; an empty Rating still shows `-None-`. Country opens a searchable list with a `-None-` option. With Country blank, State opens a searchable list containing only `-None-`; with the observed record's Country populated, State offers matching locations plus the currently stored short value. No selection was made. The `Open Lead Owner` button opens a `Select User` dialog with `Search Users`, a selected-user summary, a table headed User Name / Role / Email / Profile, radio controls, `Cancel`, and initially disabled `Done`. No user was selected.

### Related-list structure and use

The 35-entry metadata inventory has 30 `visible=true` entries. The rendered rail consolidates six activity entries into Open/Closed Activities, omits Checklists, Locking Information, and the 12 generated Connected Record Child entries, and does not show the five metadata-hidden entries. The following are the **12 actually rendered** cards for this record. No related-list table headers or data columns were visible in these empty/loading captures; the exact populated columns remain open. Actions are listed as visible controls only; none was run.

| Rail/card | Visible card action or tabs | Observed body state | Visible data columns |
| --- | --- | --- | --- |
| Notes | `Recent Last` sort and `Add a note` input | Blank list; no note row visible | None rendered |
| Connected Records | None shown | `Loading...` persisted | None rendered |
| Cadences | `Enroll` | `No records found`; **not in use for this record** | None rendered |
| Attachments | `Attach` | `No Attachment`; **not in use for this record** | None rendered |
| Products | `Add Products` | `No records found`; **not in use for this record** | None rendered |
| Open Activities | `Add New` | `Loading...` persisted | None rendered |
| Closed Activities | None shown | `Loading...` persisted | None rendered |
| Invited Meetings | None shown | `No records found`; **not in use for this record** | None rendered |
| Emails | `Compose Email`; `Mails`, `Drafts`, `Scheduled` tabs | `No records found`; **not in use for this record** | None rendered |
| Campaigns | `Add Campaigns` | `No records found`; **not in use for this record** | None rendered |
| Social | `Associate Twitter`, `Associate Facebook` links | Association guidance; no linked profile visible; **not in use for this record** | None rendered |
| Voice of the Customer | `Enable feature` | Feature introduction, not a record list; **not enabled here** | None rendered |

Notes, attachment, email, social, and activity internals belong to their later modules. These cards' shell and empty states remain part of the record page. The blocked related-record-count request may explain persistent `Loading...`; do not treat that as proof that those lists are empty.

### Visual layout

**Measured from screenshot** at a 1470 × 835 CSS px viewport (2940 × 1670 capture, 2 image px per CSS px). Bounds and type sizes are approximate where anti-aliasing obscures an exact edge. Shared shell geometry and tokens are in `research/specs/app-shell.md`.

| Element | Approximate geometry and appearance | Visible state |
| --- | --- | --- |
| Record header | x 320–1470, y 50–123; white `#FFFFFF`; 1 px bottom line around `#DCDBEE`. Back and portrait at left; heading about 20 px semibold `#30394B`; action controls aligned right, about 32 px high with 6 px corners. | `Send Email` blue gradient/white text; `Convert`, `Edit`, ellipsis pale gray with dark text. Previous arrow muted; Next darker in the observed record. |
| Related-list rail | x 320–540, y 123–807; white `#FFFFFF`; about 20 px left padding. Heading about 15 px semibold; entries about 15 px regular with 31–33 px vertical pitch; links blue near `#5464F2`. | No selected rail-row fill visible. |
| Detail canvas | x 540–1470, y 123–807; pale blue-gray `#EEF1F9`; 12 px card gaps and roughly 12 px outer inset. | Overview selected. |
| Primary tab switch | About 222 × 36 px at x 600, y 137; white rounded pill with thin gray outline. Each half about 110 px. | Selected Overview has pale blue fill `#EDF0FF`, blue border near `#A9B5FF`, 15 px semibold dark text. |
| Status ribbon | White card x about 552–1458, y 185–253, about 68 px high, 8 px corners. Chevron rail has about 45 px vertical centering. | Current stage blue outline/text; off stages gray, end decision button pale red with red icon. |
| Business card | White card x about 552–1458, y 265–552, about 287 px high, 8 px corners; labels occupy a narrow column around x 645–725, values start near x 770. Rows about 44–45 px apart. | Label gray `#69768F`, value near `#30394B`, links blue; approx. 14 px regular. |
| Details card | White card begins x about 552, y 564; 8 px corners. `Hide Details` header about 44 px high with bottom rule; section heading around 15 px semibold. Two equal columns, each label right-aligned before a value; field row pitch about 44 px. | Empty value is an em dash, not placeholder text. Hover/click of a field exposes a pencil icon; editor activation was not observed. |
| Create/edit page | Pale `#EEF1F9` canvas below y 50. Title/action strip y about 50–108. White form card x about 332–1458, starts y 108, 8 px corners and about 12 px inner inset. Two field columns begin near x 552 and x 1132; labels about 14 px gray and right-aligned; inputs about 320 × 34 px with 1 px `#C5C4D3` outline, about 5 px corners, 20–21 px row gap. | Required inputs show red `#F14949` left edge; focused owner field has blue `#5464F2` outline. Empty picklists show gray `-None-`; Save is blue, secondary actions pale gray. |

The reference font family, small-screen breakpoints, hover animation, and exact shadow blur cannot be measured reliably; use the project-owned typography guidance in `research/specs/typography.md` and retain the observed spacing/color roles and functional icon shapes.

## Fields

This table covers visible identity, business card, detail rows, and rendered form inputs. API names, data types, and flags come from `metadata/modules/Leads/fields.json` plus the Standard layout in `layouts.json`; no listed field is unique. `required` means system or layout requirement, `RO` means read-only in the observed surface or metadata. For the complete dictionary and picklist definitions, use `research/specs/leads-fields-and-layout.md` rather than duplicating them here.

| UI label | API name | Data type | Required / unique / RO | Surface and notes |
| --- | --- | --- | --- | --- |
| Lead Image | `Record_Image` | `profileimage` | no / no / no | Portrait and form image section. |
| Lead Owner | `Owner` | `ownerlookup` | no / no / field-managed | Business card, detail, form lookup; prefilled on create. |
| Company | `Company` | `text` | layout / no / no | Header suffix, detail, form; red required edge. |
| First Name | `First_Name` | `text` | no / no / no | Form left; part of detail `Lead Name`. |
| Last Name | `Last_Name` | `text` | system / no / no | Form right; red required edge; part of detail `Lead Name`. |
| Salutation | `Salutation` | `picklist` | no / no / no | Attached before First Name on form; part of observed full name. |
| Lead Name | `Full_Name` | `text` | no / no / detail only | Header and detail label differ from metadata `Full Name`. |
| Title | `Designation` | `text` | no / no / no | Detail/form left. |
| Email | `Email` | `email` | no / no / no | Business card, detail mail link, form right. |
| Phone; Mobile | `Phone`; `Mobile` | `phone`; `phone` | no / no / no | Business card, detail call affordance, form left. |
| Fax; Website | `Fax`; `Website` | `text`; `website` | no / no / no | Detail/form right; empty Fax displays em dash. |
| Lead Source; Industry | `Lead_Source`; `Industry` | `picklist`; `picklist` | no / no / no | Detail/form left; form empty `-None-`. |
| Lead Status; Rating | `Lead_Status`; `Rating` | `picklist`; `picklist` | no / no / no | Detail/form right; status also card and ribbon; empty Rating is dash in detail and `-None-` in form. |
| No. of Employees | `No_of_Employees` | `integer` | no / no / no | Detail/form right. |
| Annual Revenue | `Annual_Revenue` | `currency` | no / no / no | Detail/form left; form input has currency prefix and info icon. |
| Email Opt Out | `Email_Opt_Out` | `boolean` | no / no / no | Detail left as dash when unchecked in this capture; form checkbox. |
| Skype ID; Secondary Email; Twitter | `Skype_ID`; `Secondary_Email`; `Twitter` | `text`; `email`; `text` | no / no / no | Detail/form right; Skype and Twitter have link affordances when populated. |
| Created By; Modified By | `Created_By`; `Modified_By` | `ownerlookup`; `ownerlookup` | no / no / detail only | Detail right/left with timestamp; absent from real forms. |
| Country / Region; State / Province | `Country`; `State` | `picklist`; `picklist` | no / no / no | Searchable dependent form selectors; composite Address detail. |
| Flat / House No./ Building / Apartment Name; Street Address; City; Zip / Postal Code | `Flat_House_No_Building_Apartment_Name`; `Street`; `City`; `Zip_Code` | `text`; `text`; `text`; `text` | no / no / no | Form address inputs in this order around Country and State. |
| Latitude; Longitude | `Latitude`; `Longitude` | `double`; `double` | no / no / no | Coordinates row inputs; no coordinate change tested. |
| Address | `Address` | `textarea` | no / no / metadata RO | One composite detail row; component form inputs. |
| Description | `Description` | `textarea` | no / no / no | One detail row; form text area. |

Metadata flags `Connected_To__s` as create-visible and edit-hidden, yet it did not render in the captured create form. Metadata marks several system fields view-visible, but the rendered detail showed only the rows listed in Layout; see Open questions. The quick-create metadata order is Company, First Name, Last Name, Email, Phone, with Company and Last Name required; its real form was not reachable through a named control, so appearance/validation remain unverified.

## Actions

The header `More Options` menu lists, in visual order: Clone, Share, Delete, Print Preview, Find and Merge Duplicates, Mail Merge, Run Macro, Customize Business Card, Organize Lead Details, Add Related List, Review History, Enroll to Cadence, Add Kiosk, Create Button, Create Client Script. This inventory was observed by opening the menu only. `Send Email`, `Convert`, `Edit`, `Add Tags`, Back, previous/next navigation and the status ribbon are present. Only `Edit`, Overview/Timeline navigation, menu opening, and passive form selectors were followed. No create/edit, send, conversion, association, deletion, or other result-producing action was executed.

The detail's field button reveals a pencil affordance when clicked or hovered. The pencil has no accessible name in the capture, so inline editor contents and validation were not inspected. `Hide Details` is expanded in the capture; collapse behavior was not exercised. Related-card actions are listed under Layout.

## Filters / views / sorting / search

The Timeline History filter has Modules, Users, Time, and Sources selectors and an initially disabled `Apply Filter`; available option sets and applied result behavior were not captured. `Customer Interactions` has a separate filter button and `View By : All`, but its filter fields were not opened. Notes has a `Recent Last` selector; Emails has Mails/Drafts/Scheduled tabs. The record page itself has no observed record-list view switch, sort, or local search. Shell search and Leads list filtering are specified in `research/specs/app-shell.md` and `research/specs/list-views.md`.

## Flows

1. **Open a Lead.** From the Leads list, activate one named Lead link. The record header, related rail, Overview, five-field card and detail rows appear. The record request supplies field values and action eligibility. Back returns toward the list; its exact restoration of list view/scroll was not tested. Previous/Next are visible but were not followed because only one record was permitted for this study. Empty detail values render an em dash.
2. **Read history.** Select Timeline, then History. The observed event card shows an event type, time and actor. Open the filter button to reveal four selectors; initially Apply Filter is disabled. Switch to Interactions to see an empty `No logs available` state. A request or rendering error state did not occur in these captures.
3. **Open create.** Navigate to `/crm/<org>/tab/Leads/create`. The real form shows the Standard sections and required markers described above. Open a picklist without choosing a value; `-None-` is selected. With no Country, State has only `-None-`; Country itself has a search field and choices. Open Lead Owner to see the user picker; its Done button is disabled until a change. No field was filled or submitted. Required-field, format, duplicate and server-error message placement therefore remain unobserved.
4. **Open edit.** On that same Lead, activate Edit. The form has the same section order and save controls, with existing values. The empty Rating remains `-None-`; State exposes a searchable set associated with the populated Country and retains the stored short value. No value was changed or saved. `Cancel`, `Save`, and `Save and New` labels are visible, but their result routes, dirty-form prompt, success message and failure states were not exercised.
5. **Inspect related cards.** Scroll the Overview to each card. Empty cards retain their title and action control where one exists; loading cards retain `Loading...` in these captures. No new related record, note, attachment, activity or association was created.

## Data needs

Only request shapes actually present in the captures are listed. Generic shell requests are covered by the shell spec. Paths and query **names** are preserved; IDs and values are placeholders. GET unless another method is shown. Response fields are structural keys from `network.json`, not customer values.

| Screen purpose | Method and path | Query/body shape | Response keys |
| --- | --- | --- | --- |
| Record | `GET /crm/v2.2/Leads/<recordId>` | `approved`, `converted`, `formatted_currency`, `home_converted_currency`, `on_demand_properties`, `insert_recent_item`, `include_element_types`; edit also makes a shorter variant | `data[]` with Lead field API names, `Owner`, `Created_By`, `Modified_By`, `Full_Name`, status/permission flags, `id` |
| Record actions | `GET /crm/v2.2/Leads/<recordId>/actions/available_actions` | No query | `actions`, `info` |
| Module/form configuration | `GET /crm/v2.2/settings/modules/Leads` | `include` | `modules` including layout, related-list and business-card configuration |
| Related-list configuration | `GET /crm/v5/settings/related_lists` | `module`, `layout_id` | `related_lists[]` |
| Related cards | `GET /crm/<org>/NewRelatedList.do` | `action`, `countFlow`, `id`, `fromIndex`, `module` or `action`, `pname`, `module`, `id` | `Leads`, `notes`, `isNotesRLPresent`, list metadata/body; Social adds `SocialObj` |
| Email card | `GET /crm/v2/Leads/<recordId>/Emails/shared_details`; `GET /crm/v6/Leads/<recordId>/Emails` | Second call: `index`, `type` | `email_related_list`; `Emails` |
| Notes card | `GET /crm/v9/Leads/<recordId>/Notes` | `per_page`, `page`, `sort_by`, `sort_order` | No successful response shape captured |
| Timeline | `GET /crm/v9/Leads/<recordId>/timelines` | `per_page`, `include_inner_details`, `include_timeline_types`, `include` | `timelines[]{audited_time, action, type, source, done_by, record, field_history}`, `info{page,per_page,count,more_records,next_page_token,previous_page_token}` |
| Upcoming actions | `GET /crm/v2/Leads/<recordId>/upcoming_actions/actions/count` | No query | `count` |
| Interactions | `GET /crm/v9/Leads/<recordId>/__journeys`; `GET .../__journeys/actions/milestone_average_time`; `GET .../__ownership_history` | `per_page` on journeys and ownership history | Journey responses not captured; ownership response `__ownership_history`, `info` |
| Country/State dependency | `GET /crm/v9/settings/global_map_dependency` | No query | `global_map_dependency[]{parent_global_picklist,child_global_picklist,pick_list_values[]{maps[]}}` |

The existing list-to-record transition also emits `POST /crm/v2.2/Leads/actions/count` and `POST /crm/v2.2/Leads/bulk` (query keys include `page`, `fields`, `approved`, `cvid`, `per_page`; responses `count` and `data,info`). The capture tool blocked `POST /crm/v4/Leads/<recordId>/actions/get_related_records_count` on record-page captures; that endpoint's payload/response and its effect on loading related cards remain unknown. No create/update request was made, so write payload shapes and validation responses cannot be inferred from these captures. No separate Country-to-State request occurred on opening either selector; the global dependency map was already fetched at page load.

## Capture refs

`detail-main`, `detail-more`, `detail-timeline`, `detail-timeline-filter`, `detail-interactions`, `detail-create`, `detail-create-country`, `detail-create-state`, `detail-create-owner`, `detail-edit`, `detail-edit-state`, `detail-inline-rating`. All are in the local research workspace. `detail-edit` was recaptured after an initial loading state; `detail-inline-rating` records the pencil affordance without editing. No customer data or screenshots are committed.

## Open questions

1. What are the real quick-create form's appearance, validation and Save behavior? Metadata gives the five-field order, but a named entry point was not available in this scoped capture.
2. Why does `Connected_To__s` have `create=true` in metadata but not appear in the real create form? Does another condition reveal it? The detail-only metadata fields (`Created_Time`, `Modified_Time`, `Last_Activity_Time`, conversion fields, Tag) were also absent from the observed Standard detail rows despite view flags. The rendered `Lead Name` label for `Full_Name` differs from the metadata label `Full Name`.
3. What are the exact populated columns, row actions, counts and pagination for each visible related list? This one record showed only empty, disabled-feature or persistent-loading bodies. The blocked related-record-count POST needs a safe observation path before the loading states can be classified. How do the 30 metadata-visible lists reduce to the 12 rendered entries, especially the generated child lists and Checklists/Locking Information?
4. How does the inline pencil open the field editor, and where do inline errors appear? The icon was unnamed and was not clicked. What do the status-ribbon dropdown and decision control do? No state change was permitted.
5. Where do required, email, numeric, duplicate, and server errors appear on Save or Save and New? What are Cancel's dirty-form prompt and each successful destination? These outcomes require a write attempt and were not tested on the reference CRM.
6. Does Country change clear State, and how is an older short State value represented when the dropdown lists full names? Opening both selectors showed the dependent choices, but choosing a country or state would change form data and was not done. Whether dependency mapping is entirely loaded by the initial `global_map_dependency` response is unproven for a changed parent.
7. What are Timeline filter option sets and result behavior, other event types, Interactions filter fields, and the exact prior/next record boundary rules? One record and its single history event are insufficient evidence. The empty Interactions state is only known for this record.
8. What are the exact responsive breakpoints, font family, and focus/hover animations? Screenshot measurements cover one desktop viewport only.
