# Lead conversion screen

Status: Complete read-only research. The opening page and expanded Deal subform are captured (`board-lead-convert-probe`, `leads-convert-deal`). The owner picker popup state was skipped by the capture tool (`skippedClicks` due to safety check against dangerous attribute containing `convert`). Write-only states (submit validation, conversion completion, duplicate matching) remain unobservable without writes and are listed under Open questions. This screen belongs to the later Contacts, Accounts, and Deals work, outside Module 1.

## Purpose

An unconverted Lead can be prepared for conversion into a new Account and Contact, with an optional new Deal. The dedicated route is `/crm/<org>/tab/Leads/<recordId>/convert`. Actual conversion execution was not performed, adhering strictly to the read-only rule. See `research/specs/leads.md` for the Lead entry point and Module 1 scope, `research/specs/record-detail.md` for the source record page, and `research/specs/leads-fields-and-layout.md` for Lead fields and conversion mapping.

## Layout

The screen retains the shared reference CRM app shell with the Leads rail item selected. The page content consists of:

1. **Heading bar:** Full-width header displaying **Convert Lead** followed by the source lead's identity in muted gray text: `(<Lead Name> - <Company>)`. This renders directly in the main page flow, not within a modal dialog.
2. **Main content area (left column, ~845 px wide):**
   - **Account creation row:** Displays the label **Create New Account** followed by a non-editable pill/chip containing the source company name (`<Company>`).
   - **Contact creation row:** Displays the label **Create New Contact** followed by a non-editable pill/chip containing the source lead's full name (`<Lead Name>`).
   - **Optional Deal toggle:** A checkbox labeled **Create a new Deal for this Account.** When unchecked (default on page load), no Deal fields are displayed. When checked, the Deal subform expands inline directly below the checkbox.
   - **Deal subform region (expanded when Deal checkbox is checked):** An inline form region labeled internally as `crm.quickcreate.title` spanning 600 px wide and ~250 px high. Contains six field rows in vertical succession:
     1. **Amount:** Currency input with local currency prefix (`TL`).
     2. **Deal Name:** Single-line text input with a 3 px red required left-border indicator (`#FF5D5A`), prefilled with the source company name (`<Company>`).
     3. **Closing Date:** Date input with placeholder `DD.MM.YYYY` and a 3 px red required left-border indicator (`#FF5D5A`).
     4. **Stage:** Picklist dropdown selector with a 3 px red required left-border indicator (`#FF5D5A`), defaulting to `Qualification`.
     5. **Campaign Source:** Autocomplete input with a lookup search trigger button (`Open Campaign Source`).
     6. **Contact Role:** Dropdown selector defaulting to `None`.
   - **Owner section:** Labeled **Owner of the New Records**, containing a light-gray readonly input prefilled with the current Lead owner's name (`<owner>`), flanked on the right by a person-search icon button (`[data-zcqa="con_lookForOwners"]`). Pushed down from y 276–329 in the opening unchecked state to y 647–681 when the Deal subform is expanded.
   - **Action buttons:** Positioned directly below the Owner control:
     - Primary **Convert** button (solid blue fill, white text).
     - Secondary **Cancel** button (light gray border and background, dark text).
     Pushed down from y 389–421 in the opening state to y 723–755 when the Deal subform is expanded.
3. **Right rail column (~300 px wide):**
   - Heading: **Quick Links**
   - Links: **Lead Conversion Mapping** (linking to `/crm/<org>/settings/modules/Leads/conversion-mapping`) and **Help**.

### Visual layout

All coordinates and colours below are **measured from screenshot** `board-lead-convert-probe` (opening state) and `leads-convert-deal` (expanded Deal state) using pixel sampling at two image pixels per CSS pixel (viewport 1470 × 835 CSS pixels). Bounds describe visible pixels, not computed CSS boxes. Font sizes and weights are visual estimates from measured ink height.

| Region or control | Measurement and visible state |
| --- | --- |
| Heading band | White `#FFFFFF` surface starts at x 320 to right viewport edge; top edge y 50, bottom divider y 102 in `#EDF0F4`. **Convert Lead** dark ink `#202123` spans x 352–476.5, y 69.5–84.5; visible ink is 15 px high (~20 px bold). Muted record identity `#8B9AB9` ink spans x 483–843.5, y 71.5–85 (~15 px semibold). Left inset is 32 px from the page content edge. |
| Main area and right rail | Main surface is `#FFFFFF`, beginning at x 320 below y 103. Rail starts at x 1170; divider is `#EDF0F4` across x 1165–1170, y 103–800. Main column width is ~845 px (x 320 to 1165); rail width is ~300 px (x 1170 to 1470). Rail heading and links start at x 1185 (15 px inset). Link ink is `#5464F2` across x 1186.5–1354, y 138–151. |
| Account and Contact rows | Row labels start at x 350 (30 px inset from content edge). Account label `#313949` ink spans x 351–483.5, y 139–149; Contact label starts around y 170. Baselines are ~32 px apart. Each value is a gray `#C5C4D3` rounded chip with dark `#313949` text. Account chip begins at x 492 and spans y 133–155 (22 px height). Source values are omitted. |
| Deal checkbox (unchecked state) | Unchecked box border is `#C5C4D3` at x 350–365, y 229–244 (15 × 15 px square, 2 px border-radius, `#FFFFFF` interior). Label starts at x 371 with `#313949` ink. |
| Deal checkbox (checked state) | Checked box border and fill is `#5464F2` at x 350–365, y 227–242 (15 × 15 px square). Interior features a crisp white `#FFFFFF` checkmark. Label text `#313949` begins at x 371 with 6 px gap from the checkbox. |
| Deal subform container | Expands at x 350–950, y 269–519 (600 × 250 px). Interior surface is `#FFFFFF`. Labels are right-aligned or left-padded in the column x 350–500 (150 px width) in `#616E88` ink (~13 px regular). Input controls start at x 505 / 506. |
| Deal: Amount field | Label at x 350, y 276. Input spans x 506–862, y 270–302 (356 × 32 px). Left currency prefix badge spans x 506–541 with `#FFFFFF` background, `#313949` `TL` text, and `#C5C4D3` border. Text input field spans x 541–862 with `#FFFFFF` background and `#C5C4D3` outer border. No red required indicator. |
| Deal: Deal Name field | Label at x 350, y 329. Input spans x 505–895, y 323–357 (390 × 34 px). Border is `#C5C4D3`. Left edge has a solid 3 px red mandatory indicator strip in `#FF5D5A` from x 505 to 508, y 323–357. Background is `#FFFFFF`. Prefilled value text is `#313949` (~14 px regular). |
| Deal: Closing Date field | Label at x 350, y 383. Input spans x 505–895, y 377–411 (390 × 34 px). Border is `#C5C4D3`. Left edge has a solid 3 px red mandatory indicator strip in `#FF5D5A` from x 505 to 508, y 377–411. Placeholder `DD.MM.YYYY` appears in muted ink `#8C91AB`. |
| Deal: Stage dropdown | Label at x 350, y 437. Dropdown button spans x 505–895, y 431–465 (390 × 34 px). Border is `#C5C4D3`. Left edge has a solid 3 px red mandatory indicator strip in `#FF5D5A` from x 505 to 508, y 431–465. Default selected value `Qualification` appears in `#313949` text. Dropdown arrow icon sits at the right edge (~x 875). |
| Deal: Campaign Source field | Label at x 350, y 492. Autocomplete input spans x 506–894, y 486–518 (388 × 32 px). Border is `#C5C4D3`. Lookup icon button `Open Campaign Source` spans x 870–886, y 494–510 (16 × 16 px). Background is `#FFFFFF`. No red required indicator. |
| Deal: Contact Role field | Label at x 350, y 543. Dropdown spans x 506–896, y 537–571 (390 × 34 px). Border is `#C5C4D3`. Default value `None` appears in `#313949` text. No red required indicator. |
| Owner field (opening state) | Label at x 350, y 276. Input border `#D2D9F1` at x 350–529.5, y 295–329 (180 × 34 px). Interior fill `#F5F6F8`. Existing owner name in `#313949`. Person-search icon at x 538–554, y 304–320. |
| Owner field (Deal checked state) | Label at x 350, y 628. Input border `#D2D9F1` at x 350–530, y 647–681 (180 × 34 px). Interior fill `#F5F6F8`. Existing owner name in `#313949`. Person-search icon at x 537–553, y 656–672 (16 × 16 px). |
| Actions (opening state) | Positioned below Owner at y 389–421. Primary **Convert** at x 350–431, y 389–421 (81 × 32 px) with blue fill `#5767F6` / `#1A50C9` and white text. Secondary **Cancel** at x 442–517, y 389–421 (75 × 32 px) with border `#D5D8E9`, fill `#F3F2F8`, dark text. |
| Actions (Deal checked state) | Positioned below Owner at y 723–755. Primary **Convert** at x 350–431, y 723–755 (81 × 32 px) with blue fill `#5767F6` / `#345ADC` and white text. Secondary **Cancel** at x 442–516, y 723–755 (74 × 32 px) with border `#D5D8E9`, fill `#FFFFFF` / `#F3F2F8`, dark text. |

The shared shell's geometry, typography, and icon treatment are specified in `research/specs/app-shell.md`. No source logo, image, icon, or font asset belongs in the implementation.

## Fields

The table details all visible fields and controls on the conversion screen, cross-referenced with `~/Desktop/mepcity-research/metadata/` (`convert_mapping` in `modules/Leads/layouts.json` and field definitions in `modules/Deals/fields.json`).

| Visible label | API name | Data type | Required / unique / read-only | Observed initial state & control | Notes |
| --- | --- | --- | --- | --- | --- |
| Create New Account | `Company` (source Lead) | `text` | Lead layout required / no / no | Non-editable chip with source `<Company>` value | Displays source Lead company. Whether an existing Account can be selected is unobserved for this record. |
| Create New Contact | `Full_Name` (source Lead) | `text` | Lead metadata no / no / no | Non-editable chip with source `<Lead Name>` value | Displays source Lead contact identity. First and last name breakdown not displayed. |
| Create a new Deal for this Account. | Not applicable (UI toggle) | `checkbox` | No / no / no | Unchecked on initial load; checkbox toggle | Controls visibility of the Deal subform below. |
| Amount | `Amount` | `currency` | No / no / no | Empty input; `lyte-input` with currency prefix `TL` | Optional deal value. Input max length 16. |
| Deal Name | `Deal_Name` | `text` | **Yes** / no / no | Prefilled with `<Company>`; `lyte-input` | System mandatory. Features a 3 px red left-border indicator (`#FF5D5A`). `convert_mapping` labels it `Potential Name`, but the UI renders `Deal Name`. Max length 120. |
| Closing Date | `Closing_Date` | `date` | **Yes in UI** (metadata says optional) / no / no | Empty input with placeholder `DD.MM.YYYY`; `lyte-input` | Displays a 3 px red left-border indicator (`#FF5D5A`). In `convert_mapping` and `fields.json` it is marked `required: false`; the UI enforces it with the red indicator. |
| Stage | `Stage` | `picklist` | **Yes** / no / no | Default value `Qualification`; `lyte-dropdown` | System mandatory. Features a 3 px red left-border indicator (`#FF5D5A`). Populated from `/crm/v2.1/settings/stages?module=Deals`. |
| Campaign Source | `Campaign_Source` | `lookup` | No / no / no | Empty autocomplete input; `lyte-autocomplete` | Lookup referencing the `Campaigns` module. Features `Open Campaign Source` popup search icon button (`lookup_CAMPAIGNID`). |
| Contact Role | Not a Deal table column (relationship role) | `picklist` | No / no / no | Default value `None`; `lyte-dropdown` | Populated from `/crm/v9/Contacts/roles`. Associates the converted Contact with the new Deal under this role. |
| Owner of the New Records | `Owner` (source Lead) | `ownerlookup` | No / no / no | Prefilled with current Lead owner; readonly input | Input field has light-gray background `#F5F6F8`. Search icon button (`con_lookForOwners`) sits beside it to open the owner selector. |

## Actions

| Control | Type | Location | Observed behavior |
| --- | --- | --- | --- |
| Create a new Deal for this Account. | Checkbox toggle | Main form, below Contact row | Clicking toggles the checkbox and dynamically expands/collapses the Deal subform inline, shifting down the Owner input and Action buttons by ~334 px. |
| Open Campaign Source | Icon button | Inside Campaign Source input (right edge) | Triggers lookup dialog for selecting a Campaign. Trigger button inspected (`lookup_CAMPAIGNID`); opening dialog was not clicked. |
| Look for Owners (`con_lookForOwners`) | Icon button | Right of Owner input | Intended to open user selection dialog. Click was skipped by `capture.mjs` safety checks due to dangerous attribute containing `convert` (`crm-convert-lead => changeOwner()`). |
| Convert (`convert_deal_record`) | Primary button | Below Owner input | Submits the conversion request. Enabled visual state. Strictly read-only rule prohibits clicking; submission request shape and validation errors not observed. |
| Cancel | Secondary button | Right of Convert button | Cancels conversion. Enabled visual state. Not clicked; expected to navigate back to Lead detail. |
| Lead Conversion Mapping | Link | Right rail, under Quick Links | Navigates to `/crm/<org>/settings/modules/Leads/conversion-mapping`. Not clicked. |
| Help | Link | Right rail, under Quick Links | Opens contextual documentation. Not clicked. |

## Filters / views / sorting / search

Not applicable to the main page body: the conversion screen is a single-record transactional form without list views, filter panels, or column sorting.

Search capabilities are embedded within individual controls:
- **Campaign Source:** Autocomplete input supports text filtering, and the lookup icon opens a modal search picker.
- **Owner picker:** The person-search control opens an owner selection dialog that includes user search (unobserved due to skipped click).

## Flows

1. **Navigate to Convert screen:**
   - From an unconverted Lead detail page (`/crm/<org>/tab/Leads/<recordId>`), the user activates the header **Convert** action (or navigates directly to `/crm/<org>/tab/Leads/<recordId>/convert`).
   - The screen loads with the header showing `Convert Lead (<Lead Name> - <Company>)`.
   - The source Account (`<Company>`) and Contact (`<Lead Name>`) are displayed as non-editable chips.
   - The **Create a new Deal for this Account.** checkbox is unchecked.
   - The **Owner of the New Records** is prefilled with the current Lead owner.
   - The primary **Convert** and secondary **Cancel** buttons appear directly below the Owner field.
2. **Toggle optional Deal creation:**
   - User checks **Create a new Deal for this Account.**
   - The checkbox state changes to checked (blue `#5464F2` fill with white checkmark).
   - The Deal subform expands inline between the checkbox and the Owner control.
   - Background API requests fetch Deal stages, Contact roles, layout rules, and layout metadata.
   - Fields populate: **Deal Name** is prefilled with the source company name (`<Company>`); **Stage** defaults to `Qualification`; **Contact Role** defaults to `None`; **Amount**, **Closing Date**, and **Campaign Source** remain empty.
   - Owner and action buttons shift down to accommodate the expanded subform.
3. **Configure Deal details:**
   - User enters **Amount** (optional numeric currency value).
   - User edits or accepts **Deal Name** (required).
   - User enters or picks **Closing Date** (required in UI with placeholder `DD.MM.YYYY`).
   - User selects a **Stage** from the dropdown list.
   - User optionally searches and selects a **Campaign Source** via autocomplete or lookup dialog.
   - User optionally assigns a **Contact Role** from the dropdown list.
4. **Change record owner:**
   - User clicks the person-search icon (`con_lookForOwners`).
   - Dialog opens to search and select another active CRM user. *(Note: Opening the dialog was skipped by capture tool safety checks; structure is not observed).*
5. **Execute Conversion:**
   - User clicks **Convert**.
   - Client-side validation verifies required fields (**Deal Name**, **Closing Date**, **Stage** if Deal is enabled).
   - Backend conversion request is sent. *(Note: Not executed; server response, duplicate checking, and final redirect to newly created Contact/Account/Deal are not observed).*
6. **Cancel Conversion:**
   - User clicks **Cancel**.
   - Form is abandoned and user returns to the Lead record detail page. *(Note: Not clicked; destination unobserved).*

## Data needs

Request and response **shapes** observed across `board-lead-convert-probe` (initial load) and `leads-convert-deal` (Deal subform load). Paths use neutral formatting; IDs, values, tokens, and account keys are omitted.

| Method | Neutral endpoint | Query parameter names | Observed response field names and role |
| --- | --- | --- | --- |
| GET | `/crm/v2.2/Leads/<recordId>` | None | `data[]`: `Owner`, `Company`, `Full_Name`, `First_Name`, `Last_Name`, `$converted`, `$converted_detail`, `$layout_id`. Source record details. |
| GET | `/crm/v5/Leads/<recordId>/__conversion_options` | `include_inner_details` | Returns HTTP 204 with empty body for the observed record. Conversion option parameters. |
| GET | `/crm/v2.1/Accounts/actions/permit_threshold` | `owner_id` | `permit_threshold.allow`, `permit_threshold.reason`, `permit_threshold.remaining_allow_count`. Account creation threshold check. |
| GET | `/crm/v2.1/Contacts/actions/permit_threshold` | `owner_id` | `permit_threshold.allow`, `permit_threshold.reason`, `permit_threshold.remaining_allow_count`. Contact creation threshold check. |
| GET | `/crm/v2.1/settings/layouts` | `module=Leads` | `layouts[]`: includes `convert_mapping.Contacts`, `.Accounts`, and `.Deals` (with Deal target fields `Amount`, `Deal_Name`, `Closing_Date`, `Stage`). |
| GET | `/crm/<org>/ModuleCache.do` | `module=Leads`, `getField` | Module field schema and layout mapping cache. |
| GET | `/crm/v2.1/settings/stages` | `module=Deals` | Loaded when Deal box is checked. `stages[]`: `display_label`, `probability`, `name`, `forecast_category` (`name`, `id`), `id`, `forecast_type`. Populates Stage dropdown. |
| GET | `/crm/v9/Contacts/roles` | None | Loaded when Deal box is checked. `contact_roles[]`: `sequence_number`, `name`, `id`. Populates Contact Role dropdown. |
| GET | `/crm/v2.2/settings/layouts/<layoutId>` | `module=Deals`, `mode=all` | Loaded when Deal box is checked. Deals layout fields and sections. |
| GET | `/crm/v2.2/settings/modules/Deals` | `include` (module properties) | Loaded when Deal box is checked. Deal module configuration and capabilities. |
| GET | `/crm/<org>/ModuleCache.do` | `module=Potentials`, `getField` | Loaded when Deal box is checked. Deals module cache. |
| GET | `/crm/<org>/ModuleCache.do` | `module=Campaigns`, `getField` | Loaded when Deal box is checked. Campaigns module cache for lookup. |
| GET | `/crm/v9/Campaigns/status` | `module=Campaigns` | Loaded when Deal box is checked. Campaign status configuration. |
| GET | `/crm/v9/settings/layout_rules` | `module=Deals`, `layout_id`, `include`, `ispagecall` | Loaded when Deal box is checked. Evaluates conditional layout rules on Deals. |
| POST | `/crm/v2/Leads/<recordId>/actions/convert` *(inferred)* | Unknown | Conversion submit request. **Not observed** (read-only constraint). |

## Capture refs

- `board-lead-convert-probe`: Board probe capture of opening conversion page (`clicks: []`, `skippedClicks: []`, `blockedRequests: []`). Provides opening page layout, headers, Account/Contact chips, unchecked checkbox, and initial load network requests.
- `leads-convert-deal`: Capture of Deal checkbox checked state (`clicks: ["[data-zcqa=\"con_newDeal\"]"]`, `skippedClicks: []`, `blockedRequests: [ActivityReminder.do, crminotification.do]`). Provides full expanded Deal subform fields, labels, red required indicators, default values, and Deal-specific network requests.
- `leads-convert-owner`: Capture attempt for owner lookup picker (`clicks: ["[data-zcqa=\"con_lookForOwners\"]"]`, `skippedClicks: [{"selector": "[data-zcqa=\"con_lookForOwners\"]", "reason": "dangerous attribute: con_lookForOwners crm-convert-lead => changeOwner()"}]`, `blockedRequests: [ActivityReminder.do, crminotification.do]`). Click was skipped by capture tool safety policy; owner picker remains open.

## Open questions

1. **Owner picker structure:** The person-search button (`[data-zcqa="con_lookForOwners"]`) could not be clicked because `capture.mjs` safety checks identified `convert` in its attribute (`crm-convert-lead => changeOwner()`) and skipped the click. The owner picker dialog layout, user search behavior, role/group hierarchy, and network endpoint remain unobserved.
2. **Existing Account / Contact matching:** The observed lead presented only "Create New Account" and "Create New Contact". If an Account with the same company name or a Contact with the same email already exists in the system, does the screen offer radio options or a search selector to associate with an existing record instead of creating new ones?
3. **Closing Date requirement discrepancy:** In metadata (`convert_mapping` in `layouts.json` and `fields.json` for Deals), `Closing_Date` is marked `required: false` (not system mandatory). However, on the conversion screen UI, `Closing Date` displays the exact same 3 px red left-border mandatory indicator (`#FF5D5A`) as `Deal Name` and `Stage`. Is Closing Date enforced as mandatory during lead conversion despite metadata declaring it optional?
4. **Deal Name label naming:** In `layouts.json` `convert_mapping`, the field is labeled `Potential Name` (legacy reference CRM terminology), while Deal field metadata calls it `Deal Name`. The screen renders `Deal Name` in the UI label.
5. **Conversion submission contract:** What endpoint and payload shape does the `Convert` button send (e.g. `POST /crm/v2/Leads/<recordId>/actions/convert`), and what is the response payload shape on success or error? What redirection happens after successful conversion? (Requires a write; unobservable under the read-only rule).
6. **`__conversion_options` response:** Why did `GET /crm/v5/Leads/<recordId>/__conversion_options` return HTTP 204 with an empty body on page load? Under what conditions does it return options (e.g. duplicate accounts/contacts or custom mapping rules)?
7. **Mass Convert:** How does Mass Convert (triggered from the Leads list view Actions menu) differ in layout, flows, and options from single Lead conversion?
8. **Cancel button navigation:** Does clicking Cancel navigate back using browser history (`history.back()`) or via explicit routing to the source Lead URL?
