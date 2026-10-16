import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

for (const module of ["Leads", "Contacts", "Accounts", "Deals"] as const) {
  test(`${module} requests and paints activity ribbons only when evidenced`, async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const requestPromise = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        new URL(request.url()).pathname === `/crm/v2.2/${module}/bulk`,
    );
    await page.goto(
      `${moduleListDefaultPath(org.slug, module)}?presentation=table&per_page=100&page=3`,
    );
    const request = await requestPromise;
    const table = page.getByRole("table", { name: "Records" });
    await expect(table.locator("tbody tr").first()).toBeVisible();
    const ribbons = table.locator("[data-part=activity-ribbon]");
    if (module === "Leads" || module === "Contacts") {
      expect(request.postDataJSON()).toMatchObject({ include_activity_summary: true });
      await expect(ribbons.first()).toBeVisible();
      await expect(ribbons.first()).toHaveAttribute("role", "img");
      await expect(ribbons.first()).not.toHaveAttribute("href");
      await expect(ribbons.first().locator("xpath=ancestor::td")).toHaveAttribute(
        "data-part",
        "badge",
      );
    } else {
      expect(request.postDataJSON() ?? {}).not.toHaveProperty("include_activity_summary");
      await expect(ribbons).toHaveCount(0);
    }
  });
}
