import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import {
  LEADS_MODULE,
  moduleListDefaultPath,
  moduleRecordEditPath,
  moduleRecordPath,
} from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";
import { expectType } from "./support/typography";

type ElementBox = NonNullable<
  Awaited<ReturnType<import("@playwright/test").Locator["boundingBox"]>>
>;

type CrmRequest = { method: string; pathname: string; searchParams: URLSearchParams };

const DETAIL_FROM_LIST_REQUESTS: readonly {
  method: string;
  path: RegExp;
  queryNames: readonly string[];
}[] = [
  { method: "GET", path: /^\/crm\/v2\.2\/Leads\/[^/]+$/, queryNames: [] },
  { method: "GET", path: /^\/crm\/v9\/users$/, queryNames: ["type", "page", "per_page"] },
];

function requireBox(box: ElementBox | null, label = "element"): ElementBox {
  if (!box) throw new Error(`Expected ${label} box.`);
  return box;
}

function expectEdge(value: number, expected: number, tolerance = 1) {
  expect(Math.abs(value - expected)).toBeLessThanOrEqual(tolerance);
}

function expectSpecEdge(value: number, expected: number) {
  expectEdge(value, expected, 0.5);
}

function expectListAddress(
  address: string,
  base: string,
  expectedPath: string,
  params: Record<string, string>,
) {
  const current = new URL(address, base);
  const expected = new URL(expectedPath, base);
  expect(current.pathname).toBe(expected.pathname);
  for (const [key, value] of Object.entries(params)) {
    expect(current.searchParams.get(key)).toBe(value);
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

function matchesDetailSpec(request: CrmRequest, spec: (typeof DETAIL_FROM_LIST_REQUESTS)[number]) {
  if (request.method !== spec.method) return false;
  if (!spec.path.test(request.pathname)) return false;
  const expected = [...spec.queryNames];
  const actual = [...queryNameSet(request.searchParams)].sort();
  const expectedSorted = [...expected].sort();
  return actual.length === expectedSorted.length && actual.every((k, i) => k === expectedSorted[i]);
}

function assertDetailFromListRequests(requests: CrmRequest[]) {
  for (const request of requests) {
    expect(
      DETAIL_FROM_LIST_REQUESTS.some((spec) => matchesDetailSpec(request, spec)),
      `Unexpected CRM request: ${request.method} ${request.pathname}`,
    ).toBe(true);
  }
  for (const spec of DETAIL_FROM_LIST_REQUESTS) {
    expect(
      requests.some((request) => matchesDetailSpec(request, spec)),
      `Expected request for ${spec.method} ${spec.path}`,
    ).toBe(true);
  }
  expect(requests).toHaveLength(DETAIL_FROM_LIST_REQUESTS.length);
}

async function openFirstLeadFromList(
  page: import("@playwright/test").Page,
  orgSlug: string,
  listQuery = "",
) {
  const listUrl = `${moduleListDefaultPath(orgSlug, LEADS_MODULE)}${listQuery}`;
  await page.goto(listUrl);
  await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
  const link = page.locator("table tbody tr").first().getByRole("link").first();
  const name = await link.innerText();
  const href = await link.getAttribute("href");
  if (!href) throw new Error("Expected record link href.");
  await link.click();
  await expect(page.locator("[data-record-frame]")).toBeVisible();
  return { listUrl, name, href };
}

test.describe("Lead record detail page", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("opens from the list name link", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const { name } = await openFirstLeadFromList(page, org.slug);
    await expect(
      page.locator("[data-record-header]").getByRole("heading", { level: 1 }),
    ).toContainText(name);
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Business card" })).toBeVisible();
  });

  test("Back returns to the same list view and page", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openFirstLeadFromList(page, org.slug, "?per_page=10&page=2");
    const back = page.locator("[data-record-header]").getByRole("link", { name: "Back" });
    const listPath = moduleListDefaultPath(org.slug, LEADS_MODULE);
    const listParams = { page: "2", per_page: "10" };
    const backHref = await back.getAttribute("href");
    if (!backHref) throw new Error("Expected Back link href.");
    expect(backHref).toBe(`${listPath}?page=2&per_page=10`);
    expectListAddress(backHref, page.url(), listPath, listParams);
    await Promise.all([page.waitForURL(/\/tab\/Leads\/list/), back.click()]);
    expectListAddress(page.url(), page.url(), listPath, listParams);
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
  });

  test("Previous and Next move within the loaded list page", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openFirstLeadFromList(page, org.slug, "?per_page=10&page=1");
    const recordTitle = page.locator("[data-record-header]").getByRole("heading", { level: 1 });
    const titleOnFirst = await recordTitle.innerText();
    await expect(page.getByRole("button", { name: "Previous Record" })).toBeDisabled();
    const next = page.getByRole("link", { name: "Next Record" });
    await expect(next).toBeVisible();
    await next.click();
    await expect(recordTitle).not.toHaveText(titleOnFirst);
    await page.getByRole("link", { name: "Previous Record" }).click();
    await expect(recordTitle).toHaveText(titleOnFirst);
  });

  test("Next Record is disabled on the last row of the list page", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const listUrl = `${moduleListDefaultPath(org.slug, LEADS_MODULE)}?per_page=10&page=1`;
    await page.goto(listUrl);
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    const lastLink = page.locator("table tbody tr").last().getByRole("link").first();
    await lastLink.click();
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    await expect(page.getByRole("button", { name: "Next Record" })).toBeDisabled();
  });

  test("Edit links to the edit route", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openFirstLeadFromList(page, org.slug);
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    const recordId = new URL(page.url()).pathname.split("/").pop();
    if (!recordId) throw new Error("Expected record id in URL.");
    const edit = page.locator("[data-record-header]").getByRole("link", { name: "Edit" });
    await expect(edit).toHaveAttribute(
      "href",
      moduleRecordEditPath(org.slug, LEADS_MODULE, recordId),
    );
  });

  test("shows not found for an unknown record id", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleRecordPath(org.slug, LEADS_MODULE, "missing-record-id"));
    await expect(page.getByText(/could not be found/i)).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
    ignoreFailedResponses(pageErrors, [404]);
  });

  test("loads the record through ADR get on navigation from list", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const listUrl = moduleListDefaultPath(org.slug, LEADS_MODULE);
    await page.goto(listUrl);
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    const link = page.locator("table tbody tr").first().getByRole("link").first();
    const seen: CrmRequest[] = [];
    const onRequest = (request: import("@playwright/test").Request) => {
      const parsed = parseCrmRequest(request.url(), request.method());
      if (parsed) seen.push(parsed);
    };
    page.on("request", onRequest);
    await link.click();
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    page.off("request", onRequest);
    assertDetailFromListRequests(seen);
    expect(seen.some((item) => item.pathname.includes("/settings/custom_views"))).toBe(false);
  });

  test("meets accessibility rules on a populated record", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openFirstLeadFromList(page, org.slug);
    await expectNoA11yViolations(page);
  });

  test("layout matches record-detail visual layout at 1470×835", async ({ page }) => {
    const CARD_WIDTH = 906;
    const BUSINESS_LABEL_END = 173.5;
    const BUSINESS_VALUE_START = 219;
    const SPEC = {
      headerYTop: 50,
      headerYBottom: 123,
      railXLeft: 320,
      railXRight: 540,
      canvasXLeft: 540,
      canvasXRight: 1470,
      cardXLeft: 552,
      cardXRight: 1458,
      detailsLeftLabelEnd: 701,
      detailsRightLabelEnd: 1134.5,
      detailsLeftValueStart: 737.5,
      detailsRightValueStart: 1170.5,
    };
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openFirstLeadFromList(page, org.slug);
    await page.evaluate(() => document.fonts.ready);

    const frame = page.locator("[data-record-frame]");
    const header = frame.locator("[data-record-header]");
    await expect(header).toHaveCSS("background-color", "rgb(255, 255, 255)");
    const headerBox = requireBox(await header.boundingBox(), "record header");
    expectSpecEdge(headerBox.y, SPEC.headerYTop);
    expectSpecEdge(headerBox.y + headerBox.height, SPEC.headerYBottom);
    expectSpecEdge(headerBox.height, 73);

    const portrait = header.locator("[data-record-portrait]");
    const portraitBox = requireBox(await portrait.boundingBox(), "portrait");
    expectEdge(portraitBox.width, 48);
    expectEdge(portraitBox.x - headerBox.x, 52);

    const rail = frame.locator("[data-record-rail]");
    const railBox = requireBox(await rail.boundingBox(), "related-list rail");
    expectSpecEdge(railBox.x, SPEC.railXLeft);
    expectSpecEdge(railBox.x + railBox.width, SPEC.railXRight);
    await expect(rail).toHaveCSS("width", "220px");

    const tabRow = frame.locator("[data-record-tab-row]");
    await expect(tabRow.locator("..")).toHaveCSS("background-color", "rgb(238, 241, 249)");
    await expectType(
      page,
      frame.getByRole("tab", { name: "Overview" }),
      "--text-lg",
      "--font-weight-semibold",
    );
    await expect(frame.locator("[data-record-rail-control]")).toHaveCSS("width", "36px");

    const scroller = frame.locator("[data-record-scroller]");
    const scrollerBox = requireBox(await scroller.boundingBox(), "record scroller");
    expectSpecEdge(scrollerBox.x, SPEC.canvasXLeft);
    expectSpecEdge(scrollerBox.x + scrollerBox.width, SPEC.canvasXRight);

    const businessCard = frame.getByRole("region", { name: "Business card" });
    const businessBox = requireBox(await businessCard.boundingBox(), "business card");
    expectSpecEdge(businessBox.x, SPEC.cardXLeft);
    expectSpecEdge(businessBox.x + businessBox.width, SPEC.cardXRight);
    expect(Math.abs(businessBox.width - CARD_WIDTH)).toBeLessThanOrEqual(0.5);
    const businessLabel = businessCard.locator(".detail-field-label").first();
    const businessValue = businessCard.locator(".detail-field-value").first();
    const labelBox = requireBox(await businessLabel.boundingBox(), "business label");
    const valueBox = requireBox(await businessValue.boundingBox(), "business value");
    expect(
      Math.abs(labelBox.x + labelBox.width - businessBox.x - BUSINESS_LABEL_END),
    ).toBeLessThanOrEqual(0.5);
    expect(Math.abs(valueBox.x - businessBox.x - BUSINESS_VALUE_START)).toBeLessThanOrEqual(0.5);

    const detailsCard = frame.getByRole("region", { name: "Details card" });
    const detailsBox = requireBox(await detailsCard.boundingBox(), "details card");
    expectSpecEdge(detailsBox.x, SPEC.cardXLeft);
    expectSpecEdge(detailsBox.x + detailsBox.width, SPEC.cardXRight);
    expect(Math.abs(detailsBox.width - CARD_WIDTH)).toBeLessThanOrEqual(0.5);

    const leftColumn = detailsCard.locator(".detail-column").first();
    const rightColumn = detailsCard.locator(".detail-column").nth(1);
    const leftDetailsLabel = leftColumn.locator(".detail-field-label").first();
    const leftDetailsValue = leftColumn.locator(".detail-field-value").first();
    const leadNameRow = rightColumn.locator(".detail-details-row", { hasText: "Lead Name" });
    const rightDetailsLabel = leadNameRow.locator(".detail-field-label");
    const rightDetailsValue = leadNameRow.locator(".detail-field-value");
    const leftLabelBox = requireBox(await leftDetailsLabel.boundingBox(), "details left label");
    const leftValueBox = requireBox(await leftDetailsValue.boundingBox(), "details left value");
    const rightLabelBox = requireBox(await rightDetailsLabel.boundingBox(), "details right label");
    const rightValueBox = requireBox(await rightDetailsValue.boundingBox(), "details right value");
    expectSpecEdge(leftLabelBox.x + leftLabelBox.width, SPEC.detailsLeftLabelEnd);
    expectSpecEdge(rightLabelBox.x + rightLabelBox.width, SPEC.detailsRightLabelEnd);
    expectSpecEdge(leftValueBox.x, SPEC.detailsLeftValueStart);
    expectSpecEdge(rightValueBox.x, SPEC.detailsRightValueStart);

    const scratchDir = process.env.PAPERCLIP_TASK_SCRATCH_DIR;
    if (scratchDir) {
      await page.screenshot({
        path: `${scratchDir}/mep-232-leads-detail-1470x835.png`,
      });
    }
  });

  test("deletes a lead from More Options and returns to the list", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const listPath = moduleListDefaultPath(org.slug, LEADS_MODULE);
    await page.goto(listPath);
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    const totalValue = page.locator("[data-part=total-value]");
    const totalBefore = Number(await totalValue.innerText());
    const firstRow = page.locator("table tbody tr").first();
    const deletedLabel = await firstRow.getByRole("link").first().innerText();
    const recordHref = await firstRow.getByRole("link").first().getAttribute("href");
    if (!recordHref) throw new Error("Expected record link href.");
    const recordId = new URL(recordHref, page.url()).pathname.split("/").pop();
    if (!recordId) throw new Error("Expected record id.");
    await firstRow.getByRole("link").first().click();
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    const header = page.locator("[data-record-header]");
    const more = header.getByRole("button", { name: "More Options" });
    await more.click();
    const menu = page.getByRole("menu", { name: "More Options" });
    await expect(menu.getByRole("menuitem", { name: "Delete" })).toBeVisible();
    await menu.getByRole("menuitem", { name: "Delete" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByRole("heading", { name: "Delete Lead" })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    const deleteDone = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        response.url().includes(`/crm/v2.2/Leads/${recordId}`) &&
        response.ok(),
    );
    await more.click();
    await menu.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await deleteDone;
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    await expect(page.getByRole("link", { name: deletedLabel })).toHaveCount(0);
    await expect.poll(async () => Number(await totalValue.innerText())).toBe(totalBefore - 1);
    await page.goto(moduleRecordPath(org.slug, LEADS_MODULE, recordId));
    await expect(page.getByText(/could not be found/i)).toBeVisible();
    ignoreFailedResponses(pageErrors, [404]);
    await expectNoA11yViolations(page);
  });

  test("More Options delete menu row matches visual layout at 1470×835", async ({
    page,
  }, testInfo) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openFirstLeadFromList(page, org.slug);
    await page.evaluate(() => document.fonts.ready);
    const header = page.locator("[data-record-header]");
    const more = header.getByRole("button", { name: "More Options" });
    await more.focus();
    await page.keyboard.press("ArrowDown");
    const menu = page.getByRole("menu", { name: "More Options" });
    const popover = menu.locator("..");
    await expect(popover).toHaveCSS("width", "217px");
    await expect(popover).toHaveCSS("border-radius", "4px");
    await expect(popover).toHaveCSS("border-color", "rgb(206, 208, 225)");
    const item = menu.getByRole("menuitem", { name: "Delete" });
    const itemBox = requireBox(await item.boundingBox(), "Delete menu row");
    const popBox = requireBox(await popover.boundingBox(), "menu popover");
    expectEdge(itemBox.height, 30);
    expect(Math.abs(itemBox.width - 203.5)).toBeLessThanOrEqual(1);
    expect(Math.abs(itemBox.x - popBox.x - 6.5)).toBeLessThanOrEqual(1);
    expect(itemBox.y - popBox.y).toBe(6);
    await expect(item).toHaveCSS("background-color", "rgb(240, 244, 252)");
    await expect(item).toHaveCSS("padding-left", "10.25px");
    await expectType(page, item, "--text-md", "--font-weight-normal");
    const screenshotPath = testInfo.outputPath("leads-detail-more-options-delete.png");
    await popover.screenshot({ path: screenshotPath });
    const scratch = process.env.PAPERCLIP_RUN_SCRATCH_DIR;
    if (scratch) {
      await mkdir(scratch, { recursive: true });
      await popover.screenshot({
        path: join(scratch, "leads-detail-more-options-delete.png"),
      });
    }
  });
});
