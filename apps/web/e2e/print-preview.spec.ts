import { signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test.describe("Module 6 print page (interim layout)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
    await page.addInitScript(() => {
      (window as unknown as { __printCalls: number }).__printCalls = 0;
      window.print = () => {
        (window as unknown as { __printCalls: number }).__printCalls += 1;
      };
    });
  });

  test("Leads record More Options opens Print Preview; Print prints and Close goes back", async ({
    page,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    const link = page.locator("table tbody tr").first().getByRole("link").first();
    await expect(link).toBeVisible({ timeout: 15_000 });
    await link.click();
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    const detailUrl = page.url();

    await page.getByRole("button", { name: "More Options", exact: true }).click();
    await page.getByRole("menuitem", { name: "Print Preview" }).click();
    await expect(page).toHaveURL(/\/print$/);
    const printPage = page.locator('[data-print-kind="record"]');
    await expect(printPage).toBeVisible();
    await expect(printPage.getByRole("heading", { level: 2 }).first()).toBeVisible();

    await printPage.getByRole("button", { name: "Print" }).click();
    expect(
      await page.evaluate(() => (window as unknown as { __printCalls: number }).__printCalls),
    ).toBe(1);

    await printPage.getByRole("button", { name: "Close" }).click();
    await expect(page).toHaveURL(detailUrl);
  });

  test("Leads list Actions → Print View → Print Default view shows the view as a table", async ({
    page,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 15_000 });
    const rowCount = await page.locator("table tbody tr").count();

    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Print View" }).hover();
    await page.getByRole("menuitem", { name: "Print Default view" }).click();
    await expect(page).toHaveURL(/\/tab\/Leads\/print\?viewId=/);
    const printPage = page.locator('[data-print-kind="list"]');
    await expect(printPage.locator("table tbody tr")).toHaveCount(rowCount);

    await printPage.getByRole("button", { name: "Print" }).click();
    expect(
      await page.evaluate(() => (window as unknown as { __printCalls: number }).__printCalls),
    ).toBe(1);
    await printPage.getByRole("button", { name: "Close" }).click();
    await expect(page).toHaveURL(/\/tab\/Leads\/list/);
  });
});
