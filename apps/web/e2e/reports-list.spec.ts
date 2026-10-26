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

test("Reports category selector: open, inventory R09-R19 in order, close on Escape/outside, selection stays All Reports", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1470, height: 900 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Reports", exact: true })
    .click();
  await expect(page).toHaveURL(`/crm/${org.slug}/tab/Reports`);

  const nonGetRequests: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      nonGetRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  const selectorTrigger = page.getByRole("button", { name: "All Reports", exact: true });
  await expect(selectorTrigger).toBeVisible();
  await expect(selectorTrigger).not.toHaveAttribute("aria-disabled", "true");

  // 1. Click R01 to open panel
  await selectorTrigger.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // R09: Search Folder textbox
  const searchInput = dialog.getByRole("textbox", { name: "Search Folder" });
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toHaveValue("");
  // Accepts text without filtering
  await searchInput.fill("Sample folder query");
  await expect(searchInput).toHaveValue("Sample folder query");

  // Listbox with R10–R17 in exact order
  const listbox = dialog.getByRole("listbox", { name: "Report folders" });
  await expect(listbox).toBeVisible();
  const options = listbox.getByRole("option");
  await expect(options).toHaveCount(8);

  const expectedOrder = [
    "All Reports",
    "My Reports",
    "Favorites",
    "Recently Viewed",
    "Shared Reports",
    "Scheduled Reports",
    "Recently Deleted",
    "Account and Contact Reports",
  ];

  for (const [i, label] of expectedOrder.entries()) {
    await expect(options.nth(i)).toContainText(label);
  }

  // R10 is selected
  const allReportsOption = options.nth(0);
  await expect(allReportsOption).toHaveAttribute("aria-selected", "true");
  await expect(allReportsOption).toHaveAttribute("data-selected", "true");
  await expect(allReportsOption).toHaveClass(/bg-surface-selected/);

  // R11-R17 are not selected
  for (let i = 1; i < 8; i++) {
    await expect(options.nth(i)).toHaveAttribute("aria-selected", "false");
  }

  // Divider between categories and folders
  await expect(dialog.getByRole("separator")).toBeVisible();

  // Footer entries R18 and R19
  const manageFolders = dialog.getByRole("button", { name: "Manage Folders", exact: true });
  await expect(manageFolders).toBeVisible();
  await expect(manageFolders).toHaveAttribute("aria-disabled", "true");

  const advancedAnalytics = dialog.getByRole("button", { name: /Advanced analytics/i });
  await expect(advancedAnalytics).toBeVisible();
  await expect(advancedAnalytics).toHaveAttribute("aria-disabled", "true");
  await expect(advancedAnalytics).toContainText("Advanced Analytics");

  // 2. Escape closes the panel, focus returns to R01, selection stays All Reports
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(selectorTrigger).toBeFocused();
  await expect(selectorTrigger).toContainText("All Reports");

  // 3. Outside click closes panel, focus returns to R01
  await selectorTrigger.click();
  await expect(dialog).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(dialog).toBeHidden();
  await expect(selectorTrigger).toBeFocused();
  await expect(selectorTrigger).toContainText("All Reports");

  // 4. Clicking R11-R17 closes panel and keeps All Reports (selection semantics unobserved)
  await selectorTrigger.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("option", { name: "My Reports", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(selectorTrigger).toBeFocused();
  await expect(selectorTrigger).toContainText("All Reports");

  // 5. Tooltip on disabled R18 and R19
  await selectorTrigger.click();
  await expect(dialog).toBeVisible();
  await manageFolders.hover();
  await expect(page.getByRole("tooltip")).toContainText("Not available yet");

  await advancedAnalytics.hover();
  await expect(page.getByRole("tooltip")).toContainText("Not available yet");

  // Escape dismisses the active tooltip first, then closes the panel dialog
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  // No non-GET requests were issued
  expect(nonGetRequests).toEqual([]);
});

test("Reports read-only contract: opening list and navigating to report issues zero non-GET requests", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1470, height: 900 });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  const nonGetRequests: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      nonGetRequests.push(`${request.method()} ${request.url()}`);
    }
  });

  await page.goto(`/crm/${org.slug}/tab/Reports`);
  await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();

  await page.getByRole("link", { name: "Weekly outreach overview", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/tab/Reports/sample-report-1`);
  await expect(
    page.getByRole("heading", { name: "Weekly outreach overview", exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();

  expect(nonGetRequests).toEqual([]);
});
