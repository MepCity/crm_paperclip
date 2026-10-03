import { schema } from "@crm/db";
import { and, eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "../database";
import { ConflictError, ForbiddenError, NotFoundError, UnauthenticatedError } from "../errors";
import { addTestMember, createTestOrganization, createTestUser } from "../testing";
import {
  acceptInvitation,
  changeMemberRole,
  createInvitation,
  createOrganization,
  getInvitationPreview,
  listInvitations,
  listMembers,
  listOrganizationsForUser,
  removeMember,
  requireOrgContext,
  revokeInvitation,
  withOrg,
} from "./index";

describe("organizations", () => {
  it("creates the organization and admin in one transaction, sorts by name, and rejects a used slug", async () => {
    const admin = await createTestUser();
    const first = await createOrganization(admin.user, {
      name: "Zebra",
      slug: `z-${crypto.randomUUID()}`,
    });
    const second = await createOrganization(admin.user, {
      name: "Alpha",
      slug: `a-${crypto.randomUUID()}`,
    });
    expect(
      (await listOrganizationsForUser(admin.user.id)).map((org) => [org.name, org.role]),
    ).toEqual([
      ["Alpha", "admin"],
      ["Zebra", "admin"],
    ]);
    await expect(
      createOrganization(admin.user, { name: "Duplicate", slug: first.slug }),
    ).rejects.toMatchObject({ fieldErrors: { slug: expect.any(Array) } });
    const rows = await getDb()
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, first.slug));
    expect(rows).toHaveLength(1);
    expect(second.id).not.toBe(first.id);
  });

  it("returns the same not found error for absent and inaccessible organizations", async () => {
    const { org } = await createTestOrganization();
    const stranger = await createTestUser();
    await expect(requireOrgContext(new Headers(), org.slug)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
    const absent = await requireOrgContext(
      stranger.headers,
      `missing-${crypto.randomUUID().slice(0, 8)}`,
    ).catch((error) => error);
    const inaccessible = await requireOrgContext(stranger.headers, org.slug).catch(
      (error) => error,
    );
    expect(absent).toBeInstanceOf(NotFoundError);
    expect(inaccessible).toBeInstanceOf(NotFoundError);
    expect(absent.message).toBe(inaccessible.message);
  });

  it("returns a slug field error for concurrent creation of the same slug", async () => {
    const admin = await createTestUser();
    const slug = `race-${crypto.randomUUID().slice(0, 8)}`;
    const results = await Promise.allSettled([
      createOrganization(admin.user, { name: "First", slug }),
      createOrganization(admin.user, { name: "Second", slug }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected).toMatchObject({ reason: { fieldErrors: { slug: expect.any(Array) } } });
    expect(
      await getDb().select().from(schema.organizations).where(eq(schema.organizations.slug, slug)),
    ).toHaveLength(1);
  });

  it("keeps app.org_id local to withOrg's transaction", async () => {
    const { ctx } = await createTestOrganization();
    const inside = await withOrg(ctx, async (tx) =>
      tx.execute(sql`select current_setting('app.org_id', true) as value`),
    );
    expect(inside.rows[0]).toMatchObject({ value: ctx.orgId });
    const outside = await getDb().execute(sql`select current_setting('app.org_id', true) as value`);
    expect(outside.rows[0]).toMatchObject({ value: "" });
  });
});

describe("members and isolation", () => {
  it("lists members to members, with names and join dates, and excludes another organization", async () => {
    const a = await createTestOrganization();
    const b = await createTestOrganization();
    const member = await addTestMember(a.ctx, "member");
    expect(await listMembers(member.ctx)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: member.user.id,
          name: member.user.name,
          email: member.user.email,
          role: "member",
          joinedAt: expect.any(Date),
        }),
      ]),
    );
    const bMembers = await listMembers(b.ctx);
    expect(bMembers.map((row) => row.userId)).not.toContain(a.admin.user.id);
    expect(bMembers.map((row) => row.userId)).not.toContain(member.user.id);
    expect(await listMembers(a.ctx)).toHaveLength(2);
  });

  it("changes a member's role, rejects a member caller, and cannot change an A member through B", async () => {
    const a = await createTestOrganization();
    const b = await createTestOrganization();
    const member = await addTestMember(a.ctx, "member");
    await expect(
      changeMemberRole(member.ctx, { userId: a.admin.user.id, role: "member" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(
      changeMemberRole(b.ctx, { userId: member.user.id, role: "admin" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect((await listMembers(a.ctx)).find((row) => row.userId === member.user.id)?.role).toBe(
      "member",
    );
    await changeMemberRole(a.ctx, { userId: member.user.id, role: "admin" });
    expect((await listMembers(a.ctx)).find((row) => row.userId === member.user.id)?.role).toBe(
      "admin",
    );
  });

  it("removes a member, rejects a member caller, and cannot remove an A member through B", async () => {
    const a = await createTestOrganization();
    const b = await createTestOrganization();
    const member = await addTestMember(a.ctx, "member");
    await expect(removeMember(member.ctx, { userId: a.admin.user.id })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(removeMember(b.ctx, { userId: member.user.id })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect((await listMembers(a.ctx)).map((row) => row.userId)).toContain(member.user.id);
    await removeMember(a.ctx, { userId: member.user.id });
    expect((await listMembers(a.ctx)).map((row) => row.userId)).not.toContain(member.user.id);
    await expect(listMembers(member.ctx)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("protects the last admin from demotion and removal", async () => {
    const { ctx, admin } = await createTestOrganization();
    await expect(
      changeMemberRole(ctx, { userId: admin.user.id, role: "member" }),
    ).rejects.toBeInstanceOf(ConflictError);
    await expect(removeMember(ctx, { userId: admin.user.id })).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect((await listMembers(ctx)).filter((row) => row.role === "admin")).toHaveLength(1);
  });

  it("preserves an admin when two admins concurrently demote each other", async () => {
    const { ctx, admin } = await createTestOrganization();
    const other = await addTestMember(ctx, "admin");
    const results = await Promise.allSettled([
      changeMemberRole(ctx, { userId: other.user.id, role: "member" }),
      changeMemberRole(other.ctx, { userId: admin.user.id, role: "member" }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await listMembers(ctx)).filter((row) => row.role === "admin")).toHaveLength(1);
  });
});

describe("invitations and isolation", () => {
  it("creates a seven day invitation with a digest only, and B can create only B invitations", async () => {
    const a = await createTestOrganization();
    const b = await createTestOrganization();
    const invitee = await createTestUser();
    const before = Date.now();
    const { invitation, token } = await createInvitation(a.ctx, {
      email: invitee.user.email.toUpperCase(),
      role: "member",
    });
    expect(invitation.email).toBe(invitee.user.email);
    expect(invitation.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 7 * 24 * 60 * 60 * 1000);
    expect(invitation.tokenHash).not.toBe(token);
    const raw = await getDb().execute(
      sql`select row_to_json(i)::text as value from invitations i where id = ${invitation.id}`,
    );
    expect(String(raw.rows[0]?.value)).not.toContain(token);
    await createInvitation(b.ctx, { email: invitee.user.email, role: "member" });
    expect((await listInvitations(a.ctx)).map((row) => row.id)).toEqual([invitation.id]);
    expect((await listInvitations(b.ctx)).map((row) => row.id)).not.toContain(invitation.id);
    await expect(
      createInvitation(a.ctx, { email: a.admin.user.email, role: "member" }),
    ).rejects.toMatchObject({ fieldErrors: { email: expect.any(Array) } });
    expect((await listInvitations(a.ctx)).map((row) => row.id)).toEqual([invitation.id]);
  });

  it("lists only pending invitations to admins and excludes A from B", async () => {
    const a = await createTestOrganization();
    const b = await createTestOrganization();
    const member = await addTestMember(a.ctx, "member");
    const { invitation } = await createInvitation(a.ctx, {
      email: `p-${crypto.randomUUID()}@example.test`,
      role: "member",
    });
    await expect(
      createInvitation(member.ctx, {
        email: `forbidden-${crypto.randomUUID()}@example.test`,
        role: "member",
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listInvitations(member.ctx)).rejects.toBeInstanceOf(ForbiddenError);
    expect((await listInvitations(a.ctx)).map((row) => row.id)).toContain(invitation.id);
    expect((await listInvitations(b.ctx)).map((row) => row.id)).not.toContain(invitation.id);
    expect((await listInvitations(a.ctx)).map((row) => row.id)).toContain(invitation.id);
  });

  it("revokes only an own pending invitation and leaves A unchanged when B supplies A's id", async () => {
    const a = await createTestOrganization();
    const b = await createTestOrganization();
    const member = await addTestMember(a.ctx, "member");
    const { invitation, token } = await createInvitation(a.ctx, {
      email: `r-${crypto.randomUUID()}@example.test`,
      role: "member",
    });
    await expect(
      revokeInvitation(member.ctx, { invitationId: invitation.id }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(revokeInvitation(b.ctx, { invitationId: invitation.id })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect((await getInvitationPreview(token))?.status).toBe("pending");
    await revokeInvitation(a.ctx, { invitationId: invitation.id });
    expect((await getInvitationPreview(token))?.status).toBe("revoked");
    expect((await listInvitations(a.ctx)).map((row) => row.id)).not.toContain(invitation.id);
  });

  it("previews and accepts once, rejecting a different email and a reused token", async () => {
    const { ctx, org } = await createTestOrganization();
    const invitee = await createTestUser();
    const stranger = await createTestUser();
    const { token } = await createInvitation(ctx, { email: invitee.user.email, role: "admin" });
    expect(await getInvitationPreview("unknown-token")).toBeNull();
    expect(await getInvitationPreview(token)).toEqual({
      organizationName: org.name,
      email: invitee.user.email,
      role: "admin",
      status: "pending",
    });
    await expect(acceptInvitation(stranger.user, { token })).rejects.toBeInstanceOf(ForbiddenError);
    expect(await acceptInvitation(invitee.user, { token })).toEqual({ orgSlug: org.slug });
    expect((await getInvitationPreview(token))?.status).toBe("accepted");
    await expect(acceptInvitation(invitee.user, { token })).rejects.toBeInstanceOf(NotFoundError);
    await expect(acceptInvitation(invitee.user, { token: "unknown-token" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect((await listMembers(ctx)).filter((row) => row.userId === invitee.user.id)).toHaveLength(
      1,
    );
  });

  it("expires invitations and revokes the old token when an email is invited again", async () => {
    const { ctx } = await createTestOrganization();
    const invitee = await createTestUser();
    const first = await createInvitation(ctx, { email: invitee.user.email, role: "member" });
    const second = await createInvitation(ctx, { email: invitee.user.email, role: "admin" });
    expect((await getInvitationPreview(first.token))?.status).toBe("revoked");
    await expect(acceptInvitation(invitee.user, { token: first.token })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await getDb()
      .update(schema.invitations)
      .set({ expiresAt: new Date(0) })
      .where(
        and(
          eq(schema.invitations.organizationId, ctx.orgId),
          eq(schema.invitations.id, second.invitation.id),
        ),
      );
    expect((await getInvitationPreview(second.token))?.status).toBe("expired");
    await expect(acceptInvitation(invitee.user, { token: second.token })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(await listInvitations(ctx)).toHaveLength(0);
  });

  it("allows only one of two concurrent accepts", async () => {
    const { ctx } = await createTestOrganization();
    const invitee = await createTestUser();
    const { token } = await createInvitation(ctx, { email: invitee.user.email, role: "member" });
    const results = await Promise.allSettled([
      acceptInvitation(invitee.user, { token }),
      acceptInvitation(invitee.user, { token }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await listMembers(ctx)).filter((row) => row.userId === invitee.user.id)).toHaveLength(
      1,
    );
  });
});
