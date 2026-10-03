import { schema } from "@crm/db";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { requireUser, type SessionUser } from "../auth";
import { getDb } from "../database";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  parseInput,
  ValidationError,
} from "../errors";
import type {
  Invitation,
  InvitationPreview,
  Member,
  Organization,
  OrgContext,
  OrgRole,
  Transaction,
} from "./types";
import {
  createInvitationToken,
  emailInput,
  hashInvitationToken,
  roleInput,
  slugInput,
  tokenInput,
  uuidInput,
} from "./validation";

export type {
  Invitation,
  InvitationPreview,
  Member,
  Organization,
  OrgContext,
  OrgRole,
  Transaction,
} from "./types";
export { createInvitationToken, hashInvitationToken, slugInput } from "./validation";

const missingOrg = () => new NotFoundError();
const pending = (now: Date) =>
  and(
    isNull(schema.invitations.acceptedAt),
    isNull(schema.invitations.revokedAt),
    gt(schema.invitations.expiresAt, now),
  );
const orgInput = z.object({ name: z.string().trim().min(1).max(200), slug: slugInput });

function isUniqueViolation(error: unknown, constraint: string): boolean {
  const dbError = error as {
    code?: string;
    constraint?: string;
    cause?: { code?: string; constraint?: string };
  };
  return (
    (dbError.code === "23505" && dbError.constraint === constraint) ||
    (dbError.cause?.code === "23505" && dbError.cause.constraint === constraint)
  );
}

export async function createOrganization(
  user: SessionUser,
  input: { name: string; slug: string },
): Promise<Organization> {
  const values = parseInput(orgInput, input);
  try {
    return await getDb().transaction(async (tx) => {
      const [org] = await tx.insert(schema.organizations).values(values).returning();
      if (!org) throw new Error("Organization insert returned no row");
      await tx
        .insert(schema.memberships)
        .values({ organizationId: org.id, userId: user.id, role: "admin" });
      return org;
    });
  } catch (error) {
    if (isUniqueViolation(error, "organizations_slug_unique"))
      throw new ValidationError({ slug: ["This slug is already in use."] });
    throw error;
  }
}

export async function listOrganizationsForUser(
  userId: string,
): Promise<Array<Organization & { role: OrgRole }>> {
  const id = parseInput(uuidInput, userId);
  const rows = await getDb()
    .select({ org: schema.organizations, role: schema.memberships.role })
    .from(schema.memberships)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.memberships.organizationId))
    .where(eq(schema.memberships.userId, id))
    .orderBy(schema.organizations.name, schema.organizations.id);
  return rows.map(({ org, role }) => ({ ...org, role: role as OrgRole }));
}

export async function requireOrgContext(headers: Headers, orgSlug: string): Promise<OrgContext> {
  const user = await requireUser(headers);
  const slug = parseInput(slugInput, orgSlug);
  const [row] = await getDb()
    .select({ org: schema.organizations, role: schema.memberships.role })
    .from(schema.organizations)
    .innerJoin(schema.memberships, eq(schema.memberships.organizationId, schema.organizations.id))
    .where(and(eq(schema.organizations.slug, slug), eq(schema.memberships.userId, user.id)));
  if (!row) throw missingOrg();
  return {
    orgId: row.org.id,
    orgSlug: row.org.slug,
    orgName: row.org.name,
    userId: user.id,
    role: row.role as OrgRole,
  };
}

export async function withOrg<T>(
  ctx: OrgContext,
  work: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.org_id', ${ctx.orgId}, true)`);
    return work(tx);
  });
}

async function requireCurrentAdmin(tx: Transaction, ctx: OrgContext): Promise<void> {
  if (ctx.role !== "admin") throw new ForbiddenError();
  const [row] = await tx
    .select({ role: schema.memberships.role })
    .from(schema.memberships)
    .where(
      and(
        eq(schema.memberships.organizationId, ctx.orgId),
        eq(schema.memberships.userId, ctx.userId),
      ),
    );
  if (row?.role !== "admin") throw new ForbiddenError();
}

async function requireCurrentMember(tx: Transaction, ctx: OrgContext): Promise<void> {
  const [row] = await tx
    .select({ userId: schema.memberships.userId })
    .from(schema.memberships)
    .where(
      and(
        eq(schema.memberships.organizationId, ctx.orgId),
        eq(schema.memberships.userId, ctx.userId),
      ),
    );
  if (!row) throw missingOrg();
}

async function lockOrganization(tx: Transaction, ctx: OrgContext): Promise<void> {
  const [row] = await tx
    .select({ id: schema.organizations.id })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, ctx.orgId))
    .for("update");
  if (!row) throw missingOrg();
}

export async function listMembers(ctx: OrgContext): Promise<Member[]> {
  return withOrg(ctx, async (tx) => {
    await requireCurrentMember(tx, ctx);
    const rows = await tx
      .select({
        userId: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.memberships.role,
        joinedAt: schema.memberships.createdAt,
      })
      .from(schema.memberships)
      .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
      .where(eq(schema.memberships.organizationId, ctx.orgId))
      .orderBy(schema.users.name, schema.users.id);
    return rows.map((row) => ({ ...row, role: row.role as OrgRole }));
  });
}

const memberChangeInput = z.object({ userId: uuidInput, role: roleInput });
const memberIdInput = z.object({ userId: uuidInput });

async function preserveAdmin(tx: Transaction, ctx: OrgContext, targetRole: string): Promise<void> {
  if (targetRole !== "admin") return;
  const [count] = await tx
    .select({ total: sql<number>`count(*)::int` })
    .from(schema.memberships)
    .where(
      and(eq(schema.memberships.organizationId, ctx.orgId), eq(schema.memberships.role, "admin")),
    );
  if ((count?.total ?? 0) <= 1) throw new ConflictError("An organization must have an admin.");
}

export async function changeMemberRole(
  ctx: OrgContext,
  input: { userId: string; role: OrgRole },
): Promise<void> {
  const values = parseInput(memberChangeInput, input);
  await withOrg(ctx, async (tx) => {
    await lockOrganization(tx, ctx);
    await requireCurrentAdmin(tx, ctx);
    const [target] = await tx
      .select({ role: schema.memberships.role })
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.organizationId, ctx.orgId),
          eq(schema.memberships.userId, values.userId),
        ),
      );
    if (!target) throw new NotFoundError();
    if (target.role === "admin" && values.role !== "admin")
      await preserveAdmin(tx, ctx, target.role);
    await tx
      .update(schema.memberships)
      .set({ role: values.role })
      .where(
        and(
          eq(schema.memberships.organizationId, ctx.orgId),
          eq(schema.memberships.userId, values.userId),
        ),
      );
  });
}

export async function removeMember(ctx: OrgContext, input: { userId: string }): Promise<void> {
  const values = parseInput(memberIdInput, input);
  await withOrg(ctx, async (tx) => {
    await lockOrganization(tx, ctx);
    await requireCurrentAdmin(tx, ctx);
    const [target] = await tx
      .select({ role: schema.memberships.role })
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.organizationId, ctx.orgId),
          eq(schema.memberships.userId, values.userId),
        ),
      );
    if (!target) throw new NotFoundError();
    await preserveAdmin(tx, ctx, target.role);
    await tx
      .delete(schema.memberships)
      .where(
        and(
          eq(schema.memberships.organizationId, ctx.orgId),
          eq(schema.memberships.userId, values.userId),
        ),
      );
  });
}

const inviteInput = z.object({ email: emailInput, role: roleInput });
export async function createInvitation(
  ctx: OrgContext,
  input: { email: string; role: OrgRole },
): Promise<{ invitation: Invitation; token: string }> {
  const values = parseInput(inviteInput, input);
  return withOrg(ctx, async (tx) => {
    await lockOrganization(tx, ctx);
    await requireCurrentAdmin(tx, ctx);
    const [member] = await tx
      .select({ userId: schema.memberships.userId })
      .from(schema.memberships)
      .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
      .where(
        and(eq(schema.memberships.organizationId, ctx.orgId), eq(schema.users.email, values.email)),
      );
    if (member) throw new ValidationError({ email: ["This email is already a member."] });
    const now = new Date();
    await tx
      .update(schema.invitations)
      .set({ revokedAt: now })
      .where(
        and(
          eq(schema.invitations.organizationId, ctx.orgId),
          eq(schema.invitations.email, values.email),
          pending(now),
        ),
      );
    const { token, hash } = createInvitationToken();
    const [invitation] = await tx
      .insert(schema.invitations)
      .values({
        organizationId: ctx.orgId,
        email: values.email,
        role: values.role,
        tokenHash: hash,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        invitedBy: ctx.userId,
      })
      .returning();
    if (!invitation) throw new Error("Invitation insert returned no row");
    return { invitation, token };
  });
}

export async function listInvitations(ctx: OrgContext): Promise<Invitation[]> {
  return withOrg(ctx, async (tx) => {
    await requireCurrentAdmin(tx, ctx);
    return tx
      .select()
      .from(schema.invitations)
      .where(and(eq(schema.invitations.organizationId, ctx.orgId), pending(new Date())))
      .orderBy(schema.invitations.createdAt, schema.invitations.id);
  });
}

export async function revokeInvitation(
  ctx: OrgContext,
  input: { invitationId: string },
): Promise<void> {
  const { invitationId } = parseInput(z.object({ invitationId: uuidInput }), input);
  await withOrg(ctx, async (tx) => {
    await requireCurrentAdmin(tx, ctx);
    const changed = await tx
      .update(schema.invitations)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(schema.invitations.organizationId, ctx.orgId),
          eq(schema.invitations.id, invitationId),
          pending(new Date()),
        ),
      )
      .returning({ id: schema.invitations.id });
    if (!changed.length) throw new NotFoundError();
  });
}

export async function getInvitationPreview(token: string): Promise<InvitationPreview | null> {
  const value = parseInput(tokenInput, token);
  const [row] = await getDb()
    .select({ invitation: schema.invitations, organizationName: schema.organizations.name })
    .from(schema.invitations)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.invitations.organizationId))
    .where(eq(schema.invitations.tokenHash, hashInvitationToken(value)));
  if (!row) return null;
  const invitation = row.invitation;
  const status = invitation.acceptedAt
    ? "accepted"
    : invitation.revokedAt
      ? "revoked"
      : invitation.expiresAt <= new Date()
        ? "expired"
        : "pending";
  return {
    organizationName: row.organizationName,
    email: invitation.email,
    role: invitation.role as OrgRole,
    status,
  };
}

export async function acceptInvitation(
  user: SessionUser,
  input: { token: string },
): Promise<{ orgSlug: string }> {
  const { token } = parseInput(z.object({ token: tokenInput }), input);
  const hash = hashInvitationToken(token);
  const [candidate] = await getDb()
    .select({
      organizationId: schema.invitations.organizationId,
      orgSlug: schema.organizations.slug,
      orgName: schema.organizations.name,
    })
    .from(schema.invitations)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.invitations.organizationId))
    .where(eq(schema.invitations.tokenHash, hash));
  if (!candidate) throw new NotFoundError();
  const ctx: OrgContext = {
    orgId: candidate.organizationId,
    orgSlug: candidate.orgSlug,
    orgName: candidate.orgName,
    userId: user.id,
    role: "member",
  };
  return withOrg(ctx, async (tx) => {
    await lockOrganization(tx, ctx);
    const [invitation] = await tx
      .select()
      .from(schema.invitations)
      .where(
        and(
          eq(schema.invitations.organizationId, ctx.orgId),
          eq(schema.invitations.tokenHash, hash),
        ),
      )
      .for("update");
    if (
      !invitation ||
      invitation.acceptedAt ||
      invitation.revokedAt ||
      invitation.expiresAt <= new Date()
    )
      throw new NotFoundError();
    if (invitation.email !== user.email.toLowerCase()) throw new ForbiddenError();
    const [existing] = await tx
      .select({ userId: schema.memberships.userId })
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.organizationId, ctx.orgId),
          eq(schema.memberships.userId, user.id),
        ),
      );
    if (existing) throw new ConflictError("You are already a member.");
    await tx
      .insert(schema.memberships)
      .values({ organizationId: ctx.orgId, userId: user.id, role: invitation.role });
    await tx
      .update(schema.invitations)
      .set({ acceptedAt: new Date() })
      .where(
        and(
          eq(schema.invitations.organizationId, ctx.orgId),
          eq(schema.invitations.id, invitation.id),
        ),
      );
    return { orgSlug: ctx.orgSlug };
  });
}
