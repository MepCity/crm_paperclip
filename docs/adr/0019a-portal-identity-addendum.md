# ADR 0019a — Portal identity, auth and relationship proof (addendum to ADR 0019 §5)

- Status: Proposed (CTO, 2026-11-12)
- Issue: MEP-1510 (parent MEP-1477)
- Amends: ADR 0019 §5 (portal external identity). Reads with ADR 0012
  (tenancy, RLS), ADR 0010 (jobs, mail outbox), ADR 0017 (permissions),
  spec `research/specs/feature-f-webforms-portals-cadences-journeys-ads.md`
  §3 P1–P2.
- Review: Gemini Reviewer 2, then Platform Lead (the security review ADR 0019
  §5 requires). No reference writes; portal behaviour beyond P1 is
  documentation-derived (spec §9 item 6).

## Context

ADR 0019 §5 fixed the portal model (separate identities, sessions,
invitations, user types) and the rule "user-type action ∧ field projection ∧
relationship proof, unknown or unrelated id → 404". It deferred the auth
mechanics, password policy, lockout and the per-module lookup list to this
addendum. Portals are the first surface where an **external person reads and
writes CRM data with a password**, so every decision below favours a small,
closed surface over parity breadth.

## Decision

### 1. Auth implementation

**1.1 Primitives, not a second auth instance.** Members keep Better Auth
(`packages/core/src/auth`). Portal auth is our own small module
`packages/core/src/portals/auth/` that reuses only the library's password
primitives `hashPassword` / `verifyPassword` from `better-auth/crypto` (scrypt,
already used by `seed-dev-admin.ts`). We do **not** create a second
`betterAuth()` instance: it would share route conventions, user/session table
naming and plugins with member auth and blur the boundary ADR 0019 §5 draws.
Session, invitation and reset tokens are our code (≈200 lines) with the rules
below. No external identity provider, no OAuth, no magic links.

**1.2 Tenant resolution.** Portal URLs are `/portal/{slug}/…`. The slug is
public (not a secret) and is resolved through the ADR 0019 §3.3 auth-boundary
table `public_endpoint_keys` with `kind = 'portal'` (key = the slug, stored
hashed like every other key) before any CRM context exists. Everything after
that runs in a normal tenant-local `crm_app` transaction under RLS. Login
emails are unique **per organisation** (`(organization_id, email)`), so one
person may hold identities in two organisations; nothing is looked up across
tenants.

**1.3 Session token and storage.** Token = 32 random bytes, base64url, only
in the cookie; `portal_sessions.token_hash` = SHA-256 of it (lookup by hash,
constant-time compare not needed on a hash lookup). The session row stores
`identity_id`, `created_at`, `last_seen_at`, `expires_at` (absolute),
`revoked_at`, `client_hash` (HMAC of IP, ADR 0019 §3.5). A session is valid
only if: not revoked, `now < expires_at`, `now − last_seen_at < idle`, its
`organization_id` equals the slug's organisation, the identity is `active`,
its user type exists and its linked Contact exists and is not in the recycle
bin. Any failure → 401 and the cookie is cleared.

**1.4 Cookie.** Name `__Host-portal`; attributes `Secure; HttpOnly;
SameSite=Lax; Path=/`; no `Domain`. **Correction to ADR 0019 §5:** the
`__Host-` prefix requires `Path=/`, so the cookie cannot be scoped to
`/portal`; isolation is enforced server-side instead (§1.6). When `APP_URL`
is not `https:` (local preview only, same switch as `secureCookies()`), the
name is `portal_session` without `Secure`; production refuses to start portal
routes over plain http.

**1.5 Lifetime.** Idle timeout 2 h, absolute 12 h. `last_seen_at` is written
at most once per 5 min (no write per request). A new token is issued
(old row revoked) on login, invitation acceptance, password reset and
password change. Logout revokes the row. Disabling an identity, changing its
user type, deleting the linked Contact or deleting the portal revokes all its
sessions in the same transaction (ADR 0019 §5). At most 5 live sessions per
identity; the oldest is revoked on the 6th login.

**1.6 Separation from member auth.** Portal route handlers read only the
portal cookie and ignore member cookies; every member route (including
`/api/auth/*`) ignores the portal cookie. A route-inventory test lists every
`/portal` and `/api/portal` route and asserts (a) it is declared with
`exemptRoute("portal", reason)` and (b) a member session alone gets 401 there,
and that every other route rejects a request carrying only a portal cookie.

**1.7 CSRF.** `SameSite=Lax` plus, for every non-GET/HEAD portal request:
`Origin` header required and equal to the `APP_URL` origin (missing or
foreign → 403, same rule as `handleAuthRequest`), and the body must be
`application/json` (no form-urlencoded or multipart except the one upload
route if a later issue adds attachments, which then needs its own CSRF token).
GET routes never change state. Portal pages send
`Content-Security-Policy: frame-ancestors 'none'`, `Referrer-Policy:
no-referrer`, `Cache-Control: no-store`.

### 2. Passwords, invitations, reset, lockout

**2.1 Policy.** 10–128 characters (same as members), any characters, no
composition rules; rejected if it equals the login email (case-insensitive)
or is in a small built-in list of the most common passwords shipped in the
repo (no external lookup). The hash is never returned by any API.

**2.2 Tokens table.** ADR 0019 §5 `portal_invitations` becomes
`portal_tokens (id, identity_id, kind 'invite'|'reset', token_hash,
expires_at, used_at, created_by, created_at)`. Token = 32 random bytes,
SHA-256 stored. Invitation 7 days, reset 1 hour; single use (`used_at` set in
the same transaction that sets the password, with `WHERE used_at IS NULL`).
Issuing a new token of a kind marks all older unused tokens of that kind for
the identity used. Links carry the token in the URL **fragment**
(`/portal/{slug}/accept#t=…`, `/portal/{slug}/reset#t=…`); the page posts it,
so it never appears in server logs or `Referer`.

**2.3 Invitation.** Only a member with `admin.managePortals` invites, from a
Contact that has an email and is not in the recycle bin; the identity is
created `invited` with the Contact's email at that moment (later Contact
email changes do not change the login; re-invite does). One identity per
`(organization, Contact)`. Acceptance = valid invite token + new password
(policy 2.1) → status `active`, token used, session issued. Expired or used
token → the same "link is no longer valid" page. Re-invite allowed while
`invited`; for `active` identities the admin uses "send reset".

**2.4 Reset.** `POST /api/portal/{slug}/password-reset` with an email always
answers 202 with the same body and comparable timing (no account oracle);
only an `active` identity gets a mail. Completing a reset revokes every
session of the identity and issues a new one.

**2.5 Lockout and rate limits** (fixed windows in `public_rate_limits`,
buckets prefixed `portal:`; same sweep as webforms):

| Bucket | Limit | On exceed |
|---|---|---|
| login, per identity | 5 failures / 15 min | identity locked 15 min (further attempts fail generically, no counter reset by success during lock) |
| login, per client hash | 20 attempts / 15 min | 429 |
| login, per organisation | 300 attempts / h | 429 |
| reset request, per email hash | 3 / h | silently no mail, still 202 |
| reset request, per client hash | 10 / h | 429 |
| invite/reset token submit, per client hash | 10 / 15 min | 429 |
| authenticated API, per session | 300 / min | 429 |

Login failure answers are identical for unknown email, wrong password,
`invited`, `disabled`, locked and deleted-Contact cases ("Invalid email or
password."); an unknown email still runs `verifyPassword` against a fixed
dummy hash so timing does not reveal existence. Successful logins, failures,
lockouts, resets and invitation acceptances are written to an audit table
`portal_auth_events (identity_id nullable, kind, client_hash, at)` (no raw IP,
no password, no token) visible to `admin.managePortals`.

### 3. Relationship proof per module

Let `C` = the identity's linked Contact id (`portal_identities.record_id`;
`primary_module` is fixed to Contacts in this build) and `A` = that Contact's
current `Account_Name` (may be null). Each portal user type sets per module a
**scope**: `contact` (default) or `account`. The proof is a predicate added by
the portal query builder **to the same SQL statement** that applies the id or
list filter; `A` is read by a sub-select on `C` inside that statement, never
from the session or the client. Records in the recycle bin never match.

| Module | `contact` scope predicate | `account` scope adds (OR) | Allowed actions (max) |
|---|---|---|---|
| Contacts | `id = C` | — (other Contacts never visible) | view, edit (self, projected editable fields) |
| Accounts | `id = A` | — | view |
| Deals | `Contact_Name = C` | `Account_Name = A` | view |
| Cases | `Related_To = C` | `Account_Name = A` | view, create |
| Quotes | `Contact_Name = C` | `Account_Name = A` | view |
| Invoices | `Contact_Name = C` | `Account_Name = A` | view |

Rules: a null `A` matches nothing (`= NULL` never true; tests cover it).
Only these six modules and these lookups exist; adding a module or a lookup
is an ADR change. Related lists inside a portal record (e.g. Deals of the
Account) are separate list queries with their own proof, never a join that
inherits the parent's proof. Line items of Quotes/Invoices are shown only as
part of their parent record's projection. Notes, attachments, activities,
timeline, history, tags, emails, owners' details and custom related lists are
**not** exposed in this build.

### 4. Projection, actions, write rules and 404

**4.1 User type matrix.** `portal_user_types.modules` (Zod in
`packages/core/src/portals/`) = per module `{ enabled, scope, actions:
{view, create?, edit?}, fields: [{ apiName, mode: "read"|"edit" }] }`,
validated against §3 (an action outside the table, `edit` on a non-editable
or system field, or an unknown field is rejected at save). Never exposed:
owner/created-by/modified-by user lookups (user names, emails), internal
system fields, tags, record ids of unrelated modules, `ownerlookup` fields,
formula fields that read non-projected fields. Lookups in the projection
render the target's display name; they are links only when the target
record passes its own proof.

**4.2 Responses.** Every portal read returns only projected fields — the
projection is applied in the query's select list, not by trimming a full
record. Lists are paged (max 50), sortable only on projected fields; filter
and search only on projected fields.

**4.3 Writes.** Edit (Contacts self) and create (Cases) accept only keys
whose projection mode is `edit`; any other key → 422 naming the key. Values
pass the record service's validators. Create Cases sets `Related_To = C` and
`Account_Name = A` server-side (client values for these keys are rejected)
and takes `Owner` from the user type's `caseOwner` setting (active member or
ADR 0013 assignment rule; fallback the portal creator). Writes run as
`ActorRef {kind:"portal", identityId, userTypeId}` — not a membership, no
AccessSnapshot, not the ADR 0017 §4.8 system bypass; the record service
accepts this actor only for the operations of §3 and throws otherwise.
History shows the portal identity's name; ADR 0013 automation fires as for
any create/update. No delete, mass action, convert, export or import.

**4.4 Not found.** A record id that does not exist, belongs to another
organisation, fails the proof, is in the recycle bin, or is in a module not
enabled for the user type → **404 with an identical body**, from the same
query path (no 403 anywhere in the portal data API, so existence never
leaks). A disabled module's list route also returns 404.

### 5. Mail

Invitation and reset mails go through the ADR 0010 job queue and mail outbox
after commit (job idempotency key = `portal_tokens.id`), from the
organisation's configured sender, with fixed templates (subject + plain text
+ simple HTML; portal name and the link only — no record data). Language =
the portal's default language (ADR 0014). If no sender is configured, the
admin action fails with a clear message instead of queuing. No external
identity provider and no third-party mail API.

### 6. Build split (3 issues, all high tier)

1. **Portals A — identity and auth (platform).** Migration (`portals`,
   `portal_user_types`, `portal_identities`, `portal_tokens`,
   `portal_sessions`, `portal_auth_events`; boundary keys), core auth module
   (§1–§2), routes login/logout/accept/reset/me, admin service for portal
   create/disable, user types, invite/re-invite/disable/send-reset, mail jobs
   (§5), `admin.managePortals` key (ADR 0019 §4).
2. **Portals B — data access (platform).** Portal query builder with the §3
   proof, projection (§4.1–4.2), writes (§4.3), 404 rule (§4.4), portal actor
   in the record service, portal data routes.
3. **Portals C — screens (UI).** Setup: portal landing (P1) → setup, user
   types and module/field matrix, portal users list with invite/disable/reset;
   external portal: login, accept, reset, home, per-module list and detail,
   case create, self-edit. E2E for both sides; side-by-side check of P1.

**Security test list** (every item is a required test; A and B reviews tick
them):

- Auth: member session → 401 on every portal route; portal cookie → 401 on
  every member route (route-inventory test); session of org X on org Y's slug
  → 401; revoked, idle-expired, absolute-expired session → 401; disabling the
  identity / changing its user type / trashing its Contact revokes sessions in
  the same transaction (two-transaction test).
- Cookie attributes exactly as §1.4 on https; token value never stored (only
  hash); token rotation on login, accept, reset, password change.
- CSRF: non-GET without `Origin`, with foreign `Origin`, or with
  form-urlencoded body → 403/415; GET routes have no side effects.
- Password policy edges (9/10/128/129 chars, equals email, common list).
- Tokens: expired, used, superseded, wrong-kind token rejected; concurrent
  double accept → one success; token not accepted in query string.
- Lockout: 5 failures lock 15 min, correct password during lock fails with
  the generic message; identical response bodies for unknown/wrong/invited/
  disabled/locked; unknown email runs the dummy verify; reset request always
  202 and mails only active identities; every limit in §2.5 returns 429 at
  its threshold.
- Proof, per module and scope: own record visible; another Contact's record
  → 404; same-Account record visible only in `account` scope; null `A`
  matches nothing; trashed record → 404; other organisation's id → 404;
  disabled module → 404; identical 404 bodies; related-list queries do not
  inherit the parent's proof.
- Projection: non-projected, owner and system fields absent from list,
  detail, sort, filter and search (sort/filter on them → 422); lookup to an
  unrelated record is name-only.
- Writes: unknown or read-only key → 422; `Related_To`/`Account_Name` from
  the client rejected on Case create; portal actor cannot update/delete any
  other module or record (service throws); history shows the portal actor.
- RLS catalog test covers every new table; audit events contain no IP,
  password or token.

## Alternatives considered

- **Second Better Auth instance for portals** — less code, but shares route
  and table conventions and plugins with member auth; a configuration slip
  would mix principals. Rejected for own small module on the same hashing
  primitive.
- **Magic-link login only** — no passwords to protect, but every login
  depends on mail delivery and the documented flow is password-based;
  rejected.
- **Proof by fetch-then-check** — simple but leaks through timing, list
  counts and related lists; rejected (ADR 0019 §5).
- **Account scope by default** — broader than a single customer contact
  expects; `contact` is the default, admins opt in per module.

## Consequences

- ADR 0019 §5 is amended: cookie `Path=/` (not `/portal`), and
  `portal_invitations` is replaced by `portal_tokens` with a `kind`.
- Portal features beyond §3 (notes, attachments, activities, forms, other
  modules, multiple primary modules) are parity gaps listed on MEP-1477 and
  need an ADR change before any build.
- Portal B touches the record service (new actor kind): high tier, CTO
  approval after the Platform Lead.

## Evidence gaps (no reference writes)

User-type matrix, invitation mail, login and external pages are
documentation-derived (spec P2); exact texts, limits, lifetimes and HTTP
statuses are decided here, not observed.
