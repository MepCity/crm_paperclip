import { toClientPermissions } from "@crm/core/access";
import { addTestMember, createTestOrganization } from "@crm/core/testing";
import { describe, expect, it } from "vitest";
import * as campaignsRoute from "@/app/crm/v2.1/settings/ads/campaigns/route";
import * as treeRoute from "@/app/crm/v2.1/settings/ads/tree/route";
import { isNavLinkAllowed, settingsNav } from "@/components/shell/nav";

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

describe("ads settings routes access gating", () => {
  it("enforces 403 for unauthorized members and allows administrators", async () => {
    const { ctx, admin } = await createTestOrganization();

    // Standard member has manageIntegrations: false by default
    const standardMember = await addTestMember(ctx, "member");

    const { getAccessSnapshot } = await import("@crm/core/access");
    const standardSnapshot = await getAccessSnapshot(standardMember.ctx);
    const adminSnapshot = await getAccessSnapshot(ctx);

    const adminClientPerms = toClientPermissions(adminSnapshot, ["Leads"]);
    const standardClientPerms = toClientPermissions(standardSnapshot, ["Leads"]);

    // Administrator has manageIntegrations: true
    expect(adminClientPerms.admin.manageIntegrations).toBe(true);

    // Standard member has manageIntegrations: false
    expect(standardClientPerms.admin.manageIntegrations).toBe(false);

    // Navigation item check
    const googleNavLink = settingsNav.find((link) => link.id === "google-extensions");
    expect(googleNavLink).toBeDefined();
    if (!googleNavLink) throw new Error("google-extensions nav link not found");

    expect(isNavLinkAllowed(googleNavLink, adminClientPerms)).toBe(true);
    expect(isNavLinkAllowed(googleNavLink, standardClientPerms)).toBe(false);

    // 1. Standard member GET /tree -> 403 Forbidden
    const deniedTree = await call(
      treeRoute.GET as Handler,
      req("GET", "/crm/v2.1/settings/ads/tree", standardMember.headers, ctx.orgSlug),
    );
    expect(deniedTree.status).toBe(403);

    // 2. Standard member POST /campaigns -> 403 Forbidden
    const deniedPost = await call(
      campaignsRoute.POST as Handler,
      req("POST", "/crm/v2.1/settings/ads/campaigns", standardMember.headers, ctx.orgSlug, {
        name: "Forbidden Campaign",
      }),
    );
    expect(deniedPost.status).toBe(403);

    // 3. Admin GET /tree -> 200 OK
    const allowedTree = await call(
      treeRoute.GET as Handler,
      req("GET", "/crm/v2.1/settings/ads/tree", admin.headers, ctx.orgSlug),
    );
    expect(allowedTree.status).toBe(200);

    // 4. Admin POST /campaigns -> 200 OK (campaign created)
    const allowedPost = await call(
      campaignsRoute.POST as Handler,
      req("POST", "/crm/v2.1/settings/ads/campaigns", admin.headers, ctx.orgSlug, {
        name: "Allowed Campaign",
      }),
    );
    expect(allowedPost.status).toBe(200);
    const data = await allowedPost.json();
    expect(data.campaign.name).toBe("Allowed Campaign");
  });
});
