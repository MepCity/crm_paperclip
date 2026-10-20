# API wire contract

Shared by the server wrapper and the browser. This folder imports `@crm/core/errors`
and types only. It does not import the framework or the database.

## Observed

An error body has the keys `code`, `details`, `message` and `status`. All four are
present on every error we send. An unknown record was observed as HTTP 404. The
values inside `code` and `details` were not observed.

## Writes and errors

ADR 0004 §5 records the complete operation/error tables with source columns and
remaining Interim decisions. The board selected public developer documentation
on 2026-10-04. A10/A11 of `research/specs/leads-write-behaviour.md` are the write
sources; observed request shapes still take precedence.

Errors use exactly `code`, `details`, `message`, `status`; body status is the string
`error` (literal Interim), and HTTP status is read from the response line.

| code | HTTP | details | Source |
| --- | --- | --- | --- |
| MANDATORY_NOT_FOUND | 400 | fields map | A10; details.fields Interim |
| INVALID_DATA | 400 | fields map | A11 D2/D17; details.fields Interim |
| LIMIT_EXCEEDED | 400 | fields map | Interim for 1–500 IDs |
| DUPLICATE_DATA | 400 | empty | A10 |
| NO_PERMISSION | 403 | empty | A10 |
| AUTHENTICATION_FAILURE | 401 | empty | A11 |
| not_found | 404 | empty | observed HTTP; code Interim |
| INTERNAL_ERROR | 500 | empty | A10 |

ValidationError's internal reason selects mandatory/limit/other validation codes;
it is restored from the wire code without adding another wire key. `details.fields`
preserves every field and message. No undocumented field-detail location is inferred.
The strict decoder rejects unknown/malformed bodies, mismatched HTTP/code pairs,
and internal failures as UnexpectedApiError with a fixed safe message. The server
logs unexpected causes and emits only `Something went wrong.`.

## Observed resource keys

Resource codecs follow `research/specs/request-shapes.md` (Module definition,
Field definitions, Layouts, Custom views, Selected view, Record list, Count,
Record detail, Users and Record row value forms). Only port-backed properties
are emitted; the captures do not justify synthesizing the remaining properties.

| Endpoint operation | Emitted spec keys | Omitted |
| --- | --- | --- |
| module | `modules[].api_name`, `singular_label`, `plural_label`, `business_card_fields[]{api_name}` | Other module properties, identifiers, profiles, permissions, embedded views and related lists |
| fields | `fields[].api_name`, `field_label`, `data_type`, `system_mandatory`, `read_only`, `mass_update`, `unique`, `view_type{view,edit,create,quick_create}`, optional `length`, `pick_list_values[]{display_value,actual_value}`, `lookup.module.api_name` | Field IDs, permissions, other UI flags, dependencies, currency settings, category objects and other configuration |
| layouts | `layouts[].sections[]{display_label,column_count,fields[]}` and interim `columns[][]`; fields use the field codec | Layout ID/name, section API name/ID, profiles, layout-specific field/UI flags |
| views | `custom_views[]{id,name,system_defined,default}`, `info{per_page,count,page,more_records,default}` | Access/share/favorite/pin/history and translation properties, field IDs |
| view | `custom_views[]{id,name,system_defined,default,fields[]{api_name},criteria,sort_by,sort_order}` | Access/share/favorite/pin/history and field identifiers |
| bulk | `data[]{id,<field API names>}`, `info{per_page,count,page,sort_by,sort_order,more_records}` | All `$` flags/properties and port-absent row fields |
| count | `count` | None |
| record | Singleton `data[]{id,<field API names>}` | All `$` flags/properties and port-absent row fields |
| users | `users[]{id,full_name,email}`, `info{per_page,count,page,more_records}` | Roles/profiles, names split into parts, locale/shift/preferences/status and other user properties |
| create | `data[]{code,details{Modified_Time,Modified_By,Created_Time,id,Created_By},message,status}` (A11 D2) | Full record (read separately) |
| update | Same success keys, message `record updated` (A11 D17) | Full record (read separately) |
| delete / massDelete / massUpdate / changeOwner | `data[]{code,details{id},message,status}`; source/interim distinctions in ADR §5 | Full record, jobs |

Owners carry `{id,name,email}` when the member exists. When it is unavailable,
only its ID is emitted: no placeholder display name or email is invented.
Empty fields retain null. Numeric fields remain numbers, long integers remain
strings, timestamps and image references retain their domain strings.

`encodeModule`, `encodeField`, `encodeLayout` and `decodeModule` split/reassemble
`ModuleMetadata` through the three resource envelopes. Layout section ordering,
field ordering and picklist display/stored values are preserved. `encodeView` /
`decodeView` preserve leaf/group criteria, columns and nullable sort; wire
`group_operator` is `AND` / `OR` and port `groupOperator` is `and` / `or`.
Comparators `equal`, `contains`, `not_contains` and `less_equal` pass through
unchanged (view definitions in `research/specs/list-views.md`).

`info.sort_by` and `info.sort_order` come only from `ListResult.sort`; `decodeList`
restores that applied order. Unknown fields returned by the service in a record
or layout are server errors, not caller validation errors.

### Observed criteria tokens

| Port value | Wire `value` |
| --- | --- |
| `{ token: "CURRENTUSER" }` | `{ "name": "${CURRENTUSER}" }` |
| `{ token: "TODAY" }` | `"${TODAY}"` |
| `{ token: "AGEINDAYS", offset: 31 }` | `"${AGEINDAYS}+31"` |
| `{ token: "CATEGORY", name: "Junk" }` | `"${CATEGORY.Junk}"` |

## Interim resource behavior

- Write methods/paths and envelopes follow ADR 0004 §5. Create/update accept one
  record and emit SUCCESS details, then clients read the full record separately.
  Delete uses record DELETE or `actions/mass_delete` with IDs. Mass update accepts
  exactly one eligible field; owner change accepts an organization member.
  All batch actions use the port's atomic validation and 1–500 limit.
- `encodeInput` / `decodeInput` carry write field values in both directions;
  owner and single-module lookup inputs use `{id}` without display names.
  Write request bodies were not captured, so this behavior is not listed under
  Observed above.
- Bulk/count accept optional JSON `{filters?,search?}`. Filters use the saved-view
  criteria keys. Changed sort travels in `sort_by` / `sort_order`. Unknown query
  keys are ignored. Invalid inputs use port keys (`page`, `perPage`, `fields`,
  `viewId`, `sort`, `filters`, `search`) or envelope keys (`data`, `ids`).
- Bulk defaults to page 1 / size 30. Inventory endpoints default to page 1 /
  size 200 and accept any positive safe integer size; they do not use the port's
  six record page sizes. Inventory order is the service/member order; their info
  carries no invented record-sort keys. View inventory uses `info.default` for
  the default view ID. Complete view definitions are obtained from the selected
  view endpoint; inventory summaries do not invent selected-view keys.
- The bulk operation projects view columns union requested `fields` names.
  Without `fields`, only view columns are projected (not captured). Empty or
  unknown names are rejected, not silently removed. The port always includes ID.
- Day offsets sent by the port must be nonnegative integers. `AGEINDAYS` retains
  its observed `+31` spelling and existing floor-based runtime behavior. The decoder
  recognizes legacy negative/decimal age-token spellings; the service rejects them
  as invalid filters. Neither encode path emits them.
- A `CATEGORY` token whose name contains `{`, `}` or a line break is returned
  from the wire as a plain string unchanged.
- Only exact token forms decode as tokens; other strings remain plain values.
  A plain string exactly matching a known CURRENTTIME, TODAY, AGEINDAYS, CATEGORY, DUEINDAYS
  or PERIOD spelling consequently returns as a token. Unknown standalone token
  names, unknown periods and invalid due-token forms raise keyed filter validation
  errors. Existing non-token literal forms remain unchanged.
  The wire cannot distinguish those literal strings from token values.
- Populated lookup keys were not captured. Single-module lookup uses `{id}`;
  connected-module lookup retains `{module,id}` to preserve domain identity.
  Null remains null. Names for non-owner references are unavailable and omitted.
- Full detail encoding retains every field supplied by the port, including
  `Converted_Date_Time`, `Change_Log_Time__s`, `Converted__s`,
  `Last_Enriched_Time__s` and `Enrich_Status__s`. These field API names exist in
  module metadata but were absent from the captured detail row. Their inclusion
  preserves the domain round trip; it is not evidence of captured detail parity.
- No timezone conversion, numeric formatting, tag-array interpretation or
  additional field constraints are inferred; the service validates writes.
- Error `details.fields` remains Interim; documented codes and HTTP statuses use
  the table above. The internal code discriminator survives duplicate module instances.

## Omitted resource keys

Every key in the spec tables other than the emitted subset above is omitted.
Criteria `type` and `$disrupted` have no port representation and are not emitted.
The port has no module, field, section or layout configuration identifiers,
permission flags, profile settings, pin/wrap/favorite settings, share/history
metadata, record `$` properties, translations, reference display names (except
members), or user preference/status model. No constant, empty object or null is
substituted for that missing information. `Tag` stays the port's text/null value;
its observed array form has no port equivalent and is not synthesized.

## Not in reference

`unique.enforced: true` is our lossless marker for a true domain uniqueness flag.
All current Leads fields are false and encode as the observed `unique: {}`.
No populated uniqueness object was observed. The marker is emitted only for a
true port value. The populated connected lookup's `module` leaf is likewise an
interim domain-preserving shape, not a captured record key. JSON filter/search
body names and `details.fields` are interim additions described above.

## Interim surface metadata and Owner key mapping

| Port | Wire | Evidence/status |
| --- | --- | --- |
| `FieldDefinition.views` | `fields[].view_type{view,create,edit,quick_create}` (also on layout fields) | Observed in Field definitions / Layouts of `research/specs/request-shapes.md` |
| `ModuleMetadata.businessCardFields` | `modules[].business_card_fields[]{api_name}` | Observed key in Module definition; field IDs are omitted |
| `LayoutSection.columns` | `layouts[].sections[].columns[][]` (field API name strings) | Interim: no placement key documented; the documented `column_name` has no observed UI-placement semantics |
| Write `Owner: userId` | `data[].Owner: {id: userId}` | Interim: write payload unobserved; uses the existing owner/lookup write codec |
| `FieldDefinition.acceptsJsonArray` | `fields[].accepts_json_array` (also on layout fields) | Our acceptance-policy key, not the exported `json_type`; omitted on unmarked fields |

`columns` preserves empty columns and omits fields whose placement is unknown;
`fields` continues to carry the full section inventory. The card's observed five
fields are documented as interim fixture selection in the record-service README.
Owner display names and email are never sent in a write. These new interim keys
do not assert reference write parity.

`FieldDefinition.massUpdate` maps losslessly to observed `fields[].mass_update`,
including layout fields. Fixture values come from metadata, not field-type guesses.

Marked fields carry opaque JSON arrays unchanged through record reads and writes;
the codec validates plain JSON and copies the value. Events marks only Remind_At,
Remind_Participants and Participants. Tag retains the shared text policy.
`${CURRENTTIME}` maps exactly to the CURRENTTIME token; its exact-instant datetime
comparison rules are enforced by the record service.


## Interim panel filter values

ADR 0004 §4 enumerates every new comparator and token spelling; applied panel
requests/results were not observed. `encodeCriteria` / `decodeCriteria` carry
`not_equal`, `starts_with`, `ends_with`, `is_empty`, `is_not_empty`, `less_than`,
`greater_than`, `greater_equal`, `between`, `not_between` unchanged, including
nested groups. Both bulk and actions/count send JSON `{filters: <criteria>}`.

| Port token | Interim wire value |
| --- | --- |
| `{ token: "DUEINDAYS", offset: N }` | `"${DUEINDAYS}+N"` |
| `{ token: "AGEINDAYS", offset: N, unit: "weeks" \| "months" }` | `"${AGEINWEEKS}+N"` / `"${AGEINMONTHS}+N"` (**Interim**) |
| `{ token: "DUEINDAYS", offset: N, unit: "weeks" \| "months" }` | `"${DUEINWEEKS}+N"` / `"${DUEINMONTHS}+N"` (**Interim**) |
| `{ token: "RELATIVE", direction, count, unit }` | `"${PREVIOUS.*}+N"` / `"${NEXT.*}+N"` (**Interim**) |
| `{ token: "PERIOD", name: P }` | `"${PERIOD.P}"` |
| `"YYYY-MM-DD"` and `["YYYY-MM-DD", "YYYY-MM-DD"]` on datetime filters | same JSON strings/arrays on the wire (**Interim**) |

P is exactly one of `TOMORROW`, `YESTERDAY`, `TILL_YESTERDAY`,
`STARTING_TOMORROW`, `THIS_WEEK`, `PREVIOUS_WEEK`, `THIS_MONTH`,
`PREVIOUS_MONTH`, `THIS_YEAR`, `PREVIOUS_YEAR`, `NEXT_YEAR`. TODAY remains its
existing token, and age-in introduces no new wire value. Due uses `less_equal`;
periods use `equal`. Empty predicates use null; membership uses nonempty string
arrays; inclusive numeric ranges use two numbers. Unknown comparator/token values
fail with `ValidationError` keyed by `filters`. Field-family validation and UTC
semantics are the service's responsibility, documented in the record-service README.

## Organization currency (Interim)

| Operation | Request | Response |
| --- | --- | --- |
| `currencies` | `GET /crm/v2.2/org/currencies` | `currencies[]` (one item: `symbol`, `iso_code`, `name`, `prefix_symbol`) |

The field names and configured values come from the metadata export. The path
and response envelope were not captured; see ADR 0004. The decoder rejects
missing, malformed and unknown currency fields with the existing ValidationError.

Deals Stage options carry probability, forecast_category (name only), and deal_category together; options without stage metadata omit all three keys. Partial or invalid stage metadata fails decoding.

## Input bounds

Reference values reject unknown inner keys with field-keyed `INVALID_DATA` (400).
Owner references accept `id`, `name`, and `email`; lookup references accept `id`
and `name`; connected references accept `module`, `id`, and `name`. Existing
optional display fields remain accepted for response round trips.

Bulk and count restrictions accept search strings up to 2,000 UTF-16 code units,
matching the existing long-text field limit. Empty strings remain valid and text
is passed to the service unchanged. Each criteria group and each criteria
value array accepts up to 500 entries, matching the existing bulk ID limit; the
group limit applies at every nesting level alongside the existing depth limit
of 32. A decoded criteria tree accepts at most 10,000 nodes in total (root,
groups and leaves; value array entries do not count). The budget is shared
across all branches and starts fresh for each decode; it allows nearly twenty
full 500-leaf groups, well above current panel and saved-view criteria. These are local input bounds,
not claims about observed reference CRM limits. Rejections retain the existing
four-key error envelope with `details.fields.search` or `details.fields.filters`.

## CSV import and export (Module 6)

Bodies use the port types of `@crm/core` (`ImportPreview`, `ImportSettings`, `ImportJob`,
`ExportRequest`, `ExportJob`) as plain camelCase JSON; the reference's request shapes are
not imitated. Operations live in `wire/transfer.ts` (`transferOperations`).

| Operation | Method and path | Body |
| --- | --- | --- |
| Import preview | `POST /crm/v2.2/{module}/actions/import_preview` | `multipart/form-data`: one `file`, optional `charset` (`UTF-8` default, `ISO-8859-1`) |
| Run import | `POST /crm/v2.2/{module}/actions/import` | `{ uploadId, settings }` |
| Run export | `POST /crm/v2.2/{module}/actions/export` | `{ viewId?, ids?, fields }` |
| Sample CSV | `GET /crm/v2.2/{module}/actions/import_sample` | CSV download |
| Import history | `GET /crm/v9/settings/imports` | list of `ImportJob` |
| Import detail | `GET /crm/v9/settings/imports/{importId}` | `ImportJob` |
| Undo import | `POST /crm/v9/settings/imports/{importId}/actions/undo` | `ImportJob` |
| Export history | `GET /crm/v9/settings/exports` | list of `ExportJob` |
| Export download | `GET /crm/v9/settings/exports/{exportId}/download` | CSV download |

- The two CSV `GET` downloads also accept the organization as `?org=<slug>` when the
  `X-CRM-ORG` header is absent (a link cannot send headers); every other route still needs the header.
- `{module}` is `Leads`, `Contacts`, `Accounts` or `Deals`; anything else is `INVALID_DATA`.
- The multipart body is cut off while streaming at 25 MB plus framing (`file_too_large`);
  `Content-Length` is not trusted. Exactly one file field is accepted; other fields except
  `charset` are rejected.
- A job from another organization is `404`. A failed export (for example `export_too_large`)
  is a `200` job with `status: "failed"` and `code`.
- Downloads: `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment`
  (ASCII `filename` plus encoded `filename*`), `X-Content-Type-Options: nosniff`,
  `Cache-Control: no-store`, UTF-8 BOM.
- Error codes returned through the shared codec: `file_too_large`, `too_many_columns`,
  `too_many_rows`, `malformed_csv`, `empty_file`, `no_header`, `duplicate_header`,
  `bad_encoding`, `upload_expired`, `mapping_duplicate_field`, `mapping_missing_required`,
  `mapping_system_field`, `match_field_required`, `invalid_match_field`,
  `export_too_large`, `field_not_allowed`, `not_undoable`. Row codes appear inside jobs.
- The service is one process-local instance (`getTransferService`); history is lost on restart.
- Client: `createHttpTransferClient(orgSlug)` (`TransferClient`) and the `useTransferClient`,
  `useImportHistory`, `useExportHistory` hooks.

## Tags and Recycle Bin HTTP (Module 6, Interim)

These are our transport choices under ADR 0007 §4, authorized by MEP-864;
no claim of observed reference requests. All routes use ADR 0004 authentication,
organization, Origin, no-store and four-key errors. Unknown extension query keys
are ignored. Recognizable unsupported bin criteria (`criteria`, `filters`,
`search`, `operator`) are rejected rather than treated as an unfiltered search.

| Method | Path under `/crm/v2.2` | Input | Success |
| --- | --- | --- | --- |
| GET | `/settings/tags` | `module`, optional `name` case-insensitive substring, `page`, `per_page` | `tags[]`, `info` |
| POST | `/settings/tags` | Query `module`; JSON `{name,color?}` | Singleton `tags[]` |
| PUT | `/settings/tags/{tagId}` | Query `module`; JSON exactly one of `{name}` or `{color}` | Singleton `tags[]` |
| DELETE | `/settings/tags/{tagId}` | Query `module` | ID success envelope, `tag deleted` |
| POST | `/{module}/{recordId}/actions/add_tags` | JSON `{ids:[tagId,…]}` | Record ID success envelope, `tags added` |
| POST | `/{module}/{recordId}/actions/remove_tags` | JSON `{ids:[tagId,…]}` | Record ID success envelope, `tags removed` |
| GET | `/settings/recycle_bin` | Optional `module`, `name`, `deleted_by`, `deleted_by_contains`, `deleted_date`, `deleted_time`, `page`, `per_page` | `data[]`, `info` |
| POST | `/settings/recycle_bin/actions/restore` | JSON `{ids:[entryId,…]}` | ID success envelope, `record restored` |
| POST | `/settings/recycle_bin/actions/permanent_delete` | JSON `{ids:[entryId,…]}` | ID success envelope, `record permanently deleted` |
| POST | `/settings/recycle_bin/actions/empty` | JSON `{scope:"organization",confirm:true}`; no search criteria | Success envelope with empty details, `recycle bin emptied` |

Paging defaults to page 1 and 30 items. Values must be positive safe integers
with a safe page-size product. Empty pages/collections return bodyless 204.
`info` contains `page,per_page,count,more_records`; count is page length.
Catalogue rows: `id,module,name,color,Created_By{id},Created_Time,Modified_By{id},Modified_Time`.
Bin rows: `id,record_id,Name,Type,Deleted_By{id},Deleted_Time,expires_at`.
Bin IDs select deletion manifests, never ordinary record IDs. Bin filters combine
with AND: name contains, exact module, exact actor ID and/or actor-ID substring,
and a UTC date or minute (`YYYY-MM-DD`, optional `HH:mm`). Display-name actor
resolution is not synthesized. Filtering/visibility precedes paging in the service.

ID selections require 1–500 nonblank strings. Exact body keys prevent accidental
filter/selection confusion. Empty never infers whole-organization scope from
empty IDs, and refuses recognized search keys in its query. Tag PUT accepts a
single field because the approved service has separate atomic rename/recolor
operations; combined edits must not partially commit. Core interim rules retain
trim/NFC name normalization, 50-character names, module-local lowercase uniqueness,
100 catalogue capacity, nullable RGB colors and module-write authorization.

Errors: 400 `INVALID_DATA` for malformed JSON, values and criteria;
400 `LIMIT_EXCEEDED` for invalid selection size or full catalogue;
400 `DUPLICATE_DATA` if the service raises a conflict;
401 `AUTHENTICATION_FAILURE`, 403 `NO_PERMISSION`, 404 `not_found`,
500 `INTERNAL_ERROR` use the shared codec. Core validation messages are preserved.
No DDL, scheduler, capability grants or alternative ordinary-delete route is added.

Open questions remain A1 (observed transport and exact messages), T1 (final name
rules), T3 (palette/defaults), T7 (capability mapping), R3 (own-record visibility,
restore grants and administrator mapping), R6 (retention clock/timezone/expiry,
races and cleanup). This transport delegates these policies to the approved
fixture service and does not settle their reference parity.
