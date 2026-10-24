import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const MODULE = "Contacts";

test.skip(
  process.env.MEP_E2E_DEV_LOGIN !== "1" || process.env.MEP_EPHEMERAL_CUSTOMIZATION !== "1",
  "Needs the development server with ephemeral customization enabled",
);

test.describe("Custom Views Editor", () => {
  test("admin can create, edit, and delete custom view with criteria", async ({ page }) => {
    test.setTimeout(180_000);
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, MODULE));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 60_000 });

    // 1. Open New Custom View modal
    await page.getByRole("button", { name: "Custom views" }).click();
    await expect(page.getByRole("menu", { name: "Custom views" })).toBeVisible();
    await page.getByRole("menuitem", { name: "New Custom View" }).click();

    await expect(page.getByRole("heading", { name: "New Custom View" })).toBeVisible();
    // Admin sees the sharing options
    await expect(page.getByTestId("sharing-section")).toBeVisible();

    // Set view name
    await page.getByPlaceholder("Enter Custom View Name").fill("High Value Contacts");

    // Add a criterion
    await page.getByRole("button", { name: "Add Criterion" }).click();
    await expect(page.getByTestId("criterion-row-0")).toBeVisible();
    const criterionValue = page.getByTestId("criterion-row-0").getByPlaceholder("Type here");
    await criterionValue.fill("Enterprise");

    // Save view
    await page.getByRole("button", { name: "Save" }).click();

    // Verify dialog closes and navigates to the custom view
    await expect(page.getByRole("heading", { name: "New Custom View" })).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`/tab/${MODULE}/custom-view/`));
    await expect(
      page.locator("[data-view-pill]").filter({ hasText: "High Value Contacts" }),
    ).toBeVisible();

    // 2. Edit the custom view
    await page.getByRole("button", { name: "Custom views" }).click();
    await page.getByRole("menuitem", { name: "Edit Current View" }).click();

    await expect(page.getByRole("heading", { name: /Edit Custom View/ })).toBeVisible();
    // Verify criterion value was preserved
    await expect(page.getByTestId("criterion-row-0").getByPlaceholder("Type here")).toHaveValue(
      "Enterprise",
    );

    // Update view name
    await page.getByPlaceholder("Enter Custom View Name").fill("VIP Contacts");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("heading", { name: /Edit Custom View/ })).toHaveCount(0);
    await expect(
      page.locator("[data-view-pill]").filter({ hasText: "VIP Contacts" }),
    ).toBeVisible();

    // 3. Delete the custom view
    await page.getByRole("button", { name: "Custom views" }).click();
    await page.getByRole("menuitem", { name: "Edit Current View" }).click();

    await expect(page.getByRole("heading", { name: /Edit Custom View/ })).toBeVisible();
    await page.getByRole("button", { name: "Delete View" }).click();

    await expect(page.getByRole("heading", { name: /Edit Custom View/ })).toHaveCount(0);
    await expect(page).toHaveURL(moduleListDefaultPath(org.slug, MODULE));
    await expect(page.locator("[data-view-pill]").filter({ hasText: "VIP Contacts" })).toHaveCount(
      0,
    );
  });

  test("member view does not display sharing options in editor and views remain accessible", async ({
    page,
    browser,
  }) => {
    test.setTimeout(180_000);
    await signUpNewUser(page, { name: "Owner Admin" });
    const org = await createOrganization(page);

    // Invite member
    await page.getByRole("link", { name: "Settings", exact: true }).click();
    await page.getByRole("link", { name: "Members" }).click();
    await page.getByRole("button", { name: "Invite member" }).click();
    const dialog = page.getByRole("dialog", { name: "Invite member" });
    const memberEmail = `member-${crypto.randomUUID()}@example.test`;
    await dialog.getByRole("textbox", { name: "Email" }).fill(memberEmail);
    await dialog.getByRole("button", { name: "Create invitation" }).click();
    const inviteUrl = (await dialog.getByText(/\/invite\//).innerText()).trim();
    await dialog.getByRole("button", { name: "Close" }).click();

    // Member signs up and joins
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    try {
      await memberPage.goto(inviteUrl);
      await memberPage.getByRole("link", { name: "Sign up" }).click();
      await memberPage.getByRole("textbox", { name: "Name" }).fill("Regular Member");
      await memberPage.getByRole("textbox", { name: "Email" }).fill(memberEmail);
      await memberPage.getByLabel("Password").fill("long-password-1");
      await memberPage.getByRole("button", { name: "Sign up" }).click();
      await memberPage.getByRole("button", { name: `Join ${org.name}` }).click();
      await expect(memberPage).toHaveURL(`/crm/${org.slug}`);

      // Member visits Contacts list
      await memberPage.goto(moduleListDefaultPath(org.slug, MODULE));
      await expect(memberPage.getByRole("table", { name: "Records" })).toBeVisible({
        timeout: 60_000,
      });

      // Member opens New Custom View dialog
      await memberPage.getByRole("button", { name: "Custom views" }).click();
      await memberPage.getByRole("menuitem", { name: "New Custom View" }).click();
      await expect(memberPage.getByRole("heading", { name: "New Custom View" })).toBeVisible();

      // Sharing section must NOT be visible for member (Kurul 1 / Board decision 1)
      await expect(memberPage.getByTestId("sharing-section")).toHaveCount(0);

      // Close modal
      await memberPage.getByRole("button", { name: "Cancel" }).click();
      await expect(memberPage.getByRole("heading", { name: "New Custom View" })).toHaveCount(0);
    } finally {
      await memberContext.close();
    }
  });
});
