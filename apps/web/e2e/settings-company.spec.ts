import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Company Details opens from settings with read-only controls and menu destinations", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/settings`);
  const main = page.locator("#main-content");
  const settingsNav = page.getByRole("navigation", { name: "Settings navigation" });
  await expect(
    settingsNav.getByRole("link", { name: "Personal Settings", exact: true }),
  ).toHaveAttribute("href", `/crm/${org.slug}/settings/personal-settings`);
  await expect(settingsNav.getByRole("link", { name: "Currencies", exact: true })).toHaveAttribute(
    "href",
    `/crm/${org.slug}/settings/currencies`,
  );
  await settingsNav.getByRole("link", { name: "Company Details", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/settings/company-details$`));
  await expect(main.getByRole("heading", { name: "Example Company" })).toBeVisible();
  await expect(main.getByText("Time Zone", { exact: true })).toBeVisible();
  await expect(main.getByText(/Coordinated Universal Time/)).toBeVisible();
  await expect(main.getByRole("heading", { name: "Team Licenses" })).toBeVisible();
  for (const name of [
    "Edit organization details",
    "Edit access URL",
    "Edit time zone",
    "Get Team User License",
  ]) {
    await expect(main.getByRole("button", { name })).toBeDisabled();
  }
  await expect(main.getByRole("textbox")).toHaveCount(0);
  await expect(
    main
      .getByRole("navigation", { name: "Company settings" })
      .getByRole("link", { name: "Currencies" }),
  ).toHaveAttribute("href", `/crm/${org.slug}/settings/currencies`);
  await page.reload();
  await expect(main.getByRole("heading", { name: "Example Company" })).toBeVisible();
});
