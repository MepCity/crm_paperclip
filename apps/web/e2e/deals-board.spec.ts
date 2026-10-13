import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

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

  // All 9 columns present in metadata order
  const expectedStages = [
    { key: "Qualification", label: "Qualification", probability: "10%" },
    { key: "Needs Analysis", label: "Needs Analysis", probability: "20%" },
    { key: "Value Proposition", label: "Value Proposition", probability: "40%" },
    { key: "Id. Decision Makers", label: "Identify Decision Makers", probability: "60%" },
    { key: "Proposal/Price Quote", label: "Proposal/Price Quote", probability: "75%" },
    { key: "Negotiation/Review", label: "Negotiation/Review", probability: "90%" },
    { key: "Closed Won", label: "Closed Won", probability: "100%" },
    { key: "Closed Lost", label: "Closed Lost", probability: "0%" },
    { key: "Closed Lost to Competition", label: "Closed Lost to Competition", probability: "0%" },
  ];

  const columns = board.locator("[data-board-column]");
  await expect(columns).toHaveCount(9);

  let totalCount = 0;
  for (const [i, expected] of expectedStages.entries()) {
    const column = columns.nth(i);
    await expect(column).toHaveAttribute("data-board-column", expected.key);
    await expect(column.locator("header")).toContainText(expected.label);
    await expect(column.locator("header")).toContainText(expected.probability);

    // Sum formatted with currency
    await expect(column.locator("header")).toContainText(/TRY/);

    // Read column count
    const countText = await column.locator(".record-board-count").innerText();
    const count = Number.parseInt(countText.replace(/\D/g, ""), 10);
    totalCount += count;
  }

  // Seed data contains 250 deals
  expect(totalCount).toBe(250);

  // Check card rows format on Qualification column (or first column with cards)
  const qualCol = board.locator('[data-board-column="Qualification"]');
  const cards = qualCol.locator("[data-board-card]");
  await expect(cards.first()).toBeVisible();

  const firstCard = cards.first();
  // Deal Name link
  const dealLink = firstCard.locator("a").first();
  await expect(dealLink).toBeVisible();
  await expect(dealLink).toHaveAttribute("href", /\/tab\/Deals\/[^/?]+$/);

  // Second line has Stage text
  await expect(firstCard).toContainText("Qualification");
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

  const card = qualCol.locator("[data-board-card]").first();
  const cardId = await card.getAttribute("data-board-card");
  expect(cardId).toBeTruthy();

  // Drag card from Qualification to Needs Analysis
  await card.dragTo(needsCol);

  // Card moved to Needs Analysis
  const movedCard = needsCol.locator(`[data-board-card="${cardId}"]`);
  await expect(movedCard).toBeVisible();
  await expect(movedCard).toContainText("Needs Analysis");

  // Reload page to verify persistence
  await page.reload();
  await expect(board).toBeVisible();
  const reloadedCard = needsCol.locator(`[data-board-card="${cardId}"]`);
  await expect(reloadedCard).toBeVisible();
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
