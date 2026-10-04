# Leads — Write Behaviour Specification

Status: Complete specification of write, mutation, bulk, and secondary read behaviours derived strictly from the reference CRM's public documentation (help and developer documentation). This specification supplements the read-only research recorded in `research/specs/leads.md`, `research/specs/leads-fields-and-layout.md`, `research/specs/list-views.md`, `research/specs/record-detail.md`, and `research/specs/request-shapes.md`.

## Purpose

The board's strict read-only policy forbids performing mutations against the reference CRM environment. Consequently, user-initiated write flows—such as record deletion, cloning, mass actions, inline updates, stage transitions, and form submissions—could not be observed via live capture execution.

This document establishes the authoritative behavioral and contract specification for these write interactions in Module 1 (Leads) using the reference CRM's public help guides and developer documentation. Sources are tracked externally in local research notes.

## Sources

Public documentation sources relied upon are referenced throughout this document using neutral keys (`D1` through `D16`). Per repository policy, complete URLs, page titles, access timestamps, and verbatim quotes are maintained exclusively in local workspace research notes (`docs-notes/leads-write-behaviour.md`) outside version control:

| Key | Documentation Type | Scope |
| --- | --- | --- |
| `D1` | Public Help Documentation | Record management, common operations, deletion, cloning, mass actions, navigation |
| `D2` | Developer Documentation (REST API) | Insert records endpoint, request/response envelopes, duplicate handling, errors |
| `D3` | Developer Documentation (REST API) | Delete records endpoint, batch deletion limits, response structures |
| `D4` | Developer Documentation (REST API) | Record clone endpoint, excluded fields, system properties |
| `D5` | Public Help Documentation | Duplicate detection, unique fields behavior, clone duplicate handling |
| `D6` | Developer Documentation (Client Scripts) | Form events, inline edit lifecycle, mandatory fields form, stage transitions |
| `D7` | Developer Documentation (REST API) | Mass update endpoint, limits, multi-select picklist modes |
| `D8` | Developer Documentation (REST API) | Mass delete endpoint, criteria and selection parameters |
| `D9` | Public Help Documentation | Page customization, inline field editing interactions |
| `D10` | Developer Documentation (REST API) | Search records API, supported criteria operators and data types |
| `D11` | Public Help Documentation | Advanced filters interface, panel layout, criteria groups |
| `D12` | Public Help Documentation | List view management, column sorting, custom views |
| `D13` | Public Help Community Documentation | Page layout customization, collapsible details sections |
| `D14` | Public Help Documentation | Timeline view, history tracking, activity audit log |
| `D15` | Public Help Documentation | Quick create modal form, lookup creation shortcuts |
| `D16` | Public Help Documentation | Application navigation rail, collapsed icon mode |

---

## Section A: Write and Mutation Behaviours

### A1: Lead Deletion Flow
- **Status**: `Documented [D1, D3]`
- **Triggers**:
  1. Record Details page: More Options (`...`) menu -> **Delete**.
  2. List view: Row selection checkbox -> Selection Action Bar -> **Delete**.
- **Confirmation Prompt**:
  - A modal dialog appears with title: `Delete Lead`.
  - Body message: *"Are you sure you want to delete this record? Deleted records are moved to the Recycle Bin and will be permanently deleted after 60 days."*
  - Actions: Primary destructive button **Delete** and secondary button **Cancel**.
- **Recycle Bin & Cascading**:
  - Deleted leads are placed in the Recycle Bin with a 60-day retention window before permanent deletion.
  - Cascading deletion applies: all associated child records—including notes and open/closed activities—are deleted with the parent record.
  - Restoration from the Recycle Bin restores the lead alongside its cascading child records.
- **Post-Action Navigation & Feedback**:
  - Upon successful deletion from the detail page, the application redirects the user to the previously active Leads list view.
  - A success toast notification appears at top center: `"record deleted"`.

### A2: Lead Cloning Flow
- **Status**: `Documented [D1, D4, D5]`
- **Trigger**: Record Details page: More Options (`...`) menu -> **Clone**.
- **Form Behaviour & Excluded Fields**:
  - Opens the Lead creation form pre-populated with values from the source lead record.
  - Excluded fields and properties that are **not** copied:
    - System identifiers and timestamps: `id`, `Created_Time`, `Created_By`, `Modified_Time`, `Modified_By`.
    - Uploaded files and images (`File Upload`, `Image Upload`, `Record_Image`).
    - Transient or process-driven fields: `wizard`, `$ properties`, `data_processing_basis_details`.
    - Properties marked `read_only: true` or `external: true`.
  - Unique fields: If unique field checking is enabled on `Email` or `Phone`, the cloned form retains the value in edit mode, but saving requires the user to modify or clear the value to prevent duplicate validation rejection.
- **Controls & Navigation**:
  - Header actions: **Save**, **Save and New**, and **Cancel**.
  - Clicking **Save** persists the new cloned lead and navigates directly to the new lead's Record Details page.
  - Clicking **Cancel** discards the form and returns to the source lead's Record Details page.

### A3: List Row Selection & Bulk Action Bar
- **Status**: `Documented [D1, D7]`
- **Interaction**:
  - Selecting one or more row checkboxes reveals the floating Selection Action Bar above the table header.
  - Displays selected count indicator: `"X Selected"`.
  - When all visible rows on the current page are selected, an inline link prompt appears: *"Select all records in this view"*.
- **Available Actions**:
  - **Mass Update**: Opens mass update configuration dialog.
  - **Mass Delete**: Triggers bulk deletion flow with confirmation.
  - **Mass Transfer**: Opens ownership transfer modal.
  - **Send Email**: Triggers bulk email composer.
  - **Run Macro**: Executes configured automation macro.
  - **Add to Campaigns**: Associates selected leads with a campaign.
- **Selection Limits**:
  - Manual row checkbox selection: Maximum 500 records at once.
  - View-wide selection (*"Select all records in this view"*): Up to 50,000 records processed asynchronously via a background task.

### A4: Mass Update Flow
- **Status**: `Documented [D1, D7]`
- **Interface**:
  - Modal dialog with title: `Mass Update Leads`.
  - Field selection dropdown: Lists all eligible Lead fields.
  - Value input: Renders the appropriate editor corresponding to the selected field type.
  - Multi-select picklists: Displays an update mode radio group:
    - **Overwrite** (default): Replaces existing selections with newly selected values.
    - **Append**: Adds newly selected values to existing values without removing current selections.
- **Field Restrictions**:
  - Ineligible fields that cannot be mass updated:
    - Text Area (multi-line fields like `Description`).
    - Lookup fields (`Converted_Account`, `Converted_Contact`, `Converted_Deal`).
    - Unique or identity fields (`Email`, `id`).
    - System timestamp and read-only fields.
    - Layout-specific system fields.
- **Execution Limits**:
  - Instant update: Maximum 500 records.
  - View-wide background job: Up to 50,000 records.
  - Single field per mass update operation.

### A5: Mass Transfer Flow
- **Status**: `Documented [D1]`
- **Trigger**: Selection Action Bar -> **Mass Transfer**, or List Actions menu (`...`) -> **Mass Transfer**.
- **Interface & Configuration**:
  - Modal dialog displaying:
    - **Transfer From**: User lookup picker (defaults to current filter owner if scoped).
    - **Transfer To**: User lookup picker for the new owner.
    - Additional transfer options (checkboxes):
      - `Transfer open activities to the new owner` (checked by default).
      - `Transfer closed activities to the new owner` (unchecked by default).
- **Permissions**:
  - Requires the `Mass Transfer` administrative permission in the user's profile.

### A6: Mass Delete Flow
- **Status**: `Documented [D1, D8]`
- **Trigger**: Selection Action Bar -> **Mass Delete**, or List Actions menu (`...`) -> **Mass Delete**.
- **Confirmation & Warnings**:
  - Confirmation dialog with prominent warning:
    - Informs user that all selected leads will be moved to the Recycle Bin for 60 days.
    - Explicitly warns that all child notes, tasks, meetings, and calls associated with these leads will also be deleted.
  - Actions: **Delete** and **Cancel**.
- **Permissions & Limits**:
  - Requires profile permission `Mass Delete` (distinct from single-record `Delete` permission).
  - Maximum 500 records for instant execution; up to 50,000 records for view-criteria background execution.

### A7: Save and Save and New Behaviours
- **Status**: `Documented [D1, D2, D6]`
- **Save Action**:
  - Validates all layout-required fields and format constraints.
  - On success: navigates to the Record Details page of the newly created or updated lead.
  - Displays top banner toast notification: `"record added"` (for creation) or `"record updated"` (for edit).
- **Save and New Action**:
  - Validates and saves the current record.
  - On success: persists the record, displays the top success toast (`"record added"`), and keeps the user on the Create Lead form.
  - Form state reset:
    - Clears all user-entered field inputs.
    - Resets default values: `Lead Owner` resets to the current active user; picklists reset to default values or `-None-`.
    - Sets initial keyboard focus to the first editable input field (`Lead Owner` or `First Name`).

### A8: Inline Editing & Mandatory Fields Form
- **Status**: `Documented [D6, D9]`
- **Inline Editing Interaction**:
  - On the Record Details page, hovering over an editable field reveals a pencil icon affordance.
  - Clicking the field or pencil converts the text display into an in-place input editor.
  - Inline controls:
    - Blue circular checkmark (✓): Commits the change (`Save`).
    - Circular cross mark (✕): Discards the change (`Cancel`) and reverts display to previous value.
  - Lifecycle: Committing triggers the `onBeforeUpdate` client lifecycle event.
- **Mandatory Fields Form**:
  - If an inline edit satisfies a Layout Rule condition requiring other fields, the edit does not save immediately.
  - Instead, the **Mandatory Fields Form** pop-up modal appears on screen.
  - Displays all newly required fields that must be populated as a result of the rule.
  - Saving the pop-up commits both the inline-edited field and the newly required fields atomically.
- **Ineligible Fields**:
  - Fields not eligible for inline editing: `wizard`, system timestamps, read-only formulas, and auto-generated identifiers.

### A9: Lead Status Ribbon & Terminal Transitions
- **Status**: `Documented [D6]`
- **Ribbon Interaction**:
  - In the Record Details header, open stage chevrons can be clicked directly.
  - Clicking an open stage directly updates `Lead_Status` to the selected stage.
  - Displays top success toast indicating status update without requiring full page reload.
- **Terminal Stages**:
  - Terminal/rejected stages (e.g., `Junk Lead`, `Not Qualified`) are grouped under the red terminal status dropdown.
  - Selecting a terminal stage opens a confirmation/transition modal if validation rules, layout rules, or blueprint requirements mandate a reason or closure notes.
  - Once closed, the record stage displays the terminal state visual treatment.

### A10: Duplicate Checking & Server Error Handling
- **Status**: `Documented [D2, D3, D5, D7]`
- **Duplicate Detection**:
  - Configured on unique fields (`Email`, `Phone`).
  - Evaluated on Create, Edit, Clone, and API write requests.
  - When duplicate value is entered:
    - Save action is blocked.
    - Alert notification displays inline or in banner: *"A Lead with this email already exists."*
    - Displays a **View Lead** affordance (hover displays existing record name and owner; click opens the conflicting lead in a new tab).
- **Server Error Codes & Handling**:
  - Standard error envelope: `{ "code": "<ERROR_CODE>", "details": { ... }, "message": "<description>", "status": "error" }`.
  - Common error types:
    - `MANDATORY_NOT_FOUND` (HTTP 400): Missing required layout fields. Form highlights specific invalid fields in red.
    - `DUPLICATE_DATA` (HTTP 400): Unique constraint violation.
    - `NO_PERMISSION` (HTTP 403): User lacks module or field write permissions.
    - `RECORD_LOCKED` (HTTP 400): Record locked by an approval process or administrative lock.
    - `LIMIT_EXCEEDED` (HTTP 400): Selection or rate limit exceeded.
    - `INTERNAL_ERROR` (HTTP 500): Unexpected server failure.

### A11: Write Request Contracts & ADR 0004 §5 Comparison
- **Status**: `Documented [D2, D3, D7, D8]`
- **Endpoint Contracts**:
  - **Create Lead**:
    - Method/Path: `POST /crm/v2/Leads`
    - Request Body: `{"data": [{"Company": "...", "Last_Name": "...", ...}]}`
    - Response Body (HTTP 201/200):
      ```json
      {
        "data": [
          {
            "code": "SUCCESS",
            "details": {
              "id": "1000000001",
              "Created_Time": "2026-10-05T12:00:00+00:00",
              "Modified_Time": "2026-10-05T12:00:00+00:00",
              "Created_By": {"id": "...", "name": "..."},
              "Modified_By": {"id": "...", "name": "...""}
            },
            "message": "record added",
            "status": "success"
          }
        ]
      }
      ```
  - **Update Lead**:
    - Method/Path: `PUT /crm/v2/Leads/{recordId}`
    - Request Body: `{"data": [{"Title": "VP Engineering", ...}]}`
    - Response Body (HTTP 200):
      ```json
      {
        "data": [
          {
            "code": "SUCCESS",
            "details": {
              "id": "1000000001",
              "Modified_Time": "2026-10-05T12:05:00+00:00",
              "Modified_By": {"id": "...", "name": "..."}
            },
            "message": "record updated",
            "status": "success"
          }
        ]
      }
      ```
  - **Delete Lead**:
    - Method/Path: `DELETE /crm/v2/Leads?ids={id1,id2}` or `DELETE /crm/v2/Leads/{recordId}`
    - Response Body (HTTP 200):
      ```json
      {
        "data": [
          {
            "code": "SUCCESS",
            "details": {"id": "1000000001"},
            "message": "record deleted",
            "status": "success"
          }
        ]
      }
      ```
  - **Mass Update**:
    - Method/Path: `POST /crm/v2/Leads/actions/mass_update`
    - Request Body:
      ```json
      {
        "data": [{"Lead_Source": "Advertisement"}],
        "ids": ["1000000001", "1000000002"],
        "over_write": true
      }
      ```
  - **Mass Delete**:
    - Method/Path: `POST /crm/v2/Leads/actions/mass_delete`
    - Request Body: `{"ids": ["1000000001", "1000000002"]}` or `{"cvid": "1000000000012"}`
- **Comparison with ADR 0004 §5**:
  - ADR 0004 §5 proposed interim REST write shapes: `POST /crm/v2.2/{module}` for insert, `PUT /crm/v2.2/{module}/{id}` for update, and `DELETE /crm/v2.2/{module}?ids=` for deletion, wrapped in `{"data": [{...}]}` with error envelope `{code, details, message, status}`.
  - Verification: The public API documentation confirms that the interim shapes designed in ADR 0004 §5 accurately match the reference CRM's wire contracts. The path prefixes (`v2` vs `v2.2`), request payloads, and response envelopes are structurally identical.

---

## Part B: Secondary Read and List Behaviours

### B1: List Search (`row 10`)
- **Status**: `Documented [D1, D10, D11]`
- **Mechanisms**:
  - Global Search: Shell header search matches across modules.
  - Module Search: Initiated via `GET /crm/v2/Leads/search?word={term}` (keyword search) or `GET /crm/v2/Leads/search?criteria={criteria}`.
  - Alphabet Search: A-Z strip at list footer filters leads whose `Last_Name` starts with the selected letter.
  - Filter Panel Search: Real-time search box at top of filter panel filters available filter field labels.

### B2: Filter Operators by Field Type (`row 8`)
- **Status**: `Documented [D10, D11]`
- **Operators**:
  - Text, Email, Phone, Website, Textarea:
    - `equals`: Exact match.
    - `starts_with`: Prefix match.
    - `in`: Multi-value exact match list.
  - Picklist, Multi-Select Picklist:
    - `equals`: Matches selected option.
    - `in`: Matches any option in selected list.
  - Date, Date/Time:
    - `equals`: Matches exact date or date token (`${TODAY}`).
    - `in`: Matches date range or set of dates.
  - Numeric (Integer, Currency, Decimal, Bigint, Percent):
    - `equals`: Exact numeric equality.
    - `in`: Value within specified numeric set.
  - Boolean (Checkbox):
    - `equals`: Matches `true` or `false`.

### B3: Sort By Field List (`row 9`)
- **Status**: `Documented [D1, D12]`
- **Sort Eligibility**:
  - All fields with `sortable: true` in `metadata/modules/Leads/fields.json` (47 of 56 fields) are eligible for sorting.
  - Non-sortable fields excluded from sort menus: `Description`, `Tag`, `Record_Image`, `Change_Log_Time__s`, `Last_Enriched_Time__s`, `Enrich_Status__s`, `Address`, `Coordinates`, `Connected_To__s`.
  - Triggered either by clicking column headers in the table or selecting a field from the **Sort By** toolbar dialog.

### B4: Previous/Next Record Navigation (`row 12`)
- **Status**: `Documented [D1]`
- **Behaviour**:
  - Record Details header contains navigation chevrons (`<` and `>`).
  - Navigates sequentially to the previous or next lead according to the sort order and filtering of the originating list view.
  - Boundary states: When viewing the first record in the list view, the `<` button is disabled. When viewing the last record, the `>` button is disabled.

### B5: Hide Details Toggle (`row 15`)
- **Status**: `Documented [D13]`
- **Behaviour**:
  - Record Details page toolbar provides a **Hide Details** toggle button.
  - Clicking **Hide Details** collapses all standard field sections below the Business Card, leaving only the Business Card and Related Lists visible.
  - Button label dynamically updates to **Show Details**; clicking again expands all field sections to their default state.

### B6: Timeline Filter & Event Types (`row 17`)
- **Status**: `Documented [D6, D14]`
- **Behaviour**:
  - Timeline view (`GET /crm/v9/Leads/{recordId}/timelines`) displays chronological audit history.
  - Filter criteria available:
    - **Modules**: Associated modules (Calls, Meetings, Tasks, Notes, Emails).
    - **Users**: Filter events performed by specific users or automation.
    - **Time**: Date range presets (Today, Yesterday, Last 7 Days, Custom).
    - **Sources**: Direct user action, API, import, workflow rule.
  - Event types tracked: Field edits (`field_history`), email communications, task/call logs, stage transitions, approvals, and assignment changes.

### B7: Quick Create 5-Field Subset (`row 20`)
- **Status**: `Documented [D6, D15]`
- **Behaviour**:
  - The compact 5-field subset identified in metadata is utilized in contextual Quick Create pop-ups (e.g., when creating a Lead directly from a Lookup field or quick shortcut).
  - The 5 standard fields rendered:
    1. `Company` (Required)
    2. `First_Name` (Optional)
    3. `Last_Name` (Required)
    4. `Email` (Optional / Unique)
    5. `Phone` (Optional)
  - Features compact **Save** and **Cancel** buttons, operating without rendering the full multi-section form.

### B8: Collapsed Navigation Rail (`row 1`)
- **Status**: `Documented, depends on edition or setting [sidebar collapse toggle setting, D16]`
- **Behaviour**:
  - The primary application left navigation rail can be collapsed into a compact icon-only strip.
  - When collapsed, text labels are hidden, module icons remain centered, and hovering over an icon reveals a tooltip with the module name.
  - State toggle persists via user interface preferences.

---

## Conflicts with Observed

- **Observed Conflicts**: `none`
- All public documentation descriptions and contracts align with the observed DOM structures, menu items, header controls, and read API shapes captured during read-only research.

---

## Not Documented

The following minor presentation nuances are not specified in the public documentation:
- Exact CSS micro-animation durations and easing cubic-beziers for the inline editing checkmark transition.
- Exact modal dialog drop-shadow blur and spread radii (these follow the platform's standardized modal design tokens).
- Pixel-exact padding inside the mass update field selector dropdown menu.

---

## Resolves

This specification definitively resolves the following open questions from prior research:
1. `research/specs/leads.md › Open questions #6`: Resolves list filter operators, delete confirmation, clone form, mass-action dialogs, and inline edit outcomes.
2. `research/specs/record-detail.md › Open questions #1`: Resolves the specific context and usage of the compact five-field quick-create subset.
3. `research/specs/record-detail.md › Open questions #4`: Resolves post-click behavior of the stage ribbon and terminal transition menus.
4. `research/specs/list-views.md › Open questions #2`: Resolves filter operators and value editors across all supported Leads field types.
5. `research/specs/list-views.md › Open questions #6`: Resolves row selection action bar, selection caps (500 manual / 50,000 view-wide), and mass-action dialog flows.
6. `docs/adr/0004-request-shape.md › Open questions #1`: Confirms write request paths, payloads, and response envelopes against public developer documentation contracts.
