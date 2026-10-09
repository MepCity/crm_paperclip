import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Locator, Page } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";
import { expectType } from "./support/typography";

// Expected metrics cite research/specs/list-views.md › Layout › Visual layout:
// "Data and trailing column widths" (View Settings cell), "View Settings popover",
// "Selected / disabled" (highlighted settings-menu row) and "Text roles".
type Box = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>;

const LONG_COMPANY =
  "Example Consolidated Manufacturing Distribution and Logistics Holdings Incorporated";
const LONG_NAME = "Wrap Sample Lead With A Deliberately Long Display Name That Overflows";

function requireBox(box: Box | null, label: string): Box {
  if (!box) throw new Error(`Expected ${label} to have a bounding box.`);
  return box;
}

function expectEdge(value: number, expected: number, tolerance = 1) {
  expect(Math.abs(value - expected)).toBeLessThanOrEqual(tolerance);
}

async function openList(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
  await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
  return org;
}

/** Opens View Settings and one of its submenus; returns the submenu. */
async function openSubmenu(page: Page, name: string) {
  await page.getByRole("button", { name: "View Settings" }).click();
  await expect(page.getByRole("menu", { name: "View Settings" })).toBeVisible();
  await page.getByRole("menu", { name: "View Settings" }).getByRole("menuitem", { name }).click();
  const submenu = page.getByRole("menu", { name });
  await expect(submenu).toBeVisible();
  return submenu;
}

function parentPopover(page: Page) {
  return page.locator('[data-rac][data-trigger="MenuTrigger"]');
}

function rangeEnds(page: Page) {
  return page.locator("[data-part=range] [data-part=range-end]").allInnerTexts();
}

test.describe("Leads list View Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("page size choice updates the address, resets to page 1 and stays stored", async ({
    page,
  }) => {
    const org = await openList(page);
    const rows = page.locator("[data-part=row]");
    await expect(rows).toHaveCount(30);

    // Start away from page 1 so the reset is visible.
    await page.getByLabel("Next").click();
    await expect.poll(() => new URL(page.url()).searchParams.get("page")).toBe("2");

    const submenu = await openSubmenu(page, "Records Per Page");
    await expect(submenu.getByRole("menuitemradio")).toHaveCount(6);
    await expect(
      submenu.getByRole("menuitemradio", { name: "30", exact: true }).locator("svg"),
    ).toHaveCount(1);
    await expect(
      submenu.getByRole("menuitemradio", { name: "10", exact: true }).locator("svg"),
    ).toHaveCount(0);
    await submenu.getByRole("menuitemradio", { name: "10", exact: true }).click();
    await expect(page.getByRole("menu", { name: "View Settings" })).toHaveCount(0);

    // router.push settles asynchronously, so the address is polled, not read once.
    await expect.poll(() => new URL(page.url()).searchParams.get("per_page")).toBe("10");
    await expect.poll(() => new URL(page.url()).searchParams.get("page")).toBeNull();
    await expect(rows).toHaveCount(10);
    expect(await rangeEnds(page)).toEqual(["1", "10"]);

    // Reopening marks the stored size.
    const again = await openSubmenu(page, "Records Per Page");
    await expect(again.getByRole("menuitemradio", { name: "10", exact: true })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.keyboard.press("Escape");

    // An address without per_page falls back to the stored preference.
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    expect(new URL(page.url()).searchParams.get("per_page")).toBeNull();
    await expect(rows).toHaveCount(10);
    expect(await rangeEnds(page)).toEqual(["1", "10"]);

    // A reload keeps it too.
    await page.reload();
    await expect(rows).toHaveCount(10);
  });

  test("Wrap Text off keeps one line and stays off after a reload", async ({ page }) => {
    await page.route("**/crm/v2.2/Leads/bulk**", async (handler) => {
      const requestUrl = new URL(handler.request().url());
      const perPage = Number(requestUrl.searchParams.get("per_page") ?? "30");
      await handler.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "900000000000000001",
              Full_Name: LONG_NAME,
              Company: LONG_COMPANY,
              Email: "wrap@example.org",
              Phone: "000-001",
              Lead_Source: null,
              Owner: null,
            },
          ],
          info: {
            page: 1,
            per_page: perPage,
            count: 1,
            more_records: false,
            sort_by: "id",
            sort_order: "desc",
          },
        }),
      });
    });

    await openList(page);
    const row = page.locator("[data-part=row]").first();
    // The name links, so the data columns start at index 1 with Company.
    const companyCell = row.locator("[data-part=column]").nth(1).locator("[data-part=value]");
    const valueCell = row.locator("[data-part=column]").first().locator("[data-part=value]");

    const wrappedBox = requireBox(await row.boundingBox(), "wrapped row");
    expect(wrappedBox.height).toBeGreaterThanOrEqual(54);
    await expect(valueCell).toHaveCSS("white-space", "normal");
    await expect(companyCell).toHaveCSS("white-space", "normal");

    const viewMode = await openSubmenu(page, "View Mode");
    const wrap = viewMode.getByRole("menuitemcheckbox", { name: "Wrap Text" });
    await expect(wrap).toHaveAttribute("aria-checked", "true");
    await wrap.click();
    await expect(page.getByRole("menu", { name: "View Settings" })).toHaveCount(0);

    // Style first: these retry while React applies the new preference, then the box is stable.
    await expect(valueCell).toHaveCSS("white-space", "nowrap");
    await expect(companyCell).toHaveCSS("white-space", "nowrap");
    await expect(companyCell).toHaveCSS("text-overflow", "ellipsis");
    const singleBox = requireBox(await row.boundingBox(), "single-line row");
    expectEdge(singleBox.height, 36);
    const clipped = await companyCell.evaluate((node) => ({
      scrolls: node.scrollWidth > node.clientWidth,
      text: node.textContent ?? "",
    }));
    expect(clipped.scrolls).toBe(true);
    expect(clipped.text).toBe(LONG_COMPANY);

    await page.reload();
    await expect(page.locator("[data-part=row]")).toHaveCount(1);
    await expect(companyCell).toHaveCSS("white-space", "nowrap");
    const afterReload = requireBox(
      await page.locator("[data-part=row]").first().boundingBox(),
      "row after reload",
    );
    expectEdge(afterReload.height, 36);

    const reopened = await openSubmenu(page, "View Mode");
    await expect(reopened.getByRole("menuitemcheckbox", { name: "Wrap Text" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  test("cell and popover match the measured View Settings rows at 1470 × 835", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(`${moduleListDefaultPath(org.slug, LEADS_MODULE)}?per_page=10`);
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    // Data and trailing column widths: header-only 40 px cell at x 1414–1454 with a
    // 1 px #DCDBEE left border over the full header height.
    const cell = page.locator("[data-part=settings]");
    const cellBox = requireBox(await cell.boundingBox(), "View Settings cell");
    expectEdge(cellBox.x, 1414);
    expectEdge(cellBox.x + cellBox.width, 1454);
    expectEdge(cellBox.width, 40);
    const headerBox = requireBox(await page.locator("[data-part=header]").boundingBox(), "header");
    expectEdge(cellBox.height, headerBox.height);
    await expect(cell).toHaveCSS("border-left-width", "1px");
    await expect(cell).toHaveCSS("border-left-color", "rgb(220, 219, 238)");

    // View Settings popover: about 264 px wide below the right table icon; white,
    // 6 px corners and shadow; rows around 30 px high.
    const trigger = page.getByRole("button", { name: "View Settings" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const menu = page.getByRole("menu", { name: "View Settings" });
    await expect(menu).toBeVisible();
    const popover = parentPopover(page);
    await expect(popover).toHaveCSS("width", "264px");
    await expect(popover).toHaveCSS("border-radius", "6px");
    await expect(popover).toHaveCSS("background-color", "rgb(255, 255, 255)");
    expect(await popover.evaluate((node) => getComputedStyle(node).boxShadow)).not.toBe("none");
    const popoverBox = requireBox(await popover.boundingBox(), "settings popover");
    expectEdge(popoverBox.y, cellBox.y + cellBox.height, 2);
    // The popover is anchored to its trigger, as every menu in this app is. The spec
    // measures only the popover width and that it sits below the icon.
    const triggerBox = requireBox(await trigger.boundingBox(), "View Settings trigger");
    expectEdge(popoverBox.x + popoverBox.width, triggerBox.x + triggerBox.width, 1);

    const perPage = menu.getByRole("menuitem", { name: "Records Per Page" });
    const viewMode = menu.getByRole("menuitem", { name: "View Mode" });
    for (const row of [perPage, viewMode]) {
      const rowBox = requireBox(await row.boundingBox(), "settings row");
      expectEdge(rowBox.width, 250);
      expectEdge(rowBox.height, 30);
      await expectType(page, row, "--text-md", "--font-weight-normal");
      await expect(row).toHaveCSS("color", "rgb(49, 57, 73)");
    }

    // Row content in the capture's order: a leading glyph, the label, and the value in
    // effect at the row's right edge. The page size is carried in the address here.
    const partsOf = async (row: Locator) => {
      const boxes = await Promise.all(
        (await row.locator("svg").all()).map(async (glyph) =>
          requireBox(await glyph.boundingBox(), "row glyph"),
        ),
      );
      const leading = boxes[0];
      const chevron = boxes[1];
      if (!leading || !chevron) throw new Error(`Expected two glyphs in ${await row.innerText()}`);
      return {
        leading,
        chevron,
        count: boxes.length,
        rowBox: requireBox(await row.boundingBox(), "settings row"),
        text: (await row.innerText()).replace(/\s+/g, " ").trim(),
      };
    };
    const perPageParts = await partsOf(perPage);
    expect(perPageParts.text).toBe("Records Per Page 10");
    const viewModeParts = await partsOf(viewMode);
    expect(viewModeParts.text).toBe("View Mode Wrap Text");

    for (const parts of [perPageParts, viewModeParts]) {
      // Two glyphs: the leading icon and the submenu chevron at the row's right edge,
      // both 16px (--size-menu-icon) and vertically centred in the 30px row.
      expect(parts.count).toBe(2);
      for (const glyph of [parts.leading, parts.chevron]) {
        expectEdge(glyph.width, 16);
        expectEdge(glyph.height, 16);
        expect(glyph.y + glyph.height / 2).toBeCloseTo(parts.rowBox.y + parts.rowBox.height / 2, 1);
      }
      expect(parts.chevron.x).toBeGreaterThan(parts.leading.x + parts.leading.width);
    }
    // The value sits between the label and the chevron, right-aligned in the row.
    const valueBox = requireBox(
      await perPage.locator("span", { hasText: /^10$/ }).boundingBox(),
      "page size value",
    );
    expect(valueBox.x + valueBox.width).toBeLessThanOrEqual(perPageParts.chevron.x);
    expect(valueBox.y + valueBox.height / 2).toBeCloseTo(
      perPageParts.rowBox.y + perPageParts.rowBox.height / 2,
      1,
    );

    // The trigger glyph is the framed settings sliders, not a bare gear.
    const triggerGlyph = requireBox(
      await trigger.locator("svg").boundingBox(),
      "View Settings trigger glyph",
    );
    expectEdge(triggerGlyph.width, 16);
    expectEdge(triggerGlyph.height, 16);
    expect(await trigger.locator("svg rect").count()).toBe(1);

    // Selected / disabled: highlighted settings-menu row fill #F0F4FC. Opening a menu
    // with the keyboard focuses its first row, so the highlighted row is whatever
    // carries the focus marker.
    const highlighted = page.locator('[role=menu][aria-label="View Settings"] [data-focused]');
    await expect(highlighted).toHaveCSS("background-color", "rgb(240, 244, 252)");
    await expect(highlighted).toHaveCSS("height", "30px");

    await page.keyboard.press("ArrowRight");
    const submenu = page.getByRole("menu", { name: "Records Per Page" });
    await expect(submenu).toBeVisible();
    await expect(submenu.getByRole("menuitemradio")).toHaveCount(6);
    const sizes = await submenu.getByRole("menuitemradio").allInnerTexts();
    expect(sizes.map((text) => text.trim())).toEqual(["10", "20", "30", "40", "50", "100"]);
    expectEdge(
      requireBox(
        await submenu.getByRole("menuitemradio", { name: "10", exact: true }).boundingBox(),
        "size row",
      ).height,
      30,
    );

    if (process.env.VIEW_SETTINGS_ARTIFACT_DIR) {
      const dir = process.env.VIEW_SETTINGS_ARTIFACT_DIR;
      await mkdir(dir, { recursive: true });
      await submenu.getByRole("menuitemradio", { name: "30", exact: true }).hover();
      await page.locator("[data-part=card]").screenshot({ path: join(dir, "list-settings.png") });
      await writeFile(
        join(dir, "measurements.json"),
        JSON.stringify(
          {
            cell: cellBox,
            header: headerBox,
            popover: popoverBox,
            perPageRow: requireBox(await perPage.boundingBox(), "Records Per Page row"),
            viewModeRow: requireBox(await viewMode.boundingBox(), "View Mode row"),
            submenu: requireBox(await submenu.boundingBox(), "page size submenu"),
          },
          null,
          2,
        ),
      );
    }

    await expectNoA11yViolations(page);
  });
});
