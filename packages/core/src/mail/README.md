# Mail core boundary

ADR 0009 Q1/Q4/Q5/Q8 is implemented without persistence, migrations, provider
access, message transport, workers, HTTP or UI. Import this directory directly;
package-level exports belong to the integration issue.

`MailRepository` is a trusted connector/storage port, not a user API. Its
in-memory adapter validates strict row schemas, tenant-local foreign keys,
unique personal mailboxes and insert-only provider message identities. Returned
rows are detached copies. Only the owner service action sets sharing; an inbound
insert is always private, even if its caller supplies `sharedByOwner: true`.
Schema inputs and public errors must never contain raw provider errors, tokens
or passwords. Safe public `lastError` text is the connector's responsibility;
`credentialRef` is an opaque locator for a separate SecretBox, never a secret.

`createMailService` rechecks ownership, tenant and record visibility on each
operation. A shared message requires at least one currently readable linked
record; role/admin status grants no exception. Nonowners cannot mutate sharing
or links. Attachment metadata uses the same message read boundary; bytes remain
private and are not fetched here. Nonowners see only links to readable records.
The record address lookup is trusted server code; exact normalized address and
tenant checks are repeated here, with no domain fallback and no BCC matching.

`assertRecipientAllowed` is a fail-closed development guard, not a sender. The
future sender must call it with all envelope recipients, including CC/BCC, and
an environment-configured allow-list of exactly one address before real sending.
The configured address is not stored by this module.

## Decisions and open follow-ups

- No deviation from the approved board decisions. In-memory storage is the
  issue's explicit staging boundary while ADR 0002 remains unaccepted.
- Thread source and headers are modeled; thread reconciliation/merging and
  provider cursor semantics belong to connector/sync issues.
- Automatic linking marks all discovered associations ambiguous when more
  than one distinct record matches the participants. Manual associations are
  preserved when auto-linking repeats. Unlink removes the current association;
  an explicit later `linkParticipants` call may rediscover it. Persistent manual
  exclusions across future sync runs need a connector policy decision.
- Metadata for an inbound attachment over 20 MiB must be `not_stored` with no
  blob reference. Content scanning, aggregate outbound 20 MiB validation,
  download authorization and blob lifecycle belong to attachment/sender work.
- Outbox types/storage are defined only; scheduling, state transitions, retry
  limits, leases and atomic enqueue belong to the worker/outbound issues.
- SecretBox, disconnect/secret deletion, OAuth, and safe translation of provider
  failures are separate integration responsibilities.
