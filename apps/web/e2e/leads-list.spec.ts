import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleListCustomPath, moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

type ElementBox = NonNullable<
  Awaited<ReturnType<import("@playwright/test").Locator["boundingBox"]>>
>;

function requireBox(box: ElementBox | null, label = "element"): ElementBox {
  if (!box) throw new Error(`Expected ${label} box.`);
  return box;
}

function expectRange(value: number, min: number, max: number) {
  expect(value).toBeGreaterThanOrEqual(min - 1);
  expect(value).toBeLessThanOrEqual(max + 1);
}

test.describe("Leads list page", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("opens the default view with columns from the view definition", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await expect(page.getByRole("heading", { name: "Leads", level: 1 })).toBeVisible();
    await expect(page.getByText("All Leads")).toBeVisible();
    for (const label of ["Full Name", "Company", "Email", "Phone", "Lead Source", "Lead Owner"]) {
      await expect(page.getByRole("columnheader", { name: label })).toBeVisible();
    }
  });

  test("paginates and keeps page size in the address", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(`${moduleListDefaultPath(org.slug, LEADS_MODULE)}?per_page=10&page=1`);
    await expect(page.getByLabel("Next")).toBeEnabled();
    await page.getByLabel("Next").click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page).toHaveURL(/per_page=10/);
    await page.getByLabel("Previous").click();
    await expect(page).toHaveURL(/page=1/);
  });

  test("applies sort to the address and reloads data", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await page.getByRole("button", { name: "Sort", exact: true }).click();
    const sortBy = page.getByRole("button", { name: /Sort By/ });
    await sortBy.click();
    await page.getByRole("option", { name: "Company" }).click();
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/sort_by=Company/);
    await expect(page).toHaveURL(/sort_order=asc/);
  });

  test("custom view route shows that view columns", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListCustomPath(org.slug, LEADS_MODULE, "converted-leads"));
    await expect(page.getByText("Converted Leads")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Phone" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Full Name" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Lead Source" })).toHaveCount(0);
  });

  test("toggles the filter panel and supports row selection", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    const filter = page.getByRole("button", { name: "Filter", exact: true });
    await expect(filter).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("region", { name: "Filter Leads by" })).toBeVisible();
    await filter.click();
    await expect(filter).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("region", { name: "Filter Leads by" })).toHaveCount(0);
    const rowBox = page.getByRole("checkbox", { name: /Select / }).first();
    await rowBox.check({ force: true });
    await expect(rowBox).toBeChecked();
  });

  test("organizations do not share list rows", async ({ page }) => {
    await signUpNewUser(page);
    const first = await createOrganization(page);
    await page.goto(moduleListDefaultPath(first.slug, LEADS_MODULE));
    const recordHref = await page
      .locator("table tbody tr")
      .first()
      .getByRole("link")
      .first()
      .getAttribute("href");
    if (!recordHref) throw new Error("Expected a record link href.");
    const second = await createOrganization(page);
    const crossOrgPath = recordHref.replace(`/crm/${first.slug}/`, `/crm/${second.slug}/`);
    await page.goto(crossOrgPath);
    await expect(page.getByText(/could not be found/i)).toBeVisible();
  });

  test("records ADR list data requests only", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const seen: { method: string; path: string; search: string }[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (!url.pathname.startsWith("/crm/v")) return;
      seen.push({
        method: request.method(),
        path: url.pathname,
        search: url.search,
      });
    });
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    const names = new Set(seen.map((item) => `${item.method} ${item.path}`));
    expect(names.has("GET /crm/v2.2/settings/modules/Leads")).toBe(true);
    expect(names.has("GET /crm/v2.2/settings/fields")).toBe(true);
    expect(names.has("GET /crm/v2.1/settings/layouts")).toBe(true);
    expect(names.has("GET /crm/v9/settings/custom_views")).toBe(true);
    expect(names.has("GET /crm/v9/users")).toBe(true);
    expect(seen.some((item) => item.method === "POST" && item.path.endsWith("/Leads/bulk"))).toBe(
      true,
    );
    expect(
      seen.some((item) => item.method === "POST" && item.path.endsWith("/actions/count")),
    ).toBe(true);
    await page.getByLabel("Next").click();
    await expect(page).toHaveURL(/page=2/);
    const bulkCalls = seen.filter(
      (item) => item.method === "POST" && item.path.endsWith("/Leads/bulk"),
    );
    expect(bulkCalls.some((item) => item.search.includes("page=2"))).toBe(true);
  });

  test("meets accessibility rules on the populated list", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("layout matches list visual layout at 1470×835", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(`${moduleListDefaultPath(org.slug, LEADS_MODULE)}?per_page=10&page=1`);
    const listPage = page.locator(".module-list-page");
    await expect(listPage).toBeVisible();
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    await expect(listPage.locator("[data-part=row]")).toHaveCount(10);
    await expect(listPage).toHaveCSS("background-color", "rgb(238, 241, 249)");

    const pill = listPage.locator("[data-view-pill]");
    const pillBox = requireBox(await pill.boundingBox(), "view pill");
    expectRange(pillBox.x, 332, 332);
    expectRange(pillBox.y, 57.5, 83.5);
    expect(Math.abs(pillBox.height - 26)).toBeLessThanOrEqual(1);
    await expect(pill).toHaveCSS("border-radius", "6px");

    const createLead = listPage.getByRole("link", { name: "Create Lead" });
    const createBox = requireBox(await createLead.boundingBox(), "Create Lead");
    expectRange(createBox.y, 99, 132);

    const filter = listPage.getByRole("region", { name: "Filter Leads by" });
    await expect(filter).toHaveCSS("width", "202px");
    const filterBox = requireBox(await filter.boundingBox(), "filter panel");
    expectRange(filterBox.x, 335, 335);
    expectRange(filterBox.x + filterBox.width, 537, 537);
    expectRange(filterBox.y, 154, 154);

    const card = listPage.locator("[data-part=card]");
    const cardBox = requireBox(await card.boundingBox(), "table card");
    expectRange(cardBox.x, 547, 547);
    const gap = cardBox.x - (filterBox.x + filterBox.width);
    expect(Math.abs(gap - 10)).toBeLessThanOrEqual(1);

    const headerRow = listPage.locator("[data-part=header]");
    const headerBox = requireBox(await headerRow.boundingBox(), "table header");
    expectRange(headerBox.y, 154, 191);

    const columnHeaders = listPage.locator("[data-part=column]");
    for (const [index, expectedX] of [
      [0, 788],
      [1, 988],
      [2, 1188],
      [3, 1388],
    ] as const) {
      const columnBox = requireBox(
        await columnHeaders.nth(index).boundingBox(),
        `data column ${index}`,
      );
      expectRange(columnBox.x, expectedX, expectedX);
    }

    const headerCheckbox = headerRow.locator("[data-part=checkbox]").first();
    const checkboxBox = requireBox(await headerCheckbox.boundingBox(), "header checkbox");
    expectRange(checkboxBox.x, 623, 638);

    const settings = listPage.locator("[data-part=settings]");
    const settingsBox = requireBox(await settings.boundingBox(), "settings cell");
    expectRange(settingsBox.x, 1414, 1414);
    expectRange(settingsBox.x + settingsBox.width, 1454, 1454);

    const firstRow = listPage.locator("[data-part=row]").first();
    const secondRow = listPage.locator("[data-part=row]").nth(1);
    const firstRowBox = requireBox(await firstRow.boundingBox(), "first row");
    const secondRowBox = requireBox(await secondRow.boundingBox(), "second row");
    const rowPitch = secondRowBox.y - firstRowBox.y;
    expect(Math.abs(rowPitch - (firstRowBox.height + 1))).toBeLessThanOrEqual(1);
    const wrappedPitch = 55;
    const singleLinePitch = 37;
    expect(
      Math.abs(rowPitch - wrappedPitch) <= 1 || Math.abs(rowPitch - singleLinePitch) <= 1,
    ).toBe(true);

    const footer = listPage.locator("[data-part=footer]");
    const footerBox = requireBox(await footer.boundingBox(), "footer");
    expectRange(footerBox.y, 760, 793);
    expect(Math.abs(footerBox.height - 33)).toBeLessThanOrEqual(1);

    expect(Math.abs(1470 - (cardBox.x + cardBox.width) - 16)).toBeLessThanOrEqual(1);
  });
});
