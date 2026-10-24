import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Reports landing: columns, inert controls and report placeholder navigation", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1470, height: 900 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Reports", exact: true })
    .click();
  await expect(page).toHaveURL(`/crm/${org.slug}/tab/Reports`);
  await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
  const table = page.getByRole("table");
  await expect(table.getByRole("row")).toHaveCount(14);
  for (const name of ["Report Name", "Description", "Folder", "Last Accessed Date", "Created By"]) {
    await expect(table.getByRole("columnheader", { name })).toBeVisible();
  }
  await expect(table.getByRole("row").nth(1).getByRole("cell").nth(4)).toHaveText("-");
  await expect(table.getByRole("row").nth(3)).toContainText("01.10.2026");
  const create = page.getByRole("button", { name: "Create Report" });
  await expect(create).toHaveAttribute("aria-disabled", "true");
  await expect(create).toHaveAccessibleDescription(/Not available/);
  await page.screenshot({ path: testInfo.outputPath("reports-landing.png"), fullPage: true });
  const search = page.getByRole("textbox", { name: "Search All Reports" });
  await expect(search).toHaveAttribute("readonly", "");

  const nonGetRequests: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      nonGetRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  for (const name of [
    "All Reports",
    "Create Report",
    "Reports help",
    "Favorite Weekly outreach overview",
    "Report actions: Weekly outreach overview",
  ]) {
    await expect(page.getByRole("button", { name, exact: true })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  }

  // R08: row actions ellipsis icon button visible on hover, inert, no non-GET request
  const firstRow = table.getByRole("row").nth(1);
  const rowActionsButton = firstRow.getByRole("button", {
    name: "Report actions: Weekly outreach overview",
    exact: true,
  });
  await expect(rowActionsButton).toHaveClass(/opacity-0/);
  await firstRow.hover();
  await expect(rowActionsButton).toBeVisible();
  await rowActionsButton.click({ force: true });

  const seventhRow = table.getByRole("row").nth(7);
  const seventhRowActions = seventhRow.getByRole("button", {
    name: /^Report actions:/,
  });
  await expect(seventhRowActions).toHaveClass(/opacity-0/);
  await seventhRow.hover();
  await expect(seventhRowActions).toBeVisible();
  await seventhRowActions.click({ force: true });

  expect(nonGetRequests).toEqual([]);

  const checkbox = page.getByRole("checkbox", { name: "Select Weekly outreach overview" });
  await page.locator("label").filter({ has: checkbox }).click();
  await expect(checkbox).not.toBeChecked();
  await expect(table.getByRole("row")).toHaveCount(14);
  await table.getByRole("link", { name: "Weekly outreach overview", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/tab/Reports/sample-report-1`);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Weekly outreach overview", exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to Reports", exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();
});
