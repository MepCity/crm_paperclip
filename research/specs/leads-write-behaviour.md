# Leads — Write Behaviour Specification

Status: Specification of write, mutation, bulk, and secondary read behaviours derived strictly from the reference CRM's public documentation (help guides and developer documentation). This specification supplements the read-only research recorded in `research/specs/leads.md`, `research/specs/leads-fields-and-layout.md`, `research/specs/list-views.md`, `research/specs/record-detail.md`, and `research/specs/request-shapes.md`.

## Purpose

The board's strict read-only policy forbids executing mutations against the reference CRM environment. Consequently, user-initiated write flows—such as record deletion, cloning, mass actions, inline updates, stage transitions, and form submissions—could not be observed via live capture execution.

This document establishes the behavioral and contract specification for these write interactions in Module 1 (Leads) using the reference CRM's public help guides and developer documentation. Sources are referenced using neutral keys (`D1`–`D8`, `D10`, `D12`), with complete URLs, titles, timestamps, and verbatim quotes maintained exclusively in local workspace research notes (`docs-notes/leads-write-behaviour.md`) outside version control.

Strict adherence to evidence is maintained throughout: any behavior, interface label, or post-mutation outcome not explicitly stated in public documentation is designated as `Not documented`. No speculative, estimated, or invented user interface details are included.

## Sources

Public documentation sources relied upon are referenced throughout this document using neutral keys:

| Key | Documentation Type | Scope |
| --- | --- | --- |
| `D1` | Public Help Documentation | Record management, common operations (delete, clone, mass actions, record-level navigation) |
| `D2` | Developer Documentation (REST API) | Insert records endpoint, request/response envelopes, error codes |
| `D3` | Developer Documentation (REST API) | Delete records endpoint, batch deletion limits, response structures |
| `D4` | Developer Documentation (REST API) | Record clone endpoint, excluded fields and properties |
| `D5` | Public Help Documentation | Duplicate detection, unique fields behavior, duplicate handling on clone/create/edit |
| `D6` | Developer Documentation (Client Scripts) | Form events, inline edit lifecycle, mandatory fields form |
| `D7` | Developer Documentation (REST API) | Mass update endpoint, selection limits, multi-select picklist modes |
| `D8` | Developer Documentation (REST API) | Mass delete endpoint, criteria and selection parameters |
| `D10` | Developer Documentation (REST API) | Search records API, supported criteria operators and endpoints |
| `D12` | Public Help Documentation | List view management, column sorting options, selection in views |
| `D17` | Developer Documentation (REST API) | Update records endpoint (single and batch), request/response envelopes, append values, error codes |
| `D18` | Developer Documentation (REST API) | Change owner endpoint (single and batch), related records transfer, notification, error codes |
| `D19` | Developer Documentation (REST API) | Mass change owner endpoint, criteria, territory, job scheduling, error codes |
| `D20` | Developer Documentation (REST API) | Common status codes and HTTP error series |
| `D21` | Developer Documentation (REST API) | Mass update status endpoint, job tracking, status response keys |
| `D22` | Developer Documentation (REST API) | Mass delete status endpoint, job tracking, status response keys |
| `D23` | Developer Documentation (REST API) | Mass change owner status endpoint, job tracking, status response keys |

---

## Section A: Write and Mutation Behaviours

### A1: Lead Deletion Flow
- **Status**: `Documented [D1, D3]` (with undocumented presentation aspects noted below)
- **Documented Flow & Rules**:
  - **Entry Points**:
    1. Record Details page: `Delete` button under record details (`[Module] Details` -> `Delete`) (`D1`).
    2. List view: Check record checkbox -> Click `Delete` (`D1`).
  - **Recycle Bin & Retention**:
    - Deleted records are temporarily stored in the Recycle Bin for 60 days from the date of deletion, after which they are permanently deleted (`D1`).
    - Users with Administrator profile have access to all records in the Recycle Bin (`D1`).
    - Only the Administrator can delete records from the Recycle Bin (`D1`).
  - **Cascading Deletion**:
    - When a record is deleted, all associated child records—including notes and open/closed activities—are also deleted (`D1`).
  - **Permissions**:
    - If a single record is selected for deletion, standard `Delete` permission is sufficient (`D1`).
    - Bulk deletion of multiple selected records requires `Mass Delete` profile permission (`D1`).
  - **API Contract**:
    - Single record deletion: `DELETE /{module_api_name}/{record_id}` (`D3`).
    - Batch deletion: `DELETE /{module_api_name}?ids={record_id1,record_id2,..}` with an explicit cap of maximum 100 records per API call (`D3`).
- **Not Documented**:
  - Confirmation modal dialog title (e.g. `Delete Lead` is not documented in public guides).
  - Confirmation prompt body text and warning copy.
  - Confirmation modal action button labels and visual styling.
  - Post-deletion UI redirection target page (e.g. whether the user is redirected to the active list view).
  - UI success notification toast message text and screen placement (the string `"record deleted"` is the backend REST API response payload message attribute from `D3`, not a documented web UI toast notification).
  - Whether restoring a parent record from the Recycle Bin automatically restores all associated cascading child records.

### A2: Lead Cloning Flow
- **Status**: `Documented [D1, D4, D5]`
- **Documented Flow & Rules**:
  - **Trigger & Target**:
    - In the Record Details page (`[Module] Details`), click `Clone` (`D1`).
    - Opens the `Clone [Record]` page (`D1`).
  - **Controls**:
    - In the `Clone [Record]` page, modify the required details and click `Save` (`D1`).
  - **Clone API (D4)**:
    - Field values from the source record are copied to the cloned record by default (`D4`).
    - The following fields and properties are explicitly excluded during the record cloning process via API (`D4`):
      - Field Types: File Upload, Image Upload (`D4`).
      - Transient / Module-Specific Fields: `wizard`, `data_processing_basis_details` (if GDPR is enabled) (`D4`).
      - Field Properties: `read_only`, `external`, and internal system `$` properties (`D4`).
    - Whether the web UI clone form excludes the exact same set of fields is Not documented.
  - **Unique Fields Behaviour on Clone**:
    - On the `Clone [Record]` page, the user must manually remove unique field values and update them before saving to prevent duplicate validation rejection (`D5`).
- **Not Documented**:
  - Availability or behavior of a `Save and New` button on the clone form.
  - Availability or behavior of a `Cancel` button and its navigation return destination.
  - Post-save redirection target page (e.g. whether user navigates to the newly cloned record's detail page or returns to the source record).
  - Whether the UI clone form excludes the exact same field types and system properties as the Clone API (`D4`).

### A3: List Row Selection & Bulk Actions
- **Status**: `Documented, depends on edition or setting [D1, D12]`; visual layout and counter format `Observed [w2d-select-one, w2d-change-owner]`
- **Documented Flow & Rules**:
  - **Selection Interaction**:
    - Checkboxes allow selecting records individually or selecting all records within the page (`D1`).
    - Selecting records displays the mass action menu on top of the screen (`D12`).
  - **Live UI Observation (Selection Toolbar & Actions Dropdown)**:
    - Upon selecting one or more records, the top list toolbar is replaced by the selection toolbar (`w2d-select-one`).
    - **Selection counter & clear link**: Left strip measures 170 × 42 px (x 335–505, y 95–137), displaying the selection count formatted as `"{n} record selected."` (measured: `"1 record selected."`) in `#313949`, followed by a `"Clear"` action link (34 × 16 px at x 471, y 108) that clears the selection.
    - **Record Actions button strip**: Right strip measures 356 × 32 px (x 520–876, y 100–132) and displays four action controls in screen order:
      1. `Send Email` button (101 × 32 px)
      2. `Tags` button (73 × 32 px)
      3. `Mass Update` button (113 × 32 px)
      4. `Actions` dropdown button (45 × 32 px)
      - All four buttons have a 1 px `#D5D8E9` border, light vertical gradient `#FDFDFE` to `#F3F2F8`, 6 px corner radius, and regular text in `#313949`.
    - **Selection Actions dropdown menu**: Clicking `Actions` opens an anchored popover menu measuring approx 200 × 354 px (x 838–1038, y 139–493) with a white surface, 6 px corner radius, soft shadow, and 11 menu item rows in exact screen order (`w2d-change-owner`):
      1. `Run Macro` (item row 200 × 32 px)
      2. `Create Task` (item row 200 × 32 px)
      3. `Change Owner` (item row 200 × 32 px)
      4. `Cadences` (item row 200 × 32 px)
      5. `Add to Campaigns` (item row 200 × 32 px)
      6. `Print Mailing Labels` (item row 200 × 32 px)
      7. `Print Using Canvas` (item row 200 × 34 px)
      8. `Mail Merge` (item row 200 × 32 px)
      9. `Mass Convert` (item row 200 × 32 px)
      10. `Delete` (item row 200 × 32 px)
      11. `Export Selected Records` (item row 200 × 32 px)
  - **Available Bulk Actions in List View**:
    - The documentation identifies the following actions available for bulk execution: Change Record Owners (`Change Owner`), Run Macro, Send Mass Emails, Create Task, Add or Remove Tags, Mass Update, Mass Record Convert (where applicable), Bulk Mail Merge, Set Reminders, and Delete (`D1`, `D12`).
  - **Manual Selection Limit**:
    - When selecting records manually, there is a hard limit of selecting 500 records at once (`D1`).
  - **View-Wide Selection**:
    - The "Select all records in this view" option allows performing mass actions on all records within a specific view (`D1`, `D12`).
  - **Edition & Volume Dependencies**:
    - The "Select All [Records] in this View" link is available only in two named editions (`D12`; the names are in the key list).
    - The link does NOT appear if there are more than 50,000 records in the custom list view (`D12`).
    - The link does NOT appear if a mass update is already in progress (`D12`).
  - **Execution Feedback**:
    - After applying a mass update, change owner, or delete action, a progress bar at the bottom right corner of the screen indicates the update status (`D12`).
- **Visual Layout of Selection Controls**:

| Element | Measured value / visible state | Source slug |
| --- | --- | --- |
| Selection toolbar | Left counter strip 170 × 42 px (x 335–505, y 95–137) showing "{n} record selected." in `#313949` with "Clear" link (34 × 16 px at x 471, y 108); right Record Actions button strip 356 × 32 px (x 520–876, y 100–132) holding Send Email (101 × 32 px), Tags (73 × 32 px), Mass Update (113 × 32 px), and Actions menu button (45 × 32 px); buttons feature 1 px `#D5D8E9` border, light vertical gradient `#FDFDFE` to `#F3F2F8`, 6 px corners, text `#313949` | `w2d-select-one` |
| Selection Actions menu | Popover menu approx 200 × 354 px (x 838–1038, y 139–493) anchored beneath the Actions dropdown button; contains 11 operations in screen order: Run Macro, Create Task, Change Owner, Cadences, Add to Campaigns, Print Mailing Labels, Print Using Canvas, Mail Merge, Mass Convert, Delete, Export Selected Records; white surface, 6 px corners, soft shadow, item rows 32 px high (Print Using Canvas 34 px) with `#313949` text, hovered row `#F0F4FC` | `w2d-change-owner` |

- **Not Documented**:
  - Presentation and placement of "Select all records in this view" link when more than 10 records exist.
  - Multi-page selection counter format (e.g. across multiple pages).
  - Post-action UI feedback toasts and confirmation dialog details.

### A4: Mass Update Flow
- **Status**: `Documented [D1, D7]`
- **Documented Flow & Rules**:
  - **Access Paths**:
    1. From List View: Select record checkboxes -> Under `More Actions`, click `Mass Update` -> In the `Select field to update` popup, choose the field that you want to update for the records, specify the value, and click `Save` (`D1`).
    2. From Module Tools: Click `[Module] Tools` > `Mass Update [Module]` -> Specify criteria -> Click `Search` -> Under `Matching [records]`, select checkboxes -> Click `Mass Update` -> In `Select Field to Update` page, select field, enter data, and click `Save` (`D1`).
  - **Ineligible Fields**:
    - Text Area and Lookup fields cannot be updated using the Mass Update feature (`D1`).
    - Email, lookup fields, layout fields, multi line fields, and line items cannot be mass updated via API (`D7`).
  - **Multi-Select Picklist Handling**:
    - During Mass Update of multi-select fields the user chooses `Overwrite` or `Append` (`D1`).
    - `Overwrite`: the default option in the interface; replaces the previous value (`D1`).
    - `Append`: keeps the previous value and adds the new one (`D1`).
    - API: the optional boolean `over_write` replaces all values when `true` and adds the value when `false`; its default is `false`, the opposite of the interface default (`D7`).
  - **Execution Limits**:
    - Up to 500 records in a single operation via manual selection (`D1`, `D7`). For larger sets, selecting all records in the view is used (`D1`).
    - Up to 50,000 records via custom view (`D7`), with the view-wide selection link not appearing if the view exceeds 50,000 records (`D12`).
  - **Permissions**:
    - Requires `Mass Update` profile permission for the module (`D1`).
- **Not Documented**:
  - Modal dialog window title (`Mass Update Leads` is not documented; the popup is titled `Select field to update` in `D1`).
  - Form input styling and exact layout of field-specific input widgets within the popup.
  - Result confirmation message or toast text upon completion.

### A5: Mass Transfer / Ownership Transfer Flow
- **Status**: `Documented [D1]`; entry point observed `[w2d-change-owner]`
- **Documented Flow & Rules**:
  - **Access Paths**:
    1. List View Selection: Select record checkboxes -> Click `Actions` dropdown -> Select `Change Owner` -> In `Change Owner` page/dialog, select new user from `Change Owner` picklist, select checkboxes for associated related records, and click `Change Owner` (`D1`).
    2. Module Tools: Click `[Module] Tools` > `Mass Transfer [Module]` -> Navigates to `Mass Transfer [Module]` page (`D1`).
  - **Live UI Observation (Change Owner Entry Point)**:
    - In row selection state, clicking `Actions` exposes `Change Owner` as the 3rd item in the 11-item bulk actions popover menu (`w2d-change-owner`).
    - **Capture Tool Safety Skip**: In capture `w2d-change-owner`, the capture tool targeted the `Change Owner` menu item, but skipped the click because the element's framework event binding attribute contained the word `update` (`dangerous attribute: update`). Per Rule 6, the safety guard was not bypassed, and the mutation/dialog was not opened. Consequently, the Change Owner modal dialog or target page, new owner selector, and related records checkboxes remain `Not observed` in the live UI.
  - **Tool Page Configuration & Criteria**:
    - In `Select New Owner` section, select the owner's name for `Transfer From` and `Transfer To` fields (`D1`).
    - Criteria Step: Specify criteria to filter records -> Click `Search` -> Under `Matching [records]`, select checkboxes -> Click `Transfer` (`D1`).
  - **Associated Activities**:
    - Allows selecting open activities that should be transferred to the new owner (`D1`).
    - For Leads, associated open activities (Tasks, Events, scheduled/overdue Calls) can be transferred if owned by the same record owner, subject to the user's module permissions (`D1`).
  - **Permissions**:
    - Requires the `Mass Transfer` profile permission for the module (`D1`). The `Change Owner` option is not available for records on which the user has read-only permission (`D1`).
- **Not Documented**:
  - Modal vs full-page presentation in the modern web UI (help documentation describes a dedicated `Change Owner page` and `Mass Transfer [Module] page`; live UI dialog remains unobserved due to capture safety skip).
  - Dialog title, user selector widget styling, and checkbox labels/default checked states for associated related records.
  - Checkbox labels and default checked states for closed activities.
  - Post-transfer result toast or banner message text.

### A6: Mass Delete Flow
- **Status**: `Documented [D1, D8]`
- **Documented Flow & Rules**:
  - **Access Paths**:
    1. List View: Select checkboxes -> Click `Delete` (`D1`).
    2. Module Tools: Click `[Module] Tools` > `Mass Delete [Module]` -> Specify criteria -> Click `Search` -> Under `Matching [records]`, select checkboxes -> Click `Delete` (`D1`).
  - **Recycle Bin**:
    - Bulk deleted records are temporarily stored in the Recycle Bin for 60 days (`D1`).
  - **Permissions**:
    - If a single record is selected, only `Delete` permission is required (`D1`).
    - If multiple records are selected, `Mass Delete` profile permission is required (`D1`).
  - **Limits**:
    - Up to 500 records via manual selection (`D1`, `D8`). For larger selections, view-wide selection is used (`D1`).
    - Up to 50,000 records via custom view (`D8`), with view-wide selection unavailable when the view exceeds 50,000 records (`D12`).
- **Not Documented**:
  - Confirmation modal dialog window title.
  - Warning message text and prompt copy.
  - Confirmation modal button labels and styling.
  - Result notification message upon deletion.

### A7: Save and Save and New Behaviours
- **Status**: `Not documented`
- **Explanatory Details**:
  - While public documentation references `Save` and `Save and New` buttons (e.g. `D1`, `D6`), post-submission UI flows are not documented in public guides:
    - Target page navigation after successful save (whether the user navigates to the Record Details page, remains on the list view, or stays in form context).
    - UI toast or banner notification message text and placement. (Note: the strings `"record added"` and `"record updated"` are backend REST API response payload attributes from `D2`, not documented web UI notifications).
    - Form reset behavior after clicking `Save and New`: field value clearing, preservation of default values (e.g. Lead Owner), and input autofocus target are not documented.
  - Because the reference CRM environment is strictly read-only, these post-write UI states cannot be observed.

### A8: Inline Editing & Mandatory Fields Form
- **Status**: `Documented [D6]` (partially)
- **Documented Flow & Rules**:
  - **Commit Interaction**:
    - Committing an inline edit occurs by clicking the checkmark tick icon after updating a field, which fires the `onBeforeUpdate` event (`D6`).
  - **Mandatory Fields Form**:
    - When an inline edit on the detail page satisfies a layout rule requiring additional mandatory fields, a popup form titled `Mandatory fields form` appears to collect values for those mandatory fields (`D6`).
    - Triggers `onMandatoryFormLoad` when the pop-up appears, and `onBeforeMandatoryFormSave` when the form's save button is clicked (`D6`).
- **Not Documented**:
  - Hover behavior and appearance of a pencil icon affordance (not present in saved public documentation).
  - Cancel affordance (cross/cancel icon and its behavior).
  - Field-type-specific inline editor controls (e.g. date pickers, picklist dropdowns, text inputs).
  - UI presentation and styling of validation or server errors when inline save fails.

### A9: Stage Ribbon Application & Terminal Transitions
- **Status**: `Not documented`
- **Explanatory Details**:
  - Public documentation does not document the interactive click behavior of the stage ribbon in Leads.
  - Specifically, whether clicking an open stage chevron opens a confirmation modal, prompts for additional fields, displays a notification, or commits immediately is undocumented in public guides.
  - `D6` client script documentation does not define stage ribbon click events for the Leads module.

### A10: Duplicate Checking & Server Error Handling
- **Status**: `Documented, depends on edition or setting [D2, D5]`
- **Documented Flow & Rules**:
  - **Duplicate Detection on Unique Fields**:
    - Active when unique field checking (e.g., on Email) or Duplicate Check Preferences are configured in settings (`D5`).
    - Evaluated during manual record creation, editing, cloning, and API inserts (`D5`).
    - Alert notification: When entering a duplicate lead, an alert message notifies the user of the existing record (`D5`).
    - Save prevention: During record creation or editing, a notification message prevents saving if an email address matches an existing record (`D5`).
    - Single duplicate: When exactly one duplicate record exists, a `View Lead` option is available; hovering over the `View Lead` icon shows the record name and owner, and clicking it displays the full record details (`D5`).
    - Multiple duplicates: If multiple duplicate records exist with the same email address, an alert message prompts the user to merge the records (`D5`).
  - **Server Error Codes (Public REST API)**:
    - `MANDATORY_NOT_FOUND` (HTTP 400): Missing mandatory layout fields (`D2`).
    - `DUPLICATE_DATA` (HTTP 400): Unique constraint violation (`D2`).
    - `NO_PERMISSION` (HTTP 403): User lacks module or field permissions (`D2`).
    - `INTERNAL_ERROR` (HTTP 500): Server error (`D2`).
- **Not Documented**:
  - Visual presentation, styling, and placement of server-side errors on web forms outside the unique field alert.

### A11: Write Request Contracts & ADR 0004 §5 Comparison
- **Status**: `Documented [D2, D3, D7, D8, D17, D18, D19, D20, D21, D22, D23]`
- **Public REST API Specifications**:
  - Sample requests use the path prefix `/crm/v2` (`D2`, `D3`, `D7`, `D10`, `D17`) and `/crm/v8` (`D4`, `D8`, `D18`, `D19`, `D21`, `D22`, `D23`); the status codes page (`D20`) shows no request; the host is not recorded here.
  - **Create Lead**: `POST /{module_api_name}` (`D2`). Payload: `{"data": [{"Company": "...", "Last_Name": "...", ...}]}`. A maximum of 100 records can be inserted per API call (`D2`). Success response: `{"data": [{"code": "SUCCESS", "details": {"Modified_Time": "...", "Modified_By": {...}, "Created_Time": "...", "id": "...", "Created_By": {...}}, "message": "record added", "status": "success"}]}`.
  - **Update Lead**: `PUT /{module_api_name}/{record_id}` (single) or `PUT /{module_api_name}` (batch, max 100 records per call) (`D17`). Payload: `{"data": [{"id": "...", "Field": "Value", ...}], "trigger": ["approval", "workflow", "blueprint"], "$append_values": {"Multi_Select_Field": true}, "apply_feature_execution": [{"name": "layout_rules"}], "skip_feature_execution": [{"name": "cadences"}]}` (`D17`). In `PUT /{module_api_name}`, the `id` key is mandatory in each record object (`D17`). In case of partial success or failure across multiple records, the API returns an HTTP status 207 (Multi-Status), where individual record-level success or error details are provided within the response array in the same order (`D17`). Success response: `{"data": [{"code": "SUCCESS", "details": {"Modified_Time": "...", "Modified_By": {...}, "Created_Time": "...", "id": "...", "Created_By": {...}}, "message": "record updated", "status": "success"}]}` (`D17`).
  - **Delete Lead**: `DELETE /{module_api_name}/{record_id}` (single) or `DELETE /{module_api_name}?ids={id1,id2,...}` (batch, max 100 records per call) (`D3`). Success response: `{"data": [{"code": "SUCCESS", "details": {"id": "..."}, "message": "record deleted", "status": "success"}]}`.
  - **Change owner (single)**: `POST /{module_API_name}/{record_ID}/actions/change_owner` (`D18`). Payload: `{"owner": {"id": "..."}, "notify": false, "related_modules": [{"api_name": "Tasks", "id": "..."}]}` (`D18`). The page describes `ids` as mandatory when the owner of multiple records is changed and shows one sample input, which carries `ids` (`D18`). Ownership transfer of related records is supported only for Tasks, Meetings, and Calls; unless specified, related records are not transferred (`D18`). The sample input uses the `api_name` values `Tasks` and `Events` (`D18`). Email notification to new owner defaults to `false` (`D18`). Success response: `{"data": [{"code": "SUCCESS", "details": {"id": "..."}, "message": "owner is successfully updated", "status": "success"}]}` (`D18`).
  - **Change owner (mass)**:
    - ID-based mass transfer: `POST /{module_API_name}/actions/change_owner` (`D18`). Payload: `{"ids": ["id1", "id2"], "owner": {"id": "..."}, "notify": false, "related_modules": [...]}` (`D18`). A maximum of 500 record IDs can be included in a single API call (`D18`). Related records transfer is supported only for Tasks, Meetings, and Calls (`D18`). Success response matches single ownership update (`D18`).
    - Custom view / territory mass transfer: `POST /{module_API_name}/actions/mass_change_owner` (`D19`). Payload: `{"cvid": "...", "owner": {"id": "..."}, "territory": {"id": "...", "include_child": true}, "criteria": {"field": {"api_name": "Stage", "id": "..."}, "comparator": "equal", "value": "..."}}` (`D19`). Changes the owner of up to 50,000 records in a custom view (`D19`). Cannot change the owner of related records (`D19`). Availability depends on edition (`D19`). Schedules a background job and returns a `job_id`; job statuses are retrievable for up to 60 days (`D19`). Success response: `{"data": [{"code": "SUCCESS", "details": {"job_id": "..."}, "message": "change owner is successfully scheduled", "status": "success"}]}` (`D19`). Job status query: `GET /{module_API_name}/actions/mass_change_owner?job_id={job_ID}` (`D23`), returning `Status` (`COMPLETED`, `SCHEDULED`, `RUNNING`, `FAILED`), `Total_Count`, `Updated_Count`, `Not_Updated_Count`, `Failed_Count` (`D23`).
  - **Mass Update**: `POST /{module_api_name}/actions/mass_update` (`D7`). Payload: `{"data": [{"Field": "Value"}], "ids": ["id1", "id2"], "over_write": true}` (up to 500 records) or with `"cvid": "..."` (up to 50,000 records). Only one field can be updated per API call (up to three fields in the Deals module) (`D7`). When specifying `cvid`, it initiates a background job and returns a `job_id` (`D7`). Scheduler-type success response carries `details.job_id` and the message `mass update scheduled successfully` (`D7`). `LIMIT_EXCEEDED` (HTTP 400) is listed for a record count above the maximum of 50,000 (`D7`). The response to more than 500 ids in one call is Not documented. `over_write` is optional and defaults to `false` (`D7`). For the non-scheduler type the response keys list puts the modified time and the modifying user's name and ID under `details`, and also lists `created_time`, `id` and `Created_By` without stating where they sit (`D7`); the page shows no sample of that response. Job status query: `GET /{module_API_name}/actions/mass_update?job_id={job_ID}` (`D21`), returning `Status` (`COMPLETED`, `SCHEDULED`, `RUNNING`, `FAILED`), `Total_Count`, `Updated_Count`, `Failed_Count`, `Not_Updated_Count` (`D21`).
  - **Mass Delete**: `POST /{module_api_name}/actions/mass_delete` (`D8`). Payload: `{"ids": ["id1", "id2"]}` (up to 500 records) or `{"cvid": "..."}` (up to 50,000 records). Success response message is `"record is deleted"` for record IDs or `details.job_id` with `"mass delete scheduled successfully"` for cvid (`D8`). The `cvid` parameter depends on edition (`D8`). Job status query: `GET /{module_API_name}/actions/mass_delete?job_id={job_ID}` (`D22`), returning `Status` (`COMPLETED`, `RUNNING`, `FAILED`), `Total_Count`, `Deleted_Count`, `Failed_Count` (`D22`).
- **Error Codes Table**:

| Code | HTTP Status | Message | Trigger Condition | Sources |
| --- | --- | --- | --- | --- |
| `MANDATORY_NOT_FOUND` | HTTP 400 | "You have not specified one or more mandatory fields." / "required field not found" / "You have not specified either the CVID or the record IDs." / "You have not specified either the IDs in the request body, or the \"ids\" array is empty, or you have not specified the owner's details." / "You have not specified either the CVID, the owner's ID, or both." / "You have not included the \"job_id\" parameter in the request." | Missing mandatory module fields or required request payload keys (`cvid`, `ids`, `owner`, `job_id`) | `D2, D7, D8, D17, D18, D19, D21, D22` |
| `INVALID_DATA` | HTTP 400 / HTTP 200 (in `D7` for hidden field) | "Invalid Data" / "the id given seems to be invalid" / "record not deleted" / "The record ID is invalid." / "No field found" / "Max field limit exceeded" / "This field cannot be updated in the Mass Update" / "Field cannot be updated as it is associated with a layout rule" / "Field cannot be updated as it is associated with a validation rule" / "Field is not visible" / "The CVID is invalid." / "The territory's ID is invalid." / "The user's ID is invalid." / "The user you are trying to assign the records to is deleted from your org." / "The user you are trying to assign the records to is inactive." / "The ID given is invalid." / "Invalid data has been provided for the \"name\" key in the \"skip_feature_execution\" property" / "Either the ID of the owner or one or many IDs of the records in the \"ids\" array is invalid." | Malformed payload format, data type mismatch, invalid/deleted/inactive record or user ID, or ineligible/invisible field in mass update | `D2, D3, D7, D8, D17, D18, D19, D20` |
| `DUPLICATE_DATA` | HTTP 400 | "duplicate data" | Unique constraint violation on one or more unique fields during record insertion or update | `D2, D17` |
| `DUPLICATE_LINKING_DATA` | HTTP 400 | "Duplicate association" | Duplicate record association in multi-select lookup (MxN) field during record update | `D17` |
| `INVALID_MODULE` | HTTP 400 | "The module name given seems to be invalid" / "The given module is not supported in API" / "You have either specified an invalid module API name, there is no tab permission, or the module is removed from the list of available modules." | Specified module API name is invalid, lacks tab permission, or is unsupported in API | `D2, D3, D7, D17, D21, D22` |
| `INVALID_REQUEST_METHOD` | HTTP 400 | "The http request method type is not a valid one" / "The request method is incorrect." | Incorrect HTTP method used for the targeted API endpoint | `D2, D3, D7, D8, D17, D18, D19, D21, D22` |
| `AUTHORIZATION_FAILED` | HTTP 400 | "User does not have sufficient privilege to add records" / "User does not have sufficient privilege to delete records" / "User does not have sufficient privilege to schedule mass update." / "You do not have sufficient permission to mass delete records." / "User does not have sufficient privilege to update records" / "You do not have sufficient permission to mass update records or to get the status." | User lacks sufficient module or operation privilege | `D2, D3, D7, D8, D17, D21, D22` |
| `LIMIT_EXCEEDED` | HTTP 400 | "Only 50 participants can be added to an event." / "Record count exceeded" | Number of records exceeds allowed limit (e.g. over 50,000 in mass update) or event participant threshold | `D2, D7, D17` |
| `RECORD_LIMIT_EXCEEDED` | HTTP 400 | "The custom view has more than 50,000 records." | Custom view exceeds maximum limit of 50,000 records for mass change owner | `D19` |
| `RECORD_LOCKED` | HTTP 400 | "cannot delete record that is not approved yet" / "Cannot update record that is not approved yet" / "You cannot perform this operation as the record is locked." | Record is locked; the delete, update and mass update pages tell the caller to wait until an image validation or duplicate merge process completes | `D3, D7, D17, D18` |
| `NOT_APPROVED` | HTTP 400 | "cannot delete record that is not approved yet" / "Cannot update record that is not approved yet" / "The record you are trying to delete is unapproved." / "record not approved" | Record has not completed required approval or image validation | `D3, D7, D8, D17` |
| `NOT_SUPPORTED` | HTTP 400 | "The module is not supported to be mass-deleted through an API." / "You have specified an invalid module API name in the \"related_modules\" array, or the given module is not supported in this API." | Module not supported for mass delete, or related module not supported for ownership transfer (only Tasks, Meetings, Calls supported) | `D8, D18` |
| `EXPECTED_FIELD_MISSING` | HTTP 400 | "You have not specified either the API name or the ID of the related module." | Missing `api_name` or `id` in `related_modules` array during ownership change | `D18` |
| `AMBIGUITY_DURING_PROCESSING` | HTTP 400 | "You have specified one or more incorrect values in the input." | Conflicting or ambiguous values provided in request payload | `D18` |
| `CANNOT_PROCESS` | HTTP 400 | "The record is in stop processing" | Record is in stop processing state | `D7` |
| `RECORD_IN_BLUEPRINT` | HTTP 400 | "The record is in blue print" | Record is in blueprint and user attempts to update a blueprint-controlled picklist | `D7` |
| `CANNOT_PERFORM_ACTION` | HTTP 400 | "no permission to perform an action on this record" | User lacks permission to perform action on the specific record | `D7` |
| `NO_RECORDS_FOUND` | HTTP 400 | "no record found to update" | No records found in the specified custom view | `D7` |
| `REQUIRED_PARAM_MISSING` | HTTP 400 (`D3`) / HTTP 404 (`D23`) | "One of the expected parameter is missing" / "You have not specified the job_id in the request." | Missing expected parameter (`ids` in batch delete, or `job_id` in status query) | `D3, D23` |
| `UNABLE_TO_PARSE_DATA_TYPE` | HTTP 400 | "either the request body or parameters is in wrong format" | Malformed request parameters or invalid data types | `D3` |
| `BAD REQUEST` | HTTP 400 | "The request or the authentication considered is invalid." | General 400 bad request error | `D20` |
| `ALREADY_SCHEDULED` | HTTP 400 (`D8`) / HTTP 202 (`D7`) | "You are trying to mass delete when a mass delete job is already running." / "Already a Mass Action scheduler is running for the given cvid" | Concurrent mass action scheduler is already active for the custom view or module | `D7, D8` |
| `AUTHENTICATION_FAILURE` | HTTP 401 | "You have not authenticated the API call with a valid access token." / "You have not authorized the API call with valid access token." | Missing or invalid OAuth access token in request header | `D4, D8, D18` |
| `OAUTH_SCOPE_MISMATCH` | HTTP 401 | "Unauthorized" / "The access token you have used to make this API call does not have the required scope." | OAuth access token lacks the required scope for the operation | `D2, D3, D7, D8, D17, D18, D21, D22, D23` |
| `AUTHORIZATION ERROR` | HTTP 401 | "Invalid API key provided." | General 401 series authorization error | `D20` |
| `NO_PERMISSION` | HTTP 403 | "Permission denied to add records" / "Permission denied to delete" / "permission denied" / "Field Edit Permission not given" / "Customview not accessible" / "You do not have permission to delete the record or to mass delete." / "Permission denied to update" / "You do not have permission to retrieve mass update status." / "Permission denied to read records" / "You do not have permission to the module." / "You do not have permission to change the owner." / "You do not have permission to view the records in that custom view." | User lacks permission for the module, record, field, custom view, or action | `D2, D3, D7, D8, D17, D19, D21, D22, D23` |
| `FORBIDDEN` | HTTP 403 | "No permission to do the operation." | General 403 forbidden error | `D20` |
| `INVALID_URL_PATTERN` | HTTP 404 | "Please check if the URL trying to access is a correct one" / "The request URL is incorrect." | Request URL path or pattern is invalid | `D2, D3, D7, D8, D17, D18, D19, D21, D22, D23` |
| `NOT_FOUND` | HTTP 404 | "The specified \"job_id\" is not found or invalid." | Non-existent or invalid `job_id` during mass action status query | `D21, D22` |
| `NOT FOUND` | HTTP 404 | "Invalid request." | General 404 entry of the status codes page, written with a space | `D20` |
| `METHOD NOT ALLOWED` | HTTP 405 | "The specified method is not allowed." | Requested HTTP method is not allowed on the endpoint | `D20` |
| `ALREADY_MODIFIED` | HTTP 412 | "Record updated time has already passed if-unmodified-since time" | Record updated timestamp exceeds the value passed in `If-Unmodified-Since` header | `D17` |
| `REQUEST ENTITY TOO LARGE` | HTTP 413 | "The server did not accept the request while uploading a file, since the limited file size has exceeded." | File upload payload exceeds size limit | `D20` |
| `UNSUPPORTED MEDIA TYPE` | HTTP 415 | "The server did not accept the request while uploading a file, since the media/ file type is not supported." | Media or file type not supported | `D20` |
| `TOO MANY REQUESTS` | HTTP 429 | "Number of API requests for the 24 hour period is exceeded or the concurrency limit of the user for the app is exceeded." | Daily API call quota or concurrency limit exceeded | `D20` |
| `INTERNAL_ERROR` / `INTERNAL SERVER ERROR` | HTTP 500 | "Internal Server Error" / "Unexpected and unhandled exception in the server." / "Generic error that is encountered due to an unexpected server error." | Unexpected server-side error | `D2, D3, D7, D8, D17, D18, D19, D20, D21, D22` |

- **Error Body Structure**:
  - Sample error response body: **Not documented** across all read public developer documentation pages (`D2`, `D3`, `D7`, `D8`, `D17`, `D18`, `D19`, `D20`, `D21`, `D22`, `D23`). None of the read developer documentation pages includes a literal JSON example block illustrating a failed error response envelope.
  - However, the structural attributes of error responses are documented:
    - In batch mutations (e.g. inserting or updating multiple records), in case of partial success or failure the API returns `HTTP 207 Multi-Status` (`D2`, `D17`). The response `data` JSON array maintains the exact same order as the input records, allowing each response object to be mapped to its respective input record with individual record-level success or error details (`D2`, `D17`).
    - Two pages describe the response keys with types: `code` (string), `details` (JSON object), `message` (string) and `status` (string) (`D7`, `D19`). `D7` describes `message` as telling whether the record is updated or the reason for the error, and `status` as the record's status, naming updated and error as examples. `D8` describes only `code` and `details`.
    - The literal value of `status` in an error response is Not documented: every sample body that has a `status` key is a success response with `"status": "success"` (`D2`, `D3`, `D7`, `D8`, `D17`, `D18`, `D19`).
    - Keys that identify the failing input are named only on the change owner page, as keys "in the response", without their position in the body and without types (`D18`):
      - `api_name` and `json_path` for `MANDATORY_NOT_FOUND`: what is missing in the input.
      - an `expected_fields` array for `EXPECTED_FIELD_MISSING`: API name and JSON path of the missing fields.
      - an `ambiguity_due_to` array for `AMBIGUITY_DURING_PROCESSING`: API name and JSON path of the invalid data.
    - Whether these keys sit inside `details` is Not documented. No key that identifies a failing field is named on the insert or update page (`D2`, `D17`).
    - `MULTIPLE_OR_MULTI_ERRORS` is named in prose as the response when several validation rules fail at the same time, for a request that sends `apply_feature_execution` with `criteria_validation_rule` (`D2`, `D17`); its HTTP status, message and body are Not documented.
- **Architectural Distinction**:
  - Public developer documentation documents the external public REST API, **NOT** the reference CRM web client's internal browser AJAX/XHR network requests. Due to the board's read-only rule, internal web application network requests remain unobservable.
- **Comparison with ADR 0004 §5 Interim Shapes**:

| Operation / Aspect | ADR 0004 §5 Interim Shape | Public REST API Contract (`D2`, `D3`, `D7`, `D8`, `D17`, `D18`, `D19`, `D21`, `D22`, `D23`) | Differences & Architectural Notes |
| --- | --- | --- | --- |
| **Create Lead** | `POST /crm/v2.2/{module}`<br/>Body: `{"data": [{...}]}` | `POST /{module_api_name}`<br/>(path prefix `/crm/v2`)<br/>Body: `{"data": [{...}]}` | Path prefix differs (`/crm/v2.2/` vs `/crm/v2`). Envelopes match. Max 100 records per API call (`D2`). Success response: `"record added"`. Note: Public API is external, not internal browser API. |
| **Update Lead** | `PUT /crm/v2.2/{module}/{recordId}`<br/>Body: `{"data": [{...}]}` | `PUT /{module_api_name}/{record_id}` (single) or `PUT /{module_api_name}` (batch)<br/>(path prefix `/crm/v2`)<br/>Body: `{"data": [{...}]}` | Path prefix differs (`/crm/v2.2/` vs `/crm/v2`). Public API supports both dedicated single-record path parameter and batch update on base collection (`D17`). In batch `PUT`, `id` is required in each record object. Max 100 records per call (`D17`). Supports `$append_values` for multi-select picklists. Success message: `"record updated"`. Returns HTTP 207 Multi-Status for partial batch success (`D17`). |
| **Delete Lead (Single)** | `DELETE /crm/v2.2/{module}?ids=` (query parameter) | `DELETE /{module_api_name}/{record_id}` | Public API supports dedicated path parameter for single record deletion (`D3`). |
| **Delete Lead (Batch)** | `DELETE /crm/v2.2/{module}?ids=`<br/>No batch limit specified | `DELETE /{module_api_name}?ids={id1,id2,..}`<br/>**Max 100 records per call** (`D3`) | Public API enforces a strict cap of **100 records** per batch delete call (`D3`). |
| **Change Owner (Single)** | Not defined in ADR §5 | `POST /{module_API_name}/{record_ID}/actions/change_owner`<br/>Body: `{"owner": {"id": "..."}, "notify": false, "related_modules": [...]}` (`D18`) | Dedicated action route. Supports transferring related Tasks, Meetings, and Calls. Success message: `"owner is successfully updated"` (`D18`). |
| **Change Owner (Mass)** | Not defined in ADR §5 | `POST /{module_API_name}/actions/change_owner` (max 500 records via `ids`, `D18`) or `POST /{module_API_name}/actions/mass_change_owner` (max 50,000 records via `cvid`/`territory`, `D19`) | Dedicated action routes. ID-based route allows related Tasks/Meetings/Calls; view-based route schedules asynchronous job, returns `job_id`, does not allow related records (`D18`, `D19`). Polled via `GET .../actions/mass_change_owner?job_id={job_ID}` (`D23`). |
| **Mass Update** | Not defined in ADR §5 | `POST /{module_api_name}/actions/mass_update`<br/>Body: `{"data": [...], "ids": [...], "over_write": true}` or `{"data": [...], "cvid": "..."}` (`D7`) | Public API uses dedicated `actions/mass_update` action route. Supports `ids` (max 500) and `cvid` (max 50,000, returns `job_id`), updates 1 field (3 in Deals), plus `over_write` flag for multi-select. Returns `LIMIT_EXCEEDED` (HTTP 400) if count exceeded (`D7`). Polled via `GET .../actions/mass_update?job_id={job_ID}` (`D21`). |
| **Mass Delete** | Not defined in ADR §5 | `POST /{module_api_name}/actions/mass_delete`<br/>Body: `{"ids": [...]}` or `{"cvid": "..."}` (`D8`) | Public API uses dedicated `actions/mass_delete` action route via `POST` (documented under `/crm/v8`), returns `"record is deleted"` or schedules job with `job_id` and `"mass delete scheduled successfully"`, distinct from standard `DELETE ?ids=`. `cvid` parameter depends on edition (`D8`). Polled via `GET .../actions/mass_delete?job_id={job_ID}` (`D22`). |
| **Duplicate Conflict Status** | `HTTP 409 Conflict` | `HTTP 400 Bad Request`<br/>(`code: "DUPLICATE_DATA"`, `D2`, `D17`) | **Major discrepancy**: ADR §5 specified HTTP 409 for conflicts; reference CRM returns HTTP 400 with duplicate code. |
| **Validation Error Status** | `HTTP 400`<br/>Custom `code` / `details` | `HTTP 400 Bad Request`<br/>(`code: "MANDATORY_NOT_FOUND"`, `D2`, `D17`) | HTTP status matches. Reference CRM provides standardized error code strings. |
| **Authentication / Permission** | `HTTP 401` unauthenticated<br/>`HTTP 403` forbidden | `HTTP 401` (`AUTHENTICATION_FAILURE` in `D4`, `D8`, `D18`; `OAUTH_SCOPE_MISMATCH` in `D2`, `D3`, `D7`, `D8`, `D17`, `D18`, `D21`, `D22`, `D23`)<br/>`HTTP 403` (`NO_PERMISSION` in `D2`, `D3`, `D7`, `D8`, `D17`, `D19`, `D21`, `D22`, `D23`) | Status codes match. |
| **Error Response Envelope** | Four keys recorded as observed: `code`, `details`, `message`, `status` | Response keys `code`, `details`, `message`, `status` described with types (`D7`, `D19`); `api_name`, `json_path`, `expected_fields`, `ambiguity_due_to` named as keys "in the response" for three change owner errors (`D18`); HTTP 207 for partial success or failure of a multi-record call (`D2`, `D17`) | The four key names agree with the documented response keys. No error body sample was read, so the `status` value of an error and the position of the field-error keys (inside `details` or elsewhere) are neither confirmed nor contradicted. |
| **API Versioning** | Unified `v2.2` across all interim endpoints | Mixed versions in public docs (`/crm/v2` for insert, update, delete, mass_update, search; `/crm/v8` for mass_delete, clone, change_owner, mass_change_owner, and mass action status endpoints) | Public documentation reflects multi-version public evolution; internal CRM browser endpoints may use unified internal routing. |

---

## Part B: Secondary Read and List Behaviours

### B1: List Search (`row 10`)
- **Status**: `Documented [D1, D10]` (partially)
- **Documented Flow**:
  - Alphabet search: Selecting an alphabet letter filters the list to records starting with that chosen letter (`D1`).
  - Search records API: `GET /{module_api_name}/search?word={search_word}` or `GET /{module_api_name}/search?criteria={criteria}` (`D10`).
- **Not Documented**:
  - Screen placement of the alphabet search strip.
  - Whether alphabet search specifically targets `Last_Name` in Leads.

### B2: Filter Operators by Field Type (`row 8`)
- **Status**: `Not documented` (filter panel operators). The search API operators below are `Documented [D10]` and belong to a different surface.
- **Documented in Search API (`D10`)**:
  - Supported criteria operators: `equals`, `starts_with`, `in`.
- **Conflicts with Observed & Not Documented**:
  - UI filter panel operators and criteria by field type are **Not documented** in public help guides.
  - Search API operators (`equals`, `starts_with`, `in`) conflict with observed custom view criteria in `list-views.md`, which record: `equal`, `contains`, `not_contains`, `less_equal`.

### B3: Sort By Field List (`row 9`)
- **Status**: `Documented [D12]` (partially)
- **Documented Flow**:
  - Column sorting options: Options near the column header provide `Asc ꜛ` to sort the column in ascending order and `Descꜜ` to sort in descending order (`D12`).
- **Observed Comparison & Not Documented**:
  - Documentation (`D12`) describes sorting via `Asc ꜛ` and `Descꜜ` options under column options near the header; in observed UI captures (`list-views.md`), sorting is accessed via the toolbar `Sort` button opening a dialog (`Sort By` field, Ascending / Descending, `Cancel`, `Apply`), and a column header options menu was not captured. This is not a direct conflict but a different interface entry point.
  - A separate "Sort By" dialog or toolbar menu listing sortable fields is **Not documented** in public help documentation.

### B4: Previous/Next Record Navigation (`row 12`)
- **Status**: `Documented [D1]`
- **Documented Flow**:
  - Record-level navigation enables moving to previous or next consecutive records, as well as navigating directly to the first or last record in the list (`D1`).
- **Not Documented**:
  - Chevron icon styling and boundary disabled states (e.g. disabled `<` on first record and `>` on last record).

### B5: Hide Details Toggle (`row 15`)
- **Status**: `Not documented`
- **Explanatory Details**: Official public help documentation does not document a "Hide Details" toggle button for Lead detail pages.

### B6: Timeline Filter & Event Types (`row 17`)
- **Status**: `Not documented`
- **Explanatory Details**: A module-level timeline list view page was read and is unrelated to record details. Filter criteria and event types for the record detail Timeline related list/tab are Not documented in public user guides.

### B7: Quick Create 5-Field Subset (`row 20`)
- **Status**: `Not documented`
- **Explanatory Details**: While quick creation is mentioned generally in help documentation, the logic and selection criteria for the compact 5-field subset identified in metadata are not documented in public guides.

### B8: Collapsed Navigation Rail (`row 1`)
- **Status**: `Not documented`
- **Explanatory Details**: Collapsing the application navigation rail into a compact icon strip is not documented in standard public user documentation.

---

## Conflicts with Observed

1. **Bulk Ownership Transfer Action Name (A5)**: In the unselected toolbar ellipsis menu (`list-views.md › Actions`), the bulk transfer action is named `Mass Transfer`. In the row-selected selection toolbar's `Actions` dropdown menu (`w2d-change-owner`), the action is named `Change Owner`. This reconciles the documentation (`D1`, which names the list selection action `Change Owner`) with the observed interface: the label depends on selection state (`Mass Transfer` when no records are selected vs `Change Owner` when records are selected).
2. **Filter Operators (B2)**: The public Search API documentation (`D10`) supports criteria operators `equals`, `starts_with`, and `in`. Observed custom view criteria in `list-views.md` record: `equal`, `contains`, `not_contains`, `less_equal`.

---

## Not Documented

The following functional behaviors, presentation details, and UI feedback mechanisms are not specified in public documentation and could not be observed due to the read-only rule:
- **A1**: Delete confirmation modal window title, prompt body text, confirmation button labels, post-deletion redirection target page, and success toast notification message.
- **A2**: Availability and behavior of `Save and New` and `Cancel` on clone form; post-save redirection destination; whether the UI clone form excludes the same fields as the Clone API (`D4`).
- **A3**: Multi-page selection counter format and "Select all records in this view" presentation when more than 10 records exist. (Note: single-page selection counter format `"{n} record selected."` and selection toolbar styling are now observed).
- **A4**: Mass update modal title and input styling; post-update confirmation notification text.
- **A5**: Web UI Change Owner modal vs full-page dialog presentation styling, user selector control, checkbox labels/styling for associated related records, and result toast message (skipped by capture tool due to `dangerous attribute: update`).
- **A6**: Mass delete confirmation modal title, warning text, button labels, and result notification message.
- **A7**: All post-action UI feedback for `Save` and `Save and New` (redirect target, toast notification text, form reset behavior).
- **A8**: Inline editing hover affordance, cancel button, field-specific inline editor controls, and failure/error states.
- **A9**: Interactive click behavior of stage chevrons in the lead status ribbon (confirmation dialog, additional fields, notification).
- **A10**: Web UI display and styling of server-side errors on form submission (outside duplicate alert).
- **A11**: Sample error response body (none on the pages read); the `status` value of an error response; position and types of the keys `api_name`, `json_path`, `expected_fields` and `ambiguity_due_to`; HTTP status, message and body of `MULTIPLE_OR_MULTI_ERRORS`.
- **B1**: Placement of alphabet search bar and field targeting (`Last_Name`).
- **B2**: UI filter panel operators and criteria by field type.
- **B3**: Sort By dialog/dropdown field list.
- **B4**: Visual icons and boundary-disabled states for record navigation.
- **B5**: Hide Details toggle on record detail.
- **B6**: Record detail Timeline tab filter criteria and event types.
- **B7**: Quick Create 5-field subset logic and criteria.
- **B8**: Collapsible navigation rail behavior.

---

## Resolves

This specification definitively resolves the following open questions from prior research where explicit public documentation exists:
1. `research/specs/leads.md › Open questions #6`: Partially resolved regarding write flows:
   - Confirms 60-day Recycle Bin retention and cascading child record deletion upon lead delete (`D1`).
   - Confirms clone unique fields must be manually removed/updated to prevent duplicate validation rejection (`D5`), and system/transient/read-only properties are excluded (`D4`).
   - Confirms mass action selection limit of 500 records manually, and up to 50,000 records via custom view (`D1`, `D7`, `D8`, `D12`, `D18`, `D19`).
   - Confirms multi-select picklist mass update options (`Overwrite` vs `Append`) (`D1`, `D7`), and single/batch update `$append_values` mode (`D17`).
   - Confirms ineligible mass update fields: Text Area and Lookup fields (`D1`), Email, lookup, layout and multi-line fields and line items (`D7`).
   - Confirms ownership transfer scope: single and ID-based batch up to 500 records with related Tasks, Meetings, and Calls (`D18`), and view-based mass transfer up to 50,000 records without related records (`D19`).
2. `docs/adr/0004-request-shape.md › Open questions #1`: Evidence supplied regarding public REST API wire contracts:
   - Create Lead: `POST /{module_api_name}` (max 100 records) (`D2`).
   - Update Lead: `PUT /{module_api_name}/{record_id}` and `PUT /{module_api_name}` (max 100 records, `$append_values`, HTTP 207 Multi-Status) (`D17`).
   - Delete Lead: `DELETE /{module_api_name}/{record_id}` and batch `DELETE ?ids=` (max 100 records) (`D3`).
   - Change Owner: single `POST .../{record_id}/actions/change_owner`, batch `POST .../actions/change_owner` (max 500 records), and view-based `POST .../actions/mass_change_owner` (max 50,000 records) (`D18`, `D19`).
   - Mass Update: `POST .../actions/mass_update` (max 500 via ids, max 50,000 via cvid) (`D7`), polled via `GET .../actions/mass_update?job_id=` (`D21`).
   - Mass Delete: `POST .../actions/mass_delete` (max 500 via ids, max 50,000 via cvid) (`D8`), polled via `GET .../actions/mass_delete?job_id=` (`D22`).
   - Mass Change Owner Status: polled via `GET .../actions/mass_change_owner?job_id=` (`D23`).
   - Comprehensive Error Codes table and HTTP error series (`D2`, `D3`, `D7`, `D8`, `D17`, `D18`, `D19`, `D20`, `D21`, `D22`, `D23`).
   - Error response structure and field-level error detail keys (`api_name`, `json_path`, `expected_fields`, `ambiguity_due_to`) (`D18`); discrepancies with interim shapes identified; the decision stays with the CTO.

*Note: `research/specs/record-detail.md › Open questions #1, #4` remain unresolved because public documentation does not specify UI stage ribbon click interactions or quick create subset selection rules. `research/specs/list-views.md › Open questions #2, #6` have now been largely resolved by the live capture research in MEP-223 (`w2d-*` captures), which documented filter operators across remaining field types, operator-specific value controls, value list structures, row selection toolbar layout, counter format, and bulk action menu items.*
