import { randomBytes } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { getDb, getSession, handleAuthRequest } from "@crm/core";
import { InMemoryJobQueue } from "@crm/core/jobs";
import {
  createPortalAdminService,
  createPortalAuthService,
  createPortalMailJobCatalog,
  createQueuedPortalMailer,
  PORTAL_NOT_FOUND_BODY,
  portalCookieName,
} from "@crm/core/portals";
import { createFixtureRecordService } from "@crm/core/records/fixture";
import { createTestOrganization } from "@crm/core/testing";
import { schema } from "@crm/db";
import { describe, expect, it } from "vitest";

/**
 * Route inventory (ADR 0019a §1.6): every portal route is declared with
 * `exemptRoute("portal", …)` and a member session alone never authenticates there; every
 * other route rejects a request that carries only a portal cookie.
 */
const appDir = join(__dirname, "../..");
const APP_URL = process.env.APP_URL ?? "http://127.0.0.1:3000";
const ORIGIN = new URL(APP_URL).origin;
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
const FAKE_ID = "0193b3b0-0000-7000-8000-000000000000";

type Handler = (
  request: Request,
  context: { params: Promise<Record<string, unknown>> },
) => Promise<Response>;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name === "route.ts") out.push(full);
  }
  return out;
}

function urlPath(file: string): string {
  const rel = relative(appDir, file).split(sep).slice(0, -1);
  return `/${rel.filter((s) => !/^\(.*\)$/.test(s)).join("/")}`;
}

function params(file: string, slug: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const seg of relative(appDir, file).split(sep)) {
    const catchAll = /^\[\.\.\.(\w+)\]$/.exec(seg);
    const one = /^\[(\w+)\]$/.exec(seg);
    if (catchAll?.[1]) out[catchAll[1]] = ["x"];
    else if (one?.[1])
      out[one[1]] = one[1] === "slug" ? slug : one[1] === "module" ? "Contacts" : FAKE_ID;
  }
  return out;
}

const routes = walk(appDir);
const isPortalRoute = (file: string) => urlPath(file).startsWith("/api/portal/");
const isPublicRoute = (source: string) => /exemptRoute\(\s*"public"/.test(source);

async function portalFixture() {
  const { ctx, admin: member } = await createTestOrganization();
  const mailer = createQueuedPortalMailer({
    queue: new InMemoryJobQueue(createPortalMailJobCatalog()),
    resolveSender: async () => ({ address: "sender@example.test" }),
  });
  const admin = createPortalAdminService({ mailer, appUrl: APP_URL });
  const auth = createPortalAuthService({ mailer, appUrl: APP_URL });
  const slug = `inv-${randomBytes(5).toString("hex")}`;
  await admin.createPortal(ctx, { name: "Inventory", slug });
  const type = await admin.createUserType(ctx, { name: "T", modules: {} });
  const contact = await createFixtureRecordService(ctx, { system: true }).create("Contacts", {
    Last_Name: "Inventory",
    Email: `inv-${randomBytes(4).toString("hex")}@example.test`,
  });
  await admin.invite(ctx, { contactId: contact.id, userTypeId: type.id });
  const mail = [...mailer.outbox.values()].at(-1);
  const token = mail?.text.match(/#t=([A-Za-z0-9_-]{43})/)?.[1] ?? "";
  const accepted = await auth.acceptInvitation(
    slug,
    { token, password: "Inventory secret 123" },
    { ip: "10.9.9.9" },
  );
  if (!accepted.ok) throw new Error("accept failed");
  return { ctx, member, slug, portalToken: accepted.token };
}

describe("portal route inventory (ADR 0019a §1.6)", () => {
  it('lists exactly the portal routes and declares each with exemptRoute("portal")', () => {
    const portal = routes.filter(isPortalRoute).map(urlPath).sort();
    expect(portal).toEqual(
      [
        "/api/portal/[slug]/accept",
        "/api/portal/[slug]/login",
        "/api/portal/[slug]/logout",
        "/api/portal/[slug]/me",
        "/api/portal/[slug]/password",
        "/api/portal/[slug]/password-reset",
        "/api/portal/[slug]/password-reset/complete",
        "/api/portal/[slug]/records/[module]",
        "/api/portal/[slug]/records/[module]/[id]",
        "/api/portal/[slug]/records/[module]/[id]/[related]",
      ].sort(),
    );
    for (const file of routes.filter(isPortalRoute)) {
      const source = readFileSync(file, "utf8");
      const bindings = source.split(/^(?=export const (?:GET|POST|PUT|PATCH|DELETE)\b)/m).slice(1);
      expect(bindings.length).toBeGreaterThan(0);
      for (const binding of bindings) expect(binding).toMatch(/exemptRoute\(\s*"portal"/);
    }
    // No other route uses the portal declaration.
    for (const file of routes.filter((f) => !isPortalRoute(f))) {
      expect(readFileSync(file, "utf8")).not.toMatch(/exemptRoute\(\s*"portal"/);
    }
  });

  it("a member session alone never authenticates on a portal route", async () => {
    const { member, slug } = await portalFixture();
    const memberCookie = member.headers.get("cookie") ?? "";
    expect(memberCookie).not.toBe("");
    const expected: Record<string, number> = {
      "/api/portal/[slug]/me GET": 401,
      "/api/portal/[slug]/password POST": 401,
      "/api/portal/[slug]/login POST": 401,
      "/api/portal/[slug]/logout POST": 204,
      "/api/portal/[slug]/accept POST": 410,
      "/api/portal/[slug]/password-reset/complete POST": 410,
      "/api/portal/[slug]/password-reset POST": 202,
      "/api/portal/[slug]/records/[module] GET": 401,
      "/api/portal/[slug]/records/[module] POST": 401,
      "/api/portal/[slug]/records/[module]/[id] GET": 401,
      "/api/portal/[slug]/records/[module]/[id] PATCH": 401,
      "/api/portal/[slug]/records/[module]/[id]/[related] GET": 401,
    };
    const seen: string[] = [];
    for (const file of routes.filter(isPortalRoute)) {
      const mod = (await import(file)) as Record<string, Handler | undefined>;
      for (const method of METHODS) {
        const handler = mod[method];
        if (!handler) continue;
        const key = `${urlPath(file)} ${method}`;
        seen.push(key);
        const res = await handler(
          new Request(`${APP_URL}${urlPath(file).replace("[slug]", slug)}`, {
            method,
            headers: {
              cookie: memberCookie,
              origin: ORIGIN,
              ...(method === "GET" ? {} : { "content-type": "application/json" }),
            },
            ...(method === "GET" ? {} : { body: "{}" }),
          }),
          { params: Promise.resolve(params(file, slug)) },
        );
        expect(res.status, key).toBe(expected[key]);
        // No portal session is ever issued from a member cookie.
        const setCookie = res.headers.get("set-cookie") ?? "";
        if (setCookie) expect(setCookie, key).toMatch(/Max-Age=0/);
        expect(res.headers.get("cache-control"), key).toBe("no-store");
      }
    }
    expect(seen.sort()).toEqual(Object.keys(expected).sort());
  });

  it("a portal cookie alone gets 401 on every member route and no member session", async () => {
    const { ctx, slug, portalToken } = await portalFixture();
    const cookie = `${portalCookieName(APP_URL)}=${portalToken}`;
    // Sanity: the cookie is a live portal session.
    const me = (await import(join(appDir, "api/portal/[slug]/me/route.ts"))) as { GET: Handler };
    const ok = await me.GET(
      new Request(`${APP_URL}/api/portal/${slug}/me`, { headers: { cookie } }),
      { params: Promise.resolve({ slug }) },
    );
    expect(ok.status).toBe(200);

    expect(await getSession(new Headers({ cookie }))).toBeNull();
    const authSession = await handleAuthRequest(
      new Request(`${APP_URL}/api/auth/get-session`, { headers: { cookie } }),
    );
    expect(await authSession.json()).toBeNull();

    const offenders: string[] = [];
    let checked = 0;
    for (const file of routes.filter((f) => !isPortalRoute(f))) {
      const source = readFileSync(file, "utf8");
      if (isPublicRoute(source)) continue;
      const mod = (await import(file)) as Record<string, Handler | undefined>;
      for (const method of METHODS) {
        const handler = mod[method];
        if (typeof handler !== "function") continue;
        const path = urlPath(file)
          .replace(/\[\.\.\.\w+\]/g, "x")
          .replace(/\[(\w+)\]/g, FAKE_ID);
        const res = await handler(
          new Request(`${APP_URL}${path}?org=${ctx.orgSlug}`, {
            method,
            headers: {
              cookie,
              origin: ORIGIN,
              "x-crm-org": ctx.orgSlug,
              ...(method === "GET" ? {} : { "content-type": "application/json" }),
            },
            ...(method === "GET" ? {} : { body: "{}" }),
          }),
          { params: Promise.resolve(params(file, slug)) },
        ).catch((error: unknown) => ({ status: -1, error }) as unknown as Response);
        checked++;
        if (res.status !== 401) offenders.push(`${urlPath(file)} ${method} → ${res.status}`);
      }
    }
    expect(checked).toBeGreaterThan(100);
    expect(offenders).toEqual([]);
  });
});

describe("portal routes over HTTP (ADR 0019a §1.4, §1.7, §2.2)", () => {
  const route = async (name: string) =>
    (await import(join(appDir, `api/portal/[slug]/${name}/route.ts`))) as Record<string, Handler>;

  it("refuses non-GET without Origin, with a foreign Origin (403) or a form body (415)", async () => {
    const { slug } = await portalFixture();
    const login = (await route("login")).POST as Handler;
    const send = (headers: Record<string, string>, body = "{}") =>
      login(new Request(`${APP_URL}/api/portal/${slug}/login`, { method: "POST", headers, body }), {
        params: Promise.resolve({ slug }),
      });
    expect((await send({ "content-type": "application/json" })).status).toBe(403);
    expect(
      (await send({ origin: "https://evil.example", "content-type": "application/json" })).status,
    ).toBe(403);
    expect(
      (
        await send(
          { origin: ORIGIN, "content-type": "application/x-www-form-urlencoded" },
          "email=a&password=b",
        )
      ).status,
    ).toBe(415);
    const res = await send({ origin: ORIGIN, "content-type": "application/json" });
    expect(res.status).toBe(401);
    expect(res.headers.get("content-security-policy")).toBe("frame-ancestors 'none'");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
  });

  it("sets the portal cookie on login and never accepts a token in the query string", async () => {
    const { slug, portalToken } = await portalFixture();
    const accept = (await route("accept")).POST as Handler;
    const viaQuery = await accept(
      new Request(`${APP_URL}/api/portal/${slug}/accept?t=${portalToken}`, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: JSON.stringify({ password: "Inventory secret 123" }),
      }),
      { params: Promise.resolve({ slug }) },
    );
    expect(viaQuery.status).toBe(400);

    const me = (await route("me")).GET as Handler;
    const anon = await me(new Request(`${APP_URL}/api/portal/${slug}/me`), {
      params: Promise.resolve({ slug }),
    });
    expect(anon.status).toBe(401);
    expect(anon.headers.get("set-cookie")).toMatch(/Max-Age=0/);
    const cookie = `${portalCookieName(APP_URL)}=${portalToken}`;
    const ok = await me(new Request(`${APP_URL}/api/portal/${slug}/me`, { headers: { cookie } }), {
      params: Promise.resolve({ slug }),
    });
    expect(ok.status).toBe(200);
    expect(ok.headers.get("set-cookie")).toBeNull();

    const logout = (await route("logout")).POST as Handler;
    const out = await logout(
      new Request(`${APP_URL}/api/portal/${slug}/logout`, {
        method: "POST",
        headers: { cookie, origin: ORIGIN, "content-type": "application/json" },
        body: "{}",
      }),
      { params: Promise.resolve({ slug }) },
    );
    expect(out.status).toBe(204);
    expect(out.headers.get("set-cookie")).toMatch(
      new RegExp(`^${portalCookieName(APP_URL)}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`),
    );
    const after = await me(
      new Request(`${APP_URL}/api/portal/${slug}/me`, { headers: { cookie } }),
      {
        params: Promise.resolve({ slug }),
      },
    );
    expect(after.status).toBe(401);
  });
});

describe("portal data routes over HTTP (ADR 0019a §3–§4, §1.7, §2.5)", () => {
  async function dataFixture() {
    const { ctx } = await createTestOrganization();
    const mailer = createQueuedPortalMailer({
      queue: new InMemoryJobQueue(createPortalMailJobCatalog()),
      resolveSender: async () => ({ address: "sender@example.test" }),
    });
    const admin = createPortalAdminService({ mailer, appUrl: APP_URL });
    const auth = createPortalAuthService({ mailer, appUrl: APP_URL });
    const slug = `data-${randomBytes(5).toString("hex")}`;
    await admin.createPortal(ctx, { name: "Data", slug });
    const type = await admin.createUserType(ctx, {
      name: "Customers",
      modules: {
        Contacts: {
          enabled: true,
          actions: { view: true, edit: true },
          fields: [
            { apiName: "First_Name", mode: "edit" },
            { apiName: "Last_Name", mode: "read" },
          ],
        },
        Cases: {
          enabled: true,
          actions: { view: true, create: true },
          fields: [
            { apiName: "Subject", mode: "edit" },
            { apiName: "Related_To", mode: "read" },
          ],
        },
      },
    });
    const system = createFixtureRecordService(ctx, { system: true });
    const email = `data-${randomBytes(4).toString("hex")}@example.test`;
    const contact = await system.create("Contacts", { Last_Name: "Data", Email: email });
    const stranger = await system.create("Contacts", { Last_Name: "Stranger" });
    const strangerCase = await system.create("Cases", {
      Subject: "Not yours",
      Status: "New",
      Case_Origin: "Web",
      Related_To: { module: "Contacts", id: stranger.id },
    });
    await admin.invite(ctx, { contactId: contact.id, userTypeId: type.id });
    const mail = [...mailer.outbox.values()].at(-1);
    const token = mail?.text.match(/#t=([A-Za-z0-9_-]{43})/)?.[1] ?? "";
    const accepted = await auth.acceptInvitation(
      slug,
      { token, password: "Inventory secret 123" },
      { ip: "10.9.9.8" },
    );
    if (!accepted.ok) throw new Error("accept failed");
    const cookie = `${portalCookieName(APP_URL)}=${accepted.token}`;
    const call = async (
      method: string,
      path: string,
      body?: unknown,
      headers: Record<string, string> = {},
    ) => {
      const segments = path.split("?")[0]?.split("/") ?? [];
      const [module, id, related] = segments;
      const file = related
        ? "records/[module]/[id]/[related]"
        : id
          ? "records/[module]/[id]"
          : "records/[module]";
      const mod = (await import(join(appDir, `api/portal/[slug]/${file}/route.ts`))) as Record<
        string,
        Handler
      >;
      const handler = mod[method];
      if (!handler) throw new Error(`no ${method} on ${file}`);
      return handler(
        new Request(`${APP_URL}/api/portal/${slug}/records/${path}`, {
          method,
          headers: {
            cookie,
            ...(method === "GET" ? {} : { origin: ORIGIN, "content-type": "application/json" }),
            ...headers,
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        }),
        { params: Promise.resolve({ slug, module, id, related }) },
      );
    };
    return { ctx, slug, contact, strangerCase, call, sessionToken: accepted.token };
  }

  it("lists, reads, creates and self-edits with the session; refusals are identical 404s", async () => {
    const env = await dataFixture();
    const list = await env.call("GET", "Cases?per_page=50");
    expect(list.status).toBe(200);
    expect(list.headers.get("cache-control")).toBe("no-store");
    expect(await list.json()).toMatchObject({ data: [], info: { page: 1, per_page: 50 } });

    const created = await env.call("POST", "Cases", { Subject: "Help" });
    expect(created.status).toBe(201);
    const row = (await created.json()) as { data: { id: string; fields: Record<string, unknown> } };
    expect(row.data.fields).toEqual({
      Subject: "Help",
      Related_To: { name: "Data", module: "Contacts", id: env.contact.id },
    });
    expect((await env.call("GET", `Cases/${row.data.id}`)).status).toBe(200);
    expect((await env.call("GET", `Contacts/${env.contact.id}/Cases`)).status).toBe(200);

    const edited = await env.call("PATCH", `Contacts/${env.contact.id}`, { First_Name: "Me" });
    expect(edited.status).toBe(200);
    const readOnly = await env.call("PATCH", `Contacts/${env.contact.id}`, { Last_Name: "X" });
    expect(readOnly.status).toBe(422);
    expect(await readOnly.json()).toMatchObject({ errors: { Last_Name: expect.any(Array) } });
    const relationship = await env.call("POST", "Cases", {
      Subject: "X",
      Related_To: { module: "Contacts", id: env.contact.id },
    });
    expect(relationship.status).toBe(422);
    expect((await env.call("GET", "Cases?sort_by=Owner")).status).toBe(422);

    const refusals = await Promise.all([
      env.call("GET", "Cases/987654321"),
      env.call("GET", `Cases/${env.strangerCase.id}`),
      env.call("GET", "Deals"),
      env.call("GET", "Leads/1"),
      env.call("PATCH", `Cases/${row.data.id}`, { Subject: "X" }),
      env.call("POST", "Contacts", { Last_Name: "X" }),
      env.call("GET", `Contacts/${env.contact.id}/Deals`),
    ]);
    const texts = await Promise.all(
      refusals.map(async (res) => {
        expect(res.status).toBe(404);
        return res.text();
      }),
    );
    expect(new Set(texts)).toEqual(new Set([JSON.stringify(PORTAL_NOT_FOUND_BODY)]));
  });

  it("CSRF on writes, 401 without a session, 429 over the per-session limit", async () => {
    const env = await dataFixture();
    expect(
      (await env.call("POST", "Cases", { Subject: "X" }, { origin: "https://evil.example" }))
        .status,
    ).toBe(403);
    const form = await env.call("POST", "Cases", undefined, {
      "content-type": "application/x-www-form-urlencoded",
    });
    expect(form.status).toBe(415);
    const anonymous = await env.call("GET", "Cases", undefined, { cookie: "" });
    expect(anonymous.status).toBe(401);
    const auth = createPortalAuthService({ appUrl: APP_URL });
    const live = await auth.authenticate(env.slug, env.sessionToken, { ip: "10.9.9.8" });
    if (!live.ok) throw new Error("session not live");
    const windowMs = 60_000;
    await getDb()
      .insert(schema.publicRateLimits)
      .values({
        organizationId: env.ctx.orgId,
        bucket: `portal:session:${live.principal.sessionId}`,
        windowStart: new Date(Math.floor(Date.now() / windowMs) * windowMs),
        count: 300,
      })
      .onConflictDoUpdate({
        target: [
          schema.publicRateLimits.organizationId,
          schema.publicRateLimits.bucket,
          schema.publicRateLimits.windowStart,
        ],
        set: { count: 300 },
      });
    expect((await env.call("GET", "Cases")).status).toBe(429);
  });
});
