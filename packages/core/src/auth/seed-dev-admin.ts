import { type Database, eq, schema, sql } from "@crm/db";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { and } from "drizzle-orm";
import { insertOrganization } from "../tenancy/create-organization";
import { DEV_ADMIN_EMAIL, isDevLoginEnabled } from "./dev-login";

export async function seedDevAdmin(
  db: Database,
  env: { NODE_ENV?: string; APP_URL?: string },
): Promise<void> {
  if (!isDevLoginEnabled(env)) return;
  await db.transaction(async (tx) => {
    // Serialize concurrent local starts, including the organization onboarding write.
    await tx.execute(sql`select pg_advisory_xact_lock(963)`);
    const [user] = await tx
      .insert(schema.users)
      .values({ name: "admin", email: DEV_ADMIN_EMAIL, emailVerified: true })
      .onConflictDoUpdate({ target: schema.users.email, set: { name: "admin" } })
      .returning();
    if (!user) throw new Error("Development admin insert returned no row");
    const [account] = await tx
      .select()
      .from(schema.accounts)
      .where(
        and(eq(schema.accounts.accountId, user.id), eq(schema.accounts.providerId, "credential")),
      );
    if (
      !account?.password ||
      !(await verifyPassword({ hash: account.password, password: "admin" }))
    ) {
      const password = await hashPassword("admin");
      await tx
        .insert(schema.accounts)
        .values({
          accountId: user.id,
          userId: user.id,
          providerId: "credential",
          password,
        })
        .onConflictDoUpdate({
          target: [schema.accounts.providerId, schema.accounts.accountId],
          set: { password, updatedAt: new Date() },
        });
    }
    const [membership] = await tx
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.userId, user.id));
    if (!membership) {
      await insertOrganization(tx, user, { name: "Development CRM", slug: "dev-admin" });
    }
  });
}
