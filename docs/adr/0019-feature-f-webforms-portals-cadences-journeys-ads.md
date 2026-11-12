# ADR 0019 — Feature F: webforms, portals, cadences, journeys, ads

- Status: Proposed (CTO, 2026-11-06)
- Issue: MEP-1479 (parent MEP-1477); research MEP-1478,
  `research/specs/feature-f-webforms-portals-cadences-journeys-ads.md`
- Depends on: ADR 0010 (worker, queue, mail outbox), ADR 0012 (tenancy, RLS,
  migrations), ADR 0013 (criteria, assignment rules, execution identity),
  ADR 0017 (permission catalogue, enforcement points), ADR 0018 (notifications)

## Context

Feature F brings the first surfaces reachable **without a member session**
(public webforms, later portal users) plus two long-running executors
(cadences, journeys). The reference account is empty for all five parts, so
most behaviour comes from public documentation (spec §1–§5); unobservable
states are built from documentation and our patterns and recorded as evidence
gaps — no reference writes. This ADR fixes the data model and the trust
boundaries; screen details stay in the spec and the build issues.

## Decision

### 1. Scope (CTO decisions on spec §9)

| Part | In | Out / later |
|---|---|---|
| Webforms | Modules **Leads, Contacts, Cases**; builder (fields, required, hidden, default, help, button label, preview); acknowledgement (thank-you text or redirect URL); spam check (own challenge + honeypot + signed render token) and rate limits; owner or assignment rule; owner notification; location allowlist; script embed, iframe, hosted URL; analytics per location; Auto-response Rules tab | Vendors (no module); A/B testing; file-upload field; portal forms; static source-HTML embed (needs a token, §3.4); double opt-in and manual approval **UI** (states exist in the model, §2) |
| Cadences | Definitions, steps (email, task, call), manual + custom-view enrollment, exit rules, pause/deactivate, record related list, reports | Business messaging steps; business hours; open tracking |
| Portals | Model + security boundary now; build after a portal addendum review (§5) | Portal forms, branding uploads beyond our attachment storage |
| Journeys | Journey Builder (states, transitions, versions, instances, logs, reports) | PathFinder (whole tab) |
| Ads | Disconnected settings screen + local model + attribution projection | OAuth, auto-tagging, click enrichment, conversion upload, sync of any kind |

### 2. Storage

Postgres, ADR 0012 §2 exactly as `0009`/`0010`: `organization_id` leads every
PK, composite FKs, UUIDv7 ids, RLS `tenant_isolation` for `crm_app`, minimal
grants. Record references are `(record_module, record_id text)` without FK
(ADR 0018 §2). One migration per part, numbered at merge time (next free
after `0010_feeds.sql`), never editing a merged one.

**Webforms** (`…_webforms.sql`):

| Table | Key columns |
|---|---|
| `webforms` | `id`, `name`, `module` (`Leads`\|`Contacts`\|`Cases`, CHECK), `status` (`draft`\|`active`\|`inactive`), `draft_version_id`, `published_version_id` (null until first publish), audit columns. Unique `(organization_id, lower(name))` |
| `webform_versions` | `id`, `form_id`, `number int`, `state` (`draft`\|`published`\|`superseded`), `fields jsonb`, `settings jsonb`, `published_at`, `published_by`. Unique `(organization_id, form_id, number)`; partial unique one `draft` and one `published` per form. A row leaves `draft` only by publish; `published`/`superseded` rows are immutable (the service never updates them; an integration test asserts it) |
| `webform_locations` | `form_id`, `origin` (normalised `https://host[:port]`, no path), `label`. PK `(organization_id, form_id, origin)`; max 20 per form |
| `webform_submissions` | `id`, `form_id`, `version_id`, `location` (origin, `hosted` or `undefined`), `outcome` (`accepted`\|`invalid`\|`spam`\|`duplicate_pending_approval`\|`pending_approval`\|`pending_double_opt_in`\|`rejected_location`\|`rate_limited`), `record_module`, `record_id` (accepted only), `payload jsonb` (kept **only** for pending outcomes, purged after 30 days or on decision), `client_hash` (HMAC of IP, §3.5), `notification_state` (`none`\|`queued`\|`sent`\|`failed`), `created_at`. Index `(organization_id, form_id, created_at desc)` |
| `webform_daily_stats` | `form_id`, `day date`, `location`, `visits`, one counter per outcome. PK `(organization_id, form_id, day, location)`; upserted in the render / submit transaction |
| `webform_auto_response_rules` | `id`, `module`, `name`, `criteria jsonb` (ADR 0013 `Condition`), `template_id`, `position`, `active`, audit columns |
| `public_rate_limits` | `bucket` (text key), `window_start`, `count`. PK `(organization_id, bucket, window_start)`; rows older than 2 h deleted by a worker sweep |

`fields` JSON (Zod in `packages/core/src/webforms/`): ordered
`[{ fieldApiName, label, required, hidden, defaultValue, helpText }]`; only
fields of the module projection that are creatable, not system-managed, and
of a supported type (text, textarea, email, phone, url, number, currency,
date, datetime, picklist, multi-picklist, checkbox). Every layout-required
field of the module must be present and required (publish rejects otherwise).
`settings` JSON: `buttonLabel`, `ownerKind` (`user`\|`assignment_rule`),
`ownerRef`, `notifyOwner`, `acknowledgement` (`{kind:"message", text}` \|
`{kind:"redirect", url}`), `challenge` (bool), `restrictLocations` (bool),
`captureAttribution` (bool), `approval` (`none`\|`all`) and `doubleOptIn`
(bool) — the last two are stored and validated but the build issues only
implement `none`/`false` until their UI issue lands.

### 3. Public webform boundary

**3.1 Principal.** A submission runs as `ActorRef {kind:"webform", formId,
versionId}` — not a membership, no AccessSnapshot, **not** the ADR 0017 §4.8
system bypass. The record service accepts this actor for exactly one
operation: create one record in the version's module with only the version's
field set; any read, update, other module or extra field is a programming
error (throws, covered by tests). History shows the form name as creator;
`Owner` comes from settings (fixed user — must be an active member — or an
ADR 0013 assignment rule; fallback the form's creator). Downstream
automation fires as for any create (ADR 0013), the webform actor as source.

**3.2 Published versions.** Render and submit use `published_version_id`
only. Editing after publish opens a new draft; publish atomically marks the
old version `superseded`. A submit is validated against the version in its
render token; it is accepted while that version is `published` or was
superseded less than 2 h ago (token lifetime). `inactive` or never-published
forms answer every public route with the same "form unavailable" page / 404.

**3.3 Routes and tenant resolution.**

| Route | Purpose |
|---|---|
| `GET /f/{publicKey}` | hosted page and iframe source; issues render token; counts a visit |
| `GET /api/public/webforms/{publicKey}` | JSON definition + render token for the script embed |
| `POST /api/public/webforms/{publicKey}/submissions` | submit (JSON or form-urlencoded, max 32 KB) |
| `GET /api/public/webforms/{publicKey}/challenge` | new challenge image (SVG) bound to a token |

`publicKey` = 128-bit random, base64url, regenerable (old key dies). It is
resolved through `public_endpoint_keys (key_hash, organization_id, kind,
target_id, revoked_at)`, an **identity/tenancy table** in the `crm_auth`
boundary (ADR 0012 §3 role table), read before any CRM context exists; no
SECURITY DEFINER function, no org id ever taken from the client. After
resolution the request runs a normal tenant-local `crm_app` transaction under
RLS. Routes are declared with `exemptRoute("public", reason)` and the
route-inventory test lists them explicitly; internal session cookies are
ignored on them (no ambient authority).

**3.4 Input handling.** Allowlist: only keys of the version's visible fields
plus `_token`, `_challenge`, `_hp` (honeypot) and, if `captureAttribution`,
`gclid`/`utm_source|medium|campaign|term|content`; any other key → `invalid`.
Hidden fields take their server-side default, client values ignored. Values
go through the record service's own type/length/picklist validators plus
`required`; 422 returns per-field messages about the submitted values only.
Text is stored as text; labels, help and thank-you text are plain text,
escaped on render (no configurable HTML). Redirect URL: `https:` only and its
origin must be in the location allowlist (or the field is rejected at save).
Render token = HMAC (server secret via `packages/core/src/secrets`) over
`{org, form, version, issuedAt, challengeHash?}`; required on every submit,
so a static HTML post without our script/iframe is not supported.

**3.5 Spam and rate limits.** Spam = honeypot filled, token older than 2 h or
younger than 2 s, wrong challenge answer (when `challenge`). Spam receives the
normal success response (no oracle) and outcome `spam`. Limits (fixed window
in `public_rate_limits`): per form + client hash 5/min and 30/h; per form
600/h; per organisation 2 000/h; render 120/min per client hash. Exceeded →
429 page, outcome `rate_limited` counted, no payload kept. `client_hash` =
HMAC(IP) with a server secret; raw IPs are never stored.

**3.6 Locations and embedding.** Location = `Origin` (fallback `Referer`
origin) for script/iframe, `hosted` for `/f/…`. With `restrictLocations`, a
foreign or missing origin gets the unavailable response, outcome
`rejected_location`; without it, it is counted as `undefined`. Hosted page
sends CSP `frame-ancestors` = the allowlist (`'none'` when empty and
restricted); the submit endpoint returns CORS only for allowlisted origins.
The script embed only inserts the iframe (no access to the host page).

**3.7 Outcomes and duplicates.** Order: rate limit → location → token/spam →
validation → duplicate → approval/opt-in gate → create. Duplicate = the
module's existing unique-field check (records README, ConflictError), run
before create; result `duplicate_pending_approval`, payload kept. Every
non-422/429 outcome shows the same acknowledgement — existence of a record is
never disclosed. Pending outcomes create no record and run no automation.

**3.8 After create.** Owner notification (ADR 0018 `notifications` kind
`webform_submission` + optional mail) and auto-response go through the job
queue and mail outbox after commit, idempotency key = submission id.
Auto-response: first matching active rule by `position`, only for `accepted`,
to the submitted email field, at most 1 per recipient per form per 24 h, from
the organisation's configured sender. Failures set `notification_state =
failed`; the record stays.

### 4. Permission catalogue extension (ADR 0017 §3)

Keys are added in the build issue of the part that ships them (0017 rule: no
toggle without a feature), `schemaVersion` 2 with read-time default `false`
for missing keys, so stored profiles need no rewrite:

| Key | Grants | Standard default |
|---|---|---|
| `admin.manageWebforms` | webforms, auto-response rules, analytics, public key regeneration | false |
| `features.cadences.{view, manage}` + `tools.enrollInCadence: Module[]` | see / build-publish-deactivate / enroll records (also needs RW on the record) | view true, manage false, enroll Leads+Contacts+Deals |
| `admin.manageJourneys` + `features.journeys.view` | build/publish / reports and instance logs | false / false |
| `admin.managePortals` | portal setup, user types, invite / disable portal users | false |
| `admin.manageIntegrations` | ads settings screen (and later connectors) | false |

Administrator gets all. Attribution and webform-usage values on records follow
normal record level + field permissions. Settings sections are gated
server-side per 0017 §7.

### 5. Portal external identity (model now, build after addendum)

Portal users are **not** members: separate tables, separate auth, separate
cookie (`__Host-portal`, path `/portal`), no `memberships`/`member_access` row,
never an AccessSnapshot. Tables (`…_portals.sql`): `portals` (one per org:
`slug`, `status`, branding text), `portal_user_types` (`primary_module`
Contacts, `modules jsonb` = per module `{actions, fieldProjection}`),
`portal_identities` (`email citext`, `password_hash`, `user_type_id`,
`record_module`, `record_id` = the linked primary record, `status`
`invited|active|disabled`), `portal_invitations` (`token_hash`, `expires_at`
7 d, `accepted_at`, one use), `portal_sessions` (`token_hash`, `expires_at`,
`revoked_at`). Rule: every portal request = user-type action ∧ field
projection ∧ **relationship proof** (the record is the linked record or holds
a lookup to it, evaluated in the query, not by id check after fetch); unknown
or unrelated id → 404. Portal sessions are rejected by every internal route;
internal sessions are rejected by `/portal`. Disabling an identity revokes its
sessions in the same transaction. Before any portal build issue, a short
addendum (auth library choice, password policy, lockout, related-record
lookup list per module) gets Platform Lead + CTO security review.
Decided in ADR 0019a (`0019a-portal-identity-addendum.md`), which amends
the cookie path (`Path=/`, required by `__Host-`) and replaces
`portal_invitations` with `portal_tokens`.

### 6. Cadence / journey execution seam

**Actor.** Workers run as `ActorRef {kind:"cadence"|"journey", id, versionId}`:
a scoped system actor limited to the definition's module(s) and step/action
types. Emails go out from the enrolling user's (cadence) or record owner's
(journey) connected mailbox via the outbox; before each effect the worker
re-checks that this user is active and has `recordLevel ≥ R` (email) or the
needed create right (task/call); otherwise the step ends `skipped` with reason
`actor_lost_access`. Field updates in journeys follow ADR 0013 §3 rules.

**Model** (`…_cadences.sql`, `…_journeys.sql`): `cadences` + immutable
`cadence_versions` (`audience jsonb`, `steps jsonb`: ordered
`{id, kind, delay {amount, unit minutes|hours|days}, template/task data}`,
`exit_rules jsonb`); `cadence_enrollments` (`cadence_id`, `version_id`,
`record_module`, `record_id`, `enrolled_by`, `state`
`active|paused|completed|exited|stopped`, `reason`, `generation int`,
`next_step_id`, `next_due_at`); partial unique one non-final enrollment per
`(cadence, record)` — re-enrollment creates a new row. `cadence_step_runs`
(`enrollment_id`, `step_id`, `generation`, `outcome`, `executed_at`), unique
`(organization_id, enrollment_id, step_id, generation)`. Journeys: `journeys`
+ immutable `journey_versions` (`states jsonb`, `transitions jsonb`, one
`active` version per journey), `journey_instances` (`version_id`, primary
record, `current_state_id`, `state_entered_at`, `deadline_at`, `status`,
`generation`), `journey_transition_runs` (`instance_id`, `transition_id`,
`event_id`, `result`, `at`) unique `(organization_id, instance_id,
transition_id, event_id)` — this is also the transition log.

**Idempotency and races.** Job idempotency key = the unique run key above;
the effect and the run row commit in one transaction under the job fence
(ADR 0013 §3). The worker locks the enrollment/instance row `FOR UPDATE`,
then requires `state = active` and matching `generation`. Pause, exit,
deactivate, republish, record delete and exit-rule matches bump `generation`
in their own transaction — whichever commits first wins; a mail already handed
to the outbox is not recalled. Exit rules are evaluated before the next step
and win over a simultaneous step (spec C3). Delays are relative to the
previous step's completion in UTC, day units in the organisation time zone;
past-due steps after downtime run once, never back-filled. Reply detection
comes from ADR 0009 thread matching; no open tracking. Journey deadlines and
scheduled actions use the same due-row + generation pattern.

### 7. Ads (local only)

`…_ads.sql`: `ads_settings` (one row; `status` fixed `disconnected`, **no
credential columns**), `ad_campaigns` → `ad_groups` → `ad_keywords`/`ad_items`
(local, admin-entered or empty), `record_attributions` (`record_module`,
`record_id`, `gclid`, `utm_*` each ≤ 255 chars, nullable campaign/group/
keyword refs, `source` `webform|manual|conversion`). Written by webform
create (§3.4) and copied on lead conversion; separate from `Lead_Source`.
No job, connector or outbound request exists for ads.

### 8. Build order and migrations

1. Webforms A — migration + core service + builder/settings screens (internal, gated by `admin.manageWebforms`).
2. Webforms B — public routes, token/challenge/rate limit, ingestion, notifications, auto-response rules.
3. Webforms C — embed codes, analytics, record "Webform usage" related list, side-by-side check.
4. Cadences, then journeys, then ads, then portals (after §5 addendum) — 2–3 issues each, migrations as listed.

Tests per part: core unit tests for every outcome in §3.7 and every rule in
§3.4–3.6; integration test that the webform actor cannot read/update/use
another module or field; RLS catalog test covers each new table; e2e for the
builder and a hosted-page submit; race tests (pause vs due step, exit vs step,
republish vs due step) with two transactions.

## Alternatives considered

- **Anonymous submissions as the system actor** — simple, but any bug in
  field filtering becomes full write access; rejected for the bounded actor.
- **Org id or form id in the public URL** — enumerable and tenant-forgeable;
  rejected for the hashed random key resolved in the auth boundary.
- **Third-party CAPTCHA** — needs an external account and sends visitor data
  out; rejected for the own challenge (can be added later behind settings).
- **Portal users as restricted members** — would put externals into the
  AccessSnapshot and every internal route; rejected.

## Consequences

- Public routes become the first unauthenticated write path: the route
  inventory test and the security review of Webforms B are mandatory (high tier).
- Static source-HTML embed and double opt-in/approval UI are known parity
  gaps, listed on MEP-1477.
- Cadence/journey workers add load to the job queue; per-org due-step batches
  are capped at 200 per worker tick.

## Evidence gaps (no reference writes)

Populated webform list, builder, settings, analytics, cadence editor and
reports, portal setup, journey canvas and ads settings are documentation-
derived (spec §9 items 1–13). Exact visitor messages, HTTP statuses and gate
order are decided here, not observed.
