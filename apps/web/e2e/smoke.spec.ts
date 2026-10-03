import { expectNoA11yViolations } from "./support/a11y";
import { expect, test } from "./support/test";

test("home page shows the application name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "MepCity CRM" })).toBeVisible();
  await expectNoA11yViolations(page);
});

test("health endpoint reports ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});
