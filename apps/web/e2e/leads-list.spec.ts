import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleListCustomPath, moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";
import { expectType } from "./support/typography";

/** Decorative owner avatar in RecordChoice rows (aria-hidden); known open question on img-alt. */
const OWNER_OPTION_AVATAR_A11Y_EXCLUDE = [
  ".record-owner-row > span[aria-hidden].rounded-full",
] as const;

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

function px(value: string) {
  return Number.parseFloat(value);
}

async function listColumnIndex(
  listPage: import("@playwright/test").Locator,
  headerLabel: string,
): Promise<number> {
  const labels = listPage.locator('th[data-part="column"] [data-part="header-label"]');
  const count = await labels.count();
  for (let index = 0; index < count; index += 1) {
    if ((await labels.nth(index).innerText()) === headerLabel) return index;
  }
  throw new Error(`Column not found: ${headerLabel}`);
}

async function rowColumnValue(
  row: import("@playwright/test").Locator,
  columnIndex: number,
): Promise<string> {
  return row
    .locator("td[data-part=column]")
    .nth(columnIndex)
    .locator("[data-part=value]")
    .innerText();
}

async function tokenLength(page: import("@playwright/test").Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.width = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).width;
    probe.remove();
    return value;
  }, token);
}

async function tokenColor(page: import("@playwright/test").Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, token);
}

async function sampleBackdropFromOverlayToken(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const overlay = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-overlay")
      .trim();
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Expected canvas context.");
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = overlay;
    context.globalAlpha = 0.5;
    context.fillRect(0, 0, 1, 1);
    const pixels = context.getImageData(0, 0, 1, 1).data;
    return {
      red: pixels[0] ?? 0,
      green: pixels[1] ?? 0,
      blue: pixels[2] ?? 0,
      alpha: pixels[3] ?? 0,
    };
  });
}

async function sampleComputedBackground(page: import("@playwright/test").Page, css: string) {
  return page.evaluate((background) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = background;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Expected canvas context.");
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const pixels = context.getImageData(0, 0, 1, 1).data;
    return {
      red: pixels[0] ?? 0,
      green: pixels[1] ?? 0,
      blue: pixels[2] ?? 0,
      alpha: pixels[3] ?? 0,
    };
  }, css);
}

function expectRgbaClose(
  actual: { red: number; green: number; blue: number; alpha: number },
  expected: { red: number; green: number; blue: number; alpha: number },
) {
  for (const channel of ["red", "green", "blue", "alpha"] as const) {
    expect(Math.abs(actual[channel] - expected[channel])).toBeLessThanOrEqual(2);
  }
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

async function openFilterRow(
  page: import("@playwright/test").Page,
  panel: import("@playwright/test").Locator,
  label: string,
) {
  const checkbox = panel.getByRole("checkbox", { name: label, exact: true });
  const operator = panel.getByRole("button", { name: new RegExp(`${label} operator`) });
  if (await operator.count()) return;
  await checkbox.scrollIntoViewIfNeeded();
  await checkbox.focus();
  await page.keyboard.press("Space");
  if ((await operator.count()) === 0) {
    await page.keyboard.press("Space");
  }
  await expect(operator).toBeVisible();
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

async function sizeToken(page: import("@playwright/test").Page, token: string): Promise<number> {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.height = `var(${name})`;
    document.body.append(probe);
    const value = parseFloat(getComputedStyle(probe).height);
    probe.remove();
    return value;
  }, token);
}

async function companyColumnTexts(page: import("@playwright/test").Page): Promise<string[]> {
  const companyIndex = await page
    .locator("thead [data-part=column]")
    .evaluateAll((nodes) =>
      nodes.findIndex((node) => node.textContent?.trim().includes("Company")),
    );
  if (companyIndex < 0) throw new Error("Company column not found.");
  const rows = page.locator("tbody tr");
  const rowCount = await rows.count();
  const texts: string[] = [];
  for (let i = 0; i < rowCount; i++) {
    texts.push(await rows.nth(i).locator("[data-part=column]").nth(companyIndex).innerText());
  }
  return texts;
}

async function recordIdsInTable(page: import("@playwright/test").Page): Promise<string[]> {
  return page.locator("table tbody tr").evaluateAll((rows) => {
    const ids: string[] = [];
    for (const row of rows) {
      const link = row.querySelector("a[href*='/Leads/']");
      const href = link?.getAttribute("href");
      const match = href?.match(/\/Leads\/([^/?#]+)/);
      if (match?.[1]) ids.push(match[1]);
    }
    return ids;
  });
}

type UnfilteredLeadRow = {
  id: string;
  Company: string | null;
  Lead_Source: string | null;
  Created_Time: string | null;
};

function captureNextBulkSearchParams(page: import("@playwright/test").Page) {
  return page
    .waitForRequest((request) => {
      const parsed = parseCrmRequest(request.url(), request.method());
      return parsed?.method === "POST" && parsed.pathname.endsWith("/Leads/bulk");
    })
    .then((request) => new URL(request.url()).searchParams);
}

function isCreatedOnUtcToday(createdTime: string | null, now: Date): boolean {
  if (!createdTime) return false;
  const parsed = Date.parse(createdTime);
  if (Number.isNaN(parsed)) return false;
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return parsed >= start && parsed < start + 86_400_000;
}

function firstPageFilterExpectations(
  rows: readonly UnfilteredLeadRow[],
  perPage: number,
  predicate: (row: UnfilteredLeadRow) => boolean,
): { ids: string[]; total: number } {
  const matching = rows.filter(predicate);
  return {
    ids: matching.slice(0, perPage).map((row) => row.id),
    total: matching.length,
  };
}

async function fetchUnfilteredLeadCatalog(
  page: import("@playwright/test").Page,
  orgSlug: string,
  bulkSearchParams: URLSearchParams,
): Promise<UnfilteredLeadRow[]> {
  const bulkParams = new URLSearchParams(bulkSearchParams);
  const cvid = bulkParams.get("cvid");
  if (!cvid) throw new Error("Expected cvid on bulk request.");
  const perPage = bulkParams.get("per_page") ?? "30";
  bulkParams.set("per_page", perPage);
  const existingFields = bulkParams.get("fields")?.split(",").filter(Boolean) ?? [];
  const fields = [...new Set([...existingFields, "Company", "Lead_Source", "Created_Time"])];
  bulkParams.set("fields", fields.join(","));
  bulkParams.delete("page");
  return page.evaluate(
    async ({ org, bulkQueryBase }) => {
      const headers = {
        "Content-Type": "application/json",
        "X-CRM-ORG": org,
      };
      const rows: UnfilteredLeadRow[] = [];
      let pageNumber = 1;
      for (;;) {
        const bulkQuery = new URLSearchParams(bulkQueryBase);
        bulkQuery.set("page", String(pageNumber));
        const bulkResponse = await fetch(`/crm/v2.2/Leads/bulk?${bulkQuery}`, {
          method: "POST",
          headers,
          body: JSON.stringify({}),
        });
        if (!bulkResponse.ok) {
          throw new Error(`bulk ${bulkResponse.status}: ${await bulkResponse.text()}`);
        }
        const text = await bulkResponse.text();
        if (!text) break;
        const bulkJson = JSON.parse(text) as {
          data?: {
            id: string;
            Company?: string | null;
            Lead_Source?: string | null;
            Created_Time?: string | null;
          }[];
          info?: { more_records?: boolean };
        };
        for (const row of bulkJson.data ?? []) {
          rows.push({
            id: row.id,
            Company: row.Company ?? null,
            Lead_Source: row.Lead_Source ?? null,
            Created_Time: row.Created_Time ?? null,
          });
        }
        if (!bulkJson.info?.more_records) break;
        pageNumber += 1;
      }
      return rows;
    },
    { org: orgSlug, bulkQueryBase: bulkParams.toString() },
  );
}

async function expectFilterResultsInDom(
  page: import("@playwright/test").Page,
  expectations: { ids: string[]; total: number },
) {
  await expect.poll(async () => recordIdsInTable(page)).toEqual(expectations.ids);
  await expect(page.locator("[data-part=total-value]")).toHaveText(String(expectations.total));
  expect(expectations.ids.length).toBeLessThanOrEqual(expectations.total);
}

async function waitForFilteredListResponses(page: import("@playwright/test").Page) {
  return Promise.all([
    page.waitForResponse(
      (response) =>
        parseCrmRequest(response.url(), response.request().method())?.pathname.endsWith(
          "/Leads/bulk",
        ) ?? false,
    ),
    page.waitForResponse(
      (response) =>
        parseCrmRequest(response.url(), response.request().method())?.pathname.endsWith(
          "/Leads/actions/count",
        ) ?? false,
    ),
  ]);
}

async function selectPicklistValues(
  page: import("@playwright/test").Page,
  panel: import("@playwright/test").Locator,
  fieldLabel: string,
  values: readonly string[],
) {
  await panel.getByRole("button", { name: new RegExp(`${fieldLabel} value$`) }).click();
  for (const value of values) {
    await page.getByRole("option", { name: value, exact: true }).click();
  }
  await page.keyboard.press("Escape");
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
    const firstLink = page.locator("table tbody tr").first().getByRole("link").first();
    const firstLinkOnPage1 = await firstLink.innerText();
    await expect(page.locator("table tbody tr")).toHaveCount(10);
    const next = page.getByLabel("Next");
    await expect(next).toBeEnabled();
    await next.click();
    await expect.poll(() => new URL(page.url()).searchParams.get("page")).toBe("2");
    const urlAfterNext = new URL(page.url());
    expect(urlAfterNext.searchParams.get("per_page")).toBe("10");
    await expect(page.locator("table tbody tr")).toHaveCount(10);
    // The list keeps the previous page's rows on screen while the next page loads, so
    // the row count alone never proves the swap. Wait for the content, then read it.
    await expect.poll(() => firstLink.innerText()).not.toBe(firstLinkOnPage1);
    const firstLinkOnPage2 = await firstLink.innerText();
    expect(firstLinkOnPage2).not.toBe(firstLinkOnPage1);
    await page.getByLabel("Previous").click();
    await expect.poll(() => new URL(page.url()).searchParams.get("page")).toBeNull();
    const urlAfterPrevious = new URL(page.url());
    expect(urlAfterPrevious.searchParams.get("per_page")).toBe("10");
    await expect(page.locator("table tbody tr")).toHaveCount(10);
    await expect.poll(() => firstLink.innerText()).toBe(firstLinkOnPage1);
    const firstLinkBack = await firstLink.innerText();
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
    await page.getByRole("textbox", { name: "Search fields" }).fill("Company");
    await page.getByRole("option", { name: "Company", exact: true }).click();
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
    // The applied field stays marked when the list is opened again.
    await page.getByRole("button", { name: "Sort", exact: true }).click();
    await sortBy.click();
    await expect(page.getByRole("option", { name: "Company", exact: true })).toHaveAttribute(
      "data-selected",
      "true",
    );
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Cancel" }).click();
    await expectNoA11yViolations(page);
  });

  test("Sort By field dropdown matches the measured panel, rows and colours", async ({
    page,
  }, testInfo) => {
    // list-views.md › Layout › Visual layout › Sort popover and Sort By field dropdown,
    // both measured on a 1470 × 835 viewport. Coordinates and colours are the spec's literal
    // values, so a token or an anchor that drifts away from them fails here. Text size and
    // weight stay read from tokens (typography.md mapping).
    const spec = {
      /** "Outer box x 412.5–797.5, y 138–296" */
      dialog: { x1: 412.5, y1: 138, x2: 797.5, y2: 296 },
      /** "Both selectors sit at y 195–223: the first at x 443.5–593.5" */
      selector: { x1: 443.5, y1: 195, x2: 593.5, y2: 223 },
      /** "380 × 268 px popover (… x 443–823, y 222–490)" */
      panel: { x1: 443, y1: 222, x2: 823, y2: 490 },
      /** "scrollable list body 378 × 220 px (y 268–488)"; x is the panel inset by its border. */
      list: { x1: 444, y1: 268, x2: 822, y2: 488 },
      /** "white #FFFFFF surface, 1 px #CED0E1 border" */
      surface: "rgb(255, 255, 255)",
      border: "rgb(206, 208, 225)",
      /** "option rows with text #313949, hover/selection fill #F0F4FC" */
      ink: "rgb(49, 57, 73)",
      fill: "rgb(240, 244, 252)",
    };
    const edges = (box: ElementBox) => ({
      x: box.x,
      y: box.y,
      x2: box.x + box.width,
      y2: box.y + box.height,
      width: box.width,
      height: box.height,
    });
    const offsets = (
      box: ElementBox,
      target: { x1: number; y1: number; x2: number; y2: number },
    ) => ({
      x: Math.round((box.x - target.x1) * 100) / 100,
      y: Math.round((box.y - target.y1) * 100) / 100,
      right: Math.round((box.x + box.width - target.x2) * 100) / 100,
      bottom: Math.round((box.y + box.height - target.y2) * 100) / 100,
    });
    const expectSpecBox = (box: ElementBox, target: typeof spec.dialog) => {
      expectEdge(box.x, target.x1);
      expectEdge(box.y, target.y1);
      expectEdge(box.x + box.width, target.x2);
      expectEdge(box.y + box.height, target.y2);
    };

    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    await page.getByRole("button", { name: "Sort", exact: true }).click();
    const dialog = page.locator(".record-sort-popover");
    const dialogBox = requireBox(await dialog.boundingBox(), "Sort dialog");
    expectSpecBox(dialogBox, spec.dialog);
    expectEdge(dialogBox.width, 385);
    expectEdge(dialogBox.height, 157);
    const sortBy = page.getByRole("button", { name: /Sort By/ });
    const selectorBox = requireBox(await sortBy.boundingBox(), "Sort By selector");
    expectSpecBox(selectorBox, spec.selector);

    await sortBy.click();
    const dropdown = page.locator(".record-sort-field-dropdown");
    const dropdownBox = requireBox(await dropdown.boundingBox(), "Sort By dropdown");
    expectSpecBox(dropdownBox, spec.panel);
    expectEdge(dropdownBox.width, 380);
    expectEdge(dropdownBox.height, 268);
    await expect(dropdown).toHaveCSS("border-top-width", "1px");
    await expect(dropdown).toHaveCSS("border-top-color", spec.border);
    await expect(dropdown).toHaveCSS("background-color", spec.surface);
    // The panel is left-aligned with the selector and covers its bottom border by 1 px.
    expectEdge(dropdownBox.x, selectorBox.x);
    expectEdge(dropdownBox.y, selectorBox.y + selectorBox.height - 1);

    const list = page.getByRole("listbox", { name: "Sort By options" });
    const listBox = requireBox(await list.boundingBox(), "Sort By list body");
    expectSpecBox(listBox, spec.list);
    expectEdge(listBox.width, 378);
    expectEdge(listBox.height, 220);

    const search = page.getByRole("textbox", { name: "Search fields" });
    const searchBox = requireBox(await search.boundingBox(), "Sort By search input");
    // Interim: the spec measures the band, not the input. The band is the 46 px between the
    // panel top and the list top minus the panel border; the input keeps the filter search
    // height token and fills the band's content box, so it is centred in the remaining slack.
    const band = page.locator(".record-sort-field-search");
    const bandBox = requireBox(await band.boundingBox(), "Sort By search band");
    const bandPadding = await band.evaluate((node) => {
      const computed = getComputedStyle(node);
      return {
        left: parseFloat(computed.paddingLeft),
        right: parseFloat(computed.paddingRight),
      };
    });
    expectEdge(bandBox.height, 45);
    expectEdge(bandBox.y, dropdownBox.y + 1);
    expectEdge(listBox.y, bandBox.y + bandBox.height);
    expectEdge(searchBox.height, await sizeToken(page, "--size-list-filter-search-height"));
    expectEdge(searchBox.x, bandBox.x + bandPadding.left);
    expectEdge(searchBox.x + searchBox.width, bandBox.x + bandBox.width - bandPadding.right);
    expect(searchBox.y).toBeGreaterThan(dropdownBox.y);
    expect(searchBox.y + searchBox.height).toBeLessThanOrEqual(listBox.y + 1);

    // None is the first option, then the module's fields in the configured order.
    const options = list.getByRole("option");
    await expect(options).toHaveCount(40);
    await expect(options.first()).toHaveText("None");
    await expect(options.nth(1)).toHaveText("Address - City");
    await expect(options.nth(2)).toHaveText("Address - Country / Region");
    await expect(options.nth(22)).toHaveText("Lead Name");
    await expect(options.last()).toHaveText("Website");
    const company = options.filter({ hasText: "Company" }).first();
    await expect(company).toHaveCSS("color", spec.ink);
    // Nearest role in typography.md › List and detail text roles: the searchable option row
    // is drawn with the same regular size and weight as the filter operator list.
    await expectType(page, company, "--text-sm", "--font-weight-normal");
    await company.hover();
    await expect(company).toHaveCSS("background-color", spec.fill);

    const firstOptionBox = requireBox(await options.first().boundingBox(), "Sort By option row");
    const optionStyle = await options.first().evaluate((node) => {
      const computed = getComputedStyle(node);
      return {
        color: computed.color,
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        paddingTop: computed.paddingTop,
        paddingLeft: computed.paddingLeft,
      };
    });
    const measurements = {
      viewport: { width: 1470, height: 835 },
      spec: "list-views.md › Layout › Visual layout › Sort popover / Sort By field dropdown",
      specBoxes: spec,
      dialog: { actual: edges(dialogBox), offsetFromSpec: offsets(dialogBox, spec.dialog) },
      selector: { actual: edges(selectorBox), offsetFromSpec: offsets(selectorBox, spec.selector) },
      panel: { actual: edges(dropdownBox), offsetFromSpec: offsets(dropdownBox, spec.panel) },
      listBody: { actual: edges(listBox), offsetFromSpec: offsets(listBox, spec.list) },
      panelBorderWidth: "1px",
      panelBorderColor: await dropdown.evaluate((node) => getComputedStyle(node).borderTopColor),
      panelSurface: await dropdown.evaluate((node) => getComputedStyle(node).backgroundColor),
      searchInput: searchBox,
      searchBand: { box: bandBox, paddingInline: bandPadding, interim: true },
      optionRowHeight: firstOptionBox.height,
      optionRowCount: await options.count(),
      optionText: optionStyle,
      hoveredRowFill: await company.evaluate((node) => getComputedStyle(node).backgroundColor),
      labels: await options.allInnerTexts(),
    };
    console.log(`SORT_FIELD_DROPDOWN_MEASUREMENTS ${JSON.stringify(measurements)}`);
    await testInfo.attach("sort-field-dropdown-measurements", {
      body: JSON.stringify(measurements, null, 2),
      contentType: "application/json",
    });
    await page.screenshot({ path: testInfo.outputPath("sort-field-dropdown.png"), fullPage: true });

    await company.click();
    await sortBy.click();
    await expect(page.getByRole("option", { name: "Company", exact: true })).toHaveCSS(
      "background-color",
      spec.fill,
    );
    await expect(page.getByRole("option", { name: "Company", exact: true })).toHaveAttribute(
      "data-selected",
      "true",
    );
    await expectType(page, company, "--text-sm", "--font-weight-normal");

    // The search filters labels case-insensitively and an empty match leaves the list empty.
    await search.fill("wEbs");
    await expect(options).toHaveCount(1);
    await expect(options.first()).toHaveText("Website");
    await search.fill("nothing");
    await expect(options).toHaveCount(0);

    // None keeps Apply disabled.
    await search.fill("");
    await options.first().click();
    await expect(page.getByRole("button", { name: "Apply" })).toBeDisabled();
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

  test("bulk delete from the selection bar", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(`${moduleListDefaultPath(org.slug, LEADS_MODULE)}?per_page=10`);
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    const totalValue = page.locator("[data-part=total-value]");
    await expect(totalValue).toBeVisible();
    const totalBefore = Number(await totalValue.innerText());
    const firstRow = page.locator("table tbody tr").nth(0);
    const secondRow = page.locator("table tbody tr").nth(1);
    const deletedLabels = [
      await firstRow.getByRole("link").first().innerText(),
      await secondRow.getByRole("link").first().innerText(),
    ];
    const rowChecks = page.getByRole("checkbox", { name: /Select / });
    const deletedIds: string[] = [];
    await rowChecks.nth(1).check({ force: true });
    await rowChecks.nth(2).check({ force: true });
    await expect(page.getByText("2 Records Selected.")).toBeVisible();
    await expectNoA11yViolations(page);
    await expect(page.getByRole("button", { name: "Filter", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expectNoA11yViolations(page);
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByText("2 Records Selected.")).toBeVisible();
    const deleteDone = page.waitForResponse(async (response) => {
      if (response.request().method() !== "POST") return false;
      if (!response.url().includes("/actions/mass_delete")) return false;
      const body = response.request().postDataJSON() as { ids?: string[] } | null;
      deletedIds.length = 0;
      deletedIds.push(...(body?.ids ?? []));
      return response.ok();
    });
    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await deleteDone;
    expect(deletedIds).toHaveLength(2);
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByText(/Records Selected/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Filter", exact: true })).toBeVisible();
    for (const label of deletedLabels) {
      await expect(page.getByRole("link", { name: label })).toHaveCount(0);
    }
    await expect.poll(async () => Number(await totalValue.innerText())).toBe(totalBefore - 2);
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
    const bulkResponse = await pageTwoResponse;
    expect(bulkResponse.ok()).toBe(true);
    await expect.poll(() => new URL(page.url()).searchParams.get("page")).toBe("2");
    const page2Request = parseCrmRequest(bulkResponse.url(), bulkResponse.request().method());
    expect(page2Request).not.toBeNull();
    if (!page2Request) throw new Error("Expected page-2 bulk request.");
    expect(page2Request.method).toBe("POST");
    expect(page2Request.pathname.endsWith("/Leads/bulk")).toBe(true);
    expect(page2Request.searchParams.get("page")).toBe("2");
    expect(isSettingsOrUsersRequest(page2Request)).toBe(false);
  });

  test("meets accessibility rules on the populated list", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("applies field filters to list data and count requests", async ({ page }) => {
    test.setTimeout(180_000);
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const bulkSearchParamsPromise = captureNextBulkSearchParams(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    const bulkSearchParams = await bulkSearchParamsPromise;
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    const baselineIds = await recordIdsInTable(page);
    const initialRows = await page.locator("table tbody tr").count();
    const initialTotal = await page.locator("[data-part=total-value]").innerText();
    const perPage = Number(bulkSearchParams.get("per_page") ?? "30");
    const unfilteredCatalog = await fetchUnfilteredLeadCatalog(page, org.slug, bulkSearchParams);
    const sampleCompany = (
      await page.locator("table tbody tr").first().locator("[data-part=column]").nth(1).innerText()
    ).trim();
    if (!sampleCompany) throw new Error("Expected a company value.");

    const panel = page.getByRole("region", { name: "Filter Leads by" });
    const companyRow = panel.getByRole("checkbox", { name: "Company", exact: true });
    await companyRow.scrollIntoViewIfNeeded();
    await expect(companyRow).toBeEnabled({ timeout: 30_000 });
    await openFilterRow(page, panel, "Company");
    await panel.getByRole("textbox", { name: "Company value" }).fill(sampleCompany);
    let lastBulkBody: unknown;
    let lastCountBody: unknown;
    page.on("request", (request) => {
      const parsed = parseCrmRequest(request.url(), request.method());
      if (parsed?.method !== "POST") return;
      if (parsed.pathname.endsWith("/Leads/bulk")) {
        lastBulkBody = request.postDataJSON();
      }
      if (parsed.pathname.endsWith("/Leads/actions/count")) {
        lastCountBody = request.postDataJSON();
      }
    });
    const companyNeedle = sampleCompany.toLowerCase();
    const companyExpectations = firstPageFilterExpectations(
      unfilteredCatalog,
      perPage,
      (row) => typeof row.Company === "string" && row.Company.toLowerCase().includes(companyNeedle),
    );
    const companyResponses = waitForFilteredListResponses(page);
    await panel.getByRole("button", { name: "Apply Filter" }).click();
    const [companyBulk, companyCount] = await companyResponses;
    expect(companyBulk.ok()).toBe(true);
    expect(companyCount.ok()).toBe(true);
    await expectFilterResultsInDom(page, companyExpectations);
    const filteredRows = await page.locator("table tbody tr").count();
    expect(filteredRows).toBeGreaterThan(0);
    expect(filteredRows).toBeLessThan(initialRows);
    const companyTexts = await companyColumnTexts(page);
    for (const text of companyTexts) {
      expect(text.toLowerCase()).toContain(sampleCompany.toLowerCase());
    }
    expect(lastBulkBody).toEqual(
      expect.objectContaining({
        filters: {
          field: { api_name: "Company" },
          comparator: "contains",
          value: sampleCompany,
        },
      }),
    );
    expect(lastCountBody).toEqual(lastBulkBody);

    await panel.getByRole("button", { name: "Clear" }).click();
    await expect.poll(async () => recordIdsInTable(page)).toEqual(baselineIds);
    await expect.poll(() => page.locator("table tbody tr").count()).toBe(initialRows);
    await expect(page.locator("[data-part=total-value]")).toHaveText(initialTotal);

    const leadSourceA = "Employee Referral";
    const leadSourceB = "Cold Call";
    await openFilterRow(page, panel, "Lead Source");
    await panel.getByRole("button", { name: /Lead Source operator$/ }).click();
    await page.getByRole("option", { name: "is", exact: true }).click();
    await selectPicklistValues(page, panel, "Lead Source", [leadSourceA, leadSourceB]);
    lastBulkBody = undefined;
    lastCountBody = undefined;
    const leadSourceExpectations = firstPageFilterExpectations(
      unfilteredCatalog,
      perPage,
      (row) => row.Lead_Source === leadSourceA || row.Lead_Source === leadSourceB,
    );
    const leadSourceResponses = waitForFilteredListResponses(page);
    await panel.getByRole("button", { name: "Apply Filter" }).click();
    const [leadSourceBulk, leadSourceCount] = await leadSourceResponses;
    expect(leadSourceBulk.ok()).toBe(true);
    expect(leadSourceCount.ok()).toBe(true);
    await expectFilterResultsInDom(page, leadSourceExpectations);
    expect(lastBulkBody).toEqual(
      expect.objectContaining({
        filters: {
          field: { api_name: "Lead_Source" },
          comparator: "equal",
          value: [leadSourceA, leadSourceB],
        },
      }),
    );
    expect(lastCountBody).toEqual(lastBulkBody);

    await panel.getByRole("button", { name: "Clear" }).click();
    await expect.poll(async () => recordIdsInTable(page)).toEqual(baselineIds);
    await expect.poll(() => page.locator("table tbody tr").count()).toBe(initialRows);
    await expect(page.locator("[data-part=total-value]")).toHaveText(initialTotal);

    await openFilterRow(page, panel, "Created Time");
    await panel.getByRole("button", { name: /Created Time operator$/ }).click();
    await page.getByRole("option", { name: "Today", exact: true }).click();
    lastBulkBody = undefined;
    lastCountBody = undefined;
    // Fixture seeds mixed Created_Time ages; Today expectation is computed from unfiltered rows only.
    const todayNow = new Date();
    const todayExpectations = firstPageFilterExpectations(unfilteredCatalog, perPage, (row) =>
      isCreatedOnUtcToday(row.Created_Time, todayNow),
    );
    const todayResponses = waitForFilteredListResponses(page);
    await panel.getByRole("button", { name: "Apply Filter" }).click();
    const [todayBulk, todayCount] = await todayResponses;
    expect(todayBulk.ok()).toBe(true);
    expect(todayCount.ok()).toBe(true);
    await expectFilterResultsInDom(page, todayExpectations);
    expect(lastBulkBody).toEqual({
      filters: {
        field: { api_name: "Created_Time" },
        comparator: "equal",
        value: `\${TODAY}`,
      },
    });
    expect(lastCountBody).toEqual(lastBulkBody);

    await panel.getByRole("button", { name: "Clear" }).click();
    await expect.poll(async () => recordIdsInTable(page)).toEqual(baselineIds);
    await expect.poll(() => page.locator("table tbody tr").count()).toBe(initialRows);
    await openFilterRow(page, panel, "Company");
    await panel.getByRole("button", { name: /Company operator$/ }).click();
    await page.getByRole("option", { name: "is", exact: true }).click();
    await panel.getByRole("textbox", { name: "Company value" }).fill("zzzz-no-match-zzzz");
    lastBulkBody = undefined;
    lastCountBody = undefined;
    const noMatchExpectations = { ids: [] as string[], total: 0 };
    const noMatchResponses = waitForFilteredListResponses(page);
    await panel.getByRole("button", { name: "Apply Filter" }).click();
    const [noMatchBulk, noMatchCount] = await noMatchResponses;
    expect(noMatchBulk.ok()).toBe(true);
    expect(noMatchCount.ok()).toBe(true);
    await expectFilterResultsInDom(page, noMatchExpectations);
    await expect(page.getByText("No Leads found.")).toBeVisible();

    await panel.getByRole("button", { name: "Clear" }).click();
    await expect.poll(async () => recordIdsInTable(page)).toEqual(baselineIds);
    await expect.poll(() => page.locator("table tbody tr").count()).toBe(initialRows);
    await expect(page.locator("[data-part=total-value]")).toHaveText(initialTotal);
    await expectNoA11yViolations(page);
  });

  test("selection bar and delete confirm match visual layout at 1470×835", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await page.evaluate(() => document.fonts.ready);
    const listPage = page.locator(".module-list-page");
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();

    const toolbar = listPage.locator("[data-list-toolbar]");
    const toolbarBox = requireBox(await toolbar.boundingBox(), "list toolbar");
    const toolbarHeight = px(await tokenLength(page, "--size-list-toolbar-height"));
    expectEdge(toolbarBox.height, toolbarHeight);

    await page
      .getByRole("checkbox", { name: /Select / })
      .nth(1)
      .check({ force: true });
    const selectionBar = listPage.locator("[data-selection-bar]");
    await expect(selectionBar).toBeVisible();
    const barBox = requireBox(await selectionBar.boundingBox(), "selection bar");
    expectEdge(barBox.y, toolbarBox.y);
    expectEdge(barBox.height, toolbarHeight);

    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    const panel = dialog.locator("xpath=..");
    const panelBox = requireBox(await panel.boundingBox(), "confirm panel");
    const dialogWidth = px(await tokenLength(page, "--size-dialog-width"));
    expectEdge(panelBox.width, dialogWidth);
    const cornerRadius = px(await tokenLength(page, "--radius-create-menu"));
    await expect(panel).toHaveCSS("border-radius", `${cornerRadius}px`);

    const backdrop = dialog.locator('xpath=ancestor::*[contains(@class,"inset-0")][1]');
    const backdropColor = await backdrop.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    const expectedBackdrop = await sampleBackdropFromOverlayToken(page);
    const actualBackdrop = await sampleComputedBackground(page, backdropColor);
    expectRgbaClose(actualBackdrop, expectedBackdrop);

    const title = dialog.getByRole("heading");
    const message = dialog.locator("p").first();
    await expect(title).toHaveCSS("color", await tokenColor(page, "--color-text-strong"));
    await expect(message).toHaveCSS("color", await tokenColor(page, "--color-confirm-dialog-body"));
    const cancel = dialog.getByRole("button", { name: "Cancel" });
    const confirmDelete = dialog.getByRole("button", { name: "Delete" });
    const titleBox = requireBox(await title.boundingBox(), "confirm title");
    const messageBox = requireBox(await message.boundingBox(), "confirm message");
    const cancelBox = requireBox(await cancel.boundingBox(), "confirm cancel");
    const confirmBox = requireBox(await confirmDelete.boundingBox(), "confirm delete");

    const paddingTop = px(await tokenLength(page, "--size-confirm-dialog-padding-block-start"));
    const paddingInline = px(await tokenLength(page, "--size-confirm-dialog-padding-inline"));
    const paddingBottom = px(await tokenLength(page, "--size-confirm-dialog-padding-block-end"));
    const titleGap = px(await tokenLength(page, "--size-confirm-dialog-title-gap"));
    const messageActionsGap = px(
      await tokenLength(page, "--size-confirm-dialog-message-actions-gap"),
    );
    const actionsGap = px(await tokenLength(page, "--size-confirm-dialog-actions-gap"));
    const buttonHeight = px(await tokenLength(page, "--size-button-ellipsis-height"));

    expectEdge(titleBox.y - panelBox.y, paddingTop);
    expectEdge(titleBox.x - panelBox.x, paddingInline);
    expectEdge(panelBox.y + panelBox.height - (confirmBox.y + confirmBox.height), paddingBottom);
    expectEdge(messageBox.y - (titleBox.y + titleBox.height), titleGap);
    expectEdge(cancelBox.y - (messageBox.y + messageBox.height), messageActionsGap);
    expectEdge(confirmBox.x - (cancelBox.x + cancelBox.width), actionsGap);
    expectEdge(cancelBox.height, buttonHeight);
    expectEdge(confirmBox.height, buttonHeight);
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

  test("mass update and change owner flows update selected rows", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await page.evaluate(() => document.fonts.ready);
    const listPage = page.locator(".module-list-page");
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    const leadSourceIndex = await listColumnIndex(listPage, "Lead Source");
    const ownerIndex = await listColumnIndex(listPage, "Lead Owner");
    const dataRows = listPage.locator("[data-part=row]");
    const firstRow = dataRows.nth(0);
    const secondRow = dataRows.nth(1);
    const rows = page.getByRole("checkbox", { name: /Select / });
    await rows.nth(1).check({ force: true });
    await rows.nth(2).check({ force: true });
    await page.getByRole("button", { name: "Mass Update" }).click();
    const massDialog = page.getByRole("dialog", { name: "Mass Update" });
    await expect(massDialog).toBeVisible();
    await massDialog.getByRole("button", { name: "Field" }).click();
    await page.getByRole("option", { name: "Lead Source" }).click();
    await massDialog.getByRole("button", { name: "Lead Source" }).click();
    await page.getByRole("option", { name: "Advertisement" }).click();
    await expectNoA11yViolations(page, {
      include: ["[data-mass-update-dialog]"],
      exclude: [...OWNER_OPTION_AVATAR_A11Y_EXCLUDE],
    });
    await massDialog.getByRole("button", { name: "Update" }).click();
    await expect(massDialog).toBeHidden();
    await expect(listPage.locator("[data-selection-bar]")).toBeHidden();
    expect(await rowColumnValue(firstRow, leadSourceIndex)).toBe("Advertisement");
    expect(await rowColumnValue(secondRow, leadSourceIndex)).toBe("Advertisement");
    await rows.nth(1).check({ force: true });
    await rows.nth(2).check({ force: true });
    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Change Owner" }).click();
    const ownerDialog = page.locator("[data-change-owner-dialog]");
    await expect(ownerDialog).toBeVisible();
    await ownerDialog.getByRole("button", { name: "Lead Owner" }).click();
    const ownerOptions = page.getByRole("option");
    await expect(ownerOptions.first()).toBeVisible();
    const ownerOptionCount = await ownerOptions.count();
    const ownerOption = ownerOptions.nth(ownerOptionCount > 1 ? 1 : 0);
    const newOwnerName = (await ownerOption.innerText()).split("\n")[0]?.trim() ?? "";
    await ownerOption.click();
    await page.keyboard.press("Escape");
    await expectNoA11yViolations(page, {
      include: ["[data-change-owner-dialog]"],
      exclude: [...OWNER_OPTION_AVATAR_A11Y_EXCLUDE],
    });
    await ownerDialog.getByRole("button", { name: "Change Owner" }).click();
    await expect(ownerDialog).toBeHidden();
    expect(await rowColumnValue(firstRow, ownerIndex)).toBe(newOwnerName);
    expect(await rowColumnValue(secondRow, ownerIndex)).toBe(newOwnerName);
    await page.keyboard.press("Escape");
    await expect(listPage.locator("[data-selection-bar]")).toBeHidden();
  });

  test("mass update cancel leaves data and selection unchanged", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await page.evaluate(() => document.fonts.ready);
    const listPage = page.locator(".module-list-page");
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    const leadSourceIndex = await listColumnIndex(listPage, "Lead Source");
    const dataRows = listPage.locator("[data-part=row]");
    const firstRow = dataRows.nth(0);
    const secondRow = dataRows.nth(1);
    const beforeFirst = await rowColumnValue(firstRow, leadSourceIndex);
    const beforeSecond = await rowColumnValue(secondRow, leadSourceIndex);
    const rows = page.getByRole("checkbox", { name: /Select / });
    await rows.nth(1).check({ force: true });
    await rows.nth(2).check({ force: true });
    await expect(listPage.locator("[data-selection-bar]")).toBeVisible();
    await page.getByRole("button", { name: "Mass Update" }).click();
    const massDialog = page.getByRole("dialog", { name: "Mass Update" });
    await massDialog.getByRole("button", { name: "Field" }).click();
    await page.getByRole("option", { name: "Lead Source" }).click();
    await massDialog.getByRole("button", { name: "Lead Source" }).click();
    await page.getByRole("option", { name: "Advertisement" }).click();
    await massDialog.getByRole("button", { name: "Cancel" }).click();
    await expect(massDialog).toBeHidden();
    await expect(listPage.locator("[data-selection-bar]")).toBeVisible();
    expect(await rowColumnValue(firstRow, leadSourceIndex)).toBe(beforeFirst);
    expect(await rowColumnValue(secondRow, leadSourceIndex)).toBe(beforeSecond);
  });

  test("mass update field validation grows the dialog and keeps actions inside", async ({
    page,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await page.evaluate(() => document.fonts.ready);
    await page
      .getByRole("checkbox", { name: /Select / })
      .nth(1)
      .check({ force: true });
    await page.getByRole("button", { name: "Mass Update" }).click();
    const massDialog = page.getByRole("dialog", { name: "Mass Update" });
    const massPanel = page.locator(".mass-update-modal-panel");
    await massDialog.getByRole("button", { name: "Field" }).click();
    await page.getByRole("option", { name: "Company" }).click();
    await massDialog.getByRole("button", { name: "Update" }).click();
    await expect(massDialog.getByText("Company cannot be empty.")).toBeVisible();
    const panelBox = requireBox(await massPanel.boundingBox(), "mass update panel");
    const baseHeight = px(await tokenLength(page, "--size-mass-update-dialog-height"));
    expect(panelBox.height).toBeGreaterThan(baseHeight);
    const cancel = massPanel.getByRole("button", { name: "Cancel" });
    const update = massPanel.getByRole("button", { name: "Update" });
    const cancelBox = requireBox(await cancel.boundingBox(), "cancel");
    const updateBox = requireBox(await update.boundingBox(), "update");
    const padBottom = px(await tokenLength(page, "--size-mass-update-dialog-padding-block-end"));
    const updateBottomGap = panelBox.y + panelBox.height - (updateBox.y + updateBox.height);
    const cancelBottomGap = panelBox.y + panelBox.height - (cancelBox.y + cancelBox.height);
    expect(updateBottomGap).toBeGreaterThanOrEqual(padBottom - 1);
    expect(cancelBottomGap).toBeGreaterThanOrEqual(padBottom - 1);
    expect(updateBox.y + updateBox.height).toBeLessThanOrEqual(panelBox.y + panelBox.height + 1);
    expect(cancelBox.y + cancelBox.height).toBeLessThanOrEqual(panelBox.y + panelBox.height + 1);
    const errorBox = requireBox(
      await massDialog.getByText("Company cannot be empty.").boundingBox(),
      "field error",
    );
    expect(errorBox.y + errorBox.height).toBeLessThan(cancelBox.y);
  });

  test("bulk dialog visual layout at 1470×835", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await page.evaluate(() => document.fonts.ready);
    const listPage = page.locator(".module-list-page");
    await page
      .getByRole("checkbox", { name: /Select / })
      .nth(1)
      .check({ force: true });
    const massUpdateButton = listPage.getByRole("button", { name: "Mass Update" });
    const massBtnBox = requireBox(await massUpdateButton.boundingBox(), "Mass Update");
    const massBtnHeight = px(await tokenLength(page, "--size-button-ellipsis-height"));
    const massBtnWidth = px(await tokenLength(page, "--size-list-mass-update-button-width"));
    expectEdge(massBtnBox.height, massBtnHeight);
    expectEdge(massBtnBox.width, massBtnWidth);
    await massUpdateButton.click();
    const massPanel = page.locator(".mass-update-modal-panel");
    await expect(massPanel).toBeVisible();
    const panelBox = requireBox(await massPanel.boundingBox(), "mass update panel");
    expectEdge(panelBox.y, 0);
    expectEdge(panelBox.width, px(await tokenLength(page, "--size-mass-update-dialog-width")));
    expectEdge(panelBox.height, px(await tokenLength(page, "--size-mass-update-dialog-height")));
    const title = massPanel.getByRole("heading", { name: "Mass Update" });
    const fieldTrigger = massPanel.getByRole("button", { name: "Field" });
    const placeholder = massPanel.locator("[data-part=value-placeholder]");
    const cancel = massPanel.getByRole("button", { name: "Cancel" });
    const update = massPanel.getByRole("button", { name: "Update" });
    const titleBox = requireBox(await title.boundingBox(), "mass title");
    const fieldBox = requireBox(await fieldTrigger.boundingBox(), "field selector");
    const placeholderBox = requireBox(await placeholder.boundingBox(), "value placeholder");
    const cancelBox = requireBox(await cancel.boundingBox(), "cancel");
    const updateBox = requireBox(await update.boundingBox(), "update");
    const padInline = px(await tokenLength(page, "--size-mass-update-dialog-padding-inline"));
    const titlePadInline = px(
      await tokenLength(page, "--size-mass-update-dialog-title-padding-inline-start"),
    );
    const padTop = px(await tokenLength(page, "--size-mass-update-dialog-padding-block-start"));
    const padBottom = px(await tokenLength(page, "--size-mass-update-dialog-padding-block-end"));
    const titleFieldsGap = px(
      await tokenLength(page, "--size-mass-update-dialog-title-fields-gap"),
    );
    const fieldsActionsGap = px(
      await tokenLength(page, "--size-mass-update-dialog-fields-actions-gap"),
    );
    const fieldGap = px(await tokenLength(page, "--size-mass-update-field-gap"));
    const fieldWidth = px(await tokenLength(page, "--size-mass-update-field-selector-width"));
    const valueWidth = px(await tokenLength(page, "--size-mass-update-value-width"));
    const cancelWidth = px(await tokenLength(page, "--size-mass-update-cancel-width"));
    const updateWidth = px(await tokenLength(page, "--size-mass-update-update-width"));
    const actionsGap = px(await tokenLength(page, "--size-mass-update-actions-gap"));
    const inputHeight = px(await tokenLength(page, "--size-form-input-height"));
    const buttonHeight = px(await tokenLength(page, "--size-button-ellipsis-height"));
    const actionCornerRadius = px(await tokenLength(page, "--radius-create-menu"));
    expectEdge(titleBox.x - panelBox.x, titlePadInline);
    expectEdge(titleBox.y - panelBox.y, padTop);
    expectEdge(fieldBox.y - (titleBox.y + titleBox.height), titleFieldsGap);
    expectEdge(fieldBox.x - panelBox.x, padInline);
    expectEdge(fieldBox.width, fieldWidth);
    expectEdge(fieldBox.height, inputHeight);
    expectEdge(placeholderBox.x - (fieldBox.x + fieldBox.width), fieldGap);
    expectEdge(placeholderBox.width, valueWidth);
    expectEdge(placeholderBox.height, inputHeight);
    expectEdge(panelBox.x + panelBox.width - (placeholderBox.x + placeholderBox.width), padInline);
    expectEdge(cancelBox.y - (fieldBox.y + fieldBox.height), fieldsActionsGap);
    expectEdge(cancelBox.width, cancelWidth);
    expectEdge(updateBox.width, updateWidth);
    expectEdge(cancelBox.height, buttonHeight);
    expectEdge(updateBox.height, buttonHeight);
    expectEdge(updateBox.x - (cancelBox.x + cancelBox.width), actionsGap);
    expectEdge(panelBox.x + panelBox.width - (updateBox.x + updateBox.width), padInline);
    expectEdge(panelBox.y + panelBox.height - (updateBox.y + updateBox.height), padBottom);
    await expect(cancel).toHaveCSS("border-radius", `${actionCornerRadius}px`);
    await expect(update).toHaveCSS("border-radius", `${actionCornerRadius}px`);
    await cancel.click();
    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Change Owner" }).click();
    const ownerDialog = page.locator("[data-change-owner-dialog]");
    const ownerPanel = ownerDialog.locator("xpath=..");
    const ownerPanelBox = requireBox(await ownerPanel.boundingBox(), "change owner panel");
    expectEdge(ownerPanelBox.width, px(await tokenLength(page, "--size-dialog-width")));
    const cornerRadius = px(await tokenLength(page, "--radius-create-menu"));
    await expect(ownerPanel).toHaveCSS("border-radius", `${cornerRadius}px`);
    const ownerTitle = ownerDialog.getByRole("heading", { name: "Change Owner" });
    const ownerTitleBox = requireBox(await ownerTitle.boundingBox(), "change owner title");
    const paddingTop = px(await tokenLength(page, "--size-confirm-dialog-padding-block-start"));
    const paddingInline = px(await tokenLength(page, "--size-confirm-dialog-padding-inline"));
    const paddingBottom = px(await tokenLength(page, "--size-confirm-dialog-padding-block-end"));
    expectEdge(ownerTitleBox.y - ownerPanelBox.y, paddingTop);
    expectEdge(ownerTitleBox.x - ownerPanelBox.x, paddingInline);
    const ownerCancel = ownerDialog.getByRole("button", { name: "Cancel" });
    const ownerConfirm = ownerDialog.getByRole("button", { name: "Change Owner" });
    const ownerCancelBox = requireBox(await ownerCancel.boundingBox(), "owner cancel");
    const ownerConfirmBox = requireBox(await ownerConfirm.boundingBox(), "owner confirm");
    expectEdge(ownerCancelBox.height, buttonHeight);
    expectEdge(ownerConfirmBox.height, buttonHeight);
    expectEdge(
      ownerConfirmBox.x - (ownerCancelBox.x + ownerCancelBox.width),
      px(await tokenLength(page, "--size-confirm-dialog-actions-gap")),
    );
    expectEdge(
      ownerPanelBox.y + ownerPanelBox.height - (ownerConfirmBox.y + ownerConfirmBox.height),
      paddingBottom,
    );
    await expect(ownerCancel).toHaveCSS("border-radius", `${cornerRadius}px`);
    await expect(ownerConfirm).toHaveCSS("border-radius", `${cornerRadius}px`);
  });

  test("list view chrome matches the measured toolbar, switcher and selection rows", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    const listPage = page.locator(".module-list-page");
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);

    // Tab strip bottom rule: 1 px #DCDBEE spanning the full content canvas (x 320–1470).
    const tabStrip = listPage.locator("[data-view-tab-strip]");
    await expect(tabStrip).toHaveCSS("border-bottom-width", "1px");
    await expect(tabStrip).toHaveCSS("border-bottom-color", "rgb(220, 219, 238)");
    const pageBox = requireBox(await listPage.boundingBox(), "list page");
    const stripBox = requireBox(await tabStrip.boundingBox(), "tab strip");
    expect(Math.abs(stripBox.x - pageBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(stripBox.width - pageBox.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(pageBox.width - 1150)).toBeLessThanOrEqual(1);

    // Filter toggle, panel open, sits on the white toolbar surface with the measured fill and
    // a black funnel glyph in a 15 × 16 ink box (list-views.md › Filter toggle, panel open).
    const toolbar = listPage.locator("[data-list-toolbar]");
    await expect(toolbar).toHaveCSS("background-color", "rgb(255, 255, 255)");
    const filter = listPage.getByRole("button", { name: "Filter", exact: true });
    await expect(filter).toHaveAttribute("aria-pressed", "true");
    await expect(filter).toHaveCSS("background-color", "rgb(237, 240, 249)");
    const funnel = requireBox(await filter.locator("svg").boundingBox(), "funnel ink");
    expect(Math.abs(funnel.width - 15)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(funnel.height - 16)).toBeLessThanOrEqual(0.5);
    await expect(filter.locator("svg")).toHaveCSS("color", "rgb(0, 0, 0)");

    // View type switcher: seven controls on a 6 px gap, the first tile on the measured edge,
    // the unimplemented presentations aria-disabled (Interim).
    const switcher = listPage.locator("[data-view-type-switcher]");
    await expect(switcher.locator("button")).toHaveCount(7);
    const listTile = requireBox(
      await listPage.getByRole("button", { name: "List presentation" }).boundingBox(),
      "list tile",
    );
    expect(Math.abs(listTile.width - 26)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(listTile.x - 500)).toBeLessThanOrEqual(2);
    const splitTile = requireBox(
      await listPage.getByRole("button", { name: "Split presentation" }).boundingBox(),
      "split tile",
    );
    expect(Math.abs(splitTile.x - (listTile.x + listTile.width + 6))).toBeLessThanOrEqual(0.5);
    await expect(switcher.getByRole("button", { name: "Grid presentation" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    // Filter panel row label: the measured labels wrap within the capped text field.
    for (const label of ["Untouched Records", "Address - Country / Region"]) {
      const el = listPage.getByText(label, { exact: true });
      const box = requireBox(await el.boundingBox(), `label ${label}`);
      expect(Math.abs(box.width - 126)).toBeLessThanOrEqual(0.5);
      expect(box.height).toBeGreaterThanOrEqual(32);
    }

    // Selection toolbar: counter strip and four record-action buttons at the measured widths.
    await page
      .getByRole("checkbox", { name: /Select / })
      .nth(1)
      .check({ force: true });
    const bar = listPage.locator("[data-selection-bar]");
    await expect(bar).toBeVisible();
    await expect(bar.getByText("1 Record Selected.", { exact: true })).toBeVisible();
    const counter = requireBox(
      await bar.locator("[data-part=selection-strip]").boundingBox(),
      "counter",
    );
    expect(Math.abs(counter.width - 170)).toBeLessThanOrEqual(1);
    const sendEmail = requireBox(
      await bar.getByRole("button", { name: "Send Email" }).boundingBox(),
    );
    const tags = requireBox(await bar.getByRole("button", { name: "Tags" }).boundingBox());
    const massUpdate = requireBox(
      await bar.getByRole("button", { name: "Mass Update" }).boundingBox(),
    );
    const actionsBtn = requireBox(await bar.getByRole("button", { name: "Actions" }).boundingBox());
    expect(Math.abs(sendEmail.width - 101)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(tags.width - 73)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(massUpdate.width - 113)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(actionsBtn.width - 45)).toBeLessThanOrEqual(0.5);
    for (const b of [sendEmail, tags, massUpdate, actionsBtn]) {
      expect(Math.abs(b.height - 32)).toBeLessThanOrEqual(0.5);
    }
    expect(Math.abs(tags.x - (sendEmail.x + sendEmail.width) - 8)).toBeLessThanOrEqual(0.5);
    await expect(sendEmail).toHaveCSS(
      "background-image",
      /rgb\(253, 253, 254\).*rgb\(243, 242, 248\)/,
    );

    // Selection Actions menu: the 11 operations in screen order, rows 32 px high.
    await bar.getByRole("button", { name: "Actions" }).click();
    const items = (await page.getByRole("menuitem").allInnerTexts()).map((text) => text.trim());
    expect(items).toEqual([
      "Run Macro",
      "Create Task",
      "Change Owner",
      "Cadences",
      "Add to Campaigns",
      "Print Mailing Labels",
      "Print Using Canvas",
      "Mail Merge",
      "Mass Convert",
      "Delete",
      "Export Selected Records",
    ]);
    const firstItem = requireBox(
      await page.getByRole("menuitem", { name: "Run Macro" }).boundingBox(),
      "menu row",
    );
    expect(Math.abs(firstItem.height - 32)).toBeLessThanOrEqual(0.5);
  });
});
