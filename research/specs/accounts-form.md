# Accounts — create and edit forms

## Purpose

Specify Accounts form differences and inventory every visible control. Reuse [contacts-form.md](contacts-form.md), [record-detail.md](record-detail.md), [accounts.md](accounts.md) and the shared lookup component (MEP-318). **Safety stop:** m3f-detail-base contains three Accounts/bulk POST calls when aggregated by path (statuses 200, 204, 200), exceeding the permitted two. Research stopped before Edit; only the mandatory no-click after capture followed. Edit form remains not observed. No record-write request was observed. Screenshots establish presence; no field was filled, option selected, search performed, or save/cancel action invoked. Metadata does not establish rendered behaviour.

## Layout

The shell surrounds an internally scrolling form. The fixed title strip says `Create Account`, followed by Edit Page Layout; its right group is Cancel, Save and New, Save. Account Image uses a building placeholder. Account Information has eight rows in two columns:

| Row | Left | Right |
| --- | --- | --- |
| 1 | Account Owner and user lookup | Rating |
| 2 | Account Name | Phone |
| 3 | Account Site | Fax |
| 4 | Parent Account and lookup icon | Website |
| 5 | Account Number | Ticker Symbol |
| 6 | Account Type | Ownership |
| 7 | Industry | Employees |
| 8 | Annual Revenue | SIC Code |

Account Name has a required input-edge marker. Owner is prefilled; no value is reproduced. Four picklists show -None-. All other observed create inputs are blank, without a visible placeholder. Annual Revenue has a TL prefix and an information icon at the right; the icon was not opened. Numeric fields render as single-line text inputs, with numeric semantics from metadata. No auxiliary icon is visible on Account Number, Employees, SIC Code, Website, Ticker Symbol or Account Site. Description is a multiline editor. Address content is recorded in the lower-form captures; the footer remains subject to the visibility limits below.

## Control inventory

Stable AF numbers are shared across captures. A Contacts ref establishes component reuse; `same` retains the referenced action’s observation limits. Label differences other than Contact/Account naming are explicitly described. Picker arrows belong to the select, not a separate button. Image-only controls are included even when controls.json omits them. Source reconciliation uses one-based item ordinals, never internal identifiers.

### Control inventory — m3f-list-base

Shell: SH-01–SH-46 as in [contacts.md](contacts.md); SH-15 is active, SH-14 inactive. SH-37 moves after additional Channels and Threads (AF-48–AF-49), when those are painted. SH-46 is image-only. No shell rows are repeated.

No form controls. Rest: as in m3-list-base ([accounts.md](accounts.md)); covered by the overlay: none. Differences: AF-48 Channels and AF-49 Threads appear between Chats and Contacts; row hover three-dots AL-45 and Phone handsets AL-62 are not painted in this capture. All other visible AL controls retain their inventory.

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AF-48 | Utility strip | Channels | icon button | left group, third | not observed | seen (m3f-list-base) | ? | new |
| AF-49 | Utility strip | Threads | icon button | left group, fourth | not observed | seen (m3f-list-base) | ? | new |
### Control inventory — m3f-create

Shell: SH-01–SH-46 as in [contacts.md](contacts.md); SH-15 is active, SH-14 inactive. SH-37 moves after additional Channels and Threads (AF-48–AF-49), when those are painted. SH-46 is image-only. No shell rows are repeated.

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AF-01 | Header | Edit Page Layout | link | title strip, after title | same | seen (m3f-create) | M11 | F-01 |
| AF-02 | Header | Cancel | button | right group, first | same | seen (m3f-create) | M3 | F-02 |
| AF-03 | Header | Save and New | button | right group, second | same | seen (m3f-create) | M3 | F-03 |
| AF-04 | Header | Save | button | right group, third | same | seen (m3f-create) | M3 | F-04 |
| AF-05 | Account Image | Account image placeholder | icon button | only image | same | seen (m3f-create) | M6 | F-05 |
| AF-06 | Account Information | Account Owner | select | left, row 1 | same | seen (m3f-create) | M3 | F-06 |
| AF-07 | Account Information | User lookup icon | icon button | left, row 1, input right edge | same | seen (m3f-create) | M3 | F-07 |
| AF-08 | Account Information | Account Name | input | left, row 2 | not observed | seen (m3f-create) | M3 | new |
| AF-09 | Account Information | Account Site | input | left, row 3 | not observed | seen (m3f-create) | M3 | new |
| AF-10 | Account Information | Parent Account | input | left, row 4 | not observed | seen (m3f-create) | M3 | new |
| AF-11 | Account Information | Account lookup icon | icon button | left, row 4, input right edge | Opens Choose Account; no selection made | seen (m3f-create) | M3 | F-11 moved |
| AF-12 | Account Information | Account Number | input | left, row 5 | not observed | seen (m3f-create) | M3 | new |
| AF-13 | Account Information | Account Type | select | left, row 6 | Opens searchable Account Type list; no option selected | seen (m3f-create) | M3 | new |
| AF-14 | Account Information | Industry | select | left, row 7 | not observed | seen (m3f-create) | M3 | new |
| AF-15 | Account Information | Annual Revenue | input | left, row 8, after TL prefix | not observed | seen (m3f-create) | M3 | new |
| AF-16 | Account Information | Information icon | icon button | left, row 8, input right edge | not observed | seen (m3f-create) | M3 | new |
| AF-17 | Account Information | Rating | select | right, row 1 | not observed | seen (m3f-create) | M3 | new |
| AF-18 | Account Information | Phone | input | right, row 2 | same | seen (m3f-create) | M3 | F-13 moved |
| AF-19 | Account Information | Fax | input | right, row 3 | same | seen (m3f-create) | M3 | F-24 moved |
| AF-20 | Account Information | Website | input | right, row 4 | not observed | seen (m3f-create) | M3 | new |
| AF-21 | Account Information | Ticker Symbol | input | right, row 5 | not observed | seen (m3f-create) | M3 | new |
| AF-22 | Account Information | Ownership | select | right, row 6 | not observed | seen (m3f-create) | M3 | new |
| AF-23 | Account Information | Employees | input | right, row 7 | not observed | seen (m3f-create) | M3 | new |
| AF-24 | Account Information | SIC Code | input | right, row 8 | not observed | seen (m3f-create) | M3 | new |
| AF-47 | Right edge | Client Script | tab | page right edge | same | seen (m3f-create) | M11 | F-57 |
| AF-48 | Utility strip | Channels | icon button | left group, third | not observed | seen (m3f-create) | ? | new |
| AF-49 | Utility strip | Threads | icon button | left group, fourth | not observed | seen (m3f-create) | ? | new |

Copy Address is partially clipped at the lower boundary: AF-25 is visible only as its upper edge here; its complete rendering is in m3f-create-billing-state. AF-26–AF-46 are below this viewport.

Absent here: F-08–F-10, F-12, F-14–F-23, F-25–F-32. F-11 is reused at the Parent Account position rather than the Contacts Account Name position. F-13 and F-24 are reused at new positions. F-43 and F-53 have no assigned control row in the source specification.

### Control inventory — m3f-create-type

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AF-13.1 | Account Type list | Search | input | popup, above options | not observed | seen (m3f-create-type) | M3 | new |
| AF-13.2 | Account Type list | -None- | menu item | popup, option 1 | not observed | seen (m3f-create-type) | M3 | new |
| AF-13.3 | Account Type list | Analyst | menu item | popup, option 2 | not observed | seen (m3f-create-type) | M3 | new |
| AF-13.4 | Account Type list | Competitor | menu item | popup, option 3 | not observed | seen (m3f-create-type) | M3 | new |
| AF-13.5 | Account Type list | Customer | menu item | popup, option 4 | not observed | seen (m3f-create-type) | M3 | new |
| AF-13.6 | Account Type list | Distributor | menu item | popup, option 5 | not observed | seen (m3f-create-type) | M3 | new |
| AF-13.7 | Account Type list | Integrator | menu item | popup, option 6 | not observed | seen (m3f-create-type) | M3 | new |
| AF-13.8 | Account Type list | Investor | menu item | popup, option 7 | not observed | seen (m3f-create-type) | M3 | new |

Rest: as in m3f-create; covered by the overlay: AF-08–AF-12. The popup sits above AF-13; -None- is checked. Other options are outside its visible list viewport; use accounts.md › Picklists for the complete catalog. Channels and Threads are not painted in this image.

### Control inventory — m3f-create-parent

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AF-11.1 | Parent Account popup | Close cross | icon button | header, far right | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.2 | Parent Account popup | Search by Account Name | input | below title, left | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.3 | Parent Account popup | New Account | button | below title, right | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.4 | Parent Account popup | Table with down arrow icon | icon button | table header, first | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.5 | Parent Account popup | Account Name | column header | table header, text column 1 | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.6 | Parent Account popup | Column options | icon button | text column 1, right | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.7 | Parent Account popup | Phone | column header | table header, text column 2 | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.8 | Parent Account popup | Column options | icon button | text column 2, right | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.9 | Parent Account popup | Website | column header | table header, text column 3 | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.10 | Parent Account popup | Column options | icon button | text column 3, right | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.11 | Parent Account popup | Account Owner | column header | table header, text column 4 | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.12 | Parent Account popup | Column options | icon button | text column 4, right | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.13 | Parent Account popup | Filter | icon button | table header, far right | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.14 | Parent Account popup | Row selection circle | toggle | each visible row, first | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.15 | Parent Account popup | Account record link | link | each visible row, Account Name | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.16 | Parent Account popup | Phone handset icon | icon button | populated Phone cells, after value | not observed | seen (m3f-create-parent) | M5 | new |
| AF-11.17 | Parent Account popup | Previous | icon button | footer, right group, first | not observed | seen (m3f-create-parent) | M3 | new |
| AF-11.18 | Parent Account popup | Next | icon button | footer, right group, second | not observed | seen (m3f-create-parent) | M3 | new |

Rest: as in m3f-create; covered by the overlay: AF-01–AF-12, AF-17–AF-21 and the upper part of AF-47. The popup also covers part of the shell. All underlying controls are inactive under the overlay. AF-13–AF-16 and AF-22–AF-24 remain visible below it. Channels and Threads are not painted.

### Control inventory — m3f-create-billing-state

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AF-25 | Address Information | Copy Address | button | section heading, right | same | seen (m3f-create-billing-state) | M3 | F-33 |
| AF-26 | Billing Address | Country / Region | select | left, row 1 | same | seen (m3f-create-billing-state) | M3 | F-34 |
| AF-27 | Billing Address | Flat / House No./ Building / Apartment Name | input | left, row 2 | same | seen (m3f-create-billing-state) | M3 | F-35 |
| AF-28 | Billing Address | Street Address | input | left, row 3 | same | seen (m3f-create-billing-state) | M3 | F-36 |
| AF-29 | Billing Address | City | input | left, row 4 | same | seen (m3f-create-billing-state) | M3 | F-37 |
| AF-30 | Billing Address | State / Province | select | left, row 5 | same | seen (m3f-create-billing-state) | M3 | F-38 |
| AF-32 | Billing Address | Latitude | input | left, coordinates, left | same | seen (m3f-create-billing-state) | M3 | F-40 |
| AF-33 | Billing Address | Longitude | input | left, coordinates, right | same | seen (m3f-create-billing-state) | M3 | F-41 |
| AF-34 | Billing Address | Clear All | button | left, after coordinates, right | same | seen (m3f-create-billing-state) | M3 | F-42 |
| AF-35 | Shipping Address | Country / Region | select | right, row 1 | same | seen (m3f-create-billing-state) | M3 | F-44 |
| AF-36 | Shipping Address | Flat / House No./ Building / Apartment Name | input | right, row 2 | same | seen (m3f-create-billing-state) | M3 | F-45 |
| AF-37 | Shipping Address | Street Address | input | right, row 3 | same | seen (m3f-create-billing-state) | M3 | F-46 |
| AF-38 | Shipping Address | City | input | right, row 4 | same | seen (m3f-create-billing-state) | M3 | F-47 |
| AF-39 | Shipping Address | State / Province | select | right, row 5 | same | seen (m3f-create-billing-state) | M3 | F-48 |
| AF-40 | Shipping Address | Zip / Postal Code | input | right, row 6 | same | seen (m3f-create-billing-state) | M3 | F-49 |
| AF-41 | Shipping Address | Latitude | input | right, coordinates, left | same | seen (m3f-create-billing-state) | M3 | F-50 |
| AF-42 | Shipping Address | Longitude | input | right, coordinates, right | same | seen (m3f-create-billing-state) | M3 | F-51 |
| AF-43 | Shipping Address | Clear All | button | right, after coordinates, right | same | seen (m3f-create-billing-state) | M3 | F-52 |
| AF-44 | Description Information | Description | input | single multiline editor | same | seen (m3f-create-billing-state) | M3 | F-54 |
| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AF-30.1 | Billing State / Province list | -None- | menu item | popup, only visible option | not observed | seen (m3f-create-billing-state) | M3 | new |

Rest: as in m3f-create; covered by the overlay: AF-31. AF-31 is reconciled as covered in this screenshot; its unobscured input is seen in m3f-create-shipping-country. This permitted opening scrolls the form to the address section, so AF-05–AF-24 are outside the viewport. The title strip and Client Script remain fixed. The state list contains only -None- with no search painted while Country / Region is unset. Channels and Threads are not painted.

### Control inventory — m3f-create-shipping-country

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AF-25 | Address Information | Copy Address | button | section heading, right | same | seen (m3f-create-shipping-country) | M3 | F-33 |
| AF-26 | Billing Address | Country / Region | select | left, row 1 | same | seen (m3f-create-shipping-country) | M3 | F-34 |
| AF-27 | Billing Address | Flat / House No./ Building / Apartment Name | input | left, row 2 | same | seen (m3f-create-shipping-country) | M3 | F-35 |
| AF-28 | Billing Address | Street Address | input | left, row 3 | same | seen (m3f-create-shipping-country) | M3 | F-36 |
| AF-29 | Billing Address | City | input | left, row 4 | same | seen (m3f-create-shipping-country) | M3 | F-37 |
| AF-30 | Billing Address | State / Province | select | left, row 5 | same | seen (m3f-create-shipping-country) | M3 | F-38 |
| AF-31 | Billing Address | Zip / Postal Code | input | left, row 6 | same | seen (m3f-create-shipping-country) | M3 | F-39 |
| AF-32 | Billing Address | Latitude | input | left, coordinates, left | same | seen (m3f-create-shipping-country) | M3 | F-40 |
| AF-33 | Billing Address | Longitude | input | left, coordinates, right | same | seen (m3f-create-shipping-country) | M3 | F-41 |
| AF-35 | Shipping Address | Country / Region | select | right, row 1 | same | seen (m3f-create-shipping-country) | M3 | F-44 |
| AF-40 | Shipping Address | Zip / Postal Code | input | right, row 6 | same | seen (m3f-create-shipping-country) | M3 | F-49 |
| AF-41 | Shipping Address | Latitude | input | right, coordinates, left | same | seen (m3f-create-shipping-country) | M3 | F-50 |
| AF-42 | Shipping Address | Longitude | input | right, coordinates, right | same | seen (m3f-create-shipping-country) | M3 | F-51 |
| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AF-35.1 | Shipping Country / Region list | Search | input | popup, above options | same | seen (m3f-create-shipping-country) | M3 | F-34.1 moved |
| AF-35.2 | Shipping Country / Region list | -None- | menu item | popup, option 1 | same | seen (m3f-create-shipping-country) | M3 | F-34.2 moved |
| AF-35.3 | Shipping Country / Region list | Afghanistan | menu item | popup, option 2 | same | seen (m3f-create-shipping-country) | M3 | F-34.3 moved |
| AF-35.4 | Shipping Country / Region list | Aland Islands | menu item | popup, option 3 | same | seen (m3f-create-shipping-country) | M3 | F-34.4 moved |
| AF-35.5 | Shipping Country / Region list | Albania | menu item | popup, option 4 | same | seen (m3f-create-shipping-country) | M3 | F-34.5 moved |
| AF-35.6 | Shipping Country / Region list | Algeria | menu item | popup, option 5 | same | seen (m3f-create-shipping-country) | M3 | F-34.6 moved |
| AF-35.7 | Shipping Country / Region list | American Samoa | menu item | popup, option 6 | same | seen (m3f-create-shipping-country) | M3 | F-34.7 moved |
| AF-35.8 | Shipping Country / Region list | Andorra | menu item | popup, option 7 | same | seen (m3f-create-shipping-country) | M3 | F-34.8 moved |

Rest: as in m3f-create; covered by the overlay: AF-36–AF-39. Scrolling leaves AF-13–AF-16 and AF-22–AF-24 visible above the address section, while AF-05–AF-12 and AF-17–AF-21 are outside the viewport. AF-34 and AF-43 are below the clipping boundary; AF-44–AF-46 are outside the viewport. Channels and Threads are not painted. Country and state catalogs are referenced from contacts.md, not repeated.

### Control inventory — m3f-detail-base

No inventory by task scope: this capture establishes the Edit selector source only. The screenshot was inspected. Safety stop: Accounts/bulk path aggregate is three, above the two-call limit; no Edit click followed. Detail inventory belongs to the separate detail task. Source controls are outside this form inventory’s scope rather than silently counted as form exclusions.

### Control inventory — m3f-edit

Not captured: safety stop in m3f-detail-base. No observed Edit form inventory, title, fields, buttons or footer is claimed.

### Control inventory — m3f-list-after

| # | Region | Control | Type | Position | What it does | Source | Module | Contacts ref |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AL-62 | Table | Phone handset icon | icon button | populated Phone cells, after value | not observed | seen (m3f-list-after) | M5 | new |

Rest: as in m3f-list-base; covered by the overlay: none. Final count is 373, unchanged. Channels and Threads (AF-48–AF-49) are not painted; SH-37 returns to the third utility position. AL-62 Phone handset icons are now painted after each populated Phone value, as in accounts.md; they are image-only. No row three-dots AL-45 appears. Source reconciliation is recorded below.

## Edit form

Not observed. The record detail showed an Edit action, but the preceding capture exceeded the permitted non-GET path count. Create fields are not asserted to be identical to edit; titles, actions, required markers, population and edit-only controls remain open.

## Parent Account lookup

The field is a blank text input with a building lookup icon at its right edge. Its opener reveals `Choose Account`, with a close cross, Search by Account Name, New Account, a table and previous/next footer arrows. The table has a selection column with a table/down-arrow icon, then Account Name, Phone, Website, Account Owner. Each text header has its own column-options icon; Filter sits at the far right. Visible rows have a circular single-selection control and Account Name link; populated Phone cells have a handset icon. Record values are intentionally omitted. No selection, filter, new record, search, close or pagination action was exercised. Use the shared lookup component defined by MEP-318; Contacts form lookup contents were not visually observed, so these popup rows cannot be assigned invented Contacts numbers.

Metadata confirms Accounts as the target and Member Accounts as the reverse relation. Cycle prevention, parent eligibility, suggestion behaviour, selected-value replacement and validation are not observed.

## Address groups vs Contacts

Billing Address replaces Mailing Address on the left; Shipping Address replaces Other Address on the right. Both retain the field sequence in Contacts F-34–F-42 and F-44–F-52: Country / Region; Flat / House No./ Building / Apartment Name; Street Address; City; State / Province; Zip / Postal Code; Coordinates (Latitude then Longitude); Clear All. Clear All is rendered at each group’s lower right and was not clicked. Its source has button semantics although the Contacts evidence calls it link-like. There is no independent input for the aggregate Address or Coordinates metadata fields.

Copy Address reuses F-33, at the right of Address Information. Its direction choices and copy result remain not observed: opening that menu is outside this task’s allowed clicks. Do not infer Billing → Shipping or Shipping → Billing menu labels. Both group labels and field identifiers change; the field control labels and within-group positions remain the Contacts equivalents. Coordinates inputs have Latitude and Longitude placeholders; other address text fields are blank with no visible placeholder. Countries initially show -None-; the unselected Billing state opening shows only -None-, with no search box. Dependency behaviour after changing a country was not exercised. The country popup uses the Contacts search and first seven visible options; exported catalogs are identical according to accounts.md.

## Differences from the Contact form

- Account image is a building placeholder instead of the Contact portrait; no upload menu was opened.
- Required Account Name replaces the Contact name controls; no salutation/first/last-name controls appear.
- Parent Account self-lookup replaces the incoming Account Name relationship; no Vendor Name or Reporting To field appears.
- Accounts uses the eight-row Account Information grid above, including four Accounts picklists and currency/numeric controls. Phone and Fax move to the right column.
- Billing/Shipping group labels replace Mailing/Other without changing their field sequence.
- Description is visually verified in the Billing state capture; Contacts F-54 was only an unobserved label/placeholder. Both Clear All controls are visually verified here while Contacts F-42/F-52 lacked a screenshot.
- Create footer is present only in accessible/control evidence, not a verified screenshot. Edit remains not observed.

## Form fields vs metadata

Every observed field matches accounts.md › Field dictionary. `Observed` below refers to a screenshot; footer controls are not data fields. Composite Address and Coordinates entries are groups, not extra editors.

| Form field | Metadata API name | Metadata type | Evidence / inventory |
| --- | --- | --- | --- |
| Billing Address - Latitude | Billing_Latitude | double | Observed; AF-32 |
| Billing Address - Longitude | Billing_Longitude | double | Observed; AF-33 |
| Shipping Address - Latitude | Shipping_Latitude | double | Observed; AF-41 |
| Shipping Address - Longitude | Shipping_Longitude | double | Observed; AF-42 |
| Account Owner | Owner | ownerlookup | Observed; AF-06 |
| Rating | Rating | picklist | Observed; AF-17 |
| Account Name | Account_Name | text | Observed; AF-08 |
| Phone | Phone | phone | Observed; AF-18 |
| Account Site | Account_Site | text | Observed; AF-09 |
| Fax | Fax | text | Observed; AF-19 |
| Parent Account | Parent_Account | lookup | Observed; AF-10 |
| Website | Website | website | Observed; AF-20 |
| Account Number | Account_Number | bigint | Observed; AF-12 |
| Ticker Symbol | Ticker_Symbol | text | Observed; AF-21 |
| Account Type | Account_Type | picklist | Observed; AF-13 |
| Ownership | Ownership | picklist | Observed; AF-22 |
| Industry | Industry | picklist | Observed; AF-14 |
| Employees | Employees | integer | Observed; AF-23 |
| Annual Revenue | Annual_Revenue | currency | Observed; AF-15 |
| SIC Code | SIC_Code | integer | Observed; AF-24 |
| Description | Description | textarea | Observed; AF-44 |
| Account Image | Record_Image | profileimage | Observed; AF-05 |
| Billing Address - Country / Region | Billing_Country | picklist | Observed; AF-26 |
| Billing Address - Flat / House No./ Building / Apartment Name | Billing_Flat_House_No_Building_Apartment_Name | text | Observed; AF-27 |
| Billing Address - Street Address | Billing_Street | text | Observed; AF-28 |
| Billing Address - City | Billing_City | text | Observed; AF-29 |
| Billing Address - State / Province | Billing_State | picklist | Observed; AF-30 |
| Billing Address - Zip / Postal Code | Billing_Code | text | Observed; AF-31 |
| Shipping Address - Country / Region | Shipping_Country | picklist | Observed; AF-35 |
| Shipping Address - Flat / House No./ Building / Apartment Name | Shipping_Flat_House_No_Building_Apartment_Name | text | Observed; AF-36 |
| Shipping Address - Street Address | Shipping_Street | text | Observed; AF-37 |
| Shipping Address - City | Shipping_City | text | Observed; AF-38 |
| Shipping Address - State / Province | Shipping_State | picklist | Observed; AF-39 |
| Shipping Address - Zip / Postal Code | Shipping_Code | text | Observed; AF-40 |
| Billing Address (group) | Billing_Address | textarea | Observed grouping; no independent editor |
| Billing Address - Coordinates (group) | Billing_Coordinates | textarea | Observed grouping; no independent editor |
| Shipping Address (group) | Shipping_Address | textarea | Observed grouping; no independent editor |
| Shipping Address - Coordinates (group) | Shipping_Coordinates | textarea | Observed grouping; no independent editor |

Form field absent from metadata: none. Create-enabled metadata absent from observed form: Connected To (Connected_To__s, multi-module lookup); no corresponding form control was found in screenshot or accessible evidence. Edit-enabled metadata absence cannot be evaluated because Edit was not captured. Non-create system fields Created By, Modified By, Created Time, Modified Time, Last Activity Time, Tag and Record Id are not shown as create editors; Change Log Time, Locked, Last Enriched Time, Enrich Status and Distance are outside the configured layout.

## Capability table

| Capability | Inventory | Module | Reused from Contacts / Accounts-specific |
| --- | --- | --- | --- |
| Form header and common actions | AF-01–AF-04 | M3 / M11 | Contacts reused; module title changes; actions unexercised |
| Record image | AF-05 | M6 | Shared control, Accounts building placeholder |
| Owner and common fields | AF-06–AF-07, AF-18–AF-19 | M3 | Contacts reused; Phone/Fax moved |
| Name and Accounts field set | AF-08–AF-10, AF-12–AF-24 | M3 | Accounts-specific labels and ordering |
| Parent lookup | AF-11, AF-11.1–AF-11.18 | M3 / M5 | Shared MEP-318 component; Accounts target and columns |
| Address groups / copy / clear | AF-25–AF-43 | M3 | Contacts reused; Billing/Shipping labels; write results not observed |
| Description | AF-44 | M3 | Contacts reused; rendering now observed |
| Custom form footer / client script | AF-45–AF-47 | M11 | Contacts reused; footer not visually observed |
| Channels / Threads | AF-48–AF-49 | ? | Shell controls missing from source inventory |
| Save, validation and duplicates | AF-03–AF-04 | M3 | Shared documented limits in leads-write-behaviour.md and duplicates.md; no Accounts write observation |

## Capture refs

| Slug | Requested clicks | Skipped | What it shows |
| --- | --- | --- | --- |
| m3f-list-base | 0 | 0 | Initial list, total 373 |
| m3f-create | 0 | 0 | Upper create form |
| m3f-create-type | 1 | 0 | Searchable Account Type list |
| m3f-create-parent | 1 | 0 | Choose Account popup |
| m3f-create-billing-state | 1 | 0 | Lower address groups and Description; only -None- state item |
| m3f-create-shipping-country | 1 | 0 | Shipping country popup and unobscured Billing zip input |
| m3f-detail-base | 1 | 0 | Record detail; safety stop |
| m3f-edit | — | — | Not captured because safety stop |
| m3f-list-after | 0 | 0 | Final list, total 373 (same as base) |

All captured screenshots were opened as images. Non-GET checks aggregate counts by path, including separate network entries with distinct queries: this is why detail’s three Accounts/bulk entries trigger the stop despite each entry count being one. Create baseline has one shell triggers call and no extra non-GET baseline path. Create-type/state/country each have that one shell call; Parent additionally has one Accounts/bulk lookup read. List reads are the three permitted list paths once each plus shell triggers once. Reminder/notification and any telemetry calls are blocked. No record-write call was observed. No further capture was attempted after the detail stop except list-after.

## Shell controls missing from app-shell.md

AF-48 Channels and AF-49 Threads appear only in m3f-list-base and m3f-create. They sit between Chats and Contacts; subsequent screenshots show only My Pins, Chats, Contacts. No shell preference was clicked. Their cause of appearance/disappearance, function and module ownership are not observed; preserve ? pending lead classification.

## Open questions

- Safety decision required through the lead/CTO path: detail opening produced three Accounts/bulk calls versus the authorized two. Determine whether a revised capture contract may permit this path/count before any Edit research resumes. This spec does not grant an exception.
- Edit form is wholly unobserved; do not infer its title, buttons, fields, requirements or footer from create.
- Create Form Views / Standard View (AF-45) and Create a custom form page (AF-46) exist in source control evidence but are outside every permitted screenshot viewport. Footer placement/rendering remains unobserved; no extra scroll-opening click was invented.
- Copy Address direction labels/results, Clear All results, image upload/menu, revenue information tooltip, country/state dependence after a change, lookup search/selection, hover-only controls, validation and save results remain not observed. Existing documented rules in leads-write-behaviour.md and duplicates.md are shared references, not Accounts screenshots.
- Connected To is create-enabled metadata without a captured form control; conditional visibility is unresolved.
- Shell Channels/Threads and inherited ? shell functions need module classification.

## Source control reconciliation

Each one-based controls.json ordinal is mapped below. Exclusions describe zero-area/invisible, out-of-viewport or covered elements, duplicate structural wrappers and record data. Image-only AF-16, AF-44, popup Phone handsets, SH-46 and list Phone handsets supplement the source mapping. AF-45–AF-46 are reserved as unobserved footer controls, not painted inventory.

### m3f-list-base

| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 37, 51, 59, 62, 82–83, 87, 111, 120, 129–130, 136, 141, 155, 172–173, 254–255, 259–261, 263–264, 273–274, 419, 421, 424, 590 |
| SH-01 | 2–4 |
| Excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 135, 139, 252–253, 257–258, 561–569, 574–589 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| Excluded: outside captured viewport | 65–80, 174–251, 430–431, 433, 436, 442–443, 445, 448, 454–455, 457, 460, 466–467, 469, 472, 478–479, 481, 484, 489, 491–492, 494, 497, 503–504, 506, 509, 515–516, 518, 521, 527–528, 530, 533, 539–540, 542, 545, 550, 552–553, 555, 558 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| AL-01 | 112 |
| AL-52 | 113 |
| AL-02 | 114–117 |
| AL-03 | 118 |
| AL-04 | 119 |
| AL-05 | 121 |
| AL-06 | 122 |
| AL-07 | 123 |
| AL-08 | 124 |
| AL-09 | 125 |
| AL-10 | 126 |
| AL-11 | 127–128 |
| AL-12 | 131 |
| AL-13 | 132–133 |
| AL-14 | 134 |
| AL-15 | 137–138 |
| AL-16 | 140 |
| AL-20 | 142–143 |
| AL-21 | 144–145 |
| AL-22 | 146–147 |
| AL-23 | 148–149 |
| AL-24 | 150–151 |
| AL-25 | 152–153 |
| AL-26 | 154 |
| AL-27 | 156–157 |
| AL-53 | 158–159 |
| AL-54 | 160–161 |
| AL-55 | 162–163 |
| AL-56 | 164–165 |
| AL-57 | 166–167 |
| AL-58 | 168–169 |
| AL-59 | 170–171 |
| AL-33 | 256 |
| Excluded: record row data or table structure | 262, 275–276, 278, 281, 283–284, 286–290, 293, 295–296, 298–301, 303, 306, 308–309, 311–314, 316, 319, 321–322, 324–327, 329, 332, 334–339, 341, 344, 346–347, 349–352, 354, 357, 359–360, 362–365, 367, 370, 372–373, 375–378, 380, 383, 385–386, 388–392, 395, 397–398, 400–403, 405, 408, 410–411, 413–417, 420, 422–423, 425–429, 432, 434–435, 437–441, 444, 446–447, 449–453, 456, 458–459, 461–465, 468, 470–471, 473–477, 480, 482–483, 485–488, 490, 493, 495–496, 498–502, 505, 507–508, 510–514, 517, 519–520, 522–526, 529, 531–532, 534–538, 541, 543–544, 546–549, 551, 554, 556–557, 559–560 |
| AL-34 | 265–266 |
| AL-35 | 267 |
| AL-36 | 268–269 |
| AL-39 | 270 |
| AL-60 | 271 |
| AL-61 | 272 |
| AL-46 | 277, 302, 315, 328, 340, 353, 366, 379, 404 |
| AL-40 | 279–280, 291–292, 304–305, 317–318, 330–331, 342–343, 355–356, 368–369, 381–382, 393–394, 406–407 |
| AL-42 | 282, 294, 307, 320, 333, 345, 358, 371, 384, 396, 409 |
| AL-63 | 285, 297, 310, 323, 348, 361, 374, 387, 399, 412 |
| Excluded: row below list clipping boundary | 418 |
| AL-48 | 570 |
| AL-49 | 571 |
| AL-50 | 572 |
| AL-51 | 573 |
| SH-35 | 591 |
| SH-36 | 592 |
| AF-48 | 593 |
| AF-49 | 594 |
| SH-37 | 595 |
| SH-38 | 596 |
| SH-39 | 597 |
| SH-40 | 598 |
| SH-41 | 599 |
| SH-42 | 600 |
| SH-43 | 601 |
| SH-44 | 602 |
| SH-45 | 603 |

603 source items; 94 source-backed inventory numbers; 413 excluded items.

### m3f-create

| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 37, 51, 59, 62, 82–83, 86, 107–108, 111–112, 114, 116, 123–124, 126, 130, 132, 134–135, 139, 145, 151, 153, 155, 157, 161, 163, 165, 243 |
| SH-01 | 2–4 |
| Excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 118–122, 138, 147–148, 180, 183, 187, 201, 204, 208, 217–226, 228–242 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| Excluded: outside captured viewport | 65–80, 106, 167–179, 181–182, 184–186, 188–200, 202–203, 205–207, 209, 211–216 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| AF-01 | 109–110 |
| AF-04 | 113 |
| AF-03 | 115 |
| AF-02 | 117 |
| AF-05 | 125 |
| AF-07 | 127 |
| AF-06 | 128–129 |
| AF-08 | 131 |
| AF-09 | 133 |
| AF-10 | 136 |
| AF-11 | 137 |
| AF-12 | 140 |
| AF-13 | 141–142 |
| AF-14 | 143–144 |
| AF-15 | 146 |
| AF-17 | 149–150 |
| AF-18 | 152 |
| AF-19 | 154 |
| AF-20 | 156 |
| AF-21 | 158 |
| AF-22 | 159–160 |
| AF-23 | 162 |
| AF-24 | 164 |
| Excluded: below form clipping boundary | 166 |
| Excluded: invisible one-pixel Description placeholder | 210 |
| AF-47 | 227 |
| SH-35 | 244 |
| SH-36 | 245 |
| AF-48 | 246 |
| AF-49 | 247 |
| SH-37 | 248 |
| SH-38 | 249 |
| SH-39 | 250 |
| SH-40 | 251 |
| SH-41 | 252 |
| SH-42 | 253 |
| SH-43 | 254 |
| SH-44 | 255 |
| SH-45 | 256 |

256 source items; 71 source-backed inventory numbers; 153 excluded items.

### m3f-create-type

| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 37, 51, 59, 62, 82–83, 86, 107–108, 111–112, 114, 116, 123–124, 126, 130, 132, 134–135, 139, 145, 151, 153, 155, 157, 161, 163, 165, 242, 256 |
| SH-01 | 2–4 |
| Excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 118–122, 138, 147–148, 180, 183, 187, 201, 204, 208, 217–226, 228–241, 254 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| Excluded: outside captured viewport | 65–80, 106, 167–179, 181–182, 184–186, 188–200, 202–203, 205–207, 209, 211–216 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| AF-01 | 109–110 |
| AF-04 | 113 |
| AF-03 | 115 |
| AF-02 | 117 |
| AF-05 | 125 |
| AF-07 | 127 |
| AF-06 | 128–129 |
| Excluded: covered by Account Type popup | 131, 133, 136–137, 140 |
| AF-13 | 141–142 |
| AF-14 | 143–144 |
| AF-15 | 146 |
| AF-17 | 149–150 |
| AF-18 | 152 |
| AF-19 | 154 |
| AF-20 | 156 |
| AF-21 | 158 |
| AF-22 | 159–160 |
| AF-23 | 162 |
| AF-24 | 164 |
| Excluded: below form clipping boundary | 166 |
| Excluded: invisible one-pixel Description placeholder | 210 |
| AF-47 | 227 |
| SH-35 | 243 |
| SH-36 | 244 |
| SH-37 | 245 |
| SH-38 | 246 |
| SH-39 | 247 |
| SH-40 | 248 |
| SH-41 | 249 |
| SH-42 | 250 |
| SH-43 | 251 |
| SH-44 | 252 |
| SH-45 | 253 |
| AF-13.1 | 255 |
| AF-13.2 | 257 |
| AF-13.3 | 258 |
| AF-13.4 | 259 |
| AF-13.5 | 260 |
| AF-13.6 | 261 |
| AF-13.7 | 262 |
| AF-13.8 | 263 |
| Excluded: options outside popup viewport | 264–270 |

270 source items; 72 source-backed inventory numbers; 166 excluded items.

### m3f-create-parent

| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 37, 51, 59, 62, 82–83, 86, 107–108, 111–112, 114, 116, 123–124, 126, 130, 132, 134–135, 139, 145, 151, 153, 155, 157, 161, 163, 165, 244, 257, 259, 261, 265, 285, 296, 307, 318, 329, 340, 351, 362, 373, 393–394 |
| Excluded: covered or inactive under lookup overlay | 2–4, 10–11, 13–14, 16–17, 19–20, 22–23, 25–26, 28–31, 33–36, 38–50, 52–58, 60–61, 63–64, 84–85, 87–89, 92, 95, 98–99, 102–105, 109–110, 113, 115, 117, 125, 127–129, 131, 133, 136–137, 140, 149–150, 152, 154, 156, 158, 245–255 |
| Excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 118–122, 138, 147–148, 180, 183, 187, 201, 204, 208, 217–228, 230–243, 256, 263, 280–281 |
| Excluded: outside captured viewport | 65–80, 106, 167–179, 181–182, 184–186, 188–200, 202–203, 205–207, 209, 211–216 |
| AF-13 | 141–142 |
| AF-14 | 143–144 |
| AF-15 | 146 |
| AF-22 | 159–160 |
| AF-23 | 162 |
| AF-24 | 164 |
| Excluded: below form clipping boundary | 166 |
| Excluded: invisible one-pixel Description placeholder | 210 |
| AF-47 | 229 |
| AF-11.1 | 258 |
| AF-11.2 | 260 |
| AF-11.3 | 262 |
| AF-11.13 | 264 |
| Excluded: duplicate table structure | 266–267, 269, 279 |
| Excluded: record row data or table structure | 268, 282–284, 287–288, 290–295, 298–299, 301–306, 309–310, 312–317, 320–321, 323–328, 331–332, 334–339, 342–343, 345–350, 353–354, 356–361, 364–365, 367–372, 375–376, 378–381 |
| AF-11.4 | 270 |
| AF-11.5 | 271 |
| AF-11.6 | 272 |
| AF-11.7 | 273 |
| AF-11.8 | 274 |
| AF-11.9 | 275 |
| AF-11.10 | 276 |
| AF-11.11 | 277 |
| AF-11.12 | 278 |
| AF-11.14 | 286, 297, 308, 319, 330, 341, 352, 363, 374 |
| AF-11.15 | 289, 300, 311, 322, 333, 344, 355, 366, 377 |
| Excluded: record row below popup clipping boundary | 382–392 |
| AF-11.17 | 395 |
| AF-11.18 | 396 |

396 source items; 24 source-backed inventory numbers; 353 excluded items.

### m3f-create-billing-state

| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 37, 51, 59, 62, 82–83, 86, 108, 111–112, 114, 116, 165, 167, 170, 172, 174, 178, 188, 191, 193, 195, 199, 209–210, 244, 246 |
| SH-01 | 2–4 |
| Excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 118–122, 138, 147–148, 180, 183, 187, 201, 204, 208, 218–227, 229–243 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| Excluded: outside captured viewport | 65–80, 106–107, 123–137, 139–146, 149–164, 212–217 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| AF-01 | 109–110 |
| AF-04 | 113 |
| AF-03 | 115 |
| AF-02 | 117 |
| Excluded: behind fixed form header | 166 |
| AF-26 | 168–169 |
| AF-27 | 171 |
| AF-28 | 173 |
| AF-29 | 175 |
| AF-30 | 176–177 |
| Excluded: covered by Billing state popup | 179 |
| AF-32 | 181–182 |
| AF-33 | 184–185 |
| AF-34 | 186 |
| AF-35 | 189–190 |
| AF-36 | 192 |
| AF-37 | 194 |
| AF-38 | 196 |
| AF-39 | 197–198 |
| AF-40 | 200 |
| AF-41 | 202–203 |
| AF-42 | 205–206 |
| AF-43 | 207 |
| AF-44 | 211 |
| AF-47 | 228 |
| AF-30.1 | 245 |
| SH-35 | 247 |
| SH-36 | 248 |
| SH-37 | 249 |
| SH-38 | 250 |
| SH-39 | 251 |
| SH-40 | 252 |
| SH-41 | 253 |
| SH-42 | 254 |
| SH-43 | 255 |
| SH-44 | 256 |
| SH-45 | 257 |

257 source items; 69 source-backed inventory numbers; 153 excluded items.

### m3f-create-shipping-country

| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 37, 51, 59, 62, 82–83, 86, 108, 111–112, 114, 116, 134–135, 139, 145, 155, 157, 161, 163, 165, 167, 170, 172, 174, 178, 188, 191, 193, 195, 199, 243, 256 |
| SH-01 | 2–4 |
| Excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 90–91, 93–94, 96–97, 100–101, 118–122, 138, 147–148, 180, 183, 187, 201, 204, 208, 217–226, 228–242 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| Excluded: outside captured viewport | 65–80, 106–107, 123–133, 149–154, 207, 209, 211–216 |
| SH-26 | 84 |
| SH-27 | 85 |
| SH-28 | 87 |
| SH-29 | 88 |
| SH-30 | 89 |
| SH-31 | 92 |
| SH-32 | 95 |
| SH-33 | 98–99 |
| SH-34 | 102–105 |
| AF-01 | 109–110 |
| AF-04 | 113 |
| AF-03 | 115 |
| AF-02 | 117 |
| Excluded: behind fixed form header | 136–137, 140, 156, 158 |
| AF-13 | 141–142 |
| AF-14 | 143–144 |
| AF-15 | 146 |
| AF-22 | 159–160 |
| AF-23 | 162 |
| AF-24 | 164 |
| AF-25 | 166 |
| AF-26 | 168–169 |
| AF-27 | 171 |
| AF-28 | 173 |
| AF-29 | 175 |
| AF-30 | 176–177 |
| AF-31 | 179 |
| AF-32 | 181–182 |
| AF-33 | 184–185 |
| Excluded: below form clipping boundary | 186 |
| AF-35 | 189–190 |
| Excluded: covered by Shipping country popup | 192, 194, 196–198 |
| AF-40 | 200 |
| AF-41 | 202–203 |
| AF-42 | 205–206 |
| Excluded: invisible one-pixel Description placeholder | 210 |
| AF-47 | 227 |
| SH-35 | 244 |
| SH-36 | 245 |
| SH-37 | 246 |
| SH-38 | 247 |
| SH-39 | 248 |
| SH-40 | 249 |
| SH-41 | 250 |
| SH-42 | 251 |
| SH-43 | 252 |
| SH-44 | 253 |
| SH-45 | 254 |
| AF-35.1 | 255 |
| AF-35.2 | 257 |
| AF-35.3 | 258 |
| AF-35.4 | 259 |
| AF-35.5 | 260 |
| AF-35.6 | 261 |
| AF-35.7 | 262 |
| AF-35.8 | 263 |
| Excluded: options outside popup viewport | 264–504 |

504 source items; 77 source-backed inventory numbers; 390 excluded items.

### m3f-list-after

| Inventory number / exclusion reason | Item ordinals |
| --- | --- |
| Excluded: duplicate structural wrapper or non-interactive text | 1, 37, 51, 59, 62, 82–83, 87, 111, 120, 129–130, 136, 141, 155, 172–173, 254–255, 259–261, 263–264, 273–274, 419, 421, 424, 589 |
| SH-01 | 2–4 |
| Excluded: invisible zero-area element | 5–9, 12, 15, 18, 21, 24, 27, 32, 81, 84, 91–92, 94–95, 97–98, 101–102, 107–110, 135, 139, 252–253, 257–258, 561–569, 574–588, 601 |
| SH-02 | 10 |
| SH-03 | 11, 13 |
| SH-04 | 14, 16 |
| SH-05 | 17, 19 |
| SH-06 | 20, 22 |
| SH-07 | 23, 25 |
| SH-08 | 26, 28 |
| SH-09 | 29–31 |
| SH-10 | 33 |
| SH-11 | 34–35 |
| SH-12 | 36 |
| SH-13 | 38–39 |
| SH-14 | 40–41 |
| SH-15 | 42–43 |
| SH-16 | 44–45 |
| SH-17 | 46–47 |
| SH-18 | 48–49 |
| SH-19 | 50 |
| SH-20 | 52–53 |
| SH-21 | 54–55 |
| SH-22 | 56–57 |
| SH-23 | 58 |
| SH-24 | 60–61 |
| SH-25 | 63–64 |
| Excluded: outside captured viewport | 65–80, 174–251, 430–431, 433, 436, 442–443, 445, 448, 454–455, 457, 460, 466–467, 469, 472, 478–479, 481, 484, 489, 491–492, 494, 497, 503–504, 506, 509, 515–516, 518, 521, 527–528, 530, 533, 539–540, 542, 545, 550, 552–553, 555, 558 |
| SH-26 | 85 |
| SH-27 | 86 |
| SH-28 | 88 |
| SH-29 | 89 |
| SH-30 | 90 |
| SH-31 | 93 |
| SH-32 | 96 |
| SH-33 | 99–100 |
| SH-34 | 103–106 |
| AL-01 | 112 |
| AL-52 | 113 |
| AL-02 | 114–117 |
| AL-03 | 118 |
| AL-04 | 119 |
| AL-05 | 121 |
| AL-06 | 122 |
| AL-07 | 123 |
| AL-08 | 124 |
| AL-09 | 125 |
| AL-10 | 126 |
| AL-11 | 127–128 |
| AL-12 | 131 |
| AL-13 | 132–133 |
| AL-14 | 134 |
| AL-15 | 137–138 |
| AL-16 | 140 |
| AL-20 | 142–143 |
| AL-21 | 144–145 |
| AL-22 | 146–147 |
| AL-23 | 148–149 |
| AL-24 | 150–151 |
| AL-25 | 152–153 |
| AL-26 | 154 |
| AL-27 | 156–157 |
| AL-53 | 158–159 |
| AL-54 | 160–161 |
| AL-55 | 162–163 |
| AL-56 | 164–165 |
| AL-57 | 166–167 |
| AL-58 | 168–169 |
| AL-59 | 170–171 |
| AL-33 | 256 |
| Excluded: record row data or table structure | 262, 275–276, 278, 281, 283–284, 286–290, 293, 295–296, 298–301, 303, 306, 308–309, 311–314, 316, 319, 321–322, 324–327, 329, 332, 334–339, 341, 344, 346–347, 349–352, 354, 357, 359–360, 362–365, 367, 370, 372–373, 375–378, 380, 383, 385–386, 388–392, 395, 397–398, 400–403, 405, 408, 410–411, 413–417, 420, 422–423, 425–429, 432, 434–435, 437–441, 444, 446–447, 449–453, 456, 458–459, 461–465, 468, 470–471, 473–477, 480, 482–483, 485–488, 490, 493, 495–496, 498–502, 505, 507–508, 510–514, 517, 519–520, 522–526, 529, 531–532, 534–538, 541, 543–544, 546–549, 551, 554, 556–557, 559–560 |
| AL-34 | 265–266 |
| AL-35 | 267 |
| AL-36 | 268–269 |
| AL-39 | 270 |
| AL-60 | 271 |
| AL-61 | 272 |
| AL-46 | 277, 302, 315, 328, 340, 353, 366, 379, 404 |
| AL-40 | 279–280, 291–292, 304–305, 317–318, 330–331, 342–343, 355–356, 368–369, 381–382, 393–394, 406–407 |
| AL-42 | 282, 294, 307, 320, 333, 345, 358, 371, 384, 396, 409 |
| AL-63 | 285, 297, 310, 323, 348, 361, 374, 387, 399, 412 |
| Excluded: row below list clipping boundary | 418 |
| AL-48 | 570 |
| AL-49 | 571 |
| AL-50 | 572 |
| AL-51 | 573 |
| SH-35 | 590 |
| SH-36 | 591 |
| SH-37 | 592 |
| SH-38 | 593 |
| SH-39 | 594 |
| SH-40 | 595 |
| SH-41 | 596 |
| SH-42 | 597 |
| SH-43 | 598 |
| SH-44 | 599 |
| SH-45 | 600 |

601 source items; 92 source-backed inventory numbers; 413 excluded items.

### m3f-detail-base

482 source items; inventory deliberately omitted by task scope (detail is a separate task). All 482 are excluded from the form reconciliation as out of scope, not as absent controls; 1 requested click, 0 skipped. This capture is safety and selector evidence only.

### m3f-edit

No capture/source items; omitted because of the safety stop.
