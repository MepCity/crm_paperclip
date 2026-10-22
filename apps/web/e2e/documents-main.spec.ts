import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Documents screen over HTTP: roots, team folder, navigation, empty state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/tab/Documents`);
  await expect(page.getByRole("button", { name: /My Folders/ }).first()).toBeVisible();
  // The personal root shows the application folder row and the Apps breadcrumb.
  const docs = page.getByRole("list", { name: "Documents" });
  await expect(docs.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Apps");
  await expect(page.getByText("No items available.")).toHaveCount(0);

  await page.getByRole("button", { name: /Team Folder/ }).click();
  await expect(page.getByText("Last Modified")).toBeVisible();
  await expect(page.getByLabel("Locked")).toBeVisible();
  await expect(docs.getByRole("listitem")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Select all" })).toBeDisabled();

  await page.getByRole("button", { name: "Empty", exact: true }).click();
  await expect(page.getByText("No items available.")).toBeVisible();
  const crumb = page.getByRole("navigation", { name: "Breadcrumb" });
  await expect(crumb).toContainText("Empty");

  await crumb.getByRole("button", { name: "Team Folder" }).click();
  await expect(docs.getByRole("listitem")).toHaveCount(3);
});
