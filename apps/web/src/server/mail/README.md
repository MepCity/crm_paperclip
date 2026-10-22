# Mail HTTP write adapter

These authenticated, same-origin routes require `X-CRM-ORG` and use the shared
API error codec (`400` validation/conflict, `401` session, `403` ownership,
`404` missing or foreign-tenant resources). Responses are not cached.

| Method | Path | Request | Response `data` |
| --- | --- | --- | --- |
| POST | `/crm/v2.2/mail/messages` | Core `composeMailSchema` fields, replacing `bodyRef` with required plain-text `body` | `{ id, status, scheduledAt }` |
| PATCH | `/crm/v2.2/mail/messages/{id}/sharing` | `{ shared: boolean }` | `{ id, shared }` |
| POST | `/crm/v2.2/mail/messages/{id}/links` | `{ module, recordId }` | `{ id, module, recordId, linked: true }` |
| DELETE | `/crm/v2.2/mail/messages/{id}/links` | `{ module, recordId }` | `{ id, module, recordId, linked: false }` |

`id` identifies the message, never the queue job. `module` accepts `leads`,
`contacts`, or `accounts`. Both linking and unlinking require current record
read access and message ownership; sharing also requires message ownership.
There is no admin ownership bypass.

Compose accepts participant arrays from the core contract for `to`, `cc`, and
`bcc`; it also accepts free-text recipient lists in these three fields. All
addresses pass through `parseRecipientList` and the outbox recipient guard.
`MAIL_TEST_RECIPIENT` must hold exactly one allowed test address; an absent or
invalid value rejects compose. Never commit a real test address. The body cap
is 1,048,576 UTF-8 bytes. Core limits apply to the combined recipient count
and total attachment size/type. Client-supplied `bodyRef` is rejected.
Attachment references remain staging metadata, with no provider upload or
attachment download endpoint introduced here.

The per-organization process-local state is shared by read and write adapters.
The existing synthetic seed initializes `mailbox-demo` for the first actor in
that organization; ownership is then retained across requests. It does not
provision connected accounts for subsequent actors. This is staging state,
not persistent mailbox onboarding. Restarting the process loses the entire
state; separate server processes do not share it.

Compose stores the body under a private content reference and calls the core
outbox. Compose operations serialize per organization so simultaneous identical
idempotency keys return one result. Reusing a key with different content yields
the existing conflict error contract. Responses omit body references, attachment
blob references, tenant/mailbox/provider identifiers, and job/outbox identifiers.
Only the message id and public operation fields are returned.

No worker consumes the queue and the sender port refuses delivery. A scheduled
request records the schedule and enqueues the job for that time; this adapter
alone does not send email. Durable storage, connected account provisioning,
trusted attachment upload resolution and worker wiring require their own
approved implementation slices.
