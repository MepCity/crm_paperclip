import { addAccessTestMember, createTestOrganization } from "@crm/core/testing";
import { describe, expect, it } from "vitest";
import * as groups from "@/app/crm/v9/settings/groups/route";
import * as profile from "@/app/crm/v9/settings/profiles/[profileId]/route";
import * as profiles from "@/app/crm/v9/settings/profiles/route";
import * as roles from "@/app/crm/v9/settings/roles/route";

type Handler = (
  request: Request,
  context: { params?: Promise<Record<string, string>> },
) => Promise<Response>;

function req(method: string, path: string, headers: Headers, org: string, body?: unknown) {
  const h = new Headers(headers);
  h.set("X-CRM-ORG", org);
  h.set("Origin", new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").origin);
  if (body !== undefined) h.set("Content-Type", "application/json");
  return new Request(`http://127.0.0.1:3000${path}`, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const call = (handler: Handler, request: Request, params: Record<string, string> = {}) =>
  handler(request, { params: Promise.resolve(params) });

describe("access settings routes", () => {
  it("serve administrators, deny standard members with permission_denied, and round-trip writes", async () => {
    const { ctx, admin } = await createTestOrganization();
    const list = await call(
      profiles.GET as Handler,
      req("GET", "/crm/v9/settings/profiles", admin.headers, ctx.orgSlug),
    );
    expect(list.status).toBe(200);
    const { profiles: rows } = (await list.json()) as { profiles: { id: string; name: string }[] };
    const standard = rows.find((p) => p.name === "Standard");
    if (!standard) throw new Error("Standard profile missing");

    const created = await call(
      profiles.POST as Handler,
      req("POST", "/crm/v9/settings/profiles", admin.headers, ctx.orgSlug, {
        source_profile_id: standard.id,
        name: "Support",
      }),
    );
    expect(created.status).toBe(200);
    const { profile: clone } = (await created.json()) as { profile: { id: string } };
    const removed = await call(
      profile.DELETE as Handler,
      req("DELETE", `/crm/v9/settings/profiles/${clone.id}`, admin.headers, ctx.orgSlug),
      { profileId: clone.id },
    );
    expect(removed.status).toBe(204);

    const bad = await call(
      groups.POST as Handler,
      req("POST", "/crm/v9/settings/groups", admin.headers, ctx.orgSlug, { name: "" }),
    );
    expect(bad.status).toBe(400);

    const member = await addAccessTestMember(ctx);
    for (const [handler, path] of [
      [profiles.GET, "/crm/v9/settings/profiles"],
      [roles.GET, "/crm/v9/settings/roles"],
      [groups.GET, "/crm/v9/settings/groups"],
    ] as const) {
      const denied = await call(handler as Handler, req("GET", path, member.headers, ctx.orgSlug));
      expect(denied.status).toBe(403);
      expect(await denied.json()).toMatchObject({ code: "permission_denied", status: "error" });
    }
    const anonymous = await call(
      profiles.GET as Handler,
      req("GET", "/crm/v9/settings/profiles", new Headers(), ctx.orgSlug),
    );
    expect(anonymous.status).toBe(401);
  });
});
