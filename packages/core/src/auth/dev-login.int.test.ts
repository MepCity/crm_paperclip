import { eq, schema } from "@crm/db";
import { afterEach, expect, it, vi } from "vitest";
import { getDb } from "../database";
import { listOrganizationsForUser, requireOrgContext } from "../tenancy";
import { DEV_ADMIN_EMAIL } from "./dev-login";
import { getSession, handleAuthRequest } from "./index";
import { seedDevAdmin } from "./seed-dev-admin";

afterEach(() => vi.unstubAllEnvs());
function post(path: string, email: string, password = "admin") {
  return handleAuthRequest(
    new Request(`${process.env.APP_URL}/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: "Test User" }),
    }),
  );
}

it("seeds once, authenticates the short password and provides an onboarded admin", async () => {
  const db = getDb();
  await Promise.all([seedDevAdmin(db, process.env), seedDevAdmin(db, process.env)]);
  const users = await db.select().from(schema.users).where(eq(schema.users.email, DEV_ADMIN_EMAIL));
  expect(users).toHaveLength(1);
  const user = users[0];
  if (!user) throw new Error("Missing seeded user");
  const accounts = await db
    .select()
    .from(schema.accounts)
    .where(eq(schema.accounts.userId, user.id));
  expect(accounts).toHaveLength(1);
  expect(accounts[0]?.password).not.toBe("admin");
  const orgs = await listOrganizationsForUser(user.id);
  expect(orgs).toHaveLength(1);
  expect(orgs[0]?.role).toBe("admin");
  const response = await post("sign-in/email", " ADMIN ");
  expect(response.status).toBe(200);
  const headers = new Headers({ cookie: response.headers.get("set-cookie")?.split(";")[0] ?? "" });
  expect((await getSession(headers))?.user.id).toBe(user.id);
  expect((await requireOrgContext(headers, orgs[0]?.slug ?? "")).role).toBe("admin");
  expect((await post("sign-in/email", "admin", "wrong")).status).toBe(401);
  const before = accounts[0]?.password;
  await seedDevAdmin(db, process.env);
  expect(
    (await db.select().from(schema.accounts).where(eq(schema.accounts.userId, user.id)))[0]
      ?.password,
  ).toBe(before);
});

it.each([
  { NODE_ENV: "production", APP_URL: "http://127.0.0.1:3000" },
  { NODE_ENV: "development", APP_URL: "https://crm.example.test" },
])("disables writes and rejects both dev identities outside the gate: %j", async (env) => {
  const db = getDb();
  const before = await db.select().from(schema.users);
  const transaction = vi.spyOn(db, "transaction");
  await seedDevAdmin(db, env);
  expect(transaction).not.toHaveBeenCalled();
  transaction.mockRestore();
  expect(await db.select().from(schema.users)).toEqual(before);
  // Also reject a seeded database when its runtime is changed to production/remote.
  await seedDevAdmin(db, { NODE_ENV: "development", APP_URL: "http://localhost" });
  vi.stubEnv("NODE_ENV", env.NODE_ENV);
  vi.stubEnv("APP_URL", env.APP_URL);
  expect((await post("sign-in/email", "admin")).status).toBe(400);
  expect((await post("sign-in/email", DEV_ADMIN_EMAIL)).status).toBe(401);
  expect((await post("sign-up/email", `short-${crypto.randomUUID()}@example.test`)).status).toBe(
    400,
  );
  expect((await post("sign-up/email", "admin", "long-password-test")).status).toBe(400);
  expect(
    (await post("sign-up/email", `valid-${crypto.randomUUID()}@example.test`, "long-password-test"))
      .status,
  ).toBe(200);
});

it("never maps usernames for sign-up even in development", async () => {
  expect((await post("sign-up/email", "admin", "long-password-test")).status).toBe(400);
  expect((await post("sign-up/email", `short-${crypto.randomUUID()}@example.test`)).status).toBe(
    400,
  );
});
