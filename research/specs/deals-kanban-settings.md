# Deals Kanban settings and view selector

## Purpose and evidence status

Configure a saved Deals Kanban view and inspect its view-selector menu. This is an **incomplete research draft**, not an implementation-ready specification. Scope: MEP-537 under MEP-535. Module 4 requires behaviour parity and visual similarity by inspection; no pixel measurements or reference request contract are required.

Evidence:

- **Board-provided description (MEP-537):** settings-window labels, required markers, initial values, selected fields and footer. The image itself was not available for this research run; these details are supplied evidence, not a new screenshot observation.
- **Seen (existing m4-list-base):** saved stage board, view selector and adjacent pencil; see [deals-pipeline.md](deals-pipeline.md).
- **Documented (D4/D5):** local public-help notes `docs-notes/m4-pipeline/D4.txt` and `D5.txt`. Capability evidence does not establish the exact live popup options or widget behaviour.
- **New live observation:** unavailable. The no-click baseline failed twice before screenshot, controls or meta files were produced. No paint gate passed and no click was attempted.

## Layout

Board description: a settings window titled **Kanban View - Settings**, with Help at upper right. Four configuration rows precede Select Fields. Available fields occupy the left list with a search box above it; Selected fields occupy the right list. Cancel and primary Save sit in a fixed footer. Exact dimensions, close control, focus order and scroll behaviour are not observed.

Shared shell and underlying board reuse [deals.md](deals.md) and [deals-pipeline.md](deals-pipeline.md). Their visibility beneath the actual settings overlay cannot be reconciled without a successful capture.

## Control inventory

Existing DP identifiers are retained. New numbers start at DP-104, after the current pipeline inventory. Position is supplied by the board description unless otherwise stated; all controls belong to Module 4.

| ID | Control / type | Position | Behaviour and source |
| --- | --- | --- | --- |
| DP-90 | Kanban View Name / text input | First row | Required, with left red marker; names saved view. Board description; naming capability documented (D4). |
| DP-91 | Categorize By / select | Second row | Required; supplied value Stage. Groups records by a picklist. Board description; grouping documented (D4/D5). |
| DP-92 | Aggregate By / select | Third row | Optional; supplied value Amount. Shows the sum for each category. Board description; optionality and summation documented (D4). |
| DP-103 | Header Style / select | Fourth row | Required; supplied value Mono Color. Selects header colouring. Board description; effect documented (D4/D5). |
| DP-93 | Select Fields / dual-list field chooser | Below configuration rows | Available left, Selected right. Determines fields displayed in record cards. Board description; card-field purpose documented (D4). Transfer mechanism not observed. |
| DP-94 | Create Kanban View / menu item | View-selector menu; order unknown | Opens configuration for an additional view, documented (D4). Blank-window structure not observed. |
| DP-95 | Manage Kanban Views / menu item | View-selector menu; order unknown | Opens view management, documented (D4). Live structure not observed. |
| DP-104 | Help / link | Window upper right | Destination and opening behaviour not observed. Board description. |
| DP-105 | Categorize By information icon | Beside DP-91 | Tooltip content and trigger not observed. Board description. |
| DP-106 | Aggregate By information icon | Beside DP-92 | Tooltip content and trigger not observed. Board description. |
| DP-107 | Available search / text input | Above left list | Search box supplied by board; matching, debounce and empty state not observed. No typing authorized. |
| DP-108 | Cancel / button | Fixed footer | Discards/closes configuration: intended action in assignment, outcome not observed. Board description. |
| DP-109 | Save / primary button | Fixed footer | Saves configuration, documented (D4); never operated. Board description. |

No close icon, arrow-transfer button or drag grip is invented. The saved-view selector and pencil reuse the existing board inventory; no view option was selected.

## Fields and option lists

| Select | Supplied current value | Observed complete option list | Documented eligible values |
| --- | --- | --- | --- |
| Categorize By (DP-91) | Stage | **Not observed** | Module picklist fields; actual popup labels/order require capture (D4/D5). |
| Aggregate By (DP-92) | Amount | **Not observed** | Integer, decimal, currency, formula and rollup-summary fields (D4). Eligibility does not prove a field is present in this popup. |
| Header Style (DP-103) | Mono Color | **Not observed** | Mono colour or random colours for headers (D4); D5 also describes other header colours. Exact second-option label/order remains unknown. |

**Selected list, supplied order:** Deal Name (required, asterisk), Stage, Account Name, Deal Owner, Contact Name, Amount, Closing Date. This is board evidence, not a verified editable order. Deal Name removal prevention, field-transfer gestures, arrow controls, drag handles, selected-list reordering and field-count limits are **not observed** and are not established by D4/D5.

**Available list:** complete list **not observed**. Do not substitute the metadata field dictionary for this list: eligible Available entries may differ and already selected entries may be excluded. Exported Deals fields remain the model source of truth in [deals.md](deals.md).

## Actions, views and sorting

D4 documents the pencil adjacent to the selector as the entry to editing an existing Kanban configuration. Additional views are reached through Create Kanban View. Saving multiple views is supported, with edition-dependent limits; no numeric maximum is established here.

Manage Kanban Views supports reordering and deleting views (D4). Reordering persists per user and does not reorder another user's list. Hover can reveal creator/modifier and modification time (D4). Manage permission can restrict creation, deletion and modification. The management window/page title, columns, row actions, drag mechanism, close/footer controls and empty state are **not observed**. No reorder/delete operation is allowed in this research.

Header Style changes **category headers** between mono and varying/random colours (D4/D5). The documents do not establish a change to card backgrounds, borders, layout or field order. Those effects remain unknown; do not infer card recolouring. No style was selected or saved.

Sort Records permits sorting by record fields (D4). The popup labels, direction controls, default ordering, scope and persistence are not observed. This is separate from Manage's saved-view ordering. No sorting was performed.

## Flows, validation and errors

- Existing view: open the pencil, inspect configuration, then Cancel. This run did not reach the window.
- New view: selector → Create Kanban View → configuration → Save (D4). Only opening and cancellation are authorized for future research; no create/save may be tested.
- Manage: selector → Manage Kanban Views → inspect → close. Exact dismissal control remains unknown.
- Required indicators: View Name, Categorize By, Header Style and selected Deal Name come from the board description. Save-time required-field errors, message text, focus, disabled state, duplicate-name rules, length limits and server-error presentation are **not observed**.
- Aggregate By is optional (D4). Empty-option label and empty-total rendering are not observed.
- A grouping picklist with more than 75 options is permitted but produces an alert that only its first 75 options are categorized (D4). Exact alert appearance/text is not observed; this is not a selected-card-field limit.
- Availability depends on picklist presence and customization/manage permissions (D4/D5). Exact denied-state presentation is not observed.
- No write-triggered errors or success states were exercised.

## Capture refs and safety audit

Existing reference screenshot: `captures/m4-list-base/`. No new reference screenshot was produced and none is committed.

| Requested slug | Requested clicks | Executed clicks / meta click list | Outcome |
| --- | --- | --- | --- |
| m4k-base | `[]` | None; `meta.json` not produced | Navigation timed out after 90 seconds, before capture. |
| m4k-base-retry | `[]` | None; `meta.json` not produced | Navigation failed with `ERR_NETWORK_CHANGED`, before capture. |

The initial sandbox invocation failed before browser access at the capture lock. The two browser attempts used the same read-only tool with its guards unchanged. Because no meta file exists, blocked-request lists cannot be audited; absence of a list must not be reported as zero blocked requests. No settings/selector captures were attempted after the failed baseline. No record, preference, field, filter, style or view was intentionally changed.

## Open questions and continuation

1. Recover baseline navigation and pass the screenshot paint gate before clicking any control. UI Lead owns routing the capture-access recovery.
2. Capture pencil → settings, then separate openings of Categorize By, Aggregate By and Header Style; extract exact labels/order and reconcile all visible controls.
3. Capture the selector and, only where safe and guard-permitted, Create/Manage openings. Record actual menu order and management structure.
4. Obtain the full Available list without transferring fields or typing; the current capture CLI has no scroll action.
5. Tooltip observation, list scrolling and Escape closure are unsupported by the current capture CLI. Route tooling support through the lead; do not use another browser interface or modify guards.
6. Required validation messages, transfer/reorder mechanics and field-count constraints remain not observable under the authorized actions unless public documentation establishes them. No implementation assumption is approved by this draft.
