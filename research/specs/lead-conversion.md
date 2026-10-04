# Lead conversion screen

Status: partial read-only research. The opening screen is captured; the optional Deal and owner picker states remain open because the two authorized captures failed. This screen belongs to the later Contacts, Accounts, and Deals work, outside Module 1.

## Purpose

An unconverted Lead can be prepared for conversion into a new Account and Contact, with an optional new Deal. The dedicated route is `/crm/<org>/tab/Leads/<recordId>/convert`. The conversion result was not observed. See `research/specs/leads.md` for the Lead entry point and Module 1 scope, `research/specs/record-detail.md` for the source record page, and `research/specs/leads-fields-and-layout.md` for Lead fields and conversion mapping.

## Layout

The screen retains the shared shell and the Leads rail selection. The content begins with a full-width heading, **Convert Lead** followed by the Lead identity in muted text; the identity is record data and is represented here as `(<Lead Name> - <Company>)`. This is a page, not an observed modal.

The left content column shows **Create New Account** with a filled chip for the source company, then **Create New Contact** with a filled chip for the source person. No new-versus-existing switch is visible for this record. Below them is an unchecked **Create a new Deal for this Account.** checkbox. **Owner of the New Records** labels a prefilled, light-gray input with a person-search control at its right. A primary **Convert** button and secondary **Cancel** button sit below the owner control. The right rail is headed **Quick Links** and contains **Lead Conversion Mapping** and **Help**. Neither link was opened.

### Visual layout

All coordinates and colours below are **measured from screenshot** `board-lead-convert-probe` with pixel sampling at two image pixels per CSS pixel. The 2940 × 1670 image therefore represents a 1470 × 835 CSS-pixel viewport. Bounds describe visible pixels, not computed CSS boxes. Font sizes and weights are visual estimates from measured ink height, since a screenshot alone does not expose the font declaration.

| Region or control | Measurement and visible state |
| --- | --- |
| Heading band | White `#FFFFFF` surface starts at x 320 and extends to the right viewport edge; top edge y 50, bottom divider y 102 in `#EDF0F4`. **Convert Lead** dark ink `#202123` spans x 352–476.5, y 69.5–84.5; its visible ink is 15 px high, visually about 20 px and bold. The following record identity uses muted `#8B9AB9` ink spanning x 483–843.5, y 71.5–85, visually about 15 px and semibold. The text start has 32 px left inset from the page edge. |
| Main area and right rail | Main surface is `#FFFFFF`, beginning at x 320 below y 103. The rail starts at x 1170; its divider is `#EDF0F4` across x 1165–1170, y 103–800. Thus the main column has approximately 845 px from x 320 to the divider, and the rail approximately 300 px from x 1170 to the viewport edge. The rail heading and links start around x 1185, a 15 px inset. Link ink `#5464F2` spans x 1186.5–1354, y 138–151 for the first link. |
| Account and Contact rows | Both row labels start at x 350, a 30 px inset from the main page edge. The Account label has `#313949` ink at x 351–483.5, y 139–149; the Contact row starts around y 170. Their baselines are approximately 32 px apart. Each adjacent value is a muted gray `#C5C4D3` chip with dark `#313949` text and rounded corners. The Account chip begins at x 492 and spans y 133–155, a 22 px visible height. These chips show source values; their content is intentionally omitted. |
| Optional Deal | The unchecked box border is `#C5C4D3` at x 350–365, y 229–244, a 15 × 15 px visible square with small rounded corners and white `#FFFFFF` center. Its label starts around x 371. No selected fill, Deal fields, or selected checkbox geometry was captured. |
| Owner | The label starts at x 350 around y 276. The input border is `#D2D9F1` at x 350–529.5, y 295–329, around 180 × 34 px with rounded corners. Its interior is `#F5F6F8` from x 351–528.5, y 296–328. The existing owner value appears in `#313949`; its text is not reproduced. A person-search icon appears immediately to the right, around x 538–554; recreate its function without using the source icon file. The open picker, search field, grouping, row style, and selection states were not captured. |
| Actions | The primary button occupies approximately x 350–431, y 389–421 (81 × 32 px), with a rounded edge. Its upper visible fill includes `#5767F6` at y 389–391 and darker lower fill `#1A50C9` at y 417–418; the label is white. The secondary button occupies approximately x 442–517, y 389–421 (75 × 32 px), leaving an 11 px horizontal gap. Its border is `#D5D8E9`; the visible light fill includes `#F3F2F8` near the lower center. Both appear enabled. Hover, focus, pressed, disabled, loading, and validation states were not captured. |

The shared shell's geometry, typography, and icon treatment are already specified in `research/specs/app-shell.md`. No source logo, image, icon, or font asset belongs in the implementation.

## Fields

The table separates visible controls from metadata-only Deal targets. API names and data types for data fields come from the local metadata export; UI-only controls have no confirmed API binding. “Unique: no” means no unique constraint is declared in the field metadata, not that duplicates are accepted by the conversion flow. See `research/specs/leads-fields-and-layout.md` for the complete `convert_mapping`; the Standard layout is named for all three targets, and the Deal mapping names four target fields.

| Visible label / target label | API name | Data type | Required / unique / read-only | Notes |
| --- | --- | --- | --- | --- |
| Create New Account | `Company` (source Lead) | `text` | Lead layout required / no / no | The source company value is displayed as a chip. The Account target API binding and whether it can be replaced are not observed. |
| Create New Contact | `Full_Name` (source Lead) | `text` | No / no / no in metadata | The source identity is displayed as a chip. First and last name components and the Contact target API binding are not shown here. |
| Create a new Deal for this Account. | Not established | UI checkbox | No / not applicable / no | Starts unchecked. The attempted selected-state capture timed out before producing evidence. |
| Owner of the New Records | `Owner` (source Lead; binding unconfirmed) | `ownerlookup` | No / no / no in Lead metadata | A prefilled value and picker affordance are visible. The conversion-specific request field and whether one owner applies to every target are not observed. |
| Potential Name (mapping label) / Deal Name (Deal field label) | `Deal_Name` | `text` | Yes / no / no | Metadata-only target; its conversion-screen label, order, control, and default state remain unobserved. |
| Amount | `Amount` | `currency` | No / no / no | Metadata-only Deal target; screen control and default state unobserved. |
| Closing Date | `Closing_Date` | `date` | No / no / no | Metadata-only Deal target; screen control and default state unobserved. |
| Stage | `Stage` | `picklist` | Yes / no / no | Metadata-only Deal target; screen control and default state unobserved. |

## Actions

| Control | Observed behavior |
| --- | --- |
| Create a new Deal for this Account. | Unchecked at page load. Its checked result was not captured. |
| Owner picker icon | Present beside the owner field. Its opening result was not captured. |
| Convert | Enabled visual state. Submission, validation, writes, and navigation were not observed. |
| Cancel | Enabled visual state. Its destination and whether it preserves changes were not observed. |
| Lead Conversion Mapping; Help | Visible quick links. Targets and resulting pages were not opened. |

## Filters / views / sorting / search

Not applicable to the opening conversion page: it has no list view, filter, or sort control. Search may exist inside the owner picker, but that picker was not captured; see Open questions.

## Flows

1. Open an unconverted Lead detail as specified in `research/specs/record-detail.md`. Navigate to `/crm/<org>/tab/Leads/<recordId>/convert`; the opening page shows new Account and Contact chips, unchecked optional Deal, prefilled owner, actions, and quick links.
2. Select the optional Deal checkbox: **not observed**. The authorized click timed out before a capture was written. Its fields, order, required markers, controls, and defaults remain open.
3. Open the owner picker: **not observed**. The authorized capture failed before the page opened because the capture browser profile was already in use. Its search and list structure remain open.
4. Submit **Convert** or leave with **Cancel**: **not observed**; neither control was clicked. Validation, error, success, duplicate matching, and destination states remain open.

## Data needs

Only request and response **shapes** from `board-lead-convert-probe` are represented. Paths are neutral; values and IDs are omitted. The conversion option request returned 204, so this capture has no response object or field names for it. No conversion submit request was made.

| Method | Neutral endpoint | Query parameter names | Observed response field names and role |
| --- | --- | --- | --- |
| GET | `/crm/v2.2/Leads/<recordId>` | None | `data[]`; its relevant keys include `Owner`, `Company`, `Full_Name`, `First_Name`, `Last_Name`, `$converted`, `$converted_detail`, and `$layout_id`. Supplies the source record and owner. |
| GET | `/crm/v5/Leads/<recordId>/__conversion_options` | `include_inner_details` | 204 with no response body; option field names cannot be established from this capture. |
| GET | `/crm/v2.1/Accounts/actions/permit_threshold` | `owner_id` | `permit_threshold.allow`, `permit_threshold.reason`, `permit_threshold.remaining_allow_count`. |
| GET | `/crm/v2.1/Contacts/actions/permit_threshold` | `owner_id` | Same `permit_threshold` keys. |
| GET | `/crm/v2.1/settings/layouts` | `module` | `layouts[]`, including `convert_mapping.Contacts`, `.Accounts`, and `.Deals`; Deal mapping has `fields[]` with `api_name`, `field_label`, and `required`. |
| GET | `/crm/<org>/ModuleCache.do` | `module`, `getField` | `id`, `fields[]`; field metadata includes `api_name`, `field_label`, `data_type`, `view_type`, `system_mandatory`, and `convert_mapping` where applicable. |

The opening capture also contains shared shell/module requests described by the linked specs. No owner-picker request shape is available. Response values, query values, account identifiers, and record identifiers are intentionally absent.

## Capture refs

- `board-lead-convert-probe`: opening page; `clicks`, `skippedClicks`, and `blockedRequests` are empty in `meta.json`.
- `leads-convert-deal`: no completed capture or `meta.json`; first authorized click timed out and left an empty capture directory.
- `leads-convert-owner`: no completed capture or `meta.json`; browser profile was already in use before the requested click ran.

## Open questions

1. What fields appear after checking the Deal box, in what order, with what exact labels, required markers, input types, defaults, and selected-state colours? Metadata names `Deal_Name`, `Amount`, `Closing_Date`, and `Stage`, but it does not prove that all four appear on this screen. The first authorized capture timed out; the fallback condition was not met because a capture directory existed.
2. What is the owner picker’s geometry, search placeholder and behavior, row layout, grouping, empty state, and request shape? The authorized capture could not launch the shared browser profile; no selector was retried.
3. Does a matching existing Account or Contact produce a choice between creating and using an existing record? This source record showed only **Create New Account** and **Create New Contact**. Matching conditions and alternate state are unobserved.
4. What happens on **Convert**: required-field and duplicate validation, success or server error message, submit endpoint and payload, post-conversion route, and converted record appearance? These require a real write or other approved evidence and were not tested. What does **Cancel** do after local selections?
5. How does **Mass Convert** differ from single-record conversion? The menu entry exists in `research/specs/leads.md`, but its screen and behavior are outside this capture.
6. Why does `__conversion_options` return 204 in the opening capture, and what are its response field names in a populated state? The current evidence cannot establish them.
7. The Deal mapping calls `Deal_Name` **Potential Name** while Deal field metadata calls it **Deal Name**. Which label does the checked conversion screen render? This cannot be resolved without that state.
