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
