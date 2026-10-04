# Error codec

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
