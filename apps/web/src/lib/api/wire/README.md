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
- Negative `AGEINDAYS` offsets were not observed. They encode as
  `"${AGEINDAYS}-<n>"` and decode to the corresponding negative offset.
- `AGEINDAYS` offsets are written with JavaScript number formatting, so decimal
  and exponential forms also decode as tokens; only `+31` was observed on the wire.
- A `CATEGORY` token whose name contains `{`, `}` or a line break is returned
  from the wire as a plain string unchanged.
- Only exact token forms decode as tokens; other strings remain plain values.
  A plain string exactly matching `${TODAY}`, `${AGEINDAYS}+<n>`,
  `${AGEINDAYS}-<n>` or `${CATEGORY.<name>}` consequently returns as a token.
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

`columns` preserves empty columns and omits fields whose placement is unknown;
`fields` continues to carry the full section inventory. The card's observed five
fields are documented as interim fixture selection in the record-service README.
Owner display names and email are never sent in a write. These new interim keys
do not assert reference write parity.

`FieldDefinition.massUpdate` maps losslessly to observed `fields[].mass_update`,
including layout fields. Fixture values come from metadata, not field-type guesses.
