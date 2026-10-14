import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import {
  moduleListDefaultPath,
  moduleRecordClonePath,
  moduleRecordEditPath,
  moduleRecordPath,
} from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const MODULES = ["Contacts", "Accounts", "Deals"] as const;

async function firstRecordId(page: Page, slug: string, tab: string) {
  await page.goto(moduleListDefaultPath(slug, tab));
  const links = page.locator(`a[href^="/crm/${slug}/tab/${tab}/"]`);
  let id = "";
  await expect
    .poll(async () => {
      const hrefs = await links.evaluateAll((items) =>
        items.map((link) => link.getAttribute("href") ?? ""),
      );
      id = hrefs.map((href) => href.split("/").pop() ?? "").find((v) => /^\d+$/.test(v)) ?? "";
      return id;
    })
    .not.toBe("");
  return id;
}

async function recordCount(page: Page, slug: string, tab: string) {
  const response = await page.request.post(
    `/crm/v2.2/${tab}/actions/count?cvid=all-${tab.toLowerCase()}`,
    {
      data: {},
      headers: { "X-CRM-ORG": slug, Origin: new URL(page.url()).origin },
    },
  );
  expect(response.status()).toBe(200);
  return ((await response.json()) as { count: number }).count;
}

for (const tab of MODULES) {
  test(`${tab} organizations isolate list rows, counts and record routes`, async ({
    page,
    browser,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const orgA = await createOrganization(page);
    const recordId = await firstRecordId(page, orgA.slug, tab);
    const countA = await recordCount(page, orgA.slug, tab);
    expect(countA).toBeGreaterThan(0);

    const context = await browser.newContext();
    const other = await context.newPage();
    try {
      await signUpNewUser(other);
      const orgB = await createOrganization(other);

      // Organization B cannot read organization A's data.
      const crossRead = await other.request.get(`/crm/v2.2/${tab}/${recordId}`, {
        headers: { "X-CRM-ORG": orgA.slug },
      });
      expect(crossRead.status()).toBe(404);

      // Its own list never links to A's record; the count only covers its own records.
      await other.goto(moduleListDefaultPath(orgB.slug, tab));
      const ownId = await firstRecordId(other, orgB.slug, tab);
      expect(ownId).not.toBe("");
      await expect(other.locator(`a[href*="${orgA.slug}"]`)).toHaveCount(0);
      expect(await recordCount(other, orgB.slug, tab)).toBeGreaterThan(0);

      // A's list URL, detail, edit and clone URLs are not found for B.
      for (const path of [
        moduleListDefaultPath(orgA.slug, tab),
        moduleRecordPath(orgA.slug, tab, recordId),
        moduleRecordEditPath(orgA.slug, tab, recordId),
        moduleRecordClonePath(orgA.slug, tab, recordId),
      ]) {
        await other.goto(path);
        await expect(other.getByRole("heading", { name: "404 - Not Found" })).toBeVisible();
        await expect(other.getByRole("table")).toHaveCount(0);
        await expect(other.locator("[data-record-header]")).toHaveCount(0);
      }
      ignoreFailedResponses(pageErrors, [404]);
    } finally {
      await context.close();
    }

    // Organization A's own user still sees the record.
    expect(await recordCount(page, orgA.slug, tab)).toBe(countA);
    await page.goto(moduleRecordPath(orgA.slug, tab, recordId));
    await expect(page.locator("[data-record-header]")).toBeVisible();
  });
}
