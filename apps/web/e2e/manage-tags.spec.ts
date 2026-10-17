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
  await page.getByRole("checkbox", { name: "Tag", exact: true }).check();
  await page.getByRole("button", { name: "Tag value", exact: true }).click();
  await expect(page.getByText("Shared catalogue", { exact: true })).toBeVisible();
  await page.goto(moduleRecordPath(org.slug, "Leads", "100000000000000000"));
  const header = page.locator("[data-record-header]");
  await header.getByRole("button", { name: "Add Tags" }).click();
  const dialog = page.getByRole("dialog", { name: "Add Tags" });
  await dialog.getByRole("combobox", { name: "Enter Tags" }).fill("Shared");
  await dialog.getByRole("option", { name: "Shared catalogue" }).click();
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
