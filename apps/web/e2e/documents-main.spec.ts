import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Documents main screen: folders, team folder, enter folder, breadcrumb", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/tab/Documents`);
  await expect(page.getByRole("button", { name: /My Folders/ }).first()).toBeVisible();
  await expect(page.getByText("Last Modified")).toBeVisible();
  const docs = page.getByRole("list", { name: "Documents" });
  await expect(docs.getByRole("listitem")).toHaveCount(1);
  await page.getByRole("button", { name: "Workspace Files" }).click();
  await expect(docs.getByRole("listitem").first()).toContainText("Contracts");

  await page.getByRole("button", { name: /Sales Team/ }).click();
  await expect(page.getByText("Quarterly targets.xlsx")).toBeVisible();
  await expect(page.getByLabel("Locked")).toBeVisible();

  await page
    .getByRole("button", { name: /My Folders/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Workspace Files" }).click();
  await page.getByRole("button", { name: "Proposals" }).click();
  await expect(page.getByText("Draft proposal.docx")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Proposals");
});
