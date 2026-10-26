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
  await expect(page.getByRole("button", { name: "Create Dashboard" })).toBeEnabled();
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

test("creates an empty private fixture dashboard and opens the unsaved quick-chart criteria", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 2048, height: 1163 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/tab/Dashboards`);
  await page.getByRole("button", { name: "Create Dashboard" }).click();
  await expect(page.getByRole("textbox", { name: "Dashboard name" })).toHaveValue(
    "Untitled Dashboard",
  );
  await expect(page.getByRole("button", { name: "Favorite dashboard" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit dashboard access" })).toBeVisible();
  await page.getByRole("textbox", { name: "Dashboard name" }).fill("Team overview");
  await page.screenshot({ path: testInfo.outputPath("dashboard-create.png") });
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No Components Found" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("dashboard-empty.png") });
  await page.getByRole("button", { name: "Add Component", exact: true }).click();
  await page.getByRole("button", { name: "Quick chart" }).click();
  const chart = page.getByRole("dialog", { name: "Add Chart" });
  await expect(chart.getByText("Select a module to display a visual preview.")).toBeVisible();
  await chart.getByRole("button", { name: /Modules/ }).click();
  await page.getByRole("option", { name: "Leads", exact: true }).click();
  await chart.getByRole("button", { name: "+ Criteria filter", exact: true }).click();
  await expect(chart.getByRole("region", { name: "Criteria filter" })).toBeVisible();
  const rings = chart.locator("span.rounded-full.border-current");
  await expect(rings).toHaveCount(3);
  await expect(chart.locator("svg.size-4.rounded-full.border-current")).toHaveCount(0);
  await expect(
    chart.getByRole("region", { name: "Criteria filter" }).locator("svg.text-accent-green"),
  ).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("chart-criteria.png") });
  await chart.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No Components Found" })).toBeVisible();
});
