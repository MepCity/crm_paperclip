import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleListCustomPath, moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

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
    expect(recordHref).toBeTruthy();
    const second = await createOrganization(page);
    const crossOrgPath = recordHref!.replace(`/o/${first.slug}/`, `/o/${second.slug}/`);
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

  test("layout matches list visual tokens at 1470×835", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    const listPage = page.locator(".module-list-page");
    await expect(listPage).toBeVisible();
    const pill = listPage.locator("[data-view-pill]");
    const pillBox = await pill.boundingBox();
    expect(pillBox).not.toBeNull();
    expect(Math.abs((pillBox?.height ?? 0) - 26)).toBeLessThanOrEqual(1);
    await expect(pill).toHaveCSS("border-radius", "6px");
    const filter = listPage.getByRole("region", { name: "Filter Leads by" });
    await expect(filter).toHaveCSS("width", "202px");
    const filterBox = await filter.boundingBox();
    const card = listPage.locator("[data-part=card]");
    const cardBox = await card.boundingBox();
    expect(filterBox).not.toBeNull();
    expect(cardBox).not.toBeNull();
    const gap = (cardBox?.x ?? 0) - ((filterBox?.x ?? 0) + (filterBox?.width ?? 0));
    expect(Math.abs(gap - 10)).toBeLessThanOrEqual(1);
    const footer = listPage.locator("[data-part=footer]");
    const footerBox = await footer.boundingBox();
    expect(footerBox).not.toBeNull();
    expect(Math.abs((footerBox?.height ?? 0) - 33)).toBeLessThanOrEqual(1);
  });
});
