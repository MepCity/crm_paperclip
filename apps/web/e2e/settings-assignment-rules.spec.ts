import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Assignment Rules opens from settings with the introductory state (A0, AL4)", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // Monitor all requests after setup to ensure zero non-GET requests occur
  const nonGetRequests: string[] = [];
  page.on("request", (req) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method())) {
      nonGetRequests.push(`${req.method()} ${req.url()}`);
    }
  });

  await page.goto(`/crm/${org.slug}/settings`);
  const nav = page.getByRole("navigation", { name: "Settings navigation" });
  await nav.getByRole("link", { name: "Assignment Rules" }).click();
  await expect(nav.getByRole("link", { name: "Assignment Rules" })).toHaveAttribute(
    "aria-current",
    "page",
  );

  // AL1 / A0: Heading and selected Rules tab
  await expect(page.getByRole("heading", { name: "Assignment Rules" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Rules", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  // AL4: Introductory explanation in unpopulated state
  const intro = page.getByTestId("assignment-introduction");
  await expect(intro).toBeVisible();
  await expect(intro).toContainText(
    "Assignment Rules helps you automatically assign records to users based on specified criteria.",
  );
  await expectNoA11yViolations(page, { include: ['section[aria-label="Assignment Rules"]'] });

  // Inert tabs (Thresholds, Assistant) remain focusable and do not navigate away
  for (const name of ["Thresholds", "Assistant"]) {
    const tab = page.getByRole("tab", { name });
    await tab.focus();
    await expect(tab).toBeFocused();
    await tab.press("Enter");
  }

  // Help buttons
  await expect(page.getByRole("button", { name: "Assignment Rules help" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Contextual help" })).toBeVisible();

  // RC1: Create button is disabled and inert in unpopulated state
  const create = page.getByRole("button", { name: "Create Assignment Rule" });
  await expect(create).toHaveAttribute("aria-disabled", "true");
  await create.click({ force: true });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/settings/assignment-rules$`));

  // Zero non-GET requests and no page errors
  expect(nonGetRequests).toEqual([]);
  assertNoPageErrors(pageErrors);
});

test("populated Assignment rules list AL1–AL5 and detail AD1–AD7 read-only inventory", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page, "Synthetic Populated Org");

  // Monitor all requests after setup to ensure zero non-GET requests occur
  const nonGetRequests: string[] = [];
  page.on("request", (req) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method())) {
      nonGetRequests.push(`${req.method()} ${req.url()}`);
    }
  });

  await page.goto(`/crm/${org.slug}/settings/assignment-rules`);

  // --- AL1: Heading, selected Rules tab, and populated rows replace introduction ---
  await expect(page.getByRole("heading", { name: "Assignment Rules", level: 2 })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Rules", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByTestId("assignment-introduction")).toHaveCount(0);

  const table = page.getByRole("table");
  await expect(table).toBeVisible();

  // --- AL2: Columns in exact order: Order, Name, Module, Status ---
  const columnHeaders = table.getByRole("columnheader");
  await expect(columnHeaders).toHaveCount(4);
  const headerTexts = await columnHeaders.allTextContents();
  expect(headerTexts.map((t) => t.trim())).toEqual(["Order", "Name", "Module", "Status"]);

  // No user-controlled sorting or invented total count
  for (const header of await columnHeaders.all()) {
    await expect(header).not.toHaveAttribute("aria-sort");
    await expect(header.getByRole("button")).toHaveCount(0);
  }

  // AL2: Populated rows with order, detail links, module, static status
  const rows = table.getByRole("row");
  // 1 header row + 2 data rows
  await expect(rows).toHaveCount(3);

  const rule1Link = table.getByRole("link", { name: "Synthetic regional routing" });
  await expect(rule1Link).toBeVisible();
  await expect(rule1Link).toHaveAttribute(
    "href",
    `/crm/${org.slug}/settings/assignment-rules/synthetic-rule-1`,
  );
  await expect(table.getByRole("cell", { name: "1", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "Leads", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "Active", exact: true })).toBeVisible();

  const rule2Link = table.getByRole("link", { name: "Synthetic contact intake" });
  await expect(rule2Link).toBeVisible();
  await expect(rule2Link).toHaveAttribute(
    "href",
    `/crm/${org.slug}/settings/assignment-rules/synthetic-rule-2`,
  );
  await expect(table.getByRole("cell", { name: "2", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "Contacts", exact: true })).toBeVisible();
  await expect(table.getByRole("cell", { name: "Inactive", exact: true })).toBeVisible();

  // AL2 / RC1–RC6: No switches, no checkboxes, no creation or write controls
  await expect(page.getByRole("switch")).toHaveCount(0);
  await expect(table.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Create Assignment Rule" })).toHaveCount(0);
  const rulesRegion = page.getByRole("region", { name: "Assignment Rules" });
  await expect(rulesRegion.getByRole("button", { name: /edit|delete|clone|reorder/i })).toHaveCount(
    0,
  );

  // --- AL3: Module filter with All modules option and no cursor pagination link ---
  const moduleFilter = page.getByLabel("Module");
  await expect(moduleFilter).toBeVisible();
  const applyFilter = page.getByRole("button", { name: "Apply filter" });
  await expect(applyFilter).toBeVisible();

  // AL3 & AL4: Filter to Deals -> filtered zero matches explanation, introductory card absent
  await moduleFilter.selectOption("Deals");
  await applyFilter.click();
  await expect(page).toHaveURL(
    new RegExp(`/crm/${org.slug}/settings/assignment-rules\\?module=Deals`),
  );
  const noMatches = page.getByTestId("assignment-no-matches");
  await expect(noMatches).toBeVisible();
  await expect(noMatches).toHaveText("No assignment rules match the selected module.");
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByTestId("assignment-introduction")).toHaveCount(0);
  // Filter to Leads -> only Leads rule rendered
  await moduleFilter.selectOption("Leads");
  await applyFilter.click();
  await expect(table.getByRole("link", { name: "Synthetic regional routing" })).toBeVisible();
  await expect(table.getByRole("link", { name: "Synthetic contact intake" })).toHaveCount(0);

  // Filter to Contacts -> only Contacts rule rendered
  await moduleFilter.selectOption("Contacts");
  await applyFilter.click();
  await expect(table.getByRole("link", { name: "Synthetic contact intake" })).toBeVisible();
  await expect(table.getByRole("link", { name: "Synthetic regional routing" })).toHaveCount(0);

  // Filter to All modules -> both rules rendered
  await moduleFilter.selectOption("");
  await applyFilter.click();
  await expect(table.getByRole("link", { name: "Synthetic regional routing" })).toBeVisible();
  await expect(table.getByRole("link", { name: "Synthetic contact intake" })).toBeVisible();
  await expect(page.getByRole("table", { name: "Assignment rules", exact: true })).toBeVisible();
  await expectNoA11yViolations(page, { include: ['section[aria-label="Assignment Rules"]'] });

  // AL3: Next page link is absent when nextCursor is null
  await expect(page.getByRole("link", { name: "Next page" })).toHaveCount(0);

  // --- AL5: Error and retry state distinct from introductory body ---
  await page.goto(`/crm/${org.slug}/settings/assignment-rules?cursor=invalid-cursor`);
  const errorAlert = page.getByTestId("assignment-list-invalid_query");
  await expect(errorAlert).toBeVisible();
  await expect(errorAlert).toHaveText("Assignment rules could not be loaded.");
  await expect(page.getByTestId("assignment-introduction")).toHaveCount(0);
  await expect(page.getByRole("table")).toHaveCount(0);

  const retryLink = page.getByRole("link", { name: "Try again" });
  await expect(retryLink).toBeVisible();
  await retryLink.click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/assignment-rules`);
  await expect(page.getByRole("table")).toBeVisible();

  // --- AD1–AD6: Detail Screen 1 (Synthetic regional routing: multi-entry, criteria, fallback) ---
  await table.getByRole("link", { name: "Synthetic regional routing" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/assignment-rules/synthetic-rule-1`);

  const detailRegion = page.getByRole("region", { name: "Assignment Rule" });

  // AD1: Name heading, module, description, static status, return link
  const backToList = page.getByRole("link", { name: "Back to Assignment Rules" });
  await expect(backToList).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Synthetic regional routing", level: 1 }),
  ).toBeVisible();
  await expect(detailRegion.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expectNoA11yViolations(page, { include: ['section[aria-label="Assignment Rule"]'] });
  await expect(detailRegion.getByText("Leads")).toBeVisible();
  await expect(page.getByTestId("assignment-detail-status")).toHaveText("Active");
  await expect(detailRegion.getByText("Synthetic rule that routes by region.")).toBeVisible();

  // RC1–RC6 on detail: no write affordances or switches
  await expect(detailRegion.getByRole("button")).toHaveCount(0);
  await expect(detailRegion.getByRole("switch")).toHaveCount(0);

  // AD2: Ordered entry rows with displayed sequence and condition
  await expect(page.getByRole("heading", { name: "Rule entries", level: 2 })).toBeVisible();
  const entriesTable = detailRegion.getByRole("table");
  await expect(entriesTable).toBeVisible();

  const entryHeaders = entriesTable.getByRole("columnheader");
  await expect(entryHeaders).toHaveCount(5);
  const entryHeaderTexts = await entryHeaders.allTextContents();
  expect(entryHeaderTexts.map((t) => t.trim())).toEqual([
    "Order",
    "Condition",
    "Recipients",
    "Distribution",
    "Availability",
  ]);

  const entryRows = entriesTable.getByRole("row");
  // 1 header row + 3 entries
  await expect(entryRows).toHaveCount(4);

  // AD2, AD3, AD4, AD5 - Entry 1 (position 1)
  const row1Cells = entryRows.nth(1).getByRole("cell");
  await expect(row1Cells.nth(0)).toHaveText("1");
  await expect(row1Cells.nth(1)).toContainText("and", { ignoreCase: true });
  await expect(row1Cells.nth(1)).toContainText("Region equal North");
  await expect(row1Cells.nth(1)).toContainText("or", { ignoreCase: true });
  await expect(row1Cells.nth(1)).toContainText("Score greater_than 10");
  await expect(row1Cells.nth(1)).toContainText(`Owner equal \${CURRENTUSER}`);
  await expect(row1Cells.nth(2)).toContainText("Users");
  await expect(row1Cells.nth(2)).toContainText("synthetic-user-a, synthetic-user-b");
  await expect(row1Cells.nth(3)).toHaveText("Round robin");
  await expect(row1Cells.nth(4)).toHaveText("Require available");

  // AD2, AD3, AD4, AD5 - Entry 2 (position 2)
  const row2Cells = entryRows.nth(2).getByRole("cell");
  await expect(row2Cells.nth(0)).toHaveText("2");
  await expect(row2Cells.nth(1)).toHaveText("All records");
  await expect(row2Cells.nth(2)).toContainText("Roles");
  await expect(row2Cells.nth(2)).toContainText("synthetic-role-a");
  await expect(row2Cells.nth(3)).toHaveText("Single");
  await expect(row2Cells.nth(4)).toHaveText("Ignore availability");

  // AD2, AD3, AD4, AD5 - Entry 3 (position 3)
  const row3Cells = entryRows.nth(3).getByRole("cell");
  await expect(row3Cells.nth(0)).toHaveText("3");
  await expect(row3Cells.nth(1)).toHaveText("All records");
  await expect(row3Cells.nth(2)).toContainText("User conditions");
  await expect(row3Cells.nth(2)).toContainText("Definition: synthetic-definition-1");
  await expect(row3Cells.nth(3)).toHaveText("Round robin");
  await expect(row3Cells.nth(4)).toHaveText("Unresolved");

  // AD6: Separate default recipient section with configured fallback
  const fallback = page.getByTestId("assignment-detail-fallback");
  await expect(
    fallback.getByRole("heading", { name: "Default recipient", level: 2 }),
  ).toBeVisible();
  await expect(fallback).toContainText("Groups");
  await expect(fallback).toContainText("synthetic-group-a");

  // Safe navigation back to list
  await backToList.click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/assignment-rules`);
  await expect(page.getByRole("table")).toBeVisible();

  // --- AD1, AD6, AD7: Detail Screen 2 (Synthetic contact intake: empty entries, null fallback) ---
  await table.getByRole("link", { name: "Synthetic contact intake" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/assignment-rules/synthetic-rule-2`);

  const detailRegion2 = page.getByRole("region", { name: "Assignment Rule" });
  await expect(
    page.getByRole("heading", { name: "Synthetic contact intake", level: 1 }),
  ).toBeVisible();
  await expect(detailRegion2.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(detailRegion2.getByText("Contacts")).toBeVisible();
  await expect(page.getByTestId("assignment-detail-status")).toHaveText("Inactive");
  await expect(detailRegion2.getByText("No description")).toBeVisible();

  // AD7: Explicit empty entries state
  const noEntries = page.getByTestId("assignment-detail-no-entries");
  await expect(noEntries).toBeVisible();
  await expect(noEntries).toHaveText("This rule has no entries.");
  await expect(detailRegion2.getByRole("table")).toHaveCount(0);

  // AD6: Explicit null fallback explanation
  const fallback2 = page.getByTestId("assignment-detail-fallback");
  await expect(fallback2).toContainText("No default recipient is configured.");

  // Return to list
  await page.getByRole("link", { name: "Back to Assignment Rules" }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/assignment-rules`);

  // --- AD7: Not found state with safe return navigation ---
  await page.goto(`/crm/${org.slug}/settings/assignment-rules/missing-rule`);
  const notFoundAlert = page.getByTestId("assignment-detail-not_found");
  await expect(notFoundAlert).toBeVisible();
  await expect(notFoundAlert).toHaveText("This assignment rule could not be found.");

  const backFromMissing = page.getByRole("link", { name: "Back to Assignment Rules" });
  await expect(backFromMissing).toBeVisible();
  await backFromMissing.click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/assignment-rules`);
  await expect(page.getByRole("table")).toBeVisible();

  // Zero non-GET requests throughout the run
  expect(nonGetRequests).toEqual([]);

  // Clean page errors
  assertNoPageErrors(pageErrors);
});
