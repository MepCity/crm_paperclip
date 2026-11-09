import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("webforms builder: create form → add fields → set required → publish → edit opens new draft → publish again", async ({
  page,
}) => {
  const evidenceDir = process.env.MEP_EVIDENCE_DIR || "/tmp/webforms-mep1499-evidence";
  mkdirSync(evidenceDir, { recursive: true });

  await page.setViewportSize({ width: 1180, height: 703 });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // 1. Navigate to Settings -> Webforms
  await page.goto(`/crm/${org.slug}/settings/webforms`);
  await expect(page.getByTestId("webforms-empty-state")).toBeVisible();
  await page.screenshot({ path: join(evidenceDir, "webforms-empty-list-1180x703.png") });

  // 2. Open New Form dialog and create a Lead form
  const newFormBtn = page.getByTestId("new-form-button");
  await expect(newFormBtn).toBeVisible();
  await newFormBtn.click();

  const nameInput = page.getByTestId("form-name-input");
  await expect(nameInput).toBeVisible();
  await expect(nameInput).toBeFocused();
  await page.screenshot({ path: join(evidenceDir, "webforms-new-dialog-1180x703.png") });
  await nameInput.fill("Customer Inquiry Form");

  // Create button is disabled before selecting a module
  const createBtn = page.getByTestId("dialog-create-button");
  await expect(createBtn).toBeDisabled();

  // Searchable module dropdown
  const moduleSelect = page.getByTestId("form-module-select");
  await expect(moduleSelect).toBeVisible();
  await moduleSelect.click();

  const moduleSearch = page.getByTestId("module-search-input");
  await expect(moduleSearch).toBeVisible();
  await expect(page.getByTestId("module-option-Vendors")).toHaveCount(0); // Vendors excluded

  const leadOption = page.getByTestId("module-option-Leads");
  await expect(leadOption).toBeVisible();
  await leadOption.click();

  await expect(createBtn).toBeEnabled();
  await createBtn.click();

  // 3. Navigates to builder screen
  await page.waitForURL(new RegExp(`/crm/${org.slug}/settings/webforms/`));
  await expect(page.getByRole("heading", { name: "Available Fields" })).toBeVisible();
  await expect(page.getByTestId("form-fields-list")).toBeVisible();

  // Required layout fields (Company, Last_Name) are already present
  const lastNameCard = page.getByTestId("form-field-Last_Name");
  await expect(lastNameCard).toBeVisible();
  // Builder field cards must show the display label, not raw API names (Last Name instead of Last_Name)
  await expect(lastNameCard.locator("span.font-semibold").first()).toHaveText("Last Name");
  await expect(lastNameCard.locator("span.font-semibold").first()).not.toHaveText("Last_Name");

  const companyCard = page.getByTestId("form-field-Company");
  await expect(companyCard).toBeVisible();
  await expect(companyCard.locator("span.font-semibold").first()).toHaveText("Company");

  // Dynamic custom label updates immediately on field card header
  await page.locator("#field-label-Company").fill("Organization");
  await expect(companyCard.locator("span.font-semibold").first()).toHaveText("Organization");
  await page.locator("#field-label-Company").fill("Company");
  await expect(companyCard.locator("span.font-semibold").first()).toHaveText("Company");

  // 4. Add fields from palette: add Email
  const addEmailBtn = page.getByTestId("add-field-Email");
  await expect(addEmailBtn).toBeVisible();
  await addEmailBtn.click();
  await expect(page.getByTestId("form-field-Email")).toBeVisible();
  await page.screenshot({ path: join(evidenceDir, "webforms-builder-1180x703.png") });

  // 5. Set Email as required
  const emailRequiredToggle = page.getByTestId("field-required-toggle-Email");
  await expect(emailRequiredToggle).toBeVisible();
  if (!(await emailRequiredToggle.isChecked())) {
    await emailRequiredToggle.check();
  }
  await expect(emailRequiredToggle).toBeChecked();

  // 6. Publish the form
  const publishBtn = page.getByTestId("publish-form-button");
  await expect(publishBtn).toBeVisible();
  await publishBtn.click();

  // Assert published status: status is ACTIVE, version shows Published v1
  await expect(page.getByText("Published v1")).toBeVisible();
  await expect(page.getByTestId("form-status-badge")).toContainText(/active/i);

  // In published mode, "Edit Form (New Draft)" is visible
  const editFormBtn = page.getByTestId("edit-form-button");
  await expect(editFormBtn).toBeVisible();

  // 7. Click Edit Form -> opens new draft (Draft v2)
  await editFormBtn.click();
  await expect(page.getByText("Draft v2")).toBeVisible();
  await expect(page.getByTestId("publish-form-button")).toBeVisible();

  // 8. Publish again -> publishes v2
  await page.getByTestId("publish-form-button").click();
  await expect(page.getByText("Published v2")).toBeVisible();
  await expect(page.getByTestId("form-status-badge")).toContainText(/active/i);
});
