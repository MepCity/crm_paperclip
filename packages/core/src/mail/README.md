# Mail core boundary

ADR 0009 Q1/Q4/Q5/Q8 is implemented without persistence, migrations, provider
access, HTTP or UI. Job handlers and explicit fake worker wiring are available
through `@crm/core/mail`; real provider startup remains deferred.

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
- Automatic linking marks an association ambiguous only when at least one
  normalized participant address that found it matches multiple distinct records.
  Different addresses with unique matches remain unambiguous. Manual associations
  are preserved when auto-linking repeats. Unlink removes the current association;
  an explicit later `linkParticipants` call may rediscover it. Persistent manual
  exclusions across future sync runs need a connector policy decision.
- Metadata for an inbound attachment over 20 MiB must be `not_stored` with no
  blob reference. Content scanning, aggregate outbound 20 MiB validation,
  download authorization and blob lifecycle belong to attachment/sender work.
- Outbox types/storage are defined only; scheduling, state transitions, retry
  limits, leases and atomic enqueue belong to the worker/outbound issues.
- SecretBox, disconnect/secret deletion, OAuth, and safe translation of provider
  failures are separate integration responsibilities.

## Gmail connector (`connectors/gmail/`)

`MailConnector` (list changes by history-id cursor, fetch, send raw MIME,
revoke, disconnect) is implemented for Gmail over an injected `HttpTransport`;
core never calls the network. Config comes from env names `GMAIL_OAUTH_CLIENT_ID`,
`GMAIL_OAUTH_CLIENT_SECRET` and `GMAIL_OAUTH_SCOPES` (space separated), read with
`readGmailConfig`; no values are committed. The refresh token is stored only as
SecretBox ciphertext in a `CredentialStore` under the mailbox's `credentialRef`;
access tokens stay in memory. A 401 triggers one refresh, then `auth_revoked`;
429/5xx are `retryable` with `retryAfterSeconds`. Errors carry no provider body.
The initial window is 30 days of Inbox + Sent; an expired history id falls back
to it. Attachments within the 20 MiB limit get a provider locator `blobRef`
(bytes are fetched later); larger ones are `not_stored`. `syncMailbox` is
replay-safe. The store is in-memory only until ADR 0002 is accepted.

## MIME (`mime.ts`)

`composeMime` is a pure function that builds the raw RFC 5322 message the
Gmail connector sends. Lines are CRLF, headers fold at 76 characters (hard cut
at 998). Non-ASCII subjects and display names use RFC 2047 UTF-8 B encoded-words
(max 45 bytes each, code points never split); non-ASCII attachment names add an
RFC 2231 `filename*`. Rule: every body part and attachment is base64 with
76-character lines. Layout: text only → `text/plain`; text+html →
`multipart/alternative`; attachments wrap that in `multipart/mixed`. BCC is never
written to headers; `envelopeRecipients` returns to+cc+bcc for the sender. CR/LF
in names, subject, addresses or ids throws. Boundary and Message-ID are
injectable. Recipient policy checks belong to the sender, not here.

## Inbound worker (`sync.ts`)

`createMailSyncHandler` runs one batch for each configured Inbox/Sent folder.
`MailRepository.getSyncState` / `putSyncState` store a detached tenant/mailbox/folder
cursor, `lastSyncedAt`, and a safe classified `lastError`. The cursor advances
only after all messages, attachment metadata and automatic record links have
been written. A failed batch retains its previous cursor and success time;
insert-only provider identities and idempotent metadata/link writes allow replay.
Drafts remain local compose state and are skipped by inbound sync.

Inbound linking uses `matchRecordLinks` with the exact tenant/address-checked
lookup results. It links every match and applies the matcher’s message-wide
ambiguity flag. BCC and domain matches are excluded. Manual associations survive
replay, including manual-only targets. Message sharing remains private by default.

Connector `retryable` failures and storage failures use bounded queue retries;
Retry-After is respected. `auth_revoked` sets mailbox status to `error`, records
the safe folder error and fails permanently. Disconnects also stop synchronization.
Worker checkpoints guard provider calls and writes against cancellation/lease loss;
this is process-local fencing, not a transactional or distributed guarantee.

`createMailboxSyncScheduler(context, queue).enqueueMailboxSync(mailboxId)` shares
pending exclusion across scheduler instances using the same queue. It returns the
existing queued/running job and assigns a fresh generation key after a terminal
job, because the queue retains old idempotency keys. This staging helper is
process-local: durable atomic enqueue/exclusion belongs to the later approved
persistence adapter. It creates no polling timer.

`apps/worker` registers both `mail_send` and `mail_sync` in explicit `--ephemeral`
mode. Its fake connector returns empty batches and its fake sender rejects all
sends. Neither uses real credentials, provider HTTP or a real mailbox.
