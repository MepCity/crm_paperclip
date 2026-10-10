import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleListCustomPath, moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";
import { expectType } from "./support/typography";

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
  const rows = page.locator("table tbody tr");
  const rowCount = await rows.count();
  const ids: string[] = [];
  for (let i = 0; i < rowCount; i++) {
    const href = await rows.nth(i).getByRole("link").first().getAttribute("href");
    const match = href?.match(/\/Leads\/([^/?#]+)/);
    if (match?.[1]) ids.push(match[1]);
  }
  return ids;
}

async function expectFilterResultsMatchResponses(
  page: import("@playwright/test").Page,
  bulkResponse: import("@playwright/test").Response,
  countResponse: import("@playwright/test").Response,
) {
  const bulkJson = (await bulkResponse.json()) as { data: { id: string }[] };
  const countJson = (await countResponse.json()) as { count: number };
  const expectedIds = bulkJson.data.map((row) => row.id);
  await expect.poll(async () => recordIdsInTable(page)).toEqual(expectedIds);
  await expect(page.locator("[data-part=total-value]")).toHaveText(String(countJson.count));
  expect(expectedIds.length).toBeLessThanOrEqual(countJson.count);
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

const ALPHABET_CONTROL = "Filter by first letter";

function alphabetControl(page: import("@playwright/test").Page) {
  return page.getByRole("button", { name: ALPHABET_CONTROL });
}

/** Index of the data column that carries the alphabetical control, i.e. the link column. */
async function alphabetColumnIndex(page: import("@playwright/test").Page): Promise<number> {
  const index = await page
    .locator("thead [data-part=column]")
    .evaluateAll((nodes) =>
      nodes.findIndex((node) => Boolean(node.querySelector("[data-part=alphabet]"))),
    );
  if (index < 0) throw new Error("No column header carries the alphabetical control.");
  return index;
}

async function leadNameColumnTexts(page: import("@playwright/test").Page): Promise<string[]> {
  const index = await alphabetColumnIndex(page);
  const rows = page.locator("tbody tr");
  const rowCount = await rows.count();
  const texts: string[] = [];
  for (let i = 0; i < rowCount; i++) {
    texts.push((await rows.nth(i).locator("[data-part=column]").nth(index).innerText()).trim());
  }
  return texts;
}

async function pickLetter(page: import("@playwright/test").Page, letter: string) {
  await alphabetControl(page).click();
  await page.getByRole("option", { name: letter, exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
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
    const firstLinkOnPage1 = await page
      .locator("table tbody tr")
      .first()
      .getByRole("link")
      .first()
      .innerText();
    await expect(page.locator("table tbody tr")).toHaveCount(10);
    const next = page.getByLabel("Next");
    await expect(next).toBeEnabled();
    await next.click();
    await expect.poll(() => new URL(page.url()).searchParams.get("page")).toBe("2");
    const urlAfterNext = new URL(page.url());
    expect(urlAfterNext.searchParams.get("per_page")).toBe("10");
    await expect(page.locator("table tbody tr")).toHaveCount(10);
    const firstLinkOnPage2 = await page
      .locator("table tbody tr")
      .first()
      .getByRole("link")
      .first()
      .innerText();
    expect(firstLinkOnPage2).not.toBe(firstLinkOnPage1);
    await page.getByLabel("Previous").click();
    await expect.poll(() => new URL(page.url()).searchParams.get("page")).toBeNull();
    const urlAfterPrevious = new URL(page.url());
    expect(urlAfterPrevious.searchParams.get("per_page")).toBe("10");
    await expect(page.locator("table tbody tr")).toHaveCount(10);
    const firstLinkBack = await page
      .locator("table tbody tr")
      .first()
      .getByRole("link")
      .first()
      .innerText();
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
    await expect(page.getByText("2 Records Selected")).toBeVisible();
    await expectNoA11yViolations(page);
    await expect(page.getByRole("button", { name: "Filter", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expectNoA11yViolations(page);
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByText("2 Records Selected")).toBeVisible();
    const deleteDone = page.waitForResponse(async (response) => {
      if (response.request().method() !== "POST") return false;
      if (!response.url().includes("/actions/mass_delete")) return false;
      const body = response.request().postDataJSON() as { ids?: string[] } | null;
      deletedIds.length = 0;
      deletedIds.push(...(body?.ids ?? []));
      return response.ok();
    });
    await page.getByRole("button", { name: "Delete" }).click();
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
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    const initialRows = await page.locator("table tbody tr").count();
    const initialTotal = await page.locator("[data-part=total-value]").innerText();
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
    const companyResponses = waitForFilteredListResponses(page);
    await panel.getByRole("button", { name: "Apply Filter" }).click();
    const [companyBulk, companyCount] = await companyResponses;
    await expectFilterResultsMatchResponses(page, companyBulk, companyCount);
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
    const leadSourceResponses = waitForFilteredListResponses(page);
    await panel.getByRole("button", { name: "Apply Filter" }).click();
    const [leadSourceBulk, leadSourceCount] = await leadSourceResponses;
    await expectFilterResultsMatchResponses(page, leadSourceBulk, leadSourceCount);
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
    await expect.poll(() => page.locator("table tbody tr").count()).toBe(initialRows);
    await expect(page.locator("[data-part=total-value]")).toHaveText(initialTotal);

    await openFilterRow(page, panel, "Created Time");
    await panel.getByRole("button", { name: /Created Time operator$/ }).click();
    await page.getByRole("option", { name: "Today", exact: true }).click();
    lastBulkBody = undefined;
    lastCountBody = undefined;
    const todayResponses = waitForFilteredListResponses(page);
    await panel.getByRole("button", { name: "Apply Filter" }).click();
    const [todayBulk, todayCount] = await todayResponses;
    await expectFilterResultsMatchResponses(page, todayBulk, todayCount);
    expect(lastBulkBody).toEqual({
      filters: {
        field: { api_name: "Created_Time" },
        comparator: "equal",
        value: `\${TODAY}`,
      },
    });
    expect(lastCountBody).toEqual(lastBulkBody);

    await panel.getByRole("button", { name: "Clear" }).click();
    await expect.poll(() => page.locator("table tbody tr").count()).toBe(initialRows);
    await openFilterRow(page, panel, "Company");
    await panel.getByRole("button", { name: /Company operator$/ }).click();
    await page.getByRole("option", { name: "is", exact: true }).click();
    await panel.getByRole("textbox", { name: "Company value" }).fill("zzzz-no-match-zzzz");
    lastBulkBody = undefined;
    lastCountBody = undefined;
    const noMatchResponses = waitForFilteredListResponses(page);
    await panel.getByRole("button", { name: "Apply Filter" }).click();
    await noMatchResponses;
    await expect(page.getByText("No Leads found.")).toBeVisible();
    await expect.poll(async () => recordIdsInTable(page)).toEqual([]);
    await expect(page.locator("[data-part=total-value]")).toHaveText("0");

    await panel.getByRole("button", { name: "Clear" }).click();
    await expect.poll(() => page.locator("table tbody tr").count()).toBe(initialRows);
    await expect(page.locator("[data-part=total-value]")).toHaveText(initialTotal);
    await expectNoA11yViolations(page);
  });

  test("alphabetical filter keeps the rows that start with the chosen letter", async ({ page }) => {
    test.setTimeout(180_000);
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    await expect(alphabetControl(page)).toHaveText("All");
    const initialTotal = Number(await page.locator("[data-part=total-value]").innerText());
    const beforeIds = await recordIdsInTable(page);

    let lastBulkBody: unknown;
    let lastCountBody: unknown;
    page.on("request", (request) => {
      const parsed = parseCrmRequest(request.url(), request.method());
      if (parsed?.method !== "POST") return;
      if (parsed.pathname.endsWith("/Leads/bulk")) lastBulkBody = request.postDataJSON();
      if (parsed.pathname.endsWith("/Leads/actions/count")) lastCountBody = request.postDataJSON();
    });

    const letterResponses = waitForFilteredListResponses(page);
    await pickLetter(page, "L");
    const [letterBulk, letterCount] = await letterResponses;
    await expectFilterResultsMatchResponses(page, letterBulk, letterCount);
    expect(lastBulkBody).toEqual(
      expect.objectContaining({
        filters: {
          field: { api_name: "Full_Name" },
          comparator: "starts_with",
          value: "L",
        },
      }),
    );
    expect(lastCountBody).toEqual(lastBulkBody);
    expect(await alphabetControl(page).innerText()).toBe("L");
    const names = await leadNameColumnTexts(page);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) expect(name.startsWith("L")).toBe(true);
    const letterTotal = Number(await page.locator("[data-part=total-value]").innerText());
    expect(letterTotal).toBeLessThan(initialTotal);
    const letterIds = await recordIdsInTable(page);

    const otherResponses = waitForFilteredListResponses(page);
    await pickLetter(page, "S");
    await otherResponses;
    const otherNames = await leadNameColumnTexts(page);
    expect(otherNames.length).toBeGreaterThan(0);
    for (const name of otherNames) expect(name.startsWith("S")).toBe(true);
    // Two different letters answer disjoint record sets on the first page.
    const otherIds = await recordIdsInTable(page);
    expect(otherIds.filter((id) => letterIds.includes(id))).toEqual([]);

    const emptyResponses = waitForFilteredListResponses(page);
    await pickLetter(page, "Z");
    await emptyResponses;
    await expect(page.getByText("No Leads found.")).toBeVisible();
    await expect(page.locator("[data-part=total-value]")).toHaveText("0");
    await expect.poll(async () => recordIdsInTable(page)).toEqual([]);

    const allResponses = waitForFilteredListResponses(page);
    await pickLetter(page, "All");
    await allResponses;
    await expect(alphabetControl(page)).toHaveText("All");
    await expect(page.locator("[data-part=total-value]")).toHaveText(String(initialTotal));
    await expect.poll(async () => recordIdsInTable(page)).toEqual(beforeIds);
    await expectNoA11yViolations(page);
  });

  test("alphabetical dropdown matches its measured panel at 1470×835", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_MODULE));
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();

    const boxWidth = await sizeToken(page, "--size-popover-alphabet-width");
    const boxHeight = await sizeToken(page, "--size-popover-alphabet-height");
    const rowWidth = await sizeToken(page, "--size-popover-alphabet-row-width");
    const rowHeight = await sizeToken(page, "--size-popover-alphabet-row-height");
    const rowInset = await sizeToken(page, "--size-popover-alphabet-inset");
    const border = await tokenColor(page, "--color-border");
    const surface = await tokenColor(page, "--color-surface");
    const fill = await tokenColor(page, "--color-surface-selected");
    const selectedInk = await tokenColor(page, "--color-primary");
    const rowInk = await tokenColor(page, "--color-text");
    const headerHeight = await sizeToken(page, "--size-list-header-height");
    const columnWidth = await sizeToken(page, "--size-list-column-width");

    const headerCell = page
      .locator("thead [data-part=column]")
      .nth(await alphabetColumnIndex(page));
    const headerBox = requireBox(await headerCell.boundingBox(), "link column header");
    expectEdge(headerBox.height, headerHeight);
    expectEdge(headerBox.width, columnWidth);

    await alphabetControl(page).click();
    const panel = page.locator(".alphabet-panel");
    await expect(panel).toBeVisible();
    const panelBox = requireBox(await panel.boundingBox(), "alphabet panel");
    expectEdge(panelBox.width, boxWidth);
    expectEdge(panelBox.height, boxHeight);
    await expect(panel).toHaveCSS("border-top-width", "1px");
    await expect(panel).toHaveCSS("border-left-color", border);
    await expect(panel).toHaveCSS("border-top-color", border);
    await expect(panel).toHaveCSS("background-color", surface);

    const rows = page.getByRole("option");
    await expect(rows).toHaveCount(27);
    const allRow = rows.nth(0);
    const letterRow = rows.nth(1);
    expect((await allRow.innerText()).trim()).toBe("All");
    expect((await letterRow.innerText()).trim()).toBe("A");
    const allBox = requireBox(await allRow.boundingBox(), "alphabet row");
    expectEdge(allBox.width, rowWidth);
    expectEdge(allBox.height, rowHeight);
    // The measured box puts approx 6 px of padding between its edge and the rows.
    expectEdge(allBox.x - panelBox.x, 1 + rowInset);

    // Selected row: blue text on the pale fill, with no marker glyph.
    await expect(allRow).toHaveCSS("color", selectedInk);
    await expect(allRow).toHaveCSS("background-color", fill);
    await expect(allRow.locator("svg, img, [aria-hidden]")).toHaveCount(0);
    // Another row keeps the body ink until it is hovered, and no row draws a marker glyph.
    await expect(letterRow).toHaveCSS("color", rowInk);
    await expect(letterRow).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await letterRow.hover();
    await expect(letterRow).toHaveCSS("background-color", fill);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
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

    await page.getByRole("button", { name: "Delete" }).click();
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
});
