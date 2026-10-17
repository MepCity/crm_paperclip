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


## Record detail

### Not observed — the reference has no campaign records

This is the MEP-811 source inventory authorized by the CTO's defer_detail decision
on MEP-758. It replaces that slice's blocked-detail disposition; it does not claim
screen observation or authorize implementation from an assumed layout. The approved
MEP-759 form research above is preserved unchanged. No new capture, record creation,
preference change or guessed detail route was used.

The existing `m7d-list-base` remains the prerequisite evidence: empty list, total 0,
no record links. Its saved retry and blocked-background-request audit belong to
MEP-758; this task issues no capture requests. There is no detail screenshot to
compare. UI Lead review checks source fidelity and open questions only.

### Sources and reading rules

- M1: local research `metadata/modules/Campaigns/layouts.json`, Standard layout,
  `sections[].sequence_number` and `fields[].sequence_number`.
- M2: local research `metadata/modules/Campaigns/related_lists.json`, all 15 entries.
- P1: reference CRM public help, **Creating Campaigns**, article path
  `crm/marketing-automation-tools/campaigns/articles/create-campaigns`, read 2026-10-17.
  Section names below identify the specific evidence; documentation describes the
  general product, not this account's rendered detail.
- P2: reference CRM public help, **Associating Other Records**, article path
  `crm/manage-crm-data/record-management/articles/associate-other-records`,
  **Add Notes** and **Add Tasks, Events & Calls**, read 2026-10-17.
- P3: reference CRM public help, **Customizing Record's Detail Page**, article path
  `crm/customize-crm-account/record-level-customization/articles/page-level-customization`,
  **Organize Page Details**, read 2026-10-17.

Neutral article paths omit the publisher hostname to comply with repository naming
rules. No documentation images or customer examples are reproduced.

CD numbers are stable source-inventory identifiers, **not observed controls**.
Every row gives a Source. Metadata order is configuration order, never painted
position. No existing CD identifiers were allocated in MEP-758, so numbering starts
at CD-01 here. Shared-module patterns remain hypotheses and do not establish parity.

### Section and field inventory

All fields below have `view_type.view=true` in M1. That flag does not prove that a
field is painted. Campaign Information has two configured columns; Description
Information has one. Neither the actual detail grid nor business-card placement
is known. Field sequence 16 is duplicated; array order is retained for that tie.

| # | Section / field | Configured order | Type / limit | Source | Evidence |
| --- | --- | --- | --- | --- | --- |
| CD-01 | Campaign Information | section 1 | 2 configured columns | metadata | M1 |
| CD-02 | Campaign Owner (`Owner`) | field 1 | ownerlookup; rendering unknown | metadata | M1, Campaign Information |
| CD-03 | Type (`Type`) | field 2 | picklist; rendering unknown | metadata | M1, Campaign Information |
| CD-04 | Campaign Name (`Campaign_Name`) | field 3 | text; rendering unknown | metadata | M1, Campaign Information |
| CD-05 | Status (`Status`) | field 4 | picklist; rendering unknown | metadata | M1, Campaign Information |
| CD-06 | Start Date (`Start_Date`) | field 5 | date; rendering unknown | metadata | M1, Campaign Information |
| CD-07 | End Date (`End_Date`) | field 6 | date; rendering unknown | metadata | M1, Campaign Information |
| CD-08 | Expected Revenue (`Expected_Revenue`) | field 7 | currency; rendering unknown | metadata | M1, Campaign Information |
| CD-09 | Budgeted Cost (`Budgeted_Cost`) | field 8 | currency; rendering unknown | metadata | M1, Campaign Information |
| CD-10 | Actual Cost (`Actual_Cost`) | field 9 | currency; rendering unknown | metadata | M1, Campaign Information |
| CD-11 | Expected Response (`Expected_Response`) | field 10 | bigint; rendering unknown | metadata | M1, Campaign Information |
| CD-12 | Numbers sent (`Num_sent`) | field 11 | bigint; rendering unknown | metadata | M1, Campaign Information |
| CD-13 | Created By (`Created_By`) | field 12 | ownerlookup; rendering unknown | metadata | M1, Campaign Information |
| CD-14 | Modified By (`Modified_By`) | field 13 | ownerlookup; rendering unknown | metadata | M1, Campaign Information |
| CD-15 | Created Time (`Created_Time`) | field 14 | datetime; rendering unknown | metadata | M1, Campaign Information |
| CD-16 | Modified Time (`Modified_Time`) | field 15 | datetime; rendering unknown | metadata | M1, Campaign Information |
| CD-17 | Tag (`Tag`) | field 16 | text; rendering unknown | metadata | M1, Campaign Information |
| CD-18 | Parent Campaign (`Parent_Campaign`) | field 16 | lookup; rendering unknown | metadata | M1, Campaign Information |
| CD-19 | Record Id (`id`) | field 20 | bigint; rendering unknown | metadata | M1, Campaign Information |
| CD-20 | Last Activity Time (`Last_Activity_Time`) | field 21 | datetime; rendering unknown | metadata | M1, Campaign Information |
| CD-21 | Connected To (`Connected_To__s`) | field 23 | multi_module_lookup; rendering unknown | metadata | M1, Campaign Information |
| CD-22 | Description Information | section 2 | 1 configured columns | metadata | M1 |
| CD-23 | Description (`Description`) | field 1 | textarea; rendering unknown | metadata | M1, Description Information |

### Related-list configuration inventory

All M2 entries have `visible=true`; that is configuration, not observed visibility.
Sequence gaps are retained. Permission flags and relation API names do not establish
UI buttons, endpoint requests or availability. No metadata route was navigated.

| # | Related list | Configured sequence | API name | Source | Evidence |
| --- | --- | --- | --- | --- | --- |
| CD-24 | Locking Information | -1 | `Locking_Information__s` | metadata | M2 |
| CD-25 | Connected Records | 1 | `Connected_Records__s` | metadata | M2 |
| CD-26 | Notes | 2 | `Notes` | metadata | M2 |
| CD-27 | Child Campaigns | 3 | `Child_Campaigns` | metadata | M2 |
| CD-28 | Open Calls | 6 | `Calls` | metadata | M2 |
| CD-29 | Open Meetings | 7 | `Events` | metadata | M2 |
| CD-30 | Open Tasks | 8 | `Tasks` | metadata | M2 |
| CD-31 | Attachments | 9 | `Attachments` | metadata | M2 |
| CD-32 | Closed Tasks | 10 | `Tasks_History` | metadata | M2 |
| CD-33 | Closed Meetings | 11 | `Events_History` | metadata | M2 |
| CD-34 | Closed Calls | 12 | `Calls_History` | metadata | M2 |
| CD-35 | Leads | 15 | `Leads` | metadata | M2 |
| CD-36 | Deals | 16 | `Deals` | metadata | M2 |
| CD-37 | Contacts | 17 | `Contacts` | metadata | M2 |
| CD-38 | Checklists | 18 | `CheckLists` | metadata | M2 |

### Public-documentation and pattern inventory

The related-list descriptions below are documentation-only. Member Status is
supported for Leads/Contacts; the sources do not establish it for Deals.
No documented action was performed.

| # | Region / item | Documented capability or pattern; local rendering unknown | Source | Evidence |
| --- | --- | --- | --- | --- |
| CD-39 | Header: More | Opens campaign actions. | public docs | P1, Create Campaigns Individually → To clone campaigns |
| CD-40 | Header menu: Clone | Copies a campaign through a clone form. | public docs | P1, To clone campaigns |
| CD-41 | Header menu: Organize module details | Generic detail-page customization action, under top-right More; Campaigns availability unknown. | public docs | P3, Organize Page Details |
| CD-42 | Header: Edit | Candidate shared action only; Campaigns presence, position and enablement unknown. | pattern: accounts-record-detail.md:40 | AD-06 |
| CD-43 | Leads / Contacts members | Associate records and choose campaign Member Status. | public docs | P1, Add Leads/Contacts to the Campaign |
| CD-44 | Member Status update | Mass-update selected lead/contact members; distinct from Lead Status. | public docs | P1, Mass Update Campaign Member Status |
| CD-45 | Member filters | Filter Leads/Contacts by related-list fields. | public docs | P1, Filter Leads or Contacts |
| CD-46 | Deals | Lists deals attributed to the campaign; Member Status is unconfirmed. | public docs | P1, Associate Campaign with Other Records |
| CD-47 | Child Campaigns | Related list supports +New; selected leads/contacts can seed child campaigns. | public docs | P1, Create Child Campaigns |
| CD-48 | Open / Closed Activities | Documents open tasks/events and completed activities. | public docs | P1, Associate Campaign with Other Records |
| CD-49 | Activities: Calls | Generic activity association includes Log a Call; campaign-specific rendering unknown. | public docs | P2, Add Tasks, Events & Calls |
| CD-50 | Notes | Generic record notes support body, optional title and Save; Campaigns placement unknown. | public docs | P2, Add Notes; M2 supplies Campaigns relation separately |
| CD-51 | Attachments | Campaign-related documents. | public docs | P1, Associate Campaign with Other Records |

The generic P3 customization operation changes persisted preferences and is forbidden
in the reference CRM. Its inventory row describes documentation, not permission to
open or use it. Edit remains a pattern because the campaign-specific article does
not establish that button's header placement. No Delete, Share, Send Email or other
menu item is inferred from another module.

### Open questions

1. What is the actual header composition, record identity/business card, tag UI,
   navigation, Edit placement, More menu order, permission-dependent visibility and
   complete action set? Documentation proves only the capabilities cited above.
2. Are Overview and Timeline present, and what are their default states, filters,
   events, counters and empty states? Neither metadata nor these articles determines them.
3. Which configured fields render, in which columns/order, with what formatting,
   inline-edit affordances and empty values? Resolve the duplicate field sequence 16,
   Parent Campaign visibility and system/Connected To fields through future observation.
4. Which related lists actually render, in what rail/card order, with which counters,
   columns, paging, sorting, selection, row controls, hover actions and empty states?
   M2's visibility flags and sequence are insufficient to answer this.
5. Are activities grouped as Open/Closed Activities or split into Calls, Meetings
   and Tasks? How do history lists render? Public docs and metadata use different grouping.
6. Does Deals expose Member Status at all? Public docs establish that field only
   for Leads/Contacts; do not implement it for Deals from analogy.
7. What Member Status values/defaults and member permissions apply locally? What
   exact add/import/filter/update dialogs and validation states are available?
8. How are Child Campaigns, parent links, hierarchy depth/limits and member reuse
   presented in this account? The documented capability does not establish local UI.
9. Are Locking Information, Connected Records and Checklists visible or conditional?
   What are the actual Notes and Attachments controls, permissions and empty states?
10. What are the write-dependent validation, success/error messages, confirmation
    flows and resulting navigation? Not observable without a write; no such test
    is authorized. No network contract or guessed detail route is specified.

These questions record deferred observation, not a request to create reference data.
Revisit only if records become available independently and a later task authorizes
read-only observation. This document-only slice is complete within the CTO's scope;
no CD screenshot comparison is required.
