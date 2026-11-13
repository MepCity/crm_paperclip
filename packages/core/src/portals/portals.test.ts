import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import { JobCatalog } from "../jobs";
import { InMemoryJobQueue } from "../jobs/memory";
import {
  buildPortalMail,
  COMMON_PASSWORDS,
  checkPasswordPolicy,
  checkPortalCsrf,
  clearPortalCookie,
  createOpaqueToken,
  createQueuedPortalMailer,
  hashPortalSlug,
  hashToken,
  isTokenShape,
  LOCK_MS,
  PORTAL_LIMITS,
  PORTAL_MODULE_RULES,
  PORTAL_RESPONSE_HEADERS,
  portalCookieName,
  portalLink,
  portalMailJobDefinition,
  readPortalCookie,
  serializePortalCookie,
  validatePortalModules,
} from "./index";

const HTTPS = "https://crm.example.test";
const HTTP = "http://127.0.0.1:3000";

describe("portal password policy (ADR 0019a §2.1)", () => {
  const email = "person@example.test";
  it("enforces the 10–128 length edges", () => {
    expect(checkPasswordPolicy("a".repeat(4) + "bcdef", email)).toBe("too_short"); // 9
    expect(checkPasswordPolicy("Zq8!mT3#vL", email)).toBeNull(); // 10
    expect(checkPasswordPolicy(`Zq8!${"x".repeat(124)}`, email)).toBeNull(); // 128
    expect(checkPasswordPolicy(`Zq8!${"x".repeat(125)}`, email)).toBe("too_long"); // 129
  });
  it("counts characters, not UTF-16 units", () => {
    expect(checkPasswordPolicy("ğüşiöçĞÜŞİ", email)).toBeNull();
  });
  it("rejects the login email, case-insensitively", () => {
    expect(checkPasswordPolicy("PERSON@example.test", email)).toBe("equals_email");
  });
  it("rejects the built-in common passwords and has no composition rules", () => {
    expect(COMMON_PASSWORDS.size).toBeGreaterThan(50);
    expect(checkPasswordPolicy("Password123", email)).toBe("too_common");
    expect(checkPasswordPolicy("qwertyuiop", email)).toBe("too_common");
    expect(checkPasswordPolicy("correct horse battery", email)).toBeNull();
    for (const entry of COMMON_PASSWORDS) expect(entry.length).toBeGreaterThanOrEqual(10);
  });
});

describe("portal cookie (ADR 0019a §1.4)", () => {
  it("uses exactly __Host-portal; Secure; HttpOnly; SameSite=Lax; Path=/ on https", () => {
    const cookie = serializePortalCookie(HTTPS, "tok");
    expect(cookie.split("; ")).toEqual([
      "__Host-portal=tok",
      "Path=/",
      "Max-Age=43200",
      "HttpOnly",
      "SameSite=Lax",
      "Secure",
    ]);
    expect(cookie).not.toMatch(/Domain=/i);
  });
  it("falls back to portal_session without Secure on a plain-http preview", () => {
    expect(portalCookieName(HTTP)).toBe("portal_session");
    expect(serializePortalCookie(HTTP, "tok")).not.toContain("Secure");
    expect(clearPortalCookie(HTTPS)).toContain("Max-Age=0");
  });
  it("reads only the portal cookie and ignores member cookies", () => {
    const headers = new Headers({
      cookie: "__Secure-better-auth.session_token=member; __Host-portal=abc; other=1",
    });
    expect(readPortalCookie(headers, HTTPS)).toBe("abc");
    expect(
      readPortalCookie(new Headers({ cookie: "better-auth.session_token=member" }), HTTPS),
    ).toBeNull();
    // The plain-http name is not accepted on https and vice versa.
    expect(readPortalCookie(new Headers({ cookie: "portal_session=abc" }), HTTPS)).toBeNull();
  });
});

describe("portal CSRF and headers (ADR 0019a §1.7)", () => {
  const req = (method: string, headers: Record<string, string>) =>
    new Request(`${HTTPS}/api/portal/acme/login`, { method, headers });
  it("lets GET and HEAD through", () => {
    expect(checkPortalCsrf(req("GET", {}), HTTPS)).toBeNull();
    expect(checkPortalCsrf(req("HEAD", {}), HTTPS)).toBeNull();
  });
  it("rejects a missing or foreign Origin with 403", () => {
    expect(
      checkPortalCsrf(req("POST", { "content-type": "application/json" }), HTTPS)?.status,
    ).toBe(403);
    expect(
      checkPortalCsrf(
        req("POST", { origin: "https://evil.example", "content-type": "application/json" }),
        HTTPS,
      )?.status,
    ).toBe(403);
  });
  it("rejects form-urlencoded and multipart bodies with 415", () => {
    for (const type of [
      "application/x-www-form-urlencoded",
      "multipart/form-data; boundary=x",
      "text/plain",
    ]) {
      expect(
        checkPortalCsrf(req("POST", { origin: HTTPS, "content-type": type }), HTTPS)?.status,
      ).toBe(415);
    }
  });
  it("accepts same-origin JSON", () => {
    expect(
      checkPortalCsrf(
        req("POST", { origin: HTTPS, "content-type": "application/json; charset=utf-8" }),
        HTTPS,
      ),
    ).toBeNull();
  });
  it("sends the fixed security headers", () => {
    expect(PORTAL_RESPONSE_HEADERS).toMatchObject({
      "Content-Security-Policy": "frame-ancestors 'none'",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store",
    });
  });
});

describe("portal tokens (ADR 0019a §1.3, §2.2)", () => {
  it("are 32 random bytes in base64url and stored only as SHA-256", () => {
    const a = createOpaqueToken();
    const b = createOpaqueToken();
    expect(a.token).not.toBe(b.token);
    expect(Buffer.from(a.token, "base64url")).toHaveLength(32);
    expect(isTokenShape(a.token)).toBe(true);
    expect(a.hash).toBe(hashToken(a.token));
    expect(a.hash).not.toContain(a.token);
    expect(isTokenShape("short")).toBe(false);
    expect(isTokenShape(`${a.token}=`)).toBe(false);
  });
  it("hashes portal slugs with a portal-specific prefix", () => {
    expect(hashPortalSlug("acme")).not.toBe(hashToken("acme"));
    expect(hashPortalSlug("acme")).not.toContain("acme");
  });
});

describe("portal rate limits (ADR 0019a §2.5)", () => {
  it("match the ADR table", () => {
    expect(PORTAL_LIMITS).toEqual({
      loginIdentityFailures: { limit: 5, windowMs: 900_000 },
      loginClient: { limit: 20, windowMs: 900_000 },
      resetEmail: { limit: 3, windowMs: 3_600_000 },
      resetClient: { limit: 10, windowMs: 3_600_000 },
      tokenClient: { limit: 10, windowMs: 900_000 },
      session: { limit: 300, windowMs: 60_000 },
    });
    expect(LOCK_MS).toBe(900_000);
  });
});

describe("portal user-type matrix (ADR 0019a §3, §4.1)", () => {
  it("accepts a valid matrix and defaults scope to contact", () => {
    const modules = validatePortalModules({
      Contacts: {
        enabled: true,
        actions: { view: true, edit: true },
        fields: [
          { apiName: "First_Name", mode: "edit" },
          { apiName: "Email", mode: "read" },
        ],
      },
      Cases: {
        enabled: true,
        scope: "account",
        actions: { view: true, create: true },
        fields: [{ apiName: "Subject", mode: "edit" }],
      },
    });
    expect(modules.Contacts?.scope).toBe("contact");
    expect(modules.Cases?.scope).toBe("account");
  });
  it("lists exactly the six modules of the §3 table", () => {
    expect(Object.keys(PORTAL_MODULE_RULES).sort()).toEqual(
      ["Accounts", "Cases", "Contacts", "Deals", "Invoices", "Quotes"].sort(),
    );
  });
  const reject = (input: unknown) =>
    expect(() => validatePortalModules(input)).toThrow(ValidationError);
  it("rejects modules outside the table", () => {
    reject({ Leads: { enabled: true, actions: { view: true } } });
  });
  it("rejects actions outside the table", () => {
    reject({ Deals: { enabled: true, actions: { view: true, edit: true } } });
    reject({ Accounts: { enabled: true, actions: { view: true, create: true } } });
  });
  it("rejects account scope where the table has none", () => {
    reject({ Contacts: { enabled: true, scope: "account", actions: { view: true } } });
    reject({ Accounts: { enabled: true, scope: "account", actions: { view: true } } });
  });
  it("rejects unknown, owner and system fields", () => {
    reject({
      Contacts: {
        enabled: true,
        actions: { view: true },
        fields: [{ apiName: "Nope", mode: "read" }],
      },
    });
    reject({
      Contacts: {
        enabled: true,
        actions: { view: true },
        fields: [{ apiName: "Owner", mode: "read" }],
      },
    });
    reject({
      Contacts: {
        enabled: true,
        actions: { view: true },
        fields: [{ apiName: "Created_By", mode: "read" }],
      },
    });
    reject({
      Contacts: {
        enabled: true,
        actions: { view: true },
        fields: [{ apiName: "Tag", mode: "read" }],
      },
    });
  });
  it("rejects edit on read-only, system, lookup and server-set fields", () => {
    reject({
      Contacts: {
        enabled: true,
        actions: { view: true, edit: true },
        fields: [{ apiName: "Full_Name", mode: "edit" }],
      },
    });
    reject({
      Contacts: {
        enabled: true,
        actions: { view: true, edit: true },
        fields: [{ apiName: "Account_Name", mode: "edit" }],
      },
    });
    reject({
      Cases: {
        enabled: true,
        actions: { view: true, create: true },
        fields: [{ apiName: "Related_To", mode: "edit" }],
      },
    });
    // Edit mode without an edit/create action.
    reject({
      Deals: {
        enabled: true,
        actions: { view: true },
        fields: [{ apiName: "Deal_Name", mode: "edit" }],
      },
    });
  });
  it("rejects unknown keys in the matrix", () => {
    reject({ Contacts: { enabled: true, actions: { view: true }, fields: [], extra: 1 } });
  });
});

describe("portal mail (ADR 0019a §5)", () => {
  it("carries only the portal name and a fragment link", () => {
    const token = createOpaqueToken().token;
    const link = portalLink(HTTPS, "acme", "invite", token);
    expect(link).toBe(`${HTTPS}/portal/acme/accept#t=${token}`);
    expect(portalLink(HTTPS, "acme", "reset", token)).toContain("/portal/acme/reset#t=");
    const mail = buildPortalMail({
      kind: "invite",
      portalName: "Acme <Portal>",
      link,
      language: "en",
    });
    expect(mail.subject).toContain("Acme <Portal>");
    expect(mail.html).toContain("Acme &lt;Portal&gt;");
    expect(mail.text).toContain(link);
    expect(
      buildPortalMail({ kind: "reset", portalName: "P", link, language: "tr" }).subject,
    ).toContain("parola");
  });
  it("queues one job per token with the token id as idempotency key", async () => {
    const queue = new InMemoryJobQueue(new JobCatalog([portalMailJobDefinition]));
    const mailer = createQueuedPortalMailer({ queue, resolveSender: async () => null });
    const orgId = "0193b3b0-0000-7000-8000-000000000001";
    const id = "0193b3b0-0000-7000-8000-0000000000aa";
    const mail = {
      idempotencyKey: id,
      kind: "invite" as const,
      from: { address: "portal@example.test" },
      to: "person@example.test",
      subject: "s",
      text: "t",
      html: "h",
    };
    await mailer.deliver(orgId, mail);
    await mailer.deliver(orgId, mail);
    const job = await queue.claim({ workerId: "w", limit: 10, leaseMs: 1000 });
    expect(job).toHaveLength(1);
    expect(job[0]?.idempotencyKey).toBe(id);
    expect(job[0]?.payload).toEqual({ portalMailId: id });
    expect(mailer.outbox.size).toBe(1);
  });
});
