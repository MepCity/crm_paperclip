# Leads — Write Behaviour Specification

Status: Specification of write, mutation, bulk, and secondary read behaviours derived strictly from the reference CRM's public documentation (help guides and developer documentation). This specification supplements the read-only research recorded in `research/specs/leads.md`, `research/specs/leads-fields-and-layout.md`, `research/specs/list-views.md`, `research/specs/record-detail.md`, and `research/specs/request-shapes.md`.

## Purpose

The board's strict read-only policy forbids executing mutations against the reference CRM environment. Consequently, user-initiated write flows—such as record deletion, cloning, mass actions, inline updates, stage transitions, and form submissions—could not be observed via live capture execution.

This document establishes the behavioral and contract specification for these write interactions in Module 1 (Leads) using the reference CRM's public help guides and developer documentation. Sources are referenced using neutral keys (`D1` through `D12`), with complete URLs, titles, timestamps, and verbatim quotes maintained exclusively in local workspace research notes (`docs-notes/leads-write-behaviour.md`) outside version control.

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
| `D11` | Public Help Documentation | Advanced filters interface, panel layout |
| `D12` | Public Help Documentation | List view management, column sorting options, selection in views |

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
  - **Field Values & Excluded Properties**:
    - Field values from the source record are copied to the cloned record by default (`D4`).
    - The following fields and properties are explicitly excluded during the record cloning process (`D4`):
      - Field Types: File Upload, Image Upload (`D4`).
      - Transient / Module-Specific Fields: `wizard`, `data_processing_basis_details` (if GDPR is enabled) (`D4`).
      - Field Properties: `read_only`, `external`, and internal system `$` properties (`D4`).
  - **Unique Fields Behaviour on Clone**:
    - When unique field checking is active (e.g., on Email or Phone), the unique value is not automatically omitted or stripped by the application; instead, the documentation explicitly instructs: *"When you clone a record, remove the unique fields' values on the Clone <record> page. Update them manually and save the record, for example, a contact's email address."* (`D5`).
- **Not Documented**:
  - Availability or behavior of a `Save and New` button on the clone form.
  - Availability or behavior of a `Cancel` button and its navigation return destination.
  - Post-save redirection target page (e.g. whether user navigates to the newly cloned record's detail page or returns to the source record).

### A3: List Row Selection & Bulk Actions
- **Status**: `Documented, depends on edition or setting [D1, D12]`
- **Documented Flow & Rules**:
  - **Selection Interaction**:
    - Checkboxes allow selecting records individually or selecting all records within the page (`D1`).
    - Selecting records displays the mass action menu on top of the screen (`D12`).
  - **Available Bulk Actions in List View**:
    - The documentation identifies the following actions available for bulk execution: Assign Owner / Change Record Owners (`Change Owner`), Run Macro, Send Mass Emails, Create Task, Add or Remove Tags, Mass Update, Mass Record Convert (where applicable), Bulk Mail Merge, Set Reminders, and Delete (`D1`, `D12`).
  - **Manual Selection Limit**:
    - When selecting records manually, there is a hard limit of selecting 500 records at once (`D1`).
  - **View-Wide Selection**:
    - The "Select all records in this view" option allows performing mass actions on all records within a specific view (`D1`, `D12`).
  - **Edition & Volume Dependencies**:
    - The "Select All [Records] in this View" link is available only in Enterprise and Ultimate editions (`D12`).
    - The link does NOT appear if there are more than 50,000 records in the custom list view (`D12`).
    - The link does NOT appear if a mass update is already in progress (`D12`).
  - **Execution Feedback**:
    - After applying a mass update, change owner, or delete action, a progress bar at the bottom right corner of the screen indicates the update status (`D12`).
- **Not Documented**:
  - Exact selection counter text format (e.g. whether it displays as `"X Selected"`).
  - Floating styling of the bulk action bar (whether floating above table headers or embedded).

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
    - During Mass Update of multi-select fields, users can choose either `Overwrite` or `Append` options (`D1`, `D7`).
    - `Overwrite`: Default option; replaces previous value with the new one (`D1`, `D7`).
    - `Append`: Retains previous value and adds the new value (`D1`, `D7`).
  - **Execution Limits**:
    - Up to 500 records in a single operation via manual selection (`D1`, `D7`).
    - Up to 50,000 records via custom view / criteria (`D1`, `D7`).
  - **Permissions**:
    - Requires `Mass Update` profile permission for the module (`D1`).
- **Not Documented**:
  - Modal dialog window title (`Mass Update Leads` is not documented; the popup is titled `Select field to update` in `D1`).
  - Form input styling and exact layout of field-specific input widgets within the popup.
  - Result confirmation message or toast text upon completion.

### A5: Mass Transfer / Ownership Transfer Flow
- **Status**: `Documented [D1]`
- **Documented Flow & Rules**:
  - **Access Paths**:
    1. List View Selection: Select record checkboxes -> Click `Actions` dropdown -> Select `Change Owner` -> In `Change Owner` page, select new user from `Change Owner` picklist, select checkboxes for associated related records, and click `Change Owner` (`D1`).
    2. Module Tools: Click `[Module] Tools` > `Mass Transfer [Module]` -> Navigates to `Mass Transfer [Module]` page (`D1`).
  - **Tool Page Configuration & Criteria**:
    - In `Select New Owner` section, select the owner's name for `Transfer From` and `Transfer To` fields (`D1`).
    - Criteria Step: Specify criteria to filter records -> Click `Search` -> Under `Matching [records]`, select checkboxes -> Click `Transfer` (`D1`).
  - **Associated Activities**:
    - Allows selecting open activities that should be transferred to the new owner (`D1`).
    - For Leads, associated open activities (Tasks, Events, scheduled/overdue Calls) can be transferred if owned by the same record owner, subject to the user's module permissions (`D1`).
  - **Permissions**:
    - Requires `Change Owner` / `Mass Transfer` profile permission (`D1`).
- **Not Documented**:
  - Modal vs full-page presentation in the modern web UI (help documentation describes a dedicated `Change Owner page` and `Mass Transfer [Module] page`).
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
    - Up to 500 records via manual selection; up to 50,000 records via custom view / criteria (`D1`, `D8`).
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
    - Committing an inline edit occurs on "the click of the tick icon after you edit or update a particular field", which triggers the `onBeforeUpdate` event (`D6`).
  - **Mandatory Fields Form**:
    - *"When there is an inline edit on the detail page which satisfies the layout rule, a form will pop-up to get the values for the mandatory fields. This form is called as the Mandatory fields form."* (`D6`).
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
    - Alert notification: *"When a duplicate record is entered in the Leads module, an alert message will notify you of the existing record."* (`D5`).
    - Save prevention: *"Create and Edit records - You will get a notification message, and you will not be able to save the record if the email address already exists in another record."* (`D5`).
    - Single duplicate: *"Hover over the View Lead icon to see the record's name and owner. Clicking the View Lead icon displays the full record details. The View Lead option is available only if there is one duplicate record."* (`D5`).
    - Multiple duplicates: *"If multiple records are found with the same email address, an alert message will prompt you to merge the leads."* (`D5`).
  - **Server Error Codes (Public REST API)**:
    - `MANDATORY_NOT_FOUND` (HTTP 400): Missing mandatory layout fields (`D2`).
    - `DUPLICATE_DATA` (HTTP 400): Unique constraint violation (`D2`).
    - `NO_PERMISSION` (HTTP 403): User lacks module or field permissions (`D2`).
    - `INTERNAL_ERROR` (HTTP 500): Server error (`D2`).
- **Not Documented**:
  - Visual presentation, styling, and placement of server-side errors on web forms outside the unique field alert.

### A11: Write Request Contracts & ADR 0004 §5 Comparison
- **Status**: `Documented [D2, D3, D7, D8]`
- **Public REST API Specifications**:
  - **Base URL**: `https://{api_domain}/crm/{version}`
  - **Create Lead**: `POST /{module_api_name}` (`D2`). Payload: `{"data": [{"Company": "...", "Last_Name": "...", ...}]}`. Success response (HTTP 201/200): `{"data": [{"code": "SUCCESS", "details": {"id": "...", "Created_Time": "...", "Modified_Time": "..."}, "message": "record added", "status": "success"}]}`.
  - **Update Lead**: `PUT /{module_api_name}/{record_id}` (`D2`). Payload: `{"data": [{"Title": "...", ...}]}`. Success response (HTTP 200): `{"data": [{"code": "SUCCESS", "details": {"id": "...", "Modified_Time": "..."}, "message": "record updated", "status": "success"}]}`.
  - **Delete Lead**: `DELETE /{module_api_name}/{record_id}` (single) or `DELETE /{module_api_name}?ids={id1,id2,...}` (batch, max 100 records per call) (`D3`). Success response (HTTP 200): `{"data": [{"code": "SUCCESS", "details": {"id": "..."}, "message": "record deleted", "status": "success"}]}`.
  - **Mass Update**: `POST /{module_api_name}/actions/mass_update` (`D7`). Payload: `{"data": [{"Field": "Value"}], "ids": ["id1", "id2"], "over_write": true}` (up to 500 records) or with `"cvid": "..."` (up to 50,000 records).
  - **Mass Delete**: `POST /{module_api_name}/actions/mass_delete` (`D8`). Payload: `{"ids": ["id1", "id2"]}` (up to 500 records) or `{"cvid": "..."}` (up to 50,000 records).
  - **Error Envelope**: `{"code": "<ERROR_CODE>", "details": {...}, "message": "<description>", "status": "error"}`.
- **Architectural Distinction**:
  - Public developer documentation documents the external public REST API, **NOT** the reference CRM web client's internal browser AJAX/XHR network requests. Due to the board's read-only rule, internal web application network requests remain unobservable.
- **Comparison with ADR 0004 §5 Interim Shapes**:

| Operation / Aspect | ADR 0004 §5 Interim Shape | Public REST API Contract (`D2`, `D3`, `D7`, `D8`) | Differences & Architectural Notes |
| --- | --- | --- | --- |
| **Create Lead** | `POST /crm/v2.2/{module}`<br/>Body: `{"data": [{...}]}` | `POST /{module_api_name}`<br/>(Base: `https://{api_domain}/crm/v2`)<br/>Body: `{"data": [{...}]}` | Path prefix differs (`/crm/v2.2/` vs `/{module_api_name}`). Envelopes match. Note: Public API is external, not internal browser API. |
| **Update Lead** | `PUT /crm/v2.2/{module}/{recordId}`<br/>Body: `{"data": [{...}]}` | `PUT /{module_api_name}/{record_id}`<br/>Body: `{"data": [{...}]}` | Path version prefix differs (`v2.2` vs `v2`). Request/response envelope structures match. |
| **Delete Lead (Single)** | `DELETE /crm/v2.2/{module}?ids=` (query parameter) | `DELETE /{module_api_name}/{record_id}` | Public API supports dedicated path parameter for single record deletion. |
| **Delete Lead (Batch)** | `DELETE /crm/v2.2/{module}?ids=`<br/>No batch limit specified | `DELETE /{module_api_name}?ids={id1,id2,..}`<br/>**Max 100 records per call** (`D3`) | Public API enforces a strict cap of **100 records** per batch delete call. |
| **Mass Update** | Not defined in ADR §5 (assumed batch `PUT`) | `POST /{module_api_name}/actions/mass_update`<br/>Body: `{"data": [...], "ids": [...], "over_write": true}` or `{"data": [...], "cvid": "..."}` (`D7`) | Public API uses dedicated `actions/mass_update` action route. Supports `ids` (max 500) and `cvid` (max 50,000), plus `over_write` flag for multi-select. |
| **Mass Delete** | Not defined in ADR §5 (assumed `DELETE ?ids=`) | `POST /{module_api_name}/actions/mass_delete`<br/>Body: `{"ids": [...]}` or `{"cvid": "..."}` (`D8`) | Public API uses dedicated `actions/mass_delete` action route via `POST` (documented under `v8`), distinct from standard `DELETE ?ids=`. |
| **Duplicate Conflict Status** | `HTTP 409 Conflict` | `HTTP 400 Bad Request`<br/>(`code: "DUPLICATE_DATA"`, `D2`) | **Major discrepancy**: ADR §5 specified HTTP 409 for conflicts; reference CRM returns HTTP 400 with duplicate code. |
| **Validation Error Status** | `HTTP 400`<br/>Custom `code` / `details` | `HTTP 400 Bad Request`<br/>(`code: "MANDATORY_NOT_FOUND"`, `D2`) | HTTP status matches. Reference CRM provides standardized error code strings. |
| **Authentication / Permission** | `HTTP 401` unauthenticated<br/>`HTTP 403` forbidden | `HTTP 401` (`AUTHENTICATION_FAILURE`)<br/>`HTTP 403` (`NO_PERMISSION`) | Status codes match. Error envelope keys (`code`, `details`, `message`, `status`) match. |
| **API Versioning** | Unified `v2.2` across all interim endpoints | Mixed versions in public docs (`v2` for insert/delete/mass_update, `v8` for mass_delete/clone) | Public documentation reflects multi-version public evolution; internal CRM browser endpoints may use unified internal routing. |

---

## Part B: Secondary Read and List Behaviours

### B1: List Search (`row 10`)
- **Status**: `Documented [D1, D10]` (partially)
- **Documented Flow**:
  - Alphabet search: *"Choose an alphabet and CRM will list out all the records that begin with the defined alphabet."* (`D1`).
  - Search records API: `GET /{module_api_name}/search?word={search_word}` or `GET /{module_api_name}/search?criteria={criteria}` (`D10`).
- **Not Documented**:
  - Screen placement of the alphabet search strip.
  - Whether alphabet search specifically targets `Last_Name` in Leads (documentation states "records that begin with the defined alphabet").

### B2: Filter Operators by Field Type (`row 8`)
- **Status**: `Not documented [UI Panel] / Documented [Search API, D10]`
- **Documented in Search API (`D10`)**:
  - Supported criteria operators: `equals`, `starts_with`, `in`.
- **Conflicts with Observed & Not Documented**:
  - UI filter panel operators and criteria by field type are **Not documented** in public help guides.
  - Search API operators (`equals`, `starts_with`, `in`) conflict with observed custom view criteria in metadata, which support a much richer operator set (`is`, `isn't`, `contains`, `doesn't contain`, `starts with`, `ends with`, `is empty`, `is not empty`, `less than`, `greater than`, `less or equal`, `greater or equal`).

### B3: Sort By Field List (`row 9`)
- **Status**: `Documented [D12]` (partially)
- **Documented Flow**:
  - Column sorting options near column headers: *"Asc ꜛ : To sort the records of the column in ascending oder. Descꜜ : To sort the records of the column in descending order."* (`D12`).
- **Conflicts with Observed & Not Documented**:
  - Documentation describes sorting via `Asc ꜛ` / `Descꜜ` options under column options near the header (`D12`), whereas UI observations show direct clicks on column headers toggle sort direction.
  - A separate "Sort By" dialog or toolbar menu listing sortable fields is derived from metadata and UI observations, but is **Not documented** in public help documentation.

### B4: Previous/Next Record Navigation (`row 12`)
- **Status**: `Documented [D1]`
- **Documented Flow**:
  - *"With record-level navigation you can move from one record to the previous or next consecutive record(s). You can also view the first or last record entry."* (`D1`).
- **Not Documented**:
  - Chevron icon styling and boundary disabled states (e.g. disabled `<` on first record and `>` on last record).

### B5: Hide Details Toggle (`row 15`)
- **Status**: `Not documented`
- **Explanatory Details**: Official public help documentation does not document a "Hide Details" toggle button for Lead detail pages.

### B6: Timeline Filter & Event Types (`row 17`)
- **Status**: `Not documented`
- **Explanatory Details**: `D14` describes a module-level "Timeline View" (a custom list view layout grouping records by date fields), not the Record Detail Timeline related list/tab. Record detail timeline filter criteria and event types are undocumented in public user guides.

### B7: Quick Create 5-Field Subset (`row 20`)
- **Status**: `Not documented`
- **Explanatory Details**: While quick creation is mentioned generally in help documentation, the logic and selection criteria for the compact 5-field subset identified in metadata are not documented in public guides.

### B8: Collapsed Navigation Rail (`row 1`)
- **Status**: `Not documented`
- **Explanatory Details**: Collapsing the application navigation rail into a compact icon strip is not documented in standard public user documentation.

---

## Conflicts with Observed

1. **Bulk Ownership Transfer Action Name (A5)**: Public help documentation (`D1`, `D12`) designates the list view bulk action as `Change Owner` (`Change Record Owners`), located under the bulk actions menu. Prior interim specifications and ADR referenced this interaction as `Mass Transfer`.
2. **Filter Operators (B2)**: The public Search API documentation (`D10`) supports only three criteria operators: `equals`, `starts_with`, and `in`. Observed custom view criteria in metadata (`metadata/modules/Leads/custom_views/`) and live UI captures support a much wider operator set (`is`, `isn't`, `contains`, `doesn't contain`, `starts with`, `ends with`, `is empty`, `is not empty`, `less than`, `greater than`, `less or equal`, `greater or equal`).
3. **Column Sorting Affordance (B3)**: Public documentation (`D12`) describes sorting via `Asc ꜛ` and `Descꜜ` options under column options near the column header, whereas UI observations show clicking the column header directly toggles sort direction.

---

## Not Documented

The following functional behaviors, presentation details, and UI feedback mechanisms are not specified in public documentation and could not be observed due to the read-only rule:
- **A1**: Delete confirmation modal window title, prompt body text, confirmation button labels, post-deletion redirection target page, and success toast notification message.
- **A2**: Availability and behavior of `Save and New` and `Cancel` on clone form; post-save redirection destination.
- **A3**: Exact row selection counter text format and visual styling of bulk action bar.
- **A4**: Mass update modal title and input styling; post-update confirmation notification text.
- **A5**: Mass transfer modal styling vs full-page presentation, and result toast message.
- **A6**: Mass delete confirmation modal title, warning text, button labels, and result notification message.
- **A7**: All post-action UI feedback for `Save` and `Save and New` (redirect target, toast notification text, form reset behavior).
- **A8**: Inline editing hover affordance, cancel button, field-specific inline editor controls, and failure/error states.
- **A9**: Interactive click behavior of stage chevrons in the lead status ribbon (confirmation dialog, additional fields, notification).
- **A10**: Web UI display and styling of server-side errors on form submission (outside duplicate alert).
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
   - Confirms mass action selection limit of 500 records manually, and up to 50,000 records via custom view (`D1`, `D7`, `D8`, `D12`).
   - Confirms multi-select picklist mass update options (`Overwrite` vs `Append`) (`D1`, `D7`).
   - Confirms ineligible mass update fields: Text Area and Lookup fields (`D1`), line items and system fields (`D7`).
2. `docs/adr/0004-request-shape.md › Open questions #1`: Resolved regarding public REST API wire contracts for create, update, delete, mass update, mass delete, and error envelope structure (with discrepancies with interim shapes identified).

*Note: `research/specs/record-detail.md › Open questions #1, #4` and `research/specs/list-views.md › Open questions #2, #6` remain unresolved because public documentation does not specify UI stage ribbon click interactions, quick create subset selection rules, or UI filter panel operator structures.*
