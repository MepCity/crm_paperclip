import { type SQL, sql } from "drizzle-orm";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors";
import type { RecordData, RecordService } from "../records/contract";
import type { RecordHistoryEvent, RecordHistoryService } from "../records/history";
import { sanitizeNoteHtml } from "../records/note-html";
import { withOrg } from "../tenancy";
import type { OrgContext, Transaction } from "../tenancy/types";
import {
  type CommentOnEventInput,
  type CreateCommentInput,
  type CreatePostInput,
  FEED_BODY_MAX,
  FEED_CANDIDATE_CAP,
  FEED_EVENT_WINDOW_DAYS,
  FEED_MODULES,
  FEED_PAGE_SIZE,
  type FeedComment,
  type FeedEventItem,
  type FeedFilter,
  type FeedFollowTarget,
  type FeedItem,
  type FeedLikeTarget,
  type FeedListQuery,
  type FeedNotification,
  type FeedPage,
  type FeedPostItem,
  type FeedRecordRef,
  type FeedUser,
  type FollowState,
} from "./types";
import { decodeCursor, pageFeedItems, visibleEventChanges } from "./union";

type Row = Record<string, unknown>;

/** Collaborators supplied by the application adapter (record data is not in Postgres yet). */
export interface FeedDeps {
  records: Pick<RecordService, "get" | "list" | "listViews">;
  history: RecordHistoryService;
  /** Field visibility for the viewer; defaults to all fields visible (ADR 0017 not enforced yet). */
  canSeeField?: (module: string, apiName: string) => boolean;
  /** Whether another user may read a record; used to skip notifications (ADR 0018 §4.2). */
  canUserRead?: (userId: string, module: string, recordId: string) => Promise<boolean>;
  /** Called inside the writer's transaction with the notifications to store. */
  notify?: (tx: Transaction, notifications: readonly FeedNotification[]) => Promise<void>;
}

const LABEL_FIELDS = ["Deal_Name", "Account_Name", "Full_Name", "Name", "Subject", "Company"];

export function recordLabel(record: RecordData): string | null {
  const f = record.fields;
  for (const key of LABEL_FIELDS) {
    const v = f[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  const parts = [f.First_Name, f.Last_Name].filter(
    (v): v is string => typeof v === "string" && v.trim() !== "",
  );
  return parts.length ? parts.join(" ") : null;
}

function ownerId(record: RecordData): string | null {
  const v = record.fields.Owner;
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const id = (v as { id?: unknown }).id;
    if (typeof id === "string") return id;
  }
  return null;
}

function iso(value: unknown): string {
  return (value instanceof Date ? value : new Date(String(value))).toISOString();
}

function arr(values: readonly string[], type: "uuid" | "text"): SQL {
  if (values.length === 0) return sql.raw(`ARRAY[]::${type}[]`);
  return sql`ARRAY[${sql.join(
    values.map((v) => sql`${v}`),
    sql`, `,
  )}]::${sql.raw(type)}[]`;
}

function plainLength(html: string): number {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length;
}

function cleanBody(raw: string): string {
  if (typeof raw !== "string") throw new ValidationError({ body: ["Write something first."] });
  const body = sanitizeNoteHtml(raw);
  if (plainLength(body) === 0) throw new ValidationError({ body: ["Write something first."] });
  if (body.length > FEED_BODY_MAX) {
    throw new ValidationError({ body: ["The text is too long."] }, undefined, "limit");
  }
  return body;
}

const isOwnedFeedModule = (module: string) => FEED_MODULES.includes(module);

export class FeedService {
  private readonly readable = new Map<string, Promise<RecordData | null>>();

  constructor(
    private readonly ctx: OrgContext,
    private readonly deps: FeedDeps,
  ) {}

  // ----- record visibility -------------------------------------------------

  private readRecord(module: string, id: string): Promise<RecordData | null> {
    const key = `${module}:${id}`;
    let hit = this.readable.get(key);
    if (!hit) {
      hit = this.deps.records.get(module, id).then(
        (record) => record,
        (error) => {
          if (error instanceof NotFoundError) return null;
          throw error;
        },
      );
      this.readable.set(key, hit);
    }
    return hit;
  }

  private async requireRecord(module: string, id: string): Promise<RecordData> {
    if (!isOwnedFeedModule(module)) {
      throw new ValidationError({ recordModule: ["This module has no feed."] });
    }
    const record = await this.readRecord(module, id);
    if (!record) throw new NotFoundError();
    return record;
  }

  private canSee(module: string, apiName: string): boolean {
    return this.deps.canSeeField ? this.deps.canSeeField(module, apiName) : true;
  }

  // ----- users -------------------------------------------------------------

  private async users(tx: Transaction, ids: readonly string[]): Promise<Map<string, FeedUser>> {
    const out = new Map<string, FeedUser>();
    const unique = [...new Set(ids)];
    if (unique.length === 0) return out;
    const res = await tx.execute(
      sql`SELECT u.id, u.name FROM users u
          JOIN memberships m ON m.user_id = u.id
          WHERE m.organization_id = ${this.ctx.orgId} AND u.id = ANY(${arr(unique, "uuid")})`,
    );
    for (const r of res.rows as Row[])
      out.set(String(r.id), { id: String(r.id), name: String(r.name) });
    return out;
  }

  private async activeMemberIds(tx: Transaction, ids: readonly string[]): Promise<string[]> {
    return [...(await this.users(tx, ids)).keys()];
  }

  private userOf(map: Map<string, FeedUser>, id: string): FeedUser {
    return map.get(id) ?? { id, name: "" };
  }

  // ----- reads -------------------------------------------------------------

  /** Wall: posts and record events, newest first (ADR 0018 §3). */
  async list(query: FeedListQuery = {}): Promise<FeedPage> {
    const limit = Math.min(Math.max(query.limit ?? FEED_PAGE_SIZE, 1), 50);
    const cursor = decodeCursor(query.cursor);
    if (query.cursor && !cursor) throw new ValidationError({ cursor: ["Invalid cursor."] });
    const filter: FeedFilter = query.filter ?? "all";
    const module = query.module ?? null;
    if (module && !isOwnedFeedModule(module)) return { items: [], nextCursor: null };
    return this.build({ filter, module, record: null, cursor, limit });
  }

  /** Record feed tab: posts on one record plus its history events. */
  async listForRecord(
    module: string,
    recordId: string,
    query: { cursor?: string | null; limit?: number } = {},
  ): Promise<FeedPage> {
    await this.requireRecord(module, recordId);
    const limit = Math.min(Math.max(query.limit ?? FEED_PAGE_SIZE, 1), 50);
    const cursor = decodeCursor(query.cursor);
    if (query.cursor && !cursor) throw new ValidationError({ cursor: ["Invalid cursor."] });
    return this.build({
      filter: "all",
      module,
      record: { module, id: recordId },
      cursor,
      limit,
    });
  }

  private async build(opts: {
    filter: FeedFilter;
    module: string | null;
    record: { module: string; id: string } | null;
    cursor: ReturnType<typeof decodeCursor>;
    limit: number;
  }): Promise<FeedPage> {
    const me = this.ctx.userId;
    const { filter, module, record, cursor, limit } = opts;

    const follows = await withOrg(this.ctx, async (tx) => {
      const res = await tx.execute(
        sql`SELECT target_kind, target_module, target_id, muted FROM feed_follows
            WHERE organization_id = ${this.ctx.orgId} AND user_id = ${me}`,
      );
      return res.rows as Row[];
    });
    const followedRecords = new Set<string>();
    const mutedRecords = new Set<string>();
    const followedUsers = new Set<string>();
    for (const f of follows) {
      if (f.target_kind === "user") followedUsers.add(String(f.target_id));
      else if (f.muted) mutedRecords.add(`${f.target_module}:${f.target_id}`);
      else followedRecords.add(`${f.target_module}:${f.target_id}`);
    }

    const commentedPostIds = new Set<string>();
    if (filter === "mine") {
      await withOrg(this.ctx, async (tx) => {
        const res = await tx.execute(
          sql`SELECT DISTINCT post_id FROM feed_comments
              WHERE organization_id = ${this.ctx.orgId} AND author_user_id = ${me}
                AND post_id IS NOT NULL AND deleted_at IS NULL`,
        );
        for (const r of res.rows as Row[]) commentedPostIds.add(String(r.post_id));
      });
    }

    const candidates = await this.candidateRecords(module, record);
    const ownedAndFollowed = (m: string, rec: RecordData) => {
      const key = `${m}:${rec.id}`;
      if (mutedRecords.has(key)) return false;
      return followedRecords.has(key) || ownerId(rec) === me;
    };

    // Posts
    const postRows = await withOrg(this.ctx, async (tx) => {
      const conds: SQL[] = [sql`organization_id = ${this.ctx.orgId}`, sql`deleted_at IS NULL`];
      if (record) {
        conds.push(sql`record_module = ${record.module}`, sql`record_id = ${record.id}`);
      } else if (module) {
        conds.push(sql`record_module = ${module}`);
      }
      if (cursor) {
        conds.push(
          sql`(date_trunc('milliseconds', created_at) < ${cursor.at}::timestamptz
               OR (date_trunc('milliseconds', created_at) = ${cursor.at}::timestamptz AND id::text < ${cursor.id}))`,
        );
      }
      const res = await tx.execute(
        sql`SELECT * FROM feed_posts WHERE ${sql.join(conds, sql` AND `)}
            ORDER BY date_trunc('milliseconds', created_at) DESC, id::text DESC LIMIT ${limit * 4 + 20}`,
      );
      return res.rows as Row[];
    });

    const items: FeedItem[] = [];
    for (const row of postRows) {
      const author = String(row.author_user_id);
      const rm = row.record_module ? String(row.record_module) : null;
      const rid = row.record_id ? String(row.record_id) : null;
      let rec: RecordData | null = null;
      if (rm && rid) {
        rec = await this.readRecord(rm, rid);
        if (!rec) continue;
      }
      if (filter === "mine") {
        const owned = rec ? ownerId(rec) === me : false;
        if (author !== me && !commentedPostIds.has(String(row.id)) && !owned) continue;
      } else if (filter === "followed") {
        const viaRecord = rm && rec ? ownedAndFollowed(rm, rec) : false;
        if (!viaRecord && !followedUsers.has(author) && author !== me) continue;
      }
      items.push({
        type: "post",
        id: String(row.id),
        at: iso(row.created_at),
        author: { id: author, name: "" },
        body: String(row.body),
        editedAt: row.edited_at ? iso(row.edited_at) : null,
        mentions: [],
        record: rm && rid ? { module: rm, id: rid, name: rec ? recordLabel(rec) : null } : null,
        likeCount: 0,
        likedByMe: false,
        commentCount: 0,
        comments: [],
      });
    }

    // Events
    const since = new Date(Date.now() - FEED_EVENT_WINDOW_DAYS * 86_400_000).toISOString();
    const eventTargets = candidates.filter(({ module: m, record: rec }) => {
      if (record) return true;
      if (filter === "followed") return ownedAndFollowed(m, rec);
      if (filter === "mine") return ownerId(rec) === me;
      return true;
    });
    const events: FeedEventItem[] = [];
    for (let i = 0; i < eventTargets.length; i += 10) {
      const chunk = eventTargets.slice(i, i + 10);
      const pages = await Promise.all(
        chunk.map(({ module: m, record: rec }) =>
          this.deps.history.list(m, rec.id, { perPage: 25, from: since }),
        ),
      );
      pages.forEach((page, idx) => {
        const target = chunk[idx];
        if (!target) return;
        for (const event of page.events) {
          const item = this.eventItem(event, target.module, target.record);
          if (item && (!cursor || isBefore(item, cursor))) events.push(item);
        }
      });
    }

    const merged = pageFeedItems<FeedItem>([...items, ...events], cursor, limit);
    const decorated = await this.decorate(merged.page);
    return { items: decorated, nextCursor: merged.nextCursor };
  }

  private async candidateRecords(
    module: string | null,
    record: { module: string; id: string } | null,
  ): Promise<{ module: string; record: RecordData }[]> {
    if (record) {
      const rec = await this.readRecord(record.module, record.id);
      return rec ? [{ module: record.module, record: rec }] : [];
    }
    const modules = module ? [module] : FEED_MODULES;
    const out: { module: string; record: RecordData }[] = [];
    for (const m of modules) {
      try {
        const view = (await this.deps.records.listViews(m))[0];
        if (!view) continue;
        const res = await this.deps.records.list(m, {
          viewId: view.id,
          page: 1,
          perPage: 50,
          sort: { field: "Modified_Time", order: "desc" },
        });
        for (const rec of res.records) {
          this.readable.set(`${m}:${rec.id}`, Promise.resolve(rec));
          out.push({ module: m, record: rec });
        }
      } catch (error) {
        if (!(error instanceof NotFoundError)) throw error;
      }
      if (out.length >= FEED_CANDIDATE_CAP) break;
    }
    return out.slice(0, FEED_CANDIDATE_CAP);
  }

  private eventItem(
    event: RecordHistoryEvent,
    module: string,
    rec: RecordData,
  ): FeedEventItem | null {
    const changes = visibleEventChanges(event, (m, field) => this.canSee(m, field));
    if (!changes) return null;
    return {
      type: "event",
      id: event.id,
      at: new Date(event.occurredAt).toISOString(),
      actor: event.actor,
      eventKind: event.kind,
      record: { module, id: rec.id, name: event.stream.name ?? recordLabel(rec) },
      changes,
      likeCount: 0,
      likedByMe: false,
      commentCount: 0,
      comments: [],
    };
  }

  /** Fills authors, mentions, like counts and comment threads for one page of items. */
  private async decorate(items: readonly FeedItem[]): Promise<FeedItem[]> {
    if (items.length === 0) return [];
    const me = this.ctx.userId;
    const postIds = items.filter((i) => i.type === "post").map((i) => i.id);
    const eventIds = items.filter((i) => i.type === "event").map((i) => i.id);
    return withOrg(this.ctx, async (tx) => {
      const commentRows = (
        await tx.execute(
          sql`SELECT * FROM feed_comments
              WHERE organization_id = ${this.ctx.orgId} AND deleted_at IS NULL
                AND (post_id = ANY(${arr(postIds, "uuid")}) OR history_event_id = ANY(${arr(eventIds, "text")}))
              ORDER BY created_at, id`,
        )
      ).rows as Row[];
      const mentionRows = (
        await tx.execute(
          sql`SELECT source_id, user_id FROM feed_mentions
              WHERE organization_id = ${this.ctx.orgId} AND source_kind = 'post'
                AND source_id = ANY(${arr(postIds, "uuid")})`,
        )
      ).rows as Row[];
      const likeTargets = [...postIds, ...eventIds, ...commentRows.map((c) => String(c.id))];
      const likeRows = (
        await tx.execute(
          sql`SELECT target_kind, target_id, count(*)::int AS n, bool_or(user_id = ${me}) AS mine
              FROM feed_likes
              WHERE organization_id = ${this.ctx.orgId} AND target_id = ANY(${arr(likeTargets, "text")})
              GROUP BY target_kind, target_id`,
        )
      ).rows as Row[];
      const likes = new Map<string, { n: number; mine: boolean }>();
      for (const r of likeRows) {
        likes.set(`${r.target_kind}:${r.target_id}`, { n: Number(r.n), mine: Boolean(r.mine) });
      }
      const userIds = [
        ...items.map((i) => (i.type === "post" ? i.author.id : i.actor.id)),
        ...commentRows.map((c) => String(c.author_user_id)),
        ...mentionRows.map((m) => String(m.user_id)),
      ];
      const users = await this.users(tx, userIds);

      const commentsFor = new Map<string, FeedComment[]>();
      for (const c of commentRows) {
        const key = c.post_id ? String(c.post_id) : String(c.history_event_id);
        const like = likes.get(`comment:${c.id}`);
        const list = commentsFor.get(key) ?? [];
        list.push({
          id: String(c.id),
          author: this.userOf(users, String(c.author_user_id)),
          body: String(c.body),
          createdAt: iso(c.created_at),
          editedAt: c.edited_at ? iso(c.edited_at) : null,
          likeCount: like?.n ?? 0,
          likedByMe: like?.mine ?? false,
        });
        commentsFor.set(key, list);
      }

      return items.map((item): FeedItem => {
        const comments = commentsFor.get(item.id) ?? [];
        const like = likes.get(`${item.type === "post" ? "post" : "history_event"}:${item.id}`);
        const common = {
          likeCount: like?.n ?? 0,
          likedByMe: like?.mine ?? false,
          commentCount: comments.length,
          comments,
        };
        if (item.type === "post") {
          const mentioned = mentionRows
            .filter((m) => String(m.source_id) === item.id)
            .map((m) => this.userOf(users, String(m.user_id)));
          return {
            ...item,
            ...common,
            author: this.userOf(users, item.author.id),
            mentions: mentioned,
          } satisfies FeedPostItem;
        }
        return { ...item, ...common, actor: users.get(item.actor.id) ?? item.actor };
      });
    });
  }

  // ----- posts -------------------------------------------------------------

  async createPost(input: CreatePostInput): Promise<FeedPostItem> {
    const body = cleanBody(input.body);
    const recordModule = input.recordModule ?? null;
    const recordId = input.recordId ?? null;
    if ((recordModule === null) !== (recordId === null)) {
      throw new ValidationError({ recordId: ["Record module and id go together."] });
    }
    if (recordModule && recordId) await this.requireRecord(recordModule, recordId);

    const id = await withOrg(this.ctx, async (tx) => {
      const res = await tx.execute(
        sql`INSERT INTO feed_posts (organization_id, author_user_id, body, record_module, record_id)
            VALUES (${this.ctx.orgId}, ${this.ctx.userId}, ${body}, ${recordModule}, ${recordId})
            RETURNING id`,
      );
      const postId = String((res.rows[0] as Row).id);
      const mentioned = await this.storeMentions(tx, "post", postId, input.mentionUserIds ?? []);
      await this.notifyMentions(tx, mentioned, { postId, recordModule, recordId });
      return postId;
    });
    return this.requirePostItem(id);
  }

  async editPost(postId: string, input: { body: string; mentionUserIds?: readonly string[] }) {
    const body = cleanBody(input.body);
    await withOrg(this.ctx, async (tx) => {
      const post = await this.loadPost(tx, postId);
      if (post.author !== this.ctx.userId) throw new ForbiddenError();
      await tx.execute(
        sql`UPDATE feed_posts SET body = ${body}, edited_at = now()
            WHERE organization_id = ${this.ctx.orgId} AND id = ${postId}`,
      );
      const before = await this.mentionIds(tx, "post", postId);
      await tx.execute(
        sql`DELETE FROM feed_mentions
            WHERE organization_id = ${this.ctx.orgId} AND source_kind = 'post' AND source_id = ${postId}`,
      );
      const now = await this.storeMentions(tx, "post", postId, input.mentionUserIds ?? []);
      await this.notifyMentions(
        tx,
        now.filter((u) => !before.includes(u)),
        { postId, recordModule: post.recordModule, recordId: post.recordId },
      );
    });
    return this.requirePostItem(postId);
  }

  async deletePost(postId: string): Promise<void> {
    await withOrg(this.ctx, async (tx) => {
      const post = await this.loadPost(tx, postId);
      if (post.author !== this.ctx.userId && this.ctx.role !== "admin") throw new ForbiddenError();
      await tx.execute(
        sql`UPDATE feed_posts SET body = '', deleted_at = now()
            WHERE organization_id = ${this.ctx.orgId} AND id = ${postId}`,
      );
      await tx.execute(
        sql`DELETE FROM feed_mentions
            WHERE organization_id = ${this.ctx.orgId} AND source_kind = 'post' AND source_id = ${postId}`,
      );
    });
  }

  private async loadPost(tx: Transaction, postId: string) {
    if (!isUuid(postId)) throw new NotFoundError();
    const res = await tx.execute(
      sql`SELECT * FROM feed_posts
          WHERE organization_id = ${this.ctx.orgId} AND id = ${postId} AND deleted_at IS NULL`,
    );
    const row = res.rows[0] as Row | undefined;
    if (!row) throw new NotFoundError();
    const recordModule = row.record_module ? String(row.record_module) : null;
    const recordId = row.record_id ? String(row.record_id) : null;
    if (recordModule && recordId && !(await this.readRecord(recordModule, recordId))) {
      throw new NotFoundError();
    }
    return { author: String(row.author_user_id), recordModule, recordId };
  }

  private async requirePostItem(postId: string): Promise<FeedPostItem> {
    const row = await withOrg(this.ctx, async (tx) => {
      await this.loadPost(tx, postId);
      const res = await tx.execute(
        sql`SELECT * FROM feed_posts WHERE organization_id = ${this.ctx.orgId} AND id = ${postId}`,
      );
      return res.rows[0] as Row;
    });
    const rm = row.record_module ? String(row.record_module) : null;
    const rid = row.record_id ? String(row.record_id) : null;
    const rec = rm && rid ? await this.readRecord(rm, rid) : null;
    const record: FeedRecordRef | null =
      rm && rid ? { module: rm, id: rid, name: rec ? recordLabel(rec) : null } : null;
    const [item] = await this.decorate([
      {
        type: "post",
        id: postId,
        at: iso(row.created_at),
        author: { id: String(row.author_user_id), name: "" },
        body: String(row.body),
        editedAt: row.edited_at ? iso(row.edited_at) : null,
        mentions: [],
        record,
        likeCount: 0,
        likedByMe: false,
        commentCount: 0,
        comments: [],
      },
    ]);
    return item as FeedPostItem;
  }

  // ----- comments ----------------------------------------------------------

  async commentOnPost(postId: string, input: CreateCommentInput): Promise<FeedComment> {
    const body = cleanBody(input.body);
    return withOrg(this.ctx, async (tx) => {
      const post = await this.loadPost(tx, postId);
      const id = await this.insertComment(tx, { postId, body });
      const mentioned = await this.storeMentions(tx, "comment", id, input.mentionUserIds ?? []);
      await this.notifyMentions(tx, mentioned, {
        postId,
        commentId: id,
        recordModule: post.recordModule,
        recordId: post.recordId,
      });
      if (post.author !== this.ctx.userId) {
        await this.notify(tx, [
          {
            kind: "post_comment",
            recipientUserId: post.author,
            actorUserId: this.ctx.userId,
            subject: {
              postId,
              commentId: id,
              ...(post.recordModule && post.recordId
                ? { recordModule: post.recordModule, recordId: post.recordId }
                : {}),
            },
          },
        ]);
      }
      return this.commentView(tx, id);
    });
  }

  async commentOnEvent(eventId: string, input: CommentOnEventInput): Promise<FeedComment> {
    const body = cleanBody(input.body);
    await this.requireEvent(input.recordModule, input.recordId, eventId);
    return withOrg(this.ctx, async (tx) => {
      const id = await this.insertComment(tx, {
        eventId,
        recordModule: input.recordModule,
        recordId: input.recordId,
        body,
      });
      const mentioned = await this.storeMentions(tx, "comment", id, input.mentionUserIds ?? []);
      await this.notifyMentions(tx, mentioned, {
        commentId: id,
        recordModule: input.recordModule,
        recordId: input.recordId,
      });
      return this.commentView(tx, id);
    });
  }

  async editComment(
    commentId: string,
    input: { body: string; mentionUserIds?: readonly string[] },
  ): Promise<FeedComment> {
    const body = cleanBody(input.body);
    return withOrg(this.ctx, async (tx) => {
      const c = await this.loadComment(tx, commentId);
      if (c.author !== this.ctx.userId) throw new ForbiddenError();
      await tx.execute(
        sql`UPDATE feed_comments SET body = ${body}, edited_at = now()
            WHERE organization_id = ${this.ctx.orgId} AND id = ${commentId}`,
      );
      const before = await this.mentionIds(tx, "comment", commentId);
      await tx.execute(
        sql`DELETE FROM feed_mentions
            WHERE organization_id = ${this.ctx.orgId} AND source_kind = 'comment' AND source_id = ${commentId}`,
      );
      const now = await this.storeMentions(tx, "comment", commentId, input.mentionUserIds ?? []);
      await this.notifyMentions(
        tx,
        now.filter((u) => !before.includes(u)),
        {
          commentId,
          postId: c.postId ?? undefined,
          recordModule: c.recordModule,
          recordId: c.recordId,
        },
      );
      return this.commentView(tx, commentId);
    });
  }

  async deleteComment(commentId: string): Promise<void> {
    await withOrg(this.ctx, async (tx) => {
      const c = await this.loadComment(tx, commentId);
      if (c.author !== this.ctx.userId && this.ctx.role !== "admin") throw new ForbiddenError();
      await tx.execute(
        sql`UPDATE feed_comments SET body = '', deleted_at = now()
            WHERE organization_id = ${this.ctx.orgId} AND id = ${commentId}`,
      );
      await tx.execute(
        sql`DELETE FROM feed_mentions
            WHERE organization_id = ${this.ctx.orgId} AND source_kind = 'comment' AND source_id = ${commentId}`,
      );
    });
  }

  private async insertComment(
    tx: Transaction,
    c: {
      postId?: string;
      eventId?: string;
      recordModule?: string;
      recordId?: string;
      body: string;
    },
  ): Promise<string> {
    const res = await tx.execute(
      sql`INSERT INTO feed_comments
            (organization_id, post_id, history_event_id, record_module, record_id, author_user_id, body)
          VALUES (${this.ctx.orgId}, ${c.postId ?? null}, ${c.eventId ?? null},
                  ${c.recordModule ?? null}, ${c.recordId ?? null}, ${this.ctx.userId}, ${c.body})
          RETURNING id`,
    );
    return String((res.rows[0] as Row).id);
  }

  private async loadComment(tx: Transaction, commentId: string) {
    if (!isUuid(commentId)) throw new NotFoundError();
    const res = await tx.execute(
      sql`SELECT c.*, p.record_module AS p_module, p.record_id AS p_record, p.deleted_at AS p_deleted
          FROM feed_comments c
          LEFT JOIN feed_posts p ON p.organization_id = c.organization_id AND p.id = c.post_id
          WHERE c.organization_id = ${this.ctx.orgId} AND c.id = ${commentId} AND c.deleted_at IS NULL`,
    );
    const row = res.rows[0] as Row | undefined;
    if (!row || row.p_deleted) throw new NotFoundError();
    const recordModule = String(row.post_id ? (row.p_module ?? "") : row.record_module) || null;
    const recordId = String(row.post_id ? (row.p_record ?? "") : row.record_id) || null;
    if (recordModule && recordId && !(await this.readRecord(recordModule, recordId))) {
      throw new NotFoundError();
    }
    return {
      author: String(row.author_user_id),
      postId: row.post_id ? String(row.post_id) : null,
      recordModule,
      recordId,
    };
  }

  private async commentView(tx: Transaction, id: string): Promise<FeedComment> {
    const res = await tx.execute(
      sql`SELECT * FROM feed_comments WHERE organization_id = ${this.ctx.orgId} AND id = ${id}`,
    );
    const c = res.rows[0] as Row;
    const users = await this.users(tx, [String(c.author_user_id)]);
    return {
      id,
      author: this.userOf(users, String(c.author_user_id)),
      body: String(c.body),
      createdAt: iso(c.created_at),
      editedAt: c.edited_at ? iso(c.edited_at) : null,
      likeCount: 0,
      likedByMe: false,
    };
  }

  private async requireEvent(module: string, recordId: string, eventId: string): Promise<void> {
    await this.requireRecord(module, recordId);
    const page = await this.deps.history.list(module, recordId, { perPage: 100 });
    if (!page.events.some((e) => e.id === eventId)) throw new NotFoundError();
  }

  // ----- mentions / notifications -----------------------------------------

  private async mentionIds(tx: Transaction, kind: "post" | "comment", id: string) {
    const res = await tx.execute(
      sql`SELECT user_id FROM feed_mentions
          WHERE organization_id = ${this.ctx.orgId} AND source_kind = ${kind} AND source_id = ${id}`,
    );
    return (res.rows as Row[]).map((r) => String(r.user_id));
  }

  /** Stores mentions of active members only; returns the stored ids. */
  private async storeMentions(
    tx: Transaction,
    kind: "post" | "comment",
    sourceId: string,
    requested: readonly string[],
  ): Promise<string[]> {
    const candidates = [...new Set(requested)].filter(isUuid).slice(0, 50);
    const active = await this.activeMemberIds(tx, candidates);
    for (const userId of active) {
      await tx.execute(
        sql`INSERT INTO feed_mentions (organization_id, source_kind, source_id, user_id)
            VALUES (${this.ctx.orgId}, ${kind}, ${sourceId}, ${userId})
            ON CONFLICT DO NOTHING`,
      );
    }
    return active;
  }

  private async notifyMentions(
    tx: Transaction,
    mentioned: readonly string[],
    subject: {
      postId?: string;
      commentId?: string;
      recordModule?: string | null;
      recordId?: string | null;
    },
  ): Promise<void> {
    const out: FeedNotification[] = [];
    for (const userId of mentioned) {
      if (userId === this.ctx.userId) continue;
      // A user who cannot read the record gets no notification (no leak, ADR 0018 §4.2).
      if (
        subject.recordModule &&
        subject.recordId &&
        this.deps.canUserRead &&
        !(await this.deps.canUserRead(userId, subject.recordModule, subject.recordId))
      ) {
        continue;
      }
      out.push({
        kind: "mention",
        recipientUserId: userId,
        actorUserId: this.ctx.userId,
        subject: {
          ...(subject.postId ? { postId: subject.postId } : {}),
          ...(subject.commentId ? { commentId: subject.commentId } : {}),
          ...(subject.recordModule && subject.recordId
            ? { recordModule: subject.recordModule, recordId: subject.recordId }
            : {}),
        },
      });
    }
    await this.notify(tx, out);
  }

  private async notify(tx: Transaction, list: readonly FeedNotification[]): Promise<void> {
    const filtered = list.filter((n) => n.recipientUserId !== n.actorUserId);
    if (filtered.length && this.deps.notify) await this.deps.notify(tx, filtered);
  }

  // ----- likes -------------------------------------------------------------

  async like(
    kind: FeedLikeTarget,
    targetId: string,
    event?: { recordModule: string; recordId: string },
  ): Promise<void> {
    await withOrg(this.ctx, async (tx) => {
      const target = await this.likeTarget(tx, kind, targetId, event);
      const res = await tx.execute(
        sql`INSERT INTO feed_likes (organization_id, target_kind, target_id, user_id, record_module, record_id)
            VALUES (${this.ctx.orgId}, ${kind}, ${targetId}, ${this.ctx.userId},
                    ${target.recordModule}, ${target.recordId})
            ON CONFLICT DO NOTHING RETURNING user_id`,
      );
      if (res.rows.length > 0 && target.author && kind !== "history_event") {
        await this.notify(tx, [
          {
            kind: "post_like",
            recipientUserId: target.author,
            actorUserId: this.ctx.userId,
            subject: {
              ...(target.postId ? { postId: target.postId } : {}),
              ...(kind === "comment" ? { commentId: targetId } : {}),
              ...(target.recordModule && target.recordId
                ? { recordModule: target.recordModule, recordId: target.recordId }
                : {}),
            },
          },
        ]);
      }
    });
  }

  async unlike(kind: FeedLikeTarget, targetId: string): Promise<void> {
    await withOrg(this.ctx, async (tx) => {
      await tx.execute(
        sql`DELETE FROM feed_likes
            WHERE organization_id = ${this.ctx.orgId} AND target_kind = ${kind}
              AND target_id = ${targetId} AND user_id = ${this.ctx.userId}`,
      );
    });
  }

  private async likeTarget(
    tx: Transaction,
    kind: FeedLikeTarget,
    targetId: string,
    event?: { recordModule: string; recordId: string },
  ): Promise<{
    author: string | null;
    postId: string | null;
    recordModule: string | null;
    recordId: string | null;
  }> {
    if (kind === "post") {
      const post = await this.loadPost(tx, targetId);
      return { postId: targetId, ...post };
    }
    if (kind === "comment") {
      const c = await this.loadComment(tx, targetId);
      return {
        author: c.author,
        postId: c.postId,
        recordModule: c.recordModule,
        recordId: c.recordId,
      };
    }
    if (!event) throw new ValidationError({ recordModule: ["The record is required."] });
    await this.requireEvent(event.recordModule, event.recordId, targetId);
    return {
      author: null,
      postId: null,
      recordModule: event.recordModule,
      recordId: event.recordId,
    };
  }

  // ----- follows -----------------------------------------------------------

  async followState(module: string, recordId: string): Promise<FollowState> {
    const record = await this.requireRecord(module, recordId);
    return withOrg(this.ctx, async (tx) => {
      const res = await tx.execute(
        sql`SELECT muted FROM feed_follows
            WHERE organization_id = ${this.ctx.orgId} AND user_id = ${this.ctx.userId}
              AND target_kind = 'record' AND target_module = ${module} AND target_id = ${recordId}`,
      );
      const row = res.rows[0] as Row | undefined;
      if (row) return { following: !row.muted, implicit: false };
      if (ownerId(record) === this.ctx.userId) return { following: true, implicit: true };
      const authored = await tx.execute(
        sql`SELECT 1 FROM feed_posts
            WHERE organization_id = ${this.ctx.orgId} AND author_user_id = ${this.ctx.userId}
              AND record_module = ${module} AND record_id = ${recordId} AND deleted_at IS NULL LIMIT 1`,
      );
      return { following: authored.rows.length > 0, implicit: authored.rows.length > 0 };
    });
  }

  async follow(kind: FeedFollowTarget, targetId: string, module?: string): Promise<void> {
    const targetModule = await this.checkFollowTarget(kind, targetId, module);
    await withOrg(this.ctx, async (tx) => {
      await tx.execute(
        sql`INSERT INTO feed_follows (organization_id, user_id, target_kind, target_module, target_id, muted)
            VALUES (${this.ctx.orgId}, ${this.ctx.userId}, ${kind}, ${targetModule}, ${targetId}, false)
            ON CONFLICT (organization_id, user_id, target_kind, target_module, target_id)
            DO UPDATE SET muted = false`,
      );
    });
  }

  async unfollow(kind: FeedFollowTarget, targetId: string, module?: string): Promise<void> {
    const targetModule = await this.checkFollowTarget(kind, targetId, module);
    const record = kind === "record" ? await this.readRecord(targetModule, targetId) : null;
    await withOrg(this.ctx, async (tx) => {
      if (record && ownerId(record) === this.ctx.userId) {
        // Owner follows implicitly; the muted marker is the only way to stop (ADR 0018 §3).
        await tx.execute(
          sql`INSERT INTO feed_follows (organization_id, user_id, target_kind, target_module, target_id, muted)
              VALUES (${this.ctx.orgId}, ${this.ctx.userId}, 'record', ${targetModule}, ${targetId}, true)
              ON CONFLICT (organization_id, user_id, target_kind, target_module, target_id)
              DO UPDATE SET muted = true`,
        );
        return;
      }
      await tx.execute(
        sql`DELETE FROM feed_follows
            WHERE organization_id = ${this.ctx.orgId} AND user_id = ${this.ctx.userId}
              AND target_kind = ${kind} AND target_module = ${targetModule} AND target_id = ${targetId}`,
      );
    });
  }

  private async checkFollowTarget(
    kind: FeedFollowTarget,
    targetId: string,
    module?: string,
  ): Promise<string> {
    if (kind === "record") {
      if (!module) throw new ValidationError({ module: ["The module is required."] });
      await this.requireRecord(module, targetId);
      return module;
    }
    if (!isUuid(targetId)) throw new NotFoundError();
    if (targetId === this.ctx.userId) {
      throw new ValidationError({ userId: ["You cannot follow yourself."] });
    }
    const active = await withOrg(this.ctx, (tx) => this.activeMemberIds(tx, [targetId]));
    if (active.length === 0) throw new NotFoundError();
    return "";
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value: string): boolean {
  return UUID.test(value);
}

function isBefore(item: { at: string; id: string }, cursor: { at: string; id: string }): boolean {
  const a = Date.parse(item.at);
  const b = Date.parse(cursor.at);
  return a !== b ? a < b : item.id < cursor.id;
}

export function getFeedService(ctx: OrgContext, deps: FeedDeps): FeedService {
  return new FeedService(ctx, deps);
}
