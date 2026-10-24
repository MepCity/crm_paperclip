import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { assertNoPageErrors, expect, test } from "./support/test";

test("Workqueue navigation, session welcome, queue switching and refresh remain GET-only", async ({
  page,
  pageErrors,
}) => {
  await signUpNewUser(page);
  const { slug } = await createOrganization(page);
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET")
      writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
  });
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
  const getStarted = page.getByRole("button", { name: "Get Started" });
  await expect(getStarted).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(getStarted).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Focus returns to sensible target (selected Tasks queue button)
  const tasksBtn = page.getByRole("button", { name: /^Tasks \d+$/, exact: true });
  await expect(tasksBtn).toBeFocused();
  await expect(tasksBtn).toHaveAttribute("aria-pressed", "true");

  // Queue buttons: Enter/Space activates, aria-pressed reflects selection
  const dealsBtn = page.getByRole("button", { name: /^My Deals \d+$/, exact: true });
  await expect(dealsBtn).toHaveAttribute("aria-pressed", "false");
  await dealsBtn.focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("region", { name: "My Deals queue" })).toBeVisible();
  await expect(dealsBtn).toHaveAttribute("aria-pressed", "true");
  await expect(tasksBtn).toHaveAttribute("aria-pressed", "false");

  // Toolbar icon buttons have accessible names and unavailable actions link explanation via aria-describedby
  const refreshBtn = page.getByRole("button", { name: "Refresh queue", exact: true });
  await expect(refreshBtn).toBeVisible();
  const filterBtn = page.getByRole("button", { name: "Filter", exact: true });
  await expect(filterBtn).toBeVisible();
  const filterDescId = await filterBtn.getAttribute("aria-describedby");
  expect(filterDescId).toBeTruthy();
  await expect(page.locator(`#${filterDescId}`)).toContainText("unavailable");

  await expect(page.getByRole("button", { name: "Help", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "View Settings", exact: true })).toBeVisible();

  await refreshBtn.click();
  await expect(page.getByRole("region", { name: "My Deals queue" })).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await tasksBtn.click();
  await page.getByRole("link", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${slug}/workqueue?page=2`);
  await expect(page.getByRole("region", { name: "Tasks queue" })).toBeVisible();
  await page.getByRole("link", { name: "Previous", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${slug}/workqueue?page=1`);
  await page.reload();

  // Table has column headers and no unsupported table aria-label
  const queueTable = page.getByRole("table");
  await expect(queueTable).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Subject" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const task = queueTable.getByRole("link").first();
  await expect(task).toBeVisible();
  expect(writes).toEqual([]);
  const href = await task.getAttribute("href");
  // Destination record pages have their own read POST contract; the queue itself is GET-only.
  await task.click();
  await expect(page).toHaveURL(href ?? "");
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
