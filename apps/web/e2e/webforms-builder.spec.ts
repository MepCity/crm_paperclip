import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("webforms builder: create form → add fields → set required → publish → edit opens new draft → publish again", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // 1. Navigate to Settings -> Webforms
  await page.goto(`/crm/${org.slug}/settings/webforms`);
  await expect(page.getByRole("heading", { name: "Webforms" })).toBeVisible();

  // 2. Open New Form dialog and create a Lead form
  const newFormBtn = page.getByTestId("new-form-button");
  await expect(newFormBtn).toBeVisible();
  await newFormBtn.click();

  const nameInput = page.getByTestId("form-name-input");
  await expect(nameInput).toBeVisible();
  await nameInput.fill("Customer Inquiry Form");

  const moduleSelect = page.getByTestId("form-module-select");
  await moduleSelect.selectOption("Leads");

  const createBtn = page.getByTestId("dialog-create-button");
  await expect(createBtn).toBeEnabled();
  await createBtn.click();

  // 3. Navigates to builder screen
  await page.waitForURL(new RegExp(`/crm/${org.slug}/settings/webforms/`));
  await expect(page.getByRole("heading", { name: "Available Fields" })).toBeVisible();
  await expect(page.getByTestId("form-fields-list")).toBeVisible();

  // Required layout fields (Company, Last_Name) are already present
  await expect(page.getByTestId("form-field-Last_Name")).toBeVisible();
  await expect(page.getByTestId("form-field-Company")).toBeVisible();

  // 4. Add fields from palette: add Email
  const addEmailBtn = page.getByTestId("add-field-Email");
  await expect(addEmailBtn).toBeVisible();
  await addEmailBtn.click();
  await expect(page.getByTestId("form-field-Email")).toBeVisible();

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
  await expect(page.getByText("ACTIVE", { exact: true })).toBeVisible();

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
  await expect(page.getByText("ACTIVE", { exact: true })).toBeVisible();
});
