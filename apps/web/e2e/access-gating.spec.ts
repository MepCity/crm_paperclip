import { createStandardManagerUser } from "@crm/core/testing";
import { signIn, signUpNewUser } from "./support/auth";
import {
  LEADS_MODULE,
  moduleListDefaultPath,
  moduleRecordEditPath,
  moduleRecordPath,
} from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

// ADR 0017 §8 / §11.6: the Standard/Manager user sees a gated UI (hidden, not disabled).
test("a restricted profile gets a gated shell, list and routes", async ({ page, browser }) => {
  test.setTimeout(180_000);
  await signUpNewUser(page, { name: "Ada Admin" });
  const organization = await createOrganization(page);

  const headers = { "X-CRM-ORG": organization.slug, Origin: new URL(page.url()).origin };
  // The administrator restricts the Standard profile: no Deals, no Leads create/delete.
  const listed = await page.request.get("/crm/v9/settings/profiles", { headers });
  expect(listed.ok()).toBeTruthy();
  const profiles = (await listed.json()).profiles as {
    id: string;
    kind: string;
    // biome-ignore lint/suspicious/noExplicitAny: opaque profile JSON
    permissions: Record<string, any>;
  }[];
  const standard = profiles.find((p) => p.kind === "standard");
  if (!standard) throw new Error("Standard profile missing");
  const detail = await page.request.get(`/crm/v9/settings/profiles/${standard.id}`, { headers });
  const permissions = (await detail.json()).profile.permissions;
  permissions.modules.Deals = { view: false, create: false, edit: false, delete: false };
  permissions.modules.Leads = { view: true, create: false, edit: true, delete: false };
  const saved = await page.request.put(`/crm/v9/settings/profiles/${standard.id}`, {
    headers,
    data: { permissions },
  });
  expect(saved.ok(), await saved.text()).toBeTruthy();

  // Administrator keeps everything.
  await page.goto(moduleListDefaultPath(organization.slug, LEADS_MODULE));
  await expect(page.getByRole("link", { name: "Deals", exact: true })).toBeVisible();

  const member = await createStandardManagerUser(organization.slug);
  const context = await browser.newContext();
  const user = await context.newPage();
  try {
    await signIn(user, member);
    await user.goto(moduleListDefaultPath(organization.slug, LEADS_MODULE));
    await expect(user.getByRole("navigation", { name: "Navigation" })).toBeVisible();
    await expect(user.getByRole("link", { name: "Deals", exact: true })).toHaveCount(0);
    await expect(user.getByRole("link", { name: "Leads", exact: true })).toBeVisible();
    await expect(user.getByRole("link", { name: "Create Lead" })).toHaveCount(0);
    await expect(user.getByRole("button", { name: "Create Lead" })).toHaveCount(0);

    // Settings sections without their administrator key are absent.
    await user.goto(`/crm/${organization.slug}/settings/members`);
    await expect(user.getByRole("link", { name: "Currencies" })).toHaveCount(0);

    // A module without view renders the denied state.
    await user.goto(moduleListDefaultPath(organization.slug, "Deals"));
    await expect(user.getByTestId("access-denied")).toBeVisible();
    // Create route without permission is denied too.
    await user.goto(`/crm/${organization.slug}/tab/${LEADS_MODULE}/create`);
    await expect(user.getByTestId("access-denied")).toBeVisible();
  } finally {
    await context.close();
  }
});

// ADR 0017 §4.5 / §8 / §11.6: field flags come from the viewer-aware projection, and record
// visibility follows the role hierarchy.
test("field security, delete gating and role-hierarchy visibility reach the UI", async ({
  page,
  browser,
}) => {
  test.setTimeout(240_000);
  await signUpNewUser(page, { name: "Ada Admin" });
  const organization = await createOrganization(page);
  const origin = new URL(page.url()).origin;
  const headers = { "X-CRM-ORG": organization.slug, Origin: origin };

  const profiles = (await (await page.request.get("/crm/v9/settings/profiles", { headers })).json())
    .profiles as { id: string; kind: string }[];
  const standard = profiles.find((p) => p.kind === "standard");
  if (!standard) throw new Error("Standard profile missing");
  const detail = await page.request.get(`/crm/v9/settings/profiles/${standard.id}`, { headers });
  const permissions = (await detail.json()).profile.permissions;
  permissions.modules.Leads = { view: true, create: true, edit: true, delete: false };
  expect(
    (
      await page.request.put(`/crm/v9/settings/profiles/${standard.id}`, {
        headers,
        data: { permissions },
      })
    ).ok(),
  ).toBeTruthy();
  const fieldSave = await page.request.put(
    `/crm/v9/settings/profiles/${standard.id}/field_permissions/Leads`,
    {
      headers,
      data: {
        field_permissions: [
          { field: "Industry", access: "hidden" },
          { field: "Website", access: "read_only" },
        ],
      },
    },
  );
  expect(fieldSave.ok(), await fieldSave.text()).toBeTruthy();

  // A role below Manager: its owner is a subordinate of the Manager user.
  const roles = (await (await page.request.get("/crm/v9/settings/roles", { headers })).json())
    .roles as { id: string; name: string }[];
  const managerRole = roles.find((role) => role.name === "Manager");
  if (!managerRole) throw new Error("Manager role missing");
  const created = await page.request.post("/crm/v9/settings/roles", {
    headers,
    data: { name: "Junior", parent_role_id: managerRole.id },
  });
  expect(created.ok(), await created.text()).toBeTruthy();

  const manager = await createStandardManagerUser(organization.slug);
  const junior = await createStandardManagerUser(organization.slug, "Junior");

  const postLead = async (who: typeof page, name: string) => {
    const response = await who.request.post("/crm/v2.2/Leads", {
      headers,
      data: {
        data: [
          {
            Last_Name: name,
            Company: "Gating Co",
          },
        ],
      },
    });
    expect(response.ok(), await response.text()).toBeTruthy();
    return (await response.json()).data[0].details.id as string;
  };
  const adminLeadId = await postLead(page, "ZZ Admin Lead");

  const juniorContext = await browser.newContext();
  const juniorPage = await juniorContext.newPage();
  const managerContext = await browser.newContext();
  const user = await managerContext.newPage();
  user.setDefaultTimeout(30_000);
  try {
    await signIn(juniorPage, junior);
    const juniorLeadId = await postLead(juniorPage, "ZZ Junior Lead");

    // Only the administrator may set the read-only field.
    const filled = await page.request.put(`/crm/v2.2/Leads/${juniorLeadId}`, {
      headers,
      data: { data: [{ Website: "https://example.test" }] },
    });
    expect(filled.ok(), await filled.text()).toBeTruthy();

    await signIn(user, manager);
    // Subordinate's record is visible; the superior's private record is a 404 page.
    await user.goto(moduleRecordPath(organization.slug, LEADS_MODULE, juniorLeadId));
    await expect(user.getByText("ZZ Junior Lead").first()).toBeVisible();
    // Hidden field absent, read-only field shown but not inline-editable; no Delete control.
    await expect(user.getByText("Industry", { exact: true })).toHaveCount(0);
    await expect(user.getByText("Website", { exact: true }).first()).toBeVisible();
    await expect(user.getByRole("button", { name: "Delete" })).toHaveCount(0);

    // Edit form: hidden field has no input, read-only field is disabled.
    await user.goto(moduleRecordEditPath(organization.slug, LEADS_MODULE, juniorLeadId));
    await expect(user.getByLabel("Last Name")).toBeVisible();
    await expect(user.getByLabel("Industry")).toHaveCount(0);
    await expect(user.getByLabel("Website")).toBeDisabled();

    // List: no Industry column in the chooser or header; selection bar offers no Delete.
    await user.goto(moduleListDefaultPath(organization.slug, LEADS_MODULE));
    const table = user.getByRole("table", { name: "Records" });
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: "Industry" })).toHaveCount(0);
    await table
      .getByRole("checkbox", { name: /Select / })
      .first()
      .check({ force: true });
    await expect(user.getByRole("button", { name: "Delete" })).toHaveCount(0);

    // Export header omits the hidden field.
    const exported = await user.request.post("/crm/v2.2/Leads/actions/export", {
      headers,
      data: { fields: "all" },
    });
    expect(exported.ok(), await exported.text()).toBeTruthy();
    const job = await exported.json();
    const file = await user.request.get(`/crm/v9/settings/exports/${job.id}/download`, { headers });
    const csv = await file.text();
    const header = csv.replace(/^\uFEFF/, "").split("\n")[0] ?? "";
    expect(header).toContain("Website");
    expect(header).not.toContain("Industry");

    // The administrator's private lead is invisible to a subordinate role's manager.
    await user.goto(moduleRecordPath(organization.slug, LEADS_MODULE, adminLeadId));
    await expect(user.getByText("The requested page could not be found.")).toBeVisible();
    await expect(user.getByText("ZZ Admin Lead")).toHaveCount(0);
  } finally {
    await juniorContext.close();
    await managerContext.close();
  }
});
