import type { Locator } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleListCustomPath, moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

type ElementBox = NonNullable<
  Awaited<ReturnType<import("@playwright/test").Locator["boundingBox"]>>
>;

type CrmRequest = { method: string; pathname: string; searchParams: URLSearchParams };

type ListDataRequestSpec = {
  method: string;
  path: RegExp;
  queryNames: readonly string[] | null;
};

const LIST_OPEN_DATA_REQUESTS: readonly ListDataRequestSpec[] = [
  { method: "GET", path: /^\/crm\/v2\.2\/settings\/modules\/Leads$/, queryNames: [] },
  { method: "GET", path: /^\/crm\/v2\.2\/settings\/fields$/, queryNames: ["module"] },
  { method: "GET", path: /^\/crm\/v2\.1\/settings\/layouts$/, queryNames: ["module"] },
  {
    method: "GET",
    path: /^\/crm\/v9\/settings\/custom_views$/,
    queryNames: ["module", "page", "per_page"],
  },
  {
    method: "GET",
    path: /^\/crm\/v9\/settings\/custom_views\/[^/]+$/,
    queryNames: ["module"],
  },
  {
    method: "POST",
    path: /^\/crm\/v2\.2\/Leads\/bulk$/,
    queryNames: ["cvid", "page", "per_page", "fields"],
  },
  {
    method: "POST",
    path: /^\/crm\/v2\.2\/Leads\/actions\/count$/,
    queryNames: ["cvid"],
  },
  { method: "GET", path: /^\/crm\/v9\/users$/, queryNames: ["type", "page", "per_page"] },
] as const;

function requireBox(box: ElementBox | null, label = "element"): ElementBox {
  if (!box) throw new Error(`Expected ${label} box.`);
  return box;
}

function expectEdge(value: number, expected: number, tolerance = 1) {
  expect(Math.abs(value - expected)).toBeLessThanOrEqual(tolerance);
}

function expectRange(value: number, min: number, max: number) {
  expect(value).toBeGreaterThanOrEqual(min - 1);
  expect(value).toBeLessThanOrEqual(max + 1);
}

function parseCrmRequest(url: string, method: string): CrmRequest | null {
  const parsed = new URL(url);
  if (!parsed.pathname.startsWith("/crm/v")) return null;
  return { method, pathname: parsed.pathname, searchParams: parsed.searchParams };
}

function queryNameSet(params: URLSearchParams): Set<string> {
  return new Set(params.keys());
}

function matchesListDataSpec(request: CrmRequest, spec: ListDataRequestSpec): boolean {
  if (request.method !== spec.method) return false;
  if (!spec.path.test(request.pathname)) return false;
  const expected = spec.queryNames === null ? [] : [...spec.queryNames];
  const actual = [...queryNameSet(request.searchParams)].sort();
  const expectedSorted = [...expected].sort();
  return actual.length === expectedSorted.length && actual.every((k, i) => k === expectedSorted[i]);
}

function assertListDataRequests(requests: CrmRequest[]) {
  for (const request of requests) {
    expect(
      LIST_OPEN_DATA_REQUESTS.some((spec) => matchesListDataSpec(request, spec)),
      `Unexpected CRM data request: ${request.method} ${request.pathname}`,
    ).toBe(true);
  }
  for (const spec of LIST_OPEN_DATA_REQUESTS) {
    expect(
      requests.some((request) => matchesListDataSpec(request, spec)),
      `Expected at least one request for ${spec.method} ${spec.path}`,
    ).toBe(true);
  }
}

function isSettingsOrUsersRequest(request: CrmRequest): boolean {
  return (
    request.pathname.includes("/settings/") ||
    request.pathname.endsWith("/users") ||
    request.pathname.includes("/settings/custom_views")
  );
}

async function columnTexts(page: import("@playwright/test").Page, headerLabel: string) {
  const columnIndex = await page
    .locator("thead [data-part=column]")
    .evaluateAll(
      (nodes, label) => nodes.findIndex((node) => node.textContent?.trim().includes(label)),
      headerLabel,
    );
  if (columnIndex < 0) throw new Error(`${headerLabel} column not found.`);
  const rows = page.locator("tbody tr");
  const rowCount = await rows.count();
  const texts: string[] = [];
  for (let i = 0; i < rowCount; i++) {
    texts.push(await rows.nth(i).locator("[data-part=column]").nth(columnIndex).innerText());
  }
  return texts;
}

async function companyColumnTexts(page: import("@playwright/test").Page): Promise<string[]> {
  return columnTexts(page, "Company");
}

/** Text of the row link in the first record of the open page. */
function firstRowLinkText(page: import("@playwright/test").Page) {
  return page.locator("table tbody tr").first().getByRole("link").first().innerText();
}

/** Reads a token's authored value off the page, so no measurement is repeated as a literal. */
function tokenLength(page: import("@playwright/test").Page, name: string) {
  return page.evaluate((token) => {
    const probe = document.createElement("div");
    probe.style.position = "absolute";
    probe.style.width = `var(${token})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).width;
    probe.remove();
    return value;
  }, name);
}

function tokenFontLength(page: import("@playwright/test").Page, name: string) {
  return page.evaluate((token) => {
    const probe = document.createElement("span");
    probe.style.fontSize = `var(${token})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).fontSize;
    probe.remove();
    return value;
  }, name);
}

function tokenWeight(page: import("@playwright/test").Page, name: string) {
  return page.evaluate((token) => {
    const probe = document.createElement("span");
    probe.style.fontWeight = `var(${token})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).fontWeight;
    probe.remove();
    return value;
  }, name);
}

function tokenColor(page: import("@playwright/test").Page, name: string) {
  return page.evaluate((token) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${token})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, name);
}

function expectPx(actual: number, expected: string) {
  expect(Math.abs(actual - Number.parseFloat(expected))).toBeLessThanOrEqual(1);
}

async function boxWidth(locator: Locator) {
  return locator.evaluate((element) => element.getBoundingClientRect().width);
}

function isOrdered(values: readonly string[], direction: "asc" | "desc") {
  const normalized = values.map((value) => value.trim().toLowerCase());
  for (let i = 1; i < normalized.length; i++) {
    const previous = normalized[i - 1] ?? "";
    const current = normalized[i] ?? "";
    if (direction === "asc" && previous > current) return false;
    if (direction === "desc" && previous < current) return false;
  }
  return true;
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
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    const firstLinkOnPage1 = await firstRowLinkText(page);
    await expect(page.locator("table tbody tr")).toHaveCount(10);
    const next = page.getByLabel("Next");
    await expect(next).toBeEnabled();
    await next.click();
    await expect.poll(() => new URL(page.url()).searchParams.get("page")).toBe("2");
    const urlAfterNext = new URL(page.url());
    expect(urlAfterNext.searchParams.get("per_page")).toBe("10");
    await expect(page.locator("table tbody tr")).toHaveCount(10);
    // The rows of the previous page stay on screen while page 2 is requested, so the new
    // first record is awaited rather than read once.
    await expect.poll(() => firstRowLinkText(page)).not.toBe(firstLinkOnPage1);
    const firstLinkOnPage2 = await firstRowLinkText(page);
    expect(firstLinkOnPage2).not.toBe(firstLinkOnPage1);
    await page.getByLabel("Previous").click();
    await expect.poll(() => new URL(page.url()).searchParams.get("page")).toBeNull();
    const urlAfterPrevious = new URL(page.url());
    expect(urlAfterPrevious.searchParams.get("per_page")).toBe("10");
    await expect(page.locator("table tbody tr")).toHaveCount(10);
    await expect.poll(() => firstRowLinkText(page)).toBe(firstLinkOnPage1);
    const firstLinkBack = await firstRowLinkText(page);
    expect(firstLinkBack).toBe(firstLinkOnPage1);
  });

  test("applies sort to the address and reloads data", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    const beforeSort = await companyColumnTexts(page);
    const bulkUrls: string[] = [];
    page.on("request", (request) => {
      const parsed = parseCrmRequest(request.url(), request.method());
      if (parsed?.method === "POST" && parsed.pathname.endsWith("/Leads/bulk")) {
        bulkUrls.push(request.url());
      }
    });
    await page.getByRole("button", { name: "Sort", exact: true }).click();
    const sortBy = page.getByRole("button", { name: /Sort By/ });
    await sortBy.click();
    await page.getByRole("option", { name: "Company" }).click();
    await page.getByRole("button", { name: "Apply" }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get("sort_by")).toBe("Company");
    await expect.poll(() => new URL(page.url()).searchParams.get("sort_order")).toBe("asc");
    const afterSort = await companyColumnTexts(page);
    const normalized = afterSort.map((text) => text.trim().toLowerCase());
    for (let i = 1; i < normalized.length; i++) {
      const previous = normalized[i - 1] ?? "";
      const current = normalized[i] ?? "";
      expect(previous <= current).toBe(true);
    }
    expect(afterSort.join("|")).not.toBe(beforeSort.join("|"));
    const lastBulk = bulkUrls.at(-1);
    if (!lastBulk) throw new Error("Expected a bulk request after sort.");
    const bulkParams = new URL(lastBulk).searchParams;
    expect(bulkParams.get("sort_by")).toBe("Company");
    expect(bulkParams.get("sort_order")).toBe("asc");
  });

  test("sorts the list from the column header options menu", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(`${moduleListDefaultPath(org.slug, LEADS_MODULE)}?per_page=10&page=2`);
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();

    const nameTrigger = page.getByRole("button", { name: "Full Name column options" });
    const companyTrigger = page.getByRole("button", { name: "Company column options" });
    await expect(nameTrigger).toHaveCSS("opacity", "1");
    await expect(companyTrigger).toHaveCSS("opacity", "0");
    await page.getByRole("columnheader", { name: "Company" }).hover();
    await expect(companyTrigger).toHaveCSS("opacity", "1");

    const bulkUrls: string[] = [];
    page.on("request", (request) => {
      const parsed = parseCrmRequest(request.url(), request.method());
      if (parsed?.method === "POST" && parsed.pathname.endsWith("/Leads/bulk")) {
        bulkUrls.push(request.url());
      }
    });

    await companyTrigger.click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem")).toHaveCount(2);
    expect((await menu.getByRole("menuitem").allTextContents()).map((text) => text.trim())).toEqual(
      ["Asc", "Desc"],
    );
    await menu.getByRole("menuitem", { name: "Desc" }).click();
    await expect(menu).toHaveCount(0);

    const afterDesc = () => new URL(page.url()).searchParams;
    await expect.poll(() => afterDesc().get("sort_by")).toBe("Company");
    expect(afterDesc().get("sort_order")).toBe("desc");
    expect(afterDesc().get("page")).toBeNull();
    await expect(page.locator("tbody tr")).toHaveCount(10);
    expect(isOrdered(await companyColumnTexts(page), "desc")).toBe(true);
    const lastBulk = bulkUrls.at(-1);
    if (!lastBulk) throw new Error("Expected a bulk request after the header sort.");
    const bulkParams = new URL(lastBulk).searchParams;
    expect(bulkParams.get("sort_by")).toBe("Company");
    expect(bulkParams.get("sort_order")).toBe("desc");

    await nameTrigger.click();
    await page.getByRole("menu").getByRole("menuitem", { name: "Asc" }).click();
    await expect(page.getByRole("menu")).toHaveCount(0);
    const afterAsc = () => new URL(page.url()).searchParams;
    await expect.poll(() => afterAsc().get("sort_by")).toBe("Full_Name");
    expect(afterAsc().get("sort_order")).toBe("asc");
    await expect
      .poll(async () => isOrdered(await columnTexts(page, "Full Name"), "asc"))
      .toBe(true);
  });

  test("column options menu matches the measured visual layout", async ({ page }) => {
    // list-views.md › Layout › Visual layout › Column options menu and Table header and rows.
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(`${moduleListDefaultPath(org.slug, LEADS_MODULE)}?per_page=10&page=1`);
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();

    const menuWidth = await tokenLength(page, "--size-popover-column-options-width");
    const rowHeight = await tokenLength(page, "--size-menu-item-height");
    const iconSize = await tokenLength(page, "--size-menu-icon");
    const cellInset = await tokenLength(page, "--size-list-cell-inset");
    const headerHeight = await tokenLength(page, "--size-list-header-height");
    const columnWidth = await tokenLength(page, "--size-list-column-width");
    const borderInk = await tokenColor(page, "--color-border");
    const surface = await tokenColor(page, "--color-menu-surface");
    const hoverInk = await tokenColor(page, "--color-surface-hover");
    const textInk = await tokenColor(page, "--color-text");
    const iconInk = await tokenColor(page, "--color-menu-icon");
    const menuText = await tokenFontLength(page, "--text-md");
    const menuWeight = await tokenWeight(page, "--font-weight-normal");
    const radius = await tokenLength(page, "--radius-md");

    const headerCell = page.getByRole("columnheader", { name: "Company" });
    const trigger = page.getByRole("button", { name: "Company column options" });
    await headerCell.hover();
    await trigger.click();

    const menu = page.getByRole("menu");
    // The visible menu box is the popover that holds the list of rows.
    const menuSurface = menu.locator("xpath=..");
    await expect(menu).toBeVisible();
    const menuBox = requireBox(await menuSurface.boundingBox(), "column options menu");
    expectPx(menuBox.width, menuWidth);
    await expect(menuSurface).toHaveCSS("border-top-width", "1px");
    await expect(menuSurface).toHaveCSS("border-top-color", borderInk);
    await expect(menuSurface).toHaveCSS("background-color", surface);
    // The spec row does not measure corners; the shared popover radius is kept.
    await expect(menuSurface).toHaveCSS("border-radius", radius);

    const item = menu.getByRole("menuitem", { name: "Asc" });
    const itemBox = requireBox(await item.boundingBox(), "Asc row");
    expectPx(itemBox.height, rowHeight);
    await expect(item).toHaveCSS("font-size", menuText);
    await expect(item).toHaveCSS("font-weight", menuWeight);
    await expect(item).toHaveCSS("color", textInk);
    const glyph = item.locator("svg");
    await expect(glyph).toHaveCSS("color", iconInk);
    expectPx(await boxWidth(glyph), iconSize);
    await item.hover();
    await expect(item).toHaveCSS("background-color", hoverInk);

    // The trigger sits at the header cell's trailing end, before its divider, and keeps
    // the header box and the column width exactly as they were.
    const triggerBox = requireBox(await trigger.boundingBox(), "column options trigger");
    const headerBox = requireBox(await headerCell.boundingBox(), "Company header");
    expectPx(headerBox.x + headerBox.width - (triggerBox.x + triggerBox.width), cellInset);
    expectPx(headerBox.height, headerHeight);
    expectPx(headerBox.width, columnWidth);

    await expectNoA11yViolations(page);
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

  test("shows not found for an unknown custom view", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListCustomPath(org.slug, LEADS_MODULE, "missing-view"));
    await expect(page.getByText(/could not be found/i)).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    ignoreFailedResponses(pageErrors, [404]);
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

  test("organizations isolate list data and record access", async ({ page, browser }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    const recordHref = await page
      .locator("table tbody tr")
      .first()
      .getByRole("link")
      .first()
      .getAttribute("href");
    if (!recordHref) throw new Error("Expected a record link href.");
    const recordIdMatch = recordHref.match(/\/Leads\/([^/?#]+)/);
    if (!recordIdMatch) throw new Error("Expected record id in href.");
    const recordId = recordIdMatch[1];
    const memberResponse = await page.request.get(`/crm/v2.2/Leads/${recordId}`, {
      headers: { "X-CRM-ORG": org.slug },
    });
    expect(memberResponse.status()).toBe(200);

    const context = await browser.newContext();
    const outsider = await context.newPage();
    try {
      await signUpNewUser(outsider);
      const outsiderResponse = await outsider.request.get(`/crm/v2.2/Leads/${recordId}`, {
        headers: { "X-CRM-ORG": org.slug },
      });
      expect(outsiderResponse.status()).toBe(404);
      await outsider.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
      await expect(outsider.getByRole("heading", { name: "404 - Not Found" })).toBeVisible();
      await expect(outsider.getByRole("table")).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test("refresh re-requests bulk and count for the same address", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    let serveEmptyBulk = false;
    await page.route("**/crm/v2.2/Leads/bulk**", async (route) => {
      if (!serveEmptyBulk) {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          info: {
            page: 1,
            per_page: 30,
            count: 0,
            more_records: false,
            sort_by: "id",
            sort_order: "desc",
          },
        }),
      });
    });
    await page.route("**/crm/v2.2/Leads/actions/count**", async (route) => {
      if (!serveEmptyBulk) {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ count: 0 }),
      });
    });
    const initialBulkQuery = { current: "" };
    page.on("request", (request) => {
      const parsed = parseCrmRequest(request.url(), request.method());
      if (parsed?.method === "POST" && parsed.pathname.endsWith("/Leads/bulk")) {
        initialBulkQuery.current = new URL(request.url()).searchParams.toString();
      }
    });
    const urlBefore = moduleListDefaultPath(org.slug, LEADS_MODULE);
    await page.goto(urlBefore);
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    const refreshSeen: CrmRequest[] = [];
    const onRefreshRequest = (request: import("@playwright/test").Request) => {
      const parsed = parseCrmRequest(request.url(), request.method());
      if (parsed) refreshSeen.push(parsed);
    };
    serveEmptyBulk = true;
    page.on("request", onRefreshRequest);
    await page.getByRole("button", { name: "Refresh Custom View" }).click();
    await expect(page.getByText(/No Leads found\./)).toBeVisible();
    page.off("request", onRefreshRequest);
    const afterRefresh = new URL(page.url());
    const beforeRefresh = new URL(urlBefore, afterRefresh.origin);
    expect(afterRefresh.pathname).toBe(beforeRefresh.pathname);
    expect(afterRefresh.search).toBe(beforeRefresh.search);
    const bulkRefresh = refreshSeen.filter(
      (item) => item.method === "POST" && item.pathname.endsWith("/Leads/bulk"),
    );
    const countRefresh = refreshSeen.filter(
      (item) => item.method === "POST" && item.pathname.endsWith("/actions/count"),
    );
    expect(bulkRefresh).toHaveLength(1);
    expect(countRefresh).toHaveLength(1);
    const refreshedBulk = bulkRefresh[0];
    if (!refreshedBulk) throw new Error("Expected bulk refresh request.");
    expect(refreshedBulk.searchParams.toString()).toBe(initialBulkQuery.current);
    expect(refreshSeen.some((item) => isSettingsOrUsersRequest(item))).toBe(false);
  });

  test("records ADR list data requests only", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const seen: CrmRequest[] = [];
    page.on("request", (request) => {
      const parsed = parseCrmRequest(request.url(), request.method());
      if (parsed) seen.push(parsed);
    });
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    assertListDataRequests(seen);
    const countBeforeNext = seen.length;
    const next = page.getByLabel("Next");
    await expect(next).toBeEnabled();
    // Navigation updates the URL before the asynchronous bulk request completes.
    const pageTwoResponse = page.waitForResponse((response) => {
      const request = parseCrmRequest(response.url(), response.request().method());
      return (
        request?.method === "POST" &&
        request.pathname.endsWith("/Leads/bulk") &&
        request.searchParams.get("page") === "2"
      );
    });
    await next.click();
    expect((await pageTwoResponse).ok()).toBe(true);
    await expect.poll(() => new URL(page.url()).searchParams.get("page")).toBe("2");
    const afterNext = seen.slice(countBeforeNext);
    expect(afterNext.length).toBeGreaterThan(0);
    for (const request of afterNext) {
      expect(request.method).toBe("POST");
      expect(request.pathname.endsWith("/Leads/bulk")).toBe(true);
      expect(request.searchParams.get("page")).toBe("2");
    }
    expect(afterNext.some((item) => isSettingsOrUsersRequest(item))).toBe(false);
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
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      document.querySelector("main")?.scrollTo(0, 0);
    });
    await page.evaluate(() => document.fonts.ready);
    const listPage = page.locator(".module-list-page");
    await expect(listPage).toBeVisible();
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    await expect(listPage.locator("[data-part=row]")).toHaveCount(10);
    const footer = listPage.locator("[data-part=footer]");
    await expect(footer).toBeVisible();
    await expect(listPage).toHaveCSS("background-color", "rgb(238, 241, 249)");

    const pill = listPage.locator("[data-view-pill]");
    const pillBox = requireBox(await pill.boundingBox(), "view pill");
    expectRange(pillBox.x, 332, 332);
    expectEdge(pillBox.y, 57.5);
    expectEdge(pillBox.y + pillBox.height, 83.5);
    expect(Math.abs(pillBox.height - 26)).toBeLessThanOrEqual(1);
    await expect(pill).toHaveCSS("border-radius", "6px");

    const createLead = listPage.getByRole("link", { name: "Create Lead" });
    const createBox = requireBox(await createLead.boundingBox(), "Create Lead");
    expectEdge(createBox.y, 99);
    expectEdge(createBox.y + createBox.height, 132);

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
    expectEdge(headerBox.y, 154);
    expectEdge(headerBox.y + headerBox.height, 191);

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
    expectEdge(checkboxBox.x, 623);
    expectEdge(checkboxBox.x + checkboxBox.width, 638);

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

    const footerBox = requireBox(await footer.boundingBox(), "footer");
    expectEdge(footerBox.y, 760);
    expectEdge(footerBox.y + footerBox.height, 793);
    expect(Math.abs(footerBox.height - 33)).toBeLessThanOrEqual(1);

    expect(Math.abs(1470 - (cardBox.x + cardBox.width) - 16)).toBeLessThanOrEqual(1);
  });
});
