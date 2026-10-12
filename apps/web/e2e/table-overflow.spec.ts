import type { Page } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

// MEP-211: the members screen is the narrowest table case in the app, so it shows what a data
// table does when its columns do not fit. Their overflow has to stay inside the table's own
// scroll container: the document must never get a horizontal range.
const NARROW = { width: 390, height: 844 };
const WIDE = { width: 1470, height: 835 };
const MEMBER_NAME = "Test User";

/** Every test registers its own account, so the specs stay independent. */
function testUser() {
  return { name: MEMBER_NAME, email: `user-${crypto.randomUUID()}@example.test` };
}

type TableMetrics = {
  /** Client width of the table's own horizontal scroll container. */
  containerWidth: number;
  /** Width the table asks for; larger than the container only when it has to scroll. */
  contentWidth: number;
  /** Right edge of the scroll container. */
  containerRight: number;
  /** Scroll offset the container reached when asked for its full content width. */
  scrolledTo: number;
  /** Left and right edge of the last column header after that scroll. */
  lastHeaderLeft: number;
  lastHeaderRight: number;
};

/** Metrics of every table in the page content, plus the document's own horizontal range. */
async function measure(page: Page) {
  const tables = await page.evaluate<TableMetrics[]>(() => {
    const root = document.querySelector("main");
    return [...(root?.querySelectorAll("table") ?? [])].map((table) => {
      let container = table.parentElement;
      while (container && getComputedStyle(container).overflowX === "visible")
        container = container.parentElement;
      if (!container) throw new Error("The table has no scroll container.");
      const headers = table.querySelectorAll("thead th");
      const lastHeader = headers[headers.length - 1] as HTMLElement;
      container.scrollLeft = container.scrollWidth;
      const headerBox = lastHeader.getBoundingClientRect();
      return {
        containerWidth: container.clientWidth,
        contentWidth: container.scrollWidth,
        containerRight: container.getBoundingClientRect().right,
        scrolledTo: container.scrollLeft,
        lastHeaderLeft: headerBox.left,
        lastHeaderRight: headerBox.right,
      };
    });
  });
  const doc = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  return { tables, ...doc };
}

async function openMembersScreen(page: Page): Promise<void> {
  const organization = await createOrganization(page);
  await page.goto(`/crm/${organization.slug}/settings/members`);
  await expect(page.getByRole("link", { name: "Members" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("button", { name: `Role for ${MEMBER_NAME}` })).toBeVisible();
}

test.describe("members screen on a narrow screen", () => {
  test.use({ viewport: NARROW });

  test.beforeEach(async ({ page }) => {
    await signUpNewUser(page, testUser());
    await openMembersScreen(page);
  });

  test("a wide table scrolls inside its own container and the page stays put", async ({ page }) => {
    const first = await measure(page);
    expect(first.tables.length).toBeGreaterThan(0);
    expect(first.innerWidth).toBe(NARROW.width);

    // The document gets no horizontal range from the tables.
    expect(first.scrollWidth).toBeLessThanOrEqual(first.innerWidth);

    // The members table is wider than the space left of it, so the checks below prove
    // containment instead of a screen that happens to fit.
    const members = first.tables[0] as TableMetrics;
    expect(members.contentWidth).toBeGreaterThan(members.containerWidth);
    // What does not fit stays reachable through the container's own scroll.
    expect(members.scrolledTo).toBeGreaterThan(0);

    for (const table of first.tables) {
      // No container reaches past the viewport, so nothing sits outside it unreachable.
      expect(table.containerRight).toBeLessThanOrEqual(first.innerWidth + 1);
      expect(table.lastHeaderRight).toBeLessThanOrEqual(first.innerWidth + 1);
      expect(table.lastHeaderLeft).toBeGreaterThanOrEqual(0);
    }

    // Scrolling the tables sideways never gives the document a horizontal range either.
    const after = await measure(page);
    expect(after.scrollWidth).toBeLessThanOrEqual(after.innerWidth);
    await page.evaluate(() => window.scrollTo(500, 0));
    expect(await page.evaluate(() => window.scrollX)).toBe(0);
    await expectNoA11yViolations(page);
  });

  test("the role menu and the remove confirmation stay usable", async ({ page }) => {
    const role = page.getByRole("button", { name: `Role for ${MEMBER_NAME}` });
    await role.scrollIntoViewIfNeeded();
    await role.click();
    const menu = page.getByRole("listbox");
    await expect(menu.getByRole("option", { name: "Member" })).toBeInViewport();
    await expectNoA11yViolations(page);
    await menu.getByRole("option", { name: "Admin" }).click();
    await expect(menu).toHaveCount(0);

    const remove = page.getByRole("button", { name: `Remove ${MEMBER_NAME}` });
    await remove.scrollIntoViewIfNeeded();
    await remove.click();
    const dialog = page.getByRole("alertdialog");
    await expect(
      dialog.getByText(`${MEMBER_NAME} will lose access to this organization.`),
    ).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Remove" })).toBeInViewport();
    await expectNoA11yViolations(page);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
  });

  test("the general screen keeps the document at the viewport width", async ({ page }) => {
    await page.getByRole("link", { name: "General" }).click();
    await expect(page.getByRole("link", { name: "General" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const measured = await measure(page);
    expect(measured.innerWidth).toBe(NARROW.width);
    expect(measured.scrollWidth).toBe(NARROW.width);
    await expectNoA11yViolations(page);
  });
});

test.describe("members screen on a desktop screen", () => {
  test.use({ viewport: WIDE });

  test("the tables fill the content column without scrolling sideways", async ({ page }) => {
    await signUpNewUser(page, testUser());
    await openMembersScreen(page);

    const measured = await measure(page);
    expect(measured.innerWidth).toBe(WIDE.width);
    expect(measured.scrollWidth).toBeLessThanOrEqual(measured.innerWidth);
    for (const table of measured.tables) {
      expect(table.contentWidth).toBe(table.containerWidth);
      expect(table.scrolledTo).toBe(0);
    }
    await expectNoA11yViolations(page);
  });

  test("the general screen keeps the document at the viewport width", async ({ page }) => {
    await signUpNewUser(page, testUser());
    const organization = await createOrganization(page);
    await page.goto(`/crm/${organization.slug}/settings`);
    await expect(page.getByRole("link", { name: "General" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(WIDE.width);
  });
});
