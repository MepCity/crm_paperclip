import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Workqueue inventory W01-W29 and functional WD01-WD10: entry modal, user bar, rail sections, headers, footer and inert/forbidden actions", async ({
  page,
  pageErrors,
}) => {
  const credentials = await signUpNewUser(page, { name: "Queue Admin" });
  const { slug } = await createOrganization(page);

  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET")
      writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
  });

  // Entry navigation to Workqueue
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await nav.getByRole("link", { name: "Workqueue", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${slug}/workqueue`);
  await expect(nav.getByRole("link", { name: "Workqueue", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);

  // W01: Welcome dialog has accessible name, auto-focuses Get Started, traps Tab, and returns focus.
  const dialog = page.getByRole("dialog", { name: "Workqueue - Stay on top of your day" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Workqueue - Stay on top of your day", exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Welcome to Workqueue, your single place to manage all your work across CRM"),
  ).toBeVisible();
  const getStarted = page.getByRole("button", { name: "Get Started", exact: true });
  await expect(getStarted).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(getStarted).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Focus returns to sensible target (selected Tasks queue button)
  const tasksBtn = page.getByRole("button", { name: /^Tasks \d+$/, exact: true });
  await expect(tasksBtn).toBeFocused();
  await expect(tasksBtn).toHaveAttribute("aria-pressed", "true");

  // W02: Top: User panel & WD04 (current user scope)
  await expect(page.getByText(credentials.name, { exact: true })).toBeVisible();
  await expect(page.getByText("Administrator", { exact: true })).toBeVisible();

  // W03: Top beside user: plus / users dropdown (WD04)
  const selectUsersBtn = page.getByRole("button", { name: "Select users", exact: true });
  await expect(selectUsersBtn).toBeVisible();
  await selectUsersBtn.click();
  await expect(page.getByRole("status")).toHaveText(
    "User selection is unavailable in this preview: no changes are made or saved.",
  );

  // Left rail
  const rail = page.getByRole("complementary", { name: "Workqueue queues" });
  await expect(rail).toBeVisible();

  // W04: Left: My Open Activity period (WD01)
  await expect(rail.getByRole("heading", { name: "My Open Activity", exact: true })).toBeVisible();
  await expect(rail.getByText("Today & Overdue", { exact: true })).toBeVisible();

  // W05, W06, W07: Activity queues in documented order (WD01)
  // Documented order: Tasks -> Meetings -> Calls
  const meetingsBtn = rail.getByRole("button", { name: /^Meetings \d+$/, exact: true });
  const callsBtn = rail.getByRole("button", { name: /^Calls \d+$/, exact: true });
  await expect(tasksBtn).toBeVisible();
  await expect(meetingsBtn).toBeVisible();
  await expect(callsBtn).toBeVisible();
  await expect(tasksBtn).toHaveAttribute("aria-pressed", "true");

  // WD01: Appointments is documented catalogue entry only, not implemented / out of scope
  await expect(rail.getByRole("button", { name: /appointments/i })).toHaveCount(0);

  // W08: Left: Blueprint job queue (WD09)
  await expect(rail.getByRole("heading", { name: "My Jobs", exact: true })).toBeVisible();
  const blueprintBtn = rail.getByRole("button", { name: /^Blueprint \d+$/, exact: true });
  await expect(blueprintBtn).toBeVisible();
  await blueprintBtn.click();
  await expect(page.getByRole("status")).toHaveText(
    "Jobs is unavailable in this preview: no changes are made or saved.",
  );

  // W09: Left: Customize queue (WD07)
  await expect(rail.getByRole("heading", { name: "My Workqueue", exact: true })).toBeVisible();
  const customizeBtn = rail.getByRole("button", { name: "Customize queue", exact: true });
  await expect(customizeBtn).toBeVisible();
  await customizeBtn.click();
  await expect(page.getByRole("status")).toHaveText(
    "Queue management is unavailable in this preview: no changes are made or saved.",
  );

  // W10: Left: Suggested queue (WD06)
  const suggestedBtn = rail.getByRole("button", { name: "Suggested queue", exact: true });
  await expect(suggestedBtn).toBeVisible();
  await suggestedBtn.click();
  await expect(page.getByRole("status")).toHaveText(
    "Queue creation is unavailable in this preview: no changes are made or saved.",
  );

  // W11, W12, W13: Leads section in documented order (WD05, WD06)
  await expect(rail.getByRole("heading", { name: "Leads", exact: true })).toBeVisible();
  const addLeadsBtn = rail.getByRole("button", { name: "Add Leads queue", exact: true });
  await expect(addLeadsBtn).toBeVisible();
  await addLeadsBtn.click();
  await expect(page.getByRole("status")).toHaveText(
    "Queue creation is unavailable in this preview: no changes are made or saved.",
  );
  const myLeadsBtn = rail.getByRole("button", { name: /^My Leads \d+$/, exact: true });
  const recentLeadsBtn = rail.getByRole("button", {
    name: /^Leads assigned in the last 3 hours \d+$/,
    exact: true,
  });
  await expect(myLeadsBtn).toBeVisible();
  await expect(recentLeadsBtn).toBeVisible();

  // W14, W15, W16: Contacts section in documented order (WD05, WD06)
  await expect(rail.getByRole("heading", { name: "Contacts", exact: true })).toBeVisible();
  const addContactsBtn = rail.getByRole("button", { name: "Add Contacts queue", exact: true });
  await expect(addContactsBtn).toBeVisible();
  await addContactsBtn.click();
  await expect(page.getByRole("status")).toHaveText(
    "Queue creation is unavailable in this preview: no changes are made or saved.",
  );
  const myContactsBtn = rail.getByRole("button", { name: /^My Contacts \d+$/, exact: true });
  const recentContactsBtn = rail.getByRole("button", {
    name: /^Contacts assigned in the last 3 hours \d+$/,
    exact: true,
  });
  await expect(myContactsBtn).toBeVisible();
  await expect(recentContactsBtn).toBeVisible();

  // W17, W18, W19: Deals section in documented order (WD05, WD06)
  await expect(rail.getByRole("heading", { name: "Deals", exact: true })).toBeVisible();
  const addDealsBtn = rail.getByRole("button", { name: "Add Deals queue", exact: true });
  await expect(addDealsBtn).toBeVisible();
  await addDealsBtn.click();
  await expect(page.getByRole("status")).toHaveText(
    "Queue creation is unavailable in this preview: no changes are made or saved.",
  );
  const myDealsBtn = rail.getByRole("button", { name: /^My Deals \d+$/, exact: true });
  const closingDealsBtn = rail.getByRole("button", {
    name: /^Deals Closing This Month \d+$/,
    exact: true,
  });
  await expect(myDealsBtn).toBeVisible();
  await expect(closingDealsBtn).toBeVisible();

  // W20, W21: Campaigns section in documented order (WD05, WD06)
  await expect(rail.getByRole("heading", { name: "Campaigns", exact: true })).toBeVisible();
  const addCampaignsBtn = rail.getByRole("button", { name: "Add Campaigns queue", exact: true });
  await expect(addCampaignsBtn).toBeVisible();
  await addCampaignsBtn.click();
  await expect(page.getByRole("status")).toHaveText(
    "Queue creation is unavailable in this preview: no changes are made or saved.",
  );
  const myCampaignsBtn = rail.getByRole("button", {
    name: /^My Active Campaigns \d+$/,
    exact: true,
  });
  await expect(myCampaignsBtn).toBeVisible();

  // Tasks queue region & heading controls
  const queueRegion = page.getByRole("region", { name: "Tasks queue" });
  await expect(queueRegion).toBeVisible();

  // W22: Tasks heading: refresh
  const refreshBtn = queueRegion.getByRole("button", { name: "Refresh queue", exact: true });
  await expect(refreshBtn).toBeVisible();
  await refreshBtn.click();
  await expect(queueRegion).toHaveAttribute("aria-busy", "false");

  // W23: Tasks heading: Filter (WD02)
  const filterBtn = queueRegion.getByRole("button", { name: "Filter", exact: true });
  await expect(filterBtn).toBeVisible();
  const filterDescId = await filterBtn.getAttribute("aria-describedby");
  expect(filterDescId).toBeTruthy();
  await expect(page.locator(`#${filterDescId}`)).toContainText("unavailable");
  await filterBtn.click();

  // W24: Tasks heading right: contextual Help
  const helpBtn = queueRegion.getByRole("button", { name: "Help", exact: true });
  await expect(helpBtn).toBeVisible();
  await helpBtn.click();

  // Table header & columns (W25, W26, W28, WD02)
  const table = page.getByRole("table");
  await expect(table).toBeVisible();

  // W25: Table header right: View Settings (WD02)
  const viewSettingsBtn = table.getByRole("button", { name: "View Settings", exact: true });
  await expect(viewSettingsBtn).toBeVisible();
  await viewSettingsBtn.click();

  // W26: Subject header: All alphabet affordance
  const alphaFilterBtn = table.getByRole("button", { name: "Alphabet filter", exact: true });
  await expect(alphaFilterBtn).toBeVisible();
  await expect(alphaFilterBtn).toHaveText("All");
  await alphaFilterBtn.click();

  // W28: Per task: documented column order (compact 4 columns in reference Workqueue)
  const ths = table.locator("thead th");
  await expect(ths.nth(0)).toContainText("Subject");
  await expect(ths.nth(1)).toContainText("Due Date");
  await expect(ths.nth(2)).toContainText("Status");
  await expect(ths.nth(3)).toContainText("Priority");
  await expect(page.getByRole("columnheader", { name: "Related To" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Contact Name" })).toHaveCount(0);

  // WD03 & WD08: Activity edit/delete/complete and record field updates/email/convert stay unavailable
  await expect(table.locator("input[type='checkbox']")).toHaveCount(0);
  await expect(table.getByRole("checkbox")).toHaveCount(0);
  await expect(table.getByRole("button", { name: /edit/i })).toHaveCount(0);
  await expect(table.getByRole("button", { name: /delete/i })).toHaveCount(0);
  await expect(table.getByRole("button", { name: /complete/i })).toHaveCount(0);
  await expect(table.getByRole("button", { name: /convert/i })).toHaveCount(0);
  await expect(table.getByRole("button", { name: /email/i })).toHaveCount(0);

  // WD10: Manager subordinate context is not implemented
  await expect(page.getByRole("button", { name: /subordinate|manager view/i })).toHaveCount(0);

  // W29: Footer: Previous (W29a) and Next (W29b)
  const footer = page.locator("fieldset[data-part='footer']");
  await expect(footer).toBeVisible();
  await expect(footer.getByText("Total Records")).toBeVisible();
  await expect(footer.locator("[data-part='previous']")).toBeVisible();
  await expect(footer.locator("[data-part='next']")).toBeVisible();

  // Safe pagination
  await page.getByRole("link", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${slug}/workqueue?page=2`);
  await expect(page.getByRole("region", { name: "Tasks queue" })).toBeVisible();
  await page.getByRole("link", { name: "Previous", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${slug}/workqueue?page=1`);

  // Queue switching (WD01, WD05, WD07)
  await myDealsBtn.click();
  await expect(page.getByRole("region", { name: "My Deals queue" })).toBeVisible();
  await meetingsBtn.click();
  await expect(page.getByRole("region", { name: "Meetings queue" })).toBeVisible();
  await callsBtn.click();
  await expect(page.getByRole("region", { name: "Calls queue" })).toBeVisible();
  await tasksBtn.click();
  await expect(page.getByRole("region", { name: "Tasks queue" })).toBeVisible();

  // Session reload keeps welcome modal dismissed
  await page.reload();
  const queueTable = page.getByRole("table");
  await expect(queueTable).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Subject" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // W27: Per task: Subject record link navigates safely to destination Tasks record detail
  const taskLink = queueTable.getByRole("link").first();
  await expect(taskLink).toBeVisible();
  const taskHref = await taskLink.getAttribute("href");
  expect(taskHref).toMatch(new RegExp(`^/crm/${slug}/tab/Tasks/`));
  expect(writes).toEqual([]);
  // Destination record pages have their own read POST contract; the queue itself is GET-only.
  await taskLink.click();
  await expect(page).toHaveURL(taskHref ?? "");

  assertNoPageErrors(pageErrors);
});

test("Workqueue keeps developer controls hidden and aligns queue labels, icons and count pills", async ({
  page,
  pageErrors,
}) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page);
  const { slug } = await createOrganization(page);
  await page.goto(`/crm/${slug}/workqueue`);
  await page.getByRole("button", { name: "Get Started" }).click();
  await expect(page.getByText("Preview data", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Synthetic/ })).toHaveCount(0);
  const rail = page.getByRole("complementary", { name: "Workqueue queues" });
  const tasks = rail.getByRole("button", { name: /^Tasks \d+$/ });
  await expect(tasks.locator("svg")).toBeVisible();
  const geometry = await tasks.evaluate((row) => {
    const label = row.querySelector(".workqueue-label")?.getBoundingClientRect();
    const badge = row.querySelector(".workqueue-count")?.getBoundingClientRect();
    return {
      labelRight: label?.right,
      badgeLeft: badge?.left,
      border: getComputedStyle(row).borderLeftWidth,
    };
  });
  expect(geometry.badgeLeft).toBeGreaterThan(geometry.labelRight ?? 0);
  expect(geometry.border).toBe("3px");
  const longLabel = rail
    .getByRole("button", { name: /^Contacts assigned/ })
    .locator(".workqueue-label");
  await expect(longLabel).toHaveCSS("white-space", "nowrap");
  await expect(longLabel).toHaveCSS("text-overflow", "ellipsis");
  await expect(page.getByRole("columnheader", { name: "Related To" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Contact Name" })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Priority", exact: true })).toBeVisible();
  await expect(page.getByText(/^Late by \d+ days?$/).first()).toBeVisible();
  if (process.env.WORKQUEUE_SCREENSHOT_DIR) {
    await page.screenshot({
      path: `${process.env.WORKQUEUE_SCREENSHOT_DIR}/workqueue-local.png`,
      scale: "css",
    });
  }
  assertNoPageErrors(pageErrors);
});
