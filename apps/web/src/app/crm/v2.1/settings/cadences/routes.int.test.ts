import { toClientPermissions } from "@crm/core/access";
import { addAccessTestMember, addTestMember, createTestOrganization } from "@crm/core/testing";
import { describe, expect, it } from "vitest";
import * as cadencesActivate from "@/app/crm/v2.1/settings/cadences/[id]/actions/activate/route";
import * as cadencesDeactivate from "@/app/crm/v2.1/settings/cadences/[id]/actions/deactivate/route";
import * as cadencesPublish from "@/app/crm/v2.1/settings/cadences/[id]/actions/publish/route";
import * as cadencesDetail from "@/app/crm/v2.1/settings/cadences/[id]/route";
import * as cadencesList from "@/app/crm/v2.1/settings/cadences/route";
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

describe("cadences settings routes access gating", () => {
  it("enforces permission gating for every route across administrator, standard (view only), and custom (no access)", async () => {
    const { ctx, admin } = await createTestOrganization();
    const standardMember = await addTestMember(ctx, "member");

    const cadencesNavLink = settingsNav.find((link) => link.id === "cadences");
    expect(cadencesNavLink).toBeDefined();
    if (!cadencesNavLink) throw new Error("cadencesNavLink not found");

    const { getAccessSnapshot } = await import("@crm/core/access");
    const adminSnapshot = await getAccessSnapshot(ctx);
    const standardSnapshot = await getAccessSnapshot(standardMember.ctx);

    const adminClientPerms = toClientPermissions(adminSnapshot, ["Leads"]);
    const standardClientPerms = toClientPermissions(standardSnapshot, ["Leads"]);

    // Administrator has view and manage
    expect(adminClientPerms.features.cadences.view).toBe(true);
    expect(adminClientPerms.features.cadences.manage).toBe(true);

    // Standard has view true, manage false by default
    expect(standardClientPerms.features.cadences.view).toBe(true);
    expect(standardClientPerms.features.cadences.manage).toBe(false);

    // Navigation visibility
    expect(isNavLinkAllowed(cadencesNavLink, adminClientPerms)).toBe(true);
    expect(isNavLinkAllowed(cadencesNavLink, standardClientPerms)).toBe(true);

    // 1. Admin creates a cadence to test with
    const adminCreate = await call(
      cadencesList.POST as Handler,
      req("POST", "/crm/v2.1/settings/cadences", admin.headers, ctx.orgSlug, {
        name: "Route Test Cadence",
        module: "Leads",
        audience: { kind: "manual" },
      }),
    );
    expect(adminCreate.status).toBe(200);
    const { cadence } = (await adminCreate.json()) as { cadence: { id: string } };
    const cadenceId = cadence.id;

    // 2. Standard user (view: true, manage: false)
    // CAN view list (200)
    const stdList = await call(
      cadencesList.GET as Handler,
      req("GET", "/crm/v2.1/settings/cadences", standardMember.headers, ctx.orgSlug),
    );
    expect(stdList.status).toBe(200);

    // CAN view detail (200)
    const stdDetail = await call(
      cadencesDetail.GET as Handler,
      req("GET", `/crm/v2.1/settings/cadences/${cadenceId}`, standardMember.headers, ctx.orgSlug),
      { id: cadenceId },
    );
    expect(stdDetail.status).toBe(200);

    // CANNOT create (403)
    const stdCreate = await call(
      cadencesList.POST as Handler,
      req("POST", "/crm/v2.1/settings/cadences", standardMember.headers, ctx.orgSlug, {
        name: "Unauthorized Cadence",
        module: "Leads",
      }),
    );
    expect(stdCreate.status).toBe(403);

    // CANNOT update (403)
    const stdUpdate = await call(
      cadencesDetail.PUT as Handler,
      req("PUT", `/crm/v2.1/settings/cadences/${cadenceId}`, standardMember.headers, ctx.orgSlug, {
        description: "Hacked",
      }),
      { id: cadenceId },
    );
    expect(stdUpdate.status).toBe(403);

    // CANNOT publish (403)
    const stdPublish = await call(
      cadencesPublish.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/cadences/${cadenceId}/actions/publish`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: cadenceId },
    );
    expect(stdPublish.status).toBe(403);

    // CANNOT activate (403)
    const stdActivate = await call(
      cadencesActivate.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/cadences/${cadenceId}/actions/activate`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: cadenceId },
    );
    expect(stdActivate.status).toBe(403);

    // CANNOT deactivate (403)
    const stdDeactivate = await call(
      cadencesDeactivate.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/cadences/${cadenceId}/actions/deactivate`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: cadenceId },
    );
    expect(stdDeactivate.status).toBe(403);

    // CANNOT delete (403)
    const stdDelete = await call(
      cadencesDetail.DELETE as Handler,
      req(
        "DELETE",
        `/crm/v2.1/settings/cadences/${cadenceId}`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: cadenceId },
    );
    expect(stdDelete.status).toBe(403);

    // 3. User with NO permissions (view: false, manage: false)
    const { getDb } = await import("@crm/core");
    const { schema } = await import("@crm/db");
    const db = getDb();

    const customPerms = {
      ...standardSnapshot.permissions,
      features: {
        ...standardSnapshot.permissions.features,
        cadences: { view: false, manage: false },
      },
    };

    const [noAccessProfile] = await db
      .insert(schema.accessProfiles)
      .values({
        organizationId: ctx.orgId,
        name: "No Cadences Profile",
        kind: "custom",
        permissions: customPerms,
      })
      .returning();

    if (!noAccessProfile) throw new Error("Profile creation failed");

    const noAccessMember = await addAccessTestMember(ctx, {
      profile: noAccessProfile.id,
    });

    const noAccessSnapshot = await getAccessSnapshot(noAccessMember.ctx);
    const noAccessClientPerms = toClientPermissions(noAccessSnapshot, ["Leads"]);

    // Navigation is hidden
    expect(isNavLinkAllowed(cadencesNavLink, noAccessClientPerms)).toBe(false);

    // GET list returns 403
    const noAccessList = await call(
      cadencesList.GET as Handler,
      req("GET", "/crm/v2.1/settings/cadences", noAccessMember.headers, ctx.orgSlug),
    );
    expect(noAccessList.status).toBe(403);

    // GET detail returns 403
    const noAccessDetail = await call(
      cadencesDetail.GET as Handler,
      req("GET", `/crm/v2.1/settings/cadences/${cadenceId}`, noAccessMember.headers, ctx.orgSlug),
      { id: cadenceId },
    );
    expect(noAccessDetail.status).toBe(403);

    // POST create returns 403
    const noAccessCreate = await call(
      cadencesList.POST as Handler,
      req("POST", "/crm/v2.1/settings/cadences", noAccessMember.headers, ctx.orgSlug, {
        name: "Denied",
        module: "Leads",
      }),
    );
    expect(noAccessCreate.status).toBe(403);

    // 4. Admin performs full operations successfully
    // Update draft with a step
    const adminUpdate = await call(
      cadencesDetail.PUT as Handler,
      req("PUT", `/crm/v2.1/settings/cadences/${cadenceId}`, admin.headers, ctx.orgSlug, {
        steps: [
          {
            id: "step-1",
            kind: "email",
            delay: { amount: 0, unit: "minutes" },
            templateId: "tpl-1",
          },
        ],
      }),
      { id: cadenceId },
    );
    expect(adminUpdate.status).toBe(200);

    // Publish
    const adminPublish = await call(
      cadencesPublish.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/cadences/${cadenceId}/actions/publish`,
        admin.headers,
        ctx.orgSlug,
      ),
      { id: cadenceId },
    );
    expect(adminPublish.status).toBe(200);

    // Deactivate
    const adminDeactivate = await call(
      cadencesDeactivate.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/cadences/${cadenceId}/actions/deactivate`,
        admin.headers,
        ctx.orgSlug,
      ),
      { id: cadenceId },
    );
    expect(adminDeactivate.status).toBe(200);

    // Activate
    const adminActivate = await call(
      cadencesActivate.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/cadences/${cadenceId}/actions/activate`,
        admin.headers,
        ctx.orgSlug,
      ),
      { id: cadenceId },
    );
    expect(adminActivate.status).toBe(200);

    // Delete
    const adminDelete = await call(
      cadencesDetail.DELETE as Handler,
      req("DELETE", `/crm/v2.1/settings/cadences/${cadenceId}`, admin.headers, ctx.orgSlug),
      { id: cadenceId },
    );
    expect(adminDelete.status).toBe(200);
  });
});
