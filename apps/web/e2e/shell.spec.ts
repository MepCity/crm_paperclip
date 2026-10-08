import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Locator, Page } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

// research/specs/app-shell.md, Visual layout: measured CSS viewport.
const viewport = { width: 1470, height: 835 };
test.use({ viewport });

const consoleWarnings = new WeakMap<Page, string[]>();

test.afterEach(async ({ page }) => {
  expect(consoleWarnings.get(page) ?? []).toEqual([]);
});

test.beforeEach(async ({ page }) => {
  const warnings: string[] = [];
  consoleWarnings.set(page, warnings);
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await signUpNewUser(page);
  await createOrganization(page);
  // pending-announcement workaround
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Home" })).toBeVisible();
  expect(warnings).toEqual([]);
});

test("Home, settings, user identity and sign out work inside the shell", async ({ page }) => {
  await expect(page.getByRole("complementary", { name: "Navigation rail" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Home", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page).toHaveTitle("Home | MepCity CRM");
  await expectNoA11yViolations(page);

  const slug = new URL(page.url()).pathname.split("/")[2] ?? "";
  const name = await page.getByRole("button", { name: "Organization switcher" }).innerText();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${slug}/settings`);
  await expect(page.getByRole("banner").getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page).toHaveTitle("Settings | MepCity CRM");
  await expect(page.getByRole("link", { name: "General" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("main").getByText(name, { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByText(slug, { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByRole("textbox")).toHaveCount(0);
  const unselectedHome = page.getByRole("link", { name: "Home", exact: true });
  // Visual layout, Rail/pinned link: unselected label and regular role.
  await expect(unselectedHome).toHaveCSS("color", "rgb(194, 203, 222)");
  await expectType(page, unselectedHome, "--text-md", "--font-weight-normal");
  await expectNoA11yViolations(page);

  await page.getByRole("button", { name: "User menu" }).click();
  await expect(page.getByText("Test User", { exact: true })).toBeVisible();
  await expect(page.getByText(/user-.*@example\.test/)).toBeVisible();
  await expectNoA11yViolations(page);
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in$/);
  // pending-announcement workaround
  await page.reload();
  await expectNoA11yViolations(page);
  await page.goto(`/crm/${slug}/settings`);
  await expect(page).toHaveURL(/\/sign-in\?next=/);
});

test("the organization menu switches between two memberships and offers creation", async ({
  page,
}) => {
  const firstSlug = new URL(page.url()).pathname.split("/")[2] ?? "";
  const firstName = await page.getByRole("button", { name: "Organization switcher" }).innerText();
  const second = await createOrganization(page);
  // pending-announcement workaround
  await page.reload();
  const switcher = page.getByRole("button", { name: "Organization switcher" });
  await expect(switcher).toContainText(second.name);
  await switcher.click();
  await expect(page.getByRole("menuitemradio", { name: second.name, exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByRole("menuitemradio", { name: firstName, exact: true })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await expectNoA11yViolations(page);
  await page.getByRole("menuitemradio", { name: firstName, exact: true }).click();
  await expect(page).toHaveURL(`/crm/${firstSlug}`);
  await expect(switcher).toContainText(firstName);
  await expect(page.getByRole("heading", { name: "Home", exact: true })).toBeVisible();
  await expectNoA11yViolations(page);
  await switcher.click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/orgs/new");
  await expectNoA11yViolations(page);
});

test("hiding and restoring the rail keeps an accessible focused control", async ({ page }) => {
  const rail = page.getByRole("complementary", { name: "Navigation rail", includeHidden: true });
  await page.getByRole("button", { name: "Hide Menu" }).click();
  await expect(rail).toBeHidden();
  const show = page.getByRole("button", { name: "Show Menu" });
  await expect(show).toBeFocused();
  await expect(show).toHaveAttribute("aria-expanded", "false");
  await expectNoA11yViolations(page);
  await page.keyboard.press("Enter");
  await expect(rail).toBeVisible();
  await expect(page.getByRole("button", { name: "Hide Menu" })).toBeFocused();
  await expectNoA11yViolations(page);
});

test("a narrow viewport starts with a hidden rail and never overflows", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 835 });
  await page.reload();
  const rail = page.getByRole("complementary", { name: "Navigation rail", includeHidden: true });
  await expect(rail).toBeHidden();
  await expectNoA11yViolations(page);
  await page.getByRole("button", { name: "Show Menu" }).click();
  await expect(rail).toBeVisible();
  await expect(page.getByRole("button", { name: "Hide Menu" })).toBeFocused();
  await expectNoA11yViolations(page);
  await page.getByRole("button", { name: "Hide Menu" }).click();
  await expect(rail).toBeHidden();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(400);
  await expectNoA11yViolations(page);
});

test("keyboard navigation starts with skip and operates both menus", async ({ page }) => {
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await expect(skip).toHaveAttribute("data-focus-visible", "true");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.reload();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Organization switcher" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu", { name: "Organization switcher" })).toBeVisible();
  await expectNoA11yViolations(page);
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Organization switcher" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Hide Menu" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Home", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Settings", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await page.reload();
  for (let index = 0; index < 6; index++) await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "User menu" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeFocused();
  await expectNoA11yViolations(page);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("an unknown page keeps the shell and a non-member sees a generic 404", async ({
  page,
  browser,
}) => {
  const slug = new URL(page.url()).pathname.split("/")[2] ?? "";
  // Next streams this authorized layout before rendering not-found content.
  await page.goto(`/crm/${slug}/missing-page`);
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", "noindex");
  await expect(
    page.getByRole("banner").getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expectNoA11yViolations(page);

  const context = await browser.newContext();
  const other = await context.newPage();
  try {
    await signUpNewUser(other);
    await other.goto(`/crm/${slug}/settings`);
    await expect(other.getByRole("heading", { name: "404 - Not Found" })).toBeVisible();
    await expect(other.getByRole("button", { name: "Organization switcher" })).toHaveCount(0);
    await expectNoA11yViolations(other);
  } finally {
    await context.close();
  }
});

async function expectBox(locator: Locator, expected: Record<string, number>) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("Expected a visible element box.");
  for (const [key, value] of Object.entries(expected)) {
    expect(
      Math.abs(((box as unknown as Record<string, number>)[key] ?? Number.NaN) - value),
      `${await locator.toString()} ${key}: ${JSON.stringify(box)}; expected ${value}`,
    ).toBeLessThanOrEqual(1);
  }
}

async function expectType(page: Page, locator: Locator, size: string, weight: string) {
  // CTO typography mapping: read computed token values, including rem conversion.
  const expected = await page.evaluate(
    ({ size, weight }) => {
      const probe = document.createElement("span");
      probe.style.fontSize = `var(${size})`;
      probe.style.fontWeight = `var(${weight})`;
      document.body.append(probe);
      const style = getComputedStyle(probe);
      const result = { size: style.fontSize, weight: style.fontWeight };
      probe.remove();
      return result;
    },
    { size, weight },
  );
  await expect(locator).toHaveCSS("font-size", expected.size);
  await expect(locator).toHaveCSS("font-weight", expected.weight);
}

test("the measured Home layout matches every rendered Module 1 shell region", async ({
  page,
}, testInfo) => {
  const rail = page.getByRole("complementary", { name: "Navigation rail" });
  const bar = page.getByRole("banner");
  const main = page.getByRole("main");
  const home = page.getByRole("link", { name: "Home", exact: true });
  const title = bar.getByRole("heading", { name: "Home" });
  const selector = page.getByRole("button", { name: "Organization switcher" });
  const hide = page.getByRole("button", { name: "Hide Menu" });
  const settings = page.getByRole("link", { name: "Settings", exact: true });
  const avatar = page.getByRole("button", { name: "User menu" });

  // Visual layout: Navigation rail, Top bar, Main content and Main/strip boundary.
  await expectBox(rail, { x: 0, y: 0, width: 320, height: 807 });
  await expectBox(bar, { x: 320, y: 0, width: 1150, height: 50 });
  await expectBox(main, { x: 320, y: 50, width: 1150, height: 757 });
  await expect(rail).toHaveCSS("background-color", "rgb(34, 52, 88)");
  await expect(rail).toHaveCSS("border-right-width", "0px");
  await expect(bar).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(bar).toHaveCSS("border-bottom-width", "1px");
  await expect(bar).toHaveCSS("border-bottom-color", "rgb(220, 219, 238)");
  await expect(bar).toHaveCSS("box-shadow", "none");
  await expect(main).toHaveCSS("background-color", "rgb(255, 255, 255)");

  // Rail/pinned rows, Rail/pinned link and Rail/active row (real Home entry).
  await expectBox(home, { x: 10, y: 55, width: 300, height: 30 });
  await expect(home).toHaveCSS("background-color", "rgb(49, 68, 111)");
  await expect(home).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(home).toHaveCSS("border-radius", "6px");
  await expect(home).toHaveCSS("column-gap", "12px");
  await expectBox(home.locator("svg"), { x: 20, width: 16, height: 16 });
  await expectBox(home.locator("span").last(), { x: 48 });
  await expectType(page, home, "--text-md", "--font-weight-semibold");

  // Rail/product selector and Hide Menu. Organization name has content-driven width.
  await expectBox(selector, { x: 15, y: 11, height: 30 });
  await expectBox(selector.locator("svg").first(), { x: 15, width: 30, height: 30 });
  await expectBox(selector.locator("span"), { x: 53 });
  await expect(selector).toHaveCSS("color", "rgb(194, 203, 222)");
  await expectType(page, selector, "--text-base", "--font-weight-semibold");
  await expectBox(hide.locator("svg"), { x: 286, y: 17, width: 18, height: 18 });
  await expect(hide).toHaveCSS("color", "rgb(194, 203, 222)");

  // Top bar/page title and right controls: Settings precedes 30px round avatar.
  await expectBox(title, { x: 336 });
  await expect(title).toHaveCSS("color", "rgb(49, 57, 73)");
  await expectType(page, title, "--text-xl", "--font-weight-semibold");
  await expectBox(settings.locator("svg"), { width: 18, height: 18 });
  await expect(settings).toHaveCSS("color", "rgb(97, 110, 136)");
  await expectBox(avatar, { width: 30, height: 30 });
  await expect(avatar).toHaveCSS("background-color", "rgb(219, 223, 232)");
  await expect(avatar).toHaveCSS("border-radius", "9999px");
  const settingsBox = await settings.boundingBox();
  const avatarBox = await avatar.boundingBox();
  if (!settingsBox || !avatarBox) throw new Error("Expected both top bar controls.");
  expect(avatarBox.x + avatarBox.width / 2 - (settingsBox.x + settingsBox.width / 2)).toBe(34);
  await expectNoA11yViolations(page);

  // Review evidence only; no screenshot comparison or snapshot assertion.
  const evidenceDir = process.env.SHELL_EVIDENCE_DIR;
  if (evidenceDir) {
    await mkdir(evidenceDir, { recursive: true });
    const report = await page.evaluate(() => {
      const selectors = {
        rail: "aside",
        bar: "header",
        main: "main",
        home: 'nav[aria-label="Main navigation"] a',
        title: "header h1",
        selector: 'button[aria-label="Organization switcher"]',
        hide: 'button[aria-label="Hide Menu"]',
        settings: 'a[aria-label="Settings"]',
        avatar: 'button[aria-label="User menu"]',
      };
      return Object.fromEntries(
        Object.entries(selectors).map(([name, selector]) => {
          const node = document.querySelector(selector);
          if (!node) throw new Error(`Missing measured element: ${selector}`);
          const style = getComputedStyle(node);
          return [
            name,
            {
              box: node.getBoundingClientRect().toJSON(),
              background: style.backgroundColor,
              color: style.color,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              radius: style.borderRadius,
              gap: style.columnGap,
            },
          ];
        }),
      );
    });
    await writeFile(join(evidenceDir, "shell-measurements.json"), JSON.stringify(report, null, 2));
    await page.screenshot({ path: join(evidenceDir, "shell-home.png") });
    await selector.click();
    await page.screenshot({ path: join(evidenceDir, "shell-organizations.png") });
    await testInfo.attach("Home shell measurements", {
      body: JSON.stringify(report),
      contentType: "application/json",
    });
  }
});
