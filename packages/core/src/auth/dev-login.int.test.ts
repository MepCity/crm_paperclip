import { eq, schema } from "@crm/db";
import { afterEach, expect, it, vi } from "vitest";
import { getDb } from "../database";
import { listOrganizationsForUser, requireOrgContext } from "../tenancy";
import { DEV_ADMIN_EMAIL } from "./dev-login";
import {
  getSession,
  guardReservedDevAccount,
  handleAuthRequest,
  resetReservedGuardForTests,
} from "./index";
import { seedDevAdmin } from "./seed-dev-admin";
import { resetAuthThrottleForTests } from "./throttle";

afterEach(() => {
  vi.unstubAllEnvs();
  resetReservedGuardForTests();
  resetAuthThrottleForTests();
});
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
  const production = env.NODE_ENV === "production";
  // Production registration is invite-only; elsewhere the library validates the body.
  expect((await post("sign-up/email", `short-${crypto.randomUUID()}@example.test`)).status).toBe(
    production ? 403 : 400,
  );
  expect((await post("sign-up/email", "admin", "long-password-test")).status).toBe(
    production ? 403 : 400,
  );
  expect(
    (await post("sign-up/email", `valid-${crypto.randomUUID()}@example.test`, "long-password-test"))
      .status,
  ).toBe(production ? 403 : 200);
  if (production) {
    vi.stubEnv("ALLOW_PUBLIC_SIGNUP", "true");
    expect(
      (
        await post(
          "sign-up/email",
          `valid-${crypto.randomUUID()}@example.test`,
          "long-password-test",
        )
      ).status,
    ).toBe(200);
  }
});

it("never maps usernames for sign-up even in development", async () => {
  expect((await post("sign-up/email", "admin", "long-password-test")).status).toBe(400);
  expect((await post("sign-up/email", `short-${crypto.randomUUID()}@example.test`)).status).toBe(
    400,
  );
});

function postRaw(
  path: string,
  body: string,
  contentType: string | null,
  extra: Record<string, string> = {},
) {
  const headers = new Headers(extra);
  if (contentType) headers.set("Content-Type", contentType);
  return handleAuthRequest(
    new Request(`${process.env.APP_URL}/api/auth/${path}`, { method: "POST", headers, body }),
  );
}

it("rejects form-encoded and other non-JSON credential posts", async () => {
  await seedDevAdmin(getDb(), process.env);
  const form = "email=admin&password=admin";
  expect((await postRaw("sign-in/email", form, "application/x-www-form-urlencoded")).status).toBe(
    415,
  );
  expect((await postRaw("sign-in/email", form, "text/plain")).status).toBe(415);
  expect((await postRaw("sign-in/email", form, null)).status).toBe(415);
  expect((await postRaw("sign-up/email", form, "multipart/form-data; boundary=x")).status).toBe(
    415,
  );
  expect(
    (
      await postRaw(
        "sign-in/email",
        JSON.stringify({ email: "admin", password: "admin" }),
        "application/json; charset=utf-8",
      )
    ).status,
  ).toBe(200);
});

it("rejects a form-encoded reserved-account sign-in outside the dev gate", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const form = `email=${encodeURIComponent(DEV_ADMIN_EMAIL)}&password=admin`;
  expect((await postRaw("sign-in/email", form, "application/x-www-form-urlencoded")).status).toBe(
    415,
  );
});

it("refuses reserved-account registration and oversized credential bodies", async () => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("ALLOW_PUBLIC_SIGNUP", "true");
  expect(
    (await post("sign-up/email", ` ${DEV_ADMIN_EMAIL.toUpperCase()} `, "long-password-test"))
      .status,
  ).toBe(403);
  const big = JSON.stringify({ email: "a@example.test", password: "x".repeat(20_000) });
  expect((await postRaw("sign-in/email", big, "application/json")).status).toBe(413);
  expect(
    (await postRaw("sign-in/email", "{}", "application/json", { "content-length": "99999" }))
      .status,
  ).toBe(413);
});

it("ignores a spoofed client-ip header and throttles repeated sign-ins per account", async () => {
  let last = 0;
  for (let i = 0; i < 14; i++) {
    last = (
      await postRaw(
        "sign-in/email",
        JSON.stringify({ email: "victim@example.test", password: "wrong-password" }),
        "application/json",
        { "x-crm-client-ip": `10.0.0.${i}` },
      )
    ).status;
  }
  expect(last).toBe(429);
  // Another account is not affected by the first one's bucket.
  expect((await post("sign-in/email", "other@example.test", "wrong-password")).status).toBe(401);
});

it("does not seed the development admin into a DATABASE_URL from the environment", async () => {
  const db = getDb();
  const transaction = vi.spyOn(db, "transaction");
  await seedDevAdmin(db, process.env, { databaseUrlFromEnvironment: true });
  expect(transaction).not.toHaveBeenCalled();
  transaction.mockRestore();
});

it("removes the reserved account credentials at startup outside the dev gate", async () => {
  const db = getDb();
  await seedDevAdmin(db, process.env);
  vi.stubEnv("NODE_ENV", "production");
  await guardReservedDevAccount(process.env);
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, DEV_ADMIN_EMAIL));
  const accounts = await db
    .select()
    .from(schema.accounts)
    .where(eq(schema.accounts.userId, user?.id ?? ""));
  expect(accounts).toHaveLength(0);
});
