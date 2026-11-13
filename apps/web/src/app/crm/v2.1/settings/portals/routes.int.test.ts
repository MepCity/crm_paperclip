import { randomBytes } from "node:crypto";
import { type Transaction, withOrg } from "@crm/core";
import { addAccessTestMember, createTestOrganization } from "@crm/core/testing";
import { eq, schema } from "@crm/db";
import { describe, expect, it } from "vitest";
import * as authEvents from "@/app/crm/v2.1/settings/portals/auth-events/route";
import * as portal from "@/app/crm/v2.1/settings/portals/route";
import * as userTypeDetail from "@/app/crm/v2.1/settings/portals/user-types/[id]/route";
import * as userTypes from "@/app/crm/v2.1/settings/portals/user-types/route";
import * as actions from "@/app/crm/v2.1/settings/portals/users/[id]/actions/[action]/route";
import * as stagingLink from "@/app/crm/v2.1/settings/portals/users/[id]/staging-link/route";
import * as users from "@/app/crm/v2.1/settings/portals/users/route";
import { getPortalMailer } from "@/server/portals";

type Handler = (
  request: Request,
  context: { params?: Promise<Record<string, string>> },
) => Promise<Response>;

const APP_URL = process.env.APP_URL ?? "http://127.0.0.1:3000";

function req(method: string, headers: Headers, org: string, body?: unknown) {
  const h = new Headers(headers);
  h.set("X-CRM-ORG", org);
  h.set("Origin", new URL(APP_URL).origin);
  if (body !== undefined) h.set("Content-Type", "application/json");
  return new Request(`${APP_URL}/crm/v2.1/settings/portals`, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const call = (handler: Handler, request: Request, params: Record<string, string> = {}) =>
  handler(request, { params: Promise.resolve(params) });

describe("portal settings routes (admin.managePortals)", () => {
  it("refuses every route to a Standard profile and serves an Administrator", async () => {
    const { ctx, admin } = await createTestOrganization();
    const standard = await addAccessTestMember(ctx, { profile: "standard" });
    const org = ctx.orgSlug;
    const id = "0193b3b0-0000-7000-8000-000000000000";
    const denied: [Handler, string, Record<string, string>?][] = [
      [portal.GET, "GET"],
      [portal.POST, "POST"],
      [portal.PATCH, "PATCH"],
      [portal.DELETE, "DELETE"],
      [userTypes.GET, "GET"],
      [userTypes.POST, "POST"],
      [userTypeDetail.PATCH as unknown as Handler, "PATCH", { id }],
      [userTypeDetail.DELETE as unknown as Handler, "DELETE", { id }],
      [users.GET, "GET"],
      [users.POST, "POST"],
      [actions.POST as unknown as Handler, "POST", { id, action: "disable" }],
      [stagingLink.GET as unknown as Handler, "GET", { id }],
      [authEvents.GET, "GET"],
    ];
    for (const [handler, method, params] of denied) {
      const res = await call(
        handler,
        req(method, standard.headers, org, method === "GET" ? undefined : {}),
        params,
      );
      expect(res.status).toBe(403);
    }

    const slug = `set-${randomBytes(4).toString("hex")}`;
    const created = await call(
      portal.POST,
      req("POST", admin.headers, org, { name: "Help", slug }),
    );
    expect(created.status).toBe(200);
    expect((await created.json()).portal).toMatchObject({ slug, status: "active" });
    const type = await call(
      userTypes.POST,
      req("POST", admin.headers, org, {
        name: "Customers",
        modules: { Contacts: { enabled: true, actions: { view: true } } },
      }),
    );
    expect(type.status).toBe(200);
    const bad = await call(
      userTypes.POST,
      req("POST", admin.headers, org, {
        name: "Bad",
        modules: { Leads: { enabled: true, actions: { view: true } } },
      }),
    );
    expect(bad.status).toBe(400);
    const listed = await call(users.GET, req("GET", admin.headers, org));
    expect((await listed.json()).users).toEqual([]);

    // staging-link tests (CTO requirement: prod -> 404, other org's identity -> 404)
    const prevEnv = process.env.NODE_ENV;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      const prodRes = await call(
        stagingLink.GET as unknown as Handler,
        req("GET", admin.headers, org),
        { id },
      );
      expect(prodRes.status).toBe(404);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prevEnv;
    }

    const { ctx: otherCtx, admin: otherAdmin } = await createTestOrganization();

    // Querying an identity that doesn't exist in calling org -> 404
    const notFoundRes = await call(
      stagingLink.GET as unknown as Handler,
      req("GET", admin.headers, org),
      { id },
    );
    expect(notFoundRes.status).toBe(404);

    // Create an identity in Org A
    let testIdentityId = "";
    await withOrg(ctx, async (tx: Transaction) => {
      const [p] = await tx
        .select()
        .from(schema.portals)
        .where(eq(schema.portals.organizationId, ctx.orgId));
      const [u] = await tx
        .select()
        .from(schema.portalUserTypes)
        .where(eq(schema.portalUserTypes.organizationId, ctx.orgId));
      if (!p || !u) throw new Error("Portal or user type not found");
      const [row] = await tx
        .insert(schema.portalIdentities)
        .values({
          organizationId: ctx.orgId,
          portalId: p.id,
          userTypeId: u.id,
          email: "alice.test@example.com",
          displayName: "Alice Test",
          recordModule: "Contacts",
          recordId: "rec-1",
          status: "invited",
          createdBy: ctx.userId,
        })
        .returning({ id: schema.portalIdentities.id });
      testIdentityId = row?.id ?? "";
    });

    // Populate staging mailer for Org A
    const mailer = getPortalMailer();
    mailer.outbox.set(`${ctx.orgId}:mail-1`, {
      idempotencyKey: "token-1",
      kind: "invite",
      from: { address: "support@example.com" },
      to: "alice.test@example.com",
      subject: "Welcome",
      text: "Accept here: https://crm.example.test/portal/help/accept#t=abc1234567890123456789012345678901234567890123",
      html: "<p>Accept</p>",
      orgId: ctx.orgId,
    });

    // Other org admin requesting Org A's identity -> 404
    const crossOrgRes = await call(
      stagingLink.GET as unknown as Handler,
      req("GET", otherAdmin.headers, otherCtx.orgSlug),
      { id: testIdentityId },
    );
    expect(crossOrgRes.status).toBe(404);

    // Calling org's admin requesting its own identity -> 200 with link and token
    const successRes = await call(
      stagingLink.GET as unknown as Handler,
      req("GET", admin.headers, org),
      { id: testIdentityId },
    );
    expect(successRes.status).toBe(200);
    const successJson = await successRes.json();
    expect(successJson.token).toBe("abc1234567890123456789012345678901234567890123");
    expect(successJson.link).toContain("#t=abc1234567890123456789012345678901234567890123");

    const disabled = await call(
      portal.PATCH,
      req("PATCH", admin.headers, org, { status: "disabled" }),
    );
    expect((await disabled.json()).portal.status).toBe("disabled");
  });
});
