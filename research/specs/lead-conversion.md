# Lead conversion screen

Status: Complete read-only research. The opening page and expanded Deal subform are captured (`board-lead-convert-probe`, `leads-convert-deal`). The owner picker popup state was skipped by the capture tool's click guard. Write-only states (submit validation, conversion completion, duplicate matching) remain unobservable without writes and are listed under Open questions. This screen belongs to the later Contacts, Accounts, and Deals work, outside Module 1.

## Purpose

An unconverted Lead can be prepared for conversion into a new Account and Contact, with an optional new Deal. The dedicated route is `/crm/<org>/tab/Leads/<recordId>/convert`. Actual conversion execution was not performed, adhering strictly to the read-only rule. See `research/specs/leads.md` for the Lead entry point and Module 1 scope, `research/specs/record-detail.md` for the source record page, and `research/specs/leads-fields-and-layout.md` for Lead fields and conversion mapping.

## Layout

The screen retains the shared reference CRM app shell with the Leads rail item selected. The page content consists of:

1. **Heading bar:** Full-width header displaying **Convert Lead** followed by the source lead's identity in muted gray text: `(<Lead Name> - <Company>)`. This renders directly in the main page flow, not within a modal dialog.
2. **Main content area (left column, ~845 px wide):**
   - **Account creation row:** Displays the label **Create New Account** followed by a non-editable pill/chip containing the source company name (`<Company>`).
   - **Contact creation row:** Displays the label **Create New Contact** followed by a non-editable pill/chip containing the source lead's full name (`<Lead Name>`).
   - **Optional Deal toggle:** A checkbox labeled **Create a new Deal for this Account.** When unchecked (default on page load), no Deal fields are displayed. When checked, the Deal subform expands inline directly below the checkbox and focus automatically moves to the Amount field.
   - **Deal subform region (expanded when Deal checkbox is checked):** An inline form region spanning 600 px wide and ~250 px high (x 350–950, y 269–519). Contains five field rows in vertical succession:
     1. **Amount:** Currency input with currency prefix badge (`TL`), 1 px focus border, outer focus halo, and a right-edge information icon cell.
     2. **Deal Name:** Single-line text input with a 3 px red required left-border indicator (`#FF5D5A`), prefilled with the source company name (`<Company>`).
     3. **Closing Date:** Date input with placeholder `DD.MM.YYYY` and a 3 px red required left-border indicator (`#FF5D5A`).
     4. **Stage:** Picklist dropdown selector with a 3 px red required left-border indicator (`#FF5D5A`), defaulting to `Qualification`.
     5. **Campaign Source:** Autocomplete input with a lookup search trigger button housed inside a right-edge cell.
   - **Contact Role row:** Positioned directly below the 600 × 250 px Deal subform region as a separate field row. Dropdown selector defaulting to `None`.
   - **Owner section:** Labeled **Owner of the New Records**, containing a light-gray readonly input prefilled with the current Lead owner's name (`<owner>`), flanked on the right by a person-search icon button. Pushed down from y 295–329 in the opening unchecked state to y 647–681 when the Deal subform is expanded (a shift of 352 px).
   - **Action buttons:** Positioned below the Owner control:
     - Primary **Convert** button (solid blue gradient, white text).
     - Secondary **Cancel** button (light gray border and background, dark text).
     Pushed down from y 389–421 in the opening state to y 723–755 when the Deal subform is expanded (a shift of 334 px). The vertical gap between the Owner input bottom and the buttons top decreases from 60 px in the opening state to 42 px in the Deal-checked state.
3. **Right rail column (~300 px wide):**
   - Heading: **Quick Links**
   - Item: **Lead Conversion Mapping** (link to `/crm/<org>/settings/modules/Leads/conversion-mapping`).
   - Item: **Help** (rendered as an icon and text control in `#616E88` ink, not a link element).

### Visual layout

All coordinates and colours below are **measured from screenshot** `board-lead-convert-probe` (opening state) and `leads-convert-deal` (expanded Deal state) using pixel sampling at two image pixels per CSS pixel (viewport 1470 × 835 CSS pixels). Bounds describe visible pixels, not computed CSS boxes, except where a row names `controls.json` as its source. Font sizes and weights are visual estimates from measured ink height.

| Region or control | Measurement and visible state |
| --- | --- |
| Heading band | White `#FFFFFF` surface starts at x 320 to right viewport edge; top edge y 50, bottom divider y 102 in `#EDF0F4`. **Convert Lead** dark ink `#202123` spans x 352–476.5, y 69.5–84.5; visible ink is 15 px high (~20 px bold). Muted record identity `#8B9AB9` ink spans x 483–843.5, y 71.5–85 (~15 px semibold). Left inset is 32 px from the page content edge. |
| Main area and right rail | Main surface is `#FFFFFF`, beginning at x 320 below y 103 and spanning to x 1163.5 (~845 px wide). Right rail starts at x 1170 to right viewport edge (~300 px wide). Divider at x 1169–1170 is 1 px `#EDF0F4`, preceded on the left by a soft shadow gradient across x 1163.5–1169. Rail heading and items start at x 1185 (15 px inset). **Lead Conversion Mapping** link ink is `#5464F2` across x 1186.5–1354, y 138–151. **Help** control sits at x 1185, y 170–195, rendered with `#616E88` ink (not link blue) as an icon followed by text (not an anchor link element). |
| Account and Contact rows | Row labels start at x 350. Account label `#313949` ink spans x 351–483.5, y 139–149; Contact label `#313949` ink spans x 351–480.5, y 171–181. Baselines are ~32 px apart. Each value is a gray `#C5C4D3` chip, 22 px high, with about 3 px corner radius and dark `#313949` text. The chip follows its label inline: its left edge is 8.5 px after the label text end (x 492 in the Account row, x 489 in the Contact row). Its width follows the value text with about 8 px of padding on each side (text ink starts 8–8.5 px inside the left edge and ends 7–7.5 px before the right edge), so the right edge is not a fixed coordinate. Account chip y 133–155; Contact chip y 165–187. Source values are omitted. |
| Deal checkbox (unchecked state) | Unchecked box border is 2 px `#C5C4D3` at x 350–365, y 229–244 (15 × 15 px square, 2 px border-radius, `#FFFFFF` interior). Label starts at x 371 with `#313949` ink. |
| Deal checkbox (checked state) | Checked box border and fill is `#5464F2` at x 350–365, y 229–244 (15 × 15 px square, identical position to unchecked state). Interior features a crisp white `#FFFFFF` checkmark. Label text `#313949` begins at x 371 with 6 px gap from the checkbox. |
| Deal subform container | Expands inline at x 350–950, y 269–519 (600 × 250 px). This is the region's box from `controls.json`, not a visible edge: the region has no border and no fill of its own on the `#FFFFFF` page surface. Field labels are right-aligned within x 350–468.5 (label text ends at x 468.5) in `#616E88` ink (~13 px regular). Input controls start at x 505. |
| Deal: Amount field | Label text ends at x 468.5; label ink rows y 281.5–291.5. Input outer box spans x 505–895, y 269–303 (390 × 34 px). Field displays in focused state upon expanding: 1 px focus border in `#5464F2` surrounded by a soft focus halo spreading ~8 px fading from `#D6DAFE` to `#FFFFFF`. (Unfocused border state not observed). Left currency prefix badge spans x 505–540.5 with `#FFFFFF` background and `TL` text in `#616E88` ink, followed by a 1 px `#C5C4D3` vertical divider at x 540.5–541.5. Text input field spans x 541.5–862 with `#FFFFFF` background. Right info cell spans x 862–894, y 270–302 with `#F0F4FF` fill containing an information icon. No red required indicator. |
| Deal: Deal Name field | Label text ends at x 468.5; label ink rows y 334.5–345.5. Input outer box spans x 505–895, y 323–357 (390 × 34 px). Outer border is 1 px `#C5C4D3`. Left edge has a solid 3 px red mandatory indicator strip in `#FF5D5A` from x 505 to 508, y 323–357. Background is `#FFFFFF`. Prefilled value text is `#313949` (~14 px regular). |
| Deal: Closing Date field | Label text ends at x 468.5; label ink rows y 388.5–402. Input outer box spans x 505–895, y 377–411 (390 × 34 px). Outer border is 1 px `#C5C4D3`. Left edge has a solid 3 px red mandatory indicator strip in `#FF5D5A` from x 505 to 508, y 377–411. Placeholder `DD.MM.YYYY` appears in muted ink `#8C91AB`. |
| Deal: Stage dropdown | Label text ends at x 468.5; label ink rows y 443.5–456. Dropdown button outer box spans x 505–895, y 431–465 (390 × 34 px). Outer border is 1 px `#C5C4D3`. Left edge has a solid 3 px red mandatory indicator strip in `#FF5D5A` from x 505 to 508, y 431–465. Default selected value `Qualification` appears in `#313949` text. Dropdown arrow icon sits at the right edge (~x 875). |
| Deal: Campaign Source field | Label text ends at x 468.5; label ink rows y 497.5–510. Autocomplete input outer box spans x 505–895, y 485–519 (390 × 34 px). Outer border is 1 px `#C5C4D3`. Right search cell spans x 862–894, y 486–518 with `#F0F4FF` fill, containing the lookup trigger icon. Background is `#FFFFFF`. No red required indicator. |
| Deal: Contact Role field | Located outside the 600 × 250 px subform region. Label text ends at x 484.5 in `#616E88` ink; label ink rows y 548–559. Dropdown outer box spans x 506–896, y 537–571 (390 × 34 px). Border is 1 px `#C5C4D3`. Default value `None` appears in `#313949` text. No red required indicator. |
| Owner field (opening state) | Label ink `#313949` spans x 351–522.5, y 276.5–287. Input border `#D2D9F1` at x 350–530, y 295–329 (180 × 34 px). Interior fill `#F5F6F8`. Existing owner name in `#313949`. Person-search icon ink (`#000000` with grey anti-aliasing) spans x 538.5–553, y 304.5–319.5 (about 15 × 15 px), starting about 9 px after the input's right edge. |
| Owner field (Deal checked state) | Label ink `#313949` spans x 351–522.5, y 628.5–639 (shifted down 352 px). Input border `#D2D9F1` at x 350–530, y 647–681 (180 × 34 px, shifted down 352 px). Interior fill `#F5F6F8`. Existing owner name in `#313949`. Person-search icon ink spans x 538.5–553, y 656.5–671.5 (same x as in the opening state). |
| Actions (opening state) | Positioned below Owner at y 389–421 (60 px gap below Owner input). Primary **Convert** button spans x 350–431, y 389–421 (81 × 32 px) with vertical gradient from `#5767F6` (top) through `#345ADC` (middle) to `#134EC4` (bottom) and white `#FFFFFF` text. Secondary **Cancel** button spans x 442–517, y 389–421 (75 × 32 px) with 1 px `#D5D8E9` border, vertical gradient from `#FFFFFF` through `#F8F7FB` to `#F1F0F7` (identical to the secondary button in `research/specs/record-detail.md`), and dark `#313949` text. |
| Actions (Deal checked state) | Positioned below Owner at y 723–755 (42 px gap below Owner input; shifted down 334 px). Primary **Convert** button spans x 350–431, y 723–755 (81 × 32 px) with vertical gradient from `#5767F6` (top) through `#345ADC` (middle) to `#134EC4` (bottom) and white `#FFFFFF` text. Secondary **Cancel** button spans x 442–517, y 723–755 (75 × 32 px) with 1 px `#D5D8E9` border, vertical gradient from `#FFFFFF` through `#F8F7FB` to `#F1F0F7`, and dark `#313949` text. Button dimensions and styling are identical in both states. |

The shared shell's geometry, typography, and icon treatment are specified in `research/specs/app-shell.md`. No source logo, image, icon, or font asset belongs in the implementation.

## Fields

The table details all visible fields and controls on the conversion screen, cross-referenced with `~/Desktop/mepcity-research/metadata/` (`convert_mapping` in `modules/Leads/layouts.json`, Standard layout in `modules/Deals/layouts.json`, and field definitions in `modules/Deals/fields.json`).

| Visible label | API name | Data type | Required / unique / read-only | Observed initial state & control | Notes |
| --- | --- | --- | --- | --- | --- |
| Create New Account | `Company` (source Lead) | `text` | Lead layout required / no / no | Non-editable chip with source `<Company>` value | Displays source Lead company. Whether an existing Account can be selected is unobserved for this record. |
| Create New Contact | `Full_Name` (source Lead) | `text` | Lead metadata no / no / no | Non-editable chip with source `<Lead Name>` value | Displays source Lead contact identity. First and last name breakdown not displayed. |
| Create a new Deal for this Account. | Not applicable (UI toggle) | `checkbox` | No / no / no | Unchecked on initial load; checkbox toggle | Controls visibility of the Deal subform below. |
| Amount | `Amount` | `currency` | Layout-level optional (quick sequence 1) / no / no | Empty currency input with prefix `TL`, 1 px focus border `#5464F2` with halo, and right info cell | Optional deal value. Quick create sequence number 1 in Standard Deals layout. Input max length 16. |
| Deal Name | `Deal_Name` | `text` | **Yes** (layout required, system mandatory, quick sequence 2) / no / no | Prefilled with `<Company>`; text input with 3 px red left-border indicator (`#FF5D5A`) | System mandatory. Quick create sequence number 2 in Standard Deals layout. `convert_mapping` labels it `Potential Name`, but the UI renders `Deal Name`. Max length 120. |
| Closing Date | `Closing_Date` | `date` | **Yes in layout** (`required: true` in layout, `system_mandatory: false`, quick sequence 3) / no / no | Empty date input with placeholder `DD.MM.YYYY` and 3 px red left-border indicator (`#FF5D5A`) | Standard Deals layout specifies `required: true` at layout level (`system_mandatory: false`). `convert_mapping.Deals` follows the Standard Deals layout and enforces it with the 3 px red indicator. Quick create sequence number 3. |
| Stage | `Stage` | `picklist` | **Yes** (layout required, system mandatory, quick sequence 5) / no / no | Default value `Qualification`; dropdown selector with 3 px red left-border indicator (`#FF5D5A`) | System mandatory. Quick create sequence number 5 in Standard Deals layout. (Quick sequence number 4 in the Standard Deals layout is `Account_Name` and number 6 is `Expected_Revenue`; neither is rendered in the subform. The four rendered Deal fields are exactly the entries of `convert_mapping.Deals.fields`, in that list's own order.) Populated from `/crm/v2.1/settings/stages?module=Deals`. |
| Campaign Source | `Campaign_Source` | `lookup` | No (`quick_create: false` in metadata) / no / no | Empty autocomplete input with right search trigger button in `#F0F4FF` cell | Lookup referencing the `Campaigns` module. In Deals layout metadata, `view_type.quick_create` is `false`, yet it is rendered in this conversion Deal form. |
| Contact Role | Not a Deal table column (relationship role) | `picklist` | No / no / no | Default value `None`; dropdown selector positioned below the 600 × 250 px subform region | Populated from `/crm/v9/Contacts/roles`. Where the selected role is saved is not observed. |
| Owner of the New Records | `Owner` (source Lead) | `ownerlookup` | No / no / no | Prefilled with current Lead owner; readonly input | Input field has light-gray background `#F5F6F8`. Person-search icon button sits beside it to open the owner selector. |

## Actions

| Control | Type | Location | Observed behavior |
| --- | --- | --- | --- |
| Create a new Deal for this Account. | Checkbox toggle | Main form, below Contact row | Clicking toggles the checkbox and dynamically expands/collapses the Deal subform inline. Moves focus to Amount. Shifts Owner input down by 352 px and Action buttons down by 334 px (gap shrinks from 60 px to 42 px). |
| Campaign Source search trigger | Icon button | Inside Campaign Source input (right cell) | Not clicked; what it opens is not observed. |
| Person-search button | Icon button | Right of Owner input | Click was skipped by the capture tool's click guard; what it opens is not observed. |
| Convert | Primary button | Below Owner input | Enabled visual state. Never clicked (read-only rule); the submission endpoint, request shape, and validation errors are not observed. |
| Cancel | Secondary button | Right of Convert button | Enabled visual state. Not clicked; navigation destination not observed. |
| Lead Conversion Mapping | Link | Right rail, under Quick Links | Navigates to `/crm/<org>/settings/modules/Leads/conversion-mapping`. Not clicked. |
| Help | Control | Right rail, under Quick Links | Contextual help item (rendered as icon and text, not a link element; ink `#616E88`). Not clicked. |

## Filters / views / sorting / search

Not applicable to the main page body: the conversion screen is a single-record transactional form without list views, filter panels, or column sorting.

Search capabilities are embedded within individual controls:
- **Campaign Source:** Autocomplete input and lookup search icon button. Exact text filtering and picker behavior are not observed.
- **Owner picker:** The person-search click was skipped by the capture tool's click guard; what it opens is not observed.

## Flows

1. **Navigate to Convert screen:**
   - The page was opened by navigating directly to `/crm/<org>/tab/Leads/<recordId>/convert`. The header **Convert** action on the Lead detail page (`/crm/<org>/tab/Leads/<recordId>`) was not clicked, so the transition from it is not observed.
   - The screen loads with the header showing `Convert Lead (<Lead Name> - <Company>)`.
   - The source Account (`<Company>`) and Contact (`<Lead Name>`) are displayed as non-editable chips.
   - The **Create a new Deal for this Account.** checkbox is unchecked.
   - The **Owner of the New Records** is prefilled with the current Lead owner.
   - The primary **Convert** and secondary **Cancel** buttons appear below the Owner field.
2. **Toggle optional Deal creation:**
   - User checks **Create a new Deal for this Account.**
   - The checkbox state changes to checked (blue `#5464F2` fill with white checkmark).
   - The Deal subform expands inline between the checkbox and the Owner control.
   - Focus automatically shifts to the **Amount** input field.
   - Background API requests fetch Deal stages, Contact roles, layout rules, and layout metadata.
   - Fields populate: **Deal Name** is prefilled with the source company name (`<Company>`); **Stage** defaults to `Qualification`; **Contact Role** defaults to `None`; **Amount**, **Closing Date**, and **Campaign Source** remain empty.
   - Owner field shifts down 352 px and action buttons shift down 334 px (reducing the gap between them from 60 px to 42 px).
3. **Configure Deal details (not observed; no field was edited or opened):**
   - User enters **Amount** (optional numeric currency value).
   - User edits or accepts **Deal Name** (required).
   - User enters or picks **Closing Date** (required with placeholder `DD.MM.YYYY`).
   - User selects a **Stage** from the dropdown list.
   - User optionally selects **Campaign Source** via autocomplete or lookup button (search behavior not observed).
   - User optionally assigns a **Contact Role** from the dropdown list.
4. **Change record owner:**
   - User clicks the person-search icon button.
   - Dialog opening was skipped by the capture tool's click guard; owner selection flow is not observed.
5. **Execute Conversion:**
   - User clicks **Convert**.
   - Form submission, client-side validation, server request endpoint, response handling, and post-conversion redirection are not observed under the read-only rule.
6. **Cancel Conversion:**
   - User clicks **Cancel**.
   - Navigation destination and state cleanup are not observed.

## Data needs

Request and response **shapes** observed across `board-lead-convert-probe` (initial load) and `leads-convert-deal` (Deal subform load). Paths use neutral formatting; IDs, values, tokens, and account keys are omitted.

| Method | Neutral endpoint | Query parameter names | Observed response field names and role |
| --- | --- | --- | --- |
| GET | `/crm/v2.2/Leads/<recordId>` | None | `data[]`: `Owner`, `Company`, `Full_Name`, `First_Name`, `Last_Name`, `$converted`, `$converted_detail`, `$layout_id`. Source record details. |
| GET | `/crm/v5/Leads/<recordId>/__conversion_options` | `include_inner_details` | Returns HTTP 204 with empty body for the observed record. Conversion option parameters. |
| GET | `/crm/v2.1/Accounts/actions/permit_threshold` | `owner_id` | `permit_threshold.allow`, `permit_threshold.reason`, `permit_threshold.remaining_allow_count`. Account creation threshold check. |
| GET | `/crm/v2.1/Contacts/actions/permit_threshold` | `owner_id` | `permit_threshold.allow`, `permit_threshold.reason`, `permit_threshold.remaining_allow_count`. Contact creation threshold check. |
| GET | `/crm/v2.1/settings/layouts` | `module=Leads` | `layouts[]`: includes `convert_mapping.Contacts`, `.Accounts`, and `.Deals` (with Deal target fields `Amount`, `Deal_Name`, `Closing_Date`, `Stage`). |
| GET | `/crm/v2.2/settings/modules/<Leads\|Accounts\|Contacts>` | `include` | `modules[]`. Module definition; key names are in `research/specs/request-shapes.md`. |
| POST | `/crm/v2.2/Leads/bulk` | `relatedId`, `relationId` | Returns HTTP 204 with empty body. Purpose not established. |
| GET | `/crm/<org>/ModuleCache.do` | `module=<Leads\|Accounts\|Contacts\|Campaigns>`, `getField` | `id`, `fields`. Called twice for `Leads`. |
| GET | `/crm/v9/Campaigns/status` | `module=Campaigns` | Initial page load. `campaign_status[]`: `sequence_number`, `name`, `id`. |
| GET | `/crm/v2.1/settings/stages` | `module=Deals` | Loaded when Deal box is checked. `stages[]`: `display_label`, `probability`, `name`, `forecast_category` (`name`, `id`), `id`, `forecast_type`. Populates Stage dropdown. |
| GET | `/crm/v9/Contacts/roles` | None | Loaded when Deal box is checked. `contact_roles[]`: `sequence_number`, `name`, `id`. Populates Contact Role dropdown. |
| GET | `/crm/v2.2/settings/layouts/<layoutId>` | `module=Deals`, `mode=all` | Loaded when Deal box is checked. `layouts[]`. |
| GET | `/crm/v2.2/settings/modules/Deals` | `include` | Loaded when Deal box is checked. `modules[]`. |
| GET | `/crm/v2.2/settings/modules` | `feature_name` | Loaded when Deal box is checked. `modules[]`. |
| GET | `/crm/v2.2/settings/automation/owner_suggestion_configuration` | `module=Deals` | Loaded when Deal box is checked. `owner_suggestion_configuration[]`: `module.api_name`, `module.id`, `enabled_for_current_user`, `enabled`, `shared_to`. |
| GET | `/crm/<org>/ModuleCache.do` | `module=Potentials`, `getField` | Loaded when Deal box is checked. `id`, `fields`. |
| GET | `/crm/v9/settings/layout_rules` | `module=Deals`, `layout_id`, `include=conditions`, `ispagecall` | Loaded when Deal box is checked. `layout_rules[]`: `name`, `description`, `active`, `source`, `primary_field`, `layout`, `conditions`, `generated_type`, `id`, `created_time`, `created_by`, `modified_time`, `modified_by`. |
| Not observed | Unobserved submission endpoint | Unobserved | Conversion submit request. **Not observed** (read-only constraint). |

## Capture refs

- `board-lead-convert-probe`: Board probe capture of opening conversion page (`clicks: []`, `skippedClicks: []`, `blockedRequests: []`). Provides opening page layout, headers, Account/Contact chips, unchecked checkbox, and initial load network requests.
- `leads-convert-deal`: Capture of Deal checkbox checked state (Deal checkbox clicked; `skippedClicks: []`, `blockedRequests`: the app's own background polls, blocked by the tool). Provides expanded Deal subform fields, labels, red required indicators, default values, and Deal-specific network requests.
- `leads-convert-owner`: Capture attempt for the owner picker. The person-search click was requested and skipped by the capture tool's click guard, so the screenshot shows the opening state (`blockedRequests`: the app's own background polls, blocked by the tool).

## Open questions

1. **Owner picker structure:** The person-search button was skipped by the capture tool's click guard. The owner picker dialog layout, user search behavior, role/group hierarchy, and network endpoint remain unobserved.
2. **Existing Account / Contact matching:** The observed lead presented only "Create New Account" and "Create New Contact". If an Account with the same company name or a Contact with the same email already exists in the system, does the screen offer radio options or a search selector to associate with an existing record instead of creating new ones?
3. **`Campaign_Source` layout discrepancy:** In Deals layout metadata (`layouts.json`), `Campaign_Source` has `view_type.quick_create: false` and no `quick_sequence_number`, yet it appears on the conversion Deal subform. Is `Campaign_Source` hardcoded on the conversion screen, or driven by another layout/conversion setting?
4. **Conversion submission contract:** What endpoint and payload shape does the Convert button send, and what is the response payload shape on success or error? What redirection happens after successful conversion? (Requires a write; unobservable under the read-only rule).
5. **`__conversion_options` response:** Why did `GET /crm/v5/Leads/<recordId>/__conversion_options` return HTTP 204 with an empty body on page load? Under what conditions does it return options (e.g. duplicate accounts/contacts or custom mapping rules)?
6. **Mass Convert:** How does Mass Convert (triggered from the Leads list view Actions menu) differ in layout, flows, and options from single Lead conversion?
7. **Cancel button navigation:** Does clicking Cancel navigate back using browser history (`history.back()`) or via explicit routing to the source Lead URL?
