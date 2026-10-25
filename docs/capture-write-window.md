# Capture write observation window

Implementation and offline test handoff for MEP-1354. Product code is outside
this change. The existing capture command remains read-only without the new
flags. Installation is not permission to use the window: the W0 review,
Platform Lead approval and CTO approval must finish first.

The implementation lives in the research workspace's `tools/capture/` directory:
`write-window.mjs`, `write-window-adapter.mjs`, and narrow changes to
`capture.mjs`, `guards.mjs`, `steps.mjs`, and `controls-usage.md`. The pre-window
backups remain untouched. The issue's uploaded review bundle contains the new
modules, a local integration patch, this guide, and test evidence. Local patch
context belongs in that private artifact, never in the repository.

## Activation contract

Run from the capture tool directory. All values below are placeholders; no live
policy, real host, recipient, identity or account information is committed.

```sh
node capture.mjs capture '<neutral-page-path>' '<capture-slug>' \
  --write-window '<window-issue-uuid>' --agent crm-analyst \
  --write-window-policy '<versioned-local-policy.json>' \
  --fill '<allowlisted-name-selector>' 'ZZTEST-observation' \
  --click '<allowlisted-save-selector>'
```

Every activation verifies the authenticated Paperclip agent through
`GET /api/agents/me`, then fetches the issue and comments. The agent must be
CRM Analyst, assigned and currently executing that issue in the same company.
The issue must be `in_progress`, created by a board user or the authenticated
CTO identity, and marked `write-window` or `yazma penceresi` in its title or
labels. API failures stop startup before browser acquisition.

The approved issue description must publish the exact policy JSON in a fenced
block whose language is `capture-write-window-policy`. A board-authored comment
must contain the standalone line `BoardRecipient: <single-address>`. An agent
comment is insufficient. The local policy must match the published policy.
Changing the endpoint list requires a new reviewed policy; an unsupported
request never becomes permitted merely because the clock and flags match.

The version 1 policy has these fields:

| Field | Constraint |
| --- | --- |
| `version` | `1` |
| `windowIssueId` | Exact API issue UUID |
| `notBefore` | Valid timestamp earlier than expiry |
| `expiresAt` | Exactly `2026-10-26T04:00:00Z` |
| `boardRecipient` | One exact address, confirmed by the board comment |
| `host` | One exact HTTPS host, no port, credentials or wildcard |
| `objectPrefix` | Exactly `ZZTEST-` |
| `endpoints` | Nonempty list of exact supported endpoint descriptors |

The policy is opened read-only with symlink rejection, cloned and recursively
frozen. Its SHA-256 is retained in the journal and capture metadata. A later
file edit cannot change an active process's policy. A restart with a different
hash cannot reuse the existing registry or journal.

## Endpoint descriptors and supported shapes

Each descriptor specifies `key`, `module`, `method`, `path`, `operation`, `body`,
`success`, and `context`. No wildcard or arbitrary regular expression is
accepted. The only path placeholder is one `:id` segment. Queries, encoded path
segments, fragments, extra body keys, form-encoded payloads and multipart
uploads are unsupported and blocked.

The module is one of `Documents`, `Email`, `Calendar`, `Customization`,
`Automation`, `Reports`, `Home`, `Workqueue`, `Visits`, or `Social`. Resource paths
are restricted to those modules, `settings`, or `recycle_bin`, under a versioned
`/crm/v<version>/` prefix. Prohibited operations such as import, bulk actions,
campaigns, account connections, users, roles, billing, logout and permanent
non-test deletion remain denied. Automation payloads must explicitly keep the
rule inactive. Unknown wire formats need a separately reviewed adapter; do not
widen the policy to make a blocked observation work.

`body` is an exact JSON template. Literal values stay literal. Only these typed
placeholders are supported:

| Placeholder | Accepted value |
| --- | --- |
| `$name` | String beginning `ZZTEST-`, at most 200 characters |
| `$id` | The single target ID from the registered path |
| `$recipient` | The exact board address |
| `$text` | String at most 2,000 characters |
| `$value` | Scalar setting value, settings adapter only |

Arrays contain at most one item, and ID-list fields are rejected. Every address
in every nested field must exactly equal the board recipient, including extra
to/cc/bcc/attendees and addresses embedded in free text. Unsupported recipient
encodings fail template matching. Dynamic owner and foreign target fields are
not supported.

`success` is either `{ "path": "<response.pointer>", "value": "<literal>" }`
or `{ "status": 204 }`. A 2xx response alone does not prove semantic success.
A create descriptor also needs `responseId` (a dotted response pointer), a
`restoreKey` referring to the matching registered-object delete descriptor, and
a `$name` in its body. A delete descriptor requires a corresponding single-item
recycle descriptor. Delete/recycle descriptors require a GET verification
descriptor, `verify: { "path": "<same-path-with-:id>", "status": 404 }`.
These are strict supported contracts, not assumed reference API behavior.

`context` gives one exact Save/Send/Delete/Create selector and either a new form
`nameSelector`, or a record `titleSelector`. The visible context must identify a
test object; existing-record clicks also need the same registry entry. Each
permitted click grants one endpoint/ID capability for at most 15 seconds. The
network independently validates and consumes it. A click cannot authorize a
different endpoint. Dangerous broad actions remain blocked even in test context.

Optional `inputs` maps exact form selectors to `$name`, `$text` or `$recipient`.
`--fill` exists only with window flags. Fill the test name first; other inputs
require that prefixed name already be present. Positional, ambiguous and frame
selectors remain unsupported for write controls. Read-only step behavior is
unchanged.

## Journal, failures and metadata

The research workspace's `write-window/` directory must already exist.
`changes.md` contains a Markdown-wrapped JSON journal with the policy hash,
issue/agent identity, registry, settings snapshots, blocked reasons and rows.
Each row records time, screen, action, target, previous and next values,
restoration state and outcome. The implementation writes a mode-0600 temporary
file, fsyncs it, atomically replaces the journal and fsyncs the parent directory
before transmitting a write. It then updates the same transaction row.

An unreadable journal, failed write/fsync, ambiguous create response, transport
failure or failed restoration verification stops further writes. An unresolved
prepared/unknown transaction also blocks restart. Do not delete or edit the
journal to work around this: stop and escalate the exact unresolved transaction
to the board. Creation responses that cannot prove their new ID are never
registered. An HTTP error is logged without creating a registry entry.

The clock is read for each request, each click/input, after the durable journal
write, and immediately before transmission. At expiry, a `window-expired` entry
is written and all future writes, including restore, close. There is no cleanup
exception after the deadline. `allowedWrites` counts outgoing mutation attempts
and is updated before transport so success, partial error, SIGINT and SIGTERM
metadata retain it. Existing blocked-request evidence stays intact.

Telemetry remains blocked. Window-mode pages reject existing service workers,
block new worker/event-stream transports, close WebSocket routes, and never
follow mutation redirects. The browser integration was verified with fake
routes only; this task does not connect to the reference CRM.

## Restore and settings procedure

Run the restore command with the same issue, policy and journal before expiry:

```sh
node capture.mjs capture '<neutral-page-path>' '<restore-slug>' \
  --write-window '<window-issue-uuid>' --agent crm-analyst \
  --write-window-policy '<same-versioned-local-policy.json>' \
  --write-window-restore
```

The command enumerates the journal registry, deletes each owned test object,
verifies deletion, purges each single registered recycled object and verifies
its absence. It does not enumerate or empty unrelated recycle-bin contents.
Missing restore endpoints stop cleanup. Both normal Delete clicks and restore commands require the exact verification
GET before committing deleted/purged state. Missing, failed or ambiguous verification
keeps the WAL unresolved and stops subsequent writes. A registry entry survives
until its delete/purge evidence is verified. Restoration uses only exact policy requests,
the browser session's in-memory cookies and CSRF token, and disabled redirects.
Those credentials are never persisted in the journal or artifacts.

Settings use an explicit adapter rather than UI Save clicks:

```sh
node capture.mjs capture '<neutral-page-path>' '<setting-slug>' \
  --write-window '<window-issue-uuid>' --agent crm-analyst \
  --write-window-policy '<same-versioned-local-policy.json>' \
  --write-window-setting '{"key":"<allowlisted-setting-key>","value":false}'
```

A setting descriptor must have `operation: "setting"`, a literal settings path,
`body` with `$value`, `context.kind: "setting"`, and
`read: { "path": "<same-setting-path>", "value": "<response.pointer>" }`.
The adapter reads the previous scalar value, fsyncs it, performs the narrow
change and restores/verifies it before returning in the same session. Missing
previous values or unsupported structured settings never permit a write. Before
the initial mutation, the previous value must pass the same request policy in a
constructed rollback request; foreign addresses remain rejected. Single-item
array templates preserve their array shape for both mutation and rollback.

CRM Analyst remains responsible for adding every observation to the window
issue comment, reviewing the journal, beginning cleanup with time to spare,
checking every object and setting, and posting the final restore report. Any
unrestorable or ambiguous state requires stopping and telling the board.

## Offline verification

Set `CAPTURE_TOOL_DIR` to the research capture tool directory, then run:

```sh
node --test scripts/capture-write-window.test.mjs
```

The suite uses reserved `.invalid` hosts/addresses, synthetic identities,
in-memory API responses and fake transports. Run the existing capture guard,
step, partial-metadata and runtime tests as regression coverage. No product
screen changed, so product E2E and a full application test run are inapplicable.
