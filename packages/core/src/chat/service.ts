import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors";
import { withOrg } from "../tenancy";
import type { OrgContext } from "../tenancy/types";
import type {
  ChatBadges,
  ChatChannelVisibility,
  ChatContact,
  ChatConversation,
  ChatConversationKind,
  ChatMember,
  ChatMemberRole,
  ChatMessage,
  ChatPresence,
  ChatPresenceDisplayStatus,
  ChatPresenceStatus,
  ChatSearchParams,
  ChatSyncResult,
  ChatThreadRead,
  CreateConversationParams,
  PostMessageParams,
  PostReplyParams,
  UpdateConversationParams,
  UpdateMessageParams,
} from "./types";

function toDate(val: unknown): Date {
  return val instanceof Date ? val : new Date(String(val));
}

function toNullableDate(val: unknown): Date | null {
  if (val === null || val === undefined) return null;
  return toDate(val);
}

function mapConversation(row: Record<string, unknown>): ChatConversation {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    kind: row.kind as ChatConversationKind,
    name: row.name ? String(row.name) : null,
    visibility: (row.visibility as ChatChannelVisibility) ?? null,
    directKey: row.direct_key ? String(row.direct_key) : null,
    createdBy: String(row.created_by),
    createdAt: toDate(row.created_at),
    lastSeq: Number(row.last_seq ?? 0),
    lastMessageAt: toNullableDate(row.last_message_at),
    archivedAt: toNullableDate(row.archived_at),
    changedSeq: Number(row.changed_seq ?? 0),
    unreadCount: row.unread_count !== undefined ? Number(row.unread_count) : undefined,
    pinnedAt: row.pinned_at !== undefined ? toNullableDate(row.pinned_at) : undefined,
    lastReadSeq: row.last_read_seq !== undefined ? Number(row.last_read_seq) : undefined,
    membershipRole: (row.membership_role as ChatMemberRole) ?? null,
  };
}

function mapMember(row: Record<string, unknown>): ChatMember {
  return {
    organizationId: String(row.organization_id),
    conversationId: String(row.conversation_id),
    userId: String(row.user_id),
    role: row.role as ChatMemberRole,
    joinedAt: toDate(row.joined_at),
    leftAt: toNullableDate(row.left_at),
    lastReadSeq: Number(row.last_read_seq ?? 0),
    pinnedAt: toNullableDate(row.pinned_at),
    changedSeq: Number(row.changed_seq ?? 0),
    userName: row.user_name ? String(row.user_name) : undefined,
    userEmail: row.user_email ? String(row.user_email) : undefined,
  };
}

function mapMessage(row: Record<string, unknown>): ChatMessage {
  const mentionsRaw = row.mentions;
  let mentions: string[] = [];
  if (Array.isArray(mentionsRaw)) {
    mentions = mentionsRaw.map(String);
  } else if (typeof mentionsRaw === "string") {
    // Postgres array literal format "{uuid1,uuid2}"
    const cleaned = mentionsRaw.replace(/^\{|\}$/g, "");
    mentions = cleaned.length ? cleaned.split(",").map((s) => s.trim()) : [];
  }

  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    conversationId: String(row.conversation_id),
    seq: row.seq !== null && row.seq !== undefined ? Number(row.seq) : null,
    threadRootId: row.thread_root_id ? String(row.thread_root_id) : null,
    authorUserId: String(row.author_user_id),
    authorName: row.author_name ? String(row.author_name) : undefined,
    body: String(row.body ?? ""),
    mentions,
    replyCount: Number(row.reply_count ?? 0),
    lastReplyAt: toNullableDate(row.last_reply_at),
    editedAt: toNullableDate(row.edited_at),
    deletedAt: toNullableDate(row.deleted_at),
    createdAt: toDate(row.created_at),
    changedSeq: Number(row.changed_seq ?? 0),
    starred: row.starred !== undefined ? Boolean(row.starred) : undefined,
  };
}

function computeDisplayPresence(
  status: string,
  lastSeenAt: Date,
  isSelf: boolean,
): ChatPresenceDisplayStatus {
  const diffSec = (Date.now() - lastSeenAt.getTime()) / 1000;
  if (status === "invisible") {
    return isSelf ? "invisible" : "offline";
  }
  if (diffSec > 60) {
    return "offline";
  }
  return status as ChatPresenceDisplayStatus;
}

export class ChatService {
  async createConversation(
    ctx: OrgContext,
    input: CreateConversationParams,
  ): Promise<ChatConversation> {
    return withOrg(ctx, async (tx) => {
      if (input.clientId) {
        const existing = await tx.execute(
          sql`SELECT * FROM chat_conversations WHERE organization_id = ${ctx.orgId} AND id = ${input.clientId}`,
        );
        if (existing.rows.length > 0) {
          return mapConversation(existing.rows[0] as Record<string, unknown>);
        }
      }

      if (input.kind === "direct") {
        if (!input.userId) {
          throw new ValidationError({ userId: ["Target user is required for direct chat."] });
        }
        if (input.userId === ctx.userId) {
          throw new ValidationError({
            userId: ["Cannot create a direct conversation with yourself."],
          });
        }

        // Verify target user is in memberships
        const memberCheck = await tx.execute(
          sql`SELECT user_id FROM memberships WHERE organization_id = ${ctx.orgId} AND user_id = ${input.userId}`,
        );
        if (memberCheck.rows.length === 0) {
          throw new NotFoundError("Target user is not a member of this organization.");
        }

        const sorted = [ctx.userId, input.userId].sort();
        const directKey = `${sorted[0]}:${sorted[1]}`;

        // Check if direct conversation already exists
        const existingDirect = await tx.execute(
          sql`SELECT * FROM chat_conversations WHERE organization_id = ${ctx.orgId} AND direct_key = ${directKey}`,
        );
        if (existingDirect.rows.length > 0) {
          return mapConversation(existingDirect.rows[0] as Record<string, unknown>);
        }

        const id = input.clientId ?? randomUUID();
        const insertRes = await tx.execute(
          sql`INSERT INTO chat_conversations (
            organization_id, id, kind, direct_key, created_by
          ) VALUES (
            ${ctx.orgId}, ${id}, 'direct', ${directKey}, ${ctx.userId}
          ) RETURNING *`,
        );

        // Add both members
        await tx.execute(
          sql`INSERT INTO chat_members (organization_id, conversation_id, user_id, role)
          VALUES
            (${ctx.orgId}, ${id}, ${ctx.userId}, 'member'),
            (${ctx.orgId}, ${id}, ${input.userId}, 'member')
          ON CONFLICT (organization_id, conversation_id, user_id) DO NOTHING`,
        );

        return mapConversation(insertRes.rows[0] as Record<string, unknown>);
      }

      if (input.kind === "group") {
        if (!input.name?.trim()) {
          throw new ValidationError({ name: ["Group name is required."] });
        }
        const memberUserIds = input.memberUserIds ?? [];
        if (memberUserIds.length < 2 || memberUserIds.length > 50) {
          throw new ValidationError({
            memberUserIds: ["Group requires between 2 and 50 other members."],
          });
        }

        // Validate members exist
        const uniqueMembers = Array.from(new Set(memberUserIds.filter((u) => u !== ctx.userId)));
        const targetMembers = await tx.execute(
          sql`SELECT user_id FROM memberships WHERE organization_id = ${ctx.orgId} AND user_id IN ${uniqueMembers}`,
        );
        if (targetMembers.rows.length !== uniqueMembers.length) {
          throw new ValidationError({
            memberUserIds: ["One or more selected users are not members."],
          });
        }

        const id = input.clientId ?? randomUUID();
        const insertRes = await tx.execute(
          sql`INSERT INTO chat_conversations (
            organization_id, id, kind, name, created_by
          ) VALUES (
            ${ctx.orgId}, ${id}, 'group', ${input.name.trim()}, ${ctx.userId}
          ) RETURNING *`,
        );

        // Add creator as owner
        await tx.execute(
          sql`INSERT INTO chat_members (organization_id, conversation_id, user_id, role)
          VALUES (${ctx.orgId}, ${id}, ${ctx.userId}, 'owner')`,
        );

        // Add other members
        for (const uid of uniqueMembers) {
          await tx.execute(
            sql`INSERT INTO chat_members (organization_id, conversation_id, user_id, role)
            VALUES (${ctx.orgId}, ${id}, ${uid}, 'member')`,
          );
        }

        return mapConversation(insertRes.rows[0] as Record<string, unknown>);
      }

      if (input.kind === "channel") {
        if (!input.name?.trim()) {
          throw new ValidationError({ name: ["Channel name is required."] });
        }
        if (!input.visibility || !["public", "private"].includes(input.visibility)) {
          throw new ValidationError({
            visibility: ["Channel visibility must be public or private."],
          });
        }

        const id = input.clientId ?? randomUUID();
        const insertRes = await tx.execute(
          sql`INSERT INTO chat_conversations (
            organization_id, id, kind, name, visibility, created_by
          ) VALUES (
            ${ctx.orgId}, ${id}, 'channel', ${input.name.trim()}, ${input.visibility}, ${ctx.userId}
          ) RETURNING *`,
        );

        // Add creator as owner
        await tx.execute(
          sql`INSERT INTO chat_members (organization_id, conversation_id, user_id, role)
          VALUES (${ctx.orgId}, ${id}, ${ctx.userId}, 'owner')`,
        );

        // Optionally add initial members if provided
        if (input.memberUserIds && input.memberUserIds.length > 0) {
          const uniqueMembers = Array.from(
            new Set(input.memberUserIds.filter((u) => u !== ctx.userId)),
          );
          for (const uid of uniqueMembers) {
            await tx.execute(
              sql`INSERT INTO chat_members (organization_id, conversation_id, user_id, role)
              VALUES (${ctx.orgId}, ${id}, ${uid}, 'member')
              ON CONFLICT (organization_id, conversation_id, user_id) DO NOTHING`,
            );
          }
        }

        return mapConversation(insertRes.rows[0] as Record<string, unknown>);
      }

      throw new ValidationError({ kind: ["Invalid conversation kind."] });
    });
  }

  async getConversation(ctx: OrgContext, conversationId: string): Promise<ChatConversation> {
    return withOrg(ctx, async (tx) => {
      const res = await tx.execute(
        sql`SELECT c.*,
          m.role as membership_role,
          m.last_read_seq,
          m.pinned_at,
          m.left_at,
          GREATEST(c.last_seq - COALESCE(m.last_read_seq, 0), 0) as unread_count
        FROM chat_conversations c
        LEFT JOIN chat_members m
          ON m.organization_id = c.organization_id
          AND m.conversation_id = c.id
          AND m.user_id = ${ctx.userId}
        WHERE c.organization_id = ${ctx.orgId} AND c.id = ${conversationId}`,
      );

      if (res.rows.length === 0) {
        throw new NotFoundError();
      }

      const row = res.rows[0] as Record<string, unknown>;
      const isPublicChannel = row.kind === "channel" && row.visibility === "public";
      const isCurrentMember = row.membership_role && row.left_at === null;

      if (!isPublicChannel && !isCurrentMember) {
        throw new NotFoundError();
      }

      return mapConversation(row);
    });
  }

  async listConversations(ctx: OrgContext): Promise<ChatConversation[]> {
    return withOrg(ctx, async (tx) => {
      const res = await tx.execute(
        sql`SELECT c.*,
          m.role as membership_role,
          m.last_read_seq,
          m.pinned_at,
          GREATEST(c.last_seq - COALESCE(m.last_read_seq, 0), 0) as unread_count
        FROM chat_conversations c
        LEFT JOIN chat_members m
          ON m.organization_id = c.organization_id
          AND m.conversation_id = c.id
          AND m.user_id = ${ctx.userId}
        WHERE c.organization_id = ${ctx.orgId}
          AND ((m.user_id IS NOT NULL AND m.left_at IS NULL) OR (c.kind = 'channel' AND c.visibility = 'public'))
        ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
      );

      return res.rows.map((r) => mapConversation(r as Record<string, unknown>));
    });
  }

  async updateConversation(
    ctx: OrgContext,
    conversationId: string,
    input: UpdateConversationParams,
  ): Promise<ChatConversation> {
    return withOrg(ctx, async (tx) => {
      const conv = await this.getConversation(ctx, conversationId);

      if (conv.kind === "direct") {
        throw new ForbiddenError("Direct conversations cannot be updated.");
      }

      // Check owner permission for channel or group
      const memberCheck = await tx.execute(
        sql`SELECT role, left_at FROM chat_members
        WHERE organization_id = ${ctx.orgId} AND conversation_id = ${conversationId} AND user_id = ${ctx.userId}`,
      );
      if (memberCheck.rows.length === 0 || memberCheck.rows[0]?.left_at !== null) {
        throw new NotFoundError();
      }
      if (memberCheck.rows[0]?.role !== "owner") {
        throw new ForbiddenError("Only conversation owners can update conversation settings.");
      }

      const updates: ReturnType<typeof sql>[] = [sql`changed_seq = nextval('chat_change_seq')`];
      if (input.name !== undefined) {
        if (!input.name.trim()) throw new ValidationError({ name: ["Name cannot be blank."] });
        updates.push(sql`name = ${input.name.trim()}`);
      }
      if (input.archived !== undefined) {
        updates.push(sql`archived_at = ${input.archived ? sql`now()` : sql`NULL`}`);
      }

      const res = await tx.execute(
        sql`UPDATE chat_conversations
        SET ${sql.join(updates, sql`, `)}
        WHERE organization_id = ${ctx.orgId} AND id = ${conversationId}
        RETURNING *`,
      );

      return mapConversation(res.rows[0] as Record<string, unknown>);
    });
  }

  async addMember(
    ctx: OrgContext,
    conversationId: string,
    input: { userId: string; role?: ChatMemberRole },
  ): Promise<ChatMember> {
    return withOrg(ctx, async (tx) => {
      const conv = await this.getConversation(ctx, conversationId);
      if (conv.kind === "direct") {
        throw new ForbiddenError("Cannot add members to a direct conversation.");
      }

      // If public channel and adding oneself -> join channel!
      const isSelfJoin =
        conv.kind === "channel" && conv.visibility === "public" && input.userId === ctx.userId;

      if (!isSelfJoin) {
        // Must be owner to add members
        const ownerCheck = await tx.execute(
          sql`SELECT role, left_at FROM chat_members
          WHERE organization_id = ${ctx.orgId} AND conversation_id = ${conversationId} AND user_id = ${ctx.userId}`,
        );
        if (ownerCheck.rows.length === 0 || ownerCheck.rows[0]?.left_at !== null) {
          throw new NotFoundError();
        }
        if (ownerCheck.rows[0]?.role !== "owner") {
          throw new ForbiddenError("Only owners can add members.");
        }
      }

      // Verify target user is in org
      const userCheck = await tx.execute(
        sql`SELECT m.user_id, u.name, u.email FROM memberships m
        JOIN users u ON u.id = m.user_id
        WHERE m.organization_id = ${ctx.orgId} AND m.user_id = ${input.userId}`,
      );
      if (userCheck.rows.length === 0) {
        throw new NotFoundError("User is not an active member of this organization.");
      }

      const role = input.role ?? "member";
      const res = await tx.execute(
        sql`INSERT INTO chat_members (
          organization_id, conversation_id, user_id, role, joined_at, left_at, changed_seq
        ) VALUES (
          ${ctx.orgId}, ${conversationId}, ${input.userId}, ${role}, now(), NULL, nextval('chat_change_seq')
        )
        ON CONFLICT (organization_id, conversation_id, user_id) DO UPDATE
        SET role = EXCLUDED.role, left_at = NULL, joined_at = now(), changed_seq = nextval('chat_change_seq')
        RETURNING *`,
      );

      const member = mapMember(res.rows[0] as Record<string, unknown>);
      member.userName = String(userCheck.rows[0]?.name ?? "");
      member.userEmail = String(userCheck.rows[0]?.email ?? "");
      return member;
    });
  }

  async removeMember(ctx: OrgContext, conversationId: string, targetUserId: string): Promise<void> {
    return withOrg(ctx, async (tx) => {
      const conv = await this.getConversation(ctx, conversationId);
      if (conv.kind === "direct") {
        throw new ForbiddenError("Cannot remove members from a direct conversation.");
      }

      const isLeaving = targetUserId === ctx.userId;
      if (!isLeaving) {
        const callerMember = await tx.execute(
          sql`SELECT role, left_at FROM chat_members
          WHERE organization_id = ${ctx.orgId} AND conversation_id = ${conversationId} AND user_id = ${ctx.userId}`,
        );
        if (callerMember.rows.length === 0 || callerMember.rows[0]?.left_at !== null) {
          throw new NotFoundError();
        }
        if (callerMember.rows[0]?.role !== "owner") {
          throw new ForbiddenError("Only owners can remove other members.");
        }
      }

      const updateRes = await tx.execute(
        sql`UPDATE chat_members
        SET left_at = now(), changed_seq = nextval('chat_change_seq')
        WHERE organization_id = ${ctx.orgId}
          AND conversation_id = ${conversationId}
          AND user_id = ${targetUserId}
          AND left_at IS NULL
        RETURNING user_id`,
      );

      if (updateRes.rows.length === 0) {
        throw new NotFoundError();
      }
    });
  }

  async markConversationRead(ctx: OrgContext, conversationId: string, seq: number): Promise<void> {
    return withOrg(ctx, async (tx) => {
      const res = await tx.execute(
        sql`UPDATE chat_members
        SET last_read_seq = GREATEST(last_read_seq, ${seq}),
            changed_seq = nextval('chat_change_seq')
        WHERE organization_id = ${ctx.orgId}
          AND conversation_id = ${conversationId}
          AND user_id = ${ctx.userId}
          AND left_at IS NULL
        RETURNING last_read_seq`,
      );

      if (res.rows.length === 0) {
        throw new NotFoundError();
      }
    });
  }

  async pinConversation(ctx: OrgContext, conversationId: string, pin: boolean): Promise<void> {
    return withOrg(ctx, async (tx) => {
      const res = await tx.execute(
        sql`UPDATE chat_members
        SET pinned_at = ${pin ? sql`now()` : sql`NULL`},
            changed_seq = nextval('chat_change_seq')
        WHERE organization_id = ${ctx.orgId}
          AND conversation_id = ${conversationId}
          AND user_id = ${ctx.userId}
          AND left_at IS NULL
        RETURNING pinned_at`,
      );

      if (res.rows.length === 0) {
        throw new NotFoundError();
      }
    });
  }

  async postMessage(
    ctx: OrgContext,
    conversationId: string,
    input: PostMessageParams,
  ): Promise<ChatMessage> {
    return withOrg(ctx, async (tx) => {
      if (input.clientId) {
        const existing = await tx.execute(
          sql`SELECT m.*, u.name as author_name
          FROM chat_messages m
          LEFT JOIN users u ON u.id = m.author_user_id
          WHERE m.organization_id = ${ctx.orgId} AND m.id = ${input.clientId}`,
        );
        if (existing.rows.length > 0) {
          return mapMessage(existing.rows[0] as Record<string, unknown>);
        }
      }

      // Check member access (must be active member to post)
      const member = await tx.execute(
        sql`SELECT role, left_at FROM chat_members
        WHERE organization_id = ${ctx.orgId}
          AND conversation_id = ${conversationId}
          AND user_id = ${ctx.userId}`,
      );
      if (member.rows.length === 0 || member.rows[0]?.left_at !== null) {
        throw new NotFoundError();
      }

      const body = input.body.trim();
      if (!body) {
        throw new ValidationError({ body: ["Message body cannot be empty."] });
      }

      // Lock & bump last_seq on conversation
      const bumpRes = await tx.execute(
        sql`UPDATE chat_conversations
        SET last_seq = last_seq + 1,
            last_message_at = now(),
            changed_seq = nextval('chat_change_seq')
        WHERE organization_id = ${ctx.orgId} AND id = ${conversationId}
        RETURNING last_seq`,
      );
      if (bumpRes.rows.length === 0) {
        throw new NotFoundError();
      }
      const newSeq = Number(bumpRes.rows[0]?.last_seq);

      const msgId = input.clientId ?? randomUUID();
      const mentionsArray =
        input.mentions && input.mentions.length > 0
          ? sql`ARRAY[${sql.join(
              input.mentions.map((id) => sql`${id}::uuid`),
              sql`, `,
            )}]`
          : sql`'{}'::uuid[]`;

      const msgRes = await tx.execute(
        sql`INSERT INTO chat_messages (
          organization_id, id, conversation_id, seq, thread_root_id, author_user_id, body, mentions
        ) VALUES (
          ${ctx.orgId}, ${msgId}, ${conversationId}, ${newSeq}, NULL, ${ctx.userId}, ${body}, ${mentionsArray}
        ) RETURNING *`,
      );

      // Advance author's read marker
      await tx.execute(
        sql`UPDATE chat_members
        SET last_read_seq = GREATEST(last_read_seq, ${newSeq}),
            changed_seq = nextval('chat_change_seq')
        WHERE organization_id = ${ctx.orgId}
          AND conversation_id = ${conversationId}
          AND user_id = ${ctx.userId}`,
      );

      // Get author name
      const authorRes = await tx.execute(sql`SELECT name FROM users WHERE id = ${ctx.userId}`);
      const msg = mapMessage(msgRes.rows[0] as Record<string, unknown>);
      msg.authorName = String(authorRes.rows[0]?.name ?? "");
      return msg;
    });
  }

  async getMessages(
    ctx: OrgContext,
    conversationId: string,
    options: { before?: number; limit?: number } = {},
  ): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
    return withOrg(ctx, async (tx) => {
      // Access check
      await this.getConversation(ctx, conversationId);

      const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
      const conditions: ReturnType<typeof sql>[] = [
        sql`m.organization_id = ${ctx.orgId}`,
        sql`m.conversation_id = ${conversationId}`,
        sql`m.thread_root_id IS NULL`,
      ];

      if (options.before !== undefined) {
        conditions.push(sql`m.seq < ${options.before}`);
      }

      const res = await tx.execute(
        sql`SELECT m.*, u.name as author_name,
          EXISTS(
            SELECT 1 FROM chat_stars s
            WHERE s.organization_id = m.organization_id
              AND s.message_id = m.id
              AND s.user_id = ${ctx.userId}
          ) as starred
        FROM chat_messages m
        LEFT JOIN users u ON u.id = m.author_user_id
        WHERE ${sql.join(conditions, sql` AND `)}
        ORDER BY m.seq DESC
        LIMIT ${limit + 1}`,
      );

      const hasMore = res.rows.length > limit;
      const rows = hasMore ? res.rows.slice(0, limit) : res.rows;
      return {
        messages: rows.map((r) => mapMessage(r as Record<string, unknown>)),
        hasMore,
      };
    });
  }

  async editMessage(
    ctx: OrgContext,
    messageId: string,
    input: UpdateMessageParams,
  ): Promise<ChatMessage> {
    return withOrg(ctx, async (tx) => {
      const msgCheck = await tx.execute(
        sql`SELECT m.*, c.kind, c.visibility FROM chat_messages m
        JOIN chat_conversations c ON c.id = m.conversation_id AND c.organization_id = m.organization_id
        WHERE m.organization_id = ${ctx.orgId} AND m.id = ${messageId}`,
      );
      if (msgCheck.rows.length === 0) {
        throw new NotFoundError();
      }

      const row = msgCheck.rows[0] as Record<string, unknown>;
      // Verify caller is active member
      const memberCheck = await tx.execute(
        sql`SELECT role, left_at FROM chat_members
        WHERE organization_id = ${ctx.orgId} AND conversation_id = ${row.conversation_id} AND user_id = ${ctx.userId}`,
      );
      if (memberCheck.rows.length === 0 || memberCheck.rows[0]?.left_at !== null) {
        throw new NotFoundError();
      }

      if (row.author_user_id !== ctx.userId) {
        throw new ForbiddenError("Only the author can edit a message.");
      }

      if (row.deleted_at !== null) {
        throw new ValidationError({ body: ["Cannot edit a deleted message."] });
      }

      const body = input.body.trim();
      if (!body) {
        throw new ValidationError({ body: ["Message body cannot be empty."] });
      }

      const updates: ReturnType<typeof sql>[] = [
        sql`body = ${body}`,
        sql`edited_at = now()`,
        sql`changed_seq = nextval('chat_change_seq')`,
      ];

      if (input.mentions !== undefined) {
        const mentionsArray =
          input.mentions.length > 0
            ? sql`ARRAY[${sql.join(
                input.mentions.map((id) => sql`${id}::uuid`),
                sql`, `,
              )}]`
            : sql`'{}'::uuid[]`;
        updates.push(sql`mentions = ${mentionsArray}`);
      }

      const updateRes = await tx.execute(
        sql`UPDATE chat_messages
        SET ${sql.join(updates, sql`, `)}
        WHERE organization_id = ${ctx.orgId} AND id = ${messageId}
        RETURNING *`,
      );

      const authorRes = await tx.execute(sql`SELECT name FROM users WHERE id = ${ctx.userId}`);
      const msg = mapMessage(updateRes.rows[0] as Record<string, unknown>);
      msg.authorName = String(authorRes.rows[0]?.name ?? "");
      return msg;
    });
  }

  async deleteMessage(ctx: OrgContext, messageId: string): Promise<void> {
    return withOrg(ctx, async (tx) => {
      const msgCheck = await tx.execute(
        sql`SELECT m.*, c.kind FROM chat_messages m
        JOIN chat_conversations c ON c.id = m.conversation_id AND c.organization_id = m.organization_id
        WHERE m.organization_id = ${ctx.orgId} AND m.id = ${messageId}`,
      );
      if (msgCheck.rows.length === 0) {
        throw new NotFoundError();
      }

      const row = msgCheck.rows[0] as Record<string, unknown>;
      const memberCheck = await tx.execute(
        sql`SELECT role, left_at FROM chat_members
        WHERE organization_id = ${ctx.orgId} AND conversation_id = ${row.conversation_id} AND user_id = ${ctx.userId}`,
      );
      if (memberCheck.rows.length === 0 || memberCheck.rows[0]?.left_at !== null) {
        throw new NotFoundError();
      }

      const isAuthor = row.author_user_id === ctx.userId;
      const isOwner = memberCheck.rows[0]?.role === "owner";

      if (!isAuthor && !isOwner) {
        throw new ForbiddenError("Only the author or conversation owner can delete a message.");
      }

      await tx.execute(
        sql`UPDATE chat_messages
        SET deleted_at = now(),
            body = '',
            changed_seq = nextval('chat_change_seq')
        WHERE organization_id = ${ctx.orgId} AND id = ${messageId}`,
      );
    });
  }

  async postReply(
    ctx: OrgContext,
    messageId: string,
    input: PostReplyParams,
  ): Promise<ChatMessage> {
    return withOrg(ctx, async (tx) => {
      if (input.clientId) {
        const existing = await tx.execute(
          sql`SELECT m.*, u.name as author_name
          FROM chat_messages m
          LEFT JOIN users u ON u.id = m.author_user_id
          WHERE m.organization_id = ${ctx.orgId} AND m.id = ${input.clientId}`,
        );
        if (existing.rows.length > 0) {
          return mapMessage(existing.rows[0] as Record<string, unknown>);
        }
      }

      const rootCheck = await tx.execute(
        sql`SELECT * FROM chat_messages
        WHERE organization_id = ${ctx.orgId} AND id = ${messageId} AND thread_root_id IS NULL`,
      );
      if (rootCheck.rows.length === 0) {
        throw new NotFoundError("Thread root message not found.");
      }
      const root = rootCheck.rows[0] as Record<string, unknown>;

      const member = await tx.execute(
        sql`SELECT role, left_at FROM chat_members
        WHERE organization_id = ${ctx.orgId}
          AND conversation_id = ${root.conversation_id}
          AND user_id = ${ctx.userId}`,
      );
      if (member.rows.length === 0 || member.rows[0]?.left_at !== null) {
        throw new NotFoundError();
      }

      const body = input.body.trim();
      if (!body) {
        throw new ValidationError({ body: ["Reply body cannot be empty."] });
      }

      const replyId = input.clientId ?? randomUUID();
      const mentionsArray =
        input.mentions && input.mentions.length > 0
          ? sql`ARRAY[${sql.join(
              input.mentions.map((id) => sql`${id}::uuid`),
              sql`, `,
            )}]`
          : sql`'{}'::uuid[]`;

      const replyRes = await tx.execute(
        sql`INSERT INTO chat_messages (
          organization_id, id, conversation_id, seq, thread_root_id, author_user_id, body, mentions
        ) VALUES (
          ${ctx.orgId}, ${replyId}, ${root.conversation_id}, NULL, ${messageId}, ${ctx.userId}, ${body}, ${mentionsArray}
        ) RETURNING *`,
      );

      // Bump reply count & last_reply_at on root message
      await tx.execute(
        sql`UPDATE chat_messages
        SET reply_count = reply_count + 1,
            last_reply_at = now(),
            changed_seq = nextval('chat_change_seq')
        WHERE organization_id = ${ctx.orgId} AND id = ${messageId}`,
      );

      // Record caller's thread read
      await tx.execute(
        sql`INSERT INTO chat_thread_reads (
          organization_id, thread_root_id, user_id, last_read_at, changed_seq
        ) VALUES (
          ${ctx.orgId}, ${messageId}, ${ctx.userId}, now(), nextval('chat_change_seq')
        )
        ON CONFLICT (organization_id, thread_root_id, user_id) DO UPDATE
        SET last_read_at = now(), changed_seq = nextval('chat_change_seq')`,
      );

      const authorRes = await tx.execute(sql`SELECT name FROM users WHERE id = ${ctx.userId}`);
      const msg = mapMessage(replyRes.rows[0] as Record<string, unknown>);
      msg.authorName = String(authorRes.rows[0]?.name ?? "");
      return msg;
    });
  }

  async getReplies(ctx: OrgContext, messageId: string): Promise<ChatMessage[]> {
    return withOrg(ctx, async (tx) => {
      const rootCheck = await tx.execute(
        sql`SELECT * FROM chat_messages
        WHERE organization_id = ${ctx.orgId} AND id = ${messageId}`,
      );
      if (rootCheck.rows.length === 0) {
        throw new NotFoundError();
      }

      await this.getConversation(ctx, String(rootCheck.rows[0]?.conversation_id));

      const res = await tx.execute(
        sql`SELECT m.*, u.name as author_name,
          EXISTS(
            SELECT 1 FROM chat_stars s
            WHERE s.organization_id = m.organization_id
              AND s.message_id = m.id
              AND s.user_id = ${ctx.userId}
          ) as starred
        FROM chat_messages m
        LEFT JOIN users u ON u.id = m.author_user_id
        WHERE m.organization_id = ${ctx.orgId} AND m.thread_root_id = ${messageId}
        ORDER BY m.created_at ASC`,
      );

      return res.rows.map((r) => mapMessage(r as Record<string, unknown>));
    });
  }

  async markThreadRead(ctx: OrgContext, messageId: string): Promise<void> {
    return withOrg(ctx, async (tx) => {
      const rootCheck = await tx.execute(
        sql`SELECT conversation_id FROM chat_messages
        WHERE organization_id = ${ctx.orgId} AND id = ${messageId} AND thread_root_id IS NULL`,
      );
      if (rootCheck.rows.length === 0) {
        throw new NotFoundError();
      }

      await this.getConversation(ctx, String(rootCheck.rows[0]?.conversation_id));

      await tx.execute(
        sql`INSERT INTO chat_thread_reads (
          organization_id, thread_root_id, user_id, last_read_at, changed_seq
        ) VALUES (
          ${ctx.orgId}, ${messageId}, ${ctx.userId}, now(), nextval('chat_change_seq')
        )
        ON CONFLICT (organization_id, thread_root_id, user_id) DO UPDATE
        SET last_read_at = now(), changed_seq = nextval('chat_change_seq')`,
      );
    });
  }

  async starMessage(ctx: OrgContext, messageId: string, star: boolean): Promise<void> {
    return withOrg(ctx, async (tx) => {
      const msgCheck = await tx.execute(
        sql`SELECT conversation_id FROM chat_messages
        WHERE organization_id = ${ctx.orgId} AND id = ${messageId}`,
      );
      if (msgCheck.rows.length === 0) {
        throw new NotFoundError();
      }

      await this.getConversation(ctx, String(msgCheck.rows[0]?.conversation_id));

      if (star) {
        await tx.execute(
          sql`INSERT INTO chat_stars (organization_id, user_id, message_id)
          VALUES (${ctx.orgId}, ${ctx.userId}, ${messageId})
          ON CONFLICT (organization_id, user_id, message_id) DO NOTHING`,
        );
      } else {
        await tx.execute(
          sql`DELETE FROM chat_stars
          WHERE organization_id = ${ctx.orgId} AND user_id = ${ctx.userId} AND message_id = ${messageId}`,
        );
      }
    });
  }

  async listStarredMessages(ctx: OrgContext): Promise<ChatMessage[]> {
    return withOrg(ctx, async (tx) => {
      const res = await tx.execute(
        sql`SELECT m.*, u.name as author_name, true as starred
        FROM chat_stars s
        JOIN chat_messages m ON m.organization_id = s.organization_id AND m.id = s.message_id
        JOIN chat_conversations c ON c.organization_id = m.organization_id AND c.id = m.conversation_id
        LEFT JOIN chat_members cm ON cm.organization_id = c.organization_id AND cm.conversation_id = c.id AND cm.user_id = ${ctx.userId}
        LEFT JOIN users u ON u.id = m.author_user_id
        WHERE s.organization_id = ${ctx.orgId}
          AND s.user_id = ${ctx.userId}
          AND ((cm.user_id IS NOT NULL AND cm.left_at IS NULL) OR (c.kind = 'channel' AND c.visibility = 'public'))
        ORDER BY s.created_at DESC`,
      );

      return res.rows.map((r) => mapMessage(r as Record<string, unknown>));
    });
  }

  async listMentions(ctx: OrgContext): Promise<ChatMessage[]> {
    return withOrg(ctx, async (tx) => {
      const res = await tx.execute(
        sql`SELECT m.*, u.name as author_name,
          EXISTS(
            SELECT 1 FROM chat_stars s
            WHERE s.organization_id = m.organization_id
              AND s.message_id = m.id
              AND s.user_id = ${ctx.userId}
          ) as starred
        FROM chat_messages m
        JOIN chat_conversations c ON c.organization_id = m.organization_id AND c.id = m.conversation_id
        LEFT JOIN chat_members cm ON cm.organization_id = c.organization_id AND cm.conversation_id = c.id AND cm.user_id = ${ctx.userId}
        LEFT JOIN users u ON u.id = m.author_user_id
        WHERE m.organization_id = ${ctx.orgId}
          AND ${ctx.userId}::uuid = ANY(m.mentions)
          AND m.deleted_at IS NULL
          AND ((cm.user_id IS NOT NULL AND cm.left_at IS NULL) OR (c.kind = 'channel' AND c.visibility = 'public'))
        ORDER BY m.created_at DESC`,
      );

      return res.rows.map((r) => mapMessage(r as Record<string, unknown>));
    });
  }

  async listThreads(ctx: OrgContext): Promise<ChatMessage[]> {
    return withOrg(ctx, async (tx) => {
      const res = await tx.execute(
        sql`SELECT m.*, u.name as author_name,
          EXISTS(
            SELECT 1 FROM chat_stars s
            WHERE s.organization_id = m.organization_id
              AND s.message_id = m.id
              AND s.user_id = ${ctx.userId}
          ) as starred
        FROM chat_thread_reads r
        JOIN chat_messages m ON m.organization_id = r.organization_id AND m.id = r.thread_root_id
        JOIN chat_conversations c ON c.organization_id = m.organization_id AND c.id = m.conversation_id
        LEFT JOIN chat_members cm ON cm.organization_id = c.organization_id AND cm.conversation_id = c.id AND cm.user_id = ${ctx.userId}
        LEFT JOIN users u ON u.id = m.author_user_id
        WHERE r.organization_id = ${ctx.orgId}
          AND r.user_id = ${ctx.userId}
          AND ((cm.user_id IS NOT NULL AND cm.left_at IS NULL) OR (c.kind = 'channel' AND c.visibility = 'public'))
        ORDER BY m.last_reply_at DESC NULLS LAST, m.created_at DESC`,
      );

      return res.rows.map((r) => mapMessage(r as Record<string, unknown>));
    });
  }

  async setPresence(ctx: OrgContext, status: ChatPresenceStatus): Promise<void> {
    return withOrg(ctx, async (tx) => {
      await tx.execute(
        sql`INSERT INTO chat_presence (
          organization_id, user_id, status, last_seen_at
        ) VALUES (
          ${ctx.orgId}, ${ctx.userId}, ${status}, now()
        )
        ON CONFLICT (organization_id, user_id) DO UPDATE
        SET status = EXCLUDED.status, last_seen_at = now()`,
      );
    });
  }

  async listContacts(ctx: OrgContext, category: "frequent" | "recent"): Promise<ChatContact[]> {
    return withOrg(ctx, async (tx) => {
      const orderClause =
        category === "recent"
          ? sql`COALESCE(direct_stats.last_msg, '1970-01-01') DESC, u.name ASC`
          : sql`COALESCE(direct_stats.msg_count, 0) DESC, u.name ASC`;

      const res = await tx.execute(
        sql`SELECT
          u.id as user_id,
          u.name,
          u.email,
          p.status as raw_status,
          p.last_seen_at,
          direct_stats.msg_count,
          direct_stats.last_msg
        FROM memberships m
        JOIN users u ON u.id = m.user_id
        LEFT JOIN chat_presence p ON p.organization_id = m.organization_id AND p.user_id = u.id
        LEFT JOIN LATERAL (
          SELECT
            COUNT(msg.id) as msg_count,
            MAX(msg.created_at) as last_msg
          FROM chat_conversations c
          JOIN chat_members cm1 ON cm1.organization_id = c.organization_id AND cm1.conversation_id = c.id AND cm1.user_id = ${ctx.userId}
          JOIN chat_members cm2 ON cm2.organization_id = c.organization_id AND cm2.conversation_id = c.id AND cm2.user_id = u.id
          LEFT JOIN chat_messages msg ON msg.organization_id = c.organization_id AND msg.conversation_id = c.id
          WHERE c.organization_id = m.organization_id AND c.kind = 'direct'
        ) direct_stats ON true
        WHERE m.organization_id = ${ctx.orgId} AND u.id <> ${ctx.userId}
        ORDER BY ${orderClause}`,
      );

      return res.rows.map((row) => {
        const rawStatus = String(row.raw_status ?? "offline");
        const lastSeen = row.last_seen_at ? toDate(row.last_seen_at) : null;
        let displayStatus: "available" | "busy" | "away" | "offline" = "offline";
        if (lastSeen && rawStatus !== "invisible") {
          const diffSec = (Date.now() - lastSeen.getTime()) / 1000;
          if (diffSec <= 60 && ["available", "busy", "away"].includes(rawStatus)) {
            displayStatus = rawStatus as "available" | "busy" | "away";
          }
        }

        return {
          userId: String(row.user_id),
          name: String(row.name),
          email: String(row.email),
          status: displayStatus,
          lastSeenAt: lastSeen,
        };
      });
    });
  }

  async sync(ctx: OrgContext, cursor: number): Promise<ChatSyncResult> {
    return withOrg(ctx, async (tx) => {
      // 1. Throttled presence update (every 15s)
      const presRes = await tx.execute(
        sql`SELECT status, last_seen_at FROM chat_presence
        WHERE organization_id = ${ctx.orgId} AND user_id = ${ctx.userId}`,
      );

      const existingPres = presRes.rows[0];
      const now = new Date();
      if (!existingPres) {
        await tx.execute(
          sql`INSERT INTO chat_presence (organization_id, user_id, status, last_seen_at)
          VALUES (${ctx.orgId}, ${ctx.userId}, 'available', now())`,
        );
      } else {
        const lastSeen = toDate(existingPres.last_seen_at);
        if (now.getTime() - lastSeen.getTime() > 15_000) {
          await tx.execute(
            sql`UPDATE chat_presence SET last_seen_at = now()
            WHERE organization_id = ${ctx.orgId} AND user_id = ${ctx.userId}`,
          );
        }
      }

      // 2. Fetch changes with changed_seq > cursor
      const limit = 200;

      // Conversations visible to caller
      const convRes = await tx.execute(
        sql`SELECT c.*,
          m.role as membership_role,
          m.last_read_seq,
          m.pinned_at,
          GREATEST(c.last_seq - COALESCE(m.last_read_seq, 0), 0) as unread_count
        FROM chat_conversations c
        LEFT JOIN chat_members m ON m.organization_id = c.organization_id AND m.conversation_id = c.id AND m.user_id = ${ctx.userId}
        WHERE c.organization_id = ${ctx.orgId}
          AND c.changed_seq > ${cursor}
          AND ((m.user_id IS NOT NULL AND m.left_at IS NULL) OR (c.kind = 'channel' AND c.visibility = 'public'))
        ORDER BY c.changed_seq ASC
        LIMIT ${limit + 1}`,
      );

      // Members for visible conversations
      const memberRes = await tx.execute(
        sql`SELECT m.*, u.name as user_name, u.email as user_email
        FROM chat_members m
        JOIN chat_conversations c ON c.organization_id = m.organization_id AND c.id = m.conversation_id
        LEFT JOIN chat_members caller ON caller.organization_id = c.organization_id AND caller.conversation_id = c.id AND caller.user_id = ${ctx.userId}
        LEFT JOIN users u ON u.id = m.user_id
        WHERE m.organization_id = ${ctx.orgId}
          AND m.changed_seq > ${cursor}
          AND ((caller.user_id IS NOT NULL AND caller.left_at IS NULL) OR (c.kind = 'channel' AND c.visibility = 'public'))
        ORDER BY m.changed_seq ASC
        LIMIT ${limit + 1}`,
      );

      // Messages in visible conversations
      const msgRes = await tx.execute(
        sql`SELECT m.*, u.name as author_name,
          EXISTS(
            SELECT 1 FROM chat_stars s
            WHERE s.organization_id = m.organization_id
              AND s.message_id = m.id
              AND s.user_id = ${ctx.userId}
          ) as starred
        FROM chat_messages m
        JOIN chat_conversations c ON c.organization_id = m.organization_id AND c.id = m.conversation_id
        LEFT JOIN chat_members caller ON caller.organization_id = c.organization_id AND caller.conversation_id = c.id AND caller.user_id = ${ctx.userId}
        LEFT JOIN users u ON u.id = m.author_user_id
        WHERE m.organization_id = ${ctx.orgId}
          AND m.changed_seq > ${cursor}
          AND ((caller.user_id IS NOT NULL AND caller.left_at IS NULL) OR (c.kind = 'channel' AND c.visibility = 'public'))
        ORDER BY m.changed_seq ASC
        LIMIT ${limit + 1}`,
      );

      // Thread reads for caller
      const threadRes = await tx.execute(
        sql`SELECT * FROM chat_thread_reads
        WHERE organization_id = ${ctx.orgId}
          AND user_id = ${ctx.userId}
          AND changed_seq > ${cursor}
        ORDER BY changed_seq ASC
        LIMIT ${limit + 1}`,
      );

      // Presence changes
      const allPresenceRes = await tx.execute(
        sql`SELECT * FROM chat_presence
        WHERE organization_id = ${ctx.orgId}
        ORDER BY last_seen_at DESC`,
      );

      const conversations = convRes.rows.map((r) => mapConversation(r as Record<string, unknown>));
      const members = memberRes.rows.map((r) => mapMember(r as Record<string, unknown>));
      const messages = msgRes.rows.map((r) => mapMessage(r as Record<string, unknown>));
      const threadReads: ChatThreadRead[] = threadRes.rows.map((r) => ({
        organizationId: String(r.organization_id),
        threadRootId: String(r.thread_root_id),
        userId: String(r.user_id),
        lastReadAt: toDate(r.last_read_at),
        changedSeq: Number(r.changed_seq),
      }));

      const presence: ChatPresence[] = allPresenceRes.rows.map((r) => {
        const isSelf = r.user_id === ctx.userId;
        const lastSeen = toDate(r.last_seen_at);
        const displayStatus = computeDisplayPresence(String(r.status), lastSeen, isSelf);
        return {
          organizationId: String(r.organization_id),
          userId: String(r.user_id),
          status: displayStatus,
          lastSeenAt: lastSeen,
        };
      });

      // Total count check for pagination
      const totalCount =
        conversations.length + members.length + messages.length + threadReads.length;
      const hasMore = totalCount > limit;

      // Find max changed_seq among returned items
      let maxSeq = cursor;
      for (const item of [...conversations, ...members, ...messages, ...threadReads]) {
        if (item.changedSeq > maxSeq) {
          maxSeq = item.changedSeq;
        }
      }

      // Compute badges
      const badgesRes = await tx.execute(
        sql`SELECT
          -- unread chats
          COALESCE((
            SELECT COUNT(*) FROM chat_conversations c
            JOIN chat_members m ON m.organization_id = c.organization_id AND m.conversation_id = c.id
            WHERE c.organization_id = ${ctx.orgId}
              AND m.user_id = ${ctx.userId}
              AND m.left_at IS NULL
              AND c.last_seq > m.last_read_seq
          ), 0) as unread_chats,

          -- unread threads
          COALESCE((
            SELECT COUNT(*) FROM chat_thread_reads r
            JOIN chat_messages m ON m.organization_id = r.organization_id AND m.id = r.thread_root_id
            WHERE r.organization_id = ${ctx.orgId}
              AND r.user_id = ${ctx.userId}
              AND m.last_reply_at > r.last_read_at
          ), 0) as unread_threads,

          -- unread pins
          COALESCE((
            SELECT COUNT(*) FROM chat_conversations c
            JOIN chat_members m ON m.organization_id = c.organization_id AND m.conversation_id = c.id
            WHERE c.organization_id = ${ctx.orgId}
              AND m.user_id = ${ctx.userId}
              AND m.left_at IS NULL
              AND m.pinned_at IS NOT NULL
              AND c.last_seq > m.last_read_seq
          ), 0) as unread_pins,

          -- unread mentions
          COALESCE((
            SELECT COUNT(*) FROM chat_messages m
            JOIN chat_conversations c ON c.organization_id = m.organization_id AND c.id = m.conversation_id
            JOIN chat_members cm ON cm.organization_id = c.organization_id AND cm.conversation_id = c.id AND cm.user_id = ${ctx.userId}
            WHERE m.organization_id = ${ctx.orgId}
              AND ${ctx.userId}::uuid = ANY(m.mentions)
              AND m.deleted_at IS NULL
              AND cm.left_at IS NULL
              AND (m.seq IS NULL OR m.seq > cm.last_read_seq)
          ), 0) as unread_mentions`,
      );

      const bRow = badgesRes.rows[0] as Record<string, unknown>;
      const unreadChats = Number(bRow?.unread_chats ?? 0);
      const unreadThreads = Number(bRow?.unread_threads ?? 0);
      const unreadPins = Number(bRow?.unread_pins ?? 0);
      const unreadMentions = Number(bRow?.unread_mentions ?? 0);
      const badges: ChatBadges = {
        unreadChats,
        unreadThreads,
        unreadPins,
        unreadMentions,
        unreadTotal: unreadChats + unreadThreads,
      };

      return {
        cursor: maxSeq,
        hasMore,
        conversations: conversations.slice(0, limit),
        members: members.slice(0, limit),
        messages: messages.slice(0, limit),
        threadReads: threadReads.slice(0, limit),
        presence,
        badges,
      };
    });
  }

  async search(
    ctx: OrgContext,
    params: ChatSearchParams,
  ): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
    return withOrg(ctx, async (tx) => {
      const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
      const offset = Math.max(params.offset ?? 0, 0);

      const conditions: ReturnType<typeof sql>[] = [
        sql`m.organization_id = ${ctx.orgId}`,
        sql`m.deleted_at IS NULL`,
        sql`((cm.user_id IS NOT NULL AND cm.left_at IS NULL) OR (c.kind = 'channel' AND c.visibility = 'public'))`,
      ];

      if (params.q?.trim()) {
        conditions.push(sql`m.search @@ websearch_to_tsquery('simple', ${params.q.trim()})`);
      }

      if (params.from) {
        conditions.push(sql`m.author_user_id = ${params.from}`);
      }

      if (params.in) {
        conditions.push(sql`m.conversation_id = ${params.in}`);
      }

      if (params.type) {
        if (params.type === "threads") {
          conditions.push(sql`m.thread_root_id IS NOT NULL`);
        } else if (params.type === "chats") {
          conditions.push(sql`m.thread_root_id IS NULL AND c.kind IN ('direct', 'group')`);
        } else if (params.type === "channels") {
          conditions.push(sql`m.thread_root_id IS NULL AND c.kind = 'channel'`);
        }
      }

      if (params.after) {
        conditions.push(sql`m.created_at >= ${new Date(params.after)}`);
      }

      if (params.before) {
        conditions.push(sql`m.created_at <= ${new Date(params.before)}`);
      }

      if (params.hasLink) {
        conditions.push(sql`m.body ~* 'https?://'`);
      }

      if (params.hasMention) {
        conditions.push(sql`array_length(m.mentions, 1) > 0`);
      }

      const res = await tx.execute(
        sql`SELECT m.*, u.name as author_name,
          EXISTS(
            SELECT 1 FROM chat_stars s
            WHERE s.organization_id = m.organization_id
              AND s.message_id = m.id
              AND s.user_id = ${ctx.userId}
          ) as starred
        FROM chat_messages m
        JOIN chat_conversations c ON c.organization_id = m.organization_id AND c.id = m.conversation_id
        LEFT JOIN chat_members cm ON cm.organization_id = c.organization_id AND cm.conversation_id = c.id AND cm.user_id = ${ctx.userId}
        LEFT JOIN users u ON u.id = m.author_user_id
        WHERE ${sql.join(conditions, sql` AND `)}
        ORDER BY m.created_at DESC
        LIMIT ${limit + 1} OFFSET ${offset}`,
      );

      const hasMore = res.rows.length > limit;
      const rows = hasMore ? res.rows.slice(0, limit) : res.rows;
      return {
        messages: rows.map((r) => mapMessage(r as Record<string, unknown>)),
        hasMore,
      };
    });
  }
}

let sharedChatService: ChatService | undefined;

export function getChatService(): ChatService {
  sharedChatService ??= new ChatService();
  return sharedChatService;
}
