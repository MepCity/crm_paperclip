import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Analytics entry: record-backed overview dashboard, toolbar, empty target states and refresh", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1470, height: 900 });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // Navigate via rail link (H06)
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Analytics", exact: true })
    .click();

  await expect(page).toHaveURL(`/crm/${org.slug}/tab/Dashboards`);
  await expect(page.getByRole("heading", { name: "Analytics", exact: true })).toBeVisible();

  // Toolbar controls (A01–A09)
  await expect(page.getByRole("button", { name: "All", exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Overview selector" })).toContainText(
    "Org Overview",
  );
  await expect(page.getByRole("button", { name: "Favorite Org Overview" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(page.getByLabel("Scope: All Users")).toContainText("All Users");

  await expect(page.getByRole("button", { name: "Add Component" })).toHaveAccessibleDescription(
    /Not available/,
  );
  const refreshBtn = page.getByRole("button", { name: "Refresh all components" });
  await expect(refreshBtn).toBeVisible();

  await expect(page.getByRole("button", { name: "Add Component" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(page.getByRole("button", { name: "Create Dashboard" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(page.getByRole("button", { name: "More actions" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(page.getByRole("button", { name: "Analytics help" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );

  // Row 1: KPI cards (A10.01–A10.04)
  const leadsCard = page.getByRole("region", { name: "LEADS THIS MONTH" });
  await expect(leadsCard.locator(".text-3xl")).toHaveText(/^\d+$/);
  const originalLeads = Number(await leadsCard.locator(".text-3xl").textContent());

  const revenueCard = page.getByRole("region", { name: "REVENUE THIS MONTH" });
  await expect(revenueCard).toBeVisible();

  const pipelineCard = page.getByRole("region", { name: "DEALS IN PIPELINE" });
  await expect(pipelineCard.locator(".text-3xl")).toHaveText(/^\d+$/);

  const accountsCard = page.getByRole("region", { name: "ACCOUNTS THIS MONTH" });
  await expect(accountsCard.locator(".text-3xl")).toHaveText(/^\d+$/);
  await expect(accountsCard).toContainText("Last Month Relative:");

  for (const title of [
    "LEAD GENERATION TARGET - THIS YEAR",
    "REVENUE TARGET - THIS YEAR",
    "LAST 3 MONTHS PERFORMANCE MONITOR",
  ]) {
    await expect(page.getByRole("region", { name: title })).toContainText("No data available");
  }
  await expect(page.getByRole("region", { name: "LEADS BY SOURCE" })).toBeVisible();
  await expect(page.getByRole("region", { name: "PROLIFIC SALES REPS" })).toBeVisible();

  // Verify per-card refresh buttons exist
  const cardRefreshButtons = page.getByRole("button", { name: "Refresh Component" });
  await expect(cardRefreshButtons).toHaveCount(9);

  // Click toolbar refresh and verify dashboard re-renders without errors
  const created = await page.request.post("/crm/v2.2/Leads", {
    headers: { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin },
    data: { data: [{ Last_Name: "Analytics refresh example", Company: "Analytics example" }] },
  });
  expect(created.ok()).toBe(true);
  await refreshBtn.click();
  await expect(leadsCard.locator(".text-3xl")).toHaveText(String(originalLeads + 1));
  await expect(pipelineCard.locator(".text-3xl")).toHaveText(/^\d+$/);

  await page.screenshot({ path: testInfo.outputPath("analytics-entry.png"), fullPage: true });
});
