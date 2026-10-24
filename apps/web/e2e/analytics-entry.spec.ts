import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Analytics entry: resting overview dashboard, toolbar, empty/value card states and refresh", async ({
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
  await expect(leadsCard).toContainText("No data available");

  const revenueCard = page.getByRole("region", { name: "REVENUE THIS MONTH" });
  await expect(revenueCard).toContainText("No data available");

  const pipelineCard = page.getByRole("region", { name: "DEALS IN PIPELINE" });
  await expect(pipelineCard).toContainText("9");

  const accountsCard = page.getByRole("region", { name: "ACCOUNTS THIS MONTH" });
  await expect(accountsCard).toContainText("32");
  await expect(accountsCard).toContainText("47.5%");
  await expect(accountsCard).toContainText("Last Month Relative: 61");

  // Row 2: Target cards (A11.01–A11.02)
  const leadTargetCard = page.getByRole("region", { name: "LEAD GENERATION TARGET - THIS YEAR" });
  await expect(leadTargetCard).toContainText("10");
  await expect(leadTargetCard).toContainText("Target: 1000");
  await expect(leadTargetCard).toContainText("Remaining : 990");

  const revenueTargetCard = page.getByRole("region", { name: "REVENUE TARGET - THIS YEAR" });
  await expect(revenueTargetCard).toContainText("Entire Org");
  await expect(revenueTargetCard).toContainText("Target : $10,000,000.00");
  await expect(revenueTargetCard).toContainText("Achieved : $785,000.00");

  // Row 3: Breakdown cards (A12.01–A12.03)
  const perfCard = page.getByRole("region", { name: "LAST 3 MONTHS PERFORMANCE MONITOR" });
  await expect(perfCard).toContainText("July 2026");
  await expect(perfCard).toContainText("LEADS CREATED");
  await expect(perfCard).toContainText("DEALS WON");

  const sourcesCard = page.getByRole("region", { name: "LEADS BY SOURCE" });
  await expect(sourcesCard).toContainText("Advertisement");
  await expect(sourcesCard).toContainText("Cold Call");

  const repsCard = page.getByRole("region", { name: "PROLIFIC SALES REPS" });
  await expect(repsCard).toContainText("Deal Owner");
  await expect(repsCard).toContainText("Hatice Arslan");
  await expect(repsCard).toContainText("$35,000.00");

  // Verify per-card refresh buttons exist
  const cardRefreshButtons = page.getByRole("button", { name: "Refresh Component" });
  await expect(cardRefreshButtons).toHaveCount(9);

  // Click toolbar refresh and verify dashboard re-renders without errors
  await refreshBtn.click();
  await expect(pipelineCard).toContainText("9");

  await page.screenshot({ path: testInfo.outputPath("analytics-entry.png"), fullPage: true });
});
