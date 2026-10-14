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

  // Verify active Accounts and Tasks checkboxes and later-module Products checkbox in filter panel
  const accountsCheckbox = filterPanel.getByRole("checkbox", { name: "Accounts" });
  await expect(accountsCheckbox).toBeVisible();
  await expect(accountsCheckbox).toBeChecked();

  const tasksCheckbox = filterPanel.getByRole("checkbox", { name: "Tasks" });
  await expect(tasksCheckbox).toBeVisible();
  await expect(tasksCheckbox).toBeChecked();
  await expect(tasksCheckbox).not.toHaveAttribute("data-later-module");

  // Test Manage Columns Dialog on Leads card
  const manageColumnsBtn = page.getByRole("button", { name: "Manage Leads columns" });
  await manageColumnsBtn.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Manage Columns Leads")).toBeVisible();

  // Close Manage Columns Dialog
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).not.toBeVisible();

  // Click a record link in Leads card to navigate to detail
  const firstRecordLink = leadsCard.getByRole("link").first();
  await expect(firstRecordLink).toBeVisible();
  await firstRecordLink.click();

  // Verify navigation to record detail page
  await expect(page).toHaveURL(/\/crm\/[^/]+\/tab\/Leads\/[^/?]+/);
});

test("Tasks module filter is enabled and lists a matching task", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const response = await page.request.post("/crm/v2.2/Tasks", {
    headers: { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin },
    data: { data: [{ Subject: "Zephyrquartz advanced" }] },
  });
  expect(response.ok()).toBeTruthy();

  await page.goto(`/crm/${org.slug}/search?q=Zephyrquartz`);
  const tasksCard = page.getByRole("region", { name: "Tasks search results" });
  await expect(tasksCard).toBeVisible();
  await expect(tasksCard.getByRole("link", { name: "Zephyrquartz advanced" })).toBeVisible();

  await page.getByRole("button", { name: "Filter" }).click();
  const filterPanel = page.getByRole("complementary", { name: "Search filter panel" });
  const tasksCheckbox = filterPanel.getByRole("checkbox", { name: "Tasks" });
  await expect(tasksCheckbox).toBeVisible();
  await expect(tasksCheckbox).not.toHaveAttribute("data-later-module", /.+/);
  await expect(tasksCheckbox).toBeChecked();
});

test("Meetings module filter (S-31.6) is enabled and lists a matching meeting", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  // Meetings use the Events API endpoint; Event_Title is the searchable title field.
  const response = await page.request.post("/crm/v2.2/Events", {
    headers: { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin },
    data: {
      data: [
        {
          Event_Title: "Zephrysearch Meeting advanced",
          Start_DateTime: "2026-06-01T10:00:00.000Z",
          End_DateTime: "2026-06-01T11:00:00.000Z",
          All_day: false,
          Meeting_Venue__s: "In-office",
        },
      ],
    },
  });
  expect(response.ok()).toBeTruthy();

  await page.goto(`/crm/${org.slug}/search?q=Zephrysearch`);
  const meetingsCard = page.getByRole("region", { name: "Meetings search results" });
  await expect(meetingsCard).toBeVisible();
  await expect(
    meetingsCard.getByRole("link", { name: "Zephrysearch Meeting advanced" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Filter" }).click();
  const filterPanel = page.getByRole("complementary", { name: "Search filter panel" });
  const meetingsCheckbox = filterPanel.getByRole("checkbox", { name: "Meetings" });
  await expect(meetingsCheckbox).toBeVisible();
  // S-31.6: Meetings is registered — no laterModule badge.
  await expect(meetingsCheckbox).not.toHaveAttribute("data-later-module", /.+/);
  await expect(meetingsCheckbox).toBeChecked();
});

test("Calls module filter (S-31.7) is enabled and lists a matching call", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const response = await page.request.post("/crm/v2.2/Calls", {
    headers: { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin },
    data: {
      data: [
        {
          Subject: "Zephrysearch Call advanced",
          Call_Type: "Outbound",
          Call_Start_Time: "2026-06-01T10:00:00.000Z",
          Call_Duration: "00:30",
        },
      ],
    },
  });
  expect(response.ok()).toBeTruthy();

  await page.goto(`/crm/${org.slug}/search?q=Zephrysearch`);
  const callsCard = page.getByRole("region", { name: "Calls search results" });
  await expect(callsCard).toBeVisible();
  await expect(callsCard.getByRole("link", { name: "Zephrysearch Call advanced" })).toBeVisible();

  await page.getByRole("button", { name: "Filter" }).click();
  const filterPanel = page.getByRole("complementary", { name: "Search filter panel" });
  const callsCheckbox = filterPanel.getByRole("checkbox", { name: "Calls" });
  await expect(callsCheckbox).toBeVisible();
  // S-31.7: Calls is registered — no laterModule badge.
  await expect(callsCheckbox).not.toHaveAttribute("data-later-module", /.+/);
  await expect(callsCheckbox).toBeChecked();
});
