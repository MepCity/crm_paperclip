import { toClientPermissions } from "@crm/core/access";
import { addTestMember, createTestOrganization } from "@crm/core/testing";
import { describe, expect, it } from "vitest";
import * as recordWebformUsage from "@/app/crm/v2.1/[module]/[recordId]/webform_usage/route";
import * as rulesDetail from "@/app/crm/v2.1/settings/webform_auto_response_rules/[id]/route";
import * as rulesReorder from "@/app/crm/v2.1/settings/webform_auto_response_rules/actions/reorder/route";
import * as rulesList from "@/app/crm/v2.1/settings/webform_auto_response_rules/route";
import * as webformsActivate from "@/app/crm/v2.1/settings/webforms/[id]/actions/activate/route";
import * as webformsDeactivate from "@/app/crm/v2.1/settings/webforms/[id]/actions/deactivate/route";
import * as webformsPublish from "@/app/crm/v2.1/settings/webforms/[id]/actions/publish/route";
import * as webformsKey from "@/app/crm/v2.1/settings/webforms/[id]/actions/regenerate_key/route";
import * as webformsAnalytics from "@/app/crm/v2.1/settings/webforms/[id]/analytics/route";
import * as webformsLocations from "@/app/crm/v2.1/settings/webforms/[id]/locations/route";
import * as webformsDetail from "@/app/crm/v2.1/settings/webforms/[id]/route";
import * as webformsFields from "@/app/crm/v2.1/settings/webforms/eligible_fields/route";
import * as webformsList from "@/app/crm/v2.1/settings/webforms/route";
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

describe("webforms settings routes access gating", () => {
  it("denies users without admin.manageWebforms with 403 on every endpoint and hides Settings entry", async () => {
    const { ctx, admin } = await createTestOrganization();
    const standardMember = await addTestMember(ctx, "member");

    const webformsNavLink = settingsNav.find((link) => link.id === "webforms");
    expect(webformsNavLink).toBeDefined();
    if (!webformsNavLink) throw new Error("webformsNavLink not found");

    // 1. Settings navigation entry check
    // Standard member snapshot permissions
    const { getAccessSnapshot } = await import("@crm/core/access");
    const adminSnapshot = await getAccessSnapshot(ctx);
    const standardSnapshot = await getAccessSnapshot(standardMember.ctx);

    const adminClientPerms = toClientPermissions(adminSnapshot, ["Leads"]);
    const standardClientPerms = toClientPermissions(standardSnapshot, ["Leads"]);

    expect(adminClientPerms.admin.manageWebforms).toBe(true);
    expect(standardClientPerms.admin.manageWebforms).toBe(false);

    expect(isNavLinkAllowed(webformsNavLink, adminClientPerms)).toBe(true);
    expect(isNavLinkAllowed(webformsNavLink, standardClientPerms)).toBe(false);

    // 2. 403 on every webform endpoint for standard member
    // GET list
    const deniedList = await call(
      webformsList.GET as Handler,
      req("GET", "/crm/v2.1/settings/webforms", standardMember.headers, ctx.orgSlug),
    );
    expect(deniedList.status).toBe(403);

    // POST create
    const deniedCreate = await call(
      webformsList.POST as Handler,
      req("POST", "/crm/v2.1/settings/webforms", standardMember.headers, ctx.orgSlug, {
        name: "Test",
        module: "Leads",
      }),
    );
    expect(deniedCreate.status).toBe(403);

    // Admin creates a form to test detail endpoints
    const adminCreate = await call(
      webformsList.POST as Handler,
      req("POST", "/crm/v2.1/settings/webforms", admin.headers, ctx.orgSlug, {
        name: "Member Gating Test Form",
        module: "Leads",
      }),
    );
    expect(adminCreate.status).toBe(200);
    const { webform } = (await adminCreate.json()) as { webform: { id: string } };
    const formId = webform.id;

    // GET detail
    const deniedGet = await call(
      webformsDetail.GET as Handler,
      req("GET", `/crm/v2.1/settings/webforms/${formId}`, standardMember.headers, ctx.orgSlug),
      { id: formId },
    );
    expect(deniedGet.status).toBe(403);

    // PUT detail
    const deniedPut = await call(
      webformsDetail.PUT as Handler,
      req("PUT", `/crm/v2.1/settings/webforms/${formId}`, standardMember.headers, ctx.orgSlug, {
        name: "Updated",
      }),
      { id: formId },
    );
    expect(deniedPut.status).toBe(403);

    // POST publish
    const deniedPublish = await call(
      webformsPublish.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/webforms/${formId}/actions/publish`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: formId },
    );
    expect(deniedPublish.status).toBe(403);

    // POST activate
    const deniedActivate = await call(
      webformsActivate.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/webforms/${formId}/actions/activate`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: formId },
    );
    expect(deniedActivate.status).toBe(403);

    // POST deactivate
    const deniedDeactivate = await call(
      webformsDeactivate.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/webforms/${formId}/actions/deactivate`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: formId },
    );
    expect(deniedDeactivate.status).toBe(403);

    // POST regenerate key
    const deniedKey = await call(
      webformsKey.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/webforms/${formId}/actions/regenerate_key`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: formId },
    );
    expect(deniedKey.status).toBe(403);

    // GET locations
    const deniedLocGet = await call(
      webformsLocations.GET as Handler,
      req(
        "GET",
        `/crm/v2.1/settings/webforms/${formId}/locations`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: formId },
    );
    expect(deniedLocGet.status).toBe(403);

    // POST location
    const deniedLocPost = await call(
      webformsLocations.POST as Handler,
      req(
        "POST",
        `/crm/v2.1/settings/webforms/${formId}/locations`,
        standardMember.headers,
        ctx.orgSlug,
        {
          origin: "https://example.com",
        },
      ),
      { id: formId },
    );
    expect(deniedLocPost.status).toBe(403);

    // GET eligible fields
    const deniedFields = await call(
      webformsFields.GET as Handler,
      req(
        "GET",
        "/crm/v2.1/settings/webforms/eligible_fields?module=Leads",
        standardMember.headers,
        ctx.orgSlug,
      ),
    );
    expect(deniedFields.status).toBe(403);

    // GET auto-response rules
    const deniedRulesGet = await call(
      rulesList.GET as Handler,
      req(
        "GET",
        "/crm/v2.1/settings/webform_auto_response_rules",
        standardMember.headers,
        ctx.orgSlug,
      ),
    );
    expect(deniedRulesGet.status).toBe(403);

    // POST auto-response rule
    const deniedRulesPost = await call(
      rulesList.POST as Handler,
      req(
        "POST",
        "/crm/v2.1/settings/webform_auto_response_rules",
        standardMember.headers,
        ctx.orgSlug,
        {
          module: "Leads",
          name: "Welcome",
        },
      ),
    );
    expect(deniedRulesPost.status).toBe(403);

    // POST reorder rules
    const deniedRulesReorder = await call(
      rulesReorder.POST as Handler,
      req(
        "POST",
        "/crm/v2.1/settings/webform_auto_response_rules/actions/reorder",
        standardMember.headers,
        ctx.orgSlug,
        {
          module: "Leads",
          ids: [],
        },
      ),
    );
    expect(deniedRulesReorder.status).toBe(403);

    // Auto-response rules detail (GET, PUT, DELETE)
    const dummyRuleId = "00000000-0000-0000-0000-000000000000";
    const deniedRuleGet = await call(
      rulesDetail.GET as Handler,
      req(
        "GET",
        `/crm/v2.1/settings/webform_auto_response_rules/${dummyRuleId}`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: dummyRuleId },
    );
    expect(deniedRuleGet.status).toBe(403);

    const deniedRulePut = await call(
      rulesDetail.PUT as Handler,
      req(
        "PUT",
        `/crm/v2.1/settings/webform_auto_response_rules/${dummyRuleId}`,
        standardMember.headers,
        ctx.orgSlug,
        { name: "test" },
      ),
      { id: dummyRuleId },
    );
    expect(deniedRulePut.status).toBe(403);

    const deniedRuleDelete = await call(
      rulesDetail.DELETE as Handler,
      req(
        "DELETE",
        `/crm/v2.1/settings/webform_auto_response_rules/${dummyRuleId}`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: dummyRuleId },
    );
    expect(deniedRuleDelete.status).toBe(403);

    // GET analytics
    const deniedAnalytics = await call(
      webformsAnalytics.GET as Handler,
      req(
        "GET",
        `/crm/v2.1/settings/webforms/${formId}/analytics`,
        standardMember.headers,
        ctx.orgSlug,
      ),
      { id: formId },
    );
    expect(deniedAnalytics.status).toBe(403);

    // Admin can access analytics
    const adminAnalytics = await call(
      webformsAnalytics.GET as Handler,
      req("GET", `/crm/v2.1/settings/webforms/${formId}/analytics`, admin.headers, ctx.orgSlug),
      { id: formId },
    );
    expect(adminAnalytics.status).toBe(200);
    const analyticsBody = (await adminAnalytics.json()) as { analytics: { formId: string } };
    expect(analyticsBody.analytics.formId).toBe(formId);

    // Record Webform Usage endpoint module guard
    const unsupportedModuleUsage = await call(
      recordWebformUsage.GET as Handler,
      req("GET", "/crm/v2.1/Accounts/acc-1/webform_usage", admin.headers, ctx.orgSlug),
      { module: "Accounts", recordId: "acc-1" },
    );
    expect(unsupportedModuleUsage.status).toBe(404);

    const supportedModuleUsage = await call(
      recordWebformUsage.GET as Handler,
      req("GET", "/crm/v2.1/Leads/lead-1/webform_usage", admin.headers, ctx.orgSlug),
      { module: "Leads", recordId: "lead-1" },
    );
    expect(supportedModuleUsage.status).toBe(200);
    const usageBody = (await supportedModuleUsage.json()) as { submissions: unknown[] };
    expect(Array.isArray(usageBody.submissions)).toBe(true);

    // DELETE form
    const deniedDelete = await call(
      webformsDetail.DELETE as Handler,
      req("DELETE", `/crm/v2.1/settings/webforms/${formId}`, standardMember.headers, ctx.orgSlug),
      { id: formId },
    );
    expect(deniedDelete.status).toBe(403);
  });
});
