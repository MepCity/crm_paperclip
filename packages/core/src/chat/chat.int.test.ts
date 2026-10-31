import { sql } from "drizzle-orm";
import pg from "pg";
import { describe, expect, it } from "vitest";
import { NotFoundError } from "../errors";
import { withOrg } from "../tenancy";
import { addTestMember, createTestOrganization } from "../testing";
import { getChatService } from "./service";

describe("chat backend integration", () => {
  it("enforces RLS cross-tenant isolation", async () => {
    const chat = getChatService();
    const { ctx: orgA } = await createTestOrganization();
    const { ctx: orgB } = await createTestOrganization();

    const convA = await chat.createConversation(orgA, {
      kind: "channel",
      name: "Org A General",
      visibility: "public",
    });

    const msgA = await chat.postMessage(orgA, convA.id, {
      body: "Hello from tenant A",
    });

    // Probe as restricted crm_app role with tenant B context
    const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
    await admin.connect();
    try {
      await admin.query("alter role crm_app password 'test-runtime'");
      const url = new URL(process.env.DATABASE_URL ?? "");
      url.username = "crm_app";
      url.password = "test-runtime";
      const appClient = new pg.Client({ connectionString: url.toString() });
      await appClient.connect();
      try {
        await appClient.query("begin");
        await appClient.query("select set_config('app.org_id', $1, true)", [orgB.orgId]);
        const convProbe = await appClient.query("select * from chat_conversations where id = $1", [
          convA.id,
        ]);
        expect(convProbe.rows).toHaveLength(0);

        const msgProbe = await appClient.query("select * from chat_messages where id = $1", [
          msgA.id,
        ]);
        expect(msgProbe.rows).toHaveLength(0);
        await appClient.query("rollback");
      } finally {
        await appClient.end();
      }
    } finally {
      await admin.end();
    }

    // Service call from tenant B returns NotFound
    await expect(chat.getConversation(orgB, convA.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(chat.getMessages(orgB, convA.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("returns 404 for non-members on private channels and direct conversations", async () => {
    const chat = getChatService();
    const { ctx: orgAdmin } = await createTestOrganization();
    const member1 = await addTestMember(orgAdmin, "member");
    const member2 = await addTestMember(orgAdmin, "member");
    const outsider = await addTestMember(orgAdmin, "member");

    // Direct conversation between member1 and member2
    const direct = await chat.createConversation(member1.ctx, {
      kind: "direct",
      userId: member2.user.id,
    });

    // Outsider cannot view or post
    await expect(chat.getConversation(outsider.ctx, direct.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(chat.getMessages(outsider.ctx, direct.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      chat.postMessage(outsider.ctx, direct.id, { body: "Intruder" }),
    ).rejects.toBeInstanceOf(NotFoundError);

    // Private channel created by member1
    const privateChannel = await chat.createConversation(member1.ctx, {
      kind: "channel",
      name: "Secret Team",
      visibility: "private",
    });

    await expect(chat.getConversation(outsider.ctx, privateChannel.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      chat.postMessage(outsider.ctx, privateChannel.id, { body: "Intruder" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("calculates unread = last_seq - last_read_seq and ensures read never moves back", async () => {
    const chat = getChatService();
    const { ctx: adminCtx } = await createTestOrganization();
    const member = await addTestMember(adminCtx, "member");

    // Create public channel
    const channel = await chat.createConversation(adminCtx, {
      kind: "channel",
      name: "Announcements",
      visibility: "public",
    });

    // Admin posts 3 messages
    await chat.postMessage(adminCtx, channel.id, { body: "Msg 1" });
    await chat.postMessage(adminCtx, channel.id, { body: "Msg 2" });
    await chat.postMessage(adminCtx, channel.id, { body: "Msg 3" });

    // Member joins channel
    await chat.addMember(member.ctx, channel.id, { userId: member.user.id });

    // Initial unread count should be 3
    const convBefore = await chat.getConversation(member.ctx, channel.id);
    expect(convBefore.unreadCount).toBe(3);

    // Member marks read at seq 2
    await chat.markConversationRead(member.ctx, channel.id, 2);
    const convAfter = await chat.getConversation(member.ctx, channel.id);
    expect(convAfter.unreadCount).toBe(1);

    // Member attempts to mark read backwards at seq 1
    await chat.markConversationRead(member.ctx, channel.id, 1);
    const convUnchanged = await chat.getConversation(member.ctx, channel.id);
    expect(convUnchanged.unreadCount).toBe(1);
    expect(convUnchanged.lastReadSeq).toBe(2);
  });

  it("serializes concurrent posts to assign distinct consecutive sequence numbers", async () => {
    const chat = getChatService();
    const { ctx } = await createTestOrganization();

    const channel = await chat.createConversation(ctx, {
      kind: "channel",
      name: "Concurrency Test",
      visibility: "public",
    });

    const posts = await Promise.all([
      chat.postMessage(ctx, channel.id, { body: "P1" }),
      chat.postMessage(ctx, channel.id, { body: "P2" }),
      chat.postMessage(ctx, channel.id, { body: "P3" }),
      chat.postMessage(ctx, channel.id, { body: "P4" }),
      chat.postMessage(ctx, channel.id, { body: "P5" }),
    ]);

    const seqs = posts.map((p) => p.seq).sort((a, b) => Number(a) - Number(b));
    expect(seqs).toEqual([1, 2, 3, 4, 5]);

    const updatedConv = await chat.getConversation(ctx, channel.id);
    expect(updatedConv.lastSeq).toBe(5);
  });

  it("returns only visible changes in sync and correctly computes badges", async () => {
    const chat = getChatService();
    const { ctx: adminCtx } = await createTestOrganization();
    const userA = await addTestMember(adminCtx, "member");
    const userB = await addTestMember(adminCtx, "member");

    // Sync from 0
    const sync0 = await chat.sync(userA.ctx, 0);
    expect(sync0.cursor).toBeGreaterThanOrEqual(0);

    // User A and User B direct conversation
    const direct = await chat.createConversation(userA.ctx, {
      kind: "direct",
      userId: userB.user.id,
    });

    // Pin direct conversation
    await chat.pinConversation(userA.ctx, direct.id, true);

    // User B sends a message
    await chat.postMessage(userB.ctx, direct.id, { body: "Hello A" });

    // User A syncs with sync0.cursor
    const sync1 = await chat.sync(userA.ctx, sync0.cursor);
    expect(sync1.cursor).toBeGreaterThan(sync0.cursor);
    expect(sync1.messages.some((m) => m.body === "Hello A")).toBe(true);
    expect(sync1.badges.unreadChats).toBe(1);
    expect(sync1.badges.unreadPins).toBe(1);
    expect(sync1.badges.unreadTotal).toBe(1);
  });

  it("handles soft delete by clearing body and removing from full-text search", async () => {
    const chat = getChatService();
    const { ctx } = await createTestOrganization();

    const channel = await chat.createConversation(ctx, {
      kind: "channel",
      name: "Search Test",
      visibility: "public",
    });

    const msg = await chat.postMessage(ctx, channel.id, {
      body: "ConfidentialBananaKey123",
    });

    // Search matches before deletion
    const searchBefore = await chat.search(ctx, { q: "ConfidentialBananaKey123" });
    expect(searchBefore.messages.some((m) => m.id === msg.id)).toBe(true);

    // Soft delete
    await chat.deleteMessage(ctx, msg.id);

    // Search no longer matches
    const searchAfter = await chat.search(ctx, { q: "ConfidentialBananaKey123" });
    expect(searchAfter.messages.some((m) => m.id === msg.id)).toBe(false);

    // Message query shows deleted status and blank body
    const history = await chat.getMessages(ctx, channel.id);
    const deleted = history.messages.find((m) => m.id === msg.id);
    expect(deleted?.deletedAt).not.toBeNull();
    expect(deleted?.body).toBe("");
  });

  it("filters search by sender, conversation, and links", async () => {
    const chat = getChatService();
    const { ctx: adminCtx } = await createTestOrganization();
    const member = await addTestMember(adminCtx, "member");

    const channel = await chat.createConversation(adminCtx, {
      kind: "channel",
      name: "Links and Mentions",
      visibility: "public",
    });
    await chat.addMember(member.ctx, channel.id, { userId: member.user.id });

    const msg1 = await chat.postMessage(adminCtx, channel.id, {
      body: "Check out https://example.com for info",
    });
    const msg2 = await chat.postMessage(member.ctx, channel.id, {
      body: "Plain text without links",
    });

    // Filter by hasLink
    const linkResults = await chat.search(adminCtx, { hasLink: true });
    expect(linkResults.messages.some((m) => m.id === msg1.id)).toBe(true);
    expect(linkResults.messages.some((m) => m.id === msg2.id)).toBe(false);

    // Filter by from
    const fromMemberResults = await chat.search(adminCtx, { from: member.user.id });
    expect(fromMemberResults.messages.some((m) => m.id === msg2.id)).toBe(true);
    expect(fromMemberResults.messages.some((m) => m.id === msg1.id)).toBe(false);
  });

  it("handles presence: invisible shown as offline to others, offline after 60s", async () => {
    const chat = getChatService();
    const { ctx: adminCtx } = await createTestOrganization();
    const member = await addTestMember(adminCtx, "member");

    // Admin sets presence to invisible
    await chat.setPresence(adminCtx, "invisible");

    // Member checks contacts list
    const contacts = await chat.listContacts(member.ctx, "frequent");
    const adminContact = contacts.find((c) => c.userId === adminCtx.userId);
    expect(adminContact?.status).toBe("offline");

    // Admin sets presence with timestamp older than 60s
    await withOrg(adminCtx, async (tx) => {
      await tx.execute(
        sql`UPDATE chat_presence SET status = 'available', last_seen_at = now() - interval '65 seconds'
        WHERE organization_id = ${adminCtx.orgId} AND user_id = ${adminCtx.userId}`,
      );
    });

    const contactsAfterExpiry = await chat.listContacts(member.ctx, "frequent");
    const expiredContact = contactsAfterExpiry.find((c) => c.userId === adminCtx.userId);
    expect(expiredContact?.status).toBe("offline");
  });
});
