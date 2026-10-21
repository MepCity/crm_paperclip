import { signUpNewUser } from "./support/auth";
import { moduleDraftsPath, moduleListDefaultPath, moduleTagsPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { exerciseSystemFilters } from "./support/system-filters";
import { expect, test } from "./support/test";

test("Cases shell entry, views, columns and sorting", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Cases", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tab\/Cases\/list$/);
  const list = page.locator(".module-list-page");

  // KL-01 default view
  await expect(list.locator("[data-view-pill]")).toHaveText("All Cases");
  for (const name of ["Case Number", "Subject", "Status", "Priority"]) {
    await expect(list.getByRole("columnheader", { name, exact: true })).toBeVisible();
  }

  // KL-02 menu
  await list.getByRole("button", { name: "Custom views" }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(12);
  await page.getByRole("menuitem", { name: "Escalated Cases", exact: true }).click();
  await expect(list.locator("[data-view-pill]")).toHaveText("Escalated Cases");
  await expect(list.getByRole("columnheader", { name: "Case Origin" })).toBeVisible();

  await list.getByRole("button", { name: "Custom views" }).click();
  await page.getByRole("menuitem", { name: "All Cases", exact: true }).click();
  await expect(list.locator("[data-view-pill]")).toHaveText("All Cases");

  // KL-04 sort
  await list.getByRole("button", { name: "Subject column options" }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(page).toHaveURL(/sort_by=Subject/);
});

test("Cases filter, alphabet, empty state and record route", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Cases"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  // KL-34 alphabet
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "A", exact: true }).click();
  await expect(list.getByRole("button", { name: "Filter by first letter" })).toContainText("A");
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "All", exact: true }).click();

  // Field filter with no match: KL-38, KL-39
  const statusRow = list
    .getByRole("listitem")
    .filter({ has: page.getByRole("checkbox", { name: "Status", exact: true }) });
  await statusRow.scrollIntoViewIfNeeded();
  await statusRow.getByText("Status", { exact: true }).click();
  await list.getByRole("button", { name: "Status value", exact: true }).click();
  await page.locator(".filter-choice-popover").getByRole("option").nth(1).click();
  await page.keyboard.press("Escape");
  const nameRow = list
    .getByRole("listitem")
    .filter({ has: page.getByRole("checkbox", { name: "Subject", exact: true }) });
  await nameRow.getByText("Subject", { exact: true }).click();
  await list.getByRole("textbox", { name: "Subject value" }).fill("Synthetic unmatched name");
  await list.getByRole("button", { name: "Apply Filter" }).click();
  await expect(list.getByText("No Cases found.")).toBeVisible();
  await expect(list.getByRole("group", { name: "Records summary" })).toContainText(
    /Total Records\s*0/,
  );
  await list.getByRole("button", { name: "Clear", exact: true }).click();

  // Row link to detail
  const link = list.locator("tbody tr").first().getByRole("link").first();
  if ((await link.count()) > 0) {
    await link.click();
    await expect(page).toHaveURL(/\/tab\/Cases\/[^/?]+/);
    await expect(page.locator("[data-record-frame]")).toBeVisible();
  }
});

test("Cases Actions menu and later-module controls stay inert", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Cases"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const before = page.url();

  // KL-13 (M6) and KL-32 (M11)
  await list.getByRole("button", { name: "More", exact: true }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  await list.getByRole("button", { name: "View Settings" }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect(page.url()).toBe(before);

  // KL-14
  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Drafts",
    "Mass Email",
    "Approve Cases",
    "Create Client Script",
    "Export Cases",
    "Sheet view",
    "Print View",
  ]);
  await page.getByRole("menuitem", { name: "Manage Tags", exact: true }).click({ force: true });
  await expect(page).toHaveURL(moduleTagsPath(org.slug, "Cases"));
});

test("Cases applies and clears all five system filters with matching list/count requests", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await exerciseSystemFilters(page, org.slug, "Cases", 60);
});

test("Cases Actions exports through the shared dialog", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Cases"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Export Cases", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Export Cases", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Select view/ })).toContainText("All Cases");
  await expect(dialog.getByRole("radio", { name: "All fields", exact: true })).toBeChecked();
  await expect(dialog.getByRole("radio", { name: "Choose fields", exact: true })).toBeVisible();
  await expect(dialog.getByRole("radio", { name: "Exclude fields", exact: true })).toBeVisible();
  await expect(dialog.getByText("CSV", { exact: true })).toBeVisible();
  await expect(dialog.getByText("UTF-8", { exact: true })).toBeVisible();
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/crm/v2.2/Cases/actions/export") &&
      response.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: "Export", exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ module: "Cases", status: "completed" });
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Export completed", { exact: true })).toBeVisible();
  await page.goto(`/crm/${org.slug}/tab/Cases/import`);
  await expect(page.getByRole("heading", { name: "Page not found", exact: true })).toBeVisible();
});

test("Cases view menu and Actions links match the shared list flows", async ({
  page,
}, testInfo) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Cases"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  await list.getByRole("button", { name: "Custom views" }).click();
  const dropdownRow = page.getByRole("menuitem", { name: "Show custom views as Dropdown" });
  await expect(dropdownRow).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("cases-view-menu.png") });
  expect((await dropdownRow.boundingBox())?.height).toBeLessThan(42);
  expect(
    (await page.getByRole("menu", { name: "Custom views" }).boundingBox())?.width,
  ).toBeGreaterThan(300);
  await page.keyboard.press("Escape");

  await page.goto(moduleListDefaultPath(org.slug, "Accounts"));
  await page.getByRole("button", { name: "Custom views" }).click();
  await expect(page.getByRole("menuitem", { name: "Show custom views as Dropdown" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("accounts-view-menu.png") });
  expect(
    (await page.getByRole("menuitem", { name: "Show custom views as Dropdown" }).boundingBox())
      ?.height,
  ).toBeLessThan(42);
  await page.goto(moduleListDefaultPath(org.slug, "Cases"));
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Drafts", exact: true }).click();
  await expect(page).toHaveURL(moduleDraftsPath(org.slug, "Cases"));
  await expect(page.getByRole("heading", { name: "Criteria", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(moduleListDefaultPath(org.slug, "Cases"));

  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Print View", exact: true }).hover();
  const printMenu = page.getByRole("menu", { name: "Print View", exact: true });
  await expect(printMenu.getByRole("menuitem")).toHaveText([
    "Print Default view",
    "Print Using Canvas",
  ]);
  await expect(
    printMenu.getByRole("menuitem", { name: "Print Using Canvas", exact: true }),
  ).toHaveAttribute("data-later-module", "M6");
  await printMenu.getByRole("menuitem", { name: "Print Default view", exact: true }).click();
  await expect(page).toHaveURL(/\/tab\/Cases\/print\?viewId=/);
  await expect(page.locator('[data-print-kind="list"]')).toBeVisible();
});

test("Cases related-module filter applies with and without Notes", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Cases"));
  const headers = { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin };
  const created = await page.request.post("/crm/v2.2/Cases", {
    headers,
    data: {
      data: [{ Subject: "Synthetic related filter case", Status: "New", Case_Origin: "Web" }],
    },
  });
  expect(created.status()).toBe(200);
  const id = (await created.json()).data[0].details.id;
  const note = await page.request.post("/crm/v2.2/Notes", {
    headers,
    data: {
      data: [
        {
          Parent_Id: { module: "Cases", id },
          Note_Title: "Synthetic related note",
          Note_Content: "Synthetic content",
        },
      ],
    },
  });
  expect(note.status()).toBe(200);
  await page.reload();
  const list = page.locator(".module-list-page");
  const total = list
    .getByRole("group", { name: "Records summary" })
    .locator('[data-part="total-value"]');
  await expect(total).toHaveText("61");

  // Emails stays a later-module row; Notes is live.
  await expect(list.getByRole("checkbox", { name: "Emails", exact: true })).toHaveAttribute(
    "data-later-module",
    "M10",
  );
  const notes = list.getByRole("checkbox", { name: "Notes", exact: true });
  await notes.scrollIntoViewIfNeeded();
  await list.getByText("Notes", { exact: true }).last().click();
  await expect(list.getByText("Any Notes")).toBeVisible();
  await list.getByRole("button", { name: "Apply Filter" }).click();
  // The seed already has one case with a note, so assert the partition rather than a fixed count.
  await expect(total).not.toHaveText("61");
  const withNotes = Number(await total.textContent());
  expect(withNotes).toBeGreaterThanOrEqual(1);
  await list.getByRole("button", { name: /Notes presence/ }).click();
  await page.getByRole("option", { name: "without", exact: true }).click();
  await list.getByRole("button", { name: "Apply Filter" }).click();
  await expect(total).toHaveText(String(61 - withNotes));
});
