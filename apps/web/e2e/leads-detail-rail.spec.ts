import { signUpNewUser } from "./support/auth";
import { LEADS_MODULE, moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test.use({ viewport: { width: 1470, height: 835 } });

async function openFirstLead(
  page: import("@playwright/test").Page,
  orgSlug: string,
): Promise<{ recordId: string }> {
  await page.goto(moduleListDefaultPath(orgSlug, LEADS_MODULE));
  await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
  const link = page.locator("table tbody tr").first().getByRole("link").first();
  const href = await link.getAttribute("href");
  if (!href) throw new Error("Expected record link href.");
  const match = href.match(/\/([^/]+)$/);
  const recordId = match?.[1];
  if (!recordId) throw new Error("Expected record id in href.");
  await link.click();
  await expect(page.locator("[data-record-frame]")).toBeVisible();
  return { recordId };
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
  if (await nextLink.isVisible()) {
    await nextLink.click();
    await expect(page.locator("[data-record-rail]")).toHaveCount(0);
  } else {
    await page.goto(moduleRecordPath(org.slug, LEADS_MODULE, first.recordId));
    await expect(page.locator("[data-record-rail]")).toHaveCount(0);
  }

  await page.getByRole("button", { name: "Show Related List" }).click();
  await expect(page.locator("[data-record-rail]")).toHaveCount(1);
  await page.reload();
  await expect(page.locator("[data-record-rail]")).toHaveCount(1);
});

test("hidden-rail layout widens overview cards on a lead record", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await openFirstLead(page, org.slug);
  await page.getByRole("button", { name: "Hide Related List" }).click();

  const frame = page.locator("[data-record-frame]");
  const businessCard = frame.getByRole("region", { name: "Business card" });
  const businessBox = await businessCard.boundingBox();
  if (!businessBox) throw new Error("Expected business card box.");
  expect(Math.abs(businessBox.width - 1126)).toBeLessThanOrEqual(2);

  const label = businessCard.locator(".detail-field-label").first();
  const value = businessCard.locator(".detail-field-value").first();
  const labelBox = await label.boundingBox();
  const valueBox = await value.boundingBox();
  if (!labelBox || !valueBox) throw new Error("Expected field boxes.");
  expect(Math.abs(labelBox.x + labelBox.width - businessBox.x - 173.5)).toBeLessThanOrEqual(1);
  expect(Math.abs(valueBox.x - businessBox.x - 219)).toBeLessThanOrEqual(1);
});
