import { expect, test } from "@playwright/test";

test("home page shows the application name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "MepCity CRM" })).toBeVisible();
});

test("health endpoint reports ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});
