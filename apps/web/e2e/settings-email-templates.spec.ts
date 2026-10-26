import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Email templates settings screen opens, displays rows, filters by search, and has no console or network errors", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("response", (res) => {
    if (res.status() >= 400) {
      failedResponses.push(`${res.status()} ${res.url()}`);
    }
  });

  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // 1. Navigate to templates settings page
  await page.goto(`/crm/${org.slug}/settings/templates?type=email`);

  // 2. Check title and controls
  await expect(page.getByRole("heading", { name: "Templates" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Email" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search Template" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "All Modules" })).toBeVisible();

  // 3. Check table headers
  await expect(page.getByRole("columnheader", { name: "Template Name" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Modified By" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Last Used" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Stats" })).toBeVisible();

  // 4. Rows are visible
  await expect(page.getByRole("button", { name: "Big Deal Alert" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lead Welcome Notice" })).toBeVisible();

  // 5. Search filtering
  const searchInput = page.getByRole("searchbox", { name: "Search Template" });
  await searchInput.fill("welcome");
  await expect(page.getByRole("button", { name: "Lead Welcome Notice" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Big Deal Alert" })).toHaveCount(0);

  // 6. Search with no match shows empty state
  await searchInput.fill("nonexistent-template-query");
  await expect(page.getByText("No records to display.")).toBeVisible();

  // 7. Clear search restores rows
  await searchInput.clear();
  await expect(page.getByRole("button", { name: "Big Deal Alert" })).toBeVisible();

  // 8. Assert no 4xx or 5xx responses or console errors
  expect(failedResponses).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("email template create opens module, gallery, full-page editor and both save options", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 2048, height: 1163 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/settings/templates?type=email`);
  await page.getByRole("button", { name: "New Template" }).click();
  await expect(page.getByRole("dialog", { name: "Create Email Template" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("template-module.png") });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Template Gallery" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("template-gallery.png") });
  await page.getByRole("button", { name: "Add HTML / Plain Text" }).click();
  await page.getByRole("textbox", { name: "Template name" }).fill("Team welcome");
  await page.getByRole("textbox", { name: "Template body" }).fill("Hello team");
  await page.getByRole("button", { name: "Plain text", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Template body" })).toHaveText("Hello team");
  const toolbar = page.getByRole("toolbar", { name: "Template formatting" });
  await expect(toolbar.getByRole("button", { name: "Bold", exact: true })).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "Show Tips" })).toBeVisible();
  await page.getByRole("button", { name: "HTML", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "Save now", exact: true })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Save as draft" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("template-editor-save.png") });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Templates" })).toBeVisible();
});
