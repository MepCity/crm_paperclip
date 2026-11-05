import { randomBytes } from "node:crypto";
import { schema } from "@crm/db";
import { and, eq } from "drizzle-orm";
import { bumpAccessVersion } from "./access/seed";
import { getSession, handleAuthRequest, type SessionUser } from "./auth";
import { getDb } from "./database";
import {
  acceptInvitation,
  createInvitation,
  createOrganization,
  type OrgContext,
  requireOrgContext,
} from "./tenancy";

type Overrides = Partial<{ name: string; email: string; password: string }>;

export async function createTestUser(
  overrides: Overrides = {},
): Promise<{ user: SessionUser; headers: Headers }> {
  const url = process.env.APP_URL ?? "http://127.0.0.1:3000";
  const response = await handleAuthRequest(
    new Request(`${url}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: new URL(url).origin },
      body: JSON.stringify({
        name: overrides.name ?? "Test User",
        email: overrides.email ?? `test-${randomBytes(8).toString("hex")}@example.test`,
        password: overrides.password ?? randomBytes(20).toString("hex"),
      }),
    }),
  );
  if (!response.ok)
    throw new Error(`Test sign-up failed: ${response.status} ${await response.text()}`);
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Test sign-up did not set a session cookie");
  const headers = new Headers({ cookie });
  const session = await getSession(headers);
  if (!session) throw new Error("Test sign-up did not create a session");
  return { user: session.user, headers };
}

export async function createTestOrganization(user?: { user: SessionUser; headers: Headers }) {
  const admin = user ?? (await createTestUser());
  const slug = `test-${randomBytes(8).toString("hex")}`;
  const org = await createOrganization(admin.user, { name: "Test Organization", slug });
  const ctx = await requireOrgContext(admin.headers, slug);
  return { org, ctx, admin };
}

export async function addTestMember(ctx: OrgContext, role: "admin" | "member") {
  const { user, headers } = await createTestUser();
  const { token } = await createInvitation(ctx, { email: user.email, role });
  await acceptInvitation(user, { token });
  return { user, headers, ctx: await requireOrgContext(headers, ctx.orgSlug) };
}

/**
 * Adds a member with an explicit access profile and role (ADR 0017 fixtures). Both default to
 * the seeded Standard profile in the Manager role.
 */
export async function addAccessTestMember(
  ctx: OrgContext,
  options: { profile?: "administrator" | "standard" | string; role?: string } = {},
) {
  const { user, headers } = await createTestUser();
  await assignAccess(ctx.orgSlug, user.id, options);
  return { user, headers, ctx: await requireOrgContext(headers, ctx.orgSlug) };
}

async function assignAccess(
  orgSlug: string,
  userId: string,
  options: { profile?: string; role?: string },
) {
  await getDb().transaction(async (tx) => {
    const [org] = await tx
      .select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, orgSlug));
    if (!org) throw new Error("Unknown organization");
    const profileName = options.profile ?? "standard";
    const [profile] = await tx
      .select({ id: schema.accessProfiles.id, kind: schema.accessProfiles.kind })
      .from(schema.accessProfiles)
      .where(
        and(
          eq(schema.accessProfiles.organizationId, org.id),
          profileName === "administrator" || profileName === "standard"
            ? eq(schema.accessProfiles.kind, profileName)
            : eq(schema.accessProfiles.id, profileName),
        ),
      );
    const [role] = await tx
      .select({ id: schema.accessRoles.id })
      .from(schema.accessRoles)
      .where(
        and(
          eq(schema.accessRoles.organizationId, org.id),
          eq(schema.accessRoles.name, options.role ?? "Manager"),
        ),
      );
    if (!profile || !role) throw new Error("Missing seeded profile or role");
    await tx.insert(schema.memberships).values({
      organizationId: org.id,
      userId,
      role: profile.kind === "administrator" ? "admin" : "member",
    });
    await tx
      .insert(schema.memberAccess)
      .values({ organizationId: org.id, userId, profileId: profile.id, roleId: role.id });
    await bumpAccessVersion(tx, org.id);
  });
}

/**
 * E2E fixture: a user with the Standard profile in the Manager role, joined straight to an
 * existing organisation by slug (no invitation). Sign in with the returned email and password.
 */
export async function createStandardManagerUser(orgSlug: string) {
  const password = randomBytes(12).toString("hex");
  const { user } = await createTestUser({ name: "Standard Manager", password });
  await assignAccess(orgSlug, user.id, { profile: "standard", role: "Manager" });
  return { email: user.email, password, userId: user.id };
}
