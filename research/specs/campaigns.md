# Campaigns

## Create / edit form

### Purpose and evidence boundary

Inventory the open Campaigns create form without entering data, selecting an option, saving, cancelling or changing a preference. This section is the MEP-759 research slice; list and detail research are separate slices. Metadata describes configuration, never proof of a rendered control. No customer or user values are reproduced.

The list is empty. The CTO's MEP-803 empty-list gate decision applies: the earlier `m7-list-base` / `m7-list-base-retry` established the repeated empty state; `m7f-list-base` confirms the same state and total of zero. Edit cannot be opened without an existing record. No record was created and no record route was invented. All edit-specific fields, defaults, controls and differences remain **not observed**.

### Layout and field order

`m7f-create` shows a full-page Create Campaign form inside the shared shell. The fixed header has Edit Page Layout and, left to right in its right group, Cancel, Save and New, Save. Campaign Information uses two columns:

| Row | Left | Right |
| --- | --- | --- |
| 1 | Campaign Owner, selector and user lookup | Type |
| 2 | Campaign Name | Status |
| 3 | Start Date | End Date |
| 4 | Expected Revenue, TL prefix, information icon | Budgeted Cost, TL prefix, information icon |
| 5 | Actual Cost, TL prefix, information icon | Expected Response |
| 6 | Numbers sent | No field |

Description Information follows, with a single multiline Description input and lower-right resize grip. The bottom form area has the static Create Form Views label, Standard View selector and Create a custom form page button. There is no second Save/Cancel group at the bottom. Client Script is fixed on the right edge and overlaps part of Expected Response. The shell utility strip remains below the form.

Campaign Name and Type have required input-edge markers. Owner is prefilled and automatically focused on load; its value is omitted. Type and Status initially show `-None-`. The dates show `DD.MM.YYYY`, with no separate visible calendar icon; other editable fields are empty. All three currency fields have a TL prefix and an information icon; no information popup was opened. Parent Campaign is absent from the rendered form, including its lookup button. No attempt was made to reveal hidden fields through layout or form-view settings.

### Control inventory — m7f-create

Shell: SH-01–SH-46 in [contacts.md](contacts.md), with Campaigns SH-18 active. MCP is the shorter visible label for SH-08. Channels/Threads are absent. The rail Products entry is below the viewport; Price Books is partially visible. The utility right group preserves SH-38–SH-46; SH-46 is image-only. No new visible shell control was found. The rail boundary handle in the source is structural; no separate painted grip is visible.

Stable CF numbers persist across captures. Select arrows belong to their select. Required markers are field states. `same` retains the cited control's interaction limits. Source ordinals below are one-based `controls.json` entries; they are evidence references, never click selectors.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CF-01 | Header | Edit Page Layout | link | after title | same; not opened | seen (m7f-create) | M11 | AF-01, accounts-form.md |
| CF-02 | Header | Cancel | button | right group, first | same; not operated | seen (m7f-create) | M7 | AF-02, accounts-form.md |
| CF-03 | Header | Save and New | button | right group, second | same; not operated | seen (m7f-create) | M7 | AF-03, accounts-form.md |
| CF-04 | Header | Save | button | right group, third | same; not operated | seen (m7f-create) | M7 | AF-04, accounts-form.md |
| CF-05 | Campaign Information | Campaign Owner | select | left row 1 | same; prefilled, automatic focus | seen (m7f-create) | M7 | AF-06, accounts-form.md |
| CF-06 | Campaign Information | User lookup icon | icon button | owner input, right edge | same; not opened | seen (m7f-create) | M7 | AF-07, accounts-form.md |
| CF-07 | Campaign Information | Campaign Name | input | left row 2 | same; required marker | seen (m7f-create) | M7 | AF-08, accounts-form.md |
| CF-08 | Campaign Information | Start Date | input | left row 3 | not observed; placeholder visible | seen (m7f-create) | M7 | new |
| CF-09 | Campaign Information | Expected Revenue | input | left row 4 | not observed; editable blank currency input | seen (m7f-create) | M7 | new |
| CF-09.1 | Campaign Information | TL | badge | Expected Revenue prefix | currency prefix; no action | seen (m7f-create) | M7 | DF-16 moved, deals-form.md |
| CF-10 | Campaign Information | Information icon | icon button | Expected Revenue, right edge | same; not opened | seen (m7f-create) | M7 | AF-16 moved, accounts-form.md |
| CF-11 | Campaign Information | Actual Cost | input | left row 5 | not observed | seen (m7f-create) | M7 | new |
| CF-11.1 | Campaign Information | TL | badge | Actual Cost prefix | currency prefix; no action | seen (m7f-create) | M7 | DF-16 moved, deals-form.md |
| CF-12 | Campaign Information | Information icon | icon button | Actual Cost, right edge | same; not opened | seen (m7f-create) | M7 | AF-16 moved, accounts-form.md |
| CF-13 | Campaign Information | Numbers sent | input | left row 6 | not observed | seen (m7f-create) | M7 | new |
| CF-14 | Campaign Information | Type | select | right row 1 | opens Type list; no selection | seen (m7f-create) | M7 | new |
| CF-15 | Campaign Information | Status | select | right row 2 | opens Status list; no selection | seen (m7f-create) | M7 | new |
| CF-16 | Campaign Information | End Date | input | right row 3 | not observed; placeholder visible | seen (m7f-create) | M7 | new |
| CF-17 | Campaign Information | Budgeted Cost | input | right row 4 | not observed | seen (m7f-create) | M7 | new |
| CF-17.1 | Campaign Information | TL | badge | Budgeted Cost prefix | currency prefix; no action | seen (m7f-create) | M7 | DF-16 moved, deals-form.md |
| CF-18 | Campaign Information | Information icon | icon button | Budgeted Cost, right edge | same; not opened | seen (m7f-create) | M7 | AF-16 moved, accounts-form.md |
| CF-19 | Campaign Information | Expected Response | input | right row 5 | not observed; partly covered by Client Script | seen (m7f-create) | M7 | new |
| CF-20 | Description Information | Description | input | only multiline editor | same | seen (m7f-create) | M7 | AF-44, accounts-form.md |
| CF-21 | Description Information | Resize grip | icon button | editor lower-right | not observed | seen (m7f-create) | M7 | DF-29, deals-form.md |
| CF-22 | Form footer | Standard View | select | after Create Form Views label | not observed; Accounts source-only reference | seen (m7f-create) | M11 | AF-45, accounts-form.md |
| CF-23 | Form footer | Create a custom form page | button | footer, right | not observed; Accounts source-only reference | seen (m7f-create) | M11 | AF-46, accounts-form.md |
| CF-24 | Right edge | Client Script | tab | page right edge | same; not opened | seen (m7f-create) | M11 | AF-47, accounts-form.md |

Absent here: account image AF-05, Parent Account input/lookup AF-10–AF-11, account-specific fields AF-09/AF-12–AF-24 and address controls AF-25–AF-43. Campaigns instead has the CF fields above. The configured Parent Campaign lookup does not establish a visible equivalent of AF-11.

### Form fields vs metadata

Configuration sources: `metadata/modules/Campaigns/fields.json` and `layouts.json` in the local research workspace. The exported layout contains Campaign Information and Description Information. Type is layout-required but not system-mandatory; Campaign Name is both layout-required and system-mandatory. Both required markers are observed, so these two sources agree with the rendering.

| Field API key | Metadata type | Rendered control | Evidence |
| --- | --- | --- | --- |
| Owner | ownerlookup | CF-05, CF-06 | prefilled selector and user lookup |
| Type | picklist | CF-14 | required, initially -None- |
| Campaign_Name | text | CF-07 | required, blank |
| Status | picklist | CF-15 | initially -None- |
| Start_Date | date | CF-08 | date placeholder; calendar not observed |
| End_Date | date | CF-16 | date placeholder; calendar not observed |
| Expected_Revenue | currency | CF-09, CF-09.1, CF-10 | TL prefix and information icon |
| Budgeted_Cost | currency | CF-17, CF-17.1, CF-18 | TL prefix and information icon |
| Actual_Cost | currency | CF-11, CF-11.1, CF-12 | TL prefix and information icon |
| Expected_Response | bigint | CF-19 | blank single-line input |
| Num_sent | bigint | CF-13 | blank single-line input |
| Description | textarea | CF-20, CF-21 | blank multiline input |
| Parent_Campaign | lookup | absent | no lookup input/button rendered |
| Created_By, Modified_By | ownerlookup | absent | metadata only |
| Created_Time, Modified_Time | datetime | absent | metadata only |
| Tag | text | absent | metadata only |
| id | bigint | absent | metadata only |
| Last_Activity_Time | datetime | absent | metadata only |
| Connected_To__s | multi_module_lookup | absent | metadata only |

### Validation and unobserved states

No save, input focus, typing or option selection was requested. Required-field error wording, date-order validation, currency precision/range, numeric validation, save success/error states and post-save navigation are **not observed without a write**. These remain open questions; no undocumented validation rule is asserted.

Date picker: **not observed**. The screenshot and controls list contain date inputs, with no separately named or stable calendar-opening button. Clicking a date input would focus a field, forbidden by the inherited form rules. Parent Campaign popup: **not observed**, because its opener is absent. Edit: **not observed**, because the list has no records.

### Capture refs and list comparison

- `m7f-list-base`: no-click list gate; zero records.
- `m7f-create`: Create Campaign button, one click; painted full form.
- `m7f-create-type`: direct observed create route, Type list opening, one click.
- `m7f-create-status`: direct observed create route, Status list opening, one click.
- `m7f-list-after`: no-click final list comparison.

List controls are not re-inventoried in this form slice. The complete CL inventory and source mapping belong to MEP-754; its artifact is the review access path until the research slices are integrated. `m7f-list-base` reuses the earlier `m7-list-base` list inventory from the MEP-754 slice (CL-01–CL-40 plus SH references), with identical source ordinals, tags, names and bounds; no shell difference was found. No list control was operated except the verified Create Campaign button. Raw screenshots stay in the local research workspace.

### Control inventory — m7f-create-type

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CF-14.1 | Type popup | Search | input | top, above options | not observed; empty, automatic popup focus | seen (m7f-create-type) | M7 | AF-13.1 moved, accounts-form.md |
| CF-14.2 | Type popup | -None- | menu item | option 1 | checked; not selected by the analyst | seen (m7f-create-type) | M7 | AF-13.2 moved, accounts-form.md |
| CF-14.3 | Type popup | Conference | menu item | option 2 | not observed | seen (m7f-create-type) | M7 | new |
| CF-14.4 | Type popup | Webinar | menu item | option 3 | not observed | seen (m7f-create-type) | M7 | new |
| CF-14.5 | Type popup | Trade Show | menu item | option 4 | not observed | seen (m7f-create-type) | M7 | new |
| CF-14.6 | Type popup | Public Relations | menu item | option 5 | not observed | seen (m7f-create-type) | M7 | new |
| CF-14.7 | Type popup | Partners | menu item | option 6 | not observed | seen (m7f-create-type) | M7 | new |
| CF-14.8 | Type popup | Referral Program | menu item | option 7, clipped at lower edge | not observed | seen (m7f-create-type) | M7 | new |

Rest: as in `m7f-create`; covered by the overlay: CF-15, CF-16, CF-17, CF-17.1, CF-18, CF-19 and part of CF-24. The popup search magnifier and checked-option tick are decorations of CF-14.1 / CF-14.2, not independent controls. Source entries for the remaining six options lie outside the popup's clipped viewport and are not claimed as visually observed.

Metadata-only complete Type order: -None-, Conference, Webinar, Trade Show, Public Relations, Partners, Referral Program, Advertisement, Banner Ads, Direct mail, Email, Telemarketing, Others. Only the first seven appear in this capture; no scrolling was requested.

### Source reconciliation — m7f-create

All 212 source entries are covered below. Wrapper/child duplicates share a number; hidden items do not establish visibility. The screenshot additionally establishes CF-21 and SH-46, and the currency prefixes are included with their inputs.

| Inventory number | Source ordinals |
| --- | --- |
| SH-01 | 2–4 |
| SH-02 | 11 |
| SH-03 | 12–14 |
| SH-04 | 15–17 |
| SH-05 | 18–20 |
| SH-06 | 21–23 |
| SH-07 | 24–26 |
| SH-08 | 27–29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| SH-12 | 37 |
| SH-13 | 39–40 |
| SH-14 | 41–42 |
| SH-15 | 43–44 |
| SH-16 | 45–46 |
| SH-17 | 47–48 |
| SH-18 | 49–50 |
| SH-19 | 51 |
| SH-20 | 53–54 |
| SH-21 | 55–56 |
| SH-22 | 57–58 |
| SH-23 | 59 |
| SH-24 | 61–62 |
| SH-25 | 64–65 |
| SH-26 | 86 |
| SH-27 | 87 |
| SH-28 | 89 |
| SH-29 | 90 |
| SH-30 | 91–93 |
| SH-31 | 94–96 |
| SH-32 | 97–99 |
| SH-33 | 100–101 |
| SH-34 | 104–107 |
| SH-35 | 191 |
| SH-36 | 192 |
| SH-37 | 193 |
| SH-38 | 194 |
| SH-39 | 195 |
| SH-40 | 196 |
| SH-41 | 197 |
| SH-42 | 198 |
| SH-43 | 199 |
| SH-44 | 200 |
| SH-45 | 201 |
| CF-01 | 110–112 |
| CF-02 | 118–119 |
| CF-03 | 116–117 |
| CF-04 | 114–115 |
| CF-05 | 128–129 |
| CF-06 | 127, 203–205 |
| CF-07 | 130–131 |
| CF-08 | 132–133 |
| CF-09 / CF-09.1 | 134–135 |
| CF-10 | 206 |
| CF-11 / CF-11.1 | 138–139 |
| CF-12 | 207 |
| CF-13 | 142–143 |
| CF-14 | 144–145 |
| CF-15 | 146–147 |
| CF-16 | 148–149 |
| CF-17 / CF-17.1 | 150–151 |
| CF-18 | 208 |
| CF-19 | 154–155 |
| CF-20 / CF-21 | 157–158, 211 |
| CF-22 | 160–162, 212 |
| CF-23 | 163–164 |
| CF-24 | 175 |
| Excluded: outside viewport (including rail Products and unused rail groups) | 66–81, 108 |
| Excluded: structural container or static heading/label; no independent control | 1, 38, 52, 60, 63, 83, 85, 88, 109, 113, 125–126, 156, 159, 190, 209–210 |
| Excluded: zero-area hidden/inactive element | 5–10, 33, 82, 84, 102–103, 120–124, 136–137, 140–141, 152–153, 165–174, 176–189, 202 |

Self-check: controls.json 212 entries → 131 mapped source entries, 81 explicitly excluded; 27 CF inventory numbers (CF-01–CF-24 plus three currency-prefix subnumbers), plus shared SH controls. CF-21 is the image-only resize affordance within the textarea.

### Control inventory — m7f-create-status

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CF-15.1 | Status popup | -None- | menu item | option 1 | checked; not selected by the analyst | seen (m7f-create-status) | M7 | new |
| CF-15.2 | Status popup | Planning | menu item | option 2 | not observed | seen (m7f-create-status) | M7 | new |
| CF-15.3 | Status popup | Active | menu item | option 3 | not observed | seen (m7f-create-status) | M7 | new |
| CF-15.4 | Status popup | Inactive | menu item | option 4 | not observed | seen (m7f-create-status) | M7 | new |
| CF-15.5 | Status popup | Complete | menu item | option 5 | not observed | seen (m7f-create-status) | M7 | new |

Rest: as in `m7f-create`; covered by the overlay: CF-16, CF-17, CF-17.1, CF-18, CF-19 and part of CF-24. This list has no search input. Its five visible options match the metadata order exactly. The tick belongs to CF-15.1. Status here is a form field; it was only opened, never changed.

### Open questions

1. Edit layout and edit-only controls/defaults cannot be observed while Campaigns has no records. Revisit only when a record becomes available independently; creating a record for research remains forbidden.
2. Parent Campaign is exported in the layout but absent from the rendered create form. Its lookup popup and reason for absence are not observed. No configuration change is authorized to reveal it.
3. A date input may expose a calendar after focus, but that action is outside the inherited form-opening rules. Calendar structure and date selection remain not observed.
4. Required error text, Start/End Date ordering, numeric constraints and save outcomes are not observed without a write. Resolve from public documentation or a lead decision before implementation depends on them.
5. Currency information-popup content, owner selection and custom form-view behaviour are not observed; only their visible controls are inventoried.

### Source reconciliation — m7f-create-type

All 229 source entries are reconciled; base controls retain their numbers even where covered by the popup.

| Inventory number / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural container or static heading/label; no independent control | 1, 38, 52, 60, 63, 83, 85, 88, 109, 113, 125–126, 156, 159, 191, 225–226 |
| SH-01 | 2–4 |
| Excluded: zero-area hidden/inactive element | 5–10, 33, 82, 84, 102–103, 120–124, 136–137, 140–141, 152–153, 165–174, 176–190 |
| SH-02 | 11 |
| SH-03 | 12–14 |
| SH-04 | 15–17 |
| SH-05 | 18–20 |
| SH-06 | 21–23 |
| SH-07 | 24–26 |
| SH-08 | 27–29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| SH-12 | 37 |
| SH-13 | 39–40 |
| SH-14 | 41–42 |
| SH-15 | 43–44 |
| SH-16 | 45–46 |
| SH-17 | 47–48 |
| SH-18 | 49–50 |
| SH-19 | 51 |
| SH-20 | 53–54 |
| SH-21 | 55–56 |
| SH-22 | 57–58 |
| SH-23 | 59 |
| SH-24 | 61–62 |
| SH-25 | 64–65 |
| Excluded: outside viewport (including rail Products and unused rail groups) | 66–81, 108 |
| SH-26 | 86 |
| SH-27 | 87 |
| SH-28 | 89 |
| SH-29 | 90 |
| SH-30 | 91–93 |
| SH-31 | 94–96 |
| SH-32 | 97–99 |
| SH-33 | 100–101 |
| SH-34 | 104–107 |
| CF-01 | 110–112 |
| CF-04 | 114–115 |
| CF-03 | 116–117 |
| CF-02 | 118–119 |
| CF-06 | 127, 218–220 |
| CF-05 | 128–129 |
| CF-07 | 130–131 |
| CF-08 | 132–133 |
| CF-09 / CF-09.1 | 134–135 |
| CF-11 / CF-11.1 | 138–139 |
| CF-13 | 142–143 |
| CF-14 | 144–145 |
| CF-15 | 146–147 |
| CF-16 | 148–149 |
| CF-17 / CF-17.1 | 150–151 |
| CF-19 | 154–155 |
| CF-20 / CF-21 | 157–158, 227 |
| CF-22 | 160–162, 228 |
| CF-23 | 163–164 |
| CF-24 | 175 |
| SH-35 | 192 |
| SH-36 | 193 |
| SH-37 | 194 |
| SH-38 | 195 |
| SH-39 | 196 |
| SH-40 | 197 |
| SH-41 | 198 |
| SH-42 | 199 |
| SH-43 | 200 |
| SH-44 | 201 |
| SH-45 | 202 |
| CF-14.1 | 203 |
| Excluded: popup structural container | 204 |
| CF-14.2 | 205 |
| CF-14.3 | 206 |
| CF-14.4 | 207 |
| CF-14.5 | 208 |
| CF-14.6 | 209 |
| CF-14.7 | 210 |
| CF-14.8 | 211 |
| Excluded: option outside clipped popup viewport; metadata only | 212–217 |
| CF-10 | 221 |
| CF-12 | 222 |
| CF-18 | 223 |
| CF-14.1 (magnifier decoration) | 224 |
| Excluded: popup structural duplicate | 229 |

Self-check: controls.json 229 entries → 140 mapped source entries, 89 excluded for the reasons above; base inventory plus 8 popup numbers.

### Source reconciliation — m7f-create-status

All 219 source entries are reconciled; base controls retain their numbers even where covered by the popup.

| Inventory number / exclusion | Source ordinals |
| --- | --- |
| Excluded: structural container or static heading/label; no independent control | 1, 38, 52, 60, 63, 83, 85, 88, 109, 113, 125–126, 156, 159, 191, 215–216 |
| SH-01 | 2–4 |
| Excluded: zero-area hidden/inactive element | 5–10, 33, 82, 84, 102–103, 120–124, 136–137, 140–141, 152–153, 165–174, 176–190 |
| SH-02 | 11 |
| SH-03 | 12–14 |
| SH-04 | 15–17 |
| SH-05 | 18–20 |
| SH-06 | 21–23 |
| SH-07 | 24–26 |
| SH-08 | 27–29 |
| SH-09 | 30–32 |
| SH-10 | 34 |
| SH-11 | 35–36 |
| SH-12 | 37 |
| SH-13 | 39–40 |
| SH-14 | 41–42 |
| SH-15 | 43–44 |
| SH-16 | 45–46 |
| SH-17 | 47–48 |
| SH-18 | 49–50 |
| SH-19 | 51 |
| SH-20 | 53–54 |
| SH-21 | 55–56 |
| SH-22 | 57–58 |
| SH-23 | 59 |
| SH-24 | 61–62 |
| SH-25 | 64–65 |
| Excluded: outside viewport (including rail Products and unused rail groups) | 66–81, 108 |
| SH-26 | 86 |
| SH-27 | 87 |
| SH-28 | 89 |
| SH-29 | 90 |
| SH-30 | 91–93 |
| SH-31 | 94–96 |
| SH-32 | 97–99 |
| SH-33 | 100–101 |
| SH-34 | 104–107 |
| CF-01 | 110–112 |
| CF-04 | 114–115 |
| CF-03 | 116–117 |
| CF-02 | 118–119 |
| CF-06 | 127, 209–211 |
| CF-05 | 128–129 |
| CF-07 | 130–131 |
| CF-08 | 132–133 |
| CF-09 / CF-09.1 | 134–135 |
| CF-11 / CF-11.1 | 138–139 |
| CF-13 | 142–143 |
| CF-14 | 144–145 |
| CF-15 | 146–147 |
| CF-16 | 148–149 |
| CF-17 / CF-17.1 | 150–151 |
| CF-19 | 154–155 |
| CF-20 / CF-21 | 157–158, 217 |
| CF-22 | 160–162, 218 |
| CF-23 | 163–164 |
| CF-24 | 175 |
| SH-35 | 192 |
| SH-36 | 193 |
| SH-37 | 194 |
| SH-38 | 195 |
| SH-39 | 196 |
| SH-40 | 197 |
| SH-41 | 198 |
| SH-42 | 199 |
| SH-43 | 200 |
| SH-44 | 201 |
| SH-45 | 202 |
| Excluded: popup structural container | 203 |
| CF-15.1 | 204 |
| CF-15.2 | 205 |
| CF-15.3 | 206 |
| CF-15.4 | 207 |
| CF-15.5 | 208 |
| CF-10 | 212 |
| CF-12 | 213 |
| CF-18 | 214 |
| Excluded: popup structural duplicate | 219 |

Self-check: controls.json 219 entries → 136 mapped source entries, 83 excluded for the reasons above; base inventory plus 5 popup numbers.

### Source reconciliation — list gate and final comparison

`m7f-list-base`: 287 source entries use the exact ordinal mapping in MEP-754, `Reconciliation of controls.json — m7-list-base`. Every source entry was compared by tag, name and bounds and is identical. This covers CL-01–CL-40 and SH-01–SH-45 (SH-46 is image-only); CL-40 is DOM-only, not painted. 146 source entries map to visible-control numbers; 141 are excluded as hidden/unpainted, clipped, structural or duplicate wrappers under that mapping. No overlay.

`m7f-list-after`: 287 entries use the same assignments, with only hidden-overlay ordering changes at ordinals 264–266 (all already excluded). Every other tag/name/bounds tuple is identical. Self-check: 146 mapped entries and 141 excluded; CL-01–CL-40 plus SH references. Both list screenshots show total 0 and zero record links; no record disappeared. All five screenshots were opened as images. No tab was closed.


## Links from other modules

Status: **incomplete — capture safety review required** (MEP-755). The Add Campaigns opening attempted a legacy POST outside the inherited expected-path set. The tool blocked it; the picker did not paint. Under the issue's stop rule, no further Contacts, Deals, menu or filter captures were attempted. This section is a partial evidence record, not a complete implementation contract.

### Purpose and evidence boundary

This research slice follows links into Campaigns from Leads, Contacts and Deals. Existing screen controls retain their nearest screen references. Only opening a record or an initial selection surface is in scope; no membership, Member Status, lookup value or saved filter is changed. The inherited capture rules prohibit filter toggles and record-selection toggles in this task, so criteria revealed only by those toggles remain **not observed**.

### Capture refs

- `m7-campaign-links-leads-base`: painted Leads list, total 10; initial gate, 59 API calls.
- `m7-campaign-links-lead-detail`: one record link opened; upper detail and Campaigns rail entry.
- `m7-campaign-links-lead-card`: record then Campaigns rail link; empty Campaigns card.
- `m7-campaign-links-lead-picker`: the same sequence then Add Campaigns; blocked request, no painted picker.
- `m7-campaign-links-leads-after`: final no-click list comparison (record count reported below).

### Control inventory — m7-campaign-links-leads-base

Shell: SH-01–SH-46 in [contacts.md](contacts.md), Leads active. MCP is the shortened SH-08 label. Channels and Threads are absent; Products is below the viewport. Shell right edge and utility strip are unchanged. Refresh exists in source but is not painted in the toolbar. Magnifiers and select chevrons belong to their inputs/selects.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-01 | View strip | All Leads | tab | left, first | same | seen (m7-campaign-links-leads-base) | M1 | L-01 |
| CX-02 | View strip | Three dots icon | icon button | after current view tab | same | seen (m7-campaign-links-leads-base) | M1 | L-02 |
| CX-03 | Toolbar | Filter | button | left group, first | same | seen (m7-campaign-links-leads-base) | M1 | L-03 |
| CX-04 | Toolbar | Sort | button | left group, second | same | seen (m7-campaign-links-leads-base) | M1 | L-04 |
| CX-05 | Toolbar | List view icon | icon button | view group, first | same | seen (m7-campaign-links-leads-base) | M1 | L-05 |
| CX-06 | Toolbar | Kanban view icon | icon button | view group, second | same | seen (m7-campaign-links-leads-base) | M1 | L-06 |
| CX-07 | Toolbar | Sheet view icon | icon button | view group, third | same | seen (m7-campaign-links-leads-base) | M1 | L-07 |
| CX-08 | Toolbar | Chart view icon | icon button | view group, fourth | same | seen (m7-campaign-links-leads-base) | M1 | L-08 |
| CX-09 | Toolbar | Timeline view icon | icon button | view group, fifth | same | seen (m7-campaign-links-leads-base) | M1 | L-09 |
| CX-10 | Toolbar | Two horizontal bars icon | icon button | view group, sixth | same | seen (m7-campaign-links-leads-base) | M1 | L-10 |
| CX-11 | Toolbar | Down chevron | icon button | view group, seventh | same | seen (m7-campaign-links-leads-base) | M1 | L-11 |
| CX-12 | Toolbar | Create Lead | button | right group, first | same | seen (m7-campaign-links-leads-base) | M1 | L-12 |
| CX-13 | Toolbar | Down arrow / More | icon button | right group, attached to Create Contact | same | seen (m7-campaign-links-leads-base) | M6 | L-13 |
| CX-14 | Toolbar | Three dots / Actions | icon button | right group, far right | same | seen (m7-campaign-links-leads-base) | M1 | L-14 |
| CX-15 | Filter panel | Search | input | below Filter Contacts by heading | same | seen (m7-campaign-links-leads-base) | M1 | L-15 |
| CX-16 | Filter panel | System Defined Filters | toggle | first section heading | same | seen (m7-campaign-links-leads-base) | M1 | L-16 |
| CX-17 | Filter panel | Activities | checkbox | system-defined section, Activities | same | seen (m7-campaign-links-leads-base) | M5 | L-17 |
| CX-18 | Filter panel | Campaigns | checkbox | system-defined section, Campaigns | Not toggled; criteria not observed | seen (m7-campaign-links-leads-base) | M7 | L-18 |
| CX-19 | Filter panel | Latest Email Status | checkbox | system-defined section, Latest Email Status | same | seen (m7-campaign-links-leads-base) | M10 | L-19 |
| CX-20 | Filter panel | Locked | checkbox | system-defined section, Locked | same | seen (m7-campaign-links-leads-base) | M1 | L-20 |
| CX-21 | Filter panel | Record Action | checkbox | system-defined section, Record Action | same | seen (m7-campaign-links-leads-base) | M1 | L-21 |
| CX-22 | Filter panel | Related Records Action | checkbox | system-defined section, Related Records Action | same | seen (m7-campaign-links-leads-base) | M1 | L-22 |
| CX-23 | Filter panel | Touched Records | checkbox | system-defined section, Touched Records | same | seen (m7-campaign-links-leads-base) | M1 | L-23 |
| CX-24 | Filter panel | Untouched Records | checkbox | system-defined section, Untouched Records | same | seen (m7-campaign-links-leads-base) | M1 | L-24 |
| CX-25 | Filter panel | Cadences | checkbox | system-defined section, Cadences | same | seen (m7-campaign-links-leads-base) | P3 | L-25 |
| CX-26 | Filter panel | Filter By Fields | toggle | second section heading | same | seen (m7-campaign-links-leads-base) | M1 | L-26 |
| CX-27 | Filter panel | Address | checkbox | field section, first | same | seen (m7-campaign-links-leads-base) | M3 | new |
| CX-28 | Filter panel | Address - City | checkbox | field section, second | same | seen (m7-campaign-links-leads-base) | M2 | new |
| CX-29 | Filter panel | Address - Country / Region | checkbox | field section, third | same | seen (m7-campaign-links-leads-base) | M2 | new |
| CX-30 | Filter panel | Address - Flat / House No./ Building / Apartment Name | checkbox | field section, fourth, partly clipped | same | seen (m7-campaign-links-leads-base) | M2 | new |
| CX-33 | Table | Sliders icon | icon button | header, far right overlay | same | seen (m7-campaign-links-leads-base) | M11 | L-33 |
| CX-34 | Table | Select all checkbox | checkbox | header, before activity column | same | seen (m7-campaign-links-leads-base) | M1 | L-34 |
| CX-35 | Table | Lead Name | column header | first text column | same | seen (m7-campaign-links-leads-base) | M1 | L-35 |
| CX-36 | Table | All with down arrow | select | within Lead Name header, right | same | seen (m7-campaign-links-leads-base) | M1 | L-36 |
| CX-37 | Table | Company | column header | second text column | same | seen (m7-campaign-links-leads-base) | M3 | new |
| CX-38 | Table | Email | column header | third text column | same | seen (m7-campaign-links-leads-base) | M1 | L-38 |
| CX-39 | Table | Phone (partly clipped) | column header | fourth text column, right edge | same | seen (m7-campaign-links-leads-base) | M1 | L-39 |
| CX-40 | Table | Record selection checkbox | checkbox | each visible row, before activity column | same | seen (m7-campaign-links-leads-base) | M1 | L-40 |
| CX-41 | Table | Task and call activity flags | badge | rows with activity, before Lead Name | same | seen (m7-campaign-links-leads-base) | M5 | new |
| CX-42 | Table | Lead record link | link | Lead Name cells | Opens the record detail | seen (m7-campaign-links-leads-base) | M1 | L-42 |
| CX-44 | Table | Email address link | link | Email cells | same | seen (m7-campaign-links-leads-base) | M10 | L-44 |
| CX-48 | List footer | Total Records | badge | left | same | seen (m7-campaign-links-leads-base) | M1 | L-48 |
| CX-49 | List footer | Displayed record range | badge | right group, between arrows | same | seen (m7-campaign-links-leads-base) | M1 | L-49 |
| CX-50 | List footer | Previous | icon button | right group, before range | same | seen (m7-campaign-links-leads-base) | M1 | L-50 |
| CX-51 | List footer | Next | icon button | right group, after range | same | seen (m7-campaign-links-leads-base) | M1 | L-51 |

Absent here: Contacts Account record link L-43; Contacts field filters L-27–L-32 are replaced by the visible address fields. Row hover actions L-45–L-47 are not painted. Company cells are plain text. Phone and Email are clipped by the table viewport. No campaign filter was enabled.

### Control inventory — m7-campaign-links-lead-detail

Shell: as in the Leads list baseline. Lead detail follows [record-detail.md](record-detail.md), especially Layout and Related-list cards. Numbered nearest references below use [contacts-record-detail.md](contacts-record-detail.md). Static identity, field labels and values are not controls. The record portrait is displayed; no upload interaction was tested.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-101 | Header | Back | icon button | leftmost | same | seen (m7-campaign-links-lead-detail) | M1 | D-01 |
| CX-102 | Header | Record portrait | icon button | after Back | same | seen (m7-campaign-links-lead-detail) | M6 | new |
| CX-104 | Header | Add Tags | button | below identity | same | seen (m7-campaign-links-lead-detail) | M6 | D-04 |
| CX-105 | Header | Send Email | button | right actions, first | same | seen (m7-campaign-links-lead-detail) | M10 | D-05 |
| CX-106 | Header | Edit | button | right actions, third | same | seen (m7-campaign-links-lead-detail) | M1 | D-06 moved |
| CX-107 | Header | More Options / three dots | icon button | right actions, fourth | same | seen (m7-campaign-links-lead-detail) | M1 | D-07 moved |
| CX-108 | Header | Previous Record | icon button | after More Options | same | seen (m7-campaign-links-lead-detail) | M1 | D-08 |
| CX-109 | Header | Next Record | icon button | far right | same | seen (m7-campaign-links-lead-detail) | M1 | D-09 |
| CX-110 | Related-list rail | Notes | link | rail, row 1 | same | seen (m7-campaign-links-lead-detail) | M6 | D-10 |
| CX-111 | Related-list rail | Connected Records | link | rail, row 2 | same | seen (m7-campaign-links-lead-detail) | ? | D-11 |
| CX-112 | Related-list rail | Attachments | link | rail, row 4 | same | seen (m7-campaign-links-lead-detail) | M6 | D-12 moved |
| CX-113 | Related-list rail | Cadences | link | rail, row 3 | same | seen (m7-campaign-links-lead-detail) | P3 | D-13 moved |
| CX-115 | Related-list rail | Open Activities | link | rail, row 6 | same | seen (m7-campaign-links-lead-detail) | M5 | D-15 moved |
| CX-116 | Related-list rail | Closed Activities | link | rail, row 7 | same | seen (m7-campaign-links-lead-detail) | M5 | D-16 moved |
| CX-117 | Related-list rail | Invited Meetings | link | rail, row 8 | same | seen (m7-campaign-links-lead-detail) | M5 | D-17 moved |
| CX-118 | Related-list rail | Products | link | rail, row 5 | same | seen (m7-campaign-links-lead-detail) | P2 | D-18 moved |
| CX-123 | Related-list rail | Emails | link | rail, row 9 | same | seen (m7-campaign-links-lead-detail) | M10 | D-23 moved |
| CX-125 | Related-list rail | Campaigns | link | rail, row 10 | Scrolls to Campaigns card | seen (m7-campaign-links-lead-detail) | M7 | D-25 moved |
| CX-126 | Related-list rail | Social | link | rail, row 11 | same | seen (m7-campaign-links-lead-detail) | M15 | D-26 moved |
| CX-128 | Related-list rail | Voice of the Customer | link | rail, row 12 | same | seen (m7-campaign-links-lead-detail) | P3 | D-28 moved |
| CX-129 | Related-list rail | Add Related List | link | below last related-list link | same | seen (m7-campaign-links-lead-detail) | M11 | D-29 |
| CX-132 | Tab row | Related-list rail visibility icon | icon button | before Overview | same | seen (m7-campaign-links-lead-detail) | M1 | D-32 |
| CX-133 | Tab row | Overview | tab | first tab, selected | same | seen (m7-campaign-links-lead-detail) | M1 | D-33 |
| CX-134 | Tab row | Timeline | tab | second tab | same | seen (m7-campaign-links-lead-detail) | M1 | D-34 |
| CX-135 | Tab row | Last Update indicator | badge | far right | same | seen (m7-campaign-links-lead-detail) | M1 | D-35 |
| CX-136 | Business card | Email address link | link | Email field value | same | seen (m7-campaign-links-lead-detail) | M10 | D-36 |
| CX-137 | Business card | Phone call icon | icon button | after Phone value | same | seen (m7-campaign-links-lead-detail) | M5 | D-37 |
| CX-138 | Details card | Hide Details | button | card header, left | same | seen (m7-campaign-links-lead-detail) | M1 | D-38 |
| CX-140 | Details card | Email address link | link | Lead Information, right column, Email value | same | seen (m7-campaign-links-lead-detail) | M10 | D-40 moved |
| CX-141 | Details card | Phone call icon | icon button | Lead Information, left column, after Phone value | same | seen (m7-campaign-links-lead-detail) | M5 | D-41 moved |
| CX-142 | Header | Convert | button | right actions, second | not operated | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-143 | Related-list rail | Add Link | link | below Links heading | not operated | seen (m7-campaign-links-lead-detail) | M11 | new |
| CX-144.1 | Stage bar | Contact in Future (partly clipped) | button | visible stage 1, left to right | not operated; record-detail.md › Layout | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-144.2 | Stage bar | Contacted | button | visible stage 2, left to right | not operated; record-detail.md › Layout | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-144.3 | Stage bar | Junk Lead | button | visible stage 3, left to right | not operated; record-detail.md › Layout | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-144.4 | Stage bar | Lost Lead (current, with selector caret) | button | visible stage 4, left to right | not operated; record-detail.md › Layout | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-144.5 | Stage bar | Not Contacted | button | visible stage 5, left to right | not operated; record-detail.md › Layout | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-144.6 | Stage bar | Pre-Qualified | button | visible stage 6, left to right | not operated; record-detail.md › Layout | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-144.7 | Stage bar | Not Qualified | button | visible stage 7, left to right | not operated; record-detail.md › Layout | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-145.1 | Stage bar | Left chevron | icon button | left edge of stage sequence | not operated | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-145.2 | Stage bar | Right chevron | icon button | right edge of stage sequence | not operated | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-146 | Stage bar | Terminal-status button and chevron | button / select | right of stage sequence | not operated | seen (m7-campaign-links-lead-detail) | M1 | new |
| CX-147 | Business card | Mobile call icon | icon button | after Mobile value | not operated | seen (m7-campaign-links-lead-detail) | M5 | new |

Absent here: Contacts Account identity link, Deals/Cases/Quotes/order/invoice/Reporting Contacts rail entries and activity counters. Stage sequence is Lead Status; it is not a Campaign Member Status control. No Campaigns badge is painted in the rail.

### Control inventory — m7-campaign-links-lead-card (difference)

The Campaigns rail link scrolls its existing card beneath the fixed Overview/Timeline row. It does not open a separate Campaigns record. The card has a left-aligned Campaigns heading and right-aligned Add Campaigns button. No counter, column header, member row, Member Status or row action is painted. The empty body reads `No records found`.

| # | Region | Control | Type | Position | What it does | Source | Module | Ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CX-148 | Campaigns card | Add Campaigns | button | header, right | Opening attempted separately; blocked before picker painted; no association performed | seen (m7-campaign-links-lead-card) | M7 | contacts-record-detail.md D-86; record-detail.md › Related-list cards |
| CX-149 | Related-list rail | Plus icon | icon button | selected Campaigns row, right | not operated | seen (m7-campaign-links-lead-card) | M7 | new |
| CX-150 | Related-list rail | Small list icon | icon button | right of Related List heading | not operated; no preference changed | seen (m7-campaign-links-lead-card) | M11 | new |
| CX-151 | Social card | Associate Twitter | link | left stack, first | not operated | seen (m7-campaign-links-lead-card) | M15 | contacts-record-detail.md D-87 |
| CX-152 | Social card | Associate Facebook | link | left stack, second | not operated | seen (m7-campaign-links-lead-card) | M15 | contacts-record-detail.md D-88 |
| CX-153 | Content edge | Scroll To Top | icon button | lower right | not operated | seen (m7-campaign-links-lead-card) | M1 | contacts-record-detail.md D-63 |

Rest: as in `m7-campaign-links-lead-detail`; scrolling replaces the visible stage strip, business card and upper field rows (CX-136–CX-138, CX-140–CX-141, CX-144–CX-147). Header, rail, tabs and utility strip remain visible. Social's informational illustration and empty-state text are not controls.

### Source reconciliation — m7-campaign-links-leads-base

Every source entry is mapped below. Ordinals are one-based evidence references, never live selectors. Hidden elements and off-viewport fields do not establish visible controls. Shell grouping resolves to SH-01–SH-46 and their wrappers in contacts.md.

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Shell SH-01–SH-46 (contacts.md); structural wrappers/duplicate descendants included | 1–4, 11–12, 14–15, 17–18, 20–21, 23–24, 26–27, 29–32, 34–68, 83, 85, 87–92, 95, 98, 101–102, 105–108, 172–173, 494–505 |
| Excluded: zero-area hidden/inactive element | 5–10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 86, 93–94, 96–97, 99–100, 103–104, 109–112, 137, 141, 288–289, 293–294, 466–474, 479–493, 506 |
| Excluded: outside viewport | 69–81, 174–287, 310–312, 326–328, 341–343, 356–358, 371–373, 386–388, 401–403, 416–418, 432–434, 447–449, 463–465, 513 |
| Excluded: structural container / duplicate wrapper | 113, 122, 138, 290–291, 295–300, 303, 509–512, 514 |
| CX-01 | 114 |
| CX-02 | 115–119 |
| CX-03 | 120 |
| CX-04 | 121 |
| CX-05 | 123 |
| CX-06 | 124 |
| CX-07 | 125 |
| CX-08 | 126 |
| CX-09 | 127 |
| CX-10 | 128 |
| CX-11 | 129–130 |
| Excluded: refresh DOM affordance not painted in screenshot | 131–132 |
| CX-12 | 133 |
| CX-13 | 134–135 |
| CX-14 | 136, 507 |
| CX-15 | 139–140, 508 |
| CX-16 | 142 |
| Excluded: structural container or static label/value | 143, 163, 313–316, 319–320, 322–323, 325, 329–331, 334–335, 337–338, 340, 344–346, 349–350, 352–353, 355, 359–361, 364–365, 367–368, 370, 374–376, 379–380, 382–383, 385, 389–391, 394–395, 397–398, 400, 404–406, 409–410, 412–413, 415, 419–421, 424, 426, 428–429, 431, 435–437, 440–441, 443–444, 446, 450–452, 455, 457, 459–460, 462 |
| CX-17 | 144–145 |
| CX-18 | 146–147 |
| CX-19 | 148–149 |
| CX-20 | 150–151 |
| CX-21 | 152–153 |
| CX-22 | 154–155 |
| CX-23 | 156–157 |
| CX-24 | 158–159 |
| CX-25 | 160–161 |
| CX-26 | 162 |
| CX-27 | 164–165 |
| CX-28 | 166–167 |
| CX-29 | 168–169 |
| CX-30 | 170–171 |
| CX-33 | 292 |
| CX-34 | 301–302 |
| CX-35 | 304 |
| CX-36 | 305–306 |
| CX-37 | 307 |
| CX-38 | 308 |
| CX-39 | 309 |
| CX-40 | 317–318, 332–333, 347–348, 362–363, 377–378, 392–393, 407–408, 422–423, 438–439, 453–454 |
| CX-42 | 321, 336, 351, 366, 381, 396, 411, 427, 442, 458 |
| CX-44 | 324, 339, 354, 369, 384, 399, 414, 430, 445, 461 |
| CX-41 | 425, 456 |
| CX-48 | 475 |
| CX-49 | 476 |
| CX-50 | 477 |
| CX-51 | 478 |

Self-check: 514 source entries; zero unresolved. Repeated row selection, record links, email links and activity flags reuse their numbers. The screenshot also supplies the utility strip final icon, already SH-46.

### Source reconciliation — m7-campaign-links-lead-detail

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Shell SH-01–SH-46 (contacts.md); structural wrappers/duplicate descendants included | 1–4, 11–12, 14–15, 17–18, 20–21, 23–24, 26–27, 29–32, 34–68, 83, 85–91, 94, 97, 100–101, 104–107, 426–437, 442, 450 |
| Excluded: zero-area hidden/inactive element | 5–10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 92–93, 95–96, 98–99, 102–103, 111, 116, 118, 129, 133, 136, 139, 142, 145, 148, 151, 154, 157, 160, 163, 166, 186–187, 285, 297, 301, 313, 327, 330–331, 334, 337–340, 344, 362, 376–377, 389–390, 398–399, 407–425, 438 |
| Excluded: outside viewport | 69–81, 282–284, 286–296, 298–300, 302–312, 314–326, 328–329, 332–333, 335–336, 341–343, 345–361, 363–375, 378–388, 391–397, 400–406, 443–449, 460–464 |
| Excluded: structural wrapper or duplicate static label | 108, 451, 454–458 |
| CX-101 | 109–110 |
| CX-102 | 112–113 |
| Excluded: static heading/identity or structural wrapper | 114–115, 130, 170, 174 |
| CX-104 | 117 |
| CX-105 | 119–120 |
| CX-142 | 121–122 |
| CX-106 | 123–124 |
| CX-107 | 125–126 |
| CX-108 | 127 |
| CX-109 | 128 |
| CX-110 | 131–132 |
| CX-111 | 134–135 |
| CX-113 | 137–138 |
| CX-112 | 140–141 |
| CX-118 | 143–144 |
| CX-115 | 146–147 |
| CX-116 | 149–150 |
| CX-117 | 152–153 |
| CX-123 | 155–156 |
| CX-125 | 158–159 |
| CX-126 | 161–162 |
| CX-128 | 164–165 |
| CX-129 | 167 |
| CX-143 | 168 |
| CX-132 | 169 |
| CX-133 | 171 |
| CX-134 | 172 |
| CX-135 | 173 |
| CX-145.1 | 175 |
| CX-145.2 | 184 |
| Excluded: stage item clipped behind related-list rail | 176 |
| CX-144.1 | 177 |
| CX-144.2 | 178 |
| CX-144.3 | 179 |
| CX-144.4 | 180 |
| CX-144.5 | 181 |
| CX-144.6 | 182 |
| CX-144.7 | 183 |
| CX-146 | 185 |
| Excluded: static field label/value or structural wrapper; inline edit not entered | 188–201, 203–221, 224–280 |
| CX-136 | 202 |
| CX-138 | 222–223 |
| CX-140 | 281 |
| CX-137 | 439 |
| CX-147 | 440 |
| CX-141 | 441 |
| Excluded: structural container or static label/value | 452–453, 459 |

Self-check: 464 source entries; zero unresolved. Static field wrappers do not establish hover/edit controls.

### Control inventory — m7-campaign-links-lead-picker (difference)

No picker controls painted. Add Campaigns initiated a blocked legacy request to `POST /crm/<org>/ShowMultiValuesForAdd.do` (one occurrence, no response status). The screenshot remains on the empty Campaigns card with a thin loading indicator at the top edge; source text also includes Loading. This is a blocked/loading state, not a selection-dialog design. There is no basis for inventing its title, columns, search placeholder, selection controls, Member Status choices, action buttons or defaults.

Rest: as in `m7-campaign-links-lead-card`; CX-149 and CX-150 are no longer painted because the prior rail hover is gone. No overlay covers the base. No retry, alternate route or longer wait was attempted after this stop condition.

### Scope coverage and reuse evidence

| Requested surface | Evidence and nearest Ref | Result in this slice |
| --- | --- | --- |
| Leads Campaigns card | CX-125, CX-148; record-detail.md › Related-list cards | Seen empty; title, right action and empty message; no counter or table |
| Contacts Campaigns card | contacts-record-detail.md D-25, D-86, Related-list cards row 16 | Earlier research saw an empty card; not recaptured after stop; current populated state not observed |
| Deals Campaigns card | deals-record-detail.md › Related-list rail; exported Deals related-list metadata | No Campaigns relation in the exported configuration or earlier rail inventory; no current capture. Do not infer a card from the task title |
| Detail Add Campaigns opening | CX-148; m7-campaign-links-lead-picker | Attempt blocked; dialog not observed |
| List Add to Campaigns entry | contacts.md L-14.9; list-views.md › Actions / Row selection | Earlier menus contain this action; neither menu nor initial dialog recaptured here; selection toolbar not activated |
| Deals Campaign Source field and lookup trigger | deals-form.md DF-23–DF-24 | Earlier create form shows an optional lookup at right row 6; new form/picker capture not observed after stop |
| Deals Campaign Source detail value | deals-record-detail.md | Not observed; no value or link behaviour inferred |
| Leads Campaigns filter | CX-18; list-views.md › Left filters | Seen unchecked, second system filter; no toggle, criterion or filter execution |
| Contacts Campaigns filter | contacts.md L-18 | Earlier list shows system filter; not recaptured here |
| Deals Campaign Source filter | deals.md DL-66 | Earlier list shows field-filter checkbox, third row; Contacts-style Campaigns system filter is absent in that earlier screen |
| Campaign members and Member Status | No populated card or picker painted | Not observed: count, columns, row controls, removal, status editor, status choices and search/selection behaviour |

Exported Leads and Contacts related-list metadata both mark Campaigns visible and allow edit/disassociate while create, delete, bulk edit and assign are false. These are relation capabilities, not evidence of rendered buttons or write outcomes. Deals exports Campaign_Source as a Campaigns lookup but has no Campaigns related-list definition. No identifiers or record values are reproduced.

### Flows and state boundaries

1. Open a Leads record from the list. The host detail displays its existing related-list rail.
2. Open the named Campaigns rail entry. The central pane scrolls to the Campaigns card while header, rail and tabs stay fixed.
3. Empty card: the heading and Add Campaigns action remain; the body shows No records found. There are no member rows to inspect.
4. Attempt to open Add Campaigns. The capture guard blocks the legacy request and the picker remains unpainted. Stop further research under rule 5; take only the final no-click list comparison.

No field was filled, checkbox toggled, option selected or preference changed. No add, save, remove, send, assign, status change or confirmation control was used. Search results, multi-selection, cancellation, submission validation, success/error messages and post-write behaviour are **not observed**. Nothing in the loading screenshot establishes a server validation error.

### Open questions and continuation gate

- CTO must classify the blocked legacy opening request and specify a permitted read-only evidence path before this slice resumes. The analyst must not add an exception or change the capture guard independently.
- After that decision: finish Contacts card/picker, list action openings, Deals create lookup and detail field, and campaign-filter coverage within the permitted toggle rules. Final screen-spec review belongs to UI Lead after the research is complete.
- The inherited rules prohibit --allow-toggle in this task. Filter criteria that require it and bulk-selection toolbar states need an explicit scope decision before capture; no saved filter may be changed.
- Populated Campaigns-card columns, counters, Member Status and row affordances remain not observable from the empty member state. Do not create or associate a record to obtain them.
- Hover-only controls beyond the visible rail plus remain not observed. No browser tab was manually closed; the capture runtime cleaned up only its own capture tabs.

### Source reconciliation — m7-campaign-links-lead-card

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Shell SH-01–SH-46 (contacts.md); structural wrappers/duplicate descendants included | 1–4, 11–12, 14–15, 17–18, 20–21, 23–24, 26–27, 29–32, 34–68, 83, 85–91, 94, 97, 100–101, 104–107, 367, 428–439, 452 |
| Excluded: zero-area hidden/inactive element | 5–10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 92–93, 95–96, 98–99, 102–103, 111, 116, 118, 129, 134, 137, 140, 143, 146, 149, 152, 155, 158, 161, 165, 168, 188–189, 210, 216, 242, 247, 263, 287, 299, 303, 315, 329, 332–333, 336, 339–342, 346, 364, 378–379, 391–392, 400–401, 410–427, 440 |
| Excluded: outside viewport | 69–81, 176–187, 190–209, 211–215, 217–241, 243–246, 248–262, 264–286, 288–298, 300–302, 304–314, 316–328, 330–331, 334–335, 337–338, 343–345, 347–363, 365–366, 368, 393–399, 402–408, 441–449, 456–464, 466 |
| Excluded: static heading/identity/empty-state content or structural wrapper | 108, 114–115, 130, 172, 369–377, 380–381, 384–386, 453–455, 465 |
| CX-101 | 109–110 |
| CX-102 | 112–113 |
| CX-104 | 117 |
| CX-105 | 119–120 |
| CX-142 | 121–122 |
| CX-106 | 123–124 |
| CX-107 | 125–126 |
| CX-108 | 127 |
| CX-109 | 128 |
| CX-150 | 131 |
| CX-110 | 132–133 |
| CX-111 | 135–136 |
| CX-113 | 138–139 |
| CX-112 | 141–142 |
| CX-118 | 144–145 |
| CX-115 | 147–148 |
| CX-116 | 150–151 |
| CX-117 | 153–154 |
| CX-123 | 156–157 |
| CX-125 | 159–160 |
| CX-149 | 162 |
| CX-126 | 163–164 |
| CX-128 | 166–167 |
| CX-129 | 169 |
| CX-143 | 170 |
| CX-132 | 171 |
| CX-133 | 173 |
| CX-134 | 174 |
| CX-135 | 175 |
| CX-148 | 382–383 |
| CX-151 | 387–388, 450 |
| CX-152 | 389–390, 451 |
| CX-153 | 409 |

Self-check: 466 source entries; zero unresolved. Fixed header/rail/tab controls retain their base numbers; offscreen fields remain excluded. No picker controls are inferred.

### Source reconciliation — m7-campaign-links-lead-picker

| Inventory / exclusion | Source ordinals |
| --- | --- |
| Shell SH-01–SH-46 (contacts.md); structural wrappers/duplicate descendants included | 1–4, 11–12, 14–15, 17–18, 20–21, 23–24, 26–27, 29–32, 34–68, 83, 85–91, 94, 97, 100–101, 104–107, 365, 412, 428–439, 451 |
| Excluded: zero-area hidden/inactive element | 5–10, 13, 16, 19, 22, 25, 28, 33, 82, 84, 92–93, 95–96, 98–99, 102–103, 111, 116, 118, 129, 133, 136, 139, 142, 145, 148, 151, 154, 157, 160, 163, 166, 186–187, 208, 214, 240, 245, 261, 285, 297, 301, 313, 327, 330–331, 334, 337–340, 344, 362, 376–377, 389–390, 398–399, 408–411, 413–427 |
| Excluded: outside viewport | 69–81, 174–185, 188–207, 209–213, 215–239, 241–244, 246–260, 262–284, 286–296, 298–300, 302–312, 314–326, 328–329, 332–333, 335–336, 341–343, 345–361, 363–364, 366, 391–397, 400–406, 440–448, 455–463, 465 |
| Excluded: static heading/identity/empty-state content or structural wrapper | 108, 114–115, 130, 170, 367–375, 378–379, 382–384, 452–454, 464 |
| CX-101 | 109–110 |
| CX-102 | 112–113 |
| CX-104 | 117 |
| CX-105 | 119–120 |
| CX-142 | 121–122 |
| CX-106 | 123–124 |
| CX-107 | 125–126 |
| CX-108 | 127 |
| CX-109 | 128 |
| CX-110 | 131–132 |
| CX-111 | 134–135 |
| CX-113 | 137–138 |
| CX-112 | 140–141 |
| CX-118 | 143–144 |
| CX-115 | 146–147 |
| CX-116 | 149–150 |
| CX-117 | 152–153 |
| CX-123 | 155–156 |
| CX-125 | 158–159 |
| CX-126 | 161–162 |
| CX-128 | 164–165 |
| CX-129 | 167 |
| CX-143 | 168 |
| CX-132 | 169 |
| CX-133 | 171 |
| CX-134 | 172 |
| CX-135 | 173 |
| CX-148 | 380–381 |
| CX-151 | 385–386, 449 |
| CX-152 | 387–388, 450 |
| CX-153 | 407 |

Self-check: 465 source entries; zero unresolved. Fixed header/rail/tab controls retain their base numbers; offscreen fields remain excluded. No picker controls are inferred.

### Final list comparison — m7-campaign-links-leads-after

The final screenshot was opened as an image. The list is painted, has 59 API calls and retains total 10, ten record links and every initial record link. Its 514 source entries use the Leads-base reconciliation unchanged: only hidden overlay ordering differs at 491–493, all zero-area and excluded. No visible control differs; no record disappeared.

Self-check: controls.json 514 entries, zero unresolved; inventory CX-01–CX-51 (gaps intentional) and SH references as in the initial list. Rest: as in m7-campaign-links-leads-base; no overlay.
