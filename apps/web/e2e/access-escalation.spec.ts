import { createStandardManagerUser } from "@crm/core/testing";
import { signIn, signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

// MEP-1468 security probe: a non-administrator cannot reach any access setting by URL or API,
// cannot assign itself a profile or role, and Reports/Analytics without `view` are denied
// server-side (the navigation link is hidden too).
test("a Standard user cannot escalate or guess its way into settings, reports or analytics", async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  await signUpNewUser(page, { name: "Ada Admin" });
  const organization = await createOrganization(page);
  const headers = { "X-CRM-ORG": organization.slug, Origin: new URL(page.url()).origin };

  const profiles = (await (await page.request.get("/crm/v9/settings/profiles", { headers })).json())
    .profiles as { id: string; kind: string }[];
  const standard = profiles.find((p) => p.kind === "standard");
  const administrator = profiles.find((p) => p.kind === "administrator");
  if (!standard || !administrator) throw new Error("System profiles missing");
  const roles = (await (await page.request.get("/crm/v9/settings/roles", { headers })).json())
    .roles as { id: string; name: string }[];
  const root = roles.find((r) => r.name === "CEO");
  if (!root) throw new Error("Root role missing");
  const detail = await page.request.get(`/crm/v9/settings/profiles/${standard.id}`, { headers });
  const permissions = (await detail.json()).profile.permissions;
  permissions.features.reports.view = false;
  permissions.features.analytics.view = false;
  const saved = await page.request.put(`/crm/v9/settings/profiles/${standard.id}`, {
    headers,
    data: { permissions },
  });
  expect(saved.ok(), await saved.text()).toBeTruthy();

  const member = await createStandardManagerUser(organization.slug);
  const context = await browser.newContext();
  const user = await context.newPage();
  try {
    await signIn(user, member);
    const base = `/crm/${organization.slug}`;

    // URL-guessing every access settings screen renders the denied page, not the screen.
    for (const path of [
      "/settings/profiles",
      `/settings/profiles/${standard.id}`,
      "/settings/field-permissions",
      "/settings/roles",
      `/settings/roles/${root.id}`,
      "/settings/groups",
      "/settings/data-sharing",
    ]) {
      await user.goto(`${base}${path}`);
      await expect(user.getByRole("alert").filter({ hasText: "Access denied" })).toBeVisible();
      await expect(user.getByRole("button", { name: /clone|new role|create group/i })).toHaveCount(
        0,
      );
    }

    // Reports and Analytics without `view`: no navigation link, denied page on a guessed URL.
    await user.goto(`${base}/tab/Reports`);
    await expect(user.getByTestId("access-denied")).toBeVisible();
    await expect(user.getByRole("link", { name: "Reports", exact: true })).toHaveCount(0);
    await user.goto(`${base}/tab/Dashboards`);
    await expect(user.getByTestId("access-denied")).toBeVisible();

    // The access API refuses every read and write, including self-assignment.
    const userHeaders = { "X-CRM-ORG": organization.slug, Origin: new URL(user.url()).origin };
    for (const path of [
      "/crm/v9/settings/profiles",
      "/crm/v9/settings/roles",
      "/crm/v9/settings/groups",
      "/crm/v9/settings/sharing_rules?module=Leads",
      "/crm/v9/settings/module_defaults",
      "/crm/v9/settings/member_access",
    ])
      expect((await user.request.get(path, { headers: userHeaders })).status(), path).toBe(403);
    for (const data of [{ profile_id: administrator.id }, { role_id: root.id }]) {
      const response = await user.request.put(`/crm/v9/settings/member_access/${member.userId}`, {
        headers: userHeaders,
        data,
      });
      expect(response.status()).toBe(403);
    }
    const clone = await user.request.post("/crm/v9/settings/profiles", {
      headers: userHeaders,
      data: { source_profile_id: administrator.id, name: "Escalated" },
    });
    expect(clone.status()).toBe(403);

    // Nothing changed: the member still has the Standard profile in the Manager role.
    const access = (
      await (await page.request.get("/crm/v9/settings/member_access", { headers })).json()
    ).members as { user_id?: string; userId?: string; profile_id?: string; profileId?: string }[];
    const row = access.find((m) => (m.user_id ?? m.userId) === member.userId);
    expect(row?.profile_id ?? row?.profileId).toBe(standard.id);
  } finally {
    await context.close();
  }
});
