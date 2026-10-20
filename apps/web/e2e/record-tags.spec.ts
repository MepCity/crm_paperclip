import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Leads record tags: focused opening, cancel, save, persistence and removal", async ({
  page,
}, testInfo) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));
  await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
  await page.goto(moduleRecordPath(org.slug, "Leads", "100000000000000000"));
  const header = page.locator("[data-record-header]");
  await header.getByRole("button", { name: "Add Tags" }).click();
  const popover = page.getByRole("dialog", { name: "Add Tags" });
  const entry = popover.getByRole("combobox", { name: "Enter Tags" });
  await expect(entry).toBeFocused();
  await expect(entry).toHaveValue("");
  await expect(popover.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
  await page.screenshot({ path: testInfo.outputPath("add-tags-initial.png") });
  await entry.fill("Discard");
  await entry.press("Escape");
  await expect(popover).toHaveCount(0);
  await header.getByRole("button", { name: "Add Tags" }).click();
  await expect(entry).toHaveValue("");
  await entry.fill("Example tag");
  await entry.press("Enter");
  await expect(
    popover.getByRole("button", { name: "Remove pending tag Example tag" }),
  ).toBeVisible();
  await popover.getByRole("button", { name: "Save", exact: true }).click();
  await expect(popover).toHaveCount(0);
  await expect(header.getByRole("button", { name: "Remove tag Example tag" })).toBeVisible();
  await page.reload();
  await header.getByRole("button", { name: "Remove tag Example tag" }).click();
  await expect(header.getByRole("button", { name: "Remove tag Example tag" })).toHaveCount(0);
  await page.reload();
  await expect(header.getByRole("button", { name: "Add Tags" })).toBeVisible();
  await expect(header.getByRole("button", { name: "Remove tag Example tag" })).toHaveCount(0);
});
