import { signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";
import { expectType } from "./support/typography";

test.use({ viewport: { width: 1470, height: 835 } });
test.describe.configure({ mode: "serial" });

type ElementBox = NonNullable<
  Awaited<ReturnType<import("@playwright/test").Locator["boundingBox"]>>
>;

function requireBox(box: ElementBox | null, label = "element"): ElementBox {
  if (!box) throw new Error(`Expected ${label} box.`);
  return box;
}

function expectEdge(value: number, expected: number, tolerance = 1) {
  expect(Math.abs(value - expected)).toBeLessThanOrEqual(tolerance);
}

function recordIdFromUrl(url: string, base?: string): string {
  const id = new URL(url, base ?? "http://localhost").pathname.split("/").pop();
  if (!id) throw new Error("Expected record id in URL.");
  return id;
}

async function openFirstLead(
  page: import("@playwright/test").Page,
  orgSlug: string,
): Promise<{ recordId: string }> {
  const listUrl = `${moduleListDefaultPath(orgSlug, LEADS_MODULE)}?per_page=10&page=1`;
  await page.goto(listUrl);
  await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
  const rows = page.locator("table tbody tr");
  await expect(rows.nth(1)).toBeVisible();
  const link = rows.first().getByRole("link").first();
  const href = await link.getAttribute("href");
  if (!href) throw new Error("Expected record link href.");
  await link.click();
  await expect(page.locator("[data-record-frame]")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return { recordId: recordIdFromUrl(page.url()) };
}

test("related-list rail preference persists across reload and record navigation", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const first = await openFirstLead(page, org.slug);

  await page.getByRole("button", { name: "Hide Related List" }).click();
  await expect(page.locator("[data-record-rail]")).toHaveCount(0);

  await page.reload();
  await expect(page.locator("[data-record-frame]")).toBeVisible();
  await expect(page.locator("[data-record-rail]")).toHaveCount(0);

  const nextLink = page.getByRole("link", { name: "Next Record" });
  await expect(nextLink).toBeVisible();
  const nextHref = await nextLink.getAttribute("href");
  if (!nextHref) throw new Error("Expected Next Record href.");
  const nextRecordId = recordIdFromUrl(nextHref, page.url());
  expect(nextRecordId).not.toBe(first.recordId);
  await Promise.all([
    page.waitForURL((url) => url.pathname.split("/").pop() === nextRecordId),
    nextLink.click(),
  ]);
  await expect(page.locator("[data-record-frame]")).toBeVisible();
  expect(recordIdFromUrl(page.url())).toBe(nextRecordId);
  await expect(page.locator("[data-record-rail]")).toHaveCount(0);

  await page.getByRole("button", { name: "Show Related List" }).click();
  await expect(page.locator("[data-record-rail]")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("[data-record-rail]")).toHaveCount(1);
});

test("lead record visual layout matches spec with rail shown and hidden at 1470×835", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await openFirstLead(page, org.slug);

  const frame = page.locator("[data-record-frame]");
  const rail = frame.locator("[data-record-rail]");
  const tabRow = frame.locator("[data-record-tab-row]");
  const scroller = frame.locator("[data-record-scroller]");
  const businessCard = frame.getByRole("region", { name: "Business card" });

  // Canvas and tab row — rail shown (record-detail.md › Visual layout).
  const railBox = requireBox(await rail.boundingBox(), "related-list rail");
  expectEdge(railBox.x, 320);
  expectEdge(railBox.width, 220);
  const canvasLeftShown = railBox.x + railBox.width;
  expectEdge(canvasLeftShown, 540);

  const toggleShown = frame.getByRole("button", { name: "Hide Related List" });
  await expect(toggleShown).toHaveAttribute("aria-pressed", "true");
  const toggleShownBox = requireBox(await toggleShown.boundingBox(), "rail toggle (shown)");
  expectEdge(toggleShownBox.width, 36);
  expectEdge(toggleShownBox.height, 36);
  expectEdge(toggleShownBox.x, 552);
  expectEdge(toggleShownBox.y, 137);
  await expect(toggleShown).toHaveCSS("background-color", "rgb(223, 228, 239)");

  const tabsShown = frame.getByRole("tablist", { name: "Record detail" });
  const tabsShownBox = requireBox(await tabsShown.boundingBox(), "outer tab pill (shown)");
  expectEdge(tabsShownBox.x, 600);
  expectEdge(tabsShownBox.y, 137);
  expectEdge(tabsShownBox.width, 222.5);
  expectEdge(tabsShownBox.height, 37);

  const overviewShown = tabsShown.getByRole("tab", { name: "Overview" });
  const overviewShownBox = requireBox(await overviewShown.boundingBox(), "Overview tab (shown)");
  expectEdge(overviewShownBox.x, 604);
  expectEdge(overviewShownBox.width, 108);
  expectEdge(overviewShownBox.height, 29);
  expectEdge(overviewShownBox.y, 141);
  await expect(overviewShown).toHaveCSS("background-color", "rgb(235, 237, 255)");
  await expect(overviewShown).toHaveCSS("border-color", "rgb(163, 172, 255)");
  await expectType(page, overviewShown, "--text-lg", "--font-weight-semibold");

  const businessShownBox = requireBox(await businessCard.boundingBox(), "business card (shown)");
  expectEdge(businessShownBox.x, 552);
  expectEdge(businessShownBox.x + businessShownBox.width, 1458);
  expectEdge(businessShownBox.width, 906);

  const scrollerShownBox = requireBox(await scroller.boundingBox(), "scroller (shown)");
  expectEdge(scrollerShownBox.x, canvasLeftShown);

  // Hidden-rail layout — same spec table, rail hidden.
  await toggleShown.click();
  await expect(rail).toHaveCount(0);

  const toggleHidden = frame.getByRole("button", { name: "Show Related List" });
  await expect(toggleHidden).toHaveAttribute("aria-pressed", "false");
  const toggleHiddenBox = requireBox(await toggleHidden.boundingBox(), "rail toggle (hidden)");
  expectEdge(toggleHiddenBox.width, 36);
  expectEdge(toggleHiddenBox.height, 36);
  expectEdge(toggleHiddenBox.x, 332);
  expectEdge(toggleHiddenBox.y, 137.5);
  await expect(toggleHidden).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(toggleHidden).toHaveCSS("border-width", "1px");
  await expect(toggleHidden).toHaveCSS("border-color", "rgb(226, 231, 238)");

  const tabsHiddenBox = requireBox(await tabsShown.boundingBox(), "outer tab pill (hidden)");
  expectEdge(tabsHiddenBox.x, 380);
  expectEdge(tabsHiddenBox.y, 136);
  expectEdge(tabsHiddenBox.width, 222.5);
  expectEdge(tabsHiddenBox.height, 37);
  expectEdge(toggleHiddenBox.x + toggleHiddenBox.width + 12, tabsHiddenBox.x);

  const overviewHiddenBox = requireBox(await overviewShown.boundingBox(), "Overview tab (hidden)");
  expectEdge(overviewHiddenBox.x, 384);
  expectEdge(overviewHiddenBox.width, 108);
  expectEdge(overviewHiddenBox.height, 29);
  expectEdge(overviewHiddenBox.y - tabsHiddenBox.y, 4);
  await expect(overviewShown).toHaveCSS("background-color", "rgb(235, 237, 255)");
  await expect(overviewShown).toHaveCSS("border-color", "rgb(163, 172, 255)");

  const scrollerHiddenBox = requireBox(await scroller.boundingBox(), "scroller (hidden)");
  expectEdge(scrollerHiddenBox.x, 320);

  const businessHiddenBox = requireBox(await businessCard.boundingBox(), "business card (hidden)");
  expectEdge(businessHiddenBox.x, 332);
  expectEdge(businessHiddenBox.x + businessHiddenBox.width, 1458);
  expectEdge(businessHiddenBox.width, 1126);

  const label = businessCard.locator(".detail-field-label").first();
  const value = businessCard.locator(".detail-field-value").first();
  const labelBox = requireBox(await label.boundingBox(), "business label");
  const valueBox = requireBox(await value.boundingBox(), "business value");
  expectEdge(labelBox.x + labelBox.width, businessHiddenBox.x + 173.5);
  expectEdge(valueBox.x, businessHiddenBox.x + 219);

  const tabRowBox = requireBox(await tabRow.boundingBox(), "tab row");
  expectEdge(toggleHiddenBox.x - tabRowBox.x, 12);
});
