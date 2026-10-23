import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Report detail: header, toolbar, empty and populated tables, back", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 900 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/tab/Reports/sample-report-2`);
  await expect(
    page
      .getByRole("region", { name: "Report detail" })
      .getByRole("heading", { name: "Message engagement summary" }),
  ).toBeVisible();
  for (const name of ["Edit", "Filter", "Filter By Date", "Clear", "Show Details"]) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  }
  const table = page.getByRole("table", { name: "Report results" });
  await expect(table.getByRole("columnheader")).toHaveCount(9);
  await expect(page.getByText("No Data Found")).toBeVisible();
  await page.goto(`/crm/${org.slug}/tab/Reports/sample-report-1`);
  await expect(table.getByRole("row")).toHaveCount(3);
  await page.getByRole("button", { name: "Refresh report" }).click();
  await expect(table.getByRole("row")).toHaveCount(3);
  await page.getByRole("link", { name: "Back to Reports" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/tab/Reports`);
});
