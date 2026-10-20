import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Manage Tags shares the catalogue with record tags and list filter options", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Manage Tags", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Manage Tags" })).toBeVisible();
  await page.getByRole("button", { name: "New Tag", exact: true }).click();
  await page.getByRole("textbox", { name: "Tag Name" }).fill("Shared catalogue");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Tags used : 1 / 100")).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  const tagFilter = page.getByRole("checkbox", { name: "Tag", exact: true });
  await tagFilter.scrollIntoViewIfNeeded();
  await tagFilter.focus();
  await page.keyboard.press("Space");
  await expect(tagFilter).toBeChecked();
  await page.getByRole("button", { name: "Tag value", exact: true }).click();
  await expect(page.getByText("Shared catalogue", { exact: true })).toBeVisible();
  await page.goto(moduleRecordPath(org.slug, "Leads", "100000000000000000"));
  const header = page.locator("[data-record-header]");
  const catalogueRead = page.waitForResponse(
    (response) => response.request().method() === "POST" && response.url().includes("/tab/Leads/"),
  );
  await header.getByRole("button", { name: "Add Tags" }).click();
  await catalogueRead;
  const dialog = page.getByRole("dialog", { name: "Add Tags" });
  const entry = dialog.getByRole("combobox", { name: "Enter Tags" });
  await entry.fill("Shared");
  await entry.press("ArrowDown");
  await page.getByRole("option", { name: "Shared catalogue" }).click();
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(header.getByRole("button", { name: "Remove tag Shared catalogue" })).toBeVisible();
  await page.goto(`/crm/${org.slug}/tab/Leads/tags`);
  await page.getByRole("button", { name: "Rename tag Shared catalogue" }).click();
  await page.getByRole("textbox", { name: "Tag Name" }).fill("Renamed catalogue");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: "Delete tag Renamed catalogue" })).toBeVisible();
  await page.getByRole("button", { name: "Delete tag Renamed catalogue" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Tags used : 0 / 100")).toBeVisible();
  await page.goto(moduleRecordPath(org.slug, "Leads", "100000000000000000"));
  await expect(header.getByRole("button", { name: "Add Tags" })).toBeVisible();
  await expect(header.getByRole("button", { name: /^Remove tag / })).toHaveCount(0);
});
