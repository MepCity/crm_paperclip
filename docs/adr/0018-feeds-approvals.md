# ADR 0018 — Feeds, notifications and My Jobs / Approvals

- Status: Proposed (CTO, 2026-11-05)
- Issue: MEP-1448 (Feature C); research MEP-1452,
  `research/specs/feature-c-feeds-approvals.md`
- Depends on: ADR 0012 (tenancy, RLS, migrations), ADR 0013 (criteria,
  automation), ADR 0015 (chat: Postgres pattern, polling), ADR 0017 (profiles,
  roles, sharing)

## Context

The board asked for the company feed (posts, comments, likes, mentions, record
updates, follow, filters, notifications) and My Jobs / Approvals (pending
items, approve / reject / delegate, history, the minimum process setup behind
them). The research could observe only empty states: the Feeds module is
denied to the signed-in account, My Jobs and both process setup screens are
empty (spec §0). The CTO decided on MEP-1452 not to ask the board for
screenshots or permission changes: unobserved parts are designed here from our
own components, and parity is checked when it becomes observable.

CRM records still live in the fixture record service; users, memberships, chat
and (from ADR 0017) access configuration live in Postgres. The fixture record
service already offers per-module `afterWrite` hooks
(`packages/core/src/records/fixture/hooks.ts`) and a record history service
(`packages/core/src/records/history.ts`).

## Decision

### 1. Scope

| In | Out (later ADR if wanted) |
|---|---|
| My Jobs page: 4 tabs with counts (Blueprint transitions, Approvals, Reviews, Image validations), Reviews and Approvals lists with filters, review/approval history page, item detail with approve / reject / delegate | Blueprint transitions and image validations: visible tabs with count 0 and their empty state only (no Blueprint feature exists) |
| Setup > Process management: approval processes (list, create/edit, activate, reorder, delete) and review processes (list, create/edit, delete) | The reference's announced "new view" step builder (spec Q8); scheduled execution (`Cetvel` column shown, always "—") |
| Feeds wall, post composer, comments, likes, @mentions, follow/unfollow of records and users, wall filters, record feed tab on record detail | Groups as post audiences (ADR 0017 groups exist; posting to a group is later), attachments in posts, polls |
| One notification store + the top-bar bell panel for mentions, comments on my posts, approval assigned / decided, review assigned / decided | E-mail digests, push |

Labels: Turkish UI strings follow the spec; the approvals tab label is
"Onaylar" (capitalised; spec Q6 decided on MEP-1452).

### 2. Storage: Postgres, two migrations

Both follow ADR 0012 §2 exactly as `0007_chat.sql` does: `organization_id`
first in every primary key, composite foreign keys, UUIDv7 ids, RLS policy
`tenant_isolation` for `crm_app`, grants limited to what the services use, user
references as composite FKs to `memberships (organization_id, user_id)` with
`on delete restrict` for authorship and `cascade` for follows/notifications.
Record references are `(record_module text, record_id text)` without FK
(records are not in Postgres yet; ADR 0017 §6 consequence applies).

Migration numbers: ADR 0017 takes `0008_access_control.sql`. Approvals take the
next free number at merge time (`0009_…` if nothing else landed), feeds the one
after. The implementer renumbers on conflict; never edit a merged migration.

**Approvals + notifications migration** (`…_approvals_notifications.sql`):

| Table | Key columns |
|---|---|
| `approval_processes` | `id`, `kind` (`approval`\|`review`), `name`, `module`, `trigger` (`create`\|`edit`\|`create_or_edit`), `criteria jsonb` (ADR 0013 `Condition`), `steps jsonb`, `review_fields jsonb` (review kind only: field api names), `on_approve jsonb`, `on_reject jsonb`, `active bool`, `position int`, audit columns. Unique `(organization_id, kind, module, lower(name))`. |
| `approval_requests` | `id`, `process_id`, `kind`, `record_module`, `record_id`, `record_label` (name at submit, for lists), `submitter_user_id`, `submitted_at`, `current_step int`, `status` (`pending`\|`approved`\|`rejected`\|`recalled`; review kind uses `waiting_review`\|`in_review`\|`waiting_rereview`\|`rejected`\|`approved`), `decided_at`. Partial unique `(organization_id, record_module, record_id) where status in open states`: at most one open request per record. |
| `approval_request_approvers` | `request_id`, `step int`, `user_id`, `state` (`pending`\|`approved`\|`rejected`\|`delegated`\|`skipped`), `delegated_from_user_id`. PK `(organization_id, request_id, step, user_id)`. Index `(organization_id, user_id, state)` for the queue. |
| `approval_actions` | history: `id`, `request_id`, `step`, `actor_user_id` (null = system), `action` (`submitted`\|`approved`\|`rejected`\|`delegated`\|`recalled`\|`auto_approved`), `comment`, `target_user_id`, `acted_at`. Append-only (no update/delete grant). |
| `notifications` | `id`, `recipient_user_id`, `kind` (`mention`\|`post_comment`\|`post_like`\|`followed_update`\|`approval_assigned`\|`approval_decided`\|`review_assigned`\|`review_decided`), `actor_user_id`, `subject jsonb` (ids only: post/comment/request, record module + id), `created_at`, `seen_at`, `read_at`. Index `(organization_id, recipient_user_id, created_at desc)`. |

`steps` JSON (validated by Zod in core): ordered
`[{ name, approvers: { kind: "users"|"roles"|"groups"|"record_owner_manager", refs: string[] }, rule: "any"|"all" }]`,
1–5 steps. `on_approve` / `on_reject`: list of ADR 0013 `field_update` actions
on the same record (only), applied as the system actor (ADR 0017 §4.8).

**Feeds migration** (`…_feeds.sql`):

| Table | Key columns |
|---|---|
| `feed_posts` | `id`, `author_user_id`, `body` (sanitised rich text, max 5 000 chars, same sanitiser as notes), `record_module`, `record_id` (null = wall post), `created_at`, `edited_at`, `deleted_at` (soft delete keeps comment threads consistent). Index `(organization_id, created_at desc)`, `(organization_id, record_module, record_id, created_at desc)`. |
| `feed_comments` | `id`, `post_id`, `author_user_id`, `body`, `created_at`, `edited_at`, `deleted_at`. Comments may also target a record history event: `history_event_id` instead of `post_id` (exactly one of the two). |
| `feed_likes` | `target_kind` (`post`\|`comment`\|`history_event`), `target_id`, `user_id`, `created_at`. PK `(organization_id, target_kind, target_id, user_id)`. |
| `feed_mentions` | `source_kind` (`post`\|`comment`), `source_id`, `user_id`. Rebuilt on edit. |
| `feed_follows` | `user_id`, `target_kind` (`record`\|`user`), `target_module` (records only), `target_id`, `created_at`. PK `(organization_id, user_id, target_kind, target_module, target_id)`. |

### 3. Record updates in the feed: read-time union, no copy

A record update item is **not** stored again: the feed reads record history
events (`RecordHistoryService`) of the visible records and merges them with
posts by time (keyset cursor `(created_at, id)`, page 20). Event kinds shown:
record created, field changed (only fields listed by the module's history
config), owner changed, note added, activity created / closed, approval
submitted / decided. Likes and comments on an event reference
`history_event_id`.

- **Auto-follow**: a record's owner follows it implicitly (computed, not
  stored); the author of a post or comment follows that post's record. Explicit
  follow rows add records and users; an explicit unfollow of an owned record is
  stored as `feed_follows` with `target_kind = 'record'` and a negative marker
  column `muted bool` (the only way to stop following an owned record).
- **Wall filters** (decided; reference unobserved): `Tüm Güncellemeler` (all
  posts + events of every record the viewer can read, last 30 days for events),
  `Takip Ettiklerim` (followed records and users), `Benim` (my posts, comments
  and events of records I own), plus a module filter. The filter choice is a
  URL parameter, never a persisted preference.
- **Fan-out at read time**, no per-user inbox table. Event reads are bounded
  (30 days, candidate cap 500 per page request) so the cost stays flat; a
  materialised inbox is the escape hatch if a measurement ever shows the need.

### 4. Visibility and permissions (ADR 0017 model)

Catalogue keys added to ADR 0017 §3 (whichever of D1 or this feature lands
second adds them; both Administrator and Standard default to `true` except
`processManagement`, Standard `false`):

- `features.feeds: { view, post }` — Feeds tab, wall, record feed tab, composer.
- `admin.processManagement` — Setup > approval and review processes.

Rules (all enforced server-side in the services; UI hides per ADR 0017 §8):

1. **Feed items**: a record-bound post, comment, like or history event is
   returned only if `recordLevel(viewer, module, record) ≥ read`; history event
   `changes` drop fields whose `fieldAccess` is `hidden` for the viewer, and an
   event with no remaining field is dropped. Wall posts (no record) are visible
   to every active member with `features.feeds.view`. Records are read through
   `getRecordService(ctx)`, so ADR 0017 §6 filtering applies automatically once
   enforcement lands; until then today's org-wide visibility holds.
2. **Write**: post = `features.feeds.post` (+ record `read` for record posts);
   comment / like = `features.feeds.view` + read on the target; edit / delete =
   author only, delete also by `admin.dataManagement`. Mentions are accepted
   only for active members; a mentioned user who cannot read the record gets
   no notification (no leak of the record's existence).
3. **Approval queue**: an item is listed for a user iff they hold a `pending`
   row in `approval_request_approvers` for the current step; administrators
   with `admin.processManagement` may list all open requests (filter "All").
   Being a pending approver grants **read** on that record's detail for the
   duration of the request (scoped grant in `RecordAccessPolicy`: the policy
   consults open approver rows; fields hidden by profile stay hidden).
4. **Decide**: approve / reject = pending approver of the current step;
   delegate = same, target must be an active member, gets the approver row
   (`delegated_from_user_id` set), the delegator's row becomes `delegated`;
   recall = submitter or `admin.processManagement`. Every decision is one
   transaction: approver row, request status, `approval_actions` row,
   notifications, and `on_approve`/`on_reject` field updates (system actor).
5. **Record lock**: while a request is open, edits of the record are refused
   with 409 `record_locked_for_approval` except for administrators and the
   current approvers (decided; reference documentation describes a lock).
   Delete of a locked record is refused for everyone but administrators.
6. **Setup**: process create/edit/reorder/activate/delete =
   `admin.processManagement` (until ADR 0017 enforcement lands:
   `memberships.role = 'admin'`, then the D2 registry test migrates it).

### 5. Submission: automatic, through the record write path

- An `afterWrite` observer registered for **every** module (one generic hook in
  `packages/core/src/approvals/`, not per-module hooks; ADR 0013 rule) runs on
  create and edit of records written by a user (not by seeds, imports or the
  system actor). It picks the first **active** process of the record's module
  by `position` whose `trigger` matches and whose `criteria` matches the new
  record; if the record has no open request it creates one (`submitted`
  action, step 1 approvers resolved now: users as listed, roles → members of
  the role, groups → resolved members (ADR 0017 §4.4),
  `record_owner_manager` → members of the parent role of the owner's role).
  An empty approver set never approves the step: the request stays `pending`
  at that step with a `submitted` action carrying `resolution_error`, visible to
  administrators, who may recall it (amended by MEP-1518; `auto_approved` stays
  only for rows written before). Group steps must name existing groups at save
  time and when a process is activated.
- `rule: "any"` → first approval completes the step; `"all"` → every row must
  approve. Any rejection rejects the request. The last step's approval
  approves it.
- Review processes use the same tables with `kind = 'review'`; their reviewer
  sees `review_fields` of the record and approves or rejects; reject sets
  `waiting_rereview`, the next edit by the owner moves it back to
  `waiting_review`, approve closes it.
- No manual "Submit for approval" button (unobserved; decided). Edits that do
  not match leave the record untouched. A resolution error is logged and
  recorded as a `submitted` action with the error, and the request stays
  `pending` with no approvers, visible to administrators. If the request itself
  cannot be stored, the observer fails closed (MEP-1518): the record service
  undoes the write and the user's request fails, so no matching record is ever
  saved without its approval request. Merge, deduplication and lead conversion
  pass the same lock check and observer as update.

### 6. Notifications and the bell

`NotificationService` (`packages/core/src/notifications/`) with
`notify(tx, recipients, kind, subject, actor)` inside the caller's
transaction; recipients are de-duplicated and the actor never notifies itself.
Bell: `GET …/notifications?cursor=` (newest first, 20), `GET …/notifications/unseen_count`,
`POST …/notifications/actions/seen` (opening the panel marks the listed ones
seen), `POST …/notifications/{id}/actions/read`. The client polls the count
every 30 s on visible tabs (same pattern as ADR 0015 chat sync, longer
interval). Each item links to the post, record or My Jobs item; a target the
viewer can no longer read renders as "Bu öğe artık mevcut değil".

### 7. API surface

New endpoints follow our existing contract pattern (`operationRoute`,
`/crm/v2.2/...`, Zod codecs, keyset cursors); they do not mirror the
reference's paths (Module 2+ rule; MEP-1452 decision).

| Endpoint | Purpose |
|---|---|
| `GET /crm/v2.2/approvals?type=approval\|review\|blueprint\|image_validation&status=&module=&cursor=` | my queue (blueprint and image validation always empty) |
| `GET /crm/v2.2/approvals/counts` | the four tab badges |
| `GET /crm/v2.2/approvals/{id}` | item detail: record summary (fields allowed to the viewer), process, step, approvers, history |
| `POST /crm/v2.2/approvals/{id}/actions/{approve\|reject\|delegate\|recall}` | `{ comment?, targetUserId? }` |
| `GET /crm/v2.2/approvals/history?type=&module=&user=&action=&from=&to=&cursor=` and `GET …/history/meta` | review logs page and its filter options |
| `GET/POST /crm/v2.1/settings/approval_processes`, `GET/PATCH/DELETE …/{id}`, `POST …/actions/reorder` | setup (same for `review_processes`) |
| `GET /crm/v2.2/feeds?filter=all\|followed\|mine&module=&cursor=` | wall |
| `GET /crm/v2.2/feeds/records/{module}/{id}?cursor=` | record feed tab |
| `POST /crm/v2.2/feeds/posts`, `PATCH/DELETE …/posts/{id}`, `POST …/posts/{id}/comments`, `PATCH/DELETE /crm/v2.2/feeds/comments/{id}` | posts and comments |
| `PUT/DELETE /crm/v2.2/feeds/likes/{targetKind}/{targetId}` | like / unlike (idempotent) |
| `PUT/DELETE /crm/v2.2/feeds/follows/{record\|user}/{…}` | follow / unfollow (idempotent) |
| `GET /crm/v2.2/notifications…` | §6 |

Every route declares its ADR 0017 permission entry (route permission map) in
the same change.

### 8. Screens

- **My Jobs** (`/crm/[org]/tab/Approvals`, rail "İşlerim"): exactly the spec
  §3 inventory; Approvals tab columns (decided, mirroring Reviews): Kayıt Adı,
  Modül, İşlem Adı, Adım, Gönderen, Gönderme Tarihi, Durum. Row click opens the
  item detail as a right-side panel (record summary card, step progress,
  history list) with buttons Onayla (primary), Reddet, Yetki Devret; reject
  requires a comment, delegate opens the existing `select-user-dialog`.
- **Review logs** page: spec §3.6 with the four filters.
- **Setup**: spec §4.1 list without the marketing banner; create/edit form =
  name, module, trigger, criteria (existing automation criteria editor),
  steps editor, on-approve/on-reject field updates; review process list +
  the §4.2 empty state + form with `review_fields`.
- **Feeds tab** (rail entry "Akışlar" when `features.feeds.view`): composer
  card on top (rich-text editor of Notes with @mention picker), filter strip,
  item cards (avatar, actor, verb line with record link, time, body or change
  list, Beğen / Yorum Yap / like count, inline comment thread). Built from our
  existing tokens and components; "same by eye" parity is checked when the
  reference becomes observable.
- **Record detail**: a "Akışlar" tab beside the Timeline tabs for modules with
  feeds enabled (Deals by default, matching the metadata flag; others via
  module customization later), plus a Follow / Takibi Bırak button in the
  record header overflow menu.
- **Bell panel** in the top bar (ADR 0017 §8 gating applies).

### 9. Tests

- Core unit: step resolution (users/roles/groups/owner-manager), any/all
  rules, delegate, recall, auto-approve, review re-review cycle, lock rule,
  observer ignores seeds/imports/system actor, notification de-dup.
- Integration (Postgres): RLS isolation for every new table, partial unique
  open-request index, append-only history grant, cursor paging.
- Permission paths: non-approver cannot list/decide (404 for detail),
  approver scoped read with hidden field dropped, mention of a user without
  record read gives no notification, record feed hides events of records the
  viewer cannot read.
- e2e: My Jobs empty states and tab switching; a seeded pending approval
  approved end-to-end (record unlocked afterwards); post → comment → like →
  mention shows in the mentioned user's bell.

## Alternatives considered

- **Feed items materialised per user (inbox table)** — rejected for now:
  needs fan-out writes and recalculation on every permission change; read-time
  union over history is enough at our member counts (§3 bound).
- **Approvals as ADR 0013 automation actions** — rejected: approvals hold
  long-lived state, per-user queues and locks; only their field-update effects
  reuse ADR 0013 actions.
- **Storing feed events by copying record history** — rejected: two sources
  of truth and field-security filtering in two places.

## Consequences

- Every record write by a user now passes the approval observer; it must stay
  cheap (active processes cached per org, keyed by a version bumped on process
  writes, as ADR 0017 §5).
- When records move to Postgres, the read-time union becomes a SQL union with
  the same visibility predicate (ADR 0017 §6).
- Open questions kept for later evidence: spec Q1–Q5, Q7, Q8 (real wall
  layout and filters, approval item layout, delegation semantics, feed setup).
