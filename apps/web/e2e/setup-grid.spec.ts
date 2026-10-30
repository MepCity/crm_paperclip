import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Setup grid full-page layout, search, and navigation to 5+ pages with back return", async ({
  page,
  pageErrors,
}) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // Navigate to Setup home
  await page.goto(`/crm/${org.slug}/settings`);
  assertNoPageErrors(pageErrors);

  // 1. Full page layout checks
  // Rail is hidden
  await expect(page.locator("#navigation-rail")).toBeHidden();

  // Topbar banner has Back to CRM link
  const backToCrm = page.getByRole("banner").getByRole("link", { name: "Back to CRM" });
  await expect(backToCrm).toBeVisible();

  // Subheader Setup heading and search box
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { name: "Setup", level: 1 })).toBeVisible();
  const searchInput = main.getByRole("searchbox", { name: "Search Setup" });
  await expect(searchInput).toBeVisible();
  await expect(main.getByRole("button", { name: "Customize Setup" })).toBeVisible();

  // Category cards grid
  const nav = page.getByRole("navigation", { name: "Settings navigation" });
  await expect(nav).toBeVisible();

  for (const cat of [
    "General",
    "Security Control",
    "Channels",
    "Customization",
    "Automation",
    "Process Management",
    "Experience Center",
    "Data Administration",
    "Marketplace",
    "Developer Hub",
  ]) {
    await expect(nav.getByRole("heading", { name: cat })).toBeVisible();
  }

  // 2. Search filtering
  await searchInput.fill("Personal");
  await expect(nav.getByRole("link", { name: "Personal Settings" })).toBeVisible();
  await expect(nav.getByRole("heading", { name: "General" })).toBeVisible();
  await expect(nav.getByRole("heading", { name: "Channels" })).toBeHidden();

  await searchInput.fill("");
  await expect(nav.getByRole("heading", { name: "Channels" })).toBeVisible();

  // Capture screenshot of our Setup page for side-by-side comparison
  await page.screenshot({ path: "/tmp/setup-ours.png" });

  // 3. Navigate to 5+ settings pages from cards and return back via back arrow

  // Destination 1: Personal Settings
  await nav.getByRole("link", { name: "Personal Settings" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/personal-settings`);
  await expect(page.getByRole("heading", { name: "Locale Information" })).toBeVisible();
  await page.getByRole("banner").getByRole("link", { name: "Back to Setup" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings`);

  // Destination 2: Company Details
  await nav.getByRole("link", { name: "Company Details" }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/settings/company-details$`));
  await expect(page.getByRole("heading", { name: "Example Company" })).toBeVisible();
  await page.getByRole("banner").getByRole("link", { name: "Back to Setup" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings`);

  // Destination 3: Currencies
  await nav.getByRole("link", { name: "Currencies" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/currencies`);
  await expect(page.getByRole("heading", { name: "Currencies" })).toBeVisible();
  await page.getByRole("banner").getByRole("link", { name: "Back to Setup" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings`);

  // Destination 4: Email
  await nav.getByRole("link", { name: "Email" }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/settings/email-configuration`));
  await page.getByRole("banner").getByRole("link", { name: "Back to Setup" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings`);

  // Destination 5: Modules and Fields
  await nav.getByRole("link", { name: "Modules and Fields" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/modules`);
  await expect(page.getByRole("columnheader", { name: "Module Name" })).toBeVisible();
  await page.getByRole("banner").getByRole("link", { name: "Back to Setup" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings`);

  // Destination 6: Workflow Rules
  await nav.getByRole("link", { name: "Workflow Rules" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/workflow-rules`);
  await expect(page.getByRole("heading", { name: "Workflow Rules", level: 2 })).toBeVisible();
  await page.getByRole("banner").getByRole("link", { name: "Back to Setup" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings`);

  // Destination 7: Assignment Rules
  await nav.getByRole("link", { name: "Assignment Rules" }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/settings/assignment-rules$`));
  await expect(page.getByRole("heading", { name: "Assignment Rules" })).toBeVisible();
  await page.getByRole("banner").getByRole("link", { name: "Back to Setup" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings`);

  // 4. Return back to CRM
  await backToCrm.click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}`));
  await expect(page.locator("#navigation-rail")).toBeVisible();

  assertNoPageErrors(pageErrors);
});
