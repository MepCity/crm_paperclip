import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

test.skip(
  process.env.MEP_E2E_DEV_LOGIN !== "1" || process.env.MEP_EPHEMERAL_CUSTOMIZATION !== "1",
  "Needs the development server with ephemeral customization enabled",
);

test("admin creates, hides, retires and restores a custom field; stale editor keeps values", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/settings/modules/Leads/fields`);
  const options = await page
    .getByRole("button", { name: "Create and Edit Fields" })
    .click()
    .then(() => page.getByRole("option").allTextContents());
  expect(options).not.toContain("Pick List");
  await page.getByLabel("Field label").fill("Fax Note");
  await page.getByRole("button", { name: "Save" }).click();
  const row = page.getByRole("row", { name: /Fax Note/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Custom");

  await page.getByRole("button", { name: "Hide Fax Note" }).click();
  await expect(page.getByRole("button", { name: "Show Fax Note" })).toBeVisible();
  await page.getByRole("button", { name: "Show Fax Note" }).click();
  await expect(page.getByRole("button", { name: "Hide Fax Note" })).toBeVisible();

  // Stale editor: open it, change the schema elsewhere, then save.
  await page.getByRole("button", { name: "Edit Fax Note" }).click();
  await page.getByLabel("Field label").fill("Fax Note 2");
  const origin = new URL(page.url()).origin;
  const read = await page.request.get("/crm/v2.2/settings/fields?module=Leads", {
    headers: { "X-CRM-ORG": org.slug },
  });
  const { revision } = await read.json();
  const bump = await page.request.patch("/crm/v2.2/settings/modules/Leads", {
    headers: { "X-CRM-ORG": org.slug, Origin: origin },
    data: {
      expectedRevision: revision,
      command: { type: "module.patch", properties: { pluralLabel: "Prospects" } },
    },
  });
  expect(bump.ok()).toBe(true);
  await page.getByRole("button", { name: "Save" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("alert")).toContainText("Refresh");
  await expect(page.getByLabel("Field label")).toHaveValue("Fax Note 2");
  await page.getByRole("button", { name: "Refresh" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("row", { name: /Fax Note 2/ })).toBeVisible();

  await page.getByRole("button", { name: "Retire Fax Note 2" }).click();
  await expect(page.getByRole("button", { name: "Restore Fax Note 2" })).toBeVisible();
  await page.getByRole("button", { name: "Restore Fax Note 2" }).click();
  await expect(page.getByRole("button", { name: "Retire Fax Note 2" })).toBeVisible();
  ignoreFailedResponses(pageErrors, [409]);
});
