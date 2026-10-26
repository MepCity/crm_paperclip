import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Email settings routes, tabs and accepted gaps stay read only", async ({ page }, testInfo) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const base = `/crm/${org.slug}/settings`;
  await page.goto(base);
  await page.getByRole("link", { name: "Email", exact: true }).last().click();
  await expect(page).toHaveURL(`${base}/email-configuration/email-compose-settings`);
  await expect(page.getByRole("heading", { name: "Compose Settings" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Default From Address/ })).toBeDisabled();
  await page.getByRole("button", { name: "Add New Signature" }).click();
  await page.getByRole("textbox", { name: "Signature name" }).fill("Team signature");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "New email signature" }).getByRole("alert"),
  ).toHaveText("En az bir Gönderen adresini ilişkilendirin.");
  await page.screenshot({ path: testInfo.outputPath("signature-validation.png"), fullPage: true });
  await page.getByRole("alert").getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "New email signature" }).getByRole("alert"),
  ).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Signature name" })).toHaveValue("Team signature");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();

  const mutations: string[] = [];
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method()))
      mutations.push(`${request.method()} ${new URL(request.url()).pathname}`);
  });
  await page.getByRole("tab", { name: "Email Sharing", exact: true }).click();
  await expect(page).toHaveURL(`${base}/email-configuration/email-sharing`);
  await expect(page.getByRole("heading", { name: "Email Sharing Permissions" })).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(4);
  await page.getByRole("searchbox", { name: "Search User, Profile" }).fill("no-match");
  await expect(page.getByText("No users found.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mass Update" })).toBeDisabled();

  await page.getByRole("tab", { name: "Organization Emails", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Organization Email Addresses" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add Email Address" })).toBeDisabled();
  await expect(page).toHaveURL(`${base}/email-configuration/organization-emails`);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Organization Email Addresses" })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Email Sharing Permissions" })).toBeVisible();

  await page.getByRole("tab", { name: "Custom Email Fields", exact: true }).click();
  const preference = page.getByRole("switch", { name: "Custom email preferences" });
  await expect(preference).not.toBeChecked();
  await expect(preference).toBeDisabled();
  await page.getByRole("tab", { name: "Email Parser", exact: true }).click();
  await expect(page.getByText(/Email Parser data is unavailable/)).toBeVisible();
  await page.getByRole("tab", { name: "BCC Dropbox", exact: true }).click();
  await expect(page).toHaveURL(`${base}/bcc-dropbox`);
  await expect(page.getByText(/No address has been generated/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "BCC Dropbox" })).toBeVisible();
  expect(mutations).toEqual([]);
});
