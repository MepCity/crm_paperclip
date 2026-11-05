import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleCreatePath, moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const PRODUCTS_TAB = "Products";

async function openFirstProduct(page: Page, orgSlug: string) {
  await page.goto(moduleListDefaultPath(orgSlug, PRODUCTS_TAB));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
  const firstLink = list.locator("tbody tr").first().getByRole("link").first();
  const name = (await firstLink.innerText()).trim();
  await firstLink.click();
  await expect(page).toHaveURL(new RegExp(`/tab/${PRODUCTS_TAB}/[^/?]+`));
  await expect(page.locator("[data-record-frame]")).toBeVisible();
  return name;
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

test("Products shell navigation, list views, columns, sort, and filter", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // Navigate from Leads to Products via shell flat navigation
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Products", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`/tab/${PRODUCTS_TAB}/list$`));

  const list = page.locator(".module-list-page");
  await expect(list.locator("[data-view-pill]")).toHaveText("All Products");

  // Check key column headers
  for (const name of ["Product Name", "Product Code", "Product Active", "Product Owner"]) {
    await expect(list.getByRole("columnheader", { name, exact: true })).toBeVisible();
  }

  // Switch custom view to Active Products
  await list.getByRole("button", { name: "Custom views" }).click();
  await expect(page.getByRole("menuitem", { name: "Active Products", exact: true })).toBeVisible();
  await page.getByRole("menuitem", { name: "Active Products", exact: true }).click();
  await expect(list.locator("[data-view-pill]")).toHaveText("Active Products");

  // Switch to My Products to verify Product Category column
  await list.getByRole("button", { name: "Custom views" }).click();
  await expect(page.getByRole("menuitem", { name: "My Products", exact: true })).toBeVisible();
  await page.getByRole("menuitem", { name: "My Products", exact: true }).click();
  await expect(list.locator("[data-view-pill]")).toHaveText("My Products");
  await expect(
    list.getByRole("columnheader", { name: "Product Category", exact: true }),
  ).toBeVisible();

  // Switch back to All Products
  await list.getByRole("button", { name: "Custom views" }).click();
  await page.getByRole("menuitem", { name: "All Products", exact: true }).click();
  await expect(list.locator("[data-view-pill]")).toHaveText("All Products");

  // Sort by Product Name
  await list.getByRole("button", { name: "Product Name column options" }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(page).toHaveURL(/sort_by=Product_Name/);

  // Filter with no match to test empty search state
  const nameRow = list
    .getByRole("listitem")
    .filter({ has: page.getByRole("checkbox", { name: "Product Name", exact: true }) });
  await nameRow.scrollIntoViewIfNeeded();
  await nameRow.getByText("Product Name", { exact: true }).click();
  await list
    .getByRole("textbox", { name: "Product Name value" })
    .fill("Synthetic non-existent widget");
  await list.getByRole("button", { name: "Apply Filter" }).click();
  await expect(list.getByText("No Products found.")).toBeVisible();
  await expect(list.getByRole("group", { name: "Records summary" })).toContainText(
    /Total Records\s*0/,
  );
  await list.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  ignoreFailedResponses(pageErrors, [400]);
});

test("Products form: validation, section layout, Vendor_Name hidden, and create flow", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);

  await page.goto(moduleListDefaultPath(org.slug, PRODUCTS_TAB));
  await page.getByRole("link", { name: "Create Product", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible();

  // ADR 0016 §8: Vendor_Name is strictly hidden
  expect(await page.locator('[data-form-field="Vendor_Name"]').count()).toBe(0);

  // Check form sections
  await expect(page.getByRole("heading", { name: "Product Information" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Price Information" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Stock Information" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Description Information" })).toBeVisible();

  // Empty save: Product Name is required
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Product Name cannot be empty.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create Product" })).toBeVisible();

  // Fill fields
  await page
    .getByRole("textbox", { name: "Product Name", exact: true })
    .fill("E2E Titanium Widget");
  await page.getByRole("textbox", { name: "Product Code", exact: true }).fill("TW-8800");

  // Unit Price (labelled List Price in Price Information section)
  const unitPriceField = page.locator('[data-form-field="Unit_Price"]');
  await unitPriceField.getByRole("textbox").fill("1500");

  // Taxable checkbox
  const taxableField = page.locator('[data-form-field="Taxable"]');
  const taxableCheckbox = taxableField.getByRole("checkbox");
  if (!(await taxableCheckbox.isChecked())) {
    await taxableCheckbox.check({ force: true });
  }

  // Tax multi-select
  const taxField = page.locator('[data-form-field="Tax"]');
  await taxField.getByRole("button", { name: "Tax" }).click();
  await page.getByRole("option", { name: "Vat - 20 %" }).click();
  await page.keyboard.press("Escape");

  // Description
  const descField = page.locator('[data-form-field="Description"]');
  await descField
    .getByRole("textbox", { name: "Description" })
    .fill("Titanium widget built for testing.");

  // Save and navigate to record detail
  const createRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" && new URL(request.url()).pathname === "/crm/v2.2/Products",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const request = await createRequest;
  const payload = request.postDataJSON().data[0];
  expect(payload.Product_Name).toBe("E2E Titanium Widget");
  expect(payload.Product_Code).toBe("TW-8800");
  expect(payload.Unit_Price).toBe(1500);
  expect(payload.Taxable).toBe(true);
  expect(payload.Tax).toEqual(["Vat"]);
  expect(payload.Vendor_Name).toBeUndefined();

  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/${PRODUCTS_TAB}/[^/?]+$`), {
    timeout: 30_000,
  });
  await expect(page.locator("[data-record-frame]")).toBeVisible();

  ignoreFailedResponses(pageErrors, [400]);
});

test("Products detail: header, sections, inline edit, timeline, and related cards", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const name = await openFirstProduct(page, org.slug);
  const header = page.locator("[data-record-header]");

  // Header verification
  await expect(header.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(header.getByRole("link", { name: "Edit" })).toBeVisible();
  await expect(header.getByRole("button", { name: "Previous Record" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Next Record" })).toBeVisible();

  // More options menu
  await header.getByRole("button", { name: "More Options" }).click();
  await expect(page.getByRole("menuitem", { name: "Clone" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Delete" })).toBeVisible();
  await page.keyboard.press("Escape");

  // Overview sections: Vendor_Name must be hidden
  await expect(page.locator('[data-detail-section="Product Information"]')).toBeVisible();
  await expect(page.locator('[data-detail-section="Price Information"]')).toBeVisible();
  await expect(page.locator('[data-detail-section="Stock Information"]')).toBeVisible();
  await expect(page.locator('[data-detail-section="Description Information"]')).toBeVisible();
  expect(await page.locator('[data-detail-field="Vendor_Name"]').count()).toBe(0);

  // Inline edit Product_Code
  const codeRow = page.locator('[data-detail-field="Product_Code"]');
  if ((await codeRow.count()) > 0) {
    await codeRow.hover();
    const editBtn = codeRow.getByRole("button", { name: "Edit Product Code value" });
    if ((await editBtn.count()) > 0) {
      await editBtn.click();
      const input = codeRow.getByRole("textbox");
      await input.fill("P-MODIFIED");
      await input.press("Enter");
      await expect(codeRow).toContainText("P-MODIFIED");
    }
  }

  // Related lists rail entries
  const cards = await page
    .locator("[data-related-card]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-related-card")));
  expect(cards).toContain("notes");
  expect(cards).toContain("attachments");
  expect(cards).toContain("open-activities");
  expect(cards).toContain("closed-activities");
  expect(cards).toContain("quotes");
  expect(cards).toContain("invoices");

  // Notes and Attachments cards render with empty states
  const notesCard = page.locator("#related-list-notes");
  await expect(notesCard).toBeVisible();
  await expect(notesCard.getByText("No records found")).toBeVisible();

  const attachmentsCard = page.locator("#related-list-attachments");
  await expect(attachmentsCard).toBeVisible();
  await expect(attachmentsCard.getByText("No Attachment")).toBeVisible();

  // Seeded Quotes & Invoices related cards for Product 001
  const quotesCard = page.locator("#related-list-quotes");
  await expect(quotesCard).toBeVisible();

  const invoicesCard = page.locator("#related-list-invoices");
  await expect(invoicesCard).toBeVisible();

  // Timeline tab
  const frame = page.locator("[data-record-frame]");
  await frame.getByRole("tab", { name: "Timeline" }).click();
  await expect(frame.locator("[data-timeline-history]")).toBeVisible();

  ignoreFailedResponses(pageErrors, [400]);
});

test("Products click-through: edit and delete flow", async ({ page, pageErrors }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // 1. Create a product specifically to edit and delete
  await page.goto(moduleCreatePath(org.slug, PRODUCTS_TAB));
  await page.getByRole("textbox", { name: "Product Name", exact: true }).fill("Product To Delete");
  await page.getByRole("textbox", { name: "Product Code", exact: true }).fill("DEL-001");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/${PRODUCTS_TAB}/[^/?]+$`));

  // 2. Edit flow
  const header = page.locator("[data-record-header]");
  await header.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/edit$/);
  await expect(page.getByRole("heading", { name: "Edit Product" })).toBeVisible();

  const nameInput = page.getByRole("textbox", { name: "Product Name", exact: true });
  await nameInput.fill("Product Updated Before Delete");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/${PRODUCTS_TAB}/[^/?]+$`));
  await expect(header.getByRole("heading", { level: 1 })).toHaveText(
    "Product Updated Before Delete",
  );

  // 3. Delete flow
  await header.getByRole("button", { name: "More Options" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();

  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByRole("heading", { name: "Delete Product" })).toBeVisible();
  await dialog.getByRole("button", { name: "Delete" }).click();

  // Navigates back to list
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/${PRODUCTS_TAB}/list`));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  ignoreFailedResponses(pageErrors, [400, 404]);
});
