import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

for (const module of ["Solutions", "Cases"] as const) {
  test(`${module} Manage Tags creates, renames and deletes a tag`, async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, module));
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Manage Tags", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Manage Tags" })).toBeVisible();
    await page.getByRole("button", { name: "New Tag", exact: true }).click();
    await page.getByRole("textbox", { name: "Tag Name" }).fill("Inventory tag");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Tags used : 1 / 100")).toBeVisible();
    await page.getByRole("button", { name: "Rename tag Inventory tag" }).click();
    await page.getByRole("textbox", { name: "Tag Name" }).fill("Renamed inventory tag");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await page.getByRole("button", { name: "Delete tag Renamed inventory tag" }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText("Tags used : 0 / 100")).toBeVisible();
  });
}
