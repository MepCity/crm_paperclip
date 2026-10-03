import { randomBytes } from "node:crypto";
import { getSession, handleAuthRequest, type SessionUser } from "./auth";
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
