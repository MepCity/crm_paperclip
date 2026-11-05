import { sql } from "drizzle-orm";
import { NotFoundError, ValidationError } from "../errors";
import { withOrg } from "../tenancy";
import type { OrgContext, Transaction } from "../tenancy/types";
import type {
  NotificationItem,
  NotificationKind,
  NotificationPage,
  NotificationSubject,
} from "./types";

export const NOTIFICATION_PAGE_SIZE = 20;

export type NotifyInput = {
  recipients: readonly string[];
  kind: NotificationKind;
  subject: NotificationSubject;
  /** The acting user; null for the system. The actor never notifies itself. */
  actorUserId: string | null;
};

export function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(JSON.stringify([createdAt, id])).toString("base64url");
}

export function decodeCursor(cursor: string): [string, string] {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === "string" &&
      typeof parsed[1] === "string" &&
      !Number.isNaN(Date.parse(parsed[0])) &&
      /^[0-9a-f-]{36}$/i.test(parsed[1])
    )
      return [parsed[0], parsed[1]];
  } catch {
    // fall through
  }
  throw new ValidationError({ cursor: ["The cursor is not valid."] });
}

function iso(value: unknown): string {
  return (value instanceof Date ? value : new Date(String(value))).toISOString();
}

export class NotificationService {
  /**
   * Writes one row per distinct recipient inside the caller's transaction, so a
   * notification exists if and only if the change that caused it committed.
   * Recipients that are not members of the organization are skipped.
   */
  async notify(tx: Transaction, orgId: string, input: NotifyInput): Promise<number> {
    const recipients = [...new Set(input.recipients)].filter((id) => id !== input.actorUserId);
    if (recipients.length === 0) return 0;
    let written = 0;
    for (const recipient of recipients) {
      const result = await tx.execute(
        sql`INSERT INTO notifications (organization_id, recipient_user_id, kind, actor_user_id, subject)
          SELECT ${orgId}, m.user_id, ${input.kind}, ${input.actorUserId}, ${JSON.stringify(input.subject)}::jsonb
          FROM memberships m WHERE m.organization_id = ${orgId} AND m.user_id = ${recipient}`,
      );
      written += result.rowCount ?? 0;
    }
    return written;
  }

  async list(
    ctx: OrgContext,
    params: { cursor?: string | undefined; limit?: number | undefined } = {},
  ): Promise<NotificationPage> {
    const limit = Math.min(Math.max(params.limit ?? NOTIFICATION_PAGE_SIZE, 1), 50);
    const after = params.cursor ? decodeCursor(params.cursor) : null;
    return withOrg(ctx, async (tx) => {
      const rows = await tx.execute(
        sql`SELECT n.id, n.kind, n.actor_user_id, u.name AS actor_name, n.subject,
              n.created_at, n.seen_at, n.read_at
            FROM notifications n LEFT JOIN users u ON u.id = n.actor_user_id
            WHERE n.organization_id = ${ctx.orgId} AND n.recipient_user_id = ${ctx.userId}
              ${after ? sql`AND (n.created_at, n.id) < (${after[0]}::timestamptz, ${after[1]}::uuid)` : sql``}
            ORDER BY n.created_at DESC, n.id DESC LIMIT ${limit + 1}`,
      );
      const page = rows.rows.slice(0, limit) as Record<string, unknown>[];
      const items: NotificationItem[] = page.map((row) => ({
        id: String(row.id),
        kind: row.kind as NotificationKind,
        actor: row.actor_user_id
          ? { id: String(row.actor_user_id), name: String(row.actor_name ?? "") }
          : null,
        subject: (row.subject ?? {}) as NotificationSubject,
        createdAt: iso(row.created_at),
        seenAt: row.seen_at ? iso(row.seen_at) : null,
        readAt: row.read_at ? iso(row.read_at) : null,
      }));
      const last = page.at(-1);
      return {
        items,
        nextCursor:
          rows.rows.length > limit && last
            ? encodeCursor(iso(last.created_at), String(last.id))
            : null,
      };
    });
  }

  async unseenCount(ctx: OrgContext): Promise<{ count: number }> {
    return withOrg(ctx, async (tx) => {
      const rows = await tx.execute(
        sql`SELECT count(*)::int AS count FROM notifications
            WHERE organization_id = ${ctx.orgId} AND recipient_user_id = ${ctx.userId}
              AND seen_at IS NULL`,
      );
      return { count: Number((rows.rows[0] as { count?: number } | undefined)?.count ?? 0) };
    });
  }

  /** Opening the panel marks the listed items seen; `ids` omitted marks all unseen items. */
  async markSeen(ctx: OrgContext, ids?: readonly string[]): Promise<{ updated: number }> {
    return withOrg(ctx, async (tx) => {
      const result = await tx.execute(
        sql`UPDATE notifications SET seen_at = now()
            WHERE organization_id = ${ctx.orgId} AND recipient_user_id = ${ctx.userId}
              AND seen_at IS NULL
              ${ids ? sql`AND id = ANY(${sql.raw(`ARRAY[${ids.map((id) => `'${assertUuid(id)}'`).join(",") || "NULL"}]::uuid[]`)})` : sql``}`,
      );
      return { updated: result.rowCount ?? 0 };
    });
  }

  async markRead(ctx: OrgContext, id: string): Promise<NotificationItem> {
    assertUuid(id);
    return withOrg(ctx, async (tx) => {
      const result = await tx.execute(
        sql`UPDATE notifications SET read_at = COALESCE(read_at, now()), seen_at = COALESCE(seen_at, now())
            WHERE organization_id = ${ctx.orgId} AND recipient_user_id = ${ctx.userId} AND id = ${id}
            RETURNING id`,
      );
      if (result.rows.length === 0) throw new NotFoundError();
      const rows = await tx.execute(
        sql`SELECT n.id, n.kind, n.actor_user_id, u.name AS actor_name, n.subject,
              n.created_at, n.seen_at, n.read_at
            FROM notifications n LEFT JOIN users u ON u.id = n.actor_user_id
            WHERE n.organization_id = ${ctx.orgId} AND n.id = ${id}`,
      );
      const row = rows.rows[0] as Record<string, unknown>;
      return {
        id: String(row.id),
        kind: row.kind as NotificationKind,
        actor: row.actor_user_id
          ? { id: String(row.actor_user_id), name: String(row.actor_name ?? "") }
          : null,
        subject: (row.subject ?? {}) as NotificationSubject,
        createdAt: iso(row.created_at),
        seenAt: row.seen_at ? iso(row.seen_at) : null,
        readAt: row.read_at ? iso(row.read_at) : null,
      };
    });
  }
}

function assertUuid(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))
    throw new ValidationError({ id: ["The id is not valid."] });
  return value;
}

let shared: NotificationService | undefined;
export function getNotificationService(): NotificationService {
  shared ??= new NotificationService();
  return shared;
}
