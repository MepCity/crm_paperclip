# ADR 0015 — Internal chat panel

- Status: Accepted (CTO, 2026-10-31)
- Issue: MEP-1414 (parent MEP-1412); research MEP-1413,
  `research/specs/chat-module.md`
- Scope: storage, delivery, unread, presence, permissions, search and the
  product decisions for flows the research could not observe

## Context

The board asked for the reference CRM's bottom-bar chat: My Pins, Chats,
Channels, Threads and Contacts, between users of one organization. The research
captured 64 controls, mostly empty states; populated conversations, channels,
threads, the composer and every write flow stay unobserved (spec, "Open
questions"). The app must run on the local preview (one long-lived Node
process) and on the hosted test site (serverless functions, several instances,
no shared memory). Users, organizations, memberships and invitations already
live in Postgres; ADR 0012 governs tenant keys, RLS and forward-only migrations.

## Decision

### 1. Storage: Postgres, one migration

Chat is persistent from day one (process-local state like mail staging would
lose messages and break on several serverless instances). One migration
`0007_chat.sql` adds the tables below, following ADR 0012 §2: every table has
`organization_id` first in its primary key, composite foreign keys, RLS policy
`tenant_isolation` as in `0006_definition_stores.sql`, grants to `crm_app`
limited to what the service uses. User references are composite foreign keys
to `memberships (organization_id, user_id)`.

| Table | Key columns (all also `organization_id`) |
| --- | --- |
| `chat_conversations` | `id`, `kind` (`direct`, `group`, `channel`), `name` (null for direct; 1–80 chars otherwise), `visibility` (`public`, `private`; channels only), `direct_key` (sorted pair of user ids, unique per org, direct only), `created_by`, `created_at`, `last_seq int` (per-conversation message counter), `last_message_at`, `archived_at`, `changed_seq bigint` |
| `chat_members` | PK `(organization_id, conversation_id, user_id)`; `role` (`owner`, `member`), `joined_at`, `left_at`, `last_read_seq int`, `pinned_at` (My Pins), `changed_seq` |
| `chat_messages` | `id`, `conversation_id`, `seq int` (unique per conversation, top-level messages only), `thread_root_id` (null for top-level), `author_user_id`, `body text` (1–10 000 chars), `mentions uuid[]`, `reply_count int`, `last_reply_at`, `edited_at`, `deleted_at`, `created_at`, `changed_seq`; generated `search tsvector` = `to_tsvector('simple', body)` with a GIN index |
| `chat_thread_reads` | PK `(organization_id, thread_root_id, user_id)`; `last_read_at`, `changed_seq` — a row exists once the user posts in, opens or is mentioned in a thread (the user's Threads list) |
| `chat_stars` | PK `(organization_id, user_id, message_id)`; `created_at` |
| `chat_presence` | PK `(organization_id, user_id)`; `status` (`available`, `busy`, `away`, `invisible`), `last_seen_at` |

`changed_seq` takes `nextval('chat_change_seq')` (one global sequence) on every
insert or update of a row a client must see. The value only orders changes; it
reveals nothing across tenants because rows are still read through tenant and
membership predicates. A message insert, the `last_seq` bump and the author's
`last_read_seq` run in one transaction (`UPDATE … SET last_seq = last_seq + 1
RETURNING last_seq` serializes writers per conversation). Delete is soft:
`deleted_at` set, `body` replaced by an empty string, `search` empty.

### 2. Real-time delivery: cursor polling

The client polls `GET /crm/v2.2/chat/sync?cursor=<changed_seq>`: every 3 s
while the panel is open and the tab visible, every 20 s otherwise (badges and
presence), and immediately after the user's own write. The response holds
every conversation, membership, message, thread-read and presence change the
user may see with `changed_seq > cursor` (max 200 rows, `hasMore` for the next
page) and the new cursor. Cursor `0` returns the panel's initial state.

SSE and WebSocket are rejected for now: serverless instances on the hosted site
cannot hold long connections or share an in-memory fan-out, and adding a
broker (Redis, a hosted push service) is a paid/external dependency. The cursor
contract stays valid if an SSE "something changed" ping is added later; that
needs a new ADR revision, not a client rewrite.

### 3. Unread counters

Unread for a conversation = `last_seq − last_read_seq` of the caller's
membership (top-level messages only; the caller's own messages advance their
`last_read_seq`). Opening a conversation at the bottom calls
`POST /chat/conversations/{id}/read { seq }` (never moves backwards). A thread
is unread when `last_reply_at > last_read_at` in `chat_thread_reads`. Footer and
tab badges are sums computed by the server in `sync`. Mentions of the caller
are read state of their message, not a separate counter.

### 4. Presence

`sync` updates the caller's `last_seen_at` (at most once per 15 s per user).
Shown state: `invisible` is shown to others as offline; otherwise the stored
status when `last_seen_at` is under 60 s old, else offline. The header status
menu offers Available, Busy, Away, Invisible (the reference shows Available
and a caret; the other options are our decision). Typing indicators and read
receipts are out of scope.

### 5. Permissions

Every route goes through `apiRoute` (session, same-origin writes,
`X-CRM-ORG`, `OrgContext` from membership). Inside the organization:

- Any member may open a direct conversation with any other member, create a
  group (2–50 other members) or a channel, star messages and pin conversations.
- Public channels are visible to every member and joinable; private channels
  and all direct/group conversations are visible only to current members
  (`left_at is null`). A non-member gets `404`, never `403`.
- Only the author edits or deletes a message; channel owners may also delete.
  Channel owners rename, change members and archive. Direct conversations have
  no owner and no member changes.
- A user removed from the organization keeps authored messages (author shown
  by stored name); their memberships stop granting access because the
  membership foreign key is checked through `memberships`.
- Invite People reuses the existing organization invitation flow and its admin
  permission; chat adds no new invitation table or e-mail path.

### 6. Search

`GET /crm/v2.2/chat/search` uses `search @@ websearch_to_tsquery('simple', q)`
plus the advanced filters of spec controls 46–53 (from user, in conversation,
date range, conversation type, contains link/mention), restricted to the
caller's visible conversations, newest first, 50 per page. The panel search box
(control 8) filters conversation and member names client-side and offers
"Invite <email>" when the text is an e-mail address of a non-member. Files and
bot messages are out of scope: those filter controls are hidden, not disabled.

### 7. Product decisions for unobserved flows

Recorded as decisions, not parity findings (spec, open questions 1–6):

1. Footer: five entries — My Pins, Chats, Channels, Threads, Contacts (board
   scope; the reference session showed three).
2. Quick Actions: Send a Direct Message, Start a Group Conversation, Create a
   Channel, Invite People. Call, meeting, live-event items and the external
   service notice are omitted.
3. Composer: plain text, Enter sends, Shift+Enter new line, `@` opens a member
   picker that fills `mentions`; links are auto-linked on render. No files,
   reactions or formatting in this feature.
4. Message actions on hover: Reply in thread, Star, Edit and Delete (own),
   Copy text. Edited messages show "(edited)".
5. Maximize (control 6) widens the panel to a centered large view; the state
   lives in component state only, not a stored preference.
6. Message history pages backwards 50 at a time via
   `GET /chat/conversations/{id}/messages?before=<seq>`.

### 8. API surface (base `/crm/v2.2/chat`)

`GET sync`; `GET|POST conversations`; `GET|PATCH conversations/{id}`;
`POST conversations/{id}/members`, `DELETE conversations/{id}/members/{userId}`
(leave = own id); `POST conversations/{id}/read`; `PUT|DELETE
conversations/{id}/pin`; `GET|POST conversations/{id}/messages`;
`PATCH|DELETE messages/{id}`; `GET|POST messages/{id}/replies`;
`POST messages/{id}/thread-read`; `PUT|DELETE messages/{id}/star`;
`GET starred`; `GET mentions`; `GET threads`; `GET contacts?category=frequent|recent`;
`GET search`; `PUT presence { status }`. Error bodies use the shared wire codec.
Writes that create rows accept an optional `clientId` (UUID) for idempotent
retry. The wire types live in one file, `apps/web/src/lib/api/wire/chat.ts`,
owned by the backend issue; the UI imports them.

## Consequences

- Messages survive restarts and work across serverless instances; the cost is
  up to one small query every 3 s per open panel — acceptable for an internal
  tool with a handful of users.
- Delivery latency is up to 3 s; good enough for the board's use, revisitable.
- Open: whether the reference's channel creation and thread screens look like
  our design; the final side-by-side QA records differences as follow-ups.
