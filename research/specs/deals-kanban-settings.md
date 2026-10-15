# Deals Kanban settings and view selector

## Purpose and evidence status

Configure a saved Deals Kanban view and inspect its view-selector menu. This specification separates live observations, documented behaviour and remaining read-only gaps. Select option lists blocked by the capture guard must not be invented. Scope: MEP-537 under MEP-535. Module 4 requires behaviour parity and visual similarity by inspection; no pixel measurements or reference request contract are required.

Evidence:

- **Board-provided description (MEP-537):** settings-window labels, required markers, initial values, selected fields and footer. The image itself was not available for this research run; these details are supplied evidence, not a new screenshot observation.
- **Seen (existing m4-list-base):** saved stage board, view selector and adjacent pencil; see [deals-pipeline.md](deals-pipeline.md).
- **Documented (D4/D5):** local public-help notes `docs-notes/m4-pipeline/D4.txt` and `D5.txt`. Capability evidence does not establish the exact live popup options or widget behaviour.
- **Seen (new captures):** `m4k-base-4` passed the paint gate with the Deals title, 59 API calls and four record links. `m4k-settings` shows the existing-view settings window. Three select-opening attempts were skipped by the unchanged dangerous-attribute guard (`followcursor`); their option lists remain not observed.

## Layout

Seen in `m4k-settings`: a centered white settings window over a dimmed Deals board, titled **Kanban View - Settings**, with Help at upper right. Four configuration rows precede Select Fields. Available fields occupy the left list with a search box above it; Selected fields occupy the right list. Cancel and primary Save sit in a fixed footer. The body is tall enough for lower Available entries to extend below the visible area; the footer stays visible. The name input has a blue focus outline on opening. No close icon or transfer arrows are visible. Exact keyboard focus order and scrolling behaviour were not exercised.

Shared shell and underlying board reuse [deals.md](deals.md) and [deals-pipeline.md](deals-pipeline.md). The board and shell remain visible beneath the dimmed overlay.

## Control inventory

Existing DP identifiers are retained. New numbers start at DP-104, after the current pipeline inventory. Position is confirmed in `m4k-settings` unless otherwise stated; all controls belong to Module 4.

| ID | Control / type | Position | Behaviour and source |
| --- | --- | --- | --- |
| DP-90 | Kanban View Name / text input | First row | Required, with left red marker; names saved view. Seen; naming capability documented (D4). |
| DP-91 | Categorize By / select | Second row | Required; observed value Stage. Groups records by a picklist. Seen; grouping documented (D4/D5). |
| DP-92 | Aggregate By / select | Third row | Optional; observed value Amount. Shows the sum for each category. Seen; optionality and summation documented (D4). |
| DP-103 | Header Style / select | Fourth row | Required; observed value Mono Color. Selects header colouring. Seen; effect documented (D4/D5). |
| DP-93 | Select Fields / dual-list field chooser | Below configuration rows | Available left, Selected right. Determines fields displayed in record cards. Seen; card-field purpose documented (D4). Transfer mechanism not observed. |
| DP-94 | Create Kanban View / menu item | View-selector menu, after saved-view entries | Opens configuration for an additional view, documented (D4). Seen in `m4k-create`: same settings title, blank name, Categorize By Select Field, Aggregate By --None--, Header Style Mono Color and only Deal Name selected. |
| DP-95 | Manage Kanban Views / menu item | View-selector menu, after Create Kanban View | Opens view management, documented (D4). Seen in `m4k-manage-retry`: a wide modal with view table; see management structure below. |
| DP-104 | Help / link | Window upper right | Destination and opening behaviour not observed. Seen in settings capture. |
| DP-105 | Categorize By information icon | Beside DP-91 | Tooltip content and trigger not observed. Seen in settings capture. |
| DP-106 | Aggregate By information icon | Beside DP-92 | Tooltip content and trigger not observed. Seen in settings capture. |
| DP-107 | Available search / text input | Above left list | Search box seen in settings capture; matching, debounce and empty state not observed. No typing authorized. |
| DP-108 | Cancel / button | Fixed footer | Discards/closes configuration: seen in `m4k-create-cancel`: closes the blank window and returns to the existing board without saving. Seen in settings capture. |
| DP-109 | Save / primary button | Fixed footer | Saves configuration, documented (D4); never operated. Seen in settings capture. |
| DP-110 | Share this with / radio group | Create window, between Header Style and Select Fields | Only me (default selected), Everyone, Selected users. Seen in `m4k-create`; no radio was changed. Not present in the captured existing-view edit window. |
| DP-111 | Create Kanban View / button | Manage modal upper right | Secondary outlined button. Seen but not clicked from Manage; selector-menu entry was tested separately. |
| DP-112 | Close Modal / icon button | Manage modal upper right | Visible cross with accessible name Close Modal. Dismissal capture recorded in the safety audit. |

No close icon, arrow-transfer button or drag grip is invented. The saved-view selector and pencil reuse the existing board inventory; no saved-view option was selected. The open selector shows saved-view entries first (current STAGEVIEW marked selected), followed by a divider and Create Kanban View, then Manage Kanban Views (`m4k-selector-retry`). No search box is observed in that menu.

## Fields and option lists

| Select | Observed existing-view value | Observed complete option list | Documented eligible values |
| --- | --- | --- | --- |
| Categorize By (DP-91) | Stage | **Not observed: guard skipped opening** | Module picklist fields; actual popup labels/order require capture (D4/D5). |
| Aggregate By (DP-92) | Amount | **Not observed: guard skipped opening** | Integer, decimal, currency, formula and rollup-summary fields (D4). Eligibility does not prove a field is present in this popup. |
| Header Style (DP-103) | Mono Color | **Not observed: guard skipped opening** | Mono colour or random colours for headers (D4); D5 also describes other header colours. Exact second-option label/order remains unknown. |

**Existing-view Selected list, observed order:** Deal Name (required, asterisk), Stage, Account Name, Deal Owner, Contact Name, Amount, Closing Date. This matches board evidence; editability of the order was not tested. Deal Name removal prevention, field-transfer gestures, arrow controls, drag handles, selected-list reordering and field-count limits are **not observed** and are not established by D4/D5.

**Available list, rendered order in captured text and controls:** Campaign Source, Connected To, Created By, Created Time, Description, Expected Revenue, Last Activity Time, Lead Conversion Time, Lead Source, Modified By, Modified Time, Next Step, Overall Sales Duration, Probability (%), Reason For Loss, Sales Cycle Duration, Tag, Type. The capture includes all 18 rendered labels; lower entries extend below the screenshot viewport. No scrolling was performed, so absence of lazy-loaded additional entries is not proven. Do not substitute the metadata field dictionary for this list: eligible Available entries may differ and already selected entries may be excluded. Exported Deals fields remain the model source of truth in [deals.md](deals.md).

**Create Available list, rendered order:** Account Name, Amount, Campaign Source, Closing Date, Connected To, Contact Name, Created By, Created Time, Deal Owner, Description, Expected Revenue, Last Activity Time, Lead Conversion Time, Lead Source, Modified By, Modified Time, Next Step, Overall Sales Duration, Probability (%), Reason For Loss, Sales Cycle Duration, Stage, Tag, Type. Only Deal Name is Selected and required. No field was moved.

## Actions, views and sorting

D4 documents the pencil adjacent to the selector as the entry to editing an existing Kanban configuration. Additional views are reached through Create Kanban View. Saving multiple views is supported, with edition-dependent limits; no numeric maximum is established here.

Manage Kanban Views supports reordering and deleting views (D4). Reordering persists per user and does not reorder another user's list. Hover can reveal creator/modifier and modification time (D4). Manage permission can restrict creation, deletion and modification. Seen in `m4k-manage-retry`: a wide white modal above the dimmed board, titled **Manage Kanban Views**, with Create Kanban View and a Close Modal cross at upper right. Its table columns are View Name, Used Field, Shared To, Last Modified By, Created By, with an unlabeled leading space. One saved-view row is rendered. Creator/modifier cells are blank in this capture; this does not establish the general data behaviour. No footer, visible drag grip, row action or empty state is observed. Hover-only actions and reorder gestures remain unknown. No reorder/delete operation is allowed in this research.

Header Style changes **category headers** between mono and varying/random colours (D4/D5). The documents do not establish a change to card backgrounds, borders, layout or field order. Those effects remain unknown; do not infer card recolouring. No style was selected or saved.

Sort Records permits sorting by record fields (D4). The popup labels, direction controls, default ordering, scope and persistence are not observed. This is separate from Manage's saved-view ordering. No sorting was performed.

## Flows, validation and errors

- Existing view: open the pencil, inspect configuration, then Cancel. The pencil opens the observed settings window; no values were changed.
- New view: selector → Create Kanban View → configuration → Save (D4). Opening and cancellation were observed in `m4k-create` and `m4k-create-cancel`; no create/save was tested.
- Manage: selector → Manage Kanban Views → inspect → close. Close Modal is the observed dismissal control; see the closing capture in the audit.
- Required indicators: View Name, Categorize By, Header Style and selected Deal Name are visible in the settings screenshot and match the board description. Save-time required-field errors, message text, focus, disabled state, duplicate-name rules, length limits and server-error presentation are **not observed**.
- Aggregate By is optional (D4). The blank Create window shows --None--; empty-total rendering is not observed.
- A grouping picklist with more than 75 options is permitted but produces an alert that only its first 75 options are categorized (D4). Exact alert appearance/text is not observed; this is not a selected-card-field limit.
- Availability depends on picklist presence and customization/manage permissions (D4/D5). Exact denied-state presentation is not observed.
- No write-triggered errors or success states were exercised.

## Capture refs and safety audit

Existing reference screenshot: `captures/m4-list-base/`. New reference screenshots remain local under `captures/<slug>/` for every successful slug below; none is committed.

| Requested slug | Requested clicks | Meta click list | Outcome |
| --- | --- | --- | --- |
| m4k-base | `[]` | None; `meta.json` not produced | Navigation timed out after 90 seconds, before capture. |
| m4k-base-retry | `[]` | None; `meta.json` not produced | Navigation failed with `ERR_NETWORK_CHANGED`, before capture. |
| m4k-base-2 | `[]` | None; `meta.json` not produced | One-minute load 35.41; `ProcessSingleton` / profile already in use, before navigation. API count unknown. |
| m4k-base-3 | `[]` | None; `meta.json` not produced | One-minute load 34.54; same `ProcessSingleton` failure, before navigation. API count unknown. |
| m4k-base-4 | `[]` | `[]` | One-minute load 10.31; paint gate passed: 59 API calls, four record links. |

| m4k-settings | `["[data-zcqa=\"kv_editsetup\"]"]` | `["[data-zcqa=\"kv_editsetup\"]"]` | API calls 59; blocked requests 12; skipped clicks 0. |
| m4k-categorize | `["[data-zcqa=\"kv_editsetup\"]", "#kv_categorizeby"]` | `["[data-zcqa=\"kv_editsetup\"]", "#kv_categorizeby"]` | API calls 59; blocked requests 14; skipped clicks 1. |
| m4k-aggregate | `["[data-zcqa=\"kv_editsetup\"]", "#kv_aggregateby"]` | `["[data-zcqa=\"kv_editsetup\"]", "#kv_aggregateby"]` | API calls 59; blocked requests 14; skipped clicks 1. |
| m4k-header | `["[data-zcqa=\"kv_editsetup\"]", "[data-zcqa=\"kv_colortheme\"]"]` | `["[data-zcqa=\"kv_editsetup\"]", "[data-zcqa=\"kv_colortheme\"]"]` | API calls 59; blocked requests 12; skipped clicks 1. |
| m4k-selector | Menu-opening sequence | None; meta not produced | ProcessSingleton / profile in use before navigation; no click executed. |
| m4k-selector-retry | `["#kanbanDropdown"]` | `["#kanbanDropdown"]` | API calls 60; blocked requests 12; skipped clicks 0. |
| m4k-create | `["#kanbanDropdown", "[data-zcqa=\"create_kanban_view\"]"]` | `["#kanbanDropdown", "[data-zcqa=\"create_kanban_view\"]"]` | API calls 61; blocked requests 12; skipped clicks 0. |
| m4k-create-cancel | `["#kanbanDropdown", "[data-zcqa=\"create_kanban_view\"]", "[data-zcqa=\"kv_cancel\"]"]` | `["#kanbanDropdown", "[data-zcqa=\"create_kanban_view\"]", "[data-zcqa=\"kv_cancel\"]"]` | API calls 61; blocked requests 15; skipped clicks 0. |
| m4k-manage | Menu-opening sequence | None; meta not produced | ProcessSingleton / profile in use before navigation; no click executed. |
| m4k-manage-retry | `["#kanbanDropdown", "[data-zcqa=\"manage_kanban_view\"]"]` | `["#kanbanDropdown", "[data-zcqa=\"manage_kanban_view\"]"]` | API calls 61; blocked requests 14; skipped clicks 0. |
| m4k-manage-close | `["#kanbanDropdown", "[data-zcqa=\"manage_kanban_view\"]", "role=button[name=\"Close Modal\"]"]` | `["#kanbanDropdown", "[data-zcqa=\"manage_kanban_view\"]", "role=button[name=\"Close Modal\"]"]` | API calls 60; blocked requests 14; skipped clicks 0. |

The original sandbox invocation failed at the capture lock. Failed profile attempts produced no meta file, so API counts and blocked-request counts are unknown, not zero. Five minutes without reference requests separated each of the three new baseline attempts. The capture tool's built-in fallback reported a profile already in use twice; the third attempt succeeded. No browser/profile lock was removed, no browser restart or logout was performed, and no alternative browser interface was used.

In successful captures, `meta.clicks` records the requested list, including any skipped selector; it is not an executed-click ledger. Only the second control in `m4k-categorize`, `m4k-aggregate` and `m4k-header` was skipped. The pencil still opened each settings window. `m4k-create-cancel` and `m4k-manage-close` show the respective dialog absent after dismissal, with no skipped clicks. Blocked requests included reminder, grouped-count and telemetry calls; they were aborted by the existing network guard, not allowed through. Their counts are reported per capture above.

The capture tool closes its own inspection tab after each successful capture. Escape is unsupported and was not simulated. The select-opening attempts retained every guard; `followcursor` triggered a dangerous-attribute skip, and no alternate selector was used to evade that decision. No record, preference, field, filter, style or view was intentionally changed.

## Open questions

1. Categorize By, Aggregate By and Header Style option labels/order remain not observed because the capture guard skipped each opening. Existing values are confirmed; documented eligibility is not the actual option list.
2. Sharing-dependent pickers, permission-dependent menu variations and management hover details were not exercised. Unobserved controls must not be inferred from documentation.
3. Available has 18 rendered labels. Additional lazy-loaded entries cannot be ruled out without scrolling, which the current CLI does not support.
4. Tooltip observation, list scrolling and Escape closure are unsupported by the current capture CLI. Keep these as open questions under the latest CTO decision; no separate tooling task is requested. Do not use another browser interface or modify guards.
5. Required validation messages, transfer/reorder mechanics and field-count constraints remain not observable under authorized actions unless public documentation establishes them. No write-dependent state was exercised.
