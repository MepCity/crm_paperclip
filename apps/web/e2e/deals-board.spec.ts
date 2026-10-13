import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

test("Deals opens in board presentation by default with toolbar and view switcher", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Deals", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tab\/Deals\/list$/);

  const list = page.locator(".module-list-page");

  // DP-06: Board presentation active by default
  const switcher = list.locator("[data-view-type-switcher]");
  await expect(switcher).toBeVisible();
  await expect(switcher.getByRole("button", { name: "Board presentation" })).toHaveAttribute(
    "data-active",
    "true",
  );
  await expect(switcher.getByRole("button", { name: "List presentation" })).not.toHaveAttribute(
    "data-active",
    "true",
  );

  // Board container rendered
  const board = list.locator("[data-record-board]");
  await expect(board).toBeVisible();

  // DP-70, DP-71: Board toolbar controls
  const stageviewSelect = list.getByRole("combobox", { name: "Board grouping" });
  await expect(stageviewSelect).toBeVisible();
  await expect(stageviewSelect).toHaveValue("STAGEVIEW");
  await expect(list.getByRole("button", { name: "Board settings" })).toBeVisible();

  // Pagination and row selection bar are omitted in board presentation
  await expect(list.getByRole("link", { name: "Next" })).toHaveCount(0);
  await expect(list.locator("[data-selection-bar]")).toHaveCount(0);
});

test("Deals board renders all 9 stages in metadata order with counts, percentages, sums, and card rows", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Deals"));

  const board = page.locator("[data-record-board]");
  await expect(board).toBeVisible();

  // All 9 columns present in metadata order with expected seed counts, probability %, and sum
  const expectedStages = [
    {
      key: "Qualification",
      label: "Qualification",
      probability: "10%",
      count: 28,
      totalText: "TRY\u00A0533,400.00",
    },
    {
      key: "Needs Analysis",
      label: "Needs Analysis",
      probability: "20%",
      count: 28,
      totalText: "TRY\u00A0536,200.00",
    },
    {
      key: "Value Proposition",
      label: "Value Proposition",
      probability: "40%",
      count: 28,
      totalText: "TRY\u00A0539,000.00",
    },
    {
      key: "Id. Decision Makers",
      label: "Identify Decision Makers",
      probability: "60%",
      count: 28,
      totalText: "TRY\u00A0541,800.00",
    },
    {
      key: "Proposal/Price Quote",
      label: "Proposal/Price Quote",
      probability: "75%",
      count: 28,
      totalText: "TRY\u00A0544,600.00",
    },
    {
      key: "Negotiation/Review",
      label: "Negotiation/Review",
      probability: "90%",
      count: 28,
      totalText: "TRY\u00A0547,400.00",
    },
    {
      key: "Closed Won",
      label: "Closed Won",
      probability: "100%",
      count: 28,
      totalText: "TRY\u00A0550,200.00",
    },
    {
      key: "Closed Lost",
      label: "Closed Lost",
      probability: "0%",
      count: 27,
      totalText: "TRY\u00A0521,100.00",
    },
    {
      key: "Closed Lost to Competition",
      label: "Closed Lost to Competition",
      probability: "0%",
      count: 27,
      totalText: "TRY\u00A0523,800.00",
    },
  ];

  const columns = board.locator("[data-board-column]");
  await expect(columns).toHaveCount(9);

  let totalCount = 0;
  for (const [i, expected] of expectedStages.entries()) {
    const column = columns.nth(i);
    await column.scrollIntoViewIfNeeded();
    await expect(column).toHaveAttribute("data-board-column", expected.key);
    await expect(column.locator("header")).toContainText(expected.label);
    await expect(column.locator("header")).toContainText(expected.probability);

    // Sum formatted with currency
    await expect(column.locator(".record-board-total")).toHaveText(expected.totalText);

    // Read column count
    await expect(column.locator(".record-board-count")).toHaveText(String(expected.count));
    totalCount += expected.count;
  }

  // Seed data contains 250 deals
  expect(totalCount).toBe(250);

  // Check card rows format on Qualification column (first column with cards)
  const qualCol = board.locator('[data-board-column="Qualification"]');
  await qualCol.scrollIntoViewIfNeeded();
  const cards = qualCol.locator("[data-board-card]");
  await expect(cards.first()).toBeVisible();

  const firstCard = cards.first();
  const rows = firstCard.locator(":scope > div");
  await expect(rows).toHaveCount(7);

  // 1. Deal Name link
  const dealLink = rows.nth(0).locator("a");
  await expect(dealLink).toBeVisible();
  await expect(dealLink).toHaveAttribute("href", /\/tab\/Deals\/[^/?]+$/);

  // 2. Stage text
  await expect(rows.nth(1)).toHaveText("Qualification");

  // 3. Account Name link
  const accountLink = rows.nth(2).locator("a");
  await expect(accountLink).toBeVisible();
  await expect(accountLink).toHaveAttribute("href", /\/tab\/Accounts\/[^/?]+$/);

  // 4. Deal Owner text
  await expect(rows.nth(3)).not.toBeEmpty();

  // 5. Contact Name link
  const contactLink = rows.nth(4).locator("a");
  await expect(contactLink).toBeVisible();
  await expect(contactLink).toHaveAttribute("href", /\/tab\/Contacts\/[^/?]+$/);

  // 6. Amount (currency formatted)
  await expect(rows.nth(5)).toContainText("TRY");

  // 7. Closing Date (dd.MM.yyyy)
  await expect(rows.nth(6)).toHaveText(/^\d{2}\.\d{2}\.\d{4}$/);

  // Exactly 3 links on the card
  await expect(firstCard.locator("a")).toHaveCount(3);
});

test("Create Deal from column footer opens create form with pre-selected stage", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Deals"));

  const board = page.locator("[data-record-board]");
  await expect(board).toBeVisible();

  // Column Needs Analysis footer Create Deal button
  const col = board.locator('[data-board-column="Needs Analysis"]');
  const createBtn = col.locator("[data-board-footer-create]");
  await createBtn.scrollIntoViewIfNeeded();
  await createBtn.click();

  // Navigates to create deal form
  await expect(page).toHaveURL(/\/tab\/Deals\/create/);
  await expect(page.getByRole("heading", { name: "Create Deal", exact: true })).toBeVisible();

  // Stage field is pre-selected with Needs Analysis
  const stageButton = page.getByRole("button", { name: "Stage" });
  await expect(stageButton).toHaveText(/Needs Analysis/);
});

test("Drag-and-drop card to open stage updates stage and persists on reload", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Deals"));

  const board = page.locator("[data-record-board]");
  await expect(board).toBeVisible();

  const qualCol = board.locator('[data-board-column="Qualification"]');
  const needsCol = board.locator('[data-board-column="Needs Analysis"]');

  // Initial column summaries
  await expect(qualCol.locator(".record-board-count")).toHaveText("28");
  await expect(qualCol.locator(".record-board-total")).toHaveText("TRY\u00A0533,400.00");
  await expect(needsCol.locator(".record-board-count")).toHaveText("28");
  await expect(needsCol.locator(".record-board-total")).toHaveText("TRY\u00A0536,200.00");

  const card = qualCol.locator("[data-board-card]").first();
  const cardId = await card.getAttribute("data-board-card");
  expect(cardId).toBeTruthy();

  // Drag card from Qualification to Needs Analysis
  await card.dragTo(needsCol);

  // Card moved to Needs Analysis
  const movedCard = needsCol.locator(`[data-board-card="${cardId}"]`);
  await expect(movedCard).toBeVisible();
  await expect(movedCard.locator(":scope > div").nth(1)).toHaveText("Needs Analysis");

  // Summary counts and sums updated without reload
  await expect(qualCol.locator(".record-board-count")).toHaveText("27");
  await expect(qualCol.locator(".record-board-total")).toHaveText("TRY\u00A0502,200.00");
  await expect(needsCol.locator(".record-board-count")).toHaveText("29");
  await expect(needsCol.locator(".record-board-total")).toHaveText("TRY\u00A0567,400.00");

  // Reload page to verify persistence
  await page.reload();
  await expect(board).toBeVisible();
  const reloadedCard = needsCol.locator(`[data-board-card="${cardId}"]`);
  await expect(reloadedCard).toBeVisible();
  await expect(qualCol.locator(".record-board-count")).toHaveText("27");
  await expect(qualCol.locator(".record-board-total")).toHaveText("TRY\u00A0502,200.00");
  await expect(needsCol.locator(".record-board-count")).toHaveText("29");
  await expect(needsCol.locator(".record-board-total")).toHaveText("TRY\u00A0567,400.00");
});

test("Drag-and-drop card to Closed Won opens Verify Details dialog and updates on save", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Deals"));

  const board = page.locator("[data-record-board]");
  await expect(board).toBeVisible();

  const negCol = board.locator('[data-board-column="Negotiation/Review"]');
  const wonCol = board.locator('[data-board-column="Closed Won"]');
  await wonCol.scrollIntoViewIfNeeded();

  await expect(negCol.locator(".record-board-count")).toHaveText("28");
  await expect(negCol.locator(".record-board-total")).toHaveText("TRY\u00A0547,400.00");
  await expect(wonCol.locator(".record-board-count")).toHaveText("28");
  await expect(wonCol.locator(".record-board-total")).toHaveText("TRY\u00A0550,200.00");

  const card = negCol.locator("[data-board-card]").first();
  const cardId = await card.getAttribute("data-board-card");
  expect(cardId).toBeTruthy();

  // Drag from Negotiation/Review to Closed Won
  await card.dragTo(wonCol);

  // Verify Details dialog appears
  const dialog = page.getByRole("dialog", { name: "Verify Details" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Closed Won")).toBeVisible();

  // Save the dialog
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();

  // Card is now in Closed Won column
  const movedCard = wonCol.locator(`[data-board-card="${cardId}"]`);
  await expect(movedCard).toBeVisible();

  // Negotiation/Review decreased by 1, Closed Won increased by 1 without reload
  await expect(negCol.locator(".record-board-count")).toHaveText("27");
  await expect(negCol.locator(".record-board-total")).toHaveText("TRY\u00A0515,700.00");
  await expect(wonCol.locator(".record-board-count")).toHaveText("29");
  await expect(wonCol.locator(".record-board-total")).toHaveText("TRY\u00A0581,900.00");
});

test("Drag-and-drop card to Closed Won and redirecting Stage in Verify Details moves card to selected stage without reload", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Deals"));

  const board = page.locator("[data-record-board]");
  await expect(board).toBeVisible();

  const negCol = board.locator('[data-board-column="Negotiation/Review"]');
  const wonCol = board.locator('[data-board-column="Closed Won"]');
  const lostCol = board.locator('[data-board-column="Closed Lost"]');
  await wonCol.scrollIntoViewIfNeeded();

  const card = negCol.locator("[data-board-card]").first();
  const cardId = await card.getAttribute("data-board-card");
  expect(cardId).toBeTruthy();

  // Drag from Negotiation/Review to Closed Won
  await card.dragTo(wonCol);

  // Verify Details dialog appears
  const dialog = page.getByRole("dialog", { name: "Verify Details" });
  await expect(dialog).toBeVisible();

  // Change Stage in dialog from Closed Won to Closed Lost
  const stageButton = dialog.getByRole("button", { name: "Stage" });
  await stageButton.click();
  await page.getByRole("option", { name: "Closed Lost", exact: true }).click();

  // Save the dialog
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();

  // Without reload: card MUST move to Closed Lost column, NOT Closed Won
  await lostCol.scrollIntoViewIfNeeded();
  const movedCard = lostCol.locator(`[data-board-card="${cardId}"]`);
  await expect(movedCard).toBeVisible();
  await expect(movedCard.locator(":scope > div").nth(1)).toHaveText("Closed Lost");
  await expect(wonCol.locator(`[data-board-card="${cardId}"]`)).toBeHidden();

  // Header summaries without reload: Closed Won stays 28, Neg becomes 27, Closed Lost becomes 28
  await expect(wonCol.locator(".record-board-count")).toHaveText("28");
  await expect(negCol.locator(".record-board-count")).toHaveText("27");
  await expect(lostCol.locator(".record-board-count")).toHaveText("28");

  // Persists on reload
  await page.reload();
  await expect(board).toBeVisible();
  await lostCol.scrollIntoViewIfNeeded();
  await expect(lostCol.locator(`[data-board-card="${cardId}"]`)).toBeVisible();
});

test("Save error in Verify Details dialog rolls card back to source column and displays danger toast", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Deals"));

  const board = page.locator("[data-record-board]");
  await expect(board).toBeVisible();

  const negCol = board.locator('[data-board-column="Negotiation/Review"]');
  const wonCol = board.locator('[data-board-column="Closed Won"]');
  await wonCol.scrollIntoViewIfNeeded();

  const card = negCol.locator("[data-board-card]").first();
  const cardId = await card.getAttribute("data-board-card");
  expect(cardId).toBeTruthy();

  // Route interception for record PUT to return 500 error
  await page.route("**/crm/v2.2/Deals/*", async (route) => {
    if (route.request().method() === "PUT") {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Internal server error" }),
      });
      return;
    }
    await route.continue();
  });

  // Drag from Negotiation/Review to Closed Won
  await card.dragTo(wonCol);

  // Verify Details dialog appears
  const dialog = page.getByRole("dialog", { name: "Verify Details" });
  await expect(dialog).toBeVisible();

  // Click Save
  await dialog.getByRole("button", { name: "Save" }).click();

  // Danger toast appears
  await expect(page.getByText("Update failed")).toBeVisible();

  // Dialog closes / dismisses
  await expect(dialog).toBeHidden();

  // Card rolled back to Negotiation/Review column
  await negCol.scrollIntoViewIfNeeded();
  const rolledBackCard = negCol.locator(`[data-board-card="${cardId}"]`);
  await expect(rolledBackCard).toBeVisible();
  await expect(wonCol.locator(`[data-board-card="${cardId}"]`)).toBeHidden();

  // Column counts stay untouched
  await expect(negCol.locator(".record-board-count")).toHaveText("28");
  await expect(wonCol.locator(".record-board-count")).toHaveText("28");
  ignoreFailedResponses(pageErrors, [500]);
});

test("Drag-and-drop card to Closed Lost opens Verify Details dialog and rolls back on Cancel", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Deals"));

  const board = page.locator("[data-record-board]");
  await expect(board).toBeVisible();

  const wonCol = board.locator('[data-board-column="Closed Won"]');
  const lostCol = board.locator('[data-board-column="Closed Lost"]');
  await lostCol.scrollIntoViewIfNeeded();

  const card = wonCol.locator("[data-board-card]").first();
  const cardId = await card.getAttribute("data-board-card");
  expect(cardId).toBeTruthy();

  // Drag from Closed Won to Closed Lost
  await card.dragTo(lostCol);

  // Verify Details dialog appears with Reason for Loss
  const dialog = page.getByRole("dialog", { name: "Verify Details" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Reason for Loss")).toBeVisible();

  // Cancel the dialog
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();

  // Card remains in Closed Won column
  const rolledBackCard = wonCol.locator(`[data-board-card="${cardId}"]`);
  await expect(rolledBackCard).toBeVisible();
});

test("View switcher transitions between Board and List presentation", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Deals"));

  const list = page.locator(".module-list-page");
  const switcher = list.locator("[data-view-type-switcher]");

  // Switch to List presentation (table)
  await switcher.getByRole("button", { name: "List presentation" }).click();
  await expect(page).toHaveURL(/presentation=table/);
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  await expect(list.locator("[data-record-board]")).toHaveCount(0);

  // Switch back to Board presentation
  await switcher.getByRole("button", { name: "Board presentation" }).click();
  await expect(page).toHaveURL(/presentation=board/);
  await expect(list.locator("[data-record-board]")).toBeVisible();
  await expect(list.getByRole("table", { name: "Records" })).toHaveCount(0);
});

test("Filters refresh board cards", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Deals"));

  const list = page.locator(".module-list-page");
  const board = list.locator("[data-record-board]");
  await expect(board).toBeVisible();

  // Filter By Fields -> Amount
  const fieldFilters = list.getByRole("group", { name: "Filter By Fields" });
  const amountCheckbox = fieldFilters.getByRole("checkbox", { name: "Amount", exact: true });
  await amountCheckbox.scrollIntoViewIfNeeded();
  await amountCheckbox.check({ force: true });

  const amountValue = fieldFilters.getByRole("textbox", { name: "Amount value" });
  await amountValue.click();
  await amountValue.fill("1");
  await amountValue.press("Tab");

  const applyBtn = list.getByRole("button", { name: "Apply Filter" });
  await expect(applyBtn).toBeEnabled();
  await applyBtn.click();

  // When filtered to amount=1, no deals match, all columns show 0 cards
  await expect(board.locator("[data-board-card]")).toHaveCount(0);

  // Clear filter restores cards
  await list.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(board.locator("[data-board-card]").first()).toBeVisible();
});
