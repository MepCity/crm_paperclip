# API wire contract

Shared by the server wrapper and the browser. This folder imports `@crm/core/errors`
and types only. It does not import the framework or the database.

## Observed

An error body has the keys `code`, `details`, `message` and `status`. All four are
present on every error we send. An unknown record was observed as HTTP 404. The
values inside `code` and `details` were not observed.

## Interim

`code`, the layout of `details`, and the status codes other than the observed 404
are ours until evidence exists (ADR 0004 §5, open question 1).

| `code` | HTTP status | `details` |
| --- | --- | --- |
| `validation` | 400 | `{ "fields": { "<field>": ["message", "..."] } }` |
| `unauthenticated` | 401 | `{}` |
| `forbidden` | 403 | `{}` |
| `not_found` | 404 | `{}` |
| `conflict` | 409 | `{}` |

`validation` carries `ValidationError.fieldErrors` without loss: several fields, and
several messages on one field. The body `status` is the same number as the HTTP status.

`internal_error` is not an `ErrorCode`. `encodeError` writes it only for a value that
is not an `AppError`: HTTP 500, `details` `{}`, and a fixed message. The original
message and stack stay in the server log and are not copied into the body.

`decodeError` returns an `AppError` subclass only when the body is that four-key
object, `code` is one of the five codes above, and both the HTTP status and the body
`status` equal that code's status. Everything else is an `UnexpectedApiError`: HTTP
500, `internal_error`, a body that is missing or not the four-key object, an unknown
`code`, or a status that does not match the code. `UnexpectedApiError` is not an
`AppError` (`isAppError` is false). Its `status` is the HTTP status of the response,
and its message is fixed — the body message is not copied.

## Observed resource keys

Resource codecs follow `research/specs/request-shapes.md` (Module definition,
Field definitions, Layouts, Custom views, Selected view, Record list, Count,
Record detail, Users and Record row value forms). Only port-backed properties
are emitted; the captures do not justify synthesizing the remaining properties.

| Endpoint operation | Emitted spec keys | Omitted |
| --- | --- | --- |
| module | `modules[].api_name`, `singular_label`, `plural_label` | Other module properties, identifiers, profiles, permissions, embedded views and related lists |
| fields | `fields[].api_name`, `field_label`, `data_type`, `system_mandatory`, `read_only`, `unique`, optional `length`, `pick_list_values[]{display_value,actual_value}`, `lookup.module.api_name` | Field IDs, permissions, UI flags, dependencies, currency settings, category objects and other configuration |
| layouts | `layouts[].sections[]{display_label,column_count,fields[]}`; fields use the field codec | Layout ID/name, section API name/ID, profiles, layout-specific field/UI flags |
| views | `custom_views[]{id,name,system_defined,default}`, `info{per_page,count,page,more_records,default}` | Access/share/favorite/pin/history and translation properties, field IDs |
| view | `custom_views[]{id,name,system_defined,default,fields[]{api_name},criteria,sort_by,sort_order}` | Access/share/favorite/pin/history and field identifiers |
| bulk | `data[]{id,<field API names>}`, `info{per_page,count,page,sort_by,sort_order,more_records}` | All `$` flags/properties and port-absent row fields |
| count | `count` | None |
| record | Singleton `data[]{id,<field API names>}` | All `$` flags/properties and port-absent row fields |
| users | `users[]{id,full_name,email}`, `info{per_page,count,page,more_records}` | Roles/profiles, names split into parts, locale/shift/preferences/status and other user properties |
| create | Interim `data[]{id}` | Full record (read separately) |
| update | Interim `data[]{id}` | Full record (read separately) |
| delete | Interim `data[]{id}` | Full record |

Owners carry `{id,name,email}` when the member exists. When it is unavailable,
only its ID is emitted: no placeholder display name or email is invented.
Empty fields retain null. Numeric fields remain numbers, long integers remain
strings, timestamps and image references retain their domain strings.

`encodeModule`, `encodeField`, `encodeLayout` and `decodeModule` split/reassemble
`ModuleMetadata` through the three resource envelopes. Layout section ordering,
field ordering and picklist display/stored values are preserved. `encodeView` /
`decodeView` preserve leaf/group criteria, columns and nullable sort. Comparators
`equal`, `contains`, `not_contains` and `less_equal` pass through unchanged
(view definitions in `research/specs/list-views.md`).

### Observed criteria tokens

| Port value | Wire `value` |
| --- | --- |
| `{ token: "CURRENTUSER" }` | `{ "name": "${CURRENTUSER}" }` |
| `{ token: "TODAY" }` | `"${TODAY}"` |
| `{ token: "AGEINDAYS", offset: 31 }` | `"${AGEINDAYS}+31"` |
| `{ token: "CATEGORY", name: "Junk" }` | `"${CATEGORY.Junk}"` |

`encodeInput` / `decodeInput` carry write field values in both directions; owner
and single-module lookup inputs use `{id}` without display names.
`info.sort_by` and `info.sort_order` come only from `ListResult.sort`; `decodeList`
restores that applied order. Unknown fields returned by the service in a record
or layout are server errors, not caller validation errors.

## Interim resource behavior

- Write method/path and JSON `{data:[{...}]}` envelopes follow ADR 0004 §5.
  Create/update accept exactly one record, matching the single-record port.
  Writes return only IDs, with a separate detail read for the complete record.
  Delete accepts comma-separated `ids` and returns their IDs after successful
  atomic port deletion. None of these write shapes were captured.
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
- Error `details.fields` and error codes/statuses retain the interim error codec
  described above. The code discriminator survives duplicate module instances.

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
