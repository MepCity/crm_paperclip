import { createStandardManagerUser } from "@crm/core/testing";
import { signIn, signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleListDefaultPath } from "./support/crm-paths";
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
