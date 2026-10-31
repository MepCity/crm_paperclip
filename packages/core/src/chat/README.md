# Chat Core Service & HTTP API

Internal messaging backend implementing ADR 0015. All HTTP endpoints are authenticated, same-origin, require `X-CRM-ORG`, and run under `/crm/v2.2/chat`.

## Route Table

| Method | Path | Request Body / Query | Response `data` | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/crm/v2.2/chat/sync` | `?cursor=<bigint>` | `ChatSyncResponse` | Cursor polling. Cursor 0 returns initial state. Updates caller's `last_seen_at` throttled to 15s. |
| `GET` | `/crm/v2.2/chat/conversations` | None | `ChatConversationWire[]` | List visible conversations for the caller, sorted newest first. |
| `POST` | `/crm/v2.2/chat/conversations` | `CreateConversationInput` | `ChatConversationWire` | Create direct (idempotent on `direct_key`), group (2-50 members), or channel. |
| `GET` | `/crm/v2.2/chat/conversations/{id}` | None | `ChatConversationWire` | Get conversation details. Non-members receive 404 (ADR §5). |
| `PATCH` | `/crm/v2.2/chat/conversations/{id}` | `UpdateConversationInput` | `ChatConversationWire` | Rename or archive conversation (owner only). |
| `POST` | `/crm/v2.2/chat/conversations/{id}/members` | `AddMemberInput` | `ChatMemberWire` | Add member (owner only) or join public channel (self). |
| `DELETE` | `/crm/v2.2/chat/conversations/{id}/members/{userId}` | None | `null` (204) | Leave conversation (self) or remove member (owner only). |
| `POST` | `/crm/v2.2/chat/conversations/{id}/read` | `{ seq: number }` | `null` (204) | Advance caller's `last_read_seq` (never moves backwards). |
| `PUT` | `/crm/v2.2/chat/conversations/{id}/pin` | None | `null` (204) | Pin conversation to My Pins. |
| `DELETE` | `/crm/v2.2/chat/conversations/{id}/pin` | None | `null` (204) | Unpin conversation. |
| `GET` | `/crm/v2.2/chat/conversations/{id}/messages` | `?before=<seq>&limit=<n>` | `{ messages: ChatMessageWire[], hasMore: boolean }` | Paged top-level message history (newest first). |
| `POST` | `/crm/v2.2/chat/conversations/{id}/messages` | `PostMessageInput` | `ChatMessageWire` | Post top-level message; bumps `last_seq` and author's read mark atomically. |
| `PATCH` | `/crm/v2.2/chat/messages/{id}` | `UpdateMessageInput` | `ChatMessageWire` | Edit message body/mentions (author only). |
| `DELETE` | `/crm/v2.2/chat/messages/{id}` | None | `null` (204) | Soft delete: clears body and search, sets `deleted_at`. Author or channel owner. |
| `GET` | `/crm/v2.2/chat/messages/{id}/replies` | None | `ChatMessageWire[]` | List replies for thread root `id` in chronological order. |
| `POST` | `/crm/v2.2/chat/messages/{id}/replies` | `PostReplyInput` | `ChatMessageWire` | Post reply to thread root; updates `reply_count`, `last_reply_at`, and author's thread read mark. |
| `POST` | `/crm/v2.2/chat/messages/{id}/thread-read` | None | `null` (204) | Mark thread as read for caller (`last_read_at = now()`). |
| `PUT` | `/crm/v2.2/chat/messages/{id}/star` | None | `null` (204) | Star a message. |
| `DELETE` | `/crm/v2.2/chat/messages/{id}/star` | None | `null` (204) | Unstar a message. |
| `GET` | `/crm/v2.2/chat/starred` | None | `ChatMessageWire[]` | List messages starred by caller. |
| `GET` | `/crm/v2.2/chat/mentions` | None | `ChatMessageWire[]` | List unread and recent mentions of caller across visible chats. |
| `GET` | `/crm/v2.2/chat/threads` | None | `ChatMessageWire[]` | List active thread root messages for caller. |
| `GET` | `/crm/v2.2/chat/contacts` | `?category=frequent\|recent` | `ChatContactWire[]` | List organization contacts ranked by frequency or recency of direct messaging. |
| `GET` | `/crm/v2.2/chat/search` | `?q=...&from=...&in=...&type=...` | `{ messages: ChatMessageWire[], hasMore: boolean }` | Full-text search using `websearch_to_tsquery` and advanced filters across visible chats. |
| `PUT` | `/crm/v2.2/chat/presence` | `{ status: string }` | `null` (204) | Set caller's presence status (`available`, `busy`, `away`, `invisible`). |

## Behavior and Permissions

1. **Storage & Multi-Tenancy**: All tables enforce composite primary keys with `organization_id` first and RLS policy `tenant_isolation`. Foreign keys to `memberships (organization_id, user_id)` ensure data integrity across tenants.
2. **Access Control**: Non-members accessing private channels or direct/group conversations receive 404 (never 403). Public channels are visible to all organization members and joinable.
3. **Atomic Writing**: Message insert, conversation `last_seq` bump, and author `last_read_seq` advance execute in a single serializing transaction.
4. **Presence**: `invisible` users appear as `offline` to others. Active presence is considered offline if `last_seen_at` is older than 60 seconds.
5. **Idempotency**: Creating writes support optional `clientId` (UUID) for safe retries without duplication. Direct chat creation is idempotent on `direct_key`.
