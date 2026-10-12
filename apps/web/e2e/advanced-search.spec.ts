import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Advanced Search Results page renders cards, filters, columns dialog and navigates to record", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // Navigate to Advanced Search page with query "Sample"
  await page.goto(`/crm/${org.slug}/search?q=Sample`);

  // Verify header and query field
  await expect(page.getByRole("heading", { name: "Search", level: 1 })).toBeVisible();
  const searchInput = page.getByRole("textbox", { name: "Search records" });
  await expect(searchInput).toHaveValue("Sample");

  // Verify Leads, Contacts, and Notes cards
  const leadsCard = page.getByRole("region", { name: "Leads search results" });
  const contactsCard = page.getByRole("region", { name: "Contacts search results" });
  const notesCard = page.getByRole("region", { name: "Notes search results" });

  await expect(leadsCard).toBeVisible();
  await expect(contactsCard).toBeVisible();
  await expect(notesCard).toBeVisible();

  // Verify module count badges
  await expect(page.getByTestId("module-count-Leads")).toBeVisible();
  await expect(page.getByTestId("module-count-Contacts")).toBeVisible();
  await expect(page.getByTestId("module-count-Notes")).toHaveText("0");

  // Verify S-46 Cross-application search link carries laterModule P3
  const crossApp = page.getByRole("link", { name: "Search across applications" });
  await expect(crossApp).toBeVisible();
  await expect(crossApp).toHaveAttribute("data-later-module", "P3");

  // Open filter panel via S-21 funnel icon
  const filterBtn = page.getByRole("button", { name: "Filter" });
  await filterBtn.click();
  const filterPanel = page.getByRole("complementary", { name: "Search filter panel" });
  await expect(filterPanel).toBeVisible();

  // Verify later-module checkboxes in filter panel
  const accountsCheckbox = filterPanel.getByRole("checkbox", { name: "Accounts" });
  await expect(accountsCheckbox).toBeVisible();
  await expect(accountsCheckbox).toHaveAttribute("data-later-module", "M3");

  // Test Manage Columns Dialog on Leads card
  const manageColumnsBtn = page.getByRole("button", { name: "Manage Leads columns" });
  await manageColumnsBtn.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Manage Columns Leads")).toBeVisible();

  // Close Manage Columns Dialog
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).not.toBeVisible();

  // Click a record link in Contacts or Leads card to navigate to detail
  const firstRecordLink = leadsCard.getByRole("link").first();
  await expect(firstRecordLink).toBeVisible();
  await firstRecordLink.click();

  // Verify navigation to record detail page
  await expect(page).toHaveURL(/\/crm\/[^/]+\/tab\/Leads\/[^/?]+/);
});
