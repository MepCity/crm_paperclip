import { getDb } from "@crm/core";
import { toClientPermissions } from "@crm/core/access";
import { addAccessTestMember, addTestMember, createTestOrganization } from "@crm/core/testing";
import { schema } from "@crm/db";
import { describe, expect, it } from "vitest";
import * as journeysActivate from "@/app/crm/v2.1/settings/journeys/[id]/actions/activate/route";
import * as journeysDeactivate from "@/app/crm/v2.1/settings/journeys/[id]/actions/deactivate/route";
import * as journeysPublish from "@/app/crm/v2.1/settings/journeys/[id]/actions/publish/route";
import * as journeysDetail from "@/app/crm/v2.1/settings/journeys/[id]/route";
import * as journeysList from "@/app/crm/v2.1/settings/journeys/route";
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

describe("journeys settings routes access gating", () => {
  it("enforces permission gating for every route across administrator, viewer, and unauthorized profiles", async () => {
    const { ctx, admin } = await createTestOrganization();
    const db = getDb();

    // Standard member has journeys: { view: false } and manageJourneys: false by default
    const standardMember = await addTestMember(ctx, "member");

    const { getAccessSnapshot } = await import("@crm/core/access");
    const standardSnapshot = await getAccessSnapshot(standardMember.ctx);

    // Create a custom viewer profile with features.journeys.view: true
    const [viewerProfile] = await db
      .insert(schema.accessProfiles)
      .values({
        organizationId: ctx.orgId,
        name: "Journey Viewer Profile",
        kind: "custom",
        permissions: {
          ...standardSnapshot.permissions,
          features: {
            ...standardSnapshot.permissions.features,
            journeys: { view: true },
          },
        },
      })
      .returning();

    if (!viewerProfile) throw new Error("Failed to create viewer profile");

    const viewerMember = await addAccessTestMember(ctx, {
      profile: viewerProfile.id,
    });

    const commandCenterNavLink = settingsNav.find((link) => link.id === "commandcenter");
    expect(commandCenterNavLink).toBeDefined();
    if (!commandCenterNavLink) throw new Error("commandCenterNavLink not found");

    const adminSnapshot = await getAccessSnapshot(ctx);
    const viewerSnapshot = await getAccessSnapshot(viewerMember.ctx);

    const adminClientPerms = toClientPermissions(adminSnapshot, ["Leads"]);
    const standardClientPerms = toClientPermissions(standardSnapshot, ["Leads"]);
    const viewerClientPerms = toClientPermissions(viewerSnapshot, ["Leads"]);

    // Administrator has view and manage
    expect(adminClientPerms.features.journeys.view).toBe(true);
    expect(adminClientPerms.admin.manageJourneys).toBe(true);

    // Standard has view false, manageJourneys false by default
    expect(standardClientPerms.features.journeys.view).toBe(false);
    expect(standardClientPerms.admin.manageJourneys).toBe(false);

    // Viewer member has view true, manageJourneys false
    expect(viewerClientPerms.features.journeys.view).toBe(true);
    expect(viewerClientPerms.admin.manageJourneys).toBe(false);

    // Navigation visibility: Admin and Viewer see it; Standard does not
    expect(isNavLinkAllowed(commandCenterNavLink, adminClientPerms)).toBe(true);
    expect(isNavLinkAllowed(commandCenterNavLink, viewerClientPerms)).toBe(true);
    expect(isNavLinkAllowed(commandCenterNavLink, standardClientPerms)).toBe(false);

    // 1. Admin creates a journey
    const adminCreate = await call(
      journeysList.POST as Handler,
      req("POST", "/crm/v2.1/settings/journeys", admin.headers, ctx.orgSlug, {
        name: "Route Test Journey",
        module: "Leads",
      }),
    );
    expect(adminCreate.status).toBe(200);
    const { journey } = (await adminCreate.json()) as { journey: { id: string } };
    const journeyId = journey.id;

    // 2. Standard user (no view, no manage) gets 403 on all routes
    const stdList = await call(
      journeysList.GET as Handler,
      req("GET", "/crm/v2.1/settings/journeys", standardMember.headers, ctx.orgSlug),
    );
    expect(stdList.status).toBe(403);

    const stdDetail = await call(
      journeysDetail.GET as Handler,
      req("GET", `/crm/v2.1/settings/journeys/${journeyId}`, standardMember.headers, ctx.orgSlug),
      { id: journeyId },
    );
    expect(stdDetail.status).toBe(403);

    const stdCreate = await call(
      journeysList.POST as Handler,
      req("POST", "/crm/v2.1/settings/journeys", standardMember.headers, ctx.orgSlug, {
        name: "Std Journey",
        module: "Leads",
      }),
    );
    expect(stdCreate.status).toBe(403);

    const stdPut = await call(
      journeysDetail.PUT as Handler,
      req("PUT", `/crm/v2.1/settings/journeys/${journeyId}`, standardMember.headers, ctx.orgSlug, {
        name: "Hacked Name",
      }),
      { id: journeyId },
    );
    expect(stdPut.status).toBe(403);

    const stdPublish = await call(
      journeysPublish.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/journeys/${journeyId}/actions/publish`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: journeyId },
    );
    expect(stdPublish.status).toBe(403);

    const stdActivate = await call(
      journeysActivate.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/journeys/${journeyId}/actions/activate`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: journeyId },
    );
    expect(stdActivate.status).toBe(403);

    const stdDeactivate = await call(
      journeysDeactivate.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/journeys/${journeyId}/actions/deactivate`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: journeyId },
    );
    expect(stdDeactivate.status).toBe(403);

    const stdDelete = await call(
      journeysDetail.DELETE as Handler,
      req(
        "DELETE",
        `/crm/v2.1/settings/journeys/${journeyId}`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: journeyId },
    );
    expect(stdDelete.status).toBe(403);

    // 3. Viewer user (view: true, manageJourneys: false)
    // CAN view list and detail (200)
    const viewerList = await call(
      journeysList.GET as Handler,
      req("GET", "/crm/v2.1/settings/journeys", viewerMember.headers, ctx.orgSlug),
    );
    expect(viewerList.status).toBe(200);

    const viewerDetail = await call(
      journeysDetail.GET as Handler,
      req("GET", `/crm/v2.1/settings/journeys/${journeyId}`, viewerMember.headers, ctx.orgSlug),
      { id: journeyId },
    );
    expect(viewerDetail.status).toBe(200);

    // CANNOT perform mutations (all 403)
    const viewerCreate = await call(
      journeysList.POST as Handler,
      req("POST", "/crm/v2.1/settings/journeys", viewerMember.headers, ctx.orgSlug, {
        name: "Viewer Journey",
        module: "Leads",
      }),
    );
    expect(viewerCreate.status).toBe(403);

    const viewerPut = await call(
      journeysDetail.PUT as Handler,
      req("PUT", `/crm/v2.1/settings/journeys/${journeyId}`, viewerMember.headers, ctx.orgSlug, {
        name: "Viewer Update",
      }),
      { id: journeyId },
    );
    expect(viewerPut.status).toBe(403);

    const viewerPublish = await call(
      journeysPublish.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/journeys/${journeyId}/actions/publish`,
        viewerMember.headers,
        ctx.orgSlug,
      ),
      { id: journeyId },
    );
    expect(viewerPublish.status).toBe(403);

    const viewerDelete = await call(
      journeysDetail.DELETE as Handler,
      req("DELETE", `/crm/v2.1/settings/journeys/${journeyId}`, viewerMember.headers, ctx.orgSlug),
      { id: journeyId },
    );
    expect(viewerDelete.status).toBe(403);
  });
});
