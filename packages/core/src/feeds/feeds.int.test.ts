import pg from "pg";
import { describe, expect, it } from "vitest";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors";
import { createFixtureRecordService } from "../records/fixture";
import type { OrgContext } from "../tenancy/types";
import { addTestMember, createTestOrganization } from "../testing";
import { type FeedDeps, getFeedService } from "./service";
import type { FeedNotification } from "./types";

function depsFor(
  ctx: OrgContext,
  notified?: FeedNotification[],
): FeedDeps & { records: ReturnType<typeof createFixtureRecordService> } {
  const records = createFixtureRecordService(ctx);
  return {
    records,
    history: records.history,
    ...(notified
      ? {
          notify: async (_tx, list) => {
            notified.push(...list);
          },
        }
      : {}),
  };
}

async function newDeal(ctx: OrgContext, deps: ReturnType<typeof depsFor>, name = "Feed Deal") {
  void ctx;
  const account = await deps.records.create("Accounts", { Account_Name: "Feed Account" });
  const stage = "Qualification";
  return deps.records.create("Deals", {
    Deal_Name: name,
    Stage: stage,
    Closing_Date: "2030-01-01",
    Account_Name: { module: "Accounts", id: account.id },
  });
}

describe("feeds backend integration", () => {
  it("posts, comments, likes and mentions with author-only edit/delete", async () => {
    const { ctx: a } = await createTestOrganization();
    const b = await addTestMember(a, "member");
    const outsider = await createTestOrganization();
    const notes: FeedNotification[] = [];
    const feedA = getFeedService(a, depsFor(a, notes));
    const feedB = getFeedService(b.ctx, depsFor(b.ctx, notes));

    const post = await feedA.createPost({
      body: "<p>Hello <b>team</b><script>x</script></p>",
      mentionUserIds: [b.ctx.userId, outsider.ctx.userId, a.userId],
    });
    expect(post.body).not.toContain("script");
    expect(post.mentions.map((m) => m.id)).toEqual(expect.arrayContaining([b.ctx.userId]));
    expect(post.mentions.map((m) => m.id)).not.toContain(outsider.ctx.userId);
    expect(notes.map((n) => [n.kind, n.recipientUserId])).toEqual([["mention", b.ctx.userId]]);

    await expect(feedA.createPost({ body: "<p> </p>" })).rejects.toBeInstanceOf(ValidationError);

    const comment = await feedB.commentOnPost(post.id, { body: "<p>Nice</p>" });
    await feedB.like("post", post.id);
    await feedB.like("post", post.id);
    await feedA.like("comment", comment.id);
    const page = await feedA.list();
    const found = page.items.find((i) => i.id === post.id);
    expect(found?.type === "post" && found.commentCount).toBe(1);
    expect(found?.likeCount).toBe(1);
    expect(found?.likedByMe).toBe(false);
    expect(notes.map((n) => n.kind)).toEqual(["mention", "post_comment", "post_like", "post_like"]);

    await expect(feedB.editPost(post.id, { body: "<p>no</p>" })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(feedB.deletePost(post.id)).rejects.toBeInstanceOf(ForbiddenError);
    await feedB.unlike("post", post.id);
    const edited = await feedA.editPost(post.id, { body: "<p>Edited</p>" });
    expect(edited.editedAt).not.toBeNull();
    await feedB.deleteComment(comment.id);
    await feedA.deletePost(post.id);
    expect((await feedA.list()).items.find((i) => i.id === post.id)).toBeUndefined();
    await expect(feedA.commentOnPost(post.id, { body: "<p>x</p>" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("record feed shows field changes, follow state and mute of owned records", async () => {
    const { ctx } = await createTestOrganization();
    const deps = depsFor(ctx);
    const feed = getFeedService(ctx, deps);
    const deal = await newDeal(ctx, deps);
    await deps.records.update("Deals", deal.id, { Stage: "Negotiation/Review" });

    const record = await feed.listForRecord("Deals", deal.id);
    const event = record.items.find((i) => i.type === "event" && i.eventKind === "fields_updated");
    expect(event?.type === "event" && event.changes.some((c) => c.apiName === "Stage")).toBe(true);

    await feed.commentOnEvent(event?.id ?? "", {
      body: "<p>why</p>",
      recordModule: "Deals",
      recordId: deal.id,
    });
    await feed.like("history_event", event?.id ?? "", { recordModule: "Deals", recordId: deal.id });
    const again = await feed.listForRecord("Deals", deal.id);
    const e2 = again.items.find((i) => i.id === event?.id);
    expect([e2?.commentCount, e2?.likeCount]).toEqual([1, 1]);

    expect(await feed.followState("Deals", deal.id)).toEqual({ following: true, implicit: true });
    await feed.unfollow("record", deal.id, "Deals");
    expect((await feed.followState("Deals", deal.id)).following).toBe(false);
    expect(
      (await feed.list({ filter: "followed" })).items.some(
        (i) => i.type === "event" && i.record.id === deal.id,
      ),
    ).toBe(false);
    await feed.follow("record", deal.id, "Deals");
    expect((await feed.followState("Deals", deal.id)).following).toBe(true);
    expect(
      (await feed.list({ filter: "followed" })).items.some(
        (i) => i.type === "event" && i.record.id === deal.id,
      ),
    ).toBe(true);
    await expect(feed.listForRecord("Deals", "missing")).rejects.toBeInstanceOf(NotFoundError);
    await expect(feed.listForRecord("Tasks", "1")).rejects.toBeInstanceOf(ValidationError);
  });

  it("filters mine and followed users, pages by cursor", async () => {
    const { ctx: a } = await createTestOrganization();
    const b = await addTestMember(a, "member");
    const feedA = getFeedService(a, depsFor(a));
    const feedB = getFeedService(b.ctx, depsFor(b.ctx));
    for (let i = 0; i < 5; i++) await feedA.createPost({ body: `<p>a${i}</p>` });
    await feedB.createPost({ body: "<p>from b</p>" });

    const posts = (page: { items: readonly { type: string }[] }) =>
      page.items.filter((i) => i.type === "post");
    expect(posts(await feedA.list({ filter: "mine" }))).toHaveLength(5);
    expect(posts(await feedA.list({ filter: "followed" }))).toHaveLength(5);
    await feedA.follow("user", b.ctx.userId);
    expect(posts(await feedA.list({ filter: "followed" }))).toHaveLength(6);
    await expect(feedA.follow("user", a.userId)).rejects.toBeInstanceOf(ValidationError);

    const first = await feedA.list({ limit: 4 });
    expect(first.items).toHaveLength(4);
    expect(first.nextCursor).not.toBeNull();
    const second = await feedA.list({ limit: 4, cursor: first.nextCursor });
    const ids = [...first.items, ...second.items].map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(6);
    await expect(feedA.list({ cursor: "garbage!" })).rejects.toBeInstanceOf(ValidationError);
  });

  it("isolates tenants through RLS and enforces unique likes/follows", async () => {
    const { ctx: a } = await createTestOrganization();
    const { ctx: other } = await createTestOrganization();
    const feedA = getFeedService(a, depsFor(a));
    const post = await feedA.createPost({ body: "<p>secret</p>" });
    await feedA.like("post", post.id);
    await feedA.like("post", post.id);

    const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await admin.connect();
    try {
      await admin.query("alter role crm_app password 'test-runtime'");
      const url = new URL(process.env.DATABASE_URL ?? "");
      url.username = "crm_app";
      url.password = "test-runtime";
      const app = new pg.Client({ connectionString: url.toString() });
      await app.connect();
      try {
        await app.query("begin");
        await app.query("select set_config('app.org_id', $1, true)", [other.orgId]);
        for (const table of [
          "feed_posts",
          "feed_comments",
          "feed_likes",
          "feed_mentions",
          "feed_follows",
        ]) {
          expect((await app.query(`select 1 from ${table}`)).rows).toHaveLength(0);
        }
        await app.query("rollback");
      } finally {
        await app.end();
      }
      const likes = await admin.query(
        "select count(*)::int as n from feed_likes where target_id = $1",
        [post.id],
      );
      expect(likes.rows[0].n).toBe(1);
    } finally {
      await admin.end();
    }
    await expect(
      getFeedService(other, depsFor(other)).editPost(post.id, { body: "<p>x</p>" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
