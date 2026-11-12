import { randomBytes } from "node:crypto";
import { addAccessTestMember, createTestOrganization } from "@crm/core/testing";
import { describe, expect, it } from "vitest";
import * as authEvents from "@/app/crm/v2.1/settings/portals/auth-events/route";
import * as portal from "@/app/crm/v2.1/settings/portals/route";
import * as userTypeDetail from "@/app/crm/v2.1/settings/portals/user-types/[id]/route";
import * as userTypes from "@/app/crm/v2.1/settings/portals/user-types/route";
import * as actions from "@/app/crm/v2.1/settings/portals/users/[id]/actions/[action]/route";
import * as users from "@/app/crm/v2.1/settings/portals/users/route";

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
    const disabled = await call(
      portal.PATCH,
      req("PATCH", admin.headers, org, { status: "disabled" }),
    );
    expect((await disabled.json()).portal.status).toBe("disabled");
  });
});
