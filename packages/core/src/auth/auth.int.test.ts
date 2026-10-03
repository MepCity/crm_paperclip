import { eq, schema } from "@crm/db";
import { describe, expect, it } from "vitest";
import { getDb } from "../database";
import { parseEnv } from "../env";
import { UnauthenticatedError } from "../errors";
import { createTestUser } from "../testing";
import { createAuth, getSession, handleAuthRequest, requireUser } from "./index";

const base = "http://127.0.0.1:3000/api/auth";

function post(path: string, input: object, headers: Record<string, string> = {}) {
  return handleAuthRequest(
    new Request(`${base}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(input),
    }),
  );
}

describe("authentication", () => {
  it("signs up, returns a cookie, reads the database session and stores a password hash", async () => {
    const email = `case-${crypto.randomUUID()}@example.test`;
    const password = "long-password-for-test";
    const response = await post("sign-up/email", {
      name: "Case User",
      email: email.toUpperCase(),
      password,
    });
    expect(response.status).toBe(200);
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie.toLowerCase()).toContain("samesite=lax");
    expect(setCookie).not.toContain("Secure");
    const session = await getSession(new Headers({ cookie: setCookie.split(";")[0] ?? "" }));
    expect(session?.user.email).toBe(email);
    expect(session?.user.name).toBe("Case User");
    expect(session?.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    const accounts = await getDb()
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.userId, session?.user.id ?? ""));
    expect(accounts).toHaveLength(1);
    expect(accounts[0]?.password).toBeTruthy();
    expect(accounts[0]?.password).not.toBe(password);
  });

  it("uses one response for a wrong password and an unknown email without creating sessions", async () => {
    const { user } = await createTestUser();
    const before = await getDb().select().from(schema.sessions);
    const wrong = await post("sign-in/email", { email: user.email, password: "wrong-password" });
    const unknown = await post("sign-in/email", {
      email: `unknown-${crypto.randomUUID()}@example.test`,
      password: "wrong-password",
    });
    expect(wrong.status).toBe(unknown.status);
    expect(await wrong.text()).toBe(await unknown.text());
    const after = await getDb().select().from(schema.sessions);
    expect(after).toHaveLength(before.length);
  });

  it("rejects a duplicate email regardless of case and a short password", async () => {
    const { user } = await createTestUser();
    const duplicate = await post("sign-up/email", {
      name: "Another",
      email: user.email.toUpperCase(),
      password: "long-password-for-test",
    });
    expect(duplicate.ok).toBe(false);
    const short = await post("sign-up/email", {
      name: "Short",
      email: `short-${crypto.randomUUID()}@example.test`,
      password: "123456789",
    });
    expect(short.ok).toBe(false);
  });

  it("revokes a signed-out session", async () => {
    const { headers } = await createTestUser();
    const session = await getSession(headers);
    expect(session).not.toBeNull();
    const response = await post(
      "sign-out",
      {},
      { cookie: headers.get("cookie") ?? "", Origin: "http://127.0.0.1:3000" },
    );
    expect(response.ok).toBe(true);
    expect(await getSession(headers)).toBeNull();
    const rows = await getDb()
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, session?.sessionId ?? ""));
    expect(rows).toHaveLength(0);
  });

  it("does not return expired sessions and requires a user", async () => {
    const { headers } = await createTestUser();
    const session = await getSession(headers);
    await getDb()
      .update(schema.sessions)
      .set({ expiresAt: new Date(0) })
      .where(eq(schema.sessions.id, session?.sessionId ?? ""));
    expect(await getSession(headers)).toBeNull();
    await expect(requireUser(new Headers())).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("rejects a foreign origin for a state-changing request", async () => {
    const response = await post(
      "sign-in/email",
      { email: "nobody@example.test", password: "wrong-password" },
      { Origin: "https://evil.example.test" },
    );
    expect(response.status).toBe(403);
  });

  it("sets Secure when the public app URL is HTTPS", async () => {
    const auth = createAuth({ ...parseEnv(process.env), APP_URL: "https://crm.example.test" });
    const response = await auth.handler(
      new Request("https://crm.example.test/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://crm.example.test" },
        body: JSON.stringify({
          name: "Secure User",
          email: `secure-${crypto.randomUUID()}@example.test`,
          password: "long-password-for-test",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Secure");
  });
});
